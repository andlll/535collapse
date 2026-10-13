// [§9.44, decisione dell'autore] L'economia del nemico, nei livelli con un
// centro nemico (enemy_centro): i livelli 1-3 restano con le ondate a tempo.
//
// enemy_omino: il lavoratore nemico. E' il civile del giocatore
// (civilians.js, omino) con la fazione nemica: raccoglie legno, oro, pietra
// e cibo (dai campi nemici, enemy_campo) e li porta ai depositi nemici
// (enemy_magazza: centro e magazzino; enemy_barn: centro e mulino), nelle
// scorte del nemico (global.en). Non si comanda: gli ordini li da' la regia
// (enemy_eco). Si vede come le unita' nemiche (nebbia); colpito, scappa
// verso il centro. [Provvisorio] Lo sprite e' quello del civile alleato,
// tinto d'azzurro, finche' l'autore non carica i suoi.
//
// enemy_eco: la regia, creata dalla regia dei livelli (levels.js) quando
// c'e' un centro nemico. Alla nascita da' le scorte iniziali; ogni 20 passi
// manda i lavoratori fermi alla risorsa che manca di piu' rispetto alla
// ripartizione voluta (ECO.mix), entro RANGE dal deposito nemico piu'
// vicino, e fa nascere lavoratori dal centro, pagando il cibo, fino al
// numero voluto. I numeri sono per livello (ECO[room]) o di norma.

import { omino, orderWork } from "./civilians.js";
import { campo } from "./buildings.js";
import { fireOrder } from "./siege.js";

export const ECO = {
  default: {
    workers: 6,                                  // lavoratori da tenere
    start: { food: 200, wood: 100, gold: 50, stone: 0 }, // scorte iniziali
    mix: { wood: 3, gold: 2, food: 2, stone: 1 },        // ripartizione del lavoro
    workerCost: 50,                              // cibo per lavoratore
    workerTime: 1000,                            // passi per farne uno (come il centro alleato)
  },
};
const RANGE = 1600;      // px dal deposito nemico entro cui si va a lavorare
const EVERY = 20;        // ogni quanti passi la regia guarda
const FLEE = 600;        // passi di fuga, senza nuovi lavori
const TINT = 0xffc8a0;   // azzurro (BGR), sullo sprite del civile alleato

export const ecoOf = (w) => ECO[w.room] || ECO.default;

// Visibilita' [come le unita' nemiche, enemies.js]: vicino a un alleato,
// colpito, vicino a castello o torre, o senza nebbia.
function visibility(i, w) {
  const g = w.g, n = 1 - g.night;
  const near = (obj, r) => w.nearWithin(i, obj, r + r * n, 2.01 * r);
  i.visible = near("ally_unit", 150) || near("ally_build", 200) || i.hit === 1
    || near("castello", 500) || near("torre", 500) || w.room === "menu" || g.fogville === 0;
}

// Colpito: lascia il lavoro e scappa verso il centro nemico (o l'edificio
// nemico piu' vicino), col carico; per FLEE passi la regia non lo manda a
// lavorare.
function flee(i, w, p) {
  const c = w.nearest(i.x, i.y, "enemy_centro") || w.nearest(i.x, i.y, "enemy_build");
  i.fleeUntil = w._stepNo + FLEE;
  if (!c) return;
  orderWork(w, p, i, "move", c);
}

