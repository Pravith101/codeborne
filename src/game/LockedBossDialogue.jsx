import { AnimatePresence, motion } from 'framer-motion'

export function LockedBossDialogue({ open, onClose, profile }) {
  if (!profile) return null;
  const focus = profile.focus ?? 1;

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
            initial={{ opacity: 0, y: 18, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            <div className="dialogue-content">
              <p>Loop Warden</p>
              <blockquote>“The path ahead is beyond your current discipline.”</blockquote>
              <div className="gate-reqs">
                <span className="gate-req-label">Requirement:</span>
                <span className="gate-req-val">FOCUS 8</span>
                <span className="gate-req-label">Current:</span>
                <span className="gate-req-val">FOCUS {focus}</span>
              </div>
              <div className="gate-status locked">[LOCKED]</div>
              <button type="button" autoFocus onClick={onClose}>Close <span aria-hidden="true">↵</span></button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
