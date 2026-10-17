import React from 'react';
import { GamePreview } from './GamePreview.jsx';
export function GameCard({ kind = 'battleship', icon, name, blurb, who, checked = false, onClick, style }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', flexDirection: 'column', padding: 0, textAlign: 'left', borderRadius: 18, overflow: 'hidden', background: 'var(--r4-panel)', border: '2px solid ' + (checked ? 'var(--teal)' : 'var(--r4-line)'), color: 'var(--r4-ink)', font: 'inherit', fontWeight: 400, cursor: 'pointer',
        transform: h ? 'translateY(-3px)' : 'none', boxShadow: checked ? '0 0 0 3px #3DD6C655, 0 10px 24px #0006' : h ? '0 10px 24px #0003' : 'none', transition: 'transform .15s, box-shadow .15s, border-color .15s', ...style }}>
      <GamePreview kind={kind}>{icon}</GamePreview>
      <span style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <strong>{name}</strong>
        {blurb ? <span style={{ color: 'var(--r4-muted)', fontSize: 13 }}>{blurb}</span> : null}
        {who ? <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--violet)' }}>{who}</span> : null}
      </span>
    </button>
  );
}
