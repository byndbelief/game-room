const { R4Mark, Avatar, Bifurcation, EnterButton, Chip, BotStep, Segmented, UpCard, QuickEntry, GameRow, Pill, Card, LiveDot, GameCard } = window.R4boxDesignSystem_3e3a61;

const lobbyS = {
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--violet)' },
  h2: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, lineHeight: 1.1, letterSpacing: '-.01em', margin: 0 },
  muted: { color: 'var(--r4-muted)', fontSize: 13 },
};

function HereNow() {
  const fam = [['phoenix_lord', true, '../../assets/avatars/phoenix_lord.jpg'], ['dad_commander', true], ['obanai_rocks', false]];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <span style={{ alignSelf: 'center', fontSize: 12, fontWeight: 800, color: 'var(--r4-muted)' }}><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3DDC84', marginRight: 6, boxShadow: '0 0 0 3px #3DDC8433', animation: 'r4-pulse 1.8s ease-in-out infinite' }}></i>Here now</span>
      {fam.map(([n, on, src]) => (
        <span key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 46 }}>
          <Avatar name={n} src={src} online={on} />
          <small style={{ fontSize: 11, lineHeight: 1.1, color: on ? '#3DDC84' : 'var(--r4-muted)', fontWeight: on ? 800 : 400 }}>{n === 'phoenix_lord' ? 'You' : n}</small>
        </span>
      ))}
    </div>
  );
}

function BoxHero() {
  const [open, setOpen] = React.useState(false);
  const [opp, setOpp] = React.useState({ dad_commander: true });
  const [bots, setBots] = React.useState(0);
  const [rounds, setRounds] = React.useState(5);
  const any = Object.values(opp).some(Boolean) || bots > 0;
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--grad-box)', border: '1px solid var(--r4-line)', boxShadow: 'var(--shadow-hero)' }}>
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', padding: 1.5, pointerEvents: 'none', background: 'var(--grad-hero-border)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', background: '#0B0918', boxShadow: '0 0 0 1px #ffffff12, 0 10px 30px #0008', aspectRatio: '12 / 5', maxHeight: 320 }}><Bifurcation height={'100%'} /></div>
        <div>
          <span style={lobbyS.eyebrow}>The Box · chaos · symmetry · fractals · fibonacci</span>
          <h2 style={{ ...lobbyS.h2, fontSize: 'clamp(22px, 5vw, 30px)', margin: '4px 0 0' }}>Route to Chaos</h2>
          <p style={{ ...lobbyS.muted, margin: '4px 0 10px' }}><span>This is Fig's mind.</span> Every game here runs on one curve, x → r·x·(1−x): its mood. A Chaos is rounds of the games against your rivals, wilder as r climbs; win the most rounds for the crown, and the next Chaos starts on its own. The games are won by playing Chaos.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><EnterButton onClick={() => setOpen(true)}>Enter Chaos 🌀</EnterButton><EnterButton alt>🧬 Solo run</EnterButton></div>
          <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '6px 14px 6px 6px', borderRadius: 99, background: '#ffffff0a', border: '1px solid #ffffff18', color: 'var(--r4-ink)', textDecoration: 'none' }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 22, background: 'radial-gradient(circle at 50% 60%, #1C1640, #0B0918 75%)' }}>🟢</span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}><b style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>Fig</b><small style={{ fontSize: 12, color: 'var(--r4-muted)' }}>lives here · meet its four personalities ›</small></span>
          </a>
        </div>
      </div>
      <div style={{ borderRadius: 14, background: '#ffffff08', border: '1px solid #ffffff10' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'none', border: 0, cursor: 'pointer', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12, color: 'var(--violet)', font: 'inherit' }}>
          <span style={{ fontWeight: 800, letterSpacing: '.08em', fontSize: 12 }}>➕ Start a rivalry</span><span style={{ fontSize: 20, lineHeight: 1, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', color: 'var(--r4-ink)' }}>›</span>
        </button>
        {open ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px 12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['dad_commander', 'obanai_rocks'].map((n) => <Chip key={n} tone="gold" pressed={!!opp[n]} onClick={() => setOpp({ ...opp, [n]: !opp[n] })} style={opp[n] ? {} : { background: '#ffffff0c', borderColor: '#ffffff22' }}>{n}</Chip>)}
              <BotStep value={bots} max={3} onChange={setBots} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Segmented options={[3, 5, 7].map((r) => ({ value: r, label: r + ' rounds' }))} value={rounds} onChange={setRounds} />
              <button disabled={!any} style={{ marginLeft: 'auto', minHeight: 46, padding: '0 22px', borderRadius: 99, border: 0, background: 'linear-gradient(180deg, #FFD77A, #F5C542)', color: 'var(--gold-ink)', fontFamily: 'var(--font-display)', fontSize: 16, boxShadow: '0 8px 22px #F5C54233', cursor: 'pointer', opacity: any ? 1 : .5 }}>Start 🏆</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function YourMove({ onOpen }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={lobbyS.h2}>Your move <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: '1.6em', height: '1.6em', padding: '0 .4em', borderRadius: 99, background: 'var(--gold)', color: 'var(--gold-ink)', font: '700 .7em/1 var(--font-body)', verticalAlign: 'middle' }}>2</span></h2>
      </div>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'min(46%, 300px)', gap: 12, overflowX: 'auto', padding: '4px 2px 10px' }}>
        <UpCard kind="battleship" title="⚓ Battleship" vs="vs dad_commander, admiral_bot" sub="3 shots per turn · 🌊 shared ocean" clock="Chaos in 3h" href="#" onClick={(e) => { e.preventDefault(); onOpen('battleship'); }} />
        <UpCard kind="golf" title="⛳ Putt Post" vs="vs obanai_rocks" sub="Hole 7 of 18 · you lead by 2" clock="Chaos in 9h" />
      </div>
    </section>
  );
}

