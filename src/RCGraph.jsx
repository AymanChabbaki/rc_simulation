import { useEffect, useRef } from 'react';
import { C_MAP } from './simulation';

export default function RCGraph({ type, R, Res2, vg }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const Cval = C_MAP[Math.min(Math.round(Res2) - 1, 4)] || 1e-6;
    const tau  = R * Cval;
    const E    = vg > 0 ? vg : 5;

    const ctx   = canvas.getContext('2d');
    const W     = canvas.width;
    const H     = canvas.height;
    const padL  = 65, padR = 24, padT = 60, padB = 50;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const color = type === 'charge' ? '#1565c0' : '#e65100';

    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = color;
    ctx.font      = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      type === 'charge'
        ? 'Charge RC:  Vc(t) = E(1 − e^(−t/τ))'
        : 'Décharge RC:  Vc(t) = E · e^(−t/τ)',
      W / 2, 22
    );

    // Info line
    ctx.fillStyle = '#555';
    ctx.font      = '11px Arial';
    ctx.fillText(
      `R=${R.toFixed(0)}Ω  C=${(Cval * 1e6).toFixed(0)}μF  τ=${(tau * 1000).toFixed(2)}ms  E=${E.toFixed(1)}V`,
      W / 2, 39
    );

    // Plot border
    ctx.strokeStyle = '#333';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Grid + labels
    for (let k = 0; k <= 5; k++) {
      const gx = padL + (k / 5) * plotW;
      const gy = padT + plotH - (k / 5) * plotH;

      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke();

      ctx.fillStyle  = '#333';
      ctx.font       = '11px Arial';
      ctx.textAlign  = 'center';
      ctx.fillText(k === 0 ? '0' : k === 1 ? 'τ' : `${k}τ`, gx, padT + plotH + 16);

      ctx.textAlign  = 'right';
      ctx.fillText(`${((k / 5) * E).toFixed(1)}V`, padL - 6, gy + 4);
    }

    // Axis labels
    ctx.fillStyle  = '#333';
    ctx.font       = '13px Arial';
    ctx.textAlign  = 'center';
    ctx.fillText('t', padL + plotW / 2, H - 8);
    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Vc (V)', 0, 0);
    ctx.restore();

    // Asymptote dashed line at E
    ctx.strokeStyle = 'red';
    ctx.lineWidth   = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL + plotW, padT); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle  = 'red';
    ctx.font       = '11px Arial';
    ctx.textAlign  = 'right';
    ctx.fillText(`E=${E.toFixed(1)}V`, padL + plotW - 2, padT - 4);

    // τ crosshair
    const tauXpx  = padL + (1 / 5) * plotW;
    const tauYval = type === 'charge' ? (1 - Math.exp(-1)) : Math.exp(-1);
    const tauYpx  = padT + plotH - tauYval * plotH;

    ctx.strokeStyle = '#888';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(tauXpx, padT + plotH); ctx.lineTo(tauXpx, tauYpx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, tauYpx); ctx.lineTo(tauXpx, tauYpx); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(tauXpx, tauYpx, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle  = '#555';
    ctx.font       = 'bold 12px Arial';
    ctx.textAlign  = 'left';
    ctx.fillText(`${(tauYval * E).toFixed(2)}V @ τ`, tauXpx + 8, tauYpx - 6);

    // Main curve
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 500; i++) {
      const t  = (i / 500) * 5 * tau;
      const Vc = type === 'charge' ? E * (1 - Math.exp(-t / tau)) : E * Math.exp(-t / tau);
      const px = padL + (i / 500) * plotW;
      const py = padT + plotH - (Vc / E) * plotH;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [type, R, Res2, vg]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={560}
      style={{ border: '1px solid #ccc', background: '#fff', display: 'block' }}
    />
  );
}
