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

import { hintOnce } from "./hints.js";
import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { GRID, generateFields, scrMove, moveFlowField, mpPotentialStep } from "./pathing.js";
import { counterArcher } from "./ranged.js";
import { infantryFire } from "./siege.js";

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

// ally_unit Keyboard_Escape [C], ereditato da tutte le unita' alleate senza
// un Escape proprio. [Difetto corretto §3.3 n.13, confermato dall'autore:
// l'originale decrementava global.sel ma non global.milsel, e i contatori
// della selezione restavano sporchi]
export function escapeDeselect(i, w) {
  if (w.g.sele === 0 && i.selected === 1) {
    w.g.sel -= 1;
    if (!w.is(i, "ally_omino")) w.g.milsel -= 1;
    // [Correzione decisa dall'autore, §3.9 n.30] anche il contatore del tipo
    const extra = selCounter(w, i);
    if (extra) w.g[extra] -= 1;
    i.selected = 0;
  }
}

// Contatore di selezione per tipo [C]: firesel per guerrieri e picchieri
// (possono dare fuoco), arcsel per gli arcieri, siegsel per l'assedio.
export function selCounter(w, i) {
  if (w.is(i, "ally_infantry")) return "firesel";
  if (i.object === "ally_arciere") return "arcsel";
  if (i.object === "ally_ariete" || i.object === "ally_catapulta") return "siegsel";
  return null;
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
          hintOnce(w, "hint_multi", "multihint", i.x, i.y);
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
      flowMovement(i, w, p, { cavalier: true });
      // azione 12: attacco
      if (autoAttack(i, w, p) === "exit") return;
      // azione 13: pulsanti attacco/difesa
      behaviourButtons(i, w);
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
    // tenuto) [C]: deseleziona.
    keyboard27: escapeDeselect,
    drawEnd: unitDrawEnd,
    drawGUI(i, w, d) { unitPanel(i, w, d, "ico_cavaliere"); },
    collisions: { b_arciere_bullet: counterArcher },
  };
}

// "creazione pulsanti di comportamento" [C, Step di ogni unita' militare]
function behaviourButtons(i, w) {
  if (i.selected === 1 && w.number("attacco_clicker") === 0) {
    w.create("attacco_clicker", 0, 0);
    w.create("difesa_clicker", 0, 0);
  }
}

// ------------------------------------------------------------- fanteria

// ally_warrior e ally_picchiere [C]: stesso codice, il picchiere e' una
// versione precedente (come il cavaliere). Differenze nella tabella.
// Danni di Alarm_2 per vita massima del bersaglio (STUDIO.md §1.4).
const INFANTRY = {
  ally_warrior: { rank: 3, life: 75, corpse: "warrior_corpse", icon: "ico_guerriero", alarm8: 3000,
                  damage: { 75: 7, 60: 7, 125: 7, 100: 7, 55: 15, 90: 4 },
                  // il guerriero e' la versione piu' recente
                  clickFirst: false, exactStop: false, nearRank: true, warwork4: true, move100: true,
                  faceTarget: true, rally100: true, occupyAtCreate: false, globalLeft: false },
  ally_picchiere: { rank: 2, life: 60, corpse: "picchiere_corpse", icon: "ico_picchiere", alarm8: 1200,
                    damage: { 75: 3, 60: 3, 125: 3, 100: 3, 55: 5, 90: 8 },
                    clickFirst: true, exactStop: true, nearRank: false, warwork4: false, move100: false,
                    faceTarget: false, rally100: false, occupyAtCreate: true, globalLeft: true },
};

