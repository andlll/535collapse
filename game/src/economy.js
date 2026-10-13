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
//
// [§9.45, passo 2] Con abbastanza lavoratori caserme e stalle nemiche fanno
// soldati pagandoli con le scorte nemiche (i costi delle unita' alleate),
// fino a un tetto; raccolti abbastanza soldati in attesa, partono
// all'attacco dell'edificio alleato piu' vicino alla base. I lavoratori
// riparano gli edifici danneggiati (legno o pietra, come gli alleati) quando
// non ci sono alleati vicini. [Decisione dell'autore, campagna] Il nemico
// non fa edifici nuovi: ricostruisce solo quelli che ha perso, nello stesso
// punto (enemy_cantiere), uno alla volta; il centro no: perso e' perso.

import { omino, orderWork } from "./civilians.js";
import { campo, FAM } from "./buildings.js";
import { fireOrder } from "./siege.js";
import { fireStep, fireStop } from "./effects.js";
import { PRODUCERS } from "./production.js";
import { freeSpawnEnemy } from "./enemies.js";
import { irandomRange } from "./gm.js";

export const ECO = {
  default: {
    workers: 6,                                  // lavoratori da tenere
    start: { food: 200, wood: 100, gold: 50, stone: 0 }, // scorte iniziali
    mix: { wood: 3, gold: 2, food: 2, stone: 1 },        // ripartizione del lavoro
    workerCost: 50,                              // cibo per lavoratore
    workerTime: 1000,                            // passi per farne uno (come il centro alleato)
    // §9.45
    army: 12,                                    // soldati da tenere (i nemici che non sono lavoratori)
    troops: ["enemy_warrior", "enemy_picchiere", "enemy_arciere"], // la caserma, a turno (la stalla: cavalieri)
    attackAt: 8,                                 // soldati in attesa con cui si parte all'attacco (0: mai)
    repairers: 2,                                // lavoratori per edificio da riparare
    builders: 3,                                 // lavoratori al cantiere
    rebuild: true,                               // ricostruisce gli edifici persi
    safe: 400,                                   // niente riparazioni con un alleato entro tanti px
  },
  // [Decisione dell'autore] livello 4: solo ricostruzione degli edifici
  // persi (e riparazioni), niente edifici nuovi; il resto da tarare con la
  // mappa
  lvl04: {},
};
const UNIT_TIME = 1200;  // passi per un soldato: come caserma e stalla alleate (12 x 100)
const RANGE = 1600;      // px dal deposito nemico entro cui si va a lavorare
const EVERY = 20;        // ogni quanti passi la regia guarda
const FLEE = 600;        // passi di fuga, senza nuovi lavori
const TINT = 0xffc8a0;   // azzurro (BGR), sullo sprite del civile alleato

export const ecoOf = (w) => ({ ...ECO.default, ...(ECO[w.room] || {}) });

const canPay = (en, cost, keep = {}) => Object.entries(cost).every(([r, v]) => en[r] - (keep[r] || 0) >= v);
const pay = (en, cost) => { for (const [r, v] of Object.entries(cost)) en[r] -= v; };

// I costi dei soldati: quelli delle unita' alleate (production.js)
const unitCost = (o) => ({
  enemy_warrior: PRODUCERS.caserma.units[1].cost, enemy_picchiere: PRODUCERS.caserma.units[2].cost,
  enemy_arciere: PRODUCERS.caserma.units[3].cost, enemy_cavaliere: PRODUCERS.stalla.units[1].cost,
})[o];

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
    step(i, w) {
      if (i.life <= 0) lostBuilding(w, i); // §9.45
      base.step(i, w);
    },
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

// ------------------------------------------------- ricostruzione (§9.45)

// Gli edifici che il nemico ricostruisce: in ordine (prio), con il cantiere
// e il costo dell'edificio alleato corrispondente (buildings.js FAM, gli
// oggetti *_fond). [Decisione dell'autore] Il centro non si ricostruisce
// mai: perso e' perso.
const REBUILD = {
  enemy_magazzino: { prio: 1, fam: "magazzino" },
  enemy_mulino: { prio: 1, fam: "barn" },
  enemy_campo: { prio: 2, fam: "campo", slife: 100, rate: 5 },
  enemy_caserma: { prio: 3, fam: "caserma" },
  enemy_stalla: { prio: 4, fam: "stalla" },
  enemy_torre: { prio: 5, fam: "torre" },
  enemy_chiesa: { prio: 6, fam: "chiesa" },
  enemy_house: { prio: 7, fam: "casa" },
  enemy_castello: { prio: 8, fam: "castello" },
};
const RUINS = ["casaruin", "magruin", "barnruin", "casruin", "stalruin", "ccruin", "chiesaruin", "castelloruin", "torreruin"];

// Un edificio nemico distrutto (enemybuild.js, ranged.js, il campo qui
// sotto): da ricostruire, se c'e' l'economia
export function lostBuilding(w, i) {
  const en = w.g.en;
  if (!en || !REBUILD[i.object] || !w.exists("enemy_eco")) return;
  (en.lost || (en.lost = [])).push({ o: i.object, x: i.x, y: i.y });
}

