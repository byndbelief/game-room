// term, code, browser screens
function TermScreen({ S }) {
  const [tab, setTab] = React.useState('leanbrokers');
  const [lines, setLines] = React.useState(apTerm);
  const [v, setV] = React.useState('');
  const col = { dim: 'var(--r4-faint)', ink: 'var(--r4-ink)', teal: 'var(--teal)', gold: 'var(--gold)' };
  const key = { all: 'unset', cursor: 'pointer', flex: 'none', minWidth: 44, minHeight: 40, display: 'grid', placeItems: 'center', padding: '0 10px', borderRadius: S.rIn, font: '600 13px/1 var(--font-mono)', background: '#ffffff0c', border: '1px solid var(--r4-line)', color: 'var(--r4-muted)', boxSizing: 'border-box' };
  return (<>
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
      {apSessions.map((s) => <button key={s.name} onClick={() => setTab(s.name)} style={{ ...key, color: tab === s.name ? 'var(--r4-ink)' : 'var(--r4-muted)', background: tab === s.name ? '#ffffff16' : 'transparent' }}>{s.name}</button>)}
      <button style={key} aria-label="New session">+</button>
    </div>
    <div style={{ background: '#07060F', border: '1px solid var(--r4-line)', borderRadius: S.r, padding: 14, minHeight: 330, display: 'grid', alignContent: 'start', gap: 6, font: '400 13px/1.5 var(--font-mono)' }}>
      {lines.map(([c, t], i) => <div key={i} style={{ color: col[c], overflowWrap: 'anywhere' }}>{t}</div>)}
      <div style={{ display: 'flex', gap: 6, color: 'var(--r4-ink)' }}><span style={{ color: 'var(--mint)' }}>›</span>{v}<span style={{ width: 8, height: 16, background: 'var(--mint)', opacity: .8 }}></span></div>
    </div>
    <form onSubmit={(e) => { e.preventDefault(); if (v) { setLines((l) => [...l, ['dim', '› ' + v]]); setV(''); } }} style={{ display: 'grid', gap: 8 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Type to the session…" autoCapitalize="off" autoCorrect="off" style={{ minHeight: 44, padding: '0 14px', font: '400 16px/1 var(--font-mono)', color: 'var(--r4-ink)', background: '#0E0A24', border: '1px solid var(--r4-line)', borderRadius: S.rIn, outline: 'none' }} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['esc', 'tab', 'ctrl', '↑', '↓', '←', '→', 'y', 'n'].map((k) => <button type="button" key={k} onClick={() => (k === 'y' || k === 'n') && setLines((l) => [...l, ['teal', k === 'y' ? '✓ Committed: update pricing copy' : '✗ Skipped commit']])} style={key}>{k}</button>)}
      </div>
    </form>
  </>);
}
function CodeScreen({ S }) {
  const [open, setOpen] = React.useState(null);
  return (<>
    <ApSection S={S} title="Projects" right="code-server">
      {apProjects.map((p, i) => (
        <ApRow S={S} key={p.name} first={i === 0} onClick={() => setOpen(p.name)}>
          <span style={{ font: '600 14px/1 var(--font-mono)', color: 'var(--violet)' }}>{'{ }'}</span>
          <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 15, display: 'block' }}>{p.name}</b><span style={{ font: '500 11px/1.4 var(--font-mono)', color: 'var(--r4-faint)' }}>{p.path} · {p.branch}</span></div>
          {p.dirty ? <span style={{ font: '700 11px/1 var(--font-mono)', color: 'var(--gold)', padding: '5px 8px', borderRadius: 6, background: 'color-mix(in oklab, var(--gold) 14%, transparent)' }}>{p.dirty} changed</span> : <span style={{ fontSize: 12, color: 'var(--r4-faint)' }}>clean</span>}
        </ApRow>
      ))}
    </ApSection>
    {open && (
      <div style={{ ...S.panel, borderRadius: S.r, padding: 16, display: 'grid', gap: 12 }}>
        <b style={{ font: '700 17px/1.2 var(--font-display)' }}>Open {open}</b>
        <span style={{ fontSize: 14, color: 'var(--r4-muted)' }}>The editor is easier with a keyboard. On a phone, review the changes here or hand off to a session.</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><ApBtn S={S} onClick={() => setOpen(null)}>Review diff</ApBtn><ApBtn S={S} primary onClick={() => setOpen(null)}>Open editor</ApBtn></div>
      </div>
    )}
  </>);
}
function BrowserScreen({ S }) {
  const [mode, setMode] = React.useState('watch');
  return (<>
    <div style={{ border: '1px solid var(--r4-line)', borderRadius: S.r, overflow: 'hidden', background: '#07060F' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--r4-line)' }}>
        <ApDot c={mode === 'watch' ? 'var(--hot)' : 'var(--teal)'} glow />
        <span style={{ flex: 1, minWidth: 0, font: '500 12px/1 var(--font-mono)', color: 'var(--r4-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>leanbrokers.com/pricing</span>
        <span style={{ font: '700 10px/1 var(--font-body)', letterSpacing: '.14em', textTransform: 'uppercase', color: mode === 'watch' ? 'var(--hot)' : 'var(--teal)' }}>{mode === 'watch' ? 'Agent driving' : 'You’re driving'}</span>
      </div>
      <div style={{ aspectRatio: '3 / 4', display: 'grid', placeItems: 'center', color: 'var(--r4-faint)', fontSize: 13, textAlign: 'center', padding: 20, backgroundImage: 'repeating-linear-gradient(45deg, #ffffff05 0 10px, transparent 10px 20px)' }}>Live view of the agent’s browser<br />(noVNC stream)</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <ApBtn S={S} onClick={() => setMode('watch')} style={mode === 'watch' ? { background: '#ffffff16' } : {}}>Watch</ApBtn>
      <ApBtn S={S} primary={mode !== 'watch'} onClick={() => setMode('drive')}>Take over</ApBtn>
    </div>
    <ApSection S={S} title="Steps">
      {apSteps.map(([g, t, ago], i) => <ApRow S={S} key={t} first={i === 0}><span style={{ width: 20, textAlign: 'center', color: 'var(--r4-muted)' }}>{g}</span><span style={{ flex: 1, fontSize: 14 }}>{t}</span><span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}>{ago}</span></ApRow>)}
    </ApSection>
  </>);
}
Object.assign(window, { TermScreen, CodeScreen, BrowserScreen });
