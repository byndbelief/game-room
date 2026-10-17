// shared bits for the playful logins
const lgPhase = (r) => r < 3 ? '#3DD6C6' : r < 3.5699 ? '#B9A6FF' : r < 3.83 ? '#F5C542' : '#FF5A4A';
function useCanvas(draw, deps) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const paint = () => { const r = cv.parentNode.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(ctx, r.width, r.height); };
    paint(); const ro = new ResizeObserver(paint); ro.observe(cv.parentNode); return () => ro.disconnect();
  }, deps);
  return ref;
}
// draws the attractor from r=2.6 up to rMax across the full width
function drawAttractor(ctx, w, h, rMax, R0 = 2.6) {
  ctx.clearRect(0, 0, w, h);
  const cols = Math.ceil(w);
  for (let c = 0; c < cols; c++) {
    const r = R0 + (4 - R0) * (c / cols); if (r > rMax) break;
    let x = .5; for (let i = 0; i < 200; i++) x = r * x * (1 - x);
    ctx.fillStyle = lgPhase(r); ctx.globalAlpha = .55;
    for (let i = 0; i < 90; i++) { x = r * x * (1 - x); ctx.fillRect(c, h - x * h, 1.2, 1.2); }
  }
  ctx.globalAlpha = 1;
}
function FallbackLink({ onClick }) {
  return <LG.Button variant="link" onClick={onClick} style={{ color: 'var(--r4-muted)' }}>Use a password or email link</LG.Button>;
}
Object.assign(window, { lgPhase, useCanvas, drawAttractor, FallbackLink });
