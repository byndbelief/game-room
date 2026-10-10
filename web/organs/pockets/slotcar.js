// 🏎️🕳️ THROUGH THE TOASTER: Rally's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a Rally race, the thing coming up the road glows (the toaster or the course's ramp, a fork's centrepiece: the
// fruit bowl, the toy box, the mug, the snow globe, the fountain), and only while it's ahead and well clear; tap it and
// you drop inside. In there is a slot-car track in the place's colours, Fig's car locked in the slot. Throttle only: hold
// anywhere to go, let go to brake. Take a bend too fast and the tail swings out, then off the track you fly (back in the
// slot a moment later, standing still: that's all it costs). Three laps before the time runs out (22 s), and a ghost car
// to beat. Back up on the road you come out the far side of the thing with a burst of nitro and a life back.
//
// Random in its own way: a DOUBLE PENDULUM. Two arms, one hinged on the end of the other: as plain as physics gets, and
// still chaotic, since the smallest change in how it starts sends it somewhere else entirely after a few swings. Every
// pocket lets a fresh one go from its own start for ten seconds and traces the outer bob's path; that scribble, smoothed
// (its first five harmonics) and blown up just enough to make one clean loop with room for every bend, is the track. It
// keeps swinging in the corner while you race, and its raw scribble lies faint under the track.
import { drawPal } from '../../pals.js';

const DUR = 22, LAPS = 3, TW = 26, N = 360, RMIN = 22, CAR_S = 0.85, IDEAL = 14, GHOST = 17.5, ACC = 2.0, DECEL = 2.2, FLY = 0.65, BLINK = 0.6;
const THINGS = {
  toaster: { icon: '🍞', name: 'Through the toaster', wall: '#5E6573', inside: '#2A1A14', motif: 'coils' },
  ramp: { icon: '🎢', name: 'Inside the ramp', wall: '#5A3A1E', inside: '#8A5A2B', motif: 'planks' },
  fruitbowl: { icon: '🍎', name: 'Into the fruit bowl', wall: '#163F8A', inside: '#4F8FD8', motif: 'rings' },
  toybox: { icon: '🧸', name: 'Into the toy box', wall: '#4A2C10', inside: '#A8743F', motif: 'planks' },
  mug: { icon: '☕', name: 'Into the mug', wall: '#163F8A', inside: '#4A2814', motif: 'rings' },
  snowglobe: { icon: '🔮', name: 'Into the snow globe', wall: '#3B2412', inside: '#7FB8D8', motif: 'snow' },
  fountain: { icon: '⛲', name: 'Into the fountain', wall: '#1A1430', inside: '#1E2A58', motif: 'rings' },
};
let ph = null, ctx = null, s = null, bg = null;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const wrapA = (a) => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

