// [§9.147, richiesta dell'autore] L'ultimo tratto: da vicino alla meta
// (LM_RANGE px) fino all'arrivo, un solo modo di muoversi.
//
// Prima, vicino alla meta, un'unita' passava fra quattro modi con regole di
// collisione diverse: il flow field (senza collisioni, verso la cella del
// capo, non verso la propria casella), il fondo del campo (separazione senza
// collisioni), il passo dritto (mp_potential_step, tutte le collisioni) e
// stepOver (sopra i compagni). Le soglie che sceglievano il modo (400 px,
// "sovrapposto", "in vista") la facevano oscillare fra modi che tiravano in
// direzioni diverse (STUDIO.md §9.146).
//
// Qui: un campo piccolo e fine (celle da LM_CELL px, una finestra attorno
// all'unita' e alla meta) verso la meta dell'unita', con i costi:
// - ostacoli fissi (edifici, alberi, mura, acqua, le porte secondo la parte):
//   chiusi, guardando la maschera vera dell'unita' messa al centro della
//   cella (cache per forma della maschera, rifatta quando cambiano gli
//   ostacoli: Pathing.solidVer);
// - unita' dell'altra parte: chiuse;
// - unita' della propria parte: si passa, ma costa un po' (di piu' se sono
//   ferme o combattono), cosi' le si gira attorno quando il giro e' corto.
// Il campo (Dijkstra dalla meta) si rifa' ogni LM_RECALC passi, quando la
// meta cambia cella o quando il passo e' bloccato. L'unita' punta al punto
// piu' lontano del percorso (fino a LM_LOOK celle) che vede in linea retta e
// fa un passo con le collisioni vere (sopra i compagni si passa); passo
// chiuso: uno scarto fino a 75 gradi senza invertire la marcia, se no ferma.
//
// Chi lo usa: gli ordini di movimento e chi va a dare fuoco (fanti, cavalieri,
// arcieri: units.js, ranged.js), i nemici che non inseguono un alleato
// (enemies.js), le macchine d'assedio (pathing.js siegeMove), lo spostamento
// semplice dei civili (civilians.js). Non la mischia: provato (le due parti
// col campo fine) faceva piu' inversioni e i nemici si accavallavano; li'
// restano i posti attorno al bersaglio (melee.js), il passo dritto e
// stepOver. Ne' i posti di lavoro dei civili (risorse, cantieri, depositi).
import { pointDirection, lengthdirX, lengthdirY, pointDistance } from "./gm.js";

export const LM_RANGE = 400;
const C = 16, MARGIN = 10, MAXC = 72, LM_RECALC = 10, LM_LOOK = 8;
const FACE_HYST = 10;
// costi per cella dei compagni (10 = una cella di strada): una sagoma e'
// larga ~5 celle, quindi passare sopra un compagno fermo costa come ~4
// celle di giro, sopra uno in cammino ~1. Con 40 per cella si facevano giri
// di centinaia di px attorno alla formazione (settle.mjs)
const SOFT_MOVING = 2, SOFT_STILL = 8, SOFT_MAX = 16;
const INF = 0x3fffffff;
const side = (i) => ((i.parents || []).includes("enemy_unit") ? "enemy_unit" : "ally_unit");

// ---------------------------------------------------------- ostacoli fissi
// Per ogni forma di maschera (scostamenti del bbox dall'origine) e parte, una
// griglia da C px di tutta la room: 0 da calcolare, 1 libera, 2 chiusa.
function staticGrid(w, p, i, sd, bb) {
  let S = w._lmStatic;
  if (!S || S.ver !== p.solidVer) S = w._lmStatic = { ver: p.solidVer, maps: new Map(), gw: Math.ceil((p.gw * 32) / C), gh: Math.ceil((p.gh * 32) / C) };
  const key = sd + "|" + Math.round(bb[0] - i.x) + "," + Math.round(bb[1] - i.y) + "," + Math.round(bb[2] - i.x) + "," + Math.round(bb[3] - i.y);
  let g = S.maps.get(key);
  if (!g) { g = new Uint8Array(S.gw * S.gh); S.maps.set(key, g); }
  return g;
}
function staticBlocked(w, p, i, enemy, cx, cy) {
  const x = cx * C + C / 2, y = cy * C + C / 2;
  const gx = Math.floor(x / 32), gy = Math.floor(y / 32);
  if (!p.inside(gx, gy)) return true;
  const k = gy * p.gw + gx;
  // le porte (§3.8, §9.75): quelle del giocatore chiuse per i nemici, quelle
  // dei nemici chiuse per il giocatore e aperte per i nemici
  if (enemy ? p.enemyBlock[k] : p.enemyPass[k]) return true;
  if (enemy && p.enemyPass[k]) return false;
  if (w.terrainBlocks && w.terrainBlocks(i, x, y)) return true;
  const bb = w.bbox(i, x, y);
  if (!bb) return false;
  return !!w._eachNear(bb, (o) => (o !== i && o.alive && o.solid && !w.is(o, "ally_unit") && !w.is(o, "enemy_unit")
    && w.overlap(i, x, y, o) ? o : null));
}

