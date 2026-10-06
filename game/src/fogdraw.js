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

import { bgrToRGB } from "./gl.js";
import { fogActive, nightColour, nightLights } from "./fog.js";

const NIGHT_TEXEL = 8;
// [§7.13] nebbia e notte composte su una superficie con un texel ogni 4 px
// di room (il filtro bicubico costa 4 letture: qui su 1/16 dei pixel)
const COMP_TEXEL = 4;
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
    this.comp = null;
  }

  _compTarget(w, h) {
    const r = this.r;
    if (this.comp && this.comp.width === w && this.comp.height === h) return this.comp;
    if (this.comp) r.deleteTarget(this.comp);
    this.comp = r.createTarget(w, h);
    return this.comp;
  }

  _nightTarget(w, h) {
    const r = this.r;
    if (this.night && this.night.width === w && this.night.height === h) return this.night;
    if (this.night) r.deleteTarget(this.night);
    this.night = r.createTarget(w, h);
    return this.night;
  }

  // [§7.13 G3] Nebbia e notte in un solo quad a schermo intero: prima
  // erano due (in lvl01 il 41% del disegno). Si compongono (programma "fog"
  // di gl.js) su una superficie piccola all'inizio del fotogramma, prima
  // del mondo (prepare: niente cambi di superficie a meta' disegno), poi
  // la si sottrae alla depth del manager (draw).
  // [§7.13, segnalazione dell'autore] la griglia della nebbia (una cella
  // ogni 16 px) si legge col filtro bicubico invece che lineare: i contorni
  // delle ellissi erano spezzati a rombi e scalini ("pixellati"); ora sono
  // curve morbide.
  prepare(d, w, cam) {
    this.ready = null;
    if (!fogActive(w)) return;
    this._ensure();
    const r = this.r, m = this.map, C = m.cell;
    // fog + blackfog (2 celle in piu' per lato: le legge il filtro bicubico)
    const reg = m.region(cam.x, cam.y, cam.w, cam.h, 3);
    const [x0, y0, x1, y1] = reg;
    const fogOn = x1 > x0 && y1 > y0;
    if (fogOn) {
      m.compose(w, reg);
      r.uploadDataRegion(this.tex, x0, y0, x1 - x0, y1 - y0, m.shade, m.gw);
    }
    // nite
    const g = w.g;
    let nightMode = 0, nightCol = [0, 0, 0], nt = null, nr = null;
    if (g.night > 0) {
      const n2 = nightColour(g.night);
      nightCol = bgrToRGB(n2);
      nightMode = 1;
      const lights = nightLights(w).filter(([x, y, s]) => {
        const rad = LIGHT_RADIUS * s;
        return x + rad > cam.x && x - rad < cam.x + cam.w && y + rad > cam.y && y - rad < cam.y + cam.h;
      });
      if (lights.length) {
        // la superficie copre la view allineata alla griglia degli 8 px
        // (niente tremolio dei bordi mentre la view scorre); la misura
        // dipende solo da quella della view, cosi' non si ricrea scorrendo
        const fx = Math.floor(cam.x / NIGHT_TEXEL) * NIGHT_TEXEL, fy = Math.floor(cam.y / NIGHT_TEXEL) * NIGHT_TEXEL;
        const tw = Math.ceil(cam.w / NIGHT_TEXEL) + 2, th = Math.ceil(cam.h / NIGHT_TEXEL) + 2;
        nt = this._nightTarget(tw, th);
        nr = [fx, fy, tw * NIGHT_TEXEL, th * NIGHT_TEXEL];
        r.beginTarget(nt, fx, fy, nr[2], nr[3], nightCol);
        r.setBlend("normal");
        for (const [x, y, s] of lights) d.spriteExt("arealight", 0, x, y, s, s, 0, 0xffffff, 1);
        r.endTarget();
        nightMode = 2;
      }
    }
    if (!fogOn && !nightMode) return;
    // composizione su una superficie piccola (un texel ogni COMP_TEXEL px di
    // room, allineata come la notte), poi un solo quad a piena risoluzione
    const fx = Math.floor(cam.x / COMP_TEXEL) * COMP_TEXEL, fy = Math.floor(cam.y / COMP_TEXEL) * COMP_TEXEL;
    const tw = Math.ceil(cam.w / COMP_TEXEL) + 2, th = Math.ceil(cam.h / COMP_TEXEL) + 2;
    const fw = tw * COMP_TEXEL, fh = th * COMP_TEXEL;
    const ct = this._compTarget(tw, th);
    r.beginTarget(ct, fx, fy, fw, fh, [0, 0, 0]);
    r.setBlend("replace");
    r.pass("fog", fx, fy, fx + fw, fy + fh, (gl, U, tex) => {
      gl.uniform1i(U.uFog, tex(this.tex));
      gl.uniform2f(U.uFogSize, m.gw, m.gh);
      gl.uniform1f(U.uFogCell, C);
      gl.uniform1i(U.uFogOn, fogOn ? 1 : 0);
      gl.uniform1i(U.uNight, tex(nt || this.tex));
      gl.uniform4f(U.uNightRect, ...(nr || [0, 0, 1, 1]));
      gl.uniform3f(U.uNightCol, ...nightCol);
      gl.uniform1i(U.uNightMode, nightMode);
    });
    r.endTarget();
    r.setBlend("normal");
    this.ready = [ct, fx, fy, fw, fh, tw, th];
  }

  // manager Draw_End azione 5: la sottrazione, alla depth del manager
  draw() {
    if (!this.ready) return;
    const r = this.r, [ct, fx, fy, fw, fh, tw, th] = this.ready;
    r.setBlend("subtract");
    r.quad(ct, fx, fy, fx + fw, fy, fx + fw, fy + fh, fx, fy + fh, 0, th, tw, 0, 0xffffffff);
    r.setBlend("normal");
  }
}
