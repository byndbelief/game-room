// os, diary, ntfy screens
function OsScreen({ S, pending, setPending }) {
  const [proj, setProj] = React.useState('leanbrokers');
  const [task, setTask] = React.useState('');
  const [started, setStarted] = React.useState(null);
  const field = { width: '100%', boxSizing: 'border-box', minHeight: 44, padding: '12px 14px', font: '400 16px/1.35 var(--font-body)', color: 'var(--r4-ink)', background: '#0E0A24', border: '1px solid var(--r4-line)', borderRadius: S.rIn, outline: 'none' };
  return (<>
    {pending && (
      <div style={{ ...S.panel, borderRadius: S.r, border: `1px solid color-mix(in oklab, var(--gold) 50%, transparent)`, background: 'color-mix(in oklab, var(--gold) 9%, var(--r4-panel))', padding: 16, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '800 11px/1 var(--font-body)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--gold)' }}><ApDot c="var(--gold)" glow />Needs your OK · {apPending.left} min left</div>
        <div style={{ font: '700 18px/1.3 var(--font-display)', letterSpacing: '-.02em' }}>{apPending.what}</div>
        <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--r4-muted)' }}>from {apPending.who}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><ApBtn S={S} danger onClick={() => setPending(false)}>Deny</ApBtn><ApBtn S={S} primary onClick={() => setPending(false)}>Approve</ApBtn></div>
      </div>
    )}
    <ApSection S={S} title="Start a task">
      <form onSubmit={(e) => { e.preventDefault(); if (task.trim()) { setStarted(proj); setTask(''); } }} style={{ display: 'grid', gap: 10, padding: S.id === 'A' ? 16 : '12px 0' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {apProjects.map((p) => <button type="button" key={p.name} onClick={() => setProj(p.name)} style={{ all: 'unset', cursor: 'pointer', flex: 'none', minHeight: 34, padding: '0 12px', display: 'flex', alignItems: 'center', borderRadius: S.id === 'A' ? 99 : 6, font: '600 13px/1 var(--font-body)', background: proj === p.name ? S.accent : '#ffffff0a', color: proj === p.name ? S.accentInk : 'var(--r4-muted)' }}>{p.name}</button>)}
        </div>
        <textarea rows="3" value={task} onChange={(e) => setTask(e.target.value)} placeholder={`What should Claude do in ${proj}?`} style={{ ...field, resize: 'none' }}></textarea>
        <ApBtn S={S} primary style={{ width: '100%' }}>Start in {proj} →</ApBtn>
        {started && <span style={{ fontSize: 13, color: 'var(--teal)' }}>Started a session in {started}. It shows up below.</span>}
      </form>
    </ApSection>
    <ApSection S={S} title="Sessions" right={`${apSessions.length} running`}>
      {apSessions.map((s, i) => (
        <ApRow S={S} key={s.name} first={i === 0}>
          <ApDot c={s.state === 'working' ? 'var(--teal)' : s.state === 'your turn' ? 'var(--gold)' : 'var(--r4-faint)'} glow={s.state !== 'idle'} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}><b style={{ fontSize: 15 }}>{s.name}</b><span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}>{s.cmd}</span></div>
            <div style={{ fontSize: 13, color: s.state === 'your turn' ? 'var(--gold)' : 'var(--r4-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.now || 'Idle'} · {s.ago}</div>
          </div>
          <span style={{ color: 'var(--r4-faint)' }}>›</span>
        </ApRow>
      ))}
    </ApSection>
  </>);
}
function DiaryScreen({ S }) {
  const [f, setF] = React.useState('active');
  const list = apIdeas.filter((i) => (f === 'parked' ? i.parked : !i.parked));
  return (<>
    <div style={{ ...S.panel, borderRadius: S.r, padding: 16, display: 'grid', gap: 8 }}>
      <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}>Last night · 23:30 rollup</span>
      <div style={{ font: '700 18px/1.3 var(--font-display)', letterSpacing: '-.02em' }}>Four sessions, two ideas moved.</div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--r4-muted)' }}>LeanBrokers 2.0 shipped its pricing page. r4os agent payments branched into a card-approval flow.</p>
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      {['active', 'parked'].map((k) => <button key={k} onClick={() => setF(k)} style={{ all: 'unset', cursor: 'pointer', minHeight: 36, padding: '0 14px', display: 'flex', alignItems: 'center', borderRadius: S.id === 'A' ? 99 : 6, font: '700 13px/1 var(--font-body)', textTransform: 'capitalize', background: f === k ? '#ffffff14' : 'transparent', border: '1px solid var(--r4-line)', color: f === k ? 'var(--r4-ink)' : 'var(--r4-muted)' }}>{k}</button>)}
    </div>
    <ApSection S={S} title="Ideas" right={`${list.length}`}>
      {list.map((i, n) => (
        <ApRow S={S} key={i.title} first={n === 0}>
          <ApDot c={i.parked ? 'var(--r4-faint)' : apStageCol[i.stage]} size={10} glow={!i.parked} />
          <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 15, display: 'block' }}>{i.title}</b><span style={{ fontSize: 12, color: 'var(--r4-faint)' }}>{i.stage} · {i.last} ago</span></div>
          <span style={{ color: 'var(--r4-faint)' }}>›</span>
        </ApRow>
      ))}
    </ApSection>
  </>);
}
function NtfyScreen({ S, pending, setPending }) {
  const notes = pending ? apNotes : apNotes.filter((n) => !n.approve);
  return (<>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {['r4-alerts', 'r4-diary'].map((t) => <span key={t} style={{ minHeight: 30, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: S.id === 'A' ? 99 : 6, font: '600 12px/1 var(--font-mono)', border: '1px solid var(--r4-line)', color: 'var(--r4-muted)' }}><ApDot c="var(--teal)" size={6} />{t}</span>)}
    </div>
    <ApSection S={S} title="Today" right={`${notes.length}`}>
      {notes.map((n, i) => (
        <ApRow S={S} key={n.t} first={i === 0} style={{ alignItems: 'flex-start' }}>
          <span style={{ marginTop: 6 }}><ApDot c={n.c} glow /></span>
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}><b style={{ fontSize: 15 }}>{n.t}</b><span style={{ marginLeft: 'auto', font: '500 11px/1 var(--font-mono)', color: 'var(--r4-faint)' }}>{n.ago}</span></div>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: 'var(--r4-muted)' }}>{n.b}</span>
            {n.approve && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}><ApBtn S={S} danger onClick={() => setPending(false)}>Deny</ApBtn><ApBtn S={S} primary onClick={() => setPending(false)}>Approve</ApBtn></div>}
          </div>
        </ApRow>
      ))}
    </ApSection>
  </>);
}
Object.assign(window, { OsScreen, DiaryScreen, NtfyScreen });
