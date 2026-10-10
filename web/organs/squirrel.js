// 🐿️ Squirrel Chaos, as an organ of the shell (shell.js). Squirrels race along the branches of fractal
// trees; tap to fire the stapler. A big squirrel splits in two when you staple it (and a middle one
// splits again): only the littlest get pinned, and score. The box's beats decide how many come (and the
// window sends threes), the mirror drops a crate, the balance reloads and heals, the golden cut stops
// them all for a moment, a Fibonacci beat may drop a crate, a golden beat sends a golden squirrel.
// Each day ends by diving into the knothole of the middle tree, into a deeper, darker forest: the
// pinned ones stay, eyes open in the trees, the picture tears, and on day 4 the knothole wakes.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';

let W = 400, LEVELS = 4, LEVEL_S = 30, AMMO = 12, RELOAD_S = 1.1, MAX_SQ = 16;
const dark = () => Math.min(1, (level - 1) / 3);   // 0 on day 1, 1 on day 4
const WHISPERS = ['they remember', 'the stapler was never yours', 'it counts them too', 'do not look at the knot', 'one more day',
  'the little ones do not split. they multiply', 'you are inside the knot already', 'it likes the sound', 'the trees grew around something',
  'every staple is a promise', 'they are not running from you', 'r → 4. then what', 'it has your face', 'keep going. it wants you to'];
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const RAD = [0, 10, 15, 21];
const WEAPONS = {
  staple: { icon: '📎', name: 'Stapler' },
  nail: { icon: '🔩', name: 'Nail Gun', ammo: 40, desc: 'hold to fire full auto' },
  shotgun: { icon: '💥', name: 'Staple Shotgun', ammo: 8, desc: 'five staples in a spread' },
  bomb: { icon: '🧨', name: 'Tack Bomb', ammo: 4, desc: 'lob it: everything nearby gets tacked' },
  chain: { icon: '⚡', name: 'Chain Stapler', ammo: 6, desc: 'the bolt forks from squirrel to squirrel' },
  chaos: { icon: '🌀', name: 'Chaos Cannon', ammo: 3, desc: 'one shot bursts into a fractal of 15' },
};
const CRATE_ODDS = [['nail', 0.26], ['shotgun', 0.24], ['bomb', 0.2], ['chain', 0.18], ['chaos', 0.12]];
const TWISTS = [
  ['🌪️ GUST', 'staples drift in the wind', 'gust'],
  ['🐿️ STAMPEDE', 'here come the little ones', 'stampede'],
  ['⚡ FRENZY', 'squirrels at double speed', 'frenzy'],
  ['🍂 LEAF STORM', 'can you see them?', 'leaves'],
];
const DARK_TWISTS = [   // from day 2 on, and more likely the darker it gets
  ['👁️ THEY STARE', 'do not move', 'stare'],
  ['🌑 BLACKOUT', 'only their eyes', 'blackout'],
  ['📻 STATIC', 'the picture tears', 'static'],
];
const WORDS = ['KA-CHUNK!', 'THWACK!', 'SHUNK!', 'PINNED!', 'CLICK-CLACK!', 'YOINK!', 'TAGGED!'];

let host, ctx, S, sfx, forest = null, game = null, level = 1, hold = null, bar = null;
const H = () => host.H;
// 🎚️ as the board zooms out (Stage 2+) Fig and the stapler climb to a perch in the middle of the wood (`game.perch` 0 → 1), so
// squirrels, owls and snakes come from above and below alike
const STAPLER = () => ({ x: W / 2, y: H() - 14 - (H() * 0.47 - 14) * (game?.perch || 0) });

// ---------------------------------------------------------------- the fractal forest
// Three trees, each a trunk that forks and forks again (2, now and then 3 ways, each branch 0.618 as
// long: the golden ratio). Every branch is a segment the squirrels run along; a branch knows its parent
// and its children, so they climb up and down the tree like a graph.
function grow(seed, lvl) {
  const r = rng(seed * 2654435761), segs = [], ground = H() - 30, depth = 4 + Math.min(2, lvl);
  const add = (x1, y1, a, len, w, d, parent) => {
    const x2 = x1 + Math.cos(a) * len, y2 = y1 + Math.sin(a) * len;
    if (x2 < 8 || x2 > W - 8 || y2 < 70) return null;
    const s = { x1, y1, x2, y2, w, d, parent, kids: [], a };
    s.i = segs.push(s) - 1;
    if (parent) parent.kids.push(s);
    if (d < depth) {
      const n = r() < 0.3 ? 3 : 2, spread = 0.38 + r() * 0.22;
      for (let j = 0; j < n; j++) {
        const f = n === 1 ? 0 : (j / (n - 1)) * 2 - 1;
        add(x2, y2, a + f * spread + (r() - 0.5) * 0.25, len * (0.58 + r() * 0.08), Math.max(2, w * 0.618), d + 1, s);
      }
    }
    return s;
  };
  // 🌳 Day 1 is a single tree (one fractal to learn on), Day 2 two, Day 3 on the whole wood
  const trunks = [], nT = Math.min(3, lvl);
  for (let t = 0; t < nT; t++) {
    const x = W * (t + 0.5) / nT + (r() - 0.5) * 40;
    trunks.push(add(x, ground, -Math.PI / 2 + (r() - 0.5) * 0.12, (H() - 110) * (0.26 + r() * 0.06), 15, 0, null));
  }
  const tips = segs.filter((s) => !s.kids.length);
  const mid = trunks[Math.floor(nT / 2)];
  const knot = { x: mid.x1 + (mid.x2 - mid.x1) * 0.55, y: mid.y1 + (mid.y2 - mid.y1) * 0.55 };
  const eyes = []; for (let i = 0; i < (lvl - 1) * 7; i++) eyes.push({ x: 20 + r() * (W - 40), y: 80 + r() * (ground - 160), ph: r() * 6.28, rate: 0.6 + r() * 0.8, gap: 5 + r() * 3 });
  return { seed, H: H(), W, ground, segs, trunks, tips, knot, eyes, hue: [34, 28, 22, 16][Math.min(3, lvl - 1)] };
}
// 🎥 the camera: Day 1 at Stage 1 starts close in on the action (the stapler, the squirrels, crates and acorns, up to
// CAM_MAX), never wider than the whole of the one tree; Day 2 eases out to at most 1.6×, and from Day 3 or a wider stage
// it shows the whole wood. Taps go back through it (`unCam`), so aiming is exact at any zoom.
const CAM_MAX = 2.4;
let cam = { z: 1, x: 0, y: 0 };
function camTarget() {
  const Hh = H(), st = host?.stage?.() || 1, whole = { z: 1, x: W / 2, y: Hh / 2 };
  if (!forest || !game || level >= 3 || st >= 2) return whole;
  const cap = level === 1 ? CAM_MAX : 1.6, box = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }, take = (x, y, m) => { box.x0 = Math.min(box.x0, x - m); box.x1 = Math.max(box.x1, x + m); box.y0 = Math.min(box.y0, y - m); box.y1 = Math.max(box.y1, y + m); };
  const sp = STAPLER(); take(sp.x, sp.y - 20, 50); take(sp.x, forest.ground + 10, 20);
  game.squirrels.forEach((sq) => { const p = sqPos(sq); take(p.x, p.y, 70); });
  game.crates.forEach((c) => { if (c.y >= forest.ground - 16) take(c.x, c.y, 60); });   // a crate still parachuting in doesn't pull the camera up the sky
  game.acorns.forEach((a) => { const p = acornPos(a); take(p.x, p.y, 50); });
  if (!game.squirrels.length) forest.trunks.forEach((t) => { take(t.x2, t.y2, 60); });   // nothing yet: frame the trunk and the stapler
  const tb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; forest.segs.forEach((g) => { tb.x0 = Math.min(tb.x0, g.x1, g.x2); tb.x1 = Math.max(tb.x1, g.x1, g.x2); tb.y0 = Math.min(tb.y0, g.y1, g.y2); tb.y1 = Math.max(tb.y1, g.y1, g.y2); });
  const zTree = Math.max(1, Math.min(W / (tb.x1 - tb.x0 + 60), Hh / (forest.ground + 20 - tb.y0 + 40)));
  const z = Math.max(1, Math.min(cap, Math.max(Math.min(zTree, cap), Math.min(W / (box.x1 - box.x0), Hh / (box.y1 - box.y0)))));
  const hw = W / (2 * z), hh = Hh / (2 * z);
  return { z, x: Math.max(hw, Math.min(W - hw, (box.x0 + box.x1) / 2)), y: Math.max(hh, Math.min(Hh - hh, (box.y0 + box.y1) / 2)) };
}
function camStep(dt, snap) { const t = camTarget(); if (snap || !cam.x) { cam = { ...t }; return; } const e = Math.min(1, dt * 1.4); cam.z += (t.z - cam.z) * e; cam.x += (t.x - cam.x) * e; cam.y += (t.y - cam.y) * e; }
const unCam = (p) => ({ x: cam.x + (p.x - W / 2) / cam.z, y: cam.y + (p.y - H() / 2) / cam.z });
const posOn = (s, t) => ({ x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t });

// ---------------------------------------------------------------- state
function newGame() {
  cam = { z: 1, x: 0, y: 0 };   // snaps to its target on the first frame
  level = 1;
  forest = grow((Date.now() & 0xffffff) | 1, level);
  game = { ammo: AMMO, reloadT: 0, time: 0, squirrels: [], staples: [], pins: [], fx: [], stuck: [], leaves: [],
    twist: null, speed: 1, dive: null, hits: 0, shots: 0, weapon: 'staple', arsenal: {}, stun: 0, shake: 0, hitstop: 0, acorns: [], crates: [], crateT: 5, bombs: [], bolts: [],
    kept: [], whisperT: 9, glitch: 0, perch: 0, centred: false, owls: [], cones: [], snakes: [], owlT: 3, snakeT: 4, eye: { open: 0, blink: 0, blinkT: 4 }, stare: 0, ko: false };
}
function onBeat(ev) {
  const g = game, c = S.curve;
  if (g.dive) return;
  // Day 1: one squirrel at a time, small ones, no acorns; the wood fills from Day 2
  const n = level === 1 ? (g.squirrels.length ? 0 : ev.x > 0.2 ? 1 : 0) : ev.window ? 3 : ev.x > 0.8 ? 3 : ev.x > 0.6 ? 2 : ev.x > 0.35 ? 1 : 0;
  for (let i = 0; i < n; i++) spawn(ev.window || level === 1 ? 1 : undefined);
  // 😠 They fight back: the wilder the curve, the more acorns come flying at your stapler.
  if (level >= 2 && ev.x > 0.55 && !ev.window && g.acorns.length < 2 && Math.random() < 0.1 + 0.07 * level + (c.r >= 3.5699 ? 0.08 : 0)) throwAcorn();
  // ✨ Symmetry in chaos: the mirror drops a crate and pays; the balance reloads and heals.
  if (ev.mirror) { dropCrate(); add(250, { x: W / 2, y: H() * 0.42 }, '✨ SYMMETRY'); sfx('chime'); }
  if (ev.balance) { g.ammo = AMMO; g.reloadT = 0; host.heal(1); sfx('chime'); }
  // 🌻 Fibonacci: a golden-cut beat stops every squirrel for a moment (+161); a Fibonacci beat may drop a crate.
  if (ev.golden) { g.squirrels.forEach((sq) => { sq.daze = Math.max(sq.daze || 0, 1.6); }); add(161, { x: W / 2, y: H() * 0.5 }, '🌻 φ'); sfx('chime', { hi: true }); }
  if (ev.fib && Math.random() < 0.5) dropCrate();
  if (ev.gold) spawn(1, true);            // ✨ a golden one when x all but touches 1
  else if (ev.big && !g.twist) twist();
}
function twist() {
  const pool = Math.random() < dark() * 0.8 ? DARK_TWISTS : TWISTS;
  const [title, sub, kind] = pool[Math.floor(Math.random() * pool.length)];
  game.twist = { kind, until: game.time + 6, wind: (Math.random() < 0.5 ? -1 : 1) * 70 };
  host.banner(title, sub); sfx(pool === DARK_TWISTS ? 'gasp' : 'twist');
  if (kind === 'stare') { game.stare = 1.6; game.squirrels.forEach((sq) => { sq.angry = 8; }); }
  if (kind === 'static') game.glitch = 6;
  if (kind === 'stampede') for (let i = 0; i < 6; i++) spawn(1);
  dropCrate();   // every twist drops a crate too
  if (kind === 'leaves') for (let i = 0; i < 60; i++) game.leaves.push({ x: Math.random() * W, y: -Math.random() * H(), vx: 20 + Math.random() * 40, vy: 40 + Math.random() * 50, r: 5 + Math.random() * 7, a: Math.random() * 6 });
}

// ---------------------------------------------------------------- squirrels
function spawn(sz, gold = false) {
  if (game.squirrels.length >= [1, 4, 8, MAX_SQ][Math.min(3, level - 1)] || game.dive) return;   // a cap that grows by the day
  const size = sz || (Math.random() < 0.35 ? 3 : Math.random() < 0.55 ? 2 : 1);
  const trunk = forest.trunks[Math.floor(Math.random() * forest.trunks.length)];
  const sq = { seg: trunk, t: 0, dir: 1, size, gold, face: Math.random() < 0.5 ? -1 : 1, spd: (70 + Math.random() * 40) * (gold ? 1.6 : 1) / (0.7 + size * 0.15), hop: null, wig: Math.random() * 6 };
  if (Math.random() < 0.4) {   // in from the side, with a leap onto a branch
    const to = forest.segs[Math.floor(Math.random() * forest.segs.length)], p = posOn(to, 0.5);
    sq.seg = to; sq.t = 0.5; sq.hop = { x0: Math.random() < 0.5 ? -20 : W + 20, y0: p.y - 60, t: 0, dur: 0.7 };
  }
  game.squirrels.push(sq);
}
const sqPos = (sq) => {
  const p = posOn(sq.seg, sq.t), n = { x: -(sq.seg.y2 - sq.seg.y1), y: sq.seg.x2 - sq.seg.x1 }, l = Math.hypot(n.x, n.y) || 1, up = n.y < 0 ? 1 : -1;
  const off = RAD[sq.size] * 0.8 + sq.seg.w * 0.4;
  let x = p.x + (n.x / l) * off * up, y = p.y + (n.y / l) * off * up;
  if (sq.hop) { const e = Math.min(1, sq.hop.t / sq.hop.dur); x = sq.hop.x0 + (x - sq.hop.x0) * e; y = sq.hop.y0 + (y - sq.hop.y0) * e - Math.sin(e * Math.PI) * 50; }
  return { x, y };
};
function moveSquirrel(sq, dt) {
  if (game.stare > 0) return;   // 👁️ frozen, every eye on you
  if (sq.hop) { sq.hop.t += dt; if (sq.hop.t >= sq.hop.dur) sq.hop = null; return; }
  const len = Math.hypot(sq.seg.x2 - sq.seg.x1, sq.seg.y2 - sq.seg.y1) || 1;
  const frenzy = game.twist?.kind === 'frenzy' || game.twist?.kind === 'stare' ? 2 : 1;   // after the stare, they come
  sq.t += (sq.dir * sq.spd * game.speed * frenzy * dt) / len;
  if (sq.t >= 1) {   // top of this branch: on up a child, or back down
    if (sq.seg.kids.length && Math.random() < 0.85) { sq.seg = sq.seg.kids[Math.floor(Math.random() * sq.seg.kids.length)]; sq.t = 0; }
    else { sq.t = 1; sq.dir = -1; }
  } else if (sq.t <= 0) {
    if (sq.seg.parent && Math.random() < 0.7) { sq.seg = sq.seg.parent; sq.t = 1; }
    else { sq.t = 0; sq.dir = 1; }
  }
  sq.face = sq.dir * Math.sign(sq.seg.x2 - sq.seg.x1 || 1);
  if (Math.random() < dt * (0.15 + S.curve.x * 0.35)) hopTo(sq);   // now and then (more in chaos) a leap to a branch nearby
}
function hopTo(sq, from) {
  const p = from || sqPos(sq);
  const near = forest.segs.filter((s) => { const q = posOn(s, 0.5); return Math.hypot(q.x - p.x, q.y - p.y) < 140; });
  const to = near[Math.floor(Math.random() * near.length)] || forest.segs[Math.floor(Math.random() * forest.segs.length)];
  sq.seg = to; sq.t = 0.2 + Math.random() * 0.6; sq.dir = Math.random() < 0.5 ? 1 : -1;
  sq.hop = { x0: p.x, y0: p.y, t: 0, dur: 0.45 };
}

