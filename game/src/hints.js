// Suggerimenti del tutorial (hint_*, 26 oggetti) e dialoghi (dialogo_*,
// 25 oggetti): tutti figli di parent_hint e tutti la stessa finestra [C,
// confronto evento per evento]. Un rettangolo arrotondato bianco largo
// 380 px con titolo (GUI_1) e testo (overdue, a capo a 340 px), piu' il
// ritratto di chi parla nei dialoghi; si chiude cliccandoci sopra. Le
// differenze sono dati: dove sta la finestra, quale clic la chiude, se
// deve aspettare qualche passo prima di accettare il clic (`arm`, contro il
// clic che l'ha appena aperta), cosa apre dopo. Qui una tabella e un solo
// comportamento.
//
// Posizione [C]: posx = (ancora.x - view_xview)/scaleview, cioe' in pixel
// della finestra: la finestra segue sullo schermo l'oggetto a cui e'
// ancorata. Le ancore:
// - fixed: coordinate fisse dello schermo (anche relative ai bordi);
// - mouse: l'istanza di `obj` piu' vicina al puntatore, ricalcolata a ogni
//   passo se `follow`;
// - vicino: l'istanza di `obj` piu' vicina al puntatore alla creazione,
//   seguita finche' esiste (poi la finestra sparisce);
// - parlante: l'istanza di `obj` piu' vicina al punto di creazione, chi
//   parla nel dialogo; con `vanish` la finestra sparisce se muore.
//
// I suggerimenti si concatenano nel clic, i dialoghi nel Destroy [C]: un
// dialogo che sparisce per altri motivi apre comunque il successivo.

import { c } from "./colours.js";
import { tr, getLanguage } from "./i18n.js";

const W380 = 380;

// ------------------------------------------------------------ suggerimenti

// [titolo, testo]
const T = {
  hint_iniziale: ["Hints", "Windows like this one will appear to help you. Click on a hint window for the next step. Press H to disable or enable all hint windows."],
  hint_vista: ["Visualization", "Move your mouse close to the borders to navigate the map. You can also use arrow keys. Zoom in and out with the mouse wheel or the Z and X keys. Press F10 (Cmd+F on Mac) to switch to fullscreen mode."],
  hint_resource_tree: ["Resources", "On top of the screen you will find the resource tree. Gather resources with your workers to expand your city and build a powerful army."],
  hint_idle: ["Idling workers", "On top right of the screen you can monitor how many workers are idling. Click the button or press the spacebar to select them."],
  hint_objective: ["Objectives", "Next to it, you can find the objectives of the current map. Complete them to win the level."],
  hint_objective2: ["Objectives", "For this demo, the goal is to survive as long as possible and to destroy the enemies' bases. Press O to hide the objectives' window."],
  hint_minimap: ["Minimap", "On the bottom left of the screen you can see the minimap, showing your buildings, units, the visible resources and the enemies. Press M to hide/view the minimap. Press Ctrl+Z and Ctrl+X to regulate the minimap size."],
  hint_select: ["Selection and movement", "Left click on a unit to select it. Left click on an empty point on the map to clear the selection. While a unit is selected right click anywhere to move the unit in that direction."],
  hint_resource: ["Resources gathering", "Use your workers to gather resources. With at least one worker selected right click on a resource to start collecting it."],
  hint_build: ["Buildings", "Your workers can also build structures to expand your town. While a worker is selected, choose from a building on the top left of your screen and place it in an empty space. This is possible only if you have the amount of resources needed."],
  hint_repair: ["Repairing buildings", "The more workers you use on a construction site the faster the building will grow. You can also right click with workers selected on a damaged building to stop fires and to repair it from damages."],
  hint_create: ["Units creation", "Some structures can create units. When you click on those structures a menu will appear on the top of the screen. Creating units consumes resources."],
  hint_create_2: ["Shortcuts and undoing creation", "You can also use shortcuts to create units. If you change your mind while the process is ongoing, press the back button near the units creation buttons to have your resources back."],
  hint_create_3: ["Directions for new units", "Right click anywhere while a structure creating units is selected to target a direction that new units will follow once created."],
  hint_legna: ["Trees - Wood resource", "Right click on trees with workers selected to start collecting wood. Workers will then store wood in warehouses."],
  hint_oro: ["Mines - Gold resource", "Right click on a mine with workers selected to start collecting gold. Workers will then store the resource in warehouses."],
  hint_stone: ["Ruins - Stone resource", "Right click on ruins with workers selected to start collecting stone. Workers will then store it in warehouses."],
  hint_campi: ["Farms - Food resource", "Right click on a farm with a worker selected to start collecting food. If you click with multiple workers, they will reallocate in free farms. Food will be stored in barns."],
  hint_pop: ["Houses - Population", "Creating units requires population resource to be below its total capacity. Build more houses to increase the population capacity."],
  hint_presidio: ["Garrison", "Towers and castles can shoot arrows if you move archers inside them. More archers inside equals more arrows."],
  hint_attack: ["Attacking enemies", "With military units selected right click on enemy units to order your soldiers to engage in combat with them."],
  hint_fire: ["On fire!", "With infantry units selected (warriors and spearmen) right click on an enemy building to order your soldiers to set it on fire."],
  hint_fire_2: ["Not on fire", "Stone buildings (towers, walls, castles) cannot be set on fire, so you will need warmachines like catapults or siege rams in order to destroy them."],
  hint_multi: ["Multiple selection", "Double click on a unit to select all your units of the same type in your screenspace. Left click and drag to select multiple units."],
  hint_multi_2: ["Multiple selection", "Press Ctrl + left click to add units to the selection, Alt + left click to remove them. Press Shift + numbers (digits) to assign a quick selection number to a group, then the number alone to select it."],
  hint_night: ["Night", "At night visibility is reduced. Enemies will attack only when they are closer as their visibility is reduced as well."],
};

