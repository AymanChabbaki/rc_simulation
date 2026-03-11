import { useEffect, useRef } from 'react';
import { C_MAP } from './simulation';

const TOTAL_POINTS = 600;
const ANIM_DURATION_MS = 1400; // ms for the curve to fully draw

export default function RCGraph({ type, R, Res2, vg, w = 420, h = 460 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const Cval = C_MAP[Math.min(Math.round(Res2) - 1, 4)] || 1e-6;
    const tau  = R * Cval;
    const E    = vg > 0 ? vg : 5;

    const dpr  = window.devicePixelRatio || 1;
    const W    = canvas.width  / dpr;
    const H    = canvas.height / dpr;
    const ctx  = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padL  = 72, padR = 28, padT = 72, padB = 56;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const isCharge = type === 'charge';
    const accent   = isCharge ? '#5a9900' : '#d97706';   // dark lime / amber (curve + title)
    const accentCurve = isCharge ? '#a3e635' : '#f59e0b'; // vivid for the line
    const glow     = isCharge ? 'rgba(163,230,53,0.25)' : 'rgba(245,158,11,0.25)';

    // ── precompute curve points ──────────────────────────────────────────────
    function vcAt(i) {
      const t  = (i / TOTAL_POINTS) * 5 * tau;
      const Vc = isCharge ? E * (1 - Math.exp(-t / tau)) : E * Math.exp(-t / tau);
      const px = padL + (i / TOTAL_POINTS) * plotW;
      const py = padT + plotH - (Vc / E) * plotH;
      return [px, py, Vc];
    }

    // ── static scene (drawn once, beneath animation) ─────────────────────────
    function drawStatic() {
      // Background — light
      ctx.fillStyle = '#f8faf4';
      ctx.fillRect(0, 0, W, H);

      // Panel card shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur  = 20;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(padL - 8, padT - 8, plotW + 16, plotH + 16, 10);
      ctx.fill();
      ctx.restore();

      // Plot area background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(padL, padT, plotW, plotH, 6);
      ctx.fill();

      // Grid lines
      for (let k = 0; k <= 5; k++) {
        const gx = padL + (k / 5) * plotW;
        const gy = padT + plotH - (k / 5) * plotH;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke();

        // X labels
        ctx.fillStyle  = 'rgba(0,0,0,0.4)';
        ctx.font       = '11px "IBM Plex Mono", monospace';
        ctx.textAlign  = 'center';
        ctx.fillText(k === 0 ? '0' : k === 1 ? 'τ' : `${k}τ`, gx, padT + plotH + 18);

        // Y labels
        ctx.textAlign = 'right';
        ctx.fillText(`${((k / 5) * E).toFixed(1)}`, padL - 8, gy + 4);
      }

      // Axis labels
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font      = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Temps (t)', padL + plotW / 2, H - 10);
      ctx.save();
      ctx.translate(18, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Vc (V)', 0, 0);
      ctx.restore();

      // Plot border
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(padL, padT, plotW, plotH, 6);
      ctx.stroke();

      // Asymptote at E
      ctx.strokeStyle = 'rgba(220,38,38,0.4)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL + plotW, padT); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(180,20,20,0.6)';
      ctx.font      = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`E = ${E.toFixed(1)} V`, padL + plotW - 4, padT - 6);

      // τ crosshair
      const tauXpx  = padL + (1 / 5) * plotW;
      const tauYval = isCharge ? (1 - Math.exp(-1)) : Math.exp(-1);
      const tauYpx  = padT + plotH - tauYval * plotH;
      ctx.strokeStyle = 'rgba(140, 90, 0, 0.35)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(tauXpx, padT + plotH); ctx.lineTo(tauXpx, tauYpx); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, tauYpx); ctx.lineTo(tauXpx, tauYpx); ctx.stroke();
      ctx.setLineDash([]);

      // τ label
      ctx.fillStyle = 'rgba(120,70,0,0.65)';
      ctx.font      = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${(tauYval * E).toFixed(2)} V @ τ`, tauXpx + 6, tauYpx - 5);

      // Title — charge or discharge label only
      ctx.fillStyle = accent;
      ctx.font      = '12px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isCharge ? 'Charge' : 'Décharge',
        W / 2, 24
      );

      // Params line — R and E only
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.font      = '10px "IBM Plex Mono", monospace';
      ctx.fillText(
        `R=${R.toFixed(0)}Ω  E=${E.toFixed(1)}V`,
        W / 2, 42
      );
    }

    // ── animated draw ────────────────────────────────────────────────────────
    let startTs = null;

    function frame(ts) {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / ANIM_DURATION_MS, 1);
      // easeInOut
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const maxI = Math.floor(ease * TOTAL_POINTS);

      // Redraw static scene each frame (fast — no heavy ops)
      drawStatic();

      if (maxI < 1) { rafRef.current = requestAnimationFrame(frame); return; }

      // Gradient fill under curve
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(padL, padT + plotH);
      for (let i = 0; i <= maxI; i++) {
        const [px, py] = vcAt(i);
        i === 0 ? ctx.lineTo(px, padT + plotH) : ctx.lineTo(px, py);
      }
      const [lastPx] = vcAt(maxI);
      ctx.lineTo(lastPx, padT + plotH);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      fillGrad.addColorStop(0, glow);
      fillGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();
      ctx.restore();

      // Glow shadow for the stroke
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur  = 18;
      ctx.strokeStyle = accentCurve;
      ctx.lineWidth   = 3;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';
      ctx.beginPath();
      for (let i = 0; i <= maxI; i++) {
        const [px, py] = vcAt(i);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Animated cursor dot at tip of curve
      const [curPx, curPy] = vcAt(maxI);
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

      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [type, R, Res2, vg, w, h]);

  return (
    <canvas
      ref={canvasRef}
      width={w * (window.devicePixelRatio || 1)}
      height={h * (window.devicePixelRatio || 1)}
      style={{
        width: w, height: h,
        display: 'block',
      }}
    />
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


