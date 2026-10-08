// Produzione di unita' militari: la coda di caserma, stalla e castello, i
// pulsanti delle unita' (*_clicker) e l'annullamento (*_indietro_clicker).
// Trascrizione di <edificio> Alarm_0/Alarm_1, Step, Draw_GUI, Draw_End,
// Mouse_*; dei *_clicker e *_indietro_clicker.
//
// La coda [C]: coda0 e' l'unita' in produzione, coda1..coda6 quelle in
// attesa (1, 2, 3 = tipo, 0 = vuoto), `coda` quante sono in attesa. La
// stalla produce un solo tipo e conta soltanto. `progression` va da 1 a
// 100: +1 ogni 12 passi in caserma e stalla (20 s), ogni 30 nel castello
// (50 s).
//
// "nada" e "nope" (bandiera assente) non sono definite da nessuna parte:
// sono variabili mai assegnate, cioe' 0 [I, §1.3]. Qui la bandiera
// assente e' 0 come nell'originale.

import { tr } from "./i18n.js";
import { rallySpot } from "./pathing.js";

const WHITE = 0xffffff, GREEN = 0x008000, BLACK = 0;

// Dati [C]: *_clicker (posizione, tasto, costo, scheda),
// caserma_indietro_clicker (rimborso), caserma Draw_GUI (icone).
export const PRODUCERS = {
  caserma: {
    ico: "ico_caserma", cancel: "caserma_indietro_clicker", cancelKey: 82, cancelX: 660, icoScale: 0.6,
    // [Correzione decisa dall'autore, §3.9 n.32] period 1 era un valore di
    // prova: 12 passi per punto, ~1200 passi (20 s) per unita'
    alarm: 0, period: 12, start: 13, next: 9, popMargin: 1, popWait: 30, slots: true, spawn: "flag",
    units: {
      1: { obj: "ally_warrior", clicker: "warrior_clicker", ico: "ico_guerriero", bx: 450, key: 81,
           cost: { food: 75, gold: 35 }, title: "Warrior", desc: "Melee fighter good against all units.",
           costs: [["75", "ico_food"], ["35", "ico_gold"]], shortcut: "Shortcut: Q" },
      // [Correzione decisa dall'autore §1.6 n.2] l'annullamento rimborsava
      // 55 cibo e 45 ORO: qui quanto pagato, 55 cibo e 45 legno
      2: { obj: "ally_picchiere", clicker: "picchiere_clicker", ico: "ico_picchiere", bx: 520, key: 87,
           cost: { food: 55, wood: 45 }, title: "Pikeman", desc: "Melee unit good against cavalry.",
           costs: [["55", "ico_food"], ["45", "ico_wood"]], shortcut: "Shortcut: W" },
      3: { obj: "ally_arciere", clicker: "arciere_clicker", ico: "ico_arciere", bx: 590, key: 69,
           cost: { wood: 40, gold: 55 }, title: "Archer", desc: "Ranged unit good against all units.",
           costs: [["40", "ico_wood"], ["55", "ico_gold"]], shortcut: "Shortcut: E" },
    },
  },
  // stalla [C]: solo il cavaliere (3 di popolazione), nessuno slot
  stalla: {
    ico: "ico_stalla", cancel: "stalla_indietro_clicker", cancelKey: 87, cancelX: 520, icoScale: 0.7,
    alarm: 0, period: 12, start: 20, next: 15, popMargin: 2, popWait: 15, slots: false, spawn: "flag",
    units: {
      1: { obj: "ally_cavaliere", clicker: "cavaliere_clicker", ico: "ico_cavaliere", bx: 450, key: 81,
           cost: { food: 50, gold: 70 }, title: "Knight", desc: "Fast unit, great against archers.",
           costs: [["50", "ico_food"], ["70", "ico_gold"]], shortcut: "Shortcut: Q", pop: "3" },
    },
  },
  // castello [C]: produzione sull'alarm 1 (l'alarm 0 sono le frecce); le
  // unita' nascono a x+200, y+100 e vanno alla bandiera (o a x+150, y+100).
  // Il tipo 3 (arciere) non ha un pulsante: non si produce mai.
  // [Correzione decisa dall'autore, §3.12 n.46] l'annullamento rimborsava
  // PIETRA al posto dell'oro (30 per l'ariete, 100 per la catapulta): qui
  // quanto pagato.
  castello: {
    ico: "ico_castello", cancel: "castello_indietro_clicker", cancelKey: 69, cancelX: 590, icoScale: 0.7,
    alarm: 1, period: 30, start: 30, next: 30, popMargin: 2, popWait: 30, slots: true, spawn: "castle",
    units: {
      // [Correzione decisa dall'autore §1.6 n.1] col tasto Q l'ariete
      // costava 30 oro invece di 60
      1: { obj: "ally_ariete", clicker: "ariete_clicker", ico: "ico_ariete", bx: 450, key: 81,
           cost: { wood: 250, gold: 60 }, title: "Siege Ram",
           desc: "Siege melee unit great against stone buildings.", costs: [["250", "ico_wood"], ["60", "ico_gold"]],
           shortcut: "Shortcut: Q", pop: "3", wide: true },
      2: { obj: "ally_catapulta", clicker: "catapulta_clicker", ico: "ico_catapulta", bx: 520, key: 87,
           cost: { wood: 200, gold: 100 }, title: "Catapult",
           desc: "Ranged siege unit good against all buildings.", costs: [["200", "ico_wood"], ["100", "ico_gold"]],
           shortcut: "Shortcut: W", pop: "3", wide: true },
      3: { obj: "ally_arciere", ico: "ico_arciere", cost: { wood: 40, gold: 55 } },
    },
  },
};

