// Gli usi delle particelle (particles.js) nel gioco, coi numeri del GML:
// pioggia (manager), fiamme degli edifici in fuoco e fiammata delle frecce
// incendiarie, bracieri e torce, erba e spighe decorative, campi (spighe,
// campo bruciato, germogli del cantiere), semi lanciati dal seminatore,
// aquila. Le particelle stanno in w.particles (app.js).

import { c, makeColourRgb } from "./colours.js";
import { partType } from "./particles.js";
import { lengthdirX } from "./gm.js";
import { windLevel } from "./ambience.js";

const P = (w) => w.particles;

// ------------------------------------------------------------- pioggia

// manager Alarm_4 [C]: sistema a depth -9000, gocce (linee inclinate)
// emesse lungo il bordo alto della room, 6 a passo. L'orientamento e'
// relativo alla direzione (ultimo argomento `true` di
// part_type_orientation): 160-170 gradi in piu' dei 250-260 del moto, cioe'
// linee quasi parallele alla caduta (§6.1 n.77: prima era assoluto e le
// gocce cadevano di traverso).
// [§7.9, richiesta dell'autore] gocce 2,5 volte piu' spesse (stessa
// lunghezza): a 1,5-2,5 px si vedevano poco.
// [§9.12, richiesta dell'autore] l'originale le colorava di marrone chiaro
// (part_type_colour_rgb 131-148, 101-119, 74-107 [C]): ora grigio-azzurro
// chiaro e semitrasparenti, come gli anelli sul fiume.
const GOCCIA = partType({
  shape: "line", orientation: [160, 170, 0, 0, true], size: [0.3, 0.5, 0, 0], scale: [1, 2.5],
  colour: { rgb: [170, 195, 185, 205, 200, 222] }, alpha: [0.55], speed: [18, 21, 0.1, 0], direction: [250, 260, 0, 0],
  life: [200, 300],
});

// [§9.90, richiesta dell'autore] col vento della partita (ambience.js
// windLevel) la pioggia e' piu' inclinata: la direzione scende da 250-260 a
// 235-245 gradi (le linee restano parallele alla caduta: orientamento
// relativo). Il bordo da cui nasce si allunga a destra di quanto le gocce
// derivano a sinistra cadendo per tutta la room (prima 300 px fissi: in
// basso a destra non pioveva), con piu' gocce a passo in proporzione.
const RAIN_SLANT = 15;
export function rainStart(w) {
  const ps = P(w).systemCreate(-9000, "rain");
  const em = P(w).emitterCreate(ps);
  const d = 255 - RAIN_SLANT * windLevel(w.g), lo = (d - 5) * Math.PI / 180;
  const type = { ...GOCCIA, direction: [d - 5, d + 5, 0, 0] };
  const right = Math.max(300, Math.ceil(w.roomH * Math.abs(Math.cos(lo) / Math.sin(lo))));
  P(w).region(em, 0, w.roomW + right, -16, -16, "line", "linear");
  // [§9.91] niente flusso automatico: le gocce le fa nascere rainStep, in
  // proporzione a ps.level (em.full: quelle a passo con la pioggia piena)
  em.type = type; em.full = Math.round(6 * (w.roomW + right) / (w.roomW + 300));
  ps.level = 0;
  return ps;
}

// [§9.91, richiesta dell'autore] Le gocce crescono e calano piano: con
// global.raining=1 e il cielo ormai del tutto coperto (ambience.js
// overcastStep, ~6 s) ps.level sale da 0 a 1 in RAIN_RAMP passi (5 s);
// smesso di piovere scende a 0 negli stessi 5 s, e solo dopo il cielo si
// rasserena. Le gocce gia' in aria finiscono di cadere (il sistema si toglie
// quando e' vuoto; prima spariva di colpo). Restituisce il sistema, o null
// quando e' finito (manager.rain). Il livello si salva col sistema; i
// salvataggi di prima (flusso automatico) ripartono a pioggia piena.
// [§9.92, richiesta dell'autore] I fuochi li spegne (manager alarm 2) solo
// con ps.level ad almeno RAIN_PUT_OUT: ~2,5 s dopo le prime gocce, fino a
// ~2,5 s dopo che hanno cominciato a calare. Il livello non dipende dalle
// opzioni grafiche (con la pioggia spenta nelle opzioni sale e scende lo
// stesso, senza gocce).
const RAIN_RAMP = 300;
export const RAIN_PUT_OUT = 0.5;
export function rainStep(w, ps) {
  if (!ps || !ps.alive) return null;
  const P_ = P(w), em = ps.emitters[0];
  if (ps.level === undefined) { ps.level = 1; if (em) { em.full = em.n; em.n = 0; } }
  const up = w.g.raining === 1 && w.overcast === 1;
  ps.level = Math.max(0, Math.min(1, ps.level + (up ? 1 : -1) / RAIN_RAMP));
  if (ps.level === 0 && w.g.raining !== 1) {
    if (P_.hidden.has(ps.cat)) P_.systemDestroy(ps); else P_.releaseWhenEmpty(ps);
    return null;
  }
  if (em && em.full && ps.level > 0 && !P_.hidden.has(ps.cat)) {
    const r = em.full * ps.level;
    P_.burst(ps, em, em.type, Math.floor(r) + (Math.random() < r % 1 ? 1 : 0));
  }
  return ps;
}

