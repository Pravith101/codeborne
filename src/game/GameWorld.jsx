import { useCallback, useEffect, useRef, useState } from 'react'
import { FLOWERS, GATE, NPC, OBSTACLES, ROCKS, SHRUBS, START_POSITION, TREES, WORLD } from './worldData'
import { Player } from './Player'
import { Npc } from './Npc'

const speed = 260
const moveKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'])

function isBlocked(x, y) {
  const inset = 7
  const player = { x: x + inset, y: y + inset, width: WORLD.playerSize - inset * 2, height: WORLD.playerSize - inset * 2 }
  return OBSTACLES.some((obstacle) => player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x && player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y)
}

function Building({ x, y, variant = '' }) { return <div className={`building ${variant}`} style={{ left: x, top: y }} aria-hidden="true"><i className="roof" /><i className="chimney" /><i className="wall"><b /><b /></i><i className="door" /></div> }
function Tree({ x, y, variant }) { return <div className={`tree tree-${variant}`} style={{ left: x, top: y }} aria-hidden="true"><i /><b /><em /></div> }
function Rock({ x, y }) { return <div className="rock" style={{ left: x, top: y }} aria-hidden="true"><i /></div> }
function Flower({ x, y, variant }) { return <span className={`flower flower-${variant}`} style={{ left: x, top: y }} aria-hidden="true" /> }
function Shrub({ x, y, variant }) { return <span className={`shrub shrub-${variant}`} style={{ left: x, top: y }} aria-hidden="true" /> }
function Campfire() { return <div className="campfire" style={{ left: 1170, top: 790 }} aria-label="Campfire"><i /><b /><span /><em /></div> }
function Gate() { return <div className="gate-area" style={{ left: GATE.x, top: GATE.y }} aria-label="Locked gate to an unknown region"><div className="gate-pillars"><i /><i /></div><div className="gate-bars"><b /><b /><b /><b /></div><span>SEALED</span><small>Syntax Wilds</small></div> }

export function GameWorld({ onInteract, dialogueOpen }) {
  const viewportRef = useRef(null)
  const keysRef = useRef(new Set())
  const positionRef = useRef(START_POSITION)
  const lastFrame = useRef(null)
  const [playerPosition, setPlayerPosition] = useState(START_POSITION)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const isNearby = Math.hypot(playerPosition.x - NPC.x, playerPosition.y - NPC.y) < 105
  const cameraX = Math.max(0, Math.min(WORLD.width - viewport.width, playerPosition.x - viewport.width / 2 + WORLD.playerSize / 2))
  const cameraY = Math.max(0, Math.min(WORLD.height - viewport.height, playerPosition.y - viewport.height / 2 + WORLD.playerSize / 2))

  const resize = useCallback(() => { if (viewportRef.current) setViewport({ width: viewportRef.current.clientWidth, height: viewportRef.current.clientHeight }) }, [])
  useEffect(() => { resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [resize])

  useEffect(() => {
    const down = (event) => { const key = event.key.toLowerCase(); if (moveKeys.has(key)) { event.preventDefault(); keysRef.current.add(key) } if (key === 'e' && isNearby && !dialogueOpen) { event.preventDefault(); onInteract() } }
    const up = (event) => keysRef.current.delete(event.key.toLowerCase())
    const clear = () => keysRef.current.clear()
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [dialogueOpen, isNearby, onInteract])

  useEffect(() => {
    let frame
    const tick = (now) => {
      const previous = lastFrame.current ?? now
      const delta = Math.min((now - previous) / 1000, 0.05)
      lastFrame.current = now
      if (!dialogueOpen && keysRef.current.size) {
        const left = keysRef.current.has('a') || keysRef.current.has('arrowleft'); const right = keysRef.current.has('d') || keysRef.current.has('arrowright'); const up = keysRef.current.has('w') || keysRef.current.has('arrowup'); const down = keysRef.current.has('s') || keysRef.current.has('arrowdown')
        const rawX = (right ? 1 : 0) - (left ? 1 : 0); const rawY = (down ? 1 : 0) - (up ? 1 : 0); const magnitude = Math.hypot(rawX, rawY) || 1
        const current = positionRef.current; const x = Math.max(0, Math.min(WORLD.width - WORLD.playerSize, current.x + rawX * speed * delta / magnitude)); const y = Math.max(0, Math.min(WORLD.height - WORLD.playerSize, current.y + rawY * speed * delta / magnitude)); const next = { x: !isBlocked(x, current.y) ? x : current.x, y: !isBlocked(current.x, y) ? y : current.y }
        if (next.x !== current.x || next.y !== current.y) { positionRef.current = next; setPlayerPosition(next) }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [dialogueOpen])

  return <div ref={viewportRef} className="game-viewport" tabIndex="0" aria-label="Starting Village game world. Use WASD or arrow keys to move. Press E to interact with Eldra."><div className="world" style={{ width: WORLD.width, height: WORLD.height, transform: `translate3d(${-cameraX}px, ${-cameraY}px, 0)` }}><div className="world-label"><span>01</span><div><b>Starting Village</b><small>The Ashen Clearing</small></div></div><div className="path path-main" /><div className="path path-west" /><div className="path path-south" /><div className="path path-north" /><div className="pond" /><div className="fog fog-one" /><div className="fog fog-two" /><Building x={470} y={355} /><Building x={1015} y={520} variant="building-tall" /><Building x={1695} y={390} variant="building-wide" /><Building x={255} y={1050} variant="building-small" />{FLOWERS.map(([x, y], index) => <Flower key={`${x}-${y}`} x={x} y={y} variant={index % 3} />)}{SHRUBS.map(([x, y], index) => <Shrub key={`${x}-${y}`} x={x} y={y} variant={index % 2} />)}{TREES.map(([x, y], index) => <Tree key={`${x}-${y}`} x={x} y={y} variant={index % 3} />)}{ROCKS.map(([x, y]) => <Rock key={`${x}-${y}`} x={x} y={y} />)}<Campfire /><Gate /><Npc npc={NPC} isNearby={isNearby && !dialogueOpen} /><Player position={playerPosition} /></div></div>
}
