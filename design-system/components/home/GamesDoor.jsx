import React from 'react';
export function GamesDoor({ title = 'games.r4box.com', desc, go = 'Enter the room →', games = [], href = '#', style }) {
  const [h, setH] = React.useState(false);
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 28, padding: 'clamp(22px, 4vw, 40px)', borderRadius: 28, overflow: 'hidden', background: 'var(--grad-door)', border: '1px solid ' + (h ? '#3DD6C680' : 'var(--r4-line)'), transform: h ? 'translateY(-2px)' : 'none', transition: 'border-color .2s, transform .2s', color: 'var(--r4-ink)', textDecoration: 'none', ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 300px at 0% 0%, #3DD6C622, transparent 60%), radial-gradient(500px 300px at 100% 100%, #FF5A4A1c, transparent 60%)', pointerEvents: 'none' }}></span>
      <div style={{ position: 'relative' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-.03em', margin: '0 0 10px' }}>{title}</h3>
        <p style={{ color: 'var(--r4-muted)', margin: '0 0 22px' }}>{desc}</p>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal)' }}>{go}</span>
      </div>
      <ul style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, alignContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
        {games.map((g, i) => <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: '#ffffff08', border: '1px solid #ffffff12', fontWeight: g.arcade ? 400 : 600, fontSize: 14, color: g.arcade ? 'var(--r4-muted)' : 'inherit' }}><span style={{ fontSize: 20, lineHeight: 1 }}>{g.icon}</span>{g.name}</li>)}
      </ul>
    </a>
  );
}
