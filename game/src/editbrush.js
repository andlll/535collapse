// [§9.185] Il pennello dell'editor di mappe: la geometria, senza disegno.
//
// - Boschi: alberi veri, uno per uno (decisione dell'autore, §9.182), a una
//   distanza minima fra loro come il pennello bosco di Tiled
//   (tools/12_tiled_import.py `forest`, campionamento di Poisson a 90 px):
//   a ogni passo della pennellata un po' di punti a caso nel cerchio, tenuti
//   solo se lontani almeno `spacing` dagli alberi che ci sono gia' (TreeGrid).
// - Texture: le macchie di un altro sfondo (§9.99), che il gioco disegna come
//   poligoni sfumati (rivers.js patchGeometry). La pennellata e' una fila di
//   cerchi; finita, i cerchi diventano i contorni della loro unione
//   (strokeOutlines: una griglia fine, marching squares, Douglas-Peucker),
//   uno per pezzo staccato. I buchi dentro una pennellata si riempiono.

import { dcos, dsin, dhypot } from "./dmath.js"; // (la prova del determinismo, §9.152)

// Le posizioni degli alberi in celle grandi quanto la distanza minima: chi e'
// piu' vicino di `d` a (x, y) sta nelle 9 celle attorno
export class TreeGrid {
  constructor(cell) { this.cell = Math.max(1, cell); this.map = new Map(); }
  _key(cx, cy) { return cx + "," + cy; }
  add(x, y) {
    const k = this._key(Math.floor(x / this.cell), Math.floor(y / this.cell));
    let l = this.map.get(k);
    if (!l) this.map.set(k, (l = []));
    l.push(x, y);
  }
  near(x, y, d) {
    const cx = Math.floor(x / this.cell), cy = Math.floor(y / this.cell), r = Math.ceil(d / this.cell), d2 = d * d;
    for (let j = cy - r; j <= cy + r; j++) {
      for (let i = cx - r; i <= cx + r; i++) {
        const l = this.map.get(this._key(i, j));
        if (!l) continue;
        for (let k = 0; k < l.length; k += 2) { const dx = l[k] - x, dy = l[k + 1] - y; if (dx * dx + dy * dy < d2) return true; }
      }
    }
    return false;
  }
}

// Un passo del pennello dei boschi: fino a `tries` punti a caso nell'ovale
// (cx, cy, r, ry), tenuti se `ok(x, y)` e se non c'e' un albero (della
// griglia, anche quelli appena messi) piu' vicino di `spacing`. rand(): [0, 1).
// [§9.186, richiesta dell'autore] l'area del pennello e' un ovale
// "assonometrico", schiacciato in verticale come il suolo (ry = r x ISO,
// rivers.js), non un cerchio
export function forestStep({ cx, cy, r, ry = r, spacing, grid, rand, ok = () => true, tries = 10 }) {
  const out = [];
  for (let k = 0; k < tries; k++) {
    // uniforme nell'ovale: raggio con la radice
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand());
    const x = Math.round(cx + dcos(a) * d * r), y = Math.round(cy + dsin(a) * d * ry);
    if (grid.near(x, y, spacing) || !ok(x, y)) continue;
    grid.add(x, y);
    out.push([x, y]);
  }
  return out;
}

// il punto (x, y) dentro il poligono (pari e dispari)
export function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// l'area (con segno) di un poligono
export function polyArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return a / 2;
}

// Douglas-Peucker su un contorno chiuso: i punti che si allontanano piu' di
// eps dalla linea semplificata restano
export function simplify(pts, eps) {
  if (pts.length < 4) return pts.slice();
  const dp = (a, b, list, out) => {
    const [x0, y0] = list[a], [x1, y1] = list[b], dx = x1 - x0, dy = y1 - y0, L = dhypot(dx, dy) || 1;
    let best = -1, far = 0;
    for (let k = a + 1; k < b; k++) {
      const d = Math.abs((list[k][0] - x0) * dy - (list[k][1] - y0) * dx) / L;
      if (d > far) { far = d; best = k; }
    }
    if (far > eps) { dp(a, best, list, out); out.push(list[best]); dp(best, b, list, out); }
  };
  // diviso in due nel punto piu' lontano dal primo (il contorno e' chiuso)
  let m = 0, f = -1;
  for (let k = 1; k < pts.length; k++) { const d = dhypot(pts[k][0] - pts[0][0], pts[k][1] - pts[0][1]); if (d > f) { f = d; m = k; } }
  const list = [...pts, pts[0]], out = [list[0]];
  dp(0, m, list, out); out.push(list[m]); dp(m, list.length - 1, list, out);
  return out;
}