// ---------------------------------------------------------- campo locale
let heapK = new Int32Array(4096), heapV = new Int32Array(4096), heapN = 0;
function hpush(k, v) {
  if (heapN >= heapK.length) {
    const nk = new Int32Array(heapK.length * 2); nk.set(heapK); heapK = nk;
    const nv = new Int32Array(heapV.length * 2); nv.set(heapV); heapV = nv;
  }
  let n = heapN++;
  while (n > 0) {
    const pa = (n - 1) >> 1;
    if (heapK[pa] <= k) break;
    heapK[n] = heapK[pa]; heapV[n] = heapV[pa]; n = pa;
  }
  heapK[n] = k; heapV[n] = v;
}
function hpop() {
  const v = heapV[0], last = --heapN;
  if (last > 0) {
    const k = heapK[last], lv = heapV[last];
    let n = 0;
    for (;;) {
      let c = 2 * n + 1;
      if (c >= last) break;
      if (c + 1 < last && heapK[c + 1] < heapK[c]) c++;
      if (heapK[c] >= k) break;
      heapK[n] = heapK[c]; heapV[n] = heapV[c]; n = c;
    }
    heapK[n] = k; heapV[n] = lv;
  }
  return v;
}
const NX = [1, -1, 0, 0, 1, -1, 1, -1], NY = [0, 0, 1, -1, 1, 1, -1, -1], NC = [10, 10, 10, 10, 14, 14, 14, 14];

function build(w, p, i, xg, yg) {
  const bb = w.bbox(i);
  if (!bb) return null;
  const sd = side(i), enemy = sd === "enemy_unit";
  const ol = bb[0] - i.x, ot = bb[1] - i.y, or = bb[2] - i.x, ob = bb[3] - i.y;
  const S = staticGrid(w, p, i, sd, bb), SG = w._lmStatic;
  const x0 = Math.max(0, Math.floor(Math.min(i.x, xg) / C) - MARGIN), y0 = Math.max(0, Math.floor(Math.min(i.y, yg) / C) - MARGIN);
  const x1 = Math.min(SG.gw - 1, Math.floor(Math.max(i.x, xg) / C) + MARGIN), y1 = Math.min(SG.gh - 1, Math.floor(Math.max(i.y, yg) / C) + MARGIN);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  if (cw > MAXC || ch > MAXC || cw < 1 || ch < 1) return null;
  const n = cw * ch;
  const blocked = new Uint8Array(n), extra = new Uint8Array(n), dist = new Int32Array(n).fill(INF);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    const gk = (y0 + cy) * SG.gw + x0 + cx;
    if (!S[gk]) S[gk] = staticBlocked(w, p, i, enemy, x0 + cx, y0 + cy) ? 2 : 1;
    if (S[gk] === 2) blocked[cy * cw + cx] = 1;
  }
  // le unita': la cella e' toccata se l'unita' messa al suo centro tocca il
  // bbox dell'altra (scatole: un po' piu' larghe delle maschere)
  const box = [x0 * C - 128, y0 * C - 128, (x1 + 1) * C + 128, (y1 + 1) * C + 128];
  w._eachNear(box, (o) => {
    if (o === i || !o.alive || !o.solid) return null;
    const mine = w.is(o, sd), other = !mine && w.is(o, enemy ? "ally_unit" : "enemy_unit");
    if (!mine && !other) return null;
    const ob2 = w.bbox(o);
    if (!ob2) return null;
    const ax = Math.ceil((ob2[0] - or + 2) / C - 0.5) - x0, bx = Math.floor((ob2[2] - ol - 2) / C - 0.5) - x0;
    const ay = Math.ceil((ob2[1] - ob + 2) / C - 0.5) - y0, by = Math.floor((ob2[3] - ot - 2) / C - 0.5) - y0;
    const cost = other ? 0 : o.action === 1 ? SOFT_MOVING : SOFT_STILL;
    for (let cy = Math.max(0, ay); cy <= Math.min(ch - 1, by); cy++) for (let cx = Math.max(0, ax); cx <= Math.min(cw - 1, bx); cx++) {
      const k = cy * cw + cx;
      if (other) blocked[k] = 1;
      else extra[k] = Math.min(SOFT_MAX, extra[k] + cost);
    }
    return null;
  });
  // la meta: la sua cella o, se chiusa, le libere piu' vicine (fino a 4 celle)
  const gcx = Math.floor(xg / C) - x0, gcy = Math.floor(yg / C) - y0;
  heapN = 0;
  let near = false;
  if (!blocked[gcy * cw + gcx]) { dist[gcy * cw + gcx] = 0; hpush(0, gcy * cw + gcx); }
  else {
    near = true;
    for (let r = 1; r <= 4 && heapN === 0; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const cx = gcx + dx, cy = gcy + dy;
        if (cx < 0 || cy < 0 || cx >= cw || cy >= ch || blocked[cy * cw + cx]) continue;
        const d0 = r * 10;
        dist[cy * cw + cx] = d0; hpush(d0, cy * cw + cx);
      }
    }
    if (heapN === 0) return null;
  }
  while (heapN > 0) {
    const k = hpop(), d = dist[k];
    const cx = k % cw, cy = (k - cx) / cw;
    for (let j = 0; j < 8; j++) {
      const nx = cx + NX[j], ny = cy + NY[j];
      if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
      const nk = ny * cw + nx;
      if (blocked[nk]) continue;
      if (j >= 4 && (blocked[cy * cw + nx] || blocked[ny * cw + cx])) continue; // niente angoli tagliati
      const nd = d + NC[j] + extra[nk];
      if (nd < dist[nk]) { dist[nk] = nd; hpush(nd, nk); }
    }
  }
  return { x0, y0, cw, ch, blocked, extra, dist, xg, yg, gcx, gcy, near, at: w._stepNo, ver: p.solidVer };
}

