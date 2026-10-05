// Oggetti di scena che contano per nebbia e notte (punto 5): i fuochi
// della citta' di lvl01 e lvl02, il palo con la torcia e le statue.
//
// - `ocr_*` [C, Create]: gli edifici della citta' con bracieri creano 2 o 3
//   `firestarter` attorno a se'.
// - `firestarter`, `firestarter_small` [C]: sistemi di particelle del fuoco.
//   Qui per ora solo la posizione, che la notte illumina (fog.js); le
//   fiamme arrivano col sistema di particelle.
// - `palo_1` [C, Create]: segna le sue celle nella griglia dei costi, vita
//   999 (rimessa a ogni Step) e una torcia (`firestarter_small`) in cima.
// - `o_statua1..4` [C]: lvl01; un'unita' alleata entro 300 px la attiva:
//   da allora cura di 3 le unita' ferite entro 400 px (distanza schiacciata
//   in verticale) ogni 180 passi, come la chiesa, e scopre la nebbia
//   attorno a se' (manager Draw_End, solo blackfog). La prima statua
//   attivata apre `dialogo_statua` (con i dialoghi).

import { pointDistance, pointDirection, degtorad } from "./gm.js";

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
    create(i) {
      i.depth = -i.y - 200;
      if (hidden) i.visible = false;
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