// ---------------------------------------------------------------- 🪀 the double pendulum (unit arms and bobs, g 9.81)
const G = 9.81;
function deriv(q) {   // q = [θ1, θ2, ω1, ω2] (from straight down) → its rate of change
  const [a1, a2, v1, v2] = q, d = a1 - a2, den = 3 - Math.cos(2 * d);
  return [v1, v2, (-3 * G * Math.sin(a1) - G * Math.sin(a1 - 2 * a2) - 2 * Math.sin(d) * (v2 * v2 + v1 * v1 * Math.cos(d))) / den, (2 * Math.sin(d) * (2 * v1 * v1 + 2 * G * Math.cos(a1) + v2 * v2 * Math.cos(d))) / den];
}
function rk4(q, h) {
  const k1 = deriv(q), k2 = deriv(q.map((v, i) => v + k1[i] * h / 2)), k3 = deriv(q.map((v, i) => v + k2[i] * h / 2)), k4 = deriv(q.map((v, i) => v + k3[i] * h));
  return q.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
const bob = (q) => ({ x1: Math.sin(q[0]), y1: Math.cos(q[0]), x: Math.sin(q[0]) + Math.sin(q[1]), y: Math.cos(q[0]) + Math.cos(q[1]) });
function swing(r) {   // let one go from a seeded start, high and energetic (the chaotic regime), and trace the outer bob for 10 s
  const sg = r() < 0.5 ? -1 : 1, a1 = sg * (1.7 + r() * 1.2), a2 = a1 + (r() - 0.5) * 2.6;
  let q = [a1, a2, (r() - 0.5) * 2, (r() - 0.5) * 2]; const q0 = q.slice(), out = [];
  for (let i = 0; i < 2500; i++) { q = rk4(q, 0.004); if (i % 5 === 4) out.push(bob(q)); }
  return { trace: out, q0, q };
}

// ---------------------------------------------------------------- 🛤️ the scribble → one clean loop
// The trace is made to meet itself (the drift from end to start taken out), its first five harmonics kept (both ways
// round), and a plain circle added, as small as will do: the smallest that gives one loop whose bends are never tighter
// than RMIN and whose stretches never pass closer than 1.7 track widths. Then it's fitted to the box and laid out as N
// points evenly along it, with its heading and (smoothed) curvature.
function loopFrom(trace, box) {
  const M = trace.length - 1, z0 = trace[0], z1 = trace[M], K = 5, C = [];
  const zs = trace.slice(0, M).map((p, j) => ({ x: p.x - (z1.x - z0.x) * j / M, y: p.y - (z1.y - z0.y) * j / M }));
  let spread = 0;
  for (let k = -K; k <= K; k++) { if (!k) continue; let re = 0, im = 0; zs.forEach((p, j) => { const a = -2 * Math.PI * k * j / M, c = Math.cos(a), sn = Math.sin(a); re += p.x * c - p.y * sn; im += p.x * sn + p.y * c; }); C.push({ k, re: re / M, im: im / M }); spread += Math.hypot(re, im) / M; }
  let best = null;
  for (let it = 0; it < 80; it++) {
    const B = spread * it * 0.06, P = [];
    for (let i = 0; i < 720; i++) { const th = (i / 720) * Math.PI * 2; let x = B * Math.cos(th), y = B * Math.sin(th); C.forEach(({ k, re, im }) => { const c = Math.cos(k * th), sn = Math.sin(k * th); x += re * c - im * sn; y += re * sn + im * c; }); P.push({ x, y }); }
    let T = layout(fit(P, box));
    for (let pass = 0; pass < 40 && T.loop && !T.bendsOK; pass++) T = layout(fit(ease(T), box));   // the kinks eased out, the big shapes kept
    best = T; best.inflate = it;
    if (T.ok) break;
  }
  return best;
}
function ease(T) {   // relax only the bends tighter than RMIN (and a few points round them) toward their neighbours
  const P = T.pts, hot = new Uint8Array(N); P.forEach((p, i) => { if (Math.abs(p.k) > 1 / RMIN) for (let k = -6; k <= 6; k++) hot[(i + k + N) % N] = 1; });
  return P.map((p, i) => { if (!hot[i]) return { x: p.x, y: p.y }; let x = 0, y = 0; for (let k = -2; k <= 2; k++) { const q = P[(i + k + N) % N]; x += q.x; y += q.y; } return { x: x / 5, y: y / 5 }; });
}
function fit(P, box) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; P.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
  const sx0 = box.w / Math.max(1e-6, x1 - x0), sy0 = box.h / Math.max(1e-6, y1 - y0), u = Math.min(sx0, sy0), sx = Math.min(sx0, u * 1.35), sy = Math.min(sy0, u * 1.35);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; return P.map((p) => ({ x: box.x + box.w / 2 + (p.x - cx) * sx, y: box.y + box.h / 2 + (p.y - cy) * sy }));
}
function layout(P) {   // evenly along the closed curve: points, heading, curvature; and whether it's a fair track
  const cum = [0]; for (let i = 1; i <= P.length; i++) { const a = P[i - 1], b = P[i % P.length]; cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y)); }
  const L = cum[P.length], ds = L / N, pts = []; let j = 0;
  for (let i = 0; i < N; i++) { const d = i * ds; while (cum[j + 1] < d) j++; const a = P[j], b = P[(j + 1) % P.length], u = (d - cum[j]) / (cum[j + 1] - cum[j] || 1); pts.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }); }
  pts.forEach((p, i) => { const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N]; p.a = Math.atan2(b.y - a.y, b.x - a.x); });
  const raw = pts.map((p, i) => wrapA(pts[(i + 1) % N].a - pts[(i + N - 1) % N].a) / (2 * ds));
  pts.forEach((p, i) => { let t = 0; for (let k = -3; k <= 3; k++) t += raw[(i + k + N) % N]; p.k = t / 7; });
  const bendsOK = pts.every((p) => Math.abs(p.k) <= 1 / RMIN); let turn = 0;
  pts.forEach((p, i) => { turn += wrapA(pts[(i + 1) % N].a - p.a); });
  const loop = Math.abs(Math.abs(turn) - Math.PI * 2) < 0.5;   // exactly one loop round
  let ok = bendsOK && loop; const gap = Math.ceil((TW * 3) / ds), clear = TW * 1.7;
  for (let i = 0; i < N && ok; i += 2) for (let k = i + gap; k < N; k += 2) { if ((N - (k - i)) < gap) break; if (Math.hypot(pts[i].x - pts[k].x, pts[i].y - pts[k].y) < clear) { ok = false; break; } }
  return { pts, L, ds, ok, turn, loop, bendsOK };
}
const at = (d) => { const T = s.T, u = ((d % T.L) + T.L) % T.L / T.ds, i = Math.floor(u) % N, f = u - Math.floor(u), a = T.pts[i], b = T.pts[(i + 1) % N];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, a: a.a + wrapA(b.a - a.a) * f, k: a.k + (b.k - a.k) * f, i }; };

