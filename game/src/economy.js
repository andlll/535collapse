// [§9.44, decisione dell'autore] L'economia del nemico, nei livelli con un
// centro nemico (enemy_centro): i livelli 1-3 restano con le ondate a tempo.
//
// enemy_omino: il lavoratore nemico. E' il civile del giocatore
// (civilians.js, omino) con la fazione nemica: raccoglie legno, oro, pietra
// e cibo (dai campi nemici, enemy_campo) e li porta ai depositi nemici
// (enemy_magazza: centro e magazzino; enemy_barn: centro e mulino), nelle
// scorte del nemico (global.en). Non si comanda: gli ordini li da' la regia
// (enemy_eco). Si vede come le unita' nemiche (nebbia); colpito, scappa
// verso il centro. [§9.49] Gli sprite sono quelli dell'autore (b_ow11...,
// nuovi/sprites/omino_blu): le animazioni del civile scelgono lo sprite
// alleato (ow11...), qui si disegna il suo corrispondente b_.
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
// [§9.46] Unica eccezione: un magazzino o un mulino nuovo dove si lavora
// senza un deposito abbastanza vicino.

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
    // §9.50, regia di attacco e difesa
    firstAttack: 0,                              // passi (60 al secondo) prima che possa partire il primo attacco
    attackGrow: 0,                               // soldati in piu' richiesti a ogni ondata (fino al tetto army)
    attackEvery: 0,                              // passi minimi fra un'ondata e l'altra
    defendR: 600,                                // un alleato entro tanti px da un edificio nemico: la base si difende
    startWorkers: 0,                             // §9.52: lavoratori che nascono col centro, se non ce ne sono
    repairers: 2,                                // lavoratori per edificio da riparare
    builders: 3,                                 // lavoratori al cantiere
    rebuild: true,                               // ricostruisce gli edifici persi
    newDeposits: 4,                              // §9.46: magazzini e mulini nuovi, al massimo, in una partita
    safe: 400,                                   // niente riparazioni con un alleato entro tanti px
    // §9.76
    armyEco: false,                              // il tetto army conta solo i soldati della regia (non quelli della mappa)
    stoneWork: true,                             // ripara e ricostruisce anche gli edifici di pietra
  },
  // [Decisione dell'autore] livello 4: solo ricostruzione degli edifici
  // persi (e riparazioni), niente edifici nuovi; il resto da tarare con la
  // mappa
  // [§9.52, decisioni dell'autore] la base sud, col centro che mette la
  // regia del livello (levels.js, LV4); gli attacchi partono solo a ponte
  // riparato (global.en.hold), crescenti ma non troppo
  // [§9.57, richiesta dell'autore] con la fattoria di partenza (startFarm,
  // LV4.farm: un mulino e tre campi): il cibo e' la risorsa piu' sicura della base sud
  // (pochi alberi e una miniera, sul bordo della mappa)
  // [§9.59, richiesta dell'autore] altri lavoratori, senza valanga: fino a 9
  // (non 6), uno ogni 30 s (non 17)
  lvl04: { startWorkers: 4, start: { food: 200, wood: 200, gold: 100, stone: 0 }, army: 10,
           attackAt: 4, attackGrow: 1, attackEvery: 9000, mix: { wood: 2, gold: 2, food: 3, stone: 1 },
           workers: 9, workerTime: 1800 },
  // [§9.76, decisioni dell'autore] livello 5: economia bilanciata, al piu'
  // 10 lavoratori (4 gia' attorno al centro), una grande riserva di pietra
  // (paga le macchine d'assedio: la regia del livello, levels.js) che non
  // si usa per riparare o ricostruire gli edifici di pietra; il presidio
  // della citta' e' quello della mappa, le ondate le fa la regia (army
  // conta solo i suoi soldati): la prima a 4 minuti, poi ogni 3, da 4
  // soldati e uno in piu' ogni volta. Da tarare giocando
  lvl05: { startWorkers: 4, workers: 10, start: { food: 300, wood: 300, gold: 200, stone: 3000 },
           mix: { wood: 3, gold: 2, food: 3, stone: 0 }, army: 12, armyEco: true, stoneWork: false,
           attackAt: 4, attackGrow: 1, firstAttack: 4 * 3600, attackEvery: 3 * 3600 },
};
const UNIT_TIME = 1200;  // passi per un soldato: come caserma e stalla alleate (12 x 100)
const RANGE = 1600;      // px dal deposito nemico entro cui si va a lavorare
const SEARCH = 3000;     // §9.46: senza risorse entro RANGE, le piu' vicine entro tanti px
const FAR = 900;         // §9.46: risorsa (o campo) piu' lontana di cosi' dal deposito: un deposito nuovo
const EVERY = 20;        // ogni quanti passi la regia guarda
const FLEE = 600;        // passi di fuga, senza nuovi lavori
const SKIN = "b_";       // §9.49: prefisso degli sprite del lavoratore nemico
const STUCK_T = 120;     // §9.57: passi in cammino senza avanzare di STUCK_D px: bloccato
const STUCK_D = 24;
const AVOID = 1800;      // §9.57: passi in cui il bloccato non torna alla stessa risorsa
const CROWD = 300;       // §9.57: px in piu' per ogni compagno gia' sulla stessa risorsa (legno, pietra)

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

