// Sistemi di particelle "alla GameMaker" (part_system_*, part_type_*,
// part_emitter_*), per portare riga per riga il codice che li usa: pioggia,
// fuoco degli edifici e delle frecce, bracieri, erba e spighe, semi.
//
// Semantica [I, runner GMS 1.x e export HTML5, da confermare a occhio]:
// - un tipo ha intervalli [min, max] da cui ogni particella pesca alla
//   nascita (vita, dimensione, velocita', direzione, orientamento), piu'
//   incrementi per passo e un "wiggle" (oscillazione attorno al valore);
// - colore e alpha: 1 valore fisso, 2 o 3 valori interpolati sulla vita;
//   colour_mix e colour_rgb pescano un colore fisso alla nascita;
// - gravita': si somma come vettore al moto a ogni passo;
// - il sistema si aggiorna da solo una volta per passo (prima le emissioni
//   continue, poi il moto) e si disegna da solo alla sua depth, dalle
//   particelle piu' vecchie alle piu' nuove; blend additivo per tipo;
// - stream di n per passo: n<0 vuol dire una particella con probabilita'
//   1/|n|; un n frazionario positivo nel runner HTML5 vale ceil(n) (il ciclo
//   e' `for (i=0; i<n; i++)`);
// - regioni dell'emettitore: rettangolo, ellisse, rombo, linea;
//   distribuzione lineare, gaussiana (piu' fitta al centro), gaussiana
//   inversa (piu' fitta ai bordi);
// - le forme interne (pt_shape_flare, line, pixel) sono texture 64x64:
//   dimensione 1 = 64 px. Qui stanno nell'atlas gui (tools/05_atlas.py).
//
// Le particelle sono oggetti riciclati da un'unica riserva comune a tutti i
// sistemi (niente allocazioni durante il gioco); ogni sistema le tiene in
// ordine di nascita.
//
// Opzioni grafiche (menu di pausa): ogni sistema ha una categoria (`cat`:
// "rain", "grass", "fire"); i sistemi di una categoria spenta non si
// aggiornano e non si disegnano (le particelle restano dove sono e
// ricompaiono riaccendendola). Solo estetica: il gioco non legge mai le
// particelle.

import { lengthdirX, lengthdirY, pointDirection } from "./gm.js";
import { mergeColour } from "./colours.js";
import { drawSprite } from "./sprites.js";

const SHAPES = { flare: "__pt_flare", line: "__pt_line", pixel: "__pt_pixel" };
const TAU = Math.PI * 2;

const rand = (a, b) => a + Math.random() * (b - a);

// Tipo di particella: le proprieta' hanno i nomi delle funzioni part_type_*.
// size/speed/direction/orientation: [min, max, incr, wiggle(, relativo)].
export function partType(p = {}) {
  return {
    shape: null, sprite: null,
    size: [1, 1, 0, 0], scale: [1, 1],
    orientation: [0, 0, 0, 0, false],
    colour: null, alpha: [1],
    speed: [0, 0, 0, 0], direction: [0, 0, 0, 0], gravity: [0, 270],
    life: [100, 100], additive: false,
    ...p,
  };
}

// Valore in [0,1] con la distribuzione dell'emettitore [I]
function distr(kind) {
  if (kind === "gaussian") return (Math.random() + Math.random() + Math.random()) / 3;
  if (kind === "invgaussian") {
    const v = (Math.random() + Math.random() + Math.random()) / 3;
    return v < 0.5 ? v + 0.5 : v - 0.5;
  }
  return Math.random();
}

export class Particles {
  constructor() {
    this.hidden = new Set(); // categorie spente
    this.density = {};       // categoria -> frazione disegnata (§7.15 G5)
    this.systems = [];
    this.pool = [];
    this.seq = 0;
    this.count = 0; // particelle vive, per la diagnostica
  }

  // ------------------------------------------------------------ sistemi

  systemCreate(depth = 0, cat = null) {
    // automatic: si aggiorna da solo; autoDraw: si disegna da solo alla sua
    // depth (part_system_automatic_update / _draw)
    const ps = { id: ++this.seq, depth, cat, parts: [], emitters: [], alive: true, automatic: true, autoDraw: true, release: false };
    this.systems.push(ps);
    return ps;
  }

