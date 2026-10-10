// 🔺 Fractal Dash, as an organ of the shell (shell.js): a dash across a fractal landscape. You're a
// little Sierpiński triangle, running ever faster over ground made of fractal noise (a ridge that gets
// rougher as the chaos curve climbs). Tap to jump (again in the air for a double jump), hold to dash: a
// dash phases through spikes while its meter lasts. The box's beats decide the road: a peak is spikes,
// a hop of x a chasm as wide as the hop, a trough shards, the window threes, the mirror heals, the
// balance fills the dash, the golden cut lays a spiral of shards. Every 22 s the world zooms into a
// copy of itself, a depth deeper: faster, rougher, and a new world (`WORLDS`: Sierpiński Dawn, Fern Valley, Koch
// Snowfields, Mandelbrot Magma, Julia Lagoon, Pythagoras Woods, Dragon Curve Canyon, Lightning Plateau).
// 🕳️ Its pocket (deep enough, a shard floats just ahead of you and glows: tap it): INSIDE A SHARD (pockets/shard.js), a
// fall down the edge of the Mandelbrot set, zooming in, to a baby copy of it at the bottom; landing on it brings up a
// full dash, a life and a shard shield (no spike, bolt, drone or chasm can touch you while it lasts).
import { fibMult, CHAOS } from '../chaos.js';
import shardPocket from './pockets/shard.js';
import { drawPal } from '../pals.js';

let W = 400, DEPTH_S = 22, GRAV = 1500, JUMP = 520, DASH_MAX = 1.4, PX = 96, R = 13;   // PX: where you stand on screen; R: your size
// 🗺️ Every depth is a world (like Rally's places): its own sky, background fractals, ground, plants and air.
// Only the look changes; the run plays the same. After the eighth, round again.
const WORLDS = [
  { key: 'dawn', icon: '🌌', name: 'SIERPIŃSKI DAWN', sub: 'triangles all the way down', sky: ['#0B0A1F', '#3A2275', '#E0607E'], sun: { c: '#FFC2A8', x: 0.74, y: 0.5, r: 30 },
    layers: ['#4A3A9A', '#2E2478', '#1B1650'], ground: ['#2A2066', '#07061A'], edge: '#3DF2E0', bands: ['#F5C542', '#FFB347', '#9BD1FF', '#5A8CFF', '#2B4FD6', '#17307F'],
    spike: '#FF5FB0', shard: '#F5C542', tex: '#8F86FF', plantC: ['#1F8A8F', '#5E50A8'], amb: 'motes', mote: '#C9FFF8', dust: '#B9B4E6', stars: 90 },
  { key: 'fern', icon: '🌿', name: 'FERN VALLEY', sub: 'every leaf is the whole fern', sky: ['#0E2A2A', '#2F6F5E', '#D6EFA8'], sun: { c: '#FFF2B0', x: 0.7, y: 0.22, r: 22 },
    layers: ['#4E8F72', '#2C6650', '#173F30'], ground: ['#24502A', '#06120A'], edge: '#B8FF6A', bands: ['#E9FF8A', '#B6EB6A', '#7FCF63', '#4FA35A', '#2E7A45', '#1B5232'],
    spike: '#FF6B5E', shard: '#F5C542', tex: '#9BE36A', plantC: ['#7FDB5A', '#C6FF7A'], amb: 'spores', mote: '#E9FF8A', dust: '#CFE8B0', stars: 0 },
  { key: 'koch', icon: '❄️', name: 'KOCH SNOWFIELDS', sub: 'snowflakes with endless edges', sky: ['#060C24', '#1E3670', '#7FA6DE'], sun: { c: '#EAF4FF', x: 0.22, y: 0.18, r: 16, moon: true },
    layers: ['#3C5A92', '#6E8DC0', '#A9C3E6'], ground: ['#EAF3FF', '#4F6496'], edge: '#FFFFFF', bands: ['#C9E4FF', '#A9CCF5', '#86AEE6', '#6A8FD0', '#5574B5', '#465E99'],
    spike: '#FF3F6E', shard: '#F5C542', tex: '#9DB8E8', plantC: ['#BFE6FF', '#FFFFFF'], amb: 'snow', mote: '#FFFFFF', dust: '#FFFFFF', stars: 70 },
  { key: 'magma', icon: '🔥', name: 'MANDELBROT MAGMA', sub: 'hot bulbs on bulbs on bulbs', sky: ['#0E0306', '#4A0E12', '#FF6A2A'], sun: { c: '#FF9A3A', x: 0.62, y: 0.62, r: 46, haze: true },
    layers: ['#A0402A', '#2E0B0D', '#170506'], ground: ['#2E100C', '#0A0303'], edge: '#FF8A2A', bands: ['#FFE08A', '#FFB347', '#FF6A2A', '#D63A1E', '#9A1A12', '#5A0A0A'],
    spike: '#3DF2E0', shard: '#9BF2FF', tex: '#FF6A2A', plantC: ['#1A0A0A', '#FF8A2A'], amb: 'embers', mote: '#FFB347', dust: '#8A5A4A', stars: 25 },
  { key: 'julia', icon: '🌊', name: 'JULIA LAGOON', sub: 'islands that never end', sky: ['#04182A', '#0E5A70', '#8FEADF'], sun: { c: '#FFF6D0', x: 0.3, y: 0.3, r: 20 },
    layers: ['#2A8A92', '#13606E', '#0C3E4C'], ground: ['#E2C68E', '#5E4224'], edge: '#7FFFE8', bands: ['#FFF0C0', '#F2D08A', '#D9A85E', '#B98546', '#8F5F32', '#6B4A2A'],
    spike: '#FF4FA0', shard: '#F5C542', tex: '#A8743A', plantC: ['#FF7A8A', '#FFB070'], amb: 'bubbles', mote: '#C9FFF8', dust: '#F2E2B8', stars: 30 },
  { key: 'woods', icon: '🌳', name: 'PYTHAGORAS WOODS', sub: 'trees made of squares', sky: ['#160E06', '#5A3A12', '#F2B35E'], sun: { c: '#FFE08A', x: 0.8, y: 0.36, r: 26 },
    layers: ['#7A6230', '#45421C', '#23280F'], ground: ['#4A3018', '#0F0904'], edge: '#A8E05A', bands: ['#E8C07A', '#C9985A', '#A8743E', '#7F5228', '#5A3A1A', '#3A2410'],
    spike: '#FF5FB0', shard: '#3DF2E0', tex: '#C9985A', plantC: ['#5A8A2A', '#9BD14A'], amb: 'leaves', mote: '#E8A040', dust: '#C9A27A', stars: 0 },
  { key: 'dragon', icon: '🐉', name: 'DRAGON CURVE CANYON', sub: 'fold a strip, fold it again', sky: ['#24081A', '#9A3A2A', '#FFC27A'], sun: { c: '#FFE6B0', x: 0.5, y: 0.5, r: 52, haze: true },
    layers: ['#C2704A', '#8A3E26', '#5A2414'], ground: ['#A8582E', '#3A1408'], edge: '#FFD08A', bands: ['#FFD08A', '#EFA868', '#D27A46', '#AE5530', '#86381E', '#5A2210'],
    spike: '#3DF2E0', shard: '#C9FFF8', tex: '#5A2210', plantC: ['#6B8A3A', '#C9A25A'], amb: 'dust', mote: '#FFD8A8', dust: '#FFD8A8', stars: 0 },
  { key: 'storm', icon: '🌩️', name: 'LIGHTNING PLATEAU', sub: 'the sky forks and forks', sky: ['#04050D', '#1A1E3C', '#4E4E80'], sun: null,
    layers: ['#2C3056', '#1D2040', '#11132A'], ground: ['#2E3050', '#08080F'], edge: '#C9B8FF', bands: ['#FFFFFF', '#DCD2FF', '#B4A4FF', '#8A78F0', '#6450C8', '#3A2E8F'],
    spike: '#FF5FB0', shard: '#F5C542', tex: '#B4A4FF', plantC: ['#5A4CB0', '#A8A0D8'], amb: 'sparks', mote: '#E0E6FF', dust: '#9A9AC0', stars: 50 },
];
const world = (d = depth) => WORLDS[(d - 1) % WORLDS.length];
const hash = (i) => { let x = (Math.imul(i | 0, 374761393) + 668265263) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const smooth = (t) => t * t * (3 - 2 * t);
// Value noise at x (world units), octave o; seeded per run and per depth so every dive is a new ridge.
const noise = (x, o, seed) => { const i = Math.floor(x), t = smooth(x - i); const a = hash(i * 7919 + o * 104729 + seed), b = hash((i + 1) * 7919 + o * 104729 + seed); return a + (b - a) * t; };
const TWISTS = [
  { k: 'gust', name: '💨 TAILWIND', sub: 'twice the speed for a few seconds', dur: 4 },
  { k: 'fog', name: '🌫️ FOG', sub: 'the road hides until the last moment', dur: 7 },
  { k: 'quake', name: '🌋 QUAKE', sub: 'the ground heaves', dur: 5 },
  { k: 'rain', name: '✨ SHARD RAIN', sub: 'catch what you can', dur: 4 },
  { k: 'moon', name: '🌙 LOW GRAVITY', sub: 'long floaty jumps', dur: 6 },
  { k: 'bolt', name: '🌩️ LIGHTNING', sub: 'bolts strike where the marks are', dur: 6 },
  { k: 'dark', name: '🌑 BLACKOUT', sub: 'only your own glow to see by', dur: 6 },
  { k: 'mirror', name: '🪞 MIRROR', sub: 'the world flips: you run left', dur: 6 },
  { k: 'storm', name: '🔺 SPIKE STORM', sub: 'spikes on every beat', dur: 5 },
  { k: 'bounce', name: '🦘 TRAMPOLINE', sub: 'every landing throws you back up', dur: 6 },
  { k: 'boots', name: '⚓ LEAD BOOTS', sub: 'short jumps: dash through instead', dur: 6 },
];

let host, ctx, S, sfx, game = null, depth = 1, dashEl = null, holdT = null;
const H = () => host.H;

// ---------------------------------------------------------------- the ground
// The track is a fractal itself, a Mandelbrot coast: bulbs sit on a base line, smaller bulbs sit on the
// flanks of those, smaller still on them (circles on circles, the way the set's bulbs hang off its
// cardioid). The ground is the skyline of all of them, plus a whisper of noise. Deeper down, and the
// wilder the curve, the more levels of bulbs there are (the roughness). Chasms are cut out of it as
// obstacles. Drawn with the escape-time bands of the set hugging the coast (gold into blue).
const rough = () => Math.min(1.6, 0.35 + (depth - 1) * 0.28 + Math.max(0, S.curve.r - 2.9) * 0.6);
const BULB_P = 260;   // one base bulb every so often along the track
function groundY(x) {
  const g = game, s = g.seed + depth * 1000, ro = rough(), levels = 2 + Math.min(3, Math.round(ro * 1.6));
  const base = H() * 0.72; let top = base;
  // the circle's top at x, if x is under it
  const topOf = (cx, cy, r) => { const dx = x - cx; return Math.abs(dx) < r ? cy - Math.sqrt(r * r - dx * dx) : Infinity; };
  // a bulb and its children: two or three on its upper flanks, radius × 0.4, down to `levels`
  const bulb = (cx, cy, r, lvl, h) => { if (Math.abs(x - cx) > r * 2.2) return; const t = topOf(cx, cy, r); if (t < top) top = t; if (lvl >= levels) return;
    const n = 2 + (hash(h) < 0.5 ? 1 : 0); for (let i = 0; i < n; i++) { const a = Math.PI * (0.28 + 0.44 * (i + 0.5) / n) + (hash(h * 7 + i) - 0.5) * 0.2, rc = r * (0.2 + hash(h * 3 + i) * 0.12); bulb(cx + Math.cos(a) * (r + rc * 0.6), cy - Math.sin(a) * (r + rc * 0.6), rc, lvl + 1, h * 31 + i + 1); } };   // the children sit on the rim, so the dome stays a dome
  const i0 = Math.floor(x / BULB_P);
  for (let i = i0 - 1; i <= i0 + 1; i++) { const h = i * 1103 + s, r = 80 + hash(h) * 70, cx = i * BULB_P + BULB_P / 2 + (hash(h + 1) - 0.5) * 80; bulb(cx, base + r * 0.72, r, 1, h); }   // only the cap rises out of the base line: gentle domes
  const y = top + (noise(x / 38, 3, s) - 0.5) * 6 * ro + (noise(x / 9, 5, s) - 0.5) * 3 * ro;
  return Math.max(H() * 0.34, Math.min(H() - 40, y));
}
const inGap = (x) => game.obs.find((o) => o.type === 'gap' && x > o.x && x < o.x + o.w);

// ---------------------------------------------------------------- a run
function newGame() {
  depth = 1;
  game = { seed: Math.floor(Math.random() * 1e6), cam: 0, speed: 175, time: 0, dive: null, ko: false,
    py: 0, vy: 0, onGround: true, jumps: 0, dash: DASH_MAX, dashing: false, inv: 0,
    dist: 0, paid: 0, shards: 0, obs: [], parts: [], trail: [], twist: null, twistAt: -9, dark: 0, shake: 0, fog: 0, shield: 0, pk: null };
  game.py = groundY(PX) - R; game.centred = false;
}
// One beat of the chaos curve (the box, CHAOS.md): what x lands on decides what's coming up the road.
function onBeat(ev) {
  const g = game, c = S.curve, x = ev.x, d = ev.hop, ahead = g.cam + W + 60;
  if (ev.window) { for (let i = 0; i < 3; i++) g.obs.push({ type: 'shard', x: ahead + i * 26, lift: 60 + i * 10, t: i }); if (c.n % 3 === 0) g.obs.push({ type: 'spike', x: ahead + 100, n: 3 }); }
  else if (x > 0.7) {
    const easy = depth === 1 && (host.stage?.() || 1) === 1, n = easy ? Math.min(2, 1 + Math.floor((x - 0.7) * 16)) : 1 + Math.floor((x - 0.7) * 16); g.obs.push({ type: 'spike', x: ahead, n });   // 🎚️ Stage 1, Depth 1: short rows
    if (x > 0.9 && depth >= 2) g.obs.push({ type: 'gap', x: ahead + n * 14 + 30, w: 50 + depth * 10 });   // deeper down, a chasm right behind the spikes
  }
  else if (d > 0.07 && !(depth === 1 && (host.stage?.() || 1) === 1)) { const w = Math.min(170 + depth * 10, 50 + Math.floor(d * 170) + depth * 12); g.obs.push({ type: 'gap', x: ahead, w }); if (depth >= 3 && x > 0.5) g.obs.push({ type: 'spike', x: ahead + w + 26, n: 2 }); }
  else if (x < 0.35 || c.n % 3 === 0) { const n = 3 + Math.floor(Math.max(0, 0.35 - x) * 12); for (let i = 0; i < n; i++) g.obs.push({ type: 'shard', x: ahead + i * 22, lift: 40 + Math.sin(i / (n - 1) * Math.PI) * 70, t: i }); }
  // ✨ Symmetry in chaos: the mirror heals (or pays), the balance fills the dash.
  if (ev.mirror) { if (S.hearts < 3) host.heal(1); else { host.add(300); g.shards += 300; } for (let i = 0; i < 14; i++) g.parts.push({ x: g.cam + PX, y: g.py, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.8) * 260, t: 0, life: 0.6, c: '#C9B8FF', k: 1, s: 5 }); sfx('chime'); }
  if (ev.balance) { g.dash = DASH_MAX; sfx('chime'); }
  // 🌻 Fibonacci: the golden cut lays eight shards along a golden spiral ahead (+161); a Fibonacci beat adds an arc.
  if (ev.golden) { host.add(161); g.shards += 161; for (let i = 0; i < 8; i++) { const a = i * 0.55, rr = 14 * Math.pow(CHAOS.PHI, a / 1.57); g.obs.push({ type: 'shard', x: ahead + 40 + Math.cos(a) * rr, lift: 90 + Math.sin(a) * rr, t: i }); } sfx('chime', { hi: true }); }
  if (ev.fib && !ev.window) for (let i = 0; i < 3; i++) g.obs.push({ type: 'shard', x: ahead + 180 + i * 22, lift: 50 + i * 12, t: i });
  // A twist at the curve's peaks, from the rhythm of 4 on (never in the window).
  if (ev.big && c.r >= 3.449 && !g.twist && g.time - (g.twistAt || -9) > 2.5) twist();
}
function twist() {
  const t = TWISTS[Math.floor(Math.random() * TWISTS.length)];
  game.twist = { ...t, t: 0 }; game.twistAt = game.time; host.banner(t.name, t.sub); sfx('whistle');
}

