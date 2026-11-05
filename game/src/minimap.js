// [§9.109, richieste dell'autore] La minimappa ridisegnata (manager.js
// drawMinimap la usa). Il fondo resta quello dell'originale, trasparente
// (decisione dell'autore: piu' coprente prenderebbe troppo spazio); sopra:
// - l'acqua dei fiumi in azzurro, larga quanto il fiume (dalla mappa
//   dell'acqua della room, effects.js waterMap: fiumi dipinti e a linee,
//   senza le parti coperte dai ponti), a corse orizzontali di pixel della
//   minimappa, rifatte solo se cambia la scala;
// - le montagne con un simbolo: una catena di cime piccole, la neve sulle
//   piu' alte, grande quanto lo sprite e dentro la minimappa;
// - gli alberi come prima (triangoli), di un verde piu' tenue e meno saturo;
// - gli edifici con le loro icone (le icone dell'interfaccia, bianche: mm_*
//   da tools/05_atlas.py), del colore della parte: marroni i tuoi, blu i
//   nemici, larghi quanto la loro impronta (la maschera) in scala, fra
//   MM.build px; i cantieri piu' trasparenti, le torri chiuse del livello 6
//   grigie; mura e porte linee. Le unita' puntini (§9.110: le icone in
//   gruppo facevano una macchia);
// - [§9.110] acqua e parte scoperta coi bordi sfumati; col puntatore sopra
//   piu' opaca solo la parte scoperta (la nebbia di guerra).

import { waterMap } from "./effects.js";
import { makeColourRgb } from "./colours.js";

export const MM = {
  // [§9.110, richiesta dell'autore] i tuoi marroni (in §9.109 rosso caldo
  // 226, 74, 46; nell'originale c_red): gli allarmi sono arancioni
  ally: makeColourRgb(124, 72, 36),
  enemy: makeColourRgb(46, 112, 232),
  grey: makeColourRgb(130, 130, 130),
  water: makeColourRgb(120, 182, 226), waterAlpha: 0.8,
  tree: makeColourRgb(112, 146, 104), treeAlpha: 0.6,
  rock: makeColourRgb(128, 118, 104), snow: makeColourRgb(238, 238, 232),
  unit: 1.7,                            // [§9.110] raggio minimo dei puntini delle unita' (px; 50/sz come l'originale)
  build: [7, 22],                       // px, le icone degli edifici (min, max)
  site: 0.45,                           // alpha dei cantieri
  // [§9.109] le montagne: spente in attesa dello sprite dell'autore (la
  // catena di cime provata non lo convinceva); drawMountains sa gia' dove e
  // quanto e' grande il disegno di ogni montagna (il trim dello sprite)
  mountains: false,
  // [§9.110] col puntatore sopra il fondo piu' opaco (0,69 invece di 0,19)
  // solo sulla parte scoperta dal giocatore: il bianco che manca, sopra il
  // fondo di sempre
  explored: (0.69 - 0.19) / (1 - 0.19),
  // [§9.111] lo stesso col vetro: sopra il fondo gia' tutto sfocato (con
  // meno brina) il bianco che porta la parte scoperta alla chiarezza del
  // vetro a 0,69 (brina 0,3, bianco 0,69 x 0,65: 61% verso il bianco)
  exploredGlass: 0.52,
  hoverTime: 0.3, // s: il passaggio col puntatore (sfocatura e parte scoperta)
  // [§9.113, richiesta dell'autore] la scala (global.sz: px di room per px
  // della minimappa) fra questi limiti (l'originale non ne aveva: col "+"
  // arrivava a 0 e sotto), e lo zoom morbido come quello del mondo (§9.83):
  // la scala disegnata insegue quella scelta di szEase della distanza a passo
  szRange: [12, 60],
  szEase: 0.25,
};
export const clampSz = (s) => Math.max(MM.szRange[0], Math.min(MM.szRange[1], s));

// nome dell'oggetto -> icona (mm_<nome>)
const ICONS = [
  // [§9.110] le risorse (prima delle famiglie: castelloruin non e' un castello)
  [/miniera/, "miniera"], [/pietr/, "stone"], [/ruin/, "ruin"],
  [/omino/, "omino"], [/warrior/, "guerriero"], [/picchiere/, "picchiere"], [/arciere/, "arciere"],
  [/cavaliere/, "cavaliere"], [/catapulta/, "catapulta"], [/ariete/, "ariete"],
  [/casa|house/, "casa"], [/caserma/, "caserma"], [/stalla/, "stalla"], [/castello/, "castello"],
  [/chiesa|monastero/, "chiesa"], [/magazzino/, "magazzino"], [/barn|mulino/, "barn"], [/torre/, "torre"],
  [/centro/, "centro"], [/campo/, "corn"],
];
const iconCache = new Map();
export function mmIcon(obj) {
  let v = iconCache.get(obj);
  if (v === undefined) {
    const m = ICONS.find(([re]) => re.test(obj));
    v = m ? "mm_" + m[1] : null;
    iconCache.set(obj, v);
  }
  return v;
}
export const isWall = (obj) => /^(enemy_)?(mura|porta)_/.test(obj);
const isSite = (obj) => /_fond$|cantiere/.test(obj);

