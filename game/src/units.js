// Unita': comportamenti portati a mano dal GML, evento per evento.
// Ogni blocco cita il file d'origine (src/objects/<oggetto>/<Evento>.gml) e
// l'azione. Le variabili mantengono i nomi originali (action, warwork,
// dirox/diroy, ...) per poter confrontare riga per riga.
//
// action:  0 fermo, 1 in movimento, 2 attacco, 6 dare fuoco
// warwork: 0 fermo, 1 va verso il nemico, 2 attacca, 4 si muove senza
//          attaccare (commento dell'autore in ally_warrior Step azione 10)
//
// [I, STUDIO.md §3.3] Le variabili mai assegnate valgono 0 come con
// l'opzione "variabili non inizializzate = 0" di GMS (option_variableerrors
// False nel config): qui sono inizializzate esplicitamente a 0.

import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { GRID, generateFields, scrMove, moveFlowField, mpPotentialStep } from "./pathing.js";

// "direzione" [C, Step azione 4 di ogni unita']: 8 settori da 45 gradi
export function phaseOf(direction) {
  if (direction < 22.5 || direction >= 337.5) return 1;
  return Math.floor((direction - 22.5) / 45) + 2;
}

// 1 - 0,36 |sin(direzione)|: le unita' vanno piu' piano in verticale
// (prospettiva isometrica) [C, autospeed di ogni unita']
const iso = (dir) => 1 - 0.36 * Math.abs(Math.sin(degtorad(dir)));

function inView(w, i) {
  const c = w.cam;
  return i.x > c.x && i.x < c.x + c.w && i.y > c.y && i.y < c.y + c.h;
}

// --------------------------------------------------------------- comandi

// scr_movement_general [C, manager Mouse_GlobalRightReleased]: il
// selezionato con `ordo` piu' alto (scr_get_highest_rank) calcola il campo
// verso il punto cliccato (scr_move_master) e lo passa agli altri
// selezionati. Gira prima degli eventi delle unita' (manager e' creato
// prima di tutte le unita' in ogni room [C, ordine delle istanze]).
export function movementGeneral(w, p, mx, my) {
  let leader = null;
  for (const u of w.all("ally_unit")) if (u.selected === 1 && (!leader || u.ordo > leader.ordo)) leader = u;
  if (!leader) return;
  // scr_move_master
  p.free(leader);
  const [cx, cy] = p.findValidCellBackwards(leader.goal_field, Math.trunc(mx / GRID), Math.trunc(my / GRID),
                                            Math.trunc(leader.x / GRID), Math.trunc(leader.y / GRID));
  const found = p.fieldAt(leader.goal_field, cx, cy) !== -1;
  leader.goal_x = found ? cx * GRID : leader.x;
  leader.goal_y = found ? cy * GRID : leader.y;
  generateFields(p, leader, leader.goal_x, leader.goal_y);
  leader.dirox = leader.goal_x;
  leader.diroy = leader.goal_y;
  const ff = leader.flow_field;
  for (const u of w.all("ally_unit")) {
    if (u.selected !== 1) continue;
    u.flow_field = ff; // ds_grid_copy(flow_field, ff_general)
    p.free(u);
    if (p.fieldAt(u.flow_field, Math.floor(u.x / GRID), Math.floor(u.y / GRID)) === -1) scrMove(p, u, mx, my);
  }
  for (const u of w.all("ally_unit")) if (u !== leader && u.selected === 1) p.free(u);
}

// --------------------------------------------------------------- cavaliere

const CAV = "ally_cavaliere";

