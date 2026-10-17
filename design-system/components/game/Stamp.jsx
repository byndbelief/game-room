import React from 'react';
const T = { gold: ['#FFE08A', '#3A1D00', '#F2C230'], red: ['#FF6B5E', '#2A0000', '#FF5A4E'], blue: ['#BDE7FF', '#0A2238', '#5AB8FF'], purple: ['#E3CCFF', '#22103A', '#B37BFF'] };
export function Stamp({ tone = 'gold', animate = true, children, style }) {
  const [c, s, g] = T[tone];
  return <span style={{ display: 'inline-block', fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 11vw, 88px)', lineHeight: .95, color: c, WebkitTextStroke: '3px ' + s, paintOrder: 'stroke fill', textShadow: '0 6px 0 ' + s + ', 0 0 40px ' + g, animation: animate ? 'r4-stampin 2.4s cubic-bezier(.2, 1.6, .4, 1) both' : 'none', textAlign: 'center', ...style }}>{children}</span>;
}
