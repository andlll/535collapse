// Edifici alleati: pulsanti di costruzione (*_clicker), piazzamento
// (*_placer), cantieri (*_fond), edifici finiti, il centro con la
// produzione di civili, e i piccoli oggetti di interfaccia (*_blink,
// *_prizedrawer, idle_clicker).
//
// Le 9 famiglie (casa, magazzino, barn, caserma, stalla, castello, chiesa,
// torre, e campo nel punto 3c) sono copie dello stesso codice con dati
// diversi [C, confronto automatico normalizzando i nomi: STUDIO.md §3.5]:
// qui il codice e' scritto una volta e i dati stanno nella tabella FAM, con
// il file d'origine di ogni valore. Le mura (orientamento, tratti, porte)
// sono a parte (da fare).

import { pointDirection, pointDistance, irandomRange } from "./gm.js";
import { GRID, generateFields } from "./pathing.js";

const WHITE = 0xffffff, BLACK = 0, GREEN = 0x008000, RED = 0x0000ff;

// Dati per famiglia [C]: *_clicker Step (x, y del pulsante), KeyPress_* (tasto),
// Mouse_LeftReleased (costo e lampeggio), Draw (fantasma), Draw_GUI (scheda),
// *_fond Create (slife) e Step (fasi), KeyPress_Delete (rimborso).
export const FAM = {
  casa: { key: 81, bx: 450, by: 50, cost: { wood: 50 }, ico: "ico_casa",
          panel: { w: 640, title: "House", desc: "Increases the population value by 10. Press C while placing to change the style.",
                   costs: [["50", 40, "ico_wood", 90]], shortcut: ["Shortcut: Q", 620] },
          slife: 119, phases: [], tipi: 6 },
  magazzino: { key: 87, bx: 520, by: 50, cost: { wood: 70 }, ico: "ico_magazzino", ghost: "magazzino_spr",
               panel: { w: 340, title: "Warehouse", desc: "Resources deposit for worker units.",
                        costs: [["70", 40, "ico_wood", 90]], shortcut: ["Shortcut: W", 320] },
               slife: 139, phases: [] },
  barn: { key: 69, bx: 590, by: 50, cost: { wood: 60 }, ico: "ico_barn", ghost: "barn_spr",
          panel: { w: 340, title: "Windmill", desc: "Deposit for the food resource.",
                   costs: [["60", 40, "ico_wood", 90]], shortcut: ["Shortcut: E", 320] },
          slife: 149, phases: [] },
  caserma: { key: 68, bx: 590, by: 120, cost: { wood: 150 }, ico: "ico_caserma", ghost: "cas_spr",
             panel: { w: 340, title: "Barracks", desc: "Creates infantry units.",
                      costs: [["150", 40, "ico_wood", 95]], shortcut: ["Shortcut: D", 320] },
             slife: 349, phases: [[0.5, "cas_f2"]] },
  stalla: { key: 70, bx: 660, by: 120, cost: { wood: 170 }, ico: "ico_stalla", ghost: "stal_spr",
            panel: { w: 340, title: "Stables", desc: "Creates cavalry units.",
                     costs: [["170", 40, "ico_wood", 95]], shortcut: ["Shortcut: F", 320] },
            slife: 379, phases: [[0.5, "stal_f2"]] },
  // castello_clicker Draw_GUI non ridisegna il cerchio evidenziato [C]
  castello: { key: 71, bx: 730, by: 120, cost: { stone: 850 }, ico: "ico_castello", ghost: "castello_spr", noRing: true,
              panel: { w: 390, title: "Fortress", desc: "Creates siege units. Archers can garrison.",
                       costs: [["850", 40, "ico_stone", 95]], shortcut: ["Shortcut: G", 370] },
              slife: 899, phases: [[0.5, "castello_f2"], [0.666, "castello_f3"]] },
  chiesa: { key: 84, bx: 730, by: 50, cost: { wood: 50, stone: 150 }, ico: "ico_chiesa", ghost: "chiesa_spr",
            panel: { w: 340, title: "Monastery", desc: "Heals the ally units nearby.",
                     costs: [["50", 40, "ico_wood", 90], ["150", 120, "ico_stone", 170]], shortcut: ["Shortcut: T", 320] },
            slife: 299, phases: [[0.5, "chiesa_f2"]] },
  torre: { key: 65, bx: 450, by: 120, cost: { stone: 200 }, ico: "ico_torre", ghost: "torre_spr",
           panel: { w: 340, title: "Tower", desc: "Defensive building with great visibility.",
                    costs: [["200", 40, "ico_stone", 95]], shortcut: ["Shortcut: A", 320] },
           slife: 329, phases: [[0.5, "torre_f2"]] },
};

const BLINK = { wood: "wood_blink", stone: "stone_blink", food: "food_blink", gold: "gold_blink" };