// ---------------------------------------------------------------- 🏁 the physics (the same for you, the ghost and the autopilot)
// Throttle pulls toward top speed (ACC per second of the gap), off is the brake (DECEL × top speed a second). In a bend the
// tyres hold v²·|κ| up to GRIP; past it the tail swings out (slip builds) and at slip 1 the car leaves the slot.
function step(c, on, dt) {
  if (on) c.v += (s.VMAX - c.v) * ACC * dt; else c.v = Math.max(0, c.v - s.VMAX * DECEL * dt);
  c.d += c.v * dt; const p = at(c.d), over = c.v * c.v * Math.abs(p.k) / s.GRIP;
  c.over = over; if (over > 1) c.slip += ((over - 1) * 7 + 1.5) * dt; else c.slip = Math.max(0, c.slip - dt * 2.5);
  return p;
}
function profile() {   // the braking-limited safe speed at each point (two passes round the loop), for the ghost and the autopilot
  const T = s.T, lim = T.pts.map((p) => Math.min(s.VMAX, Math.sqrt(s.GRIP * 0.93 / Math.max(1e-6, Math.abs(p.k))))), dec = s.VMAX * DECEL;
  for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) lim[i] = Math.min(lim[i], Math.sqrt(lim[(i + 1) % N] ** 2 + 2 * dec * T.ds * 0.85));
  return lim;
}
const want = (c) => { const u = (((c.d % s.T.L) + s.T.L) % s.T.L) / s.T.ds, i = Math.floor(u) % N; return Math.min(s.safe[i], s.safe[(i + 1) % N], s.safe[(i + 2) % N]); };
function calibrate() {   // a perfect driver's three laps from a standing start: sets top speed for an IDEAL-second run, records the ghost
  const T = s.T, kk = T.pts.map((p) => Math.abs(p.k)).sort((a, b) => a - b), k90 = Math.max(kk[Math.floor(N * 0.9)], 1 / 400);
  s.VMAX = T.L / 3; s.GRIP = (0.5 * s.VMAX) ** 2 * k90; s.safe = profile();
  const c = { d: 0, v: 0, slip: 0 }, rec = [0], h = 1 / 60; let t = 0;
  while (c.d < T.L * LAPS && t < 120) { step(c, c.v < want(c), h); c.slip = 0; t += h; rec.push(c.d); }
  const f = t / IDEAL;   // everything scales with top speed: speeds × f, grip × f², times ÷ f
  s.VMAX *= f; s.GRIP *= f * f; s.safe = s.safe.map((v) => v * f);
  s.ghostRec = rec; s.ghostRate = (t / h) / GHOST;   // record steps per real second, for the ghost's GHOST-second run
}

