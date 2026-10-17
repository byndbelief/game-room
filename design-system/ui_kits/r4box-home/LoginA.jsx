// 3a: pick yourself, then passkey. Password and email link are fallbacks.
function LoginA({ mobile }) {
  const { R4Mark, Avatar, Button, Field, Card } = LG;
  const [who, setWho] = React.useState(null);
  const [mode, setMode] = React.useState('pick'); // pick | pw | mail | sent | in
  const [email, setEmail] = React.useState('');
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  if (mode === 'in') return <SignedIn who={who} onBack={() => { setMode('pick'); setWho(null); cancel(); }} />;
  const pad = mobile ? 20 : 48;
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: pad, display: 'flex', flexDirection: 'column' }}>
      <LoginBg mobile={mobile} />
      <header><R4Mark /></header>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 22, maxWidth: 520 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 12px' }}>Sign in</p>
          <h1 style={{ font: `800 ${mobile ? 40 : 64}px/.98 var(--font-display)`, letterSpacing: '-.035em', margin: 0 }}>{who ? `Hi, ${who}.` : "Who's here?"}</h1>
        </div>
        {!who && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {lgFamily.map((f) => (
              <button key={f.name} onClick={() => setWho(f.name)} style={{ all: 'unset', cursor: 'pointer', padding: mobile ? '12px 16px' : '14px 20px', borderRadius: 14, background: '#ffffff0e', border: '1px solid #ffffff22', fontSize: mobile ? 14 : 15, fontWeight: 700 }}>
                {f.name}
              </button>
            ))}
          </div>
        )}
        {who && mode === 'pick' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <Button variant="primary" display onClick={go} style={{ background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--teal-ink)', width: '100%' }}>Sign in with passkey</Button>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Button variant="link" onClick={() => setMode('pw')}>Use password</Button>
              <Button variant="link" onClick={() => setMode('mail')}>Email me a link</Button>
              <Button variant="link" onClick={() => setWho(null)} style={{ marginLeft: 'auto', color: 'var(--r4-muted)' }}>Not you?</Button>
            </div>
          </div>
        )}
        {mode === 'pw' && (
          <Card as="form" onSubmit={(e) => { e.preventDefault(); setMode('in'); }}>
            <Field label="Password" type="password" placeholder="any password works here" />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><Button type="submit" variant="primary" display style={{ background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--teal-ink)' }}>Sign in</Button><Button variant="link" onClick={() => setMode('pick')}>Back</Button></div>
          </Card>
        )}
        {mode === 'mail' && (
          <Card as="form" onSubmit={(e) => { e.preventDefault(); setMode('sent'); }}>
            <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><Button type="submit" variant="primary" display style={{ background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--teal-ink)' }}>Send link</Button><Button variant="link" onClick={() => setMode('pick')}>Back</Button></div>
          </Card>
        )}
        {mode === 'sent' && <Card><p style={{ margin: 0 }}>{lgLinkSent(email || 'your inbox')}</p><Button variant="link" onClick={() => setMode('pick')}>Back</Button></Card>}
      </div>
      <PasskeySheet st={st} who={who} onCancel={cancel} />
    </div>
  );
}
window.LoginA = LoginA;
