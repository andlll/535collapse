// Regia dei livelli e IA "di gruppo" dei nemici: enemy_manager (ondate di
// match), enemy_manager_lv2 (aree difese e liberazioni del livello 2), le
// parti del manager che riguardano i livelli (blocchi e basi del tutorial
// di match, porte del livello 1) e gli script scr_attacca, scr_difendi,
// scr_area_difesa, scr_controller_crea_difensori,
// scr_creazione_attaccanti_generico, scr_creazione_difensori_arciere,
// scr_aggr_interval. Nomi originali.
//
// Dialoghi, suggerimenti e vittoria (dialogo_*, hint_*, victory_manager)
// stanno in hints.js ed endgame.js; la regia li crea con createIfPorted,
// che resta per gli oggetti non ancora portati.

import { irandomRange, pointDistance } from "./gm.js";
import { freeSpawnEnemy } from "./enemies.js";
import { activateGroup } from "./scenario.js";
import { GRID, generateFields } from "./pathing.js";

function createIfPorted(w, name, x, y) {
  return w.behaviours[name] ? w.create(name, x, y) : null;
}

// ------------------------------------------------------------- script

// scr_creazione_attaccanti_generico [C, Alarm_3 della caserma nemica]: un
// nemico alla volta (guerriero, picchiere, arciere a turno) ogni 540
// passi, col ruolo 30 (in attesa di attaccare).
export function creazioneAttaccantiGenerico(i, w) {
  i.role = 30;
  i.alarm.set(3, 540);
  i.prod++;
  if (i.prod > 3) i.prod = 1;
  const n = w.create(["enemy_warrior", "enemy_picchiere", "enemy_arciere"][i.prod - 1], i.flagx, i.flagy);
  n.role = 30;
  freeSpawnEnemy(n, w);
}

// scr_creazione_difensori_arciere [C]: un arciere difensore (ruolo 10)
function creazioneDifensoriArciere(i, w, defX, defY, defId) {
  i.role = 10;
  const n = w.create("enemy_arciere", i.flagx, i.flagy);
  n.role = 10;
  freeSpawnEnemy(n, w);
  n.def_point_x = defX; n.def_point_y = defY; n.def_point_id = defId;
}

// scr_area_difesa [C]: i nemici nel rettangolo difendono il punto
function areaDifesa(w, x1, y1, x2, y2, defX, defY, defId) {
  for (const e of w.all("enemy_unit")) {
    if (e.x > x1 && e.x < x2 && e.y > y1 && e.y < y2) {
      e.role = 10; e.def_point_x = defX; e.def_point_y = defY; e.def_point_id = defId;
    }
  }
}

// scr_difendi [C]: i difensori del punto inseguono l'alleato piu' vicino
// al punto se e' entro il raggio, altrimenti tornano verso il punto se se
// ne sono allontanati piu' di raggio/1,5.
function difendi(w, defX, defY, defId, raggio) {
  for (const e of w.all("enemy_unit")) {
    if (e.def_point_id !== defId || !(e.warwork === 0 || e.warwork === 4)) continue;
    const inv = w.nearest(defX, defY, "ally_unit");
    if (inv && pointDistance(defX, defY, inv.x, inv.y) < raggio) {
      if (e.action !== 1) e.alarm.set(0, 15);
      e.action = 1; e.warwork = 1; e.dirox = inv.x; e.diroy = inv.y;
    } else if (pointDistance(defX, defY, e.x, e.y) > raggio / 1.5) {
      if (e.action !== 1) e.alarm.set(0, 15);
      e.action = 1; e.warwork = 4; e.dirox = defX; e.diroy = defY;
    }
  }
}

// scr_controller_crea_difensori [C]: sotto la soglia di difensori la
// caserma nemica col ruolo 10 ne crea uno e riarma l'alarm 3; sopra,
// rimanda. [Correzione decisa dall'autore, §3.13 n.52] alla scadenza
// l'alarm 3 eseguiva scr_creazione_attaccanti_generico: la caserma creava
// un ATTACCANTE e passava al ruolo 30. Qui per il ruolo 10 l'alarm e' solo
// l'attesa (enemybuild.js): un difensore ogni 540 passi sotto la soglia.
function controllerCreaDifensori(w, critical, interval, defX, defY, targetid) {
  let count = 0;
  for (const e of w.all("enemy_unit")) if (e.role === 10 && e.def_point_id === targetid) count++;
  if (!w.exists("enemy_caserma")) return;
  for (const c of w.all("enemy_caserma")) {
    if (c.role !== 10) continue;
    if (count < critical) {
      if (c.alarm.get(3) === -1) { c.alarm.set(3, 540); creazioneDifensoriArciere(c, w, defX, defY, targetid); }
    } else c.alarm.set(3, interval * 60);
  }
}

