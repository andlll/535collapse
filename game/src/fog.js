// Nebbia di guerra e luci della notte: la parte di logica (nessuna chiamata
// WebGL: si prova con node --test). Il disegno e' in fogdraw.js.
//
// L'originale [C, manager Draw_End azione 5] usa tre superfici grandi come
// la room, ridisegnate a ogni fotogramma e applicate con bm_subtract
// (destinazione x (1 - colore della superficie), STUDIO.md §3.1):
// - `fog`: la view riempita di grigio (110,110,110) con ellissi nere attorno
//   a unita' ed edifici alleati: fuori dalla vista attuale il mondo resta al
//   57% (145/255);
// - `blackfog`: bianca all'inizio, mai cancellata, con le stesse ellissi
//   nere (piu' le statue attive di lvl01): cio' che non e' mai stato visto
//   e' nero;
// - `nite`: riempita di merge_colour(c_black, c_orange, global.night), con
//   lo sprite `arealight` (una macchia nera sfumata) sopra ogni fuoco.
// Tutto solo fuori dal menu e con global.fogville=1 (il trucco Ctrl+V+Canc
// spegne nebbia E notte). In match sono ~590 MB di superfici (§0.7).
//
// [Deviazione voluta, §0.7/§0.11] Qui la scoperta e la vista sono due
// griglie di byte a celle da 16 px (in match 438x438 = 190 KB), la vista
// calcolata solo sulle celle della view; il disegno le compone in una
// texture a un canale filtrata linearmente. Ogni cella tiene quanto e'
// coperta (0-255), stimato dalla distanza del suo centro dal bordo
// dell'ellisse: con valori solo 0/1 il filtro lineare lascerebbe una
// scaletta sui bordi lunghi. I bordi sfumano quindi su circa 16 px invece
// di essere netti. La notte usa una superficie piccola grande come la view
// (fogdraw.js).
//
// La scoperta si aggiorna nel passo, non nel disegno come nell'originale
// (che ridisegna blackfog a ogni fotogramma, cioe' a ogni passo a 60 fps):
// e' stato di gioco, servira' ai salvataggi e non deve dipendere dal tetto
// di fps.

import { c, mergeColour } from "./colours.js";

export const FOG_CELL = 16;
// valore da sottrarre (0-255) per cella: vista, gia' vista, mai vista
export const SHADE_VISIBLE = 0;
export const SHADE_FOG = 110;   // make_colour_rgb(110,110,110) [C]
export const SHADE_BLACK = 255; // blackfog bianca: sottrae tutto

// Valore da sottrarre da scoperta e vista (0-255): e' il prodotto delle
// due sottrazioni dell'originale, (1 - fog) x (1 - blackfog).
export function shadeOf(explored, visible) {
  const m = (explored / 255) * (1 - (SHADE_FOG / 255) * (1 - visible / 255));
  return Math.round(255 * (1 - m));
}

// Ellisse di visuale di un'istanza [C, manager Draw_End]: k = 1 - night, di
// giorno la visuale raddoppia. Ogni oggetto e' anche un ally_build (o un
// ally_unit), che ha l'ellisse base; quella specifica la contiene sempre,
// quindi basta la piu' grande. Restituisce [cx, cy, rx, ry].
function shapeOf(w, i, k) {
  const { x, y } = i;
  if (w.is(i, "castello") || w.is(i, "torre")) return [x, y, 500 + 500 * k, 300 + 300 * k];
  if (w.is(i, "centro")) return [x, y, 300 + 300 * k, 180 + 180 * k];
  if (w.is(i, "mura_ori") || w.is(i, "mura_ori_fond") || w.is(i, "porta_ori")) {
    return [x, y, 300 + 200 * k, 120 + 120 * k];
  }
  // mura_vert*, porta_vert: da y-370-120k a y+120+120k
  if (w.is(i, "mura_vert") || w.is(i, "mura_vert_fond") || w.is(i, "porta_vert")) {
    return [x, y - 125, 200 + 200 * k, 245 + 120 * k];
  }
  return [x, y, 200 + 200 * k, 120 + 120 * k];
}

