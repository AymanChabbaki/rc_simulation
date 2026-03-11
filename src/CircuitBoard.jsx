import { useRef, useState, useCallback } from 'react';

// Half-size of every draggable image in normalised board coords (~66 px on a 600 px board)
const IMG_HALF = 0.11;

// ── Coordinate helpers ────────────────────────────────────────────────────────
// The original EjsS board uses a coordinate system roughly [-1..1] in both X
// and Y, centred at (0,0), Y-up.  We map these to SVG pixels given the board
// width (W) and height (H).
export function toSVG(nx, ny, W, H) {
  const px = ((nx + 1) / 2) * W;
  const py = ((1 - (ny + 1) / 2)) * H;  // flip Y
  return [px, py];
}

export function fromSVG(px, py, W, H) {
  const nx = (px / W) * 2 - 1;
  const ny = 1 - (py / H) * 2;
  return [nx, ny];
}

// ── Wire segments from original model ────────────────────────────────────────
// Each entry: { x, y, dx, dy } in normalised coords (dx/dy = size).
const WIRES = [
  { x: -0.7, y:  0.2, dx: 0,   dy: 0.4  }, // P1
  { x: -0.7, y: -0.5, dx: 0,   dy: 0.4  }, // P2
  { x: -0.7, y: -0.5, dx: 1.0, dy: 0    }, // P3
  { x: -0.7, y:  0.6, dx: 0.4, dy: 0    }, // P4
  { x: -0.02,y:  0.2, dx: 0,   dy: 0.4  }, // P5
  { x: -0.01,y: -0.5, dx: 0,   dy: 0.3  }, // P6
  { x:  0.3, y:  0.2, dx: 0,   dy: 0.4  }, // P7
  { x:  0.3, y: -0.5, dx: 0,   dy: 0.4  }, // P8
  { x:  0.3, y: -0.2, dx: 0,   dy: 0.4  }, // P9
];

// Optional capacitor branch wire (shown when slot 4 is occupied)
const SEG_WIRE = { x: 0.05, y: 0.6, dx: 0.25, dy: 0 };

// Connection nodes
const NODES = [
  { x: -0.7,    y:  0.2  },
  { x: -0.7,    y: -0.1  },
  { x: -0.02,   y:  0.6  },
  { x: -0.29,   y:  0.6  },
  { x: -0.009,  y:  0.01 },
  { x: -0.00999,y:  0.2  },
  { x: -0.00999,y: -0.2  },
  { x:  0.3,    y:  0.6  },
];

// ── DraggableImage ─────────────────────────────────────────────────────────────
function DraggableImage({ img, W, H, onDrop }) {
  // Use React STATE so every position change triggers a re-render and the
  // image visually follows the cursor in real time.
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos]       = useState({ x: img.x, y: img.y });
  const svgRectRef = useRef(null);

  const dispX = isDragging ? dragPos.x : img.x;
  const dispY = isDragging ? dragPos.y : img.y;
  const [dpx, dpy] = toSVG(dispX, dispY, W, H);
  const pxHalf = IMG_HALF * (W / 2);

  const onMouseDown = useCallback(e => {
    e.preventDefault();
    // Capture SVG bounding rect once at the start of the drag
    svgRectRef.current = e.currentTarget.closest('svg').getBoundingClientRect();
    setIsDragging(true);
    setDragPos({ x: img.x, y: img.y });

    const move = ev => {
      const r = svgRectRef.current;
      const scaleX = W / r.width;
      const scaleY = H / r.height;
      const [nx, ny] = fromSVG((ev.clientX - r.left) * scaleX, (ev.clientY - r.top) * scaleY, W, H);
      setDragPos({ x: nx, y: ny });        // ← state update → re-render → image follows cursor
    };

    const up = ev => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      setIsDragging(false);
      const r = svgRectRef.current;
      const scaleX = W / r.width;
      const scaleY = H / r.height;
      const [nx, ny] = fromSVG((ev.clientX - r.left) * scaleX, (ev.clientY - r.top) * scaleY, W, H);
      onDrop(img.id, nx, ny);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [img.id, img.x, img.y, W, H, onDrop]);

  // Touch support
  const onTouchStart = useCallback(e => {
    e.preventDefault();
    svgRectRef.current = e.currentTarget.closest('svg').getBoundingClientRect();
    setIsDragging(true);
    setDragPos({ x: img.x, y: img.y });

    const move = ev => {
      const t = ev.touches[0];
      const r = svgRectRef.current;
      const scaleX = W / r.width;
      const scaleY = H / r.height;
      const [nx, ny] = fromSVG((t.clientX - r.left) * scaleX, (t.clientY - r.top) * scaleY, W, H);
      setDragPos({ x: nx, y: ny });
    };

    const up = ev => {
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      setIsDragging(false);
      const t = ev.changedTouches[0];
      const r = svgRectRef.current;
      const scaleX = W / r.width;
      const scaleY = H / r.height;
      const [nx, ny] = fromSVG((t.clientX - r.left) * scaleX, (t.clientY - r.top) * scaleY, W, H);
      onDrop(img.id, nx, ny);
    };

    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }, [img.id, img.x, img.y, W, H, onDrop]);

  if (!img.vis) return null;

  return (
    <image
      href={img.src}
      x={dpx - pxHalf}
      y={dpy - pxHalf}
      width={pxHalf * 2}
      height={pxHalf * 2}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  );
}

// ── CircuitBoard ───────────────────────────────────────────────────────────────
export default function CircuitBoard({ state, onDrop, onReset, W = 600, H = 600 }) {
  function wire(w, key) {
    const [x1, y1] = toSVG(w.x, w.y, W, H);
    const [x2, y2] = toSVG(w.x + w.dx, w.y + w.dy, W, H);
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b37c2f" strokeWidth={3} strokeLinecap="round" />;
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ background: '#d8e8c4', touchAction: 'none', display: 'block', width: '100%', height: 'auto' }}
    >
      {/* Wires */}
      {WIRES.map((w, i) => wire(w, `w${i}`))}
      {state.segVis && wire(SEG_WIRE, 'seg')}

      {/* Connection nodes — PCB pad style */}
      {NODES.map((n, i) => {
        const [nx, ny] = toSVG(n.x, n.y, W, H);
        return (
          <g key={`n${i}`}>
            <circle cx={nx} cy={ny} r={7} fill="#c5deb0" stroke="#b37c2f" strokeWidth={1.5} />
            <circle cx={nx} cy={ny} r={3} fill="#c9a24a" />
          </g>
        );
      })}

      {/* Draggable circuit elements */}
      {state.images.map(img => (
        <DraggableImage key={img.id} img={img} W={W} H={H} onDrop={onDrop} />
      ))}

      {/* Reset button */}
      {(() => {
        const [rx, ry] = toSVG(-0.7, -0.7, W, H);
        return (
          <image
            href="/images/reset1.png"
            x={rx - 30} y={ry - 30} width={60} height={60}
            style={{ cursor: 'pointer' }}
            onClick={onReset}
          />
        );
      })()}
    </svg>
  );
}
