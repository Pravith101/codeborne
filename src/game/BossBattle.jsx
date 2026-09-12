import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import { processQuestEvent } from './questLogic';

export function BossBattle({ open, onClose, bossName = 'Loop Warden', onProfileUpdate }) {
  const [boss, setBoss] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [victory, setVictory] = useState(false);
  
  const timerRef = useRef(null);
  const activeChallenge = challenges[currentChallengeIndex];

  useEffect(() => {
    if (!open) {
      // Reset state on close
      setResult(null);
      setVictory(false);
      setCode('');
      setTimeLeft(30);
      return;
    }

    const initBattle = async () => {
      try {
        setLoading(true);
        // Fetch Boss
        const { data: bData, error: bErr } = await supabase.from('bosses').select('*').eq('name', bossName).single();
        if (bErr) throw bErr;
        setBoss(bData);
        setMaxHp(bData.max_hp);

        // Fetch Challenges
        const { data: cData, error: cErr } = await supabase.from('coding_challenges').select('*').eq('boss_id', bData.id).order('created_at', { ascending: true });
        if (cErr) throw cErr;
        setChallenges(cData);

        // Start Battle
        const { data: hpData, error: hpErr } = await supabase.rpc('start_boss_battle', { p_boss_id: bData.id });
        if (hpErr) throw hpErr;
        
        setHp(hpData);
        if (hpData === 0) {
          setVictory(true);
        } else {
          setTimeLeft(30);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initBattle();
  }, [open, bossName]);

  const submitAnswer = useCallback(async (answer) => {
    try {
      setLoading(true);
      const { data, error: rpcErr } = await supabase.rpc('submit_battle_answer', {
        p_boss_id: boss.id,
        p_challenge_id: activeChallenge.id,
        p_answer: answer
      });
      if (rpcErr) throw rpcErr;

      setResult({ damage: data.damage, tier: data.tier });
      setHp(data.remaining_hp);

      if (data.defeated) {
        setVictory(true);
        if (onProfileUpdate) onProfileUpdate();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [boss, activeChallenge, onProfileUpdate]);

  // Timer Effect
  useEffect(() => {
    if (open && !loading && !result && !victory && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerRef.current);
    } else if (open && timeLeft === 0 && !result && !victory) {
      if (!loading && activeChallenge) {
        submitAnswer('');
      }
    }
  }, [open, loading, result, victory, timeLeft, activeChallenge, submitAnswer]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (loading || result || victory || !activeChallenge) return;
    
    // Trigger game progression for quests silently in background
    processQuestEvent('code_submitted', code).then(didComplete => {
      if (didComplete && onProfileUpdate) {
        onProfileUpdate(); // Update HUD (XP/Coins)
      }
    });

    await submitAnswer(code);
  };

  const handleNextChallenge = () => {
    setResult(null);
    setCode('');
    setTimeLeft(30);
    // Cycle to next challenge
    setCurrentChallengeIndex((prev) => (prev + 1) % challenges.length);
  };

  const hpPercent = Math.max(0, (hp / maxHp) * 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="boss-battle-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="boss-battle-panel" initial={{ y: 20, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, scale: 0.95, opacity: 0 }} role="dialog">
            {error && <div className="boss-error">{error}</div>}
            
            {boss && (
              <div className="boss-header">
                <div className="boss-name-wrap">
                  <h2>{boss.name}</h2>
                  <span className="boss-region">{boss.region}</span>
                </div>
                <div className="boss-hp-bar">
                  <div className="boss-hp-fill" style={{ width: `${hpPercent}%` }} />
                  <span className="boss-hp-text">{hp} / {maxHp}</span>
                </div>
              </div>
            )}

            {victory ? (
              <div className="boss-victory">
                <h3 className="victory-title">BOSS DEFEATED</h3>
                <p className="victory-subtitle">{boss?.name.toUpperCase()} FALLS</p>
                <div className="victory-rewards">
                  <span>+{boss?.reward_xp} XP</span>
                  <span>+{boss?.reward_coins} Coins</span>
                </div>
                <button onClick={onClose} className="victory-btn">Return to World</button>
              </div>
            ) : (
              <div className="boss-arena">
                {!activeChallenge ? (
                  <div className="boss-loading">Summoning Trial...</div>
                ) : (
                  <>
                    <div className="challenge-header">
                      <div className="challenge-title">
                        <h4>CODING TRIAL</h4>
                        <span>{activeChallenge.title}</span>
                      </div>
                      <div className={`challenge-timer ${timeLeft <= 5 ? 'urgent' : ''}`}>
                        TIME <b>{timeLeft}</b>
                      </div>
                    </div>
                    
                    <p className="challenge-prompt">{activeChallenge.prompt}</p>
                    
                    <form onSubmit={handleFormSubmit} className="challenge-form">
                      <textarea 
                        className="challenge-editor" 
                        value={code} 
                        onChange={e => setCode(e.target.value)}
                        placeholder="# Write Python code here..."
                        disabled={loading || result !== null}
                        autoFocus
                      />
                      
                      {!result ? (
                        <div className="challenge-actions">
                          <button type="submit" disabled={loading || !code.trim() || timeLeft === 0} className="challenge-submit">
                            [ SUBMIT SOLUTION ]
                          </button>
                          <button type="button" onClick={onClose} className="challenge-flee">Flee</button>
                        </div>
                      ) : (
                        <div className="challenge-result">
                          <div className={`result-tier tier-${result.tier.toLowerCase()}`}>{result.tier}</div>
                          <div className="result-damage">DAMAGE DEALT: {result.damage}</div>
                          <button type="button" onClick={handleNextChallenge} className="challenge-next">
                            Next Trial ↵
                          </button>
                        </div>
                      )}
                    </form>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
