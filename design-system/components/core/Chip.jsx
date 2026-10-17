import React from 'react';
export function Chip({ pressed = false, tone = 'teal', children, style, ...rest }) {
  const on = tone === 'gold' ? { borderColor: 'var(--gold)', background: 'var(--gold)', color: 'var(--gold-ink)' } : { borderColor: 'var(--teal)', background: 'var(--water)' };
  return (
    <button type="button" aria-pressed={pressed} {...rest} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--r4-line)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 700, background: 'var(--r4-panel)', color: 'var(--r4-ink)', ...(pressed ? on : {}), ...style }}>{children}</button>
  );
}