export function cavaliere(p) {
  return {
    // src/objects/ally_cavaliere/Create.gml
    create(i, w) {
      const g = w.g;
      Object.assign(i, {
        selected: 0, creation: 0, foodx: 0, foody: 0, goal_x: 0, goal_y: 0, targetx: 0, targety: 0,
        flaggox: null, flaggoy: null,
        action: 0, idling: 1, step: 0, phase: 1, hov: 0, hover: 0, dc: 0, hit: 0, assi: 0,
        autospeed: 0, chargespeed: 0, warwork: 0, comp: 700,
        target_eu: null, life: 90, slife: 90, firework: 0, targetid: null, typem: 0,
      });
      g.pop += 3;
      g.order++;
      i.ordo = g.order * 1; // var rank=1
      i.dirox = i.x;
      i.diroy = i.y;
      i.alarm.set(3, 1);
      // azione 2: flow field iniziale sul posto
      p.findFreeSpawn(i);
      generateFields(p, i, i.x, i.y);
      i.dirox = i.x;
      i.diroy = i.y;
      p.occupy(i);
    },

    roomStart(i) { p.occupy(i); },               // Other_RoomStart
    alarm0: walkCycle,                           // Alarm_0: fotogrammi del passo
    alarm1(i) { i.dc = 0; },                     // Alarm_1: finestra del doppio clic
    alarm2(i, w) { meleeStrike(i, w, CAV_DAMAGE, false); },
    alarm3(i) { p.occupy(i); },                  // Alarm_3: "occupa tentativo"
    alarm5(i) { i.hit = 0; },
    alarm8(i) { i.dirox = i.x; i.diroy = i.y; }, // Alarm_8: "timer fermati"
    alarm10(i, w) { rallyMove(i, w, p, false); },

    // Step_Begin: con un piazzamento di torre in corso si somma alla selezione
    stepBegin(i, w) { if (w.number("torre_placer") > 0) w.g.sele = 1; },

    step(i, w) {
      const g = w.g, input = w.input;
      // azione 1: tasto sinistro sull'unita'
      if (i.hover === 1 && input.mouseReleased[0]) {
        if (i.dc === 1) {
          for (const o of w.all(CAV)) if (inView(w, o)) { o.selected = 1; g.sel += 1; g.milsel += 1; }
        }
        if (g.sele > -1 && i.selected === 0) {
          i.selected = 1;
          g.milsel += 1;
          if (i.dc === 0) g.sel += 1;
          // + hint_multi la prima volta (con i suggerimenti)
          if (i.dc === 0) { i.dc = 1; i.alarm.set(1, 30); }
        }
        if (g.sele === -1) {
          if (i.selected === 1) { g.sel -= 1; g.milsel -= 1; }
          i.selected = 0;
        }
      }
      // azione 2: morte
      const diro = i.direction;
      if (i.life <= 0) {
        p.free(i);
        w.destroy(i);
        g.pop -= 3;
        const corpse = w.create("cavaliere_corpse", i.x, i.y);
        corpse.direction = diro;
        if (i.selected === 1) { g.sel -= 1; g.milsel -= 1; }
        return; // [I] l'istanza distrutta smette di contare: il resto dello Step non cambia nulla di visibile
      }
      // azione 3: velocita'
      i.autospeed = (5 + i.chargespeed) * iso(i.direction);
      // azione 4: direzione e arrivo
      i.depth = -i.y;
      i.phase = phaseOf(i.direction);
      if (i.action === 1 && pointDistance(i.x, i.y, i.dirox, i.diroy) < 10 * iso(i.direction)) {
        i.action = 0; p.occupy(i); i.warwork = 0; i.speed = 0;
      }
      // azione 6: arrivo (soglia fissa 10)
      if (i.action === 1 && pointDistance(i.x, i.y, i.dirox, i.diroy) < 10) {
        i.action = 0; i.warwork = 0; i.creation = 0; p.occupy(i); i.speed = 0;
      }
      // azione 7: sprite
      ANIM[CAV](i, w);
      // azione 8: rettangolo di selezione
      boxSelect(i, w, false);
      // azione 9: se il punto d'arrivo e' occupato, arretra di 50 verso di se'
      if (i.action === 1 && !w.placeFree(i, i.dirox, i.diroy)) {
        if (i.creation !== 1) {
          const dir = pointDirection(i.dirox, i.diroy, i.x, i.y);
          i.dirox += lengthdirX(50, dir);
          i.diroy += lengthdirY(50, dir);
        } else {
          i.dirox += irandomRange(-50, 50);
          i.diroy += irandomRange(-50, 50);
        }
      }
      // azione 10
      if (w.number("torre_placer") > 0) g.sele = 1;
      // azione 11: movimento
      flowMovement(i, w, p, { dirxDiroyBug: true });
      // azione 12: attacco
      if (autoAttack(i, w, p) === "exit") return;
      // azione 13: pulsanti attacco/difesa (con i pulsanti dell'interfaccia, punto 4)
    },

    // Mouse_GlobalLeftPressed: clic altrove senza Ctrl/Alt deseleziona
    globalLeftPressed(i, w) {
      if (w.g.sele === 0 && i.selected === 1) { w.g.sel -= 1; w.g.milsel -= 1; i.selected = 0; }
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    // Mouse_GlobalRightReleased: ordine di movimento
    globalRightReleased(i, w) {
      if (i.selected !== 1) return;
      for (const u of w.all("ally_unit")) if (u.selected === 1) p.free(u);
      i.dirox = w.mouse.x;
      i.diroy = w.mouse.y;
      i.creation = 0;
      i.alarm.set(8, 1200);
      if (i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
      i.action = 1;
      i.warwork = 4;
      if (w.positionMeeting(w.mouse.x, w.mouse.y, "enemy_unit")) i.warwork = 1;
    },
    // ally_unit Keyboard_Escape (ereditato, gira a ogni passo col tasto
    // tenuto) [C]: deseleziona; non tocca milsel (difetto §3.3 n.13, riprodotto)
    keyboard27(i, w) {
      if (w.g.sele === 0 && i.selected === 1) { w.g.sel -= 1; i.selected = 0; }
    },
    drawEnd: unitDrawEnd,
    drawGUI(i, w, d) { unitPanel(i, w, d, "ico_cavaliere"); },
  };
}

// Danno in mischia del cavaliere [C, ally_cavaliere Alarm_2]: per vita
// massima del bersaglio (STUDIO.md §1.4).
const CAV_DAMAGE = { 75: 5, 90: 5, 125: 5, 100: 5, 55: 22, 60: 3 };

// ------------------------------------------------------- pezzi in comune

// Alarm_0 [C, identico in guerriero e cavaliere]: 4 fotogrammi del passo,
// 10 passi l'uno; il ciclo si ferma quando l'unita' si ferma a step 0.
export function walkCycle(i) {
  if (i.step === 0 && i.action === 1) { i.step = 1; i.alarm.set(0, 10); return; }
  if (i.step === 1) { i.step = 2; i.alarm.set(0, 10); return; }
  if (i.step === 2 && i.action === 1) { i.step = 3; i.alarm.set(0, 10); return; }
  if (i.step === 3) { i.step = 0; i.alarm.set(0, 10); }
}

// Rettangolo di selezione [C, Step "selezione multipla"]: mentre il tasto
// sinistro e' tenuto e nessun modificatore, dentro = selezionato.
export function boxSelect(i, w, firesel) {
  const g = w.g, mx = w.mouse.x, my = w.mouse.y;
  if (g.multi !== 1 || g.sele !== 0) return;
  const inside = (i.x > g.startx && i.x < mx && i.y > g.starty && i.y < my)
    || (i.x < g.startx && i.x > mx && i.y > g.starty && i.y < my)
    || (i.x > g.startx && i.x < mx && i.y < g.starty && i.y > my)
    || (i.x < g.startx && i.x > mx && i.y < g.starty && i.y > my);
  if (inside) {
    if (i.selected === 0) { g.sel += 1; g.milsel += 1; if (firesel) g.firesel++; }
    i.selected = 1;
  } else {
    if (i.selected === 1) { g.sel -= 1; g.milsel -= 1; if (firesel) g.firesel--; }
    i.selected = 0;
  }
}

// Step "Movimento con flow field" [C, guerriero azione 9 / cavaliere
// azione 11]: lontano (>400) o sovrapposto si segue il flow field, dando
// la precedenza all'alleato con `ordo` piu' alto; vicino si usa
// mp_potential_step. Poi, se la cella d'arrivo e' diventata un ostacolo, si
// ricalcola il campo.
// [Difetto §3.3 n.12] nel cavaliere il ricalcolo passa dirox anche come y
// (scr_find_valid_cell_backwards(dirox div 32, dirox div 32, ...)) e non
// controlla action=1: riprodotto con dirxDiroyBug.
function flowMovement(i, w, p, { dirxDiroyBug = false } = {}) {
  if (i.target_eu && !i.target_eu.alive) i.target_eu = null;
  if (i.action === 1) {
    if (pointDistance(i.x, i.y, i.dirox, i.diroy) > 400 || !w.placeFree(i, i.x, i.y)) {
      const otro = w.instancePlace(i, i.x, i.y, "ally_unit");
      if (otro) {
        if (otro.ordo > i.ordo || otro.action !== 1) moveFlowField(w, p, i);
        else { i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); }
      } else {
        moveFlowField(w, p, i);
      }
    } else {
      if (i.firework === 0 && (i.warwork === 0 || i.warwork === 4)) mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
      if (i.firework === 1 && i.targetid) mpPotentialStep(w, i, i.targetid.x, i.targetid.y, i.autospeed);
      if (i.warwork === 1 && i.target_eu) mpPotentialStep(w, i, i.target_eu.x, i.target_eu.y, i.autospeed);
      if (i.warwork === 1 && !i.target_eu) {
        const n = w.nearest(i.x, i.y, "enemy_unit");
        if (n && w.distanceToInstance(i, n) < 400) mpPotentialStep(w, i, n.x, n.y, i.autospeed);
      }
    }
  }
  const guard = dirxDiroyBug ? true : i.action === 1;
  if (guard && p.costAt(Math.trunc(i.goal_x / GRID), Math.trunc(i.goal_y / GRID)) >= 1000
      && i.firework === 0 && (dirxDiroyBug ? i.warwork === 0 : (i.warwork === 0 || i.warwork === 4))) {
    p.free(i);
    const ty = dirxDiroyBug ? i.dirox : i.diroy;
    const [cx, cy] = p.findValidCellBackwards(i.goal_field, Math.trunc(i.dirox / GRID), Math.trunc(ty / GRID),
                                              Math.trunc(i.x / GRID), Math.trunc(i.y / GRID));
    const found = p.fieldAt(i.goal_field, cx, cy) !== -1;
    i.goal_x = found ? cx * GRID : i.x;
    i.goal_y = found ? cy * GRID : i.y;
    generateFields(p, i, i.goal_x, i.goal_y);
    i.dirox = i.goal_x;
    i.diroy = i.goal_y;
  }
}

// Step "Attacco" [C, guerriero azione 10 / cavaliere azione 12]: senza un
// bersaglio scelto col clic destro, l'unita' attacca il nemico piu' vicino
// se e' a meno di 10 px, ci va incontro se e' entro `comp` (700 in attacco,
// 50 in difesa) e visibile. Restituisce "exit" dove il GML fa exit.
function autoAttack(i, w, p) {
  if (!w.exists("enemy_unit")) {
    if (i.warwork === 1 || i.warwork === 2 || i.action === 2) {
      i.action = 0; i.warwork = 0; i.speed = 0; p.occupy(i); i.target_eu = null;
    }
    return null;
  }
  if (i.target_eu && !i.target_eu.alive) i.target_eu = null;
  const k = iso(i.direction);
  if (!i.target_eu) {
    const ta = w.nearest(i.x, i.y, "enemy_unit");
    const valid = ta.visible === true;
    const dist = w.distanceToInstance(i, ta);
    if (dist < 10 * k) {
      if (i.warwork === 2 && i.alarm.get(2) < 1) { i.targetx = ta.x; i.targety = ta.y; p.occupy(i); }
      if (i.warwork !== 2 && i.warwork !== 4 && i.alarm.get(2) < 1) {
        i.action = 2; i.warwork = 2; p.occupy(i); i.alarm.set(2, 13);
      }
      return "exit";
    }
    if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.step = 0; p.occupy(i); i.speed = 0; return "exit"; }
    if (i.warwork === 1 && dist >= i.comp * k) { i.action = 0; i.warwork = 0; i.step = 0; p.occupy(i); i.speed = 0; return "exit"; }
    if (dist < i.comp * k && valid && (i.warwork === 0 || i.warwork === 1)) {
      const n = w.nearest(i.x, i.y, "enemy_unit");
      i.dirox = n.x;
      i.diroy = n.y;
      if (i.action !== 1) {
        i.alarm.set(0, 15);
        scrMove(p, i, i.dirox, i.diroy);
        p.free(i);
      }
      i.action = 1;
      i.warwork = 1;
    }
  } else {
    const te = i.target_eu;
    if (w.distanceToInstance(i, te) < 10) {
      if (i.warwork === 2 && i.alarm.get(2) < 1) { i.targetx = te.x; i.targety = te.y; i.target_eu = null; }
      if (i.warwork !== 2 && i.warwork !== 4 && i.alarm.get(2) < 1) {
        i.action = 2; i.warwork = 2; i.alarm.set(2, 13); p.occupy(i);
      }
      return "exit";
    }
    if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.speed = 0; p.occupy(i); i.target_eu = null; }
    if (i.target_eu && (i.warwork === 0 || i.warwork === 1)) {
      i.dirox = i.target_eu.x;
      i.diroy = i.target_eu.y;
      if (i.action !== 1) { i.alarm.set(0, 15); scrMove(p, i, i.dirox, i.diroy); p.free(i); }
      i.action = 1;
      i.warwork = 1;
    }
  }
  if (i.action === 2 && w.exists("enemy_unit")) i.direction = pointDirection(i.x, i.y, i.targetx, i.targety);
  return null;
}

