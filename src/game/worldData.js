export const WORLD = { width: 2400, height: 1500, playerSize: 38 }
export const START_POSITION = { x: 1050, y: 850 }
export const NPC = { id: 'eldra', name: 'Eldra', x: 1375, y: 755, size: 38 }
export const GATE = { x: 2180, y: 620, width: 92, height: 220 }
// Simple collision rectangles, intentionally small and easy to extend in later checkpoints.
export const OBSTACLES = [
  { x: 440, y: 285, width: 330, height: 250 }, { x: 1025, y: 380, width: 310, height: 230 }, { x: 1700, y: 255, width: 300, height: 220 }, { x: 175, y: 1040, width: 205, height: 170 }, { x: 2075, y: 490, width: 185, height: 410 },
  { x: 210, y: 255, width: 85, height: 92 }, { x: 320, y: 175, width: 75, height: 86 }, { x: 800, y: 195, width: 88, height: 96 }, { x: 1455, y: 220, width: 82, height: 95 }, { x: 1990, y: 1050, width: 90, height: 98 }, { x: 1490, y: 1190, width: 88, height: 94 }, { x: 465, y: 1250, width: 86, height: 90 }, { x: 845, y: 1130, width: 85, height: 90 }, { x: 1120, y: 1195, width: 96, height: 94 }, { x: 1835, y: 1145, width: 76, height: 83 },
  { x: 610, y: 810, width: 84, height: 70 }, { x: 1540, y: 890, width: 90, height: 70 },
]
export const TREES = [[210,255],[320,175],[800,195],[1455,220],[1990,1050],[1490,1190],[465,1250],[845,1130],[1120,1195],[1835,1145],[80,460],[2250,1120],[365,600],[700,1250],[1760,1320],[2220,235],[1080,113],[1390,1310]]
export const ROCKS = [[610,810],[1540,890],[780,700],[1260,1000],[330,930],[1930,760],[2070,1190]]