// [§8.13, richiesta dell'autore] Anelli delle gocce sul fiume quando
// piove: a ogni passo, RIPPLE_TRIES punti a caso nella view; dove c'e'
// acqua (la mappa dell'acqua degli sprite del fiume, tools/06_masks.py)
// nasce un anello (pt_shape_ring) schiacciato come il resto della vista
// isometrica, che si allarga e sbiadisce. [§9.36] Sopra il pezzo di fiume
// su cui cade (waterSystem; era a depth -21, sotto il fiume);
// categoria "rain" (spento con la pioggia nelle opzioni grafiche).
const RIPPLE_TRIES = 36;
const ANELLO = partType({
  shape: "ring", size: [0.06, 0.1, 0.014, 0], scale: [1, 0.5],
  colour: { rgb: [215, 235, 225, 245, 230, 250] }, alpha: [0.95, 0.6, 0], life: [32, 44],
});
const ANELLO2 = partType({
  shape: "ring", size: [0.02, 0.03, 0.009, 0], scale: [1, 0.5],
  colour: { rgb: [215, 235, 225, 245, 230, 250] }, alpha: [0.8, 0.4, 0], life: [26, 34],
});

// Mappa dell'acqua della room in celle da 8 px, dalle istanze del fiume
// (una volta: sono ferme). null se nella room non c'e' acqua.
// [§9.36] owner: per ogni cella il pezzo di fiume che la disegna (fra due
// sovrapposti quello disegnato dopo, depth piu' bassa), in pieces.
function waterMap(w) {
  if (w._water !== undefined) return w._water;
  const C = 8, gw = Math.ceil(w.roomW / C), gh = Math.ceil(w.roomH / C);
  let grid = null, owner = null;
  const pieces = [], angles = [];
  for (const i of w.instances) {
    const m = i.alive && i.sprite_index && w.masks[i.sprite_index];
    const wt = m && m.water;
    if (!wt) continue;
    if (!grid) { grid = new Uint8Array(gw * gh); owner = new Int32Array(gw * gh).fill(-1); }
    const pi = pieces.push(i) - 1;
    const st = [0, 0, 0, 0, 0, 0]; // n, x, y, xx, yy, xy delle celle d'acqua
    const raw = atob(wt.bits), sx = i.image_xscale || 1, sy = i.image_yscale || 1;
    const [ox, oy] = m.origin;
    // [§9.7] il fiume puo' essere ruotato (image_angle, come in drawSprite)
    const t = (i.image_angle || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    // ogni cella della room il cui centro cade su una cella d'acqua dello sprite
    const lx0 = (0 - ox) * sx, lx1 = (m.size[0] - ox) * sx, ly0 = (0 - oy) * sy, ly1 = (m.size[1] - oy) * sy;
    const xs = [lx0 * c + ly0 * s, lx1 * c + ly0 * s, lx0 * c + ly1 * s, lx1 * c + ly1 * s];
    const ys = [-lx0 * s + ly0 * c, -lx1 * s + ly0 * c, -lx0 * s + ly1 * c, -lx1 * s + ly1 * c];
    const x0 = i.x + Math.min(...xs), x1 = i.x + Math.max(...xs), y0 = i.y + Math.min(...ys), y1 = i.y + Math.max(...ys);
    const cx0 = Math.max(0, Math.floor(x0 / C)), cx1 = Math.min(gw - 1, Math.floor(x1 / C));
    const cy0 = Math.max(0, Math.floor(y0 / C)), cy1 = Math.min(gh - 1, Math.floor(y1 / C));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const dx = (cx + 0.5) * C - i.x, dy = (cy + 0.5) * C - i.y;
        const lx = (dx * c - dy * s) / sx + ox, ly = (dx * s + dy * c) / sy + oy;
        const kx = Math.floor(lx / wt.cell), ky = Math.floor(ly / wt.cell);
        if (kx < 0 || ky < 0 || kx >= wt.w || ky >= wt.h) continue;
        const k = ky * wt.w + kx;
        if (raw.charCodeAt(k >> 3) & (1 << (k & 7))) {
          const c2 = cy * gw + cx;
          grid[c2] = 1;
          if (owner[c2] === -1 || pieces[owner[c2]].depth > i.depth) owner[c2] = pi;
          st[0]++; st[1] += cx; st[2] += cy; st[3] += cx * cx; st[4] += cy * cy; st[5] += cx * cy;
        }
      }
    }
    // [§9.36] la direzione del pezzo (asse principale delle sue celle
    // d'acqua), in gradi come GameMaker (y verso l'alto)
    const [n, sx_, sy_, sxx, syy, sxy] = st;
    const vx = sxx / n - (sx_ / n) ** 2, vy = syy / n - (sy_ / n) ** 2, cxy = sxy / n - (sx_ / n) * (sy_ / n);
    angles.push(n ? -0.5 * Math.atan2(2 * cxy, vx - vy) * 180 / Math.PI : 0);
  }
  w._water = grid ? { C, gw, gh, grid, owner, pieces, angles } : null;
  return w._water;
}

