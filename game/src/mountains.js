// [§9.213] Montagne fatte dal generatore, nello stile dei disegni
// dell'autore (montagna1-10): pietra grigia marmorizzata, grandi facce piane
// che scendono dalle cime alla base, inchiostro sulle creste e sugli speroni,
// contorno frastagliato.
//
// Due cose le decide l'autore (in due passi, nell'editor):
// - la CRESTA, una spezzata, dove la si vede (in alto: la linea del
//   cielo): ogni punto e' una cima, fra due cime una sella piu' bassa; e'
//   l'aspetto. Il piede di ogni cima sul terreno e' `height` px piu' in
//   basso: piu' alta, la montagna scende di piu' (la cresta resta dov'e');
// - la BASE, il contorno sul terreno: quella che conta per il gioco
//   (ostacolo, frecce). Se non c'e', il generatore la fa attorno alla
//   cresta, larga `width`.
// Il resto lo fa il generatore, sempre uguale per lo stesso `seed` (niente
// Math.random: i due giocatori in rete vedono la stessa montagna; i conti
// con dmath).
//
// Nella mappa: mountains: [{ crest: [[x, y], ...], base: [[x, y], ...] |
// null, height, width, rough, detail, seed, peaks: [moltiplicatore
// dell'altezza per punto] | undefined, sym, mirrored (la gemella, §9.214) }].
//
// Uscita (mountainGeometry): `layers`, le facce (poligoni sullo schermo con
// la loro luce, `shade`, da moltiplicare sulla texture roccia.png fissata
// al mondo, spostata e girata per faccia, `tex`: [dx, dy, angolo], come le
// toppe di carta dei disegni, dove la marmorizzazione cambia verso da una
// faccia all'altra) e le linee a inchiostro ({ x, y, ink } per punto, come
// rivers.js inkLine), nell'ordine in cui si disegnano (da dietro in
// avanti); `base`, il contorno sul terreno (coordinate del mondo); `bbox`.

import { dcos, dhypot, dsin } from "./dmath.js"; // §9.152
import { ISO, inkLine } from "./rivers.js";

export const MOUNTAIN = { height: 260, width: 520, rough: 0.5, detail: 0.5 };
const CELL = 8;          // la griglia per fare la base attorno alla cresta
const ZK = 1 / 0.78;     // altezza vera / altezza sullo schermo (il suolo e' visto a ~38 gradi: ISO = sin)
const LIGHT = norm3([-0.75, -0.1, 0.55]); // la luce: da sinistra, un po' da dietro, dall'alto

const or = (v, d) => (v === undefined || v === null ? d : v);
function norm3(v) { const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

// numeri a caso sempre uguali per lo stesso seme (mulberry32, come rivers.js)
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
// un numero fisso in [0, 1) per (i, j, seme): il rumore a reticolo
function hash3(i, j, s) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smoothstep = (t) => t * t * (3 - 2 * t);
// rumore liscio in [-1, 1], celle di `l` px
function noise2(x, y, l, s) {
  const fx = x / l, fy = y / l, i = Math.floor(fx), j = Math.floor(fy), u = smoothstep(fx - i), v = smoothstep(fy - j);
  const a = hash3(i, j, s), b = hash3(i + 1, j, s), c = hash3(i, j + 1, s), d = hash3(i + 1, j + 1, s);
  return 2 * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) - 1;
}

// distanza del punto p dal segmento ab, e la frazione sul segmento
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return [dhypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t), t];
}
function lineDist(p, L) {
  if (L.length === 1) return dhypot(p[0] - L[0][0], p[1] - L[0][1]);
  let m = Infinity;
  for (let k = 0; k < L.length - 1; k++) m = Math.min(m, segDist(p, L[k], L[k + 1])[0]);
  return m;
}
// > 0: giro orario sullo schermo (y in giu')
function area(P) {
  let s = 0;
  for (let a = 0, b = P.length - 1; a < P.length; b = a++) s += P[b][0] * P[a][1] - P[a][0] * P[b][1];
  return s / 2;
}
export function insidePoly(px, py, q) {
  let ins = false;
  for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
    const [xa, ya] = q[a], [xb, yb] = q[b];
    if ((ya > py) !== (yb > py) && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) ins = !ins;
  }
  return ins;
}
// Douglas-Peucker su un poligono chiuso: il punto piu' lontano dal primo
// divide il giro in due spezzate
function simplify(P, tol) {
  const Q = P.concat([P[0]]), n = P.length, keep = new Uint8Array(n + 1);
  const rec = (i, j) => {
    let m = -1, k = -1;
    for (let q = i + 1; q < j; q++) { const d = segDist(Q[q], Q[i], Q[j])[0]; if (d > m) { m = d; k = q; } }
    if (m > tol) { keep[k] = 1; rec(i, k); rec(k, j); }
  };
  let far = 1, fd = -1;
  for (let q = 1; q < n; q++) { const d = dhypot(P[q][0] - P[0][0], P[q][1] - P[0][1]); if (d > fd) { fd = d; far = q; } }
  keep[0] = keep[far] = 1;
  rec(0, far); rec(far, n);
  return P.filter((_, q) => keep[q]);
}

