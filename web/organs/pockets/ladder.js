// ⚔️🪜 UNDER THE CARD: War's pocket (a game inside the game, see shell.js "POCKETS").
//
// Deep in a War, the House's face-down pile glows (or, with the pile gone, a face-down card in a war's pot); tap it and
// you slip in under the card. Down there is a ladder of cards on the velvet, a card face up and a deck beside it. Call
// the next card: ⬆️ higher or ⬇️ lower (tap the top or bottom half, swipe, or the arrow keys). A right call climbs Fig a
// rung, a wrong one slides it down two (and the deck makes you wait a moment), a tie just deals again. Reach the top
// before the card closes over you (20 s): two high cards for your hand, four more for your pile and a life back.
//
// Random in its own way: a COLLATZ WALK, the hailstone numbers. Start from a number n; if it's even halve it, if it's odd
// make it 3n + 1; nobody has ever proved it always comes down to 1, but it always has. The deck is that walk: each card
// is the next n, its rank how high n is on this walk's flight (the walk's peak is a golden Ace, 1 is a deuce), its suit
// the step's parity (odd n is red, even is black). So the cards fall in runs, halving and halving, then leap up out of
// nowhere when an odd one comes; a walk that lands on 1 starts a fresh one somewhere new. The trail up top shows the
// hailstones so far, numbers and all: a sharp player starts to feel which way the next one goes.
import { drawPal } from '../../pals.js';