// [§9.36] Il sistema di particelle di un tipo (kind) sul pezzo di fiume che
// contiene (x, y): appena sopra di lui (depth del pezzo - 0,5). I pezzi di
// fiume hanno depth -y [C, fiume_* Create]: a depth fissa (-21) le
// particelle si disegnavano prima del fiume, che le copriva (anche gli
// anelli della pioggia, §8.13: si vedevano solo oltre la riva). null se
// (x, y) non e' acqua.
function waterAngle(wm, x, y) {
  return wm.angles[wm.owner[Math.floor(y / wm.C) * wm.gw + Math.floor(x / wm.C)]] || 0;
}

function waterSystem(w, wm, kind, cat, x, y) {
  const cx = Math.floor(x / wm.C), cy = Math.floor(y / wm.C);
  if (cx < 0 || cy < 0 || cx >= wm.gw || cy >= wm.gh || !wm.grid[cy * wm.gw + cx]) return null;
  const piece = wm.pieces[wm.owner[cy * wm.gw + cx]];
  const key = kind + ":" + piece.id;
  const P_ = P(w);
  const sys = wm.sys || (wm.sys = new Map());
  let ps = sys.get(key);
  if (!ps || !ps.alive) {
    ps = P_.systems.find((q) => q.alive && q.kind === key); // dopo un caricamento
    if (!ps) { ps = P_.systemCreate(piece.depth - 0.5, cat); ps.kind = key; }
    sys.set(key, ps);
  }
  return ps;
}

export function rainRipples(w, cam, level = 1) {
  const P_ = P(w);
  if (P_.hidden.has("rain")) return;
  const wm = waterMap(w);
  if (!wm) return;
  for (let k = 0, n = Math.round(RIPPLE_TRIES * level); k < n; k++) { // §9.91: quante gocce
    const x = cam.x + Math.random() * cam.w, y = cam.y + Math.random() * cam.h;
    const ps = waterSystem(w, wm, "ripples", "rain", x, y); // §9.36
    if (!ps) continue;
    P_.create(ps, x, y, ANELLO, 1);
    P_.create(ps, x, y, ANELLO2, 1);
  }
}

// [§9.36, richiesta dell'autore] L'acqua dei fiumi, al posto
// dell'animazione dell'originale (fiume_animazione: macchie di 129x106 px di
// puntini bianchi in tre fotogrammi quasi uguali, che tremolavano sul posto,
// messe a mano solo nel tutorial). Su tutta l'acqua della room (waterMap),
// senza oggetti da piazzare:
// - riflessi: trattini chiari, orientati come il pezzo di fiume (l'asse
//   principale delle sue celle d'acqua), che compaiono e svaniscono in
//   3,5-5,5 s scivolando piano lungo di lui (RIFLESSI_TRIES punti a caso
//   nella view a ogni passo);
// - increspature: ogni tanto un anello che si allarga (in media uno ogni
//   INCRESPATURA_EVERY passi nella view);
// - schiuma: puntini fermi lungo le rive (le celle d'acqua accanto alla
//   terra), creati una volta per room, che "respirano" appena.
// Sopra il pezzo di fiume che li contiene (waterSystem) e sotto chi gli sta
// davanti; di notte sotto il filtro della notte come il resto. Categoria "grass" (erba e spighe nelle opzioni grafiche: spenta,
// spegne anche questi; la qualita' ne dirada la schiuma).
const RIFLESSI_TRIES = 2, INCRESPATURA_EVERY = 40, SCHIUMA_EVERY = 3;
// (orientamento e direzione li da' il pezzo di fiume: waterLife)
const RIFLESSO = partType({
  shape: "line", size: [0.18, 0.34, 0, 0], scale: [1, 0.9],
  colour: { rgb: [245, 255, 250, 255, 252, 255] }, alpha: [0, 0.95, 0],
  speed: [0.015, 0.045, 0, 0], life: [200, 320],
});
const INCRESPATURA = partType({
  shape: "ring", size: [0.03, 0.05, 0.0035, 0], scale: [1, 0.5],
  colour: { rgb: [225, 245, 235, 250, 240, 255] }, alpha: [0.9, 0.5, 0], life: [110, 140],
});
const SCHIUMA = [0.5, 0.65].map((a) => partType({
  shape: "flare", size: [0.1, 0.2, 0, 0.006], scale: [1, 0.55],
  colour: { rgb: [228, 248, 238, 252, 242, 255] }, alpha: [a], life: [99999999, 99999999],
}));

