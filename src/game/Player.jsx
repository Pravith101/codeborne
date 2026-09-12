export function Player({ position, equippedCosmetics = {} }) { 
  return (
    <div className="player" style={{ left: position.x, top: position.y }} aria-label="The player character">
      <span className="player-shadow" />
      {equippedCosmetics.aura && <span className={`player-aura ${equippedCosmetics.aura}`} />}
      <span className={`player-hood ${equippedCosmetics.head || ''}`} />
      <span className={`player-face ${equippedCosmetics.head || ''}`} />
      <span className={`player-cloak ${equippedCosmetics.cloak || ''}`} />
      {equippedCosmetics.armor && <span className={`player-armor ${equippedCosmetics.armor}`} />}
    </div>
  ) 
}
