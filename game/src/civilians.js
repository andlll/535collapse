// Il civile (ally_omino) e le risorse naturali: raccolta, trasporto ai
// depositi, costruzione, campi. Trascrizione evento per evento di
// src/objects/ally_omino/ e degli oggetti risorsa (albero, miniera_oro,
// pietra_grande, pietr_piccolo e i loro *_morente). Nomi originali.
//
// Lavori (variabili *work): 0 niente, 1 andare alla risorsa/al cantiere,
// 2 tornare al deposito; foodwork 6 = cercare il campo libero piu' vicino.
// action: 0 fermo, 1 in cammino, 2 taglia legna, 3 scava oro, 4 raccoglie
// cibo, 5 spacca pietra, 6 costruisce, 7 ripara, 8 semina.

import { hintOnce } from "./hints.js";
import { fireStop, seedsThrow } from "./effects.js";
import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { GRID, generateFields, scrMove, moveFlowField, mpPotentialStep, arriveIfBlocked, seesGoal, seesTarget, rallyRetry, onFormationSlot, destinationBack, rallySpot, rallyGo } from "./pathing.js";
import { phaseOf, walkCycle, firstSelected } from "./units.js";
import { meleeSpot } from "./melee.js";
import { complexOf, complexPoint, complexNear, complexField } from "./complex.js";
import { bridgeEnds, woodDue } from "./bridge.js";

const iso = (dir) => 1 - 0.36 * Math.abs(Math.sin(degtorad(dir)));
const OM = "ally_omino";

// [§9.44] La fazione del civile: l'alleato (ally_omino, del giocatore) o il
// lavoratore nemico (enemy_omino, della regia: economy.js). Stessa logica,
// altri depositi, cantieri, unita' e scorte (global.* per il giocatore,
// global.en per il nemico).
export const SIDES = {
  ally: { om: "ally_omino", unit: "ally_unit", magazza: "ally_magazza", barn: "ally_barn", fond: "ally_fondamenta",
          build: "ally_build", campo: "campo", enemy: false, player: true },
  enemy: { om: "enemy_omino", unit: "enemy_unit", magazza: "enemy_magazza", barn: "enemy_barn", fond: "enemy_fondamenta",
           build: "enemy_build", campo: "enemy_campo", enemy: true, player: false },
};
export const sideOf = (i) => (i.object === "enemy_omino" ? SIDES.enemy : SIDES.ally);
export const poolOf = (w, i) => (i.object === "enemy_omino" ? w.g.en : w.g);
const CLICKERS = ["casa_clicker", "magazzino_clicker", "barn_clicker", "campo_clicker", "chiesa_clicker",
                  "torre_clicker", "caserma_clicker", "stalla_clicker", "castello_clicker", "mura_clicker"];

function inView(w, i) {
  const c = w.cam;
  return i.x > c.x && i.x < c.x + c.w && i.y > c.y && i.y < c.y + c.h;
}

// Ricalcolo del campo verso (tx, ty) senza scr_free (blocco ripetuto in
// "arrivi a 10 di cibo" e nei Create degli edifici).
function goTo(p, i, tx, ty, freeCell = false) {
  const find = freeCell ? p.nearestFreeCell : p.findValidCellBackwards;
  const [cx, cy] = find.call(p, i.goal_field, Math.trunc(tx / GRID), Math.trunc(ty / GRID),
                             Math.trunc(i.x / GRID), Math.trunc(i.y / GRID));
  const found = p.fieldAt(i.goal_field, cx, cy) !== -1;
  i.goal_x = found ? cx * GRID : i.x;
  i.goal_y = found ? cy * GRID : i.y;
  generateFields(p, i, i.goal_x, i.goal_y);
  i.dirox = i.goal_x;
  i.diroy = i.goal_y;
}

// [Segnalazione dell'autore, §8.19] Il campo verso una risorsa (albero,
// miniera, pietra) o un deposito: la meta e' la cosa stessa, e goalField
// parte dalle celle libere del bordo dell'ostacolo vicine alla meta
// (pathing.js, _seedAround). scr_move cercava invece, in quadrati crescenti
// attorno al bersaglio, una cella raggiungibile nel campo che il civile
// aveva gia', e prendeva la prima scorrendo dall'angolo in alto a sinistra:
// in un bosco anche a 8 celle dall'albero, dall'altra parte. Di li' il
// civile andava dritto verso l'albero, con le collisioni, attraverso il
// bosco, e restava fermo o andava avanti e indietro. Un campo per meta e per
// passo, condiviso in sola lettura da chi va allo stesso posto (come quello
// del capo negli spostamenti di gruppo). Se il civile da dove e' non ci
// arriva (risorsa chiusa, l'altra riva) resta scr_move, come prima (o,
// con fallback false, il campo e la meta di prima: false).
function fieldTo(w, p, i, tx, ty, fallback = true) {
  const gx = Math.floor(tx / GRID), gy = Math.floor(ty / GRID), key = gy * p.gw + gx;
  const old = i.goal_field;
  const c = w._fieldTo, en = sideOf(i).enemy; // §9.44: il campo della fazione (porte)
  let f;
  if (c && c.step === w._stepNo && c.key === key && c.ver === p.solidVer && c.en === en) f = c.f;
  else {
    f = p.goalField(tx, ty, en);
    w._fieldTo = { step: w._stepNo, key, ver: p.solidVer, f, en };
  }
  const sx = Math.floor(i.x / GRID), sy = Math.floor(i.y / GRID);
  if (p.fieldAt(f, sx, sy) === -1 && !p.escapeCell(f, sx, sy, 2)) {
    i.goal_field = old;
    if (fallback) scrMove(p, i, tx, ty);
    return false;
  }
  i.goal_field = f;
  i.flow_field = p.flowField(f);
  i.goal_x = gx * GRID;
  i.goal_y = gy * GRID;
  return true;
}

// [§8.19] Carico del civile e deposito che lo prende: legno, oro e pietra al
// magazzino (ally_magazza: centro o magazzino), cibo al granaio (ally_barn:
// mulino o centro).
const carried = (i) => i.wood + i.gold + i.stone + i.food;
const depositKind = (i) => (i.food > 0 ? sideOf(i).barn : sideOf(i).magazza);

// --------------------------------------------------------------- civile