// La base attorno alla cresta (terreno steso): le celle vicine alla cresta
// (meno di mezza larghezza, che cambia piano col rumore: lingue larghe e
// insenature) o a uno dei suoi speroni (`spines`: segmenti che scendono
// dalle cime oltre la mezza larghezza, sempre piu' stretti: le lingue di
// roccia dei disegni, dove finiscono le creste), il pezzo attaccato alla
// cresta, il suo contorno. Dietro la cresta, non oltre quanto la montagna
// nasconde.
function autoBase(N, spines, width, rough, seed, both = false) {
  const C = N.map((c) => c.p);
  const r0 = width / 2, pad = r0 * 1.8 + 2 * CELL;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of C) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const gw = Math.ceil((x1 - x0) / CELL), gh = Math.ceil((y1 - y0) / CELL);
  const grid = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const p = [x0 + (i + 0.5) * CELL, y0 + (j + 0.5) * CELL];
      const r = r0 * (1 + rough * (0.42 * noise2(p[0], p[1], r0 * 0.9, seed) + 0.2 * noise2(p[0], p[1], r0 * 0.3, seed + 7)));
      // la cresta piu' vicina: distanza, e quanto e' alta li'
      let d = Infinity, hq = 0, qy = 0;
      if (N.length === 1) { d = dhypot(p[0] - C[0][0], p[1] - C[0][1]); hq = N[0].h; qy = C[0][1]; }
      for (let k = 0; k < N.length - 1; k++) {
        const [dk, t] = segDist(p, C[k], C[k + 1]);
        if (dk < d) { d = dk; hq = N[k].h + (N[k + 1].h - N[k].h) * t; qy = C[k][1] + (C[k + 1][1] - C[k][1]) * t; }
      }
      // dietro la cresta (piu' in alto sul terreno) la base resta nascosta
      // dalla montagna: non oltre la linea del cielo (sporgeva sopra la
      // cresta come un bernoccolo)
      // ([§9.214] con la gemella specchiata in verticale anche davanti: la
      // sua faccia dietro e' questa davanti)
      if (qy - p[1] > 0.8 * hq / ISO || (both && p[1] - qy > 0.8 * hq / ISO)) { continue; }
      let ins = d < r;
      for (let s = 0; s < spines.length && !ins; s++) {
        const [d, t] = segDist(p, spines[s].a, spines[s].b);
        ins = d < spines[s].r * (1 - 0.7 * t);
      }
      if (ins) grid[j * gw + i] = 1;
    }
  }
  // solo il pezzo che contiene la prima cima (4 vicini)
  const start = Math.floor((C[0][1] - y0) / CELL) * gw + Math.floor((C[0][0] - x0) / CELL);
  const comp = new Uint8Array(gw * gh), st = [start];
  comp[start] = 1;
  while (st.length) {
    const c = st.pop(), i = c % gw, j = (c - i) / gw;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, n = nj * gw + ni;
      if (ni >= 0 && nj >= 0 && ni < gw && nj < gh && grid[n] && !comp[n]) { comp[n] = 1; st.push(n); }
    }
  }
  return simplify(traceGrid(comp, gw, gh, CELL, x0, y0), CELL * 0.8);
}

// [§9.214] Il contorno di un pezzo di una griglia (celle != 0 attaccate,
// 4 vicini): quello che contiene la cella `start` (senza: la prima piena),
// seguendo i lati delle celle col dentro a destra (giro orario sullo
// schermo), in coordinate (x0 + i * C, y0 + j * C)
export function traceGrid(grid, gw, gh, C, x0, y0, start = -1) {
  const full = (k) => grid[k] !== 0;
  if (start < 0) { start = 0; while (start < grid.length && !full(start)) start++; }
  // solo il pezzo di `start`
  const comp = new Uint8Array(gw * gh), st = [start];
  comp[start] = 1;
  while (st.length) {
    const c = st.pop(), i = c % gw, j = (c - i) / gw;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, n = nj * gw + ni;
      if (ni >= 0 && nj >= 0 && ni < gw && nj < gh && full(n) && !comp[n]) { comp[n] = 1; st.push(n); }
    }
  }
  const inside = (i, j) => i >= 0 && j >= 0 && i < gw && j < gh && comp[j * gw + i] === 1;
  let s = 0;
  while (!comp[s]) s++;
  const si = s % gw, sj = (s - si) / gw;
  const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const AR = [[0, 0], [-1, 0], [-1, -1], [0, -1]], AL = [[0, -1], [0, 0], [-1, 0], [-1, -1]];
  const out = [];
  let x = si, y = sj, d = 0;
  for (let guard = 0; guard < 4 * gw * gh; guard++) {
    out.push([x0 + x * C, y0 + y * C]);
    x += D[d][0]; y += D[d][1];
    if (inside(x + AL[d][0], y + AL[d][1])) d = (d + 3) % 4;
    else if (!inside(x + AR[d][0], y + AR[d][1])) d = (d + 1) % 4;
    if (x === si && y === sj && d === 0) break;
  }
  return out;
}
// Douglas-Peucker su una spezzata aperta
export function simplifyLine(P, tol) {
  if (P.length < 3) return P.slice();
  const keep = new Uint8Array(P.length);
  keep[0] = keep[P.length - 1] = 1;
  const rec = (i, j) => {
    let m = -1, k = -1;
    for (let q = i + 1; q < j; q++) { const d = segDist(P[q], P[i], P[j])[0]; if (d > m) { m = d; k = q; } }
    if (m > tol) { keep[k] = 1; rec(i, k); rec(k, j); }
  };
  rec(0, P.length - 1);
  return P.filter((_, q) => keep[q]);
}

// Il contorno frastagliato: tratti dritti corti (10-34 px), ogni punto
// spostato a caso verso fuori o verso dentro, qualche insenatura stretta
// (come il bordo strappato dei disegni)
function jag(P, rough, R) {
  const out = [];
  for (let k = 0; k < P.length; k++) {
    const a = P[k], b = P[(k + 1) % P.length], l = dhypot(b[0] - a[0], b[1] - a[1]);
    if (!l) continue;
    const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l; // verso fuori (giro orario sullo schermo)
    let s = 0;
    while (s < l) {
      const t = s / l;
      let off = (R() - 0.5) * 2 * 11 * rough;
      if (s > 0 && R() < 0.07 * rough) off -= 16 + 30 * R(); // un'insenatura
      out.push([a[0] + (b[0] - a[0]) * t + nx * (s ? off : 0), a[1] + (b[1] - a[1]) * t + ny * (s ? off : 0)]);
      s += 10 + 24 * R();
    }
  }
  return out;
}

