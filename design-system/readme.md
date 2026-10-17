# r4box Design System

r4box is a family's own corner of the internet: a **game room** for three players (and a few robots) at games.r4box.com, and **the box**, a private server that runs everything else (an agent console, a diary, a terminal, an editor, a watched browser, a notification relay), reachable only over the family tailnet. The front door at r4box.com links to both.

The name comes from the logistic map, x → r·x(1 − x). At r = 4 the curve is fully chaotic. The whole brand is built on that idea: the bifurcation diagram is the hero image, the curve's phases name the colours, and the companion, **Fig**, is "made of the chaos curve".

## Sources
- https://github.com/byndbelief/r4box-home — the front door (r4box.com): one static `index.html`, `404.html`, `door.js`, `sw.js`, icons.
- https://github.com/byndbelief/game-room — the game room (games.r4box.com): plain HTML/JS in `web/` (no build), Supabase backend. Key files: `web/style.css`, `web/theme.css`, `web/app.js` (login, lobby, Battleship, scoreboard), `web/pals.js` (Fig), plus `golf.html`, `duel.html`, `cards.html`, `war.html`, arcade pages and `web/organs/*`.

Explore those repos further for anything not covered here (Putt Post, Hilltop Duel, Chaos Cards, War, the arcade games and the Design Studio were not recreated).

## Products
1. **r4box.com** — marketing-style front door. Dark, a full-bleed animated bifurcation diagram behind a giant Unbounded headline, a "Game room" door panel and "The box" hub grid. → `ui_kits/r4box-home/`
2. **Game room** (games.r4box.com) — mobile-first PWA. Sign in, lobby (Route to Chaos hero, Your move strip, Your games list, backpack, chaos feed), turn-based games, family scoreboard and trophy case. → `ui_kits/game-room/`

## Index
- `styles.css` — entry point; only `@import`s.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css` (spacing, radii, shadows, motion), `base.css` (resets, focus ring, keyframes).
- `guidelines/` — foundation specimen cards (colours, type, radii, spacing, shadows, backgrounds, logo, iconography, stamps).
- `components/` — React primitives (see below), each with `.jsx`, `.d.ts`, `.prompt.md` and a card per folder.
- `ui_kits/r4box-home/`, `ui_kits/game-room/` — click-through recreations.
- `assets/` — `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `avatars/phoenix_lord.jpg`.
- `thumbnail.html`, `SKILL.md`, `github.md`.

## Components
- brand: **R4Mark**, **Bifurcation**
- core: **Button**, **EnterButton**, **Chip**, **Pill**, **Status**, **Card**, **Field**, **Segmented**, **BotStep**, **LiveDot**
- lobby: **Avatar**, **GamePreview**, **GameCard**, **GameRow**, **UpCard**, **QuickEntry**
- game: **Board**, **BoardCell**, **Stamp**
- home: **HubTile**, **GamesDoor**
- stats: **StatCard**, **Badge**

The source has no component library; it's plain HTML strings with CSS classes. Each component maps to a class family in `web/style.css` / r4box-home `index.html`: Button = `button`/`.primary`/`.fire`/`.link`, EnterButton = `.enter`/`.cta`, Chip = `.chip`, Pill = `.pill`, Status = `.status`, Card = `.card`, Field = `.field`, Segmented = `.seg`, BotStep = `.botstep`, LiveDot = `.live`, Avatar = `.hnav`/`.mini`/`.avatar`, GameCard = `.ncard`, GameRow = `.grow`, UpCard = `.upcard`, QuickEntry = `.quickentry`, Board/BoardCell = `.board`/`.cell`, Stamp = `.stamp`, HubTile = `.tile`, GamesDoor = `.door`, StatCard = `.scard`, Badge = `.badge`, R4Mark = `.r4mark`.

### Intentional additions
- **GamePreview** — the app paints live canvas previews per game (`drawPreview` in app.js); this stands in with the dark #0E0A24 well and the game's emoji.
- **Bifurcation** — the canvas hero drawn by r4box.com's inline script, packaged so other pages can reuse it (algorithm and colours copied verbatim).

---

## CONTENT FUNDAMENTALS
- **Voice:** warm, family-insider, a little mischievous. It talks to players as "you" and about the family as "we/our" ("Tailnet only: these open from our own devices, nowhere else"). Fig speaks in first person ("Hi, I'm Fig. I live in r4box.").
- **Plain, specific sentences.** Rules are explained concretely: "Right: they lose their next turn. Wrong: you fire one shot fewer." "Pick 3 squares on dad_commander's board, then fire."
- **Colons over dashes.** The copy joins clauses with colons and middots: "Clearing: every session written up nightly", "2–4 players · 🧘 calm", "r4box · at r = 4 the curve never settles, and never repeats". Em-dashes are essentially absent.
- **Casing:** sentence case for headings and buttons ("Your move", "Start a rivalry", "Turn on turn alerts"). Uppercase only in eyebrows. Product nouns are capitalised as names: Route to Chaos, Putt Post, Hilltop Duel, Chaos Cards, The Gauntlet, The Box. "r4box" is always lowercase.
- **Maths as flavour.** The curve shows up literally in copy: "x → r·x(1 − x)", "3.5699… → chaos", "Calm to Strange Attractor", golden cuts, Fibonacci beats, φ.
- **Cheating is a feature.** "Cheat (if you dare)", "Cheating is allowed, catching a cheater pays, and Fig is watching." "🚨 Call cheater!"
- **Emoji are part of the voice**: every game, loot item, cheat and section heading carries one (⚓ Battleship, 🎒 Backpack, 🌀 Chaos ratings, 👀 Peek). Use one emoji per label, at the front.
- **Usernames are lowercase handles** (`dad_commander`, `phoenix_lord`, `obanai_rocks`, `admiral_bot`). Greetings rotate per companion: "Ready to get wild, {name}?", "Mirror, mirror, {name}.", "Boxes in boxes, {name}.", "Slow and golden, {name}."
- **Moments shout.** In-game stamps are short and all caps: HIT!, SUNK!, SPLASH.

