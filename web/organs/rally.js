// 🏎️ Rally, an organ of the shell: Micro Machines' DNA on a kitchen table. Fig drives a toy car along a winding
// road of masking tape from the start grid to the finish line; hold the left or right half of the screen to steer
// (the car always goes), hold both to brake. Rivals race the same road, and like the old game, a rival pushed far
// enough behind the camera is out of the race and pays. The road is a fractal: its heading wanders by a sum of
// Fibonacci harmonics (3, 5, 8, 13, 21 waves along it), longer, rougher and narrower course by course. Both sides
// end at the table's edge: guarded (railings, books, toy bricks, crayons) or open, where you fall. Hazards: 🥛 spilled
// milk (ice), 🍞 a toaster (a ramp), 🕳️ the pocket (fall in: a life), 📦 cereal boxes (walls). The box's beats: a
// peak stands a toy soldier on the road, the window spins the table, the mirror swaps you with the rival ahead, the
// balance drains the milk, the golden cut lays pennies (161), a big hop drops a cereal box, gift is a bubble shield, fib a
// nitro, gold a golden crate. Twists: 🧲 fridge magnet, 🌀 ceiling fan, 🔦 lights out, 🐈 the cat's paw, 🎯 missile rain,
// 🍌 a slippery table. Kart racing on top: ❓ crates of weapons, ⏩ boost pads, 🐢 slow patches, a slipstream and each
// place's traps (see "weapons, speed zones and traps"); none of it costs a life.
// 🕳️ Its pocket (deep enough, the thing coming up the road glows while it's still well ahead: the toaster or the ramp, a
// fork's centrepiece; tap it): THROUGH THE TOASTER (pockets/slotcar.js), a slot-car loop traced by a double pendulum;
// three laps bring up a burst of nitro and a life, and either way you come out the far side of the thing.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';
import slotcarPocket from './pockets/slotcar.js';

let W = 400, R = 13, VMAX = 150, TURN = 3.1, CAR = 1.5, ACCEL = 1.5;   // R: a car's radius; CAR: how big the cars are drawn
const TWISTS = [
  ['🧲 FRIDGE MAGNET', 'the cars are pulled sideways', 'magnet'],
  ['🌀 CEILING FAN', 'a wind across the table', 'fan'],
  ['🔦 LIGHTS OUT', 'headlights only', 'dark'],
  ['🐈 THE CAT', 'a paw sweeps the road', 'paw'],
  ['🎯 MISSILE RAIN', 'crates all over the road: grab one', 'rain'],
  ['🍌 SLIPPERY TABLE', 'slicks all over the road', 'slip'],
];
const FIB = [3, 5, 8, 13, 21];
const START = 0, GRID = 70, FINISH = 0.975, COUNT = 2.4;   // the grid stands GRID table units up the road; the finish line at FINISH; COUNT s of 3-2-1-GO
let host, ctx, S, sfx, g = null, finishN = 0, outsN = 0, held = {};
const H = () => host.H;
const stage = () => host.stage?.() || 1;
// 🏎️ a gentle start: 150 on course 1, faster by course and by stage (about 1.8× by course 5 at Stage 4)
const topSpeed = () => VMAX * (1 + 0.15 * Math.min(6, (g?.course || 1) - 1) + 0.1 * (stage() - 1));
// 🔍 the camera starts close in and pulls back as the stages come (on top of the shell's own zoom-out)
// …but never so far out that the road shrinks to a ribbon: the tape always spans at least ROAD_MIN of the field's width
const ROAD_MIN = 0.46;
const camZoom = () => Math.max(2.0 / (1 + 0.25 * (stage() - 1)), ROAD_MIN * W / (g?.track?.w || 180));
const GUIDE = { near: 130, far: 340, heading: 0.2 };   // the camera's look-ahead (table units up the tape) and how much it still follows the car's nose
const CAR_Y = 0.8;   // the car sits low on the screen: the road ahead is what you see
const hash = (i) => { let x = (Math.imul(i | 0, 374761393) + 668265263) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const wrapA = (a) => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

// ---------------------------------------------------------------- the road
// An open road, start to finish, in 20-unit steps. Its heading θ(u) = up + Σ a_k sin(2π c_k u + φ_k) over the Fibonacci
// waves: the amplitudes fall off like k^−0.8, so big bends carry smaller wiggles (self-similar), and the swing is
// capped at ±1.3 rad from "up", so the road always makes headway and never crosses itself. Course 1 is long gentle
// sweeps; the road grows longer and rougher course by course.
// 🗺️ The race is a journey: four sections (secs), each with its own road shape (KINDS: a share of the fractal wander plus
// its own wave), blended over BLEND at the joins. The heading stays within ±1.3 rad of up whatever the mix.
const KINDS = {
  sprint: { base: 0.15, say: 'a straight sprint' },
  weave: { base: 0.3, P: 620, say: 'a slalom' },
  sweep: { base: 0.25, P: 1700, say: 'long sweeping bends' },
  bridge: { base: 0.05, say: 'a narrow bridge' },
  tunnel: { base: 0.55, say: 'into the dark: lights on' },
  fork: { base: 0.08, say: 'the road splits: pick a side' },
};
const BLEND = 0.02;
const smooth01 = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function cutSecs(seed) { const b = [0, 0.25, 0.5, 0.75].map((v, i) => (i ? v + (hash(seed + 60 + i) - 0.5) * 0.06 : 0)); return b.map((s0, i) => ({ s0, s1: b[i + 1] ?? 1, i })); }
function makeTrack(course, seed, secs) {
  const c = Math.min(7, course), len = 3200 + 500 * (c - 1), n = Math.round(len / 20), rough = Math.min(1, 0.35 + 0.12 * (c - 1)), pts = [];
  let x = 0, y = 0;
  for (let i = 0; i <= n; i++) {
    const u = i / n; let base = 0, dev = 0;
    FIB.forEach((k, j) => { base += rough * 1.1 * Math.pow(k, -0.8) * Math.sin(2 * Math.PI * k * 0.6 * (len / 3200) * u + hash(seed + j) * 6.28); });
    secs.forEach((sc, j) => { const wk = (j ? smooth01((u - sc.s0 + BLEND) / (2 * BLEND)) : 1) * (j < secs.length - 1 ? smooth01((sc.s1 + BLEND - u) / (2 * BLEND)) : 1); if (wk <= 0) return;
      const K = KINDS[sc.kind] || KINDS.sprint, ph = (u - sc.s0) * len; let d = base * K.base;
      if (sc.kind === 'weave') d += Math.min(0.62, 0.5 + 0.03 * (c - 1)) * Math.sin(2 * Math.PI * ph / K.P);
      if (sc.kind === 'sweep') d += 0.9 * Math.sin(2 * Math.PI * ph / K.P + hash(seed + 80 + j) * 6.28);
      dev += wk * d; });
    dev *= Math.min(1, u * 8);   // a straight run off the grid
    const th = -Math.PI / 2 + Math.max(-1.3, Math.min(1.3, dev));
    pts.push({ x, y }); x += Math.cos(th) * 20; y += Math.sin(th) * 20;
  }
  let L = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); cum.push(L); }
  const w = Math.max(150, 190 - 6 * course);   // wide tape: 184 on course 1, down to 150
  // offset lines, built once: the worn racing lines and the painted edge lines (normals from the neighbours)
  const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return [-(b.y - a.y) / l, (b.x - a.x) / l]; });
  // (the kerbs and the tape's rims are drawn as narrow lines along these, not as full-width strokes: far less to paint)
  const offAt = (o) => { const a = pts.map((p, i) => ({ x: p.x + nrm[i][0] * o, y: p.y + nrm[i][1] * o })); let l = 0; a.c = a.map((q, i) => (i ? (l += Math.hypot(q.x - a[i - 1].x, q.y - a[i - 1].y)) : 0)); return a; };
  const pair = (o) => [offAt(-o), offAt(o)];
  // kerb: w/2 .. +8.5 (two colours in dashes), light: its lit top (+1.5 .. +6.5), dark: the seam (0 .. +1.5), kerbEdge: its
  // outline (+8.5 .. +10.5), tedge: the tape's own rim (−2.5 .. 0): the same rings the old full-width strokes left showing
  const off = { wear: pair(w * 0.24), paint: pair(w / 2 - 9), kerbEdge: pair(w / 2 + 9.5), shoulder: pair(w / 2 + 8), kerb: pair(w / 2 + 4.25), light: pair(w / 2 + 4), dark: pair(w / 2 + 0.75), tedge: pair(w / 2 - 1.25) };
  return { pts, cum, len: L, w, n: pts.length, off };
}
const secAt = (s) => { const ss = g.secs || []; for (let i = ss.length - 1; i >= 0; i--) if (s >= ss[i].s0) return ss[i]; return ss[0]; };
const islandNear = (s, pad = 0) => (g.islands || []).find((i) => Math.abs(s - i.s) * g.track.len < i.lh + pad) || null;
const clamp01 = (s) => Math.max(0, Math.min(1, s));
const at = (s) => { const t = g.track; s = clamp01(s); const Lr = s * t.len; let i = 0; while (i < t.n - 2 && t.cum[i + 1] < Lr) i++; const a = t.pts[i], b = t.pts[i + 1], u = (Lr - t.cum[i]) / (t.cum[i + 1] - t.cum[i] || 1); return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, a: Math.atan2(b.y - a.y, b.x - a.x) }; };
function nearest(x, y) {   // the nearest point of the centreline: its progress s (0..1) and the distance d
  const t = g.track; let best = { d: 1e9, s: 0 };
  for (let i = 0; i < t.n - 1; i++) { const a = t.pts[i], b = t.pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1; let u = ((x - a.x) * dx + (y - a.y) * dy) / L2; u = Math.max(0, Math.min(1, u)); const px = a.x + dx * u, py = a.y + dy * u, d = Math.hypot(x - px, y - py); if (d < best.d) best = { d, s: (t.cum[i] + u * (t.cum[i + 1] - t.cum[i])) / t.len, px, py }; }
  return best;
}
const spotOn = (s, off = 0) => { const p = at(s); return { x: p.x + Math.cos(p.a + Math.PI / 2) * off, y: p.y + Math.sin(p.a + Math.PI / 2) * off }; };
const sOf = (units) => units / g.track.len;   // table units along the road → progress

// ---------------------------------------------------------------- a race
function newGame() { g = { course: 1, seed: Math.floor(Math.random() * 1e6), track: null, me: null, rivals: [], items: [], obs: [], fx: [], pennies: [], twist: null, time: 0, dir: 1, dark: 0, spin: 0, nitro: 0, air: 0, paw: null, glitch: false, glitchPal: null, dust: [], decor: [], skids: [], fin: null, solids: [], shake: 0, weapon: null }; finishN = 0; outsN = 0; obsHitsN = 0; rivalHitsN = 0; hitsTakenN = 0; hitsGivenN = 0; shotsN = 0; newCourse(); renderBar(); }
function newCourse() {
  { const th = TH(); g.secs = cutSecs(g.seed + g.course * 13).map((c, i) => ({ ...th.secs[i], ...c })); }
  g.track = makeTrack(g.course, g.seed + g.course * 97, g.secs); g.obs = []; g.pennies = []; g.items = []; g.done = false; g.go = COUNT; g.goShown = 4; g.camA = null;
  g.secShown = 0; g.dimNow = 0; g.inRoof = 0; g.skids = []; g.map = null;
  // 🍎 a fork section's island: the road splits round it and joins again
  g.islands = g.secs.filter((sc) => sc.kind === 'fork').map((sc) => { const lh = 140, s = Math.min((sc.s0 + sc.s1) / 2, FINISH - (lh + 140) / g.track.len); return { s, lh, wi: g.track.w * 0.22, kind: sc.island, sec: sc.i }; });
  const s0 = sOf(GRID), p0 = at(s0); g.me = { x: p0.x, y: p0.y, a: p0.a, v: 0, s: s0, prevS: s0 };
  // the grid: rivals in pairs just ahead of you (you start at the back, with the road open behind you)
  g.rivals = []; const n = 1 + Math.min(4, stage());
  for (let i = 0; i < n; i++) { const s = sOf(GRID + 44 * (1 + (i >> 1))), side = i % 2 ? 1 : -1, p = spotOn(s, side * g.track.w * 0.22); g.rivals.push({ x: p.x, y: p.y, a: at(s).a, v: 0, s, skill: 0.8 + Math.random() * 0.2 + 0.03 * stage(), hue: [0, 40, 200, 280, 120][i % 5], n: i + 2, out: 0, done: false, clip: (Math.random() - 0.5) * 14 }); }   // clip: how tight it shaves an obstacle (now and then too tight)
  // the hazards, placed on the tape: milk (ice), a toaster (ramp), the pocket (from course 2), boxes (walls) along the edges
  const put = (kind, s, off, extra) => g.items.push({ kind, ...spotOn(s, off), s, ...extra });
  // hazards keep off the bridges and clear of the islands: a spot that lands there slides along the road to a clear one
  const clear = (s, pad = 80) => secAt(s).kind !== 'bridge' && !islandNear(s, pad), fix = (s) => { for (let k = 0; k < 14; k++) for (const d of [k * 0.03, -k * 0.03]) { const q = s + d; if (q > 0.06 && q < 0.93 && clear(q)) return q; } return s; };
  put('milk', fix(0.3 + hash(g.seed + 1) * 0.1), 0, { r: 26 }); if (g.course >= 2) put('milk', fix(0.7 + hash(g.seed + 2) * 0.1), 8, { r: 22 });
  { const ts = fix(0.5 + hash(g.seed + 3) * 0.05); put('toaster', ts, 0, { a: at(ts).a }); }
  if (g.course >= 2) put('hole', fix(0.15 + hash(g.seed + 4) * 0.1), (hash(g.seed + 5) - 0.5) * g.track.w * 0.6, { r: 14 });
  if (g.course >= 3) put('hole', fix(0.85 + hash(g.seed + 6) * 0.08), (hash(g.seed + 7) - 0.5) * g.track.w * 0.6, { r: 14 });
  // 🪂 the table's edge: stretches where it comes right to the tape, no kerb, a drop to the floor (either side); never on a
  // bridge or in a tunnel, and clear of an island
  g.edges = []; [0.25, 0.55, 0.8].slice(0, Math.min(3, g.course)).forEach((c0, i) => { const half = (0.05 + 0.012 * Math.min(3, g.course - 1)) / 2, side = hash(g.seed + 30 + i) < 0.5 ? 1 : -1, okE = (c) => [c - half - 0.02, c, c + half + 0.02].every((q) => { const k = secAt(q).kind; return k !== 'bridge' && k !== 'tunnel' && !islandNear(q, 60); });
    let c = c0 + hash(g.seed + 20 + i) * 0.05; for (let k = 1; k < 14 && !okE(c); k++) { const d = Math.ceil(k / 2) * 0.03 * (k % 2 ? 1 : -1); if (okE(c + d) && c + d > 0.1 && c + d < 0.9) { c += d; break; } }
    if (okE(c) && !g.edges.some((e) => Math.abs(e.c - c) < 0.1)) g.edges.push({ s0: c - half, s1: c + half, c, side }); });
  for (let i = 0; i < 3 + g.course; i++) { const s = 0.08 + hash(g.seed + 10 + i) * 0.84, side = hash(g.seed + 40 + i) < 0.5 ? 1 : -1; if (edgeAt(s, side) || !clear(s, 40)) continue; put('box', s, side * (g.track.w / 2 + 16), { w: 26, h: 18 }); }
  // 🥤 the solid things: each fork's centrepiece (the fruit bowl, the toy box, the mug…), then the obstacles on the road
  g.solids = g.islands.map((isl) => (isl.solid = makeSolid(isl.kind, isl.s, 0, isl.wi * 0.95, at(isl.s).a + Math.PI / 2, { island: true, sec: isl.sec })));
  placeObstacles(); placeArms(); renderBar();   // (the slot's name follows the place: a peel in the kitchen is a juice spill in the bedroom)
  g.rims = { 1: buildRim(1), '-1': buildRim(-1) }; g.drims = { 1: buildRim(1, true), '-1': buildRim(-1, true) }; g.decor = makeDecor(); g.dust = [];
  g.pieces = makePieces(); buildSecPaths();
  { const a = (TH().sun || 45) * Math.PI / 180; g.sun = { x: Math.cos(a), y: Math.sin(a) }; }
  // 🎨 a new place and a new ride every course (cycling): the title says where, the subtitle what you drive
  { const th = TH(), vh = VH(), again = g.course > THEMES.length ? 'back again: ' : ''; host.banner(`${th.icon} COURSE ${g.course} · ${th.name}`, `${again}${th.say} · your ${vh.name} ${vh.icon} · ${g.rivals.length} rivals · hold a side to steer`); }
}
// an open edge at progress s on that side of the tape (side: +1 / -1, the same sense as spotOn's offset), or null
function edgeAt(s, side) { return (g.edges || []).find((e) => e.side === Math.sign(side) && s >= e.s0 && s <= e.s1) || null; }
// 🪂 Fig to the rescue: Fig hops out of the tumbling car, flies down to it on the floor, hauls it back up and sets it
// on the tape. The car is Fig's to carry for RESCUE seconds; the life is taken when it lands.
const RESCUE = 1.3;
function startRescue(c) {
  const p = at(c.s - 0.02);
  c.rescue = { t: 0, x0: c.x, y0: c.y, a0: c.a, x1: p.x, y1: p.y, a1: p.a }; c.v = 0; c.spin = 0;
  host.banner('🪂 FIG TO THE RESCUE', 'over the edge: Fig hauls the car back up'); sfx('whistle', { dur: 0.4 });
}
function stepRescue(c, dt) {
  const r = c.rescue; r.t += dt; const e = Math.min(1, r.t / RESCUE), k = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
  c.x = r.x0 + (r.x1 - r.x0) * k; c.y = r.y0 + (r.y1 - r.y0) * k; c.a = r.a0 + wrapA(r.a1 - r.a0) * k;
  if (e >= 1) { c.rescue = null; respawn(c, true); sfx('clack'); }
}
// ---------------------------------------------------------------- the table's edge, both sides
// The table follows the road: on each side it ends MARGIN beyond the tape, guarded (a railing, a row of books, toy
// bricks or a wall of crayons) so a car bounces off, or right at the tape on an open stretch, where you fall. The
// margin eases in and out by RAMP round each open stretch.
const CRAYONS = ['#EE2B3B', '#FF8A3D', '#FFD23F', '#22C55E', '#2D7FF9', '#A855F7', '#FF5DA2'];
const MARGIN = 46, RAMP = 0.02, GUARDS = ['rail', 'books', 'bricks', 'crayons'];
// 🌉 on a bridge the table narrows to a plank: BRIDGE_M each side of the tape, railed. EXTRA: beyond the guards the table
// carries on (drawn only: the scenery stands there), except where it ends at an open stretch or a bridge.
const BRIDGE_M = 12, EXTRA = 130;
function marginAt(s, side) {
  let d = 1; (g.edges || []).forEach((e) => { if (e.side !== side) return; if (s >= e.s0 && s <= e.s1) d = 0; else d = Math.min(d, Math.abs(s - e.s0), Math.abs(s - e.s1)); });
  const u = Math.min(1, d / RAMP); let m = MARGIN * u * u * (3 - 2 * u);
  (g.secs || []).forEach((sc) => { if (sc.kind !== 'bridge') return; const db = s >= sc.s0 && s <= sc.s1 ? 0 : Math.min(Math.abs(s - sc.s0), Math.abs(s - sc.s1)); m = Math.min(m, BRIDGE_M + (MARGIN - BRIDGE_M) * smooth01(db / RAMP)); });
  return m;
}
function buildRim(side, drawn) {   // the table's edge on one side: a point per road point, its outward normal and its guard ('open' on an open stretch); drawn: the table's outline beyond the guards
  const t = g.track, out = [];
  for (let i = 0; i < t.n; i++) { const sk = t.cum[i] / t.len, a = at(sk).a, nx = -Math.sin(a) * side, ny = Math.cos(a) * side, m = marginAt(sk, side), off = t.w / 2 + m + (drawn ? EXTRA * smooth01((m - BRIDGE_M) / (MARGIN - BRIDGE_M)) : 0);
    out.push({ s: sk, x: t.pts[i].x + nx * off, y: t.pts[i].y + ny * off, nx, ny, tx: Math.cos(a), ty: Math.sin(a), m, guard: edgeAt(sk, side) ? 'open' : secAt(sk).kind === 'bridge' ? 'rail' : GUARDS[Math.floor(hash(g.seed + 50 + Math.floor(sk * 10) + (side > 0 ? 0 : 99)) * 4)] }); }
  // on a tight bend the offset line loops back on itself: keep only points that move on along the road
  const clean = []; out.forEach((p) => { const l = clean[clean.length - 1]; if (!l || (p.x - l.x) * l.tx + (p.y - l.y) * l.ty > 3) clean.push(p); });
  return clean.length > 8 ? clean : out;
}
function respawn(c, isMe) {   // back on the tape a little behind where it went over
  const p = at(c.s - 0.02); c.x = p.x; c.y = p.y; c.a = p.a; c.v = 0; c.fall = 0; c.spin = 0; c.s = c.prevS = nearest(c.x, c.y).s;
  if (isMe) { S.combo = 0; host.cue?.('pickup', c.x, c.y); host.hurt('fell off the edge'); }
}
function onBeat(ev) {
  if (!g || g.go > 0) return;
  const ahead = (d) => Math.min(FINISH - 0.01, g.me.s + d);
  const room = (d) => g.me.s + d < FINISH - 0.01;   // nothing drops past the finish (they used to pile up just before the line)
  if (ev.peak && !ev.window && room(sOf(240))) { const p = spotOn(ahead(sOf(240)), (Math.random() - 0.5) * g.track.w * 0.5); g.obs.push({ kind: 'soldier', ...p, life: 14 }); }   // 🪖 a toy soldier stands on the road
  if (ev.peak && !ev.window) { const r = g.rivals.find((x) => x.weapon && alive(x)); if (r) r.holdT = 0; else { const tr = g.traps.filter((q) => q.s > g.me.s && q.k !== 'mousetrap').sort((a, b) => a.s - b.s)[0]; if (tr) tr.t0 = g.time; } }   // 🎯 a rival lets fly, or the next trap goes off
  if (ev.gold && goldenCrate()) { host.banner('🌟 GOLDEN CRATE', 'three golden rockets up the road'); sfx('chime', { hi: true }); }
  if (ev.enteredWindow) { g.spinTable = 1; sfx('twist'); }   // 🔁 the window spins the table (the view turns a quarter each beat)
  if (ev.window) g.tableTurn = (g.tableTurn || 0) + Math.PI / 2;
  if (ev.mirror) mirrorSwap();
  if (ev.balance) { g.items = g.items.filter((i) => i.kind !== 'milk'); sfx('chime'); }
  if (ev.golden) { host.add(161); if (g.pennies.length < 8) for (let i = 0; i < 8; i++) g.pennies.push({ ...spotOn(ahead(sOf(90 + i * 36)), Math.sin(i * 0.9) * g.track.w * 0.3), t: i }); sfx('chime', { hi: true }); }
  if (ev.hop > 0.3 && !ev.window && room(sOf(300))) { const p = spotOn(ahead(sOf(300)), (Math.random() - 0.5) * g.track.w * 0.6); g.obs.push({ kind: 'box', ...p, w: 26, h: 18, life: 12 }); }   // 📦 a cereal box drops on the road
  if (ev.gift && g.me) { g.me.shield = SHIELD_T; host.banner('🛡️ BUBBLE SHIELD', 'a free one: the next knock pops it'); sfx('ping'); }
  if (ev.fib) { g.nitro = 2; sfx('cannon', { size: 0.4 }); }
  if (ev.big && !g.twist) twist();
}
// ✨ the mirror: you and the rival just ahead trade places (and speeds); with nobody close, it pays instead
function mirrorSwap() {
  const me = g.me, r = g.rivals.filter((x) => !x.out && !x.done && !x.fall && !x.rescue && x.s > me.s && (x.s - me.s) * g.track.len < 400).sort((a, b) => a.s - b.s)[0];
  if (!r || me.fall || me.rescue) { host.add(250); g.fx.push({ kind: 'text', x: me.x, y: me.y - 30, text: '✨ MIRROR +250', life: 1 }); sfx('chime'); return; }
  for (const k of ['x', 'y', 'a', 'v', 'vx', 'vy', 'vs', 'w', 's', 'prevS']) { const t = me[k]; me[k] = r[k]; r[k] = t; }
  { const mine = g.weapon; g.weapon = r.weapon ? { kind: r.weapon, n: 1 } : null; r.weapon = mine ? mine.kind : null; r.holdT = rivalHold(); renderBar(); }   // and your weapons trade hands too
  g.fx.push({ kind: 'text', x: me.x, y: me.y - 30, text: '✨ SWAPPED', life: 1.1, big: true }); host.cue?.('score', me.x, me.y); sfx('chime', { hi: true });
}
function twist() {
  const [title, sub, kind] = TWISTS[Math.floor(Math.random() * TWISTS.length)];
  g.twist = { kind, until: g.time + 6, dir: Math.random() < 0.5 ? -1 : 1 }; host.banner(kind === 'slip' ? title.replace('🍌', wpn('slick').icon) : title, sub); sfx('twist');
  if (kind === 'paw') g.paw = { s: Math.min(0.95, g.me.s + sOf(700)), t: 0 };
  if (kind === 'rain') missileRain();
  if (kind === 'slip') slipperyTable();
}

// ---------------------------------------------------------------- the race
// 🛞 Handling: a car has momentum. Its velocity (vx, vy) is its own, apart from where the nose points (a): the tyres pull
// the sideways part of it back toward the nose, fast (GRIP_RATE) but only so hard (GRIP_ACC × the surface's grip), so a
// fast corner lets the tail step out (slip, skid marks) and milk barely bites. The throttle eases off toward top speed;
// the steering loses a little bite flat out (UNDER, understeer). A knock spins the car through its yaw rate (w).
// Everything else still reads and sets c.v (the speed): syncVel brings the velocity along when something sets it.
const GRIP_ACC = 540, GRIP_RATE = 14, UNDER = 0.16, YAW_DAMP = 0.02, REST = 0.35;
function syncVel(c) {
  if (c.vx != null && c.vs === c.v) return;
  const m = Math.hypot(c.vx || 0, c.vy || 0);
  if (!(c.v > 0)) { c.vx = 0; c.vy = 0; } else if (c.vx == null || m < 1) { c.vx = Math.cos(c.a) * c.v; c.vy = Math.sin(c.a) * c.v; } else { c.vx *= c.v / m; c.vy *= c.v / m; }
  c.vs = c.v;
}
const setSpeed = (c) => { c.v = c.vs = Math.hypot(c.vx, c.vy); };
function bounceAlong(c, ta, isMe, nx = 0, ny = 0) {   // a guard or the wall behind the grid: the car glances off and is turned back along the road, so it never sits stalled against a wall
  syncVel(c);
  if (nx || ny) {   // n points out, into the guard: the part of the velocity going that way comes back, a little softer
    sparks(c.x + nx * R, c.y + ny * R, nx, ny, c.v, isMe ? 9 : 4);
    const vn = c.vx * nx + c.vy * ny; if (vn > 0) { c.vx -= (1 + 0.3) * vn * nx; c.vy -= (1 + 0.3) * vn * ny; } c.vx *= 0.9; c.vy *= 0.9;
  } else { const sp = Math.max(c.v * 0.7, 40); c.vx = Math.cos(ta) * sp; c.vy = Math.sin(ta) * sp; }
  c.a = ta + wrapA(c.a - ta) * 0.4; c.w = 0;
  const fw = c.vx * Math.cos(ta) + c.vy * Math.sin(ta); if (fw < 40) { c.vx += Math.cos(ta) * (40 - fw); c.vy += Math.sin(ta) * (40 - fw); }
  setSpeed(c); c.bob = 1;
  if (isMe && !c.bumpT) { c.bumpT = 0.4; sfx('clack'); }
}
// ✴️ sparks off a guard or a wall: short bright streaks thrown back off it (in the dust pool, drawn as lines)
function sparks(x, y, nx, ny, v, n, cols) {
  if (v < 50) return;
  for (let i = 0; i < n; i++) { const a = Math.atan2(-ny, -nx) + (Math.random() - 0.5) * 2.2, sp = 80 + Math.random() * 160 * Math.min(1.5, v / 150); g.dust.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.2, max: 0.45, r: 1, grow: 0, col: cols ? cols[i % cols.length] : Math.random() < 0.5 ? '#FFE36B' : '#FFFFFF', a: 1, spark: true }); }
  while (g.dust.length > 150) g.dust.shift();
}
// 🛞 skid marks: two rear-wheel lines while a car slides, kept for the whole course (the oldest go past SKIDS)
const SKIDS = 700;
function skidMark(c, on) {
  if (!on || c.fall > 0 || c.rescue || c.air > 0 || VH().beam || VH().spray) { c.skP = null; return; }
  const ca = Math.cos(c.a), sa = Math.sin(c.a), rb = (VH().rear + 4) * CAR, o = 7 * CAR, rx = c.x + ca * rb, ry = c.y + sa * rb;
  const l = [rx + sa * o, ry - ca * o], r = [rx - sa * o, ry + ca * o];
  if (c.skP) { if (Math.hypot(l[0] - c.skP[0][0], l[1] - c.skP[0][1]) < 3) return; g.skids.push([c.skP[0][0], c.skP[0][1], l[0], l[1]], [c.skP[1][0], c.skP[1][1], r[0], r[1]]); if (g.skids.length > SKIDS) g.skids.splice(0, g.skids.length - SKIDS); }
  c.skP = [l, r];
}

