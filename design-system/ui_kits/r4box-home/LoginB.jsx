// 3b: one card, every method visible. Avatars fill the username.
function LoginB({ mobile }) {
  const { R4Mark, Avatar, Button, Field, Card } = LG;
  const [u, setU] = React.useState('');
  const [mode, setMode] = React.useState('form'); // form | mail | sent | in
  const [email, setEmail] = React.useState('');
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const tealBtn = { background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--teal-ink)' };
  if (mode === 'in') return <SignedIn who={u || 'phoenix_lord'} onBack={() => { setMode('form'); cancel(); }} />;
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: mobile ? '20px 16px' : 48, display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 24 }}>
      <LoginBg mobile={mobile} strength={.7} />
      <header><R4Mark /></header>
      <div style={{ flex: 1, display: 'grid', alignContent: mobile ? 'end' : 'center', justifyItems: mobile ? 'stretch' : 'start' }}>
        <div style={{ width: mobile ? '100%' : 440, display: 'grid', gap: 16 }}>
          <h1 style={{ font: `800 ${mobile ? 32 : 44}px/1 var(--font-display)`, letterSpacing: '-.035em', margin: 0 }}>Into the box</h1>
          <Card as="form" onSubmit={(e) => { e.preventDefault(); setMode('in'); }}>
            <Field label="Username" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
            <Field label="Password" type="password" placeholder="any password works here" />
            <Button type="submit" variant="primary" display style={{ ...tealBtn, width: '100%' }}>Sign in</Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--r4-faint)', fontSize: 12 }}><span style={{ flex: 1, height: 1, background: 'var(--r4-line)' }}></span>or<span style={{ flex: 1, height: 1, background: 'var(--r4-line)' }}></span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button type="button" onClick={go}>◎ Passkey</Button>
              <Button type="button" onClick={() => setMode(mode === 'mail' ? 'form' : 'mail')}>✉ Email link</Button>
            </div>
            {mode === 'mail' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'end' }}>
                <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                <Button type="button" variant="primary" onClick={() => setMode('sent')} style={tealBtn}>Send</Button>
              </div>
            )}
            {mode === 'sent' && <p style={{ margin: 0, color: 'var(--teal)', fontWeight: 700 }}>{lgLinkSent(email || 'your inbox')}</p>}
          </Card>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--r4-muted)' }}>One sign-in for the game room and the box.</p>
        </div>
      </div>
      <PasskeySheet st={st} who={u || 'you'} onCancel={cancel} />
    </div>
  );
}
window.LoginB = LoginB;
