// [§9.97] Fiumi, strade e ponti disegnati come linee e forme, cotti nel
// suolo (ground.js: prima le strade, poi i fiumi, poi i ponti).
//
// Fiumi: una spezzata (in Tiled una
// polilinea) e una larghezza, invece degli sprite dipinti grandi come mezzo
// schermo (fiume1-4, Fiume_Completo: 1500-3800 px l'uno). Il gioco ci stende
// sopra una texture d'acqua piccola e ripetuta (nuovi/fiumi/acqua.png,
// 256x192, ritagliata dall'acqua dipinta dall'autore), nello stile dei
// fiumi dipinti:
// - la riva lontana (quella che guarda in su) mostra la parete della
//   sponda: una fascia d'acqua piu' scura, alta fino a WALL px, fra due
//   linee nere;
// - la riva vicina, una sola linea nera;
// - le linee non hanno spessore costante, come a mano.
// Si disegna nei blocchi cotti del suolo (ground.js), sopra strade e prati:
// a ogni fotogramma costa come prima.
// Dalla stessa forma (riverCells, celle da 8 px dentro le rive):
// - l'acqua per pioggia, riflessi, increspature e schiuma (effects.js
//   waterMap, come per i fiumi dipinti);
// - l'ostacolo: le celle della griglia dei percorsi (pathing.js initCost) e
//   le collisioni di unita' e fantasmi degli edifici (world.terrainBlocks).
// Nella room: rivers: [{ pts: [[x, y], ...], width, widthEnd }] (da Tiled,
// livello "fiumi": tools/12_tiled_import.py); widthEnd, se c'e', e' la
// larghezza all'ultimo punto (cambia piano lungo il fiume).
//
// Strade (roads: [{ pts, width, kind, density }], livello "strade", classi
// strada1 e strada2): il sentiero
// di sassolini dei dipinti e' un pennello che ripete la stessa particella
// con una gamma di colori (osservazione dell'autore). Qui lo stesso: sei
// sassolini presi dal dipinto (nuovi/fiumi/sassi.png, tools/15_fiumi.py)
// timbrati lungo la linea, piu' fitti al centro (a campana, come nel
// dipinto: scarto tipo ~30% della larghezza), colori fra un grigio-verde e
// un beige (la gamma del dipinto), i piu' scuri sotto. Non sono ostacoli.
//
// Ponti (bridges: [{ pts: 4 angoli }], rettangoli di classe "ponte" nel
// livello "fiumi"): piano grigio-viola, parapetti e facciata in pietra
// chiara con gli archi, inchiostro come i fiumi, sulla grana di carta
// dell'acqua colorata (nuovi/fiumi/carta.png), come il ponte dipinto
// (Ponte_5). Sotto il ponte l'acqua non c'e' piu': si passa, e non ci piove.

const STEP = 10;      // px fra un punto e l'altro della linea ammorbidita
const ISO = 0.62;     // il suolo schiacciato: la larghezza in verticale
const WALL = 16;      // altezza della parete della riva lontana
const WOBBLE = 0.12;  // la larghezza varia del +-12% lungo il fiume
const INK = 0x1c1c1c, INK_ALPHA = 0.92, WALL_TINT = 0.78;
const TIP = 120, EDGE = 20; // la punta alle estremita' dentro la room

// rumore liscio e sempre uguale per lo stesso fiume (niente Math.random:
// non tocca la sequenza casuale della partita)
function wave(s, seed, len) {
  return Math.sin(s / len + seed) * 0.6 + Math.sin(s / (len * 0.37) + seed * 2.3) * 0.4;
}

// Catmull-Rom attraverso i punti, campionata ogni STEP px circa
function smooth(pts) {
  const out = [];
  const P = (k) => pts[Math.max(0, Math.min(pts.length - 1, k))];
  for (let k = 0; k < pts.length - 1; k++) {
    const [p0, p1, p2, p3] = [P(k - 1), P(k), P(k + 1), P(k + 2)];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / STEP));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