// La cresta: le cime dell'autore e, fra due cime, una sella (o, sui tratti
// lunghi, selle e cime minori alternate), un po' fuori dalla linea. `V`: la
// cresta come si vede; ogni nodo ha il piede sul terreno steso (`p`) e
// l'altezza (`h`): si vede in [p[0], p[1] * ISO - h].
function crestNodes(V, m, R) {
  const H = or(m.height, MOUNTAIN.height), peaks = m.peaks || [];
  const N = [];
  const node = (v, h, peak) => N.push({ p: [v[0], (v[1] + h) / ISO], h, peak });
  for (let k = 0; k < V.length; k++) {
    const h = H * or(peaks[k], 1) * (0.9 + 0.2 * R());
    node(V[k], h, true);
    if (k === V.length - 1) break;
    const a = V[k], b = V[k + 1], l = dhypot(b[0] - a[0], (b[1] - a[1]) / ISO) || 1;
    const hb = H * or(peaks[k + 1], 1);
    const n = Math.max(1, Math.round(l / 200));
    for (let q = 1; q <= n; q++) {
      const t = (q - 0.5 + (R() - 0.5) * 0.5) / n, side = (R() - 0.5) * 0.12 * l / n;
      const saddle = q % 2 === 1;
      const lo = Math.min(h, hb), mid = h + (hb - h) * t;
      const hn = saddle ? lo * (0.55 + 0.25 * R()) : mid * (0.75 + 0.2 * R());
      // la sella si vede piu' in basso della linea fra le due cime: quanto
      // e' piu' bassa
      const v = [a[0] + (b[0] - a[0]) * t - ((b[1] - a[1]) / l) * side, a[1] + (b[1] - a[1]) * t + (mid - hn)];
      node(v, hn, false);
    }
  }
  return N;
}

// i due segmenti ab e cd si incrociano (non solo si toccano agli estremi)?
function cross(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
// [§9.214] il segmento ab sta dentro il poligono B (non ne attraversa il
// contorno, e il suo mezzo e' dentro): uno sperone che usciva dalla base
// (in un'insenatura, una catena che gira) faceva facce che sbordavano
function segInside(a, b, B) {
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!insidePoly(m[0], m[1], B)) return false;
  for (let k = 0; k < B.length; k++) if (cross(a, b, B[k], B[(k + 1) % B.length])) return false;
  return true;
}
// una spalla non si vede piu' in alto della sua cima (una spalla dietro la
// cima spuntava sopra la linea del cielo)
const clampKnee = (knee, c) => { knee.h = Math.max(0, Math.min(knee.h, knee.p[1] * ISO - (c.p[1] * ISO - c.h) - 14)); };

