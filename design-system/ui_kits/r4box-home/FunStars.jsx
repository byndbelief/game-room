// 4b: your constellation. Trace your secret through stars sitting on the attractor.
function FunStars({ mobile }) {
  const [path, setPath] = React.useState([]);
  const [mode, setMode] = React.useState('play'); // play | fallback | in
  const [bad, setBad] = React.useState(false);
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const stars = React.useMemo(() => {
    const rs = [3.2, 3.5, 3.74, 3.83, 3.9, 3.96, 3.62, 3.99, 3.45];
    return rs.map((r, i) => { let x = .3 + i * .05; for (let k = 0; k < 300 + i; k++) x = r * x * (1 - x); return { r, x: (r - 2.6) / 1.4, y: 1 - x }; });
  }, []);
  const cv = useCanvas((ctx, w, h) => drawAttractor(ctx, w, h, 4), []);
  const box = React.useRef(null);
  const hit = (e) => {
    const o = box.current.getBoundingClientRect(), b = { left: o.left + 28, top: o.top + 28, width: o.width - 56, height: o.height - 56 };
    const i = stars.findIndex((s) => Math.hypot(s.x * b.width - (e.clientX - b.left), s.y * b.height - (e.clientY - b.top)) < 26);
    if (i >= 0 && !path.includes(i)) setPath((p) => [...p, i]);
  };
  const up = () => {
    if (path.length >= 4) go();
    else if (path.length) { setBad(true); setTimeout(() => { setBad(false); setPath([]); }, 600); }
  };
  if (mode === 'in') return <SignedIn who="you" onBack={() => { setMode('play'); setPath([]); cancel(); }} />;
  if (mode === 'fallback') return <LoginC mobile={mobile} />;
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: mobile ? '20px 16px 28px' : '24px 48px 40px', display: 'flex', flexDirection: 'column', gap: mobile ? 20 : 28 }}>
      <header><LG.R4Mark /></header>
      <div>
        <h1 style={{ font: `800 ${mobile ? 30 : 52}px/1 var(--font-display)`, letterSpacing: '-.035em', margin: 0 }}>Trace your stars.</h1>
        <p style={{ color: 'var(--r4-muted)', margin: '10px 0 0' }}>Connect at least four, in your order.</p>
      </div>
      <div ref={box} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setPath([]); hit(e); }} onPointerMove={(e) => e.buttons && hit(e)} onPointerUp={up} style={{ position: 'relative', flex: 1, touchAction: 'none', borderRadius: 20, border: '1px solid var(--r4-line)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 28 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .35 }}><canvas ref={cv}></canvas></div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {path.slice(1).map((i, k) => { const a = stars[path[k]], b = stars[i]; return <line key={k} x1={`${a.x * 100}%`} y1={`${a.y * 100}%`} x2={`${b.x * 100}%`} y2={`${b.y * 100}%`} stroke={bad ? '#FF5A4A' : lgPhase(b.r)} strokeWidth="3" strokeLinecap="round"></line>; })}
        </svg>
        {stars.map((s, i) => { const on = path.includes(i); return <span key={i} style={{ position: 'absolute', left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: on ? 22 : 14, height: on ? 22 : 14, transform: 'translate(-50%,-50%)', borderRadius: 99, background: bad && on ? '#FF5A4A' : lgPhase(s.r), boxShadow: `0 0 ${on ? 26 : 14}px ${lgPhase(s.r)}`, transition: 'all .15s' }}></span>; })}
        </div>
      </div>
      <FallbackLink onClick={() => setMode('fallback')} />
      <PasskeySheet st={st} who="you" onCancel={() => { cancel(); setPath([]); }} />
    </div>
  );
}
window.FunStars = FunStars;
