// 🔺💠 INSIDE A SHARD: Fractal Dash's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a dash, a shard floats just ahead of you and glows; tap it and you fall in. Inside the shard is the Mandelbrot
// set, and you fall down a tunnel along its edge, zooming in all the way: steer Fig left and right (drag, or hold a side;
// arrows or A/D) through the open filaments, grab the shards on the way, and land on the glowing bulb at the bottom (a
// baby Mandelbrot set, a perfect copy of the whole) before the shard closes (22 s). Touching the set bumps you back up:
// it only costs time. The bulb sends up a full dash, a life for Fractal Dash and a shard shield (3 s, +½ s a shard).
//
// Random in its own way: the MANDELBROT SET, z → z² + c. Every pocket picks a new spot: a random point near the set's
// edge, then Newton's method finds the nucleus of a baby copy of the set there (a period-p point, z_p(c) = 0) and its
// size (σ = 1 / (β·λ²) over the orbit). The tunnel is the plane seen in log-polar round that nucleus (x is the angle
// across a wedge, falling is the log of the radius), so falling is zooming in, ×60–250 by the bottom, and the picture
// stays true to shape (log-polar is conformal). The walls are the set fattened by a few units (the distance estimate,
// |z|·log|z| / |z'|), what never escapes is solid, and the solid round the baby set is the bulb. Before you go in, a
// search runs (a little at a time while the shard glows) until it finds a spot where a way down exists: row by row it
// keeps every place Fig could be, and gives up on spots that wall off.
import { drawPal } from '../../pals.js';

const TW = 400, CELL = 4, COLS = TW / CELL, LG = 1500, WALL = 5, FILL = 0.55, WMAX = 120, NMAX = 500, CL = 2, SH = 2, FR = 8, VF = 112, VX = 250, DUR = 22, CH = 96, TRIES = 40;
const BUDGET = 4;   // ms a frame for the search and the picture
let ph = null, ctx = null, s = null, prep = null, look = null;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const now = () => performance.now();

// ---------------------------------------------------------------- the set
// The distance from c to the set (plane units), or −1 inside (or too slow to tell, which is as good as touching it).
// The smooth escape count lands in MU, for the colour bands.
let MU = 0;
function de(cr, ci) {
  const xq = cr - 0.25, q = xq * xq + ci * ci; if (q * (q + xq) <= ci * ci * 0.25 || (cr + 1) * (cr + 1) + ci * ci <= 0.0625) return -1;   // the main cardioid and the big bulb, at once
  let zr = 0, zi = 0, dr = 0, di = 0, sr = 0, si = 0, nx = 8;
  for (let i = 0; i < NMAX; i++) {
    const ndr = 2 * (zr * dr - zi * di) + 1; di = 2 * (zr * di + zi * dr); dr = ndr;
    const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; const m = zr * zr + zi * zi;
    if (m > 1e6) { MU = i + 1 - Math.log2(0.5 * Math.log(m)); const a = Math.sqrt(m); return a * Math.log(a) / Math.hypot(dr, di); }
    if (Math.abs(zr - sr) < 1e-13 && Math.abs(zi - si) < 1e-13) return -1;   // caught in a cycle (Brent): inside
    if (i === nx) { sr = zr; si = zi; nx *= 2; }
  }
  return -1;
}
const escapes = (cr, ci, n) => { let zr = 0, zi = 0; for (let i = 0; i < n; i++) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; if (zr * zr + zi * zi > 4) return i; } return n; };
// Newton's method for a nucleus of period p near c, then the baby set's size estimate
function nucleus(cr, ci, p) {
  for (let k = 0; k < 60; k++) {
    let zr = 0, zi = 0, dr = 0, di = 0;
    for (let i = 0; i < p; i++) { const ndr = 2 * (zr * dr - zi * di) + 1; di = 2 * (zr * di + zi * dr); dr = ndr; const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; if (zr * zr + zi * zi > 1e6) return null; }
    const m = dr * dr + di * di; if (!(m > 0)) return null;
    const sr = (zr * dr + zi * di) / m, si = (zi * dr - zr * di) / m; cr -= sr; ci -= si; if (sr * sr + si * si < 1e-28) break;
  }
  let zr = 0, zi = 0; for (let i = 1; i <= p; i++) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; if (i < p && zr * zr + zi * zi < 1e-18) return null; }   // exactly period p
  if (zr * zr + zi * zi > 1e-14) return null;
  zr = 0; zi = 0; let lr = 1, li = 0, br = 1, bi = 0;
  for (let i = 1; i < p; i++) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; const nlr = 2 * (zr * lr - zi * li); li = 2 * (zr * li + zi * lr); lr = nlr; const m = lr * lr + li * li; br += lr / m; bi -= li / m; }
  const l2r = lr * lr - li * li, l2i = 2 * lr * li, Dr = br * l2r - bi * l2i, Di = br * l2i + bi * l2r;
  return { cr, ci, p, size: 1 / Math.hypot(Dr, Di) };
}
function pickSpot(r) {   // a random point near the edge, a baby set near it of a size that suits
  for (let a = 0; a < 300; a++) {
    const cr = -2 + r() * 2.5, ci = (r() * 1.2) * (r() < 0.5 ? 1 : -1), it = escapes(cr, ci, 200); if (it >= 200 || it < 25) continue;
    const n = nucleus(cr, ci, 3 + Math.floor(r() * 28)); if (n && n.size > 4e-4 && n.size < 2e-2) return n;
  }
  return null;
}