// La struttura sul terreno steso: le cime e le selle (N), il contorno
// (`foot`: punti { p, h: 0 } in giro orario sullo schermo), gli speroni
// (`spurs`: dalla cresta a un punto del contorno, `path`; i punti in comune
// sono gli stessi oggetti).
function structure(m, R) {
  const rough = or(m.rough, MOUNTAIN.rough), detail = or(m.detail, MOUNTAIN.detail), width = or(m.width, MOUNTAIN.width);
  const H = or(m.height, MOUNTAIN.height) || 1, seed = or(m.seed, 1) >>> 0;
  const steso = (p) => [p[0], p[1] / ISO];
  const N = crestNodes(m.crest, m, R);
  const C = N.map((c) => c.p); // la cresta sul terreno

  let B;
  if (m.base && m.base.length >= 3) {
    B = m.base.map(steso);
    // il piede di una cima fuori dalla base disegnata: la cima si abbassa
    // finche' il piede ci entra (la cresta resta dov'e')
    for (const c of N) {
      const v = [c.p[0], c.p[1] * ISO - c.h];
      for (let q = 0; q < 20 && !insidePoly(c.p[0], c.p[1], B); q++) { c.h *= 0.85; c.p = [v[0], (v[1] + c.h) / ISO]; }
    }
  } else {
    // gli speroni della base: 3-5 per cima, 0-1 per sella, in direzioni a
    // caso (non due troppo vicine), oltre la mezza larghezza
    const spines = [];
    for (const c of N) {
      const n = c.peak ? 3 + Math.floor(R() * 3) : (R() < 0.5 ? 1 : 0);
      const a0 = R() * 6.2832;
      for (let q = 0; q < n; q++) {
        const ang = a0 + (q + 0.25 + 0.5 * R()) * (6.2832 / n);
        const cs = [dcos(ang), dsin(ang)], len = (width / 2) * (1 + 0.6 * R() * (0.5 + rough)) * (c.peak ? 1 : 0.8);
        spines.push({ a: c.p, b: [c.p[0] + cs[0] * len, c.p[1] + cs[1] * len], r: (width / 2) * (0.35 + 0.2 * R()) });
      }
    }
    B = autoBase(N, spines, width, rough, seed, !!m.sym && m.sym !== "horizontal");
  }
  if (area(B) < 0) B = B.slice().reverse();
  B = jag(B, rough, R);
  const nb = B.length;
  const S = [0];
  for (let k = 0; k < nb; k++) S.push(S[k] + dhypot(B[(k + 1) % nb][0] - B[k][0], B[(k + 1) % nb][1] - B[k][1]));
  const per = S[nb];
  const arcLen = (i, j) => (S[j] - S[i] + per) % per; // da i a j in giro orario

  // i piedi degli speroni: le punte del contorno (i punti piu' lontani
  // dalla cresta nei dintorni: le lingue), e nei tratti lunghi senza punte
  // il punto piu' lontano del tratto
  const gap = 300 - 170 * detail;
  const far = B.map((p) => lineDist(p, C));
  const farS = far.map((_, k) => { let t = 0; for (let q = -2; q <= 2; q++) t += far[(k + q + nb) % nb]; return t / 5; });
  const feet = [];
  for (let k = 0; k < nb; k++) {
    let top = true;
    for (let q = 1; top && q < nb; q++) {
      const j1 = (k + q) % nb, j0 = (k - q + nb) % nb;
      if (arcLen(k, j1) > gap * 0.45 && arcLen(j0, k) > gap * 0.45) break;
      if ((arcLen(k, j1) <= gap * 0.45 && farS[j1] > farS[k]) || (arcLen(j0, k) <= gap * 0.45 && farS[j0] > farS[k])) top = false;
    }
    if (top && (!feet.length || arcLen(feet[feet.length - 1], k) > gap * 0.3)) feet.push(k);
  }
  const tips = new Set(feet);
  for (let guard = 0; guard < 64; guard++) {
    if (!feet.length) { feet.push(0); continue; }
    let worst = -1, wl = gap * 1.5;
    for (let i = 0; i < feet.length; i++) {
      const l = feet.length === 1 ? per : arcLen(feet[i], feet[(i + 1) % feet.length]);
      if (l > wl) { wl = l; worst = i; }
    }
    if (worst < 0 && feet.length >= 3) break;
    if (worst < 0) worst = 0;
    // nel mezzo del tratto, il punto piu' lontano dalla cresta
    const a = feet[worst], l = feet.length === 1 ? per : arcLen(a, feet[(worst + 1) % feet.length]);
    let best = -1, bf = -1;
    for (let k = a; ; k = (k + 1) % nb) {
      const d = arcLen(a, k);
      if (d > l * 0.75) break;
      if (d > l * 0.25 && farS[k] > bf) { bf = farS[k]; best = k; }
    }
    if (best < 0) break;
    feet.push(best);
    feet.sort((x, y) => x - y);
  }
  // ogni piede legato alla cima (o sella) piu' vicina che vede (lo sperone
  // dritto resta dentro la base), le alte attirano di piu'; nessuna: il
  // piede non fa uno sperone
  const nearest = (k) => {
    const p = B[k];
    const order = N.map((c, i) => [dhypot(c.p[0] - p[0], c.p[1] - p[1]) / (0.6 + 0.4 * c.h / H), i]).sort((x, y) => x[0] - y[0]);
    for (const [, i] of order) if (segInside(N[i].p, p, B)) return i;
    return -1;
  };
  const foot = B.map((p) => ({ p, h: 0 }));
  // Gli speroni, come nei disegni: pochi grandi dalle cime (le punte del
  // contorno, al piu' 2-4 per cima, le piu' lontane), spesso con un
  // ginocchio (una spalla di roccia a meta' discesa, un po' di lato e piu'
  // alta del pendio); gli altri piedi scendono dal ginocchio di uno
  // sperone grande accanto (piccole piramidi sul fianco).
  const kneeOf = (sp) => {
    if (sp.path.length === 3) return sp.path[1];
    const c = sp.path[0], f = sp.path[1].p, u = 0.3 + 0.3 * R(), l = dhypot(f[0] - c.p[0], f[1] - c.p[1]) || 1;
    let side = (R() - 0.5) * 0.3 * l;
    const hk = c.h * (1 - u) * (1.05 + 0.35 * R());
    for (let tries = 0; tries < 2; tries++, side = 0) {
      const p = [c.p[0] + (f[0] - c.p[0]) * u - ((f[1] - c.p[1]) / l) * side, c.p[1] + (f[1] - c.p[1]) * u + ((f[0] - c.p[0]) / l) * side];
      if (!segInside(c.p, p, B) || !segInside(p, f, B)) continue;
      const knee = { p, h: hk };
      clampKnee(knee, c);
      sp.path.splice(1, 0, knee);
      return knee;
    }
    return null;
  };
  const cand = feet.map((k) => ({ k, node: nearest(k), far: farS[k], tip: tips.has(k) })).filter((f) => f.node >= 0);
  const main = new Set();
  N.forEach((c, i) => {
    const mine = cand.filter((f) => f.node === i && f.tip).sort((x, y) => y.far - x.far);
    const n = (c.peak ? 2 : 1) + Math.round(detail * 1.5 + R());
    mine.slice(0, n).forEach((f) => main.add(f.k));
  });
  if (!main.size && cand.length) main.add(cand.reduce((a, b) => (b.far > a.far ? b : a)).k);
  let spurs = cand.filter((f) => main.has(f.k)).map((f) => {
    const sp = { k: f.k, node: f.node, path: [N[f.node], foot[f.k]], own: 0, inked: R() < 0.9 + 0.1 * detail };
    if (R() < 0.5 + 0.4 * detail) kneeOf(sp);
    return sp;
  });
  const mains = spurs.slice();
  // gli altri piedi: dal ginocchio dello sperone grande prima o dopo (il
  // piu' vicino lungo il contorno: cosi' non si incrociano); se non c'e' o
  // non vede il piede, dalla sua cima
  for (const f of cand) {
    if (main.has(f.k) || !mains.length) continue;
    let prev = mains[mains.length - 1], next = mains[0];
    for (const sp of mains) { if (sp.k < f.k) prev = sp; }
    for (let i = mains.length - 1; i >= 0; i--) if (mains[i].k > f.k) next = mains[i];
    const sp = arcLen(prev.k, f.k) <= arcLen(f.k, next.k) ? prev : next;
    const knee = kneeOf(sp), inked = R() < 0.75 + 0.25 * detail;
    if (knee && segInside(knee.p, B[f.k], B)) spurs.push({ k: f.k, node: sp.node, path: [sp.path[0], knee, foot[f.k]], own: 1, inked });
    else if (segInside(sp.path[0].p, B[f.k], B)) spurs.push({ k: f.k, node: sp.node, path: [sp.path[0], foot[f.k]], own: 0, inked });
  }
  spurs = spurs.sort((x, y) => x.k - y.k);
  return { N, foot, spurs, detail };
}