const fixed = (x, y) => ({ kind: "fixed", pos: () => [x, y] });
// [Correzione decisa dall'autore, §3.19 n.70] l'originale ricalcolava a
// ogni passo l'istanza piu' vicina al puntatore: avvicinandosi per
// cliccare, la finestra saltava su un'altra unita'. Qui segue l'istanza
// scelta alla creazione (e ne sceglie un'altra solo se muore).
const mouse = (obj) => ({ kind: "mouse", obj, follow: true });
const mouseOnce = (obj) => ({ kind: "mouse", obj, follow: false });
const vicino = (obj) => ({ kind: "vicino", obj });

// anchor, click (released|pressed), arm (passi prima del clic), next,
// resource (global.resourcehint=1 alla creazione)
export const HINTS = {
  // catena del tutorial (hint_iniziale e' piazzato nelle room)
  hint_iniziale: { anchor: fixed(20, 170), next: "hint_vista" },
  hint_vista: { anchor: fixed(20, 170), arm: 10, next: "hint_resource_tree" },
  hint_resource_tree: { anchor: fixed(20, 170), click: "pressed", next: "hint_idle" },
  hint_idle: { anchor: { kind: "fixed", pos: (w) => [w.cam.cssW - 410, 170] }, click: "pressed", next: "hint_objective" },
  hint_objective: { anchor: { kind: "fixed", pos: (w) => [w.cam.cssW - 900, 20] }, next: "hint_objective2" },
  hint_objective2: { anchor: { kind: "fixed", pos: (w) => [w.cam.cssW - 900, 20] }, arm: 10, next: "hint_minimap" },
  // posy = view_hport - testo_h - 98 - room_height/sz, ricalcolata a ogni passo
  hint_minimap: { anchor: { kind: "fixed", follow: true, pos: (w, i) => [20, w.cam.cssH - i.testo_h - 98 - w.roomH / w.g.sz] },
                  next: "hint_select" },
  hint_select: { anchor: mouse("ally_unit"), next: "hint_resource" },
  hint_resource: { anchor: fixed(20, 170), click: "pressed", next: "hint_build", resource: true },
  hint_build: { anchor: mouse("ally_omino"), arm: 10, next: "hint_repair", resource: true },
  hint_repair: { anchor: mouse("ally_omino"), arm: 10, next: "hint_create", resource: true },
  hint_create: { anchor: mouse("centro"), arm: 10, next: "hint_create_2", resource: true },
  hint_create_2: { anchor: mouse("centro"), arm: 10, next: "hint_create_3", resource: true },
  hint_create_3: { anchor: mouse("centro"), arm: 10, resource: true },
  // la prima volta che succede qualcosa
  hint_legna: { anchor: mouseOnce("albero") },
  hint_oro: { anchor: mouse("miniera_oro") },
  hint_stone: { anchor: mouse("stone_parent") },
  hint_campi: { anchor: vicino("campo") },
  hint_pop: { anchor: mouseOnce("casa") },
  // [Deviazione confermata dall'autore, §3.18 n.64] il presidio si apre
  // anche cliccando una torre, ma si ancorava al castello piu' vicino:
  // senza castelli l'originale si ferma con un errore (noone.x); qui resta
  // ferma dove l'ha creata la torre
  hint_presidio: { anchor: mouse("castello"), click: "pressed" },
  hint_attack: { anchor: vicino("enemy_unit") },
  hint_fire: { anchor: vicino("enemy_build"), next: "hint_fire_2", nextAtSelf: true },
  hint_fire_2: { anchor: vicino("enemy_build"), arm: 10 },
  // hint_multi arma `arm` ma non ha l'Alarm_0 e non lo controlla [C]
  hint_multi: { anchor: vicino("ally_militare"), next: "hint_multi_2", nextAtSelf: true },
  hint_multi_2: { anchor: vicino("ally_militare"), arm: 10, click: "pressed" },
  hint_night: { anchor: fixed(420, 170) },
};