// ---------------------------------------------------------------- the search: a spot with a way down
// One attempt is a field of COLS × rows cells (0 open, 1 wall, 2 the bulb), made row by row while a sweep keeps every
// column Fig could be in (clear of walls by CL cells, moving at most SH a row). It succeeds next to the bulb.
function attempt(seed) {
  const r = rng(seed), P = pickSpot(r); if (!P) return { dead: true };
  const Z = 60 + r() * 190, TH = Math.log(Z) * TW / LG, th0 = r() * Math.PI * 2, R2 = 2.2 * P.size, ROWS = Math.ceil((LG + Math.log(11) * TW / TH) / CELL);
  return { seed, P, Z, TH, th0, R2, ROWS, g: new Int8Array(ROWS * COLS), u: new Float32Array(ROWS * COLS), mu: new Float32Array(ROWS * COLS), thr: new Float32Array(ROWS), uq: 0, made: 0, row: 0, cur: null, reach: [], ok: false, dead: false, end: -1 };
}
const SORT = new Float32Array(COLS);
const rOf = (F, d) => F.R2 * Math.exp((LG - d) * F.TH / TW);
function makeRow(F, rI) {
  const d = (rI + 0.5) * CELL, rr = rOf(F, d), sc = rr * F.TH / TW;
  for (let c = 0; c < COLS; c++) {
    const th = F.th0 + F.TH * ((c + 0.5) / COLS - 0.5), D = de(F.P.cr + rr * Math.cos(th), F.P.ci + rr * Math.sin(th)), i = rI * COLS + c, u = D < 0 ? -1 : D / sc;
    F.u[i] = u; F.mu[i] = MU;
  }
  // how fat the walls are: thick enough that about FILL of the row is set (never under WALL), eased down the tunnel so
  // the walls swell and thin smoothly: where the set is sparse its arms grow fat, where it's dense they stay thin
  SORT.set(F.u.subarray(rI * COLS, rI * COLS + COLS)); SORT.sort(); const q = Math.max(WALL, Math.min(WMAX, SORT[Math.floor(FILL * COLS)]));
  F.uq = rI === 0 ? q : F.uq + (q - F.uq) * 0.07; const thr = F.thr[rI] = F.uq;
  for (let c = 0, i = rI * COLS; c < COLS; c++, i++) F.g[i] = F.u[i] < thr ? (rr < F.R2 ? 2 : 1) : 0;
}
const thrAt = (F, d) => { const f = d / CELL - 0.5, i = Math.max(0, Math.min(F.made - 1, Math.floor(f))), j = Math.min(F.made - 1, i + 1), t = Math.max(0, Math.min(1, f - i)); return F.thr[i] + (F.thr[j] - F.thr[i]) * t; };
const upto = (F, r) => { const e = Math.min(F.ROWS - 1, r); while (F.made <= e) makeRow(F, F.made++); };
function okAt(F, r, c) { for (let dr = -CL; dr <= CL; dr++) for (let dc = -CL; dc <= CL; dc++) { const rr = r + dr, cc = c + dc; if (cc < 0 || cc >= COLS) return false; if (rr < 0 || rr >= F.ROWS) continue; if (F.g[rr * COLS + cc] === 1) return false; } return true; }
function bulbNear(F, r, c) {   // Fig, at this cell's middle, touches the bulb
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= F.ROWS || cc < 0 || cc >= COLS || F.g[rr * COLS + cc] !== 2) continue; if (Math.hypot(Math.max(0, Math.abs(dc) - 0.5), Math.max(0, Math.abs(dr) - 0.5)) * CELL < FR - 1) return true; }
  return false;
}
function stepAttempt(F, until) {   // true when it has finished (ok or dead)
  if (!F.cur) { upto(F, CL); F.cur = new Uint8Array(COLS); for (let c = 0; c < COLS; c++) F.cur[c] = okAt(F, 0, c) ? 1 : 0; F.reach[0] = F.cur; }
  while (now() < until) {
    const r = F.row; if (r >= F.ROWS - 1) { F.dead = true; return true; }
    upto(F, r + CL + 2);
    const cur = F.cur, nx = new Uint8Array(COLS); let any = false;
    for (let c = 0; c < COLS; c++) {
      if (!cur[c]) continue;
      if (bulbNear(F, r, c)) { F.ok = true; F.end = r; F.endC = c; return true; }
      for (let k = -SH; k <= SH; k++) { const cc = c + k; if (cc < 0 || cc >= COLS || nx[cc] || !okAt(F, r + 1, cc)) continue; let clear = true; for (let j = Math.min(c, cc); j <= Math.max(c, cc); j++) if (!okAt(F, r, j)) { clear = false; break; } if (clear) { nx[cc] = 1; any = true; } }
    }
    if (!any) { F.dead = true; return true; }
    F.cur = nx; F.row = r + 1; F.reach[r + 1] = nx;
  }
  return false;
}
function pathOf(F) {   // back up the sweep from the bulb: one column a row that really leads there
  const path = new Int16Array(F.end + 1); path[F.end] = F.endC;
  for (let r = F.end - 1; r >= 0; r--) { const to = path[r + 1], row = F.reach[r]; let best = -1;
    for (let k = 0; k <= SH && best < 0; k++) for (const c of k ? [to - k, to + k] : [to]) { if (c < 0 || c >= COLS || !row[c]) continue; let clear = true; for (let j = Math.min(c, to); j <= Math.max(c, to); j++) if (!okAt(F, r, j)) { clear = false; break; } if (clear) { best = c; break; } }
    path[r] = best < 0 ? to : best; }
  return path;
}
function runPrep(ms) {   // a slice of the search; prep.F is the field once one has a way down
  if (!prep) prep = { tries: 0, F: null, at: null, last: null, base: Math.floor(Math.random() * 1e9) };
  if (prep.F) return prep.F;
  const until = now() + ms;
  while (now() < until) {   // (no way down in TRIES spots: the best one, with soft walls)
    if (!prep.at) { if (prep.tries >= TRIES && prep.last) { prep.F = prep.last; prep.F.soft = true; break; } prep.tries += 1; prep.at = attempt(prep.base + prep.tries * 7919); if (prep.at.dead) { prep.at = null; continue; } }
    if (stepAttempt(prep.at, until)) { if (prep.at.ok) { prep.F = prep.at; break; } if (!prep.last || prep.at.row > prep.last.row) prep.last = prep.at; prep.at = null; }
  }
  if (prep.F && !prep.F.path) { const F = prep.F; if (!F.ok) { F.end = F.row; F.endC = F.cur ? Math.max(0, F.cur.indexOf(1)) : COLS >> 1; } F.path = pathOf(F); upto(F, F.end + 70); }
  return prep.F;
}

