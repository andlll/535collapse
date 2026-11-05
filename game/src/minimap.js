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
// - edifici e unita' con le loro icone (le icone dell'interfaccia, bianche:
//   mm_* da tools/05_atlas.py), del colore della parte: rosso caldo i tuoi,
//   blu i nemici. Gli edifici larghi quanto la loro impronta (la maschera)
//   in scala, fra BUILD_PX px; le unita' tutte MM.unit px. I cantieri piu'
//   trasparenti, le torri chiuse del livello 6 grigie; mura e porte linee.

import { waterMap } from "./effects.js";
import { makeColourRgb } from "./colours.js";

export const MM = {
  ally: makeColourRgb(226, 74, 46),    // rosso caldo (prima c_red, 255, 0, 0)
  enemy: makeColourRgb(46, 112, 232),
  grey: makeColourRgb(130, 130, 130),
  water: makeColourRgb(120, 182, 226), waterAlpha: 0.8,
  tree: makeColourRgb(112, 146, 104), treeAlpha: 0.6,
  rock: makeColourRgb(128, 118, 104), snow: makeColourRgb(238, 238, 232),
  unit: 7,                              // px, le icone delle unita'
  build: [7, 22],                       // px, le icone degli edifici (min, max)
  site: 0.45,                           // alpha dei cantieri
  // [§9.109] le montagne: spente in attesa dello sprite dell'autore (la
  // catena di cime provata non lo convinceva); drawMountains sa gia' dove e
  // quanto e' grande il disegno di ogni montagna (il trim dello sprite)
  mountains: false,
};

// nome dell'oggetto -> icona (mm_<nome>)
const ICONS = [
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

// le corse d'acqua per la scala sz: [x, y, lunghezza] in px della minimappa
const WATER = new WeakMap();
function waterRuns(w, sz) {
  let c = WATER.get(w);
  if (c && c.sz === sz) return c.runs;
  const wm = waterMap(w), runs = [];
  if (wm) {
    const mw = Math.ceil(w.roomW / sz), mh = Math.ceil(w.roomH / sz), px = new Uint8Array(mw * mh);
    for (let cy = 0; cy < wm.gh; cy++) {
      const y = Math.min(mh - 1, Math.floor((cy + 0.5) * wm.C / sz));
      for (let cx = 0; cx < wm.gw; cx++) if (wm.grid[cy * wm.gw + cx]) px[y * mw + Math.min(mw - 1, Math.floor((cx + 0.5) * wm.C / sz))]++;
    }
    // un pixel e' acqua se lo e' almeno un terzo delle sue celle
    const need = Math.max(1, Math.round((sz / wm.C) * (sz / wm.C) / 3));
    for (let y = 0; y < mh; y++) {
      let x0 = -1;
      for (let x = 0; x <= mw; x++) {
        const on = x < mw && px[y * mw + x] >= need;
        if (on && x0 < 0) x0 = x;
        if (!on && x0 >= 0) { runs.push([x0, y, x - x0]); x0 = -1; }
      }
    }
  }
  WATER.set(w, (c = { sz, runs }));
  return runs;
}

export function drawWater(d, w, ox, oy, sz) {
  const runs = waterRuns(w, sz);
  if (!runs.length) return;
  d.setAlpha(MM.waterAlpha);
  d.setColour(MM.water);
  for (const [x, y, n] of runs) d.rectangle(ox + x, oy + y, ox + x + n - 1, oy + y, false); // (rectangle comprende l'ultimo pixel [I])
  d.setAlpha(1);
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
export function drawIcon(d, w, i, x, y, sz, colour) {
  const spr = mmIcon(i.object);
  if (!spr) return false;
  let px = MM.unit;
  const unit = w.is(i, "ally_unit") || w.is(i, "enemy_unit");
  if (!unit) {
    const b = w.bbox(i);
    px = Math.max(MM.build[0], Math.min(MM.build[1], b ? (b[2] - b[0]) / sz : MM.build[0]));
  }
  const s = px / 32; // MM_SIDE in tools/05_atlas.py
  d.setAlpha(1);
  d.spriteExt(spr, 0, x, y, s, s, 0, colour, isSite(i.object) ? MM.site : 1);
  return true;
}
