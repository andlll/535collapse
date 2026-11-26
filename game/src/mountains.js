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
// dell'altezza per punto] | undefined }].
//
// Uscita (mountainGeometry): `layers`, le facce (poligoni sullo schermo con
// la loro luce, `shade`, da moltiplicare sulla texture roccia.png fissata
// al mondo, spostata e girata per faccia, `tex`: [dx, dy, angolo], come le
// toppe di carta dei disegni, dove la marmorizzazione cambia verso da una
// faccia all'altra) e le linee a inchiostro ({ x, y, ink } per punto, come
// rivers.js inkLine), nell'ordine in cui si disegnano (da dietro in
// avanti); `base`, il contorno sul terreno (coordinate del mondo); `bbox`.

import { dcos, dhypot, dsin } from "./dmath.js"; // §9.152
import { ISO } from "./rivers.js";

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
function autoBase(N, spines, width, rough, seed) {
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
      if (qy - p[1] > 0.8 * hq / ISO) { continue; }
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
  const inside = (i, j) => i >= 0 && j >= 0 && i < gw && j < gh && comp[j * gw + i] === 1;
  // il bordo, seguendo i lati delle celle con il dentro a destra
  let s = 0;
  while (!comp[s]) s++;
  const si = s % gw, sj = (s - si) / gw;
  const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const AR = [[0, 0], [-1, 0], [-1, -1], [0, -1]], AL = [[0, -1], [0, 0], [-1, 0], [-1, -1]];
  const out = [];
  let x = si, y = sj, d = 0;
  for (let guard = 0; guard < 4 * gw * gh; guard++) {
    out.push([x0 + x * CELL, y0 + y * CELL]);
    x += D[d][0]; y += D[d][1];
    if (inside(x + AL[d][0], y + AL[d][1])) d = (d + 3) % 4;
    else if (!inside(x + AR[d][0], y + AR[d][1])) d = (d + 1) % 4;
    if (x === si && y === sj && d === 0) break;
  }
  return simplify(out, CELL * 0.8);
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

// Le facce, l'inchiostro, la base
export function mountainGeometry(m) {
  const seed = or(m.seed, 1) >>> 0, R = rng(seed);
  const rough = or(m.rough, MOUNTAIN.rough), detail = or(m.detail, MOUNTAIN.detail), width = or(m.width, MOUNTAIN.width);
  const H = or(m.height, MOUNTAIN.height) || 1;
  const steso = (p) => [p[0], p[1] / ISO];
  const N = crestNodes(m.crest, m, R);
  const C = N.map((c) => c.p); // la cresta sul terreno

  // la base, in giro orario sullo schermo
  let B;
  if (m.base && m.base.length >= 3) {
    B = m.base.map(steso);
    // il piede di una cima fuori dalla base disegnata: la cima si abbassa
    // finche' il piede ci entra (la cresta resta dov'e')
    for (const c of N) {
      const v = [c.p[0], c.p[1] * ISO - c.h];
      for (let q = 0; q < 20 && !insidePoly(c.p[0], c.p[1], B); q++) { c.h *= 0.85; c.p = [v[0], (v[1] + c.h) / ISO]; }
    }
  }
  else {
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
    B = autoBase(N, spines, width, rough, seed);
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
  let feet = [];
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
  // ogni piede legato alla cima (o sella) piu' vicina, le alte attirano di piu'
  const nearest = (p) => {
    let best = 0, bd = Infinity;
    N.forEach((c, i) => { const d = dhypot(c.p[0] - p[0], c.p[1] - p[1]) / (0.6 + 0.4 * c.h / H); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  const foot = B.map((p) => ({ p, h: 0 }));
  // Gli speroni, come nei disegni: pochi grandi dalle cime (le punte del
  // contorno, al piu' 2-4 per cima, le piu' lontane), spesso con un
  // ginocchio (una spalla di roccia a meta' discesa, un po' di lato e piu'
  // alta del pendio); gli altri piedi scendono dal ginocchio di uno
  // sperone grande accanto (piccole piramidi sul fianco). `path`: dalla
  // cresta al piede; i punti in comune sono gli stessi oggetti.
  const kneeOf = (sp) => {
    if (sp.path.length === 3) return sp.path[1];
    const c = sp.path[0], f = sp.path[1].p, u = 0.3 + 0.3 * R(), l = dhypot(f[0] - c.p[0], f[1] - c.p[1]) || 1, side = (R() - 0.5) * 0.3 * l;
    const knee = {
      p: [c.p[0] + (f[0] - c.p[0]) * u - ((f[1] - c.p[1]) / l) * side, c.p[1] + (f[1] - c.p[1]) * u + ((f[0] - c.p[0]) / l) * side],
      h: c.h * (1 - u) * (1.05 + 0.35 * R()),
    };
    // non piu' in alto della sua cima sullo schermo (una spalla dietro la
    // cima spuntava sopra la linea del cielo)
    knee.h = Math.max(0, Math.min(knee.h, knee.p[1] * ISO - (c.p[1] * ISO - c.h) - 14));
    sp.path.splice(1, 0, knee);
    return knee;
  };
  const cand = feet.map((k) => ({ k, node: nearest(B[k]), far: farS[k], tip: tips.has(k) }));
  const main = new Set();
  N.forEach((c, i) => {
    const mine = cand.filter((f) => f.node === i && f.tip).sort((x, y) => y.far - x.far);
    const n = (c.peak ? 2 : 1) + Math.round(detail * 1.5 + R());
    mine.slice(0, n).forEach((f) => main.add(f.k));
  });
  if (!main.size) main.add(cand.reduce((a, b) => (b.far > a.far ? b : a)).k);
  let spurs = cand.filter((f) => main.has(f.k)).map((f) => {
    const sp = { k: f.k, node: f.node, path: [N[f.node], foot[f.k]], own: 0, inked: R() < 0.75 + 0.25 * detail };
    if (R() < 0.5 + 0.4 * detail) kneeOf(sp);
    return sp;
  });
  const mains = spurs.slice();
  // gli altri piedi: dal ginocchio dello sperone grande prima o dopo (il
  // piu' vicino lungo il contorno: cosi' non si incrociano)
  for (const f of cand) {
    if (main.has(f.k)) continue;
    let prev = mains[mains.length - 1], next = mains[0];
    for (const sp of mains) { if (sp.k < f.k) prev = sp; }
    for (let i = mains.length - 1; i >= 0; i--) if (mains[i].k > f.k) next = mains[i];
    const sp = arcLen(prev.k, f.k) <= arcLen(f.k, next.k) ? prev : next;
    const knee = kneeOf(sp);
    spurs.push({ k: f.k, node: sp.node, path: [sp.path[0], knee, foot[f.k]], own: 1, inked: R() < 0.6 + 0.4 * detail });
  }
  spurs = spurs.sort((x, y) => x.k - y.k);

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
    const shade = Math.min(1, 0.74 + 0.36 * lam + (R() - 0.5) * 0.06);
    // da dietro in avanti: prima le facce coi piedi piu' in alto
    const arc = [];
    for (let k = X.k; ; k = (k + 1) % nb) { arc.push(B[k]); if (k === Y.k) break; }
    faces.push({ ring, shade, depth: gc ? gy / gc : 0, arc, tex: [Math.floor(R() * 256), Math.floor(R() * 256), (R() - 0.5) * 1.2] });
  }
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
    const f = faces[order[r]];
    layers.push({ face: f.ring.map(scr), shade: f.shade, tex: f.tex });
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
  return { layers, base: B.map(([x, y]) => [x, y * ISO]), crest: N.map((c) => scr(c)), feet: N.map((c) => [c.p[0], c.p[1] * ISO]), bbox: [x0 - 4, y0 - 4, x1 + 4, y1 + 4] };
}

// Una linea a inchiostro che si assottiglia alle estremita' (come un
// pennino), a volte piu' corta in fondo o che sborda oltre l'inizio, come
// nei disegni; `solid`: senza scherzi (la cresta)
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