// I bordi del fiume: per ogni punto della linea il bordo sinistro e destro
// e, per ciascuno, la normale verso fuori (per sapere qual e' la riva
// lontana) e lo spessore della linea a inchiostro.
export function riverGeometry(rv) {
  // i conti sul terreno "steso" (y / ISO), poi di nuovo schiacciato: il
  // fiume e' largo uguale in ogni direzione, come visto dall'alto
  const C = smooth(rv.pts).map(([x, y]) => [x, y / ISO]), n = C.length;
  const seed = (rv.pts[0][0] * 0.013 + rv.pts[0][1] * 0.007) % 6.28;
  const T = [], S = [0];
  for (let k = 0; k < n; k++) {
    const a = C[Math.max(0, k - 1)], b = C[Math.min(n - 1, k + 1)];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    T.push([(b[0] - a[0]) / tl, (b[1] - a[1]) / tl]);
    if (k > 0) S.push(S[k - 1] + Math.hypot(C[k][0] - C[k - 1][0], C[k][1] - C[k - 1][1]));
  }
  // curvatura (con segno: > 0 gira a sinistra) media su +-3 punti: nelle
  // curve strette il bordo interno si ferma prima del centro della curva
  // (al piu' all'80% del raggio), se no si accavalla e fa le punte
  const K = T.map((t, k) => {
    const a = T[Math.max(0, k - 3)], b = T[Math.min(n - 1, k + 3)];
    const ds = S[Math.min(n - 1, k + 3)] - S[Math.max(0, k - 3)] || 1;
    return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]) / ds;
  });
  // la mezza larghezza di ogni lato: al piu' il 55% del raggio della curva
  // dalla parte interna, poi ammorbidita (media su +-8 punti, mai sopra il
  // limite) perche' il bordo interno giri tondo invece di fare un angolo
  const total = S[n - 1] || 1, w0 = rv.width, w1 = rv.widthEnd ?? rv.width;
  // un'estremita' dentro la room (non sul bordo o oltre) finisce a punta,
  // come una sorgente, negli ultimi TIP px: tagliata dritta stonava
  const inRoom = (p) => rv.room && p[0] > EDGE && p[1] > EDGE && p[0] < rv.room[0] - EDGE && p[1] < rv.room[1] - EDGE;
  const tip0 = inRoom(rv.pts[0]), tip1 = inRoom(rv.pts[rv.pts.length - 1]);
  const ease = (d) => { const t = Math.max(0, Math.min(1, d / TIP)); return Math.sqrt(t * (2 - t)); };
  const HW = S.map((s) => ((w0 + (w1 - w0) * (s / total)) / 2) * (1 + WOBBLE * wave(s, seed, 160))
    * (tip0 ? ease(s) : 1) * (tip1 ? ease(total - s) : 1));
  const side = (sg) => {
    const lim = HW.map((hw, k) => (sg * K[k] > 0 ? Math.min(hw, 0.55 / (sg * K[k])) : hw));
    const tight = lim.map((_, k) => { let m = Infinity; for (let j = Math.max(0, k - 5); j <= Math.min(n - 1, k + 5); j++) m = Math.min(m, lim[j]); return m; });
    return tight.map((_, k) => { let t = 0, c = 0; for (let j = Math.max(0, k - 8); j <= Math.min(n - 1, k + 8); j++) { t += tight[j]; c++; } return Math.min(t / c, lim[k]); });
  };
  const HL = side(1), HR = side(-1);
  const L = [], R = [];
  for (let k = 0; k < n; k++) {
    const hl = HL[k], hr = HR[k];
    const nx = -T[k][1], ny = T[k][0]; // a sinistra
    const ink = (k2) => 2.2 + 0.9 * wave(S[k], seed + k2, 23);
    const up = ny / Math.hypot(nx, ny * ISO) * ISO; // quanto il bordo sinistro guarda in giu' sullo schermo
    L.push({ x: C[k][0] + nx * hl, y: (C[k][1] + ny * hl) * ISO, ny: up, ink: ink(1), tx: T[k][0], ty: T[k][1] * ISO });
    R.push({ x: C[k][0] - nx * hr, y: (C[k][1] - ny * hr) * ISO, ny: -up, ink: ink(4) });
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of [...L, ...R]) { x0 = Math.min(x0, e.x); y0 = Math.min(y0, e.y); x1 = Math.max(x1, e.x); y1 = Math.max(y1, e.y); }
  return { L, R, bbox: [x0 - 8, y0 - 8, x1 + 8, y1 + WALL + 8] };
}

