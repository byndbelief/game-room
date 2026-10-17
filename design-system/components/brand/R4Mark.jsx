import React from 'react';
export function R4Mark({ size = 22, sub = 'r = 4', spin = true, href, style }) {
  const Tag = href ? 'a' : 'span';
  return (
    <Tag href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, letterSpacing: '-.02em', color: 'var(--r4-ink)', textDecoration: 'none', ...style }}>
      <i aria-hidden="true" style={{ width: '1.05em', height: '1.05em', borderRadius: '22%', background: 'var(--grad-mark)', boxShadow: 'inset 0 0 0 .18em var(--r4-bg), 0 0 18px #3DD6C666', animation: spin ? 'r4-spin 18s linear infinite' : 'none', display: 'inline-block' }}></i>
      r4box
      {sub ? <small style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '.5em', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--r4-muted)', alignSelf: 'flex-end', marginBottom: '.2em' }}>{sub}</small> : null}
    </Tag>
  );
}