const SLOTS = ["coda0", "coda1", "coda2", "coda3", "coda4", "coda5", "coda6"];

// `with(x){if hover=1 var h=1 else var h=0}`: vale l'ultima istanza [I]
function lastHover(w, name) {
  let h = 0;
  for (const c of w.all(name)) h = c.hover === 1 ? 1 : 0;
  return h;
}

// scr_find_free_cell_spiral64 [C]: spirale su celle "da 64" a partire
// dalla bandiera; il primo passo della spirale avviene prima del primo
// controllo, la cella della bandiera non e' mai provata.
// [Correzione decisa dall'autore, §3.9 n.33] l'originale leggeva la
// griglia dei costi (celle da 32) con gli indici da 64, cioe' un altro
// punto della mappa: qui si legge la cella da 32 che contiene il centro
// della cella da 64.
function spiral64(p, ax, ay) {
  const cs = 64;
  let gx = Math.floor(ax / cs), gy = Math.floor(ay / cs);
  let stepLen = 1, dir = 0, done = 0, changes = 0;
  for (let attempts = 0; attempts < 1000; attempts++) {
    if (dir === 0) gx++; else if (dir === 1) gy++; else if (dir === 2) gx--; else gy--;
    done++;
    const fx = gx * cs + cs / 2, fy = gy * cs + cs / 2;
    const cx = Math.floor(fx / 32), cy = Math.floor(fy / 32);
    if (p.inside(cx, cy) && p.cost[cy * p.gw + cx] < 1000) return [fx, fy];
    if (done >= stepLen) {
      done = 0;
      dir = (dir + 1) % 4;
      changes++;
      if (changes % 2 === 0) stepLen++;
    }
  }
  const clamp = (v, hi) => Math.max(0, Math.min(v, hi));
  return [clamp(ax, (p.gw - 1) * cs + cs / 2), clamp(ay, (p.gh - 1) * cs + cs / 2)];
}

