// Oggetti di scena che contano per nebbia e notte (punto 5): i fuochi
// della citta' di lvl01 e lvl02, il palo con la torcia e le statue.
//
// - `ocr_*` [C, Create]: gli edifici della citta' con bracieri creano 2 o 3
//   `firestarter` attorno a se'.
// - `firestarter`, `firestarter_small` [C]: sistemi di particelle del fuoco
//   (effects.js), accesi solo nella view e vicino a un alleato; la notte li
//   illumina (fog.js). La torcia, visibile, si disegna nel suo Draw
//   (part_system_drawit); il disegno automatico, che la raddoppiava, e'
//   spento (§3.17 n.59).
// - `palo_1` [C, Create]: segna le sue celle nella griglia dei costi, vita
//   999 (rimessa a ogni Step) e una torcia (`firestarter_small`) in cima.
// - `o_statua1..4` [C]: lvl01; un'unita' alleata entro 300 px la attiva:
//   da allora cura di 3 le unita' ferite entro 400 px (distanza schiacciata
//   in verticale) ogni 180 passi, come la chiesa, e scopre la nebbia
//   attorno a se' (manager Draw_End, solo blackfog). La prima statua
//   attivata apre `dialogo_statua` (con i dialoghi).

import { pointDistance, pointDirection, degtorad } from "./gm.js";
import { fireStarterCreate, fireStarterStep } from "./effects.js";

// offset dei bracieri per oggetto [C, Create di ciascun ocr_*]
const STD = [[-50, -50], [10, -100], [40, -55]];
export const CITY_FIRES = {
  ocr_01: STD, ocr_04: STD, ocr_32: STD, ocr_34: STD, ocr_41: STD, ocr_43: STD, ocr_44: STD, ocr_45: STD,
  ocr_02: [[-50, -50], [-20, 50]],
  ocr_42: [[-70, -50], [10, -100], [80, -55]],
};

export function cityBuilding(name) {
  const fires = CITY_FIRES[name];
  return {
    create(i, w) {
      i.depth = -i.y;
      for (const [dx, dy] of fires) w.create("firestarter", i.x + dx, i.y + dy);
    },
  };
}

// firestarter: depth=-y-200 (Create), visible=0 [C]; firestarter_small resta
// visibile ma disegna solo particelle.
export function fireStarter(hidden) {
  return {
    create(i, w) {
      i.depth = -i.y - 200;
      if (hidden) i.visible = false;
      fireStarterCreate(i, w, !hidden);
    },
    step(i, w) { fireStarterStep(i, w); },
    // firestarter Draw: depth=-y-70 (invisibile: non gira);
    // firestarter_small Draw: depth=-y-90, part_system_drawit(fire_ps)
    draw(i, w, d) {
      i.depth = -i.y - (hidden ? 70 : 90);
      w.particles.draw(i.fire_ps, d.r, w.assets, w.cam);
    },
  };
}

export function palo(path) {
  return {
    create(i, w) {
      path.markInstance(i, 1000);
      i.depth = -i.y;
      i.life = 999;
      i.slife = 999;
      i.fuoco = w.create("firestarter_small", i.x, i.y - 82);
    },
    step(i) { i.life = 999; },
  };
}

export function statue() {
  return {
    create(i, w) {
      i.depth = -i.y;
      i.attiva = 0;
      w.g.hintata = 0;
    },
    step(i, w) {
      if (w.distanceToObject(i, "ally_unit") < 300 && i.attiva === 0) {
        i.attiva = 1;
        if (w.g.hintata === 0) {
          w.g.hintata = 1;
          if (w.behaviours.dialogo_statua) w.create("dialogo_statua", i.x, i.y);
        }
        i.alarm.set(0, 1);
      }
    },
    alarm0(i, w) {
      i.alarm.set(0, 180);
      if (i.attiva !== 1) return;
      for (const u of w.all("ally_unit")) {
        const diri = pointDirection(u.x, u.y, i.x, i.y);
        if (pointDistance(u.x, u.y, i.x, i.y) * (1 - 0.36 * Math.abs(Math.sin(degtorad(diri)))) < 400 && u.life < u.slife) {
          w.create("sfx_croce", u.x, u.y);
          u.life += 3;
          if (u.life > u.slife) u.life = u.slife;
        }
      }
    },
  };
}