// ---------------------------------------------------------------- the loop
function update(dt) {
  W = host?.W || W;   // 🎚️ the world widens with the stage
  const g = game;
  g.time += dt;
  if (g.dive) { g.dive.t += dt; if (g.dive.t >= g.dive.dur) { g.dive = null; } return; }
  if (g.time >= depth * DEPTH_S) return dive();
  if (g.twist) { g.twist.t += dt;
    if (g.twist.k === 'rain' && Math.random() < dt * 9) g.obs.push({ type: 'shard', x: g.cam + PX + 40 + Math.random() * (W - 120), lift: 60 + Math.random() * 120, t: 0, fall: true });
    if (g.twist.k === 'bolt' && Math.random() < dt * 2.2) g.obs.push({ type: 'bolt', x: g.cam + PX + 50 + Math.random() * (W - 110), t: 0.9, flash: 0 });
    if (g.twist.k === 'storm' && Math.random() < dt * 1.7) g.obs.push({ type: 'spike', x: g.cam + W + 60, n: 2 + Math.floor(Math.random() * 3) });
    if (g.twist.t >= g.twist.dur) g.twist = null; }
  // 🎚️ as the board zooms out (Stage 2+) you run from the middle of the screen, so the road shows behind you too
  { const st = host.stage?.() || 1, to = st >= 2 ? W * 0.5 : 96; if (Math.abs(PX - to) > 0.5) { PX += (to - PX) * Math.min(1, dt * 0.8); if (!g.centred && st >= 2) { g.centred = true; host.banner('🎯 TO THE MIDDLE', 'they come from behind you too'); } }
    // 🛸 drones (Stage 2+): they fly in at jump height and hunt you, from ahead and, once you're in the middle, from behind; a dash smashes them, anything else stings
    if (st >= 2 && Math.random() < dt * (0.12 + st * 0.08) && g.obs.filter((o) => o.type === 'drone').length < st) { const behind = g.centred && Math.random() < 0.4; g.obs.push({ type: 'drone', x: behind ? g.cam - 40 : g.cam + W + 40, lift: 40 + Math.random() * 60, vx: (behind ? -1 : 1) * (50 + st * 25), ph: Math.random() * 6.28 }); } }
  const gust = g.twist?.k === 'gust' ? 1.9 : 1, moon = g.twist?.k === 'moon' ? 0.45 : 1;
  g.fog += ((g.twist?.k === 'fog' ? 1 : 0) - g.fog) * Math.min(1, dt * 3);
  g.dark += ((g.twist?.k === 'dark' ? 1 : 0) - g.dark) * Math.min(1, dt * 3);
  // Speed climbs with time and depth; a dash nearly doubles it while the meter lasts.
  g.speed = Math.min(640, (depth === 1 && (host.stage?.() || 1) === 1 ? 140 : 190) + (depth - 1) * 60 + g.time * 2.2);   // 🎚️ a gentle start
  if (g.dashing && g.dash > 0) { g.dash = Math.max(0, g.dash - dt); if (g.dash === 0) g.dashing = false; }
  else if (g.onGround) g.dash = Math.min(DASH_MAX, g.dash + dt * 0.7);
  const v = g.speed * gust * (g.dashing ? 1.8 : 1);
  g.cam += v * dt; g.dist += v * dt;
  const m = Math.floor(g.dist / 10); if (m > g.paid) { host.add(m - g.paid); g.paid = m; }   // a point a metre
  // You: gravity, the ground under your feet, the edge of a chasm.
  const px = g.cam + PX, gy = groundY(px), gap = inGap(px);
  const quake = g.twist?.k === 'quake' ? Math.sin(g.time * 9) * 12 : 0;
  g.vy += GRAV * moon * dt; g.py += g.vy * dt;
  const floor = gap ? H() + 60 : gy + quake - R;
  if (g.py >= floor && g.vy >= 0 && !gap) { const hard = g.vy; g.py = floor; g.vy = 0; if (!g.onGround) { g.onGround = true; g.jumps = 0; puff(px, g.py + R, 4 + Math.min(8, Math.floor(hard / 120)), true); if (g.twist?.k === 'bounce') { g.vy = -JUMP * 0.8; g.onGround = false; g.jumps = 1; sfx('putt', { power: 0.5 }); } } }
  else g.onGround = false;
  if (g.inv > 0) g.inv -= dt;
  if (g.shield > 0) g.shield = Math.max(0, g.shield - dt);   // 💠 the shard shield from the pocket
  if (g.py > H() + 40) return fall();
  // Obstacles: spikes hurt (unless you're dashing), shards score, and everything behind you is gone.
  g.obs = g.obs.filter((o) => {
    if (o.type === 'shard') {
      if (o.fall) o.lift = Math.max(6, o.lift - dt * 90);
      const sy = groundY(o.x) - o.lift, dx = o.x - px, dy = sy - g.py;
      if (Math.hypot(dx, dy) < R + 20) { collect(o.x, sy); return false; }   // shards come to you
    } else if (o.type === 'bolt') {
      o.t -= dt;
      if (o.t <= 0 && !o.struck) { o.struck = true; o.flash = 0.3; sfx('thud'); if (Math.abs(o.x - px) < 24 && !safe()) hurt('zapped'); }
      if (o.struck) { o.flash -= dt; return o.flash > 0; }
    } else if (o.type === 'drone') {
      o.x -= o.vx * dt; o.ph += dt * 3; const dy = (groundY(o.x) - o.lift + Math.sin(o.ph) * 8) - g.py, dx = o.x - px;
      if (Math.hypot(dx, dy) < R + (g.dashing || g.shield > 0 ? 20 : 11)) { if (g.dashing || g.shield > 0) { host.add(150); host.cue?.('kill', o.x - g.cam, g.py + dy); for (let i = 0; i < 12; i++) g.parts.push({ x: o.x, y: g.py + dy, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.8) * 260, t: 0, life: 0.5, c: i % 3 ? '#FF5FB0' : '#FFD1EA', k: i % 2 ? 3 : 0, s: 4 }); g.parts.push({ x: o.x, y: g.py + dy, vx: 0, vy: 0, t: 0, life: 0.35, c: '#FFD1EA', k: 2, s: 6, r: 34, gr: 0 }); sfx('boom', { size: 0.6 }); return false; } if (!safe()) hurt('droned'); }
    } else if (o.type === 'spike' && !safe() && !g.dashing) {
      const w = o.n * 14;
      if (px + R * 0.6 > o.x && px - R * 0.6 < o.x + w && g.py + R > groundY(o.x + w / 2) + quake - 15) hurt('spiked');
    }
    return o.type === 'drone' ? o.x > g.cam - 80 && o.x < g.cam + W + 80 : o.x + (o.w || o.n * 14 || 0) > g.cam - 60;
  });
  g.parts = g.parts.filter((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * (p.gr ?? 1) * dt; return p.t < p.life; });
  if (g.parts.length > 260) g.parts.splice(0, g.parts.length - 260);
  if (g.dashing && Math.random() < dt * 40) g.parts.push({ x: px - R, y: g.py + (Math.random() - 0.5) * R, vx: -v * 0.5, vy: (Math.random() - 0.5) * 60, t: 0, life: 0.35, c: world().edge, k: 1, s: 5, gr: 0 });
  g.trail.push(g.py); if (g.trail.length > 12) g.trail.shift();   // for the dash's afterimages
  if (g.onGround && Math.random() < dt * (g.dashing ? 30 : 6)) g.parts.push({ x: px - R * 0.6, y: g.py + R, vx: -40 - Math.random() * 60, vy: -20 - Math.random() * 40, t: 0, life: 0.4, c: world().dust, k: 0, s: 2 + Math.random() * 2, gr: 0.3 });   // kicked-up dust
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 3);
  if (dashEl) dashEl.style.width = `${(g.dash / DASH_MAX) * 100}%`;
}
function collect(x, y) {
  const g = game;
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 1.6; host.cue?.('score', x - g.cam, y);
  const pts = 50 * fibMult(S.combo); g.shards += pts; host.add(pts);   // 🌻 combos count in Fibonacci: 1, 2, 3, 5, 8, 13, 21…
  const col = world().shard; for (let i = 0; i < 8; i++) g.parts.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.8) * 220, t: 0, life: 0.5, c: col, k: i % 2 ? 1 : 3, s: 4 });
  g.parts.push({ x, y, vx: 0, vy: 0, t: 0, life: 0.35, c: col, k: 2, s: 6, r: 26, gr: 0 });
  sfx('chime', { hi: S.combo > 3 });
}
function puff(x, y, n, land) {   // dust: a landing spreads it along the ground, a jump kicks it down and back
  const c = world().dust; for (let i = 0; i < n; i++) { const sd = i % 2 ? 1 : -1; game.parts.push({ x, y, vx: land ? sd * (40 + Math.random() * 110) : (Math.random() - 0.7) * 120, vy: -Math.random() * (land ? 50 : 80), t: 0, life: 0.35 + Math.random() * 0.2, c, k: 4, s: 3 + Math.random() * 3, gr: 0.25 }); }
  if (!land) game.parts.push({ x, y, vx: 0, vy: 0, t: 0, life: 0.3, c, k: 2, s: 3, r: 16, gr: 0 });
}
function hurt(how) {
  const g = game;
  g.inv = 1.4; g.shake = 1; sfx('thud'); host.cue?.('near', PX, g.py);
  for (let i = 0; i < 14; i++) g.parts.push({ x: g.cam + PX, y: g.py, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.7) * 300, t: 0, life: 0.6, c: i % 3 ? '#FF5FB0' : '#FFFFFF', k: i % 2 ? 3 : 1, s: 4 });
  g.parts.push({ x: g.cam + PX, y: g.py, vx: 0, vy: 0, t: 0, life: 0.4, c: '#FF5FB0', k: 2, s: 8, r: 40, gr: 0 });
  if (host.hurt(how)) { g.ko = how; return true; }
  host.banner(how === 'spiked' ? 'OUCH' : how === 'zapped' ? 'ZAP' : how === 'droned' ? 'DRONED · dash through them' : 'SPLASH', `${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`);
  return false;
}
const safe = () => game.inv > 0 || game.shield > 0;
function fall() {
  const g = game;
  if (g.shield > 0) { g.vy = -JUMP * 0.9; sfx('boing'); } else if (hurt('fell')) return;   // 💠 the shield bounces you out of a chasm
  // Back on solid ground just past the chasm.
  const gap = inGap(g.cam + PX) || g.obs.filter((o) => o.type === 'gap' && o.x + o.w < g.cam + PX).pop();
  if (gap) g.cam = gap.x + gap.w + 12 - PX;
  g.py = groundY(g.cam + PX) - R - 40; g.vy = 0;
}
function jump() {
  const g = game; if (!g || S.over || g.dive) return;
  if (g.onGround || g.jumps < 2) { g.vy = -JUMP * (g.onGround ? 1 : 0.85) * (g.twist?.k === 'boots' ? 0.72 : 1); g.jumps = g.onGround ? 1 : 2; g.onGround = false; sfx('putt', { power: 0.6 }); puff(g.cam + PX, g.py + R, 3); }
}
function dive() {
  const g = game;
  depth += 1;
  g.dive = { t: 0, dur: host.reduceMotion ? 0.01 : 1.1 };
  g.seed = (g.seed * 16807 + depth) % 2147483647;   // a new ridge inside the old
  g.obs = []; g.twist = null; g.py = groundY(g.cam + PX) - R; g.vy = 0; g.onGround = true; g.jumps = 0;
  host.heal(1); g.dash = DASH_MAX;
  const wd = world(); host.banner(`${wd.icon} DEPTH ${depth} · ${wd.name}`, `${wd.sub} · ❤️ +1`); sfx('birdie');
}