// ---------------------------------------------------------------- the arsenal
function dropCrate() {
  if (game.crates.length >= 2) return;
  let r = Math.random(), w = 'nail'; for (const [k, p] of CRATE_ODDS) { if ((r -= p) < 0) { w = k; break; } }
  game.crates.push({ x: 40 + Math.random() * (W - 80), y: -30, w, life: 14, sway: Math.random() * 6 });   // 📦 slow under its chute, and it waits a while on the ground
}
function openCrate(c) {
  game.crates.splice(game.crates.indexOf(c), 1); host.cue?.('pickup', c.x, c.y);
  game.arsenal[c.w] = (game.arsenal[c.w] || 0) + WEAPONS[c.w].ammo; game.weapon = c.w;
  host.banner(`${WEAPONS[c.w].icon} ${WEAPONS[c.w].name.toUpperCase()}`, WEAPONS[c.w].desc); sfx('chime'); renderBar();
  burst(c.x, c.y, ['#C98B4A', '#F5C542', '#FFF'], 18);
}
function spend() {
  const w = game.weapon; if (w === 'staple') return;
  game.arsenal[w] -= 1; if (game.arsenal[w] <= 0) { delete game.arsenal[w]; game.weapon = 'staple'; }
  renderBar();
}
function throwAcorn() {
  const live = game.squirrels.filter((q) => !q.hop); if (!live.length) return;
  const sq = live[Math.floor(Math.random() * live.length)], p = sqPos(sq), st = STAPLER();
  sq.angry = 1.2;
  game.acorns.push({ x0: p.x, y0: p.y, x1: st.x + (Math.random() - 0.5) * 30, y1: st.y - 10, t: 0, tf: 2.2 - Math.min(0.5, level * 0.12), spin: Math.random() * 6 });
}
const acornPos = (a) => { const e = Math.min(1, a.t / a.tf); return { x: a.x0 + (a.x1 - a.x0) * e, y: a.y0 + (a.y1 - a.y0) * e - Math.sin(e * Math.PI) * 70 }; };
function bonk() {
  game.stun = 0.7; game.shake = 0.45; host.cue?.('near', STAPLER().x, STAPLER().y);
  const st = STAPLER(); comic('BONK!', st.x, st.y - 40, '#FF6B5A'); sfx('thud'); sfx('buzz', { delay: 0.1 }); navigator.vibrate?.(120);
  burst(st.x, st.y - 16, ['#8A5A2B', '#C98B4A', '#FFE08A'], 20); smoke(st.x, st.y - 12, 3, 6);
  if (host.hurt('bonked')) game.ko = true;
}

// ---------------------------------------------------------------- the stapler
function fire(x, y) {
  if (!game || S.over || game.dive) return;
  const st = STAPLER(), w = game.weapon;
  const owl = game.owls?.find((o) => Math.hypot(o.x - x, o.y - y) < 40); if (owl) { game.owls.splice(game.owls.indexOf(owl), 1); add(150, owl, 'HOOT!'); tufts(owl.x, owl.y, 8); sfx('clack'); return; }
  const cone = game.cones?.find((c) => Math.hypot(c.x - x, c.y - y) < 28); if (cone) { game.cones.splice(game.cones.indexOf(cone), 1); add(60, cone, 'SWAT!'); burst(cone.x, cone.y, ['#8A5A2B', '#5A3B1F'], 8); sfx('clack'); return; }
  const snake = game.snakes?.find((s) => Math.abs(s.x - x) < 44 && Math.abs(st.y - 12 - y) < 40); if (snake) { game.snakes.splice(game.snakes.indexOf(snake), 1); add(120, { x: snake.x, y: st.y - 14 }, 'SHOO!'); burst(snake.x, st.y - 8, ['#5CB85C', '#2E7D4F'], 10); sfx('thud'); return; }
  // 📦 a crate under your finger opens on the tap itself, no staple spent; acorns and pinecones go on a near miss too
  const crate = game.crates.find((c) => Math.hypot(c.x - x, c.y - y) < 30 * crateScale(c)); if (crate) { openCrate(crate); return; }
  const target = game.acorns.some((a) => { const q = acornPos(a); return Math.hypot(q.x - x, q.y - y) < 30; });
  if (!target && Math.hypot(x - st.x, y - st.y) < 34) return reload();
  const acorn = game.acorns.find((a) => { const q = acornPos(a); return Math.hypot(q.x - x, q.y - y) < 30; });
  if (acorn && game.stun <= 0) {
    if (w === 'staple') { if (game.reloadT > 0 || game.ammo <= 0) { sfx('buzz'); return; } game.ammo -= 1; if (game.ammo === 0) reload(); }
    const q = acornPos(acorn); game.acorns.splice(game.acorns.indexOf(acorn), 1); add(25, q, 'SWAT!'); burst(q.x, q.y, ['#8A5A2B', '#C98B4A'], 10); sfx('clack');
    return;
  }
  if (game.stun > 0) { sfx('buzz'); return; }
  const wind = game.twist?.kind === 'gust' ? game.twist.wind : 0;
  if (w === 'staple') {
    if (game.reloadT > 0) { sfx('buzz'); return; }
    if (game.ammo <= 0) { reload(); return; }
    game.ammo -= 1; game.shots += 1;
    const tf = Math.hypot(x - st.x, y - st.y) / 1500;
    game.staples.push({ x0: st.x, y0: st.y, x: x + wind * tf * 3, y, t: 0, tf });
    sfx('clack'); muzzle(st);
    if (game.ammo === 0) reload();
    return;
  }
  game.shots += 1; spend(); muzzle(st);
  if (w === 'nail') {
    const tf = Math.hypot(x - st.x, y - st.y) / 2400;
    game.staples.push({ x0: st.x, y0: st.y, x: x + wind * tf * 3 + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, t: 0, tf, nail: true });
    sfx('click');
  } else if (w === 'shotgun') {
    const a = Math.atan2(y - st.y, x - st.x), d = Math.hypot(x - st.x, y - st.y);
    for (let i = -2; i <= 2; i++) { const b = a + i * 0.11, tf = d / 1500; game.staples.push({ x0: st.x, y0: st.y, x: st.x + Math.cos(b) * d + wind * tf * 3, y: st.y + Math.sin(b) * d, t: 0, tf }); }
    game.shake = Math.max(game.shake, 0.15); sfx('cannon');
  } else if (w === 'bomb') {
    game.bombs.push({ x0: st.x, y0: st.y - 10, x, y, t: 0, tf: 0.6 }); sfx('whistle', { dur: 0.5 });
  } else if (w === 'chain') {
    let best = null, bd = 40;
    game.squirrels.forEach((sq) => { const p = sqPos(sq), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = sq; } });
    sfx('flash');
    if (!best) { game.bolts.push({ pts: bolt(st.x, st.y, x, y), life: 0.25 }); S.combo = 0; return; }
    chain(best, st, 2, new Set());
  } else if (w === 'chaos') {
    sfx('twist'); game.shake = Math.max(game.shake, 0.2);
    const pts = [], lines = [];
    const branchOut = (px, py, a, len, g) => { pts.push([px, py]); if (g === 3) return;
      for (const d of [-0.55, 0.55]) { const qx = px + Math.cos(a + d) * len, qy = py + Math.sin(a + d) * len; lines.push([px, py, qx, qy]); branchOut(qx, qy, a + d, len * 0.62, g + 1); } };
    branchOut(x, y, Math.atan2(y - st.y, x - st.x), 46, 0);
    lines.unshift([st.x, st.y, x, y]);
    game.bolts.push({ lines, life: 0.4, col: '#3DD6C6' });
    pts.forEach(([px, py], i) => setTimeout(() => hitAt(px, py, 9, true), 40 + i * 12));
  }
}
function muzzle(st) { game.kick = 1; game.fx.push({ kind: 'flash', x: st.x + 6, y: st.y - 16, r: 7, life: 0.12, tf: 0.12 }); }
function reload() { if (game.reloadT > 0 || game.ammo === AMMO) return; game.reloadT = RELOAD_S; sfx('tick'); }
function land(s) { if (!hitAt(s.x, s.y, s.nail ? 8 : 12)) { const onTree = forest.segs.some((sg) => segDist(s.x, s.y, sg) < sg.w / 2 + 3); if (onTree) { game.stuck.push({ x: s.x, y: s.y, a: Math.random() * 3, life: 4 }); const se = season(); for (let i = 0; i < (se.leafAmt > 0.5 ? 3 : 1); i++) game.fx.push({ kind: 'flutter', x: s.x + (Math.random() - 0.5) * 16, y: s.y - 4 - Math.random() * 10, a: Math.random() * 6, c: (se.bloom && i === 0 ? se.bloom : se.leaf)[1 + Math.floor(Math.random() * 2)], life: 1.6 }); }
    S.combo = 0; burst(s.x, s.y, ['#E9E4D0', '#9AA7B0'], 6); game.fx.push({ kind: 'spark', x: s.x, y: s.y, a: Math.random() * 6, life: 0.22, tf: 0.22 }); } }
function hitAt(x, y, slack, quiet = false) {
  if (!game || S.over) return false;
  const crate = game.crates.find((c) => Math.hypot(c.x - x, c.y - y) < 26 * crateScale(c));   // a staple near a crate opens it too
  if (crate) { openCrate(crate); return true; }
  const acorn = game.acorns.find((a) => { const q = acornPos(a); return Math.hypot(q.x - x, q.y - y) < 24; });
  if (acorn) { const q = acornPos(acorn); game.acorns.splice(game.acorns.indexOf(acorn), 1); add(25, q, 'CRACK!'); burst(q.x, q.y, ['#8A5A2B', '#C98B4A'], 10); sfx('clack'); return true; }
  let best = null, bd = Infinity;
  game.squirrels.forEach((sq) => { const p = sqPos(sq), d = Math.hypot(p.x - x, p.y - y); if (d < RAD[sq.size] + slack && d < bd) { bd = d; best = sq; } });
  if (!best) return false;
  strike(best, quiet); return true;
}
function chain(sq, from, depth, seen) {
  seen.add(sq); const p = sqPos(sq);
  game.bolts.push({ pts: bolt(from.x, from.y, p.x, p.y), life: 0.3 });
  strike(sq, true);
  if (!depth) return;
  game.squirrels.filter((q) => !seen.has(q)).map((q) => ({ q, d: Math.hypot(sqPos(q).x - p.x, sqPos(q).y - p.y) })).filter((o) => o.d < 130)
    .sort((a, b) => a.d - b.d).slice(0, 2).forEach((o) => chain(o.q, p, depth - 1, seen));
}
function bolt(x1, y1, x2, y2) {   // a jagged bolt: midpoint displacement, 4 levels (fractal lightning)
  let pts = [[x1, y1], [x2, y2]], amp = Math.hypot(x2 - x1, y2 - y1) * 0.25;
  for (let l = 0; l < 4; l++, amp *= 0.5) { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [c, d] = pts[i]; out.push([(a + c) / 2 + (Math.random() - 0.5) * amp, (b + d) / 2 + (Math.random() - 0.5) * amp], pts[i]); } pts = out; }
  return pts;
}
function explode(x, y) {
  const R = 58;
  game.fx.push({ kind: 'flash', x, y, r: 40, life: 0.18, tf: 0.18, c: '#FFF4D6' }, { kind: 'ring', x, y, r: 6, R, life: 0.45 });
  smoke(x, y, 9, 10);
  burst(x, y, ['#FFF4D6', '#FFC857', '#FF8A3D', '#E0453A', '#DDE3E8'], 46);
  comic('KA-BOOM!', x, y - 20, '#FFC857'); game.shake = Math.max(game.shake, 0.5); sfx('boom', { size: 1.3 }); navigator.vibrate?.(90);
  game.acorns = game.acorns.filter((a) => { const q = acornPos(a); if (Math.hypot(q.x - x, q.y - y) < R) { host.add(25); return false; } return true; });
  game.squirrels.filter((sq) => { const p = sqPos(sq); return Math.hypot(p.x - x, p.y - y) < R + RAD[sq.size]; }).forEach((sq) => strike(sq, true));
  game.crates.filter((c) => Math.hypot(c.x - x, c.y - y) < R).forEach(openCrate);
}
function smoke(x, y, n, r0) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 10 + Math.random() * 40; game.fx.push({ kind: 'smoke', x: x + Math.cos(a) * r0 * 0.5, y: y + Math.sin(a) * r0 * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 18, r: r0 * (0.5 + Math.random() * 0.6), life: 0.9 + Math.random() * 0.5, c: Math.random() < 0.5 ? '#8A8580' : '#6E6A66' }); } }
function comic(text, x, y, col = '#FFE08A') { game.fx.push({ kind: 'text', x, y, text, life: 1.1, col, big: true }); }
function strike(best, quiet) {
  if (!game.squirrels.includes(best)) return;
  const p = sqPos(best);
  game.hits += 1; host.cue?.('kill', p.x, p.y);
  game.fx.push({ kind: 'pow', x: p.x, y: p.y, r: RAD[best.size] * 1.7, rot: Math.random() * 6, life: 0.26, tf: 0.26, gold: best.gold });
  if (best.size > 1) {   // 🐿️🐿️ it splits: two smaller ones leap away
    game.squirrels.splice(game.squirrels.indexOf(best), 1);
    for (const d of [-1, 1]) { const kid = { ...best, size: best.size - 1, hop: null, daze: 1.4, angry: 0 }; hopTo(kid, p); kid.hop.x0 = p.x + d * 8; game.squirrels.push(kid); }
    add(20 * best.size, p, best.size === 3 ? 'SPLIT!' : 'SPLAT-TER!'); if (!quiet) sfx('boing'); tufts(p.x, p.y, 10);
    return;
  }
  game.squirrels.splice(game.squirrels.indexOf(best), 1);
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 1.6;
  const pts = (best.gold ? 1000 : 100) * fibMult(S.combo);   // 🌻 combos count in Fibonacci: 1, 2, 3, 5, 8, 13…
  add(pts, p, best.gold ? 'JACKPOT!' : WORDS[Math.floor(Math.random() * WORDS.length)]); game.pins.push({ x: p.x, y: p.y, face: best.face, gold: best.gold, t: 0 });
  tufts(p.x, p.y, 8);
  if (S.combo >= 3) { game.hitstop = 0.07; if (S.combo % 5 === 0) comic(`${S.combo}× COMBO · F = ${fibMult(S.combo)}`, W / 2, H() * 0.35, '#FF8AD8'); }
  if (!quiet || best.gold) sfx(best.gold ? 'chime' : 'pop');
}
function add(pts, p, word) { host.add(pts); game.fx.push({ kind: 'text', x: p.x, y: p.y - 12, text: word ? `${word} +${pts}` : `+${pts}`, life: 1 }); }
function tufts(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 110; game.fx.push({ kind: 'tuft', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, a: Math.random() * 6, life: 1.1, c: ['#B5703A', '#E9C9A0', '#8A5A2B'][i % 3] }); } }
function segDist(x, y, s) { const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy || 1; let t = ((x - s.x1) * dx + (y - s.y1) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(s.x1 + t * dx - x, s.y1 + t * dy - y); }
function burst(x, y, cols, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; game.fx.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, c: cols[i % cols.length], life: 0.8, r: 1.5 + Math.random() * 2 }); } }