export function waterLife(w, cam) {
  const P_ = P(w);
  if (P_.hidden.has("grass")) return;
  const wm = waterMap(w);
  if (!wm) return;
  const { C, gw, gh, grid } = wm;
  // la schiuma, una volta (i salvataggi la riportano: kind "foam:<pezzo>")
  if (!wm.foam) {
    wm.foam = true;
    if (!P_.systems.some((ps) => ps.alive && typeof ps.kind === "string" && ps.kind.startsWith("foam:"))) {
      let n = 0;
      for (let cy = 1; cy < gh - 1; cy++) {
        for (let cx = 1; cx < gw - 1; cx++) {
          const k = cy * gw + cx;
          if (!grid[k] || (grid[k - 1] && grid[k + 1] && grid[k - gw] && grid[k + gw])) continue;
          if (Math.random() * SCHIUMA_EVERY >= 1) continue;
          n++;
          const x = (cx + Math.random()) * C, y = (cy + Math.random()) * C;
          const ps = waterSystem(w, wm, "foam", "grass", x, y);
          if (ps) P_.create(ps, x, y, SCHIUMA[n % 2], 1);
        }
      }
    }
  }
  for (let k = 0; k < RIFLESSI_TRIES; k++) {
    const x = cam.x + Math.random() * cam.w, y = cam.y + Math.random() * cam.h;
    const ps = waterSystem(w, wm, "water", "grass", x, y);
    if (!ps) continue;
    P_.create(ps, x, y, RIFLESSO, 1);
    // lungo il fiume, e scivola nello stesso verso
    const q = ps.parts[ps.parts.length - 1], a = waterAngle(wm, x, y);
    q.ang = a + (Math.random() * 10 - 5);
    q.dir = a;
  }
  if (Math.random() * INCRESPATURA_EVERY < 1) {
    for (let k = 0; k < 20; k++) {
      const x = cam.x + Math.random() * cam.w, y = cam.y + Math.random() * cam.h;
      const ps = waterSystem(w, wm, "water", "grass", x, y);
      if (ps) { P_.create(ps, x, y, INCRESPATURA, 1); break; }
    }
  }
}

// ---------------------------------------------------------------- fuoco

// Fiamme degli edifici in fuoco [C, Step di ciascun edificio]: due sistemi,
// fire_ps dietro (depth -y+1) e fire_psf davanti (-y-1), con regioni e
// numeri per famiglia. Ogni passo in fiamme la vita delle fiamme davanti
// (fire_part e' l'ultimo tipo creato) cresce coi danni:
// ((A - vita)/2, (B - vita)/2). Il campo ha solo quelle dietro.
// back/front: [dx1, dx2, dy1, dy2, particelle per passo (x visible)]
const SMALL = { back: [-35, 35, -50, -45, 6], front: [-35, 35, 40, 45, 3], life: [150, 160] };
const BIG = { back: [-75, 75, -90, -85, 8], front: [-55, 55, 70, 75, 4], life: [380, 400] };
// [Segnalazione dell'autore, §9.38] La vita delle fiamme si misura dai danni
// a partire da A e B, uguali per famiglia di grandezza [C]; ma a vita piena
// la casa (120) ha fiamme di 15-20 passi e la caserma (350) di 15-25,
// mentre il magazzino (140) le aveva di 5-10, il mulino (150) di 0-5 e la
// stalla (380, anche nemica) di 0-10: in fiamme sembravano non bruciare.
// Qui A e B partono dalla loro vita come per la casa e la caserma.
export const FIRE = {
  casa: SMALL, enemy_house: SMALL,
  magazzino: { ...SMALL, life: [170, 180] }, barn: { ...SMALL, life: [180, 190] },
  caserma: BIG, enemy_caserma: BIG,
  stalla: { ...BIG, life: [410, 430] }, enemy_stalla: { ...BIG, life: [410, 430] },
  // [§9.43] gli edifici nemici nuovi, come i loro corrispondenti alleati
  enemy_magazzino: { ...SMALL, life: [170, 180] }, enemy_mulino: { ...SMALL, life: [180, 190] },
  centro: { back: [-65, 65, -100, -95, 8], front: [-65, 65, 70, 75, 4], life: [430, 460] },
  enemy_centro: { back: [-65, 65, -100, -95, 8], front: [-65, 65, 70, 75, 4], life: [430, 460] },
  // o_box: la regione dietro ha le y invertite (y-30, y-35) [C]
  o_box1: { back: [-35, 35, -30, -35, 6], front: [-35, 35, 40, 45, 3], life: [40, 50] },
  o_box2: { back: [-35, 35, -30, -35, 6], front: [-35, 35, 40, 45, 3], life: [40, 50] },
  campo: { back: [-35, 35, -5, 5, 6], front: null, life: [150, 160] },
  // [§9.11] il monastero (3000 di vita): fiamme su tutto il corpo, e la
  // loro vita cresce coi danni ma scalata (k), se no a meta' vita
  // salirebbero per centinaia di passi
  monastero: { back: [-320, 320, -200, -170, 16], front: [-300, 300, 40, 70, 8], life: [3600, 3650], k: 0.05 },
  // [§9.45] il cantiere nemico (economy.js): vita piena diversa per ogni
  // edificio, fiamme di 15-20 passi a vita piena (rel) che crescono coi danni
  enemy_cantiere: { ...SMALL, life: [30, 40], rel: true },
};

