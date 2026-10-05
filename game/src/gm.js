// Funzioni matematiche di GameMaker (GMS 1.x) usate dal gioco.
// Angoli in gradi, in senso antiorario, con y verso il basso: 0 = destra,
// 90 = su [I, convenzione del motore; confermata dal gioco: "phase" 1..8 da
// direction, ally_warrior Step azione 2, e le sprite ww4x = direzione 0].

const D2R = Math.PI / 180;

export const lengthdirX = (len, dir) => Math.cos(dir * D2R) * len;
export const lengthdirY = (len, dir) => -Math.sin(dir * D2R) * len;
export const pointDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export function pointDirection(x1, y1, x2, y2) {
  if (x1 === x2 && y1 === y2) return 0;
  const a = Math.atan2(-(y2 - y1), x2 - x1) / D2R;
  return a < 0 ? a + 360 : a + 0; // + 0: niente -0
}

export const degtorad = (d) => d * D2R;

export function irandomRange(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

// div di GML: divisione intera troncata verso lo zero
export const div = (a, b) => Math.trunc(a / b);
