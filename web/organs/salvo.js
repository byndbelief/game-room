// ⚓ Salvo, an organ of the shell: Battleship's DNA in thirty-second bites. Enemy fleets drift across
// the lanes of a shared ocean above your gunboat; tap to fire a shell where they'll be. Every cell of a
// ship must burn to sink it (100 × its length, × the Fibonacci combo). They fire back: torpedoes run
// down at your boat, and a tap on one blows it up. The box's beats decide the sea: a peak sends a big
// ship (a flagship at x > 0.9), the window sends threes in one lane, the mirror is a Sierpiński salvo
// (your next shot is three), the balance reloads, the golden cut sails a golden ship, gift is a free
// shell. Twists: 🌫️ fog, 🐙 the kraken (tap its arms), ⛈️ storm (double speed), 🌀 whirlpool (shells
// drift). Six shells a clip; tap the gunboat (or R) to reload.
// 📦 Weapon crates float across the lanes now and then (and sail in on a golden beat): tap one to load a few rounds
// of something better, fired by tapping the sea like a shell: 🚀 missiles (home on the nearest ship), 💥 cluster
// (five shells in a cross), ⚡ laser (burns every cell near the tap, all along that lane), ✈️ airstrike (a bomber lays
// six bombs along the lane), 🌊 tsunami (one wave, a hit on every ship at sea). Rounds don't touch the clip.
import { fibMult } from '../chaos.js';
import { drawPal } from '../pals.js';

let W = 400, LANES = 6, AMMO = 6, RELOAD_S = 1.2, CELL = 40;
// 🎚️ As the board zooms out (Stage 2+) the boat sails to the middle of the sea and the lanes spread around it
// (`g.spread` eases 0 → 1), so what comes at you comes from all sides.
const spread = () => g?.spread || 0;
const laneY = (i) => { const sp = spread(), a = H() * 0.2 + i * ((H() * 0.5) / (LANES - 1)), b = H() * 0.1 + i * ((H() * 0.8) / (LANES - 1)); return a + (b - a) * sp; };
const TWISTS = [
  ['🌫️ FOG', 'the sea hides them: fire at the wakes', 'fog'],
  ['🐙 THE KRAKEN', 'tap its arms before they drag a ship to you', 'kraken'],
  ['⛈️ STORM', 'the fleets run at double speed', 'storm'],
  ['🌀 WHIRLPOOL', 'your shells drift with the current', 'whirl'],
];
const ARMS = {
  missile: { icon: '🚀', name: 'Missiles', n: 8, desc: 'each one homes on the nearest ship' },
  cluster: { icon: '💥', name: 'Cluster', n: 6, desc: 'five shells in a cross' },
  laser: { icon: '⚡', name: 'Laser', n: 6, desc: 'burns along the whole lane' },
  strike: { icon: '✈️', name: 'Airstrike', n: 4, desc: 'a bomber lays six bombs along the lane' },
  tsunami: { icon: '🌊', name: 'Tsunami', n: 3, desc: 'a hit on every ship at sea' },
};
let host, ctx, S, sfx, g = null, sunkN = 0, shotsN = 0, bar = null;
const H = () => host.H;
const BOAT = () => ({ x: W / 2, y: (H() - 78) + (H() * 0.52 - (H() - 78)) * spread() });   // Stage 1: above the corner chips; later: the middle of the sea

