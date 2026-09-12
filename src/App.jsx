import { motion } from 'framer-motion'

const regions = [
  { number: 'I', name: 'The Syntax Wilds', lesson: 'First steps in Python', state: 'Awakening' },
  { number: 'II', name: 'The Logic Fen', lesson: 'Choices & conditions', state: 'Sealed' },
  { number: 'III', name: 'The Looping Hollows', lesson: 'Patterns & repetition', state: 'Sealed' },
]

const reveal = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

function RuneMark() { return <span className="rune-mark" aria-hidden="true">&lt;/&gt;</span> }

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-ash">
      <div className="atmosphere" aria-hidden="true" /><div className="grain" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <header className="flex items-center justify-between border-b border-bone/15 pb-5" aria-label="Codeborne introduction">
          <a className="brand" href="#top" aria-label="Codeborne home"><RuneMark /><span>CODEBORNE</span></a>
          <span className="hidden font-mono text-[0.66rem] uppercase tracking-[0.24em] text-ash/50 sm:block">Python learning RPG</span>
          <button className="menu-button" type="button" aria-label="Foundation preview menu"><span aria-hidden="true">Menu</span></button>
        </header>
        <section id="top" className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:py-20">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
            <motion.p variants={reveal} className="eyebrow"><span /> A realm written in Python</motion.p>
            <motion.h1 variants={reveal} className="title mt-6 max-w-3xl">Learn the language.<br /><em>Break the curse.</em></motion.h1>
            <motion.p variants={reveal} className="mt-7 max-w-xl text-base leading-7 text-ash/68 sm:text-lg">Codeborne turns your first lines of Python into a dark-fantasy journey. Every lesson opens a path. Every puzzle leaves a mark.</motion.p>
            <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center gap-5"><a className="primary-button" href="#realm">Enter the realm <span aria-hidden="true">→</span></a><a className="text-link" href="#realm">Explore the foundation <span aria-hidden="true">↓</span></a></motion.div>
          </motion.div>
          <motion.div className="relative mx-auto w-full max-w-md lg:max-w-none" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18, duration: 0.65, ease: 'easeOut' }}>
            <div className="sigil-frame" aria-label="An ancient Python sigil" role="img"><div className="sigil-ring ring-one" /><div className="sigil-ring ring-two" /><div className="sigil-core"><span>Py</span></div><i className="sigil-rune rune-a">{'{ }'}</i><i className="sigil-rune rune-b">:</i><i className="sigil-rune rune-c">()</i><i className="sigil-rune rune-d">=</i><div className="ember ember-one" /><div className="ember ember-two" /><div className="ember ember-three" /></div>
            <p className="mt-5 text-center font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ash/45">The first sigil awaits</p>
          </motion.div>
        </section>
        <section id="realm" className="border-t border-bone/15 py-8 sm:py-10" aria-labelledby="realm-heading">
          <div className="mb-6 flex items-end justify-between gap-6"><div><p className="eyebrow"><span /> A world of concepts</p><h2 id="realm-heading" className="section-title mt-3">The realm is stirring.</h2></div><p className="hidden max-w-xs text-right font-mono text-xs leading-5 text-ash/45 md:block">Your path begins in the Syntax Wilds.</p></div>
          <div className="grid gap-px overflow-hidden border border-bone/15 bg-bone/15 md:grid-cols-3">{regions.map((region, index) => <article className="region-card" key={region.number}><span className="font-mono text-xs text-ember">0{index + 1}</span><p className="mt-8 font-serif text-2xl text-bone">{region.name}</p><p className="mt-2 text-sm text-ash/55">{region.lesson}</p><div className="mt-8 flex items-center justify-between border-t border-bone/10 pt-4 font-mono text-[0.62rem] uppercase tracking-[0.17em] text-ash/45"><span>{region.number}</span><span className={index === 0 ? 'text-ember' : ''}>{region.state}</span></div></article>)}</div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-3 py-5 font-mono text-[0.63rem] uppercase tracking-[0.16em] text-ash/38"><span>Codeborne · Foundation build</span><span>Crafted for curious minds</span></footer>
      </div>
    </main>
  )
}
export default App
