import React from 'react';
const V = {
  default: { background: 'var(--r4-panel)', borderColor: 'var(--r4-line)', color: 'var(--r4-ink)' },
  primary: { background: 'var(--pal)', borderColor: 'var(--pal)', color: 'var(--pal-ink)', boxShadow: '0 8px 24px color-mix(in srgb, var(--pal) 30%, transparent)' },
  fire: { background: 'var(--hot)', borderColor: 'var(--hot)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18, letterSpacing: '.04em', minHeight: 52, minWidth: 110 },
  danger: { background: 'var(--r4-panel)', borderColor: 'var(--r4-line)', color: 'var(--hot)' },
  link: { background: 'none', border: 0, padding: 0, color: 'var(--teal)', textDecoration: 'underline' },
};
export function Button({ variant = 'default', size = 'md', display = false, disabled, children, style, ...rest }) {
  const sm = size === 'sm' ? { padding: '6px 12px', fontSize: 14 } : {};
  return (
    <button disabled={disabled} {...rest} style={{ font: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 12, border: '1.5px solid', padding: '10px 16px', fontWeight: 700, opacity: disabled ? .45 : 1,
      animation: variant === 'fire' && !disabled ? 'r4-ready 1s ease-in-out infinite alternate' : 'none', ...V[variant], ...(display ? { fontFamily: 'var(--font-display)', minHeight: 46, padding: '0 22px' } : {}), ...sm, ...style }}>{children}</button>
  );
}