// scr_aggr_interval [C]: rimanda la produzione degli attaccanti
function aggrInterval(w, interval) {
  for (const n of ["enemy_caserma", "enemy_stalla"]) {
    for (const c of w.all(n)) if (c.role === 30) c.alarm.set(3, c.alarm.get(3) + interval * 60);
  }
}

// scr_attacca(nsend, interval, target) [C]: quando gli attaccanti in
// attesa (ruolo 30) sono piu' di nsend, e ci sono una caserma e una stalla
// nemiche, partono tutti col flow field verso il bersaglio (ruolo 31); a
// destinazione passano al ruolo 32 e da fermi tornano sul bersaglio.
// Il flow field dei nemici considera chiuse le porte (§3.8).
function attacca(m, w, p, nsend, interval, target) {
  if (!w.exists(target) && w.exists("enemy_unit")) {
    for (const e of w.all("enemy_unit")) if (e.role > 29) { e.action = 0; e.role = 0; e.dirox = e.x; e.diroy = e.y; }
  }
  let count = 0;
  for (const e of w.all("enemy_unit")) if (e.role === 30) count++;
  if (count > nsend && w.exists(target) && w.exists("enemy_caserma") && w.exists("enemy_stalla")) {
    // scr_inizializza_ff_nemici(target): campo verso la PRIMA istanza del bersaglio
    const first = w.all(target).next().value;
    const goal = p.goalField(first.x, first.y, true);
    const ff = p.flowField(goal);
    m.flow_field = ff;
    for (const e of w.all("enemy_unit")) {
      if (e.role !== 30 || e.action !== 0) continue;
      const t = w.nearest(e.x, e.y, target);
      e.action = 1; e.flow_field = ff; e.dirox = t.x; e.diroy = t.y;
      e.alarm.set(0, irandomRange(12, 15));
      e.role = 31;
    }
    aggrInterval(w, interval);
  }
  for (const e of w.all("enemy_unit")) {
    if (e.role === 32 && e.action === 0 && w.exists(target)) {
      const t = w.nearest(e.x, e.y, target);
      e.action = 1; e.dirox = t.x; e.diroy = t.y;
      e.alarm.set(0, irandomRange(12, 15));
    }
  }
}

// enemy_manager Alarm_0 / enemy_manager_lv2 Alarm_0 [C]: ogni 600 passi i
// nemici non difensori e fermi vanno verso il civile piu' vicino; catapulte e
// arieti nemici verso l'edificio alleato piu' vicino.
function aggressione(i, w) {
  if (w.exists("ally_omino")) {
    for (const e of w.all("enemy_unit")) {
      if (e.defender === 0 && e.action !== 1 && e.action !== 2 && e.action !== 6 && e.firework === 0) {
        const o = w.nearest(e.x, e.y, "ally_omino");
        e.alarm.set(0, 15); e.action = 1; e.warwork = 1; e.dirox = o.x; e.diroy = o.y;
      }
    }
  }
  for (const n of ["enemy_catapulta", "enemy_ariete"]) {
    for (const e of w.all(n)) {
      if (e.action === 1 || e.action === 2) continue;
      const b = w.nearest(e.x, e.y, "ally_build");
      e.alarm.set(0, 15); e.action = 1; e.warwork = 1;
      if (b) { e.dirox = b.x; e.diroy = b.y; }
    }
  }
  i.alarm.set(0, 600);
}

// ----------------------------------------------------- match: ondate