// ---------------------------------------------------------------- days: dive into the knothole
function endLevel() {
  game.dive = { t: 0, dur: host.reduceMotion ? 0.01 : 1.6, phase: 'in' };
  game.squirrels.forEach((sq) => { if (!sq.hop) hopTo(sq); });
  sfx('whistle', { dur: 1.2 });
}
function nextLevel() {
  level += 1; game.speed *= 1.15;
  game.kept = game.kept.map((p) => ({ ...p, x: 20 + Math.random() * (W - 40), y: 90 + Math.random() * (H() - 200) }));   // they came along
  forest = grow((forest.seed * 16807 + level) >>> 0 || 1, level);
  game.squirrels = []; game.stuck = []; game.pins = []; game.leaves = []; game.twist = null; game.ammo = AMMO; game.reloadT = 0; game.acorns = []; game.crates = []; game.bombs = []; game.bolts = []; game.stun = 0;
  game.dive = { t: 0, dur: host.reduceMotion ? 0.01 : 1.2, phase: 'out' };
  host.heal(1);   // a breather: one heart back
  game.eye = { open: 0, blink: 0, blinkT: 4 }; game.glitch = 0; game.stare = 0;
  const sub = ['', 'deeper in · something is watching · ❤️ +1', 'the eyes are open · ❤️ +1', 'IT WAKES'][Math.min(3, level - 1)] || 'it is still awake';
  const se = season(); game.said = level; look.amb = []; look.ambKey = '';
  host.banner(`${se.icon} DAY ${level} · ${se.name}`, sub); if (level >= 4) { sfx('stinger'); sfx('heartbeat'); }
}

// ---------------------------------------------------------------- the loop
function update(dt) {
  if (game && !game.dive) camStep(dt);
  W = host?.W || W;   // 🎚️ the world widens with the stage
  const g = game;
  if (g.dive) {
    g.dive.t += dt;
    if (g.dive.t >= g.dive.dur) {
      if (g.dive.phase === 'in') { if (level >= LEVELS && !host.morphs) { g.dive = null; host.over('sleeps'); return; } nextLevel(); }   // in a run the forest goes on: it stays awake
      else g.dive = null;
    }
    return;
  }
  if (g.hitstop > 0) { g.hitstop -= dt; return; }   // a beat of freeze on a big combo
  { const st = host.stage?.() || 1, to = st >= 2 ? 1 : 0; g.perch += (to - g.perch) * Math.min(1, dt * 0.8); if (to && !g.centred) { g.centred = true; host.banner('🎯 UP TO THE PERCH', 'they come from above and below now'); } }
  g.time += dt;
  if (g.time >= level * LEVEL_S) return endLevel();
  if (g.stun > 0) g.stun -= dt;
  if (g.kick > 0) g.kick = Math.max(0, g.kick - dt * 7);
  if (g.said !== level && g.time > 1.4) { g.said = level; const se = season(); host.banner(`${se.icon} DAY ${level} · ${se.name}`, se.sub); }   // 🌸 the first day's season, once the run's own banner has had its moment
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt);
  if (g.stare > 0) g.stare -= dt;
  // 🌘 the dark side: whispers, tears in the picture, and the eye in the knot
  g.whisperT -= dt;
  if (g.whisperT <= 0) { g.whisperT = Math.max(3.5, 15 - level * 3.2) + Math.random() * 4; if (level >= 2) { g.fx.push({ kind: 'whisper', x: 40 + Math.random() * (W - 80), y: 120 + Math.random() * (H() - 260), text: WHISPERS[Math.floor(Math.random() * WHISPERS.length)], life: 4.5, tf: 4.5 }); if (level >= 3) sfx('heartbeat'); } }
  if (g.glitch > 0) g.glitch -= dt;
  else if (Math.random() < dt * (0.02 * level + (S.curve.r >= 3.5699 ? 0.04 : 0) + (level >= 4 ? 0.12 : 0))) g.glitch = 0.12 + Math.random() * 0.25;
  if (level >= 4) { g.eye.open = Math.min(1, g.eye.open + dt / 3); g.eye.blinkT -= dt; if (g.eye.blinkT <= 0) { g.eye.blinkT = 3 + Math.random() * 4; g.eye.blink = 0.22; } if (g.eye.blink > 0) g.eye.blink -= dt; }
  g.kept.forEach((p) => { p.tw = Math.max(0, p.tw - dt); if (Math.random() < dt * (0.05 + dark() * 0.4)) p.tw = 0.4; });
  if (hold && g.weapon === 'nail' && (g.nailT = (g.nailT || 0) - dt) <= 0) { g.nailT = 0.09; fire(hold.x, hold.y); }   // 🔩 hold to fire
  g.crateT -= dt * (1 + S.curve.x); if (g.crateT <= 0) { g.crateT = 7 + Math.random() * 5; dropCrate(); }
  g.crates.forEach((c) => { if (c.y < forest.ground - 16) c.y += 34 * dt; else c.life -= dt; c.sway += dt; });
  g.crates = g.crates.filter((c) => c.life > 0);
  g.acorns.forEach((a) => { a.t += dt; a.spin += dt * 9; });
  g.acorns = g.acorns.filter((a) => { if (a.t >= a.tf) { bonk(); return false; } return true; });
  // 🦉 owls (Stage 2+) glide over the stapler and drop pinecones on it; 🐍 snakes (Stage 3+) slither in along the ground. Tap them away.
  { const st = host.stage?.() || 1, sp = STAPLER(); if (!g.owls) { g.owls = []; g.cones = []; g.snakes = []; g.owlT = 3; g.snakeT = 4; }
    if (st >= 2) { g.owlT -= dt; if (g.owlT <= 0 && g.owls.length < st - 1) { g.owlT = 6 - st + Math.random() * 3; const dir = Math.random() < 0.5 ? 1 : -1; g.owls.push({ x: dir > 0 ? -30 : W + 30, y: 90 + Math.random() * 60, dir, v: 50 + st * 15, dropped: false, flap: 0 }); } }
    g.owls = g.owls.filter((o) => { o.x += o.dir * o.v * dt; o.flap += dt * 8; if (!o.dropped && Math.abs(o.x - sp.x) < 10 + st * 6) { o.dropped = true; g.cones.push({ x: o.x, y: o.y + 10, vy: 30, spin: 0 }); sfx('tick'); } return o.x > -40 && o.x < W + 40; });
    g.cones = g.cones.filter((c) => { c.vy += 260 * dt; c.y += c.vy * dt; c.spin += dt * 6; if (c.y >= sp.y - 12) { if (Math.abs(c.x - sp.x) < 30) bonk(); else burst(c.x, sp.y - 8, ['#8A5A2B', '#5A3B1F'], 8); return false; } return true; });
    if (st >= 3) { g.snakeT -= dt; if (g.snakeT <= 0 && g.snakes.length < st - 2) { g.snakeT = 7 - st + Math.random() * 3; const dir = Math.random() < 0.5 ? 1 : -1; g.snakes.push({ x: dir > 0 ? -30 : W + 30, dir, v: 28 + st * 8, ph: 0 }); } }
    g.snakes = g.snakes.filter((s) => { s.x += s.dir * s.v * dt; s.ph += dt * 7; if (Math.abs(s.x - sp.x) < 26) { bonk(); burst(s.x, sp.y - 6, ['#5CB85C', '#2E7D4F'], 10); return false; } return true; });
  }
  if (S.over) return;
  g.bombs = g.bombs.filter((b) => { b.t += dt; if (b.t >= b.tf) { explode(b.x, b.y); return false; } return true; });
  g.bolts.forEach((b) => { b.life -= dt; }); g.bolts = g.bolts.filter((b) => b.life > 0);
  g.squirrels.forEach((sq) => { if (sq.daze > 0) sq.daze -= dt; if (sq.angry > 0) sq.angry -= dt; });
  if (g.twist && g.time > g.twist.until) g.twist = null;
  if (g.reloadT > 0) { g.reloadT -= dt; if (g.reloadT <= 0) { g.reloadT = 0; g.ammo = AMMO; } }
  g.squirrels.forEach((sq) => moveSquirrel(sq, sq.daze > 0 ? dt * 0.35 : dt));
  g.staples = g.staples.filter((s) => { s.t += dt; if (s.t >= s.tf) { land(s); return false; }
    // 📎 in flight: the first squirrel in the staple's path takes it (the falling things only count where it lands)
    const e = s.t / s.tf, sx = s.x0 + (s.x - s.x0) * e, sy = s.y0 + (s.y - s.y0) * e; let best = null, bd = Infinity;
    g.squirrels.forEach((sq) => { const p = sqPos(sq), d = Math.hypot(p.x - sx, p.y - sy); if (d < RAD[sq.size] + (s.nail ? 7 : 9) && d < bd) { bd = d; best = sq; } });
    if (best) { strike(best, false); return false; }
    return true; });
  g.pins.forEach((p) => { p.t += dt; }); g.pins = g.pins.filter((p) => { if (p.t > 0.9) { burst(p.x, p.y, p.gold ? ['#F5C542', '#FFF3C4'] : ['#C98B4A', '#8A5A2B', '#F2E3C0'], 16); if (!p.gold) { g.kept.push({ x: p.x, y: p.y, face: p.face, tw: 0 }); if (g.kept.length > 40) g.kept.shift(); } return false; } return true; });
  g.stuck.forEach((s) => { s.life -= dt; }); g.stuck = g.stuck.filter((s) => s.life > 0);
  g.fx.forEach((f) => { f.life -= dt; const k = f.kind; if (k === 'whisper' || k === 'pow' || k === 'flash' || k === 'spark') return;
    if (k === 'dot' || k === 'tuft') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (k === 'tuft' ? 160 : 300) * dt; f.a = (f.a || 0) + dt * 5; }
    else if (k === 'smoke') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - dt * 2; f.r += dt * 16; }
    else if (k === 'flutter') { f.a += dt * 4; f.x += Math.sin(f.a) * 22 * dt; f.y += 26 * dt; }
    else if (k === 'ring') f.r += (f.R - f.r) * Math.min(1, dt * 14); else f.y -= 30 * dt; });
  g.fx = g.fx.filter((f) => f.life > 0);
  g.leaves.forEach((l) => { l.x += l.vx * dt; l.y += l.vy * dt; l.a += dt * 3; if (l.y > H() + 10) { l.y = -10; l.x = Math.random() * W; } });
  if (g.twist?.kind !== 'leaves') g.leaves = g.leaves.filter((l) => l.y > 0 && l.y < H());
}

// ---------------------------------------------------------------- the look: a season a day (page only)
// 🌸 Day 1 a spring morning, ☀️ Day 2 a summer afternoon already going dim, 🍂 Day 3 autumn at dusk, 🌑 Day 4 the
// dead of night (bare trees, a red moon, ash in the air); in a run the days go round again after dark. Static things
// are painted once into offscreen canvases (`look`): the far sky and hills and the mid tree line (drawn with their own
// parallax camera, half resolution: soft, like distance), the forest floor and the trees (bark, moss, twigs, foliage),
// at the camera's zoom bucket, rebuilt only when the forest, the season or the size changes. Squirrels are sprites.
const SEASONS = [
  { key: 'spring', icon: '🌸', name: 'SPRING MORNING', sub: 'blossom on every branch',
    sky: ['#79B4E6', '#BCDDF2', '#FCE4CC'], orb: { moon: false, x: 0.2, y: 0.17, c: '#FFF8DC', glow: 'rgba(255,244,205,' }, cloud: 'rgba(255,255,255,0.8)', stars: 0,
    far: '#9DC5B6', far2: '#86B79E', mid: '#6E9E78', haze: 'rgba(225,242,236,', shaft: 'rgba(255,250,225,', shaftA: 0.13,
    bark: ['#5E4128', '#36231A', '#8C6A48'], moss: '#7FB04A', leaf: ['#3D8638', '#58A644', '#86C960', '#BDE58C'], bloom: ['#F7B6CF', '#FFD3E3', '#FFFFFF', '#F49AC1'], leafAmt: 1,
    soil: ['#4E3622', '#2E1F13'], grass: ['#4E8A2E', '#79BD48', '#A8DB6E'], fallen: ['#F7B6CF', '#FFD9E6', '#FFFFFF'], nFallen: 50, flowers: ['#FFE066', '#FFFFFF', '#F7B6CF', '#B99CFF'], shroom: ['#E4572E', '#FFF4E0'], glowShroom: false,
    fur: ['#B86A33', '#7A421E', '#F2D2A6'], amb: 'petal', ambCols: ['#F7B6CF', '#FFD9E6', '#FFFFFF'] },
  { key: 'summer', icon: '☀️', name: 'SUMMER AFTERNOON', sub: 'long shadows, and something in them',
    sky: ['#4A78B4', '#A8BCD0', '#F2BE7A'], orb: { moon: false, x: 0.8, y: 0.34, c: '#FFE8A0', glow: 'rgba(255,190,110,' }, cloud: 'rgba(255,247,230,0.7)', stars: 0,
    far: '#7FA58E', far2: '#638F70', mid: '#41703F', haze: 'rgba(242,224,178,', shaft: 'rgba(255,228,160,', shaftA: 0.15,
    bark: ['#55392A', '#2E1E16', '#7E5E43'], moss: '#5E8E36', leaf: ['#1D5A28', '#2D7631', '#479639', '#76BC52'], bloom: null, leafAmt: 1.2,
    soil: ['#423020', '#24170D'], grass: ['#3B6E25', '#5D9A33', '#8BC34A'], fallen: ['#6E8B3D', '#8E9A48'], nFallen: 24, flowers: ['#FFCC33', '#FF7A45', '#FFFFFF'], shroom: ['#C0392B', '#FFF0D0'], glowShroom: false,
    fur: ['#A85A2A', '#683618', '#EAC492'], amb: 'mote', ambCols: ['#FFF3B0', '#FFE7A0'] },
  { key: 'autumn', icon: '🍂', name: 'AUTUMN DUSK', sub: 'the leaves fall, the eyes do not',
    sky: ['#2E2350', '#A04C76', '#F09A58'], orb: { moon: false, x: 0.56, y: 0.6, c: '#FFC27A', glow: 'rgba(255,140,80,' }, cloud: 'rgba(255,170,150,0.45)', stars: 40,
    far: '#6A466A', far2: '#573955', mid: '#3F2840', haze: 'rgba(240,150,115,', shaft: 'rgba(255,165,110,', shaftA: 0.12,
    bark: ['#4A2F20', '#22140D', '#6E4E38'], moss: null, leaf: ['#8E2A1C', '#C94E26', '#E2852D', '#F2C14E'], bloom: null, leafAmt: 0.8,
    soil: ['#3A2414', '#1E120A'], grass: ['#6B5A2A', '#8E7A36', '#B59A48'], fallen: ['#C94E26', '#E2852D', '#F2C14E', '#8E2A1C'], nFallen: 150, flowers: null, shroom: ['#8E5A2B', '#F2E3C0'], glowShroom: false,
    fur: ['#8E4A24', '#4E240E', '#D9B08A'], amb: 'leaf', ambCols: ['#C94E26', '#E2852D', '#F2C14E'] },
  { key: 'night', icon: '🌑', name: 'DEAD OF NIGHT', sub: 'IT WAKES',
    sky: ['#040208', '#170610', '#3A0A12'], orb: { moon: true, x: 0.74, y: 0.15, c: '#E9D2C4', glow: 'rgba(210,50,50,' }, cloud: 'rgba(60,20,30,0.5)', stars: 160,
    far: '#1C0D15', far2: '#160A10', mid: '#0E050A', haze: 'rgba(120,20,30,', shaft: 'rgba(200,185,225,', shaftA: 0.06,
    bark: ['#2C2020', '#100909', '#4A3A3A'], moss: null, leaf: ['#231612', '#33201A', '#4A2E22', '#5A3A2A'], bloom: null, leafAmt: 0.12,
    soil: ['#1C120E', '#080504'], grass: ['#2A271C', '#38331F', '#4A432A'], fallen: ['#33201A', '#231612'], nFallen: 40, flowers: null, shroom: ['#CFE8D8', '#8FF0C8'], glowShroom: true,
    fur: ['#463C3C', '#1C1616', '#7E7270'], amb: 'ash', ambCols: ['#FF5A3A', '#9A8A8A', '#C9B8B8'] },
];
const GOLD_FUR = ['#F5C542', '#B8861E', '#FFF1B8'];
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const lateSeasons = new Map();
// a run goes on past Day 4: the seasons come round again, after dark
function season() {
  const i = (level - 1) % 4, s = SEASONS[i];
  if (level <= 4 || i === 3) return s;
  if (!lateSeasons.has(i)) {
    const n = SEASONS[3], m = (a, b, t) => a.map((c, j) => mixHex(c, b[Math.min(j, b.length - 1)], t));
    lateSeasons.set(i, { ...s, key: `${s.key}-late`, name: `${s.name.split(' ')[0]} AFTER DARK`, sky: m(s.sky, n.sky, 0.72), far: mixHex(s.far, n.far, 0.65), far2: mixHex(s.far2, n.far2, 0.65), mid: mixHex(s.mid, n.mid, 0.65),
      leaf: m(s.leaf, n.leaf, 0.45), grass: m(s.grass, n.grass, 0.5), soil: m(s.soil, n.soil, 0.5), bark: m(s.bark, n.bark, 0.4), orb: n.orb, stars: 120, cloud: n.cloud, shaftA: 0.05, haze: n.haze, fur: m(s.fur, n.fur, 0.4) });
  }
  return lateSeasons.get(i);
}
const look = { back: null, wood: null, vig: null, spr: new Map(), sprKey: '', amb: [], ambKey: '', lastT: 0, builtAt: -1e9, live: 0 };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function ridge(r, n, amp, rough) {   // midpoint displacement: 2^n + 1 heights
  const N = 1 << n, y = new Array(N + 1).fill(0); y[0] = (r() - 0.5) * amp; y[N] = (r() - 0.5) * amp;
  for (let step = N, a = amp; step > 1; step >>= 1, a *= rough) for (let i = step / 2; i < N; i += step) y[i] = (y[i - step / 2] + y[i + step / 2]) / 2 + (r() - 0.5) * a;
  return y;
}
function silTree(g, r, x, y, a, len, d) {   // a distant fractal tree, as a silhouette
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  g.lineWidth = Math.max(0.6, len * 0.12); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
  if (d <= 0) { g.beginPath(); g.arc(x2, y2, len * 0.9, 0, 7); g.fill(); return; }
  for (const s of [-1, 1]) silTree(g, r, x2, y2, a + s * (0.35 + r() * 0.25), len * (0.62 + r() * 0.1), d - 1);
}

