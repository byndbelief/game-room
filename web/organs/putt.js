// ⛳ Putt, an organ of the shell: Putt Post's DNA, one fairway at a time. Drag back from anywhere and
// let go to putt; sink the cup for 100 × the Fibonacci combo. A fairway is a corridor of straight legs:
// Course 1 is one short leg (a single putt), and each course adds a bend, narrows it and brings hazards.
// You are Fig, rolled up into the ball. Par + 2 putts a cup, or you pick up (a heart). The box's beats reshape
// the green: a peak drops bumpers, a big hop cuts a water hazard, gift grows the cup, the mirror flips
// the green left for right (and the ball with it), the balance draws your line to the cup, the golden
// cut gilds the cup (500), the window sets three cups (sink any), a Fibonacci beat is a free putt.
// Twists: 💨 wind, 🧊 ice (no friction), 🌊 ripple (the green heaves), 🕳️ tiny cup.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';

let W = 400, R = 6, CUP_R = 11, PUTTS = 5;
const TWISTS = [
  ['💨 WIND', 'the ball drifts across the green', 'wind'],
  ['🧊 ICE', 'nothing slows down', 'ice'],
  ['🌊 RIPPLE', 'the green heaves', 'ripple'],
  ['🕳️ TINY CUP', 'half the cup for a while', 'tiny'],
];
let nightL = null, host, ctx, S, sfx, g = null, sunkN = 0, puttsN = 0, drag = null;
const H = () => host.H;
const hash = (i) => { let x = (Math.imul(i | 0, 374761393) + 668265263) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
// ⛳ COURSES: three holes a course. A fairway is a corridor (`g.path`, legs of a polyline, `g.pw` wide) from the
// tee to the cup: Course 1 one short straight leg, Course 2 one bend, Course 3 an S, then more bends, narrower,
// with bumpers (course 3+), sand (2+) and water (5+) on the way. The par is the bends + 1 (+1 for two or more
// bumpers, +1 for water). Make the course's par and you move up; miss it and you play that course again.
const bendsOf = (c) => (c <= 1 ? 0 : c === 2 ? 1 : c === 3 ? 2 : Math.min(4, 2 + Math.floor(Math.random() * 2) + (c >= 5 ? 1 : 0)));
const widthOf = (c) => Math.min(190, 44 + 22 * (c - 1));   // the fairway widens a lot as the courses go on (44, 66, 88 … 190), and the legs get longer
function corridor(bends, c) {   // legs from the bottom middle, turning 60–105° at each bend; retried with shorter legs until it fits the world
  // the map widens with the courses: the walk may use a wider and wider slice of the field, and later courses lean sideways
  const m = widthOf(c) / 2 + 10, span = Math.min(1, 0.4 + 0.12 * c), B = { x0: Math.max(m, W / 2 - (W / 2 - m) * span), x1: Math.min(W - m, W / 2 + (W / 2 - m) * span), y0: 60 + m, y1: H() - 50 - m };   // the bounds keep the whole band inside the field
  for (let tries = 0; tries < 60; tries++) {
    const pts = [{ x: W / 2 + (Math.random() - 0.5) * (bends ? 140 : 20), y: B.y1 - 10 }]; let a = -Math.PI / 2, ok = true, turn = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i <= bends; i++) {
      const len = ((bends ? 100 : 130) + 22 * Math.min(c, 8) + Math.random() * 60) * Math.max(0.45, 1 - tries / 60), p = pts[pts.length - 1], q = { x: p.x + Math.cos(a) * len, y: p.y + Math.sin(a) * len };
      if (q.x < B.x0 || q.x > B.x1 || q.y < B.y0 || q.y > B.y1) { ok = false; break; }
      pts.push(q); a += turn * (Math.PI / 3 + Math.random() * Math.PI / 4) * (c >= 4 ? 1.15 : 1); turn = Math.random() < 0.7 ? -turn : turn;
    }
    if (ok) return centred(pts);
  }
  return centred([{ x: W / 2, y: H() - 80 }, { x: W / 2, y: H() - 230 }]);
}
function centred(pts) {   // the fairway sits in the middle of the field, not wherever the walk left it
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), dx = W / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, dy = (60 + H() - 50) / 2 - (Math.min(...ys) + Math.max(...ys)) / 2;
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}
const nearest = (x, y) => { let best = null; for (let i = 0; i < g.path.length - 1; i++) { const p = g.path[i], q = g.path[i + 1], dx = q.x - p.x, dy = q.y - p.y, L2 = dx * dx + dy * dy || 1; let t = ((x - p.x) * dx + (y - p.y) * dy) / L2; t = Math.max(0, Math.min(1, t)); const nx = p.x + dx * t, ny = p.y + dy * t, d = Math.hypot(x - nx, y - ny); if (!best || d < best.d) best = { x: nx, y: ny, d, i, t }; } return best; };
const tee = () => ({ x: g.path[0].x, y: g.path[0].y });
function parOf() { let p = 1 + (g.path.length - 2) + (g.course >= 4 ? 1 : 0); if (g.bumpers.length >= 2) p += 1; if (g.water.length) p += 1; return Math.max(1, Math.min(6, p)); }
const PUTTS_OF = () => (g?.par || 3) + 2;
function newGame() { g = { ball: null, v: { x: 0, y: 0 }, cups: [], bumpers: [], sand: [], water: [], fx: [], putts: 0, hole: 0, course: 1, courseHole: 0, coursePar: 0, courseStrokes: 0, par: 3, twist: null, time: 0, seed: Math.floor(Math.random() * 1e6), wind: 0, guide: 0, free: 0, gold: false, gopher: null, gopherT: 3, restT: 0, fixes: 0 }; sunkN = 0; puttsN = 0; newCup(); }
function spot(margin = 10) {   // a point on the fairway, `margin` in from its edge, off the tee and the cup
  for (let k = 0; k < 24; k++) { const i = Math.floor(Math.random() * (g.path.length - 1)), p = g.path[i], q = g.path[i + 1], t = 0.15 + Math.random() * 0.7, nx = -(q.y - p.y), ny = q.x - p.x, L = Math.hypot(nx, ny) || 1, off = (Math.random() - 0.5) * Math.max(0, g.pw - 2 * margin); const sp = { x: p.x + (q.x - p.x) * t + nx / L * off, y: p.y + (q.y - p.y) * t + ny / L * off }; if ((!g.ball || Math.hypot(sp.x - g.ball.x, sp.y - g.ball.y) > 40) && (!g.cups[0] || Math.hypot(sp.x - g.cups[0].x, sp.y - g.cups[0].y) > 36)) return sp; }
  const e = g.path[g.path.length - 1]; return { x: e.x, y: e.y };
}
function newCup(three = false) {
  if (three) { g.cups = [0, 1, 2].map(() => spot(12)); return; }   // 🔁 the window: three cups along the fairway, sink any
  g.path = corridor(bendsOf(g.course), g.course); g.pw = widthOf(g.course); const e = g.path[g.path.length - 1];
  g.ball = tee(); g.cups = [{ x: e.x, y: e.y, big: Math.max(0.6, 1 - 0.08 * (g.course - 1)) }];
  g.putts = 0; g.hole += 1; g.seed = (g.seed * 16807 + g.hole) % 2147483647; g.gold = false; g.guide = 0; g.gopher = null;
  g.bumpers = []; for (let i = 0; i < Math.min(4, g.course - 2); i++) { const sp = spot(14); g.bumpers.push({ x: sp.x, y: sp.y, r: 10 }); }
  g.sand = []; if (g.course >= 2 && Math.random() < 0.6) { const sp = spot(8); g.sand.push({ x: sp.x, y: sp.y, rx: 26, ry: 16 }); }
  g.water = []; if (g.course >= 5) { const sp = spot(10); g.water.push({ x: sp.x, y: sp.y, rx: 22, ry: 14 }); }
  g.par = parOf(); g.courseHole += 1; g.coursePar += g.par;
  g.fixes = g.course <= 1 ? 0 : g.course === 2 ? 2 : g.course <= 4 ? 3 : g.course <= 6 ? 4 : 5;   // 🔧 repairs a hole: tap a hazard to fix it
  trail = []; const th = themeOf();   // 🎨 every hole is a new place: say where we are
  if (g.courseHole === 1) host.banner(`⛳ COURSE ${g.course} · ${th.icon} ${th.name}`, `three holes · make par to move up · ${th.sub}`);
  else host.banner(`${th.icon} HOLE ${g.hole} · ${th.name}`, th.sub);
}
// after a cup: the hole's score against par, and the course's
function holeDone(strokes) {
  g.courseStrokes += strokes;
  const vs = strokes - g.par, say = vs <= -2 ? '🦅 EAGLE' : vs === -1 ? '🐦 BIRDIE' : vs === 0 ? 'PAR' : vs === 1 ? 'BOGEY' : `${vs} OVER`;
  if (vs < 0) host.add(100 * -vs);
  if (g.courseHole >= 3) {
    const made = g.courseStrokes <= g.coursePar;
    if (made) { g.course += 1; host.banner(`⛳ COURSE ${g.course - 1} MADE`, `${g.courseStrokes} on a par ${g.coursePar} · up to course ${g.course}`); host.add(300 * (g.course - 1)); sfx('fanfare'); }
    else host.banner('⛳ OVER PAR', `${g.courseStrokes} on a par ${g.coursePar} · course ${g.course} again`);
    g.courseHole = 0; g.coursePar = 0; g.courseStrokes = 0;
  } else g.fx.push({ kind: 'text', x: W / 2, y: 90, text: say, life: 1.2, big: true, col: vs <= 0 ? '#C9FFF8' : '#FFB3A8' });
}
function onBeat(ev) {
  const x = ev.x;
  if (ev.window && g.cups.length < 3) { newCup(true); host.banner('🔁 THREE CUPS', 'sink any of them'); }
  if (ev.peak && !ev.window && g.course >= 2) { const p = spot(14); g.bumpers.push({ x: p.x, y: p.y, r: 9 + Math.floor((x - 0.75) * 24) }); if (g.bumpers.length > 5) g.bumpers.shift(); }
  else if (ev.hop > 0.3 && !ev.window && g.course >= 3) { const p = spot(10); g.water.push({ x: p.x, y: p.y, rx: 18 + ev.hop * 20, ry: 12 + ev.hop * 10 }); if (g.water.length > 2) g.water.shift(); }
  else if (x > 0.4 && x < 0.6 && Math.random() < 0.5 && g.course >= 2) { const p = spot(8); g.sand.push({ x: p.x, y: p.y, rx: 26, ry: 16 }); if (g.sand.length > 3) g.sand.shift(); }
  if (ev.gift) g.cups.forEach((c) => { c.big = 1.6; });
  if (ev.mirror) { const flip = (o) => { o.x = W - o.x; }; g.path.forEach(flip); g.cups.forEach(flip); g.bumpers.forEach(flip); g.sand.forEach(flip); g.water.forEach(flip); flip(g.ball); if (g.gopher) flip(g.gopher); sfx('chime'); }
  if (ev.balance) { g.guide = 4; sfx('chime'); }
  if (ev.golden) { g.gold = true; g.cups.forEach((c) => { c.gold = true; }); sfx('chime', { hi: true }); }
  if (ev.fib) g.free += 1;
  if (ev.big && !g.twist) twist();
}
function twist() {
  const [title, sub, kind] = TWISTS[Math.floor(Math.random() * TWISTS.length)];
  g.twist = { kind, until: g.time + 6, wind: (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 40) }; host.banner(title, sub); sfx('twist');
}
const moving = () => Math.hypot(g.v.x, g.v.y) > 6;   // a crawl under 6 px/s counts as stopped: the next putt is yours sooner
function putt(dx, dy) {
  if (!g || S.over || moving()) return;
  const d = Math.min(150, Math.hypot(dx, dy)); if (d < 8) return;
  const a = Math.atan2(dy, dx), p = d * 5.2;
  g.v = { x: -Math.cos(a) * p, y: -Math.sin(a) * p };
  if (g.free > 0) { g.free -= 1; g.fx.push({ kind: 'text', x: g.ball.x, y: g.ball.y - 16, text: '🌻 free putt', life: 0.9 }); } else g.putts += 1;
  puttsN += 1; sfx('putt', { power: d / 150 });
}
// 🔧 a tap on a bumper, a sand trap or a pond fixes it, while the hole's repairs last
function fix(x, y) {
  if (!g || S.over) return false;
  const bi = g.bumpers.findIndex((b) => Math.hypot(b.x - x, b.y - y) < b.r + 8), si = g.sand.findIndex((s) => ((x - s.x) / (s.rx + 6)) ** 2 + ((y - s.y) / (s.ry + 6)) ** 2 < 1), wi = g.water.findIndex((w) => ((x - w.x) / (w.rx + 6)) ** 2 + ((y - w.y) / (w.ry + 6)) ** 2 < 1);
  if (bi < 0 && si < 0 && wi < 0) return false;
  if (g.fixes <= 0) { host.banner('🔧 NO REPAIRS LEFT', 'this hole is out of fixes'); sfx('buzz'); return true; }
  g.fixes -= 1; let what; host.cue?.('score', x, y);
  if (bi >= 0) { what = g.bumpers.splice(bi, 1)[0]; } else if (si >= 0) { what = g.sand.splice(si, 1)[0]; } else { what = g.water.splice(wi, 1)[0]; }
  g.fx.push({ kind: 'text', x: what.x, y: what.y - 16, text: `🔧 FIXED · ${g.fixes} left`, life: 1 }); for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 90; g.fx.push({ kind: 'dot', x: what.x, y: what.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, c: '#A8E08A', life: 0.6, r: 2 }); }
  sfx('clack'); g.par = parOf(); return true;
}
function shoo() { const gp = g.gopher; g.gopher = null; host.add(100); host.cue?.('score', gp.x, gp.y); g.fx.push({ kind: 'text', x: gp.x, y: gp.y - 16, text: 'SHOO! +100', life: 0.9 }); sfx('clack'); }
function pickUp() {
  S.combo = 0; sfx('buzz');
  const dead = host.hurt('picked up'); if (dead) return;
  host.banner('PICKED UP', `${PUTTS_OF()} putts on a par ${g.par} and no cup · ${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`);
  g.courseStrokes += PUTTS_OF() + 1;
  g.v = { x: 0, y: 0 }; g.ball = null; newCup();
}
function sink(c) {
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 3; host.cue?.('kill', c.x, c.y);
  const base = c.gold ? 500 : g.putts <= 1 ? 200 : 100, pts = base * fibMult(S.combo); host.add(pts); sunkN += 1;
  g.fx.push({ kind: 'text', x: c.x, y: c.y - 18, text: `${g.putts <= 1 ? 'ACE! ' : c.gold ? 'GOLDEN ' : ''}+${pts}`, life: 1.2, big: true, col: c.gold ? '#F5C542' : '#FFE08A' });
  for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; g.fx.push({ kind: 'dot', x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c: ['#F2C14E', '#fff', '#7FD3F7'][i % 3], life: 0.8, r: 2 }); }
  sfx('cup'); sfx('cheer', { delay: 0.15 });
  g.v = { x: 0, y: 0 }; g.ball = { x: c.x, y: c.y }; holeDone(Math.max(1, g.putts)); newCup();
}
function update(dt) {
  W = host?.W || W;   // 🎚️ the world widens with the stage
  g.time += dt;
  if (g.twist && g.time > g.twist.until) g.twist = null;
  if (g.guide > 0) g.guide -= dt;
  const b = g.ball; if (!b) { g.ball = tee(); return; }
  g.cups.forEach((c) => { if (c.big) c.big = Math.max(1, c.big - dt * 0.15); });
  const ice = g.twist?.kind === 'ice', wind = g.twist?.kind === 'wind' ? g.twist.wind : 0, ripple = g.twist?.kind === 'ripple';
  if (moving()) {
    const inSand = g.sand.some((s) => ((b.x - s.x) / s.rx) ** 2 + ((b.y - s.y) / s.ry) ** 2 < 1);
    const fr = ice ? 0.995 : inSand ? 0.93 : 0.975;   // more drag than Putt Post's green: a solo bite of golf, so the ball settles fast
    g.v.x = g.v.x * Math.pow(fr, dt * 60) + wind * dt; g.v.y *= Math.pow(fr, dt * 60);
    if (!ice && Math.hypot(g.v.x, g.v.y) < 40) { const k = Math.pow(0.9, dt * 60); g.v.x *= k; g.v.y *= k; }   // the last crawl dies quickly
    if (ripple) { g.v.x += Math.sin(g.time * 4 + b.y / 30) * 60 * dt; g.v.y += Math.cos(g.time * 3 + b.x / 30) * 60 * dt; }
    // 🌱 the fractal bumps of the green: a slope from two octaves of hash noise
    const sl = (x, y) => (hash(Math.floor(x / 60) * 131 + Math.floor(y / 60) * 7 + g.seed) - 0.5) * 30 + (hash(Math.floor(x / 22) * 17 + Math.floor(y / 22) * 3 + g.seed) - 0.5) * 12;
    g.v.x += (sl(b.x + 4, b.y) - sl(b.x - 4, b.y)) * dt * 6; g.v.y += (sl(b.x, b.y + 4) - sl(b.x, b.y - 4)) * dt * 6;
    if (!ice && !ripple && Math.hypot(g.v.x, g.v.y) < 6) { g.v.x = 0; g.v.y = 0; }   // at rest, the bumps can't set it creeping again
    b.x += g.v.x * dt; b.y += g.v.y * dt; trail.push({ x: b.x, y: b.y }); if (trail.length > 14) trail.shift();
    { const n = nearest(b.x, b.y), lim = g.pw / 2 - R; if (n.d > lim) { const nx = (b.x - n.x) / n.d, ny = (b.y - n.y) / n.d, dot = g.v.x * nx + g.v.y * ny; if (dot > 0) { g.v.x -= 2 * dot * nx; g.v.y -= 2 * dot * ny; g.v.x *= 0.8; g.v.y *= 0.8; sfx('clack'); } b.x = n.x + nx * lim; b.y = n.y + ny * lim; } }   // the fairway's edge: a bounce off the nearest wall
    g.bumpers.forEach((bp) => { const dx = b.x - bp.x, dy = b.y - bp.y, d = Math.hypot(dx, dy); if (d < bp.r + R) { const nx = dx / d, ny = dy / d, dot = g.v.x * nx + g.v.y * ny; g.v.x -= 2 * dot * nx; g.v.y -= 2 * dot * ny; g.v.x *= 1.15; g.v.y *= 1.15; b.x = bp.x + nx * (bp.r + R + 1); b.y = bp.y + ny * (bp.r + R + 1); bp.hit = 0.3; sfx('boing'); } });
    if (g.water.some((w) => ((b.x - w.x) / w.rx) ** 2 + ((b.y - w.y) / w.ry) ** 2 < 1)) { g.v = { x: 0, y: 0 }; sfx('plunk'); S.combo = 0; g.fx.push({ kind: 'text', x: b.x, y: b.y - 12, text: 'SPLASH · +1 putt', life: 1 }); g.putts += 1; Object.assign(b, tee()); }
    const cupR = (c) => CUP_R * (c.big || 1) * (g.twist?.kind === 'tiny' ? 0.5 : 1);
    const cup = g.cups.find((c) => Math.hypot(b.x - c.x, b.y - c.y) < cupR(c) && Math.hypot(g.v.x, g.v.y) < 260);
    if (cup) return sink(cup);
    if (!moving()) { g.v = { x: 0, y: 0 }; if (g.putts >= PUTTS_OF()) pickUp(); }
  }
  // 🐹 the gopher (Stage 2+): when the ball sits still it pops up, runs over and drags the ball off (+1 putt). Tap it to shoo it.
  { const st = host.stage?.() || 1;
    g.restT = !moving() && g.ball && !drag ? (g.restT || 0) + dt : 0;
    if (st >= 2 && !g.gopher && g.restT > 1.2) { g.gopherT = (g.gopherT ?? 3) - dt; if (g.gopherT <= 0) { g.gopherT = 8 - st * 1.5 + Math.random() * 4; const sp = spot(30); g.gopher = { x: sp.x, y: sp.y, t: 0, v: 40 + st * 20, grab: 0 }; g.fx.push({ kind: 'text', x: sp.x, y: sp.y - 20, text: '🐹 a gopher', life: 1 }); sfx('tick'); } }
    if (g.gopher) { const gp = g.gopher, b = g.ball; gp.t += dt;
      if (!b || moving()) g.gopher = null;
      else if (gp.grab > 0) { gp.grab -= dt; b.x += gp.dx * dt; b.y += gp.dy * dt; gp.x = b.x; gp.y = b.y; if (gp.grab <= 0) { g.gopher = null; const n = nearest(b.x, b.y), lim = g.pw / 2 - R; if (n.d > lim) { b.x = n.x + (b.x - n.x) / n.d * lim; b.y = n.y + (b.y - n.y) / n.d * lim; } } }
      else if (gp.t > 0.6) { const dx = b.x - gp.x, dy = b.y - gp.y, d = Math.hypot(dx, dy); if (d < 10) { gp.grab = 1.2; const a = Math.random() * 6.28; gp.dx = Math.cos(a) * 70; gp.dy = Math.sin(a) * 70; g.putts += 1; S.combo = 0; g.fx.push({ kind: 'text', x: b.x, y: b.y - 16, text: 'STOLEN · +1 putt', life: 1.1 }); sfx('buzz'); } else { gp.x += dx / d * gp.v * dt; gp.y += dy / d * gp.v * dt; } }
    }
  }
  if (!moving() && trail.length) trail.shift();   // the trail fades once the ball stops
  g.bumpers.forEach((bp) => { if (bp.hit > 0) bp.hit -= dt; });
  g.fx.forEach((f) => { f.life -= dt; if (f.kind === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; } else f.y -= 24 * dt; });
  g.fx = g.fx.filter((f) => f.life > 0);
}
// 🎨 HOLE THEMES: every hole is a place (looks only, the physics never changes). `THEMES[(g.hole - 1) % n]`, so they
// rotate as you play. A theme is colours plus four painters: `tex` (the ground's texture), `deco` (one decoration off
// the fairway), `amb` (a few animated bits each frame, under or over the ball) and the hazards' looks (`pond`, `sand`,
// `bump`). The ground, the decorations and the fairway are painted once a hole into an offscreen layer (`layer()`).
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let q = Math.imul(a ^ (a >>> 15), 1 | a); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
const oval = (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
const shade = (c, x, y, rx, ry = rx * 0.4, a = 0.25) => oval(c, x, y, rx, ry, `rgba(0,0,0,${a})`);
const specks = (c, r, W, Hh, n, cols, sz = 1.6) => { for (let i = 0; i < n; i++) { c.fillStyle = pick(r, cols); const s = sz * (0.5 + r()); c.fillRect(r() * (W + 120) - 60, r() * (Hh + 120) - 60, s, s); } };
function tree(c, x, y, s, dark, light) { shade(c, x + s * 0.35, y + s * 0.55, s * 1.05, s * 0.5, 0.28); circ(c, x, y, s, dark); circ(c, x - s * 0.28, y - s * 0.3, s * 0.62, light); circ(c, x + s * 0.35, y + s * 0.1, s * 0.45, light); circ(c, x - s * 0.4, y - s * 0.45, s * 0.2, '#ffffff30'); }
function tuft(c, x, y, col) { c.strokeStyle = col; c.lineWidth = 1.3; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(x + i * 2, y); c.lineTo(x + i * 3.5, y - 5 - (i === 0 ? 2 : 0)); } c.stroke(); }
function flowers(c, r, x, y) { for (let i = 0; i < 4; i++) { const fx = x + (r() - 0.5) * 16, fy = y + (r() - 0.5) * 10, col = pick(r, ['#FFEB3B', '#FF8A80', '#FFFFFF', '#CE93D8', '#80D8FF']); for (let p = 0; p < 5; p++) circ(c, fx + Math.cos(p * 1.26) * 2, fy + Math.sin(p * 1.26) * 2, 1.6, col); circ(c, fx, fy, 1.1, '#F9A825'); } }
function palm(c, x, y, s) {
  shade(c, x + s * 0.9, y + 2, s * 1.2, s * 0.35, 0.22);
  const tx = x + s * 0.45, ty = y - s * 1.7;
  c.strokeStyle = '#8D6E3F'; c.lineWidth = s * 0.26; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 0.15, y - s, tx, ty); c.stroke();
  c.strokeStyle = '#6D5230'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { const u = i / 6, px = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * (x - s * 0.15) + u * u * tx, py = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * (y - s) + u * u * ty; c.beginPath(); c.moveTo(px - s * 0.12, py); c.lineTo(px + s * 0.12, py + 1); c.stroke(); }
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.62 + (i > 2 ? 0.3 : -0.3), L = s * (1 + (i % 2) * 0.25), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.75 + s * 0.35;
    c.fillStyle = i % 2 ? '#2E9D4A' : '#3DBB5A'; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2 + Math.sin(a) * s * 0.3, (ty + ey) / 2 - s * 0.35, ex, ey); c.quadraticCurveTo((tx + ex) / 2, (ty + ey) / 2 - s * 0.05, tx, ty); c.fill(); }
  circ(c, tx - 2, ty + 3, 2.4, '#5D3A1A'); circ(c, tx + 2.5, ty + 3.5, 2.4, '#6D4422');
}
function cactus(c, x, y, s) {
  shade(c, x + s * 0.5, y + 1, s * 0.8, s * 0.25, 0.25);
  const body = (bx, by, w, h) => { c.fillStyle = '#3E8E41'; c.beginPath(); c.roundRect(bx - w / 2, by - h, w, h, w / 2); c.fill(); c.fillStyle = '#5DB760'; c.fillRect(bx - w * 0.15, by - h + w * 0.4, w * 0.18, h - w * 0.6); };
  body(x, y, s * 0.5, s * 1.7); body(x - s * 0.42, y - s * 0.55, s * 0.3, s * 0.75); body(x + s * 0.42, y - s * 0.8, s * 0.3, s * 0.65);
  c.fillStyle = '#3E8E41'; c.fillRect(x - s * 0.42, y - s * 0.7, s * 0.4, s * 0.22); c.fillRect(x, y - s * 0.95, s * 0.42, s * 0.22);
  circ(c, x, y - s * 1.7, s * 0.12, '#FF6FA0');
}
function mesa(c, r, x, y, s) { shade(c, x + 3, y + 2, s * 1.3, s * 0.35, 0.25); c.fillStyle = '#9C3F1E'; c.beginPath(); c.moveTo(x - s * 1.2, y); c.lineTo(x - s * 0.8, y - s * 0.9); c.lineTo(x + s * 0.7, y - s * (0.85 + r() * 0.2)); c.lineTo(x + s * 1.2, y); c.closePath(); c.fill(); c.fillStyle = '#C7623A'; c.beginPath(); c.moveTo(x - s * 0.8, y - s * 0.9); c.lineTo(x + s * 0.7, y - s * 0.9); c.lineTo(x + s * 0.6, y - s * 0.6); c.lineTo(x - s * 0.7, y - s * 0.6); c.closePath(); c.fill(); c.strokeStyle = '#7A2E14'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s, y - s * 0.3); c.lineTo(x + s, y - s * 0.3); c.stroke(); }
function pine(c, x, y, s) { shade(c, x + s * 0.4, y + 1, s * 0.9, s * 0.3, 0.18); c.fillStyle = '#6D4C2F'; c.fillRect(x - s * 0.1, y - s * 0.35, s * 0.2, s * 0.4); for (let i = 0; i < 3; i++) { const w = s * (0.85 - i * 0.2), by = y - s * 0.3 - i * s * 0.55; c.fillStyle = '#1F5E3B'; c.beginPath(); c.moveTo(x - w, by); c.lineTo(x, by - s * 0.8); c.lineTo(x + w, by); c.closePath(); c.fill(); c.fillStyle = '#F4FAFF'; c.beginPath(); c.moveTo(x - w * 0.55, by - s * 0.35); c.lineTo(x, by - s * 0.8); c.lineTo(x + w * 0.55, by - s * 0.35); c.quadraticCurveTo(x, by - s * 0.5, x - w * 0.55, by - s * 0.35); c.fill(); } }
function snowman(c, x, y) { shade(c, x + 3, y + 2, 9, 3, 0.15); circ(c, x, y - 6, 7, '#FFFFFF'); circ(c, x, y - 16, 5, '#FFFFFF'); circ(c, x - 1.8, y - 17, 0.9, '#222'); circ(c, x + 1.8, y - 17, 0.9, '#222'); c.fillStyle = '#FF8A3D'; c.beginPath(); c.moveTo(x, y - 15.5); c.lineTo(x + 5, y - 15); c.lineTo(x, y - 14.3); c.fill(); c.fillStyle = '#D84343'; c.fillRect(x - 5, y - 12, 10, 2); }
function lolly(c, r, x, y, s) { shade(c, x + 3, y + 1, s * 0.6, s * 0.2, 0.2); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 1.3); c.stroke(); const cy = y - s * 1.3 - s * 0.55, col = pick(r, ['#FF4F8B', '#7C4DFF', '#FFB300', '#00BFA5']); circ(c, x, cy, s * 0.6, '#FFFFFF'); c.strokeStyle = col; c.lineWidth = s * 0.16; c.beginPath(); for (let a = 0; a < 14; a += 0.3) { const rr = a / 14 * s * 0.55; c.lineTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.stroke(); circ(c, x - s * 0.2, cy - s * 0.25, s * 0.1, '#ffffffaa'); }
function cane(c, x, y, s) { shade(c, x + 2, y + 1, s * 0.4, s * 0.15, 0.2); const path = () => { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 1.4); c.arc(x + s * 0.3, y - s * 1.4, s * 0.3, Math.PI, 0); }; c.lineCap = 'round'; c.lineWidth = s * 0.22; c.strokeStyle = '#FFFFFF'; path(); c.stroke(); c.strokeStyle = '#E53950'; c.setLineDash([s * 0.18, s * 0.18]); path(); c.stroke(); c.setLineDash([]); }
function gumdrop(c, r, x, y, s) { const col = pick(r, ['#FF5C8A', '#FFC93C', '#7ED957', '#5BC0FF', '#B388FF']); shade(c, x + 2, y + 1, s, s * 0.3, 0.2); c.fillStyle = col; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s, y - s * 1.4, x, y - s * 1.3); c.quadraticCurveTo(x + s, y - s * 1.4, x + s, y); c.closePath(); c.fill(); for (let i = 0; i < 6; i++) circ(c, x + (r() - 0.5) * s * 1.3, y - r() * s, 0.8, '#ffffffcc'); }
function spikeRock(c, r, x, y, s) { shade(c, x + 3, y + 1, s, s * 0.3, 0.35); for (let i = 0; i < 3; i++) { const ox = (i - 1) * s * 0.5, h = s * (0.9 + r() * 0.8); c.fillStyle = i === 1 ? '#3A2E2E' : '#2A2020'; c.beginPath(); c.moveTo(x + ox - s * 0.4, y); c.lineTo(x + ox + (r() - 0.5) * 4, y - h); c.lineTo(x + ox + s * 0.4, y); c.closePath(); c.fill(); } c.strokeStyle = '#FF7A2A'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s * 0.3, y - 1); c.lineTo(x + s * 0.1, y - s * 0.5); c.stroke(); }
function cone(c, x, y, s) { shade(c, x + 4, y + 2, s * 1.4, s * 0.35, 0.35); c.fillStyle = '#3B2A26'; c.beginPath(); c.moveTo(x - s * 1.3, y); c.lineTo(x - s * 0.35, y - s * 1.2); c.lineTo(x + s * 0.35, y - s * 1.2); c.lineTo(x + s * 1.3, y); c.closePath(); c.fill(); c.fillStyle = '#FF6A1F'; c.beginPath(); c.ellipse(x, y - s * 1.2, s * 0.35, s * 0.12, 0, 0, 7); c.fill(); c.fillStyle = '#FF9A3D'; c.beginPath(); c.moveTo(x - s * 0.15, y - s * 1.2); c.lineTo(x - s * 0.3, y - s * 0.6); c.lineTo(x, y - s * 0.9); c.lineTo(x + s * 0.1, y - s * 0.4); c.lineTo(x + s * 0.15, y - s * 1.2); c.fill(); }
function crater(c, x, y, rr) { circ(c, x, y, rr + 1.5, '#ffffff22'); circ(c, x, y, rr, '#00000040'); c.fillStyle = '#00000038'; c.beginPath(); c.arc(x, y, rr, Math.PI * 1.05, Math.PI * 1.95); c.arc(x, y + rr * 0.35, rr * 0.9, Math.PI * 1.9, Math.PI * 1.1, true); c.fill(); }
function planet(c, r, x, y, s) { const col = pick(r, [['#FFB74D', '#E65100'], ['#81D4FA', '#0277BD'], ['#F48FB1', '#AD1457']]); const gr = c.createRadialGradient(x - s * 0.3, y - s * 0.3, 1, x, y, s); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); c.fillStyle = gr; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); c.strokeStyle = '#FFFFFFAA'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, s * 1.7, s * 0.45, -0.35, 0, 7); c.stroke(); }
function tower(c, x, y, s) { shade(c, x + s * 0.5, y + 2, s, s * 0.3, 0.3); c.fillStyle = '#8E8A85'; c.fillRect(x - s * 0.5, y - s * 1.6, s, s * 1.6); c.fillStyle = '#A9A49E'; c.fillRect(x - s * 0.5, y - s * 1.6, s * 0.35, s * 1.6); for (let i = 0; i < 3; i++) c.fillRect(x - s * 0.5 + i * s * 0.4, y - s * 1.85, s * 0.22, s * 0.28); c.fillStyle = '#3B2A1E'; c.beginPath(); c.roundRect(x - s * 0.18, y - s * 0.5, s * 0.36, s * 0.5, [s * 0.18, s * 0.18, 0, 0]); c.fill(); c.strokeStyle = '#5A5550'; c.lineWidth = 0.8; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x - s * 0.5, y - i * s * 0.32); c.lineTo(x + s * 0.5, y - i * s * 0.32); c.stroke(); } c.strokeStyle = '#444'; c.beginPath(); c.moveTo(x, y - s * 1.85); c.lineTo(x, y - s * 2.6); c.stroke(); c.fillStyle = '#D62839'; c.beginPath(); c.moveTo(x, y - s * 2.6); c.lineTo(x + s * 0.6, y - s * 2.45); c.lineTo(x, y - s * 2.3); c.fill(); }
function seaweed(c, r, x, y, s) { const col = pick(r, ['#2E8B57', '#3CB371', '#6B8E23']); c.strokeStyle = col; c.lineCap = 'round'; for (let j = 0; j < 3; j++) { c.lineWidth = 2.5 - j * 0.4; c.beginPath(); c.moveTo(x + (j - 1) * 3, y); for (let i = 1; i <= 6; i++) c.lineTo(x + (j - 1) * 3 + Math.sin(i * 1.1 + j) * 3, y - i * s * 0.28); c.stroke(); } }
function coral(c, r, x, y, s) { const col = pick(r, ['#FF6F61', '#FF8FB1', '#FFB347', '#C77DFF']); c.strokeStyle = col; c.lineCap = 'round'; const br = (bx, by, a, L, d) => { const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L; c.lineWidth = 1 + d * 1.1; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke(); if (d > 0) { br(ex, ey, a - 0.5, L * 0.7, d - 1); br(ex, ey, a + 0.45, L * 0.7, d - 1); } else circ(c, ex, ey, 1.4, col); }; br(x, y, -Math.PI / 2, s * 0.7, 3); }
function star5(c, x, y, rr, col) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr * 0.45 : rr; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }
const sparkle = (c, x, y, s, col) => { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); };
const bits = (n, f) => { for (let i = 0; i < n; i++) f(i, i * 2.399); };   // a cheap stable spread for the animated bits
const THEMES = [
  { key: 'meadow', icon: '🌳', name: 'SUNNY MEADOW', sub: 'a gentle green to warm up',
    bg: ['#3C7F33', '#2C6526'], fair: ['#62B84C', '#55A842'], fringe: '#3F8A33', tee: '#7CCB62', green: '#74C95C', flag: '#E4572E',
    rail: [[12, '#3E2716'], [8, '#8B5A2B'], [8, '#6B4320', [2, 22]]],
    tex: (c, r, W, Hh) => specks(c, r, W, Hh, 900, ['#4C9440', '#2F6A28', '#58A34A']),
    deco: (c, r, x, y) => { const q = r(); if (q < 0.4) tree(c, x, y, 9 + r() * 8, '#2E7D32', '#4CAF50'); else if (q < 0.65) flowers(c, r, x, y); else if (q < 0.85) tree(c, x, y, 5 + r() * 2, '#33691E', '#689F38'); else tuft(c, x, y, '#8BC34A'); },
    pond: 'water', sand: ['#EBD38E', '#C9A85C'], bump: { c: ['#FF8A65', '#E4572E', '#7A2A14'] },
    amb: (c, ts, W, Hh, front) => { if (!front) return; bits(5, (i, ph) => { const x = (W * (0.15 + 0.7 * ((ph * 0.37) % 1)) + Math.sin(ts * 0.5 + ph) * 40), y = Hh * (0.15 + 0.7 * ((ph * 0.61) % 1)) + Math.cos(ts * 0.7 + ph) * 30, f = Math.abs(Math.sin(ts * 9 + ph)) * 3 + 1; c.fillStyle = ['#FFEB3B', '#FFFFFF', '#FF80AB'][i % 3]; c.beginPath(); c.ellipse(x - f / 2, y, f, 2.6, 0.3, 0, 7); c.ellipse(x + f / 2, y, f, 2.6, -0.3, 0, 7); c.fill(); }); } },
  { key: 'tropic', icon: '🌴', name: 'PALM ISLAND', sub: 'sand, sea and coconuts',
    bg: ['#29B6D8', '#137FB0'], island: ['#7FDDEA', '#F2D896'], fair: ['#4FC46A', '#45B45F'], fringe: '#36974F', tee: '#6FD685', green: '#66D07E', flag: '#FF5FA2',
    rail: [[12, '#6E5124'], [8, '#D9B866'], [8, '#7A5A2A', [1.5, 13]]],
    tex: (c, r, W, Hh) => { c.strokeStyle = '#FFFFFF40'; c.lineWidth = 1.2; for (let i = 0; i < 70; i++) { const x = r() * (W + 100) - 50, y = r() * (Hh + 100) - 50; c.beginPath(); c.arc(x, y, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } },
    near: 46, decoN: 22,
    deco: (c, r, x, y) => { const q = r(); if (q < 0.5) palm(c, x, y, 9 + r() * 5); else if (q < 0.75) star5(c, x, y, 3.5, pick(r, ['#FF8A65', '#FFB74D'])); else { oval(c, x, y, 3.5, 2.5, '#FFF3E0'); oval(c, x, y, 2, 1.4, '#FFCCBC'); } },
    pond: 'water', sand: ['#FFE7A8', '#D9B76A'], bump: { c: ['#B0794A', '#7B4B2A', '#3E2414'], kind: 'coco' },
    amb: (c, ts, W, Hh, front) => { if (front) return; c.fillStyle = '#FFFFFFAA'; bits(14, (i, ph) => { const x = ((ph * 97) % 1) * W, y = ((ph * 0.731) % 1) * Hh, a = Math.max(0, Math.sin(ts * 1.6 + ph * 3)); if (a > 0.2) { c.globalAlpha = a; c.fillRect(x, y, 6, 1.4); c.globalAlpha = 1; } }); } },
  { key: 'desert', icon: '🏜️', name: 'CACTUS CANYON', sub: "don't hug the cacti",
    bg: ['#E08A4E', '#BC6534'], fair: ['#A6C05A', '#97B14D'], fringe: '#7E9440', tee: '#BBD472', green: '#B4CD68', flag: '#2E86DE',
    rail: [[12, '#6E2E16'], [8, '#B5562E'], [8, '#8E3A1C', [5, 9]]],
    tex: (c, r, W, Hh) => { c.strokeStyle = '#FFFFFF1A'; c.lineWidth = 2; for (let y = -40; y < Hh + 60; y += 26) { c.beginPath(); for (let x = -60; x < W + 60; x += 20) c.lineTo(x, y + Math.sin(x / 50 + y) * 5); c.stroke(); } specks(c, r, W, Hh, 500, ['#A9542A', '#F0A86E', '#8C4422'], 2.2); },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.45) cactus(c, x, y, 8 + r() * 5); else if (q < 0.7) mesa(c, r, x, y, 10 + r() * 8); else { circ(c, x, y, 2.5, '#8C4422'); circ(c, x + 4, y + 1, 1.6, '#A9542A'); } },
    pond: 'water', sand: ['#F7C982', '#C98A44'], bump: { c: ['#FFB27A', '#D9622B', '#6E2E16'], kind: 'spikes' },
    amb: (c, ts, W, Hh, front) => { if (!front) return; const x = ((ts * 30) % (W + 80)) - 40, y = Hh * 0.3 + Math.abs(Math.sin(ts * 3)) * -8; c.strokeStyle = '#8D6E3FCC'; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 9; i++) { const a = ts * 4 + i * 2.1; c.moveTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); c.lineTo(x + Math.cos(a + 2.4) * 5, y + Math.sin(a + 2.4) * 5); } c.stroke(); } },
  { key: 'ice', icon: '❄️', name: 'FROSTY FAIRWAY', sub: 'brrr! mind the frozen pond',
    bg: ['#EEF6FC', '#CFE2F0'], fair: ['#9FD9C2', '#8FCDB4'], fringe: '#78BBA2', tee: '#BDEBD8', green: '#B2E6D2', flag: '#1E88E5',
    rail: [[16, '#B9D6E6'], [12, '#FFFFFF'], [6, '#E3F1F9']],
    tex: (c, r, W, Hh) => { specks(c, r, W, Hh, 400, ['#FFFFFF', '#BFD8EA', '#DDEBF6'], 2); c.strokeStyle = '#B5CDE0'; c.lineWidth = 1; for (let i = 0; i < 30; i++) { const x = r() * W, y = r() * Hh; c.beginPath(); c.arc(x, y, 10 + r() * 14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.6) pine(c, x, y, 7 + r() * 5); else if (q < 0.72) snowman(c, x, y); else { oval(c, x, y, 6, 3.5, '#9AAAB8'); oval(c, x, y - 1.5, 5, 2.2, '#FFFFFF'); } },
    pond: 'ice', sand: ['#FFFFFF', '#A9C7DC'], bump: { c: ['#E1F5FE', '#81D4FA', '#2B6C99'], kind: 'ice' },
    amb: (c, ts, W, Hh, front) => { if (!front) return; c.fillStyle = '#FFFFFF'; bits(26, (i, ph) => { const x = (((ph * 0.37) % 1) * W + Math.sin(ts + ph) * 14 + ts * 6) % W, y = (((ph * 0.53) % 1) * Hh + ts * (18 + (i % 4) * 7)) % Hh; c.globalAlpha = 0.85; c.beginPath(); c.arc(x, y, 1 + (i % 3) * 0.6, 0, 7); c.fill(); }); c.globalAlpha = 1; } },
  { key: 'candy', icon: '🍬', name: 'CANDY LAND', sub: 'sweet shots only',
    bg: ['#FFC6DF', '#F7A3C8'], fair: ['#95E6C4', '#80DAB4'], fringe: '#5FC49A', tee: '#B5F0D6', green: '#A8EFD0', flag: '#7C4DFF',
    rail: [[12, '#C2185B'], [9, '#FFFFFF'], [9, '#E8344E', [9, 9]]],
    tex: (c, r, W, Hh) => { for (let i = 0; i < 260; i++) { c.save(); c.translate(r() * (W + 100) - 50, r() * (Hh + 100) - 50); c.rotate(r() * 3.14); c.fillStyle = pick(r, ['#FFFFFF', '#FFEB3B', '#7C4DFF', '#00BFA5', '#FF5252', '#40C4FF']); c.fillRect(-2.5, -0.8, 5, 1.6); c.restore(); } },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.4) lolly(c, r, x, y, 7 + r() * 4); else if (q < 0.65) cane(c, x, y, 8 + r() * 4); else gumdrop(c, r, x, y, 4 + r() * 3); },
    pond: 'choc', sand: ['#FFF0F7', '#FF8FC2'], bump: { c: ['#FFE082', '#FF7043', '#8E2D12'], kind: 'gum' },
    amb: (c, ts, W, Hh, front) => { if (!front) return; bits(12, (i, ph) => { const a = Math.max(0, Math.sin(ts * 2 + ph * 4)); if (a < 0.3) return; c.globalAlpha = a; sparkle(c, ((ph * 0.41) % 1) * W, ((ph * 0.67) % 1) * Hh, 3 + a * 2, '#FFFFFF'); }); c.globalAlpha = 1; } },
  { key: 'lava', icon: '🌋', name: 'LAVA LINKS', sub: 'the floor is lava (some of it)',
    bg: ['#2E2222', '#191010'], fair: ['#6E9A3E', '#618B34'], fringe: '#46692A', tee: '#86B353', green: '#7FAE4B', flag: '#FFC107',
    rail: [[18, '#FF6A1F38'], [11, '#1C1414'], [11, '#FF7A2A', [2, 16]]],
    tex: (c, r, W, Hh) => { specks(c, r, W, Hh, 500, ['#3E3030', '#120A0A', '#4A3434'], 2.4); c.save(); c.shadowColor = '#FF5A1F'; c.shadowBlur = 8; c.strokeStyle = '#FF7A2A'; c.lineWidth = 1.4; for (let i = 0; i < 14; i++) { let x = r() * W, y = r() * Hh; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; c.lineTo(x, y); } c.stroke(); } c.restore(); },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.18) cone(c, x, y, 12 + r() * 6); else if (q < 0.7) spikeRock(c, r, x, y, 6 + r() * 5); else circ(c, x, y, 2 + r() * 2, '#120A0A'); },
    pond: 'lava', sand: ['#8F8A86', '#4E4A47'], bump: { c: ['#6A5A55', '#3A2E2B', '#120A0A'], kind: 'magma' },
    amb: (c, ts, W, Hh, front) => { if (!front) return; bits(22, (i, ph) => { const life = ((ts * 0.25 + ph) % 1), x = ((ph * 0.37) % 1) * W + Math.sin(ts * 2 + ph) * 8, y = Hh * (1.02 - life * 1.1); c.globalAlpha = (1 - life) * 0.9; circ(c, x, y, 1.4, i % 3 ? '#FF9A3D' : '#FFD54F'); }); c.globalAlpha = 1; } },
  { key: 'space', icon: '🚀', name: 'MOON GOLF', sub: 'one small putt for Fig',
    bg: ['#15123A', '#07061A'], fair: ['#6A5FE0', '#5C51CC'], fringe: '#3F37A0', tee: '#8A80F0', green: '#8279EE', flag: '#00E5FF',
    rail: [[12, '#3D4558'], [8, '#C8D0E0'], [11, '#FFD24A', [2, 18]]],
    tex: (c, r, W, Hh) => { for (let i = 0; i < 220; i++) { const s = r() < 0.9 ? 0.8 : 1.6; c.fillStyle = r() < 0.15 ? '#B3E5FC' : '#FFFFFF'; c.globalAlpha = 0.4 + r() * 0.6; c.fillRect(r() * (W + 100) - 50, r() * (Hh + 100) - 50, s, s); } c.globalAlpha = 1; c.fillStyle = '#9E9AAE'; for (let i = 0; i < 3; i++) { const x = r() * W, y = r() * Hh, rr = 50 + r() * 40; c.globalAlpha = 0.08; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); } c.globalAlpha = 1; },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.55) crater(c, x, y, 4 + r() * 8); else if (q < 0.7) planet(c, r, x, y, 5 + r() * 4); else { circ(c, x, y, 3, '#7E7A8E'); circ(c, x - 1, y - 1, 1.5, '#A9A5BA'); } },
    pond: 'void', sand: ['#C3BDD3', '#8C86A0'], bump: { c: ['#B3E5FC', '#4FC3F7', '#01579B'], kind: 'planet' },
    amb: (c, ts, W, Hh, front) => { if (front) { const ph = Math.floor(ts / 4), u = (ts % 4) / 0.8; if (u < 1) { const x0 = hash(ph) * W, y0 = hash(ph + 7) * Hh * 0.5; c.strokeStyle = `rgba(255,255,255,${1 - u})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + u * 120, y0 + u * 60); c.lineTo(x0 + u * 120 - 30, y0 + u * 60 - 15); c.stroke(); } return; } bits(16, (i, ph) => { const a = Math.max(0, Math.sin(ts * 3 + ph * 5)); c.globalAlpha = a; sparkle(c, ((ph * 0.29) % 1) * W, ((ph * 0.83) % 1) * Hh, 2.5, '#FFFFFF'); }); c.globalAlpha = 1; } },
  { key: 'castle', icon: '🏰', name: 'CASTLE GREENS', sub: 'putt for the crown',
    bg: ['#4F7D3E', '#3B6430'], fair: ['#5FAE4A', '#52A03F'], fringe: '#3C7D2E', tee: '#77C35F', green: '#70BE58', flag: '#FFD600',
    rail: [[13, '#5A5652'], [9, '#A7A29C'], [13, '#5A5652', [1.5, 10]]],
    tex: (c, r, W, Hh) => { specks(c, r, W, Hh, 600, ['#5C8C48', '#33582A', '#6B9A55']); for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * Hh; oval(c, x, y, 4 + r() * 3, 2.5 + r() * 2, '#8F8A84'); oval(c, x - 1, y - 1, 2.5, 1.4, '#B3AEA7'); } },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.25) tower(c, x, y, 9 + r() * 4); else if (q < 0.65) tree(c, x, y, 6 + r() * 4, '#2F6B27', '#4E9A3C'); else flowers(c, r, x, y); },
    pond: 'moat', sand: ['#E2CC8E', '#B3995A'], bump: { c: ['#E0C27A', '#A57A3A', '#4A3216'], kind: 'barrel' },
    amb: (c, ts, W, Hh, front) => { if (!front) return; const n = 9; c.strokeStyle = '#5A3A1E'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= n; i++) c.lineTo(W * i / n, 34 + Math.sin(i / n * Math.PI) * 12); c.stroke(); for (let i = 0; i < n; i++) { const x = W * (i + 0.5) / n, y = 34 + Math.sin((i + 0.5) / n * Math.PI) * 12, sw = Math.sin(ts * 3 + i) * 3; c.fillStyle = ['#D62839', '#FFD600', '#1E88E5'][i % 3]; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + sw, y + 12); c.closePath(); c.fill(); } } },
  { key: 'reef', icon: '🐠', name: 'CORAL REEF', sub: 'bubbles up!',
    bg: ['#137BAE', '#07466E'], fair: ['#3FC1AE', '#36B09F'], fringe: '#2A8C80', tee: '#5FD6C4', green: '#5ACFBD', flag: '#FF7043',
    rail: [[12, '#9C3B2F'], [8, '#F28C6B'], [8, '#FFC1A8', [3, 7]]],
    tex: (c, r, W, Hh) => { c.fillStyle = '#FFFFFF10'; for (let i = 0; i < 5; i++) { const x = r() * W; c.beginPath(); c.moveTo(x - 20, -60); c.lineTo(x + 30, -60); c.lineTo(x + 100, Hh + 60); c.lineTo(x + 40, Hh + 60); c.closePath(); c.fill(); } specks(c, r, W, Hh, 300, ['#E9D9A655', '#FFFFFF22', '#0A3A5A'], 2); },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.4) seaweed(c, r, x, y, 10 + r() * 6); else if (q < 0.75) coral(c, r, x, y, 9 + r() * 5); else star5(c, x, y, 4, pick(r, ['#FF7043', '#FFCA28', '#F06292'])); },
    pond: 'deep', sand: ['#EEDFAE', '#BFA56A'], bump: { c: ['#FFE082', '#FFA726', '#8D4A00'], kind: 'spikes' },
    amb: (c, ts, W, Hh, front) => { if (!front) return; c.strokeStyle = '#FFFFFFAA'; c.lineWidth = 1; bits(18, (i, ph) => { const life = ((ts * 0.18 + ph) % 1), x = ((ph * 0.43) % 1) * W + Math.sin(ts * 2 + ph * 3) * 5, y = Hh * (1.05 - life * 1.15); c.beginPath(); c.arc(x, y, 1.5 + (i % 3), 0, 7); c.stroke(); }); } },
];
const themeOf = () => THEMES[(((g?.hole || 1) - 1) % THEMES.length + THEMES.length) % THEMES.length];
// the static layer: ground, texture, decorations, the fairway's shadow, rails, fringe, mown stripes and the tee, in world units
// (PAD past the field so a widening stage has ground under it), rebuilt when the hole, the path or the size changes
const PAD = 60; let LY = null, FW = null, trail = [];
const wayOn = (c) => { c.beginPath(); g.path.forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p.x, p.y)); };
const strokeWay = (c, w, col, dash) => { c.strokeStyle = col; c.lineWidth = w; if (dash) c.setLineDash(dash); wayOn(c); c.stroke(); if (dash) c.setLineDash([]); };
function layer(th, k, Hh) {
  const s = Math.max(0.5, Math.min(k, 2600 / (W + 2 * PAD), 2600 / (Hh + 2 * PAD)));
  const sig = `${g.hole}|${th.key}|${g.pw}|${g.path.map((p) => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(';')}`, q = `${Math.round(W / 4)}|${Math.round(Hh / 4)}|${Math.round(s * 20)}`, now = performance.now();
  if (LY && LY.sig === sig && (LY.q === q || now - LY.at < 400)) return LY;
  const cw = Math.ceil((W + 2 * PAD) * s), ch = Math.ceil((Hh + 2 * PAD) * s);
  const cv = LY && LY.cv.width === cw && LY.cv.height === ch ? LY.cv : Object.assign(document.createElement('canvas'), { width: cw, height: ch });
  if (!FW || FW.width !== cw || FW.height !== ch) FW = Object.assign(document.createElement('canvas'), { width: cw, height: ch });
  const c = cv.getContext('2d'), r = rng((g.seed ^ Math.imul(g.hole, 2654435761)) >>> 0);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cw, ch); c.setTransform(s, 0, 0, s, PAD * s, PAD * s); c.lineCap = 'round'; c.lineJoin = 'round';
  const gr = c.createLinearGradient(0, -PAD, 0, Hh + PAD); gr.addColorStop(0, th.bg[0]); gr.addColorStop(1, th.bg[1]); c.fillStyle = gr; c.fillRect(-PAD, -PAD, W + 2 * PAD, Hh + 2 * PAD);
  th.tex(c, r, W, Hh);
  if (th.island) { strokeWay(c, g.pw + 2 * th.near + 34, th.island[0]); strokeWay(c, g.pw + 2 * th.near + 14, th.island[1]); }
  // the fairway's drop shadow and its rails (outermost stroke first)
  c.save(); c.translate(2, 4); strokeWay(c, g.pw + th.rail[0][0] + 4, 'rgba(0,0,0,0.28)'); c.restore();
  th.rail.forEach(([w, col, dash]) => strokeWay(c, g.pw + w, col, dash));
  // the fairway itself on its own canvas: mown stripes clipped to the band, the fringe slipped in under it
  const f = FW.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, cw, ch); f.setTransform(s, 0, 0, s, PAD * s, PAD * s); f.lineCap = 'round'; f.lineJoin = 'round';
  strokeWay(f, g.pw - 7, th.fair[0]);
  f.globalCompositeOperation = 'source-atop';
  const a0 = Math.atan2(g.path[1].y - g.path[0].y, g.path[1].x - g.path[0].x) + Math.PI / 2;
  f.save(); f.translate(W / 2, Hh / 2); f.rotate(a0); f.fillStyle = th.fair[1]; for (let x = -1400; x < 1400; x += 32) f.fillRect(x, -1400, 16, 2800); f.restore();
  for (let i = 0; i < 500; i++) { f.fillStyle = i % 2 ? '#ffffff12' : '#00000010'; f.fillRect(r() * W, r() * Hh, 1.4, 1.4); }
  f.globalCompositeOperation = 'destination-over'; strokeWay(f, g.pw, th.fringe);
  f.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(FW, 0, 0); c.restore();
  // the tee box, squared to the first leg
  { const p = g.path[0], q2 = g.path[1], a = Math.atan2(q2.y - p.y, q2.x - p.x); c.save(); c.translate(p.x, p.y); c.rotate(a); c.fillStyle = th.tee; c.beginPath(); c.roundRect(-14, -Math.min(18, g.pw / 2 - 4), 26, Math.min(36, g.pw - 8), 5); c.fill(); c.strokeStyle = '#ffffff55'; c.lineWidth = 1; c.stroke(); circ(c, 2, -Math.min(14, g.pw / 2 - 7), 2.4, '#FFFFFF'); circ(c, 2, Math.min(14, g.pw / 2 - 7), 2.4, '#FFFFFF'); c.restore(); }
  // decorations off the fairway (on the island's beach for the tropics), back to front
  const lo = g.pw / 2 + 16, hi = th.near ? g.pw / 2 + th.near : 1e9, ds = [];
  for (let i = 0; i < 400 && ds.length < (th.decoN || 30); i++) { const x = r() * (W + 20) - 10, y = 20 + r() * (Hh - 30), d = nearest(x, y).d; if (d < lo || d > hi || ds.some((o) => Math.hypot(o.x - x, o.y - y) < 24)) continue; ds.push({ x, y, k: r() }); }
  ds.sort((a, b) => a.y - b.y).forEach((o) => { const rr = rng(Math.floor(o.k * 1e9)); c.save(); th.deco(c, rr, o.x, o.y); c.restore(); });
  // a gentle vignette so the field's edges sit back
  const vg = c.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.35, W / 2, Hh / 2, Math.hypot(W, Hh) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.28)'); c.fillStyle = vg; c.fillRect(-PAD, -PAD, W + 2 * PAD, Hh + 2 * PAD);
  LY = { cv, s, sig, q, at: now };
  return LY;
}
// the hazards, every frame (they come and go with the beats): a pond in the theme's liquid, a trap of grains, a glossy bumper
function drawPond(w, kind, ts) {
  const { x, y, rx, ry } = w, sd = Math.floor(x * 7 + y * 13);
  const bank = { water: '#D9C68C', moat: '#7E7A74', lava: '#2A1A14', ice: '#FFFFFF', void: '#3A2A6A', choc: '#FFF0F7', deep: '#E9D9A6' }[kind] || '#D9C68C';
  oval(ctx, x + 1, y + 3, rx + 4, ry + 4, 'rgba(0,0,0,0.25)'); oval(ctx, x, y, rx + 3.5, ry + 3.5, bank);
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.clip();
  const lin = (a, b) => { const gr = ctx.createLinearGradient(x, y - ry, x, y + ry); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  const rad = (a, b) => { const gr = ctx.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry)); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  if (kind === 'lava') {
    ctx.fillStyle = lin('#FFC24A', '#D8340F'); ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    for (let i = 0; i < 4; i++) { const px = x + Math.sin(ts * 0.6 + i * 1.7 + sd) * rx * 0.6, py = y + Math.cos(ts * 0.5 + i * 2.3) * ry * 0.5; oval(ctx, px, py, rx * 0.28, ry * 0.22, '#7A1E0A99'); }
    const u = (ts * 0.8 + sd * 0.01) % 1; ctx.strokeStyle = `rgba(255,240,180,${1 - u})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + Math.sin(sd) * rx * 0.4, y + Math.cos(sd) * ry * 0.3, 1 + u * 5, 0, 7); ctx.stroke();
  } else if (kind === 'ice') {
    ctx.fillStyle = lin('#F4FCFF', '#9ED3EC'); ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    ctx.strokeStyle = '#FFFFFFCC'; ctx.lineWidth = 0.9; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = hash(sd + i) * 6.28; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * rx * 0.5, y + Math.sin(a) * ry * 0.5); ctx.lineTo(x + Math.cos(a + 0.4) * rx, y + Math.sin(a + 0.4) * ry); } ctx.stroke();
    const gx = x - rx + ((ts * 0.5) % 1.6) * rx * 2; ctx.fillStyle = '#FFFFFF88'; ctx.beginPath(); ctx.moveTo(gx, y - ry); ctx.lineTo(gx + 6, y - ry); ctx.lineTo(gx - 4, y + ry); ctx.lineTo(gx - 10, y + ry); ctx.fill();
  } else if (kind === 'void' || kind === 'deep') {
    ctx.fillStyle = kind === 'void' ? rad('#000000', '#6A3BC8') : rad('#04203A', '#2A86B8'); ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    ctx.strokeStyle = kind === 'void' ? '#C9A6FFAA' : '#FFFFFF77'; ctx.lineWidth = 1.3;
    for (let j = 0; j < 3; j++) { ctx.beginPath(); for (let a = 0; a < 5; a += 0.25) { const q = 1 - a / 5, ang = a + ts * (kind === 'void' ? 1.8 : -1.2) + j * 2.09; ctx.lineTo(x + Math.cos(ang) * rx * q, y + Math.sin(ang) * ry * q); } ctx.stroke(); }
    if (kind === 'void') bits(5, (i, ph) => { circ(ctx, x + Math.cos(ph + ts) * rx * 0.7, y + Math.sin(ph + ts) * ry * 0.7, 0.8, '#FFFFFF'); });
  } else {
    const [a, b] = kind === 'choc' ? ['#9A6440', '#4A2A18'] : kind === 'moat' ? ['#3E7FA8', '#1D4A6A'] : ['#6FD3F7', '#1F86C2'];
    ctx.fillStyle = lin(a, b); ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    ctx.strokeStyle = kind === 'choc' ? '#C48A64AA' : '#FFFFFFAA'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { const ph = ts * 1.5 + i * 2.1 + sd, ox = Math.sin(ph) * rx * 0.35, oy = (i - 1) * ry * 0.45; ctx.beginPath(); ctx.ellipse(x + ox, y + oy, rx * 0.32, ry * 0.18, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    if (kind === 'choc') { ctx.strokeStyle = '#E6B38E88'; ctx.beginPath(); for (let a = 0; a < 9; a += 0.3) ctx.lineTo(x + Math.cos(a + ts) * a / 9 * rx * 0.6, y + Math.sin(a + ts) * a / 9 * ry * 0.6); ctx.stroke(); }
  }
  ctx.restore();
  ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
}
function drawSand(s, th) {
  const [base, grain] = th.sand, sd = Math.floor(s.x * 3 + s.y * 5);
  oval(ctx, s.x, s.y + 1.5, s.rx + 2, s.ry + 2, 'rgba(0,0,0,0.18)');
  const gr = ctx.createRadialGradient(s.x - s.rx * 0.3, s.y - s.ry * 0.4, 1, s.x, s.y, s.rx); gr.addColorStop(0, '#ffffff55'); gr.addColorStop(0.4, base); gr.addColorStop(1, grain); ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, 7); ctx.fill(); ctx.fillStyle = gr; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.clip();
  ctx.strokeStyle = grain; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(s.x, s.y + i * s.ry * 0.38, s.rx * 0.8, s.ry * 0.3, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
  ctx.globalAlpha = 0.8; for (let i = 0; i < 26; i++) { const a = hash(sd + i) * 6.28, q = Math.sqrt(hash(sd + i * 7 + 3)); ctx.fillStyle = th.key === 'candy' ? ['#FF5252', '#7C4DFF', '#00BFA5', '#FFEB3B'][i % 4] : i % 2 ? grain : '#FFFFFF'; ctx.fillRect(s.x + Math.cos(a) * s.rx * q, s.y + Math.sin(a) * s.ry * q, 1.2, 1.2); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function drawBumper(b, th, ts) {
  const [li, mid, dk] = th.bump.c, kind = th.bump.kind, r = b.r;
  oval(ctx, b.x + 2, b.y + 3.5, r * 1.05, r * 0.8, 'rgba(0,0,0,0.3)');
  if (b.hit > 0) circ(ctx, b.x, b.y, r + 3 + b.hit * 14, `rgba(255,224,138,${b.hit * 1.6})`);
  if (kind === 'spikes') { ctx.fillStyle = dk; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + (b.x % 1); ctx.moveTo(b.x + Math.cos(a - 0.18) * r * 0.9, b.y + Math.sin(a - 0.18) * r * 0.9); ctx.lineTo(b.x + Math.cos(a) * (r + 3.5), b.y + Math.sin(a) * (r + 3.5)); ctx.lineTo(b.x + Math.cos(a + 0.18) * r * 0.9, b.y + Math.sin(a + 0.18) * r * 0.9); } ctx.fill(); }
  const gr = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.1, b.x, b.y, r); gr.addColorStop(0, b.hit > 0 ? '#FFF8D0' : li); gr.addColorStop(0.55, b.hit > 0 ? '#FFE08A' : mid); gr.addColorStop(1, dk);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = 1.6; ctx.stroke();
  if (kind === 'barrel') { ctx.strokeStyle = '#3A3A3A'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.62, 0, 7); ctx.stroke(); }
  else if (kind === 'magma') { ctx.strokeStyle = `rgba(255,${120 + Math.sin(ts * 4 + b.x) * 60},40,0.95)`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b.x - r * 0.6, b.y - r * 0.1); ctx.lineTo(b.x - r * 0.1, b.y + r * 0.2); ctx.lineTo(b.x + r * 0.2, b.y - r * 0.4); ctx.moveTo(b.x - r * 0.1, b.y + r * 0.2); ctx.lineTo(b.x + r * 0.1, b.y + r * 0.7); ctx.stroke(); }
  else if (kind === 'planet') { ctx.strokeStyle = '#FFFFFFCC'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(b.x, b.y, r * 1.6, r * 0.42, -0.4, 0, 7); ctx.stroke(); }
  else if (kind === 'gum') { for (let i = 0; i < 6; i++) circ(ctx, b.x + Math.cos(i * 1.05) * r * 0.55, b.y + Math.sin(i * 1.05) * r * 0.55, 0.9, '#FFFFFFCC'); }
  else if (kind === 'coco') { ctx.strokeStyle = '#2A1608'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * 0.8; ctx.moveTo(b.x + Math.cos(a) * r * 0.5, b.y + Math.sin(a) * r * 0.5); ctx.lineTo(b.x + Math.cos(a + 0.3) * r * 0.85, b.y + Math.sin(a + 0.3) * r * 0.85); } ctx.stroke(); circ(ctx, b.x - 2, b.y + 1, 1.2, '#2A1608'); circ(ctx, b.x + 2, b.y + 1, 1.2, '#2A1608'); }
  else if (kind === 'ice') { ctx.strokeStyle = '#FFFFFFAA'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(b.x + Math.cos(a) * r * 0.6, b.y + Math.sin(a) * r * 0.6); ctx.lineTo(b.x - Math.cos(a) * r * 0.6, b.y - Math.sin(a) * r * 0.6); } ctx.stroke(); }
  oval(ctx, b.x - r * 0.35, b.y - r * 0.45, r * 0.35, r * 0.2, '#ffffffaa');
}
// the cup: an apron of green, the hole with its shadow and a white lip; the flag (drawn over the ball) waves in the breeze
function drawCup(c, r, th) {
  circ(ctx, c.x, c.y, r + 10, th.green + '99'); circ(ctx, c.x, c.y, r + 5, th.green);
  const gr = ctx.createRadialGradient(c.x, c.y + r * 0.35, r * 0.1, c.x, c.y, r); gr.addColorStop(0, '#000000'); gr.addColorStop(1, '#1C2A1C');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#00000066'; ctx.beginPath(); ctx.arc(c.x, c.y, r, Math.PI, 0); ctx.arc(c.x, c.y + r * 0.3, r * 0.92, 0, Math.PI, true); ctx.fill();
  ctx.strokeStyle = c.gold ? '#F5C542' : '#FFFFFFCC'; ctx.lineWidth = c.gold ? 3 : 1.6; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 7); ctx.stroke();
}
function drawFlag(c, th, ts) {
  const top = c.y - 36, col = c.gold ? '#F5C542' : th.flag;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + 16, c.y + 7); ctx.stroke();
  ctx.strokeStyle = '#F4F4F4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, top); ctx.stroke(); circ(ctx, c.x, top, 1.8, '#FFD54F');
  const wv = (u) => Math.sin(ts * 6 - u * 0.35) * 2.4 * (u / 18);
  ctx.fillStyle = col; ctx.beginPath(); for (let u = 0; u <= 18; u += 3) ctx.lineTo(c.x + u, top + 1 + wv(u) + u * 0.12); for (let u = 18; u >= 0; u -= 3) ctx.lineTo(c.x + u, top + 12 + wv(u) - u * 0.12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff40'; ctx.beginPath(); for (let u = 0; u <= 18; u += 3) ctx.lineTo(c.x + u, top + 1 + wv(u) + u * 0.12); for (let u = 18; u >= 0; u -= 3) ctx.lineTo(c.x + u, top + 5 + wv(u)); ctx.closePath(); ctx.fill();
}
function draw(t) {
  W = host?.W || W;
  const k = host.k, Hh = H(), th = themeOf(), ts = t / 1000;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = th.bg[1]; ctx.fillRect(0, 0, host.cv.width, host.cv.height);   // the margins in the hole's own ground
  ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0);
  if (!g) return;
  // the ground, decorations and the fairway, painted once a hole
  const L = layer(th, k, Hh); ctx.drawImage(L.cv, -PAD, -PAD, L.cv.width / L.s, L.cv.height / L.s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save();
  th.amb(ctx, ts, W, Hh, false);
  g.sand.forEach((s) => drawSand(s, th));
  g.water.forEach((w) => drawPond(w, th.pond, ts));
  g.bumpers.forEach((b) => drawBumper(b, th, ts));
  const cupR = (c) => CUP_R * (c.big || 1) * (g.twist?.kind === 'tiny' ? 0.5 : 1);
  g.cups.forEach((c) => drawCup(c, cupR(c), th));
  const b = g.ball;
  if (b) {
    if (g.guide > 0 && g.cups[0]) { ctx.strokeStyle = '#FFE08Acc'; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -ts * 20; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(g.cups[0].x, g.cups[0].y); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; }
    // the rolling trail: a fading streak behind the ball
    if (trail.length > 1) { for (let i = 1; i < trail.length; i++) { const u = i / trail.length; ctx.strokeStyle = `rgba(255,255,255,${0.35 * u})`; ctx.lineWidth = R * 1.4 * u; ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke(); } }
    // aiming: the pull-back band, dots along the line the ball will take and a power ring round the ball (green → gold → red)
    if (drag && !moving()) {
      const dx = drag.x - drag.x0, dy = drag.y - drag.y0, d = Math.min(150, Math.hypot(dx, dy)), a = Math.atan2(dy, dx), pw = d / 150, col = `hsl(${120 - 120 * pw}, 95%, 58%)`;
      if (d >= 8) {
        ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(a) * d * 0.45, b.y + Math.sin(a) * d * 0.45); ctx.stroke(); ctx.setLineDash([]);
        const n = Math.max(3, Math.floor(d * 0.9 / 10));
        for (let i = 1; i <= n; i++) { const u = i / n, px = b.x - Math.cos(a) * d * 0.9 * u, py = b.y - Math.sin(a) * d * 0.9 * u; ctx.globalAlpha = 1 - u * 0.65; circ(ctx, px, py, 3.2 - u * 1.6, '#102010'); circ(ctx, px, py, 2.4 - u * 1.3, col); }
        ctx.globalAlpha = 1; const ex = b.x - Math.cos(a) * d * 0.9, ey = b.y - Math.sin(a) * d * 0.9; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ex - Math.cos(a) * 7, ey - Math.sin(a) * 7); ctx.lineTo(ex + Math.cos(a + 0.5) * 6, ey + Math.sin(a + 0.5) * 6); ctx.lineTo(ex + Math.cos(a - 0.5) * 6, ey + Math.sin(a - 0.5) * 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#00000055'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, R + 8, 0, 7); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, R + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pw); ctx.stroke();
      }
    }
    // 🟢 you are Fig, rolled up into the ball (the glitch's Fig if a glitch is on), facing the way you roll
    g.face = g.v.x ? Math.sign(g.v.x) : (g.face || 1);
    oval(ctx, b.x + 2, b.y + R + 2, R * 1.25, R * 0.45, '#00000044');
    drawPal(g.glitch ? (g.glitchPal || 'fig') : (S.curve.mood || 'calm'), ctx, { x: b.x, y: b.y, s: R * 1.15, t: performance.now() / 1000, r: S.curve.r, face: g.face, hurt: !!(g.gopher && g.gopher.grab > 0) });
  }
  g.cups.forEach((c) => drawFlag(c, th, ts));
  th.amb(ctx, ts, W, Hh, true);
  ctx.restore();
  if (g.twist?.kind === 'wind') { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const y = 80 + i * (Hh / 11), x = ((t / 5) * Math.sign(g.twist.wind) + i * 97) % (W + 60); ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x, y); ctx.stroke(); } }
  if (g.gopher) { const gp = g.gopher, pop = Math.min(1, gp.t / 0.4); ctx.save(); ctx.translate(gp.x, gp.y); ctx.fillStyle = '#3A2A1A'; ctx.beginPath(); ctx.ellipse(0, 6, 13, 5, 0, 0, 7); ctx.fill(); ctx.translate(0, (1 - pop) * 14); ctx.fillStyle = '#A4753E'; ctx.beginPath(); ctx.ellipse(0, -4, 9, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1B1B22'; ctx.beginPath(); ctx.arc(-3.5, -8, 1.6, 0, 7); ctx.arc(3.5, -8, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.fillRect(-2.5, -2, 2, 4); ctx.fillRect(0.5, -2, 2, 4); ctx.restore(); }
  // 🌊 going under: the deeper you're zoned in, the more the night closes in: the rough and the far fairway fall away into
  // the dark, a pool of light stays on your ball and another on the cup, and fireflies drift over the grass
  { const f = host.deep?.() || 0; if (f > 0.02 && g.ball) {
    const cv = host.cv; if (!nightL || nightL.width !== cv.width || nightL.height !== cv.height) { nightL = document.createElement('canvas'); nightL.width = cv.width; nightL.height = cv.height; }
    const n = nightL.getContext('2d'), sx = (x) => x * k + (host.ox || 0), sy = (y) => y * k + (host.oy || 0);
    n.globalCompositeOperation = 'source-over'; n.clearRect(0, 0, nightL.width, nightL.height); n.fillStyle = `rgba(3,8,14,${0.8 * f})`; n.fillRect(0, 0, nightL.width, nightL.height);
    n.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const gr = n.createRadialGradient(sx(x), sy(y), r * k * 0.3, sx(x), sy(y), r * k); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); n.fillStyle = gr; n.beginPath(); n.arc(sx(x), sy(y), r * k, 0, 7); n.fill(); };
    hole(g.ball.x, g.ball.y, 150 - 40 * f); if (g.cups[0]) hole(g.cups[0].x, g.cups[0].y, 90);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nightL, 0, 0); ctx.restore();
    for (let i = 0; i < 18; i++) { const ph = i * 2.399, x = ((Math.sin(ph * 3.1) * 0.5 + 0.5) * W + Math.sin(t / 1700 + ph) * 30 + W) % W, y = (Math.cos(ph * 1.7) * 0.5 + 0.5) * Hh * 0.9 + Hh * 0.05 + Math.cos(t / 1300 + ph * 2) * 18, a = f * (0.4 + 0.6 * Math.max(0, Math.sin(t / 500 + ph * 5))); ctx.fillStyle = `rgba(220,255,140,${a})`; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(220,255,140,${a * 0.25})`; ctx.beginPath(); ctx.arc(x, y, 1.8 * 3.5, 0, 7); ctx.fill(); }
  } }
  ctx.fillStyle = '#FFE08A'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`par ${g.par} · putt ${Math.min(PUTTS_OF(), g.putts + 1)} of ${PUTTS_OF()}${g.free ? ` · 🌻 ${g.free} free` : ''}`, W / 2, Hh - 16);
  g.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5)); if (f.kind === 'dot') { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); } else { ctx.font = f.big ? '400 20px Bungee, Impact, sans-serif' : '900 14px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.col || '#FFE08A'; ctx.strokeStyle = '#102010'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } });
  ctx.globalAlpha = 1;
}
const organ = {
  key: 'putt', name: 'Putt', icon: '⛳', verb: 'drag back and let go to putt', beat: 1.0,
  theme: { bg: '#1E3A1A', gold: '#F5C542', bannerc: '#FFE08A' },
  glitch(on, pal) { if (g) { g.glitch = on; g.glitchPal = pal; } },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__pt = organ.debug; },
  start() { newGame(); },
  enter(from) { if (!g) newGame(); host.ui(''); drag = null; if (from) { g.v = { x: 0, y: 0 }; } },
  leave() { drag = null; return g?.ball ? { x: g.ball.x, y: g.ball.y } : null; },
  update, draw, onBeat,
  pointer(type, p) { if (type === 'down') { if (g?.gopher && Math.hypot(g.gopher.x - p.x, g.gopher.y - p.y) < 30) return shoo(); drag = { x0: p.x, y0: p.y, x: p.x, y: p.y }; } else if (type === 'move') { if (drag) { drag.x = p.x; drag.y = p.y; } } else if (drag) { if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) < 8) fix(drag.x0, drag.y0); else putt(drag.x - drag.x0, drag.y - drag.y0); drag = null; } },
  hudLine: () => (g ? `⛳ course ${g.course} · ${g.courseHole}/3${g.fixes ? ` · 🔧${g.fixes}` : ''}` : ''),
  level: () => g?.course || 1,
  overText: (how) => (how === 'picked up' ? ['⛳ PICKED UP', 'Too many cups walked away from.'] : ['RUN OVER', '']),
  endStats: () => (g ? `⛳ ${sunkN} cups in ${puttsN} putts` : ''),
  debug: () => g && ({ themes: THEMES.map((th) => th.key), themeKey: themeOf().key, theme: (i) => { g.hole = ((i % THEMES.length) + THEMES.length) % THEMES.length; g.courseHole = 0; g.coursePar = 0; g.courseStrokes = 0; g.ball = null; newCup(); return themeOf().key; }, hole: g.hole, layerBuilt: LY?.at || 0, fix, fixes: g.fixes, bumps: g.bumpers, sand: g.sand, water: g.water, jump: (c) => { g.course = c; g.courseHole = 0; g.coursePar = 0; g.courseStrokes = 0; g.ball = null; newCup(); }, gopher: g.gopher, bends: g.path.length - 2, pw: g.pw, path: g.path, ball: g.ball, v: g.v, cups: g.cups, putts: g.putts, sunk: sunkN, par: g.par, course: g.course, courseHole: g.courseHole, allowed: PUTTS_OF(), twist: g.twist?.kind || null, bumpers: g.bumpers.length, W, H: H(), putt }),
};
export default organ;
