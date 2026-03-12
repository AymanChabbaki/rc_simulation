import { useEffect, useRef } from 'react';
import { C_MAP } from './simulation';

const TOTAL_POINTS = 600;
const ANIM_DURATION_MS = 1400;

export default function RCGraph({ type, R, Res2, vg }) {
  const wrapRef      = useRef(null);
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const finalDrawRef = useRef(null); // redraws completed curve after canvas is resized

  // ── Keep canvas resolution in sync with wrapper size ─────────────────────
  // No state update → no App re-render → no layout loop
  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const applySize = (w) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = w * dpr;
      canvas.height = w * dpr;
      // If animation already finished, redraw completed curve at new size
      if (finalDrawRef.current) requestAnimationFrame(finalDrawRef.current);
    };

    // Set initial size synchronously so animation effect sees correct dims
    const iw = Math.round(wrap.getBoundingClientRect().width);
    if (iw > 0) applySize(iw);

    let timer = null;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w <= 0) return;
      clearTimeout(timer);
      timer = setTimeout(() => applySize(w), 300);
    });
    ro.observe(wrap);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  // ── Animation — restarts only when circuit params change ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    finalDrawRef.current = null;

    const Cval = C_MAP[Math.min(Math.round(Res2) - 1, 4)] || 1e-6;
    const tau  = R * Cval;
    const E    = vg > 0 ? vg : 5;

    const isCharge    = type === 'charge';
    const accent      = isCharge ? '#5a9900' : '#d97706';
    const accentCurve = isCharge ? '#a3e635' : '#f59e0b';
    const glow        = isCharge ? 'rgba(163,230,53,0.25)' : 'rgba(245,158,11,0.25)';

    const padL = 72, padR = 28, padT = 72, padB = 56;

    // Read current canvas dimensions fresh each time (adapts to resize)
    function getDims() {
      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.width  / dpr;
      const H   = canvas.height / dpr;
      return { W, H, dpr, plotW: W - padL - padR, plotH: H - padT - padB };
    }

    function vcAt(i, plotW, plotH) {
      const t  = (i / TOTAL_POINTS) * 5 * tau;
      const Vc = isCharge ? E * (1 - Math.exp(-t / tau)) : E * Math.exp(-t / tau);
      const px = padL + (i / TOTAL_POINTS) * plotW;
      const py = padT + plotH - (Vc / E) * plotH;
      return [px, py, Vc];
    }

    function drawStatic(ctx, W, H, plotW, plotH) {
      ctx.fillStyle = '#f8faf4';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur  = 20;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(padL - 8, padT - 8, plotW + 16, plotH + 16, 10);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(padL, padT, plotW, plotH, 6);
      ctx.fill();

      for (let k = 0; k <= 5; k++) {
        const gx = padL + (k / 5) * plotW;
        const gy = padT + plotH - (k / 5) * plotH;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke();
        ctx.fillStyle  = 'rgba(0,0,0,0.4)';
        ctx.font       = '11px "IBM Plex Mono", monospace';
        ctx.textAlign  = 'center';
        ctx.fillText(k === 0 ? '0' : k === 1 ? 'τ' : `${k}τ`, gx, padT + plotH + 18);
        ctx.textAlign = 'right';
        ctx.fillText(`${((k / 5) * E).toFixed(1)}`, padL - 8, gy + 4);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font      = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Temps (t)', padL + plotW / 2, H - 10);
      ctx.save();
      ctx.translate(18, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Vc (V)', 0, 0);
      ctx.restore();

      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(padL, padT, plotW, plotH, 6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(220,38,38,0.4)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL + plotW, padT); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(180,20,20,0.6)';
      ctx.font      = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`E = ${E.toFixed(1)} V`, padL + plotW - 4, padT - 6);

      ctx.fillStyle = accent;
      ctx.font      = '12px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isCharge ? 'Charge' : 'Décharge', W / 2, 24);

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.font      = '10px "IBM Plex Mono", monospace';
      ctx.fillText(`R=${R.toFixed(0)}Ω  E=${E.toFixed(1)}V`, W / 2, 42);
    }

    function drawCurve(ctx, maxI, plotW, plotH) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(padL, padT + plotH);
      for (let i = 0; i <= maxI; i++) {
        const [px, py] = vcAt(i, plotW, plotH);
        i === 0 ? ctx.lineTo(px, padT + plotH) : ctx.lineTo(px, py);
      }
      const [lastPx] = vcAt(maxI, plotW, plotH);
      ctx.lineTo(lastPx, padT + plotH);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      fillGrad.addColorStop(0, glow);
      fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur  = 18;
      ctx.strokeStyle = accentCurve;
      ctx.lineWidth   = 3;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';
      ctx.beginPath();
      for (let i = 0; i <= maxI; i++) {
        const [px, py] = vcAt(i, plotW, plotH);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      const [curPx, curPy] = vcAt(maxI, plotW, plotH);
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur  = 16;
      ctx.fillStyle   = '#fff';
      ctx.beginPath();
      ctx.arc(curPx, curPy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accentCurve;
      ctx.beginPath();
      ctx.arc(curPx, curPy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let startTs = null;

    function frame(ts) {
      const { W, H, dpr, plotW, plotH } = getDims();
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / ANIM_DURATION_MS, 1);
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const maxI = Math.floor(ease * TOTAL_POINTS);

      drawStatic(ctx, W, H, plotW, plotH);
      if (maxI >= 1) drawCurve(ctx, maxI, plotW, plotH);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        // Store final-state draw fn so canvas resize can restore it
        finalDrawRef.current = () => {
          const { W: w2, H: h2, dpr: d2, plotW: pw2, plotH: ph2 } = getDims();
          const ctx2 = canvas.getContext('2d');
          ctx2.setTransform(d2, 0, 0, d2, 0, 0);
          drawStatic(ctx2, w2, h2, pw2, ph2);
          drawCurve(ctx2, TOTAL_POINTS, pw2, ph2);
        };
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [type, R, Res2, vg]);

  return (
    <div ref={wrapRef} style={{ width: '100%', aspectRatio: '1' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

// polyfill roundRect for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}


