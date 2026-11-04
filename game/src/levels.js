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
import { freeSpawnEnemy, retreatTo } from "./enemies.js";
import { activateGroup } from "./scenario.js";
import { GRID, generateFields } from "./pathing.js";
import { panTo, panStep } from "./camera.js";
import { noMovesCheck } from "./endgame.js";
import { dialogOpen } from "./hints.js";
import { startFarm } from "./economy.js";
import { sendRepair } from "./buildings.js";
import { c } from "./colours.js";

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
    if (e.object === "enemy_omino") continue; // §9.44: i lavoratori non difendono
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
    if (e.object === "enemy_omino") continue; // §9.44
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
      if (e.object === "enemy_omino") continue; // §9.44: i lavoratori non attaccano
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
  // [§9.44] l'economia del nemico, dove c'e' un centro nemico
  if (!w.exists("enemy_eco") && w.exists("enemy_centro")) w.create("enemy_eco", 0, 0);
  noMovesCheck(w); // §9.39
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
// [Richiesta dell'autore, §9.39] vinta la battaglia iniziale (liberati1):
// popolazione massima 30 (prima 0) e un premio, se no il livello era troppo
// difficile
const LV2_FIRST = { popcap: 30, prizes: [["cibo_prizedrawer", 1645, 7060, "food", 200],
                                          ["legno_prizedrawer", 1745, 7060, "wood", 200],
                                          ["oro_prizedrawer", 1695, 7020, "gold", 100]] };
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
      // [§9.19] la vista sulla base nemica (la avvia dialogo_2_13)
      if (i.pan && panStep(w, i.pan)) i.pan = null;
      if (i.liberati1 === 0 && !w.collisionRectangle(760, 6770, 1868, 7450, "enemy_unit", false)) {
        w.create("ally_omino", 1645, 7109);
        w.create("ally_omino", 1745, 7109);
        createIfPorted(w, "dialogo_2_1", 1645, 7109);
        g.popcap += LV2_FIRST.popcap;
        for (const [o, x, y, r, n] of LV2_FIRST.prizes) { w.create(o, x, y); g[r] += n; }
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
  defense: 20 * MIN,                       // durata della difesa (§9.16: era 15 minuti)
  townGift: { omini: 3, food: 200, wood: 200 },
  // [§9.16, richiesta dell'autore] tre campi gia' coltivati attorno al
  // centro, a destra, ognuno col suo contadino (dal centro del villaggio).
  // Non sulla stessa x: il contadino cambia campo solo se cambia la x del
  // campo libero piu' vicino [C, civilians.js fieldsStep], e con tre campi
  // in colonna restavano tutti in fila per quello in basso (misurato)
  townFields: [[430, -225], [460, -25], [490, 175]],
  // ondate (dalla rivelazione): fanti per tipo, arieti, catapulte
  waves: [
    { at: 1 * MIN, units: { enemy_warrior: 2, enemy_picchiere: 2 }, rams: 1 },
    { at: 3.5 * MIN, units: { enemy_warrior: 3, enemy_picchiere: 2, enemy_arciere: 1 }, rams: 1 },
    { at: 6 * MIN, units: { enemy_warrior: 4, enemy_picchiere: 3, enemy_arciere: 2 }, rams: 2 },
    { at: 8.5 * MIN, units: { enemy_warrior: 4, enemy_picchiere: 3, enemy_arciere: 2, enemy_cavaliere: 1 }, rams: 2 },
    { at: 11 * MIN, units: { enemy_warrior: 5, enemy_picchiere: 3, enemy_arciere: 3, enemy_cavaliere: 2 }, rams: 3 },
    { at: 13.5 * MIN, units: { enemy_warrior: 5, enemy_picchiere: 4, enemy_arciere: 3, enemy_cavaliere: 2 }, rams: 3, catapults: 1 },
    // [§9.16] le due ondate dei 5 minuti in piu', con lo stesso passo
    { at: 16 * MIN, units: { enemy_warrior: 6, enemy_picchiere: 4, enemy_arciere: 3, enemy_cavaliere: 2 }, rams: 3, catapults: 1 },
    { at: 18.5 * MIN, units: { enemy_warrior: 6, enemy_picchiere: 4, enemy_arciere: 4, enemy_cavaliere: 3 }, rams: 3, catapults: 1 },
  ],
  // attacchi al villaggio: il primo 3 minuti dopo la prima ondata, poi ogni
  // 4 (§9.18: erano ogni 2); ogni caserma crea `n` fanti, ogni stalla `n`
  // cavalieri
  baseFirst: 4 * MIN, baseEvery: 4 * MIN, baseN: [1, 1, 2, 2, 2, 3],
  // [§9.16] il dialogo sulla base nemica al primo attacco al villaggio: un
  // nemico partito dalla base entro 500 px da un edificio alleato a meno di
  // 1500 px dal centro del villaggio (le torri comprese, il monastero no)
  baseHintNear: 500, baseHintTown: 1500,
  lastMinute: 19 * MIN,
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
      Object.assign(i, { phase: 0, t: 0, wave: 0, base: 0, revealAsked: 0, last: 0, pan: null });
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
      // [§9.31, richiesta dell'autore] all'inizio la vista sui soldati (in
      // basso a destra, dove parte il dialogo): la view della mappa e' piu'
      // in alto a sinistra, al buio. Al primo passo, dopo che la view ha
      // preso la misura della finestra (app.js, resize).
      if (!i.startView && w._stepNo < 10) { // (non dopo un caricamento)
        i.startView = 1;
        let n = 0, sx = 0, sy = 0;
        for (const u of w.all("ally_militare")) { n++; sx += u.x; sy += u.y; }
        if (n) {
          const c = w.cam;
          c.x = Math.max(0, Math.min(sx / n - c.w / 2, c.roomW - c.w));
          c.y = Math.max(0, Math.min(sy / n - c.h / 2, c.roomH - c.h));
        }
      }
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
          // [§9.16] i campi e i loro contadini: ognuno nasce sul suo campo e
          // cerca il campo libero piu' vicino (foodwork 6, civilians.js)
          for (const [dx, dy] of LV3.townFields) {
            w.create("campo", c.x + dx, c.y + dy);
            const o = w.create("ally_omino", c.x + dx, c.y + dy);
            g.idle -= 1; // non e' fermo
            o.foodwork = 6; o.action = 1; o.alarm.set(0, 13);
          }
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
          i.pan = panTo(w, m.x, m.y + 250);
          w.create("dialogo_3_4", m.x, m.y + 300);
        }
        i.ffMon = p.flowField(p.goalField(LV3.gate[0], LV3.gate[1], true));
        i.phase = 2; i.t = 0; g.l3.phase = 2;
        return;
      }
      // la vista che scivola sul monastero (90 passi)
      if (i.pan && panStep(w, i.pan)) i.pan = null;
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
          for (const c of [...w.all("enemy_caserma"), ...w.all("enemy_stalla")]) {
            const list = [];
            for (let k = 0; k < n; k++) list.push(c.object === "enemy_stalla" ? "enemy_cavaliere" : FANTI[(i.base + k) % 3]);
            march(w, list, c.x, c.y + 120, ff, [town.x, town.y], "base");
          }
        }
      }
      if (!g.l3.baseKnown && i.t % 15 === 0) {
        for (const e of w.all("enemy_unit")) {
          if (e.l3 !== "base") continue;
          const b = w.nearest(e.x, e.y, "ally_build");
          if (!b || pointDistance(e.x, e.y, b.x, b.y) > LV3.baseHintNear
              || pointDistance(b.x, b.y, LV3.town[0], LV3.town[1]) > LV3.baseHintTown) continue;
          g.l3.baseKnown = 1;
          const c = w.nearest(LV3.town[0], LV3.town[1], "ally_omino") || w.nearest(LV3.town[0], LV3.town[1], "ally_unit");
          if (c) w.create("dialogo_3_5", c.x, c.y);
          break;
        }
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
        // [§9.17, richiesta dell'autore] sfondata la porta, gli arieti delle
        // ondate vanno al monastero e colpiscono solo quello (siege.js
        // ramTarget), invece di continuare con le mura e le torri vicine.
        // [§9.29] Solo se da dove sono si arriva dentro la cinta (campo
        // "largo" dei nemici verso LV3.inner): se il giocatore ha chiuso il
        // varco (una caserma al posto della porta) l'ariete colpisce, come
        // prima, l'edificio alleato piu' vicino; prima restava fermo davanti
        // al varco chiuso col monastero come unico bersaglio.
        const porta = w.nearest(LV3.gate[0], LV3.gate[1], "porta_ori");
        if (!porta || pointDistance(porta.x, porta.y, LV3.gate[0], LV3.gate[1]) > 100) {
          if (!i.ramIn || i.ramIn.ver !== p.solidVer) {
            i.ramIn = { ver: p.solidVer, f: p.goalField(LV3.inner[0], LV3.inner[1], true, true) };
          }
          for (const e of w.all("enemy_ariete")) {
            if (e.l3 !== "mon") continue;
            const gx = Math.floor(e.x / GRID), gy = Math.floor(e.y / GRID);
            const inside = p.fieldAt(i.ramIn.f, gx, gy) !== -1 || !!p.escapeCell(i.ramIn.f, gx, gy, 2);
            e.ramTarget = inside ? m : null;
          }
        }
        for (const e of w.all("enemy_unit")) {
          if (!e.l3 || e.action !== 0 || e.role === 31 || e.ramTarget) continue;
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

// ----------------------------------------------------- livello 4

// [§9.52, decisioni dell'autore] Il fiume e il ponte (§9.40). Il giocatore
// parte a nord-ovest, di giorno, con risorse medie. Prima: riparare il
// ponte (1000 legno, §9.41) mentre la piccola base nemica a nord-est manda
// ondate crescenti ma non troppo; distruggerla (caserma e stalla) e' un
// obiettivo facoltativo e ferma le ondate. A ponte riparato si svela
// l'obiettivo: distruggere il centro nemico oltre il fiume (vittoria). La
// base sud ha l'economia (economy.js, ECO.lvl04): il centro lo mette questa
// regia (nella mappa dell'autore non c'e': il suo kit di Tiled non lo ha
// ancora), coi lavoratori di partenza; i suoi attacchi partono solo a
// ponte riparato (global.en.hold). Gli edifici nemici lontani dal centro
// (la base nord) non sono della regia economica (noEco): niente produzione
// pagata, riparazioni o ricostruzioni.
// Numeri di partenza, da tarare giocando.
export const LV4 = {
  start: { food: 300, wood: 300, gold: 150, stone: 0 },
  centro: [2925, 3700],          // il centro nemico (posto libero nella base sud)
  // [§9.57, richiesta dell'autore] la fattoria nemica di partenza, gia'
  // attiva: un mulino a est del centro e tre campi attorno, fuori dalle
  // strade, lontani dalla miniera d'oro e dagli alberi (economy.js,
  // startFarm). [§9.59] Prima era a ovest, coi campi sotto gli albero_fake
  farm: { mill: [3275, 3850], fields: [[3200, 3550], [2900, 3950], [3200, 3950]] },
  ecoR: 1500,                    // edifici entro tanti px dal centro: della regia economica
  northFirst: 2 * MIN,           // la prima ondata dalla base nord
  northEvery: 2.5 * MIN,         // poi ogni 2 minuti e mezzo
  northN: [2, 2, 3, 3, 4, 4, 5], // soldati per ondata (poi sempre l'ultimo)
  // [§9.57, richiesta dell'autore] le ondate nord seguono la strada che gira
  // a nord del bosco: tappe dall'accampamento verso la citta' alleata, col
  // campo di flusso anche da vicino (enemies.js, enemyMove); a roadNext px
  // la tappa dopo. Il percorso si ferma alla tappa piu' vicina al
  // bersaglio, poi al bersaglio come prima
  road: [[2600, 760], [2250, 560], [1900, 330], [1400, 280], [900, 330], [560, 800]],
  roadNext: 150,
  // [§9.107, segnalazione dell'autore] a ponte riparato la base sud riceve
  // rinforzi: escono dalle sue caserme e dalla stalla (o dal centro) e
  // restano a difenderla, soldati della regia economica (economy.js, ECO.lvl04)
  reinforce: ["enemy_warrior", "enemy_picchiere", "enemy_arciere", "enemy_warrior", "enemy_picchiere", "enemy_arciere",
              "enemy_cavaliere", "enemy_cavaliere"],
};

// [§9.57] Le tappe della strada (LV4.road) fino a quella piu' vicina al
// bersaglio t
function roadTo(t) {
  let k = 0, bd = Infinity;
  LV4.road.forEach(([x, y], j) => { const d = Math.hypot(x - t.x, y - t.y); if (d < bd) { bd = d; k = j; } });
  return LV4.road.slice(0, k + 1);
}

// [§9.57] Il campo di flusso dei nemici verso (x, y), uno per punto (le
// tappe della strada sono sempre le stesse), rifatto se cambiano gli
// ostacoli. Fuori dall'istanza: non va nei salvataggi.
const ROAD_FF = new WeakMap();
function roadField(i, p, x, y) {
  let c = ROAD_FF.get(i);
  if (!c) ROAD_FF.set(i, (c = new Map()));
  const key = x + "," + y, f = c.get(key);
  if (f && f.ver === p.solidVer) return f.ff;
  const ff = p.flowField(p.goalField(x, y, true));
  c.set(key, { ver: p.solidVer, ff });
  return ff;
}

export function enemyManagerLv4(p) {
  const north = (w) => [...w.all("enemy_caserma"), ...w.all("enemy_stalla")].filter((b) => b.noEco === 1);
  return {
    create(i, w) {
      const g = w.g;
      i.sprite_index = null;
      Object.assign(i, { t: 0, wave: 0, phase: 0 });
      Object.assign(g, LV4.start);
      const c = w.create("enemy_centro", LV4.centro[0], LV4.centro[1]);
      p.markInstance(c, 1000);
      startFarm(w, p, c, LV4.farm); // §9.57
      for (const b of w.all("enemy_build")) {
        if (Math.hypot(b.x - c.x, b.y - c.y) > LV4.ecoR) b.noEco = 1;
      }
      // i nemici gia' sulla mappa difendono dove sono
      for (const e of w.all("enemy_unit")) e.defender = 1;
      if (!g.en) g.en = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, idle: 0 };
      g.en.hold = 1;
      g.l4 = { phase: 0, bridge: 0, north: 0 };
      i.alarm.set(1, 60);
    },
    // il primo dialogo, sui soldati
    alarm1(i, w) {
      const s = w.nearest(w.cam.x + w.cam.w / 2, w.cam.y + w.cam.h / 2, "ally_militare");
      if (s) w.create("dialogo_4_0", s.x, s.y);
    },
    step(i, w) {
      const g = w.g, L = g.l4;
      if (!L || g.victory === 1 || g.gameover === 1) return;
      // all'inizio la vista sui soldati del giocatore, come nel livello 3
      // (la view della mappa di Tiled cade fuori dalla mappa)
      if (!i.startView && w._stepNo < 10) { // (non dopo un caricamento)
        i.startView = 1;
        let n = 0, sx = 0, sy = 0;
        for (const u of w.all("ally_militare")) { n++; sx += u.x; sy += u.y; }
        if (n) {
          const c = w.cam;
          c.x = Math.max(0, Math.min(sx / n - c.w / 2, c.roomW - c.w));
          c.y = Math.max(0, Math.min(sy / n - c.h / 2, c.roomH - c.h));
        }
      }
      i.t++;
      // il ponte: avanzamento per gli obiettivi, poi la fase 1
      const b = w.all("ponte").next().value;
      if (b) L.bridge = Math.floor(100 * b.life / b.slife);
      if (L.phase === 0 && w.exists("ponte_fatto")) {
        L.phase = 1; L.bridge = 100;
        g.en.hold = 0;
        // [§9.107] i rinforzi della base sud
        const south = [...w.all("enemy_caserma"), ...w.all("enemy_stalla")].filter((b) => b.noEco !== 1);
        const home = w.all("enemy_centro").next().value;
        LV4.reinforce.forEach((obj, k) => {
          const src = obj === "enemy_cavaliere" ? south.find((b) => b.object === "enemy_stalla") : south.filter((b) => b.object === "enemy_caserma")[k % 2];
          const at = src || home;
          if (!at) return;
          const e = w.create(obj, at.x, at.y + 120);
          freeSpawnEnemy(e, w);
          e.role = 30; e.eco = 1; e.stay = 1; // non partono con le ondate
        });
        const s = w.nearest(LV4.centro[0], LV4.centro[1], "ally_unit");
        if (s) w.create("dialogo_4_1", s.x, s.y);
      }
      // la base nord: ondate finche' ha caserma o stalla
      const nb = north(w);
      if (!nb.length && !L.north) {
        L.north = 1;
        const s = w.nearest(w.cam.x + w.cam.w / 2, w.cam.y + w.cam.h / 2, "ally_unit");
        if (s) w.create("dialogo_4_2", s.x, s.y);
      }
      if (nb.length && i.t >= LV4.northFirst + i.wave * LV4.northEvery) {
        const n = LV4.northN[Math.min(i.wave, LV4.northN.length - 1)];
        i.wave++;
        const home = nb[0], town = w.nearest(home.x, home.y, "ally_build") || w.nearest(home.x, home.y, "ally_unit");
        if (town) {
          const route = roadTo(town); // §9.57
          const [rx, ry] = route[0];
          const ff = roadField(i, p, rx, ry);
          // a turno dalla caserma (fanti) e dalla stalla (cavalieri)
          const list = [];
          for (let k = 0; k < n; k++) {
            const src = nb[k % nb.length];
            list.push([src, src.object === "enemy_stalla" ? "enemy_cavaliere" : FANTI[(i.wave + k) % 3]]);
          }
          for (const [src, obj] of list) {
            const e = w.create(obj, src.x, src.y + 120);
            freeSpawnEnemy(e, w);
            e.l4 = 1; e.defender = 0;
            e.role = 31; e.action = 1; e.flow_field = ff; e.dirox = rx; e.diroy = ry;
            e.road = route; e.roadK = 0; e.roadT = [town.x, town.y];
            e.alarm.set(0, irandomRange(12, 15));
          }
        }
      }
      // [§9.57] lungo la strada: vicino alla tappa, la tappa dopo; dopo
      // l'ultima, il bersaglio. Chi insegue un alleato (warwork) lascia la
      // strada; finito l'inseguimento (fermo, anche se arrivato vicino
      // all'alleato: ruolo 32) la riprende dalla sua tappa
      for (const e of w.all("enemy_unit")) {
        if (!e.road || (e.role !== 31 && e.role !== 32) || e.warwork) continue;
        // dalla tappa, non da dirox: se la meta e' occupata la si sposta a caso
        const [tx, ty] = e.road[e.roadK];
        if (e.action === 0) {
          e.role = 31; e.action = 1; e.dirox = tx; e.diroy = ty; e.flow_field = roadField(i, p, tx, ty);
          e.alarm.set(0, irandomRange(12, 15));
          continue;
        }
        if (e.role !== 31 || e.action !== 1 || Math.hypot(e.x - tx, e.y - ty) > LV4.roadNext) continue;
        e.roadK++;
        const [nx, ny] = e.roadK < e.road.length ? e.road[e.roadK] : e.roadT;
        if (e.roadK >= e.road.length) e.road = null;
        e.dirox = nx; e.diroy = ny;
        e.flow_field = roadField(i, p, nx, ny);
      }
      // arrivati e fermi: verso il bersaglio alleato piu' vicino
      if (i.t % 60 === 0) {
        for (const e of w.all("enemy_unit")) {
          if (e.l4 !== 1 || e.action !== 0 || e.role === 31) continue;
          const t = w.nearest(e.x, e.y, "ally_unit") || w.nearest(e.x, e.y, "ally_build");
          if (!t) continue;
          e.action = 1; e.warwork = 1; e.dirox = t.x; e.diroy = t.y; e.alarm.set(0, 15);
        }
      }
      // vittoria: il centro nemico distrutto (si vede solo a ponte riparato,
      // ma vale anche prima)
      if (!w.exists("enemy_centro")) {
        g.victory = 1;
        w.create("victory_manager", 0, 0);
      }
    },
  };
}

// ----------------------------------------------------- livello 5

// [§9.75, decisione dell'autore] Nella mappa del livello 5 le mura, le
// porte e i campi da costruire della citta' nemica (la meta' est) sono
// quelli del giocatore: il kit di Tiled dell'autore non aveva le versioni
// nemiche. All'avvio diventano mura e porte nemiche e campi coltivati
// nemici (della regia economica), nello stesso punto. Nel kit nuovo ci sono
// (tileset nemici, in fondo): una mappa che le usa non ha bisogno di
// questo.
// [§9.76, regia e ambientazione dell'autore] Si apre con una battaglia vicino
// alla base del giocatore; i nemici, vedendosela brutta, si ritirano nella
// loro citta'. Inseguiti fino alle mura, i soldati capiscono che senza armi
// d'assedio le difese li trafiggeranno e tornano indietro; sulla via del
// ritorno trovano l'acropoli di un culto antico (le rovine al centro della
// mappa) e decidono, a malincuore, di ricavarne pietra per una fortezza
// (obbligatoria: produce arieti e catapulte). Intanto il nemico manda
// ondate (la regia economica, ECO.lvl05). La prima ondata dopo la fortezza,
// vista la sua mole, torna indietro ad avvertire la citta': da allora le
// ondate portano anche macchine d'assedio, pagate con la grande riserva di
// pietra del nemico (che non la usa per riparare o ricostruire gli edifici
// di pietra: economy.js stoneWork). Vittoria: la citta' nemica distrutta
// (tutti gli edifici tranne mura, porte e campi). Le due torri nemiche fuori
// dalle mura erano di vedetta, senza tirare (ranged.js, watch); [§9.102,
// richiesta dell'autore] ora tirano dall'inizio (il giocatore si accampava
// li' fuori). E chi si avvicina troppo alle mura (LV5.sallyR) fa uscire il
// presidio della citta' (lv5Sally). Numeri da tarare giocando.
export const LV5 = {
  start: { food: 200, wood: 200, gold: 100, stone: 0 },
  east: 4500,                        // la citta' nemica: x >= east
  watch: 5100,                       // torri nemiche a ovest delle mura: di vedetta
  retreatAt: 2 / 3,                  // la battaglia d'apertura: ritirata quando ne resta al piu' questa parte...
  retreatAfter: 45 * 60,             // ...o dopo tanti passi
  home: [5750, 2450],                // dove si ritirano: dentro la porta ovest
  wallsR: 600,                       // un alleato a tanti px dalle mura nemiche: il dialogo delle mura
  acropolis: [3450, 2250],           // il centro delle rovine (e delle pietre che le circondano)
  acropolisR: 800,
  acropolisAfter: 600,               // passi dopo il dialogo delle mura (l'acropoli e' sulla strada dell'inseguimento)
  sightR: 900,                       // l'ondata vede la fortezza a tanti px
  siegeAt: [4980, 2450],             // dove nascono le macchine d'assedio: fuori dalla porta ovest
  siegeCost: { enemy_ariete: 250, enemy_catapulta: 300 }, // in pietra
  siegeMax: 3,                       // macchine per ondata, al piu' (1, 1, 2, 2, 3...)
  city: ["enemy_centro", "enemy_house", "enemy_caserma", "enemy_stalla", "enemy_chiesa", "enemy_castello",
         "enemy_magazzino", "enemy_mulino", "enemy_torre", "enemy_fondamenta"],
  walls: ["enemy_mura_ori", "enemy_mura_vert", "enemy_porta_ori", "enemy_porta_vert"],
  // [§9.102] la sortita: un alleato a sallyR px dalle mura o da una porta fa
  // uscire i soldati del presidio entro sallyFrom px da lui; nessun alleato
  // a sallyR + 300 px dalle mura per sallyCalm passi, chi non combatte (nessun
  // alleato a sallyFree px) torna al suo posto
  sallyR: 500,
  sallyFrom: 2000,
  sallyCalm: 360,
  sallyFree: 350,
};
const LV5_ENEMY = { mura_ori: "enemy_mura_ori", mura_vert: "enemy_mura_vert", porta_ori: "enemy_porta_ori",
                    porta_vert: "enemy_porta_vert", campo_fond: "enemy_campo" };
export function lvl05Setup(w) {
  for (const [from, to] of Object.entries(LV5_ENEMY)) {
    for (const i of [...w.all(from)]) {
      if (i.x < LV5.east) continue;
      const { x, y } = i;
      w.destroy(i);
      w.create(to, x, y);
    }
  }
  // [§9.76] le torri fuori dalle mura non sono della regia economica (un
  // alleato vicino non chiama la difesa della citta'). [§9.102] Tirano
  // (prima, di vedetta, no: watch)
  for (const t of w.all("enemy_torre")) if (t.x < LV5.watch) t.noEco = 1;
}

// [§9.102, richiesta dell'autore] La sortita: chi si avvicina troppo alle
// mura (sallyR) fa uscire il presidio della citta' (i soldati della mappa
// dentro le mura, non quelli della regia economica, che difendono gia' da
// soli: economy.js, defendR; non chi si ritira o va in un presidio), quelli
// entro sallyFrom px dall'alleato: col flow field dei nemici (passa dalle
// loro porte) verso di lui, poi combattono come sempre. Tornata la calma
// (nessun alleato vicino alle mura per sallyCalm passi), chi non sta
// combattendo torna al suo posto (retreatTo; l5sally: 1 fuori, 2 di
// ritorno). Prima il presidio restava fermo dentro le mura e il giocatore
// poteva restare li' fuori a lungo.
const sallying = (e) => e.l5sally === 1 && e.alive;
function lv5Sally(w, p, L, allyNear) {
  const a = allyNear(w, LV5.walls, LV5.sallyR);
  if (a) {
    L.calm = 0;
    let ff = null;
    for (const e of w.all("enemy_unit")) {
      if (e.object === "enemy_omino" || e.eco === 1 || e.l5w || e.presidiowork === 1 || (e.x < LV5.east && !e.l5sally)) continue;
      if (e.retreat && !e.l5sally) continue; // la ritirata della battaglia d'apertura
      if (e.warwork === 2 || (e.action === 1 && e.warwork === 1 && !e.retreat)) continue; // gia' combatte o insegue
      if (Math.hypot(e.x - a.x, e.y - a.y) > LV5.sallyFrom) continue;
      if (!e.l5sally) e.l5post = [e.x, e.y];
      e.l5sally = 1;
      ff = ff || p.flowField(p.goalField(a.x, a.y, true, false, true));
      if (e.action !== 1) e.alarm.set(0, irandomRange(12, 15));
      Object.assign(e, { retreat: null, action: 1, warwork: 1, role: 31, defender: 0, dirox: a.x, diroy: a.y, flow_field: ff });
    }
    return;
  }
  // la calma: nessun alleato vicino alle mura per sallyCalm passi
  if (allyNear(w, LV5.walls, LV5.sallyR + 300)) { L.calm = 0; return; }
  L.calm = (L.calm || 0) + 20;
  if (L.calm < LV5.sallyCalm) return;
  for (const e of w.all("enemy_unit")) {
    if (!sallying(e) || e.retreat || e.warwork === 2) continue;
    const n = w.nearest(e.x, e.y, "ally_unit");
    if (n && Math.hypot(n.x - e.x, n.y - e.y) < LV5.sallyFree) continue;
    e.l5sally = 2; // torna al suo posto (una sortita nuova lo riprende)
    // col campo dei soli ostacoli fissi (§9.82): con quello di sempre i
    // compagni fermi nel varco della porta la chiudevano, e chi era fuori
    // restava li' (fuori dal campo)
    const [x, y] = e.l5post;
    retreatTo(w, p, e, x, y, p.flowField(p.goalField(x, y, true, false, true)));
  }
}

// I nemici della lista si ritirano in citta' (enemies.js, retreatTo), un
// campo di flusso per tutti, ognuno verso un posto suo
function lv5Retreat(w, p, list) {
  const [hx, hy] = LV5.home, ff = p.flowField(p.goalField(hx, hy, true));
  list.filter((e) => e.object !== "enemy_omino" && !e.retreat)
    .forEach((e, k) => retreatTo(w, p, e, hx + (k % 4) * 60 - 90, hy + Math.floor(k / 4) * 60 - 60, ff));
}

// Le macchine d'assedio di un'ondata, fuori dalla porta ovest, verso
// l'edificio alleato piu' vicino (poi da sole, enemyRam / enemyCatapult)
function lv5Siege(w, L) {
  const en = w.g.en, [sx, sy] = LV5.siegeAt;
  const n = Math.min(LV5.siegeMax, 1 + Math.floor(L.siegeN / 2));
  const t = w.nearest(sx, sy, "ally_build");
  for (let k = 0; k < n; k++) {
    const obj = (L.siegeN + k) % 2 ? "enemy_catapulta" : "enemy_ariete", cost = LV5.siegeCost[obj];
    if (!en || en.stone < cost) break;
    en.stone -= cost;
    const m = w.create(obj, sx, sy - 120 + k * 120);
    freeSpawnEnemy(m, w);
    m.l5siege = 1;
    if (t) { m.action = 1; m.warwork = 0; m.dirox = t.x; m.diroy = t.y; m.alarm.set(0, 13); }
  }
  L.siegeN++;
}

export function enemyManagerLv5(p) {
  // un dialogo vicino a (x, y), o al centro della vista
  const say = (w, name, at = null) => {
    const [x, y] = at || [w.cam.x + w.cam.w / 2, w.cam.y + w.cam.h / 2];
    const s = w.nearest(x, y, "ally_militare") || w.nearest(x, y, "ally_unit");
    if (s) w.create(name, s.x, s.y);
  };
  // il primo alleato entro r px da uno degli oggetti
  const allyNear = (w, objs, r) => {
    for (const o of objs) for (const b of w.all(o)) {
      const a = w.nearest(b.x, b.y, "ally_unit");
      if (a && Math.hypot(a.x - b.x, a.y - b.y) < r) return a;
    }
    return null;
  };
  return {
    create(i, w) {
      const g = w.g;
      i.sprite_index = null;
      Object.assign(g, LV5.start);
      // la battaglia d'apertura: i nemici vicino alla base del giocatore;
      // quelli della citta' difendono dove sono
      const opening = [...w.all("enemy_unit")].filter((e) => e.x < LV5.east);
      for (const e of opening) e.l5open = 1;
      for (const e of w.all("enemy_unit")) if (e.x >= LV5.east) e.defender = 1;
      g.l5 = { phase: 0, n0: opening.length, t: 0, wallsAt: 0, fortWave: 0, warned: 0, siege: 0, siegeN: 0, lastWave: 0,
               left: LV5.city.reduce((n, o) => n + w.number(o), 0) };
      i.alarm.set(1, 60);
    },
    alarm1(i, w) { say(w, "dialogo_5_0"); },
    step(i, w) {
      const g = w.g, L = g.l5, en = g.en;
      if (!L || g.victory === 1 || g.gameover === 1) return;
      L.t++;
      // fase 0, la battaglia: ritirata quando i nemici sono ridotti a due
      // terzi, o dopo retreatAfter passi
      if (L.phase === 0) {
        const alive = [...w.all("enemy_unit")].filter((e) => e.l5open === 1);
        if (alive.length <= Math.floor(L.n0 * LV5.retreatAt) || L.t >= LV5.retreatAfter) {
          L.phase = 1;
          lv5Retreat(w, p, alive);
          say(w, "dialogo_5_1", alive.length ? [alive[0].x, alive[0].y] : null);
        }
      }
      if (L.t % 20 === 0) {
        lv5Sally(w, p, L, allyNear); // §9.102
        // fase 1, l'inseguimento: un alleato arrivato davanti alle mura
        if (L.phase === 1) {
          const a = allyNear(w, LV5.walls, LV5.wallsR);
          if (a) { L.phase = 2; L.wallsAt = L.t; say(w, "dialogo_5_2", [a.x, a.y]); }
        }
        // fase 2, la ritirata: sulla via del ritorno, l'acropoli
        if (L.phase === 2 && L.t - L.wallsAt >= LV5.acropolisAfter) {
          const [ax, ay] = LV5.acropolis, a = w.nearest(ax, ay, "ally_unit");
          if (a && Math.hypot(a.x - ax, a.y - ay) < LV5.acropolisR) { L.phase = 3; say(w, "dialogo_5_3", [a.x, a.y]); }
        }
      }
      // la fortezza (a qualunque fase): l'obiettivo diventa la citta'
      if (L.phase < 4 && w.exists("castello")) {
        L.phase = 4;
        L.fortWave = en ? en.wave || 0 : 0;
        const f = w.all("castello").next().value;
        say(w, "dialogo_5_4", [f.x, f.y]);
      }
      // le ondate della regia economica: chi parte e' della sua ondata;
      // dopo l'avvertimento, con le macchine d'assedio
      const wave = en ? en.wave || 0 : 0;
      if (wave > L.lastWave) {
        L.lastWave = wave;
        for (const e of w.all("enemy_unit")) if (e.eco === 1 && e.role === 31 && !e.defending && !e.l5w) e.l5w = wave;
        if (L.siege) lv5Siege(w, L);
      }
      // la prima ondata partita dopo la fortezza, vista la fortezza, torna
      // ad avvertire la citta'
      if (L.phase === 4 && !L.warned && L.t % 10 === 0) {
        const f = w.all("castello").next().value;
        if (f) {
          for (const e of w.all("enemy_unit")) {
            if (!e.l5w || e.l5w <= L.fortWave || e.retreat) continue;
            if (Math.hypot(e.x - f.x, e.y - f.y) >= LV5.sightR) continue;
            L.warned = 1; L.siege = 1;
            lv5Retreat(w, p, [...w.all("enemy_unit")].filter((u) => u.l5w === e.l5w));
            say(w, "dialogo_5_5", [e.x, e.y]);
            break;
          }
        }
      }
      // vittoria: la citta' distrutta
      L.left = LV5.city.reduce((n, o) => n + w.number(o), 0);
      if (L.left === 0) {
        g.victory = 1;
        w.create("victory_manager", 0, 0);
      }
    },
  };
}

// ----------------------------------------------------- livello 6

// [§9.101, regia e ambientazione dell'autore] La citta' devastata: la
// guarnigione e' caduta e l'armeria saccheggiata; i cittadini sono una
// milizia di arcieri, e le caserme addestrano solo arcieri (production.js
// ONLY_UNITS; niente caserme nuove ne' stalle: buildings.js NO_BUILD).
// Fase 0: tre pattuglie nemiche (i gruppi fra i fiumi) girano per la citta'
// lungo i percorsi "pattuglia" della mappa (livello regia di Tiled, chiusi:
// in giro), reagiscono agli alleati e poi riprendono il giro; non danno
// fuoco agli edifici (noFire). Le 21 torri ci sono ma non sono del
// giocatore (locked: non vedono, non si presidiano, non si riparano).
// Fase 1, sconfitte le pattuglie: 20 minuti di conto alla rovescia; le
// torri, a vita fra il 10 e il 40% (a caso, dall'inizio), si riparano e
// oltre il 60% diventano del giocatore, con un messaggio. Ogni 3 minuti un
// piccolo contingente di fanteria di rinforzo davanti al centro, e
// un'incursione di 4-5 fanti dalla base nemica in alto a sinistra, dal
// ponte di sinistra (la base si puo' distruggere e si difende: economy.js
// ECO.lvl06; non e' un obiettivo).
// Fase 2, allo zero: la colonna, una cinquantina di fanti e arcieri, entra
// dal bordo sinistro (il teatro) e segue il percorso "colonna" fino al
// ponte di destra; attacca solo le unita'. Passato il ponte (passX) un
// soldato e' passato: piu' di maxPass passati, sconfitta; fermati tutti,
// vittoria. Numeri da tarare giocando (la prova di taratura: STUDIO §9.101).
export const LV6 = {
  start: { food: 400, wood: 400, gold: 500, stone: 200 },
  patrolR: 300,                       // nemici a meno di tanti px da una tappa di una pattuglia: della pattuglia
  next: 120,                          // a tanti px dalla tappa, la tappa dopo
  towerLife: [10, 40],                // vita delle torri all'inizio, in percento
  unlockAt: 0.6,                      // riparata oltre questa parte della vita: la torre e' del giocatore
  prep: 20 * MIN,                     // dalle pattuglie sconfitte alla colonna
  reinfEvery: 3 * MIN,                // rinforzi del giocatore, nella fase 1
  reinf: ["ally_warrior", "ally_picchiere", "ally_warrior", "ally_picchiere"],
  reinfAt: [5240, 1700],              // davanti al centro del giocatore
  raidEvery: 3 * MIN,                 // incursioni dalla base nemica, dalla fase 1
  raidN: [4, 5],                      // fanti per incursione, a turno
  raidRoute: [[1276, 1488], [1420, 1760]], // il ponte di sinistra e la sua uscita verso la citta'
  raidReach: 2500,                    // passato il ponte: verso un alleato a meno di tanti px dall'uscita...
  raidCamp: [2450, 2750],             // ...se no in mezzo alla citta', ad aspettare
  raidHunt: 1500,                     // fermi: verso un alleato a meno di tanti px
  // la colonna: file da 5 (fanti davanti e dietro, l'arciere in mezzo), 10 file
  columnRow: ["enemy_warrior", "enemy_picchiere", "enemy_arciere", "enemy_picchiere", "enemy_warrior"],
  columnRows: 10, columnEvery: 45,    // passi fra una fila e l'altra
  columnPace: 0.6,                    // la colonna marcia piu' piano (enemies.js, marchPace): taratura in STUDIO §9.101
  margin: 60,                         // entrata e uscita della colonna a tanti px dal bordo della mappa
  passX: 6250,                        // oltre il ponte di destra: passato
  maxPass: 5,
};

const RAID = ["enemy_warrior", "enemy_picchiere"];

// Il punto sul bordo (a `m` px) fra a, fuori dalla mappa, e b, dentro
function edgePoint(a, b, W, H, m) {
  const inside = ([x, y]) => x >= m && x <= W - m && y >= m && y <= H - m;
  let lo = 0, hi = 1;
  for (let k = 0; k < 24; k++) {
    const t = (lo + hi) / 2;
    if (inside([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])) hi = t; else lo = t;
  }
  return [a[0] + (b[0] - a[0]) * hi, a[1] + (b[1] - a[1]) * hi];
}

// Il percorso tagliato ai bordi della mappa: entra e esce a `m` px dal bordo
export function clipRoute(pts, W, H, m) {
  const inside = ([x, y]) => x >= m && x <= W - m && y >= m && y <= H - m;
  const out = [];
  for (let k = 0; k < pts.length; k++) {
    if (inside(pts[k])) {
      if (!out.length && k > 0) out.push(edgePoint(pts[k - 1], pts[k], W, H, m));
      out.push(pts[k]);
    } else if (out.length) { out.push(edgePoint(pts[k], pts[k - 1], W, H, m)); break; }
  }
  return out.map(([x, y]) => [Math.round(x), Math.round(y)]);
}

// L'edificio alleato piu' vicino che sia del giocatore (non una torre chiusa)
function nearestOpen(w, x, y, name = "ally_build") {
  let best = null, bd = Infinity;
  for (const o of w.all(name)) {
    if (!o.alive || o.locked) continue;
    const d = Math.hypot(o.x - x, o.y - y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
const allyTarget = (w, x, y) => w.nearest(x, y, "ally_unit") || nearestOpen(w, x, y);
// la meta di un incursore passato il ponte: l'alleato piu' vicino all'uscita
// del ponte, se e' in citta', se no il mezzo della citta'
function raidGoal(w) {
  const [x, y] = LV6.raidRoute[LV6.raidRoute.length - 1], t = allyTarget(w, x, y);
  return t && Math.hypot(t.x - x, t.y - y) < LV6.raidReach ? [t.x, t.y] : LV6.raidCamp;
}

// [§9.101] La torre del livello 6 (app.js, sopra garrisoned): con
// i.locked 1 non e' del giocatore (si seleziona e basta), con 2 si ripara
// e basta (non si presidia, niente "n/2"), senza e' una torre come le
// altre. La barra della vita chiusa e' grigia, da riparare arancione. Non
// vede (fog.js) e la minimappa la disegna grigia (manager.js).
export function lockedTower(base) {
  return {
    ...base,
    leftReleased(i, w) {
      if (!i.locked) { base.leftReleased(i, w); return; }
      if (w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1;
    },
    rightReleased(i, w) {
      if (!i.locked) { base.rightReleased(i, w); return; }
      if (i.locked === 2 && i.life < i.slife) sendRepair(i, w);
    },
    // (come ally_build, ma la torre chiusa non mostra il puntatore della riparazione)
    mouseEnter(i, w) { i.hover = 1; if (i.life < i.slife && i.locked !== 1) w.g.buildhover = 1; },
    keyPress46(i, w) { if (!i.locked && base.keyPress46) base.keyPress46(i, w); },
    drawEnd(i, w, d) {
      if (!i.locked) { base.drawEnd(i, w, d); return; }
      if (i.hover === 1 || i.hit === 1 || i.selected === 1) {
        d.lifeBar(i.x - 25, i.y - 212, i.life / i.slife, i.locked === 2 ? c.orange : c.gray);
      }
    },
  };
}

export function enemyManagerLv6(p) {
  // un dialogo vicino a (x, y), o al centro della vista; `only`: chiude
  // prima le finestre uguali ancora aperte
  const say = (w, name, at = null, only = false) => {
    if (only) for (const d of [...w.all(name)]) w.destroy(d);
    const [x, y] = at || [w.cam.x + w.cam.w / 2, w.cam.y + w.cam.h / 2];
    const s = w.nearest(x, y, "ally_militare") || w.nearest(x, y, "ally_unit");
    if (s) w.create(name, s.x, s.y);
  };
  const routes = (w, name) => (w.routes || []).filter((r) => r.name === name);
  // in cammino lungo un percorso (come la strada del livello 4, §9.57)
  const walk = (i, e, k) => {
    e.roadK = k;
    const [x, y] = e.road[k];
    if (e.action !== 1) e.alarm.set(0, irandomRange(12, 15));
    e.role = 31; e.action = 1; e.dirox = x; e.diroy = y; e.flow_field = roadField(i, p, x, y);
  };
  const towerCount = (w) => {
    let n = 0, open = 0;
    for (const t of w.all("torre")) { n++; if (!t.locked) open++; }
    return [n, open];
  };
  return {
    create(i, w) {
      const g = w.g;
      i.sprite_index = null;
      Object.assign(g, LV6.start);
      // le pattuglie: i nemici vicini a una tappa di un percorso "pattuglia"
      // partono dalla tappa piu' vicina; gli altri (la base) difendono dove sono
      const pr = routes(w, "pattuglia");
      const groups = new Set();
      for (const e of w.all("enemy_unit")) {
        let best = null;
        pr.forEach((r, gi) => r.pts.forEach(([x, y], k) => {
          const d = Math.hypot(e.x - x, e.y - y);
          if (d < LV6.patrolR && (!best || d < best.d)) best = { d, gi, k };
        }));
        if (!best) { e.defender = 1; continue; }
        groups.add(best.gi);
        Object.assign(e, { l6: "p", l6g: best.gi, l6loop: 1, road: pr[best.gi].pts.map(([x, y]) => [x, y]), roadK: best.k,
                           noFire: 1, defender: 0, role: 32, action: 0 });
      }
      // le torri: in rovina e chiuse
      const [a, b] = LV6.towerLife;
      for (const t of w.all("torre")) {
        t.life = Math.max(1, Math.round(t.slife * irandomRange(a, b) / 100));
        t.locked = 1;
      }
      const [nt] = towerCount(w);
      g.towersLocked = nt;
      if (!g.en) g.en = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, idle: 0 };
      g.l6 = { phase: 0, t: 0, patrols: groups.size, patrolsLeft: groups.size, left: LV6.prep, towers: nt, towersOk: 0,
               reinf: 0, raid: 0, col: 0, colN: LV6.columnRow.length * LV6.columnRows, colLeft: 0, passed: 0, max: LV6.maxPass };
      i.alarm.set(1, 60);
    },
    alarm1(i, w) { say(w, "dialogo_6_0"); },
    step(i, w) {
      const g = w.g, L = g.l6;
      if (!L || g.victory === 1 || g.gameover === 1) return;
      L.t++;
      // in cammino lungo i percorsi (pattuglie, incursioni, colonna): vicino
      // alla tappa, la tappa dopo (le pattuglie ricominciano il giro). Chi
      // insegue un alleato lascia il percorso; finito l'inseguimento (fermo)
      // lo riprende dalla sua tappa
      for (const e of w.all("enemy_unit")) {
        if (!e.l6 || !e.road || (e.role !== 31 && e.role !== 32) || e.warwork) continue;
        if (e.action === 0) { walk(i, e, e.roadK); continue; }
        const [tx, ty] = e.road[e.roadK];
        if (e.role !== 31 || e.action !== 1 || Math.hypot(e.x - tx, e.y - ty) > LV6.next) continue;
        if (e.roadK + 1 < e.road.length) { walk(i, e, e.roadK + 1); continue; }
        if (e.l6loop) { walk(i, e, 0); continue; }
        if (e.l6 === "c") continue; // (la colonna passa il ponte prima dell'ultima tappa)
        // l'incursione, passato il ponte: verso l'alleato piu' vicino in
        // citta' (raidReach px), se no in mezzo alla citta' (raidCamp) ad aspettare
        e.road = null;
        const [tx2, ty2] = raidGoal(w);
        e.dirox = tx2; e.diroy = ty2; e.flow_field = p.flowField(p.goalField(tx2, ty2, true, false, true));
      }
      if (L.t % 20 === 0) {
        const [nt, open] = towerCount(w);
        L.towers = nt; L.towersOk = open; g.towersLocked = nt - open;
      }
      // fase 0: le pattuglie
      if (L.phase === 0) {
        if (L.t % 20 !== 0) return;
        const alive = new Set();
        for (const e of w.all("enemy_unit")) if (e.l6 === "p") alive.add(e.l6g);
        L.patrolsLeft = alive.size;
        if (alive.size > 0) return;
        L.phase = 1; L.p1 = L.t;
        for (const t of w.all("torre")) if (t.locked) t.locked = 2;
        say(w, "dialogo_6_2");
        return;
      }
      // le torri riparate oltre unlockAt: del giocatore
      if (L.t % 10 === 0) {
        for (const t of w.all("torre")) {
          if (t.locked !== 2 || t.life < t.slife * LV6.unlockAt) continue;
          t.locked = 0;
          L.towersOk++; g.towersLocked = Math.max(0, g.towersLocked - 1);
          L.msg = [t.x, t.y];
        }
        // il messaggio della torre recuperata (l'ultima), quando non ce n'e'
        // un altro aperto: sopra un dialogo della regia lo copriva
        if (L.msg && !(dialogOpen(w) && !w.exists("dialogo_6_5"))) { say(w, "dialogo_6_5", L.msg, true); L.msg = null; }
      }
      // incursioni dalle caserme della base nemica (finche' ce ne sono)
      const since = L.t - L.p1;
      if (since >= (L.raid + 1) * LV6.raidEvery) {
        const n = LV6.raidN[L.raid % LV6.raidN.length];
        L.raid++;
        const cs = [...w.all("enemy_caserma")];
        for (let k = 0; k < n && cs.length; k++) {
          const c = cs[k % cs.length];
          const e = w.create(RAID[(L.raid + k) % RAID.length], c.x + (k % 3) * 50 - 50, c.y + 130);
          freeSpawnEnemy(e, w);
          Object.assign(e, { l6: "r", road: LV6.raidRoute.map(([x, y]) => [x, y]), defender: 0, warwork: 0 });
          walk(i, e, 0);
        }
      }
      // gli incursori arrivati e fermi: verso l'alleato piu' vicino (entro
      // raidHunt px: la base del giocatore e' dall'altra parte del fiume)
      if (L.t % 60 === 0) {
        for (const e of w.all("enemy_unit")) {
          if (e.l6 !== "r" || e.road || e.action !== 0 || e.role === 31) continue;
          const t = allyTarget(w, e.x, e.y);
          if (!t || Math.hypot(t.x - e.x, t.y - e.y) > LV6.raidHunt) continue;
          e.action = 1; e.warwork = 1; e.dirox = t.x; e.diroy = t.y; e.alarm.set(0, 15);
        }
      }
      // fase 1: il conto alla rovescia e i rinforzi
      if (L.phase === 1) {
        L.left = Math.max(0, LV6.prep - since);
        if (since >= (L.reinf + 1) * LV6.reinfEvery && L.left > 0) {
          L.reinf++;
          const c = w.nearest(LV6.reinfAt[0], LV6.reinfAt[1], "centro"), [rx, ry] = c ? [c.x, c.y + 330] : LV6.reinfAt;
          LV6.reinf.forEach((obj, k) => {
            const u = w.create(obj, rx - 90 + k * 60, ry);
            freeSpawnEnemy(u, w); // un posto libero (vale per qualunque istanza)
            p.occupy(u);
          });
          say(w, "dialogo_6_4", [rx, ry], true);
        }
        if (L.left > 0) return;
        L.phase = 2;
        const col = routes(w, "colonna")[0];
        L.colRoute = col ? clipRoute(col.pts, w.roomW, w.roomH, LV6.margin) : [[LV6.margin, 2560], [LV6.passX + 200, 3800]];
        L.colAt = L.t;
        say(w, "dialogo_6_6", L.colRoute[0]);
      }
      // fase 2: la colonna, una fila alla volta dall'entrata
      const R = L.colRoute;
      if (L.col < LV6.columnRows && L.t >= L.colAt + L.col * LV6.columnEvery) {
        const [ex, ey] = R[0], [nx, ny] = R[1];
        const d = Math.hypot(nx - ex, ny - ey) || 1, px = -(ny - ey) / d, py = (nx - ex) / d; // di traverso
        LV6.columnRow.forEach((obj, k) => {
          const off = (k - (LV6.columnRow.length - 1) / 2) * 55;
          const e = w.create(obj, ex + px * off, ey + py * off);
          freeSpawnEnemy(e, w);
          Object.assign(e, { l6: "c", road: R.map(([x, y]) => [x, y]), noFire: 1, defender: 0, warwork: 0, pace: LV6.columnPace });
          walk(i, e, 1);
        });
        L.col++;
      }
      // passati il ponte: escono dalla mappa
      let left = 0;
      for (const e of [...w.all("enemy_unit")]) {
        if (e.l6 !== "c") continue;
        if (e.x > LV6.passX) { L.passed++; w.destroy(e); continue; }
        left++;
      }
      L.colLeft = left + (LV6.columnRows - L.col) * LV6.columnRow.length;
      if (L.passed > L.max) {
        g.gameover = 1; L.lost = 1;
        w.create("gameover_manager", 0, 0);
        return;
      }
      if (L.colLeft === 0) {
        g.victory = 1;
        w.create("victory_manager", 0, 0);
      }
    },
  };
}
