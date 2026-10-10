// 🎰 Chaos Pinball, an organ of the shell (and a game of its own: pinball.html). A real pinball table on a phone held
// upright. The left half of the screen is the left flipper, the right half the right one (keys ← → / Z M); with a ball
// waiting in the shooter lane, hold anywhere and let go to plunge (or pull down: the further, the harder; Space / ↓).
// A two-finger tap (both fingers close together) or a quick swipe up nudges the table; too many and it's TILT: the
// flippers go dead for a few seconds. The ball is Fig. A drain is a life (the organ's own three).
//
// The table is r4box: every family game is a feature in miniature, and each one lights its lamp in the ring above the
// flippers once you beat it:
//   ⚓ Battleship: five drop targets on the right are two ships (2 and 3). Drop every target of a ship to sink it.
//   💥 Hilltop: the scoop top right is a cannon. It swings its aim along the hill; any flipper fires. Land on the tank.
//   ⛳ Putt: the saucer in the middle is a cup. It holds the ball, counts your strokes, and putts it back to the left flipper.
//   🐿️ Squirrel: the ramp on the left climbs to a hairpin where a squirrel runs across. Catch it on the way past.
//   🏎️ Rally: the left orbit lane takes the ball all the way round the top. Every lap counts; three win the race.
//   ⚔️ War: the two card targets either side of the middle each show a card. Hit the higher one.
//   🔺 Fractal: the spinner in the orbit lane. Fibonacci spins (8, 13, 21, 34) take you a depth deeper.
// Light all seven and it's R = 4: three balls, everything ×4 for 30 s. The F-I-G lanes at the top raise the multiplier.
//
// The box's beats run the table: a peak surges the bumpers (and from Stage 2, at x > 0.9, adds a ball), big is a named
// twist (🎈 antigravity, 🧲 magnet, 🎡 bumpers that ride the logistic map's orbit, 🔺 a Sierpiński target that splits in
// three when you hit it, 💨 crosswind), gold a golden ball (×2), gift a ball save, the mirror flips the table left to
// right (flippers and all), the window is a three-ball multiball, the golden cut lights the jackpot (the cup, 6,180),
// fib doubles the next 8 seconds, balance lights both outlane kickbacks. Stage 1 is gentle: long flippers, a long ball
// save, a post between the flippers; each stage after is faster, shorter, meaner.
//
// Physics: a fixed 240 Hz step, split again so no ball (or flipper tip) moves more than a third of a radius per
// substep; walls are capsules, bumpers circles, the top an arc, the flippers moving capsules that hand the ball their
// own speed. Nothing tunnels, and a ball that ever left the table would be counted (`escapes`, tests assert 0).
// 🕳️ Its pocket (deep enough, the cup glows: tap it): INTO THE BILLIARD (pockets/stadium.js), a Bunimovich stadium.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';
import stadiumPocket from './pockets/stadium.js';