// Le istanze che vedono, nell'ordine dei with(...) dell'originale (l'ordine
// non conta: le ellissi si sommano).
// [Correzioni decise dall'autore, §3.17] n.54: le anteprime dei
// prolungamenti di muro (figlie di ally_build) non vedono; n.55: le statue
// attive danno anche la vista, non solo la scoperta (`explore` resta per
// chiarezza: le fonti sono ora le stesse).
const PREVIEWS = new Set(["oodl", "oosl", "ovbl", "oval"]);
export function fogSources(w, explore, cb) {
  const k = 1 - w.g.night;
  for (const fam of ["ally_unit", "ally_build", "palo_1"]) {
    for (const i of w.all(fam)) if (i.alive && !PREVIEWS.has(i.object)) cb(i, shapeOf(w, i, k));
  }
  for (const n of ["o_statua1", "o_statua2", "o_statua3", "o_statua4"]) {
    for (const i of w.all(n)) if (i.alive && i.attiva === 1) cb(i, shapeOf(w, i, k));
  }
}

// La nebbia e' attiva? [C: if room!=menu && global.fogville=1]
export function fogActive(w) {
  return w.room !== "menu" && w.g.fogville === 1;
}

export class FogMap {
  constructor(roomW, roomH, cell = FOG_CELL) {
    this.cell = cell;
    this.gw = Math.ceil(roomW / cell);
    this.gh = Math.ceil(roomH / cell);
    this.explored = new Uint8Array(this.gw * this.gh); // copertura 0-255 della scoperta
    this.visible = new Uint8Array(this.gw * this.gh);  // copertura della vista attuale (solo nella regione)
    this.shade = new Uint8Array(this.gw * this.gh);    // valore da sottrarre (regione)
  }

  // Copre con l'ellisse le celle del rettangolo [x0,x1) x [y0,y1): ogni
  // cella prende il massimo fra il suo valore e la sua copertura. La
  // copertura e' 0,5 + d/16 limitata a 0..1, con d la distanza (con segno,
  // positiva dentro) del centro della cella dal bordo, stimata al primo
  // ordine: d = (1 - q)·q / |grad q|, q = raggio normalizzato. Le celle
  // dentro l'ellisse ridotta di una cella sono piene senza calcoli.
  stamp(arr, cx, cy, rx, ry, x0 = 0, y0 = 0, x1 = this.gw, y1 = this.gh) {
    if (rx <= 0 || ry <= 0) return;
    const C = this.cell, gw = this.gw;
    const orx = rx + C, ory = ry + C, irx = rx - C, iry = ry - C;
    const rx2 = rx * rx, ry2 = ry * ry;
    const ya = Math.max(y0, Math.floor((cy - ory) / C)), yb = Math.min(y1 - 1, Math.floor((cy + ory) / C));
    for (let gy = ya; gy <= yb; gy++) {
      const py = (gy + 0.5) * C - cy;
      const dyo = py / ory;
      if (dyo * dyo >= 1) continue;
      const hwo = orx * Math.sqrt(1 - dyo * dyo);
      const xa = Math.max(x0, Math.ceil((cx - hwo) / C - 0.5));
      const xb = Math.min(x1 - 1, Math.floor((cx + hwo) / C - 0.5));
      // parte piena
      let ia = xb + 1, ib = xb;
      if (irx > 0 && iry > 0) {
        const dyi = py / iry;
        if (dyi * dyi < 1) {
          const hwi = irx * Math.sqrt(1 - dyi * dyi);
          ia = Math.max(xa, Math.ceil((cx - hwi) / C - 0.5));
          ib = Math.min(xb, Math.floor((cx + hwi) / C - 0.5));
          if (ia <= ib) arr.fill(255, gy * gw + ia, gy * gw + ib + 1);
          else { ia = xb + 1; ib = xb; }
        }
      }
      // bordo
      for (let gx = xa; gx <= xb; gx++) {
        if (gx === ia) { gx = ib; continue; }
        const px = (gx + 0.5) * C - cx;
        const q = Math.sqrt(px * px / rx2 + py * py / ry2);
        let v;
        if (q === 0) v = 255;
        else {
          const gq = Math.sqrt((px / rx2) ** 2 + (py / ry2) ** 2) / q;
          const cov = 0.5 + ((1 - q) / gq) / C;
          v = cov >= 1 ? 255 : cov <= 0 ? 0 : Math.round(cov * 255);
        }
        const k = gy * gw + gx;
        if (v > arr[k]) arr[k] = v;
      }
    }
  }