const pack = (bgr, a) => {
  const r = Math.round((bgr & 255) * a), g = Math.round(((bgr >> 8) & 255) * a), b = Math.round(((bgr >> 16) & 255) * a);
  return (r | (g << 8) | (b << 16) | (Math.round(a * 255) << 24)) >>> 0;
};
const grey = (k) => pack(Math.round(255 * k) * 0x010101, 1);

// Una linea a inchiostro lungo i punti `E` (con lo spessore e.ink), spostata
// in giu' di dy(e) px. [§9.97, richiesta dell'autore] Con i bordi sfumati
// (antialiasing): netta, staccava dai personaggi, che hanno i contorni
// filtrati. Il nucleo pieno arriva a mezzo pixel dal bordo, poi una frangia
// di un pixel va a trasparente (colori per vertice). Solo nella cottura del
// suolo: una volta per blocco, non a ogni fotogramma.
export function inkLine(r, white, E, dy, keep, col = INK, alpha = INK_ALPHA) {
  const c = pack(col, alpha), z = 0;
  for (let k = 0; k < E.length - 1; k++) {
    const a = E[k], b = E[k + 1];
    if (!keep(a) && !keep(b)) continue;
    const ay = a.y + dy(a), by = b.y + dy(b);
    const dx = b.x - a.x, dyy = by - ay, l = Math.hypot(dx, dyy) || 1;
    const nx = -dyy / l, ny = dx / l;
    // un po' piu' lunga del tratto, per non lasciare fessure alle giunture
    const ex = (dx / l) * 0.6, ey = (dyy / l) * 0.6;
    const x0 = a.x - ex, y0 = ay - ey, x1 = b.x + ex, y1 = by + ey;
    const ia = Math.max(0, a.ink / 2 - 0.5), ib = Math.max(0, b.ink / 2 - 0.5), oa = a.ink / 2 + 0.5, ob = b.ink / 2 + 0.5;
    const q = (pa, pb, qa, qb, ca, cb) => r.quad(white.t,
      x0 + nx * pa, y0 + ny * pa, x1 + nx * pb, y1 + ny * pb, x1 + nx * qb, y1 + ny * qb, x0 + nx * qa, y0 + ny * qa,
      white.u, white.v, white.u, white.v, ca, cb, cb, ca);
    q(ia, ib, -ia, -ib, c, c);                               // nucleo
    r.quad(white.t, x0 + nx * oa, y0 + ny * oa, x1 + nx * ob, y1 + ny * ob, x1 + nx * ib, y1 + ny * ib, x0 + nx * ia, y0 + ny * ia,
           white.u, white.v, white.u, white.v, z, z, c, c);  // frangia da una parte
    r.quad(white.t, x0 - nx * ia, y0 - ny * ia, x1 - nx * ib, y1 - ny * ib, x1 - nx * ob, y1 - ny * ob, x0 - nx * oa, y0 - ny * oa,
           white.u, white.v, white.u, white.v, c, c, z, z);  // e dall'altra
  }
}