// L'edificio che produce: si aggiunge al comportamento dell'edificio finito
// (built in buildings.js), che resta responsabile di vita, rovina, fuoco,
// riparazione e selezione.
export function producer(name, base, p) {
  const P = PRODUCERS[name], types = Object.values(P.units).filter((u) => u.clicker);
  const buttons = [...types.map((u) => u.clicker), P.cancel];
  return {
    ...base,
    create(i, w) {
      base.create(i, w);
      Object.assign(i, { flagx: 0, flagy: 0, coda: 0, progression: 0 });
      for (const s of SLOTS) i[s] = 0;
    },
    step(i, w) {
      base.step(i, w);
      if (!i.alive) return;
      // pulsanti di selezione
      if (i.selected === 1 && w.number(types[0].clicker) === 0) for (const n of buttons) w.create(n, 0, 0);
    },
    // Alarm di produzione [C]: avanzamento e nascita
    ["alarm" + P.alarm](i, w) {
      const g = w.g;
      let ax, ay;
      if (P.spawn === "castle") {
        ax = i.flagx !== 0 ? i.flagx : i.x + 150;
        ay = i.flagx !== 0 ? i.flagy : i.y + 100;
      } else {
        ax = i.flagx !== 0 ? i.flagx : 0; ay = i.flagx !== 0 ? i.flagy : 0;
        if (w.pointIn(i, ax, ay)) { ax = 0; ay = 0; } // bandiera sull'edificio: nessuna
      }
      const sx = ax > i.x ? 1 : -1, sy = ay > i.y ? 1 : -1;
      if (i.progression < 100 && i.progression !== 0) { i.progression += 1; i.alarm.set(P.alarm, P.period); }
      if (i.progression < 100) return;
      if (g.pop + P.popMargin >= g.popcap) { i.alarm.set(P.alarm, P.popWait); w.create("pop_blink", 0, 0); return; }
      i.progression = 0;
      if (i.coda > 0) { i.coda -= 1; i.alarm.set(P.alarm, P.next); i.progression = 1; }
      const u = P.slots ? P.units[i.coda0] : P.units[1];
      if (u && P.spawn === "castle") {
        // l'arciere riceve alarm[1] (il doppio clic) invece di alarm[0]: tipo
        // mai prodotto, riprodotto
        const n = w.create(u.obj, i.x + 200, i.y + 100);
        n.alarm.set(u.obj === "ally_arciere" ? 1 : 0, 13);
        n.dirox = ax; n.diroy = ay; n.action = 1;
      } else if (u) {
        const n = w.create(u.obj, i.x + 20 * sx, i.y + 10 * sy);
        if (ax !== 0) {
          n.alarm.set(10, 10);
          n.creation = 1;
          // [§7.10] un posto libero e non gia' promesso a un'altra unita'
          // appena prodotta; se non c'e', la spirale dell'originale
          [n.flaggox, n.flaggoy] = rallySpot(w, w.path, n, ax, ay) || spiral64(w.path, ax, ay);
        } else w.path.occupy(n);
      }
      if (P.slots) for (let k = 0; k < 6; k++) i[SLOTS[k]] = i[SLOTS[k + 1]];
    },
    // Draw_End [C]: la bandiera di raccolta (dal punto di uscita) e la vita.
    // [Richiesta dell'autore] bandierina animata e linea tratteggiata, la
    // linea a terra sotto l'edificio (Draw.rallyLine e rallyFlag) invece di
    // freccia e linea piena
    drawBelow(i, w, d) {
      if (i.flagx !== 0 && i.flagy !== 0 && i.selected === 1) {
        const [fx, fy] = P.spawn === "castle" ? [i.x + 150, i.y + 100] : [i.x, i.y];
        d.rallyLine(fx, fy, i.flagx, i.flagy);
      }
    },
    drawEnd(i, w, d) {
      if (i.flagx !== 0 && i.flagy !== 0 && i.selected === 1) d.rallyFlag(i.flagx, i.flagy, w._stepNo);
      if (base.drawEnd) base.drawEnd(i, w, d);
    },
    globalLeftPressed(i, w) {
      if (buttons.every((n) => lastHover(w, n) !== 1)) {
        i.selected = 0;
        for (const n of buttons) for (const c of w.all(n)) w.destroy(c);
      }
    },
    globalRightReleased(i, w) { if (i.selected === 1) { i.flagx = w.mouse.x; i.flagy = w.mouse.y; } },
    drawGUI(i, w, d) {
      if (i.selected !== 1) return;
      const sc = P.icoScale;
      d.setAlpha(0.69);
      for (const u of types) d.circleColour(u.bx, 50, 30, WHITE, WHITE, false);
      d.circleColour(P.cancelX, 50, 30, WHITE, WHITE, false);
      if (P.slots) {
        d.setAlpha(1);
        for (const u of types) d.spriteExt(u.ico, 0, u.bx, 50, sc, sc, 0, WHITE, 1);
        d.spriteExt("ico_indietro", 0, P.cancelX, 50, 0.7, 0.7, 0, WHITE, 1);
      }
      if (i.progression > 0) {
        d.setAlpha(0.69);
        d.roundrectColourExt(420, 90, 550, 150, 60, 60, WHITE, WHITE, false);
        d.roundrectColourExt(420, 90, 480 + (70 / 100) * i.progression, 150, 60, 60, GREEN, GREEN, false);
        // [Correzione decisa dall'autore, §6.1 n.79] la percentuale in nero:
        // nell'originale prendeva il colore rimasto dal disegno precedente
        d.setFont("GUI_1");
        d.setColour(BLACK);
        d.setValign("middle");
        d.setAlpha(0.7);
        d.setHalign("center");
        d.text(520, 120, i.progression + "%");
        d.setAlpha(0.69);
      }
      d.setAlpha(0.69);
      d.roundrectColourExt(260, 20, 390, 150, 60, 60, WHITE, WHITE, false);
      d.setFont("GUI_1");
      d.setColour(BLACK);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("center");
      d.text(325, 120, i.life + " / " + i.slife);
      d.setAlpha(1);
      if (P.slots) {
        if (i.progression > 0 && P.units[i.coda0]) d.spriteExt(P.units[i.coda0].ico, 0, 450, 120, sc, sc, 0, WHITE, 1);
      } else {
        // stalla [C]: icone come il centro, quella in produzione a 0,4
        d.spriteExt(types[0].ico, 0, 450, 50, sc, sc, 0, WHITE, 1);
        d.spriteExt("ico_indietro", 0, P.cancelX, 50, 0.7, 0.7, 0, WHITE, 1);
        if (i.progression > 0) { d.setAlpha(0.4); d.spriteExt(types[0].ico, 0, 450, 120, sc, sc, 0, WHITE, 1); }
      }
      d.setAlpha(1);
      d.sprite(P.ico, 0, 325, 70);
      for (let k = 1; k <= 6; k++) {
        if (i.coda < k) continue;
        d.setAlpha(0.69);
        d.circleColour(590 + 70 * (k - 1), 120, 30, WHITE, WHITE, false);
        d.setAlpha(1);
        const u = P.slots ? P.units[i[SLOTS[k]]] : types[0];
        if (u) d.spriteExt(u.ico, 0, 590 + 70 * (k - 1), 120, sc, sc, 0, WHITE, 1);
      }
    },
  };
}

