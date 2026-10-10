// ⚔️ War: everyone flips their top card, the highest takes them all; a tie is a WAR (three down, one
// up). All the rules live on the server (war_flip, _war_resolve, 084); this page deals, flips, slaps and
// sweeps the cards so you can watch it happen. The piles are secret: only the counts come back.
import { sb, me, bots, signedIn, esc, nm, friendly, notify, sfx, liveGame, nextUpChip, names, gauntletBar, note, splash, chaosClock, face, livePresence, liveCountdown, jumpToNext, announceChaos, isPhone, setGameTools, condenseTop, dramaOn } from './common.js';

const $ = (id) => document.getElementById(id);
const felt = $('felt'), fly = $('fly');
const SUITS = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANKS = '23456789TJQKA';
const rankName = (r) => (r === 'T' ? '10' : r);
const isRed = (c) => c[1] === 'H' || c[1] === 'D';
const cardName = (c) => `${rankName(c[0])}${SUITS[c[1]]}`;
const isBot = (id) => bots.has(id);
const plain = (html) => String(html).replace(/<[^>]+>/g, '');
const who = (id) => (id === me.id ? 'You' : plain(nm(id)));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const POS = { 2: ['b', 't'], 3: ['b', 'l', 'r'], 4: ['b', 'l', 't', 'r'] };
const TIMER_S = 4;   // live: seconds after the first flip before the slow ones flip (war_timeout allows it after 3.5)

// Pips, in % of the card: the classic layouts for 2-10 (the bottom half upside down).
const C1 = 36, C2 = 64, R = [21, 35.5, 50, 64.5, 79], R4 = [21, 40.3, 59.7, 79];
const PIPS = {
  2: [[50, R[0]], [50, R[4]]],
  3: [[50, R[0]], [50, R[2]], [50, R[4]]],
  4: [[C1, R[0]], [C2, R[0]], [C1, R[4]], [C2, R[4]]],
  5: [[C1, R[0]], [C2, R[0]], [50, R[2]], [C1, R[4]], [C2, R[4]]],
  6: [[C1, R[0]], [C2, R[0]], [C1, R[2]], [C2, R[2]], [C1, R[4]], [C2, R[4]]],
  7: [[C1, R[0]], [C2, R[0]], [50, R[1]], [C1, R[2]], [C2, R[2]], [C1, R[4]], [C2, R[4]]],
  8: [[C1, R[0]], [C2, R[0]], [50, R[1]], [C1, R[2]], [C2, R[2]], [50, R[3]], [C1, R[4]], [C2, R[4]]],
  9: [[C1, R4[0]], [C2, R4[0]], [C1, R4[1]], [C2, R4[1]], [50, 50], [C1, R4[2]], [C2, R4[2]], [C1, R4[3]], [C2, R4[3]]],
  10: [[C1, R4[0]], [C2, R4[0]], [50, 30.6], [C1, R4[1]], [C2, R4[1]], [C1, R4[2]], [C2, R4[2]], [50, 69.4], [C1, R4[3]], [C2, R4[3]]],
};
function faceHTML(c) {
  const r = c[0], s = SUITS[c[1]], rn = rankName(r);
  let mid;
  if (r === 'A') mid = `<span class="bigpip">${s}</span>`;
  else if ('JQK'.includes(r)) mid = `<div class="court"><u>${{ J: '♞', Q: '♛', K: '♚' }[r]}</u><b>${r}</b><i>${s}</i></div>`;
  else mid = `<div class="pips">${PIPS[+rn].map(([x, y]) => `<span class="${y > 50 ? 'd' : ''}" style="left:${x}%;top:${y}%">${s}</span>`).join('')}</div>`;
  return `<span class="ix tl">${rn}<i>${s}</i></span>${mid}<span class="ix br">${rn}<i>${s}</i></span>`;
}
function makeCard(code) {
  const el = document.createElement('div'); el.className = 'wc';
  el.innerHTML = '<div class="wc-in"><div class="wf back"></div><div class="wf front"></div></div>';
  if (code) setFace(el, code);
  return el;
}
function setFace(el, code) {
  el.dataset.code = code;
  const f = el.querySelector('.front'); f.className = `wf front${isRed(code) ? ' red' : ''}`; f.innerHTML = faceHTML(code);
}