// Disegna il fiume `geo` (riverGeometry) con la texture `water` (ripetuta)
// e il quadratino bianco `white` ({ t, u, v }, come Draw._white).
export function drawRiver(r, geo, water, white) {
  const { L, R } = geo, n = L.length;
  // l'acqua, con la texture fissata al mondo (non si deforma nelle curve)
  const full = grey(1);
  for (let k = 0; k < n - 1; k++) {
    const a = L[k], b = L[k + 1], c = R[k + 1], d = R[k];
    r.quadUV(water, a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, c.x, c.y, c.x, c.y, d.x, d.y, d.x, d.y, full);
  }
  // la parete della riva lontana: giu' dal bordo, alta WALL x quanto il
  // bordo guarda in su, con l'acqua piu' scura
  const wall = (e) => (e.ny < 0 ? WALL * -e.ny : 0);
  const dark = grey(WALL_TINT);
  for (const E of [L, R]) {
    for (let k = 0; k < n - 1; k++) {
      const a = E[k], b = E[k + 1], ha = wall(a), hb = wall(b);
      if (ha <= 0 && hb <= 0) continue;
      r.quadUV(water, a.x, a.y, a.x, a.y, b.x, b.y, b.x, b.y, b.x, b.y + hb, b.x, b.y + hb, a.x, a.y + ha, a.x, a.y + ha, dark);
    }
  }
  // l'inchiostro: il bordo, e la base della parete dove e' alta almeno 3 px
  for (const E of [L, R]) {
    inkLine(r, white, E, () => 0, () => true);
    inkLine(r, white, E, wall, (e) => wall(e) >= 3);
  }
}

// ------------------------------------------------------------ l'acqua

export const RIVER_CELL = 8;      // come la mappa dell'acqua (effects.js)
const STRETCH = 20;               // punti per tratto: un'orientazione per tratto

function insideQuad(px, py, q) { return insidePoly(px, py, q); }
function insidePoly(px, py, q) {
  let ins = false;
  for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
    const [xa, ya] = q[a], [xb, yb] = q[b];
    if ((ya > py) !== (yb > py) && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) ins = !ins;
  }
  return ins;
}

// Le celle d'acqua dei fiumi a linee di w.rivers (una volta, poi da
// w._riverCells): grid 1 = acqua; stretch, per ogni cella, il tratto di
// fiume che la contiene (stretches: l'angolo del tratto, in gradi come
// GameMaker, y verso l'alto). null senza fiumi.
export function riverCells(w) {
  if (w._riverCells !== undefined) return w._riverCells;
  const rivers = w.rivers || [];
  if (!rivers.length) return (w._riverCells = null);
  const C = RIVER_CELL, gw = Math.ceil(w.roomW / C), gh = Math.ceil(w.roomH / C);
  const grid = new Uint8Array(gw * gh), stretch = new Int32Array(gw * gh).fill(-1), stretches = [];
  for (const g of rivers) {
    const { L, R } = g, n = L.length;
    for (let k = 0; k < n - 1; k++) {
      if (k % STRETCH === 0) {
        const m = L[Math.min(n - 1, k + STRETCH / 2)];
        stretches.push({ angle: Math.atan2(-m.ty, m.tx) * 180 / Math.PI });
      }
      const si = stretches.length - 1;
      const q = [[L[k].x, L[k].y], [L[k + 1].x, L[k + 1].y], [R[k + 1].x, R[k + 1].y], [R[k].x, R[k].y]];
      const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
      const cx0 = Math.max(0, Math.floor(Math.min(...xs) / C)), cx1 = Math.min(gw - 1, Math.floor(Math.max(...xs) / C));
      const cy0 = Math.max(0, Math.floor(Math.min(...ys) / C)), cy1 = Math.min(gh - 1, Math.floor(Math.max(...ys) / C));
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const c = cy * gw + cx;
          if (grid[c] || !insideQuad((cx + 0.5) * C, (cy + 0.5) * C, q)) continue;
          grid[c] = 1; stretch[c] = si;
        }
      }
    }
  }
  // sotto i ponti (e la loro facciata) niente acqua: si passa
  for (const b of w.bridges || []) {
    const q = b.cover, xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
    const cx0 = Math.max(0, Math.floor(Math.min(...xs) / C)), cx1 = Math.min(gw - 1, Math.floor(Math.max(...xs) / C));
    const cy0 = Math.max(0, Math.floor(Math.min(...ys) / C)), cy1 = Math.min(gh - 1, Math.floor(Math.max(...ys) / C));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) if (insidePoly((cx + 0.5) * C, (cy + 0.5) * C, q)) grid[cy * gw + cx] = 0;
    }
  }
  return (w._riverCells = { C, gw, gh, grid, stretch, stretches });
}