// Alarm_2: colpo in mischia col "versore" [C, STUDIO.md §1.6]: tre fasi da
// 13 passi, al terzo il nemico piu' vicino al punto 30 px davanti perde
// vita secondo la sua vita massima; catapulte e arieti (100/125) colpiti
// mentre sono fermi scappano di 200 px nella direzione del colpo.
// [Difetto corretto §1.5 n.4] io_x/io_y sono la posizione dell'attaccante
// (nel GML alleato non erano dichiarate).
export function meleeStrike(i, w, table, enemySide) {
  if (i.action !== 2) return;
  if (i.step === 0) { i.step = 1; i.alarm.set(2, 13); return; }
  if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
  if (i.step !== 2) return;
  i.step = 0;
  i.alarm.set(2, 13);
  const target = enemySide ? "ally_unit" : "enemy_unit";
  const v = w.nearest(i.x + 30 * Math.cos(degtorad(i.direction)), i.y - 30 * Math.sin(degtorad(i.direction)), target);
  if (!v) return;
  const io_x = i.x, io_y = i.y;
  v.hit = 1;
  if (v.slife !== 125 && v.slife !== 100) v.alarm.set(5, 47);
  const dmg = table[v.slife];
  if (dmg !== undefined) v.life -= dmg;
  if ((v.slife === 125 || v.slife === 100) && v.action === 0) {
    const dirscampa = pointDirection(io_x, io_y, v.x, v.y);
    v.action = 1; v.warwork = 4; v.step = 0;
    if (v.alarm.get(0) < 0) v.alarm.set(0, 12);
    v.dirox = v.x + lengthdirX(200, dirscampa);
    v.diroy = v.y + lengthdirY(200, dirscampa);
  }
}