let W = 400;
const TW = 400, TH = 720, R = 9, CX = 186, DMD_W = 128, DMD_H = 22, DMDH = 60, VMAX = 2800, STEP = 1 / 240;
const GOLD = '#F5C542', TEAL = '#3DD6C6', HOT = '#FF5FB0', LILAC = '#C9B8FF', ICE = '#9BE7FF';
const REST = 0.5, UP = -0.48;
let host, ctx, S, sfx, g = null, tot = { modes: 0, fleets: 0, laps: 0, ramps: 0 };
const ST = () => Math.max(1, Math.min(4, host?.stage?.() || 1));
// 🎚️ a gentle start: long flippers, a long save, light gravity, a post between the flippers; then meaner
const SAVER = () => [12, 9, 7, 6][ST() - 1];
const FLIPL = () => [74, 70, 67, 64][ST() - 1];
const GRAV = () => [1000, 1100, 1200, 1300][ST() - 1];
const KICK = () => [620, 680, 740, 800][ST() - 1];
// ---------------------------------------------------------------- the table, in table units (400 × 720, y down)
const ARC = { cx: 200, cy: 196, r: 190 };
const SLING = [[[66, 512], [66, 566], [100, 590]], [[306, 512], [306, 566], [272, 590]]];
const BUMPS0 = [[150, 160], [222, 160], [186, 212]];
const LANES = [146, 186, 226];
const SAUCER = { x: 186, y: 300 }, SCOOP = { x: 300, y: 236 }, POST = { x: 186, y: 676, r: 7 }, PLUNGE = { x: 376, y: 701 };
const HILL_Y = 124, TRI0 = { x: 186, y: 400 };
const RAMP = [[90, 352], [90, 300], [88, 240], [92, 186], [84, 152], [66, 136], [46, 142], [32, 166], [27, 220], [27, 410], [38, 466], [53, 500]];
const RAMP_UP = 3, RAMP_TOP = 6, RAMP_SQ = 5;   // up to point 3, level round the hairpin to 6, the squirrel at 5
const GAMES = [['⚓', 'BATTLESHIP', 'ships'], ['💥', 'HILLTOP', 'cannon'], ['⛳', 'PUTT', 'putt'], ['🐿️', 'SQUIRREL', 'squirrel'], ['🏎️', 'RALLY', 'rally'], ['⚔️', 'WAR', 'war'], ['🔺', 'FRACTAL', 'fractal']];
const RING = GAMES.map((_, i) => { const a = Math.PI * (200 + i * (140 / 6)) / 180; return { x: CX + 64 * Math.cos(a), y: 540 + 64 * Math.sin(a) }; });
const SHIPS = [['PATROL BOAT', [0, 1]], ['SUBMARINE', [2, 3, 4]]];
const FIBS = [8, 13, 21, 34, 55, 89, 144];
const TWISTS = [
  ['🎈 ANTIGRAVITY', 'the table tips the other way', 'anti', 4],
  ['🧲 MAGNET', 'the cup pulls every ball in', 'magnet', 6],
  ['🎡 THE BUMPERS WANDER', 'they ride the logistic map', 'wander', 8],
  ['🔺 SIERPIŃSKI', 'hit the triangle: it splits in three', 'sierp', 14],
  ['💨 CROSSWIND', 'the table blows sideways', 'wind', 5],
];
const seg = (ax, ay, bx, by, o = {}) => ({ ax, ay, bx, by, th: 2, e: 0.45, kind: 'wall', on: true, cool: 0, ...o, l2: (bx - ax) ** 2 + (by - ay) ** 2, x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(ay, by), y1: Math.max(ay, by) });
function buildSegs() {
  const s = [];
  s.push(seg(10, 196, 10, 722), seg(390, 196, 390, 722), seg(362, 722, 362, 268), seg(362, 712, 390, 712, { e: 0.15 }));
  { const q = seg(362, 268, 390, 238, { kind: 'gate', gate: true, e: 0.3 }), dx = q.bx - q.ax, dy = q.by - q.ay, l = Math.sqrt(q.l2); let nx = -dy / l, ny = dx / l; if (ny > 0) { nx = -nx; ny = -ny; } q.gx = nx; q.gy = ny; s.push(q); }   // one way: up the shooter lane, never back down it
  s.push(seg(44, 212, 44, 378), seg(44, 378, 70, 352), seg(10, 402, 60, 446));   // the orbit lane, its floor
  s.push(seg(40, 496, 40, 722), seg(40, 596, 99, 615), seg(332, 496, 332, 722), seg(332, 596, 273, 615));   // inlane guides: they end on the flipper's shoulder, so the ball rolls on
  s.push(seg(99, 615, 99, 722), seg(273, 615, 273, 722));   // under the flippers
  s.push(seg(70, 352, 70, 318), seg(110, 352, 110, 318));   // the ramp's mouth
  SLING.forEach(([A, B, C], side) => s.push(seg(A[0], A[1], B[0], B[1], { e: 0.3 }), seg(B[0], B[1], C[0], C[1], { e: 0.3 }), seg(C[0], C[1], A[0], A[1], { kind: 'sling', side, e: 0.5, th: 3 })));
  [126, 166, 206, 246].forEach((x) => s.push(seg(x, 60, x, 96, { th: 4, e: 0.6, kind: 'post' })));
  s.push(seg(96, 420, 122, 446, { th: 3, e: 0.4, kind: 'war', side: 0 }), seg(276, 420, 250, 446, { th: 3, e: 0.4, kind: 'war', side: 1 }));
  for (let i = 0; i < 5; i++) { const y0 = 338 + i * 26; s.push(seg(344, y0 + 2, 344, y0 + 22, { th: 3, e: 0.3, kind: 'drop', i })); }
  return s;
}
const SEGS = buildSegs();
const RAMPL = (() => { const cum = [0]; for (let i = 1; i < RAMP.length; i++) cum.push(cum[i - 1] + Math.hypot(RAMP[i][0] - RAMP[i - 1][0], RAMP[i][1] - RAMP[i - 1][1])); return cum; })();
const RAMP_LEN = RAMPL[RAMPL.length - 1];
function rampAt(s) {
  s = Math.max(0, Math.min(RAMP_LEN, s)); let i = 1; while (i < RAMP.length - 1 && RAMPL[i] < s) i++;
  const u = (s - RAMPL[i - 1]) / (RAMPL[i] - RAMPL[i - 1] || 1), a = RAMP[i - 1], b = RAMP[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return { x: a[0] + dx * u, y: a[1] + dy * u, tx: dx / l, ty: dy / l };
}
const rampZ = (s) => (s < RAMPL[RAMP_UP] ? s / RAMPL[RAMP_UP] : s < RAMPL[RAMP_TOP] ? 1 : Math.max(0, 1 - (s - RAMPL[RAMP_TOP]) / (RAMP_LEN - RAMPL[RAMP_TOP])));
// ---------------------------------------------------------------- the game
function newGame() {
  g = {
    time: 0, acc: 0, balls: [], nid: 0, feed: 0, feedT: 0, multi: false,
    fl: [{ px: 106, py: 626, s: 1, th: REST, w: 0, on: false }, { px: 266, py: 626, s: -1, th: REST, w: 0, on: false }],
    bumps: BUMPS0.map(([x, y]) => ({ x, y, bx: x, by: y, flash: 0, ox: 0.2 + Math.random() * 0.6, tr: [] })),
    drop: [true, true, true, true, true], sunk: [false, false], dropReset: 0, fleets: 0,
    lanes: [false, false, false], skill: -1, skillT: 0, mult: 1,
    saveT: 0, saveBank: 0, kick: [false, false], jackpot: false, goldT: 0, fibT: 0, surgeT: 0, wizT: 0, wizards: 0,
    ring: [false, false, false, false, false, false, false], modesDone: 0,
    cannon: null, tank: { x: 186, dir: 1 }, bulls: 0, shots: 0,
    saucerCool: 0, scoopCool: 0, cups: 0, strokes: 0, holeInOne: 0,
    ramps: 0, staples: 0, squirrel: { off: 0, t: 0, out: 0 },
    laps: 0, orbitT: -9, races: 0,
    war: { l: 9, r: 5, flip: 0, streak: 0, wins: 0, losses: 0, tie: false, tieHit: [false, false] },
    spin: { a: 0, w: 0, n: 0, depth: 0 },
    twist: null, tris: [], windDir: 1,
    mirror: false, mirrorT: 0, flipS: 1,
    tilt: 0, tiltT: 0, warned: false, nudges: 0,
    sling: [0, 0], warFlash: [0, 0], parts: {}, fx: [], sp: [], shake: 0, sx: 0, sy: 0, hurtT: 0, freeze: 0, drains: 0, saved: 0,
    msg: null, ptr: new Map(), keys: { l: false, r: false }, pull: null, auto: false, autoT: [0, 0],
    escapes: 0, bad: 0, badAt: null, maxV: 0, glitch: false, glitchPal: null, hint: 5, snd: {},
  };
  newBall('plunger').first = true;
  deal(true);
}
function newBall(st = 'plunger') { const b = { id: ++g.nid, x: PLUNGE.x, y: PLUNGE.y, vx: 0, vy: 0, st, rot: 0, tr: [], still: 0, wait: 0, autoT: null, ramp: null, air: null, hold: 0, first: false }; g.balls.push(b); return b; }
const live = () => g.balls.filter((b) => b.st !== 'gone' && b.st !== 'plunger');
const playing = () => g.balls.some((b) => b.st === 'play' || b.st === 'ramp' || b.st === 'air' || b.st === 'saucer' || b.st === 'scoop');
const waiting = () => g.balls.find((b) => b.st === 'plunger');
const spd = (b) => Math.hypot(b.vx, b.vy);
function snd(name, o, gap = 0.05) { if ((g.snd[name] || -9) > g.time - gap) return; g.snd[name] = g.time; sfx(name, o); }
// ---------------------------------------------------------------- scoring
function score(pts, part, x, y, label, col) {
  const m = g.mult * (g.goldT > 0 ? 2 : 1) * (g.fibT > 0 ? 2 : 1) * (g.wizT > 0 ? 4 : 1), v = Math.round(pts * m);
  host.add(v); g.parts[part] = (g.parts[part] || 0) + v;
  if (label) text(x, y, `${label}${label.endsWith(' ') ? '' : ' '}+${v.toLocaleString()}`, col);
  return v;
}
function feature(part, base, x, y, label, col = GOLD) {   // a shot, not a bounce: the combo counts and pays F(k)×
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 4;
  const v = score(base * fibMult(Math.min(S.combo, 5)), part, x, y, label, col);   // F(k)× up to ×8: a table full of shots chains fast
  const w = toWorld(x, y); host.cue?.('score', w.x, w.y);
  return v;
}
function lightMode(i) {
  if (g.ring[i]) return; g.ring[i] = true; g.modesDone += 1;
  const n = g.ring.filter(Boolean).length; dmd(`${GAMES[i][1]} LIT`, `${n} OF 7`, GOLD, 1.6); spark(RING[i].x, RING[i].y, GOLD, 22, 180); snd('chime');
  if (n === 7) wizard();
}
function wizard() {
  g.wizT = 30; g.wizards += 1; g.ring = g.ring.map(() => false); multiball(3, true);
  score(10000, 'wizard', CX, 420, 'R = 4', GOLD); g.shake = Math.max(g.shake, 10); snd('fanfare', null, 0); snd('cheer', null, 0);
  host.banner('🧬 R = 4 · ALL SEVEN', 'every game lit: three balls, everything ×4 for 30 s'); dmd('R = 4', 'ALL SEVEN X4', HOT, 3);
  const w = toWorld(CX, 420); host.cue?.('kill', w.x, w.y);
}
// ---------------------------------------------------------------- the dot-matrix display
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31], M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17], Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31], 0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12], ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 2, 4, 0, 4], '-': [0, 0, 0, 31, 0, 0, 0], '+': [0, 4, 4, 31, 4, 4, 0], ':': [0, 12, 12, 0, 12, 12, 0], '/': [1, 1, 2, 4, 8, 16, 16],
  '=': [0, 0, 31, 0, 31, 0, 0], "'": [4, 4, 8, 0, 0, 0, 0], '%': [24, 25, 2, 4, 8, 19, 3], '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '·': [0, 0, 0, 4, 0, 0, 0],
};
const DPAL = [[30, 22, 54], [245, 197, 66], [61, 214, 198], [255, 95, 176], [201, 184, 255], [255, 255, 255]];
const DCOL = { [GOLD]: 1, [TEAL]: 2, [HOT]: 3, [LILAC]: 4, '#fff': 5 };
function dmd(title, sub = '', col = GOLD, dur = 1.5) { g.msg = { title: String(title), sub: String(sub), col: typeof col === 'number' ? col : DCOL[col] || 1, t: dur, dur }; }
function dmdContent() {
  if (g.tiltT > 0) return ['TILT', `FLIPPERS BACK IN ${Math.ceil(g.tiltT)}`, 3, 4];
  if (g.msg && g.msg.t > 0) return [g.msg.title, g.msg.sub, g.msg.col, g.msg.col === 3 ? 5 : 4];
  const sc = S.score.toLocaleString('en-US');
  if (waiting() && !playing()) return [sc, Math.floor(g.time * 2) % 2 ? 'HOLD AND LET GO' : 'TO LAUNCH FIG', 1, 2];
  const bits = [];
  if (g.wizT > 0) bits.push(`R=4 X4 ${Math.ceil(g.wizT)}`);
  else bits.push(`${g.ring.filter(Boolean).length}/7 LIT`);
  if (g.mult > 1) bits.push(`X${g.mult}`);
  if (g.saveT > 0 || g.saveBank) bits.push('SAVE');
  if (g.jackpot) bits.push('JACKPOT');
  if (g.kick[0] || g.kick[1]) bits.push('KICK');
  let line = ''; for (const t of bits) { const n = line ? `${line} · ${t}` : t; if (n.length > 21) break; line = n; }   // 21 small letters fit across
  return [sc, line, g.goldT > 0 ? 1 : g.wizT > 0 ? 3 : 1, g.fibT > 0 ? 1 : 2];
}
function dmdRender(c) {
  const buf = look.dmdBuf; buf.fill(0);
  const put = (str, cy, sc, col) => {
    str = String(str).toUpperCase(); let w = str.length * 6 * sc - sc; if (w > DMD_W && sc > 1) { sc = 1; w = str.length * 6 - 1; }
    let x = Math.round((DMD_W - w) / 2); const y = Math.round(cy - 3.5 * sc);
    for (const ch of str) { const gl = FONT[ch] || FONT['?']; for (let r = 0; r < 7; r++) for (let cc = 0; cc < 5; cc++) if (gl[r] & (16 >> cc)) for (let i = 0; i < sc; i++) for (let j = 0; j < sc; j++) { const px = x + cc * sc + i, py = y + r * sc + j; if (px >= 0 && px < DMD_W && py >= 0 && py < DMD_H) buf[py * DMD_W + px] = col; } x += 6 * sc; }
  };
  const [t1, t2, c1, c2] = c;
  if (t2) { put(t1, 7, 2, c1); put(t2, 18.5, 1, c2); } else put(t1, 11, 2, c1);
  const d = look.dmdImg.data; for (let i = 0; i < buf.length; i++) { const p = DPAL[buf[i]]; d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; }
  look.dmdSmall.getContext('2d').putImageData(look.dmdImg, 0, 0);
}
// ---------------------------------------------------------------- the box's beats
function onBeat(ev) { if (g && !g.quiet) beatNow(ev); }   // (tests can hush the curve's own beats and force their own)
function beatNow(ev) {
  if (!g) return;
  const win = ev.enteredWindow || (ev.window && !g.lastWin); g.lastWin = !!ev.window;
  if (win) { multiball(3); dmd('THREE BALLS', 'THE WINDOW', LILAC, 2); }
  else if (ev.peak) { g.surgeT = 4; dmd('BUMPER SURGE', 'X3 FOR 4 SECONDS', HOT, 1.4); g.bumps.forEach((b) => { b.flash = 0.4; }); if (ev.x > 0.9 && ST() >= 2 && live().length + g.feed < 3) { multiball(live().length + g.feed + 1); } }
  if (ev.gift) { g.saveT = Math.max(g.saveT, 5); dmd('BALL SAVE', '5 SECONDS', TEAL, 1.4); }
  if (ev.gold) { g.goldT = 10; host.banner('🌟 GOLDEN BALL', 'everything pays double for 10 s'); dmd('GOLDEN BALL', 'X2 FOR 10 SECONDS', GOLD, 2); }
  if (ev.golden) { g.jackpot = true; dmd('JACKPOT LIT', 'SHOOT THE CUP', GOLD, 2); }
  if (ev.mirror) mirror();
  if (ev.balance) { g.kick = [true, true]; dmd('KICKBACK LIT', 'BOTH OUTLANES', TEAL, 1.6); snd('chime'); }
  if (ev.fib) { g.fibT = 8; dmd('FIB X2', '8 SECONDS', GOLD, 1.4); }
  if (ev.big && !g.twist) twist();
}
function multiball(target, quiet = false) {
  const have = live().length + g.feed + (waiting() ? 1 : 0), add = Math.min(3, target) - have;
  const w = waiting(); if (w && playing()) w.autoT = 0.3;
  if (add <= 0) return false;
  g.feed += add; g.multi = true; g.feedT = Math.min(g.feedT, 0.3);
  if (!quiet) { host.banner('🎰 MULTIBALL', `${Math.min(3, target)} balls in play`); snd('fanfare', null, 0); }
  return true;
}
function mirror() {
  g.mirror = !g.mirror; g.mirrorT = g.mirror ? 12 : 0; snd('twist', null, 0);
  dmd(g.mirror ? 'MIRROR TABLE' : 'BACK AGAIN', g.mirror ? 'LEFT IS RIGHT' : '', LILAC, 1.4);
}
function twist(kind) {
  const T = kind ? TWISTS.find((t) => t[2] === kind) : TWISTS[Math.floor(Math.random() * TWISTS.length)]; if (!T) return false;
  endTwist();
  const [title, sub, k, dur] = T; g.twist = { kind: k, t: 0, dur };
  host.banner(title, sub); snd('twist', null, 0); g.shake = Math.max(g.shake, 5);
  dmd({ anti: 'ANTIGRAVITY', magnet: 'MAGNET', wander: 'BUMPERS WANDER', sierp: 'SIERPINSKI', wind: 'CROSSWIND' }[k], `${dur} SECONDS`, HOT, 1.8);
  if (k === 'anti') g.saveT = Math.max(g.saveT, dur + 2);
  if (k === 'wind') g.windDir = Math.random() < 0.5 ? -1 : 1;
  if (k === 'wander') g.bumps.forEach((b) => { b.ox = 0.15 + Math.random() * 0.7; b.tr = []; b.ot = 0; });
  if (k === 'sierp') g.tris = [{ x: TRI0.x, y: TRI0.y, s: 64, d: 0, grace: 0.2, hit: 0 }];
  return true;
}
function endTwist() { if (!g.twist) return; if (g.twist.kind === 'sierp') g.tris = []; g.twist = null; }
// ---------------------------------------------------------------- features
function deal(first) {
  const w = g.war; let l = 2 + Math.floor(Math.random() * 13), r = 2 + Math.floor(Math.random() * 13);
  if (!first && Math.random() < 0.12) r = l; else while (r === l) r = 2 + Math.floor(Math.random() * 13);
  w.l = l; w.r = r; w.tie = l === r; w.tieHit = [false, false]; w.flip = first ? 0 : 0.35; w.sl = Math.floor(Math.random() * 4); w.sr = Math.floor(Math.random() * 4);
}
function hitWar(side) {
  const w = g.war, p = side ? { x: 263, y: 433 } : { x: 109, y: 433 }; g.warFlash[side] = 0.3;
  if (w.flip > 0) return;
  if (w.tie) {
    w.tieHit[side] = true; snd('thud');
    if (w.tieHit[0] && w.tieHit[1]) { w.wins += 1; w.streak += 1; feature('war', 1200, CX, 430, 'WAR WON', HOT); host.banner('⚔️ WAR WON', 'both cards on a tie'); snd('cheer', null, 0); spark(CX, 430, HOT, 30, 220); if (w.streak >= 3) lightMode(5); deal(); }
    else { dmd('WAR!', 'NOW THE OTHER CARD', HOT, 1.6); score(100, 'war', p.x, p.y, 'WAR!', HOT); }
    return;
  }
  const hi = w.l > w.r ? 0 : 1;
  if (side === hi) { w.wins += 1; w.streak += 1; feature('war', 250, p.x, p.y - 20, 'HIGHER', TEAL); snd('pop'); spark(p.x, p.y, TEAL, 14, 160); if (w.streak >= 3) lightMode(5); }
  else { w.losses += 1; w.streak = 0; score(25, 'war', p.x, p.y - 20, 'LOWER', LILAC); snd('plunk'); dmd('LOWER CARD', 'HIT THE HIGHER ONE', LILAC, 1.2); }
  deal();
}
function dropHit(i) {
  if (!g.drop[i]) return; g.drop[i] = false;
  const y = 338 + i * 26 + 12; score(100, 'ships', 336, y, '', GOLD); snd('clack'); snd('thud'); spark(344, y, ICE, 10, 140);
  SHIPS.forEach(([name, ts], k) => {
    if (g.sunk[k] || ts.some((j) => g.drop[j])) return;
    g.sunk[k] = true; feature('ships', 750, 300, y, `${name} SUNK`, ICE); snd('boom', { size: 0.7 }, 0);
    if (g.sunk.every(Boolean)) { g.fleets += 1; feature('ships', 2000, 300, y - 26, 'FLEET SUNK', GOLD); host.banner('⚓ FLEET SUNK', 'both ships down: the bank resets'); g.dropReset = 1.4; lightMode(0); g.shake = Math.max(g.shake, 6); }
    else dmd(`${name} SUNK`, 'SINK THE OTHER', 4, 1.4);
  });
}
function laneHit(i) {
  if (g.skillT > 0 && g.skill === i) { g.skillT = 0; feature('lanes', 2500, LANES[i], 110, 'SKILL SHOT', GOLD); host.banner('🎯 SKILL SHOT', 'straight down the lit lane'); snd('birdie', null, 0); }
  g.skillT = 0;
  if (g.lanes[i]) { score(50, 'lanes', LANES[i], 112); return; }
  g.lanes[i] = true; score(150, 'lanes', LANES[i], 112, 'FIG'[i], GOLD); snd('chime', null, 0.1);
  if (g.lanes.every(Boolean)) { g.mult = Math.min(5, g.mult + 1); g.lanes = [false, false, false]; feature('lanes', 600, CX, 112, `FIG X${g.mult}`, GOLD); dmd('FIG COMPLETE', `MULTIPLIER X${g.mult}`, GOLD, 1.6); }
}
function rotateLanes(side) { const l = g.lanes; g.lanes = side ? [l[2], l[0], l[1]] : [l[1], l[2], l[0]]; }
function spinHit(b) {
  const v = Math.abs(b.vy); g.spin.w = Math.min(60, g.spin.w + v / 45); b.vy *= 0.94; snd('click', null, 0.04);
}
function spinTurn() {
  const s = g.spin; s.n += 1; score(25, 'fractal', 27, 300);
  const nx = FIBS[s.depth];
  if (nx && s.n >= nx) { s.depth += 1; feature('fractal', 300 * s.depth, 60, 300, `DEPTH ${s.depth}`, HOT); dmd(`DEPTH ${s.depth}`, `${s.n} SPINS`, HOT, 1.4); if (s.depth >= 4) lightMode(6); }
}
function lap() {
  g.laps += 1; g.orbitT = -9; feature('rally', 400, 200, 40, `LAP ${g.laps}`, TEAL); snd('whistle', { dur: 0.4 }, 0);
  if (g.laps % 3 === 0) { g.races += 1; feature('rally', 1500, 200, 64, 'RACE WON', GOLD); host.banner('🏁 RACE WON', 'three laps round the top'); lightMode(4); }
  else dmd(`LAP ${g.laps % 3}`, 'THREE TO WIN THE RACE', TEAL, 1.2);
}
function toRamp(b) { b.st = 'ramp'; b.ramp = { s: 0, v: Math.min(1400, spd(b)), sq: false }; snd('putt', { power: 0.3 }); }
function stepRamp(b, h) {
  const r = b.ramp, G = GRAV(), s0 = r.s;
  const acc = r.s < RAMPL[RAMP_UP] ? -0.55 * G : r.s < RAMPL[RAMP_TOP] ? -0.05 * G : 0.18 * G;
  r.v = Math.min(900, r.v + acc * h); r.s += r.v * h;
  const sq = RAMPL[RAMP_SQ];
  if (s0 < sq && r.s >= sq && !r.sq) { r.sq = true; if (Math.abs(g.squirrel.off) < 0.55 && g.squirrel.out <= 0) staple(); }
  const p = rampAt(r.s); b.x = p.x; b.y = p.y; b.rot += r.v * h / R;
  if (r.s <= 0) { b.st = 'play'; b.x = 90; b.y = 356; b.vx = 0; b.vy = Math.max(60, -r.v); b.ramp = null; return; }
  if (r.s >= RAMP_LEN) {
    b.st = 'play'; const e = RAMP[RAMP.length - 1]; b.x = e[0]; b.y = e[1]; b.vx = 0; b.vy = Math.min(420, Math.max(120, r.v)); b.ramp = null;
    g.ramps += 1; feature('squirrel', 500, 60, 470, 'RAMP', TEAL); snd('birdie', null, 0.2);
    if (g.ramps % 3 === 0) lightMode(3);
  }
}
function staple() {
  g.staples += 1; g.squirrel.out = 4; const p = rampAt(RAMPL[RAMP_SQ]);
  feature('squirrel', 1000, p.x, p.y - 16, 'STAPLED', HOT); host.banner('🐿️ SQUIRREL STAPLED', 'caught on the hairpin'); snd('pop', null, 0); snd('chime', null, 0); spark(p.x, p.y, '#C98A4A', 24, 200); lightMode(3);
}
function capture(b, where) {
  b.st = where; b.vx = b.vy = 0; b.hold = 0;
  if (where === 'saucer') {
    b.x = SAUCER.x; b.y = SAUCER.y; g.cups += 1; snd('cup', null, 0);
    if (g.jackpot) { g.jackpot = false; feature('jackpot', 6180, CX, 280, 'JACKPOT', GOLD); host.banner('💰 JACKPOT', 'the golden cut paid out'); snd('fanfare', null, 0); g.shake = Math.max(g.shake, 8); spark(CX, 300, GOLD, 40, 260); }
    const st = g.strokes; g.strokes = 0;
    if (st <= 1) { g.holeInOne += 1; feature('putt', 1500, CX, 270, 'HOLE IN ONE', GOLD); dmd('HOLE IN ONE', `CUP ${g.cups}`, GOLD, 1.6); }
    else feature('putt', 500, CX, 270, st <= 3 ? 'BIRDIE' : 'IN THE CUP', TEAL), dmd(`CUP ${g.cups}`, `${st} STROKES`, TEAL, 1.3);
    if (g.cups % 3 === 0) lightMode(2);
  } else {
    b.x = SCOOP.x; b.y = SCOOP.y; g.cannon = { ball: b, t: 0 }; snd('thud', null, 0); dmd('CANNON READY', 'ANY FLIPPER FIRES', HOT, 1.6);
  }
}
const aimX = () => CX + 112 * Math.sin((g.cannon?.t || 0) * 3.1);
function fireCannon() {
  const c = g.cannon; if (!c) return false;
  const b = c.ball, x1 = aimX(); g.cannon = null; b.st = 'air'; b.air = { x0: SCOOP.x, y0: SCOOP.y, x1, y1: HILL_Y, t: 0, T: 0.85 }; g.shots += 1;
  snd('cannon', null, 0); g.shake = Math.max(g.shake, 4); spark(SCOOP.x, SCOOP.y, '#FFB07A', 16, 180);
  return true;
}
function land(b) {
  const a = b.air; b.st = 'play'; g.scoopCool = 1.5; b.x = a.x1; b.y = a.y1; b.vx = 0; b.vy = 140; b.air = null; snd('boom', { size: 0.5 }, 0); g.shake = Math.max(g.shake, 5); spark(b.x, b.y, '#FFB07A', 14, 160);
  g.lastLand = { x: Math.round(a.x1), tank: Math.round(g.tank.x) };
  if (Math.abs(a.x1 - g.tank.x) < 22) { g.bulls += 1; feature('cannon', 1500, b.x, b.y - 18, 'BULLSEYE', HOT); host.banner('💥 BULLSEYE', 'right on the tank'); g.tank.boom = 1; if (g.bulls % 2 === 0) lightMode(1); else dmd('BULLSEYE', 'ONE MORE FOR HILLTOP', HOT, 1.4); }
  else score(100, 'cannon', b.x, b.y - 18, Math.abs(a.x1 - g.tank.x) < 50 ? 'CLOSE' : 'MISSED', LILAC);
}
// ---------------------------------------------------------------- physics
const HN = { x: 0, y: 0 };
function hitSeg(b, s) {
  const rr = R + s.th;
  if (b.x < s.x0 - rr || b.x > s.x1 + rr || b.y < s.y0 - rr || b.y > s.y1 + rr) return -1;
  const dx = s.bx - s.ax, dy = s.by - s.ay;
  let u = ((b.x - s.ax) * dx + (b.y - s.ay) * dy) / s.l2; u = u < 0 ? 0 : u > 1 ? 1 : u;
  const px = s.ax + dx * u, py = s.ay + dy * u;
  let nx = b.x - px, ny = b.y - py; const d2 = nx * nx + ny * ny;
  if (d2 >= rr * rr) return -1;
  if (s.gate && (b.vy <= 0 || (b.x - s.ax) * s.gx + (b.y - s.ay) * s.gy <= 0)) return -1;
  const d = Math.sqrt(d2);
  if (d < 1e-6) { const l = Math.sqrt(s.l2); nx = -dy / l; ny = dx / l; if (nx * b.vx + ny * b.vy > 0) { nx = -nx; ny = -ny; } } else { nx /= d; ny /= d; }
  b.x = px + nx * rr; b.y = py + ny * rr; HN.x = nx; HN.y = ny;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) { b.vx -= (1 + s.e) * vn * nx; b.vy -= (1 + s.e) * vn * ny; return -vn; }
  return 0;
}
function hitCirc(b, cx, cy, r, e) {
  const dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy, m = r + R; if (d2 >= m * m) return -1;
  const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d; b.x = cx + nx * m; b.y = cy + ny * m; HN.x = nx; HN.y = ny;
  const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; return -vn; } return 0;
}
function hitArc(b) {
  if (b.y >= ARC.cy) return;
  const dx = b.x - ARC.cx, dy = b.y - ARC.cy, d2 = dx * dx + dy * dy, lim = ARC.r - R - 2; if (d2 <= lim * lim) return;
  const d = Math.sqrt(d2), nx = -dx / d, ny = -dy / d; b.x = ARC.cx + dx / d * lim; b.y = ARC.cy + dy / d * lim;
  const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; if (-vn > 500) snd('thud', null, 0.08); }
}
function hitFlip(b, f, Lf) {
  const rx = b.x - f.px, ry = b.y - f.py, reach = Lf + 9 + R + 2; if (rx * rx + ry * ry > reach * reach) return -1;
  const c = Math.cos(f.th), sn = Math.sin(f.th), ux = f.s * c, uy = sn;
  let u = (rx * ux + ry * uy) / Lf; u = u < 0 ? 0 : u > 1 ? 1 : u;
  const cx = f.px + ux * u * Lf, cy = f.py + uy * u * Lf, m = 9 - 4 * u + R;
  let nx = b.x - cx, ny = b.y - cy; const d2 = nx * nx + ny * ny; if (d2 >= m * m) return -1;
  const d = Math.sqrt(d2); if (d < 1e-6) { nx = -uy * f.s; ny = ux * f.s; if (ny > 0) { nx = -nx; ny = -ny; } } else { nx /= d; ny /= d; }
  b.x = cx + nx * m; b.y = cy + ny * m;
  const dl = u * Lf, svx = -f.s * sn * f.w * dl, svy = c * f.w * dl, rvx = b.vx - svx, rvy = b.vy - svy, vn = rvx * nx + rvy * ny;
  if (vn < 0) { b.vx -= 1.32 * vn * nx; b.vy -= 1.32 * vn * ny; return -vn; }
  return 0;
}
function stepFlip(f, h) {
  const tgt = f.on && g.tiltT <= 0 ? UP : REST;
  if (f.th > tgt) { f.w = -26; f.th = Math.max(tgt, f.th + f.w * h); if (f.th === tgt) f.w = 0; }
  else if (f.th < tgt) { f.w = 18; f.th = Math.min(tgt, f.th + f.w * h); if (f.th === tgt) f.w = 0; }
  else f.w = 0;
}
function collide(b, Lf) {
  hitArc(b);
  for (let i = 0; i < SEGS.length; i++) {
    const s = SEGS[i]; if (s.kind === 'drop' && !g.drop[s.i]) continue;
    const imp = hitSeg(b, s); if (imp < 0) continue;
    if (s.kind === 'sling') { if (imp > 40 && g.sling[s.side] <= 0) { b.vx += HN.x * 560; b.vy += HN.y * 560; g.sling[s.side] = 0.14; score(5, 'slings', 0, 0); snd('clack'); snd('thud', null, 0.08); } }
    else if (s.kind === 'drop') { if (imp > 110) dropHit(s.i); }
    else if (s.kind === 'war') { if (imp > 90 && g.warFlash[s.side] <= 0) hitWar(s.side); }
    else if (imp > 650) snd('thud', null, 0.08);
  }
  const surge = g.surgeT > 0, K = KICK() * (surge ? 1.4 : 1);
  for (const bp of g.bumps) {
    const imp = hitCirc(b, bp.x, bp.y, 18, 0.5); if (imp < 0) continue;
    const vn = b.vx * HN.x + b.vy * HN.y; if (vn < K) { b.vx += (K - vn) * HN.x; b.vy += (K - vn) * HN.y; }
    if (bp.flash <= 0.05) { bp.flash = 0.14; score(surge ? 30 : 10, 'bumpers', 0, 0); snd('pop', null, 0.04); spark(bp.x + HN.x * 18, bp.y + HN.y * 18, surge ? HOT : TEAL, 5, 120); }
  }
  if (ST() === 1) { const imp = hitCirc(b, POST.x, POST.y, POST.r, 0.7); if (imp > 300) snd('clack', null, 0.08); }
  for (const tri of g.tris) { if (tri.grace > 0) continue; const imp = hitCirc(b, tri.x, tri.y, tri.s * 0.3, 0.6); if (imp > 60) splitTri(tri); }
  for (const f of g.fl) { const imp = hitFlip(b, f, Lf); if (imp > 250) { if (f.w && !f.struck) { f.struck = true; g.strokes += 1; } if (imp > 500) snd('clack', null, 0.06); } }   // a stroke: one per flip that sends a ball
}
function splitTri(t) {
  if (t.dead) return; t.dead = true;
  const pts = [100, 220, 480][t.d]; score(pts, 'twists', t.x, t.y - t.s * 0.4, t.d === 2 ? 'SHATTERED' : 'SPLIT', HOT); snd(t.d === 2 ? 'chime' : 'pop', null, 0); spark(t.x, t.y, HOT, 12 + t.d * 4, 150);
  if (t.d < 2) { const h = t.s / 2; [[0, -h * 0.577], [-h / 2, h * 0.289], [h / 2, h * 0.289]].forEach(([dx, dy]) => g.tris.push({ x: t.x + dx, y: t.y + dy, s: h, d: t.d + 1, grace: 0.25, hit: 0 })); }
  g.tris = g.tris.filter((q) => !q.dead);
  if (!g.tris.length) { feature('twists', 2000, TRI0.x, TRI0.y, 'SIERPINSKI CLEARED', GOLD); endTwist(); }
}
function sensors(b, px, py, h) {
  if (b.y > 724 && b.x < 362) { drained(b); return; }
  if (py >= 352 && b.y < 352 && b.x > 72 && b.x < 108 && b.vy < 0) { toRamp(b); return; }
  if (b.x < 44 && (py - 300) * (b.y - 300) <= 0 && py !== b.y) spinHit(b);
  if (b.x < 44 && (py - 250) * (b.y - 250) <= 0 && b.vy < 0) g.orbitT = g.time;
  if (b.y < 70 && (px - 200) * (b.x - 200) <= 0 && px !== b.x && g.time - g.orbitT < 2.5) lap();
  if (b.y < 112 && (py - 100) * (b.y - 100) <= 0 && py !== b.y) for (let i = 0; i < 3; i++) if (Math.abs(b.x - LANES[i]) < 15) laneHit(i);
  const v = spd(b);
  if (g.saucerCool <= 0 && Math.hypot(b.x - SAUCER.x, b.y - SAUCER.y) < 10 && v < 900) { capture(b, 'saucer'); return; }
  if (!g.cannon && g.scoopCool <= 0 && Math.hypot(b.x - SCOOP.x, b.y - SCOOP.y) < 11 && v < 1300) { capture(b, 'scoop'); return; }
  for (let k = 0; k < 2; k++) if (g.kick[k] && b.vy > 0 && b.y > 500 && b.y < 590 && (k ? b.x > 332 && b.x < 362 : b.x < 40)) { g.kick[k] = false; b.vy = -1050; b.vx = k ? -520 : 520; snd('cannon', null, 0); feature('slings', 100, b.x, 520, 'KICKBACK', TEAL); }   // straight back out of the outlane's mouth
  if (b.x > 362 && b.y > 690 && v < 40) { b.st = 'plunger'; b.x = PLUNGE.x; b.y = PLUNGE.y; b.vx = b.vy = 0; b.wait = 0; b.autoT = playing() ? 0.8 : null; return; }
  if (Math.abs(b.x - (b.ax ?? -99)) < 3 && Math.abs(b.y - (b.ay ?? -99)) < 3 && !g.fl.some((f) => f.on)) { b.still += h; if (b.still > 3) { b.still = 0; b.vy = -650; b.vx = (Math.random() - 0.5) * 300; } } else { b.ax = b.x; b.ay = b.y; b.still = 0; }   // a ball that sits still with nothing held: a little kick (ball search)
  // the tests' guard: a ball where no ball can be (out past the walls, inside a bumper or a sling, under a guide)
  const bad = b.x < 18 || b.x > 382 || b.y < 0 || (b.y < ARC.cy && Math.hypot(b.x - ARC.cx, b.y - ARC.cy) > ARC.r - R + 1) ||
    g.bumps.some((q) => Math.hypot(b.x - q.x, b.y - q.y) < 18 + R - 3) ||
    (b.x > 44 && b.x < 95 && b.y > 606 + (b.x - 40) * 0.322 && b.y < 724) || (b.x > 277 && b.x < 328 && b.y > 606 + (332 - b.x) * 0.322 && b.y < 724) ||
    SLING.some(([A, B, C]) => inTri(b.x, b.y, A, B, C));
  if (bad) { g.bad += 1; g.badAt = { x: +b.x.toFixed(1), y: +b.y.toFixed(1), vx: Math.round(b.vx), vy: Math.round(b.vy) }; }
  if (b.x < -20 || b.x > TW + 20 || b.y < -30) { g.escapes += 1; b.st = 'plunger'; b.x = PLUNGE.x; b.y = PLUNGE.y; b.vx = b.vy = 0; b.wait = 0; b.autoT = 0.5; }
}
function inTri(x, y, A, B, C) {   // inside the triangle, 3 units in from its edges (a ball's centre never gets there)
  const cx = (A[0] + B[0] + C[0]) / 3, cy = (A[1] + B[1] + C[1]) / 3, sh = (p) => [cx + (p[0] - cx) * 0.7, cy + (p[1] - cy) * 0.7], [a, b2, c] = [sh(A), sh(B), sh(C)];
  const s = (p, q) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]), d1 = s(a, b2), d2 = s(b2, c), d3 = s(c, a);
  return (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
}
function drained(b) {
  b.st = 'gone'; spark(b.x, 716, LILAC, 10, 120);
  const left = g.balls.filter((x) => x !== b && x.st !== 'gone');
  if (left.length || g.feed > 0) { if (g.multi && left.length + g.feed <= 1) { g.multi = false; dmd('MULTIBALL OVER', '', LILAC, 1.2); } snd('plunk'); return; }
  g.multi = false;
  if (g.saveT > 0 || g.saveBank > 0) {
    if (g.saveT <= 0) g.saveBank -= 1; g.saved += 1; g.saveT = 0;
    const nb = newBall('plunger'); nb.autoT = 0.7; host.banner('🛟 BALL SAVED', 'here it comes again'); dmd('BALL SAVED', '', TEAL, 1.5); snd('surface', null, 0);
    const w = toWorld(CX, 680); host.cue?.('near', w.x, w.y); return;
  }
  g.drains += 1; g.hurtT = 1.4; g.mult = 1; g.lanes = [false, false, false]; g.tiltT = 0; g.tilt = 0; g.shake = Math.max(g.shake, 6);
  snd('gulp', null, 0); navigator.vibrate?.(80); dmd('DRAINED', 'NEXT BALL', HOT, 1.6);
  newBall('plunger').first = true;
  host.hurt('drained'); host.banner('🕳️ OUCH · DRAINED', 'Fig slipped between the flippers');
}
function substep(h, G, Lf) {
  for (const f of g.fl) stepFlip(f, h);
  const tw = g.twist?.kind;
  for (const b of g.balls) {
    if (b.st === 'ramp') { stepRamp(b, h); continue; }
    if (b.st !== 'play') continue;
    const px = b.x, py = b.y;
    b.vy += G * h;
    if (tw === 'wind') b.vx += g.windDir * 520 * h;
    if (tw === 'magnet') { const dx = SAUCER.x - b.x, dy = SAUCER.y - b.y, d = Math.hypot(dx, dy); if (d < 170 && d > 1) { const f = 2600 * (1 - d / 170); b.vx += dx / d * f * h; b.vy += dy / d * f * h; if (d < 70) { b.vx *= 1 - 3 * h; b.vy *= 1 - 3 * h; } } }   // it pulls, and near the cup it holds
    const v = spd(b); if (v > VMAX) { b.vx *= VMAX / v; b.vy *= VMAX / v; }
    b.x += b.vx * h; b.y += b.vy * h;
    collide(b, Lf);
    { const v2 = spd(b); if (v2 > VMAX * 1.1) { b.vx *= VMAX * 1.1 / v2; b.vy *= VMAX * 1.1 / v2; } }
    sensors(b, px, py, h);
  }
  // ball against ball (equal masses)
  const bs = g.balls; for (let i = 0; i < bs.length; i++) { const a = bs[i]; if (a.st !== 'play') continue; for (let j = i + 1; j < bs.length; j++) { const c = bs[j]; if (c.st !== 'play') continue;
    const dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy; if (d2 >= 4 * R * R || d2 < 1e-9) continue;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (2 * R - d) / 2; a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
    const rv = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny; if (rv > 0) { const k = rv * 0.95; a.vx -= k * nx; a.vy -= k * ny; c.vx += k * nx; c.vy += k * ny; if (rv > 300) snd('clack', null, 0.05); } } }
}
function step(h) {
  const G = GRAV() * (g.twist?.kind === 'anti' ? -0.55 : 1), Lf = FLIPL();
  let vmax = 0; for (const b of g.balls) if (b.st === 'play') { const v = spd(b); if (v > vmax) vmax = v; }
  g.maxV = Math.max(g.maxV, vmax);
  const fw = Math.max(Math.abs(g.fl[0].w), Math.abs(g.fl[1].w), (g.fl[0].th !== (g.fl[0].on ? UP : REST) || g.fl[1].th !== (g.fl[1].on ? UP : REST)) ? 26 : 0) * Lf;
  const n = Math.min(14, Math.max(1, Math.ceil((vmax + fw) * h / (R * 0.33)))), hh = h / n;
  for (let i = 0; i < n; i++) substep(hh, G, Lf);
  g.balls = g.balls.filter((b) => b.st !== 'gone');
}
// ---------------------------------------------------------------- input
function launch(b, power) {
  if (!b || b.st !== 'plunger') return false;
  b.st = 'play'; b.vx = 0; b.vy = -(1350 + 1250 * Math.max(0, Math.min(1, power))); b.wait = 0; b.autoT = null;
  if (b.first) { b.first = false; g.saveT = Math.max(g.saveT, SAVER()); g.skill = Math.floor(Math.random() * 3); g.skillT = 5; }
  snd('putt', { power: 0.4 + power * 0.6 }, 0); g.pull = null; g.hint = Math.max(g.hint, 3);
  return true;
}
function toTable(p) { const x = (p.x - L.tx) / L.ts; return { x: g.mirror ? TW - x : x, y: (p.y - L.ty) / L.ts }; }
function toWorld(x, y) { return { x: L.tx + (g?.mirror ? TW - x : x) * L.ts, y: L.ty + y * L.ts }; }
function holdSides() {
  const on = [g.keys.l, g.keys.r]; g.ptr.forEach((q) => { if (!q.plunge) on[q.side] = true; });
  g.autoT.forEach((t, i) => { if (t > 0) on[i] = true; });
  for (let i = 0; i < 2; i++) setFlip(i, on[i]);
}
function setFlip(i, on) {
  const f = g.fl[i]; if (f.on === on) return; f.on = on;
  if (on) f.struck = false;
  if (on && g.tiltT <= 0) { snd('click', null, 0.03); rotateLanes(i); if (g.cannon) fireCannon(); }
}
function nudge() {
  if (!g || g.tiltT > 0) return false;
  g.nudges += 1; g.tilt += 1; g.shake = Math.max(g.shake, 7); snd('thud', null, 0);
  for (const b of g.balls) if (b.st === 'play') { b.vy -= 300; b.vx += (Math.random() - 0.5) * 180; }
  if (g.tilt >= 4.2) { g.tiltT = 4; g.tilt = 0; g.warned = false; snd('alarm', null, 0); host.banner('🚨 TILT', 'the flippers are dead for a moment'); dmd('TILT', 'EASY ON THE TABLE', HOT, 2); }
  else if (g.tilt >= 2.4 && !g.warned) { g.warned = true; snd('buzz', null, 0); dmd('DANGER', 'ONE MORE AND IT TILTS', HOT, 1.5); }
  return true;
}
function pointer(type, p, e) {
  if (!g) return;
  const id = e?.pointerId ?? 0, q = toTable(p);
  if (type === 'down') {
    const now = g.time, w = waiting();
    for (const o of g.ptr.values()) if (now - o.t < 0.18 && Math.hypot(o.x - q.x, o.y - q.y) < 80 && !o.nudged) { o.nudged = true; nudge(); }   // two fingers close together: a nudge
    const side = (g.mirror ? TW - q.x : q.x) < TW / 2 ? (g.mirror ? 1 : 0) : (g.mirror ? 0 : 1);
    const plunge = !!(w && !playing() && !g.pull);
    g.ptr.set(id, { side, x: q.x, y: q.y, t: now, plunge, nudged: false });
    if (plunge) { g.pull = { id, t0: now, drag: 0, y0: q.y }; snd('click', null, 0); }
    holdSides();
  } else if (type === 'move') {
    const o = g.ptr.get(id); if (!o) return;
    if (g.pull && g.pull.id === id) g.pull.drag = Math.max(0, Math.min(1, (q.y - g.pull.y0) / 140));
    else if (!o.nudged && g.time - o.t < 0.3 && o.y - q.y > 60) { o.nudged = true; nudge(); }   // a quick swipe up
  } else {
    const o = g.ptr.get(id); g.ptr.delete(id);
    if (g.pull && g.pull.id === id) { const w = waiting(); launch(w, pullPower()); }
    if (o || type === 'up') holdSides();
  }
}
const pullPower = () => (g.pull ? Math.max(g.pull.drag, Math.min(1, (g.time - g.pull.t0) / 0.9)) : 0);
function keydown(e) {
  if (!g || e.repeat) return;
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'z' || k === 'Z' || k === 'Shift' && e.location === 1) { g.keys.l = true; holdSides(); e.preventDefault?.(); }
  else if (k === 'ArrowRight' || k === 'm' || k === 'M' || k === '/' || k === 'Shift' && e.location === 2) { g.keys.r = true; holdSides(); e.preventDefault?.(); }
  else if (k === ' ' || k === 'ArrowDown' || k === 'Enter') { const w = waiting(); if (w && !playing()) { if (!g.pull) g.pull = { id: 'key', t0: g.time, drag: 0, y0: 0 }; } else { g.keys.l = g.keys.r = true; holdSides(); } e.preventDefault?.(); }
  else if (k === 'ArrowUp' || k === 'n' || k === 'N') { nudge(); e.preventDefault?.(); }
}
function keyup(e) {
  if (!g) return; const k = e.key;
  if (k === 'ArrowLeft' || k === 'z' || k === 'Z' || k === 'Shift' && e.location === 1) g.keys.l = false;
  else if (k === 'ArrowRight' || k === 'm' || k === 'M' || k === '/' || k === 'Shift' && e.location === 2) g.keys.r = false;
  else if (k === ' ' || k === 'ArrowDown' || k === 'Enter') { if (g.pull?.id === 'key') launch(waiting(), pullPower()); g.keys.l = g.keys.r = false; }
  holdSides();
}
// ---------------------------------------------------------------- update
function update(dt) {
  W = host?.W || W; if (!g) return; layout();
  g.time += dt;
  const dec = (k) => { if (g[k] > 0) g[k] = Math.max(0, g[k] - dt); };
  ['hurtT', 'goldT', 'fibT', 'surgeT', 'wizT', 'tiltT', 'saucerCool', 'scoopCool', 'skillT', 'freeze'].forEach(dec);
  if (playing()) dec('saveT');
  g.tilt = Math.max(0, g.tilt - dt * 0.35); if (g.tilt < 1.5) g.warned = false;
  if (g.mirrorT > 0) { g.mirrorT -= dt; if (g.mirrorT <= 0 && g.mirror) mirror(); }
  { const tgt = g.mirror ? -1 : 1; if (g.flipS !== tgt) { g.flipS += Math.sign(tgt - g.flipS) * dt * 6; if (host.reduceMotion || Math.abs(g.flipS - tgt) < 0.08) g.flipS = tgt; } }
  if (g.msg) { g.msg.t -= dt; if (g.msg.t <= 0) g.msg = null; }
  g.sling = g.sling.map((v) => Math.max(0, v - dt)); g.warFlash = g.warFlash.map((v) => Math.max(0, v - dt));
  g.shake *= Math.exp(-dt * 8); if (host.reduceMotion || g.shake < 0.3) { g.sx = g.sy = 0; } else { g.sx = (Math.random() - 0.5) * g.shake * host.dpr; g.sy = (Math.random() - 0.5) * g.shake * host.dpr; }
  if (g.hint > 0 && playing()) g.hint -= dt;
  // the debug autoplay: flips a flipper when a ball comes down onto it (the tests use it to keep a ball alive)
  if (g.auto) { const Lf = FLIPL(); g.autoT = g.autoT.map((t) => Math.max(0, t - dt)); g.fl.forEach((f, i) => { if (g.autoT[i] > 0) return; for (const b of g.balls) { if (b.st !== 'play') continue; const along = (b.x - f.px) * f.s; if (along > -6 && along < Lf + 12 && b.y > f.py - 52 && b.y < f.py + 44 && b.vy > -80) { g.autoT[i] = 0.2; break; } } }); holdSides(); }
  // the plunger: a waiting ball goes by itself in a multiball (or after a long wait)
  for (const b of g.balls) if (b.st === 'plunger') { b.wait += dt; if (b.autoT != null ? b.wait > b.autoT : b.wait > 12 && !g.pull) launch(b, b.autoT != null ? 0.45 + Math.random() * 0.2 : 0.5); }
  if (g.feed > 0) { g.feedT -= dt; if (g.feedT <= 0 && !g.balls.some((b) => b.x > 362 && b.y > 600 && b.st !== 'gone')) { g.feed -= 1; g.feedT = 0.7; const nb = newBall('plunger'); nb.autoT = 0.25; } }
  // physics
  if (g.freeze <= 0) { g.acc = Math.min(g.acc + dt, 0.06); while (g.acc >= STEP) { g.acc -= STEP; step(STEP); } }
  // held balls: the cup putts back out, the cannon fires (by itself if nobody does), the shell flies
  for (const b of g.balls) {
    if (b.st === 'saucer') { b.hold += dt; if (b.hold > 1.1) { b.st = 'play'; g.saucerCool = 0.6; const a = Math.atan2(560 - SAUCER.y, 112 - SAUCER.x) + (Math.random() - 0.5) * 0.12; b.vx = Math.cos(a) * 560; b.vy = Math.sin(a) * 560; snd('putt', { power: 0.6 }, 0); } }
    if (b.st === 'air') { b.air.t += dt; const u = Math.min(1, b.air.t / b.air.T); b.x = b.air.x0 + (b.air.x1 - b.air.x0) * u; b.y = b.air.y0 + (b.air.y1 - b.air.y0) * u; if (u >= 1) land(b); }
    if (b.st === 'play') { b.rot += (b.vx * dt) / R * 0.8; b.tr.push(b.x, b.y); if (b.tr.length > 16) b.tr.splice(0, 2); } else b.tr.length = 0;
  }
  if (g.cannon) { g.cannon.t += dt; if (g.cannon.t > 4) fireCannon(); }
  // the moving parts
  g.tank.x += g.tank.dir * 34 * dt * (1 + 0.25 * (ST() - 1)); if (g.tank.x > 280) g.tank.dir = -1; if (g.tank.x < 92) g.tank.dir = 1; if (g.tank.boom > 0) g.tank.boom -= dt;
  { const sq = g.squirrel; sq.t += dt; if (sq.out > 0) sq.out -= dt; sq.off = sq.hold ? 0 : Math.sin(sq.t * (1.8 + 0.3 * ST())) * 1.2; }
  { const s = g.spin; if (s.w > 0.05) { const a0 = s.a; s.a += s.w * dt; s.w *= Math.exp(-dt * 1.6); if (Math.floor(s.a / (2 * Math.PI)) > Math.floor(a0 / (2 * Math.PI))) spinTurn(); } else s.w = 0; }
  if (g.war.flip > 0) g.war.flip = Math.max(0, g.war.flip - dt);
  if (g.dropReset > 0) { g.dropReset -= dt; if (g.dropReset <= 0) { g.drop = g.drop.map(() => true); g.sunk = [false, false]; snd('clack', null, 0); } }
  g.bumps.forEach((bp) => { bp.flash = Math.max(0, bp.flash - dt); });
  if (g.twist) {
    const tw = g.twist; tw.t += dt;
    if (tw.kind === 'wander') {   // each bumper's x walks the logistic map at r = 3.9, a step every half second, eased
      g.bumps.forEach((bp, i) => { bp.ot = (bp.ot || 0) + dt; if (bp.ot > 0.5) { bp.ot = 0; bp.ox = 3.9 * bp.ox * (1 - bp.ox); bp.tr.push(bp.x); if (bp.tr.length > 6) bp.tr.shift(); }
        const tx = i === 2 ? 110 + 152 * bp.ox : 92 + 188 * bp.ox, ok = g.bumps.every((o, j) => j === i || o.by !== bp.by || Math.abs(o.x - tx) > 44); if (ok) bp.x += (tx - bp.x) * Math.min(1, dt * 5); });
    }
    g.tris.forEach((t) => { t.grace = Math.max(0, t.grace - dt); });
    if (tw.t >= tw.dur) endTwist();
  }
  if (!g.twist || g.twist.kind !== 'wander') g.bumps.forEach((bp) => { bp.x += (bp.bx - bp.x) * Math.min(1, dt * 3); });
  g.fx.forEach((f) => { f.life -= dt; f.y -= 24 * dt; }); g.fx = g.fx.filter((f) => f.life > 0);
  g.sp.forEach((p) => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= 0.97; }); g.sp = g.sp.filter((p) => p.life > 0);
}
function spark(x, y, c, n, v) { for (let i = 0; i < n && g.sp.length < 140; i++) { const a = Math.random() * 6.28, s = v * (0.3 + Math.random() * 0.7); g.sp.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, c, life: 0.4 + Math.random() * 0.35, r: 1 + Math.random() * 1.6 }); } }
function text(x, y, t, col = GOLD) { if (g.fx.length > 10) g.fx.shift(); g.fx.push({ x, y, text: t, col, life: 1 }); }
// ---------------------------------------------------------------- the look: the playfield painted once, lamps and parts on top
const L = { ts: 1, tx: 0, ty: 0, dy: 0, a: 1 };
const look = { key: '', at: -1e9, pf: null, uv: null, ramp: null, rampBox: null, sa: 0, spr: {}, dmdBuf: new Uint8Array(DMD_W * DMD_H), dmdImg: null, dmdSmall: null, dmdMask: null, dmdKey: '', dmdAt: -1e9 };
function layout() {
  W = host.W; const H = host.H, hud = Math.max(0, (70 * host.dpr - (host.oy || 0)) / host.k);
  const ts = Math.max(0.3, Math.min(W / TW, (H - hud - 4) / (TH + DMDH)));
  L.ts = ts; L.tx = (W - TW * ts) / 2; L.dy = hud + 2; L.ty = L.dy + DMDH * ts; L.a = host.k * ts;
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function tf(c = ctx) { const s = Math.abs(g.flipS) < 0.03 ? 0.03 * Math.sign(g.flipS || 1) : g.flipS, a = L.a, xc = (host.ox || 0) + (L.tx + TW / 2 * L.ts) * host.k; c.setTransform(a * s, 0, 0, a, xc - s * TW / 2 * a + g.sx, (host.oy || 0) + L.ty * host.k + g.sy); }
function sprite(key, w, h, paint) {   // drawn once at the table's scale, in table units centred on (0, 0)
  const sa = look.sa, hit = look.spr[key]; if (hit) return hit;
  const c = mk(w * sa, h * sa), x = c.getContext('2d'); x.scale(sa, sa); x.translate(w / 2, h / 2); paint(x);
  return (look.spr[key] = { c, w, h });
}
const put = (sp, x, y, sc = 1) => ctx.drawImage(sp.c, x - sp.w * sc / 2, y - sp.h * sc / 2, sp.w * sc, sp.h * sc);
function glowSpr(col) { return sprite('glow' + col, 64, 64, (x) => { const gr = x.createRadialGradient(0, 0, 0, 0, 0, 32); gr.addColorStop(0, col + 'EE'); gr.addColorStop(0.35, col + '66'); gr.addColorStop(1, col + '00'); x.fillStyle = gr; x.fillRect(-32, -32, 64, 64); }); }
function iconSpr(ch, z) { return sprite('ic' + ch + z, z * 1.4, z * 1.4, (x) => { x.font = `${z}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 0, z * 0.06); }); }
function sierpinski(c, x, y, z, d) { if (d === 0) { c.moveTo(x, y - z * 0.577); c.lineTo(x + z / 2, y + z * 0.289); c.lineTo(x - z / 2, y + z * 0.289); c.closePath(); return; } const h = z / 2; sierpinski(c, x, y - h * 0.577, h, d - 1); sierpinski(c, x - h / 2, y + h * 0.289, h, d - 1); sierpinski(c, x + h / 2, y + h * 0.289, h, d - 1); }
const outline = (c) => { c.beginPath(); c.moveTo(10, TH + 4); c.lineTo(10, ARC.cy); c.arc(ARC.cx, ARC.cy, ARC.r, Math.PI, 2 * Math.PI); c.lineTo(390, TH + 4); c.closePath(); };
function wallPaths(c, fn) {   // every wall, as strokes: the arc and the segments (drop targets, war and sling faces drawn on their own)
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.arc(ARC.cx, ARC.cy, ARC.r, Math.PI, 2 * Math.PI); fn('arc');
  SEGS.forEach((s) => { if (s.kind === 'drop' || s.kind === 'war') return; c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); fn(s.kind, s); });
}
function buildLook(t) {
  const cv = host.cv, k = host.k, a = L.a, ox = host.ox || 0, oy = host.oy || 0, x0 = ox + L.tx * k, y0 = oy + L.ty * k;
  look.key = `${cv.width}x${cv.height}|${k.toFixed(4)}|${L.ts.toFixed(4)}|${ox}|${oy}`; look.at = t;
  if (!look.sa || Math.abs(a - look.sa) / look.sa > 0.12) { look.sa = a; look.spr = {}; }
  // the playfield
  const pf = mk(cv.width, cv.height), c = pf.getContext('2d');
  { const gr = c.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, '#0A0818'); gr.addColorStop(1, '#05040C'); c.fillStyle = gr; c.fillRect(0, 0, cv.width, cv.height); }
  c.setTransform(a, 0, 0, a, x0, y0);
  c.fillStyle = '#100C26'; c.beginPath(); c.roundRect(-6, -10, TW + 12, TH + 26, 14); c.fill();   // the cabinet's rails
  c.strokeStyle = 'rgba(245,197,66,0.35)'; c.lineWidth = 1.2; c.stroke();
  outline(c); { const gr = c.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, '#221A55'); gr.addColorStop(0.5, '#171239'); gr.addColorStop(1, '#0E0B26'); c.fillStyle = gr; c.fill(); }
  c.save(); outline(c); c.clip();
  // the art: the curve's own picture behind the bumpers (the bifurcation diagram), a golden spiral round the cup,
  // a sunflower of 233 seeds (the golden angle) under the ring of games, Sierpiński in the slings
  for (let i = 0; i < 260; i++) { const r = 2.6 + 1.4 * i / 260; let x = 0.4; for (let n = 0; n < 80; n++) x = r * x * (1 - x); c.fillStyle = r < 3 ? TEAL : r < 3.449 ? LILAC : r < 3.5699 ? GOLD : HOT; c.globalAlpha = 0.16; for (let n = 0; n < 40; n++) { x = r * x * (1 - x); c.fillRect(60 + i, 250 - x * 120, 1, 1); } }
  c.globalAlpha = 1;
  { c.save(); c.translate(SAUCER.x, SAUCER.y); c.strokeStyle = 'rgba(245,197,66,0.22)'; c.lineWidth = 1.2; c.beginPath(); let ang = 0, rr = 3; for (let i = 0; i < 200; i++) { ang += 0.08; rr *= Math.pow(1.618, 0.08 / (Math.PI / 2)); c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); if (rr > 46) break; } c.stroke(); c.restore(); }
  for (let i = 0; i < 233; i++) { const r = 3.6 * Math.sqrt(i), th = i * 2.39996; c.fillStyle = i % 8 === 0 ? 'rgba(245,197,66,0.3)' : 'rgba(201,184,255,0.12)'; c.beginPath(); c.arc(CX + Math.cos(th) * r, 560 + Math.sin(th) * r * 0.8, 1.3, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(61,214,198,0.06)'; c.fillRect(10, 200, 34, 200); c.fillStyle = 'rgba(155,231,255,0.08)'; c.fillRect(362, 260, 28, 460);   // the orbit and the shooter lanes
  c.restore();
  // lamps, unlit: dark lenses
  lampList().forEach((l) => { c.fillStyle = 'rgba(8,6,20,0.75)'; c.beginPath(); if (l.arrow) { c.save(); c.translate(l.x, l.y); c.rotate(l.arrow); c.moveTo(0, -l.r * 1.3); c.lineTo(l.r, l.r * 0.8); c.lineTo(-l.r, l.r * 0.8); c.closePath(); c.restore(); } else c.arc(l.x, l.y, l.r, 0, 7); c.fill(); c.strokeStyle = l.col + '55'; c.lineWidth = 1; c.stroke(); });
  RING.forEach((p, i) => { c.fillStyle = '#07050F'; c.beginPath(); c.arc(p.x, p.y, 10, 0, 7); c.fill(); c.strokeStyle = 'rgba(245,197,66,0.45)'; c.lineWidth = 1.2; c.stroke(); c.globalAlpha = 0.42; c.font = '10px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(GAMES[i][0], p.x, p.y + 0.5); c.globalAlpha = 1; });
  c.fillStyle = 'rgba(245,197,66,0.5)'; c.font = '800 7px Sora, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('LIGHT ALL 7 FOR R = 4', CX, 514);
  // the saucer (a cup), the scoop (a cannon's mouth), the drop target slots, the spinner's posts
  { c.fillStyle = '#05040C'; c.beginPath(); c.arc(SAUCER.x, SAUCER.y, 13, 0, 7); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1; c.beginPath(); c.arc(SAUCER.x, SAUCER.y, 10, Math.PI * 1.1, Math.PI * 1.8); c.stroke(); }
  { c.fillStyle = '#05040C'; c.beginPath(); c.arc(SCOOP.x, SCOOP.y, 14, 0, 7); c.fill(); c.strokeStyle = HOT; c.lineWidth = 2; c.stroke(); }
  for (let i = 0; i < 5; i++) { c.fillStyle = '#05040C'; c.fillRect(341, 340 + i * 26, 8, 20); }
  c.fillStyle = '#C9B8FF'; [[10, 300], [44, 300]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
  // the walls: a dark base, violet metal, a highlight
  wallPaths(c, (kind) => { c.strokeStyle = '#05040C'; c.lineWidth = kind === 'post' ? 12 : 9; c.stroke(); });
  wallPaths(c, (kind) => { c.strokeStyle = kind === 'post' ? '#F2EEFF' : kind === 'sling' ? '#F2EEFF' : kind === 'gate' ? GOLD : '#4B3F96'; c.lineWidth = kind === 'post' ? 8 : kind === 'sling' ? 5 : 4.5; c.stroke(); });
  wallPaths(c, (kind) => { if (kind === 'post' || kind === 'sling') return; c.strokeStyle = 'rgba(201,184,255,0.55)'; c.lineWidth = 1.2; c.stroke(); });
  SLING.forEach(([A, B, C2]) => { c.save(); c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.lineTo(...C2); c.closePath(); c.fillStyle = 'rgba(255,95,176,0.16)'; c.fill(); c.clip(); c.fillStyle = 'rgba(255,95,176,0.4)'; c.beginPath(); const cx = (A[0] + B[0] + C2[0]) / 3, cy = (A[1] + B[1] + C2[1]) / 3; sierpinski(c, cx, cy + 2, 46, 3); c.fill(); c.restore(); });
  // the war standups' pads
  SEGS.filter((s) => s.kind === 'war').forEach((s) => { c.strokeStyle = '#05040C'; c.lineWidth = 10; c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.stroke(); c.strokeStyle = HOT; c.lineWidth = 6; c.stroke(); });
  // labels: one small icon by each game
  [['🏎️', 27, 470, 12], ['🔺', 27, 330, 11], ['🐿️', 90, 372, 12], ['⛳', CX, 328, 12], ['💥', 272, 216, 12], ['⚓', 328, 326, 12]].forEach(([ch, x, y, z]) => { c.globalAlpha = 0.8; c.font = `${z}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x, y); c.globalAlpha = 1; });
  c.font = '800 9px Sora, system-ui, sans-serif'; c.fillStyle = 'rgba(201,184,255,0.55)'; c.textAlign = 'center'; c.fillText('r4box · r = 4', CX, 706); c.fillText('F', 146, 120); c.fillText('I', 186, 120); c.fillText('G', 226, 120);
  c.fillStyle = 'rgba(245,197,66,0.4)'; c.font = '800 7px Sora, system-ui, sans-serif'; c.fillText('SAVE', CX, 690);
  look.pf = pf;
  // 🌊 the blacklight copy: the walls in neon, on nothing
  const uv = mk(cv.width, cv.height), u = uv.getContext('2d'); u.setTransform(a, 0, 0, a, x0, y0);
  wallPaths(u, (kind) => { u.strokeStyle = kind === 'sling' || kind === 'post' ? 'rgba(255,95,176,0.22)' : 'rgba(155,231,255,0.18)'; u.lineWidth = 12; u.stroke(); });
  wallPaths(u, (kind) => { u.strokeStyle = kind === 'sling' || kind === 'post' ? '#FF5FB0' : '#9BE7FF'; u.lineWidth = 2; u.stroke(); });
  u.strokeStyle = 'rgba(245,197,66,0.8)'; u.lineWidth = 1.5; u.beginPath(); u.arc(SAUCER.x, SAUCER.y, 14, 0, 7); u.stroke(); u.beginPath(); u.arc(SCOOP.x, SCOOP.y, 15, 0, 7); u.stroke();
  RING.forEach((p) => { u.strokeStyle = 'rgba(201,184,255,0.7)'; u.lineWidth = 1; u.beginPath(); u.arc(p.x, p.y, 9, 0, 7); u.stroke(); });
  look.uv = uv;
  // the ramp: a clear plastic climb, then a wire return
  const rp = mk(cv.width, cv.height), r = rp.getContext('2d'); r.setTransform(a, 0, 0, a, x0, y0); r.lineCap = 'round'; r.lineJoin = 'round';
  const along = (i0, i1, off) => { r.beginPath(); for (let i = i0; i <= i1; i++) { const p = RAMP[i], q = RAMP[Math.min(RAMP.length - 1, i + 1)], o = RAMP[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1; r[i === i0 ? 'moveTo' : 'lineTo'](p[0] - dy / l * off, p[1] + dx / l * off); } };
  r.globalAlpha = 0.28; r.strokeStyle = '#000'; r.lineWidth = 30; along(0, RAMP_TOP, 0); r.translate(4, 6); r.stroke(); r.translate(-4, -6);   // its shadow on the playfield
  r.globalAlpha = 1; r.strokeStyle = 'rgba(185,166,255,0.2)'; r.lineWidth = 26; along(0, RAMP_TOP, 0); r.stroke();
  r.strokeStyle = 'rgba(242,238,255,0.8)'; r.lineWidth = 1.8; along(0, RAMP_TOP, 13); r.stroke(); along(0, RAMP_TOP, -13); r.stroke();
  r.strokeStyle = 'rgba(245,197,66,0.35)'; r.lineWidth = 1; r.setLineDash([2, 6]); along(0, RAMP_TOP, 0); r.stroke(); r.setLineDash([]);
  r.strokeStyle = 'rgba(0,0,0,0.5)'; r.lineWidth = 4; along(RAMP_TOP - 1, RAMP.length - 1, 7); r.stroke(); along(RAMP_TOP - 1, RAMP.length - 1, -7); r.stroke();
  r.strokeStyle = '#D8D4EA'; r.lineWidth = 1.6; along(RAMP_TOP - 1, RAMP.length - 1, 7); r.stroke(); along(RAMP_TOP - 1, RAMP.length - 1, -7); r.stroke();
  for (let s = RAMPL[RAMP_TOP]; s < RAMP_LEN; s += 22) { const p = rampAt(s); r.strokeStyle = 'rgba(216,212,234,0.6)'; r.lineWidth = 1; r.beginPath(); r.moveTo(p.x - p.ty * 8, p.y + p.tx * 8); r.lineTo(p.x + p.ty * 8, p.y - p.tx * 8); r.stroke(); }
  r.fillStyle = GOLD; r.font = '800 7px Sora, system-ui, sans-serif'; r.textAlign = 'center'; r.save(); r.translate(90, 270); r.rotate(-Math.PI / 2); r.fillText('SQUIRREL RAMP', 0, 2.5); r.restore();
  look.ramp = rp; { const bx0 = 10, bx1 = 120, by0 = 110, by1 = 510; look.rampBox = [Math.floor(x0 + bx0 * a), Math.floor(y0 + by0 * a), Math.ceil((bx1 - bx0) * a), Math.ceil((by1 - by0) * a)]; }
  // the dot-matrix display: its glass and its dots
  const dw = 320 * L.ts * k, dh = dw * DMD_H / DMD_W, pitch = dw / DMD_W;
  const m = mk(dw, dh), mx = m.getContext('2d'); mx.fillStyle = '#07050F'; mx.fillRect(0, 0, m.width, m.height); mx.globalCompositeOperation = 'destination-out';
  for (let j = 0; j < DMD_H; j++) for (let i = 0; i < DMD_W; i++) { mx.beginPath(); mx.arc((i + 0.5) * pitch, (j + 0.5) * pitch, pitch * 0.4, 0, 7); mx.fill(); }
  mx.globalCompositeOperation = 'source-over'; { const gr = mx.createLinearGradient(0, 0, 0, m.height); gr.addColorStop(0, 'rgba(255,255,255,0.07)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); mx.fillStyle = gr; mx.fillRect(0, 0, m.width, m.height * 0.5); }
  look.dmdMask = m;
  if (!look.dmdSmall) { look.dmdSmall = mk(DMD_W, DMD_H); look.dmdImg = look.dmdSmall.getContext('2d').createImageData(DMD_W, DMD_H); }
  look.dmdKey = '';
}
function lampList() {
  return [
    ...LANES.map((x, i) => ({ id: 'fig' + i, x, y: 106, r: 4.5, col: GOLD, on: () => g.lanes[i] || (g.skillT > 0 && g.skill === i && Math.sin(g.time * 18) > 0) })),
    { id: 'save', x: CX, y: 698, r: 5, col: TEAL, on: () => (g.saveT > 0 ? (g.saveT < 2 ? Math.sin(g.time * 20) > 0 : true) : g.saveBank > 0 && Math.sin(g.time * 4) > 0) },
    { id: 'kbL', x: 25, y: 560, r: 4.5, col: TEAL, on: () => g.kick[0] }, { id: 'kbR', x: 347, y: 560, r: 4.5, col: TEAL, on: () => g.kick[1] },
    { id: 'orbit', x: 66, y: 462, r: 6, col: TEAL, arrow: -0.75, on: () => g.time - g.orbitT < 2.5 || (g.laps % 3 === 2 && Math.sin(g.time * 6) > 0) },
    { id: 'ramp', x: 90, y: 388, r: 6, col: LILAC, arrow: 0, on: () => g.balls.some((b) => b.st === 'ramp') || Math.sin(g.time * 3) > 0.6 },
    { id: 'cup', x: CX, y: 340, r: 6, col: GOLD, arrow: 0, on: () => g.jackpot ? Math.sin(g.time * 12) > 0 : g.balls.some((b) => b.st === 'saucer') },
    { id: 'scoop', x: 280, y: 262, r: 6, col: HOT, arrow: 0.75, on: () => !!g.cannon || g.balls.some((b) => b.st === 'air') },
    ...[0, 1, 2, 3, 4].map((i) => ({ id: 'ship' + i, x: 330, y: 350 + i * 26, r: 3.5, col: ICE, on: () => !g.drop[i] })),
    { id: 'warL', x: 124, y: 470, r: 4.5, col: HOT, on: () => { const w = g.war; return (w.tie ? !w.tieHit[0] : w.l > w.r) && Math.sin(g.time * 7) > -0.2; } },
    { id: 'warR', x: 248, y: 470, r: 4.5, col: HOT, on: () => { const w = g.war; return (w.tie ? !w.tieHit[1] : w.r > w.l) && Math.sin(g.time * 7) > -0.2; } },
    { id: 'spin', x: 27, y: 360, r: 4, col: HOT, on: () => g.spin.w > 1 },
  ];
}
let LAMPS = null;
// ---------------------------------------------------------------- draw
function draw(t) {
  W = host?.W || W; if (!g) return;
  layout();
  const cv = host.cv, k = host.k;
  { const key = `${cv.width}x${cv.height}|${k.toFixed(4)}|${L.ts.toFixed(4)}|${host.ox || 0}|${host.oy || 0}`; if (key !== look.key && (!look.pf || t - look.at > 300)) buildLook(t); }
  if (!LAMPS) LAMPS = lampList();
  const ts = t / 1000, s = g.flipS, xc = (host.ox || 0) + (L.tx + TW / 2 * L.ts) * k;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (Math.abs(s) < 0.999) { ctx.fillStyle = '#05040C'; ctx.fillRect(0, 0, cv.width, cv.height); }
  const ss = Math.abs(s) < 0.03 ? 0.03 : s;
  ctx.setTransform(ss, 0, 0, 1, xc * (1 - ss) + g.sx, g.sy); ctx.drawImage(look.pf, 0, 0);
  tf();
  // lamps (lit): a glow and a bright lens
  ctx.globalCompositeOperation = 'lighter';
  LAMPS.forEach((l) => { if (!l.on()) return; const gs = glowSpr(l.col); put(gs, l.x, l.y, l.r / 9); ctx.fillStyle = l.col; ctx.globalAlpha = 0.9; if (l.arrow != null) { ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.arrow); ctx.beginPath(); ctx.moveTo(0, -l.r * 1.3); ctx.lineTo(l.r, l.r * 0.8); ctx.lineTo(-l.r, l.r * 0.8); ctx.closePath(); ctx.fill(); ctx.restore(); } else { ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; });
  RING.forEach((p, i) => { const on = g.ring[i] || (g.wizT > 0 && Math.sin(g.time * 10 + i) > 0); if (!on) return; put(glowSpr(GOLD), p.x, p.y, 0.55); });
  ctx.globalCompositeOperation = 'source-over';
  RING.forEach((p, i) => { if (g.ring[i]) put(iconSpr(GAMES[i][0], 11), p.x, p.y); });
  // the moving parts: drop targets (ships), bumpers, sling flashes, the spinner, the cards, the cannon, the tank
  for (let i = 0; i < 5; i++) { if (!g.drop[i]) continue; const y = 338 + i * 26 + 2; ctx.fillStyle = '#05040C'; ctx.fillRect(339, y - 1, 10, 22); ctx.fillStyle = i < 2 ? '#9BB4C8' : '#7FA0B8'; ctx.fillRect(340, y, 7, 20); ctx.fillStyle = '#E7F3FF'; ctx.fillRect(340, y, 2, 20); ctx.fillStyle = i < 2 ? HOT : TEAL; ctx.fillRect(345, y + 3, 2, 14); }
  const sur = g.surgeT > 0;
  g.bumps.forEach((bp) => {
    if (bp.tr.length && g.twist?.kind === 'wander') { ctx.fillStyle = 'rgba(255,95,176,0.35)'; bp.tr.forEach((x) => { ctx.beginPath(); ctx.arc(x, bp.y, 3, 0, 7); ctx.fill(); }); }
    const f = bp.flash > 0 ? bp.flash / 0.14 : 0, sc = 1 + 0.12 * Math.min(1, f);
    if (f > 0 || sur) { ctx.globalCompositeOperation = 'lighter'; put(glowSpr(sur ? HOT : TEAL), bp.x, bp.y, (sur ? 1.15 : 0.9) * (0.6 + 0.4 * Math.min(1, f + (sur ? 0.5 : 0)))); ctx.globalCompositeOperation = 'source-over'; }
    put(bumperSpr(f > 0.2 || sur), bp.x, bp.y, sc);
  });
  SLING.forEach(([A, , C2], i) => { if (g.sling[i] <= 0) return; ctx.strokeStyle = HOT; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...C2); ctx.stroke(); });
  { const sp = g.spin, h = 9 * Math.abs(Math.cos(sp.a)); ctx.fillStyle = sp.w > 1 ? HOT : '#C9B8FF'; ctx.fillRect(13, 300 - h / 2, 28, Math.max(1, h)); ctx.fillStyle = '#05040C'; ctx.fillRect(13, 299.5, 28, 1); }
  drawCards(ts);
  drawCannon(ts);
  g.tris.forEach((tri) => { ctx.globalAlpha = tri.grace > 0 ? 0.5 : 1; ctx.fillStyle = [HOT, GOLD, TEAL][tri.d]; ctx.beginPath(); sierpinski(ctx, tri.x, tri.y, tri.s, 2 - tri.d); ctx.fill(); ctx.globalAlpha = 1; });
  if (ST() === 1) { ctx.fillStyle = '#05040C'; ctx.beginPath(); ctx.arc(POST.x, POST.y, POST.r + 2, 0, 7); ctx.fill(); ctx.fillStyle = '#F2EEFF'; ctx.beginPath(); ctx.arc(POST.x, POST.y, POST.r, 0, 7); ctx.fill(); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(POST.x, POST.y, 2.5, 0, 7); ctx.fill(); }
  // 🌊 going under: the room lights go out and the table glows under blacklight: neon rails, the lamps and Fig
  { const f = host.deep?.() || 0; if (f > 0.02) {
    ctx.fillStyle = `rgba(6,3,20,${0.66 * f})`; ctx.fillRect(0, 0, TW, TH + 10);
    ctx.save(); ctx.setTransform(ss, 0, 0, 1, xc * (1 - ss) + g.sx, g.sy); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f * (0.85 + 0.15 * Math.sin(ts * 2.2)); ctx.drawImage(look.uv, 0, 0); ctx.restore();
    tf(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f * 0.8;
    for (let i = 0; i < 16; i++) { const ph = i * 2.399, x = 30 + ((Math.sin(ph * 3.1) * 0.5 + 0.5) * 330 + ts * (6 + i % 4)) % 340, y = TH - ((ts * (14 + (i % 5) * 5) + i * 61) % (TH + 40)); ctx.fillStyle = i % 3 ? '#9BE7FF' : '#FF5FB0'; ctx.fillRect(x, y, 1.6, 1.6); }
    g.balls.forEach((b) => { if (b.st !== 'gone') put(glowSpr(i2c(b)), b.x, b.y, 0.9); });
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  } }
  // flippers, then the balls on the playfield, then the ramp, then the balls on it (and the squirrel), then shells in the air
  g.fl.forEach((f) => { const sp = flipSpr(FLIPL()); ctx.save(); ctx.translate(f.px, f.py); ctx.scale(f.s, 1); ctx.rotate(f.th); ctx.drawImage(sp.c, -sp.p, -sp.p, sp.w, sp.h); ctx.restore(); });
  drawPlunger();
  g.balls.forEach((b) => { if (b.st === 'play' || b.st === 'plunger' || b.st === 'saucer' || b.st === 'scoop') drawBall(b, ts, 0); });
  { const [bx, by, bw, bh] = look.rampBox; ctx.save(); ctx.setTransform(ss, 0, 0, 1, xc * (1 - ss) + g.sx, g.sy); ctx.drawImage(look.ramp, bx, by, bw, bh, bx, by, bw, bh); ctx.restore(); }
  drawSquirrel(ts);
  g.balls.forEach((b) => { if (b.st === 'ramp') drawBall(b, ts, 4 * rampZ(b.ramp.s)); });
  g.balls.forEach((b) => { if (b.st === 'air') { const u = b.air.t / b.air.T; drawBall(b, ts, Math.sin(u * Math.PI) * 60); } });
  // fx: sparks (light), words
  ctx.globalCompositeOperation = 'lighter'; g.sp.forEach((p) => { ctx.globalAlpha = Math.min(1, p.life * 2.5); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.lineJoin = 'round'; ctx.textAlign = 'center';
  g.fx.forEach((f) => { ctx.save(); ctx.translate(f.x, f.y); if (s < 0) ctx.scale(-1, 1); ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.8)); ctx.font = '900 12px Sora, system-ui, sans-serif'; ctx.strokeStyle = '#07050F'; ctx.lineWidth = 3.5; ctx.strokeText(f.text, 0, 0); ctx.fillStyle = f.col; ctx.fillText(f.text, 0, 0); ctx.restore(); });
  ctx.globalAlpha = 1;
  // hints, kept short: how to launch, how to flip
  if (waiting() && !playing()) { const pw = pullPower(); ctx.save(); ctx.translate(CX, 646); if (s < 0) ctx.scale(-1, 1); ctx.font = '900 11px Sora, system-ui, sans-serif'; ctx.fillStyle = `rgba(255,224,138,${0.65 + 0.35 * Math.sin(ts * 5)})`; ctx.strokeStyle = '#07050F'; ctx.lineWidth = 3; const tx = g.pull ? `POWER ${Math.round(pw * 100)}%` : 'HOLD · LET GO TO LAUNCH'; ctx.strokeText(tx, 0, 0); ctx.fillText(tx, 0, 0); ctx.restore(); }
  else if (g.hint > 0 && g.hint < 3) { ctx.save(); ctx.globalAlpha = Math.min(1, g.hint); ctx.translate(CX, 646); if (s < 0) ctx.scale(-1, 1); ctx.font = '900 11px Sora, system-ui, sans-serif'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#07050F'; ctx.lineWidth = 3; ctx.strokeText('◀ TAP LEFT · TAP RIGHT ▶', 0, 0); ctx.fillText('◀ TAP LEFT · TAP RIGHT ▶', 0, 0); ctx.restore(); }
  drawDMD(t);
}
const i2c = (b) => (g.goldT > 0 ? GOLD : g.wizT > 0 ? HOT : TEAL);
function bumperSpr(lit) {
  return sprite('bump' + (lit ? 1 : 0), 44, 44, (x) => {
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.arc(2, 3, 19, 0, 7); x.fill();
    x.fillStyle = lit ? '#FF5FB0' : '#4B3F96'; x.beginPath(); x.arc(0, 0, 18, 0, 7); x.fill();
    x.strokeStyle = '#F2EEFF'; x.lineWidth = 2.4; x.beginPath(); x.arc(0, 0, 16.5, 0, 7); x.stroke();
    const gr = x.createRadialGradient(-4, -5, 1, 0, 0, 12); gr.addColorStop(0, lit ? '#FFF2FA' : '#E7E0FF'); gr.addColorStop(1, lit ? '#FF8FC8' : '#7C6CD6'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 12, 0, 7); x.fill();
    x.fillStyle = lit ? '#7A1046' : '#241B5C'; x.font = '900 8px Sora, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('r4', 0, 0.5);
  });
}
function flipSpr(Lf) {
  const p = 11, w = Lf + p * 2, h = p * 2;
  const sp = sprite('flip' + Lf, w, h, (x) => {
    x.translate(-w / 2 + p, 0);
    const shape = (o) => { x.beginPath(); x.arc(0, 0, 9 + o, Math.PI / 2, Math.PI * 1.5); x.lineTo(Lf, -5 - o); x.arc(Lf, 0, 5 + o, -Math.PI / 2, Math.PI / 2); x.closePath(); };
    x.fillStyle = 'rgba(0,0,0,0.5)'; x.save(); x.translate(1.5, 2.5); shape(0.5); x.fill(); x.restore();
    x.fillStyle = '#F2EEFF'; shape(0); x.fill();
    const gr = x.createLinearGradient(0, -7, 0, 7); gr.addColorStop(0, '#7FF5E8'); gr.addColorStop(1, '#1E9C8F'); x.fillStyle = gr; shape(-2); x.fill();
    x.fillStyle = GOLD; x.beginPath(); x.arc(0, 0, 3, 0, 7); x.fill();
  });
  return { c: sp.c, w: sp.w, h: sp.h, p };
}
function drawBall(b, ts, z) {
  const x = b.x, y = b.y - z * 0.6, sc = 1 + z * 0.012;
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.beginPath(); ctx.ellipse(b.x + 2.5 + z * 0.25, b.y + 3.5 + z * 0.3, R * (1 + z * 0.006), R * 0.68, 0, 0, 7); ctx.fill();
  if (g.goldT > 0 || g.wizT > 0) { ctx.globalCompositeOperation = 'lighter'; put(glowSpr(g.goldT > 0 ? GOLD : HOT), x, y, 0.75 * sc); ctx.globalCompositeOperation = 'source-over'; }
  if (b.st === 'play' && b.tr.length >= 6 && spd(b) > 700) { ctx.lineCap = 'round'; for (let i = 2; i < b.tr.length; i += 2) { const u = i / b.tr.length; ctx.strokeStyle = `rgba(155,231,255,${0.3 * u})`; ctx.lineWidth = R * 1.2 * u; ctx.beginPath(); ctx.moveTo(b.tr[i - 2], b.tr[i - 1]); ctx.lineTo(b.tr[i], b.tr[i + 1]); ctx.stroke(); } }
  ctx.fillStyle = '#0B0918'; ctx.beginPath(); ctx.arc(x, y, R * sc, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(b.rot);
  drawPal(g.glitch ? g.glitchPal || 'fig' : S.curve.mood || 'calm', ctx, { x: 0, y: 0, s: R * 1.05 * sc, t: ts, r: S.curve.r, face: b.vx < 0 ? -1 : 1, hurt: g.hurtT > 0 || b.st === 'scoop' });
  ctx.restore();
}
function drawPlunger() {
  const pw = g.pull ? pullPower() : 0, y = 713 + pw * 14;
  ctx.strokeStyle = '#8F86B8'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(376 + (i % 2 ? 6 : -6), y + 2 + i * (18 - pw * 8) / 8); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.fillRect(366, y - 1, 20, 4); ctx.fillStyle = '#05040C'; ctx.fillRect(362, 721, 28, 10);
}
function drawCards(ts) {
  const w = g.war, fl = w.flip > 0 ? Math.abs(Math.cos((1 - w.flip / 0.35) * Math.PI)) : 1, s = g.flipS < 0 ? -1 : 1;
  [[w.l, w.sl, 100, 398, 0], [w.r, w.sr, 272, 398, 1]].forEach(([r, su, x, y, side]) => {
    const sp = cardSpr(r, su), hi = w.tie ? !w.tieHit[side] : side === (w.l > w.r ? 0 : 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(side ? 0.12 : -0.12); ctx.scale(s * Math.max(0.05, fl), 1);
    if (hi && w.flip <= 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 + 0.35 * Math.sin(ts * 6); put(glowSpr(HOT), 0, 0, 0.75); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    if (g.warFlash[side] > 0) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ts * 60); }
    put(sp, 0, 0); ctx.globalAlpha = 1; ctx.restore();
  });
  if (w.tie && w.flip <= 0) { ctx.save(); ctx.translate(CX, 402); if (s < 0) ctx.scale(-1, 1); ctx.font = '400 13px Bungee, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = HOT; ctx.strokeStyle = '#07050F'; ctx.lineWidth = 3; ctx.strokeText('WAR!', 0, 0); ctx.fillText('WAR!', 0, 0); ctx.restore(); }
}
function cardSpr(r, su) {
  return sprite(`card${r}${su}`, 24, 33, (x) => {
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.roundRect(-11, -14.5, 24, 32, 3); x.fill();
    x.fillStyle = '#FFFDF6'; x.beginPath(); x.roundRect(-12, -16.5, 24, 33, 3); x.fill(); x.strokeStyle = '#1B1530'; x.lineWidth = 0.8; x.stroke();
    const red = su === 1 || su === 2; x.fillStyle = red ? '#D7263D' : '#1B1530';
    const lab = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[r] || String(r);
    x.font = `800 ${lab.length > 1 ? 13 : 16}px Georgia, "Times New Roman", serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(lab, 0, -3);
    x.font = '10px serif'; x.fillText(['♠', '♥', '♦', '♣'][su], 0, 9);
  });
}
function drawCannon(ts) {
  // the hill line and the tank on it
  ctx.strokeStyle = 'rgba(255,176,122,0.25)'; ctx.setLineDash([3, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(84, HILL_Y + 8); ctx.lineTo(288, HILL_Y + 8); ctx.stroke(); ctx.setLineDash([]);
  { const tk = g.tank, x = tk.x, y = HILL_Y; ctx.save(); ctx.translate(x, y); if (tk.boom > 0) ctx.rotate(Math.sin(ts * 50) * 0.2 * tk.boom); put(tankSpr(), 0, 0); ctx.restore(); }
  const c = g.cannon, bAir = g.balls.find((b) => b.st === 'air');
  const ax = c ? aimX() : bAir ? bAir.air.x1 : CX, ang = Math.atan2(HILL_Y - SCOOP.y, ax - SCOOP.x);
  ctx.save(); ctx.translate(SCOOP.x, SCOOP.y); ctx.rotate(ang); ctx.fillStyle = '#05040C'; ctx.fillRect(0, -4.5, 24, 9); ctx.fillStyle = '#8F86B8'; ctx.fillRect(0, -3, 23, 6); ctx.fillStyle = HOT; ctx.fillRect(20, -3.5, 3, 7); ctx.restore();
  if (c) {
    ctx.strokeStyle = 'rgba(255,95,176,0.6)'; ctx.setLineDash([2, 5]); ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i <= 14; i++) { const u = i / 14, x = SCOOP.x + (ax - SCOOP.x) * u, y = SCOOP.y + (HILL_Y - SCOOP.y) * u - Math.sin(u * Math.PI) * 40; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); ctx.setLineDash([]);
    const pu = 1 + 0.15 * Math.sin(ts * 12); ctx.strokeStyle = HOT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, HILL_Y, 9 * pu, 0, 7); ctx.moveTo(ax - 13, HILL_Y); ctx.lineTo(ax + 13, HILL_Y); ctx.moveTo(ax, HILL_Y - 13); ctx.lineTo(ax, HILL_Y + 13); ctx.stroke();
  }
}
function tankSpr() {
  return sprite('tank', 30, 22, (x) => {
    x.fillStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.ellipse(1, 7, 13, 3.5, 0, 0, 7); x.fill();
    x.fillStyle = '#3E4A2E'; x.beginPath(); x.roundRect(-12, 1, 24, 6, 3); x.fill();
    x.fillStyle = '#7C8F4E'; x.beginPath(); x.roundRect(-10, -4, 20, 6, 2); x.fill(); x.beginPath(); x.arc(0, -4, 5, Math.PI, 0); x.fill();
    x.strokeStyle = '#7C8F4E'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(2, -6); x.lineTo(11, -10); x.stroke();
    x.fillStyle = '#1B1530'; for (let i = -9; i <= 9; i += 4.5) { x.beginPath(); x.arc(i, 4, 1.6, 0, 7); x.fill(); }
  });
}
function drawSquirrel(ts) {
  const sq = g.squirrel; if (sq.out > 0 && Math.sin(ts * 20) > 0) return;
  const p = rampAt(RAMPL[RAMP_SQ]), nx = -p.ty, ny = p.tx, x = p.x + nx * sq.off * 13, y = p.y + ny * sq.off * 13 - 3, dir = Math.cos(sq.t * (1.8 + 0.3 * ST())) > 0 ? 1 : -1;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); put(squirrelSpr(), 0, 0); ctx.restore();
}
function squirrelSpr() {
  return sprite('squirrel', 26, 24, (x) => {
    x.fillStyle = '#B5652A'; x.beginPath(); x.moveTo(-3, 2); x.bezierCurveTo(-14, 4, -14, -12, -6, -10); x.bezierCurveTo(-2, -9, -6, -4, -3, 2); x.fill();
    x.fillStyle = '#C98A4A'; x.beginPath(); x.ellipse(2, 2, 6, 4.5, 0, 0, 7); x.fill(); x.beginPath(); x.arc(7, -2, 3.6, 0, 7); x.fill();
    x.beginPath(); x.moveTo(6, -5); x.lineTo(7, -8); x.lineTo(8.5, -5); x.fill();
    x.fillStyle = '#1B1530'; x.beginPath(); x.arc(8.4, -2.6, 0.9, 0, 7); x.fill();
  });
}
function drawDMD(t) {
  const c = dmdContent(), key = c.join('|');
  if (key !== look.dmdKey && t - look.dmdAt > 50) { dmdRender(c); look.dmdKey = key; look.dmdAt = t; }
  const k = host.k, dx = (host.ox || 0) + (L.tx + 72 * L.ts) * k, dy = (host.oy || 0) + L.dy * k + g.sy * 0.3, dw = look.dmdMask.width, dh = look.dmdMask.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07050F'; ctx.beginPath(); ctx.roundRect(dx - 5 * L.a, dy - 4 * L.a, dw + 10 * L.a, dh + 8 * L.a, 6 * L.a); ctx.fill(); ctx.strokeStyle = 'rgba(245,197,66,0.45)'; ctx.lineWidth = Math.max(1, L.a); ctx.stroke();
  ctx.imageSmoothingEnabled = false; ctx.drawImage(look.dmdSmall, dx, dy, dw, dh); ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28; ctx.drawImage(look.dmdSmall, dx - 2 * L.a, dy - 2 * L.a, dw + 4 * L.a, dh + 4 * L.a); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(look.dmdMask, dx, dy);
}
// ---------------------------------------------------------------- the organ
const organ = {
  key: 'pinball', name: 'Chaos Pinball', icon: '🎰', verb: 'tap a side to flip · hold and let go to launch', beat: 0.8,
  theme: { bg: '#0B0918', gold: '#F5C542', bannerc: '#FFE08A' },
  glitch(on, pal) { if (g) { g.glitch = on; g.glitchPal = pal; } },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__pb = organ.debug; },
  start() { if (!S.time || !g) tot = { modes: 0, fleets: 0, laps: 0, ramps: 0 }; else { tot.modes += g.modesDone; tot.fleets += g.fleets; tot.laps += g.laps; tot.ramps += g.ramps; } newGame(); },   // the end card counts the whole run, across resets
  enter(from) { if (!g) newGame(); host.ui(''); g.ptr.clear(); g.pull = null; g.keys = { l: false, r: false }; holdSides(); if (from) { g.freeze = 0.7; if (playing()) g.saveT = Math.max(g.saveT, 3); } },
  leave() { if (g) { g.ptr.clear(); g.pull = null; g.keys = { l: false, r: false }; g.fl.forEach((f) => { f.on = false; }); } const b = g?.balls.find((q) => q.st === 'play') || g?.balls[0]; return b ? toWorld(b.x, b.y) : { x: W / 2, y: host.H / 2 }; },
  update, draw, onBeat, pointer, keydown, keyup,
  resize() { look.key = ''; },
  // 🕳️ the pocket: the cup is the way in (it glows when you're deep), and what comes up out of the billiard
  pocket: stadiumPocket,
  pocketSpot() { if (!g || g.tiltT > 0 || g.balls.some((b) => b.st === 'saucer')) return null; const w = toWorld(SAUCER.x, SAUCER.y); return { x: w.x, y: w.y, r: 14 * L.ts, icon: '🎱' }; },
  pocketSeed: () => ({ seed: Math.floor(Math.random() * 1e9), stage: ST() }),
  pocketReward(res) {
    if (!g) return; g.freeze = 0.8; g.ptr.clear(); g.pull = null; holdSides(); if (playing()) g.saveT = Math.max(g.saveT, 3);
    if (!res) return; const gf = res.gift || {};
    if (gf.save) g.saveBank += gf.save;
    if (gf.jackpot) g.jackpot = true;
    if (gf.heal) host.heal(gf.heal);
    dmd('BILLIARD WON', 'SAVE JACKPOT HEART', GOLD, 2.2); snd('chime', null, 0);
  },
  hudLine: () => (g ? `🎰 ${g.ring.filter(Boolean).length}/7${g.mult > 1 ? ` ×${g.mult}` : ''}${live().length > 1 ? ` · ${live().length} balls` : ''}` : ''),
  level: () => (g ? 1 + g.modesDone : 1),
  overText: (how) => (how === 'drained' ? ['🕳️ DRAINED', 'The last ball slipped between the flippers.'] : ['RUN OVER', '']),
  endStats: () => { if (!g) return ''; const m = tot.modes + g.modesDone, f = tot.fleets + g.fleets, l = tot.laps + g.laps, r = tot.ramps + g.ramps; return `🎰 ${m} game${m === 1 ? '' : 's'} lit · ${f} fleet${f === 1 ? '' : 's'} sunk · ${l} lap${l === 1 ? '' : 's'} · ${r} ramp${r === 1 ? '' : 's'}`; },
  debug: () => g && ({
    balls: g.balls.map((b) => ({ id: b.id, st: b.st, x: +b.x.toFixed(1), y: +b.y.toFixed(1), vx: Math.round(b.vx), vy: Math.round(b.vy), s: b.ramp ? Math.round(b.ramp.s) : null, still: +(b.still || 0).toFixed(2) })),
    n: live().length, waiting: !!waiting(), playing: playing(), feed: g.feed, multi: g.multi,
    flippers: g.fl.map((f) => ({ on: f.on, th: +f.th.toFixed(3), w: f.w })), flipLen: FLIPL(), stage: ST(),
    parts: { ...g.parts }, ring: [...g.ring], modesDone: g.modesDone, mult: g.mult, lanes: [...g.lanes], drop: [...g.drop], sunk: [...g.sunk], fleets: g.fleets,
    cups: g.cups, ramps: g.ramps, staples: g.staples, laps: g.laps, races: g.races, bulls: g.bulls, shots: g.shots, spins: g.spin.n, depth: g.spin.depth, war: { ...g.war, tieHit: [...g.war.tieHit] },
    saveT: g.saveT, saveBank: g.saveBank, kick: [...g.kick], jackpot: g.jackpot, goldT: g.goldT, fibT: g.fibT, surgeT: g.surgeT, wizT: g.wizT,
    twistNow: g.twist && { ...g.twist }, tris: g.tris.length, mirror: g.mirror, flipS: g.flipS, tilt: g.tilt, tiltT: g.tiltT, nudges: g.nudges, drains: g.drains, saved: g.saved,
    cannon: !!g.cannon, aimX: g.cannon ? aimX() : null, tankX: g.tank.x, tankDir: g.tank.dir, tankSpeed: 34 * (1 + 0.25 * (ST() - 1)), squirrelOff: g.squirrel.off, bumps: g.bumps.map((b) => ({ x: +b.x.toFixed(1), y: b.y })),
    lastLand: g.lastLand || null, escapes: g.escapes, bad: g.bad, badAt: g.badAt, maxV: Math.round(g.maxV), msg: g.msg?.title || null, dmd: dmdContent().slice(0, 2), auto: g.auto, freeze: g.freeze,
    table: { ts: L.ts, tx: L.tx, ty: L.ty, dy: L.dy }, lives: S.lives?.pinball ?? 3,
    launch: (power = 0.6) => launch(waiting(), power),
    flip: (side, on = true) => { g.keys[side ? 'r' : 'l'] = on; holdSides(); return g.fl[side].on; },
    place: (x, y, vx = 0, vy = 0) => { let b = g.balls.find((q) => q.st === 'play') || waiting() || newBall('play'); b.st = 'play'; b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.first = false; b.autoT = null; return b.id; },
    drain: () => { const b = g.balls.find((q) => q.st === 'play'); if (!b) return false; b.x = CX; b.y = 700; b.vx = 0; b.vy = 900; return true; },
    nudge: () => nudge(), quiet: (on = true) => { g.quiet = on; }, force: (ev) => beatNow({ x: 0.5, crossed: [], ...(typeof ev === 'string' ? { [ev]: true } : ev) }), twist: (k) => twist(k), endTwist: () => endTwist(),
    sink: (ship) => { SHIPS[ship][1].forEach((i) => dropHit(i)); return [...g.sunk]; },
    light: (i) => lightMode(i), holdSquirrel: (on = true) => { g.squirrel.hold = on; }, tank: (x) => { g.tank.x = x; }, fire: () => fireCannon(), addBalls: (n) => multiball(live().length + n), auto: (on = true) => { g.auto = on; if (!on) { g.autoT = [0, 0]; holdSides(); } return on; },
    save: (sec = 0) => { g.saveT = sec; g.saveBank = 0; }, tri: () => g.tris.map((q) => ({ x: q.x, y: q.y, s: q.s, d: q.d })),
    deal: (l, r) => { g.war.l = l; g.war.r = r; g.war.tie = l === r; g.war.tieHit = [false, false]; g.war.flip = 0; },
    screen: (x, y) => { const w = toWorld(x, y), cv = host.cv, r = cv.getBoundingClientRect(), s = r.width / cv.width; return { x: r.left + (w.x * host.k + (host.ox || 0)) * s, y: r.top + (w.y * host.k + (host.oy || 0)) * s }; },
    cupSpot: () => organ.pocketSpot(),
    // a fast fuzz: `sec` seconds of play stepped at once (no drawing), random flips and the odd nudge, every drain saved
    sim: (sec = 60, fuzz = true) => {
      const bank = g.saveBank; g.saveBank = 1e6; let flips = 0, nudges = 0, launches = 0, maxV = 0, out = 0;
      for (let i = 0; i < sec * 60; i++) {
        if (fuzz) { for (let k = 0; k < 2; k++) if (Math.random() < 0.06) { g.keys[k ? 'r' : 'l'] = !g.keys[k ? 'r' : 'l']; flips += 1; } if (Math.random() < 0.004) { g.tiltT = 0; g.tilt = 0; nudge(); nudges += 1; } holdSides(); }
        const w = waiting(); if (w && !playing() && Math.random() < 0.05) { launch(w, Math.random()); launches += 1; }
        update(1 / 60); if (S.comboT > 0) { S.comboT -= 1 / 60; if (S.comboT <= 0) S.combo = 0; }   // (the shell's own combo clock, which a sim skips)
        if (fuzz && i % 1200 === 600) multiball(3, true);
        for (const b of g.balls) { if (b.st !== 'play') continue; maxV = Math.max(maxV, spd(b)); if (b.x < 10 || b.x > 390 || b.y < 0 || b.y > 740 || (b.y < ARC.cy && Math.hypot(b.x - ARC.cx, b.y - ARC.cy) > ARC.r)) out += 1; }
      }
      g.saveBank = bank; g.keys = { l: false, r: false }; holdSides();
      return { flips, nudges, launches, out, bad: g.bad, badAt: g.badAt, escapes: g.escapes, maxV: Math.round(maxV), saved: g.saved, parts: { ...g.parts } };
    },
  }),
};
export default organ;