// --------------------------------------------------------------- dialoghi

// [chi parla, ritratto, titolo, testo]
const SOLDIER = ["ally_warrior", "capoccia_a1", "Soldier 1"];
const VILLAGER = ["ally_omino", "capoccia_o1"];
const SOLDIER2 = ["ally_militare", "capoccia_a1", "Soldier"];
const SPY = ["ally_militare", "capoccia_a2", "Soldier"];

// parlante, ritratto, titolo, testo, arm, vanish (sparisce se muore chi
// parla), next (creato nel Destroy), timeout (alarm 1: si chiude da solo),
// create/step/click: extra
export const DIALOGS = {
  // livello 1
  dialogo_1_0: { who: SOLDIER, text: "It's over... The enemy has taken most of the city, they're burning every building to the ground!",
                 next: "dialogo_1_1" },
  dialogo_1_1: { who: ["ally_picchiere", "capoccia_a1", "Soldier 2"], arm: 30, next: "dialogo_1_2",
                 text: "Not yet... we can still gather an army, break through the gate to the north and escape the city" },
  dialogo_1_2: { who: SOLDIER, arm: 30, create: (i, w) => w.create("objective_button", 0, 0),
                 text: "You're right! We'll find the resources we need in the city, but we have to be careful and choose our crossroads wisely!" },
  dialogo_1_3: { who: SOLDIER, arm: 30, vanish: true, text: "Look at those chests, we could probably find something in there..." },
  dialogo_1_4: { who: ["enemy_picchiere", "capoccia_n1", "Enemy soldier"], arm: 30, vanish: true, timeout: 240,
                 text: "Kill them! No one will survive!" },
  dialogo_1_5: { who: SOLDIER, arm: 30, vanish: true, text: "Our citizens gifted us gold. Also, we could use those barracks to train more soldiers!" },
  dialogo_1_6: { who: SOLDIER, arm: 30, vanish: true, text: "We've taken control of the stables! We can train knights now" },
  // si chiude da solo quando arriva l'ultimo dialogo
  dialogo_1_7: { who: SOLDIER, arm: 30, vanish: true, text: "Fight for your freedom! We are almost there!",
                 step: (i, w) => { if (w.exists("dialogo_1_8") && i.arm === 1) w.destroy(i); } },
  // chiuderlo e' la vittoria del livello 1
  dialogo_1_8: { who: SOLDIER, arm: 30, vanish: true, text: "It's done! We are out!",
                 destroy: (i, w) => w.create("victory_manager", 0, 0) },
  // livello 2
  dialogo_2_0: { who: [...VILLAGER, "Villager"], vanish: true, text: "HELP!!!" },
  dialogo_2_1: { who: [...VILLAGER, "Villager"], next: "dialogo_2_2", nextOffset: [-200, -200],
                 text: "Thank you for saving us! The invader's army is kidnapping villagers from the countryside!",
                 // with(enemy_manager_lv2) {scr_inizializza_ff_nemici(id del dialogo); alarm[3]=10}
                 create: (i, w) => {
                   for (const m of w.all("enemy_manager_lv2")) {
                     m.flow_field = w.path.flowField(w.path.goalField(i.x, i.y, true));
                     m.alarm.set(3, 10);
                   }
                   for (const d of w.all("dialogo_2_0")) w.destroy(d);
                 } },
  dialogo_2_2: { who: SOLDIER2, arm: 10, next: "dialogo_2_3", text: "What? This is impossible! We must stop them!" },
  dialogo_2_3: { who: [...VILLAGER, "Villager"], arm: 10, next: "dialogo_2_4",
                 text: "We will help you! I'm sure that if you free other villages the inhabitants will be grateful to you." },
  dialogo_2_4: { who: [...VILLAGER, "Villager"], arm: 10, next: "dialogo_2_5",
                 text: "You can use our structures. We will also help build new ones!",
                 create: (i, w) => w.create("magazzino", 1655, 6655) },
  dialogo_2_5: { who: SOLDIER2, arm: 10, text: "Let's get to work! I promise you we will free the countryside",
                 create: (i, w) => {
                   for (const [x, y] of [[2654, 7571], [1262, 5438], [2842, 3928], [173, 3516], [49, 2174], [2784, 2248], [2876, 1200]]) {
                     w.create("palo_1", x, y);
                   }
                   w.create("objective_button", 0, 0);
                 } },
  dialogo_2_6: { who: [...VILLAGER, "Survived villager"], arm: 10, text: "Thank you! Sadly I'm the only survivor here, but I will join you!" },
  dialogo_2_7: { who: [...VILLAGER, "Villagers"], arm: 10, text: "We are safe now! We will help you defeat the enemy!" },
  dialogo_2_8: { who: [...VILLAGER, "Lumberjacks"], arm: 10, text: "Here is some wood for your help! Count on us too!" },
  dialogo_2_9: { who: [...VILLAGER, "Villager"], arm: 10, text: "Finally free! We will work together to defeat the invaders!" },
  dialogo_2_10: { who: [...VILLAGER, "Villagers"], arm: 10, text: "We will always be grateful for your help!" },
  dialogo_2_11: { who: [...VILLAGER, "Gold miners"], arm: 10, text: "This area is full of gold to mine, count on us!" },
  dialogo_2_12: { who: [...VILLAGER, "Villagers"], arm: 10, text: "Thank you for freeing my village!" },
  // la base nemica: chiudendolo la view salta a (500, 600)
  dialogo_2_13: { who: SPY, arm: 10, vanish: true,
                  text: "Our spies have found the enemy base. It's north of here. Let's destroy it to stop the attacks!",
                  create: (i, w) => w.create("palo_1", 150, 250),
                  click: (i, w) => { w.cam.x = 500; w.cam.y = 600; w.cam.clamp(); } },
  dialogo_2_14: { who: SPY, arm: 10, vanish: true, text: "It seems that this very barracks trains the archers who protect that point." },
  // livello 3 [§9.11, testi dell'autore riscritti]: la regia e' in
  // levels.js (enemyManagerLv3), che li crea; chiudere il 3_3 rivela il
  // monastero
  dialogo_3_0: { who: SOLDIER2, arm: 30,
                 text: "We are alone in enemy land... If we follow the road we should reach a village. They could give us support." },
  dialogo_3_1: { who: [...VILLAGER, "Villager"], arm: 30, next: "dialogo_3_2",
                 text: "Soldiers! Welcome, our village is yours. But listen: the invaders are trying to seize the monastery north of here, near the mountains!" },
  dialogo_3_2: { who: [...VILLAGER, "Villager"], arm: 30, next: "dialogo_3_3",
                 text: "Its walls are strong and the monks heal the wounded. If it falls, nothing will stop them." },
  dialogo_3_3: { who: SOLDIER2, arm: 30,
                 text: "Then we will defend the monastery! From its fortified position we can stop their advance.",
                 destroy: (i, w) => { for (const m of w.all("enemy_manager_lv3")) m.revealAsked = 1; } },
  dialogo_3_4: { who: SOLDIER2, arm: 30, timeout: 900,
                 text: "The monastery is ours. Hold it until the end of the countdown: if it is damaged beyond half, it is lost. Watch out for their rams!" },
  dialogo_3_5: { who: [...VILLAGER, "Villager"], arm: 30,
                 text: "The attacks on the village come from the enemy base to the south-west. Destroy its barracks and stables and they will stop!" },
  dialogo_3_6: { who: SOLDIER2, arm: 30, timeout: 600, text: "Hold on! Just one more minute!" },
  // statue di lvl01: niente ritratto, titolo a 20 px
  dialogo_statua: { who: ["o_statua1_real", null, "Sacred statues"], arm: 30,
                    text: "Those monuments can heal your soldiers while they're nearby" },
};

