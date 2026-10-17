import React from 'react';
export function EnterButton({ alt = false, size = 'md', href, children, style, ...rest }) {
  const [h, setH] = React.useState(false);
  const big = size === 'lg';
  const base = { display: 'inline-flex', alignItems: 'center', gap: big ? 12 : 8, minHeight: 48, padding: big ? '16px 26px' : '10px 22px', borderRadius: big ? 16 : 14, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, textDecoration: 'none', cursor: 'pointer', border: 0, transition: 'transform .15s, box-shadow .15s, filter .15s' };
  const look = alt ? { background: '#ffffff0e', color: 'var(--r4-ink)', border: '1px solid #ffffff22', fontSize: 16 }
    : { background: 'var(--pal)', color: 'var(--pal-ink)', boxShadow: big ? (h ? '0 14px 40px #3DD6C673' : '0 10px 34px #3DD6C64d') : '0 8px 24px #3DD6C633', transform: big && h ? 'translateY(-2px)' : 'none', filter: !big && h ? 'brightness(1.08)' : 'none' };
  const Tag = href ? 'a' : 'button';
  return <Tag href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} {...rest} style={{ ...base, ...look, ...style }}>{children}</Tag>;
}
