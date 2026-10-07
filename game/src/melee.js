// [§7.7, segnalazione dell'autore] Posti attorno al bersaglio in mischia.
//
// Nell'originale chi insegue un nemico va con mp_potential_step verso il
// suo centro: il primo arriva e combatte, gli altri spingono contro di lui
// (le unita' sono solide) e restano in coda; i nemici, trovata la
// destinazione occupata, la spostano a caso di 20-30 px a ogni passo e
// tremano sul posto. In una prova 8 contro 3 combattevano in 3.
//
// Qui chi insegue in mischia punta a un posto sul bordo di un bersaglio: la
// propria maschera a GAP px dalla sua (meno dei 10 px a cui si colpisce).
// Ogni bersaglio ha al piu' un attaccante per settore di SEP gradi; un posto
// vale se il settore e' libero e se nessun'altra unita' o edificio occupa
// il punto. Fra i nemici vicini a quello piu' vicino (entro SPREAD px in
// piu') si sceglie il posto piu' comodo: piu' vicino, e senza dover girare
// attorno al bersaglio. Se il posto e' dall'altra parte del bersaglio si
// segue un percorso locale (route: celle da 16 px attorno all'unita', con le
// altre unita' e gli edifici come ostacoli) invece di spingere contro chi
// sta gia' combattendo. Chi non si
// avvicina al proprio posto per STUCK passi prova un altro settore (un
// percorso alternativo). Se non c'e' nessun posto si va al centro del
// bersaglio, come prima.

import { pointDirection, pointDistance, lengthdirX, lengthdirY } from "./gm.js";

const GAP = 4, SEP = 45, STUCK = 40, SPREAD = 160, MAXC = 4;

// I settori presi in questo passo: bersaglio -> [angoli]. Si azzerano a ogni
// passo; chi ha gia' un posto lo ritrova per primo (preferisce il proprio
// angolo), quindi i posti restano stabili.
function claims(w) {
  if (w._meleeStep !== w._stepNo) { w._meleeStep = w._stepNo; w._meleeClaims = new Map(); }
  return w._meleeClaims;
}

const angDiff = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);

function centre(w, o) {
  const b = w.bbox(o);
  return b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : [o.x, o.y];
}

// Il punto in cui mettere l'origine di `i` perche' la sua maschera stia a
// GAP px da quella di `t`, nella direzione `ang` (gradi, come GameMaker)
// dal centro di `t`; `extra` px piu' in fuori.
function slotPoint(w, i, t, ang, extra = 0) {
  const a = w.bbox(i), b = w.bbox(t);
  if (!a || !b) return [t.x + lengthdirX(40 + extra, ang), t.y + lengthdirY(40 + extra, ang)];
  const ux = lengthdirX(1, ang), uy = lengthdirY(1, ang);
  const sw = (a[2] - a[0] + b[2] - b[0]) / 2 + GAP, sh = (a[3] - a[1] + b[3] - b[1]) / 2 + GAP;
  const s = Math.min(Math.abs(ux) > 1e-3 ? sw / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-3 ? sh / Math.abs(uy) : Infinity) + extra;
  const [tcx, tcy] = centre(w, t);
  const ocx = (a[0] + a[2]) / 2 - i.x, ocy = (a[1] + a[3]) / 2 - i.y; // centro della maschera rispetto all'origine
  return [Math.round(tcx + ux * s - ocx), Math.round(tcy + uy * s - ocy)];
}

// Il primo settore libero attorno a `t` partendo da `pref` e alternando i
// lati: { ang, x, y } o null. Non prende il settore. In ogni settore si
// prova a ciascuna distanza in piu' di `extras` (in mischia solo a
// contatto).
function freeSlot(w, i, t, pref, taken, sep = SEP, extras = [0]) {
  for (let k = 0; k < 360 / sep; k++) {
    for (const s of k === 0 ? [1] : [1, -1]) {
      const ang = (pref + s * k * sep + 360) % 360;
      if (taken && taken.some((a) => angDiff(a, ang) < sep - 1)) continue;
      for (const extra of extras) {
        const [x, y] = slotPoint(w, i, t, ang, extra);
        const o = w.instancePlace(i, x, y, null, true);
        if (o && o !== t) continue;
        return { ang, x, y };
      }
    }
  }
  return null;
}

// [Richiesta dell'autore] Posti per dare fuoco a un edificio: il fuoco
// parte entro 70 px, quindi non serve il contatto; settori piu' fitti e,
// se il posto vicino e' occupato (alberi, altri edifici), piu' in fuori.
export const FIRE = { sep: 30, extras: [12, 32, 52] };