function newGame() { g = { ships: [], shells: [], torps: [], fx: [], arms: [], ammo: AMMO, reloadT: 0, time: 0, twist: null, salvo: 0, wave: 0, fog: 0, spawnT: 0, spread: 0, centred: false, planes: [], bombs: [], subs: [], planeT: 3, subT: 4, crates: [], crateT: 6, arm: null, beams: [], bombers: [], waves: [], sinking: [], aim: -Math.PI / 2, trails: [] }; sunkN = 0; shotsN = 0; }
function renderBar() { if (!bar || !g) return; const a = g.arm && ARMS[g.arm.kind]; bar.innerHTML = a ? `<button type="button" class="on" aria-label="${a.name}, ${g.arm.n} rounds" title="${a.desc}">${a.icon}<b>${g.arm.n}</b></button>` : ''; }
function crate(lane = null) { if (g.crates.length >= 2) return; const kinds = Object.keys(ARMS), dir = Math.random() < 0.5 ? 1 : -1; g.crates.push({ kind: kinds[Math.floor(Math.random() * kinds.length)], lane: lane ?? Math.floor(Math.random() * LANES), x: dir > 0 ? -20 : W + 20, dir, t: 0 }); }
function pickUp(c) { g.crates.splice(g.crates.indexOf(c), 1); const a = ARMS[c.kind]; g.arm = { kind: c.kind, n: a.n }; host.cue?.('pickup', c.x, laneY(c.lane)); host.banner(`${a.icon} ${a.name.toUpperCase()} · ${a.n} ROUNDS`, a.desc); sfx('chime'); renderBar(); splash(c.x, laneY(c.lane), '#F5C542', 18); }
// a ship's cell under (x, y), for weapons that burn cells directly
function burn(sh, i) { if (i < 0 || i >= sh.len || sh.hits[i]) return false; landCell(sh, i); return true; }
function spawn(len, gold = false, lane = null) {
  const easy = (host.stage?.() || 1) === 1;   // 🎚️ Stage 1: a few short slow ships
  if (g.ships.length >= (easy ? 3 : 9)) return;
  if (easy && !gold) len = Math.min(len, 2);
  const l = lane ?? Math.floor(Math.random() * LANES), dir = Math.random() < 0.5 ? 1 : -1;
  const spd = (26 + Math.random() * 18) * (5 - len) / 2 * (gold ? 1.6 : 1) * (easy ? 0.7 : 1);
  g.ships.push({ lane: l, x: dir > 0 ? -len * CELL : W + len * CELL, dir, len, spd, hits: new Array(len).fill(false), gold, hue: gold ? 48 : [0, 200, 280, 120, 25][Math.floor(Math.random() * 5)] });
}
function onBeat(ev) {
  const x = ev.x;
  if (ev.window) { const lane = Math.floor(Math.random() * LANES); for (let i = 0; i < 3; i++) spawn(2, false, lane); }
  else if (x > 0.9) spawn(4);
  else if (x > 0.75) spawn(3);
  else if (x > 0.5) spawn(2 + Math.floor(Math.random() * 2));
  else if (x > 0.3) spawn(2);
  if (ev.gift) { g.ammo = Math.min(AMMO + 2, g.ammo + 1); }
  if (ev.mirror) { g.salvo = 3; g.fx.push({ kind: 'text', x: W / 2, y: H() * 0.5, text: '✨ SIERPIŃSKI SALVO: 3 shells', life: 1.4 }); sfx('chime'); }
  if (ev.balance) { g.ammo = AMMO; g.reloadT = 0; sfx('chime'); }
  if (ev.golden) { spawn(3, true); crate(); }
  if (ev.fib) spawn(2);
  // 🐟 They fire back: the wilder the curve, the more torpedoes.
  if ((host.stage?.() || 1) >= 2 && x > 0.55 && !ev.window && g.torps.length < 2 && g.ships.length && Math.random() < 0.35 + (S.curve.r >= 3.5699 ? 0.2 : 0)) {
    const s = g.ships[Math.floor(Math.random() * g.ships.length)], b = BOAT();
    g.torps.push({ x0: s.x + s.len * CELL / 2 * 0, y0: laneY(s.lane), x1: b.x + (Math.random() - 0.5) * 40, y1: b.y - 8, t: 0, tf: 2.6 - Math.min(0.8, S.curve.r - 2.9) });
    g.torps[g.torps.length - 1].x0 = s.x;
  }
  if (ev.big && !g.twist) twist();
}
function twist() {
  const [title, sub, kind] = TWISTS[Math.floor(Math.random() * TWISTS.length)];
  g.twist = { kind, until: g.time + 6 }; host.banner(title, sub); sfx(kind === 'kraken' ? 'thud' : 'twist');
  if (kind === 'kraken') for (let i = 0; i < 5; i++) g.arms.push({ x: 40 + i * 80 + Math.random() * 30, y: H() + 10, h: 0, hmax: 120 + Math.random() * 120, t: Math.random() * 6, alive: true });
}
const torpPos = (t) => { const e = Math.min(1, t.t / t.tf); return { x: t.x0 + (t.x1 - t.x0) * e, y: t.y0 + (t.y1 - t.y0) * e }; };
function fire(x, y) {
  if (!g || S.over) return;
  const b = BOAT();
  // a torpedo under your finger: blow it up, whatever you're doing
  const tp = g.torps.find((t) => { const q = torpPos(t); return Math.hypot(q.x - x, q.y - y) < 40; });
  if (tp) { const q = torpPos(tp); g.torps.splice(g.torps.indexOf(tp), 1); host.add(25); host.cue?.('score', q.x, q.y); splash(q.x, q.y, '#FFE08A', 14); g.fx.push({ kind: 'text', x: q.x, y: q.y - 10, text: 'DEFUSED +25', life: 0.9 }); sfx('clack'); return; }
  const pl = g.planes?.find((p) => Math.hypot(p.x - x, p.y - y) < 40); if (pl) { g.planes.splice(g.planes.indexOf(pl), 1); host.add(150); splash(pl.x, pl.y, '#FFB07A', 16); g.fx.push({ kind: 'text', x: pl.x, y: pl.y - 10, text: 'SHOT DOWN +150', life: 0.9 }); sfx('boom', { size: 0.8 }); return; }
  const bm = g.bombs?.find((q) => Math.hypot(q.x - x, q.y - y) < 36); if (bm) { g.bombs.splice(g.bombs.indexOf(bm), 1); host.add(50); splash(bm.x, bm.y, '#FFE08A', 12); g.fx.push({ kind: 'text', x: bm.x, y: bm.y - 10, text: 'DEFUSED +50', life: 0.9 }); sfx('clack'); return; }
  const sub = g.subs?.find((s) => s.up > 0.5 && Math.hypot(s.x - x, s.y - y) < 44); if (sub) { g.subs.splice(g.subs.indexOf(sub), 1); host.add(250); splash(sub.x, sub.y, '#C9B8FF', 20); g.fx.push({ kind: 'text', x: sub.x, y: sub.y - 14, text: 'SUB SUNK +250', life: 1.1, big: true }); sfx('boom', { size: 1.1 }); return; }
  const cr = g.crates.find((c) => Math.hypot(c.x - x, laneY(c.lane) - y) < 36); if (cr) { pickUp(cr); return; }
  const arm = g.arms.find((a) => a.alive && Math.abs(a.x - x) < 22 && y > H() - a.h - 10);
  if (arm) { arm.alive = false; host.add(60); splash(arm.x, H() - arm.h / 2, '#C9B8FF', 16); g.fx.push({ kind: 'text', x: arm.x, y: H() - a_h(arm), text: 'ARM OFF +60', life: 0.9 }); sfx('thud'); return; }
  if (Math.hypot(x - b.x, y - b.y) < 36) return reload();
  g.aim = Math.atan2(y - b.y, x - b.x);
  if (g.arm?.n > 0) return fireArm(x, y);
  if (g.reloadT > 0) { sfx('buzz'); return; }
  if (g.ammo <= 0) { reload(); return; }
  g.ammo -= 1; shotsN += 1;
  const shots = g.salvo ? [[0, 0], [-CELL, CELL * 0.6], [CELL, CELL * 0.6]] : [[0, 0]];
  shots.forEach(([dx, dy]) => g.shells.push({ x0: b.x, y0: b.y - 10, x: x + dx, y: y + dy, t: 0, tf: 0.42 + Math.hypot(x - b.x, y - b.y) / 1400 }));
  if (g.salvo) { g.salvo = 0; sfx('cannon'); } else sfx('cannon');
  if (g.ammo === 0) reload();
}
const a_h = (a) => a.h;
// 📦 a loaded weapon round instead of a shell from the clip
function fireArm(x, y) {
  const kind = g.arm.kind, b = BOAT(); shotsN += 1; g.arm.n -= 1; if (g.arm.n <= 0) g.arm = null; renderBar();
  const lane = nearestLane(y);
  if (kind === 'missile') {
    let best = null, bd = 1e9; g.ships.forEach((sh) => { const d = Math.hypot(sh.x + sh.len * CELL / 2 - x, laneY(sh.lane) - y); if (d < bd) { bd = d; best = sh; } });
    g.shells.push({ x0: b.x, y0: b.y - 10, x, y, t: 0, tf: 0.75, missile: true, ship: best }); sfx('cannon');
  } else if (kind === 'cluster') {
    [[0, 0], [-CELL, 0], [CELL, 0], [0, -26], [0, 26]].forEach(([dx, dy], i) => g.shells.push({ x0: b.x, y0: b.y - 10, x: x + dx, y: y + dy, t: -i * 0.04, tf: 0.45 + Math.hypot(x - b.x, y - b.y) / 1400 })); sfx('cannon');
  } else if (kind === 'laser') {
    const ly = laneY(lane); g.beams.push({ x0: b.x, y0: b.y - 14, x, y: ly, life: 0.6 });
    g.ships.slice().filter((sh) => sh.lane === lane).forEach((sh) => { for (let i = 0; i < sh.len; i++) { const cx = sh.x + i * CELL + CELL / 2; if (Math.abs(cx - x) < 80) burn(sh, i); } });
    for (let i = 0; i < 20; i++) g.fx.push({ kind: 'dot', x: x + (Math.random() - 0.5) * 160, y: ly + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 60, c: ['#9BE7FF', '#FFFFFF', '#C9B8FF'][i % 3], life: 0.6, r: 1.8 }); sfx('flash');
  } else if (kind === 'strike') {
    const dir = x > W / 2 ? -1 : 1; g.bombers.push({ x: dir > 0 ? -60 : W + 60, y: laneY(lane) - 30, dir, lane, drops: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => x + k * CELL * 0.9 * dir) }); host.banner('✈️ AIRSTRIKE', 'bombs along the lane'); sfx('tick');
  } else if (kind === 'tsunami') {
    { const hit = new Set(); g.waves.push({ y: b.y, y0: spread() > 0.3 ? b.y : H() + 40, dir: -1, hit }); if (spread() > 0.3) g.waves.push({ y: b.y, y0: b.y, dir: 1, hit }); }   // from the middle of the sea it rolls both ways host.banner('🌊 TSUNAMI', 'a hit on every ship at sea'); sfx('splash');
  }
}
const nearestLane = (y) => { let best = 0, bd = 1e9; for (let i = 0; i < LANES; i++) { const d = Math.abs(laneY(i) - y); if (d < bd) { bd = d; best = i; } } return best; };
function reload() { if (g.reloadT > 0 || g.ammo >= AMMO) return; g.reloadT = RELOAD_S; sfx('tick'); }
function land(x, y) {
  const s = g.ships.find((sh) => Math.abs(laneY(sh.lane) - y) < 26 && x > sh.x - 12 && x < sh.x + sh.len * CELL + 12);   // a near miss still lands
  if (!s) { splash(x, y, '#BFE9FF', 10); g.fx.push({ kind: 'spout', x, y, life: 0.6 }); S.combo = 0; g.fx.push({ kind: 'text', x, y: y - 8, text: 'SPLASH', life: 0.7, col: '#BFE9FF' }); sfx('splash'); return; }
  const i = Math.max(0, Math.min(s.len - 1, Math.floor((x - s.x) / CELL)));
  if (s.hits[i]) { splash(x, y, '#FFB07A', 6); return; }
  landCell(s, i);
}
function landCell(s, i) {
  const x = s.x + i * CELL + CELL / 2, y = laneY(s.lane);
  s.hits[i] = true; splash(x, y, '#FF8A3D', 16); g.fx.push({ kind: 'flash', x, y, life: 0.25, r: 34 }); sfx('boom', { size: 0.8 });
  if (s.hits.every(Boolean)) {
    g.ships.splice(g.ships.indexOf(s), 1); g.sinking.push({ ...s, y, t: 0 }); sunkN += 1; host.cue?.('kill', x, y);
    S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 2;
    const pts = (s.gold ? 500 : 100 * s.len) * fibMult(S.combo); host.add(pts);
    g.fx.push({ kind: 'text', x: s.x + s.len * CELL / 2, y: laneY(s.lane) - 14, text: `${s.gold ? 'GOLDEN ' : ''}SUNK +${pts}`, life: 1.2, big: true, col: s.gold ? '#F5C542' : '#FFE08A' });
    splash(s.x + s.len * CELL / 2, laneY(s.lane), s.gold ? '#F5C542' : '#FF5A3A', 30); sfx(s.gold ? 'chime' : 'boom', { size: 1.2 }); host.S.combo >= 3 && sfx('cheer', { delay: 0.1 });
  } else { host.add(20); g.fx.push({ kind: 'text', x, y: y - 10, text: 'HIT +20', life: 0.8 }); }
}
function splash(x, y, c, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; g.fx.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, c, life: 0.7, r: 1.5 + Math.random() * 2 }); } }
function update(dt) {
  W = host?.W || W;   // 🎚️ the world widens with the stage
  g.time += dt; if (g.hurtT > 0) g.hurtT -= dt;
  if (g.twist && g.time > g.twist.until) { g.twist = null; g.arms = []; }
  g.fog += ((g.twist?.kind === 'fog' ? 1 : 0) - g.fog) * Math.min(1, dt * 3);
  const spd = g.twist?.kind === 'storm' ? 2 : 1;
  g.ships.forEach((s) => { s.x += s.dir * s.spd * spd * dt; if ((s.dir > 0 && s.x > W + 20) || (s.dir < 0 && s.x + s.len * CELL < -20)) { s.dir *= -1; s.lane = Math.floor(Math.random() * LANES); } });
  if (g.reloadT > 0) { g.reloadT -= dt; if (g.reloadT <= 0) { g.reloadT = 0; g.ammo = AMMO; } }
  const whirl = g.twist?.kind === 'whirl' ? 1 : 0;
  g.shells = g.shells.filter((s) => { s.t += dt; if (s.t < 0) return true;
    if (s.missile && s.ship) { if (g.ships.includes(s.ship)) { const sh = s.ship, open = sh.hits.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0), i = open.length ? open[Math.floor(open.length / 2)] : 0; s.x = sh.x + i * CELL + CELL / 2; s.y = laneY(sh.lane); } else s.ship = null; }   // 🚀 it follows its ship
    if (whirl) s.x += Math.sin(g.time * 3 + s.y) * 40 * dt; if (s.t >= s.tf) { land(s.x, s.y); return false; }
    // in flight: whatever the shell meets on the way takes it — a plane, a bomb, a torpedo, a surfaced sub, or an enemy ship it passes low over
    const e = s.t / s.tf, sx = s.x0 + (s.x - s.x0) * e, sy = s.y0 + (s.y - s.y0) * e - Math.sin(e * Math.PI) * (s.bomb ? 0 : 60);
    const take = (x, y, pts, what) => { S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 2; const p = pts * fibMult(S.combo); host.add(p); host.cue?.('kill', x, y); splash(x, y, '#FFE08A', 14); g.fx.push({ kind: 'text', x, y: y - 12, text: `${what} +${p}`, life: 0.9 }); sfx('boom', { size: 0.6 }); };
    const pl = (g.planes || []).find((q) => Math.hypot(q.x - sx, q.y - sy) < 24); if (pl) { g.planes.splice(g.planes.indexOf(pl), 1); take(pl.x, pl.y, 150, 'SHOT DOWN'); return false; }
    const bm = (g.bombs || []).find((q) => Math.hypot(q.x - sx, q.y - sy) < 20); if (bm) { g.bombs.splice(g.bombs.indexOf(bm), 1); take(bm.x, bm.y, 50, 'DEFUSED'); return false; }
    const tp = g.torps.find((q) => { const t2 = torpPos(q); return Math.hypot(t2.x - sx, t2.y - sy) < 20; }); if (tp) { const t2 = torpPos(tp); g.torps.splice(g.torps.indexOf(tp), 1); take(t2.x, t2.y, 25, 'DEFUSED'); return false; }
    const sb = (g.subs || []).find((q) => q.up > 0.5 && Math.hypot(q.x - sx, q.y - sy) < 28); if (sb) { g.subs.splice(g.subs.indexOf(sb), 1); take(sb.x, sb.y, 250, 'SUB SUNK'); return false; }
    if (e > 0.55) { const sh = g.ships.find((q) => Math.abs(laneY(q.lane) - sy) < 14 && sx > q.x - 6 && sx < q.x + q.len * CELL + 6); if (sh) { land(sx, laneY(sh.lane)); return false; } }   // low over a ship: it lands there
    return true; });
  g.torps = g.torps.filter((t) => { t.t += dt; if (t.t >= t.tf) { const b = BOAT(); splash(b.x, b.y - 10, '#FF5A3A', 24); sfx('boom'); navigator.vibrate?.(100); g.hurtT = 1.2; host.hurt('torpedoed') || host.banner('HIT', `${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`); S.combo = 0; return false; } return true; });
  // ✈️ planes (Stage 2+) cross over the lanes (clear of the HUD chips) and drop a bomb over the boat; 🫧 submarines (Stage 3+) surface and fire a torpedo. Tap them.
  { const st = host.stage?.() || 1, b = BOAT(); if (!g.planes) { g.planes = []; g.bombs = []; g.subs = []; g.planeT = 3; g.subT = 4; }
    if (st >= 2) { g.planeT -= dt; if (g.planeT <= 0 && g.planes.length < st - 1) { g.planeT = 6 - st + Math.random() * 3; const dir = Math.random() < 0.5 ? 1 : -1; g.planes.push({ x: dir > 0 ? -40 : W + 40, y: laneY(0) + Math.random() * (laneY(LANES - 1) - laneY(0)), dir, v: 70 + st * 20, dropped: false }); } }
    g.planes = g.planes.filter((p) => { p.x += p.dir * p.v * dt; if (!p.dropped && Math.abs(p.x - b.x) < 8 + st * 6) { p.dropped = true; g.bombs.push({ x: p.x, y: p.y + 8, vy: 20 }); sfx('tick'); } return p.x > -50 && p.x < W + 50; });
    g.bombs = g.bombs.filter((bm) => { bm.vy += 200 * dt; bm.y += bm.vy * dt; if (bm.y >= b.y - 12) { if (Math.abs(bm.x - b.x) < 36) { splash(b.x, b.y - 10, '#FF5A3A', 24); sfx('boom'); navigator.vibrate?.(100); g.hurtT = 1.2; host.hurt('bombed') || host.banner('BOMBED', `${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`); S.combo = 0; } else splash(bm.x, bm.y, '#BFE9FF', 10); return false; } return true; });
    if (st >= 3) { g.subT -= dt; if (g.subT <= 0 && g.subs.length < st - 2) { g.subT = 8 - st + Math.random() * 4; g.subs.push({ x: 50 + Math.random() * (W - 100), y: laneY(LANES - 1) + 30 + Math.random() * 20, t: 0, up: 0, fired: false }); } }
    g.subs = g.subs.filter((s) => { s.t += dt; s.up = s.t < 1 ? s.t : s.t > 4 ? Math.max(0, 5 - s.t) : 1; if (!s.fired && s.t >= 2) { s.fired = true; g.torps.push({ x0: s.x, y0: s.y, x1: b.x + (Math.random() - 0.5) * 40, y1: b.y - 8, t: 0, tf: 2.2 }); sfx('splash'); } return s.t < 5; });
  }
  // 📦 crates drift across a lane; ⚡ beams fade; ✈️ bombers drop along their lane; 🌊 a tsunami rolls up the sea
  if (!g.crates) Object.assign(g, { crates: [], crateT: 6, arm: null, beams: [], bombers: [], waves: [], sinking: [], aim: -Math.PI / 2 });
  g.crateT -= dt; if (g.crateT <= 0) { g.crateT = 9 + Math.random() * 6; crate(); }
  g.crates = g.crates.filter((c) => { c.t += dt; c.x += c.dir * 34 * dt; return c.x > -40 && c.x < W + 40; });
  g.beams = g.beams.filter((bm) => { bm.life -= dt; return bm.life > 0; });
  g.bombers = g.bombers.filter((bb) => { bb.x += bb.dir * 300 * dt; bb.drops = bb.drops.filter((dx) => { if ((bb.dir > 0 && bb.x >= dx) || (bb.dir < 0 && bb.x <= dx)) { g.shells.push({ x0: dx, y0: bb.y, x: dx, y: laneY(bb.lane), t: 0, tf: 0.35, bomb: true }); return false; } return true; }); return bb.x > -80 && bb.x < W + 80; });
  g.waves = g.waves.filter((wv) => { wv.y += wv.dir * 260 * dt; g.ships.slice().forEach((sh) => { if (!wv.hit.has(sh) && (wv.dir < 0 ? laneY(sh.lane) >= wv.y && laneY(sh.lane) <= wv.y0 : laneY(sh.lane) <= wv.y && laneY(sh.lane) >= wv.y0)) { wv.hit.add(sh); const open = sh.hits.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0); if (open.length) burn(sh, open[Math.floor(Math.random() * open.length)]); } }); g.torps = g.torps.filter((tp) => Math.abs(torpPos(tp).y - wv.y) > 20); return wv.y > -40 && wv.y < H() + 40; });
  g.sinking = g.sinking.filter((sk) => { sk.t += dt; if (Math.random() < dt * 20) g.fx.push({ kind: 'bubble', x: sk.x + Math.random() * sk.len * CELL, y: sk.y + (Math.random() - 0.5) * 14, life: 0.8, r: 1.5 + Math.random() * 3 }); return sk.t < 1.4; });
  g.arms.forEach((a) => { a.t += dt; if (a.alive) a.h = Math.min(a.hmax, a.h + 60 * dt); else a.h = Math.max(0, a.h - 200 * dt);
    if (a.alive && a.h >= a.hmax && Math.random() < dt * 0.5) { const s = g.ships.find((sh) => Math.abs(sh.x + sh.len * CELL / 2 - a.x) < 60); if (s) { g.ships.splice(g.ships.indexOf(s), 1); g.fx.push({ kind: 'text', x: a.x, y: H() - a.h, text: 'DRAGGED UNDER', life: 1, col: '#C9B8FF' }); } } });
  g.arms = g.arms.filter((a) => a.alive || a.h > 0);
  g.fx.forEach((f) => { f.life -= dt; if (f.kind === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; } else if (f.kind === 'bubble') f.y -= 18 * dt; else if (f.kind === 'text') f.y -= 24 * dt; });
  g.fx = g.fx.filter((f) => f.life > 0);
  g.wave += dt;
  { const st = host.stage?.() || 1, to = st >= 2 ? 1 : 0; g.spread += (to - g.spread) * Math.min(1, dt * 0.8); if (to && !g.centred) { g.centred = true; host.banner('🎯 TO THE MIDDLE OF THE SEA', 'they come from all sides now'); } }
}
// ---------------------------------------------------------------- the look: a deep sea with light in it, real hulls
// with decks, turrets and wakes, fire and smoke on every hit, ships that list and go under, spouts on a miss
const shellPos = (s) => { const e = Math.max(0, s.t / s.tf); return { e, x: s.x0 + (s.x - s.x0) * e, y: s.y0 + (s.y - s.y0) * e - Math.sin(e * Math.PI) * (s.bomb ? 0 : s.missile ? 30 : 60) }; };
function hull(x0, L, y, dir, w = 11) {   // top-down: a pointed bow toward dir, a rounded stern
  const bow = dir > 0 ? x0 + L : x0, st = dir > 0 ? x0 : x0 + L;
  ctx.beginPath(); ctx.moveTo(st + dir * 4, y - w + 1); ctx.lineTo(bow - dir * 18, y - w); ctx.quadraticCurveTo(bow - dir * 2, y - w + 2, bow + dir * 4, y); ctx.quadraticCurveTo(bow - dir * 2, y + w - 2, bow - dir * 18, y + w); ctx.lineTo(st + dir * 4, y + w - 1); ctx.quadraticCurveTo(st - dir * 3, y, st + dir * 4, y - w + 1); ctx.closePath();
}
function drawShip(sh, y, t, alpha = 1, sink = 0) {
  const L = sh.len * CELL, dir = sh.dir, hue = sh.hue, bob = Math.sin(t / 500 + sh.x / 60) * 1.2;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(sh.x + L / 2, y + bob + sink * 10); ctx.rotate(Math.sin(t / 700 + sh.lane) * 0.015 + sink * 0.35 * dir); ctx.scale(1, 1 - sink * 0.5); ctx.translate(-(sh.x + L / 2), -y);
  // wake: foam fanning out behind the stern
  if (!sink) { const st = dir > 0 ? sh.x : sh.x + L; ctx.strokeStyle = 'rgba(220,240,255,0.35)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const ph = ((t / 300 + k / 3) % 1); ctx.globalAlpha = alpha * (1 - ph) * 0.8; ctx.beginPath(); ctx.moveTo(st, y - 6); ctx.quadraticCurveTo(st - dir * 20 * ph - dir * 6, y - 10 - 8 * ph, st - dir * (14 + 40 * ph), y - 12 - 10 * ph); ctx.moveTo(st, y + 6); ctx.quadraticCurveTo(st - dir * 20 * ph - dir * 6, y + 10 + 8 * ph, st - dir * (14 + 40 * ph), y + 12 + 10 * ph); ctx.stroke(); } ctx.globalAlpha = alpha; }
  ctx.fillStyle = 'rgba(0,10,25,0.45)'; hull(sh.x + 3, L, y + 5, dir, 12); ctx.fill();   // shadow on the water
  const gold = sh.gold, dark = gold ? '#B8860B' : `hsl(${hue} 30% 26%)`, mid = gold ? '#F5C542' : `hsl(${hue} 32% 46%)`, deck = gold ? '#FFE9A0' : `hsl(${hue} 18% 68%)`;
  const hg = ctx.createLinearGradient(0, y - 12, 0, y + 12); hg.addColorStop(0, mid); hg.addColorStop(0.5, dark); hg.addColorStop(1, '#0A1626'); ctx.fillStyle = hg; hull(sh.x, L, y, dir, 12); ctx.fill();
  ctx.strokeStyle = gold ? '#FFF1B8' : '#B33A2E'; ctx.lineWidth = 2; ctx.stroke();   // the red waterline
  ctx.fillStyle = deck; hull(sh.x + dir * 3, L - 10, y, dir, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; for (let i = 1; i < sh.len; i++) { const cx = sh.x + i * CELL; ctx.beginPath(); ctx.moveTo(cx, y - 6); ctx.lineTo(cx, y + 6); ctx.stroke(); }   // deck planks between the cells
  const mid0 = Math.floor((sh.len - 1) / 2);
  for (let i = 0; i < sh.len; i++) {
    const cx = sh.x + i * CELL + CELL / 2;
    if (i === mid0) {   // the bridge: a block with windows, a funnel
      ctx.fillStyle = gold ? '#FFF6D5' : '#E4E8EE'; ctx.beginPath(); ctx.roundRect(cx - 10, y - 6, 20, 12, 3); ctx.fill(); ctx.fillStyle = '#1F3A5A'; for (let k = -1; k <= 1; k++) ctx.fillRect(cx + k * 5 - 1.5, y - 4, 3, 2.5);
      ctx.fillStyle = gold ? '#B8860B' : `hsl(${hue} 50% 38%)`; ctx.beginPath(); ctx.arc(cx - dir * 4, y + 2, 3.5, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - dir * 4, y + 2, 1.8, 0, 7); ctx.fill();
    } else {   // a turret with its barrel toward the bow
      ctx.fillStyle = gold ? '#D4A72C' : `hsl(${hue} 14% 40%)`; ctx.beginPath(); ctx.arc(cx, y, 5.5, 0, 7); ctx.fill(); ctx.strokeStyle = gold ? '#D4A72C' : `hsl(${hue} 14% 34%)`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx, y - 1.5); ctx.lineTo(cx + dir * 12, y - 1.5); ctx.moveTo(cx, y + 1.5); ctx.lineTo(cx + dir * 12, y + 1.5); ctx.stroke();
    }
    if (sh.hits[i]) {   // a hit: scorched, burning, smoking
      ctx.fillStyle = 'rgba(20,10,5,0.75)'; ctx.beginPath(); ctx.arc(cx, y, 9, 0, 7); ctx.fill();
      const fl = 6 + Math.sin(t / 50 + i * 2) * 2; const fg = ctx.createRadialGradient(cx, y, 1, cx, y, fl + 4); fg.addColorStop(0, '#FFF4C2'); fg.addColorStop(0.4, '#FFB347'); fg.addColorStop(1, 'rgba(255,80,40,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, y, fl + 4, 0, 7); ctx.fill();
      for (let k = 0; k < 3; k++) { const ph = ((t / 900 + k / 3 + i * 0.17) % 1); ctx.fillStyle = `rgba(60,60,70,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(cx - dir * 10 * ph + Math.sin(t / 300 + k) * 3, y - 8 - 30 * ph, 4 + 8 * ph, 0, 7); ctx.fill(); }
    }
  }
  if (gold) { ctx.globalAlpha = alpha * (0.25 + 0.25 * Math.sin(t / 200)); ctx.strokeStyle = '#FFF1B8'; ctx.lineWidth = 3; hull(sh.x - 3, L + 6, y, dir, 15); ctx.stroke(); }
  ctx.restore();
}
function draw(t) {
  W = host?.W || W;
  const k = host.k, Hh = H();
  ctx.setTransform(k, 0, 0, k, host.ox || 0, host.oy || 0);
  const sea = ctx.createLinearGradient(0, 0, 0, Hh); sea.addColorStop(0, '#12507A'); sea.addColorStop(0.45, '#0B3356'); sea.addColorStop(1, '#061525');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, Hh);
  // light shafts from the surface, drifting
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = ((i * 137 + t / 60) % (W + 200)) - 100, gr = ctx.createLinearGradient(x, 0, x + 120, Hh); gr.addColorStop(0, 'rgba(140,210,255,0.07)'); gr.addColorStop(1, 'rgba(140,210,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 160, Hh); ctx.lineTo(x + 90, Hh); ctx.closePath(); ctx.fill(); } ctx.restore();
  // swell: two layers of waves, foam on the crests, a glint here and there
  for (let layer = 0; layer < 2; layer++) { ctx.strokeStyle = layer ? 'rgba(255,255,255,0.10)' : 'rgba(160,220,255,0.12)'; ctx.lineWidth = layer ? 1.5 : 1; const n = layer ? 11 : 16; for (let i = 0; i < n; i++) { const y = 20 + i * (Hh / n) + layer * 9, ph = t / (layer ? 700 : 1100) + i * 1.7; ctx.beginPath(); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y + Math.sin(x / (layer ? 22 : 34) + ph) * (layer ? 2.5 : 3.5)); ctx.stroke(); } }
  for (let i = 0; i < 26; i++) { const gx = (i * 97.3 + Math.sin(i) * 50) % W, gy = (i * 61.7) % Hh, tw = Math.sin(t / 300 + i * 2.1); if (tw > 0.7) { ctx.fillStyle = `rgba(255,255,255,${(tw - 0.7) * 2})`; ctx.fillRect(gx, gy, 2, 1); } }
  // the lanes: faint shipping lanes with a buoy at each end
  ctx.setLineDash([2, 10]); ctx.strokeStyle = 'rgba(190,230,255,0.10)'; ctx.lineWidth = 1; for (let i = 0; i < LANES; i++) { ctx.beginPath(); ctx.moveTo(0, laneY(i) + 18); ctx.lineTo(W, laneY(i) + 18); ctx.stroke(); } ctx.setLineDash([]);
  for (let i = 0; i < LANES; i++) [8, W - 8].forEach((bx) => { const by = laneY(i) + 18 + Math.sin(t / 400 + i + bx) * 1.5; ctx.fillStyle = i % 2 ? '#E4572E' : '#F2F4F6'; ctx.beginPath(); ctx.arc(bx, by, 3, 0, 7); ctx.fill(); });
  if (!g) return;
  // 📦 crates bobbing along a lane, a flag on top
  (g.crates || []).forEach((c) => { const y = laneY(c.lane) + Math.sin(c.t * 3) * 2, a = ARMS[c.kind]; ctx.fillStyle = 'rgba(220,240,255,0.35)'; ctx.beginPath(); ctx.ellipse(c.x, y + 9, 16, 4, 0, 0, 7); ctx.fill();
    const glow = ctx.createRadialGradient(c.x, y, 2, c.x, y, 30); glow.addColorStop(0, 'rgba(245,197,66,0.45)'); glow.addColorStop(1, 'rgba(245,197,66,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(c.x, y, 30, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(c.x, y); ctx.rotate(Math.sin(c.t * 2) * 0.12); ctx.fillStyle = '#9A6A35'; ctx.beginPath(); ctx.roundRect(-11, -9, 22, 18, 3); ctx.fill(); ctx.strokeStyle = '#F5C542'; ctx.lineWidth = 1.6; ctx.strokeRect(-11, -9, 22, 18); ctx.beginPath(); ctx.moveTo(-11, -9); ctx.lineTo(11, 9); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, -9); ctx.lineTo(8, -24); ctx.stroke(); ctx.fillStyle = '#E4572E'; ctx.beginPath(); ctx.moveTo(8, -24); ctx.lineTo(17 + Math.sin(c.t * 8) * 2, -20); ctx.lineTo(8, -16); ctx.fill();
    ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.icon, 0, 0); ctx.textBaseline = 'alphabetic'; ctx.restore();
    ctx.fillStyle = '#FFE08A'; ctx.font = '900 9px system-ui'; ctx.textAlign = 'center'; ctx.fillText('TAP', c.x, y + 22); });
  g.ships.forEach((sh) => {
    const y = laneY(sh.lane), hidden = g.fog > 0.5 && !sh.hits.some(Boolean);
    if (hidden) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; const st = sh.dir > 0 ? sh.x : sh.x + sh.len * CELL; ctx.beginPath(); ctx.moveTo(st, y - 4); ctx.lineTo(st - sh.dir * 34, y - 9); ctx.moveTo(st, y + 4); ctx.lineTo(st - sh.dir * 34, y + 9); ctx.stroke(); drawShip(sh, y, t, 0.12); return; }
    drawShip(sh, y, t);
  });
  (g.sinking || []).forEach((sk) => { const e = Math.min(1, sk.t / 1.4); drawShip(sk, sk.y, t, 1 - e * 0.9, e); ctx.strokeStyle = `rgba(220,240,255,${0.6 * (1 - e)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sk.x + sk.len * CELL / 2, sk.y, sk.len * CELL * (0.5 + e * 0.4), 10 + e * 12, 0, 0, 7); ctx.stroke(); });
  // torpedoes with a bubble trail
  g.torps.forEach((tp) => { const q = torpPos(tp), ang = Math.atan2(tp.y1 - tp.y0, tp.x1 - tp.x0); for (let k = 1; k < 7; k++) { ctx.fillStyle = `rgba(220,240,255,${0.35 - k * 0.045})`; ctx.beginPath(); ctx.arc(q.x - Math.cos(ang) * k * 7 + Math.sin(t / 90 + k) * 1.5, q.y - Math.sin(ang) * k * 7, 2.2 - k * 0.2, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(ang); ctx.fillStyle = '#2A2D36'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FF5A3A'; ctx.beginPath(); ctx.arc(10, 0, 3.4, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(255,90,58,${0.4 + 0.4 * Math.sin(t / 80)})`; ctx.beginPath(); ctx.arc(10, 0, 7, 0, 7); ctx.fill(); ctx.restore(); });
  (g.subs || []).forEach((sb) => { if (sb.up <= 0) return; ctx.save(); ctx.globalAlpha = 0.45 + 0.55 * sb.up; ctx.translate(sb.x, sb.y + (1 - sb.up) * 14); ctx.fillStyle = 'rgba(220,240,255,0.3)'; ctx.beginPath(); ctx.ellipse(0, 4, 34, 8, 0, 0, 7); ctx.fill(); const sg = ctx.createLinearGradient(0, -9, 0, 9); sg.addColorStop(0, '#6B7F92'); sg.addColorStop(1, '#25313D'); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, 0, 28, 8, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#A9C1D6'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#3A4A5A'; ctx.beginPath(); ctx.roundRect(-6, -9, 12, 9, 3); ctx.fill(); ctx.fillStyle = '#FFE08A'; ctx.fillRect(-1, -17, 2, 8); ctx.fillStyle = `rgba(255,224,138,${0.5 + 0.5 * Math.sin(t / 120)})`; ctx.beginPath(); ctx.arc(0, -17, 2.4, 0, 7); ctx.fill(); ctx.restore(); });
  g.arms.forEach((a) => { if (a.h <= 0) return; const gr = ctx.createLinearGradient(0, Hh, 0, Hh - a.h); gr.addColorStop(0, '#2A0F3A'); gr.addColorStop(1, a.alive ? '#7A3AA8' : '#3A1A4A'); ctx.strokeStyle = gr; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, Hh + 10); ctx.bezierCurveTo(a.x + Math.sin(a.t) * 30, Hh - a.h * 0.5, a.x - Math.sin(a.t * 1.3) * 30, Hh - a.h * 0.8, a.x + Math.sin(a.t * 0.7) * 20, Hh - a.h); ctx.stroke(); ctx.fillStyle = '#E7DBFF'; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.arc(a.x + Math.sin(a.t + i) * 10, Hh - a.h * i / 5, 3.2 - i * 0.3, 0, 7); ctx.fill(); } });
  // ⚡ laser beams
  (g.beams || []).forEach((bm) => { ctx.save(); ctx.globalAlpha = Math.min(1, bm.life * 2.5); ctx.lineCap = 'round'; ctx.shadowColor = '#9BE7FF'; ctx.shadowBlur = 16; ctx.strokeStyle = '#7A5CFF'; ctx.lineWidth = 8 * bm.life * 1.7; ctx.beginPath(); ctx.moveTo(bm.x0, bm.y0); ctx.lineTo(bm.x, bm.y); ctx.moveTo(bm.x - 80, bm.y); ctx.lineTo(bm.x + 80, bm.y); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bm.x0, bm.y0); ctx.lineTo(bm.x, bm.y); ctx.moveTo(bm.x - 80, bm.y); ctx.lineTo(bm.x + 80, bm.y); ctx.stroke(); ctx.restore(); });
  // 🌊 the tsunami: a wall of foam rolling up the sea
  (g.waves || []).forEach((wv) => { const d = -(wv.dir || -1), gr = ctx.createLinearGradient(0, wv.y - 10 * d, 0, wv.y + 40 * d); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.3, 'rgba(120,200,255,0.5)'); gr.addColorStop(1, 'rgba(40,120,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, wv.y + 40 * d); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, wv.y + Math.sin(x / 18 + t / 90) * 5); ctx.lineTo(W, wv.y + 40 * d); ctx.closePath(); ctx.fill(); });
  // shells: a shadow on the water, a glowing round, a tracer; missiles trail smoke
  g.shells.forEach((sh) => { if (sh.t < 0) return; const p = shellPos(sh), gx = sh.x0 + (sh.x - sh.x0) * p.e, gy = sh.y0 + (sh.y - sh.y0) * p.e;
    ctx.fillStyle = 'rgba(0,10,25,0.35)'; ctx.beginPath(); ctx.ellipse(gx, gy, 4, 2, 0, 0, 7); ctx.fill();
    const tr = 6; ctx.lineCap = 'round'; for (let k = tr; k > 0; k--) { const q = shellPos({ ...sh, t: Math.max(0, sh.t - k * 0.018) }); ctx.strokeStyle = sh.missile ? `rgba(200,200,210,${0.5 - k * 0.07})` : `rgba(255,${200 - k * 15},120,${0.6 - k * 0.08})`; ctx.lineWidth = (sh.missile ? 5 : 3) - k * 0.3; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9); gl.addColorStop(0, '#FFFFFF'); gl.addColorStop(0.35, sh.missile ? '#FF8A3D' : '#FFE08A'); gl.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fill();
    if (!sh.bomb) { ctx.strokeStyle = sh.missile ? 'rgba(255,138,61,0.6)' : 'rgba(255,90,74,0.5)'; ctx.lineWidth = 1.5; const r = 6 + 3 * Math.sin(t / 80); ctx.beginPath(); ctx.arc(sh.x, sh.y, r, 0, 7); ctx.moveTo(sh.x - r - 4, sh.y); ctx.lineTo(sh.x - r + 2, sh.y); ctx.moveTo(sh.x + r - 2, sh.y); ctx.lineTo(sh.x + r + 4, sh.y); ctx.stroke(); } });
  if (g.fog > 0.02) { const fg = ctx.createLinearGradient(0, 0, 0, Hh * 0.85); fg.addColorStop(0, `rgba(200,210,230,${0.5 * g.fog})`); fg.addColorStop(1, `rgba(200,210,230,${0.15 * g.fog})`); ctx.fillStyle = fg; ctx.fillRect(0, 0, W, Hh * 0.85); }
  // ✈️ planes and bombers fly above everything, with a shadow on the sea
  const plane = (x, y, dir, big, col) => { ctx.fillStyle = 'rgba(0,10,25,0.3)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 26, big ? 26 : 18, 5, 0, 0, 7); ctx.fill(); ctx.save(); ctx.translate(x, y); ctx.scale(dir * (big ? 1.4 : 1), big ? 1.4 : 1);
    ctx.fillStyle = '#C8D2DC'; ctx.beginPath(); ctx.roundRect(-18, -4, 36, 8, 4); ctx.fill(); ctx.fillStyle = '#A9B6C3'; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-10, -17); ctx.lineTo(4, -17); ctx.lineTo(8, -3); ctx.moveTo(-2, 3); ctx.lineTo(-10, 17); ctx.lineTo(4, 17); ctx.lineTo(8, 3); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(-18, -8, 5, 16); ctx.fillStyle = '#3A5A7A'; ctx.beginPath(); ctx.ellipse(10, 0, 4, 2.5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; const sp = t / 25; ctx.beginPath(); ctx.moveTo(19, -8 * Math.cos(sp)); ctx.lineTo(19, 8 * Math.cos(sp)); ctx.stroke(); ctx.restore(); };
  (g.planes || []).forEach((pl) => plane(pl.x, pl.y, pl.dir, false, '#E4572E'));
  (g.bombers || []).forEach((bb) => plane(bb.x, bb.y, bb.dir, true, '#3DD6C6'));
  (g.bombs || []).forEach((bm) => { ctx.fillStyle = '#1B1B22'; ctx.strokeStyle = '#FF5A3A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(bm.x, bm.y, 5, 9, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = `rgba(255,90,58,${0.5 + 0.5 * Math.sin(t / 60)})`; ctx.beginPath(); ctx.arc(bm.x, bm.y - 9, 2, 0, 7); ctx.fill(); });
  // your gunboat: a sleek hull and wake, a turret that follows your aim, Fig at the helm, the clip on the deck
  const b = BOAT();
  ctx.strokeStyle = 'rgba(220,240,255,0.3)'; ctx.lineWidth = 2; for (let kk = 0; kk < 3; kk++) { const ph = ((t / 600 + kk / 3) % 1); ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, 40 + 30 * ph, 10 + 8 * ph, 0, 0, Math.PI); ctx.stroke(); } ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,10,25,0.45)'; ctx.beginPath(); ctx.ellipse(3, 8, 38, 9, 0, 0, 7); ctx.fill();
  const bg = ctx.createLinearGradient(0, -12, 0, 12); bg.addColorStop(0, '#5B6C80'); bg.addColorStop(0.5, '#2B3440'); bg.addColorStop(1, '#151A22'); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-34, -9); ctx.lineTo(24, -10); ctx.quadraticCurveTo(38, -8, 42, 0); ctx.quadraticCurveTo(38, 8, 24, 10); ctx.lineTo(-34, 9); ctx.quadraticCurveTo(-40, 0, -34, -9); ctx.fill(); ctx.strokeStyle = '#3DD6C6'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#9FB0C2'; ctx.beginPath(); ctx.roundRect(-28, -5, 50, 10, 4); ctx.fill();
  ctx.save(); ctx.translate(20, 0); ctx.rotate(g.aim ?? -Math.PI / 2); ctx.fillStyle = '#3A4654'; ctx.fillRect(0, -2.5, 20, 5); ctx.restore(); ctx.fillStyle = '#4C5A6A'; ctx.beginPath(); ctx.arc(20, 0, 7, 0, 7); ctx.fill(); ctx.strokeStyle = '#3DD6C6'; ctx.lineWidth = 1.5; ctx.stroke();
  drawPal(S.curve.mood || 'calm', ctx, { x: -10, y: -18, s: 9, t: t / 1000, r: S.curve.r, face: 1, hurt: (g.hurtT || 0) > 0 });   // 🟢 you are Fig, at the helm
  for (let i = 0; i < AMMO; i++) { const on = i < g.ammo && !g.reloadT; ctx.fillStyle = on ? '#FFE08A' : '#ffffff22'; ctx.beginPath(); ctx.roundRect(-28 + i * 8, 12, 5, 7, 2); ctx.fill(); }
  if (g.reloadT > 0) { ctx.fillStyle = '#ffffff22'; ctx.fillRect(-34, -32, 68, 4); ctx.fillStyle = '#F5C542'; ctx.fillRect(-34, -32, 68 * (1 - g.reloadT / RELOAD_S), 4); }
  if (g.salvo) { ctx.fillStyle = '#C9B8FF'; ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('✨ ×3', 0, -40); }
  if (g.arm) { const a = ARMS[g.arm.kind]; ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#F5C542'; ctx.fillText(`${a.icon} ${g.arm.n}`, 0, g.salvo ? -54 : -40); }
  ctx.restore();
  g.fx.forEach((f) => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5));
    if (f.kind === 'dot') { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }
    else if (f.kind === 'bubble') { ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.stroke(); }
    else if (f.kind === 'flash') { const e = 1 - f.life / 0.25, gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (0.5 + e)); gr.addColorStop(0, 'rgba(255,255,230,0.95)'); gr.addColorStop(0.4, 'rgba(255,170,60,0.7)'); gr.addColorStop(1, 'rgba(255,80,40,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.5 + e), 0, 7); ctx.fill(); }
    else if (f.kind === 'spout') { const e = 1 - f.life / 0.6, h = 34 * Math.sin(e * Math.PI); ctx.fillStyle = 'rgba(220,240,255,0.75)'; ctx.beginPath(); ctx.moveTo(f.x - 6, f.y); ctx.quadraticCurveTo(f.x - 3, f.y - h, f.x, f.y - h - 4); ctx.quadraticCurveTo(f.x + 3, f.y - h, f.x + 6, f.y); ctx.fill(); ctx.strokeStyle = 'rgba(220,240,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(f.x, f.y, 6 + e * 16, 2 + e * 5, 0, 0, 7); ctx.stroke(); }
    else { ctx.font = f.big ? '400 20px Bungee, Impact, sans-serif' : '900 14px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.col || '#FFE08A'; ctx.strokeStyle = '#001020'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y); } });
  ctx.globalAlpha = 1;
  // a soft vignette, so the middle of the sea reads first
  const vg = ctx.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.35, W / 2, Hh / 2, Math.max(W, Hh) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,5,15,0.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, Hh);
}
const organ = {
  key: 'salvo', name: 'Salvo', icon: '⚓', verb: 'tap the sea to fire · tap torpedoes', beat: 0.9,
  theme: { bg: '#0A1626', gold: '#F5C542', bannerc: '#BFE9FF' },
  init(h) { host = h; ctx = h.ctx; S = h.S; sfx = h.sfx; window.__sv = organ.debug; },
  start() { newGame(); for (let i = 0; i < 3; i++) spawn(2 + (i % 2)); },
  enter(from) { if (!g) organ.start(); bar = host.ui('<div class="wbar" aria-label="Weapons"></div>').querySelector('.wbar'); renderBar(); if (from) { g.torps = []; if (!g.ships.length) for (let i = 0; i < 3; i++) spawn(2); } },
  leave() { bar = null; return BOAT(); },
  update, draw, onBeat,
  pointer(type, p) { if (type === 'down') fire(p.x, p.y); },
  keydown(e) { if (e.key === 'r' || e.key === 'R') reload(); },
  hudLine: () => (g ? `⚓ ${sunkN} sunk · ${g.ships.length} at sea` : ''),
  level: () => 1 + Math.floor(sunkN / 5),
  overText: (how) => (how === 'torpedoed' ? ['💥 GUNBOAT DOWN', 'Too many torpedoes got through.'] : ['RUN OVER', '']),
  endStats: () => (g ? `⚓ ${sunkN} sunk from ${shotsN} shells` : ''),
  debug: () => g && ({ spread: g.spread, boat: BOAT(), lanes: [laneY(0), laneY(LANES - 1)], planes: g.planes?.length || 0, bombs: g.bombs?.length || 0, subs: g.subs?.length || 0, ships: g.ships.map((s) => ({ x: s.x, y: laneY(s.lane), len: s.len, hits: s.hits.filter(Boolean).length })), torps: g.torps.map(torpPos), ammo: g.ammo, sunk: sunkN, arm: g.arm, crates: g.crates.map((c) => ({ x: c.x, y: laneY(c.lane), kind: c.kind })), kinds: Object.keys(ARMS), give: (k) => { g.arm = { kind: k, n: ARMS[k].n }; renderBar(); }, crate: () => crate(), fire, sinking: g.sinking.length, beams: g.beams.length, bombers: g.bombers.length, waves: g.waves.length, twist: g.twist?.kind || null, arms: g.arms.length, W, H: H() }),
};
export default organ;