// enemy_manager [C, creato dal manager in match]: dopo ~4,7 minuti
// un'ondata a nord-est ogni 18550 passi (14550 dalla settima), sempre piu'
// grossa; dopo 4 passi tutti i nemici gia' presenti diventano difensori
// (non vanno a cercare i civili).
export function enemyManager() {
  return {
    create(i, w) {
      i.sprite_index = null;
      i.alarm.set(0, 17000);
      i.alarm.set(2, 4);
      i.alarm.set(1, 16900);
      w.g.waves = 0;
    },
    alarm0: aggressione,
    alarm1(i, w) {
      const g = w.g;
      i.alarm.set(1, g.waves < 7 ? 18550 : 14550);
      const randomsol = ["enemy_warrior", "enemy_picchiere", "enemy_arciere", "enemy_cavaliere"][irandomRange(1, 4) - 1];
      g.waves += 1;
      // place_free del manager, che non ha maschera: sempre vero [I]
      if (g.waves > 4) w.create(randomsol, 5500, 150);
      if (g.waves > 3) w.create(randomsol, 5500, 200);
      if (g.waves > 2) w.create("enemy_cavaliere", 5500, 250);
      w.create("enemy_warrior", 5500, 300);
      w.create("enemy_picchiere", 5550, 350);
      w.create("enemy_arciere", 5550, 400);
      if (g.waves > 5) w.create(irandomRange(1, 2) === 1 ? "enemy_ariete" : "enemy_catapulta", 5250, 450);
    },
    alarm2(i, w) {
      for (const n of ["enemy_picchiere", "enemy_warrior", "enemy_arciere", "enemy_cavaliere"]) {
        for (const e of w.all(n)) e.defender = 1;
      }
    },
  };
}

// manager Step, "livello tutorial" [C]: avvicinandosi a tre punti della
// mappa compaiono gruppi di difensori; distrutte le tre basi (contatori
// global.base1b/2b/3b, scalati dagli edifici nemici) e' vittoria.
const BLOCS = [
  ["bloc1", 5493, 5955, [["enemy_cavaliere", 5656, 6000], ["enemy_cavaliere", 5708, 6086], ["enemy_cavaliere", 5828, 5971],
    ["enemy_cavaliere", 5855, 6069], ["enemy_cavaliere", 5983, 5939], ["enemy_cavaliere", 6018, 6061],
    ["enemy_cavaliere", 6149, 6053], ["enemy_cavaliere", 6143, 5941], ["enemy_cavaliere", 6269, 5914],
    ["enemy_cavaliere", 6278, 6031], ["enemy_cavaliere", 6425, 5909], ["enemy_arciere", 5937, 6214],
    ["enemy_arciere", 6098, 6191]]],
  ["bloc2", 576, 4616, [["enemy_picchiere", 562, 4794], ["enemy_picchiere", 697, 4764], ["enemy_picchiere", 867, 4727],
    ["enemy_arciere", 485, 4998], ["enemy_arciere", 412, 5068], ["enemy_arciere", 505, 5154], ["enemy_arciere", 641, 5129],
    ["enemy_arciere", 636, 4991], ["enemy_arciere", 729, 5027], ["enemy_arciere", 818, 4978], ["enemy_arciere", 886, 5009]]],
  ["bloc3", 5255, 1712, [["enemy_warrior", 5602, 1923], ["enemy_warrior", 5684, 1872], ["enemy_warrior", 5745, 1817],
    ["enemy_warrior", 5627, 1997], ["enemy_warrior", 5723, 1966], ["enemy_warrior", 5786, 1913],
    ["enemy_picchiere", 5665, 2072], ["enemy_picchiere", 5770, 2041], ["enemy_picchiere", 5868, 2003],
    ["enemy_arciere", 6058, 1991], ["enemy_arciere", 6002, 2097], ["enemy_arciere", 5903, 2164],
    ["enemy_arciere", 5788, 2198], ["enemy_warrior", 5194, 2428], ["enemy_warrior", 5139, 2373],
    ["enemy_warrior", 5266, 2463], ["enemy_warrior", 5359, 2498], ["enemy_picchiere", 5366, 2414],
    ["enemy_picchiere", 5226, 2348]]],
];

function matchTutorial(w) {
  const g = w.g;
  if (!w.exists("ally_unit")) return;
  for (const [flag, px, py, troops] of BLOCS) {
    if (g[flag] !== 0) continue;
    const u = w.nearest(px, py, "ally_unit");
    if (pointDistance(px, py, u.x, u.y) < 500) {
      for (const [obj, x, y] of troops) w.create(obj, x, y).defender = 1;
      g[flag] = 1;
    }
  }
  for (const k of [1, 2, 3]) {
    if (g["base" + k + "d"] === 0 && g["base" + k + "b"] < 1) { g["base" + k + "d"] = 1; g.basidistrutte++; }
  }
  if (g.victory === 0 && g.basidistrutte === 3) {
    g.victory = 1;
    createIfPorted(w, "victory_manager", 0, 0);
  }
}