const fireType = () => partType({
  shape: "flare", size: [0.2, 0.5, 0, 0], colour: { list: [c.red, c.orange, c.yellow] }, alpha: [1, 0],
  speed: [1, 2, 0, 0], direction: [45, 135, 0, 20], life: [25, 50], additive: true,
});

function fireSystem(i, w, reg, depth) {
  const ps = P(w).systemCreate(depth, "fire");
  const t = fireType();
  const em = P(w).emitterCreate(ps);
  P(w).region(em, i.x + reg[0], i.x + reg[1], i.y + reg[2], i.y + reg[3], "rectangle", "gaussian");
  P(w).stream(em, t, reg[4] * (i.visible ? 1 : 0));
  return [ps, t];
}

// "if onfire=1 && firestarted=0 {...}; if onfire=1 && firestarted=1
// part_type_life(...)" [C].
// [Correzione decisa dall'autore, §3.17 n.60] nell'originale le fiamme
// moltiplicano per `visible` solo all'accensione: un edificio nemico
// incendiato nella nebbia restava senza fiamme anche una volta visto. Qui
// il numero si ricalcola a ogni passo.
export function fireStep(i, w, kind) {
  const F = FIRE[kind];
  if (i.onfire === 1 && i.firestarted === 0) {
    [i.fire_ps, i.fire_part] = fireSystem(i, w, F.back, -i.y + 1);
    if (F.front) [i.fire_psf, i.fire_part] = fireSystem(i, w, F.front, -i.y - 1);
    i.firestarted = 1;
  }
  if (i.firestarted === 1) {
    const v = i.visible ? 1 : 0;
    if (i.fire_ps && i.fire_ps.emitters[0]) i.fire_ps.emitters[0].n = F.back[4] * v;
    if (i.fire_psf && i.fire_psf.emitters[0]) i.fire_psf.emitters[0].n = F.front[4] * v;
  }
  if (i.onfire === 1 && i.firestarted === 1 && i.fire_part) {
    const k = F.k || 1, b = F.rel ? i.slife : 0; // §9.45 rel: dai danni, sopra la vita piena
    i.fire_part.life = [(b + F.life[0] - i.life) / 2 * k, (b + F.life[1] - i.life) / 2 * k];
  }
}

// [Correzione decisa dall'autore, §3.17 n.56] la pioggia (manager Alarm_2)
// spegneva gli edifici (onfire=0) ma lasciava le fiamme accese: qui le
// spegne come la riparazione col legno.
export function rainExtinguish(w) {
  for (const b of w.all("ally_wooden")) {
    b.onfire = 0;
    if (b.firestarted === 1) { fireStop(b, w); b.firestarted = 0; }
  }
}

// Fiamme spente: Destroy degli edifici e riparazione col legno
// (ally_omino Alarm_2) [C].
export function fireStop(i, w) {
  P(w).systemDestroy(i.fire_ps);
  P(w).systemDestroy(i.fire_psf);
  i.fire_ps = i.fire_psf = null;
}

// fire_bullet, collisione con un edificio [C]: fiammata di 300 particelle
// attorno alla freccia, a depth -y-1. Il sistema non viene mai distrutto
// nell'originale; qui sparisce quando le particelle finiscono.
const FLARE = partType({
  shape: "flare", size: [0.2, 0.5, 0, 0], colour: { list: [c.red, c.orange] }, alpha: [1, 0],
  speed: [1, 2, 0, 0], direction: [0, 355, 0, 20], life: [10, 30], additive: true,
});

export function fireFlare(w, x, y) {
  const ps = P(w).systemCreate(-y - 1, "fire");
  const em = P(w).emitterCreate(ps);
  P(w).region(em, x - 5, x + 5, y + 5, y + 5, "rectangle", "gaussian");
  P(w).burst(ps, em, FLARE, 300);
  P(w).releaseWhenEmpty(ps);
}

// ------------------------------------------------------ bracieri e torce

// firestarter / firestarter_small [C]: un braciere (props.js) emette
// fiamme solo se e' nella view e un alleato e' entro 600 px.
const BRACIERE = partType({
  shape: "flare", size: [0.2, 0.5, 0, 0],
  colour: { list: [makeColourRgb(200, 50, 0), makeColourRgb(255, 100, 0), makeColourRgb(255, 180, 0)] },
  alpha: [0.7, 0], speed: [1, 2, 0, 0], direction: [45, 135, 0, 20], life: [20, 60], additive: true,
});
const TORCIA = partType({
  shape: "flare", size: [0.2, 0.5, 0, 0], colour: { list: [c.red, c.orange, c.yellow] }, alpha: [1, 0],
  speed: [1, 2, 0, 0], direction: [45, 135, 0, 20], life: [5, 20], additive: true,
});