// ---------------------------------------------------------------- drawing
// 🎨 The look (page only; the run plays the same in every world). Static things are drawn once per world into
// offscreen canvases (`looks`, `lookFor`): four seamless parallax tiles `TILE` wide (sky details, far, mid,
// near), the sun or moon, the ground's texture (a pattern scrolled with the road), four plant sprites for the
// ridge and the shard sprite. A new world, or the scale changing by a third, rebuilds them; the next world is
// built one piece a frame in the last seconds before a dive. Glows are cached sprites (`glowOf`), never
// shadowBlur, and gradients are cached per world and height.
const TILE = 640, PARS = [0, 0.1, 0.22, 0.42], TEX = 96, PW = 36, PH = 46;
const LB = [null, [0.18, 0.8], [0.22, 0.8], [0.34, 0.82]];   // each tile's band of the screen (top, bottom as a share of H): only where it has something; the ground hides the rest
const rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const ctxOf = (c, opaque) => c.getContext('2d', opaque ? { alpha: false } : undefined);   // an opaque canvas blits without blending
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ell = (c, x, y, rx, ry, rot = 0) => { c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, 7); };   // one ellipse as its own sub-path
const rgba = (h, a) => { const [r, g, b] = rgbOf(h); return `rgba(${r},${g},${b},${a})`; };
function sierp(c, x, y, s, d, up = true) {   // a Sierpiński triangle, point up, s across
  if (d === 0) { const h = s * 0.866; c.moveTo(x, up ? y - h / 2 : y + h / 2); c.lineTo(x + s / 2, up ? y + h / 2 : y - h / 2); c.lineTo(x - s / 2, up ? y + h / 2 : y - h / 2); c.closePath(); return; }
  const h = s * 0.866, q = s / 4, hh = h / 4;
  sierp(c, x, y - hh * (up ? 1 : -1), s / 2, d - 1, up); sierp(c, x - q, y + hh * (up ? 1 : -1), s / 2, d - 1, up); sierp(c, x + q, y + hh * (up ? 1 : -1), s / 2, d - 1, up);
}
const glows = new Map();
function glowOf(col) {   // a soft round light in one colour, drawn once
  let g = glows.get(col); if (g) return g;
  g = mk(64, 64); const x = g.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.3, rgba(col, 0.55)); gr.addColorStop(1, rgba(col, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glows.set(col, g); return g;
}
const snap = (v, axis) => { const k = host.k, o = (axis ? host.oy : host.ox) || 0; return (Math.round(o + v * k) - o) / k; };   // to a whole device pixel, so a blit at 1:1 copies without resampling
let A = 1;   // the frame's base alpha (the dive fades the world)
function glow(x, y, r, col, a = 1, add = true) { if (r <= 0 || a <= 0) return; const op = ctx.globalCompositeOperation; if (add) ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = A * Math.min(1, a); ctx.drawImage(glowOf(col), x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = op; ctx.globalAlpha = A; }

// --- fractal makers, for the builders
function ridge(r, n, rough) {   // periodic midpoint displacement: a[0] = a[n], so a tile wraps
  const a = new Float32Array(n + 1); let step = n, amp = 1;
  while (step > 1) { const h = step >> 1; for (let i = h; i < n; i += step) a[i] = (a[i - h] + a[i + h]) / 2 + (r() - 0.5) * amp; amp *= rough; step = h; }
  return a;
}
function ridgePath(c, base, amp, a, flat) {
  const n = a.length - 1; c.beginPath(); c.moveTo(0, 4000);
  for (let i = 0; i <= n; i++) { const v = flat == null ? a[i] : Math.max(a[i], flat); c.lineTo(i / n * TILE, base + v * amp); }
  c.lineTo(TILE, 4000); c.closePath();
}
function fillRidge(c, base, amp, a, col, flat) { c.fillStyle = col; ridgePath(c, base, amp, a, flat); c.fill(); }
const ridgeAt = (a, base, amp, x, flat) => { const n = a.length - 1, f = ((x % TILE + TILE) % TILE) / TILE * n, i = Math.floor(f), v0 = a[i], v1 = a[Math.min(n, i + 1)]; let v = v0 + (v1 - v0) * (f - i); if (flat != null) v = Math.max(v, flat); return base + v * amp; };
function fern(c, x0, y0, h, n, r, lean = 0) {   // Barnsley's fern, by its four maps
  let x = 0, y = 0; const k = h / 10, dot = Math.max(0.8, h / 120);
  for (let i = 0; i < n; i++) { const p = r(); let nx, ny;
    if (p < 0.01) { nx = 0; ny = 0.16 * y; } else if (p < 0.86) { nx = 0.85 * x + 0.04 * y; ny = -0.04 * x + 0.85 * y + 1.6; }
    else if (p < 0.93) { nx = 0.2 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; } else { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
    x = nx; y = ny; if (i > 15) c.fillRect(x0 + (x + lean * y * y * 0.03) * k, y0 - y * k, dot, dot); }
}
function kochPts(out, ax, ay, bx, by, d) {   // a Koch edge from a to b, bumps to the left
  if (d === 0) { out.push(bx, by); return; }
  const dx = (bx - ax) / 3, dy = (by - ay) / 3, px = ax + dx, py = ay + dy, qx = ax + 2 * dx, qy = ay + 2 * dy, mx = px + dx * 0.5 + dy * 0.866, my = py - dx * 0.866 + dy * 0.5;
  kochPts(out, ax, ay, px, py, d - 1); kochPts(out, px, py, mx, my, d - 1); kochPts(out, mx, my, qx, qy, d - 1); kochPts(out, qx, qy, bx, by, d - 1);
}
function kochFlake(c, x, y, r, d) { const p = [], v = [0, 1, 2].map((i) => [x + Math.cos(-Math.PI / 2 + i * 2.094) * r, y + Math.sin(-Math.PI / 2 + i * 2.094) * r]); p.push(v[0][0], v[0][1]); for (let i = 0; i < 3; i++) { const a = v[(3 - i) % 3], b = v[(2 - i + 3) % 3]; kochPts(p, a[0], a[1], b[0], b[1], d); } c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); }
function pyth(c, x, y, s, a, d, t) {   // a Pythagoras tree: a square, and on its top two squares round a right triangle
  const ux = Math.cos(a) * s, uy = Math.sin(a) * s, vx = uy, vy = -ux;
  c.moveTo(x, y); c.lineTo(x + ux, y + uy); c.lineTo(x + ux + vx, y + uy + vy); c.lineTo(x + vx, y + vy); c.closePath();
  if (d === 0) return;
  const s1 = s * Math.cos(t), s2 = s * Math.sin(t), tx = x + vx, ty = y + vy;
  pyth(c, tx, ty, s1, a - t, d - 1, t);
  pyth(c, tx + Math.cos(a - t) * s1, ty + Math.sin(a - t) * s1, s2, a - t + Math.PI / 2, d - 1, t);
}
function dragonPts(n) {   // the dragon curve: fold a strip n times, open every fold to a right angle
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], pts = [0, 0, 1, 0]; let x = 1, y = 0, dir = 0;
  for (let i = 1; i < 1 << n; i++) { dir = (dir + ((((i & -i) << 1) & i) ? 3 : 1)) % 4; x += DX[dir]; y += DY[dir]; pts.push(x, y); }
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
  return { pts, x0, x1, y0, y1 };
}
function bolt(c, x0, y0, x1, y1, disp, d, r, branch) {   // midpoint-displaced lightning, forking now and then
  if (d === 0) { c.moveTo(x0, y0); c.lineTo(x1, y1); return; }
  const mx = (x0 + x1) / 2 + (r() - 0.5) * disp, my = (y0 + y1) / 2 + (r() - 0.5) * disp * 0.3;
  bolt(c, x0, y0, mx, my, disp / 2, d - 1, r, branch); bolt(c, mx, my, x1, y1, disp / 2, d - 1, r, branch);
  if (branch && d >= 3 && r() < 0.3) bolt(c, mx, my, mx + (r() - 0.3) * disp * 1.5, my + Math.abs(y1 - y0) * 0.4, disp / 2, d - 2, r, false);
}
function escMask(w, h, fn, col, rim) {   // an escape-time picture: inside filled, the outside's slow points a glowing rim
  const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h), d = im.data, [r, g, b] = rgbOf(col), [rr, rg, rb] = rgbOf(rim);
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) { const it = fn(px / w, py / h), o = (py * w + px) * 4;
    if (it >= 1) { d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; } else if (it > 0.2) { const a = (it - 0.2) / 0.8; d[o] = rr; d[o + 1] = rg; d[o + 2] = rb; d[o + 3] = a * a * 220; } }
  x.putImageData(im, 0, 0); return cv;
}
const escape = (zr, zi, cr, ci, max) => { let i = 0; for (; i < max && zr * zr + zi * zi < 4; i++) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; } return i >= max ? 1 : i / max; };
const mandel = (col, rim) => escMask(120, 132, (u, v) => escape(0, 0, -2.05 + v * 2.6, -1.2 + u * 2.4, 40), col, rim);   // stood on end: the antenna is a spire
const julia = (col, rim, cr, ci, w = 160, h = 90) => escMask(w, h, (u, v) => escape(-1.6 + u * 3.2, -0.9 + v * 1.8, cr, ci, 48), col, rim);

