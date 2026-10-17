import React from 'react';
export function Card({ selected = false, as = 'section', children, style, ...rest }) {
  const Tag = as;
  return <Tag {...rest} style={{ background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, ...(selected ? { borderColor: 'var(--gold)', boxShadow: '0 0 0 2px var(--gold)' } : {}), ...style }}>{children}</Tag>;
}
