// Arcieri e frecce: arciere alleato, le quattro frecce (arciere_bullet e
// arciere_bullet_t alleate, b_arciere_bullet e b_arciere_bullet_t nemiche),
// il presidio di torri e castello, le frecce del centro, la torre nemica e
// le bandiere. Trascrizione di src/objects/<oggetto>/; nomi originali.
// (L'arciere nemico e' in enemies.js con gli altri nemici.)

import { hintOnce } from "./hints.js";
import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { GRID, generateFields, scrMove, moveFlowField, mpPotentialStep, arriveIfBlocked, seesGoal } from "./pathing.js";
import { REPOS_WAIT, shootable, firingSpot, aimArrow, arrowStopped } from "./archery.js";
import { phaseOf, walkCycle, boxSelect, escapeDeselect, unitDrawEnd, unitPanel, controlGroups } from "./units.js";
import { atkSignal } from "./enemies.js";
import { baseCounters } from "./enemybuild.js";

const iso = (dir) => 1 - 0.36 * Math.abs(Math.sin(degtorad(dir)));
const BLACK = 0, GREEN = 0x008000;

// ---------------------------------------------------------------- frecce

// Frecce alleate [C, arciere_bullet / arciere_bullet_t]: 27 px per passo
// (20 quelle degli arcieri, che la riassegnano), 33 passi di vita. Danni
// per tipo di nemico; contro il cavaliere la freccia sparisce al passo dopo
// invece che subito.
const ALLY_HIT = { enemy_warrior: 6, enemy_picchiere: 6, enemy_arciere: 6, enemy_cavaliere: 4,
                   enemy_ariete: 3, enemy_catapulta: 3 };

export function allyArrow(tower) {
  const collisions = {};
  for (const [name, dmg] of Object.entries(ALLY_HIT)) {
    collisions[name] = (i, w, other) => {
      other.life -= dmg;
      if (name !== "enemy_ariete" && name !== "enemy_catapulta") other.hit = 1;
      other.alarm.set(5, 47);
      if (name === "enemy_cavaliere") i.alarm.set(0, 1); else w.destroy(i);
    };
  }
  return {
    create(i, w) {
      i.alarm.set(0, 33);
      // arciere_bullet_t: mira al nemico piu' vicino (torri, castello, centro)
      if (tower) {
        const e = w.nearest(i.x, i.y, "enemy_unit");
        if (e) i.direction = pointDirection(i.x, i.y, e.x, e.y);
      }
      i.speed = 27;
    },
    alarm0(i, w) { w.destroy(i); },
    step(i, w) {
      i.image_angle = i.direction; i.depth = -i.y - 5;
      if (arrowStopped(i, w)) w.destroy(i); // §6.4
    },
    collisions,
  };
}

// Frecce nemiche [C, b_arciere_bullet / b_arciere_bullet_t]: mirano
// all'alleato piu' vicino. Il colpito scappa di 200 px (il cavaliere di 300
// con b_arciere_bullet) se non sta combattendo; il civile scappa sempre;
// catapulte e arieti fermi scappano (solo b_arciere_bullet mette warwork 4).
const ENEMY_HIT = { ally_warrior: 6, ally_picchiere: 6, ally_arciere: 6, ally_cavaliere: 4, ally_omino: 5,
                    ally_ariete: 3, ally_catapulta: 3 };