// ------------------------------------------------------- pulsanti

// Step azione 3 dei pulsanti di produzione [C]: global.sele=1 col
// puntatore sopra il pulsante (un clic li' non deseleziona), 0 altrimenti.
// [Correzione decisa dall'autore, §3.9 n.35] l'originale scriveva 0 a ogni
// passo da ogni pulsante (vinceva l'ultimo creato, e Ctrl/Alt non
// funzionavano finche' l'edificio era selezionato): qui un pulsante rimette
// 0 solo se l'1 l'aveva messo lui.
function buttonSele(i, w) {
  const mx = w.mouse.x, my = w.mouse.y;
  if (mx > i.x - 30 && mx < i.x + 30 && my > i.y - 30 && my < i.y + 30) { w.g.sele = 1; i.ownSele = true; }
  else if (i.ownSele) { w.g.sele = 0; i.ownSele = false; }
}

// warrior_clicker e simili [C]: clic (in Step, col tasto rilasciato sopra)
// o tasto. Paga e mette in coda nell'edificio selezionato; con la coda
// vuota parte subito (alarm 13). La popolazione si controlla con +1 anche
// se l'unita' ne occupa 2.
function enqueue(w, prod, type, u) {
  const g = w.g, P = PRODUCERS[prod];
  let ok = 0; // var ok dentro with: vale l'ultimo edificio visitato
  for (const b of w.all(prod)) if (b.selected === 1) ok = b.coda < 6 ? 1 : 0;
  if (u.cost.food && g.food < u.cost.food) w.create("food_blink", 0, 0);
  if (u.cost.gold && g.gold < u.cost.gold) w.create("gold_blink", 0, 0);
  if (u.cost.wood && g.wood < u.cost.wood) w.create("wood_blink", 0, 0);
  if (g.pop + P.popMargin >= g.popcap) w.create("pop_blink", 0, 0);
  if (!(ok === 1 && Object.entries(u.cost).every(([r, v]) => g[r] >= v) && g.pop + P.popMargin < g.popcap)) return null;
  for (const [r, v] of Object.entries(u.cost)) g[r] -= v;
  for (const b of w.all(prod)) {
    if (b.selected !== 1) continue;
    if (!P.slots) {
      // stalla [C]: parte (alarm 20) o si accoda
      if (b.progression === 0) { b.alarm.set(P.alarm, P.start); b.progression = 1; return "exit"; }
      b.coda += 1;
      continue;
    }
    if (b.progression !== 0) b.coda += 1;
    if (b.progression === 0 && b.coda === 0) b.coda0 = type;
    if (b.coda >= 1 && b.coda <= 6) b[SLOTS[b.coda]] = type;
    if (b.progression === 0) { b.alarm.set(P.alarm, P.start); b.progression = 1; return "exit"; }
  }
  return null;
}