// Il riquadro [x0, y0, x1, y1] tocca l'acqua?
export function riverIn(rc, x0, y0, x1, y1) {
  const C = rc.C;
  const cx0 = Math.max(0, Math.floor(x0 / C)), cx1 = Math.min(rc.gw - 1, Math.floor(x1 / C));
  const cy0 = Math.max(0, Math.floor(y0 / C)), cy1 = Math.min(rc.gh - 1, Math.floor(y1 / C));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) if (rc.grid[cy * rc.gw + cx]) return true;
  return false;
}

// Chi non entra nell'acqua: le unita' e i fantasmi degli edifici da
// piazzare (che si fermano rossi sul fiume)
export const stopsAtWater = (w, i) => w.is(i, "ally_unit") || w.is(i, "enemy_unit") || /_placer$/.test(i.object);

// ------------------------------------------------------------ strade

// numeri a caso sempre uguali per la stessa strada (mulberry32): niente
// Math.random, che e' della partita
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

const STONE = 16, STONES = 6;               // la cella e quanti sassolini in sassi.png
const STONES_PER_PX = 2.1 / 115;            // sassolini per px di lunghezza e px di larghezza (strada4)
const SPREAD = 1.77;                        // media di 3 uniformi x SPREAD: scarto tipo ~0,3 della larghezza
// [richiesta dell'autore] due strade, come negli sprite: kind 1 la strada
// marcata (strada4-8: sassi fitti, dal grigio-verde al beige), kind 2 la
// secondaria, simile al terreno (traccia1-4: un solo grigio-verde,
// semitrasparente, piu' rada e sparsa, sassi in media piu' piccoli).
// Misurate sui dipinti: copertura 74 e 47 px per px di lunghezza, scarto
// tipo 34 e 39 px.
const ROAD_KINDS = {
  1: { dark: [134, 130, 108], light: [200, 195, 160], alpha: 1, density: 1, spread: 1, scale: [0.75, 1.3] },
  2: { dark: [148, 152, 124], light: [162, 166, 136], alpha: 0.76, density: 0.64, spread: 1.15, scale: [0.5, 1.2] },
};
const ROAD_FADE = 80;                       // alle estremita' dentro la room si diradano in tanti px

// I sassolini di una strada: [x, y, scala, variante, colore ABGR], dai piu'
// scuri ai piu' chiari, e il riquadro.
export function roadGeometry(rd) {
  const C = smooth(rd.pts).map(([x, y]) => [x, y / ISO]), n = C.length, S = [0];
  for (let k = 1; k < n; k++) S.push(S[k - 1] + Math.hypot(C[k][0] - C[k - 1][0], C[k][1] - C[k - 1][1]));
  const total = S[n - 1] || 1, width = rd.width;
  const seed = Math.round(rd.pts[0][0] * 7 + rd.pts[0][1] * 13 + rd.pts.length * 101);
  const rand = rng(seed);
  const inRoom = (p) => rd.room && p[0] > EDGE && p[1] > EDGE && p[0] < rd.room[0] - EDGE && p[1] < rd.room[1] - EDGE;
  const fade0 = inRoom(rd.pts[0]), fade1 = inRoom(rd.pts[rd.pts.length - 1]);
  const K = ROAD_KINDS[rd.kind] || ROAD_KINDS[1];
  const count = Math.round(total * width * STONES_PER_PX * K.density * (rd.density ?? 1));
  const stones = [];
  let k = 0;
  const at = (s) => { // punto e tangente a distanza s lungo la linea
    while (k > 0 && S[k] > s) k--;
    while (k < n - 2 && S[k + 1] < s) k++;
    const f = (s - S[k]) / ((S[k + 1] - S[k]) || 1);
    const a = C[k], b = C[Math.min(n - 1, k + 1)];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (b[0] - a[0]) / tl, (b[1] - a[1]) / tl];
  };
  for (let j = 0; j < count; j++) {
    const s = rand() * total;
    // diradati alle estremita' dentro la room (non tagliati dritti)
    const keep = Math.min(fade0 ? s / ROAD_FADE : 1, fade1 ? (total - s) / ROAD_FADE : 1, 1);
    const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand(), r5 = rand(), r6 = rand(), r7 = rand();
    if (r7 > keep) continue;
    const [x, y, tx, ty] = at(s);
    const off = ((r1 + r2 + r3) / 3 - 0.5) * SPREAD * K.spread * width;
    const t = r4 * r4 * (3 - 2 * r4); // piu' toni medi che estremi
    const col = K.dark.map((d, c) => d + (K.light[c] - d) * t);
    stones.push([x - ty * off, (y + tx * off) * ISO, K.scale[0] + (K.scale[1] - K.scale[0]) * r5, Math.floor(r6 * STONES), t, col]);
  }
  stones.sort((a, b) => a[4] - b[4]);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of stones) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  // il colore: la texture e' grigia con media 200, quindi x 255/200
  const out = stones.map(([x, y, sc, v, , c]) => [x, y, sc, v,
    pack(((Math.min(255, Math.round(c[2] * 1.275)) << 16) | (Math.min(255, Math.round(c[1] * 1.275)) << 8) | Math.min(255, Math.round(c[0] * 1.275))), K.alpha)]);
  return { stones: out, bbox: [x0 - STONE, y0 - STONE, x1 + STONE, y1 + STONE] };
}