// --- the background tiles. c draws in world units; y is the screen's own (the band's top is cut off).
function bgLayer(c, wd, li, r, Hb, tw = TILE) {
  const L = wd.layers, wrap = (fn, x = null, ext = 220) => { for (const dx of [-TILE, 0, TILE]) if (x == null || (x + dx + ext > 0 && x + dx - ext < TILE)) fn(dx); };   // only the copies that touch the tile
  if (li === 0) {   // sky details: stars, then the world's own
    for (let i = 0; i < wd.stars; i++) { const x = r() * tw, y = r() * Hb * 0.55, s = 0.6 + r() * 1.4; c.globalAlpha = 0.3 + r() * 0.6; c.fillStyle = r() < 0.2 ? '#FFE8C0' : '#FFFFFF'; c.fillRect(x, y, s, s); }
    c.globalAlpha = 1;
    if (wd.key === 'dawn') { c.strokeStyle = rgba('#C9B8FF', 0.16); c.lineWidth = 1; for (let i = 0; i < 3; i++) { const x = r() * tw, y = Hb * (0.1 + r() * 0.25), s = 50 + r() * 60; wrap((dx) => { c.beginPath(); sierp(c, x + dx, y, s, 3); c.stroke(); }, x); } }
    if (wd.key === 'fern' || wd.key === 'woods') { for (let i = 0; i < 7; i++) { const x = r() * tw, y = Hb * (0.08 + r() * 0.3), w = 40 + r() * 70; c.fillStyle = rgba('#FFFFFF', wd.key === 'fern' ? 0.1 : 0.07); wrap((dx) => { c.beginPath(); for (let j = 0; j < 4; j++) ell(c, x + dx + j * w * 0.3, y - Math.sin(j) * w * 0.12, w * 0.4, w * 0.18); c.fill(); }, x); } }
    if (wd.key === 'koch') {
      for (let b = 0; b < 3; b++) { const y0 = Hb * (0.1 + b * 0.07), gr = c.createLinearGradient(0, y0 - 40, 0, y0 + 50); gr.addColorStop(0, rgba(b === 1 ? '#B48CFF' : '#5CFFB0', 0)); gr.addColorStop(0.5, rgba(b === 1 ? '#B48CFF' : '#5CFFB0', 0.16)); gr.addColorStop(1, rgba('#5CFFB0', 0));
        c.fillStyle = gr; c.beginPath(); c.moveTo(0, y0 + 60); for (let x = 0; x <= tw; x += 16) c.lineTo(x, y0 + Math.sin(x / tw * Math.PI * 2 * (2 + b) + b) * 18 - 30); for (let x = tw; x >= 0; x -= 16) c.lineTo(x, y0 + Math.sin(x / tw * Math.PI * 2 * (2 + b) + b + 0.6) * 14 + 40); c.closePath(); c.fill(); }
      c.strokeStyle = rgba('#FFFFFF', 0.13); c.lineWidth = 1; for (let i = 0; i < 4; i++) { const x = r() * tw, y = Hb * (0.12 + r() * 0.3), s = 12 + r() * 22; wrap((dx) => { c.beginPath(); kochFlake(c, x + dx, y, s, 3); c.stroke(); }, x); }
    }
    if (wd.key === 'magma') { for (let i = 0; i < 6; i++) { const x = r() * tw, y = Hb * (0.1 + r() * 0.35), w = 60 + r() * 90; c.fillStyle = rgba('#000000', 0.22); wrap((dx) => { c.beginPath(); for (let j = 0; j < 5; j++) ell(c, x + dx + j * w * 0.25, y + Math.sin(j * 2) * 8, w * 0.3, w * 0.12); c.fill(); }, x); } }
    if (wd.key === 'dragon') { for (let i = 0; i < 5; i++) { c.fillStyle = rgba('#FFE6B0', 0.06); c.fillRect(0, Hb * (0.2 + i * 0.07), tw, 6 + r() * 10); } }
    if (wd.key === 'julia') { for (let i = 0; i < 5; i++) { const x = r() * tw, y = Hb * (0.1 + r() * 0.25), w = 40 + r() * 60; c.fillStyle = rgba('#FFFFFF', 0.12); wrap((dx) => { c.beginPath(); ell(c, x + dx, y, w, w * 0.16); ell(c, x + dx + w * 0.4, y - 5, w * 0.5, w * 0.14); c.fill(); }, x); } }
    if (wd.key === 'storm') {
      for (let i = 0; i < 2; i++) { const x = (i + 0.2 + r() * 0.6) * tw / 2; for (const [lw, cl] of [[6, rgba('#B4A4FF', 0.08)], [1.4, rgba('#DCD2FF', 0.35)]]) { const br = rng(i * 99 + 5); c.strokeStyle = cl; c.lineWidth = lw; c.beginPath(); bolt(c, x + (br() - 0.5) * 60, Hb * 0.1, x, Hb * 0.42, 50, 5, br, true); c.stroke(); } }
      for (let i = 0; i < 9; i++) { const x = r() * tw, y = Hb * (0.05 + r() * 0.22), w = 50 + r() * 80; wrap((dx) => { c.fillStyle = '#1A1C34'; c.beginPath(); for (let j = 0; j < 6; j++) ell(c, x + dx + (j - 2.5) * w * 0.22, y + Math.sin(j * 1.7) * 6, w * 0.25, w * 0.15); c.fill();
        c.fillStyle = rgba('#8A8AC0', 0.18); c.beginPath(); for (let j = 0; j < 6; j++) ell(c, x + dx + (j - 2.5) * w * 0.22, y + Math.sin(j * 1.7) * 6 - w * 0.06, w * 0.2, w * 0.07); c.fill(); }, x); }
    }
    return;
  }
  const base = Hb * [0, 0.5, 0.6, 0.7][li], col = L[li - 1], k = wd.key, rr = [0, 0.55, 0.5, 0.45][li];
  if (k === 'dawn') {
    if (li === 1) fillRidge(c, base, Hb * 0.12, ridge(r, 128, 0.55), col);
    if (li === 2) { const a = ridge(r, 64, 0.5); c.fillStyle = col; for (let i = 0; i < 5; i++) { const x = (i + r() * 0.6) * TILE / 5, s = 89 + r() * 90; wrap((dx) => { c.beginPath(); sierp(c, x + dx, ridgeAt(a, base, Hb * 0.04, x) - s * 0.43 + 6, s, 4); c.fill(); }, x); } fillRidge(c, base, Hb * 0.04, a, col); }
    if (li === 3) { const a = ridge(r, 64, 0.45); c.fillStyle = col; for (let i = 0; i < 6; i++) { const x = (i + r() * 0.7) * TILE / 6, s = 50 + r() * 50; wrap((dx) => { c.save(); c.translate(x + dx, ridgeAt(a, base, Hb * 0.05, x) + 4); c.scale(0.55, 1.7); c.beginPath(); sierp(c, 0, -s * 0.433, s, 3); c.fill(); c.restore(); }, x); } fillRidge(c, base, Hb * 0.05, a, col); }
  } else if (k === 'fern') {
    const a = ridge(r, 64, rr), amp = Hb * [0, 0.1, 0.06, 0.05][li];
    if (li >= 2) { c.fillStyle = col; const n = li === 2 ? 5 : 7; for (let i = 0; i < n; i++) { const x = (i + r() * 0.7) * TILE / n, h = li === 2 ? 110 + r() * 90 : 60 + r() * 50, lean = (r() - 0.5) * 2, seed = r() * 1e9; wrap((dx) => fern(c, x + dx, ridgeAt(a, base, amp, x) + 6, h, h * 12, rng(seed), lean), x, h * 0.6); } }
    fillRidge(c, base, amp, a, col);
    if (li === 1) { c.globalAlpha = 0.5; fillRidge(c, base - Hb * 0.05, Hb * 0.08, ridge(r, 64, 0.5), rgba(col, 0.6)); c.globalAlpha = 1; fillRidge(c, base, amp, a, col); }
  } else if (k === 'koch') {
    if (li === 3) { fillRidge(c, base, Hb * 0.03, ridge(r, 32, 0.35), col); return; }
    const n = 8, a = ridge(r, n, 0.5), amp = Hb * (li === 1 ? 0.22 : 0.12), p = [0, base + a[0] * amp];
    for (let i = 0; i < n; i++) kochPts(p, i / n * TILE, base + a[i] * amp, (i + 1) / n * TILE, base + a[i + 1] * amp, 3);
    c.fillStyle = col; c.beginPath(); c.moveTo(0, 4000); for (let i = 0; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.lineTo(TILE, 4000); c.closePath(); c.fill();
    c.save(); c.clip(); c.fillStyle = rgba('#FFFFFF', li === 1 ? 0.12 : 0.22); c.fillRect(0, 0, TILE, base - amp * 0.2); c.restore();
    c.strokeStyle = rgba('#FFFFFF', 0.5); c.lineWidth = 1; c.beginPath(); for (let i = 0; i < p.length; i += 2) c[i ? 'lineTo' : 'moveTo'](p[i], p[i + 1]); c.stroke();
  } else if (k === 'magma') {
    if (li === 1) { const a = ridge(r, 64, 0.6), amp = Hb * 0.16; fillRidge(c, base, amp, a, col);
      c.lineCap = 'round'; for (let i = 1; i < 64; i++) if (a[i] < a[i - 1] && a[i] < a[i + 1] && a[i] < -0.2) { const x = i / 64 * TILE, y = base + a[i] * amp; for (const [lw, cl] of [[5, rgba('#FF6A2A', 0.35)], [1.6, '#FFD06A']]) { c.strokeStyle = cl; c.lineWidth = lw; c.beginPath(); c.moveTo(x, y); let xx = x, yy = y; const rs = rng(i * 7 + 1); while (yy < base + 40) { yy += 8; xx += (rs() - 0.5) * 7; c.lineTo(xx, yy); } c.stroke(); } } }
    if (li === 2) { const a = ridge(r, 64, 0.5), m = mandel(col, '#FF6A2A'); for (let i = 0; i < 4; i++) { const x = (i + r() * 0.6) * TILE / 4, s = 90 + r() * 80; wrap((dx) => c.drawImage(m, x + dx - s * 0.45, ridgeAt(a, base, Hb * 0.04, x) - s + 8, s * 0.9, s), x); } fillRidge(c, base, Hb * 0.04, a, col); }
    if (li === 3) { const a = ridge(r, 128, 0.65); fillRidge(c, base, Hb * 0.06, a, col); c.strokeStyle = rgba('#FF6A2A', 0.5); c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i <= 128; i++) c[i ? 'lineTo' : 'moveTo'](i / 128 * TILE, base + a[i] * Hb * 0.06); c.stroke(); }
  } else if (k === 'julia') {
    if (li === 1) { const sea = Hb * 0.58, isl = julia('#2E8A6A', '#B8FFF0', -0.8, 0.156); c.fillStyle = col; c.fillRect(0, sea, TILE, Hb);
      for (let i = 0; i < 3; i++) { const x = (i + r() * 0.5) * TILE / 3, w = 150 + r() * 90, h = w * 0.42; wrap((dx) => c.drawImage(isl, x + dx - w / 2, sea - h * 0.62, w, h), x); }
      c.fillStyle = rgba(col, 0.7); c.fillRect(0, sea, TILE, Hb); c.strokeStyle = rgba('#FFFFFF', 0.25); c.lineWidth = 1;
      for (let i = 0; i < 26; i++) { const x = r() * TILE, y = sea + 4 + r() * Hb * 0.25, w = 10 + r() * 30; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); } }
    if (li === 2) { const a = ridge(r, 64, 0.45), cor = julia(col, '#FF9A8A', -0.123, 0.745, 120, 120); for (let i = 0; i < 4; i++) { const x = (i + r() * 0.6) * TILE / 4, s = 80 + r() * 60; wrap((dx) => { c.save(); c.translate(x + dx, ridgeAt(a, base, Hb * 0.04, x) - s * 0.4 + 8); c.rotate(-1.2); c.drawImage(cor, -s / 2, -s / 2, s, s); c.restore(); }, x); } fillRidge(c, base, Hb * 0.04, a, col); }
    if (li === 3) fillRidge(c, base, Hb * 0.05, ridge(r, 32, 0.35), col);
  } else if (k === 'woods') {
    const a = ridge(r, 64, 0.45), amp = Hb * [0, 0.12, 0.05, 0.05][li];
    if (li >= 2) { c.fillStyle = col; const n = li === 2 ? 6 : 4; for (let i = 0; i < n; i++) { const x = (i + r() * 0.6) * TILE / n, s = li === 2 ? 14 + r() * 10 : 22 + r() * 14, t = 0.55 + r() * 0.45; wrap((dx) => { c.beginPath(); pyth(c, x + dx - s / 2, ridgeAt(a, base, amp, x) + 6, s, 0, li === 2 ? 7 : 8, t); c.fill(); }, x); } }
    fillRidge(c, base, amp, a, col);
  } else if (k === 'dragon') {
    const a = ridge(r, 64, 0.5), amp = Hb * [0, 0.2, 0.06, 0.08][li], flat = li === 1 ? -0.15 : li === 3 ? -0.05 : null;
    if (li === 2) { const D = dragonPts(10); for (let i = 0; i < 3; i++) { const x = (i + r() * 0.5) * TILE / 3, s = 110 + r() * 60, sc = s / (D.x1 - D.x0), gy = ridgeAt(a, base, amp, x); wrap((dx) => {
      c.save(); c.translate(x + dx - s / 2, gy + 10); c.scale(sc, sc); c.translate(-D.x0, -D.y1); c.lineJoin = 'round'; c.lineCap = 'round';
      for (const [lw, cl, oy] of [[1.4, col, 0], [0.35, rgba('#FFD08A', 0.35), -0.3]]) { c.strokeStyle = cl; c.lineWidth = lw; c.beginPath(); for (let j = 0; j < D.pts.length; j += 2) c[j ? 'lineTo' : 'moveTo'](D.pts[j], D.pts[j + 1] + oy); c.stroke(); }
      c.restore(); }, x); } }
    ridgePath(c, base, amp, a, flat); c.fillStyle = col; c.fill(); c.save(); c.clip(); c.fillStyle = rgba('#000000', 0.12); for (let y = base - amp; y < Hb; y += 9) c.fillRect(0, y, TILE, 3); c.restore();
  } else if (k === 'storm') {
    const a = ridge(r, 64, li === 3 ? 0.6 : 0.5), amp = Hb * [0, 0.16, 0.1, 0.06][li], flat = li < 3 ? -0.2 : null;
    ridgePath(c, base, amp, a, flat); c.fillStyle = col; c.fill();
    c.strokeStyle = rgba('#C9B8FF', 0.25); c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 64; i++) c[i ? 'lineTo' : 'moveTo'](i / 64 * TILE, base + Math.max(a[i], flat ?? -9) * amp); c.stroke();
  }
}
function texTile(wd, ps, Hh) {   // the ground's texture: a strip TEX wide and taller than the screen, seamless sideways; the ground's colour darkens down it
  ps = Math.max(1, Math.round(TEX * ps)) / TEX;   // a whole number of pixels wide, or the opaque strip keeps a black last column (a seam every tile)
  const TH = Math.ceil(Hh * 1.4), cv = mk(TEX * ps, TH * ps), c = ctxOf(cv, true), r = rng(wd.key.length * 977 + 13), col = wd.tex;
  c.setTransform(ps, 0, 0, ps, 0, 0);
  const gr = c.createLinearGradient(0, Hh * 0.45, 0, Hh); gr.addColorStop(0, wd.ground[0]); gr.addColorStop(1, wd.ground[1]); c.fillStyle = gr; c.fillRect(0, 0, TEX, TH);
  for (let ty = Hh * 0.3; ty < TH; ty += TEX) { c.save(); c.translate(0, ty);
  const at = (fn) => { for (const dx of [-TEX, 0, TEX]) for (const dy of [-TEX, 0, TEX]) fn(dx, dy); };
  for (let i = 0; i < 70; i++) { const x = r() * TEX, y = r() * TEX, s = 0.8 + r() * 1.6; c.fillStyle = rgba(r() < 0.5 ? col : '#000000', 0.12 + r() * 0.18); c.fillRect(x, y, s, s); }
  const k = wd.key; c.lineCap = 'round'; c.lineJoin = 'round';
  if (k === 'dawn') { c.strokeStyle = rgba(col, 0.22); c.lineWidth = 0.8; for (let i = 0; i < 7; i++) { const x = r() * TEX, y = r() * TEX, s = 6 + r() * 12, up = r() < 0.5; at((dx, dy) => { c.beginPath(); sierp(c, x + dx, y + dy, s, 1, up); c.stroke(); }); } }
  if (k === 'fern') { for (let i = 0; i < 40; i++) { const x = r() * TEX, y = r() * TEX, s = 1.5 + r() * 2.5, rot = r() * 3; c.fillStyle = rgba(col, 0.15 + r() * 0.2); at((dx, dy) => { c.beginPath(); c.ellipse(x + dx, y + dy, s, s * 0.6, rot, 0, 7); c.fill(); }); } }
  if (k === 'koch' || k === 'storm') { for (let i = 0; i < 8; i++) { let x = r() * TEX, y = r() * TEX; const pts = [x, y]; for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 22; y += (r() - 0.3) * 14; pts.push(x, y); } at((dx, dy) => { c.strokeStyle = rgba(col, k === 'koch' ? 0.45 : 0.3); c.lineWidth = 0.8; c.beginPath(); for (let j = 0; j < pts.length; j += 2) c[j ? 'lineTo' : 'moveTo'](pts[j] + dx, pts[j + 1] + dy); c.stroke(); }); }
    for (let i = 0; i < 10; i++) { const x = r() * TEX, y = r() * TEX; c.fillStyle = rgba('#FFFFFF', 0.5); c.fillRect(x, y, 1, 1); } }
  if (k === 'magma') { for (let i = 0; i < 4; i++) { let x = r() * TEX, y = r() * TEX; const pts = [x, y]; for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 26; y += (r() - 0.5) * 16; pts.push(x, y); }
    at((dx, dy) => { for (const [lw, cl] of [[3.2, rgba(col, 0.25)], [1, rgba('#FFD06A', 0.55)]]) { c.strokeStyle = cl; c.lineWidth = lw; c.beginPath(); for (let j = 0; j < pts.length; j += 2) c[j ? 'lineTo' : 'moveTo'](pts[j] + dx, pts[j + 1] + dy); c.stroke(); } }); } }
  if (k === 'julia') { c.strokeStyle = rgba(col, 0.3); c.lineWidth = 1; for (let y = 4; y < TEX; y += 8) { const ph = r() * 6; c.beginPath(); for (let x = 0; x <= TEX; x += 4) c.lineTo(x, y + Math.sin(x / TEX * Math.PI * 4 + ph) * 1.6); c.stroke(); }
    for (let i = 0; i < 5; i++) { const x = r() * TEX, y = r() * TEX; c.fillStyle = rgba('#FFF0E0', 0.55); at((dx, dy) => { c.beginPath(); c.arc(x + dx, y + dy, 1.6, Math.PI, 0); c.fill(); }); } }
  if (k === 'woods') { c.strokeStyle = rgba('#1A0E04', 0.35); c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { let x = r() * TEX, y = r() * TEX, a = r() * 6; const pts = [x, y]; for (let j = 0; j < 6; j++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * 7; y += Math.sin(a) * 5; pts.push(x, y); } at((dx, dy) => { c.beginPath(); for (let j = 0; j < pts.length; j += 2) c[j ? 'lineTo' : 'moveTo'](pts[j] + dx, pts[j + 1] + dy); c.stroke(); }); }
    for (let i = 0; i < 9; i++) { const x = r() * TEX, y = r() * TEX, s = 1.5 + r() * 2; c.fillStyle = rgba(col, 0.35); at((dx, dy) => { c.beginPath(); ell(c, x + dx, y + dy, s, s * 0.7); c.fill(); }); } }
  if (k === 'dragon') { for (let y = 0; y < TEX; y += 6) { c.fillStyle = rgba(y % 12 ? '#FFD08A' : col, 0.08 + r() * 0.06); c.fillRect(0, y, TEX, 3 + r() * 2); } }
  c.restore(); }
  return cv;
}
function plantImg(wd, v, ps) {   // a little fractal plant for the ridge: four looks a world, bottom centre is its root
  const cv = mk(PW * ps, PH * ps), c = cv.getContext('2d'), r = rng(wd.key.length * 131 + v * 7 + 1), [c1, c2] = wd.plantC, bx = PW / 2, by = PH - 2;
  c.setTransform(ps, 0, 0, ps, 0, 0); c.lineCap = 'round'; c.lineJoin = 'round';
  const k = wd.key;
  if (k === 'dawn') { const g = c.createRadialGradient(bx, by, 0, bx, by, 18); g.addColorStop(0, rgba(c1, 0.35)); g.addColorStop(1, rgba(c1, 0)); c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 2 + v % 2; i++) { const x = bx + (i - 0.8) * 8, s = 14 + r() * 12; c.fillStyle = i % 2 ? c2 : c1; c.beginPath(); sierp(c, x, by - s * 0.43, s, 2); c.fill(); c.strokeStyle = rgba('#FFFFFF', 0.6); c.lineWidth = 0.6; c.stroke(); } }
  if (k === 'fern') { c.fillStyle = v % 2 ? c1 : c2; fern(c, bx - 2, by, 26 + v * 4, 900, r, (v - 1.5) * 0.8); if (v > 1) { c.fillStyle = c1; fern(c, bx + 6, by, 16, 500, r, 1); } }
  if (k === 'koch') { if (v < 2) { for (let i = 0; i < 3; i++) { const x = bx + (i - 1) * 6, h = 10 + r() * 16 + (i === 1 ? 8 : 0); c.fillStyle = rgba(c1, 0.85); c.beginPath(); c.moveTo(x - 3.5, by); c.lineTo(x, by - h); c.lineTo(x + 3.5, by); c.closePath(); c.fill(); c.fillStyle = rgba('#FFFFFF', 0.8); c.beginPath(); c.moveTo(x - 1, by); c.lineTo(x, by - h); c.lineTo(x + 1.4, by); c.closePath(); c.fill(); } }
    else { c.fillStyle = rgba(c2, 0.9); c.strokeStyle = c1; c.lineWidth = 0.6; c.beginPath(); kochFlake(c, bx, by - 8, 9 + v, 3); c.fill(); c.stroke(); } }
  if (k === 'magma') { if (v < 2) { for (let i = 0; i < 3; i++) { const x = bx + (i - 1) * 7, h = 8 + r() * 18; c.fillStyle = c1; c.beginPath(); c.moveTo(x - 4, by); c.lineTo(x + (r() - 0.5) * 4, by - h); c.lineTo(x + 4, by); c.closePath(); c.fill(); c.strokeStyle = rgba(c2, 0.8); c.lineWidth = 0.8; c.stroke(); } }
    else { const g = c.createRadialGradient(bx, by, 0, bx, by, 16); g.addColorStop(0, rgba('#FFD06A', 0.9)); g.addColorStop(0.4, rgba(c2, 0.5)); g.addColorStop(1, rgba(c2, 0)); c.fillStyle = g; c.fillRect(0, 0, PW, PH); c.fillStyle = c1; c.beginPath(); c.ellipse(bx - 7, by, 6, 4, 0, Math.PI, 0); c.ellipse(bx + 7, by, 6, 4, 0, Math.PI, 0); c.fill(); } }
  if (k === 'julia' || (k === 'dragon' && v >= 2)) {   // a branching coral (or a dry bush)
    const br = (x, y, a, l, d) => { if (d === 0 || l < 1.5) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = d * (k === 'julia' ? 1.1 : 0.6); c.strokeStyle = d % 2 ? c1 : c2; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); const n = 2 + (r() < 0.3 ? 1 : 0); for (let i = 0; i < n; i++) br(x2, y2, a + (i - (n - 1) / 2) * 0.6 + (r() - 0.5) * 0.3, l * 0.72, d - 1); };
    br(bx, by, -Math.PI / 2 + (r() - 0.5) * 0.3, 11 + v * 1.5, 5);
    if (k === 'julia') { c.fillStyle = rgba('#FFFFFF', 0.5); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(bx + (r() - 0.5) * 20, by - 8 - r() * 22, 0.9, 0, 7); c.fill(); } } }
  if (k === 'woods') { c.fillStyle = '#4A3018'; c.beginPath(); const s = 4.2 + v * 0.4; pyth(c, bx - s / 2, by, s, 0, 3, 0.7 + v * 0.05); c.fill(); c.fillStyle = v % 2 ? c1 : c2; c.beginPath(); c.beginPath(); pythTips(c, bx - s / 2, by, s, 0, 7, 0.7 + v * 0.05); c.fill(); }
  if (k === 'dragon' && v < 2) { const D = dragonPts(7), sc = 22 / (D.x1 - D.x0); c.save(); c.translate(bx - 11, by); c.scale(sc, sc); c.translate(-D.x0, -D.y1); c.strokeStyle = v ? c1 : c2; c.lineWidth = 1.3; c.beginPath(); for (let j = 0; j < D.pts.length; j += 2) c[j ? 'lineTo' : 'moveTo'](D.pts[j], D.pts[j + 1]); c.stroke(); c.restore(); }
  if (k === 'storm') { if (v < 2) { c.strokeStyle = '#6A6A90'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - 26 - v * 6); c.stroke(); c.lineWidth = 0.8; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx - 4, by - 8 - i * 6); c.lineTo(bx + 4, by - 8 - i * 6); c.stroke(); } const g = c.createRadialGradient(bx, by - 28 - v * 6, 0, bx, by - 28 - v * 6, 9); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, rgba(c2, 0.8)); g.addColorStop(1, rgba(c1, 0)); c.fillStyle = g; c.fillRect(0, 0, PW, PH); }
    else { for (let i = 0; i < 4; i++) { const x = bx + (i - 1.5) * 5, h = 8 + r() * 18, w = 2.5; c.fillStyle = rgba(c1, 0.85); c.beginPath(); c.moveTo(x - w, by); c.lineTo(x - w, by - h + 3); c.lineTo(x, by - h); c.lineTo(x + w, by - h + 3); c.lineTo(x + w, by); c.closePath(); c.fill(); c.fillStyle = rgba('#FFFFFF', 0.5); c.fillRect(x - w, by - h + 3, 1, h - 3); } } }
  return cv;
}
function pythTips(c, x, y, s, a, d, t) {   // only the leafy squares of a Pythagoras tree (the last four levels)
  const ux = Math.cos(a) * s, uy = Math.sin(a) * s, vx = uy, vy = -ux;
  if (d <= 4) { c.moveTo(x, y); c.lineTo(x + ux, y + uy); c.lineTo(x + ux + vx, y + uy + vy); c.lineTo(x + vx, y + vy); c.closePath(); }
  if (d === 0) return;
  const s1 = s * Math.cos(t), s2 = s * Math.sin(t), tx = x + vx, ty = y + vy;
  pythTips(c, tx, ty, s1, a - t, d - 1, t); pythTips(c, tx + Math.cos(a - t) * s1, ty + Math.sin(a - t) * s1, s2, a - t + Math.PI / 2, d - 1, t);
}
function shardImg(wd, ps) {   // the shard: a little Sierpiński with a shine
  const S2 = 28, cv = mk(S2 * ps, S2 * ps), c = cv.getContext('2d'); c.setTransform(ps, 0, 0, ps, 0, 0); c.translate(S2 / 2, S2 / 2 + 1);
  c.fillStyle = wd.shard; c.beginPath(); sierp(c, 0, 0, 20, 2); c.fill();
  c.strokeStyle = rgba('#000000', 0.35); c.lineWidth = 0.8; c.beginPath(); sierp(c, 0, 0, 20, 0); c.stroke();
  c.fillStyle = rgba('#FFFFFF', 0.75); c.beginPath(); sierp(c, 0, -4.33, 10, 0); c.fill();
  return cv;
}
function sunImg(wd, ps) {
  const s = wd.sun, R0 = s.r * (s.haze ? 4 : 3), cv = mk(R0 * 2 * ps, R0 * 2 * ps), c = cv.getContext('2d'); c.setTransform(ps, 0, 0, ps, 0, 0);
  const g = c.createRadialGradient(R0, R0, 0, R0, R0, R0); g.addColorStop(0, rgba(s.c, s.haze ? 0.75 : 0.5)); g.addColorStop(s.haze ? 0.3 : 0.35, rgba(s.c, s.haze ? 0.3 : 0.12)); g.addColorStop(1, rgba(s.c, 0)); c.fillStyle = g; c.fillRect(0, 0, R0 * 2, R0 * 2);
  if (!s.haze || wd.key === 'dragon') { c.fillStyle = s.c; c.beginPath(); c.arc(R0, R0, s.r, 0, 7); c.fill(); }
  if (s.moon) { c.fillStyle = rgba('#9DB0D8', 0.45); for (const [dx, dy, rr] of [[-5, -3, 4], [4, 5, 3], [5, -6, 2]]) { c.beginPath(); c.arc(R0 + dx, R0 + dy, rr, 0, 7); c.fill(); } }
  if (wd.key === 'dragon') { c.fillStyle = rgba('#9A3A2A', 0.35); for (let i = 0; i < 4; i++) c.fillRect(R0 - s.r, R0 + 6 + i * 9, s.r * 2, 2.5 + i); }
  return cv;
}
function skyFor(L, wd, w) {   // the sky, its details and the sun in one opaque picture W wide (rebuilt when the stage widens)
  const Hh = L.Hh, ss = Math.min(L.k, 2), cv = mk((w + 16) * ss, (Hh + 16) * ss), c = ctxOf(cv, true); c.setTransform(ss, 0, 0, ss, 8 * ss, 8 * ss);   // 8 units of slack round it, for the shake
  const g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, wd.sky[0]); g.addColorStop(0.55, wd.sky[1]); g.addColorStop(1, wd.sky[2]); c.fillStyle = g; c.fillRect(-9, -9, w + 18, Hh + 18);
  if (L.sun) { const sw = L.sun.width / Math.min(L.k, 2.5); c.drawImage(L.sun, wd.sun.x * w - sw / 2, wd.sun.y * Hh - sw / 2, sw, sw); }
  bgLayer(c, wd, 0, rng(L.wi * 7919 + 1), Hh, w); L.skyImg = cv; L.skyW = w; L.skyS = ss;
}
const looks = new Map();
function lookFor(wi, k, Hh, full) {
  let L = looks.get(wi);
  if (L && L.done && (Math.abs(L.k - k) / k > 0.33 || Math.abs(L.Hh - Hh) / Hh > 0.33) && performance.now() - L.at > 400) { looks.delete(wi); L = null; }
  if (!L) {
    const wd = WORLDS[wi], ls = Math.min(k, 1.5), ps = Math.min(k, 2.5);
    L = { wi, k, Hh, at: performance.now(), layers: [], plants: [], done: false, steps: [] };
    for (let li = 1; li < 4; li++) L.steps.push(() => { const s = li === 1 ? ls : Math.min(k, 2), y0 = LB[li][0] * Hh, bh = (LB[li][1] - LB[li][0]) * Hh, cv = mk(TILE * s, bh * s), c = cv.getContext('2d'); c.setTransform(s, 0, 0, s, 0, -y0 * s); bgLayer(c, wd, li, rng(wi * 7919 + li * 104729 + 1), Hh); L.layers[li] = cv; cv.s = s; });
    L.steps.push(() => { L.sun = wd.sun ? sunImg(wd, ps) : null; L.shard = shardImg(wd, ps); skyFor(L, wd, W); });
    L.steps.push(() => { L.tex = texTile(wd, Math.min(k, 2), Hh); L.pat = null; });
    L.steps.push(() => { for (let v = 0; v < 4; v++) L.plants[v] = plantImg(wd, v, ps);
      const ab = mk(2, 64), ac = ab.getContext('2d'), ag = ac.createLinearGradient(0, 0, 0, 64); ag.addColorStop(0, rgba(wd.edge, 0)); ag.addColorStop(1, rgba(wd.edge, 0.5)); ac.fillStyle = ag; ac.fillRect(0, 0, 2, 64); L.abyss = ab; L.done = true; });
    for (const key of [...looks.keys()]) if (key !== wi && key !== (depth - 1) % WORLDS.length) looks.delete(key);
    looks.set(wi, L);
  }
  if (full) while (L.steps.length) L.steps.shift()(); else if (L.steps.length) L.steps.shift()();
  return L;
}