export function omino(p) {
  const stop = (i, w, occupy = true) => {
    i.action = 0;
    if (occupy) p.occupy(i);
    i.step = 0;
    i.speed = 0;
    poolOf(w, i).idle += 1;
  };

  return {
    // src/objects/ally_omino/Create.gml
    create(i, w) {
      const g = w.g;
      Object.assign(i, {
        selected: 0, creation: 0, foodx: 0, foody: 0, goal_x: 0, goal_y: 0, campox: 0, campoy: 0,
        woodx: 0, woody: 0, goldx: 0, goldy: 0, stonex: 0, stoney: 0, repx: 0, repy: 0,
        life: 50, slife: 50, action: 0, hit: 0, path: 0, assi: 0, step: 0, phase: 1, hov: 0, hover: 0,
        buildx: 0, buildy: 0, dc: 0, woodwork: 0, food: 0, foodwork: 0, autospeed: 0, stone: 0,
        buildwork: 0, stonework: 0, wood: 0, buildarm: 0, gold: 0, goldwork: 0, repairwork: 0, pass: 1,
        fieldwork: 0, direction: 0, flaggox: 0, flaggoy: 0,
      });
      i.scampalife = i.life;
      const P = poolOf(w, i); // §9.44
      P.idle += 1;
      i.idling = 1;
      i.idleorder = P.idle;
      P.pop += 1;
      g.order++;
      i.ordo = g.order * 6; // var rank=6
      p.findFreeSpawn(i);
      generateFields(p, i, i.x, i.y);
      i.dirox = i.x;
      i.diroy = i.y;
      p.occupy(i);
    },

    roomStart(i) { p.occupy(i); i.creation = 0; },
    alarm0: walkCycle,
    alarm1(i) { i.dc = 0; },
    alarm2: workTick,
    // Alarm_3 [C]: se alla nascita il posto e' occupato, ne nasce un altro 50
    // px piu' in la' con lo stesso lavoro e questo sparisce.
    alarm3(i, w) {
      const g = poolOf(w, i); // §9.44
      if (i.action === 0) { g.idle += 1; i.idleorder = g.idle; }
      const keep = { act: i.action, gol: i.goldwork, sto: i.stonework, woo: i.woodwork, foo: i.foodwork,
                     dix: i.dirox, diy: i.diroy };
      if (!w.placeFree(i, i.x, i.y)) {
        const n = w.create(i.object, i.x + 50, i.y - 20);
        Object.assign(n, { action: 1, goldwork: keep.gol, stonework: keep.sto, woodwork: keep.woo,
                           foodwork: keep.foo, dirox: keep.dix, diroy: keep.diy, goldx: keep.dix, goldy: keep.diy,
                           woodx: keep.dix, woody: keep.diy, stonex: keep.dix, stoney: keep.diy,
                           foodx: keep.dix, foody: keep.diy });
        n.alarm.set(0, 13);
        if (i.action === 0) g.idle -= 1;
        g.pop -= 1;
        w.destroy(i);
      }
    },
    alarm5(i) { i.hit = 0; },
    alarm8(i) { i.dirox = i.x; i.diroy = i.y; },
    alarm10: rallyOmino(p),
    stepBegin(i, w) { if (w.number("torre_placer") > 0) w.g.sele = 1; i.pass = 1; },
    step(i, w) { ominoStep(i, w, p, stop); },

    // Mouse_GlobalLeftPressed / Keyboard_Escape [C]: deseleziona se non si
    // sta cliccando un pulsante di costruzione.
    globalLeftPressed(i, w) {
      if (w.g.sele === 0 && !clickerHovered(w) && i.selected === 1) { w.g.sel -= 1; i.selected = 0; }
    },
    keyboard27(i, w) {
      if (w.g.sele === 0 && !clickerHovered(w) && i.selected === 1) { w.g.sel -= 1; i.selected = 0; }
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    globalRightReleased: rightClick,
    drawEnd: ominoDrawEnd,
    drawGUI: ominoPanel,
  };
}

function clickerHovered(w) {
  for (const n of CLICKERS) for (const c of w.all(n)) if (c.hover === 1) return true;
  return false;
}

// Mouse_GlobalRightReleased [C]: la risorsa sotto il puntatore ha gia'
// impostato il lavoro (eventi "rilascio destro sull'istanza", che vengono
// prima, world.js); qui si azzera cio' che non corrisponde e si parte.
function rightClick(i, w) {
  if (i.selected !== 1) return;
  const g = w.g;
  for (const u of w.all("ally_unit")) if (u.selected === 1) w.path.free(u);
  i.creation = 0;
  if (i.stonework === 2) i.stonework = 0;
  if (i.goldwork === 2) i.goldwork = 0;
  if (i.woodwork === 2) i.woodwork = 0;
  if (i.foodwork === 2) i.foodwork = 0;
  if (i.buildwork === 2) i.buildwork = 0;
  i.dirox = w.mouse.x;
  i.diroy = w.mouse.y;
  const at = (n) => w.positionMeeting(i.dirox, i.diroy, n);
  if (!at("miniera_oro")) i.goldwork = 0;
  if (!at("albero")) i.woodwork = 0;
  if (!at("campo")) i.foodwork = 0;
  if (!at("stone_parent")) i.stonework = 0;
  if (!at("ally_fondamenta")) i.buildwork = 0;
  if (i.action === 0) g.idle -= 1;
  if (i.action !== 0 && i.alarm.get(0) < 1) i.alarm.set(0, 13);
  if (i.action === 0) i.alarm.set(0, 13);
  i.alarm.set(8, 1200);
  i.action = 1;
  if (i.woodwork === 1) { i.woodx = i.dirox; i.woody = i.diroy; } else i.woodwork = 0;
  if (i.goldwork === 1) { i.goldx = i.dirox; i.goldy = i.diroy; } else i.goldwork = 0;
  if (i.foodwork === 1) { i.dirox = i.campox; i.diroy = i.campoy; i.foodx = i.campox; i.foody = i.campoy; } else i.foodwork = 0;
  if (i.stonework === 1) { i.stonex = i.dirox; i.stoney = i.diroy; } else i.stonework = 0;
  if (i.buildwork === 1 || i.fieldwork === 1) { i.buildx = i.dirox; i.buildy = i.diroy; } else i.buildwork = 0;
  // [§9.40] il ponte del livello 4 si raggiunge solo dalle due rive: verso
  // l'estremita' piu' vicina da cui ci si arriva (il punto cliccato e' in
  // mezzo al fiume)
  const pb = i.buildwork === 1 && w.instancePosition(i.dirox, i.diroy, "ponte");
  if (pb) {
    for (const e of bridgeEnds(pb, i.x, i.y)) {
      if (!fieldTo(w, w.path, i, e.x, e.y, false)) continue;
      i.dirox = i.buildx = e.x; i.diroy = i.buildy = e.y;
      e.take();
      break;
    }
  }
  // [§8.19] verso una risorsa: il campo verso la risorsa cliccata (il campo
  // del capo, scr_movement_general, va verso una cella trovata come in
  // scr_move: vedi fieldTo)
  const kind = i.woodwork === 1 ? "albero" : i.goldwork === 1 ? "miniera_oro" : i.stonework === 1 ? "stone_parent" : null;
  const r = kind && w.instancePosition(i.dirox, i.diroy, kind);
  if (r) fieldTo(w, w.path, i, r.x, r.y);
  // [Segnalazione dell'autore, §8.19] clic su un deposito col carico: va a
  // consegnare. Prima era un semplice spostamento verso il centro
  // dell'edificio, e la regola "punto d'arrivo occupato" (azioni 9 e 11)
  // spostava la meta di 50 px verso il civile a ogni passo finche' non era
  // fuori dall'edificio: il civile si fermava a 14-200 px, oltre i 10 della
  // consegna (consegnavano 4 su 8 al magazzino, 6 su 8 al centro). Ora la
  // meta resta l'edificio, ognuno col campo verso di lui; consegnato, si
  // ferma li' (depositStep).
  i.depositTo = null;
  if (!kind && !i.buildwork && !i.fieldwork && !i.foodwork && carried(i) > 0) {
    const d = w.instancePosition(i.dirox, i.diroy, depositKind(i));
    if (d) {
      i.depositTo = d;
      i.depositUntil = w._stepNo + 600; // 10 s per consegnare, poi si ferma
      i.dirox = d.x; i.diroy = d.y;
      fieldTo(w, w.path, i, d.x, d.y);
    }
  }
  // [§9.29] riparare un complesso (il monastero del livello 3, complex.js):
  // il campo verso il pezzo piu' vicino, non verso il punto cliccato (spesso
  // nel cortile chiuso o su un tetto); l'ordine l'ha dato l'edificio nello
  // stesso passo (sendRepair, repOrder)
  if (i.repOrder !== w._stepNo) i.repT = null;
  else if (complexOf(i.repT)) {
    const f = complexField(w.path, i.repT);
    const gx = Math.floor(i.x / GRID), gy = Math.floor(i.y / GRID);
    if (w.path.fieldAt(f, gx, gy) !== -1 || w.path.escapeCell(f, gx, gy, 2)) {
      i.goal_field = f; i.flow_field = w.path.flowField(f);
      [i.dirox, i.diroy] = complexPoint(w, i.x, i.y, i.repT);
    } else i.repT = null; // da qui non ci arriva: come prima
  }
}

// [§9.29] Verso il complesso da riparare: col campo; nelle celle che toccano
// un suo pezzo (fondo del campo) moveFlowField va con le collisioni verso
// la meta, il punto piu' vicino del complesso, o, sovrapposti a un altro
// civile, se ne stacca (buildStep comincia a 5 px da un pezzo qualunque).
// Il punto e' lontano da chi ci sta gia' riparando: dietro di lui il civile
// restava fermo per sempre.
function toComplex(w, p, i) {
  const busy = [];
  for (const o of w.all("ally_omino")) if (o !== i && o.action === 7 && o.repT === i.repT) busy.push([o.x, o.y]);
  [i.dirox, i.diroy] = complexPoint(w, i.x, i.y, i.repT, busy);
  i.repx = i.dirox; i.repy = i.diroy;
  moveFlowField(w, p, i);
}

// Alarm_10 [C]: verso la bandiera dell'edificio che l'ha creato, con il
// lavoro dato da cosa c'e' sotto la bandiera.
function rallyOmino(p) {
  return (i, w) => {
    const g = w.g;
    for (const k of ["stonework", "goldwork", "woodwork", "foodwork", "buildwork"]) if (i[k] === 2) i[k] = 0;
    i.depositTo = null; // §8.19
    i.dirox = i.flaggox;
    i.diroy = i.flaggoy;
    const at = (n) => w.positionMeeting(i.dirox, i.diroy, n);
    i.goldwork = at("miniera_oro") ? 1 : 0;
    i.woodwork = at("albero") ? 1 : 0;
    i.foodwork = at("campo") ? 1 : 0;
    i.stonework = at("stone_parent") ? 1 : 0;
    i.buildwork = at("ally_fondamenta") ? 1 : 0;
    i.fieldwork = at("campo_fond") ? 1 : 0;
    if (i.action === 0) g.idle -= 1;
    if (i.action !== 0 && i.alarm.get(0) < 1) i.alarm.set(0, 13);
    if (i.action === 0) i.alarm.set(0, 13);
    i.alarm.set(8, 1200);
    i.action = 1;
    if (i.woodwork === 1) { i.woodx = i.dirox; i.woody = i.diroy; }
    if (i.goldwork === 1) { i.goldx = i.dirox; i.goldy = i.diroy; }
    if (i.foodwork === 1) { i.dirox = i.campox; i.diroy = i.campoy; i.foodx = i.campox; i.foody = i.campoy; }
    if (i.stonework === 1) { i.stonex = i.dirox; i.stoney = i.diroy; }
    if (i.buildwork === 1 || i.fieldwork === 1) { i.buildx = i.dirox; i.buildy = i.diroy; } else i.buildwork = 0;
  // [§9.40] il ponte del livello 4 si raggiunge solo dalle due rive: verso
  // l'estremita' piu' vicina da cui ci si arriva (il punto cliccato e' in
  // mezzo al fiume)
  const pb = i.buildwork === 1 && w.instancePosition(i.dirox, i.diroy, "ponte");
  if (pb) {
    for (const e of bridgeEnds(pb, i.x, i.y)) {
      if (!fieldTo(w, w.path, i, e.x, e.y, false)) continue;
      i.dirox = i.buildx = e.x; i.diroy = i.buildy = e.y;
      e.take();
      break;
    }
  }
    // [§9.30, segnalazione dell'autore] senza un lavoro sotto la bandiera, un
    // posto libero, raggiungibile e non promesso a un altro vicino alla
    // bandiera, e la strada col pathfinding passando sopra gli altri civili
    // (pathing.js, rallySpot e rallyGo), come i soldati
    const work = i.goldwork || i.woodwork || i.foodwork || i.stonework || i.buildwork || i.fieldwork;
    const spot = !work && rallySpot(w, p, i, i.flaggox, i.flaggoy);
    if (spot) {
      [i.flaggox, i.flaggoy] = spot;
      rallyGo(p, i);
      return;
    }
    // azione 2: flow field verso la bandiera
    p.free(i);
    goTo(p, i, i.flaggox, i.flaggoy);
  };
}

// --------------------------------------------------------------- Step

function ominoStep(i, w, p, stop) {
  const g = w.g, input = w.input, S = sideOf(i), P = poolOf(w, i); // §9.44
  const nearest = (n, x = i.x, y = i.y) => w.nearest(x, y, n);
  const num = (n) => w.number(n);

  // azione 1: tasto sinistro (i civili non contano in milsel; §9.44: solo i
  // civili del giocatore)
  if (S.player && i.hover === 1 && input.mouseReleased[0]) {
    if (i.dc === 1) for (const o of w.all(OM)) if (inView(w, o)) { o.selected = 1; g.sel += 1; }
    if (g.sele > -1 && i.selected === 0) {
      i.selected = 1;
      if (i.dc === 0) g.sel += 1;
      if (i.dc === 0) { i.dc = 1; i.alarm.set(1, 30); }
    }
    if (g.sele === -1) {
      if (i.selected === 1) g.sel -= 1;
      i.selected = 0;
    }
  }
  // azione 2: morte
  const diro = i.direction;
  if (i.life <= 0) {
    p.free(i);
    if (i.selected === 1) g.sel -= 1;
    if (i.action === 0) P.idle -= 1;
    const corpse = w.create("omino_corpse", i.x, i.y);
    w.destroy(i);
    P.pop -= 1;
    corpse.direction = diro;
    return;
  }
  // azione 3: campi di grano (punto 3c)
  if (fieldsStep(i, w, p, stop) === "exit") return;
  // azione 4: velocita' (piu' lento se porta qualcosa)
  if (i.action === 1) {
    i.autospeed = (i.wood > 0 ? 2 : 3) * iso(i.direction);
    if (i.gold > 0 || i.food > 0 || i.stone > 0) i.autospeed = 2 * iso(i.direction);
  } else i.autospeed = 0;
  // azione 5: direzione
  i.depth = -i.y;
  i.phase = phaseOf(i.direction);
  // azione 6: quando fermarsi (arrivo ESATTO sul punto, x=dirox && y=diroy)
  if (i.action === 1 && i.woodwork === 0 && i.x === i.dirox && i.y === i.diroy) {
    i.action = 0; i.creation = 0; p.occupy(i); i.speed = 0; P.idle += 1;
  }
  if (i.action === 1 && i.woodwork === 1 && i.x === i.dirox && i.y === i.diroy
      && pointDistance(i.woodx, i.woody, i.dirox, i.diroy) > 20 && num("albero") > 0) {
    const t = nearest("albero");
    i.action = 1; i.dirox = t.x; i.diroy = t.y; i.woodwork = 1; i.alarm.set(0, 13);
    i.woodx = i.dirox; i.woody = i.diroy;
    fieldTo(w, p, i, t.x, t.y); // §8.19: prima restava il campo verso l'albero vecchio
  }
  // azione 7: sprite
  ANIM[OM](i, w);
  // azione 8: rettangolo di selezione
  if (S.player && g.multi === 1 && g.sele === 0) {
    const mx = w.mouse.x, my = w.mouse.y;
    const inside = (i.x > g.startx && i.x < mx && i.y > g.starty && i.y < my)
      || (i.x < g.startx && i.x > mx && i.y > g.starty && i.y < my)
      || (i.x > g.startx && i.x < mx && i.y < g.starty && i.y > my)
      || (i.x < g.startx && i.x > mx && i.y < g.starty && i.y > my);
    if (inside) { if (i.selected === 0) g.sel += 1; i.selected = 1; }
    else { if (i.selected === 1) g.sel -= 1; i.selected = 0; }
  }
  // azione 9: punto d'arrivo occupato (solo senza lavoro; non sulla
  // casella della formazione: §8.11; non verso un deposito: §8.19)
  if (i.depositTo && !i.depositTo.alive) i.depositTo = null; // §8.19
  if (i.depositTo && w._stepNo > i.depositUntil) { // §8.19: non ci arriva
    i.depositTo = null;
    if (i.action === 1) { i.dirox = i.x; i.diroy = i.y; }
  }
  if (i.action === 1 && !onFormationSlot(i) && !i.depositTo && !i.buildwork && !i.stonework && !i.foodwork && !i.woodwork && !i.goldwork && !i.fieldwork
      && !w.placeEmpty(i, i.dirox, i.diroy)) {
    if (i.creation === 0) {
      destinationBack(i, 50); // §9.20
    } else if (!rallyRetry(w, p, i, (x, y) => goTo(p, i, x, y))) { // §7.10
      i.dirox += irandomRange(-32, 32);
      i.diroy += irandomRange(-32, 32);
    }
  }
  // azione 10: ai depositi e ritorno
  depositStep(i, w, p, stop);
  // azione 11: "posto occupato (legacy?)" (non sulla casella: §8.11)
  if (i.action === 1 && !onFormationSlot(i) && !i.depositTo && !i.woodwork && !i.goldwork && !i.foodwork && !i.stonework && !i.buildwork && !i.fieldwork
      && !w.placeFree(i, i.dirox, i.diroy)) {
    if (i.creation !== 1 || !rallyRetry(w, p, i, (x, y) => goTo(p, i, x, y))) { // §7.10
      i.dirox += irandomRange(-30, 30);
      i.diroy += irandomRange(-30, 30);
    }
  }
  // azione 12: ordine dei civili inattivi (per il tasto Spazio)
  if (i.action === 0 && i.idling === 0) { i.idling = 1; i.idleorder = P.idle; }
  if (i.action !== 0 && i.idling === 1) {
    i.idling = 0;
    const orderr = i.idleorder;
    i.idleorder = 0;
    for (const o of w.all(S.om)) if (o.idleorder > orderr) o.idleorder -= 1;
  }
  // azione 13
  if (num("torre_placer") > 0) g.sele = 1;
  // azione 14: movimento
  ominoMove(i, w, p);
  // azione 15: seminare un campo alla volta
  if (i.fieldwork === 1 && w.instancePlace(i, i.buildx, i.buildy, S.om)) {
    i.action = 0; i.fieldwork = 0; i.dirox = i.x; i.diroy = i.y; p.occupy(i); P.idle++; i.speed = 0;
  }
  // azione 16: lavoro
  if (workStep(i, w, p, stop) === "exit") return;
  // annullamento del timer per fermarsi
  if (i.stonework || i.goldwork || i.woodwork || i.foodwork || i.buildwork || i.repairwork || i.action !== 1 || i.fieldwork) {
    i.alarm.set(8, -1);
  }
}

// [Segnalazione dell'autore, §8.19] Posti attorno alla risorsa, come i
// soldati in mischia (melee.js, §7.7): settori di 30 gradi, a contatto o 8
// px piu' in fuori, un civile per settore e nessuno sopra un altro; chi non
// si avvicina al suo posto ne prova un altro. Prima tutti andavano verso il
// centro della risorsa: arrivavano alla stessa cella (col flow field anche
// uno sopra l'altro) e il secondo spingeva contro il primo, o aspettava
// che la cella si liberasse.
const WORK = { sep: 30, extras: [0, 8] };
const EDGE = { sep: 30, extras: [0] }; // §9.64: solo a contatto (cantiere, riparazione)
function toEdgeSpot(w, i, t) {
  if (!t) return;
  const s = meleeSpot(w, i, t, null, EDGE);
  mpPotentialStep(w, i, s ? s[0] : t.x, s ? s[1] : t.y, i.autospeed);
}
const WAIT_MAX = 60; // passi di attesa di fila per la precedenza (1 s), ominoMove
const DEP_NEAR = 150; // §9.60: px da un deposito entro cui chi raccoglie passa sopra i compagni
function toWorkSpot(w, i, res) {
  const s = res && meleeSpot(w, i, res, null, WORK);
  if (s) mpPotentialStep(w, i, s[0], s[1], i.autospeed);
}

// [§9.21, richiesta dell'autore] Posti prenotati attorno a miniere e pietre.
// Con 20 civili fra una miniera e un magazzino vicino i posti di meleeSpot
// (ricalcolati a ogni passo, a settori di 30 gradi) erano meno dei civili e
// agli angoli quasi uno sull'altro: chi restava senza puntava al centro
// della risorsa, ci si staccava a ogni passo e un passo su cinque in
// cammino era un'inversione di marcia. Ora ogni risorsa ha posti fissi che
// non si toccano, sul bordo (lavoro) e una fila piu' in fuori (attesa):
// - si prenota, vicino alla risorsa (toWorkSpot era a 100 px), il posto di
//   lavoro libero piu' vicino; se non ce n'e', quello d'attesa;
// - il posto resta di chi lo ha finche' va alla risorsa o ci lavora: chi
//   parte per il deposito lo lascia, e il primo che chiede lo prende (chi
//   aspetta chiede a ogni passo);
// - verso il posto si passa sopra gli altri civili (come verso la casella
//   della formazione, §8.11), al posto d'attesa si sta fermi girati verso la
//   risorsa (queueWait: gli altri ci passano sopra);
// - si comincia a lavorare solo al proprio posto (workStep).
const SPOT_GAP = 4, SPOT_SEP = 6;
const wantsRes = (o, res) => o.spotRes === res && (o.goldwork === 1 || o.stonework === 1 || o.action === 3 || o.action === 5);

// I posti di `res` per una maschera come quella di `i`: centri delle
// maschere lungo i lati del rettangolo della risorsa allargato (a SPOT_GAP
// px, poi una fila piu' in fuori), a distanza di una maschera piu' SPOT_SEP
function resSpots(w, i, res) {
  if (res.spots && res.spots.ver === 1) return res.spots;
  const rb = w.bbox(res), a = w.bbox(i);
  if (!rb || !a) return null;
  const cw = a[2] - a[0], ch = a[3] - a[1];
  const ox = (a[0] + a[2]) / 2 - i.x, oy = (a[1] + a[3]) / 2 - i.y;
  const ring = (gap) => {
    const out = [];
    const x0 = rb[0] - gap - cw / 2, x1 = rb[2] + gap + cw / 2;
    const y0 = rb[1] - gap - ch / 2, y1 = rb[3] + gap + ch / 2;
    const nx = Math.max(1, Math.floor((x1 - x0) / (cw + SPOT_SEP)) + 1);
    const dx = nx > 1 ? (x1 - x0) / (nx - 1) : 0;
    for (let k = 0; k < nx; k++) { const x = nx > 1 ? x0 + k * dx : (x0 + x1) / 2; out.push([x, y0], [x, y1]); }
    const ys = y0 + ch + SPOT_SEP, ye = y1 - ch - SPOT_SEP;
    if (ye >= ys) {
      const ny = Math.max(1, Math.floor((ye - ys) / (ch + SPOT_SEP)) + 1);
      const dy = ny > 1 ? (ye - ys) / (ny - 1) : 0;
      for (let k = 0; k < ny; k++) { const y = ny > 1 ? ys + k * dy : (ys + ye) / 2; out.push([x0, y], [x1, y]); }
    }
    return out.map(([cx, cy]) => ({ x: Math.round(cx - ox), y: Math.round(cy - oy), owner: null }));
  };
  res.spots = { ver: 1, work: ring(SPOT_GAP), queue: ring(SPOT_GAP + Math.max(cw, ch) + SPOT_SEP + 8) };
  return res.spots;
}

// Il posto di `i` attorno a `res` (prenotandolo), o null
function resSpot(w, i, res) {
  const S = resSpots(w, i, res);
  if (!S) return null;
  const taken = (s) => s.owner && s.owner !== i && s.owner.alive && wantsRes(s.owner, res);
  const mine = i.spotRes === res ? i.spotRef : null;
  if (mine && mine.owner === i && !i.spotQ) return mine;
  const nearest = (list) => {
    let best = null, bd = Infinity;
    for (const s of list) {
      if (taken(s) || !w.placeFreeExcept(i, s.x, s.y, sideOf(i).unit)) continue;
      const d = pointDistance(i.x, i.y, s.x, s.y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  };
  const own = (s, q) => {
    if (mine && mine !== s && mine.owner === i) mine.owner = null;
    s.owner = i; i.spotRes = res; i.spotRef = s; i.spotQ = q;
    return s;
  };
  const free = nearest(S.work);
  if (free) return own(free, false);
  if (mine && mine.owner === i) return mine; // gia' in attesa
  const q = nearest(S.queue);
  return q ? own(q, true) : null;
}

function toResSpot(w, i, res) {
  const s = resSpot(w, i, res);
  if (!s) { toWorkSpot(w, i, res); return; } // nessun posto: come prima
  if (i.spotQ && pointDistance(i.x, i.y, s.x, s.y) < 3) {
    i.queueWait = true;
    i.direction = pointDirection(i.x, i.y, res.x, res.y);
    i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); // fermo, come nell'attesa per la precedenza
    return;
  }
  // dentro la risorsa o un altro ostacolo (col campo, senza collisioni, si
  // tagliano gli spigoli): fuori, lontano dal suo centro
  const o = w.instancePlace(i, i.x, i.y, null, true);
  if (o && !w.is(o, sideOf(i).unit)) {
    const b = w.bbox(o), cx = b ? (b[0] + b[2]) / 2 : o.x, cy = b ? (b[1] + b[3]) / 2 : o.y;
    i.direction = pointDirection(cx, cy, i.x, i.y);
    w.setPos(i, i.x + lengthdirX(i.autospeed, i.direction), i.y + lengthdirY(i.autospeed, i.direction));
    i.spotFieldFor = null;
    return;
  }
  // il campo verso il posto, una volta per posto (se non riesce, si riprova
  // dopo 20 passi): dall'altra parte della risorsa la si aggira; vicino e in
  // vista, dritti (sopra gli altri civili)
  if (i.spotFieldFor !== s || (!i.spotField && w._stepNo >= (i.spotFieldAt || 0))) {
    i.spotFieldFor = s; i.spotFieldAt = w._stepNo + 20;
    i.spotField = spotFieldTo(w.path, i, s);
  }
  // dritti, ma se in 30 passi non ci si avvicina (lo spigolo di una pietra
  // irregolare contro la maschera) col campo per 60 passi
  // A meno di 48 px sempre dritti: li' il campo (calcolato con le celle dei
  // civili fermi in quel momento) faceva andare avanti e indietro di 3 px
  // accanto al posto, per sempre (idle.mjs, scenario 7)
  const d = pointDistance(i.x, i.y, s.x, s.y);
  if (i.spotBestFor !== s || d < i.spotBest - 2) { i.spotBestFor = s; i.spotBest = d; i.spotN = 0; }
  else if (++i.spotN >= 30) { i.spotN = 0; i.spotBest = d; i.spotFlowUntil = d >= 48 ? w._stepNo + 60 : 0; }
  if (i.spotField && d >= 48 && (!seesSpot(w.path, i, s) || w._stepNo < (i.spotFlowUntil || 0))) {
    // il campo del posto (tenuto a parte: tornando dal deposito il civile
    // riceve il campo verso la risorsa, e col posto gia' suo non si rifaceva)
    i.dirox = s.x; i.diroy = s.y;
    i.goal_field = i.spotField.goal; i.flow_field = i.spotField.flow;
    moveFlowField(w, w.path, i);
    return;
  }
  mpPotentialStep(w, i, s.x, s.y, i.autospeed, false, true);
}

// [§9.23] Il campo verso il posto coi soli ostacoli fissi: con le celle dei
// civili fermi (fieldTo) accanto ai posti nascevano vicoli ciechi e chi ci
// finiva andava avanti e indietro (idle.mjs, mining.mjs). false se da qui
// il posto non si raggiunge.
function spotFieldTo(p, i, s) {
  // il posto (a 4 px dalla risorsa) puo' stare in una cella toccata dalla
  // risorsa: allora la meta e' la cella libera piu' vicina (goalField
  // partirebbe dal bordo libero dell'ostacolo piu' vicino, anche a 200 px)
  let gx = s.x, gy = s.y;
  const cx = Math.floor(s.x / GRID), cy = Math.floor(s.y / GRID);
  if (!p.inside(cx, cy) || p.solid[cy * p.gw + cx]) {
    let bd = Infinity;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx, y = cy + dy;
      if (!p.inside(x, y) || p.solid[y * p.gw + x]) continue;
      const mx = x * GRID + GRID / 2, my = y * GRID + GRID / 2, d = pointDistance(mx, my, s.x, s.y);
      if (d < bd) { bd = d; gx = mx; gy = my; }
    }
  }
  const f = p.goalField(gx, gy, false, false, true);
  const sx = Math.floor(i.x / GRID), sy = Math.floor(i.y / GRID);
  if (p.fieldAt(f, sx, sy) === -1 && !p.escapeCell(f, sx, sy, 2)) return null;
  return { goal: f, flow: p.flowField(f) };
}

// Il posto e' in vista: la linea sottile fino a 36 px dal posto non passa
// per celle di ostacoli fissi (il posto stesso, a 4 px dalla risorsa, puo'
// stare in una cella della risorsa)
function seesSpot(p, i, s) {
  const d = pointDistance(i.x, i.y, s.x, s.y);
  if (d <= 36) return true;
  const k = (d - 36) / d;
  return p.clearSolid(i.x, i.y, i.x + (s.x - i.x) * k, i.y + (s.y - i.y) * k, 4, 4);
}

// al proprio posto di lavoro attorno a `res` (o senza posti: come prima)
function atResSpot(i, res) {
  if (i.spotRes !== res || !i.spotRef || i.spotRef.owner !== i) return !res || !res.spots;
  return !i.spotQ && pointDistance(i.x, i.y, i.spotRef.x, i.spotRef.y) < 6;
}

// [Segnalazione dell'autore, §8.19] Staccarsi dalle unita' addosso: la
// direzione opposta alla somma delle direzioni verso ciascuna (non verso una
// sola: chi toccava un compagno e la miniera si allontanava a un passo dal
// compagno, verso la miniera, e al passo dopo dalla miniera, verso il
// compagno, 2 px avanti e indietro all'infinito). Se il passo entra in un
// ostacolo che non e' un'unita' (risorsa, edificio, albero) si prova a 45 e
// a 90 gradi. false se non c'e' nessuno addosso o nessun passo libero.
function separate(w, i) {
  const bb = w.bbox(i);
  if (!bb) return false;
  let vx = 0, vy = 0, n = 0;
  for (const o of w._nearList(bb)) {
    if (o === i || !o.alive || !o.solid || !w.is(o, sideOf(i).unit) || !w.overlap(i, i.x, i.y, o)) continue;
    let dx = i.x - o.x, dy = i.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.5) { const a = degtorad((i.id * 137) % 360); dx = Math.cos(a); dy = Math.sin(a); } // uno sull'altro
    else { dx /= d; dy /= d; }
    vx += dx; vy += dy; n++;
  }
  if (!n) return false;
  const base = pointDirection(0, 0, vx, vy), step = Math.max(1, i.autospeed);
  for (const off of [0, 45, -45, 90, -90]) {
    const a = (base + off + 360) % 360, nx = i.x + lengthdirX(step, a), ny = i.y + lengthdirY(step, a);
    if (w.placeFreeExcept(i, nx, ny, sideOf(i).unit)) {
      i.direction = a;
      w.setPos(i, nx, ny);
      return true;
    }
  }
  return false;
}

