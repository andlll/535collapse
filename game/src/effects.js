// Gli usi delle particelle (particles.js) nel gioco, coi numeri del GML:
// pioggia (manager), fiamme degli edifici in fuoco e fiammata delle frecce
// incendiarie, bracieri e torce, erba e spighe decorative, campi (spighe,
// campo bruciato, germogli del cantiere), semi lanciati dal seminatore,
// aquila. Le particelle stanno in w.particles (app.js).

import { c, makeColourRgb } from "./colours.js";
import { partType } from "./particles.js";
import { lengthdirX } from "./gm.js";

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
const GOCCIA = partType({
  shape: "line", orientation: [160, 170, 0, 0, true], size: [0.3, 0.5, 0, 0], scale: [1, 2.5],
  colour: { rgb: [131, 148, 101, 119, 74, 107] }, speed: [18, 21, 0.1, 0], direction: [250, 260, 0, 0],
  life: [200, 300],
});

export function rainStart(w) {
  const ps = P(w).systemCreate(-9000, "rain");
  const em = P(w).emitterCreate(ps);
  P(w).region(em, 0, w.roomW + 300, -16, -16, "line", "linear");
  P(w).stream(em, GOCCIA, 6);
  return ps;
}

// [§8.13, richiesta dell'autore] Anelli delle gocce sul fiume quando
// piove: a ogni passo, RIPPLE_TRIES punti a caso nella view; dove c'e'
// acqua (la mappa dell'acqua degli sprite del fiume, tools/06_masks.py)
// nasce un anello (pt_shape_ring) schiacciato come il resto della vista
// isometrica, che si allarga e sbiadisce. Il sistema sta a depth -21:
// sopra il fiume (0) e la sua animazione (-20), sotto unita' ed edifici;
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
function waterMap(w) {
  if (w._water !== undefined) return w._water;
  const C = 8, gw = Math.ceil(w.roomW / C), gh = Math.ceil(w.roomH / C);
  let grid = null;
  for (const i of w.instances) {
    const m = i.alive && i.sprite_index && w.masks[i.sprite_index];
    const wt = m && m.water;
    if (!wt) continue;
    if (!grid) grid = new Uint8Array(gw * gh);
    const raw = atob(wt.bits), sx = i.image_xscale || 1, sy = i.image_yscale || 1;
    const [ox, oy] = m.origin;
    // ogni cella della room il cui centro cade su una cella d'acqua dello sprite
    const x0 = i.x + (0 - ox) * sx, x1 = i.x + (m.size[0] - ox) * sx;
    const y0 = i.y + (0 - oy) * sy, y1 = i.y + (m.size[1] - oy) * sy;
    const cx0 = Math.max(0, Math.floor(Math.min(x0, x1) / C)), cx1 = Math.min(gw - 1, Math.floor(Math.max(x0, x1) / C));
    const cy0 = Math.max(0, Math.floor(Math.min(y0, y1) / C)), cy1 = Math.min(gh - 1, Math.floor(Math.max(y0, y1) / C));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const lx = ((cx + 0.5) * C - i.x) / sx + ox, ly = ((cy + 0.5) * C - i.y) / sy + oy;
        const kx = Math.floor(lx / wt.cell), ky = Math.floor(ly / wt.cell);
        if (kx < 0 || ky < 0 || kx >= wt.w || ky >= wt.h) continue;
        const k = ky * wt.w + kx;
        if (raw.charCodeAt(k >> 3) & (1 << (k & 7))) grid[cy * gw + cx] = 1;
      }
    }
  }
  w._water = grid ? { C, gw, gh, grid } : null;
  return w._water;
}

export function rainRipples(w, cam) {
  const P_ = P(w);
  if (P_.hidden.has("rain")) return;
  const wm = waterMap(w);
  if (!wm) return;
  let ps = P_.systems.find((s) => s.alive && s.kind === "ripples");
  if (!ps) { ps = P_.systemCreate(-21, "rain"); ps.kind = "ripples"; }
  for (let k = 0; k < RIPPLE_TRIES; k++) {
    const x = cam.x + Math.random() * cam.w, y = cam.y + Math.random() * cam.h;
    const cx = Math.floor(x / wm.C), cy = Math.floor(y / wm.C);
    if (cx < 0 || cy < 0 || cx >= wm.gw || cy >= wm.gh || !wm.grid[cy * wm.gw + cx]) continue;
    P_.create(ps, x, y, ANELLO, 1);
    P_.create(ps, x, y, ANELLO2, 1);
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
export const FIRE = {
  casa: SMALL, barn: SMALL, magazzino: SMALL, enemy_house: SMALL,
  caserma: BIG, stalla: BIG, enemy_caserma: BIG, enemy_stalla: BIG,
  centro: { back: [-65, 65, -100, -95, 8], front: [-65, 65, 70, 75, 4], life: [430, 460] },
  // o_box: la regione dietro ha le y invertite (y-30, y-35) [C]
  o_box1: { back: [-35, 35, -30, -35, 6], front: [-35, 35, 40, 45, 3], life: [40, 50] },
  o_box2: { back: [-35, 35, -30, -35, 6], front: [-35, 35, 40, 45, 3], life: [40, 50] },
  campo: { back: [-35, 35, -5, 5, 6], front: null, life: [150, 160] },
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
    i.fire_part.life = [(F.life[0] - i.life) / 2, (F.life[1] - i.life) / 2];
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
export const DECOR_OBJECTS = Object.keys(DECOR);

export function decorCreate(i, w) {
  i.sprite_index = null;
  const ps = P(w).systemCreate(-1, "grass");
  const em = P(w).emitterCreate(ps);
  P(w).region(em, i.x - 500, i.x + 500, i.y - 300, i.y + 300, "ellipse", "gaussian");
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

export function campoStep(i, w) {
  if (i.onfire === 1 && i.firestarted === 0) {
    i.sprite_index = "campo_maggese";
    P(w).systemDestroy(i.grass_system); // (i salvataggi di prima delle righe)
    for (const ps of i.crop_rows || []) P(w).systemDestroy(ps);
    i.crop_rows = [];
    i.grass_system_black = P(w).systemCreate(-1, "grass");
    diamond(w, i.grass_system_black, i, SPIGA_BRUCIATA, 1700);
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