// ---- the back: sky, sun or moon, clouds, far hills (far) and the tree line with light shafts (mid)
function buildBack(se, k) {
  const Hh = H(), gr = forest.ground, X0 = -W * 0.8, X1 = W * 1.8, Y0 = -Hh * 0.6, Y1 = Hh * 1.6, ww = X1 - X0, hh = Y1 - Y0;
  const r = rng((forest.seed ^ 0x5eed) >>> 0), q = Math.min(k * 0.6, Math.sqrt(2.6e6 / (ww * hh))), c = mk(ww * q, hh * q);
  let g = c.getContext('2d', { alpha: false }); g.setTransform(q, 0, 0, q, -X0 * q, -Y0 * q);
  const sky = g.createLinearGradient(0, Y0 * 0.3, 0, gr); sky.addColorStop(0, se.sky[0]); sky.addColorStop(0.6, se.sky[1]); sky.addColorStop(1, se.sky[2]);
  g.fillStyle = sky; g.fillRect(X0, Y0, ww, gr - Y0 + 4); g.fillStyle = se.far2; g.fillRect(X0, gr, ww, Y1 - gr);
  for (let i = 0; i < se.stars; i++) { const x = X0 + r() * ww, y = Y0 + r() * (gr * 0.55 - Y0), a = 0.25 + r() * 0.6; g.fillStyle = `rgba(255,${se.orb.moon ? 220 : 240},${se.orb.moon ? 210 : 230},${a})`; g.fillRect(x, y, r() < 0.15 ? 1.6 : 0.9, r() < 0.15 ? 1.6 : 0.9); }
  { const o = se.orb, ox = W * o.x, oy = Hh * o.y, R = o.moon ? 22 : 26;
    const gl = g.createRadialGradient(ox, oy, R * 0.6, ox, oy, R * 5); gl.addColorStop(0, o.glow + '0.55)'); gl.addColorStop(0.35, o.glow + '0.18)'); gl.addColorStop(1, o.glow + '0)');
    g.fillStyle = gl; g.fillRect(ox - R * 5, oy - R * 5, R * 10, R * 10);
    g.fillStyle = o.c; g.beginPath(); g.arc(ox, oy, R, 0, 7); g.fill();
    if (o.moon) { g.fillStyle = 'rgba(150,90,90,0.35)'; [[-7, -5, 5], [6, 3, 7], [-3, 9, 3.5], [9, -9, 3]].forEach(([dx, dy, cr]) => { g.beginPath(); g.arc(ox + dx, oy + dy, cr, 0, 7); g.fill(); });
      g.strokeStyle = 'rgba(255,80,70,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(ox, oy, R + 1, 0, 7); g.stroke(); }
    else { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(ox - R * 0.3, oy - R * 0.3, R * 0.45, 0, 7); g.fill(); } }
  g.fillStyle = se.cloud;
  for (let i = 0; i < 7; i++) { const cx = X0 + r() * ww, cy = Y0 * 0.2 + r() * Hh * 0.32, s = 0.7 + r() * 1.1; for (let j = 0; j < 6; j++) { g.beginPath(); g.ellipse(cx + (j - 2.5) * 13 * s + r() * 6, cy - Math.sin((j / 5) * Math.PI) * 9 * s + r() * 4, 16 * s, 9 * s, 0, 0, 7); g.fill(); } }
  [[se.far, gr - 170, 110, 0.55], [se.far2, gr - 95, 70, 0.5]].forEach(([col, base, amp, rough]) => {
    const ys = ridge(r, 7, amp, rough), n = ys.length - 1;
    g.fillStyle = col; g.beginPath(); g.moveTo(X0, Y1); ys.forEach((y, i) => g.lineTo(X0 + (ww * i) / n, base + y)); g.lineTo(X1, Y1); g.closePath(); g.fill();
    const hz = g.createLinearGradient(0, base - amp, 0, gr); hz.addColorStop(0, se.haze + '0)'); hz.addColorStop(1, se.haze + '0.35)'); g.fillStyle = hz; g.fill(); });
  g.fillStyle = se.mid; g.strokeStyle = se.mid; g.lineCap = 'round';
  const tl = ridge(r, 6, 30, 0.6), tn = tl.length - 1;
  for (let x = X0; x < X1; x += 9 + r() * 14) { const i = Math.round(((x - X0) / ww) * tn), y = gr - 40 + tl[i]; silTree(g, r, x, y + 6, -Math.PI / 2 + (r() - 0.5) * 0.15, 16 + r() * 20, 4); }
  g.beginPath(); g.moveTo(X0, Y1); tl.forEach((y, i) => g.lineTo(X0 + (ww * i) / tn, gr - 40 + y)); g.lineTo(X1, Y1); g.closePath(); g.fill();
  { const hz = g.createLinearGradient(0, gr - 160, 0, gr); hz.addColorStop(0, se.haze + '0)'); hz.addColorStop(1, se.haze + '0.28)'); g.fillStyle = hz; g.fillRect(X0, gr - 160, ww, Y1 - gr + 160); }
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const x = W * (0.05 + r() * 0.9), w0 = 10 + r() * 22, lean = 120 + r() * 80, a = se.shaftA * (0.5 + r() * 0.7);
    const sg = g.createLinearGradient(0, Y0 * 0.2, 0, gr); sg.addColorStop(0, se.shaft + a + ')'); sg.addColorStop(1, se.shaft + '0)'); g.fillStyle = sg;
    g.beginPath(); g.moveTo(x, Y0 * 0.2); g.lineTo(x + w0, Y0 * 0.2); g.lineTo(x + w0 * 2.4 + lean, gr); g.lineTo(x + lean, gr); g.closePath(); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return { c, X0, Y0, ww, hh, se: se.key, W, Hh, k, seed: forest.seed };
}

// ---- the wood: the forest floor and the trees, at the camera's zoom
function buildWood(se, ks) {
  const f = forest, Hh = H(), gr = f.ground, r = rng((f.seed * 7919 + 13) >>> 0), cap = (area) => Math.min(ks, Math.sqrt(4e6 / area));
  // the floor
  const FX0 = -70, FX1 = W + 70, FY0 = gr - 30, FY1 = Hh + 70, fq = cap((FX1 - FX0) * (FY1 - FY0)), fc = mk((FX1 - FX0) * fq, (FY1 - FY0) * fq), g = fc.getContext('2d');
  g.setTransform(fq, 0, 0, fq, -FX0 * fq, -FY0 * fq); g.lineCap = 'round'; g.lineJoin = 'round';
  const soil = g.createLinearGradient(0, gr, 0, FY1); soil.addColorStop(0, se.soil[0]); soil.addColorStop(1, se.soil[1]); g.fillStyle = soil; g.fillRect(FX0, gr, FX1 - FX0, FY1 - gr);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,220'},${0.06 + r() * 0.08})`; g.beginPath(); g.ellipse(FX0 + r() * (FX1 - FX0), gr + 6 + r() * (FY1 - gr - 6), 2 + r() * 6, 1 + r() * 2, 0, 0, 7); g.fill(); }
  f.trunks.forEach((t) => {   // roots: they spread on the ground from each trunk
    for (let j = 0; j < 4; j++) { const s = j < 2 ? -1 : 1, L = 14 + r() * 16; g.strokeStyle = se.bark[1]; g.lineWidth = 4.5 - j % 2; g.beginPath(); g.moveTo(t.x1 + s * 4, gr - 4); g.quadraticCurveTo(t.x1 + s * L * 0.5, gr - 1, t.x1 + s * L, gr + 3 + r() * 3); g.stroke(); g.strokeStyle = se.bark[0]; g.lineWidth = 2.5 - (j % 2) * 0.8; g.stroke(); } });
  const avoid = (x) => Math.abs(x - W / 2) < 46;
  const fern = (x, y, a, len, d, col) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    if (d <= 0) { g.fillStyle = col; g.beginPath(); g.ellipse((x + x2) / 2, (y + y2) / 2, len / 2, Math.max(0.5, len * 0.22), a, 0, 7); g.fill(); return; }
    g.strokeStyle = col; g.lineWidth = Math.max(0.5, len * 0.05); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    for (let i = 1; i <= 6; i++) { const u = i / 7, px = x + (x2 - x) * u, py = y + (y2 - y) * u, l = len * 0.36 * (1 - u * 0.75); fern(px, py, a - 1.05, l, d - 1, col); fern(px, py, a + 1.05, l, d - 1, col); }
  };
  if (se.key !== 'night') for (let i = 0; i < 7; i++) { const x = FX0 + 20 + r() * (FX1 - FX0 - 40); if (avoid(x)) continue; const col = se.grass[i % 2]; for (let j = 0; j < 3; j++) fern(x + (j - 1) * 4, gr + 2, -Math.PI / 2 + (j - 1) * 0.55 + (r() - 0.5) * 0.2, 22 + r() * 12, 2, col); }
  for (let i = 0; i < se.nFallen; i++) { const x = FX0 + r() * (FX1 - FX0), y = gr + 1 + r() * 26, c = se.fallen[i % se.fallen.length]; g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 2.4 + r() * 1.6, 1.1 + r() * 0.7, (r() - 0.5) * 1.2, 0, 7); g.fill(); }
  for (let x = FX0; x < FX1; x += 1.3 + r() * 0.9) {   // grass along the edge
    const h = 4 + r() * (se.key === 'night' ? 6 : 9), lean = (r() - 0.5) * 5; g.strokeStyle = se.grass[Math.floor(r() * 3)]; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(x, gr + 2); g.quadraticCurveTo(x + lean * 0.3, gr - h * 0.5, x + lean, gr - h); g.stroke(); }
  if (se.flowers) for (let i = 0; i < 26; i++) { const x = FX0 + r() * (FX1 - FX0), y = gr - 3 - r() * 5; if (avoid(x)) continue; g.strokeStyle = se.grass[0]; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, gr + 1); g.lineTo(x, y); g.stroke();
    g.fillStyle = se.flowers[i % se.flowers.length]; for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.257) * 1.6, y + Math.sin(p * 1.257) * 1.6, 1.2, 0, 7); g.fill(); } g.fillStyle = '#FFD23A'; g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); }
  const shroom = (x, s) => {
    if (se.glowShroom) { const gl = g.createRadialGradient(x, gr - 5 * s, 1, x, gr - 5 * s, 16 * s); gl.addColorStop(0, 'rgba(140,255,200,0.35)'); gl.addColorStop(1, 'rgba(140,255,200,0)'); g.fillStyle = gl; g.fillRect(x - 16 * s, gr - 21 * s, 32 * s, 32 * s); }
    g.fillStyle = '#EDE3CF'; g.beginPath(); g.roundRect(x - 1.6 * s, gr - 6 * s, 3.2 * s, 7 * s, 1.2 * s); g.fill();
    g.fillStyle = se.shroom[0]; g.beginPath(); g.ellipse(x, gr - 6 * s, 6 * s, 4.4 * s, 0, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x, gr - 6 * s, 6 * s, 1.2 * s, 0, 0, Math.PI); g.fill();
    g.fillStyle = se.shroom[1]; [[-2.6, -8.2, 1.1], [1.4, -9.2, 0.9], [3.4, -7.2, 0.8], [-0.4, -7, 0.7]].forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(x + dx * s, gr + dy * s, rr * s, 0, 7); g.fill(); });
  };
  f.trunks.forEach((t) => { const n = 1 + Math.floor(r() * 3); for (let j = 0; j < n; j++) { const x = t.x1 + (r() < 0.5 ? -1 : 1) * (12 + r() * 18); if (!avoid(x)) shroom(x, 0.8 + r() * 0.6); } });
  for (let i = 0; i < 4; i++) { const x = FX0 + 30 + r() * (FX1 - FX0 - 60); if (!avoid(x)) shroom(x, 0.6 + r() * 0.5); }
  for (let i = 0; i < 14; i++) { const x = FX0 + r() * (FX1 - FX0), y = gr + 8 + r() * 30, s = 1.5 + r() * 2.5; g.fillStyle = '#6E6A66'; g.beginPath(); g.ellipse(x, y, s * 1.4, s, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x - s * 0.4, y - s * 0.35, s * 0.6, s * 0.35, 0, 0, 7); g.fill(); }
  const sh = g.createLinearGradient(0, gr, 0, gr + 18); sh.addColorStop(0, 'rgba(0,0,0,0.28)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(FX0, gr, FX1 - FX0, 18);

  // the trees
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; f.segs.forEach((s) => { x0 = Math.min(x0, s.x1, s.x2); x1 = Math.max(x1, s.x1, s.x2); y0 = Math.min(y0, s.y1, s.y2); y1 = Math.max(y1, s.y1, s.y2); });
  x0 -= 30; x1 += 30; y0 -= 34; y1 = gr + 6;
  const tq = cap((x1 - x0) * (y1 - y0)), tc = mk((x1 - x0) * tq, (y1 - y0) * tq), h = tc.getContext('2d');
  h.setTransform(tq, 0, 0, tq, -x0 * tq, -y0 * tq); h.lineCap = 'round'; h.lineJoin = 'round';
  const line = (s, w, dx = 0, dy = 0) => { h.lineWidth = w; h.beginPath(); h.moveTo(s.x1 + dx, s.y1 + dy); h.lineTo(s.x2 + dx, s.y2 + dy); h.stroke(); };
  h.strokeStyle = se.bark[1]; f.segs.forEach((s) => line(s, s.w + 2.4));
  f.trunks.forEach((t) => { h.fillStyle = se.bark[1]; h.beginPath(); h.moveTo(t.x1 - t.w * 1.15, gr + 2); h.quadraticCurveTo(t.x1 - t.w * 0.5, gr - 8, t.x1 - t.w * 0.45, gr - 24); h.lineTo(t.x1 + t.w * 0.45, gr - 24); h.quadraticCurveTo(t.x1 + t.w * 0.5, gr - 8, t.x1 + t.w * 1.15, gr + 2); h.closePath(); h.fill(); });
  h.strokeStyle = se.bark[0]; f.segs.forEach((s) => line(s, s.w));
  f.trunks.forEach((t) => { h.fillStyle = se.bark[0]; h.beginPath(); h.moveTo(t.x1 - t.w * 1.0, gr + 1); h.quadraticCurveTo(t.x1 - t.w * 0.45, gr - 8, t.x1 - t.w * 0.4, gr - 24); h.lineTo(t.x1 + t.w * 0.4, gr - 24); h.quadraticCurveTo(t.x1 + t.w * 0.45, gr - 8, t.x1 + t.w * 1.0, gr + 1); h.closePath(); h.fill(); });
  h.strokeStyle = se.bark[2]; h.globalAlpha = 0.75; f.segs.forEach((s) => line(s, s.w * 0.32, -s.w * 0.24, -s.w * 0.04)); h.globalAlpha = 1;
  h.strokeStyle = 'rgba(0,0,0,0.25)'; f.segs.forEach((s) => line(s, s.w * 0.3, s.w * 0.26, 0));
  f.segs.forEach((s) => {   // bark: short curved grain across the thick limbs
    if (s.w < 4.5) return; const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1), ux = (s.x2 - s.x1) / L, uy = (s.y2 - s.y1) / L, nx = -uy, ny = ux;
    for (let d = 4; d < L - 2; d += 4 + r() * 5) { const o = (r() - 0.5) * s.w * 0.7, px = s.x1 + ux * d + nx * o, py = s.y1 + uy * d + ny * o, l = 2 + r() * 4;
      h.strokeStyle = r() < 0.7 ? se.bark[1] : se.bark[2]; h.lineWidth = 0.7 + r() * 0.5; h.beginPath(); h.moveTo(px, py); h.quadraticCurveTo(px + ux * l * 0.5 + nx, py + uy * l * 0.5 + ny, px + ux * l, py + uy * l); h.stroke(); }
    if (se.moss && s.d < 2) { h.fillStyle = se.moss; h.globalAlpha = 0.55; for (let j = 0; j < 5; j++) { const d = r() * L * 0.6; h.beginPath(); h.ellipse(s.x1 + ux * d + nx * s.w * 0.3, s.y1 + uy * d + ny * s.w * 0.3, 1.5 + r() * 2, 1 + r(), 0, 0, 7); h.fill(); } h.globalAlpha = 1; }
  });
  if (se.key === 'night' || se.key === 'autumn') {   // 🕸️ a cobweb or two in a fork
    f.segs.filter((s) => s.kids.length >= 2 && s.d >= 1 && s.d <= 2).slice(0, se.key === 'night' ? 3 : 1).forEach((s) => {
      const a = s.kids[0], b = s.kids[s.kids.length - 1], P = (k, u) => posOn(k, u), cx = s.x2, cy = s.y2; h.strokeStyle = 'rgba(230,230,240,0.45)'; h.lineWidth = 0.5;
      for (let u = 0.15; u <= 0.6; u += 0.11) { const p = P(a, u), q = P(b, u); h.beginPath(); h.moveTo(p.x, p.y); h.quadraticCurveTo((p.x + q.x) / 2 * 0.8 + cx * 0.2, (p.y + q.y) / 2 * 0.8 + cy * 0.2 + 3, q.x, q.y); h.stroke(); }
      for (let j = 0; j <= 4; j++) { const p = P(a, 0.65), q = P(b, 0.65), e = j / 4; h.beginPath(); h.moveTo(cx, cy); h.lineTo(p.x + (q.x - p.x) * e, p.y + (q.y - p.y) * e + Math.sin(e * Math.PI) * 4); h.stroke(); } });
  }
  f.tips.forEach((s) => {   // twigs: the fractal keeps going, just smaller
    for (let j = 0; j < 2; j++) { const a = s.a + (j ? 0.5 : -0.5) + (r() - 0.5) * 0.4, l = 5 + r() * 6; h.strokeStyle = se.bark[0]; h.lineWidth = 1; h.beginPath(); h.moveTo(s.x2, s.y2); h.lineTo(s.x2 + Math.cos(a) * l, s.y2 + Math.sin(a) * l); h.stroke(); } });
  // foliage: shadow, body, light and a highlight, in passes, so clusters merge into canopies
  const clusters = []; f.tips.forEach((s) => { const n = se.leafAmt < 0.5 ? (r() < se.leafAmt ? 1 : 0) : Math.round(5 * se.leafAmt + r() * 0.99 - 0.5); for (let j = 0; j < n; j++) clusters.push({ x: s.x2 + (r() - 0.5) * 18, y: s.y2 + (r() - 0.65) * 15, rr: (se.leafAmt < 0.5 ? 2.5 : 4) + r() * 4.5, v: r() < 0.3 ? 1 : 0 }); });
  if (se.leafAmt >= 0.7) f.segs.forEach((s) => { if (s.kids.length && s.d >= 3 && r() < 0.5) clusters.push({ x: s.x2 + (r() - 0.5) * 8, y: s.y2 - 2, rr: 4 + r() * 3, v: 0 }); });
  [[0, 1.25, 1.5, 0], [1, 1, 0, 0], [2, 0.7, -1.4, -1.8], [3, 0.32, -2.2, -3]].forEach(([ci, sc, dx, dy]) => {
    clusters.forEach((c) => { h.fillStyle = se.leaf[ci === 1 || ci === 2 ? ci + c.v : ci]; h.beginPath(); h.arc(c.x + dx, c.y + dy, c.rr * sc, 0, 7); h.fill(); }); });
  if (se.leafAmt < 0.5) clusters.forEach((c) => { h.strokeStyle = se.leaf[0]; h.lineWidth = 0.6; h.beginPath(); h.moveTo(c.x, c.y); h.lineTo(c.x + (r() - 0.5) * 2, c.y + 8 + r() * 6); h.stroke(); });
  if (se.bloom) clusters.forEach((c) => { for (let j = 0; j < 3; j++) { const bx = c.x + (r() - 0.5) * c.rr * 1.6, by = c.y + (r() - 0.6) * c.rr * 1.4; h.fillStyle = se.bloom[(j + Math.floor(r() * 4)) % se.bloom.length]; for (let p = 0; p < 5; p++) { h.beginPath(); h.arc(bx + Math.cos(p * 1.257) * 1.3, by + Math.sin(p * 1.257) * 1.3, 1, 0, 7); h.fill(); } h.fillStyle = '#FFE38A'; h.beginPath(); h.arc(bx, by, 0.6, 0, 7); h.fill(); } });
  return { floor: { c: fc, x: FX0, y: FY0, w: FX1 - FX0, h: FY1 - FY0 }, trees: { c: tc, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, forest: f, se: se.key, ks, px: fc.width * fc.height + tc.width * tc.height };
}
const zBucket = (z) => (z <= 1.08 ? 1 : z <= 1.65 ? 1.6 : 2.4);
function woodFor(se, k) {   // the cached wood, rebuilt (at most every 300 ms) when the forest, the season or the zoom bucket asks for it
  const need = k * zBucket(cam.z), w = look.wood, now = performance.now();
  if (look.lastF !== forest) { look.lastF = forest; look.fAt = now; }   // a widening stage regrows the same forest every frame: wait for it to settle
  const stale = !w || w.forest !== forest || w.se !== se.key || w.ks < need * 0.85, fresh = !w || w.se !== se.key || w.forest.seed !== forest.seed;
  if (stale && (fresh || (now - look.fAt > 200 && now - look.builtAt > 300))) { look.wood = buildWood(se, w && w.forest === forest && w.se === se.key ? Math.max(need, w.ks) : need); look.builtAt = now; return look.wood; }
  return stale && (w.forest !== forest || w.se !== se.key) ? null : w;
}
function backFor(se, k) {
  const b = look.back, Hh = H();
  if (!b || b.se !== se.key || b.seed !== forest.seed || Math.abs(b.W - W) > W * 0.12 || Math.abs(b.Hh - Hh) > Hh * 0.12 || Math.abs(b.k - k) > k * 0.2) {
    if (!b || b.se !== se.key || performance.now() - (look.backAt || 0) > 400) { look.back = buildBack(se, k); look.backAt = performance.now(); } }
  return look.back;
}
function drawBack(se, k, z, fx, fy) {
  const b = backFor(se, k), Hh = H(), ox = host.ox || 0, oy = host.oy || 0;
  const p = 0.25, zp = 1 + (z - 1) * p, cx = W / 2 + (fx - W / 2) * p, cy = Hh / 2 + (fy - Hh / 2) * p, a = k * zp, tx = (W / 2) * k - cx * a + ox, ty = (Hh / 2) * k - cy * a + oy;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (tx + b.X0 * a > 0 || ty + b.Y0 * a > 0 || tx + (b.X0 + b.ww) * a < host.cv.width || ty + (b.Y0 + b.hh) * a < host.cv.height) { ctx.fillStyle = se.sky[1]; ctx.fillRect(0, 0, host.cv.width, host.cv.height); }   // only when the layer doesn't cover the screen
  ctx.setTransform(a, 0, 0, a, tx, ty); ctx.drawImage(b.c, b.X0, b.Y0, b.ww, b.hh);
}

