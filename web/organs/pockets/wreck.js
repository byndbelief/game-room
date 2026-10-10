// ⚓🏴‍☠️ THE SUNKEN WRECK: Salvo's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a Salvo fight, a ship you sank (or an old wreck's shadow under the waves) glints; tap it and you sink after
// it, into its flooded hold. Fig swims (touch where to go, hold to steer) through the dark, picks up the 🪙 coins and 💰
// bags on the way, grabs the 🗝️ from the eye of the butterfly and opens the captain's chest before the air runs out
// (22 s). Up top it's a crate of better shells loaded and ready, a heart back, and the coins as points.
//
// Random in its own way: the LORENZ ATTRACTOR, dx = σ(y − x), dy = x(ρ − z) − y, dz = xy − βz (σ 10, ρ 28, β 8/3), the
// weather model that gave us "the butterfly effect". Every eel in the hold is a point riding the flow (Runge–Kutta in
// small steps), seen side on (x across, z up): it loops round one wing, then round the other, and nobody can say how many
// loops before it switches. The butterfly is drawn faintly in the water so you can read where they'll go. The coins lie
// on the attractor too (where the eels swim, of course), and the key sits in the eye of the far wing: the one place the
// eels circle and never cross. Touch an eel and Fig gets a jolt: stuck a moment, and a coin drops out of the purse
// (it sinks; pick it up again). Only time is lost, never a life.
import { drawPal } from '../../pals.js';

