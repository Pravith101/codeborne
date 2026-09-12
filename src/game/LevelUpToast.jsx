import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function LevelUpToast({ level }) {
  const [show, setShow] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(level);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const prevLevel = useRef(level);

  useEffect(() => {
    if (level && prevLevel.current && level > prevLevel.current) {
      const diff = level - prevLevel.current;
      setDisplayLevel(level);
      setPointsAwarded(diff);
      setShow(true);
      
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    }
    prevLevel.current = level;
  }, [level]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="level-up-toast"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
        >
          <div className="level-up-title">LEVEL UP</div>
          <div className="level-up-val">LEVEL {displayLevel}</div>
          <div className="level-up-reward">+{pointsAwarded} ATTRIBUTE POINT{pointsAwarded > 1 ? 'S' : ''}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