// la cella (assoluta) del punto, nella finestra; -1 fuori
const cellOf = (F, x, y) => {
  const cx = Math.floor(x / C) - F.x0, cy = Math.floor(y / C) - F.y0;
  return cx < 0 || cy < 0 || cx >= F.cw || cy >= F.ch ? -1 : cy * F.cw + cx;
};
// in linea retta da (ax, ay) a (bx, by) solo celle aperte
function clear(F, ax, ay, bx, by) {
  const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(len / 6));
  for (let k = 1; k <= n; k++) {
    const c = cellOf(F, ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n);
    if (c < 0 || F.blocked[c] || F.dist[c] >= INF) return false;
  }
  return true;
}

// ---------------------------------------------------------- il passo
// i solidi (non della parte di `i`) che `i` toccherebbe in (x, y); l'acqua
// conta come uno solo ("terrain")
function blockers(w, i, x, y, sd) {
  const out = [];
  if (w.terrainBlocks && w.terrainBlocks(i, x, y)) out.push("terrain");
  const bb = w.bbox(i, x, y);
  if (!bb) return out;
  w._eachNear(bb, (o) => { if (o !== i && o.alive && o.solid && !w.is(o, sd) && w.overlap(i, x, y, o)) out.push(o); return null; });
  return out;
}

