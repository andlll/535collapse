// Linea di tiro degli arcieri (§6.4): bersaglio con la linea libera,
// punto di tiro nei paraggi, frecce che si fermano contro gli edifici.
// Usato dall'arciere alleato e dalle frecce (ranged.js) e dall'arciere
// nemico (enemies.js).

import { pointDirection, pointDistance } from "./gm.js";
import { GRID, walkLine } from "./pathing.js";

// [Richiesta dell'autore] Gli arcieri (alleati e nemici) tirano solo se fra
// loro e il bersaglio non ci sono edifici (world.shotClear: le unita' non
// contano). Se ci sono nemici a tiro ma nessuno in linea, l'arciere cerca
// un punto vicino da cui tirare, senza allontanarsi piu' di LEASH px dal
// punto in cui ha cominciato a combattere (anchorX/anchorY: lo cancellano
// un ordine del giocatore e la fine del combattimento). Torri, castello e
// centro tirano come prima (sono in alto).

export const LEASH = 250;       // quanto puo' spostarsi per trovare una linea di tiro
export const REPOS_WAIT = 30;   // passi fra una ricerca fallita e la successiva

// Il bersaglio: fra le istanze di `name` a tiro (inRange), la piu' vicina
// (per origine, come instance_nearest) con la linea di tiro libera.
export function shootable(w, i, name, inRange) {
  const c = [];
  for (const o of w.all(name)) if (inRange(o)) c.push(o);
  c.sort((a, b) => ((a.x - i.x) ** 2 + (a.y - i.y) ** 2) - ((b.x - i.x) ** 2 + (b.y - i.y) ** 2));
  for (const o of c) if (w.shotClear(i.x, i.y, o.x, o.y)) return o;
  return null;
}

// Un punto da cui tirare a `t`: su anelli di 48-240 px attorno all'arciere
// (16 direzioni), entro LEASH dall'ancora, libero, raggiungibile a piedi in
// linea retta, a meno di `range` px da t e con la linea di tiro libera; il
// piu' vicino all'arciere (poi al bersaglio). null se non ce n'e'.
export function firingSpot(w, p, i, t, range) {
  if (i.anchorX === null || i.anchorX === undefined) { i.anchorX = i.x; i.anchorY = i.y; }
  for (const r of [48, 96, 144, 192, 240]) {
    let best = null, bd = Infinity;
    for (let a = 0; a < 16; a++) {
      const x = Math.round(i.x + Math.cos((a * Math.PI) / 8) * r), y = Math.round(i.y + Math.sin((a * Math.PI) / 8) * r);
      if (pointDistance(x, y, i.anchorX, i.anchorY) > LEASH) continue;
      const d = pointDistance(x, y, t.x, t.y);
      if (d > range || d >= bd) continue;
      const gx = Math.floor(x / GRID), gy = Math.floor(y / GRID);
      if (!p.inside(gx, gy) || p.cost[gy * p.gw + gx] >= 1000) continue;
      if (!w.placeFree(i, x, y) || !walkLine(p, i.x, i.y, x, y) || !w.shotClear(x, y, t.x, t.y)) continue;
      best = [x, y]; bd = d;
    }
    if (best) return best;
  }
  return null;
}

// La freccia di un arciere parte 40 px in alto e scende verso i piedi del
// bersaglio: `flight` ricorda il punto a terra di partenza e quello
// d'arrivo. In volo, il punto a terra sotto la freccia dentro un edificio
// la ferma (i primi 20 px no, come per la linea di tiro).
export function aimArrow(b, i, t) {
  b.direction = pointDirection(b.x, b.y, t.x, t.y);
  b.flight = { sx: b.x, sy: b.y, len: Math.max(1, pointDistance(b.x, b.y, t.x, t.y)) };
}

export function arrowStopped(i, w) {
  const f = i.flight;
  if (!f) return false;
  const run = pointDistance(f.sx, f.sy, i.x, i.y);
  if (run < 20) return false;
  const gx = i.x, gy = i.y + 40 * Math.max(0, 1 - run / f.len);
  return !!w._eachNear([gx, gy, gx, gy], (o) => (w.blocksShots(o) && w.pointIn(o, gx, gy) ? o : null));
}