// [§9.214] La gemella con la simmetria dell'editor: la stessa montagna
// specchiata sul terreno (le cime alte uguali), vista dallo stesso punto:
// la base, quella che conta per il gioco, e' esattamente lo specchio
// dell'altra. `mode` come editmap.js mirrorPoint; room: [W, H].
function mirrorStructure(st, mode, room) {
  const [W, H] = room;
  const f = (p) => {
    const x = p[0], y = p[1] * ISO;
    const q = mode === "diagonal" ? [W - x, H - y] : mode === "horizontal" ? [W - x, y] : [x, H - y];
    return [q[0], q[1] / ISO];
  };
  const seen = new Set();
  const mv = (o) => { if (!seen.has(o)) { seen.add(o); o.p = f(o.p); } };
  st.N.forEach(mv); st.foot.forEach(mv);
  for (const sp of st.spurs) sp.path.forEach(mv);
  // specchiato su un asse il giro diventa antiorario: lo si rigira
  if (mode !== "diagonal") {
    st.foot.reverse();
    const nb = st.foot.length;
    for (const sp of st.spurs) sp.k = nb - 1 - sp.k;
    st.spurs.sort((x, y) => x.k - y.k);
  }
  for (const sp of st.spurs) for (let i = 1; i < sp.path.length - 1; i++) clampKnee(sp.path[i], sp.path[0]);
}

