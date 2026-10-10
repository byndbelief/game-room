// ⛳🕳️ INSIDE THE CUP: Putt's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a Putt hole, the cup pulses; tap it and you fall in. Down there is a tiny round bagatelle table, felted in the
// hole's own colours, with the hole you were playing inlaid on it in miniature. Flick Fig up (drag back, let go, the
// Putt verb) against gravity and sink all three target cups before the cup closes (20 s). Each cup holds a gift for the
// hole up top: ↩️ a mulligan (your next bad putt is undone), ➕ a free putt, 🔧 one more fix.
//
// Random in its own way: the HÉNON MAP, x' = 1 − a·x² + y, y' = b·x (a = 1.4, b = 0.3). Its orbit is jumpy, one
// point to the next lands anywhere, yet every point falls on the same thin folded band (the strange attractor, drawn
// faintly on the felt). The cups and the bumpers are the orbit's points: a new bumper pops up on every beat of the curve
// up top, wherever the orbit jumps next, and the oldest one sinks. So the table changes all the time but always
// clusters on the attractor's band, and that band is where the cups are too.
import { drawPal } from '../../pals.js';

const A = 1.4, B = 0.3, GRAV = 560, BALL = 6.5, CUP = 12, MAG = 34, MAXB = 6, BR = 11, DUR = 20;
const GIFTS = [['mull', '↩️', 'mulligan'], ['free', '➕', 'free putt'], ['fix', '🔧', 'fix']];
let ph = null, ctx = null, s = null, bg = null, bump = null;
const henon = (o) => { const x = 1 - A * o.x * o.x + o.y; o.y = B * o.x; o.x = x; return o; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const table = () => { const W = ph.W, H = ph.H; return { cx: W / 2, cy: H * 0.54, R: Math.min(W * 0.45, H * 0.36) }; };
// the attractor (x in −1.28…1.27, y in −0.38…0.38) laid across the table's middle
const onTable = (hx, hy) => { const T = s.T; return { x: T.cx + (hx / 1.3) * T.R * 0.74, y: T.cy - T.R * 0.1 - (hy / 0.4) * T.R * 0.46 }; };
function nextSpot(gap, avoid) {   // the orbit's next point that fits: on the felt, off the launch pad, clear of the rest
  const T = s.T;
  for (let i = 0; i < 80; i++) {
    henon(s.orb); const p = onTable(s.orb.x, s.orb.y);
    if (Math.hypot(p.x - T.cx, p.y - T.cy) > T.R - 26 || p.y > T.cy + T.R * 0.5) continue;
    if (avoid.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < gap)) continue;
    return p;
  }
  return null;
}
const rest = () => { const T = s.T; s.ball = { x: T.cx, y: T.cy + T.R - BALL - 1, vx: 0, vy: 0, pop: 0.35 }; };
const speed = () => Math.hypot(s.ball.vx, s.ball.vy);
function spawnBump() {
  const live = s.bumps.filter((b) => !b.dying);
  if (live.length >= MAXB) live[0].dying = true;
  const p = nextSpot(BR * 2 + 16, [...s.cups, ...live.filter((b) => !b.dying), { x: s.ball.x, y: s.ball.y }]); if (!p) return;
  s.bumps.push({ x: p.x, y: p.y, g: 0, hit: 0, dying: false });
}
function flick(dx, dy) {
  if (!s || s.done || speed() > 140) return false;
  const d = Math.min(140, Math.hypot(dx, dy)); if (d < 8) return false;
  const a = Math.atan2(dy, dx), p = d * 7.4; s.ball.vx = -Math.cos(a) * p; s.ball.vy = -Math.sin(a) * p; s.flicks += 1; ph.sfx('putt', { power: d / 140 });
  return true;
}
function sink(c) {
  if (c.sunk || s.done) return;
  c.sunk = true; c.at = s.time; s.sunk += 1; s.pts += 150; ph.sfx('cup'); ph.cue?.('score', c.x, c.y);
  for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, v = 50 + Math.random() * 140; s.fx.push({ k: 'dot', x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c: ['#F5C542', '#FFFFFF', '#7FD3F7'][i % 3], life: 0.8 }); }
  s.fx.push({ k: 'text', x: c.x, y: c.y - 20, text: `${c.icon} ${c.name}`, life: 1.1 });
  rest();
  if (s.sunk >= s.cups.length) { s.done = true; ph.sfx('fanfare'); setTimeout(() => ph.win(result(true)), 500); }
}
function result(won) {
  if (!won) return { pts: s.pts, why: s.sunk ? `${s.sunk} of 3 cups: so close` : 'the cup closed over you' };
  const left = Math.round(ph.left?.() || 0);
  return { pts: s.pts + 200 + left * 15, label: '3 CUPS · MULLIGAN, PUTT, FIX', sub: `↩️ a mulligan, ➕ a free putt and 🔧 a fix to take up · ${left} s to spare`, gift: { mull: 1, free: 1, fix: 1 } };
}
function update(dt) {
  if (!s) return;
  s.time += dt;
  const T = s.T, b = s.ball;
  if (b.pop > 0) b.pop -= dt;
  const n = 3, h = dt / n;
  for (let k = 0; k < n; k++) {
    b.vy += GRAV * h;
    s.cups.forEach((c) => { if (c.sunk) return; const dx = c.x - b.x, dy = c.y - b.y, d = Math.hypot(dx, dy); if (d < MAG && d > 0.5) { const f = 1500 * (1 - d / MAG); b.vx += dx / d * f * h; b.vy += dy / d * f * h; b.vx *= 1 - 0.9 * h; b.vy *= 1 - 0.9 * h; } });   // a saucer's pull
    b.x += b.vx * h; b.y += b.vy * h;
    { const dx = b.x - T.cx, dy = b.y - T.cy, d = Math.hypot(dx, dy) || 1, lim = T.R - BALL;   // the round rail
      if (d > lim) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn > 0) { b.vx -= 1.62 * vn * nx; b.vy -= 1.62 * vn * ny; b.vx *= 0.993; b.vy *= 0.993; if (vn > 160) ph.sfx('clack'); } b.x = T.cx + nx * lim; b.y = T.cy + ny * lim;
        if (ny > 0.92 && speed() < 36) { b.vx = 0; b.vy = 0; } } }
    s.bumps.forEach((bp) => { if (bp.dying || bp.g < 0.5) return; const dx = b.x - bp.x, dy = b.y - bp.y, d = Math.hypot(dx, dy), rr = BR * bp.g + BALL;
      if (d < rr && d > 0) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; const sp = speed(), to = Math.min(1100, Math.max(sp * 1.05, 420)); b.vx *= to / (sp || 1); b.vy *= to / (sp || 1); bp.hit = 0.25; s.pts += 10; ph.sfx('boing'); } b.x = bp.x + nx * rr; b.y = bp.y + ny * rr; } });
    const c = s.cups.find((q) => !q.sunk && Math.hypot(q.x - b.x, q.y - b.y) < CUP - 3 && speed() < 700); if (c) { sink(c); break; }
  }
  s.trail.push(b.x, b.y); if (s.trail.length > 24 || speed() < 20) s.trail.splice(0, 2);
  s.bumps.forEach((bp) => { if (bp.dying) bp.g -= dt * 3; else bp.g = Math.min(1, bp.g + dt * 2.6); if (bp.hit > 0) bp.hit -= dt; });
  s.bumps = s.bumps.filter((bp) => bp.g > 0 || !bp.dying);
  s.fx.forEach((f) => { f.life -= dt; if (f.k === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; } else f.y -= 22 * dt; });
  s.fx = s.fx.filter((f) => f.life > 0);
}
// 🎨 the table, painted once: the cup's dark wall all round, the felt in the hole's green, the hole you were on inlaid in
// miniature, the attractor's band as a dust of gold, the round rail in the hole's rail colours, the launch pad
function build() {
  const cv = ph.cv, k = ph.k, T = s.T, th = s.th, c = mk(cv.width, cv.height), x = c.getContext('2d');
  x.fillStyle = '#050A07'; x.fillRect(0, 0, c.width, c.height);
  x.setTransform(k, 0, 0, k, ph.ox || 0, ph.oy || 0);
  const W = ph.W, H = ph.H;
  { const g = x.createRadialGradient(T.cx, T.cy, T.R * 0.9, T.cx, T.cy, Math.hypot(W, H) * 0.6); g.addColorStop(0, '#1C2A1C'); g.addColorStop(1, '#030604'); x.fillStyle = g; x.fillRect(-40, -40, W + 80, H + 80); }
  x.strokeStyle = '#ffffff0c'; x.lineWidth = 1; for (let r = T.R + 18; r < Math.hypot(W, H); r += 16) { x.beginPath(); x.arc(T.cx, T.cy, r, 0, 7); x.stroke(); }   // the cup's wall, ringed
  { const g = x.createRadialGradient(T.cx - T.R * 0.3, T.cy - T.R * 0.4, T.R * 0.1, T.cx, T.cy, T.R); g.addColorStop(0, th.fair?.[0] || '#62B84C'); g.addColorStop(1, th.bg?.[1] || '#2C6526'); x.fillStyle = g; x.beginPath(); x.arc(T.cx, T.cy, T.R, 0, 7); x.fill(); }
  x.save(); x.beginPath(); x.arc(T.cx, T.cy, T.R - 2, 0, 7); x.clip();
  for (let i = 0; i < 900; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * T.R; x.fillStyle = Math.random() < 0.5 ? '#ffffff10' : '#00000014'; x.fillRect(T.cx + Math.cos(a) * r, T.cy + Math.sin(a) * r, 1.6, 1.6); }
  if (s.path?.length > 1) {   // the hole up top, in miniature
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; s.path.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    const pw = s.pw || 60, sc = Math.min((T.R * 1.25) / Math.max(1, x1 - x0 + pw), (T.R * 1.25) / Math.max(1, y1 - y0 + pw)), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, P = (p) => [T.cx + (p.x - mx) * sc, T.cy + (p.y - my) * sc];
    x.lineCap = 'round'; x.lineJoin = 'round'; const way = () => { x.beginPath(); s.path.forEach((p, i) => x[i ? 'lineTo' : 'moveTo'](...P(p))); };
    x.globalAlpha = 0.28; x.strokeStyle = '#000'; x.lineWidth = pw * sc + 6; way(); x.stroke(); x.strokeStyle = th.fair?.[1] || '#55A842'; x.lineWidth = pw * sc; way(); x.stroke();
    x.strokeStyle = '#ffffff55'; x.setLineDash([3, 5]); x.lineWidth = 1.2; way(); x.stroke(); x.setLineDash([]);
    const e = P(s.path[s.path.length - 1]); x.globalAlpha = 0.6; x.fillStyle = '#000'; x.beginPath(); x.arc(e[0], e[1], 3.5, 0, 7); x.fill(); x.strokeStyle = th.flag || '#E4572E'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(e[0], e[1]); x.lineTo(e[0], e[1] - 12); x.stroke();
    x.globalAlpha = 1;
  }
  { const o = { x: 0.1, y: 0.1 }; x.fillStyle = '#FFE08A'; for (let i = 0; i < 7000; i++) { henon(o); if (i < 50) continue; const p = onTable(o.x, o.y); x.globalAlpha = 0.22; x.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2); } x.globalAlpha = 1; }   // the strange attractor, as dust
  { const g = x.createRadialGradient(T.cx, T.cy, T.R * 0.55, T.cx, T.cy, T.R); g.addColorStop(0, '#00000000'); g.addColorStop(1, '#00000066'); x.fillStyle = g; x.fillRect(T.cx - T.R, T.cy - T.R, T.R * 2, T.R * 2); }
  { const py = T.cy + T.R - BALL - 1; x.fillStyle = '#00000044'; x.beginPath(); x.ellipse(T.cx, py + 2, 18, 6, 0, 0, 7); x.fill(); x.strokeStyle = '#FFE08A66'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(T.cx, py + 1, 16, 5, 0, 0, 7); x.stroke(); }
  x.restore();
  (th.rail || [[12, '#3E2716'], [8, '#8B5A2B']]).forEach(([w, col, dash]) => { x.strokeStyle = col; x.lineWidth = w; if (dash) x.setLineDash(dash); x.beginPath(); x.arc(T.cx, T.cy, T.R + w / 2 - 2, 0, 7); x.stroke(); x.setLineDash([]); });
  x.strokeStyle = '#ffffff30'; x.lineWidth = 1.5; x.beginPath(); x.arc(T.cx, T.cy, T.R - 1, Math.PI * 1.1, Math.PI * 1.7); x.stroke();
  bg = { c, w: cv.width, h: cv.height, k, W: ph.W, H: ph.H };
  // a bumper, once, in the hole's bumper colours
  const [li, mid, dk] = th.bump?.c || ['#FF8A65', '#E4572E', '#7A2A14'], S2 = 64, b = mk(S2, S2), bx = b.getContext('2d'), r = 26;
  bx.fillStyle = 'rgba(0,0,0,0.3)'; bx.beginPath(); bx.ellipse(34, 37, r * 1.05, r * 0.85, 0, 0, 7); bx.fill();
  const gr = bx.createRadialGradient(32 - r * 0.35, 32 - r * 0.4, r * 0.1, 32, 32, r); gr.addColorStop(0, li); gr.addColorStop(0.55, mid); gr.addColorStop(1, dk); bx.fillStyle = gr; bx.beginPath(); bx.arc(32, 32, r, 0, 7); bx.fill();
  bx.strokeStyle = dk; bx.lineWidth = 3; bx.stroke(); bx.strokeStyle = '#FFE08Acc'; bx.lineWidth = 2; bx.beginPath(); bx.arc(32, 32, r * 0.62, 0, 7); bx.stroke();
  bx.fillStyle = '#ffffffaa'; bx.beginPath(); bx.ellipse(32 - r * 0.35, 32 - r * 0.45, r * 0.33, r * 0.2, 0, 0, 7); bx.fill();
  bump = b;
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ts = t / 1000;
  if (!bg || bg.w !== cv.width || bg.h !== cv.height || bg.k !== k || bg.W !== ph.W || bg.H !== ph.H) build();   // (the table keeps its place: cups and bumpers sit on it)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg.c, 0, 0);
  ctx.setTransform(k, 0, 0, k, ph.ox || 0, ph.oy || 0);
  const b = s.ball;
  // the target cups: a dark hole with a lip, its gift above it, gold once sunk
  s.cups.forEach((c) => {
    if (c.sunk) { ctx.fillStyle = '#F5C54266'; ctx.beginPath(); ctx.arc(c.x, c.y, CUP + 5, 0, 7); ctx.fill(); ctx.fillStyle = '#F5C542'; ctx.beginPath(); ctx.arc(c.x, c.y, CUP, 0, 7); ctx.fill(); ctx.fillStyle = '#5A3E00'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', c.x, c.y + 1); ctx.textBaseline = 'alphabetic'; return; }
    const pu = 1 + 0.08 * Math.sin(ts * 5 + c.x); ctx.strokeStyle = '#FFE08A55'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(c.x, c.y, MAG * pu, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#00000088'; ctx.beginPath(); ctx.arc(c.x + 1, c.y + 2, CUP + 2, 0, 7); ctx.fill(); ctx.fillStyle = '#0A0D0A'; ctx.beginPath(); ctx.arc(c.x, c.y, CUP, 0, 7); ctx.fill(); ctx.strokeStyle = '#FFFFFFdd'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.font = '15px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.icon, c.x, c.y - CUP - 11); ctx.textBaseline = 'alphabetic';
  });
  s.bumps.forEach((bp) => { const g = Math.max(0, bp.g), r = BR * g * (1 + (bp.hit > 0 ? bp.hit * 0.8 : 0)); if (r < 0.5) return; ctx.drawImage(bump, bp.x - r * 1.23, bp.y - r * 1.23, r * 2.46, r * 2.46); });
  if (s.trail.length >= 4) { ctx.lineCap = 'round'; for (let i = 2; i < s.trail.length; i += 2) { const u = i / s.trail.length; ctx.strokeStyle = `rgba(255,240,200,${0.4 * u})`; ctx.lineWidth = BALL * 1.3 * u; ctx.beginPath(); ctx.moveTo(s.trail[i - 2], s.trail[i - 1]); ctx.lineTo(s.trail[i], s.trail[i + 1]); ctx.stroke(); } }
  if (s.drag && speed() <= 140) {   // the pull: dots along where Fig flies, a power ring
    const dx = s.drag.x - s.drag.x0, dy = s.drag.y - s.drag.y0, d = Math.min(140, Math.hypot(dx, dy)), a = Math.atan2(dy, dx), pw = d / 140, col = `hsl(${120 - 120 * pw}, 95%, 60%)`;
    if (d >= 8) { let px = b.x, py = b.y, vx = -Math.cos(a) * d * 7.4, vy = -Math.sin(a) * d * 7.4; ctx.fillStyle = col; for (let i = 0; i < 14; i++) { vy += GRAV * 0.035; px += vx * 0.035; py += vy * 0.035; ctx.globalAlpha = 1 - i / 15; ctx.beginPath(); ctx.arc(px, py, 2.6 - i * 0.12, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.strokeStyle = '#00000066'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, BALL + 8, 0, 7); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, BALL + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pw); ctx.stroke(); }
  }
  ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.ellipse(b.x + 2, b.y + BALL + 1, BALL * 1.1, BALL * 0.4, 0, 0, 7); ctx.fill();
  const sc = b.pop > 0 ? 1 - b.pop * 1.8 : 1;
  if (sc > 0.1) drawPal(ph.mood(), ctx, { x: b.x, y: b.y, s: BALL * 1.15 * sc, t: ts, r: ph.S.curve.r, face: b.vx < 0 ? -1 : 1 });
  s.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); if (f.k === 'dot') { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, 2, 0, 7); ctx.fill(); } else { ctx.font = '900 14px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#0B140B'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } });
  ctx.globalAlpha = 1;
  if (s.time < 2.2) { const a = Math.min(1, (2.2 - s.time) * 1.5); ctx.globalAlpha = a; ctx.font = '400 20px Bungee, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#0B140B'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; const ty = s.T.cy - s.T.R - 28; ctx.strokeText('SINK ALL THREE', s.T.cx, ty); ctx.fillText('SINK ALL THREE', s.T.cx, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.strokeText('drag back from anywhere and let go', s.T.cx, ty + 18); ctx.fillStyle = '#fff'; ctx.fillText('drag back from anywhere and let go', s.T.cx, ty + 18); ctx.globalAlpha = 1; }
}
const pocket = {
  key: 'cup', name: 'Inside the cup', icon: '🕳️', goal: 'sink all three', dur: DUR, rim: '#F5C542', system: 'Hénon map',
  start(h, seed = {}) {
    ph = h; ctx = h.ctx; bg = null;
    s = { T: null, th: seed.theme || {}, path: seed.path || null, pw: seed.pw || 60, orb: { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.1 }, cups: [], bumps: [], fx: [], trail: [], drag: null, sunk: 0, pts: 0, flicks: 0, time: 0, done: false };
    s.T = table(); for (let i = 0; i < 60 + Math.floor(Math.random() * 60); i++) henon(s.orb);   // onto the attractor first
    rest();
    GIFTS.forEach(([gift, icon, name]) => { const p = nextSpot(70, [...s.cups, { x: s.ball.x, y: s.ball.y }]); if (p) s.cups.push({ ...p, gift, icon, name, sunk: false }); });
    for (let i = 0; i < 3; i++) spawnBump();
  },
  update, draw,
  onBeat() { if (s && !s.done) spawnBump(); },   // every beat up top, the orbit jumps and a bumper pops up where it lands
  pointer(type, p) {
    if (!s || s.done) return;
    if (type === 'down') s.drag = { x0: p.x, y0: p.y, x: p.x, y: p.y };
    else if (type === 'move') { if (s.drag) { s.drag.x = p.x; s.drag.y = p.y; } }
    else if (s.drag) { const d = s.drag; s.drag = null; flick(d.x - d.x0, d.y - d.y0); }
  },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'cup', ball: { x: s.ball.x, y: s.ball.y, v: speed() }, cups: s.cups.map((c) => ({ x: c.x, y: c.y, gift: c.gift, sunk: c.sunk })), bumps: s.bumps.filter((b) => !b.dying).map((b) => ({ x: b.x, y: b.y })), sunk: s.sunk, pts: s.pts, flicks: s.flicks, orbit: { ...s.orb }, table: { ...s.T },
    flick, sinkNext: () => { const c = s.cups.find((q) => !q.sunk); if (c) sink(c); return s.sunk; }, win: () => { s.cups.forEach((c) => sink(c)); return true; }, lose: () => ph.lose(result(false)), beat: () => pocket.onBeat() }),
};
export default pocket;
