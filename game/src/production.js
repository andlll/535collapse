// Produzione di unita' militari: la coda degli edifici (caserma; stalla e
// castello col punto 4d), i pulsanti delle unita' (*_clicker) e
// l'annullamento (*_indietro_clicker). Trascrizione di caserma Alarm_0,
// Step, Draw_GUI, Mouse_*; warrior/picchiere/arciere_clicker;
// caserma_indietro_clicker.
//
// La coda [C]: coda0 e' l'unita' in produzione, coda1..coda6 quelle in
// attesa (1, 2, 3 = tipo, 0 = vuoto), `coda` quante sono in attesa.
// `progression` va da 1 a 100, +1 a ogni passo (alarm[0]=1): un'unita' ogni
// ~113 passi (1,9 s) contro i ~1000 del centro (§3.9 n.32).
//
// "nada" e "nope" (bandiera assente) non sono definite da nessuna parte:
// sono variabili mai assegnate, cioe' 0 [I, §1.3]. Qui la bandiera
// assente e' 0 come nell'originale.

const WHITE = 0xffffff, GREEN = 0x008000, BLACK = 0;

// Dati [C]: *_clicker (posizione, tasto, costo, scheda),
// caserma_indietro_clicker (rimborso), caserma Draw_GUI (icone).
export const PRODUCERS = {
  caserma: {
    ico: "ico_caserma", cancel: "caserma_indietro_clicker", cancelKey: 82,
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
};

const SLOTS = ["coda0", "coda1", "coda2", "coda3", "coda4", "coda5", "coda6"];

// `with(x){if hover=1 var h=1 else var h=0}`: vale l'ultima istanza [I]
function lastHover(w, name) {
  let h = 0;
  for (const c of w.all(name)) h = c.hover === 1 ? 1 : 0;
  return h;
}

// scr_find_free_cell_spiral64 [C]: spirale su celle "da 64" a partire
// dalla bandiera, ma la cella si legge nella griglia dei costi da 32 con
// gli indici da 64: controlla un altro punto della mappa (§3.9 n.33,
// riprodotto). Il primo passo della spirale avviene prima del primo
// controllo: la cella della bandiera non e' mai provata.
function spiral64(p, ax, ay) {
  const cs = 64;
  let gx = Math.floor(ax / cs), gy = Math.floor(ay / cs);
  let stepLen = 1, dir = 0, done = 0, changes = 0;
  for (let attempts = 0; attempts < 1000; attempts++) {
    if (dir === 0) gx++; else if (dir === 1) gy++; else if (dir === 2) gx--; else gy--;
    done++;
    if (p.inside(gx, gy) && p.cost[gy * p.gw + gx] < 1000) return [gx * cs + cs / 2, gy * cs + cs / 2];
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
  const P = PRODUCERS[name], types = Object.values(P.units);
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
    // Alarm_0 [C]: avanzamento e nascita
    alarm0(i, w) {
      const g = w.g;
      let ax = i.flagx !== 0 ? i.flagx : 0, ay = i.flagx !== 0 ? i.flagy : 0;
      if (w.pointIn(i, ax, ay)) { ax = 0; ay = 0; } // bandiera sull'edificio: nessuna
      const sx = ax > i.x ? 1 : -1, sy = ay > i.y ? 1 : -1;
      if (i.progression < 100 && i.progression !== 0) { i.progression += 1; i.alarm.set(0, 1); }
      if (i.progression < 100) return;
      if (g.pop + 1 >= g.popcap) { i.alarm.set(0, 30); w.create("pop_blink", 0, 0); return; }
      i.progression = 0;
      if (i.coda > 0) { i.coda -= 1; i.alarm.set(0, 9); i.progression = 1; }
      const u = P.units[i.coda0];
      if (u) {
        const n = w.create(u.obj, i.x + 20 * sx, i.y + 10 * sy);
        if (ax !== 0) {
          n.alarm.set(10, 10);
          n.creation = 1;
          [n.flaggox, n.flaggoy] = spiral64(w.path, ax, ay);
        } else w.path.occupy(n);
      }
      for (let k = 0; k < 6; k++) i[SLOTS[k]] = i[SLOTS[k + 1]];
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
      d.setAlpha(0.69);
      for (const u of types) d.circleColour(u.bx, 50, 30, WHITE, WHITE, false);
      d.circleColour(660, 50, 30, WHITE, WHITE, false);
      d.setAlpha(1);
      for (const u of types) d.spriteExt(u.ico, 0, u.bx, 50, 0.6, 0.6, 0, WHITE, 1);
      d.spriteExt("ico_indietro", 0, 660, 50, 0.7, 0.7, 0, WHITE, 1);
      if (i.progression > 0) {
        d.setAlpha(0.69);
        d.roundrectColourExt(420, 90, 550, 150, 60, 60, WHITE, WHITE, false);
        d.roundrectColourExt(420, 90, 480 + (70 / 100) * i.progression, 150, 60, 60, GREEN, GREEN, false);
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
      if (i.progression > 0 && P.units[i.coda0]) d.spriteExt(P.units[i.coda0].ico, 0, 450, 120, 0.6, 0.6, 0, WHITE, 1);
      d.setAlpha(1);
      d.sprite(P.ico, 0, 325, 70);
      for (let k = 1; k <= 6; k++) {
        if (i.coda < k) continue;
        d.setAlpha(0.69);
        d.circleColour(590 + 70 * (k - 1), 120, 30, WHITE, WHITE, false);
        d.setAlpha(1);
        const u = P.units[i[SLOTS[k]]];
        if (u) d.spriteExt(u.ico, 0, 590 + 70 * (k - 1), 120, 0.6, 0.6, 0, WHITE, 1);
      }
    },
  };
}

// ------------------------------------------------------- pulsanti

// warrior_clicker e simili [C]: clic (in Step, col tasto rilasciato sopra)
// o tasto. Paga e mette in coda nell'edificio selezionato; con la coda
// vuota parte subito (alarm 13). La popolazione si controlla con +1 anche
// se l'unita' ne occupa 2.
function enqueue(w, prod, type, u) {
  const g = w.g;
  let ok = 0; // var ok dentro with: vale l'ultimo edificio visitato
  for (const b of w.all(prod)) if (b.selected === 1) ok = b.coda < 6 ? 1 : 0;
  if (u.cost.food && g.food < u.cost.food) w.create("food_blink", 0, 0);
  if (u.cost.gold && g.gold < u.cost.gold) w.create("gold_blink", 0, 0);
  if (u.cost.wood && g.wood < u.cost.wood) w.create("wood_blink", 0, 0);
  if (g.pop + 1 >= g.popcap) w.create("pop_blink", 0, 0);
  if (!(ok === 1 && Object.entries(u.cost).every(([r, v]) => g[r] >= v) && g.pop + 1 < g.popcap)) return null;
  for (const [r, v] of Object.entries(u.cost)) g[r] -= v;
  for (const b of w.all(prod)) {
    if (b.selected !== 1) continue;
    if (b.progression !== 0) b.coda += 1;
    if (b.progression === 0 && b.coda === 0) b.coda0 = type;
    if (b.coda >= 1 && b.coda <= 6) b[SLOTS[b.coda]] = type;
    if (b.progression === 0) { b.alarm.set(0, 13); b.progression = 1; return "exit"; }
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
      // azione 3 [C]: ogni pulsante scrive sele in base al puntatore sopra
      // di se': vince l'ultimo pulsante creato (riprodotto)
      const mx = w.mouse.x, my = w.mouse.y;
      g.sele = mx > i.x - 30 && mx < i.x + 30 && my > i.y - 30 && my < i.y + 30 ? 1 : 0;
    },
    ["keyPress" + u.key](i, w) { enqueue(w, prod, type, u); },
    destroy(i, w) { w.g.sele = 0; i.hover = 0; },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    drawGUI(i, w, d) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      d.setAlpha(0.69);
      d.roundrectColourExt(20, H - 150, 370, H - 20, 60, 60, WHITE, WHITE, false);
      d.setAlpha(0.7);
      d.setHalign("left");
      d.text(40, H - 120, u.title);
      d.setFont("overdue");
      d.text(40, H - 90, u.desc);
      d.setFont("GUI_1");
      d.text(40, H - 50, u.costs[0][0]);
      d.text(120, H - 50, u.costs[1][0]);
      d.text(200, H - 50, "2");
      d.setAlpha(1);
      d.sprite(u.costs[0][1], 0, 90, H - 50);
      d.sprite(u.costs[1][1], 0, 170, H - 50);
      d.spriteExt("ico_multi", 0, 230, H - 50, 0.5, 0.5, 0, WHITE, 1);
      d.setAlpha(0.7);
      d.setHalign("right");
      d.text(350, H - 120, u.shortcut);
      d.setAlpha(0.99);
      d.circleColour(u.bx, 50, 30, WHITE, WHITE, false);
      d.setAlpha(1);
      d.spriteExt(u.ico, 0, u.bx, 50, 0.6, 0.6, 0, WHITE, 1);
    },
  };
}

