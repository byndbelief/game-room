// 🐿️🕳️ INTO THE KNOTHOLE: Squirrel Chaos's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in the wood, the knothole in the middle trunk glows (the same hole each Day dives into); tap it and you drop in.
// Inside, the trunk is hollow all the way down through its roots, and somewhere at the bottom is a squirrel's hidden stash.
// Fig falls, holding two leaves for wings: tap to flap (up a little, and toward where you tapped), hold to drift toward
// your finger. Thread the gaps in the rows of roots, grab the acorns 🌰 on the way and land in the stash before the
// hole closes (22 s). Bumping a root only stuns Fig a moment (it costs time, never a life). The stash sends up a heart
// for Squirrel's lives and a weapon crate opened straight into the weapon bar; every acorn is points.
//
// Random in its own way: the TENT MAP, x' = μ·min(x, 1 − x) with μ = 1.99. Each new row's gap sits at the next iterate.
// The logistic curve up top swings smoothly round its hump; the tent folds at a sharp corner, so it doubles every
// distance between two starts on every step: one gap at the far left, the next one halfway over, then all the way right.
// Jagged, sudden, still never twice the same (it never settles into a rhythm: every orbit wanders the whole span).
import { drawPal } from '../../pals.js';

const MU = 1.99, ROWS = 12, TOP = 120, GAPY = 112, STASH = 230, SW = 400, WALL = 26, EXT = 60, R = 9, RT = 8, DUR = 22;
const GRAV = 430, FALL = 235, FLAP = 175, STEER = 230, STUN = 0.55, ACORN = 40;
const CRATES = [['nail', '🔩', 'nail gun', 'NAIL GUN'], ['shotgun', '💥', 'staple shotgun', 'SHOTGUN'], ['bomb', '🧨', 'tack bomb', 'TACK BOMB'], ['chain', '⚡', 'chain stapler', 'CHAIN'], ['chaos', '🌀', 'chaos cannon', 'CANNON']];
let ph = null, ctx = null, s = null, look = null;
const tent = (x) => MU * Math.min(x, 1 - x);
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const IN_L = WALL, IN_R = SW - WALL, LEN = TOP + ROWS * GAPY + STASH;
const offX = () => ((ph.W || SW) - SW) / 2;