// ------------------------------------------------------- comportamento

function textHeight(w, text) {
  // testo_h = string_height_ext(testo, 30, 340) col font overdue; il Create
  // lascia il font a GUI_1 [C]
  const d = w.gfx;
  if (!d) return 30;
  d.setFont("overdue");
  const h = d.stringHeightExt(text, 30, 340);
  d.setFont("GUI_1");
  return h;
}

// Il testo (e quindi l'altezza della finestra) dipende dalla lingua, che si
// puo' cambiare dal menu di pausa a finestra aperta.
function measure(i, w) {
  const l = getLanguage();
  if (i.lang === l) return;
  i.lang = l;
  i.testo_h = textHeight(w, tr(i.testo));
}

// la finestra in pixel dello schermo, dall'ancora in coordinate di room
function toScreen(w, x, y) {
  const cam = w.cam, s = cam.scaleview;
  return [x / s - cam.x / s, y / s - cam.y / s];
}

// mouse_x > view_xview + posx*scaleview && ... [C]
function over(i, w) {
  const cam = w.cam, s = cam.scaleview, mx = w.mouse.x, my = w.mouse.y;
  return mx > cam.x + i.posx * s && mx < cam.x + i.posx * s + W380 * s
      && my > cam.y + i.posy * s && my < cam.y + i.posy * s + i.testo_h * s + 68 * s;
}

