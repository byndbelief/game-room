// 🌍 Putt Post's worlds: every hole is a place (looks only, the physics never changes), the solo Putt organ's
// nine themes (organs/putt.js) fitted to Putt Post's holes: meadow, palm island, canyon, ice, candy, lava, moon,
// castle and reef, by `h.hi % 9`. The engine's drawHole hands over here when the look is 'worlds'.
// The ground, its texture, the decorations off the course, the island and a vignette are painted once a hole into an
// offscreen canvas (`layerFor`, a small LRU keyed by the hole's outline, ≤ ~6 Mpx, ≤ 3 px a unit, PAD units past the
// course); the fairway, rails, hazards, cup, flag, ball and aim are vectors every frame. No shadowBlur per frame.
import { LW, LH, BW, BH, COURSE, R, CUP_R, CHIP_AIR, GOPH_R, bladeSegs, reduceMotion } from './golf-engine.js';
import { drawPal } from './pals.js';

const PAD = 120, MAX_PX = 6e6, MAX_K = 3, TILE = 360;
const hash = (i) => { let x = (Math.imul(i | 0, 374761393) + 668265263) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let q = Math.imul(a ^ (a >>> 15), 1 | a); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
const oval = (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
const shade = (c, x, y, rx, ry = rx * 0.4, a = 0.25) => oval(c, x, y, rx, ry, `rgba(0,0,0,${a})`);
// texture painters get the area (x0, y0, w, h) and a density d (1 = the organ's 400 × 700 field)
const specks = (c, r, x0, y0, w, h, n, cols, sz = 1.6) => { for (let i = 0; i < n; i++) { c.fillStyle = pick(r, cols); const s = sz * (0.5 + r()); c.fillRect(x0 + r() * w, y0 + r() * h, s, s); } };
const N = (n, d) => Math.round(n * d);
// the animated bits: a cheap stable spread, shifted per tile so neighbouring tiles differ
let BOFF = 0;
const bits = (n, f) => { for (let i = 0; i < n; i++) f(i, i * 2.399 + BOFF); };

// ---------------------------------------------------------------- decorations (from organs/putt.js)
function tree(c, x, y, s, dark, light) { shade(c, x + s * 0.35, y + s * 0.55, s * 1.05, s * 0.5, 0.28); circ(c, x, y, s, dark); circ(c, x - s * 0.28, y - s * 0.3, s * 0.62, light); circ(c, x + s * 0.35, y + s * 0.1, s * 0.45, light); circ(c, x - s * 0.4, y - s * 0.45, s * 0.2, '#ffffff30'); }
function tuft(c, x, y, col) { c.strokeStyle = col; c.lineWidth = 1.3; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(x + i * 2, y); c.lineTo(x + i * 3.5, y - 5 - (i === 0 ? 2 : 0)); } c.stroke(); }
function flowers(c, r, x, y) { for (let i = 0; i < 4; i++) { const fx = x + (r() - 0.5) * 16, fy = y + (r() - 0.5) * 10, col = pick(r, ['#FFEB3B', '#FF8A80', '#FFFFFF', '#CE93D8', '#80D8FF']); for (let p = 0; p < 5; p++) circ(c, fx + Math.cos(p * 1.26) * 2, fy + Math.sin(p * 1.26) * 2, 1.6, col); circ(c, fx, fy, 1.1, '#F9A825'); } }
function palm(c, x, y, s) {
  shade(c, x + s * 0.9, y + 2, s * 1.2, s * 0.35, 0.22);
  const tx = x + s * 0.45, ty = y - s * 1.7;
  c.strokeStyle = '#8D6E3F'; c.lineWidth = s * 0.26; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 0.15, y - s, tx, ty); c.stroke();
  c.strokeStyle = '#6D5230'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { const u = i / 6, px = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * (x - s * 0.15) + u * u * tx, py = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * (y - s) + u * u * ty; c.beginPath(); c.moveTo(px - s * 0.12, py); c.lineTo(px + s * 0.12, py + 1); c.stroke(); }
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.62 + (i > 2 ? 0.3 : -0.3), L = s * (1 + (i % 2) * 0.25), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.75 + s * 0.35;
    c.fillStyle = i % 2 ? '#2E9D4A' : '#3DBB5A'; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2 + Math.sin(a) * s * 0.3, (ty + ey) / 2 - s * 0.35, ex, ey); c.quadraticCurveTo((tx + ex) / 2, (ty + ey) / 2 - s * 0.05, tx, ty); c.fill(); }
  circ(c, tx - 2, ty + 3, 2.4, '#5D3A1A'); circ(c, tx + 2.5, ty + 3.5, 2.4, '#6D4422');
}
function cactus(c, x, y, s) {
  shade(c, x + s * 0.5, y + 1, s * 0.8, s * 0.25, 0.25);
  const body = (bx, by, w, h) => { c.fillStyle = '#3E8E41'; c.beginPath(); c.roundRect(bx - w / 2, by - h, w, h, w / 2); c.fill(); c.fillStyle = '#5DB760'; c.fillRect(bx - w * 0.15, by - h + w * 0.4, w * 0.18, h - w * 0.6); };
  body(x, y, s * 0.5, s * 1.7); body(x - s * 0.42, y - s * 0.55, s * 0.3, s * 0.75); body(x + s * 0.42, y - s * 0.8, s * 0.3, s * 0.65);
  c.fillStyle = '#3E8E41'; c.fillRect(x - s * 0.42, y - s * 0.7, s * 0.4, s * 0.22); c.fillRect(x, y - s * 0.95, s * 0.42, s * 0.22);
  circ(c, x, y - s * 1.7, s * 0.12, '#FF6FA0');
}
function mesa(c, r, x, y, s) { shade(c, x + 3, y + 2, s * 1.3, s * 0.35, 0.25); c.fillStyle = '#9C3F1E'; c.beginPath(); c.moveTo(x - s * 1.2, y); c.lineTo(x - s * 0.8, y - s * 0.9); c.lineTo(x + s * 0.7, y - s * (0.85 + r() * 0.2)); c.lineTo(x + s * 1.2, y); c.closePath(); c.fill(); c.fillStyle = '#C7623A'; c.beginPath(); c.moveTo(x - s * 0.8, y - s * 0.9); c.lineTo(x + s * 0.7, y - s * 0.9); c.lineTo(x + s * 0.6, y - s * 0.6); c.lineTo(x - s * 0.7, y - s * 0.6); c.closePath(); c.fill(); c.strokeStyle = '#7A2E14'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s, y - s * 0.3); c.lineTo(x + s, y - s * 0.3); c.stroke(); }
function pine(c, x, y, s) { shade(c, x + s * 0.4, y + 1, s * 0.9, s * 0.3, 0.18); c.fillStyle = '#6D4C2F'; c.fillRect(x - s * 0.1, y - s * 0.35, s * 0.2, s * 0.4); for (let i = 0; i < 3; i++) { const w = s * (0.85 - i * 0.2), by = y - s * 0.3 - i * s * 0.55; c.fillStyle = '#1F5E3B'; c.beginPath(); c.moveTo(x - w, by); c.lineTo(x, by - s * 0.8); c.lineTo(x + w, by); c.closePath(); c.fill(); c.fillStyle = '#F4FAFF'; c.beginPath(); c.moveTo(x - w * 0.55, by - s * 0.35); c.lineTo(x, by - s * 0.8); c.lineTo(x + w * 0.55, by - s * 0.35); c.quadraticCurveTo(x, by - s * 0.5, x - w * 0.55, by - s * 0.35); c.fill(); } }
function snowman(c, x, y) { shade(c, x + 3, y + 2, 9, 3, 0.15); circ(c, x, y - 6, 7, '#FFFFFF'); circ(c, x, y - 16, 5, '#FFFFFF'); circ(c, x - 1.8, y - 17, 0.9, '#222'); circ(c, x + 1.8, y - 17, 0.9, '#222'); c.fillStyle = '#FF8A3D'; c.beginPath(); c.moveTo(x, y - 15.5); c.lineTo(x + 5, y - 15); c.lineTo(x, y - 14.3); c.fill(); c.fillStyle = '#D84343'; c.fillRect(x - 5, y - 12, 10, 2); }
function lolly(c, r, x, y, s) { shade(c, x + 3, y + 1, s * 0.6, s * 0.2, 0.2); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 1.3); c.stroke(); const cy = y - s * 1.3 - s * 0.55, col = pick(r, ['#FF4F8B', '#7C4DFF', '#FFB300', '#00BFA5']); circ(c, x, cy, s * 0.6, '#FFFFFF'); c.strokeStyle = col; c.lineWidth = s * 0.16; c.beginPath(); for (let a = 0; a < 14; a += 0.3) { const rr = a / 14 * s * 0.55; c.lineTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.stroke(); circ(c, x - s * 0.2, cy - s * 0.25, s * 0.1, '#ffffffaa'); }
function cane(c, x, y, s) { shade(c, x + 2, y + 1, s * 0.4, s * 0.15, 0.2); const path = () => { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 1.4); c.arc(x + s * 0.3, y - s * 1.4, s * 0.3, Math.PI, 0); }; c.lineCap = 'round'; c.lineWidth = s * 0.22; c.strokeStyle = '#FFFFFF'; path(); c.stroke(); c.strokeStyle = '#E53950'; c.setLineDash([s * 0.18, s * 0.18]); path(); c.stroke(); c.setLineDash([]); }
function gumdrop(c, r, x, y, s) { const col = pick(r, ['#FF5C8A', '#FFC93C', '#7ED957', '#5BC0FF', '#B388FF']); shade(c, x + 2, y + 1, s, s * 0.3, 0.2); c.fillStyle = col; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s, y - s * 1.4, x, y - s * 1.3); c.quadraticCurveTo(x + s, y - s * 1.4, x + s, y); c.closePath(); c.fill(); for (let i = 0; i < 6; i++) circ(c, x + (r() - 0.5) * s * 1.3, y - r() * s, 0.8, '#ffffffcc'); }
function spikeRock(c, r, x, y, s) { shade(c, x + 3, y + 1, s, s * 0.3, 0.35); for (let i = 0; i < 3; i++) { const ox = (i - 1) * s * 0.5, h = s * (0.9 + r() * 0.8); c.fillStyle = i === 1 ? '#3A2E2E' : '#2A2020'; c.beginPath(); c.moveTo(x + ox - s * 0.4, y); c.lineTo(x + ox + (r() - 0.5) * 4, y - h); c.lineTo(x + ox + s * 0.4, y); c.closePath(); c.fill(); } c.strokeStyle = '#FF7A2A'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s * 0.3, y - 1); c.lineTo(x + s * 0.1, y - s * 0.5); c.stroke(); }
function cone(c, x, y, s) { shade(c, x + 4, y + 2, s * 1.4, s * 0.35, 0.35); c.fillStyle = '#3B2A26'; c.beginPath(); c.moveTo(x - s * 1.3, y); c.lineTo(x - s * 0.35, y - s * 1.2); c.lineTo(x + s * 0.35, y - s * 1.2); c.lineTo(x + s * 1.3, y); c.closePath(); c.fill(); c.fillStyle = '#FF6A1F'; c.beginPath(); c.ellipse(x, y - s * 1.2, s * 0.35, s * 0.12, 0, 0, 7); c.fill(); c.fillStyle = '#FF9A3D'; c.beginPath(); c.moveTo(x - s * 0.15, y - s * 1.2); c.lineTo(x - s * 0.3, y - s * 0.6); c.lineTo(x, y - s * 0.9); c.lineTo(x + s * 0.1, y - s * 0.4); c.lineTo(x + s * 0.15, y - s * 1.2); c.fill(); }
function crater(c, x, y, rr) { circ(c, x, y, rr + 1.5, '#ffffff22'); circ(c, x, y, rr, '#00000040'); c.fillStyle = '#00000038'; c.beginPath(); c.arc(x, y, rr, Math.PI * 1.05, Math.PI * 1.95); c.arc(x, y + rr * 0.35, rr * 0.9, Math.PI * 1.9, Math.PI * 1.1, true); c.fill(); }
function planet(c, r, x, y, s) { const col = pick(r, [['#FFB74D', '#E65100'], ['#81D4FA', '#0277BD'], ['#F48FB1', '#AD1457']]); const gr = c.createRadialGradient(x - s * 0.3, y - s * 0.3, 1, x, y, s); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); c.fillStyle = gr; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); c.strokeStyle = '#FFFFFFAA'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, s * 1.7, s * 0.45, -0.35, 0, 7); c.stroke(); }
function tower(c, x, y, s) { shade(c, x + s * 0.5, y + 2, s, s * 0.3, 0.3); c.fillStyle = '#8E8A85'; c.fillRect(x - s * 0.5, y - s * 1.6, s, s * 1.6); c.fillStyle = '#A9A49E'; c.fillRect(x - s * 0.5, y - s * 1.6, s * 0.35, s * 1.6); for (let i = 0; i < 3; i++) c.fillRect(x - s * 0.5 + i * s * 0.4, y - s * 1.85, s * 0.22, s * 0.28); c.fillStyle = '#3B2A1E'; c.beginPath(); c.roundRect(x - s * 0.18, y - s * 0.5, s * 0.36, s * 0.5, [s * 0.18, s * 0.18, 0, 0]); c.fill(); c.strokeStyle = '#5A5550'; c.lineWidth = 0.8; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x - s * 0.5, y - i * s * 0.32); c.lineTo(x + s * 0.5, y - i * s * 0.32); c.stroke(); } c.strokeStyle = '#444'; c.beginPath(); c.moveTo(x, y - s * 1.85); c.lineTo(x, y - s * 2.6); c.stroke(); c.fillStyle = '#D62839'; c.beginPath(); c.moveTo(x, y - s * 2.6); c.lineTo(x + s * 0.6, y - s * 2.45); c.lineTo(x, y - s * 2.3); c.fill(); }
function seaweed(c, r, x, y, s) { const col = pick(r, ['#2E8B57', '#3CB371', '#6B8E23']); c.strokeStyle = col; c.lineCap = 'round'; for (let j = 0; j < 3; j++) { c.lineWidth = 2.5 - j * 0.4; c.beginPath(); c.moveTo(x + (j - 1) * 3, y); for (let i = 1; i <= 6; i++) c.lineTo(x + (j - 1) * 3 + Math.sin(i * 1.1 + j) * 3, y - i * s * 0.28); c.stroke(); } }
function coral(c, r, x, y, s) { const col = pick(r, ['#FF6F61', '#FF8FB1', '#FFB347', '#C77DFF']); c.strokeStyle = col; c.lineCap = 'round'; const br = (bx, by, a, L, d) => { const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L; c.lineWidth = 1 + d * 1.1; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke(); if (d > 0) { br(ex, ey, a - 0.5, L * 0.7, d - 1); br(ex, ey, a + 0.45, L * 0.7, d - 1); } else circ(c, ex, ey, 1.4, col); }; br(x, y, -Math.PI / 2, s * 0.7, 3); }
function star5(c, x, y, rr, col) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr * 0.45 : rr; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }
const sparkle = (c, x, y, s, col) => { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); };