export function fireStarterCreate(i, w, small) {
  // firestarter: part_system_depth(-y-70); firestarter_small non la imposta
  // e resta alla depth 0 [I: valore predefinito].
  // [Correzione decisa dall'autore, §3.17 n.59] la torcia si disegnava due
  // volte (da sola alla depth 0, dietro a tutto, e nel suo Draw a -y-90):
  // qui solo nel Draw.
  i.fire_ps = P(w).systemCreate(small ? 0 : -i.y - 70, "fire");
  if (small) i.fire_ps.autoDraw = false;
  i.fire_emitter = P(w).emitterCreate(i.fire_ps);
  if (small) P(w).region(i.fire_emitter, i.x - 5, i.x + 5, i.y, i.y + 5, "rectangle", "gaussian");
  else P(w).region(i.fire_emitter, i.x - 20, i.x + 20, i.y, i.y + 10, "rectangle", "gaussian");
  i.fire_part = small ? TORCIA : BRACIERE;
  P(w).stream(i.fire_emitter, i.fire_part, 2);
}

export function fireStarterStep(i, w) {
  const cam = w.cam, inView = cam && i.x > cam.x && i.x < cam.x + cam.w && i.y > cam.y && i.y < cam.y + cam.h;
  // && cortocircuitato come in GML: l'alleato piu' vicino si cerca solo per
  // i bracieri nella view. distance_to_object(instance_nearest(x,y,ally)):
  // il braciere non ha maschera, la distanza parte dal suo punto [I]
  let near = false;
  if (inView) {
    const a = w.nearest(i.x, i.y, "ally");
    const bb = a && w.bbox(a);
    near = !!bb && Math.hypot(Math.max(0, bb[0] - i.x, i.x - bb[2]), Math.max(0, bb[1] - i.y, i.y - bb[3])) < 600;
  }
  P(w).stream(i.fire_emitter, i.fire_part, near ? 3 : 0);
}

// ---------------------------------------------- erba e spighe decorative

// burst_erba1, burst_grano1, chiazzaparticellare [C]: oggetti senza sprite
// che nel Create spargono 1700-2600 particelle immobili (vita 99999999)
// in un'ellisse di 1000x600 px, a depth -1. L'erba ondeggia (wiggle
// dell'orientamento).
// [Richiesta dell'autore, §8.17-18] come il grano dei campi (§8.16): le
// particelle si dividono in fasce orizzontali di DECOR_BAND px a depth -y
// (Particles.bands) e le unita' che ci passano in mezzo restano immerse.
// L'erba aveva un solo colore, quasi nero: part_erba (gia' verde scuro)
// tinto di un altro verde scuro; ora e' "erba_chiara" (tools/05_atlas.py,
// part_erba in grigio chiaro) in tre gruppi di verdi, dallo scuro al giallo
// (il colore a schermo e' circa l'88% di quello della particella).
const SWAY = { orientation: [-15, 15, 0, 4, false], life: [99999999, 99999999] };
const DECOR_BAND = 12;
const erba = (a, b) => partType({ sprite: "erba_chiara", size: [0.4, 0.7, 0, 0], ...SWAY, alpha: [0.35, 0.75],
                                  colour: { mix: [makeColourRgb(...a), makeColourRgb(...b)] } });
const DECOR = {
  burst_erba1: [[erba([51, 70, 36], [80, 105, 52]), 1100], [erba([80, 105, 52], [114, 132, 66]), 1000],
                [erba([114, 132, 66], [145, 155, 80]), 500]],
  burst_grano1: [[partType({ sprite: "part_crop", size: [0.4, 0.7, 0, 0], ...SWAY, alpha: [0.3, 0.7] }), 2500]],
  chiazzaparticellare: [[partType({ shape: "line", size: [0.1, 0.3, 0, 0], orientation: [85, 95, 0, 7, false],
                                    colour: { mix: [makeColourRgb(52, 94, 10), makeColourRgb(113, 151, 56)] },
                                    alpha: [1, 0.8], life: [99999999, 99999999] }), 1700]],
};
// [§9.37, richiesta dell'autore] Macchie fiorite piccole (ellisse 400x250 px):
// i fiori dell'autore (nuovi/particelle/: due papaveri e due fiori gialli,
// a meta' risoluzione con l'origine al piede dello stelo, tools/05_atlas.py)
// ondeggiano come l'erba; una tinta appena piu' scura su alcuni varia il
// tono. L'erba, dove c'e', e' quella di burst_erba1 alla stessa densita'.
// [§9.61, richiesta dell'autore] Ondeggiano meno dell'erba: l'oscillazione e'
// una rotazione attorno al piede dello stelo, e con i 4 gradi dell'erba la
// cima colorata, alta il doppio (papaveri ~79 px, gialli ~57, erba ~39),
// si spostava il doppio. Ampiezza (gradi) per sprite, un po' sotto la
// proporzione, e un ritmo piu' lento (24-48 passi invece di 16-32).
const FLOWER_SWAY = { papavero1: 1.5, papavero2: 1.5, fiore_giallo1: 2, fiore_giallo2: 2 };
const fiore = (sprite) => partType({ sprite, size: [0.45, 0.7, 0, 0], ...SWAY, alpha: [1],
                                     orientation: [-15, 15, 0, FLOWER_SWAY[sprite], false], wigglePeriod: [24, 48],
                                     colour: { mix: [makeColourRgb(255, 255, 255), makeColourRgb(220, 220, 210)] } });