// I contorni dell'unione degli ovali `dabs` ([x, y]) di semiassi r e ry
// (§9.186: ovali assonometrici; ry = r: cerchi): una griglia di lato `cell`
// (dentro: in un ovale), marching squares sui punti di mezzo dei lati, i
// segmenti uniti in anelli; via i buchi (anelli dentro un altro anello) e i
// pezzetti, semplificati a cell * 0,75.
export function strokeOutlines(dabs, r, ry = r, cell = Math.max(12, Math.min(r, ry) / 8)) {
  if (!dabs.length) return [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of dabs) { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - ry); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + ry); }
  x0 -= 2 * cell; y0 -= 2 * cell; x1 += 2 * cell; y1 += 2 * cell;
  const nx = Math.ceil((x1 - x0) / cell) + 1, ny = Math.ceil((y1 - y0) / cell) + 1;
  const v = new Uint8Array(nx * ny);
  for (const [dx, dy] of dabs) {
    const i0 = Math.max(0, Math.floor((dx - r - x0) / cell)), i1 = Math.min(nx - 1, Math.ceil((dx + r - x0) / cell));
    const j0 = Math.max(0, Math.floor((dy - ry - y0) / cell)), j1 = Math.min(ny - 1, Math.ceil((dy + ry - y0) / cell));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const px = (x0 + i * cell - dx) / r, py = (y0 + j * cell - dy) / ry;
        if (px * px + py * py <= 1) v[j * nx + i] = 1;
      }
    }
  }
  // i segmenti: fra i punti di mezzo dei lati delle celle (coordinate doppie,
  // intere), come chiavi "x,y"
  const adj = new Map(), link = (a, b) => {
    (adj.get(a) || adj.set(a, []).get(a)).push(b);
    (adj.get(b) || adj.set(b, []).get(b)).push(a);
  };
  const at = (i, j) => v[j * nx + i];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const tl = at(i, j), tr = at(i + 1, j), br = at(i + 1, j + 1), bl = at(i, j + 1);
      const c = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (c === 0 || c === 15) continue;
      const T = (2 * i + 1) + "," + 2 * j, R = 2 * (i + 1) + "," + (2 * j + 1), B = (2 * i + 1) + "," + 2 * (j + 1), L = 2 * i + "," + (2 * j + 1);
      switch (c) {
        case 1: case 14: link(L, B); break;
        case 2: case 13: link(B, R); break;
        case 3: case 12: link(L, R); break;
        case 4: case 11: link(T, R); break;
        case 6: case 9: link(T, B); break;
        case 7: case 8: link(L, T); break;
        case 5: link(L, T); link(B, R); break; // (le sella: separate)
        case 10: link(T, R); link(L, B); break;
        default: break;
      }
    }
  }
  // gli anelli
  const loops = [], seen = new Set();
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop = [];
    let prev = null, cur = start;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      loop.push(cur);
      const next = adj.get(cur).find((n) => n !== prev && !seen.has(n)) || null;
      prev = cur;
      cur = next;
    }
    if (loop.length >= 4) loops.push(loop.map((k) => { const [a, b] = k.split(",").map(Number); return [x0 + (a / 2) * cell, y0 + (b / 2) * cell]; }));
  }
  // via i buchi e i pezzetti (meno di un ovale coi semiassi a un terzo)
  const min = Math.PI * (r / 3) * (ry / 3);
  const outer = loops.filter((p, k) => Math.abs(polyArea(p)) >= min
    && !loops.some((q, h) => h !== k && Math.abs(polyArea(q)) > Math.abs(polyArea(p)) && pointInPoly(p[0][0], p[0][1], q)));
  return outer.map((p) => simplify(p, cell * 0.75).map(([x, y]) => [Math.round(x), Math.round(y)]));
}
