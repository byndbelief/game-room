import React from 'react';
export function Field({ label, type = 'text', value, onChange, placeholder, style, ...rest }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 700, fontSize: 14, ...style }}>{label}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest} style={{ font: 'inherit', fontWeight: 400, fontSize: 16, color: 'var(--r4-ink)', background: 'var(--r4-bg)', border: '1.5px solid var(--r4-line)', borderRadius: 10, padding: '10px 12px', width: '100%', boxSizing: 'border-box' }} />
    </label>
  );
}