// La risorsa verso cui va il civile (lavoro 1), o null.
function workTarget(w, i) {
  if (i.woodwork === 1) return w.nearest(i.woodx, i.woody, "albero");
  if (i.goldwork === 1) return w.nearest(i.goldx, i.goldy, "miniera_oro");
  if (i.stonework === 1) return w.nearest(i.stonex, i.stoney, "stone_parent");
  return null;
}

// azione 14 [C]: flow field se lontano (300, o 100 se sta andando a una
// risorsa) o sovrapposto; da vicino mp_potential_step verso la cosa giusta.
function ominoMove(i, w, p) {
  const S = sideOf(i); // §9.44
  i.queueWait = false; // §9.21: toResSpot lo rimette a ogni passo
  const n = (name, x = i.x, y = i.y) => w.nearest(x, y, name);
  const mp = (t) => { if (t) mpPotentialStep(w, i, t.x, t.y, i.autospeed); };
  const workreach = (i.goldwork > 0 || i.stonework > 0 || i.woodwork > 0) ? 200 : 0;
  if (i.action === 1 && i.repairwork === 1 && complexOf(i.repT)) { toComplex(w, p, i); return; } // §9.29
  if (i.action === 1) {
    // §6.2 D: senza la destinazione in vista si resta sul percorso (solo per
    // un semplice spostamento: col lavoro la meta e' la risorsa o l'edificio)
    const plain = !i.goldwork && !i.stonework && !i.woodwork && !i.buildwork && !i.repairwork && !i.foodwork && !i.fieldwork;
    // [§8.19] verso una risorsa: 100 px dal suo bordo, non dal suo centro (da
    // una miniera grande il centro restava oltre i 100 px anche a contatto)
    const res = workTarget(w, i);
    const far = res ? w.distanceToInstance(i, res) > 100 : pointDistance(i.x, i.y, i.dirox, i.diroy) > 300 - workreach;
    // [§9.21] vicino alla miniera o alla pietra si va al proprio posto anche
    // sovrapposti ad altri civili (toResSpot passa sopra di loro)
    const atRes = !!res && !far && (i.goldwork === 1 || i.stonework === 1);
    // [§9.60, segnalazione dell'autore] vicino a un deposito chi raccoglie
    // (col carico, o appena scaricato) passa sopra gli altri civili, come
    // attorno a miniere e pietre (§9.21): da nord-ovest arrivavano tutti
    // allo stesso spigolo del magazzino, in una fila sola a doppio senso, e
    // chi andava e chi tornava si fermavano o si scansavano a vicenda
    const atDep = !atRes && !i.depositTo && (i.woodwork || i.goldwork || i.stonework || i.foodwork)
      && (w.distanceToObject(i, S.magazza) < DEP_NEAR || w.distanceToObject(i, S.barn) < DEP_NEAR);
    // [§9.64] verso il cantiere o l'edificio da riparare: col campo anche da
    // vicino se in linea retta c'e' un ostacolo (prima: dritto, e con un
    // edificio o un bosco in mezzo il civile camminava sul posto)
    const bldT = i.buildwork === 1 ? n(S.fond, i.buildx, i.buildy)
      : i.repairwork === 1 && !complexOf(i.repT) ? n(S.build, i.repx, i.repy) : null;
    const blocked = !!bldT && !seesTarget(w, p, i, bldT);
    if (atRes) toResSpot(w, i, res); // §9.21
    // il campo non ha collisioni: da lontano, o per uscire da un ostacolo
    // vero (albero, edificio) in cui il campo l'ha portato
    else if (atDep && (far || !w.placeFreeExcept(i, i.x, i.y, S.unit))) moveFlowField(w, p, i);
    else if (atDep && (i.woodwork === 2 || i.goldwork === 2 || i.stonework === 2 || i.foodwork === 2)) {
      const d = i.foodwork === 2 ? n(S.barn, i.dirox, i.diroy) : n(S.magazza, i.dirox, i.diroy);
      if (d) mpPotentialStep(w, i, d.x, d.y, i.autospeed, false, true);
    }
    else if (far || !w.placeFreeForSlot(i, i.x, i.y) || (plain && !seesGoal(p, i)) || blocked) {
      const otro = w.instancePlace(i, i.x, i.y, S.unit);
      if (otro) {
        // [§8.19] vicino alla risorsa o al deposito ci si stacca, tutti e
        // due, da chi cammina o lavora (separate); sopra chi e' fermo si
        // passa, come prima (staccandosi, chi trovava un compagno fermo in un
        // passaggio stretto, accanto al deposito, andava avanti e indietro).
        // Da lontano la precedenza dell'originale (passa chi ha
        // l'ordo piu' basso, l'altro aspetta), ma chi aspetta da WAIT_MAX
        // passi di fila riparte: su una strada trafficata (i portatori che
        // vanno e vengono dal deposito) gli passava sopra un compagno dopo
        // l'altro e il civile con l'ordo piu' alto aspettava per sempre.
        // Finche' resta sovrapposto va all'80%: alla stessa velocita' due
        // civili con la stessa strada camminavano uno sopra l'altro.
        // [§9.21] chi aspetta al suo posto attorno alla risorsa (queueWait)
        // conta come fermo: gli si passa sopra
        if (!far && otro.action !== 0 && !otro.queueWait && separate(w, i)) i.waitN = 0;
        else if (otro.ordo === undefined || otro.ordo > i.ordo || otro.action !== 1 || otro.queueWait) moveFlowField(w, p, i); // §8.11: assedio
        else if ((i.waitN || 0) >= WAIT_MAX) {
          const sp = i.autospeed;
          i.autospeed = sp * 0.8;
          moveFlowField(w, p, i);
          i.autospeed = sp;
        } else { i.waitN = (i.waitN || 0) + 1; i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); }
      } else { i.waitN = 0; moveFlowField(w, p, i); }
    } else {
      if (!i.goldwork && !i.stonework && !i.buildwork && !i.repairwork && i.foodwork !== 2 && !i.fieldwork) {
        if (i.woodwork === 1) toWorkSpot(w, i, res); // §8.19
        // [§8.19] consegna su ordine: un posto sul bordo del deposito (chi
        // ha gia' consegnato si ferma li' accanto e faceva da tappo)
        else if (i.depositTo) toWorkSpot(w, i, i.depositTo);
        else mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
        // §6.1 n.89, solo per un semplice spostamento (non verso il legno;
        // non per la consegna su ordine, §8.19: misura i progressi verso il
        // centro dell'edificio, e chi gli girava attorno per arrivare al suo
        // posto "arrivava" a 40-60 px; li' vale il limite di depositUntil)
        if (!i.woodwork && !i.foodwork && !i.depositTo) arriveIfBlocked(i);
      }
      // [§8.19] al proprio posto attorno alla risorsa (prima: mp_potential_step
      // verso il centro della miniera o della pietra piu' vicina)
      // [§9.64] al cantiere e all'edificio da riparare: un posto libero sul
      // bordo (a 4 px, meleeSpot), diverso da quello dei compagni, non il
      // centro: due civili verso lo stesso punto, il secondo restava a 45 px
      // a fare avanti e indietro (si comincia a 5 px, buildStep). Il ponte
      // del livello 4 (buildReach) come prima
      if (i.buildwork === 1) { const f = n(S.fond, i.buildx, i.buildy); if (f && !f.buildReach) toEdgeSpot(w, i, f); else mp(f); }
      if (i.repairwork === 1) toEdgeSpot(w, i, n(S.build, i.repx, i.repy));
      if (i.fieldwork === 1) {
        const f = n("campo_fond", i.buildx, i.buildy);
        mp(f);
        if (f) { i.dirox = f.x; i.diroy = f.y; }
      }
      if (i.foodwork === 2) mp(n(S.barn, i.dirox, i.diroy));
      if (i.goldwork === 2 || i.stonework === 2) mp(n(S.magazza, i.dirox, i.diroy));
    }
  }
  // Ricalcolo se la destinazione e' occupata.
  // [Correzione decisa dall'autore, §3.4 n.14] l'originale crea qui anche
  // un legno_prizedrawer (l'icona "+legno" che sale): resto di debug.
  // [Richiesta dell'autore] solo per il cibo (campi e mulino): negli
  // spostamenti semplici ognuno ha gia' la sua casella (units.js, formation)
  if (p.costAt(Math.trunc(i.goal_x / GRID), Math.trunc(i.goal_y / GRID)) >= 1000 && !i.buildwork && !i.repairwork
      && i.action === 1 && !i.goldwork && !i.woodwork && !i.stonework && i.foodwork) {
    p.free(i);
    goTo(p, i, i.dirox, i.diroy, true); // §6.1 n.89
  }
}

