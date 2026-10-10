// 💥⛏️ DOWN THE TUNNEL: Hilltop's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a Hilltop fight, a burrow glows by your tank (in the deepest crater you've dug nearby, or a fresh one); tap it
// and you drop down the shaft. Under the hill is a cave in the dark, lit only by Fig's helmet lamp. Touch where to go
// (hold and steer, or tap a spot: Fig digs the way along the tunnels), pick up the ore 💎 on the way, and reach the
// glowing core before the tunnel caves in (22 s). The core sends up a full armour bar and a shield; three ore or more
// adds a loaded crate of artillery.
//
// Random in its own way: LANGTON'S ANT. An ant walks a grid: on a clear cell it turns right, on a dark one left, flips
// the cell and steps on. Two rules, and still nobody can say where it goes next: it scribbles a chaotic blob, then (after
// ~10,000 steps on an empty plane) lays a straight highway. Here it starts at the top of the shaft on a grid sprinkled
// with a few dark cells (a new sprinkle every pocket, so a new cave), and every cell it ever stood on is a tunnel. The
// cells it left dark are loose rock (Fig digs through, slowly: ×2.2, and leaves them clear), the ones it cleared are open
// tunnel; and it keeps digging while you're down there (a red spark in the dark), opening new ways and turning tunnel to
// rock and back. Fig's digging changes what the ant reads, so you steer it too.
import { drawPal } from '../../pals.js';