// Costo di un posto: la strada (dritta, o lungo l'orbita se il posto e'
// dall'altra parte del bersaglio).
function cost(w, i, t, s) {
  const [cx, cy] = centre(w, t);
  const turn = angDiff(pointDirection(cx, cy, i.x, i.y), s.ang);
  return pointDistance(i.x, i.y, s.x, s.y) + (turn > 60 ? (turn / 180) * Math.PI * 60 : 0);
}

// Dove andare per colpire: un posto attorno a `t` o, se `others` e'
// vero, attorno a un nemico della famiglia `fam` vicino a `t`. Da chiamare a
// ogni passo dell'inseguimento. Restituisce il punto verso cui muoversi
// (il posto, un punto dell'orbita per arrivarci, o il centro di `t`).
export function meleeSpot(w, i, t, fam = null, ring = null) {
  if (!t) return null;
  const go = goTo(w, i, t, fam, ring || { sep: SEP, extras: [0] });
  i.meleeGo = go;
  return go;
}

function goTo(w, i, t, fam, ring) {
  const all = claims(w);
  const takenOf = (o) => all.get(o) || [];
  const claim = (o, ang) => { const l = all.get(o); if (l) l.push(ang); else all.set(o, [ang]); };
  // gia' a contatto con il bersaglio: resta dov'e' (il colpo parte a 10 px;
  // solo in mischia)
  const [tcx, tcy] = centre(w, t);
  if (ring.extras[0] === 0 && w.distanceToInstance(i, t) < GAP + 2) {
    claim(t, pointDirection(tcx, tcy, i.x, i.y));
    i.meleeT = t.id; i.meleeSpot = [i.x, i.y];
    return [i.x, i.y];
  }
  // bloccato: non si avvicina al posto da STUCK passi -> un altro settore
  let skip = null;
  if (i.meleeSpot && i.meleeT !== undefined) {
    const d = pointDistance(i.x, i.y, i.meleeSpot[0], i.meleeSpot[1]);
    if (i.meleeBest === undefined || d < i.meleeBest - 2) { i.meleeBest = d; i.meleeN = 0; }
    else if (++i.meleeN >= STUCK) { skip = [i.meleeT, i.meleeAng]; i.meleeN = 0; i.meleeBest = undefined; }
  }
  // candidati: il bersaglio e, se si puo', i nemici vicini a lui
  const cands = [t];
  if (fam) {
    const lim = w.distanceToInstance(i, t) + SPREAD;
    const near = [];
    for (const o of w.all(fam)) {
      if (o === t || !o.alive || o.visible === false) continue;
      const d = w.distanceToInstance(i, o);
      if (d < lim) near.push([d, o]);
    }
    near.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < near.length && cands.length < MAXC; k++) cands.push(near[k][1]);
  }
  let best = null, bc = Infinity, bt = null;
  for (const o of cands) {
    const [ocx, ocy] = centre(w, o);
    const mine = i.meleeT === o.id && i.meleeAng !== undefined;
    let pref = mine ? i.meleeAng : pointDirection(ocx, ocy, i.x, i.y);
    const taken = takenOf(o).slice();
    if (skip && skip[0] === o.id && skip[1] !== undefined) taken.push(skip[1]);
    const s = freeSlot(w, i, o, pref, taken, ring.sep, ring.extras);
    if (!s) continue;
    // chi ha gia' un posto lo tiene, a meno di uno molto migliore
    const c = cost(w, i, o, s) - (mine && s.ang === i.meleeAng ? 40 : 0);
    if (c < bc) { bc = c; best = s; bt = o; }
  }
  if (!best) {
    i.meleeT = t.id; i.meleeAng = undefined; i.meleeSpot = null;
    return [t.x, t.y];
  }
  claim(bt, best.ang);
  if (i.meleeT !== bt.id || i.meleeAng !== best.ang) { i.meleeBest = undefined; i.meleeN = 0; }
  i.meleeT = bt.id; i.meleeAng = best.ang; i.meleeSpot = [best.x, best.y];
  // la strada per il posto: dritta se e' libera, se no lungo un percorso
  // locale che aggira chi sta gia' combattendo (route)
  return route(w, i, best.x, best.y) || [best.x, best.y];
}

// ------------------------------------------------------- percorso locale

const CELL = 16, R = 16, N = 2 * R + 1, EVERY = 8;
const blocked = new Uint8Array(N * N), dist = new Int16Array(N * N), queue = new Int16Array(N * N);
const DX = [1, -1, 0, 0, 1, -1, 1, -1], DY = [0, 0, -1, 1, -1, -1, 1, 1];

