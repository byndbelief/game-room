function CockpitB({ mobile }) {
  const { R4Mark, Bifurcation } = CK;
  const x = useLogistic();
  const items = [...ckHub.map((s) => ({ ...s, href: 'https://' + s.h + '/' })), { g: '⚓', t: 'game room', d: 'Battleship, Putt Post, Hilltop Duel, Chaos Cards, War, The Gauntlet, the arcade.', h: 'games.r4box.com', c: 'var(--teal)', href: 'https://games.r4box.com/' }];
  const [hot, setHot] = React.useState(-1);
  React.useEffect(() => {
    const k = (e) => { const i = '1234567'.indexOf(e.key); if (i >= 0) { setHot(i); setTimeout(() => setHot(-1), 400); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gridTemplateRows: mobile ? '300px auto' : 'none', minHeight: '100%' }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRight: mobile ? 'none' : '1px solid var(--r4-line)', borderBottom: mobile ? '1px solid var(--r4-line)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: mobile ? 16 : 28 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: .9 }}><Bifurcation height="100%" /></div>
        <div style={{ position: 'relative' }}><R4Mark /></div>
        <div style={{ position: 'relative', display: 'grid', gap: 8 }}>
          <p style={{ ...ckEyebrow, color: 'var(--teal)', textTransform: 'none', fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>x → 4x(1 − x)</p>
          <div style={{ font: '400 clamp(48px, 7vw, 88px)/1 var(--font-display)', letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>{x.toFixed(4)}</div>
          <p style={{ margin: 0, color: 'var(--r4-muted)', fontSize: 13 }}>One step every half second. It never settles.</p>
        </div>
      </div>
      <nav style={{ padding: mobile ? '16px 8px' : '28px 28px', display: 'grid', alignContent: mobile ? 'start' : 'center', gap: mobile ? 0 : 4 }}>
        <p style={{ ...ckEyebrow, marginBottom: 12, paddingLeft: mobile ? 14 : 0 }}>{mobile ? 'Launch' : 'Launch · press 1–7'}</p>
        {items.map((s, i) => (
          <a key={s.t} href={s.href} style={{ display: 'grid', gridTemplateColumns: mobile ? '40px minmax(0,1fr) auto' : '28px 40px minmax(0,1fr) auto', gap: mobile ? 12 : 14, alignItems: 'center', padding: '12px 14px', borderRadius: 14, color: 'inherit', textDecoration: 'none', background: hot === i ? '#ffffff14' : 'transparent', transition: 'background .15s' }}>
            {!mobile && <kbd style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--r4-faint)', border: '1px solid var(--r4-line)', borderRadius: 6, padding: '5px 0', textAlign: 'center' }}>{i + 1}</kbd>}
            <span style={ckGlyph(s.c)}>{s.g}</span>
            <span style={{ minWidth: 0 }}><b style={{ display: 'block', font: '700 17px/1.2 var(--font-display)' }}>{s.t}</b>{!mobile && <span style={{ fontSize: 13, color: 'var(--r4-muted)' }}>{s.d}</span>}{mobile && <span style={{ font: '500 11px/1.3 var(--font-mono)', color: 'var(--r4-faint)' }}>{s.h}</span>}</span>
            <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}>{mobile ? '→' : s.h}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
window.CockpitB = CockpitB;