// ---------------------------------------------------------------- the nine places
// A world is colours plus painters: `tex(c, r, x0, y0, w, h, d)` the ground's texture (d = density), `deco(c, r, x, y)`
// one decoration off the course, `amb(c, ts, T, front)` a tile's animated bits (under or over the ball), and the hazards'
// looks (`pond`, `sand`, `bump`). `chev` colours the slope chevrons where white wouldn't read.
const WORLDS = [
  { key: 'meadow', icon: '🌳', name: 'SUNNY MEADOW', sub: 'a gentle green to warm up',
    bg: ['#3C7F33', '#2C6526'], fair: ['#62B84C', '#55A842'], fringe: '#3F8A33', tee: '#7CCB62', green: '#74C95C', flag: '#E4572E',
    rail: [[12, '#3E2716'], [8, '#8B5A2B'], [8, '#6B4320', [2, 22]]],
    tex: (c, r, x0, y0, w, h, d) => specks(c, r, x0, y0, w, h, N(900, d), ['#4C9440', '#2F6A28', '#58A34A']),
    deco: (c, r, x, y) => { const q = r(); if (q < 0.4) tree(c, x, y, 9 + r() * 8, '#2E7D32', '#4CAF50'); else if (q < 0.65) flowers(c, r, x, y); else if (q < 0.85) tree(c, x, y, 5 + r() * 2, '#33691E', '#689F38'); else tuft(c, x, y, '#8BC34A'); },
    pond: 'water', sand: ['#EBD38E', '#C9A85C'], bump: { c: ['#FF8A65', '#E4572E', '#7A2A14'] },
    amb: (c, ts, W, front) => { if (!front) return; bits(3, (i, ph) => { const x = (W * (0.15 + 0.7 * ((ph * 0.37) % 1)) + Math.sin(ts * 0.5 + ph) * 40), y = W * (0.15 + 0.7 * ((ph * 0.61) % 1)) + Math.cos(ts * 0.7 + ph) * 30, f = Math.abs(Math.sin(ts * 9 + ph)) * 3 + 1; c.fillStyle = ['#FFEB3B', '#FFFFFF', '#FF80AB'][i % 3]; c.beginPath(); c.ellipse(x - f / 2, y, f, 2.6, 0.3, 0, 7); c.ellipse(x + f / 2, y, f, 2.6, -0.3, 0, 7); c.fill(); }); } },
  { key: 'tropic', icon: '🌴', name: 'PALM ISLAND', sub: 'sand, sea and coconuts',
    bg: ['#29B6D8', '#137FB0'], island: ['#7FDDEA', '#F2D896'], fair: ['#4FC46A', '#45B45F'], fringe: '#36974F', tee: '#6FD685', green: '#66D07E', flag: '#FF5FA2',
    rail: [[12, '#6E5124'], [8, '#D9B866'], [8, '#7A5A2A', [1.5, 13]]],
    tex: (c, r, x0, y0, w, h, d) => { c.strokeStyle = '#FFFFFF40'; c.lineWidth = 1.2; for (let i = 0; i < N(90, d); i++) { const x = x0 + r() * w, y = y0 + r() * h; c.beginPath(); c.arc(x, y, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } },
    near: 46,
    deco: (c, r, x, y) => { const q = r(); if (q < 0.5) palm(c, x, y, 9 + r() * 5); else if (q < 0.75) star5(c, x, y, 3.5, pick(r, ['#FF8A65', '#FFB74D'])); else { oval(c, x, y, 3.5, 2.5, '#FFF3E0'); oval(c, x, y, 2, 1.4, '#FFCCBC'); } },
    pond: 'water', sand: ['#FFE7A8', '#D9B76A'], bump: { c: ['#B0794A', '#7B4B2A', '#3E2414'], kind: 'coco' },
    amb: (c, ts, W, front) => { if (front) return; c.fillStyle = '#FFFFFFAA'; bits(10, (i, ph) => { const x = ((ph * 97) % 1) * W, y = ((ph * 0.731) % 1) * W, a = Math.max(0, Math.sin(ts * 1.6 + ph * 3)); if (a > 0.2) { c.globalAlpha = a; c.fillRect(x, y, 6, 1.4); c.globalAlpha = 1; } }); } },
  { key: 'desert', icon: '🏜️', name: 'CACTUS CANYON', sub: "don't hug the cacti",
    bg: ['#E08A4E', '#BC6534'], fair: ['#A6C05A', '#97B14D'], fringe: '#7E9440', tee: '#BBD472', green: '#B4CD68', flag: '#2E86DE',
    rail: [[12, '#6E2E16'], [8, '#B5562E'], [8, '#8E3A1C', [5, 9]]],
    tex: (c, r, x0, y0, w, h, d) => { c.strokeStyle = '#FFFFFF1A'; c.lineWidth = 2; for (let y = y0; y < y0 + h; y += 26) { c.beginPath(); for (let x = x0; x <= x0 + w + 20; x += 20) c.lineTo(x, y + Math.sin(x / 50 + y) * 5); c.stroke(); } specks(c, r, x0, y0, w, h, N(500, d), ['#A9542A', '#F0A86E', '#8C4422'], 2.2); },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.45) cactus(c, x, y, 8 + r() * 5); else if (q < 0.7) mesa(c, r, x, y, 10 + r() * 8); else { circ(c, x, y, 2.5, '#8C4422'); circ(c, x + 4, y + 1, 1.6, '#A9542A'); } },
    pond: 'water', sand: ['#F7C982', '#C98A44'], bump: { c: ['#FFB27A', '#D9622B', '#6E2E16'], kind: 'spikes' },
    amb: (c, ts, W, front) => { if (!front) return; const x = ((ts * 30 + BOFF * 40) % (W + 80)) - 40, y = W * (0.3 + 0.4 * ((BOFF * 0.37) % 1)) - Math.abs(Math.sin(ts * 3)) * 8; c.strokeStyle = '#8D6E3FCC'; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 9; i++) { const a = ts * 4 + i * 2.1; c.moveTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); c.lineTo(x + Math.cos(a + 2.4) * 5, y + Math.sin(a + 2.4) * 5); } c.stroke(); } },
  { key: 'ice', icon: '❄️', name: 'FROSTY FAIRWAY', sub: 'brrr! mind the frozen pond',
    bg: ['#EEF6FC', '#CFE2F0'], fair: ['#9FD9C2', '#8FCDB4'], fringe: '#78BBA2', tee: '#BDEBD8', green: '#B2E6D2', flag: '#1E88E5', chev: '#2B6C9966',
    rail: [[16, '#9CC0D6'], [12, '#FFFFFF'], [6, '#E3F1F9']],
    tex: (c, r, x0, y0, w, h, d) => { specks(c, r, x0, y0, w, h, N(400, d), ['#FFFFFF', '#BFD8EA', '#DDEBF6'], 2); c.strokeStyle = '#B5CDE0'; c.lineWidth = 1; for (let i = 0; i < N(30, d); i++) { const x = x0 + r() * w, y = y0 + r() * h; c.beginPath(); c.arc(x, y, 10 + r() * 14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.6) pine(c, x, y, 7 + r() * 5); else if (q < 0.72) snowman(c, x, y); else { oval(c, x, y, 6, 3.5, '#9AAAB8'); oval(c, x, y - 1.5, 5, 2.2, '#FFFFFF'); } },
    pond: 'ice', sand: ['#FFFFFF', '#A9C7DC'], bump: { c: ['#E1F5FE', '#81D4FA', '#2B6C99'], kind: 'ice' },
    amb: (c, ts, W, front) => { if (!front) return; c.fillStyle = '#FFFFFF'; c.globalAlpha = 0.85; bits(16, (i, ph) => { const x = (((ph * 0.37) % 1) * W + Math.sin(ts + ph) * 14 + ts * 6) % W, y = (((ph * 0.53) % 1) * W + ts * (18 + (i % 4) * 7)) % W; c.beginPath(); c.arc(x, y, 1 + (i % 3) * 0.6, 0, 7); c.fill(); }); c.globalAlpha = 1; } },
  { key: 'candy', icon: '🍬', name: 'CANDY LAND', sub: 'sweet shots only',
    bg: ['#FFC6DF', '#F7A3C8'], fair: ['#95E6C4', '#80DAB4'], fringe: '#5FC49A', tee: '#B5F0D6', green: '#A8EFD0', flag: '#7C4DFF', chev: '#2E7D5E55',
    rail: [[12, '#C2185B'], [9, '#FFFFFF'], [9, '#E8344E', [9, 9]]],
    tex: (c, r, x0, y0, w, h, d) => { for (let i = 0; i < N(260, d); i++) { c.save(); c.translate(x0 + r() * w, y0 + r() * h); c.rotate(r() * 3.14); c.fillStyle = pick(r, ['#FFFFFF', '#FFEB3B', '#7C4DFF', '#00BFA5', '#FF5252', '#40C4FF']); c.fillRect(-2.5, -0.8, 5, 1.6); c.restore(); } },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.4) lolly(c, r, x, y, 7 + r() * 4); else if (q < 0.65) cane(c, x, y, 8 + r() * 4); else gumdrop(c, r, x, y, 4 + r() * 3); },
    pond: 'choc', sand: ['#FFF0F7', '#FF8FC2'], bump: { c: ['#FFE082', '#FF7043', '#8E2D12'], kind: 'gum' },
    amb: (c, ts, W, front) => { if (!front) return; bits(8, (i, ph) => { const a = Math.max(0, Math.sin(ts * 2 + ph * 4)); if (a < 0.3) return; c.globalAlpha = a; sparkle(c, ((ph * 0.41) % 1) * W, ((ph * 0.67) % 1) * W, 3 + a * 2, '#FFFFFF'); }); c.globalAlpha = 1; } },
  { key: 'lava', icon: '🌋', name: 'LAVA LINKS', sub: 'the floor is lava (some of it)',
    bg: ['#2E2222', '#191010'], fair: ['#6E9A3E', '#618B34'], fringe: '#46692A', tee: '#86B353', green: '#7FAE4B', flag: '#FFC107',
    rail: [[18, '#FF6A1F38'], [11, '#1C1414'], [11, '#FF7A2A', [2, 16]]],
    tex: (c, r, x0, y0, w, h, d) => { specks(c, r, x0, y0, w, h, N(500, d), ['#3E3030', '#120A0A', '#4A3434'], 2.4); c.save(); c.shadowColor = '#FF5A1F'; c.shadowBlur = 8; c.strokeStyle = '#FF7A2A'; c.lineWidth = 1.4; for (let i = 0; i < N(14, d); i++) { let x = x0 + r() * w, y = y0 + r() * h; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; c.lineTo(x, y); } c.stroke(); } c.restore(); },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.18) cone(c, x, y, 12 + r() * 6); else if (q < 0.7) spikeRock(c, r, x, y, 6 + r() * 5); else circ(c, x, y, 2 + r() * 2, '#120A0A'); },
    pond: 'lava', sand: ['#8F8A86', '#4E4A47'], bump: { c: ['#6A5A55', '#3A2E2B', '#120A0A'], kind: 'magma' },
    amb: (c, ts, W, front) => { if (!front) return; bits(14, (i, ph) => { const life = ((ts * 0.25 + ph) % 1), x = ((ph * 0.37) % 1) * W + Math.sin(ts * 2 + ph) * 8, y = W * (1.02 - life * 1.1); c.globalAlpha = (1 - life) * 0.9; circ(c, x, y, 1.4, i % 3 ? '#FF9A3D' : '#FFD54F'); }); c.globalAlpha = 1; } },
  { key: 'space', icon: '🚀', name: 'MOON GOLF', sub: 'one small putt for Fig',
    bg: ['#15123A', '#07061A'], fair: ['#6A5FE0', '#5C51CC'], fringe: '#3F37A0', tee: '#8A80F0', green: '#8279EE', flag: '#00E5FF',
    rail: [[12, '#3D4558'], [8, '#C8D0E0'], [11, '#FFD24A', [2, 18]]],
    tex: (c, r, x0, y0, w, h, d) => { for (let i = 0; i < N(260, d); i++) { const s = r() < 0.9 ? 0.8 : 1.6; c.fillStyle = r() < 0.15 ? '#B3E5FC' : '#FFFFFF'; c.globalAlpha = 0.4 + r() * 0.6; c.fillRect(x0 + r() * w, y0 + r() * h, s, s); } c.globalAlpha = 1; c.fillStyle = '#9E9AAE'; for (let i = 0; i < N(3, d); i++) { const x = x0 + r() * w, y = y0 + r() * h, rr = 50 + r() * 40; c.globalAlpha = 0.08; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); } c.globalAlpha = 1; },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.55) crater(c, x, y, 4 + r() * 8); else if (q < 0.7) planet(c, r, x, y, 5 + r() * 4); else { circ(c, x, y, 3, '#7E7A8E'); circ(c, x - 1, y - 1, 1.5, '#A9A5BA'); } },
    pond: 'void', sand: ['#C3BDD3', '#8C86A0'], bump: { c: ['#B3E5FC', '#4FC3F7', '#01579B'], kind: 'planet' },
    amb: (c, ts, W, front) => { if (front) { const ph = Math.floor(ts / 4 + BOFF), u = ((ts + BOFF * 1.3) % 4) / 0.8; if (u < 1) { const x0 = hash(ph) * W, y0 = hash(ph + 7) * W * 0.5; c.strokeStyle = `rgba(255,255,255,${1 - u})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + u * 120, y0 + u * 60); c.lineTo(x0 + u * 120 - 30, y0 + u * 60 - 15); c.stroke(); } return; } bits(10, (i, ph) => { const a = Math.max(0, Math.sin(ts * 3 + ph * 5)); c.globalAlpha = a; sparkle(c, ((ph * 0.29) % 1) * W, ((ph * 0.83) % 1) * W, 2.5, '#FFFFFF'); }); c.globalAlpha = 1; } },
  { key: 'castle', icon: '🏰', name: 'CASTLE GREENS', sub: 'putt for the crown',
    bg: ['#4F7D3E', '#3B6430'], fair: ['#5FAE4A', '#52A03F'], fringe: '#3C7D2E', tee: '#77C35F', green: '#70BE58', flag: '#FFD600',
    rail: [[13, '#5A5652'], [9, '#A7A29C'], [13, '#5A5652', [1.5, 10]]],
    tex: (c, r, x0, y0, w, h, d) => { specks(c, r, x0, y0, w, h, N(600, d), ['#5C8C48', '#33582A', '#6B9A55']); for (let i = 0; i < N(40, d); i++) { const x = x0 + r() * w, y = y0 + r() * h; oval(c, x, y, 4 + r() * 3, 2.5 + r() * 2, '#8F8A84'); oval(c, x - 1, y - 1, 2.5, 1.4, '#B3AEA7'); } },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.25) tower(c, x, y, 9 + r() * 4); else if (q < 0.65) tree(c, x, y, 6 + r() * 4, '#2F6B27', '#4E9A3C'); else flowers(c, r, x, y); },
    pond: 'moat', sand: ['#E2CC8E', '#B3995A'], bump: { c: ['#E0C27A', '#A57A3A', '#4A3216'], kind: 'barrel' },
    amb: () => {},
    // bunting strung across the top of the course (once, not per tile)
    once: (c, ts, bb, front) => { if (!front) return; const n = Math.max(6, Math.round((bb.x1 - bb.x0) / 36)), y0 = bb.y0 - 16, sag = 12; c.strokeStyle = '#5A3A1E'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= n; i++) c.lineTo(bb.x0 + (bb.x1 - bb.x0) * i / n, y0 + Math.sin(i / n * Math.PI) * sag); c.stroke(); for (let i = 0; i < n; i++) { const x = bb.x0 + (bb.x1 - bb.x0) * (i + 0.5) / n, y = y0 + Math.sin((i + 0.5) / n * Math.PI) * sag, sw = Math.sin(ts * 3 + i) * 3; c.fillStyle = ['#D62839', '#FFD600', '#1E88E5'][i % 3]; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + sw, y + 12); c.closePath(); c.fill(); } } },
  { key: 'reef', icon: '🐠', name: 'CORAL REEF', sub: 'bubbles up!',
    bg: ['#137BAE', '#07466E'], fair: ['#3FC1AE', '#36B09F'], fringe: '#2A8C80', tee: '#5FD6C4', green: '#5ACFBD', flag: '#FF7043',
    rail: [[12, '#9C3B2F'], [8, '#F28C6B'], [8, '#FFC1A8', [3, 7]]],
    tex: (c, r, x0, y0, w, h, d) => { c.fillStyle = '#FFFFFF10'; for (let i = 0; i < N(5, d); i++) { const x = x0 + r() * w; c.beginPath(); c.moveTo(x - 20, y0); c.lineTo(x + 30, y0); c.lineTo(x + 30 + h * 0.1, y0 + h); c.lineTo(x - 20 + h * 0.1, y0 + h); c.closePath(); c.fill(); } specks(c, r, x0, y0, w, h, N(300, d), ['#E9D9A655', '#FFFFFF22', '#0A3A5A'], 2); },
    deco: (c, r, x, y) => { const q = r(); if (q < 0.4) seaweed(c, r, x, y, 10 + r() * 6); else if (q < 0.75) coral(c, r, x, y, 9 + r() * 5); else star5(c, x, y, 4, pick(r, ['#FF7043', '#FFCA28', '#F06292'])); },
    pond: 'deep', sand: ['#EEDFAE', '#BFA56A'], bump: { c: ['#FFE082', '#FFA726', '#8D4A00'], kind: 'spikes' },
    amb: (c, ts, W, front) => { if (!front) return; c.strokeStyle = '#FFFFFFAA'; c.lineWidth = 1; bits(10, (i, ph) => { const life = ((ts * 0.18 + ph) % 1), x = ((ph * 0.43) % 1) * W + Math.sin(ts * 2 + ph * 3) * 5, y = W * (1.05 - life * 1.15); c.beginPath(); c.arc(x, y, 1.5 + (i % 3), 0, 7); c.stroke(); }); } },
];
const worldFor = (h) => WORLDS[(((h && h.hi) || 0) % WORLDS.length + WORLDS.length) % WORLDS.length];

// ---------------------------------------------------------------- geometry helpers
const pathPts = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.closePath(); };
const inside = (x, y, pts) => { let k = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) k = !k; } return k; };
const edgeDist = (x, y, pts) => { let best = Infinity; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1; let u = ((x - x1) * dx + (y - y1) * dy) / L2; u = u < 0 ? 0 : u > 1 ? 1 : u; const d = Math.hypot(x1 + u * dx - x, y1 + u * dy - y); if (d < best) best = d; } return best; };
const bbox = (pts) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; pts.forEach(([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }); return { x0, y0, x1, y1 }; };
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); };
// the part of the course on screen (course units) and how many pixels a unit is, from the context's transform
function viewOf(c) {
  const m = c.getTransform(), det = m.a * m.d - m.b * m.c, W = c.canvas.width, H = c.canvas.height;
  if (!det) return { x0: -PAD, y0: -PAD, x1: LW + PAD, y1: LH + PAD, k: 1 };
  const ia = m.d / det, ib = -m.b / det, ic = -m.c / det, id = m.a / det, ie = (m.c * m.f - m.d * m.e) / det, iff = (m.b * m.e - m.a * m.f) / det;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  [[0, 0], [W, 0], [0, H], [W, H]].forEach(([x, y]) => { const u = ia * x + ic * y + ie, v = ib * x + id * y + iff; if (u < x0) x0 = u; if (u > x1) x1 = u; if (v < y0) y0 = v; if (v > y1) y1 = v; });
  return { x0, y0, x1, y1, k: Math.sqrt(Math.abs(det)) };
}

// ---------------------------------------------------------------- the static layer, once a hole
// An LRU of a few canvases, keyed by the hole's outline (twists, fixes and attacks copy the hole but keep its outline,
// so they share one), the place, the course size and a tier: 'hi' for the page (≤ MAX_PX, ≤ MAX_K px a unit) and 'lo'
// for small drawings (the cup's miniature two holes down, a lobby card).
const LAYERS = [], KEEP = { hi: 2, lo: 3 };   // hi: the hole in play and the next one (its cup miniature)
function layerFor(h, th, need) {
  const tier = need > 0.7 ? 'hi' : 'lo';
  const hit = LAYERS.find((L) => L.outline === h.outline && L.tier === tier && L.key === th.key && L.LW === LW && L.LH === LH);
  if (hit) { LAYERS.splice(LAYERS.indexOf(hit), 1); LAYERS.push(hit); return hit; }
  const aw = LW + 2 * PAD, ah = LH + 2 * PAD, cap = Math.min(MAX_K, Math.sqrt(MAX_PX / (aw * ah))), s = tier === 'hi' ? cap : Math.min(cap, 0.7);
  const cv = document.createElement('canvas'); cv.width = Math.ceil(aw * s); cv.height = Math.ceil(ah * s);
  paintLayer(cv.getContext('2d', { alpha: false }), h, th, s);   // opaque: a cheaper blit
  const L = { outline: h.outline, tier, key: th.key, LW, LH, cv, s };
  LAYERS.push(L);
  const mine = LAYERS.filter((q) => q.tier === tier);
  if (mine.length > KEEP[tier]) LAYERS.splice(LAYERS.indexOf(mine[0]), 1);
  return L;
}
function paintLayer(c, h, th, s) {
  const ds = Math.sqrt(COURSE), pts = h.outline, aw = LW + 2 * PAD, ah = LH + 2 * PAD;
  const seed = ((h.hi || 0) * 2654435761 + Math.round(pts[0][0] * 31 + pts[0][1] * 17 + h.tee[0] * 7 + h.cup[1] * 13)) >>> 0, r = rng(seed);
  c.setTransform(s, 0, 0, s, PAD * s, PAD * s); c.lineCap = 'round'; c.lineJoin = 'round';
  const gr = c.createLinearGradient(0, -PAD, 0, LH + PAD); gr.addColorStop(0, th.bg[0]); gr.addColorStop(1, th.bg[1]); c.fillStyle = gr; c.fillRect(-PAD, -PAD, aw, ah);
  th.tex(c, r, -PAD, -PAD, aw, ah, (aw * ah) / (400 * 700));
  // the tropics: the course sits on an island, a shallow ring of surf and then the beach
  if (th.island) {
    const out = (w, col) => { c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; pathPts(c, pts); c.stroke(); c.fill(); };
    out(2 * (th.near + 17) * ds, th.island[0]); out(2 * (th.near + 7) * ds, th.island[1]);
    c.save(); c.globalAlpha = 0.45; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2 * (th.near + 10) * ds; pathPts(c, pts); c.stroke(); c.restore();
    c.strokeStyle = th.island[1]; c.lineWidth = 2 * (th.near + 7) * ds; pathPts(c, pts); c.stroke();
    c.fillStyle = '#E8C77A55'; for (let i = 0; i < 300 * ds; i++) { const x = r() * LW, y = r() * LH; if (!inside(x, y, pts) && edgeDist(x, y, pts) < (th.near + 5) * ds) c.fillRect(x, y, 1.6, 1.6); }
  }
  // decorations off the course (on the beach for the tropics), clear of it and of each other, back to front
  const lo = 16 * ds, hi = (th.near ? th.near - 4 : 90) * ds, sp = 24 * ds, ds0 = [];
  let perim = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; perim += Math.hypot(q[0] - p[0], q[1] - p[1]); });
  const want = Math.min(320, Math.round(perim * (hi - lo) / (1500 * ds * ds)));
  for (let i = 0; i < want * 14 && ds0.length < want; i++) {
    const x = -PAD + 10 + r() * (aw - 20), y = -PAD + 10 + r() * (ah - 20);
    if (inside(x, y, pts)) continue;
    const d = edgeDist(x, y, pts); if (d < lo || d > hi) continue;
    const ty = y - 24 * ds; if (inside(x, ty, pts) || edgeDist(x, ty, pts) < 8 * ds) continue;   // tall things don't reach the rails
    if (ds0.some((o) => Math.hypot(o.x - x, o.y - y) < sp)) continue;
    ds0.push({ x, y, k: r() });
  }
  ds0.sort((a, b) => a.y - b.y).forEach((o) => { const q = rng(Math.floor(o.k * 1e9)); c.save(); c.translate(o.x, o.y); c.scale(ds, ds); th.deco(c, q, 0, 0); c.restore(); });
  // the course's drop shadow
  c.save(); c.translate(2, 4); c.fillStyle = c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = th.rail[0][0] + 4; pathPts(c, pts); c.stroke(); c.fill(); c.restore();
  // a gentle vignette so the edges sit back
  const vg = c.createRadialGradient(LW / 2, LH / 2, Math.min(LW, LH) * 0.35, LW / 2, LH / 2, Math.hypot(LW, LH) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.28)'); c.fillStyle = vg; c.fillRect(-PAD, -PAD, aw, ah);
}

// ---------------------------------------------------------------- hazards, every frame
function drawPond(c, [px, py, w, h], kind, ts) {
  const x = px + w / 2, y = py + h / 2, rx = w / 2, ry = h / 2, sd = Math.floor(px * 7 + py * 13), rad = Math.min(14, w / 3, h / 3);
  const bank = { water: '#D9C68C', moat: '#7E7A74', lava: '#2A1A14', ice: '#FFFFFF', void: '#3A2A6A', choc: '#FFF0F7', deep: '#E9D9A6' }[kind] || '#D9C68C';
  c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, px - 3, py, w + 7, h + 7, rad + 3); c.fill();
  c.fillStyle = bank; rr(c, px - 3.5, py - 3.5, w + 7, h + 7, rad + 3.5); c.fill();
  c.save();   // no clip: an antialiased clip under many strokes is the slow path on phones; the ripples stay inside
  const lin = (a, b) => { const gr = c.createLinearGradient(x, py, x, py + h); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  const radg = (a, b) => { const gr = c.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry)); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  if (kind === 'lava') {
    c.fillStyle = lin('#FFC24A', '#D8340F'); rr(c, px, py, w, h, rad); c.fill();
    for (let i = 0; i < 4; i++) { const qx = x + Math.sin(ts * 0.6 + i * 1.7 + sd) * rx * 0.6, qy = y + Math.cos(ts * 0.5 + i * 2.3) * ry * 0.5; oval(c, qx, qy, Math.min(rx * 0.28, 30), Math.min(ry * 0.22, 18), '#7A1E0A99'); }
    for (let j = 0; j < 2; j++) { const u = (ts * 0.8 + sd * 0.01 + j * 0.5) % 1; c.strokeStyle = `rgba(255,240,180,${1 - u})`; c.lineWidth = 1.2; c.beginPath(); c.arc(x + Math.sin(sd + j * 2) * rx * 0.5, y + Math.cos(sd + j) * ry * 0.4, 1 + u * 5, 0, 7); c.stroke(); }
  } else if (kind === 'ice') {
    c.fillStyle = lin('#F4FCFF', '#9ED3EC'); rr(c, px, py, w, h, rad); c.fill();
    c.strokeStyle = '#FFFFFFCC'; c.lineWidth = 0.9; c.beginPath(); for (let i = 0; i < 5; i++) { const a = hash(sd + i) * 6.28; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * rx * 0.5, y + Math.sin(a) * ry * 0.5); c.lineTo(x + Math.cos(a + 0.4) * rx, y + Math.sin(a + 0.4) * ry); } c.stroke();
    const gx = px + 14 + ((ts * 0.5) % 1.6) * w; if (gx < px + w - 8) { c.fillStyle = '#FFFFFF88'; c.beginPath(); c.moveTo(gx, py + 3); c.lineTo(gx + 8, py + 3); c.lineTo(gx - 6, py + h - 3); c.lineTo(gx - 14, py + h - 3); c.fill(); }
  } else if (kind === 'void' || kind === 'deep') {
    c.fillStyle = kind === 'void' ? radg('#000000', '#6A3BC8') : radg('#04203A', '#2A86B8'); rr(c, px, py, w, h, rad); c.fill();
    c.strokeStyle = kind === 'void' ? '#C9A6FFAA' : '#FFFFFF77'; c.lineWidth = 1.3;
    for (let j = 0; j < 3; j++) { c.beginPath(); for (let a = 0; a < 5; a += 0.25) { const q = 1 - a / 5, ang = a + ts * (kind === 'void' ? 1.8 : -1.2) + j * 2.09; c.lineTo(x + Math.cos(ang) * rx * q, y + Math.sin(ang) * ry * q); } c.stroke(); }
    if (kind === 'void') bits(5, (i, ph) => { circ(c, x + Math.cos(ph + ts) * rx * 0.7, y + Math.sin(ph + ts) * ry * 0.7, 0.8, '#FFFFFF'); });
  } else {
    const [a, b] = kind === 'choc' ? ['#9A6440', '#4A2A18'] : kind === 'moat' ? ['#3E7FA8', '#1D4A6A'] : ['#6FD3F7', '#1F86C2'];
    c.fillStyle = lin(a, b); rr(c, px, py, w, h, rad); c.fill();
    c.strokeStyle = kind === 'choc' ? '#C48A64AA' : '#FFFFFFAA'; c.lineWidth = 1.2;
    const rows = Math.max(2, Math.min(6, Math.round(h / 22))), cols = Math.max(1, Math.min(6, Math.round(w / 70)));
    c.beginPath(); for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const ph = ts * 1.5 + i * 2.1 + j * 1.3 + sd, ox = Math.sin(ph) * (w / cols) * 0.2, cx = px + (j + 0.5) * w / cols + ox, cy = py + (i + 0.5) * h / rows, ex = w / cols * 0.22, ey = Math.min(5, h / rows * 0.3); c.moveTo(cx + Math.cos(Math.PI * 1.1) * ex, cy + Math.sin(Math.PI * 1.1) * ey); c.ellipse(cx, cy, ex, ey, 0, Math.PI * 1.1, Math.PI * 1.9); } c.stroke();
    if (kind === 'choc') { c.strokeStyle = '#E6B38E88'; c.beginPath(); for (let a = 0; a < 9; a += 0.3) c.lineTo(x + Math.cos(a + ts) * a / 9 * rx * 0.6, y + Math.sin(a + ts) * a / 9 * ry * 0.6); c.stroke(); }
    if (kind === 'moat') { c.fillStyle = '#4E8A3A'; for (let i = 0; i < 3; i++) { const lx = px + (hash(sd + i) * 0.8 + 0.1) * w + Math.sin(ts * 0.4 + i) * 3, ly = py + (hash(sd + i + 9) * 0.8 + 0.1) * h; c.beginPath(); c.arc(lx, ly, 4, 0.4, 5.9); c.lineTo(lx, ly); c.fill(); } }
  }
  c.restore();
  c.strokeStyle = '#ffffff40'; c.lineWidth = 1; rr(c, px + 1.5, py + 1.5, w - 3, h - 3, rad); c.stroke();
}
function drawSand(c, [x, y, w, h], th) {
  const [base, grain] = th.sand, sd = Math.floor(x * 3 + y * 5), rad = Math.min(w, h) / 2.2;
  // how far in the rounded corners push a row at depth k
  const inset = (k) => { const q = k < rad ? rad - k : k > h - rad ? k - (h - rad) : 0; return q > 0 ? rad - Math.sqrt(Math.max(0, rad * rad - q * q)) : 0; };
  c.fillStyle = 'rgba(0,0,0,0.18)'; rr(c, x + 1, y + 2, w + 2, h + 2, rad); c.fill();
  rr(c, x, y, w, h, rad); c.fillStyle = base; c.fill();
  c.fillStyle = '#ffffff30'; c.beginPath(); c.ellipse(x + w * 0.4, y + h * 0.36, w * 0.3, h * 0.24, 0, 0, 7); c.fill();
  // rake lines (no clip: each row stops short of the rounded ends)
  c.strokeStyle = grain; c.globalAlpha = 0.35; c.lineWidth = 0.8; c.beginPath();
  for (let k = 6; k < h - 3; k += 8) { const e = inset(k) + 3, x0 = x + e, x1 = x + w - e; if (x1 - x0 < 6) continue; c.moveTo(x0, y + k + Math.sin(x0 / 9 + k) * 1.5); for (let xx = x0 + 12; xx < x1; xx += 12) c.lineTo(xx, y + k + Math.sin(xx / 9 + k) * 1.5); c.lineTo(x1, y + k + Math.sin(x1 / 9 + k) * 1.5); }
  c.stroke();
  c.globalAlpha = 0.8; const n = Math.min(90, Math.round(w * h / 120));
  for (let i = 0; i < n; i++) { const gy = hash(sd + i * 7 + 3) * h, e = inset(gy) + 2, gx = e + hash(sd + i) * Math.max(0, w - 2 * e); c.fillStyle = th.key === 'candy' ? ['#FF5252', '#7C4DFF', '#00BFA5', '#FFEB3B'][i % 4] : i % 2 ? grain : '#FFFFFF'; c.fillRect(x + gx, y + gy, 1.2, 1.2); }
  c.globalAlpha = 1;
  c.strokeStyle = grain; c.lineWidth = 1.5; rr(c, x, y, w, h, rad); c.stroke();
}
function drawMud(c, [x, y, w, h]) {
  c.save(); c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); c.fillStyle = '#6B4A2B'; c.fill(); c.clip();
  c.fillStyle = '#4E3420'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(x + ((i * 37) % w), y + ((i * 23) % h), 4, 2.5, 0, 0, 7); c.fill(); }
  c.fillStyle = '#8A6A45'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(x + ((i * 53 + 11) % w), y + ((i * 29 + 7) % h), 1.6, 0, 7); c.fill(); }
  c.restore();
}
function drawBumper(c, [x, y, r], th, ts, lit) {
  const [li, mid, dk] = th.bump.c, kind = th.bump.kind;
  oval(c, x + 2, y + 3.5, r * 1.05, r * 0.8, 'rgba(0,0,0,0.3)');
  if (lit) { circ(c, x, y, r + 9, 'rgba(255,224,138,0.35)'); circ(c, x, y, r + 4, 'rgba(255,224,138,0.6)'); }
  if (kind === 'spikes') { c.fillStyle = dk; c.beginPath(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + (x % 1); c.moveTo(x + Math.cos(a - 0.18) * r * 0.9, y + Math.sin(a - 0.18) * r * 0.9); c.lineTo(x + Math.cos(a) * (r + 3.5), y + Math.sin(a) * (r + 3.5)); c.lineTo(x + Math.cos(a + 0.18) * r * 0.9, y + Math.sin(a + 0.18) * r * 0.9); } c.fill(); }
  const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, lit ? '#FFF8D0' : li); gr.addColorStop(0.55, lit ? '#FFE08A' : mid); gr.addColorStop(1, dk);
  c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = dk; c.lineWidth = 1.6; c.stroke();
  if (kind === 'barrel') { c.strokeStyle = '#3A3A3A'; c.lineWidth = 1.3; c.beginPath(); c.arc(x, y, r * 0.62, 0, 7); c.stroke(); }
  else if (kind === 'magma') { c.strokeStyle = `rgba(255,${120 + Math.sin(ts * 4 + x) * 60},40,0.95)`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.1); c.lineTo(x - r * 0.1, y + r * 0.2); c.lineTo(x + r * 0.2, y - r * 0.4); c.moveTo(x - r * 0.1, y + r * 0.2); c.lineTo(x + r * 0.1, y + r * 0.7); c.stroke(); }
  else if (kind === 'planet') { c.strokeStyle = '#FFFFFFCC'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, r * 1.6, r * 0.42, -0.4, 0, 7); c.stroke(); }
  else if (kind === 'gum') { for (let i = 0; i < 6; i++) circ(c, x + Math.cos(i * 1.05) * r * 0.55, y + Math.sin(i * 1.05) * r * 0.55, Math.max(0.9, r * 0.07), '#FFFFFFCC'); }
  else if (kind === 'coco') { c.strokeStyle = '#2A1608'; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * 0.8; c.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); c.lineTo(x + Math.cos(a + 0.3) * r * 0.85, y + Math.sin(a + 0.3) * r * 0.85); } c.stroke(); circ(c, x - r * 0.15, y + r * 0.08, r * 0.09, '#2A1608'); circ(c, x + r * 0.15, y + r * 0.08, r * 0.09, '#2A1608'); }
  else if (kind === 'ice') { c.strokeStyle = '#FFFFFFAA'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; c.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6); c.lineTo(x - Math.cos(a) * r * 0.6, y - Math.sin(a) * r * 0.6); } c.stroke(); }
  else { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, r * 0.55, 0, 7); c.fill(); c.fillStyle = lit ? '#F2C14E' : mid; c.beginPath(); c.arc(x, y, r * 0.28, 0, 7); c.fill(); }
  oval(c, x - r * 0.35, y - r * 0.45, r * 0.35, r * 0.2, '#ffffffaa');
}
// a block is a solid wall in the rails' colours: the outer stroke a rim, the middle the body, a dashed one down its spine
function drawBlock(c, [x, y, w, h], th) {
  const rail = th.rail, base = rail[1][0], rad = Math.min(5, w / 2, h / 2);
  c.fillStyle = 'rgba(0,0,0,0.32)'; rr(c, x + 2, y + 4, w, h, rad); c.fill();
  rail.forEach(([lw, col, dash]) => {
    if (dash) { c.save(); c.strokeStyle = col; c.lineWidth = Math.max(1.5, Math.min(w, h) * 0.3); c.setLineDash(dash); c.lineCap = 'butt'; c.beginPath(); if (w >= h) { c.moveTo(x + 3, y + h / 2); c.lineTo(x + w - 3, y + h / 2); } else { c.moveTo(x + w / 2, y + 3); c.lineTo(x + w / 2, y + h - 3); } c.stroke(); c.restore(); return; }
    const e = (lw - base) / 4; c.fillStyle = col; rr(c, x - e, y - e, w + 2 * e, h + 2 * e, rad + e); c.fill();
  });
  c.fillStyle = '#ffffff30'; if (w >= h) c.fillRect(x + 3, y + 2, w - 6, Math.min(3, h / 4)); else c.fillRect(x + 2, y + 3, Math.min(3, w / 4), h - 6);
}
// the cup: an apron of green, the hole with its shadow, the fractal miniature (kept exactly as drawHole has it) and a lip
function drawCup(c, h, th, scene) {
  const [cx, cy] = h.cup, cupR = h.cupR || CUP_R;
  circ(c, cx, cy, cupR + 10, th.green + '99'); circ(c, cx, cy, cupR + 5, th.green);
  const gr = c.createRadialGradient(cx, cy + cupR * 0.35, cupR * 0.1, cx, cy, cupR); gr.addColorStop(0, '#000000'); gr.addColorStop(1, '#1C2A1C');
  c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, cupR, 0, 7); c.fill();
  if (scene.cupArt) {
    const dg = Math.hypot(BW, BH), iw = cupR * 2 * BW / dg, ih = cupR * 2 * BH / dg, dk = scene.cupDark ?? 1;
    c.save(); c.beginPath(); c.arc(cx, cy, cupR, 0, 7); c.clip();
    c.drawImage(scene.cupArt, cx - iw / 2, cy - ih / 2, iw, ih);
    if (dk > 0) { const g = c.createRadialGradient(cx, cy, 0, cx, cy, cupR); g.addColorStop(0, `rgba(11,26,18,${0.35 * dk})`); g.addColorStop(1, `rgba(11,26,18,${0.95 * dk})`); c.fillStyle = g; c.fillRect(cx - cupR, cy - cupR, cupR * 2, cupR * 2); }
    c.restore();
  } else { c.fillStyle = '#00000066'; c.beginPath(); c.arc(cx, cy, cupR, Math.PI, 0); c.arc(cx, cy + cupR * 0.3, cupR * 0.92, 0, Math.PI, true); c.fill(); }
  c.strokeStyle = '#FFFFFFCC'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, cupR, 0, 7); c.stroke();
}
function drawFlag(c, [cx, cy], th, ts, kick) {
  const top = cy - 36;
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 16, cy + 7); c.stroke();
  c.strokeStyle = '#F4F4F4'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, top); c.stroke(); circ(c, cx, top, 1.8, '#FFD54F');
  const kk = 1 + 5 * kick, wv = (u) => Math.sin(ts * (6 + 10 * kick) - u * 0.35) * 2.4 * kk * (u / 18);   // a kicked flag flaps hard, then settles
  c.fillStyle = th.flag; c.beginPath(); for (let u = 0; u <= 18; u += 3) c.lineTo(cx + u, top + 1 + wv(u) + u * 0.12); for (let u = 18; u >= 0; u -= 3) c.lineTo(cx + u, top + 12 + wv(u) - u * 0.12); c.closePath(); c.fill();
  c.fillStyle = '#ffffff40'; c.beginPath(); for (let u = 0; u <= 18; u += 3) c.lineTo(cx + u, top + 1 + wv(u) + u * 0.12); for (let u = 18; u >= 0; u -= 3) c.lineTo(cx + u, top + 5 + wv(u)); c.closePath(); c.fill();
}
// the tile-anchored animated bits, only on the tiles in view
function drawAmb(c, th, ts, v, front) {
  if (v.k < 0.35) return;   // far out, the bits would be specks
  const tx0 = Math.max(-1, Math.floor(v.x0 / TILE)), tx1 = Math.min(Math.ceil((LW + PAD) / TILE), Math.floor(v.x1 / TILE));
  const ty0 = Math.max(-1, Math.floor(v.y0 / TILE)), ty1 = Math.min(Math.ceil((LH + PAD) / TILE), Math.floor(v.y1 / TILE));
  if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 40) return;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    BOFF = ((tx + 3) * 7 + (ty + 3) * 13) * 0.731; c.save(); c.translate(tx * TILE, ty * TILE); th.amb(c, ts + BOFF * 0.37, TILE, front); c.restore();
  }
  BOFF = 0;
}
let lastFace = 1;
function drawWorld(c, h, t, scene = {}) {
  const th = worldFor(h), ts = reduceMotion ? 0 : t / 1000, S = COURSE, pts = h.outline, v = viewOf(c), bb = bbox(pts);
  // the ground, its texture, the decorations and the island, painted once a hole
  const L = layerFor(h, th, v.k);
  // only the part in view (a whole-layer blit costs the full upscale in software)
  { const x0 = Math.max(-PAD, Math.floor(v.x0) - 2), y0 = Math.max(-PAD, Math.floor(v.y0) - 2), x1 = Math.min(LW + PAD, Math.ceil(v.x1) + 2), y1 = Math.min(LH + PAD, Math.ceil(v.y1) + 2);
    if (x1 > x0 && y1 > y0) { const sx = (x0 + PAD) * L.s, sy = (y0 + PAD) * L.s, sw = Math.min(L.cv.width - sx, (x1 - x0) * L.s), sh = Math.min(L.cv.height - sy, (y1 - y0) * L.s); c.drawImage(L.cv, sx, sy, sw, sh, x0, y0, sw / L.s, sh / L.s); } }
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  drawAmb(c, th, ts, v, false);
  // rails, outermost first (their inner halves go under the fairway)
  th.rail.forEach(([w, col, dash]) => { c.strokeStyle = col; c.lineWidth = w; if (dash) c.setLineDash(dash); pathPts(c, pts); c.stroke(); if (dash) c.setLineDash([]); });
  // the fairway: mown stripes across the line from tee to cup, a green round the cup and a fringe at the rails
  c.save(); pathPts(c, pts); c.fillStyle = th.fair[0]; c.fill(); c.clip();
  { const a0 = Math.atan2(h.cup[1] - h.tee[1], h.cup[0] - h.tee[0]) + Math.PI / 2, sw = 16 * Math.sqrt(S), D = Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0) / 2 + sw;
    c.save(); c.translate((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2); c.rotate(a0); c.fillStyle = th.fair[1]; for (let x = -D; x < D; x += 2 * sw) c.fillRect(x, -D, sw, 2 * D); c.restore(); }
  { const [gx, gy] = h.cup, gA = 34 * Math.min(1.6, Math.sqrt(S)); circ(c, gx, gy, gA + 7, th.green + '77'); circ(c, gx, gy, gA, th.green); }
  c.strokeStyle = th.fringe; c.lineWidth = 7; pathPts(c, pts); c.stroke();
  if (h.ice) { c.fillStyle = '#CFF3FF55'; c.fillRect(bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0); c.strokeStyle = '#ffffff88'; c.lineWidth = 1; c.beginPath();
    for (let i = 0, n = Math.round(40 * S * S); i < n; i++) { const x = (i * 83) % LW, y = (i * 137) % LH; c.moveTo(x, y); c.lineTo(x + 14, y - 6); } c.stroke(); }
  if (h.wind) { c.strokeStyle = '#ffffff66'; c.lineWidth = 2; const dir = Math.sign(h.wind[0]) || 1; c.beginPath();
    for (let i = 0, n = Math.round(14 * S); i < n; i++) { const y = (i * 41 * S) % LH + 10, off = reduceMotion ? 0 : ((t / 6) * dir * S + i * 57) % (LW + 80); const x = dir > 0 ? off - 40 : LW + 40 - off; c.moveTo(x, y); c.lineTo(x + 26 * dir, y); } c.stroke(); }
  // slopes: drifting chevrons
  h.slopes.forEach((sl) => {
    const [x, y, w, hh] = sl.r, ang = Math.atan2(sl.a[1], sl.a[0]); c.save(); c.beginPath(); c.rect(x, y, w, hh); c.clip();
    c.fillStyle = '#ffffff10'; c.fillRect(x, y, w, hh);
    c.strokeStyle = th.chev || '#ffffff40'; c.lineWidth = 3; c.lineCap = 'round';
    const off = reduceMotion ? 0 : (t / 40) % 36, ca = Math.cos(ang), sa = Math.sin(ang); c.beginPath();
    for (let gx = x - 36; gx < x + w + 36; gx += 36) for (let gy = y + 18; gy < y + hh; gy += 36) {
      const ox = gx + ca * off, oy = gy + sa * off, P = (u, q) => [ox + u * ca - q * sa, oy + u * sa + q * ca];
      const p1 = P(-5, -7), p2 = P(3, 0), p3 = P(-5, 7); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]);
    }
    c.stroke(); c.restore();
  });
  c.restore();
  // hazards
  h.sand.forEach((s) => drawSand(c, s, th));
  (h.mud || []).forEach((m) => drawMud(c, m));
  h.water.forEach((w) => drawPond(c, w, th.pond, ts));
  // the tee box, squared to the line to the cup
  { const [tx, ty] = h.tee, a = Math.atan2(h.cup[1] - ty, h.cup[0] - tx); c.save(); c.translate(tx, ty); c.rotate(a); c.fillStyle = th.tee; rr(c, -14, -18, 26, 36, 5); c.fill(); c.strokeStyle = '#ffffff55'; c.lineWidth = 1; c.stroke(); circ(c, 2, -14, 2.4, '#FFFFFF'); circ(c, 2, 14, 2.4, '#FFFFFF'); c.restore(); }
  h.blocks.forEach((b) => drawBlock(c, b, th));
  // a labyrinth's walls in the rails' colours
  if (h.walls && h.walls.length) {
    const wallPath = () => { c.beginPath(); h.walls.forEach(([x1, y1, x2, y2]) => { c.moveTo(x1, y1); c.lineTo(x2, y2); }); };
    c.save(); c.translate(2, 3); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = th.rail[1][0] * 0.9 + 2; wallPath(); c.stroke(); c.restore();
    th.rail.forEach(([w, col, dash]) => { c.strokeStyle = col; c.lineWidth = dash ? Math.min(w, th.rail[1][0]) * 0.4 : w * 0.75; if (dash) c.setLineDash(dash); wallPath(); c.stroke(); if (dash) c.setLineDash([]); });
  }
  h.bumpers.forEach((b, i) => drawBumper(c, b, th, ts, !!(scene.bumpLit && scene.bumpLit[i] > t)));
  // windmills: blades in the rails' colours, the flag's colour down the middle
  { const clock = scene.ball && scene.ball.clock !== undefined ? scene.ball.clock : (scene.clock || 0);
    h.spinners.forEach((sp) => bladeSegs(sp, clock).forEach(([x1, y1, x2, y2]) => {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 9; c.beginPath(); c.moveTo(x1 + 2, y1 + 3); c.lineTo(x2 + 2, y2 + 3); c.stroke();
      c.strokeStyle = th.rail[1][1]; c.lineWidth = 8; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = th.flag; c.lineWidth = 3; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
    })); }
  // gopher holes: a ring of dug-up dirt round a dark hole (and now and then, a gopher)
  (h.gophers || []).forEach(([gx, gy], i) => {
    c.fillStyle = '#7A5230'; c.beginPath(); c.ellipse(gx, gy + 1, GOPH_R + 5, GOPH_R + 3.5, 0, 0, 7); c.fill();
    c.fillStyle = '#A0703F'; for (let k = 0; k < 6; k++) { const a = k * 1.05 + i; c.beginPath(); c.arc(gx + Math.cos(a) * (GOPH_R + 4), gy + Math.sin(a) * (GOPH_R + 3), 2, 0, 7); c.fill(); }
    c.fillStyle = '#1B120B'; c.beginPath(); c.arc(gx, gy, GOPH_R, 0, 7); c.fill();
    if (!reduceMotion && Math.sin(t / 900 + i * 2.3) > 0.93) { c.font = '13px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🐹', gx, gy - 3); }
  });
  // 🔧 what a fix can clear: a faint pulsing dashed outline
  if (scene.fixable) {
    c.save(); c.strokeStyle = '#FFFFFF'; c.globalAlpha = 0.3 + 0.25 * Math.sin(t / 280); c.lineWidth = 1.5; c.setLineDash([6, 5]); c.lineDashOffset = reduceMotion ? 0 : -t / 60;
    c.beginPath(); h.bumpers.forEach(([x, y, r]) => { c.moveTo(x + r + 5, y); c.arc(x, y, r + 5, 0, 7); }); c.stroke();
    ['blocks', 'water', 'mud', 'sand'].forEach((k) => (h[k] || []).forEach(([x, y, w, hh]) => { rr(c, x - 5, y - 5, w + 10, hh + 10, 8); c.stroke(); }));
    c.restore();
  }
  drawCup(c, h, th, scene);
  // the rolling trail: a fading streak
  const tr = scene.trail;
  if (tr && tr.length > 1) for (let i = 1; i < tr.length; i++) { const u = i / tr.length; c.strokeStyle = `rgba(255,255,255,${0.35 * u})`; c.lineWidth = R * 1.4 * u; c.beginPath(); c.moveTo(tr[i - 1].x, tr[i - 1].y); c.lineTo(tr[i].x, tr[i].y); c.stroke(); }
  // aiming: a band back from the ball, dots along the way it'll go, an arrowhead and a power ring (green → gold → red)
  if (scene.aim) {
    const { bx, by, dx, dy, p } = scene.aim, len = 24 + p * 126, col = `hsl(${120 - 120 * p}, 95%, 58%)`;
    c.strokeStyle = '#ffffff66'; c.lineWidth = 2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - dx * len * 0.45, by - dy * len * 0.45); c.stroke(); c.setLineDash([]);
    const n = Math.max(3, Math.floor(len / 10));
    for (let i = 1; i <= n; i++) { const u = i / n, qx = bx + dx * len * u, qy = by + dy * len * u; c.globalAlpha = 1 - u * 0.65; circ(c, qx, qy, 3.2 - u * 1.6, '#102010'); circ(c, qx, qy, 2.4 - u * 1.3, col); }
    c.globalAlpha = 1; const ex = bx + dx * len, ey = by + dy * len, a = Math.atan2(dy, dx);
    c.fillStyle = col; c.beginPath(); c.moveTo(ex + Math.cos(a) * 7, ey + Math.sin(a) * 7); c.lineTo(ex - Math.cos(a + 0.5) * 6, ey - Math.sin(a + 0.5) * 6); c.lineTo(ex - Math.cos(a - 0.5) * 6, ey - Math.sin(a - 0.5) * 6); c.closePath(); c.fill();
    c.strokeStyle = '#00000055'; c.lineWidth = 4; c.beginPath(); c.arc(bx, by, R + 8, 0, 7); c.stroke();
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(bx, by, R + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); c.stroke();
  }
  // the ball: Fig rolled up (facing the way it rolls) or a plain golf ball
  if (scene.ball && !scene.ball.hidden) {
    const b = scene.ball, air = b.air || 0, lift = air > 0 ? Math.sin(Math.PI * (1 - air / CHIP_AIR)) * 28 : 0, x = b.x, y = b.y - lift, rb = R * (1 + lift / 50);
    oval(c, x + 2 + lift * 0.3, b.y + 3, R * 1.1, R * 0.7, lift ? '#0004' : '#0006');   // in the air, the shadow stays on the ground
    if (scene.figBall) {
      if (b.vx) lastFace = Math.sign(b.vx);
      drawPal(scene.figMood || 'calm', c, { x, y, s: rb * 1.15, t: (t || 0) / 1000, r: scene.figR ?? 3.2, face: lastFace, hurt: !!scene.figHurt });
    } else {
      const g = c.createRadialGradient(x - 2, y - 2, 1, x, y, rb); g.addColorStop(0, '#fff'); g.addColorStop(1, '#D9DDE3');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rb, 0, 7); c.fill(); c.strokeStyle = '#00000033'; c.lineWidth = 0.8; c.stroke();
      c.fillStyle = '#0000001a'; [[1.5, 1], [-1, 2], [2, -1.5]].forEach(([ox, oy]) => { c.beginPath(); c.arc(x + ox, y + oy, 0.7, 0, 7); c.fill(); });
    }
  }
  if (!scene.flagOut) drawFlag(c, h.cup, th, ts, scene.flagKick && t ? Math.max(0, 1 - (t - scene.flagKick) / 1500) : 0);
  drawAmb(c, th, ts, v, true);
  if (th.once) th.once(c, ts, bb, true);
  // 🌫️ fog (044): only a clearing round the ball shows
  if (h.fog) { const b = scene.ball && !scene.ball.hidden ? scene.ball : { x: h.tee[0], y: h.tee[1] };
    const g = c.createRadialGradient(b.x, b.y, 70 * S, b.x, b.y, 140 * S); g.addColorStop(0, '#E8EEF200'); g.addColorStop(1, '#E8EEF2F2');
    c.fillStyle = g; c.fillRect(-PAD, -PAD, LW + 2 * PAD, LH + 2 * PAD);
    if (!reduceMotion) { c.fillStyle = '#ffffff22'; for (let i = 0; i < 6; i++) { const x = ((t / 40 + i * 97) % (LW + 200)) - 100, y = (i * 131) % LH; c.beginPath(); c.ellipse(x, y, 90 * S, 26 * S, 0, 0, 7); c.fill(); } } }
  (scene.fx || []).forEach((f) => { c.globalAlpha = Math.max(0, f.life); c.fillStyle = f.c; c.beginPath(); c.arc(f.x, f.y, f.s, 0, 7); c.fill(); });
  c.globalAlpha = 1;
  c.restore();
}

export { drawWorld, worldFor, WORLDS };