const COLS = 13, TOP = 74, DUR = 22, SPEED = 6.5, RUBBLE = 2.2, LAMP = 3.3, ORE = 7, REVEAL = 1.3, ANT_RATE = 7;
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
let ph = null, ctx = null, s = null, look = null;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const cx = (i) => ((i % COLS) + 0.5) * s.cell, cy = (i) => TOP + (Math.floor(i / COLS) + 0.5) * s.cell;
const cellAt = (x, y) => { const c = Math.floor(x / s.cell), r = Math.floor((y - TOP) / s.cell); return c < 0 || c >= COLS || r < 0 || r >= s.rows ? -1 : r * COLS + c; };
const open = (i) => i >= 0 && s.dug[i] && s.rev[i];
const nbrs = (i) => { const c = i % COLS, r = Math.floor(i / COLS), out = []; for (const [dx, dy] of D4) { const nc = c + dx, nr = r + dy; if (nc >= 0 && nc < COLS && nr >= 0 && nr < s.rows) out.push(nr * COLS + nc); } return out; };
// 🐜 one step of the ant: clear → turn right, dark → turn left; flip the cell; step (off the edge it turns back and steps)
function antStep(a) {
  const i = a.r * COLS + a.c;
  if (s.col[i] === 0) { a.d = (a.d + 1) % 4; s.col[i] = 1; } else { a.d = (a.d + 3) % 4; s.col[i] = 0; }
  let nc = a.c + D4[a.d][0], nr = a.r + D4[a.d][1];
  if (nc < 0 || nc >= COLS || nr < 0 || nr >= s.rows) { a.d = (a.d + 2) % 4; nc = a.c + D4[a.d][0]; nr = a.r + D4[a.d][1]; }
  a.c = nc; a.r = nr; const j = nr * COLS + nc; a.steps += 1;
  if (!s.dug[j]) { s.dug[j] = 1; s.order.push(j); return j; }
  return -1;
}
// the cheapest ways from a cell along open tunnel (rubble costs more); a tiny grid, so a plain O(n²) Dijkstra
function plan(from) {
  const N = COLS * s.rows, dist = new Float32Array(N).fill(1e9), prev = new Int16Array(N).fill(-1), done = new Uint8Array(N); dist[from] = 0;
  for (;;) { let u = -1, best = 1e9; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; } if (u < 0) break; done[u] = 1;
    for (const v of nbrs(u)) { if (!open(v)) continue; const w = best + (s.col[v] ? RUBBLE : 1); if (w < dist[v]) { dist[v] = w; prev[v] = u; } } }
  return { dist, prev };
}
function routeTo(target) {   // send Fig toward the open cell nearest the target (a finger, a key)
  const m = s.mole, from = m.to >= 0 ? m.to : m.c, { dist, prev } = plan(from);
  let best = -1, bd = 1e9; for (let i = 0; i < dist.length; i++) { if (dist[i] >= 1e9) continue; const d = Math.hypot(cx(i) - target.x, cy(i) - target.y) + dist[i] * 0.01; if (d < bd) { bd = d; best = i; } }
  if (best < 0) return; const path = []; for (let i = best; i !== from && i >= 0; i = prev[i]) path.unshift(i);
  m.path = path; m.goal = best; if (m.to < 0) { m.to = m.path.shift() ?? -1; m.u = 0; }
}
function start(h, seed = {}) {
  ph = h; ctx = h.ctx; look = null;
  const W = ph.W, H = ph.H, cell = W / COLS, rows = Math.max(12, Math.floor((H - TOP - 18) / cell)), N = COLS * rows, r = rng(seed.seed || Math.floor(Math.random() * 1e9));
  s = { cell, rows, col: new Uint8Array(N), dug: new Uint8Array(N), rev: new Uint8Array(N), order: [], ant: { c: COLS >> 1, r: 0, d: 2, steps: 0 }, revN: 0, revT: 0, antT: 0,
    ore: [], core: -1, got: 0, cleared: 0, pts: 0, time: 0, done: false, fx: [], peb: [], seen: new Uint8Array(N), aim: null, held: false, replan: 0, W, H };
  for (let i = 0; i < N; i++) if (r() < 0.09) s.col[i] = 1;   // the sprinkle: what makes this pocket's cave its own
  const st = s.ant.r * COLS + s.ant.c; s.col[st] = 0; s.dug[st] = 1; s.order.push(st); s.start = st;
  while (s.order.length < N * 0.48 && s.ant.steps < 30000) antStep(s.ant);
  s.ant.steps = 0;
  // the core: the cheapest-to-reach far cell, low down if it can be
  s.rev.fill(1); const { dist } = plan(st); s.rev.fill(0);
  let best = -1, bd = -1; for (const i of s.order) { const deep = Math.floor(i / COLS) >= rows * 0.55 ? 1000 : 0; if (dist[i] < 1e9 && dist[i] + deep > bd) { bd = dist[i] + deep; best = i; } }
  s.core = best;
  const pool = s.order.filter((i) => i !== st && i !== best && Math.floor(i / COLS) > 1); for (let k = 0; k < ORE && pool.length; k++) s.ore.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  s.mole = { c: st, to: -1, u: 0, path: [], goal: -1, x: cx(st), y: cy(st), face: 1, bob: 0 };
  reveal(1);
}
function reveal(n) { for (let k = 0; k < n && s.revN < s.order.length; k++) { const i = s.order[s.revN++]; s.rev[i] = 1; if (look) digCell(i); } }
function result(won) {
  if (!won) return { pts: s.pts, why: s.got ? `the tunnel caved in · ${s.got} ore on the way` : 'the tunnel caved in' };
  const left = Math.round(ph.left?.() || 0), crate = s.got >= 3;
  return { pts: s.pts + 300 + left * 15, label: crate ? 'THE CORE · ARMOUR, SHIELD, CRATE' : 'THE CORE · ARMOUR AND SHIELD', sub: `full armour and a shield${crate ? ', and a crate of artillery for the ore' : ''} · ${left} s to spare`, gift: { armor: true, shield: true, crate } };
}
function arrive(i) {
  if (s.col[i] && i !== s.start) { s.col[i] = 0; s.cleared += 1; ph.sfx('thud'); for (let j = 0; j < 8; j++) s.fx.push({ k: 'dot', x: cx(i) + (Math.random() - 0.5) * s.cell * 0.6, y: cy(i), vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, c: ['#7A5A42', '#4A3226'][j % 2], life: 0.5 }); }   // ⛏️ Fig digs the loose rock away (and the ant reads the cell clear now)
  const k = s.ore.indexOf(i); if (k >= 0) { s.ore.splice(k, 1); s.got += 1; s.pts += 60; ph.sfx('chime'); s.fx.push({ k: 'text', x: cx(i), y: cy(i) - 14, text: `💎 +60${s.got === 3 ? ' · a crate!' : ''}`, life: 1 }); for (let j = 0; j < 10; j++) { const a = Math.random() * 6.28, v = 30 + Math.random() * 70; s.fx.push({ k: 'dot', x: cx(i), y: cy(i), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, c: ['#FFD166', '#9BE7FF', '#FFFFFF'][j % 3], life: 0.6 }); } }
  if (!s.seen[i]) { s.seen[i] = 1; if (look) see(i); }
  if (i === s.core && !s.done) { s.done = true; ph.sfx('fanfare'); for (let j = 0; j < 26; j++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 160; s.fx.push({ k: 'dot', x: cx(i), y: cy(i), vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: ['#FF8A3D', '#FFD166', '#FFF4D6'][j % 3], life: 0.9 }); } setTimeout(() => ph.win(result(true)), 450); }
}
function update(dt) {
  if (!s) return;
  s.time += dt;
  if (s.revN < s.order.length) { s.revT += dt; reveal(Math.ceil((s.order.length / REVEAL) * s.revT) - s.revN); }   // the ant digs the cave out before your eyes
  else { s.antT += dt; while (s.antT > 1 / ANT_RATE) { s.antT -= 1 / ANT_RATE; const j = antStep(s.ant); if (j >= 0) { s.revN += 1; s.rev[j] = 1; if (look) digCell(j); } } }   // and keeps digging
  const m = s.mole;
  if (s.held && s.aim) { s.replan -= dt; const c = cellAt(s.aim.x, s.aim.y); if (s.replan <= 0 || c !== s.aimC) { s.replan = 0.35; s.aimC = c; routeTo(s.aim); } }
  if (m.to >= 0 && !s.done) {
    m.u += dt * SPEED / (s.col[m.to] ? RUBBLE : 1);
    if (m.u >= 1) { m.c = m.to; m.u = 0; arrive(m.c); m.to = s.done ? -1 : m.path.shift() ?? -1; if (m.to >= 0 && !open(m.to)) { m.to = -1; m.path = []; } }
    const a = m.to >= 0 ? m.to : m.c, e = m.to >= 0 ? m.u : 0; const nx = cx(m.c) + (cx(a) - cx(m.c)) * e, ny = cy(m.c) + (cy(a) - cy(m.c)) * e;
    if (Math.abs(nx - m.x) > 0.1) m.face = nx > m.x ? 1 : -1; m.x = nx; m.y = ny; m.bob += dt * 14;
    if (Math.random() < dt * 12) s.fx.push({ k: 'dot', x: m.x + (Math.random() - 0.5) * 8, y: m.y + s.cell * 0.25, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, c: '#7A5232', life: 0.4 });
  }
  const left = ph.left?.() ?? DUR;   // the last seconds: the roof starts coming down
  if (left < 6 && Math.random() < dt * (6 - left) * 5) s.peb.push({ x: m.x + (Math.random() - 0.5) * s.cell * 8, y: m.y - s.cell * 4, vy: 60 + Math.random() * 80, s: 1 + Math.random() * 2.2 });
  s.peb = s.peb.filter((p) => { p.vy += 500 * dt; p.y += p.vy * dt; return p.y < s.H + 10; });
  s.fx.forEach((f) => { f.life -= dt; if (f.k === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 200 * dt; } else f.y -= 20 * dt; });
  s.fx = s.fx.filter((f) => f.life > 0);
}
// 🎨 THE LOOK. Painted once: the rock (strata, specks, crystals, a golden-spiral fossil or two, roots from the turf), the
// night above the shaft, and every tunnel as the ant opens it (digCell paints it straight into the same canvas). The dark
// is a second canvas that remembers where Fig's lamp has been (see), and the lamp itself is the cave redrawn through a
// circle round Fig with a soft rim sprite. Rubble, ore and the core are small cached sprites.
function buildLook() {
  const cv = ph.cv, k = ph.k, W = s.W, H = s.H, ox = ph.ox || 0, oy = ph.oy || 0, c = mk(cv.width, cv.height), x = c.getContext('2d'), r = rng(7 + s.order.length);
  x.fillStyle = '#120806'; x.fillRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, ox, oy);
  { const g = x.createLinearGradient(0, TOP, 0, H); g.addColorStop(0, '#7A5236'); g.addColorStop(0.4, '#5E3F2C'); g.addColorStop(1, '#3A261D'); x.fillStyle = g; x.fillRect(-20, TOP - 8, W + 40, H - TOP + 40); }
  for (let i = 0; i < 9; i++) { const y0 = TOP + 20 + i * (H - TOP) / 9 + r() * 20; x.strokeStyle = i % 2 ? '#00000030' : '#ffffff0d'; x.lineWidth = 3 + r() * 6; x.beginPath(); for (let px = -10; px <= W + 10; px += 20) x.lineTo(px, y0 + Math.sin(px / 60 + i) * 6 + (r() - 0.5) * 4); x.stroke(); }
  for (let i = 0; i < 1400; i++) { x.fillStyle = r() < 0.5 ? '#00000040' : '#ffffff12'; const sz = 0.8 + r() * 1.8; x.fillRect(r() * W, TOP + r() * (H - TOP), sz, sz); }
  for (let i = 0; i < 10; i++) { const px = r() * W, py = TOP + 30 + r() * (H - TOP - 40), sz = 3 + r() * 4; x.fillStyle = r() < 0.5 ? '#7A5CFF55' : '#3DD6C655'; x.beginPath(); x.moveTo(px, py - sz); x.lineTo(px + sz * 0.6, py); x.lineTo(px, py + sz * 0.7); x.lineTo(px - sz * 0.6, py); x.closePath(); x.fill(); }
  for (let i = 0; i < 2; i++) { const px = 30 + r() * (W - 60), py = TOP + 80 + r() * (H - TOP - 120); x.strokeStyle = '#E8D8B044'; x.lineWidth = 1.2; x.beginPath(); let a = 0, rr = 0.8; for (let n = 0; n < 60; n++) { a += 0.25; rr *= 1.04; x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } x.stroke(); }   // 🐚 a golden-spiral fossil
  { const g = x.createLinearGradient(0, -20, 0, TOP); g.addColorStop(0, '#0B0A26'); g.addColorStop(1, '#2A1F4A'); x.fillStyle = g; x.fillRect(-20, -40, W + 40, TOP + 32); }   // the night over the hill
  for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(255,250,230,${0.3 + r() * 0.6})`; x.fillRect(r() * W, r() * (TOP - 20), 1.4, 1.4); }
  x.fillStyle = '#1B1438'; x.beginPath(); x.moveTo(-10, TOP - 8); for (let px = -10; px <= W + 10; px += 16) x.lineTo(px, TOP - 22 - Math.abs(Math.sin(px / 47)) * 14 - r() * 4); x.lineTo(W + 10, TOP - 8); x.closePath(); x.fill();
  x.fillStyle = '#2C7A4B'; x.fillRect(-10, TOP - 9, W + 20, 6); x.fillStyle = '#5DB36A'; x.fillRect(-10, TOP - 9, W + 20, 2);
  x.strokeStyle = '#2A1A10'; x.lineWidth = 1.2; for (let i = 0; i < 14; i++) { const px = r() * W; x.beginPath(); x.moveTo(px, TOP - 3); let py = TOP - 3; for (let n = 0; n < 5; n++) { py += 5 + r() * 6; x.lineTo(px + (r() - 0.5) * 10, py); } x.stroke(); }   // roots
  const dark = mk(cv.width, cv.height), dx = dark.getContext('2d'); dx.fillStyle = 'rgba(5,2,8,0.94)'; dx.fillRect(0, 0, dark.width, dark.height);
  dx.setTransform(k, 0, 0, k, ox, oy); dx.clearRect(-20, -40, W + 40, TOP - 2 + 40);   // the sky over the hill stays lit
  // sprites: rubble, ore, the core's glow, the lamp's rim, a memory dab
  const cp = Math.max(8, Math.round(s.cell * k)), rub = mk(cp, cp), rx = rub.getContext('2d'); rx.scale(cp / 30, cp / 30);
  rx.fillStyle = '#4A3226'; rx.beginPath(); rx.moveTo(4, 9); rx.lineTo(10, 3); rx.lineTo(21, 4); rx.lineTo(27, 10); rx.lineTo(26, 24); rx.lineTo(19, 28); rx.lineTo(8, 27); rx.lineTo(3, 20); rx.closePath(); rx.fill();
  rx.fillStyle = '#7A5A42'; rx.beginPath(); rx.moveTo(4, 9); rx.lineTo(10, 3); rx.lineTo(21, 4); rx.lineTo(27, 10); rx.lineTo(22, 9); rx.lineTo(12, 8); rx.closePath(); rx.fill();
  rx.strokeStyle = '#2A1A12'; rx.lineWidth = 1.2; rx.beginPath(); rx.moveTo(9, 12); rx.lineTo(14, 17); rx.lineTo(12, 23); rx.moveTo(14, 17); rx.lineTo(21, 15); rx.stroke();
  [[7, 25, 3], [22, 25, 3.5], [15, 26, 2.5]].forEach(([a, b, q], j) => { rx.fillStyle = ['#5E4838', '#6B5240', '#54402F'][j]; rx.beginPath(); rx.ellipse(a, b, q, q * 0.75, j, 0, 7); rx.fill(); });
  const ore = mk(cp, cp), ex = ore.getContext('2d'); ex.scale(cp / 30, cp / 30); ex.fillStyle = '#B86B12'; ex.beginPath(); ex.moveTo(15, 6); ex.lineTo(23, 14); ex.lineTo(15, 25); ex.lineTo(7, 14); ex.closePath(); ex.fill(); ex.fillStyle = '#FFD166'; ex.beginPath(); ex.moveTo(15, 6); ex.lineTo(19, 13); ex.lineTo(15, 23); ex.lineTo(10, 14); ex.closePath(); ex.fill(); ex.fillStyle = '#FFF6D0'; ex.beginPath(); ex.moveTo(14, 9); ex.lineTo(16, 12); ex.lineTo(13, 15); ex.closePath(); ex.fill();
  const glow = (rgb) => { const g2 = mk(64, 64), gx = g2.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},0.9)`); gr.addColorStop(0.35, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64); return g2; };
  const L = Math.round(LAMP * s.cell * k), rim = mk(L * 2, L * 2), mx = rim.getContext('2d'), mg = mx.createRadialGradient(L, L, L * 0.55, L, L, L); mg.addColorStop(0, 'rgba(5,2,8,0)'); mg.addColorStop(1, 'rgba(5,2,8,0.6)'); mx.fillStyle = mg; mx.beginPath(); mx.arc(L, L, L, 0, 7); mx.fill();
  const dab = glow('0,0,0');
  look = { c, x, dark, dx, rub, ore, coreG: glow('255,140,50'), antG: glow('255,70,40'), lampG: glow('255,240,190'), rim, L, dab, k, w: cv.width, h: cv.height, W, H };
  for (let i = 0; i < s.revN; i++) digCell(s.order[i]);
  s.seen.forEach((v, i) => { if (v) see(i); });
}
function digCell(i) {   // a stretch of tunnel: a pale worn rim, the dark hollow, a floor of loose dirt, joined to every open neighbour
  const x = look.x, q = s.cell, X = cx(i), Y = cy(i), on = nbrs(i).filter((j) => s.rev[j] && s.dug[j]);
  x.lineCap = 'round';
  x.fillStyle = '#A27A54'; x.beginPath(); x.arc(X, Y, q * 0.58, 0, 7); x.fill(); x.strokeStyle = '#A27A54'; x.lineWidth = q * 0.84; on.forEach((j) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(cx(j), cy(j)); x.stroke(); });
  x.strokeStyle = '#1A0F0A'; x.lineWidth = q * 0.66; on.forEach((j) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(cx(j), cy(j)); x.stroke(); });
  x.fillStyle = '#1A0F0A'; [i, ...on].forEach((j) => { x.beginPath(); x.arc(cx(j), cy(j), q * 0.49, 0, 7); x.fill(); });
  { const c = i % COLS, r = Math.floor(i / COLS), o = (dc, dr) => { const nc = c + dc, nr = r + dr; return nc >= 0 && nc < COLS && nr >= 0 && nr < s.rows && s.rev[nr * COLS + nc] && s.dug[nr * COLS + nc]; };
    x.fillStyle = '#1A0F0A'; for (const [dc, dr] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (o(dc, 0) && o(0, dr) && o(dc, dr)) { x.beginPath(); x.arc(X + dc * q / 2, Y + dr * q / 2, q * 0.34, 0, 7); x.fill(); } }   // a block dug out all round: no pillar left in the middle
  x.fillStyle = '#ffffff16'; for (let n = 0; n < 4; n++) { const h1 = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453, u = h1 - Math.floor(h1); x.fillRect(X + (u - 0.5) * q * 0.7, Y + (((u * 7) % 1) - 0.5) * q * 0.6, 1.3, 1.3); }
  if (i === s.start) { x.fillStyle = '#A27A54'; x.fillRect(X - q * 0.42, TOP - 10, q * 0.84, Y - TOP + 10); x.fillStyle = '#1A0F0A'; x.fillRect(X - q * 0.33, TOP - 10, q * 0.66, Y - TOP + 10); }   // the shaft, up to the turf
}
function see(i) {   // the lamp has been here: the dark stays thinner over it
  const d = look.dx, R = s.cell * 2.4; d.globalCompositeOperation = 'destination-out'; d.globalAlpha = 0.55; d.drawImage(look.dab, cx(i) - R, cy(i) - R, R * 2, R * 2); d.globalAlpha = 1; d.globalCompositeOperation = 'source-over';
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ox = ph.ox || 0, oy = ph.oy || 0, ts = t / 1000, q = s.cell;
  if (!look || look.w !== cv.width || look.h !== cv.height || look.k !== k) buildLook();
  const left = ph.left?.() ?? DUR, sh = left < 6 && !ph.reduceMotion ? (6 - left) * 0.7 * k : 0, sx = (Math.random() - 0.5) * sh, sy = (Math.random() - 0.5) * sh;
  const world = () => ctx.setTransform(k, 0, 0, k, ox + sx, oy + sy), m = s.mole;
  ctx.setTransform(1, 0, 0, 1, sx, sy); ctx.drawImage(look.c, 0, 0);
  world();
  const things = (clip) => {   // rubble on the dark cells, ore, within the lamp when `clip`
    const near = (i) => !clip || Math.hypot(cx(i) - m.x, cy(i) - m.y) < LAMP * q + q;
    for (let i = 0; i < s.revN; i++) { const j = s.order[i]; if (s.col[j] && j !== s.start && near(j)) ctx.drawImage(look.rub, cx(j) - q / 2, cy(j) - q / 2, q, q); }
    s.ore.forEach((i) => { if (!s.rev[i] || !near(i)) return; const b = Math.sin(ts * 3 + i) * 1.5; ctx.drawImage(look.ore, cx(i) - q * 0.4, cy(i) - q * 0.45 + b, q * 0.8, q * 0.8); });
  };
  things(false);
  // the dark, the lamp's circle cut through it (the cave redrawn inside), its soft rim
  ctx.setTransform(1, 0, 0, 1, sx, sy); ctx.drawImage(look.dark, 0, 0);
  const lx = ox + m.x * k, ly = oy + m.y * k, L = look.L;
  ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, L, 0, 7); ctx.clip(); ctx.drawImage(look.c, lx - L, ly - L, L * 2, L * 2, lx - L, ly - L, L * 2, L * 2); world(); things(true); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, sx, sy); ctx.drawImage(look.rim, lx - L, ly - L);
  world();
  // the core glows through the dark; the ant is a red spark, still digging
  if (s.core >= 0) { const X = cx(s.core), Y = cy(s.core), pu = 1 + 0.12 * Math.sin(ts * 5); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(look.coreG, X - q * 2 * pu, Y - q * 2 * pu, q * 4 * pu, q * 4 * pu); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#FF6A2A'; ctx.beginPath(); ctx.arc(X, Y, q * 0.3 * pu, 0, 7); ctx.fill(); ctx.fillStyle = '#FFE3A0'; ctx.beginPath(); ctx.arc(X - q * 0.08, Y - q * 0.08, q * 0.14, 0, 7); ctx.fill(); }
  { const X = (s.ant.c + 0.5) * q, Y = TOP + (s.ant.r + 0.5) * q; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(look.antG, X - q * 0.7, Y - q * 0.7, q * 1.4, q * 1.4); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#FF5A3A'; ctx.beginPath(); ctx.arc(X, Y, 2.4, 0, 7); ctx.arc(X + D4[s.ant.d][0] * 3.5, Y + D4[s.ant.d][1] * 3.5, 1.8, 0, 7); ctx.fill(); }
  if (s.held && s.aim) { ctx.strokeStyle = '#FFE9A855'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(s.aim.x, s.aim.y, q * 0.45, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  // 🟢 Fig in a miner's helmet, its lamp lit
  { const fs = q * 0.34, bob = m.to >= 0 ? Math.sin(m.bob) * 1.2 : 0, X = m.x, Y = m.y + bob;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(look.lampG, X - q * 1.4, Y - q * 1.5, q * 2.8, q * 2.8); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    drawPal(ph.mood(), ctx, { x: X, y: Y, s: fs, t: ts, r: ph.S.curve.r, face: m.face });
    const hy = Y - fs * 0.62; ctx.fillStyle = '#F5C542'; ctx.beginPath(); ctx.arc(X, hy, fs * 0.82, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#C9971E'; ctx.fillRect(X - fs * 1.02, hy - 1, fs * 2.04, 2.4);
    ctx.fillStyle = '#FFF6C8'; ctx.beginPath(); ctx.arc(X + m.face * fs * 0.15, hy - fs * 0.45, fs * 0.24, 0, 7); ctx.fill(); }
  s.peb.forEach((p) => { ctx.fillStyle = '#8A6A50'; ctx.fillRect(p.x, p.y, p.s, p.s); });
  s.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); if (f.k === 'dot') { ctx.fillStyle = f.c; ctx.fillRect(f.x - 1, f.y - 1, 2, 2); } else { ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#1B1030'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } });
  ctx.globalAlpha = 1;
  if (s.time < 2.4) { const a = Math.min(1, (2.4 - s.time) * 1.5); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#120806'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; const ty = s.H - 40; ctx.strokeText('DIG TO THE CORE', s.W / 2, ty); ctx.fillText('DIG TO THE CORE', s.W / 2, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.fillStyle = '#fff'; ctx.strokeText('touch where to go · grab the 💎 on the way', s.W / 2, ty + 18); ctx.fillText('touch where to go · grab the 💎 on the way', s.W / 2, ty + 18); ctx.globalAlpha = 1; }
}
const KEYS = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };
const pocket = {
  key: 'burrow', name: 'Down the tunnel', icon: '⛏️', goal: 'dig to the core', dur: DUR, rim: '#FF8A3D', system: "Langton's ant",
  start, update, draw,
  onBeat(ev) { if (!s || s.revN < s.order.length) return; if (ev?.peak) for (let i = 0; i < 6; i++) { const j = antStep(s.ant); if (j >= 0) { s.revN += 1; s.rev[j] = 1; if (look) digCell(j); } } },   // a peak up top: the ant scrambles
  pointer(type, p, e) {
    if (!s || s.done) return;
    if (type === 'down') { s.held = true; s.aim = { x: p.x, y: p.y }; s.aimC = -2; s.replan = 0; }
    else if (type === 'move') { if (s.held) s.aim = { x: p.x, y: p.y }; }
    else { if (s.held && s.aim) routeTo(s.aim); s.held = false; }
  },
  keydown(e) { const d = KEYS[e.code]; if (d == null || !s || s.done) return; e.preventDefault?.(); const m = s.mole, from = m.to >= 0 ? m.to : m.c, c = from % COLS + D4[d][0], r = Math.floor(from / COLS) + D4[d][1]; if (c < 0 || c >= COLS || r < 0 || r >= s.rows) return; const j = r * COLS + c; if (!open(j)) return; if (m.to < 0) { m.to = j; m.u = 0; m.path = []; } else m.path = [j]; },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'burrow', cols: COLS, rows: s.rows, cell: s.cell, dug: s.order.length, revealed: s.revN, rubble: s.order.filter((i) => s.col[i]).length, antSteps: s.ant.steps, ant: { c: s.ant.c, r: s.ant.r }, start: s.start, core: s.core, coreAt: s.core >= 0 ? { x: cx(s.core), y: cy(s.core) } : null, ore: s.ore.length, got: s.got, pts: s.pts, mole: { c: s.mole.c, to: s.mole.to, x: s.mole.x, y: s.mole.y, path: s.mole.path.length },
    cellAt: (i) => ({ x: cx(i), y: cy(i) }), go: (x, y) => routeTo({ x, y }), goCore: () => routeTo({ x: cx(s.core), y: cy(s.core) }), oreAt: s.ore.map((i) => ({ x: cx(i), y: cy(i) })),
    win: () => { reveal(s.order.length); s.ore.slice(0, 3).forEach((i) => arrive(i)); arrive(s.core); return true; }, lose: () => ph.lose(result(false)) }),
};
export default pocket;
