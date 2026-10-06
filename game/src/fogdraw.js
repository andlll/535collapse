// Disegno di nebbia e notte [C, manager Draw_End azione 5], sopra la
// logica di fog.js. Le tre superfici grandi come la room dell'originale
// (~590 MB in match) diventano:
// - una texture a un canale con una cella ogni 16 px di room (fog +
//   blackfog gia' composte: 0 vista, 110 gia' vista, 255 mai vista), di cui
//   a ogni fotogramma si aggiornano solo le celle della view;
// - una superficie per la notte con un texel ogni 8 px della view (in una
//   finestra 1920x1080 a zoom 1,5: 361x204, 0,3 MB), usata solo se di notte
//   c'e' almeno un fuoco nella view; senza fuochi basta un rettangolo.
// Si applicano con bm_subtract come nell'originale: la destinazione
// moltiplicata per (1 - valore).

import { bgrToRGB, packColor } from "./gl.js";
import { fogActive, nightColour, nightLights } from "./fog.js";

const NIGHT_TEXEL = 8;
// mezza larghezza dello sprite arealight (191x172, origine 89,84) alla
// scala 1, per eccesso: per scartare i fuochi lontani dalla view
const LIGHT_RADIUS = 110;

export class FogLayer {
  constructor(renderer, fogMap) {
    this.r = renderer;
    this.map = fogMap;
    this.generation = 0;
    this.tex = null;
    this.night = null;
  }

  // Oggetti GL: al primo uso e dopo una perdita del contesto.
  _ensure() {
    const r = this.r;
    if (this.generation === r.generation) return;
    this.generation = r.generation;
    this.tex = r.createDataTexture(this.map.gw, this.map.gh);
    this.night = null;
  }

  _nightTarget(w, h) {
    const r = this.r;
    if (this.night && this.night.width === w && this.night.height === h) return this.night;
    if (this.night) r.deleteTarget(this.night);
    this.night = r.createTarget(w, h);
    return this.night;
  }

  draw(d, w, cam) {
    if (!fogActive(w)) return;
    this._ensure();
    const r = this.r, m = this.map, C = m.cell;
    // fog + blackfog
    const reg = m.region(cam.x, cam.y, cam.w, cam.h);
    const [x0, y0, x1, y1] = reg;
    if (x1 > x0 && y1 > y0) {
      m.compose(w, reg);
      r.uploadDataRegion(this.tex, x0, y0, x1 - x0, y1 - y0, m.shade, m.gw);
      r.setBlend("subtract");
      r.quad(this.tex, x0 * C, y0 * C, x1 * C, y0 * C, x1 * C, y1 * C, x0 * C, y1 * C,
             x0, y0, x1, y1, 0xffffffff);
    }
    // nite
    const g = w.g;
    if (g.night > 0) {
      const n2 = nightColour(g.night);
      const lights = nightLights(w).filter(([x, y, s]) => {
        const rad = LIGHT_RADIUS * s;
        return x + rad > cam.x && x - rad < cam.x + cam.w && y + rad > cam.y && y - rad < cam.y + cam.h;
      });
      if (!lights.length) {
        r.setBlend("subtract");
        d.rectangleColour(cam.x, cam.y, cam.x + cam.w, cam.y + cam.h, packColor(n2), packColor(n2),
                          packColor(n2), packColor(n2), false, true);
      } else {
        // la superficie copre la view allineata alla griglia degli 8 px
        // (niente tremolio dei bordi mentre la view scorre); la misura
        // dipende solo da quella della view, cosi' non si ricrea scorrendo
        const fx = Math.floor(cam.x / NIGHT_TEXEL) * NIGHT_TEXEL, fy = Math.floor(cam.y / NIGHT_TEXEL) * NIGHT_TEXEL;
        const tw = Math.ceil(cam.w / NIGHT_TEXEL) + 2, th = Math.ceil(cam.h / NIGHT_TEXEL) + 2;
        const t = this._nightTarget(tw, th);
        const fw = tw * NIGHT_TEXEL, fh = th * NIGHT_TEXEL;
        r.beginTarget(t, fx, fy, fw, fh, bgrToRGB(n2));
        r.setBlend("normal");
        for (const [x, y, s] of lights) d.spriteExt("arealight", 0, x, y, s, s, 0, 0xffffff, 1);
        r.endTarget();
        r.setBlend("subtract");
        r.quad(t, fx, fy, fx + fw, fy, fx + fw, fy + fh, fx, fy + fh, 0, th, tw, 0, 0xffffffff);
      }
    }
    r.setBlend("normal");
  }
}