// Un passo di `i` verso (xg, yg). "arrived": e' sulla meta; "moved"; "wait":
// fermo (bloccato o meta occupata); "fail": la meta non si raggiunge nella
// finestra (o e' troppo lontana): chi chiama usa il modo di prima.
export function lastMile(w, p, i, xg, yg) {
  const step = i.autospeed;
  if (!(step > 0)) return "wait";
  const sd = side(i);
  // gia' sovrapposti a un ostacolo o a un nemico (appena usciti da un
  // edificio, spinti): un passo va se non tocca niente di nuovo oltre a quello
  // che si tocca gia' (cosi' se ne esce seguendo il campo)
  const here = blockers(w, i, i.x, i.y, sd);
  const free = here.length === 0 ? (x, y) => w.placeFreeExcept(i, x, y, sd)
    : (x, y) => blockers(w, i, x, y, sd).every((o) => here.includes(o));
  if (pointDistance(i.x, i.y, xg, yg) <= step) {
    if (free(xg, yg)) { w.setPos(i, xg, yg); return "arrived"; }
    return "wait";
  }
  let F = i.lmc;
  if (!F || F.ver !== p.solidVer || w._stepNo - F.at >= LM_RECALC || F.dirty
      || Math.floor(F.xg / C) !== Math.floor(xg / C) || Math.floor(F.yg / C) !== Math.floor(yg / C)) {
    F = i.lmc = build(w, p, i, xg, yg);
    if (!F) return "fail";
  }
  F.xg = xg; F.yg = yg;
  let c = cellOf(F, i.x, i.y);
  if (c < 0) { i.lmc = null; return "fail"; }
  // la cella dell'unita' chiusa o fuori dal campo (sovrapposta a qualcosa,
  // o la maschera tocca un ostacolo al centro della cella): la vicina migliore
  if (F.dist[c] >= INF) {
    let best = -1;
    const cx = c % F.cw, cy = (c - cx) / F.cw;
    for (let r = 1; r <= 5 && best < 0; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= F.cw || ny >= F.ch) continue;
      const k = ny * F.cw + nx;
      if (F.dist[k] < INF && (best < 0 || F.dist[k] < F.dist[best])) best = k;
    }
    if (best < 0) { i.lmc = null; return "fail"; }
    c = best;
  }
  // il percorso: le celle in discesa fino a LM_LOOK; si punta alla piu'
  // lontana che si vede (la meta stessa, se si vede)
  const chain = [c];
  let cur = c;
  for (let s = 0; s < LM_LOOK && F.dist[cur] > 0; s++) {
    const cx = cur % F.cw, cy = (cur - cx) / F.cw;
    let nb = -1;
    for (let j = 0; j < 8; j++) {
      const nx = cx + NX[j], ny = cy + NY[j];
      if (nx < 0 || ny < 0 || nx >= F.cw || ny >= F.ch) continue;
      const k = ny * F.cw + nx;
      if (F.dist[k] < F.dist[nb < 0 ? cur : nb]) nb = k;
    }
    if (nb < 0) break;
    chain.push(nb); cur = nb;
  }
  let ax = null, ay = null;
  const atGoal = F.dist[cur] === 0 && !F.near;
  if (atGoal && clear(F, i.x, i.y, xg, yg)) { ax = xg; ay = yg; }
  else {
    for (let s = chain.length - 1; s >= 1; s--) {
      const k = chain[s], cx = k % F.cw, cy = (k - cx) / F.cw;
      const px = (F.x0 + cx) * C + C / 2, py = (F.y0 + cy) * C + C / 2;
      if (s === 1 || clear(F, i.x, i.y, px, py)) { ax = px; ay = py; break; }
    }
  }
  if (ax === null) {
    // gia' nella cella in fondo: verso la meta
    ax = xg; ay = yg;
  }
  const want = pointDirection(i.x, i.y, ax, ay);
  const len = Math.min(step, pointDistance(i.x, i.y, ax, ay));
  if (len < 0.5) return "wait";
  const last = i.lmDirAt >= w._stepNo - 3 ? i.lmDir : null;
  const turnOk = (a) => last === null || Math.abs(((a - last) % 360 + 540) % 360 - 180) <= 90;
  const sideP = i.lmSide || 1;
  for (const off of [0, 15 * sideP, -15 * sideP, 30 * sideP, -30 * sideP, 45 * sideP, -45 * sideP, 60 * sideP, -60 * sideP, 75 * sideP, -75 * sideP]) {
    const a = want + off;
    if (off && !turnOk(a)) continue;
    const nx = i.x + lengthdirX(len, a), ny = i.y + lengthdirY(len, a);
    if (!free(nx, ny)) continue;
    if (off) { i.lmSide = Math.sign(off); F.dirty = true; }
    // la faccia (8 settori da 45 gradi, units.js phaseOf) cambia solo se
    // la direzione esce dal settore di oltre FACE_HYST gradi: girando di
    // pochi gradi al passo sul confine lo sprite saltava avanti e indietro
    const nd = ((a % 360) + 360) % 360, sc = Math.round(i.direction / 45) * 45;
    if (Math.abs(((nd - sc) % 360 + 540) % 360 - 180) > 22.5 + FACE_HYST) i.direction = nd;
    i.lmDir = a; i.lmDirAt = w._stepNo;
    w.setPos(i, nx, ny);
    return "moved";
  }
  F.dirty = true;
  return "wait";
}

// Per chi chiama: l'ultimo tratto se si puo' (vicino alla meta, `range` px,
// e non appena fallito), se no false e chi chiama fa come prima. Fallito
// (meta non raggiungibile nella finestra), per LM_OFF passi il modo di prima.
const LM_OFF = 30, LM_STUCK = 15;
// Chi e' gia' nell'ultimo tratto ci resta fino a LM_HYST px oltre la soglia:
// al confine il flow field comune (verso la cella del capo) e l'ultimo tratto
// (verso la propria casella) tiravano da parti opposte, un passo per uno.
const LM_HYST = 150;
export const lmReady = (w, i, x, y, range = LM_RANGE) => (i.lmOff || 0) <= w._stepNo
  && pointDistance(i.x, i.y, x, y) <= range + ((i.lmAt || -9) >= w._stepNo - 2 ? LM_HYST : 0);
export function lmStep(w, p, i, x, y, range = LM_RANGE) {
  if (!lmReady(w, i, x, y, range)) return false;
  let r = lastMile(w, p, i, x, y);
  // bloccato LM_STUCK passi di fila (il campo fine e le collisioni vere non
  // coincidono sempre: gli spigoli degli edifici): il modo di prima
  i.lmWaitN = r === "wait" ? (i.lmWaitN || 0) + 1 : 0;
  if (i.lmWaitN >= LM_STUCK) { i.lmWaitN = 0; r = "fail"; }
  if (r === "fail") { i.lmOff = w._stepNo + LM_OFF; i.lmc = null; return false; }
  i.lmAt = w._stepNo;
  return r;
}
