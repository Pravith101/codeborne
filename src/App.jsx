import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthScreen } from './features/auth/AuthScreen'
import { useAuth } from './features/auth/useAuth'
import { supabaseConfigurationError } from './lib/supabaseClient'
import { Dialogue } from './game/Dialogue'
import { GateDialogue } from './game/GateDialogue'
import { GameWorld } from './game/GameWorld'
import { Hud } from './game/Hud'
import { QuestJournal } from './game/QuestJournal'
import { CharacterPanel } from './game/CharacterPanel'
import { LevelUpToast } from './game/LevelUpToast'
import { BossBattle } from './game/BossBattle'
import { LockedBossDialogue } from './game/LockedBossDialogue'
import './index.css'

function LoadingScreen({ message }) {
  return <main className="auth-shell"><div className="auth-stars" aria-hidden="true" /><section className="auth-panel auth-loading" aria-live="polite"><div className="auth-mark" aria-hidden="true">&lt;/&gt;</div><p className="auth-brand">CODEBORNE</p><p>{message}</p></section></main>
}

function Village({ profile, onLogout, onProfileUpdate }) {
  const [dialogueOpen, setDialogueOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [bossOpen, setBossOpen] = useState(false)
  const [lockedBossOpen, setLockedBossOpen] = useState(false)
  const [questOpen, setQuestOpen] = useState(false)
  const [charOpen, setCharOpen] = useState(false)
  const [logoutError, setLogoutError] = useState(null)
  
  const handleInteract = useCallback((target) => {
    if (target === 'npc') setDialogueOpen(true)
    else if (target === 'gate') setGateOpen(true)
    else if (target === 'boss') {
      if ((profile?.focus ?? 1) < 8) {
        setLockedBossOpen(true)
      } else {
        setBossOpen(true)
      }
    }
  }, [profile])
  
  const logout = async () => { try { setLogoutError(null); await onLogout() } catch (error) { setLogoutError(error.message) } }
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'q') {
        if (!dialogueOpen && !gateOpen && !bossOpen && !lockedBossOpen) setQuestOpen(prev => !prev);
      }
      if (key === 'c') {
        if (!dialogueOpen && !gateOpen && !bossOpen && !lockedBossOpen) setCharOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogueOpen, gateOpen, bossOpen, lockedBossOpen]);

  const anyDialogOpen = dialogueOpen || gateOpen || bossOpen || lockedBossOpen;

  return <main className="game-shell"><GameWorld onInteract={handleInteract} dialogueOpen={anyDialogOpen} /><Hud profile={profile} /><LevelUpToast level={profile?.level} /><button type="button" className="char-toggle-button" onClick={() => setCharOpen(true)}>Char (C)</button><button type="button" className="quest-toggle-button" onClick={() => setQuestOpen(true)}>Quests (Q)</button><button type="button" className="logout-button" onClick={logout}>Leave realm</button>{logoutError && <p className="logout-error" role="alert">{logoutError}</p>}<motion.div className="control-hint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}><span><kbd>WASD</kbd> Move</span><i /><span><kbd>E</kbd> Interact</span><i /><span><kbd>Q</kbd> Quests</span><i /><span><kbd>C</kbd> Character</span></motion.div><AnimatePresence>{!anyDialogOpen && <motion.p className="world-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>The village is quiet. A distant gate hums beyond the trees.</motion.p>}</AnimatePresence><Dialogue open={dialogueOpen} onClose={() => setDialogueOpen(false)} /><GateDialogue open={gateOpen} onClose={() => setGateOpen(false)} profile={profile} /><LockedBossDialogue open={lockedBossOpen} onClose={() => setLockedBossOpen(false)} profile={profile} /><BossBattle open={bossOpen} onClose={() => setBossOpen(false)} onProfileUpdate={onProfileUpdate} /><QuestJournal open={questOpen} onClose={() => setQuestOpen(false)} onTaskCompleted={onProfileUpdate} /><CharacterPanel open={charOpen} onClose={() => setCharOpen(false)} profile={profile} onProfileUpdate={onProfileUpdate} /></main>
}

function App() {
  const { profile, profileError, signOut, status, submitAuth, retryProfile } = useAuth()
  if (status === 'loading' || status === 'loading-profile') return <LoadingScreen message={status === 'loading' ? 'Listening for the old magic…' : 'Binding your character to the realm…'} />
  if (status === 'profile-error') return <main className="auth-shell"><div className="auth-stars" aria-hidden="true" /><section className="auth-panel auth-loading"><p className="auth-brand">CODEBORNE</p><p className="auth-feedback auth-error" role="alert">{profileError}</p><button className="auth-submit" type="button" onClick={retryProfile}>Try again</button></section></main>
  if (status === 'unauthenticated') return <AuthScreen onSubmit={submitAuth} configurationError={supabaseConfigurationError} />
  return <Village profile={profile} onLogout={signOut} onProfileUpdate={retryProfile} />
}
export default App
