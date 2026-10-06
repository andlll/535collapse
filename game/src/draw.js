// Disegno "alla GameMaker": stato corrente (alpha, colore, font,
// allineamenti, blend) e le funzioni draw_* usate dal gioco [C, censimento
// in data/functions.json]. Serve a portare il codice di disegno delle
// interfacce (Draw GUI) riga per riga, con gli stessi numeri.
//
// Semantica [I, runner GMS 1.x, da confermare a occhio sugli screenshot]:
// - draw_set_alpha vale per primitive, testo e draw_sprite; draw_sprite_ext
//   usa invece l'alpha che riceve;
// - nei draw_*_colour col1 e' il centro (cerchi, ellissi, rettangoli
//   arrotondati) o il primo estremo (linee), col2 il bordo o l'altro estremo;
// - cerchi a 24 segmenti (draw_set_circle_precision predefinito). [§6.1
//   n.84, decisione dell'autore] qui le curve hanno segmenti di ~6 px (da 16
//   a 96 per giro) e i bordi di cerchi, ellissi e rettangoli arrotondati
//   sono sfumati su 1 px (antialiasing per vertice: il canvas WebGL non ha
//   il multisampling), invece della scalettatura dell'originale;
// - nel testo "#" va a capo; un numero si scrive senza decimali se intero,
//   altrimenti con 2 (string() di GMS);
// - altezza di riga: l'altezza massima dei glifi del font.

import { packColor } from "./gl.js";
import { drawSprite } from "./sprites.js";

// segmenti per un giro di raggio r (pixel della proiezione corrente)
const segments = (r) => Math.max(16, Math.min(96, Math.ceil((2 * Math.PI * r) / 6)));
const AA = 0.5; // meta' della sfumatura del bordo, in pixel

export function gmString(v) {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (v === undefined || v === null) return "undefined";
  return String(v);
}

// I font hanno l'ASCII piu' le lettere accentate composte da
// tools/05_atlas.py (IT, ES, PT, DE, FR); il resto delle traduzioni si
// riduce a lettere ASCII qui.
const SUBST = { "ß": "ss", "œ": "oe", "Œ": "Oe", "æ": "ae", "Æ": "Ae", "’": "'", "‘": "'", "“": "\"", "”": "\"",
                "«": "\"", "»": "\"", "–": "-", "—": "-", "…": "...", "\u00a0": " ", "\u202f": " " };
const SUBST_RE = new RegExp("[" + Object.keys(SUBST).join("") + "]", "g");
export const plain = (s) => s.replace(SUBST_RE, (ch) => SUBST[ch]);

export class Draw {
  constructor(r, assets) {
    this.r = r;
    this.a = assets;
    this.alpha = 1;
    this.colour = 0xffffff;
    this.font = null;
    this.halign = "left";
    this.valign = "top";
  }

  // Inizio di una fase di disegno. In GMS lo stato (alpha, colore, font,
  // allineamenti) non si azzera mai: resta quello lasciato dall'ultimo
  // evento, anche fra un fotogramma e l'altro [I], e il gioco ci conta (la
  // percentuale nella scheda del centro e' nera perche' il manager e il
  // centro stesso finiscono con draw_set_colour(c_black)). Qui si
  // ripristina solo il blend, che il renderer azzera a ogni fotogramma.
  reset() {
    this.r.setBlend("normal");
  }

  // Schede descrittive di pulsanti e unita' (in basso a sinistra, x=20)
  // [Correzione decisa dall'autore, §6.1 n.85]: con la minimappa aperta
  // nell'originale la coprivano; qui si spostano alla sua destra, oltre i
  // suoi tre pulsanti, traslando la proiezione GUI fra Begin ed End.
  tooltipBegin(w) {
    const g = w.g;
    this._tipProj = null;
    if (w.room === "menu" || g.minim !== 1) return;
    const ox = w.roomW / g.sz + 60;
    const [x, y, pw, ph] = this.r.proj;
    this._tipProj = [x, y, pw, ph];
    this.r.setProjection(x - ox, y, pw, ph);
  }

  tooltipEnd() {
    if (this._tipProj) this.r.setProjection(...this._tipProj);
    this._tipProj = null;
  }