  // Scoperta (blackfog), a ogni passo. Un'istanza ferma la cui ellisse non
  // e' cresciuta non ha niente di nuovo da scoprire: si salta.
  update(w) {
    if (!fogActive(w)) return;
    fogSources(w, true, (i, [cx, cy, rx, ry]) => {
      const s = i._fogStamp;
      if (s && s[0] === cx && s[1] === cy && rx <= s[2] && ry <= s[3]) return;
      i._fogStamp = [cx, cy, rx, ry];
      this.stamp(this.explored, cx, cy, rx, ry);
    });
  }

  // Celle che coprono il rettangolo di room, con una cella di margine (il
  // filtro lineare legge le vicine). [x0, y0, x1, y1) in celle.
  region(x, y, wd, ht, margin = 1) {
    const C = this.cell;
    return [Math.max(0, Math.floor(x / C) - margin), Math.max(0, Math.floor(y / C) - margin),
            Math.min(this.gw, Math.ceil((x + wd) / C) + margin), Math.min(this.gh, Math.ceil((y + ht) / C) + margin)];
  }

  // fog + blackfog per la regione: vista attuale ricalcolata (solo le
  // ellissi che toccano la regione), poi il valore da sottrarre per cella.
  compose(w, [x0, y0, x1, y1]) {
    const { gw, visible, explored, shade } = this, C = this.cell;
    for (let gy = y0; gy < y1; gy++) visible.fill(0, gy * gw + x0, gy * gw + x1);
    const bx0 = x0 * C, by0 = y0 * C, bx1 = x1 * C, by1 = y1 * C;
    fogSources(w, false, (i, [cx, cy, rx, ry]) => {
      if (cx + rx < bx0 || cx - rx > bx1 || cy + ry < by0 || cy - ry > by1) return;
      this.stamp(visible, cx, cy, rx, ry, x0, y0, x1, y1);
    });
    for (let gy = y0; gy < y1; gy++) {
      for (let k = gy * gw + x0, e = gy * gw + x1; k < e; k++) {
        const ex = explored[k], vi = visible[k];
        shade[k] = ex === 255 ? (vi === 255 ? SHADE_VISIBLE : vi === 0 ? SHADE_FOG : shadeOf(255, vi))
          : ex === 0 ? SHADE_BLACK : shadeOf(ex, vi);
      }
    }
  }

  isExplored(x, y) {
    const gx = Math.floor(x / this.cell), gy = Math.floor(y / this.cell);
    return gx >= 0 && gy >= 0 && gx < this.gw && gy < this.gh && this.explored[gy * this.gw + gx] >= 128;
  }
}

// ---------------------------------------------------------------- notte

// Colore della superficie `nite` [C]: merge_colour(c_black, c_orange,
// global.night). Di notte piena sottrae tutto il rosso, il 63% del verde e
// il 25% del blu: il mondo diventa blu scuro. global.night scende fino a
// -0,005 (manager Alarm_1): sotto 0 vale 0 [I].
export function nightColour(night) {
  return mergeColour(c.black, c.orange, Math.max(0, Math.min(1, night)));
}

// Fuochi che illuminano la notte [C, manager Draw_End, superficie `nite`]:
// [x, y, scala] dello sprite arealight, nell'ordine dei with(...).
const BUILDING_LIGHTS = [
  ["casa", 3], ["barn", 3], ["magazzino", 3], ["caserma", 4], ["stalla", 4],
  ["enemy_house", 3], ["enemy_stalla", 4], ["enemy_caserma", 4], ["o_box1", 2], ["o_box2", 2],
];

export function nightLights(w) {
  const out = [], f = w.g.frame;
  const flicker = (i) => 0.15 * Math.sin(i.x + f * 0.17);
  for (const n of ["flameqq", "firestarter", "firestarter_small"]) {
    for (const i of w.all(n)) if (i.alive) out.push([i.x, i.y, 3 + flicker(i)]);
  }
  for (const [n, base] of BUILDING_LIGHTS) {
    for (const i of w.all(n)) {
      if (i.alive && i.onfire === 1) out.push([i.x, i.y, base + (1 - i.life / i.slife) + flicker(i)]);
    }
  }
  for (const i of w.all("flameqq_small")) if (i.alive) out.push([i.x, i.y, 2]);
  for (const i of w.all("flameqq_nosmoke")) if (i.alive) out.push([i.x, i.y, 3]);
  for (const i of w.all("fire_bullet")) if (i.alive) out.push([i.x, i.y, 1]);
  // il fante che accende la freccia incendiaria
  for (const i of w.all("ally_infantry")) if (i.alive && i.action === 6 && i.step !== 2) out.push([i.x, i.y - 67, 1]);
  return out;
}
