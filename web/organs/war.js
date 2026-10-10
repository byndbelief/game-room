// ⚔️ War, an organ of the shell: the card game's DNA with a verb. The House deals its cards face up into the
// lanes across the battle line, one at a time; you hold a hand of face-up cards (3, then 4, then 5) and tap one to
// throw it at the card that's been waiting longest, or drag it onto a lane. Higher wins: both cards sweep to your
// pile (× the Fibonacci combo). Lower: both go to the House. Equal is WAR!: three cards slap down face down from each
// side, the House flips a fourth, and you pick your fourth from your hand; the winner takes the whole pot. Every
// card in the lanes burns a fuse: let it run out and the House takes it and one of yours (a life). Run out of cards
// and it's a life too, and a fresh few from the deck. Empty the House's pile and the round is yours: a heal, and a
// tougher deck. The box's beats: a peak is a burst of fast deals, the window deals in threes (three of a rank), the
// mirror turns the House's high cards into their low mirror (16 − r), the balance fills your hand and resets the
// fuses, gift is a free high card, the golden cut deals a golden card (beat it for 618), gold is a golden Ace in your
// hand, fib makes the next win pay double. Twists: 🔄 reverse (low wins), 🃏 a joker in your hand, ⚔️ double war
// (ties everywhere, wars pay double), 🌪️ shuffle (every card on the table changes).
// 🕳️ Its pocket (deep enough, the House's face-down pile glows: tap it): UNDER THE CARD (pockets/ladder.js), higher or
// lower up a ladder of cards dealt by a Collatz walk; the top brings up two high cards, four more for your pile and a life.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';
import ladderPocket from './pockets/ladder.js';

