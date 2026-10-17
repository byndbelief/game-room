// Shared data + skins for the r4box apps restyle. Content mirrors byndbelief/r4os static/*.html
// (os, activity, approvals, term) and byndbelief/clearing (diary); code/browser/ntfy are the
// services r4os wires up (code-server, noVNC live view, ntfy r4-* topics).
const AP = window.R4boxDesignSystem_3e3a61;
const apApps = [
  { k: 'os', g: '◎', c: 'var(--teal)', name: 'os' },
  { k: 'diary', g: '✎', c: 'var(--gold)', name: 'diary' },
  { k: 'term', g: '›_', c: 'var(--mint)', name: 'term' },
  { k: 'code', g: '{ }', c: 'var(--violet)', name: 'code' },
  { k: 'browser', g: '◫', c: 'var(--hot)', name: 'browser' },
  { k: 'ntfy', g: '◉', c: 'var(--gold)', name: 'ntfy' },
];
const apProjects = [
  { name: 'leanbrokers', path: '~/projects/leanbrokers', branch: 'main', dirty: 3 },
  { name: 'leanhealth', path: '~/projects/leanhealth', branch: 'main', dirty: 0 },
  { name: 'clearing', path: '~/projects/clearing', branch: 'master', dirty: 1 },
  { name: 'r4os', path: '~/projects/r4os', branch: 'main', dirty: 0 },
  { name: 'game-room', path: '~/projects/game-room', branch: 'main', dirty: 2 },
];
const apSessions = [
  { name: 'leanbrokers', cmd: 'claude', cwd: '~/projects/leanbrokers', ago: '2m ago', on: true, state: 'working', now: 'Editing pricing.php' },
  { name: 'clearing', cmd: 'claude', cwd: '~/projects/clearing', ago: '14m ago', on: false, state: 'your turn', now: 'Asked: keep the rollup at 23:30?' },
  { name: 'r4os', cmd: 'bash', cwd: '~/projects/r4os', ago: '1h ago', on: false, state: 'idle', now: '' },
];
const apPending = { what: 'Click "Place order" on leanbrokers.com', who: 'r4-browser-mcp', left: 4 };
const apIdeas = [
  { title: 'LeanBrokers 2.0 launch', stage: 'ship', last: '2d' },
  { title: 'r4os agent payments', stage: 'branch', last: '3d' },
  { title: 'Session panel', stage: 'deepen', last: '5d' },
  { title: 'Family Battleship', stage: 'ship', last: '8d' },
  { title: 'Dynamic UI', stage: 'spark', last: '30d', parked: true },
];
const apStageCol = { spark: 'var(--violet)', branch: 'var(--hot)', pivot: 'var(--hot)', deepen: 'var(--teal)', ship: 'var(--gold)' };
const apNotes = [
  { t: 'Approve?', b: 'Pay with card "Ops Visa" on leanbrokers.com', ago: 'now', topic: 'r4-alerts', approve: true, c: 'var(--gold)' },
  { t: 'clearing needs you', b: 'Claude is waiting for an answer in tmux session clearing.', ago: '14m', topic: 'r4-alerts', c: 'var(--teal)' },
  { t: 'leanbrokers finished', b: 'Stop: pricing page updated, 3 files changed.', ago: '41m', topic: 'r4-alerts', c: 'var(--teal)' },
  { t: 'Clearing rollup', b: 'Nightly write-up for Oct 16 is in the diary.', ago: '23:30', topic: 'r4-diary', c: 'var(--violet)' },
];
const apSteps = [
  ['◫', 'Opened leanbrokers.com/pricing', '1m'], ['⌨', 'Typed in "Company name"', '1m'], ['◎', 'Asked to click "Place order"', 'now'],
];
const apTerm = [
  ['dim', '~/projects/leanbrokers (main) $ claude'], ['ink', '● Reading pricing.php'], ['ink', '● Editing pricing.php (+18 −6)'],
  ['teal', '✓ Tests passed: 42'], ['ink', '● Running php -l pricing.php'], ['dim', 'No syntax errors detected'], ['gold', '? Commit these changes? (y/n)'],
];
// Two skins: A Soft (rounded panels, display headings, bottom dock) · B Console (hairlines, mono labels, top strip)
const apSkins = {
  A: { id: 'A', r: 20, rIn: 14, pad: '14px 16px', panel: { background: 'var(--r4-panel)', border: '1px solid var(--r4-line)', borderRadius: 20, overflow: 'hidden' },
    h1: { font: '800 28px/1 var(--font-display)', letterSpacing: '-.035em', margin: 0 },
    eyebrow: { font: '800 11px/1 var(--font-body)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--r4-muted)', margin: '0 0 10px 4px' },
    rowLine: '1px solid var(--r4-line)', accent: 'var(--teal)', accentInk: 'var(--teal-ink)', nav: 'dock', btnR: 12 },
  B: { id: 'B', r: 8, rIn: 6, pad: '11px 2px', panel: { borderTop: '1px solid var(--r4-line)', borderBottom: '1px solid var(--r4-line)' },
    h1: { font: '600 13px/1 var(--font-mono)', letterSpacing: '.08em', textTransform: 'uppercase', margin: 0, color: 'var(--r4-muted)' },
    eyebrow: { font: '600 11px/1 var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 6px' },
    rowLine: '1px dashed #ffffff14', accent: 'var(--gold)', accentInk: '#1A1405', nav: 'strip', btnR: 8 },
};
Object.assign(window, { AP, apApps, apProjects, apSessions, apPending, apIdeas, apStageCol, apNotes, apSteps, apTerm, apSkins });