// ------------------------------------------------- fiaccole sulle case

// [§9.104, richiesta dell'autore] Di notte, invece delle finestre accese (una
// luce sul tetto di due case su tre, §9.84: sembravano tende o superfici
// traslucide con la luce dentro), una fiaccola appesa al muro di circa meta'
// delle case, scelte a caso (sempre le stesse: dall'id), del giocatore e del
// nemico. E' un'istanza (fiaccola_casa) legata alla sua casa: se la casa
// non c'e' piu' (distrutta, crollata, convertita) sparisce anche lei. Di
// giorno resta il bastone; la fiamma (le particelle della torcia del palo,
// categoria "fuoco") e la luce si accendono con la notte, come facevano le
// finestre, e non con la casa in fiamme. Lo sprite e' torchspr_part
// dell'originale (mai usato), rimpicciolito.
//
// Il punto d'appoggio sul muro per sprite della casa, dall'origine, e il
// verso: 1 sul muro di destra (la fiaccola pende verso destra), -1 su quello
// di sinistra (specchiata). Misurati sugli sprite.
export const HOUSE_TORCH = {
  c1s: [14, -2, 1], c2s: [24, -6, 1], c3s: [10, 5, -1], c4s: [-25, 15, -1], c5s: [18, 14, 1], c6s: [26, -8, 1],
  c1b: [15, 5, 1], c2b: [15, 0, 1], c3b: [0, 15, -1], c4b: [-30, 22, -1], c5b: [15, 15, 1], c6b: [20, 5, 1],
};
const TORCH_SCALE = 0.7, TORCH_TOP = [6, -24]; // dalla base del bastone alla cima (la fiamma), a scala 0,7
const TORCH_SHARE = 50;                      // case con la fiaccola, su 100
const TORCH_EVERY = 30;                      // passi fra un controllo delle case e l'altro
export const torchLit = (g) => Math.max(0, Math.min(1, ((g.night || 0) - 0.3) / 0.5));
const torchHash = (id) => (Math.imul(id, 2654435761) >>> 0) % 100;

// Le case nuove (anche quelle finite durante la partita) ricevono la
// fiaccola o no una volta sola (i.torch: 1 o 0, si salva)
export function houseTorches(w) {
  if (w.room === "menu" || w._stepNo % TORCH_EVERY !== 0 || !w.behaviours.fiaccola_casa) return;
  for (const n of ["casa", "enemy_house"]) {
    for (const h of w.all(n)) {
      if (!h.alive || h.torch !== undefined) continue;
      const m = HOUSE_TORCH[h.sprite_index];
      h.torch = m && torchHash(h.id) < TORCH_SHARE ? 1 : 0;
      if (!h.torch) continue;
      const side = m[2];
      w.create("fiaccola_casa", h.x + m[0] + side * TORCH_TOP[0], h.y + m[1] + TORCH_TOP[1], { init: (t) => { t.casa = h; t.side = side; } });
    }
  }
}

export function houseTorch() {
  return {
    create(i, w) {
      fireStarterCreate(i, w, true); // la fiamma: come la torcia del palo
      w.particles.stream(i.fire_emitter, i.fire_part, 0);
      i.depth = i.casa ? i.casa.depth - 1 : -i.y;
    },
    step(i, w) {
      const h = i.casa;
      if (!h || !h.alive) { w.destroy(i); return; }
      i.visible = h.visible !== false;
      i.depth = h.depth - 1;
      const cam = w.cam, inView = cam && i.x > cam.x - 50 && i.x < cam.x + cam.w + 50 && i.y > cam.y - 50 && i.y < cam.y + cam.h + 50;
      const on = i.visible && h.onfire !== 1 && torchLit(w.g) > 0.15 && inView;
      w.particles.stream(i.fire_emitter, i.fire_part, on ? 2 : 0);
    },
    draw(i, w, d) {
      if (!i.visible) return;
      const s = TORCH_SCALE;
      d.spriteExt("torchspr_part", 0, i.x, i.y, (i.side || 1) * s, s, 0, 0xffffff, 1);
      w.particles.draw(i.fire_ps, d.r, w.assets, w.cam);
    },
    destroy(i, w) { w.particles.systemDestroy(i.fire_ps); },
  };
}