function canPay(g, cost) {
  return Object.entries(cost).every(([r, v]) => g[r] >= v);
}

// Lampeggi delle risorse che mancano [C]: wood_blink se manca il legno,
// stone_blink se manca la pietra (chiesa: entrambi, indipendenti).
function blinkMissing(w, fam, cost) {
  if (fam === "chiesa") {
    if (w.g.stone < 150) w.create("stone_blink", 0, 0);
    if (w.g.wood < 50) w.create("wood_blink", 0, 0);
    return;
  }
  for (const r of Object.keys(cost)) if (w.g[r] < cost[r]) { w.create(BLINK[r], 0, 0); return; }
}

// ------------------------------------------------------------- pulsanti

export function clicker(fam) {
  const d = FAM[fam];
  const placer = fam + "_placer";
  const activate = (i, w, checkOne) => {
    if (canPay(w.g, d.cost)) {
      i.active = 1;
      for (const p of w.all("clicker_parent")) w.destroy(p);
      if (!checkOne || w.number(placer) === 0) w.create(placer, i.x, i.y);
      for (const o of w.all("ally_omino")) if (o.selected === 1) o.buildarm = 1;
    } else blinkMissing(w, fam, d.cost);
  };
  return {
    create(i) { i.active = 0; i.hover = 0; },
    // Step [C]: il pulsante e' un'istanza nel mondo che segue la view
    // (x = view_x + bx * scaleview) con la maschera puls_mask in scala;
    // sparisce quando non ci sono civili selezionati (o ci sono soldati).
    step(i, w) {
      const g = w.g, c = w.cam;
      w.setPos(i, c.x + d.bx * g.scaleview, c.y + d.by * g.scaleview);
      i.depth = -i.y - 999;
      if (w.number(placer) !== 0) g.sele = 1;
      if (g.sel === 0 || g.milsel !== 0) {
        if (fam === "casa") i.alarm.set(0, 1); else { w.destroy(i); return; }
      }
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
    },
    alarm0(i, w) { w.destroy(i); },
    mouseEnter(i, w) { i.hover = 1; w.g.sele = 2; },
    mouseLeave(i, w) { i.hover = 0; w.g.sele = 0; },
    leftReleased(i, w) { activate(i, w, true); },
    // KeyPress del tasto [C]: lo stesso senza il controllo "un solo placer"
    // (solo la casa lo controlla anche da tastiera)
    ["keyPress" + d.key](i, w) { activate(i, w, fam === "casa"); },
    // Draw [C]: il fantasma dell'edificio sotto il puntatore, rosso se il
    // posto non e' libero.
    draw(i, w, dr) {
      if (i.active !== 1) return;
      for (const p of w.all(placer)) {
        const spr = fam === "casa" ? "c" + p.tipo + "s" : d.ghost;
        dr.spriteExt(spr, 0, w.mouse.x, w.mouse.y, 1, 1, 0, p.place === 1 ? WHITE : RED, 0.5);
      }
    },
    drawGUI(i, w, dr) {
      if (i.hover !== 1 && i.active !== 1) return;
      const H = w.cam.cssH, P = d.panel;
      dr.setAlpha(0.69);
      dr.roundrectColourExt(20, H - 150, P.w, H - 20, 60, 60, WHITE, WHITE, false);
      dr.setAlpha(0.7);
      dr.setHalign("left");
      dr.text(40, H - 120, P.title);
      dr.setFont("overdue");
      dr.text(40, H - 90, P.desc);
      dr.setFont("GUI_1");
      for (const [txt, tx] of P.costs) dr.text(tx, H - 50, txt);
      dr.setAlpha(1);
      for (const [, , ico, ix] of P.costs) dr.sprite(ico, 0, ix, H - 50);
      dr.setAlpha(0.7);
      dr.setHalign("right");
      dr.text(P.shortcut[1], H - 120, P.shortcut[0]);
      if (!d.noRing) {
        dr.setAlpha(0.99);
        dr.circleColour(d.bx, d.by, 30, WHITE, WHITE, false);
      }
      dr.setAlpha(1);
      dr.spriteExt(d.ico, 0, d.bx, d.by, 0.5, 0.5, 0, WHITE, 1);
    },
  };
}

// manager Step, "pulsanti di costruzione" [C]: con civili selezionati e
// nessun soldato, un pulsante per famiglia (nell'ordine dell'originale).
// campo_clicker (punto 3c) e mura_clicker (mura) non sono ancora portati.
const BUTTON_ORDER = ["torre", "magazzino", "barn", "campo", "casa", "caserma", "stalla", "castello", "chiesa", "mura"];
export function buildButtons(w) {
  const g = w.g;
  if (!(g.sel > 0 && g.milsel <= 0)) return;
  const x = w.cam.x + w.cam.w / 2, y = w.cam.y + w.cam.h / 2;
  for (const f of BUTTON_ORDER) {
    const n = f + "_clicker";
    if (w.behaviours[n] && w.number(n) === 0) w.create(n, x, y);
  }
}

