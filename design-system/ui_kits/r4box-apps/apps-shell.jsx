// Shell + primitives shared by every app screen; S = skin from apSkins.
function ApBtn({ S, primary, danger, children, onClick, style }) {
  const base = { appearance: 'none', font: '700 14px/1 var(--font-body)', minHeight: 44, padding: '0 16px', borderRadius: S.btnR, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', border: '1px solid var(--r4-line)', background: '#ffffff0a', color: 'var(--r4-ink)' };
  const p = primary ? { background: S.accent, borderColor: S.accent, color: S.accentInk } : danger ? { borderColor: 'color-mix(in oklab, var(--hot) 55%, transparent)', color: 'var(--hot)' } : {};
  return <button type="button" onClick={onClick} style={{ ...base, ...p, ...style }}>{children}</button>;
}
function ApSection({ S, title, right, children }) {
  return (
    <section style={{ display: 'grid', gap: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><p style={S.eyebrow}>{title}</p>{right && <span style={{ fontSize: 12, color: 'var(--r4-faint)', marginBottom: 8 }}>{right}</span>}</div>
      <div style={S.panel}>{children}</div>
    </section>
  );
}
function ApRow({ S, first, children, onClick, style }) {
  return <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: S.id === 'A' ? '13px 16px' : '12px 2px', minHeight: 44, borderTop: first ? 'none' : S.rowLine, cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</div>;
}
function ApDot({ c, size = 8, glow }) { return <i style={{ width: size, height: size, flex: 'none', borderRadius: 99, background: c, boxShadow: glow ? `0 0 8px ${c}` : 'none' }}></i>; }
function ApGlyph({ a, size = 32, S }) {
  return <span style={{ width: size, height: size, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: S && S.id === 'B' ? 6 : size * .3, font: `600 ${size * .42}px/1 var(--font-mono)`, color: a.c, background: `color-mix(in oklab, ${a.c} 14%, transparent)` }}>{a.g}</span>;
}
function ApShell({ S, app, onApp, children, badge }) {
  const a = apApps.find((x) => x.k === app);
  const dock = S.nav === 'dock';
  const strip = (
    <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 10px', scrollbarWidth: 'none' }}>
      {apApps.map((x) => { const on = x.k === app; return (
        <button key={x.k} onClick={() => onApp(x.k)} style={{ all: 'unset', cursor: 'pointer', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 12px', borderRadius: 6, font: '600 12px/1 var(--font-mono)', color: on ? 'var(--r4-ink)' : 'var(--r4-muted)', background: on ? '#ffffff12' : 'transparent', border: `1px solid ${on ? 'var(--r4-line)' : 'transparent'}` }}>
          <span style={{ color: x.c }}>{x.g}</span>{x.name}{x.k === 'ntfy' && badge ? <ApDot c="var(--hot)" size={6} /> : null}
        </button>); })}
    </nav>
  );
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--r4-bg)', color: 'var(--r4-ink)', fontFamily: 'var(--font-body)' }}>
      <header style={{ flex: 'none', paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 12px' }}>
          <a href="../r4box-home/cockpit.html" aria-label="Back to cockpit" style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: S.btnR, color: 'var(--r4-muted)', textDecoration: 'none', border: '1px solid var(--r4-line)', fontSize: 16 }}>‹</a>
          {S.id === 'A' ? <ApGlyph a={a} S={S} size={36} /> : null}
          <h1 style={S.h1}>{S.id === 'B' ? `r4box / ${a.name}` : a.name}</h1>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, font: '500 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}><ApDot c="var(--teal)" size={6} glow />{a.name}.r4box.com</span>
        </div>
        {!dock && strip}
      </header>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 24px', display: 'grid', alignContent: 'start', gridAutoRows: 'max-content', gap: S.id === 'A' ? 22 : 18 }}>{children}</main>
      {dock && (
        <nav style={{ flex: 'none', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', padding: '8px 6px max(10px, env(safe-area-inset-bottom))', background: 'var(--r4-panel)', borderTop: '1px solid var(--r4-line)' }}>
          {apApps.map((x) => { const on = x.k === app; return (
            <button key={x.k} onClick={() => onApp(x.k)} style={{ all: 'unset', cursor: 'pointer', position: 'relative', display: 'grid', justifyItems: 'center', gap: 4, minHeight: 48, alignContent: 'center', font: `700 10px/1 var(--font-body)`, color: on ? 'var(--r4-ink)' : 'var(--r4-faint)' }}>
              <span style={{ font: '600 15px/1 var(--font-mono)', color: on ? x.c : 'var(--r4-faint)' }}>{x.g}</span>{x.name}
              {x.k === 'ntfy' && badge ? <span style={{ position: 'absolute', top: 6, right: '26%' }}><ApDot c="var(--hot)" size={7} /></span> : null}
            </button>); })}
        </nav>
      )}
    </div>
  );
}
Object.assign(window, { ApBtn, ApSection, ApRow, ApDot, ApGlyph, ApShell });