export function enemyArrow(tower) {
  const collisions = {};
  for (const [name, dmg] of Object.entries(ENEMY_HIT)) {
    collisions[name] = (i, w, o) => {
      const io_x = i.x, io_y = i.y;
      atkSignal(i, w);
      o.life -= dmg;
      o.hit = 1;
      o.alarm.set(5, 47);
      const away = (r) => {
        const d = pointDirection(io_x, io_y, o.x, o.y);
        return [o.x + lengthdirX(r, d), o.y + lengthdirY(r, d)];
      };
      if (name === "ally_omino") {
        o.alarm.set(10, 10);
        [o.flaggox, o.flaggoy] = away(200);
      } else if (name === "ally_ariete" || name === "ally_catapulta") {
        if (o.action === 0) {
          if (o.alarm.get(0) < 1) o.alarm.set(0, 10);
          [o.dirox, o.diroy] = away(200);
          o.action = 1; o.step = 0;
          if (!tower) o.warwork = 4;
        }
      } else if (o.warwork === 0) {
        o.alarm.set(10, 10);
        [o.flaggox, o.flaggoy] = away(name === "ally_cavaliere" && !tower ? 300 : 200);
      }
      w.destroy(i);
    };
  }
  return {
    create(i, w) {
      i.alarm.set(0, 33);
      const a = w.nearest(i.x, i.y, "ally_unit");
      if (a) { i.direction = pointDirection(i.x, i.y, a.x, a.y); i.speed = 27; }
    },
    alarm0(i, w) { w.destroy(i); },
    step(i, w) {
      i.image_angle = i.direction; i.depth = -i.y - 5;
      if (arrowStopped(i, w)) w.destroy(i); // §6.4
    },
    collisions,
  };
}

// Collision_b_arciere_bullet di guerriero, picchiere e cavaliere [C]: chi
// e' colpito va verso l'arciere nemico piu' vicino, se lo vede.
// `warwark` (sic) non e' mai assegnata: vale 0 e la condizione e' sempre
// vera (§3.11).
export function counterArcher(i, w) {
  const a = w.nearest(i.x, i.y, "enemy_arciere");
  const vis = !!a && a.visible === true;
  i.visib = vis ? 1 : 0;
  if ((i.action === 0 || i.action === 1) && vis) {
    i.action = 1;
    i.target_eu = null;
    i.dirox = a.x; i.diroy = a.y;
    i.warwork = 4;
    if (i.speed === 0) i.alarm.set(0, 13);
  }
}

// ------------------------------------------------------- arciere alleato

const ARC = "ally_arciere";