// azione 10 [C]: legno, oro e pietra: a 10 si va al deposito
// (ally_magazza: centro o magazzino) e poi si torna alla risorsa.
function depositStep(i, w, p, stop) {
  const g = poolOf(w, i), S = sideOf(i); // §9.44: le scorte e i depositi della fazione
  const n = (name) => w.nearest(i.x, i.y, name);
  const num = (name) => w.number(name);
  const toMagazza = () => {
    const m = n(S.magazza);
    i.action = 1; p.free(i); i.dirox = m.x; i.diroy = m.y;
    i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
  };
  // legno
  if (i.action === 2 && i.wood >= 10) {
    if (num(S.magazza) > 0) {
      toMagazza();
      fieldTo(w, p, i, i.dirox, i.diroy); // §8.19
      i.alarm.set(0, 13);
      i.woodwork = 2;
    } else { i.action = 0; i.woodwork = 0; i.step = 0; i.speed = 0; g.idle += 1; }
  }
  if (w.distanceToObject(i, S.magazza) < 10) {
    g.wood += i.wood;
    i.wood = 0;
    if (i.woodwork === 2) {
      if (num("albero") > 0) {
        const t = n("albero");
        i.action = 1; p.free(i); i.dirox = t.x; i.diroy = t.y;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        fieldTo(w, p, i, i.dirox, i.diroy); // §8.19
        i.woodwork = 1; i.alarm.set(0, 13); i.woodx = i.dirox; i.woody = i.diroy;
      } else { i.action = 0; i.woodwork = 0; i.step = 0; i.speed = 0; g.idle += 1; }
    }
  }
  // oro
  if (i.action === 3 && i.gold >= 10) {
    if (num(S.magazza) > 0) {
      toMagazza();
      if (i.goldwork !== 2) fieldTo(w, p, i, i.dirox, i.diroy); // §8.19 (era scr_move)
      i.alarm.set(0, 13);
      i.goldwork = 2;
    } else { stop(i, w); i.woodwork = 0; }
  }
  if (w.distanceToObject(i, S.magazza) < 10) {
    g.gold += i.gold;
    i.gold = 0;
    const mine = n("miniera_oro");
    const visoro = !!(mine && (mine.visible || !S.player)); // §9.44: il nemico non ha la nebbia
    if (i.goldwork === 2) {
      if (num("miniera_oro") > 0 && visoro) {
        i.action = 1; p.free(i); i.dirox = mine.x; i.diroy = mine.y;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        if (i.goldwork !== 1) fieldTo(w, p, i, i.dirox, i.diroy); // §8.19
        i.goldwork = 1; i.alarm.set(0, 13); i.goldx = i.dirox; i.goldy = i.diroy;
      } else { stop(i, w); i.goldwork = 0; }
    }
  }
  // pietra [Difetto §3.4 n.15, riprodotto] senza depositi l'originale
  // azzera goldwork invece di stonework
  if (i.action === 5 && i.stone >= 10) {
    if (num(S.magazza) > 0) {
      toMagazza();
      if (i.stonework !== 2) fieldTo(w, p, i, i.dirox, i.diroy); // §8.19
      i.alarm.set(0, 13);
      i.stonework = 2;
    } else { stop(i, w); i.goldwork = 0; }
  }
  if (w.distanceToObject(i, S.magazza) < 10) {
    g.stone += i.stone;
    i.stone = 0;
    const st = n("stone_parent");
    const vispietr = !!(st && (st.visible || !S.player));
    if (i.stonework === 2) {
      if (num("stone_parent") > 0 && vispietr) {
        i.action = 1; p.free(i); i.dirox = st.x; i.diroy = st.y;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        if (i.stonework !== 1) fieldTo(w, p, i, i.dirox, i.diroy); // §8.19
        i.stonework = 1; i.alarm.set(0, 13); i.stonex = i.dirox; i.stoney = i.diroy;
      } else { stop(i, w); i.stonework = 0; }
    }
  }
  // [§8.19] consegnato su ordine (clic sul deposito, rightClick): si ferma
  // dov'e', accanto al deposito (il cibo si scarica in fieldsStep, prima)
  if (i.depositTo && carried(i) === 0) {
    i.depositTo = null;
    if (i.action === 1) { stop(i, w); i.dirox = i.x; i.diroy = i.y; }
  }
}

