import React from 'react';
export function LiveDot({ off = false, children = 'Live', style }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--r4-muted)', ...style }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: off ? 'var(--r4-muted)' : 'var(--live)', display: 'inline-block' }}></i>{children}</span>;
}
