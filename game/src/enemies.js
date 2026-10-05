// Nemici in mischia: enemy_warrior, enemy_picchiere, enemy_cavaliere.
// Trascrizione di src/objects/enemy_*/ e di scr_movimento_nemici_ff,
// scr_atk_signal, scr_find_free_spawn_enemy. Nomi originali.
//
// Lo stesso codice in tre copie che si sono allontanate: il picchiere e il
// cavaliere hanno la versione corretta del controllo sulla nebbia, il
// guerriero no; le differenze sono nella tabella MELEE [C, confronto evento
// per evento: STUDIO.md §3.10].
//
// I nemici della room hanno role 0 e nessun flow field: si avvicinano
// con mp_potential_step. Gli attaccanti delle ondate (role 30/31/32,
// scr_attacca) arrivano col punto 4e.

import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { mpPotentialStep, moveFlowField } from "./pathing.js";
import { phaseOf } from "./units.js";

const iso = (dir) => 1 - 0.36 * Math.abs(Math.sin(degtorad(dir)));
const C = { black: 0, blue: 0xff0000, white: 0xffffff };

// Danni di Alarm_2 per vita massima del bersaglio [C, STUDIO.md §1.4];
// 125/100 (catapulta, ariete) scappano se fermi; 50 (civile) scappa verso
// un punto a 200 px (alarm 10 del civile).
const MELEE = {
  enemy_warrior: {
    life: 75, rank: 3, corpse: "enemy_warrior_corpse", icon: "ico_guerriero",
    damage: { 75: 7, 60: 7, 125: 7, 100: 7, 55: 15, 90: 4, 50: 5 }, fleeStep0: true, atkSignal: true,
    attackIso: false, charge: false, fire: true, place: "random", fogBroken: true,
    palo: false, chaseAlarm: 15, spawnFree: true, menuMarch: true, dcSelectsCivilians: false,
  },
  enemy_picchiere: {
    life: 60, rank: 3, corpse: "enemy_picchiere_corpse", icon: "ico_picchiere",
    damage: { 75: 3, 60: 3, 125: 3, 100: 3, 55: 5, 90: 8, 50: 5 }, fleeStep0: false, atkSignal: false,
    attackIso: true, charge: false, fire: true, place: "back50", fogBroken: false,
    palo: true, chaseAlarm: 15, spawnFree: false, menuMarch: false, dcSelectsCivilians: true,
  },
  enemy_cavaliere: {
    life: 90, rank: 5, corpse: "enemy_cavaliere_corpse", icon: "ico_cavaliere",
    damage: { 75: 5, 90: 5, 125: 5, 100: 5, 55: 22, 60: 3, 50: 8 }, fleeStep0: false, atkSignal: true,
    attackIso: true, charge: true, fire: false, place: "random", fogBroken: false,
    palo: false, chaseAlarm: 10, spawnFree: false, menuMarch: false, dcSelectsCivilians: true,
  },
};

// distance_to_object verso un'istanza che potrebbe non esserci (noone):
// lontanissima [I].
function distTo(w, i, o) {
  return o ? w.distanceToInstance(i, o) : Infinity;
}

// scr_find_free_spawn_enemy [C]: spirale sulle celle da 32 finche'
// place_free nell'angolo della cella.
function freeSpawnEnemy(i, w) {
  const G = 32, gw = Math.trunc(w.roomW / G), gh = Math.trunc(w.roomH / G);
  let gx = Math.floor(i.x / G), gy = Math.floor(i.y / G);
  const inside = () => gx >= 0 && gx < gw && gy >= 0 && gy < gh;
  if (inside() && w.placeFree(i, gx * G, gy * G)) return;
  let stepLen = 1, dir = 0, done = 0, changes = 0;
  for (let attempts = 0; attempts < 500; attempts++) {
    if (dir === 0) gx++; else if (dir === 1) gy++; else if (dir === 2) gx--; else gy--;
    done++;
    if (inside() && w.placeFree(i, gx * G, gy * G)) { w.setPos(i, gx * G, gy * G); return; }
    if (done >= stepLen) { done = 0; dir = (dir + 1) % 4; changes++; if (changes % 2 === 0) stepLen++; }
  }
}