export function unitClicker(prod, type) {
  const u = PRODUCERS[prod].units[type];
  return {
    create(i) { i.active = 0; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      // azione 1: clic; exit dentro with salta anche mouse_clear [C]
      if (i.hover === 1 && w.input.mouseReleased[0]) {
        if (enqueue(w, prod, type, u) !== "exit") w.mouseClear(0);
      }
      // azione 2: posizione
      w.setPos(i, c.x + u.bx * g.scaleview, c.y + 50 * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
      buttonSele(i, w);
    },
    ["keyPress" + u.key](i, w) { enqueue(w, prod, type, u); },
    destroy(i, w) { w.g.sele = 0; i.hover = 0; },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    drawGUI(i, w, d) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      d.setAlpha(0.69);
      const title = tr(u.title), desc = tr(u.desc), shortcut = tr("Shortcut: {key}", { key: u.shortcut.slice(-1) });
      const ex = d.panelExtra(370, title, desc, shortcut);
      d.tooltipBegin(w); // §6.1 n.85
      d.roundrectColourExt(20, H - 150, 370 + ex, H - 20, 60, 60, WHITE, WHITE, false);
      d.setAlpha(0.7);
      d.setHalign("left");
      d.text(40, H - 120, title);
      d.setFont("overdue");
      d.text(40, H - 90, desc);
      d.setFont("GUI_1");
      // ariete e catapulta [C]: costi piu' larghi (130, 210, 240)
      // [Segnalazione dell'autore, §8.15] ma la prima icona restava a 90: il
      // numero a tre cifre del legno ("250", "200") le finiva sopra. Ogni
      // icona sta ad almeno GAP px dal suo numero (misurato) e ogni numero ad
      // almeno 12 px dall'icona prima; dove c'e' gia' spazio, le posizioni di
      // prima.
      const [x2, x3, xm, xi] = u.wide ? [130, 210, 240, u.obj === "ally_catapulta" ? 180 : 170] : [120, 200, 230, 170];
      const GAP = 6, ICO = 15, MULTI = 16; // meta' larghezza (visibile) delle icone; ico_multi a 0,5
      const [n1, n2, n3] = [u.costs[0][0], u.costs[1][0], u.pop || "2"];
      const i1 = Math.max(90, 40 + d.stringWidth(n1) + GAP + ICO);
      const t2 = Math.max(x2, i1 + ICO + 12);
      const i2 = Math.max(xi, t2 + d.stringWidth(n2) + GAP + ICO);
      const t3 = Math.max(x3, i2 + ICO + 12);
      const i3 = Math.max(xm, t3 + d.stringWidth(n3) + GAP + MULTI);
      d.text(40, H - 50, n1);
      d.text(t2, H - 50, n2);
      d.text(t3, H - 50, n3);
      d.setAlpha(1);
      d.sprite(u.costs[0][1], 0, i1, H - 50);
      d.sprite(u.costs[1][1], 0, i2, H - 50);
      d.spriteExt("ico_multi", 0, i3, H - 50, 0.5, 0.5, 0, WHITE, 1);
      d.setAlpha(0.7);
      d.setHalign("right");
      d.text((u.wide ? 380 : 350) + ex, H - 120, shortcut);
      d.tooltipEnd(w);
      d.setAlpha(0.99);
      d.circleColour(u.bx, 50, 30, WHITE, WHITE, false);
      d.setAlpha(1);
      const sc = PRODUCERS[prod].icoScale;
      d.spriteExt(u.ico, 0, u.bx, 50, sc, sc, 0, WHITE, 1);
    },
  };
}