// azione 16 [C]: arrivati alla risorsa (bbox a meno di 20 px, 15 per la
// pietra, e cella libera) si comincia a lavorare.
function workStep(i, w, p, stop) {
  const g = poolOf(w, i), S = sideOf(i); // §9.44
  const n = (name, x = i.x, y = i.y) => w.nearest(x, y, name);
  const num = (name) => w.number(name);
  // [§8.19] non piu' "cella libera" (costo < 1000): con i posti attorno
  // alla risorsa (toWorkSpot) due civili lavorano anche nella stessa cella
  // da 32 px, e il secondo restava a spingere finche' il primo non se ne
  // andava. Basta che nessun altro civile gli stia addosso (col flow field,
  // senza collisioni, arrivavano uno sull'altro): se no si stacca
  // (moveFlowField) e cerca posto.
  // [§9.21] nessun altro civile al lavoro addosso (chi cammina, o aspetta,
  // passa: prima bastava un compagno di passaggio per non cominciare)
  const cellFree = () => {
    const bb = w.bbox(i);
    return !bb || !w._eachNear(bb, (o) => (o !== i && o.alive && w.is(o, S.om) && o.action !== 0 && o.action !== 1
      && w.overlap(i, i.x, i.y, o) ? o : null));
  };
  const begin = (action, tx, ty) => {
    p.occupy(i);
    i.action = action;
    if (action !== 2) i.wood = 0;
    if (action !== 4) i.food = 0;
    if (action !== 3) i.gold = 0;
    if (action !== 5) i.stone = 0;
    i.step = 0;
    i.alarm.set(2, 13);
    i.direction = pointDirection(i.x, i.y, tx, ty);
  };
  // legno
  if (i.woodwork === 1) {
    if (num("albero") > 0) {
      if (w.distanceToInstance(i, n("albero", i.woodx, i.woody)) < 20 && cellFree()) {
        i.woodwork = 0;
        begin(2, i.woodx, i.woody);
      } else if (pointDistance(i.x, i.y, i.woodx, i.woody) < 250) {
        const t = n("albero");
        // [§8.19] l'albero piu' vicino diventa anche la meta, col suo campo
        // (prima solo woodx: il civile seguiva il campo verso il primo albero
        // e, finito il campo, andava dritto verso l'altro attraverso il
        // bosco). Solo se ci si arriva, e al piu' ogni 20 passi.
        if (pointDistance(t.x, t.y, i.dirox, i.diroy) > 10 && !((i.woodAt || 0) > w._stepNo)) {
          i.woodAt = w._stepNo + 20;
          const ox = i.dirox, oy = i.diroy;
          i.dirox = t.x; i.diroy = t.y;
          if (!fieldTo(w, p, i, t.x, t.y, false)) { i.dirox = ox; i.diroy = oy; }
        }
        i.woodx = t.x; i.woody = t.y;
      }
    } else { i.action = 0; i.woodwork = 0; i.step = 0; i.speed = 0; g.idle += 1; }
  }
  if (i.action === 2) {
    if (num("albero") > 0) {
      const t = n("albero", i.woodx, i.woody);
      if (pointDistance(i.woodx, i.woody, t.x, t.y) > 10) {
        const t2 = n("albero");
        i.action = 1; p.free(i); i.dirox = t2.x; i.diroy = t2.y;
        fieldTo(w, p, i, i.dirox, i.diroy); // §8.19
        i.woodwork = 1; i.alarm.set(0, 13); i.woodx = i.dirox; i.woody = i.diroy;
      }
    }
    if (num("albero") <= 0) { stop(i, w); i.buildwork = 0; i.woodwork = 0; }
  }
  // oro
  // [§9.23] il deposito verso cui si porta il carico e' stato distrutto:
  // verso il piu' vicino; se non ce n'e' piu' nessuno ci si ferma col carico
  // (inattivo), come chi riempie il carico senza depositi. Prima si
  // continuava verso il punto in cui era, senza arrivare mai (idle.mjs,
  // scenario 6)
  for (const [work, dep] of [["woodwork", S.magazza], ["goldwork", S.magazza], ["stonework", S.magazza], ["foodwork", S.barn]]) {
    if (i[work] !== 2 || i.action !== 1) continue;
    if (num(dep) === 0) { stop(i, w); i[work] = 0; continue; }
    // (la meta e' il deposito o, per il cibo, una cella accanto: 120 px)
    const d = n(dep, i.dirox, i.diroy);
    if (pointDistance(d.x, d.y, i.dirox, i.diroy) > 120) {
      const d2 = n(dep);
      i.dirox = d2.x; i.diroy = d2.y;
      fieldTo(w, p, i, d2.x, d2.y);
    }
  }
  // [§9.21] la miniera o la pietra verso cui si va e' finita: verso la piu'
  // vicina (come chi ci lavorava, azioni 3 e 5). Prima si continuava col
  // campo verso il punto in cui era, e li' si restava a girare
  for (const [work, name, kx, ky] of [["goldwork", "miniera_oro", "goldx", "goldy"], ["stonework", "stone_parent", "stonex", "stoney"]]) {
    if (i[work] !== 1) continue;
    // non ce n'e' piu' nessuna: ci si ferma (inattivo), come chi ci lavorava
    if (num(name) === 0) { stop(i, w); i[work] = 0; i.queueWait = false; continue; }
    const t = n(name, i[kx], i[ky]);
    if (pointDistance(t.x, t.y, i[kx], i[ky]) <= 10) continue;
    const t2 = n(name);
    i[kx] = t2.x; i[ky] = t2.y; i.dirox = t2.x; i.diroy = t2.y;
    fieldTo(w, p, i, t2.x, t2.y);
  }
  const mineAt = i.goldwork === 1 ? n("miniera_oro", i.goldx, i.goldy) : null;
  if (mineAt && w.distanceToInstance(i, mineAt) < 20 && atResSpot(i, mineAt) && cellFree()) { // §9.21: al proprio posto
    i.goldwork = 0;
    begin(3, i.goldx, i.goldy);
  }
  if (i.action === 3) {
    if (num("miniera_oro") > 0) {
      const t = n("miniera_oro", i.goldx, i.goldy);
      if (pointDistance(i.goldx, i.goldy, t.x, t.y) > 10) {
        const t2 = n("miniera_oro");
        i.action = 1; p.free(i); i.dirox = t2.x; i.diroy = t2.y;
        fieldTo(w, p, i, t2.x, t2.y); // §8.19: prima nessun campo nuovo
        i.goldwork = 1; i.alarm.set(0, 13); i.goldx = i.dirox; i.goldy = i.diroy;
      }
    }
    if (num("miniera_oro") <= 0) { stop(i, w); i.buildwork = 0; i.goldwork = 0; }
  }
  // pietra
  const stoneAt = i.stonework === 1 ? n("stone_parent", i.stonex, i.stoney) : null;
  if (stoneAt && w.distanceToInstance(i, stoneAt) < 15 && atResSpot(i, stoneAt) && cellFree()) { // §9.21: al proprio posto
    i.stonework = 0;
    begin(5, i.stonex, i.stoney);
  }
  if (i.action === 5) {
    if (num("stone_parent") > 0) {
      const t = n("stone_parent", i.stonex, i.stoney);
      if (pointDistance(i.stonex, i.stoney, t.x, t.y) > 10) {
        const t2 = n("stone_parent");
        i.action = 1; p.free(i); i.dirox = t2.x; i.diroy = t2.y;
        fieldTo(w, p, i, t2.x, t2.y); // §8.19: prima nessun campo nuovo
        i.stonework = 1; i.alarm.set(0, 13); i.stonex = i.dirox; i.stoney = i.diroy;
      }
    }
    if (num("stone_parent") <= 0) { stop(i, w); i.buildwork = 0; i.stonework = 0; }
  }
  // costruzione, coltivazione, riparazione (punto 3b/3c)
  return buildStep(i, w, p, stop);
}