function SideRail({ go }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      <QuickEntry icon="🏅" title="Family scoreboard" sub="All-time titles, wins, streaks and bragging rights" href="#" onClick={(e) => { e.preventDefault(); go('stats'); }} />
      <QuickEntry icon="🎨" title="Design Studio" sub="Fig's four personalities, live: poke them" />
      <QuickEntry icon="🎯" title="Practice" sub="One game on its own, off the Route to Chaos: it still feeds your chaos rating" href="#" onClick={(e) => { e.preventDefault(); go('quick'); }} />
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={lobbyS.h2}>Your games</h2><LiveDot /></div>
        <span style={lobbyS.eyebrow}>Waiting on others (2)</span>
        <GameRow kind="duel" title="💥 Hilltop Duel" vs="vs phoenix_lord" sub="dad_commander's turn · wind 4 →" pill={<Pill tone="wait">Their turn</Pill>} />
        <GameRow kind="cards" title="🃏 Chaos Cards" vs="vs obanai_rocks, admiral_bot" sub="You hold 3 cards" pill={<Pill tone="chaos">Round 2 of 5: 🃏</Pill>} progress={.4} />
        <span style={{ ...lobbyS.eyebrow, marginTop: 6 }}>Finished (1)</span>
        <GameRow over kind="war" title="⚔️ War" vs="vs dad_commander" sub="👑 You won" pill={<Pill tone="done">Over</Pill>} />
      </section>
      <Card>
        <h2 style={lobbyS.h2}>🎒 Backpack</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['📡', 'Sonar Ping', 'Battleship: ping a 3×3 patch'], ['🏌️', 'Golden Tee', 'Putt Post: a perfect first stroke'], ['📜', 'Curse Scroll', 'Hex anyone, from the lobby']].map(([i, n, d]) => <li key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 26, lineHeight: 1 }}>{i}</span><span><strong>{n}</strong><br /><span style={lobbyS.muted}>{d}</span></span></li>)}
        </ul>
      </Card>
      <Card>
        <h2 style={lobbyS.h2}>🌀 Chaos</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['☄️', 'Meteor shower', 'hit Hilltop Duel: three craters in the hills', true], ['📜', 'dad_commander cursed you', 'in Putt Post: next hole is foggy'], ['🎆', 'You found a Double Salvo', 'for sinking a cruiser']].map(([i, n, d, nw]) => <li key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: nw ? 700 : 400 }}><span style={{ fontSize: 26, lineHeight: 1, filter: nw ? 'drop-shadow(0 0 6px #F2C230)' : 'none' }}>{i}</span><span><strong>{n}</strong><br /><span style={{ ...lobbyS.muted, fontWeight: 400 }}>{d}</span></span></li>)}
        </ul>
      </Card>
    </div>
  );
}

function Lobby({ go }) {
  return (
    <div style={{ maxWidth: 1320, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', columnGap: 28, rowGap: 20, alignItems: 'start' }}>
      <header style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, paddingBottom: 6, borderBottom: '1px solid var(--r4-line)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}><R4Mark /><h1 style={{ fontSize: 'clamp(22px, 5.5vw, 34px)', margin: '6px 0 6px' }}>Ready to get wild, phoenix_lord?</h1></div>
        <HereNow />
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <BoxHero />
        <YourMove onOpen={() => go('battleship')} />
      </div>
      <SideRail go={go} />
    </div>
  );
}

const KINDS = [['battleship', '⚓ Battleship', 'Hide your fleet, hunt theirs. Peeking is allowed.', '2–3 players'], ['golf', '⛳ Putt Post', '🧘 Calm within the chaos: 18 wild holes, sneak attacks and mulligans.', 'Solo or up to 4 · 🧘 calm'], ['duel', '💥 Hilltop Duel', '🧘 Calm within the chaos: tanks on hills. Mind the wind. Up to 4 in a free-for-all.', '2–4 players · 🧘 calm'], ['cards', '🃏 Chaos Cards', '🧘 Calm within the chaos: match colours, dump your hand. Chaos cards and card storms.', '2–4 players · 🧘 calm'], ['war', '⚔️ War', 'Flip, flip, WAR! Highest card takes the lot. Pure chaos, no mercy.', '2–4 players']];
function Practice({ go }) {
  const [k, setK] = React.useState(null);
  return (
    <div style={{ maxWidth: 980, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><a href="#" onClick={(e) => { e.preventDefault(); go('lobby'); }} style={{ fontWeight: 700 }}>← r4box</a><h1 style={{ fontSize: 'clamp(28px, 7vw, 40px)' }}>Practice</h1><p style={{ color: 'var(--r4-muted)' }}>One game on its own, off the Route to Chaos. One of each kind per group of players at a time. It still counts toward your chaos rating.</p></div>
      <h2 style={lobbyS.h2}>Pick a game</h2>
      <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
        {KINDS.map(([kind, n, b, w]) => <GameCard key={kind} kind={kind} name={n} blurb={b} who={w} checked={k === kind} onClick={() => setK(kind)} />)}
      </div>
    </div>
  );
}

Object.assign(window, { Lobby, Practice });