function plan(w, o) {
  const R = REBUILD[o], F = FAM[R.fam], fo = w.objects[R.fam + "_fond"], ob = w.objects[o];
  const P = { o, cost: F.cost, slife: R.slife || F.slife, rate: R.rate || 0, phases: F.phases || [],
              sprite: fo.sprite, mask: fo.mask, solid: ob.solid };
  if (o === "enemy_house") { const t = irandomRange(1, 6); P.sprite = "c" + t + "f"; P.mask = "c" + t + "m"; }
  return P;
}

// Il posto e' libero: nessun solido (le rovine non contano: si tolgono) e
// nessuna unita' sotto la maschera del cantiere. Ritorna le rovine da
// togliere, o null se il posto e' occupato.
function site(w, L, P) {
  const f = { x: L.x, y: L.y, mask_index: P.mask, sprite_index: P.sprite, image_xscale: 1, image_yscale: 1, image_angle: 0, image_index: 0 };
  const bb = w.bbox(f);
  if (!bb) return null;
  const ruins = [];
  const block = w._eachNear(bb, (o) => {
    if (!o.alive || !w.overlap(f, f.x, f.y, o)) return null;
    if (RUINS.includes(o.object)) { ruins.push(o); return null; }
    return o.solid || w.is(o, "ally_unit") || w.is(o, "enemy_unit") || w.is(o, "enemy_build") ? o : null;
  });
  return block ? null : ruins;
}