// Alarm_2 [C, "sostitutivi di bullet"]: ogni 39 passi (tre fasi da 13) un
// colpo sulla risorsa col versore (30 px davanti): legno +2, oro +1,
// pietra +1; la risorsa finita sparisce. Cibo, costruzione, riparazione e
// semina in fieldsTick/buildTick.
function workTick(i, w) {
  const a = i.action;
  if (a === 2 || a === 3 || a === 5) {
    if (i.step === 0) { i.step = 1; i.alarm.set(2, 13); return; }
    if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
    if (i.step !== 2) return;
    i.step = 0;
    i.alarm.set(2, 13);
    const ax = i.x + 30 * Math.cos(degtorad(i.direction)), ay = i.y - 30 * Math.sin(degtorad(i.direction));
    if (a === 2) {
      i.wood += 2;
      const t = w.nearest(ax, ay, "albero");
      if (t) { t.wood -= 2; if (t.wood === 0) w.destroy(t); }
    } else if (a === 3) {
      i.gold += 1;
      const t = w.nearest(ax, ay, "miniera_oro");
      if (t) { t.gold -= 1; if (t.gold === 0) w.destroy(t); }
    } else {
      i.stone += 1;
      const t = w.nearest(ax, ay, "stone_parent");
      if (t) { t.stone -= 1; if (t.stone === 0) w.destroy(t); }
    }
    return;
  }
  otherWorkTick(i, w);
}

// --------------------------------------------- costruzione e riparazione

// azione 16, parte "costruzione", "coltivazione di campo", "riparazione",
// "fine costruzione", "fine coltivazione" [C].
function buildStep(i, w, p) {
  const g = poolOf(w, i), S = sideOf(i); // §9.44
  const fondNear = () => w.nearest(i.buildx, i.buildy, S.fond);
  const clearLoads = () => { i.wood = 0; i.food = 0; i.gold = 0; i.stone = 0; i.step = 0; i.alarm.set(2, 13); };
  // costruzione: l'else e' agganciato a "ci sono cantieri" [C]
  // [§9.40] il ponte del livello 4 si ripara da piu' lontano (buildReach):
  // all'imbocco c'e' posto per due, gli altri restavano in coda per sempre
  const reach = (f) => (f && f.buildReach) || 10;
  if (i.buildwork === 1) {
    if (w.number(S.fond) > 0) {
      if (w.distanceToInstance(i, fondNear()) < reach(fondNear())) {
        i.buildwork = 0;
        p.occupy(i);
        i.action = 6;
        clearLoads();
        i.direction = pointDirection(i.x, i.y, i.buildx, i.buildy);
      }
    } else {
      i.action = 0; p.occupy(i); i.buildwork = 0; i.step = 0; i.speed = 0; g.idle += 1;
    }
  }
  // coltivazione di campo: il seminatore arriva al centro del cantiere.
  // [Deviazione] senza cantieri l'originale legge instance_nearest(...).x
  // di noone ed esce con un errore (succede se il campo viene finito mentre
  // un secondo seminatore e' ancora in cammino) [I]; qui il civile si ferma.
  // [§9.67] il cantiere di campo ordinato (il piu' vicino al punto
  // dell'ordine, buildx: quello verso cui il civile cammina, ominoMove), non
  // il piu' vicino al civile: con due campi in costruzione, chi andava al
  // secondo passando sul centro del primo si fermava a seminare il primo
  if (i.fieldwork === 1) {
    const f = w.nearest(i.buildx, i.buildy, "campo_fond");
    if (!f) {
      i.fieldwork = 0; i.action = 0; p.occupy(i); i.step = 0; i.speed = 0; g.idle += 1;
    } else if (pointDistance(i.x, i.y, f.x, f.y) < 10) {
      i.fieldwork = 0;
      p.occupy(i);
      i.action = 8;
      i.wood = 0;
      i.buildx = f.x; i.buildy = f.y;
      i.food = 0; i.gold = 0; i.stone = 0; i.step = 0;
      i.alarm.set(2, 13);
      i.direction = pointDirection(i.x, i.y, i.buildx, i.buildy);
      f.occupato = 1;
    }
  }
  // riparazione ([§9.29] di un complesso: da un pezzo qualunque).
  // [§9.64] Si comincia a 10 px dall'edificio, come al cantiere (era 5): col
  // posto sul bordo (toEdgeSpot, a 4 px) l'ultimo passo, chiuso
  // dall'edificio, poteva lasciare il civile a 6 px, fermo a camminare
  const rc = complexOf(i.repT);
  if (i.repairwork === 1 && (rc ? complexNear(w, i, rc, 5) : w.distanceToInstance(i, w.nearest(i.repx, i.repy, S.build)) < 10)) {
    i.repairwork = 0;
    p.occupy(i);
    i.action = 7;
    clearLoads();
    i.direction = pointDirection(i.x, i.y, i.repx, i.repy);
  }
  // fine costruzione: il cantiere e' finito (non c'e' piu' a 40 px):
  // al prossimo cantiere, o fermi se non ce ne sono
  if (i.action === 6) {
    if (w.number(S.fond) > 0) {
      // [§9.40] non verso il ponte del livello 4 (noAuto): e' sempre li', e
      // ci sarebbero andati da ogni cantiere finito della mappa
      let next = null, nd = Infinity;
      for (const f of w.all(S.fond)) {
        const d = pointDistance(i.x, i.y, f.x, f.y);
        if (!f.noAuto && d < nd) { next = f; nd = d; }
      }
      const away = w.distanceToInstance(i, fondNear()) > Math.max(40, reach(fondNear()) + 10);
      if (away && !next) {
        i.action = 0; i.buildwork = 0; i.step = 0; i.speed = 0; g.idle += 1;
      } else if (away) {
        i.action = 1;
        p.free(i);
        const f = next;
        i.dirox = f.x; i.diroy = f.y;
        i.buildx = i.dirox; i.buildy = i.diroy;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        if (i.buildwork !== 1) scrMove(p, i, i.dirox, i.diroy);
        i.buildwork = 1;
        i.alarm.set(0, 13);
      }
    } else {
      i.action = 0; i.buildwork = 0; i.step = 0; i.speed = 0; g.idle += 1;
    }
  }
  // fine coltivazione: il campo seminato e' finito (o non c'e' piu' un
  // cantiere a 30 px): il seminatore diventa contadino. campox e' quello
  // vecchio: l'azione 3 del passo dopo trova il campo libero piu' vicino.
  if (i.action === 8) {
    const f = w.nearest(i.buildx, i.buildy, "campo_fond");
    if (!f || pointDistance(i.buildx, i.buildy, f.x, f.y) > 30) {
      i.dirox = i.campox; i.diroy = i.campoy;
      i.foodx = i.campox; i.foody = i.campoy;
      if (i.foodwork !== 1) scrMove(p, i, i.dirox, i.diroy);
      i.foodwork = 1;
      p.free(i);
      i.action = 1;
      i.alarm.set(0, 13);
      return "exit";
    }
  }
  return null;
}

