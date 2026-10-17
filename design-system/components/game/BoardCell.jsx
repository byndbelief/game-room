import React from 'react';
export function BoardCell({ state = 'water', onClick, style }) {
  const base = { aspectRatio: '1', border: 0, padding: 0, borderRadius: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, background: 'var(--water)', cursor: onClick ? 'crosshair' : 'default' };
  const dot = (w, bg, extra) => <span style={{ width: w, height: w, borderRadius: '50%', background: bg, ...extra }}></span>;
  let s = {}, inner = null;
  if (state === 'ship') s = { background: 'linear-gradient(160deg, #7C8BA0, var(--ship) 55%, #3E4A5A)', boxShadow: 'inset 0 1px 0 #ffffff33' };
  if (state === 'miss') inner = dot('28%', 'var(--miss)', { boxShadow: '0 0 0 1.5px var(--r4-line)' });
  if (state === 'hit') { s = { background: 'var(--hot-soft)' }; inner = dot('60%', 'var(--hot)', { boxShadow: '0 0 10px #FF7A30', animation: 'r4-burn .9s ease-in-out infinite alternate' }); }
  if (state === 'sunk') { s = { background: 'radial-gradient(circle at 50% 60%, #FF8A3D, var(--hot) 55%, #5A1410)' }; inner = <span style={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(10px, 2.6vw, 16px)' }}>✕</span>; }
  if (state === 'aim') { s = { background: 'var(--gold)' }; inner = <span style={{ width: '40%', height: '40%', border: '2px solid var(--gold-ink)', borderRadius: '50%', boxSizing: 'border-box' }}></span>; }
  if (state === 'peek') s = { boxShadow: 'inset 0 0 0 2px #B37BFF, 0 0 10px #B37BFF' };
  const Tag = onClick ? 'button' : 'span';
  return <Tag onClick={onClick} style={{ ...base, ...s, ...style }}>{inner}</Tag>;
}