function place(i, w, inst) {
  if (inst) [i.posx, i.posy] = toScreen(w, inst.x, inst.y);
}

// Il disegno comune [C, Draw_GUI di hint_legna e dialogo_1_0]
function drawWindow(d, i, titleX, portrait) {
  d.setAlpha(i.hover === 0 ? 0.69 : 0.99);
  d.roundrectColourExt(i.posx, i.posy, i.posx + 380, i.posy + i.testo_h + 68, 60, 60, c.white, c.white, false);
  d.setFont("GUI_1");
  d.setColour(c.black);
  d.setValign("bottom");
  d.setHalign("left");
  d.setAlpha(0.75);
  d.text(i.posx + titleX, i.posy + 38, tr(i.titolo));
  d.setValign("top");
  d.setFont("overdue");
  d.textExt(i.posx + 20, i.posy + 43, tr(i.testo), 30, 340);
  d.setFont("GUI_1");
  d.setValign("middle");
  d.setAlpha(1);
  if (portrait) d.sprite(portrait, 0, i.posx, i.posy);
}

export function hint(name) {
  const H = HINTS[name], [titolo, testo] = T[name];
  const anchorNow = (i, w) => {
    const A = H.anchor;
    if (A.kind === "fixed") { [i.posx, i.posy] = A.pos(w, i); return true; }
    if (A.kind === "mouse") {
      if (!A.follow || !i.anchorInst || !i.anchorInst.alive) i.anchorInst = w.nearest(w.mouse.x, w.mouse.y, A.obj);
      place(i, w, i.anchorInst);
      return true;
    }
    if (!i.vicino || !i.vicino.alive) return false; // vicino
    place(i, w, i.vicino);
    return true;
  };
  const click = (i, w) => {
    if (!over(i, w) || (H.arm && i.arm !== 1)) return;
    if (H.next) w.create(H.next, H.nextAtSelf ? i.x : 0, H.nextAtSelf ? i.y : 0);
    w.destroy(i);
  };
  return {
    create(i, w) {
      Object.assign(i, { titolo, testo, hover: 0, arm: 0 });
      i.sprite_index = null;
      if (H.resource) w.g.resourcehint = 1;
      measure(i, w);
      if (H.anchor.kind === "vicino") i.vicino = w.nearest(w.mouse.x, w.mouse.y, H.anchor.obj);
      i.posx = i.posy = 0;
      if (H.anchor.kind === "mouse" && !w.exists(H.anchor.obj)) [i.posx, i.posy] = toScreen(w, i.x, i.y); // [§3.18 n.64]
      anchorNow(i, w);
      if (H.arm) i.alarm.set(0, H.arm);
    },
    alarm0(i) { i.arm = 1; },
    step(i, w) {
      measure(i, w);
      i.hover = over(i, w) ? 1 : 0;
      const A = H.anchor;
      if (A.kind === "vicino") { if (!anchorNow(i, w)) w.destroy(i); }
      else if (A.follow) anchorNow(i, w);
    },
    [H.click === "pressed" ? "globalLeftPressed" : "globalLeftReleased"]: click,
    // H nasconde i suggerimenti (global.hint). [Correzione decisa
    // dall'autore, §3.19 n.65] hint_multi_2 non disegna piu' il vecchio
    // riquadro di prova (azione 2 del suo Draw GUI, alla x,y di room usate
    // come coordinate dello schermo).
    drawGUI(i, w, d) {
      if (w.g.hint !== 1) return;
      drawWindow(d, i, 20, null);
    },
  };
}