export function enemyOmino(p) {
  const base = omino(p);
  return {
    ...base,
    create(i, w) {
      if (!w.g.en) w.g.en = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, idle: 0 };
      base.create(i, w);
      i.image_blend = TINT;
      i.visible = false;
      i.fleeUntil = 0;
    },
    step(i, w) {
      visibility(i, w);
      if (i.hit === 1 && !(i.fleeUntil > w._stepNo)) flee(i, w, p);
      base.step(i, w);
    },
    // come le unita' nemiche: col puntatore sopra il cerchio rosso; il clic
    // destro con fanti e cavalieri selezionati lo fa bersaglio (enemies.js,
    // rightReleased)
    mouseEnter(i, w) { i.hover = 1; w.g.enemyhover = 1; },
    mouseLeave(i, w) { i.hover = 0; w.g.enemyhover = 0; },
    rightReleased(i, w) {
      for (const n of ["ally_warrior", "ally_cavaliere", "ally_picchiere"]) {
        for (const u of w.all(n)) {
          if (u.selected === 1 && (u.warwork === 0 || u.warwork === 1 || u.warwork === 4)) {
            u.target_eu = i; u.warwork = 1; u.dirox = i.x; u.diroy = i.y;
          }
        }
      }
    },
    globalRightReleased() {},
    globalLeftPressed() {},
    keyboard27() {},
    drawEnd(i, w, d) {
      if (i.visible && (i.hover === 1 || i.hit === 1)) d.lifeBar(i.x - 25, i.y - 82, i.life / i.slife, 0xff0000);
    },
    drawGUI() {},
  };
}

// il campo nemico: il campo (buildings.js) dei lavoratori nemici; i fanti
// del giocatore, col clic destro, ci danno fuoco come agli edifici nemici
export function enemyCampo(p) {
  const base = campo(p);
  return {
    ...base,
    rightReleased: fireOrder,
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
  };
}

// I lavoratori sulla risorsa di ogni tipo (o in cammino verso di lei o il
// deposito)
function jobOf(o) {
  if (o.woodwork || o.action === 2) return "wood";
  if (o.goldwork || o.action === 3) return "gold";
  if (o.stonework || o.action === 5) return "stone";
  if (o.foodwork || o.action === 4) return "food";
  return null;
}

const RES = { wood: "albero", gold: "miniera_oro", stone: "stone_parent" };

// La risorsa di tipo kind piu' vicina al lavoratore, entro RANGE da un
// deposito nemico (per il cibo: un campo nemico libero), o null
function targetFor(w, i, kind) {
  if (kind === "food") {
    for (const c of w.all("enemy_campo")) if (c.foodwork === 0) return c;
    return null;
  }
  const dep = w.nearest(i.x, i.y, "enemy_magazza");
  if (!dep) return null;
  let best = null, bd = Infinity;
  for (const r of w.all(RES[kind])) {
    const d = Math.hypot(r.x - dep.x, r.y - dep.y);
    if (d > RANGE) continue;
    const di = Math.hypot(r.x - i.x, r.y - i.y);
    if (di < bd) { bd = di; best = r; }
  }
  return best;
}

export function enemyEco(p) {
  return {
    create(i, w) {
      i.sprite_index = null;
      const g = w.g;
      if (!g.en) g.en = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, idle: 0 };
      if (!g.en.started) {
        Object.assign(g.en, ecoOf(w).start);
        g.en.started = 1;
      }
    },
    step(i, w) {
      if (w._stepNo % EVERY !== 0) return;
      const E = ecoOf(w), en = w.g.en, now = w._stepNo;
      const workers = [...w.all("enemy_omino")];
      // lavori: il tipo che manca di piu' rispetto alla ripartizione
      const count = { wood: 0, gold: 0, stone: 0, food: 0 };
      for (const o of workers) { const j = jobOf(o); if (j) count[j]++; }
      const total = Object.values(E.mix).reduce((a, b) => a + b, 0);
      for (const o of workers) {
        if (o.action !== 0 || o.fleeUntil > now) continue;
        const kinds = Object.keys(E.mix).sort((a, b) =>
          (count[a] - E.mix[a] / total * workers.length) - (count[b] - E.mix[b] / total * workers.length));
        for (const kind of kinds) {
          const t = targetFor(w, o, kind);
          if (!t) continue;
          orderWork(w, p, o, kind, t);
          count[kind]++;
          break;
        }
      }
      // nuovi lavoratori dal centro, pagando il cibo
      const c = w.all("enemy_centro").next().value;
      if (!c) return;
      let n = workers.length;
      if (c.prodUntil && now >= c.prodUntil) {
        c.prodUntil = 0;
        w.create("enemy_omino", c.x, c.y);
        n++;
      }
      if (!c.prodUntil && n < E.workers && en.food >= E.workerCost) {
        en.food -= E.workerCost;
        c.prodUntil = now + E.workerTime;
      }
    },
  };
}