// [§9.57, segnalazione dell'autore] Nel livello 4 i lavoratori nemici
// restavano a lungo col passo del cammino senza muoversi: le poche risorse
// vicine alla base sud stanno sul bordo della mappa (posti attorno alla
// miniera e agli alberi fuori mano o gia' occupati) e ci andavano tutti
// insieme, avanti e indietro contro un compagno al lavoro. Chi cammina
// (azione 1, non in coda al proprio posto) senza avanzare di STUCK_D px per
// STUCK_T passi lascia il lavoro e il posto prenotato e si ferma: la regia
// gli da' un altro lavoro, non alla stessa risorsa per AVOID passi.
function watchStuck(i, w, p) {
  const now = w._stepNo;
  if (i.action !== 1 || i.queueWait || i.fleeUntil > now) { i.prog = null; return; }
  const h = i.prog;
  if (!h || Math.hypot(i.x - h.x, i.y - h.y) >= STUCK_D) { i.prog = { x: i.x, y: i.y, t: now }; return; }
  if (now - h.t < STUCK_T) return;
  i.prog = null;
  const kind = jobOf(i);
  const res = kind && kind !== "food" ? w.nearest(...workAt(i, kind), RES[kind]) : null;
  if (res) i.avoid = { id: res.id, until: now + AVOID };
  if (i.spotRef && i.spotRef.owner === i) i.spotRef.owner = null;
  i.spotRes = null; i.spotRef = null; i.spotQ = false;
  for (const k of ["woodwork", "goldwork", "stonework", "foodwork", "buildwork", "repairwork", "fieldwork"]) i[k] = 0;
  i.depositTo = null;
  i.action = 0; i.step = 0; i.speed = 0;
  p.occupy(i);
  w.g.en.idle += 1;
}
const workAt = (o, kind) => (kind === "wood" ? [o.woodx, o.woody] : kind === "gold" ? [o.goldx, o.goldy] : [o.stonex, o.stoney]);

