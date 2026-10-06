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

export const GROUND = /^(traccia\d+|strada_\d+|chiazza01|erba_1|prato1)$/;
const CH = 512, PAD = 1, S = CH + 2 * PAD, MAX = 48;

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

  // Le istanze del suolo e i blocchi che toccano. Si fa una volta: sono
  // ferme e non nascono ne' muoiono (la room si carica, o si ripristina
  // un salvataggio, prima del primo disegno).
  _index() {
    const w = this.world, skip = new Set(), by = new Map();
    for (const i of w.instances) {
      if (!i.alive || !i.visible || !i.sprite_index || !GROUND.test(i.object)) continue;
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
    w.skipDraw = skip;
  }

  _bake(cx, cy, reuse) {
    const r = this.r, x0 = cx * CH - PAD, y0 = cy * CH - PAD;
    const t = reuse || r.createTarget(S, S);
    r.beginTarget(t, x0, y0, S, S, this.clear);
    r.setBlend("normal");
    drawBackgrounds(r, this.assets, this.room, { x: x0, y: y0, w: S, h: S });
    for (const i of this.byChunk.get(cx + "," + cy) || []) {
      drawSprite(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale,
                 i.image_yscale, i.image_angle, i.image_blend, i.image_alpha);
    }
    r.endTarget();
    return t;
  }

  // Al posto di drawBackgrounds: sfondo e suolo della view `cam`.
  draw(cam) {
    const r = this.r;
    if (this.gen !== r.generation) { this.gen = r.generation; this.chunks.clear(); }
    if (!this.byChunk) this._index();
    this.frame++;
    const cx0 = Math.floor(cam.x / CH), cx1 = Math.floor((cam.x + cam.w) / CH);
    const cy0 = Math.floor(cam.y / CH), cy1 = Math.floor((cam.y + cam.h) / CH);
    const proj = r.proj;
    const quads = [];
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const k = cx + "," + cy;
        let c = this.chunks.get(k);
        if (!c) {
          // un blocco nuovo; oltre MAX si riusa la superficie del meno usato
          let reuse = null;
          if (this.chunks.size >= MAX) {
            let ok = null, oc = null;
            for (const [kk, cc] of this.chunks) if (cc.used < this.frame && (!oc || cc.used < oc.used)) { ok = kk; oc = cc; }
            if (oc) { this.chunks.delete(ok); reuse = oc.t; }
          }
          c = { t: this._bake(cx, cy, reuse), used: 0 };
          this.chunks.set(k, c);
        }
        c.used = this.frame;
        quads.push([c.t, cx, cy]);
      }
    }
    r.setProjection(...proj);
    r.setBlend("replace"); // blocchi opachi
    for (const [t, cx, cy] of quads) {
      const x0 = cx * CH, y0 = cy * CH, x1 = x0 + CH, y1 = y0 + CH;
      r.quad(t, x0, y0, x1, y0, x1, y1, x0, y1, PAD, S - PAD, S - PAD, PAD, 0xffffffff);
    }
    r.setBlend("normal");
  }

  free() {
    if (this.gen === this.r.generation) for (const c of this.chunks.values()) this.r.deleteTarget(c.t);
    this.chunks.clear();
  }
}
