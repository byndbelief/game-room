import React from 'react';
export function Badge({ icon, title, how, got = false, progress, count, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3, padding: '12px 8px', borderRadius: 14, background: got ? 'linear-gradient(180deg, #3A2E10, var(--r4-panel) 70%)' : 'var(--r4-panel)', border: '1.5px solid ' + (got ? 'var(--gold)' : 'var(--r4-line)'), ...style }}>
      <span style={{ fontSize: 34, lineHeight: 1.1, filter: got ? 'none' : 'grayscale(1)', opacity: got ? 1 : .35 }}>{icon}</span>
      <strong style={{ fontSize: 14, color: got ? 'var(--r4-ink)' : 'var(--r4-muted)' }}>{title}</strong>
      {how ? <span style={{ fontSize: 12, color: 'var(--r4-muted)' }}>{how}</span> : null}
      {progress != null ? <span style={{ width: '80%', height: 6, borderRadius: 99, background: 'var(--water)', overflow: 'hidden', marginTop: 4 }}><i style={{ display: 'block', height: '100%', width: Math.round(progress * 100) + '%', background: 'var(--teal)' }}></i></span> : null}
      {count ? <span style={{ fontSize: 11, color: 'var(--r4-muted)', fontWeight: 700 }}>{count}</span> : null}
    </div>
  );
}