// manager Step, "controller livello 1" [C]: le quattro porte del livello 1.
// Alla prima un premio d'oro e una base (2 caserme, 5 case), alla seconda
// oro e 2 stalle, poi due dialoghi.
function lvl01Gates(w) {
  const g = w.g;
  if (!w.exists("ally_unit")) return;
  const near = (x, y) => w.nearest(x, y, "ally_unit");
  if (g.lvl01_gate === 0) {
    const v = near(4550, 4150);
    if (pointDistance(4550, 4150, v.x, v.y) < 200) {
      g.lvl01_gate = 1;
      g.gold += 250;
      w.create("oro_prizedrawer", v.x, v.y);
      createIfPorted(w, "dialogo_1_5", v.x, v.y);
      for (const [o, x, y] of [["caserma", 3161, 4909], ["caserma", 3555, 4659], ["casa", 4061, 4763], ["casa", 3659, 4901],
                               ["casa", 3849, 4952], ["casa", 3888, 4819], ["casa", 4054, 4895]]) w.create(o, x, y);
    }
  }
  if (g.lvl01_gate === 1) {
    const v = near(593, 552);
    if (pointDistance(593, 552, v.x, v.y) < 200) {
      g.lvl01_gate = 2;
      g.gold += 250;
      w.create("oro_prizedrawer", v.x, v.y);
      createIfPorted(w, "dialogo_1_6", v.x, v.y);
      w.create("stalla", 283, 188);
      w.create("stalla", 749, 280);
    }
    return;
  }
  if (g.lvl01_gate === 2) {
    const v = near(4836, 331);
    if (pointDistance(4836, 331, v.x, v.y) < 800) { g.lvl01_gate = 3; createIfPorted(w, "dialogo_1_7", v.x, v.y); }
    return;
  }
  if (g.lvl01_gate === 3) {
    const v = near(4836, 331);
    if (pointDistance(4836, 331, v.x, v.y) < 200) { g.lvl01_gate = 4; createIfPorted(w, "dialogo_1_8", v.x, v.y); }
  }
}

// Le parti di manager Step che riguardano i livelli (dopo i pulsanti di
// costruzione, prima degli Step delle istanze).
export function levelStep(w) {
  const g = w.g;
  // trucco della nebbia: tutti i nemici visibili [Difetto corretto, §3.2
  // n.9: l'originale leggeva la variabile d'istanza fogville, mai assegnata]
  if (g.fogville === 0) for (const e of w.all("enemy")) e.visible = true;
  if (w.room === "match") matchTutorial(w);
  if (w.room === "lvl01") lvl01Gates(w);
}

// ----------------------------------------------------- livello 2

// enemy_manager_lv2 [C]: sette aree difese; liberarne una (nessun suo
// difensore vivo) da' civili e un dialogo; i nemici attaccano i civili a
// gruppi di 5 dalle caserme col ruolo 30; la caserma dell'area 6 crea
// arcieri difensori finche' l'area resiste. Vittoria: aree 1–7 liberate e
// nessun edificio nemico (l'area 7 per decisione dell'autore, §1.2).
// l6exists, letta anche quando l'area 6 e' gia' libera, vale falso: la
// caserma difensiva si ferma (l'effetto voluto, §1.2).
const AREAS = [
  [2260, 7450, 2920, 7900, 2600, 7700, 110], [2050, 3550, 2950, 4150, 2500, 3850, 120],
  // [§9.14, richiesta dell'autore] l'area 3 (i taglialegna) piu' su di 500
  // px e a sinistra di 280, coi suoi difensori (mappe/lvl02.tmx): era
  // [1150, 5400, 1880, 5900, 1500, 5750, 130]. E il suo raggio di difesa
  // (ottavo valore; gli altri 800 [C]) a 400: con 800 i difensori partivano
  // per un civile quasi ovunque nel bosco sopra la partenza (misurato)
  [870, 4900, 1600, 5400, 1220, 5250, 130, 400], [120, 3400, 720, 3800, 400, 3600, 140],
  [2000, 1900, 2950, 2750, 2500, 2200, 150], [30, 2100, 1050, 2550, 500, 2350, 160],
  [2200, 950, 2950, 1600, 2500, 1300, 170],
];
// liberazioni [C, Step]: civili creati, dialogo, premi
const FREED = [
  { omini: [[2600, 7650]], dialog: ["dialogo_2_6", 2600, 7650] },
  { omini: [[2950, 3950], [3050, 3950], [3150, 3950]], dialog: ["dialogo_2_7", 2950, 3950] },
  { omini: [[1800, 5580], [2000, 5650]], dialog: ["dialogo_2_8", 2000, 5650], prize: ["legno_prizedrawer", 2000, 5580, "wood", 100] },
  { omini: [[50, 3530]], dialog: ["dialogo_2_9", 50, 3530] },
  { omini: [[2950, 3950], [2950, 4050], [3050, 3950], [3050, 4050]], dialog: ["dialogo_2_10", 2950, 4050] },
  { omini: [[200, 2330]], dialog: ["dialogo_2_11", 200, 2330], prize: ["oro_prizedrawer", 200, 2330, "gold", 100] },
  { omini: [[2950, 850], [3050, 850]], dialog: ["dialogo_2_12", 2950, 850] },
];

