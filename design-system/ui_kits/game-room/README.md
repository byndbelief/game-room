# Game room UI kit (games.r4box.com)
Recreated from `byndbelief/game-room` `web/app.js` + `web/style.css` + `web/theme.css`.

Screens (click-through in `index.html`; last screen persists in localStorage `r4kit.screen`):
- `Login.jsx` — "Game on" sign-in with Fig's speech bubble (any password works).
- `Lobby.jsx` — desktop lobby: Route to Chaos box hero (with Start a rivalry fold), Your move strip, side rail (quick entries, Your games, Backpack, Chaos). Also `Practice` (Pick a game cards).
- `Battleship.jsx` — your turn: cheat bar, opponent's waters + your fleet, latest shots, floating fire bar; aim 3 squares and fire for a stamp.
- `Scoreboard.jsx` — family scoreboard, trophy badges, head to head, chaos ratings.

Not recreated: Putt Post, Hilltop Duel, Chaos Cards, War, arcade games, Design Studio, Fig's canvas drawing (shown as 🟢), live canvas previews (GamePreview placeholder).
