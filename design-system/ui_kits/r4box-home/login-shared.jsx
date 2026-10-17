const LG = window.R4boxDesignSystem_3e3a61;
const lgFamily = [
  { name: 'phoenix_lord', src: '../../assets/avatars/phoenix_lord.jpg' },
  { name: 'dad_commander' },
  { name: 'obanai_rocks' },
];
function LoginBg({ mobile, strength = .9 }) {
  const mask = mobile
    ? 'linear-gradient(180deg, #000 0%, #000 45%, #0000 80%)'
    : 'linear-gradient(180deg, transparent, #000 18%, #000 70%, transparent), linear-gradient(90deg, #0000001a 0 30%, #000 72%)';
  return <div style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: strength, maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}><LG.Bifurcation height="100%" /></div>;
}
// fake passkey / Face ID prompt: waiting → ok
function usePasskey(onDone) {
  const [st, setSt] = React.useState('idle');
  const go = () => { setSt('wait'); setTimeout(() => { setSt('ok'); setTimeout(onDone, 700); }, 1300); };
  return [st, go, () => setSt('idle')];
}
function PasskeySheet({ st, who, onCancel }) {
  if (st === 'idle') return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'end center', background: '#0B091899' }}>
      <div style={{ width: 'min(390px, 100%)', boxSizing: 'border-box', margin: 12, padding: '22px 20px 18px', borderRadius: 24, background: 'var(--r4-panel-2)', border: '1px solid var(--r4-line)', display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', fontSize: 30, border: `2px solid ${st === 'ok' ? 'var(--teal)' : 'var(--r4-line)'}`, color: st === 'ok' ? 'var(--teal)' : 'var(--r4-muted)', transition: 'all .2s' }}>{st === 'ok' ? '✓' : '◎'}</div>
        <b style={{ fontSize: 16 }}>{st === 'ok' ? 'Passkey confirmed' : 'Sign in to r4box'}</b>
        <span style={{ fontSize: 13, color: 'var(--r4-muted)' }}>{st === 'ok' ? 'Opening the box…' : `Use Face ID or your passkey for ${who}.`}</span>
        {st === 'wait' && <LG.Button variant="link" onClick={onCancel}>Cancel</LG.Button>}
      </div>
    </div>
  );
}
function SignedIn({ who, onBack }) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', gap: 14, alignContent: 'center', padding: 24 }}>
      <LG.R4Mark />
      <h1 style={{ font: '800 clamp(26px, 6vw, 40px)/1 var(--font-display)', letterSpacing: '-.035em', margin: 0 }}>Welcome back, {who}.</h1>
      <p style={{ color: 'var(--r4-muted)', margin: 0 }}>Signed in to the game room and the box.</p>
      <LG.Button variant="link" onClick={onBack}>Sign out</LG.Button>
    </div>
  );
}
const lgLinkSent = (email) => `Check ${email} for your sign-in link.`;
Object.assign(window, { LG, lgFamily, LoginBg, usePasskey, PasskeySheet, SignedIn, lgLinkSent });
