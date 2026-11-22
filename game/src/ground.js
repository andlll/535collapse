// [§7.16 G4] Suolo cotto in blocchi. Lo sfondo ripetuto della room e le
// decorazioni del suolo (tracce, strade, chiazze, erba e prati disegnati:
// istanze ferme, senza eventi, a depth 0) coprivano a ogni fotogramma la
// view piu' volte una sopra l'altra (6-20% del disegno). Qui si disegnano
// una volta sola in blocchi da CH x CH px di room e, a ogni fotogramma, si
// copia un blocco per ogni quadrato della view: il suolo costa come un solo
// strato.
//
// Un texel per pixel di room: gli atlas del suolo sono a scala 1, quindi il
// blocco ha lo stesso dettaglio degli sprite (disegnare a densita' piu' alta
// ripeterebbe gli stessi texel). Ogni blocco ha un bordo di PAD texel in
// piu' per lato, cosi' il filtro lineare non lascia cuciture fra i blocchi.
// I blocchi lontani dalla view si buttano (al piu' MAX, 1 MB l'uno).
//
// Ordine: il suolo si disegnava fra le istanze a depth 0, in ordine di
// creazione; qui sta sotto a tutte le istanze. Cambia solo dove un fiume
// o una montagna in cima alla mappa (y < 0, quindi depth > 0) si sovrappone
// a una strada: ora la strada sta sotto.

import { drawSprite, spriteBounds } from "./sprites.js";
import { drawRiver, drawRoad, drawBridge, drawPatch, PAINTED_BRIDGES } from "./rivers.js";

export const GROUND = /^(traccia\d+|strada_\d+|chiazza01|erba_1|prato1)$/;
const CH = 512, PAD = 1, S = CH + 2 * PAD, MAX = 48;
// [§9.181] Livelli di dettaglio, per l'editor di mappe che guarda la mappa da
// lontano: al livello L un blocco copre L x L blocchi (CH * L px di room) con
// gli stessi S x S texel, un texel ogni L px. La partita usa solo il livello
// 1 (zoom fino a 1,7: bastano MAX blocchi); l'editor sceglie L dallo zoom
// (lodFor), cosi' i blocchi a schermo restano pochi anche con la mappa intera.
export function lodFor(roomPerDevicePx) {
  let L = 1;
  while (L * 2 <= roomPerDevicePx && L < 16) L *= 2;
  return L;
}

// Sfondi della room ripetuti (green1, city2: 281x250 [C]), nel rettangolo
// `cam` (x, y, w, h in room).
export function drawBackgrounds(r, assets, room, cam) {
  for (const b of room.backgrounds) {
    const t = assets.bg.get(b.name);
    if (!t) continue;
    const x0 = b.htiled ? cam.x : b.x, y0 = b.vtiled ? cam.y : b.y;
    const x1 = b.htiled ? cam.x + cam.w : b.x + t.width, y1 = b.vtiled ? cam.y + cam.h : b.y + t.height;
    r.quad(t, x0, y0, x1, y0, x1, y1, x0, y1, x0 - b.x, y0 - b.y, x1 - b.x, y1 - b.y, 0xffffffff);
  }
}

export class GroundCache {
  constructor(r, assets, room, world, clear) {
    Object.assign(this, { r, assets, room, world, clear });
    this.gen = -1;
    this.chunks = new Map(); // "cx,cy" -> { t, used }
    this.byChunk = null;     // "cx,cy" -> istanze (in ordine di creazione)
    this.frame = 0;
  }

  // [§9.97] si ricuoce tutto il suolo (i fiumi a linee sono cambiati)
  reset() {
    this.byChunk = null;
    this.free();
  }

