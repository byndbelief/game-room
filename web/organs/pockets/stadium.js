// 🎰🕳️ INTO THE BILLIARD: Chaos Pinball's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a pinball game, the cup in the middle of the table glows; tap it and you drop through into a billiard table
// with no pockets and no friction: Fig rolls on and on at the same speed, bouncing off the rail forever. You can't
// touch Fig. You only have a little paddle: tap to put it somewhere, drag to turn it. Light all three lamps on the felt
// (roll Fig over them) before the table closes (20 s). Up top it's a banked ball save, the jackpot lit, and a heart.
//
// Random in its own way: the BUNIMOVICH STADIUM, two half circles joined by straight sides. On a round table a ball
// bounces in a neat pattern forever; on a rectangle too. Join them and the pattern breaks: the stadium is chaotic, and
// one path in time fills the whole table. Two balls that start a thousandth of a degree apart go together for a few
// bounces, then anywhere. A ghost Fig shows it: it starts on your path, 0.06° off, and you can watch the two split.
// One long path is printed on the felt in gold dust: it covers everything, the stadium's way of being fair.
import { drawPal } from '../../pals.js';

const DUR = 20, BR = 8, SPEED0 = 230, PADL = 52, PADT = 4, LAMP = 13;
let ph = null, ctx = null, s = null, bg = null;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const rng = (seed) => { let x = (seed >>> 0) || 7; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
// the stadium: every point within `a` of the upright segment from (cx, cy − b) to (cx, cy + b)
const near = (x, y) => { const T = s.T, yy = Math.max(T.cy - T.b, Math.min(T.cy + T.b, y)); return { x: T.cx, y: yy, d: Math.hypot(x - T.cx, y - yy) }; };
const inside = (x, y, m) => near(x, y).d <= s.T.a - m;
function wall(o) {   // reflect off the rail: the stadium's only rule
  const c = near(o.x, o.y), lim = s.T.a - BR; if (c.d <= lim) return false;
  const nx = (o.x - c.x) / c.d, ny = (o.y - c.y) / c.d, vn = o.vx * nx + o.vy * ny;
  if (vn > 0) { o.vx -= 2 * vn * nx; o.vy -= 2 * vn * ny; }
  o.x = c.x + nx * lim; o.y = c.y + ny * lim; return true;
}
function paddle(o) {   // the paddle is a short two-sided bar
  const p = s.pad, ux = Math.cos(p.ang), uy = Math.sin(p.ang), rx = o.x - p.x, ry = o.y - p.y;
  const u = Math.max(-PADL / 2, Math.min(PADL / 2, rx * ux + ry * uy)), qx = p.x + ux * u, qy = p.y + uy * u;
  let nx = o.x - qx, ny = o.y - qy; const d = Math.hypot(nx, ny), m = BR + PADT; if (d >= m) return false;
  if (d < 1e-6) { nx = -uy; ny = ux; } else { nx /= d; ny /= d; }
  const vn = o.vx * nx + o.vy * ny; if (vn < 0) { o.vx -= 2 * vn * nx; o.vy -= 2 * vn * ny; }
  o.x = qx + nx * m; o.y = qy + ny * m; return true;
}
const norm = (o, v) => { const l = Math.hypot(o.vx, o.vy) || 1; o.vx *= v / l; o.vy *= v / l; };
function move(o, h) { o.x += o.vx * h; o.y += o.vy * h; const w = wall(o), p = paddle(o); norm(o, s.speed); return [w, p]; }
function reTwin() { const b = s.ball, a = Math.atan2(b.vy, b.vx) + 0.001 * (Math.random() < 0.5 ? -1 : 1); s.twin = { x: b.x, y: b.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, t: 0 }; }
function update(dt) {
  if (!s) return;
  s.time += dt; s.flash = Math.max(0, s.flash - dt);
  const n = Math.max(1, Math.ceil(s.speed * dt / 2)), h = dt / n, b = s.ball;
  for (let i = 0; i < n && !s.done; i++) {
    const [w, p] = move(b, h);
    if (w) { s.bounces += 1; if (s.bounces % 2 === 0) ph.sfx('click'); }
    if (p) { s.paddled += 1; ph.sfx('clack'); s.flash = 0.12; }
    move(s.twin, h);
    for (const l of s.lamps) if (!l.on && Math.hypot(b.x - l.x, b.y - l.y) < LAMP + BR) light(l);
  }
  s.twin.t += dt; if (Math.hypot(s.twin.x - b.x, s.twin.y - b.y) > s.T.a * 1.1 || s.twin.t > 9) { s.split = s.twin.t; reTwin(); }
  s.trail.push(b.x, b.y); if (s.trail.length > 120) s.trail.splice(0, 2);
  s.fx.forEach((f) => { f.life -= dt; f.y -= 22 * dt; }); s.fx = s.fx.filter((f) => f.life > 0);
}
function light(l) {
  if (l.on || s.done) return; l.on = true; s.lit += 1; s.pts += 150; ph.sfx('chime'); ph.cue?.('score', l.x, l.y);
  s.fx.push({ x: l.x, y: l.y - 22, text: `${l.icon} ${l.name}`, life: 1.2 });
  if (s.lit >= s.lamps.length) { s.done = true; ph.sfx('fanfare'); setTimeout(() => ph.win(result(true)), 450); }
}
function result(won) {
  if (!won) return { pts: s.pts, why: s.lit ? `${s.lit} of 3 lit: the stadium kept the rest` : 'Fig never found the lamps' };
  const left = Math.round(ph.left?.() || 0);
  return { pts: s.pts + 200 + left * 15, label: '3 LAMPS · SAVE, JACKPOT, HEART', sub: `🛟 a ball save banked, 💰 the jackpot lit and ❤️ a heart to take up · ${left} s to spare`, gift: { save: 1, jackpot: 1, heal: 1 } };
}
// 🎨 the felt, painted once: deep violet cloth, the gold rail, and one long stadium path printed in gold dust (it fills
// the table: that's the chaos), the two half circles' centres marked like a billiard table's spots
function build() {
  const cv = ph.cv, k = ph.k, T = s.T, c = mk(cv.width, cv.height), x = c.getContext('2d');
  x.fillStyle = '#05040C'; x.fillRect(0, 0, c.width, c.height);
  x.setTransform(k, 0, 0, k, ph.ox || 0, ph.oy || 0);
  const W = ph.W, H = ph.H, shape = (m) => { x.beginPath(); x.arc(T.cx, T.cy - T.b, T.a + m, Math.PI, 0); x.lineTo(T.cx + T.a + m, T.cy + T.b); x.arc(T.cx, T.cy + T.b, T.a + m, 0, Math.PI); x.closePath(); };
  { const gr = x.createRadialGradient(T.cx, T.cy, 10, T.cx, T.cy, Math.hypot(W, H) * 0.6); gr.addColorStop(0, '#191238'); gr.addColorStop(1, '#05040C'); x.fillStyle = gr; x.fillRect(-20, -20, W + 40, H + 40); }
  x.strokeStyle = 'rgba(201,184,255,0.06)'; x.lineWidth = 1; for (let m = 16; m < 400; m += 16) { shape(m); x.stroke(); }   // ripples out from the table
  shape(14); x.fillStyle = '#3A2410'; x.fill(); shape(10); x.fillStyle = '#6B4A2B'; x.fill(); shape(4); x.fillStyle = '#F5C542'; x.fill();
  shape(0); { const gr = x.createRadialGradient(T.cx - T.a * 0.3, T.cy - T.b * 0.6, 10, T.cx, T.cy, T.a + T.b); gr.addColorStop(0, '#2F2470'); gr.addColorStop(1, '#16103A'); x.fillStyle = gr; x.fill(); }
  x.save(); shape(0); x.clip();
  for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < 0.5 ? '#ffffff0c' : '#00000018'; x.fillRect(T.cx - T.a + Math.random() * 2 * T.a, T.cy - T.b - T.a + Math.random() * (2 * T.a + 2 * T.b), 1.4, 1.4); }
  { const save = s.ball, o = { x: T.cx + 3, y: T.cy + 1, vx: 0.83, vy: 0.56 }, keep = s.speed; s.speed = 1; s.ball = o; const pad = s.pad; s.pad = { x: -9999, y: -9999, ang: 0 };
    x.strokeStyle = 'rgba(245,197,66,0.07)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(o.x, o.y);
    for (let i = 0; i < 9000; i++) { o.x += o.vx * 3; o.y += o.vy * 3; if (wall(o)) { norm(o, 1); x.lineTo(o.x, o.y); } }
    x.stroke(); s.ball = save; s.speed = keep; s.pad = pad; }
  x.fillStyle = 'rgba(255,255,255,0.35)'; [T.cy - T.b, T.cy + T.b].forEach((y) => { x.beginPath(); x.arc(T.cx, y, 2.2, 0, 7); x.fill(); });
  x.strokeStyle = 'rgba(255,255,255,0.12)'; x.setLineDash([3, 6]); x.beginPath(); x.moveTo(T.cx - T.a, T.cy - T.b); x.lineTo(T.cx + T.a, T.cy - T.b); x.moveTo(T.cx - T.a, T.cy + T.b); x.lineTo(T.cx + T.a, T.cy + T.b); x.stroke(); x.setLineDash([]);
  x.restore();
  x.strokeStyle = '#FFE08A88'; x.lineWidth = 1; shape(4); x.stroke();
  bg = { c, w: cv.width, h: cv.height, k, W, H };
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ts = t / 1000;
  if (!bg || bg.w !== cv.width || bg.h !== cv.height || bg.k !== k || bg.W !== ph.W || bg.H !== ph.H) build();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg.c, 0, 0);
  ctx.setTransform(k, 0, 0, k, ph.ox || 0, ph.oy || 0);
  // the lamps: gold and pulsing until Fig rolls over them, then teal
  s.lamps.forEach((l, i) => {
    const pu = 1 + 0.1 * Math.sin(ts * 5 + i * 2);
    ctx.fillStyle = l.on ? '#3DD6C655' : '#F5C54233'; ctx.beginPath(); ctx.arc(l.x, l.y, (LAMP + 7) * pu, 0, 7); ctx.fill();
    ctx.fillStyle = l.on ? '#3DD6C6' : '#F5C542'; ctx.beginPath(); ctx.arc(l.x, l.y, LAMP, 0, 7); ctx.fill(); ctx.strokeStyle = '#0B0918'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l.on ? '✓' : l.icon, l.x, l.y + 1); ctx.textBaseline = 'alphabetic';
  });
  // where Fig has been: a fading line (it bends only at the rail and the paddle)
  if (s.trail.length >= 4) { ctx.lineCap = 'round'; for (let i = 2; i < s.trail.length; i += 2) { const u = i / s.trail.length; ctx.strokeStyle = `rgba(255,224,138,${0.5 * u})`; ctx.lineWidth = 1 + 3 * u; ctx.beginPath(); ctx.moveTo(s.trail[i - 2], s.trail[i - 1]); ctx.lineTo(s.trail[i], s.trail[i + 1]); ctx.stroke(); } }
  // the paddle
  { const p = s.pad, ux = Math.cos(p.ang), uy = Math.sin(p.ang); ctx.lineCap = 'round';
    ctx.strokeStyle = '#05040C'; ctx.lineWidth = PADT * 2 + 3; ctx.beginPath(); ctx.moveTo(p.x - ux * PADL / 2, p.y - uy * PADL / 2); ctx.lineTo(p.x + ux * PADL / 2, p.y + uy * PADL / 2); ctx.stroke();
    ctx.strokeStyle = s.flash > 0 ? '#FFFFFF' : '#FF5FB0'; ctx.lineWidth = PADT * 2; ctx.stroke();
    ctx.fillStyle = '#F5C542'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    if (s.drag) { ctx.strokeStyle = '#FF5FB066'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, PADL / 2 + 6, 0, 7); ctx.stroke(); ctx.setLineDash([]); } }
  // the ghost: Fig's twin, a hair off, drifting away
  { const tw = s.twin; ctx.globalAlpha = 0.32; drawPal(ph.mood(), ctx, { x: tw.x, y: tw.y, s: BR * 1.15, t: ts, r: ph.S.curve.r, face: tw.vx < 0 ? -1 : 1 }); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(201,184,255,0.35)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.ball.x, s.ball.y); ctx.lineTo(tw.x, tw.y); ctx.stroke(); ctx.setLineDash([]); }
  const b = s.ball;
  ctx.fillStyle = '#00000066'; ctx.beginPath(); ctx.ellipse(b.x + 2, b.y + BR, BR * 1.05, BR * 0.4, 0, 0, 7); ctx.fill();
  drawPal(ph.mood(), ctx, { x: b.x, y: b.y, s: BR * 1.15, t: ts, r: ph.S.curve.r, face: b.vx < 0 ? -1 : 1 });
  s.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); ctx.font = '900 14px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0B0918'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = '#FFE08A'; ctx.fillText(f.text, f.x, f.y); });
  ctx.globalAlpha = 1;
  const T = s.T, ty = T.cy - T.b - T.a - 30;
  { ctx.font = '800 10px Sora, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(201,184,255,0.75)'; ctx.fillText(s.split ? `the ghost started 0.06° off · it split in ${s.split.toFixed(1)} s` : 'the ghost starts 0.06° off your path', T.cx, T.cy + T.b + T.a + 26); }
  if (s.time < 2.4) { const a = Math.min(1, (2.4 - s.time) * 1.5); ctx.globalAlpha = a; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#0B0918'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText('LIGHT ALL THREE', T.cx, ty); ctx.fillText('LIGHT ALL THREE', T.cx, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.strokeText('tap to place the paddle · drag to turn it', T.cx, ty + 18); ctx.fillStyle = '#fff'; ctx.fillText('tap to place the paddle · drag to turn it', T.cx, ty + 18); ctx.globalAlpha = 1; }
}
const pocket = {
  key: 'stadium', name: 'Into the billiard', icon: '🎱', goal: 'light all three', dur: DUR, rim: '#FF5FB0', system: 'Bunimovich stadium',
  start(h, seed = {}) {
    ph = h; ctx = h.ctx; bg = null;
    const W = h.W, H = h.H, r = rng(seed.seed || Math.floor(Math.random() * 1e9)), st = seed.stage || 1;
    const a = Math.min(W * 0.4, H * 0.24), b = Math.max(20, Math.min(H * 0.17, H * 0.42 - a));
    s = { T: { cx: W / 2, cy: H * 0.53, a, b }, speed: SPEED0 + 18 * (st - 1), ball: null, twin: null, pad: { x: W / 2, y: H * 0.53 + b * 0.4, ang: 0.35 }, lamps: [], trail: [], fx: [], time: 0, lit: 0, pts: 0, bounces: 0, paddled: 0, split: 0, flash: 0, done: false, drag: null };
    const T = s.T, ang = r() * Math.PI * 2;
    s.ball = { x: T.cx + (r() - 0.5) * a * 0.6, y: T.cy - b * 0.5, vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed }; reTwin();
    const icons = [['🛟', 'SAVE'], ['💰', 'JACKPOT'], ['❤️', 'HEART']];
    for (let tries = 0; s.lamps.length < 3 && tries < 400; tries++) {
      const x = T.cx + (r() * 2 - 1) * a, y = T.cy + (r() * 2 - 1) * (a + b);
      if (!inside(x, y, LAMP + 14)) continue;
      if (Math.hypot(x - s.ball.x, y - s.ball.y) < 70 || s.lamps.some((l) => Math.hypot(l.x - x, l.y - y) < Math.min(90, a * 0.9))) continue;
      const [icon, name] = icons[s.lamps.length]; s.lamps.push({ x, y, icon, name, on: false });
    }
  },
  update, draw,
  onBeat() { if (s && !s.done) { s.speed = Math.min(340, s.speed * 1.03); s.flash = 0.08; } },   // every beat up top, Fig rolls a touch faster
  pointer(type, p) {
    if (!s || s.done) return;
    const T = s.T, c = near(p.x, p.y), lim = T.a - 8, q = c.d > lim ? { x: c.x + (p.x - c.x) / c.d * lim, y: c.y + (p.y - c.y) / c.d * lim } : p;
    if (type === 'down') { s.pad.x = q.x; s.pad.y = q.y; s.drag = { x: p.x, y: p.y }; ph.sfx('click'); }
    else if (type === 'move' && s.drag) { const dx = p.x - s.pad.x, dy = p.y - s.pad.y; if (Math.hypot(dx, dy) > 10) s.pad.ang = Math.atan2(dy, dx); }
    else if (type === 'up') s.drag = null;
  },
  keydown(e) {
    if (!s) return; const k = e.key, p = s.pad;
    if (k === 'q' || k === 'Q' || k === 'ArrowUp') p.ang -= 0.2; else if (k === 'e' || k === 'E' || k === 'ArrowDown') p.ang += 0.2;
    else if (k === 'a' || k === 'A' || k === 'ArrowLeft') p.x -= 14; else if (k === 'd' || k === 'D' || k === 'ArrowRight') p.x += 14;
    else if (k === 'w' || k === 'W') p.y -= 14; else if (k === 's' || k === 'S') p.y += 14;
    const c = near(p.x, p.y), lim = s.T.a - 8; if (c.d > lim) { p.x = c.x + (p.x - c.x) / c.d * lim; p.y = c.y + (p.y - c.y) / c.d * lim; }
  },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'stadium', ball: { x: s.ball.x, y: s.ball.y, vx: s.ball.vx, vy: s.ball.vy, v: Math.hypot(s.ball.vx, s.ball.vy) }, twin: { x: s.twin.x, y: s.twin.y }, pad: { ...s.pad }, lamps: s.lamps.map((l) => ({ x: l.x, y: l.y, on: l.on, name: l.name })), lit: s.lit, bounces: s.bounces, paddled: s.paddled, split: s.split, speed: s.speed, table: { ...s.T }, pts: s.pts,
    inside: (x, y) => inside(x, y, BR), lightNext: () => { const l = s.lamps.find((q) => !q.on); if (l) light(l); return s.lit; }, win: () => { s.lamps.forEach((l) => light(l)); return true; }, lose: () => ph.lose(result(false)), beat: () => pocket.onBeat(),
    aimAt: (i) => { const l = s.lamps[i], b = s.ball, d = Math.hypot(l.x - b.x, l.y - b.y); b.vx = (l.x - b.x) / d * s.speed; b.vy = (l.y - b.y) / d * s.speed; return true; } }),
};
export default pocket;