function start(h, seed = {}) {
  ph = h; ctx = h.ctx; look = null;
  const se = seed.season || {}, r = rng(seed.seed || Math.floor(Math.random() * 1e9));
  s = { se, r, x: 0.05 + r() * 0.9, rows: [], acorns: [], fig: { x: SW / 2, y: 46, vx: 0, vy: 40, face: 1, flapT: 0, stun: 0 }, hold: null, cam: 0,
    got: 0, pts: 0, flaps: 0, bumps: 0, time: 0, done: false, fx: [], bits: [], passed: 0, auto: false, stashY: TOP + ROWS * GAPY + 70 };
  s.x0 = s.x;
  // 🔺 the rows: each gap centre is the next tent-map iterate; the gaps narrow a little on the way down
  let prev = SW / 2;
  for (let i = 0; i < ROWS; i++) {
    s.x = tent(s.x); const gw = 104 - 26 * (i / (ROWS - 1)), c = IN_L + gw / 2 + s.x * (IN_R - IN_L - gw);
    s.rows.push({ y: TOP + i * GAPY + GAPY * 0.5, c, gw, l: c - gw / 2, rr: c + gw / 2, x: s.x });
    // 🌰 an acorn halfway between this gap and the one before it (the line you'll fly anyway, if you're quick)
    if (i > 0) s.acorns.push({ x: (prev + c) / 2 + (r() - 0.5) * 30, y: TOP + i * GAPY, got: false, ph: r() * 6 });
    prev = c;
  }
  s.acorns.push({ x: prev + (r() - 0.5) * 60, y: s.rows[ROWS - 1].y + GAPY * 0.55, got: false, ph: 1 });
  s.x = tent(s.x); s.crate = CRATES[Math.min(CRATES.length - 1, Math.floor(s.x * CRATES.length))];   // the stash's crate: one more fold of the tent
}
function flap(tx) {
  const f = s?.fig; if (!f || s.done || f.stun > 0) return false;
  const dx = tx == null ? 0 : tx - f.x;
  f.vy = Math.min(f.vy * 0.3, 0) - FLAP; f.vx += Math.sign(dx) * Math.min(1, Math.abs(dx) / 70) * 150; f.vx = Math.max(-STEER, Math.min(STEER, f.vx));
  if (Math.abs(dx) > 4) f.face = dx > 0 ? 1 : -1;
  f.flapT = 0.28; s.flaps += 1; ph.sfx('putt', { power: 0.25 });
  for (let i = 0; i < 3; i++) s.fx.push({ k: 'leaf', x: f.x + (Math.random() - 0.5) * 14, y: f.y + 6, vx: (Math.random() - 0.5) * 40, vy: 30 + Math.random() * 30, a: Math.random() * 6, c: leafCol(i), life: 0.7 });
  return true;
}
const leafCol = (i) => { const se = s.se, p = se.bloom || se.leaf || ['#58A644', '#86C960', '#BDE58C']; return p[(i % (p.length - 1)) + 1] || p[0]; };
function bump(nx, ny) {   // a root: Fig bounces off it, dizzy for a moment (time lost, nothing else)
  const f = s.fig, vn = f.vx * nx + f.vy * ny;
  if (vn < 0) { f.vx -= 1.5 * vn * nx; f.vy -= 1.5 * vn * ny; }
  if (ny < -0.3) f.vy = Math.min(f.vy, -90);
  if (f.stun <= 0 && Math.abs(vn) > 40) { f.stun = STUN; s.bumps += 1; ph.sfx('thud'); navigator.vibrate?.(25);
    for (let i = 0; i < 8; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 80; s.fx.push({ k: 'dot', x: f.x - nx * R, y: f.y - ny * R, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, c: (s.se.bark || ['#8C6A48'])[i % 2 ? 0 : 2] || '#8C6A48', life: 0.5 }); } }
}
function capsule(ax, bx, y) {   // the closest point on a root (a thick horizontal segment) to Fig, and a push out of it
  const f = s.fig, px = Math.max(ax, Math.min(bx, f.x)), dx = f.x - px, dy = f.y - y, d = Math.hypot(dx, dy);
  if (d >= R + RT || d === 0) return;
  const nx = dx / d, ny = dy / d; f.x = px + nx * (R + RT); f.y = y + ny * (R + RT); bump(nx, ny);
}
function result(won) {
  if (!won) return { pts: s.pts, why: s.got ? `the knothole closed · ${s.got} 🌰 on the way` : 'the knothole closed over you' };
  const left = Math.round(ph.left?.() || 0), [w, icon, name, short] = s.crate;
  return { pts: s.pts + 250 + left * 15, label: `THE STASH · ❤️ AND A ${short}`, sub: `❤️ one life back, ${icon} a ${name} in your hand${s.got ? `, ${s.got} 🌰` : ''} · ${left} s to spare`, gift: { heart: 1, crate: w, acorns: s.got } };
}
function win() {
  if (s.done) return; s.done = true; ph.sfx('fanfare');
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 150; s.fx.push({ k: 'dot', x: s.fig.x, y: s.fig.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c: ['#F5C542', '#FFF3C4', '#C98B4A'][i % 3], life: 0.9 }); }
  s.fx.push({ k: 'text', x: s.fig.x, y: s.fig.y - 24, text: 'THE STASH!', life: 1.2 });
  setTimeout(() => ph.win(result(true)), 450);
}
function update(dt) {
  if (!s) return;
  s.time += dt; const f = s.fig;
  if (f.stun > 0) f.stun -= dt; if (f.flapT > 0) f.flapT -= dt;
  if (s.auto && !s.done) autopilot();
  if (!s.done) {
    if (s.hold && f.stun <= 0) { const want = Math.max(-STEER, Math.min(STEER, (s.hold.x - offX() - f.x) * 4)); f.vx += (want - f.vx) * Math.min(1, dt * 5); if (Math.abs(want) > 8) f.face = want > 0 ? 1 : -1; }
    else f.vx *= 1 - Math.min(1, dt * 1.6);
    f.vy = Math.min(FALL, f.vy + GRAV * dt);
    const n = 3, h = dt / n;
    for (let k = 0; k < n; k++) {
      f.x += f.vx * h; f.y += f.vy * h;
      if (f.x < IN_L + R) { f.x = IN_L + R; f.vx = Math.abs(f.vx) * 0.5; } if (f.x > IN_R - R) { f.x = IN_R - R; f.vx = -Math.abs(f.vx) * 0.5; }
      if (f.y < 30) { f.y = 30; f.vy = Math.max(0, f.vy); }
      for (const row of s.rows) { if (Math.abs(row.y - f.y) > R + RT + 2) continue; capsule(-EXT, row.l - RT, row.y); capsule(row.rr + RT, SW + EXT, row.y); }
    }
    s.passed = s.rows.filter((row) => f.y > row.y + RT).length;
    s.acorns.forEach((a) => { if (!a.got && Math.hypot(a.x - f.x, a.y - f.y) < R + 10) { a.got = true; s.got += 1; s.pts += ACORN; ph.sfx('pop'); s.fx.push({ k: 'text', x: a.x, y: a.y - 14, text: `🌰 +${ACORN}`, life: 0.9 }); } });
    if (f.y >= s.stashY) win();
  }
  // the camera: Fig a third of the way down the view, so the next rows show below
  const H = ph.H, to = Math.max(0, Math.min(LEN - H, f.y - H * 0.36)); s.cam += (to - s.cam) * Math.min(1, dt * 6);
  s.fx.forEach((q) => { q.life -= dt; if (q.k === 'text') q.y -= 22 * dt; else { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.k === 'leaf' ? 60 : 300) * dt; q.vx *= 1 - dt * (q.k === 'leaf' ? 2 : 0); if (q.k === 'leaf') q.a += dt * 6; } });
  s.fx = s.fx.filter((q) => q.life > 0); if (s.fx.length > 140) s.fx.splice(0, s.fx.length - 140);
  s.bits.forEach((b) => { b.y += b.vy * dt; b.x += Math.sin(s.time * 2 + b.ph) * 12 * dt; b.a += dt * 3; }); s.bits = s.bits.filter((b) => b.y < s.cam + H + 20);
}
function autopilot() {   // a test pilot: steer under the next gap, flap to hover when it's not lined up yet
  const f = s.fig, row = s.rows.find((q) => q.y > f.y - RT), target = row ? row.c : SW / 2;
  s.hold = { x: target + offX(), y: f.y };
  if (row && f.stun <= 0) { const dy = row.y - f.y, off = Math.abs(target - f.x), room = row.gw / 2 - R - RT * 0.2; if (dy < 70 && dy > 0 && off > room - 6 && f.vy > -40) flap(f.x + Math.sign(target - f.x) * 30); }
}
// 🎨 THE LOOK, painted once into one tall canvas: the hollow of the trunk in the season's bark (wood going to soil as you
// sink below the ground line), its grain, moss and the season's fallen leaves on every root, the knothole's light from
// the top, the rows of roots with their hairs hanging down, and the stash at the bottom: a hollow of acorns, a crate.
function buildLook() {
  const se = s.se, k = ph.k, CW = SW + 2 * EXT, q = Math.min(k, Math.sqrt(3.6e6 / (CW * LEN))), c = mk(CW * q, LEN * q), x = c.getContext('2d', { alpha: false }), r = rng(9 + Math.round(s.x0 * 1e6));
  const bark = se.bark || ['#5E4128', '#36231A', '#8C6A48'], soil = se.soil || ['#4E3622', '#2E1F13'], sky = se.sky || ['#79B4E6', '#BCDDF2', '#FCE4CC'];
  x.setTransform(q, 0, 0, q, EXT * q, 0);
  const groundY = TOP + GAPY * 4.5;   // below here the trunk's roots: wood gives way to earth
  for (let y = 0; y < LEN; y += 24) {   // the hollow: lighter near the hole, darker down, then earth
    const u = Math.max(0, Math.min(1, (y - groundY) / (GAPY * 3))), dk = Math.min(0.75, y / LEN * 0.9);
    x.fillStyle = mix(mix(mix(bark[0], bark[1], 0.55), mix(soil[0], soil[1], 0.4), u), '#050302', dk * 0.6); x.fillRect(IN_L - 2, y, IN_R - IN_L + 4, 25);
    x.fillStyle = mix(mix(bark[1], soil[1], u), '#050302', dk * 0.4); x.fillRect(-EXT, y, EXT + IN_L, 25); x.fillRect(IN_R, y, EXT + SW - IN_R, 25);
  }
  x.lineCap = 'round';
  for (let i = 0; i < 70; i++) { const gx = IN_L + 6 + r() * (IN_R - IN_L - 12), y0 = r() * LEN, l = 60 + r() * 220; x.strokeStyle = r() < 0.5 ? '#00000026' : '#ffffff0f'; x.lineWidth = 0.8 + r() * 1.6; x.beginPath(); for (let y = y0; y < y0 + l; y += 10) x.lineTo(gx + Math.sin(y / 37 + i) * 4, y); x.stroke(); }   // the grain inside
  [IN_L, IN_R].forEach((wx, side) => {   // the inner faces of the walls: a dark lip, a lit edge, knots
    x.fillStyle = '#00000055'; x.fillRect(side ? wx - 7 : wx, 0, 7, LEN); x.fillStyle = bark[2] + '88'; x.fillRect(side ? wx - 1.5 : wx, 0, 1.5, LEN);
    for (let i = 0; i < 9; i++) { const y = 40 + r() * (LEN - 80); x.fillStyle = bark[1]; x.beginPath(); x.ellipse(wx + (side ? -5 : 5), y, 3, 7, 0, 0, 7); x.fill(); }
    if (se.moss) { x.fillStyle = se.moss + '55'; for (let i = 0; i < 40; i++) { const y = r() * groundY; x.beginPath(); x.ellipse(wx + (side ? -2 - r() * 4 : 2 + r() * 4), y, 1.5 + r() * 2.5, 3 + r() * 6, (r() - 0.5) * 0.8, 0, 7); x.fill(); } }
    if (se.glowShroom) for (let i = 0; i < 10; i++) { const y = 80 + r() * (LEN - 160), gx = wx + (side ? -6 : 6); x.fillStyle = 'rgba(140,255,200,0.16)'; x.beginPath(); x.arc(gx, y, 9, 0, 7); x.fill(); x.fillStyle = '#CFE8D8'; x.beginPath(); x.ellipse(gx, y, 3, 1.8, 0, 0, 7); x.fill(); }
  });
  for (let i = 0; i < 90; i++) { const y = groundY + r() * (LEN - groundY); x.fillStyle = r() < 0.5 ? '#00000033' : '#ffffff10'; x.beginPath(); x.ellipse(IN_L + r() * (IN_R - IN_L), y, 1 + r() * 3, 0.8 + r() * 1.5, 0, 0, 7); x.fill(); }   // pebbles in the earth
  // the knothole above: the sky through it, its light falling down the hollow
  { const hx = SW / 2, hy = 14; x.fillStyle = bark[1]; x.fillRect(IN_L, -4, IN_R - IN_L, 26);
    const g = x.createLinearGradient(0, hy - 10, 0, hy + 10); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[2]); x.fillStyle = g; x.beginPath(); x.ellipse(hx, hy, 34, 12, 0, 0, 7); x.fill();
    x.strokeStyle = bark[2]; x.lineWidth = 3; x.stroke();
    x.globalCompositeOperation = 'lighter'; const L = x.createLinearGradient(0, hy, 0, hy + 520); L.addColorStop(0, 'rgba(255,240,200,0.22)'); L.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = L;
    x.beginPath(); x.moveTo(hx - 30, hy); x.lineTo(hx + 30, hy); x.lineTo(hx + 130, hy + 520); x.lineTo(hx - 130, hy + 520); x.closePath(); x.fill(); x.globalCompositeOperation = 'source-over'; }
  // the roots: gnarled from the wall to the gap's edge, hairs hanging down, leaves caught on top
  const hair = (px, py, a, l, d) => { const qx = px + Math.cos(a) * l, qy = py + Math.sin(a) * l; x.lineWidth = Math.max(0.5, d * 0.7); x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke(); if (d > 0) { hair(qx, qy, a - 0.45 + (r() - 0.5) * 0.3, l * 0.62, d - 1); hair(qx, qy, a + 0.45 + (r() - 0.5) * 0.3, l * 0.62, d - 1); } };
  s.rows.forEach((row, i) => {
    const u = Math.max(0, Math.min(1, (row.y - groundY) / (GAPY * 3))), dark = mix(bark[1], soil[1], u * 0.6), mid = mix(bark[0], soil[0], u * 0.5), lit = mix(bark[2], soil[0], u * 0.4);
    [[-EXT, row.l - RT, 1], [SW + EXT, row.rr + RT, -1]].forEach(([x0, x1, dir]) => {
      const ph0 = r() * 6, pts = []; for (let n = 0; n <= 12; n++) { const t = n / 12; pts.push([x0 + (x1 - x0) * t, row.y + Math.sin(t * 7.3 + ph0) * 2.6 * (1 - t * 0.6) + (r() - 0.5) * 1.2]); }   // gnarled: a slow wave, thick at the wall
      const stroke = (w0, w1, col, dy = 0) => { x.strokeStyle = col; for (let n = 1; n < pts.length; n++) { const t = n / (pts.length - 1); x.lineWidth = w0 + (w1 - w0) * t; x.beginPath(); x.moveTo(pts[n - 1][0], pts[n - 1][1] + dy); x.lineTo(pts[n][0], pts[n][1] + dy); x.stroke(); } };
      x.strokeStyle = dark; x.lineCap = 'round'; for (let h = 0; h < 5; h++) { const t = 0.15 + r() * 0.8, px = x0 + (x1 - x0) * t; hair(px, row.y + RT - 2, Math.PI / 2 + (r() - 0.5) * 0.6, 8 + r() * 10, 2); }
      stroke(RT * 2 + 12, RT * 2 + 3, '#00000066', 1.5); stroke(RT * 2 + 9, RT * 2, dark); stroke(RT * 1.5 + 6, RT * 1.3, mid, -1); stroke(3, 1.6, lit, -RT * 0.6);
      x.strokeStyle = dark + 'aa'; x.lineWidth = 0.9; for (let n = 0; n < 5; n++) { const a = 0.1 + r() * 0.7, b = Math.min(1, a + 0.12 + r() * 0.2), dy = (r() - 0.5) * RT; x.beginPath(); x.moveTo(x0 + (x1 - x0) * a, row.y + dy); x.lineTo(x0 + (x1 - x0) * b, row.y + dy + (r() - 0.5) * 2); x.stroke(); }   // bark lines along the root
      x.fillStyle = mid; x.beginPath(); x.arc(x1, row.y, RT, 0, 7); x.fill(); x.fillStyle = lit; x.beginPath(); x.arc(x1 - dir * 1.5, row.y - 2.5, RT * 0.45, 0, 7); x.fill();   // the root's tip, at the gap
      const fl = se.fallen || ['#86C960']; for (let n = 0; n < 4; n++) { const px = x0 + (x1 - x0) * (0.3 + r() * 0.65); x.fillStyle = fl[n % fl.length]; x.beginPath(); x.ellipse(px, row.y - RT + 0.5, 2.4 + r() * 1.5, 1.1, (r() - 0.5) * 0.6, 0, 7); x.fill(); }
    });
    if (i === Math.floor(ROWS / 2)) { x.globalAlpha = 0.5; x.fillStyle = '#FFE08A'; x.font = '900 10px system-ui, sans-serif'; x.textAlign = 'center'; x.fillText('· halfway ·', SW / 2, row.y - GAPY / 2); x.globalAlpha = 1; }
  });
  // the stash: a round hollow in the earth, acorns piled up, a crate on top, warm light
  { const sy = s.stashY, cx = SW / 2;
    x.fillStyle = '#000000aa'; x.beginPath(); x.ellipse(cx, sy + 70, IN_R - IN_L - 10, 90, 0, Math.PI, 0); x.fill();
    x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(cx, sy + 60, 6, cx, sy + 60, 170); g.addColorStop(0, 'rgba(255,200,90,0.5)'); g.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = g; x.fillRect(cx - 180, sy - 120, 360, 300); x.globalCompositeOperation = 'source-over';
    x.fillStyle = mix(soil[0], '#000000', 0.2); x.beginPath(); x.ellipse(cx, sy + 104, IN_R - IN_L, 46, 0, 0, 7); x.fill();
    for (let n = 0; n < 46; n++) { const a = r() * Math.PI, rr = Math.sqrt(r()), ax = cx + Math.cos(a) * rr * 130, ay = sy + 96 - Math.sin(a) * rr * 34; nut(x, ax, ay, 4.5 + r() * 1.5, r() * 6); }
    x.font = '26px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('📦', cx + 4, sy + 52); x.textBaseline = 'alphabetic';
    x.fillStyle = '#FFE08A'; x.font = '900 11px system-ui, sans-serif'; x.fillText('THE STASH', cx, sy + 20); }
  // the acorn sprite, the stash's glow sprite
  const A = Math.max(16, Math.round(22 * k)), sp = mk(A, A), sx = sp.getContext('2d'); sx.scale(A / 22, A / 22); nut(sx, 11, 12, 6.5, -0.3);
  const gl = mk(64, 64), gx = gl.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,214,120,0.8)'); gr.addColorStop(0.4, 'rgba(255,190,90,0.25)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
  look = { c, q, k, CW, acorn: sp, glow: gl, edge: mix(bark[1], '#000000', 0.5) };
}
function nut(x, ax, ay, sz, rot) {   // 🌰 an acorn: a glossy nut under a crosshatched cap with a stalk
  x.save(); x.translate(ax, ay); x.rotate(rot);
  x.fillStyle = '#8A4E1E'; x.beginPath(); x.ellipse(0, sz * 0.25, sz * 0.78, sz, 0, 0, 7); x.fill();
  x.fillStyle = '#C47A34'; x.beginPath(); x.ellipse(-sz * 0.2, sz * 0.15, sz * 0.32, sz * 0.62, 0, 0, 7); x.fill();
  x.fillStyle = '#5A3A1E'; x.beginPath(); x.ellipse(0, -sz * 0.45, sz * 0.92, sz * 0.48, 0, Math.PI, 0); x.closePath(); x.fill();
  x.strokeStyle = '#3A2410'; x.lineWidth = Math.max(0.5, sz * 0.12); x.beginPath(); x.moveTo(-sz * 0.5, -sz * 0.7); x.lineTo(sz * 0.2, -sz * 0.5); x.moveTo(-sz * 0.1, -sz * 0.85); x.lineTo(sz * 0.6, -sz * 0.6); x.stroke();
  x.beginPath(); x.moveTo(0, -sz * 0.9); x.lineTo(sz * 0.15, -sz * 1.3); x.stroke();
  x.restore();
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ts = t / 1000, ox = (ph.ox || 0) + offX() * k, oy = ph.oy || 0, H = ph.H;
  if (!look || look.k !== k) buildLook();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = look.edge; ctx.fillRect(0, 0, cv.width, cv.height);
  { const q = look.q, sy = Math.max(0, s.cam * q), sh = Math.min(look.c.height - sy, (H + 2) * q);   // the visible slice of the trunk
    if (sh > 0) ctx.drawImage(look.c, 0, sy, look.c.width, sh, ox - EXT * k, oy + (sy / q - s.cam) * k, look.CW * k, (sh / q) * k); }
  ctx.setTransform(k, 0, 0, k, ox, oy - s.cam * k);
  const vis = (y) => y > s.cam - 30 && y < s.cam + H + 30;
  // the stash glows; the acorns bob, a soft light behind each
  ctx.globalCompositeOperation = 'lighter';
  if (vis(s.stashY + 60)) { const pu = 1 + 0.1 * Math.sin(ts * 3); ctx.drawImage(look.glow, SW / 2 - 90 * pu, s.stashY + 60 - 90 * pu, 180 * pu, 180 * pu); }
  s.acorns.forEach((a) => { if (!a.got && vis(a.y)) { ctx.globalAlpha = 0.5; ctx.drawImage(look.glow, a.x - 16, a.y - 16, 32, 32); } }); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  s.acorns.forEach((a) => { if (!a.got && vis(a.y)) { const b = Math.sin(ts * 3 + a.ph) * 2; ctx.drawImage(look.acorn, a.x - 11, a.y - 11 + b, 22, 22); } });
  s.bits.forEach((b) => { ctx.fillStyle = b.c; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillRect(-b.s, -b.s * 0.4, b.s * 2, b.s * 0.8); ctx.restore(); });
  // 🟢 Fig, with two leaves for wings (a beat down on every flap)
  { const f = s.fig, w = f.flapT > 0 ? Math.sin((0.28 - f.flapT) / 0.28 * Math.PI) : 0.25 + 0.15 * Math.sin(ts * 9), cols = s.se.leaf || ['#3D8638', '#58A644', '#86C960'];
    [-1, 1].forEach((side) => { ctx.save(); ctx.translate(f.x + side * R * 0.7, f.y - 2); ctx.rotate(side * (-0.9 + w * 1.5)); ctx.fillStyle = cols[2] || cols[0]; ctx.beginPath(); ctx.ellipse(side * R * 0.9, 0, R * 0.95, R * 0.42, 0, 0, 7); ctx.fill(); ctx.strokeStyle = cols[0]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * R * 1.7, 0); ctx.stroke(); ctx.restore(); });
    drawPal(ph.mood(), ctx, { x: f.x, y: f.y, s: R * 1.1, t: ts, r: ph.S.curve.r, face: f.face, hurt: f.stun > 0 });
    if (f.stun > 0) { ctx.fillStyle = '#FFE08A'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; for (let i = 0; i < 3; i++) { const a = ts * 9 + i * 2.1; ctx.fillText('✦', f.x + Math.cos(a) * 12, f.y - 14 + Math.sin(a) * 3); } } }
  if (s.hold && !s.done) { ctx.strokeStyle = '#FFE9A866'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(s.fig.x, s.fig.y); ctx.lineTo(s.hold.x - offX(), s.fig.y); ctx.stroke(); ctx.setLineDash([]); }
  s.fx.forEach((q) => { ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 1.8));
    if (q.k === 'dot') { ctx.fillStyle = q.c; ctx.fillRect(q.x - 1.2, q.y - 1.2, 2.4, 2.4); }
    else if (q.k === 'leaf') { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = q.c; ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 1.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
    else { ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#1A0F08'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(q.text, q.x, q.y); ctx.fillText(q.text, q.x, q.y); } });
  ctx.globalAlpha = 1;
  // how far down: a thin gauge on the right wall, an acorn for the stash at its foot
  { const gx = IN_R - 5, y0 = s.cam + 40, y1 = s.cam + H - 40, u = Math.min(1, s.fig.y / s.stashY); ctx.fillStyle = '#00000066'; ctx.fillRect(gx - 1.5, y0, 3, y1 - y0); ctx.fillStyle = '#F5C542'; ctx.fillRect(gx - 1.5, y0, 3, (y1 - y0) * u); ctx.beginPath(); ctx.arc(gx, y0 + (y1 - y0) * u, 3.2, 0, 7); ctx.fill(); ctx.drawImage(look.acorn, gx - 7, y1 - 2, 14, 14); }
  if (s.time < 2.4) { const a = Math.min(1, (2.4 - s.time) * 1.5), ty = s.cam + H * 0.62; ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#120806'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText('DOWN TO THE STASH', SW / 2, ty); ctx.fillText('DOWN TO THE STASH', SW / 2, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.fillStyle = '#fff'; ctx.strokeText('tap to flap · hold to drift that way', SW / 2, ty + 18); ctx.fillText('tap to flap · hold to drift that way', SW / 2, ty + 18); ctx.globalAlpha = 1; }
}
const KEYS = { Space: 0, ArrowUp: 0, KeyW: 0, ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
const pocket = {
  key: 'knothole', name: 'Into the knothole', icon: '🌰', goal: 'down to the stash', dur: DUR, rim: '#E2A33A', system: 'tent map',
  start, update, draw,
  onBeat(ev) {   // a beat up top: the old trunk creaks and bark and leaves trickle down past Fig
    if (!s || s.done) return; const n = ev?.peak ? 7 : 3, fl = s.se.fallen || ['#86C960'];
    for (let i = 0; i < n; i++) s.bits.push({ x: IN_L + 10 + Math.random() * (IN_R - IN_L - 20), y: s.cam - 10, vy: 50 + Math.random() * 60, a: Math.random() * 6, ph: Math.random() * 6, s: 1.5 + Math.random() * 2, c: i % 2 ? fl[i % fl.length] : (s.se.bark || ['#8C6A48'])[2] });
    if (s.bits.length > 60) s.bits.splice(0, s.bits.length - 60);
  },
  pointer(type, p) {
    if (!s || s.done) return;
    if (type === 'down') { s.hold = { x: p.x, y: p.y }; flap(p.x - offX()); }
    else if (type === 'move') { if (s.hold) s.hold = { x: p.x, y: p.y }; }
    else s.hold = null;
  },
  keydown(e) { const d = KEYS[e.code]; if (d == null || !s || s.done) return; e.preventDefault?.(); flap(s.fig.x + d * 70); },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'knothole', mu: MU, x0: s.x0, gaps: s.rows.map((q) => q.x), rows: s.rows.map((q) => ({ y: q.y, c: q.c, l: q.l, r: q.rr })), fig: { ...s.fig }, cam: s.cam, passed: s.passed, got: s.got, acorns: s.acorns.filter((a) => !a.got).length, stashY: s.stashY, bumps: s.bumps, flaps: s.flaps, pts: s.pts, crate: s.crate[0], done: s.done, offX: offX(), built: !!look,
    flap: (x) => flap(x == null ? null : x), auto: (on = true) => { s.auto = on; if (!on) s.hold = null; return on; }, toScreen: (x, y) => ({ x: x + offX(), y: y - s.cam }),
    win: () => { s.fig.y = s.stashY; win(); return true; }, lose: () => ph.lose(result(false)), beat: (peak) => pocket.onBeat({ peak }) }),
};
export default pocket;