// ---------------------------------------------------------------- state
let G = null;                // the game row, as last loaded
let mySeat = 0, n = 2;
let seats = [];              // seat index -> its .seat element
let table = [];              // seat index -> the cards lying in its slot: { el, code, up, rot }
let disp = [];               // the pile counts on screen (they lag the server while cards fly)
let shownBattle = 0;         // the battle whose cards are on the table
let liveOn = false, goAt = 0, holding = false, flipping = false, flippedIn = 0, askedTimeout = -1, flipSeenAt = 0, flipSeenBattle = 0;
let lastTwist = '', shuffleSeen = 0, animating = 0, warsShown = 0, battlesShown = 0;
const log = [];
const stats = { flipAnims: 0, wars: 0, battles: 0, deal: false };

// ---------------------------------------------------------------- motion
// speed(): 0 under reduced motion (everything lands at once), quicker when the table is behind.
let behind = false;
const speed = () => (reduced() ? 0 : behind ? 0.35 : 1);
const T = (ms) => ms * speed();
const wait = (ms) => new Promise((r) => setTimeout(r, T(ms)));
const tf = (p) => `translate(${p.x}px,${p.y}px) rotate(${p.rot || 0}deg) scale(${p.scale ?? 1})`;
function place(el, p) { el._p = p; el.style.transform = tf(p); }
async function moveTo(el, p, dur, easing = 'cubic-bezier(.2,.8,.2,1)') {
  const from = el._p ? tf(el._p) : null; el._p = p;
  const to = tf(p); el.style.transform = to;
  if (!from || dur <= 0 || from === to) return;
  try { await el.animate([{ transform: from }, { transform: to }], { duration: dur, easing }).finished; } catch {}
}
function box(el) {
  const f = felt.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - f.left - felt.clientLeft, y: r.top - f.top - felt.clientTop, w: r.width, h: r.height };
}
const cardSize = () => { const p = felt.querySelector('.pile'); return p ? { w: p.offsetWidth, h: p.offsetHeight } : { w: 58, h: 81 }; };
const pileOf = (s) => seats[s].querySelector('.pile');
function pilePos(s) { const b = box(pileOf(s)); return { x: b.x, y: b.y, rot: 0, scale: 1 }; }
function slotPos(s, j, k) {
  const sl = box(seats[s].querySelector('.slot')), { w: cw, h: ch } = cardSize();
  const gap = k > 1 ? Math.max(6, Math.min(cw * 0.3, (sl.w - cw) / (k - 1))) : 0;
  return { x: sl.x + sl.w / 2 - cw / 2 + (j - (k - 1) / 2) * gap, y: sl.y + (sl.h - ch) / 2 };
}
function relayout(s, dur = 220) {
  const k = table[s].length;
  return Promise.all(table[s].map((t, j) => moveTo(t.el, { ...slotPos(s, j, k), rot: t.rot, scale: 1, lift: 0 }, dur)));
}
addEventListener('resize', () => { if (!G) return; table.forEach((_, s) => relayout(s, 0)); });

