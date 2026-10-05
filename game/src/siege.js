// Assedio e fuoco: ariete e catapulta alleati e nemici, i proiettili della
// catapulta (catapulta_bullet, b_catapulta_bullet), gli effetti dei colpi
// (sfx_mattone, sfx_erba, sfx_sangue), le frecce incendiarie (fire_bullet)
// e il fumo degli edifici in fiamme (nubeqq). Trascrizione di
// src/objects/<oggetto>/; nomi originali.
//
// Le macchine d'assedio non hanno flow field: si muovono solo con
// mp_potential_step (azione drag & drop action_potential_step) verso
// dirox/diroy, e non hanno `ordo` [C].

import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { mpPotentialStep } from "./pathing.js";
import { phaseOf, walkCycle, boxSelect, escapeDeselect, unitDrawEnd, unitPanel, controlGroups } from "./units.js";

const iso = (dir) => 1 - 0.36 * Math.abs(Math.sin(degtorad(dir)));
const WHITE = 0xffffff;

// distance_to_point [I]: dal bbox al punto
function distanceToPoint(w, i, px, py) {
  const b = w.bbox(i);
  if (!b) return pointDistance(i.x, i.y, px, py);
  return Math.hypot(Math.max(0, b[0] - px, px - b[2]), Math.max(0, b[1] - py, py - b[3]));
}

// --------------------------------------------- parti comuni agli alleati