// scr_atk_signal [C]: un segnale d'attacco se il nemico colpisce fuori
// dalla view (non piu' di uno ogni 500 px). atk_signal non disegna nulla
// (solo un contatore di debug in mouser): residuo (§3.10).
function atkSignal(i, w) {
  const c = w.cam;
  if (i.x >= c.x && i.x <= c.x + c.w && i.y >= c.y && i.y <= c.y + c.h) return;
  const s = w.nearest(i.x, i.y, "atk_signal");
  if (s) {
    const b = w.bbox(i);
    const d = b ? Math.hypot(Math.max(0, b[0] - s.x, s.x - b[2]), Math.max(0, b[1] - s.y, s.y - b[3])) : pointDistance(i.x, i.y, s.x, s.y);
    if (d > 500) w.create("atk_signal", i.x, i.y);
  } else w.create("atk_signal", i.x, i.y);
}

export function atkSignalObject() {
  return {
    create(i) { i.alarm.set(0, 75); i.alarm.set(1, 15); i.alarm.set(2, 60); i.bounce = 0; i.fade = 0; },
    alarm0(i, w) { w.destroy(i); },
    alarm1(i) { i.bounce = 2; },
    alarm2(i) { i.bounce = 1; },
    step(i) { if (i.bounce === 0) i.fade += 1 / 15; if (i.bounce === 1) i.fade -= 1 / 15; },
  };
}

// scr_movimento_nemici_ff [C]. La precedenza di GML e' (lontano && role 31)
// || sovrapposto. Senza flow field proprio si legge la griglia 0 (pathing.js,
// initGrid0).
function enemyMove(i, w, p) {
  if (i.action !== 1) return;
  if ((pointDistance(i.x, i.y, i.dirox, i.diroy) > 400 && i.role === 31) || !w.placeFree(i, i.x, i.y)) {
    const otro = w.instancePlace(i, i.x, i.y, "enemy_unit");
    if (otro) {
      if (otro.ordo < i.ordo || otro.action !== 1) moveFlowField(w, p, i);
      else { i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); }
    } else moveFlowField(w, p, i);
  } else {
    mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
    if (i.role === 31) for (const e of w.all("enemy_unit")) if (e.role === 31) { e.role = 32; e.action = 0; }
  }
}

// Alarm_2, "botte" [C]
function enemyStrike(i, w, T) {
  const io_x = i.x, io_y = i.y;
  const near = w.nearest(i.x, i.y, "ally_unit");
  if (!near || w.distanceToInstance(i, near) > 10) { i.action = 0; i.warwork = 0; i.speed = 0; }
  if (i.action !== 2) return;
  if (i.step === 0) { i.step = 1; i.alarm.set(2, 13); return; }
  if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
  if (i.step !== 2) return;
  i.step = 0;
  if (T.atkSignal) atkSignal(i, w);
  i.alarm.set(2, 13);
  const v = w.nearest(i.x + 30 * Math.cos(degtorad(i.direction)), i.y - 30 * Math.sin(degtorad(i.direction)), "ally_unit");
  if (!v) return;
  v.hit = 1;
  v.alarm.set(5, 47);
  const dmg = T.damage[v.slife];
  if (dmg !== undefined) v.life -= dmg;
  const away = () => {
    const d = pointDirection(io_x, io_y, v.x, v.y);
    return [v.x + lengthdirX(200, d), v.y + lengthdirY(200, d)];
  };
  if ((v.slife === 125 || v.slife === 100) && v.action === 0) {
    const [sx, sy] = away();
    v.action = 1; v.warwork = 4;
    if (T.fleeStep0) v.step = 0;
    if (v.alarm.get(0) < 0) v.alarm.set(0, 12);
    v.dirox = sx; v.diroy = sy;
  }
  if (v.slife === 50) {
    const [sx, sy] = away();
    v.alarm.set(10, 10);
    v.flaggox = sx; v.flaggoy = sy;
  }
}