export function enemyManagerLv2(p) {
  return {
    create(i, w) {
      i.sprite_index = null;
      i.alarm.set(4, 15000);
      w.setPos(i, 300, 300);
      // [Segnalazione dell'autore, §9.14] l'originale dava a tutti la stessa
      // meta senza percorso: incastrati fra i soldati di partenza restavano
      // li' per sempre. Qui ognuno ha la sua meta accanto a (112, 7449) e il
      // suo flow field, come per un ordine col clic destro.
      let k = 0;
      for (const o of w.all("ally_omino")) {
        generateFields(p, o, 112 + 70 * k, 7449 - 50 * k);
        o.action = 1; o.dirox = 112 + 70 * k; o.diroy = 7449 - 50 * k; o.alarm.set(0, 13);
        k++;
      }
      const paisa = w.nearest(w.mouse.x, w.mouse.y, "ally_omino");
      if (paisa) createIfPorted(w, "dialogo_2_0", paisa.x, paisa.y);
      i.liberati1 = 0;
      w.g.liberati = 0;
      for (const a of AREAS) areaDifesa(w, ...a);
      for (let k = 1; k <= 7; k++) i["l" + k] = 0;
      i.dia14 = 0;
    },
    alarm0: aggressione,
    // Alarm_3 [C]: rimanda le ondate di 250 s (lo arma dialogo_2_1)
    alarm3(i, w) { aggrInterval(w, 250); },
    alarm4(i, w) {
      const v = w.nearest(w.mouse.x, w.mouse.y, "ally_militare");
      if (v) createIfPorted(w, "dialogo_2_13", v.x, v.y);
    },
    step(i, w) {
      const g = w.g;
      if (i.liberati1 === 0 && !w.collisionRectangle(760, 6770, 1868, 7450, "enemy_unit", false)) {
        w.create("ally_omino", 1645, 7109);
        w.create("ally_omino", 1745, 7109);
        createIfPorted(w, "dialogo_2_1", 1645, 7109);
        i.liberati1 = 1;
      }
      // `var lNexists` vive solo dentro il suo if: per le aree gia' liberate
      // vale 0 (falso) [I]
      let l6exists = false;
      for (let k = 1; k <= 7; k++) {
        if (i["l" + k] !== 0) continue;
        const id = AREAS[k - 1][6];
        let exists = false;
        for (const e of w.all("enemy_unit")) if (e.def_point_id === id) exists = true;
        if (k === 6) l6exists = exists;
        if (!exists) {
          const F = FREED[k - 1];
          for (const [x, y] of F.omini) w.create("ally_omino", x, y);
          createIfPorted(w, F.dialog[0], F.dialog[1], F.dialog[2]);
          if (F.prize) { w.create(F.prize[0], F.prize[1], F.prize[2]); g[F.prize[3]] += F.prize[4]; }
          i["l" + k] = 1;
          g.liberati++;
          return; // exit
        }
      }
      for (const [, , , , dx, dy, id, r] of AREAS) difendi(w, dx, dy, id, r || 800);
      if (w.exists("ally_omino")) attacca(i, w, p, 4, 300, "ally_omino");
      if (l6exists) controllerCreaDifensori(w, 6, 30, 500, 2350, 160);
      else for (const c of w.all("enemy_caserma")) if (c.role === 10) c.alarm.set(3, -1);
      if (i.dia14 === 0) {
        const v = w.nearest(1500, 2200, "ally_militare");
        if (v && pointDistance(1500, 2200, v.x, v.y) < 400) { i.dia14 = 1; createIfPorted(w, "dialogo_2_14", v.x, v.y); }
      }
      // [Deviazione decisa dall'autore, §0.15 e §1.2] anche l'area 7 conta
      // (l'originale controllava solo le aree 1–6)
      // [Correzione decisa dall'autore, §3.14 n.53] la vittoria si crea
      // una volta sola (l'originale ne creava una a ogni passo)
      if (i.won !== 1 && [1, 2, 3, 4, 5, 6, 7].every((k) => i["l" + k] === 1) && w.number("enemy_build") === 0) {
        i.won = 1;
        createIfPorted(w, "victory_manager", 0, 0);
      }
    },
  };
}

