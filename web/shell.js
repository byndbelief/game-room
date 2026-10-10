// 🧬 THE SHELL: the one body every solo game wears (CHAOS.md, "The shell and the organs").
//
// A solo game is an ORGAN: a module that draws a world and maps the box's nine events to its own
// nouns. It owns nothing else. The shell owns the canvas and its sizing, the beat clock and the chaos
// curve, the tally and the rating, hearts, score and combo, the HUD and meter, banners, the intro and
// end cards, the leaderboard, full screen, input, and the run's save (solo_submit).
//
// One organ makes an ordinary game page (squirrel.html, fractal.html). Several make a Chaos Run: the
// curve decides which organ you're in, and the world morphs when it says so:
//   a peak flips to the next organ (once you've had a few beats in this one), the mirror brings back
//   the one before, the window rotates every beat (the rhythm of 3), the golden cut dives into the
//   organ you've been away from longest. Hearts, score, combo, loot and the curve carry across the
//   seams; each organ keeps its own world alive while it's away, and picks up where it left off.
//
// Organ interface (see organs/*.js):
//   key, name, icon, verb, beat (seconds a beat), theme?  { bg, accent }
//   init(host)  start()  enter(from, anchor)  leave() → anchor  update(dt)  draw(t)  onBeat(ev)
//   pointer(type, p, e)  keydown(e)?  keyup(e)?  resize()?  hudLine()  level()  overText(how) → [title, sub]
//   endStats() → text  debug()?
//   🕳️ a pocket (optional): pocket (a pocket module, organs/pockets/*.js), pocketSpot() → { x, y, r, icon } | null (where the
//   way in is, asked every frame while it's offered), pocketSeed() → what the pocket starts from, pocketReward(result | null)
// The host an organ gets: { cv, ctx, W, H, k, dpr, reduceMotion, S, banner, add, hurt, heal, over, sfx, ui, morphs }
import { sb, me, signedIn, sfx, setGameTools, esc, names } from './common.js';
import { makeCurve, stepCurve, drawMeter, meterText, NEWS, tally, ratingLine, CALM, isCalm, CHAOS, MOOD_SAY, MOOD_NAME, WEIGHTS } from './chaos.js';
import { palWidget, PAL, drawPal } from './pals.js';
import { applyPalTheme } from './common.js';
import { setSfxDepth } from './sfx.js';

const SHELL_CSS = `
  .shud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:8px 10px;pointer-events:none;font-weight:900;text-shadow:0 2px 4px #000c}
  .shud .score{font-family:var(--display,inherit);font-size:24px;line-height:1}
  .shud .combo{color:var(--gold,#F5C542);font-size:14px}
  .shud .lvl{font-size:13px;color:var(--muted,#ccc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(58vw,260px)}   /* one line on a phone: Putt's course text used to wrap under the hearts */
  .shud > div:first-child{min-width:0}
  .shud .hearts{font-size:14px;letter-spacing:1px}
  .shud .hearts small{display:block;font-size:11px;letter-spacing:2px;color:var(--muted,#ccc)}
  .chaosm{display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
  .chaosm canvas{width:92px;height:34px;background:#0008;border-radius:8px}
  .chaosm #runmeter{height:17px;opacity:.85}
  .chaosm #runphase{font-size:9px;opacity:.8}
  .spal{position:absolute;left:4px;top:76px;width:60px;height:60px;pointer-events:none;filter:drop-shadow(0 4px 8px #000a)}   /* under the score, off the field (Hilltop's tank lives bottom-left) */
  .verb{display:none !important;position:absolute;left:68px;right:8px;top:76px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;pointer-events:none;font-size:12px;font-weight:900;text-shadow:0 2px 4px #000c}   /* up top beside the pal, under the score: the field stays clear */
  .verb b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  .verb b{display:inline-block;padding:4px 9px;border-radius:99px;background:#0009;border:1px solid #ffffff33;color:#fff}
  .verb b.next{color:var(--gold,#F5C542);border-color:var(--gold,#F5C542);animation:vpulse 1s infinite alternate}
  @keyframes vpulse{from{opacity:.6}to{opacity:1}}
  .oui{position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:6px;align-items:flex-end}
  .oui .wbar{display:flex;flex-direction:column;gap:6px}
  .oui .wbar button{position:relative;width:44px;height:44px;padding:0;border-radius:12px;font-size:22px;line-height:1;background:#0E0C22aa;border:1.5px solid #ffffff44;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
  .oui .wbar button.on{border-color:var(--gold,#F5C542);background:#F5C54244;box-shadow:0 0 12px #F5C54288}
  .oui .wbar button b{position:absolute;right:-5px;bottom:-5px;font-size:10px;padding:1px 4px;border-radius:8px;background:#141026;border:1px solid #ffffff44}
  .oui .dash{width:110px;height:8px;border-radius:6px;background:#0008;border:1px solid #ffffff33;overflow:hidden}
  .oui .dash i{display:block;height:100%;background:linear-gradient(90deg,#3DF2E0,#FF5FB0);width:100%;transition:width .08s linear}
  .sbanner{position:absolute;left:68px;top:84px;max-width:calc(100% - 80px);pointer-events:none;font-weight:900;font-size:12px;line-height:1.2;padding:4px 10px;border-radius:99px;background:#000a;border:1px solid #ffffff33;color:var(--bannerc,#FFE08A);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform-origin:0 50%;animation:bpop .25s ease-out}   /* 🟢 Fig says it: a small word beside the pal, never over the field */8,0 0 30px var(--gold,#F5C542);white-space:nowrap;animation:bpop .45s cubic-bezier(.2,1.6,.4,1) both;text-align:center}
  .sbanner small{display:none;font-family:var(--body,inherit);font-weight:900;font-size:15px;-webkit-text-stroke:0;color:#fff;text-shadow:0 2px 4px #000;white-space:normal;line-height:1.25}
  @keyframes bpop{from{transform:scale(.4);opacity:0}}
  .sover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;background:#07060F;padding:16px;text-align:center;overflow:auto}   /* the card sits low: the box shows above it */
  .sover .boxbg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}   /* inside the box: drawn by drawBox() while the overlay is up */
  .sover .card{position:relative;max-width:340px;display:flex;flex-direction:column;gap:10px;align-items:center;padding:14px 16px;border-radius:20px;background:#0B0918b8;border:1px solid #ffffff1a;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .sover p{margin:0}
  .sover .muted{color:var(--muted,#ccc)} .sover .small{font-size:13px}
  .sover .board{list-style:none;margin:0;padding:0;width:100%;max-width:280px;display:flex;flex-direction:column;gap:4px;text-align:left}
  .sover .board li{display:flex;justify-content:space-between;padding:6px 10px;border-radius:10px;background:#0006}
  .sover .board li.me{outline:2px solid var(--gold,#F5C542)}
  .sover .ostats{list-style:none;margin:0;padding:0;width:100%;display:flex;flex-direction:column;gap:3px;text-align:left;font-size:13px;color:var(--muted,#ccc)}
  .sover .ostats li{display:grid;grid-template-columns:24px 1fr;align-items:center;gap:6px;padding:4px 8px;border-radius:9px;background:#ffffff0a}
  .sover .ostats .si{font-size:16px;text-align:center}
  .sover .rchips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;font-size:12px}
  .sover .rchips span{padding:3px 9px;border-radius:999px;background:#ffffff12;color:var(--muted,#ccc)} .sover .rchips b{color:#fff}
  .sover .organs{display:flex;gap:10px;justify-content:center;font-size:28px}
  /* 🌊 SUBMERGED: the deeper you're zoned into a game (--deep, 0 → 1), the more the frame around it dissolves */
  .stage .shud .chaosm{opacity:calc(1 - .92 * var(--deep, 0));transition:opacity .8s}
  .stage .shud .lvl,.stage .shud .hearts small{opacity:calc(1 - .85 * var(--deep, 0));transition:opacity .8s}
  .stage .shud .score{opacity:calc(1 - .35 * var(--deep, 0));transform-origin:0 0;scale:calc(1 - .2 * var(--deep, 0));transition:opacity .8s,scale .8s}
  .stage .spal{opacity:calc(1 - .65 * var(--deep, 0));scale:calc(1 - .4 * var(--deep, 0));transition:opacity .8s,scale .8s}
  .stage.snap .shud .chaosm,.stage.snap .shud .lvl,.stage.snap .shud .hearts small,.stage.snap .shud .score,.stage.snap .spal{transition:none}
  /* 🕳️ in a pocket: a level deeper, the frame all but gone, and a small clock up top */
  .spocket{position:absolute;left:50%;top:10px;transform:translateX(-50%);pointer-events:none;display:flex;align-items:baseline;gap:7px;padding:4px 12px 5px 9px;border-radius:99px;background:#000b;border:1px solid #ffffff2a;font-weight:900;font-size:14px;color:#fff;white-space:nowrap;max-width:calc(100% - 140px);overflow:hidden;animation:bpop .3s ease-out}
  .spocket b{font-family:var(--display,inherit);font-weight:400;font-size:15px;color:var(--gold,#F5C542);min-width:2.3em}
  .spocket.low b{color:#FF7A6A}
  .spocket small{font-size:11px;color:var(--muted,#ccc);font-weight:800;overflow:hidden;text-overflow:ellipsis}
  .stage.inpocket .shud .chaosm,.stage.inpocket .shud .lvl,.stage.inpocket .shud .hearts,.stage.inpocket .shud .combo{opacity:.07}
  .stage.inpocket .shud .score{opacity:.3}
  .stage.inpocket .spal{opacity:.22;scale:.45}
  .stage.inpocket .oui{visibility:hidden}
  @media (prefers-reduced-motion:reduce){.sbanner{animation:none}.verb b.next{animation:none}.spocket{animation:none}}`;