  systemDestroy(ps) {
    if (!ps || !ps.alive) return;
    ps.alive = false;
    for (const q of ps.parts) this.pool.push(q);
    this.count -= ps.parts.length;
    ps.parts.length = 0;
    ps.emitters.length = 0;
  }

  systemClear(ps) {
    if (!ps || !ps.alive) return;
    for (const q of ps.parts) this.pool.push(q);
    this.count -= ps.parts.length;
    ps.parts.length = 0;
  }

  exists(ps) { return !!ps && ps.alive; }

  // [Deviazione, solo memoria] un sistema creato per un solo burst e mai
  // distrutto (la fiammata delle frecce incendiarie) sparisce quando non ha
  // piu' particelle, invece di restare vuoto per sempre.
  releaseWhenEmpty(ps) { ps.release = true; }

  // ----------------------------------------------------------- emettitori

  emitterCreate(ps) {
    const em = { x1: 0, x2: 0, y1: 0, y2: 0, shape: "rectangle", distr: "linear", type: null, n: 0 };
    if (ps && ps.alive) ps.emitters.push(em);
    return em;
  }

  region(em, x1, x2, y1, y2, shape = "rectangle", dist = "linear") {
    Object.assign(em, { x1, x2, y1, y2, shape, distr: dist });
  }

  stream(em, type, n) { em.type = type; em.n = n; }

  burst(ps, em, type, n) {
    if (!ps || !ps.alive) return;
    for (let k = 0; k < n; k++) {
      const [x, y] = this._point(em);
      this._spawn(ps, type, x, y);
    }
  }

  // part_particles_create
  create(ps, x, y, type, n) {
    if (!ps || !ps.alive) return;
    for (let k = 0; k < n; k++) this._spawn(ps, type, x, y);
  }

