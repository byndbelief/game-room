import React from 'react';
import { GamePreview } from './GamePreview.jsx';
export function GameRow({ kind = 'battleship', title, vs, sub, pill, progress, mine = false, over = false, href = '#', style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <a href={href} {...rest} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '8px 12px 8px 8px', background: 'var(--r4-panel)', border: '1.5px solid ' + (mine ? 'var(--gold)' : 'var(--r4-line)'), borderRadius: 16, color: 'var(--r4-ink)', textDecoration: 'none',
      boxShadow: (mine ? 'inset 4px 0 0 var(--gold)' : '') + (h ? (mine ? ', ' : '') + '0 6px 16px #0002' : '') || 'none', transform: h ? 'translateX(3px)' : 'none', transition: 'transform .12s, box-shadow .12s', opacity: over ? .75 : 1, ...style }}>
      <GamePreview kind={kind} ratio="auto" radius={8} style={{ width: 80, height: 50, fontSize: 22 }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>{title}</strong> {vs ? <span style={{ fontSize: 13 }}>{vs}</span> : null}</span>
        {sub ? <span style={{ color: 'var(--r4-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span> : null}
        {progress != null ? <span style={{ display: 'block', height: 4, borderRadius: 99, background: 'var(--r4-panel-2)', overflow: 'hidden', maxWidth: 220, marginTop: 2 }}><i style={{ display: 'block', height: '100%', width: Math.round(Math.max(0, Math.min(1, progress)) * 100) + '%', background: 'var(--teal)', borderRadius: 99 }}></i></span> : null}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>{pill}</span>
    </a>
  );
}