export function allyArcher(p) {
  const stopHere = (i) => {
    i.action = 0; i.dirox = i.x; i.diroy = i.y; i.warwork = 0; i.step = 0; p.occupy(i); i.speed = 0;
    i.anchorX = null; i.anchorY = null; i.repos = 0; // §6.4: fine del combattimento
  };
  // §6.4: nemici a tiro ma nessuno in linea. Se sta gia' andando verso un
  // punto di tiro continua; arrivato (o se inseguiva il nemico) si ferma e
  // cerca un punto vicino col guinzaglio; senza punto resta li' e riprova
  // fra REPOS_WAIT passi.
  const reposition = (i, w, t, range) => {
    if (i.repos === 1) {
      if (i.action === 1 && pointDistance(i.x, i.y, i.dirox, i.diroy) >= 12) return;
      i.repos = 0; i.action = 0; i.warwork = 0; i.step = 0; i.speed = 0; p.occupy(i);
      i.reposAt = w._stepNo + REPOS_WAIT;
      return;
    }
    if (i.action === 1 && i.warwork === 1) { i.action = 0; i.warwork = 0; i.step = 0; i.speed = 0; p.occupy(i); }
    if ((i.reposAt || 0) > w._stepNo) return;
    const spot = firingSpot(w, p, i, t, range);
    if (!spot) { i.reposAt = w._stepNo + REPOS_WAIT; return; }
    scrMove(p, i, spot[0], spot[1]);
    i.dirox = spot[0]; i.diroy = spot[1];
    if (i.action !== 1) { i.alarm.set(0, 15); i.step = 0; }
    i.action = 1; i.warwork = 4; i.repos = 1;
  };
  const leftClick = (i, w) => {
    const g = w.g;
    if (!(i.hover === 1 && w.input.mouseReleased[0])) return;
    if (i.dc === 1) {
      const c = w.cam;
      for (const o of w.all(ARC)) {
        if (o.x > c.x && o.x < c.x + c.w && o.y > c.y && o.y < c.y + c.h) { o.selected = 1; g.sel += 1; g.milsel += 1; g.arcsel += 1; }
      }
    }
    if (g.sele > -1 && i.selected === 0) {
      i.selected = 1;
      g.arcsel++;
      g.milsel += 1;
      if (i.dc === 0) g.sel += 1;
      if (i.dc === 0) { i.dc = 1; i.alarm.set(1, 30); }
    }
    hintOnce(w, "hint_multi", "multihint", i.x, i.y, w.room === "match");
    if (g.sele === -1) {
      if (i.selected === 1) { g.sel -= 1; g.milsel -= 1; g.arcsel -= 1; }
      i.selected = 0;
    }
  };
  const destination = (i, w) => {
    if (i.action === 1 && !w.placeFree(i, i.dirox, i.diroy)) {
      if (i.creation !== 1) {
        const d = pointDirection(i.dirox, i.diroy, i.x, i.y);
        i.dirox += lengthdirX(32, d); i.diroy += lengthdirY(32, d);
      } else { i.dirox += irandomRange(-32, 32); i.diroy += irandomRange(-32, 32); }
    }
  };
  // azione 13, movimento [C]: flow field oltre 500 px
  const move = (i, w) => {
    if (i.target_eu && !i.target_eu.alive) i.target_eu = null;
    if (i.action === 1) {
      const moveOrder = (i.warwork === 0 || i.warwork === 4) && i.presidiowork === 0; // §6.2 D
      if (pointDistance(i.x, i.y, i.dirox, i.diroy) > 500 || !w.placeFree(i, i.x, i.y) || (moveOrder && !seesGoal(p, i))) {
        const otro = w.instancePlace(i, i.x, i.y, "ally_unit");
        if (otro) {
          if (otro.ordo > i.ordo || otro.action !== 1) moveFlowField(w, p, i);
          else { i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); }
        } else moveFlowField(w, p, i);
      } else {
        if ((i.warwork === 0 || i.warwork === 4) && i.presidiowork === 0) {
          mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
          arriveIfBlocked(i); // §6.1 n.89
        }
        if (i.presidiowork === 1) mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
        const n = w.nearest(i.x, i.y, "enemy_unit");
        if (i.warwork === 1 && n && w.distanceToInstance(i, n) < 800 * iso(i.direction)) mpPotentialStep(w, i, n.x, n.y, i.autospeed);
      }
    }
    if (p.costAt(Math.trunc(i.goal_x / GRID), Math.trunc(i.goal_y / GRID)) >= 1000 && i.presidiowork === 0
        && i.warwork === 0 && i.action === 1) {
      p.free(i);
      // [§6.1 n.89] la cella libera piu' vicina, non di nuovo quella occupata
      const [cx, cy] = p.nearestFreeCell(i.goal_field, Math.trunc(i.dirox / GRID), Math.trunc(i.diroy / GRID),
                                         Math.trunc(i.x / GRID), Math.trunc(i.y / GRID));
      const found = p.fieldAt(i.goal_field, cx, cy) !== -1;
      i.goal_x = found ? cx * GRID : i.x;
      i.goal_y = found ? cy * GRID : i.y;
      generateFields(p, i, i.goal_x, i.goal_y);
      i.dirox = i.goal_x; i.diroy = i.goal_y;
    }
  };
  // azione 14, attacco [C]: tira entro 600 px (al bersaglio scelto col
  // click destro, se c'e'), si avvicina entro `comp` a un nemico visibile.
  // [Correzione decisa dall'autore, §3.11 n.44] con un bersaglio scelto
  // l'originale non assegnava target_auto_valid (0): fuori tiro l'arciere
  // lo dimenticava. Qui vale la visibilita' del bersaglio scelto.
  const attack = (i, w) => {
    if (!w.exists("enemy_unit")) {
      if (i.warwork === 1 || i.warwork === 2 || i.action === 2) {
        i.action = 0; i.warwork = 0; i.speed = 0; p.occupy(i); i.target_eu = null;
      }
      i.anchorX = null; i.anchorY = null; // §6.4
      return null;
    }
    if (!(i.atktarget && i.atktarget.alive)) { i.atkorder = 0; i.atktarget = null; }
    const k = iso(i.direction);
    let valid = false;
    valid = (i.atkorder === 0 ? w.nearest(i.x, i.y, "enemy_unit") : i.atktarget).visible === true;
    i.targvalid = valid ? 1 : 0;
    const t = i.atkorder === 0 ? w.nearest(i.x, i.y, "enemy_unit") : i.atktarget;
    if (w.distanceToInstance(i, t) < 600 * k) {
      // §6.4: il piu' vicino a tiro con la linea libera (o quello scelto, se
      // e' in linea); se nessuno, ci si sposta nei paraggi
      const s = i.atkorder === 0 ? shootable(w, i, "enemy_unit", (o) => w.distanceToInstance(i, o) < 600 * k)
        : (w.shotClear(i.x, i.y, t.x, t.y) ? t : null);
      if (!s) {
        if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.step = 0; i.speed = 0; p.occupy(i); }
        reposition(i, w, t, 0.9 * 600 * k);
        return "exit";
      }
      i.shot = s;
      if (i.warwork === 2) {
        i.targetx = s.x; i.targety = s.y;
        i.direction = pointDirection(i.x, i.y, i.targetx, i.targety);
        p.occupy(i);
      }
      if (i.warwork === 0 || i.warwork === 1 || (i.warwork === 4 && i.repos === 1)) {
        i.action = 2; p.occupy(i); i.warwork = 2; i.alarm.set(2, 13); i.repos = 0;
      }
      return "exit";
    } else if (i.warwork === 2) {
      i.action = 0; i.warwork = 0; i.step = 0; p.occupy(i); i.speed = 0;
      return "exit";
    }
    if (i.action !== 1 && i.warwork !== 2) {
      if (w.distanceToInstance(i, t) < i.comp * k && valid) {
        if (i.warwork === 0 || i.warwork === 1) {
          i.dirox = t.x; i.diroy = t.y;
          if (i.action !== 1) { i.alarm.set(0, 15); i.step = 0; scrMove(p, i, i.dirox, i.diroy); p.free(i); }
          i.action = 1; i.warwork = 1;
          return "exit";
        }
      } else {
        stopHere(i);
        if (i.atkorder !== 0) { i.atktarget = null; i.atkorder = 0; }
        return "exit";
      }
    }
    if (i.action === 1 && i.warwork === 1 && i.atkorder === 0
        && (w.distanceToInstance(i, w.nearest(i.x, i.y, "enemy_unit")) > 800 * k || !valid)) {
      stopHere(i);
      return "exit";
    }
    return null;
  };
  // azione 15, presidio [C]: arrivato a meno di 10 px dalla torre (2 posti)
  // o dal castello (4), l'arciere entra: sparisce e l'edificio tira una
  // freccia in piu'
  const garrison = (i, w, g) => {
    // fullt e fullc si calcolano prima di entrambi i controlli
    const blds = [["torre", 1], ["castello", 3]].map(([n, max]) => {
      const b = w.nearest(i.dirox, i.diroy, n);
      return [b, b ? b.npresidio > max : false];
    });
    for (const [b, full] of blds) {
      if (i.presidiowork !== 1 || i.action !== 1 || !(b && w.distanceToInstance(i, b) < 10)) continue;
      if (!full) {
        w.destroy(i);
        g.pop -= 2;
        if (i.selected === 1) { g.sel -= 1; g.milsel -= 1; g.arcsel -= 1; }
        b.npresidio += 1;
        return;
      }
      if (pointDistance(i.x, i.y, i.dirox, i.diroy) < 100 && i.action === 1) i.presidiowork = 0;
      i.action = 0;
    }
  };
  return {
    ...controlGroups(false),
    create(i, w) {
      const g = w.g;
      p.findFreeSpawn(i);
      generateFields(p, i, i.x, i.y);
      Object.assign(i, {
        action: 0, idling: 1, step: 0, phase: 1, hov: 0, hover: 0, dc: 0, autospeed: 0, warwork: 0, atkorder: 0,
        atktarget: null, firework: 0, comp: 700, presidiowork: 0, life: 55, slife: 55, hit: 0, targvalid: 0,
        selected: 0, creation: 0, assi: 0, target_eu: null, flaggox: null, flaggoy: null, targetx: 0, targety: 0,
        foodx: 0, foody: 0, xprev: i.x, yprev: i.y,
      });
      g.pop += 2;
      g.order++;
      i.ordo = g.order * 4;
      i.dirox = i.x; i.diroy = i.y;
    },
    roomStart(i) { p.occupy(i); },
    alarm0: walkCycle,
    alarm1(i) { i.dc = 0; },
    // Alarm_2 [C]: tre fasi (13, 30, 13 passi), poi la freccia a 20 px per passo
    alarm2(i, w) {
      if (i.action !== 2) return;
      if (i.step === 0) { i.step = 1; i.alarm.set(2, 13); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(2, 30); return; }
      if (i.step !== 2) return;
      i.step = 0;
      i.alarm.set(2, 13);
      // §6.4: la freccia va al bersaglio scelto se e' ancora in linea; se
      // nel frattempo un edificio si e' messo in mezzo, il tiro si annulla
      const t = i.shot && i.shot.alive ? i.shot : null;
      if (!t || !w.shotClear(i.x, i.y, t.x, t.y)) { i.action = 0; i.warwork = 0; i.step = 0; return; }
      const b = w.create("arciere_bullet", i.x, i.y - 40);
      aimArrow(b, i, t);
      b.speed = 20;
    },
    // Alarm_3 (nato in un posto occupato): nessuno lo arma per l'arciere
    alarm5(i) { i.hit = 0; },
    alarm8(i) { i.dirox = i.x; i.diroy = i.y; },
    alarm10(i, w) {
      if (i.flaggox === null || i.flaggox === undefined) return;
      i.dirox = i.flaggox; i.diroy = i.flaggoy;
      i.anchorX = null; i.anchorY = null; i.repos = 0; // §6.4
      i.alarm.set(8, 3000);
      if (i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
      i.action = 1;
      i.warwork = 4;
      if (w.positionMeeting(i.flaggox, i.flaggoy, "enemy_unit")) i.warwork = 1;
      if (!w.positionMeeting(i.dirox, i.diroy, "torre") && !w.positionMeeting(i.dirox, i.diroy, "castello")) i.presidiowork = 0;
      scrMove(p, i, i.flaggox, i.flaggoy);
    },
    stepBegin(i, w) { if (w.number("torre_placer") > 0) w.g.sele = 1; },
    step(i, w) {
      const g = w.g;
      leftClick(i, w);
      const diro = i.direction;
      if (i.life <= 0) {
        p.free(i);
        w.destroy(i);
        g.pop -= 2;
        const corpse = w.create("arciere_corpse", i.x, i.y);
        corpse.direction = diro;
        if (i.selected === 1) { g.sel -= 1; g.arcsel -= 1; g.milsel -= 1; }
        return;
      }
      i.autospeed = 4 * iso(i.direction);
      i.depth = -i.y;
      i.phase = phaseOf(i.direction);
      if (i.action === 1 && pointDistance(i.x, i.y, i.dirox, i.diroy) < 10 && i.atkorder === 0) {
        i.action = 0; i.warwork = 0; i.creation = 0; i.speed = 0;
      }
      ANIM[ARC](i, w);
      boxSelect(i, w, "arcsel");
      // "se posto in cui fermarsi e' occupato", ripetuto due volte [C].
      // [Correzione decisa dall'autore, §3.11 n.43] non durante un ordine di
      // presidio: la destinazione e' l'edificio, mai libero, e scivolava
      // verso l'arciere fino a fermarlo prima di entrare.
      if (i.presidiowork !== 1) {
        destination(i, w);
        destination(i, w);
      }
      if (w.number("torre_placer") > 0) g.sele = 1;
      if (i.selected === 1 && w.number("attacco_clicker") === 0) {
        w.create("attacco_clicker", 0, 0);
        w.create("difesa_clicker", 0, 0);
      }
      move(i, w);
      if (attack(i, w) === "exit") return;
      garrison(i, w, g);
    },
    // Destroy [C]: lo stesso "clic fuori" del guerriero
    destroy(i, w) {
      const g = w.g;
      const hov = (n) => { let h = 0; for (const c of w.all(n)) h = c.hover === 1 ? 1 : 0; return h; };
      if (hov("attacco_clicker") !== 1 && hov("difesa_clicker") !== 1 && i.selected === 1 && g.sele === 0) {
        // [Correzione §3.9 n.30] anche arcsel
        g.sel -= 1; g.milsel -= 1; g.arcsel--; i.selected = 0;
        for (const n of ["attacco_clicker", "difesa_clicker"]) for (const c of w.all(n)) w.destroy(c);
      }
      p.free(i);
    },
    globalLeftPressed(i, w) {
      const g = w.g;
      if (g.sele === 0 && i.selected === 1) { g.sel -= 1; g.milsel -= 1; g.arcsel -= 1; i.selected = 0; }
    },
    globalRightReleased(i, w) {
      if (i.selected !== 1) return;
      for (const u of w.all("ally_unit")) if (u.selected === 1) p.free(u);
      i.alarm.set(8, 1200);
      i.dirox = w.mouse.x; i.diroy = w.mouse.y;
      i.anchorX = null; i.anchorY = null; i.repos = 0; // §6.4: nuovo ordine, niente guinzaglio
      i.creation = 0;
      if (i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
      i.action = 1;
      i.warwork = 4;
      const e = w.instancePosition(w.mouse.x, w.mouse.y, "enemy_unit");
      if (e) { i.warwork = 1; i.atkorder = 1; i.atktarget = e; }
      else { i.atkorder = 0; i.atktarget = null; }
      if (!w.positionMeeting(i.dirox, i.diroy, "torre") && !w.positionMeeting(i.dirox, i.diroy, "castello")) i.presidiowork = 0;
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    keyboard27: escapeDeselect,
    drawEnd(i, w, d) { unitDrawEnd(i, w, d, false); },
    drawGUI(i, w, d) { unitPanel(i, w, d, "ico_arciere"); },
  };
}

// ------------------------------------------------- presidio ed edifici

// torre e castello [C]: tirano frecce (arciere_bullet_t) ogni 50 passi se un
// nemico e' entro 600 px, una per arciere di presidio (posizioni fisse a
// destra o a sinistra secondo il nemico); click destro con arcieri
// selezionati: vanno a presidiarli; bandierine per ogni arciere entrato.
const GARRISON = {
  torre: {
    max: 2,
    right: [[20, -60], [20, -77]], left: [[-20, -60], [-20, -77]],
    flags: [[1, "flag_r", 0, -170]],
    textY: -200, barY: -205,
  },
  castello: {
    max: 4,
    right: [[80, -170], [80, -180], [30, -30], [30, -40]], left: [[-200, -60], [-200, -77], [-30, -250], [-30, -260]],
    flags: [[1, "flag_r", 0, -110], [2, "flag_r2", 0, -270], [3, "flag_r", -150, -190], [4, "flag_r", 140, -210]],
    textY: -200, barY: null,
  },
};

export function garrisoned(name, base) {
  const G = GARRISON[name];
  return {
    ...base,
    create(i, w) {
      base.create(i, w);
      i.arm = 1;
      i.npresidio = 0;
      i.flagged = 0;
      for (let k = 1; k <= 4; k++) i["flagged" + k] = 0;
    },
    alarm0(i) { i.arm = 1; },
    // Mouse_LeftReleased [C]: selezione (il castello non nel menu) e, la
    // prima volta, il suggerimento sul presidio
    leftReleased(i, w) {
      if (name === "castello" && w.room === "menu") return;
      base.leftReleased(i, w);
      hintOnce(w, "hint_presidio", "presidiohint", i.x, i.y);
    },
    step(i, w) {
      const e = w.nearest(i.x, i.y, "enemy_unit");
      if (i.arm === 1 && e && w.distanceToInstance(i, e) < 600) {
        i.arm = 0;
        i.alarm.set(0, 50);
        const pos = e.x > i.x ? G.right : G.left;
        pos.forEach(([dx, dy], k) => { if (i.npresidio > k) w.create("arciere_bullet_t", i.x + dx, i.y + dy); });
      }
      base.step(i, w);
      if (!i.alive) return;
      // bandiere del presidio (la torre ne ha una sola)
      for (const [n, obj, dx, dy] of G.flags) {
        const key = name === "torre" ? "flagged" : "flagged" + n;
        if (i.npresidio === n && i[key] === 0) { w.create(obj, i.x + dx, i.y + dy); i[key] = 1; }
      }
    },
    // Destroy [C]: le bandiere spariscono. [Correzione decisa dall'autore,
    // §3.11 n.42] nella torre l'if senza graffe reggeva solo `var
    // thisflag=...`: senza bandiera with(thisflag) diventava with(0), il
    // primo oggetto del progetto (hint_legna). Qui senza bandiera non si fa
    // nulla. Nel castello startflagger non e' mai assegnata.
    destroy(i, w) {
      if (base.destroy) base.destroy(i, w);
      if (name === "torre") {
        if (i.flagged === 1) { const f = w.nearest(i.x, i.y - 170, "flag_r"); if (f) w.destroy(f); }
        return;
      }
      for (const [n, obj, dx, dy] of G.flags) {
        if (i["flagged" + n] === 1) { const f = w.nearest(i.x + dx, i.y + dy, obj); if (f) w.destroy(f); }
      }
    },
    rightReleased(i, w) {
      base.rightReleased(i, w);
      if (i.npresidio < G.max) {
        for (const a of w.all("ally_arciere")) {
          if (a.selected !== 1) continue;
          a.presidiowork = 1; a.dirox = i.x; a.diroy = i.y; a.action = 1; a.alarm.set(0, 13);
        }
      }
    },
    drawEnd(i, w, d) {
      if (name === "torre") {
        // torre Draw_End [C]: barra in alto (y-205) e "n/2"
        if (i.selected === 1) { d.setHalign("center"); d.text(i.x, i.y + G.textY, i.npresidio + "/" + G.max); d.setHalign("left"); }
        if (i.hover === 1 || i.hit === 1 || i.selected === 1) {
          d.rectangleColour(i.x - 25, i.y - 205, i.x + 25, i.y - 212, BLACK, BLACK, BLACK, BLACK, false);
          d.rectangleColour(i.x - 25, i.y - 205, i.x - 25 + (i.life / i.slife) * 50, i.y - 212, GREEN, GREEN, GREEN, GREEN, false);
        }
        return;
      }
      if (base.drawEnd) base.drawEnd(i, w, d);
      if (i.selected === 1) { d.setHalign("center"); d.text(i.x, i.y + G.textY, i.npresidio + "/" + G.max); d.setHalign("left"); }
    },
  };
}

// centro Step azione 1 e Alarm_1 [C]: una freccia ogni 35 passi su un
// nemico entro 600 px
export function centroArrows(base) {
  return {
    ...base,
    create(i, w) { base.create(i, w); i.arm = 1; },
    alarm1(i) { i.arm = 1; },
    step(i, w) {
      const e = w.nearest(i.x, i.y, "enemy_unit");
      if (i.arm === 1 && e && w.distanceToInstance(i, e) < 600) {
        i.arm = 0;
        i.alarm.set(1, 35);
        w.create("arciere_bullet_t", e.x > i.x ? i.x + 50 : i.x, i.y - 140);
      }
      base.step(i, w);
    },
  };
}

// enemy_torre [C]: due frecce ogni 50 passi su un alleato entro 600 px;
// visibile come le unita' nemiche ma, una volta vista, resta visibile.
// Distrutta, scala i contatori delle basi del tutorial di match.
export function enemyTower(p) {
  return {
    create(i, w) {
      Object.assign(i, { life: 330, slife: 330, arm: 0, hit: 0, onfire: 0, selected: 0, hover: 0 });
      i.depth = -i.y;
      i.alarm.set(0, 30);
      i.alarm.set(1, 70);
      i.visible = false;
      w.create("flag_b", i.x, i.y - 170);
    },
    alarm0(i) { i.arm = 1; },
    alarm1(i) { i.alarm.set(1, 70); if (i.onfire === 1) i.life -= 1; },
    alarm2(i) { i.hit = 0; },
    destroy(i, w) {
      p.markInstance(i, 1);
      const f = w.nearest(i.x, i.y - 170, "flag_b");
      if (f) w.destroy(f);
    },
    step(i, w) {
      const g = w.g, n = 1 - g.night;
      const near = (obj, r) => w.nearWithin(i, obj, r + r * n, 2.01 * r); // §6.3 N3: stesso risultato di distance_to_object(instance_nearest) < r + r*n
      if (near("ally_unit", 150) || near("ally_build", 200) || i.hit === 1 || near("castello", 500) || near("torre", 500)
          || w.room === "menu" || g.fogville === 0) i.visible = true;
      if (i.life <= 0) {
        baseCounters(i, g, ["x650", "y5800", "y1500"]);
        w.create("torreruin", i.x, i.y);
        w.destroy(i);
        return;
      }
      const a = w.nearest(i.x, i.y, "ally_unit");
      if (i.arm === 1 && a && w.distanceToInstance(i, a) < 600) {
        i.arm = 0;
        i.alarm.set(0, 50);
        const dx = a.x > i.x ? 20 : -20;
        w.create("b_arciere_bullet_t", i.x + dx, i.y - 60);
        w.create("b_arciere_bullet_t", i.x + dx, i.y - 77);
      }
    },
    globalLeftPressed(i) { i.selected = 0; },
    leftReleased(i, w) { if (i.visible === true && w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1; },
    drawEnd(i, w, d) {
      const blue = 0xff0000;
      if (i.selected === 1 || i.hover === 1 || (i.hit === 1 && w.room === "match")) {
        d.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, BLACK, BLACK, BLACK, BLACK, false);
        d.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + (i.life / i.slife) * 50, i.y - 82, blue, blue, blue, blue, false);
      }
    },
    drawGUI(i, w, d) {
      if (i.selected !== 1) return;
      const white = 0xffffff;
      d.setAlpha(0.69);
      d.roundrectColourExt(260, 20, 390, 150, 60, 60, white, white, false);
      d.setFont("GUI_1");
      d.setColour(BLACK);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("center");
      d.text(325, 120, i.life + " / " + i.slife);
      d.setAlpha(1);
      d.sprite("ico_torre", 0, 325, 70);
    },
  };
}

// flag_r, flag_r2, flag_b [C]: bandierine animate (0,1 fotogrammi per passo)
export function flag(sprite, depthOffset) {
  return {
    create(i) { i.depth = -i.y + depthOffset; i.sprite_index = sprite; i.image_index = 0; i.image_speed = 0.1; },
  };
}

