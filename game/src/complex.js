// [§9.29, segnalazione dell'autore] Il complesso del monastero del livello
// 3 come un unico edificio. Il monastero (corpo) ha accanto il muro del
// cortile e la casetta (monastero_muro, monastero_casetta: ostacoli
// neutri, natural_parent), e il muro chiude il cortile davanti al corpo:
// i civili mandati a ripararlo e i nemici che volevano incendiarlo
// puntavano al corpo, si fermavano contro il muro del cortile e non lo
// raggiungevano mai (riparava solo chi arrivava da dietro o dal fianco
// sinistro). In piu' la maschera e' solo la base: un clic sul tetto non
// era un clic sul monastero.
// Ora i pezzi (`parts`, legati nel Create del monastero) contano come il
// monastero: un civile ripara toccandone uno qualunque, un nemico lo
// incendia da 70 px da uno qualunque e la freccia incendiaria che ne colpisce
// uno colpisce il monastero; il puntatore e' sul monastero sopra la base di
// ogni pezzo e sopra tutto quello che lo sprite disegna al di sopra di
// essa (tetti, cortile).

const PARTS = ["monastero_muro", "monastero_casetta"];
const NEAR = 700; // i pezzi del complesso: entro 700 px dall'origine del corpo

// Nel Create del monastero: i pezzi accanto a lui.
export function linkParts(w, b) {
  b.parts = [];
  for (const n of PARTS) {
    for (const o of w.all(n)) {
      if (!o.alive || Math.hypot(o.x - b.x, o.y - b.y) > NEAR) continue;
      o.complex = b;
      b.parts.push(o);
    }
  }
}

// L'edificio se e' un complesso (ha dei pezzi), se no null.
export const complexOf = (b) => (b && b.alive && b.parts && b.parts.length ? b : null);

const pieces = (b) => [b, ...b.parts.filter((o) => o.alive)];

// Punti della maschera di un pezzo (righe ogni 8 px, un punto ogni 16 px e
// gli estremi di ogni tratto), in coordinate di room: i pezzi non si
// muovono, si calcolano una volta.
const SAMPLES = new WeakMap(), SP = new Float64Array(64);
function samples(w, o) {
  let s = SAMPLES.get(o);
  if (s) return s;
  s = [];
  const bb = w.bbox(o);
  if (bb) {
    for (let y = Math.floor(bb[1]); y < bb[3]; y += 8) {
      const n = w._spans(o, o.x, o.y, bb, y, bb[0], bb[2] + 1, SP);
      for (let k = 0; k < n; k += 2) {
        for (let x = SP[k]; x < SP[k + 1]; x += 16) s.push(x, y);
        s.push(SP[k + 1] - 1, y);
      }
    }
  }
  SAMPLES.set(o, s);
  return s;
}

// Il punto del complesso piu' vicino a (x, y) e la sua distanza: [px, py, d].
// `avoid`: punti [x, y] (chi ci lavora gia') da cui stare ad almeno AVOID
// px; se non ne resta nessuno, il piu' vicino comunque.
const AVOID = 40;
export function complexPoint(w, x, y, b, avoid = null) {
  let bx = b.x, by = b.y, bd = Infinity;
  for (const o of pieces(b)) {
    const s = samples(w, o);
    for (let k = 0; k < s.length; k += 2) {
      const d = (s[k] - x) ** 2 + (s[k + 1] - y) ** 2;
      if (d >= bd) continue;
      if (avoid && avoid.some(([ax, ay]) => (s[k] - ax) ** 2 + (s[k + 1] - ay) ** 2 < AVOID * AVOID)) continue;
      bd = d; bx = s[k]; by = s[k + 1];
    }
  }
  if (bd === Infinity && avoid) return complexPoint(w, x, y, b);
  return [bx, by, Math.sqrt(bd)];
}

// La maschera di `i` a meno di r px (in orizzontale e in verticale) da un
// pezzo del complesso: maschere precise.
export function complexNear(w, i, b, r) {
  const a = w.bbox(i);
  if (!a) return false;
  for (const o of pieces(b)) {
    if (w.collisionRectangle(a[0] - r, a[1] - r, a[2] + r, a[3] + r, null, true, null, o)) return true;
  }
  return false;
}

// Il campo dei civili verso il complesso: parte da tutte le celle libere
// che toccano un suo pezzo (pathing.js, goalFieldAround); solo gli
// ostacoli fissi, come i civili verso il loro posto attorno a una risorsa
// (§9.23). Tenuto finche' gli ostacoli non cambiano.
const FIELDS = new WeakMap();
export function complexField(p, b) {
  const c = FIELDS.get(b);
  if (c && c.ver === p.solidVer) return c.f;
  const cells = [];
  for (const o of pieces(b)) cells.push(...p._cellsOf(o));
  const f = p.goalFieldAround(cells);
  FIELDS.set(b, { ver: p.solidVer, f });
  return f;
}

// Il puntatore sul complesso: sulla base di un pezzo o sopra di essa, dentro
// lo sprite del pezzo (per ogni colonna, fino al punto piu' basso della
// base in quella colonna).
const BOTTOMS = new WeakMap();
function bottoms(w, o) {
  let c = BOTTOMS.get(o);
  if (c) return c;
  c = new Map();
  const bb = w.bbox(o);
  if (bb) {
    for (let y = Math.floor(bb[1]); y < bb[3]; y++) {
      const n = w._spans(o, o.x, o.y, bb, y, bb[0], bb[2] + 1, SP);
      for (let k = 0; k < n; k += 2) for (let x = Math.floor(SP[k]); x < SP[k + 1]; x++) c.set(x, y);
    }
  }
  BOTTOMS.set(o, c);
  return c;
}

export function complexPointOver(i, w, mx, my) {
  if (!complexOf(i)) return w.pointIn(i, mx, my);
  for (const o of pieces(i)) {
    if (w.pointIn(o, mx, my)) return true;
    const m = w.maskOf(o);
    if (!m || !m.size) continue;
    const left = o.x - m.origin[0], top = o.y - m.origin[1];
    if (mx < left || mx >= left + m.size[0] || my < top) continue;
    const bottom = bottoms(w, o).get(Math.floor(mx));
    if (bottom !== undefined && my <= bottom) return true;
  }
  return false;
}
