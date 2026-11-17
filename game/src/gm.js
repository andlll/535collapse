// Funzioni matematiche di GameMaker (GMS 1.x) usate dal gioco.
// Angoli in gradi, in senso antiorario, con y verso il basso: 0 = destra,
// 90 = su [I, convenzione del motore; confermata dal gioco: "phase" 1..8 da
// direction, ally_warrior Step azione 2, e le sprite ww4x = direzione 0].

import { datan2, dcos, dhypot, dsin } from "./dmath.js"; // §9.152
import { simRandom } from "./rng.js"; // §9.152

const D2R = Math.PI / 180;

export const lengthdirX = (len, dir) => dcos(dir * D2R) * len;
export const lengthdirY = (len, dir) => -dsin(dir * D2R) * len;
export const pointDistance = (x1, y1, x2, y2) => dhypot(x2 - x1, y2 - y1);

export function pointDirection(x1, y1, x2, y2) {
  if (x1 === x2 && y1 === y2) return 0;
  const a = datan2(-(y2 - y1), x2 - x1) / D2R;
  return a < 0 ? a + 360 : a + 0; // + 0: niente -0
}

export const degtorad = (d) => d * D2R;

export function irandomRange(a, b) {
  return a + Math.floor(simRandom() * (b - a + 1));
}

// div di GML: divisione intera troncata verso lo zero
export const div = (a, b) => Math.trunc(a / b);
