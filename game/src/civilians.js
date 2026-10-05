// Il civile (ally_omino) e le risorse naturali: raccolta, trasporto ai
// depositi, costruzione, campi. Trascrizione evento per evento di
// src/objects/ally_omino/ e degli oggetti risorsa (albero, miniera_oro,
// pietra_grande, pietr_piccolo e i loro *_morente). Nomi originali.
//
// Lavori (variabili *work): 0 niente, 1 andare alla risorsa/al cantiere,
// 2 tornare al deposito; foodwork 6 = cercare il campo libero piu' vicino.
// action: 0 fermo, 1 in cammino, 2 taglia legna, 3 scava oro, 4 raccoglie
// cibo, 5 spacca pietra, 6 costruisce, 7 ripara, 8 semina.

import { ANIM } from "./animTables.js";
import { pointDirection, pointDistance, lengthdirX, lengthdirY, degtorad, irandomRange } from "./gm.js";
import { GRID, generateFields, scrMove, moveFlowField, mpPotentialStep } from "./pathing.js";
import { phaseOf, walkCycle, unitDrawEnd } from "./units.js";

const iso = (dir) => 1 - 0.36 * Math.abs(Math.sin(degtorad(dir)));
const OM = "ally_omino";
const CLICKERS = ["casa_clicker", "magazzino_clicker", "barn_clicker", "campo_clicker", "chiesa_clicker",
                  "torre_clicker", "caserma_clicker", "stalla_clicker", "castello_clicker", "mura_clicker"];

function inView(w, i) {
  const c = w.cam;
  return i.x > c.x && i.x < c.x + c.w && i.y > c.y && i.y < c.y + c.h;
}

// Ricalcolo del campo verso (tx, ty) senza scr_free (blocco ripetuto in
// "arrivi a 10 di cibo" e nei Create degli edifici).
function goTo(p, i, tx, ty) {
  const [cx, cy] = p.findValidCellBackwards(i.goal_field, Math.trunc(tx / GRID), Math.trunc(ty / GRID),
                                            Math.trunc(i.x / GRID), Math.trunc(i.y / GRID));
  const found = p.fieldAt(i.goal_field, cx, cy) !== -1;
  i.goal_x = found ? cx * GRID : i.x;
  i.goal_y = found ? cy * GRID : i.y;
  generateFields(p, i, i.goal_x, i.goal_y);
  i.dirox = i.goal_x;
  i.diroy = i.goal_y;
}

// --------------------------------------------------------------- civile