// ---------------------------------------------------------------- a pocket
function start(h, seed = {}) {
  ph = h; ctx = h.ctx; bg = null;
  const W = ph.W, H = ph.H, r = rng(seed.seed || Math.floor(Math.random() * 1e9)), th = seed.theme || {}, thing = THINGS[seed.thing] || THINGS.toaster;
  pocket.icon = thing.icon; pocket.name = thing.name; pocket.rim = th.kerb?.[0] || '#FF8A3D';
  const box = { x: 34, y: 96, w: W - 68, h: Math.max(260, Math.min(H - 96 - 128, (W - 68) * 1.7)) };
  box.y = 96 + Math.max(0, (H - 96 - 128 - box.h) / 2);
  const sw = swing(r);
  s = { th, thing, car: seed.car || null, box, sw, live: sw.q.slice(), trail: [], T: null, me: { d: 0, v: 0, slip: 0, over: 0, fly: null, blink: 0, x: 0, y: 0, a: 0, roll: 0 }, ghost: { d: 0, t: 0 },
    hold: new Set(), key: false, lap: 0, laps: 0, offs: 0, pts: 0, time: 0, done: false, won: false, beat: false, fx: [], auto: false, W, H };
  s.T = loopFrom(sw.trace, box); calibrate();
  const p = at(0); Object.assign(s.me, { x: p.x, y: p.y, a: p.a });
}
const throttle = () => !s.done && !s.me.fly && (s.auto ? s.me.v < want(s.me) : s.hold.size > 0 || s.key);
function result(won) {
  if (!won) return { pts: s.pts, why: s.laps ? `${s.laps} of ${LAPS} laps when the time ran out` : 'the time ran out on lap 1' };
  const left = Math.round(ph.left?.() || 0), nitro = s.beat ? 5 : 3.5;
  return { pts: s.pts + 250 + left * 15 + (s.beat ? 200 : 0), label: s.beat ? 'THREE LAPS · GHOST BEATEN' : 'THREE LAPS · NITRO', sub: `🔥 ${nitro} s of nitro and a life back${s.beat ? ', and +200 for the ghost' : ''} · ${left} s to spare`, gift: { nitro, heal: 1, ghost: s.beat } };
}
function burst(x, y, n, cols, sp = 120, life = 0.6) { for (let i = 0; i < n && s.fx.length < 160; i++) { const a = Math.random() * 6.28, v = sp * (0.3 + Math.random()); s.fx.push({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: cols[i % cols.length], life: life * (0.6 + Math.random() * 0.6), max: life }); } }
function update(dt) {
  if (!s) return;
  s.time += dt; const me = s.me, L = s.T.L;
  // 👻 the ghost: a perfect driver, a little slower, from 0.8 s in
  if (s.time > 0.8 && s.ghost.d < L * LAPS) { s.ghost.t += dt; const u = s.ghost.t * s.ghostRate, i = Math.min(s.ghostRec.length - 1, Math.floor(u)), f = u - Math.floor(u); s.ghost.d = i >= s.ghostRec.length - 1 ? L * LAPS : s.ghostRec[i] + (s.ghostRec[i + 1] - s.ghostRec[i]) * f; }
  if (me.fly) {   // 💨 off the track: tumbling, then back in the slot where it left, standing still
    const f = me.fly; f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= Math.pow(0.15, dt); f.vy *= Math.pow(0.15, dt); f.spin += f.w * dt; f.w *= Math.pow(0.3, dt);
    if (f.t >= FLY) { me.fly = null; me.v = 0; me.slip = 0; me.blink = BLINK; const p = at(me.d); me.x = p.x; me.y = p.y; me.a = p.a; ph.sfx('clack'); }
  } else if (!s.done || me.v > 0) {
    const d0 = me.d, p = step(me, throttle(), dt); me.x = p.x; me.y = p.y; me.a = p.a; me.k = p.k; me.roll += me.v * dt;
    if (s.auto) me.slip = Math.min(me.slip, 0.3);
    if (me.slip > 0.35 && Math.random() < dt * 30) { const n = me.k > 0 ? 1 : -1, ox = Math.sin(p.a) * n * TW * 0.35, oy = -Math.cos(p.a) * n * TW * 0.35; burst(me.x + ox, me.y + oy, 2, ['#FFD166', '#FF8A3D', '#FFF4D6'], 80, 0.35); }   // braid sparks as the tail swings out
    if (me.slip >= 1) {   // 💨 out of the slot: off along the tangent, a little outward
      const n = -(me.k > 0 ? 1 : -1), a = p.a; me.fly = { t: 0, x: me.x, y: me.y, vx: Math.cos(a) * me.v * 0.8 - Math.sin(a) * n * me.v * 0.35, vy: Math.sin(a) * me.v * 0.8 + Math.cos(a) * n * me.v * 0.35, spin: 0, w: (me.k > 0 ? 1 : -1) * 14 };
      s.offs += 1; ph.sfx('thud'); burst(me.x, me.y, 14, ['#FFFFFF', s.th.kerb?.[0] || '#EE2B3B', '#FFD166'], 140, 0.6); s.fx.push({ k: 'text', x: Math.max(60, Math.min(s.W - 60, me.x)), y: me.y - 20, text: '💨 DESLOTTED', life: 0.9 });
    }
    if (me.blink > 0) me.blink -= dt;
    const lap = Math.floor(me.d / L);
    if (!s.done && lap > Math.floor(d0 / L)) {
      s.laps = Math.min(LAPS, lap); s.pts += 60; ph.sfx('chime'); burst(at(0).x, at(0).y, 16, ['#FFE36B', '#22E0C8', '#FF5DA2', '#FFFFFF'], 150, 0.8);
      if (s.laps >= LAPS) { s.done = true; s.won = true; s.beat = s.ghost.d < L * LAPS; ph.sfx('fanfare'); s.fx.push({ k: 'text', x: s.W / 2, y: s.box.y + s.box.h / 2, text: s.beat ? '🏁 3 LAPS · GHOST BEATEN!' : '🏁 3 LAPS!', life: 1.4, big: true }); setTimeout(() => { if (s && s.won) ph.win(result(true)); }, 600); }
      else s.fx.push({ k: 'text', x: at(0).x, y: at(0).y - 22, text: s.laps === LAPS - 1 ? 'LAST LAP!' : `LAP ${s.laps + 1}`, life: 1 });
    }
  }
  // 🪀 the pendulum keeps swinging in the corner
  for (let i = 0; i < 4; i++) s.live = rk4(s.live, Math.min(dt, 0.05) / 4);
  { const b = bob(s.live); s.trail.push(b.x, b.y); if (s.trail.length > 90) s.trail.splice(0, 2); }
  s.fx.forEach((f) => { f.life -= dt; if (f.k === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= Math.pow(0.2, dt); f.vy *= Math.pow(0.2, dt); } else f.y -= 18 * dt; });
  s.fx = s.fx.filter((f) => f.life > 0);
}

