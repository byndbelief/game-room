import React from 'react';
export function BotStep({ value = 0, max = 3, onChange, label = '🤖 Robots', style }) {
  const on = value > 0;
  const b = { width: 32, height: 32, padding: 0, borderRadius: '50%', font: '800 18px/1 system-ui, sans-serif', border: '1.5px solid var(--r4-line)', background: 'var(--r4-panel)', color: 'var(--r4-ink)', cursor: 'pointer' };
  return (
    <span role="group" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 4px 3px 12px', borderRadius: 999, border: on ? '1.5px solid var(--gold)' : '1.5px dashed #ffffff33', background: on ? '#F2C14E22' : 'transparent', fontWeight: 800, fontSize: 14, ...style }}>
      <span>{label}</span>
      <button type="button" aria-label="One robot fewer" style={b} onClick={() => onChange && onChange(Math.max(0, value - 1))}>−</button>
      <b style={{ minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{value}</b>
      <button type="button" aria-label="One more robot" style={b} onClick={() => onChange && onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );
}