// ----------------------------------------------------- livello 3

// [§9.11, idea dell'autore] Il monastero: difesa a tempo. I soldati partono
// in basso a destra; seguendo la strada arrivano al villaggio (che compare e
// passa al giocatore, gruppo "citta" della mappa), un abitante li avverte
// del monastero a nord; chiuso il dialogo il monastero diventa del
// giocatore (monastero_corpo -> monastero, gruppo "monastero": cinta, porta,
// torri), la vista ci si sposta e parte il conto alla rovescia. Le ondate
// arrivano dal punto di partenza (arieti contro la cinta, soldati contro i
// difensori); dalle caserme e dalle stalle della base nemica partono gli
// attacchi al villaggio (finche' ce ne sono: distruggerle li ferma).
// Vittoria: allo zero il monastero ha ancora almeno meta' della vita.
// Sconfitta: sotto la meta'.
// Numeri di partenza [decisi con l'autore, da tarare giocando]: 60 passi
// al secondo, 3600 al minuto.
const MIN = 3600;
export const LV3 = {
  town: [896, 2528], arrive: 700,          // il villaggio: arrivo entro 700 px dal centro
  spawn: [5750, 5850],                     // dove nascono le ondate (la partenza del giocatore)
  gate: [5160, 1332],                      // la porta della cinta: meta delle ondate
  inner: [5372, 1100],                     // fra la cinta e il muro del cortile: a 320 px dal monastero
  defense: 15 * MIN,                       // durata della difesa
  townGift: { omini: 3, food: 200, wood: 200 },
  // ondate (dalla rivelazione): fanti per tipo, arieti, catapulte
  waves: [
    { at: 1 * MIN, units: { enemy_warrior: 2, enemy_picchiere: 2 }, rams: 1 },
    { at: 3.5 * MIN, units: { enemy_warrior: 3, enemy_picchiere: 2, enemy_arciere: 1 }, rams: 1 },
    { at: 6 * MIN, units: { enemy_warrior: 4, enemy_picchiere: 3, enemy_arciere: 2 }, rams: 2 },
    { at: 8.5 * MIN, units: { enemy_warrior: 4, enemy_picchiere: 3, enemy_arciere: 2, enemy_cavaliere: 1 }, rams: 2 },
    { at: 11 * MIN, units: { enemy_warrior: 5, enemy_picchiere: 3, enemy_arciere: 3, enemy_cavaliere: 2 }, rams: 3 },
    { at: 13.5 * MIN, units: { enemy_warrior: 5, enemy_picchiere: 4, enemy_arciere: 3, enemy_cavaliere: 2 }, rams: 3, catapults: 1 },
  ],
  // attacchi al villaggio: il primo 3 minuti dopo la prima ondata, poi ogni
  // 2; ogni caserma crea `n` fanti, ogni stalla `n` cavalieri
  baseFirst: 4 * MIN, baseEvery: 2 * MIN, baseN: [1, 1, 2, 2, 2, 3],
  baseHint: 40 * 60,                       // il dialogo sulla base nemica, dopo il primo attacco
  lastMinute: 14 * MIN,
};
const FANTI = ["enemy_warrior", "enemy_picchiere", "enemy_arciere"];

