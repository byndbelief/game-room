const { R4Mark: HmMark, Bifurcation: HmBif, EnterButton: HmCta, GamesDoor: HmDoor, HubTile: HmTile } = window.R4boxDesignSystem_3e3a61;

const homeS = {
  wrap: { width: 'min(1100px, 100% - 32px)', marginInline: 'auto' },
  h2: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3.4vw, 30px)', letterSpacing: '-.02em', margin: 0 },
  note: { color: 'var(--r4-muted)', fontSize: 14, margin: 0 },
  dot: (c) => ({ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8, verticalAlign: 1, background: c }),
  head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
};

function XValue() {
  const [x, setX] = React.useState(() => Math.random() * .8 + .1);
  React.useEffect(() => { const t = setInterval(() => setX((v) => { let n = 4 * v * (1 - v); if (n < 1e-6 || n > 1 - 1e-6) n = Math.random(); return n; }), 500); return () => clearInterval(t); }, []);
  return <div title="the curve itself, x → 4x(1 − x), one step every half second" style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--r4-muted)', padding: '8px 12px', border: '1px solid var(--r4-line)', borderRadius: 99, background: '#ffffff06', whiteSpace: 'nowrap' }}>x = <b style={{ color: 'var(--teal)', fontWeight: 600, display: 'inline-block', minWidth: '6.5ch' }}>{x.toFixed(4)}</b></div>;
}

function Hero() {
  const mask = 'linear-gradient(180deg, transparent, #000 18%, #000 70%, transparent), linear-gradient(90deg, #0000001a 0 30%, #000 72%)';
  return (
    <div style={{ position: 'relative', isolation: 'isolate', padding: 'clamp(40px, 9vw, 110px) 0 clamp(56px, 10vw, 120px)' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: .9, maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }}><HmBif height="100%" /></div>
      <p style={{ fontWeight: 800, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 18px' }}>r = 4 · <span style={{ textTransform: 'none', fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>x → r·x(1 − x)</span></p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(38px, 8.4vw, 92px)', lineHeight: .98, letterSpacing: '-.035em', margin: 0, maxWidth: '11ch' }}>Order, right up to <em style={{ fontStyle: 'normal', background: 'var(--grad-curve)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>the edge of chaos.</em></h1>
      <p style={{ color: 'var(--r4-muted)', fontSize: 'clamp(16px, 2.1vw, 19px)', maxWidth: '34ch', margin: '22px 0 34px' }}>The family game room, and the box that runs everything else. Turn r up to 4 and see what happens.</p>
      <HmCta size="lg" href="https://games.r4box.com/" style={{ background: 'var(--teal)', color: '#062A26' }}>Play <span>→</span></HmCta>
    </div>
  );
}

const GAMES = [['⚓', 'Battleship'], ['⛳', 'Putt Post'], ['💥', 'Hilltop Duel'], ['🃏', 'Chaos Cards'], ['⚔️', 'War'], ['🏆', 'The Gauntlet'], ['🏁', 'Rally', 1], ['🕹️', 'Pinball, Squirrel, Run…', 1]].map(([icon, name, a]) => ({ icon, name, arcade: !!a }));
const HUB = [
  ['◎', 'os', 'Start a task, approve what Claude wants to do, see the approvals log.', 'os.r4box.com', 'var(--teal)'],
  ['✎', 'diary', 'Clearing: every session written up nightly, and the ideas they grow.', 'diary.r4box.com', 'var(--gold)'],
  ['›_', 'term', 'A shell on the box, in the browser.', 'term.r4box.com', 'var(--mint)'],
  ['{ }', 'code', 'The editor, with every project checked out.', 'code.r4box.com', 'var(--violet)'],
  ['◫', 'browser', 'Watch, or take over, the browser the agent drives.', 'browser.r4box.com', 'var(--hot)'],
  ['◉', 'ntfy', 'The notification relay that reaches the phone.', 'ntfy.r4box.com', 'var(--gold)'],
];

function Home() {
  return (
    <div style={homeS.wrap}>
      <header style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0' }}><HmMark href="./" /><XValue /></header>
      <Hero />
      <section style={{ padding: '28px 0 56px' }}>
        <div style={homeS.head}><h2 style={homeS.h2}>Game room</h2><p style={homeS.note}><span style={homeS.dot('var(--teal)')}></span>Open to the family, anywhere</p></div>
        <HmDoor href="https://games.r4box.com/" desc="Live turn-based games for three players and a few robots. Cheating is allowed, catching a cheater pays, and Fig is watching." games={GAMES} />
      </section>
      <section style={{ padding: '28px 0 56px' }}>
        <div style={homeS.head}><h2 style={homeS.h2}>The box</h2><p style={homeS.note}><span style={homeS.dot('var(--violet)')}></span>Tailnet only: these open from our own devices, nowhere else</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
          {HUB.map(([g, t, d, h, c]) => <HmTile key={t} glyph={g} title={t} desc={d} host={h} color={c} href={'https://' + h + '/'} />)}
        </div>
      </section>
      <footer style={{ padding: '30px 0 40px', color: 'var(--r4-faint)', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderTop: '1px solid #ffffff10' }}>
        <span>r4box · at r = 4 the curve never settles, and never repeats</span><i style={{ fontStyle: 'normal', fontFamily: 'var(--font-mono)' }}>3.5699… → chaos</i>
      </footer>
    </div>
  );
}
Object.assign(window, { Home });
