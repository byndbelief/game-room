// 4c: knock on the box. Three knocks; each one steps the curve.
function FunKnock({ mobile }) {
  const [knocks, setKnocks] = React.useState([]);
  const [x, setX] = React.useState(.2);
  const [mode, setMode] = React.useState('play'); // play | fallback | in
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const timer = React.useRef(0);
  const knock = () => {
    if (st !== 'idle') return;
    clearTimeout(timer.current);
    setX((v) => 4 * v * (1 - v));
    setKnocks((k) => { const n = [...k, Date.now()]; if (n.length >= 3) { setTimeout(go, 350); return n; } return n; });
    timer.current = setTimeout(() => setKnocks((k) => (k.length < 3 ? [] : k)), 1600);
  };
  if (mode === 'in') return <SignedIn who="you" onBack={() => { setMode('play'); setKnocks([]); cancel(); }} />;
  if (mode === 'fallback') return <LoginC mobile={mobile} />;
  const n = knocks.length, size = mobile ? 168 : 220;
  const ring = (i) => ({ position: 'absolute', inset: 0, borderRadius: '24%', border: `2px solid ${['#3DD6C6', '#F5C542', '#FF5A4A'][i]}`, opacity: n > i ? 1 : 0, transform: `scale(${n > i ? 1.25 + i * .22 : 1})`, transition: 'transform .35s cubic-bezier(.2,1.8,.4,1), opacity .2s' });
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: mobile ? '20px 16px 28px' : '24px 48px 40px', display: 'flex', flexDirection: 'column' }}>
      <LoginBg mobile={mobile} strength={.35} />
      <header><LG.R4Mark /></header>
      <div style={{ flex: 1, display: 'grid', alignContent: 'center', justifyItems: 'center', gap: mobile ? 36 : 44, textAlign: 'center' }}>
        <h1 style={{ font: `800 ${mobile ? 30 : 52}px/1 var(--font-display)`, letterSpacing: '-.035em', margin: 0 }}>{n === 0 ? 'Knock three times.' : n === 1 ? 'Again.' : n === 2 ? 'Once more.' : 'Come in.'}</h1>
        <button onClick={knock} aria-label="Knock" style={{ all: 'unset', cursor: 'pointer', position: 'relative', width: size, height: size, transform: n ? 'scale(.97)' : 'none', transition: 'transform .1s' }}>
          {[0, 1, 2].map((i) => <span key={i} style={ring(i)}></span>)}
          <img src="../../assets/icon.svg" alt="" style={{ width: '100%', height: '100%', display: 'block', filter: `drop-shadow(0 0 ${18 + n * 14}px #3DD6C666)` }} />
        </button>
        <span style={{ font: '600 13px/1 var(--font-mono)', color: 'var(--r4-muted)' }}>x = <b style={{ color: 'var(--teal)' }}>{x.toFixed(4)}</b></span>
      </div>
      <div style={{ justifySelf: 'center', textAlign: 'center' }}><FallbackLink onClick={() => setMode('fallback')} /></div>
      <PasskeySheet st={st} who="you" onCancel={() => { cancel(); setKnocks([]); }} />
    </div>
  );
}
window.FunKnock = FunKnock;