// ---- ambient life: petals, pollen, falling leaves or ash, a couple of dozen at most
function ambStep(t, se) {
  const key = se.key + '|' + W + '|' + H();
  if (look.ambKey !== key) { look.ambKey = key; look.amb = []; for (let i = 0; i < (se.amb === 'mote' ? 18 : 22); i++) look.amb.push(newAmb(se, true)); }
  const dt = Math.min(0.05, Math.max(0, (t - look.lastT) / 1000)); look.lastT = t;
  if (host.reduceMotion) return;
  const Hh = H();
  look.amb.forEach((a, i) => {
    a.ph += dt * a.w; a.x += (a.vx + Math.sin(a.ph) * a.sway) * dt; a.y += a.vy * dt; a.rot += a.spin * dt;
    if (a.y > Hh + 20 || a.y < -30 || a.x > W + 30 || a.x < -30) look.amb[i] = newAmb(se, false);
  });
}
function newAmb(se, anywhere) {
  const Hh = H(), k = se.amb, col = se.ambCols[Math.floor(Math.random() * se.ambCols.length)];
  const a = { k, col, x: Math.random() * W, y: anywhere ? Math.random() * Hh : -20, vx: 0, vy: 0, ph: Math.random() * 6, w: 1 + Math.random() * 1.5, sway: 10, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 4, r: 2 + Math.random() * 2 };
  if (k === 'petal') { a.vx = 12 + Math.random() * 16; a.vy = 16 + Math.random() * 18; a.sway = 18; if (!anywhere) a.x = Math.random() * W - 40; }
  else if (k === 'leaf') { a.vx = (Math.random() - 0.3) * 20; a.vy = 22 + Math.random() * 22; a.sway = 30; a.r = 3 + Math.random() * 2.5; }
  else if (k === 'mote') { a.vx = (Math.random() - 0.5) * 6; a.vy = (Math.random() - 0.5) * 6; a.sway = 8; a.r = 1 + Math.random(); if (!anywhere) { a.y = Math.random() * Hh * 0.9; a.x = Math.random() < 0.5 ? -10 : W + 10; a.vx = a.x < 0 ? 5 : -5; } }
  else { a.vx = (Math.random() - 0.5) * 8; a.vy = -(8 + Math.random() * 14); a.sway = 12; a.r = 0.8 + Math.random() * 1.2; if (!anywhere) a.y = Hh + 10; }
  return a;
}
function drawAmb(t) {
  look.amb.forEach((a) => {
    ctx.fillStyle = a.col;
    if (a.k === 'mote' || a.k === 'ash') { const tw = a.k === 'ash' && a.col === '#FF5A3A' ? 0.5 + 0.5 * Math.sin(t / 160 + a.ph * 3) : 0.55 + 0.45 * Math.sin(t / 400 + a.ph * 2);
      ctx.globalAlpha = tw * 0.25; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 3, 0, 7); ctx.fill(); ctx.globalAlpha = tw; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 7); ctx.fill(); }
    else { ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r * (a.k === 'leaf' ? 1.3 : 1), a.r * Math.abs(Math.cos(a.rot)) * 0.6 + 0.4, a.rot * 0.5, 0, 7); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
}

