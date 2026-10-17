import React from 'react';
const T = {
  turn: { background: 'var(--gold)', color: 'var(--gold-ink)' },
  wait: { background: 'var(--r4-panel-2)', color: 'var(--r4-ink)' },
  done: { background: 'var(--r4-line)', color: 'var(--r4-ink)' },
  out: { background: 'var(--hot-soft)', color: 'var(--r4-ink)' },
  chaos: { background: 'var(--violet)', color: 'var(--violet-ink)' },
  streak: { background: 'var(--hot)', color: '#fff', fontWeight: 800 },
};
export function Pill({ tone = 'wait', children, style }) {
  return <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '2px 10px', whiteSpace: 'nowrap', display: 'inline-block', ...T[tone], ...style }}>{children}</span>;
}