let W = 400;
const CW = 58, CH = 82;   // a card, in world units
const ROUNDS = ['THE PAGES', 'THE KNIGHTS', 'THE JACKS', "THE QUEENS' GUARD", "THE KINGS' COURT", 'THE ACES HIGH', 'THE HOUSE ITSELF'];
const TWISTS = [
  ['🔄 REVERSE', 'low cards win for a while', 'reverse'],
  ['🃏 JOKER', 'a wild card in your hand: it beats anything', 'joker'],
  ['⚔️ DOUBLE WAR', 'ties everywhere, and wars pay double', 'double'],
  ['🌪️ SHUFFLE', 'every card on the table changes', 'shuffle'],
];
const RED = '#D7263D', INK = '#1B1530', GOLD = '#F5C542', TEAL = '#3DD6C6', HOT = '#FF5FB0', LILAC = '#C9B8FF';
const LBL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const label = (r) => LBL[r] || String(r);
let host, ctx, S, sfx, g = null, wonN = 0, warsN = 0, warsWonN = 0, lostN = 0, bestPot = 0;
const H = () => host.H;
const st = () => Math.max(1, Math.min(4, host.stage?.() || 1));
// 🎚️ a gentle start: one lane, three cards, a long fuse; then more lanes, more cards, shorter fuses, more face cards
const LANES = () => [1, 2, 3, 3][st() - 1];
const HAND = () => [3, 4, 5, 5][st() - 1];
const TMAX = () => [7.5, 5.8, 4.6, 3.8][st() - 1];
const WAIT = () => [1.3, 0.95, 0.7, 0.5][st() - 1];
const foeSkew = () => Math.max(0.55, 1.6 - 0.15 * ((g?.round || 1) - 1) - 0.15 * (st() - 1));   // u^p: p > 1 deals low, p < 1 high
const laneY = () => H() * 0.5;
const laneX = (i) => W * (i + 1) / ((g?.lanes.length || 1) + 1);
const foeP = () => ({ x: W / 2, y: H() * 0.17 + 20 });
const mineP = () => ({ x: 40, y: laneY() + 46 });
const handY = () => H() - 64;
const midY = () => (foeP().y + 75 + laneY() - 87) / 2;   // the gap between the House's label and the lanes: where the table's notes go
function slot(i, n) {
  const sp = Math.min(CW + 10, (W - 110) / Math.max(1, n)), d = i - (n - 1) / 2;
  return { x: W / 2 + d * sp, y: handY() + d * d * 2.2, a: d * 0.07 };
}
function deck(n, p) { return Array.from({ length: n }, () => ({ r: 2 + Math.min(12, Math.floor(13 * Math.pow(Math.random(), p))), s: Math.floor(Math.random() * 4) })); }
const newLane = (wait) => ({ card: null, mine: null, pot: [], state: 'empty', t: 0, tmax: 1, wait, warN: 0, step: 0, double: false, winner: null });
function newGame() {
  g = { round: 1, foe: [], mine: deck(18, 0.85), hand: [], lanes: [], fly: [], fx: [], sp: [], shake: 0, time: 0, twist: null, burst: 0, threes: null, faceNext: false, goldenNext: false, fibNext: false, hurtT: 0, outT: 0, drag: null, refillT: 0.5, foeIn: 1, glitch: false, glitchPal: null };
  g.foe = deck(10, foeSkew()); wonN = 0; warsN = 0; warsWonN = 0; lostN = 0; bestPot = 0;
}
// ---------------------------------------------------------------- cards: a position that tweens, a face that flips
const easeOut = (e) => 1 - Math.pow(1 - e, 3);
const easeBack = (e) => { const c = 1.7; return 1 + (c + 1) * Math.pow(e - 1, 3) + c * Math.pow(e - 1, 2); };
const easeIO = (e) => e * e * (3 - 2 * e);
const mk = (c, x, y, f = 0) => ({ r: c.r, s: c.s, gold: !!c.gold, joker: !!c.joker, x, y, a: 0, sc: 1, f, mv: null, fl: null, glow: 0, lift: 0, jx: (Math.random() - 0.5) * 8, ja: (Math.random() - 0.5) * 0.24 });
const raw = (c) => ({ r: c.r, s: c.s });
function to(c, x, y, d = 0.35, { a = 0, sc = 1, delay = 0, back = false, lift = 6 } = {}) { c.mv = { fx: c.x, fy: c.y, fa: c.a, fs: c.sc, x, y, a, sc, t: -delay, d, back, lift }; }
function flip(c, f, d = 0.28, delay = 0, then = null) { c.fl = { from: c.f, to: f, t: -delay, d, then }; }
function spin(c, r, delay = 0) { flip(c, 0.5, 0.16, delay, { r }); }   // edge-on, a new face, back: a card that changes in your hand
function stepCard(c, dt) {
  const m = c.mv; if (m) { m.t += dt; if (m.t >= 0) { const e = Math.min(1, m.t / m.d), k = m.back ? easeBack(e) : easeOut(e); c.x = m.fx + (m.x - m.fx) * k; c.y = m.fy + (m.y - m.fy) * k; c.a = m.fa + (m.a - m.fa) * k; c.sc = m.fs + (m.sc - m.fs) * k; c.lift = m.lift * Math.sin(e * Math.PI); if (e >= 1) { c.mv = null; c.lift = 0; } } }
  const f = c.fl; if (f) { f.t += dt; if (f.t >= 0) { const e = Math.min(1, f.t / f.d); c.f = f.from + (f.to - f.from) * easeIO(e); if (e >= 1) { c.fl = null; if (f.then) { if (f.then.r != null) { c.r = f.then.r; c.joker = false; } flip(c, 1, 0.16); } } } }
  if (c.glow > 0) c.glow = Math.max(0, c.glow - dt * 1.2);
  return !c.mv && !c.fl;
}
const ease = (c, x, y, a, dt, k = 10) => { if (c.mv) return; const e = Math.min(1, dt * k); c.x += (x - c.x) * e; c.y += (y - c.y) * e; c.a += (a - c.a) * e; c.sc += (1 - c.sc) * e; };
// ---------------------------------------------------------------- the House deals, you answer
function ensureLanes() { const n = LANES(); while (g.lanes.length < n) g.lanes.push(newLane(0.8 + g.lanes.length * 0.6)); }
function deal(lane, li) {
  const c0 = g.foe.shift(); if (!c0) return;
  if (g.threes?.n > 0) { c0.r = g.threes.r; g.threes.n -= 1; if (!g.threes.n) g.threes = null; }
  else if (g.twist?.kind === 'double' && g.hand.length && Math.random() < 0.6) { const hs = g.hand.filter((c) => !c.joker); if (hs.length) c0.r = hs[Math.floor(Math.random() * hs.length)].r; }
  else if (g.faceNext) { c0.r = 11 + Math.floor(Math.random() * 4); g.faceNext = false; }
  if (g.goldenNext) { c0.gold = true; g.goldenNext = false; }
  const p = foeP(), c = mk(c0, p.x, p.y - Math.min(10, g.foe.length) * 1.2, 0);
  to(c, laneX(li), laneY() - 46, 0.42, { back: true, lift: 18, a: 0 }); flip(c, 1, 0.24, 0.26);
  lane.card = c; lane.state = 'deal'; lane.tmax = (lane.warN ? TMAX() + 1.5 : TMAX()) * (g.burst > 0 ? 0.7 : 1) + (g.twist?.kind === 'reverse' ? 0.6 : 0);
  if (g.burst > 0) g.burst -= 1;
  sfx('click');
}
const ready = (l) => l && (l.state === 'face' || l.state === 'warpick');
function urgent() { let best = -1, bt = 1e9; g.lanes.forEach((l, i) => { if (ready(l) && l.t < bt) { bt = l.t; best = i; } }); return best; }
function nearestLane(x) { let best = -1, bd = 1e9; g.lanes.forEach((l, i) => { const d = Math.abs(laneX(i) - x); if (d < bd) { bd = d; best = i; } }); return best; }
function play(i, li) {
  const lane = g.lanes[li], c = g.hand[i]; if (!c || !ready(lane)) return false;
  g.hand.splice(i, 1); c.glow = 0; to(c, laneX(li), laneY() + 46, 0.2, { lift: 16 }); if (c.f < 1) flip(c, 1, 0.14);
  lane.mine = c; lane.state = 'clash'; lane.t = 0.22; g.refillT = Math.max(g.refillT, 0.3); sfx('clack');
  return true;
}
function resolve(lane, li) {
  const e = lane.card, m = lane.mine, rev = g.twist?.kind === 'reverse';
  const cmp = m.joker ? 1 : e.joker ? -1 : rev ? Math.sign(e.r - m.r) : Math.sign(m.r - e.r);
  const x = laneX(li), y = laneY();
  g.shake = Math.max(g.shake, 3); sparks(x, y, '#FFE08A', 10, 120); sfx('thud');
  if (cmp === 0) return startWar(lane, li);
  lane.winner = cmp > 0 ? 'me' : 'foe'; (cmp > 0 ? m : e).glow = 1; lane.state = 'show'; lane.t = 0.4;
  if (cmp > 0) winLane(lane, li, e, m);
  else { S.combo = 0; lostN += 1; text(x, y - 4, rev ? 'LOW WINS · LOST' : 'LOST', '#FF9A8A'); sfx('plunk'); host.cue?.('near', x, y); }
}
function winLane(lane, li, e, m) {
  const x = laneX(li), y = laneY(), pot = lane.pot.length; wonN += 1;
  S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 3.5;
  let pts;
  if (lane.warN) { pts = 40 * (pot + 2) * fibMult(S.combo) * (lane.double ? 2 : 1); warsWonN += 1; bestPot = Math.max(bestPot, pot + 2); host.cue?.('kill', x, y); sfx('cheer'); slam(x, y - 10, 'WAR WON'); sparks(x, y, GOLD, 40, 260); g.shake = Math.max(g.shake, 7); }
  else { pts = (10 + 4 * (e?.r || 10)) * fibMult(S.combo); host.cue?.('score', x, y); sfx('pop'); sparks(x, y, TEAL, 14, 160); }
  if (m?.joker) pts *= 3;
  if (m?.gold) pts *= 2;
  if (e?.gold) { pts += 618; sparks(x, y, GOLD, 30, 220); sfx('chime'); }
  if (g.fibNext) { pts *= 2; g.fibNext = false; }
  host.add(pts); text(x, y - 4, `${e?.gold ? 'GOLDEN ' : ''}+${pts}`, e?.gold ? GOLD : '#FFE08A', !!lane.warN);
}
function startWar(lane, li) {
  warsN += 1; lane.warN += 1; lane.double = lane.double || g.twist?.kind === 'double';
  lane.pot.push({ c: lane.card, side: 'foe' }, { c: lane.mine, side: 'me' }); lane.card = lane.mine = null;
  slam(laneX(li), laneY(), lane.warN > 1 ? `WAR ×${lane.warN}!` : 'WAR!'); g.shake = 10; sparks(laneX(li), laneY(), '#FF5A4A', 30, 240);
  sfx('boom', { size: 0.7 }); sfx('drumroll', { dur: 0.8, delay: 0.1 }); navigator.vibrate?.(60);
  host.banner(lane.double ? '⚔️ DOUBLE WAR!' : '⚔️ WAR!', 'three down, the fourth decides');
  lane.state = 'war'; lane.step = 0; lane.t = 0.4;
}
function warStep(lane, li) {
  if (lane.step < 3) {
    const f0 = g.foe.shift(), m0 = g.mine.shift(), x = laneX(li), y = laneY();
    if (f0) { const p = foeP(), c = mk(f0, p.x, p.y, 0); lane.pot.push({ c, side: 'foe' }); const q = potPos(lane, li, lane.pot.length - 1); to(c, q.x, q.y, 0.24, { a: q.a, back: true, lift: 14 }); }
    if (m0) { const p = mineP(), c = mk(m0, p.x, p.y, 0); lane.pot.push({ c, side: 'me' }); const q = potPos(lane, li, lane.pot.length - 1); to(c, q.x, q.y, 0.24, { a: q.a, back: true, lift: 14, delay: 0.05 }); }
    if (f0 || m0) { g.shake = Math.max(g.shake, 4 + lane.step * 1.5); sfx('thud'); sparks(x, y, '#FFB07A', 6, 90); }
    lane.step += 1; lane.t = 0.26; return;
  }
  if (!g.foe.length) { lane.winner = 'me'; lane.state = 'show'; lane.t = 0.5; text(laneX(li), laneY() - 30, 'THE HOUSE IS OUT', LILAC); winLane(lane, li, null, null); return; }
  deal(lane, li);
}
function potPos(lane, li, idx) {
  const it = lane.pot[idx], side = it.side, k = lane.pot.slice(0, idx).filter((p) => p.side === side).length, dir = side === 'foe' ? -1 : 1;
  return { x: laneX(li) - 6 + k * 4 + it.c.jx, y: laneY() + dir * (50 + k * 2.6), a: it.c.ja };
}
function sweep(lane, li, who) {
  const cards = [lane.card, lane.mine, ...lane.pot.map((p) => p.c)].filter(Boolean), p = who === 'me' ? mineP() : foeP();
  cards.forEach((c, k) => { to(c, p.x + (Math.random() - 0.5) * 6, p.y - 8, 0.46, { delay: k * 0.045, lift: 24, a: (Math.random() - 0.5) * 0.6 }); flip(c, 0, 0.3, k * 0.045 + 0.1); c.dest = who; g.fly.push(c); });
  lane.card = lane.mine = null; lane.pot = []; lane.warN = 0; lane.double = false; lane.winner = null; lane.state = 'empty'; lane.wait = g.burst > 0 ? 0.2 : WAIT();
  if (cards.length) sfx('click', { delay: 0.3 });
}
function timeout(lane, li) {
  const x = laneX(li), y = laneY(), tax = g.mine.shift();
  if (tax) { const p = mineP(), c = mk(tax, p.x, p.y, 0); to(c, foeP().x, foeP().y - 8, 0.6, { lift: 30, a: 0.4 }); c.dest = 'foe'; g.fly.push(c); }
  sweep(lane, li, 'foe'); S.combo = 0; g.hurtT = 1.1; g.shake = Math.max(g.shake, 7); sparks(x, y, '#FF5A4A', 18, 160);
  sfx('buzz'); navigator.vibrate?.(90); text(x, y - 4, tax ? 'TOO SLOW · −1 CARD' : 'TOO SLOW', '#FF9A8A');
  host.hurt('too slow'); host.banner('⏱️ OUCH · TOO SLOW', 'the House takes it, and one of yours');
}
// ---------------------------------------------------------------- the box's beats
function giveCard(r, gold = false, why = '') {
  const c0 = { r, s: Math.floor(Math.random() * 4), gold };
  if (g.hand.length < HAND()) { const c = mk(c0, W + CW, handY() - 40, 1); c.a = 0.6; c.glow = 1; g.hand.push(c); to(c, slot(g.hand.length - 1, g.hand.length).x, handY(), 0.5, { back: true, lift: 20 }); }
  else { const c = mk(c0, W + CW, mineP().y, 1); to(c, mineP().x, mineP().y - 8, 0.55, { lift: 30 }); flip(c, 0, 0.3, 0.25); c.dest = 'top'; g.fly.push(c); }
  if (why) text(W - 70, handY() - 70, why, gold ? GOLD : '#FFE08A');
  sparks(W - 30, handY() - 40, gold ? GOLD : TEAL, 14, 140);
}
function onBeat(ev) {
  if (!g) return;
  const x = ev.x;
  if (ev.window) { g.threes = { r: 3 + Math.floor(Math.random() * 9), n: 3 }; g.burst = Math.max(g.burst, 3); g.lanes.forEach((l) => { if (l.state === 'empty') l.wait = Math.min(l.wait, 0.2); }); text(W / 2, midY(), 'THREES', '#9BE7FF'); }
  else if (ev.peak) { g.burst = Math.max(g.burst, x > 0.9 ? 3 : 2); if (x > 0.9) g.faceNext = true; g.lanes.forEach((l) => { if (l.state === 'empty') l.wait = Math.min(l.wait, 0.15); }); }
  if (ev.gift) giveCard(11 + Math.floor(Math.random() * 3), false, 'A FREE CARD');
  if (ev.gold) giveCard(14, true, 'GOLDEN ACE');
  if (ev.golden) { g.goldenNext = true; text(W / 2, midY(), 'A GOLDEN CARD COMES', GOLD); }
  if (ev.mirror) mirror();
  if (ev.balance) { for (let k = 0; g.hand.length < HAND() && g.mine.length; k++) drawToHand(k * 0.07); g.lanes.forEach((l) => { if (ready(l)) l.t = l.tmax; }); text(W / 2, handY() - 80, 'FULL HAND', TEAL); sfx('chime'); }
  if (ev.fib) { g.fibNext = true; }
  if (ev.big && !g.twist) twist();
}
function mirror() {   // ✨ the House's high cards turn into their low mirror (2 ↔ A, 3 ↔ K …): a gift (under reverse, the low ones)
  const rev = g.twist?.kind === 'reverse'; let n = 0;
  g.lanes.forEach((l, i) => { const c = l.card; if (c && !c.joker && (l.state === 'face' || l.state === 'warpick' || l.state === 'deal') && (rev ? c.r < 8 : c.r > 8)) { spin(c, 16 - c.r, n * 0.08); n += 1; sparks(laneX(i), laneY() - 46, LILAC, 12, 120); } });
  if (n) { text(W / 2, midY(), 'MIRRORED', LILAC); sfx('chime'); }
}
function twist(kind) {
  const T = kind ? TWISTS.find((t) => t[2] === kind) : TWISTS[Math.floor(Math.random() * TWISTS.length)]; if (!T) return;
  const [title, sub, k] = T; g.twist = { kind: k, until: g.time + (k === 'shuffle' ? 1.2 : k === 'joker' ? 0.8 : 8), t0: g.time };
  host.banner(title, sub); sfx('twist'); g.shake = Math.max(g.shake, 5);
  if (k === 'joker') {
    const jk = mk({ r: 15, s: 0, joker: true }, W / 2, -CH, 1); jk.glow = 1; jk.a = 3;
    if (g.hand.length >= HAND()) { let lo = 0; g.hand.forEach((c, i) => { if (!c.joker && c.r < g.hand[lo].r) lo = i; }); const out = g.hand.splice(lo, 1)[0]; to(out, mineP().x, mineP().y - 8, 0.45, { lift: 20 }); flip(out, 0, 0.3, 0.1); out.dest = 'me'; g.fly.push(out); }
    g.hand.push(jk); const s0 = slot(g.hand.length - 1, g.hand.length); to(jk, s0.x, s0.y, 0.6, { back: true, lift: 30, a: s0.a }); sparks(s0.x, s0.y, HOT, 30, 200);
  } else if (k === 'shuffle') {
    const cards = [...g.hand.filter((c) => !c.joker), ...g.lanes.filter(ready).map((l) => l.card).filter((c) => c && !c.joker)];
    const rs = cards.map((c) => c.r).sort(() => Math.random() - 0.5);
    cards.forEach((c, i) => { spin(c, rs[i], i * 0.06); c.glow = 0.8; sparks(c.x, c.y, '#9BE7FF', 6, 120); });
    g.lanes.forEach((l) => { if (ready(l)) l.t = Math.min(l.tmax, l.t + 1); });
  }
}
function drawToHand(delay = 0) {
  const c0 = g.mine.shift(); if (!c0) return;
  const p = mineP(), c = mk(c0, p.x, p.y - Math.min(10, g.mine.length) * 1.2, 0); g.hand.push(c);
  const s0 = slot(g.hand.length - 1, g.hand.length); to(c, s0.x, s0.y, 0.34, { a: s0.a, delay, lift: 12 }); flip(c, 1, 0.24, delay + 0.08);
}
// ---------------------------------------------------------------- fx
function sparks(x, y, c, n, v) { for (let i = 0; i < n && g.sp.length < 160; i++) { const a = Math.random() * 6.28, s = v * (0.3 + Math.random() * 0.7); g.sp.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, c, life: 0.5 + Math.random() * 0.4, r: 1.2 + Math.random() * 1.8 }); } }
function text(x, y, t, col = '#FFE08A', big = false) { g.fx.push({ kind: 'text', x, y, text: t, col, big, life: big ? 1.3 : 1 }); }
function slam(x, y, t) { g.fx.push({ kind: 'slam', x, y, text: t, life: 1.1, max: 1.1 }); }
// ---------------------------------------------------------------- update
function update(dt) {
  W = host?.W || W; if (!g) return;
  g.time += dt; if (g.hurtT > 0) g.hurtT -= dt; if (g.outT > 0) g.outT -= dt; g.shake *= Math.exp(-dt * 7); if (g.foeIn > 0) g.foeIn = Math.max(0, g.foeIn - dt * 2.2);
  ensureLanes();
  if (g.twist && g.time > g.twist.until) { if (g.twist.kind === 'reverse') text(W / 2, midY(), 'HIGH WINS AGAIN', TEAL); g.twist = null; }
  g.lanes.forEach((l, i) => {
    if (l.card) stepCard(l.card, dt); if (l.mine) stepCard(l.mine, dt); l.pot.forEach((p) => stepCard(p.c, dt));
    if (l.state === 'empty') { if (g.foe.length) { l.wait -= dt; if (l.wait <= 0) deal(l, i); } }
    else if (l.state === 'deal') { if (!l.card.mv && !l.card.fl) { l.state = l.warN ? 'warpick' : 'face'; l.t = l.tmax; sfx('tick'); } }
    else if (ready(l)) { l.t -= dt; if (l.t <= 0) timeout(l, i); }
    else if (l.state === 'clash') { l.t -= dt; if (l.t <= 0 && !l.mine.mv) resolve(l, i); }
    else if (l.state === 'show') { l.t -= dt; if (l.t <= 0) sweep(l, i, l.winner); }
    else if (l.state === 'war') { l.t -= dt; if (l.t <= 0) warStep(l, i); }
    const fr = ready(l) ? l.t / l.tmax : 1, wob = fr < 0.3 ? Math.sin(g.time * 34) * 0.05 * (1 - fr / 0.3) : 0;
    if (l.card) ease(l.card, laneX(i), laneY() - 46, wob, dt);
    if (l.mine) ease(l.mine, laneX(i), laneY() + 46, 0, dt);
    l.pot.forEach((p, k) => { const q = potPos(l, i, k); ease(p.c, q.x, q.y, q.a, dt); });
  });
  // your hand: refill from your pile, ease into the fan
  g.refillT -= dt; if (g.refillT <= 0 && g.hand.length < HAND() && g.mine.length) { drawToHand(); g.refillT = 0.16; }
  g.hand.forEach((c, i) => { stepCard(c, dt); if (g.drag?.c === c) return; const s0 = slot(i, g.hand.length); ease(c, s0.x, s0.y, s0.a, dt, 12); });
  g.fly = g.fly.filter((c) => { if (!stepCard(c, dt)) return true; if (c.joker) return false; if (c.dest === 'me') g.mine.push(raw(c)); else if (c.dest === 'top') g.mine.unshift({ r: c.r, s: c.s, gold: c.gold }); else g.foe.push(raw(c)); return false; });
  // out of cards: a life, and a fresh few from the deck
  if (!g.hand.length && !g.mine.length && !g.fly.some((c) => c.dest !== 'foe') && g.outT <= 0 && !g.lanes.some((l) => l.state === 'war' || l.state === 'clash' || l.state === 'show')) {
    g.outT = 2; g.mine = deck(8, 0.8); g.hurtT = 1.1; g.shake = 6; sfx('buzz'); host.hurt('out of cards'); host.banner('🂠 OUCH · OUT OF CARDS', 'a fresh few from the deck'); text(mineP().x + 40, mineP().y - 60, '+8 CARDS', TEAL);
  }
  // the House is empty: the round is yours
  if (!g.foe.length && g.lanes.every((l) => l.state === 'empty') && !g.fly.some((c) => c.dest === 'foe')) roundWon();
  g.fx.forEach((f) => { f.life -= dt; if (f.kind === 'text') f.y -= 26 * dt; }); g.fx = g.fx.filter((f) => f.life > 0);
  g.sp.forEach((p) => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= 0.98; }); g.sp = g.sp.filter((p) => p.life > 0);
}
function roundWon() {
  g.round += 1; const n = Math.min(30, 10 + 4 * (g.round - 1)); g.foe = deck(n, foeSkew()); g.foeIn = 1;
  host.heal(1); host.add(300 * (g.round - 1)); host.cue?.('kill', W / 2, foeP().y);
  host.banner(`⚔️ ROUND ${g.round} · ${ROUNDS[Math.min(ROUNDS.length - 1, g.round - 1)]}`, `the House is empty: a tougher deck, ${n} cards`);
  g.lanes.forEach((l, i) => { l.wait = 1.4 + i * 0.4; }); sparks(W / 2, foeP().y, GOLD, 50, 260); sparks(W / 2, foeP().y, HOT, 30, 200); sfx('fanfare');
  text(W / 2, foeP().y + 70, `ROUND WON +${300 * (g.round - 1)}`, GOLD, true);
}
// ---------------------------------------------------------------- the look: a velvet table under a lamp, cards drawn once
const look = { ks: 0, face: {}, back: null, joker: null, shadow: null, glow: null, bg: null, bgKey: '', bgAt: -1e9, felt: null };
function suit(c, s, x, y, z) {   // ♠ ♥ ♦ ♣ as paths, centred, z tall
  c.beginPath();
  if (s === 1) { c.moveTo(x, y + z * 0.45); c.bezierCurveTo(x - z * 0.62, y + z * 0.02, x - z * 0.5, y - z * 0.52, x, y - z * 0.2); c.bezierCurveTo(x + z * 0.5, y - z * 0.52, x + z * 0.62, y + z * 0.02, x, y + z * 0.45); c.fill(); }
  else if (s === 2) { c.moveTo(x, y - z * 0.5); c.lineTo(x + z * 0.36, y); c.lineTo(x, y + z * 0.5); c.lineTo(x - z * 0.36, y); c.closePath(); c.fill(); }
  else if (s === 0) { c.moveTo(x, y - z * 0.48); c.bezierCurveTo(x - z * 0.62, y - z * 0.05, x - z * 0.5, y + z * 0.45, x, y + z * 0.18); c.bezierCurveTo(x + z * 0.5, y + z * 0.45, x + z * 0.62, y - z * 0.05, x, y - z * 0.48); c.fill(); c.beginPath(); c.moveTo(x, y + z * 0.08); c.lineTo(x - z * 0.16, y + z * 0.5); c.lineTo(x + z * 0.16, y + z * 0.5); c.closePath(); c.fill(); }
  else { [[0, -0.24], [-0.23, 0.07], [0.23, 0.07]].forEach(([dx, dy]) => { c.moveTo(x + dx * z + z * 0.21, y + dy * z); c.arc(x + dx * z, y + dy * z, z * 0.21, 0, 7); }); c.fill(); c.beginPath(); c.moveTo(x, y); c.lineTo(x - z * 0.15, y + z * 0.5); c.lineTo(x + z * 0.15, y + z * 0.5); c.closePath(); c.fill(); }
}
const PIPS = {
  2: [[0.5, 0.2], [0.5, 0.8]], 3: [[0.5, 0.2], [0.5, 0.5], [0.5, 0.8]], 4: [[0.3, 0.2], [0.7, 0.2], [0.3, 0.8], [0.7, 0.8]],
  5: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.5], [0.3, 0.8], [0.7, 0.8]], 6: [[0.3, 0.2], [0.7, 0.2], [0.3, 0.5], [0.7, 0.5], [0.3, 0.8], [0.7, 0.8]],
  7: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.35], [0.3, 0.5], [0.7, 0.5], [0.3, 0.8], [0.7, 0.8]], 8: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.35], [0.3, 0.5], [0.7, 0.5], [0.5, 0.65], [0.3, 0.8], [0.7, 0.8]],
  9: [[0.3, 0.2], [0.7, 0.2], [0.3, 0.4], [0.7, 0.4], [0.5, 0.5], [0.3, 0.6], [0.7, 0.6], [0.3, 0.8], [0.7, 0.8]], 10: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.3], [0.3, 0.4], [0.7, 0.4], [0.3, 0.6], [0.7, 0.6], [0.5, 0.7], [0.3, 0.8], [0.7, 0.8]],
};
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * look.ks)); c.height = Math.max(1, Math.ceil(h * look.ks)); const x = c.getContext('2d'); x.scale(look.ks, look.ks); return [c, x]; }
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
function paper(c, top, bot, edge) { const gr = c.createLinearGradient(0, 0, CW * 0.4, CH); gr.addColorStop(0, top); gr.addColorStop(1, bot); c.fillStyle = gr; rr(c, 0.5, 0.5, CW - 1, CH - 1, 6); c.fill(); c.strokeStyle = edge; c.lineWidth = 1; c.stroke(); }
function faceSprite(r, s, gold) {
  const [cv, c] = canvas(CW, CH), col = s === 1 || s === 2 ? RED : INK;
  paper(c, gold ? '#FFF3C4' : '#FFFDF6', gold ? '#E9B93E' : '#EFE6D2', gold ? '#8A6A12' : 'rgba(40,20,60,0.35)');
  c.strokeStyle = gold ? 'rgba(138,106,18,0.5)' : (s === 1 || s === 2 ? 'rgba(215,38,61,0.22)' : 'rgba(27,21,48,0.18)'); c.lineWidth = 0.8; rr(c, 3.5, 3.5, CW - 7, CH - 7, 4); c.stroke();
  const corner = () => { c.fillStyle = col; c.font = `800 ${label(r).length > 1 ? 11 : 13}px Georgia, "Times New Roman", serif`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(label(r), 9, 15); suit(c, s, 9, 22, 8); };
  corner(); c.save(); c.translate(CW, CH); c.rotate(Math.PI); corner(); c.restore();
  c.fillStyle = col;
  if (PIPS[r]) {
    const z = r >= 9 ? 10 : 11.5;
    PIPS[r].forEach(([px, py]) => { const x = 13 + px * (CW - 26), y = 9 + py * (CH - 18); if (py > 0.55) { c.save(); c.translate(x, y); c.rotate(Math.PI); suit(c, s, 0, 0, z); c.restore(); } else suit(c, s, x, y, z); });
  } else if (r === 14) {
    if (gold) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#B8860B'; c.lineWidth = 1; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; c.beginPath(); c.moveTo(CW / 2 + Math.cos(a) * 12, CH / 2 + Math.sin(a) * 12); c.lineTo(CW / 2 + Math.cos(a) * 24, CH / 2 + Math.sin(a) * 24); c.stroke(); } c.restore(); }
    if (s === 0 && !gold) { c.strokeStyle = 'rgba(27,21,48,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.arc(CW / 2, CH / 2, 19, 0, 7); c.stroke(); }
    suit(c, s, CW / 2, CH / 2, 28);
  } else {   // J Q K: a framed panel, a big letter, a crown / tiara / plume
    const tint = s === 1 || s === 2 ? 'rgba(215,38,61,0.10)' : 'rgba(27,21,48,0.08)';
    c.fillStyle = gold ? 'rgba(255,255,255,0.35)' : tint; rr(c, 14, 15, CW - 28, CH - 30, 3); c.fill(); c.strokeStyle = col; c.lineWidth = 1; c.stroke();
    c.fillStyle = gold ? '#B8860B' : GOLD; rr(c, 14, CH / 2 + 7, CW - 28, 4, 1); c.fill();
    c.fillStyle = col; c.font = '700 24px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label(r), CW / 2, CH / 2 - 2);
    c.fillStyle = gold ? '#B8860B' : GOLD; c.strokeStyle = col; c.lineWidth = 0.7;
    if (r === 13) { c.beginPath(); c.moveTo(CW / 2 - 9, 25); c.lineTo(CW / 2 - 9, 19); c.lineTo(CW / 2 - 4.5, 22.5); c.lineTo(CW / 2, 17); c.lineTo(CW / 2 + 4.5, 22.5); c.lineTo(CW / 2 + 9, 19); c.lineTo(CW / 2 + 9, 25); c.closePath(); c.fill(); c.stroke(); }
    else if (r === 12) { for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(CW / 2 + i * 4, 22 - (2 - Math.abs(i)) * 1.6, 1.8, 0, 7); c.fill(); c.stroke(); } }
    else { c.beginPath(); c.moveTo(CW / 2 - 6, 25); c.quadraticCurveTo(CW / 2 + 2, 14, CW / 2 + 9, 18); c.quadraticCurveTo(CW / 2 + 2, 19, CW / 2 - 2, 25); c.fill(); c.stroke(); }
    c.fillStyle = col; suit(c, s, CW / 2, CH - 23, 8);
  }
  return cv;
}
function sierpinski(c, x, y, z, d) { if (d === 0) { c.moveTo(x, y - z * 0.577); c.lineTo(x + z / 2, y + z * 0.289); c.lineTo(x - z / 2, y + z * 0.289); c.closePath(); return; } const h = z / 2; sierpinski(c, x, y - h * 0.577, h, d - 1); sierpinski(c, x - h / 2, y + h * 0.289, h, d - 1); sierpinski(c, x + h / 2, y + h * 0.289, h, d - 1); }
function buildSprites(ks) {
  look.ks = ks; look.face = {};
  { const [cv, c] = canvas(CW, CH); const gr = c.createLinearGradient(0, 0, CW, CH); gr.addColorStop(0, '#2B1F5E'); gr.addColorStop(1, '#16102F'); c.fillStyle = gr; rr(c, 0.5, 0.5, CW - 1, CH - 1, 6); c.fill(); c.strokeStyle = '#0A0716'; c.lineWidth = 1; c.stroke();
    c.save(); rr(c, 5, 5, CW - 10, CH - 10, 4); c.clip(); c.strokeStyle = 'rgba(201,184,255,0.13)'; c.lineWidth = 0.8; for (let i = -CH; i < CW + CH; i += 7) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + CH, CH); c.moveTo(i + CH, 0); c.lineTo(i, CH); c.stroke(); } c.restore();
    c.strokeStyle = GOLD; c.lineWidth = 1.1; rr(c, 5, 5, CW - 10, CH - 10, 4); c.stroke(); c.strokeStyle = 'rgba(61,214,198,0.55)'; c.lineWidth = 0.6; rr(c, 7.5, 7.5, CW - 15, CH - 15, 3); c.stroke();
    c.fillStyle = '#16102F'; c.beginPath(); c.arc(CW / 2, CH / 2 + 1, 17, 0, 7); c.fill(); c.strokeStyle = 'rgba(245,197,66,0.6)'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = GOLD; c.beginPath(); sierpinski(c, CW / 2, CH / 2 + 2, 26, 3); c.fill();
    look.back = cv; }
  { const [cv, c] = canvas(CW, CH); paper(c, '#45307F', '#22184A', '#0A0716'); c.strokeStyle = HOT; c.lineWidth = 1; rr(c, 3.5, 3.5, CW - 7, CH - 7, 4); c.stroke();
    c.fillStyle = HOT; c.font = '800 7.5px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; 'JOKER'.split('').forEach((ch, i) => { c.fillText(ch, 8, 10 + i * 8); c.save(); c.translate(CW, CH); c.rotate(Math.PI); c.fillText(ch, 8, 10 + i * 8); c.restore(); });
    const gl = c.createRadialGradient(CW / 2, CH / 2, 2, CW / 2, CH / 2, 24); gl.addColorStop(0, 'rgba(255,95,176,0.5)'); gl.addColorStop(1, 'rgba(255,95,176,0)'); c.fillStyle = gl; c.fillRect(0, 0, CW, CH);
    drawPal('fig', c, { x: CW / 2, y: CH / 2 + 3, s: 12, t: 0.4, r: 3.95 });
    look.joker = cv; }
  { const P = 14, [cv, c] = canvas(CW + P * 2, CH + P * 2); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 9 * ks; c.fillStyle = 'rgba(0,0,0,0.55)'; rr(c, P, P, CW, CH, 6); c.fill(); look.shadow = cv; look.shP = P; }
  { const [cv, c] = canvas(120, 120); const gr = c.createRadialGradient(60, 60, 0, 60, 60, 60); gr.addColorStop(0, 'rgba(255,240,190,0.9)'); gr.addColorStop(0.35, 'rgba(245,197,66,0.4)'); gr.addColorStop(1, 'rgba(245,197,66,0)'); c.fillStyle = gr; c.fillRect(0, 0, 120, 120); look.glow = cv; }
}
const spriteOf = (c) => { if (c.f < 0.5) return look.back; if (c.joker) return look.joker; const key = `${c.r}${c.s}${c.gold ? 'g' : ''}`; return look.face[key] || (look.face[key] = faceSprite(c.r, c.s, c.gold)); };
function buildBg(Hh) {
  const k = host.k, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(W * k)); cv.height = Math.max(1, Math.ceil(Hh * k)); const c = cv.getContext('2d'); c.scale(k, k);
  const gr = c.createRadialGradient(W / 2, Hh * 0.5, 20, W / 2, Hh * 0.5, Math.max(W, Hh) * 0.75); gr.addColorStop(0, '#30246A'); gr.addColorStop(0.5, '#1C1440'); gr.addColorStop(1, '#0B0720'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
  if (!look.felt) { const t = document.createElement('canvas'); t.width = t.height = 96; const x = t.getContext('2d'); for (let i = 0; i < 700; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)'; x.fillRect(Math.random() * 96, Math.random() * 96, 1, 1); } look.felt = t; }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = c.createPattern(look.felt, 'repeat'); c.fillRect(0, 0, cv.width, cv.height); c.restore();
  c.fillStyle = 'rgba(255,255,255,0.035)'; [[0.12, 0.34, 0], [0.88, 0.34, 1], [0.12, 0.74, 2], [0.88, 0.74, 3]].forEach(([fx, fy, s]) => suit(c, s, W * fx, Hh * fy, 54));
  c.fillStyle = 'rgba(245,197,66,0.05)'; c.beginPath(); sierpinski(c, W / 2, Hh * 0.17 + 24, 150, 4); c.fill();
  c.strokeStyle = 'rgba(245,197,66,0.32)'; c.lineWidth = 2; rr(c, 8, 8, W - 16, Hh - 16, 22); c.stroke(); c.strokeStyle = 'rgba(245,197,66,0.13)'; c.lineWidth = 1; rr(c, 14, 14, W - 28, Hh - 28, 18); c.stroke();
  return cv;
}
function drawCard(c, t, hover = false) {
  const fr = c.f >= 0.5, sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * c.f))), sy = 1 + 0.07 * Math.sin(Math.PI * c.f), lift = c.lift || 0, sc = c.sc * (1 + lift * 0.006);
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
  const P = look.shP; ctx.save(); ctx.translate(2 + lift * 0.45, 3 + lift * 0.75); ctx.scale(sc * sx, sc); ctx.globalAlpha = 0.85; ctx.drawImage(look.shadow, -CW / 2 - P, -CH / 2 - P, CW + 2 * P, CH + 2 * P); ctx.restore();
  ctx.scale(sc * sx, sc * sy);
  const gl = Math.max(c.glow, fr && (c.gold || c.joker) ? 0.35 + 0.2 * Math.sin(t / 220) : 0, hover ? 0.5 : 0);
  if (gl > 0.02) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, gl); ctx.drawImage(look.glow, -CW * 0.95, -CH * 0.8, CW * 1.9, CH * 1.6); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  ctx.drawImage(spriteOf(c), -CW / 2, -CH / 2, CW, CH);
  if (fr && g.glitch && !c.joker) { ctx.fillStyle = '#FFFDF6'; ctx.fillRect(-CW / 2 + 12, -CH / 2 + 15, CW - 24, CH - 30); drawPal(g.glitchPal || 'fig', ctx, { x: 0, y: 3, s: 9, t: t / 1000, r: 3.9 }); }
  ctx.restore();
}
function drawStack(p, n, who, t) {
  const layers = Math.min(10, n), drop = who === 'foe' ? g.foeIn : 0;
  if (!n) { ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(245,197,66,0.35)'; ctx.lineWidth = 1.5; rr(ctx, p.x - CW / 2, p.y - CH / 2, CW, CH, 6); ctx.stroke(); ctx.setLineDash([]); }
  else { ctx.globalAlpha = 1 - drop; const P = look.shP; ctx.drawImage(look.shadow, p.x - CW / 2 - P + 2, p.y - CH / 2 - P + 4 - drop * 60, CW + 2 * P, CH + 2 * P); for (let i = 0; i < layers; i++) ctx.drawImage(look.back, p.x - CW / 2, p.y - CH / 2 - i * 1.2 - drop * 60 * (1 + i * 0.1), CW, CH); ctx.globalAlpha = 1; }
  const by = p.y + CH / 2 + 12, txt = String(n); ctx.font = '900 12px Sora, system-ui, sans-serif'; const w = Math.max(26, ctx.measureText(txt).width + 14);
  ctx.fillStyle = 'rgba(8,5,20,0.75)'; rr(ctx, p.x - w / 2, by - 9, w, 18, 9); ctx.fill(); ctx.strokeStyle = who === 'foe' ? 'rgba(255,95,176,0.6)' : 'rgba(61,214,198,0.7)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, p.x, by + 0.5); ctx.textBaseline = 'alphabetic';
  if (who === 'foe') { ctx.font = '800 9px Sora, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,224,138,0.7)'; ctx.fillText(`THE HOUSE · ROUND ${g.round}`, p.x, by + 20); }
}
function draw(t) {
  W = host?.W || W;
  const k = host.k, Hh = H(); if (!g) return;
  ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0);
  { const ks = k * 1.3; if (!look.back || Math.abs(ks - look.ks) / look.ks > 0.2) buildSprites(ks); }
  { const key = `${W}|${Math.round(Hh)}|${k.toFixed(3)}`; if (key !== look.bgKey && (!look.bg || t - look.bgAt > 300)) { look.bg = buildBg(Hh); look.bgKey = key; look.bgAt = t; } }
  ctx.drawImage(look.bg, 0, 0, W, Hh);
  if (g.shake > 0.2 && !host.reduceMotion) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
  const ly = laneY(), rev = g.twist?.kind === 'reverse';
  // the battle line, and a lamp over it
  { const gl = ctx.createRadialGradient(W / 2, ly, 10, W / 2, ly, W * 0.55); gl.addColorStop(0, rev ? 'rgba(255,90,74,0.13)' : 'rgba(255,230,170,0.10)'); gl.addColorStop(1, 'rgba(255,230,170,0)'); ctx.fillStyle = gl; ctx.fillRect(0, ly - W * 0.55, W, W * 1.1); }
  ctx.setLineDash([3, 7]); ctx.strokeStyle = rev ? 'rgba(255,90,74,0.55)' : 'rgba(245,197,66,0.28)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(18, ly); ctx.lineTo(W - 18, ly); ctx.stroke(); ctx.setLineDash([]);
  if (rev) { ctx.font = '900 11px Sora, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,154,138,${0.6 + 0.4 * Math.sin(t / 160)})`; ctx.fillText('▼ LOW WINS ▼', W / 2, midY() + 18); }
  if (g.twist?.kind === 'double') { ctx.font = '900 11px Sora, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,224,138,${0.6 + 0.4 * Math.sin(t / 160)})`; ctx.fillText('⚔️ WARS PAY DOUBLE', W / 2, midY() + (rev ? 32 : 18)); }
  const hoverLane = g.drag && g.drag.moved >= 12 && g.drag.ly < handY() - CH * 0.6 ? nearestLane(g.drag.lx) : -1;
  g.lanes.forEach((l, i) => {   // slots: dashed outlines, yours pulsing while a card waits for an answer
    const x = laneX(i), want = ready(l), pulse = want ? 0.35 + 0.3 * Math.sin(t / 180) : 0.18;
    ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,95,176,0.22)'; rr(ctx, x - CW / 2, ly - 46 - CH / 2, CW, CH, 6); ctx.stroke();
    ctx.strokeStyle = i === hoverLane ? 'rgba(245,197,66,0.95)' : `rgba(61,214,198,${pulse})`; rr(ctx, x - CW / 2, ly + 46 - CH / 2, CW, CH, 6); ctx.stroke(); ctx.setLineDash([]);
    if (i === hoverLane) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(look.glow, x - CW, ly + 46 - CH * 0.8, CW * 2, CH * 1.6); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  });
  drawStack(foeP(), g.foe.length, 'foe', t);
  { const p = mineP(), n = g.mine.length; drawStack(p, n, 'me', t); drawPal(S.curve.mood || 'calm', ctx, { x: p.x + 4, y: p.y - CH / 2 - 14 - Math.min(10, n) * 1.2, s: 11, t: t / 1000, r: S.curve.r, face: 1, hurt: g.hurtT > 0 }); }   // 🟢 you are Fig, sitting on your pile
  g.lanes.forEach((l, i) => {
    l.pot.forEach((p) => drawCard(p.c, t)); if (l.card) drawCard(l.card, t); if (l.mine) drawCard(l.mine, t);
    if (ready(l)) {   // the fuse on the battle line between the two slots, burning down from both ends
      const x = laneX(i), fr = Math.max(0, l.t / l.tmax), w = (CW + 10) * fr, col = fr > 0.5 ? TEAL : fr > 0.25 ? GOLD : '#FF5A4A';
      ctx.fillStyle = 'rgba(8,5,20,0.7)'; rr(ctx, x - (CW + 14) / 2, ly - 3.5, CW + 14, 7, 3.5); ctx.fill();
      ctx.fillStyle = col; rr(ctx, x - w / 2, ly - 2, w, 4, 2); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; const sz = 14 + 6 * Math.sin(t / 50 + i); [x - w / 2, x + w / 2].forEach((ex) => ctx.drawImage(look.glow, ex - sz / 2, ly - sz / 2, sz, sz)); ctx.globalCompositeOperation = 'source-over';
      if (l.state === 'warpick') { ctx.font = '900 10px Sora, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFB0A0'; ctx.fillText('YOUR FOURTH', x, ly + 46 + CH / 2 + 13); }
    }
  });
  g.fly.forEach((c) => drawCard(c, t));
  g.hand.forEach((c) => { if (g.drag?.c !== c) drawCard(c, t); });
  if (g.drag) drawCard(g.drag.c, t, true);
  // fx: sparks (light), the words, the WAR slam
  ctx.globalCompositeOperation = 'lighter'; g.sp.forEach((p) => { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  g.fx.forEach((f) => {
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    if (f.kind === 'slam') { const e = 1 - f.life / f.max, z = e < 0.22 ? 2.6 - 1.6 * easeOut(e / 0.22) : 1 + 0.03 * Math.sin(e * 30) * (1 - e), a = f.life < 0.3 ? f.life / 0.3 : 1;
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(-0.06); ctx.scale(z, z); ctx.globalAlpha = a; ctx.font = '400 40px Bungee, Impact, "Arial Black", sans-serif';
      ctx.strokeStyle = '#3A0710'; ctx.lineWidth = 9; ctx.strokeText(f.text, 0, 14); ctx.strokeStyle = '#FF5A4A'; ctx.lineWidth = 4; ctx.strokeText(f.text, 0, 14); ctx.fillStyle = '#FFE08A'; ctx.fillText(f.text, 0, 14); ctx.restore(); }
    else { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); ctx.font = f.big ? '400 20px Bungee, Impact, sans-serif' : '900 14px Sora, system-ui, sans-serif'; ctx.strokeStyle = '#0A0716'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y); }
  });
  ctx.globalAlpha = 1;
  // 🌊 going under: the room goes to candlelight. One lamp over the battle line, breathing, the rest of the table gone
  // dark, and the suits drifting up out of the felt like smoke
  { const f = host.deep?.() || 0; if (f > 0.02) {
    const br = 1 + 0.05 * Math.sin(t / 900) + 0.02 * Math.sin(t / 130), r0 = Math.max(W, Hh) * (0.2 - 0.08 * f) * br, r1 = Math.max(W, Hh) * 0.6;
    const vg = ctx.createRadialGradient(W / 2, ly, r0, W / 2, ly, r1); vg.addColorStop(0, 'rgba(6,3,16,0)'); vg.addColorStop(1, `rgba(6,3,16,${0.9 * f})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, Hh);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) { const ph = i * 2.399, x = (Math.sin(ph * 3.1) * 0.5 + 0.5) * W + Math.sin(t / 900 + ph) * 14, y = Hh - ((t / (22 + (i % 5) * 6) + i * 83) % (Hh + 60)) + 30, life = 1 - Math.abs(y / Hh - 0.5) * 2;
      ctx.globalAlpha = 0.14 * f * Math.max(0, life); ctx.fillStyle = i % 2 ? HOT : GOLD; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t / 1300 + i) * 0.5); suit(ctx, i % 4, 0, 0, 10 + (i % 3) * 5); ctx.restore(); }
    ctx.globalAlpha = 0.25 * f; const sz = 120 + 20 * Math.sin(t / 300); ctx.drawImage(look.glow, W / 2 - sz, ly - sz, sz * 2, sz * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  } }
}
// ---------------------------------------------------------------- input: tap a card to answer the oldest card, or drag it onto a lane
function pointer(type, p) {
  if (!g) return;
  if (type === 'down') {
    for (let i = g.hand.length - 1; i >= 0; i--) { const c = g.hand[i]; if (Math.abs(p.x - c.x) < CW / 2 + 4 && Math.abs(p.y - c.y) < CH / 2 + 8) { g.drag = { c, ox: p.x - c.x, oy: p.y - c.y, sx: p.x, sy: p.y, lx: p.x, ly: p.y, moved: 0 }; c.mv = null; c.sc = 1.1; sfx('tick'); return; } }
  } else if (type === 'move' && g.drag) {
    const d = g.drag; d.moved = Math.max(d.moved, Math.hypot(p.x - d.sx, p.y - d.sy)); d.c.x = p.x - d.ox; d.c.y = p.y - d.oy; d.c.a *= 0.8; d.c.sc = 1.12; d.lx = p.x; d.ly = p.y;
  } else if (type === 'up' && g.drag) {
    const d = g.drag; g.drag = null; const i = g.hand.indexOf(d.c); if (i < 0) return;
    const li = d.moved < 12 ? urgent() : p.y < handY() - CH * 0.6 ? nearestLane(p.x) : -2;
    if (li === -2) return;
    if (li < 0 || !play(i, li)) { sfx('buzz'); text(d.c.x, d.c.y - CH / 2 - 8, g.lanes.some((l) => l.card) ? 'NOT YET' : 'WAIT FOR THEIR CARD', '#C9B8FF'); }
  }
}
const organ = {
  key: 'war', name: 'War', icon: '⚔️', verb: 'tap a card to beat theirs · drag it to a lane', beat: 0.9,
  theme: { bg: '#140E2C', gold: '#F5C542', bannerc: '#FFE08A' },
  glitch(on, pal) { if (g) { g.glitch = on; g.glitchPal = pal; } },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__wr = organ.debug; },
  start() { newGame(); },
  enter(from) { if (!g) newGame(); host.ui(''); g.drag = null; if (from) g.lanes.forEach((l) => { if (ready(l)) l.t = Math.max(l.t, l.tmax); }); },
  leave() { if (g) g.drag = null; return { x: W / 2, y: laneY() }; },
  update, draw, onBeat, pointer,
  keydown(e) { const n = +e.key; if (g && n >= 1 && n <= g.hand.length) { const li = urgent(); if (li >= 0) play(n - 1, li); } },
  // 🕳️ the pocket: the House's face-down pile is the way in (with the pile gone, a face-down card in a war's pot), and what
  // comes up out of it: two high cards into your hand, four more for your pile, a life
  pocket: ladderPocket,
  pocketSpot() {
    if (!g || g.drag) return null;
    if (g.foe.length && g.foeIn <= 0) { const p = foeP(); return { x: p.x, y: p.y - Math.min(10, g.foe.length) * 1.2, r: CW / 2, icon: '🪜' }; }
    for (const l of g.lanes) { const it = l.pot.find((q) => q.side === 'foe' && q.c.f < 0.5 && !q.c.mv); if (it) return { x: it.c.x, y: it.c.y, r: CW / 2 - 4, icon: '🪜' }; }
    return null;
  },
  pocketSeed: () => ({ seed: Math.floor(Math.random() * 1e9), stage: st(), round: g?.round || 1, art: look.back ? { sprite: spriteOf, back: look.back, shadow: look.shadow, shP: look.shP, glow: look.glow, felt: look.felt, suit, CW, CH } : null }),
  pocketReward(res) {
    if (!g) return; g.drag = null; g.lanes.forEach((l) => { if (ready(l)) l.t = Math.max(l.t, l.tmax); });   // a breath on the way back up: every waiting card gets its whole fuse
    if (!res) return; const gf = res.gift || {};
    for (let k = 0; k < (gf.high || 0); k++) {   // high cards for your hand: the lowest one there goes to your pile to make room
      if (g.hand.length >= HAND()) { let lo = -1; g.hand.forEach((c, i) => { if (!c.joker && !c.gold && (lo < 0 || c.r < g.hand[lo].r)) lo = i; }); if (lo >= 0) { const out = g.hand.splice(lo, 1)[0]; to(out, mineP().x, mineP().y - 8, 0.45, { lift: 20, delay: k * 0.1 }); flip(out, 0, 0.3, 0.1); out.dest = 'me'; g.fly.push(out); } }
      giveCard(11 + Math.floor(Math.random() * 4));
    }
    if (gf.cards) { g.mine.push(...deck(gf.cards, 0.7)); text(mineP().x + 46, mineP().y - 60, `+${gf.cards} CARDS`, TEAL); sparks(mineP().x, mineP().y - 20, TEAL, 16, 140); }
    if (gf.heal) host.heal(gf.heal);
    text(W / 2, handY() - 84, '🪜 HIGH CARDS FROM UNDER', GOLD, true); sfx('chime', { hi: true });
  },
  hudLine: () => (g ? `⚔️ ${g.mine.length + g.hand.length} v ${g.foe.length}` : ''),
  level: () => g?.round || 1,
  overText: (how) => (how === 'too slow' ? ['⏱️ OUT OF TIME', 'The House took too many cards that waited too long.'] : how === 'out of cards' ? ['🂠 CLEANED OUT', 'Not a card left to throw.'] : ['RUN OVER', '']),
  endStats: () => (g ? `⚔️ ${wonN} battles won · ${warsWonN}/${warsN} wars · round ${g.round}` : ''),
  debug: () => g && ({
    round: g.round, foe: g.foe.length, mine: g.mine.length, hand: g.hand.map((c) => (c.joker ? 'JOKER' : c.r)), handGold: g.hand.map((c) => c.gold), mineTop: g.mine[0] ? { r: g.mine[0].r, gold: !!g.mine[0].gold } : null,
    lanes: g.lanes.map((l) => ({ state: l.state, card: l.card ? (l.card.joker ? 'JOKER' : l.card.r) : null, gold: !!l.card?.gold, mine: l.mine?.r ?? null, pot: l.pot.length, t: l.t, tmax: l.tmax, warN: l.warN, double: l.double })),
    twistKind: g.twist?.kind || null, fly: g.fly.length, sparks: g.sp.length, fx: g.fx.map((f) => f.text), won: wonN, wars: warsN, warsWon: warsWonN, lost: lostN, bestPot, burst: g.burst, threes: g.threes, goldenNext: g.goldenNext, fibNext: g.fibNext, faceNext: g.faceNext,
    sprites: Object.keys(look.face).length, W, H: H(), urgent: urgent(), drag: !!g.drag,
    play: (i = 0, li) => play(i, li ?? urgent()),
    forceWar: (li = 0) => { const l = g.lanes[li], i = g.hand.findIndex((c) => !c.joker); if (!ready(l) || i < 0) return false; l.card.r = g.hand[i].r; l.card.joker = false; return play(i, li); },
    setLane: (li, r) => { const l = g.lanes[li]; if (!l?.card) return false; l.card.r = r; l.card.joker = false; return true; },
    setHand: (rs) => { rs.forEach((r, i) => { if (g.hand[i]) { g.hand[i].r = r; g.hand[i].joker = false; } }); },
    twist: (kind) => twist(kind), beat: (ev) => onBeat({ x: 0.5, crossed: [], ...ev }),
    skip: () => g.lanes.forEach((l) => { l.wait = 0; }), winRound: () => { g.foe = []; g.lanes.forEach((l, i) => { if (l.state !== 'empty') sweep(l, i, 'me'); }); }, drain: () => { g.mine = []; }, empty: () => { g.mine = []; g.hand = []; },
    timeout: (li = 0) => { const l = g.lanes[li]; if (ready(l)) l.t = 0.001; return ready(l); },
    screen: (x, y) => { const cv = host.cv, r = cv.getBoundingClientRect(), s = r.width / cv.width; return { x: r.left + (x * host.k + host.ox) * s, y: r.top + (y * host.k + host.oy) * s }; },
    handRanks: () => g.hand.map((c) => c.r), handN: g.hand.length, pile: g.mine.length, pileSpot: () => organ.pocketSpot(),
    handPos: (i) => g.hand[i] && { x: g.hand[i].x, y: g.hand[i].y }, lanePos: (li) => ({ x: laneX(li), y: laneY() + 46 }),
  }),
};
export default organ;