// caserma_indietro_clicker [C]: toglie l'ultima in coda (o ferma quella in
// produzione) e rimborsa il suo costo.
function cancelLast(w, prod) {
  const P = PRODUCERS[prod];
  for (const b of w.all(prod)) {
    if (b.selected !== 1 || b.progression === 0) continue;
    const slot = SLOTS[b.coda];
    const u = P.units[b[slot]];
    if (u) for (const [r, v] of Object.entries(u.cost)) w.g[r] += v;
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
      w.setPos(i, c.x + 660 * g.scaleview, c.y + 50 * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
      const mx = w.mouse.x, my = w.mouse.y;
      g.sele = mx > i.x - 30 && mx < i.x + 30 && my > i.y - 30 && my < i.y + 30 ? 1 : 0;
    },
    ["keyPress" + P.cancelKey](i, w) { cancelLast(w, prod); },
    destroy(i, w) { w.g.sele = 0; i.hover = 0; },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    drawGUI(i, w, d) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      d.setAlpha(0.69);
      d.roundrectColourExt(20, H - 150, 340, H - 20, 60, 60, WHITE, WHITE, false);
      d.setAlpha(0.7);
      d.setHalign("left");
      d.text(40, H - 120, "Cancel");
      d.setFont("overdue");
      d.setValign("top");
      d.textExt(40, H - 100, "Cancel the last unit in the creation queue.", 30, 280);
      d.setValign("middle");
      d.setFont("GUI_1");
      d.setHalign("right");
      d.text(320, H - 120, "Shortcut: R");
      d.setAlpha(0.99);
      d.circleColour(660, 50, 30, WHITE, WHITE, false);
      d.setAlpha(1);
      d.spriteExt("ico_indietro", 0, 660, 50, 0.7, 0.7, 0, WHITE, 1);
    },
  };
}