export function runShell({ organs, key, title, icon, intro, again = 'Play again', W: W0 = 400 }) {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const morphs = organs.length > 1;
  // ---------------------------------------------------------------- the body's parts
  const style = document.createElement('style'); style.textContent = SHELL_CSS; document.head.appendChild(style);
  stage.insertAdjacentHTML('beforeend', `
    <div class="shud" aria-live="off">
      <div><div class="score" id="score">0</div><div class="hearts" id="hearts">❤️❤️❤️</div><div class="combo" id="combo"></div><div class="lvl" id="lvl"></div></div>
      <div class="chaosm"><canvas id="meter" width="184" height="68" aria-hidden="true"></canvas><span id="phase">calm</span><canvas id="runmeter" width="184" height="34" aria-hidden="true" hidden></canvas><span id="runphase" hidden></span></div>
    </div>
    <canvas class="spal" id="spal" width="144" height="144" aria-hidden="true" hidden></canvas>
    <div class="verb" id="verb" hidden></div>
    <div class="oui" id="oui"></div>
    <div class="sbanner" id="banner" hidden></div>
    <div class="spocket" id="pocket" hidden></div>
    <div class="sover" id="over"><canvas class="boxbg" id="boxbg" aria-hidden="true"></canvas><div class="card" id="overCard"></div></div>`);
  const meter = $('meter');
  // ---------------------------------------------------------------- shared state
  const S = { score: 0, hearts: 3, lives: {}, combo: 0, comboT: 0, tally: {}, curve: makeCurve(), beatT: 0, beats: 0, over: false, how: null, time: 0, morphs: 0 };
  // 🎮 Every organ is its own little game inside the run: it has three lives of its own (S.lives[key]). Lose
  // them and that organ resets to its easy start, and the run loses one of its own three hearts. The run ends
  // when the run's hearts are gone. The reset waits for the organ's update to finish (resetPending).
  const livesOf = (k) => S.lives[k] ?? 3;
  let resetPending = null;
  let active = null, prev = null, transition = null, tenure = 0, lastUsed = new Map(), running = false;
  // 🕰️ every organ keeps its own chaos clock: its own curve and its own beats (so its own stage). A morph parks the
  // organ you leave and picks up the one you enter where it left off; one you haven't met yet starts calm, at Stage 1,
  // close in, so every game gets its easy first look however late in the run you reach it.
  let clocks = new Map();
  // 🌐 the run's own curve rides on top of them all, and it only moves through states the games share: its phase is the
  // lowest phase every game has reached (the ones not met yet count as calm), and its r sits at that phase's start, so
  // it steps calm → rhythm ×2 → ×4 → 8, 16… → chaos → r = 4 only when the last game gets there. Its x walks the logistic
  // map at that r, and each step is news for the whole run. `runNext` is the phase it's waiting for and how many have it.
  // r = 4 for the run is the hard one: a game counts as there only once it has held r = 4 for TOP_HOLD beats on its own
  // clock (`curve.top`), and losing that game's lives starts its clock over, so every game must ride the top together.
  const TOP_HOLD = 30;
  const orgCurve = (o) => (o === active ? S.curve : clocks.get(o)?.curve);
  const orgR = (o) => { const c = orgCurve(o); if (!c) return CHAOS.R0; return c.r >= CHAOS.RMAX && (c.top || 0) < TOP_HOLD ? CHAOS.RMAX - 0.01 : c.r; };
  function stepRun() {
    const rs = organs.map(orgR), low = Math.min(...rs), k = CHAOS.PHASES.filter(([at]) => low >= at).length;
    const r0 = S.run.r; S.run.r = k ? CHAOS.PHASES[k - 1][0] : CHAOS.R0; S.run.n = k; S.runEv = stepCurve(S.run, { freeze: true });
    const nx = CHAOS.PHASES[k]; S.runNext = nx ? { name: nx[1], have: rs.filter((r) => r >= nx[0]).length, of: rs.length, top: nx[0] >= CHAOS.RMAX ? Math.min(...organs.map((o) => Math.min(TOP_HOLD, orgCurve(o)?.top || 0))) : null } : null;
    CHAOS.PHASES.filter(([at]) => r0 < at && S.run.r >= at).forEach(([, name, say]) => { banner(`🌐 THE RUN · ${name}`, `every game has reached it: ${say}`); wave('peak'); });
  }
  function useClock(o) {
    if (active) clocks.set(active, { curve: S.curve, beats: S.beats });
    const c = clocks.get(o), fresh = !c; S.curve = c ? c.curve : makeCurve(); S.beats = c ? c.beats : 0;
    const st = STAGES[stageOf()]; zoomTo = st.zoom; widenTo = st.widen;
    return fresh;
  }
  // 🧘 calm within the chaos: beats left in the hold a calm organ (CALM.organs) opens on entry
  let calm = 0;
  // ⚡ a glitch: seconds left of the flicker a held peak sets off (the theme is another organ's meanwhile)
  let glitchT = 0;
  // 🌊 DEPTH: how zoned in you are. It rises while you play steadily (input in the last 2.5 s or a finger held down, faster
  // with a combo going, ~14 s to the bottom) and drains when you stop or get hurt. As it rises the frame dissolves (the
  // meters, the stage line, Fig, the notices; --deep on the stage) and the edges close in. Then the chaos run does what it
  // does: a switch that lands while you're deep is a ⚡ JOLT, the frame slams back and the camera pulls out through every
  // layer (the game, the run, the box) before it dives into the next game. The deeper you were, the further it pulls.
  let held = 0;
  const deepF = () => { const d = S.depth || 0, e = Math.max(0, Math.min(1, (d - 0.2) / 0.6)); return e * e * (3 - 2 * e); };   // the frame's fade, eased in from 20% deep
  function stepDepth(dt) {
    const playing = held > 0 || S.time - (S.lastIn ?? -9) < 2.5;
    if (playing && !transition) S.depth = Math.min(1, (S.depth || 0) + dt / 14 * (1 + Math.min(5, S.combo || 0) * 0.12));
    else S.depth = Math.max(0, (S.depth || 0) - dt * (transition ? 0 : 0.12));
    if (pk) S.depth = Math.max(S.depth, 0.92);   // 🕳️ a pocket holds you under
    if (active) S.deepest = Math.max(S.deepest || 0, S.depth);
    stage.style.setProperty('--deep', deepF().toFixed(3)); setSfxDepth(pk ? 1 : deepF());   // 🔇 the sound sinks with you (all the way, in a pocket)
  }
  function surfaceNow() { S.depth = 0; setSfxDepth(0, true); stage.classList.add('snap'); stage.style.setProperty('--deep', '0'); setTimeout(() => stage.classList.remove('snap'), 400); }
  let live = null;   // a scratch copy of the new world, for the jolt's dive back in
  function glitchRun() { if (S.over) return; glitchT = 1.1; wave('glitch', true); const others = organs.filter((o) => o !== active && o.theme); const th = others[Math.floor(Math.random() * others.length)]; if (th) applyTheme(th.theme); active.glitch?.(true, S.curve.mood); pal.hurt(); sfx('buzz'); banner(NEWS.glitch[0], `${PAL[S.curve.mood || 'calm'].name}'s mind flickers: nothing changed. Probably.`); }
  function tear() {   // slices of the frame shoved sideways, and a colour band, for the glitch's life
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 5; i++) { const y = Math.random() * cv.height, h = (6 + Math.random() * 34) * host.dpr, dx = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 18) * host.dpr; ctx.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h); }
    ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = 0.35; ctx.fillStyle = ['#3DD6C6', '#FF5A4A', '#B9A6FF'][Math.floor(Math.random() * 3)]; ctx.fillRect(0, Math.random() * cv.height, cv.width, (4 + Math.random() * 20) * host.dpr);
    ctx.restore();
  }
  const openCalm = () => { if (!isCalm(active?.key)) { calm = 0; return; } calm = CALM.RUN_HOLD; banner('🧘 FIG TAKES A BREATH', `calm within the chaos: r holds and nothing twists · ${calm} beats`); pal.force('gift', 1.6); };
  // 🎨 the resident pal sits in the corner and feels every beat (pals.js; who it is: the Design Studio)
  const pal = palWidget($('spal'), { pal: 'calm', s: 22, own: false, dpr: 2 });   // 🟢 Fig, in the run's mood
  const host = {
    cv, ctx, W: W0, H: 640, k: 1, dpr: 1, ox: 0, oy: 0, reduceMotion, S, sfx: (n, o) => { if (n === 'chime' && inBeat) return; sfx(n, o); }, morphs,
    banner, add: (pts) => { S.score += Math.max(0, Math.round(pts)); },
    heal: (n = 1) => { if (active) S.lives[active.key] = Math.min(3, livesOf(active.key) + n); },
    hurt: (how) => { S.combo = 0; S.comboT = 0; S.depth = (S.depth || 0) * 0.5; pal.hurt(); if (!active) return false; S.lives[active.key] = livesOf(active.key) - 1; if (S.lives[active.key] <= 0) resetPending = how; return false; },
    over, ui: (html) => { $('oui').innerHTML = html || ''; return $('oui'); },
    depth: () => S.depth || 0, deep: () => deepF(),   // 🌊 organs may deepen their own world with it
    organ: () => active?.key, activeBeat: () => active?.beat || 1, stage: () => stageOf() + 1,   // 🎚️ the run's stage, for organs that grow with it
    // 🟢 Fig in the corner watches the field from outside it: organs cue it on what happens and where (x in world units),
    // it turns to look that way and acts it out — a kill bounces it, a score winks, a near miss makes it flinch, a pickup is a gift
    cue: (kind, x, y) => { if (x != null) pal.set({ face: x < host.W * 0.3 ? -1 : 1 }); if (kind === 'kill') pal.force('big', 0.9); else if (kind === 'score') pal.force('fib', 0.8); else if (kind === 'near') pal.force('peak', 0.6); else if (kind === 'pickup') pal.force('gift', 1.2);
      if (kind !== 'look') react(kind); },
  };
  // 🟢 Fig is where the chaos comes from. During play it stays in its corner and only reacts there, big: every twist of
  // the curve (a peak, the window, the mirror, the golden cut, a mood, a lens, a glitch, a stage) makes the chip swell and
  // turn, and what it causes on the board (the glitch tear, the lens, the twist itself) is the only trace of it in the
  // field. A morph is different: Fig leaves the corner, flies into the field, pulls the old world into itself with a
  // wave, and comes back to the corner as the new world surfaces. No particles, ever.
  let lungeT = null, waves = [], flyT = null;
  const palPt = () => { const r = $('spal').getBoundingClientRect(), c = cv.getBoundingClientRect(); return { x: (r.left + r.width / 2 - c.left) * (cv.width / c.width), y: (r.top + r.height * 0.56 - c.top) * (cv.height / c.height) }; };
  const MOODC = { calm: '#3DD6C6', fig: '#FF5FB0', kit: '#C9B8FF', bit: '#9BE7FF', phi: '#F5C542' };
  // 🔊 The twists' sounds: a different one per twist and per mood of Fig's, pitched by x, and rationed (one every 2.5 s
  // at most, the same one at most every 12 s), so the curve's busy beats don't ring like a timer.
  let inBeat = false, lastSnd = 0; const sndAt = {};
  const MOOD_SND = { fig: 'moodFig', kit: 'moodKit', bit: 'moodBit', phi: 'moodPhi', calm: 'moodCalm' };
  function beatSound(ev) {
    const name = ev.moodChanged ? MOOD_SND[ev.mood] : ev.golden ? 'evGolden' : ev.mirror ? 'evMirror' : ev.balance ? 'evBalance' : ev.enteredWindow ? 'evWindow' : ev.gold ? 'evGold' : null;
    const now = performance.now(); if (!name || now - lastSnd < 2500 || now - (sndAt[name] || -1e9) < 12000) return;
    lastSnd = now; sndAt[name] = now; sfx(name, { x: S.curve.x });
  }
  function react(kind) {   // in the corner only: a swell and a tilt, bigger for the bigger twists, then back
    if (flyT) return;
    const big = kind === 'glitch' || kind === 'stage' || kind === 'lens', sc = kind === 'near' ? 0.8 : big ? 1.9 : kind === 'kill' ? 1.5 : 1.35, rot = kind === 'mirror' ? -16 : kind === 'near' ? 6 : 10;
    const el = $('spal'); el.style.transition = 'transform .14s ease-out'; el.style.transform = `scale(${sc}) rotate(${rot}deg)`;
    clearTimeout(lungeT); lungeT = setTimeout(() => { el.style.transition = 'transform .55s cubic-bezier(.3,1.6,.5,1)'; el.style.transform = ''; }, big ? 360 : 240);
  }
  function wave(kind, big = false) {   // the corner reaction; a wave onto the board only while Fig is out in the field (a morph)
    react(kind); if (!flyT) return;
    const col = kind === 'glitch' ? '#FF5A3A' : kind === 'golden' ? '#F5C542' : kind === 'mirror' ? '#C9B8FF' : kind === 'window' ? '#9BE7FF' : MOODC[S.curve.mood] || '#3DD6C6';
    waves.push({ t: 0, dur: 1, col, from: { x: cv.width / 2, y: cv.height * 0.42 }, big });
  }
  function drawWaves(dt) {
    if (!waves.length) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const R = Math.hypot(cv.width, cv.height) * 0.7;
    waves = waves.filter((w) => { w.t += dt; const e = Math.min(1, w.t / w.dur), ee = 1 - (1 - e) * (1 - e), r = 8 * host.dpr + ee * R;
      const g = ctx.createRadialGradient(w.from.x, w.from.y, Math.max(0, r - 90 * host.dpr), w.from.x, w.from.y, r); g.addColorStop(0, w.col + '00'); g.addColorStop(0.85, w.col + '66'); g.addColorStop(1, w.col + '00');
      ctx.globalAlpha = 1 - e * e; ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = w.col; ctx.lineWidth = 6 * host.dpr; ctx.globalAlpha = (1 - e) * 0.9; ctx.beginPath(); ctx.arc(w.from.x, w.from.y, r, 0, 7); ctx.stroke();
      return e < 1; });
    ctx.restore();
  }
  // 🟢 the morph is Fig's: the chip flies from the corner to the middle of the field, grows, the old world is pulled into it,
  // and it flies back as the new world surfaces underneath
  function fly(dur) {
    const el = $('spal'), r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const dx = (c.left + c.width / 2) - (r.left + r.width / 2), dy = (c.top + c.height * 0.42) - (r.top + r.height / 2);
    clearTimeout(lungeT); clearTimeout(flyT);
    const m = S.curve.mood, spin = m === 'fig' ? 720 : m === 'kit' ? 0 : m === 'bit' ? 90 : m === 'phi' ? 360 : 180, flip = m === 'kit' ? ' scaleX(-1)' : '';   // Wild spins twice, Mirror flips, Boxy a quarter turn, Golden one turn
    el.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1.2)'; el.style.transform = `translate(${dx}px, ${dy}px) scale(2.6) rotate(${spin}deg)${flip}`;
    flyT = setTimeout(() => { el.style.transition = 'transform .45s cubic-bezier(.3,1.4,.5,1)'; el.style.transform = ''; flyT = setTimeout(() => { flyT = null; }, 450); }, Math.max(300, dur * 1000 - 200));
  }
  // ---------------------------------------------------------------- 🕳️ POCKETS: a game inside the game, one level deeper
  // Deep enough (POCKET.DEEP of the frame's fade), an organ may show a way further in on one of its own things (Putt's cup,
  // Hilltop's burrow): it pulses for a few seconds, and a tap on it dives in. A pocket is a mini-organ (organs/pockets/*.js):
  // start(ph, seed), update(dt), draw(t), pointer(type, p, e), onBeat(ev)?, keydown(e)?, timeUp() → result?, debug(), plus
  // key, name, icon, goal, dur (15–25 s) and rim (its colour). It is random in its own way (its own chaotic system, never
  // the curve). The organ it opened from is paused (not updated, not drawn, no beats) and frozen in a snapshot the dive
  // zooms into and the way back zooms out of. A win (ph.win(result)) hands a small gift back up: organ.pocketReward(result);
  // running out of time (or ph.lose) only costs the time: pocketReward(null), never a life. The beats keep ticking on the
  // organ's clock, so the run can still rip you out: the deepest jolt there is, four frames out (pocket, game, run, box).
  const POCKET = { DEEP: 0.5, FADE: 0.38, OFFER: 8, COOL: 45, MISS: 12, IN: 0.95, OUT: 0.8, JOLT: 750 };
  let offer = null, pk = null, pend = null, pkCool = 0, glowSpr = null, pkLast = null;
  host.pocket = {
    offer: (sp, forced = false) => {   // an organ shows its way in; the shell decides whether it may
      if (!sp || !active?.pocket || pk || offer || S.over || transition) return false;
      if (!forced && (pkCool > 0 || deepF() < POCKET.DEEP)) return false;
      offer = { x: sp.x, y: sp.y, r: sp.r || 18, icon: sp.icon || active.pocket.icon, t: 0, organ: active, forced }; sfx('chime'); return true;
    },
    offering: () => !!offer && offer.organ === active, inside: () => !!pk,
  };
  function stepOffer(dt) {
    pkCool = Math.max(0, pkCool - dt);
    if (offer) {
      offer.t += dt; const sp = offer.organ === active ? (active.pocketSpot ? active.pocketSpot() : offer) : null;
      if (sp && sp !== offer) { offer.x = sp.x; offer.y = sp.y; offer.r = sp.r || offer.r; }
      if (!sp || transition || (!offer.forced && (offer.t > POCKET.OFFER || deepF() < POCKET.FADE))) { offer = null; pend = null; pkCool = Math.max(pkCool, POCKET.MISS); }
      return;
    }
    if (pkCool <= 0 && !transition && tenure >= 2 && deepF() >= POCKET.DEEP && active?.pocketSpot) host.pocket.offer(active.pocketSpot());
  }
  function drawOffer(t) {   // a soft glow, two rings rising out of it, the pocket's icon over it: subtle, it's deep down here
    const o = offer; if (!o || pk) return;
    const a = Math.min(1, o.t / 0.5) * (o.forced ? 1 : Math.max(0, Math.min(1, (POCKET.OFFER - o.t) / 1.5))); if (a <= 0) return;
    if (!glowSpr) { glowSpr = document.createElement('canvas'); glowSpr.width = glowSpr.height = 64; const g2 = glowSpr.getContext('2d'), gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,236,170,0.9)'); gr.addColorStop(0.4, 'rgba(255,200,90,0.35)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64); }
    ctx.save(); ctx.setTransform(host.k, 0, 0, host.k, host.ox, host.oy);
    const br = 0.5 + 0.5 * Math.sin(t / 260), R = o.r * (2.2 + 0.4 * br);
    ctx.globalAlpha = a * (0.5 + 0.35 * br); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSpr, o.x - R, o.y - R, R * 2, R * 2); ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#FFE9A8'; for (let i = 0; i < 2; i++) { const u = (t / 1400 + i * 0.5) % 1; ctx.globalAlpha = a * (1 - u) * 0.9; ctx.lineWidth = 2 * (1 - u) + 0.5; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * (1 + u * 1.4), 0, 7); ctx.stroke(); }
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(15 + 2 * br)}px serif`; ctx.fillText(o.icon, o.x, o.y - o.r - 13 - 2 * br);
    ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#FFE9A8'; ctx.font = '900 10px system-ui, sans-serif'; ctx.fillText('tap', o.x, o.y + o.r + 10); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  const offerHit = (p) => offer && !transition && Math.hypot(p.x - offer.x, p.y - offer.y) < offer.r + 16;
  function enterPocket() {
    const mod = active?.pocket; if (!mod || pk || S.over || transition) return false;
    const sp = offer || active.pocketSpot?.() || { x: host.W / 2, y: host.H / 2, r: 20 };
    offer = null; pend = null;
    ctx.setTransform(host.k, 0, 0, host.k, host.ox, host.oy); active.draw(performance.now());   // the organ, frozen as you left it (without the offer's glow)
    const snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; snap.getContext('2d').drawImage(cv, 0, 0);
    const ph = Object.create(host); ph.win = (res) => exitPocket(true, res); ph.lose = (res) => exitPocket(false, res); ph.left = () => (pk ? pk.left : 0); ph.mood = () => S.curve.mood || 'calm';
    pk = { mod, organ: active, phase: 'in', t: 0, left: mod.dur || 20, snap, at: { x: sp.x, y: sp.y }, depth0: S.depth || 0, won: false, res: null, shown: -1 };
    mod.start(ph, active.pocketSeed?.() || {});
    S.pockets = (S.pockets || 0) + 1; S.depth = Math.max(S.depth || 0, 0.95); stage.classList.add('inpocket'); sfx('gulp'); navigator.vibrate?.(30);
    $('pocket').innerHTML = `<span>${mod.icon}</span><b></b><small>${esc(mod.goal || '')}</small>`;
    window.__pk = () => (pk && pk.mod === mod ? { ...(mod.debug?.() || {}), phase: pk.phase, left: pk.left } : { phase: 'none', last: pkLast });
    return true;
  }
  function exitPocket(won, res) {   // the way back up: a gentle zoom out through the thing you went in by
    if (!pk || pk.phase === 'out') return false;
    const back = pk.phase === 'in' ? POCKET.OUT * (1 - Math.min(1, pk.t / POCKET.IN)) : 0;
    pk.phase = 'out'; pk.t = back; pk.won = !!won; pk.res = res || null; $('pocket').hidden = true;
    sfx(won ? 'birdie' : 'surface'); if (won) sfx('surface', { delay: 0.25 });
    return true;
  }
  function finishPocket() {
    const { organ, won, res, mod, depth0 } = pk; pk = null; stage.classList.remove('inpocket'); pkCool = POCKET.COOL; S.depth = Math.max(0.5, Math.min(S.depth || 0, depth0));
    pkLast = { key: mod.key, won, pts: res?.pts || 0, gift: res?.gift || null };
    if (res?.pts) host.add(res.pts);
    if (won) { S.pocketWins = (S.pocketWins || 0) + 1; organ.pocketReward?.(res); banner(`${mod.icon} ${res?.label || 'BACK UP'}`, res?.sub || '', true); pal.force('gift', 1.4); }
    else { organ.pocketReward?.(null); banner(`${mod.icon} BACK UP · EMPTY-HANDED`, res?.why || 'only time lost', true); }
  }
  function stepPocket(dt) {
    pk.t += dt;
    if (pk.phase === 'in') { if (pk.t >= POCKET.IN) { pk.phase = 'play'; pk.t = 0; $('pocket').hidden = false; } return; }
    if (pk.phase === 'out') { if (pk.t >= POCKET.OUT) finishPocket(); return; }
    pk.left = Math.max(0, pk.left - dt); pk.mod.update(dt);
    if (!pk || pk.phase !== 'play') return;
    if (pk.left <= 0) { exitPocket(false, pk.mod.timeUp?.() || { why: 'time ran out' }); return; }
    const s = Math.ceil(pk.left); if (s !== pk.shown) { pk.shown = s; const c = $('pocket'); c.querySelector('b').textContent = `0:${String(s).padStart(2, '0')}`; c.classList.toggle('low', s <= 5); }
  }
  function drawPocket(t) {
    const k = host.k, Wd = cv.width, Hd = cv.height, ax = host.ox + pk.at.x * k, ay = host.oy + pk.at.y * k;
    const live = () => { ctx.setTransform(k, 0, 0, k, host.ox, host.oy); pk.mod.draw(t); };
    if (pk.phase === 'play') return live();
    const p = Math.min(1, pk.t / (pk.phase === 'in' ? POCKET.IN : POCKET.OUT)), e = p * p * (3 - 2 * p), u = pk.phase === 'in' ? e : 1 - e;
    // the organ's frozen frame, the camera falling into the thing you tapped
    const z = 1 + u * u * 11;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05040C'; ctx.fillRect(0, 0, Wd, Hd);
    ctx.translate(ax, ay); ctx.scale(z, z); ctx.translate(-ax, -ay); ctx.drawImage(pk.snap, 0, 0); ctx.restore();
    // the pocket opens out of it: an iris from the thing's mouth, its rim in the pocket's colour
    const q = Math.max(0, (u - 0.3) / 0.7); if (q <= 0) return;
    const Rm = Math.hypot(Math.max(ax, Wd - ax), Math.max(ay, Hd - ay)), R = Math.max(1, q * q * Rm * 1.02);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.arc(ax, ay, R, 0, 7); ctx.clip(); live(); ctx.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = pk.mod.rim || '#FFE9A8'; ctx.globalAlpha = 1 - q; ctx.lineWidth = 3 * host.dpr; ctx.beginPath(); ctx.arc(ax, ay, R, 0, 7); ctx.stroke(); ctx.restore();
  }
  // ---------------------------------------------------------------- sizing
  function size() {
    const fs = !!document.querySelector('#play.fs-on');
    const r = stage.getBoundingClientRect();
    const w = r.width, h = fs ? innerHeight : Math.max(420, innerHeight - r.top - 12);
    host.dpr = Math.min(2, devicePixelRatio || 1);
    cv.style.height = `${h}px`; cv.width = Math.round(w * host.dpr); cv.height = Math.round(h * host.dpr);
    // The world is 400 wide and as tall as the screen allows. On a wide screen (a phone on its side) a
    // full-width fit would scale everything up and leave a world a few beats tall: zoom out instead,
    // so the world is at least 1.25× taller than wide, centred on the full canvas (host.ox, device px)
    // with the organ's own background around it. Organs draw with setTransform(k, 0, 0, k, host.ox, 0).
    // 🎚️ The stages widen the world more than they lengthen it: W grows by `widen`, the visible height only by
    // 1/zoom, and whichever runs out of screen first gets margins (host.ox / host.oy, device px) in the organ's
    // own colour. Organs draw with setTransform(k, 0, 0, k, host.ox, host.oy) and read host.W live.
    const k0 = Math.min(cv.width / W0, cv.height / (W0 * 1.25)), H0 = cv.height / k0;   // the Stage 1 fit: 400 wide, at least 1.25× taller than wide
    host.W = Math.round(W0 * widen); const Hv = H0 / zoom;
    host.k = Math.min(cv.width / host.W, cv.height / Hv); host.H = Hv;
    host.ox = Math.max(0, (cv.width - host.W * host.k) / 2); host.oy = Math.max(0, (cv.height - host.H * host.k) / 2);
    organs.forEach((o) => o.resize?.());
  }
  // ---------------------------------------------------------------- banners, HUD
  let bannerT = null;
  // 🟢 Notices go through Fig: the pal in the corner acts the event out (a cue read off the title's mark) and a
  // short word sits beside it for a moment. Nothing lands over the field; the sub-line is for the ratings only.
  const CUE = [['🌻', 'golden'], ['✨', 'mirror'], ['⚖️', 'balance'], ['🔁', 'window'], ['⚡', 'peak'], ['🧘', 'gift'], ['🎚️', 'big'], ['🛡️', 'gift'], ['🌀', 'peak'], ['🔂', 'window'], ['🌟', 'gold'], ['🟢', null]];
  const HURTS = /OUCH|ZAP|SPLASH|HIT|BOMBED|BONK|PICKED|DRONED|GLITCH|OVER PAR/;
  function banner(t, sub, loud = false) {
    if (!loud && deepF() > 0.6 && !HURTS.test(t)) { const cue = CUE.find(([m]) => t.includes(m)); if (cue?.[1]) pal.force(cue[1], 1.2); return; }   // 🌊 deep: the run keeps its news to itself
    const b = $('banner'); b.textContent = t; b.title = sub || ''; b.hidden = false;
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(bannerT); bannerT = setTimeout(() => { b.hidden = true; }, 1400);
    const cue = CUE.find(([m]) => t.includes(m)); if (HURTS.test(t)) pal.hurt(); else if (cue) { if (cue[1]) pal.force(cue[1], 1.6); } else pal.force('big', 1);
  }
  const nextOrgan = () => organs[(organs.indexOf(active) + 1) % organs.length];
  // 🎚️ STAGES: the run eases into chaos. A stage is a stretch of beats; early stages let r climb only
  // every few beats (frozen beats: x walks and Fig's moods still land, a hint of what's coming), morph
  // less, and keep the board close; later stages climb every beat and zoom the board out (a taller world).
  const STAGES = [
    { name: 'Stage 1 · learn', beats: 0, climbEvery: 10, zoom: 1.0, widen: 1.0, tenure: 10, lens: 2.2 },
    { name: 'Stage 2 · warm', beats: 60, climbEvery: 4, zoom: 0.94, widen: 1.15, tenure: 8, lens: 4 },
    { name: 'Stage 3 · wild', beats: 120, climbEvery: 2, zoom: 0.88, widen: 1.3, tenure: 6, lens: 6 },
    { name: 'Stage 4 · chaos', beats: 200, climbEvery: 2, zoom: 0.82, widen: 1.45, tenure: 4, lens: 7 },
  ];   // beats and climbs doubled: a game reaches r = 4 after ~134 of its own beats (was ~67)
  // zoom: the visible height grows by 1/zoom; widen: the world's width grows by widen — sideways more than up
  const stageOf = () => { let i = 0; STAGES.forEach((st, j) => { if (S.beats >= st.beats) i = j; }); return i; };
  let zoom = 1, zoomTo = 1, widen = 1, widenTo = 1;
  // 🌐 the run's curve sets how long a game holds you: calm 12 beats, rhythm ×2 9, rhythm ×4 7, chaos 5, near the top 3;
  // a game's first visit always gets FIRST_LOOK beats, so its easy first look is never cut short
  const FIRST_LOOK = 6;
  const runTenure = () => { const r = S.run?.r ?? CHAOS.R0; return r < 3 ? 12 : r < 3.449 ? 9 : r < 3.5699 ? 7 : r < 3.8 ? 5 : 3; };
  const minTenure = () => (S.firstLook ? Math.max(FIRST_LOOK, runTenure()) : runTenure());
  // 🔍 LENSES: Fig's personalities bend the picture itself. A new mood may put a lens on: Wild Fig inverts the
  // colours, Mirror Fig mirrors the screen (and your touches), Boxy Fig leaves only the wireframe, Golden Fig
  // turns it gold. Short in the early stages (a hint), longer later.
  const LENS = { fig: ['invert', '🌀 WILD FIG INVERTS THE WORLD', 'the colours flip'], kit: ['mirror', '✨ MIRROR FIG FLIPS THE SCREEN', 'left is right now'], bit: ['wire', '🔁 BOXY FIG: WIREFRAME', 'only the edges are real'], phi: ['gold', '🌻 GOLDEN FIG GILDS IT', 'everything in gold'] };
  let lens = null;   // { kind, t, dur }
  function putLens(kind, dur) {
    lens = { kind, t: 0, dur };
    cv.style.filter = kind === 'invert' ? 'invert(1) hue-rotate(180deg)' : kind === 'gold' ? 'sepia(1) saturate(1.6) hue-rotate(-10deg) contrast(1.1)' : '';
    cv.style.transform = kind === 'mirror' ? 'scaleX(-1)' : '';
  }
  function clearLens() { lens = null; cv.style.filter = ''; cv.style.transform = ''; }
  function wireframe() {   // edges only: the frame minus itself shifted a pixel, brightened
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'difference'; ctx.drawImage(cv, 1, 1); ctx.drawImage(cv, -1, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(cv, 0, 0); ctx.drawImage(cv, 0, 0); ctx.restore();
  }
  function hud() {
    $('score').textContent = S.score.toLocaleString();
    const lv = active ? livesOf(active.key) : 3, hearts = '❤️'.repeat(Math.max(0, S.hearts)) + '🖤'.repeat(Math.max(0, 3 - S.hearts)) + (active ? `<small>${active.icon} ${'●'.repeat(Math.max(0, lv))}${'○'.repeat(Math.max(0, 3 - lv))}</small>` : '');
    if ($('hearts').innerHTML !== hearts) $('hearts').innerHTML = hearts;   // the run's hearts, and under them this organ's own lives
    $('combo').textContent = S.combo > 1 && S.comboT > 0 ? `COMBO ×${S.combo}` : '';
    $('lvl').textContent = `Stage ${stageOf() + 1}${active?.hudLine?.() ? ' · ' + active.hudLine() : ''}`;
    $('phase').textContent = meterText(S.curve);
    drawMeter(meter, S.curve);
    if (morphs && S.run) { drawMeter($('runmeter'), S.run); $('runphase').textContent = `🌐 run · ${meterText(S.run)}${S.runNext ? ` · ${S.runNext.have}/${S.runNext.of} at ${S.runNext.name.toLowerCase()}${S.runNext.top != null ? ` · held ${S.runNext.top}/${TOP_HOLD}` : ''}` : ''}`; }
    const v = $('verb');
    v.hidden = true; if (true) return;   // the hint pills are gone: Fig and the field say what's happening
    const armed = morphs && tenure >= minTenure() - 1 && !S.curve.window && calm <= 0;
    v.hidden = false;
    v.innerHTML = `<b>${active.icon} ${esc(active.verb)}</b>${morphs ? `<b class="${armed ? 'next' : ''}">${calm > 0 ? `🧘 calm · ${calm} beat${calm === 1 ? '' : 's'} · r holds` : S.curve.window ? '🔁 the window: it rotates every beat' : armed ? `⚡ next: ${nextOrgan().icon} ${esc(nextOrgan().verb)}` : `${S.morphs} morph${S.morphs === 1 ? '' : 's'}`}</b>` : ''}`;
  }
  // ---------------------------------------------------------------- the beat and the morphs
  function beat() {
    const held = calm > 0, st0 = stageOf(), stg = STAGES[st0];
    const frozen = !held && stg.climbEvery > 1 && (S.beats % stg.climbEvery) !== 0;   // 🎚️ an early stage: r climbs only every few beats
    const ev = stepCurve(S.curve, { hold: held, freeze: frozen }); S.beats += 1; S.allBeats += 1; S.maxR = Math.max(S.maxR || 0, S.curve.r); if (S.curve.r >= CHAOS.RMAX) S.curve.top = (S.curve.top || 0) + 1; tenure += 1; tally(ev, S.tally); if (morphs) stepRun();
    if (stageOf() !== st0) { const ns = STAGES[stageOf()]; wave('stage', true); banner(`🎚️ ${ns.name.toUpperCase()}`, st0 === 0 ? 'r climbs faster now · the board zooms out' : st0 === 1 ? 'r climbs every other beat · the board zooms out' : 'the top of the curve · the whole board'); sfx('twist'); zoomTo = ns.zoom; widenTo = ns.widen; }
    // 🟢 Fig's mood moved: say so, recolour the room, and its pillar's events pay double (the bond, in points)
    if (ev.moodChanged) { wave('mood'); banner(`🟢 ${MOOD_NAME[ev.mood]}`, st0 < 2 && ev.mood !== 'calm' ? `${MOOD_SAY[ev.mood]} · a hint of what's coming` : MOOD_SAY[ev.mood]); applyPalTheme(ev.mood);
      // 🔍 a lens, sometimes: a hint in the early stages, a stretch later
      const L = LENS[ev.mood]; if (L && !lens && Math.random() < [0.5, 0.65, 0.85, 1][st0]) { putLens(L[0], stg.lens); wave('lens', true); setTimeout(() => banner(L[1], L[2]), 900); sfx('buzz'); } }
    { const B = PAL[ev.mood]?.boosts || []; let bond = 0; for (const k of B) { if (k === 'r4' ? ev.crossed.some((p) => p.name === 'r = 4') : k === 'phase' ? ev.crossed.length > 0 : ev[k]) bond += WEIGHTS[k] || 0; } if (bond) S.tally.bond = (S.tally.bond || 0) + bond; }
    if (held) { calm -= 1; if (calm === CALM.WARN) { banner(...NEWS.again); sfx('tick'); } else if (ev.glitch) glitchRun(); }
    pal.set({ r: S.curve.r, mood: ev.mood }); pal.react(ev);
    ev.crossed.forEach((p) => banner(p.name, p.say)); if (ev.crossed.length || ev.peak || ev.big) wave('peak');
    if (ev.enteredWindow) { wave('window'); banner(...NEWS.window); }
    if (ev.mirror) { wave('mirror'); banner(...NEWS.mirror); }
    if (ev.balance) banner(...NEWS.balance);
    if (ev.golden) { wave('golden'); banner(...NEWS.golden); }
    beatSound(ev);   // 🔊 one odd sound per twist, from the run itself (the organs' own beat chimes are muted: inBeat)
    inBeat = true; try { if (pk) pk.mod.onBeat?.(ev); else active.onBeat(ev); } finally { inBeat = false; }   // 🕳️ the organ is paused while you're in its pocket; the pocket hears the beat
    if (morphs && !transition && !S.over && !held && !S.testHold) {   // 🧘 nothing morphs during a calm
      let to = null, why = '';
      if (ev.window) { to = nextOrgan(); why = 'window'; }
      else if (ev.golden && tenure >= Math.ceil(minTenure() / 2)) { to = [...organs].filter((o) => o !== active).sort((a, b) => (lastUsed.get(a) ?? -1) - (lastUsed.get(b) ?? -1))[0]; why = 'golden'; }
      else if (ev.mirror && prev && prev !== active && tenure >= Math.ceil(minTenure() / 2)) { to = prev; why = 'mirror'; }
      else if (S.runEv?.peak && tenure >= minTenure()) { to = nextOrgan(); why = 'peak'; }   // 🌐 a peak on the run's curve, not the game's
      else if (tenure >= minTenure() * 2 && !pk) { to = nextOrgan(); why = 'drift'; }   // (never out of a pocket: only the curve's own events rip you out)   // a calm run still moves you on, slowly
      if (to && to !== active) morphTo(to, why);
    }
  }
  const WHY = { window: '🔁 the window turns the world', golden: '🌻 the golden cut: a dive', mirror: '✨ the mirror: back to the world before', peak: '🌐 a peak on the run: the world twists', drift: '🌐 the run moves you on' };
  function morphTo(to, why) {
    const ripped = pk; offer = null; pend = null;   // 🕳️ the run doesn't wait for you to come up: it rips you out of the pocket
    if (ripped) { pk = null; stage.classList.remove('inpocket'); $('pocket').hidden = true; pkCool = POCKET.COOL; S.pocketJolts = (S.pocketJolts || 0) + 1; pkLast = { key: ripped.mod.key, won: false, ripped: true }; ripped.organ.pocketReward?.(null); }
    const snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; snap.getContext('2d').drawImage(cv, 0, 0);
    const anchor = active.leave?.() || null;
    // 🟢 the morph is done in the mood Fig is in as you leave: Wild tears, Mirror folds, Boxy tiles, Golden spirals (calm: a plain pull-in)
    const mood = S.curve.mood || 'calm';
    lastUsed.set(active, S.allBeats); const fresh = useClock(to); S.firstLook = fresh; prev = active; active = to; tenure = 0; S.morphs += 1;
    active.enter(prev.key, anchor);
    applyTheme(); openCalm(); applyPalTheme(S.curve.mood || 'calm'); pal.set({ r: S.curve.r, mood: S.curve.mood || 'calm' });
    const strips = Array.from({ length: 14 }, (_, i) => ({ i, vx: (Math.random() - 0.5) * 2.4, rot: (Math.random() - 0.5) * 0.9, col: ['#3DD6C6', '#FF5A4A', '#B9A6FF'][i % 3] }));
    const jolt = ripped ? Math.max(0.9, S.depth || 0) : S.depth >= 0.4 ? S.depth : 0;
    if (jolt) {   // ⚡ you were zoned in: the run yanks you out through every layer, then dives into the next game
      const T1 = 0.45 + 0.45 * jolt + (ripped ? 0.3 : 0), T2 = T1 + 0.25;
      // 🕳️ out of a pocket: one frame more, innermost (the pocket's window inside the game's), the organ's frozen frame round it
      const pocket = ripped ? { snap: ripped.snap, at: { x: host.ox + ripped.at.x * host.k, y: host.oy + ripped.at.y * host.k }, icon: ripped.mod.icon, name: ripped.mod.name } : null;
      transition = { t: 0, dur: reduceMotion ? 0.05 : T2 + 0.6, T1, T2, snap, why, anchor, mood, strips, jolt, from: prev, to, pocket };
      S.jolts = (S.jolts || 0) + 1; const pct = Math.round(jolt * 100), bonus = Math.round(500 * jolt) + (ripped ? POCKET.JOLT : 0); host.add(bonus);
      surfaceNow(); react('stage'); sfx('boom', { size: ripped ? 1.8 : 1.4 }); sfx('twist', { delay: 0.12 }); if (ripped) sfx('surface', { delay: 0.3 }); navigator.vibrate?.(ripped ? [80, 40, 80, 40, 160] : [60, 40, 120]);
      if (ripped) banner(`⚡ JOLT · OUT OF THE POCKET · +${bonus}`, `you were down ${ripped.mod.name} in ${prev.name}: the run pulls you all the way out to ${to.name}`, true);
      else banner(`⚡ JOLT · ${pct}% DEEP · +${bonus}`, `you were zoned into ${prev.name}: the run pulls you out to ${to.name}`, true);
      return;
    }
    surfaceNow();
    transition = { t: 0, dur: reduceMotion ? 0.05 : (mood === 'phi' ? 1.2 : mood === 'bit' ? 1.0 : 0.9), snap, why, anchor, mood, strips };
    if (!reduceMotion) fly(transition.dur); wave('morph', true); banner(`${to.icon} ${to.name.toUpperCase()}`, `${to.verb} · ${WHY[why]} · ${fresh ? 'its own curve, from calm' : `back to its ${STAGES[stageOf()].name}, r ${S.curve.r.toFixed(2)}`}`); sfx(why === 'golden' ? 'birdie' : 'twist');
  }
  function applyTheme(th = active?.theme) { if (!th) return; Object.entries(th).forEach(([k, v]) => stage.style.setProperty(`--${k}`, v)); }
  // ---------------------------------------------------------------- the loop
  // ---------------------------------------------------------------- inside the box (the start and over screens)
  // The site is the box; this is what it's made of, filling the screen behind the card: the logistic map's
  // bifurcation diagram across the lower half with a cursor sweeping r and the orbit sparking at it (the
  // curve, live), the same fractal tree mirrored left and right (symmetry), a golden spiral turning above,
  // Fibonacci rings of dots pulsing from the centre, and Fig in the corner in the run's mood.
  const bb = $('boxbg'), bctx = bb.getContext('2d'); let bif = null;
  function bifurcation(w, h) {   // the diagram as an offscreen canvas: for each r, the orbit after it settles
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x2 = c.getContext('2d');
    for (let i = 0; i < w; i++) { const r = 2.5 + (i / w) * 1.5; let x = 0.3; for (let n = 0; n < 60; n++) x = r * x * (1 - x);
      const col = r < 3 ? '#3DD6C6' : r < 3.449 ? '#C9B8FF' : r < 3.5699 ? '#F5C542' : '#FF5FB0'; x2.fillStyle = col; x2.globalAlpha = 0.5;
      for (let n = 0; n < 48; n++) { x = r * x * (1 - x); x2.fillRect(i, h - 2 - x * (h - 4), 1, 1.2); } }
    return c;
  }
  const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34], PHI = (1 + Math.sqrt(5)) / 2;
  function tree(x, y, a, len, d, sway) { if (d === 0 || len < 2) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; bctx.lineWidth = Math.max(0.6, d * 0.45); bctx.beginPath(); bctx.moveTo(x, y); bctx.lineTo(x2, y2); bctx.stroke(); tree(x2, y2, a - 0.5 + sway, len / PHI, d - 1, sway); tree(x2, y2, a + 0.5 + sway, len / PHI, d - 1, sway); }
  function drawBox(t) {
    const W = bb.width = bb.clientWidth * host.dpr, H = bb.height = bb.clientHeight * host.dpr; if (!W || !H) return; const d = host.dpr, cx = W / 2;
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.fillStyle = '#07060F'; bctx.fillRect(0, 0, W, H);
    // the curve: the diagram across the screen's lower half, a cursor sweeping r 2.5 → 4 over ~20 s, the orbit sparking at it
    const I = { x0: W * 0.06, x1: W * 0.94, y0: H * 0.22, y1: H * 0.46 }, iw = I.x1 - I.x0, ih = I.y1 - I.y0;
    if (!bif || bif.width !== Math.round(iw) || bif.height !== Math.round(ih)) bif = bifurcation(Math.max(2, Math.round(iw)), Math.max(2, Math.round(ih)));
    bctx.drawImage(bif, I.x0, I.y0);
    const u = (t / 20000) % 1, r = 2.5 + u * 1.5, rx = I.x0 + u * iw; let x = 0.5 + 0.3 * Math.sin(t / 1300); for (let n = 0; n < 40; n++) x = r * x * (1 - x);
    const gl = bctx.createRadialGradient(rx, I.y1, 4, rx, I.y1, ih); gl.addColorStop(0, 'rgba(61,214,198,0.18)'); gl.addColorStop(1, 'rgba(61,214,198,0)'); bctx.fillStyle = gl; bctx.fillRect(0, 0, W, H);
    bctx.strokeStyle = r < 3.5699 ? '#F5C542' : '#FF5FB0'; bctx.lineWidth = 1 * d; bctx.globalAlpha = 0.7; bctx.beginPath(); bctx.moveTo(rx, I.y0); bctx.lineTo(rx, I.y1); bctx.stroke();
    for (let n = 0; n < 12; n++) { x = r * x * (1 - x); const py = I.y1 - 2 - x * (ih - 4); bctx.fillStyle = '#fff'; bctx.globalAlpha = 0.9 - n * 0.07; bctx.beginPath(); bctx.arc(rx, py, (2.6 - n * 0.15) * d, 0, 7); bctx.fill(); }
    bctx.fillStyle = '#FFE08A'; bctx.globalAlpha = 0.9; bctx.font = `${Math.round(11 * d)}px ui-monospace, monospace`; bctx.textAlign = 'left'; bctx.textBaseline = 'top'; bctx.fillText(`r ${r.toFixed(2)}`, Math.min(rx + 4 * d, I.x1 - 40 * d), I.y0 - 14 * d);
    // symmetry: the same fractal tree left and right, mirror images, swaying together
    bctx.strokeStyle = '#C9B8FF'; bctx.globalAlpha = 0.5; const sway = Math.sin(t / 1700) * 0.12, tl = H * 0.06;
    tree(W * 0.14, H * 0.22, -Math.PI / 2, tl, 6, sway); tree(W * 0.86, H * 0.22, -Math.PI / 2, tl, 6, -sway);
    // the golden spiral, turning above, its φ rectangles faint behind it
    bctx.save(); bctx.translate(cx, H * 0.1); bctx.rotate(t / 6000); bctx.strokeStyle = '#F5C542'; bctx.globalAlpha = 0.6; bctx.lineWidth = 1.2 * d;
    { let a = 0, rr = 2 * d; bctx.beginPath(); for (let i = 0; i < 160; i++) { a += 0.1; rr *= Math.pow(PHI, 0.1 / (Math.PI / 2)); bctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); if (rr > H * 0.11) break; } bctx.stroke(); }
    bctx.globalAlpha = 0.16; for (let i = 1; i < 6; i++) { const w2 = 6 * d * Math.pow(PHI, i); bctx.strokeRect(-w2 / 2, -w2 / PHI / 2, w2, w2 / PHI); }
    bctx.restore();
    // Fibonacci: rings of 1, 1, 2, 3, 5, 8… dots pulse out from the centre, one ring a beat
    const beat = Math.floor(t / 700) % FIB.length, ring = FIB[beat], e = (t % 700) / 700, fy = H * 0.34;
    bctx.fillStyle = '#3DD6C6'; bctx.globalAlpha = 0.8 * (1 - e); for (let i = 0; i < ring; i++) { const a = (i / ring) * 6.28 + beat; const rad = (0.03 + 0.16 * e) * H; bctx.beginPath(); bctx.arc(cx + Math.cos(a) * rad, fy + Math.sin(a) * rad, 2 * d, 0, 7); bctx.fill(); }
    bctx.globalAlpha = 1;
    // Fig, in the corner, in the run's mood
    drawPal(S.curve.mood || 'calm', bctx, { x: W - 34 * d, y: H * 0.1 + Math.sin(t / 900) * 3 * d, s: 15 * d, t: t / 1000, r: S.curve.r, face: -1 });
  }
  let last = 0;
  function loop(t) {
    if (!$('over').hidden) drawBox(t);
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0); last = t;
    if (running && !S.over) {
      S.time += dt;
      S.beatT += dt; const bl = active.beat || 1; while (S.beatT >= bl && !S.over) { S.beatT -= bl; beat(); }
      if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) S.combo = 0; }
      if (!S.over) { if (pk) stepPocket(dt); else { active.update(dt); stepOffer(dt); } }
      if (resetPending && !S.over) resetOrgan();
      if (Math.abs(zoom - zoomTo) > 0.001 || Math.abs(widen - widenTo) > 0.001) { const e = Math.min(1, dt * 1.5); zoom += (zoomTo - zoom) * e; widen += (widenTo - widen) * e; if (Math.abs(zoom - zoomTo) < 0.002) zoom = zoomTo; if (Math.abs(widen - widenTo) < 0.002) widen = widenTo; size(); }   // 🔍 the board eases out, wider faster than taller
      if (lens) { lens.t += dt; if (lens.t >= lens.dur) clearLens(); }
      stepDepth(dt);
      hud();
    }
    if (host.ox > 0 || host.oy > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = getComputedStyle(stage).getPropertyValue('--bg').trim() || '#0B0918'; ctx.fillRect(0, 0, cv.width, cv.height); }   // zoomed out: the margins in the organ's colour
    ctx.setTransform(host.k, 0, 0, host.k, host.ox, host.oy);
    if (pk) drawPocket(t); else (active || organs[0]).draw(t);
    { const f = deepF(); if (f > 0.01 && running && !S.over) {   // 🌊 the edges close in as you go deeper, breathing slowly
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const Wd = cv.width, Hd = cv.height, br = 1 + 0.04 * Math.sin(t / 1400), r0 = Math.min(Wd, Hd) * (0.62 - 0.22 * f) * br, r1 = Math.hypot(Wd, Hd) * 0.6;
      const vg = ctx.createRadialGradient(Wd / 2, Hd * 0.55, r0, Wd / 2, Hd * 0.55, r1); vg.addColorStop(0, 'rgba(2,4,14,0)'); vg.addColorStop(1, `rgba(2,4,14,${0.72 * f})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, Wd, Hd); ctx.restore(); } }
    if (running && !S.over) drawOffer(t);   // 🕳️ the way in, over the dark
    if (transition?.jolt) {   // ⚡ THE JOLT: out through the layers (the game, the run, the box), a beat at the top, then down into the next game
      const tr = transition; tr.t += dt; const Wd = cv.width, Hd = cv.height, j = tr.jolt, sMin = 0.3 - 0.1 * j, ease = (x) => x * x * (3 - 2 * x);
      if (!live || live.width !== Wd || live.height !== Hd) { live = document.createElement('canvas'); live.width = Wd; live.height = Hd; }
      const showNew = tr.t > (tr.T1 + tr.T2) / 2; if (showNew) live.getContext('2d').drawImage(cv, 0, 0);
      const s0 = tr.t < tr.T1 ? 1 + (sMin - 1) * ease(tr.t / tr.T1) : tr.t < tr.T2 ? sMin : sMin + (1 - sMin) * ease(Math.min(1, (tr.t - tr.T2) / (tr.dur - tr.T2)));
      const shake = tr.t < 0.3 ? (1 - tr.t / 0.3) * (tr.pocket ? 22 : 16) * host.dpr * j : 0, cx = Wd / 2 + (Math.random() - 0.5) * shake, cy = Hd / 2 + (Math.random() - 0.5) * shake, d = host.dpr;
      // 🕳️ from a pocket, until the swap: the pocket's window is innermost (scale ps, centred), the game's is PK× it and hangs
      // so the thing you went in by sits behind the pocket; after the swap the nest is the usual three, and the sizes meet
      const PK = 1.55, pkt = tr.pocket && !showNew ? tr.pocket : null, ps = pkt ? (tr.t < tr.T1 ? 1 + (sMin / PK - 1) * ease(tr.t / tr.T1) : sMin / PK) : 0, s = pkt ? ps * PK : s0;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07060F'; ctx.fillRect(0, 0, Wd, Hd);
      const gw = Wd * s, gh = Hd * s;
      let gcx = cx, gcy = cy;
      if (pkt) { const m = tr.t < tr.T1 ? 1 : Math.max(0, 1 - (tr.t - tr.T1) / Math.max(0.01, (tr.T2 - tr.T1) / 2)), sx = (gw - Wd * ps) / 2, sy = (gh - Hd * ps) / 2;
        gcx = cx - Math.max(-sx, Math.min(sx, (pkt.at.x / Wd - 0.5) * gw)) * m; gcy = cy - Math.max(-sy, Math.min(sy, (pkt.at.y / Hd - 0.5) * gh)) * m; }
      const rect = (k) => [gcx - gw * k / 2, gcy - gh * k / 2, gw * k, gh * k];
      const label = (txt, x, y, col, size) => { ctx.font = `900 ${size * d}px Unbounded, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(txt, x, y); };
      // the box: r4box itself, its gradient rim
      { const [x, y, w, h] = rect(2.35); ctx.fillStyle = '#0E0B22'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 28 * d); ctx.fill(); const g2 = ctx.createLinearGradient(x, y, x + w, y + h); g2.addColorStop(0, '#3DD6C6'); g2.addColorStop(0.5, '#FF5FB0'); g2.addColorStop(1, '#F5C542'); ctx.strokeStyle = g2; ctx.lineWidth = 4 * d; ctx.stroke(); label('r4box · r = 4', cx, y + h - 14 * d, '#F2F4F6', 14); }
      // the run: every game it holds round its rim, the one you're in lit
      { const [x, y, w, h] = rect(1.55); ctx.fillStyle = '#151131'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18 * d); ctx.fill(); ctx.strokeStyle = '#B9A6FF'; ctx.lineWidth = 2.5 * d; ctx.stroke(); label('🧬 CHAOS RUN', cx, y + 18 * d, '#C9B8FF', 11);
        const here = showNew ? tr.to : tr.from; organs.forEach((o, i) => { const u = (i + 0.5) / organs.length, ox = x + w * u, oy = y + h - 14 * d; ctx.globalAlpha = o === here ? 1 : 0.45; ctx.font = `${(o === here ? 20 : 14) * d}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.icon, ox, oy); ctx.textBaseline = 'alphabetic'; }); ctx.globalAlpha = 1; }
      // the game: the world you were in, then the next one, as a window you fall back into
      { const [x, y, w, h] = rect(1); ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(1, 10 * d * (1 - s) + 1)); ctx.clip(); ctx.drawImage(showNew ? live : pkt ? pkt.snap : tr.snap, x, y, w, h); ctx.restore(); ctx.strokeStyle = '#F2F4F6'; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(1, 10 * d * (1 - s) + 1)); ctx.stroke();
        if (s < 0.9) { const o = showNew ? tr.to : tr.from; label(`${o.icon} ${o.name}`, gcx, y + h + 16 * d, '#F2F4F6', 11); } }
      if (pkt) {   // 🕳️ the pocket: the innermost window, where you were, its rim gold
        const w = Wd * ps, h = Hd * ps, x = cx - w / 2, y = cy - h / 2, rr = 8 * d * (1 - ps) + 1;
        ctx.fillStyle = '#000000aa'; ctx.beginPath(); ctx.roundRect(x - 3 * d, y - 3 * d, w + 6 * d, h + 6 * d, rr + 3 * d); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.clip(); ctx.drawImage(tr.snap, x, y, w, h); ctx.restore();
        ctx.strokeStyle = '#F5C542'; ctx.lineWidth = 2.5 * d; ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.stroke();
        if (ps < 0.8) label(`${pkt.icon} ${pkt.name}`, cx, y - 7 * d, '#FFE08A', 10); }
      if (tr.t > tr.T1 && tr.t < tr.T2 + 0.1) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 * Math.sin(((tr.t - tr.T1) / (tr.T2 - tr.T1 + 0.1)) * Math.PI); ctx.fillStyle = '#9BE7FF'; ctx.fillRect(0, 0, Wd, Hd); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }   // the swap: a blink at the top of the pull
      if (tr.t < 0.14) { ctx.globalAlpha = (1 - tr.t / 0.14) * 0.75 * j; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, Wd, Hd); ctx.globalAlpha = 1; }   // the slam
      ctx.restore();
      if (tr.t >= tr.dur) transition = null;
    } else if (transition) {   // the old world zooms away from where you were, and the new one is underneath
      transition.t += dt; const p = Math.min(1, transition.t / transition.dur), e = p * p * (3 - 2 * p);
      // 🟢 Fig (the chip itself, flown into the middle of the field) takes the old world apart in its own way
      const fx = cv.width / 2, fy = cv.height * 0.42, snap = transition.snap, Wd = cv.width, Hd = cv.height, PHI = 1.618;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (transition.mood === 'fig') {   // 🌀 WILD: the world is torn into strips that fly off every which way, colour bands bleeding between them
        const n = transition.strips.length, h = Hd / n;
        transition.strips.forEach((st) => { const y = st.i * h, k = Math.max(0, e - st.i * 0.02), kk = k * k; ctx.save(); ctx.globalAlpha = 1 - kk; ctx.translate(fx + st.vx * Wd * kk, y + h / 2 + (fy - y - h / 2) * kk * 0.5); ctx.rotate(st.rot * kk); ctx.drawImage(snap, 0, y, Wd, h, -fx, -h / 2, Wd, h); ctx.restore();
          if (k > 0 && k < 0.6) { ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = 0.5 * (1 - k); ctx.fillStyle = st.col; ctx.fillRect(0, y + (Math.random() - 0.5) * 8, Wd, h * 0.5); ctx.globalCompositeOperation = 'source-over'; } });
      } else if (transition.mood === 'kit') {   // ✨ MIRROR: the world folds shut like a page on Fig's axis, its two halves meeting as mirror images, then thins to nothing
        const fold = Math.cos(e * Math.PI / 2), wing = Wd / 2;
        [-1, 1].forEach((side) => { ctx.save(); ctx.globalAlpha = 1 - e * e; ctx.translate(fx, 0); ctx.scale(Math.max(0.02, fold), 1); const sx = side < 0 ? 0 : wing; ctx.drawImage(snap, sx, 0, wing, Hd, side < 0 ? -wing : 0, 0, wing, Hd); ctx.restore(); });
        ctx.globalAlpha = (1 - e) * 0.8; ctx.strokeStyle = '#C9B8FF'; ctx.lineWidth = 3 * host.dpr; ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, Hd); ctx.stroke();   // the seam
        ctx.save(); ctx.translate(fx, 0); ctx.scale(-Math.max(0.02, fold), 1); ctx.globalAlpha = (1 - e) * 0.35; ctx.drawImage(snap, 0, 0, wing, Hd, -wing, 0, wing, Hd); ctx.restore();   // its reflection, fainter
      } else if (transition.mood === 'bit') {   // 🔁 BOXY: the world tiles itself into copies of itself, 1 → 4 → 16 → 64, each smaller, each pulled toward Fig, pixel edges and all
        const level = Math.min(3, Math.floor(e * 4)), f = e * 4 - level, n = 2 ** level, tw = Wd / n, th = Hd / n;
        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const cx = (i + 0.5) * tw, cy = (j + 0.5) * th, pull = f * 0.5, z = 1 - f * 0.45; ctx.save(); ctx.globalAlpha = 1 - e * e * 0.9; ctx.translate(cx + (fx - cx) * pull, cy + (fy - cy) * pull); ctx.scale(z, z); ctx.drawImage(snap, 0, 0, Wd, Hd, -tw / 2, -th / 2, tw, th); ctx.restore(); }
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = (1 - e) * 0.6; ctx.strokeStyle = '#9BE7FF'; ctx.lineWidth = 1.5 * host.dpr; for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.moveTo(i * tw, 0); ctx.lineTo(i * tw, Hd); ctx.moveTo(0, i * th); ctx.lineTo(Wd, i * th); ctx.stroke(); }
      } else if (transition.mood === 'phi') {   // 🌻 GOLDEN: the world spirals into Fig, a turn for every φ of shrink, its golden rectangles drawn behind it
        const turns = e * 2.2, z = Math.pow(PHI, -turns * 2.6);
        ctx.globalAlpha = (1 - e) * 0.5; ctx.strokeStyle = '#F5C542'; ctx.lineWidth = 2 * host.dpr; for (let k = 0; k < 6; k++) { const w2 = Wd * 0.9 * Math.pow(PHI, -k) * (1 - e * 0.6), h2 = w2 / PHI; ctx.save(); ctx.translate(fx, fy); ctx.rotate(k * Math.PI / 2 + turns * 6.28 * 0.25); ctx.strokeRect(-w2 / 2, -h2 / 2, w2, h2); ctx.restore(); }
        ctx.save(); ctx.globalAlpha = 1 - e * e; ctx.translate(fx, fy); ctx.rotate(turns * 6.28); ctx.scale(z, z); ctx.translate(-fx, -fy); ctx.drawImage(snap, 0, 0); ctx.restore();
      } else {   // calm: a plain pull into Fig
        const z = 1 - e * 0.94, rot = e * 0.7; ctx.save(); ctx.globalAlpha = 1 - e * e; ctx.translate(fx, fy); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-fx, -fy); ctx.drawImage(snap, 0, 0); ctx.restore();
      }
      ctx.restore();
      if (p >= 1) transition = null;
    }
    if (glitchT > 0) { glitchT -= dt; if (!reduceMotion) tear(); if (glitchT <= 0) { applyTheme(); active?.glitch?.(false); } }
    if (!reduceMotion) drawWaves(dt);
    if (lens?.kind === 'wire') wireframe();
    requestAnimationFrame(loop);
  }
  // ---------------------------------------------------------------- start and end
  function resetOrgan() {   // the organ's lives are gone: it starts over, easy, and the run pays a heart
    const how = resetPending; resetPending = null; S.lives[active.key] = 3; S.hearts -= 1; S.how = how;
    if (S.hearts <= 0) { over(how); return; }
    S.curve = makeCurve(); S.beats = 0; tenure = 0; { const st = STAGES[0]; zoomTo = st.zoom; widenTo = st.widen; } pal.set({ r: S.curve.r, mood: 'calm' }); applyPalTheme('calm');   // its own clock starts over too
    active.start(); active.enter(null, null); applyTheme(); host.ui(''); calm = 0; if (isCalm(active.key)) openCalm();
    banner(`🔁 ${active.name.toUpperCase()} STARTS OVER · ❤️ −1`, `${how} · the run has ${S.hearts} ${S.hearts === 1 ? 'heart' : 'hearts'} left`); sfx('buzz'); navigator.vibrate?.(80);
  }
  function startRun() {
    S.score = 0; S.hearts = 3; S.lives = {}; resetPending = null; S.combo = 0; S.comboT = 0; S.tally = {}; S.curve = makeCurve(); S.beatT = 0; S.beats = 0; S.over = false; S.how = null; S.time = 0; S.morphs = 0; S.allBeats = 0; S.maxR = S.curve.r; S.run = makeCurve(); S.runEv = null; S.firstLook = true; S.depth = 0; S.deepest = 0; S.jolts = 0; S.lastIn = -9; held = 0; $('runmeter').hidden = $('runphase').hidden = !morphs;
    pk = null; offer = null; pend = null; pkCool = 0; pkLast = null; S.pockets = 0; S.pocketWins = 0; S.pocketJolts = 0; stage.classList.remove('inpocket'); $('pocket').hidden = true;
    tenure = 0; prev = null; transition = null; lastUsed = new Map(); clocks = new Map(); active = null; zoom = zoomTo = 1; widen = widenTo = 1; clearLens(); size();
    organs.forEach((o) => o.start());
    active = organs[Math.floor(Math.random() * organs.length)]; active.enter(null, null); applyTheme(); calm = 0;
    $('over').hidden = true; running = true; sfx('click'); pal.wake(); pal.set({ r: S.curve.r, mood: 'calm' }); applyPalTheme('calm'); $('spal').hidden = false;
    banner(`${active.icon} ${active.name.toUpperCase()}`, morphs ? `${active.verb} · the curve will morph the world` : active.verb);
    if (isCalm(active.key)) setTimeout(() => { if (running && !S.over && active && isCalm(active.key)) openCalm(); }, 1800);
  }
  async function over(how) {
    if (S.over) return; S.over = true; S.how = how; running = false; pk = null; offer = null; pend = null; stage.classList.remove('inpocket'); $('pocket').hidden = true; S.depth = 0; setSfxDepth(0, true); stage.style.setProperty('--deep', '0'); $('verb').hidden = true; host.ui(''); pal.sleep(); clearLens();
    const [t1, sub] = active.overText?.(how) || ['GAME OVER', ''];
    sfx(how === 'sleeps' ? 'fanfare' : 'lose');
    showOver(`<h2 style="color:#FF9A8A">${esc(t1)}</h2>${sub ? `<p class="muted small">${esc(sub)}</p>` : ''}<h2>${icon} ${S.score.toLocaleString()} points</h2><p class="muted small">saving…</p>`);
    const level = Math.max(1, Math.min(99, morphs ? 1 + S.morphs : active.level?.() || 1));
    const { data, error } = await sb.rpc('solo_submit', { p_game: key, p_score: S.score, p_level: level, p_events: S.tally });
    const board = data?.top?.length ? `<ol class="board">${data.top.map((r, i) => `<li class="${r.player === me.id ? 'me' : ''}"><span>${i + 1}. ${esc(r.name)}</span><b>${r.score.toLocaleString()}</b></li>`).join('')}</ol>` : '';
    // one row per game (its icon, then its numbers), then the run's numbers as chips: easier to read than one long line
    const rows = organs.map((o) => o.endStats?.()).filter(Boolean).map((t) => { const i = t.indexOf(' '); return `<li><span class="si">${esc(t.slice(0, i))}</span><span>${esc(t.slice(i + 1))}</span></li>`; }).join('');
    const chips = [morphs && `🧬 <b>${S.morphs}</b> morph${S.morphs === 1 ? '' : 's'}`, morphs && `🌐 run <b>r ${S.run.r.toFixed(2)}</b>`, `🌀 ${morphs ? 'best game ' : ''}<b>r ${Math.max(S.maxR || 0, S.curve.r).toFixed(2)}</b>`, `🌊 deepest <b>${Math.round((S.deepest || 0) * 100)}%</b>`, morphs && S.jolts && `⚡ <b>${S.jolts}</b> jolt${S.jolts === 1 ? '' : 's'}`, S.pockets && `🕳️ <b>${S.pocketWins || 0}/${S.pockets}</b> pocket${S.pockets === 1 ? '' : 's'}`].filter(Boolean).map((c) => `<span>${c}</span>`).join('');
    const stats = `${rows ? `<ul class="ostats">${rows}</ul>` : ''}<div class="rchips">${chips}</div>`;
    showOver(`<h2 style="color:#FF9A8A">${esc(t1)}</h2>${sub ? `<p class="muted small">${esc(sub)}</p>` : ''}<h2>${icon} ${S.score.toLocaleString()} points</h2>${data?.record ? '<p style="color:var(--gold);font-weight:900">🏆 Your new best!</p>' : data ? `<p class="muted small">Your best: ${data.best.toLocaleString()}</p>` : ''}
      ${stats}
      ${data?.chaos ? `<p class="small">${ratingLine(data.chaos)}</p>` : ''}
      ${error ? `<p class="small" style="color:#FF9A7A">Couldn't save: ${esc(error.message || '')}</p>` : ''}${board}
      <button class="go" id="again">${esc(again)}</button>`);
  }
  function showOver(html) { $('overCard').innerHTML = html; $('over').hidden = false; const a = $('again'); if (a) a.onclick = startRun; }
  // ---------------------------------------------------------------- input: the shell listens, the organ decides
  const toWorld = (e) => { const r = cv.getBoundingClientRect(); const sx = cv.width / r.width, sy = cv.height / r.height; let x = ((e.clientX - r.left) * sx - host.ox) / host.k; if (lens?.kind === 'mirror') x = host.W - x; return { x: Math.max(0, Math.min(host.W, x)), y: Math.max(0, Math.min(host.H, ((e.clientY - r.top) * sy - host.oy) / host.k)) }; };   // through the zoom-out (and a mirror lens), clamped to the world
  const fwd = (type) => (e) => { if (type === 'down') e.preventDefault(); if (type === 'down') { held += 1; S.lastIn = S.time; } else if (type === 'up') held = Math.max(0, held - 1); if (running && !S.over && active) { const p = toWorld(e);
    if (pk) { if (pk.phase === 'play') pk.mod.pointer?.(type, p, e); return; }   // 🕳️ in a pocket, every touch is the pocket's
    if (type === 'down' && offerHit(p)) { pend = { x: p.x, y: p.y }; return; }   // a press on the way in: a tap dives, a drag is the organ's after all
    if (pend) { if (type === 'move') { if (Math.hypot(p.x - pend.x, p.y - pend.y) > 10) { const q = pend; pend = null; active.pointer('down', q, e); active.pointer('move', p, e); } return; } pend = null; enterPocket(); return; }
    if (type === 'down') host.cue('look', p.x, p.y); else if (type === 'move' && (e.buttons || e.touches)) pal.set({ face: p.x < host.W * 0.3 ? -1 : 1 }); active.pointer(type, p, e); } };   // Fig's eyes follow your finger
  cv.addEventListener('pointerdown', fwd('down')); cv.addEventListener('pointermove', fwd('move'));
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => cv.addEventListener(ev, fwd('up')));
  addEventListener('keydown', (e) => { S.lastIn = S.time; if (running && !S.over) { if (pk) { if (pk.phase === 'play') pk.mod.keydown?.(e); } else active?.keydown?.(e); } });
  addEventListener('keyup', (e) => { if (running && !S.over) { if (pk) pk.mod.keyup?.(e); else active?.keyup?.(e); } });
  window.__shell = () => ({ organ: active?.key, prev: prev?.key, calm, glitch: glitchT > 0, mood: S.curve.mood, stage: stageOf() + 1, zoom, widen, W: host.W, lens: lens?.kind || null, H: host.H, oy: host.oy, cw: cv.getBoundingClientRect().width, k: host.k, ox: host.ox, theme: stage.style.getPropertyValue('--bg'), score: S.score, hearts: S.hearts, combo: S.combo, beats: S.beats, allBeats: S.allBeats, run: S.run && { r: S.run.r, n: S.run.n, x: S.run.x, hold: minTenure(), next: S.runNext }, clocks: Object.fromEntries([...clocks].map(([o, c]) => [o.key, { beats: c.beats, r: c.curve.r, top: c.curve.top || 0 }]).concat(active ? [[active.key, { beats: S.beats, r: S.curve.r, top: S.curve.top || 0, live: true }]] : [])), morphs: S.morphs, depth: S.depth || 0, deep: deepF(), deepest: S.deepest || 0, jolts: S.jolts || 0, jolt: transition?.jolt || 0, r: S.curve.r, n: S.curve.n, window: S.curve.window, over: S.over, tenure, running, transition: !!transition, lives: { ...S.lives },
    pocket: { state: pk ? pk.phase : offer ? 'offer' : 'none', key: pk?.mod.key || null, left: pk?.left ?? null, cool: pkCool, count: S.pockets || 0, wins: S.pocketWins || 0, rips: S.pocketJolts || 0, last: pkLast,
      offer: offer && { x: offer.x, y: offer.y, r: offer.r, t: offer.t, forced: offer.forced, screen: (() => { const r = cv.getBoundingClientRect(); return { x: r.left + (host.ox + offer.x * host.k) * r.width / cv.width, y: r.top + (host.oy + offer.y * host.k) * r.height / cv.height }; })() } },
    jpocket: !!transition?.pocket,
    tally: { ...S.tally }, force: (why) => { if (why === 'glitch') return glitchRun(); if (why === 'pocket') { offer = null; pkCool = 0; return host.pocket.offer(active?.pocketSpot?.(), true); } if (why === 'pocketCool') { pkCool = 0; offer = null; return; } if (why.startsWith('hold:')) { S.testHold = why === 'hold:1'; return; } if (why === 'pocketOut') return exitPocket(false, { why: 'test' }); if (why.startsWith('pocketLeft:')) { if (pk) pk.left = +why.slice(11); return; } if (why === 'pocketIn') { if (!offer) host.pocket.offer(active?.pocketSpot?.(), true); return enterPocket(); } if (why.startsWith('depth:')) { S.depth = +why.slice(6); S.lastIn = S.time; return; } if (why === 'top') { S.curve.n = Math.max(S.curve.n, 28); S.curve.r = CHAOS.RMAX; S.curve.top = TOP_HOLD; return; } if (why === 'climb') { S.curve.n += 20; S.curve.r = Math.min(CHAOS.RMAX, CHAOS.R0 + CHAOS.DR * S.curve.n); return; } if (why.startsWith('lens:')) return putLens(why.slice(5), 3); if (why.startsWith('mood:')) { S.curve.mood = why.slice(5); S.curve.moodLeft = 3; applyPalTheme(S.curve.mood); return; } if (why === 'stage') { S.beats = STAGES[Math.min(3, stageOf() + 1)].beats; zoomTo = STAGES[stageOf()].zoom; widenTo = STAGES[stageOf()].widen; return; } const to = why === 'mirror' && prev ? prev : nextOrgan(); morphTo(to, why); }, over: S.over, end: (how) => over(how), hurt: () => host.hurt('test') });
  // ---------------------------------------------------------------- go
  (async () => {
    if (!(await signedIn())) return;
    setGameTools({ fs: '#play' });
    size(); addEventListener('resize', size);
    new MutationObserver(() => requestAnimationFrame(size)).observe($('play'), { attributes: true, attributeFilter: ['class'] });
    organs.forEach((o) => o.init(host));
    const { data: top } = await sb.from('solo_scores').select('player, score').eq('game', key).order('score', { ascending: false }).limit(40);
    const best = {}; (top || []).forEach((r) => { if (!(r.player in best)) best[r.player] = r.score; });
    const board = Object.entries(best).slice(0, 5);
    showOver(`<h2>${icon} ${esc(title)}</h2>${morphs ? `<div class="organs">${organs.map((o) => `<span title="${esc(o.name)}">${o.icon}</span>`).join('')}</div>` : ''}${intro}
      ${board.length ? `<ol class="board">${board.map(([p, s], i) => `<li class="${p === me.id ? 'me' : ''}"><span>${i + 1}. ${esc(names[p] ?? '?')}</span><b>${s.toLocaleString()}</b></li>`).join('')}</ol>` : ''}
      <button class="go" id="again">Start ${icon}</button>`);
    requestAnimationFrame(loop);
  })();
}