// ---------------------------------------------------------------- the table
function buildSeats(g) {
  n = g.players.length; mySeat = Math.max(0, g.players.indexOf(me.id));
  felt.className = `felt n${n}`;
  felt.querySelectorAll('.seat').forEach((e) => e.remove());
  seats = g.players.map((p, s) => {
    const pos = POS[n][(s - mySeat + n) % n];
    const el = document.createElement('div');
    el.className = `seat pos-${pos}`; el.dataset.seat = s;
    el.innerHTML = `<div class="base"><div class="pile${s === mySeat ? ' mine' : ''}"${s === mySeat ? ' role="button" tabindex="0" aria-label="Your pile: tap to flip"' : ''}><div class="stack"></div><span class="cnt">0</span></div>
      <div class="who"><b>${face(p)}${p === me.id ? 'You' : nm(p)}</b><small></small></div></div><div class="slot"></div>`;
    felt.insertBefore(el, fly);
    return el;
  });
  table = g.players.map(() => []);
  pileOf(mySeat).addEventListener('click', () => doFlip());
  pileOf(mySeat).addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); } });
}
function renderCounts(bumpSeat = -1) {
  seats.forEach((el, s) => {
    const c = Math.max(0, disp[s] ?? 0), pile = pileOf(s), cnt = pile.querySelector('.cnt');
    if (cnt.textContent !== String(c)) cnt.textContent = c;
    if (s === bumpSeat) { cnt.classList.remove('bump'); void cnt.offsetWidth; cnt.classList.add('bump'); }
    pile.classList.toggle('empty', c === 0);
    const layers = Math.min(5, Math.ceil(c / 7));
    pile.querySelector('.stack').style.boxShadow = c ? Array.from({ length: layers }, (_, i) => `${(i + 1) * 1.6}px ${(i + 1) * 1.6}px 0 -0.5px ${i % 2 ? '#2D2468' : '#E9E5FF'}`).join(',') + ',0 8px 16px #0007' : 'none';
  });
}
// A card leaves seat s's pile for its slot. up: turn it face up on arrival (code null: face down).
async function flyIn(s, code, { up = true, dur = 420, rot = Math.random() * 10 - 5, sound = 'clack' } = {}) {
  const el = makeCard(code); fly.appendChild(el);
  const t = { el, code, up: false, rot };
  place(el, pilePos(s));
  table[s].push(t);
  disp[s] = (disp[s] ?? 0) - 1; renderCounts();
  await relayout(s, T(dur));
  if (sound) sfx(sound);
  if (up && code) await turnUp(t);
  return t;
}
async function turnUp(t, code = t.code) {
  if (code && t.el.dataset.code !== code) setFace(t.el, code);
  t.code = code; t.up = true; t.el.classList.add('up'); stats.flipAnims += 1;
  await wait(420);
}
function clearTable() { fly.querySelectorAll('.wc').forEach((e) => e.remove()); table = table.map(() => []); }
// Everything on the table into the winner's pile, turning face down on the way.
async function sweep(win) {
  const dest = pilePos(win), all = table.flat();
  await Promise.all(all.map((t, i) => (async () => {
    await wait(i * 45);
    t.el.classList.remove('up');
    await moveTo(t.el, { ...dest, rot: 0, scale: 0.92 }, T(520), 'cubic-bezier(.55,0,.25,1)');
    t.el.remove();
  })()));
  table = table.map(() => []);
}
function tag(t, text) { if (!t) return; const b = document.createElement('span'); b.className = 'tag'; b.textContent = text; t.el.appendChild(b); }
function bang(big, small) {
  const el = document.createElement('div'); el.className = `bang${[...big].length > 7 ? ' long' : ''}`; el.innerHTML = `${esc(big)}${small ? `<small>${esc(small)}</small>` : ''}`;
  felt.appendChild(el); setTimeout(() => el.remove(), 1400);
  if (dramaOn()) {
    felt.classList.remove('shake'); void felt.offsetWidth; felt.classList.add('shake'); setTimeout(() => felt.classList.remove('shake'), 600);
    const f = document.createElement('div'); f.className = 'flash'; felt.appendChild(f); setTimeout(() => f.remove(), 600);
  }
  navigator.vibrate?.([40, 30, 80]);
}

// The opening deal: cards fly from the middle to every pile while the counts tick up.
async function deal(g) {
  stats.deal = true;
  try { localStorage.setItem(`war.dealt.${g.id}`, '1'); } catch {}
  disp = g.players.map(() => 0); renderCounts();
  const mid = box($('mid')), { w: cw, h: ch } = cardSize(), from = { x: mid.x + mid.w / 2 - cw / 2, y: mid.y + mid.h / 2 - ch / 2, rot: 0, scale: 1 };
  const per = 6, total = n * per, flights = [];
  sfx('drumroll', { dur: 1.2 });
  for (let i = 0; i < total; i++) {
    const s = i % n, el = makeCard(null); fly.appendChild(el); place(el, from);
    flights.push((async () => {
      await moveTo(el, { ...pilePos(s), rot: Math.random() * 8 - 4 }, T(300), 'cubic-bezier(.3,.7,.3,1)');
      el.remove();
      disp[s] = Math.min(g.counts[s] + (g.flips[s] && g.flips[s] !== '-' ? 1 : 0), disp[s] + Math.ceil((52 / n) / per)); renderCounts(s);
      if (i % 3 === 0) sfx('click');
    })());
    await wait(55);
  }
  await Promise.all(flights);
  disp = g.players.map((_, s) => g.counts[s] + (g.flips[s] && g.flips[s] !== '-' ? 1 : 0)); renderCounts();
}

