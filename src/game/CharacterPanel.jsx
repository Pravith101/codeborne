import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';

export function CharacterPanel({ open, onClose, profile, onProfileUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!profile) return null;

  const points = profile.attribute_points ?? 0;
  const attributes = [
    { name: 'logic', label: 'Logic', value: profile.logic ?? 1, desc: 'Conditions & problem solving' },
    { name: 'focus', label: 'Focus', value: profile.focus ?? 1, desc: 'Loops & sustained attention' },
    { name: 'wisdom', label: 'Wisdom', value: profile.wisdom ?? 1, desc: 'Concepts & understanding' },
    { name: 'mastery', label: 'Mastery', value: profile.mastery ?? 1, desc: 'Overall coding proficiency' }
  ];

  const handleSpendPoint = async (attrName) => {
    if (loading || points <= 0) return;
    try {
      setLoading(true);
      setError(null);
      const { error: rpcError } = await supabase.rpc('spend_attribute_point', { p_attribute_name: attrName });
      if (rpcError) throw rpcError;
      
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="char-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="char-panel"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            role="dialog"
            aria-label="Character Profile"
          >
            <div className="char-panel-header">
              <h2>Character Status</h2>
              <button onClick={onClose} aria-label="Close character panel">×</button>
            </div>
            
            <div className="char-panel-content">
              {error && <p className="char-error" role="alert">{error}</p>}
              
              <div className="char-overview">
                <div>
                  <span className="char-overview-label">Level</span>
                  <span className="char-overview-val">{profile.level ?? 1}</span>
                </div>
                <div>
                  <span className="char-overview-label">Unspent Points</span>
                  <span className={`char-overview-val ${points > 0 ? 'has-points' : ''}`}>{points}</span>
                </div>
              </div>

              <div className="char-attributes">
                <h3>Attributes</h3>
                <ul className="char-attr-list">
                  {attributes.map(attr => (
                    <li key={attr.name} className="char-attr-item">
                      <div className="char-attr-info">
                        <strong>{attr.label} <span>{attr.value}</span></strong>
                        <small>{attr.desc}</small>
                      </div>
                      {points > 0 && (
                        <button 
                          className="char-attr-add" 
                          onClick={() => handleSpendPoint(attr.name)}
                          disabled={loading}
                          title={`Increase ${attr.label}`}
                        >
                          +
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