// --------------------------------------------------------- piazzamento

export function placer(fam) {
  const d = FAM[fam];
  return {
    create(i) {
      i.place = 1;
      if (fam === "casa") { i.tipo = irandomRange(1, 6); i.bounce = 0; }
    },
    alarm0(i) { i.bounce = 0; },
    // Step [C]: segue il puntatore; place = il posto e' libero (maschera
    // dell'edificio contro i solidi). La collisione con un campo lo blocca.
    step(i, w) {
      i.place = w.placeFree(i, w.mouse.x, w.mouse.y) ? 1 : 0;
      w.setPos(i, w.mouse.x, w.mouse.y);
    },
    collisions: { campo(i) { i.place = 0; } },
    keyboard27(i, w) { w.g.sele = 0; w.destroy(i); },
    // casa_placer KeyPress_C [C]: cambia stile (6 case), con un rimbalzo di 2 passi
    keyPress67(i) {
      if (fam !== "casa" || i.bounce !== 0) return;
      i.bounce = 1;
      i.alarm.set(0, 2);
      i.tipo = i.tipo < 6 ? i.tipo + 1 : 1;
    },
    // Mouse_GlobalLeftPressed [C]: paga, crea il cantiere, spegne il pulsante.
    globalLeftPressed(i, w) {
      const g = w.g;
      if (i.place === 1 && canPay(g, d.cost)) {
        w.destroy(i);
        g.sele = 1;
        for (const [r, v] of Object.entries(d.cost)) g[r] -= v;
        // [Correzione decisa dall'autore, §3.5 n.17] l'originale assegna
        // tipo, sprite e maschera della casa DOPO il Create del cantiere,
        // che ha gia' marcato la griglia con la maschera c1m: qui arrivano
        // prima, e la marcatura usa la maschera giusta.
        const init = fam !== "casa" ? null : (f) => {
          f.sprite_index = "c" + i.tipo + "f";
          f.tipo = i.tipo;
          f.mask_index = "c" + i.tipo + "m";
        };
        w.create(fam + "_fond", i.x, i.y, { init });
        for (const c of w.all(fam + "_clicker")) c.active = 0;
      } else if (i.place === 1) {
        blinkMissing(w, fam, d.cost);
      } else if (fam !== "chiesa" && fam !== "torre" && fam !== "castello") {
        // [C] le altre famiglie lampeggiano anche col posto occupato (l'else
        // e' agganciato al primo if): riprodotto
        blinkMissing(w, fam, d.cost);
      }
    },
  };
}

// -------------------------------------------------------------- cantieri

export function fond(fam, p) {
  const d = FAM[fam];
  return {
    // Create [C]: marca la griglia con la maschera (per la casa quella del
    // tipo scelto: correzione §3.5 n.17), vita 1 su slife, alarm 0 al passo dopo.
    create(i, w) {
      p.markInstance(i, 1000);
      i.alarm.set(0, 1);
      i.depth = -i.y;
      Object.assign(i, { life: 1, slife: d.slife, selected: 0, fase: 0, fondazione: 1, pietra: 0, legno: 0 });
      w.g.sele = 0;
    },
    // Alarm_0 [C]: i civili "armati" dal pulsante (buildarm) vanno a costruire.
    alarm0(i, w) {
      const g = w.g;
      for (const o of w.all("ally_omino")) {
        if (o.buildarm !== 1) continue;
        o.buildwork = 1;
        o.buildx = fam === "casa" ? i.x : w.mouse.x;
        o.buildy = fam === "casa" ? i.y : w.mouse.y;
        p.free(o);
        o.target_angle = pointDirection(o.x, o.y, i.x, i.y);
        if (o.action === 0) g.idle -= 1;
        const [cx, cy] = p.findValidCellBackwards(o.goal_field, Math.trunc(w.mouse.x / GRID), Math.trunc(w.mouse.y / GRID),
                                                  Math.trunc(o.x / GRID), Math.trunc(o.y / GRID));
        const found = p.fieldAt(o.goal_field, cx, cy) !== -1;
        o.goal_x = found ? cx * GRID : o.x;
        o.goal_y = found ? cy * GRID : o.y;
        generateFields(p, o, o.goal_x, o.goal_y);
        o.dirox = o.goal_x;
        o.diroy = o.goal_y;
        o.alarm.set(0, 13);
        o.action = 1;
        o.buildarm = 0;
      }
    },
    // Step [C]: fasi del cantiere, poi l'edificio finito.
    step(i, w) {
      d.phases.forEach(([t, spr], k) => {
        if (i.fase === k && i.life > i.slife * t) { i.fase = k + 1; i.sprite_index = spr; }
      });
      if (i.life >= i.slife) {
        const b = w.create(fam, i.x, i.y);
        if (fam === "casa") {
          b.tipo = i.tipo;
          b.sprite_index = "c" + i.tipo + "s";
          b.mask_index = "c" + i.tipo + "m";
          w.moved(b);
        }
        w.destroy(i);
      }
    },
    globalLeftPressed(i) { i.selected = 0; },
    leftReleased(i, w) { if (w.g.sele === 0) i.selected = 1; },
    // Mouse_RightReleased [C]: i civili selezionati vengono a costruire
    rightReleased(i, w) {
      for (const o of w.all("ally_omino")) if (o.selected === 1) o.buildwork = 1;
      i.buildwork = 1;
    },
    // KeyPress_Delete [C]: annulla il cantiere selezionato, rimborso pieno.
    // [Correzione decisa dall'autore, §3.5 n.20] l'originale non libera le
    // celle della griglia, che restano ostacolo: qui si liberano. (Non in un
    // Destroy: a cantiere finito l'edificio ha gia' marcato le stesse celle.)
    keyPress46(i, w) {
      if (i.selected !== 1) return;
      p.markInstance(i, 1);
      w.destroy(i);
      for (const [r, v] of Object.entries(d.cost)) w.g[r] += v;
    },
    drawGUI(i, w, dr) { if (i.selected === 1) panel(dr, i, d.ico); },
  };
}

