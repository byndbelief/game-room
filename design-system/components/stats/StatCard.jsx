import React from 'react';
export function StatCard({ name, me = false, stats = [], kinds = [], streak, style }) {
  return (
    <div style={{ background: 'var(--r4-panel)', border: '1.5px solid ' + (me ? 'var(--gold)' : 'var(--r4-line)'), boxShadow: me ? '0 0 0 2px var(--gold)' : 'none', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--r4-ink)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><strong style={{ fontSize: 18 }}>{name}</strong>{streak ? <span style={{ background: 'var(--hot)', color: '#fff', fontWeight: 800, fontSize: 12, borderRadius: 99, padding: '2px 10px' }}>{streak}</span> : null}<span style={{ marginLeft: 'auto', color: 'var(--teal)' }}>›</span></div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>{stats.map((s, i) => <span key={i}><b style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 30 }}>{s.value}</b> <small style={{ color: 'var(--r4-muted)', fontWeight: 700 }}>{s.label}</small></span>)}</div>
      {kinds.length ? <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14, color: 'var(--r4-muted)', fontWeight: 700 }}>{kinds.map((k, i) => <span key={i}>{k}</span>)}</div> : null}
    </div>
  );
}
