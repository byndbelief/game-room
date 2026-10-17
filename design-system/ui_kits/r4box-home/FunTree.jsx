// 4b v2: a baby diary tree. Its buds, blossoms and fruit are the code.
const ftDay = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const ftSapling = (() => {
  // 6 limbs off the trunk, 3 of them forking once: shape only, every event is a plain leaf
  const roots = [['r1', 16], ['r2', 14], ['r3', 12], ['r4', 9], ['r5', 7], ['r6', 4]];
  const ideas = roots.map(([id, n]) => ({ id, created: ftDay(n), stage: 'explored', parent: null }));
  const events = [];
  roots.forEach(([id, n]) => { for (let i = 0; i < 4; i++) events.push({ id: `ev-${id}-${i}`, date: ftDay(Math.max(0, n - i * 1)), idea: id, kind: 'deepen', effort: 1 + (i % 2), backfilled: false }); });
  [['r1', 2], ['r3', 1], ['r5', 2]].forEach(([p, at], j) => {
    const d = ftDay(Math.max(0, roots.find((r) => r[0] === p)[1] - at)), id = 'k' + j;
    ideas.push({ id, created: d, stage: 'explored', parent: p });
    for (let i = 0; i < 3; i++) events.push({ id: `ev-${id}-${i}`, date: d, idea: id, kind: 'deepen', effort: 1, backfilled: false });
  });
  events.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { ideas, events };
})();
// 9 code dots on a loose 3x3 grid centred on the trunk, each nudged by a fixed offset so the
// grid reads hand-grown, and each tied back to the tree by its own twig (anchor = nearest
// tree point below it). Rows: fruit, blossoms, buds.
const ftJitter = [[-.14, .1], [.06, -.12], [.16, .04], [.1, -.08], [-.05, .13], [-.12, -.06], [-.08, .05], [.13, .12], [.02, -.1]];
function ftPickCode(nodes, w, h) {
  if (nodes.length < 9) return [];
  const ys = nodes.map((n) => n.y), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sx = Math.min(w * .3, 150), sy = Math.min((y1 - y0) * .42, sx * 1.9);
  const cy = (y0 + y1) / 2 - sy * .1, kinds = ['ship', 'branch', 'spark'], out = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const [jx, jy] = ftJitter[row * 3 + col];
    const x = w / 2 + (col - 1 + jx) * sx, y = cy + (row - 1 + jy) * sy;
    let a = null, bd = Infinity;
    nodes.forEach((n) => { if (n.y < y + 18) return; const d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd) { bd = d; a = n; } });
    if (!a) nodes.forEach((n) => { const d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd) { bd = d; a = n; } });
    const bend = (col - 1 || (row % 2 ? 1 : -1)) * 14;
    out.push({ x, y, kind: kinds[row], ax: a.x, ay: a.y, cx: (a.x + x) / 2 + bend, cy: (a.y + y) / 2 + 6 });
  }
  return out;
}
const ftKindCol = { spark: '#B9A6FF', branch: '#FF5A4A', pivot: '#FF5A4A', ship: '#F5C542' };
const ftKindName = { spark: 'bud', branch: 'blossom', pivot: 'blossom', ship: 'fruit' };

function FunTree({ mobile }) {
  const [nodes, setNodes] = React.useState([]);
  const [path, setPath] = React.useState([]);
  const [bad, setBad] = React.useState(false);
  const [mode, setMode] = React.useState('play');
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const cv = React.useRef(null), box = React.useRef(null);
  React.useEffect(() => {
    if (mode !== 'play') return;
    return window.mountDiaryTree(cv.current, ftSapling, { palette: ckTreePalette, flow: { ...ckTreeFlow, wave: 70 }, spin: false, fill: true, segScale: 1.7, withTips: true, onLayout: (n, w, h) => setNodes(ftPickCode(n, w, h)) });
  }, [mode]);
  const hit = (e) => {
    const b = box.current.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top;
    let best = -1, bd = 30 * 30;
    nodes.forEach((n, i) => { const d = (n.x - mx) ** 2 + (n.y - my) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best >= 0) setPath((p) => (p.includes(best) ? p : [...p, best]));
  };
  const up = () => {
    if (path.length >= 4) go();
    else if (path.length) { setBad(true); setTimeout(() => { setBad(false); setPath([]); }, 600); }
  };
  if (mode === 'in') return <SignedIn who="you" onBack={() => { setMode('play'); setPath([]); cancel(); }} />;
  if (mode === 'fallback') return <LoginC mobile={mobile} />;
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: mobile ? '20px 16px 28px' : '24px 48px 40px', display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 20 }}>
      <header><LG.R4Mark /></header>
      <div ref={box} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setPath([]); hit(e); }} onPointerMove={(e) => e.buttons && hit(e)} onPointerUp={up} style={{ position: 'relative', flex: 1, touchAction: 'none' }}>
        <div style={{ position: 'absolute', inset: 0 }}><canvas ref={cv} style={{ display: 'block' }}></canvas></div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
          {path.slice(1).map((i, k) => { const a = nodes[path[k]], b = nodes[i]; return a && b ? <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={bad ? '#FF5A4A' : '#F3F1FF'} strokeOpacity=".75" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7"></line> : null; })}
          {nodes.map((n, i) => <g key={'b' + i}><path d={`M${n.ax} ${n.ay} Q${n.cx} ${n.cy} ${n.x} ${n.y}`} fill="none" stroke="#3A335F" strokeWidth="4.5" strokeLinecap="round"></path><path d={`M${n.ax} ${n.ay} Q${n.cx} ${n.cy} ${n.x} ${n.y}`} fill="none" stroke={ftKindCol[n.kind]} strokeOpacity=".35" strokeWidth="1.5" strokeLinecap="round"></path></g>)}
          {nodes.map((n, i) => <g key={'d' + i}><circle cx={n.x} cy={n.y} r="16" fill={ftKindCol[n.kind]} opacity=".22"></circle><circle cx={n.x} cy={n.y} r="8.5" fill={ftKindCol[n.kind]} style={{ filter: `drop-shadow(0 0 8px ${ftKindCol[n.kind]})` }}></circle></g>)}
          {path.map((i) => nodes[i] && <circle key={i} cx={nodes[i].x} cy={nodes[i].y} r="22" fill="none" stroke={bad ? '#FF5A4A' : ftKindCol[nodes[i].kind]} strokeWidth="2"></circle>)}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, color: 'var(--r4-muted)' }}>
        {['spark', 'branch', 'ship'].map((k) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 9, height: 9, borderRadius: 9, background: ftKindCol[k], boxShadow: `0 0 8px ${ftKindCol[k]}` }}></i>{ftKindName[k]}</span>)}
      </div>
      <div style={{ textAlign: 'center' }}><FallbackLink onClick={() => setMode('fallback')} /></div>
      <PasskeySheet st={st} who="you" onCancel={() => { cancel(); setPath([]); }} />
    </div>
  );
}
window.FunTree = FunTree;