  setAlpha(a) { this.alpha = a; }
  setColour(col) { this.colour = col; }
  setFont(name) { this.font = name; }
  setHalign(h) { this.halign = h; }
  setValign(v) { this.valign = v; }
  setBlend(mode) { this.r.setBlend(mode); }

  // ------------------------------------------------------------ primitive

  _white() {
    const fr = this.a.frame("__white", 0);
    if (!fr) return null;
    const [u, v] = fr.f.rect;
    return { t: fr.tex, u: u + 4, v: v + 4 };
  }

  _tri(x0, y0, x1, y1, x2, y2, c0, c1, c2) {
    const w = this._white();
    if (!w) return;
    this.r.quad(w.t, x0, y0, x1, y1, x2, y2, x2, y2, w.u, w.v, w.u, w.v, c0, c1, c2, c2);
  }

  _quad(x0, y0, x1, y1, x2, y2, x3, y3, c0, c1, c2, c3) {
    const w = this._white();
    if (!w) return;
    this.r.quad(w.t, x0, y0, x1, y1, x2, y2, x3, y3, w.u, w.v, w.u, w.v, c0, c1, c2, c3);
  }

  _line(x1, y1, x2, y2, width, c1, c2) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * width / 2, ny = (dx / len) * width / 2;
    this._quad(x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny, c1, c2, c2, c1);
  }

  // Poligono convesso: ventaglio dal centro (colore cIn) al contorno (cOut),
  // oppure solo il contorno di 1 px se outline. Bordi sfumati (AA): il
  // ventaglio arriva mezzo pixel dentro il contorno, poi una striscia va
  // da cOut a trasparente fino a mezzo pixel fuori (colori premoltiplicati:
  // trasparente = 0, va bene anche col blend additivo).
  _poly(cx, cy, pts, cIn, cOut, outline) {
    const P = [];
    for (const p of pts) {
      const q = P[P.length - 1];
      if (!q || Math.abs(q[0] - p[0]) > 1e-6 || Math.abs(q[1] - p[1]) > 1e-6) P.push(p);
    }
    if (P.length > 2 && Math.abs(P[0][0] - P[P.length - 1][0]) < 1e-6 && Math.abs(P[0][1] - P[P.length - 1][1]) < 1e-6) P.pop();
    const n = P.length;
    if (n < 3) return;
    // normali uscenti dei lati, poi dei vertici (con la correzione dello
    // spigolo, limitata)
    const en = [];
    for (let i = 0; i < n; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % n];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      let nx = (by - ay) / len, ny = -(bx - ax) / len;
      if (nx * ((ax + bx) / 2 - cx) + ny * ((ay + by) / 2 - cy) < 0) { nx = -nx; ny = -ny; }
      en.push([nx, ny]);
    }
    const inner = [], outer = [];
    for (let i = 0; i < n; i++) {
      const [ax, ay] = en[(i + n - 1) % n], [bx, by] = en[i];
      let nx = ax + bx, ny = ay + by;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len; ny /= len;
      const k = Math.min(2, 1 / Math.max(0.5, nx * bx + ny * by));
      const [px, py] = P[i];
      if (outline) {
        inner.push([px - nx * 2 * AA * k, py - ny * 2 * AA * k]);
        outer.push([px + nx * 2 * AA * k, py + ny * 2 * AA * k]);
      } else {
        inner.push([px - nx * AA * k, py - ny * AA * k]);
        outer.push([px + nx * AA * k, py + ny * AA * k]);
      }
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [ix, iy] = inner[i], [jx, jy] = inner[j], [ox, oy] = outer[i], [qx, qy] = outer[j];
      if (outline) {
        // contorno di 1 px: profilo a triangolo, trasparente-pieno-trasparente
        const [ax, ay] = P[i], [bx, by] = P[j];
        this._quad(ix, iy, jx, jy, bx, by, ax, ay, 0, 0, cOut, cOut);
        this._quad(ax, ay, bx, by, qx, qy, ox, oy, cOut, cOut, 0, 0);
      } else {
        this._tri(cx, cy, ix, iy, jx, jy, cIn, cOut, cOut);
        this._quad(ix, iy, jx, jy, qx, qy, ox, oy, cOut, cOut, 0, 0);
      }
    }
  }

  rectangle(x1, y1, x2, y2, outline = false) {
    const col = packColor(this.colour, this.alpha);
    this.rectangleColour(x1, y1, x2, y2, col, col, col, col, outline, true);
  }

  rectangleColour(x1, y1, x2, y2, c1, c2, c3, c4, outline = false, packed = false) {
    const p = packed ? (x) => x : (x) => packColor(x, this.alpha);
    const [a, b, cc, d] = [p(c1), p(c2), p(c3), p(c4)];
    const l = Math.min(x1, x2), rgt = Math.max(x1, x2) + 1, t = Math.min(y1, y2), btm = Math.max(y1, y2) + 1;
    if (outline) {
      this._line(l, t + 0.5, rgt, t + 0.5, 1, a, b);
      this._line(rgt - 0.5, t, rgt - 0.5, btm, 1, b, cc);
      this._line(rgt, btm - 0.5, l, btm - 0.5, 1, cc, d);
      this._line(l + 0.5, btm, l + 0.5, t, 1, d, a);
    } else {
      this._quad(l, t, rgt, t, rgt, btm, l, btm, a, b, cc, d);
    }
  }

  roundrectColourExt(x1, y1, x2, y2, xrad, yrad, c1, c2, outline = false) {
    const l = Math.min(x1, x2), rgt = Math.max(x1, x2), t = Math.min(y1, y2), btm = Math.max(y1, y2);
    // raggi limitati a meta' lato (con raggio piu' grande gli angoli si
    // sovrapporrebbero) [I]
    const rx = Math.min(xrad / 2, (rgt - l) / 2), ry = Math.min(yrad / 2, (btm - t) / 2);
    const pts = [];
    const q = Math.max(4, Math.ceil(segments(Math.max(rx, ry)) / 4));
    const corner = (cx, cy, a0) => {
      for (let i = 0; i <= q; i++) {
        const a = a0 + (i / q) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
      }
    };
    corner(rgt - rx, btm - ry, 0);
    corner(l + rx, btm - ry, Math.PI / 2);
    corner(l + rx, t + ry, Math.PI);
    corner(rgt - rx, t + ry, Math.PI * 1.5);
    this._poly((l + rgt) / 2, (t + btm) / 2, pts, packColor(c1, this.alpha), packColor(c2, this.alpha), outline);
  }

  ellipseColour(x1, y1, x2, y2, c1, c2, outline = false) {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
    const pts = [], seg = segments(Math.max(rx, ry));
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    this._poly(cx, cy, pts, packColor(c1, this.alpha), packColor(c2, this.alpha), outline);
  }

  circleColour(x, y, r, c1, c2, outline = false) {
    this.ellipseColour(x - r, y - r, x + r, y + r, c1, c2, outline);
  }

  circle(x, y, r, outline = false) {
    this.circleColour(x, y, r, this.colour, this.colour, outline);
  }

  lineColour(x1, y1, x2, y2, c1, c2) {
    this._line(x1, y1, x2, y2, 1, packColor(c1, this.alpha), packColor(c2, this.alpha));
  }

  lineWidthColour(x1, y1, x2, y2, w, c1, c2) {
    this._line(x1, y1, x2, y2, w, packColor(c1, this.alpha), packColor(c2, this.alpha));
  }

  triangleColour(x1, y1, x2, y2, x3, y3, c1, c2, c3, outline = false) {
    const [a, b, cc] = [c1, c2, c3].map((x) => packColor(x, this.alpha));
    if (outline) {
      this._line(x1, y1, x2, y2, 1, a, b);
      this._line(x2, y2, x3, y3, 1, b, cc);
      this._line(x3, y3, x1, y1, 1, cc, a);
    } else {
      this._tri(x1, y1, x2, y2, x3, y3, a, b, cc);
    }
  }

  // --------------------------------------------------------------- sprite

  sprite(name, sub, x, y) {
    drawSprite(this.r, this.a, name, sub, x, y, 1, 1, 0, 0xffffff, this.alpha);
  }

  spriteExt(name, sub, x, y, xs, ys, rot, col, alpha) {
    drawSprite(this.r, this.a, name, sub, x, y, xs, ys, rot, col, alpha);
  }

  // ---------------------------------------------------------------- testo

  _font() {
    return this.a.atlas.fonts[this.font] || null;
  }

  _lines(str, sep, width) {
    const f = this._font();
    const lines = plain(gmString(str)).split(/#|\n/);
    if (width === undefined || width < 0 || !f) return lines;
    const out = [];
    for (const line of lines) {
      let cur = "";
      for (const word of line.split(" ")) {
        const next = cur ? cur + " " + word : word;
        if (cur && this._width(next, f) > width) {
          out.push(cur);
          cur = word;
        } else {
          cur = next;
        }
      }
      out.push(cur);
    }
    return out;
  }

  _width(line, f) {
    let w = 0;
    for (const ch of line) {
      const g = f.glyphs[ch.charCodeAt(0)];
      if (g) w += g[4];
    }
    return w;
  }

  // Quanto allargare una scheda (pannello in basso a sinistra, testi da
  // x=40, scorciatoia allineata a destra) perche' ci stiano titolo,
  // descrizione su una riga e scorciatoia: 0 se ci stanno gia', come in
  // inglese; serve ai testi tradotti piu' lunghi.
  panelExtra(right, title, desc, shortcut) {
    const font = this.font;
    this.setFont("GUI_1");
    const tw = this.stringWidth(title), sw = shortcut ? this.stringWidth(shortcut) : 0;
    this.setFont("overdue");
    const dw = desc ? this.stringWidth(desc) : 0;
    this.setFont(font);
    return Math.max(0, Math.ceil(Math.max(40 + dw + 20, 40 + tw + 30 + sw + 20) - right));
  }

  stringWidth(str) {
    const f = this._font();
    return f ? Math.max(...this._lines(str).map((l) => this._width(l, f))) : 0;
  }

  stringHeight(str) {
    return this.stringHeightExt(str, -1, -1);
  }

  stringHeightExt(str, sep, width) {
    const f = this._font();
    if (!f) return 0;
    const lh = sep === undefined || sep < 0 ? f.height : sep;
    return this._lines(str, sep, width).length * lh;
  }

  text(x, y, str) {
    this.textExt(x, y, str, -1, -1);
  }

  // draw_text_transformed (solo scala, senza rotazione): il menu di pausa
  // scrive un po' piu' piccolo dei font del gioco (§6.1 n.87)
  textTransformed(x, y, str, scale) {
    this.textExt(x, y, str, -1, -1, scale);
  }

  textExt(x, y, str, sep, width, scale = 1) {
    const f = this._font();
    if (!f) return;
    const fr = this.a.frame(f.sprite, 0);
    if (!fr) return;
    const [ou, ov] = fr.f.rect;
    const lh = (sep === undefined || sep < 0 ? f.height : sep) * scale;
    const lines = this._lines(str, sep, width === undefined || width < 0 ? width : width / scale);
    const total = lines.length * lh;
    let yy = this.valign === "middle" ? y - total / 2 : this.valign === "bottom" ? y - total : y;
    const col = packColor(this.colour, this.alpha);
    for (const line of lines) {
      const w = this._width(line, f) * scale;
      let xx = this.halign === "center" ? x - w / 2 : this.halign === "right" ? x - w : x;
      xx = Math.round(xx);
      const yr = Math.round(yy);
      for (const ch of line) {
        const g = f.glyphs[ch.charCodeAt(0)];
        if (!g) continue;
        const [gx, gy, gw, gh, shift, off, yoff = 0] = g;
        if (gw > 0 && gh > 0) {
          const x0 = xx + off * scale, y0 = yr + yoff * scale, x1 = x0 + gw * scale, y1 = y0 + gh * scale;
          this.r.quad(fr.tex, x0, y0, x1, y0, x1, y1, x0, y1,
                      ou + gx, ov + gy, ou + gx + gw, ov + gy + gh, col);
        }
        xx += shift * scale;
      }
      yy += lh;
    }
  }
}