// --- the ground, sampled once a frame at fixed world steps (so it never swims) and shared by every pass
const SX = 5; let gys = new Float32Array(256), gx0 = 0, gsn = 0;
function sampleGround(g, quake) {
  const n = Math.ceil((W + 40) / SX) + 2; if (gys.length < n) gys = new Float32Array(n + 64);
  gx0 = Math.floor((g.cam - 16) / SX) * SX;
  const gaps = g.obs.filter((o) => o.type === 'gap' && o.x < g.cam + W + 30 && o.x + o.w > g.cam - 30);
  for (let i = 0; i < n; i++) { const wx = gx0 + i * SX; let gp = false; for (const o of gaps) if (wx > o.x && wx < o.x + o.w) { gp = true; break; } gys[i] = gp ? NaN : groundY(wx) + quake; }
  gsn = n; return gaps;
}
const gyScreen = (sx) => { const f = (game.cam + sx - gx0) / SX, i = Math.max(0, Math.min(gsn - 2, Math.floor(f))), a = gys[i], b = gys[i + 1]; return a !== a ? b : b !== b ? a : a + (b - a) * (f - i); };
function drawGround(g, L, wd, Hh, t) {
  const fill = new Path2D(), rim = new Path2D(); let open = false, last = 0;
  for (let i = 0; i < gsn; i++) { const y = gys[i], sx = gx0 + i * SX - g.cam;
    if (y !== y) { if (open) { fill.lineTo(last, Hh + 400); fill.closePath(); open = false; } continue; }
    if (!open) { fill.moveTo(sx, Hh + 400); fill.lineTo(sx, y); rim.moveTo(sx, y); open = true; } else { fill.lineTo(sx, y); rim.lineTo(sx, y); }
    last = sx; }
  if (open) { fill.lineTo(last, Hh + 400); fill.closePath(); }   // past the bottom: the stage's margin shows ground, not sky
  if (!L.pat) { L.pat = ctx.createPattern(L.tex, 'repeat-x'); L.patS = L.tex.width / TEX; }   // the texture is a tall strip with the ground's dark-down gradient in it: one fill
  const off = ((g.cam % TEX) + TEX) % TEX; L.pat.setTransform?.(new DOMMatrix([1 / L.patS, 0, 0, 1 / L.patS, snap(-off, 0), snap(0, 1)])); ctx.fillStyle = L.pat; ctx.fill(fill);
  // the escape-time bands: the coast's own shape, repeated down into the ground
  ctx.lineWidth = 3; ctx.lineJoin = 'round';
  for (let bi = 0; bi < 4; bi++) { ctx.strokeStyle = wd.bands[bi]; ctx.globalAlpha = A * (0.42 - bi * 0.07); ctx.save(); ctx.translate(0, 9 + bi * 10); ctx.stroke(rim); ctx.restore(); }
  ctx.globalAlpha = A;
  // the rim: a wide soft glow, the bright edge, a white shine on top
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(wd.edge, 0.22); ctx.lineWidth = 8; ctx.stroke(rim);
  ctx.strokeStyle = wd.edge; ctx.lineWidth = 2.5; ctx.stroke(rim);
  ctx.save(); ctx.translate(0, -1); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.8; ctx.stroke(rim); ctx.restore();
}
function drawPlants(g, L, wd, t) {   // seeded along the road: the same plant is always in the same place
  const STEP = 30, s = g.seed + depth * 1000, i0 = Math.floor((g.cam - 30) / STEP), i1 = Math.floor((g.cam + W + 30) / STEP), sway = wd.key === 'fern' || wd.key === 'woods' || wd.key === 'julia', spiky = wd.key === 'dawn' || wd.key === 'koch' || wd.key === 'magma' || wd.key === 'storm';   // spiky plants stay small and dim: nothing on the ridge may read as a spike
  ctx.globalAlpha = A * (spiky ? 0.6 : 0.85);
  for (let i = i0; i <= i1; i++) {
    const h = hash(i * 977 + s); if (h > 0.55) continue;
    const wx = i * STEP + hash(i * 31 + s) * STEP, sx = wx - g.cam, y = gyScreen(sx); if (y !== y || inGapFast(wx)) continue;
    const v = Math.floor(hash(i * 57 + s) * 4), sc = (spiky ? 0.5 : 0.65) + hash(i * 13 + s) * (spiky ? 0.35 : 0.6), img = L.plants[v]; if (!img) continue;
    ctx.save(); ctx.translate(sx, y + 3); if (sway) ctx.transform(1, 0, Math.sin(t / 700 + i) * 0.12, 1, 0, 0); if (hash(i * 3 + s) < 0.5) ctx.scale(-1, 1);
    ctx.drawImage(img, -PW / 2 * sc, -PH * sc, PW * sc, PH * sc); ctx.restore();
  }
  ctx.globalAlpha = A;
}
let frameGaps = [];
const inGapFast = (x) => { for (const o of frameGaps) if (x > o.x && x < o.x + o.w) return true; return false; };
function drawAmbient(g, wd, Hh, t) {   // the world's own air: motes, spores, snow, embers, bubbles, leaves, dust, sparks
  const N = 28, cam = g ? g.cam : t / 40, k = wd.amb, Wr = W + 40, ts = t / 1000, col = wd.mote, wi = (depth - 1) % WORLDS.length;
  if (k === 'leaves') ctx.beginPath();
  ctx.globalCompositeOperation = k === 'leaves' || k === 'snow' || k === 'dust' ? 'source-over' : 'lighter';
  for (let i = 0; i < N; i++) {
    const h1 = hash(i * 13 + wi * 101), h2 = hash(i * 29 + 7), h3 = hash(i * 71 + 3), par = 0.3 + h3 * 0.5;
    let vx = 0, vy = 0;
    if (k === 'snow') { vy = 25 + h2 * 35; vx = 8; } else if (k === 'embers' || k === 'bubbles') vy = -(18 + h2 * 30); else if (k === 'leaves') { vy = 22 + h2 * 20; vx = 15; } else if (k === 'dust') vx = 60 + h2 * 80; else if (k === 'motes' || k === 'spores') vy = -6 - h2 * 6;
    const x = ((((h1 * Wr * 7 - cam * par - ts * vx + Math.sin(ts * (0.6 + h2) + i) * 12) % Wr) + Wr) % Wr) - 20, y = ((((h2 * Hh * 3 + ts * vy) % Hh) + Hh) % Hh);
    const tw = 0.5 + 0.5 * Math.sin(ts * (2 + h3 * 3) + i * 1.7);
    if (k === 'snow') { ctx.globalAlpha = A * (0.5 + h3 * 0.5); ctx.fillStyle = col; const s = 1 + h3 * 2.2; ctx.fillRect(x, y, s, s); }
    else if (k === 'leaves') { const rot = ts * (1 + h3 * 2) + i; ctx.moveTo(x + 3.2 * Math.cos(rot), y + 3.2 * Math.sin(rot)); ctx.ellipse(x, y, 3.2, 1.4, rot, 0, 7); }
    else if (k === 'dust') { ctx.globalAlpha = A * 0.18 * (0.4 + h3); ctx.fillStyle = col; ctx.fillRect(x, y * 0.4 + Hh * 0.5, 14 + h3 * 20, 1); }
    else if (k === 'bubbles') { ctx.globalAlpha = A * 0.45; ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x + Math.sin(ts * 2 + i) * 3, y, 1.5 + h3 * 3, 0, 7); ctx.stroke(); }
    else if (k === 'sparks') { if (tw > 0.85) { ctx.globalAlpha = A * (tw - 0.85) * 6; ctx.drawImage(glowOf(col), x - 5, y - 5, 10, 10); } }
    else { const r = (k === 'embers' ? 3 : 4) * (0.6 + h3); ctx.globalAlpha = A * (k === 'spores' ? tw * tw : 0.35 + tw * 0.5); ctx.drawImage(glowOf(col), x - r, y - r, r * 2, r * 2); }
  }
  if (k === 'leaves') { ctx.globalAlpha = A * 0.8; ctx.fillStyle = col; ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = A;
}
function drawObstacles(g, wd, L, Hh, t, quake) {
  const fogA = g.fog;
  for (const o of g.obs) {
    const sx = o.x - g.cam;
    if (sx < -60 || sx > W + 60 || o.type === 'gap') continue;
    const near = fogA ? Math.max(0, Math.min(1, 1 - (sx - PX - 60) / 120)) : 1;
    A = (g.dive ? 1 - g.dive.t / g.dive.dur * 0.7 : 1) * Math.max(0.05, fogA ? near : 1); ctx.globalAlpha = A;
    if (o.type === 'spike') {
      const w = o.n * 14, by = groundY(o.x + w / 2) + quake;
      glow(sx + w / 2, by - 6, w * 0.6 + 14, wd.spike, 0.45);
      ctx.beginPath(); for (let i = 0; i < o.n; i++) { const x = sx + i * 14, y = groundY(o.x + i * 14 + 7) + quake; ctx.moveTo(x, y + 2); ctx.lineTo(x + 7, y - 20); ctx.lineTo(x + 14, y + 2); ctx.closePath(); }
      ctx.fillStyle = wd.spike; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < o.n; i++) { const x = sx + i * 14, y = groundY(o.x + i * 14 + 7) + quake; ctx.moveTo(x + 1.5, y + 2); ctx.lineTo(x + 7, y - 20); ctx.lineTo(x + 7, y + 2); ctx.closePath(); }
      ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
      ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < o.n; i++) { const y = groundY(o.x + i * 14 + 7) + quake; ctx.globalAlpha = A * (0.5 + 0.5 * Math.sin(t / 200 + i + o.x)); ctx.fillRect(sx + i * 14 + 6.2, y - 19, 1.6, 1.6); }
      ctx.globalAlpha = A;
    } else if (o.type === 'bolt') {
      const gy = groundY(o.x) + quake;
      if (!o.struck) { const pul = 0.5 + 0.5 * Math.sin(t / 60);
        ctx.strokeStyle = '#FFE08A'; ctx.globalAlpha = A * (0.3 + 0.4 * pul); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, gy); ctx.stroke(); ctx.setLineDash([]);
        const rr = 10 + (1 - o.t / 0.9) * 8; ctx.globalAlpha = A * (0.5 + 0.5 * pul); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, gy, rr, rr * 0.3, 0, 0, 7); ctx.stroke();
        ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.moveTo(sx - 10, gy); ctx.lineTo(sx + 10, gy); ctx.lineTo(sx, gy - 8); ctx.closePath(); ctx.fill(); glow(sx, gy, 18, '#FFE08A', 0.4 * pul); }
      else { const f = Math.max(0, o.flash / 0.3), r = rng((o.x * 13) | 0), p = new Path2D(); let yy = 0, xx = sx; p.moveTo(xx, yy);
        while (yy < gy) { yy += 22; xx += (Math.random() - 0.5) * 22; p.lineTo(xx, Math.min(yy, gy)); if (r() < 0.25 && yy < gy - 40) { p.moveTo(xx, yy); p.lineTo(xx + (r() - 0.5) * 40, yy + 30); p.moveTo(xx, yy); } }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const [lw, cl] of [[10, 'rgba(255,224,138,0.25)'], [4, '#FFE08A'], [1.6, '#FFFFFF']]) { ctx.strokeStyle = cl; ctx.lineWidth = lw; ctx.globalAlpha = A * f; ctx.stroke(p); }
        glow(sx, gy, 46, '#FFE08A', f); ctx.fillStyle = `rgba(255,248,220,${0.22 * f})`; ctx.fillRect(-W, -Hh, W * 3, Hh * 3); ctx.globalAlpha = A; }
    } else if (o.type === 'drone') {
      const y = groundY(o.x) - o.lift + Math.sin(o.ph) * 8, sp = (t / 30) % 6.28, gy = groundY(o.x) + quake;
      ctx.fillStyle = 'rgba(255,95,176,0.1)'; ctx.beginPath(); ctx.moveTo(sx - 4, y + 5); ctx.lineTo(sx + 4, y + 5); ctx.lineTo(sx + 16, gy); ctx.lineTo(sx - 16, gy); ctx.closePath(); ctx.fill();
      glow(sx, y, 22, '#FF5FB0', 0.5);
      ctx.save(); ctx.translate(sx, y); ctx.rotate(Math.sin(o.ph) * 0.12);
      ctx.fillStyle = '#2A1F4A'; ctx.strokeStyle = '#FF5FB0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.roundRect(-11, -5, 22, 11, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(61,242,224,0.55)'; ctx.beginPath(); ctx.arc(0, -5, 5, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#FFD1EA'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.moveTo(-6, -5); ctx.lineTo(-12, -8); ctx.moveTo(6, -5); ctx.lineTo(12, -8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,209,234,0.55)'; ctx.beginPath(); ell(ctx, -12, -8.5, 8 * Math.abs(Math.cos(sp)) + 0.1, 1.6); ell(ctx, 12, -8.5, 8 * Math.abs(Math.sin(sp)) + 0.1, 1.6); ctx.fill();
      const ex = Math.sin(t / 260 + o.ph) * 6; ctx.fillStyle = '#FF2E5A'; ctx.beginPath(); ctx.arc(ex, 1, 2.4, 0, 7); ctx.fill(); ctx.restore();
      glow(sx + ex, y + 1, 7, '#FF2E5A', 0.9);
    } else if (o.type === 'shard') {
      const y = groundY(o.x) - o.lift, sp = Math.sin(t / 250 + o.t) * 0.5 + 0.5;
      glow(sx, y, 16 + sp * 8, wd.shard, 0.55 + sp * 0.3);
      ctx.save(); ctx.translate(sx, y); ctx.rotate(t / 700 + o.t); ctx.drawImage(L.shard, -14, -15, 28, 28); ctx.restore();
      if (sp > 0.9) glow(sx + 4, y - 6, 5, '#FFFFFF', (sp - 0.9) * 10);
    }
  }
  A = g.dive ? 1 - g.dive.t / g.dive.dur * 0.7 : 1; ctx.globalAlpha = A;
}
function drawParts(g) {
  for (const p of g.parts) {
    const e = p.t / p.life, x = p.x - g.cam;
    if (p.k === 1) { glow(x, p.y, (p.s || 4) * 2 * (1 - e * 0.5), p.c, 1 - e); continue; }
    ctx.globalAlpha = A * (1 - e);
    if (p.k === 2) { ctx.strokeStyle = p.c; ctx.lineWidth = 2.5 * (1 - e) + 0.5; ctx.beginPath(); ctx.arc(x, p.y, p.s + p.r * Math.sqrt(e), 0, 7); ctx.stroke(); }
    else if (p.k === 3) { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, p.y); ctx.lineTo(x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke(); }
    else if (p.k === 4) { ctx.globalAlpha = A * (1 - e) * 0.55; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, p.y, p.s * (0.6 + e), 0, 7); ctx.fill(); }
    else { const s = p.s || 4; ctx.fillStyle = p.c; ctx.fillRect(x - s / 2, p.y - s / 2, s, s); }
  }
  ctx.globalAlpha = A;
}
function draw(t) {
  W = host?.W || W;
  const g = game, wi = ((g ? depth : 1) - 1) % WORLDS.length, wd = WORLDS[wi], k = host.k, Hh = H();
  const L = lookFor(wi, k, Hh, true);
  if (g && !g.dive && g.time > depth * DEPTH_S - 6) lookFor(depth % WORLDS.length, k, Hh, false);   // build the next world a piece a frame
  ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0);
  if (g?.shake) { ctx.translate((Math.random() - 0.5) * 10 * g.shake, (Math.random() - 0.5) * 10 * g.shake); }
  if (g?.twist?.k === 'mirror') { ctx.translate(W, 0); ctx.scale(-1, 1); }   // 🪞 the world flips (the HUD stays put)
  // The dive: the world swells around you, into itself.
  A = 1; if (g?.dive) { const p = g.dive.t / g.dive.dur, z = 1 + p * p * 3; ctx.translate(PX, g.py); ctx.scale(z, z); ctx.translate(-PX, -g.py); A = 1 - p * 0.7; }
  ctx.globalAlpha = A;
  if (Math.abs(L.skyW - W) > W * 0.12) skyFor(L, wd, W);
  if ((host.ox || 0) > 0 || (host.oy || 0) > 0 || g?.dive) { ctx.fillStyle = wd.sky[0]; ctx.fillRect(-W, -Hh, W * 3, Hh * 3); }
  ctx.drawImage(L.skyImg, snap(-8, 0), snap(-8, 1), L.skyImg.width / L.skyS, L.skyImg.height / L.skyS);
  const cam = g ? g.cam : t / 40;
  if (wd.key === 'storm') { const n = Math.floor(t / 4300), ph = (t % 4300) / 4300; if (ph < 0.06 || (ph > 0.09 && ph < 0.12)) { const r = rng(n * 31 + 7), x = W * (0.15 + r() * 0.7), p = new Path2D(); bolt(p, x, 0, x + (r() - 0.5) * 80, Hh * 0.62, 90, 6, r, true);
    ctx.lineCap = 'round'; for (const [lw, cl] of [[8, 'rgba(180,164,255,0.25)'], [2, '#F0ECFF']]) { ctx.strokeStyle = cl; ctx.lineWidth = lw; ctx.stroke(p); } ctx.fillStyle = 'rgba(220,210,255,0.12)'; ctx.fillRect(-W, -Hh, W * 3, Hh * 3); } }
  for (let li = 1; li < 4; li++) { const img = L.layers[li], y0 = LB[li][0] * Hh, bh = (LB[li][1] - LB[li][0]) * Hh; if (!img) continue; const off = ((cam * PARS[li]) % TILE + TILE) % TILE, dw = img.width / img.s, dh = img.height / img.s, yy = snap(y0, 1); for (let x = -off - TILE; x < W + 10; x += TILE) if (x + TILE > -20) ctx.drawImage(img, snap(x, 0), yy, dw, dh); }   // dw ≥ TILE (the canvas rounds up), so tiles overlap a hair: no seam
  if (!g) { drawAmbient(null, wd, Hh, t); ctx.globalAlpha = 1; return; }
  const quake = g.twist?.k === 'quake' ? Math.sin(g.time * 9) * 12 : 0;
  frameGaps = sampleGround(g, quake);
  // Chasms: the deep glows, motes rise out of it.
  for (const o of frameGaps) { const x0 = o.x - g.cam; const top = Math.max(groundY(o.x), groundY(o.x + o.w)) + quake + 16; ctx.fillStyle = wd.ground[1]; ctx.fillRect(x0 - 6, top, o.w + 12, Hh + 400 - top);   /* a dark pit below the lower lip, the scenery above it */ ctx.drawImage(L.abyss, x0, Math.max(top, Hh * 0.5), o.w, Hh + 12 - Math.max(top, Hh * 0.5)); ctx.fillStyle = rgba(wd.edge, 0.5); ctx.fillRect(x0, Hh + 11, o.w, 400);
    for (let i = 0; i < 4; i++) { const u = ((t / 1800 + i / 4 + o.x * 0.01) % 1); glow(x0 + o.w * (0.2 + 0.6 * hash(i + (o.x | 0))), Hh - u * Hh * 0.35, 3, wd.edge, (1 - u) * 0.8); } }
  drawGround(g, L, wd, Hh, t);
  drawPlants(g, L, wd, t);
  // Fig's shadow on the ground
  { const gy = gyScreen(PX); if (gy === gy) { const up = Math.max(0, gy - (g.py + R)), s = Math.max(0.3, 1 - up / 160); ctx.globalAlpha = A * 0.35 * s; ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.ellipse(PX, gy + 1, R * 1.1 * s, R * 0.28 * s, 0, 0, 7); ctx.fill(); ctx.globalAlpha = A; } }
  drawObstacles(g, wd, L, Hh, t, quake);
  if (g.pk && host.pocket?.offering?.()) drawPocketShard(g, wd, L, t);
  drawAmbient(g, wd, Hh, t);
  // 🌑 Blackout: only a circle of your own glow.
  if (g.dark > 0.02) { const dg = ctx.createRadialGradient(PX, g.py, 30, PX, g.py, 110); dg.addColorStop(0, '#0000'); dg.addColorStop(1, `rgba(4,3,12,${0.97 * g.dark})`); ctx.fillStyle = dg; ctx.fillRect(-W, -Hh, W * 3, Hh * 3); }
  // Fog rolls in from the right.
  if (g.fog > 0.02) { const fg = ctx.createLinearGradient(PX + 40, 0, W, 0); fg.addColorStop(0, '#0000'); fg.addColorStop(1, `rgba(20,18,50,${0.96 * g.fog})`); ctx.fillStyle = fg; ctx.fillRect(0, 0, W, Hh); }
  drawParts(g);
  // You: Fig, leaning into the run, flickering while invulnerable, ablaze (with afterimages) while dashing.
  const lean = Math.max(-0.5, Math.min(0.5, g.vy / 1400)) + (g.onGround ? 0 : t / 300 % 0.3 - 0.15), mood = S.curve.mood || 'calm';
  if (g.dashing) {
    glow(PX, g.py, 40, wd.edge, 0.55);
    ctx.strokeStyle = wd.edge; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const yy = g.py + (i - 2) * 5, L2 = 18 + ((t / 7 + i * 37) % 26); ctx.globalAlpha = A * 0.5; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(PX - R - 4 - L2, yy); ctx.lineTo(PX - R - 4, yy); ctx.stroke(); }
    for (let i = 2; i >= 1; i--) { const py = g.trail[Math.max(0, g.trail.length - 1 - i * 3)] ?? g.py; ctx.save(); ctx.translate(PX - i * 12, py); ctx.rotate(lean); ctx.scale(1.25, 0.85); drawPal(mood, ctx, { x: 0, y: 0, s: R, t: t / 1000, r: S.curve.r, face: 1, alpha: A * (0.36 - i * 0.12) }); ctx.restore(); }
    ctx.globalAlpha = A;
  }
  if (g.inv <= 0 || g.shield > 0 || Math.floor(t / 70) % 2 === 0) {
    ctx.save(); ctx.translate(PX, g.py); ctx.rotate(lean);
    if (g.dashing) ctx.scale(1.25, 0.85);
    drawPal(mood, ctx, { x: 0, y: 0, s: R, t: t / 1000, r: S.curve.r, face: 1, hurt: g.inv > 0 && !(g.shield > 0), alpha: A });   // 🟢 you are Fig, leaning into the run
    ctx.restore();
  }
  if (g.shield > 0) drawShield(g, wd, t);
  ctx.globalAlpha = 1;
  // 🌊 going under: the deeper you're zoned in, the more the run becomes a tunnel: triangles open toward you from the
  // vanishing point ahead, each with the Sierpiński hole in it, and streaks rush past at your speed
  { const f = host.deep?.() || 0; if (f > 0.02) { ctx.save(); ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0);
    const vx = W * 0.82, vy = Hh * 0.45, tri = (r) => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * 2.094; ctx[i ? 'lineTo' : 'moveTo'](vx + Math.cos(a) * r, vy + Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); };
    for (let i = 0; i < 6; i++) { const u = ((t / 2600 + i / 6) % 1), r = 10 + u * u * Math.hypot(W, Hh) * 1.1; ctx.strokeStyle = `rgba(61,242,224,${0.28 * f * (1 - u)})`; ctx.lineWidth = 1 + 3 * u; tri(r); ctx.lineWidth = 0.6 + 1.5 * u; ctx.save(); ctx.translate(vx, vy); ctx.rotate(Math.PI); ctx.translate(-vx, -vy); tri(r / 2); ctx.restore(); }
    ctx.strokeStyle = `rgba(255,255,255,${0.22 * f})`; ctx.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const y = ((i * 61.7) % Hh), x = W - ((t / 2 + i * 137) % (W + 200)), L = 40 + 60 * f; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke(); }
    ctx.restore(); } }
  if (g.dive) { ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0); ctx.fillStyle = `rgba(255,255,255,${(g.dive.t / g.dive.dur) ** 3 * 0.9})`; ctx.fillRect(0, 0, W, Hh); }
}

