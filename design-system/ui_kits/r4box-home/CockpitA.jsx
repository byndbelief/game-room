function CockpitA({ mobile }) {
  const { R4Mark, Bifurcation, EnterButton } = CK;
  const x = useLogistic(); const now = ckClock();
  const panel = { background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', borderRadius: 20, padding: 20 };
  return (
    <div style={{ padding: mobile ? '16px 16px 24px' : '20px 28px 28px', display: 'grid', gap: mobile ? 14 : 18 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <R4Mark />
        <span style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--r4-muted)' }}>{mobile ? '' : now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · '}{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </header>
      <section style={{ ...panel, padding: 0, position: 'relative', overflow: 'hidden', height: mobile ? 180 : 230 }}>
        <Bifurcation height={mobile ? 180 : 230} style={{ opacity: .85 }} />
        <div style={{ position: 'absolute', left: mobile ? 16 : 24, bottom: mobile ? 16 : 22, display: 'grid', gap: 6 }}>
          <p style={ckEyebrow}><span style={{ textTransform: 'none', fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>r = 4</span> · live</p>
          <div style={{ font: `400 ${mobile ? 36 : 56}px/1 var(--font-display)`, letterSpacing: '-.02em' }}>x = <span style={{ color: 'var(--teal)' }}>{x.toFixed(4)}</span></div>
        </div>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1.4fr) minmax(0,1fr)', gap: mobile ? 14 : 18 }}>
        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}><h2 style={{ font: '700 20px/1 var(--font-display)', margin: 0 }}>The box</h2><span style={{ fontSize: 12, color: 'var(--r4-muted)' }}>Tailnet only</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'repeat(2, minmax(0,1fr))', gap: mobile ? 8 : 10 }}>
            {ckHub.map((s) => (
              <a key={s.t} href={'https://' + s.h + '/'} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, background: '#ffffff06', border: '1px solid #ffffff10', color: 'inherit', textDecoration: 'none' }}>
                <span style={ckGlyph(s.c)}>{s.g}</span>
                <span style={{ minWidth: 0 }}><b style={{ display: 'block', fontSize: 15 }}>{s.t}</b><span style={{ font: '500 11px/1.3 var(--font-mono)', color: 'var(--r4-faint)' }}>{s.h}</span></span>
                <span style={{ marginLeft: 'auto', color: 'var(--r4-muted)' }}>→</span>
              </a>
            ))}
          </div>
        </section>
        <section style={{ ...panel, display: 'grid', gap: 14, alignContent: 'start', order: mobile ? -1 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><h2 style={{ font: '700 20px/1 var(--font-display)', margin: 0 }}>Game room</h2><span style={{ fontSize: 12, color: 'var(--r4-muted)' }}>Open anywhere</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {ckGames.map(([e, n]) => <a key={n} href="https://games.r4box.com/" title={n} style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', fontSize: 26, borderRadius: 12, background: '#0E0A24', border: '1px solid var(--r4-line)', textDecoration: 'none' }}>{e}</a>)}
          </div>
          <EnterButton href="https://games.r4box.com/" style={{ background: 'var(--teal)', color: '#062A26', justifyContent: 'center' }}>Play <span>→</span></EnterButton>
        </section>
      </div>
    </div>
  );
}
window.CockpitA = CockpitA;
