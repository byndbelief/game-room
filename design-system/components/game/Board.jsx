import React from 'react';
import { BoardCell } from './BoardCell.jsx';
const L = 'ABCDEFGHIJKLMNOP';
export function Board({ size = 10, cells = {}, onCell, labels = true, style }) {
  const cols = labels ? size + 1 : size;
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--r4-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const out = [];
  if (labels) { out.push(<span key="c"></span>); for (let c = 0; c < size; c++) out.push(<span key={'h' + c} style={lbl}>{c + 1}</span>); }
  for (let r = 0; r < size; r++) {
    if (labels) out.push(<span key={'r' + r} style={lbl}>{L[r]}</span>);
    for (let c = 0; c < size; c++) { const k = L[r] + (c + 1); out.push(<BoardCell key={k} state={cells[k] || 'water'} onClick={onCell ? () => onCell(k) : undefined} />); }
  }
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gap: 2, width: '100%', maxWidth: 440, margin: '0 auto', fontVariantNumeric: 'tabular-nums', ...style }}>{out}</div>;
}