// One resolved battle, played back: any flips not yet shown, the wars, the winner, the sweep.
async function playBattle(lb) {
  const flips = lb.flips || [];
  $('title').textContent = (lb.wars || []).length ? `⚔️ Battle ${lb.n}…` : `Battle ${lb.n}`;
  $('flipBtn').classList.remove('go'); $('twist').hidden = true;
  // flips this page hadn't shown yet
  const missing = flips.map((c, s) => (c && c !== '-' && !table[s].length ? s : -1)).filter((s) => s >= 0);
  await Promise.all(missing.map(async (s, i) => { await wait(i * 120); await flyIn(s, flips[s]); }));
  await Promise.all(flips.map(async (c, s) => { const t = table[s][0]; if (t && !t.up && c && c !== '-') await turnUp(t, c); }));
  await wait(380);
  if (lb.twist === 'joker' && table[lb.twist_seat]?.[0]) { tag(table[lb.twist_seat][0], '🃏 = A'); sfx('pop'); await wait(500); }
  if (lb.twist === 'reverse') { felt.classList.add('rev'); bang('🔄 REVERSE', 'lowest card wins'); sfx('twist'); await wait(900); }
  for (const [wi, w] of (lb.wars || []).entries()) {
    stats.wars += 1; warsShown += 1;
    w.who.forEach((s) => { const t = table[s][table[s].length - 1]; if (t) t.el.classList.add('win'); });
    bang(wi === 0 && lb.twist === 'double' ? '💥 DOUBLE WAR' : wi > 0 ? 'WAR AGAIN!' : 'WAR!', w.who.map((s) => who(G.players[s])).join(' vs '));
    sfx('stinger'); await wait(1100);
    w.who.forEach((s) => { const t = table[s][table[s].length - 1]; if (t) t.el.classList.remove('win'); });
    // three face down, slapped in a fan, everyone at once
    const most = Math.max(0, ...w.who.map((s) => w.down?.[s] ?? 0));
    for (let i = 0; i < most; i++) {
      await Promise.all(w.who.filter((s) => (w.down?.[s] ?? 0) > i).map((s) => flyIn(s, null, { up: false, dur: 240, sound: null, rot: (i - 1) * 7 })));
      sfx('thud'); await wait(140);
    }
    (w.short || []).forEach((s) => { tag(table[s][table[s].length - 1], 'out of cards!'); sfx('buzz'); });
    // the fourth, face down first, then turned with a drumroll
    const ups = w.who.filter((s) => w.up?.[s]);
    const upCards = await Promise.all(ups.map((s) => flyIn(s, w.up[s], { up: false, dur: 320, sound: 'clack', rot: Math.random() * 6 - 3 })));
    if (upCards.length) {
      sfx('drumroll', { dur: Math.max(0.4, T(900) / 1000) }); await wait(950);
      upCards.forEach((t) => { t.el.classList.add('up'); t.up = true; stats.flipAnims += 1; });
      sfx('cannon'); navigator.vibrate?.(60); await wait(650);
    }
  }
  // the winner's card glows, the rest go dark
  const winT = table[lb.win]?.[table[lb.win].length - 1];
  table.forEach((ts, s) => { const t = ts[ts.length - 1]; if (t && s !== lb.win && t.up) t.el.classList.add('lose'); });
  if (winT) winT.el.classList.add('win');
  sfx(lb.win === mySeat ? 'chime' : 'pop');
  await wait((lb.wars || []).length ? 1000 : 650);
  await sweep(lb.win);
  felt.classList.remove('rev');
  disp = (lb.counts || disp).slice(); renderCounts(lb.win);
  stats.battles += 1; battlesShown += 1;
  addLog(lb);
}
function addLog(lb) {
  const w = G.players[lb.win], ups = (lb.flips || []).filter((c) => c && c !== '-').map(cardName);
  const wars = (lb.wars || []).length;
  const line = wars
    ? `⚔️ Battle ${lb.n}: ${wars > 1 ? `${wars} WARS` : 'WAR'}! ${who(w)} took ${lb.taken} cards`
    : `Battle ${lb.n}: ${ups.join(' vs ')} · ${who(w)} took ${lb.taken}`;
  log.unshift({ p: w, line: `${line}${lb.twist ? ` (${{ reverse: '🔄 reverse', joker: '🃏 joker', double: '💥 double war' }[lb.twist]})` : ''}`, war: !!wars });
  log.length = Math.min(log.length, 40);
}