// ---- squirrel sprites: painted once per fur, pose and run frame (4), then drawn scaled and flipped
const SPR = { x0: -27, y0: -29, w: 44, h: 42, px: 7 };
function sprite(fur, mode, fr) {
  const key = `${fur.join()}|${mode}|${fr}`;
  let c = look.spr.get(key); if (c) return c;
  if (look.spr.size > 60) look.spr.clear();
  c = mk(SPR.w * SPR.px, SPR.h * SPR.px); const g = c.getContext('2d'); g.setTransform(SPR.px, 0, 0, SPR.px, -SPR.x0 * SPR.px, -SPR.y0 * SPR.px); g.lineCap = 'round'; g.lineJoin = 'round';
  paintSquirrel(g, fur, mode, fr); look.spr.set(key, c); return c;
}
function paintSquirrel(g, fur, mode, fr) {
  const [base, dk, lt] = fur, ph = (fr / 4) * Math.PI * 2, run = mode === 'run' || mode === 'angry', pinned = mode === 'pinned', leap = mode === 'leap';
  const bob = run ? -Math.sin(ph) * 0.9 : 0, tl = run ? Math.sin(ph + 1.2) * 2 : leap ? 4 : pinned ? -3 : 0;
  // the tail: a big S-curve plume, fluffed out in three layers with fur strokes on its rim
  const P = (u) => { const v = 1 - u, b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u;
    return [b0 * -6 + b1 * (-21 - tl * 0.5) + b2 * (-24 - tl) + b3 * (-9 - tl * 0.6), b0 * (2 + bob) + b1 * (4 + bob) + b2 * (-21 + tl * 0.8) + b3 * (-22 + tl * (leap ? 2.5 : 0.6))]; };
  const rad = (u) => 2.4 + 5.2 * Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.05));
  const N = 22, pts = []; for (let i = 0; i <= N; i++) { const u = i / N, [x, y] = P(u); pts.push([x, y, rad(u), u]); }
  g.fillStyle = dk; pts.forEach(([x, y, rr]) => { g.beginPath(); g.arc(x, y, rr + 1.1, 0, 7); g.fill(); });
  g.fillStyle = base; pts.forEach(([x, y, rr]) => { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); });
  g.strokeStyle = dk; g.lineWidth = 0.55; pts.forEach(([x, y, rr], i) => { if (i % 2) return; for (const s of [-1, 1]) { const a = i * 0.9 + s * 1.9; g.beginPath(); g.moveTo(x + Math.cos(a) * rr * 0.7, y + Math.sin(a) * rr * 0.7); g.lineTo(x + Math.cos(a) * (rr + 1.6), y + Math.sin(a) * (rr + 1.6)); g.stroke(); } });
  g.fillStyle = lt; g.globalAlpha = 0.55; pts.forEach(([x, y, rr, u]) => { if (u < 0.25 || u > 0.97) return; g.beginPath(); g.arc(x + 1.1, y - 0.9, rr * 0.45, 0, 7); g.fill(); }); g.globalAlpha = 1;
  // legs behind the body
  const hx = run ? -4 - Math.cos(ph) * 3 : leap ? -10 : pinned ? -8 : -3, hy = run ? 6.6 - Math.max(0, -Math.sin(ph)) * 2.2 : leap ? 4 : pinned ? 8 : 6.6;
  g.fillStyle = dk; g.beginPath(); g.ellipse(-3.5, 2.5 + bob, 4.8, 4.2, 0, 0, 7); g.fill();
  g.strokeStyle = dk; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-3.5, 4 + bob); g.lineTo(hx, hy); g.stroke(); g.fillStyle = dk; g.beginPath(); g.ellipse(hx + 0.8, hy + 0.4, 2.4, 1.1, 0, 0, 7); g.fill();
  // the body, shaded from the light above-left
  const bg = g.createLinearGradient(-4, -6, 3, 8); bg.addColorStop(0, lt); bg.addColorStop(0.35, base); bg.addColorStop(1, dk);
  g.fillStyle = bg; g.beginPath(); g.ellipse(0, 0.8 + bob, 8.6, 6.3, -0.18, 0, 7); g.fill();
  g.fillStyle = base; g.beginPath(); g.ellipse(-3, 1.8 + bob, 4.6, 4.1, 0, 0, 7); g.fill();
  g.fillStyle = lt; g.beginPath(); g.ellipse(3.6, 2.8 + bob, 4.2, 3.4, -0.25, 0, 7); g.fill();
  // front leg and paw
  const fx = run ? 6.5 + Math.cos(ph) * 3 : leap ? 11 : pinned ? 9 : 6, fy = run ? 6.6 - Math.max(0, Math.sin(ph)) * 2.2 : leap ? 2 : pinned ? 7 : 6.4;
  g.strokeStyle = base; g.lineWidth = 2; g.beginPath(); g.moveTo(4.5, 3 + bob); g.lineTo(fx, fy); g.stroke(); g.fillStyle = dk; g.beginPath(); g.arc(fx + 0.4, fy + 0.2, 1.1, 0, 7); g.fill();
  // head: ears, a round face, a cream cheek and snout
  const hy0 = -4.6 + bob;
  g.fillStyle = dk; g.beginPath(); g.moveTo(4.2, hy0 - 3.4); g.lineTo(4.6, hy0 - 8.2); g.lineTo(6.4, hy0 - 4); g.closePath(); g.fill();
  const hg = g.createRadialGradient(6.4, hy0 - 2, 0.5, 7.5, hy0, 6); hg.addColorStop(0, lt); hg.addColorStop(0.45, base); hg.addColorStop(1, dk);
  g.fillStyle = hg; g.beginPath(); g.arc(7.4, hy0, 5, 0, 7); g.fill();
  g.fillStyle = base; g.beginPath(); g.ellipse(10.6, hy0 + 1, 3.2, 2.5, 0.15, 0, 7); g.fill();
  g.fillStyle = lt; g.beginPath(); g.ellipse(9.4, hy0 + 2.4, 2.8, 1.8, 0.2, 0, 7); g.fill();
  g.fillStyle = base; g.beginPath(); g.moveTo(5.8, hy0 - 3.6); g.lineTo(6.9, hy0 - 9.4); g.lineTo(9.2, hy0 - 4.2); g.closePath(); g.fill();
  g.fillStyle = '#E8A0A0'; g.beginPath(); g.moveTo(6.6, hy0 - 4.2); g.lineTo(7.1, hy0 - 7.8); g.lineTo(8.4, hy0 - 4.6); g.closePath(); g.fill();
  g.strokeStyle = dk; g.lineWidth = 0.6; g.beginPath(); g.moveTo(6.9, hy0 - 9.4); g.lineTo(6.6, hy0 - 10.8); g.moveTo(6.9, hy0 - 9.4); g.lineTo(7.6, hy0 - 10.6); g.stroke();
  // the eye (where the glowing eyes of the dark days land too: 8.6, −6)
  const ex = 8.6, ey = -6;
  if (pinned) { g.strokeStyle = '#1B1109'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(ex - 1.2, ey - 1.2); g.lineTo(ex + 1.2, ey + 1.2); g.moveTo(ex + 1.2, ey - 1.2); g.lineTo(ex - 1.2, ey + 1.2); g.stroke();
    g.fillStyle = '#E86A7A'; g.beginPath(); g.ellipse(11.2, hy0 + 3.1, 0.9, 1.4, 0.3, 0, 7); g.fill(); }
  else {
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(ex, ey, 1.75, 2.0, 0, 0, 7); g.fill();
    g.fillStyle = mode === 'angry' ? '#D8302A' : '#1B1109'; g.beginPath(); g.ellipse(ex + 0.35, ey + 0.1, 1.3, 1.55, 0, 0, 7); g.fill();
    if (mode === 'angry') { g.fillStyle = '#1B1109'; g.beginPath(); g.arc(ex + 0.4, ey + 0.1, 0.6, 0, 7); g.fill(); g.strokeStyle = '#1B1109'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(ex - 2, ey - 2.8); g.lineTo(ex + 2.2, ey - 1.6); g.stroke(); }
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(ex + 0.8, ey - 0.6, 0.5, 0, 7); g.fill();
  }
  g.fillStyle = '#3A1E1E'; g.beginPath(); g.ellipse(13.4, hy0 + 0.6, 1, 0.8, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.3; [[-0.5], [0.3], [1.1]].forEach(([d]) => { g.beginPath(); g.moveTo(12.6, hy0 + 1.2); g.lineTo(16, hy0 + 1.2 + d * 1.6); g.stroke(); });
}
// a squirrel: a sprite, the pose from how it moves; `ph` is its run phase
function drawSquirrel(x, y, size, face, gold, ph, pinned, angry = false, leap = false) {
  const s = RAD[size] / 10, fur = gold ? GOLD_FUR : season().fur, mode = pinned ? 'pinned' : leap ? 'leap' : angry ? 'angry' : 'run';
  const fr = pinned || leap ? 0 : ((Math.floor(ph) % 4) + 4) % 4, c = sprite(fur, mode, fr);
  ctx.save(); ctx.translate(x, y); ctx.scale(face * s, s);
  if (pinned) ctx.rotate(Math.sin(ph) * 0.35);
  ctx.drawImage(c, SPR.x0, SPR.y0, SPR.w, SPR.h);
  if (gold && !pinned) { ctx.fillStyle = '#FFF'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ph * 3); ctx.beginPath(); ctx.arc(-2, -9, 1.5, 0, 7); ctx.arc(-14, -16, 1.1, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}

// ---------------------------------------------------------------- drawing
function draw(t) {
  W = host?.W || W;
  const cv = host.cv, k = host.k, Hh = H();
  if (!forest) forest = grow(12345, 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!cam.x) cam = { z: 1, x: W / 2, y: Hh / 2 };
  let z = cam.z, fx = cam.x, fy = cam.y, fade = 0;
  if (game?.dive) {   // into the knot (zooming in from wherever the camera is, the forest fading) or out of the new one's knot to its camera
    const e = Math.min(1, game.dive.t / game.dive.dur), s = e * e * (3 - 2 * e);
    if (game.dive.phase === 'in') { z = cam.z * Math.pow(26 / cam.z, s); fx = cam.x + (forest.knot.x - cam.x) * s; fy = cam.y + (forest.knot.y - cam.y) * s; fade = s; }
    else { if (!game.dive.cam) { camStep(0, true); game.dive.cam = true; } z = 0.04 + (cam.z - 0.04) * s; fade = 1 - s; }
  }
  const d = game ? dark() : 0, se = season();
  drawBack(se, k, z, fx, fy);
  const sh = game && !host.reduceMotion ? (game.shake || 0) * 14 : 0, sx = (Math.random() - 0.5) * sh, sy = (Math.random() - 0.5) * sh;
  ctx.setTransform(k * z, 0, 0, k * z, (W / 2) * k - fx * k * z + sx * k + (host.ox || 0), (Hh / 2) * k - fy * k * z + sy * k + (host.oy || 0));   // host.ox / oy: the zoom-out's margins
  drawForest(t, se, k);
  ambStep(t, se);
  if (game) {
    if (d > 0) { ctx.fillStyle = `rgba(8,2,6,${d * 0.5})`; ctx.fillRect(-W * 2, -Hh * 2, W * 5, Hh * 5); }   // the day drains
    drawEyes(t);
    game.kept.forEach((p) => { ctx.save(); ctx.globalAlpha = 0.55; if (p.tw > 0 || (level >= 4 && Math.sin(t / 420) > 0.92)) ctx.translate((Math.random() - 0.5) * 3, 0); drawSquirrel(p.x, p.y, 1, p.face, false, 0, true); drawStaple(p.x - p.face * 8, p.y + 4, 0.3, 1); ctx.restore(); });
    if (game.twist?.kind === 'blackout') { ctx.fillStyle = '#020104'; ctx.fillRect(-W * 2, -Hh * 2, W * 5, Hh * 5); const st = STAPLER(), fl = game.staples.length ? 0.9 : 0.25; const gl = ctx.createRadialGradient(st.x, st.y - 10, 4, st.x, st.y - 10, 90); gl.addColorStop(0, `rgba(255,220,160,${fl})`); gl.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, Hh); }
    game.stuck.forEach((s) => drawStaple(s.x, s.y, s.a, Math.min(1, s.life)));
    game.crates.forEach((c) => drawCrate(c, t));
    const run = !host.reduceMotion && game.stare <= 0;
    game.squirrels.forEach((sq) => { const p = sqPos(sq); if (game.twist?.kind !== 'blackout') drawSquirrel(p.x, p.y, sq.size, sq.face, sq.gold, run ? t / (sq.daze > 0 ? 260 : 75) + sq.wig : sq.wig, false, sq.angry > 0, !!sq.hop);
      if (level >= 3 || game.twist?.kind === 'blackout' || game.stare > 0) { const s = RAD[sq.size] / 10; ctx.save(); ctx.fillStyle = game.stare > 0 ? '#FF2A2A' : '#FF5A3A'; ctx.shadowColor = '#FF3A2A'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x + sq.face * 8.6 * s, p.y - 6 * s, 1.4 * s, 0, 7); ctx.fill(); ctx.restore(); }
      if (sq.daze > 0) { ctx.fillStyle = '#FFE08A'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; for (let i = 0; i < 3; i++) { const a = t / 180 + i * 2.1; ctx.fillText('✦', p.x + Math.cos(a) * RAD[sq.size], p.y - RAD[sq.size] - 4 + Math.sin(a) * 3); } } });
    if (game.twist?.kind !== 'blackout') drawAmb(t);
    game.acorns.forEach((a) => drawAcorn(a));
    (game.owls || []).forEach((o) => drawOwl(o));
    (game.cones || []).forEach((c) => drawCone(c));
    (game.snakes || []).forEach((s) => drawSnake(s, t));
    game.bombs.forEach((b) => { const e = b.t / b.tf, x = b.x0 + (b.x - b.x0) * e, y = b.y0 + (b.y - b.y0) * e - Math.sin(e * Math.PI) * 90;
      ctx.fillStyle = 'rgba(255,200,120,0.5)'; for (let i = 1; i <= 3; i++) { const q = Math.max(0, e - i * 0.05), px = b.x0 + (b.x - b.x0) * q, py = b.y0 + (b.y - b.y0) * q - Math.sin(q * Math.PI) * 90; ctx.globalAlpha = 0.5 - i * 0.13; ctx.beginPath(); ctx.arc(px, py, 3 - i * 0.6, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧨', x, y); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = Math.sin(t / 40) > 0 ? '#FFF6B0' : '#FF8A3D'; ctx.beginPath(); ctx.arc(x + 6, y - 9, 1.6 + Math.random(), 0, 7); ctx.fill(); });
    game.bolts.forEach((b) => { ctx.save(); ctx.globalAlpha = Math.min(1, b.life * 4); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const col = b.col || '#9BE7FF', path = () => { ctx.beginPath(); if (b.pts) b.pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); else b.lines.forEach(([a, c, dd, e]) => { ctx.moveTo(a, c); ctx.lineTo(dd, e); }); };
      ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.lineWidth = 4; path(); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5; path(); ctx.stroke(); ctx.restore(); });
    game.pins.forEach((p) => { drawSquirrel(p.x, p.y, 1, p.face, p.gold, t / 40, true); drawStaple(p.x - p.face * 8, p.y + 4, 0.3, 1); });
    game.staples.forEach((s) => { const e = s.t / s.tf, x = s.x0 + (s.x - s.x0) * e, y = s.y0 + (s.y - s.y0) * e, q = Math.max(0, e - 0.22), tx = s.x0 + (s.x - s.x0) * q, ty = s.y0 + (s.y - s.y0) * q, a = Math.atan2(s.y - s.y0, s.x - s.x0);
      ctx.lineCap = 'round'; ctx.strokeStyle = s.nail ? 'rgba(255,214,140,0.45)' : 'rgba(235,245,255,0.4)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + (tx - x) * 0.4, y + (ty - y) * 0.4); ctx.lineTo(x, y); ctx.stroke();
      drawStaple(x, y, a + Math.PI / 2, 1); });
    drawFx(t);
    game.leaves.forEach((l) => { ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a); ctx.fillStyle = l.r > 9 ? '#C94E26' : l.r > 7 ? '#E2852D' : '#D9822B'; ctx.beginPath(); ctx.ellipse(0, 0, l.r, l.r * 0.55, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,30,10,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-l.r, 0); ctx.lineTo(l.r, 0); ctx.stroke(); ctx.restore(); });
    if (game.twist?.kind === 'gust') { ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const y = (i * 57) % Hh, x = ((t / 4) * Math.sign(game.twist.wind) + i * 97) % (W + 60); ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x, y); ctx.stroke(); } }
    drawStapler();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (d > 0.3) { const v = vignette(cv); ctx.globalAlpha = Math.max(0, Math.min(1, (d - 0.3) * 0.9 + (level >= 4 ? 0.2 * Math.sin(t / 500) : 0))); ctx.drawImage(v, 0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
    // 🌊 going under: the deeper you're zoned in, the stiller the wood: a cool blue hush, mist rolling low between the
    // trunks in slow bands, and fireflies blinking among the branches
    { const f = host.deep?.() || 0; if (f > 0.02) { const Wd = cv.width, Hd = cv.height;
      ctx.fillStyle = `rgba(10,20,40,${0.3 * f})`; ctx.fillRect(0, 0, Wd, Hd);
      for (let i = 0; i < 4; i++) { const y = Hd * (0.62 + i * 0.09), off = ((t / (60 + i * 25)) + i * 300) % (Wd * 2); const mg = ctx.createLinearGradient(0, y - 40, 0, y + 40); mg.addColorStop(0, 'rgba(210,225,240,0)'); mg.addColorStop(0.5, `rgba(210,225,240,${0.16 * f})`); mg.addColorStop(1, 'rgba(210,225,240,0)'); ctx.fillStyle = mg;
        ctx.beginPath(); ctx.moveTo(-Wd + off - Wd, y + 40); for (let x = -Wd * 2; x <= Wd * 2; x += 40) ctx.lineTo(x + off - Wd, y + Math.sin(x / 120 + i) * 14); ctx.lineTo(Wd * 3, y + 40); ctx.closePath(); ctx.fill(); }
      for (let i = 0; i < 22; i++) { const ph = i * 2.399, x = ((Math.sin(ph * 3.1) * 0.5 + 0.5) * Wd + Math.sin(t / 1700 + ph) * 30 + Wd) % Wd, y = (Math.cos(ph * 1.7) * 0.5 + 0.5) * Hd * 0.6 + Hd * 0.12 + Math.cos(t / 1300 + ph * 2) * 18, a = f * (0.4 + 0.6 * Math.max(0, Math.sin(t / 500 + ph * 5))); ctx.fillStyle = `rgba(255,240,150,${a})`; ctx.beginPath(); ctx.arc(x, y, 2 * host.dpr, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(255,240,150,${a * 0.25})`; ctx.beginPath(); ctx.arc(x, y, 2 * host.dpr * 3.5, 0, 7); ctx.fill(); }
    } }
    if (game.glitch > 0 && !host.reduceMotion) drawGlitch();
  }
  if (fade > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(20,12,6,${fade * 0.9})`; ctx.fillRect(0, 0, cv.width, cv.height); }
}
function vignette(cv) {   // the red edge of the dark days, painted once per canvas size and faded in with globalAlpha
  if (!look.vig || look.vig.width !== cv.width || look.vig.height !== cv.height) {
    const c = mk(cv.width, cv.height), g = c.getContext('2d'), vg = g.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.35, cv.width / 2, cv.height / 2, cv.height * 0.75);
    vg.addColorStop(0, 'rgba(60,0,10,0)'); vg.addColorStop(1, 'rgba(40,0,8,1)'); g.fillStyle = vg; g.fillRect(0, 0, cv.width, cv.height); look.vig = c;
  }
  return look.vig;
}
function drawFx(t) {
  game.fx.forEach((f) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5));
    if (f.kind === 'dot') { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.4 + 0.6 * Math.min(1, f.life / 0.6)), 0, 7); ctx.fill(); }
    else if (f.kind === 'tuft') { ctx.strokeStyle = f.c; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(f.x, f.y, 4, f.a, f.a + 2.4); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.x + 1.5, f.y - 1, 2.5, f.a + 0.5, f.a + 2); ctx.stroke(); }
    else if (f.kind === 'ring') { ctx.strokeStyle = '#FFC857'; ctx.lineWidth = 6 * f.life * 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.stroke(); ctx.fillStyle = '#FF8A3D44'; ctx.fill(); ctx.strokeStyle = '#FFF4D6'; ctx.lineWidth = 2 * f.life * 2; ctx.stroke(); }
    else if (f.kind === 'smoke') { ctx.globalAlpha = Math.max(0, Math.min(0.55, f.life * 0.5)); ctx.fillStyle = f.c || '#8A8580'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(f.x - f.r * 0.3, f.y - f.r * 0.3, f.r * 0.5, 0, 7); ctx.fill(); }
    else if (f.kind === 'flash') { const e = 1 - f.life / f.tf; ctx.globalAlpha = (1 - e) * 0.9; ctx.fillStyle = f.c || '#FFF8D8'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.5 + e), 0, 7); ctx.fill(); }
    else if (f.kind === 'pow') {   // 💥 a comic burst where a staple bites
      const e = 1 - f.life / f.tf, R = f.r * (0.6 + e * 0.8); ctx.globalAlpha = Math.min(1, (1 - e) * 1.6); ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.beginPath(); for (let i = 0; i < 18; i++) { const rr = i % 2 ? R * 0.5 : R; ctx.lineTo(Math.cos((i / 18) * 6.283) * rr, Math.sin((i / 18) * 6.283) * rr); } ctx.closePath();
      ctx.fillStyle = f.gold ? '#FFE27A' : '#FFF4C2'; ctx.fill(); ctx.strokeStyle = f.gold ? '#E0A020' : '#FF8A3D'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
    else if (f.kind === 'spark') { ctx.strokeStyle = f.c || '#FFF6C8'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; const e = 1 - f.life / f.tf; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = f.a + i * 1.047, r0 = 2 + e * 8, r1 = r0 + 5 * (1 - e); ctx.moveTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0); ctx.lineTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1); } ctx.stroke(); }
    else if (f.kind === 'flutter') { ctx.fillStyle = f.c; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.5 + Math.abs(Math.sin(f.a * 2)) * 1, 0, 0, 7); ctx.fill(); ctx.restore(); }
    else if (f.kind === 'whisper') { const e = 1 - f.life / f.tf, a = Math.sin(Math.min(1, e) * Math.PI) * (0.35 + dark() * 0.4); ctx.globalAlpha = a; ctx.font = 'italic 600 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#E8D8FF'; ctx.letterSpacing = '3px'; ctx.fillText(f.text, f.x + (game.glitch > 0 ? (Math.random() - 0.5) * 6 : 0), f.y); ctx.letterSpacing = '0px'; }
    else { ctx.font = f.big ? '400 22px Bungee, Impact, sans-serif' : '900 15px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.col || '#FFE08A'; ctx.strokeStyle = '#3A1D00'; ctx.lineWidth = f.big ? 5 : 3; ctx.lineJoin = 'round'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); }
  });
  ctx.globalAlpha = 1;
}
function drawForest(t, se, k) {
  const f = forest, Hh = H();
  ctx.fillStyle = se.soil[1]; ctx.fillRect(-W * 2, f.ground + 30, W * 5, Hh * 3);   // the floor past the cached strip
  const w = woodFor(se, k);
  if (w) { ctx.drawImage(w.floor.c, w.floor.x, w.floor.y, w.floor.w, w.floor.h); ctx.drawImage(w.trees.c, w.trees.x, w.trees.y, w.trees.w, w.trees.h); look.live = 0; }
  else {   // the size is still easing (a stage widening the wood): plain strokes until the cache catches up
    look.live += 1;
    ctx.fillStyle = se.soil[0]; ctx.fillRect(-W * 2, f.ground, W * 5, 30); ctx.lineCap = 'round';
    f.segs.forEach((s) => { ctx.strokeStyle = s.d < 2 ? se.bark[1] : se.bark[0]; ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); });
    if (se.leafAmt > 0.5) { ctx.fillStyle = se.leaf[1]; f.tips.forEach((s) => { ctx.beginPath(); ctx.arc(s.x2, s.y2, 8, 0, 7); ctx.fill(); }); }
  }
  // the knothole in the middle trunk: where the next forest is. Day 4: it's an eye, and it's open.
  const kn = f.knot, big = game && level >= 4 ? game.eye.open : 0;
  if (big > 0) {
    const op = big * (game.eye.blink > 0 ? Math.max(0.05, game.eye.blink / 0.22 < 0.5 ? game.eye.blink / 0.11 : 2 - game.eye.blink / 0.11) : 1);
    const rx = 6 + 30 * big, ry = (9 + 14 * big) * op;
    const look2 = hold || STAPLER(), dx = Math.max(-1, Math.min(1, (look2.x - kn.x) / 200)), dy = Math.max(-1, Math.min(1, (look2.y - kn.y) / 300));
    ctx.fillStyle = 'rgba(120,10,10,0.35)'; ctx.beginPath(); ctx.ellipse(kn.x, kn.y, rx + 7, ry + 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#EDE6DA'; ctx.beginPath(); ctx.ellipse(kn.x, kn.y, rx, ry, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(kn.x, kn.y, rx, ry, 0, 0, 7); ctx.clip();
    for (let i = 0; i < 7; i++) { ctx.strokeStyle = '#B23A3A66'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(kn.x + (i - 3) * 9, kn.y - ry); ctx.lineTo(kn.x + (i - 3) * 12 + (i % 2) * 4, kn.y + ry); ctx.stroke(); }
    ctx.fillStyle = '#7A1A1A'; ctx.beginPath(); ctx.arc(kn.x + dx * rx * 0.45, kn.y + dy * ry * 0.4, 11 * big, 0, 7); ctx.fill();
    ctx.strokeStyle = '#A8302A'; ctx.lineWidth = 0.8; for (let i = 0; i < 12; i++) { const a = i * 0.524; ctx.beginPath(); ctx.moveTo(kn.x + dx * rx * 0.45 + Math.cos(a) * 6 * big, kn.y + dy * ry * 0.4 + Math.sin(a) * 6 * big); ctx.lineTo(kn.x + dx * rx * 0.45 + Math.cos(a) * 10.5 * big, kn.y + dy * ry * 0.4 + Math.sin(a) * 10.5 * big); ctx.stroke(); }
    ctx.fillStyle = '#0A0204'; ctx.beginPath(); ctx.arc(kn.x + dx * rx * 0.45, kn.y + dy * ry * 0.4, 5.5 * big, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.arc(kn.x + dx * rx * 0.45 - 3, kn.y + dy * ry * 0.4 - 3, 1.8, 0, 7); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#3A1A10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(kn.x, kn.y, rx + 1, ry + 1, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = se.bark[2]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(kn.x, kn.y, rx + 3, ry + 3, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else {
    ctx.fillStyle = se.bark[2]; ctx.beginPath(); ctx.ellipse(kn.x, kn.y, 8.5, 11.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = se.bark[1]; ctx.beginPath(); ctx.ellipse(kn.x + 0.6, kn.y + 0.6, 7.2, 10.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#120A05'; ctx.beginPath(); ctx.ellipse(kn.x + 0.4, kn.y + 0.8, 5.6, 8.4, 0, 0, 7); ctx.fill();
    if (game && level >= 2 && Math.sin(t / 1300) > 0.85) { ctx.fillStyle = '#FF3A2A'; ctx.beginPath(); ctx.arc(kn.x + 1.5, kn.y - 1, 1.6, 0, 7); ctx.arc(kn.x - 2, kn.y - 1.2, 1.3, 0, 7); ctx.fill(); }   // something peeks
  }
}
function drawEyes(t) {
  if (!forest.eyes.length) return;
  forest.eyes.forEach((e) => {
    const c = Math.sin(t / 1000 * e.rate + e.ph); if (c < 0.35) return;
    const op = Math.min(1, (c - 0.35) / 0.2);
    ctx.save(); ctx.globalAlpha = op * (0.5 + dark() * 0.5); ctx.fillStyle = level >= 4 ? '#FF3A2A' : '#FFE08A'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(e.x - e.gap / 2, e.y, 2.2, 1.4 * op, 0, 0, 7); ctx.ellipse(e.x + e.gap / 2, e.y, 2.2, 1.4 * op, 0, 0, 7); ctx.fill(); ctx.restore();
  });
}
function drawGlitch() {   // 📻 a tear in the picture: slices slip sideways, colours split, static crackles
  const cv = host.cv, dpr = host.dpr, w = cv.width, h = cv.height, n = 3 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) { const y = Math.floor(Math.random() * h), sh = 4 + Math.floor(Math.random() * h * 0.08), dx = Math.floor((Math.random() - 0.5) * w * 0.12); ctx.drawImage(cv, 0, y, w, sh, dx, y, w, sh); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25; ctx.drawImage(cv, 6 * dpr, 0); ctx.restore();
  ctx.fillStyle = '#ffffff'; for (let i = 0; i < 120; i++) { ctx.globalAlpha = Math.random() * 0.35; ctx.fillRect(Math.random() * w, Math.random() * h, 2 * dpr, 2 * dpr); }
  ctx.globalAlpha = 1;
  if (Math.random() < 0.08) { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; }
}
// 📦 a crate's size: it breathes as it falls, and grows with the stage, so it stays an easy tap as the board zooms out
const crateScale = (c) => { const st = host.stage?.() || 1, falling = c.y < forest.ground - 16; return (1 + 0.18 * (st - 1)) * (falling ? 1 + 0.22 * Math.sin(c.sway * 3) : 1); };
function drawCrate(c, t) {
  const falling = c.y < forest.ground - 16, sw = Math.sin(c.sway * 2) * (falling ? 6 : 0), blink = c.life < 3 && Math.sin(t / 80) > 0, sc = crateScale(c);
  ctx.save(); ctx.translate(c.x + sw, c.y); ctx.scale(sc, sc); if (blink) ctx.globalAlpha = 0.5;
  if (falling) {   // the chute: red and white gores, scalloped hem, four lines
    ctx.rotate(Math.sin(c.sway * 2 + 0.6) * 0.08);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); [-19, -7, 7, 19].forEach((x) => { ctx.moveTo(x, -31); ctx.lineTo(x * 0.5, -10); }); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a0 = Math.PI + (i * Math.PI) / 4, a1 = a0 + Math.PI / 4; ctx.fillStyle = i % 2 ? '#FFF4E8' : '#E4572E'; ctx.beginPath(); ctx.moveTo(0, -31); ctx.arc(0, -31, 20, a0, a1); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.arc(0, -31, 20, Math.PI * 1.5, Math.PI * 2); ctx.lineTo(0, -31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-8, -43, 6, 3, -0.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8E2A1C'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = -20 + i * 10; ctx.moveTo(x, -31); ctx.quadraticCurveTo(x + 5, -27.5, x + 10, -31); } ctx.stroke();
  } else { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 10.5, 14, 2.6, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#6B4423'; ctx.beginPath(); ctx.roundRect(-12, -10, 24, 20, 2); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#B07A40' : '#A06A35'; ctx.fillRect(-10.5, -8.5 + i * 5.9, 21, 5); ctx.strokeStyle = 'rgba(60,30,10,0.35)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-9, -6.5 + i * 5.9); ctx.quadraticCurveTo(-2, -5.2 + i * 5.9, 9, -6.8 + i * 5.9); ctx.stroke(); }
  ctx.strokeStyle = '#6B4423'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(10, -8); ctx.stroke();
  ctx.fillStyle = '#9AA3AC'; [[-12, -10], [9, -10], [-12, 7], [9, 7]].forEach(([x, y]) => { ctx.fillRect(x, y, 3, 3); });
  ctx.fillStyle = 'rgba(255,244,214,0.92)'; ctx.beginPath(); ctx.arc(0, 0, 6.8, 0, 7); ctx.fill(); ctx.strokeStyle = '#6B4423'; ctx.lineWidth = 1; ctx.stroke();
  ctx.font = '9px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(WEAPONS[c.w].icon, 0, 0.5); ctx.textBaseline = 'alphabetic';
  if (!falling && !blink) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t / 220); ctx.strokeStyle = '#FFE08A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(-14, -12, 28, 24, 4); ctx.stroke(); }
  ctx.restore();
}
function drawAcorn(a) {
  const p = acornPos(a), q = acornPos({ ...a, t: Math.max(0, a.t - 0.08) });
  ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a.spin); ctx.scale(1.15, 1.15);
  ctx.fillStyle = '#B5733A'; ctx.beginPath(); ctx.ellipse(0, 2.2, 4.6, 5.8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8A5226'; ctx.beginPath(); ctx.ellipse(1.2, 3.2, 3.2, 4.6, 0, -0.4, 2.2); ctx.fill();
  ctx.fillStyle = '#E3A86A'; ctx.beginPath(); ctx.ellipse(-1.8, 1, 1.2, 2.2, -0.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#4E3018'; ctx.beginPath(); ctx.arc(0, 7.6, 0.8, 0, 7); ctx.fill();
  ctx.fillStyle = '#5E3B1E'; ctx.beginPath(); ctx.ellipse(0, -2.6, 5.8, 3.3, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7E5434'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 2.2 - 1.5, -5); ctx.lineTo(i * 2.2 + 1.5, -0.6); ctx.moveTo(i * 2.2 + 1.5, -5); ctx.lineTo(i * 2.2 - 1.5, -0.6); } ctx.stroke();
  ctx.fillStyle = '#4E3018'; ctx.fillRect(-0.7, -8, 1.4, 3);
  ctx.restore();
}
function drawOwl(o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.dir, 1);
  const fl = Math.sin(o.flap) * 9, night = level >= 4;
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 16, 12, 2.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#5A4228';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -3); ctx.quadraticCurveTo(s * 22, -14 - fl, s * 30, -4 - fl * 0.6); ctx.quadraticCurveTo(s * 20, 2 - fl * 0.2, s * 8, 6); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#3E2C18'; ctx.lineWidth = 0.8; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * (14 + i * 5), -6 - fl * (0.5 + i * 0.12)); ctx.lineTo(s * (12 + i * 5), 2 - fl * 0.2); ctx.stroke(); }
  ctx.fillStyle = '#8B6B45'; ctx.beginPath(); ctx.ellipse(0, 1, 11, 12.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#C9A77A'; ctx.beginPath(); ctx.ellipse(0, 5, 7, 7.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8B6B45'; ctx.lineWidth = 0.9; for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j++) { const x = j * 3.2 + (i % 2) * 1.6, y = 2 + i * 3.2; ctx.beginPath(); ctx.moveTo(x - 1.2, y); ctx.lineTo(x, y + 1.2); ctx.lineTo(x + 1.2, y); ctx.stroke(); }
  ctx.fillStyle = '#8B6B45'; ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-7, -15); ctx.lineTo(-3, -9); ctx.moveTo(9, -8); ctx.lineTo(7, -15); ctx.lineTo(3, -9); ctx.fill();
  ctx.fillStyle = '#E8D3B0'; ctx.beginPath(); ctx.arc(-4.2, -4, 4.8, 0, 7); ctx.arc(4.2, -4, 4.8, 0, 7); ctx.fill();
  ctx.fillStyle = night ? '#FF5A3A' : '#FFD23A'; ctx.beginPath(); ctx.arc(-4.2, -4, 3.3, 0, 7); ctx.arc(4.2, -4, 3.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#1B1B22'; ctx.beginPath(); ctx.arc(-3.8, -4, 1.7, 0, 7); ctx.arc(4.6, -4, 1.7, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(-3.2, -4.8, 0.6, 0, 7); ctx.arc(5.2, -4.8, 0.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3E2C18'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-8.5, -9); ctx.lineTo(-1.2, -7.4); ctx.moveTo(8.5, -9); ctx.lineTo(1.2, -7.4); ctx.stroke();
  ctx.fillStyle = '#E4932E'; ctx.beginPath(); ctx.moveTo(-1.6, -2); ctx.lineTo(1.6, -2); ctx.lineTo(0, 1.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E4932E'; [-3, 3].forEach((x) => { ctx.fillRect(x - 1.5, 12.5, 3, 1.5); });
  ctx.restore();
}
function drawCone(c) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.spin);
  ctx.fillStyle = '#3E2814'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 9.5, 0, 0, 7); ctx.fill();
  for (let row = 0; row < 5; row++) { const y = -7 + row * 3.6, w = 5.5 - Math.abs(row - 2) * 1.1; for (let j = -1; j <= 1; j++) { ctx.fillStyle = row % 2 ? '#8A5A2B' : '#7A4E24'; ctx.beginPath(); ctx.ellipse(j * w * 0.7, y, 2.4, 1.8, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#B07A40'; ctx.fillRect(j * w * 0.7 - 1, y + 1, 2, 0.6); } }
  ctx.fillStyle = '#4E3018'; ctx.fillRect(-0.8, -11.5, 1.6, 3);
  ctx.restore();
}
function drawSnake(s, t) {
  const y = STAPLER().y - 4, n = 10, pts = [];
  for (let i = 0; i <= n; i++) pts.push([s.x - s.dir * i * 4.6, y + Math.sin(s.ph + i * 0.9) * 3 * Math.min(1, i / 2)]);
  const path = () => { ctx.beginPath(); pts.forEach(([x, yy], i) => ctx[i ? 'lineTo' : 'moveTo'](x, yy)); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 6; ctx.save(); ctx.translate(0, 3); path(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = '#1E4F2E'; ctx.lineWidth = 7; path(); ctx.stroke();
  ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 5; path(); ctx.stroke();
  ctx.strokeStyle = '#B8E07A'; ctx.lineWidth = 1.4; ctx.save(); ctx.translate(0, 1.6); path(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#2E7D4F'; pts.forEach(([x, yy], i) => { if (i % 2 || !i) return; ctx.beginPath(); ctx.moveTo(x, yy - 2.2); ctx.lineTo(x + 1.8, yy - 0.4); ctx.lineTo(x, yy + 0.6); ctx.lineTo(x - 1.8, yy - 0.4); ctx.closePath(); ctx.fill(); });
  const [hx, hy] = pts[0];
  if (Math.sin(t / 90 + s.ph) > 0.4) { ctx.strokeStyle = '#E0453A'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx + s.dir * 4.5, hy + 0.5); ctx.lineTo(hx + s.dir * 8, hy + 0.5); ctx.lineTo(hx + s.dir * 9.5, hy - 1); ctx.moveTo(hx + s.dir * 8, hy + 0.5); ctx.lineTo(hx + s.dir * 9.5, hy + 2); ctx.stroke(); }
  ctx.fillStyle = '#3E9A48'; ctx.beginPath(); ctx.ellipse(hx + s.dir * 1.5, hy, 5.4, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = level >= 4 ? '#FF2A2A' : '#FFE14A'; ctx.beginPath(); ctx.arc(hx + s.dir * 2.6, hy - 1.6, 1.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(hx + s.dir * 2.6 - 0.3, hy - 2.7, 0.6, 2.2);
}
function drawStaple(x, y, a, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(a); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#46505A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-5, -2); ctx.lineTo(5, -2); ctx.lineTo(5, 3); ctx.stroke();
  ctx.strokeStyle = '#E8EEF2'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-3.5, -2.3); ctx.lineTo(3, -2.3); ctx.stroke();
  ctx.restore(); ctx.globalAlpha = 1;
}
let stGrad = null;   // the stapler's gradients, made once (they live in its own local space)
function drawStapler() {
  const st = STAPLER(), g = game;
  if (!stGrad) { const a = ctx.createLinearGradient(0, -18, 0, -5); a.addColorStop(0, '#FF7A66'); a.addColorStop(0.45, '#D8382A'); a.addColorStop(1, '#8E1C14');
    const b = ctx.createLinearGradient(0, -4, 0, 6); b.addColorStop(0, '#6A707C'); b.addColorStop(0.4, '#3A3E48'); b.addColorStop(1, '#1A1C22');
    const c = ctx.createLinearGradient(0, -18, 0, -6); c.addColorStop(0, '#F4F7FA'); c.addColorStop(0.5, '#AAB3BC'); c.addColorStop(1, '#6E7780'); stGrad = { arm: a, base: b, chrome: c }; }
  if (g.perch > 0.01) {   // the perch: a plank on a post up from the ground, for the stapler to sit on
    const ph = forest.ground - st.y;
    ctx.fillStyle = '#4A2F18'; ctx.fillRect(st.x - 4, st.y + 4, 8, ph); ctx.fillStyle = '#6E4A28'; ctx.fillRect(st.x - 4, st.y + 4, 3, ph);
    ctx.strokeStyle = '#4A2F18'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(st.x - 30, st.y + 9); ctx.lineTo(st.x - 3, st.y + 36); ctx.moveTo(st.x + 30, st.y + 9); ctx.lineTo(st.x + 3, st.y + 36); ctx.stroke();
    ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.roundRect(st.x - 58, st.y + 2, 116, 8, 3); ctx.fill();
    ctx.fillStyle = '#A8743E'; ctx.fillRect(st.x - 56, st.y + 3, 112, 2); ctx.fillStyle = '#3A3E48'; [-50, -20, 20, 50].forEach((x) => { ctx.beginPath(); ctx.arc(st.x + x, st.y + 6.5, 0.9, 0, 7); ctx.fill(); });
  }
  ctx.save(); ctx.translate(st.x, st.y); if (g.stun > 0) ctx.rotate(Math.sin(g.stun * 40) * 0.12);
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(0, 6.5, 38, 3.5, 0, 0, 7); ctx.ellipse(-44, 6.5, 13, 3, 0, 0, 7); ctx.fill();
  if (g.weapon !== 'staple') { ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText(WEAPONS[g.weapon].icon, 0, -28 + Math.sin(performance.now() / 300) * 2); }
  // 🟢 Fig works the stapler: behind it, leaning in, dizzy when bonked
  drawPal(g.glitch > 0 ? 'fig' : (S.curve.mood || 'calm'), ctx, { x: -44, y: -22 + (g.kick || 0) * 3, s: 13, t: performance.now() / 1000, r: S.curve.r, face: 1, hurt: g.stun > 0 });
  ctx.fillStyle = stGrad.base; ctx.beginPath(); ctx.roundRect(-34, -4, 68, 10, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-31, -3.4, 62, 1);
  ctx.fillStyle = '#C9D0D6'; ctx.beginPath(); ctx.roundRect(18, -5.5, 12, 3, 1); ctx.fill();
  ctx.save(); ctx.translate(-28, -7); ctx.rotate((g.kick || 0) * 0.16); ctx.translate(28, 7);
  ctx.fillStyle = '#2B2B33'; ctx.beginPath(); ctx.roundRect(-28, -9, 56, 6, 2); ctx.fill();
  ctx.fillStyle = stGrad.arm; ctx.beginPath(); ctx.roundRect(-32, -19, 58, 12, 6); ctx.fill();
  ctx.fillStyle = stGrad.chrome; ctx.beginPath(); ctx.roundRect(18, -19.5, 13, 12.5, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.roundRect(-26, -17.6, 40, 2.4, 1.2); ctx.fill();
  ctx.fillStyle = '#16161C'; ctx.beginPath(); ctx.roundRect(-27, -13, 44, 5, 1.5); ctx.fill();
  for (let i = 0; i < AMMO; i++) { ctx.fillStyle = i < g.ammo && !g.reloadT ? '#F2F4F6' : '#ffffff22'; ctx.fillRect(-25.5 + i * 3.5, -12.3, 2.2, 3.6); }
  ctx.restore();
  ctx.fillStyle = stGrad.chrome; ctx.beginPath(); ctx.arc(-28, -7, 3.4, 0, 7); ctx.fill(); ctx.fillStyle = '#3A3E48'; ctx.beginPath(); ctx.arc(-28, -7, 1.2, 0, 7); ctx.fill();
  if (g.reloadT > 0) { ctx.fillStyle = '#00000066'; ctx.fillRect(-30, -25, 60, 4); ctx.fillStyle = '#F5C542'; ctx.fillRect(-30, -25, 60 * (1 - g.reloadT / RELOAD_S), 4); }
  ctx.restore();
}
// The weapon bar: the stapler and whatever you've picked up, with rounds left. Tap to load.
function renderBar() {
  if (!bar || !game) return;
  // a readout, not a picker: the last weapon you picked up is the one in your hand until its rounds are gone
  const k = game.weapon, w = WEAPONS[k];
  bar.innerHTML = k === 'staple' ? '' : `<button type="button" class="on" disabled aria-label="${w.name}, ${game.arsenal[k]} left" title="${w.desc}">${w.icon}<b>${game.arsenal[k]}</b></button>`;
}

// ---------------------------------------------------------------- the organ
const organ = {
  key: 'squirrel', name: 'Squirrel Chaos', icon: '🐿️', verb: 'tap to staple · tap the stapler to reload', beat: 1.2,
  theme: { bg: '#14200E', gold: '#F5C542', bannerc: '#FFE08A' },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__sq = organ.debug; },
  start() { newGame(); },
  enter(from) {
    if (!game) newGame();
    bar = host.ui('<div class="wbar" id="wbar" aria-label="Weapons"></div>').querySelector('.wbar'); renderBar();
    if (from) { game.stun = 0; game.acorns = []; }   // a morph lands you mid-forest: nothing already in the air at your head
  },
  leave() { hold = null; bar = null; return game ? STAPLER() : null; },
  update, draw, onBeat,
  resize() { W = host?.W || W; if (forest && (Math.abs(forest.H - H()) > 1 || Math.abs(forest.W - W) > 1)) forest = grow(forest.seed, level); },   // the trees stand on the new ground
  pointer(type, p) { p = unCam(p); if (type === 'down') { hold = p; if (game) game.nailT = 0.09; fire(p.x, p.y); } else if (type === 'move') { if (hold) hold = p; } else hold = null; },
  keydown(e) { if ((e.key === 'r' || e.key === 'R') && game) reload(); },
  hudLine: () => (game ? `Day ${level}${host.morphs ? '' : ` of ${LEVELS}`} · ${Math.max(0, Math.ceil(level * LEVEL_S - game.time))}s${game.kept.length ? ` · 📎 ${game.kept.length} kept` : ''}` : ''),
  level: () => level,
  overText: (how) => (how === 'sleeps' ? ['🌘 IT SLEEPS AGAIN', 'For now. It counted every one.'] : how === 'bonked' ? ['💫 KNOCKED OUT', 'Too many acorns to the head. The forest keeps your staples.'] : ['RUN OVER', '']),
  endStats: () => (game ? `🐿️ ${game.hits} hits from ${game.shots} staples${game.shots ? ` (${Math.round((100 * game.hits) / game.shots)}%)` : ''}, day ${level}` : ''),
  debug: () => game && ({ score: S.score, level, cam: { ...cam }, unCam, perch: game.perch, stapler: STAPLER(), trunks: forest?.trunks.length, squirrels: game.squirrels.length, owls: game.owls?.length || 0, cones: game.cones?.length || 0, snakes: game.snakes?.length || 0, W, kept: game.kept.length, glitch: game.glitch, eye: game.eye.open, twist: game.twist?.kind || null, stare: game.stare, whispers: game.fx.filter((f) => f.kind === 'whisper').length,
    skipTo: (l) => { level = l - 1; game.time = level * LEVEL_S; }, forceTwist: (k) => { game.twist = { kind: k, until: game.time + 6, wind: 70 }; if (k === 'stare') game.stare = 1.6; if (k === 'static') game.glitch = 6; },
    give: (w) => { game.arsenal[w] = (game.arsenal[w] || 0) + WEAPONS[w].ammo; game.weapon = w; renderBar(); }, fxKinds: game.fx.map((f) => f.kind),
    season: season().key, look: { wood: !!look.wood, ks: look.wood?.ks || 0, px: look.wood?.px || 0, back: !!look.back, sprites: look.spr.size, amb: look.amb.length, live: look.live },
    hearts: S.hearts, weapon: game.weapon, arsenal: { ...game.arsenal }, crates: game.crates.map((c) => ({ x: c.x, y: c.y, w: c.w })), acorns: game.acorns.map(acornPos), ammo: game.ammo, dive: !!game.dive, over: S.over, r: S.curve.r,
    squirrels: game.squirrels.map((sq) => ({ ...sqPos(sq), size: sq.size, hop: !!sq.hop })), W, H: H() }),
};
export default organ;
