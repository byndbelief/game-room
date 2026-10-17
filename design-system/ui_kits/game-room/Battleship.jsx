const { Board: BsBoard, Button: BsButton, Card: BsCard, LiveDot: BsLive, Stamp: BsStamp, Status: BsStatus, Pill: BsPill } = window.R4boxDesignSystem_3e3a61;

const bsS = {
  h2: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, lineHeight: 1.1, margin: 0 },
  pdot: (c) => ({ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: '0 0 0 1.5px #fff9', marginRight: 5, verticalAlign: 'middle' }),
};
const SHIPS = { B3: 1, B4: 1, B5: 1, B6: 1, F8: 1, G8: 1, H8: 1, D2: 1, E2: 1 };
const MINE = { A1: 'ship', A2: 'ship', A3: 'ship', A4: 'ship', A5: 'ship', D6: 'ship', E6: 'ship', F6: 'ship', H2: 'ship', H3: 'ship', I9: 'ship', J9: 'ship', C4: 'miss', E6x: null, G1: 'miss', D6h: null };
MINE.D6 = 'hit';

function FleetList({ gone = [] }) {
  const ships = [['Carrier', 5], ['Battleship', 4], ['Cruiser', 3], ['Submarine', 3], ['Destroyer', 2]];
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 13 }}>{ships.map(([n, l]) => <span key={n} style={{ border: '1px solid var(--r4-line)', borderRadius: 999, padding: '2px 10px', textDecoration: gone.includes(n) ? 'line-through' : 'none', color: gone.includes(n) ? 'var(--r4-muted)' : 'inherit' }}>{n} · {l}</span>)}</div>;
}

function Battleship({ go }) {
  const [theirs, setTheirs] = React.useState({ D7: 'miss', E2: 'hit', C9: 'miss', H1: 'miss' });
  const [aim, setAim] = React.useState([]);
  const [stamp, setStamp] = React.useState(null);
  const [feed, setFeed] = React.useState([['dad_commander fired at C4: miss', false], ['dad_commander hit your cruiser at D6', true], ['You hit at E2', true]]);
  const [cheats, setCheats] = React.useState(2);
  const [peek, setPeek] = React.useState(false);
  const per = 3;
  const cells = { ...theirs }; aim.forEach((k) => { cells[k] = 'aim'; });
  const onCell = (k) => {
    if (theirs[k]) return;
    if (peek) { const nt = { ...theirs }; if (SHIPS[k]) nt[k] = 'peek'; setTheirs(nt); setPeek(false); setCheats(cheats - 1); return; }
    setAim(aim.includes(k) ? aim.filter((x) => x !== k) : aim.length < per ? [...aim, k] : aim);
  };
  const fire = () => {
    const nt = { ...theirs }; let hits = 0; const lines = [];
    aim.forEach((k) => { if (SHIPS[k]) { nt[k] = 'hit'; hits++; lines.push(['You hit at ' + k, true]); } else { nt[k] = 'miss'; lines.push(['You fired at ' + k + ': miss', false]); } });
    setTheirs(nt); setAim([]); setFeed([...lines.reverse(), ...feed]);
    setStamp(hits ? ['gold', hits > 1 ? 'DOUBLE HIT!' : 'HIT!'] : ['blue', 'SPLASH']);
    setTimeout(() => setStamp(null), 2400);
  };
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 120 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
          <BsButton variant="link" onClick={() => go('lobby')}>← r4box</BsButton><BsLive />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 40px)' }}>Your turn</h1>
        <p style={{ color: 'var(--r4-muted)' }}>Pick {per} squares on dad_commander's board, then fire.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--gold)', background: 'var(--gold)', color: 'var(--gold-ink)', borderRadius: 999, padding: '4px 12px', fontWeight: 700, fontSize: 14 }}><i style={bsS.pdot('#3DD6C6')}></i>You</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--r4-line)', borderRadius: 999, padding: '4px 12px', fontWeight: 700, fontSize: 14 }}><i style={bsS.pdot('#FF5A4A')}></i>dad_commander</span>
        </div>
      </header>
      <section style={{ border: '1.5px dashed #D8403A99', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: 'color-mix(in srgb, var(--hot-soft) 45%, var(--r4-panel))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ ...bsS.h2, color: 'var(--hot)' }}>Cheat (if you dare)</h2><span style={{ fontSize: 13 }}>{'🃏'.repeat(cheats) || '—'} {cheats} left this game</span></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BsButton disabled={!cheats} aria-pressed={peek} onClick={() => setPeek(!peek)} style={peek ? { borderColor: '#B37BFF', boxShadow: '0 0 0 2px #B37BFF55' } : {}}>👀 Peek</BsButton>
          <BsButton disabled={!cheats}>➕ Extra shot</BsButton>
          <BsButton disabled={!cheats}>🚢 Sneak a ship away</BsButton>
        </div>
        <p style={{ color: 'var(--r4-muted)', fontSize: 13 }}>{peek ? 'Tap any square on an opponent’s board to spy on the 3×3 patch around it.' : 'Anyone can call cheater after your turn. Caught: you lose your next turn.'}</p>
      </section>
      {peek ? <BsStatus>👀 Tap a square on an opponent's board to peek.</BsStatus> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
        <BsCard selected={aim.length > 0}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={bsS.h2}><i style={bsS.pdot('#FF5A4A')}></i>dad_commander's waters</h2></div>
          <BsBoard cells={cells} onCell={onCell} />
          <FleetList />
        </BsCard>
        <BsCard>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={bsS.h2}>Your fleet</h2></div>
          <BsBoard cells={MINE} />
          <FleetList />
          <p style={{ color: 'var(--r4-muted)', fontSize: 13 }}>Yellow outlines mark the latest shots.</p>
        </BsCard>
      </div>
      <BsCard>
        <h2 style={bsS.h2}>Latest shots</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>{feed.slice(0, 6).map(([t, h], i) => <li key={i} style={{ borderLeft: '3px solid ' + (h ? 'var(--hot)' : 'var(--r4-line)'), paddingLeft: 10 }}>{t}</li>)}</ul>
      </BsCard>
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 16, width: 'min(900px, calc(100vw - 48px))', zIndex: 5, background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', borderRadius: 18, boxShadow: '0 14px 34px #0003', padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ display: 'flex', gap: 5 }}>{Array.from({ length: per }).map((_, i) => <i key={i} style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--hot)', background: i < aim.length ? 'var(--hot)' : 'transparent' }}></i>)}</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{aim.length ? 'Aiming at ' + aim.join(', ') : 'Tap ' + per + ' squares to aim'}</span>
        </span>
        <span style={{ fontSize: 14, color: 'var(--r4-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>🎒 <BsButton size="sm">📡 Sonar Ping</BsButton><BsButton size="sm">🎆 Double Salvo</BsButton></span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{aim.length ? <BsButton variant="link" onClick={() => setAim([])}>Clear</BsButton> : null}<BsButton variant="fire" disabled={aim.length < per} onClick={fire}>Fire!</BsButton></span>
      </div>
      {stamp ? <div style={{ position: 'fixed', inset: 0, zIndex: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><BsStamp tone={stamp[0]}>{stamp[1]}</BsStamp></div> : null}
    </div>
  );
}
Object.assign(window, { Battleship });