function panel(dr, i, ico) {
  dr.setAlpha(0.69);
  dr.roundrectColourExt(260, 20, 390, 150, 60, 60, WHITE, WHITE, false);
  dr.setFont("GUI_1");
  dr.setColour(BLACK);
  dr.setAlpha(0.75);
  dr.setValign("middle");
  dr.setHalign("center");
  dr.text(325, 120, i.life + " / " + i.slife);
  dr.setAlpha(1);
  dr.sprite(ico, 0, 325, 70);
}

function lifeBar(dr, i, col = GREEN) {
  dr.rectangleColour(i.x - 25, i.y - 75, i.x + 25, i.y - 82, BLACK, BLACK, BLACK, BLACK, false);
  dr.rectangleColour(i.x - 25, i.y - 75, i.x - 25 + (i.life / i.slife) * 50, i.y - 82, col, col, col, col, false);
}

// --------------------------------------------------------- edifici finiti

// Dati [C, <edificio>/Create e Step]: vita, rovina, popolazione, sprite di
// danno di castello, chiesa, torre: sopra il 66% lo sprite normale, sotto
// il 33% *_r2. [Correzione decisa dall'autore, §3.5 n.19] nell'originale
// entrambe le soglie di *_r1 e *_r2 sono "< 0,33" e *_r1 non si vede mai:
// qui *_r1 vale sotto il 66%.
const BUILT = {
  casa: { life: 120, ruin: "casaruin", popcap: 10, fire: true },
  magazzino: { life: 140, ruin: "magruin", fire: true },
  barn: { life: 150, ruin: "barnruin", fire: true },
  caserma: { life: 350, ruin: "casruin", fire: true },
  stalla: { life: 380, ruin: "stalruin", fire: true },
  castello: { life: 900, ruin: "castelloruin", damage: ["castello_spr", "castello_r1", "castello_r2"], stone: true },
  chiesa: { life: 300, ruin: "chiesaruin", damage: ["chiesa_spr", "chiesa_r1", "chiesa_r2"] },
  torre: { life: 330, ruin: "torreruin", damage: ["torre_spr", "torre_r1", "torre_r2"], stone: true },
};