// ---------------------------------------------------------------- keeping up with the server
let chain = Promise.resolve(), pendingG = null;
function queueSync(g) {
  pendingG = g; behind = animating > 0;
  chain = chain.then(async () => {
    if (!pendingG) return;
    const x = pendingG; pendingG = null; animating += 1;
    try { await sync(x); } catch (e) { console.error(e); } finally { animating -= 1; behind = !!pendingG; }
  });
  return chain;
}
async function sync(g) {
  const first = !G || G.id !== g.id;
  G = g;
  if (first) {
    buildSeats(g);
    disp = g.counts.slice(); renderCounts();
    shownBattle = g.battle;
    lastTwist = g.twist ? `${g.battle}:${g.twist}` : '';
    shuffleSeen = g.last_battle?.n ?? 0;
    let dealt = false; try { dealt = !!localStorage.getItem(`war.dealt.${g.id}`); } catch {}
    if (g.status === 'playing' && g.battle === 1 && !g.last_battle && !dealt) {
      render(); await deal(g);
      await flipsIn(g);
    } else {
      // the table as it stands, no fuss
      g.flips.forEach((c, s) => { if (c && c !== '-') { const el = makeCard(c); fly.appendChild(el); const t = { el, code: c, up: true, rot: Math.random() * 10 - 5 }; el.classList.add('up'); table[s].push(t); place(el, { ...slotPos(s, 0, 1), rot: t.rot }); } });
    }
    render(); return;
  }
  const lb = g.last_battle;
  if (lb && lb.n >= shownBattle) {
    if (lb.n > shownBattle) clearTable();   // this page missed a battle or more: start clean
    await playBattle(lb);
    shownBattle = lb.n + 1;
  }
  if (lb?.shuffle && shuffleSeen !== lb.n) {
    shuffleSeen = lb.n;
    seats.forEach((el) => { const p = el.querySelector('.pile'); p.classList.remove('shuffle'); void p.offsetWidth; p.classList.add('shuffle'); });
    bang('🌀 SHUFFLE', 'every pile shuffled'); sfx('twist'); await wait(900);
  }
  if (g.status === 'playing') await flipsIn(g);
  else clearTable();
  disp = g.counts.slice(); renderCounts();
  render();
}
// Cards flipped this battle that aren't on the table yet (other players, robots).
async function flipsIn(g) {
  const fresh = g.flips.map((c, s) => (c && c !== '-' && !table[s].length ? s : -1)).filter((s) => s >= 0);
  await Promise.all(fresh.map(async (s, i) => { await wait(i * 140); await flyIn(s, g.flips[s]); }));
}

