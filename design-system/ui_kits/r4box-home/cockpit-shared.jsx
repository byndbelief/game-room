const CK = window.R4boxDesignSystem_3e3a61;
const ckGames = [['⚓', 'Battleship'], ['⛳', 'Putt Post'], ['💥', 'Hilltop Duel'], ['🃏', 'Chaos Cards'], ['⚔️', 'War'], ['🏆', 'The Gauntlet'], ['🏁', 'Rally'], ['🕹️', 'Arcade']];
const ckHub = [
  { g: '◎', t: 'os', d: 'Start a task, approve what Claude wants to do, see the approvals log.', h: 'os.r4box.com', c: 'var(--teal)' },
  { g: '✎', t: 'diary', d: 'Clearing: every session written up nightly, and the ideas they grow.', h: 'diary.r4box.com', c: 'var(--gold)' },
  { g: '›_', t: 'term', d: 'A shell on the box, in the browser.', h: 'term.r4box.com', c: 'var(--mint)' },
  { g: '{ }', t: 'code', d: 'The editor, with every project checked out.', h: 'code.r4box.com', c: 'var(--violet)' },
  { g: '◫', t: 'browser', d: 'Watch, or take over, the browser the agent drives.', h: 'browser.r4box.com', c: 'var(--hot)' },
  { g: '◉', t: 'ntfy', d: 'The notification relay that reaches the phone.', h: 'ntfy.r4box.com', c: 'var(--gold)' },
];
function useLogistic(ms = 500) {
  const [x, setX] = React.useState(() => Math.random() * .8 + .1);
  React.useEffect(() => { const t = setInterval(() => setX((v) => { let n = 4 * v * (1 - v); if (n < 1e-6 || n > 1 - 1e-6) n = Math.random(); return n; }), ms); return () => clearInterval(t); }, [ms]);
  return x;
}
function ckClock() {
  const [d, setD] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setD(new Date()), 1000); return () => clearInterval(t); }, []);
  return d;
}
const ckGlyph = (c, size = 40) => ({ width: size, height: size, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 12, font: `600 ${size * .4}px/1 var(--font-mono)`, color: c, background: `color-mix(in oklab, ${c} 14%, transparent)` });
const ckEyebrow = { fontWeight: 800, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--violet)', margin: 0 };
const ckTreePalette = { '--bark': '#3A335F', '--c-park': '#4A4470', '--c-growth': '#B9A6FF', '--c-turn': '#FF5A4A', '--c-close': '#3DD6C6', '--accent': '#F5C542', '--ground': '#0B0918' };
const ckTreeFlow = { colors: ['#3DD6C6', '#C9FFF8', '#B9A6FF', '#F5C542', '#FF5A4A'], wave: 120, speed: .45, tail: 2.6 };
const CK_DIARY_URL = 'https://diary.r4box.com/data.json';
let ckDiaryLive = null;
function useDiaryData() {
  const [d, setD] = React.useState(ckDiaryLive || window.CLEARING_DATA);
  React.useEffect(() => {
    if (ckDiaryLive) return;
    const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 4000);
    fetch(CK_DIARY_URL, { cache: 'no-store', signal: ac.signal }).then((r) => r.ok ? r.json() : null).then((j) => {
      if (j && j.ideas && j.events) { j.events.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id))); ckDiaryLive = j; setD(j); }
    }).catch(() => {}).finally(() => clearTimeout(to));
    return () => ac.abort();
  }, []);
  return d;
}
function DiaryTreeBg({ style, flow = true }) {
  const ref = React.useRef(null);
  const data = useDiaryData();
  React.useEffect(() => window.mountDiaryTree(ref.current, data, { palette: ckTreePalette, flow: flow ? { ...ckTreeFlow } : null }), [flow, data]);
  return <div style={{ position: 'absolute', inset: 0, ...style }}><canvas ref={ref} style={{ display: 'block' }}></canvas></div>;
}
Object.assign(window, { ckTreePalette, ckTreeFlow, DiaryTreeBg, CK, ckGames, ckHub, useLogistic, ckClock, ckGlyph, ckEyebrow });