// Le facce, l'inchiostro, la base. [§9.214] Con la simmetria dell'editor le
// due gemelle hanno gli stessi campi e `sym` (la modalita', editmap.js
// mirrorPoint); quella specchiata anche `mirrored: true` (con m.room, [W,
// H]: mirrorStructure).
export function mountainGeometry(m) {
  const R = rng(or(m.seed, 1) >>> 0);
  const st = structure(m, R);
  if (m.mirrored && m.sym && m.room) mirrorStructure(st, m.sym, m.room);
  const { N, foot, spurs, detail } = st, B = foot.map((f) => f.p), nb = B.length;

  const scr = (q) => [q.p[0], q.p[1] * ISO - q.h];
  const faces = [];
  for (let s = 0; s < spurs.length; s++) {
    const X = spurs[s], Y = spurs[(s + 1) % spurs.length], PX = X.path, PY = Y.path;
    if (X === Y) break;
    // giro: dove le due strade dalla cresta si separano (o la cresta da una
    // cima all'altra), giu' per Y, il contorno da Y a X all'indietro, su per X
    let c = -1;
    while (c + 1 < Math.min(PX.length, PY.length) - 1 && PX[c + 1] === PY[c + 1]) c++;
    const ring = [];
    if (c >= 0) for (let i = c; i < PY.length; i++) ring.push(PY[i]);
    else {
      const step = X.node <= Y.node ? 1 : -1;
      for (let i = X.node; ; i += step) { ring.push(N[i]); if (i === Y.node) break; }
      for (let i = 1; i < PY.length; i++) ring.push(PY[i]);
    }
    for (let k = (Y.k - 1 + nb) % nb; k !== X.k; k = (k - 1 + nb) % nb) ring.push(foot[k]);
    for (let i = PX.length - 1; i > Math.max(c, 0); i--) ring.push(PX[i]);
    // la normale (Newell) e la luce
    let nx = 0, ny = 0, nz = 0, gy = 0, gc = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const az = a.h * ZK, bz = b.h * ZK;
      nx += (a.p[1] - b.p[1]) * (az + bz);
      ny += (az - bz) * (a.p[0] + b.p[0]);
      nz += (a.p[0] - b.p[0]) * (a.p[1] + b.p[1]);
      if (a.h === 0) { gy += a.p[1]; gc++; }
    }
    let n = norm3([nx, ny, nz]);
    if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
    const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    // [§9.214, richiesta dell'autore: "il colore mi sembra un po' scuro"]
    // le facce in luce come la pietra dei disegni, le altre poco piu' scure
    const shade = Math.min(1, 0.84 + 0.3 * lam + (R() - 0.5) * 0.05);
    const arc = [];
    for (let k = X.k; ; k = (k + 1) % nb) { arc.push(B[k]); if (k === Y.k) break; }
    faces.push({ ring, shade, depth: gc ? gy / gc : 0, arc, tex: [Math.floor(R() * 256), Math.floor(R() * 256), (R() - 0.5) * 1.2] });
  }
  // da dietro in avanti: prima le facce coi piedi piu' in alto
  const order = faces.map((_, i) => i).sort((a, b) => faces[a].depth - faces[b].depth);
  const rank = new Array(faces.length);
  order.forEach((f, r) => { rank[f] = r; });
  // l'inchiostro di uno sperone (la sua parte: un ramo dal ginocchio in
  // giu') va dopo l'ultima faccia che lo tocca, cosi' le facce davanti lo
  // coprono e quelle dietro no
  const inkAfter = spurs.map((sp) => {
    const mine = sp.path.slice(sp.own + 1);
    let last = -1;
    faces.forEach((f, i) => { if (mine.some((q) => f.ring.includes(q))) last = Math.max(last, rank[i]); });
    return last;
  });

  const layers = [];
  for (let r = 0; r < order.length; r++) {
    const f = faces[order[r]], poly = f.ring.map(scr);
    layers.push({ face: poly, tris: triangulate(poly), shade: f.shade, tex: f.tex });
    // il contorno a tratti (pezzi di 20-90 px con buchi), piu' spesso dove
    // guarda in giu'
    const P = f.arc.map((p) => [p[0], p[1] * ISO]);
    let run = [], left = 20 + 70 * R(), gapLeft = 0;
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], l = dhypot(b[0] - a[0], b[1] - a[1]);
      const down = (a[0] - b[0]) / (l || 1); // giro orario: andando a sinistra il dentro e' sopra, il bordo guarda in giu'
      if (gapLeft > 0) { gapLeft -= l; continue; }
      if (!run.length) run.push({ x: a[0], y: a[1], ink: 1 });
      run.push({ x: b[0], y: b[1], ink: (down > 0.2 ? 4.8 : 3) + 1.8 * R() });
      left -= l;
      if (left <= 0 || i === P.length - 2) {
        run[run.length - 1].ink = 1;
        if (run.length >= 2 && R() < 0.85) layers.push({ ink: run });
        run = []; left = 20 + 70 * R(); gapLeft = R() < 0.6 ? 4 + 30 * R() * (1 - 0.5 * detail) : 0;
      }
    }
    // [§9.214, richiesta dell'autore: "le linee nere dentro il disegno mi
    // sembrano poche, non e' obbligatorio arrivino fino alla base"] linee in
    // piu' dentro la faccia: da una cima o da una spalla verso il contorno
    // (spesso dritte in giu', come le verticali dei disegni), fermate a
    // meta' pendio; solo se restano dentro la faccia
    const tops = f.ring.filter((q) => q.h > 0);
    const want = (R() < 0.7 + 0.3 * detail ? 1 : 0) + (f.arc.length > 8 && R() < 0.5 + 0.4 * detail ? 1 : 0) + (f.arc.length > 20 && R() < detail ? 1 : 0);
    for (let q = 0, tries = 0; q < want && tops.length && f.arc.length > 2 && tries < 3 * want; tries++) {
      const t = tops[Math.floor(R() * tops.length)], a = scr(t);
      let g;
      if (R() < 0.55) { // dritta in giu': il punto del contorno sotto la cima
        let bd = Infinity;
        for (const p of f.arc) { const d = Math.abs(p[0] - a[0]); if (p[1] * ISO > a[1] + 40 && d < bd) { bd = d; g = p; } }
      }
      if (!g) g = f.arc[1 + Math.floor(R() * (f.arc.length - 2))];
      const b = [g[0], g[1] * ISO], u0 = R() < 0.4 ? 0.08 + 0.12 * R() : 0, u1 = 0.35 + 0.4 * R();
      const p0 = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], p1 = [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1];
      const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      if (dhypot(p1[0] - p0[0], p1[1] - p0[1]) < 30 || !insidePoly(mid[0], mid[1], poly) || !insidePoly(p1[0], p1[1], poly)) continue;
      layers.push({ ink: taper([p0, p1], 3 + 1.6 * R(), R, true) });
      q++;
    }
    spurs.forEach((sp, i) => {
      if (inkAfter[i] === r && sp.inked) layers.push({ ink: taper(sp.path.slice(sp.own).map(scr), 4 + 2 * R(), R) });
    });
  }
  // la cresta, la linea piu' scura (spessa uguale, sottile solo alle due
  // estremita'): ogni tratto dopo l'ultima faccia che lo ha sul bordo, come
  // gli speroni (una catena che gira verso chi guarda nasconde un pezzo della
  // sua cresta)
  if (N.length > 1) {
    const seg = N.slice(0, -1).map((a, i) => {
      const b = N[i + 1];
      let last = -1;
      faces.forEach((f, j) => { if (f.ring.includes(a) && f.ring.includes(b)) last = Math.max(last, rank[j]); });
      const [ax, ay] = scr(a), [bx, by] = scr(b), w = 5.2;
      return { last, ink: [{ x: ax, y: ay, ink: i === 0 ? 1.5 : w }, { x: bx, y: by, ink: i === N.length - 2 ? 1.5 : w }] };
    });
    // al suo posto fra le facce (da dietro in avanti)
    const at = new Map();
    let pos = 0;
    layers.forEach((L, i) => { if (L.face) { at.set(pos, i); pos++; } });
    for (const sg of seg.sort((x, y) => y.last - x.last)) {
      const i = sg.last < 0 || sg.last >= pos - 1 ? layers.length : at.get(sg.last + 1);
      layers.splice(i, 0, { ink: sg.ink });
      at.forEach((v, k) => { if (v >= i) at.set(k, v + 1); });
    }
  }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const L of layers) for (const p of L.face || L.ink) {
    const x = p.x !== undefined ? p.x : p[0], y = p.y !== undefined ? p.y : p[1];
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const base = B.map(([x, y]) => [x, y * ISO]);
  for (const [x, y] of base) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return {
    layers, base, crest: N.map((c) => scr(c)), feet: N.map((c) => [c.p[0], c.p[1] * ISO]),
    // le cime dell'autore (per l'editor: dove si vedono, quanto sono alte)
    tops: N.filter((c) => c.peak).map((c) => ({ x: c.p[0], y: c.p[1] * ISO - c.h, h: c.h })),
    bbox: [x0 - 4, y0 - 4, x1 + 4, y1 + 4],
  };
}

// I triangoli di un poligono (orecchie: va bene anche concavo), come
// [x0, y0, x1, y1, x2, y2, ...]; se non riesce (un poligono che si
// incrocia), a ventaglio dal primo punto
export function triangulate(P) {
  let idx = P.map((_, i) => i);
  if (area(P) < 0) idx.reverse(); // in giro orario sullo schermo
  const out = [];
  const tri = (a, b, c) => out.push(P[a][0], P[a][1], P[b][0], P[b][1], P[c][0], P[c][1]);
  const cw = (a, b, c) => (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0]);
  const inTri = (p, a, b, c) => cw(a, b, p) >= 0 && cw(b, c, p) >= 0 && cw(c, a, p) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 4 * P.length * P.length) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      const k = cw(a, b, c);
      if (k < 0) continue; // concavo
      if (k === 0) { idx.splice(i, 1); cut = true; break; } // in fila: via
      let ok = true;
      for (const j of idx) if (j !== a && j !== b && j !== c && inTri(j, a, b, c)) { ok = false; break; }
      if (!ok) continue;
      tri(a, b, c);
      idx.splice(i, 1);
      cut = true;
      break;
    }
    if (!cut) { for (let i = 1; i < idx.length - 1; i++) tri(idx[0], idx[i], idx[i + 1]); return out; }
  }
  if (idx.length === 3) tri(idx[0], idx[1], idx[2]);
  return out;
}

