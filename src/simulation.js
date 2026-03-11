// ── Simulation constants ─────────────────────────────────────────────────────
export const CAL_V  = [0.1, 1, 10, 100, 1000];
export const RES_V  = [2000, 20000, 200000, 2000000, 20000000];
export const CAL_A  = [0.001, 0.01, 0.1, 1, 5];
export const RES_A  = [6, 5, 2, 0.2, 0.05];
export const C_MAP  = [0.000001, 0.00001, 0.0001, 0.001, 0.01];

// 8 snap-zone definitions: [type, x1, x2, y1, y2, snapX, snapY, label]
// Coordinates are in the normalised [-1..1] space used by the SVG board.
export const POSITIONS = [
  ["v", -0.85, -0.55,  0.05,  0.35, -0.698,  0.050, "s1-s2"],
  ["v", -0.11,  0.09,  0.10,  0.30, -0.009,  0.105, "s5-s52"],
  ["v", -0.11,  0.09, -0.25, -0.05, -0.009, -0.095, "s52-s6"],
  ["h", -0.40, -0.05,  0.50,  0.70, -0.155,  0.599, "s4-s3"],
  ["h",  0.05,  0.45,  0.50,  0.70,  0.140,  0.599, "s3-s7"],
  ["h", -0.40, -0.05,  0.50,  0.70, -0.155,  0.599, "s4-s3"],
  ["h", -0.40, -0.05,  0.50,  0.70, -0.155,  0.599, "s4-s3"],
  ["h",  0.05,  0.45,  0.50,  0.70,  0.140,  0.599, "s3-s7"],
];

// Initial (home) positions for draggable images
export const INIT_V = { x: 0.3, y: -0.7 };
export const INIT_H = { x: 0.6, y: -0.7 };

export const INITIAL_IMAGES = [
  { id: 1, type: "h", src: "/images/R-H.png",  init: INIT_H },
  { id: 2, type: "v", src: "/images/R-V.png",  init: INIT_V },
  { id: 3, type: "v", src: "/images/C-h.png",  init: INIT_V },
  { id: 4, type: "h", src: "/images/C-v.png",  init: INIT_H },
  { id: 5, type: "h", src: "/images/I.png",    init: INIT_H },
  { id: 6, type: "h", src: "/images/If.png",   init: { x: 0.3, y: -0.7 } },
  { id: 7, type: "h", src: "/images/P-H.png",  init: INIT_H },
  { id: 8, type: "v", src: "/images/P-V.png",  init: INIT_V },
];

export function makeInitialState() {
  return {
    R: Math.random() * (100000 - 10000) + 10000,
    Res2: 1,
    Ca: 4,   // index into CAL_A (5A range)
    Cv: 4,   // index into CAL_V (1000V range)
    s1: -1,  // voltage slider raw
    s2: -1,  // capacitor selector raw
    vg: 0,
    V: 0, A: 0,
    dRam: 0, dRav: 0,
    precAm: 0, precAv: 0,
    poser: [0,0,0,0,0,0,0,0],
    segVis: false,
    resultatM: "",
    resultatC: "",
    dernierSchema: "",
    images: INITIAL_IMAGES.map(im => ({
      ...im,
      x: im.init.x,
      y: im.init.y,
      vis: false,
      selct: 0,
    })),
  };
}

// ── Pure helper: snap-on-drop ─────────────────────────────────────────────────
const SNAP_TOLERANCE = 0.13;

export function dropImage(state, imgId, dropX, dropY) {
  const images = state.images.map(i => ({ ...i }));
  const img    = images.find(i => i.id === imgId);
  const poser  = [...state.poser];

  let bestIndex = -1;
  for (let i = 0; i < POSITIONS.length; i++) {
    const p = POSITIONS[i];
    if (p[0] !== img.type) continue;
    if (poser[i] !== 0 && img.selct !== (i + 1)) continue;
    const xMin = Math.min(p[1], p[2]);
    const xMax = Math.max(p[1], p[2]);
    const yMin = Math.min(p[3], p[4]);
    const yMax = Math.max(p[3], p[4]);
    if (dropX >= xMin - SNAP_TOLERANCE && dropX <= xMax + SNAP_TOLERANCE &&
        dropY >= yMin - SNAP_TOLERANCE && dropY <= yMax + SNAP_TOLERANCE) {
      bestIndex = i;
      break;
    }
  }

  if (bestIndex !== -1) {
    if (img.selct > 0 && img.selct !== (bestIndex + 1)) {
      poser[img.selct - 1] = 0;
      if (img.selct - 1 === 4) state = { ...state, segVis: false };
    }
    poser[bestIndex] = 1;
    img.selct = bestIndex + 1;
    img.x = POSITIONS[bestIndex][5];
    img.y = POSITIONS[bestIndex][6];
  } else {
    if (img.selct > 0) {
      poser[img.selct - 1] = 0;
    }
    img.selct = 0;
    img.x = img.init.x;
    img.y = img.init.y;
  }

  const segVis = poser[4] === 1;
  const next = { ...state, images, poser, segVis };
  return testFin(next);
}

// ── Validation ────────────────────────────────────────────────────────────────
export function testFin(state) {
  const somme = state.poser.reduce((a, b) => a + b, 0);
  if (somme !== 5) return { ...state, resultatM: "", dernierSchema: "" };

  const img = {};
  state.images.forEach(i => { img[i.id] = i.selct; });

  let resultatM     = "Schema erroné veuillez réessayer!";
  let dernierSchema = "";

  // Charge RC: im8=slot1, im2=slot2, im3=slot3, im6=slot4, im5=slot5
  if (img[8]===1 && img[2]===2 && img[3]===3 && img[6]===4 && img[5]===5
      && img[1]===0 && img[4]===0 && img[7]===0) {
    resultatM     = "Schema correct - Charge RC";
    dernierSchema = "charge";
  }

  // Décharge RC: im8=slot1, im2=slot2, im3=slot3, im5=slot4, im6=slot5
  if (img[8]===1 && img[2]===2 && img[3]===3 && img[5]===4 && img[6]===5
      && img[1]===0 && img[4]===0 && img[7]===0) {
    resultatM     = "Schema correct - Décharge RC";
    dernierSchema = "decharge";
  }

  return { ...state, resultatM, dernierSchema };
}

// ── Measurement computations ──────────────────────────────────────────────────
export function computeMeasurements(state) {
  const { R, Res2, Ca, Cv, vg } = state;
  const Rp   = (R * Res2) / (R + Res2);
  const V    = vg;
  const dV   = CAL_V[Cv] * 1.5 / 100;
  const A    = vg / (RES_A[Ca] + Rp);
  const dA   = CAL_A[Ca] * 1.5 / 100;
  const Rexp = V / (A || 1e-9);
  const dRam = Rexp * ((dV / (V || 1e-9)) + (dA / (A || 1e-9)));
  const dRav = 0;
  const precAm = dRam / Rexp;

  let resultatC = "";
  if (CAL_V[Cv] < V) resultatC = "Calibrage du voltmètre erroné";
  else if (CAL_A[Ca] < A) resultatC = "Calibrage de l'ampèremètre erroné";
  else resultatC = "Calibrage valide";

  return { ...state, V, A, dRam, dRav, precAm, resultatC };
}