// ---------------------------------------------------------------- the look: the world's own colours
// Open water far from the set is the world's night sky; nearer, the escape-time bands in its colours, glowing into the
// world's edge colour at the walls; the walls are its ground (light at the rim, dark inside); the bulb is gold.
function palette(wd) {
  const P = { sky0: rgbOf(wd.sky[0]), sky1: rgbOf(wd.sky[1]), g0: rgbOf(wd.ground[0]), g1: rgbOf(wd.ground[1]), edge: rgbOf(wd.edge), bands: wd.bands.map(rgbOf), gold: [255, 224, 138], goldD: [214, 124, 26], shard: wd.shard || '#F5C542' };
  P.css = { sky0: wd.sky[0], edge: wd.edge, shard: P.shard };
  return P;
}
const mix = (a, b, t) => a + (b - a) * t;
function paint(d8, o, u, mu, goal, W0) {   // one pixel's colour, by its distance to the set (in tunnel units), the walls' thickness there and its smooth escape count
  const P = s.pal; let r, g, b;
  if (u < W0) {
    if (goal) { const t = u < 0 ? 0.35 : 0.35 + 0.65 * (u / W0); r = mix(P.goldD[0], P.gold[0], t); g = mix(P.goldD[1], P.gold[1], t); b = mix(P.goldD[2], P.gold[2], t); if (u > W0 - 1.4) { r = 255; g = 246; b = 214; } }
    else if (u < 0) { r = P.g1[0] * 0.8; g = P.g1[1] * 0.8; b = P.g1[2] * 0.8; }
    else { const t = Math.sqrt(u / W0); r = mix(P.g1[0], P.g0[0], t); g = mix(P.g1[1], P.g0[1], t); b = mix(P.g1[2], P.g0[2], t); if (u > W0 - 1.4) { const e = (u - W0 + 1.4) / 1.4 * 0.85; r = mix(r, P.edge[0], e); g = mix(g, P.edge[1], e); b = mix(b, P.edge[2], e); } }
  } else {
    const f = mu * 0.16, fl = Math.floor(f), t = f - fl, i0 = ((fl % 6) + 6) % 6, A = P.bands[i0], B = P.bands[(i0 + 1) % 6];
    const dark = Math.min(1, Math.max(0, Math.log2(u / W0) / 4)), k = 0.3 + 0.62 * dark;
    r = mix(mix(A[0], B[0], t), P.sky0[0], k); g = mix(mix(A[1], B[1], t), P.sky0[1], k); b = mix(mix(A[2], B[2], t), P.sky0[2], k);
    const e = Math.max(0, 1 - (u - W0) / 5); if (e > 0) { const w = 0.75 * e * e; r = mix(r, P.edge[0], w); g = mix(g, P.edge[1], w); b = mix(b, P.edge[2], w); }
  }
  d8[o] = r; d8[o + 1] = g; d8[o + 2] = b; d8[o + 3] = 255;
}
function glowImg(rgb) { const c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgb},0.95)`); g.addColorStop(0.35, `rgba(${rgb},0.4)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; }
function sierp(c, x, y, sz, d) { if (d === 0) { const h = sz * 0.866; c.moveTo(x, y - h / 2); c.lineTo(x + sz / 2, y + h / 2); c.lineTo(x - sz / 2, y + h / 2); c.closePath(); return; } const q = sz / 4, hh = sz * 0.866 / 4; sierp(c, x, y - hh, sz / 2, d - 1); sierp(c, x - q, y + hh, sz / 2, d - 1); sierp(c, x + q, y + hh, sz / 2, d - 1); }
function buildLook() {   // sprites and the coarse picture (one pixel a cell) that stands in until the fine picture is drawn
  const F = s.F, P = s.pal, coarse = mk(COLS, F.ROWS), cx = coarse.getContext('2d'), im = cx.createImageData(COLS, F.ROWS);
  for (let i = 0; i < F.made * COLS; i++) paint(im.data, i * 4, F.u[i], F.mu[i], F.g[i] === 2, F.thr[Math.floor(i / COLS)]);
  cx.putImageData(im, 0, 0);
  const sh = mk(40, 40), sx = sh.getContext('2d'); sx.translate(20, 21); sx.fillStyle = P.shard; sx.beginPath(); sierp(sx, 0, 0, 30, 2); sx.fill(); sx.fillStyle = 'rgba(255,255,255,0.7)'; sx.beginPath(); sierp(sx, 0, -6.5, 15, 0); sx.fill();
  const [er, eg, eb] = P.edge, [srr, sg, sb] = rgbOf(P.shard);
  look = { coarse, coarseRows: F.made, shard: sh, glowE: glowImg(`${er},${eg},${eb}`), glowS: glowImg(`${srr},${sg},${sb}`), glowG: glowImg('255,214,120'), glowW: glowImg('255,255,255'), chunks: new Map(), res: Math.max(0.6, Math.min(1.25, s.S * 0.5)), rim: null };
  // the bulb's rim: glow along the top of the gold, drawn once into a strip
  const top = []; for (let c = 0; c < COLS; c++) for (let r = Math.max(0, F.end - 60); r < F.made; r++) if (F.g[r * COLS + c] === 2) { top.push([(c + 0.5) * CELL, r * CELL]); break; }
  if (top.length) { const y0 = Math.min(...top.map((p) => p[1])) - 40, y1 = Math.max(...top.map((p) => p[1])) + 40, rs = 0.5, rim = mk(TW * rs, (y1 - y0) * rs), rx = rim.getContext('2d'); rx.scale(rs, rs); rx.globalCompositeOperation = 'lighter'; rx.globalAlpha = 0.22; top.forEach(([x, y], i) => { if (i % 2) return; rx.drawImage(look.glowG, x - 34, y - y0 - 34, 68, 68); }); look.rim = { c: rim, y0, h: y1 - y0 }; }
}
function coarseMore() {   // rows the field made since (below the bulb, as you fall), into the coarse picture
  const F = s.F; if (look.coarseRows >= F.made) return;
  const n = F.made - look.coarseRows, im = new ImageData(COLS, n); for (let i = 0; i < n * COLS; i++) { const j = look.coarseRows * COLS + i; paint(im.data, i * 4, F.u[j], F.mu[j], F.g[j] === 2, F.thr[Math.floor(j / COLS)]); }
  look.coarse.getContext('2d').putImageData(im, 0, look.coarseRows); look.coarseRows = F.made;
}
function renderChunks(until, y0, y1) {   // the fine picture, a strip CH tall at a time, the strips on screen first
  const F = s.F, res = look.res, w = Math.round(TW * res), h = Math.round(CH * res);
  for (let idx = Math.floor(y0 / CH); idx <= Math.floor(y1 / CH); idx++) {
    let ch = look.chunks.get(idx); if (ch?.ready) continue;
    if (!ch) { ch = { cv: mk(w, h), img: new ImageData(w, h), row: 0, ready: false }; look.chunks.set(idx, ch); }
    const d8 = ch.img.data, cosT = [], sinT = [];
    for (let px = 0; px < w; px++) { const th = F.th0 + F.TH * ((px + 0.5) / w - 0.5); cosT.push(Math.cos(th)); sinT.push(Math.sin(th)); }
    const r0 = ch.row;
    while (ch.row < h && now() < until) {
      const d = idx * CH + (ch.row + 0.5) / res, rr = rOf(F, d), sc = rr * F.TH / TW, goalRow = rr < F.R2; upto(F, Math.floor(d / CELL) + 1); const W0 = thrAt(F, d);
      for (let px = 0, o = ch.row * w * 4; px < w; px++, o += 4) { const D = de(F.P.cr + rr * cosT[px], F.P.ci + rr * sinT[px]); paint(d8, o, D < 0 ? -1 : D / sc, MU, goalRow, W0); }
      ch.row += 1;
    }
    ch.cv.getContext('2d').putImageData(ch.img, 0, 0, 0, r0, w, ch.row - r0);
    if (ch.row >= h) { ch.ready = true; ch.img = null; }
    if (now() >= until) return;
  }
}

