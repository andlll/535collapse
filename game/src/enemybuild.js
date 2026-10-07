// Edifici nemici (enemy_house, enemy_caserma, enemy_stalla), le casse del
// livello 1 (o_box1, o_box2), la cura della chiesa (sfx_croce) e gli
// oggetti che assegnano un ruolo agli edifici nemici (aggr_assign,
// def_assign). Trascrizione di src/objects/<oggetto>/; nomi originali.

import { hintOnce, dialogOpen } from "./hints.js";
import { irandomRange, pointDistance, pointDirection, degtorad } from "./gm.js";
import { fireOrder } from "./siege.js";
import { fireStep, fireStop } from "./effects.js";
import { creazioneAttaccantiGenerico } from "./levels.js";

const BLACK = 0, BLUE = 0xff0000, WHITE = 0xffffff;

// distance_to_object verso un'istanza che potrebbe non esserci: lontanissima

// Visibilita' degli edifici nemici [C]: come le unita', ma una volta visti
// restano visibili (nessun "else visible=false").
function revealBuilding(i, w) {
  const g = w.g, n = 1 - g.night;
  const near = (obj, r) => w.nearWithin(i, obj, r + r * n, 2.01 * r); // §6.3 N3: stesso risultato di distance_to_object(instance_nearest) < r + r*n
  if (near("ally_unit", 150) || near("ally_build", 200) || i.hit === 1 || near("castello", 500)
      || near("torre", 500) || w.room === "menu" || g.fogville === 0) i.visible = true;
}

