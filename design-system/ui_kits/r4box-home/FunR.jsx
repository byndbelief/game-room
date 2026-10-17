// 4a: drag r up to 4. The diagram draws as you go; chaos opens the box.
function FunR({ mobile }) {
  const [r, setR] = React.useState(2.6);
  const [mode, setMode] = React.useState('play'); // play | fallback | in
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const cv = useCanvas((ctx, w, h) => drawAttractor(ctx, w, h, r), [r]);
  const track = React.useRef(null);
  const drag = (e) => {
    const b = track.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
    const nr = 2.6 + 1.4 * p; setR(nr);
    if (nr >= 3.995 && st === 'idle') go();
  };
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); };
  if (mode === 'in') return <SignedIn who="you" onBack={() => { setMode('play'); setR(2.6); cancel(); }} />;
  if (mode === 'fallback') return <LoginC mobile={mobile} />;
  const word = r < 3 ? 'calm' : r < 3.5699 ? 'doubling' : r < 3.83 ? 'the window' : r < 3.995 ? 'almost…' : 'chaos';
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: mobile ? '20px 16px 28px' : '24px 48px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: mobile ? '120px 0 200px' : '100px 0 180px', zIndex: -1 }}><canvas ref={cv}></canvas></div>
      <header><LG.R4Mark /></header>
      <div style={{ marginTop: mobile ? 28 : 36 }}>
        <h1 style={{ font: `800 ${mobile ? 30 : 52}px/1 var(--font-display)`, letterSpacing: '-.035em', margin: 0 }}>Turn r up to 4.</h1>
      </div>
      <div style={{ marginTop: 'auto', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ font: `400 ${mobile ? 40 : 56}px/1 var(--font-display)`, color: lgPhase(r), fontVariantNumeric: 'tabular-nums' }}>r = {r.toFixed(3)}</span>
          <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: lgPhase(r) }}>{word}</span>
        </div>
        <div ref={track} onPointerDown={down} onPointerMove={(e) => e.buttons && drag(e)} style={{ position: 'relative', height: 56, borderRadius: 999, background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', touchAction: 'none', cursor: 'grab' }}>
          <div style={{ position: 'absolute', inset: 4, right: 'auto', width: `calc(48px + ${(r - 2.6) / 1.4} * (100% - 56px))`, borderRadius: 999, background: 'var(--grad-curve)', opacity: .9 }}></div>
          <div style={{ position: 'absolute', top: 4, left: `calc(4px + ${(r - 2.6) / 1.4} * (100% - 56px))`, width: 48, height: 48, borderRadius: 999, background: 'var(--r4-ink)', display: 'grid', placeItems: 'center', color: '#0B0918', fontWeight: 800 }}>→</div>
        </div>
        <FallbackLink onClick={() => setMode('fallback')} />
      </div>
      <PasskeySheet st={st} who="you" onCancel={() => { cancel(); setR(3.9); }} />
    </div>
  );
}
window.FunR = FunR;