  _point(em) {
    const { x1, x2, y1, y2 } = em;
    if (em.shape === "line") {
      const t = distr(em.distr);
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    }
    for (let tries = 0; tries < 20; tries++) {
      const u = distr(em.distr), v = distr(em.distr);
      const dx = u * 2 - 1, dy = v * 2 - 1;
      if (em.shape === "ellipse" && dx * dx + dy * dy > 1) continue;
      if (em.shape === "diamond" && Math.abs(dx) + Math.abs(dy) > 1) continue;
      return [x1 + u * (x2 - x1), y1 + v * (y2 - y1)];
    }
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  _spawn(ps, t, x, y) {
    const q = this.pool.pop() || {};
    q.t = t;
    q.x = x; q.y = y;
    q.age = 0;
    q.life = rand(t.life[0], t.life[1]);
    q.size = rand(t.size[0], t.size[1]);
    q.speed = rand(t.speed[0], t.speed[1]);
    q.dir = rand(t.direction[0], t.direction[1]);
    q.ang = rand(t.orientation[0], t.orientation[1]);
    q.ph = Math.random();             // fase del wiggle
    q.per = 16 + 16 * Math.random();  // periodo del wiggle in passi [I]
    const c = t.colour;
    q.col = c && c.mix ? mergeColour(c.mix[0], c.mix[1], Math.random())
      : c && c.rgb ? (Math.round(rand(c.rgb[0], c.rgb[1])) | (Math.round(rand(c.rgb[2], c.rgb[3])) << 8)
                      | (Math.round(rand(c.rgb[4], c.rgb[5])) << 16))
      : 0xffffff;
    ps.parts.push(q);
    this.count++;
  }

  // -------------------------------------------------------------- passo

  _wig(q, amount) {
    return amount ? amount * Math.sin(TAU * (q.age / q.per + q.ph)) : 0;
  }

  step() {
    let anyDead = false;
    for (const ps of this.systems) {
      if (!ps.alive) { anyDead = true; continue; }
      if (!ps.automatic || this.hidden.has(ps.cat)) continue;
      for (const em of ps.emitters) {
        if (!em.type || !em.n) continue;
        if (em.n < 0) { if (Math.random() * -em.n < 1) this.burst(ps, em, em.type, 1); }
        else this.burst(ps, em, em.type, Math.ceil(em.n));
      }
      const parts = ps.parts;
      let n = 0;
      for (let k = 0; k < parts.length; k++) {
        const q = parts[k], t = q.t;
        q.age++;
        if (q.age >= q.life) { this.pool.push(q); this.count--; continue; }
        if (t.size[2]) { q.size += t.size[2]; if (q.size < 0) q.size = 0; }
        if (t.orientation[2]) q.ang += t.orientation[2];
        if (t.speed[2]) { q.speed += t.speed[2]; if (q.speed < 0) q.speed = 0; }
        if (t.direction[2]) q.dir += t.direction[2];
        if (t.gravity[0]) {
          const vx = lengthdirX(q.speed, q.dir) + lengthdirX(t.gravity[0], t.gravity[1]);
          const vy = lengthdirY(q.speed, q.dir) + lengthdirY(t.gravity[0], t.gravity[1]);
          q.speed = Math.hypot(vx, vy);
          q.dir = pointDirection(0, 0, vx, vy);
        }
        if (q.speed || t.speed[3]) {
          const sp = q.speed + this._wig(q, t.speed[3]), dir = q.dir + this._wig(q, t.direction[3]);
          q.x += lengthdirX(sp, dir);
          q.y += lengthdirY(sp, dir);
        }
        parts[n++] = q;
      }
      parts.length = n;
      if (ps.release && !n) { ps.alive = false; anyDead = true; }
    }
    if (anyDead) this.systems = this.systems.filter((ps) => ps.alive);
  }

  // ------------------------------------------------------------ disegno

  // Sistemi da disegnare da soli, in ordine di depth (piu' alta prima; a
  // pari depth in ordine di creazione).
  sorted() {
    return this.systems.filter((ps) => ps.autoDraw && ps.parts.length && !this.hidden.has(ps.cat))
      .sort((a, b) => b.depth - a.depth || a.id - b.id);
  }

  // part_system_drawit / disegno automatico. `cam` per scartare cio' che e'
  // fuori dalla view.
  draw(ps, r, assets, cam) {
    if (!ps || !ps.alive || !ps.parts.length || this.hidden.has(ps.cat)) return;
    const x0 = cam.x, y0 = cam.y, x1 = cam.x + cam.w, y1 = cam.y + cam.h;
    // [§7.15 G5] densita' della categoria (opzione Qualita'): si disegna
    // sempre lo stesso sottoinsieme, scelto dalla fase del wiggle
    // (uniforme in [0, 1) e fissata alla nascita), quindi niente sfarfallio
    const dens = this.density[ps.cat] ?? 1;
    let blend = null;
    for (const q of ps.parts) {
      if (dens < 1 && q.ph >= dens) continue;
      const t = q.t;
      const size = q.size + this._wig(q, t.size[3]);
      // raggio per eccesso: le forme sono 64x64, gli sprite fino a ~128
      const rad = 96 * size * Math.max(Math.abs(t.scale[0]), Math.abs(t.scale[1]));
      if (q.x + rad < x0 || q.x - rad > x1 || q.y + rad < y0 || q.y - rad > y1) continue;
      const want = t.additive ? "add" : "normal";
      if (want !== blend) { r.setBlend(want); blend = want; }
      const f = q.age / q.life;
      const c = t.colour;
      let col = q.col;
      if (c && c.list) col = lerpList(c.list, f, mergeColour);
      const a = t.alpha.length === 1 ? t.alpha[0] : lerpList(t.alpha, f, (u, v, k) => u + (v - u) * k);
      if (a <= 0) continue;
      const ang = q.ang + this._wig(q, t.orientation[3]) + (t.orientation[4] ? q.dir : 0);
      const name = t.sprite ? t.sprite : SHAPES[t.shape];
      drawSprite(r, assets, name, 0, q.x, q.y, size * t.scale[0], size * t.scale[1], ang, col, Math.min(1, a));
    }
    if (blend !== "normal") r.setBlend("normal");
  }
}

// 1, 2 o 3 valori lungo la vita (part_type_colour1/2/3, alpha1/2/3)
function lerpList(list, f, lerp) {
  if (list.length === 1) return list[0];
  if (list.length === 2) return lerp(list[0], list[1], f);
  return f < 0.5 ? lerp(list[0], list[1], f * 2) : lerp(list[1], list[2], f * 2 - 1);
}