// ---------------------------------------------------------------- your flip
// The flip timer runs while a person has flipped and another person hasn't (robots flip at once).
const people = (g) => g.players.filter((p) => !isBot(p)).length;
const timerOn = (g) => { const ps = g.players.map((p, s) => (isBot(p) ? null : g.flips[s])).filter((c) => c != null && c !== '-'); return ps.some((c) => c) && ps.some((c) => !c); };
const myFlipDue = () => G && G.status === 'playing' && G.flips[mySeat] === '';
const canFlip = () => myFlipDue() && !flipping && flippedIn !== G.battle && Date.now() >= goAt;
async function doFlip() {
  if (!canFlip()) { if (myFlipDue() && Date.now() < goAt) note('Wait for GO!'); return; }
  flipping = true; const s = mySeat, gid = G.id, fb = G.battle; flippedIn = fb; render();
  const call = sb.rpc('war_flip', { p_game: gid }).then((r) => r);   // once: a supabase builder re-sends on every await
  sfx('click'); navigator.vibrate?.(15);
  chain = chain.then(async () => {
    if (table[s].length || shownBattle !== fb) return;   // a refresh already showed it (or played the whole battle)
    animating += 1;
    try {
      const t = await flyIn(s, null, { up: false, dur: 300, sound: null });
      const { data, error } = await call;
      if (error) { t.el.remove(); table[s] = table[s].filter((x) => x !== t); disp[s] += 1; renderCounts(); flippedIn = 0; return; }
      sfx('clack'); await turnUp(t, data);
    } finally { animating -= 1; }
  });
  const { error } = await call;
  flipping = false;
  // (the live timer or the chaos clock can flip for you a moment before your tap lands: no fuss then)
  if (error) { flippedIn = 0; if (!/Already flipped|over|out of cards/i.test(friendly(error))) note(friendly(error), 'error'); await refreshNow(); return; }
  notify('war', gid);
  await refreshNow();
}
// Hold Flip to keep flipping (the let-go is heard on the whole page).
let downAt = 0;
$('flipBtn').addEventListener('pointerdown', () => { downAt = Date.now(); holding = true; doFlip(); });
['pointerup', 'pointercancel', 'blur'].forEach((ev) => addEventListener(ev, () => { holding = false; }, true));
document.addEventListener('visibilitychange', () => { holding = false; });
$('flipBtn').addEventListener('click', () => { if (Date.now() - downAt > 1000) doFlip(); });   // keyboard (a tap already flipped on its way down)
addEventListener('keydown', (e) => { if (e.key === ' ' && e.target === document.body) { e.preventDefault(); doFlip(); } });