// Alarm_10: verso la bandiera di raccolta dell'edificio che l'ha creata
// [C]; flaggox = nada (noone) se non c'e' bandiera.
function rallyMove(i, w, p, offset100) {
  if (i.flaggox === null || i.flaggox === undefined) return;
  i.dirox = i.flaggox;
  i.diroy = i.flaggoy;
  i.alarm.set(8, 3000);
  if (i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
  i.action = 1;
  i.warwork = 4;
  if (w.positionMeeting(i.flaggox + (offset100 ? 100 : 0), i.flaggoy, "enemy_unit")) i.warwork = 1;
  scrMove(p, i, i.flaggox, i.flaggoy);
}

// Draw_End [C, identico in guerriero e cavaliere]: barra della vita, cerchio
// di selezione, segnaposto della destinazione.
export function unitDrawEnd(i, w, d) {
  const C = { black: 0, green: 0x008000 };
  if (i.selected === 1 || i.hover === 1) {
    d.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, C.black, C.black, C.black, C.black, false);
    d.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + (i.life / i.slife) * 50, i.y - 82, C.green, C.green, C.green, C.green, false);
    d.sprite("circ_1", 0, i.x, i.y);
    if (i.action === 1) d.sprite("director_blue", 0, i.dirox, i.diroy);
    d.sprite("director_blue", 0, i.foodx, i.foody);
  }
  if (i.hit === 1 && w.room !== "menu") {
    d.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, C.black, C.black, C.black, C.black, false);
    d.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + (i.life / i.slife) * 50, i.y - 82, C.green, C.green, C.green, C.green, false);
  }
}