// nascono nel punto, ognuno in un posto libero, e marciano col flow field
// verso la meta (ruolo 31; arrivati, 32); `side`: "mon" o "base"
function march(w, list, x, y, ff, goal, side) {
  for (const [k, obj] of list.entries()) {
    const e = w.create(obj, x + (k % 4) * 60 - 90, y + Math.floor(k / 4) * 60 - 60);
    freeSpawnEnemy(e, w);
    e.l3 = side;
    e.defender = 0;
    if (obj === "enemy_ariete" || obj === "enemy_catapulta") {
      e.action = 1; e.warwork = 1; e.dirox = goal[0]; e.diroy = goal[1]; e.alarm.set(0, 15);
      continue;
    }
    e.role = 31; e.action = 1; e.flow_field = ff; e.dirox = goal[0]; e.diroy = goal[1];
    e.alarm.set(0, irandomRange(12, 15));
  }
}

export function enemyManagerLv3(p) {
  const monastery = (w) => w.all("monastero").next().value || null;
  return {
    create(i, w) {
      i.sprite_index = null;
      Object.assign(i, { phase: 0, t: 0, wave: 0, base: 0, revealAsked: 0, baseHintAt: -1, last: 0, pan: null });
      // i nemici gia' sulla mappa difendono dove sono (non vanno a cercare i
      // civili), come in match
      for (const e of w.all("enemy_unit")) e.defender = 1;
      w.g.l3 = { phase: 0, left: LV3.defense, life: 0, slife: 0, baseKnown: 0 };
      i.alarm.set(1, 60);
    },
    // il primo dialogo, appena inquadrati i soldati
    alarm1(i, w) {
      const s = w.nearest(w.cam.x + w.cam.w / 2, w.cam.y + w.cam.h / 2, "ally_militare");
      if (s) w.create("dialogo_3_0", s.x, s.y);
    },
    step(i, w) {
      const g = w.g;
      if (g.victory === 1 || g.gameover === 1) return;
      // 0: in marcia verso il villaggio
      if (i.phase === 0) {
        const u = w.nearest(LV3.town[0], LV3.town[1], "ally_unit");
        if (u && pointDistance(u.x, u.y, LV3.town[0], LV3.town[1]) < LV3.arrive) {
          activateGroup(w, "citta");
          const c = w.nearest(LV3.town[0], LV3.town[1], "centro") || { x: LV3.town[0], y: LV3.town[1] };
          for (let k = 0; k < LV3.townGift.omini; k++) {
            const o = w.create("ally_omino", c.x - 60 + k * 60, c.y + 170);
            freeSpawnEnemy(o, w); // un posto libero (vale per qualunque istanza)
          }
          g.food += LV3.townGift.food; g.wood += LV3.townGift.wood;
          w.create("dialogo_3_1", c.x, c.y + 170);
          i.phase = 1;
        }
        return;
      }
      // 1: i dialoghi al villaggio; chiuso l'ultimo, la rivelazione
      if (i.phase === 1) {
        if (i.revealAsked !== 1) return;
        const old = w.all("monastero_corpo").next().value;
        if (old) { const { x, y } = old; w.destroy(old); w.create("monastero", x, y); }
        activateGroup(w, "monastero");
        const m = monastery(w);
        if (m) {
          const tx = m.x - w.cam.w / 2, ty = m.y + 250 - w.cam.h / 2;
          i.pan = { x0: w.cam.x, y0: w.cam.y, x1: tx, y1: ty, k: 0 };
          w.create("dialogo_3_4", m.x, m.y + 300);
        }
        i.ffMon = p.flowField(p.goalField(LV3.gate[0], LV3.gate[1], true));
        i.phase = 2; i.t = 0; g.l3.phase = 2;
        return;
      }
      // la vista che scivola sul monastero (90 passi)
      if (i.pan) {
        const P = i.pan, a = Math.min(1, ++P.k / 90), e = a * a * (3 - 2 * a);
        w.cam.x = P.x0 + (P.x1 - P.x0) * e; w.cam.y = P.y0 + (P.y1 - P.y0) * e;
        if (w.cam.clamp) w.cam.clamp();
        if (a >= 1) i.pan = null;
      }
      // 2: la difesa
      i.t++;
      const m = monastery(w);
      g.l3.left = Math.max(0, LV3.defense - i.t);
      if (m) { g.l3.life = m.life; g.l3.slife = m.slife; }
      if (!m || m.life < m.slife / 2) {
        g.gameover = 1; g.l3.lost = 1;
        w.create("gameover_manager", 0, 0);
        return;
      }
      if (i.t >= LV3.defense) {
        g.victory = 1;
        w.create("victory_manager", 0, 0);
        return;
      }
      if (i.last === 0 && i.t >= LV3.lastMinute) { i.last = 1; w.create("dialogo_3_6", m.x, m.y + 300); }
      // ondate verso la cinta
      const W = LV3.waves[i.wave];
      if (W && i.t >= W.at) {
        i.wave++;
        const list = [];
        for (const [obj, n] of Object.entries(W.units)) for (let k = 0; k < n; k++) list.push(obj);
        for (let k = 0; k < (W.rams || 0); k++) list.push("enemy_ariete");
        for (let k = 0; k < (W.catapults || 0); k++) list.push("enemy_catapulta");
        march(w, list, LV3.spawn[0], LV3.spawn[1], i.ffMon, LV3.gate, "mon");
      }
      // attacchi al villaggio dalle caserme e dalle stalle nemiche
      if (i.t >= LV3.baseFirst + i.base * LV3.baseEvery) {
        const n = LV3.baseN[Math.min(i.base, LV3.baseN.length - 1)];
        i.base++;
        const town = w.nearest(LV3.town[0], LV3.town[1], "ally_build");
        if (town) {
          const ff = p.flowField(p.goalField(town.x, town.y, true));
          let sent = 0;
          for (const c of [...w.all("enemy_caserma"), ...w.all("enemy_stalla")]) {
            const list = [];
            for (let k = 0; k < n; k++) list.push(c.object === "enemy_stalla" ? "enemy_cavaliere" : FANTI[(i.base + k) % 3]);
            march(w, list, c.x, c.y + 120, ff, [town.x, town.y], "base");
            sent += list.length;
          }
          if (sent && i.baseHintAt < 0) i.baseHintAt = i.t + LV3.baseHint;
        }
      }
      if (i.baseHintAt >= 0 && i.t >= i.baseHintAt) {
        i.baseHintAt = -2; g.l3.baseKnown = 1;
        const c = w.nearest(LV3.town[0], LV3.town[1], "ally_omino") || w.nearest(LV3.town[0], LV3.town[1], "ally_unit");
        if (c) w.create("dialogo_3_5", c.x, c.y);
      }
      // ogni secondo, chi e' arrivato e sta fermo riparte: le macchine verso
      // l'edificio alleato piu' vicino alla meta (la cinta, poi il resto), i
      // fanti verso il soldato alleato piu' vicino alla meta se ce n'e' uno
      // entro 1500 px; se no restano li', e a 400 px da un edificio di legno
      // (il monastero, le case) gli danno fuoco da soli (enemies.js)
      // Se non c'e' un soldato da attaccare, i fanti delle ondate entrano nel
      // cortile appena il monastero e' raggiungibile (cinta sfondata): il
      // campo verso il monastero si rifa' quando cambiano gli ostacoli.
      if (i.t % 60 === 0) {
        if (!i.ffIn || i.ffIn.ver !== p.solidVer) {
          const goal = p.goalField(LV3.inner[0], LV3.inner[1], true);
          i.ffIn = { ver: p.solidVer, goal, ff: p.flowField(goal) };
        }
        for (const e of w.all("enemy_unit")) {
          if (!e.l3 || e.action !== 0 || e.role === 31) continue;
          const [gx, gy] = e.l3 === "mon" ? LV3.gate : LV3.town;
          const siege = e.object === "enemy_ariete" || e.object === "enemy_catapulta";
          const t = w.nearest(gx, gy, siege ? "ally_build" : "ally_unit");
          if (t && (siege || pointDistance(t.x, t.y, gx, gy) <= 1500)) {
            e.action = 1; e.warwork = 1; e.dirox = t.x; e.diroy = t.y; e.alarm.set(0, 15);
            continue;
          }
          const d = pointDistance(e.x, e.y, LV3.inner[0], LV3.inner[1]);
          if (e.l3 !== "mon" || siege || d <= 120) continue;
          if (p.fieldAt(i.ffIn.goal, Math.floor(e.x / GRID), Math.floor(e.y / GRID)) === -1) continue;
          e.action = 1; e.warwork = 0; e.alarm.set(0, 15);
          e.dirox = LV3.inner[0] + irandomRange(-120, 120); e.diroy = LV3.inner[1] + irandomRange(-40, 40);
          // lontani col flow field (si fermano a 400 px, enemies.js), poi dritti
          if (d > 450) { e.role = 31; e.flow_field = i.ffIn.ff; } else e.role = 32;
        }
      }
    },
  };
}
