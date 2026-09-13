import { useState, useEffect } from 'react';

export function Player({ position, direction = 'south', equippedCosmetics = {} }) { 
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 9);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const frameStr = frame.toString().padStart(3, '0');
  const spriteSrc = `/assets/sprites/player/idle/${direction}/frame_${frameStr}.png`;

  return (
    <div className="player" style={{ left: position.x, top: position.y }} aria-label="The player character">
      <span className="player-shadow" />
      {equippedCosmetics.aura && <span className={`player-aura ${equippedCosmetics.aura}`} />}
      <img src={spriteSrc} alt="Player sprite" style={{ position: 'absolute', top: -4, left: -2, width: 32, height: 32, imageRendering: 'pixelated', zIndex: 10 }} />
      {/* Kept existing cosmetics to preserve game logic, even if visual alignment is no longer perfect */}
      <span className={`player-hood ${equippedCosmetics.head || ''}`} style={{display: 'none'}} />
      <span className={`player-face ${equippedCosmetics.head || ''}`} style={{display: 'none'}} />
      <span className={`player-cloak ${equippedCosmetics.cloak || ''}`} style={{display: 'none'}} />
      {equippedCosmetics.armor && <span className={`player-armor ${equippedCosmetics.armor}`} style={{display: 'none'}} />}
    </div>
  ) 
}