// Draw_GUI [C]: scheda dell'unita' quando e' l'unica selezionata.
export function unitPanel(i, w, d, icon) {
  if (i.selected !== 1 || w.g.sel >= 2) return;
  const white = 0xffffff;
  d.setAlpha(0.69);
  d.roundrectColourExt(260, 20, 390, 150, 60, 60, white, white, false);
  d.circleColour(450, 50, 30, white, white, false);
  d.circleColour(450, 120, 30, white, white, false);
  d.setFont("GUI_1");
  d.setColour(0);
  d.setAlpha(0.75);
  d.setValign("middle");
  d.setHalign("center");
  d.text(325, 120, i.life + " / " + i.slife);
  d.setAlpha(1);
  d.sprite(icon, 0, 325, 70);
  d.spriteExt("ico_attacco", 0, 450, 50, 0.5, 0.5, 0, white, 1);
  d.spriteExt("ico_difesa", 0, 450, 120, 0.5, 0.5, 0, white, 1);
  // make_colour_rgb(183,48,48) e (68,95,198), in BGR
  if (i.comp >= 300) {
    d.circleColour(450, 50, 30, 0x3030b7, 0x3030b7, false);
    d.spriteExt("ico_attacco_bianco", 0, 450, 50, 0.5, 0.5, 0, white, 1);
  }
  if (i.comp === 50) {
    d.circleColour(450, 120, 30, 0xc65f44, 0xc65f44, false);
    d.spriteExt("ico_difesa_bianco", 0, 450, 120, 0.5, 0.5, 0, white, 1);
  }
}