const SIG = 10, RHO = 28, BETA = 8 / 3, DUR = 22, TOP = 70, SPEED = 150, FR = 11, RATE = 0.2, SEGS = 18, GAP = 5.5;
const EYE = Math.sqrt(BETA * (RHO - 1));   // the wings' eyes: (±EYE, ±EYE, ρ − 1)
let ph = null, ctx = null, s = null, look = null;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const f = (x, y, z) => [SIG * (y - x), x * (RHO - z) - y, x * y - BETA * z];
function rk4(e, h) {   // one Runge–Kutta step of the flow
  const { x, y, z } = e, a = f(x, y, z), b = f(x + a[0] * h / 2, y + a[1] * h / 2, z + a[2] * h / 2), c = f(x + b[0] * h / 2, y + b[1] * h / 2, z + b[2] * h / 2), d = f(x + c[0] * h, y + c[1] * h, z + c[2] * h);
  e.x += h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]); e.y += h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1]); e.z += h / 6 * (a[2] + 2 * b[2] + 2 * c[2] + d[2]);
}
// the butterfly, side on: x across the hold, z up it
const P = (x, z) => ({ x: s.cx + x * s.kx, y: s.zy0 - z * s.kz });
const flow = (e, t) => { const n = Math.max(1, Math.ceil(t / 0.004)), h = t / n; for (let i = 0; i < n; i++) rk4(e, h); };
function newEel(r, i) {
  const e = { x: (r() - 0.5) * 2 + (i % 2 ? 1 : -1), y: r() - 0.5, z: 20 + r() * 6, tr: [], hue: [185, 160, 205, 140, 220][i % 5], ph: r() * 6 };
  flow(e, 2 + r() * 12);   // onto the attractor, somewhere along it
  let last = P(e.x, e.z); e.tr.push(last);
  for (let k = 0; k < 4000 && e.tr.length < SEGS; k++) { flow(e, 0.004); const q = P(e.x, e.z); if (Math.hypot(q.x - last.x, q.y - last.y) >= GAP) { e.tr.unshift(q); last = q; } }   // its body behind its head
  e.tr.unshift({ ...e.tr[0] }); return e;   // tr[0] is the live head, the rest are anchored GAP apart
}
function start(h, seed = {}) {
  ph = h; ctx = h.ctx; look = null;
  const W = ph.W, H = ph.H, r = rng(seed.seed || Math.floor(Math.random() * 1e9)), floor = H - 44, bottom = H - 80;
  const arms = seed.arms?.length ? seed.arms : [{ kind: 'missile', icon: '🚀', name: 'Missiles', n: 8 }];
  s = { W, H, floor, bottom, cx: W / 2, kx: (W / 2 - 22) / 21, kz: (bottom - TOP) / 48, zy0: 0, r, eels: [], coins: [], fx: [], bub: [], aim: null, held: false, keys: new Set(),
    fig: { x: W / 2, y: TOP - 2, vx: 0, vy: 0, face: 1, stun: 0, inv: 1.6 }, key: null, chest: null, gotKey: false, coins0: 0, purse: 0, pts: 0, time: 0, surge: 0, nag: 0, hits: 0,
    done: false, open: 0, arm: arms[Math.floor(r() * arms.length)], gold: !!seed.gold };
  s.zy0 = bottom + 2 * s.kz;
  const side = r() < 0.5 ? -1 : 1;
  s.chest = { x: W / 2 + side * W * 0.3, y: floor - 12 };
  s.key = { ...P(-side * EYE, RHO - 1), got: false };
  const n = 3 + ((seed.stage || 1) >= 3 ? 1 : 0); for (let i = 0; i < n; i++) s.eels.push(newEel(r, i));
  // the treasure lies on the attractor: points of one long orbit, spaced out, clear of the way in, the chest and the key
  const o = { x: r() * 2 - 1, y: r() * 2 - 1, z: 20 + r() * 5 }; flow(o, 5);
  const clear = (p, d) => [s.fig, s.chest, s.key, ...s.coins].every((q) => Math.hypot(q.x - p.x, q.y - p.y) > d);
  for (let k = 0; k < 400 && s.coins.length < 11; k++) { flow(o, 0.25 + r() * 0.35); const p = P(o.x, o.z); if (p.y < TOP + 10 || !clear(p, 40)) continue; const bag = s.coins.length >= 9; s.coins.push({ x: p.x, y: p.y, v: bag ? 60 : 20, bag, ph: r() * 6, got: false, vy: 0, lie: false }); }
  for (let i = 0; i < 26; i++) s.bub.push({ x: r() * W, y: r() * H, v: 14 + r() * 26, r: 0.8 + r() * 2.2, w: r() * 6 });
}
function result(won) {
  if (!won) return { pts: s.pts, why: s.purse ? `the air ran out · ${s.purse} coins in the purse` : 'the air ran out' };
  const left = Math.round(ph.left?.() || 0), a = s.arm;
  return { pts: s.pts + 250 + left * 15, label: `THE CAPTAIN'S CHEST · ${a.name.toUpperCase()}`, sub: `${a.icon} ${a.n} rounds loaded, a heart back${s.purse ? ` and ${s.purse} coins` : ''} · ${left} s to spare`, gift: { arm: a.kind, heart: 1, coins: s.purse } };
}
function burst(x, y, cols, n, v0 = 40, v1 = 120) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = v0 + Math.random() * (v1 - v0); s.fx.push({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: cols[i % cols.length], life: 0.7 }); } }
function shock(e) {   // an eel got Fig: a jolt, stuck a moment, a coin out of the purse
  const F = s.fig; F.stun = 0.9; F.inv = 2; s.hits += 1; F.vx = (F.x - e.x) * 4; F.vy = (F.y - e.y) * 4; ph.sfx('buzz'); navigator.vibrate?.(40);
  burst(F.x, F.y, ['#9BE7FF', '#FFFFFF', '#C9F6FF'], 12, 60, 160);
  if (s.purse > 0) { s.purse -= 1; s.pts -= 20; s.coins.push({ x: F.x, y: F.y, v: 20, bag: false, ph: 0, got: false, vy: -40, lie: false, drop: 0.6 }); s.fx.push({ k: 'text', x: F.x, y: F.y - 18, text: 'ZZT! −1 🪙', life: 1 }); }
  else s.fx.push({ k: 'text', x: F.x, y: F.y - 18, text: 'ZZT!', life: 0.8 });
}
function update(dt) {
  if (!s) return;
  s.time += dt; s.nag = Math.max(0, s.nag - dt);
  const F = s.fig, W = s.W;
  // 🦋 the eels ride the flow (faster for a moment on a peak up top)
  const rate = RATE * (s.surge > 0 ? 1.7 : 1); s.surge = Math.max(0, s.surge - dt);
  s.eels.forEach((e) => { flow(e, rate * Math.min(dt, 0.05)); const q = P(e.x, e.z), an = e.tr[1]; e.ph += dt * 9; e.tr[0] = q;
    if (Math.hypot(q.x - an.x, q.y - an.y) >= GAP) { e.tr.unshift({ ...q }); if (e.tr.length > SEGS) e.tr.pop(); } e.hx = q.x; e.hy = q.y; });
  // Fig swims toward the finger (or the keys)
  if (F.stun > 0) { F.stun -= dt; F.vx *= 1 - Math.min(1, dt * 3); F.vy *= 1 - Math.min(1, dt * 3); }
  else if (!s.done) {
    let dx = 0, dy = 0, sp = SPEED;
    if (s.keys.size) { s.keys.forEach((k) => { dx += k === 1 ? 1 : k === 3 ? -1 : 0; dy += k === 2 ? 1 : k === 0 ? -1 : 0; }); }
    else if (s.aim) { dx = s.aim.x - F.x; dy = s.aim.y - F.y; const d = Math.hypot(dx, dy); if (d < 4) { dx = 0; dy = 0; if (!s.held) s.aim = null; } else sp *= Math.min(1, d / 40); }
    const d = Math.hypot(dx, dy) || 1, tx = dx ? dx / d * sp : 0, ty = dy ? dy / d * sp : 0, a = Math.min(1, dt * 7);
    F.vx += (tx - F.vx) * a; F.vy += (ty - F.vy) * a;
  } else { F.vx *= 0.9; F.vy *= 0.9; }
  F.x += F.vx * dt; F.y += F.vy * dt; if (Math.abs(F.vx) > 8) F.face = F.vx > 0 ? 1 : -1;
  F.x = Math.max(16, Math.min(W - 16, F.x)); F.y = Math.max(TOP - 40, Math.min(s.floor - 10, F.y));
  F.inv = Math.max(0, F.inv - dt);
  if (Math.hypot(F.vx, F.vy) > 40 && Math.random() < dt * 8) s.fx.push({ k: 'bub', x: F.x - F.face * 8, y: F.y - 4, vx: (Math.random() - 0.5) * 10, vy: -30, r: 1 + Math.random() * 1.6, life: 0.9 });
  // eels: touch any part of one and it jolts you
  if (!s.done && F.inv <= 0) for (const e of s.eels) { let hit = false; for (let i = 0; i < e.tr.length; i += 2) { const q = e.tr[i]; if (Math.hypot(q.x - F.x, q.y - F.y) < FR + 5 - i * 0.12) { hit = true; break; } } if (hit) { shock({ x: e.hx, y: e.hy }); break; } }
  // treasure
  s.coins.forEach((c) => {
    if (c.got) return;
    if (c.drop != null) { c.drop -= dt; c.vy += 90 * dt; c.vy = Math.min(c.vy, 45); c.y += c.vy * dt; if (c.y >= s.floor - 6) { c.y = s.floor - 6; c.vy = 0; } if (c.drop > 0) return; }
    if (Math.hypot(c.x - F.x, c.y - F.y) < FR + (c.bag ? 12 : 9)) { c.got = true; s.purse += c.bag ? 3 : 1; s.pts += c.v; ph.sfx('ping'); ph.cue?.('score', c.x, c.y); burst(c.x, c.y, ['#FFD166', '#FFF4C2', '#F5C542'], c.bag ? 14 : 8); s.fx.push({ k: 'text', x: c.x, y: c.y - 12, text: `${c.bag ? '💰' : '🪙'} +${c.v}`, life: 0.9 }); }
  });
  if (!s.key.got && Math.hypot(s.key.x - F.x, s.key.y - F.y) < FR + 12) { s.key.got = true; s.gotKey = true; s.pts += 50; ph.sfx('chime'); burst(s.key.x, s.key.y, ['#FFE08A', '#FFFFFF'], 14); s.fx.push({ k: 'text', x: s.key.x, y: s.key.y - 16, text: '🗝️ the key! now the chest', life: 1.3 }); }
  if (!s.done && Math.hypot(s.chest.x - F.x, s.chest.y - F.y) < FR + 22) {
    if (s.gotKey) { s.done = true; ph.sfx('fanfare'); burst(s.chest.x, s.chest.y - 10, ['#FFD166', '#FFF4C2', '#9BE7FF', '#F5C542'], 30, 60, 200); setTimeout(() => s && ph.win(result(true)), 650); }
    else if (s.nag <= 0) { s.nag = 1.6; ph.sfx('clack'); s.fx.push({ k: 'text', x: s.chest.x, y: s.chest.y - 30, text: '🔒 find the 🗝️ first', life: 1.2 }); }
  }
  if (s.done) s.open = Math.min(1, s.open + dt * 2.5);
  s.bub.forEach((b) => { b.y -= b.v * dt; b.x += Math.sin(s.time * 1.3 + b.w) * 6 * dt; if (b.y < -6) { b.y = s.H + 6; b.x = Math.random() * W; } });
  s.fx.forEach((q) => { q.life -= dt; if (q.k === 'dot') { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt * 2.5; q.vy *= 1 - dt * 2.5; } else if (q.k === 'bub') { q.x += q.vx * dt; q.y += q.vy * dt; } else q.y -= 18 * dt; });
  s.fx = s.fx.filter((q) => q.life > 0); if (s.fx.length > 160) s.fx.splice(0, s.fx.length - 160);
}
// 🎨 THE LOOK. Painted once: the flooded hold (planks and ribs in Salvo's deep blues, the torn hatch overhead with light
// pouring through it, portholes, silt and a few things that went down with her), the butterfly as a faint trace in the
// water, and the vignette. Coins, bags, the key, the chest and the eels' glow are small cached sprites.
function buildLook() {
  const cv = ph.cv, k = ph.k, W = s.W, H = s.H, ox = ph.ox || 0, oy = ph.oy || 0, c = mk(cv.width, cv.height), x = c.getContext('2d'), r = rng(31);
  x.fillStyle = '#020A14'; x.fillRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, ox, oy);
  { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0E3550'); g.addColorStop(0.5, '#08223A'); g.addColorStop(1, '#041220'); x.fillStyle = g; x.fillRect(-20, -20, W + 40, H + 40); }
  // the back wall: planks, seams, nails, a little weed
  for (let y = 8, i = 0; y < s.floor; y += 17, i++) { x.fillStyle = i % 2 ? '#123248' : '#0F2C42'; x.fillRect(-10, y, W + 20, 16); x.fillStyle = '#05121E'; x.fillRect(-10, y + 15, W + 20, 2);
    for (let px = (i * 53) % 90; px < W; px += 70 + r() * 60) { x.fillStyle = '#05121E'; x.fillRect(px, y, 1.5, 15); x.fillStyle = '#5E7E8E55'; x.fillRect(px + 4, y + 4, 1.6, 1.6); x.fillRect(px + 4, y + 10, 1.6, 1.6); } }
  for (let i = 0; i < 700; i++) { x.fillStyle = r() < 0.5 ? '#00000030' : '#9FD8FF0a'; x.fillRect(r() * W, r() * s.floor, 1 + r() * 2, 1); }
  // the ribs, curving in like the inside of a hull
  for (let i = 0; i < 5; i++) { const px = (i + 0.5) * W / 5, bend = (px - W / 2) * 0.12; x.strokeStyle = '#061624'; x.lineWidth = 15; x.beginPath(); x.moveTo(px - bend * 2, -10); x.quadraticCurveTo(px + bend, H * 0.5, px - bend * 0.5, s.floor); x.stroke();
    x.strokeStyle = '#1D4660'; x.lineWidth = 10; x.stroke(); x.strokeStyle = '#3C6E8A55'; x.lineWidth = 2; x.beginPath(); x.moveTo(px - bend * 2 - 3, -10); x.quadraticCurveTo(px + bend - 3, H * 0.5, px - bend * 0.5 - 3, s.floor); x.stroke(); }
  // portholes, a cold green glow
  for (let i = 0; i < 3; i++) { const px = W * (0.18 + i * 0.32), py = H * 0.22 + (i % 2) * 40, g = x.createRadialGradient(px, py, 2, px, py, 26); g.addColorStop(0, '#7FE3C855'); g.addColorStop(1, '#7FE3C800'); x.fillStyle = g; x.beginPath(); x.arc(px, py, 26, 0, 7); x.fill();
    x.strokeStyle = '#8A6A3A'; x.lineWidth = 4; x.beginPath(); x.arc(px, py, 11, 0, 7); x.stroke(); x.fillStyle = '#0A2A2A'; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); x.fillStyle = '#9FF2DA44'; x.beginPath(); x.arc(px - 3, py - 3, 3, 0, 7); x.fill(); }
  // the torn hatch overhead, the way you came in, and the light falling through it
  x.fillStyle = '#020A14'; x.beginPath(); x.moveTo(W / 2 - 46, -20); for (let px = -46; px <= 46; px += 8) x.lineTo(W / 2 + px, 6 + Math.abs(Math.sin(px * 0.7)) * 14 + (Math.abs(px) > 38 ? -6 : 0)); x.lineTo(W / 2 + 46, -20); x.closePath(); x.fill();
  x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const x0 = W / 2 - 30 + i * 18, g = x.createLinearGradient(0, 0, 0, H * 0.85); g.addColorStop(0, 'rgba(150,220,255,0.16)'); g.addColorStop(1, 'rgba(150,220,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(x0, 4); x.lineTo(x0 + 10, 4); x.lineTo(x0 + 40 + i * 20, H * 0.85); x.lineTo(x0 - 30 + i * 12, H * 0.85); x.closePath(); x.fill(); } x.restore();
  // 🦋 the attractor, a faint trace in the water: where the eels will swim
  { const o = { x: 1, y: 1, z: 20 }; flow(o, 2); x.strokeStyle = 'rgba(127,227,255,0.10)'; x.lineWidth = 1; x.beginPath(); let p = P(o.x, o.z); x.moveTo(p.x, p.y); for (let i = 0; i < 5000; i++) { rk4(o, 0.008); p = P(o.x, o.z); x.lineTo(p.x, p.y); } x.stroke();
    [[-1, 1], [1, 1]].forEach(([sg]) => { const e = P(sg * EYE, RHO - 1); x.strokeStyle = 'rgba(255,224,138,0.10)'; x.setLineDash([2, 5]); x.beginPath(); x.arc(e.x, e.y, 16, 0, 7); x.stroke(); x.setLineDash([]); }); }
  // the silt floor: ripples, shells, weed, a cannon and a barrel that went down with her
  { const fl = s.floor; x.fillStyle = '#1E2E2A'; x.beginPath(); x.moveTo(-20, fl + 4); for (let px = -20; px <= W + 20; px += 10) x.lineTo(px, fl + Math.sin(px / 23) * 3); x.lineTo(W + 20, H + 40); x.lineTo(-20, H + 40); x.closePath(); x.fill();
    x.fillStyle = '#3A4E44'; x.fillRect(-20, fl - 1, W + 40, 2); x.strokeStyle = '#ffffff10'; for (let i = 0; i < 4; i++) { x.beginPath(); for (let px = 0; px <= W; px += 10) x.lineTo(px, fl + 10 + i * 8 + Math.sin(px / 17 + i) * 2); x.stroke(); }
    const bx = s.chest.x < W / 2 ? W * 0.8 : W * 0.2; x.fillStyle = '#2C1E14'; x.beginPath(); x.ellipse(bx, fl - 9, 11, 14, 0.4, 0, 7); x.fill(); x.strokeStyle = '#6A5030'; x.lineWidth = 2; x.beginPath(); x.ellipse(bx, fl - 9, 11, 14, 0.4, 0, 7); x.stroke(); x.beginPath(); x.moveTo(bx - 9, fl - 16); x.lineTo(bx + 4, fl - 22); x.moveTo(bx - 4, fl + 2); x.lineTo(bx + 10, fl - 4); x.stroke();
    x.fillStyle = '#26313A'; x.save(); x.translate(W / 2 + 6, fl - 6); x.rotate(-0.15); x.fillRect(-24, -5, 42, 10); x.beginPath(); x.arc(-24, 0, 7, 0, 7); x.fill(); x.fillStyle = '#0A1016'; x.beginPath(); x.arc(18, 0, 3.5, 0, 7); x.fill(); x.restore();
    for (let i = 0; i < 14; i++) { const px = r() * W, hgt = 18 + r() * 40; x.strokeStyle = r() < 0.5 ? '#2E6B4A' : '#3F8058'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(px, fl + 2); x.quadraticCurveTo(px + (r() - 0.5) * 20, fl - hgt / 2, px + (r() - 0.5) * 14, fl - hgt); x.stroke(); }
    for (let i = 0; i < 10; i++) { x.fillStyle = r() < 0.5 ? '#E8D8C066' : '#C9A0A066'; x.beginPath(); x.ellipse(r() * W, fl + 6 + r() * 16, 2.5, 1.6, r() * 3, 0, 7); x.fill(); } }
  { const g = x.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,4,12,0.6)'); x.fillStyle = g; x.fillRect(-20, -20, W + 40, H + 40); }
  // sprites
  const S2 = 48, coin = mk(S2, S2), cx2 = coin.getContext('2d'); { const g = cx2.createRadialGradient(20, 18, 2, 24, 24, 20); g.addColorStop(0, '#FFF4C2'); g.addColorStop(0.5, '#F5C542'); g.addColorStop(1, '#9A6A10'); cx2.fillStyle = g; cx2.beginPath(); cx2.arc(24, 24, 20, 0, 7); cx2.fill(); cx2.strokeStyle = '#7A5208'; cx2.lineWidth = 3; cx2.stroke(); cx2.strokeStyle = '#FFE9A0'; cx2.lineWidth = 2; cx2.beginPath(); cx2.arc(24, 24, 13, 0, 7); cx2.stroke(); cx2.fillStyle = '#9A6A10'; cx2.font = '900 16px system-ui'; cx2.textAlign = 'center'; cx2.textBaseline = 'middle'; cx2.fillText('r', 24, 25); }
  const glow = (rgb, a = 0.8) => { const g2 = mk(64, 64), gx = g2.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`); gr.addColorStop(1, `rgba(${rgb},0)`); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64); return g2; };
  const chest = (open) => { const cs = mk(96, 80), q = cs.getContext('2d'); q.translate(48, 50);
    q.fillStyle = '#00000055'; q.beginPath(); q.ellipse(0, 22, 40, 7, 0, 0, 7); q.fill();
    q.fillStyle = '#6B3E1E'; q.fillRect(-34, -8, 68, 30); q.fillStyle = '#8A5428'; for (let i = 0; i < 3; i++) q.fillRect(-34, -6 + i * 10, 68, 7);
    if (open) { q.fillStyle = '#FFD166'; q.beginPath(); q.ellipse(0, -8, 30, 8, 0, 0, 7); q.fill(); q.fillStyle = '#FFF4C2'; for (let i = 0; i < 9; i++) { q.beginPath(); q.arc(-24 + i * 6, -10 - (i % 3) * 2, 3, 0, 7); q.fill(); }
      q.fillStyle = '#5A3218'; q.beginPath(); q.moveTo(-34, -8); q.lineTo(-30, -44); q.lineTo(30, -44); q.lineTo(34, -8); q.lineTo(30, -12); q.lineTo(-30, -12); q.closePath(); q.fill(); }
    else { q.fillStyle = '#7A4622'; q.beginPath(); q.moveTo(-34, -8); q.quadraticCurveTo(0, -36, 34, -8); q.closePath(); q.fill(); }
    q.fillStyle = '#C9971E'; q.fillRect(-36, -9, 72, 4); q.fillRect(-26, -8, 5, 30); q.fillRect(21, -8, 5, 30); q.fillRect(-36, 18, 72, 4);
    q.fillStyle = '#E8C04A'; q.beginPath(); q.roundRect(-6, -6, 12, 13, 2); q.fill(); q.fillStyle = '#3A2410'; q.beginPath(); q.arc(0, -1, 2, 0, 7); q.fill(); q.fillRect(-1, 0, 2, 5); return cs; };
  const key = mk(64, 64), kx = key.getContext('2d'); kx.translate(32, 32); kx.lineCap = 'round';   // an old gold key
  [['#6A4A08', 9], ['#F5C542', 6]].forEach(([col, w]) => { kx.strokeStyle = col; kx.lineWidth = w; kx.beginPath(); kx.arc(-14, 0, 9, 0, 7); kx.moveTo(-5, 0); kx.lineTo(24, 0); kx.moveTo(16, 0); kx.lineTo(16, 9); kx.moveTo(22, 0); kx.lineTo(22, 7); kx.stroke(); });
  kx.strokeStyle = '#FFF4C2'; kx.lineWidth = 2; kx.beginPath(); kx.arc(-14, 0, 9, 3.6, 5); kx.moveTo(-3, -1.5); kx.lineTo(18, -1.5); kx.stroke();
  look = { key, c, k, w: cv.width, h: cv.height, coin, chestShut: chest(false), chestOpen: chest(true), eelG: glow('120,220,255', 0.7), goldG: glow('255,210,110', 0.8), figG: glow('200,240,255', 0.45) };
}
function drawEel(e, ts) {
  const tr = e.tr, n = tr.length; if (n < 2) return;
  ctx.lineCap = 'round';
  for (let i = n - 1; i > 0; i--) { const u = 1 - i / n, w = 2 + 7 * Math.sin(Math.PI * Math.min(1, 0.25 + u * 0.75)); const a = tr[i], b = tr[i - 1], wob = Math.sin(e.ph - i * 0.7) * 1.6;
    ctx.strokeStyle = `hsl(${e.hue} 55% ${26 + u * 22}%)`; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(a.x, a.y + wob); ctx.lineTo(b.x, b.y + Math.sin(e.ph - (i - 1) * 0.7) * 1.6); ctx.stroke(); }
  for (let i = n - 1; i > 0; i -= 3) { const a = tr[i]; ctx.fillStyle = `hsla(${e.hue} 95% 78% / ${0.35 + 0.45 * (0.5 + 0.5 * Math.sin(ts * 6 - i * 0.6))})`; ctx.beginPath(); ctx.arc(a.x, a.y + Math.sin(e.ph - i * 0.7) * 1.6, 1.9, 0, 7); ctx.fill(); }   // the glowing spots
  const h = tr[0], h2 = tr[1], ang = Math.atan2(h.y - h2.y, h.x - h2.x);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.65; ctx.drawImage(look.eelG, h.x - 24, h.y - 24, 48, 48); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang); ctx.fillStyle = `hsl(${e.hue} 55% 46%)`; ctx.beginPath(); ctx.ellipse(2, 0, 8, 5.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFF6C8'; ctx.beginPath(); ctx.arc(5, -2.6, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#101820'; ctx.beginPath(); ctx.arc(5.6, -2.6, 1, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0A1016'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(9.5, 1); ctx.lineTo(4, 2.5); ctx.stroke(); ctx.restore();
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ox = ph.ox || 0, oy = ph.oy || 0, ts = t / 1000, F = s.fig;
  if (!look || look.w !== cv.width || look.h !== cv.height || look.k !== k) buildLook();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(look.c, 0, 0);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  s.bub.forEach((b) => { ctx.strokeStyle = 'rgba(200,236,255,0.28)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); });
  // the chest, its glow; the key in the eye of the far wing
  { const C = s.chest, pu = 0.5 + 0.5 * Math.sin(ts * 3); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = s.gotKey ? 0.5 + 0.4 * pu : 0.25; ctx.drawImage(look.goldG, C.x - 44, C.y - 50, 88, 88); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(s.open > 0.3 ? look.chestOpen : look.chestShut, C.x - 36, C.y - 36, 72, 60);
    if (!s.done) { ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.gotKey ? '🗝️' : '🔒', C.x, C.y - 40 - pu * 3); ctx.textBaseline = 'alphabetic'; } }
  if (!s.key.got) { const K = s.key, b = Math.sin(ts * 2.4) * 3; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(ts * 5); ctx.drawImage(look.goldG, K.x - 26, K.y - 26 + b, 52, 52); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(255,224,138,${0.35 + 0.25 * Math.sin(ts * 3)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(K.x, K.y + b, 17, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(K.x, K.y + b); ctx.rotate(-0.5 + Math.sin(ts * 1.7) * 0.2); ctx.drawImage(look.key, -16, -16, 32, 32); ctx.restore(); }
  // coins spin (squashed sprite), bags sway
  s.coins.forEach((c) => { if (c.got) return; const y = c.y + (c.drop == null ? Math.sin(ts * 2 + c.ph) * 2.5 : 0);
    if (c.bag) { ctx.save(); ctx.translate(c.x, y); ctx.rotate(Math.sin(ts * 1.6 + c.ph) * 0.15); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.drawImage(look.goldG, -20, -20, 40, 40); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💰', 0, 0); ctx.textBaseline = 'alphabetic'; ctx.restore(); }
    else { const sx = Math.abs(Math.cos(ts * 3 + c.ph)) * 0.85 + 0.15; ctx.drawImage(look.coin, c.x - 9 * sx, y - 9, 18 * sx, 18); } });
  s.eels.forEach((e) => drawEel(e, ts));
  // 🟢 Fig, swimming: a soft halo, a stream of bubbles, wobbly when jolted
  { const bob = Math.sin(ts * 4) * 1.5, st = F.stun > 0, blink = F.inv > 0 && !st && Math.floor(ts * 10) % 2 === 0;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(look.figG, F.x - 26, F.y - 26, 52, 52); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (s.aim && !s.done) { ctx.strokeStyle = 'rgba(200,240,255,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(s.aim.x, s.aim.y, 9, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    drawPal(ph.mood(), ctx, { x: F.x + (st ? Math.sin(ts * 40) * 2 : 0), y: F.y + bob, s: 10, t: ts, r: ph.S.curve.r, face: F.face, hurt: st, alpha: blink ? 0.5 : 1 });
    if (st) { ctx.fillStyle = '#C9F6FF'; for (let i = 0; i < 3; i++) { const a = ts * 6 + i * 2.1; ctx.beginPath(); ctx.arc(F.x + Math.cos(a) * 14, F.y - 14 + Math.sin(a) * 4, 1.8, 0, 7); ctx.fill(); } }
    if (s.purse) { ctx.font = '900 10px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#041220'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; const tx = `🪙${s.purse}${s.gotKey ? ' 🗝️' : ''}`; ctx.strokeText(tx, F.x, F.y + 24); ctx.fillText(tx, F.x, F.y + 24); }
    else if (s.gotKey) { ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.fillText('🗝️', F.x, F.y + 24); } }
  s.fx.forEach((q) => { ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 1.6));
    if (q.k === 'dot') { ctx.fillStyle = q.c; ctx.fillRect(q.x - 1.2, q.y - 1.2, 2.4, 2.4); }
    else if (q.k === 'bub') { ctx.strokeStyle = 'rgba(220,244,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.stroke(); }
    else { ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#041220'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeText(q.text, q.x, q.y); ctx.fillText(q.text, q.x, q.y); } });
  ctx.globalAlpha = 1;
  if (s.time < 2.6) { const a = Math.min(1, (2.6 - s.time) * 1.5), ty = s.H * 0.5; ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = '#041220'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.strokeText('KEY, THEN THE CHEST', s.W / 2, ty); ctx.fillText('KEY, THEN THE CHEST', s.W / 2, ty); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.fillStyle = '#fff'; const l2 = 'touch where to swim · mind the eels'; ctx.strokeText(l2, s.W / 2, ty + 18); ctx.fillText(l2, s.W / 2, ty + 18); ctx.globalAlpha = 1; }
}
const KEYS = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };
const pocket = {
  key: 'wreck', name: 'The sunken wreck', icon: '🏴‍☠️', goal: 'key, then the chest', dur: DUR, rim: '#7FE3FF', system: 'Lorenz attractor',
  start, update, draw,
  onBeat(ev) { if (!s || s.done) return; if (ev?.peak) s.surge = 1.2; if (ev?.big && s.eels.length < 5) s.eels.push(newEel(s.r, s.eels.length)); },   // a peak up top: the eels surge; a big one wakes another
  pointer(type, p) {
    if (!s || s.done) return;
    if (type === 'down') { s.held = true; s.aim = { x: p.x, y: p.y }; }
    else if (type === 'move') { if (s.held) s.aim = { x: p.x, y: p.y }; }
    else s.held = false;
  },
  keydown(e) { const d = KEYS[e.code]; if (d == null || !s) return; e.preventDefault?.(); s.keys.add(d); s.aim = null; },
  keyup(e) { const d = KEYS[e.code]; if (d == null || !s) return; s.keys.delete(d); },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'wreck', fig: { x: s.fig.x, y: s.fig.y, stun: s.fig.stun, inv: s.fig.inv }, eels: s.eels.map((e) => ({ x: e.hx ?? e.tr[0].x, y: e.hy ?? e.tr[0].y, lx: e.x, lz: e.z, len: e.tr.length })), coins: s.coins.filter((c) => !c.got).map((c) => ({ x: c.x, y: c.y, bag: c.bag })), purse: s.purse, gotKey: s.gotKey, keyAt: { x: s.key.x, y: s.key.y }, chestAt: { ...s.chest }, arm: s.arm.kind, hits: s.hits, pts: s.pts, done: s.done,
    go: (x, y) => { s.aim = { x, y }; s.held = false; }, goKey: () => { s.aim = { x: s.key.x, y: s.key.y }; }, goChest: () => { s.aim = { x: s.chest.x, y: s.chest.y }; }, safe: () => { s.fig.inv = 99; }, shock: () => shock({ x: s.fig.x + 10, y: s.fig.y }),
    win: () => { s.fig.inv = 99; s.key.got = true; s.gotKey = true; s.coins.slice(0, 3).forEach((c) => { if (!c.got) { c.got = true; s.purse += c.bag ? 3 : 1; s.pts += c.v; } }); s.fig.x = s.chest.x; s.fig.y = s.chest.y; return true; }, lose: () => ph.lose(result(false)) }),
};
export default pocket;