export function dialog(name) {
  const D = DIALOGS[name];
  const [obj, portrait, titolo] = D.who;
  return {
    create(i, w) {
      Object.assign(i, { titolo, testo: D.text, hover: 0, arm: 0 });
      i.sprite_index = null;
      i.parlante = w.nearest(i.x, i.y, obj);
      measure(i, w);
      i.posx = i.posy = 0;
      place(i, w, i.parlante);
      if (D.arm) i.alarm.set(0, D.arm);
      if (D.timeout) i.alarm.set(1, D.timeout);
      if (D.create) D.create(i, w);
    },
    alarm0(i) { i.arm = 1; },
    alarm1(i, w) { w.destroy(i); },
    step(i, w) {
      const gone = !i.parlante || !i.parlante.alive;
      if (D.vanish && gone) { w.destroy(i); return; }
      measure(i, w);
      i.hover = over(i, w) ? 1 : 0;
      // senza `vanish` l'originale leggerebbe parlante.x di un'istanza
      // morta (errore); qui la finestra resta dov'era [deviazione
      // confermata dall'autore, §3.18 n.68]
      if (!gone) place(i, w, i.parlante);
      if (D.step) D.step(i, w);
    },
    globalLeftPressed(i, w) {
      if (!over(i, w) || (D.arm && i.arm !== 1)) return;
      if (D.click) D.click(i, w);
      w.destroy(i);
    },
    destroy(i, w) {
      if (D.next) w.create(D.next, i.x + (D.nextOffset ? D.nextOffset[0] : 0), i.y + (D.nextOffset ? D.nextOffset[1] : 0));
      if (D.destroy) D.destroy(i, w);
    },
    // [Correzione decisa dall'autore, §3.19 n.62] H nasconde solo i
    // suggerimenti del tutorial, non i dialoghi (l'originale nascondeva
    // anche questi, che pero' restavano cliccabili: in lvl01 la vittoria
    // arriva chiudendo un dialogo).
    drawGUI(i, w, d) {
      drawWindow(d, i, portrait ? 50 : 20, portrait);
    },
  };
}

// I suggerimenti "la prima volta che succede" [C]: solo se non c'e' gia'
// una finestra aperta (instance_number(parent_hint)<1), una volta sola
// (il flag globale), e per le risorse solo dopo hint_resource.
export function hintOnce(w, name, flag, x, y, cond = true) {
  const g = w.g;
  if (g[flag] === 0 && w.number("parent_hint") < 1 && cond) {
    w.create(name, x, y);
    g[flag] = 1;
  }
}

// [Correzione decisa dall'autore, §3.19 n.69] casse e picchiere nemico
// controllavano instance_number(parent_dialogo), un oggetto senza figli
// (sempre 0): qui "nessun dialogo aperto".
export function dialogOpen(w) {
  for (const n of DIALOG_NAMES) if (w.exists(n)) return true;
  return false;
}

export const HINT_NAMES = Object.keys(HINTS);
export const DIALOG_NAMES = Object.keys(DIALOGS);