// caserma_indietro_clicker [C]: toglie l'ultima in coda (o ferma quella in
// produzione) e rimborsa il suo costo.
function cancelLast(w, prod) {
  const P = PRODUCERS[prod];
  for (const b of w.all(prod)) {
    if (b.selected !== 1 || b.progression === 0) continue;
    if (!P.slots) {
      // stalla [C]: nessun exit, vale per ogni stalla selezionata
      for (const [r, v] of Object.entries(P.units[1].cost)) w.g[r] += v;
      if (b.coda > 0) b.coda -= 1; else b.progression = 0;
      continue;
    }
    const slot = SLOTS[b.coda];
    const u = P.units[b[slot]];
    if (u) for (const [r, v] of Object.entries(u.refund || u.cost)) w.g[r] += v;
    b[slot] = 0;
    if (b.coda > 0) b.coda -= 1; else b.progression = 0;
    return; // exit
  }
}

export function cancelClicker(prod) {
  const P = PRODUCERS[prod];
  return {
    create(i) { i.active = 0; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      if (i.hover === 1 && w.input.mouseReleased[0]) { w.mouseClear(0); cancelLast(w, prod); }
      w.setPos(i, c.x + P.cancelX * g.scaleview, c.y + 50 * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
      buttonSele(i, w);
    },
    ["keyPress" + P.cancelKey](i, w) { cancelLast(w, prod); },
    destroy(i, w) { w.g.sele = 0; i.hover = 0; },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    drawGUI(i, w, d) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      d.setAlpha(0.69);
      const title = tr("Cancel"), sc = tr("Shortcut: {key}", { key: String.fromCharCode(P.cancelKey) });
      const ex = d.panelExtra(340, title, null, sc);
      d.tooltipBegin(w); // §6.1 n.85
      d.roundrectColourExt(20, H - 150, 340 + ex, H - 20, 60, 60, WHITE, WHITE, false);
      d.setAlpha(0.7);
      d.setHalign("left");
      d.text(40, H - 120, title);
      d.setFont("overdue");
      d.setValign("top");
      d.textExt(40, H - 100, tr("Cancel the last unit in the creation queue."), 30, 280 + ex);
      d.setValign("middle");
      d.setFont("GUI_1");
      d.setHalign("right");
      d.text(320 + ex, H - 120, sc);
      d.tooltipEnd(w);
      d.setAlpha(0.99);
      d.circleColour(P.cancelX, 50, 30, WHITE, WHITE, false);
      d.setAlpha(1);
      d.spriteExt("ico_indietro", 0, P.cancelX, 50, 0.7, 0.7, 0, WHITE, 1);
    },
  };
}