export function omino(p) {
  const stop = (i, w, occupy = true) => {
    i.action = 0;
    if (occupy) p.occupy(i);
    i.step = 0;
    i.speed = 0;
    w.g.idle += 1;
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
      g.idle += 1;
      i.idling = 1;
      i.idleorder = g.idle;
      g.pop += 1;
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
      const g = w.g;
      if (i.action === 0) { g.idle += 1; i.idleorder = g.idle; }
      const keep = { act: i.action, gol: i.goldwork, sto: i.stonework, woo: i.woodwork, foo: i.foodwork,
                     dix: i.dirox, diy: i.diroy };
      if (!w.placeFree(i, i.x, i.y)) {
        const n = w.create(OM, i.x + 50, i.y - 20);
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
}

// Alarm_10 [C]: verso la bandiera dell'edificio che l'ha creato, con il
// lavoro dato da cosa c'e' sotto la bandiera.
function rallyOmino(p) {
  return (i, w) => {
    const g = w.g;
    for (const k of ["stonework", "goldwork", "woodwork", "foodwork", "buildwork"]) if (i[k] === 2) i[k] = 0;
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
    // azione 2: flow field verso la bandiera
    p.free(i);
    goTo(p, i, i.flaggox, i.flaggoy);
  };
}

// --------------------------------------------------------------- Step

function ominoStep(i, w, p, stop) {
  const g = w.g, input = w.input;
  const nearest = (n, x = i.x, y = i.y) => w.nearest(x, y, n);
  const num = (n) => w.number(n);

  // azione 1: tasto sinistro (i civili non contano in milsel)
  if (i.hover === 1 && input.mouseReleased[0]) {
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
    if (i.action === 0) g.idle -= 1;
    const corpse = w.create("omino_corpse", i.x, i.y);
    w.destroy(i);
    g.pop -= 1;
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
    i.action = 0; i.creation = 0; p.occupy(i); i.speed = 0; g.idle += 1;
  }
  if (i.action === 1 && i.woodwork === 1 && i.x === i.dirox && i.y === i.diroy
      && pointDistance(i.woodx, i.woody, i.dirox, i.diroy) > 20 && num("albero") > 0) {
    const t = nearest("albero");
    i.action = 1; i.dirox = t.x; i.diroy = t.y; i.woodwork = 1; i.alarm.set(0, 13);
    i.woodx = i.dirox; i.woody = i.diroy;
  }
  // azione 7: sprite
  ANIM[OM](i, w);
  // azione 8: rettangolo di selezione
  if (g.multi === 1 && g.sele === 0) {
    const mx = w.mouse.x, my = w.mouse.y;
    const inside = (i.x > g.startx && i.x < mx && i.y > g.starty && i.y < my)
      || (i.x < g.startx && i.x > mx && i.y > g.starty && i.y < my)
      || (i.x > g.startx && i.x < mx && i.y < g.starty && i.y > my)
      || (i.x < g.startx && i.x > mx && i.y < g.starty && i.y > my);
    if (inside) { if (i.selected === 0) g.sel += 1; i.selected = 1; }
    else { if (i.selected === 1) g.sel -= 1; i.selected = 0; }
  }
  // azione 9: punto d'arrivo occupato (solo senza lavoro)
  if (i.action === 1 && !i.buildwork && !i.stonework && !i.foodwork && !i.woodwork && !i.goldwork && !i.fieldwork
      && !w.placeEmpty(i, i.dirox, i.diroy)) {
    if (i.creation === 0) {
      const dir = pointDirection(i.dirox, i.diroy, i.x, i.y);
      i.dirox += lengthdirX(50, dir);
      i.diroy += lengthdirY(50, dir);
    } else {
      i.dirox += irandomRange(-32, 32);
      i.diroy += irandomRange(-32, 32);
    }
  }
  // azione 10: ai depositi e ritorno
  depositStep(i, w, p, stop);
  // azione 11: "posto occupato (legacy?)"
  if (i.action === 1 && !i.woodwork && !i.goldwork && !i.foodwork && !i.stonework && !i.buildwork && !i.fieldwork
      && !w.placeFree(i, i.dirox, i.diroy)) {
    i.dirox += irandomRange(-30, 30);
    i.diroy += irandomRange(-30, 30);
  }
  // azione 12: ordine dei civili inattivi (per il tasto Spazio)
  if (i.action === 0 && i.idling === 0) { i.idling = 1; i.idleorder = g.idle; }
  if (i.action !== 0 && i.idling === 1) {
    i.idling = 0;
    const orderr = i.idleorder;
    i.idleorder = 0;
    for (const o of w.all(OM)) if (o.idleorder > orderr) o.idleorder -= 1;
  }
  // azione 13
  if (num("torre_placer") > 0) g.sele = 1;
  // azione 14: movimento
  ominoMove(i, w, p);
  // azione 15: seminare un campo alla volta
  if (i.fieldwork === 1 && w.instancePlace(i, i.buildx, i.buildy, OM)) {
    i.action = 0; i.fieldwork = 0; i.dirox = i.x; i.diroy = i.y; p.occupy(i); g.idle++; i.speed = 0;
  }
  // azione 16: lavoro
  if (workStep(i, w, p, stop) === "exit") return;
  // annullamento del timer per fermarsi
  if (i.stonework || i.goldwork || i.woodwork || i.foodwork || i.buildwork || i.repairwork || i.action !== 1 || i.fieldwork) {
    i.alarm.set(8, -1);
  }
}

// azione 14 [C]: flow field se lontano (300, o 100 se sta andando a una
// risorsa) o sovrapposto; da vicino mp_potential_step verso la cosa giusta.
function ominoMove(i, w, p) {
  const n = (name, x = i.x, y = i.y) => w.nearest(x, y, name);
  const mp = (t) => { if (t) mpPotentialStep(w, i, t.x, t.y, i.autospeed); };
  const workreach = (i.goldwork > 0 || i.stonework > 0 || i.woodwork > 0) ? 200 : 0;
  if (i.action === 1) {
    if (pointDistance(i.x, i.y, i.dirox, i.diroy) > 300 - workreach || !w.placeFree(i, i.x, i.y)) {
      const otro = w.instancePlace(i, i.x, i.y, "ally_unit");
      if (otro) {
        if (otro.ordo > i.ordo || otro.action !== 1) moveFlowField(w, p, i);
        else { i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); }
      } else moveFlowField(w, p, i);
    } else {
      if (!i.goldwork && !i.stonework && !i.buildwork && !i.repairwork && i.foodwork !== 2 && !i.fieldwork) {
        mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
      }
      if (i.goldwork === 1) mp(n("miniera_oro"));
      if (i.stonework === 1) mp(n("stone_parent"));
      if (i.buildwork === 1) mp(n("ally_fondamenta", i.buildx, i.buildy));
      if (i.repairwork === 1) mp(n("ally_build", i.repx, i.repy));
      if (i.fieldwork === 1) {
        const f = n("campo_fond", i.buildx, i.buildy);
        mp(f);
        if (f) { i.dirox = f.x; i.diroy = f.y; }
      }
      if (i.foodwork === 2) mp(n("ally_barn", i.dirox, i.diroy));
      if (i.goldwork === 2 || i.stonework === 2) mp(n("ally_magazza", i.dirox, i.diroy));
    }
  }
  // Ricalcolo se la destinazione e' occupata.
  // [Correzione decisa dall'autore, §3.4 n.14] l'originale crea qui anche
  // un legno_prizedrawer (l'icona "+legno" che sale): resto di debug.
  if (p.costAt(Math.trunc(i.goal_x / GRID), Math.trunc(i.goal_y / GRID)) >= 1000 && !i.buildwork && !i.repairwork
      && i.action === 1 && !i.goldwork && !i.woodwork && !i.stonework) {
    p.free(i);
    goTo(p, i, i.dirox, i.diroy);
  }
}

// azione 10 [C]: legno, oro e pietra: a 10 si va al deposito
// (ally_magazza: centro o magazzino) e poi si torna alla risorsa.
function depositStep(i, w, p, stop) {
  const g = w.g;
  const n = (name) => w.nearest(i.x, i.y, name);
  const num = (name) => w.number(name);
  const toMagazza = () => {
    const m = n("ally_magazza");
    i.action = 1; p.free(i); i.dirox = m.x; i.diroy = m.y;
    i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
  };
  // legno
  if (i.action === 2 && i.wood >= 10) {
    if (num("ally_magazza") > 0) {
      toMagazza();
      generateFields(p, i, i.dirox, i.diroy);
      i.alarm.set(0, 13);
      i.woodwork = 2;
    } else { i.action = 0; i.woodwork = 0; i.step = 0; i.speed = 0; g.idle += 1; }
  }
  if (w.distanceToObject(i, "ally_magazza") < 10) {
    g.wood += i.wood;
    i.wood = 0;
    if (i.woodwork === 2) {
      if (num("albero") > 0) {
        const t = n("albero");
        i.action = 1; p.free(i); i.dirox = t.x; i.diroy = t.y;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        generateFields(p, i, i.dirox, i.diroy);
        i.woodwork = 1; i.alarm.set(0, 13); i.woodx = i.dirox; i.woody = i.diroy;
      } else { i.action = 0; i.woodwork = 0; i.step = 0; i.speed = 0; g.idle += 1; }
    }
  }
  // oro
  if (i.action === 3 && i.gold >= 10) {
    if (num("ally_magazza") > 0) {
      toMagazza();
      if (i.goldwork !== 2) scrMove(p, i, i.dirox, i.diroy);
      i.alarm.set(0, 13);
      i.goldwork = 2;
    } else { stop(i, w); i.woodwork = 0; }
  }
  if (w.distanceToObject(i, "ally_magazza") < 10) {
    g.gold += i.gold;
    i.gold = 0;
    const mine = n("miniera_oro");
    const visoro = !!(mine && mine.visible);
    if (i.goldwork === 2) {
      if (num("miniera_oro") > 0 && visoro) {
        i.action = 1; p.free(i); i.dirox = mine.x; i.diroy = mine.y;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        if (i.goldwork !== 1) scrMove(p, i, i.dirox, i.diroy);
        i.goldwork = 1; i.alarm.set(0, 13); i.goldx = i.dirox; i.goldy = i.diroy;
      } else { stop(i, w); i.goldwork = 0; }
    }
  }
  // pietra [Difetto §3.4 n.15, riprodotto] senza depositi l'originale
  // azzera goldwork invece di stonework
  if (i.action === 5 && i.stone >= 10) {
    if (num("ally_magazza") > 0) {
      toMagazza();
      if (i.stonework !== 2) scrMove(p, i, i.dirox, i.diroy);
      i.alarm.set(0, 13);
      i.stonework = 2;
    } else { stop(i, w); i.goldwork = 0; }
  }
  if (w.distanceToObject(i, "ally_magazza") < 10) {
    g.stone += i.stone;
    i.stone = 0;
    const st = n("stone_parent");
    const vispietr = !!(st && st.visible);
    if (i.stonework === 2) {
      if (num("stone_parent") > 0 && vispietr) {
        i.action = 1; p.free(i); i.dirox = st.x; i.diroy = st.y;
        i.target_angle = pointDirection(i.x, i.y, i.dirox, i.diroy);
        if (i.stonework !== 1) scrMove(p, i, i.dirox, i.diroy);
        i.stonework = 1; i.alarm.set(0, 13); i.stonex = i.dirox; i.stoney = i.diroy;
      } else { stop(i, w); i.stonework = 0; }
    }
  }
}

// azione 16 [C]: arrivati alla risorsa (bbox a meno di 20 px, 15 per la
// pietra, e cella libera) si comincia a lavorare.
function workStep(i, w, p, stop) {
  const g = w.g;
  const n = (name, x = i.x, y = i.y) => w.nearest(x, y, name);
  const num = (name) => w.number(name);
  const cellFree = () => p.costAt(Math.trunc(i.x / GRID), Math.trunc(i.y / GRID)) < 1000;
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
        scrMove(p, i, i.dirox, i.diroy);
        i.woodwork = 1; i.alarm.set(0, 13); i.woodx = i.dirox; i.woody = i.diroy;
      }
    }
    if (num("albero") <= 0) { stop(i, w); i.buildwork = 0; i.woodwork = 0; }
  }
  // oro
  if (i.goldwork === 1 && w.distanceToInstance(i, n("miniera_oro", i.goldx, i.goldy)) < 20 && cellFree()) {
    i.goldwork = 0;
    begin(3, i.goldx, i.goldy);
  }
  if (i.action === 3) {
    if (num("miniera_oro") > 0) {
      const t = n("miniera_oro", i.goldx, i.goldy);
      if (pointDistance(i.goldx, i.goldy, t.x, t.y) > 10) {
        const t2 = n("miniera_oro");
        i.action = 1; p.free(i); i.dirox = t2.x; i.diroy = t2.y;
        i.goldwork = 1; i.alarm.set(0, 13); i.goldx = i.dirox; i.goldy = i.diroy;
      }
    }
    if (num("miniera_oro") <= 0) { stop(i, w); i.buildwork = 0; i.goldwork = 0; }
  }
  // pietra
  if (i.stonework === 1 && w.distanceToInstance(i, n("stone_parent", i.stonex, i.stoney)) < 15 && cellFree()) {
    i.stonework = 0;
    begin(5, i.stonex, i.stoney);
  }
  if (i.action === 5) {
    if (num("stone_parent") > 0) {
      const t = n("stone_parent", i.stonex, i.stoney);
      if (pointDistance(i.stonex, i.stoney, t.x, t.y) > 10) {
        const t2 = n("stone_parent");
        i.action = 1; p.free(i); i.dirox = t2.x; i.diroy = t2.y;
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

// azione 16, parte "costruzione", "riparazione" e "fine costruzione" [C].
// (La coltivazione dei campi, action 8, arriva col punto 3c.)
function buildStep(i, w, p) {
  const g = w.g;
  const fondNear = () => w.nearest(i.buildx, i.buildy, "ally_fondamenta");
  const clearLoads = () => { i.wood = 0; i.food = 0; i.gold = 0; i.stone = 0; i.step = 0; i.alarm.set(2, 13); };
  // costruzione: l'else e' agganciato a "ci sono cantieri" [C]
  if (i.buildwork === 1) {
    if (w.number("ally_fondamenta") > 0) {
      if (w.distanceToInstance(i, fondNear()) < 10) {
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
  // riparazione
  if (i.repairwork === 1 && w.distanceToInstance(i, w.nearest(i.repx, i.repy, "ally_build")) < 5) {
    i.repairwork = 0;
    p.occupy(i);
    i.action = 7;
    clearLoads();
    i.direction = pointDirection(i.x, i.y, i.repx, i.repy);
  }
  // fine costruzione: il cantiere e' finito (non c'e' piu' a 40 px):
  // al prossimo cantiere, o fermi se non ce ne sono
  if (i.action === 6) {
    if (w.number("ally_fondamenta") > 0) {
      if (w.distanceToInstance(i, fondNear()) > 40) {
        i.action = 1;
        p.free(i);
        const f = w.nearest(i.x, i.y, "ally_fondamenta");
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
  return null;
}

// Vita aggiunta al cantiere a ogni scatto di Alarm_2 (ogni 13 passi), per
// slife [C]: le costruzioni grandi +1, casa/magazzino/mulino +2, i tratti
// di mura (799) e il campo (100) +5.
const BUILD_RATE = { 329: 1, 899: 1, 349: 1, 299: 1, 379: 1, 139: 2, 119: 2, 149: 2, 799: 5, 100: 5 };

// Alarm_2, azioni 6 e 7 [C]: a differenza della raccolta, il cantiere
// cresce a ogni scatto (non solo al terzo); il ciclo dei tre step serve
// solo all'animazione.
function otherWorkTick(i, w) {
  const g = w.g;
  if (i.action === 6) {
    const f = w.nearest(i.buildx, i.buildy, "ally_fondamenta");
    if (f && f.fondazione === 1) {
      f.life += BUILD_RATE[f.slife] || 0;
      if (f.life > f.slife) f.life = f.slife;
    }
  } else if (i.action === 7) {
    // riparazione: 1 pietra o 1 legno per punto di vita; il legno spegne
    // anche il fuoco (le particelle arriveranno col loro sistema)
    const b = w.nearest(i.repx, i.repy, "ally_build");
    if (b && b.pietra === 1 && g.stone > 0) {
      g.stone--; b.life++;
      if (b.life > b.slife) b.life = b.slife;
    }
    if (b && b.legno === 1 && g.wood > 0) {
      g.wood--; b.life++;
      b.onfire = 0;
      if (b.firestarted === 1) b.firestarted = 0;
      if (b.life > b.slife) b.life = b.slife;
    }
  } else return;
  i.step = i.step === 0 ? 1 : i.step === 1 ? 2 : 0;
  i.alarm.set(2, 13);
}

// Campi e semina (punto 3c): segnaposto finche' non arrivano campo e campo_fond.
function fieldsStep() { return null; }

// --------------------------------------------------------------- disegno

// Draw_End [C]: barra della vita lunga quanto la vita (50 px), non in
// proporzione come per i soldati; segnaposto sulla risorsa di destinazione.
function ominoDrawEnd(i, w, d) {
  const black = 0, green = 0x008000;
  const bar = () => {
    d.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, black, black, black, black, false);
    d.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + i.life, i.y - 82, green, green, green, green, false);
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
  if (i.hover === 1) bar();
  void unitDrawEnd;
}

// Draw_GUI [C]: scheda del civile con i 10 pulsanti di costruzione e cio' che
// trasporta.
function ominoPanel(i, w, d) {
  if (i.selected !== 1 || w.g.sel >= 2) return;
  const white = 0xffffff;
  d.setAlpha(0.69);
  d.roundrectColourExt(260, 20, 390, 150, 60, 60, white, white, false);
  for (const x of [450, 520, 590, 660, 730]) for (const y of [50, 120]) d.circleColour(x, y, 30, white, white, false);
  d.setFont("GUI_1");
  d.setColour(0);
  d.setAlpha(0.75);
  d.setValign("middle");
  d.setHalign("center");
  d.text(325, 120, i.life + " / " + i.slife);
  d.setAlpha(1);
  const ico = (s, x, y) => d.spriteExt(s, 0, x, y, 0.5, 0.5, 0, white, 1);
  ico("ico_casa", 450, 50); ico("ico_torre", 450, 120); ico("ico_magazzino", 520, 50); ico("ico_barn", 590, 50);
  ico("ico_corn", 660, 50); ico("ico_mura", 520, 120); ico("ico_caserma", 590, 120); ico("ico_stalla", 660, 120);
  ico("ico_castello", 730, 120); ico("ico_chiesa", 730, 50);
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
  const u = w.nearest(i.x, i.y, "ally_unit"), b = w.nearest(i.x, i.y, "ally_build");
  if ((u && w.distanceToInstance(i, u) < dist) || (b && w.distanceToInstance(i, b) < dist)
      || (fogAware && w.g.fogville === 0)) i.visible = true;
}

// Destroy delle risorse [C]: le celle occupate tornano libere.
function freeCells(p, i) { p.markInstance(i, 1); }

export function resource(p, kind) {
  const cfg = {
    albero: { amount: ["wood", 150], work: "woodwork", hover: "alberhover", dist: 600, fog: true, dying: "albero_morente", centroDir: "woodir" },
    albero_fake: { amount: ["wood", 150], work: "woodwork", hover: null, dist: 600, fog: true, dying: null },
    miniera_oro: { amount: ["gold", 2500], work: "goldwork", hover: "minierahover", dist: 400, fog: false, dying: "miniera_morente", centroDir: "goldir" },
    pietra_grande: { amount: ["stone", 850], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "pietra_grande_morente", centroDir: "stonedir" },
    pietr_piccolo: { amount: ["stone", 450], work: "stonework", hover: "stonehover", dist: 400, fog: false, dying: "pietr_piccolo_morente", centroDir: "stonedir" },
  }[kind];
  const ALB = ["alb1", "alb2", "alb3", "alb4", "alb5", "alb6", "alb7", "alb8"];
  return {
    create(i, w) {
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
    mouseEnter(i, w) { if (cfg.hover) w.g[cfg.hover] = 1; },
    mouseLeave(i, w) { if (cfg.hover) w.g[cfg.hover] = 0; },
    // Draw_End [C]: albero il cerchio di selezione; miniera il luccichio
    // (miniera_blink) che compare in un punto a caso e sfuma; pietre niente.
    drawEnd(i, w, d) {
      if (kind === "miniera_oro") d.spriteExt("miniera_blink", 0, i.blinkx, i.blinky, 1, 1, 0, 0xffffff, i.blinkfade);
      else if ((kind === "albero" || kind === "albero_fake") && i.selected === 1) d.sprite("circ_1", 0, i.x, i.y);
    },
    drawGUI(i, w, d) {
      if (i.selected !== 1 || w.g.sel >= 1) return;
      const icon = { albero: "ico_albero", albero_fake: "ico_albero", miniera_oro: "ico_miniera",
                     pietra_grande: "ico_ruin", pietr_piccolo: "ico_ruin" }[kind];
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