function siegeCommon(name, corpseName, icon) {
  return {
    ...controlGroups(false),
    alarm0: walkCycle,
    alarm1(i) { i.dc = 0; },
    // Alarm_3 [C]: nata in un posto occupato, ne nasce un'altra 50 px piu' in
    // la' con la stessa destinazione e questa sparisce
    alarm3(i, w) {
      const dix = i.dirox, diy = i.diroy;
      if (!w.placeFree(i, i.x, i.y)) {
        const n = w.create(name, i.x + 50, i.y - 20);
        n.action = 1; n.alarm.set(0, 13); n.dirox = dix; n.diroy = diy;
        w.g.pop -= 3;
        w.destroy(i);
      }
    },
    alarm5(i) { i.hit = 0; },
    // Destroy [C]: il "clic fuori" dei soldati (senza scr_free)
    destroy(i, w) {
      const g = w.g;
      const hov = (n) => { let h = 0; for (const c of w.all(n)) h = c.hover === 1 ? 1 : 0; return h; };
      if (hov("attacco_clicker") !== 1 && hov("difesa_clicker") !== 1 && i.selected === 1 && g.sele === 0) {
        // [Correzione §3.9 n.30] anche siegsel
        g.sel -= 1; g.milsel -= 1; g.siegsel--; i.selected = 0;
        for (const n of ["attacco_clicker", "difesa_clicker"]) for (const c of w.all(n)) w.destroy(c);
      }
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    keyboard27: escapeDeselect,
    drawEnd: unitDrawEnd,
    drawGUI(i, w, d) { unitPanel(i, w, d, icon); },
    // Step, azioni comuni: clic sinistro e morte; restituisce false se e' morta
    leftClickAndDeath(i, w) {
      const g = w.g;
      if (i.hover === 1 && w.input.mouseReleased[0]) {
        if (i.dc === 1) {
          const c = w.cam;
          for (const o of w.all(name)) {
            if (o.x > c.x && o.x < c.x + c.w && o.y > c.y && o.y < c.y + c.h) { o.selected = 1; g.sel += 1; g.siegsel++; g.milsel += 1; }
          }
        }
        if (g.sele > -1 && i.selected === 0) {
          i.selected = 1; g.milsel += 1; g.siegsel++;
          if (i.dc === 0) g.sel += 1;
          if (i.dc === 0) { i.dc = 1; i.alarm.set(1, 30); }
        }
        if (g.sele === -1) {
          if (i.selected === 1) { g.sel -= 1; g.siegsel--; g.milsel -= 1; }
          i.selected = 0;
        }
      }
      const diro = i.direction;
      if (i.life <= 0) {
        w.destroy(i);
        g.pop -= 3;
        const corpse = w.create(corpseName, i.x, i.y);
        corpse.direction = diro;
        if (i.selected === 1) { g.sel -= 1; g.siegsel--; g.milsel -= 1; }
        return false;
      }
      return true;
    },
    // movimento e direzione, arrivo esatto
    moveCommon(i, w, onArrive) {
      i.autospeed = 2 * iso(i.direction);
      i.depth = -i.y;
      i.phase = phaseOf(i.direction);
      if (i.action === 1 && i.x === i.dirox && i.y === i.diroy) onArrive(i);
      if (i.action === 1) mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
    },
    // "se posto in cui fermarsi e' occupato": 50 px verso di se'
    destinationBack50(i, w) {
      if (i.action === 1 && i.firework !== 1 && !w.placeFree(i, i.dirox, i.diroy)) {
        const d = pointDirection(i.dirox, i.diroy, i.x, i.y);
        i.dirox += lengthdirX(50, d); i.diroy += lengthdirY(50, d);
      }
    },
    buttons(i, w) {
      if (i.selected === 1 && w.number("attacco_clicker") === 0) {
        w.create("attacco_clicker", 0, 0);
        w.create("difesa_clicker", 0, 0);
      }
    },
  };
}

// ----------------------------------------------------------- ariete alleato

// ally_ariete [C]: vita 125, popolazione 3, 2 px per passo. Attacca
// l'edificio nemico piu' vicino entro `comp` (700); a contatto colpisce ogni
// 69 passi (30 + 13 + 13 + 13) col versore a 50 px: -50, -5 se l'edificio ha
// vita massima 100.
export function allyRam() {
  const C = siegeCommon("ally_ariete", "ariete_corpse", "ico_ariete");
  return {
    ...C,
    create(i, w) {
      Object.assign(i, { action: 0, idling: 1, step: 0, phase: 1, hit: 0, hov: 0, hover: 0, dc: 0, autospeed: 0,
                         warwork: 0, comp: 700, assi: 0, targetid: null, target_eu: null, selected: 0, firework: 0,
                         life: 125, slife: 125, xprev: i.x, yprev: i.y, dirox: 0, diroy: 0, foodx: 0, foody: 0,
                         targetx: 0, targety: 0 });
      w.g.pop += 3;
      i.alarm.set(3, 1);
    },
    alarm2(i, w) {
      if (i.action !== 2) return;
      if (i.step === 0) { i.step = 1; i.alarm.set(2, 30); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
      if (i.step === 2) { i.step = 3; i.alarm.set(2, 13); return; }
      if (i.step !== 3) return;
      i.step = 0;
      i.alarm.set(2, 13);
      const b = w.nearest(i.x + 50 * Math.cos(degtorad(i.direction)), i.y - 50 * Math.sin(degtorad(i.direction)), "enemy_build");
      if (b) { b.hit = 1; b.alarm.set(2, 50); b.life -= b.slife === 100 ? 5 : 50; }
    },
    step(i, w) {
      if (!C.leftClickAndDeath(i, w)) return;
      C.moveCommon(i, w, (u) => { u.action = 0; u.warwork = 0; u.speed = 0; });
      ANIM.ally_ariete(i, w);
      boxSelect(i, w, "siegsel");
      C.destinationBack50(i, w);
      // attacco
      if (i.target_eu && !i.target_eu.alive) i.target_eu = null;
      const k = iso(i.direction);
      if (!i.target_eu) {
        const b = w.nearest(i.x, i.y, "enemy_build");
        const dist = b ? w.distanceToInstance(i, b) : Infinity;
        if (dist < 10 * k) {
          if (i.warwork === 2) { i.targetx = b.x; i.targety = b.y; i.direction = pointDirection(i.x, i.y, i.targetx, i.targety); }
          if (i.warwork !== 2 && i.warwork !== 4) { i.action = 2; i.warwork = 2; i.alarm.set(2, 13); }
          return;
        }
        if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.speed = 0; }
        if (i.warwork === 1 && dist >= i.comp * k) { i.action = 0; i.warwork = 0; i.speed = 0; }
        if (b && dist < i.comp * k && (i.warwork === 0 || i.warwork === 1)) {
          if (i.action !== 1) i.alarm.set(0, 15);
          i.action = 1; i.warwork = 1; i.dirox = b.x; i.diroy = b.y;
        }
      } else {
        const t = i.target_eu;
        if (w.distanceToInstance(i, t) < 10 * k) {
          if (i.warwork === 2) { i.targetx = t.x; i.targety = t.y; i.target_eu = null; i.direction = pointDirection(i.x, i.y, i.targetx, i.targety); }
          if (i.warwork !== 2 && i.warwork !== 4) { i.action = 2; i.warwork = 2; i.alarm.set(2, 13); }
          return;
        }
        if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.speed = 0; i.target_eu = null; }
        if (i.target_eu && (i.warwork === 0 || i.warwork === 1)) {
          if (i.action !== 1) i.alarm.set(0, 15);
          i.action = 1; i.warwork = 1; i.dirox = i.target_eu.x; i.diroy = i.target_eu.y;
        }
      }
      C.buttons(i, w);
    },
    globalRightReleased(i, w) {
      if (i.selected !== 1) return;
      i.dirox = w.mouse.x; i.diroy = w.mouse.y;
      if (i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
      i.action = 1;
      i.warwork = 4;
      if (w.positionMeeting(w.mouse.x, w.mouse.y, "enemy_build")) i.warwork = 1;
    },
  };
}

// --------------------------------------------------------- catapulta

// Lancio [C, Alarm_2 delle catapulte]: il sasso parte da un punto diverso
// per ciascuna delle 8 direzioni, va a 5 px per passo e "vola" con una
// parabola che torna a terra sul bersaglio (catapulta_bullet Step).
const LAUNCH = { 1: [-44, -62], 2: [-38, -50], 3: [0, -44], 4: [39, -59], 5: [45, -72], 6: [35, -89], 7: [0, -85], 8: [-35, -89] };

function catapultAlarm2(i, w, bulletName) {
  if (i.action !== 2) return;
  if (i.step === 0) { i.step = 1; i.alarm.set(2, 10); return; }
  if (i.step === 1) {
    const [dx, dy] = LAUNCH[i.phase] || [0, 0];
    const b = w.create(bulletName, i.x + dx, i.y + dy);
    b.direction = pointDirection(b.x, b.y, i.targx, i.targy);
    b.objectivex = i.targx; b.objectivey = i.targy;
    // alarm[0] = distance_to_point / speed (speed 5 dal Create del sasso)
    const t = Math.trunc(distanceToPoint(w, b, b.objectivex, b.objectivey) / b.speed);
    b.alarm.set(0, t);
    b.startspeed = t * 0.1;
    b.speed = 5;
    i.step = 2; i.alarm.set(2, 10); i.loaded = 0;
    return;
  }
  if (i.step === 2) { i.step = 3; i.alarm.set(2, 45); return; }
  if (i.step === 3) { i.step = 0; i.action = 0; }
}

// Alarm_4 [C]: ricarica, cinque fasi da 13 passi
function catapultReload(i) {
  if (i.action !== 3) return;
  if (i.step < 4) { i.step += 1; i.alarm.set(4, 13); return; }
  i.step = 0; i.loaded = 1; i.action = 0;
}

// Tiro automatico [C]: ferma o in cammino, carica e in automatico, tira
// all'edificio nemico piu' vicino fra 300 e 850 px. Sotto i 300 px si mette
// in cammino. [Correzione decisa dall'autore, §3.12 n.47] l'originale non
// cambiava la destinazione: dirox, se mai assegnata, valeva 0 e la
// catapulta andava verso l'angolo (0, 0) della mappa. Qui arretra di 350
// px lungo la linea dall'edificio, oltre la distanza minima di tiro.
function catapultAuto(i, w, target, range) {
  if (!((i.action === 0 || i.action === 1) && i.automatic === 1 && i.loaded === 1)) return null;
  const b = w.nearest(i.x, i.y, target);
  if (!b) return null;
  const dist = w.distanceToInstance(i, b);
  if (!(dist < range)) return null;
  if (dist > 300) {
    if (i.action !== 2) {
      i.action = 2; i.step = 0;
      i.direction = pointDirection(i.x, i.y, b.x, b.y);
      i.targx = b.x; i.targy = b.y;
      i.alarm.set(2, 50);
      return "exit";
    }
  } else if (i.action === 0) {
    const away = pointDirection(b.x, b.y, i.x, i.y);
    i.dirox = i.x + lengthdirX(350, away);
    i.diroy = i.y + lengthdirY(350, away);
    i.direction = pointDirection(i.x, i.y, b.x, b.y); // (-360: stesso angolo)
    i.action = 1; i.automatic = 1; i.step = 0;
    if (i.speed === 0) i.alarm.set(0, 13);
  }
  return null;
}

// ally_catapulta [C]: vita 100, popolazione 3; tiro fra 300 e 850 px, una
// volta ogni ~133 passi (50 + 10 + 10 + 45 + ricarica 65). Click destro su un
// nemico (unita' o edificio) a 300–850 px: tiro mirato.
export function allyCatapult() {
  const C = siegeCommon("ally_catapulta", "catapulta_corpse", "ico_catapulta");
  return {
    ...C,
    create(i, w) {
      Object.assign(i, { action: 0, idling: 1, step: 0, loaded: 1, phase: 1, hit: 0, hov: 0, automatic: 1, hover: 0,
                         dc: 0, autospeed: 0, warwork: 0, comp: 500, assi: 0, firework: 0, targetid: null,
                         target_eu: null, selected: 0, life: 100, slife: 100, xprev: i.x, yprev: i.y,
                         dirox: 0, diroy: 0, foodx: 0, foody: 0, targx: 0, targy: 0 });
      w.g.pop += 3;
      i.alarm.set(3, 1);
    },
    alarm2(i, w) { catapultAlarm2(i, w, "catapulta_bullet"); },
    alarm4: catapultReload,
    step(i, w) {
      if (!C.leftClickAndDeath(i, w)) return;
      C.moveCommon(i, w, (u) => { u.action = 0; u.automatic = 1; u.warwork = 0; u.speed = 0; });
      ANIM.ally_catapulta(i, w);
      boxSelect(i, w, "siegsel");
      C.destinationBack50(i, w);
      C.buttons(i, w);
      if (i.action === 0 && i.loaded === 0) { i.action = 3; i.alarm.set(4, 13); i.step = 0; }
      catapultAuto(i, w, "enemy_build", 850);
    },
    globalRightReleased(i, w) {
      if (i.selected !== 1) return;
      const mx = w.mouse.x, my = w.mouse.y;
      if (w.positionMeeting(mx, my, "enemy") && i.loaded === 1) {
        const d = distanceToPoint(w, i, mx, my);
        if (d < 850 && d > 300 && i.action !== 2) {
          i.action = 2; i.automatic = 0; i.step = 0;
          i.direction = pointDirection(i.x, i.y, mx, my);
          i.targx = mx; i.targy = my;
          i.alarm.set(2, 50);
          return;
        }
      }
      if (!w.positionMeeting(mx, my, "enemy")) {
        if (i.action !== 2 && i.action !== 1) i.alarm.set(0, irandomRange(5, 13));
        i.automatic = 0;
        i.dirox = mx; i.diroy = my;
        i.action = 1; i.step = 0;
      }
    },
  };
}

// --------------------------------------------------------- proiettili

// catapulta_bullet / b_catapulta_bullet [C]: all'arrivo (Destroy) colpisce
// l'edificio o l'unita' sotto di se' (-40) e lascia mattoni, sangue o zolle
// d'erba. Il sasso nemico non segna il colpo sugli edifici (hit) ne' sulle
// unita'.
export function catapultBullet(enemySide) {
  const build = enemySide ? "ally_build" : "enemy_build", unit = enemySide ? "ally_unit" : "enemy_unit";
  const scatter = (w, i, obj) => {
    for (let k = 0; k < 3; k++) {
      const s = w.create(obj, i.x, i.y);
      s.speed = 2;
      s.direction = irandomRange(0, 300);
    }
  };
  return {
    create(i) { Object.assign(i, { active: 0, time: 0, deviance: 0, godown: 0, rota: 0, startspeed: 0 }); i.speed = 5; },
    step(i) {
      i.time += 1;
      i.deviance = i.time * i.startspeed - 0.1 * i.time * i.time;
      i.depth = -i.y;
      i.rota += 15;
    },
    alarm0(i, w) { w.destroy(i); },
    alarm1(i) { i.godown = 1; },
    destroy(i, w) {
      const onBuild = w.positionMeeting(i.x, i.y, build), onUnit = w.positionMeeting(i.x, i.y, unit);
      if (onBuild) {
        scatter(w, i, "sfx_mattone");
        const b = w.nearest(i.x, i.y, build);
        if (!enemySide) { b.hit = 1; b.alarm.set(2, 50); }
        b.life -= 40;
      }
      if (onUnit) {
        if (!enemySide) w.create("sfx_sangue", i.x, i.y);
        const u = w.nearest(i.x, i.y, unit);
        u.life -= 40;
        if (!enemySide) u.hit = 1;
      }
      if (!onBuild && !onUnit) scatter(w, i, "sfx_erba");
    },
    draw(i, w, d) {
      d.spriteExt("sasso", 0, i.x, i.y - i.deviance, 1, 1, i.rota, WHITE, 1);
      d.sprite("sasso_ombra", 0, i.x, i.y);
    },
  };
}

// sfx_mattone, sfx_erba [C]: frammenti che girano e spariscono in 30 passi
export function debris() {
  return {
    create(i) { i.alarm.set(0, 30); i.depth = -i.y - 100; },
    alarm0(i, w) { w.destroy(i); },
    step(i) { i.image_angle += 20; },
  };
}

// sfx_sangue [C]: macchia che sbiadisce in 30 passi
export function bloodSplat() {
  return {
    create(i) { i.alarm.set(0, 30); i.depth = -i.y - 100; i.alpha = 1; },
    alarm0(i, w) { w.destroy(i); },
    step(i) { i.alpha -= 1 / 30; },
    draw(i, w, d) { d.spriteExt("sfxsangue", 0, i.x, i.y, 1, 1, 0, WHITE, i.alpha); },
  };
}

// --------------------------------------------------------------- fuoco

// fire_bullet [C]: la freccia incendiaria (gira su se stessa, 50 passi di
// vita). Toccando un edificio di legno lo incendia (onfire=1) e lo
// danneggia: -5, il centro -3, il campo -20. (La fiammata di 300
// particelle arriva col sistema di particelle.)
const FIRE_HIT = { casa: 5, barn: 5, caserma: 5, magazzino: 5, stalla: 5, centro: 3, campo: 20,
                   enemy_house: 5, enemy_caserma: 5, enemy_stalla: 5 };
export function fireBullet() {
  const collisions = {};
  for (const [name, dmg] of Object.entries(FIRE_HIT)) {
    collisions[name] = (i, w, other) => { other.onfire = 1; other.life -= dmg; w.destroy(i); };
  }
  // (o_box1, o_box2: le casse del livello 1, col punto 4e)
  return {
    create(i) { i.alarm.set(0, 50); },
    alarm0(i, w) { w.destroy(i); },
    step(i) { i.image_angle += 7; },
    collisions,
  };
}

// Alarm_4 di guerriero e picchiere alleati, "dare fuoco alle case" [C]:
// tre fasi da 13 passi, poi una freccia incendiaria ogni 38 verso il
// bersaglio (5 px per passo; i nemici la tirano a 8).
export function infantryFire(i, w) {
  if (i.action !== 6) return;
  if (i.step === 0) { i.step = 1; i.alarm.set(4, 13); return; }
  if (i.step === 1) { i.step = 2; i.alarm.set(4, 13); return; }
  if (i.step !== 2) return;
  if (i.targetid && i.targetid.alive) {
    i.step = 0;
    i.alarm.set(4, 38);
    const b = w.create("fire_bullet", i.x, i.y - 67);
    b.direction = pointDirection(b.x, b.y, i.targetid.x, i.targetid.y);
    b.speed = 5;
  } else i.action = 0;
}

// Click destro su un edificio nemico di legno con fanti selezionati [C,
// enemy_house / enemy_stalla / enemy_caserma Mouse_RightReleased]: vanno a
// dargli fuoco.
export function fireOrder(i, w) {
  for (const u of w.all("ally_infantry")) {
    if (u.selected !== 1 || u.warwork === 2) continue;
    u.firework = 1; u.warwork = 0; u.action = 1; u.alarm.set(0, 15);
    u.targetid = i; u.dirox = i.x; u.diroy = i.y;
  }
}

// nubeqq [C]: una nuvoletta di fumo che sale (3 px per passo) e sbiadisce.
// bbb (specchiata o no) vale 1 solo se random(2) da' esattamente 1: in
// pratica mai, la nuvola e' sempre specchiata.
export function smoke() {
  return {
    create(i) {
      i.aaa = 1;
      i.bbb = Math.random() * 2 === 1 ? 1 : -1;
      i.alarm.set(0, 50);
      i.direction = 90;
      i.speed = 3;
    },
    alarm0(i, w) { w.destroy(i); },
    step(i) { i.aaa -= 0.02; },
    draw(i, w, d) { d.spriteExt("nubespr", 0, i.x, i.y, i.bbb, 1, 0, WHITE, i.aaa); },
  };
}

// ------------------------------------------------------- assedio nemico

// Draw_GUI dei nemici [C]: scheda con la vita se selezionato da solo
function enemyPanel(icon) {
  return (i, w, d) => {
    if (i.selected !== 1 || w.g.sel >= 2) return;
    d.setAlpha(0.69);
    d.roundrectColourExt(260, 20, 390, 150, 60, 60, WHITE, WHITE, false);
    d.setFont("GUI_1");
    d.setColour(0);
    d.setAlpha(0.75);
    d.setValign("middle");
    d.setHalign("center");
    d.text(325, 120, i.life + " / " + i.slife);
    d.setAlpha(1);
    d.sprite(icon, 0, 325, 70);
  };
}

// enemy_ariete [C]: va verso l'edificio alleato piu' vicino entro 700 px
// (dimezzati di notte) e lo colpisce come l'ariete alleato. Arma l'alarm 9
// dell'edificio (che non rimette hit a 0): la barra della vita di un
// edificio colpito resta visibile (§3.12 n.48).
export function enemyRam(base) {
  return {
    ...base,
    create(i, w) {
      Object.assign(i, { action: 0, idling: 1, step: 0, phase: 1, hov: 0, hover: 0, warwork: 0, dc: 0, comp: 700,
                         autospeed: 0, hit: 0, selected: 0, role: 0, targetx: 0, targety: 0, dirox: 0, diroy: 0,
                         foodx: 0, foody: 0, life: 125, slife: 125 });
      void w;
    },
    alarm2(i, w) {
      if (i.action !== 2) return;
      if (i.step === 0) { i.step = 1; i.alarm.set(2, 30); return; }
      if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
      if (i.step === 2) { i.step = 3; i.alarm.set(2, 13); return; }
      if (i.step !== 3) return;
      i.step = 0;
      i.alarm.set(2, 13);
      const b = w.nearest(i.x + 50 * Math.cos(degtorad(i.direction)), i.y - 50 * Math.sin(degtorad(i.direction)), "ally_build");
      if (b) { b.hit = 1; b.alarm.set(9, 50); b.life -= b.slife === 100 ? 5 : 50; }
    },
    alarm3(i, w) {
      const dix = i.dirox, diy = i.diroy;
      if (!w.placeFree(i, i.x, i.y)) {
        const n = w.create("enemy_ariete", i.x + 50, i.y - 20);
        n.action = 1; n.alarm.set(0, 13); n.dirox = dix; n.diroy = diy;
        w.destroy(i);
      }
    },
    alarm4: undefined,
    step(i, w) {
      const g = w.g, n = 1 - g.night;
      const near = (obj, r) => { const o = w.nearest(i.x, i.y, obj); return !!o && w.distanceToInstance(i, o) < r + r * n; };
      i.visible = near("ally_unit", 150) || near("ally_build", 200) || i.hit === 1 || near("castello", 500)
        || near("torre", 500) || g.fogville === 0;
      const diro = i.direction;
      if (i.life <= 0) {
        const corpse = w.create("enemy_ariete_corpse", i.x, i.y);
        if (i.hover === 1) { i.hover = 0; g.enemyhover = 0; }
        w.destroy(i);
        corpse.direction = diro;
        return;
      }
      i.autospeed = 2 * iso(i.direction);
      i.depth = -i.y;
      if (i.action === 1 && i.x === i.dirox && i.y === i.diroy) { i.action = 0; i.speed = 0; }
      if (i.action === 1) mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
      if (i.action === 1 && !w.placeEmpty(i, i.dirox, i.diroy)) { i.dirox += irandomRange(-20, 20); i.diroy += irandomRange(-20, 20); }
      if (i.action === 1 && !w.placeFree(i, i.dirox, i.diroy)) { i.dirox += irandomRange(-30, 30); i.diroy += irandomRange(-30, 30); }
      if (w.number("torre_placer") > 0) g.sele = 1;
      i.phase = phaseOf(i.direction);
      ANIM.enemy_ariete(i, w);
      // attacco
      if (!w.exists("ally_build")) return;
      const k = iso(i.direction);
      const b = w.nearest(i.x, i.y, "ally_build");
      if (w.distanceToInstance(i, b) < 10 * k) {
        if (i.warwork === 2) { i.targetx = b.x; i.targety = b.y; i.direction = pointDirection(i.x, i.y, i.targetx, i.targety); }
        if (i.warwork !== 2) { i.action = 2; i.warwork = 2; i.alarm.set(2, 13); }
        return;
      } else if (i.warwork === 2) { i.action = 0; i.warwork = 0; i.speed = 0; }
      const chase = () => {
        const t = w.nearest(i.x, i.y, "ally_build");
        if (w.distanceToInstance(i, t) < i.comp * (1 - 0.5 * g.night) * k && (i.warwork === 0 || i.warwork === 1)) {
          if (i.action !== 1) i.alarm.set(0, 15);
          i.action = 1; i.warwork = 1; i.dirox = t.x; i.diroy = t.y;
        }
      };
      if (w.exists("fog01")) {
        const f = w.nearest(i.x, i.y, "fog01");
        if (w.distanceToInstance(i, f) > 290) chase();
      } else chase();
    },
    collisions: {}, // nessuna reazione alle frecce
    drawGUI: enemyPanel("ico_ariete"),
  };
}

// enemy_catapulta [C]: tira all'edificio alleato piu' vicino fra 300 e 850
// px (meno di notte). Colpita da una freccia, va verso l'arciere alleato
// piu' vicino.
export function enemyCatapult(base) {
  return {
    ...base,
    create(i, w) {
      Object.assign(i, { action: 0, idling: 1, step: 0, phase: 1, hov: 0, hover: 0, loaded: 1, warwork: 0, automatic: 1,
                         dc: 0, autospeed: 0, assi: 0, firework: 0, targetid: null, target_eu: null, comp: 500,
                         hit: 0, selected: 0, role: 0, dirox: 0, diroy: 0, foodx: 0, foody: 0, targx: 0, targy: 0,
                         life: 100, slife: 100, xprev: i.x, yprev: i.y });
      i.alarm.set(3, 1);
      void w;
    },
    alarm2(i, w) { catapultAlarm2(i, w, "b_catapulta_bullet"); },
    alarm3(i, w) {
      const dix = i.dirox, diy = i.diroy;
      if (!w.placeFree(i, i.x, i.y)) {
        const n = w.create("enemy_catapulta", i.x + 50, i.y - 20);
        n.action = 1; n.alarm.set(0, 13); n.dirox = dix; n.diroy = diy;
        w.destroy(i);
      }
    },
    alarm4: catapultReload,
    step(i, w) {
      const g = w.g, n = 1 - g.night;
      const near = (obj, r) => { const o = w.nearest(i.x, i.y, obj); return !!o && w.distanceToInstance(i, o) < r + r * n; };
      i.visible = near("ally_unit", 150) || near("ally_build", 200) || i.hit === 1 || near("castello", 500)
        || near("torre", 500) || w.room === "menu" || g.fogville === 0;
      const diro = i.direction;
      if (i.life <= 0) {
        const corpse = w.create("enemy_catapulta_corpse", i.x, i.y);
        if (i.hover === 1) { i.hover = 0; g.enemyhover = 0; }
        w.destroy(i);
        corpse.direction = diro;
        return;
      }
      i.autospeed = 2 * iso(i.direction);
      i.depth = -i.y;
      i.phase = phaseOf(i.direction);
      if (i.action === 1 && i.x === i.dirox && i.y === i.diroy) { i.action = 0; i.speed = 0; }
      if (i.action === 1) mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
      if (i.action === 1 && !w.placeEmpty(i, i.dirox, i.diroy)) { i.dirox += irandomRange(-20, 20); i.diroy += irandomRange(-20, 20); }
      if (i.action === 1 && !w.placeFree(i, i.dirox, i.diroy)) { i.dirox += irandomRange(-30, 30); i.diroy += irandomRange(-30, 30); }
      if (w.number("torre_placer") > 0) g.sele = 1;
      if (i.action === 0 && i.loaded === 0) { i.action = 3; i.alarm.set(4, 13); i.step = 0; }
      const range = (1 - 0.5 * g.night) * 850;
      if (w.exists("fog01")) {
        const f = w.nearest(i.x, i.y, "fog01");
        if (w.distanceToInstance(i, f) > 290 && catapultAuto(i, w, "ally_build", range) === "exit") return;
      } else if (catapultAuto(i, w, "ally_build", range) === "exit") return;
      ANIM.enemy_catapulta(i, w);
    },
    collisions: {
      arciere_bullet(i, w) {
        if (i.action !== 0 && i.action !== 1) return;
        const a = w.nearest(i.x, i.y, "ally_arciere");
        i.action = 1;
        if (a) { i.dirox = a.x; i.diroy = a.y; }
        // alarm[0]=0 non e' mai vero (un alarm scattato vale -1): niente passo
        if (i.alarm.get(0) === 0) i.alarm.set(0, 13);
        i.warwork = 1;
      },
    },
    drawGUI: enemyPanel("ico_catapulta"),
  };
}
