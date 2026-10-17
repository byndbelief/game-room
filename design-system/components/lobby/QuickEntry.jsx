import React from 'react';
export function QuickEntry({ icon, title, sub, href = '#', style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <a href={href} {...rest} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 16, background: 'var(--r4-panel)', border: '1.5px solid ' + (h ? 'var(--teal)' : 'var(--r4-line)'), color: 'var(--r4-ink)', textDecoration: 'none', ...style }}>
      <span aria-hidden="true" style={{ width: 44, height: 44, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 12, background: '#ffffff0c', fontSize: 20 }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}><strong>{title}</strong>{sub ? <span style={{ color: 'var(--r4-muted)', fontSize: 13 }}>{sub}</span> : null}</span>
      <span aria-hidden="true" style={{ fontSize: 26, color: 'var(--r4-muted)' }}>›</span>
    </a>
  );
}
