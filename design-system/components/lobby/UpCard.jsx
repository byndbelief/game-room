import React from 'react';
import { GamePreview } from './GamePreview.jsx';
export function UpCard({ kind = 'battleship', title, vs, sub, clock, cta = 'Play', href = '#', style, ...rest }) {
  return (
    <a href={href} {...rest} style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'var(--r4-panel)', border: '2px solid var(--gold)', boxShadow: '0 0 0 2px var(--gold)', color: 'var(--r4-ink)', textDecoration: 'none', minWidth: 0, ...style }}>
      <GamePreview kind={kind} />
      <span style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <strong>{title}</strong>
        {vs ? <span style={{ fontSize: 13 }}>{vs}</span> : null}
        {sub ? <span style={{ color: 'var(--r4-muted)', fontSize: 13 }}>{sub}</span> : null}
        {clock ? <span style={{ fontSize: 13, color: '#FF8A7A', fontWeight: 700 }}>{clock}</span> : null}
        <span style={{ marginTop: 6, alignSelf: 'flex-start', background: 'var(--pal)', color: 'var(--pal-ink)', fontWeight: 700, borderRadius: 99, padding: '4px 14px', boxShadow: '0 8px 24px color-mix(in srgb, var(--pal) 30%, transparent)' }}>{cta} ›</span>
      </span>
    </a>
  );
}
