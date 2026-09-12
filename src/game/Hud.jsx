export function Hud({ profile }) {
  const hp = profile?.hp ?? 100;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const coins = profile?.coins ?? 0;

  const xpRequired = Math.floor(100 * Math.pow(1.5, level - 1));
  const xpPercent = Math.min(100, Math.max(0, (xp / xpRequired) * 100));

  return (
    <aside className="hud" aria-label="Player status">
      <div className="hud-brand"><span>&lt;/&gt;</span> CODEBORNE</div>
      <div className="hud-rule" />
      <div className="hud-level"><span>LV</span><b>{level}</b><em>Novice</em></div>
      <div className="hud-meter">
        <div><span>HP</span><b>{hp} / 100</b></div>
        <div className="meter-track"><i className="hp-fill" style={{ width: `${Math.min(100, Math.max(0, hp))}%` }} /></div>
      </div>
      <div className="hud-meter">
        <div><span>XP</span><b>{xp} / {xpRequired}</b></div>
        <div className="meter-track"><i className="xp-fill" style={{ width: `${xpPercent}%` }} /></div>
      </div>
      <div className="hud-coins"><span aria-hidden="true">◉</span> <b>{coins}</b><small>Coins</small></div>
    </aside>
  );
}
