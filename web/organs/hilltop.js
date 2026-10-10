// 💥 Hilltop, an organ of the shell: Hilltop Duel's DNA, you against the hill. Your tank sits on the
// left of a fractal ridge (midpoint displacement); enemy tanks dig in on the right. Drag to aim (the
// drag's angle and length), let go to fire: shells arc on gravity and wind, crater the hill, and a hit
// is 150 × the Fibonacci combo. They fire back. The box's beats run the war: a peak digs in a new tank
// (a meteor at x > 0.9), the window sets three tanks that hold their fire, the mirror splits your next
// shell in three (a fractal shell), the balance stills the wind, the golden cut sends a golden tank
// (500), gift is a shield, a Fibonacci beat is a bigger blast. Twists: 💨 gale, ☄️ meteor shower,
// 🌱 regrowth (the hill heals), 🌙 night (tanks only show when they fire).
// 🕳️ Its pocket (deep enough, a burrow glows by your tank, in your deepest crater nearby if there is one: tap it):
// DOWN THE TUNNEL (pockets/burrow.js), a cave dug by Langton's ant; reaching the core brings up full armour and a
// shield, and with three ore a loaded crate.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';
import burrowPocket from './pockets/burrow.js';

let W = 400, G = 620, TANK_W = 22;
const TWISTS = [
  ['💨 GALE', 'the wind howls: lead your shots', 'gale'],
  ['☄️ METEOR SHOWER', 'watch the sky', 'meteors'],
  ['🌱 REGROWTH', 'the hill heals its craters', 'regrow'],
  ['🌙 NIGHT', 'they only show when they fire', 'night'],
];
let host, ctx, S, sfx, g = null, killsN = 0, shotsN = 0, drag = null;
const H = () => host.H;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
// The ridge: 101 samples across the world, W/100 apart (the world widens with the stage; the ridge stretches with it).
function ridge(seed) {
  const r = rng(seed), n = 101, h = new Array(n).fill(0), base = H() * 0.66;
  h[0] = base + 40; h[n - 1] = base - 60 + r() * 40; h[50] = base - 20 + r() * 60;
  const sub = (a, b, amp) => { if (b - a < 2) return; const m = (a + b) >> 1; h[m] = (h[a] + h[b]) / 2 + (r() - 0.5) * amp; sub(a, m, amp * 0.55); sub(m, b, amp * 0.55); };
  sub(0, 50, 90); sub(50, n - 1, 90);
  return h.map((v) => Math.max(H() * 0.3, Math.min(H() - 30, v)));
}
const SP = () => W / 100;
const hAt = (x) => { const i = Math.max(0, Math.min(99, x / SP())), a = Math.floor(i), t = i - a; return g.h[a] + (g.h[Math.min(100, a + 1)] - g.h[a]) * t; };
const stage = () => host.stage?.() || 1;   // 🎚️ the run's stage: the world grows and fills around you
// 🛡 your tank has armour: a shell dents it by how close it lands, and only an empty bar costs one of the organ's lives
const ARMOR = 100, DMG_MIN = 18, DMG_MAX = 34, GRACE = 0.5, REPAIR_AFTER = 4, REPAIR = 6;
function newGame() { g = { h: [], tanks: [], shells: [], fx: [], meteors: [], moles: [], lakes: [], balloons: [], worms: [], drones: [], drops: [], arty: null, beams: [], holes: [], jets: [], droneT: 8, bolts: [], wormT: 4, moleT: 4, serpT: 3, balloonT: 5, centred: false, me: { x: 44, armor: ARMOR, calmT: 0 }, wind: 0, twist: null, time: 0, fireT: 3, shield: 0, split: 0, big: 0, seed: Math.floor(Math.random() * 1e6), night: 0 }; g.h = ridge(g.seed); killsN = 0; shotsN = 0; addTank(); }
function addTank(gold = false, quiet = false) {
  if (g.tanks.length >= (stage() === 1 ? 2 : 5 + Math.min(3, stage() - 1))) return;   // Stage 1: two at most
  // Stage 1: they line up on the right. From Stage 2 they come from both sides, never within 70 of you.
  let x = 200 + Math.random() * 170;
  if (stage() >= 2) { const left = Math.random() < 0.5 && g.me.x > 110; x = left ? 30 + Math.random() * (g.me.x - 100) : g.me.x + 70 + Math.random() * (W - 30 - g.me.x - 70); }
  g.tanks.push({ x: Math.max(20, Math.min(W - 20, x)), gold, hp: gold ? 2 : 1, quiet, flash: 0, hue: [0, 210, 280, 22][Math.floor(Math.random() * 4)] });
}
// 🕳️ moles (Stage 2+): one surfaces from the hill, lobs a shell at you and sinks back. 🌊 lakes (Stage 3+): a dip
// becomes water, and a serpent rises to spit. 🎈 balloons (Stage 3+): drift over and drop a bomb when above you.
function mole() { let x; for (let i = 0; i < 8; i++) { x = 30 + Math.random() * (W - 60); if (Math.abs(x - g.me.x) > 56 && !inLake(x)) break; } g.moles.push({ x, t: 0, hp: 1, fired: false }); }
const inLake = (x) => g.lakes.some((l) => x > l.x0 && x < l.x1);
function carveLake() {
  if (g.lakes.length >= 2) return;
  const fresh = g.fresh || (g.fresh = ridge(g.seed)); let best = -1, bi = 20;
  for (let i = 20; i < 81; i++) { if (Math.abs(i * SP() - g.me.x) < 70) continue; const v = fresh[i]; if (v > best && !inLake(i * SP())) { best = v; bi = i; } }   // the lowest ground that isn't under you
  const i0 = Math.max(0, bi - 9), i1 = Math.min(100, bi + 9), x0 = i0 * SP(), x1 = i1 * SP(), y = Math.min(H() - 36, best + 6);
  for (let i = i0; i <= i1; i++) { fresh[i] = Math.max(fresh[i], y); g.h[i] = Math.max(g.h[i], y); }
  g.lakes.push({ x0, x1, y, serpent: null }); g.fx.push({ kind: 'text', x: (x0 + x1) / 2, y: y - 30, text: '🌊 a lake', life: 1.2 });
}
function serpent() { const l = g.lakes[Math.floor(Math.random() * g.lakes.length)]; if (!l || l.serpent) return; l.serpent = { x: l.x0 + 20 + Math.random() * (l.x1 - l.x0 - 40), t: 0, hp: 1, fired: false }; sfx('splash'); }
// ⚡🎯 TAPS: a tap on an enemy is a weapon of its own, unlimited. Lightning strikes what is on or under the ground
// (moles, serpents, magma worms, even one still tunnelling), a target locks what flies (balloons, meteors) and it
// drops. The cannon (drag) still works on everything.
// 📦 ARTILLERY: from Stage 2 an ally drone crosses now and then and drops a crate near you; tap the crate to pick up
// a few rounds of a heavier shell the cannon then fires: 🧨 cluster (three), 💣 heavy (a bigger crater), 🔥 napalm
// (a wide burn), 🎯 guided (steers to the nearest tank), ⚡ railgun (a straight beam through everything on its line,
// hills too), 🌀 black hole (lands, drags tanks and shells in, then implodes), ❄️ fractal (forks at the top of its arc
// into 2, 4, 8 bomblets), ✈️ airstrike (marks the spot; a jet lays five bombs across it), 🌩️ tesla (the blast arcs on
// to the three nearest enemies). The bar bottom-right shows what's loaded; a crate holds about twice what it used to.
const ARTY = {
  cluster: { icon: '🧨', name: 'Cluster', n: 8, desc: 'three shells a shot' }, heavy: { icon: '💣', name: 'Heavy', n: 6, desc: 'a bigger crater' },
  napalm: { icon: '🔥', name: 'Napalm', n: 6, desc: 'a wide burn' }, guided: { icon: '🎯', name: 'Guided', n: 8, desc: 'steers to the nearest tank' },
  rail: { icon: '⚡', name: 'Railgun', n: 6, desc: 'a straight beam through everything' }, hole: { icon: '🌀', name: 'Black hole', n: 4, desc: 'drags them in, then implodes' },
  fractal: { icon: '❄️', name: 'Fractal', n: 6, desc: 'forks into eight bomblets' }, strike: { icon: '✈️', name: 'Airstrike', n: 4, desc: 'a jet lays five bombs where it lands' },
  tesla: { icon: '🌩️', name: 'Tesla', n: 6, desc: 'arcs on to the three nearest enemies' },
};
let bar = null;
function renderBar() { if (!bar || !g) return; const a = g.arty && ARTY[g.arty.kind]; bar.innerHTML = a ? `<button type="button" class="on" aria-label="${a.name}, ${g.arty.n} rounds" title="${a.desc}">${a.icon}<b>${g.arty.n}</b></button>` : ''; }
function allyDrone() { const fromLeft = Math.random() < 0.5; g.drones.push({ x: fromLeft ? -30 : W + 30, y: 60 + Math.random() * 30, vx: (fromLeft ? 1 : -1) * 90, dropped: false }); }
function dropCrate(x) { const kinds = Object.keys(ARTY), kind = kinds[Math.floor(Math.random() * kinds.length)]; g.drops.push({ x: Math.max(30, Math.min(W - 30, x)), y: 70, kind, down: true, life: 30 }); }
const dropScale = (c) => (1 + 0.18 * (stage() - 1)) * (c.down ? 1 + 0.22 * Math.sin(g.time * 3) : 1);   // 📦 a crate breathes as it falls, and grows with the stage
function pickUp(c) { g.drops.splice(g.drops.indexOf(c), 1); const a = ARTY[c.kind]; g.arty = { kind: c.kind, n: a.n }; host.cue?.('pickup', c.x, c.y); host.banner(`${a.icon} ${a.name.toUpperCase()} · ${a.n} ROUNDS`, a.desc); sfx('chime'); renderBar(); g.fx.push({ kind: 'ring', x: c.x, y: c.y, r: 4, R: 30, life: 0.35 }); }
// 🪱 magma worms (Stage 3+), up from the earth's core: one starts at the very bottom of the world and tunnels up
// through the dirt (the zoom-out is what lets you watch it coming), breaks the surface, rears up and spits lava.
function worm() { let x; for (let i = 0; i < 8; i++) { x = 40 + Math.random() * (W - 80); if (Math.abs(x - g.me.x) > 70 && !inLake(x)) break; } g.worms.push({ x, y: H() + 10, phase: 'dig', t: 0, hp: 1, fired: false, spd: 60 + 14 * stage() }); }
const wormHead = (w) => (w.phase === 'dig' ? { x: w.x, y: w.y } : { x: w.x, y: hAt(w.x) - 24 });
function balloon() { const fromLeft = Math.random() < 0.5; g.balloons.push({ x: fromLeft ? -20 : W + 20, y: 50 + Math.random() * 60, vx: (fromLeft ? 1 : -1) * (30 + Math.random() * 25 + 8 * stage()), hp: 1, dropped: false }); }
const enemyShell = (x, y, tx, speed = 240) => { const dx = tx - x; const a = -1.9 - Math.random() * 0.5; g.shells.push({ x, y, vx: Math.abs(Math.cos(a)) * speed * Math.sign(dx || 1), vy: Math.sin(a) * speed, mine: false }); };
function onBeat(ev) {
  const x = ev.x;
  if (ev.window) { g.tanks = g.tanks.filter((t) => !t.quiet); for (let i = 0; i < 3; i++) addTank(false, true); }
  else if (x > 0.9) meteor(60 + Math.random() * (W - 120));
  else if (ev.peak) addTank();
  else if (x > 0.5 && g.tanks.length < 2) addTank();
  if (ev.gift) { g.shield = 1; host.banner('🛡️ SHIELD', 'the next hit bounces off'); }
  if (ev.mirror) { g.split = 1; sfx('chime'); }
  if (ev.balance) { g.wind = 0; sfx('chime'); }
  if (ev.golden) addTank(true);
  if (ev.fib) g.big = 1;
  if (!ev.balance && Math.random() < 0.5) g.wind = Math.max(-60, Math.min(60, g.wind + (Math.random() - 0.5) * 40));
  if (ev.big && !g.twist) twist();
}
function twist() {
  const [title, sub, kind] = TWISTS[Math.floor(Math.random() * TWISTS.length)];
  g.twist = { kind, until: g.time + 6 }; host.banner(title, sub); sfx('twist');
  if (kind === 'gale') g.wind = (Math.random() < 0.5 ? -1 : 1) * 110;
}
function meteor(x) { g.meteors.push({ x, y: -20, vy: 160 + Math.random() * 80, vx: (Math.random() - 0.5) * 60 }); }
// a tap: a crate picks up; an enemy in the air takes a 🎯 target, one on or under the ground takes ⚡ lightning
function tap(x, y) {
  if (!g || S.over) return false; const near = (ex, ey, r) => Math.hypot(ex - x, ey - y) < r;
  const crate = g.drops.find((c) => near(c.x, c.y, 34 * dropScale(c))); if (crate) { pickUp(crate); return true; }
  const kill = (icon, ex, ey, pts, what, bolt) => { S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 3; const p = pts * fibMult(S.combo); host.add(p); killsN += 1; host.cue?.('kill', ex, ey);
    g.fx.push({ kind: 'text', x: ex, y: ey - 22, text: `${icon} ${what} +${p}`, life: 1.1, big: true, col: '#C9FFF8' }); g.fx.push({ kind: 'ring', x: ex, y: ey, r: 4, R: 36, life: 0.4 });
    if (bolt) { const pts2 = [[ex + (Math.random() - 0.5) * 40, -20]]; let yy = -20; while (yy < ey - 16) { yy += 28; pts2.push([ex + (Math.random() - 0.5) * 26, yy]); } pts2.push([ex, ey]); g.bolts.push({ pts: pts2, life: 0.3 }); sfx('flash'); } else sfx('boom', { size: 0.7 }); return true; };
  const b = g.balloons.find((q) => near(q.x, q.y + 6, 38)); if (b) { kill('🎯', b.x, b.y, 150, 'BALLOON'); b.hp = 0; return true; }
  const m = g.meteors.find((q) => near(q.x, q.y, 38)); if (m) { kill('🎯', m.x, m.y, 120, 'METEOR'); g.meteors.splice(g.meteors.indexOf(m), 1); return true; }
  const es = g.shells.find((q) => !q.mine && near(q.x, q.y, 34)); if (es) { kill('🎯', es.x, es.y, 60, 'INTERCEPTED'); g.shells.splice(g.shells.indexOf(es), 1); return true; }   // 🎯 a falling bomb or shell under your finger
  const w = g.worms.find((q) => { const h = wormHead(q); return near(h.x, h.y, 40); }); if (w) { const h = wormHead(w); kill('⚡', h.x, h.y, w.phase === 'dig' ? 300 : 250, w.phase === 'dig' ? 'WORM, UNDERGROUND' : 'WORM', true); w.hp = 0; return true; }
  const mo = g.moles.find((q) => q.t > 0.3 && near(q.x, hAt(q.x) - 8, 36)); if (mo) { kill('⚡', mo.x, hAt(mo.x) - 6, 200, 'MOLE', true); mo.hp = 0; return true; }
  const l = g.lakes.find((q) => q.serpent && near(q.serpent.x, q.y - 26, 38)); if (l) { kill('⚡', l.serpent.x, l.y - 26, 220, 'SERPENT', true); l.serpent.hp = 0; return true; }
  return false;
}
function fire(dx, dy) {
  if (!g || S.over) return;
  const d = Math.min(160, Math.hypot(dx, dy)); if (d < 10) return;
  const a = Math.atan2(-dy, -dx), p = 240 + d * 2.9, my = hAt(g.me.x) - 10;
  const kind = g.arty?.n > 0 ? g.arty.kind : null;   // 📦 a loaded artillery round, if any
  if (kind === 'rail') railgun(g.me.x, my, a);
  else {
    const shots = g.split || kind === 'cluster' ? [-0.12, 0, 0.12] : [0];
    shots.forEach((da) => g.shells.push({ x: g.me.x, y: my, vx: Math.cos(a + da) * p, vy: Math.sin(a + da) * p, mine: true, big: !!g.big || kind === 'heavy', napalm: kind === 'napalm', homing: kind === 'guided', hole: kind === 'hole', frac: kind === 'fractal' ? 3 : 0, gen: 0, age: 0, strike: kind === 'strike', tesla: kind === 'tesla' }));
  }
  if (g.split) { g.split = 0; g.fx.push({ kind: 'text', x: g.me.x, y: my - 24, text: '✨ FRACTAL SHELL', life: 1 }); }
  if (kind) { g.arty.n -= 1; g.fx.push({ kind: 'text', x: g.me.x, y: my - 24, text: `${ARTY[kind].icon} ${ARTY[kind].name.toUpperCase()}`, life: 0.9 }); if (g.arty.n <= 0) g.arty = null; renderBar(); }
  g.big = 0; shotsN += 1; sfx(kind === 'rail' ? 'flash' : 'cannon');
  g.aimA = a; g.rc = 0.2; const mz = muzzle(g.me.x, a, true); puffs(mz.x, mz.y, a);   // 🎨 the barrel holds its aim, kicks back and flashes
}
// 🎨 a muzzle flash and a puff of gun smoke at a barrel's mouth
function puffs(x, y, a) { g.fx.push({ kind: 'muzzle', x, y, a, life: 0.12, max: 0.12 }); for (let i = 0; i < 3; i++) g.fx.push({ kind: 'smoke', x: x + Math.cos(a) * 3 * i, y: y + Math.sin(a) * 3 * i, vx: Math.cos(a) * (30 + i * 12), vy: Math.sin(a) * (30 + i * 12) - 10, r: 3 + i, dr: 9, life: 0.7, max: 0.7, a: 0.35, c: '#B8B0C8' }); }
// a crater digs the hill, but never more than 70 below where it stood fresh: you keep a hill to stand on
function crater(x, y, r) { const fresh = g.fresh || (g.fresh = ridge(g.seed)); for (let i = 0; i < 101; i++) { const px = i * SP(), dx = px - x; if (Math.abs(dx) < r) { const depth = Math.sqrt(r * r - dx * dx); g.h[i] = Math.max(g.h[i], Math.min(H() - 30, fresh[i] + 70, y + depth)); } } }
// a hit on an enemy tank: one off its hp, and a KO pays 150 (golden 500) × the Fibonacci combo
function hitTank(t, dmg = 1) {
  if (!g.tanks.includes(t)) return;
  t.hp -= dmg; if (t.hp > 0) { t.flash = 0.4; host.add(50); g.fx.push({ kind: 'text', x: t.x, y: hAt(t.x) - 30, text: 'HIT +50', life: 0.8 }); return; }
  g.tanks.splice(g.tanks.indexOf(t), 1); killsN += 1;
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 3;
  const pts = (t.gold ? 500 : 150) * fibMult(S.combo); host.add(pts);
  g.fx.push({ kind: 'text', x: t.x, y: hAt(t.x) - 34, text: `${t.gold ? 'GOLDEN ' : ''}KO +${pts}`, life: 1.2, big: true, col: t.gold ? '#F5C542' : '#FFE08A' }); sfx(t.gold ? 'chime' : 'cheer', { delay: 0.1 });
}
// a kill on anything else (moles, worms, serpents, balloons, meteors): points × the combo and a ring
function zap(x, y, pts, what) { S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 3; const p = pts * fibMult(S.combo); host.add(p); killsN += 1; host.cue?.('kill', x, y); g.fx.push({ kind: 'text', x, y: y - 22, text: `${what} +${p}`, life: 1.1, big: true, col: '#FFE08A' }); g.fx.push({ kind: 'ring', x, y, r: 4, R: 30, life: 0.35 }); }
// ⚡ the railgun: a straight beam from the barrel to the edge of the world; whatever sits within 16 of the line goes
function railgun(x0, y0, a) {
  const L = Math.hypot(W, H()) * 1.2, x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
  const on = (x, y, r = 16) => { const t = ((x - x0) * Math.cos(a) + (y - y0) * Math.sin(a)); if (t < 10) return false; const px = x0 + Math.cos(a) * t, py = y0 + Math.sin(a) * t; return Math.hypot(px - x, py - y) < r; };
  g.beams.push({ x0, y0, x1, y1, life: 0.45 });
  g.tanks.slice().forEach((t) => { if (on(t.x, hAt(t.x) - 6, 18)) hitTank(t, 2); });
  g.moles.forEach((m) => { if (m.hp > 0 && m.t > 0.3 && on(m.x, hAt(m.x) - 6)) { m.hp = 0; zap(m.x, hAt(m.x) - 6, 120, '⚡ MOLE'); } });
  g.worms.forEach((w) => { const h = wormHead(w); if (w.hp > 0 && on(h.x, h.y, 20)) { w.hp = 0; zap(h.x, h.y, 180, '⚡ WORM'); } });
  g.balloons.forEach((b) => { if (b.hp > 0 && on(b.x, b.y, 20)) { b.hp = 0; zap(b.x, b.y, 150, '⚡ BALLOON'); } });
  g.lakes.forEach((l) => { if (l.serpent && l.serpent.hp > 0 && on(l.serpent.x, l.y - 26, 20)) { l.serpent.hp = 0; zap(l.serpent.x, l.y - 26, 200, '⚡ SERPENT'); } });
  g.meteors = g.meteors.filter((m) => { if (on(m.x, m.y, 20)) { zap(m.x, m.y, 120, '⚡ METEOR'); return false; } return true; });
  g.shells = g.shells.filter((q) => q.mine || !on(q.x, q.y, 18));
  for (let i = 0; i < 18; i++) { const t = 30 + Math.random() * 380; g.fx.push({ kind: 'dot', x: x0 + Math.cos(a) * t, y: y0 + Math.sin(a) * t, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, c: ['#9BE7FF', '#FFFFFF', '#C9B8FF'][i % 3], life: 0.5, r: 1.8 }); }
}
// ✈️ airstrike: a jet crosses low and lays five bombs across the marked spot, one after another
function strike(x) {
  const dir = x > W / 2 ? -1 : 1, y = Math.max(110, H() * 0.22);   // under the HUD
  g.jets.push({ x: dir > 0 ? -60 : W + 60, y, vx: dir * 520 });
  g.fx.push({ kind: 'text', x, y: hAt(x) - 30, text: '✈️ INCOMING', life: 1, col: '#BFE9FF' });
  for (let i = 0; i < 5; i++) { const bx = x + (i - 2) * 30 * dir, reach = (bx - (dir > 0 ? -60 : W + 60)) / (520 * dir); g.shells.push({ x: bx, y: y + 6, vx: dir * 40, vy: 60, mine: true, wait: Math.max(0, reach), age: 0 }); }
  sfx('tick');
}
// a jagged bolt between two points (midpoint displacement), for the tesla's arcs
function arc(xa, ya, xb, yb) { let pts = [[xa, ya], [xb, yb]]; for (let k = 0; k < 4; k++) { const n = [pts[0]]; for (let i = 1; i < pts.length; i++) { const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], d = Math.hypot(x2 - x1, y2 - y1); n.push([(x1 + x2) / 2 + (Math.random() - 0.5) * d * 0.35, (y1 + y2) / 2 + (Math.random() - 0.5) * d * 0.35], pts[i]); } pts = n; } g.bolts.push({ pts, life: 0.45 }); }
// 🌩️ tesla: from the blast, hop to the nearest enemy within 170, three times
function tesla(x, y) {
  const hit = new Set(); let cx = x, cy = y;
  for (let k = 0; k < 3; k++) {
    const cands = [
      ...g.tanks.map((t) => ({ x: t.x, y: hAt(t.x) - 8, o: t, f: () => hitTank(t) })),
      ...g.moles.filter((m) => m.hp > 0 && m.t > 0.3).map((m) => ({ x: m.x, y: hAt(m.x) - 6, o: m, f: () => { m.hp = 0; zap(m.x, hAt(m.x) - 6, 120, '🌩️ MOLE'); } })),
      ...g.worms.filter((w) => w.hp > 0).map((w) => { const h = wormHead(w); return { x: h.x, y: h.y, o: w, f: () => { w.hp = 0; zap(h.x, h.y, 180, '🌩️ WORM'); } }; }),
      ...g.balloons.filter((b) => b.hp > 0).map((b) => ({ x: b.x, y: b.y, o: b, f: () => { b.hp = 0; zap(b.x, b.y, 150, '🌩️ BALLOON'); } })),
    ].filter((c) => !hit.has(c.o));
    let best = null, bd = 170; cands.forEach((c) => { const d = Math.hypot(c.x - cx, c.y - cy); if (d < bd) { bd = d; best = c; } });
    if (!best) break; hit.add(best.o); arc(cx, cy, best.x, best.y); best.f(); cx = best.x; cy = best.y;
  }
  if (hit.size) sfx('flash');
}
function boom(x, y, r, mine) {
  crater(x, y, r);
  for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 180; g.fx.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, c: ['#FFF4D6', '#FFC857', '#FF8A3D', '#E0453A'][i % 4], life: 0.7, r: 1.5 + Math.random() * 2 }); }
  g.fx.push({ kind: 'ring', x, y, r: 4, R: r * 1.6, life: 0.4 }); sfx('boom', { size: r / 22 });
  // 🎨 a flash, a fireball, lingering smoke, dirt clods flying from the crater, a scorch on the ground, a little shake
  g.fx.push({ kind: 'flash', x, y, r: r * 2.8, life: 0.16, max: 0.16 }, { kind: 'fire', x, y, r: r * 0.5, R: r * 1.3, life: 0.5, max: 0.5 });
  const ground = Math.abs(y - hAt(x)) < r + 6, ns = Math.min(7, 3 + Math.round(r / 12));
  for (let i = 0; i < ns; i++) { const l = 1.3 + Math.random() * 1.1; g.fx.push({ kind: 'smoke', x: x + (Math.random() - 0.5) * r, y: y - Math.random() * r * 0.6, vx: (Math.random() - 0.5) * 24, vy: -18 - Math.random() * 26, r: r * (0.3 + Math.random() * 0.25), dr: 8 + Math.random() * 10, life: l, max: l, a: 0.55, c: ['#3A3046', '#4A4458', '#2E2838'][i % 3] }); }
  if (ground) { for (let i = 0; i < 6 + Math.round(r / 8); i++) g.fx.push({ kind: 'clod', x: x + (Math.random() - 0.5) * r * 0.8, y: y - 3, vx: (Math.random() - 0.5) * 240, vy: -140 - Math.random() * 200, s: 1.2 + Math.random() * 2.2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 18, c: ['#5B3820', '#7A5232', '#2C7A4B', '#3D2620'][i % 4], life: 1.2 });
    (g.scorch || (g.scorch = [])).push({ x, r, life: 9 }); if (g.scorch.length > 14) g.scorch.shift(); }
  g.shake = Math.max(g.shake || 0, Math.min(0.4, r / 80));
  if (mine) {
    g.tanks.filter((t) => Math.abs(t.x - x) < r + TANK_W / 2 && Math.abs(hAt(t.x) - 8 - y) < r + 14).forEach((t) => hitTank(t));
  } else if (Math.abs(g.me.x - x) < r + TANK_W / 2) {
    if (g.shield) { g.shield = 0; g.fx.push({ kind: 'text', x: g.me.x, y: hAt(g.me.x) - 30, text: '🛡️ BOUNCED', life: 1 }); sfx('clack'); return; }
    if (g.hurtT > 1.2 - GRACE) return;
    const dmg = Math.round(DMG_MIN + (DMG_MAX - DMG_MIN) * Math.max(0, 1 - Math.abs(g.me.x - x) / (r + TANK_W / 2)));
    g.me.armor -= dmg; g.me.calmT = 0; navigator.vibrate?.(60);
    g.hurtT = 1.2; host.cue?.('near', g.me.x, hAt(g.me.x) - 10);
    g.fx.push({ kind: 'text', x: g.me.x, y: hAt(g.me.x) - 34, text: `−${dmg} 🛡`, life: 0.9 });
    if (g.me.armor > 0) return;
    S.combo = 0; navigator.vibrate?.(120); g.me.armor = ARMOR;
    host.hurt('shelled') || host.banner('DIRECT HIT', `${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`);
  }
}
function update(dt) {
  W = host?.W || W;   // 🎚️ the world widens with the stage
  g.time += dt;
  if (g.twist && g.time > g.twist.until) { if (g.twist.kind === 'gale') g.wind *= 0.3; g.twist = null; }
  g.night += ((g.twist?.kind === 'night' ? 1 : 0) - g.night) * Math.min(1, dt * 3);
  if (g.twist?.kind === 'meteors' && Math.random() < dt * 1.2) meteor(40 + Math.random() * (W - 80));
  // 🎚️ the stage: you drive to the middle from Stage 2 (they come from both sides), and the world fills
  const st = stage(), target = st >= 2 ? W / 2 : 44;
  if (Math.abs(g.me.x - target) > 1) { g.me.x += Math.sign(target - g.me.x) * Math.min(Math.abs(target - g.me.x), 46 * dt); if (!g.centred && st >= 2) { g.centred = true; host.banner('🎯 TO THE MIDDLE', 'they come from all sides now'); } }
  if (st >= 2) { g.moleT -= dt; if (g.moleT <= 0) { g.moleT = 7 - st + Math.random() * 3; mole(); } }
  if (st >= 3 && g.lakes.length < Math.min(2, st - 2)) carveLake();
  if (g.lakes.length) { g.serpT -= dt; if (g.serpT <= 0) { g.serpT = 6.5 - st + Math.random() * 3; serpent(); } }
  if (st >= 3) { g.balloonT -= dt; if (g.balloonT <= 0 && g.balloons.length < st - 1) { g.balloonT = 8 - st + Math.random() * 4; balloon(); } }
  if (st >= 3) { g.wormT -= dt; if (g.wormT <= 0 && g.worms.length < st - 2) { g.wormT = 9 - st + Math.random() * 4; worm(); } }
  g.worms = g.worms.filter((w) => { w.t += dt;
    if (w.phase === 'dig') { w.y -= w.spd * dt; if (Math.random() < dt * 10) g.fx.push({ kind: 'dot', x: w.x + (Math.random() - 0.5) * 18, y: w.y - 6, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 40, c: ['#5A3B1F', '#FF5A3A'][Math.floor(Math.random() * 2)], life: 0.5, r: 2 });
      if (w.y <= hAt(w.x)) { w.phase = 'up'; w.t = 0; sfx('thud'); for (let i = 0; i < 12; i++) g.fx.push({ kind: 'dot', x: w.x + (Math.random() - 0.5) * 24, y: hAt(w.x), vx: (Math.random() - 0.5) * 80, vy: -120 - Math.random() * 100, c: ['#FF5A3A', '#FFB347', '#5A3B1F'][i % 3], life: 0.6, r: 2.5 }); } return w.hp > 0; }
    if (w.t > 1 && !w.fired && w.t < 2.4) { w.fired = true; enemyShell(w.x, hAt(w.x) - 34, g.me.x, 260 + 20 * st); sfx('thud'); } return w.t < 3.2 && w.hp > 0; });
  // 📦 ally drones (Stage 2+): across the sky, a crate near you; the crate floats down to the ridge and waits
  if (st >= 2) { g.droneT -= dt; if (g.droneT <= 0 && !g.drones.length) { g.droneT = 14 - st + Math.random() * 8; allyDrone(); } }
  g.drones = g.drones.filter((d) => { d.x += d.vx * dt; if (!d.dropped && Math.abs(d.x - g.me.x) < 70) { d.dropped = true; dropCrate(g.me.x + (Math.random() - 0.5) * 140); sfx('tick'); } return d.x > -40 && d.x < W + 40; });
  g.drops = g.drops.filter((c) => { if (c.down) { c.y += 110 * dt; if (c.y >= hAt(c.x) - 10) { c.y = hAt(c.x) - 10; c.down = false; } } else { c.y = hAt(c.x) - 10; c.life -= dt; } return c.life > 0; });
  g.bolts = g.bolts.filter((bl) => { bl.life -= dt; return bl.life > 0; });
  g.moles = g.moles.filter((m) => { m.t += dt; if (m.t > 0.9 && !m.fired && m.t < 2.4) { m.fired = true; enemyShell(m.x, hAt(m.x) - 6, g.me.x, 220 + 20 * st); } if (m.t < 0.9 && Math.random() < dt * 8) g.fx.push({ kind: 'dot', x: m.x + (Math.random() - 0.5) * 14, y: hAt(m.x), vx: (Math.random() - 0.5) * 60, vy: -90 - Math.random() * 60, c: '#5A3B1F', life: 0.5, r: 2 }); return m.t < 3 && m.hp > 0; });
  g.lakes.forEach((l) => { const s = l.serpent; if (!s) return; s.t += dt; if (s.t > 0.7 && !s.fired) { s.fired = true; enemyShell(s.x, l.y - 26, g.me.x, 200 + 20 * st); } if (s.t > 2.2 || s.hp <= 0) l.serpent = null; });
  g.balloons = g.balloons.filter((b) => { b.x += b.vx * dt; if (!b.dropped && Math.abs(b.x - g.me.x) < 16 + st * 4) { b.dropped = true; g.shells.push({ x: b.x, y: b.y + 14, vx: 0, vy: 40, mine: false }); } return b.x > -30 && b.x < W + 30 && b.hp > 0; });
  // 🌱 the hill always heals, slowly (a crater is half gone in ~4 s); the Regrowth twist heals it fast
  { const fresh = g.fresh || (g.fresh = ridge(g.seed)), rate = g.twist?.kind === 'regrow' ? 0.8 : 0.18; g.h = g.h.map((v, i) => v + (fresh[i] - v) * Math.min(1, dt * rate)); }
  // they fire back, more often the wilder the curve; tanks set by the window hold their fire
  if (g.hurtT > 0) g.hurtT -= dt;
  g.me.calmT += dt; if (g.me.calmT > REPAIR_AFTER && g.me.armor < ARMOR) g.me.armor = Math.min(ARMOR, g.me.armor + REPAIR * dt);   // 🔧 armour mends when nothing has landed for a while
  g.fireT -= dt * (1 + Math.max(0, S.curve.r - 2.9)) / (st === 1 ? 1.8 : 1);   // 🎚️ Stage 1: they fire slowly, and there is no wind
  if (st === 1) g.wind *= Math.max(0, 1 - dt * 2);
  if (g.fireT <= 0) { g.fireT = 2.2 + Math.random() * 2; const t = g.tanks.filter((q) => !q.quiet)[Math.floor(Math.random() * g.tanks.filter((q) => !q.quiet).length)];
    if (t) { const dx = g.me.x - t.x, p = 300 + Math.random() * 120, a = -2.2 - Math.random() * 0.5; t.flash = 0.35; g.shells.push({ x: t.x, y: hAt(t.x) - 10, vx: Math.cos(a) * p * Math.sign(dx) * -1 * -1, vy: Math.sin(a) * p, mine: false }); const s = g.shells[g.shells.length - 1]; const side = Math.sign(dx) || -1, ea = side < 0 ? -2.3 : -Math.PI + 2.3; s.vx = Math.abs(s.vx) * side * (0.8 + Math.random() * 0.5); sfx('cannon'); t.rc = 0.2; const mz = muzzle(t.x, ea, false); puffs(mz.x, mz.y, ea); } }   // 🎯 they fire toward you, from either side
  const forks = [];
  g.shells = g.shells.filter((s) => { if (s.wait > 0) { s.wait -= dt; return true; }   // ✈️ an airstrike bomb waiting for its jet
    s.age = (s.age || 0) + dt;
    if (s.frac > 0 && (s.gen === 0 ? s.vy > 0 : s.age > 0.3)) { const kick = 90 * Math.pow(0.65, s.gen); [-1, 1].forEach((d) => forks.push({ ...s, vx: s.vx + d * kick, vy: s.vy - 20, frac: s.frac - 1, gen: s.gen + 1, age: 0, small: true, tr: null })); g.fx.push({ kind: 'ring', x: s.x, y: s.y, r: 2, R: 14, life: 0.25, col: '#BFE9FF' }); sfx('tick'); return false; }   // ❄️ the fractal forks
    s.vy += G * dt; s.vx += g.wind * dt * 0.6;
    if (s.homing && s.vy > -60) { let best = null, bd = 1e9; g.tanks.forEach((t) => { const d = Math.abs(t.x - s.x); if (d < bd) { bd = d; best = t; } }); if (best) s.vx += Math.sign(best.x - s.x) * 420 * dt; }   // 🎯 guided: it leans toward the nearest tank on the way down
    s.x += s.vx * dt; s.y += s.vy * dt; if (s.x < -20 || s.x > W + 20) return false;
    const tr = s.tr || (s.tr = []); tr.push(s.x, s.y); if (tr.length > 20) tr.splice(0, 2);   // 🎨 the glowing trail
    if (s.mine) {   // your shells against what the world sent: moles, serpents, balloons
      const hit = (x, y, r, pts, what) => { if (Math.hypot(s.x - x, s.y - y) < r) { S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 3; const p = pts * fibMult(S.combo); host.add(p); killsN += 1; host.cue?.('kill', x, y); g.fx.push({ kind: 'text', x, y: y - 22, text: `${what} +${p}`, life: 1.1, big: true, col: '#FFE08A' }); g.fx.push({ kind: 'ring', x, y, r: 4, R: 30, life: 0.35 }); sfx('cheer', { delay: 0.05 }); return true; } return false; };
      const m = g.moles.find((q) => q.t > 0.5 && hit(q.x, hAt(q.x) - 6, 26, 120, '🕳️ MOLE'));   // near misses count
      if (m) { m.hp = 0; return false; }
      const l = g.lakes.find((q) => q.serpent && hit(q.serpent.x, q.y - 26, 28, 200, '🌊 SERPENT')); if (l) { l.serpent.hp = 0; return false; }
      const b = g.balloons.find((q) => hit(q.x, q.y, 28, 150, '🎈 BALLOON')); if (b) { b.hp = 0; return false; }
      const w = g.worms.find((q) => q.phase === 'up' && hit(q.x, hAt(q.x) - 24, 28, 180, '🪱 WORM')); if (w) { w.hp = 0; return false; }
      const mt = g.meteors.find((q) => hit(q.x, q.y, 30, 120, '☄️ METEOR')); if (mt) { g.meteors.splice(g.meteors.indexOf(mt), 1); boom(s.x, s.y, 18, false); return false; }   // ☄️ a shell that meets a meteor breaks it up
      const es = g.shells.find((q) => !q.mine && hit(q.x, q.y, 22, 60, '💣 INTERCEPTED')); if (es) { g.shells.splice(g.shells.indexOf(es), 1); boom(s.x, s.y, 14, false); return false; }   // 💣 and one that meets a falling bomb or shell
    } if (s.y >= hAt(s.x)) {
      if (s.hole) { g.holes.push({ x: s.x, y: hAt(s.x) - 18, t: 0 }); sfx('twist'); return false; }   // 🌀 a black hole opens where it lands
      if (s.strike) { strike(s.x); return false; }
      boom(s.x, s.y, s.napalm ? 52 : s.big ? 34 : s.small ? 15 : 22, s.mine); if (s.tesla) tesla(s.x, s.y); if (s.napalm) for (let i = 0; i < 30; i++) g.fx.push({ kind: 'dot', x: s.x + (Math.random() - 0.5) * 100, y: hAt(s.x + (Math.random() - 0.5) * 100) - 4, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 90, c: ['#FF5A3A', '#FFB347', '#FFE08A'][i % 3], life: 0.9 + Math.random() * 0.6, r: 3 }); return false; } return true; });
  g.shells.push(...forks);
  // ⚡ beams fade; 🌀 black holes pull tanks, shells and meteors in for 2.4 s, then implode; ✈️ jets cross
  g.beams = g.beams.filter((b) => { b.life -= dt; return b.life > 0; });
  g.holes = g.holes.filter((h) => { h.t += dt; const pull = Math.min(1, h.t / 0.6);
    g.tanks.forEach((t) => { const d = h.x - t.x; if (Math.abs(d) < 160) t.x += Math.sign(d) * Math.min(Math.abs(d), 55 * pull * dt); });
    g.shells.forEach((q) => { if (!q.mine) { const dx = h.x - q.x, dy = h.y - q.y, d = Math.hypot(dx, dy) || 1; if (d < 140) { q.vx += dx / d * 600 * dt; q.vy += dy / d * 600 * dt; } } });
    g.shells = g.shells.filter((q) => q.mine || Math.hypot(q.x - h.x, q.y - h.y) > 14);
    if (Math.random() < dt * 30) { const a = Math.random() * 6.28, r = 50 + Math.random() * 40; g.fx.push({ kind: 'dot', x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, c: ['#C9B8FF', '#7A5CFF', '#FFFFFF'][Math.floor(Math.random() * 3)], life: 0.45, r: 1.6, nog: true }); }
    if (h.t >= 2.4) { boom(h.x, h.y + 8, 40, true); g.tanks.filter((t) => Math.abs(t.x - h.x) < 70).forEach((t) => hitTank(t, 2)); g.fx.push({ kind: 'ring', x: h.x, y: h.y, r: 70, R: 2, life: 0.4, col: '#C9B8FF' }); return false; }
    return true; });
  g.jets = g.jets.filter((j) => { j.x += j.vx * dt; return j.x > -80 && j.x < W + 80; });
  g.meteors = g.meteors.filter((m) => { m.y += m.vy * dt; m.x += m.vx * dt; m.vy += 120 * dt; if (m.y >= hAt(m.x)) { boom(m.x, m.y, 40, false); g.tanks.filter((t) => Math.abs(t.x - m.x) < 46).forEach((t) => { g.tanks.splice(g.tanks.indexOf(t), 1); killsN += 1; host.add(75); g.fx.push({ kind: 'text', x: t.x, y: m.y - 30, text: 'FLATTENED +75', life: 1 }); }); return false; } return true; });
  g.tanks.forEach((t) => { if (t.flash > 0) t.flash -= dt; if (t.rc > 0) t.rc -= dt; if (t.gold && t.hp === 1 && Math.random() < dt * 5) g.fx.push({ kind: 'smoke', x: t.x + (Math.random() - 0.5) * 8, y: hAt(t.x) - 14, vx: g.wind * 0.2, vy: -22, r: 2.5, dr: 7, life: 1.2, max: 1.2, a: 0.45, c: '#2E2838' }); });   // 🎨 a hit golden tank smokes
  // 🎨 the look's own motion: recoil, shake, scorch fading, clouds drifting with the wind, smoke while you're hurt
  if (g.rc > 0) g.rc -= dt; if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 1.2);
  if (g.scorch) g.scorch = g.scorch.filter((q) => (q.life -= dt) > 0);
  if (look.seed === g.seed) look.clouds.forEach((c) => { c.x += (5 + g.wind * 0.35) * (0.5 + c.s * 0.5) * dt; if (c.x > W + 100) c.x = -100; else if (c.x < -100) c.x = W + 100; });
  if (g.hurtT > 0 && Math.random() < dt * 8) g.fx.push({ kind: 'smoke', x: g.me.x + (Math.random() - 0.5) * 10, y: hAt(g.me.x) - 12, vx: g.wind * 0.2, vy: -26, r: 3, dr: 8, life: 1, max: 1, a: 0.45, c: '#2E2838' });
  g.fx.forEach((f) => { f.life -= dt;
    if (f.kind === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; if (!f.nog) f.vy += 300 * dt; }
    else if (f.kind === 'clod') { f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (f.vy !== 0 || f.vx !== 0) { f.vy += 520 * dt; const gy = hAt(Math.max(0, Math.min(W, f.x))); if (f.y > gy && f.vy > 0) { f.y = gy; f.vx = 0; f.vy = 0; f.vr = 0; f.life = Math.min(f.life, 0.4); } } }
    else if (f.kind === 'smoke') { f.x += (f.vx + g.wind * 0.25) * dt; f.y += f.vy * dt; f.vy *= 1 - dt * 0.8; f.r += f.dr * dt; }
    else if (f.kind === 'ring') f.r += (f.R - f.r) * Math.min(1, dt * 14);
    else if (f.kind === 'text') f.y -= 24 * dt; });
  g.fx = g.fx.filter((f) => f.life > 0);
}
// 🎨 THE LOOK. Everything static is drawn once into offscreen canvases (`look`, rebuilt only for a new seed): the sky
// as two 1-px strips (day, night), three parallax mountain ranges (each with a night copy), the rock under the hill,
// a haze strip, glow sprites per colour and two cloud sprites. Per frame the ridge is the hill's path clipped over the
// rock, with strata, topsoil, grass and scorch stroked along it; decor (rocks, flowers, bushes, pines) is seeded per
// game and hides where a crater has dug (`dugAt`) or a lake lies.
const look = { seed: -1, sky: null, skyN: null, mts: [], rock: null, haze: null, glows: new Map(), cloudImg: [], clouds: [], decor: [] };
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function strip(stops, h = 256) { const c = mkCanvas(1, h), x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, col]) => gr.addColorStop(o, col)); x.fillStyle = gr; x.fillRect(0, 0, 1, h); return c; }
function glowImg(rgb) {
  let c = look.glows.get(rgb); if (c) return c;
  c = mkCanvas(64, 64); const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.25, `rgba(${rgb},0.55)`); gr.addColorStop(0.6, `rgba(${rgb},0.14)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); look.glows.set(rgb, c); return c;
}
function glowAt(rgb, x, y, r, a = 1) { if (r <= 0 || a <= 0) return; ctx.globalAlpha = a; ctx.drawImage(glowImg(rgb), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }
function mountainImg(seed, i) {
  const w = 512, h = 256, c = mkCanvas(w, h), x = c.getContext('2d'), r = rng(seed * 31 + i * 977 + 7), n = 65, p = new Array(n);
  const base = [80, 96, 112][i], amp = [150, 110, 80][i];
  p[0] = base + (r() - 0.5) * amp * 0.4; p[n - 1] = base + (r() - 0.5) * amp * 0.4;
  const sub = (a, b, s) => { if (b - a < 2) return; const m = (a + b) >> 1; p[m] = (p[a] + p[b]) / 2 + (r() - 0.5) * s; sub(a, m, s * 0.56); sub(m, b, s * 0.56); };
  sub(0, n - 1, amp); for (let j = 0; j < n; j++) p[j] = Math.max(14, Math.min(h - 40, p[j]));
  const cols = [['#8A6CB8', '#5C4690'], ['#4B3A86', '#2C2258'], ['#271D50', '#150F30']][i];
  const gr = x.createLinearGradient(0, 40, 0, h); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
  x.fillStyle = gr; x.beginPath(); x.moveTo(0, h); p.forEach((v, j) => x.lineTo((j * w) / (n - 1), v)); x.lineTo(w, h); x.closePath(); x.fill();
  if (i === 0) {   // snow on the far peaks, and a rim of light along every ridge
    x.fillStyle = 'rgba(236,226,255,0.55)';
    for (let j = 1; j < n - 1; j++) if (p[j] < p[j - 1] && p[j] < p[j + 1] && p[j] < base - 20) { const px = (j * w) / (n - 1), d = (w / (n - 1)) * 1.6; x.beginPath(); x.moveTo(px, p[j]); x.lineTo(px - d, p[j] + d * 0.9); x.lineTo(px - d * 0.3, p[j] + d * 0.6); x.lineTo(px + d * 0.2, p[j] + d * 0.95); x.lineTo(px + d, p[j] + d * 0.9); x.closePath(); x.fill(); }
  }
  x.strokeStyle = ['rgba(255,214,236,0.35)', 'rgba(255,190,220,0.22)', 'rgba(255,170,200,0.16)'][i]; x.lineWidth = 2; x.beginPath(); p.forEach((v, j) => x[j ? 'lineTo' : 'moveTo']((j * w) / (n - 1), v + 1)); x.stroke();
  if (i === 2) {   // a fringe of pines along the nearest range
    x.fillStyle = '#1A1438';
    for (let px = 2; px < w; px += 3 + r() * 6) { const j = (px / w) * (n - 1), a = Math.floor(j), v = p[a] + (p[Math.min(n - 1, a + 1)] - p[a]) * (j - a), th = 6 + r() * 12; x.beginPath(); x.moveTo(px, v - th); x.lineTo(px - th * 0.32, v + 2); x.lineTo(px + th * 0.32, v + 2); x.closePath(); x.fill(); }
  }
  const cn = mkCanvas(w, h), xn = cn.getContext('2d'); xn.drawImage(c, 0, 0); xn.globalCompositeOperation = 'source-atop'; xn.fillStyle = 'rgba(4,4,20,0.62)'; xn.fillRect(0, 0, w, h);
  return { day: c, night: cn };
}
function rockImg(seed) {
  const w = 256, h = 256, c = mkCanvas(w, h), x = c.getContext('2d'), r = rng(seed * 13 + 5);
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6E4628'); gr.addColorStop(0.3, '#57361F'); gr.addColorStop(0.65, '#3D2620'); gr.addColorStop(1, '#22151E'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  for (let b = 0; b < 9; b++) {   // strata: wavy bands, darker the deeper
    const y0 = 20 + b * 26 + r() * 10, th = 3 + r() * 7, ph = r() * 6.28, f = 1 + Math.floor(r() * 3);
    x.fillStyle = b % 2 ? `rgba(0,0,0,${0.08 + b * 0.012})` : `rgba(255,214,170,${0.05 + r() * 0.04})`;
    x.beginPath(); for (let px = 0; px <= w; px += 8) x.lineTo(px, y0 + Math.sin((px / w) * 6.28 * f + ph) * 5); for (let px = w; px >= 0; px -= 8) x.lineTo(px, y0 + th + Math.sin((px / w) * 6.28 * f + ph + 0.6) * 5); x.closePath(); x.fill();
  }
  for (let i = 0; i < 260; i++) {   // pebbles and grit
    const px = r() * w, py = r() * h, s = 0.6 + r() * (py > h * 0.4 ? 3.2 : 1.8);
    x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.18 + r() * 0.2})` : `rgba(255,226,190,${0.06 + r() * 0.1})`;
    x.beginPath(); x.ellipse(px, py, s * 1.3, s, r() * 3, 0, 7); x.fill();
  }
  return c;
}
function cloudImg(seed) {
  const c = mkCanvas(160, 70), x = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 7; i++) { const px = 30 + r() * 100, py = 30 + r() * 16, rr = 14 + r() * 16, gr = x.createRadialGradient(px, py - rr * 0.3, 1, px, py, rr); gr.addColorStop(0, 'rgba(255,240,250,0.9)'); gr.addColorStop(0.7, 'rgba(230,200,235,0.55)'); gr.addColorStop(1, 'rgba(200,170,220,0)'); x.fillStyle = gr; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill(); }
  return c;
}
function initSky() {
  if (!look.sky) {
    look.sky = strip([[0, '#100C34'], [0.32, '#251D5E'], [0.55, '#55347E'], [0.7, '#B45A82'], [0.85, '#F08E72'], [1, '#FFC27A']]);
    look.skyN = strip([[0, '#03030D'], [0.45, '#0A0A24'], [0.7, '#1A1236'], [1, '#2A1430']]);
    look.haze = strip([[0, 'rgba(255,150,180,0)'], [1, 'rgba(255,160,170,0.32)']], 64);
    look.cloudImg = [cloudImg(11), cloudImg(29), cloudImg(47)];
  }
}
function ensureLook() {
  initSky();
  if (look.seed === g.seed) return;
  look.seed = g.seed; look.mts = [0, 1, 2].map((i) => mountainImg(g.seed, i)); look.rock = rockImg(g.seed);
  const r = rng(g.seed * 7 + 3);
  look.clouds = Array.from({ length: 6 }, (_, i) => ({ x: r() * W, y: 40 + r() * H() * 0.22, s: 0.5 + r() * 0.7, img: i % 3, a: 0.25 + r() * 0.35 }));
  look.decor = [];
  for (let xf = 0.015; xf < 0.985; xf += 0.012 + r() * 0.03) { const q = r(); look.decor.push({ xf, kind: q < 0.3 ? 'rock' : q < 0.58 ? 'flower' : q < 0.8 ? 'bush' : 'pine', s: 0.7 + r() * 0.6, c: ['#FFD166', '#FF7AA2', '#C9B8FF', '#FFFFFF'][Math.floor(r() * 4)], ph: r() * 6.28 }); }
}
// how far the hill has been dug below where it stood fresh at x (decor and grass hide in craters)
const dugAt = (x) => { const fr = g.fresh; if (!fr) return 0; const i = Math.max(0, Math.min(99, x / SP())), a = Math.floor(i), f = fr[a] + (fr[Math.min(100, a + 1)] - fr[a]) * (i - a); return hAt(x) - f; };
const hsh = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function ridgePath(dy = 0) { ctx.beginPath(); g.h.forEach((v, i) => ctx[i ? 'lineTo' : 'moveTo'](i * SP(), v + dy)); }
function drawGround(t, Hh) {
  const sp = SP();
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, Hh + 4); g.h.forEach((v, i) => ctx.lineTo(i * sp, v)); ctx.lineTo(W, Hh + 4); ctx.closePath(); ctx.clip();
  const top = Hh * 0.28; ctx.drawImage(look.rock, 0, top, W, Hh - top + 4);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  [[44, 4, 0.22], [78, 3, 0.18], [120, 5, 0.2]].forEach(([dy, lw, a]) => { ctx.strokeStyle = `rgba(20,8,18,${a})`; ctx.lineWidth = lw; ridgePath(dy); ctx.stroke(); ctx.strokeStyle = `rgba(255,210,170,${a * 0.35})`; ctx.lineWidth = 1; ridgePath(dy - lw * 0.6); ctx.stroke(); });   // strata that follow the hill
  ctx.strokeStyle = '#5B3820'; ctx.lineWidth = 34; ridgePath(); ctx.stroke();   // topsoil
  ctx.strokeStyle = 'rgba(30,14,10,0.35)'; ctx.lineWidth = 20; ridgePath(); ctx.stroke();
  ctx.strokeStyle = '#2C7A4B'; ctx.lineWidth = 15; ridgePath(); ctx.stroke();   // turf
  ctx.strokeStyle = '#47B062'; ctx.lineWidth = 8; ridgePath(); ctx.stroke();
  ctx.strokeStyle = '#9BEA8E'; ctx.lineWidth = 2.5; ridgePath(); ctx.stroke();   // the sunlit edge
  (g.scorch || []).forEach((s) => { const a = Math.min(1, s.life / 3) * 0.75; glowAt('22,10,8', s.x, hAt(s.x) + 3, s.r * 1.5, a); });   // scorched crater rims
  ctx.restore();
  // grass blades along the ridge (shorter in craters, none in lakes), leaning with the wind
  const lean = Math.max(-3, Math.min(3, g.wind * 0.03));
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? '#B4F29A' : '#3FA35C'; ctx.lineWidth = pass ? 1 : 1.4; ctx.beginPath();
    for (let i = pass; i * 2.6 < W; i += 2) { const x = i * 2.6 + hsh(i) * 1.5; if (g.lakes.length && inLake(x)) continue; const y = hAt(x), d = dugAt(x), hb = (2.5 + hsh(i + 7) * 4.5) * Math.max(0, 1 - d / 9); if (hb < 0.6) continue; const sw = lean + Math.sin(t / 650 + i * 0.37) * 0.9; ctx.moveTo(x, y + 1); ctx.quadraticCurveTo(x + sw * 0.3, y - hb * 0.6, x + sw, y - hb); }
    ctx.stroke();
  }
  // decor: rocks, flowers, bushes and little pines, seeded per game
  look.decor.forEach((d) => {
    const x = d.xf * W; if (Math.abs(x - g.me.x) < 16 || (g.lakes.length && inLake(x)) || dugAt(x) > 5) return;
    const y = hAt(x) + 1, s = d.s;
    if (d.kind === 'rock') { ctx.fillStyle = '#6C6478'; ctx.beginPath(); ctx.ellipse(x, y - 2 * s, 4.5 * s, 3 * s, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#A8A0B8'; ctx.beginPath(); ctx.ellipse(x - 1.2 * s, y - 3.4 * s, 2 * s, 1.1 * s, -0.3, 0, 7); ctx.fill(); }
    else if (d.kind === 'flower') { const sw = Math.sin(t / 700 + d.ph) * 1.2; ctx.strokeStyle = '#3FA35C'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y - 7 * s); ctx.stroke(); ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(x + sw, y - 7 * s, 2 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#FFB347'; ctx.beginPath(); ctx.arc(x + sw, y - 7 * s, 0.8 * s, 0, 7); ctx.fill(); }
    else if (d.kind === 'bush') { ctx.fillStyle = '#23683F'; ctx.beginPath(); ctx.arc(x - 3.5 * s, y - 2.5 * s, 3.6 * s, 0, 7); ctx.arc(x + 3.5 * s, y - 2.5 * s, 3.4 * s, 0, 7); ctx.arc(x, y - 4.5 * s, 4.4 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#3E9A58'; ctx.beginPath(); ctx.arc(x - 1.2 * s, y - 6 * s, 2.2 * s, 0, 7); ctx.fill(); }
    else { const h = 16 * s; ctx.fillStyle = '#4A2E1A'; ctx.fillRect(x - 1, y - 4 * s, 2, 4 * s); ctx.fillStyle = '#1F5E3A'; for (let k2 = 0; k2 < 3; k2++) { const yy = y - 3 * s - k2 * h * 0.26, ww = (6.5 - k2 * 1.6) * s; ctx.beginPath(); ctx.moveTo(x, yy - h * 0.42); ctx.lineTo(x - ww, yy); ctx.lineTo(x + ww, yy); ctx.closePath(); ctx.fill(); } ctx.fillStyle = 'rgba(180,240,170,0.25)'; ctx.beginPath(); ctx.moveTo(x, y - 3 * s - h * 0.94); ctx.lineTo(x - 2.2 * s, y - 3 * s - h * 0.5); ctx.lineTo(x, y - 3 * s - h * 0.55); ctx.closePath(); ctx.fill(); }
  });
}
// a tank: a ground shadow, treads with rolling wheels, a shaded hull tilted to the slope, a turret (or Fig at the
// wheel), the barrel at its aim with recoil, a white flash when hit
function drawTank(x, hue, flash, mine, gold, tk) {
  const gy = hAt(x), tilt = Math.max(-0.45, Math.min(0.45, Math.atan2(hAt(x + 8) - hAt(x - 8), 16)));
  ctx.fillStyle = 'rgba(8,4,16,0.35)'; ctx.beginPath(); ctx.ellipse(x, gy + 1, 15, 3.4, tilt, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, gy - 8); ctx.rotate(tilt);
  if (g.glitch && !mine) { drawPal(g.glitchPal || 'fig', ctx, { x: 0, y: -12, s: 10, t: performance.now() / 1000, r: 4, face: -1 }); ctx.restore(); return; }   // ⚡ glitch: Fig on every hill
  const body = gold ? '#F5C542' : mine ? '#3DD6C6' : `hsl(${hue} 62% 54%)`, dark = gold ? '#9C6E10' : mine ? '#17766E' : `hsl(${hue} 58% 30%)`, lite = gold ? '#FFF0B0' : mine ? '#B8FFF4' : `hsl(${hue} 80% 76%)`;
  const rc = (mine ? g.rc : tk?.rc) || 0, recoil = rc > 0 ? (rc / 0.2) * 4 : 0;
  const aim = mine ? (drag ? Math.atan2(-(drag.y - drag.y0), -(drag.x - drag.x0)) : g.aimA ?? -0.8) : ((Math.sign(g.me.x - x) || -1) < 0 ? -2.3 : -Math.PI + 2.3);
  const piv = mine ? [0, -9] : [1, -10];
  // the barrel, behind the turret
  ctx.save(); ctx.translate(piv[0], piv[1]); ctx.rotate(aim - tilt); ctx.fillStyle = dark; ctx.fillRect(-recoil, -1.8, 14, 3.6); ctx.fillStyle = lite; ctx.globalAlpha = 0.5; ctx.fillRect(-recoil, -1.8, 13, 1.1); ctx.globalAlpha = 1; ctx.fillStyle = '#1B1626'; ctx.fillRect(12 - recoil, -2.4, 3.5, 4.8); ctx.restore();
  // treads and wheels
  ctx.fillStyle = '#1B1626'; ctx.beginPath(); ctx.roundRect(-13.5, -0.5, 27, 8.5, 4.2); ctx.fill();
  const roll = x / 2.6; ctx.strokeStyle = '#3A3348'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 9; i++) { const sx = -12 + (((i * 3 + x * 0.9) % 27) + 27) % 27; ctx.moveTo(sx, -0.3); ctx.lineTo(sx, 1.2); ctx.moveTo(sx, 6.6); ctx.lineTo(sx, 7.9); } ctx.stroke();
  for (let i = 0; i < 4; i++) { const wx = -9 + i * 6; ctx.fillStyle = '#5A5268'; ctx.beginPath(); ctx.arc(wx, 3.8, 2.7, 0, 7); ctx.fill(); ctx.strokeStyle = '#2A2436'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx + Math.cos(roll) * 2.2, 3.8 + Math.sin(roll) * 2.2); ctx.lineTo(wx - Math.cos(roll) * 2.2, 3.8 - Math.sin(roll) * 2.2); ctx.stroke(); }
  // the hull
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-13, 0.5); ctx.lineTo(-10, -7); ctx.lineTo(10.5, -7); ctx.lineTo(13.5, 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = lite; ctx.globalAlpha = 0.55; ctx.fillRect(-9.5, -7, 19.5, 1.8); ctx.globalAlpha = 1; ctx.fillStyle = dark; ctx.fillRect(-12.5, -1.6, 25.5, 2.1);
  ctx.strokeStyle = 'rgba(10,6,20,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-13, 0.5); ctx.lineTo(-10, -7); ctx.lineTo(10.5, -7); ctx.lineTo(13.5, 0.5); ctx.stroke();
  if (mine) drawPal(g.glitch ? (g.glitchPal || 'fig') : (S.curve.mood || 'calm'), ctx, { x: 0, y: -16, s: 8, t: performance.now() / 1000, r: S.curve.r, face: 1, hurt: g.hurtT > 0 });   // 🟢 you are Fig, at the wheel
  else {
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(1, -7, 6.5, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(10,6,20,0.55)'; ctx.stroke();
    ctx.fillStyle = lite; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(-0.5, -9.5, 2.2, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#1B1626'; ctx.fillRect(-1.5, -10.5, 2.5, 1.5);   // the hatch
    if (gold) { const tw = 0.5 + 0.5 * Math.sin(performance.now() / 160); ctx.fillStyle = `rgba(255,255,240,${tw})`; ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(7, -11.5); ctx.lineTo(9.5, -10.5); ctx.lineTo(7, -9.5); ctx.lineTo(6, -7); ctx.lineTo(5, -9.5); ctx.lineTo(2.5, -10.5); ctx.lineTo(5, -11.5); ctx.closePath(); ctx.fill(); }
  }
  if (flash > 0) { ctx.globalAlpha = Math.min(1, flash * 2.4); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-13, 0.5); ctx.lineTo(-10, -7); ctx.lineTo(10.5, -7); ctx.lineTo(13.5, 0.5); ctx.closePath(); ctx.fill(); if (!mine) { ctx.beginPath(); ctx.arc(1, -7, 6.5, Math.PI, 0); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.restore();
}
// where a barrel's mouth is (for the muzzle flash and smoke)
const muzzle = (x, a, mine) => { const gy = hAt(x), tilt = Math.max(-0.45, Math.min(0.45, Math.atan2(hAt(x + 8) - hAt(x - 8), 16))), px = mine ? 0 : 1, py = mine ? -9 : -10, c = Math.cos(tilt), s = Math.sin(tilt); return { x: x + px * c - py * s + Math.cos(a) * 15, y: gy - 8 + px * s + py * c + Math.sin(a) * 15 }; };
function shellLook(s) {
  if (!s.mine) return ['255,90,58', '#2A1A22'];
  return s.napalm ? ['255,110,50', '#FF5A3A'] : s.homing ? ['255,224,138', '#FFE08A'] : s.hole ? ['160,130,255', '#2A1A5A'] : s.tesla ? ['155,231,255', '#E6FBFF'] : s.frac || s.small ? ['191,233,255', '#F2FBFF'] : s.strike ? ['255,176,122', '#FFB07A'] : s.big ? ['255,200,87', '#FFF1C8'] : ['61,214,198', '#D8FFF9'];
}
// 🕳️ the way into the pocket: a burrow in the hill, warm light coming up out of it
function drawBurrow(x, t) {
  const y = hAt(x) + 1, pu = 0.5 + 0.5 * Math.sin(t / 240);
  ctx.fillStyle = '#4A2E1A'; ctx.beginPath(); ctx.ellipse(x - 13, y - 1, 7, 4, -0.3, Math.PI, 0); ctx.ellipse(x + 13, y - 1, 7, 4, 0.3, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#0E0605'; ctx.beginPath(); ctx.ellipse(x, y, 12, 5, 0, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; glowAt('255,170,80', x, y - 2, 22 + 6 * pu, 0.55 + 0.25 * pu); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.ellipse(x, y + 1, 6, 2, 0, 0, 7); ctx.fill();
}
function draw(t) {
  W = host?.W || W;
  const k = host.k, Hh = H();
  const sh = g && g.shake > 0 && !host.reduceMotion ? g.shake * 14 : 0, sx = sh ? (Math.random() - 0.5) * sh : 0, sy = sh ? (Math.random() - 0.5) * sh : 0;
  ctx.setTransform(k, 0, 0, k, (host.ox || 0) + sx * k, (host.oy || 0) + sy * k);
  const night = g ? g.night : 0;
  initSky();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(look.sky, 0, -sh, W, Hh + 2 * sh + 2);
  if (night > 0.01) { ctx.globalAlpha = night; ctx.drawImage(look.skyN, 0, -sh, W, Hh + 2 * sh + 2); ctx.globalAlpha = 1; }
  for (let i = 0; i < 34; i++) { const ph = i * 1.733, x = (Math.sin(ph * 2.3) * 0.5 + 0.5) * W, y = (Math.cos(ph * 1.3) * 0.5 + 0.5) * Hh * 0.42, tw = 0.5 + 0.5 * Math.sin(t / 520 + ph * 3); ctx.fillStyle = `rgba(255,248,235,${(0.18 + 0.7 * night) * tw})`; ctx.fillRect(x, y, i % 5 ? 1.2 : 2, i % 5 ? 1.2 : 2); }
  // 🌊 going under: the deeper you're zoned in, the further the day goes: an amber dusk on the horizon, a deep indigo
  // overhead, the stars coming out, the moon rising bigger with a halo
  const dk = host.deep?.() || 0;
  if (dk > 0.02) {
    const dg = ctx.createLinearGradient(0, 0, 0, Hh * 0.75); dg.addColorStop(0, `rgba(6,6,30,${0.75 * dk})`); dg.addColorStop(0.65, `rgba(40,20,70,${0.45 * dk})`); dg.addColorStop(1, `rgba(255,140,70,${0.35 * dk})`); ctx.fillStyle = dg; ctx.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 46; i++) { const ph = i * 2.399, x = (Math.sin(ph * 3.1) * 0.5 + 0.5) * W, y = (Math.cos(ph * 1.7) * 0.5 + 0.5) * Hh * 0.5, tw = 0.5 + 0.5 * Math.sin(t / 400 + ph * 4); ctx.fillStyle = `rgba(255,250,230,${dk * tw * 0.9})`; ctx.fillRect(x, y, i % 7 ? 1.5 : 2.5, i % 7 ? 1.5 : 2.5); }
  }
  { const mr = 22 + 16 * dk, mx = W * 0.78, my = 70; glowAt('255,226,170', mx, my, mr * (4.2 + dk * 1.5), 0.32 + 0.3 * dk + 0.2 * night); if (dk > 0.02) { const mg = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 3); mg.addColorStop(0, `rgba(255,233,176,${0.35 * dk})`); mg.addColorStop(1, 'rgba(255,233,176,0)'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#FFE9B0'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(214,180,120,0.35)'; ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, 0, 7); ctx.arc(mx + mr * 0.35, my + mr * 0.25, mr * 0.15, 0, 7); ctx.arc(mx + mr * 0.1, my - mr * 0.45, mr * 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,240,0.5)'; ctx.beginPath(); ctx.arc(mx - mr * 0.35, my - mr * 0.4, mr * 0.28, 0, 7); ctx.fill(); }
  if (!g) return;
  ensureLook();
  // ⛰️ three ranges, nearer ones sliding further as you drive (parallax), darker at night
  const nt = Math.max(night, dk * 0.7);
  for (let i = 0; i < 3; i++) { const m = look.mts[i], f = [0.04, 0.08, 0.14][i], mg = W * 0.12, ox = -(g.me.x - W / 2) * f - mg, y0 = Hh * (0.08 + 0.09 * i), hh = Hh * 0.66;
    ctx.drawImage(m.day, ox, y0, W + 2 * mg, hh); if (nt > 0.01) { ctx.globalAlpha = nt; ctx.drawImage(m.night, ox, y0, W + 2 * mg, hh); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.55 * (1 - nt); ctx.drawImage(look.haze, 0, y0 + hh * 0.35, W, hh * 0.4); ctx.globalAlpha = 1; }
  look.clouds.forEach((c) => { const im = look.cloudImg[c.img]; ctx.globalAlpha = c.a * (1 - 0.55 * nt); ctx.drawImage(im, c.x - 80 * c.s, c.y - 35 * c.s, 160 * c.s, 70 * c.s); }); ctx.globalAlpha = 1;
  drawGround(t, Hh);
  if (g.burrow && host.pocket?.offering?.()) drawBurrow(g.burrow.x, t);
  if (night > 0.01) { ctx.fillStyle = `rgba(4,4,20,${0.5 * night})`; ctx.fillRect(0, Hh * 0.25, W, Hh); }
  // wind: a pill with an arrow as long as the wind
  { const wv = g.wind, txt = `wind ${Math.abs(Math.round(wv))}`; ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const tw = ctx.measureText(txt).width + 34; ctx.fillStyle = 'rgba(16,10,40,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2, 14, tw, 20, 10); ctx.fill();
    ctx.fillStyle = '#ffffffcc'; ctx.fillText(txt, W / 2 + 7, 24.5); const al = Math.min(12, Math.abs(wv) / 6), ax = W / 2 - tw / 2 + 13; ctx.strokeStyle = Math.abs(wv) > 70 ? '#FF8A6A' : '#9BE7FF'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    if (al > 1) { const d = Math.sign(wv); ctx.moveTo(ax - al / 2 * d, 24); ctx.lineTo(ax + al / 2 * d, 24); ctx.moveTo(ax + al / 2 * d - 3 * d, 21); ctx.lineTo(ax + al / 2 * d, 24); ctx.lineTo(ax + al / 2 * d - 3 * d, 27); } else ctx.arc(ax, 24, 1.5, 0, 7); ctx.stroke(); ctx.textBaseline = 'alphabetic'; }
  // 🌊 lakes: deep water, a foam line, glints and the sky in it; a serpent rises out of it
  g.lakes.forEach((l) => { const wg = ctx.createLinearGradient(0, l.y - 4, 0, l.y + 16); wg.addColorStop(0, '#4FA3E0'); wg.addColorStop(0.4, '#2A6FB0'); wg.addColorStop(1, '#123668'); ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(l.x0, l.y); for (let x = l.x0; x <= l.x1; x += 6) ctx.lineTo(x, l.y - 3 + Math.sin(x / 14 + t / 300) * 1.6); ctx.lineTo(l.x1, l.y + 16); ctx.lineTo(l.x0, l.y + 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(220,245,255,0.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = l.x0; x <= l.x1; x += 6) ctx[x === l.x0 ? 'moveTo' : 'lineTo'](x, l.y - 3 + Math.sin(x / 14 + t / 300) * 1.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 5; i++) { const gx = l.x0 + 8 + ((i * 37 + t / 40) % Math.max(10, l.x1 - l.x0 - 20)), gy = l.y + 2 + (i % 3) * 3.5, gw = 4 + (i % 2) * 4; ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); } ctx.stroke();
    const s = l.serpent; if (s) { const up = Math.min(1, s.t / 0.5) * (s.t > 1.7 ? Math.max(0, (2.2 - s.t) / 0.5) : 1), h = 34 * up, rp = (s.t * 30) % 18;
      ctx.strokeStyle = `rgba(220,245,255,${0.6 * (1 - rp / 18)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(s.x - 8, l.y + 1, 6 + rp, 2 + rp * 0.2, 0, 0, 7); ctx.stroke();
      ctx.lineCap = 'round'; const neck = () => { ctx.beginPath(); ctx.moveTo(s.x - 14, l.y + 4); ctx.quadraticCurveTo(s.x - 6, l.y - h * 0.9, s.x, l.y - h); };
      ctx.strokeStyle = '#1F5A3A'; ctx.lineWidth = 9; neck(); ctx.stroke(); ctx.strokeStyle = '#3FA86B'; ctx.lineWidth = 6.5; neck(); ctx.stroke(); ctx.strokeStyle = '#A8E6A0'; ctx.lineWidth = 2; ctx.setLineDash([2, 4]); neck(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#1F5A3A'; ctx.beginPath(); ctx.ellipse(s.x + 2, l.y - h, 8.5, 6.5, -0.2, 0, 7); ctx.fill(); ctx.fillStyle = '#3FA86B'; ctx.beginPath(); ctx.ellipse(s.x + 2, l.y - h, 7.5, 5.6, -0.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#E8FF9A'; ctx.beginPath(); ctx.moveTo(s.x - 4, l.y - h - 4); ctx.lineTo(s.x - 1, l.y - h - 10); ctx.lineTo(s.x + 2, l.y - h - 5); ctx.fill();
      ctx.fillStyle = '#FFF6B0'; ctx.beginPath(); ctx.arc(s.x + 4, l.y - h - 2, 2.4, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(s.x + 3.6, l.y - h - 4, 0.9, 3.8);
      if (s.fired && s.t < 1.2) { ctx.strokeStyle = '#FF5A7A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x + 9, l.y - h + 1); ctx.lineTo(s.x + 14, l.y - h + 2); ctx.lineTo(s.x + 16, l.y - h); ctx.moveTo(s.x + 14, l.y - h + 2); ctx.lineTo(s.x + 16, l.y - h + 4); ctx.stroke(); } } });
  // 🕳️ moles: a dirt mound, then the mole with its pink nose and claws
  g.moles.forEach((m) => { const up = m.t < 0.9 ? m.t / 0.9 : m.t > 2.4 ? Math.max(0, (3 - m.t) / 0.6) : 1, y = hAt(m.x), rr = 11, my = y + rr - rr * 1.6 * up;
    ctx.fillStyle = '#4A2E1A'; ctx.beginPath(); ctx.ellipse(m.x, y + 1, 14, 4.5, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#6B4426'; ctx.beginPath(); ctx.ellipse(m.x - 3, y, 8, 2.5, 0, Math.PI, 0); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(m.x - 20, y - 40, 40, 40); ctx.clip();
    ctx.fillStyle = '#5A3E2B'; ctx.beginPath(); ctx.arc(m.x, my, rr, Math.PI, 0); ctx.lineTo(m.x + rr, my + 6); ctx.lineTo(m.x - rr, my + 6); ctx.fill(); ctx.fillStyle = '#7A5A42'; ctx.beginPath(); ctx.ellipse(m.x, my - 1, 6.5, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#F7B5C8'; ctx.beginPath(); ctx.arc(m.x, my - 2, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(m.x - 0.8, my - 2.8, 0.9, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(m.x - 4, my - 5, 1.6, 0, 7); ctx.arc(m.x + 4, my - 5, 1.6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#F2E2C8'; ctx.lineWidth = 1; ctx.beginPath(); for (const sd of [-1, 1]) for (let c = 0; c < 3; c++) { const cx = m.x + sd * (8 + c * 1.6); ctx.moveTo(cx, my + 1); ctx.lineTo(cx + sd * 1.5, my + 4); } ctx.stroke(); ctx.restore(); });
  g.worms.forEach((w) => { const y = hAt(w.x);
    if (w.phase === 'dig') {   // under the ground: the tunnel it leaves from the bottom of the world, and the worm at its head, glowing
      ctx.strokeStyle = '#2E1A0C'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w.x, Hh + 20); ctx.lineTo(w.x, w.y + 10); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,120,60,0.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w.x - 5, Hh + 20); ctx.lineTo(w.x - 5, w.y + 14); ctx.stroke();
      const gr = ctx.createLinearGradient(0, w.y + 44, 0, w.y); gr.addColorStop(0, '#7A1F0E'); gr.addColorStop(1, '#FFB347'); ctx.strokeStyle = gr; ctx.lineWidth = 12; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const yy = w.y + 44 - (44 * i) / 6; ctx[i ? 'lineTo' : 'moveTo'](w.x + Math.sin(w.t * 7 + i) * 4, yy); } ctx.stroke();
      ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(w.x - 3 + Math.sin(w.t * 7 + 6) * 4, w.y - 2, 1.8, 0, 7); ctx.arc(w.x + 3 + Math.sin(w.t * 7 + 6) * 4, w.y - 2, 1.8, 0, 7); ctx.fill();
      glowAt('255,120,60', w.x, w.y, 44, 0.45);
      ctx.strokeStyle = `rgba(255,90,58,${0.3 + 0.5 * Math.abs(Math.sin(w.t * 9))})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w.x - 14, y - 1); ctx.lineTo(w.x - 5, y + 3); ctx.lineTo(w.x + 3, y - 2); ctx.lineTo(w.x + 12, y + 2); ctx.stroke();   // the ground above it cracks
      return;
    }
    ctx.strokeStyle = '#2E1A0C'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w.x, Hh + 20); ctx.lineTo(w.x, y + 6); ctx.stroke();   // the tunnel it came up
    const up = w.t < 0.8 ? w.t / 0.8 : w.t > 2.4 ? Math.max(0, (3.2 - w.t) / 0.8) : 1, h = 36 * up; glowAt('255,110,50', w.x, y - h * 0.6, 34, 0.35 * up); ctx.save(); ctx.beginPath(); ctx.rect(w.x - 24, y - 50, 48, 50); ctx.clip();
    const gr = ctx.createLinearGradient(0, y, 0, y - h); gr.addColorStop(0, '#7A1F0E'); gr.addColorStop(1, '#FFB347'); ctx.strokeStyle = gr; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const yy = y - (h * i) / 6; ctx[i ? 'lineTo' : 'moveTo'](w.x + Math.sin(w.t * 6 + i) * 4 * up, yy); } ctx.stroke();
    ctx.strokeStyle = '#FF5A3A88'; ctx.lineWidth = 2; for (let i = 1; i < 6; i++) { const yy = y - (h * i) / 6; ctx.beginPath(); ctx.moveTo(w.x - 6 + Math.sin(w.t * 6 + i) * 4 * up, yy); ctx.lineTo(w.x + 6 + Math.sin(w.t * 6 + i) * 4 * up, yy); ctx.stroke(); }
    ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(w.x - 3 + Math.sin(w.t * 6 + 6) * 4 * up, y - h - 1, 1.8, 0, 7); ctx.arc(w.x + 3 + Math.sin(w.t * 6 + 6) * 4 * up, y - h - 1, 1.8, 0, 7); ctx.fill(); ctx.restore(); });
  // 🎈 balloons: a striped envelope, ropes, a wicker basket and the bomb it carries
  g.balloons.forEach((b) => { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(b.x, hAt(b.x) + 1, 8, 2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#E8D8C0aa'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(b.x - 8, b.y + 9); ctx.lineTo(b.x - 4, b.y + 22); ctx.moveTo(b.x + 8, b.y + 9); ctx.lineTo(b.x + 4, b.y + 22); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(b.x, b.y, 11.5, 14, 0, 0, 7); ctx.clip(); ctx.fillStyle = '#E0453A'; ctx.fillRect(b.x - 12, b.y - 15, 24, 30); ctx.fillStyle = '#FFD166'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 4, 15, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#B8322A'; ctx.fillRect(b.x - 12, b.y + 6, 24, 9); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(b.x - 5, b.y - 6, 3, 5, -0.3, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.roundRect(b.x - 4.5, b.y + 21, 9, 6.5, 1.5); ctx.fill(); ctx.strokeStyle = '#5A3B1F'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(b.x - 4.5, b.y + 24); ctx.lineTo(b.x + 4.5, b.y + 24); ctx.stroke();
    if (!b.dropped) { ctx.fillStyle = '#1A1420'; ctx.beginPath(); ctx.arc(b.x, b.y + 31, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = '#FF5A3A'; ctx.beginPath(); ctx.arc(b.x + 1.5, b.y + 28.2, 1 + 0.5 * Math.sin(t / 60), 0, 7); ctx.fill(); } });
  g.tanks.forEach((tk) => { if (night > 0.5 && tk.flash <= 0) return; drawTank(tk.x, tk.hue, tk.flash, false, tk.gold, tk); if (tk.quiet) { ctx.fillStyle = '#C9B8FF'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🔁', tk.x, hAt(tk.x) - 30); } });
  drawTank(g.me.x, 0, 0, true, false, null);
  if (g.me.armor < ARMOR) { const ax = g.me.x - 16, ay = hAt(g.me.x) - 40, f = Math.max(0, g.me.armor) / ARMOR;   // 🛡 your armour, shown once it's dented
    ctx.fillStyle = 'rgba(8,4,16,0.6)'; ctx.fillRect(ax - 1, ay - 1, 34, 5); ctx.fillStyle = f > 0.5 ? '#5BE3B0' : f > 0.25 ? '#F5C542' : '#FF5C7A'; ctx.fillRect(ax, ay, 32 * f, 3); }
  if (g.shield) { const sy2 = hAt(g.me.x) - 10, pu = 1 + 0.05 * Math.sin(t / 200); glowAt('127,211,247', g.me.x, sy2, 30 * pu, 0.35); ctx.strokeStyle = '#BFEFFF'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(g.me.x, sy2, 22 * pu, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.strokeStyle = '#7FD3F788'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(g.me.x, sy2, 22 * pu, 0, 7); ctx.stroke(); }
  if (drag) {   // the slingshot: the band from where you pressed, a dotted forecast (fading, coloured by power), the landing ring and a power arc round the tank
    const dx = drag.x - drag.x0, dy = drag.y - drag.y0, d = Math.min(160, Math.hypot(dx, dy)), a = Math.atan2(-dy, -dx), mt = muzzle(g.me.x, a, true), pw = d / 160;
    const col = pw < 0.5 ? `rgb(${Math.round(61 + 390 * pw)},${Math.round(214 + 20 * pw)},${Math.round(198 - 200 * pw)})` : `rgb(255,${Math.round(234 - 260 * (pw - 0.5))},${Math.round(98 - 60 * (pw - 0.5))})`;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(drag.x0, drag.y0); ctx.lineTo(drag.x0 + dx * (d / Math.max(1, Math.hypot(dx, dy))), drag.y0 + dy * (d / Math.max(1, Math.hypot(dx, dy)))); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(drag.x0, drag.y0, 3, 0, 7); ctx.fill();
    let px = mt.x, py = mt.y, vx = Math.cos(a) * (240 + d * 2.9), vy = Math.sin(a) * (240 + d * 2.9), land = null; ctx.fillStyle = col;
    for (let i = 0; i < 26; i++) { vy += G * 0.04; vx += g.wind * 0.04 * 0.6; px += vx * 0.04; py += vy * 0.04; if (py > hAt(px)) { land = [px, hAt(px)]; break; } ctx.globalAlpha = 0.95 - i * 0.03; ctx.beginPath(); ctx.arc(px, py, 2.8 - i * 0.07, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (land) { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(land[0], land[1], 9, 3.5, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(land[0] - 4, land[1]); ctx.lineTo(land[0] + 4, land[1]); ctx.stroke(); }
    const cy = hAt(g.me.x) - 10; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(16,10,40,0.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(g.me.x, cy, 27, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.me.x, cy, 27, Math.PI * 0.85, Math.PI * (0.85 + 1.3 * pw)); ctx.stroke();
    ctx.font = '900 10px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1B1030'; ctx.lineWidth = 3; const lab = `${Math.round(pw * 100)}%`; ctx.strokeText(lab, g.me.x, cy - 31); ctx.fillText(lab, g.me.x, cy - 31);
  }
  g.holes.forEach((h) => { const e = Math.min(1, h.t / 0.4), R = 26 * e * (1 + 0.1 * Math.sin(h.t * 20)); glowAt('122,92,255', h.x, h.y, R * 3, 0.8);
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.t * 6); ctx.strokeStyle = '#C9B8FF'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); for (let k2 = 0; k2 < 20; k2++) { const rr = R * 1.8 * (1 - k2 / 20), aa = k2 * 0.25; ctx[k2 ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#05030F'; ctx.beginPath(); ctx.arc(h.x, h.y, R * 0.6, 0, 7); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(h.x, h.y, R * 0.6, 0, 7); ctx.stroke(); });
  g.beams.forEach((b) => { ctx.save(); ctx.globalAlpha = Math.min(1, b.life * 3); ctx.lineCap = 'round'; ctx.strokeStyle = '#7A5CFF'; ctx.shadowColor = '#9BE7FF'; ctx.shadowBlur = 18; ctx.lineWidth = 10 * b.life * 2; ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke(); ctx.restore(); });
  g.jets.forEach((j) => { ctx.save(); ctx.translate(j.x, j.y); ctx.scale(Math.sign(j.vx), 1); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-90, 2); ctx.stroke(); ctx.fillStyle = '#C8D2DC'; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-18, -5); ctx.lineTo(-20, 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8FA0B0'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-10, -14); ctx.lineTo(-6, 0); ctx.moveTo(2, 1); ctx.lineTo(-10, 12); ctx.lineTo(-6, 1); ctx.fill(); ctx.fillStyle = '#2A3A50'; ctx.beginPath(); ctx.ellipse(10, -1.5, 5, 2, 0, 0, 7); ctx.fill(); ctx.restore(); glowAt('255,138,61', j.x - Math.sign(j.vx) * 21, j.y, 9, 0.9); });
  // shells: a fading trail, a glow, a bright core (yours light, theirs dark bombs with a red glow)
  g.shells.forEach((s) => { if (s.wait > 0) return; const [rgb, core] = shellLook(s), tr = s.tr, big = s.big || s.hole ? 6 : s.small ? 3 : 4;
    if (tr && tr.length >= 4) { ctx.lineCap = 'round'; const n = tr.length / 2; for (let j = 1; j < n; j++) { const f = j / n; ctx.strokeStyle = `rgba(${rgb},${0.5 * f})`; ctx.lineWidth = big * 1.1 * f; ctx.beginPath(); ctx.moveTo(tr[j * 2 - 2], tr[j * 2 - 1]); ctx.lineTo(tr[j * 2], tr[j * 2 + 1]); ctx.stroke(); } ctx.strokeStyle = `rgba(${rgb},0.5)`; ctx.lineWidth = big * 1.1; ctx.beginPath(); ctx.moveTo(tr[tr.length - 2], tr[tr.length - 1]); ctx.lineTo(s.x, s.y); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter'; glowAt(rgb, s.x, s.y, big * 3.4, s.mine ? 0.75 : 0.6); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(s.x, s.y, big, 0, 7); ctx.fill(); if (!s.mine) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(s.x - big * 0.35, s.y - big * 0.35, big * 0.35, 0, 7); ctx.fill(); }
    if (s.hole || s.tesla) { ctx.strokeStyle = s.hole ? '#C9B8FF' : '#FFFFFF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, 8 + Math.sin(performance.now() / 60) * 2, 0, 7); ctx.stroke(); } });
  // 📦 the ally drone: a body with a light, spinning rotors and a blinking beacon
  g.drones.forEach((d) => { ctx.save(); ctx.translate(d.x, d.y); ctx.scale(Math.sign(d.vx), 1); ctx.fillStyle = '#17766E'; ctx.beginPath(); ctx.roundRect(-13, -5, 26, 11, 5); ctx.fill(); ctx.fillStyle = '#3DD6C6'; ctx.beginPath(); ctx.roundRect(-12, -5, 24, 7, 4); ctx.fill(); ctx.fillStyle = '#C9FFF8'; ctx.beginPath(); ctx.ellipse(7, -2, 3.5, 2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#C9FFF8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(16, -8); ctx.stroke(); const sp = (t / 30) % 6.28; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-14, -9, 8 * Math.abs(Math.cos(sp)), 1.5, 0, 0, 7); ctx.ellipse(14, -9, 8 * Math.abs(Math.sin(sp)), 1.5, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '900 7px system-ui'; ctx.textAlign = 'center'; ctx.fillText('ALLY', -2, 4); ctx.restore(); if (Math.sin(t / 120) > 0.3) glowAt('120,255,200', d.x, d.y + 6, 6, 1); });
  g.drops.forEach((c) => { const a = ARTY[c.kind]; ctx.save(); ctx.translate(c.x, c.y); const sc = dropScale(c); ctx.scale(sc, sc); ctx.translate(-c.x, -c.y);
    if (c.down) { ctx.fillStyle = '#C9FFF8'; ctx.beginPath(); ctx.arc(c.x, c.y - 22, 16, Math.PI, 0); ctx.quadraticCurveTo(c.x + 8, c.y - 25, c.x, c.y - 22); ctx.quadraticCurveTo(c.x - 8, c.y - 25, c.x - 16, c.y - 22); ctx.fill(); ctx.fillStyle = '#3DD6C6'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 38); ctx.arc(c.x, c.y - 22, 16, -Math.PI * 0.62, -Math.PI * 0.38); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ffffff99'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(c.x - 15, c.y - 22); ctx.lineTo(c.x - 9, c.y - 8); ctx.moveTo(c.x + 15, c.y - 22); ctx.lineTo(c.x + 9, c.y - 8); ctx.moveTo(c.x, c.y - 22); ctx.lineTo(c.x, c.y - 8); ctx.stroke(); }
    else glowAt('245,197,66', c.x, c.y, 26, 0.35 + 0.15 * Math.sin(t / 200));
    const blink = !c.down && c.life < 3 && Math.sin(t / 80) > 0; ctx.fillStyle = blink ? '#FFE08A' : '#9A6634'; ctx.beginPath(); ctx.roundRect(c.x - 10, c.y - 8, 20, 16, 2.5); ctx.fill();
    ctx.strokeStyle = '#6A4220'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x - 10, c.y - 3); ctx.lineTo(c.x + 10, c.y - 3); ctx.moveTo(c.x - 10, c.y + 3); ctx.lineTo(c.x + 10, c.y + 3); ctx.stroke();
    ctx.strokeStyle = '#F5C542'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x - 10, c.y - 8, 20, 16); ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.icon, c.x, c.y); ctx.textBaseline = 'alphabetic';
    if (!c.down) { ctx.fillStyle = '#C9FFF8'; ctx.font = '900 9px system-ui'; ctx.fillText('TAP', c.x, c.y - 14); } ctx.restore(); });
  g.bolts.forEach((bl) => { ctx.save(); ctx.globalAlpha = Math.min(1, bl.life * 4); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const path = () => { ctx.beginPath(); bl.pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); }; ctx.strokeStyle = '#9BE7FF'; ctx.shadowColor = '#9BE7FF'; ctx.shadowBlur = 12; ctx.lineWidth = 4; path(); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; path(); ctx.stroke(); ctx.restore(); });
  // ☄️ meteors: a tapering fiery tail, a glow and a cratered rock
  g.meteors.forEach((m) => { const sp = Math.hypot(m.vx, m.vy) || 1, ux = m.vx / sp, uy = m.vy / sp, L = 40; ctx.fillStyle = 'rgba(255,170,80,0.45)'; ctx.beginPath(); ctx.moveTo(m.x - uy * 8, m.y + ux * 8); ctx.lineTo(m.x - ux * L, m.y - uy * L); ctx.lineTo(m.x + uy * 8, m.y - ux * 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,0.6)'; ctx.beginPath(); ctx.moveTo(m.x - uy * 4, m.y + ux * 4); ctx.lineTo(m.x - ux * L * 0.6, m.y - uy * L * 0.6); ctx.lineTo(m.x + uy * 4, m.y - ux * 4); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; glowAt('255,138,61', m.x, m.y, 26, 0.8); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#5A3A3A'; ctx.beginPath(); ctx.arc(m.x, m.y, 7.5, 0, 7); ctx.fill(); ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.arc(m.x + ux * 2, m.y + uy * 2, 5.5, 0, 7); ctx.fill(); ctx.fillStyle = '#3A2424'; ctx.beginPath(); ctx.arc(m.x - 2, m.y - 1, 1.6, 0, 7); ctx.arc(m.x + 2, m.y + 2, 1.2, 0, 7); ctx.fill(); });
  // fx in three layers: smoke and dirt clods, then fire and flashes (added light), then sparks, rings and words
  g.fx.forEach((f) => { if (f.kind === 'smoke') { const e = f.life / f.max; ctx.globalAlpha = Math.min(1, e * 1.6) * (f.a || 0.5); ctx.fillStyle = f.c || '#4A4458'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); ctx.globalAlpha *= 0.5; ctx.fillStyle = '#8A8296'; ctx.beginPath(); ctx.arc(f.x - f.r * 0.3, f.y - f.r * 0.3, f.r * 0.55, 0, 7); ctx.fill(); }
    else if (f.kind === 'clod') { ctx.globalAlpha = Math.min(1, f.life * 3); ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = f.c; ctx.fillRect(-f.s, -f.s * 0.7, f.s * 2, f.s * 1.4); ctx.restore(); } });
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
  g.fx.forEach((f) => { if (f.kind === 'flash') glowAt('255,244,214', f.x, f.y, f.r, f.life / f.max);
    else if (f.kind === 'fire') { const e = 1 - f.life / f.max, r = f.r + (f.R - f.r) * Math.sqrt(e); glowAt('255,140,50', f.x, f.y - e * 8, r * 1.6, (1 - e) * 0.9); glowAt('255,220,140', f.x, f.y - e * 6, r * 0.8, (1 - e) * 0.9); }
    else if (f.kind === 'muzzle') { const e = f.life / f.max; glowAt('255,220,140', f.x, f.y, 14, e); ctx.globalAlpha = e; ctx.fillStyle = '#FFF4D6'; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(13 * (1.2 - e * 0.4), 0); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; } });
  ctx.globalCompositeOperation = 'source-over';
  g.fx.forEach((f) => { if (f.kind === 'dot') { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5)); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }
    else if (f.kind === 'ring') { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5)); ctx.strokeStyle = f.col || '#FFC857'; ctx.lineWidth = 5 * f.life * 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.stroke(); }
    else if (f.kind === 'text') { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5)); ctx.font = f.big ? '400 20px Bungee, Impact, sans-serif' : '900 14px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.col || '#FFE08A'; ctx.strokeStyle = '#1B1030'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } });
  ctx.globalAlpha = 1;
}
const organ = {
  key: 'hilltop', name: 'Hilltop', icon: '💥', verb: 'drag to aim · let go to fire', beat: 1.1,
  theme: { bg: '#1B1646', gold: '#F5C542', bannerc: '#FFE08A' },
  glitch(on, pal) { if (g) { g.glitch = on; g.glitchPal = pal; } },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__ht = organ.debug; window.__ht0 = organ.shellsN; },
  start() { newGame(); },
  enter(from) { if (!g) newGame(); bar = host.ui('<div class="wbar" id="hbar" aria-label="Artillery"></div>').querySelector('.wbar'); renderBar(); drag = null; if (from) { g.shells = g.shells.filter((s) => s.mine); g.fireT = Math.max(g.fireT, 1.5); if (!g.tanks.length) addTank(); } },
  leave() { bar = null; drag = null; return g ? { x: g.me.x, y: hAt(g.me.x) - 10 } : null; },
  update, draw, onBeat,
  pointer(type, p) { if (type === 'down') drag = { x0: p.x, y0: p.y, x: p.x, y: p.y }; else if (type === 'move') { if (drag) { drag.x = p.x; drag.y = p.y; } } else if (drag) { if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) < 10) tap(drag.x0, drag.y0); else fire(drag.x - drag.x0, drag.y - drag.y0); drag = null; } },
  hudLine: () => (g ? `💥 ${killsN} K.O. · ${g.tanks.length} dug in` : ''),
  // 🕳️ the pocket: a burrow by your tank (your deepest crater within reach, else a fresh one), and what comes up out of it
  pocket: burrowPocket,
  pocketSpot() {
    if (!g) return null;
    if (!g.burrow || g.time - g.burrow.at > 1) { let best = null; for (let x = Math.max(24, g.me.x - 120); x <= Math.min(W - 24, g.me.x + 120); x += 4) { if (Math.abs(x - g.me.x) < 36 || inLake(x)) continue; const d = dugAt(x); if (d > 7 && (!best || d > best.d)) best = { x, d }; }
      const side = g.me.x < W / 2 ? 1 : -1; g.burrow = { x: best ? best.x : Math.max(24, Math.min(W - 24, g.me.x + side * (60 + Math.random() * 30))), crater: !!best }; }
    g.burrow.at = g.time; return { x: g.burrow.x, y: hAt(g.burrow.x) - 2, r: 18, icon: '⛏️' };
  },
  pocketSeed: () => ({ seed: Math.floor(Math.random() * 1e9), stage: stage(), crater: !!g?.burrow?.crater }),
  pocketReward(res) {
    if (!g) return; drag = null; g.burrow = null; g.fireT = Math.max(g.fireT, 1.6); g.shells = g.shells.filter((s) => s.mine);   // a breath on the way back up
    if (!res) return; const gf = res.gift || {}, y = hAt(g.me.x) - 36;
    if (gf.armor) { g.me.armor = ARMOR; g.me.calmT = 0; } if (gf.shield) g.shield = 1;
    if (gf.crate) { const ks = Object.keys(ARTY), kd = ks[Math.floor(Math.random() * ks.length)]; g.arty = { kind: kd, n: ARTY[kd].n }; renderBar(); }
    g.fx.push({ kind: 'text', x: g.me.x, y, text: `🛡 FULL${gf.crate ? ` · ${ARTY[g.arty.kind].icon} ${g.arty.n}` : ''}`, life: 1.6, big: true, col: '#C9FFF8' }); g.fx.push({ kind: 'ring', x: g.me.x, y: y + 26, r: 4, R: 40, life: 0.5, col: '#9BE7FF' }); sfx('chime', { hi: true });
  },
  level: () => 1 + Math.floor(killsN / 5),
  overText: (how) => (how === 'shelled' ? ['💥 KNOCKED OUT', 'Too many direct hits.'] : ['RUN OVER', '']),
  endStats: () => (g ? `💥 ${killsN} K.O. from ${shotsN} shells` : ''),
  debug: () => g && ({ ...(() => ({ me: g.me.x, armor: g.me.armor, shield: g.shield, burrow: g.burrow, hitMe: (x, r = 20) => boom(x, hAt(x) - 4, r, false), tanks: g.tanks.length, moles: g.moles.length, lakes: g.lakes.length, balloons: g.balloons.length, worms: g.worms.length, wormsAt: g.worms.map((w) => ({ ...wormHead(w), phase: w.phase, t: w.t })), arty: g.arty, beams: g.beams.length, holes: g.holes.length, jets: g.jets.length, bolts: g.bolts.length, give: (k) => { g.arty = { kind: k, n: ARTY[k].n }; renderBar(); }, fire, tesla, tankXs: g.tanks.map((t) => [t.x, hAt(t.x)]), eshells: g.shells.filter((s) => !s.mine).map((s) => [Math.round(s.x), Math.round(s.vx)]), kinds: Object.keys(ARTY), drones: g.drones.length, drops: g.drops.map((c) => ({ x: c.x, y: c.y, kind: c.kind, down: c.down })), tap, stage: stage(), twist: (kind) => { g.twist = { kind, until: g.time + 6 }; } }))() }),
  shellsN: () => g?.shells.filter((s) => s.mine).length, debug0: () => g && ({ tanks: g.tanks.map((t) => ({ x: t.x, y: hAt(t.x), gold: t.gold, quiet: t.quiet })), me: { x: g.me.x, y: hAt(g.me.x) }, shells: g.shells.length, kills: killsN, wind: g.wind, twist: g.twist?.kind || null, W, H: H(), fire }),
};
export default organ;