// Una linea a inchiostro che si assottiglia alle estremita' (come un
// pennino), a volte piu' corta in fondo o che sborda oltre l'inizio, come
// nei disegni; `solid`: senza scherzi
function taper(P, w, R, solid) {
  let pts = P.map((p) => [p[0], p[1]]);
  if (!solid && pts.length >= 2) {
    const n = pts.length, a = pts[n - 2], b = pts[n - 1];
    if (R() < 0.3) { const t = 0.7 + 0.2 * R(); pts[n - 1] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    if (R() < 0.2) {
      const c = pts[0], d = pts[1], l = dhypot(d[0] - c[0], d[1] - c[1]) || 1, e = 6 + 10 * R();
      pts[0] = [c[0] - ((d[0] - c[0]) / l) * e, c[1] - ((d[1] - c[1]) / l) * e];
    }
  }
  // punti ogni ~12 px, lo spessore a campana schiacciata
  const out = [];
  let tot = 0;
  const L = [0];
  for (let i = 1; i < pts.length; i++) { tot += dhypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(tot); }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], l = L[i + 1] - L[i], n = Math.max(1, Math.ceil(l / 12));
    for (let q = 0; q < n; q++) {
      const t = q / n, s = L[i] + l * t;
      out.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, s });
    }
  }
  const e = pts[pts.length - 1];
  out.push({ x: e[0], y: e[1], s: tot });
  const ramp = Math.min(40, tot * 0.3);
  for (const p of out) {
    const t = Math.min(1, Math.min(p.s, tot - p.s) / (ramp || 1));
    p.ink = 0.8 + (w - 0.8) * Math.sqrt(t);
    delete p.s;
  }
  return out;
}

// ------------------------------------------------------------ nel gioco

// [§9.214] Disegna la montagna `g` (mountainGeometry) nel suolo cotto
// (ground.js, dopo strade, fiumi e ponti): le facce a triangoli con la
// pietra `rock` (ripetuta, spostata e girata per faccia) moltiplicata per la
// loro luce, l'inchiostro come i fiumi (rivers.js inkLine); `white` il
// quadratino bianco ({ t, u, v }).
export function drawMountain(r, g, rock, white) {
  for (const L of g.layers) {
    if (!L.face) { inkLine(r, white, L.ink, () => 0, () => true); continue; }
    const v = Math.round(255 * L.shade), col = (v | (v << 8) | (v << 16) | (255 << 24)) >>> 0;
    const [dx, dy, a] = L.tex, c = dcos(a), s = dsin(a);
    const U = (x, y) => c * (x - dx) + s * (y - dy), V = (x, y) => -s * (x - dx) + c * (y - dy);
    const T = L.tris;
    for (let i = 0; i < T.length; i += 6) {
      const [x0, y0, x1, y1, x2, y2] = [T[i], T[i + 1], T[i + 2], T[i + 3], T[i + 4], T[i + 5]];
      r.quadUV(rock, x0, y0, U(x0, y0), V(x0, y0), x1, y1, U(x1, y1), V(x1, y1), x2, y2, U(x2, y2), V(x2, y2), x2, y2, U(x2, y2), V(x2, y2), col);
    }
  }
}

// Le celle (8 px, come l'acqua dei fiumi) della sagoma delle montagne di
// w.mountains: le facce come si vedono e la base. [§9.214] E' l'ostacolo
// (unita', fantasmi degli edifici, percorsi, frecce), come la maschera
// precisa delle montagne dipinte: tutto il disegno. Una volta, poi da
// w._mountainCells; null senza montagne.
export const MOUNTAIN_CELL = 8;
export function mountainCells(w) {
  if (w._mountainCells !== undefined) return w._mountainCells;
  const list = w.mountains || [];
  if (!list.length) return (w._mountainCells = null);
  const C = MOUNTAIN_CELL, gw = Math.ceil(w.roomW / C), gh = Math.ceil(w.roomH / C), grid = new Uint8Array(gw * gh);
  for (const g of list) rasterize(g, grid, gw, gh, C);
  return (w._mountainCells = { C, gw, gh, grid });
}
// la sagoma di una montagna nella griglia (celle col centro dentro)
export function rasterize(g, grid, gw, gh, C, val = 1) {
  const fill = (poly, tri) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < poly.length; i += 2) { x0 = Math.min(x0, poly[i]); x1 = Math.max(x1, poly[i]); y0 = Math.min(y0, poly[i + 1]); y1 = Math.max(y1, poly[i + 1]); }
    const cx0 = Math.max(0, Math.floor(x0 / C)), cx1 = Math.min(gw - 1, Math.floor(x1 / C));
    const cy0 = Math.max(0, Math.floor(y0 / C)), cy1 = Math.min(gh - 1, Math.floor(y1 / C));
    const q = [];
    for (let i = 0; i < poly.length; i += 2) q.push([poly[i], poly[i + 1]]);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const k = cy * gw + cx;
        if (grid[k] === val) continue;
        if (insidePoly((cx + 0.5) * C, (cy + 0.5) * C, q)) grid[k] = val;
      }
    }
  };
  for (const L of g.layers) if (L.tris) for (let i = 0; i < L.tris.length; i += 6) fill(L.tris.slice(i, i + 6), true);
  fill(g.base.flat(), false);
}
// il riquadro [x0, y0, x1, y1] tocca una montagna?
export function mountainIn(mc, x0, y0, x1, y1) {
  const C = mc.C;
  const cx0 = Math.max(0, Math.floor(x0 / C)), cx1 = Math.min(mc.gw - 1, Math.floor(x1 / C));
  const cy0 = Math.max(0, Math.floor(y0 / C)), cy1 = Math.min(mc.gh - 1, Math.floor(y1 / C));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) if (mc.grid[cy * mc.gw + cx]) return true;
  return false;
}
export const mountainAt = (mc, x, y) => !!mc && x >= 0 && y >= 0 && mc.grid[Math.floor(y / mc.C) * mc.gw + Math.floor(x / mc.C)] === 1
  && x < mc.gw * mc.C && y < mc.gh * mc.C;

