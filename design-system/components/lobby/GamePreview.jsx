import React from 'react';
const ICON = { battleship: '⚓', golf: '⛳', duel: '💥', cards: '🃏', war: '⚔️', gauntlet: '🌀' };
// Stand-in for the app's canvas-drawn live previews: the dark preview well with the game's emoji.
export function GamePreview({ kind = 'battleship', ratio = '16 / 10', radius = 0, children, style }) {
  return <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '100%', aspectRatio: ratio, background: 'radial-gradient(120% 90% at 50% 120%, #1A1640, #0E0A24 70%)', borderRadius: radius, fontSize: 34, ...style }}>{children || ICON[kind]}</span>;
}