// ------------------------------------------------------------- cadaveri

// *_corpse [C, Create/Step/Alarm_0]: tre fotogrammi di morte (13, 13, 40
// passi) nella direzione in cui l'unita' guardava, poi l'istanza sparisce.
export function corpse(name) {
  return {
    create(i) { i.depth = -i.y; i.alarm.set(0, 20); i.step = 0; i.phase = 0; },
    step(i, w) {
      ANIM[name](i, w);          // azione 1: sprite (alla prima passata phase=0: nessuno)
      i.depth = -i.y;            // azione 2: direzione
      i.phase = phaseOf(i.direction);
    },
    alarm0(i, w) {
      if (i.step === 0) { i.step = 1; i.alarm.set(0, 13); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(0, 13); return; }
      if (i.step === 2) { i.step = 3; i.alarm.set(0, 40); return; }
      if (i.step === 3) w.destroy(i);
    },
  };
}

// ------------------------------------------------- nemici (provvisorio)

// [Provvisorio fino al punto 4] I nemici sono bersagli fermi: hanno la vita
// del loro Create [C] e nient'altro (nessuna IA, nessuna morte).
export const ENEMY_LIFE = { enemy_warrior: 75, enemy_picchiere: 60, enemy_arciere: 55,
                            enemy_cavaliere: 90, enemy_catapulta: 100, enemy_ariete: 125 };
export function enemyDummy(name) {
  return {
    create(i) {
      Object.assign(i, { action: 0, warwork: 0, step: 0, hit: 0, defender: 0,
                         life: ENEMY_LIFE[name], slife: ENEMY_LIFE[name] });
    },
    alarm5(i) { i.hit = 0; },
  };
}