// ------------------------------------------------------------ i controlli

// [§9.214, richiesta dell'autore: "abbiamo strumenti di controllo per
// evitare inserimenti da parte dell'utente di punti assurdi o
// infattibili?"] I limiti di una montagna: i valori dei parametri (i passi
// dei "-" e "+" dell'editor), quanti punti, quanto vicini o lontani. Li
// usano l'editor (un punto che non va si rifiuta, con l'avviso che dice
// perche') e la convalida delle mappe che arrivano da fuori (mapfile.js).
export const MOUNTAIN_STEPS = {
  height: [80, 120, 160, 200, 260, 320, 400, 480],
  width: [160, 240, 320, 420, 520, 640, 800, 1000],
  rough: [0, 0.25, 0.5, 0.75, 1],
  detail: [0, 0.25, 0.5, 0.75, 1],
};
export const MOUNTAIN_LIMITS = { crest: 12, base: 64, gap: 50, seg: 1200, baseGap: 16, turn: 35, area: 15000, count: 60, peak: [0.3, 2] };
const segCross = (P, closed) => {
  const n = P.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    for (let j = i + 2; j < m; j++) {
      if (closed && i === 0 && j === n - 1) continue; // (i lati accanto, nel giro chiuso)
      if (cross(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return true;
    }
  }
  return false;
};
// La cresta (i punti come si vedono): null se va, se no il perche':
// "count" (troppi punti), "close" (due punti di fila troppo vicini), "far"
// (troppo lontani), "sharp" (la linea torna indietro: un angolo stretto),
// "cross" (si incrocia)
export function crestProblem(pts) {
  const L = MOUNTAIN_LIMITS;
  if (!pts.length || pts.length > L.crest) return "count";
  for (let i = 1; i < pts.length; i++) {
    const d = dhypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d < L.gap) return "close";
    if (d > L.seg) return "far";
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]];
    const cos = (u[0] * v[0] + u[1] * v[1]) / ((dhypot(u[0], u[1]) * dhypot(v[0], v[1])) || 1);
    if (cos > dcos((L.turn * Math.PI) / 180)) return "sharp";
  }
  return segCross(pts, false) ? "cross" : null;
}
// La base (in giro, sul terreno) di una cresta: null se va, se no il
// perche': "count", "close" (due punti troppo vicini), "cross" (il contorno
// si incrocia), "small" (troppo piccola), "crest" (sotto una cima, fino a
// `height` px piu' in basso, non c'e' base: la cima non ha dove poggiare).
// Con `open` (si sta disegnando) il contorno non si chiude ancora.
export function baseProblem(pts, crest, height, open = false) {
  const L = MOUNTAIN_LIMITS;
  if (pts.length > L.base || (!open && pts.length < 3)) return "count";
  for (let i = 1; i < pts.length; i++) if (dhypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) < L.baseGap) return "close";
  if (segCross(pts, !open)) return "cross";
  if (open) return null;
  if (Math.abs(area(pts)) < L.area) return "small";
  for (const [x, y, h] of crest) { // ([x, y, h]: con la sua altezza)
    let ok = false;
    for (let t = 0; t <= 1 && !ok; t += 0.05) ok = insidePoly(x, y + (h ?? height) * t, pts);
    if (!ok) return "crest";
  }
  return null;
}
// [§9.214] Una voce della mappa (mapfile.js validateMap): la copia pulita, o
// null se ha qualcosa che non va. W, H: la mappa; M: il margine fuori.
export function cleanMountain(f, W, H, M) {
  const num = (v) => typeof v === "number" && Number.isFinite(v);
  const inside = (q) => Array.isArray(q) && q.length === 2 && num(q[0]) && num(q[1]) && q[0] >= -M && q[1] >= -M && q[0] <= W + M && q[1] <= H + M;
  const S = MOUNTAIN_STEPS, L = MOUNTAIN_LIMITS;
  if (!f || typeof f !== "object" || !Array.isArray(f.crest) || !f.crest.every(inside) || crestProblem(f.crest)) return null;
  const c = { crest: f.crest.map((q) => [q[0], q[1]]) };
  for (const k of ["height", "width", "rough", "detail"]) {
    if (f[k] === undefined) continue;
    if (!num(f[k]) || f[k] < S[k][0] || f[k] > S[k][S[k].length - 1]) return null;
    c[k] = f[k];
  }
  if (f.seed !== undefined) { if (!Number.isInteger(f.seed) || f.seed < 0 || f.seed > 0x7fffffff) return null; c.seed = f.seed; }
  if (f.peaks !== undefined) {
    if (!Array.isArray(f.peaks) || f.peaks.length !== c.crest.length || !f.peaks.every((v) => num(v) && v >= L.peak[0] && v <= L.peak[1])) return null;
    c.peaks = f.peaks.slice();
  }
  if (f.base !== undefined && f.base !== null) {
    if (!Array.isArray(f.base) || !f.base.every(inside) || baseProblem(f.base, c.crest, (c.height ?? MOUNTAIN.height) * 0.9)) return null;
    c.base = f.base.map((q) => [q[0], q[1]]);
  }
  if (f.sym !== undefined) { if (!["diagonal", "horizontal", "vertical"].includes(f.sym)) return null; c.sym = f.sym; }
  if (f.mirrored !== undefined) { if (f.mirrored !== true || !c.sym) return null; c.mirrored = true; }
  return c;
}