// [§9.110] La copertura di ogni pixel della minimappa (0-1) diventa corse
// orizzontali di pixel con la stessa alpha (a sedicesimi): l'interno pieno
// in poche corse lunghe, i bordi pixel per pixel, sfumati (antialiasing;
// prima l'acqua era piena o vuota, a scalini). La copertura si moltiplica per
// quella degli angoli arrotondati della minimappa (raggio R), cosi' niente
// esce dalla sua forma.
function runsOf(cov, mw, mh, R) {
  const runs = [];
  const corner = (x, y) => {
    const cx = x + 0.5, cy = y + 0.5;
    const qx = cx < R ? R - cx : cx > mw - R ? cx - (mw - R) : 0;
    const qy = cy < R ? R - cy : cy > mh - R ? cy - (mh - R) : 0;
    if (!qx || !qy) return 1;
    return Math.max(0, Math.min(1, R + 0.5 - Math.hypot(qx, qy)));
  };
  for (let y = 0; y < mh; y++) {
    let x0 = 0, a0 = 0;
    for (let x = 0; x <= mw; x++) {
      const a = x < mw ? Math.round(cov[y * mw + x] * corner(x, y) * 16) / 16 : 0;
      if (a !== a0) {
        if (a0 > 0) runs.push([x0, y, x - x0, a0]);
        x0 = x; a0 = a;
      }
    }
  }
  return runs;
}

// k: [§9.113] le corse calcolate alla scala scelta, disegnate durante lo
// zoom morbido ingrandite di k (niente ricalcolo a ogni fotogramma)
function drawRuns(d, runs, ox, oy, col, alpha, k = 1) {
  d.setColour(col);
  for (const [x, y, n, a] of runs) {
    d.setAlpha(alpha * a);
    d.rectangle(ox + x * k, oy + y * k, ox + (x + n) * k - 1, oy + (y + 1) * k - 1, false); // (rectangle comprende l'ultimo pixel [I])
  }
  d.setAlpha(1);
}

// la copertura per pixel della minimappa di una griglia di room (celle da
// C px; value(k) 0-1): la media delle celle col centro nel pixel
function coverage(gw, gh, C, sz, mw, mh, value) {
  const sum = new Float32Array(mw * mh), n = new Uint16Array(mw * mh);
  for (let cy = 0; cy < gh; cy++) {
    const y = Math.min(mh - 1, Math.floor((cy + 0.5) * C / sz));
    for (let cx = 0; cx < gw; cx++) {
      const p = y * mw + Math.min(mw - 1, Math.floor((cx + 0.5) * C / sz));
      sum[p] += value(cy * gw + cx); n[p]++;
    }
  }
  for (let p = 0; p < sum.length; p++) sum[p] = n[p] ? sum[p] / n[p] : 0;
  return sum;
}

const dims = (w, sz) => [Math.ceil(w.roomW / sz), Math.ceil(w.roomH / sz)];

// l'acqua: dalla mappa dell'acqua (fiumi dipinti e a linee), rifatta solo se
// cambiano la scala o il raggio
const WATER = new WeakMap();
// il raggio degli angoli della minimappa alla scala sz (come drawMinimap)
const radiusAt = (w, sz) => Math.min(40, w.roomW / sz / 2, w.roomH / sz / 2);

// sz: la scala disegnata; szT: quella scelta, a cui si calcolano le corse
export function drawWater(d, w, ox, oy, sz, szT = sz) {
  let c = WATER.get(w);
  if (!c || c.sz !== szT) {
    const wm = waterMap(w), [mw, mh] = dims(w, szT);
    const runs = wm ? runsOf(coverage(wm.gw, wm.gh, wm.C, szT, mw, mh, (k) => wm.grid[k]), mw, mh, radiusAt(w, szT)) : [];
    WATER.set(w, (c = { sz: szT, runs }));
  }
  if (c.runs.length) drawRuns(d, c.runs, ox, oy, MM.water, MM.waterAlpha, szT / sz);
}

