import React from 'react';
export function Status({ tone = 'info', children, style }) {
  const t = tone === 'bad' ? { background: 'var(--hot-soft)' } : tone === 'good' ? { background: 'var(--gold)', color: 'var(--gold-ink)' } : { background: 'var(--r4-panel-2)' };
  return <p style={{ margin: 0, borderRadius: 12, padding: '12px 14px', fontWeight: 700, color: 'var(--r4-ink)', ...t, ...style }}>{children}</p>;
}
