import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Dialogue } from './game/Dialogue'
import { GameWorld } from './game/GameWorld'
import { Hud } from './game/Hud'
import './index.css'

function App() {
  const [dialogueOpen, setDialogueOpen] = useState(false)
  const openDialogue = useCallback(() => setDialogueOpen(true), [])
  return <main className="game-shell"><GameWorld onInteract={openDialogue} dialogueOpen={dialogueOpen} /><Hud /><motion.div className="control-hint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}><span><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Move</span><i /><span><kbd>E</kbd> Interact</span></motion.div><AnimatePresence>{!dialogueOpen && <motion.p className="world-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>The village is quiet. A distant gate hums beyond the trees.</motion.p>}</AnimatePresence><Dialogue open={dialogueOpen} onClose={() => setDialogueOpen(false)} /></main>
}
export default App
