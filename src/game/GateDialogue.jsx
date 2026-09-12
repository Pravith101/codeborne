import { AnimatePresence, motion } from 'framer-motion'

export function GateDialogue({ open, onClose, profile }) {
  if (!profile) return null;

  const logic = profile.logic ?? 1;
  const isUnlocked = logic >= 3;

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="dialogue-backdrop" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          <motion.section 
            className="dialogue gate-dialogue" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="gate-name" 
            initial={{ opacity: 0, y: 18, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            <div className="dialogue-content">
              <p id="gate-name">Ancient Gate <small>Sealed Passage</small></p>
              
              {!isUnlocked ? (
                <>
                  <blockquote>“Beyond this gate lies the Variable Plains.”</blockquote>
                  <div className="gate-reqs">
                    <span className="gate-req-label">Requirement:</span>
                    <span className="gate-req-val">LOGIC 3</span>
                    <span className="gate-req-label">Current:</span>
                    <span className="gate-req-val">LOGIC {logic}</span>
                  </div>
                  <div className="gate-status locked">[LOCKED]</div>
                  <button type="button" autoFocus onClick={onClose}>Depart <span aria-hidden="true">↵</span></button>
                </>
              ) : (
                <>
                  <blockquote>“Your understanding is strong enough.”</blockquote>
                  <div className="gate-status unlocked">[ENTER VARIABLE PLAINS]</div>
                  <button type="button" autoFocus onClick={onClose}>Depart <span aria-hidden="true">↵</span></button>
                </>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
