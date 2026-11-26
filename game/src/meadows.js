// [§9.216, richiesta dell'autore] Le chiazze d'erba col pennello: "solo le
// chiazze d'erba, in cui posso decidere quali particelle spawnare con quale
// densita' per particella (sempre in un range gestibile) con un pennello
// tipo quello del terreno".
//
// Una chiazza e' una forma della mappa, come le macchie di texture (§9.185:
// la sagoma della pennellata), con le particelle che ci nascono dentro:
// meadows: [{ pts: [[x, y], ...], mix: { chiave: densita' }, seed }].
// Le particelle sono quelle delle macchie di "Natura" (effects.js
// MEADOW_PARTS): l'erba nei suoi tre verdi, i fili, le spighe, i papaveri e
// i fiori gialli; la densita' e' quante ne nascono ogni 100 x 100 px.
// Dove nascono (meadowPoints): a caso nella forma, sempre uguali per lo
// stesso seme; piu' rade verso il bordo (sfumato in FEATHER px, come le
// macchie che finiscono a nulla) e a ciuffi (un rumore liscio lascia zone
// piu' fitte e piu' rade); mai sull'acqua dei fiumi ne' sulle montagne
// (`blocked`).

import { dhypot } from "./dmath.js"; // §9.152

// ([§9.223] e le foglie, i fiori rosa, le foglioline: i disegni di "Natura")
export const MEADOW_KEYS = ["dark", "mid", "light", "blades", "wheat", "poppy", "yellow", "leaves", "pink", "clover"];
export const MEADOW_LABEL = { dark: "Dark grass", mid: "Green grass", light: "Dry grass", blades: "Blades",
                              wheat: "Wheat", poppy: "Poppies", yellow: "Yellow flowers",
                              leaves: "Leaves", pink: "Pink flowers", clover: "Clover" };
// le densita' (particelle ogni 100 x 100 px): i passi dei "-" e "+"; quelle
// di partenza come burst_erba1 (2,3 / 2,1 / 1,1)
export const MEADOW_STEPS = [0, 0.5, 1, 2, 3, 4, 6, 8, 12];
export const MEADOW_DEFAULT = { dark: 2, mid: 2, light: 1, blades: 0, wheat: 0, poppy: 0, yellow: 0, leaves: 0, pink: 0, clover: 0 };
// al piu' PER_PATCH particelle in una chiazza (le densita' si riducono in
// proporzione) e PER_MAP in tutta la mappa (oltre, la pennellata si
// rifiuta: l'erba si disegna a ogni fotogramma)
export const MEADOW_LIMITS = { patch: 20000, map: 150000, points: 4000, count: 300 };
const FEATHER = 60, CLUMP = 160;

const or = (v, d) => (v === undefined || v === null ? d : v);
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash3(i, j, s) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t) => t * t * (3 - 2 * t);
function noise(x, y, l, s) { // in [0, 1]
  const fx = x / l, fy = y / l, i = Math.floor(fx), j = Math.floor(fy), u = smooth(fx - i), v = smooth(fy - j);
  const a = hash3(i, j, s), b = hash3(i + 1, j, s), c = hash3(i, j + 1, s), d = hash3(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function inside(px, py, q) {
  let ins = false;
  for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
    const [xa, ya] = q[a], [xb, yb] = q[b];
    if ((ya > py) !== (yb > py) && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) ins = !ins;
  }
  return ins;
}
function edgeDist(px, py, q) {
  let m = Infinity;
  for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
    const [xa, ya] = q[b], [xb, yb] = q[a], dx = xb - xa, dy = yb - ya, l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((px - xa) * dx + (py - ya) * dy) / l2)) : 0;
    m = Math.min(m, dhypot(px - xa - dx * t, py - ya - dy * t));
  }
  return m;
}
export function polyArea(q) {
  let s = 0;
  for (let a = 0, b = q.length - 1; a < q.length; b = a++) s += q[b][0] * q[a][1] - q[a][0] * q[b][1];
  return Math.abs(s) / 2;
}

// quante particelle per chiave (gia' ridotte entro MEADOW_LIMITS.patch)
export function meadowCounts(m) {
  const A = polyArea(m.pts) / 10000, out = {};
  let tot = 0;
  for (const k of MEADOW_KEYS) { out[k] = Math.round(A * or(m.mix && m.mix[k], 0)); tot += out[k]; }
  if (tot > MEADOW_LIMITS.patch) for (const k of MEADOW_KEYS) out[k] = Math.floor((out[k] * MEADOW_LIMITS.patch) / tot);
  return out;
}
export const meadowTotal = (m) => Object.values(meadowCounts(m)).reduce((a, b) => a + b, 0);

// Le particelle di una chiazza: [[chiave, x, y], ...], mescolate (l'ordine di
// nascita e' quello di disegno: a gruppi, un colore stava tutto sopra gli
// altri). blocked(x, y): li' non nasce niente.
export function meadowPoints(m, blocked = null) {
  const R = rng(or(m.seed, 1)), q = m.pts, counts = meadowCounts(m), out = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of q) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const s = or(m.seed, 1) & 0xffff;
  for (const k of MEADOW_KEYS) {
    const n = counts[k];
    for (let got = 0, tries = 0; got < n && tries < 6 * n; tries++) {
      const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), u = R();
      if (!inside(x, y, q)) continue;
      // piu' rade verso il bordo e a ciuffi (rumore: 0,35-1)
      const f = Math.min(1, edgeDist(x, y, q) / FEATHER) * (0.35 + 0.65 * noise(x, y, CLUMP, s));
      if (u > f || (blocked && blocked(x, y))) continue;
      out.push([k, Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
      got++;
    }
  }
  for (let k = out.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [out[k], out[j]] = [out[j], out[k]]; }
  return out;
}

// [§9.216] una voce della mappa (mapfile.js validateMap): la copia pulita, o
// null. inPt(q): il punto sta nei limiti della mappa.
export function cleanMeadow(f, inPt) {
  if (!f || typeof f !== "object" || !Array.isArray(f.pts) || f.pts.length < 3 || f.pts.length > MEADOW_LIMITS.points || !f.pts.every(inPt)) return null;
  if (!f.mix || typeof f.mix !== "object") return null;
  const mix = {};
  for (const [k, v] of Object.entries(f.mix)) {
    if (!MEADOW_KEYS.includes(k) || !MEADOW_STEPS.includes(v)) return null;
    if (v) mix[k] = v;
  }
  const c = { pts: f.pts.map((p) => [p[0], p[1]]), mix };
  if (f.seed !== undefined) { if (!Number.isInteger(f.seed) || f.seed < 0 || f.seed > 0x7fffffff) return null; c.seed = f.seed; }
  return c;
}