// ---------------------------------------------------------------- 🎨 the look
// Painted once: the thing's insides (its walls, its floor in the place's own table texture, a motif: the toaster's
// glowing coils, a bowl's or a mug's rings, a box's planks, snow), the pendulum's raw scribble faint under everything, and
// the track: shadow, border, grey plastic, kerbs in the place's colours on the outside of every bend, the copper braids
// and the slot, the chequered start. Each frame draws only the cars, the sparks, the swinging pendulum and the text.
function build() {
  const cv = ph.cv, k = ph.k, ox = ph.ox || 0, oy = ph.oy || 0, W = ph.W, H = ph.H, th = s.th, T = s.T, bx = s.box, thg = s.thing, c = mk(cv.width, cv.height), x = c.getContext('2d'), r = rng(99 + Math.round(T.L));
  x.fillStyle = thg.wall; x.fillRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, ox, oy);
  const fl = { x: 14, y: bx.y - 34, w: W - 28, h: bx.h + 68 };
  x.fillStyle = thg.inside; x.beginPath(); x.roundRect(fl.x, fl.y, fl.w, fl.h, 22); x.fill();
  x.save(); x.beginPath(); x.roundRect(fl.x, fl.y, fl.w, fl.h, 22); x.clip();
  if (s.th.surf) { try { x.globalAlpha = 0.35; x.save(); x.scale(1.6, 1.6); x.fillStyle = s.th.surf; x.fillRect(0, 0, W, H); x.restore(); } catch { /* no pattern: the plain floor */ } x.globalAlpha = 1; }
  if (thg.motif === 'coils') { for (let i = 0; i < 7; i++) { const y = fl.y + 30 + i * (fl.h - 60) / 6; x.lineJoin = 'round'; [['#FF5A1A55', 7], ['#FFB060aa', 2.2]].forEach(([col, lw]) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); for (let px = fl.x + 10; px <= fl.x + fl.w - 10; px += 9) x.lineTo(px, y + ((px / 9) % 2 < 1 ? -4 : 4)); x.stroke(); }); } }
  else if (thg.motif === 'rings') { const cx = W / 2, cy = bx.y + bx.h / 2; x.strokeStyle = '#ffffff14'; x.lineWidth = 2; for (let rr = 30; rr < Math.hypot(fl.w, fl.h) / 2; rr += 26) { x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke(); } }
  else if (thg.motif === 'planks') { x.strokeStyle = '#00000030'; x.lineWidth = 2; for (let y = fl.y + 30; y < fl.y + fl.h; y += 30) { x.beginPath(); x.moveTo(fl.x, y); x.lineTo(fl.x + fl.w, y); x.stroke(); for (let n = 0; n < 3; n++) { const px = fl.x + r() * fl.w; x.beginPath(); x.moveTo(px, y - 30); x.lineTo(px, y); x.stroke(); } } }
  else if (thg.motif === 'snow') { for (let i = 0; i < 160; i++) { x.fillStyle = r() < 0.7 ? '#FFFFFF88' : '#FFFFFFdd'; x.beginPath(); x.arc(fl.x + r() * fl.w, fl.y + r() * fl.h, 0.8 + r() * 1.8, 0, 7); x.fill(); } }
  // the pendulum's own scribble, faint: where this track came from
  { const P = fit(s.sw.trace, bx); x.strokeStyle = '#FFE08A1c'; x.lineWidth = 1; x.beginPath(); P.forEach((p, i) => x[i ? 'lineTo' : 'moveTo'](p.x, p.y)); x.stroke(); }
  { const g = x.createRadialGradient(W / 2, bx.y + bx.h / 2, Math.min(fl.w, fl.h) * 0.35, W / 2, bx.y + bx.h / 2, Math.hypot(fl.w, fl.h) * 0.6); g.addColorStop(0, '#00000000'); g.addColorStop(1, '#00000077'); x.fillStyle = g; x.fillRect(fl.x, fl.y, fl.w, fl.h); }
  x.restore();
  x.strokeStyle = '#00000055'; x.lineWidth = 6; x.beginPath(); x.roundRect(fl.x, fl.y, fl.w, fl.h, 22); x.stroke(); x.strokeStyle = th.edge?.[1] ? th.edge[1] + '66' : '#ffffff40'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(fl.x + 3, fl.y + 3, fl.w - 6, fl.h - 6, 19); x.stroke();
  // the track
  const way = (off = 0, dx = 0, dy = 0) => { x.beginPath(); T.pts.forEach((p, i) => x[i ? 'lineTo' : 'moveTo'](p.x - Math.sin(p.a) * off + dx, p.y + Math.cos(p.a) * off + dy)); x.closePath(); };
  x.lineJoin = 'round'; x.lineCap = 'round';
  way(0, 3, 5); x.strokeStyle = '#00000066'; x.lineWidth = TW + 10; x.stroke();
  way(); x.strokeStyle = th.kerbEdge || '#1A1A20'; x.lineWidth = TW + 8; x.stroke();
  // kerbs on the outside of the bends, in the place's colours
  const K = th.kerb || ['#EE2B3B', '#FFFFFF'];
  { let run = []; const flush = () => { if (run.length > 2) { const sd = run.side; [[K[0], null], [K[1], [5, 5]]].forEach(([col, dash]) => { x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'butt'; x.setLineDash(dash || []); x.beginPath(); run.forEach((p, j) => { const o = (TW / 2 + 1) * sd; x[j ? 'lineTo' : 'moveTo'](p.x - Math.sin(p.a) * o, p.y + Math.cos(p.a) * o); }); x.stroke(); }); x.setLineDash([]); } run = []; };
    T.pts.forEach((p) => { const sd = p.k > 0 ? -1 : 1; if (Math.abs(p.k) > 1 / 75) { if (run.length && run.side !== sd) flush(); run.side = sd; run.push(p); } else flush(); }); flush(); }
  way(); x.strokeStyle = '#2B2D36'; x.lineWidth = TW; x.lineCap = 'round'; x.stroke();
  way(TW / 2 - 1.5); x.strokeStyle = '#ffffff26'; x.lineWidth = 1.2; x.stroke(); way(-(TW / 2 - 1.5)); x.stroke();
  for (let i = 0; i < 260; i++) { const p = T.pts[Math.floor(r() * N)], o = (r() - 0.5) * TW * 0.8; x.fillStyle = r() < 0.5 ? '#ffffff0d' : '#0000001a'; x.fillRect(p.x - Math.sin(p.a) * o, p.y + Math.cos(p.a) * o, 1.4, 1.4); }
  way(3.6); x.strokeStyle = '#C98E4A'; x.lineWidth = 1.6; x.stroke(); way(-3.6); x.stroke();   // the copper braids
  way(); x.strokeStyle = '#08080B'; x.lineWidth = 2.2; x.stroke();   // the slot
  { const p = T.pts[0], nx = -Math.sin(p.a), ny = Math.cos(p.a), tx = Math.cos(p.a), ty = Math.sin(p.a);   // the chequered start
    for (let i = -3; i < 3; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#FFF'; const o = i * TW / 6, a0 = j * 4 - 4; x.beginPath(); x.moveTo(p.x + nx * o + tx * a0, p.y + ny * o + ty * a0); x.lineTo(p.x + nx * (o + TW / 6) + tx * a0, p.y + ny * (o + TW / 6) + ty * a0); x.lineTo(p.x + nx * (o + TW / 6) + tx * (a0 + 4), p.y + ny * (o + TW / 6) + ty * (a0 + 4)); x.lineTo(p.x + nx * o + tx * (a0 + 4), p.y + ny * o + ty * (a0 + 4)); x.closePath(); x.fill(); } }
  // the progress bar's rail, bottom: three laps
  { const y = H - 34, x0 = 30, x1 = W - 92; x.strokeStyle = '#00000088'; x.lineWidth = 8; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke(); x.strokeStyle = '#ffffff55'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke();
    x.fillStyle = '#ffffffaa'; for (let i = 0; i <= LAPS; i++) { const px = x0 + (x1 - x0) * i / LAPS; x.fillRect(px - 1, y - 6, 2, 12); } x.font = '14px serif'; x.textAlign = 'center'; x.fillText('🏁', x1 + 2, y - 9); }
  bg = { c, w: cv.width, h: cv.height, k, W, H };
}
function carAt(x, y, a, sc, t, o) {   // the vehicle Rally is driving (its own drawing, passed down), else a plain slot car
  if (s.car) { s.car(ctx, x, y, a, sc, t, o); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc);
  ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.roundRect(-12, -7, 26, 16, 5); ctx.fill();
  ctx.fillStyle = o.ghost ? '#FFFFFF' : '#22E0C8'; ctx.beginPath(); ctx.roundRect(-13, -8, 26, 16, 5); ctx.fill(); ctx.fillStyle = '#0B8C7E'; ctx.fillRect(-4, -6, 8, 12);
  if (!o.ghost) drawPal(ph.mood(), ctx, { x: -2, y: 0, s: 6, t: t / 1000, r: ph.S.curve.r, face: 1, hurt: o.hurt });
  ctx.restore();
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ox = ph.ox || 0, oy = ph.oy || 0, ts = t / 1000, W = s.W, H = s.H, me = s.me, L = s.T.L;
  if (!bg || bg.w !== cv.width || bg.h !== cv.height || bg.k !== k || bg.W !== ph.W || bg.H !== ph.H) build();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg.c, 0, 0);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  // 🪀 the pendulum, swinging in the corner, its bob's trail behind it
  { const px = W - 50, py = H - 112, A = 17, b = bob(s.live), tr = s.trail;
    if (tr.length > 4) { ctx.strokeStyle = '#FFE08A55'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < tr.length; i += 2) ctx[i ? 'lineTo' : 'moveTo'](px + tr[i] * A, py + tr[i + 1] * A); ctx.stroke(); }
    ctx.strokeStyle = '#E8E4DA'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + b.x1 * A, py + b.y1 * A); ctx.lineTo(px + b.x * A, py + b.y * A); ctx.stroke();
    ctx.fillStyle = '#9AA3B2'; ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 7); ctx.fill(); ctx.fillStyle = s.th.kerb?.[0] || '#EE2B3B'; ctx.beginPath(); ctx.arc(px + b.x1 * A, py + b.y1 * A, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(px + b.x * A, py + b.y * A, 3.6, 0, 7); ctx.fill(); }
  // 👻 the ghost, see-through
  if (s.time > 0.3 && s.ghost.d < L * LAPS) { const p = at(s.ghost.d); ctx.globalAlpha = 0.38; carAt(p.x, p.y, p.a, CAR_S, t, { ghost: true }); ctx.globalAlpha = 1; }
  // 🏎️ yours: the tail swings out as it nears the limit
  if (me.fly) { const f = me.fly, sc = CAR_S * (1 + 0.5 * Math.sin(Math.min(1, f.t / FLY) * Math.PI)); ctx.globalAlpha = Math.max(0.2, 1 - f.t / FLY * 0.6); carAt(f.x, f.y, me.a + f.spin, sc, t, { hurt: true, v: 0 }); ctx.globalAlpha = 1; }
  else if (!(me.blink > 0 && Math.floor(me.blink * 12) % 2)) { const sl = Math.min(1, Math.max(0, (me.over - 0.6) / 0.5) * 0.6 + me.slip * 0.7), drift = (me.k > 0 ? 1 : -1) * 0.55 * sl; carAt(me.x, me.y, me.a + drift, CAR_S, t, { roll: me.roll, v: me.v, hurt: me.slip > 0.6 }); }
  ctx.lineCap = 'butt';
  s.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); if (f.k === 'dot') { ctx.fillStyle = f.c; ctx.fillRect(f.x - 1.2, f.y - 1.2, 2.4, 2.4); } else { ctx.font = f.big ? '400 19px Bungee, Impact, sans-serif' : '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#1B1030'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } });
  ctx.globalAlpha = 1;
  // the bottom line: the lap, then you and the ghost along three laps
  { const y = H - 34, x0 = 30, x1 = W - 92, P = (d) => x0 + (x1 - x0) * Math.max(0, Math.min(1, d / (L * LAPS)));
    ctx.textAlign = 'left'; ctx.font = '400 17px Bungee, Impact, sans-serif'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#120A06'; ctx.fillStyle = '#FFE08A'; const lt = s.done ? '🏁 DONE' : `LAP ${Math.min(LAPS, s.laps + 1)}/${LAPS}`; ctx.strokeText(lt, x0 - 4, y - 14); ctx.fillText(lt, x0 - 4, y - 14);
    ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.7; ctx.fillText('👻', P(s.ghost.d), y + 4); ctx.globalAlpha = 1;
    ctx.fillStyle = '#22E0C8'; ctx.beginPath(); ctx.arc(P(me.d), y, 5.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#06302B'; ctx.lineWidth = 1.5; ctx.stroke(); }
  if (s.time < 2.6) { const a = Math.min(1, (2.6 - s.time) * 1.5), ty = s.box.y + s.box.h * 0.45; ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#120A06'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText('3 LAPS · BEAT THE GHOST', W / 2, ty); ctx.fillText('3 LAPS · BEAT THE GHOST', W / 2, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.fillStyle = '#fff'; ctx.strokeText('hold anywhere to go · let go to brake', W / 2, ty + 18); ctx.fillText('hold anywhere to go · let go to brake', W / 2, ty + 18); ctx.globalAlpha = 1; }
}
const GO_KEYS = new Set(['Space', 'ArrowUp', 'KeyW', 'Enter']);
const pocket = {
  key: 'slotcar', name: 'Through the toaster', icon: '🍞', goal: '3 laps, beat the ghost', dur: DUR, rim: '#FF8A3D', system: 'double pendulum',
  start, update, draw,
  onBeat(ev) { if (!s) return; if (ev?.peak) s.live[3] += (Math.random() < 0.5 ? -1 : 1) * 1.5; },   // a peak up top gives the pendulum a shove (it's only the clock in the corner; the track is set)
  pointer(type, p, e) { if (!s) return; const id = e?.pointerId ?? 0; if (type === 'down') s.hold.add(id); else if (type === 'up') { s.hold.delete(id); if (!e || e.pointerType === 'mouse') s.hold.clear(); } },
  keydown(e) { if (s && GO_KEYS.has(e.code)) { e.preventDefault?.(); s.key = true; } },
  keyup(e) { if (s && GO_KEYS.has(e.code)) s.key = false; },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'slotcar', thing: s.thing.name, L: Math.round(s.T.L), inflate: s.T.inflate, fair: s.T.ok, vmax: Math.round(s.VMAX), grip: Math.round(s.GRIP), kmax: Math.max(...s.T.pts.map((p) => Math.abs(p.k))), start: { ...s.sw.q0 }, pts: s.pts,
    me: { d: s.me.d, v: s.me.v, slip: s.me.slip, fly: !!s.me.fly, x: s.me.x, y: s.me.y }, laps: s.laps, offs: s.offs, ghost: s.ghost.d, held: s.hold.size + (s.key ? 1 : 0), done: s.done, beat: s.beat,
    track: s.T.pts.filter((_, i) => i % 30 === 0).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    auto: (on = true) => { s.auto = on; }, flyOff: () => { s.me.v = s.VMAX; s.me.slip = 1; }, lap: () => { s.me.d = Math.ceil((s.me.d + 1) / s.T.L) * s.T.L - 1; },
    win: () => { s.me.d = s.T.L * LAPS - 1; s.me.v = Math.max(s.me.v, 50); s.me.fly = null; return true; }, lose: () => ph.lose(result(false)) }),
};
export default pocket;