  // Le istanze del suolo e i blocchi che toccano. Si fa una volta: sono
  // ferme e non nascono ne' muoiono (la room si carica, o si ripristina
  // un salvataggio, prima del primo disegno).
  _index() {
    const w = this.world, skip = new Set(), by = new Map();
    const top = new Map(); // [§9.100] i ponti dipinti: dopo strade e fiumi
    for (const i of w.instances) {
      if (!i.alive || !i.visible || !i.sprite_index) continue;
      if (PAINTED_BRIDGES.includes(i.object)) {
        const bb = spriteBounds(this.assets, i.sprite_index, i.x, i.y, i.image_xscale, i.image_yscale);
        if (!bb) continue;
        skip.add(i);
        for (let cy = Math.floor(bb[1] / CH); cy <= Math.floor(bb[3] / CH); cy++) {
          for (let cx = Math.floor(bb[0] / CH); cx <= Math.floor(bb[2] / CH); cx++) {
            const k = cx + "," + cy;
            if (!top.has(k)) top.set(k, []);
            top.get(k).push(i);
          }
        }
        continue;
      }
      if (!GROUND.test(i.object)) continue;
      const bb = spriteBounds(this.assets, i.sprite_index, i.x, i.y, i.image_xscale, i.image_yscale);
      if (!bb) continue;
      skip.add(i);
      for (let cy = Math.floor(bb[1] / CH); cy <= Math.floor(bb[3] / CH); cy++) {
        for (let cx = Math.floor(bb[0] / CH); cx <= Math.floor(bb[2] / CH); cx++) {
          const k = cx + "," + cy;
          let l = by.get(k);
          if (!l) by.set(k, (l = []));
          l.push(i);
        }
      }
    }
    for (const l of by.values()) l.sort((a, b) => a.id - b.id);
    this.byChunk = by;
    this.topChunks = top;
    // [§9.97] strade, fiumi e ponti a linee (rivers.js): quali toccano ogni
    // blocco, nell'ordine in cui si cuociono
    this.lineChunks = new Map(); // "cx,cy" -> [[tipo, geometria]]
    const feats = [...(w.roads || []).map((g) => ["strada", g]), ...(w.rivers || []).map((g) => ["fiume", g]),
                   ...(w.bridges || []).map((g) => ["ponte", g])];
    // [§9.99] le macchie, a parte: si cuociono prima degli sprite del suolo
    this.patchChunks = new Map();
    this.patchList = w.patches || []; // §9.181: l'ordine, per i blocchi dei livelli piu' lontani
    this.featList = feats;
    for (const g of w.patches || []) {
      const bb = g.bbox;
      for (let cy = Math.floor(bb[1] / CH); cy <= Math.floor(bb[3] / CH); cy++) {
        for (let cx = Math.floor(bb[0] / CH); cx <= Math.floor(bb[2] / CH); cx++) {
          const k = cx + "," + cy;
          if (!this.patchChunks.has(k)) this.patchChunks.set(k, []);
          this.patchChunks.get(k).push(g);
        }
      }
    }
    for (const f of feats) {
      const bb = f[1].bbox;
      for (let cy = Math.floor(bb[1] / CH); cy <= Math.floor(bb[3] / CH); cy++) {
        for (let cx = Math.floor(bb[0] / CH); cx <= Math.floor(bb[2] / CH); cx++) {
          const k = cx + "," + cy;
          if (!this.lineChunks.has(k)) this.lineChunks.set(k, []);
          this.lineChunks.get(k).push(f);
        }
      }
    }
    w.skipDraw = skip;
  }

  // [§9.181] cio' che tocca il blocco (cx, cy) del livello L: le liste dei
  // blocchi di base che copre, senza doppioni e nell'ordine di sempre
  _gather(map, cx, cy, L, order) {
    if (L === 1) return map.get(cx + "," + cy) || [];
    const set = new Set();
    for (let by = cy * L; by < cy * L + L; by++) {
      for (let bx = cx * L; bx < cx * L + L; bx++) for (const v of map.get(bx + "," + by) || []) set.add(v);
    }
    return order(set);
  }

