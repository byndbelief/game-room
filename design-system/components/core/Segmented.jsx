import React from 'react';
export function Segmented({ options = [], value, onChange, style }) {
  return (
    <div role="radiogroup" style={{ display: 'inline-flex', borderRadius: 99, overflow: 'hidden', border: '1.5px solid #ffffff22', ...style }}>
      {options.map((o) => { const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o, on = v === value;
        return <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onChange && onChange(v)} style={{ padding: '8px 12px', cursor: 'pointer', font: 'inherit', fontWeight: 700, fontSize: 14, border: 0, borderRadius: 0, background: on ? 'var(--gold)' : 'transparent', color: on ? 'var(--gold-ink)' : 'var(--r4-ink)' }}>{l}</button>; })}
    </div>
  );
}
