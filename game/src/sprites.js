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