// Vita aggiunta al cantiere a ogni scatto di Alarm_2 (ogni 13 passi), per
// slife [C]: le costruzioni grandi +1, casa/magazzino/mulino +2, i tratti
// di mura (799) +5. Il 100 non serve: e' il cantiere del campo, che non e'
// un ally_fondamenta e cresce con la semina (azione 8).
// [Richiesta dell'autore, §9.39] caserma (349) e stalla (379) +2.
// [§9.40-§9.42] il ponte del livello 4 (999): 998/4399, frazioni di vita
// (4399 = bridge.js BRIDGE.hits; scritto qui: i moduli si importano a
// vicenda e questa tabella si calcola al caricamento)
const BUILD_RATE = { 329: 1, 899: 1, 349: 2, 299: 1, 379: 2, 139: 2, 119: 2, 149: 2, 799: 5, 100: 5,
                     999: 998 / 4399 };

// Alarm_2, azioni 4, 6, 7, 8 [C]: a differenza della raccolta, il cantiere
// cresce a ogni scatto (non solo al terzo); il ciclo dei tre step serve
// solo all'animazione.
function otherWorkTick(i, w) {
  const g = poolOf(w, i), S = sideOf(i); // §9.44
  // raccolta del cibo [C]: +1 ogni tre scatti; il campo resta occupato
  // (alarm 1 a 40 passi), o si libera al passo dopo se il contadino ha 10.
  if (i.action === 4) {
    if (i.step === 0) { i.step = 1; i.alarm.set(2, 13); return; }
    if (i.step === 1) { i.step = 2; i.alarm.set(2, 13); return; }
    if (i.step !== 2) return;
    i.step = 0;
    i.alarm.set(2, 13);
    i.food += 1;
    const c = w.nearest(i.x, i.y, S.campo);
    if (c) { c.alarm.set(1, i.food < 10 ? 40 : 1); c.foodwork = 1; }
    return;
  }
  // semina [C]: +5 a ogni scatto; alla terza fase lancia i semi
  if (i.action === 8) {
    const f = w.nearest(i.buildx, i.buildy, "campo_fond");
    if (f && f.fondazione === 1) { f.life += 5; if (f.life > f.slife) f.life = f.slife; }
    if (i.step === 2) seedsThrow(i, w);
    i.step = i.step === 0 ? 1 : i.step === 1 ? 2 : 0;
    i.alarm.set(2, 13);
    return;
  }
  if (i.action === 6) {
    const f = w.nearest(i.buildx, i.buildy, S.fond);
    if (f && f.fondazione === 1) {
      const n = f.rate || BUILD_RATE[f.slife] || 0; // §9.45: i cantieri nemici hanno il loro (rate)
      // [§9.41] il ponte del livello 4 costa legno a ogni colpo; senza, il
      // colpo non vale e il legno lampeggia
      const due = f.object === "ponte" ? woodDue(f, n) : 0;
      if (due > g.wood) {
        if (S.player && w.number("wood_blink") === 0) w.create("wood_blink", 0, 0);
      } else {
        g.wood -= due;
        f.life += n;
        if (f.life > f.slife) f.life = f.slife;
      }
    }
  } else if (i.action === 7) {
    // riparazione: 1 pietra o 1 legno per punto di vita; il legno spegne
    // anche il fuoco (e le fiamme)
    const b = complexOf(i.repT) || w.nearest(i.repx, i.repy, S.build); // §9.29
    // [§9.64, segnalazione dell'autore] senza il materiale (pietra per gli
    // edifici di pietra, legno per quelli di legno) il civile si ferma,
    // inattivo: prima continuava a martellare senza che la vita salisse.
    // [§9.65, richiesta dell'autore] la risorsa che manca fa un solo
    // lampeggio veloce (buildings.js, blink quick)
    if (b && (b.pietra === 1 || b.legno === 1) && !(b.pietra === 1 && g.stone > 0) && !(b.legno === 1 && g.wood > 0)) {
      if (S.player) w.create(b.pietra === 1 ? "stone_blink" : "wood_blink", 0, 0, { init: (k) => { k.quick = 1; } });
      i.action = 0; i.repairwork = 0; i.repT = null; i.step = 0; i.speed = 0;
      g.idle += 1;
      return;
    }
    if (b && b.pietra === 1 && g.stone > 0) {
      g.stone--; b.life++;
      if (b.life > b.slife) b.life = b.slife;
    }
    if (b && b.legno === 1 && g.wood > 0) {
      g.wood--; b.life++;
      b.onfire = 0;
      if (b.firestarted === 1) { fireStop(b, w); b.firestarted = 0; }
      if (b.life > b.slife) b.life = b.slife;
    }
  } else return;
  i.step = i.step === 0 ? 1 : i.step === 1 ? 2 : 0;
  i.alarm.set(2, 13);
}

// --------------------------------------------------------------- campi

// distance_to_point [I]: dal bbox dell'istanza al punto (0 se dentro).
function distanceToPoint(w, i, px, py) {
  const b = w.bbox(i);
  if (!b) return Math.hypot(px - i.x, py - i.y);
  return Math.hypot(Math.max(0, b[0] - px, px - b[2]), Math.max(0, b[1] - py, py - b[3]));
}

// azione 3, "Campi di grano" [C]. foodwork: 0 niente, 1 verso il mio campo,
// 2 verso il granaio col cibo, 6 cercare il campo libero piu' vicino.
function fieldsStep(i, w, p) {
  const g = poolOf(w, i), S = sideOf(i); // §9.44
  // `var top` sta dentro l'if: fuori vale 0 [I, variabili non assegnate = 0]
  let top = 0;
  if (i.foodwork === 1 || i.foodwork === 6) {
    let miocampox = 0, miocampoy = 0;
    top = 99999;
    for (const c of w.all(S.campo)) {
      if (c.foodwork !== 0) continue;
      const dis = w.distanceToInstance(c, i);
      if (dis < top) { miocampox = c.x; miocampoy = c.y; top = dis; }
    }
    if (i.campox !== miocampox || i.foodwork === 6) {
      i.campox = miocampox; i.campoy = miocampoy;
      i.dirox = i.campox; i.diroy = i.campoy;
      i.foodx = i.campox; i.foody = i.campoy;
      p.free(i);
      generateFields(p, i, i.dirox, i.diroy);
      i.foodwork = 1;
    }
    i.action = 1;
  }
  // tutti i campi occupati
  if (top === 99999 && i.foodwork === 1) { i.action = 0; g.idle += 1; i.foodwork = 0; }
  // arrivato al campo: comincia a raccogliere
  if (i.foodwork === 1 && distanceToPoint(w, i, i.foodx, i.foody) < 5) {
    i.foodwork = 0;
    p.occupy(i);
    i.action = 4;
    i.step = 0; i.wood = 0; i.gold = 0; i.stone = 0;
    i.alarm.set(2, 13);
    w.create("food_bullet", i.x, i.y);
    i.direction = pointDirection(i.x, i.y, i.foodx, i.foody);
  }
  // a 10 di cibo al granaio (ally_barn: mulino o centro); l'else e'
  // agganciato a "c'e' un granaio" [C]
  if (i.action === 4 && i.food >= 10) {
    if (w.number(S.barn) > 0) {
      i.action = 1;
      p.free(i);
      const b = w.nearest(i.x, i.y, S.barn);
      i.dirox = b.x; i.diroy = b.y;
      if (i.foodwork !== 2) goTo(p, i, i.dirox, i.diroy);
      i.alarm.set(0, 13);
      i.foodwork = 2;
    } else {
      i.action = 0; p.occupy(i); i.foodwork = 0; i.step = 0; i.speed = 0; g.idle += 1;
    }
  }
  // vicino al granaio: scarica e torna a cercare un campo libero
  if ((i.foodwork === 2 || i.food > 0) && i.action !== 4 && w.distanceToObject(i, S.barn) < 10) {
    g.food += i.food;
    i.food = 0;
    i.alarm.set(0, 13);
    if (i.foodwork === 2) i.foodwork = 6;
  }
  return null;
}

// --------------------------------------------------------------- disegno

// Draw_End [C]: barra della vita lunga quanto la vita (50 px), non in
// proporzione come per i soldati; segnaposto sulla risorsa di destinazione.
function ominoDrawEnd(i, w, d) {
  const green = 0x008000;
  const bar = () => {
    d.lifeBar(i.x - 25, i.y - 82, i.life / 50, green);
  };
  if (i.selected === 1) {
    bar();
    d.sprite("circ_1", 0, i.x, i.y);
    if (i.action === 1) {
      if (!i.goldwork && !i.woodwork && !i.stonework) d.sprite("director_blue", 0, i.dirox, i.diroy);
      const mark = (name) => { const t = w.nearest(i.dirox, i.diroy, name); if (t) d.sprite("director_blue", 0, t.x, t.y); };
      if (i.goldwork === 1) mark("miniera_oro");
      if (i.stonework === 1) mark("stone_parent");
      if (i.woodwork === 1) mark("albero");
    }
    d.sprite("director_blue", 0, i.foodx, i.foody);
  }
  if (i.hit === 1 && w.room !== "menu") bar();
  // numero del gruppo di controllo, come i soldati
  if (i.assi && i.assi !== 0) {
    d.setAlpha(0.3);
    d.setFont("GUI_1");
    d.setHalign("center");
    d.text(i.x, i.y - 100, i.assi !== 10 ? i.assi : "0");
    d.setFont("GUI_1");
    d.setAlpha(1);
  }
  if (i.hover === 1) bar();
}

// Draw_GUI [C]: scheda del civile con i 10 pulsanti di costruzione e cio' che
// trasporta.
function ominoPanel(i, w, d) {
  if (i.selected !== 1) return;
  // [§7.2] con piu' civili (e nessun soldato) i pulsanti di costruzione si
  // vedono: li disegna il primo civile selezionato, senza la scheda
  const g = w.g, multi = g.sel >= 2;
  if (multi && (g.milsel !== 0 || firstSelected(w, true) !== i)) return;
  const white = 0xffffff;
  d.setAlpha(0.69);
  if (!multi) d.roundrectColourExt(260, 20, 390, 150, 60, 60, white, white, false);
  for (const x of [450, 520, 590, 660, 730]) for (const y of [50, 120]) d.circleColour(x, y, 30, white, white, false);
  d.setFont("GUI_1");
  d.setColour(0);
  d.setAlpha(0.75);
  d.setValign("middle");
  d.setHalign("center");
  if (!multi) d.text(325, 120, i.life + " / " + i.slife);
  d.setAlpha(1);
  const ico = (s, x, y) => d.spriteExt(s, 0, x, y, 0.5, 0.5, 0, white, 1);
  ico("ico_casa", 450, 50); ico("ico_torre", 450, 120); ico("ico_magazzino", 520, 50); ico("ico_barn", 590, 50);
  ico("ico_corn", 660, 50); ico("ico_mura", 520, 120); ico("ico_caserma", 590, 120); ico("ico_stalla", 660, 120);
  ico("ico_castello", 730, 120); ico("ico_chiesa", 730, 50);
  if (multi) return;
  if (!i.gold && !i.wood && !i.food && !i.stone) d.sprite("ico_omino", 0, 325, 70);
  else d.spriteExt("ico_omino", 0, 355, 70, 0.8, 0.8, 0, white, 1);
  for (const [k, s] of [["food", "ico_food"], ["gold", "ico_gold"], ["wood", "ico_wood"], ["stone", "ico_stone"]]) {
    if (i[k] > 0) {
      d.spriteExt(s, 0, 295, 55, 1, 1, 0, white, 1);
      d.setAlpha(0.75);
      d.text(295, 85, i[k]);
      d.setAlpha(1);
    }
  }
}