// Disegna i sassolini della strada che cadono nel riquadro `box`
export function drawRoad(r, geo, tex, box) {
  const h = STONE / 2;
  for (const [x, y, sc, v, c] of geo.stones) {
    if (x < box[0] - STONE || x > box[2] + STONE || y < box[1] - STONE || y > box[3] + STONE) continue;
    const e = h * sc;
    r.quad(tex, x - e, y - e, x + e, y - e, x + e, y + e, x - e, y + e, v * STONE, 0, (v + 1) * STONE, STONE, c);
  }
}

// ------------------------------------------------------------ ponti

const DECK = 0x9b98a6, STONE_LIGHT_COL = 0xcdd6dc, FACADE = 0xb9c2c8, ARCH = 0x5a5a3c; // BGR
const PARAPET = 8, FACADE_H = 20, SHADOW = [10, 7], SHADOW_ALPHA = 0.3;

// Il ponte: i 4 angoli (da Tiled, in ordine); i lati lunghi sono quelli che
// attraversano il fiume. La facciata (coi suoi archi) e' il fianco che si
// vede: scende dal lato lungo che guarda in giu', alta quanto guarda in giu'
// (un ponte da nord a sud non mostra fianchi, come la parete del fiume).
export function bridgeGeometry(b) {
  let q = b.pts.map((p) => [p[0], p[1]]);
  const len = (a, c) => Math.hypot(c[0] - a[0], c[1] - a[1]);
  if (len(q[0], q[1]) < len(q[1], q[2])) q = [q[1], q[2], q[3], q[0]];
  const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  // i due lati lunghi e quanto ciascuno guarda in giu' (normale verso fuori,
  // sul terreno steso)
  const sides = [[q[0], q[1]], [q[3], q[2]]].map(([a, c]) => {
    const tx = c[0] - a[0], ty = (c[1] - a[1]) / ISO, tl = Math.hypot(tx, ty) || 1;
    let nx = -ty / tl, ny = tx / tl;
    const mx = (a[0] + c[0]) / 2 - cx, my = (a[1] + c[1]) / 2 - cy;
    if (nx * mx + ny * my / ISO < 0) { nx = -nx; ny = -ny; }
    return { a, c, down: Math.max(0, ny) };
  });
  const [s1, s2] = sides[0].down >= sides[1].down ? sides : [sides[1], sides[0]];
  const near = [s1.a, s1.c], far = [s2.a, s2.c];
  const fh = s1.down > 0.3 ? FACADE_H * s1.down : 0;
  const cover = [far[0], far[1], [near[1][0], near[1][1] + fh], [near[0][0], near[0][1] + fh]];
  const xs = cover.map((p) => p[0]), ys = cover.map((p) => p[1]);
  return { near, far, fh, cover,
    bbox: [Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) + SHADOW[0] + 4, Math.max(...ys) + SHADOW[1] + 4] };
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function drawBridge(r, g, paper, white) {
  const { near, far, fh } = g;
  // la carta e' grigia con media 200: il colore x 255/200
  const tint = (bgr) => pack([0, 8, 16].reduce((v, sh) => v | (Math.min(255, Math.round(((bgr >> sh) & 255) * 1.275)) << sh), 0), 1);
  const P = (p, q2, p2, q3, col) => r.quadUV(paper, p[0], p[1], p[0], p[1], q2[0], q2[1], q2[0], q2[1],
    p2[0], p2[1], p2[0], p2[1], q3[0], q3[1], q3[0], q3[1], col);
  const down = (p, h) => [p[0], p[1] + h];
  const sh = (p) => [p[0] + SHADOW[0], p[1] + SHADOW[1]];
  // l'ombra, come quelle degli edifici (a destra, in basso), dalla sagoma
  // del ponte con la facciata
  const shadow = pack(0, SHADOW_ALPHA), cv = g.cover.map(sh);
  r.quad(white.t, cv[0][0], cv[0][1], cv[1][0], cv[1][1], cv[2][0], cv[2][1], cv[3][0], cv[3][1],
         white.u, white.v, white.u, white.v, shadow);
  const archEdges = [];
  if (fh > 0) {
    // la facciata (pietra) con gli archi (acqua in ombra)
    P(near[0], near[1], down(near[1], fh), down(near[0], fh), tint(FACADE));
    const L = Math.hypot(near[1][0] - near[0][0], near[1][1] - near[0][1]);
    const arches = L > 220 ? 3 : L > 120 ? 2 : 1;
    for (let a = 0; a < arches; a++) {
      const c = (a + 0.5) / arches, half = 0.36 / arches, segs = 12, pts = [];
      const at = (j) => lerp(near[0], near[1], c - half + (2 * half * j) / segs);
      for (let j = 0; j <= segs; j++) {
        const p = at(j), up = Math.sin((Math.PI * j) / segs) * fh * 0.72;
        pts.push({ x: p[0], y: p[1] + fh - up, ink: 1.8 });
      }
      for (let j = 0; j < segs; j++) {
        const pa = at(j), pb = at(j + 1);
        P([pts[j].x, pts[j].y], [pts[j + 1].x, pts[j + 1].y], down(pb, fh), down(pa, fh), tint(ARCH));
      }
      archEdges.push(pts);
    }
  }
  // il piano e i parapetti
  P(far[0], far[1], near[1], near[0], tint(DECK));
  const mid = lerp(lerp(far[0], far[1], 0.5), lerp(near[0], near[1], 0.5), 0.5);
  const inset = (a, b, d) => { // a, b spostati di d px verso l'interno del ponte
    const m = lerp(a, b, 0.5), dx = mid[0] - m[0], dy = mid[1] - m[1], l = Math.hypot(dx, dy) || 1;
    return [[a[0] + (dx / l) * d, a[1] + (dy / l) * d], [b[0] + (dx / l) * d, b[1] + (dy / l) * d]];
  };
  const fi = inset(far[0], far[1], PARAPET), ni = inset(near[0], near[1], PARAPET);
  P(far[0], far[1], fi[1], fi[0], tint(STONE_LIGHT_COL));
  P(ni[0], ni[1], near[1], near[0], tint(STONE_LIGHT_COL));
  // l'inchiostro
  const line = (a, b, w = 2.4) => inkLine(r, white, [{ x: a[0], y: a[1], ink: w }, { x: b[0], y: b[1], ink: w }], () => 0, () => true);
  line(far[0], far[1]); line(fi[0], fi[1], 1.6);
  line(ni[0], ni[1], 1.6); line(near[0], near[1]);
  if (fh > 0) {
    line(down(near[0], fh), down(near[1], fh));
    line(near[0], down(near[0], fh)); line(near[1], down(near[1], fh));
    for (const e of archEdges) inkLine(r, white, e, () => 0, () => true);
  }
}