export function built(fam, p) {
  const b = BUILT[fam];
  return {
    create(i, w) {
      p.markInstance(i, 1000);
      Object.assign(i, { life: b.life, slife: b.life, selected: 0, hit: 0, hover: 0, onfire: 0, firestarted: 0,
                         fondazione: 0, legno: b.stone ? 0 : 1, pietra: b.stone ? 1 : 0, npresidio: 0, arm: 1 });
      i.depth = -i.y;
      if (b.popcap) w.g.popcap += b.popcap;
      if (b.fire) { i.alarm.set(0, 30); i.alarm.set(1, 70); }
      if (fam === "casa" && w.room === "lvl01") {
        const t = irandomRange(1, 7);
        if (t >= 2 && t <= 6) { i.sprite_index = "c" + t + "s"; w.moved(i); }
      }
      // barn Create [C]: action_sprite_set(mul1, 0, 0.3), il mulino che gira
      if (fam === "barn") { i.sprite_index = "mul1"; i.image_index = 0; i.image_speed = 0.3; i.mask_index = "barn_mask"; w.moved(i); }
      if (fam === "magazzino") sendBuildersToWork(i, w, p);
    },
    destroy(i) { p.markInstance(i, 1); },
    // Alarm 0/1 [C]: a fuoco fumo ogni 30 passi e -1 vita ogni 70
    // (il fumo e le fiamme arrivano con le particelle; nella casa
    // l'originale distrugge le fiamme alte al passo dopo: §3.5 n.18, da
    // correggere quando si portano le particelle).
    alarm0(i) { if (b.fire) i.alarm.set(0, 30); },
    alarm1(i) { if (b.fire) { i.alarm.set(1, 70); if (i.onfire === 1) i.life -= 1; } },
    step(i, w) {
      const g = w.g;
      if (i.life <= 0) {
        if (fam === "casa") g.popcap -= 10;
        // [Correzione decisa dall'autore §1.6 n.3] castello e torre non
        // tolgono piu' 5 alla popolazione: non la davano.
        w.create(b.ruin, i.x, i.y);
        w.destroy(i);
        return;
      }
      repairEnd(i, w);
      if (b.damage) {
        const [ok, r1, r2] = b.damage;
        if (i.life > i.slife * 0.66 && i.sprite_index !== ok) i.sprite_index = ok;
        if (i.life < i.slife * 0.66 && i.life >= i.slife * 0.33 && i.sprite_index !== r1) i.sprite_index = r1;
        if (i.life < i.slife * 0.33 && i.sprite_index !== r2) i.sprite_index = r2;
      }
    },
    globalLeftPressed(i) { i.selected = 0; },
    leftReleased(i, w) { if (w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1; },
    // Mouse_RightReleased [C]: i civili selezionati vanno a riparare
    rightReleased(i, w) { sendRepair(i, w); },
    mouseEnter(i, w) { i.hover = 1; if (i.life < i.slife) w.g.buildhover = 1; },
    mouseLeave(i, w) { i.hover = 0; w.g.buildhover = 0; },
    keyPress46(i) { if (i.selected === 1) i.life = 0; },
    drawEnd(i, w, dr) {
      if (i.selected === 1) lifeBar(dr, i);
      if (i.hover === 1 || i.hit === 1) lifeBar(dr, i);
    },
    drawGUI(i, w, dr) { if (i.selected === 1) panel(dr, i, FAM[fam].ico); },
  };
}

// "fine riparazione" [C, Step di ogni edificio]: l'if senza graffe regge
// solo `var xpos=x`; `var ypos=y` vale sempre. A edificio danneggiato xpos
// resta non assegnata, cioe' 0 [I, variabili non inizializzate = 0,
// §1.3], e i riparatori (entro 150 px da (0, y)) non si fermano: si fermano
// solo a edificio integro, che e' l'effetto voluto.
const NOONE = -4;
function repairEnd(i, w) {
  const xpos = i.life >= i.slife ? i.x : 0, ypos = i.y;
  for (const o of w.all("ally_omino")) {
    if (o.action === 7 && pointDistance(o.repx, o.repy, xpos, ypos) < 150) {
      o.action = 0; o.repairwork = 0; w.g.idle += 1; o.repx = NOONE; o.repy = NOONE;
    }
  }
}

function sendRepair(i, w) {
  for (const o of w.all("ally_omino")) {
    if (o.selected !== 1) continue;
    o.repairwork = 1;
    o.repx = w.mouse.x; o.repy = w.mouse.y;
    o.dirox = o.repx; o.diroy = o.repy;
    if (o.action === 0) w.g.idle -= 1;
    o.action = 1;
    o.alarm.set(0, 13);
  }
}

// magazzino Create azione 2 [C]: chi l'ha costruito (bbox a meno di 15 px)
// va a raccogliere la risorsa piu' vicina fra legno, pietra e oro.
function sendBuildersToWork(i, w, p) {
  for (const o of w.all("ally_omino")) {
    if (w.distanceToInstance(o, i) >= 15) continue;
    const dist = (n) => (w.number(n) > 0 ? w.distanceToObject(o, n) : 999999);
    const goldist = dist("miniera_oro"), stonist = dist("stone_parent"), woodist = dist("albero");
    let kind = null;
    if (woodist < stonist && woodist < goldist) kind = ["albero", "woodwork", "woodx", "woody"];
    else if (stonist < woodist && stonist < goldist) kind = ["stone_parent", "stonework", "stonex", "stoney"];
    else if (goldist < woodist && goldist < stonist) kind = ["miniera_oro", "goldwork", "goldx", "goldy"];
    if (!kind) continue;
    const t = w.nearest(o.x, o.y, kind[0]);
    o[kind[1]] = 1;
    o[kind[2]] = t.x; o[kind[3]] = t.y;
    o.dirox = t.x; o.diroy = t.y;
    const [cx, cy] = p.findValidCellBackwards(o.goal_field, Math.trunc(o.dirox / GRID), Math.trunc(o.diroy / GRID),
                                              Math.trunc(o.x / GRID), Math.trunc(o.y / GRID));
    const found = p.fieldAt(o.goal_field, cx, cy) !== -1;
    o.goal_x = found ? cx * GRID : o.x;
    o.goal_y = found ? cy * GRID : o.y;
    generateFields(p, o, o.goal_x, o.goal_y);
    o.dirox = o.goal_x; o.diroy = o.goal_y;
    o.action = 1;
    o.alarm.set(0, 13);
  }
}

// --------------------------------------------------------------- centro

export function centro(p) {
  const base = built("casa", p); // stesse regole di selezione e riparazione
  return {
    // centro Create [C, azione 2]
    create(i, w) {
      p.markInstance(i, 1000);
      Object.assign(i, {
        life: 400, slife: 400, coda: 0, progression: 0, woodir: 0, foodir: 0, stonedir: 0, goldir: 0,
        placex: i.x, placey: i.y, arm: 1, fondazione: 0, pietra: 0, legno: 1, hit: 0, onfire: 0,
        firestarted: 0, selected: 0, hover: 0, flagx: null, flagy: null,
      });
      i.depth = -i.y;
      w.g.popcap += 10;
      // il centro e' anche deposito del cibo: un "mulino" invisibile sul posto
      w.create("cc_barn", i.x, i.y);
    },
    destroy(i) { p.markInstance(i, 1); },
    step(i, w) {
      const g = w.g;
      // (frecce sui nemici entro 600 px: col combattimento, punto 4)
      if (!w.placeEmpty({ ...i, mask_index: i.mask_index }, i.placex, i.placey)) {
        i.placex += irandomRange(-2, 2);
        i.placey += irandomRange(-2, 2);
      }
      if (i.life <= 0) {
        // [Correzione decisa dall'autore §1.6 n.3] -10, quanto ha dato
        g.popcap -= 10;
        g.gameover = 1;
        w.create("ccruin", i.x, i.y);
        // + gameover_manager (con vittoria e sconfitta)
        w.destroy(i);
        return;
      }
      if (i.selected === 1 && w.number("omino_clicker") < 1) {
        w.create("omino_clicker", 0, 0);
        w.create("centro_indietro_clicker", 0, 0);
      }
      if (i.selected === 0) {
        for (const c of w.all("omino_clicker")) w.destroy(c);
        for (const c of w.all("centro_indietro_clicker")) w.destroy(c);
      }
      repairEnd(i, w);
    },
    // Alarm_0 [C]: avanzamento della produzione (un punto ogni 10 passi);
    // a 100 nasce un civile, se c'e' posto nella popolazione, e va verso la
    // bandiera (o 250, 150 px piu' in la').
    alarm0(i, w) {
      const g = w.g;
      const ax = i.flagx !== null ? i.flagx : i.x + 250, ay = i.flagx !== null ? i.flagy : i.y + 150;
      if (i.progression < 100 && i.progression !== 0) { i.progression += 1; i.alarm.set(0, 10); }
      if (i.progression >= 100) {
        if (g.pop >= g.popcap) { i.alarm.set(0, 30); w.create("pop_blink", 0, 0); return; }
        i.progression = 0;
        if (i.coda > 0) { i.coda -= 1; i.alarm.set(0, 10); i.progression = 1; }
        const n = w.create("ally_omino", i.x, i.y);
        n.alarm.set(10, 10);
        n.creation = 1;
        n.flaggox = ax;
        n.flaggoy = ay;
      }
    },
    globalLeftPressed(i, w) {
      const hov = (n) => [...w.all(n)].some((c) => c.hover === 1);
      if (!hov("omino_clicker") && !hov("centro_indietro_clicker")) {
        i.selected = 0;
        for (const c of w.all("omino_clicker")) w.destroy(c);
        for (const c of w.all("centro_indietro_clicker")) w.destroy(c);
      }
    },
    globalRightPressed(i) { if (i.selected === 1) Object.assign(i, { woodir: 0, goldir: 0, foodir: 0, stonedir: 0 }); },
    globalRightReleased(i, w) { if (i.selected === 1) { i.flagx = w.mouse.x; i.flagy = w.mouse.y; } },
    leftReleased: base.leftReleased,
    rightReleased(i, w) { if (i.life < i.slife) sendRepair(i, w); },
    mouseEnter: base.mouseEnter,
    mouseLeave: base.mouseLeave,
    drawEnd(i, w, dr) {
      if (i.flagx !== null && i.flagy !== null && i.selected === 1) {
        dr.sprite("director_blue", 0, i.flagx, i.flagy);
        dr.lineWidthColour(i.x, i.y, i.flagx, i.flagy, 2, WHITE, WHITE);
      }
      if (i.selected === 1) lifeBar(dr, i);
      if (i.hover === 1 || i.hit === 1) lifeBar(dr, i);
    },
    // Draw_GUI [C]: scheda con produzione e coda (fino a 6)
    drawGUI(i, w, dr) {
      if (i.selected !== 1) return;
      dr.setAlpha(0.69);
      dr.circleColour(450, 50, 30, WHITE, WHITE, false);
      dr.circleColour(520, 50, 30, WHITE, WHITE, false);
      if (i.progression > 0) {
        dr.roundrectColourExt(420, 90, 550, 150, 60, 60, WHITE, WHITE, false);
        dr.roundrectColourExt(420, 90, 480 + 0.7 * i.progression, 150, 60, 60, GREEN, GREEN, false);
        dr.setAlpha(0.7);
        dr.setHalign("center");
        dr.text(520, 120, i.progression + "%");
        dr.setAlpha(0.69);
      }
      dr.roundrectColourExt(260, 20, 390, 150, 60, 60, WHITE, WHITE, false);
      dr.setFont("GUI_1");
      dr.setColour(BLACK);
      dr.setAlpha(0.75);
      dr.setValign("middle");
      dr.setHalign("center");
      dr.text(325, 120, i.life + " / " + i.slife);
      dr.setAlpha(1);
      dr.spriteExt("ico_omino", 0, 450, 50, 0.7, 0.7, 0, WHITE, 1);
      dr.spriteExt("ico_indietro", 0, 520, 50, 0.7, 0.7, 0, WHITE, 1);
      if (i.progression > 0) { dr.setAlpha(0.4); dr.spriteExt("ico_omino", 0, 450, 120, 0.7, 0.7, 0, WHITE, 1); }
      dr.setAlpha(1);
      dr.sprite("ico_centro", 0, 325, 70);
      for (let k = 0; k < 6; k++) {
        if (i.coda > k) {
          dr.setAlpha(0.69);
          dr.circleColour(590 + 70 * k, 120, 30, WHITE, WHITE, false);
          dr.setAlpha(1);
          dr.spriteExt("ico_omino", 0, 590 + 70 * k, 120, 0.7, 0.7, 0, WHITE, 1);
        }
      }
    },
  };
}

// Pulsante "crea civile" [C, omino_clicker]: 50 cibo, coda fino a 6.
function enqueueWorker(i, w, fromKey) {
  const g = w.g;
  const c = [...w.all("centro")].find((x) => x.selected === 1);
  const ok = c && c.coda < 6;
  if (g.food < 50) w.create("food_blink", 0, 0);
  if (g.pop >= g.popcap) w.create("pop_blink", 0, 0);
  if (ok && g.food >= 50 && g.pop < g.popcap) {
    i.active = 1;
    g.food -= 50;
    for (const ce of w.all("centro")) {
      if (ce.selected !== 1) continue;
      if (ce.progression === 0) {
        ce.alarm.set(0, 20);
        ce.progression = 1;
        if (!fromKey) w.mouseClear(0);
        return; // exit dentro with: termina l'evento [I]
      }
      if (ce.progression !== 0) ce.coda += 1;
    }
  }
  if (!fromKey) w.mouseClear(0);
}

export function ominoClicker() {
  return {
    create(i) { i.active = 0; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      w.setPos(i, c.x + 450 * g.scaleview, c.y + 50 * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
      if (i.hover === 1 && w.input.mouseReleased[0]) enqueueWorker(i, w, false);
    },
    keyPress81(i, w) { enqueueWorker(i, w, true); },
    mouseEnter(i, w) { i.hover = 1; w.g.sele = 1; },
    mouseLeave(i, w) { i.hover = 0; w.g.sele = 0; },
    destroy(i, w) { w.g.sele = 0; },
    drawGUI(i, w, dr) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      dr.setAlpha(0.69);
      dr.roundrectColourExt(20, H - 150, 370, H - 20, 60, 60, WHITE, WHITE, false);
      dr.setAlpha(0.7);
      dr.setHalign("left");
      dr.text(40, H - 120, "Worker");
      dr.setFont("overdue");
      dr.text(40, H - 90, "Gathers resources and builds the town.");
      dr.setFont("GUI_1");
      dr.text(40, H - 50, "50");
      dr.text(120, H - 50, "1");
      dr.setAlpha(1);
      dr.sprite("ico_food", 0, 90, H - 50);
      dr.spriteExt("ico_multi", 0, 150, H - 50, 0.5, 0.5, 0, WHITE, 1);
      dr.setAlpha(0.7);
      dr.setHalign("right");
      dr.text(350, H - 120, "Shortcut: Q");
      dr.setAlpha(0.99);
      dr.circleColour(450, 50, 30, WHITE, WHITE, false);
      dr.setAlpha(1);
      dr.spriteExt("ico_omino", 0, 450, 50, 0.7, 0.7, 0, WHITE, 1);
    },
  };
}

// "Annulla" [C, centro_indietro_clicker]: restituisce 50 cibo e toglie
// l'ultimo dalla coda (o ferma la produzione in corso).
function cancelWorker(w) {
  for (const ce of w.all("centro")) {
    if (ce.selected === 1 && ce.progression !== 0) {
      w.g.food += 50;
      if (ce.coda > 0) ce.coda -= 1; else ce.progression = 0;
    }
  }
}

export function centroCancel() {
  return {
    create(i) { i.active = 0; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      if (i.hover === 1 && w.input.mouseReleased[0]) { cancelWorker(w); w.mouseClear(0); }
      w.setPos(i, c.x + 520 * g.scaleview, c.y + 50 * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
      g.sele = i.hover === 1 ? 1 : 0;
    },
    keyPress87(i, w) { cancelWorker(w); },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    destroy(i, w) { w.g.sele = 0; i.hover = 0; },
    drawGUI(i, w, dr) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      dr.setAlpha(0.69);
      dr.roundrectColourExt(20, H - 150, 340, H - 20, 60, 60, WHITE, WHITE, false);
      dr.setAlpha(0.7);
      dr.setHalign("left");
      dr.text(40, H - 120, "Cancel");
      dr.setFont("overdue");
      dr.setValign("top");
      dr.textExt(40, H - 100, "Cancel the last unit in the creation queue.", 30, 280);
      dr.setValign("middle");
      dr.setFont("GUI_1");
      dr.setHalign("right");
      dr.text(320, H - 120, "Shortcut: W");
      dr.setAlpha(0.99);
      dr.circleColour(520, 50, 30, WHITE, WHITE, false);
      dr.setAlpha(1);
      dr.spriteExt("ico_indietro", 0, 520, 50, 0.7, 0.7, 0, WHITE, 1);
    },
  };
}

// --------------------------------------------------- piccoli oggetti GUI

// *_blink [C]: un cerchio rosso sopra l'icona della risorsa che manca,
// sfuma in 25 passi.
const BLINK_POS = { wood_blink: [50, 80], stone_blink: [140, 40], pop_blink: [140, 80],
                    food_blink: [50, 40], gold_blink: [50, 120] };
export function blink(name) {
  return {
    create(i) { i.fad = 1; i.alarm.set(0, 25); },
    alarm0(i, w) { w.destroy(i); },
    step(i) { i.fad -= 1 / 25; },
    drawGUIEnd(i, w, dr) {
      dr.setAlpha(i.fad);
      dr.circleColour(BLINK_POS[name][0], BLINK_POS[name][1], 20, RED, RED, false);
      dr.setAlpha(1);
    },
  };
}

// *_prizedrawer [C]: l'icona della risorsa che sale e sfuma in 30 passi.
export function prizeDrawer(icon) {
  return {
    create(i) { i.alf = 1; i.alarm.set(0, 30); },
    alarm0(i, w) { w.destroy(i); },
    drawGUI(i, w, dr) {
      const s = w.g.scaleview, c = w.cam;
      const posx = i.x / s - c.x / s, posy = i.y / s - c.y / s;
      i.alf -= 0.0333;
      dr.spriteExt(icon, 0, posx, posy + i.alf * 100 - 100, 1, 1, 0, WHITE, i.alf);
    },
  };
}

// idle_clicker [C, creato da manager Create]: il riquadro dei civili
// inattivi; clic o Spazio selezionano il prossimo e centrano la camera.
export function idleClicker() {
  const selectNext = (i, w, camera) => {
    const ordero = i.orderu;
    for (const o of w.all("ally_omino")) {
      if (o.idling === 1 && o.idleorder === ordero) {
        o.selected = 1;
        if (camera) { w.cam.x = o.x - w.cam.w / 2; w.cam.y = o.y - w.cam.h / 2; }
        w.g.sel += 1;
        for (const ic of w.all("idle_clicker")) { ic.orderu += 1; if (ic.orderu > w.g.idle) ic.orderu = 1; }
      }
    }
  };
  return {
    create(i) { i.orderu = 1; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      if (w.input.mouseReleased[0] && i.hover === 1) { selectNext(i, w, true); w.mouseClear(0); }
      i.depth = -9999;
      w.setPos(i, c.x + c.cssW * g.scaleview - 90 * g.scaleview, c.y + 100 * g.scaleview);
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
    },
    // KeyPress_Space [C]: prima deseleziona i civili, poi seleziona il prossimo
    keyPress32(i, w) {
      for (const o of w.all("ally_omino")) if (o.selected === 1) { w.g.sel -= 1; o.selected = 0; }
      selectNext(i, w, true);
    },
    mouseEnter(i, w) { if (w.room !== "menu") i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    drawGUI(i, w, dr) {
      if (i.hover !== 1) return;
      const W = w.cam.cssW;
      dr.setAlpha(0.99);
      dr.roundrectColourExt(W - 90, 100, W - 20, 200, 60, 60, WHITE, WHITE, false);
      dr.setAlpha(1);
      dr.spriteExt("ico_idle", 0, W - 55, 135, 0.7, 0.7, 0, WHITE, 1);
      dr.setHalign("center");
      dr.text(W - 55, 170, w.g.idle);
    },
  };
}
