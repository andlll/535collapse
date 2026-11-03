// draw_sprite_ext di GameMaker sopra il batch del renderer.
//
// Coordinate dello sprite: l'origine (xorig, yorigin del GMX) va in (x, y);
// il frame nell'atlas e' ritagliato sull'alpha, quindi il quad parte dallo
// scostamento del ritaglio. Rotazione in gradi in senso antiorario, con y
// verso il basso, come in GameMaker [I].

import { packColor } from "./gl.js";

export function drawSprite(r, assets, name, index, x, y, xscale = 1, yscale = 1, angle = 0,
                           colour = 0xffffff, alpha = 1) {
  const fr = assets.frame(name, index);
  if (!fr) return false;
  const { s, f, tex } = fr;
  const [tx, ty, tw, th] = f.trim;
  const lx0 = (tx - s.origin[0]) * xscale, ly0 = (ty - s.origin[1]) * yscale;
  const lx1 = (tx + tw - s.origin[0]) * xscale, ly1 = (ty + th - s.origin[1]) * yscale;
  const [u, v, w, h] = f.rect;
  const rgba = packColor(colour, alpha);
  if (angle === 0) {
    r.quad(tex, x + lx0, y + ly0, x + lx1, y + ly0, x + lx1, y + ly1, x + lx0, y + ly1,
           u, v, u + w, v + h, rgba);
  } else {
    const a = -angle * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    const px = (lx, ly) => x + lx * c - ly * sn, py = (lx, ly) => y + lx * sn + ly * c;
    r.quad(tex, px(lx0, ly0), py(lx0, ly0), px(lx1, ly0), py(lx1, ly0),
           px(lx1, ly1), py(lx1, ly1), px(lx0, ly1), py(lx0, ly1), u, v, u + w, v + h, rgba);
  }
  return true;
}

// Rettangolo occupato a schermo (per scartare cio' che e' fuori dalla view).
export function spriteBounds(assets, name, x, y, xscale = 1, yscale = 1) {
  const s = assets.sprites[name];
  if (!s) return null;
  const ax = Math.abs(xscale), ay = Math.abs(yscale);
  const ox = s.origin[0] * ax, oy = s.origin[1] * ay;
  // largo per eccesso: con rotazione il rettangolo puo' girare attorno all'origine
  const rad = Math.hypot(Math.max(ox, s.width * ax - ox), Math.max(oy, s.height * ay - oy));
  return [x - rad, y - rad, x + rad, y + rad];
}

// [§9.105, richiesta dell'autore] Uno sprite che ondeggia col vento (gli
// alberi): disegnato in `rows` strisce orizzontali sopra l'origine, ognuna
// spostata in orizzontale di top x (altezza / h)^2 (top: lo spostamento a
// h px sopra l'origine, ambience.js treeSway). La base del tronco e l'ombra
// a terra (all'altezza dell'origine e sotto) restano ferme, la chioma si
// muove. Le strisce sono parallelogrammi con i bordi in comune: niente
// cuciture, nessuna texture in piu'. Senza scala verticale ne' rotazione
// (gli alberi non ne hanno); se no, come drawSprite.
export function drawSway(r, assets, name, index, x, y, xscale, yscale, top, colour = 0xffffff, alpha = 1, h = 150, rows = 6) {
  const fr = assets.frame(name, index);
  if (!fr) return false;
  const { s, f, tex } = fr;
  const [tx, ty, tw, th] = f.trim;
  const lx0 = (tx - s.origin[0]) * xscale, ly0 = (ty - s.origin[1]) * yscale;
  const lx1 = (tx + tw - s.origin[0]) * xscale, ly1 = (ty + th - s.origin[1]) * yscale;
  if (yscale <= 0 || ly0 >= 0 || !top) return drawSprite(r, assets, name, index, x, y, xscale, yscale, 0, colour, alpha);
  const [u, v, w, hh] = f.rect;
  const rgba = packColor(colour, alpha);
  const off = (ly) => (ly >= 0 ? 0 : top * (ly / h) * (ly / h));
  const vAt = (ly) => v + (ly - ly0) / (ly1 - ly0) * hh;
  const yEnd = Math.min(0, ly1);
  let ya = ly0;
  for (let k = 1; k <= rows; k++) {
    const yb = ly0 + (yEnd - ly0) * k / rows, oa = off(ya), ob = off(yb);
    r.quad(tex, x + lx0 + oa, y + ya, x + lx1 + oa, y + ya, x + lx1 + ob, y + yb, x + lx0 + ob, y + yb, u, vAt(ya), u + w, vAt(yb), rgba);
    ya = yb;
  }
  if (ly1 > 0) r.quad(tex, x + lx0, y, x + lx1, y, x + lx1, y + ly1, x + lx0, y + ly1, u, vAt(0), u + w, v + hh, rgba);
  return true;
}