// ------------------------------------------------------- risorse naturali

// Visibilita' delle risorse [C, Step di albero (600 px, o nebbia spenta),
// miniera e pietre (400 px)]: si rivelano quando un'unita' o un edificio
// alleato e' vicino, e restano visibili.
function reveal(i, w, dist, fogAware) {
  if (i.visible) return;
  // §6.3 N3: nearWithin da' lo stesso risultato di
  // distance_to_object(instance_nearest(...)) < dist, senza rifare la
  // ricerca quando gli alleati sono lontani per certo
  if (w.nearWithin(i, "ally_unit", dist) || w.nearWithin(i, "ally_build", dist)
      || (fogAware && w.g.fogville === 0)) i.visible = true;
}

// Destroy delle risorse [C]: le celle occupate tornano libere.
function freeCells(p, i) { p.markInstance(i, 1); }

export function resource(p, kind) {
  const cfg = {
    albero: { amount: ["wood", 150], work: "woodwork", hover: "alberhover", dist: 600, fog: true, dying: "albero_morente", centroDir: "woodir",
              hint: ["hint_legna", "woodhint"] },
    albero_fake: { amount: ["wood", 150], work: "woodwork", hover: null, dist: 600, fog: true, dying: null },
    miniera_oro: { amount: ["gold", 2500], work: "goldwork", hover: "minierahover", dist: 400, fog: false, dying: "miniera_morente", centroDir: "goldir",
                   hint: ["hint_oro", "goldhint"] },
    pietra_grande: { amount: ["stone", 850], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "pietra_grande_morente", centroDir: "stonedir",
                     hint: ["hint_stone", "stonehint"] },
    pietr_piccolo: { amount: ["stone", 450], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "pietr_piccolo_morente", centroDir: "stonedir",
                     hint: ["hint_stone", "stonehint"] },
    // [§7.17] rovine di pietra di castello, torre e chiesa [C, *ruin
    // Create/Step/Destroy/Mouse_*]: come le pietre (senza suggerimento), con
    // la pietra del loro Create; nascono anche a partita in corso (edificio
    // distrutto), quindi segnano da sole le loro celle nella griglia.
    // Mancavano nel porting: non si esaurivano mai.
    castelloruin: { amount: ["stone", 500], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "castelloruin_morente", centroDir: "stonedir", grid: true },
    torreruin: { amount: ["stone", 100], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "torreruin_morente", centroDir: "stonedir", grid: true },
    chiesaruin: { amount: ["stone", 75], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "chiesaruin_morente", centroDir: "stonedir", grid: true },
  }[kind];
  const ALB = ["alb1", "alb2", "alb3", "alb4", "alb5", "alb6", "alb7", "alb8"];
  return {
    create(i, w) {
      if (cfg.grid) p.markInstance(i, 1000);
      i.selected = 0;
      i[cfg.work] = 0;
      i.depth = -i.y;
      i[cfg.amount[0]] = cfg.amount[1];
      if (kind === "albero" || kind === "albero_fake") {
        i.type = irandomRange(1, 8);
        i.sprite_index = ALB[i.type - 1];
        w.moved(i);
      }
      if (kind === "miniera_oro") {
        for (const c of w.all("centro")) Object.assign(c, { woodir: 0, goldir: 0, stonedir: 0, foodir: 0, blinkfade: 1 });
        i.visible = false;
        i.blinkfade = 0;
        i.blinkx = i.x;
        i.blinky = i.y;
      }
      if (kind === "pietra_grande") i.fase = 1;
    },
    step(i, w) {
      if (kind === "pietra_grande" && i.fase === 1 && i.stone < 425) {
        i.fase = 2;
        i.sprite_index = "pietra_grande2";
      }
      reveal(i, w, cfg.dist, cfg.fog);
      if (w.room === "menu" && cfg.fog) i.visible = true;
      if (kind === "miniera_oro") {
        if (i.blinkfade > 0) i.blinkfade -= 0.02;
        else { i.blinkfade = 1; i.blinkx = i.x + irandomRange(-60, 60); i.blinky = i.y + irandomRange(-40, 40); }
      }
    },
    destroy(i, w) {
      freeCells(p, i);
      if (cfg.hover) w.g[cfg.hover] = 0;
      if (cfg.dying) {
        const m = w.create(cfg.dying, i.x, i.y);
        if (i.type) { m.type = i.type; m.sprite_index = ALB[i.type - 1]; }
      }
    },
    // Mouse_RightReleased [C]: i civili selezionati vanno a lavorare qui; il
    // centro selezionato manda qui i nuovi civili.
    rightReleased(i, w) {
      if (cfg.centroDir) {
        for (const c of w.all("centro")) {
          if (c.selected === 1) Object.assign(c, { woodir: 0, goldir: 0, stonedir: 0, foodir: 0, [cfg.centroDir]: 1 });
        }
      }
      for (const o of w.all(OM)) {
        if (o.selected === 1) {
          o[cfg.work] = 1;
          if (cfg.work !== "woodwork") o.woodwork = 0;
        }
      }
      i[cfg.work] = 1;
    },
    leftReleased(i, w) { if (w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1; },
    globalLeftPressed(i) { i.selected = 0; },
    // MouseEnter [C]: il suggerimento della risorsa, la prima volta, dopo
    // hint_resource
    mouseEnter(i, w) {
      if (cfg.hover) w.g[cfg.hover] = 1;
      if (cfg.hint) hintOnce(w, cfg.hint[0], cfg.hint[1], i.x, i.y, w.g.resourcehint === 1);
    },
    mouseLeave(i, w) { if (cfg.hover) w.g[cfg.hover] = 0; },
    // Draw_End [C]: albero il cerchio di selezione; miniera il luccichio
    // (miniera_blink) che compare in un punto a caso e sfuma; pietre niente.
    drawEnd(i, w, d) {
      if (kind === "miniera_oro") d.spriteExt("miniera_blink", 0, i.blinkx, i.blinky, 1, 1, 0, 0xffffff, i.blinkfade);
      else if ((kind === "albero" || kind === "albero_fake") && i.selected === 1) d.sprite("circ_1", 0, i.x, i.y);
    },
    drawGUI(i, w, d) {
      if (i.selected !== 1 || w.g.sel >= 1) return;
      const icon = { albero: "ico_albero", albero_fake: "ico_albero", miniera_oro: "ico_miniera" }[kind] || "ico_ruin";
      const res = { wood: "ico_wood", gold: "ico_gold", stone: "ico_stone" }[cfg.amount[0]];
      d.setAlpha(0.69);
      d.roundrectColourExt(260, 20, 390, 150, 60, 60, 0xffffff, 0xffffff, false);
      d.setFont("GUI_1");
      d.setColour(0);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("center");
      d.text(325, 120, i[cfg.amount[0]]);
      d.setAlpha(1);
      d.sprite(icon, 0, 325, 70);
      d.sprite(res, 0, 285, 120);
    },
  };
}

// *_morente [C]: la risorsa finita sbiadisce in 40 passi (alpha -0,025 a
// passo) e sparisce.
export function dying() {
  return {
    create(i) { i.depth = -i.y; i.alarm.set(0, 40); },
    step(i) { i.image_alpha -= 0.025; },
    alarm0(i, w) { w.destroy(i); },
  };
}

// [Correzione decisa dall'autore, §6.1 n.80] global.idle nell'originale e'
// tenuto a incrementi (+1/-1 in una trentina di punti fra civili, cantieri
// ed edifici) e basta un percorso dimenticato perche' il contatore si
// sfasi per sempre. Qui, dopo ogni passo, si ricalcola dai civili veri
// (action 0) e si rinumera l'ordine per Spazio (idleorder 1..n, nello
// stesso ordine di prima).
export function recountIdle(w) {
  const g = w.g;
  const idle = [];
  for (const o of w.all(OM)) {
    if (o.action === 0) idle.push(o);
    else if (o.idling === 1) { o.idling = 0; o.idleorder = 0; }
  }
  idle.sort((a, b) => (a.idleorder || 1e9) - (b.idleorder || 1e9) || a.id - b.id);
  idle.forEach((o, k) => { o.idling = 1; o.idleorder = k + 1; });
  g.idle = idle.length;
  for (const ic of w.all("idle_clicker")) if (ic.orderu > g.idle || ic.orderu < 1) ic.orderu = 1;
}

// [§9.44] Un lavoro dato dalla regia (economy.js) a un civile, come il clic
// destro del giocatore su una risorsa (rightClick): kind "wood", "gold",
// "stone" verso la risorsa t, "food" al campo libero piu' vicino della
// fazione (fieldsStep, foodwork 6), "move" verso t senza lavoro (la fuga),
// "build" al cantiere t, "repair" all'edificio t (§9.45).
export function orderWork(w, p, i, kind, t) {
  for (const k of ["woodwork", "goldwork", "stonework", "foodwork", "buildwork", "repairwork", "fieldwork"]) i[k] = 0;
  i.creation = 0;
  i.depositTo = null;
  if (i.action === 0) poolOf(w, i).idle -= 1;
  i.action = 1;
  i.alarm.set(0, 13);
  p.free(i);
  if (kind === "food") { i.foodwork = 6; return; }
  if (kind === "move") { i.dirox = t.x; i.diroy = t.y; fieldTo(w, p, i, t.x, t.y); return; }
  // [§9.45] costruire il cantiere t, riparare l'edificio t
  if (kind === "build") { i.buildwork = 1; i.buildx = t.x; i.buildy = t.y; }
  if (kind === "repair") { i.repairwork = 1; i.repx = t.x; i.repy = t.y; i.repT = null; }
  if (kind === "build" || kind === "repair") { i.dirox = t.x; i.diroy = t.y; fieldTo(w, p, i, t.x, t.y); return; }
  const [work, kx, ky] = { wood: ["woodwork", "woodx", "woody"], gold: ["goldwork", "goldx", "goldy"],
                           stone: ["stonework", "stonex", "stoney"] }[kind];
  i[work] = 1;
  i[kx] = t.x; i[ky] = t.y;
  i.dirox = t.x; i.diroy = t.y;
  fieldTo(w, p, i, t.x, t.y);
}