// [§9.110, proposta dell'autore] la nebbia di guerra sulla minimappa: senza
// puntatore niente cambia; col puntatore sopra diventa piu' opaca solo la
// parte scoperta (fog.explored), rifatta ogni EXPLORED_EVERY passi
const EXPLORED = new WeakMap(), EXPLORED_EVERY = 30;
export function drawExplored(d, w, ox, oy, sz, alpha = MM.explored, szT = sz) {
  const F = w.fog;
  if (!F) return false;
  let c = EXPLORED.get(w);
  if (!c || c.sz !== szT || w._stepNo - c.at >= EXPLORED_EVERY || w._stepNo < c.at) {
    const [mw, mh] = dims(w, szT);
    const runs = runsOf(coverage(F.gw, F.gh, F.cell, szT, mw, mh, (k) => F.explored[k] / 255), mw, mh, radiusAt(w, szT));
    EXPLORED.set(w, (c = { sz: szT, at: w._stepNo, runs }));
  }
  drawRuns(d, c.runs, ox, oy, 0xffffff, alpha, szT / sz);
  return true;
}

// il simbolo di una montagna: una catena di cime piccole (larghe ~PEAK px,
// alte 5-8, la neve sulle piu' alte) che riempie lo sprite in scala, su piu'
// file se e' alto; solo dentro la minimappa (gli sprite delle montagne
// sporgono spesso oltre i bordi della mappa)
const PEAK = 9;
export function drawMountains(d, w, ox, oy, sz) {
  if (!MM.mountains) return;
  const mw = w.roomW / sz, mh = w.roomH / sz;
  for (const i of w.instances) {
    if (!i.alive || !i.object.startsWith("montagna") || !i.sprite_index) continue;
    // il riquadro del disegno (trim), non della tela: le tele delle montagne
    // (fino a 2342 x 1461) sono in gran parte vuote
    const fr = w.assets.frame(i.sprite_index, 0);
    if (!fr) continue;
    const [tx, ty, tw, th] = fr.f.trim, [sx, sy] = [i.image_xscale || 1, i.image_yscale || 1];
    const bx0 = i.x + (tx - fr.s.origin[0]) * sx, by0 = i.y + (ty - fr.s.origin[1]) * sy;
    const x0 = Math.min(bx0, bx0 + tw * sx) / sz, x1 = Math.max(bx0, bx0 + tw * sx) / sz;
    const y0 = Math.min(by0, by0 + th * sy) / sz, y1 = Math.max(by0, by0 + th * sy) / sz;
    const rows = Math.max(1, Math.min(3, Math.round((y1 - y0) / 14)));
    for (let r = 0; r < rows; r++) {
      const base = y0 + (y1 - y0) * (r + 1) / (rows + 0.4), shift = r % 2 ? PEAK / 2 : 0;
      const n = Math.max(1, Math.round((x1 - x0 - shift) / PEAK));
      const step = (x1 - x0 - shift) / n;
      for (let k = 0; k < n; k++) {
        const cx = x0 + shift + step * (k + 0.5);
        if (cx < 4 || cx > mw - 4 || base < 6 || base > mh) continue;
        const tall = (k + r + (i.id % 2)) % 3 === 0, h = tall ? 8 : 5.5, half = PEAK * 0.62;
        const X = ox + cx, Y = oy + base;
        d.setAlpha(0.9);
        d.triangleColour(X - half, Y, X + half, Y, X, Y - h, MM.rock, MM.rock, MM.rock, false);
        if (tall) {
          d.setAlpha(1);
          d.triangleColour(X - half * 0.34, Y - h * 0.66, X + half * 0.34, Y - h * 0.66, X, Y - h, MM.snow, MM.snow, MM.snow, false);
        }
      }
    }
  }
  d.setAlpha(1);
}

// l'icona di un edificio o di un'unita' (false se l'oggetto non ne ha una)
// (gli edifici: le unita' sono puntini, §9.110)
export function drawIcon(d, w, i, x, y, sz, colour) {
  const spr = mmIcon(i.object);
  if (!spr) return false;
  const b = w.bbox(i);
  const px = Math.max(MM.build[0], Math.min(MM.build[1], b ? (b[2] - b[0]) / sz : MM.build[0]));
  const s = px / 32; // MM_SIDE in tools/05_atlas.py
  d.setAlpha(1);
  d.spriteExt(spr, 0, x, y, s, s, 0, colour, isSite(i.object) ? MM.site : 1);
  return true;
}

// [§9.110, richiesta dell'autore] Il riquadro della view: angoli poco
// arrotondati (raggio VIEW_R), ma in un angolo della minimappa quello del
// riquadro segue la curva della minimappa (raggio R, lo stesso centro se
// tocca i due lati), cosi' non ne esce.
const VIEW_R = 5;
export function viewRadii(l, t, r, b, PL, PT, PR, PB, R) {
  const one = (dx, dy) => Math.max(VIEW_R, R - Math.max(dx, dy));
  return [one(l - PL, t - PT), one(PR - r, t - PT), one(PR - r, PB - b), one(l - PL, PB - b)];
}
