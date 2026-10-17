// 3c: one smart field. A family name offers passkey (or password); an email gets a link.
function LoginC({ mobile }) {
  const { R4Mark, Avatar, Button, Field } = LG;
  const [v, setV] = React.useState('');
  const [mode, setMode] = React.useState('ask'); // ask | pw | sent | in
  const [st, go, cancel] = usePasskey(() => setMode('in'));
  const fam = lgFamily.find((f) => f.name === v.trim().toLowerCase());
  const isEmail = /.+@.+\..+/.test(v);
  const tealBtn = { background: 'var(--teal)', borderColor: 'var(--teal)', color: 'var(--teal-ink)', width: '100%' };
  const input = { width: '100%', boxSizing: 'border-box', padding: '16px 20px', font: '400 17px/1.2 var(--font-body)', color: 'var(--r4-ink)', background: 'var(--r4-panel)', border: '1.5px solid var(--r4-line)', borderRadius: 14, outline: 'none' };
  if (mode === 'in') return <SignedIn who={fam ? fam.name : v} onBack={() => { setMode('ask'); setV(''); cancel(); }} />;
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: '100%', boxSizing: 'border-box', padding: mobile ? '20px 16px 28px' : '20px 28px 28px', display: 'flex', flexDirection: 'column' }}>
      <LoginBg mobile={mobile} strength={.55} />
      <header><R4Mark /></header>
      <div style={{ flex: 1, display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 18 }}>
        <h1 style={{ font: `800 ${mobile ? 34 : 52}px/1 var(--font-display)`, letterSpacing: '-.035em', margin: 0, textAlign: 'center' }}>{fam ? `Hi, ${fam.name}.` : "Who's there?"}</h1>
        <div style={{ width: 'min(420px, 100%)', display: 'grid', gap: 12 }}>
          {mode !== 'sent' && <input value={v} onChange={(e) => { setV(e.target.value); setMode('ask'); }} placeholder="Your name or email" autoComplete="username" style={input} />}
          {!v && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {lgFamily.map((f) => <button key={f.name} onClick={() => setV(f.name)} style={{ all: 'unset', cursor: 'pointer', padding: '7px 14px', borderRadius: 999, background: '#ffffff0e', border: '1px solid #ffffff22', fontSize: 13, fontWeight: 700 }}>{f.name}</button>)}
            </div>
          )}
          {fam && mode === 'ask' && <><Button variant="primary" display onClick={go} style={tealBtn}>Continue with passkey</Button><Button variant="link" onClick={() => setMode('pw')} style={{ justifySelf: 'center' }}>Use password instead</Button></>}
          {fam && mode === 'pw' && <form onSubmit={(e) => { e.preventDefault(); setMode('in'); }} style={{ display: 'grid', gap: 12 }}><Field label="Password" type="password" placeholder="any password works here" /><Button type="submit" variant="primary" display style={tealBtn}>Sign in</Button></form>}
          {isEmail && mode === 'ask' && <Button variant="primary" display onClick={() => setMode('sent')} style={tealBtn}>Email me a link</Button>}
          {mode === 'sent' && <div style={{ textAlign: 'center', display: 'grid', gap: 8 }}><p style={{ margin: 0 }}>{lgLinkSent(v)}</p><Button variant="link" onClick={() => setMode('ask')}>Use a different address</Button></div>}
          {v && !fam && !isEmail && <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: 'var(--r4-muted)' }}>Type a player name or an email address.</p>}
        </div>
      </div>
      <PasskeySheet st={st} who={fam ? fam.name : ''} onCancel={cancel} />
    </div>
  );
}
window.LoginC = LoginC;
