import React from 'react';
// The bifurcation diagram of x -> r·x(1−x), r sweeping 2.5 -> 4. Algorithm and colours copied from r4box.com.
export function Bifurcation({ height = 320, animate = true, r0 = 2.5, r1 = 4, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext('2d');
    const ONSET = 3.5699;
    const colour = (r) => r < 3 ? [61,214,198] : r < 3.449 ? [185,166,255] : r < ONSET ? [245,197,66] : (r > 3.8284 && r < 3.857) ? [201,255,248] : [255,90,74];
    let w, h, col = 0, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), b = cv.getBoundingClientRect();
    w = cv.width = Math.round(b.width * dpr); h = cv.height = Math.round(b.height * dpr);
    const column = (i) => { const r = r0 + (r1 - r0) * (i / w), [cr, cg, cb] = colour(r); const pts = r < ONSET ? 60 : 260, a = r < ONSET ? .5 : .14;
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + a + ')'; let x = .5; for (let k = 0; k < 300; k++) x = r * x * (1 - x);
      for (let k = 0; k < pts; k++) { x = r * x * (1 - x); ctx.fillRect(i, h * .08 + (1 - x) * h * .84, 1, 1); } };
    const frame = () => { const step = Math.max(2, Math.round(w / 140)); for (let n = 0; n < step && col < w; n++) column(col++); if (col < w) raf = requestAnimationFrame(frame); };
    if (!animate) { while (col < w) column(col++); } else frame();
    return () => cancelAnimationFrame(raf);
  }, [height, animate, r0, r1]);
  return <canvas ref={ref} aria-hidden="true" style={{ display: 'block', width: '100%', height, ...style }}></canvas>;
}
