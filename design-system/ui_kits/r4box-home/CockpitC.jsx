function CockpitC({ mobile, bg = 'curve' }) {
  const { R4Mark, Bifurcation } = CK;
  const x = useLogistic();
  const [q, setQ] = React.useState('');
  const all = [...ckHub.map((s) => ({ ...s, href: 'https://' + s.h + '/' })), ...ckGames.map(([e, n]) => ({ g: e, t: n, d: 'Game room', h: 'games.r4box.com', c: 'var(--teal)', href: 'https://games.r4box.com/', emoji: true }))];
  const hits = q ? all.filter((s) => (s.t + ' ' + s.d).toLowerCase().includes(q.toLowerCase())) : [];
  const mask = 'linear-gradient(180deg, #000 0%, #0000 85%)';
  return (
    <div style={{ position: 'relative', isolation: 'isolate', minHeight: '100%', padding: mobile ? '16px 16px 20px' : '20px 28px 28px', display: 'flex', flexDirection: 'column' }}>
      {bg !== 'tree' && <div style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: bg === 'both' ? .35 : .55, maskImage: mask, WebkitMaskImage: mask }}><Bifurcation height="100%" /></div>}
      {bg !== 'curve' && <DiaryTreeBg style={{ zIndex: -1, top: mobile ? 60 : 70, bottom: mobile ? 200 : 130, opacity: .9 }} />}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <R4Mark />
        <span style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--r4-muted)', padding: '8px 12px', border: '1px solid var(--r4-line)', borderRadius: 99, whiteSpace: 'nowrap' }}>x = <b style={{ color: 'var(--teal)' }}>{x.toFixed(4)}</b></span>
      </header>
      <div style={{ flex: 1, display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 22, padding: '40px 0' }}>
        <h1 style={{ font: '800 clamp(30px, 5vw, 52px)/1 var(--font-display)', letterSpacing: '-.035em', margin: 0, textAlign: 'center' }}>Where to?</h1>
        <div style={{ width: 'min(560px, 100%)', position: 'relative' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="os, diary, battleship…" style={{ width: '100%', boxSizing: 'border-box', padding: '16px 20px', font: '400 17px/1.2 var(--font-body)', color: 'var(--r4-ink)', background: 'var(--r4-panel)', border: '1.5px solid var(--r4-line)', borderRadius: 14, outline: 'none' }} />
          {hits.length > 0 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', zIndex: 3, background: 'var(--r4-panel-2)', border: '1px solid var(--r4-line)', borderRadius: 14, padding: 6, boxShadow: '0 10px 24px #0003' }}>
              {hits.slice(0, 6).map((s) => (
                <a key={s.t} href={s.href} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 10, color: 'inherit', textDecoration: 'none' }}>
                  <span style={s.emoji ? { width: 32, textAlign: 'center', fontSize: 20 } : ckGlyph(s.c, 32)}>{s.g}</span>
                  <b style={{ fontSize: 15 }}>{s.t}</b><span style={{ marginLeft: 'auto', font: '500 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}>{s.h}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(4, minmax(0,1fr))' : 'repeat(7, minmax(0,1fr))', gap: mobile ? 8 : 10 }}>
        {[...ckHub, { g: '⚓', t: 'games', h: 'games.r4box.com', c: 'var(--teal)' }].map((s) => (
          <a key={s.t} href={'https://' + s.h + '/'} style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: mobile ? '12px 4px' : '16px 8px', borderRadius: mobile ? 16 : 20, background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', color: 'inherit', textDecoration: 'none' }}>
            <span style={ckGlyph(s.c, mobile ? 36 : 44)}>{s.g}</span><b style={{ fontSize: mobile ? 12 : 14 }}>{s.t}</b>
          </a>
        ))}
      </div>
    </div>
  );
}
window.CockpitC = CockpitC;