// Il prossimo punto di passaggio da (i.x, i.y) a (tx, ty) su una griglia
// locale di N x N celle da CELL px centrata a meta' strada: ostacoli sono le
// istanze solide vicine (unita', edifici, alberi: quelle che ferma
// mp_potential_step; la maschera dell'unita' non deve toccarle, quindi si
// allargano della sua maschera). Ricerca in ampiezza dalla meta, poi dal punto di
// partenza si scende e si prende la cella piu' lontana vista in linea
// retta. null se la strada dritta e' libera, se la meta e' troppo lontana o
// se non c'e' strada. Ricalcolata ogni EVERY passi (o se la meta cambia).
function route(w, i, tx, ty) {
  const memo = i.meleeRoute;
  if (memo && w._stepNo - memo.at < EVERY && Math.abs(memo.tx - tx) < 12 && Math.abs(memo.ty - ty) < 12) {
    if (!memo.wp || pointDistance(i.x, i.y, memo.wp[0], memo.wp[1]) > 12) return memo.wp;
  }
  i.meleeRoute = { at: w._stepNo, tx, ty, wp: null };
  if (pointDistance(i.x, i.y, tx, ty) > (R - 2) * CELL * 1.4) return null;
  const a = w.bbox(i);
  if (!a) return null;
  const l = a[0] - i.x, r = a[2] - i.x, t = a[1] - i.y, b = a[3] - i.y;
  const ox = Math.round((i.x + tx) / 2) - R * CELL, oy = Math.round((i.y + ty) / 2) - R * CELL;
  blocked.fill(0);
  const markRect = (x0, y0, x1, y1) => { // origini proibite: (x0, x1) x (y0, y1), estremi esclusi
    const c0 = Math.max(0, Math.ceil((x0 - ox) / CELL - 0.5)), c1 = Math.min(N - 1, Math.floor((x1 - ox) / CELL - 0.5));
    const r0 = Math.max(0, Math.ceil((y0 - oy) / CELL - 0.5)), r1 = Math.min(N - 1, Math.floor((y1 - oy) / CELL - 0.5));
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) blocked[y * N + x] = 1;
  };
  for (const o of w._nearList([ox - 64, oy - 64, ox + N * CELL + 64, oy + N * CELL + 64])) {
    if (o === i || !o.alive || !o.solid) continue;
    const ob = w.bbox(o);
    if (ob) markRect(ob[0] - r, ob[1] - b, ob[2] - l, ob[3] - t);
  }
  const cellOf = (x, y) => [Math.floor((x - ox) / CELL), Math.floor((y - oy) / CELL)];
  const [sx, sy] = cellOf(i.x, i.y), [gx, gy] = cellOf(tx, ty);
  if (sx < 0 || sy < 0 || sx >= N || sy >= N || gx < 0 || gy < 0 || gx >= N || gy >= N) return null;
  const S = sy * N + sx, G = gy * N + gx;
  blocked[S] = 0; blocked[G] = 0;
  // linea dritta libera: niente percorso
  const clear = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
    for (let k = 1; k < n; k++) {
      const [cx, cy] = cellOf(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n);
      if (cx < 0 || cy < 0 || cx >= N || cy >= N || blocked[cy * N + cx]) return false;
    }
    return true;
  };
  if (clear(i.x, i.y, tx, ty)) return null;
  dist.fill(-1);
  let head = 0, tail = 0;
  dist[G] = 0; queue[tail++] = G;
  while (head < tail && dist[S] === -1) {
    const k = queue[head++], x = k % N, y = (k - x) / N;
    for (let d = 0; d < 8; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const n = ny * N + nx;
      if (dist[n] !== -1 || blocked[n]) continue;
      if (d >= 4 && (blocked[y * N + nx] || blocked[ny * N + x])) continue;
      dist[n] = dist[k] + 1; queue[tail++] = n;
    }
  }
  if (dist[S] === -1) return null;
  // in discesa dal punto di partenza; il punto piu' lontano visto dritto
  let k = S, wp = null;
  for (let s = 0; s < 12 && dist[k] > 0; s++) {
    const x = k % N, y = (k - x) / N;
    let nk = -1;
    for (let d = 0; d < 8; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const n = ny * N + nx;
      if (dist[n] === -1 || dist[n] >= dist[k]) continue;
      if (d >= 4 && (blocked[y * N + nx] || blocked[ny * N + x])) continue;
      if (nk === -1 || dist[n] < dist[nk]) nk = n;
    }
    if (nk === -1) break;
    k = nk;
    const cx = ox + (k % N) * CELL + CELL / 2, cy = oy + Math.floor(k / N) * CELL + CELL / 2;
    if (k === G) { wp = [tx, ty]; break; }
    if (!wp || clear(i.x, i.y, cx, cy)) wp = [cx, cy];
    else break;
  }
  i.meleeRoute.wp = wp;
  return wp;
}