// enemy_cantiere: il cantiere nemico. Lo crea la regia (enemy_eco) con
// l'edificio da rifare (target), sprite, maschera, vita e fasi del
// cantiere alleato corrispondente; i lavoratori nemici lo costruiscono come
// i civili un ally_fondamenta (civilians.js, azione 6; rate: vita a colpo).
// Finito, al suo posto l'edificio. I fanti del giocatore gli danno fuoco
// (clic destro) come agli edifici di legno; bruciato, il nemico lo rifara'.
export function enemyCantiere(p) {
  return {
    create(i, w) {
      Object.assign(i, { life: 1, fase: 0, fondazione: 1, legno: 0, pietra: 0, hit: 0, onfire: 0, firestarted: 0,
                         selected: 0, hover: 0 });
      if (i.solid) p.markInstance(i, 1000);
      i.depth = -i.y;
      i.visible = false;
      i.alarm.set(1, 70);
    },
    alarm1(i) { i.alarm.set(1, 70); if (i.onfire === 1) i.life -= 1; },
    alarm2(i) { i.hit = 0; },
    destroy(i, w) { if (i.solid) p.markInstance(i, 1); fireStop(i, w); },
    step(i, w) {
      const seen = i.visible;
      visibility(i, w);
      if (seen) i.visible = true; // come gli edifici: una volta visto resta visibile
      fireStep(i, w, "enemy_cantiere");
      if (i.life <= 0) {
        lostBuilding(w, { object: i.target, x: i.x, y: i.y });
        w.destroy(i);
        return;
      }
      (i.phases || []).forEach(([t, spr], k) => {
        if (i.fase === k && i.life > i.slife * t) { i.fase = k + 1; w.swapSprite(i, spr); }
      });
      if (i.life >= i.slife) {
        const { x, y, target, sprite_index: spr, visible } = i;
        w.destroy(i);
        const b = w.create(target, x, y);
        if (b.solid) p.markInstance(b, 1000);
        w.swapSprite(b, b.sprite_index, spr);
        if (visible) b.visible = true;
      }
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    rightReleased: fireOrder,
    drawEnd(i, w, d) {
      if (i.visible && (i.hover === 1 || i.hit === 1)) d.lifeBar(i.x - 25, i.y - 82, i.life / i.slife, 0xff0000);
    },
  };
}

// --------------------------------------------------------------- regia

// Un lavoratore da mandare a un lavoro vicino a t: fermo, se no il
// raccoglitore piu' vicino (non chi costruisce, ripara o scappa)
function pull(w, workers, t, now) {
  let best = null, bd = Infinity;
  for (const pass of [0, 1]) {
    for (const o of workers) {
      if (o.fleeUntil > now || o.buildwork || o.action === 6 || o.repairwork || o.action === 7) continue;
      if (pass === 0 ? o.action !== 0 : !jobOf(o)) continue;
      const d = Math.hypot(o.x - t.x, o.y - t.y);
      if (d < bd) { bd = d; best = o; }
    }
    if (best) return best;
  }
  return null;
}

const soldiers = (w) => [...w.all("enemy_unit")].filter((e) => e.object !== "enemy_omino");

// Il bersaglio di un attacco: l'edificio alleato piu' vicino alla base
// nemica (il centro, o un edificio nemico), se no l'unita' alleata
function attackTarget(w, from) {
  return w.nearest(from.x, from.y, "ally_build") || w.nearest(from.x, from.y, "ally_unit");
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
      const home = w.all("enemy_centro").next().value || w.all("enemy_build").next().value;
      // riparazioni finite (o senza piu' materiale, o con alleati vicini):
      // il lavoratore si ferma e torna disponibile
      const danger = (b) => { const a = w.nearest(b.x, b.y, "ally_unit"); return !!a && Math.hypot(a.x - b.x, a.y - b.y) < E.safe; };
      const material = (b) => (b.legno === 1 && en.wood > 0) || (b.pietra === 1 && en.stone > 0);
      for (const o of workers) {
        const b = o.repB;
        if (!b) continue;
        if (o.action !== 7 && !o.repairwork) { o.repB = null; continue; }
        if (o.action === 7 && (!b.alive || b.life >= b.slife || !material(b) || danger(b))) {
          o.action = 0; o.repairwork = 0; o.repB = null; o.step = 0; o.speed = 0; en.idle += 1;
        }
      }
      // ricostruzione: il primo edificio perso (in ordine), se si puo' pagare
      // e il posto e' libero; un cantiere alla volta
      const lost = E.rebuild ? (en.lost || []) : [];
      lost.sort((a, b) => REBUILD[a.o].prio - REBUILD[b.o].prio);
      let keep = {};
      if (lost.length && !w.exists("enemy_fondamenta") && workers.length) {
        const L = lost[0], P = plan(w, L.o);
        const ruins = canPay(en, P.cost) ? site(w, L, P) : null;
        if (ruins) {
          pay(en, P.cost);
          lost.shift();
          for (const r of ruins) w.destroy(r);
          w.create("enemy_cantiere", L.x, L.y, { init: (f) => {
            Object.assign(f, { target: P.o, slife: P.slife, rate: P.rate, phases: P.phases, solid: P.solid });
            f.sprite_index = P.sprite; f.mask_index = P.mask;
          } });
        } else keep = P.cost; // si mette da parte per lui
      }
      // al cantiere
      for (const f of w.all("enemy_fondamenta")) {
        let n = workers.filter((o) => o.buildwork === 1 || o.action === 6).length;
        while (n < E.builders) {
          const o = pull(w, workers, f, now);
          if (!o) break;
          orderWork(w, p, o, "build", f);
          n++;
        }
      }
      // alle riparazioni
      for (const b of w.all("enemy_build")) {
        if (b.life >= b.slife || !material(b) || danger(b)) continue;
        let n = workers.filter((o) => o.repB === b).length;
        while (n < E.repairers) {
          const o = pull(w, workers, b, now);
          if (!o) break;
          orderWork(w, p, o, "repair", b);
          o.repB = b;
          n++;
        }
      }
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
      let n = workers.length;
      if (c) {
        if (c.prodUntil && now >= c.prodUntil) {
          c.prodUntil = 0;
          w.create("enemy_omino", c.x, c.y);
          n++;
        }
        if (!c.prodUntil && n < E.workers && canPay(en, { food: E.workerCost }, keep)) {
          en.food -= E.workerCost;
          c.prodUntil = now + E.workerTime;
        }
      }
      // soldati da caserme e stalle, pagando, con abbastanza lavoratori (o
      // senza centro) e sotto il tetto
      let army = soldiers(w).length;
      const enough = n >= E.workers || !c;
      for (const b of [...w.all("enemy_caserma"), ...w.all("enemy_stalla")]) {
        if (b.prodUntil && now >= b.prodUntil) {
          b.prodUntil = 0;
          const u = w.create(b.prodObj, b.x, b.y);
          u.role = 30; u.eco = 1;
          freeSpawnEnemy(u, w);
        }
        if (b.prodUntil) { army++; continue; }
        if (!enough || army >= E.army) continue;
        const obj = b.object === "enemy_stalla" ? "enemy_cavaliere" : E.troops[(b.prodK || 0) % E.troops.length];
        if (!canPay(en, unitCost(obj), keep)) continue;
        pay(en, unitCost(obj));
        b.prodK = (b.prodK || 0) + 1;
        b.prodObj = obj;
        b.prodUntil = now + UNIT_TIME;
        army++;
      }
      // all'attacco, raccolti abbastanza soldati in attesa; arrivati e
      // fermi (ruolo 32), verso il bersaglio piu' vicino
      const army2 = soldiers(w).filter((e) => e.eco === 1);
      const waiting = army2.filter((e) => e.role === 30 && e.action === 0);
      const t = home && E.attackAt > 0 && waiting.length >= E.attackAt ? attackTarget(w, home) : null;
      if (t) {
        const ff = p.flowField(p.goalField(t.x, t.y, true));
        for (const e of waiting) {
          e.action = 1; e.flow_field = ff; e.dirox = t.x; e.diroy = t.y; e.role = 31;
          e.alarm.set(0, irandomRange(12, 15));
        }
      }
      for (const e of army2) {
        if (e.role !== 32 || e.action !== 0) continue;
        const t2 = attackTarget(w, e);
        if (!t2) continue;
        e.action = 1; e.dirox = t2.x; e.diroy = t2.y;
        e.alarm.set(0, irandomRange(12, 15));
      }
    },
  };
}
