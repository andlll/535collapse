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
const GOCCIA = partType({
  shape: "line", orientation: [160, 170, 0, 0, true], size: [0.3, 0.5, 0, 0],
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
const SWAY = { orientation: [-15, 15, 0, 4, false], life: [99999999, 99999999] };
const DECOR = {
  burst_erba1: [partType({ sprite: "part_erba", size: [0.4, 0.7, 0, 0], ...SWAY, alpha: [0.3, 0.7],
                           colour: { mix: [makeColourRgb(61, 77, 46), makeColourRgb(90, 102, 61)] } }), 2600],
  burst_grano1: [partType({ sprite: "part_crop", size: [0.4, 0.7, 0, 0], ...SWAY, alpha: [0.3, 0.7] }), 2500],
  chiazzaparticellare: [partType({ shape: "line", size: [0.1, 0.3, 0, 0], orientation: [85, 95, 0, 7, false],
                                   colour: { mix: [makeColourRgb(52, 94, 10), makeColourRgb(113, 151, 56)] },
                                   alpha: [1, 0.8], life: [99999999, 99999999] }), 1700],
};
export const DECOR_OBJECTS = Object.keys(DECOR);

export function decorCreate(i, w) {
  const [t, n] = DECOR[i.object];
  i.sprite_index = null;
  i.grass_system = P(w).systemCreate(-1, "grass");
  const em = P(w).emitterCreate(i.grass_system);
  P(w).region(em, i.x - 500, i.x + 500, i.y - 300, i.y + 300, "ellipse", "gaussian");
  P(w).burst(i.grass_system, em, t, n);
}

// ---------------------------------------------------------------- campi

// campo Create [C]: 700 spighe nel rombo del campo
const SPIGA = partType({ sprite: "part_crop", size: [0.4, 0.7, 0, 0], ...SWAY, alpha: [0.3, 0.7] });
// campo Step, quando prende fuoco [C]: le spighe spariscono, 1700 spighe
// bruciate che svaniscono in 700-800 passi, sprite "campo_maggese"
const SPIGA_BRUCIATA = partType({ sprite: "part_crop", size: [0.2, 0.35, 0, 0], colour: { list: [c.black, c.black, c.gray] },
                                  orientation: [-15, 15, 0, 4, false], alpha: [0.7, 0], life: [700, 800] });

function diamond(w, ps, i, t, n) {
  const em = P(w).emitterCreate(ps);
  P(w).region(em, i.x - 145, i.x + 145, i.y - 90, i.y + 90, "diamond", "linear");
  P(w).burst(ps, em, t, n);
}

export function campoCreate(i, w) {
  i.grass_system = P(w).systemCreate(-1, "grass");
  diamond(w, i.grass_system, i, SPIGA, 700);
}

export function campoStep(i, w) {
  if (i.onfire === 1 && i.firestarted === 0) {
    i.sprite_index = "campo_maggese";
    P(w).systemDestroy(i.grass_system);
    i.grass_system_black = P(w).systemCreate(-1, "grass");
    diamond(w, i.grass_system_black, i, SPIGA_BRUCIATA, 1700);
  }
  fireStep(i, w, "campo");
}

export function campoDestroy(i, w) {
  P(w).systemDestroy(i.grass_system);
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
  P(w).stream(i.grass_emitter, GERMOGLIO, 0.1);
}

export function campoFondStream(i, w) {
  P(w).stream(i.grass_emitter, GERMOGLIO, i.life / 6);
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