export function enemyOmino(p) {
  const base = omino(p);
  return {
    ...base,
    create(i, w) {
      if (!w.g.en) w.g.en = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, idle: 0 };
      base.create(i, w);
      i.visible = false;
      i.fleeUntil = 0;
    },
    step(i, w) {
      visibility(i, w);
      if (i.hit === 1 && !(i.fleeUntil > w._stepNo)) flee(i, w, p);
      const back = i.woodwork === 2 || i.stonework === 2;
      base.step(i, w);
      if (!i.alive) return;
      // [§9.57] consegnato, il civile torna all'albero (o alla pietra) piu'
      // vicino (civilians.js, depositStep): il nemico sceglie come la regia,
      // senza accalcarsi
      if (back && (i.woodwork === 1 || i.stonework === 1)) {
        const kind = i.woodwork === 1 ? "wood" : "stone", [x, y] = workAt(i, kind);
        const t = targetFor(w, i, kind, false, [...w.all("enemy_omino")]);
        if (t && (t.x !== x || t.y !== y)) orderWork(w, p, i, kind, t);
      }
      watchStuck(i, w, p);
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
    // §9.49: lo sprite nemico al posto di quello alleato scelto dalle
    // animazioni (stessa maschera di collisione: quella dell'alleato)
    draw(i, w, d) {
      if (!i.sprite_index) return;
      const n = w.assets.sprites[SKIN + i.sprite_index] ? SKIN + i.sprite_index : i.sprite_index;
      d.spriteExt(n, i.image_index, i.x, i.y, i.image_xscale, i.image_yscale, i.image_angle, i.image_blend, i.image_alpha);
    },
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
// deposito nemico ([§9.46] se non ce ne sono, o non c'e' un deposito, e si
// possono fare depositi nuovi: la piu' vicina al lavoratore entro SEARCH)
// deposito nemico (per il cibo: un campo nemico libero), o null.
// [§9.57] Un albero o una pietra contano CROWD px in piu' per ogni compagno
// che ci lavora gia' (si spargono invece di accalcarsi sullo stesso); la
// risorsa da cui il lavoratore si e' appena bloccato (avoid) solo se non
// ce ne sono altre.
function targetFor(w, i, kind, wide, workers = []) {
  if (kind === "food") {
    for (const c of w.all("enemy_campo")) if (c.foodwork === 0) return c;
    return null;
  }
  const dep = w.nearest(i.x, i.y, "enemy_magazza");
  const av = i.avoid && i.avoid.until > w._stepNo ? i.avoid.id : null;
  const crowd = (r) => {
    if (kind === "gold") return 0; // la miniera ha i suoi posti (civilians.js, resSpot)
    let n = 0;
    for (const o of workers) {
      if (o === i || jobOf(o) !== kind) continue;
      const [x, y] = workAt(o, kind);
      if (Math.abs(x - r.x) < 1 && Math.abs(y - r.y) < 1) n++;
    }
    return n * CROWD;
  };
  let best = null, bd = Infinity, far = null, fd = Infinity, avoided = null;
  for (const r of w.all(RES[kind])) {
    if (r.id === av) { avoided = r; continue; }
    const di = Math.hypot(r.x - i.x, r.y - i.y);
    if (dep && Math.hypot(r.x - dep.x, r.y - dep.y) <= RANGE) { const c = di + crowd(r); if (c < bd) { bd = c; best = r; } }
    else if (wide && di < SEARCH && di < fd) { fd = di; far = r; }
  }
  return best || far || avoided;
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
  if (!en || !REBUILD[i.object] || i.noEco === 1 || !w.exists("enemy_eco")) return; // §9.52: non della regia
  if (i.pietra === 1 && !ecoOf(w).stoneWork) return; // §9.76: di pietra, perso per sempre
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

// Paga e apre il cantiere di P in spot (togliendo le rovine sotto)
function placeCantiere(w, P, spot, en) {
  pay(en, P.cost);
  for (const r of spot.ruins) w.destroy(r);
  w.create("enemy_cantiere", spot.x, spot.y, { init: (f) => {
    Object.assign(f, { target: P.o, slife: P.slife, rate: P.rate, phases: P.phases, solid: P.solid });
    f.sprite_index = P.sprite; f.mask_index = P.mask;
  } });
}

// [§9.46, richiesta dell'autore] I depositi nuovi: l'unica eccezione al
// "niente edifici nuovi". Un magazzino se un raccoglitore lavora a una
// risorsa senza deposito (centro o magazzino) entro FAR; un mulino se un
// campo nemico non ha un granaio (centro o mulino) entro FAR. Non se lo
// stesso deposito e' gia' fra quelli persi (lo rifa' la ricostruzione).
function depositNeed(w, workers, lost) {
  const lostHas = (o) => lost.some((L) => L.o === o);
  const far = (x, y, dep) => { const d = w.nearest(x, y, dep); return !d || Math.hypot(d.x - x, d.y - y) > FAR; };
  if (!lostHas("enemy_magazzino")) {
    for (const o of workers) {
      const j = jobOf(o);
      if (!j || j === "food") continue;
      const [x, y] = j === "wood" ? [o.woodx, o.woody] : j === "gold" ? [o.goldx, o.goldy] : [o.stonex, o.stoney];
      if (far(x, y, "enemy_magazza")) return { o: "enemy_magazzino", x, y, from: o };
    }
  }
  if (!lostHas("enemy_mulino")) {
    for (const c of w.all("enemy_campo")) if (far(c.x, c.y, "enemy_barn")) return { o: "enemy_mulino", x: c.x, y: c.y, from: c };
  }
  return null;
}

// Il posto del deposito nuovo: su anelli da 200 a 600 px attorno alla
// risorsa (o al campo), prima i punti dalla parte della base (l'edificio
// nemico piu' vicino) o di chi ci lavora; libero (site) e raggiungibile da
// un lavoratore. Al piu' 4 prove di raggiungibilita' per volta.
function findSpot(w, p, P, need, workers) {
  const ref = w.nearest(need.x, need.y, "enemy_build") || need.from;
  const o = need.from.object === "enemy_omino" ? need.from : w.nearest(need.x, need.y, "enemy_omino");
  let tries = 4;
  for (let r = 200; r <= 600; r += 50) {
    const pts = [];
    for (let k = 0; k < 16; k++) {
      const x = Math.round(need.x + r * Math.cos(k * Math.PI / 8)), y = Math.round(need.y + r * Math.sin(k * Math.PI / 8));
      if (x > 100 && y > 100 && x < w.roomW - 100 && y < w.roomH - 100) pts.push({ x, y });
    }
    pts.sort((a, b) => Math.hypot(a.x - ref.x, a.y - ref.y) - Math.hypot(b.x - ref.x, b.y - ref.y));
    for (const pt of pts) {
      const ruins = site(w, pt, P);
      if (!ruins) continue;
      if (tries-- <= 0) return null;
      const f = p.goalField(pt.x, pt.y, true);
      const gx = Math.floor(o.x / 32), gy = Math.floor(o.y / 32);
      if (p.fieldAt(f, gx, gy) === -1 && !p.escapeCell(f, gx, gy, 2)) continue;
      return { ...pt, ruins };
    }
  }
  return null;
}

// enemy_cantiere: il cantiere nemico. Lo crea la regia (enemy_eco) con
// l'edificio da rifare (target), sprite, maschera, vita e fasi del
// cantiere alleato corrispondente (decisione dell'autore: gli sprite dei
// cantieri nemici sono quelli alleati); i lavoratori nemici lo costruiscono come
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

// [§9.57, richiesta dell'autore] La fattoria di partenza, gia' finita: un
// mulino e dei campi nei punti di `farm` ({ mill: [x, y], fields: [[x, y],
// ...] }, levels.js). Se un punto non va, il piu' vicino che va su anelli
// attorno (fino a 300 px): libero (site), dentro la mappa con un margine,
// col bordo inferiore raggiungibile dal centro `c`.
export function startFarm(w, p, c, farm) {
  const reach = p.goalField(c.x, c.y + 200, true);
  const ok = (o, x, y) => {
    const ob = w.objects[o], M = 120;
    if (x < M || y < M || x > w.roomW - M || y > w.roomH - M) return false;
    if (!site(w, { x, y }, { mask: ob.mask, sprite: ob.sprite })) return false;
    const bb = w.bbox({ x, y, mask_index: ob.mask, sprite_index: ob.sprite, image_xscale: 1, image_yscale: 1, image_angle: 0, image_index: 0 });
    if (!bb) return false;
    const gy = Math.floor(bb[3] / 32) + 1;
    for (let gx = Math.floor(bb[0] / 32) - 1; gx <= Math.floor(bb[2] / 32) + 1; gx++) if (p.fieldAt(reach, gx, gy) !== -1) return true;
    return false;
  };
  const near = (o, [x0, y0]) => {
    if (ok(o, x0, y0)) return { x: x0, y: y0 };
    for (let r = 40; r <= 300; r += 40) {
      for (let k = 0; k < 16; k++) {
        const x = Math.round(x0 + r * Math.cos(k * Math.PI / 8)), y = Math.round(y0 + r * 0.6 * Math.sin(k * Math.PI / 8));
        if (ok(o, x, y)) return { x, y };
      }
    }
    return null;
  };
  for (const [o, pts] of [["enemy_mulino", [farm.mill]], ["enemy_campo", farm.fields]]) {
    for (const pt of pts) {
      const at = near(o, pt);
      if (!at) continue;
      const b = w.create(o, at.x, at.y);
      if (w.objects[o].solid) p.markInstance(b, 1000);
    }
  }
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
        g.en.since = w._stepNo; // §9.50: per firstAttack
        g.en.wave = 0;
        // [§9.52] i lavoratori di partenza, attorno al centro
        const c = w.all("enemy_centro").next().value, n = ecoOf(w).startWorkers;
        if (c && n && !w.exists("enemy_omino")) {
          for (let k = 0; k < n; k++) freeSpawnEnemy(w.create("enemy_omino", c.x - 90 + k * 60, c.y + 190), w);
        }
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
      const material = (b) => (b.legno === 1 && en.wood > 0) || (b.pietra === 1 && en.stone > 0 && E.stoneWork); // §9.76
      for (const o of workers) {
        const b = o.repB;
        if (!b) continue;
        if (o.action !== 7 && !o.repairwork) { o.repB = null; continue; }
        if (o.action === 7 && (!b.alive || b.life >= b.slife || !material(b) || danger(b))) {
          o.action = 0; o.repairwork = 0; o.repB = null; o.step = 0; o.speed = 0; en.idle += 1;
        }
      }
      // [§9.46] un deposito nuovo (magazzino o mulino) se non ce n'e' uno
      // abbastanza vicino a dove si lavora; poi la ricostruzione: il primo
      // edificio perso (in ordine), se si puo' pagare e il posto e' libero.
      // Un cantiere alla volta.
      const lost = E.rebuild ? (en.lost || []) : [];
      lost.sort((a, b) => REBUILD[a.o].prio - REBUILD[b.o].prio);
      let keep = {};
      if (!w.exists("enemy_fondamenta") && workers.length) {
        const need = E.newDeposits > (en.newDeposits || 0) ? depositNeed(w, workers, lost) : null;
        const P = need && plan(w, need.o);
        const spot = P && canPay(en, P.cost) ? findSpot(w, p, P, need, workers) : null;
        if (spot) {
          placeCantiere(w, P, spot, en);
          en.newDeposits = (en.newDeposits || 0) + 1;
        } else if (need) keep = P.cost;
        else if (lost.length) {
          const L = lost[0], P2 = plan(w, L.o);
          const ruins = canPay(en, P2.cost) ? site(w, L, P2) : null;
          if (ruins) {
            lost.shift();
            placeCantiere(w, P2, { x: L.x, y: L.y, ruins }, en);
          } else keep = P2.cost; // si mette da parte per lui
        }
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
        if (b.noEco === 1 || b.life >= b.slife || !material(b) || danger(b)) continue;
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
          const t = targetFor(w, o, kind, E.newDeposits > (en.newDeposits || 0), workers);
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
      let army = (E.armyEco ? soldiers(w).filter((e) => e.eco === 1) : soldiers(w)).length; // §9.76: armyEco
      const enough = n >= E.workers || !c;
      for (const b of [...w.all("enemy_caserma"), ...w.all("enemy_stalla")]) {
        if (b.noEco === 1) continue; // §9.52: un'altra base (la regia del livello)
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
      // [§9.50] difesa: un alleato vicino a un edificio nemico (entro
      // defendR) e i soldati della regia in attesa accorrono tutti, non solo
      // quelli che lo vedono (entro 400 px, enemies.js); andato via, restano
      // in attesa dove sono
      const army2 = soldiers(w).filter((e) => e.eco === 1 && !e.retreat); // §9.76: non chi si ritira (regia del livello)
      let intruder = null;
      for (const b of w.all("enemy_build")) {
        if (b.noEco === 1) continue;
        const a = w.nearest(b.x, b.y, "ally_unit");
        if (a && Math.hypot(a.x - b.x, a.y - b.y) < E.defendR) { intruder = a; break; }
      }
      // (col flow field dei nemici e il ruolo 31, come le ondate: diritti
      // restavano dietro gli edifici; arrivati, ruolo 32, tornano in attesa)
      let dff = null;
      for (const e of army2) {
        if (e.defending && e.role === 32) e.role = 30;
        if (e.role !== 30 && !(e.defending && e.role === 31)) continue;
        if (intruder && (e.action === 0 || e.defending)) {
          dff = dff || p.flowField(p.goalField(intruder.x, intruder.y, true));
          if (e.action !== 1) e.alarm.set(0, irandomRange(12, 15));
          e.action = 1; e.warwork = 1; e.dirox = intruder.x; e.diroy = intruder.y; e.defending = 1;
          e.role = 31; e.flow_field = dff;
        } else if (!intruder && e.defending) { e.defending = 0; if (e.role === 31) e.role = 30; }
      }
      // all'attacco, raccolti abbastanza soldati in attesa (attackAt, piu'
      // attackGrow a ogni ondata, fino al tetto), non prima di firstAttack
      // e a distanza di attackEvery dall'ondata prima; arrivati e fermi
      // (ruolo 32), verso il bersaglio alleato piu' vicino
      const waiting = army2.filter((e) => e.role === 30 && e.action === 0);
      const need = Math.min(E.attackAt + (en.wave || 0) * E.attackGrow, E.army);
      const ready = !en.hold && now - (en.since || 0) >= E.firstAttack && now >= (en.nextAttack || 0); // hold: §9.52
      const t = home && !intruder && E.attackAt > 0 && ready && waiting.length >= need ? attackTarget(w, home) : null;
      if (t) {
        const ff = p.flowField(p.goalField(t.x, t.y, true));
        for (const e of waiting) {
          e.action = 1; e.flow_field = ff; e.dirox = t.x; e.diroy = t.y; e.role = 31;
          e.alarm.set(0, irandomRange(12, 15));
        }
        en.wave = (en.wave || 0) + 1;
        en.nextAttack = now + E.attackEvery;
      }
      for (const e of army2) {
        if (e.role !== 32 || e.action !== 0 || e.defending) continue;
        const t2 = attackTarget(w, e);
        if (!t2) continue;
        e.action = 1; e.dirox = t2.x; e.diroy = t2.y;
        e.alarm.set(0, irandomRange(12, 15));
      }
    },
  };
}
