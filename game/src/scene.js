// Anteprima statica di una room: le istanze del file di room disegnate con
// il loro sprite iniziale, nessuna logica (STUDIO.md §2.5). Serve a provare
// renderer, atlas, camera e ordine di disegno prima di portare i sistemi.
//
// Regole prese da tools/07_scene.py:
// - sprite: quello dell'oggetto, o una delle scelte casuali del Create
//   (alberi alb1..alb8, case nemiche c1b..c6b [C]);
// - depth: fissa, oppure -y+k (STUDIO.md §1.3: le unita' la ricalcolano ogni
//   passo); a depth piu' alta si disegna prima, a pari depth vale l'ordine
//   di creazione;
// - gli oggetti con un evento Draw proprio non si disegnano da soli [I];
// - gli oggetti rivelati dalla nebbia (alberi, rovine, pietre) qui si vedono
//   tutti: la nebbia non c'e' ancora.
// - image_speed: il gioco non lo imposta mai [C, 0 occorrenze], quindi gli
//   sprite a piu' frame avanzano di un frame per passo, il default di GMS [I].

import { drawSprite, spriteBounds } from "./sprites.js";

export class Scene {
  constructor(room, assets) {
    this.room = room;
    this.assets = assets;
    this.instances = [];
    room.instances.forEach(([object, x, y, sx, sy, rot, colour], order) => {
      const o = room.objects[object];
      if (!o || !o.draw || !(o.visible || o.reveal)) return;
      const sprite = o.choices ? o.choices[Math.floor(Math.random() * o.choices.length)] : o.sprite;
      if (!sprite || !assets.sprites[sprite]) return;
      const depth = typeof o.depth === "number" ? o.depth : -y + o.depth.y;
      // colore d'istanza ARGB a 32 bit; 0xFFFFFFFF = nessuna tinta.
      this.instances.push({ object, sprite, x, y, sx, sy, rot, order, depth, imageIndex: 0,
                            colour: colour & 0xffffff, alpha: (colour >>> 24) / 255 });
    });
    this.instances.sort((a, b) => b.depth - a.depth || a.order - b.order);
  }

  step() {
    for (const i of this.instances) {
      if (this.assets.sprites[i.sprite].frames.length > 1) i.imageIndex += 1;
    }
  }

  draw(r, cam) {
    // sfondi della room, ripetuti (green1, city2: 281x250 [C])
    for (const b of this.room.backgrounds) {
      const t = this.assets.bg.get(b.name);
      if (!t) continue;
      const x0 = b.htiled ? cam.x : b.x, y0 = b.vtiled ? cam.y : b.y;
      const x1 = b.htiled ? cam.x + cam.w : b.x + t.width, y1 = b.vtiled ? cam.y + cam.h : b.y + t.height;
      r.quad(t, x0, y0, x1, y0, x1, y1, x0, y1, x0 - b.x, y0 - b.y, x1 - b.x, y1 - b.y, 0xffffffff);
    }
    const vx0 = cam.x, vy0 = cam.y, vx1 = cam.x + cam.w, vy1 = cam.y + cam.h;
    let drawn = 0;
    for (const i of this.instances) {
      const bb = spriteBounds(this.assets, i.sprite, i.x, i.y, i.sx, i.sy);
      if (!bb || bb[2] < vx0 || bb[0] > vx1 || bb[3] < vy0 || bb[1] > vy1) continue;
      if (drawSprite(r, this.assets, i.sprite, i.imageIndex, i.x, i.y, i.sx, i.sy, i.rot, i.colour, i.alpha)) drawn++;
    }
    this.drawn = drawn;
  }
}