// ---------------------------------------------------------------- the words around the table
const TWIST = { reverse: '🔄 Reverse: the lowest card wins this battle', joker: '🃏 Joker', double: '💥 Double war: this battle opens with a war' };
function render() {
  const g = G; if (!g) return;
  const over = g.status === 'over', mine = g.flips[mySeat];
  const waitingOn = g.players.filter((p, s) => g.flips[s] === '');
  $('title').innerHTML = over ? (g.winner === me.id ? `${face(me.id)}You win the war!` : `${face(g.winner)}${nm(g.winner)} wins!`)
    : mine === '' ? `${face(me.id)}Your flip!` : mine === '-' ? 'You\'re out of cards'
    : waitingOn.length ? `Waiting for ${waitingOn.map((p) => nm(p)).join(' & ')}` : 'Battle!';
  $('status').textContent = over ? '' : liveOn ? (people(g) > 1 ? `⚡ Live: ${TIMER_S} s to flip` : '⚡ Live vs the robots') : '';
  $('mtext').textContent = over ? 'Game over' : `Battle ${g.battle}${g.cap - g.battle <= 25 ? ` of ${g.cap}` : ''}`;
  const tw = $('twist');
  const twKey = g.twist && !over ? `${g.battle}:${g.twist}` : '';
  tw.hidden = !twKey;
  if (twKey) {
    tw.textContent = g.twist === 'joker' ? `🃏 Joker: ${who(g.players[g.twist_seat])}${g.players[g.twist_seat] === me.id ? 'r' : '\'s'} card counts as an Ace` : TWIST[g.twist];
    if (twKey !== lastTwist) { tw.classList.remove('pop'); void tw.offsetWidth; tw.classList.add('pop'); sfx('twist'); }
  }
  lastTwist = twKey;
  $('potPile').hidden = !(g.pot > 0) || over; $('potN').textContent = g.pot;
  seats.forEach((el, s) => {
    el.classList.toggle('out', g.flips[s] === '-' || (over && g.counts[s] === 0 && g.winner !== g.players[s]));
    el.classList.toggle('waiting', !over && g.flips[s] === '');
    el.querySelector('small').textContent = `${g.won?.[s] ?? 0} won${g.wars?.[s] ? ` · ${g.wars[s]} war${g.wars[s] === 1 ? '' : 's'}` : ''}`;
    const pile = el.querySelector('.pile');
    pile.querySelector('.jk')?.remove();
    if (!over && g.twist === 'joker' && g.twist_seat === s) pile.insertAdjacentHTML('beforeend', '<span class="jk" aria-label="Joker">🃏</span>');
  });
  const due = myFlipDue(), early = due && Date.now() < goAt;
  pileOf(mySeat).classList.toggle('go', due && !early && !flipping);
  const fb = $('flipBtn');
  fb.hidden = over;
  fb.setAttribute('aria-disabled', String(!due || flipping));   // not `disabled`: a disabled button swallows the let-go of a hold
  fb.classList.toggle('go', due && !early && !flipping);
  fb.classList.toggle('wait', !due);
  fb.textContent = early ? 'Get ready…' : due ? 'FLIP ⚔️' : mine === '-' ? 'You\'re out: watch the war' : waitingOn.length ? `⏳ Waiting for ${plain(waitingOn.map((p) => nm(p)).join(' & '))}` : '⚔️ Battle!';
  setGameTools({ fs: '#play', canDelete: g.created_by === me.id, onDelete: deleteGame, chaos: { kind: 'war', id: g.id } });
  $('feed').innerHTML = log.map((l) => `<li class="${l.war ? 'war' : ''}">${isBot(l.p) ? '' : face(l.p)}${esc(l.line)}</li>`).join('') || '<li class="muted">Battles show up here.</li>';
  $('timer').hidden = !(liveOn && !over && timerOn(g));
  if (over) end(g); else $('endPanel').hidden = true;
}
function end(g) {
  const p = $('endPanel'); p.hidden = false;
  const order = g.players.map((q, s) => ({ q, s })).sort((a, b) => (b.q === g.winner) - (a.q === g.winner) || g.counts[b.s] - g.counts[a.s]);
  p.innerHTML = `<h2>${g.winner === me.id ? '🏆 You won the war!' : `${face(g.winner)}${nm(g.winner)} won the war`}</h2>
    <p class="muted small">${g.last_battle?.capped ? `Sudden death after ${g.cap} battles: most cards wins.` : g.counts.filter((c) => c > 0).length > 1 ? 'Somebody ran out of time.' : `All 52 cards in one pile after ${g.battle} battles.`}</p>
    <div class="endstats">${order.map(({ q, s }) => `<div>${face(q)}${q === me.id ? 'You' : nm(q)}<b>${g.counts[s]} cards · ${g.won[s]} battles · ${g.wars[s]} wars</b></div>`).join('')}</div>`;
  endDrama(g);
}
function endDrama(g) {
  const key = `drama.end.war.${g.id}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { return; }
  const won = g.winner === me.id;
  splash(['⚔️ WAR', won ? 'YOU WIN' : 'DEFEATED', won ? 'Every card is yours' : `${plain(nm(g.winner))} took the lot`], { tone: won ? 'gold' : 'red', ms: 2600 });
  sfx(won ? 'fanfare' : 'lose', { delay: 0.8 });
  if (won && !reduced()) confetti();
  jumpToNext('war', g, me.id, (p) => (isBot(p) ? '🤖 ' : '') + (names[p] ?? 'someone'), 2600, $('nextSlot'));
}
function confetti() {
  const box_ = document.createElement('div'); box_.className = 'confetti';
  const cols = ['#F5C542', '#3DD6C6', '#FF5A4A', '#B9A6FF', '#FBF8F1'];
  box_.innerHTML = Array.from({ length: 70 }, () => `<i style="left:${Math.random() * 100}%;background:${cols[Math.floor(Math.random() * cols.length)]};animation-duration:${1.6 + Math.random() * 1.8}s;animation-delay:${Math.random() * 0.6}s"></i>`).join('');
  felt.appendChild(box_); setTimeout(() => box_.remove(), 4200);
}
async function deleteGame() {
  const { error } = await sb.rpc('war_delete', { p_game: G.id });
  if (error) return friendly(error);
  location.href = './';
}

// ---------------------------------------------------------------- live: the flip timer
setInterval(() => {
  if (!G || G.status !== 'playing') return;
  if (holding && canFlip() && !animating) doFlip();   // hold Flip: it keeps flipping, battle after battle
  if (goAt && Date.now() >= goAt && $('flipBtn').textContent === 'Get ready…') render();
  if (!liveOn) return;
  if (!timerOn(G)) { $('timerBar').style.width = '100%'; return; }
  if (flipSeenBattle !== G.battle) { flipSeenBattle = G.battle; flipSeenAt = Date.now(); }
  const t = TIMER_S - (Date.now() - flipSeenAt) / 1000;
  $('timerBar').style.width = `${Math.max(0, Math.min(1, t / TIMER_S)) * 100}%`;
  if (t < -0.2 && askedTimeout !== G.battle && !animating) {
    askedTimeout = G.battle;
    sb.rpc('war_timeout', { p_game: G.id }).then(({ data }) => { if (data) refreshNow(); });
  }
}, 200);

// ---------------------------------------------------------------- start
let refreshNow = async () => {};
async function load(id) {
  const { data: game } = await sb.from('war_games').select('*').eq('id', id).maybeSingle();
  if (!game) return null;
  if (game.gauntlet_id) gauntletBar(game.gauntlet_id, game.id, me.id, (p) => names[p] ?? 'someone');
  return game;
}
window.__war = () => ({
  id: G?.id, holding, status: G?.status, battle: G?.battle, counts: G?.counts?.slice(), flips: G?.flips?.slice(), disp: disp.slice(), pot: G?.pot,
  twist: G?.twist, last: G?.last_battle, winner: G?.winner, shownBattle, mySeat, live: liveOn, goAt, animating, pending: !!pendingG,
  table: table.map((ts) => ts.map((t) => (t.up ? t.code : '▒'))), flipAnims: stats.flipAnims, warsShown, battlesShown, dealt: stats.deal,
});
(async () => {
  if (!(await signedIn())) return;
  condenseTop($('title'), [document.querySelector('header')]);
  const id = (location.hash.match(/game=([0-9a-f-]{36})/) || [])[1];
  const g0 = id && (await load(id));
  if (!g0) { $('title').textContent = 'Game not found'; setGameTools(null); return; }
  $('logFold').open = !isPhone();
  announceChaos({ gameId: id });
  refreshNow = async () => { const g = await load(id); if (g) await queueSync(g); };
  await queueSync(g0);
  let pending = false;
  const refresh = () => { if (pending) return; pending = true; setTimeout(async () => { pending = false; await refreshNow(); announceChaos({ gameId: id }); }, 120); };
  liveGame(`war-${id}`, [{ event: '*', table: 'war_games', filter: `id=eq.${id}` }], refresh, async () => {
    if (!G) return;
    if (await chaosClock()) return refresh();
    const { data } = await sb.from('war_games').select('updated_at').eq('id', id).maybeSingle();
    if (data && data.updated_at !== G.updated_at) refresh();
  });
  // Live: everyone at the table (robots always are) → 3-2-1-GO, then a few seconds a flip.
  livePresence('war', id, async (v) => {
    liveOn = v;
    if (v && G.status === 'playing') {
      const people = G.players.filter((p) => !isBot(p)).length;
      goAt = Date.now() + 60000; render();
      goAt = await liveCountdown('war', id, ['⚔️ LIVE WAR', people > 1 ? 'Everyone\'s here' : 'You vs the robots', 'Flip fast!'], { solo: people === 1 });
      setTimeout(render, Math.max(0, goAt - Date.now()) + 30);
    } else if (!v && G.status === 'playing') { goAt = 0; note('Live table over: flip in your own time.'); }
    render();
  });
  navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.url) location.href = e.data.url; });
  const upNext = () => nextUpChip(me.id, id, (p) => (isBot(p) ? '🤖 ' : '') + (names[p] ?? 'someone'));
  upNext(); setInterval(() => { if (!document.hidden) upNext(); }, 20000);
})();
