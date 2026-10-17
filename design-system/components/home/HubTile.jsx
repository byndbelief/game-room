import React from 'react';
export function HubTile({ glyph, title, desc, host, color = 'var(--violet)', href = '#', style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <a href={href} {...rest} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 150, padding: 20, borderRadius: 20, background: h ? 'color-mix(in srgb, ' + color + ' 7%, var(--r4-panel))' : 'var(--r4-panel)', border: '1px solid ' + (h ? color : 'var(--r4-line)'), color: 'var(--r4-ink)', textDecoration: 'none', transition: 'border-color .2s, background .2s', ...style }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, background: 'color-mix(in srgb, ' + color + ' 18%, transparent)', color: color, border: '1px solid color-mix(in srgb, ' + color + ' 35%, transparent)' }}>{glyph}</div>
      <b style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '-.01em' }}>{title}</b>
      <span style={{ color: 'var(--r4-muted)', fontSize: 14, lineHeight: 1.45 }}>{desc}</span>
      {host ? <code style={{ marginTop: 'auto', font: '12px ui-monospace, Menlo, monospace', color: 'var(--r4-code)' }}>{host}</code> : null}
    </a>
  );
}