// ---------------------------------------------------------------- play
const cellOf = (x, y) => { const c = Math.floor(x / CELL), r = Math.floor(y / CELL); if (c < 0 || c >= COLS || r < 0) return 0; if (r >= s.F.ROWS) return 1; upto(s.F, r); return s.F.g[r * COLS + c]; };
function ready() {   // the field is found: Fig at the top of the way down, shards along it
  const F = s.F; s.ready = true; s.x = (F.path[0] + 0.5) * CELL; s.y = 12; s.vy = 0; s.goalY = F.end * CELL;
  const r = rng(F.seed * 31 + 5);
  for (let row = 24; row < F.end - 16; row += 30 + Math.floor(r() * 10)) { const c = F.path[row], jit = Math.round((r() - 0.5) * 4), cc = okAt(F, row, c + jit) ? c + jit : c; s.shards.push({ x: (cc + 0.5) * CELL, y: (row + 0.5) * CELL, t: r() * 6, got: false }); }
  buildLook();
}
function bump(nx, ny) {
  if (s.F.soft) { s.vy = Math.min(s.vy, VF * 0.4); return; }
  if (s.cool > 0) return;
  s.vy = -150; s.vx += nx * 220; s.cool = 0.4; s.bumps += 1; s.hurt = 0.45; s.shake = 0.35; ph.sfx('boing');
  for (let i = 0; i < 10; i++) { const a = Math.atan2(ny, nx) + (Math.random() - 0.5) * 2.2, v = 60 + Math.random() * 120; s.fx.push({ k: 'dot', x: s.x - nx * FR, y: s.y - ny * FR, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: s.pal.css.edge, life: 0.5 }); }
}
function collide() {   // the cells under Fig's circle: the bulb wins, a wall pushes Fig out the way it came and bumps it back up
  let nx = 0, ny = 0, hit = false;
  for (let r = Math.floor((s.y - FR) / CELL); r <= Math.floor((s.y + FR) / CELL); r++) for (let c = Math.floor((s.x - FR) / CELL); c <= Math.floor((s.x + FR) / CELL); c++) {
    const v = cellOf((c + 0.5) * CELL, (r + 0.5) * CELL); if (!v) continue;
    const qx = Math.max(c * CELL, Math.min(s.x, (c + 1) * CELL)), qy = Math.max(r * CELL, Math.min(s.y, (r + 1) * CELL)), dx = s.x - qx, dy = s.y - qy, d = Math.hypot(dx, dy); if (d >= FR) continue;
    if (v === 2) return 'bulb';
    hit = true; const cx = (c + 0.5) * CELL, cy = (r + 0.5) * CELL, l = Math.hypot(s.x - cx, s.y - cy) || 1; nx += (s.x - cx) / l; ny += (s.y - cy) / l;
  }
  if (!hit) return null;
  const l = Math.hypot(nx, ny); if (l < 1e-6) { nx = 0; ny = -1; } else { nx /= l; ny /= l; }
  if (!s.F.soft) { let n = 0; while (n++ < 28 && touching()) { s.x += nx; s.y += ny; } if (n >= 28) s.y -= 10; }
  bump(nx, ny); return 'wall';
}
function touching() { for (let r = Math.floor((s.y - FR) / CELL); r <= Math.floor((s.y + FR) / CELL); r++) for (let c = Math.floor((s.x - FR) / CELL); c <= Math.floor((s.x + FR) / CELL); c++) { if (cellOf((c + 0.5) * CELL, (r + 0.5) * CELL) !== 1) continue; const qx = Math.max(c * CELL, Math.min(s.x, (c + 1) * CELL)), qy = Math.max(r * CELL, Math.min(s.y, (r + 1) * CELL)); if (Math.hypot(s.x - qx, s.y - qy) < FR) return true; } return false; }
function shieldSecs() { return Math.min(7, 3 + 0.5 * s.got); }
function result(won) {
  const pts = s.got * 40;
  if (!won) return { pts, why: s.got ? `${s.got} shard${s.got === 1 ? '' : 's'} on the way, no bulb` : 'the shard closed over you' };
  const left = Math.round(ph.left?.() || 0), sh = shieldSecs();
  return { pts: pts + 250 + left * 15, label: 'THE BULB · DASH, A LIFE, A SHIELD', sub: `⚡ dash full, ❤️ a life and a ${sh} s shard shield · ${s.got} shard${s.got === 1 ? '' : 's'} · ${left} s to spare`, gift: { dash: 1, heal: 1, shield: sh } };
}
function landed() {
  if (s.done) return; s.done = true; s.vy = 0; s.vx = 0; ph.sfx('fanfare'); ph.cue?.('score', s.x * s.q, (s.y - s.cam) * s.q);
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 180; s.fx.push({ k: 'dot', x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: i % 2 ? '#FFE08A' : '#FFFFFF', life: 0.9 }); }
  s.fx.push({ k: 'ring', x: s.x, y: s.y, life: 0.7 });
  setTimeout(() => { if (s?.done && ph) ph.win(result(true)); }, 550);
}
function grab(sd) {
  sd.got = true; s.got += 1; ph.sfx('chime', { hi: s.got > 3 }); ph.cue?.('score', sd.x * s.q, (sd.y - s.cam) * s.q);
  for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 110; s.fx.push({ k: 'dot', x: sd.x, y: sd.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: s.pal.css.shard, life: 0.5 }); }
  s.fx.push({ k: 'text', x: sd.x, y: sd.y - 14, text: `+40`, life: 0.8 });
}
function update(dt) {
  if (!s) return;
  s.time += dt;
  if (!s.ready) { if (runPrep(BUDGET * 2) && !s.ready) { s.F = prep.F; prep = null; ready(); } return; }
  if (s.done) { s.fx.forEach(stepFx(dt)); s.fx = s.fx.filter((f) => f.life > 0); return; }
  const F = s.F;
  upto(F, Math.floor(s.y / CELL) + 40);   // the field below the bulb, as you get there
  s.cool = Math.max(0, s.cool - dt); s.hurt = Math.max(0, s.hurt - dt); s.shake = Math.max(0, s.shake - dt); s.keyT = Math.max(0, s.keyT - dt);
  // steering: toward your finger, or a side held, or the keys
  let want = 0;
  if (s.auto) { const r = Math.min(F.end, Math.max(0, Math.floor(s.y / CELL) + 3)); want = Math.max(-VX, Math.min(VX, ((F.path[r] + 0.5) * CELL - s.x) * 8)); }
  else if (s.held) want = Math.max(-VX, Math.min(VX, (s.tx - s.x) * 7));
  else if (s.keyT > 0) want = s.key * VX;
  s.vx += (want - s.vx) * Math.min(1, dt * 10);
  const fall = s.time < 0.9 ? VF * (s.time / 0.9) : VF;   // out of the shard's mouth, then falling
  s.vy += (fall - s.vy) * Math.min(1, dt * (s.vy < 0 ? 3 : 2.2));
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(s.vx), Math.abs(s.vy)) * dt / 3)), h = dt / steps;
  for (let i = 0; i < steps; i++) {
    s.x = Math.max(FR, Math.min(TW - FR, s.x + s.vx * h)); s.y = Math.max(0, s.y + s.vy * h);
    if (collide() === 'bulb') return landed();
  }
  s.face = s.vx < -20 ? -1 : s.vx > 20 ? 1 : s.face;
  for (const sd of s.shards) if (!sd.got && Math.hypot(sd.x - s.x, sd.y - s.y) < FR + 10) grab(sd);
  s.trail.push(s.x, s.y); if (s.trail.length > 16) s.trail.splice(0, 2);
  s.fx.forEach(stepFx(dt)); s.fx = s.fx.filter((f) => f.life > 0);
  s.pulse = Math.max(0, s.pulse - dt);
}
const stepFx = (dt) => (f) => { f.life -= dt; if (f.k === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - dt * 2; f.vy *= 1 - dt * 2; } else if (f.k === 'text') f.y -= 20 * dt; };
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ts = t / 1000;
  s.q = ph.W / TW; s.S = k * s.q; const S = s.S, Hv = ph.H / s.q;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = s.pal.css.sky0; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!s.ready) {   // still searching for a spot (only if you dove in at once): the shard's own triangles falling away
    if (runPrep(BUDGET * 2)) { s.F = prep.F; prep = null; ready(); }
    ctx.setTransform(S, 0, 0, S, ph.ox || 0, ph.oy || 0); ctx.strokeStyle = s.pal.css.edge; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const u = (ts * 0.5 + i / 6) % 1, sz = 20 + u * u * 900; ctx.globalAlpha = (1 - u) * 0.6; ctx.beginPath(); sierp(ctx, TW / 2, Hv * 0.45, sz, 1); ctx.stroke(); }
    ctx.globalAlpha = 1; return;
  }
  const F = s.F;
  s.cam = Math.max(-Hv * 0.3, Math.min((F.ROWS * CELL) - Hv, s.y - Hv * 0.32));
  const shake = s.shake > 0 && !ph.reduceMotion ? s.shake * 10 : 0, sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  const world = () => ctx.setTransform(S, 0, 0, S, (ph.ox || 0) + sx * S, (ph.oy || 0) + (sy - s.cam) * S);
  coarseMore();
  world(); ctx.imageSmoothingEnabled = true;
  const vTop = s.cam - (ph.oy || 0) / S, vBot = s.cam + (cv.height - (ph.oy || 0)) / S;   // what the canvas shows, margins too
  const y0 = Math.max(0, vTop), y1 = Math.min(F.made * CELL, vBot);
  if (y1 > y0) ctx.drawImage(look.coarse, 0, y0 / CELL, COLS, (y1 - y0) / CELL, 0, y0, TW, y1 - y0);   // the coarse picture under everything
  renderChunks(now() + BUDGET, Math.max(0, s.cam), Math.min(F.ROWS * CELL - 1, vBot + CH * 0.5));
  for (const [idx, ch] of look.chunks) { const top = idx * CH; if (top + CH < vTop - CH) { look.chunks.delete(idx); continue; } if (ch.ready && top < vBot) ctx.drawImage(ch.cv, 0, top, TW, CH + 0.6); }
  if (s.cam < 0) { ctx.globalAlpha = 0.85; ctx.fillStyle = s.pal.css.sky0; ctx.fillRect(-20, s.cam - 20, TW + 40, -s.cam + 20); ctx.globalAlpha = 1; for (let i = 0; i < 3; i++) { const u = (ts * 0.4 + i / 3) % 1; ctx.strokeStyle = s.pal.css.shard; ctx.globalAlpha = (1 - u) * 0.5; ctx.lineWidth = 1.2; ctx.beginPath(); sierp(ctx, TW / 2, -30, 40 + u * 260, 0); ctx.stroke(); } ctx.globalAlpha = 1; }   // above the top: the shard's mouth you fell in by
  // the bulb's rim, breathing
  if (look.rim && look.rim.y0 < s.cam + Hv && look.rim.y0 + look.rim.h > s.cam) { const pu = 0.65 + 0.35 * Math.sin(ts * 3.2) + s.pulse; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, pu); ctx.drawImage(look.rim.c, 0, look.rim.y0, TW, look.rim.h); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  // shards along the way down
  for (const sd of s.shards) { if (sd.got || sd.y < s.cam - 20 || sd.y > s.cam + Hv + 20) continue; const p = 0.5 + 0.5 * Math.sin(ts * 4 + sd.t);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.3 * p; ctx.drawImage(look.glowS, sd.x - 18 - 4 * p, sd.y - 18 - 4 * p, 36 + 8 * p, 36 + 8 * p); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(sd.x, sd.y); ctx.rotate(ts * 1.4 + sd.t); ctx.drawImage(look.shard, -10, -10, 20, 20); ctx.restore(); }
  // Fig: a trail, a glow, and Fig falling (wincing after a bump)
  for (let i = 2; i < s.trail.length; i += 2) { ctx.globalAlpha = (i / s.trail.length) * 0.35; ctx.drawImage(look.glowE, s.trail[i] - 7, s.trail[i + 1] - 7, 14, 14); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(look.glowE, s.x - 26, s.y - 26, 52, 52); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawPal(ph.mood(), ctx, { x: s.x, y: s.y, s: FR * 1.1, t: ts, r: ph.S.curve.r, face: s.face, hurt: s.hurt > 0 });
  for (const f of s.fx) { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2)); if (f.k === 'dot') { ctx.fillStyle = f.c; ctx.fillRect(f.x - 1.5, f.y - 1.5, 3, 3); } else if (f.k === 'ring') { const u = 1 - f.life / 0.7; ctx.strokeStyle = '#FFE08A'; ctx.lineWidth = 3 * (1 - u) + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + u * 70, 0, 7); ctx.stroke(); } else { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#0B0A1F'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } }
  ctx.globalAlpha = 1;
  // the screen's own layer: how far down, how deep the zoom, and the first words
  ctx.setTransform(S, 0, 0, S, ph.ox || 0, ph.oy || 0);
  { const bx = TW - 9, by0 = 58, by1 = Hv - 40, p = Math.max(0, Math.min(1, s.y / s.goalY)), y = by0 + (by1 - by0) * p;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx, by1); ctx.stroke();
    ctx.strokeStyle = s.pal.css.edge; ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx, y); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(look.glowG, bx - 9, by1 - 9, 18, 18); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(bx, by1, 3.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(bx, y, 3, 0, 7); ctx.fill();
    const z = rOf(F, 0) / rOf(F, Math.max(0, s.y)); ctx.font = '900 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(`🔍 ×${z < 10 ? z.toFixed(1) : Math.round(z)}`, 10, Hv - 14); }
  if (s.time < 2.4) { const a = Math.min(1, (2.4 - s.time) * 1.5), ty = Hv * 0.62; ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#0B0A1F'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText('FALL TO THE BULB', TW / 2, ty); ctx.fillText('FALL TO THE BULB', TW / 2, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.fillStyle = '#fff'; ctx.strokeText('drag or hold a side to steer · grab the shards', TW / 2, ty + 18); ctx.fillText('drag or hold a side to steer · grab the shards', TW / 2, ty + 18); ctx.globalAlpha = 1; }
}
const KEYS = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
const pocket = {
  key: 'shard', name: 'Inside a shard', icon: '💠', goal: 'fall to the bulb', dur: DUR, rim: '#9BF2FF', system: 'Mandelbrot set',
  prepare(ms = BUDGET) { if (!s || !s.ready) runPrep(ms); },   // the organ calls this while the shard glows, so the spot is found before you dive
  start(h, seed = {}) {
    ph = h; ctx = h.ctx; look = null;
    s = { pal: palette(seed.world || { sky: ['#0B0A1F', '#3A2275', '#E0607E'], ground: ['#2A2066', '#07061A'], edge: '#3DF2E0', bands: ['#F5C542', '#FFB347', '#9BD1FF', '#5A8CFF', '#2B4FD6', '#17307F'], shard: '#F5C542' }),
      F: null, ready: false, x: TW / 2, y: 12, vx: 0, vy: 0, face: 1, held: false, tx: TW / 2, key: 0, keyT: 0, auto: false, cool: 0, hurt: 0, shake: 0, pulse: 0,
      shards: [], got: 0, bumps: 0, fx: [], trail: [], time: 0, done: false, cam: 0, q: ph.W / TW, S: ph.k * ph.W / TW, goalY: LG };
    if (runPrep(BUDGET * 3)) { s.F = prep.F; prep = null; ready(); }   // usually found already, while the shard glowed
  },
  update, draw,
  onBeat(ev) { if (!s || !s.ready || s.done) return; s.pulse = ev?.peak ? 0.6 : 0.25; },   // the bulb breathes with the beat up top
  pointer(type, p) {
    if (!s || s.done) return; const x = p.x / (s.q || 1);
    if (type === 'down') { s.held = true; s.tx = x; s.auto = false; } else if (type === 'move') { if (s.held) s.tx = x; } else s.held = false;
  },
  keydown(e) { const d = KEYS[e.code]; if (d == null || !s) return; e.preventDefault?.(); s.key = d; s.keyT = 0.32; s.auto = false; },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'shard', ready: s.ready, x: s.x, y: s.y, vx: s.vx, vy: s.vy, goalY: s.goalY, progress: s.goalY ? s.y / s.goalY : 0, bumps: s.bumps, got: s.got, shards: s.shards.length, done: s.done,
    spot: s.F && { cr: s.F.P.cr, ci: s.F.P.ci, period: s.F.P.p, size: s.F.P.size, zoom: s.F.Z, tries: s.F.seed, soft: !!s.F.soft }, chunks: look ? [...look.chunks.values()].filter((c) => c.ready).length : 0, res: look?.res,
    screen: (x, y) => ({ x: x * s.q, y: (y - s.cam) * s.q }), figScreen: () => ({ x: s.x * s.q, y: (s.y - s.cam) * s.q }), pathX: (y) => s.F ? (s.F.path[Math.max(0, Math.min(s.F.end, Math.floor(y / CELL)))] + 0.5) * CELL : null,
    auto: (on = true) => { s.auto = on; return on; }, steer: (x) => { s.held = true; s.tx = x; }, letGo: () => { s.held = false; }, drop: (y) => { s.y = y; },
    win: () => { landed(); return true; }, lose: () => ph.lose(result(false)) }),
};
export default pocket;