const PAPAVERO = [fiore("papavero1"), fiore("papavero2")], GIALLO = [fiore("fiore_giallo1"), fiore("fiore_giallo2")];
const ERBA_PICCOLA = DECOR.burst_erba1.map(([t, n]) => [t, Math.round(n / 6)]); // 1/6 dell'area
const fiori = (list, n) => list.map((t) => [t, n]);
Object.assign(DECOR, {
  fiori_papaveri: fiori(PAPAVERO, 45),
  fiori_papaveri_erba: [...ERBA_PICCOLA, ...fiori(PAPAVERO, 32)],
  fiori_gialli_erba: [...ERBA_PICCOLA, ...fiori(GIALLO, 32)],
  fiori_prato: [...ERBA_PICCOLA, ...fiori(PAPAVERO, 18), ...fiori(GIALLO, 18)],
});
// semiassi dell'ellisse di ogni macchia
const DECOR_SIZE = { fiori_papaveri: [200, 125], fiori_papaveri_erba: [200, 125], fiori_gialli_erba: [200, 125],
                     fiori_prato: [200, 125] };
export const DECOR_OBJECTS = Object.keys(DECOR);

export function decorCreate(i, w) {
  i.sprite_index = null;
  const ps = P(w).systemCreate(-1, "grass");
  const em = P(w).emitterCreate(ps);
  const [rx, ry] = DECOR_SIZE[i.object] || [500, 300];
  P(w).region(em, i.x - rx, i.x + rx, i.y - ry, i.y + ry, "ellipse", "gaussian");
  // i gruppi in ordine sparso (l'ordine di nascita e' quello di disegno:
  // a gruppi, i verdi chiari stavano tutti sopra gli scuri)
  const list = [];
  for (const [t, n] of DECOR[i.object]) for (let k = 0; k < n; k++) list.push(t);
  for (let k = list.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [list[k], list[j]] = [list[j], list[k]];
  }
  for (const t of list) P(w).burst(ps, em, t, 1);
  i.grass_rows = P(w).bands(ps, DECOR_BAND);
}

// ---------------------------------------------------------------- campi

// campo Create [C]: 700 spighe nel rombo del campo (part_crop, alpha
// 0,3-0,7, depth -1); ora a righe, cropRows qui sotto (§8.16)
// campo Step, quando prende fuoco [C]: le spighe spariscono, 1700 spighe
// bruciate che svaniscono in 700-800 passi, sprite "campo_maggese"
const SPIGA_BRUCIATA = partType({ sprite: "part_crop", size: [0.2, 0.35, 0, 0], colour: { list: [c.black, c.black, c.gray] },
                                  orientation: [-15, 15, 0, 4, false], alpha: [0.7, 0], life: [700, 800] });

function diamond(w, ps, i, t, n) {
  const em = P(w).emitterCreate(ps);
  P(w).region(em, i.x - 145, i.x + 145, i.y - 90, i.y + 90, "diamond", "linear");
  P(w).burst(ps, em, t, n);
}

// [Richiesta dell'autore, §8.16] Il grano a righe. Prima 700 spighe sparse
// nel rombo, semitrasparenti, tutte in un sistema a depth -1: sotto ogni
// unita', il contadino ci camminava sopra. Ora righe orizzontali ogni
// CROP_ROW px, ognuna un sistema a depth -y della riga: le righe davanti al
// contadino (piu' in basso) si disegnano dopo di lui e lo coprono fino alle
// ginocchia, "immerso" nel grano. Le spighe ("spiga", tools/05_atlas.py:
// part_crop a meta' risoluzione con un contorno morbido, bruno e
// semitrasparente) sono opache, tinte di giallo, ogni 9-13 px lungo la riga;
// ondeggiano come prima. Il fondo e' "campo_grano" (la terra arata color
// paglia scuro, le spighe si staccano per tono) invece di campo1.
const CROP_ROW = 12;
const SPIGA_RIGA = partType({ sprite: "spiga", size: [0.7, 1, 0, 0], ...SWAY, alpha: [1],
                              colour: { mix: [makeColourRgb(255, 226, 150), makeColourRgb(255, 210, 118)] } });

function cropRows(i, w) {
  const rows = [];
  for (let dy = -84; dy <= 84; dy += CROP_ROW) {
    const hw = 145 * (1 - Math.abs(dy) / 90) - 8; // meta' larghezza del rombo, meno il margine
    if (hw < 4) continue;
    const y = i.y + dy;
    const ps = P(w).systemCreate(-y, "grass");
    for (let x = -hw + Math.random() * 9; x < hw; x += 9 + Math.random() * 4) {
      P(w).create(ps, i.x + x + (Math.random() * 4 - 2), y + (Math.random() * 3 - 1.5), SPIGA_RIGA, 1);
    }
    rows.push(ps);
  }
  return rows;
}

export function campoCreate(i, w) {
  i.sprite_index = "campo_grano";
  i.crop_rows = cropRows(i, w);
}