// Step, "attacco" [C]
function enemyAttack(i, w, T) {
  if (!w.exists("ally_unit")) return null;
  const k = iso(i.direction), night = w.g.night;
  const nearest = () => w.nearest(i.x, i.y, "ally_unit");
  const n0 = nearest();
  if (w.distanceToInstance(i, n0) < (T.attackIso ? 10 * k : 10)) {
    if (i.warwork === 2 && i.alarm.get(2) < 1) {
      if (T.charge) i.chargespeed = 0;
      i.targetx = n0.x; i.targety = n0.y;
      i.direction = pointDirection(i.x, i.y, i.targetx, i.targety);
    }
    if (i.warwork !== 2 && i.alarm.get(2) < 1) {
      if (T.charge) i.chargespeed = 0;
      i.action = 2; i.warwork = 2; i.alarm.set(2, 13);
    }
    return "exit";
  }
  // (nessun alleato e warwork 2: non puo' succedere qui, c'e' almeno un ally_unit)
  const chase = (range) => {
    const n = nearest();
    if (!(w.distanceToInstance(i, n) < range * (1 - 0.5 * night) * k)) return false;
    // precedenza di GML: warwork=0 || (warwork=1 && alarm[2]<1)
    if (i.warwork === 0 || (i.warwork === 1 && i.alarm.get(2) < 1)) {
      if (i.action !== 1) i.alarm.set(0, T.chaseAlarm);
      i.action = 1; i.warwork = 1;
      i.dirox = n.x; i.diroy = n.y;
    }
    return true;
  };
  if (w.exists("fog01")) {
    const farFromFog = distTo(w, i, w.nearest(i.x, i.y, "fog01")) > 290;
    if (T.fogBroken) {
      // enemy_warrior [C]: le graffe mancano, l'else si aggancia al "< 400":
      // vicino alla nebbia (fog01 entro 290 px) il guerriero non insegue
      // mai; lontano, il "< 200" non aggiunge nulla (§3.10 n.39)
      if (farFromFog && !chase(400)) chase(200);
    } else if (farFromFog) chase(400);
    else chase(200);
  } else chase(400);
  if (i.action === 0 && i.warwork === 1) i.warwork = 0;
  return null;
}

// Step "voglio dare fuoco alle case" e "mandare a fuoco" [C]: un nemico
// fermo entro 400 px (meno di notte) da un edificio di legno, senza civili
// entro 400 px, ci va e a 200 px gli lancia frecce incendiarie (Alarm_4).
function enemyFireHouses(i, w) {
  if (i.firework === 1 && i.warwork !== 2 && i.targetid && pointDistance(i.x, i.y, i.targetid.x, i.targetid.y) < 200) {
    i.firework = 0;
    i.direction = pointDirection(i.x, i.y, i.targetid.x, i.targetid.y);
    i.step = 0;
    i.alarm.set(4, 13);
    i.action = 6;
  }
  if (i.action !== 0 || i.firework !== 0 || !w.exists("ally_wooden")) return;
  const house = w.nearest(i.x, i.y, "ally_wooden");
  if (!(w.distanceToInstance(i, house) < 400 * (1 - 0.5 * w.g.night))) return;
  const start = () => {
    i.firework = 1; i.warwork = 0; i.action = 1; i.alarm.set(0, 15);
    i.targetid = w.nearest(i.x, i.y, "ally_wooden");
    i.dirox = i.targetid.x; i.diroy = i.targetid.y;
  };
  if (w.exists("ally_omino") && w.distanceToObject(i, "ally_omino") > 400 && i.warwork !== 2) start();
  if (!w.exists("ally_omino") && i.warwork !== 2) start();
}

