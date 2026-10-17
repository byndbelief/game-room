const { R4Mark: LgMark, Card: LgCard, Field: LgField, Button: LgButton } = window.R4boxDesignSystem_3e3a61;

function Login({ onIn }) {
  const [u, setU] = React.useState('phoenix_lord');
  const [p, setP] = React.useState('');
  const [err, setErr] = React.useState('');
  const submit = (e) => { e.preventDefault(); if (!p) { setErr(`That username and password don't match (tried ${u}@players.r4box.com). Check the spelling and try again.`); return; } onIn(); };
  return (
    <div style={{ maxWidth: 560, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <LgMark />
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 40px)' }}>Game on</h1>
        <p style={{ color: 'var(--r4-muted)' }}>Sign in with your player name to jump into the Route to Chaos.</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 54, background: 'radial-gradient(circle at 50% 60%, #1C1640, #0B0918 75%)', boxShadow: '0 0 40px #3DD6C633' }} aria-hidden="true">🟢</div>
        <p style={{ position: 'relative', padding: '12px 16px', borderRadius: 16, background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', fontWeight: 600 }}>
          <span style={{ position: 'absolute', left: -8, top: '50%', width: 14, height: 14, background: 'var(--r4-panel)', borderLeft: '1px solid var(--r4-line)', borderBottom: '1px solid var(--r4-line)', transform: 'translateY(-50%) rotate(45deg)' }}></span>
          Hi, I'm Fig. I live in r4box. Four personalities, one curve: come and see.
        </p>
      </div>
      <LgCard as="form" onSubmit={submit}>
        <LgField label="Username" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        <LgField label="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="any password works here" />
        {err ? <p style={{ color: 'var(--hot)', fontWeight: 700 }}>{err}</p> : null}
        <div><LgButton type="submit" variant="primary" display style={{ background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--teal-ink)' }}>Sign in</LgButton></div>
      </LgCard>
    </div>
  );
}
Object.assign(window, { Login });