// [§9.33, richiesta dell'autore] Bruciando, le spighe delle righe diventano
// nere (stesse posizioni, ondeggiano ancora) e svaniscono in 700-800 passi
// come quelle dell'originale. Prima sparivano e al loro posto 1700 spighe
// nere sparse su tutto il rombo coprivano anche il terreno: il campo
// diventava una macchia nera. Il terreno resta la terra arata.
const SPIGA_RIGA_BRUCIATA = partType({ sprite: "spiga", size: [0.7, 1, 0, 0], orientation: SWAY.orientation, life: [700, 800],
                                       alpha: [1, 1, 0], colour: { list: [makeColourRgb(28, 24, 20), makeColourRgb(34, 30, 26), makeColourRgb(70, 66, 60)] } });

export function campoStep(i, w) {
  if (i.onfire === 1 && i.firestarted === 0) {
    i.sprite_index = "campo_maggese";
    if (i.grass_system) { // i salvataggi di prima delle righe: come l'originale
      P(w).systemDestroy(i.grass_system);
      i.grass_system_black = P(w).systemCreate(-1, "grass");
      diamond(w, i.grass_system_black, i, SPIGA_BRUCIATA, 1700);
    }
    for (const ps of i.crop_rows || []) {
      for (const q of ps.parts) {
        q.t = SPIGA_RIGA_BRUCIATA;
        q.age = 0;
        q.life = 700 + Math.random() * 100;
      }
      P(w).releaseWhenEmpty(ps);
    }
  }
  fireStep(i, w, "campo");
}

export function campoDestroy(i, w) {
  P(w).systemDestroy(i.grass_system);
  for (const ps of i.crop_rows || []) P(w).systemDestroy(ps);
  P(w).systemDestroy(i.grass_system_black);
  fireStop(i, w);
}

// campo_fond [C]: germogli che compaiono e svaniscono nel rombo del
// cantiere, piu' fitti man mano che la semina avanza (vita/6 a passo).
const GERMOGLIO = partType({ sprite: "part_crop", colour: { list: [c.green, c.white] }, size: [0.1, 0.1, 0.005, 0.01],
                             alpha: [0, 1, 0], orientation: [-15, 15, 0, 4, false], life: [80, 100] });

export function campoFondCreate(i, w) {
  i.grass_system = P(w).systemCreate(-1, "grass");
  i.grass_emitter = P(w).emitterCreate(i.grass_system);
  P(w).region(i.grass_emitter, i.x - 145, i.x + 145, i.y - 90, i.y + 90, "diamond", "linear");
  P(w).stream(i.grass_emitter, GERMOGLIO, 0);
}

// [§7.5, decisione dell'autore] i germogli nascono quando la semina e'
// cominciata (vita sopra 1), non appena il cantiere e' piazzato: col
// flusso frazionario arrotondato per eccesso (vita/6 = 0,17 -> 1 a passo)
// il cantiere appena creato era gia' pieno di germogli.
export function campoFondStream(i, w) {
  P(w).stream(i.grass_emitter, GERMOGLIO, i.life > 1 ? i.life / 6 : 0);
}

// ------------------------------------------------------------------ semi

// manager Create [C]: un sistema globale per i semi lanciati dal
// seminatore; ally_omino Alarm_2 (azione 8, terza fase) ne lancia 8 dalla
// mano, nella direzione in cui guarda, davanti o dietro di lui.
const SEME = partType({ shape: "pixel", size: [1, 1.5, 0, 0], colour: { list: [makeColourRgb(222, 184, 135)] },
                        alpha: [1, 0.8, 0], speed: [3, 5, -0.1, 0.2], gravity: [0.2, 270], life: [15, 25] });

export function seedsThrow(i, w) {
  const Pw = P(w);
  if (!Pw.exists(w.seeds)) w.seeds = Pw.systemCreate(0, "grass");
  const dir = i.direction;
  const handX = i.x + lengthdirX(8, dir), handY = i.y - 40;
  w.seeds.depth = dir > 0 && dir < 181 ? -i.y + 1 : -i.y - 1;
  // part_emitter_create a ogni lancio (mai distrutti) [C]: qui uno solo
  if (!w.seedEmitter) w.seedEmitter = Pw.emitterCreate(w.seeds);
  Pw.region(w.seedEmitter, handX, handX, handY, handY, "rectangle", "linear");
  SEME.direction = [dir - 10, dir + 10, 0, 0];
  Pw.burst(w.seeds, w.seedEmitter, SEME, 8);
}

// ---------------------------------------------------------------- aquila

// aquila_01 [C]: creata dal manager ogni 3000 passi (alarm 3), vola a 5 px
// per passo in direzione 30 (in alto a destra) e sparisce dopo 3000 passi.
// La partenza e' nel manager (a y=-10 non si vedeva mai: §3.17 n.58).
export function aquila() {
  return {
    create(i) { i.alarm.set(0, 3000); i.direction = 30; i.speed = 5; },
    alarm0(i, w) { w.destroy(i); },
  };
}