export function enemyMelee(name, p) {
  const T = MELEE[name];
  const visibility = (i, w) => {
    const g = w.g, n = 1 - g.night;
    const near = (obj, r) => distTo(w, i, w.nearest(i.x, i.y, obj)) < r + r * n;
    i.visible = near("ally_unit", 150) || near("ally_build", 200) || (T.palo && near("palo_1", 200)) || i.hit === 1
      || near("castello", 500) || near("torre", 500) || w.room === "menu" || g.fogville === 0;
  };
  return {
    create(i, w) {
      if (T.spawnFree) freeSpawnEnemy(i, w);
      const g = w.g;
      Object.assign(i, { action: 0, idling: 1, step: 0, phase: 1, hov: 0, hover: 0, warwork: 0, dc: 0, autospeed: 0,
                         firework: 0, defender: 0, targetid: null, chargespeed: 0, hit: 0, selected: 0, role: 0,
                         targetx: 0, targety: 0, foodx: 0, foody: 0, dirox: 0, diroy: 0 });
      // (global.dialogoenemy1: con i dialoghi del livello 1)
      g.order++;
      i.ordo = g.order * T.rank;
      i.life = T.life;
      i.slife = T.life;
      // senza flow field proprio: la griglia 0 (§3.10 n.37)
      i.flow_field = p.grid0;
      // enemy_warrior, "azioni iniziali" [C]: nel menu marcia sul centro
      if (T.menuMarch && w.room === "menu") {
        const a = w.nearest(i.x, i.y, "ally");
        const c = w.nearest(i.x, i.y, "centro");
        if (distTo(w, i, a) > 800 && c) { i.action = 1; i.dirox = c.x; i.diroy = c.y; i.alarm.set(0, 15); }
      }
    },
    alarm0(i) {
      if (i.step === 0 && i.action === 1) { i.step = 1; i.alarm.set(0, 10); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(0, 10); return; }
      if (i.step === 2 && i.action === 1) { i.step = 3; i.alarm.set(0, 10); return; }
      if (i.step === 3) { i.step = 0; i.alarm.set(0, 10); }
    },
    alarm1(i) { i.dc = 0; },
    alarm2(i, w) { enemyStrike(i, w, T); },
    // Alarm_3 [C] ("animazione fuoco?"): nessuno lo arma; tre passi e
    // l'istanza sparisce
    alarm3(i, w) {
      if (i.step === 0) { i.step = 1; i.alarm.set(3, 20); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(3, 20); return; }
      if (i.step === 2) { i.step = 0; w.destroy(i); }
    },
    // Alarm_4, frecce incendiarie (action 6): il fire_bullet arriva col
    // fuoco (4d); fino ad allora il nemico ci prova ma non lancia nulla
    alarm4(i, w) {
      if (i.action !== 6) return;
      if (i.step === 0) { i.step = 1; i.alarm.set(4, 13); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(4, 13); return; }
      if (i.step !== 2) return;
      if (i.targetid && i.targetid.alive) {
        i.step = 0;
        i.alarm.set(4, 38);
        if (w.behaviours.fire_bullet) {
          const b = w.create("fire_bullet", i.x, i.y - 67);
          b.direction = pointDirection(b.x, b.y, i.targetid.x, i.targetid.y);
          b.speed = 8;
        }
      } else { i.action = 0; i.targetid = null; i.firework = 0; }
    },
    alarm5(i) { i.hit = 0; },
    stepBegin(i, w) { if (w.number("torre_placer") > 0) w.g.sele = 1; },
    step(i, w) {
      const g = w.g;
      // smetti di dare fuoco a una casa crollata
      if (T.fire && !(i.targetid && i.targetid.alive) && (i.action === 6 || i.firework !== 0)) {
        i.targetid = null; i.step = 0; i.firework = 0; i.action = 0;
      }
      visibility(i, w);
      // morte
      const diro = i.direction;
      if (i.life <= 0) {
        const corpse = w.create(T.corpse, i.x, i.y);
        if (i.hover === 1) { i.hover = 0; g.enemyhover = 0; }
        w.destroy(i);
        corpse.direction = diro;
        return;
      }
      i.autospeed = 4 * iso(i.direction);
      i.depth = -i.y;
      i.phase = phaseOf(i.direction);
      if (i.action === 1 && i.x === i.dirox && i.y === i.diroy) { i.action = 0; i.speed = 0; }
      enemyMove(i, w, p);
      ANIM[name](i, w);
      // destinazione occupata
      if (T.place === "back50") {
        if (i.action === 1 && !w.placeEmpty(i, i.dirox, i.diroy)) {
          const d = pointDirection(i.dirox, i.diroy, i.x, i.y);
          i.dirox += lengthdirX(50, d); i.diroy += lengthdirY(50, d);
        }
      } else {
        if (i.action === 1 && !w.placeEmpty(i, i.dirox, i.diroy)) { i.dirox += irandomRange(-20, 20); i.diroy += irandomRange(-20, 20); }
        if (i.action === 1 && !w.placeFree(i, i.dirox, i.diroy)) { i.dirox += irandomRange(-30, 30); i.diroy += irandomRange(-30, 30); }
      }
      if (w.number("torre_placer") > 0) g.sele = 1;
      if (T.fire) enemyFireHouses(i, w);
      // (hint_attack e dialogo_1_4: con suggerimenti e dialoghi)
      enemyAttack(i, w, T);
    },
    // Mouse_LeftReleased [C]: un nemico si puo' selezionare (per vederne la
    // vita); nel picchiere e nel cavaliere il doppio clic seleziona TUTTI i
    // civili, senza contarli in global.sel (§3.10 n.38)
    leftReleased(i, w) {
      if (T.dcSelectsCivilians && i.dc === 1) for (const o of w.all("ally_omino")) o.selected = 1;
      if (w.g.sele > -1) {
        i.selected = 1;
        if (i.action === 1 && i.dc === 0) { i.dc = 1; i.alarm.set(1, 20); }
      }
      if (w.g.sele === -1 && i.selected === 1) i.selected = 0;
    },
    // Mouse_RightReleased [C]: guerrieri, cavalieri e picchieri selezionati
    // lo prendono come bersaglio (il loro GlobalRightReleased viene dopo)
    rightReleased(i, w) {
      for (const n of ["ally_warrior", "ally_cavaliere", "ally_picchiere"]) {
        for (const u of w.all(n)) {
          if (u.selected === 1 && (u.warwork === 0 || u.warwork === 1)) {
            u.target_eu = i; u.warwork = 1; u.dirox = i.x; u.diroy = i.y;
          }
        }
      }
    },
    mouseEnter(i, w) { i.hover = 1; w.g.enemyhover = 1; },
    mouseLeave(i, w) { i.hover = 0; w.g.enemyhover = 0; },
    // enemy (parent) Mouse_GlobalLeftPressed e KeyPress_Escape [C]
    globalLeftPressed(i, w) { if (w.g.sele === 0 && i.selected === 1) i.selected = 0; },
    keyPress27(i, w) { if (w.g.sele === 0 && i.selected === 1) i.selected = 0; },
    drawEnd(i, w, d) {
      if (i.selected === 1 || i.hover === 1) {
        d.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, C.black, C.black, C.black, C.black, false);
        d.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + (i.life / i.slife) * 50, i.y - 82, C.blue, C.blue, C.blue, C.blue, false);
        d.sprite("circ_1", 0, i.x, i.y);
        if (i.action === 1) d.sprite("director_blue", 0, i.dirox, i.diroy);
        d.sprite("director_blue", 0, i.foodx, i.foody);
      }
      if (i.hit === 1 && w.room !== "menu") {
        d.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, C.black, C.black, C.black, C.black, false);
        d.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + (i.life / i.slife) * 50, i.y - 82, C.blue, C.blue, C.blue, C.blue, false);
      }
    },
    drawGUI(i, w, d) {
      if (i.selected !== 1 || w.g.sel >= 2) return;
      d.setAlpha(0.69);
      d.roundrectColourExt(260, 20, 390, 150, 60, 60, C.white, C.white, false);
      d.setFont("GUI_1");
      d.setColour(C.black);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("center");
      d.text(325, 120, i.life + " / " + i.slife);
      d.setAlpha(1);
      d.sprite(T.icon, 0, 325, 70);
    },
    // Collision_arciere_bullet (scappare dalle frecce): con gli arcieri (4c)
  };
}