  _bake(cx, cy, reuse, L = 1) {
    const r = this.r, x0 = (cx * CH - PAD) * L, y0 = (cy * CH - PAD) * L, SL = S * L;
    const t = reuse || r.createTarget(S, S);
    r.beginTarget(t, x0, y0, SL, SL, this.clear);
    r.setBlend("normal");
    drawBackgrounds(r, this.assets, this.room, { x: x0, y: y0, w: SL, h: SL });
    const byId = (set) => [...set].sort((a, b) => a.id - b.id);
    const inList = (list) => (set) => list.filter((v) => set.has(v));
    for (const g of this._gather(this.patchChunks, cx, cy, L, inList(this.patchList))) { // §9.99
      const tex = this.assets.bg.get(g.bg);
      if (tex) drawPatch(r, g, tex);
    }
    for (const i of this._gather(this.byChunk, cx, cy, L, byId)) {
      drawSprite(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale,
                 i.image_yscale, i.image_angle, i.image_blend, i.image_alpha);
    }
    const feats = this._gather(this.lineChunks, cx, cy, L, inList(this.featList));
    if (feats.length) {
      const A = this.assets, wf = A.frame("__white", 0);
      const white = wf && { t: wf.tex, u: wf.f.rect[0] + 4, v: wf.f.rect[1] + 4 };
      const water = A.bg.get("fiume_acqua"), stones = A.bg.get("fiume_sassi"), paper = A.bg.get("fiume_carta");
      const box = [x0, y0, x0 + SL, y0 + SL];
      for (const [kind, g] of feats) {
        if (kind === "strada" && stones) drawRoad(r, g, stones, box);
        else if (kind === "fiume" && water && white) drawRiver(r, g, water, white);
        else if (kind === "ponte" && paper && white) drawBridge(r, g, paper, white);
      }
    }
    for (const i of this._gather(this.topChunks, cx, cy, L, byId)) { // §9.100
      drawSprite(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale,
                 i.image_yscale, i.image_angle, i.image_blend, i.image_alpha);
    }
    r.endTarget();
    return t;
  }

  // Al posto di drawBackgrounds: sfondo e suolo della view `cam`.
  // [§9.181] L: il livello di dettaglio (1 in partita; l'editor, lodFor)
  draw(cam, L = 1) {
    const r = this.r;
    if (this.gen !== r.generation) { this.gen = r.generation; this.chunks.clear(); }
    if (!this.byChunk) this._index();
    this.frame++;
    const C = CH * L;
    const cx0 = Math.floor(cam.x / C), cx1 = Math.floor((cam.x + cam.w) / C);
    const cy0 = Math.floor(cam.y / C), cy1 = Math.floor((cam.y + cam.h) / C);
    const proj = r.proj;
    const quads = [];
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const k = L === 1 ? cx + "," + cy : L + ":" + cx + "," + cy;
        let c = this.chunks.get(k);
        if (!c) {
          // un blocco nuovo; oltre MAX si riusa la superficie del meno usato
          let reuse = null;
          if (this.chunks.size >= MAX) {
            let ok = null, oc = null;
            for (const [kk, cc] of this.chunks) if (cc.used < this.frame && (!oc || cc.used < oc.used)) { ok = kk; oc = cc; }
            if (oc) { this.chunks.delete(ok); reuse = oc.t; }
          }
          c = { t: this._bake(cx, cy, reuse, L), used: 0 };
          this.chunks.set(k, c);
        }
        c.used = this.frame;
        quads.push([c.t, cx, cy]);
      }
    }
    r.setProjection(...proj);
    r.setBlend("replace"); // blocchi opachi
    for (const [t, cx, cy] of quads) {
      const x0 = cx * C, y0 = cy * C, x1 = x0 + C, y1 = y0 + C;
      r.quad(t, x0, y0, x1, y0, x1, y1, x0, y1, PAD, S - PAD, S - PAD, PAD, 0xffffffff);
    }
    r.setBlend("normal");
  }

  free() {
    if (this.gen === this.r.generation) for (const c of this.chunks.values()) this.r.deleteTarget(c.t);
    this.chunks.clear();
  }
}