export function infantry(name, p) {
  const T = INFANTRY[name];
  // Step, "tasto sinistro del mouse" [C]: selezione, doppio clic (tutti
  // quelli dello stesso tipo nella view), Alt deseleziona
  const leftClick = (i, w) => {
    const g = w.g;
    if (!(i.hover === 1 && w.input.mouseReleased[0])) return;
    if (i.dc === 1) {
      for (const o of w.all(name)) if (inView(w, o)) { o.selected = 1; g.sel += 1; g.milsel += 1; g.firesel++; }
    }
    if (g.sele > -1 && i.selected === 0) {
      i.selected = 1;
      g.milsel += 1;
      g.firesel++;
      hintOnce(w, "hint_multi", "multihint", i.x, i.y);
      if (i.dc === 0) g.sel += 1;
      if (i.dc === 0) { i.dc = 1; i.alarm.set(1, 30); }
    }
    if (g.sele === -1) {
      if (i.selected === 1) { g.sel -= 1; g.firesel--; g.milsel -= 1; }
      i.selected = 0;
    }
  };
  const b = {
    create(i, w) {
      const g = w.g;
      Object.assign(i, {
        selected: 0, creation: 0, foodx: 0, foody: 0, goal_x: 0, goal_y: 0, targetx: 0, targety: 0,
        flaggox: null, flaggoy: null, action: 0, idling: 1, step: 0, phase: 1, hit: 0, hov: 0, hover: 0, dc: 0,
        autospeed: 0, warwork: 0, visib: 0, comp: 700, assi: 0, firework: 0, targetid: null, target_eu: null,
        pass: 1, direction: 0, life: T.life, slife: T.life, xprev: i.x, yprev: i.y,
      });
      g.pop += 2;
      g.order++;
      i.ordo = g.order * T.rank;
      i.dirox = i.x;
      i.diroy = i.y;
      // (alarm[3]=1 nel guerriero: nessun evento Alarm_3, non fa nulla)
      // azione 2: flow field iniziale sul posto
      p.findFreeSpawn(i);
      generateFields(p, i, i.x, i.y);
      i.dirox = i.x;
      i.diroy = i.y;
      if (T.occupyAtCreate) p.occupy(i);
    },
    roomStart(i) { p.occupy(i); },
    alarm0: walkCycle,
    alarm1(i) { i.dc = 0; },
    alarm2(i, w) { meleeStrike(i, w, T.damage, false, T.faceTarget); },
    alarm4: infantryFire,
    alarm5(i) { i.hit = 0; },
    alarm8(i) { i.dirox = i.x; i.diroy = i.y; },
    alarm10(i, w) { rallyMove(i, w, p, T.rally100); },

    step(i, w) {
      const g = w.g;
      if (T.clickFirst) leftClick(i, w);
      // morte: instance_destroy prima di tutto (il Destroy gira subito)
      const diro = i.direction;
      if (i.life <= 0) {
        p.free(i);
        w.destroy(i);
        g.pop -= 2;
        const corpse = w.create(T.corpse, i.x, i.y);
        corpse.direction = diro;
        if (i.selected === 1) { g.sel -= 1; g.firesel--; g.milsel -= 1; }
        return;
      }
      // movimento e direzione
      i.autospeed = 4 * iso(i.direction);
      i.depth = -i.y;
      i.phase = phaseOf(i.direction);
      if (i.action === 1 && (T.exactStop ? i.x === i.dirox && i.y === i.diroy
                                         : pointDistance(i.x, i.y, i.dirox, i.diroy) < 10 * iso(i.direction))) {
        i.action = 0; p.occupy(i); i.creation = 0; i.warwork = 0; i.speed = 0;
      }
      ANIM[name](i, w);
      boxSelect(i, w, true);
      // destinazione occupata: 32 px verso di se' (a caso se appena creato)
      if (i.action === 1 && !w.placeFree(i, i.dirox, i.diroy)) {
        if (i.creation !== 1) {
          const dir = pointDirection(i.dirox, i.diroy, i.x, i.y);
          i.dirox += lengthdirX(32, dir);
          i.diroy += lengthdirY(32, dir);
        } else {
          i.dirox += irandomRange(-32, 32);
          i.diroy += irandomRange(-32, 32);
        }
      }
      behaviourButtons(i, w);
      // dare fuoco alle case (firework, action 6)
      if (i.targetid && !i.targetid.alive) { i.targetid = null; i.firework = 0; }
      if (i.firework === 1 && i.warwork !== 2 && i.targetid && w.distanceToInstance(i, i.targetid) < 70) {
        i.firework = 0;
        i.direction = pointDirection(i.x, i.y, i.targetid.x, i.targetid.y);
        i.step = 0;
        i.alarm.set(4, 13);
        i.action = 6;
      }
      // [Difetto corretto §3.3 n.12, confermato dall'autore] nel picchiere
      // il ricalcolo passa dirox anche come y, come nel cavaliere
      flowMovement(i, w, p, { nearRank: T.nearRank, warwork4: T.warwork4 });
      if (autoAttack(i, w, p, { move100: T.move100, faceTarget: T.faceTarget }) === "exit") return;
      if (!T.clickFirst) leftClick(i, w);
    },

    // Destroy [C]: il codice di "clic fuori" sta nel Destroy: deseleziona
    // e toglie i pulsanti di comportamento se Ctrl/Alt non sono premuti e
    // non si sta sopra quei pulsanti. [Correzione §3.9 n.30] l'originale
    // non scalava firesel.
    destroy(i, w) {
      const g = w.g;
      const hov = (n) => { let h = 0; for (const c of w.all(n)) h = c.hover === 1 ? 1 : 0; return h; };
      if (hov("attacco_clicker") !== 1 && hov("difesa_clicker") !== 1 && i.selected === 1 && g.sele === 0) {
        g.sel -= 1; g.milsel -= 1; g.firesel--; i.selected = 0;
        for (const n of ["attacco_clicker", "difesa_clicker"]) for (const c of w.all(n)) w.destroy(c);
      }
      p.free(i);
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    globalRightReleased(i, w) {
      if (i.selected !== 1) return;
      for (const u of w.all("ally_unit")) if (u.selected === 1) p.free(u);
      i.dirox = w.mouse.x;
      i.diroy = w.mouse.y;
      i.creation = 0;
      i.alarm.set(8, T.alarm8);
      if (i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
      i.action = 1;
      i.warwork = 4;
      if (w.positionMeeting(w.mouse.x, w.mouse.y, "enemy_unit")) i.warwork = 1;
    },
    keyboard27: escapeDeselect,
    drawEnd: unitDrawEnd,
    drawGUI(i, w, d) { unitPanel(i, w, d, T.icon); },
    collisions: { b_arciere_bullet: counterArcher },
  };
  if (T.globalLeft) {
    // ally_picchiere Mouse_GlobalLeftPressed [C]
    b.globalLeftPressed = (i, w) => {
      if (w.g.sele === 0 && i.selected === 1) { w.g.sel -= 1; w.g.milsel -= 1; w.g.firesel--; i.selected = 0; }
    };
    b.stepBegin = (i, w) => { if (w.number("torre_placer") > 0) w.g.sele = 1; };
  }
  return b;
}

// ------------------------------------------------- gruppi di controllo

// ally_militare KeyPress_0..9 e ally_omino KeyPress_0..9 [C]: con Ctrl
// (sele=1) i selezionati entrano nel gruppo N (0 vale 10); senza, il numero
// seleziona il gruppo e deseleziona gli altri. I civili non contano in milsel.
export function controlGroups(civilian) {
  const b = {};
  for (let k = 0; k <= 9; k++) {
    const n = k === 0 ? 10 : k;
    b["keyPress" + (48 + k)] = (i, w) => {
      const g = w.g;
      if (g.sele === 0) {
        if (i.assi === n && i.selected === 0) { g.sel += 1; if (!civilian) g.milsel += 1; i.selected = 1; }
        if (i.assi !== n && i.selected === 1) { g.sel -= 1; if (!civilian) g.milsel -= 1; i.selected = 0; }
      }
      if (g.sele === 1 && i.selected === 1) i.assi = n;
    };
  }
  return b;
}

// ------------------------------------------- pulsanti attacco e difesa

// attacco_clicker / difesa_clicker [C]: comp 700 (insegue entro 700 px) o
// 200.
export function behaviourClicker(kind) {
  const attack = kind === "attacco";
  const apply = (w) => {
    for (const u of w.all("ally_militare")) if (u.selected === 1) u.comp = attack ? 700 : 200;
    if (!attack) for (const u of w.all("ally_arciere")) if (u.selected === 1) u.comp = 200;
  };
  return {
    create(i) { i.active = 0; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      w.setPos(i, c.x + 450 * g.scaleview, c.y + (attack ? 50 : 120) * g.scaleview);
      i.depth = -i.y - 999;
      if (g.milsel === 0) { w.destroy(i); return; }
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
    },
    leftReleased(i, w) { apply(w); },
    [attack ? "keyPress81" : "keyPress65"](i, w) { apply(w); },
    mouseEnter(i, w) { i.hover = 1; w.g.sele = 2; },
    mouseLeave(i, w) { i.hover = 0; w.g.sele = 0; },
    drawGUI(i, w, d) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH, white = 0xffffff, y = attack ? 50 : 120;
      d.setAlpha(0.69);
      d.roundrectColourExt(20, H - 150, 340, H - 20, 60, 60, white, white, false);
      d.setAlpha(0.7);
      d.setHalign("left");
      d.text(40, H - 120, attack ? "Aggressive" : "Defensive");
      d.setFont("overdue");
      d.setValign("top");
      d.textExt(40, H - 90, attack ? "Military units engage enemy units in a fight at a greater distance."
                                   : "Military units engage enemy units in a fight only if they are nearby.", 30, 280);
      d.setValign("middle"); // fa_center: lo stesso valore di fa_middle [I]
      d.setFont("GUI_1");
      d.setHalign("right");
      d.text(320, H - 120, attack ? "Shortcut: Q" : "Shortcut: A");
      d.setAlpha(0.99);
      d.circleColour(450, y, 30, white, white, false);
      d.setAlpha(1);
      d.spriteExt(attack ? "ico_attacco" : "ico_difesa", 0, 450, y, 0.5, 0.5, 0, white, 1);
    },
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
// counter: true o "firesel" per i guerrieri, "arcsel" per gli arcieri.
export function boxSelect(i, w, counter) {
  const extra = counter === true ? "firesel" : counter || null;
  const g = w.g, mx = w.mouse.x, my = w.mouse.y;
  if (g.multi !== 1 || g.sele !== 0) return;
  const inside = (i.x > g.startx && i.x < mx && i.y > g.starty && i.y < my)
    || (i.x < g.startx && i.x > mx && i.y > g.starty && i.y < my)
    || (i.x > g.startx && i.x < mx && i.y < g.starty && i.y > my)
    || (i.x < g.startx && i.x > mx && i.y < g.starty && i.y > my);
  if (inside) {
    if (i.selected === 0) { g.sel += 1; g.milsel += 1; if (extra) g[extra]++; }
    i.selected = 1;
  } else {
    if (i.selected === 1) { g.sel -= 1; g.milsel -= 1; if (extra) g[extra]--; }
    i.selected = 0;
  }
}

// Step "Movimento con flow field" [C, guerriero azione 9 / cavaliere
// azione 11]: lontano (>400) o sovrapposto si segue il flow field, dando
// la precedenza all'alleato con `ordo` piu' alto; vicino si usa
// mp_potential_step. Poi, se la cella d'arrivo e' diventata un ostacolo, si
// ricalcola il campo.
// Differenze del cavaliere [C]: il ricalcolo non controlla action=1 e
// accetta solo warwork=0 (il guerriero anche 4).
// [Difetto corretto §3.3 n.12, confermato dall'autore] nel cavaliere il
// ricalcolo passava dirox anche come y: scr_find_valid_cell_backwards(dirox
// div 32, dirox div 32, ...). Qui usa diroy come il guerriero.
// Varianti [C]: il guerriero, quando e' vicino, rallenta a 0 se tocca un
// alleato di rango piu' alto in movimento (nearRank) e insegue il nemico
// piu' vicino fino a 400 px compresi; il ricalcolo accetta warwork 0 o 4
// (warwork4) e solo in movimento (cavalier=false).
function flowMovement(i, w, p, { cavalier = false, nearRank = false, warwork4 = true, speed = 4 } = {}) {
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
      if (nearRank) {
        const otro = w.instancePlace(i, i.x, i.y, "ally_unit");
        if (otro && !(otro.ordo < i.ordo || otro.action !== 1)) {
          i.step = 0; i.autospeed = 0; i.alarm.set(0, i.alarm.get(0) + 1);
        } else i.autospeed = speed * iso(i.direction);
      }
      if (i.firework === 0 && (i.warwork === 0 || i.warwork === 4)) mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
      if (i.firework === 1 && i.targetid) mpPotentialStep(w, i, i.targetid.x, i.targetid.y, i.autospeed);
      if (i.warwork === 1 && i.target_eu) mpPotentialStep(w, i, i.target_eu.x, i.target_eu.y, i.autospeed);
      if (i.warwork === 1 && !i.target_eu) {
        const n = w.nearest(i.x, i.y, "enemy_unit");
        if (n && (nearRank ? w.distanceToInstance(i, n) <= 400 : w.distanceToInstance(i, n) < 400)) mpPotentialStep(w, i, n.x, n.y, i.autospeed);
      }
    }
  }
  const guard = cavalier ? true : i.action === 1;
  if (guard && p.costAt(Math.trunc(i.goal_x / GRID), Math.trunc(i.goal_y / GRID)) >= 1000
      && i.firework === 0 && (warwork4 && !cavalier ? (i.warwork === 0 || i.warwork === 4) : i.warwork === 0)) {
    p.free(i);
    const [cx, cy] = p.findValidCellBackwards(i.goal_field, Math.trunc(i.dirox / GRID), Math.trunc(i.diroy / GRID),
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
// Varianti [C]: il guerriero va col flow field (scr_move) solo se il
// nemico e' entro 100 px (move100) e, colpendo il bersaglio scelto, si gira
// verso di lui (faceTarget).
function autoAttack(i, w, p, { move100 = false, faceTarget = false } = {}) {
  const near100 = (t) => !move100 || w.distanceToInstance(i, t) < 100 * iso(i.direction);
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
        if (near100(ta)) scrMove(p, i, i.dirox, i.diroy);
        p.free(i);
      }
      i.action = 1;
      i.warwork = 1;
    }
  } else {
    const te = i.target_eu;
    if (w.distanceToInstance(i, te) < 10) {
      if (i.warwork === 2 && i.alarm.get(2) < 1) {
        i.targetx = te.x; i.targety = te.y;
        if (faceTarget) i.direction = pointDirection(i.x, i.y, i.targetx, i.targety);
        i.target_eu = null;
      }
      if (i.warwork !== 2 && i.warwork !== 4 && i.alarm.get(2) < 1) {
        i.action = 2; i.warwork = 2; i.alarm.set(2, 13); p.occupy(i);
      }
      return "exit";
    }
    if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.speed = 0; p.occupy(i); i.target_eu = null; }
    if (i.target_eu && (i.warwork === 0 || i.warwork === 1)) {
      i.dirox = i.target_eu.x;
      i.diroy = i.target_eu.y;
      if (i.action !== 1) { i.alarm.set(0, 15); if (near100(i.target_eu)) scrMove(p, i, i.dirox, i.diroy); p.free(i); }
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
// Il guerriero controlla che esista un bersaglio e si gira verso di lui
// prima di colpire (face) [C, ally_warrior Alarm_2].
export function meleeStrike(i, w, table, enemySide, face = false) {
  if (i.action !== 2) return;
  if (i.step === 0) { i.step = 1; i.alarm.set(2, 13); return; }
  if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
  if (i.step !== 2) return;
  i.step = 0;
  i.alarm.set(2, 13);
  const target = enemySide ? "ally_unit" : "enemy_unit";
  const v = w.nearest(i.x + 30 * Math.cos(degtorad(i.direction)), i.y - 30 * Math.sin(degtorad(i.direction)), target);
  if (!v) return;
  if (face) i.direction = pointDirection(i.x, i.y, v.x, v.y);
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

// Draw_End [C, identico in guerriero, picchiere e cavaliere]: barra della
// vita, cerchio di selezione, segnaposto della destinazione, numero del
// gruppo di controllo (non nell'arciere: unitDrawEnd(..., false)).
export function unitDrawEnd(i, w, d, showGroup = true) {
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
  if (showGroup && i.assi && i.assi !== 0) {
    d.setAlpha(0.3);
    d.setFont("GUI_1");
    d.setHalign("center");
    d.text(i.x, i.y - 100, i.assi !== 10 ? i.assi : "0");
    d.setFont("GUI_1");
    d.setAlpha(1);
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
  // [Correzione decisa dall'autore, §3.9 n.31] l'originale evidenziava la
  // difesa solo con comp=50, ma il pulsante Difesa mette 200
  if (i.comp < 300) {
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
