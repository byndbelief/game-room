import React from 'react';
export function Avatar({ name = '', src, emoji, size = 34, online, style }) {
  const s = { width: size, height: size, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', overflow: 'hidden', flex: 'none', fontFamily: 'var(--font-display)', fontSize: Math.round(size * .47), background: 'var(--grad-avatar)', color: 'var(--r4-bg)', objectFit: 'cover',
    ...(emoji ? { fontFamily: 'inherit', fontSize: Math.round(size * .59), background: 'var(--r4-panel)', boxShadow: '0 0 0 1px var(--r4-line)' } : {}),
    ...(online === true ? { boxShadow: '0 0 0 2px var(--r4-bg), 0 0 0 4px #3DDC84' } : {}), ...(online === false ? { filter: 'grayscale(.8)', opacity: .55 } : {}), ...style };
  if (src) return <img src={src} alt={name} style={{ ...s, background: '#000' }} />;
  return <span aria-label={name} style={s}>{emoji || (name[0] || '?').toUpperCase()}</span>;
}