## VISUAL FOUNDATIONS
- **Colour:** dark only. One deep ink-violet page (#0B0918), panels #171331 / #1F1A3F, hairlines #2F2957, ink #F3F1FF, muted lavender #ACA5D6. Meaning comes from the curve's colours: **teal #3DD6C6 = calm** (primary actions, links, progress), **violet #B9A6FF = the window** (eyebrows, Chaos pills), **gold #F5C542 = golden / your turn** (selection rings, "Your turn", focus outline), **hot #FF5A4A = a peak** (fire, hits, cheats, streaks), mint #C9FFF8 as a rare highlight. Inks on colour are near-black tints of that colour (#062A26 on teal, #2A2100 on gold).
- **Companion theming:** `data-pal` on `:root` (fig / kit / bit / phi) swaps `--pal`, `--pal-2`, `--pal-ink`, so primary buttons, eyebrows and the hero hairline take the player's companion colours; each also sets a faint wallpaper (diagonal streaks, a mirrored seam, a 44px box grid, golden rings).
- **Type:** Unbounded (wide geometric display) for the mark, headings, CTAs, big numbers; 800 for the hero (−.035em, lh .98), 700 for headings (−.01em), 400 for numerals. Sora for everything else: 400 reading, 700 for UI labels and buttons, 800 for eyebrows. System mono for hostnames, the live x and maths.
- **Backgrounds:** two soft radial glows at the top of the page (violet top-left, deep teal top-right) over the ink, `background-attachment: fixed`. No photography. The only "imagery" is generative: the bifurcation diagram, canvas game previews and Fig (also canvas). Panels sometimes carry corner radial glows (teal top-left, hot bottom-right).
- **Gradients:** used for brand moments only: the curve gradient on hero text (teal→violet→gold→hot), the conic gradient in the mark's box glyph, a 1.5px gradient hairline around the lobby hero, teal→violet avatars. Never as large flat fills.
- **Borders and cards:** cards are #171331 with a 1px or 1.5px #2F2957 border, 16–20px radius, no shadow at rest. Selection = gold border + 2px gold ring (or teal ring + glow for a picked game card). "Your move" = gold border with a 4px inset gold bar.
- **Radii:** 4 (board cells) · 8 (thumbs) · 10 (inputs) · 12 (buttons, glyph squares) · 14 (enter, rows of glass) · 16 (rows, game cards) · 18 (cards) · 20 (hub tiles) · 24 (hero) · 28 (door) · 999 (chips, pills).
- **Shadows:** dark, soft, used for lift on hover (0 10px 24px #0003) and coloured glows on primary CTAs (0 10px 34px teal @30%). The hero has a deep 0 30px 60px drop.
- **Transparency/glass:** secondary surfaces are white at 3–14% alpha (#ffffff08 list items, #ffffff0e alt buttons, #ffffff22 borders). No backdrop blur.
- **Hover:** cards lift (translateY −2 / −3px) with a soft shadow; list rows slide right 3px; tiles swap the border to their accent and wash 7% of it into the panel; CTAs brighten (brightness 1.08) or lift with a stronger glow; glass items go from 6% to 11% white. Transitions .12–.2s.
- **Press / focus:** focus is a 3px gold outline, 2px offset, everywhere. Disabled = opacity .45. No shrink on press except the fire button's pulse.
- **Animation:** playful and physical in games: the fire button breathes, hits burn, sunk cells glow like embers, landings overshoot (cubic-bezier(.2,1.8,.4,1)), stamps slam in rotated and fade, the screen quakes on a hit. Chrome is calm: the mark's glyph hue-rotates over 18s, the bifurcation draws itself left to right, online dots pulse. Everything respects prefers-reduced-motion.
- **Layout:** content max 1100px (home, games) / 1320px (lobby on desktop as `1fr 380px`). Mobile-first; the Battleship fire bar is fixed to the bottom on phones and becomes a centred floating panel on desktop. Generous 20px vertical gaps between sections.

## ICONOGRAPHY
- **No icon font, no SVG icon set.** The source uses **emoji** as icons throughout the game room (games ⚓ ⛳ 💥 🃏 ⚔️ 🌀, loot 📡 🎆 🏌️ 🧲 🛡️ 💣 📜, cheats 👀 ➕ 🚢, sections 🎒 🏅 🎨 🎯 🏆 🤖). Keep them; render at native colour, often 20–48px, sometimes with a drop-shadow glow.
- **Unicode glyphs** for the box hub on r4box.com: ◎ ✎ ›_ { } ◫ ◉, in 40px tinted squares. Arrows and chevrons are text: → › ‹ ✕ − +.
- **The mark:** `assets/icon.svg` is the app icon (a rounded gradient-bordered square with the logistic arc and a gold dot). The in-page word mark is CSS (see R4Mark). Don't redraw either.
- If you need a glyph that isn't an emoji or Unicode character, ask; there's no line-icon style to match.

## Fonts
Both families load from Google Fonts in the source (`Unbounded` 500/700/800, `Sora` 400/600/800); no font binaries exist in the repos, so `tokens/fonts.css` imports the same Google Fonts URL rather than declaring `@font-face`.