// 💠 the way into the pocket: a shard bigger than the rest, floating just ahead of you, turning slowly
function drawPocketShard(g, wd, L, t) {
  const p = g.pk, x = p.sx, y = p.y, pu = 0.5 + 0.5 * Math.sin(t / 260);
  glow(x, y, 30 + pu * 10, wd.shard, 0.7 + 0.25 * pu); glow(x, y, 16, '#FFFFFF', 0.35 + 0.3 * pu);
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t / 900) * 0.35); ctx.drawImage(L.shard, -24, -26, 48, 48); ctx.restore();
}
// 💠 the shard shield: a turning Sierpiński round you, fading in its last second
function drawShield(g, wd, t) {
  const a = Math.min(1, g.shield) * (0.75 + 0.25 * Math.sin(t / 120)), r = R * 2.1;
  glow(PX, g.py, r * 1.5, wd.shard, 0.35 * a);
  ctx.save(); ctx.translate(PX, g.py); ctx.rotate(t / 700); ctx.globalAlpha = A * a; ctx.strokeStyle = wd.shard; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  ctx.beginPath(); sierp(ctx, 0, r * 0.18, r * 2, 1); ctx.stroke(); ctx.restore(); ctx.globalAlpha = A;
}

// ---------------------------------------------------------------- the organ
const press = () => { if (!game || S.over) return; jump(); clearTimeout(holdT); holdT = setTimeout(() => { if (game && !S.over && game.dash > 0.15) game.dashing = true; }, 170); };
const release = () => { clearTimeout(holdT); if (game) game.dashing = false; };
const organ = {
  key: 'fractal', name: 'Fractal Dash', icon: '🔺', verb: 'tap to jump · hold to dash', beat: 0.7,
  theme: { bg: '#0B0A1F', gold: '#F5C542', bannerc: '#C9FFF8' },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__fd = organ.debug; },
  start() { newGame(); },
  enter(from) {
    if (!game) newGame();
    dashEl = host.ui('<div class="dash" aria-hidden="true"><i></i></div>').querySelector('i');
    if (from) { game.inv = 1.2; game.obs = game.obs.filter((o) => o.type === 'shard' || o.x > game.cam + W + 40); }   // a morph lands you mid-run: a breath, nothing under your feet yet
  },
  leave() { release(); dashEl = null; return game ? { x: PX, y: game.py } : null; },
  update, draw, onBeat,
  pointer(type) { if (type === 'down') press(); else if (type === 'up') release(); },
  keydown(e) { if (e.repeat) return; if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); } if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowRight') { if (game && game.dash > 0.15) game.dashing = true; } },
  keyup(e) { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowRight') release(); },
  // 🕳️ the pocket: a shard floating just ahead of you is the way in (it keeps pace with you while it glows)
  pocket: shardPocket,
  pocketSpot() {
    const g = game; if (!g || g.dive || S.over) return null;
    shardPocket.prepare?.(3);   // find the spot in the set while the shard glows, so the dive is instant
    const sx = Math.min(W - 40, PX + 120), gy = groundY(g.cam + sx), ty = Math.max(70, gy - 70) + Math.sin(g.time * 2.2) * 5;
    if (!g.pk) g.pk = { sx, y: ty }; g.pk.sx += (sx - g.pk.sx) * 0.15; g.pk.y += (ty - g.pk.y) * 0.08;
    return { x: g.twist?.k === 'mirror' ? W - g.pk.sx : g.pk.sx, y: g.pk.y, r: 20, icon: '💠' };
  },
  pocketSeed: () => ({ world: world(), depth, seed: Math.floor(Math.random() * 1e9) }),
  pocketReward(res) {
    release(); const g = game; if (!g) return; g.pk = null;
    g.inv = Math.max(g.inv, 1.2); g.obs = g.obs.filter((o) => o.type === 'shard' || o.x > g.cam + W + 40 || o.x + (o.w || (o.n || 0) * 14) < g.cam + PX - 30);   // a breath on the way back: nothing under your feet yet
    if (!res) return; const gf = res.gift || {};
    if (gf.dash) g.dash = DASH_MAX;
    if (gf.heal) { if ((S.lives?.[organ.key] ?? 3) < 3) host.heal(1); else host.add(150); }
    if (gf.shield) { g.shield = gf.shield; g.inv = Math.max(g.inv, 0.2); }
    for (let i = 0; i < 18; i++) g.parts.push({ x: g.cam + PX, y: g.py, vx: (Math.random() - 0.5) * 280, vy: (Math.random() - 0.8) * 280, t: 0, life: 0.7, c: i % 2 ? world().shard : '#FFFFFF', k: i % 3 ? 1 : 3, s: 5 });
    g.parts.push({ x: g.cam + PX, y: g.py, vx: 0, vy: 0, t: 0, life: 0.5, c: world().shard, k: 2, s: 8, r: 46, gr: 0 }); sfx('chime', { hi: true });
  },
  hudLine: () => (game ? `${world().icon} Depth ${depth} · ${Math.floor(game.dist / 10).toLocaleString()} m · ${Math.max(0, Math.ceil(depth * DEPTH_S - game.time))}s` : ''),
  level: () => depth,
  overText: (how) => [how === 'fell' ? '🕳️ INTO THE DEEP' : how === 'zapped' ? '⚡ ZAPPED' : how === 'spiked' ? '💥 SPIKED' : 'RUN OVER', ''],
  endStats: () => (game ? `🔺 ${Math.floor(game.dist / 10).toLocaleString()} m at depth ${depth}, ${game.shards.toLocaleString()} from shards` : ''),
  debug: () => game && ({ score: S.score, depth, drones: game.obs.filter((o) => o.type === 'drone').length, W, hearts: S.hearts, dist: game.dist, speed: game.speed, py: game.py, onGround: game.onGround, dashing: game.dashing, dash: game.dash, r: S.curve.r, over: S.over,
    obs: game.obs.map((o) => ({ ...o, sx: o.x - game.cam })), twist: game.twist?.k || null, W, H: H(), PX, groundY: groundY(game.cam + PX), gyAt: (sx) => groundY(game.cam + sx),
    world: world().key, worldName: world().name, parts: game.parts.length, looks: [...looks.keys()], look: () => looks.get((depth - 1) % WORLDS.length), goDepth: (n) => { depth = Math.max(1, n) - 1; game.time = depth * DEPTH_S; dive(); },   // 🗺️ jump to a depth's world (tests)
    shield: game.shield, inv: game.inv, drain: () => { game.dash = 0; }, guard: (sec = 30) => { game.shield = sec; }, spikeHere: () => { game.obs.push({ type: 'spike', x: game.cam + PX - 14, n: 3 }); }, lives: S.lives?.fractal ?? 3, pocketSpot: game.pk && { x: game.pk.sx, y: game.pk.y },
    force: (k) => { const t = TWISTS.find((x) => x.k === k); game.twist = { ...t, t: 0 }; game.twistAt = game.time; S.hearts = 3; }, jump, hurt: () => hurt('spiked') }),
};
export default organ;