const DUR = 20, SC = 1.35, REVEAL = 0.42, STUN = 0.6, WIN_PAUSE = 0.7, TRAIL = 14;
const GOLD = '#F5C542', TEAL = '#3DD6C6', HOT = '#FF5FB0', LILAC = '#C9B8FF', RED = '#D7263D', INK = '#1B1530';
let ph = null, ctx = null, s = null, bg = null, CW = 58, CH = 82;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const LBL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const label = (r) => LBL[r] || String(r);
// ---------------------------------------------------------------- the hailstones
function walkFrom(n0) {
  const seq = [n0]; let n = n0;
  while (n !== 1 && seq.length < 400) { n = n % 2 ? 3 * n + 1 : n / 2; seq.push(n); }
  const mx = Math.max(...seq); return { seq, mx, lm: Math.log(mx), n0 };
}
function makeWalk() {   // a start with a long enough flight (most are)
  let w = null;
  for (let i = 0; i < 24; i++) { w = walkFrom(7 + Math.floor(s.rand() * 900)); if (w.seq.length >= 16) break; }
  return w;
}
const rankOf = (n, w) => Math.max(2, Math.min(14, 2 + Math.round(12 * Math.log(n) / w.lm)));
const suitOf = (n) => (n % 2 ? (n % 4 === 1 ? 1 : 2) : ((n / 2) % 2 ? 3 : 0));   // odd: ♥ ♦ (red), even: ♠ ♣ (black)
const card = (n, w, brk = false) => ({ n, r: rankOf(n, w), s: suitOf(n), gold: n === w.mx && n > 4, brk, x: 0, y: 0, a: 0, sc: 1, f: 1, lift: 0, mv: null, fl: null });
const peekN = () => (s.i + 1 < s.walk.seq.length ? s.walk.seq[s.i + 1] : s.after.seq[0]);
function nextCard() {
  s.i += 1; let brk = false;
  if (s.i >= s.walk.seq.length) { s.walk = s.after; s.after = makeWalk(); s.i = 0; brk = true; s.walks += 1; }
  return card(s.walk.seq[s.i], s.walk, brk);
}
// ---------------------------------------------------------------- where things sit (world units, from the pocket's W × H)
function lay() {
  const W = ph.W, H = ph.H, lx = 58, yTop = H * 0.22, yBot = H * 0.86, cx = 118 + (W - 118) / 2, cy = H * 0.53;
  const cw = CW * SC, ch = CH * SC, bw = Math.min(176, W - 150), bh = 54;
  return { W, H, lx, yTop, yBot, cx, cy, cw, ch, deck: { x: Math.min(W - 34, cx + cw / 2 + 52), y: cy - 6 },
    hi: { x: cx, y: cy - ch / 2 - 62, w: bw, h: bh }, lo: { x: cx, y: cy + ch / 2 + 62, w: bw, h: bh },
    tr: { x0: 108, x1: W - 18, y0: H * 0.155, y1: H * 0.155 + Math.max(66, H * 0.115) } };
}
const rungY = (L, i) => L.yBot - i * (L.yBot - L.yTop) / s.top;
// ---------------------------------------------------------------- cards that move and flip (War's own easing)
const easeOut = (e) => 1 - Math.pow(1 - e, 3);
const easeIO = (e) => e * e * (3 - 2 * e);
function to(c, x, y, d, { sc = 1, delay = 0, lift = 10, a = 0 } = {}) { c.mv = { fx: c.x, fy: c.y, fs: c.sc, fa: c.a, x, y, sc, a, t: -delay, d, lift }; }
function flip(c, f, d, delay = 0) { c.fl = { from: c.f, to: f, t: -delay, d }; }
function stepCard(c, dt) {
  const m = c.mv; if (m) { m.t += dt; if (m.t >= 0) { const e = Math.min(1, m.t / m.d), k = easeOut(e); c.x = m.fx + (m.x - m.fx) * k; c.y = m.fy + (m.y - m.fy) * k; c.sc = m.fs + (m.sc - m.fs) * k; c.a = m.fa + (m.a - m.fa) * k; c.lift = m.lift * Math.sin(e * Math.PI); if (e >= 1) { c.mv = null; c.lift = 0; } } }
  const f = c.fl; if (f) { f.t += dt; if (f.t >= 0) { const e = Math.min(1, f.t / f.d); c.f = f.from + (f.to - f.from) * easeIO(e); if (e >= 1) c.fl = null; } }
}
// ---------------------------------------------------------------- the call
function call(dir) {
  if (!s || s.done) return false;
  if (s.phase !== 'idle') { s.queued = dir; return false; }
  const L = lay(), c = nextCard();
  c.x = L.deck.x; c.y = L.deck.y; c.f = 0; c.sc = 0.62; c.a = 0.05;
  to(c, L.cx, L.cy, 0.24, { lift: 16 }); flip(c, 1, 0.18, 0.14);
  s.nxt = c; s.call = dir; s.phase = 'reveal'; s.t = 0; s.calls += 1; s.press[dir > 0 ? 'hi' : 'lo'] = 1;
  ph.sfx('clack'); return true;
}
function judge() {
  const L = lay(), c = s.nxt, prev = s.cur, cmp = Math.sign(c.r - prev.r), dir = s.call;
  s.under.push(prev); if (s.under.length > 2) s.under.shift();
  s.under.forEach((u, k) => { to(u, L.cx - 5 + k * 3, L.cy + 4 - k * 2, 0.2, { a: (k ? -0.07 : 0.06), lift: 0 }); });
  s.cur = c; s.nxt = null; s.trail.push({ n: c.n, r: c.r, s: c.s, brk: c.brk }); if (s.trail.length > 40) s.trail.shift();
  if (cmp === 0) { s.ties += 1; s.phase = 'idle'; text(L.cx, L.cy - L.ch / 2 - 14, 'SAME · CALL AGAIN', LILAC); ph.sfx('click'); return; }
  if (cmp === dir) {
    s.right += 1; s.rung = Math.min(s.top, s.rung + 1); s.hop = 1; s.phase = 'idle';
    const y = rungY(L, s.rung), gain = 30 + 10 * s.rung; s.pts += gain;
    sparks(L.lx, y, s.rung >= s.top ? GOLD : TEAL, 12, 120); text(L.cx, L.cy - L.ch / 2 - 14, `${dir > 0 ? 'HIGHER' : 'LOWER'} · +${gain}`, '#FFE08A');
    if (c.gold) { s.pts += 150; s.golds += 1; sparks(L.cx, L.cy, GOLD, 26, 200); text(L.cx, L.cy + 8, 'THE PEAK · +150', GOLD, true); ph.sfx('chime'); } else ph.sfx('pop');
    ph.cue?.('score', L.lx, y);
    if (s.rung >= s.top) { s.done = true; s.winT = WIN_PAUSE; ph.sfx('fanfare'); sparks(L.lx, rungY(L, s.top), GOLD, 40, 220); text(L.cx, L.cy, 'TOP OF THE LADDER', GOLD, true); }
    return;
  }
  s.wrong += 1; const from = s.rung; s.rung = Math.max(0, s.rung - 2); s.phase = 'stun'; s.t = 0; s.hurtT = 0.8; s.shake = 6;
  text(L.cx, L.cy - L.ch / 2 - 14, from ? `WRONG WAY · DOWN ${from - s.rung}` : 'WRONG WAY', '#FF9A8A'); ph.sfx('plunk'); navigator.vibrate?.(40);
  for (let i = 0; i < 10; i++) s.sp.push({ x: L.lx + (Math.random() - 0.5) * 30, y: rungY(L, s.rung), vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 50, c: i % 2 ? '#8A7AC0' : '#FFB0A0', life: 0.5, r: 1.4 });
}
function result(won) {
  if (!won) return { pts: s.pts, why: s.rung ? `rung ${s.rung} of ${s.top}: so close` : 'the deck won this time' };
  const left = Math.round(ph.left?.() || 0);
  return { pts: s.pts + 250 + left * 15, label: 'TOP OF THE LADDER · 2 HIGH CARDS', sub: `two high cards for your hand, +4 to your pile, a life back · ${left} s to spare`, gift: { high: 2, cards: 4, heal: 1 } };
}
// ---------------------------------------------------------------- fx
function sparks(x, y, c, n, v) { for (let i = 0; i < n && s.sp.length < 140; i++) { const a = Math.random() * 6.28, sp = v * (0.3 + Math.random() * 0.7); s.sp.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, c, life: 0.5 + Math.random() * 0.4, r: 1.2 + Math.random() * 1.6 }); } }
function text(x, y, t, col = '#FFE08A', big = false) { s.fx.forEach((f) => { f.life = Math.min(f.life, 0.2); }); s.fx.push({ x, y, text: t, col, big, life: big ? 1.3 : 1 }); if (s.fx.length > 6) s.fx.shift(); }
// ---------------------------------------------------------------- update
function update(dt) {
  if (!s) return;
  s.time += dt; s.shake *= Math.exp(-dt * 8); if (s.hurtT > 0) s.hurtT -= dt; if (s.hop > 0) s.hop = Math.max(0, s.hop - dt * 3.2); s.pulse = Math.max(0, s.pulse - dt * 1.5);
  s.press.hi = Math.max(0, s.press.hi - dt * 4); s.press.lo = Math.max(0, s.press.lo - dt * 4);
  s.fy += (s.rung - s.fy) * Math.min(1, dt * (s.fy > s.rung ? 5 : 11));
  stepCard(s.cur, dt); if (s.nxt) stepCard(s.nxt, dt); s.under.forEach((u) => stepCard(u, dt));
  if (s.phase === 'reveal') { s.t += dt; if (s.t >= REVEAL) judge(); }
  else if (s.phase === 'stun') { s.t += dt; if (s.t >= STUN) s.phase = 'idle'; }
  if (s.phase === 'idle' && s.queued && !s.done) { const q = s.queued; s.queued = 0; call(q); }
  if (s.winT > 0) { s.winT -= dt; if (s.winT <= 0) ph.win(result(true)); }
  s.fx.forEach((f) => { f.life -= dt; f.y -= 8 * dt; }); s.fx = s.fx.filter((f) => f.life > 0);
  s.sp.forEach((p) => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 240 * dt; }); s.sp = s.sp.filter((p) => p.life > 0);
}
// ---------------------------------------------------------------- the look: War's velvet and War's own cards, the ladder painted once
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, r)); };
function build() {
  const cv = ph.cv, k = ph.k, L = lay(), A = s.art, c = mk(cv.width, cv.height), x = c.getContext('2d'), W = L.W, H = L.H;
  x.fillStyle = '#0B0720'; x.fillRect(0, 0, c.width, c.height);
  x.setTransform(k, 0, 0, k, ph.ox || 0, ph.oy || 0);
  { const g = x.createRadialGradient(L.cx, L.cy, 20, L.cx, L.cy, Math.max(W, H) * 0.8); g.addColorStop(0, '#3A2B7A'); g.addColorStop(0.45, '#1E1546'); g.addColorStop(1, '#090617'); x.fillStyle = g; x.fillRect(-60, -60, W + 120, H + 120); }
  let felt = A?.felt; if (!felt) { felt = mk(96, 96); const f = felt.getContext('2d'); for (let i = 0; i < 700; i++) { f.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)'; f.fillRect(Math.random() * 96, Math.random() * 96, 1, 1); } }
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = x.createPattern(felt, 'repeat'); x.fillRect(0, 0, c.width, c.height); x.restore();
  if (A?.suit) { x.fillStyle = 'rgba(255,255,255,0.03)'; [[0.82, 0.86, 1], [0.86, 0.3, 0]].forEach(([fx, fy, su]) => A.suit(x, su, W * fx, H * fy, 60)); }
  x.strokeStyle = 'rgba(245,197,66,0.32)'; x.lineWidth = 2; rr(x, 8, 8, W - 16, H - 16, 22); x.stroke(); x.strokeStyle = 'rgba(245,197,66,0.13)'; x.lineWidth = 1; rr(x, 14, 14, W - 28, H - 28, 18); x.stroke();
  // the trail's panel: where the hailstones fall
  { const T = L.tr; x.fillStyle = 'rgba(8,5,20,0.55)'; rr(x, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 10); x.fill(); x.strokeStyle = 'rgba(245,197,66,0.22)'; x.lineWidth = 1; x.stroke();
    x.fillStyle = 'rgba(255,224,138,0.45)'; x.font = '800 9px Sora, system-ui, sans-serif'; x.textAlign = 'left'; x.fillText('THE TRAIL · even n → n/2 · odd n → 3n+1', T.x0 + 9, T.y1 - 7); }
  // the ladder: two gilt rails and a rung of face-down cards at every step, the floor and a crown at the top
  { const lx = L.lx, rw = 24;
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(lx + 4, L.yBot + 10, 46, 9, 0, 0, 7); x.fill();
    [-1, 1].forEach((sd) => { const X = lx + sd * rw; x.strokeStyle = '#3A2610'; x.lineWidth = 7; x.beginPath(); x.moveTo(X, L.yBot + 8); x.lineTo(X, L.yTop - 14); x.stroke(); x.strokeStyle = '#B8862E'; x.lineWidth = 4; x.stroke(); x.strokeStyle = 'rgba(255,240,190,0.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X - 1, L.yBot + 8); x.lineTo(X - 1, L.yTop - 14); x.stroke(); });
    for (let i = 1; i <= s.top; i++) { const y = rungY(L, i); x.fillStyle = 'rgba(0,0,0,0.4)'; rr(x, lx - rw - 4 + 2, y - 6 + 3, rw * 2 + 8, 12, 3); x.fill();
      x.fillStyle = '#2B1F5E'; rr(x, lx - rw - 4, y - 6, rw * 2 + 8, 12, 3); x.fill(); x.strokeStyle = '#0A0716'; x.lineWidth = 1; x.stroke();
      x.strokeStyle = 'rgba(245,197,66,0.75)'; rr(x, lx - rw - 1.5, y - 3.5, rw * 2 + 3, 7, 2); x.stroke(); x.fillStyle = GOLD; x.beginPath(); x.arc(lx, y, 1.6, 0, 7); x.fill(); }
    x.font = '22px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('👑', lx, L.yTop - 30); x.textBaseline = 'alphabetic'; }
  // the deck the walk deals from, face down
  if (A?.back) { const d = L.deck, w = CW * SC * 0.62, h = CH * SC * 0.62; if (A.shadow) { const P = A.shP * SC * 0.62; x.drawImage(A.shadow, d.x - w / 2 - P + 2, d.y - h / 2 - P + 4, w + 2 * P, h + 2 * P); } for (let i = 0; i < 7; i++) x.drawImage(A.back, d.x - w / 2, d.y - h / 2 - i * 1.2, w, h); }
  // a lamp over the cards
  { const g = x.createRadialGradient(L.cx, L.cy, 10, L.cx, L.cy, L.ch * 1.3); g.addColorStop(0, 'rgba(255,230,170,0.10)'); g.addColorStop(1, 'rgba(255,230,170,0)'); x.fillStyle = g; x.fillRect(L.cx - L.ch * 1.3, L.cy - L.ch * 1.3, L.ch * 2.6, L.ch * 2.6); }
  bg = { c, w: cv.width, h: cv.height, k, W, H, ox: ph.ox, oy: ph.oy };
}
function drawCard(c, t) {
  const A = s.art, fr = c.f >= 0.5, sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * c.f))), lift = c.lift || 0, sc = SC * c.sc * (1 + lift * 0.006);
  ctx.save(); ctx.translate(c.x, c.y - lift * 0.4); ctx.rotate(c.a || 0);
  if (A?.shadow) { const P = A.shP; ctx.save(); ctx.translate(2 + lift * 0.45, 3 + lift * 0.75); ctx.scale(sc * sx, sc); ctx.globalAlpha = 0.85; ctx.drawImage(A.shadow, -CW / 2 - P, -CH / 2 - P, CW + 2 * P, CH + 2 * P); ctx.restore(); }
  ctx.scale(sc * sx, sc);
  if (fr && c.gold && A?.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 + 0.2 * Math.sin(t / 220); ctx.drawImage(A.glow, -CW * 0.95, -CH * 0.8, CW * 1.9, CH * 1.6); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  if (A?.sprite) ctx.drawImage(A.sprite(c), -CW / 2, -CH / 2, CW, CH);
  else { ctx.fillStyle = fr ? '#FFFDF6' : '#2B1F5E'; rr(ctx, -CW / 2, -CH / 2, CW, CH, 6); ctx.fill(); ctx.strokeStyle = fr ? '#0003' : GOLD; ctx.lineWidth = 1; ctx.stroke();
    if (fr) { ctx.fillStyle = c.s === 1 || c.s === 2 ? RED : INK; ctx.font = '700 24px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label(c.r), 0, 0); ctx.textBaseline = 'alphabetic'; } }
  ctx.restore();
}
function drawButton(b, txt, col, on, t) {
  const lit = Math.max(on, 0), dim = s.phase === 'idle' && !s.done ? 1 : 0.55;
  ctx.globalAlpha = dim; ctx.fillStyle = 'rgba(8,5,20,0.78)'; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.h / 2); ctx.fill();
  if (lit > 0) { ctx.globalAlpha = dim * lit * 0.6; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = dim; }
  ctx.strokeStyle = col; ctx.lineWidth = 2; rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.h / 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '900 17px Sora, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, b.x, b.y + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}
function drawTrail(L, t) {   // the hailstones so far, rank against step, each with its number; a ? where the next one falls
  const T = L.tr, pts = s.trail.slice(-TRAIL), n = pts.length, top = T.y0 + 20, bot = T.y1 - 20, step = (T.x1 - T.x0 - 40) / Math.max(1, TRAIL - 1);
  const X = (i) => T.x0 + 14 + i * step, Y = (r) => bot - (r - 2) / 12 * (bot - top);
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(245,197,66,0.4)'; ctx.beginPath();
  pts.forEach((p, i) => { if (i && !p.brk) ctx.lineTo(X(i), Y(p.r)); else ctx.moveTo(X(i), Y(p.r)); }); ctx.stroke();
  ctx.textAlign = 'center';
  pts.forEach((p, i) => { const last = i === n - 1, x = X(i), y = Y(p.r); if (p.brk && i) { ctx.strokeStyle = 'rgba(201,184,255,0.35)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x - step / 2, top - 6); ctx.lineTo(x - step / 2, bot + 4); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = p.s === 1 || p.s === 2 ? '#FF7A8A' : '#E8E2FF'; ctx.globalAlpha = last ? 1 : 0.35 + 0.6 * (i / n); ctx.beginPath(); ctx.arc(x, y, last ? 3.4 : 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = last ? '#FFE08A' : 'rgba(255,224,138,0.75)'; ctx.font = last ? '900 12px Sora, system-ui, sans-serif' : '700 8.5px Sora, system-ui, sans-serif'; ctx.fillText(String(p.n), x, y - (last ? 8 : 6)); });
  ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t / 240) + s.pulse * 0.3; ctx.fillStyle = '#FFE08A'; ctx.font = '900 13px Sora, system-ui, sans-serif'; ctx.fillText('?', Math.min(T.x1 - 10, X(n)), (top + bot) / 2 + 4); ctx.globalAlpha = 1;
}
function draw(t) {
  if (!s) return;
  const cv = ph.cv, k = ph.k, ts = t / 1000;
  if (!bg || bg.w !== cv.width || bg.h !== cv.height || bg.k !== k || bg.W !== ph.W || bg.H !== ph.H || bg.ox !== ph.ox || bg.oy !== ph.oy) build();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg.c, 0, 0);
  ctx.setTransform(k, 0, 0, k, ph.ox || 0, ph.oy || 0);
  if (s.shake > 0.3 && !ph.reduceMotion) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  const L = lay();
  // the rungs you've climbed turn face up, gold at the top
  for (let i = 1; i <= Math.min(s.top, Math.round(s.fy)); i++) { const y = rungY(L, i), gold = i === s.top; ctx.fillStyle = gold ? '#FFE9A0' : '#FFFDF6'; rr(ctx, L.lx - 28, y - 6, 56, 12, 3); ctx.fill(); ctx.strokeStyle = gold ? '#8A6A12' : 'rgba(40,20,60,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    if (s.art?.suit) { ctx.fillStyle = i % 2 ? RED : INK; s.art.suit(ctx, i % 4, L.lx, y, 8); } }
  { ctx.font = '900 10px Sora, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,224,138,0.85)'; ctx.fillText(`${s.rung}/${s.top}`, L.lx, L.yBot + 26); }
  // 🟢 Fig on its rung
  { const y = rungY(L, s.fy) - 13 - Math.sin(s.hop * Math.PI) * 9, sway = s.hurtT > 0 ? Math.sin(s.time * 40) * 3 : 0;
    drawPal(ph.mood(), ctx, { x: L.lx + sway, y, s: 12, t: ts, r: ph.S.curve.r, face: 1, hurt: s.hurtT > 0 }); }
  drawTrail(L, t);
  drawButton(L.hi, '⬆️ HIGHER', TEAL, s.press.hi, t); drawButton(L.lo, '⬇️ LOWER', HOT, s.press.lo, t);
  s.under.forEach((u) => drawCard(u, t)); drawCard(s.cur, t); if (s.nxt) drawCard(s.nxt, t);
  ctx.globalCompositeOperation = 'lighter'; s.sp.forEach((p) => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  s.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.font = f.big ? '400 19px Bungee, Impact, sans-serif' : '900 13px Sora, system-ui, sans-serif'; ctx.strokeStyle = '#0A0716'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y); });
  ctx.globalAlpha = 1;
  if (s.time < 2.4) { const a = Math.min(1, (2.4 - s.time) * 1.5), T = L.tr, y = (T.y0 + T.y1) / 2; ctx.globalAlpha = a; ctx.fillStyle = 'rgba(8,5,20,0.85)'; rr(ctx, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 10); ctx.fill();
    ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.font = '400 19px Bungee, Impact, sans-serif'; ctx.strokeStyle = '#0A0716'; ctx.lineWidth = 5; ctx.fillStyle = '#FFE08A'; const mx = (T.x0 + T.x1) / 2; ctx.strokeText('HIGHER OR LOWER?', mx, y); ctx.fillText('HIGHER OR LOWER?', mx, y);
    ctx.font = '800 11px Sora, system-ui, sans-serif'; ctx.lineWidth = 3; ctx.fillStyle = '#fff'; ctx.strokeText('climb to the top · read the trail', mx, y + 17); ctx.fillText('climb to the top · read the trail', mx, y + 17); ctx.globalAlpha = 1; }
}
// ---------------------------------------------------------------- the pocket
function start(h, seed = {}) {
  ph = h; ctx = h.ctx; bg = null;
  const A = seed.art || null; if (A?.CW) { CW = A.CW; CH = A.CH; }
  const stg = Math.max(1, Math.min(4, seed.stage || 1));
  s = { art: A, rand: rng(seed.seed || Math.floor(Math.random() * 1e9)), top: [8, 9, 10, 10][stg - 1], rung: 0, fy: 0, hop: 0, hurtT: 0, shake: 0, pulse: 0, phase: 'idle', t: 0, call: 0, queued: 0, done: false, winT: 0,
    cur: null, nxt: null, under: [], trail: [], fx: [], sp: [], press: { hi: 0, lo: 0 }, pts: 0, right: 0, wrong: 0, ties: 0, golds: 0, calls: 0, walks: 1, time: 0, i: 0, walk: null, after: null, down: null };
  s.walk = makeWalk(); s.after = makeWalk(); s.i = Math.floor(s.rand() * 3);
  const L = lay(); s.cur = card(s.walk.seq[s.i], s.walk); s.cur.x = L.cx; s.cur.y = L.cy; s.cur.f = 0; flip(s.cur, 1, 0.3, 0.35);
  s.trail.push({ n: s.cur.n, r: s.cur.r, s: s.cur.s, brk: false });
}
const KEYS = { ArrowUp: 1, KeyW: 1, ArrowDown: -1, KeyS: -1 };
const pocket = {
  key: 'ladder', name: 'Under the card', icon: '🪜', goal: 'higher or lower: climb to the top', dur: DUR, rim: GOLD, system: 'Collatz walk',
  start, update, draw,
  onBeat() { if (s) s.pulse = 1; },   // the curve up top only makes the next hailstone's ? blink: down here the walk deals
  pointer(type, p) {   // the top half (or a swipe up) says higher, the bottom half (or a swipe down) lower
    if (!s || s.done) return;
    if (type === 'down') s.down = { x: p.x, y: p.y };
    else if (type === 'up' && s.down) { const d = s.down; s.down = null; const dy = p.y - d.y, L = lay(); call(Math.abs(dy) > 24 ? (dy < 0 ? 1 : -1) : (d.y < L.cy ? 1 : -1)); }
  },
  keydown(e) { const d = KEYS[e.code]; if (!d || !s || s.done) return; e.preventDefault?.(); call(d); },
  timeUp: () => (s ? result(false) : null),
  debug: () => s && ({ key: 'ladder', rung: s.rung, top: s.top, step: s.phase, cur: { n: s.cur.n, r: s.cur.r, s: s.cur.s, gold: s.cur.gold }, nextN: peekN(), trail: s.trail.map((p) => p.n), right: s.right, wrong: s.wrong, ties: s.ties, calls: s.calls, golds: s.golds, walks: s.walks, walkStart: s.walk.n0, pts: s.pts, done: s.done, art: !!s.art?.sprite,
    btn: (() => { const L = lay(); return { hi: { x: L.hi.x, y: L.hi.y }, lo: { x: L.lo.x, y: L.lo.y }, cy: L.cy }; })(),
    nextDir: (() => { const n = peekN(), w = s.i + 1 < s.walk.seq.length ? s.walk : s.after; return Math.sign(rankOf(n, w) - s.cur.r); })(),
    call, right: () => { const n = peekN(), w = s.i + 1 < s.walk.seq.length ? s.walk : s.after, d = Math.sign(rankOf(n, w) - s.cur.r); return call(d || 1) && d; },
    wrongCall: () => { const n = peekN(), w = s.i + 1 < s.walk.seq.length ? s.walk : s.after, d = Math.sign(rankOf(n, w) - s.cur.r); return d ? call(-d) && -d : 0; },
    win: () => { s.rung = s.top - 1; s.phase = 'idle'; s.nxt = null; const n = peekN(), w = s.i + 1 < s.walk.seq.length ? s.walk : s.after; let d = Math.sign(rankOf(n, w) - s.cur.r); if (!d) { s.rung = s.top; s.done = true; s.winT = 0.05; return true; } return call(d); },
    lose: () => ph.lose(result(false)) }),
};
export default pocket;