// ---------------------------------------------------------------- 🥤 solid things: the islands' centrepieces and the obstacles on the road
// SOLID: each kind's footprint, as a share of its sprite radius r: c = a circle, b = a rounded box [half width, half depth,
// corner] in the sprite's own frame; side = the colour of its sides (drawn as height); fx = what flies off it when hit.
// The kinds with an r stand on the road (ROADOBS per place), the rest are the forks' centrepieces.
const SOLID = {
  fruitbowl: { c: 0.98, side: '#163F8A', fx: 'fruit' },
  toybox: { b: [0.95, 0.62, 0.1], side: '#7A4A20', fx: 'wood' },
  mug: { c: 0.76, side: '#1A55B8', fx: 'splash', drink: '#7A4524' },
  snowglobe: { c: 0.98, side: '#4A2C14', fx: 'glitter' },
  fountain: { c: 0.98, side: '#1A1430', fx: 'splash', drink: '#3DE0FF' },
  cup: { r: 26, c: 0.76, side: '#C3CAD4', fx: 'splash', drink: '#7A4524', snd: 'cup' },
  jar: { r: 22, c: 0.9, side: '#B8DDF0', fx: 'shards', snd: 'cup' },
  spoon: { r: 38, b: [0.92, 0.22, 0.18], lay: 0.7, side: '#8A93A3', fx: 'spark', snd: 'clack' },
  block: { r: 24, b: [0.75, 0.75, 0.1], side: '#B8935A', fx: 'wood' },
  books: { r: 30, b: [0.84, 0.62, 0.06], side: '#F2EAD4', fx: 'paper' },
  lego: { r: 28, b: [0.92, 0.48, 0.06], side: null, fx: 'plastic', snd: 'clack' },
  pot: { r: 24, c: 0.82, side: '#9A4824', fx: 'soil' },
  mushroom: { r: 26, c: 0.88, side: '#EFE4CC', fx: 'soil' },
  gnome: { r: 22, c: 0.9, side: '#2F6B9A', fx: 'shards', snd: 'cup' },
  pencilcup: { r: 24, c: 0.8, side: '#2A2E38', fx: 'spark', snd: 'clack' },
  stapler: { r: 34, b: [0.92, 0.27, 0.2], lay: 0.9, side: '#1A1D25', fx: 'spark', snd: 'clack' },
  snowman: { r: 26, c: 0.66, side: '#D6E7F5', fx: 'snow' },
  pine: { r: 24, c: 0.8, side: '#164C2C', fx: 'snow' },
  cone: { r: 20, c: 0.86, side: '#C2410C', fx: 'neon', snd: 'clack' },
  barrel: { r: 22, c: 0.88, side: '#2A1250', fx: 'neon', snd: 'clack' },
};
const ROADOBS = { kitchen: ['cup', 'jar', 'spoon'], bedroom: ['block', 'books', 'lego'], garden: ['pot', 'mushroom', 'gnome'], desk: ['pencilcup', 'books', 'stapler'], snow: ['snowman', 'pine'], neon: ['cone', 'barrel'] };
const FXCOL = { splash: ['#FFFFFF'], shards: ['#FFFFFF', '#E8F4FF', '#C0392B', '#BFE3FF'], wood: ['#C98E4A', '#E9B877', '#8A5A2B'], paper: ['#F5F0E0', '#FFFFFF', '#7A1F2B', '#2D7FF9'], fruit: ['#E8283C', '#7BC043', '#FF8A1F', '#7A3FA8'], soil: ['#4A2C17', '#6B4226', '#3E8A28', '#8A5A30'], snow: ['#FFFFFF', '#DDF2FF', '#F4FAFF'], glitter: ['#FFFFFF', '#CFEFFF', '#FFD23F', '#FF5DA2'], plastic: ['#EE2B3B', '#2D7FF9', '#FFD23F', '#22C55E'], neon: ['#FF3DF2', '#3DE0FF', '#B6FF7A'], spark: null };
const spriteCol = (kind) => DECOL[Math.floor(hash(kind.length * 77 + kind.charCodeAt(0)) * 6)];   // the colour sprite() rolls first (the lego brick's)
const shade = (hex, f) => { const n = parseInt(hex.slice(1, 7), 16), ch = (k) => Math.max(0, Math.min(255, Math.round(((n >> k) & 255) * f))); return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`; };
function makeSolid(kind, s, lat, r, a, extra) {
  const D = SOLID[kind], P = PIECES[kind], p = spotOn(s, lat), o = { kind, x: p.x, y: p.y, s, lat, r, a, h: P.h * r / P.r, fx: D.fx, drink: D.drink, snd: D.snd, wob: 0, free: 0, ...extra };
  o.side = D.side || shade(spriteCol(kind), 0.62); o.sideLit = shade(o.side, 1.25);
  if (D.c) { o.shape = 'c'; o.cr = r * D.c; o.lext = o.cr; } else {
    o.shape = 'b'; o.hx = r * D.b[0]; o.hy = r * D.b[1]; o.rr = r * D.b[2]; o.cr = Math.hypot(o.hx, o.hy);
    const rel = a - (at(s).a + Math.PI / 2); o.lext = o.hx * Math.abs(Math.cos(rel)) + o.hy * Math.abs(Math.sin(rel)); }
  return o;
}
// 🚧 a few obstacles stand on the road each course (2 + course, up to 5), from the place's own things: never on a bridge,
// in a tunnel or a fork, clear of the grid, the finish, the hazards, the open edges and each other, and always to one
// side, leaving a clear lane at least 2.5 cars wide on the other (o.free says which side that is)
function placeObstacles() {
  const L = g.track.len, w = g.track.w, vocab = ROADOBS[TH().key] || ROADOBS.kitchen, n = 2 + Math.min(3, g.course), lo = sOf(GRID + 320), hi = FINISH - sOf(260);
  let relax = 1; const okS = (s) => [s - sOf(70), s, s + sOf(70)].every((q) => { const k = secAt(q).kind; return k !== 'bridge' && k !== 'tunnel' && k !== 'fork'; }) && !islandNear(s, 160)
    && !(g.edges || []).some((e) => s > e.s0 - sOf(60) && s < e.s1 + sOf(60)) && !g.items.some((i) => Math.abs(i.s - s) * L < 90 * relax) && !g.solids.some((o) => Math.abs(o.s - s) * L < 200 * relax);
  // candidates: sixteen slots along the road taken in a stride (jittered, a few passes), so the obstacles spread out along it
  for (let tries = 0, made = 0; made < n && tries < 160; tries++) {
    if (tries === 96) relax = 0.7;   // a crowded road: closer together on the last passes
    const h = (k) => hash(g.seed + g.course * 53 + 400 + tries * 7 + k), u = (((tries * 7 + Math.floor(hash(g.seed + g.course) * 16)) % 16) + h(0)) / 16, s = lo + (((u + 0.37 * Math.floor(tries / 16)) % 1)) * (hi - lo); if (!okS(s)) continue;
    const kind = vocab[(made + g.course) % vocab.length], D = SOLID[kind], r = D.r * (0.9 + 0.2 * h(1)), ra = at(s).a, a = D.lay ? ra + (h(2) - 0.5) * D.lay : h(2) * 6.28;
    const probe = makeSolid(kind, s, 0, r, a), sd = h(3) < 0.5 ? 1 : -1, q0 = probe.lext + 10, q1 = w / 2 - probe.lext * 0.4, q = q0 <= q1 ? q0 + h(4) * (q1 - q0) : q0;
    if (w / 2 + q - probe.lext < 2.5 * 2 * R) continue;
    g.solids.push(makeSolid(kind, s, sd * q, r, a, { free: -sd })); made += 1;
  }
}
// where a car touches a solid thing: the push out (pen) and the surface normal (n, out of it), or null
function contact(c, o) {
  let nx, ny, pen;
  if (o.shape === 'c') { const dx = c.x - o.x, dy = c.y - o.y, d = Math.hypot(dx, dy); pen = o.cr + R - d; if (pen <= 0) return null; if (d > 1e-6) { nx = dx / d; ny = dy / d; } else { nx = -Math.cos(c.a); ny = -Math.sin(c.a); } }
  else {
    const ca = Math.cos(o.a), sa = Math.sin(o.a), dx = c.x - o.x, dy = c.y - o.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, ex = Math.max(0, o.hx - o.rr), ey = Math.max(0, o.hy - o.rr);
    let ux = lx - Math.max(-ex, Math.min(ex, lx)), uy = ly - Math.max(-ey, Math.min(ey, ly)); const d = Math.hypot(ux, uy);
    if (d < 1e-6) { if (ex - Math.abs(lx) < ey - Math.abs(ly)) { ux = Math.sign(lx) || 1; uy = 0; pen = ex - Math.abs(lx) + o.rr + R; } else { ux = 0; uy = Math.sign(ly) || 1; pen = ey - Math.abs(ly) + o.rr + R; } }
    else { pen = o.rr + R - d; if (pen <= 0) return null; ux /= d; uy /= d; }
    nx = ux * ca - uy * sa; ny = ux * sa + uy * ca; }
  return { nx, ny, pen };
}
// the bounce off it: out along the normal, the velocity reflected with REST, and the speed lost by how square the hit was
// (k: 1 head on, 0 a scrape): a glancing scrape keeps most of it, head on keeps a third. Off-centre hits slew the car
// round (yaw kick); a square one turns its nose toward the free side, so it doesn't just ram it again. Returns the
// impact speed (into the surface) and k.
function bounceOff(c, hit, free = 0) {
  const { nx, ny, pen } = hit; c.x += nx * pen; c.y += ny * pen; syncVel(c);
  const vn = c.vx * nx + c.vy * ny; if (vn >= 0) return { imp: 0, k: 0 };
  const sp = Math.hypot(c.vx, c.vy) || 1, k = Math.min(1, -vn / sp), tx = -ny, ty = nx, vt = (c.vx * tx + c.vy * ty) * (1 - 0.2 * k), vn2 = -vn * REST;
  c.vx = nx * vn2 + tx * vt; c.vy = ny * vn2 + ty * vt; setSpeed(c);
  const side = -Math.sin(c.a) * nx + Math.cos(c.a) * ny, kick = Math.min(1, -vn / 120);
  c.w = (c.w || 0) + side * k * kick * 5 + (Math.abs(side) < 0.35 ? (free || Math.sign(side) || 1) * k * k * kick * 2.4 : 0);
  return { imp: -vn, k };
}
// 💥 what a hit looks and sounds like: crumbs, splashes, shards, snow or sparks off the thing, it wobbles, a thud (a clink
// for a cup, a clack for metal and plastic); your own hard hits shake the screen and count (obsHits)
let obsHitsN = 0, rivalHitsN = 0;
function impact(c, o, hit, b, isMe) {
  if (b.imp < 25 || c.hitT > 0) return;
  c.hitT = 0.22; o.wob = Math.min(1, o.wob + b.imp / 160);
  const x = c.x - hit.nx * R, y = c.y - hit.ny * R, n = Math.round((isMe ? 10 : 4) * Math.min(1.6, b.imp / 100)), cols = o.fx === 'splash' ? [o.drink || '#7EC8F5', '#FFFFFF', o.drink || '#7EC8F5'] : FXCOL[o.fx];
  if (!cols || o.fx === 'neon') sparks(x, y, -hit.nx, -hit.ny, Math.max(60, b.imp * 1.4), n, cols);
  else for (let i = 0; i < n; i++) { const a = Math.atan2(hit.ny, hit.nx) + (Math.random() - 0.5) * 2.4, sp = 50 + Math.random() * 130 * Math.min(1.4, b.imp / 120), wet = o.fx === 'splash' || o.fx === 'snow';
    g.dust.push({ x, y, vx: Math.cos(a) * sp + c.vx * 0.2, vy: Math.sin(a) * sp + c.vy * 0.2, life: 0.35 + Math.random() * 0.3, max: 0.65, r: 1 + Math.random() * (wet ? 1.8 : 1.4), grow: wet ? 2.5 : 0, col: cols[i % cols.length], a: 0.95 }); }
  while (g.dust.length > 150) g.dust.shift();
  if (!isMe) { rivalHitsN += 1; return; }
  obsHitsN += 1; c.bob = 1;
  sfx(b.imp > 90 ? 'thud' : (o.snd || 'thud')); if (o.fx === 'splash' && b.imp > 60) sfx('splash');
  if (b.imp > 70 && !host.reduceMotion) g.shake = Math.max(g.shake || 0, Math.min(6, b.imp / 35));
  if (b.imp > 110) { g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: o.island ? '💥 CRUNCH' : '💥 THUNK', life: 0.8 }); }
}
// 🚗💥🚗 two cars meet: pushed apart, and the push along the line between them is shared (equal masses, restitution 0.5),
// so a rear-ender shoves the car ahead on and a side swipe slews both a little. Returns the closing speed.
function carHit(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (d >= R * 2 || d < 1e-6) return 0;
  const nx = dx / d, ny = dy / d, push = (R * 2 - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
  syncVel(a); syncVel(b);
  const vr = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (vr >= 0) return 0;
  const j = -(1 + 0.5) * vr / 2; a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny;
  const tv = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx, twist = Math.max(-1, Math.min(1, tv / 200)) * Math.min(1, j / 80);
  a.w = (a.w || 0) + twist * 1.6; b.w = (b.w || 0) - twist * 1.6; setSpeed(a); setSpeed(b); a.bob = b.bob = Math.min(1, j / 60);
  return -vr;
}
// the line a car takes: a fork's lane round the island ahead (its side of the road as it comes up, rivals by their
// number), else round the next obstacle up the road (avoidLat), else the middle of the tape
const LOOK = 260;
function aimAt(c, ahead) {
  const s = c.s + ahead, isl = islandNear(s, 60);
  if (isl) { if (!c.lane) c.lane = c.lat ? Math.sign(c.lat) : (c.n || 1) % 2 ? 1 : -1; return spotOn(s, c.lane * (isl.wi + (g.track.w / 2 - isl.wi) / 2)); }
  c.lane = 0;
  const dl = avoidLat(c); return dl ? spotOn(s, dl) : at(s);
}
// 🚧 round the next obstacle within LOOK up the road: the side with the lane (or the side the car is already on, if
// there's room there), passing a car's width plus a margin off it, eased in as it comes up and held while passing.
// A rival's margin is its own (c.clip), so now and then one shaves it.
function avoidLat(c) {
  const L = g.track.len, w = g.track.w; let o = null, bd = 1e9;
  for (const q of g.solids) { if (q.island) continue; const d = (q.s - c.s) * L; if (d < -(q.lext + R) || d > LOOK || d >= bd) continue; bd = d; o = q; }
  for (const q of g.avoid || []) { if (q.owner === c && q.arm > 0) continue; const d = (q.s - c.s) * L; if (d < -(q.lext + R) || d > LOOK || d >= bd) continue; bd = d; o = q; }   // 🐢 patches, 🍌 slicks, 🪤 traps
  if (!o) { c.dodge = null; const b = boostAhead(c); return b ? b.z.lat * smooth01((LOOK - b.d) / (LOOK * 0.5)) : 0; }   // ⏩ nothing in the way: line up for a boost pad
  const margin = c.n ? 7 + (c.clip || 0) : 12, line = (sd) => (sd > 0 ? o.lat + o.lext + R + margin : o.lat - o.lext - R - margin), room = (sd) => (sd > 0 ? w / 2 - 2 - (o.lat + o.lext) : (o.lat - o.lext) + w / 2 - 2);
  if (!c.dodge || c.dodge.o !== o) { const mine = (c.lat || 0) > o.lat ? 1 : -1; c.dodge = { o, sd: room(mine) >= 2 * R + margin + 4 ? mine : (o.free || -mine) }; }
  const lim = w / 2 - R - 2, tgt = Math.max(-lim, Math.min(lim, line(c.dodge.sd))), k = smooth01((LOOK - bd) / (LOOK * 0.5));
  return tgt * k;
}
function drive(c, dt, steer, brake, isMe) {
  if (c.fall > 0) { c.fall -= dt; c.x += (c.vx ?? Math.cos(c.a) * c.v) * dt * 0.5; c.y += (c.vy ?? Math.sin(c.a) * c.v) * dt * 0.5; c.a += dt * 5; if (c.fall <= 0) { if (isMe) startRescue(c); else respawn(c, false); } return; }   // 🪂 tumbling off the table
  if (c.rescue) { stepRescue(c, dt); return; }
  const n = nearest(c.x, c.y), onTape = n.d < g.track.w / 2, milk = g.items.find((i) => i.kind === 'milk' && Math.hypot(i.x - c.x, i.y - c.y) < i.r);
  const mud = c.mud && !(c.air > 0), vmax = topSpeed() * (isMe && g.nitro > 0 ? 1.5 : 1) * (onTape ? 1 : 0.55) * (isMe ? 1 : c.skill) * (c.kerb ? 0.8 : 1)
    * (c.padT > 0 ? 1.4 : 1) * (c.turboT > 0 ? 1.5 : 1) * (c.slipT > 0 ? 1.12 : 1) * (c.zapT > 0 ? 0.55 : 1) * (mud ? 0.6 : 1) * (c.magT > 0 ? 1.15 : 1);   // ⏩ pads, 🔥 turbo, 💨 the draft, 🌩️ a cloud, 🐢 a patch, 🧲 a magnet
  syncVel(c);
  const v0 = c.v, grip = (milk ? 0.25 : 1) * (onTape ? 1 : 0.8) * (c.air > 0 ? 0.35 : 1) * (mud ? 0.7 : 1);
  // the nose first (the steering, a spin-out, the yaw left by a knock), then the velocity measured against it
  c.w = (c.w || 0) * Math.pow(YAW_DAMP, dt); c.a += c.w * dt;
  let ca = Math.cos(c.a), sa = Math.sin(c.a), vF = c.vx * ca + c.vy * sa;
  if (c.spin > 0) { c.spin -= dt; c.a += dt * 9; }
  else { const under = 1 - UNDER * smooth01((vF - 110) / 170); c.a += steer * TURN * (milk ? 0.25 : 1) * dt * Math.min(1, Math.max(0, vF) / 80 + 0.3) * under; }
  ca = Math.cos(c.a); sa = Math.sin(c.a); vF = c.vx * ca + c.vy * sa; let vL = -c.vx * sa + c.vy * ca;
  if (c.spin > 0) { const f = Math.pow(0.5, dt); vF *= f; vL *= f; }
  else {
    // the throttle (always on: the car always goes) pulls less the nearer top speed it is; the brakes bite hard
    if (brake) { if (vF > 0) vF = Math.max(0, vF - 420 * dt); } else vF += (vmax - vF) * ACCEL * dt;
    if (milk) vF = Math.max(vF, vmax * 0.6);
    if ((mud || c.zapT > 0) && vF > vmax) vF += (vmax - vF) * 3 * dt;   // 🐢 a sticky patch (or 🌩️ a cloud) drags you down to its pace quickly
    // the tyres: the sideways slide pulled back toward the nose, up to what the surface can give
    const lim = GRIP_ACC * grip * (0.7 + 0.3 * topSpeed() / VMAX) * dt, dv = Math.max(-lim, Math.min(lim, -vL * Math.min(1, GRIP_RATE * dt))); vL += dv;
  }
  c.vx = ca * vF - sa * vL; c.vy = sa * vF + ca * vL; setSpeed(c);
  c.slip = c.v > 30 ? Math.atan2(vL, Math.max(1, Math.abs(vF))) : 0;
  // the look of it: wheels roll, the front wheels turn, brake lights, a skid when it slides, spins, milk or a stamp on the brakes
  c.roll = (c.roll || 0) + c.v * dt; c.st = (c.st || 0) + (steer - (c.st || 0)) * Math.min(1, dt * 10); c.brk = brake || (v0 - c.v) > 140 * dt;
  c.skid = c.v > 60 && (c.spin > 0 || Math.abs(c.slip) > 0.14 || (milk && c.v > 80) || (brake && c.v > 90) || (Math.abs(steer) > 0.65 && c.v > topSpeed() * 0.62));
  c.bob = Math.max(0, (c.bob || 0) - dt * 3);
  if (c.air > 0) { c.air -= dt; if (c.air <= 0) c.bob = 1; }
  if (c.hitT > 0) c.hitT -= dt;
  let vx = c.vx, vy = c.vy;
  if (g.twist?.kind === 'magnet') { const t = at(c.s + 0.001); vx += Math.cos(t.a + Math.PI / 2) * 70 * g.twist.dir; vy += Math.sin(t.a + Math.PI / 2) * 70 * g.twist.dir; }
  if (g.twist?.kind === 'fan') vx += 60 * g.twist.dir;
  if (c.magT > 0 && alive(c.magTo) && !nearEdge(c)) { const dx = c.magTo.x - c.x, dy = c.magTo.y - c.y, d = Math.hypot(dx, dy); if (d > 34) { vx += dx / d * 110; vy += dy / d * 110; } }   // 🧲 reeled in
  c.x += vx * dt; c.y += vy * dt;
  // 🥤 the solid things: the forks' centrepieces and the obstacles on the road (a car in the air clears the low ones)
  const L = g.track.len;
  for (const o of g.solids) { if (Math.abs(o.s - c.s) * L > o.cr + R + 40 || (c.air > 0 && o.h < 16)) continue; const hit = contact(c, o); if (!hit) continue; const b = bounceOff(c, hit, o.free || (o.island ? Math.sign(c.lat || 1) : 0)); impact(c, o, hit, b, isMe); }
  // walls: the cereal boxes (square to the table), the same bounce
  const walls = g.items.filter((i) => i.kind === 'box').concat(g.obs.filter((o) => o.kind === 'box'));
  walls.forEach((b) => { if (Math.abs(c.x - b.x) > b.w / 2 + R || Math.abs(c.y - b.y) > b.h / 2 + R) return; const hit = contact(c, { shape: 'b', x: b.x, y: b.y, a: 0, hx: b.w / 2, hy: b.h / 2, rr: 2 }); if (!hit) return;
    const bo = bounceOff(c, hit); sparks(c.x - hit.nx * R, c.y - hit.ny * R, -hit.nx, -hit.ny, Math.max(c.v, bo.imp), isMe ? 7 : 3); c.bob = 1;
    if (c.v < 50) { const ta = at(nearest(c.x, c.y).s).a; c.a = ta + wrapA(c.a - ta) * 0.4; c.vx += Math.cos(ta) * 50; c.vy += Math.sin(ta) * 50; setSpeed(c); }   // never stuck against it
    if (isMe) b.hit = true;   // 📦 dented: only a box your car has hit can be smashed by a tap
    if (isMe && !c.bumpT) { c.bumpT = 0.5; if (c.shield > 0) { c.shield = 0; } else { c.spin = 0.3; sfx('clack'); } } });
  if (c.bumpT > 0) c.bumpT = Math.max(0, c.bumpT - dt);
  const n2 = nearest(c.x, c.y); c.prevS = c.s; c.s = n2.s; c.off = n2.d;
  const ta = at(n2.s).a, nx = -Math.sin(ta), ny = Math.cos(ta), lat = (c.x - n2.px) * nx + (c.y - n2.py) * ny, side = Math.sign(lat) || 1;
  // 🍎 a fork's island: a kerbed lens round the thing in the middle; driving over its kerb rumbles and slows you
  { const isl = islandNear(n2.s, 0); c.kerb = false; if (isl && c.air <= 0) { const u = (n2.s - isl.s) * L / isl.lh, half = isl.wi * Math.sqrt(Math.max(0, 1 - u * u)); if (Math.abs(lat) < half + R * 0.4) { c.kerb = true; if (c.v > 60) c.bob = Math.max(c.bob, 0.35); } } }
  c.lat = lat;
  // behind the grid the road is closed by a wall
  if (n2.s <= 0.0005) { const p0 = at(0), back = (c.x - p0.x) * Math.cos(p0.a) + (c.y - p0.y) * Math.sin(p0.a); if (back < 0) { c.x -= Math.cos(p0.a) * back; c.y -= Math.sin(p0.a) * back; bounceAlong(c, p0.a, isMe); } }
  // past the tape's edge where the table ends: over you go
  if (edgeAt(n2.s, side)) { if (c.air <= 0 && Math.abs(lat) > g.track.w / 2 + 6) { c.fall = 0.7; if (isMe) { host.cue?.('near', c.x, c.y); sfx('whistle', { dur: 0.5 }); g.fx.push({ kind: 'text', x: c.x, y: c.y - 24, text: '🪂 WHOOPS', life: 1 }); } } return; }
  // 🧱 a guard on the table's edge: glance off it and back along the road
  const lim = g.track.w / 2 + marginAt(n2.s, side) - R;
  if (Math.abs(lat) > lim) { c.x = n2.px + nx * side * lim; c.y = n2.py + ny * side * lim; bounceAlong(c, ta, isMe, nx * side, ny * side); }
}
function update(dt) {
  W = host?.W || W;
  // 🕳️ while the pocket calls, the race slows (time to tap it, no time to crash), and eases back in after you come up
  { let f = host.pocket?.offering?.() ? POCKET_SLOW : 1; if (g.slowT > 0) { g.slowT = Math.max(0, g.slowT - dt); f = Math.min(f, 1 - (1 - POCKET_SLOW) * (g.slowT / POCKET_EASE)); } dt *= f; }
  g.time += dt;
  if (g.fin) { g.fin.t += dt; g.fin.conf.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= Math.pow(0.4, dt); p.r += p.vr * dt; }); if (g.fin.t > FIN_T) g.fin = null; }
  if (g.twist && g.time > g.twist.until) { g.twist = null; g.paw = null; }
  g.dark += ((g.twist?.kind === 'dark' ? 1 : 0) - g.dark) * Math.min(1, dt * 3);
  if (g.nitro > 0) g.nitro -= dt;
  if (g.tableTurn) { g.turn = (g.turn || 0) + (g.tableTurn - (g.turn || 0)) * Math.min(1, dt * 3); if (!S.curve.window && Math.abs(g.tableTurn - g.turn) < 0.01) { g.tableTurn = 0; g.turn = 0; } }
  // 🚦 3 · 2 · 1 · GO on the grid: nobody moves until GO
  if (g.go > 0) { g.go -= dt; const k = Math.ceil(g.go / (COUNT / 3)); if (k < g.goShown) { g.goShown = k; if (k > 0) sfx('clack'); } if (g.go <= 0) { sfx('whistle', { dur: 0.3 }); g.goT = 0.8; } return; }
  if (g.goT > 0) g.goT -= dt;
  { const now = performance.now(); for (const id of Object.keys(taps)) { const tp = taps[id]; if (now - tp.t >= TAP_MS) { delete taps[id]; held[side(tp)] = true; held['id' + id] = side(tp); } } }   // a press held past a tap steers
  g.avoid = softs();
  let steer = (held.left ? -1 : 0) + (held.right ? 1 : 0); const brake = !!(held.left && held.right);
  if (g.auto) { const look = aimAt(g.me, sOf(70)), want = Math.atan2(look.y - g.me.y, look.x - g.me.x); steer = Math.max(-1, Math.min(1, wrapA(want - g.me.a) * 2.5)); }   // a test autopilot
  const me = g.me; me.spin = me.spin || 0;
  drive(me, dt, brake ? 0 : steer, brake, true); if (S.over) return;
  carStuff(me, dt, true);
  if (g.auto && g.weapon && !g.autoHold) { g.autoT = (g.autoT || 0) + dt; if (g.autoT > 0.6) { g.autoT = 0; fireMine(); } }   // the test autopilot uses what it picks up
  // 🗺️ into a new section: its banner (the course's own banner names the first)
  { const sc = secAt(me.s); if (sc.i > g.secShown && !me.fall && !me.rescue) { g.secShown = sc.i; host.banner(`${sc.icon} ${sc.name}`, `part ${sc.i + 1} of ${g.secs.length} · ${KINDS[sc.kind].say}`); sfx('chime', { hi: sc.i % 2 === 1 }); }
    // 🛏️ under a roof: the light goes (the roof thins so you can see your car) and comes back at the far mouth
    const under = sc.roof && me.s > sc.s0 + 0.012 && me.s < sc.s1 - 0.012; g.inRoof += ((under ? 1 : 0) - g.inRoof) * Math.min(1, dt * 4); g.dimNow += ((under ? sc.dim || 0.5 : 0) - g.dimNow) * Math.min(1, dt * 2.5); }
  // 🪖 soldiers and 🕳️ the pocket, 🍞 the toaster, the pennies
  g.obs = g.obs.filter((o) => { o.life -= dt; if (o.kind === 'soldier' && Math.hypot(o.x - me.x, o.y - me.y) < R + 10 && me.air <= 0 && !me.fall && !me.rescue) { if (me.shield > 0) { me.shield = 0; } else { me.spin = 0.8; S.combo = 0; } g.fx.push({ kind: 'text', x: o.x, y: o.y - 20, text: TH().bumpTxt, life: 0.8 }); sfx('thud'); return false; } return o.life > 0; });
  g.items.forEach((i) => { const d = Math.hypot(i.x - me.x, i.y - me.y);
    if (i.kind === 'hole' && d < i.r && me.air <= 0 && !me.fall && !me.rescue) { me.spin = 0; me.v = 0; const p = at(me.s - sOf(90)); me.x = p.x; me.y = p.y; me.a = p.a; S.combo = 0; host.cue?.('near', i.x, i.y); sfx('plunk');
      if (g.course >= 3) { if (!host.hurt('fell in the pocket')) host.banner('🕳️ THE POCKET', `${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`); } else { me.spin = 0.9; host.banner('🕳️ THE POCKET', 'fished out · from course 3 it costs a life'); } }
    if (i.kind === 'toaster' && d < 20 && me.air <= 0 && me.v > 60) { me.air = me.airMax = 0.7; me.v = Math.max(me.v, topSpeed() * 1.2); sfx('whistle', { dur: 0.3 }); g.fx.push({ kind: 'text', x: me.x, y: me.y - 24, text: '🍞 POP!', life: 0.8 }); } });
  g.pennies = g.pennies.filter((p) => { if (Math.hypot(p.x - me.x, p.y - me.y) < R + 8) { host.add(20); host.cue?.('score', p.x, p.y); g.fx.push({ kind: 'text', x: p.x, y: p.y - 14, text: '+20', life: 0.7 }); sfx('chime', { hi: true }); return false; } return true; });   // flat: the combo is for finishes and rivals
  // 🐈 the paw sweeps back down the road toward you and swats whatever it meets
  if (g.paw) { g.paw.t += dt; g.paw.s -= sOf(160) * dt; if (g.paw.s < 0.01) g.paw = null; else { const p = at(g.paw.s); [me, ...g.rivals].forEach((c) => { if (Math.hypot(c.x - p.x, c.y - p.y) < 34 && c.spin <= 0 && !c.fall && !c.rescue) { c.spin = 0.7; c.x += Math.cos(p.a + Math.PI / 2) * 30; c.y += Math.sin(p.a + Math.PI / 2) * 30; if (c === me) { S.combo = 0; sfx('thud'); } } }); } }
  // rivals: they follow the tape, rubber-banded to you; pushed far enough behind the camera they're out of the race
  const L = g.track.len;
  g.rivals.forEach((r) => { r.spin = r.spin || 0; if (r.done) return;
    if (r.out > 0) { r.out -= dt; if (r.out <= 0) { if (me.s + sOf(300) < FINISH - 0.04) { const p = at(me.s + sOf(300)); r.x = p.x; r.y = p.y; r.a = p.a; r.v = 0; r.s = r.prevS = me.s + sOf(300); } else r.out = 999; } return; }   // back on the tape ahead of you, unless the finish is near
    const gap = (r.s - me.s) * L, look = aimAt(r, sOf(70)), want = Math.atan2(look.y - r.y, look.x - r.x), da = wrapA(want - r.a);
    const sk = r.skill; r.skill = sk * (gap < -350 ? 1.18 : gap > 280 ? 0.9 : 1); drive(r, dt, Math.max(-1, Math.min(1, da * 2.5)), false, false); r.skill = sk;
    carStuff(r, dt, false); rivalArms(r, dt);
    if (r.s >= FINISH) { r.done = true; r.place = 1 + g.rivals.filter((x) => x.done && x !== r).length + (g.done ? 1 : 0); return; }
    if (gap < -520 && r.off < 40 && !r.fall && !r.rescue) { r.out = 4; outsN += 1; const pts = 150; host.add(pts); host.cue?.('kill', r.x, r.y); g.fx.push({ kind: 'text', x: me.x, y: me.y - 34, text: `🏁 LEFT BEHIND +${pts}`, life: 1.1, big: true }); sfx('cheer', { delay: 0.05 }); }   // flat
    // 🚗💥 bumping: a real knock, momentum shared (a hard one bounces a rival off your 🫧 bubble and pops it)
    if (!me.rescue && !me.fall && !r.fall && !r.rescue) { const hv = carHit(me, r); if (hv > 60 && me.shield > 0) { r.spin = 0.5; me.shield = 0; } if (hv > 45 && !me.hitT) { me.hitT = 0.25; sfx('clack'); if (hv > 110 && !host.reduceMotion) g.shake = Math.max(g.shake || 0, 2.5); } } });
  const live = g.rivals.filter((r) => !r.done && !(r.out > 0) && !r.fall && !r.rescue);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) carHit(live[i], live[j]);
  stepArms(dt);
  if (g.shake > 0) g.shake = g.shake > 0.05 ? g.shake * Math.pow(0.002, dt) : 0;
  g.solids.forEach((o) => { if (o.wob > 0) o.wob = Math.max(0, o.wob - dt * 1.6); });
  kickDust(me, dt, true); g.rivals.forEach((r) => kickDust(r, dt, false)); stepDust(dt);
  skidMark(me, me.skid); g.rivals.forEach((r) => skidMark(r, r.skid && !(r.out > 0) && !r.done));
  if (me.s >= FINISH && !me.fall && !me.rescue) finish();
  g.fx.forEach((f) => { f.life -= dt; if (f.kind === 'bit') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= Math.pow(0.08, dt); f.vy *= Math.pow(0.08, dt); f.rot += f.vr * dt; } else f.y -= 24 * dt; }); g.fx = g.fx.filter((f) => f.life > 0);
}
// 🏁 over the line: your place pays (and the rivals you left behind or beat), then the next road
const PLACE_PTS = [600, 400, 260, 160, 100, 60];
function finish() {
  g.done = true; finishN += 1;
  const place = 1 + g.rivals.filter((r) => r.done).length, behind = g.rivals.length + 1 - place;
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 6;
  const pts = (PLACE_PTS[place - 1] + 60 * behind) * fibMult(Math.min(S.combo, 6)) + 300 * g.course;   // a finishing combo, capped
  const nth = ['1st', '2nd', '3rd', '4th', '5th', '6th'][place - 1];
  host.add(pts); host.cue?.('kill', g.me.x, g.me.y); sfx(place === 1 ? 'fanfare' : 'birdie');
  host.banner(place === 1 ? `🏆 ${nth}! COURSE ${g.course}` : `🏁 ${nth} · COURSE ${g.course}`, `+${pts} · on to course ${g.course + 1}`);
  g.course += 1; host.heal(1); newCourse();
  // 🏁 the moment: a flash, chequered flags sweeping in, confetti and your place, in screen space over the next grid
  const cols = ['#FFE36B', '#22E0C8', '#FF5DA2', '#FFFFFF', '#2D7FF9', '#FF8A3D'];
  g.fin = { t: 0, place, nth, conf: Array.from({ length: host.reduceMotion ? 0 : 70 }, (_, i) => ({ x: W / 2 + (Math.random() - 0.5) * 60, y: H() * 0.55, vx: (Math.random() - 0.5) * 700, vy: -260 - Math.random() * 520, r: Math.random() * 6, vr: (Math.random() - 0.5) * 16, sz: 4 + Math.random() * 5, col: cols[i % cols.length] })) };
}
const FIN_T = 2.2;

// ---------------------------------------------------------------- 📦 tap a box and it breaks
// A screen point (the organ's world units) back through the chase camera onto the table.
function toTable(p) {
  const th = g.camA + (g.turn || 0), sx = (p.x - W / 2) / g.zoom, sy = (p.y - H() * CAR_Y) / g.zoom;
  return { x: g.me.x + Math.cos(th) * sx + Math.sin(th) * sy, y: g.me.y - Math.sin(th) * sx + Math.cos(th) * sy };
}
function boxAt(p) {   // forgiving: a fat finger's width round the box, the same on screen at any zoom
  if (!g?.me || g.zoom == null || g.camA == null) return null;
  const q = toTable(p), slack = 22 / g.zoom; let best = null, bd = 1e9;
  [...g.items, ...g.obs].forEach((b) => { if (b.kind !== 'box' || !b.hit) return; const dx = Math.max(0, Math.abs(q.x - b.x) - b.w / 2), dy = Math.max(0, Math.abs(q.y - b.y) - b.h / 2), d = Math.hypot(dx, dy); if (d <= slack && d < bd) { bd = d; best = b; } });
  return best;
}
let smashedN = 0;
function smash(b) {
  g.items = g.items.filter((i) => i !== b); g.obs = g.obs.filter((o) => o !== b); smashedN += 1;
  const cols = ['#EE2B3B', '#FFD23F', '#FFFFFF', '#F2C27A', '#E8A33A'];
  for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160; g.fx.push({ kind: 'bit', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, sz: 3 + Math.random() * 4, col: cols[i % cols.length], life: 0.7 + Math.random() * 0.4 }); }
  host.add(30); host.cue?.('score', b.x, b.y); g.fx.push({ kind: 'text', x: b.x, y: b.y - 18, text: '📦 CRUNCH +30', life: 0.9 }); sfx('thud');
}

// ---------------------------------------------------------------- 🎁 weapons, speed zones and traps
// A kart race on a tabletop. ❓ Crates stand in rows across the road (about every 0.12 of it, never on a bridge, in a tunnel
// or a fork, clear of the grid and the finish) and come back a few seconds after a car breaks one: drive through one for a
// weapon (better ones the further back you are: WEAPONS' weights), then tap its slot or the upper middle of the field to
// use it. Rivals take them too and use them on whoever's near (rarely on course 1 at Stage 1). ⏩ Boost pads and 🐢 slow
// patches lie on the road (a slow one always to one side, with a lane round it), and drafting close behind a car for a
// moment gives a slipstream. Each place has its two traps (TRAPS), each on its own clock so a watchful driver can time it.
// None of it costs a life: a knock spins you out (SPIN_T, a full turn back to the same heading, the speed down to 0.4 and
// along the road, so a spin never throws you off the table), a spring or a hatch throws you into a hop.
const WEAPONS = {   // w: how likely from a crate when you lead / mid pack / at the back
  rocket: { icon: '🚀', name: 'ROCKET', short: 'ROCKET', say: 'homes in on the car ahead', w: [2, 3, 3] },
  slick: { icon: '🍌', name: 'BANANA PEEL', short: 'PEEL', say: 'drop it behind you', w: [5, 2, 1] },
  shock: { icon: '💥', name: 'SHOCKWAVE', short: 'WAVE', say: 'spins every car near you', w: [1, 2, 2] },
  zap: { icon: '🌩️', name: 'STORMCLOUD', short: 'CLOUD', say: 'rains on the leader for 2 s', w: [0, 1, 3] },
  shield: { icon: '🫧', name: 'BUBBLE SHIELD', short: 'BUBBLE', say: 'blocks one knock for 6 s', w: [3, 2, 1] },
  turbo: { icon: '🔥', name: 'TURBO', short: 'TURBO', say: 'two seconds of go', w: [1, 2, 3] },
  magnet: { icon: '🧲', name: 'MAGNET', short: 'MAGNET', say: 'reels you in behind the car ahead', w: [0, 2, 3] },
};
// each place's rocket, slick (icon, name, slot word, fill, rim) and slow patch (icon, name, fill, spots)
const ARMS_TH = {
  kitchen: { rocket: 'CORK ROCKET', rcol: '#C98E4A', slick: ['🍌', 'BANANA PEEL', 'PEEL', '#FFE14D', '#B8920F'], slow: ['🍓', 'STRAWBERRY JAM', '#A3122E', '#E8506A'] },
  bedroom: { rocket: 'TOY ROCKET', rcol: '#2D7FF9', slick: ['🧃', 'JUICE SPILL', 'SPILL', '#FFB347', '#E07B00'], slow: ['🧶', 'SHAGGY RUG', '#9C72DA', '#D9C2FF'] },
  garden: { rocket: 'BOTTLE ROCKET', rcol: '#22C55E', slick: ['🐌', 'SLUG SLIME', 'SLIME', '#B9F18C', '#6BA83A'], slow: ['🟤', 'MUD', '#5A3A1E', '#7A5230'] },
  desk: { rocket: 'PAPER ROCKET', rcol: '#F2F2F2', slick: ['🖋️', 'INK BLOT', 'INK', '#1F2A6E', '#0B1240'], slow: ['🧴', 'GLUE', '#EDE8D8', '#FFFFFF'] },
  snow: { rocket: 'ICICLE ROCKET', rcol: '#BFE6F7', slick: ['🧊', 'ICE PATCH', 'ICE', '#CFF3FF', '#7FD0F0'], slow: ['🌨️', 'SLUSH', '#A9C6DE', '#E2F0FA'] },
  neon: { rocket: 'NEON MISSILE', rcol: '#FF3DF2', slick: ['🛢️', 'OIL SLICK', 'OIL', '#16101F', '#7A5CFF'], slow: ['🟣', 'NEON TAR', '#2A0F4A', '#FF3DF2'] },
};
// each place's two traps: 🪤 a mousetrap (snaps on a car), a roller (crosses the road now and then), a spring (pops: a hop),
// a hatch (opens: a bump), a swing (an arm sweeping across one side of the road)
const TRAPS = {
  kitchen: [{ k: 'mousetrap', icon: '🪤', name: 'MOUSETRAP' }, { k: 'roller', icon: '🍊', name: 'ORANGE', col: '#FF8A1F', rim: '#C9600A', dimple: true }],
  bedroom: [{ k: 'spring', icon: '🎁', name: 'JACK-IN-THE-BOX', col: '#EE2B3B', lid: '#FFD23F', jack: true }, { k: 'roller', icon: '🎱', name: 'MARBLE', col: '#2D7FF9', rim: '#163F8A', glass: true }],
  garden: [{ k: 'spring', icon: '💦', name: 'SPRINKLER', col: '#2E7A3A', lid: '#9AA0A8', water: true }, { k: 'hatch', icon: '🐹', name: 'MOLEHILL', col: '#5A3A1E', mole: true }],
  desk: [{ k: 'swing', icon: '🪭', name: 'DESK FAN', col: '#2B2F3A', head: '#C0C7D2', fan: true }, { k: 'hatch', icon: '🗄️', name: 'DRAWER', col: '#8A93A3', drawer: true }],
  snow: [{ k: 'roller', icon: '⚪', name: 'SNOWBALL', col: '#FFFFFF', rim: '#B5D3EA', snow: true }, { k: 'swing', icon: '🔔', name: 'BAUBLE', col: '#E8283C', head: '#FFD23F', bauble: true }],
  neon: [{ k: 'hatch', icon: '🕳️', name: 'MANHOLE', col: '#3A3550', manhole: true }, { k: 'swing', icon: '🚧', name: 'BOOM GATE', col: '#FFFFFF', head: '#FF3DF2', gate: true }],
};
const TRAP_P = { roller: 3.6, spring: 2.6, hatch: 3.2, swing: 3.0 };   // each clock's period (s), quicker by stage and course
const SPIN_T = 2 * Math.PI / 9, CRATE_BACK = 2.5, SHIELD_T = 6, TAP_MS = 180;
const trapSpeed = () => 1 + 0.12 * (stage() - 1) + 0.05 * Math.min(6, (g?.course || 1) - 1);
const alive = (c) => c && !(c.fall > 0) && !c.rescue && !(c.out > 0) && !c.done;
const allCars = () => [g.me, ...g.rivals].filter(alive);
const wpn = (k) => { const b = WEAPONS[k], a = ARMS_TH[TH().key] || ARMS_TH.kitchen; if (k === 'slick') return { ...b, icon: a.slick[0], name: a.slick[1], short: a.slick[2] }; if (k === 'rocket') return { ...b, name: a.rocket }; return b; };
let hitsTakenN = 0, hitsGivenN = 0, shotsN = 0, bar = null, taps = {};
// a stretch of road clear of the islands, (unless kinds says otherwise) the bridges and the tunnels, and (with edges) the open edges
function roadClear(s, pad, kinds = ['bridge', 'tunnel'], edges = true) { const d = sOf(pad); return [s - d, s, s + d].every((q) => !kinds.includes(secAt(q).kind)) && !islandNear(s, Math.min(pad, 60) + 40) && !(edges && (g.edges || []).some((e) => s > e.s0 - d && s < e.s1 + d)); }
const mkZone = (kind, s, lat, len, wid, free = 0) => { const p = spotOn(s, lat); return { kind, s, lat, len, wid, lext: wid / 2, free, x: p.x, y: p.y, a: at(s).a }; };
function placeArms() {
  const L = g.track.len, w = g.track.w, co = Math.min(7, g.course), lo = sOf(GRID + 220), hi = FINISH - sOf(170);
  const far = (s, list, d) => !list.some((o) => o.kind !== 'box' && Math.abs(o.s - s) * L < d);   // (the cereal boxes stand off the road)
  const pocketClear = (s) => !g.items.some((i) => i.kind === 'hole' && (i.s - s) * L < 380 && (s - i.s) * L < 200);   // a spin or a hop never carries you into 🕳️ the pocket
  const slide = (s0, ok) => { for (let k = 0; k < 16; k++) for (const d of [k * 0.008, -k * 0.008]) { const q = s0 + d; if (q > lo && q < hi && ok(q)) return q; } return null; };
  g.crates = []; g.zones = []; g.traps = []; g.proj = []; g.slicks = []; g.waves = []; g.bolts = []; g.trapSpd = trapSpeed();
  // 🪤 the place's traps: two on course 1 at Stage 1, more with each course and stage
  const kinds = TRAPS[TH().key] || TRAPS.kitchen, nT = Math.min(7, 1 + co + (stage() - 1));
  for (let tries = 0; g.traps.length < nT && tries < 60; tries++) {
    const h = (k) => hash(g.seed + g.course * 89 + 900 + tries * 13 + k);
    const s = slide(lo + h(0) * (hi - lo), (q) => roadClear(q, 80) && far(q, g.solids, 100) && far(q, g.items, 70) && pocketClear(q) && far(q, g.traps, 180)); if (s == null) continue;
    g.traps.push(makeTrap(kinds[g.traps.length % kinds.length], s, h(1) < 0.5 ? 1 : -1, h(2) * 6)); }
  // ❓ the crate rows (round the traps)
  for (let row = 0, c0 = 0.12; c0 < 0.92; c0 += 0.12, row++) {
    const s = slide(c0 + (hash(g.seed + g.course * 7 + 500 + row) - 0.5) * 0.03, (q) => roadClear(q, 50, ['bridge', 'tunnel'], false) && far(q, g.solids, 90) && far(q, g.items, 70) && far(q, g.traps, 70)); if (s == null) continue;
    const n = co >= 3 ? 4 : 3, span = w * 0.68; for (let k = 0; k < n; k++) { const lat = (k / (n - 1) - 0.5) * span, p = spotOn(s, lat); g.crates.push({ s, lat, x: p.x, y: p.y, t: 0, pop: 1, row }); } }
  // ⏩ boost pads and 🐢 slow patches, a few a section
  g.secs.forEach((sc, i) => { const want = [...(i || co > 1 ? ['slow'] : []), 'boost', ...(co >= 3 && i % 2 ? ['boost'] : []), ...(co >= 4 && i % 2 === 0 ? ['slow'] : [])];
    want.forEach((kind, j) => { const h = (k) => hash(g.seed + g.course * 71 + i * 37 + j * 11 + k);
      let s = null; for (let k = 0; k < 3 && s == null; k++) s = slide(sc.s0 + 0.03 + hash(g.seed + g.course * 71 + i * 37 + j * 11 + 5 * k) * Math.max(0, sc.s1 - sc.s0 - 0.06), (q) => q > sc.s0 + 0.02 && q < sc.s1 - 0.02 && roadClear(q, 40, [], false) && pocketClear(q) && far(q, g.solids, 150) && far(q, g.crates, 70) && far(q, g.items, 80) && far(q, g.zones, 120) && far(q, g.traps, 80)); if (s == null) return;
      if (kind === 'boost') g.zones.push(mkZone('boost', s, (h(1) - 0.5) * (w - 70), 60, 46));
      else { const wid = w * 0.42, sd = h(1) < 0.5 ? 1 : -1; g.zones.push(mkZone('slow', s, sd * (w / 2 - wid / 2 - 2), 90 + h(2) * 40, wid, -sd)); } }); });

}
function makeTrap(look, s, sd, t0) {
  const w = g.track.w, tr = { k: look.k, look, s, side: sd, t0, a: at(s).a, free: -sd, snapT: -99 };
  if (look.k === 'mousetrap') Object.assign(tr, { lat: sd * (w / 2 - 34), hw: 20, hl: 28 });
  else if (look.k === 'spring') Object.assign(tr, { lat: sd * (w / 2 - 36), hw: 18, hl: 18 });
  else if (look.k === 'hatch') Object.assign(tr, { lat: sd * (w / 2 - 38), hw: 26, hl: 30 });
  else if (look.k === 'swing') { const reach = Math.min(w * 0.58, w - 72), inner = w / 2 + 16 - reach; Object.assign(tr, { reach, plat: sd * (w / 2 + 16), lat: sd * (inner + w / 2) / 2, hw: (w / 2 - inner) / 2 + 4 }); }
  else Object.assign(tr, { lat: 0, hw: 0 });
  tr.lext = tr.hw; tr.hitLat = tr.lat; const p = spotOn(s, tr.lat); tr.x = p.x; tr.y = p.y;
  if (tr.plat != null) { const q = spotOn(s, tr.plat); tr.px = q.x; tr.py = q.y; }
  return tr;
}
// a trap's clock: its period P, how far into this cycle (u, in seconds) and which cycle
function trapClock(tr) { const P = TRAP_P[tr.k] / (g.trapSpd || 1), t = g.time - tr.t0; return { P, u: ((t % P) + P) % P, cyc: Math.floor(t / P) }; }
const ROLL_T = () => 1.5 / (g.trapSpd || 1);
function rollerLat(tr) { const { u, cyc } = trapClock(tr), RD = ROLL_T(), w = g.track.w, dir = cyc % 2 ? -1 : 1, e = Math.min(1, u / RD); return { lat: dir * (-(w / 2 + 40) + (w + 80) * e), rolling: u < RD }; }
function swingTip(tr) { const { P } = trapClock(tr), th = 1.25 * Math.sin(2 * Math.PI * (g.time - tr.t0) / P), base = tr.a - tr.side * Math.PI / 2 + th; return { x: tr.px + Math.cos(base) * tr.reach, y: tr.py + Math.sin(base) * tr.reach, th }; }
function trapState(tr) {
  const { u } = trapClock(tr);
  if (tr.k === 'mousetrap') return g.time - tr.snapT < 3.2 / (g.trapSpd || 1) ? 'sprung' : 'armed';
  if (tr.k === 'roller') return rollerLat(tr).rolling ? 'rolling' : 'waiting';
  if (tr.k === 'spring') return u < 0.55 ? 'up' : 'down';
  if (tr.k === 'hatch') return u < 1.2 ? 'open' : 'shut';
  return 'swing';
}
// 💫 a knock: a full spin back to the same heading, the speed cut and laid along the road (a bubble shield takes it instead)
function spinOut(c, how, o = {}) {
  if (!alive(c)) return false;
  const isMe = c === g.me;
  if (c.shield > 0) { c.shield = 0; g.waves.push({ x: c.x, y: c.y, r: 14, R: 40, life: 0.35, max: 0.35, col: '#CFFBFF' }); if (isMe) { g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: '🫧 POP · SAVED', life: 1 }); sfx('pop'); } return false; }
  if (c.spin > 0.2) return false;
  syncVel(c); const ta = at(c.s).a, sp = c.v * (o.stop ? 0.12 : 0.4); c.vx = Math.cos(ta) * sp; c.vy = Math.sin(ta) * sp; setSpeed(c); c.spin = SPIN_T; c.w = 0; c.bob = 1;
  if (isMe) { S.combo = 0; hitsTakenN += 1; sfx('thud'); if (!host.reduceMotion) g.shake = Math.max(g.shake || 0, 3); if (o.title) host.banner(o.title, o.sub || 'spun out'); }
  else g.fx.push({ kind: 'text', x: c.x, y: c.y - 22, text: '💫', life: 0.8 });
  if (o.by === g.me && !isMe) { hitsGivenN += 1; host.add(40); host.cue?.('score', c.x, c.y); g.fx.push({ kind: 'text', x: c.x, y: c.y - 36, text: '🎯 +40', life: 1 }); }
  return true;
}
function hop(c, dur, minV) { if (c.air > 0) return false; c.air = c.airMax = dur; if (minV && c.v < minV) { c.v = minV; syncVel(c); } return true; }
function carAhead(c, maxD) { const L = g.track.len; let best = null; allCars().forEach((o) => { if (o === c || o.s <= c.s || (o.s - c.s) * L > maxD) return; if (!best || o.s < best.s) best = o; }); return best; }
function leaderBut(c) { let best = null; allCars().forEach((o) => { if (o !== c && (!best || o.s > best.s)) best = o; }); return best; }
// what a crate gives: weighted by where the car is in the race (leading: defence; at the back: the big stuff)
function rollWeapon(c) {
  const cars = [g.me, ...g.rivals].filter((o) => !(o.out > 0)), ahead = cars.filter((o) => o !== c && (o.done || o.s > c.s)).length, tier = ahead === 0 ? 0 : ahead >= cars.length / 2 ? 2 : 1;
  const ks = Object.keys(WEAPONS), tot = ks.reduce((a, k) => a + WEAPONS[k].w[tier], 0); let r = Math.random() * tot;
  for (const k of ks) { r -= WEAPONS[k].w[tier]; if (r < 0) return k; } return 'rocket';
}
const rivalHold = () => (6 + 8 * Math.random()) / (1 + 0.45 * (stage() - 1) + 0.2 * Math.min(6, g.course - 1));
const nearEdge = (c) => (g.edges || []).some((e) => c.s > e.s0 - sOf(90) && c.s < e.s1 + sOf(90));
function renderBar() {
  if (!bar || !g) return; const w = g.weapon; if (!w) { bar.innerHTML = ''; return; }
  const W0 = wpn(w.kind); bar.innerHTML = `<button type="button" class="on" aria-label="Use the ${W0.name.toLowerCase()}" title="${W0.say}"${w.gold ? ' style="border-color:#FFD23F;box-shadow:0 0 16px #FFD23Fcc"' : ''}>${W0.icon}<b style="white-space:nowrap">${w.n > 1 ? `${w.n}× ` : ''}${W0.short}</b></button>`;
}
function giveMe(kind, n = 1, gold = false) { g.weapon = { kind, n, gold }; const W0 = wpn(kind); g.fx.push({ kind: 'text', x: g.me.x, y: g.me.y - 30, text: `${W0.icon} ${gold ? 'GOLDEN ' : ''}${W0.name}`, life: 1.1, col: gold ? '#FFD23F' : undefined }); host.cue?.('pickup', g.me.x, g.me.y); sfx('chime', { hi: true }); renderBar(); }
// 🎯 you use what you hold (the slot, a tap on the upper middle of the field, Space)
function fireMine() {
  const me = g?.me; if (!g?.weapon || g.go > 0 || !alive(me) || S.over) return false;
  const w = g.weapon, W0 = wpn(w.kind); fireWeapon(me, w.kind, w.gold); shotsN += 1; w.n -= 1; if (w.n <= 0) g.weapon = null; renderBar();
  host.banner(`${W0.icon} ${w.gold ? 'GOLDEN ' : ''}${W0.name}`, w.n > 0 ? `${W0.say} · ${w.n} left` : W0.say);
  return true;
}
function fireWeapon(c, kind, gold) {
  const me = g.me, isMe = c === me, a = c.a, ca = Math.cos(a), sa = Math.sin(a), close = Math.hypot(c.x - me.x, c.y - me.y) < 520;
  if (kind === 'rocket') { const tg = carAhead(c, 1400); g.proj.push({ x: c.x + ca * 20, y: c.y + sa * 20, a, v: 470 + Math.max(0, c.v || 0) * 0.5, s: c.s, owner: c, target: tg, life: 3.2, age: 0, tr: [], gold });
    if (isMe || close) sfx('cannon', { size: 0.3 });
    if (tg === me && !isMe) g.fx.push({ kind: 'text', x: me.x, y: me.y - 34, text: '🚀 INCOMING', life: 1, col: '#FF8A8A' }); }
  else if (kind === 'slick') { const x = c.x - ca * 30, y = c.y - sa * 30, n = nearest(x, y), ta = at(n.s).a, lat = (x - n.px) * -Math.sin(ta) + (y - n.py) * Math.cos(ta);
    g.slicks.push({ x, y, s: n.s, lat, a: ta, r: 17, lext: 17, free: lat > 0 ? -1 : 1, owner: c, arm: 0.6, life: 40 }); if (isMe || close) sfx('plunk'); }
  else if (kind === 'shock') { g.waves.push({ x: c.x, y: c.y, r: 20, R: 210, life: 0.5, max: 0.5, col: '#FFE36B', w: 6 }, { x: c.x, y: c.y, r: 10, R: 150, life: 0.4, max: 0.4, col: '#FF8A3D', w: 4 });
    allCars().forEach((o) => { if (o !== c && o.air <= 0 && Math.hypot(o.x - c.x, o.y - c.y) < 210) spinOut(o, 'shock', { by: c, title: '💥 HIT BY A SHOCKWAVE', sub: 'spun out: no harm done' }); }); if (isMe || close) sfx('boom'); if (isMe && !host.reduceMotion) g.shake = Math.max(g.shake || 0, 2.5); }
  else if (kind === 'zap') { const lead = leaderBut(c); if (lead) { lead.zapT = 2; g.bolts.push({ c: lead, life: 0.45, j: Array.from({ length: 7 }, () => Math.random() - 0.5) }); if (lead === me) { host.banner('🌩️ HIT BY A STORMCLOUD', 'rained on: slow for 2 s'); hitsTakenN += 1; } if (isMe) { hitsGivenN += 1; host.add(40); } if (isMe || lead === me || close) sfx('flash'); } }
  else if (kind === 'shield') { c.shield = SHIELD_T; if (isMe) sfx('ping'); }
  else if (kind === 'turbo') { if (isMe) g.nitro = Math.max(g.nitro || 0, 2); else c.turboT = 2; if (isMe || close) sfx('cannon', { size: 0.4 }); }
  else if (kind === 'magnet') { c.magT = 2.5; c.magTo = carAhead(c, 900); if (isMe) sfx('buzz'); }
}
// 🤖 a rival with a weapon waits a while (less on later courses and stages), then uses it when it would land
function rivalArms(r, dt) {
  if (!r.weapon || !alive(r)) return; r.holdT -= dt; if (r.holdT > 0) return;
  const me = g.me, L = g.track.len, k = r.weapon, aheadC = carAhead(r, 700), safe = (o) => o !== me || (!nearEdge(me) && !me.fall && !me.rescue);
  const behind = allCars().some((o) => o !== r && o.s < r.s && (r.s - o.s) * L < 260 && safe(o)), nearC = allCars().filter((o) => o !== r && Math.hypot(o.x - r.x, o.y - r.y) < 190);
  const ok = k === 'rocket' ? aheadC && safe(aheadC) : k === 'slick' ? behind : k === 'shock' ? nearC.length && nearC.every(safe) : k === 'zap' ? safe(leaderBut(r)) : k === 'magnet' ? !!aheadC : true;
  if (!ok) { r.holdT = 0.5; return; }
  r.weapon = null; fireWeapon(r, k, false);
}
// everything a car meets on the road: crates, pads and patches, slicks, traps, the timers
function carStuff(c, dt, isMe) {
  ['padT', 'slipT', 'zapT', 'magT', 'shield', 'turboT', 'trapCD'].forEach((k) => { if (c[k] > 0) c[k] = Math.max(0, c[k] - dt); });
  if (!alive(c)) { c.mud = null; return; }
  const L = g.track.len, me = g.me, ground = !(c.air > 0);
  // ❓ crates: a car breaks every one it drives through, and keeps one weapon at a time
  for (const b of g.crates) { if (b.t > 0 || Math.abs(b.s - c.s) * L > 30 || Math.hypot(b.x - c.x, b.y - c.y) > R + 12) continue;
    b.t = b.temp ? 99 : CRATE_BACK; b.pop = 0;
    if (Math.abs(b.y - me.y) < 500) for (let i = 0; i < 6; i++) { const an = Math.random() * 6.28, sp = 50 + Math.random() * 110; g.fx.push({ kind: 'bit', x: b.x, y: b.y, vx: Math.cos(an) * sp + (c.vx || 0) * 0.3, vy: Math.sin(an) * sp + (c.vy || 0) * 0.3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, sz: 2.5 + Math.random() * 3, col: b.gold ? '#FFD23F' : ['#8B5CF6', '#B48CFF', '#FFFFFF'][i % 3], life: 0.5 }); }
    if (isMe) { if (b.gold) giveMe('rocket', 3, true); else if (!g.weapon) giveMe(rollWeapon(c)); else sfx('pop'); }
    else if (!c.weapon && Math.random() < Math.min(1, 0.4 + 0.15 * (g.course - 1) + 0.2 * (stage() - 1))) { c.weapon = b.gold ? 'rocket' : rollWeapon(c); c.holdT = rivalHold(); }
    b.gold = false; }
  // ⏩ / 🐢 the pads and patches under the car
  let mud = null;
  for (const z of g.zones) { if (Math.abs(z.s - c.s) * L > z.len / 2 || Math.abs((c.lat || 0) - z.lat) > z.wid / 2 + 3) continue;
    if (z.kind === 'boost') { if (ground) { if (!(c.padT > 0.5)) { syncVel(c); const tv = topSpeed() * 1.3 * (isMe ? 1 : c.skill); if (c.v < tv) { c.v = tv; syncVel(c); } if (isMe) { sfx('whistle', { dur: 0.15 }); g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: '⏩ BOOST', life: 0.7, col: '#FFE36B' }); } } c.padT = 0.9; } }
    else if (ground) mud = z; }
  if (isMe && mud && !c.mud) { sfx('gulp'); g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: `${(ARMS_TH[TH().key] || ARMS_TH.kitchen).slow[0]} STICKY`, life: 0.8 }); }
  c.mud = mud;
  // 🍌 slicks: anyone driving over one spins (the one who dropped it gets a moment to drive clear)
  for (const k of g.slicks) { if (!ground || (k.owner === c && k.arm > 0) || Math.abs(k.s - c.s) * L > 40 || Math.hypot(k.x - c.x, k.y - c.y) > k.r + R * 0.6) continue;
    k.life = 0; const W0 = wpn('slick'); spinOut(c, 'slick', { by: k.owner, title: `${W0.icon} OUCH · ${W0.name}`, sub: 'slipped and spun: steer round them' }); if (isMe || Math.abs(c.y - me.y) < 400) sfx('splash'); }
  // 🪤 the traps
  if (!(c.trapCD > 0)) for (const tr of g.traps) { const ds = (c.s - tr.s) * L; if (Math.abs(ds) > (tr.reach || 60) + 40) continue;
    const dl = (c.lat || 0) - tr.lat, Lk = tr.look, st = trapState(tr); let hit = false;
    if (tr.k === 'mousetrap') { if (ground && st === 'armed' && Math.abs(ds) < tr.hl + R * 0.5 && Math.abs(dl) < tr.hw + R * 0.5) { tr.snapT = g.time; hit = true; spinOut(c, 'trap', { stop: true, title: `${Lk.icon} OUCH · ${Lk.name}`, sub: 'snap! drive round it next time' }); if (isMe || Math.abs(c.y - me.y) < 400) sfx('clack'); g.fx.push({ kind: 'text', x: tr.x, y: tr.y - 20, text: '🪤 SNAP!', life: 0.8 }); } }
    else if (tr.k === 'spring') { if (ground && st === 'up' && Math.hypot(ds, dl) < tr.hw + R * 0.6) { hit = true; hop(c, 0.8, topSpeed() * 0.9); c.bob = 1; if (isMe) { sfx('boing'); g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: `${Lk.icon} BOING!`, life: 0.8 }); } } }
    else if (tr.k === 'hatch') { if (ground && st === 'open' && Math.abs(ds) < tr.hl && Math.abs(dl) < tr.hw + R * 0.3) { hit = true; hop(c, 0.35); c.v *= 0.72; syncVel(c); c.bob = 1; if (isMe) { sfx('thud'); g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: `${Lk.icon} BUMP!`, life: 0.8 }); } } }
    else if (tr.k === 'roller') { const rl = rollerLat(tr); if (ground && rl.rolling) { const q = spotOn(tr.s, rl.lat); if (Math.hypot(q.x - c.x, q.y - c.y) < R + 13) { hit = true; spinOut(c, 'trap', { title: `${Lk.icon} OUCH · ${Lk.name}`, sub: 'bowled over: time it next time' }); if (isMe) sfx('thud'); } } }
    else if (tr.k === 'swing') { if (ground) { const tp = swingTip(tr), ax = tp.x - tr.px, ay = tp.y - tr.py, u = Math.max(0, Math.min(1, ((c.x - tr.px) * ax + (c.y - tr.py) * ay) / (ax * ax + ay * ay))); if (Math.hypot(c.x - tr.px - ax * u, c.y - tr.py - ay * u) < R + 6) { hit = true; spinOut(c, 'trap', { title: `${Lk.icon} OUCH · ${Lk.name}`, sub: 'swatted: watch its swing' }); if (isMe || Math.abs(c.y - me.y) < 400) sfx('clack'); } } }
    if (hit) { c.trapCD = 1; if (isMe) g.trapHits = (g.trapHits || 0) + 1; break; } }
  // 💨 slipstream: close behind a car for a moment, and it tows you along
  { const ca = Math.cos(c.a), sa = Math.sin(c.a); let tuck = false;
    for (const o of allCars()) { if (o === c) continue; const dx = o.x - c.x, dy = o.y - c.y, along = dx * ca + dy * sa; if (along > 20 && along < 120 && Math.abs(-dx * sa + dy * ca) < 20) { tuck = true; break; } }
    if (tuck && c.v > 60) { c.draftT = (c.draftT || 0) + dt; if (c.draftT >= 0.8) { if (isMe && !(c.slipT > 0)) { sfx('whistle', { dur: 0.12 }); g.fx.push({ kind: 'text', x: c.x, y: c.y - 26, text: '💨 SLIPSTREAM', life: 0.8 }); } c.slipT = 0.7; } }
    else c.draftT = Math.max(0, (c.draftT || 0) - dt * 2); }
}
// the things in flight and the clocks: rockets, slicks lying about, crates coming back, rings and bolts fading
function stepArms(dt) {
  const L = g.track.len, me = g.me, cars = allCars();
  g.proj = g.proj.filter((p) => {
    p.life -= dt; p.age += dt;
    const tg = alive(p.target) ? p.target : null; let tx, ty;
    if (tg && p.age > 0.12) { tx = tg.x; ty = tg.y; } else { const q = at(Math.min(1, p.s + 90 / L)); tx = q.x; ty = q.y; }
    p.a += Math.max(-6 * dt, Math.min(6 * dt, wrapA(Math.atan2(ty - p.y, tx - p.x) - p.a)));
    p.x += Math.cos(p.a) * p.v * dt; p.y += Math.sin(p.a) * p.v * dt; p.tr.push(p.x, p.y); if (p.tr.length > 24) p.tr.splice(0, 2);
    const n = nearest(p.x, p.y); p.s = n.s;
    const boom = () => { g.waves.push({ x: p.x, y: p.y, r: 6, R: 34, life: 0.3, max: 0.3, col: '#FF8A3D', w: 5 }); sparks(p.x, p.y, -Math.cos(p.a), -Math.sin(p.a), 200, Math.abs(p.y - me.y) < 500 ? 8 : 0, ['#FFE36B', '#FF8A3D', '#FFFFFF']); if (Math.abs(p.y - me.y) < 500) sfx('boom'); return false; };
    for (const c of cars) { if ((c === p.owner && p.age < 0.6) || c.air > 0 || Math.hypot(c.x - p.x, c.y - p.y) > R + 9) continue; const W0 = wpn('rocket'); spinOut(c, 'rocket', { by: p.owner, title: `🚀 HIT BY A ${W0.name}`, sub: 'spun out: no harm done' }); return boom(); }
    for (const o of g.solids) if (Math.abs(o.s - p.s) * L < 80 && Math.hypot(o.x - p.x, o.y - p.y) < o.cr + 5) return boom();
    if (p.life <= 0 || n.d > g.track.w / 2 + MARGIN) return boom();
    return true; });
  g.slicks = g.slicks.filter((k) => { k.arm -= dt; k.life -= dt; return k.life > 0; });
  g.crates = g.crates.filter((b) => { if (b.t > 0) b.t -= dt; else b.pop = Math.min(1, b.pop + dt); if (b.temp) { b.life -= dt; return b.life > 0 && b.t <= 0; } return true; });
  g.waves = g.waves.filter((w) => (w.life -= dt) > 0); g.bolts = g.bolts.filter((b) => (b.life -= dt) > 0);
  if (me.magT > 0 && !alive(me.magTo)) me.magT = 0;
}
// the rivals and the autopilot steer round these (as round the solid things): slow patches, slicks, the traps that bite now
function softs() { return g.zones.filter((z) => z.kind === 'slow').concat(g.slicks, g.traps.filter((t) => t.k !== 'roller' && (t.k !== 'mousetrap' || trapState(t) === 'armed'))); }
function boostAhead(c) { const L = g.track.len; let best = null, bd = 1e9; for (const z of g.zones) { if (z.kind !== 'boost') continue; const d = (z.s - c.s) * L; if (d < -z.len / 2 || d > LOOK || d >= bd) continue; bd = d; best = z; } return best ? { z: best, d: bd } : null; }
// ---- the big beats' twists for the arms
function missileRain() {
  const me = g.me, w = g.track.w; [200, 450, 700].forEach((d) => { const s = me.s + sOf(d); if (s > FINISH - 0.02) return; for (let k = 0; k < 4; k++) { const lat = (k / 3 - 0.5) * w * 0.68, p = spotOn(s, lat); g.crates.push({ s, lat, x: p.x, y: p.y, t: 0, pop: 0, temp: true, life: 9 }); } });
}
function slipperyTable() {
  const me = g.me, w = g.track.w; for (let i = 0; i < 6; i++) { const s = me.s + sOf(160 + i * 130); if (s > FINISH - 0.02) break; const lat = (Math.random() - 0.5) * w * 0.7, p = spotOn(s, lat); g.slicks.push({ x: p.x, y: p.y, s, lat, a: at(s).a, r: 17, lext: 17, free: lat > 0 ? -1 : 1, owner: null, arm: 0, life: 25 }); }
}
function goldenCrate() {
  const me = g.me, rows = [...new Set(g.crates.filter((b) => !b.temp && b.s > me.s + sOf(150)).map((b) => b.row))].sort((a, b) => a - b); if (!rows.length) return false;
  const row = g.crates.filter((b) => b.row === rows[0]), b = row[row.length >> 1]; b.gold = true; b.t = 0; b.pop = 0; return true;
}
// ---- the look: sprites painted once (SPR px a unit), stamped rotated; glows are sprites too
const ASPR = new Map();
function aspr(key, w, h, paint) { let c = ASPR.get(key); if (c) return c; c = document.createElement('canvas'); c.width = Math.ceil(w * SPR); c.height = Math.ceil(h * SPR); const x = c.getContext('2d'); x.scale(SPR, SPR); x.translate(w / 2, h / 2); paint(x, w, h); ASPR.set(key, c); return c; }
function stamp(c, x, y, a, w, h) { ctx.save(); ctx.translate(x, y); if (a) ctx.rotate(a); ctx.drawImage(c, -w / 2, -h / 2, w, h); ctx.restore(); }
const glowS = (col) => aspr(`glow${col}`, 64, 64, (x) => { const gr = x.createRadialGradient(0, 0, 2, 0, 0, 32); gr.addColorStop(0, col + 'cc'); gr.addColorStop(0.45, col + '55'); gr.addColorStop(1, col + '00'); x.fillStyle = gr; x.fillRect(-32, -32, 64, 64); });
const emojiSpr = (ch) => aspr(`em${ch}`, 24, 24, (x) => { x.font = '20px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 0, 1); });   // a label, painted once (text is dear to draw each frame)
const blobPath = (x, rx, ry, sd) => { x.beginPath(); for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283, rr = 1 + 0.12 * Math.sin(k * 2.3 + sd) + 0.06 * Math.sin(k * 5.1 + sd * 2); x.lineTo(Math.cos(a) * rx * rr, Math.sin(a) * ry * rr); } x.closePath(); };
const crateSpr = (gold) => aspr(gold ? 'crateG' : 'crate', 48, 48, (x) => { { const gr = x.createRadialGradient(0, 0, 6, 0, 0, 24), col = gold ? '#FFD23F' : '#B48CFF'; gr.addColorStop(0, col + 'aa'); gr.addColorStop(0.5, col + '44'); gr.addColorStop(1, col + '00'); x.fillStyle = gr; x.fillRect(-24, -24, 48, 48); }   // its glow, painted in
  rrect(x, -12, -10, 26, 26, 5, '#00000050'); rrect(x, -13, -13, 26, 26, 5, gold ? '#FFD23F' : '#8B5CF6', gold ? '#8A6A00' : '#3B1E8A', 2); rrect(x, -11, -11, 22, 6, 3, '#ffffff45'); x.strokeStyle = gold ? '#FFF3B0' : '#C9B8FF'; x.lineWidth = 1; x.strokeRect(-9, -9, 18, 18);
  x.font = '900 17px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 3; x.strokeStyle = gold ? '#8A6A00' : '#2A1060'; x.strokeText(gold ? '★' : '?', 0, 1.5); x.fillStyle = '#FFFFFF'; x.fillText(gold ? '★' : '?', 0, 1.5); });
const padLit = () => aspr('padlit', 60, 46, (x) => { for (let k = 0; k < 3; k++) { const cx = -14 + k * 14; x.fillStyle = '#FFFBE0'; x.beginPath(); x.moveTo(cx - 6, -15); x.lineTo(cx + 6, 0); x.lineTo(cx - 6, 15); x.lineTo(cx - 1, 0); x.closePath(); x.fill(); } });
const padSpr = () => aspr('pad', 60, 46, (x, w, h) => { rrect(x, -w / 2, -h / 2, w, h, 8, '#1A1430', '#3DE0FF', 2); rrect(x, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5, null, '#3DE0FF55', 1);
  for (let k = 0; k < 3; k++) { const cx = -14 + k * 14; x.fillStyle = k === 1 ? '#FFE36B' : '#FF8A3D'; x.beginPath(); x.moveTo(cx - 6, -15); x.lineTo(cx + 6, 0); x.lineTo(cx - 6, 15); x.lineTo(cx - 1, 0); x.closePath(); x.fill(); } });
const slowSpr = (key) => aspr(`slow${key}`, 100, 100, (x) => { const [, , f, sp] = (ARMS_TH[key] || ARMS_TH.kitchen).slow; blobPath(x, 42, 42, key.length); x.fillStyle = f; x.fill(); x.strokeStyle = shade(f, 0.62); x.lineWidth = 3; x.stroke();
  let i = key.length * 31; const rnd = () => hash(i++);
  if (key === 'bedroom') { x.strokeStyle = sp; x.lineWidth = 1.4; x.lineCap = 'round'; for (let k = 0; k < 140; k++) { const a = rnd() * 6.28, d = rnd() * 36, px = Math.cos(a) * d, py = Math.sin(a) * d, b = rnd() * 6.28; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(b) * 4, py + Math.sin(b) * 4); x.stroke(); } }
  else for (let k = 0; k < 16; k++) { const a = rnd() * 6.28, d = rnd() * 32; x.fillStyle = sp + (key === 'neon' ? '' : 'aa'); x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, 1.5 + rnd() * 4, 0, 7); x.fill(); }
  x.fillStyle = '#ffffff40'; x.beginPath(); x.ellipse(-12, -14, 14, 6, -0.4, 0, 7); x.fill(); });
const slickSpr = (key) => aspr(`slick${key}`, 44, 44, (x) => { const [, , , f, rim] = (ARMS_TH[key] || ARMS_TH.kitchen).slick; blobPath(x, 17, 15, key.length + 3); x.fillStyle = f; x.fill(); x.strokeStyle = rim; x.lineWidth = 2; x.stroke();
  if (key === 'neon') ['#FF3DF2', '#FFD23F', '#3DE0FF'].forEach((c, q) => { x.strokeStyle = c + '99'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(-2 + q * 2, -1 + q, 10 - q * 2.5, 6 - q * 1.5, 0.4, 0, 7); x.stroke(); });
  else if (key === 'kitchen') { x.fillStyle = '#FFF3A0'; [[0, -6], [5, 4], [-6, 4]].forEach(([a, b], q) => { x.save(); x.translate(a, b); x.rotate(q * 2.1); x.beginPath(); x.ellipse(0, 0, 8, 3, 0, 0, 7); x.fill(); x.restore(); }); x.fillStyle = '#5A3A10'; x.beginPath(); x.arc(0, 0, 2.2, 0, 7); x.fill(); }
  else { x.fillStyle = '#ffffff66'; x.beginPath(); x.ellipse(-5, -5, 6, 2.6, -0.4, 0, 7); x.fill(); } });
const rocketSpr = (col) => aspr(`rocket${col}`, 30, 16, (x) => { x.fillStyle = '#2B2B33'; [[-1, 1], [-1, -1]].forEach(([, s]) => { x.beginPath(); x.moveTo(-10, s * 3); x.lineTo(-15, s * 8); x.lineTo(-6, s * 3); x.fill(); });
  x.fillStyle = col; x.strokeStyle = '#00000088'; x.lineWidth = 1; x.beginPath(); x.ellipse(0, 0, 12, 4.4, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#EE2B3B'; x.beginPath(); x.moveTo(8, -3.6); x.quadraticCurveTo(15, 0, 8, 3.6); x.closePath(); x.fill();
  x.fillStyle = '#A8E4FF'; x.beginPath(); x.arc(2, 0, 1.8, 0, 7); x.fill(); x.fillStyle = '#ffffff70'; x.fillRect(-8, -3, 14, 1.2); });
const mtrapSpr = () => aspr('mtrap', 60, 44, (x) => { rrect(x, -28, -20, 56, 40, 4, '#D9A066', '#8A5A2B', 2); x.strokeStyle = '#B07A3E'; x.lineWidth = 0.8; for (let k = -14; k <= 14; k += 7) { x.beginPath(); x.moveTo(-26, k); x.lineTo(26, k + 1); x.stroke(); }
  x.strokeStyle = '#8A93A3'; x.lineWidth = 2; x.beginPath(); x.rect(-18, -14, 36, 28); x.stroke(); x.fillStyle = '#5A6070'; x.beginPath(); x.arc(-18, 0, 3, 0, 7); x.fill(); });
// the ground layer: pads, patches, slicks, the traps' bases and the crates (labels stand upright)
function drawArmsLow(t, me, Rv, cth) {
  const th = TH(), A = ARMS_TH[th.key] || ARMS_TH.kitchen, vis = (x, y, r = 40) => Math.abs(x - me.x) < Rv + r && Math.abs(y - me.y) < Rv + r;
  g.zones.forEach((z) => { if (!vis(z.x, z.y, z.len)) return;
    if (z.kind === 'boost') { stamp(padSpr(), z.x, z.y, z.a, z.len, z.wid); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 120 + z.s * 50); stamp(padLit(), z.x, z.y, z.a, z.len, z.wid); ctx.globalAlpha = 1; }   // the chevrons pulse (a lit copy faded in and out, no glow to fill)
    else { stamp(slowSpr(th.key), z.x, z.y, z.a, z.len, z.wid); stamp(emojiSpr(A.slow[0]), z.x, z.y, -cth, 19, 19); } });
  g.slicks.forEach((k) => { if (!vis(k.x, k.y)) return; stamp(slickSpr(th.key), k.x, k.y, k.a, k.r * 2.6, k.r * 2.6); if (th.key !== 'kitchen') stamp(emojiSpr(A.slick[0]), k.x + 6, k.y - 4, -cth, 14, 14); });
  g.traps.forEach((tr) => { if (vis(tr.x, tr.y, (tr.reach || 0) + 80)) drawTrapLow(tr, t); });
  g.crates.forEach((b) => { if (b.t > 0 || !vis(b.x, b.y)) return; const e = Math.min(1, b.pop), sc = (0.5 + 0.5 * e * (2 - e)) * (1 + 0.07 * Math.sin(t / 160 + b.lat));
    stamp(crateSpr(!!b.gold), b.x, b.y, -cth + Math.sin(t / 300 + b.lat) * 0.18, 40 * sc, 40 * sc); });
}
function drawTrapLow(tr, t) {
  const L = tr.look, st = trapState(tr), { u, P } = trapClock(tr);
  if (tr.k === 'roller') {   // a groove across the road where it rolls, and the thing itself waiting at the side
    const a = spotOn(tr.s, -g.track.w / 2), b = spotOn(tr.s, g.track.w / 2); ctx.strokeStyle = '#00000030'; ctx.lineWidth = 16; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); return; }
  if (tr.k === 'swing') { ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(tr.px + 3, tr.py + 4, 12, 0, 7); ctx.fill(); return; }
  ctx.save(); ctx.translate(tr.x, tr.y); ctx.rotate(tr.a);
  if (tr.k === 'mousetrap') { ctx.drawImage(mtrapSpr(), -30, -22, 60, 44); const bx = st === 'armed' ? -18 : 18;
    ctx.strokeStyle = '#E3E8EE'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(bx, -16); ctx.lineTo(bx, 16); ctx.stroke(); ctx.strokeStyle = '#6A7180'; ctx.lineWidth = 1; ctx.stroke();
    if (st === 'armed') { ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.moveTo(10, -7); ctx.lineTo(22, 0); ctx.lineTo(10, 7); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#E0A800'; ctx.beginPath(); ctx.arc(14, -1, 1.4, 0, 7); ctx.arc(17, 2, 1.1, 0, 7); ctx.fill(); } }
  else if (tr.k === 'spring') { const up = st === 'up', warn = !up && u > P - 0.45 && !host.reduceMotion, jit = warn ? Math.sin(t / 25) * 1.5 : 0, pop = up ? Math.sin(Math.min(1, u / 0.55) * Math.PI) : 0;
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(3, 4, 19, 0, 7); ctx.fill();
    if (L.water) { ctx.fillStyle = L.lid; ctx.beginPath(); ctx.arc(jit, 0, 10, 0, 7); ctx.fill(); ctx.strokeStyle = '#5A6070'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = L.col; ctx.beginPath(); ctx.arc(jit, 0, 4, 0, 7); ctx.fill();
      if (up) { ctx.strokeStyle = '#7EC8F5cc'; ctx.lineWidth = 3; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(0, 0, 8 + (q * 6 + u * 40) % 18, 0, 7); ctx.stroke(); } ctx.fillStyle = '#CFEFFF'; ctx.beginPath(); ctx.arc(0, 0, 8 + 8 * pop, 0, 7); ctx.fill(); } }
    else { ctx.fillStyle = L.col; ctx.beginPath(); ctx.roundRect(-17 + jit, -17, 34, 34, 4); ctx.fill(); ctx.strokeStyle = '#7A1010'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = L.lid; ctx.fillRect(-3 + jit, -17, 6, 34); ctx.fillRect(-17 + jit, -3, 34, 6);
      if (up) { const r = 9 + 7 * pop; ctx.strokeStyle = '#C0C7D2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, 7); ctx.stroke(); ctx.fillStyle = '#FFE0B8'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#1B1B22'; ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.35, 1.6, 0, 7); ctx.arc(r * 0.25, r * 0.35, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = '#EE2B3B'; ctx.beginPath(); ctx.arc(r * 0.6, 0, 2.2, 0, 7); ctx.fill(); } } }
  else if (tr.k === 'hatch') { const open = st === 'open', e = open ? Math.min(1, u / 0.2, (1.2 - u) / 0.2) : 0, hl = tr.hl, hw = tr.hw;
    if (L.mole) { ctx.fillStyle = '#3B2412'; ctx.beginPath(); ctx.ellipse(0, 0, hl * 0.8, hw * 0.8, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#5A3A1E'; ctx.beginPath(); ctx.ellipse(0, 0, hl * (0.5 + 0.3 * e), hw * (0.5 + 0.3 * e), 0, 0, 7); ctx.fill();
      if (e > 0.3) { ctx.fillStyle = '#7A5230'; ctx.beginPath(); ctx.ellipse(-2, -2, hl * 0.45 * e, hw * 0.45 * e, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4A3428'; ctx.beginPath(); ctx.arc(4, 0, 6 * e, 0, 7); ctx.fill(); ctx.fillStyle = '#FF9EB5'; ctx.beginPath(); ctx.arc(8 * e + 2, 0, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(5, -2.5, 1, 0, 7); ctx.arc(5, 2.5, 1, 0, 7); ctx.fill(); } }
    else { ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.strokeRect(-hl - 2, -hw - 2, hl * 2 + 4, hw * 2 + 4); ctx.setLineDash([]);
      ctx.fillStyle = '#0B0A12'; ctx.fillRect(-hl, -hw, hl * 2, hw * 2);
      const off = e * hl * 1.6; ctx.fillStyle = L.col; ctx.fillRect(-hl + off, -hw, hl * 2, hw * 2); ctx.strokeStyle = '#00000060'; ctx.lineWidth = 1.5; ctx.strokeRect(-hl + off, -hw, hl * 2, hw * 2);
      if (L.manhole) { ctx.strokeStyle = '#5A5470'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-hl + off + 4, k * 8); ctx.lineTo(hl + off - 4, k * 8); ctx.stroke(); } }
      else { ctx.fillStyle = '#2B2F3A'; ctx.fillRect(-hl + off + hl - 9, -2, 18, 4); } } }
  ctx.restore();
}
// the upper layer: rollers, swinging arms, rockets and their trails, rings, bolts, clouds, the magnet's pull and the draft
function drawArmsHigh(t, me, Rv, cth) {
  const vis = (x, y, r = 40) => Math.abs(x - me.x) < Rv + r && Math.abs(y - me.y) < Rv + r, upX = -Math.sin(cth), upY = -Math.cos(cth), A = ARMS_TH[TH().key] || ARMS_TH.kitchen;
  g.traps.forEach((tr) => { if (!vis(tr.x, tr.y, (tr.reach || 0) + 80)) return; const L = tr.look;
    if (tr.k === 'roller') { const rl = rollerLat(tr), q = spotOn(tr.s, rl.lat), r = 13, spinA = rl.lat / r;
      ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(q.x + 3, q.y + 4, r, 0, 7); ctx.fill();
      ctx.fillStyle = L.col; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7); ctx.fill(); ctx.strokeStyle = L.rim; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(spinA);
      if (L.dimple) { ctx.fillStyle = '#C9600A88'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(Math.cos(k) * 7, Math.sin(k * 1.7) * 7, 1, 0, 7); ctx.fill(); } ctx.fillStyle = '#3E8A28'; ctx.beginPath(); ctx.ellipse(0, -9, 4, 2, 0.4, 0, 7); ctx.fill(); }
      else if (L.glass) { ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 7, 0.5, 2.6); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 7, 3.6, 5.6); ctx.stroke(); }
      else { ctx.fillStyle = '#D6E9F7'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.3) * 6, Math.sin(k * 1.9) * 6, 2.2, 0, 7); ctx.fill(); } }
      ctx.restore(); ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.arc(q.x - 4, q.y - 4, 3, 0, 7); ctx.fill(); }
    else if (tr.k === 'swing') { const tp = swingTip(tr), ax = tp.x - tr.px, ay = tp.y - tr.py, an = Math.atan2(ay, ax);
      ctx.lineCap = 'round'; ctx.strokeStyle = '#00000038'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(tr.px + 4, tr.py + 5); ctx.lineTo(tp.x + 4, tp.y + 5); ctx.stroke();
      if (L.gate) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(tr.px, tr.py); ctx.lineTo(tp.x, tp.y); ctx.stroke(); ctx.strokeStyle = L.head; ctx.setLineDash([9, 9]); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = L.head + '40'; ctx.lineWidth = 14; ctx.stroke(); }
      else { ctx.strokeStyle = L.fan ? '#6A7180' : '#C0C7D2'; ctx.lineWidth = L.bauble ? 2 : 5; ctx.beginPath(); ctx.moveTo(tr.px, tr.py); ctx.lineTo(tp.x, tp.y); ctx.stroke(); }
      ctx.save(); ctx.translate(tp.x, tp.y); ctx.rotate(an);
      if (L.fan) { ctx.fillStyle = L.head; ctx.strokeStyle = '#4A5160'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(-14, 0, 16, 7, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      else if (L.bauble) { ctx.fillStyle = L.col; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill(); ctx.strokeStyle = L.head; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke(); ctx.fillStyle = L.head; ctx.fillRect(-14, -3, 4, 6); ctx.fillStyle = '#ffffff99'; ctx.beginPath(); ctx.arc(-3, -4, 3, 0, 7); ctx.fill(); }
      else if (!L.gate) { ctx.fillStyle = '#C9D1DC'; ctx.beginPath(); ctx.ellipse(-4, 0, 9, 6, 0, 0, 7); ctx.fill(); }
      ctx.restore(); ctx.lineCap = 'butt';
      ctx.fillStyle = L.col; ctx.beginPath(); ctx.arc(tr.px, tr.py, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#00000070'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = L.head || '#FFFFFF'; ctx.beginPath(); ctx.arc(tr.px, tr.py, 3.5, 0, 7); ctx.fill(); } });
  // 🚀 rockets: a smoke trail (one stroke), a glow, the sprite
  g.proj.forEach((p) => { if (!vis(p.x, p.y, 60)) return;
    if (p.tr.length > 3) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(p.tr[0], p.tr[1]); for (let i = 2; i < p.tr.length; i += 2) ctx.lineTo(p.tr[i], p.tr[i + 1]); ctx.strokeStyle = '#FFFFFF66'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = p.gold ? '#FFD23F' : '#FFB347'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineCap = 'butt'; }
    stamp(glowS(p.gold ? '#FFD23F' : '#FF8A3D'), p.x - Math.cos(p.a) * 12, p.y - Math.sin(p.a) * 12, 0, 30, 30); stamp(rocketSpr(p.gold ? '#FFD23F' : A.rcol), p.x, p.y, p.a, 30, 16); });
  g.waves.forEach((w) => { const e = 1 - w.life / w.max; ctx.globalAlpha = Math.max(0, 1 - e); ctx.strokeStyle = w.col; ctx.lineWidth = (w.w || 3) * (1 - e) + 1; ctx.beginPath(); ctx.arc(w.x, w.y, w.r + (w.R - w.r) * (1 - (1 - e) * (1 - e)), 0, 7); ctx.stroke(); }); ctx.globalAlpha = 1;
  // 🌩️ a stormcloud over a slowed car, its bolt when it lands
  allCars().forEach((c) => { if (!(c.zapT > 0) || !vis(c.x, c.y)) return; const cx = c.x + upX * 26, cy = c.y + upY * 26;
    ctx.fillStyle = '#4B5260'; [[-8, 2, 8], [0, -2, 10], [9, 2, 7]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx - upY * dx + upX * dy, cy + upX * dx + upY * dy, r, 0, 7); ctx.fill(); });
    ctx.strokeStyle = '#7EC8F5aa'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 4; k++) { const ph = ((t / 300 + k * 0.27) % 1) * 18, ox = -upY * (k * 5 - 7), oy = upX * (k * 5 - 7); ctx.moveTo(cx + ox - upX * (6 + ph), cy + oy - upY * (6 + ph)); ctx.lineTo(cx + ox - upX * (10 + ph), cy + oy - upY * (10 + ph)); } ctx.stroke(); });
  g.bolts.forEach((b) => { const c = b.c; ctx.globalAlpha = Math.min(1, b.life * 3); ctx.strokeStyle = '#FFF6A8'; ctx.lineWidth = 3; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(c.x, c.y); b.j.forEach((j, i) => { const d = (i + 1) * 14; ctx.lineTo(c.x + upX * d - upY * j * 14, c.y + upY * d + upX * j * 14); }); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.stroke(); }); ctx.globalAlpha = 1;
  if (me.magT > 0 && alive(me.magTo)) { ctx.strokeStyle = '#FF5DA2'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t / 20; ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(me.magTo.x, me.magTo.y); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; }
  if (me.slipT > 0 || me.draftT > 0.3) { const ca = Math.cos(me.a), sa = Math.sin(me.a), al = me.slipT > 0 ? 0.7 : 0.35; ctx.strokeStyle = '#FFFFFF'; ctx.lineCap = 'round'; ctx.lineWidth = 1.5; ctx.globalAlpha = al;
    ctx.beginPath(); for (let k = 0; k < 4; k++) { const o = (k < 2 ? -1 : 1) * (16 + (k % 2) * 7), ph = ((t / 90 + k * 0.37) % 1) * 30; const x0 = me.x - sa * o + ca * (14 - ph), y0 = me.y + ca * o + sa * (14 - ph); ctx.moveTo(x0, y0); ctx.lineTo(x0 - ca * 18, y0 - sa * 18); } ctx.stroke(); ctx.globalAlpha = 1; ctx.lineCap = 'butt'; }
}

// ---------------------------------------------------------------- 🎨 places and vehicles
// Every course is a new place (THEMES, by course, cycling) and a new ride (VEHICLES, by course, cycling): only the
// look changes, the road, hazards and physics are the same. Each place names its table top, floor, tape, kerbs, the
// four guards' skins (the guard keys rail/books/bricks/crayons stay, so the bounce and the debug counts don't move),
// the puddle (milk's ice), the box (a wall), the ramp (the toaster), the bump (the soldier), the pocket, the small
// things scattered on the table (decor), the dust the cars kick up and the light over it all (air). Textures are
// tiles painted once per place into offscreen canvases (RES px a unit) and used as patterns, so a frame paints no
// gradients per object.
const THEMES = [
  { key: 'kitchen', icon: '🍳', name: 'THE KITCHEN TABLE', say: 'masking tape, milk and toast',
    surf: 'planks', floor: 'tiles', tape: 'masking', side: '#6E3512', edge: ['#5E2E10', '#E9A060'],
    kerb: ['#EE2B3B', '#FFFFFF'], kerbEdge: '#6A1210', tapeEdge: '#E2C47E', centre: '#E0A93A', sheen: '#ffffff30',
    puddle: { fill: '#FFFFFF', rim: '#BFE3FF', shine: '#E4F3FF', label: '🥛' }, box: 'cereal', ramp: 'toaster', bump: 'soldier', bumpTxt: '🪖 BONK',
    hole: ['#FFD23F', '#111111', '#2A1A10'], decor: ['crumb', 'crumb', 'sugar', 'pea'], dust: ['#E8D3A0', '#F6E7C1'], air: 'sun',
    guards: { rail: { k: 'rail', col: '#FFFFFF', post: '#F4F1EA', postRim: '#9A8F7A' }, books: { k: 'band', h: 13, cols: ['#EE2B3B', '#2D7FF9', '#FFD23F', '#22C55E', '#A855F7', '#FF8A3D'], spine: true },
      bricks: { k: 'band', h: 11, pair: true, cols: ['#EE2B3B', '#FFD23F', '#2D7FF9', '#22C55E'], studs: true }, crayons: { k: 'sticks', cols: ['#EE2B3B', '#FF8A3D', '#FFD23F', '#22C55E', '#2D7FF9', '#A855F7', '#FF5DA2'] } } },
  { key: 'bedroom', icon: '🛏️', name: 'THE BEDROOM FLOOR', say: 'a fluffy rug, toy blocks and a juice spill',
    surf: 'rug', floor: 'boards', tape: 'asphalt', side: '#2E2A6E', edge: ['#24205A', '#A9B3FF'],
    kerb: ['#FFD23F', '#1E1E28'], kerbEdge: '#111118', tapeEdge: '#8A93A6', centre: '#FFFFFF', sheen: '#ffffff12',
    puddle: { fill: '#FFB347', rim: '#E07B00', shine: '#FFD9A0', label: '🧃' }, box: 'block', ramp: 'wedge', rampCol: ['#D9A066', '#B07A3E', '#FFF1D6'], bump: 'teddy', bumpTxt: '🧸 BOING',
    hole: ['#FF5DA2', '#2A1030', '#1A0B1E'], decor: ['lego', 'lego', 'marble', 'star'], dust: ['#C9CFFF', '#FFFFFF'], air: 'lamp',
    guards: { rail: { k: 'rail', col: '#FFD23F', post: '#2D7FF9', postRim: '#163F8A' }, books: { k: 'band', h: 13, cols: ['#FF7AB6', '#7CD7FF', '#B9F18C', '#FFE07A', '#C9A6FF'], spine: true },
      bricks: { k: 'band', h: 11, pair: true, cols: ['#EE2B3B', '#2D7FF9', '#FFD23F', '#22C55E', '#FF8A3D'], studs: true }, crayons: { k: 'sticks', cols: ['#EE2B3B', '#2D7FF9', '#22C55E', '#A855F7', '#FF8A3D'] } } },
  { key: 'garden', icon: '🌼', name: 'THE GARDEN PATH', say: 'gravel, gnomes and rain puddles',
    surf: 'grass', floor: 'pond', tape: 'gravel', side: '#2F5E1E', edge: ['#28511A', '#A8E07A'],
    kerb: ['#9AA0A8', '#E8E4DA'], kerbEdge: '#4F5258', tapeEdge: '#C9A86A', centre: '#B8935A', sheen: '#ffffff18',
    puddle: { fill: '#7EC8F5', rim: '#3E8FD0', shine: '#CFEFFF', label: '💧' }, box: 'pot', ramp: 'wedge', rampCol: ['#A9743F', '#7A4E25', '#D9B07A'], bump: 'gnome', bumpTxt: '🍄 GNOMED',
    hole: ['#7A4E25', '#3B2412', '#1E1208'], decor: ['flower', 'flower', 'leaf', 'ladybird'], dust: ['#D9BE85', '#B89660'], air: 'leaves',
    guards: { rail: { k: 'rail', col: '#F7F3E8', post: '#F7F3E8', postRim: '#9A9384', pickets: true }, books: { k: 'blobs', h: 14, base: '#2E6B1E', cols: ['#3E8A28', '#4FA33A', '#2F7A22'] },
      bricks: { k: 'blobs', h: 11, cols: ['#A7A9AE', '#C9C6BE', '#8C8F96', '#D8D2C4'] }, crayons: { k: 'blobs', h: 13, base: '#3E7A26', cols: ['#FF5DA2', '#FFD23F', '#FFFFFF', '#FF8A3D'], petals: true } } },
  { key: 'desk', icon: '📏', name: 'THE OFFICE DESK', say: 'graph paper, pencils and a coffee spill',
    surf: 'mat', floor: 'carpet', tape: 'paper', side: '#123F35', edge: ['#0E3329', '#7FE0C4'],
    kerb: ['#2D7FF9', '#FFFFFF'], kerbEdge: '#0F2F66', tapeEdge: '#B8C6DA', centre: '#EE2B3B', sheen: '',
    puddle: { fill: '#6B3E1F', rim: '#3B1E0B', shine: '#A0663A', label: '☕' }, box: 'notes', ramp: 'wedge', rampCol: ['#F7D046', '#C79A12', '#FFF3B0'], rampTicks: true, bump: 'duck', bumpTxt: '🦆 QUACK',
    hole: ['#9AA3B2', '#2B2F3A', '#11141B'], decor: ['clip', 'pin', 'ring', 'clip'], dust: ['#FFB3C8', '#F2F2F2'], air: 'desklamp',
    guards: { rail: { k: 'band', h: 12, cols: ['#F7D046'], ticks: true }, books: { k: 'band', h: 13, cols: ['#1F3A93', '#7A1F2B', '#2B2B33', '#145C4A'], spine: true },
      bricks: { k: 'band', h: 11, cols: ['#FFE45C', '#FF9EC4', '#8FD8FF', '#B9F18C'], notes: true }, crayons: { k: 'sticks', cols: ['#F7C531'], tip: '#F2C99A', cap: '#FF8FB1' } } },
  { key: 'snow', icon: '❄️', name: 'THE SNOWY SILL', say: 'snow, ice and candy canes',
    surf: 'frost', floor: 'night', tape: 'snowpack', side: '#9FB4CC', edge: ['#7E93AE', '#FFFFFF'],
    kerb: ['#E8283C', '#FFFFFF'], kerbEdge: '#8A1020', tapeEdge: '#A9D3EE', centre: '#7FC6F0', sheen: '#ffffff40',
    puddle: { fill: '#CFF3FF', rim: '#7FD0F0', shine: '#FFFFFF', label: '🧊' }, box: 'gift', ramp: 'wedge', rampCol: ['#FFFFFF', '#BFD9EE', '#FFFFFF'], drift: true, bump: 'snowman', bumpTxt: '⛄ POOF',
    hole: ['#7FD0F0', '#1E4A6E', '#0B2238'], decor: ['flake', 'flake', 'twig', 'berry'], dust: ['#FFFFFF', '#DDF2FF'], air: 'snow',
    guards: { rail: { k: 'rail', col: '#FFFFFF', stripe: '#E8283C', post: '#FFFFFF', postRim: '#C21A2E', candy: true }, books: { k: 'band', h: 13, cols: ['#E8283C', '#1F8A4C', '#2D7FF9', '#FFD23F'], ribbon: '#FFFFFF' },
      bricks: { k: 'band', h: 11, cols: ['#CFEAFB', '#E6F5FF', '#B5DCF5'], ice: true }, crayons: { k: 'sticks', cols: ['#E6F7FF', '#CFEFFF'], tip: '#FFFFFF', icicle: true } } },
  { key: 'neon', icon: '🌃', name: 'NEON CITY', say: 'night lights and oil slicks',
    surf: 'neoncarpet', floor: 'city', tape: 'neonroad', side: '#2A0F4A', edge: ['#1A0830', '#FF3DF2'],
    kerb: ['#FF3DF2', '#3DE0FF'], kerbEdge: '#0A0414', tapeEdge: '#5A4FA0', centre: '#3DE0FF', sheen: '', glow: true,
    puddle: { fill: '#16101F', rim: '#7A5CFF', shine: '#2B2240', label: '🛢️', oil: true }, box: 'crate', ramp: 'wedge', rampCol: ['#2A1250', '#12062A', '#FF3DF2'], neonRamp: true, bump: 'robot', bumpTxt: '🤖 BZZT',
    hole: ['#3DE0FF', '#0A0414', '#05020A'], decor: ['glow', 'glow', 'nring', 'glow'], dust: ['#FF3DF2', '#3DE0FF', '#B6FF7A'], air: 'neon',
    guards: { rail: { k: 'rail', col: '#FF3DF2', glow: true }, books: { k: 'rail', col: '#3DE0FF', glow: true }, bricks: { k: 'rail', col: '#B6FF7A', glow: true }, crayons: { k: 'rail', col: '#FFD23F', glow: true } } },
];
// 🚗 the rides: seat = where Fig sits (along the car), rear = the tail (nitro flame, exhaust), puff = exhaust smoke
const VEHICLES = [
  { key: 'car', icon: '🏎️', name: 'toy race car', seat: -2, rear: -13, puff: true },
  { key: 'monster', icon: '🛻', name: 'monster truck', seat: -1, rear: -13, puff: true },
  { key: 'tractor', icon: '🚜', name: 'tractor', seat: -6, rear: -14, stack: [4, -4] },
  { key: 'kart', icon: '🏁', name: 'go-kart', seat: -3, rear: -13, puff: true },
  { key: 'hover', icon: '💨', name: 'hovercraft', seat: 1, rear: -15, spray: true },
  { key: 'f1', icon: '🏎️', name: 'F1 racer', seat: -3, rear: -15, puff: true },
  { key: 'ufo', icon: '🛸', name: 'flying saucer', seat: 0, rear: -12, beam: true },
];
const TH = () => THEMES[(Math.max(1, g?.course || 1) - 1) % THEMES.length];
const VH = () => VEHICLES[(Math.max(1, g?.course || 1) - 1) % VEHICLES.length];

// ---- textures: a tile painted once, used as a repeating pattern in table units
const RES = 4, PAT = new Map();
function pattern(key, T, paint) {
  let p = PAT.get(key); if (p) return p;
  const c = document.createElement('canvas'); c.width = c.height = Math.round(T * RES); const x = c.getContext('2d'); x.scale(RES, RES);
  let i = key.length * 1013; const rnd = () => hash(i++);
  const wrap = (px, py, r, fn) => { for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) { if (dx && (dx < 0 ? px < T - r : px > r)) continue; if (dy && (dy < 0 ? py < T - r : py > r)) continue; fn(px + dx, py + dy); } };
  const speck = (n, cols, r0, r1, sq) => { for (let k = 0; k < n; k++) { const px = rnd() * T, py = rnd() * T, r = r0 + rnd() * (r1 - r0); x.fillStyle = cols[k % cols.length]; if (sq) x.fillRect(px, py, r, r); else { x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } } };
  paint(x, T, rnd, wrap, speck);
  p = ctx.createPattern(c, 'repeat'); p.setTransform?.(new DOMMatrix().scaleSelf(1 / RES, 1 / RES)); PAT.set(key, p); return p;
}
const grid = (x, T, step, col, lw) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); for (let v = 0; v <= T; v += step) { x.moveTo(v, 0); x.lineTo(v, T); x.moveTo(0, v); x.lineTo(T, v); } x.stroke(); };
const TILES = {
  // the table tops
  planks: [120, (x, T, rnd, wrap) => {
    for (let row = 0; row < 2; row++) { const y = row * 60; x.fillStyle = row ? '#C0702F' : '#B4662A'; x.fillRect(0, y, T, 60);
      for (let i = 0; i < 8; i++) { const y0 = y + 5 + rnd() * 50, ph = rnd() * 6.28, cyc = 1 + Math.floor(rnd() * 3); x.strokeStyle = i % 3 ? '#ffffff14' : '#5A2A0C30'; x.lineWidth = 0.6 + rnd() * 0.8; x.beginPath(); for (let u = 0; u <= T; u += 4) x[u ? 'lineTo' : 'moveTo'](u, y0 + Math.sin(u / T * 6.283 * cyc + ph) * 1.6); x.stroke(); }
      const jx = rnd() * T; x.fillStyle = '#7A3E18'; x.fillRect(jx, y, 1.4, 60); x.fillRect(0, y, T, 1.6); x.fillStyle = '#ffffff22'; x.fillRect(0, y + 1.6, T, 0.8);
      const kx = rnd() * T, ky = y + 15 + rnd() * 30; wrap(kx, ky, 6, (a, b) => { x.fillStyle = '#7A3E1866'; x.beginPath(); x.ellipse(a, b, 5, 2.4, 0, 0, 7); x.fill(); x.strokeStyle = '#5A2A0C40'; x.lineWidth = 0.6; x.beginPath(); x.ellipse(a, b, 7.5, 3.6, 0, 0, 7); x.stroke(); }); }
    x.fillStyle = '#ffffff0b'; for (let y = 0; y < T; y += 60) for (let u = 0; u < T; u += 60) { x.fillRect(u + 20, y + 20, 20, 20); for (let i = 0; i < 9; i++) if (i !== 4) x.fillRect(u + (i % 3) * 20 + 7, y + Math.floor(i / 3) * 20 + 7, 6, 6); }   // the Sierpiński tablecloth, faint
  }],
  rug: [96, (x, T, rnd, wrap, speck) => {
    x.fillStyle = '#4C5BC0'; x.fillRect(0, 0, T, T); speck(1400, ['#5F6ED2', '#3E4CAA', '#6F7DDD', '#4553B6'], 0.3, 0.9);
    x.strokeStyle = '#FFD23F66'; x.lineWidth = 2; for (let cx = 0; cx <= T; cx += 48) for (let cy = 0; cy <= T; cy += 48) { x.beginPath(); x.moveTo(cx, cy - 18); x.lineTo(cx + 18, cy); x.lineTo(cx, cy + 18); x.lineTo(cx - 18, cy); x.closePath(); x.stroke(); }
    x.fillStyle = '#FF7AB6aa'; for (let cx = 24; cx < T; cx += 48) for (let cy = 24; cy < T; cy += 48) { x.beginPath(); x.arc(cx, cy, 3, 0, 7); x.fill(); }
    speck(260, ['#ffffff18', '#00000018'], 0.4, 1.2);
  }],
  grass: [96, (x, T, rnd, wrap) => {
    x.fillStyle = '#56A638'; x.fillRect(0, 0, T, T);
    for (let i = 0; i < 9; i++) { const px = rnd() * T, py = rnd() * T, r = 10 + rnd() * 16; wrap(px, py, r, (a, b) => { x.fillStyle = i % 2 ? '#62B444' : '#4C9832'; x.globalAlpha = 0.6; x.beginPath(); x.ellipse(a, b, r, r * 0.7, 0, 0, 7); x.fill(); x.globalAlpha = 1; }); }
    x.lineCap = 'round'; for (let i = 0; i < 900; i++) { const px = rnd() * T, py = rnd() * T, a = -1.57 + (rnd() - 0.5) * 1.2, l = 1.8 + rnd() * 2.6; x.strokeStyle = ['#3E8A28', '#77C653', '#4C9A31', '#8AD866'][i % 4]; x.lineWidth = 0.7; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    for (let i = 0; i < 6; i++) { const px = rnd() * T, py = rnd() * T; wrap(px, py, 3, (a, b) => { x.fillStyle = '#FFFFFFdd'; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(a + Math.cos(k * 1.257) * 1.2, b + Math.sin(k * 1.257) * 1.2, 0.9, 0, 7); x.fill(); } x.fillStyle = '#FFD23F'; x.beginPath(); x.arc(a, b, 0.7, 0, 7); x.fill(); }); }
  }],
  mat: [96, (x, T, rnd, wrap, speck) => {
    x.fillStyle = '#1D7A64'; x.fillRect(0, 0, T, T); speck(500, ['#ffffff08', '#00000010'], 0.4, 1.4);
    grid(x, T, 8, '#ffffff1a', 0.5); grid(x, T, 48, '#ffffff3c', 1);
    x.fillStyle = '#ffffff40'; for (let v = 0; v < T; v += 48) { x.font = '4px system-ui'; x.fillText(String((v / 8) | 0), v + 1.5, 5.5); }
  }],
  frost: [96, (x, T, rnd, wrap, speck) => {
    x.fillStyle = '#E8F1F9'; x.fillRect(0, 0, T, T);
    for (let y = 0; y < T; y += 48) { x.fillStyle = '#C6D5E6'; x.fillRect(0, y, T, 1.4); x.fillStyle = '#ffffff'; x.fillRect(0, y + 1.4, T, 0.8); }
    for (let i = 0; i < 10; i++) { const px = rnd() * T, py = rnd() * T, r = 6 + rnd() * 12; wrap(px, py, r, (a, b) => { x.fillStyle = '#FFFFFF'; x.globalAlpha = 0.7; x.beginPath(); x.ellipse(a, b, r, r * 0.6, rnd() * 3, 0, 7); x.fill(); x.globalAlpha = 1; }); }
    speck(400, ['#D3E3F2', '#FFFFFF', '#BFD6EC'], 0.3, 1); speck(40, ['#9FD8FF'], 0.6, 1.1);
  }],
  neoncarpet: [96, (x, T, rnd, wrap, speck) => {
    x.fillStyle = '#170E2E'; x.fillRect(0, 0, T, T); speck(900, ['#22163F', '#100A22', '#2A1C4C'], 0.3, 1);
    x.strokeStyle = '#FF3DF22a'; x.lineWidth = 3; x.beginPath(); for (let v = 0; v <= T; v += 48) { x.moveTo(v, 0); x.lineTo(v, T); } x.stroke(); x.strokeStyle = '#FF3DF280'; x.lineWidth = 0.8; x.stroke();
    x.strokeStyle = '#3DE0FF2a'; x.lineWidth = 3; x.beginPath(); for (let v = 0; v <= T; v += 48) { x.moveTo(0, v); x.lineTo(T, v); } x.stroke(); x.strokeStyle = '#3DE0FF80'; x.lineWidth = 0.8; x.stroke();
    for (let cx = 0; cx <= T; cx += 48) for (let cy = 0; cy <= T; cy += 48) { x.fillStyle = '#FFFFFF55'; x.beginPath(); x.arc(cx, cy, 3, 0, 7); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(cx, cy, 1.2, 0, 7); x.fill(); }
  }],
  // the floors, a long way down
  tiles: [160, (x, T) => { for (let y = 0; y < T; y += 80) for (let u = 0; u < T; u += 80) { x.fillStyle = ((u + y) / 80) % 2 ? '#251A33' : '#1C1226'; x.fillRect(u, y, 80, 80); } grid(x, T, 80, '#0E0914', 2); }],
  boards: [160, (x, T, rnd) => { for (let y = 0; y < T; y += 32) { x.fillStyle = (y / 32) % 2 ? '#33200F' : '#2B1A0C'; x.fillRect(0, y, T, 32); x.fillStyle = '#140B05'; x.fillRect(0, y, T, 2); x.fillRect(rnd() * T, y, 2, 32); x.fillStyle = '#ffffff08'; for (let i = 0; i < 3; i++) x.fillRect(0, y + 6 + rnd() * 22, T, 1); } }],
  pond: [160, (x, T, rnd, wrap) => { x.fillStyle = '#0E3644'; x.fillRect(0, 0, T, T); x.strokeStyle = '#ffffff16'; x.lineWidth = 1.2; for (let i = 0; i < 10; i++) { const px = rnd() * T, py = rnd() * T, r = 6 + rnd() * 20; wrap(px, py, r, (a, b) => { x.beginPath(); x.ellipse(a, b, r, r * 0.5, 0, 0, 7); x.stroke(); }); }
    for (let i = 0; i < 4; i++) { const px = rnd() * T, py = rnd() * T; wrap(px, py, 14, (a, b) => { x.fillStyle = '#2E7A3A'; x.beginPath(); x.moveTo(a, b); x.arc(a, b, 12, 0.4, 6.0); x.closePath(); x.fill(); x.fillStyle = '#3E9A4A'; x.beginPath(); x.arc(a - 2, b - 2, 6, 0, 7); x.fill(); }); } }],
  carpet: [160, (x, T, rnd, wrap, speck) => { x.fillStyle = '#272D3C'; x.fillRect(0, 0, T, T); speck(2200, ['#2F3648', '#20253262', '#353D52'], 0.4, 1.3); grid(x, T, 80, '#00000040', 1.5); }],
  night: [160, (x, T, rnd, wrap, speck) => { x.fillStyle = '#0B1530'; x.fillRect(0, 0, T, T); speck(90, ['#ffffff55', '#9FD8FF55'], 0.6, 1.8); speck(30, ['#ffffffcc'], 0.4, 0.8); }],
  city: [160, (x, T, rnd) => { x.fillStyle = '#06050D'; x.fillRect(0, 0, T, T); for (let by = 6; by < T; by += 40) for (let bx = 6; bx < T; bx += 40) { x.fillStyle = '#100C1E'; x.fillRect(bx, by, 30, 30); for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 4; wx++) if (rnd() < 0.45) { x.fillStyle = ['#FFD86B66', '#3DE0FF55', '#FF3DF255'][Math.floor(rnd() * 3)]; x.fillRect(bx + 3 + wx * 7, by + 3 + wy * 7, 4, 4); } } }],
  // the roads
  masking: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#F9E6A8'; x.fillRect(0, 0, T, T); speck(160, ['#F2DC9A', '#FCEDBE'], 0.3, 0.7); x.strokeStyle = '#D9BD7A55'; x.lineWidth = 0.4; for (let i = 0; i < 26; i++) { const px = rnd() * T, py = rnd() * T, a = rnd() * 3; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 9, py + Math.sin(a) * 9); x.stroke(); } }],
  asphalt: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#596071'; x.fillRect(0, 0, T, T); speck(900, ['#6A7184', '#4B5162', '#7C8396', '#525868'], 0.3, 1); }],
  gravel: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#E2C690'; x.fillRect(0, 0, T, T); speck(300, ['#D3B57A', '#EED7A6'], 0.3, 0.9); for (let i = 0; i < 70; i++) { const px = rnd() * T, py = rnd() * T, r = 0.8 + rnd() * 1.6, c = ['#C9A86A', '#F4E2BC', '#B39058', '#A9A39A'][i % 4]; wrap(px, py, r + 1, (a, b) => { x.fillStyle = '#00000022'; x.beginPath(); x.ellipse(a + 0.4, b + 0.5, r, r * 0.75, 0, 0, 7); x.fill(); x.fillStyle = c; x.beginPath(); x.ellipse(a, b, r, r * 0.75, 0, 0, 7); x.fill(); }); } }],
  paper: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#FFFDF4'; x.fillRect(0, 0, T, T); speck(200, ['#F1EEE2'], 0.3, 1); grid(x, T, 8, '#8DB7EA44', 0.5); grid(x, T, 32, '#8DB7EA88', 0.7); }],
  snowpack: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#E2F2FD'; x.fillRect(0, 0, T, T); speck(500, ['#FFFFFF', '#C7E2F5', '#D6ECFA'], 0.3, 1.3); speck(25, ['#FFFFFF'], 0.4, 0.7); for (let i = 0; i < 5; i++) { const px = rnd() * T, py = rnd() * T; x.strokeStyle = '#B9DCF2'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 6, py + 2); x.stroke(); } }],
  neonroad: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#221F38'; x.fillRect(0, 0, T, T); speck(700, ['#2D2A48', '#1A1830', '#34305A'], 0.3, 1); speck(14, ['#3DE0FF88', '#FF3DF288'], 0.3, 0.6); }],
};
const tex = (name) => { const [T, paint] = TILES[name]; return pattern(name, T, paint); };

// ---- 🗺️ each place's four sections, in race order: a name for the banner, a road shape (KINDS), the ground under the
// road (a patch of tile laid along it), the road's own surface and kerbs, the set pieces beside it (PIECES), and an island
// (fork), a gap under a bridge, or a roof and its darkness (tunnel). col is the section's colour on the track map.
const SECS = {
  kitchen: [
    { icon: '🍽️', name: 'THE PLACEMAT', kind: 'sprint', ground: 'weave', pieces: ['plate', 'cup'], col: '#F5C542' },
    { icon: '🔪', name: 'THE CHOPPING BOARD', kind: 'weave', ground: 'board', road: 'board', kerb: ['#7BC043', '#FFFFFF'], kerbEdge: '#2F5E1E', tapeEdge: '#B8915A', centre: '#C0392B', pieces: ['carrot', 'tomato'], col: '#7BC043' },
    { icon: '🚰', name: 'OVER THE SINK', kind: 'bridge', gap: { tile: 'sinkwater', rim: ['#D9DEE6', '#7A8394'] }, road: 'deck', col: '#7CC8F5' },
    { icon: '🍎', name: 'THE FRUIT BOWL', kind: 'fork', ground: 'gingham', island: 'fruitbowl', pieces: ['cup', 'plate'], col: '#EE2B3B' }],
  bedroom: [
    { icon: '🧶', name: 'THE RUG', kind: 'sweep', pieces: ['block', 'teddy'], col: '#C9A6FF' },
    { icon: '🧱', name: 'LEGO CITY', kind: 'weave', ground: 'baseplate', road: 'legoroad', kerb: ['#FFD23F', '#EE2B3B'], kerbEdge: '#6A1210', tapeEdge: '#5E646E', centre: '#FFFFFF', pieces: ['lego', 'tower'], col: '#22C55E' },
    { icon: '🛏️', name: 'UNDER THE BED', kind: 'tunnel', ground: 'dustboards', road: 'dusty', roof: 'bed', dim: 0.6, pieces: ['sock', 'bunny'], col: '#7A5BD0' },
    { icon: '🧸', name: 'THE TOY BOX', kind: 'fork', ground: 'foam', island: 'toybox', pieces: ['block', 'lego'], col: '#FF8A3D' }],
  garden: [
    { icon: '🪨', name: 'THE STEPPING STONES', kind: 'sprint', ground: 'flagstone', pieces: ['pebbles', 'pot'], col: '#B9B5AA' },
    { icon: '🌷', name: 'THE FLOWER BEDS', kind: 'weave', ground: 'bark', pieces: ['tulip', 'pot'], col: '#FF5DA2' },
    { icon: '🌉', name: 'OVER THE POND', kind: 'bridge', gap: { tile: 'pond', rim: ['#7A8F5A', '#3E5A2A'] }, road: 'deck', col: '#3E8FD0' },
    { icon: '🍄', name: 'GNOME VILLAGE', kind: 'sweep', ground: 'moss', road: 'cobble', kerb: ['#E8E4DA', '#9AA0A8'], centre: null, pieces: ['mushroom', 'gnome'], col: '#E8283C' }],
  desk: [
    { icon: '📄', name: 'THE PAPERWORK', kind: 'sweep', ground: 'lined', pieces: ['stapler', 'eraser'], col: '#8DB7EA' },
    { icon: '✏️', name: 'PENCIL ALLEY', kind: 'weave', ground: 'cork', road: 'cork', kerb: ['#F7C531', '#2B2B33'], kerbEdge: '#111118', tapeEdge: '#8A6232', centre: '#FFFFFF', pieces: ['pencilcup', 'eraser'], col: '#F7C531' },
    { icon: '💻', name: 'UNDER THE LAPTOP', kind: 'tunnel', ground: 'darkmat', road: 'darkmat', kerb: ['#3DE0FF', '#1B1F28'], kerbEdge: '#05070C', tapeEdge: '#3A4150', centre: '#3DE0FF', roof: 'laptop', dim: 0.45, col: '#9AA3B2' },
    { icon: '☕', name: 'THE MUG', kind: 'fork', ground: 'lined', island: 'mug', pieces: ['pencilcup', 'stapler'], col: '#A0663A' }],
  snow: [
    { icon: '🌨️', name: 'THE FROSTY SILL', kind: 'sweep', pieces: ['snowman', 'pine'], col: '#CFEAFB' },
    { icon: '🎄', name: 'THE PINE FOREST', kind: 'weave', ground: 'deepsnow', pieces: ['pine', 'pine'], col: '#1F8A4C' },
    { icon: '🧊', name: 'THE ICE BRIDGE', kind: 'bridge', gap: { tile: 'night', rim: ['#FFFFFF', '#7E93AE'] }, road: 'iceblocks', col: '#7FD0F0' },
    { icon: '🔮', name: 'THE SNOW GLOBE', kind: 'fork', ground: 'icerink', road: 'icerink', kerb: ['#A855F7', '#FFFFFF'], kerbEdge: '#4A1A7A', centre: '#A855F7', island: 'snowglobe', pieces: ['pine', 'snowman'], col: '#A855F7' }],
  neon: [
    { icon: '🛣️', name: 'THE BOULEVARD', kind: 'sprint', pieces: ['sign', 'building'], col: '#FF3DF2' },
    { icon: '🔷', name: 'THE GRID', kind: 'weave', ground: 'tron', road: 'tron', kerb: ['#3DE0FF', '#0A0414'], centre: '#FF3DF2', pieces: ['building', 'sign'], col: '#3DE0FF' },
    { icon: '🚇', name: 'THE UNDERPASS', kind: 'tunnel', roof: 'overpass', dim: 0.5, pieces: ['building'], col: '#B6FF7A' },
    { icon: '⛲', name: 'THE ROUNDABOUT', kind: 'fork', ground: 'tron', island: 'fountain', pieces: ['sign', 'building'], col: '#FFD23F' }],
};
// sun: where the light comes from (shadows fall that way, degrees in table space); skid: the rubber left on the road
const PLACE = { kitchen: { sun: 40, skid: '#3A1C0860' }, bedroom: { sun: 120, skid: '#0A0A1460' }, garden: { sun: 60, skid: '#4A2A1060' }, desk: { sun: 140, skid: '#1B1F2850' }, snow: { sun: 20, skid: '#5A7A9A60' }, neon: { sun: 90, skid: '#FF3DF250' } };
THEMES.forEach((t) => { t.secs = SECS[t.key]; Object.assign(t, PLACE[t.key]); });
// the road's look in a section: the place's, with the section's own surface and kerbs on top
function roadStyle(sc, th) {
  if (sc.kind === 'bridge') return { tape: sc.road || 'deck', kerb: ['#5A3A1E', '#6E4826'], kerbEdge: '#2A1A0C', tapeEdge: '#3A2414', centre: null, sheen: '', wear: false, paint: null };
  return { tape: sc.road || th.tape, kerb: sc.kerb || th.kerb, kerbEdge: sc.kerbEdge || th.kerbEdge, tapeEdge: sc.tapeEdge || th.tapeEdge, centre: sc.centre === undefined ? th.centre : sc.centre, sheen: sc.road ? '' : th.sheen, wear: true, paint: th.glow ? '#3DE0FF88' : '#FFFFFFB0' };
}
// more tiles for the sections' grounds and roads (the same painter as TILES)
Object.assign(TILES, {
  weave: [48, (x, T) => { for (let y = 0; y < T; y += 6) for (let u = 0; u < T; u += 6) { const over = ((u + y) / 6) % 2; x.fillStyle = over ? '#E3C08A' : '#C99E62'; x.fillRect(u, y, 6, 6); x.fillStyle = over ? '#ffffff22' : '#00000018'; x.fillRect(u, y + (over ? 0 : 5), 6, 1); } x.strokeStyle = '#8A6A3A40'; x.lineWidth = 0.4; for (let v = 0; v <= T; v += 6) { x.beginPath(); x.moveTo(v, 0); x.lineTo(v, T); x.stroke(); } }],
  board: [96, (x, T, rnd) => { x.fillStyle = '#E9CB96'; x.fillRect(0, 0, T, T); for (let i = 0; i < 16; i++) { const y0 = rnd() * T, ph = rnd() * 6.28; x.strokeStyle = i % 2 ? '#C9A26455' : '#F6DEB244'; x.lineWidth = 0.6 + rnd(); x.beginPath(); for (let u = 0; u <= T; u += 4) x[u ? 'lineTo' : 'moveTo'](u, y0 + Math.sin(u / T * 12.566 + ph) * 2); x.stroke(); }
    x.strokeStyle = '#8A5A2A40'; x.lineWidth = 0.5; for (let i = 0; i < 26; i++) { const px = rnd() * T, py = rnd() * T, a = rnd() * 3.14, l = 4 + rnd() * 10; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }],
  sinkwater: [96, (x, T, rnd, wrap) => { x.fillStyle = '#4F8FBF'; x.fillRect(0, 0, T, T); x.strokeStyle = '#ffffff30'; x.lineWidth = 1; for (let i = 0; i < 12; i++) { const px = rnd() * T, py = rnd() * T, r = 5 + rnd() * 16; wrap(px, py, r, (a, b) => { x.beginPath(); x.ellipse(a, b, r, r * 0.45, 0, 0, 7); x.stroke(); }); }
    for (let i = 0; i < 18; i++) { const px = rnd() * T, py = rnd() * T, r = 1.5 + rnd() * 4; wrap(px, py, r, (a, b) => { x.fillStyle = '#FFFFFF88'; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); x.fillStyle = '#FFFFFFdd'; x.beginPath(); x.arc(a - r * 0.3, b - r * 0.3, r * 0.3, 0, 7); x.fill(); }); } }],
  gingham: [32, (x, T) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, T, T); x.fillStyle = '#E8283C66'; x.fillRect(0, 0, 8, T); x.fillRect(16, 0, 8, T); x.fillRect(0, 0, T, 8); x.fillRect(0, 16, T, 8); }],
  baseplate: [32, (x, T) => { x.fillStyle = '#3FA34D'; x.fillRect(0, 0, T, T); for (let u = 4; u < T; u += 8) for (let v = 4; v < T; v += 8) { x.fillStyle = '#2E7D38'; x.beginPath(); x.arc(u + 0.5, v + 0.7, 2.6, 0, 7); x.fill(); x.fillStyle = '#4FBF5C'; x.beginPath(); x.arc(u, v, 2.5, 0, 7); x.fill(); x.fillStyle = '#ffffff40'; x.beginPath(); x.arc(u - 0.8, v - 0.8, 0.9, 0, 7); x.fill(); } }],
  legoroad: [32, (x, T) => { x.fillStyle = '#7C828C'; x.fillRect(0, 0, T, T); for (let u = 4; u < T; u += 8) for (let v = 4; v < T; v += 8) { x.fillStyle = '#6A707A'; x.beginPath(); x.arc(u + 0.4, v + 0.6, 2.3, 0, 7); x.fill(); x.fillStyle = '#8C929C'; x.beginPath(); x.arc(u, v, 2.2, 0, 7); x.fill(); } }],
  dustboards: [96, (x, T, rnd, wrap, speck) => { for (let y = 0; y < T; y += 24) { x.fillStyle = (y / 24) % 2 ? '#3E3024' : '#46372A'; x.fillRect(0, y, T, 24); x.fillStyle = '#1A120B'; x.fillRect(0, y, T, 1.5); x.fillRect(rnd() * T, y, 1.5, 24); } speck(120, ['#9A93A866', '#C9C2D455'], 0.4, 1.4); }],
  dusty: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#3A3D4C'; x.fillRect(0, 0, T, T); speck(700, ['#444858', '#30333F', '#4E5264'], 0.3, 1); speck(30, ['#B9B3C988'], 0.5, 1.4); }],
  foam: [64, (x, T) => { const cols = ['#FF7AB6', '#7CD7FF', '#B9F18C', '#FFE07A']; for (let i = 0; i < 4; i++) { const u = (i % 2) * 32, v = (i >> 1) * 32; x.fillStyle = cols[i]; x.fillRect(u, v, 32, 32); x.fillStyle = cols[(i + 1) % 4]; x.beginPath(); x.arc(u + 32, v + 16, 4, Math.PI / 2, Math.PI * 1.5); x.fill(); x.fillStyle = '#00000022'; x.fillRect(u, v, 32, 1); x.fillRect(u, v, 1, 32); } }],
  flagstone: [96, (x, T, rnd, wrap) => { x.fillStyle = '#5E9A44'; x.fillRect(0, 0, T, T); for (let i = 0; i < 7; i++) { const px = rnd() * T, py = rnd() * T, w = 14 + rnd() * 12, h = 10 + rnd() * 10, c = ['#B9B5AA', '#A8A397', '#C9C4B8'][i % 3]; wrap(px, py, Math.max(w, h), (a, b) => { x.fillStyle = '#00000030'; x.beginPath(); x.roundRect(a - w / 2 + 1, b - h / 2 + 1.5, w, h, 4); x.fill(); x.fillStyle = c; x.beginPath(); x.roundRect(a - w / 2, b - h / 2, w, h, 4); x.fill(); x.fillStyle = '#ffffff30'; x.fillRect(a - w / 2 + 2, b - h / 2 + 1, w - 4, 1.4); }); } }],
  bark: [64, (x, T, rnd) => { x.fillStyle = '#5A3820'; x.fillRect(0, 0, T, T); for (let i = 0; i < 160; i++) { const px = rnd() * T, py = rnd() * T, a = rnd() * 3.14; x.save(); x.translate(px, py); x.rotate(a); x.fillStyle = ['#7A4E2A', '#4A2C17', '#8A5A30', '#6B4226'][i % 4]; x.fillRect(-2.5, -1, 5, 2); x.restore(); } }],
  moss: [96, (x, T, rnd, wrap, speck) => { x.fillStyle = '#4E8A3A'; x.fillRect(0, 0, T, T); for (let i = 0; i < 12; i++) { const px = rnd() * T, py = rnd() * T, r = 8 + rnd() * 14; wrap(px, py, r, (a, b) => { x.fillStyle = i % 2 ? '#5FA046' : '#437A31'; x.globalAlpha = 0.7; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); x.globalAlpha = 1; }); } speck(300, ['#6DB352', '#3A6E2A'], 0.3, 0.9); }],
  cobble: [48, (x, T, rnd) => { x.fillStyle = '#5E5A52'; x.fillRect(0, 0, T, T); for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) { const u = c * 12 + (r % 2) * 6 + 1, v = r * 12 + 1, col = ['#9A958C', '#A8A397', '#8C877E'][Math.floor(rnd() * 3)]; x.fillStyle = col; x.beginPath(); x.roundRect(u, v, 10.5, 10, 3); x.fill(); x.fillStyle = '#ffffff28'; x.fillRect(u + 2, v + 1, 6.5, 1.3); } }],
  lined: [64, (x, T) => { x.fillStyle = '#FFFDF4'; x.fillRect(0, 0, T, T); x.fillStyle = '#8DB7EA77'; for (let y = 4; y < T; y += 8) x.fillRect(0, y, T, 0.6); x.fillStyle = '#FF6B6B66'; x.fillRect(12, 0, 0.8, T); }],
  cork: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#C69A63'; x.fillRect(0, 0, T, T); speck(900, ['#A87A44', '#DDB580', '#B88A52', '#8F6434'], 0.3, 1); }],
  darkmat: [64, (x, T, rnd, wrap, speck) => { x.fillStyle = '#20242E'; x.fillRect(0, 0, T, T); speck(400, ['#2A2F3B', '#1A1D25'], 0.3, 1); grid(x, T, 16, '#3DE0FF14', 0.5); }],
  deepsnow: [96, (x, T, rnd, wrap, speck) => { x.fillStyle = '#F4FAFF'; x.fillRect(0, 0, T, T); for (let i = 0; i < 10; i++) { const px = rnd() * T, py = rnd() * T, r = 8 + rnd() * 14; wrap(px, py, r, (a, b) => { x.fillStyle = '#DCEBF7'; x.globalAlpha = 0.7; x.beginPath(); x.ellipse(a, b + r * 0.3, r, r * 0.5, 0, 0, 7); x.fill(); x.globalAlpha = 1; }); } speck(40, ['#9FD8FF', '#FFFFFF'], 0.4, 1); }],
  iceblocks: [48, (x, T, rnd) => { for (let y = 0; y < T; y += 12) { x.fillStyle = (y / 12) % 2 ? '#BFE6F7' : '#A8DBF2'; x.fillRect(0, y, T, 12); x.fillStyle = '#FFFFFFcc'; x.fillRect(0, y, T, 1.2); x.fillStyle = '#6FB0D888'; x.fillRect(0, y + 11, T, 1); x.strokeStyle = '#FFFFFF88'; x.lineWidth = 0.5; x.beginPath(); const px = rnd() * T; x.moveTo(px, y + 2); x.lineTo(px + 4, y + 6); x.lineTo(px + 2, y + 10); x.stroke(); } }],
  icerink: [96, (x, T, rnd) => { x.fillStyle = '#D8F1FB'; x.fillRect(0, 0, T, T); x.strokeStyle = '#FFFFFFaa'; x.lineWidth = 0.6; for (let i = 0; i < 14; i++) { const px = rnd() * T, py = rnd() * T, r = 10 + rnd() * 30, a = rnd() * 6; x.beginPath(); x.arc(px, py, r, a, a + 1 + rnd()); x.stroke(); } x.fillStyle = '#B5E2F5'; for (let i = 0; i < 30; i++) x.fillRect(rnd() * T, rnd() * T, 1, 1); }],
  tron: [48, (x, T) => { x.fillStyle = '#0B0820'; x.fillRect(0, 0, T, T); x.strokeStyle = '#3DE0FF22'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0.5); x.lineTo(T, 0.5); x.moveTo(0.5, 0); x.lineTo(0.5, T); x.moveTo(0, 24.5); x.lineTo(T, 24.5); x.moveTo(24.5, 0); x.lineTo(24.5, T); x.stroke(); x.strokeStyle = '#3DE0FF99'; x.lineWidth = 0.7; x.stroke(); x.fillStyle = '#FF3DF2aa'; x.fillRect(23.5, 23.5, 2, 2); }],
  deck: [48, (x, T, rnd) => { for (let y = 0; y < T; y += 8) { x.fillStyle = (y / 8) % 2 ? '#A8743F' : '#966434'; x.fillRect(0, y, T, 8); x.strokeStyle = '#5A3A1E40'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(0, y + 3 + rnd() * 2); x.lineTo(T, y + 3 + rnd() * 2); x.stroke(); x.fillStyle = '#3A2414'; x.fillRect(0, y + 7, T, 1); x.fillStyle = '#2B2B33'; x.fillRect(5, y + 3.3, 1.2, 1.2); x.fillRect(T - 6, y + 3.3, 1.2, 1.2); x.fillStyle = '#ffffff1c'; x.fillRect(0, y, T, 0.8); } }],
});

// ---- 🏰 set pieces: the big things standing beside the road (and the islands the road splits round), painted once each
// into a sprite (SPR px a unit, drawn round a radius of 50) and stamped rotated with a soft shadow toward the place's sun.
const SPR = 3, SPRITES = new Map();
const circ = (x, cx, cy, r, f, s, lw = 1.5) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); if (f) { x.fillStyle = f; x.fill(); } if (s) { x.strokeStyle = s; x.lineWidth = lw; x.stroke(); } };
const rrect = (x, px, py, w, h, r, f, s, lw = 1.5) => { x.beginPath(); x.roundRect(px, py, w, h, r); if (f) { x.fillStyle = f; x.fill(); } if (s) { x.strokeStyle = s; x.lineWidth = lw; x.stroke(); } };
const cupPaint = (body, rim, drink) => (x, R) => { rrect(x, R * 0.5, -7, R * 0.42, 14, 6, body, rim, 2); circ(x, 0, 0, R * 0.72, body, rim, 2.5); circ(x, 0, 0, R * 0.6, drink); circ(x, 0, 0, R * 0.6, null, '#ffffff30', 2.5); x.fillStyle = '#E8C9A0'; x.beginPath(); x.ellipse(-6, -5, 9, 5, -0.5, 0, 7); x.fill(); x.strokeStyle = '#ffffff70'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, R * 0.68, 3.6, 4.6); x.stroke(); };
const PIECES = {
  plate: { r: 42, h: 3, paint: (x, R) => { circ(x, 0, 0, R * 0.95, '#F7F7F4', '#C9CED6', 2); circ(x, 0, 0, R * 0.66, null, '#E1E5EA', 1.5); x.fillStyle = '#FFFFFF'; x.beginPath(); x.ellipse(-4, 3, 19, 15, 0.4, 0, 7); x.fill(); circ(x, -2, 1, 7.5, '#FFB300', '#E08A00', 1); circ(x, -4, -1, 2, '#FFE9A0'); [[20, -14], [24, -9], [17, -8], [22, -18], [27, -14]].forEach(([a, b]) => circ(x, a, b, 3.4, '#4FA33A', '#2F6B22', 0.8)); } },
  cup: { r: 34, h: 16, paint: cupPaint('#FFFFFF', '#C9CED6', '#6B3E1F') },
  mug: { r: 40, h: 22, paint: cupPaint('#2D7FF9', '#163F8A', '#5A3018') },
  carrot: { r: 44, h: 8, paint: (x, R) => { x.fillStyle = '#3E8A28'; for (let k = -1; k <= 1; k++) { x.beginPath(); x.ellipse(R * 0.62, k * 6, 14, 3.4, k * 0.4, 0, 7); x.fill(); } x.fillStyle = '#FF8A1F'; x.beginPath(); x.moveTo(-R * 0.95, 0); x.quadraticCurveTo(0, -12, R * 0.5, -9); x.quadraticCurveTo(R * 0.62, 0, R * 0.5, 9); x.quadraticCurveTo(0, 12, -R * 0.95, 0); x.fill(); x.strokeStyle = '#C9600A'; x.lineWidth = 1; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(k * 10, -6); x.lineTo(k * 10 + 3, -2); x.stroke(); } x.fillStyle = '#ffffff40'; x.fillRect(-20, -6, 40, 2); } },
  tomato: { r: 30, h: 6, paint: (x, R) => { circ(x, 0, 0, R * 0.85, '#E8283C', '#A3121F', 2); circ(x, 0, 0, R * 0.66, '#FF5A5A'); for (let k = 0; k < 3; k++) { const a = k * 2.094; x.fillStyle = '#FFB3A0'; x.beginPath(); x.ellipse(Math.cos(a) * 13, Math.sin(a) * 13, 9, 6, a, 0, 7); x.fill(); for (let q = -1; q <= 1; q++) circ(x, Math.cos(a) * 13 + Math.cos(a + 1.57) * q * 4, Math.sin(a) * 13 + Math.sin(a + 1.57) * q * 4, 1.4, '#F6E7A0'); } circ(x, 0, 0, 4, '#FF8A8A'); } },
  fruitbowl: { r: 36, h: 24, paint: (x, R) => { circ(x, 0, 0, R * 0.98, '#2D7FF9', '#163F8A', 2.5); circ(x, 0, 0, R * 0.84, '#9CC9FF'); x.strokeStyle = '#FFFFFF66'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, R * 0.92, 3.4, 4.6); x.stroke(); x.strokeStyle = '#FFD23F'; x.lineCap = 'round'; x.lineWidth = 9; x.beginPath(); x.arc(4, 30, 26, 3.6, 4.9); x.stroke(); x.strokeStyle = '#C79A12'; x.lineWidth = 1; x.stroke(); x.lineCap = 'butt'; [[-18, -12, 13, '#E8283C'], [12, -16, 12, '#7BC043'], [14, 12, 14, '#FF8A1F'], [-4, 4, 11, '#E8283C']].forEach(([a, b, r, c]) => { circ(x, a + 1.5, b + 2, r, '#00000030'); circ(x, a, b, r, c); circ(x, a - r * 0.35, b - r * 0.35, r * 0.3, '#ffffff66'); }); for (let k = 0; k < 7; k++) circ(x, -28 + (k % 3) * 6, 14 + Math.floor(k / 3) * 6, 3.6, '#7A3FA8', '#4A1A7A', 0.6); } },
  block: { r: 30, h: 26, paint: (x, R, rnd) => { const c = DECOL[Math.floor(rnd() * 6)]; rrect(x, -R * 0.75, -R * 0.75, R * 1.5, R * 1.5, 5, '#F2D9A8', '#A07A44', 2); rrect(x, -R * 0.58, -R * 0.58, R * 1.16, R * 1.16, 4, c); x.fillStyle = '#FFFFFF'; x.font = '900 40px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ABCDEF'[Math.floor(rnd() * 6)], 0, 2); } },
  teddy: { r: 40, h: 28, paint: (x, R) => { circ(x, -20, 12, 8, '#8A5A2B'); circ(x, 20, 12, 8, '#8A5A2B'); circ(x, 0, 10, R * 0.5, '#A26A34', '#6E431C'); circ(x, 0, 14, R * 0.26, '#E7B98A'); circ(x, -14, -26, 7, '#8A5A2B'); circ(x, 14, -26, 7, '#8A5A2B'); circ(x, -14, -26, 3.5, '#E7B98A'); circ(x, 14, -26, 3.5, '#E7B98A'); circ(x, 0, -14, R * 0.36, '#B5793E', '#6E431C'); circ(x, 0, -9, 6, '#E7B98A'); circ(x, -6, -17, 2, '#1B1B22'); circ(x, 6, -17, 2, '#1B1B22'); circ(x, 0, -11, 2.2, '#3A2414'); } },
  lego: { r: 38, h: 14, paint: (x, R, rnd) => { const c = DECOL[Math.floor(rnd() * 6)]; rrect(x, -R * 0.92, -R * 0.48, R * 1.84, R * 0.96, 3, c, '#00000055'); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const px = -R * 0.69 + i * R * 0.46, py = -R * 0.23 + j * R * 0.46; circ(x, px + 1, py + 1.5, 7.5, '#00000030'); circ(x, px, py, 7.5, c, '#00000040', 1); circ(x, px - 2, py - 2, 2.4, '#ffffff66'); } } },
  tower: { r: 40, h: 40, paint: (x, R) => { const brick = (px, py, w, h, c) => { rrect(x, px + 4, py + 6, w, h, 3, '#00000040'); rrect(x, px, py, w, h, 3, c, '#00000055'); for (let u = px + 6; u < px + w; u += 12) for (let v = py + 6; v < py + h; v += 12) { circ(x, u, v, 4.2, c, '#00000033', 0.8); circ(x, u - 1.2, v - 1.2, 1.3, '#ffffff77'); } }; brick(-36, -24, 72, 48, '#EE2B3B'); brick(-24, -24, 48, 24, '#FFD23F'); brick(-12, -12, 24, 24, '#2D7FF9'); } },
  sock: { r: 36, h: 4, paint: (x, R) => { x.lineCap = 'round'; x.lineJoin = 'round'; const path = () => { x.beginPath(); x.moveTo(-R * 0.7, -R * 0.6); x.lineTo(R * 0.1, -R * 0.6); x.lineTo(R * 0.35, R * 0.55); }; path(); x.strokeStyle = '#D9D4E8'; x.lineWidth = 22; x.stroke(); path(); x.strokeStyle = '#7A5BD0'; x.setLineDash([7, 9]); x.lineWidth = 22; x.stroke(); x.setLineDash([]); circ(x, R * 0.35, R * 0.55, 11, '#EE2B3B'); rrect(x, -R * 0.82, -R * 0.6 - 11, 10, 22, 3, '#EE2B3B'); x.lineCap = 'butt'; } },
  bunny: { r: 26, h: 10, paint: (x, R) => { x.strokeStyle = '#8A8698'; x.lineWidth = 1.4; for (let k = 0; k < 40; k++) { const a = k * 0.157, r0 = R * 0.6, r1 = R * (0.85 + 0.15 * Math.sin(k * 3.3)); x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); x.stroke(); } circ(x, 0, 0, R * 0.7, '#A9A4B8'); circ(x, -5, -6, R * 0.35, '#BDB8CC'); circ(x, -6, -2, 2.4, '#1B1B22'); circ(x, 6, -2, 2.4, '#1B1B22'); circ(x, -6.7, -2.8, 0.8, '#FFFFFF'); circ(x, 5.3, -2.8, 0.8, '#FFFFFF'); } },
  toybox: { r: 38, h: 30, paint: (x, R) => { rrect(x, -R * 0.95, -R * 0.62, R * 1.9, R * 1.24, 5, '#C98E4A', '#6E431C', 2.5); x.strokeStyle = '#8A5A2B'; x.lineWidth = 1.2; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(-R * 0.95, -R * 0.62 + k * R * 0.31); x.lineTo(R * 0.95, -R * 0.62 + k * R * 0.31); x.stroke(); } [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => rrect(x, a * R * 0.95 - 5, b * R * 0.62 - 5, 10, 10, 2, '#C0C7D2')); circ(x, -18, -6, 13, '#EE2B3B', '#7A1010', 1.5); x.fillStyle = '#FFFFFF'; x.fillRect(-31, -8, 26, 4); rrect(x, 4, -10, 18, 18, 3, '#2D7FF9', '#163F8A'); circ(x, 20, 12, 7, '#FFD23F', '#C79A12', 1); } },
  pebbles: { r: 30, h: 8, paint: (x, R, rnd) => { for (let k = 0; k < 6; k++) { const a = k * 1.05 + rnd(), d = k ? 14 + rnd() * 8 : 0, px = Math.cos(a) * d, py = Math.sin(a) * d, w = 9 + rnd() * 6, h = 7 + rnd() * 4; x.fillStyle = '#00000030'; x.beginPath(); x.ellipse(px + 1.5, py + 2, w, h, a, 0, 7); x.fill(); x.fillStyle = ['#A8A397', '#C9C4B8', '#8C877E', '#B9B5AA'][k % 4]; x.beginPath(); x.ellipse(px, py, w, h, a, 0, 7); x.fill(); circ(x, px - w * 0.3, py - h * 0.3, 2, '#ffffff55'); } } },
  pot: { r: 32, h: 22, paint: (x, R, rnd) => { circ(x, 0, 0, R * 0.8, '#C8643A', '#8A3E1E', 2.5); circ(x, 0, 0, R * 0.64, '#4A2C17'); x.fillStyle = '#3E8A28'; for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.6; x.beginPath(); x.ellipse(Math.cos(a) * 14, Math.sin(a) * 14, 11, 5, a, 0, 7); x.fill(); } const c = ['#FF5DA2', '#FFD23F', '#A855F7', '#FF8A3D'][Math.floor(rnd() * 4)]; for (let k = 0; k < 6; k++) circ(x, Math.cos(k * 1.047) * 9, Math.sin(k * 1.047) * 9, 7, c); circ(x, 0, 0, 5, '#FFB000'); } },
  tulip: { r: 34, h: 18, paint: (x) => { [[-14, -8, '#E8283C'], [12, -12, '#FFD23F'], [0, 14, '#FF5DA2']].forEach(([a, b, c], k) => { x.fillStyle = '#2F7A22'; x.beginPath(); x.ellipse(a + 10, b + 6, 13, 4, 0.6 + k, 0, 7); x.fill(); x.beginPath(); x.ellipse(a - 8, b + 8, 12, 4, -0.5 + k, 0, 7); x.fill(); for (let p = 0; p < 3; p++) { x.fillStyle = c; x.beginPath(); x.ellipse(a + Math.cos(p * 2.09) * 3.5, b + Math.sin(p * 2.09) * 3.5, 7, 5, p * 2.09, 0, 7); x.fill(); } circ(x, a, b, 3, '#00000030'); }); } },
  mushroom: { r: 42, h: 34, paint: (x, R) => { rrect(x, 14, -30, 10, 14, 2, '#8A5A2B', '#4A2C17'); circ(x, 19, -36, 6, '#FFFFFF99'); circ(x, 0, 0, R * 0.88, '#E8283C', '#8A1020', 2.5); [[-14, -12, 7], [12, -6, 6], [-4, 14, 8], [18, 16, 5], [-22, 8, 4]].forEach(([a, b, r]) => circ(x, a, b, r, '#FFFFFF')); x.strokeStyle = '#ffffff55'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R * 0.78, 3.5, 4.5); x.stroke(); } },
  gnome: { r: 26, h: 30, paint: (x, R) => { circ(x, 0, 6, R * 0.9, '#2F6B9A', '#1E4566', 2); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(0, 8, R * 0.7, 0.2, Math.PI - 0.2); x.fill(); circ(x, 0, -4, R * 0.62, '#E8283C', '#8A1020', 2); x.fillStyle = '#E8283C'; x.beginPath(); x.moveTo(-8, -10); x.lineTo(0, -R * 1.25); x.lineTo(8, -10); x.fill(); circ(x, 0, 4, 4, '#F2B48A'); circ(x, -5, -6, 3, '#FF6B7A'); } },
  stapler: { r: 40, h: 14, paint: (x, R) => { rrect(x, -R * 0.92, -R * 0.26, R * 1.84, R * 0.52, 10, '#2B2F3A', '#11141B', 2); rrect(x, -R * 0.85, -R * 0.2, R * 1.6, R * 0.16, 5, '#4A5160'); rrect(x, R * 0.55, -R * 0.24, R * 0.36, R * 0.48, 6, '#C0C7D2', '#6A7180'); } },
  eraser: { r: 24, h: 8, paint: (x, R) => { rrect(x, -R * 0.9, -R * 0.45, R * 1.8, R * 0.9, 5, '#FF9EC4', '#C2507E', 1.5); rrect(x, R * 0.05, -R * 0.45, R * 0.85, R * 0.9, 3, '#2D7FF9', '#163F8A', 1.5); x.fillStyle = '#FFFFFF'; x.fillRect(R * 0.25, -2, R * 0.45, 4); } },
  pencilcup: { r: 30, h: 34, paint: (x, R) => { circ(x, 0, 0, R * 0.78, '#3A3F4B', '#1E2129', 2.5); circ(x, 0, 0, R * 0.64, '#16181F'); [[-10, -8, '#EE2B3B'], [9, -10, '#22C55E'], [12, 8, '#2D7FF9'], [-8, 11, '#FFD23F'], [0, 0, '#A855F7'], [-16, 2, '#FF8A3D']].forEach(([a, b, c]) => { circ(x, a, b, 5.5, c, '#00000055', 1); circ(x, a, b, 3, '#F2C99A'); circ(x, a, b, 1.2, '#2B2B33'); }); } },
  pine: { r: 34, h: 40, paint: (x, R) => { const star = (r, c) => { x.fillStyle = c; x.beginPath(); for (let k = 0; k < 16; k++) { const rr = k % 2 ? r * 0.62 : r, a = k * 0.3927; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.fill(); }; star(R * 0.95, '#1B5E36'); star(R * 0.72, '#22764A'); star(R * 0.48, '#2E8F5A'); for (let k = 0; k < 8; k++) circ(x, Math.cos(k * 0.785 + 0.3) * R * 0.6, Math.sin(k * 0.785 + 0.3) * R * 0.6, 3.6, '#FFFFFFdd'); circ(x, 0, 0, 5, '#FFFFFF'); } },
  snowman: { r: 32, h: 34, paint: (x, R) => { circ(x, 0, 10, R * 0.62, '#FFFFFF', '#B5D3EA', 2); circ(x, 0, -4, R * 0.46, '#F4FAFF', '#C9DFF0', 1.5); circ(x, 0, -16, R * 0.34, '#1B1B22'); circ(x, 0, -16, R * 0.22, '#2B2B33'); x.strokeStyle = '#E8283C'; x.lineWidth = 5; x.beginPath(); x.arc(0, -4, R * 0.36, 0.3, 2.8); x.stroke(); x.fillStyle = '#FF8A3D'; x.beginPath(); x.moveTo(-3, -6); x.lineTo(0, 8); x.lineTo(3, -6); x.fill(); [-6, 2, 10].forEach((b) => circ(x, 0, b + 10, 1.6, '#1B1B22')); } },
  snowglobe: { r: 36, h: 36, paint: (x, R, rnd) => { circ(x, 0, 0, R * 0.98, '#7A4E25', '#3B2412', 2); circ(x, 0, 0, R * 0.84, '#CFEFFFdd', '#FFFFFF', 2); rrect(x, -10, -4, 20, 16, 2, '#E8283C'); x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(-13, -4); x.lineTo(0, -16); x.lineTo(13, -4); x.fill(); rrect(x, -3, 4, 6, 8, 1, '#FFD86B'); x.fillStyle = '#1F8A4C'; x.beginPath(); x.moveTo(16, 14); x.lineTo(22, -2); x.lineTo(28, 14); x.fill(); for (let k = 0; k < 26; k++) { const a = rnd() * 6.28, d = rnd() * R * 0.8; circ(x, Math.cos(a) * d, Math.sin(a) * d, 1 + rnd(), '#FFFFFF'); } x.strokeStyle = '#FFFFFFcc'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, R * 0.74, 3.5, 4.4); x.stroke(); } },
  sign: { r: 40, h: 18, paint: (x, R, rnd) => { const c = ['#FF3DF2', '#3DE0FF', '#B6FF7A', '#FFD23F'][Math.floor(rnd() * 4)], word = ['OPEN', 'r = 4', 'EAT', 'ZOOM', 'FIG'][Math.floor(rnd() * 5)]; rrect(x, -R * 0.92, -R * 0.42, R * 1.84, R * 0.84, 6, '#0A0414', c, 2.5); x.shadowColor = c; x.shadowBlur = 10; x.fillStyle = c; x.font = '900 22px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(word, 0, 1); x.shadowBlur = 0; x.fillStyle = '#FFFFFF'; x.fillText(word, 0, 1); x.globalAlpha = 0.5; x.fillStyle = c; x.fillText(word, 0, 1); x.globalAlpha = 1; } },
  building: { r: 44, h: 60, paint: (x, R, rnd) => { const c = ['#FF3DF2', '#3DE0FF', '#B6FF7A'][Math.floor(rnd() * 3)]; rrect(x, -R * 0.8, -R * 0.8, R * 1.6, R * 1.6, 3, '#141024', c, 2); rrect(x, -R * 0.62, -R * 0.62, R * 1.24, R * 1.24, 2, '#1E1838'); circ(x, 8, 8, 14, null, '#FFD86B', 1.5); x.fillStyle = '#FFD86B'; x.font = '900 14px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', 8, 9); rrect(x, -26, -26, 14, 10, 2, '#3A3550'); rrect(x, -26, -12, 14, 10, 2, '#3A3550'); for (let k = 0; k < 6; k++) circ(x, -R * 0.8 + k * R * 0.32, -R * 0.8, 2, rnd() < 0.5 ? c : '#FFD86B'); } },
  fountain: { r: 38, h: 20, paint: (x, R) => { circ(x, 0, 0, R * 0.98, '#1E1838', '#3DE0FF', 3); x.shadowColor = '#3DE0FF'; x.shadowBlur = 12; circ(x, 0, 0, R * 0.82, '#2B4CFF66', '#FF3DF2', 2); x.shadowBlur = 0; [0.62, 0.42].forEach((f) => circ(x, 0, 0, R * f, null, '#9BE7FF', 1.5)); circ(x, 0, 0, R * 0.2, '#FFFFFF', '#3DE0FF', 2); for (let k = 0; k < 8; k++) circ(x, Math.cos(k * 0.785) * R * 0.3, Math.sin(k * 0.785) * R * 0.3, 2, '#E0FBFF'); } },
  // 🚧 the obstacles' own things (the rest share the set pieces' sprites)
  jar: { r: 22, h: 28, paint: (x, R) => { circ(x, 0, 0, R * 0.92, '#DCEFFA', '#8FB8CF', 2); circ(x, 0, 0, R * 0.8, '#FFFFFF'); x.save(); x.beginPath(); x.arc(0, 0, R * 0.8, 0, 7); x.clip(); x.fillStyle = '#E8283Ccc'; for (let k = -6; k <= 6; k += 2) { x.fillRect(k * 7, -R, 7, R * 2); x.fillRect(-R, k * 7, R * 2, 7); } x.restore(); circ(x, 0, 0, R * 0.8, null, '#A3121F', 1.5); x.strokeStyle = '#FFD23F'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, R * 0.58, 0, 7); x.stroke(); circ(x, R * 0.58, 0, 4, '#FFD23F'); x.strokeStyle = '#FFFFFFaa'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R * 0.86, 3.5, 4.5); x.stroke(); } },
  spoon: { r: 38, h: 4, paint: (x, R) => { rrect(x, -R * 0.92, -R * 0.1, R * 1.15, R * 0.2, R * 0.1, '#C9D1DC', '#6A7180', 1.5); x.fillStyle = '#C9D1DC'; x.strokeStyle = '#6A7180'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(R * 0.55, 0, R * 0.38, R * 0.22, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#9AA3B2'; x.beginPath(); x.ellipse(R * 0.57, 1, R * 0.28, R * 0.14, 0, 0, 7); x.fill(); x.fillStyle = '#FFFFFFcc'; x.beginPath(); x.ellipse(R * 0.48, -R * 0.08, R * 0.14, R * 0.05, -0.2, 0, 7); x.fill(); x.fillRect(-R * 0.85, -R * 0.06, R * 0.9, 2); } },
  books: { r: 30, h: 22, paint: (x, R) => { [['#2D7FF9', 0.16], ['#22C55E', -0.1], ['#7A1F2B', 0]].forEach(([c, a], k) => { x.save(); x.rotate(a); rrect(x, -R * 0.84, -R * 0.62, R * 1.68, R * 1.24, 3, '#F5F0E0', '#00000055', 1.5); rrect(x, -R * 0.84, -R * 0.62, R * 1.58, R * 1.24, 3, c, '#00000066', 1.5); if (k === 2) { x.fillStyle = '#FFD23F'; x.fillRect(-R * 0.6, -R * 0.2, R * 1.1, 4); x.fillRect(-R * 0.6, R * 0.05, R * 0.7, 2.5); x.fillStyle = '#ffffff30'; x.fillRect(-R * 0.84, -R * 0.62, R * 1.58, 4); } x.restore(); }); } },
  cone: { r: 20, h: 26, paint: (x, R) => { rrect(x, -R * 0.82, -R * 0.82, R * 1.64, R * 1.64, 6, '#1A1030', '#FF3DF2', 2.5); circ(x, 0, 0, R * 0.62, '#FF6A00', '#B33F00', 1.5); x.strokeStyle = '#FFFFFF'; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, R * 0.4, 0, 7); x.stroke(); x.strokeStyle = '#3DE0FF'; x.lineWidth = 2; x.stroke(); circ(x, 0, 0, R * 0.18, '#FFB070', '#B33F00', 1); circ(x, -4, -4, 3, '#FFFFFF88'); } },
  barrel: { r: 22, h: 30, paint: (x, R) => { circ(x, 0, 0, R * 0.9, '#2A1250', '#FF3DF2', 3); [0.72, 0.52].forEach((f) => circ(x, 0, 0, R * f, null, '#3DE0FF', 2)); circ(x, R * 0.38, -R * 0.3, 5, '#12062A', '#B6FF7A', 1.5); x.fillStyle = '#B6FF7A'; x.font = '900 20px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('☢', -4, 6); x.strokeStyle = '#FFFFFF66'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R * 0.84, 3.5, 4.4); x.stroke(); } },
};
function sprite(kind) {
  let c = SPRITES.get(kind); if (c) return c;
  const P = PIECES[kind], R0 = 50, S = Math.ceil(R0 * 2.3 * SPR); c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.translate(S / 2, S / 2); x.scale(SPR, SPR);
  let i = kind.length * 77 + kind.charCodeAt(0); P.paint(x, R0, () => hash(i++)); SPRITES.set(kind, c); return c;
}
let BLOB = null;   // a soft round shadow, drawn stretched under anything
function blob() { if (BLOB) return BLOB; BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const x = BLOB.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, '#000000ff'); gr.addColorStop(0.55, '#000000aa'); gr.addColorStop(1, '#00000000'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return BLOB; }
function softShadow(x, y, rx, ry, a) { ctx.globalAlpha = a; ctx.drawImage(blob(), x - rx * 1.3, y - ry * 1.3, rx * 2.6, ry * 2.6); ctx.globalAlpha = 1; }
function makePieces() {
  const out = [], L = g.track.len, w = g.track.w;
  g.secs.forEach((sc) => { if (!sc.pieces?.length) return; let j = 0;
    for (let s = sc.s0 + 0.02; s < sc.s1 - 0.015; s += 115 / L, j++) {
      const h = (k) => hash(g.seed + g.course * 31 + sc.i * 211 + j * 7 + k), side = h(1) < 0.5 ? 1 : -1, kind = sc.pieces[j % sc.pieces.length], r = (PIECES[kind]?.r || 36) * (0.85 + 0.3 * h(2));
      if ([s - r / L, s, s + r / L].some((q) => marginAt(q, side) < MARGIN - 1)) continue;
      const p = spotOn(s, side * (w / 2 + MARGIN + 10 + r)), nr = nearest(p.x, p.y);
      if (nr.d < w / 2 + MARGIN + r || out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < q.r + r + 8)) continue;
      out.push({ kind, x: p.x, y: p.y, r, a: at(s).a + Math.PI / 2 + (h(3) - 0.5) * 0.9, s }); }
  });
  return out;
}
// the sections' shapes, built once a course as Path2D: the ground patch along the road, the gap under a bridge, a
// tunnel's roof (its body, slats across and the two mouths) and an island's outline
function band(s0, s1, o0, o1) {   // a strip along the road between offsets o0 and o1 (o0 < o1), from progress s0 to s1
  const t = g.track, p = new Path2D(), i0 = Math.max(0, Math.floor(clamp01(s0) * (t.n - 1))), i1 = Math.min(t.n - 1, Math.ceil(clamp01(s1) * (t.n - 1)));
  const nAt = (i) => { const a = t.pts[Math.max(0, i - 1)], b = t.pts[Math.min(t.n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return [-(b.y - a.y) / l, (b.x - a.x) / l]; };
  for (let i = i0; i <= i1; i++) { const [nx, ny] = nAt(i); p[i > i0 ? 'lineTo' : 'moveTo'](t.pts[i].x + nx * o1, t.pts[i].y + ny * o1); }
  for (let i = i1; i >= i0; i--) { const [nx, ny] = nAt(i); p.lineTo(t.pts[i].x + nx * o0, t.pts[i].y + ny * o0); }
  p.closePath(); return p;
}
function buildSecPaths() {
  const w = g.track.w, L = g.track.len;
  g.secs.forEach((sc) => {
    sc.patch = sc.ground ? band(sc.s0 + 0.004, sc.s1 - 0.004, -(w / 2 + MARGIN + EXTRA * 0.55), w / 2 + MARGIN + EXTRA * 0.55) : null;
    sc.gapP = sc.gap ? band(sc.s0 - RAMP * 1.6, sc.s1 + RAMP * 1.6, -(w / 2 + EXTRA + 90), w / 2 + EXTRA + 90) : null;
    if (sc.roof) { const a = sc.s0 + 0.012, b = sc.s1 - 0.012, half = w / 2 + MARGIN + 26; sc.roofP = band(a, b, -half, half); sc.slats = new Path2D(); sc.mouths = new Path2D();
      for (let s = a + 30 / L; s < b - 10 / L; s += 30 / L) { const p = spotOn(s, -half), q = spotOn(s, half); sc.slats.moveTo(p.x, p.y); sc.slats.lineTo(q.x, q.y); }
      [a, b].forEach((s) => { const p = spotOn(s, -half), q = spotOn(s, half); sc.mouths.moveTo(p.x, p.y); sc.mouths.lineTo(q.x, q.y); }); }
  });
  g.islands.forEach((isl) => { const p = new Path2D(), N = 24, pt = (k, sd) => { const u = -1 + 2 * k / N, q = spotOn(isl.s + u * isl.lh / L, sd * isl.wi * Math.sqrt(Math.max(0, 1 - u * u))); return q; };
    for (let k = 0; k <= N; k++) { const q = pt(k, 1); p[k ? 'lineTo' : 'moveTo'](q.x, q.y); } for (let k = N; k >= 0; k--) { const q = pt(k, -1); p.lineTo(q.x, q.y); } p.closePath(); isl.path = p; });
}

// ---- the small things on the table, beside the tape
function makeDecor() {
  const th = TH(), out = [], n = Math.round(g.track.len / 22);
  for (let i = 0; i < n; i++) { const s = 0.02 + hash(g.seed + 300 + i) * 0.96, side = hash(g.seed + 700 + i) < 0.5 ? 1 : -1; if (marginAt(s, side) < 40) continue;
    const off = side * (g.track.w / 2 + 13 + hash(g.seed + 900 + i) * (MARGIN - 30)), p = spotOn(s, off);
    out.push({ kind: th.decor[i % th.decor.length], x: p.x, y: p.y, a: hash(g.seed + 1100 + i) * 6.28, c: Math.floor(hash(g.seed + 1300 + i) * 6), sz: 0.8 + hash(g.seed + 1500 + i) * 0.5 }); }
  return out;
}
const DECOL = ['#EE2B3B', '#2D7FF9', '#FFD23F', '#22C55E', '#A855F7', '#FF8A3D'];
function drawDecor(d, t) {
  ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a); ctx.scale(d.sz, d.sz); const c = DECOL[d.c];
  switch (d.kind) {
    case 'crumb': ctx.fillStyle = '#C98E4A'; ctx.beginPath(); ctx.moveTo(-2.5, -1); ctx.lineTo(0.5, -2.5); ctx.lineTo(2.6, 0); ctx.lineTo(0.8, 2.2); ctx.lineTo(-2, 1.6); ctx.fill(); ctx.fillStyle = '#E9B877'; ctx.fillRect(-0.8, -1, 1.6, 1.2); break;
    case 'sugar': ctx.fillStyle = '#00000030'; ctx.fillRect(-2, -1.4, 5, 5); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-2.5, -2.5, 5, 5); ctx.fillStyle = '#E3E8EE'; ctx.fillRect(-2.5, 1.2, 5, 1.3); break;
    case 'pea': ctx.fillStyle = '#3E8A28'; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = '#8AD866'; ctx.beginPath(); ctx.arc(-0.8, -0.8, 0.9, 0, 7); ctx.fill(); break;
    case 'lego': ctx.fillStyle = '#00000038'; ctx.fillRect(-4, -1.6, 9, 5); ctx.fillStyle = c; ctx.fillRect(-4.5, -2.5, 9, 5); ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.arc(-2.2, 0, 1.4, 0, 7); ctx.arc(2.2, 0, 1.4, 0, 7); ctx.fill(); break;
    case 'marble': ctx.fillStyle = '#00000030'; ctx.beginPath(); ctx.arc(0.8, 1, 3, 0, 7); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(-1, -1, 0.9, 0, 7); ctx.fill(); break;
    case 'star': ctx.fillStyle = '#FFE36B'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 1.6 : 4, a = k * 0.628; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); break;
    case 'flower': ctx.fillStyle = ['#FF5DA2', '#FFFFFF', '#FFD23F', '#A855F7', '#FF8A3D', '#7CD7FF'][d.c]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.257) * 2.4, Math.sin(k * 1.257) * 2.4, 1.8, 0, 7); ctx.fill(); } ctx.fillStyle = '#FFB000'; ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, 7); ctx.fill(); break;
    case 'leaf': ctx.fillStyle = d.c % 2 ? '#2F7A22' : '#C98E2A'; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#00000040'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0); ctx.stroke(); break;
    case 'ladybird': ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(2.4, 0, 1.4, 0, 7); ctx.fill(); ctx.fillStyle = '#E8283C'; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; [[-1, -1], [-1, 1], [0.8, -0.9], [0.8, 0.9]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 0.55, 0, 7); ctx.fill(); }); ctx.fillRect(-2.6, -0.15, 4.4, 0.3); break;
    case 'clip': ctx.strokeStyle = '#B9C2D0'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.roundRect(-5, -1.8, 10, 3.6, 1.8); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-3.5, -1, 7.5, 2, 1); ctx.stroke(); break;
    case 'pin': ctx.fillStyle = '#00000038'; ctx.beginPath(); ctx.arc(1, 1.2, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff99'; ctx.beginPath(); ctx.arc(-0.8, -0.8, 0.9, 0, 7); ctx.fill(); break;
    case 'ring': ctx.strokeStyle = '#6B3E1F55'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 7, 0.3, 5.9); ctx.stroke(); break;
    case 'flake': ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = k * 1.047; ctx.moveTo(Math.cos(a) * 3.5, Math.sin(a) * 3.5); ctx.lineTo(-Math.cos(a) * 3.5, -Math.sin(a) * 3.5); } ctx.stroke(); break;
    case 'twig': ctx.strokeStyle = '#2F6B3A'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); for (let k = -4; k <= 4; k += 1.5) { ctx.moveTo(k, 0); ctx.lineTo(k + 1.2, -1.8); ctx.moveTo(k, 0); ctx.lineTo(k + 1.2, 1.8); } ctx.stroke(); break;
    case 'berry': ctx.fillStyle = '#C21A2E'; [[0, 0], [2, 0.6], [0.8, 1.9]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); }); break;
    case 'glow': { const col = ['#FF3DF2', '#3DE0FF', '#B6FF7A', '#FFD23F', '#FF3DF2', '#3DE0FF'][d.c], pu = 0.6 + 0.4 * Math.sin(t / 400 + d.a * 3); ctx.globalAlpha = 0.25 * pu; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, 7); ctx.fill(); break; }
    case 'nring': ctx.strokeStyle = d.c % 2 ? '#3DE0FFaa' : '#FF3DF2aa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.stroke(); break;
  }
  ctx.restore();
}

// ---- the light over each place (screen space): a cached glow and vignette, plus a few drifting things
let airCache = null;
function drawAir(t, th, Hh) {
  const key = `${th.key}|${Math.round(W / 8)}|${Math.round(Hh / 8)}`;
  if (!airCache || airCache.key !== key) {
    const c = document.createElement('canvas'), w = Math.max(2, Math.round(W)), h = Math.max(2, Math.round(Hh)); c.width = w; c.height = h; const x = c.getContext('2d');
    const lin = (y0, y1, col, a) => { const gr = x.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, col + a); gr.addColorStop(1, col + '00'); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    const vig = (col, a, cy = 0.62, r0 = 0.32) => { const gr = x.createRadialGradient(w / 2, h * cy, h * r0, w / 2, h * cy, h * 0.9); gr.addColorStop(0, col + '00'); gr.addColorStop(1, col + a); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
    if (th.air === 'sun') { const gr = x.createLinearGradient(0, 0, w, h * 0.7); gr.addColorStop(0, '#FFD9A048'); gr.addColorStop(0.5, '#FFD9A000'); x.fillStyle = gr; x.fillRect(0, 0, w, h); vig('#2A1206', '70'); }
    else if (th.air === 'lamp') { lin(0, h * 0.45, '#FF9AD5', '26'); vig('#120A2E', '80'); }
    else if (th.air === 'leaves') { lin(0, h * 0.5, '#FFF6B0', '40'); vig('#0E2A0A', '66'); }
    else if (th.air === 'desklamp') { vig('#060A14', 'A0', 0.7, 0.24); const gr = x.createRadialGradient(w * 0.5, h * 0.72, 4, w * 0.5, h * 0.72, h * 0.45); gr.addColorStop(0, '#FFF2C028'); gr.addColorStop(1, '#FFF2C000'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
    else if (th.air === 'snow') { lin(0, h * 0.5, '#CFEAFF', '50'); vig('#0B2A55', '70'); }
    else if (th.air === 'neon') { lin(0, h * 0.4, '#FF3DF2', '24'); const gr = x.createLinearGradient(0, h, 0, h * 0.6); gr.addColorStop(0, '#3DE0FF22'); gr.addColorStop(1, '#3DE0FF00'); x.fillStyle = gr; x.fillRect(0, 0, w, h); vig('#05010C', 'B0'); }
    airCache = { key, c };
  }
  ctx.drawImage(airCache.c, 0, 0, W, Hh);
  const tt = host.reduceMotion ? 0 : t;
  if (th.air === 'snow') { ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 40; i++) { const sp = 0.025 + (i % 5) * 0.008, y = (tt * sp + i * 97) % (Hh + 20) - 10, x = ((i * 137.5) % W + Math.sin(tt / 900 + i) * 14 + W) % W; ctx.globalAlpha = 0.5 + (i % 3) * 0.2; ctx.beginPath(); ctx.arc(x, y, 1 + (i % 4) * 0.5, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  else if (th.air === 'neon') { for (let i = 0; i < 18; i++) { const y = Hh - ((tt * (0.012 + (i % 4) * 0.006) + i * 71) % (Hh + 20)), x = (i * 89.3) % W + Math.sin(tt / 1200 + i) * 8; ctx.fillStyle = i % 2 ? '#FF3DF2' : '#3DE0FF'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(x, y, 1, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  else if (th.air === 'leaves') { ctx.fillStyle = '#FFF6B0'; for (let i = 0; i < 10; i++) { const x = (i * 71 + tt * 0.01 * (1 + i % 3)) % W, y = (i * 131 + Math.sin(tt / 700 + i) * 12) % Hh; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  else if (th.air === 'sun') { ctx.fillStyle = '#FFF4D8'; for (let i = 0; i < 16; i++) { const x = (i * 53 + Math.sin(tt / 1700 + i) * 18 + W) % W, y = (i * 47 + tt * 0.004 * (1 + i % 3)) % (Hh * 0.6); ctx.globalAlpha = 0.18 + 0.25 * (0.5 + 0.5 * Math.sin(tt / 500 + i * 2)); ctx.beginPath(); ctx.arc(x, y, 1, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  else if (th.air === 'lamp') { ctx.fillStyle = '#FFF3A8'; for (let i = 0; i < 9; i++) { const x = (i * 97 + 30) % W, y = (i * 61 + 20) % (Hh * 0.45), a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(tt / 600 + i * 1.7)); ctx.globalAlpha = a; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 1 : 2.6, an = k * 0.628; ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } ctx.fill(); } ctx.globalAlpha = 1; }
}

// ---- the cars' trails: dust, smoke, spray, sparks (world space, a few dozen at most)
function kickDust(c, dt, mine) {
  if (c.fall > 0 || c.rescue || c.out > 0 || c.done || c.v < 60) return;
  c.dT = (c.dT || 0) - dt; if (c.dT > 0) return;
  c.dT = (mine ? 0.045 : 0.11) / Math.min(1.6, c.v / 140);
  const th = TH(), vh = VH(), ca = Math.cos(c.a), sa = Math.sin(c.a), rx = c.x + ca * vh.rear * CAR, ry = c.y + sa * vh.rear * CAR, lat = (Math.random() - 0.5) * 16;
  const push = (o) => { g.dust.push(o); if (g.dust.length > 150) g.dust.shift(); };
  const back = (sp) => ({ vx: -ca * sp + (Math.random() - 0.5) * 30, vy: -sa * sp + (Math.random() - 0.5) * 30 });
  if (c.skid && !vh.beam) [-1, 1].forEach((sd) => push({ x: rx + sa * sd * 7 * CAR, y: ry - ca * sd * 7 * CAR, ...back(20), life: 0.9, max: 0.9, r: 3, grow: 11, col: th.glow ? '#C9B8FF' : '#E8E8EE', a: mine ? 0.5 : 0.3 }));   // 💨 tyre smoke on a hard turn
  push({ x: rx - sa * lat, y: ry + ca * lat, ...back(30 + Math.random() * 30), life: 0.5, max: 0.5, r: 1.6 + Math.random() * 1.6, grow: 3, col: th.dust[Math.floor(Math.random() * th.dust.length)], a: 0.7 });
  if (vh.spray) push({ x: rx - sa * lat * 1.3, y: ry + ca * lat * 1.3, ...back(60), life: 0.4, max: 0.4, r: 2, grow: 5, col: '#FFFFFF', a: 0.55 });
  if (vh.beam) push({ x: c.x + (Math.random() - 0.5) * 20, y: c.y + (Math.random() - 0.5) * 20, vx: 0, vy: 0, life: 0.5, max: 0.5, r: 1.2, grow: 0, col: '#B6FF7A', a: 0.9 });
  if ((vh.puff || vh.stack) && Math.random() < (mine ? 0.5 : 0.3)) { const sx = vh.stack ? c.x + ca * vh.stack[0] * CAR - sa * vh.stack[1] * CAR : rx, sy = vh.stack ? c.y + sa * vh.stack[0] * CAR + ca * vh.stack[1] * CAR : ry; push({ x: sx, y: sy, ...back(vh.stack ? 10 : 40), life: 0.7, max: 0.7, r: 1.8, grow: vh.stack ? 6 : 4, col: vh.stack ? '#4A4A52' : '#8A8F9A', a: 0.45 }); }
  if (mine && g.nitro > 0) push({ x: rx, y: ry, ...back(90), life: 0.3, max: 0.3, r: 1.4, grow: 0, col: Math.random() < 0.5 ? '#FFE36B' : '#FF8A3D', a: 1 });
}
function stepDust(dt) { g.dust.forEach((p) => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.1, dt); p.vy *= Math.pow(0.1, dt); }); g.dust = g.dust.filter((p) => p.life > 0); }
function drawDust() { ctx.lineCap = 'round'; g.dust.forEach((p) => { const u = p.life / p.max; ctx.globalAlpha = p.a * u; if (p.spark) { ctx.strokeStyle = p.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke(); return; } ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + p.grow * (1 - u), 0, 7); ctx.fill(); }); ctx.globalAlpha = 1; ctx.lineCap = 'butt'; }

// ---- the rides, drawn along +x (the nose) in car units (CAR scales them), round the seat where Fig sits
// WHEEL: the car being drawn (its roll for the treads, its steer for the front wheels); SUNL: the sun in the car's own frame
const WHEEL = { roll: 0, st: 0 }, SUNL = { x: 0.6, y: 0.8 };
function wheel(x, y, w, h, tread) {
  const front = x + w / 2 > 0, cx = x + w / 2, cy = y + h / 2;
  ctx.save(); if (front && WHEEL.st) { ctx.translate(cx, cy); ctx.rotate(WHEEL.st * 0.4); ctx.translate(-cx, -cy); }
  ctx.fillStyle = '#121218'; ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.35); ctx.fill();
  const step = 2.2, ph = ((-WHEEL.roll / CAR) % step + step) % step;   // the treads run past as the wheel turns
  ctx.fillStyle = tread ? '#34343E' : '#26262E'; for (let u = x + 0.6 + ph; u < x + w - 0.6; u += step) ctx.fillRect(u, y, 0.9, h);
  ctx.fillStyle = '#ffffff22'; ctx.fillRect(x + 0.5, y, w - 1, Math.min(1, h * 0.25));
  ctx.fillStyle = '#9AA3B2'; ctx.fillRect(cx - 1, cy - 0.6, 2, 1.2);
  ctx.restore();
}
function shadowOf(rx, ry, ox = 2.5, oy = 3.5, a = '42') { const d = Math.hypot(ox, oy) * 1.1; softShadow(SUNL.x * d, SUNL.y * d, rx, ry, Math.min(0.75, parseInt(a, 16) / 255 * 1.9)); }
function drawVehicle(vh, body, dark, light, mine, t, c) {
  switch (vh.key) {
    case 'monster': {
      shadowOf(14, 12);
      ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(-8, 9); ctx.moveTo(8, -9); ctx.lineTo(8, 9); ctx.stroke();
      [[-13, -15], [-13, 9], [3, -15], [3, 9]].forEach(([x, y]) => wheel(x, y, 10, 6, true));
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-12, -9, 24, 18, 4); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-11.5, -8.5, 23, 15.5, 4); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.roundRect(-10, -8, 20, 3, 1.5); ctx.fill();
      ctx.fillStyle = '#FFB000'; ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(11, -3); ctx.lineTo(6, 0); ctx.lineTo(9, 3); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();   // flames on the hood
      ctx.fillStyle = '#1E2A38'; ctx.beginPath(); ctx.roundRect(-7, -6, 9, 12, 3); ctx.fill(); ctx.fillStyle = '#A8E4FF88'; ctx.fillRect(0.5, -5, 1.5, 10);
      ctx.fillStyle = '#FFF2A8'; [-4, 0, 4].forEach((y) => { ctx.beginPath(); ctx.arc(1.5, y, 0.9, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#FF3B3B'; ctx.fillRect(-12.5, -7, 1.5, 3); ctx.fillRect(-12.5, 4, 1.5, 3);
      break; }
    case 'tractor': {
      shadowOf(14, 12);
      wheel(-15, -15, 11, 6, true); wheel(-15, 9, 11, 6, true); wheel(4, -11, 7, 4, true); wheel(4, 7, 7, 4, true);
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-15.5, -10, 12, 3, 1.5); ctx.roundRect(-15.5, 7, 12, 3, 1.5); ctx.fill();   // mudguards
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-2, -5.5, 15, 11, 3); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-2, -5, 14.5, 9.5, 3); ctx.fill(); ctx.fillStyle = light; ctx.fillRect(-1, -4.5, 12, 2);
      ctx.fillStyle = '#2B2B33'; for (let y = -3.5; y <= 3.5; y += 1.75) ctx.fillRect(12, y - 0.4, 1.6, 0.8);   // the grille
      ctx.fillStyle = '#FFF2A8'; ctx.fillRect(12.5, -5, 1.4, 2); ctx.fillRect(12.5, 3, 1.4, 2);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-13, -8, 11, 16, 2.5); ctx.fill(); ctx.fillStyle = '#3A2A20'; ctx.beginPath(); ctx.arc(-6, 0, 4, 0, 7); ctx.fill();   // the open cab and its seat
      ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-2.5, 0, 2.6, 0, 7); ctx.stroke();
      ctx.fillStyle = '#2B2B33'; ctx.beginPath(); ctx.arc(4, -4, 1.7, 0, 7); ctx.fill(); ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(4, -4, 0.8, 0, 7); ctx.fill();   // the exhaust stack
      break; }
    case 'kart': {
      shadowOf(13, 10.5);
      wheel(-12, -12, 7, 4.5, true); wheel(-12, 7.5, 7, 4.5, true); wheel(5, -11, 6, 3.6, true); wheel(5, 7.4, 6, 3.6, true);
      ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.roundRect(-10, -8, 20, 16, 3); ctx.stroke();
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-9, -6, 17, 12, 3); ctx.fill(); ctx.fillStyle = light; ctx.fillRect(-8, -5.5, 15, 2);
      ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(7, -6); ctx.lineTo(14, -3.5); ctx.lineTo(14, 3.5); ctx.lineTo(7, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.stroke();   // the nose fairing
      ctx.fillStyle = '#2B2B33'; ctx.fillRect(-14, -8, 2, 16); ctx.fillStyle = '#8A8F9A'; ctx.fillRect(-9, 4, 5, 3.5);   // the bumper bar and the engine
      ctx.fillStyle = '#1B1B22'; ctx.beginPath(); ctx.ellipse(-3, 0, 4.4, 4, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1B1B22'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(3, 0, 2.6, 0, 7); ctx.stroke();
      ctx.fillStyle = light; ctx.font = '700 5px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(10.5, 0); ctx.rotate(Math.PI / 2); ctx.fillText(mine ? '1' : String(c.n || 2), 0, 0); ctx.restore();
      break; }
    case 'hover': {
      shadowOf(14, 10.5, 4, 6, '34');
      if (c.v > 30) { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1.2; const w = (t / 90) % 1; ctx.beginPath(); ctx.ellipse(0, 0, 15 + w * 5, 11 + w * 4, 0, 0, 7); ctx.stroke(); }
      ctx.fillStyle = '#1B1B22'; ctx.beginPath(); ctx.roundRect(-14, -10.5, 28, 21, 10); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-12.5, -9, 25, 18, 8); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-12, -8.5, 24, 15, 7.5); ctx.fill(); ctx.fillStyle = light; ctx.beginPath(); ctx.roundRect(-9, -8, 18, 2.5, 1.2); ctx.fill();
      [-4.8, 4.8].forEach((y) => { ctx.fillStyle = '#2B2B33'; ctx.beginPath(); ctx.arc(-11.5, y, 4.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#C0C7D2'; ctx.lineWidth = 0.9; ctx.beginPath(); const a = t / 30; for (let k = 0; k < 3; k++) { ctx.moveTo(-11.5, y); ctx.lineTo(-11.5 + Math.cos(a + k * 2.09) * 3.6, y + Math.sin(a + k * 2.09) * 3.6); } ctx.stroke(); });
      ctx.fillStyle = '#A8E4FFaa'; ctx.beginPath(); ctx.ellipse(7, 0, 3.6, 5.2, 0, 0, 7); ctx.fill();
      break; }
    case 'f1': {
      shadowOf(15, 9);
      wheel(-13, -12, 8, 4.8, true); wheel(-13, 7.2, 8, 4.8, true); wheel(5, -11, 6, 3.8, true); wheel(5, 7.2, 6, 3.8, true);
      ctx.fillStyle = dark; ctx.fillRect(-16, -9, 3.5, 18); ctx.fillStyle = light; ctx.fillRect(-16, -9, 3.5, 1.6); ctx.fillRect(-16, 7.4, 3.5, 1.6);   // the rear wing
      ctx.fillStyle = dark; ctx.fillRect(13, -10, 3, 20); ctx.fillStyle = body; ctx.fillRect(13.5, -9.5, 2, 4); ctx.fillRect(13.5, 5.5, 2, 4);   // the front wing
      ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(9, -2.6); ctx.lineTo(3, -3.6); ctx.lineTo(-1, -6.8); ctx.lineTo(-10, -6.2); ctx.lineTo(-13, -3); ctx.lineTo(-13, 3); ctx.lineTo(-10, 6.2); ctx.lineTo(-1, 6.8); ctx.lineTo(3, 3.6); ctx.lineTo(9, 2.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = light; ctx.fillRect(-12, -0.9, 28, 1.8);
      ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(-3, 0, 4.4, -1.2, 1.2); ctx.stroke();   // the halo
      break; }
    case 'ufo': {
      shadowOf(13, 13, 5, 8, '30');
      ctx.fillStyle = '#B6FF7A22'; ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(t / 200) * 1.5, 0, 7); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, 7); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, 12.5, 0, 7); ctx.fill(); ctx.strokeStyle = light; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.stroke();
      ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.arc(-3, -4, 9, 3.6, 5.2); ctx.lineTo(0, 0); ctx.fill();
      for (let k = 0; k < 8; k++) { const a = k * 0.785 + t / 600; ctx.fillStyle = (k + Math.floor(t / 180)) % 3 === 0 ? '#FFFFFF' : ['#FFE36B', '#FF5DA2', '#3DE0FF'][k % 3]; ctx.beginPath(); ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 1.2, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#A8E4FF88'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, 6, 3.6, 5); ctx.stroke();
      break; }
    default: {   // the toy race car
      shadowOf(13, 9);
      [[-9, -10.5], [-9, 7.5], [4, -10.5], [4, 7.5]].forEach(([x, y]) => wheel(x, y, 7, 3.4));
      ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-12.5, -8.5, 25, 17, 5); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-12, -8, 24, 14.5, 5); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.roundRect(-10, -7.5, 20, 3, 1.5); ctx.fill();   // a shine down one side
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-12, -2.4, 24, 1.4); ctx.fillRect(-12, 0.6, 24, 1.4);   // racing stripes
      ctx.fillStyle = dark; ctx.fillRect(-14.5, -8, 3, 16); ctx.fillStyle = light; ctx.fillRect(-14.5, -8, 3, 1.4);   // the spoiler
      ctx.fillStyle = '#A8E4FF'; ctx.beginPath(); ctx.roundRect(4, -6, 4, 12, 1.5); ctx.fill(); ctx.fillStyle = '#ffffffaa'; ctx.fillRect(4.6, -5, 1, 4);   // windscreen
      ctx.fillStyle = '#FFF2A8'; ctx.fillRect(11, -6, 2, 3); ctx.fillRect(11, 3, 2, 3); ctx.fillStyle = '#FF3B3B'; ctx.fillRect(-12.5, -6, 1.5, 3); ctx.fillRect(-12.5, 3, 1.5, 3);
    }
  }
}
// ---------------------------------------------------------------- drawing
// The guards on the table's edge, in this place's skins: band (books, bricks, a ruler, sticky notes, gift boxes, ice
// blocks), rail (a railing, a picket fence, a candy cane, a neon tube), sticks (crayons, pencils, icicles laid end to
// end) and blobs (a hedge, pebbles, a flower bed). Segments far from the car are skipped.
function drawGuards(cx, cy, Rv) {
  const th = TH(), R2 = (Rv + 40) * (Rv + 40);
  [1, -1].forEach((side) => { const rim = g.rims[side], N = rim.length;
    for (let k = 0; k < N - 1; k++) { const a = rim[k], b = rim[k + 1]; if (a.guard === 'open' || b.guard === 'open' || a.m < 2 || Math.hypot(b.x - a.x, b.y - a.y) > 60) continue;
      if ((a.x - cx) * (a.x - cx) + (a.y - cy) * (a.y - cy) > R2) continue;
      const band = (d0, d1) => { ctx.beginPath(); ctx.moveTo(a.x - a.nx * d0, a.y - a.ny * d0); ctx.lineTo(b.x - b.nx * d0, b.y - b.ny * d0); ctx.lineTo(b.x - b.nx * d1, b.y - b.ny * d1); ctx.lineTo(a.x - a.nx * d1, a.y - a.ny * d1); ctx.closePath(); };
      const line = (d) => { ctx.beginPath(); ctx.moveTo(a.x - a.nx * d, a.y - a.ny * d); ctx.lineTo(b.x - b.nx * d, b.y - b.ny * d); };
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, gs = th.guards[a.guard] || th.guards.rail;
      if (!gs.glow) { const gh = gs.k === 'sticks' ? 17 : gs.k === 'rail' ? 7 : gs.h; ctx.fillStyle = '#00000020'; band(gh, gh + 10); ctx.fill(); }   // ambient occlusion: the table darkens into the guard's foot
      if (gs.k === 'band') {
        ctx.fillStyle = '#00000030'; band(gs.h, gs.h + 4); ctx.fill();   // its shadow on the table
        ctx.fillStyle = gs.cols[(gs.pair ? k >> 1 : k) % gs.cols.length]; band(0, gs.h); ctx.fill();
        if (!gs.pair || k % 2 === 0) { ctx.strokeStyle = gs.ice ? '#ffffffaa' : '#00000050'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.nx * gs.h, a.y - a.ny * gs.h); ctx.stroke(); }
        ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 1.2; line(gs.h - 0.8); ctx.stroke();   // the lit top edge
        ctx.strokeStyle = '#00000038'; ctx.lineWidth = 1.2; line(0.8); ctx.stroke();
        if (gs.studs) { ctx.fillStyle = '#ffffff70'; ctx.beginPath(); ctx.arc(mx - a.nx * gs.h / 2, my - a.ny * gs.h / 2, 2.4, 0, 7); ctx.fill(); ctx.strokeStyle = '#00000030'; ctx.lineWidth = 0.6; ctx.stroke(); }
        if (gs.spine) { ctx.fillStyle = '#ffffffaa'; ctx.fillRect(mx - a.nx * gs.h * 0.5 - 1, my - a.ny * gs.h * 0.5 - 1, 2, 2); ctx.strokeStyle = '#00000040'; ctx.lineWidth = 0.7; line(gs.h * 0.25); ctx.stroke(); }
        if (gs.ribbon) { ctx.strokeStyle = gs.ribbon; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - a.nx * gs.h, my - a.ny * gs.h); ctx.stroke(); }
        if (gs.ice) { ctx.fillStyle = '#ffffffcc'; ctx.fillRect(mx - a.nx * gs.h * 0.7 - 1.5, my - a.ny * gs.h * 0.7 - 0.5, 3, 1); }
        if (gs.notes) { ctx.strokeStyle = '#00000022'; ctx.lineWidth = 0.6; line(gs.h * 0.4); ctx.stroke(); line(gs.h * 0.7); ctx.stroke(); }
        if (gs.ticks) { ctx.strokeStyle = '#3A2A00'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let q = 0; q < 4; q++) { const u = q / 4, px = a.x + (b.x - a.x) * u, py = a.y + (b.y - a.y) * u, l = q === 0 ? 6 : q === 2 ? 4.5 : 3; ctx.moveTo(px - a.nx * gs.h, py - a.ny * gs.h); ctx.lineTo(px - a.nx * (gs.h - l), py - a.ny * (gs.h - l)); } ctx.stroke(); }
      } else if (gs.k === 'rail') {
        if (gs.glow) { ctx.lineCap = 'round'; ctx.strokeStyle = gs.col + '30'; ctx.lineWidth = 12; line(5); ctx.stroke(); ctx.strokeStyle = gs.col; ctx.lineWidth = 3.6; line(5); ctx.stroke(); ctx.strokeStyle = '#ffffffdd'; ctx.lineWidth = 1.2; line(5); ctx.stroke(); ctx.lineCap = 'butt'; continue; }
        ctx.strokeStyle = '#00000044'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a.x - a.nx * 4 + 2, a.y - a.ny * 4 + 3); ctx.lineTo(b.x - b.nx * 4 + 2, b.y - b.ny * 4 + 3); ctx.stroke();
        if (gs.pickets) { ctx.fillStyle = '#00000030'; band(10, 13); ctx.fill(); ctx.fillStyle = gs.col; ctx.strokeStyle = '#9A9384'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(mx - 2 * a.tx, my - 2 * a.ty); ctx.lineTo(mx + 2 * a.tx, my + 2 * a.ty); ctx.lineTo(mx + 2 * a.tx - a.nx * 8, my + 2 * a.ty - a.ny * 8); ctx.lineTo(mx - a.nx * 11, my - a.ny * 11); ctx.lineTo(mx - 2 * a.tx - a.nx * 8, my - 2 * a.ty - a.ny * 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.strokeStyle = gs.col; ctx.lineWidth = gs.candy ? 5 : 3.5; line(4); ctx.stroke();
        if (gs.stripe && k % 2) { ctx.strokeStyle = gs.stripe; line(4); ctx.stroke(); }
        if (gs.candy) { ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 1; line(5.2); ctx.stroke(); }
        else if (k % 2 === 0) { ctx.fillStyle = gs.post; ctx.beginPath(); ctx.arc(a.x - a.nx * 4, a.y - a.ny * 4, 3.6, 0, 7); ctx.fill(); ctx.strokeStyle = gs.postRim; ctx.lineWidth = 1; ctx.stroke(); }
      } else if (gs.k === 'sticks') {   // laid end to end: 4 points a stick, a band and a sharpened tip
        for (let row = 0; row < 2; row++) { const d0 = row * 9, d1 = d0 + 8, u = (k + row * 2) % 4, j = Math.floor((k + row * 2) / 4);
          const col = gs.cols[(j + row * 3 + (side > 0 ? 0 : 2)) % gs.cols.length];
          if (u === 3) { ctx.beginPath(); ctx.moveTo(a.x - a.nx * d0, a.y - a.ny * d0); ctx.lineTo(b.x - b.nx * (d0 + d1) / 2, b.y - b.ny * (d0 + d1) / 2); ctx.lineTo(a.x - a.nx * d1, a.y - a.ny * d1); ctx.closePath(); ctx.fillStyle = gs.tip || col; ctx.fill();
            if (gs.tip && !gs.icicle) { ctx.fillStyle = '#2B2B33'; ctx.beginPath(); ctx.arc(b.x - b.nx * (d0 + d1) / 2, b.y - b.ny * (d0 + d1) / 2, 1.2, 0, 7); ctx.fill(); } }
          else { band(d0, d1); ctx.fillStyle = u === 0 && gs.cap ? gs.cap : col; ctx.fill(); if (u === 1 && !gs.icicle) { ctx.fillStyle = '#00000030'; ctx.fill(); } ctx.strokeStyle = gs.icicle ? '#ffffffcc' : '#ffffff55'; ctx.lineWidth = 1; line(d1 - 1.2); ctx.stroke(); } }
      } else {   // blobs: a hedge, pebbles, a flower bed
        ctx.fillStyle = '#00000030'; band(gs.h, gs.h + 4); ctx.fill();
        if (gs.base) { ctx.fillStyle = gs.base; band(0, gs.h); ctx.fill(); }
        [0.3, 0.72].forEach((u, q) => { const px = a.x + (b.x - a.x) * u - a.nx * gs.h * (q ? 0.35 : 0.62), py = a.y + (b.y - a.y) * u - a.ny * gs.h * (q ? 0.35 : 0.62), r = gs.petals ? 2.6 : gs.h * (0.42 + 0.12 * hash(k * 2 + q + side * 7));
          ctx.fillStyle = gs.cols[(k + q) % gs.cols.length];
          if (gs.petals) { for (let p = 0; p < 5; p++) { ctx.beginPath(); ctx.arc(px + Math.cos(p * 1.257) * 2, py + Math.sin(p * 1.257) * 2, 1.6, 0, 7); ctx.fill(); } ctx.fillStyle = '#FFB000'; ctx.beginPath(); ctx.arc(px, py, 1.2, 0, 7); ctx.fill(); }
          else { ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.4, 0, 7); ctx.fill(); } });
      } } });
}
// 🥛 the puddle (milk, juice, rain, coffee, ice, oil): the same ice, skinned by the place
function drawMilk(i, upright, th = TH()) {
  const P = th.puddle, shape = () => { ctx.beginPath(); for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2, rr = i.r * (0.85 + 0.2 * Math.sin(k * 2.7 + i.x)); ctx[k ? 'lineTo' : 'moveTo'](i.x + Math.cos(a) * rr, i.y + Math.sin(a) * rr * 0.72); } ctx.closePath(); };
  ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(i.x + 2, i.y + 3, i.r, i.r * 0.72, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = P.fill; shape(); ctx.fill(); ctx.strokeStyle = P.rim; ctx.lineWidth = 2; ctx.stroke();
  if (P.oil) { ['#FF3DF2', '#FFD23F', '#3DE0FF'].forEach((c, q) => { ctx.strokeStyle = c + '88'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(i.x - 2 + q * 2, i.y - 1 + q, i.r * (0.55 - q * 0.12), i.r * (0.32 - q * 0.07), 0.4, 0, 7); ctx.stroke(); }); }
  else { ctx.fillStyle = P.shine; ctx.beginPath(); ctx.ellipse(i.x - i.r * 0.25, i.y - i.r * 0.15, i.r * 0.35, i.r * 0.2, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.ellipse(i.x - i.r * 0.35, i.y - i.r * 0.22, i.r * 0.12, i.r * 0.06, 0.3, 0, 7); ctx.fill(); }
  upright(i.x + i.r * 0.75, i.y - i.r * 0.55, P.label, 15);
}
function drawHole(i, th = TH()) {
  const [ring, dash, inner] = th.hole;
  ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(i.x + 2, i.y + 3, i.r + 6, 0, 7); ctx.fill();
  ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(i.x, i.y, i.r + 5, 0, 7); ctx.fill();
  ctx.strokeStyle = dash; ctx.lineWidth = 5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(i.x, i.y, i.r + 2.5, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = inner; ctx.beginPath(); ctx.arc(i.x, i.y, i.r, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(i.x + 1.5, i.y + 2, i.r * 0.7, 0, 7); ctx.fill();
  if (th.glow) { ctx.strokeStyle = ring + '55'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(i.x, i.y, i.r + 8, 0, 7); ctx.stroke(); }
}
// 🍞 the ramp: the toaster in the kitchen, a wedge everywhere else (wood, a plank, a ruler, a snow drift, neon)
function drawToaster(i, th = TH()) {
  ctx.save(); ctx.translate(i.x, i.y); ctx.rotate(i.a);
  if (th.ramp === 'wedge') {
    const [c0, c1, c2] = th.rampCol;
    ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.roundRect(-15, -13, 36, 32, 5); ctx.fill();
    if (th.drift) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 17, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#D6E9F7'; ctx.beginPath(); ctx.ellipse(-5, 3, 13, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(4, -2, 12, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9FD8FF'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-4 + k * 6, -5); ctx.lineTo(1 + k * 6, 0); ctx.lineTo(-4 + k * 6, 5); ctx.lineTo(-2 + k * 6, 0); ctx.fill(); } ctx.restore(); return; }
    ctx.fillStyle = c1; ctx.beginPath(); ctx.roundRect(-18, -16, 36, 32, 4); ctx.fill();
    ctx.fillStyle = c0; ctx.beginPath(); ctx.roundRect(-18, -14.5, 34, 29, 4); ctx.fill();
    ctx.fillStyle = '#ffffff30'; ctx.fillRect(4, -14.5, 12, 29);   // the high end catches the light
    if (th.rampTicks) { ctx.strokeStyle = '#3A2A00'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let x = -16; x <= 14; x += 3) { ctx.moveTo(x, -14.5); ctx.lineTo(x, x % 6 === 0 ? -9 : -11.5); } ctx.stroke(); }
    if (th.neonRamp) { ctx.strokeStyle = c2 + '40'; ctx.lineWidth = 6; ctx.strokeRect(-17, -14, 33, 28); }
    ctx.fillStyle = c2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-10 + k * 8, -7); ctx.lineTo(-4 + k * 8, 0); ctx.lineTo(-10 + k * 8, 7); ctx.lineTo(-7 + k * 8, 0); ctx.closePath(); ctx.fill(); }   // chevrons: this way up
    ctx.strokeStyle = th.neonRamp ? c2 : '#00000050'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(-18, -16, 36, 32, 4); ctx.stroke();
    ctx.restore(); return;
  }
  ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.roundRect(-15, -12, 36, 32, 7); ctx.fill();
  ctx.fillStyle = '#9AA3B2'; ctx.beginPath(); ctx.roundRect(-18, -16, 36, 32, 7); ctx.fill();
  ctx.fillStyle = '#D9DEE6'; ctx.beginPath(); ctx.roundRect(-18, -16, 36, 29, 7); ctx.fill(); ctx.strokeStyle = '#8A93A3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(-18, -16, 36, 32, 7); ctx.stroke();
  ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.roundRect(-16, -14, 5, 26, 3); ctx.fill();
  [-8, 3].forEach((y) => { ctx.fillStyle = '#2B2B33'; ctx.beginPath(); ctx.roundRect(-12, y, 24, 6, 2); ctx.fill(); ctx.fillStyle = '#E3A35B'; ctx.beginPath(); ctx.roundRect(-11, y + 0.8, 22, 4.4, 1.5); ctx.fill(); ctx.fillStyle = '#9A5B22'; ctx.fillRect(-11, y + 0.8, 22, 1.1); ctx.fillStyle = '#F6C98A'; ctx.fillRect(-9, y + 2.6, 16, 0.8); });   // toast in the slots
  ctx.fillStyle = '#EE2B3B'; ctx.beginPath(); ctx.roundRect(15, -4, 6, 8, 2); ctx.fill(); ctx.fillStyle = '#ffffff88'; ctx.fillRect(16, -3, 1.5, 6);   // the lever
  ctx.restore();
}
// 📦 the box (a wall): a cereal box, a toy block, a planter, sticky notes, a gift, a neon crate
function drawBox(b, upright, t, th = TH()) {
  const x = b.x - b.w / 2, y = b.y - b.h / 2, kind = th.box, v = Math.floor(hash(Math.round(b.x * 7 + b.y)) * 4);
  ctx.fillStyle = '#00000048'; ctx.beginPath(); ctx.roundRect(x + 4, y + 5, b.w, b.h, 2); ctx.fill();
  if (kind === 'block') {
    const col = ['#EE2B3B', '#2D7FF9', '#22C55E', '#FFD23F'][v]; ctx.fillStyle = '#E8C48E'; ctx.fillRect(x, y, b.w, b.h); ctx.fillStyle = col; ctx.fillRect(x + 2.5, y + 2.5, b.w - 5, b.h - 5); ctx.fillStyle = '#ffffff40'; ctx.fillRect(x + 2.5, y + 2.5, b.w - 5, 2.5); ctx.strokeStyle = '#A07A44'; ctx.lineWidth = 1; ctx.strokeRect(x, y, b.w, b.h);
    upright(b.x, b.y + 0.5, 'ABCD'[v], 11);
  } else if (kind === 'pot') {
    ctx.fillStyle = '#B8562E'; ctx.fillRect(x, y, b.w, b.h); ctx.fillStyle = '#D9713F'; ctx.fillRect(x, y, b.w, 3.5); ctx.fillRect(x, y + b.h - 3.5, b.w, 3.5); ctx.fillStyle = '#4A2C17'; ctx.fillRect(x + 3, y + 4, b.w - 6, b.h - 8);
    ['#FF5DA2', '#FFD23F', '#FF8A3D'].forEach((c, q) => { const fx = x + 6 + q * 7, fy = b.y + (q % 2 ? 2 : -2); ctx.fillStyle = '#3E8A28'; ctx.beginPath(); ctx.ellipse(fx, fy + 1, 3, 1.5, 0.5, 0, 7); ctx.fill(); ctx.fillStyle = c; for (let p = 0; p < 5; p++) { ctx.beginPath(); ctx.arc(fx + Math.cos(p * 1.257) * 1.8, fy + Math.sin(p * 1.257) * 1.8, 1.4, 0, 7); ctx.fill(); } ctx.fillStyle = '#FFF3A8'; ctx.beginPath(); ctx.arc(fx, fy, 0.9, 0, 7); ctx.fill(); });
  } else if (kind === 'notes') {
    ['#8FD8FF', '#FF9EC4'].forEach((c, q) => { ctx.fillStyle = c; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate((q ? -0.12 : 0.1)); ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore(); });
    ctx.fillStyle = '#FFE45C'; ctx.fillRect(x, y, b.w, b.h); ctx.fillStyle = '#F2CF2E'; ctx.fillRect(x, y, b.w, 3); ctx.strokeStyle = '#B8A03A'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let q = 1; q <= 3; q++) { ctx.moveTo(x + 3, y + 3 + q * 3.5); ctx.lineTo(x + b.w - 3 - (q === 3 ? 8 : 0), y + 3 + q * 3.5); } ctx.stroke();
  } else if (kind === 'gift') {
    ctx.fillStyle = ['#E8283C', '#1F8A4C', '#2D7FF9', '#A855F7'][v]; ctx.fillRect(x, y, b.w, b.h); ctx.fillStyle = '#ffffff30'; ctx.fillRect(x, y, b.w, 3);
    ctx.fillStyle = '#FFD23F'; ctx.fillRect(b.x - 1.8, y, 3.6, b.h); ctx.fillRect(x, b.y - 1.8, b.w, 3.6);
    ctx.beginPath(); ctx.ellipse(b.x - 3.5, b.y - 1, 3.5, 2.2, 0.5, 0, 7); ctx.ellipse(b.x + 3.5, b.y - 1, 3.5, 2.2, -0.5, 0, 7); ctx.fill(); ctx.fillStyle = '#C79A12'; ctx.beginPath(); ctx.arc(b.x, b.y, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, b.w, 2);   // a cap of snow
  } else if (kind === 'crate') {
    ctx.fillStyle = '#1E1838'; ctx.fillRect(x, y, b.w, b.h); ctx.strokeStyle = '#3DE0FF40'; ctx.lineWidth = 5; ctx.strokeRect(x, y, b.w, b.h); ctx.strokeStyle = '#3DE0FF'; ctx.lineWidth = 1.4; ctx.strokeRect(x, y, b.w, b.h);
    ctx.strokeStyle = '#FF3DF2'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + b.w - 2, y + b.h - 2); ctx.moveTo(x + b.w - 2, y + 2); ctx.lineTo(x + 2, y + b.h - 2); ctx.stroke();
  } else {
    ctx.fillStyle = '#EE2B3B'; ctx.fillRect(x, y, b.w, b.h); ctx.fillStyle = '#ffffff28'; ctx.fillRect(x, y, b.w, 3);
    ctx.fillStyle = '#FFD23F'; ctx.fillRect(x, y + b.h * 0.62, b.w, b.h * 0.2);
    ctx.strokeStyle = '#A3121F'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, b.y - 1); ctx.lineTo(x + b.w, b.y - 1); ctx.stroke();   // the lid's flaps
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, b.w, b.h);
    upright(b.x, b.y, '🥣', 12);
  }
  if (b.hit) {   // dented by your car: a crack and a pulsing outline say it can be smashed now
    ctx.strokeStyle = '#2A0A0E'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + b.w * 0.15, y); ctx.lineTo(x + b.w * 0.35, y + b.h * 0.45); ctx.lineTo(x + b.w * 0.25, y + b.h * 0.6); ctx.lineTo(x + b.w * 0.45, y + b.h); ctx.stroke();
    ctx.strokeStyle = `rgba(255, 236, 120, ${0.55 + 0.45 * Math.sin(t / 120)})`; ctx.lineWidth = 2.5; ctx.strokeRect(x - 3, y - 3, b.w + 6, b.h + 6);
  }
}
// 🥤 a solid thing, drawn with height: its shadow cast away from the sun (the footprint swept that way, one flat fill), its
// sides (the footprint swept up to its top, which leans away from the middle of the view, the way a camera over the table
// sees a tall thing) and its top, the cached sprite. A knock sets it wobbling.
function hull(P) {   // the convex hull of a few points (monotone chain)
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function footSweep(o, dx, dy) {   // the footprint swept by (dx, dy): a stadium for a round thing, the hull of two boxes for a square one
  ctx.beginPath();
  if (o.shape === 'c') { const r = o.cr; if (Math.hypot(dx, dy) < 0.5) { ctx.arc(o.x, o.y, r, 0, 7); return; } const th = Math.atan2(dy, dx); ctx.arc(o.x, o.y, r, th + Math.PI / 2, th + Math.PI * 1.5); ctx.arc(o.x + dx, o.y + dy, r, th - Math.PI / 2, th + Math.PI / 2); ctx.closePath(); return; }
  const ca = Math.cos(o.a), sa = Math.sin(o.a), P = [];
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v]) => { const x = o.x + ca * u * o.hx - sa * v * o.hy, y = o.y + sa * u * o.hx + ca * v * o.hy; P.push([x, y], [x + dx, y + dy]); });
  hull(P).forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath();
}
function drawSolid(o, vc, sun, t) {
  const dx = o.x - vc.x, dy = o.y - vc.y, d = Math.hypot(dx, dy) || 1, lean = Math.min(o.h * 0.6, d * o.h * g.zoom / 620), lx = dx / d * lean, ly = dy / d * lean;
  ctx.fillStyle = '#00000038'; footSweep(o, sun.x * o.h * 0.8, sun.y * o.h * 0.8); ctx.fill();
  ctx.fillStyle = o.side; footSweep(o, lx, ly); ctx.fill(); ctx.strokeStyle = '#00000048'; ctx.lineWidth = 1.2; ctx.stroke();
  if (lean > 1.5) { ctx.strokeStyle = o.sideLit; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(o.x - sun.x * o.cr * 0.9, o.y - sun.y * o.cr * 0.9); ctx.lineTo(o.x - sun.x * o.cr * 0.9 + lx, o.y - sun.y * o.cr * 0.9 + ly); ctx.stroke(); }   // a glint up the lit side
  const wb = o.wob > 0 && !host.reduceMotion ? o.wob * Math.sin(t / 28) : 0, s = o.r * 1.15;
  ctx.save(); ctx.translate(o.x + lx + wb * 2.5, o.y + ly); ctx.rotate(o.a + wb * 0.08); ctx.drawImage(sprite(o.kind), -s, -s, s * 2, s * 2); ctx.restore();
}
// 🪖 the bump (the soldier): an army man, a teddy, a gnome, a rubber duck, a snowman, a robot
function drawSoldier(o, t, th = TH()) {
  const x = o.x, y = o.y, ring = (r, f, s, lw = 1.5) => { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); if (s) { ctx.strokeStyle = s; ctx.lineWidth = lw; ctx.stroke(); } }, dot = (dx, dy, r, f) => { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); };
  ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(x + 2, y + 3, 11.5, 0, 7); ctx.fill();
  switch (th.bump) {
    case 'teddy': dot(-7, -7, 4, '#8A5A2B'); dot(7, -7, 4, '#8A5A2B'); dot(-7, -7, 2, '#E7B98A'); dot(7, -7, 2, '#E7B98A'); ring(10, '#A26A34', '#6E431C'); dot(0, 3, 4.5, '#E7B98A'); dot(-3.5, -2, 1.3, '#1B1B22'); dot(3.5, -2, 1.3, '#1B1B22'); dot(0, 1.6, 1.4, '#3A2414'); break;
    case 'gnome': ring(10.5, '#2F6B9A', '#1E4566'); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y + 2, 8, 0.1, Math.PI - 0.1); ctx.fill(); ring(6.5, '#E8283C', '#9A1020'); dot(-1.5, -1.5, 2, '#FF6B7A'); dot(0, 5.5, 1.6, '#F2B48A'); break;
    case 'duck': ctx.fillStyle = '#FFD23F'; ctx.strokeStyle = '#C79A12'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x - 2, y + 1, 10, 8, 0, 0, 7); ctx.fill(); ctx.stroke(); ring(5.5, '#FFE36B', '#C79A12', 1.2); ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.moveTo(x + 4.5, y - 2); ctx.lineTo(x + 9, y); ctx.lineTo(x + 4.5, y + 2); ctx.fill(); dot(1.5, -2.2, 1.1, '#1B1B22'); break;
    case 'snowman': ring(11, '#FFFFFF', '#B5D3EA'); ring(7.5, '#F4FAFF', '#C9DFF0', 1); ring(4.5, '#FFFFFF', '#C9DFF0', 1); ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.moveTo(x + 2, y - 1); ctx.lineTo(x + 8, y); ctx.lineTo(x + 2, y + 1); ctx.fill(); dot(-1.3, -1.4, 0.8, '#1B1B22'); dot(-1.3, 1.4, 0.8, '#1B1B22'); ctx.strokeStyle = '#E8283C'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 2.2, 4); ctx.stroke(); break;
    case 'robot': { ctx.fillStyle = '#8A93A3'; ctx.strokeStyle = '#4A5160'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(x - 9, y - 9, 18, 18, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#C0C7D2'; ctx.fillRect(x - 9, y - 9, 18, 3); ctx.fillStyle = '#0A0414'; ctx.fillRect(x - 6, y - 3, 12, 5); const bl = Math.sin(t / 150) > 0; ctx.fillStyle = '#3DE0FF'; ctx.fillRect(x - 5, y - 2, 3, 3); ctx.fillRect(x + 2, y - 2, 3, 3); dot(0, -11, 2, bl ? '#FF3DF2' : '#5A1A55'); break; }
    default: ring(11, '#3E8E2C', '#24561A'); ctx.fillStyle = '#6BCB4A'; ctx.beginPath(); ctx.ellipse(x, y, 8, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#24561A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 4, y - 2); ctx.lineTo(x + 13, y - 9); ctx.stroke(); ring(4.5, '#7FDB5C', '#24561A'); dot(-1.4, -1.4, 1.3, '#B9F18C');
  }
}
// 🛏️ the roofs over the tunnels: a bed's underside (slats), a laptop (rows of keys), a concrete underpass (neon at its mouths)
const ROOFS = {
  bed: { body: '#5B44A8', slat: '#2E2160', sw: 7, mouth: '#8A5A2B', mw: 16, trim: '#C9B8FF' },
  laptop: { body: '#A9B1BE', slat: '#2B2F3A', sw: 10, mouth: '#D9DEE6', mw: 14, trim: '#3DE0FF' },
  overpass: { body: '#2E2A44', slat: '#1E1A30', sw: 6, mouth: '#FF3DF2', mw: 10, trim: '#FF3DF2', glow: true },
};
const subPath = (arr, i0, i1) => { const p = new Path2D(); for (let i = i0; i <= i1; i++) p[i > i0 ? 'lineTo' : 'moveTo'](arr[i].x, arr[i].y); return p; };
// 🗺️ the track map: the whole route in a corner panel, each section in its colour, the finish flag at the top; dots for
// the cars move along it. The route and its panel are painted once a course into an offscreen canvas.
function mapRect(Hh) { const w = 54, h = Math.round(Math.min(230, Hh * 0.3)); return { x: Math.round(W - w - 6), y: Math.round(Math.max(96, Hh * 0.13)), w, h }; }
function buildMap(R0, k, key) {
  const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(R0.w * k)); c.height = Math.max(2, Math.round(R0.h * k)); const x = c.getContext('2d'); x.scale(k, k);
  const pts = g.track.pts; let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9; pts.forEach((p) => { bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); by0 = Math.min(by0, p.y); by1 = Math.max(by1, p.y); });
  const left = 15, right = 6, top = 13, bot = 9, sc = Math.min((R0.w - left - right) / Math.max(1, bx1 - bx0), (R0.h - top - bot) / Math.max(1, by1 - by0));
  const ox = left + ((R0.w - left - right) - (bx1 - bx0) * sc) / 2, oy = top + ((R0.h - top - bot) - (by1 - by0) * sc) / 2, loc = (px, py) => [ox + (px - bx0) * sc, oy + (py - by0) * sc];
  x.fillStyle = '#0B0918B8'; x.strokeStyle = '#FFFFFF38'; x.lineWidth = 1; x.beginPath(); x.roundRect(0.5, 0.5, R0.w - 1, R0.h - 1, 10); x.fill(); x.stroke();
  x.lineCap = 'round'; x.lineJoin = 'round';
  const n = pts.length, idx = (s) => Math.max(0, Math.min(n - 1, Math.round(s * (n - 1))));
  const line = (i0, i1) => { x.beginPath(); for (let i = i0; i <= i1; i++) { const [a, b] = loc(pts[i].x, pts[i].y); x[i > i0 ? 'lineTo' : 'moveTo'](a, b); } };
  line(0, n - 1); x.strokeStyle = '#000000AA'; x.lineWidth = 4.6; x.stroke();
  g.secs.forEach((sc2) => { line(idx(sc2.s0), idx(sc2.s1)); x.strokeStyle = sc2.col; x.lineWidth = 2.6; if (sc2.kind === 'tunnel') x.setLineDash([3, 2.5]); x.stroke(); x.setLineDash([]);
    const [a, b] = loc(pts[idx(sc2.s0)].x, pts[idx(sc2.s0)].y); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(a, b, 1.3, 0, 7); x.fill();
    const [, bm] = loc(0, pts[idx((sc2.s0 + sc2.s1) / 2)].y); x.font = '9px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sc2.icon, 7.5, bm); });
  g.islands.forEach((isl) => { const p = at(isl.s), [a, b] = loc(p.x, p.y); x.fillStyle = '#FFFFFF'; x.beginPath(); x.ellipse(a, b, 1.6, 3.2, p.a + Math.PI / 2, 0, 7); x.fill(); });
  { const p = at(FINISH), [a, b] = loc(p.x, p.y); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#FFF'; x.fillRect(a - 5 + i * 2.5, b - 4 - j * 2.5, 2.5, 2.5); } x.strokeStyle = '#FFFFFF'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(a - 5, b + 1); x.lineTo(a - 5, b - 9); x.stroke(); }
  return { key, c, loc: (px, py) => { const [a, b] = loc(px, py); return [R0.x + a, R0.y + b]; } };
}
function drawMap(t, Hh) {
  const R0 = mapRect(Hh), key = `${g.course}|${g.seed}|${R0.x}|${R0.y}|${R0.w}|${R0.h}|${host.k.toFixed(2)}`;
  if (!g.map || g.map.key !== key) g.map = buildMap(R0, host.k, key);
  const M = g.map; ctx.drawImage(M.c, R0.x, R0.y, R0.w, R0.h);
  const pts = g.track.pts, i1 = Math.min(pts.length - 1, Math.round(clamp01(g.me.s) * (pts.length - 1)));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#FFFFFFdd'; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let i = 0; i <= i1; i += 2) { const [a, b] = M.loc(pts[i].x, pts[i].y); ctx[i ? 'lineTo' : 'moveTo'](a, b); } { const [a, b] = M.loc(g.me.x, g.me.y); ctx.lineTo(a, b); } ctx.stroke();
  g.rivals.forEach((r) => { if (r.out > 0) return; const [a, b] = r.done ? M.loc(at(FINISH).x, at(FINISH).y) : M.loc(r.x, r.y); ctx.fillStyle = `hsl(${r.hue} 90% 60%)`; ctx.strokeStyle = '#000000'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(a, b, 2.4, 0, 7); ctx.fill(); ctx.stroke(); });
  const [a, b] = M.loc(g.me.x, g.me.y), pu = host.reduceMotion ? 0 : Math.sin(t / 160);
  ctx.fillStyle = '#22E0C855'; ctx.beginPath(); ctx.arc(a, b, 5.5 + pu, 0, 7); ctx.fill(); ctx.fillStyle = '#22E0C8'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(a, b, 3.3, 0, 7); ctx.fill(); ctx.stroke();
}
function draw(t) {
  W = host?.W || W;
  const k = host.k, Hh = H(), me = g?.me;
  ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0);
  ctx.fillStyle = '#B4662A'; ctx.fillRect(0, 0, W, Hh);
  if (!g) return;
  const sp = Math.min(1, Math.abs(me.v || 0) / topSpeed()); const OFF = window.__rlOff || {};
  // the camera: on you, the table turning under the window; 🏎️ flat out it pulls back a touch (more on nitro)
  const zt = camZoom() * (1 - 0.08 * sp * sp - (g.nitro > 0 ? 0.05 : 0));
  g.zoom = g.zoom ? g.zoom + (zt - g.zoom) * 0.02 : zt;
  // 🎥 the chase camera: top-down, but turned so the car always points up the screen, following it from behind (eased, so a
  // spin doesn't whirl the whole table); the window's table spin adds its own turn on top
  // 🧭 the guide: the view turns toward where the road goes, not just where the car points. It aims at a blend of two
  // spots up the tape (near and far, GUIDE) and a share of the car's heading, so a bend ahead already leans the top
  // of the screen into it; a spinning or carried car doesn't whirl the table round.
  { const L = g.track.len, look = (d) => at(me.s + g.dir * d / L), near = look(GUIDE.near), far = look(GUIDE.far), hw = (me.spin > 0 || me.fall > 0 || me.rescue) ? 0 : GUIDE.heading;
    const v1x = near.x - me.x, v1y = near.y - me.y, n1 = Math.hypot(v1x, v1y) || 1, v2x = far.x - me.x, v2y = far.y - me.y, n2 = Math.hypot(v2x, v2y) || 1;
    const vx = (v1x / n1) * 0.45 + (v2x / n2) * 0.55, vy = (v1y / n1) * 0.45 + (v2y / n2) * 0.55, gn = Math.hypot(vx, vy) || 1;
    const bx = (vx / gn) * (1 - hw) + Math.cos(me.a) * hw, by = (vy / gn) * (1 - hw) + Math.sin(me.a) * hw;
    const want = -(Math.atan2(by, bx) + Math.PI / 2); g.guideA = Math.atan2(vy, vx); if (g.camA == null) g.camA = want; const da = ((want - g.camA + Math.PI * 3) % (Math.PI * 2)) - Math.PI; g.camA += da * Math.min(1, 0.07); }
  const vc = toTable({ x: W / 2, y: Hh * 0.5 });   // the middle of the view, on the table (tall things lean away from it)
  ctx.save(); ctx.translate(W / 2, Hh * CAR_Y); if (g.shake > 0.05) ctx.translate((Math.random() - 0.5) * 2 * g.shake, (Math.random() - 0.5) * 2 * g.shake); ctx.scale(g.zoom, g.zoom); ctx.rotate(g.camA + (g.turn || 0)); ctx.translate(-me.x, -me.y);
  const Rv = Math.hypot(W, Hh) / g.zoom, gx0 = Math.floor((me.x - Rv) / 60) * 60, gy0 = Math.floor((me.y - Rv) / 60) * 60;   // the table under a turning camera: a disc's worth of grain
  const th = TH(), vh = VH(), L = g.track.len, tw = g.track.w, sun = g.sun;
  // only what's in view: the road climbs (y falls) all the way, so the points within reach in y are one run of each list
  const lim = Rv + 160, span = (arr) => { let a = -1, b = -1; for (let i = 0; i < arr.length; i++) if (Math.abs(arr[i].y - me.y) < lim) { if (a < 0) a = i; b = i; } return a < 0 ? [0, arr.length - 1] : [Math.max(0, a - 1), Math.min(arr.length - 1, b + 1)]; };
  const [w0, w1] = span(g.track.pts), nP = g.track.n, idx = (s) => Math.max(0, Math.min(nP - 1, Math.round(s * (nP - 1)))), vs0 = w0 / (nP - 1), vs1 = w1 / (nP - 1);
  const vis = g.secs.filter((sc) => sc.s1 + 0.05 >= vs0 && sc.s0 - 0.05 <= vs1);
  // the table, which runs on past the guards (the scenery stands there) and ends at the open stretches and the bridges
  const rimP = new Path2D(); { const r1 = g.drims[1], r2 = g.drims[-1], [a1, b1] = span(r1), [a2, b2] = span(r2); for (let i = a1; i <= b1; i++) rimP[i > a1 ? 'lineTo' : 'moveTo'](r1[i].x, r1[i].y); for (let i = b2; i >= a2; i--) rimP.lineTo(r2[i].x, r2[i].y); rimP.closePath(); }
  // the floor, a long way down: only where neither the table nor a bridge's gap covers it (even-odd), so the view isn't
  // painted twice over
  { const fp = new Path2D(); fp.rect(gx0, gy0, Rv * 2 + 120, Rv * 2 + 120); fp.addPath(rimP); vis.forEach((sc) => { if (sc.gapP && !OFF.gap) fp.addPath(sc.gapP); }); ctx.fillStyle = tex(th.floor); ctx.fill(fp, 'evenodd'); }
  // 🌉 the gap under a bridge: the sink, the pond, a long drop
  vis.forEach((sc) => { if (!sc.gapP || OFF.gap) return; ctx.fillStyle = tex(sc.gap.tile); ctx.fill(sc.gapP); ctx.lineJoin = 'round'; ctx.strokeStyle = sc.gap.rim[1]; ctx.lineWidth = 16; ctx.stroke(sc.gapP); ctx.strokeStyle = sc.gap.rim[0]; ctx.lineWidth = 7; ctx.stroke(sc.gapP); });
  // the table's shadow on the floor (away from the sun) and its thickness: only the strip past the edge shows (the top is
  // painted over the rest), so each is a stroke along the edge shifted half way, as wide as the shift, not a fill
  ctx.lineJoin = 'round';
  if (!OFF.tshadow) { ctx.save(); ctx.strokeStyle = '#00000070'; ctx.lineWidth = 22; ctx.translate(sun.x * 11, sun.y * 11); ctx.stroke(rimP); ctx.restore(); }
  ctx.save(); ctx.strokeStyle = th.side; ctx.lineWidth = 6; ctx.translate(sun.x * 3, sun.y * 3); ctx.stroke(rimP); ctx.restore();
  // the table top, and each section's ground on it (the placemat, the chopping board, the lego baseplate…) laid along the
  // road: the table's surface is filled round the patches (even-odd), so no pixel is painted twice
  ctx.save(); if (!OFF.clip) ctx.clip(rimP);
  { const pat = OFF.patch ? [] : vis.filter((sc) => sc.patch), tp = new Path2D(); tp.rect(gx0, gy0, Rv * 2 + 120, Rv * 2 + 120); pat.forEach((sc) => tp.addPath(sc.patch));
    ctx.fillStyle = tex(th.surf); ctx.fill(tp, 'evenodd');
    pat.forEach((sc) => { ctx.fillStyle = tex(sc.ground); ctx.fill(sc.patch); ctx.lineJoin = 'round'; ctx.strokeStyle = '#00000040'; ctx.lineWidth = 3; ctx.stroke(sc.patch); ctx.strokeStyle = '#FFFFFF30'; ctx.lineWidth = 1; ctx.stroke(sc.patch); }); }
  if (!OFF.decor) g.decor.forEach((d) => { if (Math.abs(d.x - me.x) < Rv && Math.abs(d.y - me.y) < Rv) drawDecor(d, t); });
  ctx.restore();
  ctx.lineJoin = 'round'; ctx.strokeStyle = th.edge[0]; ctx.lineWidth = 7; ctx.stroke(rimP); ctx.strokeStyle = th.edge[1]; ctx.lineWidth = 1.5; ctx.stroke(rimP);   // the table's edge
  // 🏰 the set pieces beside the road, each with a soft shadow away from the sun
  g.pieces.forEach((p) => { if (OFF.pieces || p.island || Math.abs(p.x - me.x) > Rv + p.r || Math.abs(p.y - me.y) > Rv + p.r) return; const P = PIECES[p.kind], hgt = P.h * p.r / P.r;
    softShadow(p.x + sun.x * hgt * 0.5, p.y + sun.y * hgt * 0.5, p.r * 0.95, p.r * 0.95, 0.42);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); const s = p.r / 50 * 1.15 * 50; ctx.drawImage(sprite(p.kind), -s, -s, s * 2, s * 2); ctx.restore(); });
  // the road: a shoulder, its shadow, then each section in its own surface and kerbs (dashes keep their phase:
  // lineDashOffset = where the piece starts)
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  // its shadow: only the strip beyond the kerbs shows, so two 8-wide lines along the edges (shifted toward the shade), not a
  // stroke the whole width of the road
  ctx.strokeStyle = '#00000048'; ctx.lineWidth = 8; ctx.save(); ctx.translate(sun.x * 7, sun.y * 7); g.track.off.shoulder.forEach((o) => ctx.stroke(subPath(o, w0, w1))); ctx.restore();
  if (th.glow) { ctx.strokeStyle = th.kerb[0] + '30'; ctx.lineWidth = 18; g.track.off.shoulder.forEach((o) => ctx.stroke(subPath(o, w0, w1))); }   // the neon's glow past the kerbs
  (OFF.road ? [] : vis).forEach((sc) => { const i0 = Math.max(w0, idx(sc.s0)), i1 = Math.min(w1, idx(sc.s1) + 1); if (i1 <= i0) return;
    const st = roadStyle(sc, th), P = subPath(g.track.pts, i0, i1), d0 = g.track.cum[i0], sk = () => ctx.stroke(P), O = g.track.off;
    // the edges are narrow lines along prebuilt offset lines (dashes phased by each line's own length), so the road is
    // one full-width stroke (the tape) and everything else is thin
    const edge = (pr, lw, col, dash, ph = 0) => { ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); pr.forEach((o) => { if (dash) ctx.lineDashOffset = o.c[i0] + ph; ctx.stroke(subPath(o, i0, i1)); }); if (dash) { ctx.setLineDash([]); ctx.lineDashOffset = 0; } };
    ctx.strokeStyle = tex(st.tape); ctx.lineWidth = tw; sk();
    if (st.sheen) { ctx.strokeStyle = st.sheen; ctx.lineWidth = tw * 0.42; sk(); }
    if (st.wear && !OFF.wear) edge(O.wear, 16, '#0000001c');   // worn racing lines
    if (st.paint && !OFF.paint) edge(O.paint, 1.6, st.paint);   // painted edge lines
    edge(O.kerb, 8.5, st.kerb[0]); edge(O.kerb, 8.5, st.kerb[1], [14, 14]);
    edge(O.light, 5, '#ffffff40', [12, 16], -1); edge(O.dark, 1.5, '#00000055'); edge(O.tedge, 2.5, st.tapeEdge); edge(O.kerbEdge, 2, st.kerbEdge);
    if (st.centre) { if (th.glow) { ctx.strokeStyle = st.centre + '30'; ctx.lineWidth = 10; sk(); } ctx.strokeStyle = st.centre; ctx.lineWidth = 3; ctx.setLineDash([16, 12]); ctx.lineDashOffset = d0; sk(); ctx.setLineDash([]); ctx.lineDashOffset = 0; }
    if (sc.kind === 'bridge') { ctx.strokeStyle = '#00000030'; ctx.lineWidth = tw - 5; ctx.setLineDash([2, 10]); ctx.lineDashOffset = d0; sk(); ctx.setLineDash([]); ctx.lineDashOffset = 0; } });
  // 🛞 the skid marks, kept for the course
  if (!OFF.skids) { const sp2 = new Path2D(); let any = false; g.skids.forEach((s) => { if (Math.abs(s[1] - me.y) > lim) return; sp2.moveTo(s[0], s[1]); sp2.lineTo(s[2], s[3]); any = true; }); if (any) { ctx.lineCap = 'round'; ctx.strokeStyle = th.skid || '#00000055'; ctx.lineWidth = 3.2; ctx.stroke(sp2); ctx.lineCap = 'butt'; } }
  const across = (sk, rows, sq) => { const p = at(sk), n = { x: Math.cos(p.a + Math.PI / 2), y: Math.sin(p.a + Math.PI / 2) }, cols = Math.round(g.track.w / sq), w2 = g.track.w / cols;   // a chequered band across the road
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'; ctx.save(); ctx.translate(p.x + n.x * (i - cols / 2 + 0.5) * w2 + Math.cos(p.a) * (j - rows / 2 + 0.5) * sq, p.y + n.y * (i - cols / 2 + 0.5) * w2 + Math.sin(p.a) * (j - rows / 2 + 0.5) * sq); ctx.rotate(p.a); ctx.fillRect(-sq / 2, -w2 / 2, sq, w2); ctx.restore(); } };
  across(sOf(GRID - 26), 1, 10); across(FINISH, 3, 15);   // the start line behind the grid, the big finish
  { const p = at(0), n = { x: Math.cos(p.a + Math.PI / 2), y: Math.sin(p.a + Math.PI / 2) }, half = g.track.w / 2 + MARGIN;   // the wall that closes the road behind the grid
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); for (let i = -half; i < half; i += 14) { ctx.fillStyle = ['#EE2B3B', '#FFD23F', '#2D7FF9', '#22C55E'][((i + half) / 14 | 0) % 4]; ctx.fillRect(-12, i, 12, 13); } ctx.restore(); }
  const upright = (x, y, ch, size) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-(g.camA + (g.turn || 0))); ctx.font = `${size}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 0); ctx.restore(); };
  // 🗺️ where a section starts: a stripe across the road in its colour and its sign on both sides
  (OFF.signs ? [] : vis).forEach((sc) => { if (!sc.i || sc.s0 < vs0 - 0.02 || sc.s0 > vs1 + 0.02) return; const p = at(sc.s0), nx = Math.cos(p.a + Math.PI / 2), ny = Math.sin(p.a + Math.PI / 2), h2 = tw / 2;
    ctx.lineCap = 'butt'; ctx.strokeStyle = '#00000060'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(p.x - nx * h2, p.y - ny * h2); ctx.lineTo(p.x + nx * h2, p.y + ny * h2); ctx.stroke(); ctx.strokeStyle = sc.col; ctx.lineWidth = 4; ctx.stroke();
    [1, -1].forEach((sd) => { const o = h2 + 30, x = p.x + nx * o * sd, y = p.y + ny * o * sd; ctx.fillStyle = '#0B0918cc'; ctx.strokeStyle = sc.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill(); ctx.stroke(); upright(x, y + 0.5, sc.icon, 15); }); });
  // 🪂 the open stretches: the rim right at the tape (over the kerb), a hazard line and a warning sign
  (g.edges || []).forEach((e) => { const N = 18, line = []; for (let q = 0; q <= N; q++) { const sk = e.s0 + (e.s1 - e.s0) * q / N, p = at(sk), nx = -Math.sin(p.a) * e.side, ny = Math.cos(p.a) * e.side; line.push([p.x + nx * g.track.w / 2, p.y + ny * g.track.w / 2, nx, ny]); }
    const pl = (o) => { ctx.beginPath(); line.forEach(([x, y, nx, ny], q) => ctx[q ? 'lineTo' : 'moveTo'](x + nx * o, y + ny * o)); };
    ctx.lineCap = 'butt'; ctx.strokeStyle = th.edge[0]; ctx.lineWidth = 10; pl(4); ctx.stroke(); ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); pl(0); ctx.stroke(); ctx.setLineDash([]);
    const [mx, my, nx, ny] = line[N >> 1]; upright(mx + nx * 30, my + ny * 30, '⚠️', 16); });
  // 🧱 the guards along the rest of the edge
  if (!OFF.guards) drawGuards(me.x, me.y, Rv);
  { const p = at(FINISH), off = g.track.w / 2 + 22; [1, -1].forEach((sd) => upright(p.x + Math.cos(p.a + Math.PI / 2) * off * sd, p.y + Math.sin(p.a + Math.PI / 2) * off * sd, '🏁', 22)); }
  // 🍎 the islands: a kerbed lens in the road with the big thing on it, and arrows painted where the road splits
  g.islands.forEach((isl) => { if (Math.abs(isl.s - me.s) * L > Rv + isl.lh + 120) return; const st = roadStyle(g.secs[isl.sec], th);
    [-1, 1].forEach((sd) => { const s = isl.s - (isl.lh + 50) / L, p = spotOn(s, sd * tw * 0.2), a = at(s).a + sd * 0.35; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = '#FFFFFFcc'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-2, -9); ctx.lineTo(-2, -4); ctx.lineTo(-14, -4); ctx.lineTo(-14, 4); ctx.lineTo(-2, 4); ctx.lineTo(-2, 9); ctx.closePath(); ctx.fill(); ctx.restore(); });
    ctx.lineJoin = 'round'; ctx.save(); ctx.translate(sun.x * 5, sun.y * 5); ctx.fillStyle = '#00000050'; ctx.fill(isl.path); ctx.restore();
    ctx.strokeStyle = st.kerbEdge; ctx.lineWidth = 12; ctx.stroke(isl.path); ctx.strokeStyle = st.kerb[0]; ctx.lineWidth = 8; ctx.stroke(isl.path); ctx.strokeStyle = st.kerb[1]; ctx.setLineDash([9, 9]); ctx.stroke(isl.path); ctx.setLineDash([]);
    ctx.fillStyle = tex(th.surf); ctx.fill(isl.path); ctx.strokeStyle = '#00000030'; ctx.lineWidth = 3; ctx.stroke(isl.path);
    if (isl.solid) drawSolid(isl.solid, vc, sun, t); });
  if (!OFF.arms) drawArmsLow(t, me, Rv, g.camA + (g.turn || 0));   // ⏩ pads, 🐢 patches, 🍌 slicks, 🪤 traps on the road, ❓ crates
  // hazards, each drawn as the thing it is (a label stands upright on the milk and the boxes, whichever way the table turns)
  g.items.forEach((i) => { if (i.kind === 'milk') drawMilk(i, upright, th); else if (i.kind === 'hole') drawHole(i, th); else if (i.kind === 'toaster') drawToaster(i, th); else if (i.kind === 'box') drawBox(i, upright, t, th); });
  g.obs.forEach((o) => { if (o.kind === 'box') drawBox(o, upright, t, th); else drawSoldier(o, t, th); });
  // 🚧 the obstacles standing on the road
  g.solids.forEach((o) => { if (!o.island && Math.abs(o.x - me.x) < Rv + o.r && Math.abs(o.y - me.y) < Rv + o.r) drawSolid(o, vc, sun, t); });
  drawDust();
  g.pennies.forEach((p) => { const r = 6 + Math.sin(t / 150 + p.t) * 1; ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.arc(p.x + 1.5, p.y + 2, r, 0, 7); ctx.fill(); ctx.fillStyle = '#E08A3C'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#FFD27A'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.28, 0, 7); ctx.fill(); });
  if (g.paw) { const p = at(g.paw.s); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a + Math.PI / 2); ctx.fillStyle = '#F29E4C'; ctx.fillRect(-30, 0, 60, 300); ctx.beginPath(); ctx.ellipse(0, 0, 30, 22, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#C4621B'; for (let i = 0; i < 6; i++) ctx.fillRect(-30, 18 + i * 40, 60, 12); ctx.fillStyle = '#FF9EB5'; ctx.beginPath(); ctx.ellipse(0, 4, 12, 9, 0, 0, 7); ctx.fill(); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 11, -11, 5.5, 0, 7); ctx.fill(); } ctx.fillStyle = '#fff'; for (let i = -1.5; i <= 1.5; i++) { ctx.beginPath(); ctx.moveTo(i * 9 - 2, -20); ctx.lineTo(i * 9, -28); ctx.lineTo(i * 9 + 2, -20); ctx.fill(); } ctx.restore(); }
  // the cars
  const cth = g.camA + (g.turn || 0), upX = -Math.sin(cth), upY = -Math.cos(cth);   // screen-up, on the table
  const dk = Math.max(g.dark, g.dimNow || 0);
  const car = (c, hue, mine) => { const re = c.rescue ? Math.min(1, c.rescue.t / RESCUE) : -1, lift = re >= 0 ? 34 * Math.sin(re * Math.PI) : 0;
    ctx.save(); ctx.translate(c.x + upX * lift, c.y + upY * lift - (c.air > 0 ? 14 * Math.sin((1 - c.air / (c.airMax || 0.7)) * Math.PI) : 0)); ctx.rotate(c.a); { const f = c.fall > 0 ? 0.25 + 0.75 * (c.fall / 0.7) : re >= 0 ? 0.25 + 0.75 * Math.min(1, re * 1.6) : 1; ctx.scale(CAR * f, CAR * f); if (c.fall > 0) ctx.globalAlpha = 0.4 + 0.6 * (c.fall / 0.7); }
    if (g.glitch && !mine) { drawPal(g.glitchPal || 'fig', ctx, { x: 0, y: 0, s: 9, t: t / 1000, r: 4, face: 1 }); ctx.restore(); ctx.globalAlpha = 1; return; }
    const body = mine ? '#22E0C8' : `hsl(${hue} 90% 56%)`, dark = mine ? '#0B8C7E' : `hsl(${hue} 80% 32%)`, light = mine ? '#9FF7EC' : `hsl(${hue} 95% 78%)`, sx = vh.seat, bk = vh.rear + 1;
    // 🛞 suspension: a little bounce with speed, a squash after a landing or a knock
    { const bs = 1 + 0.018 * Math.sin((c.roll || 0) * 0.3) * Math.min(1, c.v / 150) + 0.07 * (c.bob || 0) * Math.sin(t / 35); ctx.scale(bs, 2 - bs); }
    WHEEL.roll = c.roll || 0; WHEEL.st = c.st || 0; { const ca = Math.cos(c.a), sa = Math.sin(c.a); SUNL.x = sun.x * ca + sun.y * sa; SUNL.y = -sun.x * sa + sun.y * ca; }
    drawVehicle(vh, body, dark, light, mine, t, c);
    if (vh.key !== 'ufo' && !OFF.carx) { const ra = c.a + cth, sh = Math.sin(ra) * 5; ctx.fillStyle = '#FFFFFF26'; ctx.beginPath(); ctx.ellipse(sh, -Math.cos(ra) * 3, 6, 3.2, 0, 0, 7); ctx.fill(); }   // a reflection that slides over the body as it turns
    if (c.brk || dk > 0.1) { ctx.globalCompositeOperation = 'lighter'; [-5.5, 5.5].forEach((y) => { if (c.brk) { ctx.fillStyle = '#FF2A2A55'; ctx.beginPath(); ctx.arc(bk, y, 5.5, 0, 7); ctx.fill(); ctx.fillStyle = '#FF6A6A'; ctx.beginPath(); ctx.arc(bk, y, 1.8, 0, 7); ctx.fill(); } if (dk > 0.1) { ctx.fillStyle = '#FFF2A866'; ctx.beginPath(); ctx.arc(12, y * 0.9, 3.6, 0, 7); ctx.fill(); } }); ctx.globalCompositeOperation = 'source-over'; }   // brake lights, headlamps in the dark
    if (mine && re >= 0) { ctx.fillStyle = '#15151B88'; ctx.beginPath(); ctx.arc(sx, 0, 3.5, 0, 7); ctx.fill(); } else if (mine) drawPal(g.glitch ? (g.glitchPal || 'fig') : (S.curve.mood || 'calm'), ctx, { x: sx, y: 0, s: 6, t: t / 1000, r: S.curve.r, face: 1, hurt: c.spin > 0 || c.fall > 0 }); else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, 0, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(sx, 0, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.arc(sx - 0.9, -0.9, 0.8, 0, 7); ctx.fill(); }
    if (c.shield > 0) { ctx.fillStyle = '#9FF7EC26'; ctx.strokeStyle = c.shield < 1.2 && Math.sin(t / 60) > 0 ? '#FFFFFF55' : '#CFFBFFdd'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#FFFFFFaa'; ctx.beginPath(); ctx.arc(-6, -9, 2.4, 0, 7); ctx.fill(); }   // 🫧 a bubble shield if (mine && g.nitro > 0) { const nf = g.nitro > 2 ? 1.6 : 1; ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.moveTo(bk, -3 * nf); ctx.lineTo(bk - (11 + Math.random() * 8) * nf, 0); ctx.lineTo(bk, 3 * nf); ctx.fill(); ctx.fillStyle = '#FFE36B'; ctx.beginPath(); ctx.moveTo(bk, -1.5 * nf); ctx.lineTo(bk - (6 + Math.random() * 4) * nf, 0); ctx.lineTo(bk, 1.5 * nf); ctx.fill(); }   // 🔥 a pocket's long burst burns bigger
    ctx.restore(); ctx.globalAlpha = 1;
    if (mine && re >= 0) {   // Fig, out of the car and big, carrying it: two little arms down to the roof
      const fx = c.x + upX * (lift + 30), fy = c.y + upY * (lift + 30) + Math.sin(t / 70) * 1.5, cx = c.x + upX * lift, cy = c.y + upY * lift;
      ctx.strokeStyle = '#2A1408'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx - upY * 8, fy + upX * 8); ctx.lineTo(cx - upY * 10, cy + upX * 10); ctx.moveTo(fx + upY * 8, fy - upX * 8); ctx.lineTo(cx + upY * 10, cy - upX * 10); ctx.stroke();
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(-cth); drawPal(g.glitch ? (g.glitchPal || 'fig') : (S.curve.mood || 'calm'), ctx, { x: 0, y: 0, s: 15, t: t / 1000, r: S.curve.r, face: 1 }); ctx.restore();
    } };
  g.rivals.forEach((r) => { if (!(r.out > 0) && Math.abs(r.y - me.y) < lim) car(r, r.hue, false); }); car(me, 0, true);
  if (!OFF.arms) drawArmsHigh(t, me, Rv, cth);   // 🍊 rollers, 🪭 swings, 🚀 rockets, rings, clouds, the magnet and the draft
  g.fx.forEach((f) => { if (f.kind === 'bit') { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2)); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = f.col; ctx.fillRect(-f.sz / 2, -f.sz / 2, f.sz, f.sz * 0.7); ctx.restore(); return; } ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(-(g.camA + (g.turn || 0))); ctx.translate(-f.x, -f.y); ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5)); ctx.font = f.big ? '400 18px Bungee, Impact, sans-serif' : '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.col || '#FFE08A'; ctx.strokeStyle = '#2A1A0A'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); ctx.restore(); }); ctx.globalAlpha = 1;
  // 🛏️ overhead: the tunnels' roofs (see-through while you're under one) and the finish gantry
  vis.forEach((sc) => { if (!sc.roofP) return; const R2 = ROOFS[sc.roof] || ROOFS.bed, a = 0.94 - 0.64 * g.inRoof;
    ctx.save(); ctx.globalAlpha = a * 0.5; ctx.translate(sun.x * 14, sun.y * 14); ctx.fillStyle = '#000000'; ctx.fill(sc.roofP); ctx.restore();
    ctx.globalAlpha = a; ctx.fillStyle = R2.body; ctx.fill(sc.roofP); ctx.lineCap = 'butt'; ctx.strokeStyle = R2.slat; ctx.lineWidth = R2.sw; ctx.stroke(sc.slats);
    if (R2.glow) { ctx.strokeStyle = R2.mouth + '40'; ctx.lineWidth = R2.mw + 14; ctx.stroke(sc.mouths); }
    ctx.strokeStyle = R2.mouth; ctx.lineWidth = R2.mw; ctx.stroke(sc.mouths); ctx.strokeStyle = R2.trim; ctx.lineWidth = 1.5; ctx.stroke(sc.roofP); ctx.globalAlpha = 1; });
  { const p = at(FINISH); if (Math.abs(p.y - me.y) < lim) { const nx = Math.cos(p.a + Math.PI / 2), ny = Math.sin(p.a + Math.PI / 2), h2 = tw / 2 + 16, sq = 8, cols = Math.ceil(h2 * 2 / sq);
    ctx.save(); ctx.translate(p.x + sun.x * 18, p.y + sun.y * 18); ctx.rotate(p.a); ctx.fillStyle = '#00000040'; ctx.fillRect(-sq, -h2, sq * 2, h2 * 2); ctx.restore();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#FFF'; ctx.fillRect(-sq + j * sq, -h2 + i * sq, sq, sq); } ctx.strokeStyle = '#2A1408'; ctx.lineWidth = 1.5; ctx.strokeRect(-sq, -h2, sq * 2, cols * sq); ctx.restore();
    [1, -1].forEach((sd) => { const x = p.x + nx * h2 * sd, y = p.y + ny * h2 * sd; ctx.fillStyle = '#2B2F3A'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#C0C7D2'; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 2.5, 0, 7); ctx.fill(); }); } }
  ctx.restore();
  if (!OFF.air) drawAir(t, th, Hh);   // the place's light: a glow, a vignette, snow / dust motes / neon specks
  // 🌊 going under: the deeper you're zoned in, the more it's just you and the road: streaks pour out of the point the road
  // heads for, the table at the sides sinks into shadow, and a low warm sun lies along it
  { const f = host.deep?.() || 0; if (f > 0.02) { const sp = Math.min(1, Math.abs(me?.v || 0) / 220), vx = W / 2, vy = Hh * 0.12;
    const sg = ctx.createLinearGradient(0, 0, W, 0); sg.addColorStop(0, `rgba(10,4,2,${0.55 * f})`); sg.addColorStop(0.22, 'rgba(10,4,2,0)'); sg.addColorStop(0.78, 'rgba(10,4,2,0)'); sg.addColorStop(1, `rgba(10,4,2,${0.55 * f})`); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, Hh);
    const sun = ctx.createRadialGradient(vx, vy, 4, vx, vy, Hh * 0.5); sun.addColorStop(0, `rgba(255,190,110,${0.3 * f})`); sun.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, Hh);
    ctx.lineCap = 'round'; for (let i = 0; i < 22; i++) { const a = (i * 2.399) % 6.283, u = ((t / (700 - 350 * sp) + i * 0.137) % 1), r0 = 30 + u * u * Hh * 1.1, r1 = r0 + 20 + 90 * u * (0.4 + sp); const x0 = vx + Math.cos(a) * r0, y0 = vy + Math.sin(a) * r0 * 0.9, x1 = vx + Math.cos(a) * r1, y1 = vy + Math.sin(a) * r1 * 0.9, al = f * u * (0.6 + 0.4 * sp); ctx.strokeStyle = `rgba(60,25,10,${0.35 * al})`; ctx.lineWidth = 3 + 4 * u; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = `rgba(255,250,235,${0.8 * al})`; ctx.lineWidth = 1 + 2 * u; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }   // a dark edge so they read on the pale tape
  } }
  // 🔦 lights out (and under the bed, the laptop, the underpass): dark but for the headlights' beam ahead of you
  if (dk > 0.02) { const ha = me.a + cth, hx = Math.cos(ha), hy = Math.sin(ha), cx = W / 2 + hx * 50 * g.zoom, cy = Hh * CAR_Y + hy * 50 * g.zoom;
    const dg = ctx.createRadialGradient(cx, cy, 20 * g.zoom, cx, cy, 140 * g.zoom); dg.addColorStop(0, '#0000'); dg.addColorStop(1, `rgba(4,3,8,${0.96 * dk})`); ctx.fillStyle = dg; ctx.fillRect(0, 0, W, Hh);
    const bx = W / 2 + hx * 14 * g.zoom, by = Hh * CAR_Y + hy * 14 * g.zoom, far = 170 * g.zoom, lg = ctx.createLinearGradient(bx, by, bx + hx * far, by + hy * far); lg.addColorStop(0, `rgba(255,244,190,${0.32 * dk})`); lg.addColorStop(1, 'rgba(255,244,190,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(bx - hy * 7 * g.zoom, by + hx * 7 * g.zoom); ctx.lineTo(bx + hx * far - hy * far * 0.42, by + hy * far + hx * far * 0.42); ctx.lineTo(bx + hx * far + hy * far * 0.42, by + hy * far - hx * far * 0.42); ctx.lineTo(bx + hy * 7 * g.zoom, by - hx * 7 * g.zoom); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  // 💨 flat out: speed lines stream past the sides of the screen
  { const a = g.nitro > 0 ? 1 : Math.max(0, (sp - 0.8) / 0.2); if (a > 0.02 && !host.reduceMotion && g.go <= 0) { ctx.lineCap = 'round'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) { const x = (i * 61.7 + (i % 3) * 23) % W, edge = Math.abs(x - W / 2) / (W / 2); if (edge < 0.35) continue; const y = ((t * (0.9 + (i % 4) * 0.25) + i * 173) % (Hh + 140)) - 70, l = 40 + 60 * a; ctx.globalAlpha = a * 0.4 * edge; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + l); ctx.stroke(); }
    ctx.globalAlpha = 1; } }
  // the steer zones, faint, and the position
  ctx.fillStyle = '#ffffff1c'; if (held.left) ctx.fillRect(0, Hh * 0.5, W / 2, Hh * 0.5); if (held.right) ctx.fillRect(W / 2, Hh * 0.5, W / 2, Hh * 0.5);   // only the half you hold lights (a faint wash over both was a full half-screen of blending a frame)
  { const lt = `${Math.round(progress() * 100)}% to the finish · ${position()}${g.rivals.length + 1}`; ctx.font = '900 14px system-ui'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2A1408'; ctx.lineWidth = 4; ctx.strokeText(lt, W / 2, Hh - 14); ctx.fillStyle = '#FFE36B'; ctx.fillText(lt, W / 2, Hh - 14); }
  if (!OFF.map) drawMap(t, Hh);
  // 🚦 the countdown
  if (g.go > 0 || g.goT > 0) { const txt = g.go > 0 ? String(Math.max(1, Math.ceil(g.go / (COUNT / 3)))) : 'GO!', f = g.go > 0 ? (g.go % (COUNT / 3)) / (COUNT / 3) : g.goT / 0.8;
    ctx.save(); ctx.globalAlpha = Math.min(1, 0.4 + f); ctx.font = `400 ${Math.round(56 + 30 * (1 - f))}px Bungee, Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = '#2A1408'; ctx.strokeText(txt, W / 2, Hh * 0.42); ctx.fillStyle = g.go > 0 ? '#FFE36B' : '#22E0C8'; ctx.fillText(txt, W / 2, Hh * 0.42);
    if (g.go > 0) { ctx.globalAlpha = 1; ctx.lineWidth = 5; ctx.font = '400 17px Bungee, Impact, sans-serif'; ctx.strokeText(`${th.icon} ${th.name}`, W / 2, Hh * 0.42 - 62); ctx.fillStyle = '#FFFFFF'; ctx.fillText(`${th.icon} ${th.name}`, W / 2, Hh * 0.42 - 62);
      ctx.font = '900 14px Nunito, system-ui, sans-serif'; ctx.lineWidth = 4; const sub = `${vh.icon} your ${vh.name} · course ${g.course}`; ctx.strokeText(sub, W / 2, Hh * 0.42 + 54); ctx.fillStyle = '#FFE36B'; ctx.fillText(sub, W / 2, Hh * 0.42 + 54);
      const route = g.secs.map((sc) => sc.icon).join(' › '); ctx.font = '13px system-ui, sans-serif'; ctx.strokeText(route, W / 2, Hh * 0.42 + 78); ctx.fillStyle = '#FFFFFF'; ctx.fillText(route, W / 2, Hh * 0.42 + 78); }
    ctx.restore(); }
  // 🏁 over the line: a flash, chequered flags waving in from both sides, confetti and your place
  if (g.fin) { const f = g.fin, e = f.t, out = Math.max(0, (e - (FIN_T - 0.45)) / 0.45), sl = 1 - Math.pow(1 - Math.min(1, e / 0.35), 3);
    if (e < 0.3) { ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - e / 0.3)})`; ctx.fillRect(0, 0, W, Hh); }
    const sq = 13; [[Hh * 0.13, 1], [Hh * 0.66, -1]].forEach(([y0, dir]) => { const off = ((1 - sl) + out) * W * 1.1 * dir; ctx.save(); ctx.translate(off, 0);
      for (let i = -1; i < W / sq + 1; i++) { const wv = host.reduceMotion ? 0 : Math.sin(i * 0.55 + e * 9) * 4; for (let r = 0; r < 2; r++) { ctx.fillStyle = (i + r) % 2 ? '#111' : '#FFF'; ctx.fillRect(i * sq, y0 + r * sq + wv, sq + 0.5, sq + 0.5); } }
      ctx.fillStyle = '#00000040'; ctx.fillRect(0, y0 + sq * 2 + 4, W, 3); ctx.restore(); });
    f.conf.forEach((p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - out); ctx.fillStyle = p.col; ctx.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2); ctx.restore(); });
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - out); const s = Math.min(1, e / 0.25), big = 1 + 0.25 * (1 - s); ctx.translate(W / 2, Hh * 0.13 + 58); ctx.scale(big, big); ctx.font = '400 30px Bungee, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 7; ctx.strokeStyle = '#2A1408'; const txt = f.place === 1 ? `🏆 ${f.nth}!` : `🏁 ${f.nth}`; ctx.strokeText(txt, 0, 0); ctx.fillStyle = f.place === 1 ? '#FFE36B' : '#FFFFFF'; ctx.fillText(txt, 0, 0); ctx.restore(); }
}
// ---------------------------------------------------------------- 🕳️ the pocket: through the thing coming up the road
// The way in is the toaster (or the course's ramp) or a fork's centrepiece, offered only while you're driving and it's
// coming up on screen well ahead of you (POCKET_CLEAR table units to its near side; once up, it lapses at POCKET_KEEP), so
// the offer never puts you into it. While it's offered the race runs at POCKET_SLOW. Coming back up, win or not, you come out the far side of the thing.
const POCKET_CLEAR = 120, POCKET_KEEP = 70, POCKET_FAR = 900, POCKET_SLOW = 0.45, POCKET_EASE = 1.2;
const THING_ICON = { toaster: '🍞', ramp: '🎢', fruitbowl: '🍎', toybox: '🧸', mug: '☕', snowglobe: '🔮', fountain: '⛲' };
function toScreen(p) {   // a table point → the organ's world units, through the chase camera (toTable's inverse)
  const th = g.camA + (g.turn || 0), dx = p.x - g.me.x, dy = p.y - g.me.y;
  return { x: W / 2 + g.zoom * (Math.cos(th) * dx - Math.sin(th) * dy), y: H() * CAR_Y + g.zoom * (Math.sin(th) * dx + Math.cos(th) * dy) };
}
function pocketThings() {   // the ramp and the forks' centrepieces: where each is and how much road it takes up
  const out = [];
  g.items.forEach((i) => { if (i.kind === 'toaster') out.push({ thing: TH().ramp === 'toaster' ? 'toaster' : 'ramp', x: i.x, y: i.y, s: i.s, half: 20, r: 20 }); });
  g.solids.forEach((o) => { if (o.island) out.push({ thing: o.kind, x: o.x, y: o.y, s: o.s, half: o.cr + 10, r: o.cr, island: true }); });
  return out;
}
function pocketSpot() {
  if (!g?.me || g.go > 0 || g.fin || g.done || g.camA == null || !g.zoom || S.over) return null;
  const me = g.me; if (me.fall > 0 || me.rescue || me.air > 0 || me.spin > 0 || me.v < 50) return null;
  const L = g.track.len, Hh = H(), up = host.pocket?.offering?.(); let best = null;
  pocketThings().forEach((c) => { const ahead = (c.s - me.s) * L - c.half; if (ahead < (up ? POCKET_KEEP : POCKET_CLEAR) || ahead > POCKET_FAR) return;
    const p = toScreen(c); if (p.x < 26 || p.x > W - 26 || p.y < Hh * 0.12 || p.y > Hh * CAR_Y - (up ? 40 : 70)) return;
    if (!best || ahead < best.ahead) best = { ...c, ahead, sx: p.x, sy: p.y }; });
  if (!best) return null;
  g.pkThing = best; return { x: best.sx, y: best.sy, r: Math.max(18, Math.min(32, best.r * g.zoom * 0.5)), icon: THING_ICON[best.thing] || '🍞' };
}
function drawSlotCar(c2, x, y, a, sc, t, o = {}) {   // Rally's own ride, for the pocket's slot track (Fig at the wheel; the ghost in white)
  const keep = ctx; ctx = c2;
  try {
    const vh = VH(), ghost = !!o.ghost, body = ghost ? '#F4F4F8' : '#22E0C8', dark = ghost ? '#9AA0B0' : '#0B8C7E', light = ghost ? '#FFFFFF' : '#9FF7EC';
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc);
    WHEEL.roll = o.roll || 0; WHEEL.st = 0; SUNL.x = 0.6 * Math.cos(a) + 0.8 * Math.sin(a); SUNL.y = -0.6 * Math.sin(a) + 0.8 * Math.cos(a);
    drawVehicle(vh, body, dark, light, !ghost, t, { v: o.v || 0, n: 1 });
    if (!ghost) drawPal(S.curve.mood || 'calm', ctx, { x: vh.seat, y: 0, s: 6, t: t / 1000, r: S.curve.r, face: 1, hurt: !!o.hurt });
    ctx.restore();
  } finally { ctx = keep; }
}
function popThrough() {   // out the far side of the thing you went in by, in a lane clear of anything solid, at speed along the road
  const c = g.pkThing, me = g.me; g.pkThing = null; if (!c || !me) return;
  const L = g.track.len, isl = c.island ? g.islands.find((q) => Math.abs(q.s - c.s) < 1e-6) : null, sk = c.s + ((isl ? isl.lh : c.half) + 50) / L; if (sk <= me.s || sk >= FINISH - 0.01) return;
  const p0 = at(sk), w = g.track.w, clear = (q) => !g.solids.some((o) => Math.hypot(o.x - q.x, o.y - q.y) < o.cr + R + 14) && !g.items.some((i) => (i.kind === 'hole' || i.kind === 'milk') && Math.hypot(i.x - q.x, i.y - q.y) < i.r + R + 6);
  let lat = 0; for (const l of [0, -0.22, 0.22, -0.32, 0.32]) { if (clear(spotOn(sk, l * w))) { lat = l * w; break; } }
  const q = spotOn(sk, lat), v = Math.max(me.v || 0, topSpeed() * 0.6);
  Object.assign(me, { x: q.x, y: q.y, a: p0.a, s: sk, prevS: sk, lat, v, vs: v, vx: Math.cos(p0.a) * v, vy: Math.sin(p0.a) * v, spin: 0, w: 0, air: 0, fall: 0 });
  for (let i = 0; i < 14; i++) { const an = Math.random() * 6.28, sp = 60 + Math.random() * 140; g.fx.push({ kind: 'bit', x: q.x, y: q.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, sz: 2 + Math.random() * 3, col: ['#FFE36B', '#22E0C8', '#FFFFFF'][i % 3], life: 0.6 }); }
}
const position = () => { const me = g.me; let ahead = 0; g.rivals.forEach((r) => { if (r.done || (!(r.out > 0) && r.s > me.s)) ahead += 1; }); return `${ahead + 1}/`; };
const progress = () => Math.max(0, Math.min(1, (g.me.s - sOf(GRID)) / (FINISH - sOf(GRID))));
const side = (p) => (p.x < W / 2 ? 'left' : 'right');
const organ = {
  key: 'rally', name: 'Rally', icon: '🏎️', verb: 'race to the finish · hold a side to steer', beat: 1.0,
  theme: { bg: '#B4662A', gold: '#F5C542', bannerc: '#FFE08A' },
  glitch(on, pal) { if (g) { g.glitch = on; g.glitchPal = pal; } },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__rl = organ.debug; },
  start() { newGame(); },
  enter(from) { if (!g) newGame(); bar = host.ui('<div class="wbar" aria-label="Weapon"></div>').querySelector('.wbar'); if (bar) bar.onclick = (e) => { e.preventDefault(); fireMine(); }; renderBar(); held = {}; taps = {}; },
  leave() { held = {}; taps = {}; bar = null; return g?.me ? { x: W / 2, y: H() / 2 } : null; },
  keydown(e) { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault?.(); fireMine(); } },
  update, draw, onBeat,
  // 🕳️ the pocket: through the thing coming up the road, and what comes back out of it
  pocket: slotcarPocket,
  pocketSpot,
  pocketSeed() {
    const th = TH(); if (!g.pkThing) g.pkThing = pocketThings().filter((c) => c.s > g.me.s).sort((a, b) => a.s - b.s)[0] || null;
    let surf = null; try { surf = tex(th.surf); } catch { surf = null; }
    return { seed: Math.floor(Math.random() * 1e9), thing: g.pkThing?.thing || 'toaster', place: th.key, course: g.course, vehicle: VH().key, theme: { kerb: th.kerb, kerbEdge: th.kerbEdge, edge: th.edge, side: th.side, surf }, car: drawSlotCar };
  },
  pocketReward(res) {
    if (!g?.me) return; held = {}; popThrough(); g.slowT = POCKET_EASE;
    if (!res) return; const gf = res.gift || {};
    if (gf.nitro) g.nitro = Math.max(g.nitro || 0, gf.nitro);
    if (gf.heal) host.heal(gf.heal);
    g.fx.push({ kind: 'text', x: g.me.x, y: g.me.y - 30, text: `🔥 NITRO${gf.heal ? ' · ❤️ +1' : ''}`, life: 1.6, big: true, col: '#FFE36B' }); sfx('cannon', { size: 0.4 });
  },
  // 🎯 with a weapon, a quick tap (under TAP_MS, barely moved) on the upper middle of the field uses it; a press held there
  // longer, or dragged, steers like anywhere else
  pointer(type, p, e) { const id = e?.pointerId ?? 0;
    if (type === 'down') { const b = boxAt(p); if (b) smash(b); if (!b && g?.weapon && p.y < H() * 0.62 && Math.abs(p.x - W / 2) < W * 0.32) { taps[id] = { x: p.x, y: p.y, t: performance.now() }; return; } held[side(p)] = true; held['id' + id] = side(p); }
    else if (type === 'move') { const tp = taps[id]; if (tp) { if (Math.hypot(p.x - tp.x, p.y - tp.y) > 12) { delete taps[id]; held[side(p)] = true; held['id' + id] = side(p); } return; } const s = held['id' + id]; if (s && side(p) !== s) { held[s] = false; held[side(p)] = true; held['id' + id] = side(p); } }
    else { const tp = taps[id]; if (tp) { delete taps[id]; if (performance.now() - tp.t < TAP_MS) fireMine(); return; } const s = held['id' + id]; if (s) { held[s] = false; delete held['id' + id]; } else { held = {}; taps = {}; } } },
  hudLine: () => (g ? `🏎️ course ${g.course} · ${Math.round(progress() * 100)}%${g.weapon ? ` · ${wpn(g.weapon.kind).icon}` : ''}` : ''),
  level: () => g?.course || 1,
  overText: (how) => (how === 'fell in the pocket' ? ['🕳️ POCKETED', 'Too many trips down the pocket.'] : how === 'off the table' ? ['🫳 OFF THE TABLE', 'The table is only so big.'] : how === 'fell off the edge' ? ['🪂 OVER THE EDGE', 'Mind the open edges.'] : ['RUN OVER', '']),
  endStats: () => (g ? `🏎️ ${finishN} ${finishN === 1 ? 'finish' : 'finishes'} · ${outsN} rivals left behind · 🎯 ${hitsGivenN} hits` : ''),
  debug: () => g && ({ auto: (on) => { g.auto = on; }, autoFire: (on) => { g.autoHold = !on; }, fx: g.fx.map((f) => f.text), me: { x: g.me.x, y: g.me.y, s: g.me.s, v: g.me.v, off: g.me.off }, go: g.go, progress: progress(), finishes: finishN, course: g.course, rivals: g.rivals.map((r) => ({ s: r.s, out: r.out, off: r.off, done: r.done })), items: g.items.length, obs: g.obs.length, twist: g.twist?.kind || null, held: { ...held }, W, H: H(), track: { w: g.track.w, len: Math.round(g.track.len), n: g.track.n }, zoom: g.zoom, camA: g.camA, guideA: g.guideA, heading: g.me.a, top: Math.round(topSpeed()), edges: g.edges.map((e) => ({ s0: e.s0, s1: e.s1, side: e.side })), fall: g.me.fall || 0, rescue: g.me.rescue ? g.me.rescue.t : null, guards: [...g.rims[1], ...g.rims[-1]].reduce((o, p) => { o[p.guard] = (o[p.guard] || 0) + 1; return o; }, {}), skipGo: () => { g.go = 0; }, jump: (sk) => { const p = at(sk); g.me.x = p.x; g.me.y = p.y; g.me.a = p.a; g.me.s = g.me.prevS = sk; g.me.vx = null; }, swap: () => mirrorSwap(), pushOut: (sk = 0.5, d = 80, side = 1) => { const p = spotOn(sk, side * (g.track.w / 2 + d)); g.me.x = p.x; g.me.y = p.y; g.me.air = 0; }, pushOff: (i = 0) => { const e = g.edges[i], p = spotOn(e.c, e.side * (g.track.w / 2 + 14)); g.me.x = p.x; g.me.y = p.y; g.me.air = 0; }, hitBox: (i = 0) => { const b = [...g.items, ...g.obs].filter((x) => x.kind === 'box')[i]; if (b) b.hit = true; }, boxes: [...g.items, ...g.obs].filter((b) => b.kind === 'box').length, boxList: [...g.items, ...g.obs].filter((b) => b.kind === 'box').map((b) => ({ s: b.s ?? nearest(b.x, b.y).s, hit: !!b.hit })), smashed: smashedN, boxScreen: (i = 0) => { const bs = [...g.items, ...g.obs].filter((b) => b.kind === 'box'), b = bs[i]; if (!b) return null; const th = g.camA + (g.turn || 0), dx = (b.x - g.me.x) * g.zoom, dy = (b.y - g.me.y) * g.zoom; return { x: W / 2 + Math.cos(th) * dx - Math.sin(th) * dy, y: H() * CAR_Y + Math.sin(th) * dx + Math.cos(th) * dy }; }, tap: (p) => { organ.pointer('down', p, { pointerId: 99 }); organ.pointer('up', p, { pointerId: 99 }); }, theme: TH().key, vehicle: VH().key, dust: g.dust.length, decor: g.decor.length, goCourse: (n, seed) => { if (seed != null) g.seed = seed; g.course = Math.max(1, n | 0); newCourse(); },
    sections: g.secs.map((sc) => ({ i: sc.i, icon: sc.icon, name: sc.name, kind: sc.kind, s0: sc.s0, s1: sc.s1 })), section: secAt(g.me.s).i, secShown: g.secShown, islands: g.islands.map((i) => ({ s: i.s, lh: i.lh, wi: i.wi, kind: i.kind })), lane: g.me.lane || 0, lat: g.me.lat || 0,
    goSection: (i) => { const sc = g.secs[Math.max(0, Math.min(g.secs.length - 1, i | 0))], sk = sc.s0 + 0.012, p = at(sk); g.me.x = p.x; g.me.y = p.y; g.me.a = p.a; g.me.s = g.me.prevS = sk; g.me.vx = null; }, pieces: g.pieces.length, skids: g.skids.length, skid: !!g.me.skid, sparks: g.dust.filter((p) => p.spark).length, dim: g.dimNow, inRoof: g.inRoof, map: mapRect(H()), fin: g.fin ? g.fin.t : null, zoomTarget: camZoom(),
    pocketThings: pocketThings().map((c) => ({ thing: c.thing, s: c.s, half: c.half })), pkThing: g.pkThing ? { thing: g.pkThing.thing, s: g.pkThing.s } : null, nitro: g.nitro, slowT: g.slowT || 0, toScreen: (x, y) => toScreen({ x, y }),
    obstacles: g.solids.map((o) => ({ s: o.s, lat: o.lat, r: o.cr, lext: o.lext, kind: o.kind, shape: o.shape, island: !!o.island, free: o.free, x: o.x, y: o.y })), obsHits: obsHitsN, rivalObsHits: rivalHitsN, slip: g.me.slip || 0, vel: { x: g.me.vx || 0, y: g.me.vy || 0 }, w: g.me.w || 0, shake: g.shake || 0,
    // 🎁 the arms
    crates: g.crates.map((b) => ({ s: b.s, lat: b.lat, live: b.t <= 0, gold: !!b.gold, temp: !!b.temp, row: b.row })), weapon: g.weapon ? { ...g.weapon } : null, shots: shotsN, hitsTaken: hitsTakenN, hitsGiven: hitsGivenN, trapHits: g.trapHits || 0,
    give: (k, n = 1, gold = false) => { g.weapon = { kind: k, n, gold }; renderBar(); }, fire: () => fireMine(), kinds: Object.keys(WEAPONS), weaponName: (k) => wpn(k).name,
    zones: g.zones.map((z) => ({ kind: z.kind, s: z.s, lat: z.lat, len: z.len, wid: z.wid })), traps: g.traps.map((t) => ({ kind: t.k, name: t.look.name, icon: t.look.icon, s: t.s, lat: t.lat, hitLat: t.hitLat, state: trapState(t) })),
    spin: g.me.spin || 0, air: g.me.air || 0, shield: g.me.shield || 0, padT: g.me.padT || 0, slipT: g.me.slipT || 0, draftT: g.me.draftT || 0, zapT: g.me.zapT || 0, magT: g.me.magT || 0, mud: !!g.me.mud,
    proj: g.proj.map((p) => ({ x: p.x, y: p.y, s: p.s, owner: p.owner === g.me ? 'me' : p.owner?.n, target: p.target === g.me ? 'me' : p.target?.n ?? null })), slicks: g.slicks.map((k) => ({ s: k.s, lat: k.lat, owner: k.owner === g.me ? 'me' : k.owner?.n ?? null })), waves: g.waves.length, bolts: g.bolts.length,
    rivalArms: g.rivals.map((r) => ({ n: r.n, weapon: r.weapon || null, turboT: r.turboT || 0, holdT: r.holdT || 0, spin: r.spin || 0, zapT: r.zapT || 0, shield: r.shield || 0, s: r.s, v: r.v, air: r.air || 0, out: r.out || 0, done: r.done })),
    rivalFire: (i, k) => { const r = g.rivals[i]; if (r) fireWeapon(r, k, false); }, rivalGive: (i, k) => { const r = g.rivals[i]; if (r) { r.weapon = k; r.holdT = 0; } },
    placeRival: (i, du, dl = 0, v) => { const r = g.rivals[i]; if (!r) return; const sk = g.me.s + du / g.track.len, p = spotOn(sk, dl), a = at(sk).a; Object.assign(r, { x: p.x, y: p.y, a, s: sk, prevS: sk, lat: dl, out: 0, done: false, fall: 0, rescue: null, spin: 0, w: 0, air: 0, v: v ?? g.me.v, vx: null }); },
    parkRivals: () => { g.rivals.forEach((r, i) => { const sk = Math.max(0.005, g.me.s - (600 + i * 60) / g.track.len), p = at(sk); Object.assign(r, { x: p.x, y: p.y, a: p.a, s: sk, prevS: sk, v: 0, vx: null, out: 999 }); }); },
    trap: (i = 0, d = 90, dl) => { const tr = g.traps[i]; if (!tr) return null; const L = g.track.len, sk = tr.s - d / L, lat = dl ?? tr.hitLat, p = spotOn(sk, lat), a = at(sk).a, me = g.me, v = topSpeed(), eta = d / v;
      Object.assign(me, { x: p.x, y: p.y, a, s: sk, prevS: sk, lat, spin: 0, w: 0, air: 0, trapCD: 0, shield: 0, v, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vs: v });
      if (tr.k === 'roller') tr.t0 = g.time + eta - ROLL_T() / 2; else if (tr.k === 'swing') tr.t0 = g.time + eta; else if (tr.k === 'spring') tr.t0 = g.time + eta - 0.25; else if (tr.k === 'hatch') tr.t0 = g.time + eta - 0.5; else tr.snapT = -99;
      return { kind: tr.k, x: tr.x, y: tr.y }; },
    zoneAt: (i = 0, d = 60, dl = 0, v) => { const z = g.zones[i]; if (!z) return null; const sk = z.s - d / g.track.len, lat = z.lat + dl, p = spotOn(sk, lat), a = at(sk).a, me = g.me, sp = v ?? topSpeed(); Object.assign(me, { x: p.x, y: p.y, a, s: sk, prevS: sk, lat, spin: 0, w: 0, air: 0, padT: 0, v: sp, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vs: sp }); return { kind: z.kind }; },
    crateAt: (i = 0, d = 60) => { const b = g.crates[i]; if (!b) return null; const sk = b.s - d / g.track.len, p = spotOn(sk, b.lat), a = at(sk).a, me = g.me, v = topSpeed(); Object.assign(me, { x: p.x, y: p.y, a, s: sk, prevS: sk, lat: b.lat, spin: 0, w: 0, air: 0, v, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vs: v }); return { s: b.s, lat: b.lat }; },
    twistNow: (k) => { const tw = TWISTS.find((x) => x[2] === k); if (!tw) return; g.twist = null; const keep = Math.random; Math.random = () => TWISTS.indexOf(tw) / TWISTS.length + 1e-6; try { twist(); } finally { Math.random = keep; } },
    stop: () => { Object.assign(g.me, { v: 0, vx: 0, vy: 0, vs: 0, spin: 0, w: 0 }); },
    beat: (ev) => onBeat(ev), clearArms: () => { g.traps = []; g.zones = []; g.slicks = []; g.proj = []; g.crates = []; },
    hitObstacle: (i = 0, d = 70, v, dl = 0) => { const o = g.solids[i]; if (!o) return null; const sk = o.s - d / g.track.len, p = spotOn(sk, o.lat + dl), a = at(sk).a, me = g.me; me.x = p.x; me.y = p.y; me.a = a; me.s = me.prevS = sk; me.lat = o.lat + dl; me.spin = 0; me.w = 0; me.air = 0; me.v = v ?? topSpeed(); me.vx = Math.cos(a) * me.v; me.vy = Math.sin(a) * me.v; me.vs = me.v; return { x: o.x, y: o.y, r: o.cr }; } }),
};
export default organ;