function enemyBarAndPanel(icon) {
  return {
    drawEnd(i, w, d) {
      const bar = () => {
        d.lifeBar(i.x - 25, i.y - 82, i.life / i.slife, BLUE);
      };
      if (i.selected === 1 || i.hover === 1) bar();
      if (i.hit === 1 && w.room === "match") bar();
    },
    drawGUI(i, w, d) {
      if (i.selected !== 1) return;
      d.setAlpha(0.69);
      d.roundrectColourExt(260, 20, 390, 150, 60, 60, WHITE, WHITE, false);
      d.setFont("GUI_1");
      d.setColour(BLACK);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("center");
      d.text(325, 120, i.life + " / " + i.slife);
      d.setAlpha(1);
      d.sprite(icon, 0, 325, 70);
    },
    globalLeftPressed(i) { i.selected = 0; },
    leftReleased(i, w) { if (i.visible === true && w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1; },
    // click destro con fanti selezionati: dar fuoco [C]
    rightReleased: fireOrder,
  };
}

// Dati [C, Create e Step]: vita, rovina, contatori delle basi del tutorial
// di match (global.base1b/2b/3b, per posizione), periodo del fumo.
const KIND = {
  enemy_house: { life: 120, ruin: "casaruin", icon: "ico_casa", smoke: 40, bases: ["y5800", "y1500"] },
  enemy_caserma: { life: 350, ruin: "casruin", icon: "ico_caserma", smoke: 30, bases: ["x650", "y1500"], produces: true },
  enemy_stalla: { life: 380, ruin: "stalruin", icon: "ico_stalla", smoke: 30, bases: ["y5800", "y1500"], smokeIfVisible: true },
};

// Le basi del tutorial di match [C, Step degli edifici nemici]: x<650 base
// 2, y>5800 base 1, 1500<y<2800 base 3.
export function baseCounters(i, g, which) {
  for (const b of which) {
    if (b === "x650" && i.x < 650) g.base2b--;
    if (b === "y5800" && i.y > 5800) g.base1b--;
    if (b === "y1500" && i.y > 1500 && i.y < 2800) g.base3b--;
  }
}

export function enemyBuilding(kind, p) {
  const K = KIND[kind];
  return {
    ...enemyBarAndPanel(K.icon),
    create(i, w) {
      Object.assign(i, { life: K.life, slife: K.life, hit: 0, onfire: 0, firestarted: 0, selected: 0, hover: 0 });
      i.depth = -i.y;
      i.alarm.set(0, K.smoke);
      i.alarm.set(1, 70);
      i.visible = false;
      if (K.produces) Object.assign(i, { flagx: i.x, flagy: i.y, role: 0, prod: 1 });
      // enemy_house [C]: uno dei 6 stili a caso (3 = lo sprite dell'oggetto)
      if (kind === "enemy_house") {
        const ind = irandomRange(1, 6);
        i.sprite_index = ind === 3 ? "c3b" : "c" + ind + "b";
        w.moved(i);
      }
    },
    alarm0(i, w) {
      i.alarm.set(0, K.smoke);
      if (i.onfire === 1 && (!K.smokeIfVisible || i.visible === true)) {
        const f = w.create("nubeqq", i.x, i.y);
        f.depth = i.depth - 2;
      }
    },
    alarm1(i) { i.alarm.set(1, 70); if (i.onfire === 1) i.life -= 1; },
    alarm2(i) { i.hit = 0; },
    // enemy_caserma Alarm_3 [C]: nuovi attaccanti. [Correzione §3.13 n.52]
    // per la caserma difensiva (ruolo 10) l'alarm 3 e' solo l'attesa fra
    // un difensore e l'altro: alla scadenza non crea nulla, e il prossimo
    // difensore lo crea scr_controller_crea_difensori (levels.js).
    ...(K.produces ? {
      alarm3(i, w) { if (i.role !== 10) creazioneAttaccantiGenerico(i, w); },
    } : {}),
    destroy(i, w) { p.markInstance(i, 1); fireStop(i, w); },
    step(i, w) {
      revealBuilding(i, w);
      fireStep(i, w, kind);
      // "hint mandare a fuoco" [C]: il puntatore entro 80 px, con soldati
      // selezionati
      hintOnce(w, "hint_fire", "firehint", i.x, i.y,
               pointDistance(i.x, i.y, w.mouse.x, w.mouse.y) < 80 && w.g.milsel > 0);
      if (i.life <= 0) {
        baseCounters(i, w.g, K.bases);
        w.create(K.ruin, i.x, i.y);
        w.destroy(i);
      }
    },
  };
}

// o_box1, o_box2 [C]: casse del livello 1. Distrutte (fuoco, catapulte,
// arieti) danno a caso oro (75 x 5..8), legno o cibo (50 x 5..8; la o_box2
// x 3..8). Col fuoco si incendiano solo sopra meta' vita.
export function oBox(kind, p) {
  return {
    ...enemyBarAndPanel("ico_box"),
    create(i, w) {
      if (kind === "o_box1") w.g.dialogochest = 0;
      Object.assign(i, { life: 30, slife: 30, hit: 0, onfire: 0, firestarted: 0, selected: 0, hover: 0 });
      i.depth = -i.y;
      i.alarm.set(0, 30);
      i.alarm.set(1, 70);
    },
    alarm0(i, w) {
      i.alarm.set(0, 30);
      if (i.onfire === 1 && i.visible === true) { const f = w.create("nubeqq", i.x, i.y); f.depth = i.depth - 2; }
    },
    alarm1(i) { i.alarm.set(1, 70); if (i.onfire === 1) i.life -= 1; },
    alarm2(i) { i.hit = 0; },
    destroy(i, w) { p.markInstance(i, 1); fireStop(i, w); },
    step(i, w) {
      const g = w.g;
      revealBuilding(i, w);
      fireStep(i, w, kind);
      if (i.life <= 0) {
        const premio = irandomRange(1, 3), amount = irandomRange(kind === "o_box1" ? 5 : 3, 8);
        if (premio === 1) { g.gold += 75 * amount; w.create("oro_prizedrawer", i.x, i.y); }
        if (premio === 2) { g.wood += 50 * amount; w.create("legno_prizedrawer", i.x, i.y); }
        if (premio === 3) { g.food += 50 * amount; w.create("cibo_prizedrawer", i.x, i.y); }
        w.destroy(i);
        return;
      }
      // o_box2, "dialogo livello 1" [C]: la prima volta che un guerriero e'
      // entro 200 px, se non c'e' un altro dialogo aperto (§3.19 n.69)
      if (kind === "o_box2" && g.dialogochest === 0 && !dialogOpen(w)) {
        const war = w.nearest(i.x, i.y, "ally_warrior");
        if (war && w.distanceToInstance(i, war) < 200) { w.create("dialogo_1_3", i.x, i.y); g.dialogochest = 1; }
      }
    },
  };
}

// chiesa Alarm_0 [C]: ogni 180 passi +3 vita (con una croce) alle unita'
// alleate ferite entro 800 px (distanza ridotta in verticale).
export function church(base) {
  return {
    ...base,
    create(i, w) { base.create(i, w); i.alarm.set(0, 180); i.startflagger = 0; },
    alarm0(i, w) {
      i.alarm.set(0, 180);
      for (const u of w.all("ally_unit")) {
        const diri = pointDirection(u.x, u.y, i.x, i.y);
        if (pointDistance(u.x, u.y, i.x, i.y) * (1 - 0.36 * Math.abs(Math.sin(degtorad(diri)))) < 800 && u.life < u.slife) {
          w.create("sfx_croce", u.x, u.y);
          u.life += 3;
          if (u.life > u.slife) u.life = u.slife;
        }
      }
    },
  };
}

export function crossEffect() {
  return {
    create(i) { i.alarm.set(0, 30); i.depth = -i.y - 10000; i.alpha = 1; },
    alarm0(i, w) { w.destroy(i); },
    step(i) { i.alpha -= 1 / 30; },
    draw(i, w, d) { d.spriteExt("sfxcroce", 0, i.x, i.y - 100, 1, 1, 0, WHITE, i.alpha); },
  };
}

// aggr_assign / def_assign [C]: toccando una caserma o una stalla nemica le
// danno il ruolo 30 (attacco; la caserma comincia a produrre fra 540
// passi) o 10 (difesa), poi spariscono.
export function roleAssign(role) {
  const hit = (i, w, o) => {
    o.role = role;
    if (role === 30 && o.object === "enemy_caserma") o.alarm.set(3, 540);
    w.destroy(i);
  };
  return { collisions: { enemy_caserma: hit, enemy_stalla: hit } };
}
