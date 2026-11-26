// L'editor di mappe (STUDIO.md §9.180, ?room=editor).
//
// Richiesta dell'autore (22 novembre 2026), dal suo disegno: un editor di
// mappe dentro il gioco, dal menu "Giocatore singolo" -> "Editor di mappe"
// (sotto "Schermaglia"), che faccia piu' o meno quello che oggi si fa con
// Tiled e il kit (§9.1-§9.3, §9.97-§9.101). L'interfaccia del disegno:
// - una colonna a sinistra con gli strumenti: sposta (copia e incolla,
//   specchia, elimina), polilinea (fiumi, strade), pennello d'area (boschi,
//   texture), inserisci (unita', risorse, edifici...); sotto, staccate, le
//   azioni sulla mappa: nuova, apri, salva, prova, impostazioni (CPU,
//   descrizione e informazioni della mappa);
// - in basso un riquadro con lo strumento scelto (le sue opzioni).
//
// La mappa dell'editor e' uno scenario ("535-scenario", §9.3): lo stesso
// formato che scrive tools/12_tiled_import.py e che il gioco carica
// (tools/07_scene.py), cosi' una mappa fatta qui e una fatta in Tiled sono
// la stessa cosa.
//
// [§9.180] Primo passo, lo scheletro: la mappa vuota (green1, 6000 x 6000),
// la vista che scorre (frecce, tasto centrale o Spazio + trascina) e lo zoom
// con la rotella attorno al puntatore, la colonna e il riquadro. Gli
// strumenti si scelgono (clic o tasti 1-4) ma non fanno ancora niente. Esc o
// il cerchio in alto a destra tornano al menu.
// [§9.181, decisione dell'autore: "Tiled era un esempio, facciamo la cosa
// piu' comoda per noi"] Secondo passo, la mappa vera: disegnata col motore
// del gioco (un World senza comportamenti, solo per disegnare: sprite in
// ordine di depth, il suolo cotto coi fiumi, le strade, i ponti e le macchie,
// le macchie d'erba e di fiori con le loro particelle), anche da lontano (il
// suolo a risoluzione ridotta, ground.js lodFor). "Apri mappa" apre le mappe
// del gioco come punto di partenza.
// [§9.182, decisioni dell'autore] l'editor e' per i giocatori e fa mappe da
// schermaglia: "Apri mappa" offre solo le cinque schermaglie, come modelli
// per una mappa nuova (i livelli della campagna non si toccano). Terzo
// passo: "Inserisci" (la tavolozza degli oggetti della schermaglia,
// editmap.js CATALOG, col fantasma sotto il puntatore), "Sposta" (scegliere
// con un clic o un riquadro, trascinare, copia e incolla, specchia,
// elimina), annulla e ripeti, "Nuova mappa" (vuota), e la conferma prima di
// perdere le modifiche. La mappa e le modifiche stanno in editmap.js.
// [§9.184] Quarto passo: salva (nel browser, IndexedDB, e su file
// ".dvmap": mapstore.js) e apri (le proprie mappe, i modelli, un file, con
// la convalida di mapfile.js validateMap), le impostazioni (nome,
// descrizione, misure, sfondo, CPU con la "statica", simmetria) in pannelli
// HTML (caselle di testo vere), e la simmetria in tutti i comandi di
// "Inserisci" e "Sposta".
// [§9.185] Quinto passo: il pennello (boschi e texture, editbrush.js) e la
// copertina della mappa nelle impostazioni.
// [§9.186, richieste dell'autore] il pennello e' un ovale assonometrico (ISO,
// come il suolo); la simmetria e' un'impostazione degli strumenti (Sposta,
// Inserisci, Pennello: una riga in fondo al riquadro), non della mappa;
// difficolta' e stile della CPU anche "a scelta del giocatore".
// [§9.187] Sesto passo: la polilinea (fiumi e strade; i ponti no, per ora);
// niente titolo in alto; con la mappa cambiata, prima di uscire (o di
// aprirne un'altra) "Salvare le modifiche?".
// [§9.188] Settimo passo: i file come salvataggio vero (la mappa resta
// collegata al suo file, Ctrl+S lo riscrive oltre al browser; "Salva con
// nome" dove si puo', se no il download) e "Prova mappa" (la mappa giocata
// come schermaglia, "custom" in app.js, poi di nuovo l'editor com'era).
//
// Un ciclo suo, senza partita (app.js passa qui prima di crearla):
// renderer, atlas, input e ciclo sono quelli del gioco.

import { c } from "./colours.js";
import { tr, t } from "./i18n.js";
import { Input } from "./input.js";
import { Loop } from "./loop.js";
import { Draw } from "./draw.js";
import { lodFor } from "./ground.js";
import { drawSprite } from "./sprites.js";
import { SK_MAPS, SK_OPTIONS, loadSkirmish } from "./skirmish.js";
import { skForMap } from "./skuser.js";
import { NetPanel } from "./netui.js";
import { setDomText } from "./domtext.js";
import { glowText } from "./menu.js";
import { glassBackdrop } from "./glass.js"; // §9.203
import { dcos, dsin, dhypot } from "./dmath.js";
import { newMap, roomToScenario, validateMap, MAP_SIZES, MAP_BACKGROUNDS, CPU_DIFFICULTY, CPU_STYLE, SYMMETRY, NAME_MAX, DESC_MAX,
         testRoom, TEST_ROOM, sidesOk, SIDES, lockOf, lockOpens, isStart, FOG_SETTINGS, FOG_DEFAULTS, fogOf, fogDiff } from "./mapfile.js";
import { EditScene, CATALOG, START, STARTS, SYSTEM, groupsFor, tightBounds, paletteItems, stylesOf, catalogObjects, allowedObjects,
         mirrorDelta, mirrorPoint, TREES, paletteCount, sideLook, freePluses, wallStep, GATE_SWAP, WALL_KIND, FLAG_SCALE, FAKE, fakeMark,
         FOG_OBJECTS, fogLook, FOG_SPAN } from "./editmap.js";
import { saveMap, listMaps, loadMap, deleteMap, openMapFile, makeCover, saveMapAs, writeMapFile, putService, takeService } from "./mapstore.js";
import { ISO, riverGeometry } from "./rivers.js";
import { MOUNTAIN_STEPS, PEAK_STEPS, crestProblem, baseProblem } from "./mountains.js"; // §9.214, §9.215
import { MEADOW_KEYS, MEADOW_LABEL, MEADOW_STEPS, MEADOW_DEFAULT, MEADOW_LIMITS, meadowTotal } from "./meadows.js"; // §9.216
import { strokeOutlines, forestStep, TreeGrid, pointInPoly } from "./editbrush.js";
import { vrand } from "./rng.js";
import { Particles } from "./particles.js"; // §9.218: le icone dell'erba
import { MEADOW_PARTS } from "./effects.js"; // §9.218

// ----------------------------------------------------------------- vista

// La vista dell'editor: come la Camera del gioco (x, y, w, h in pixel di
// mappa, cssW e cssH della finestra), ma con lo zoom fra VIEW_MIN (piu'
// vicino che in partita) e VIEW_MAX (piu' lontano: la mappa intera, o
// quasi), e un margine fuori dalla mappa per arrivare ai bordi da sotto la
// colonna e il riquadro. scale: pixel di mappa per pixel CSS.
export const VIEW_MIN = 0.5, VIEW_MAX = 8, VIEW_MARGIN = 400; // §9.181: VIEW_MAX da 4 a 8 (la mappa intera)
export class EditorView {
  constructor(mapW, mapH) {
    Object.assign(this, { mapW, mapH, x: 0, y: 0, w: 1, h: 1, cssW: 1, cssH: 1, scale: 1.5 });
  }

  // la finestra cambia: il centro della vista resta dov'era
  resize(cssW, cssH) {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    this.cssW = cssW; this.cssH = cssH;
    this.w = cssW * this.scale; this.h = cssH * this.scale;
    this.x = cx - this.w / 2; this.y = cy - this.h / 2;
    this.clamp();
  }

  centre(x, y) { this.x = x - this.w / 2; this.y = y - this.h / 2; this.clamp(); }

  // [§9.181] un'altra mappa (Apri)
  setMap(mapW, mapH) { this.mapW = mapW; this.mapH = mapH; this.clamp(); }

  toRoom(px, py) { return [this.x + px * this.scale, this.y + py * this.scale]; }

  // zoom attorno a un punto dello schermo: il punto della mappa sotto il
  // puntatore resta sotto il puntatore
  zoomAt(s, px, py) {
    const [rx, ry] = this.toRoom(px, py);
    this.scale = Math.min(VIEW_MAX, Math.max(VIEW_MIN, s));
    this.w = this.cssW * this.scale; this.h = this.cssH * this.scale;
    this.x = rx - px * this.scale; this.y = ry - py * this.scale;
    this.clamp();
  }

  // spostamento in pixel CSS (trascinando: la mappa segue il puntatore)
  pan(dx, dy) { this.x += dx * this.scale; this.y += dy * this.scale; this.clamp(); }

  // dentro la mappa piu' il margine; se la vista e' piu' grande, centrata
  clamp() {
    const M = VIEW_MARGIN;
    const fit = (v, size, room) => (size >= room + 2 * M ? (room - size) / 2 : Math.max(-M, Math.min(v, room + M - size)));
    this.x = fit(this.x, this.w, this.mapW);
    this.y = fit(this.y, this.h, this.mapH);
  }
}

// ------------------------------------------------------------ interfaccia

// Gli strumenti (in alto nella colonna) e le azioni sulla mappa (sotto,
// staccate), nell'ordine del disegno dell'autore. label: il suggerimento a
// destra della colonna e il titolo del riquadro; desc: cosa fara' (nel
// riquadro, finche' lo strumento non c'e').
// [§9.214, richiesta dell'autore] la montagna, "tasto dedicato sotto alla polilinea"
export const TOOLS = ["select", "line", "mountain", "brush", "insert", "erase"];
// i tasti 1-6: quelli di prima restano (la gomma e' ancora il 5), la montagna e' il 6
export const TOOL_KEYS = ["select", "line", "brush", "insert", "erase", "mountain"];
export const ACTIONS = ["new", "open", "save", "test", "settings"];
// [§9.195, richiesta dell'autore] il secondo gruppo, fra gli strumenti e le
// azioni: annulla, taglia, copia, incolla (oltre ai tasti)
export const EDITS = ["undo", "redo", "cut", "copy", "paste"]; // §9.199: anche Ripeti
export const LABEL = {
  select: "Move, copy and paste, mirror, delete",
  line: "Polyline: rivers, roads",
  mountain: "Mountain: crest and base", // §9.214
  brush: "Area brush: forests, bouquets, textures", // §9.216: anche l'erba (§9.219: il bouquet)
  insert: "Insert: units, resources, buildings…",
  erase: "Area eraser: delete objects",
  undo: "Undo (Ctrl+Z)",
  redo: "Redo (Ctrl+Y)",
  cut: "Cut (Ctrl+X)",
  copy: "Copy (Ctrl+C)",
  paste: "Paste (Ctrl+V)",
  new: "New map",
  open: "Open map",
  save: "Save map",
  test: "Test map",
  settings: "Settings: CPU, description and map info",
};
export const DESC = {
  select: "Select objects with a click or a box and drag them to move them; copy and paste, mirror or delete the selection.",
  line: "Draw rivers and roads point by point, with their width; drag the points to change their course. Bridges go across rivers.",
  mountain: "Draw a mountain in two steps: the crest, peak by peak, then its base on the ground (or the automatic one). Objects underneath are removed, rivers and roads go around it.",
  brush: "Paint forests, bouquets of grass and flowers with the particles you choose, and ground textures (city paving, stone, meadow, sand) with a round brush; the right button erases them.",
  insert: "Choose an object by category (units, buildings, resources, nature, city…) and place it on the map.",
  erase: "Delete all the objects under the brush, holding the left button down.",
};
export const HELP = "Arrows, middle button or Space + drag: move the view. Wheel: zoom. Esc: back to the menu.";
// [§9.182] i comandi degli strumenti che ci sono
export const SELECT_HINTS = "Click: select (Shift: add). Drag: move, or select with a box (Ctrl: always a box). Del: delete. M: mirror. S: style. "
  + "Ctrl+C, Ctrl+V: copy and paste. Ctrl+Z, Ctrl+Y: undo, redo.";
export const READY = new Set(["select", "insert", "brush", "line", "erase", "mountain"]); // gli strumenti che funzionano (§9.185: il pennello, §9.187: la polilinea)
// [§9.184] i nomi degli sfondi e della simmetria nelle impostazioni
export const BG_NAMES = { green1: "Meadow", city2: "Paving", city1: "Stone", sabbia: "Sand" }; // (§9.219: la sabbia, solo pennello)
export const SYM_NAMES = { none: "Off", diagonal: "Diagonal", horizontal: "Horizontal", vertical: "Vertical" };
// [§9.214, richieste dell'autore] La montagna (mountains.js): in due passi,
// la cresta (cima per cima, come si vede) e poi la base sul terreno (o
// quella automatica, larga `width`); i parametri coi "-" e "+" (quelli
// delle montagne nuove, o della montagna scelta), "Nuova variante" (un
// altro seme) e "Base automatica" (via la base disegnata). Il riquadro: tre
// colonne, due righe.
export const MTN_KEYS = ["height", "width", "rough", "detail"];
export const MTN_LABEL = { height: "Height", width: "Width", rough: "Roughness", detail: "Detail" };
export function mountainLayout(panel) {
  const [x1, y1, x2] = panel, cw = (x2 - x1 - 48) / 3;
  const group = (col, cy) => {
    const x = x1 + 24 + col * cw;
    return { label: [x + 6, cy], minus: [x + cw - 132, cy, 15], value: [x + cw - 80, cy], plus: [x + cw - 28, cy, 15] };
  };
  const cy1 = y1 + 84, cy2 = y1 + 130, bx = x1 + 24 + 2 * cw + 10;
  return { height: group(0, cy1), width: group(1, cy1), rough: group(0, cy2), detail: group(1, cy2),
           seed: [bx, cy1 - 17, x2 - 24, cy1 + 17], auto: [bx, cy2 - 17, x2 - 24, cy2 + 17] };
}
// [§9.214, richiesta dell'autore: "strumenti di controllo per evitare
// inserimenti di punti assurdi o infattibili"] il perche' di un punto
// rifiutato (mountains.js crestProblem, baseProblem), e quando una
// montagna ne tocca un'altra
export const MTN_PROBLEM = {
  crest: { count: "A crest has at most 12 peaks.", close: "Too close to the previous peak.", far: "Too far from the previous peak.",
           sharp: "The crest turns back too sharply.", cross: "The crest can't cross itself." },
  base: { count: "A base has 3 to 64 points.", close: "Too close to the previous point.", cross: "The base can't cross itself.",
          small: "This base is too small.", crest: "The base must lie under the whole crest." },
};
export const MTN_OVERLAP = "A mountain can't touch another one.", MTN_TWIN = "The mountain touches its mirror twin: move it away from the axis.";
export const MTN_HINTS = {
  idle: "Click: first peak of a new mountain. Click on a mountain: select it.",
  crest: "Step 1, the crest. Click: add a peak. Right click or Enter: done. Backspace: last peak away. Esc: cancel.",
  base: "Step 2, the base. Click: add a point. Right click or Enter: done (no points: automatic base). Esc: cancel.",
  sel: "Drag the points. Click on a peak: its height. Del: delete. B: draw the base again.",
  // [§9.215] una cima scelta: la sua altezza
  peak: "Peak {n}: + and - raise and lower it. Esc: the whole mountain.", // (§9.221: "Altezza" ora e' un'icona)
};
export const MTN_TEXTS = [...Object.values(MTN_LABEL), ...Object.values(MTN_PROBLEM.crest), ...Object.values(MTN_PROBLEM.base), MTN_OVERLAP, MTN_TWIN,
  ...Object.values(MTN_HINTS), "Peak height", "New variant", "Automatic base", "Trees removed under the mountain: {n}", "Objects removed under the mountain: {n}",
  "Rivers and roads moved around the mountain: {n}", "Rivers and roads removed (under the mountain): {n}", "This peak would go off the map."];
export const mtnValue = (k, v) => (k === "rough" || k === "detail" ? Math.round(v * 100) + "%" : v + " px");

export const EDITOR_TEXTS = ["Map editor", "Coming soon", "Open map", "This map could not be opened", HELP, SELECT_HINTS,
                             "Skirmish maps, as templates for a new map", "New map from {map}", "{n} selected",
                             "Click: place. Right click: stop.", "Choose an object", "S: style {i}/{n}", "Each side has one starting position.", "Red side (S: blue)", "Blue side (S: red)", "Units",
                             "Red side (S: horizontal / vertical)", "Blue side (S: horizontal / vertical)", "Left: erase. Shift + wheel: width.",
                             "Red side (S: style {i}/{n})", "Blue side (S: style {i}/{n})", // §9.203: la casa
                             "Trees removed from the river: {n}", // §9.204
                             "Random style: on", "Random style: off", // §9.227
                             "Bouquet", "Particles every 100 x 100 px", ...Object.values(MEADOW_LABEL), "Choose at least one kind of particle.", // §9.216
                             "Too much grass on this map: erase some first.",
                             ...MTN_TEXTS, // §9.214
                             "Speed", "Range", "Duration", "Clouds", "Every", // §9.206: la nebbia
                             "Move the pointer: straight or around the corner. Click: place. Right click: cancel.", "Wall",
                             "The changes to this map will be lost.", "Continue", "Cancel",
                             // [§9.184] salva, apri, impostazioni, simmetria
                             "Map settings", "Name", "Description", "Width", "Height", "Background", "Difficulty", "CPU style",
                             "Static", "Symmetry", "Apply", "Save in the browser", "Save to file", "Give the map a name.", "Map saved",
                             "Saving failed", "Your maps", "Templates", "Open a file…", "No saved maps yet", "This map will be deleted.",
                             "Delete", "Player's choice", ...Object.values(BG_NAMES), ...Object.values(SYM_NAMES),
                             // [§9.185] il pennello, la copertina
                             "Forest", "Density", "Left: paint. Right: erase.", "Cover", "No cover", "Load an image…", "Remove",
                             "This image could not be read.",
                             // [§9.187] la polilinea, l'avviso prima di uscire
                             "River", "Road", "Track", "End width", "Same", "Save the changes to this map?", "Save", "Don't save",
                             "Click: new line. Click on a line: select it.", "Click: add a point. Right click or Enter: finish. Esc: cancel.",
                             "Drag the points. Double click: new point. Del: delete the line. Backspace: delete the point.",
                             // [§9.188] i salvataggi su file, "Prova mappa"
                             "Where", "In the browser", "To a file", "Choose at least one place.",
                             "A skirmish map needs a red and a blue starting position (Insert, Setup).",
                             ...Object.values(LABEL), ...Object.values(DESC), ...CATALOG.map((k) => k.label)];

// [§9.197] la freccina nera col bordo bianco, 24 x 24, punta in (2, 2)
const ARROW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'
  + '<path d="M2.5 2.5 L2.5 18.5 L6.6 14.6 L9.4 21 L12 19.9 L9.3 13.6 L14.8 13.6 Z" fill="#000" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
export const ARROW_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(ARROW_SVG)}") 2 2, default`;

// Misure della colonna (a scala 1) e del riquadro, in pixel CSS
const COL = { left: 20, top: 20, btn: 56, gap: 10, pad: 12, sep: 44 };
// (§9.184: 196, prima 170: i comandi di "Sposta" su tre righe; §9.186: 226, la riga della simmetria;
// §9.188: 246, in "Sposta" la riga della simmetria toccava quella dei comandi della vista)
const PANEL = { h: 246, maxW: 980, margin: 30, bottom: 20 };
export const BACK_BTN = [50, 50, 30]; // dal bordo destro, dall'alto, raggio (come menu.js FULL_BTN)

// Dove sta tutto, per una finestra W x H: la colonna (col: x1, y1, x2, y2),
// i suoi pulsanti tondi ({kind, key, x, y, r}), il riquadro dello strumento
// (panel) e il cerchio "Indietro" (back: x, y, r). Con una finestra bassa
// la colonna si rimpicciolisce tutta (k) per starci.
// [§9.196, richiesta dell'autore] non piu' sotto COL_MIN: oltre, la colonna
// scorre (scroll: px dall'alto, gia' limitato; maxScroll). Le frecce su e
// giu' (up, down: [x, y, r]) in cima e in fondo; i pulsanti fuori dalla
// parte che si vede hanno hidden e non si toccano.
const COL_MIN = 0.75, COL_ARROW = 30; // (§9.199: 0,8 con Ripeti; §9.214: 0,75 con la montagna, a 900 px stanno ancora tutti)
// (§9.203: la freccia della schermaglia, alta come quelle della mappa, menu.js
// arrow con r 22, poi il 40% piu' piccola: richiesta dell'autore)
const COL_ARROW_SCALE = ((22 * 0.45 * 2.6) / 24) * 0.6;
export function editorLayout(W, H, scroll = 0) {
  const n = TOOLS.length + EDITS.length + ACTIONS.length;
  const full = 2 * COL.pad + n * COL.btn + (n - 3) * COL.gap + 2 * COL.sep; // (§9.195: tre gruppi, due lineette)
  const room = H - 2 * COL.top;
  const k = Math.max(COL_MIN, Math.min(1, room / full));
  const b = COL.btn * k, gap = COL.gap * k, pad = COL.pad * k, sep = COL.sep * k;
  const x1 = COL.left, x2 = x1 + b + 2 * pad, y1 = COL.top;
  const tall = full * k > room, arrow = tall ? COL_ARROW : 0;
  // (la parte che si vede: fra le due frecce)
  const vy1 = y1 + arrow, vy2 = tall ? y1 + room - arrow : Infinity;
  const maxScroll = tall ? Math.ceil(full * k - (vy2 - vy1)) : 0;
  scroll = Math.max(0, Math.min(maxScroll, scroll));
  const buttons = [];
  let y = y1 + pad + arrow - scroll;
  for (const key of TOOLS) { buttons.push({ kind: "tool", key, x: (x1 + x2) / 2, y: y + b / 2, r: b / 2 }); y += b + gap; }
  y += sep - gap;
  for (const key of EDITS) { buttons.push({ kind: "edit", key, x: (x1 + x2) / 2, y: y + b / 2, r: b / 2 }); y += b + gap; }
  y += sep - gap;
  for (const key of ACTIONS) { buttons.push({ kind: "action", key, x: (x1 + x2) / 2, y: y + b / 2, r: b / 2 }); y += b + gap; }
  for (const bt of buttons) bt.hidden = bt.y - bt.r < vy1 - 1 || bt.y + bt.r > vy2 + 1;
  const col = tall ? [x1, y1, x2, y1 + room] : [x1, y1, x2, y - gap + pad];
  const cx = (x1 + x2) / 2;
  const up = tall ? [cx, y1 + arrow / 2 + 2, arrow / 2 - 2] : null, down = tall ? [cx, y1 + room - arrow / 2 - 2, arrow / 2 - 2] : null;
  // il riquadro: in basso, centrato nello spazio a destra della colonna
  const left = x2 + PANEL.margin, right = W - PANEL.margin, pw = Math.max(200, Math.min(PANEL.maxW, right - left));
  const px1 = left + Math.max(0, (right - left - pw) / 2);
  const panel = [px1, H - PANEL.bottom - PANEL.h, px1 + pw, H - PANEL.bottom];
  return { k, col, buttons, panel, back: [W - BACK_BTN[0], BACK_BTN[1], BACK_BTN[2]], scroll, maxScroll, up, down,
           step: b + gap }; // (step: di quanto scorre uno scatto)
}

const inRect = (x, y, R) => x >= R[0] && y >= R[1] && x <= R[2] && y <= R[3];

// Cosa c'e' sotto il puntatore: un pulsante della colonna, "back", "ui"
// (la colonna o il riquadro, fuori dai pulsanti) o null (la mappa)
export function hitTest(L, mx, my) {
  for (const b of L.buttons) if (!b.hidden && dhypot(mx - b.x, my - b.y) <= b.r) return b;
  // [§9.196] le frecce della colonna che scorre
  if (L.up && L.scroll > 0 && dhypot(mx - L.up[0], my - L.up[1]) <= L.up[2] + 4) return { kind: "colscroll", key: "up", dir: -1 };
  if (L.down && L.scroll < L.maxScroll && dhypot(mx - L.down[0], my - L.down[1]) <= L.down[2] + 4) return { kind: "colscroll", key: "down", dir: 1 };
  if (dhypot(mx - L.back[0], my - L.back[1]) <= L.back[2]) return { kind: "back", key: "back" };
  if (inRect(mx, my, L.col) || inRect(mx, my, L.panel)) return { kind: "ui", key: null };
  for (const R of L.extra || []) if (inRect(mx, my, R)) return { kind: "ui", key: null }; // §9.206: il riquadro della nebbia
  return null;
}

// ------------------------------------------------------------------ icone

// Le icone della colonna, disegnate a linee e forme come il simbolo dello
// schermo intero (menu.js drawFullButton), in un riquadro di +-16 px a scala
// 1. ink: il colore del segno.
const DARK = 0x3c3c3c;
// [§9.191] i colori dei due schieramenti (BGR, come Draw)
export const SIDE_COLOUR = { red: 0x3830c8, blue: 0xe87030 };
export const NEED_SIDES = "A skirmish map needs a red and a blue starting position (Insert, Setup).";
// [§9.193] lo schieramento della casella scelta (S: l'altro)
export const SIDE_HINT = { red: "Red side (S: blue)", blue: "Blue side (S: red)" };
// [§9.194] le mura: la parte e S che le gira di 90 gradi
export const WALL_HINT = { red: "Red side (S: horizontal / vertical)", blue: "Blue side (S: horizontal / vertical)" };
// [§9.203] la casa: la parte e S che ne cambia lo stile
export const HOME_HINT = { red: "Red side (S: style {i}/{n})", blue: "Blue side (S: style {i}/{n})" };
function drawIcon(d, key, x, y, s, ink) {
  // [§9.198, richiesta dell'autore] le icone disegnate dall'autore (PNG,
  // nuovi.json: ico_ed_*, bianche), tinte col colore del segno; dove non
  // ce n'e' una, il disegno a linee qui sotto
  // ([§9.199] Ripeti: la freccia di Annulla specchiata verso destra;
  // [§9.200] anche la gomma e' dell'autore, a linee resta solo Inserisci)
  const mirror = key === "redo", png = "ico_ed_" + (mirror ? "undo" : key);
  if (d.a.sprites[png] && d.a.frame(png, 0)) {
    const k = (32 * s) / 64;
    d.spriteExt(png, 0, x, y, mirror ? -k : k, k, 0, ink, d.alpha);
    return;
  }
  const L = (x1, y1, x2, y2, w = 3) => d.lineWidthColour(x + x1 * s, y + y1 * s, x + x2 * s, y + y2 * s, w * s, ink, ink);
  const T = (x1, y1, x2, y2, x3, y3) => d.triangleColour(x + x1 * s, y + y1 * s, x + x2 * s, y + y2 * s, x + x3 * s, y + y3 * s, ink, ink, ink, false);
  const C = (cx, cy, r, col = ink) => d.circleColour(x + cx * s, y + cy * s, r * s, col, col, false);
  const R = (x1, y1, x2, y2, col = ink) => d.rectangleColour(x + x1 * s, y + y1 * s, x + x2 * s, y + y2 * s, col, col, col, col, false);
  if (key === "select") { // quattro frecce
    L(-11, 0, 11, 0); L(0, -11, 0, 11);
    T(16, 0, 9, -6, 9, 6); T(-16, 0, -9, 6, -9, -6); T(0, -16, 6, -9, -6, -9); T(0, 16, -6, 9, 6, 9);
  } else if (key === "line") { // una polilinea coi suoi punti
    const P = [[-14, 9], [-6, -6], [4, 6], [14, -9]];
    for (let i = 1; i < P.length; i++) L(P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]);
    for (const [px, py] of P) C(px, py, 3.6);
  } else if (key === "mountain") { // [§9.214] due cime col contorno e una cresta interna
    L(-16, 12, -7, -4); L(-7, -4, -2, 3); L(-2, 3, 5, -13); L(5, -13, 16, 12); L(-17, 12, 17, 12);
    L(5, -13, 2, 6, 2); L(-7, -4, -8, 6, 2);
  } else if (key === "brush") { // pennello: manico, ghiera, setole, una pennellata
    L(15, -15, 4, -4, 4);
    L(4, -4, -1, 1, 7);
    T(-3, -1, 1, 3, -12, 10);
    d.setAlpha(d.alpha * 0.55);
    d.ellipseColour(x - 16 * s, y + 9 * s, x - 2 * s, y + 15 * s, ink, ink, false);
    d.setAlpha(d.alpha / 0.55);
  } else if (key === "insert") { // un omino col "+"
    C(-4, -8, 5.5);
    d.roundrectColourExt(x - 14 * s, y - 1 * s, x + 6 * s, y + 15 * s, 14 * s, 14 * s, ink, ink, false);
    L(6, -9, 16, -9); L(11, -14, 11, -4);
  } else if (key === "erase") { // [§9.194] la gomma (senza l'icona dell'autore, §9.200): un parallelepipedo inclinato con la fascia, e l'ovale
    d.setAlpha(d.alpha * 0.5);
    d.ellipseColour(x - 15 * s, y + 8 * s, x + 9 * s, y + 16 * s, ink, ink, false);
    d.setAlpha(d.alpha / 0.5);
    const Q = (pts) => {
      T(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
      T(pts[0][0], pts[0][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    };
    Q([[-12, 4], [4, -12], [15, -1], [-1, 15]]);
    d.setAlpha(d.alpha * 0.45);
    const W = (px1, py1, px2, py2) => d.lineWidthColour(x + px1 * s, y + py1 * s, x + px2 * s, y + py2 * s, 3 * s, c.white, c.white);
    W(-4, -4, 7, 7);
    d.setAlpha(d.alpha / 0.45);
  } else if (key === "undo") { // [§9.195] la freccia che torna indietro: un arco e la punta
    const P = [];
    for (let k = 0; k <= 10; k++) { const t = (k / 10) * Math.PI; P.push([2 + dcos(t) * 10, 2 - dsin(t) * 10]); }
    L(12, 12, 12, 2);
    for (let k = 1; k < P.length; k++) L(P[k - 1][0], P[k - 1][1], P[k][0], P[k][1]);
    T(-14, 0, -2, 0, -8, 9);
  } else if (key === "redo") { // [§9.199] la freccia di Annulla, specchiata
    const P = [];
    for (let k = 0; k <= 10; k++) { const t = (k / 10) * Math.PI; P.push([-2 - dcos(t) * 10, 2 - dsin(t) * 10]); }
    L(-12, 12, -12, 2);
    for (let k = 1; k < P.length; k++) L(P[k - 1][0], P[k - 1][1], P[k][0], P[k][1]);
    T(14, 0, 2, 0, 8, 9);
  } else if (key === "cut") { // le forbici: due anelli e le lame incrociate
    L(-5, 6, 7, -14, 2.5); L(5, 6, -7, -14, 2.5);
    for (const sx of [-6, 6]) { C(sx, 10, 5.5); C(sx, 10, 2.8, c.white); }
  } else if (key === "copy") { // due fogli
    const sheet = (ox, oy, fill) => {
      d.roundrectColourExt(x + (ox - 8) * s, y + (oy - 10) * s, x + (ox + 8) * s, y + (oy + 10) * s, 5 * s, 5 * s, ink, ink, false);
      if (fill) d.roundrectColourExt(x + (ox - 5.5) * s, y + (oy - 7.5) * s, x + (ox + 5.5) * s, y + (oy + 7.5) * s, 3 * s, 3 * s, c.white, c.white, false);
    };
    sheet(-4, -4, true); sheet(4, 4, true);
  } else if (key === "paste") { // la cartellina col fermaglio e il foglio
    d.roundrectColourExt(x - 11 * s, y - 11 * s, x + 11 * s, y + 15 * s, 5 * s, 5 * s, ink, ink, false);
    R(-6, -14, 6, -8);
    d.roundrectColourExt(x - 7 * s, y - 5 * s, x + 7 * s, y + 11 * s, 2 * s, 2 * s, c.white, c.white, false);
  } else if (key === "new") { // un foglio con l'angolo piegato e il "+"
    L(-11, -14, 3, -14, 2.5); L(3, -14, 10, -7, 2.5); L(10, -7, 10, 14, 2.5); L(10, 14, -11, 14, 2.5); L(-11, 14, -11, -14, 2.5);
    L(3, -14, 3, -7, 2); L(3, -7, 10, -7, 2);
    L(-6, 4, 6, 4); L(0, -2, 0, 10);
  } else if (key === "open") { // una cartella
    R(-15, -12, -4, -7);
    R(-15, -8, 15, 12);
    d.setAlpha(d.alpha * 0.45);
    R(-12, -3, 12, -1, c.white);
    d.setAlpha(d.alpha / 0.45);
  } else if (key === "save") { // un dischetto
    d.roundrectColourExt(x - 14 * s, y - 14 * s, x + 14 * s, y + 14 * s, 8 * s, 8 * s, ink, ink, false);
    R(-7, -14, 7, -5, c.white);
    R(2, -12, 5, -7, ink);
    R(-9, 2, 9, 12, c.white);
  } else if (key === "test") { // "prova": il triangolo del play
    T(-9, -14, 14, 0, -9, 14);
  } else if (key === "settings") { // un ingranaggio
    for (let a = 0; a < 8; a++) {
      const t = (a / 8) * Math.PI * 2;
      L(dcos(t) * 8, dsin(t) * 8, dcos(t) * 15, dsin(t) * 15, 6);
    }
    C(0, 0, 11);
    C(0, 0, 4.5, c.white);
  }
}

// ------------------------------------------------------------ Apri mappa

// [§9.181] Le mappe del gioco che si aprono nell'editor, come punto di
// partenza. [§9.182, decisione dell'autore] solo le mappe della schermaglia,
// come modelli per una mappa nuova: i livelli della campagna e il tutorial no
// (l'editor e' per i giocatori, e fa mappe da schermaglia).
export const TEMPLATES = SK_MAPS.filter((m) => m.room).map((m) => m.room);
export function mapLabel(room) {
  const sk = SK_MAPS.find((m) => m.room === room);
  return sk ? tr(sk.name) : room;
}
// [§9.184] Il pannello: a sinistra le mappe salvate nel browser (al piu'
// OPEN.mine righe, la rotella scorre le altre; ognuna col cerchio per
// eliminarla), a destra i modelli, sotto "Apri un file". Le righe: x1 y1 x2
// y2; del: il cerchio [x, y, r]; i titoli delle colonne e del pannello.
const OPEN = { w: 400, h: 46, gap: 10, colGap: 40, mine: 8 };
export function openLayout(W, H, nMine = 0, scroll = 0) {
  const n = Math.max(OPEN.mine, TEMPLATES.length), h = n * OPEN.h + (n - 1) * OPEN.gap;
  const top = Math.max(200, (H - h) / 2 - 10), L = W / 2 - OPEN.w - OPEN.colGap / 2, R = W / 2 + OPEN.colGap / 2;
  const row = (x, k) => ({ x1: x, y1: top + k * (OPEN.h + OPEN.gap), x2: x + OPEN.w, y2: top + k * (OPEN.h + OPEN.gap) + OPEN.h });
  const first = Math.max(0, Math.min(scroll, nMine - OPEN.mine));
  const mine = [];
  for (let k = 0; k < Math.min(OPEN.mine, nMine - first); k++) {
    const q = { ...row(L, k), index: first + k };
    q.del = [q.x2 - OPEN.h / 2, (q.y1 + q.y2) / 2, 14];
    mine.push(q);
  }
  const rows = TEMPLATES.map((room, k) => ({ room, ...row(R, k) }));
  // "Apri un file" sotto le mappe salvate (o sotto "Ancora nessuna mappa")
  const fy = top + Math.max(1, mine.length) * (OPEN.h + OPEN.gap) + 6;
  return { mine, rows, first, file: [L + 40, fy, L + OPEN.w - 40, fy + OPEN.h], title: [W / 2, top - 95],
           heads: [[L + OPEN.w / 2, top - 30], [R + OPEN.w / 2, top - 30]], left: [L, top, L + OPEN.w, top + h] };
}

// [§9.182] La conferma: il testo e i pulsanti in fila, al centro. [§9.187]
// n pulsanti (tre per "Salvare le modifiche?": Salva, Non salvare, Annulla)
export function confirmLayout(W, H, n = 2) {
  const bw = 220, bh = 56, gap = 20, y = H / 2 + 20, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
  const buttons = [];
  for (let k = 0; k < n; k++) buttons.push([x0 + k * (bw + gap), y, x0 + k * (bw + gap) + bw, y + bh]);
  return { text: [W / 2, H / 2 - 50], buttons, yes: buttons[0], no: buttons[n - 1] };
}

// ------------------------------------------------------- la tavolozza

// [§9.182] "Inserisci": nel riquadro in basso le schede delle categorie
// (CATALOG) e, sotto, gli oggetti della scheda in una fila di caselle, con
// le frecce se non ci stanno tutti. scroll: il primo oggetto mostrato.
// [§9.183] una casella per voce del catalogo (una famiglia di stili e' una
// casella sola): `i`, il suo posto nella scheda
const CELL = 62, CELL_GAP = 8, ARROW = 30;
// [§9.195, richiesta dell'autore] in Unita' ed Edifici l'interruttore
// rosso / blu a sinistra delle caselle: si vedono solo quelle di una parte
// (idx: gli indici delle caselle che si vedono; side: i due cerchi)
export const SIDE_TABS = new Set(["units", "buildings"]);
const SWITCH_W = 40;
export function paletteLayout(panel, cat, scroll, idx = null) {
  const [x1, y1, x2] = panel, n = CATALOG.length, tw = (x2 - x1 - 40) / n;
  const tabs = CATALOG.map((_, k) => ({ k, x1: x1 + 20 + k * tw + 3, y1: y1 + 62, x2: x1 + 20 + (k + 1) * tw - 3, y2: y1 + 90 }));
  const sw = SIDE_TABS.has(CATALOG[cat].key) ? SWITCH_W : 0;
  const left = x1 + 20 + sw + ARROW, right = x2 - 20 - ARROW, top = y1 + 98;
  const per = Math.max(1, Math.floor((right - left + CELL_GAP) / (CELL + CELL_GAP)));
  const n2 = idx ? idx.length : paletteCount(CATALOG[cat]), max = Math.max(0, n2 - per), s = Math.max(0, Math.min(scroll, max)); // §9.191, §9.195
  const cells = [];
  for (let k = 0; k < Math.min(per, n2 - s); k++) {
    cells.push({ i: idx ? idx[s + k] : s + k, x1: left + k * (CELL + CELL_GAP), y1: top, x2: left + k * (CELL + CELL_GAP) + CELL, y2: top + CELL });
  }
  return { tabs, cells, per, max, scroll: s, strip: [x1 + 20, top, x2 - 20, top + CELL],
           prev: s > 0 ? [x1 + 20 + sw, top, x1 + 20 + sw + ARROW - 6, top + CELL] : null,
           side: sw ? { red: [x1 + 20 + sw / 2, top + CELL / 2 - 14, 11], blue: [x1 + 20 + sw / 2, top + CELL / 2 + 14, 11],
                        box: [x1 + 20 + 4, top + 2, x1 + 20 + sw - 4, top + CELL - 2] } : null,
           next: s < max ? [x2 - 20 - ARROW + 6, top, x2 - 20, top + CELL] : null };
}

// [§9.185] Il pennello: cosa dipinge (il bosco, o una texture: lo sfondo
// della macchia, rivers.js drawPatch), quanto e' largo (il diametro, px di
// mappa), quanto e' fitto il bosco (la distanza minima fra gli alberi: 90
// px come il pennello bosco di Tiled, tools/12)
// ([§9.216] "grass": le chiazze d'erba, meadows.js)
// ([§9.219] la sabbia dopo il prato; "grass" e' il bouquet)
export const BRUSH_KINDS = ["forest", "city2", "city1", "green1", "sabbia", "grass"]; // (in fondo: le schede di prima restano al loro posto)
export const BRUSH_WIDTHS = [200, 300, 400, 600, 800, 1200, 1600];
export const BRUSH_SPACING = [180, 140, 110, 90, 75, 60]; // densita' 1..6
const BRUSH_TINT = { city2: 0x8a96a2, city1: 0xc2c8cc, green1: 0x4f8a5e, forest: 0x3c7a46, grass: 0x58b070, sabbia: 0x8abace };
// [§9.216] le chiazze d'erba: il riquadro di vetro sopra il pannello (come
// quello della nebbia, §9.206) con le particelle e la densita' di ognuna
export const MEADOW_TITLE = "Particles every 100 x 100 px";
// [§9.218, richiesta dell'autore: "rendere meno testuale l'editor"] al posto
// del nome, la particella: un ciuffo di particelle vere che ondeggiano come
// nel gioco (`icon`: il piede del ciuffo; il nome nel suggerimento, col
// puntatore sopra: `tip`); quattro per riga
export function meadowLayout(panel) {
  const [x1, y1, x2] = panel, per = 4, gw = (x2 - x1 - 40) / per;
  const rows = Math.ceil(MEADOW_KEYS.length / per), h = 50 + rows * 60, box = [x1, y1 - 14 - h, x2, y1 - 14];
  const groups = MEADOW_KEYS.map((key, k) => {
    const x = x1 + 20 + (k % per) * gw, cy = box[1] + 70 + Math.floor(k / per) * 60;
    return { key, icon: [x + 44, cy + 16], tip: [x + 6, cy - 22, x + 84, cy + 20], label: [x + 12, cy],
             minus: [x + gw - 112, cy, 14], value: [x + gw - 72, cy], plus: [x + gw - 32, cy, 14] };
  });
  return { box, groups, title: [x1 + 32, box[1] + 22] };
}
// Il riquadro del pennello: le schede (come la tavolozza) e, sotto, i "-" e
// "+" di larghezza e densita' (cerchi [x, y, r]) coi loro valori
export function brushLayout(panel) {
  const [x1, y1, x2] = panel, n = BRUSH_KINDS.length, tw = (x2 - x1 - 40) / n;
  const tabs = BRUSH_KINDS.map((kind, k) => ({ kind, x1: x1 + 20 + k * tw + 3, y1: y1 + 62, x2: x1 + 20 + (k + 1) * tw - 3, y2: y1 + 90 }));
  // (§9.187: piu' spazio per l'etichetta, "Larghezza finale" toccava il "-")
  const cy = y1 + 128, group = (x) => ({ label: [x, cy], minus: [x + 200, cy, 16], value: [x + 262, cy], plus: [x + 324, cy, 16] });
  return { tabs, width: group(x1 + 30), density: group(x1 + 30 + (x2 - x1) / 2) };
}

// [§9.206, richiesta dell'autore] Le impostazioni della nebbia (mapfile.js
// FOG_SETTINGS) in un riquadro di vetro sopra il pannello, quando una nebbia
// e' scelta in "Inserisci" (quelle nuove) o con "Sposta" (quelle scelte):
// per ognuna l'etichetta, "-", il valore e "+", tre per riga
export const FOG_LABEL = { density: "Density", speed: "Speed", range: "Range", life: "Duration", count: "Clouds", every: "Every" };
export function fogLayout(panel, object) {
  const [x1, y1, x2] = panel, keys = Object.keys(FOG_SETTINGS[object]), per = 3, gw = (x2 - x1 - 40) / per;
  const rows = Math.ceil(keys.length / per), h = 24 + rows * 40, box = [x1, y1 - 14 - h, x2, y1 - 14];
  const groups = keys.map((key, k) => {
    const x = x1 + 20 + (k % per) * gw, cy = box[1] + 32 + Math.floor(k / per) * 40;
    return { key, label: [x + 12, cy], minus: [x + gw - 132, cy, 14], value: [x + gw - 82, cy], plus: [x + gw - 32, cy, 14] };
  });
  return { box, groups };
}
// il valore come si legge: la densita' in %, le velocita' in px al secondo
// (« a sinistra, » a destra: il banco va e viene), l'ampiezza in px, i tempi in s
export function fogValue(object, key, v) {
  if (key === "density") return Math.round(v * 100) + "%";
  if (key === "speed") { const p = Math.round(Math.abs(v) * 60); return object === "nebbia_banco" || !v ? String(p) : v < 0 ? "« " + p : p + " »"; }
  if (key === "range") return v + " px";
  if (key === "life" || key === "every") return v + " s";
  return String(v);
}

// [§9.187] La polilinea: fiumi e strade (le due di §9.97, la marcata e la
// secondaria) disegnati punto per punto, come le polilinee di Tiled; i ponti
// no, per ora (decisione dell'autore). Larghezza e larghezza finale (px,
// quella all'ultimo punto: la linea si allarga o si stringe piano), come le
// proprieta' `larghezza` e `larghezza_fine` di Tiled; di partenza 150 per i
// fiumi e 110 per le strade (tools/tiledkit.py).
export const LINE_KINDS = ["river", "road1", "road2"];
export const LINE_KEY = { river: "rivers", road1: "roads", road2: "roads" };
export const LINE_LABEL = { river: "River", road1: "Road", road2: "Track" };
export const LINE_WIDTHS = [40, 60, 80, 110, 150, 200, 260, 340, 440];
const LINE_TINT = { river: 0xa8783c, road1: 0x88b4c8, road2: 0x8cb0a0 };
export const lineKind = (key, e) => (key === "rivers" ? "river" : e.kind === 2 ? "road2" : "road1");
// il riquadro: le tre schede, larghezza e larghezza finale coi "-" e "+"
export function lineLayout(panel) {
  const B = brushLayout(panel), [x1, y1, x2] = panel, n = LINE_KINDS.length, tw = (x2 - x1 - 40) / n;
  const tabs = LINE_KINDS.map((kind, k) => ({ kind, x1: x1 + 20 + k * tw + 3, y1: y1 + 62, x2: x1 + 20 + (k + 1) * tw - 3, y2: y1 + 90 }));
  return { tabs, width: B.width, end: B.density };
}
// la distanza di (px, py) dal segmento a-b, e il punto piu' vicino
export function segDist(px, py, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / L2)), qx = a[0] + t * vx, qy = a[1] + t * vy;
  return [dhypot(px - qx, py - qy), qx, qy];
}

// [§9.186, richiesta dell'autore] La simmetria e' un'impostazione degli
// strumenti (Sposta, Inserisci, Pennello), non della mappa: una riga in fondo
// al loro riquadro, "Simmetria" e le quattro modalita'
export const SYM_TOOLS = new Set(["select", "insert", "brush", "line", "erase", "mountain"]); // §9.187: anche la polilinea; §9.194: la gomma; §9.214: la montagna
// [§9.227, richiesta dell'autore] "Inserisci": il dado degli stili, in fondo
// alla riga della simmetria: acceso, ogni oggetto con piu' stili si
// inserisce con uno stile a caso
export function diceLayout(panel) {
  const [, y1, x2] = panel, y = y1 + 168;
  return [x2 - 24 - 70, y, x2 - 24, y + 32];
}
export function symLayout(panel) {
  // ([§9.227] piu' strette se a destra non c'e' posto per il dado)
  const [x1, y1, x2] = panel, y = y1 + 168, gap = 8, left = x1 + 190, w = Math.max(90, Math.min(150, Math.floor((x2 - 24 - 70 - 16 - left - 3 * gap) / 4)));
  return { label: [x1 + 30, y + 16], opts: SYMMETRY.map((mode, k) => ({ mode, x1: left + k * (w + gap), y1: y, x2: left + k * (w + gap) + w, y2: y + 32 })) }; // (§9.222: 32, prima 26: lo schema al posto del nome)
}

// [§9.203] la foto di una macchia a particelle (nuovi.json, tools/19_natura.mjs)
export const naturaSprite = (name) => "ed_natura_" + name;

// Il colore di una macchia senza sprite nella tavolozza e nei segnaposto
// (BGR): erba, grano, fili d'erba, fiori
const DECOR_TINT = { burst_erba1: [0x3c7a46], burst_grano1: [0x4fb0c8], chiazzaparticellare: [0x5a8a6a],
                     fiori_prato: [0x3030d0, 0x30d0e0, 0xe0e0f0], fiori_papaveri: [0x2020c8], fiori_papaveri_erba: [0x2020c8, 0x3c7a46],
                     fiori_gialli_erba: [0x30d0e0, 0x3c7a46],
                     sk_nebbia: [0xe8e8e8], nebbia_banco: [0x909090] }; // §9.205: la nebbia

// ------------------------------------------------------------- l'editor

// Avvio da app.js: r e assets gia' pronti (atlas e font), il canvas, le
// opzioni del giocatore, toast e progress per i messaggi e la barra.
export async function runEditor({ r, assets, canvas, settings, params, toast, progress }) {
  const [objects, masks] = await Promise.all(["objects.json", "masks.json"].map(async (f) => (await fetch("assets/" + f)).json()));
  const ctx = { r, assets, objects, masks: masks.sprites };
  const draw = new Draw(r, assets);
  const input = new Input(canvas);
  let scene = await EditScene.load(ctx, newMap(), progress);
  const view = new EditorView(scene.map.width, scene.map.height);
  // open: il pannello "Apri mappa"; confirm: la conferma prima di perdere le
  // modifiche ({ action }); loading: si carica qualcosa (niente comandi).
  // Sposta: sel (le voci scelte), over (la voce sotto il puntatore), move
  // (trascinando la scelta), box (il riquadro di scelta), clip (le copie da
  // incollare). Inserisci: cat e scroll (la tavolozza), pick (la casella
  // scelta: { cat, i }), style (lo stile scelto di ogni casella, §9.183).
  const ITEMS = CATALOG.map((k) => paletteItems(k, objects));
  // [§9.184] mapId: la mappa nel browser (null: non ancora salvata li');
  // saved: la versione della scena salvata; meta: impostazioni cambiate dopo;
  // dom: un pannello HTML aperto (impostazioni, salva: l'editor aspetta)
  const ed = { tool: "select", hover: null, drag: null, view, label: "", open: null, confirm: null, loading: false,
               mapId: null, file: null, saved: 0, meta: false, dom: null, // §9.188: file, il file collegato
               sel: new Set(), over: null, move: null, box: null, clip: null,
               cat: 0, scroll: CATALOG.map(() => 0), pick: null, style: ITEMS.map((l) => l.map(() => 0)), palHover: null,
               // [§9.185] il pennello: cosa, larghezza e densita' (indici), la pennellata in corso
               brush: { kind: "forest", w: 3, d: 3, mix: Object.fromEntries(MEADOW_KEYS.map((k) => [k, MEADOW_STEPS.indexOf(MEADOW_DEFAULT[k])])) }, stroke: null,
               mixHover: null, // [§9.216] il "-" o "+" delle particelle sotto il puntatore
               mixTip: null, // [§9.218] l'icona sotto il puntatore (il suo nome)
               // [§9.186] la simmetria di ogni strumento (spenta di partenza)
               sym: { select: "none", insert: "none", brush: "none", line: "none", erase: "none", mountain: "none" }, symHover: null,
               // [§9.194] la gomma (larghezza: indice di BRUSH_WIDTHS, cancellando); le mura:
               // il "+" da cui si prolunga (wall) e il pulsante sotto il puntatore
               erase: { w: 3 }, erasing: false, wall: null, wallHover: null,
               // [§9.195] la parte che si vede in Unita' ed Edifici
               sideFilter: "red",
               colScroll: 0, // [§9.196] la colonna che scorre (schermi bassi)
               // [§9.206] le impostazioni della nebbia nuova (Inserisci) e il "-" o "+" sotto il puntatore
               fogSet: Object.fromEntries(Object.entries(FOG_DEFAULTS).map(([k, v]) => [k, { ...v }])), fogHover: null,
               // [§9.187] la polilinea: il tipo e le larghezze di partenza (indici, per tipo),
               // la linea che si disegna (punti), la linea scelta ({ key, e, vi }), il punto trascinato
               line: { kind: "river", w: { river: 4, road1: 3, road2: 3 }, we: { river: 4, road1: 3, road2: 3 } },
               drawing: null, lsel: null, ldrag: null,
               // [§9.214] la montagna: i parametri delle nuove (indici di MOUNTAIN_STEPS), quella
               // che si disegna ({ step: "crest" | "base", crest, base, seed, edit }), la scelta
               // ({ e }), il punto trascinato, le forme gia' fatte (l'anteprima)
               dice: false, // [§9.227] Inserisci: lo stile a caso a ogni inserimento
               mtn: { height: 4, width: 4, rough: 2, detail: 2 }, mdraw: null, msel: null, mdrag: null, mcache: new Map() };
  const symMode = () => ed.sym[ed.tool] || "none";
  // [§9.183] la casella scelta, il suo stile ({ object, sprite? }) e quanti ne ha
  const pickedItem = () => (ed.pick ? ITEMS[ed.pick.cat][ed.pick.i] : null);
  const styleOfCell = (cat, i) => ITEMS[cat][i].styles[ed.style[cat][i]];
  const pickedStyle = () => (ed.pick ? styleOfCell(ed.pick.cat, ed.pick.i) : null);
  // [§9.195] le caselle che si vedono (in Unita' ed Edifici solo quelle della
  // parte scelta), o null: tutte
  const shownIdx = (cat) => (SIDE_TABS.has(CATALOG[cat].key) ? ITEMS[cat].map((q, i) => (q.side && q.side !== ed.sideFilter ? -1 : i)).filter((i) => i >= 0) : null);
  const paletteNow = (panel) => paletteLayout(panel, ed.cat, ed.scroll[ed.cat], shownIdx(ed.cat));
  // [§9.197, richiesta dell'autore] nell'editor la freccina nera classica
  // (stile Mac, col bordo bianco) al posto della spada del gioco: un cursore
  // CSS (SVG), disegnato dal sistema; la punta e' il punto caldo
  canvas.style.cursor = ARROW_CURSOR;
  const clear = [0x1b / 255, 0x1d / 255, 0x17 / 255]; // fuori dalla mappa: il colore della pagina (index.html)
  const OUTSIDE = 0x171d1b; // lo stesso, in BGR per Draw

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    view.resize(w, h);
  };
  window.addEventListener("resize", resize);
  resize();
  view.centre(scene.map.width / 2, scene.map.height / 2);

  const toMenu = () => { location.search = "?room=menu"; };
  // ([§9.203, richiesta dell'autore] nell'editor niente clic dei pulsanti,
  // §9.168: "diventa fastidioso dopo un po' in un ambiente silenzioso come
  // quello dell'editor")
  const dirty = () => scene.version !== ed.saved || ed.meta;
  const markSaved = () => { ed.saved = scene.version; ed.meta = false; };
  // [§9.182] prima di perdere le modifiche, la conferma
  // [§9.187, richiesta dell'autore] con la mappa cambiata, prima di uscire (o
  // di aprirne un'altra): "Salvare le modifiche?" Salva (poi esce: dal
  // pannello se la mappa non e' ancora nel browser), Non salvare, Annulla
  const guard = (action) => {
    if (!dirty()) { action(); return; }
    ed.confirm = { text: "Save the changes to this map?", esc: null,
                   buttons: [{ label: "Save", action: () => saveThen(action) }, { label: "Don't save", action }, { label: "Cancel", action: null }] };
  };
  const saveThen = async (action) => { if (await quickSave()) action(); else if (ed.dom) ed.afterSave = action; };
  const busy = async (fn) => {
    ed.loading = true;
    try { await fn(); } catch (e) { console.error(e); toast(tr("This map could not be opened"), "warning"); } finally { ed.loading = false; }
  };

  // un'altra mappa: la scena nuova, la vista sulla sua vista iniziale; id:
  // la mappa nel browser, se viene da li'
  // [§9.188] file: il file collegato (FileSystemFileHandle), se viene da li'
  const setScene = (s, label, id = null, file = null) => {
    scene.ground.free();
    scene = s;
    Object.assign(ed, { label, sel: new Set(), over: null, move: null, box: null, mapId: id, file, saved: s.version, meta: false,
                        drawing: null, lsel: null, mdraw: null, msel: null, mdrag: null });
    view.setMap(s.map.width, s.map.height);
    const v = s.map.view;
    view.centre(v.x + v.w / 2, v.y + v.h / 2);
  };
  // [§9.184] la stessa mappa con misure o sfondo nuovi: la scena rifatta,
  // con la cronologia di annulla e ripeti (le voci sono le stesse)
  const rebuildScene = () => busy(async () => {
    const old = scene, s = await EditScene.load(ctx, old.map, progress);
    Object.assign(s, { undoList: old.undoList, redoList: old.redoList, version: old.version });
    old.ground.free();
    scene = s;
    Object.assign(ed, { sel: new Set(), over: null, move: null, box: null });
    view.setMap(s.map.width, s.map.height);
  });
  // [§9.184] una mappa che arriva da fuori (il browser, un file): convalidata
  const openData = async (data, id, file = null) => {
    const v = validateMap(data, allowedObjects(), objects);
    if (v.errors) { console.warn("[editor] mappa non valida:", v.errors); throw new Error("mappa non valida"); }
    if (v.map.lock && !(await askPassword(v.map))) return; // §9.198
    setScene(await EditScene.load(ctx, v.map, progress), v.map.name, id, file);
  };
  // [§9.198] una mappa con la password: si apre solo con quella giusta
  // (true), se no resta la mappa di prima (false)
  const askPassword = (map) => new Promise((resolve) => {
    const [p, close] = panel(tr("This map is protected by a password"));
    const done = (ok) => { close(); resolve(ok); };
    p.onEscape = () => done(false);
    const t = document.createElement("div");
    setDomText(t, map.name || tr("Untitled map"), { font: "overdue", colour: "#222", width: 600 });
    p._add(t);
    const pw = document.createElement("input");
    pw.type = "password"; pw.maxLength = 64; pw.dataset.net = "password";
    Object.assign(pw.style, INPUT);
    line(p, tr("Password")).append(pw);
    const row = p.row();
    const go = () => { if (lockOpens(map.lock, pw.value)) done(true); else { p.status(tr("Wrong password."), "error"); pw.select(); } };
    p.button(row, tr("Open"), go, { primary: true, name: "unlock" });
    p.button(row, tr("Cancel"), () => done(false), { name: "cancel" });
    pw.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    setTimeout(() => pw.focus(), 0);
  });
  const openSaved = (id) => busy(async () => openData(await loadMap(id), id));
  const openFile = async () => {
    const res = await openMapFile();
    if (!res) return;
    if (res.invalid) { toast(tr("This map could not be opened"), "warning"); return; }
    busy(() => openData(res.data, null, res.handle || null)); // §9.188: collegata al file, dove si puo'
  };
  // [§9.182] un modello: la mappa della schermaglia diventa una mappa nuova
  const openTemplate = (room) => busy(async () => {
    const data = await (await fetch(`assets/rooms/${room}.json`)).json();
    const v = validateMap({ ...roomToScenario(data), name: "" }, allowedObjects(), objects); // (anche i modelli: le informazioni di partenza)
    if (v.errors) throw new Error("modello non valido: " + v.errors.join(", "));
    setScene(await EditScene.load(ctx, v.map, progress), tr("New map from {map}", { map: mapLabel(room) }));
  });
  const newBlank = () => busy(async () => setScene(await EditScene.load(ctx, newMap(), progress), ""));
  // la tavolozza: gli sprite di tutti gli oggetti che si inseriscono (e le
  // particelle delle macchie, nel tier gioco)
  // (in sottofondo: intanto l'editor risponde, la tavolozza scrive
  // "Caricamento"; senza la barra di caricamento, che coprirebbe la mappa)
  let catalog = "no"; // "loading", "ready"
  const ensureCatalog = () => {
    if (catalog !== "no") return;
    catalog = "loading";
    const names = catalogObjects();
    assets.load([...new Set([...assets.groupsOfTier("core", "gioco"), ...groupsFor(assets, objects, names)])], BRUSH_KINDS.filter((k) => BG_NAMES[k])) // §9.185: gli sfondi delle texture
      .then(() => { catalog = "ready"; }, (e) => { console.error(e); catalog = "no"; });
  };
  const setTool = (t) => {
    if (ed.stroke || ed.ldrag || ed.erasing || ed.mdrag) return;
    if (t !== ed.tool) Object.assign(ed, { drawing: null, lsel: null, wall: null, mdraw: null, msel: null }); // §9.187; §9.194: il prolungamento delle mura; §9.214
    ed.tool = t;
    if (t === "insert" || t === "brush") ensureCatalog();
  };

  // ---------------------------------------------------------- modifiche
  const inMap = (x, y) => x >= 0 && y >= 0 && x <= scene.map.width && y <= scene.map.height;
  // [§9.191] una partenza per parte: si possono aggiungere le partenze di
  // `list` (voci), togliendo prima quelle di `minus`?
  const canStart = (list, minus = []) => SIDES.every((side) => {
    const n = (l) => l.filter((e) => isStart(e) && e.side === side).length; // (§9.203: i municipi no)
    return scene.starts(side) - n(minus) + n(list) <= 1;
  });
  const ONE_START = "Each side has one starting position.";
  // la voce che "Inserisci" mette in (x, y) e, con la simmetria, la gemella
  const toPlace = (x, y) => {
    const st = pickedStyle();
    if (!st) return [];
    const e = { object: st.object, x: Math.round(x), y: Math.round(y), scale_x: 1, scale_y: 1, rotation: 0 };
    if (st.sprite) e.sprite = st.sprite; // (la variante, come la scrive tools/12)
    if (st.side) e.side = st.side; // §9.191
    if (st.hall) e.hall = true; // §9.203: un municipio, non una partenza
    if (FOG_SETTINGS[st.object]) { const f = fogDiff(st.object, ed.fogSet[st.object]); if (f) e.fog = f; } // §9.206
    const t = scene.twinAt(e, symMode());
    return t ? [e, t] : [e];
  };
  const place = (x, y) => {
    if (!inMap(x, y) || catalog !== "ready") return;
    const list = toPlace(x, y);
    if (!list.length) return;
    if (!canStart(list)) { toast(tr(ONE_START), "warning"); return; }
    scene.add(list);
    // [§9.227] col dado lo stile dopo a caso (uno diverso; non le mura: i
    // loro stili sono i due versi)
    const it = pickedItem();
    if (ed.dice && it && it.styles.length > 1 && !it.key.startsWith("wall")) {
      const { cat, i } = ed.pick, n = it.styles.length;
      ed.style[cat][i] = (ed.style[cat][i] + 1 + Math.floor(vrand() * (n - 1))) % n;
    }
  };
  // [§9.183] S (Maiusc+S all'indietro): lo stile dopo della casella scelta
  // ("Inserisci") o delle voci scelte ("Sposta", con annulla)
  const nextStyle = (dir) => {
    if (ed.tool === "insert" && ed.pick) {
      const { cat, i } = ed.pick, n = ITEMS[cat][i].styles.length, it = ITEMS[cat][i];
      // [§9.193] una casella di uno schieramento: la stessa dell'altro
      // ([§9.194] le mura hanno anche gli stili, i due versi: S li gira)
      if (it.side && n === 1) {
        const j = ITEMS[cat].findIndex((q) => q.side && q.side !== it.side && q.styles[0].object === it.styles[0].object);
        if (j >= 0) { ed.pick = { cat, i: j }; ed.sideFilter = ITEMS[cat][j].side; } // §9.195: e l'interruttore
        return;
      }
      ed.style[cat][i] = (ed.style[cat][i] + dir + n) % n;
    } else if (ed.tool === "select") {
      const list = scene.withTwins(selected(), symMode()).filter((e) => stylesOf(e, objects)); // §9.184: anche le gemelle
      const next = (e) => { const S = stylesOf(e, objects); return S.styles[(S.at + dir + S.styles.length) % S.styles.length]; };
      // [§9.191] lo schieramento di una partenza: sempre una per parte
      if (!canStart(list.map((e) => ({ ...e, ...next(e) })), list)) { toast(tr(ONE_START), "warning"); return; }
      scene.modify(list, (e) => {
        const st = next(e);
        // ([§9.203] la casa: lo stile nel suo schieramento)
        return { object: st.object, ...(st.side ? { side: st.side } : {}), ...(st.sprite ? { sprite: st.sprite } : {}) };
      });
    }
  };
  const selected = () => [...ed.sel].filter((e) => scene.instOf(e));
  const tidySel = () => { for (const e of ed.sel) if (!scene.instOf(e)) ed.sel.delete(e); };
  // [§9.206] la nebbia di cui il riquadro mostra le impostazioni: quella
  // scelta in "Inserisci" (le nuove) o le voci di nebbia scelte con "Sposta"
  // (della specie della prima, con le gemelle), o null
  const fogTarget = () => {
    if (ed.tool === "insert" && ed.pick && !ed.wall) {
      const o = pickedStyle().object;
      return FOG_SETTINGS[o] ? { object: o, values: ed.fogSet[o], list: null } : null;
    }
    if (ed.tool === "select" && !ed.move && !ed.box) {
      const first = selected().find((e) => FOG_SETTINGS[e.object]);
      if (!first) return null;
      return { object: first.object, values: fogOf(first), list: scene.withTwins(selected().filter((e) => e.object === first.object), symMode()) };
    }
    return null;
  };
  // la disposizione, col riquadro della nebbia se c'e' (il puntatore li' non tocca la mappa)
  const layoutNow = () => {
    const L = editorLayout(view.cssW, view.cssH, ed.colScroll), F = fogTarget();
    if (F) L.extra = [fogLayout(L.panel, F.object).box];
    if (ed.tool === "brush" && ed.brush.kind === "grass") L.extra = [meadowLayout(L.panel).box]; // §9.216
    return L;
  };
  // un'impostazione un passo avanti o indietro: per le nebbie nuove, o (con
  // annulla) per quelle scelte
  const setFog = (F, key, dir) => {
    const vals = FOG_SETTINGS[F.object][key], cur = F.values[key];
    const at = vals.indexOf(cur) >= 0 ? vals.indexOf(cur) : vals.reduce((b, v, k) => (Math.abs(v - cur) < Math.abs(vals[b] - cur) ? k : b), 0);
    const nv = vals[Math.max(0, Math.min(vals.length - 1, at + dir))];
    if (nv === cur) return;
    if (!F.list) { ed.fogSet[F.object][key] = nv; return; }
    scene.modify(F.list, (e) => ({ fog: fogDiff(e.object, { ...fogOf(e), [key]: nv }) || undefined }));
  };
  const copy = () => {
    const list = selected();
    if (!list.length) return;
    const cx = list.reduce((a, e) => a + e.x, 0) / list.length, cy = list.reduce((a, e) => a + e.y, 0) / list.length;
    ed.clip = list.map((e) => ({ ...e, x: e.x - cx, y: e.y - cy }));
  };
  // [§9.195] taglia: copia e toglie (come Canc, con le gemelle)
  const cut = () => {
    if (!ed.sel.size) return;
    copy();
    scene.remove(scene.withTwins(selected(), symMode()));
    ed.sel.clear();
  };
  // [§9.195] i pulsanti della colonna: annulla, taglia, copia, incolla (al
  // centro della vista, scelto, con "Sposta": si trascina dove serve)
  const editEnabled = (key) => (key === "undo" ? scene.undoList.length > 0 : key === "redo" ? scene.redoList.length > 0
    : key === "paste" ? !!ed.clip : selected().length > 0);
  const editAction = (key) => {
    if (!editEnabled(key)) return;
    if (key === "undo") { if (scene.undo()) tidySel(); }
    else if (key === "redo") { if (scene.redo()) tidySel(); } // §9.199
    else if (key === "cut") cut();
    else if (key === "copy") copy();
    else if (key === "paste") {
      setTool("select");
      paste(Math.round(view.x + view.w / 2), Math.round(view.y + view.h / 2));
    }
  };
  const paste = (x, y) => {
    if (!ed.clip) return;
    let list = ed.clip.map((e) => ({ ...e, x: Math.round(x + e.x), y: Math.round(y + e.y) }));
    list = list.concat(list.map((e) => scene.twinAt(e, symMode())).filter(Boolean)); // §9.184: con la simmetria, le gemelle
    if (!canStart(list)) { list = list.filter((e) => !isStart(e)); toast(tr(ONE_START), "warning"); } // §9.191
    if (!list.length) return;
    scene.add(list);
    ed.sel = new Set(list);
  };

  // ------------------------------------------------------------- pennello
  // [§9.185] la pennellata: comincia (un gruppo: un passo solo da annullare),
  // va avanti a ogni passo col tasto tenuto, finisce lasciandolo
  // [§9.186] l'area e' un ovale assonometrico: largo brushR, alto brushR x ISO
  const brushR = () => BRUSH_WIDTHS[ed.brush.w] / 2;
  const brushRY = () => brushR() * ISO;
  const inOval = (x, y, cx, cy, r, ry) => ((x - cx) / r) * ((x - cx) / r) + ((y - cy) / ry) * ((y - cy) / ry) <= 1;
  const symOn = () => symMode() !== "none";
  const twinPoint = (x, y) => mirrorPoint(symMode(), scene.map.width, scene.map.height, x, y);
  const strokeStart = (erase) => {
    scene.begin();
    const st = ed.stroke = { erase, dabs: [], kind: ed.brush.kind };
    if (st.kind === "forest" && !erase) {
      st.spacing = BRUSH_SPACING[ed.brush.d];
      st.grid = new TreeGrid(st.spacing);
      for (const e of scene.trees()) st.grid.add(e.x, e.y);
    }
  };
  const treeAt = ([x, y]) => {
    const ch = objects.albero.choices;
    return { object: "albero", x, y, scale_x: 1, scale_y: 1, rotation: 0, sprite: ch[Math.floor(vrand() * ch.length)] };
  };
  const strokeStep = (x, y) => {
    const st = ed.stroke, r = brushR();
    if (st.kind === "forest" && !st.erase) {
      const ok = (px, py) => inMap(px, py) && !scene.blocks(px, py);
      const list = forestStep({ cx: x, cy: y, r, ry: brushRY(), spacing: st.spacing, grid: st.grid, rand: vrand, ok }).map(treeAt);
      // con la simmetria il gemello di ogni albero, se c'e' posto
      for (const e of list.slice()) {
        const t = scene.twinAt(e, symMode());
        if (t && inMap(t.x, t.y) && !st.grid.near(t.x, t.y, st.spacing) && !scene.blocks(t.x, t.y)) { st.grid.add(t.x, t.y); list.push(t); }
      }
      if (list.length) scene.add(list);
      return;
    }
    const spots = [[x, y]];
    if (symOn()) spots.push(twinPoint(x, y));
    const ry = brushRY();
    if (st.kind === "forest") { // gomma: via gli alberi nell'ovale
      const list = scene.trees().filter((e) => spots.some(([sx, sy]) => inOval(e.x, e.y, sx, sy, r, ry)));
      if (list.length) { scene.remove(list); tidySel(); }
      return;
    }
    if (st.kind === "grass" && st.erase) { // [§9.216] gomma: via le chiazze d'erba toccate dall'ovale
      const hit = (p) => spots.some(([sx, sy]) => pointInPoly(sx, sy, p.pts) || p.pts.some(([px, py]) => inOval(px, py, sx, sy, r, ry)));
      const list = (scene.map.meadows || []).filter(hit);
      if (list.length) scene.removeFeatures("meadows", list);
      return;
    }
    if (st.erase) { // gomma: via le macchie di questa texture toccate dall'ovale
      const hit = (p) => spots.some(([sx, sy]) => pointInPoly(sx, sy, p.pts) || p.pts.some(([px, py]) => inOval(px, py, sx, sy, r, ry)));
      const list = (scene.map.patches || []).filter((p) => (p.bg || "city2") === st.kind && hit(p));
      if (list.length) scene.removeFeatures("patches", list);
      return;
    }
    // texture: un cerchio ogni tanto lungo la pennellata (quando la si lascia, la sagoma)
    const last = st.dabs[st.dabs.length - 1];
    if (!last || dhypot(x - last[0], y - last[1]) >= ry * 0.3) st.dabs.push([Math.round(x), Math.round(y)]);
  };
  const strokeEnd = () => {
    const st = ed.stroke;
    ed.stroke = null;
    if (st.dabs.length) {
      const r = brushR(), ry = brushRY(), polys = strokeOutlines(st.dabs, r, ry);
      if (symOn()) {
        const mirrored = strokeOutlines(st.dabs.map(([x, y]) => twinPoint(x, y)), r, ry);
        polys.push(...mirrored);
      }
      if (st.kind === "grass") { // [§9.216] le chiazze d'erba, con le densita' scelte
        const mix = {};
        for (const k of MEADOW_KEYS) { const v = MEADOW_STEPS[ed.brush.mix[k]]; if (v) mix[k] = v; }
        const list = polys.map((pts) => ({ pts, mix, seed: newSeed() }));
        const now = (scene.map.meadows || []).reduce((n, m) => n + meadowTotal(m), 0), more = list.reduce((n, m) => n + meadowTotal(m), 0);
        if (!Object.keys(mix).length) toast(tr("Choose at least one kind of particle."), "warning");
        else if (now + more > MEADOW_LIMITS.map) toast(tr("Too much grass on this map: erase some first."), "warning");
        else scene.addFeatures("meadows", list);
      } else scene.addFeatures("patches", polys.map((pts) => ({ pts, bg: st.kind, feather: 40 })));
    }
    scene.end();
  };

  // --------------------------------------------------------------- gomma
  // [§9.194, richiesta dell'autore] la gomma ad area: col sinistro tenuto via
  // tutti gli oggetti (le voci, non fiumi, strade e macchie) con l'origine
  // nell'ovale (assonometrico, largo come il pennello), e con la simmetria
  // anche nell'ovale gemello; una passata e' un passo solo da annullare
  const eraseR = () => BRUSH_WIDTHS[ed.erase.w] / 2;
  const eraseAt = (x, y) => {
    const r = eraseR(), ry = r * ISO, spots = [[x, y]];
    if (symOn()) spots.push(twinPoint(x, y));
    const list = scene.map.instances.filter((e) => !SYSTEM.has(e.object) && spots.some(([sx, sy]) => inOval(e.x, e.y, sx, sy, r, ry)));
    if (list.length) { scene.remove(list); tidySel(); }
  };

  // ---------------------------------------------------------------- mura
  // [§9.194] con "Inserisci": i "+" liberi delle mura e il pulsante
  // muro/porta di ogni tratto (a scala di schermo; da lontano, piu' di
  // WALL_ZOOM px di mappa per pixel, niente pulsanti), il tratto che
  // prolunga dal "+" scelto verso il puntatore
  const WALL_ZOOM = 4, WALL_BTN = 22;
  const wallButtons = () => {
    if (ed.tool !== "insert" || view.scale > WALL_ZOOM || catalog !== "ready") return [];
    const out = freePluses(scene.map.instances).map((p) => ({ kind: "plus", p, x: p.x, y: p.y }));
    for (const e of scene.map.instances) {
      if (!WALL_KIND[e.object]) continue;
      const [ox, oy] = scene.maskOffset(e);
      out.push({ kind: "gate", e, x: e.x + ox, y: e.y + oy });
    }
    return out;
  };
  const wallButtonAt = (x, y) => {
    const R = (WALL_BTN + 4) * view.scale;
    return wallButtons().find((b) => dhypot(b.x - x, b.y - y) <= R) || null;
  };
  // il tratto nuovo (e, con la simmetria, il gemello) dal "+" ed.wall verso (x, y)
  const wallPieces = (x, y) => {
    const w = ed.wall, st = w && wallStep(w.p, x, y);
    if (!st) return [];
    const e = { object: st.object, x: Math.round(st.x), y: Math.round(st.y), scale_x: 1, scale_y: 1, rotation: 0, side: w.p.e.side || "red" };
    const t = scene.twinAt(e, symMode());
    return t ? [e, t] : [e];
  };
  // un tratto diventa porta e viceversa (col gemello, con la simmetria)
  const toggleGate = (e) => scene.modify(scene.withTwins([e], symMode()).filter((q) => GATE_SWAP[q.object]), (q) => ({ object: GATE_SWAP[q.object] }));

  // ------------------------------------------------------------ polilinea
  // [§9.187] le larghezze (di partenza, o della linea scelta), la linea nuova
  // finita (con la gemella), la linea e il punto sotto il puntatore
  const lineW = (kind) => LINE_WIDTHS[ed.line.w[kind]], lineWE = (kind) => LINE_WIDTHS[ed.line.we[kind]];
  const nearestW = (v) => LINE_WIDTHS.reduce((b, w, k) => (Math.abs(w - v) < Math.abs(LINE_WIDTHS[b] - v) ? k : b), 0);
  const lineEntry = (kind, pts) => {
    const w = lineW(kind), we = lineWE(kind), e = { pts, width: w };
    if (we !== w) e.widthEnd = we;
    if (kind !== "river") e.kind = kind === "road2" ? 2 : 1;
    return e;
  };
  const mirrorPts = (pts) => pts.map(([x, y]) => mirrorPoint(symMode(), scene.map.width, scene.map.height, x, y).map(Math.round));
  const lineFinish = () => {
    const d = ed.drawing;
    ed.drawing = null;
    if (!d || d.pts.length < 2) return;
    const key = LINE_KEY[d.kind], e = lineEntry(d.kind, d.pts), list = [e];
    if (symOn()) {
      const t = { ...e, pts: mirrorPts(e.pts) };
      if (!t.pts.every(([x, y], k) => Math.abs(x - e.pts[k][0]) <= 1 && Math.abs(y - e.pts[k][1]) <= 1)) list.push(t);
    }
    // [§9.204, richiesta dell'autore] il fiume finito toglie gli alberi coi
    // piedi nell'acqua (anche quelli della gemella): un passo solo da annullare
    if (key === "rivers") {
      scene.begin();
      scene.addFeatures(key, list);
      const trees = scene.treesInRivers(list);
      if (trees.length) scene.remove(trees);
      scene.end();
      tidySel();
      if (trees.length) toast(tr("Trees removed from the river: {n}", { n: trees.length }));
    } else scene.addFeatures(key, list);
    ed.lsel = { key, e, vi: null };
  };
  const linePick = (x, y) => {
    const tol = 10 * view.scale, lists = ["rivers", "roads"].map((key) => [key, scene.map[key] || []]);
    for (const [key, l] of lists) for (const e of l) for (let k = 0; k < e.pts.length; k++) if (dhypot(x - e.pts[k][0], y - e.pts[k][1]) <= tol) return { key, e, vi: k };
    for (const [key, l] of lists) {
      for (const e of l) {
        for (let k = 1; k < e.pts.length; k++) {
          const [d, qx, qy] = segDist(x, y, e.pts[k - 1], e.pts[k]);
          if (d <= Math.max(tol, (e.width || 100) / 2)) return { key, e, vi: null, seg: k, at: [Math.round(qx), Math.round(qy)] };
        }
      }
    }
    return null;
  };
  // la linea scelta e la gemella (con la simmetria dello strumento)
  const lineAndTwin = (key, e) => { const t = scene.twinLine(key, e, symMode()); return t ? [e, t] : [e]; };
  // un cambio ai punti: alla linea e, a specchio, alla gemella
  const linePts = (key, e, fn) => {
    const t = scene.twinLine(key, e, symMode());
    scene.modifyFeatures(key, t ? [e, t] : [e], (f) => ({ pts: fn(f.pts.map((q) => q.slice()), f === t) }));
  };

  // ------------------------------------------------------------ montagne
  // [§9.214] i parametri delle montagne nuove, la forma (con una cache: le
  // anteprime la chiedono a ogni fotogramma), la gemella con la simmetria
  const mtnVal = (k) => MOUNTAIN_STEPS[k][ed.mtn[k]];
  const mtnIdx = (k, v) => MOUNTAIN_STEPS[k].reduce((b, s, i) => (Math.abs(s - v) < Math.abs(MOUNTAIN_STEPS[k][b] - v) ? i : b), 0);
  const newSeed = () => Math.floor(vrand() * 0x7fffffff);
  const warn = (text, params) => toast(tr(text, params), "warning");
  const mGeo = (m) => {
    const k = JSON.stringify(m);
    let g = ed.mcache.get(k);
    if (!g) { if (ed.mcache.size > 24) ed.mcache.clear(); g = scene.mountainGeo(m); ed.mcache.set(k, g); }
    return g;
  };
  const geoOf = (e) => (scene.world.mountains || [])[(scene.map.mountains || []).indexOf(e)] || mGeo(e);
  const roundPts = (pts) => pts.map(([x, y]) => [Math.round(x), Math.round(y)]);
  // la montagna nuova e, con la simmetria, la gemella: gli stessi campi,
  // specchiata sul terreno (mountains.js mirrorStructure)
  const mPair = (e) => {
    if (!symOn()) return [e];
    const s = { ...e, sym: symMode() };
    return [s, { ...JSON.parse(JSON.stringify(s)), mirrored: true }];
  };
  const mAndTwin = (e) => { const t = symOn() ? scene.twinMountain(e) : null; return t ? [e, t] : [e]; };
  // le gemelle specchiate: i punti come si vedono e come stanno nella voce
  // (la base sul terreno si specchia e basta; una cima si specchia sul
  // terreno, h px sotto, alla stessa altezza)
  const mm = (e, p) => mirrorPoint(e.sym, scene.map.width, scene.map.height, p[0], p[1]);
  const crestStore = (e, p, h) => { if (!e.mirrored) return p; const q = mm(e, [p[0], p[1] + h]); return [q[0], q[1] - h]; };
  const baseShown = (e) => (e.base ? (e.mirrored ? e.base.map((p) => mm(e, p)) : e.base) : null);
  const topsOf = (e) => geoOf(e).tops.map((t) => [t.x, t.y, t.h]);
  // [§9.214, richieste dell'autore] montagne nuove (adds) o cambiate (mods:
  // [voce, campi]): prima il controllo (non toccano altre montagne, ne' la
  // gemella), poi in un passo solo da annullare le voci, gli oggetti sotto
  // tolti ("elimina tutti gli oggetti in collisione", con l'avviso per tutti
  // quelli che non sono alberi), fiumi e strade che girano attorno ("sposta
  // le polilinee in interferenza")
  const mCommit = (adds, mods = []) => {
    const changed = new Set(mods.map(([e]) => e));
    const after = [...adds, ...mods.map(([e, f]) => JSON.parse(JSON.stringify({ ...e, ...f })))];
    const geos = after.map((m) => scene.mountainGeo(m));
    const others = (scene.map.mountains || []).filter((e) => !changed.has(e));
    const touch = (a, b) => { for (let k = 0; k < a.grid.length; k++) if (a.grid[k] && b.grid[k]) return true; return false; };
    if (others.length && touch(scene.mountainGrid(geos), scene.mountainGrid(others.map(geoOf)))) { warn(MTN_OVERLAP); return false; }
    if (geos.length === 2 && touch(scene.mountainGrid([geos[0]]), scene.mountainGrid([geos[1]]))) { warn(MTN_TWIN); return false; }
    scene.begin();
    if (adds.length) scene.addFeatures("mountains", adds);
    for (const [e, f] of mods) scene.modifyFeatures("mountains", [e], () => f);
    const gone = scene.underMountains(geos), trees = gone.filter((e) => TREES.has(e.object)).length;
    if (gone.length) scene.remove(gone);
    const moved = scene.reroute(geos);
    for (const { key, e, pts } of moved) {
      if (pts) scene.modifyFeatures(key, [e], () => ({ pts }));
      else scene.removeFeatures(key, [e]);
    }
    // (i fiumi spostati, come i fiumi nuovi, tolgono gli alberi nell'acqua)
    const wet = scene.treesInRivers(moved.filter((q) => q.key === "rivers" && q.pts).map((q) => q.e));
    if (wet.length) scene.remove(wet);
    scene.end();
    tidySel();
    if (ed.lsel && !(scene.map[ed.lsel.key] || []).includes(ed.lsel.e)) ed.lsel = null;
    const kept = moved.filter((q) => q.pts).length;
    if (trees + wet.length) toast(tr("Trees removed under the mountain: {n}", { n: trees + wet.length }));
    if (gone.length > trees) warn("Objects removed under the mountain: {n}", { n: gone.length - trees });
    if (kept) toast(tr("Rivers and roads moved around the mountain: {n}", { n: kept }));
    if (moved.length > kept) warn("Rivers and roads removed (under the mountain): {n}", { n: moved.length - kept });
    return true;
  };
  // Invio, il destro o il doppio clic: la cresta e' fatta (si passa alla
  // base), o la base e' fatta (la montagna si crea, o cambia la sua base)
  const mStep = () => {
    const d = ed.mdraw;
    if (d.step === "crest") {
      if (!d.crest.length) { ed.mdraw = null; return; }
      Object.assign(d, { step: "base", base: [] });
      return;
    }
    const H = d.edit ? d.edit.height ?? mtnVal("height") : mtnVal("height");
    const crest = d.edit ? topsOf(d.edit) : d.crest.map(([x, y]) => [x, y, H * 0.9]);
    let base = null;
    if (d.base.length) {
      const p = baseProblem(d.base, crest, H * 0.9);
      if (p) { warn(MTN_PROBLEM.base[p]); return; }
      base = roundPts(d.base);
    }
    if (d.edit) {
      const e = d.edit, stored = base && e.mirrored ? roundPts(base.map((p) => mm(e, p))) : base;
      if (mCommit([], mAndTwin(e).map((f) => [f, { base: stored || undefined }]))) { ed.mdraw = null; ed.msel = { e }; }
      return;
    }
    const e = { crest: roundPts(d.crest), height: H, width: mtnVal("width"), rough: mtnVal("rough"), detail: mtnVal("detail"), seed: d.seed };
    if (base) e.base = base;
    const list = mPair(e);
    if (mCommit(list)) { ed.mdraw = null; ed.msel = { e: list[0] }; }
  };
  // un punto in piu' della cresta o della base, se va (se no l'avviso col perche')
  const mAdd = (p) => {
    const d = ed.mdraw;
    if (d.step === "crest") {
      const next = [...d.crest, p], why = crestProblem(next);
      if (why) { warn(MTN_PROBLEM.crest[why]); return; }
      d.crest = next;
    } else {
      const H = d.edit ? d.edit.height ?? mtnVal("height") : mtnVal("height");
      const crest = d.edit ? topsOf(d.edit) : d.crest.map(([x, y]) => [x, y, H * 0.9]);
      const next = [...d.base, p], why = baseProblem(next, crest, H, true);
      if (why) { warn(MTN_PROBLEM.base[why]); return; }
      d.base = next;
    }
  };
  // i punti della montagna scelta: le cime (come si vedono) e, se l'ha, la base
  const mHandles = (e) => {
    const out = geoOf(e).tops.map((t, k) => ({ kind: "crest", k, x: t.x, y: t.y, h: t.h }));
    const b = baseShown(e);
    if (b) b.forEach((p, k) => out.push({ kind: "base", k, x: p[0], y: p[1] }));
    return out;
  };
  // lasciato un punto trascinato: la cresta o la base nuova, se va
  const mDragEnd = (D) => {
    const e = D.e, tops = topsOf(e), H = e.height ?? mtnVal("height");
    if (D.kind === "crest") {
      const shown = tops.map((t) => t.slice());
      shown[D.k] = [D.cur[0], D.cur[1], D.h];
      const why = crestProblem(shown.map((t) => [t[0], t[1]]));
      if (why) { warn(MTN_PROBLEM.crest[why]); return; }
      if (e.base) { const wb = baseProblem(baseShown(e), shown, H); if (wb) { warn(MTN_PROBLEM.base[wb]); return; } }
      const stored = e.crest.map((q) => q.slice());
      stored[D.k] = crestStore(e, D.cur, D.h).map(Math.round);
      mCommit([], mAndTwin(e).map((f) => [f, { crest: stored }]));
      return;
    }
    const shown = baseShown(e).map((q) => q.slice());
    shown[D.k] = D.cur;
    const why = baseProblem(shown, tops, H);
    if (why) { warn(MTN_PROBLEM.base[why]); return; }
    const stored = roundPts(e.mirrored ? shown.map((q) => mm(e, q)) : shown);
    mCommit([], mAndTwin(e).map((f) => [f, { base: stored }]));
  };
  // i "-" e "+", "Nuova variante", "Base automatica": della montagna scelta
  // (con la gemella), o i parametri delle nuove
  // [§9.215, richiesta dell'autore] alzare o abbassare una cima sola: il suo
  // moltiplicatore (`peaks`, a passi PEAK_STEPS) e, perche' la cima salga
  // davvero sullo schermo, il punto della cresta piu' in alto di quanto
  // cresce l'altezza (il piede sul terreno resta dov'e': la base, gli
  // ostacoli sotto, la gemella non cambiano). Coi controlli della cresta.
  const peakStep = (e, k, dir) => {
    const peaks = e.peaks ? e.peaks.slice() : e.crest.map(() => 1), m0 = peaks[k];
    const i = PEAK_STEPS.reduce((b, s, j) => (Math.abs(s - m0) < Math.abs(PEAK_STEPS[b] - m0) ? j : b), 0);
    const m1 = PEAK_STEPS[Math.max(0, Math.min(PEAK_STEPS.length - 1, i + dir))];
    if (m1 === m0) return;
    const top = geoOf(e).tops[k], dh = top.h * (m1 / m0 - 1);
    peaks[k] = m1;
    const crest = e.crest.map((q) => q.slice());
    crest[k][1] = Math.round(crest[k][1] - dh);
    // (i controlli su come si vede: la cima del punto che si alza)
    const shown = geoOf(e).tops.map((t) => [t.x, t.y]);
    shown[k] = [top.x, top.y - dh];
    const why = crestProblem(shown);
    if (why) { warn(MTN_PROBLEM.crest[why]); return; }
    if (top.y - dh < -VIEW_MARGIN) { warn("This peak would go off the map."); return; }
    mCommit([], mAndTwin(e).map((f) => [f, { peaks: peaks.every((v) => v === 1) ? undefined : peaks, crest }]));
  };
  const mPanel = (q) => {
    const e = ed.msel && ed.msel.e;
    if (e && ed.msel.peak !== undefined && ed.msel.peak !== null && (q === "height-" || q === "height+")) { peakStep(e, ed.msel.peak, q.endsWith("+") ? 1 : -1); return; }
    if (q === "seed") { if (e) mCommit([], mAndTwin(e).map((f) => [f, { seed: newSeed() }])); return; }
    if (q === "auto") { if (e && e.base) mCommit([], mAndTwin(e).map((f) => [f, { base: undefined }])); return; }
    const k = q.slice(0, -1), dir = q.endsWith("+") ? 1 : -1, n = MOUNTAIN_STEPS[k].length;
    if (!e) { ed.mtn[k] = Math.max(0, Math.min(n - 1, ed.mtn[k] + dir)); return; }
    const i = Math.max(0, Math.min(n - 1, mtnIdx(k, e[k] ?? MOUNTAIN_STEPS[k][ed.mtn[k]]) + dir));
    if (MOUNTAIN_STEPS[k][i] !== e[k]) mCommit([], mAndTwin(e).map((f) => [f, { [k]: MOUNTAIN_STEPS[k][i] }]));
  };

  // ------------------------------------------- impostazioni e salvataggio
  // [§9.184] pannelli HTML sopra l'editor (netui.js NetPanel, come quelli
  // della partita online: caselle di testo vere), coi pulsanti a pillola;
  // mentre sono aperti l'editor aspetta (ed.dom)
  const INPUT = { display: "block", boxSizing: "border-box", width: "100%", padding: "8px 12px", border: "1px solid rgba(0, 0, 0, .22)",
                  borderRadius: "12px", background: "rgba(255, 255, 255, .95)", font: "15px/1.35 system-ui, sans-serif", color: "#222",
                  webkitUserSelect: "text", userSelect: "text" };
  const panel = (titleText) => {
    const p = new NetPanel({ onEscape: () => close() });
    // ([§9.188] chiudendo, i tasti tenuti si lasciano: il pannello ha fermato
    // il loro rilascio, e il Ctrl+S dopo non scattava piu')
    const close = () => { p.close(); ed.dom = null; input.releaseAll(); };
    ed.dom = p;
    ed.hover = null;
    // opaco (sotto ci sono i testi dell'editor), il titolo nel font dei pulsanti
    Object.assign(p.panel.style, { background: "rgba(255, 255, 255, .97)", width: "min(720px, 94vw)" });
    p.heading(titleText).style.margin = "2px 0 12px";
    return [p, close];
  };
  // una riga: l'etichetta a sinistra, il resto a destra
  const line = (p, label) => {
    const row = p._add(document.createElement("div"));
    Object.assign(row.style, { display: "flex", alignItems: "center", gap: "10px" });
    const l = document.createElement("div");
    Object.assign(l.style, { flex: "0 0 150px" });
    setDomText(l, label, { font: "overdue", colour: "#222", width: 150 });
    const right = document.createElement("div");
    Object.assign(right.style, { flex: "1 1 auto", display: "flex", flexWrap: "wrap", gap: "6px" });
    row.append(l, right);
    return right;
  };
  const textField = (p, label, value, max, area = false) => {
    const t = document.createElement(area ? "textarea" : "input");
    line(p, label).append(t);
    if (!area) t.type = "text";
    t.maxLength = max; t.value = value; t.spellcheck = false;
    Object.assign(t.style, INPUT, area ? { height: "64px", resize: "none" } : {});
    return t;
  };
  // una scelta fra valori: pulsanti piccoli, quello scelto verde
  // (data-net: "<chiave>-<valore>", per le prove nel browser)
  const choice = (p, key, label, values, name, value, onPick) => {
    const row = line(p, label), btns = [];
    const mark = (cur) => { for (const [b, v] of btns) { b.classList.toggle("primary", v === cur); p.relabel(b, name(v), v === cur); } };
    for (const v of values) {
      const b = p.button(row, name(v), () => { onPick(v); mark(v); }, { name: key + "-" + v });
      Object.assign(b.style, { minWidth: "0", height: "32px", padding: "0 12px" });
      btns.push([b, v]);
    }
    mark(value);
  };
  const openSettings = () => {
    const m = scene.map, v = { width: m.width, height: m.height, background: m.background, ...m.cpu };
    const [p, close] = panel(tr("Map settings"));
    const name = textField(p, tr("Name"), m.name, NAME_MAX);
    const desc = textField(p, tr("Description"), m.description || "", DESC_MAX, true);
    // [§9.185, richiesta dell'autore] la copertina, come la foto delle
    // mappe della schermaglia (720 x 480, §9.121): un'immagine caricata,
    // ritagliata al centro e compressa (mapstore.js makeCover)
    v.cover = m.cover || null;
    const cov = line(p, tr("Cover"));
    const img = document.createElement("img"), none = document.createElement("div");
    Object.assign(img.style, { width: "180px", height: "120px", objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(0, 0, 0, .2)" });
    Object.assign(none.style, { width: "180px", height: "120px", borderRadius: "10px", border: "1px dashed rgba(0, 0, 0, .3)",
                                display: "flex", alignItems: "center", justifyContent: "center" });
    setDomText(none, tr("No cover"), { font: "overdue", colour: "#666", width: 170, center: true });
    img.dataset.net = "cover";
    // (con display: flex nello stile l'attributo hidden non basta)
    const showCover = () => { img.hidden = !v.cover; none.style.display = v.cover ? "none" : "flex"; if (v.cover) img.src = v.cover; };
    const coverBtns = document.createElement("div");
    Object.assign(coverBtns.style, { display: "flex", flexDirection: "column", gap: "6px", justifyContent: "center" });
    cov.append(img, none, coverBtns);
    const load = p.button(coverBtns, tr("Load an image…"), () => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
      document.body.append(input);
      input.onchange = async () => {
        const file = input.files && input.files[0];
        input.remove();
        if (!file) return;
        try { v.cover = await makeCover(file); showCover(); p.status(""); } catch (e) { console.error(e); p.status(tr("This image could not be read."), "error"); }
      };
      input.click();
    }, { name: "cover-load" });
    const drop = p.button(coverBtns, tr("Remove"), () => { v.cover = null; showCover(); }, { name: "cover-remove" });
    for (const b of [load, drop]) Object.assign(b.style, { minWidth: "0", height: "32px", padding: "0 12px" });
    showCover();
    choice(p, "width", tr("Width"), MAP_SIZES, String, v.width, (x) => { v.width = x; });
    choice(p, "height", tr("Height"), MAP_SIZES, String, v.height, (x) => { v.height = x; });
    choice(p, "background", tr("Background"), MAP_BACKGROUNDS, (b) => tr(BG_NAMES[b]), v.background, (x) => { v.background = x; });
    // [§9.186] "a scelta del giocatore": li sceglie chi lancia la partita
    const cpuName = (names) => (q) => tr(q === "choice" ? "Player's choice" : q === "static" ? "Static" : names[q]);
    choice(p, "difficulty", tr("Difficulty"), CPU_DIFFICULTY, cpuName(SK_OPTIONS.difficulty.names), v.difficulty, (x) => { v.difficulty = x; });
    choice(p, "style", tr("CPU style"), CPU_STYLE, cpuName(SK_OPTIONS.style.names), v.style, (x) => { v.style = x; });
    // [§9.198, richiesta dell'autore] la password per modificarla (vuota:
    // resta quella di prima; "Togli": nessuna); giocarla resta libero
    v.lock = m.lock || null;
    const pwRow = line(p, tr("Password"));
    const pw = document.createElement("input");
    pw.type = "password"; pw.maxLength = 64; pw.autocomplete = "new-password"; pw.dataset.net = "password";
    Object.assign(pw.style, INPUT, { flex: "1 1 160px" });
    const pwNote = document.createElement("div");
    Object.assign(pwNote.style, { flex: "1 1 100%" });
    const showLock = () => {
      pw.placeholder = tr(v.lock ? "Set (leave empty to keep it)" : "No password");
      setDomText(pwNote, tr("Only who knows it can edit the map in the editor; anyone can play it."), { font: "overdue", colour: "#666", width: 420 });
    };
    const pwDrop = p.button(pwRow, tr("Remove"), () => { v.lock = null; pw.value = ""; showLock(); }, { name: "password-remove" });
    Object.assign(pwDrop.style, { minWidth: "0", height: "32px", padding: "0 12px" });
    pwRow.prepend(pw);
    pwRow.append(pwNote);
    showLock();
    const row = p.row();
    p.button(row, tr("Apply"), () => {
      const resize = v.width !== m.width || v.height !== m.height || v.background !== m.background;
      Object.assign(m, { name: name.value.trim().slice(0, NAME_MAX), description: desc.value.trim().slice(0, DESC_MAX),
                         width: v.width, height: v.height, background: v.background,
                         cpu: { difficulty: v.difficulty, style: v.style } });
      if (v.cover) m.cover = v.cover; else delete m.cover;
      if (pw.value) v.lock = lockOf(pw.value); // §9.198
      if (v.lock) m.lock = v.lock; else delete m.lock;
      ed.meta = true;
      close();
      if (resize) rebuildScene();
    }, { primary: true, name: "apply" });
    p.button(row, tr("Cancel"), close);
    name.focus();
  };
  // [§9.188] Salvare: dove la mappa e' collegata (il suo posto nel browser,
  // il suo file) o, la prima volta, dove si sceglie. where: { browser, file }.
  // Il file: riscritto se e' collegato, se no "Salva con nome" (che lo
  // collega) o lo scarica dove non si puo'. Il file prima: se lo si annulla
  // non si salva niente ("annullato").
  const saveTo = async (where) => {
    const m = scene.map;
    if (where.file) {
      if (ed.file) await writeMapFile(ed.file, m);
      else {
        const h = await saveMapAs(m);
        if (h === null) return "annullato";
        if (h !== "download") ed.file = h;
      }
    }
    if (where.browser) ed.mapId = await saveMap(m, ed.mapId);
    markSaved();
    toast(tr("Map saved"));
    return "salvato";
  };
  // il pannello: il nome, dove (nel browser, su file: tutti e due di
  // partenza), Salva e Annulla
  const openSave = () => {
    const m = scene.map;
    ed.afterSave = null;
    const [p, close] = panel(tr("Save map"));
    // [§9.187] cosa fare dopo aver salvato (uscire, aprire un'altra mappa)
    const after = () => { const a = ed.afterSave; ed.afterSave = null; if (a) a(); };
    const name = textField(p, tr("Name"), m.name, NAME_MAX);
    const where = { browser: true, file: true };
    const places = line(p, tr("Where")), btns = [];
    const mark = () => { for (const [b, k, label] of btns) { b.classList.toggle("primary", where[k]); p.relabel(b, label, where[k]); } };
    for (const [k, label] of [["browser", tr("In the browser")], ["file", tr("To a file") + (ed.file && ed.file.name ? ": " + ed.file.name : "")]]) {
      const b = p.button(places, label, () => { where[k] = !where[k]; mark(); }, { name: "where-" + k });
      Object.assign(b.style, { minWidth: "0", height: "32px", padding: "0 12px" });
      btns.push([b, k, label]);
    }
    mark();
    const row = p.row();
    p.button(row, tr("Save"), async () => {
      const n = name.value.trim().slice(0, NAME_MAX);
      if (!n) { p.status(tr("Give the map a name."), "error"); name.focus(); return; }
      if (!where.browser && !where.file) { p.status(tr("Choose at least one place."), "error"); return; }
      m.name = n;
      try {
        if ((await saveTo(where)) === "annullato") return;
        close();
        after();
      } catch (e) { console.error(e); p.status(tr("Saving failed"), "error"); }
    }, { primary: true, name: "save" });
    p.button(row, tr("Cancel"), () => { ed.afterSave = null; close(); });
    name.focus();
    name.addEventListener("keydown", (e) => { if (e.key === "Enter") row.firstChild.click(); });
  };
  // Ctrl+S: di nuovo dove la mappa e' collegata (browser, file); se non lo e'
  // ancora, il pannello. (true se ha salvato; con il pannello aperto, false:
  // decide il pannello)
  const quickSave = async () => {
    const m = scene.map;
    if ((!ed.mapId && !ed.file) || !m.name) { openSave(); return false; }
    try { return (await saveTo({ browser: !!ed.mapId, file: !!ed.file })) === "salvato"; } catch (e) { console.error(e); toast(tr("Saving failed"), "warning"); return false; }
  };
  // [§9.188] "Prova mappa": la mappa giocata come schermaglia ("custom", app.js).
  // Prima la sessione dell'editor (la mappa com'e', il suo posto, il file, se
  // era cambiata, la vista) per tornarci, poi la room e le opzioni: quelle
  // della schermaglia del giocatore, con la CPU della mappa se e' fissata
  const testMap = async () => {
    const m = scene.map;
    if (!sidesOk(scene.map)) { toast(tr(NEED_SIDES), "warning"); return; } // §9.191
    const sk = skForMap(loadSkirmish(), m); // (§9.190: come la schermaglia, skuser.js)
    try {
      await putService("__session__", { map: JSON.parse(JSON.stringify(m)), mapId: ed.mapId, label: ed.label, file: ed.file || null,
                                         dirty: dirty(), tool: ed.tool, view: { x: view.x + view.w / 2, y: view.y + view.h / 2, scale: view.scale } });
      await putService("__test__", { room: testRoom(m), sk });
    } catch (e) { console.error(e); toast(tr("Saving failed"), "warning"); return; }
    location.search = "?room=" + TEST_ROOM;
  };
  // [§9.188] tornando dalla prova (?resume=1): la mappa com'era, coi suoi
  // collegamenti, cambiata se lo era; la vista e lo strumento di prima
  const resume = async () => {
    const rec = await takeService("__session__").catch(() => null);
    takeService("__test__").catch(() => null);
    if (!rec) return;
    const v = validateMap(rec.map, allowedObjects(), objects);
    if (v.errors) { console.warn("[editor] sessione non valida:", v.errors); return; }
    setScene(await EditScene.load(ctx, v.map, progress), rec.label || v.map.name, rec.mapId || null, rec.file || null);
    ed.meta = !!rec.dirty;
    if (rec.view) { view.zoomAt(rec.view.scale, view.cssW / 2, view.cssH / 2); view.centre(rec.view.x, rec.view.y); }
    if (rec.tool) setTool(rec.tool);
  };

  // (Ctrl+S nel browser apre "Salva pagina": qui no)
  window.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") e.preventDefault(); }, true);
  // "Apri mappa": il pannello, e le mappe del browser lette in sottofondo
  const openPanel = () => {
    ed.open = { hover: null, mine: null, scroll: 0 };
    listMaps().then((l) => { if (ed.open) ed.open.mine = l; }, () => { if (ed.open) ed.open.mine = []; });
  };

  // [§9.218] le icone delle particelle dell'erba: per ognuna un ciuffo di
  // particelle vere (effects.js MEADOW_PARTS) in un sistema tutto suo, fuori
  // dalla mappa; il passo le fa ondeggiare come nel gioco (il wiggle)
  // (piu' grandi e piu' piene che sulla mappa: l'erba del gioco e' tenue;
  // una copia del tipo di particella con la sua trasparenza, piu' bassa per
  // le particelle a 0)
  const uiParts = new Particles(), TUFT = { dark: 6, mid: 6, light: 6, blades: 7, wheat: 5, poppy: 3, yellow: 3, leaves: 2, pink: 2, clover: 3 };
  const TUFT_K = { dark: 1.7, mid: 1.7, light: 1.7, blades: 2.2, wheat: 1.5, poppy: 0.95, yellow: 1.1, leaves: 0.6, pink: 1.05, clover: 0.95 }; // (§9.223: foglie, fiori rosa, foglioline)
  // ([§9.224] foglie, fiori rosa e foglioline non hanno l'origine al piede: il
  // ciuffo spostato perche' stia nel suo posto)
  const TUFT_OFF = { leaves: [0, -12], pink: [-26, -34], clover: [0, -14] };
  let tufts = null;
  const makeTufts = () => {
    tufts = {};
    for (const k of MEADOW_KEYS) {
      const ps = uiParts.systemCreate(0, "ui"), n = TUFT[k], gap = n > 4 ? 7 : 12;
      const L = MEADOW_PARTS[k].map((t) => ({ ...t, alpha: [0.95] }));
      ps.autoDraw = false;
      ps.types = L;
      for (let j = 0; j < n; j++) {
        uiParts.create(ps, 0, 0, L[j % L.length], 1);
        const q = ps.parts[ps.parts.length - 1];
        q.size *= TUFT_K[k];
        const off = TUFT_OFF[k] || [0, 0];
        q.dx = (j - (n - 1) / 2) * gap + (vrand() - 0.5) * 4 + off[0]; q.dy = (j % 2) * 4 + off[1];
      }
      ps.parts.sort((a, b) => a.dy - b.dy); // (quelle piu' in basso davanti)
      tufts[k] = ps;
    }
  };
  const ALL = { x: -1e9, y: -1e9, w: 2e9, h: 2e9 };
  const drawTuft = (key, x, y, dim) => {
    if (!tufts) return;
    const ps = tufts[key];
    for (const q of ps.parts) { q.x = x + q.dx; q.y = y + q.dy; }
    for (const t of ps.types) t.alpha = [dim ? 0.28 : 0.95]; // (a 0: sbiadito)
    uiParts.draw(ps, r, assets, ALL);
  };

  const step = () => {
    input.beginStep();
    if (ed.tool === "brush" && ed.brush.kind === "grass") { if (!tufts) makeTufts(); uiParts.step(); } // §9.218
    if (ed.loading || ed.dom) return;
    const W = view.cssW, H = view.cssH, L = layoutNow(), mx = input.x, my = input.y; // (§9.206: col riquadro della nebbia)
    const [rx, ry] = view.toRoom(mx, my);
    // ([§9.199] Ctrl anche se gia' lasciato, se il tasto e' stato premuto con
    // Ctrl tenuto: su una macchina lenta Ctrl+S arriva cosi')
    const K = (k) => input.pressed.has(k);
    const ctrl = input.down.has(17) || [...input.pressed].some((k) => input.pressedCtrl.has(k)), shift = input.down.has(16);
    // la conferma, sopra tutto
    if (ed.confirm) {
      const B = ed.confirm.buttons, C = confirmLayout(W, H, B.length), k = C.buttons.findIndex((R) => inRect(mx, my, R));
      ed.confirm.hover = k >= 0 ? k : null;
      if (K(27)) { const esc = ed.confirm.esc; ed.confirm = null; if (esc) esc(); return; }
      if (input.mouseReleased[0] && k >= 0) {
        ed.confirm = null;
        if (B[k].action) B[k].action();
      }
      return;
    }
    // il pannello "Apri mappa": Esc o un clic fuori lo chiudono
    if (ed.open) {
      const mine = ed.open.mine || [], O = openLayout(W, H, mine.length, ed.open.scroll);
      const at = (q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2]);
      const del = O.mine.find((q) => dhypot(mx - q.del[0], my - q.del[1]) <= q.del[2]);
      ed.open.hover = !input.inside ? null : del ? { remove: del.index } : O.mine.find(at) || O.rows.find(at)
        || (inRect(mx, my, O.file) ? "file" : null);
      if (input.wheelStep && inRect(mx, my, O.left)) ed.open.scroll = Math.max(0, O.first + Math.sign(input.wheelStep));
      if (K(27)) { ed.open = null; return; }
      if (input.mouseReleased[0]) {
        const q = ed.open.hover;
        ed.open = null;
        if (q === "file") guard(openFile);
        else if (q && q.remove !== undefined) {
          const rec = mine[q.remove];
          ed.confirm = { text: "This map will be deleted.", esc: openPanel,
                         buttons: [{ label: "Delete", action: () => deleteMap(rec.id).then(openPanel, (e) => { console.error(e); openPanel(); }) },
                                   { label: "Cancel", action: openPanel }] };
        } else if (q && q.index !== undefined) guard(() => openSaved(mine[q.index].id));
        else if (q && q.room) guard(() => openTemplate(q.room));
      }
      return;
    }
    const hit = input.inside ? hitTest(L, mx, my) : null;
    ed.colScroll = L.scroll; // §9.196: (limitato dalla disposizione: la finestra cambia)
    // [§9.220] il nome dell'icona della larghezza col puntatore sopra
    const WG = hit && hit.kind === "ui" ? widthGroups(L.panel).find(([G]) => mx >= G.label[0] - 6 && mx <= G.label[0] + 56 && Math.abs(my - G.label[1]) <= 18) : null;
    ed.iconTip = WG ? { text: WG[1], x: WG[0].label[0], y: WG[0].label[1] } : null;
    ed.hover = hit && (hit.kind === "tool" || hit.kind === "action" || hit.kind === "edit" || hit.kind === "back" || hit.kind === "colscroll") ? hit : null;
    // [§9.185] la pennellata in corso: solo lei (e la vista)
    if (ed.stroke) {
      const st = ed.stroke;
      if (input.inside) strokeStep(rx, ry);
      if (!input.mouseDown[st.erase ? 1 : 0]) strokeEnd();
      return;
    }
    if (ed.erasing) { // §9.194: la passata della gomma
      if (input.inside) eraseAt(rx, ry);
      if (!input.mouseDown[0]) { ed.erasing = false; scene.end(); }
      return;
    }
    // [§9.187] la polilinea: la linea scelta che non c'e' piu' (annullata); i tasti
    if (ed.lsel && !(scene.map[ed.lsel.key] || []).includes(ed.lsel.e)) ed.lsel = null;
    if (ed.tool === "line" && ed.drawing) {
      if (K(27)) { ed.drawing = null; return; } // Esc: via la linea che si disegna
      if (K(13)) { lineFinish(); return; } // Invio: finita
      if (K(8)) { ed.drawing.pts.pop(); if (!ed.drawing.pts.length) ed.drawing = null; return; } // Backspace: via l'ultimo punto
    } else if (ed.tool === "line" && ed.lsel) {
      const { key, e, vi } = ed.lsel;
      if (K(27)) { ed.lsel = null; return; }
      if (K(46)) { scene.removeFeatures(key, lineAndTwin(key, e)); ed.lsel = null; return; } // Canc: via la linea
      if (K(8) && vi !== null && e.pts.length > 2) { // Backspace: via il punto
        linePts(key, e, (pts) => { pts.splice(vi, 1); return pts; });
        ed.lsel = { key, e, vi: null };
        return;
      }
    }
    // [§9.214] la montagna: i tasti mentre la si disegna o con una scelta
    if (ed.msel && !(scene.map.mountains || []).includes(ed.msel.e)) ed.msel = null; // (annullata)
    if (ed.tool === "mountain" && ed.mdraw) {
      if (K(27)) { ed.mdraw = null; return; } // Esc: via
      if (K(13)) { mStep(); return; } // Invio: il passo e' fatto
      if (K(8)) { const L2 = ed.mdraw.step === "crest" ? ed.mdraw.crest : ed.mdraw.base; L2.pop(); if (ed.mdraw.step === "crest" && !L2.length) ed.mdraw = null; return; }
    } else if (ed.tool === "mountain" && ed.msel) {
      const pk = ed.msel.peak;
      if (K(27)) { if (pk !== undefined && pk !== null) ed.msel = { e: ed.msel.e }; else ed.msel = null; return; } // (§9.215: prima la cima)
      // [§9.215] + e - (anche del tastierino) per la cima scelta
      if (pk !== undefined && pk !== null && (K(187) || K(107) || K(189) || K(109))) { peakStep(ed.msel.e, pk, K(187) || K(107) ? 1 : -1); return; }
      if (K(46)) { scene.removeFeatures("mountains", mAndTwin(ed.msel.e)); ed.msel = null; return; } // Canc: via la montagna
      if (K(66)) { ed.mdraw = { step: "base", crest: [], base: [], edit: ed.msel.e }; return; } // B: la base di nuovo
    }
    // Esc: prima si lascia l'oggetto o la scelta, poi si esce
    if (K(27)) {
      if (ed.wall) ed.wall = null; // §9.194: via il prolungamento delle mura
      else if (ed.tool === "insert" && ed.pick) ed.pick = null;
      else if (ed.sel.size) ed.sel.clear();
      else guard(toMenu);
      return;
    }
    // annulla e ripeti (Ctrl+Z, Ctrl+Y o Ctrl+Maiusc+Z), con ogni strumento
    if (ctrl && K(90)) { if (shift ? scene.redo() : scene.undo()) tidySel(); return; }
    if (ctrl && K(89)) { if (scene.redo()) tidySel(); return; }
    // gli strumenti coi tasti 1-4
    if (!ctrl) TOOL_KEYS.forEach((t, k) => { if (K(49 + k) || K(97 + k)) setTool(t); }); // (§9.214: TOOL_KEYS)
    if (!ctrl && K(83)) nextStyle(shift ? -1 : 1); // §9.183
    if (ctrl && K(83)) { quickSave(); return; } // §9.184
    if (ed.tool === "select") {
      // (§9.184: con la simmetria anche le gemelle)
      if (K(46) || K(8)) { scene.remove(scene.withTwins(selected(), symMode())); ed.sel.clear(); }
      if (K(77) && !ctrl && ed.sel.size) scene.modify(scene.withTwins(selected(), symMode()), (e) => ({ scale_x: -(e.scale_x ?? 1) }));
      if (ctrl && K(67)) copy();
      if (ctrl && K(88)) cut(); // §9.195
      if (ctrl && K(86) && !hit) paste(rx, ry);
      if (ctrl && K(65)) ed.sel = new Set(scene.map.instances.filter((e) => !SYSTEM.has(e.object) && scene.instOf(e)));
    }
    // la vista: frecce (Shift: piu' veloce), trascinando col tasto centrale
    // o con Spazio + sinistro, rotella per lo zoom attorno al puntatore (sulla
    // tavolozza scorre gli oggetti)
    const sp = shift ? 36 : 14;
    const dx = (input.down.has(39) ? 1 : 0) - (input.down.has(37) ? 1 : 0), dy = (input.down.has(40) ? 1 : 0) - (input.down.has(38) ? 1 : 0);
    if ((dx || dy) && !ctrl) view.pan(dx * sp, dy * sp);
    const P = ed.tool === "insert" ? paletteNow(L.panel) : null;
    if (input.inside && input.wheelStep && shift && (ed.tool === "brush" || ed.tool === "erase") && !hit) { // §9.185: Maiusc+rotella, la larghezza (§9.194: anche la gomma)
      const B = ed.tool === "brush" ? ed.brush : ed.erase;
      B.w = Math.max(0, Math.min(BRUSH_WIDTHS.length - 1, B.w - Math.sign(input.wheelStep)));
    } else if (input.inside && input.wheelStep && L.maxScroll > 0 && inRect(mx, my, L.col)) { // §9.196: la colonna scorre
      ed.colScroll = L.scroll + Math.sign(input.wheelStep) * L.step; // (rotella in giu': i pulsanti piu' in basso)
    } else if (input.inside && (input.wheelStep || input.wheelFine)) {
      if (P && inRect(mx, my, P.strip)) {
        if (input.wheelStep) ed.scroll[ed.cat] = Math.max(0, Math.min(P.max, P.scroll + Math.sign(input.wheelStep)));
      } else {
        // uno scatto: x1,15 (o /1,15); il touchpad: in proporzione ai pixel
        const n = input.wheelStep || 0, fine = (input.wheelFine || 0) / 600;
        let f = fine >= 0 ? 1 + fine : 1 / (1 - fine);
        for (let k = 0; k < Math.abs(n); k++) f = n > 0 ? f * 1.15 : f / 1.15;
        view.zoomAt(view.scale * f, mx, my);
      }
    }
    const grab = input.mousePressed[2] || (input.mousePressed[0] && input.down.has(32) && !hit);
    // ([§9.199] dal punto in cui si e' premuto, e fino all'ultima posizione
    // anche se il tasto e' gia' stato lasciato: su una macchina lenta pressione,
    // movimento e rilascio possono stare in un passo solo)
    if (grab) { const b = input.mousePressed[2] ? 2 : 0, [px, py] = input.pressPos[b]; ed.drag = { x: px, y: py, button: b }; }
    if (ed.drag) {
      view.pan(ed.drag.x - mx, ed.drag.y - my); ed.drag.x = mx; ed.drag.y = my;
      if (!input.mouseDown[ed.drag.button]) ed.drag = null;
      return;
    }
    // la colonna e il cerchio "Indietro"
    if (input.mouseReleased[0] && ed.hover && !ed.move && !ed.box) {
      const b = ed.hover;
      if (b.kind === "back") { guard(toMenu); return; }
      if (b.kind === "colscroll") { ed.colScroll = L.scroll + b.dir * L.step; return; } // §9.196
      if (b.kind === "edit") { editAction(b.key); return; } // §9.195
      if (b.kind === "tool") setTool(b.key);
      else if (b.key === "open") openPanel(); // §9.181, §9.184
      else if (b.key === "new") guard(newBlank); // §9.182
      else if (b.key === "save") openSave(); // §9.184
      else if (b.key === "settings") openSettings(); // §9.184
      else if (b.key === "test") testMap(); // §9.188
      return;
    }
    // [§9.186] la riga della simmetria (Sposta, Inserisci, Pennello)
    ed.symHover = null;
    // [§9.227] il dado degli stili di "Inserisci"
    ed.diceHover = ed.tool === "insert" && hit && hit.kind === "ui" && inRect(mx, my, diceLayout(L.panel));
    if (ed.diceHover) { if (input.mouseReleased[0]) ed.dice = !ed.dice; return; }
    if (SYM_TOOLS.has(ed.tool) && hit && hit.kind === "ui") {
      const o = symLayout(L.panel).opts.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2]));
      if (o) {
        ed.symHover = o.mode;
        if (input.mouseReleased[0]) ed.sym[ed.tool] = o.mode;
        return;
      }
    }
    // [§9.206] il riquadro della nebbia: "-" e "+" delle impostazioni
    ed.fogHover = null;
    const FT = hit && hit.kind === "ui" ? fogTarget() : null;
    if (FT) {
      const FL = fogLayout(L.panel, FT.object);
      if (inRect(mx, my, FL.box)) {
        for (const G of FL.groups) for (const [C, sg] of [[G.minus, "-"], [G.plus, "+"]]) if (dhypot(mx - C[0], my - C[1]) <= C[2] + 4) ed.fogHover = G.key + sg;
        if (input.mouseReleased[0] && ed.fogHover) setFog(FT, ed.fogHover.slice(0, -1), ed.fogHover.endsWith("+") ? 1 : -1);
        return;
      }
    }
    // la tavolozza (Inserisci)
    ed.palHover = null;
    if (P && hit && hit.kind === "ui") {
      // [§9.195] l'interruttore rosso / blu: la casella scelta passa all'altra parte
      const sideHit = P.side && ["red", "blue"].find((k) => dhypot(mx - P.side[k][0], my - P.side[k][1]) <= P.side[k][2] + 5);
      if (sideHit) {
        ed.palHover = "side";
        if (input.mouseReleased[0] && sideHit !== ed.sideFilter) {
          ed.sideFilter = sideHit;
          const it = ed.pick && ed.pick.cat === ed.cat ? ITEMS[ed.cat][ed.pick.i] : null;
          if (it && it.side && it.side !== sideHit) {
            const j = ITEMS[ed.cat].findIndex((q) => q.side === sideHit && q.key.split(":")[0] === it.key.split(":")[0]);
            ed.pick = j >= 0 ? { cat: ed.cat, i: j } : null;
          }
        }
        return;
      }
      ed.palHover = P.cells.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2])) || P.tabs.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2]))
        || (P.prev && inRect(mx, my, P.prev) ? "prev" : P.next && inRect(mx, my, P.next) ? "next" : null);
      if (input.mouseReleased[0] && ed.palHover) {
        const q = ed.palHover;
        if (q === "prev") ed.scroll[ed.cat] = Math.max(0, P.scroll - P.per);
        else if (q === "next") ed.scroll[ed.cat] = Math.min(P.max, P.scroll + P.per);
        else if (q.i !== undefined && catalog === "ready") {
          const same = ed.pick && ed.pick.cat === ed.cat && ed.pick.i === q.i;
          ed.pick = same ? null : { cat: ed.cat, i: q.i };
        }
        else ed.cat = q.k;
      }
      return;
    }
    // [§9.187] il riquadro della polilinea: le schede, larghezza e larghezza
    // finale (della linea scelta, o di quelle nuove)
    if (ed.tool === "line" && hit && hit.kind === "ui") {
      const B = lineLayout(L.panel), on = (q) => dhypot(mx - q[0], my - q[1]) <= q[2] + 4;
      const tab = B.tabs.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2]));
      ed.palHover = tab || (on(B.width.minus) ? "w-" : on(B.width.plus) ? "w+" : on(B.end.minus) ? "e-" : on(B.end.plus) ? "e+" : null);
      if (input.mouseReleased[0] && ed.palHover) {
        const q = ed.palHover, dir = q[1] === "+" ? 1 : -1, step = (k) => Math.max(0, Math.min(LINE_WIDTHS.length - 1, k + dir));
        if (q.kind) { ed.line.kind = q.kind; ed.lsel = null; ed.drawing = null; }
        else if (ed.lsel) {
          const { key, e } = ed.lsel;
          scene.modifyFeatures(key, lineAndTwin(key, e), (f) => {
            const w = f.width, we = f.widthEnd ?? f.width;
            if (q[0] === "w") { const nw = LINE_WIDTHS[step(nearestW(w))]; return we === w ? { width: nw } : { width: nw, widthEnd: we }; }
            const ne = LINE_WIDTHS[step(nearestW(we))];
            return ne === w ? { widthEnd: undefined } : { widthEnd: ne };
          });
          for (const f of lineAndTwin(key, e)) if (f.widthEnd === undefined) delete f.widthEnd;
        } else {
          const k = ed.line.kind, W0 = ed.line.w, E0 = ed.line.we;
          if (q[0] === "w") { const linked = E0[k] === W0[k]; W0[k] = step(W0[k]); if (linked) E0[k] = W0[k]; } else E0[k] = step(E0[k]);
        }
      }
      return;
    }
    // [§9.214] il riquadro della montagna: i "-" e "+", i due pulsanti
    if (ed.tool === "mountain" && hit && hit.kind === "ui") {
      const B = mountainLayout(L.panel), on = (q) => dhypot(mx - q[0], my - q[1]) <= q[2] + 4;
      ed.palHover = null;
      for (const k of MTN_KEYS) { if (on(B[k].minus)) ed.palHover = k + "-"; if (on(B[k].plus)) ed.palHover = k + "+"; }
      if (inRect(mx, my, B.seed)) ed.palHover = "seed";
      if (inRect(mx, my, B.auto)) ed.palHover = "auto";
      if (input.mouseReleased[0] && ed.palHover && !ed.mdraw) mPanel(ed.palHover);
      return;
    }
    // [§9.194] il riquadro della gomma: la larghezza coi "-" e "+"
    if (ed.tool === "erase" && hit && hit.kind === "ui") {
      const B = brushLayout(L.panel), on = (c) => dhypot(mx - c[0], my - c[1]) <= c[2] + 4;
      ed.palHover = on(B.width.minus) ? "w-" : on(B.width.plus) ? "w+" : null;
      if (input.mouseReleased[0] && ed.palHover) {
        ed.erase.w = Math.max(0, Math.min(BRUSH_WIDTHS.length - 1, ed.erase.w + (ed.palHover === "w+" ? 1 : -1)));
      }
      return;
    }
    // [§9.216] il riquadro delle particelle dell'erba: i "-" e "+"
    ed.mixHover = null; ed.mixTip = null;
    if (ed.tool === "brush" && ed.brush.kind === "grass" && hit && hit.kind === "ui") {
      const ML = meadowLayout(L.panel);
      if (inRect(mx, my, ML.box)) {
        for (const G of ML.groups) for (const [C, sg] of [[G.minus, "-"], [G.plus, "+"]]) if (dhypot(mx - C[0], my - C[1]) <= C[2] + 4) ed.mixHover = G.key + sg;
        const T = ML.groups.find((G) => inRect(mx, my, G.tip));
        ed.mixTip = T ? T.key : null; // §9.218
        if (input.mouseReleased[0] && ed.mixHover) {
          const k = ed.mixHover.slice(0, -1), d = ed.mixHover.endsWith("+") ? 1 : -1;
          ed.brush.mix[k] = Math.max(0, Math.min(MEADOW_STEPS.length - 1, ed.brush.mix[k] + d));
        }
        return;
      }
    }
    // [§9.185] il riquadro del pennello: le schede, i "-" e "+"
    if (ed.tool === "brush" && hit && hit.kind === "ui") {
      const B = brushLayout(L.panel), on = (c) => dhypot(mx - c[0], my - c[1]) <= c[2] + 4;
      const tab = B.tabs.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2]));
      ed.palHover = tab || (on(B.width.minus) ? "w-" : on(B.width.plus) ? "w+" : ed.brush.kind === "forest" && on(B.density.minus) ? "d-"
        : ed.brush.kind === "forest" && on(B.density.plus) ? "d+" : null);
      if (input.mouseReleased[0] && ed.palHover) {
        const q = ed.palHover, b = ed.brush;
        if (q.kind) b.kind = q.kind;
        else if (q[0] === "w") b.w = Math.max(0, Math.min(BRUSH_WIDTHS.length - 1, b.w + (q[1] === "+" ? 1 : -1)));
        else b.d = Math.max(0, Math.min(BRUSH_SPACING.length - 1, b.d + (q[1] === "+" ? 1 : -1)));
      }
      return;
    }
    // sulla mappa
    const onMap = !hit && input.inside;
    if (ed.tool === "line") { // §9.187
      const dbl = !!input.pressDbl[0]; // [§9.201] deciso all'evento (input.js), non al passo
      const M = VIEW_MARGIN, px0 = Math.round(Math.max(-M, Math.min(scene.map.width + M, rx))), py0 = Math.round(Math.max(-M, Math.min(scene.map.height + M, ry)));
      if (ed.drawing) { // un punto a clic; il destro o il doppio clic finiscono
        if (onMap && input.mousePressed[1]) { lineFinish(); return; }
        if (onMap && input.mousePressed[0]) {
          const pts = ed.drawing.pts, last = pts[pts.length - 1];
          if (!last || dhypot(px0 - last[0], py0 - last[1]) > 6 * view.scale) pts.push([px0, py0]);
          // il doppio clic finisce: il punto l'ha gia' messo il primo clic
          // (qui sopra non si ripete), o questo se i due clic sono caduti nello
          // stesso passo (§9.201)
          if (dbl) { lineFinish(); return; }
        }
        return;
      }
      if (ed.ldrag) { // un punto trascinato: la modifica vera lasciando il tasto
        const D = ed.ldrag;
        if (!D.on && dhypot(mx - D.sx, my - D.sy) > 4) D.on = true;
        if (D.on) D.cur = [px0, py0];
        if (!input.mouseDown[0]) {
          ed.ldrag = null;
          if (D.on) linePts(D.key, D.e, (pts, twin) => { pts[D.vi] = twin ? mirrorPts([D.cur])[0] : D.cur; return pts; });
        }
        return;
      }
      if (onMap && input.mousePressed[1]) { ed.lsel = null; return; }
      if (onMap && input.mousePressed[0]) {
        const h = linePick(rx, ry);
        if (h && h.vi !== null) { ed.lsel = h; ed.ldrag = { ...h, sx: mx, sy: my, on: false, cur: null }; }
        else if (h && dbl && ed.lsel && ed.lsel.e === h.e) { // doppio clic su un tratto della linea scelta: un punto nuovo
          linePts(h.key, h.e, (pts, twin) => { pts.splice(h.seg, 0, twin ? mirrorPts([h.at])[0] : h.at); return pts; });
          ed.lsel = { key: h.key, e: h.e, vi: h.seg };
        } else if (h) ed.lsel = { key: h.key, e: h.e, vi: null };
        else { ed.lsel = null; ed.drawing = { kind: ed.line.kind, pts: [[px0, py0]] }; } // fuori dalle linee: una linea nuova
      }
      return;
    }
    if (ed.tool === "mountain") { // §9.214
      const dbl = !!input.pressDbl[0];
      const M = VIEW_MARGIN, px0 = Math.round(Math.max(-M, Math.min(scene.map.width + M, rx))), py0 = Math.round(Math.max(-M, Math.min(scene.map.height + M, ry)));
      if (ed.mdraw) { // un punto a clic; il destro o il doppio clic finiscono il passo
        if (onMap && input.mousePressed[1]) { mStep(); return; }
        if (onMap && input.mousePressed[0]) {
          const d = ed.mdraw, pts = d.step === "crest" ? d.crest : d.base, last = pts[pts.length - 1];
          if (!last || dhypot(px0 - last[0], py0 - last[1]) > 6 * view.scale) mAdd([px0, py0]);
          if (dbl) mStep();
        }
        return;
      }
      if (ed.mdrag) { // un punto trascinato: la modifica vera lasciando il tasto
        const D = ed.mdrag;
        if (!D.on && dhypot(mx - D.sx, my - D.sy) > 4) D.on = true;
        if (D.on) D.cur = [px0, py0];
        if (!input.mouseDown[0]) {
          ed.mdrag = null;
          if (D.on && D.cur) mDragEnd(D);
          else if (D.kind === "crest" && ed.msel && ed.msel.e === D.e) ed.msel = { e: D.e, peak: D.k }; // §9.215: un clic su una cima la sceglie
        }
        return;
      }
      if (onMap && input.mousePressed[1]) { ed.msel = null; return; }
      if (onMap && input.mousePressed[0]) {
        const tol = 12 * view.scale;
        const hd = ed.msel && mHandles(ed.msel.e).find((q) => dhypot(rx - q.x, ry - q.y) <= tol);
        if (hd) { ed.mdrag = { ...hd, e: ed.msel.e, sx: mx, sy: my, on: false, cur: null }; return; }
        const e = scene.mountainAt(rx, ry);
        if (e) { ed.msel = { e }; return; }
        ed.msel = null;
        ed.mdraw = { step: "crest", crest: [], base: [], seed: newSeed(), edit: null };
        mAdd([px0, py0]);
        if (!ed.mdraw.crest.length) ed.mdraw = null;
      }
      return;
    }
    if (ed.tool === "brush") { // §9.185: il sinistro dipinge, il destro cancella
      if (onMap && catalog === "ready" && (input.mousePressed[0] || input.mousePressed[1])) { strokeStart(!input.mousePressed[0]); strokeStep(rx, ry); }
      return;
    }
    if (ed.tool === "erase") { // §9.194
      if (onMap && input.mousePressed[0]) { scene.begin(); ed.erasing = true; eraseAt(rx, ry); }
      return;
    }
    if (ed.tool === "insert") {
      // [§9.194] le mura: il prolungamento in corso (un clic mette il tratto,
      // il destro o Esc lo lasciano), poi i pulsanti "+" e muro/porta
      if (ed.wall && !scene.instOf(ed.wall.p.e)) ed.wall = null; // (il tratto non c'e' piu': annullato)
      if (ed.wall) {
        if (input.mousePressed[1]) { ed.wall = null; return; }
        if (onMap && input.mousePressed[0]) {
          const list = wallPieces(rx, ry);
          if (list.length && inMap(list[0].x, list[0].y)) scene.add(list);
          ed.wall = null;
        }
        return;
      }
      ed.wallHover = onMap ? wallButtonAt(rx, ry) : null;
      if (ed.wallHover && input.mousePressed[0]) {
        const b = ed.wallHover;
        if (b.kind === "plus") ed.wall = { p: b.p };
        else toggleGate(b.e);
        ed.wallHover = null;
        return;
      }
      if (onMap && input.mousePressed[0]) place(rx, ry);
      if (input.mousePressed[1]) ed.pick = null; // il destro lascia l'oggetto
      return;
    }
    if (ed.tool !== "select") return;
    const slack = 14 * view.scale; // il segnaposto delle macchie, 14 px a schermo
    ed.over = onMap && !ed.move && !ed.box ? scene.pick(rx, ry, slack) : null;
    if (onMap && input.mousePressed[1]) ed.sel.clear();
    if (onMap && input.mousePressed[0]) {
      // (con Ctrl sempre il riquadro: in un bosco ogni clic cade su un albero)
      const e = ctrl ? null : scene.pick(rx, ry, slack);
      if (e) {
        if (shift) { if (ed.sel.has(e)) ed.sel.delete(e); else ed.sel.add(e); }
        else if (!ed.sel.has(e)) ed.sel = new Set([e]);
        const list = ed.sel.has(e) ? selected() : [];
        // [§9.184] con la simmetria le gemelle si spostano a specchio
        const twins = scene.withTwins(list, symMode()).filter((t) => !list.includes(t));
        ed.move = { e, x0: rx, y0: ry, sx: mx, sy: my, dx: 0, dy: 0, on: false, list, twins };
      } else {
        if (!shift) ed.sel.clear();
        ed.box = { x0: rx, y0: ry, x1: rx, y1: ry };
      }
    }
    if (ed.move) {
      const M = ed.move;
      if (!M.on && dhypot(mx - M.sx, my - M.sy) > 4) M.on = true; // un clic non sposta
      if (M.on) {
        M.dx = Math.round(rx - M.x0); M.dy = Math.round(ry - M.y0);
        const [ux, uy] = mirrorDelta(symMode(), M.dx, M.dy);
        scene.preview(M.list, M.dx, M.dy); scene.preview(M.twins, ux, uy);
      }
      if (!input.mouseDown[0]) {
        const tw = new Set(M.twins), [tdx, tdy] = mirrorDelta(symMode(), M.dx, M.dy);
        if (M.on && (M.dx || M.dy)) scene.modify([...M.list, ...M.twins], (e) => (tw.has(e) ? { x: e.x + tdx, y: e.y + tdy } : { x: e.x + M.dx, y: e.y + M.dy }));
        else if (M.on) { scene.preview(M.list, 0, 0); scene.preview(M.twins, 0, 0); }
        else if (!shift && ed.sel.size > 1) ed.sel = new Set([M.e]); // un clic su una scelta di piu' voci: resta quella
        ed.move = null;
      }
    }
    if (ed.box) {
      ed.box.x1 = rx; ed.box.y1 = ry;
      if (!input.mouseDown[0]) {
        for (const e of scene.inBox(ed.box.x0, ed.box.y0, rx, ry)) ed.sel.add(e);
        ed.box = null;
      }
    }
  };

  // --------------------------------------------------------------- disegno
  const drawMap = () => {
    const map = scene.map;
    r.setProjection(view.x, view.y, view.w, view.h);
    draw.reset();
    // il suolo cotto (sfondo, macchie, strade, fiumi, ponti), solo dentro la
    // mappa; da lontano a risoluzione ridotta (un texel per pixel dello
    // schermo, circa)
    const x1 = Math.max(0, view.x), y1 = Math.max(0, view.y);
    const x2 = Math.min(map.width, view.x + view.w), y2 = Math.min(map.height, view.y + view.h);
    const dpr = canvas.width / view.cssW;
    if (x2 > x1 && y2 > y1) scene.ground.draw({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, lodFor(view.scale / dpr));
    // fuori dalla mappa il colore della pagina (i blocchi del suolo
    // sbordano), sotto le istanze: montagne e chiazze a cavallo del bordo si
    // vedono intere, come le ha messe l'autore
    draw.reset();
    draw.setColour(OUTSIDE);
    const X0 = view.x - 1, Y0 = view.y - 1, X1 = view.x + view.w + 1, Y1 = view.y + view.h + 1;
    if (X0 < 0) draw.rectangle(X0, Y0, 0, Y1);
    if (X1 > map.width) draw.rectangle(map.width, Y0, X1, Y1);
    if (Y0 < 0) draw.rectangle(X0, Y0, X1, 0);
    if (Y1 > map.height) draw.rectangle(X0, map.height, X1, Y1);
    draw.setColour(c.white);
    scene.world.drawView = view; // §9.203: l'albero finto con la F (editmap.js)
    scene.world.draw(r, draw, view);
    draw.reset();
    const px = view.scale; // un pixel dello schermo, in pixel di mappa
    // il bordo della mappa, 2 px a schermo a ogni zoom
    draw.setAlpha(0.6);
    draw.lineWidthColour(0, 0, map.width, 0, 2 * px, c.black, c.black);
    draw.lineWidthColour(map.width, 0, map.width, map.height, 2 * px, c.black, c.black);
    draw.lineWidthColour(map.width, map.height, 0, map.height, 2 * px, c.black, c.black);
    draw.lineWidthColour(0, map.height, 0, 0, 2 * px, c.black, c.black);
    // [§9.182] gli strumenti: i segnaposto delle macchie (senza sprite), la
    // scelta, la voce sotto il puntatore, il riquadro, il fantasma
    if (ed.tool === "select" || ed.tool === "insert") {
      for (const e of scene.map.instances) {
        const i = scene.instOf(e);
        if (!i || i.sprite_index || SYSTEM.has(e.object)) continue;
        const on = ed.sel.has(e) || ed.over === e;
        draw.setAlpha(on ? 0.95 : 0.55);
        draw.circleColour(i.x, i.y, 10 * px, c.white, c.white, false);
        draw.setAlpha(0.8);
        draw.circleColour(i.x, i.y, 5 * px, (DECOR_TINT[e.object] || [0x3c7a46])[0], (DECOR_TINT[e.object] || [0x3c7a46])[0], false);
        // [§9.205] il banco di nebbia: fin dove va, a destra e a sinistra
        // ([§9.206] la sua ampiezza; fermo, niente); la nebbia estetica: dove
        // scivolano le nuvole prima di svanire (velocita' x durata)
        const f = FOG_SETTINGS[e.object] ? fogOf(e) : null, t = 18 * px;
        draw.setAlpha(on ? 0.8 : 0.45);
        if (e.object === "nebbia_banco" && f.speed) {
          const r = f.range;
          draw.dashedLine(i.x - r, i.y, i.x + r, i.y, 2 * px, c.white, 16 * px, 10 * px);
          for (const x of [i.x - r, i.x + r]) draw.lineWidthColour(x, i.y - t, x, i.y + t, 2 * px, c.white, c.white);
        }
        if (e.object === "sk_nebbia" && f.speed) {
          const x2 = i.x + f.speed * 60 * f.life, sg = Math.sign(f.speed);
          draw.dashedLine(i.x, i.y, x2, i.y, 2 * px, c.white, 16 * px, 10 * px);
          for (const dy of [-1, 1]) draw.lineWidthColour(x2, i.y, x2 - sg * t, i.y + dy * t, 2 * px, c.white, c.white);
        }
      }
    }
    const outline = (b, w, col, a) => {
      draw.setAlpha(a);
      draw.lineWidthColour(b[0], b[1], b[2], b[1], w, col, col);
      draw.lineWidthColour(b[2], b[1], b[2], b[3], w, col, col);
      draw.lineWidthColour(b[2], b[3], b[0], b[3], w, col, col);
      draw.lineWidthColour(b[0], b[3], b[0], b[1], w, col, col);
    };
    const boxOf = (e) => scene.boundsOf(e) || [e.x - 12 * px, e.y - 12 * px, e.x + 12 * px, e.y + 12 * px];
    // [§9.184] la simmetria: l'asse (o il centro, per la diagonale)
    const sym = symMode();
    if (sym !== "none") {
      draw.setAlpha(0.5);
      if (sym === "horizontal") draw.dashedLine(map.width / 2, 0, map.width / 2, map.height, 2 * px, c.white, 24 * px, 16 * px);
      else if (sym === "vertical") draw.dashedLine(0, map.height / 2, map.width, map.height / 2, 2 * px, c.white, 24 * px, 16 * px);
      else {
        const cx = map.width / 2, cy = map.height / 2, a = 30 * px;
        draw.lineWidthColour(cx - a, cy, cx + a, cy, 2 * px, c.white, c.white);
        draw.lineWidthColour(cx, cy - a, cx, cy + a, 2 * px, c.white, c.white);
        draw.circleColour(cx, cy, a * 0.6, c.white, c.white, true);
      }
    }
    if (ed.tool === "select") {
      for (const e of ed.sel) { if (!scene.instOf(e)) continue; const b = boxOf(e); outline(b, 4 * px, c.black, 0.35); outline(b, 2 * px, c.white, 0.95); }
      // le gemelle della scelta, che seguono ogni modifica: un riquadro sottile
      if (sym !== "none" && !ed.move) for (const t of scene.withTwins(selected(), sym)) if (!ed.sel.has(t)) outline(boxOf(t), 1.5 * px, c.white, 0.6);
      if (ed.over && !ed.sel.has(ed.over)) outline(boxOf(ed.over), 1.5 * px, c.white, 0.7);
      if (ed.box) {
        const b = [Math.min(ed.box.x0, ed.box.x1), Math.min(ed.box.y0, ed.box.y1), Math.max(ed.box.x0, ed.box.x1), Math.max(ed.box.y0, ed.box.y1)];
        draw.setColour(c.white); draw.setAlpha(0.15); draw.rectangle(b[0], b[1], b[2], b[3]);
        outline(b, 1.5 * px, c.white, 0.9);
      }
    }
    // [§9.187] la polilinea: i punti delle linee, la linea scelta, quella che
    // si disegna (una fascia larga quanto la linea, col tratto fino al
    // puntatore) e il punto trascinato; con la simmetria anche a specchio
    if (ed.tool === "line") {
      // [§9.204, richiesta dell'autore] la fascia come la disegna il gioco
      // (rivers.js riverGeometry, senza la larghezza che varia): i punti
      // smussati, la larghezza sul terreno steso e poi schiacciata in
      // verticale (ISO: un fiume orizzontale e' alto 0,62 volte la sua
      // larghezza); piena, una tinta uniforme (prima tratti dritti
      // sovrapposti, piu' scuri sui giunti), coi bordi; uguale per fiumi,
      // strade e sentieri, ognuno col suo colore
      const band = (pts, kind, w0, w1, a) => {
        if (pts.length < 2) return;
        const { L, R } = riverGeometry({ pts, width: w0, widthEnd: w1, plain: true }), tint = LINE_TINT[kind];
        draw.setAlpha(a);
        for (let k = 1; k < L.length; k++) {
          const l0 = L[k - 1], l1 = L[k], r0 = R[k - 1], r1 = R[k];
          draw.triangleColour(l0.x, l0.y, l1.x, l1.y, r1.x, r1.y, tint, tint, tint, false);
          draw.triangleColour(l0.x, l0.y, r1.x, r1.y, r0.x, r0.y, tint, tint, tint, false);
        }
        draw.setAlpha(Math.min(1, a * 2.2));
        for (const E of [L, R]) for (let k = 1; k < E.length; k++) draw.lineWidthColour(E[k - 1].x, E[k - 1].y, E[k].x, E[k].y, 2 * px, tint, tint);
        for (const k of [0, L.length - 1]) draw.lineWidthColour(L[k].x, L[k].y, R[k].x, R[k].y, 2 * px, tint, tint);
      };
      const dots = (pts, r, col, a) => { draw.setAlpha(a); for (const [x, y] of pts) draw.circleColour(x, y, r * px, col, col, false); };
      for (const key of ["rivers", "roads"]) for (const e of scene.map[key] || []) dots(e.pts, 4, c.white, 0.55);
      if (ed.lsel) {
        const { key, e, vi } = ed.lsel;
        for (const f of lineAndTwin(key, e)) {
          draw.setAlpha(0.9);
          for (let k = 1; k < f.pts.length; k++) draw.lineWidthColour(f.pts[k - 1][0], f.pts[k - 1][1], f.pts[k][0], f.pts[k][1], 2 * px, c.white, c.white);
          dots(f.pts, 6, c.white, 0.95);
          if (vi !== null && f === e) dots([f.pts[vi]], 4, DARK, 1);
        }
      }
      if (ed.ldrag && ed.ldrag.cur) {
        const D = ed.ldrag, pts = D.e.pts.map((q) => q.slice());
        pts[D.vi] = D.cur;
        band(pts, lineKind(D.key, D.e), D.e.width, D.e.widthEnd ?? D.e.width, 0.4);
        dots([D.cur], 6, c.white, 1);
      }
      if (ed.drawing) {
        const d = ed.drawing, pts = [...d.pts], [gx, gy] = view.toRoom(input.x, input.y);
        if (input.inside) pts.push([gx, gy]);
        const all = symOn() ? [pts, mirrorPts(pts)] : [pts];
        for (const q of all) { band(q, d.kind, lineW(d.kind), lineWE(d.kind), 0.4); dots(q.slice(0, d.pts.length), 6, c.white, 0.95); }
      }
    }
    // [§9.214] la montagna: le cime di tutte (pallini), la scelta coi suoi
    // punti (e la gemella), quella che si disegna (la cresta, la base, e
    // l'anteprima della montagna, a facce grigie, con la gemella), il punto
    // trascinato (l'anteprima della montagna cambiata)
    if (ed.tool === "mountain") {
      const dots = (pts, rad, col, a) => { draw.setAlpha(a); for (const [x, y] of pts) draw.circleColour(x, y, rad * px, col, col, false); };
      const path = (pts, w, col, a, closed = false) => {
        draw.setAlpha(a);
        for (let k = 1; k < pts.length; k++) draw.lineWidthColour(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], w * px, col, col);
        if (closed && pts.length > 2) draw.lineWidthColour(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], w * px, col, col);
      };
      // una montagna in anteprima: le facce grigie (la loro luce), l'inchiostro
      const ghost = (g, a) => {
        for (const Lr of g.layers) {
          if (Lr.face) {
            const v = Math.round(0xc8 * Lr.shade), col = v | (v << 8) | (v << 16), T = Lr.tris;
            draw.setAlpha(a);
            for (let i = 0; i < T.length; i += 6) draw.triangleColour(T[i], T[i + 1], T[i + 2], T[i + 3], T[i + 4], T[i + 5], col, col, col, false);
          } else {
            draw.setAlpha(Math.min(1, a * 1.3));
            const P = Lr.ink;
            for (let k = 1; k < P.length; k++) draw.lineWidthColour(P[k - 1].x, P[k - 1].y, P[k].x, P[k].y, Math.max(1, P[k].ink), 0x1c1c1c, 0x1c1c1c);
          }
        }
      };
      for (const g of scene.world.mountains || []) dots(g.tops.map((t) => [t.x, t.y]), 4, c.white, 0.55);
      if (ed.msel && !ed.mdraw) {
        for (const f of mAndTwin(ed.msel.e)) {
          const g = geoOf(f), main = f === ed.msel.e;
          path(g.base, main ? 2 : 1.5, c.white, main ? 0.8 : 0.5, true);
          path(g.crest, main ? 2.5 : 1.5, c.white, main ? 0.9 : 0.5);
          if (main) { dots(g.tops.map((t) => [t.x, t.y]), 7, c.white, 0.95); const b = baseShown(f); if (b) dots(b, 5, 0x40b0e8, 0.95); } // (la base: ambra, BGR)
          // [§9.215] la cima scelta: scura col bordo bianco (e la gemella)
          const pk = ed.msel.peak;
          if (pk !== undefined && pk !== null && g.tops[pk]) { dots([[g.tops[pk].x, g.tops[pk].y]], main ? 9 : 6, c.white, 1); dots([[g.tops[pk].x, g.tops[pk].y]], main ? 6 : 4, DARK, 1); }
        }
      }
      if (ed.mdrag && ed.mdrag.cur) {
        const D = ed.mdrag, e = D.e, m = JSON.parse(JSON.stringify(e));
        if (D.kind === "crest") m.crest[D.k] = crestStore(e, D.cur, D.h);
        else { const b = baseShown(e).map((q) => q.slice()); b[D.k] = D.cur; m.base = e.mirrored ? b.map((q) => mm(e, q)) : b; }
        ghost(mGeo(m), 0.55);
        dots([D.cur], 7, c.white, 1);
      }
      if (ed.mdraw) {
        const d = ed.mdraw, [gx, gy] = view.toRoom(input.x, input.y);
        if (d.edit) {
          const g = geoOf(d.edit);
          path(g.crest, 2.5, c.white, 0.9);
        } else if (d.crest.length) {
          // l'anteprima: la cresta fatta fin qui, con la base disegnata (da 3
          // punti) o quella automatica; con la simmetria anche la gemella
          const e = { crest: d.crest, height: mtnVal("height"), width: mtnVal("width"), rough: mtnVal("rough"), detail: mtnVal("detail"), seed: d.seed };
          if (d.step === "base" && d.base.length >= 3 && !baseProblem(d.base, d.crest.map(([x, y]) => [x, y, e.height * 0.9]), e.height * 0.9)) e.base = d.base;
          for (const m of mPair(e)) ghost(mGeo(m), d.step === "crest" ? 0.35 : 0.5);
          const cr = d.step === "crest" && input.inside ? [...d.crest, [gx, gy]] : d.crest;
          path(cr, 3, c.white, 0.95);
          dots(d.crest, 6, c.white, 0.95);
          // e la cresta della gemella (le cime specchiate sul terreno)
          if (symOn()) {
            const H = e.height, tw = cr.map(([x, y]) => { const q = mirrorPoint(symMode(), map.width, map.height, x, y + H); return [q[0], q[1] - H]; });
            path(tw, 2, c.white, 0.6);
          }
        }
        if (d.step === "base") {
          const b = input.inside ? [...d.base, [gx, gy]] : d.base;
          path(b, 2.5, 0x40b0e8, 0.95, b.length > 2);
          dots(d.base, 5, 0x40b0e8, 0.95);
          if (symOn()) path(b.map(([x, y]) => mirrorPoint(symMode(), map.width, map.height, x, y)), 1.5, 0x40b0e8, 0.6, b.length > 2);
        }
      }
    }
    // [§9.185] il pennello: la pennellata di texture in corso e il cerchio
    // sotto il puntatore (col gemello, se c'e' la simmetria)
    if (ed.tool === "brush") {
      const r = brushR(), ry = brushRY(), st = ed.stroke, tint = BRUSH_TINT[st ? st.kind : ed.brush.kind];
      if (st && st.dabs.length) {
        const all = symOn() ? [...st.dabs, ...st.dabs.map(([x, y]) => twinPoint(x, y))] : st.dabs;
        draw.setAlpha(0.45);
        for (const [x, y] of all) draw.ellipseColour(x - r, y - ry, x + r, y + ry, tint, tint, false);
      }
      if (input.inside && (st || !hitTest(layoutNow(), input.x, input.y))) {
        const [bx, by] = view.toRoom(input.x, input.y), spots = [[bx, by]];
        if (symOn()) spots.push(twinPoint(bx, by));
        for (const [x, y] of spots) {
          const erase = st ? st.erase : input.mouseDown[1], col = erase ? 0x4040ff : c.white;
          draw.setAlpha(0.8);
          for (let k = 0; k < 48; k++) { // il bordo a tratti, 2 px a schermo (l'ovale, §9.186)
            const a0 = (k / 48) * Math.PI * 2, a1 = ((k + 0.5) / 48) * Math.PI * 2;
            draw.lineWidthColour(x + dcos(a0) * r, y + dsin(a0) * ry, x + dcos(a1) * r, y + dsin(a1) * ry, 2 * px, col, col);
          }
        }
      }
    }
    // [§9.194] la gomma: l'ovale sotto il puntatore (col gemello), rosso
    if (ed.tool === "erase" && input.inside && (ed.erasing || !hitTest(layoutNow(), input.x, input.y))) {
      const r = eraseR(), ry = r * ISO, [bx, by] = view.toRoom(input.x, input.y), spots = [[bx, by]];
      if (symOn()) spots.push(twinPoint(bx, by));
      for (const [x, y] of spots) {
        if (ed.erasing) { draw.setAlpha(0.18); draw.ellipseColour(x - r, y - ry, x + r, y + ry, 0x4040ff, 0x4040ff, false); }
        draw.setAlpha(0.85);
        for (let k = 0; k < 48; k++) {
          const a0 = (k / 48) * Math.PI * 2, a1 = ((k + 0.5) / 48) * Math.PI * 2;
          draw.lineWidthColour(x + dcos(a0) * r, y + dsin(a0) * ry, x + dcos(a1) * r, y + dsin(a1) * ry, 2 * px, 0x4040ff, 0x4040ff);
        }
      }
    }
    // [§9.194] le mura con "Inserisci": i "+" liberi e i pulsanti muro/porta
    // (a scala di schermo); prolungando, il tratto fantasma verso il puntatore
    const WB = ed.tool === "insert" ? wallButtons() : [];
    for (const b of WB) {
      if (ed.wall && b.p !== ed.wall.p) continue;
      const on = ed.wallHover === b || (ed.wall && b.p === ed.wall.p), R = WALL_BTN * px;
      if (b.kind === "plus") {
        drawSprite(r, assets, "ico_muraplus", 0, b.x, b.y, (2 * R) / 65, (2 * R) / 65, 0, c.white, on ? 1 : 0.75);
      } else {
        draw.setAlpha(on ? 0.95 : 0.7);
        draw.circleColour(b.x, b.y, R, c.white, c.white, false);
        const icon = b.e.object.startsWith("porta") ? "ico_mura" : "ico_gate";
        drawSprite(r, assets, icon, 0, b.x, b.y, (1.3 * R) / 65, (1.3 * R) / 65, 0, c.white, 1);
      }
    }
    if (ed.wall && input.inside) {
      const [gx, gy] = view.toRoom(input.x, input.y), list = wallPieces(gx, gy);
      for (const e of list) {
        const spr = sideLook(objects, e) || objects[e.object].sprite;
        drawSprite(r, assets, spr, 0, e.x, e.y, 1, 1, 0, inMap(e.x, e.y) ? c.white : 0x4040ff, e === list[0] ? 0.6 : 0.4);
      }
    }
    if (ed.tool === "insert" && ed.pick && !ed.wall && !ed.wallHover && input.inside && !hitTest(layoutNow(), input.x, input.y)) {
      const [gx, gy] = view.toRoom(input.x, input.y), st = pickedStyle(), o = objects[st.object];
      // [§9.184] con la simmetria anche il fantasma della gemella ([§9.191]
      // dell'altro schieramento: col suo sprite)
      const list = toPlace(gx, gy), col = inMap(gx, gy) && canStart(list) ? c.white : 0x4040ff;
      for (const e of list) {
        const spr = sideLook(objects, e) || st.sprite || (o && o.sprite), k = isStart(e) ? FLAG_SCALE : 1; // §9.196: la bandierina
        if (spr) drawSprite(r, assets, spr, 0, e.x, e.y, k, k, 0, col, e === list[0] ? 0.6 : 0.4);
        if (spr && e.object === FAKE && spr !== "alb1_F") fakeMark(draw, e.x, e.y, 1, e === list[0] ? 0.6 : 0.4); // §9.203
        if (!spr && FOG_OBJECTS.includes(e.object)) fogLook(draw, e.object, e.x, e.y, e === list[0] ? 0.7 : 0.45, 1, fogOf(e)); // §9.205, §9.206
        if (spr && e.object === "campo") cropThumb(e.x, e.y, 1, e === list[0] ? 0.6 : 0.4); // §9.195
        else { draw.setAlpha(0.6); draw.circleColour(e.x, e.y, 10 * px, col, col, false); }
      }
    }
    draw.setAlpha(1);
    draw.setColour(c.white);
  };

  const drawUI = () => {
    const W = view.cssW, H = view.cssH, L = layoutNow(), map = scene.map;
    r.setProjection(0, 0, W, H);
    draw.reset();
    // il titolo, e la mappa: nome (o "Nuova mappa") e misure
    draw.setHalign("center"); draw.setValign("middle");
    // ([§9.187, richiesta dell'autore] niente titolo "Editor di mappe": grande
    // e ovvio; resta la riga della mappa. Il font non ha "·" ne' "×")
    draw.setFont("overdue");
    glowText(draw, W / 2, 36, (map.name || ed.label || tr("New map")) + (dirty() ? " *" : "") + "  -  " + map.width + " x " + map.height
      + (ed.file && ed.file.name ? "  -  " + ed.file.name : "")); // §9.188: il file collegato
    // la colonna: un vetro chiaro, i pulsanti tondi; lo strumento scelto scuro
    const [cx1, cy1, cx2, cy2] = L.col;
    draw.setAlpha(0.35);
    draw.roundrectColourExt(cx1, cy1, cx2, cy2, 40 * L.k, 40 * L.k, c.white, c.white, false);
    for (const b of L.buttons) {
      if (b.hidden) continue; // §9.196: fuori dalla parte che si vede
      const on = b.kind === "tool" && ed.tool === b.key, hov = ed.hover && ed.hover.key === b.key;
      const off = b.kind === "edit" && !editEnabled(b.key); // §9.195: niente da annullare, copiare, incollare
      draw.setAlpha(on ? 0.85 : off ? 0.4 : hov ? 0.99 : 0.69);
      draw.circleColour(b.x, b.y, b.r, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setAlpha(on ? 1 : off ? 0.3 : 0.75);
      drawIcon(draw, b.key, b.x, b.y, (b.r / 28) * 0.95, on ? c.white : c.black);
    }
    // fra gli strumenti, i comandi (§9.195) e le azioni, una lineetta
    for (const at of [TOOLS.length, TOOLS.length + EDITS.length]) {
      const last = L.buttons[at - 1], next = L.buttons[at], ym = (last.y + last.r + next.y - next.r) / 2;
      if (last.hidden && next.hidden) continue;
      if (L.up && (ym < L.up[1] + L.up[2] + 6 || ym > L.down[1] - L.down[2] - 6)) continue;
      draw.setAlpha(0.35);
      draw.lineWidthColour(cx1 + 16 * L.k, ym, cx2 - 16 * L.k, ym, 2, c.black, c.black);
    }
    // [§9.196] le frecce della colonna che scorre (spente in cima e in fondo)
    // [§9.203, richiesta dell'autore] le stesse della schermata della
    // schermaglia (menu.js arrow: ico_sk_freccia, il disegno dell'autore,
    // della stessa misura e con le stesse trasparenze), girate in su e in
    // giu', senza il cerchio intorno
    for (const [A, dir, can] of [[L.up, -1, L.scroll > 0], [L.down, 1, L.scroll < L.maxScroll]]) {
      if (!A) continue;
      const [ax, ay] = A, hov = ed.hover && ed.hover.kind === "colscroll" && ed.hover.dir === dir;
      draw.spriteExt("ico_sk_freccia", 0, ax, ay, COL_ARROW_SCALE, COL_ARROW_SCALE, dir * 90, c.white, !can ? 0.15 : hov ? 0.95 : 0.55);
    }
    draw.setAlpha(1);
    // il cerchio "Indietro" (come nelle schermate del menu, §9.158)
    const [bx, by, br] = L.back;
    draw.setAlpha(ed.hover && ed.hover.kind === "back" ? 0.99 : 0.69);
    draw.circleColour(bx, by, br, c.white, c.white, false);
    draw.setAlpha(1);
    draw.spriteExt("ico_indietro", 0, bx, by, 0.6, 0.6, 0, c.white, 1);
    // il riquadro dello strumento scelto
    drawPanel(L.panel);
    // [§9.206] sopra, le impostazioni della nebbia
    const FT = fogTarget();
    if (FT) {
      const FL = fogLayout(L.panel, FT.object);
      draw.setAlpha(0.69);
      draw.roundrectColourExt(FL.box[0], FL.box[1], FL.box[2], FL.box[3], 40, 40, c.white, c.white, false);
      draw.setValign("middle");
      for (const G of FL.groups) pmGroup(G, tr(FOG_LABEL[G.key]), fogValue(FT.object, G.key, FT.values[G.key]), G.key, ed.fogHover);
      draw.setAlpha(1); draw.setColour(c.white);
    }
    // [§9.220] il nome dell'icona della larghezza (sopra l'icona)
    if (ed.iconTip && !ed.open && !ed.confirm && !ed.dom) tooltip(ed.iconTip.x - 6, ed.iconTip.y - 40, tr(ed.iconTip.text));
    // [§9.222] e quello delle modalita' della simmetria e dei pulsanti della montagna
    if (!ed.open && !ed.confirm && !ed.dom && SYM_TOOLS.has(ed.tool) && ed.symHover) {
      const q = symLayout(L.panel).opts.find((o) => o.mode === ed.symHover);
      if (q) tooltip(q.x1, q.y1 - 26, tr(SYM_NAMES[q.mode]));
    }
    if (!ed.open && !ed.confirm && !ed.dom && ed.diceHover) { const D = diceLayout(L.panel); tooltip(D[0] - 60, D[1] - 26, tr(ed.dice ? "Random style: on" : "Random style: off")); } // §9.227
    if (!ed.open && !ed.confirm && !ed.dom && ed.tool === "mountain" && (ed.palHover === "seed" || ed.palHover === "auto")) {
      const R = mountainLayout(L.panel)[ed.palHover];
      tooltip(R[0], R[1] - 26, tr(ed.palHover === "seed" ? "New variant" : "Automatic base"));
    }
    // [§9.216] sopra, le particelle dell'erba e la loro densita'
    if (ed.tool === "brush" && ed.brush.kind === "grass") {
      const ML = meadowLayout(L.panel);
      draw.setAlpha(0.69);
      draw.roundrectColourExt(ML.box[0], ML.box[1], ML.box[2], ML.box[3], 40, 40, c.white, c.white, false);
      draw.setValign("middle"); draw.setHalign("left"); draw.setFont("overdue");
      draw.setColour(c.black); draw.setAlpha(0.55);
      draw.text(ML.title[0], ML.title[1], tr(MEADOW_TITLE));
      // ([§9.218] al posto del nome, il ciuffo della particella; il nome col puntatore sopra)
      for (const G of ML.groups) {
        pmGroup(G, "", String(MEADOW_STEPS[ed.brush.mix[G.key]]), G.key, ed.mixHover);
        drawTuft(G.key, G.icon[0], G.icon[1], !MEADOW_STEPS[ed.brush.mix[G.key]]);
      }
      draw.setAlpha(1); draw.setColour(c.white);
      const TG = ed.mixTip && ML.groups.find((G) => G.key === ed.mixTip);
      if (TG) tooltip(TG.tip[0] - 6, TG.tip[1] - 26, tr(MEADOW_LABEL[TG.key])); // (sopra l'icona)
    }
    // il suggerimento del pulsante sotto il puntatore, a destra della colonna
    if (ed.hover && ed.hover.kind !== "back" && ed.hover.kind !== "colscroll" && !ed.open && !ed.confirm && !ed.dom) tooltip(cx2 + 14, ed.hover.y, tr(LABEL[ed.hover.key]));
    if (ed.open) drawOpen(W, H);
    if (ed.confirm) drawConfirm(W, H);
    draw.setAlpha(1);
  };

  const drawPanel = (panel) => {
    const [x1, y1, x2, y2] = panel, map = scene.map;
    draw.setAlpha(0.69);
    draw.roundrectColourExt(x1, y1, x2, y2, 40, 40, c.white, c.white, false);
    draw.setColour(c.black);
    draw.setValign("middle");
    draw.setHalign("left");
    draw.setFont("GUI_1");
    draw.setAlpha(0.8);
    draw.text(x1 + 26, y1 + 30, tr(LABEL[ed.tool]));
    // a destra: col puntatore sulla mappa le sue coordinate, poi lo stato
    // dello strumento ("Prossimamente" se non c'e' ancora)
    draw.setHalign("right");
    draw.setFont("overdue");
    draw.setAlpha(0.55);
    const [mx, my] = view.toRoom(input.x, input.y);
    const onMap = input.inside && !ed.open && !ed.confirm && !hitTest(layoutNow(), input.x, input.y)
      && mx >= 0 && my >= 0 && mx <= map.width && my <= map.height;
    const state = !READY.has(ed.tool) ? tr("Coming soon")
      : ed.tool === "brush" ? tr("Left: paint. Right: erase.")
      : ed.tool === "erase" ? tr("Left: erase. Shift + wheel: width.") // §9.194
      : ed.tool === "insert" && ed.wall ? tr("Move the pointer: straight or around the corner. Click: place. Right click: cancel.")
      : ed.tool === "line" ? tr(ed.drawing ? "Click: add a point. Right click or Enter: finish. Esc: cancel."
        : ed.lsel ? "Drag the points. Double click: new point. Del: delete the line. Backspace: delete the point."
        : "Click: new line. Click on a line: select it.")
      : ed.tool === "mountain" ? tr(ed.mdraw ? MTN_HINTS[ed.mdraw.step] : ed.msel && ed.msel.peak != null ? MTN_HINTS.peak : ed.msel ? MTN_HINTS.sel : MTN_HINTS.idle, // §9.214, §9.215
                                   ed.msel && ed.msel.peak != null ? { n: ed.msel.peak + 1 } : undefined)
      : ed.tool === "select" ? (ed.sel.size ? tr("{n} selected", { n: ed.sel.size }) : "")
      : ed.pick ? (pickedItem().side && pickedItem().styles[0].sprite // §9.203: la casa
        ? tr(HOME_HINT[pickedItem().side], { i: ed.style[ed.pick.cat][ed.pick.i] + 1, n: pickedItem().styles.length }) + "     "
        : pickedItem().side && pickedItem().styles.length > 1 ? tr(WALL_HINT[pickedItem().side]) + "     " // §9.194: le mura
        : pickedItem().side ? tr(SIDE_HINT[pickedItem().side]) + "     " // §9.193
        : pickedItem().styles.length > 1 ? tr("S: style {i}/{n}", { i: ed.style[ed.pick.cat][ed.pick.i] + 1, n: pickedItem().styles.length }) + "     " : "")
        + tr("Click: place. Right click: stop.") : tr("Choose an object");
    // (le coordinate solo se c'e' posto: i comandi della polilinea sono lunghi;
    // [§9.187] se non stanno accanto al titolo, rimpiccioliti)
    const right = (onMap && state.length < 48 ? `x ${Math.round(mx)}   y ${Math.round(my)}     ` : "") + state;
    draw.setFont("GUI_1");
    const room = x2 - x1 - 52 - draw.stringWidth(tr(LABEL[ed.tool])) - 30;
    draw.setFont("overdue");
    const wide = draw.stringWidth(right), k = wide > room ? Math.max(0.55, room / wide) : 1;
    if (k < 1) draw.textTransformed(x2 - 26, y1 + 30, right, k); else draw.text(x2 - 26, y1 + 30, right);
    draw.setAlpha(0.3);
    draw.lineWidthColour(x1 + 20, y1 + 54, x2 - 20, y1 + 54, 2, c.black, c.black);
    if (SYM_TOOLS.has(ed.tool)) drawSymRow(panel); // §9.186
    if (ed.tool === "insert") { // [§9.227] il dado: scuro se acceso
      const D = diceLayout(panel), on = ed.dice;
      draw.setAlpha(on ? 0.85 : ed.diceHover ? 0.9 : 0.45);
      draw.roundrectColourExt(D[0], D[1], D[2], D[3], 26, 26, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setAlpha(1);
      buttonIcon("seed", (D[0] + D[2]) / 2, (D[1] + D[3]) / 2, on ? c.white : DARK);
    }
    if (ed.tool === "insert") { drawPalette(panel); draw.setColour(c.white); return; }
    if (ed.tool === "brush") { drawBrushPanel(panel); draw.setColour(c.white); return; }
    if (ed.tool === "erase") { pmGroup(brushLayout(panel).width, WIDTH_ICON, BRUSH_WIDTHS[ed.erase.w] + " px", "w"); draw.setAlpha(1); draw.setColour(c.white); return; } // §9.194
    if (ed.tool === "line") { drawLinePanel(panel); draw.setColour(c.white); return; }
    if (ed.tool === "mountain") { drawMountainPanel(panel); draw.setColour(c.white); return; } // §9.214
    draw.setHalign("left");
    draw.setValign("top");
    draw.setAlpha(0.8);
    draw.textExt(x1 + 26, y1 + 66, tr(ed.tool === "select" ? SELECT_HINTS : DESC[ed.tool]), 28, x2 - x1 - 52);
    draw.setAlpha(0.5);
    draw.setValign("bottom");
    draw.text(x1 + 26, y2 - 14, tr(HELP));
    draw.setColour(c.white);
  };

  // [§9.182] la tavolozza di "Inserisci": le schede e le caselle
  const drawPalette = (panel) => {
    const P = paletteNow(panel);
    draw.setFont("overdue");
    draw.setHalign("center");
    draw.setValign("middle");
    for (const q of P.tabs) {
      const on = q.k === ed.cat, hov = ed.palHover === q;
      draw.setAlpha(on ? 0.85 : hov ? 0.9 : 0.45);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 26, 26, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setColour(on ? c.white : c.black);
      draw.setAlpha(on ? 1 : 0.8);
      // [§9.193] otto schede: la scritta rimpicciolita se non ci sta
      const label = tr(CATALOG[q.k].label), lw = draw.stringWidth(label), room = q.x2 - q.x1 - 12;
      if (lw > room) draw.textTransformed((q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2 + 1, label, room / lw);
      else draw.text((q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2 + 1, label);
    }
    if (catalog !== "ready") { draw.setColour(c.black); draw.setAlpha(0.6); draw.text((P.strip[0] + P.strip[2]) / 2, (P.strip[1] + P.strip[3]) / 2, t("loading")); return; }
    // [§9.195] l'interruttore rosso / blu (Unita', Edifici): la parte scelta piena
    if (P.side) {
      const [bx1, by1, bx2, by2] = P.side.box;
      draw.setAlpha(ed.palHover === "side" ? 0.95 : 0.75);
      draw.roundrectColourExt(bx1, by1, bx2, by2, 16, 16, c.white, c.white, false);
      for (const k of ["red", "blue"]) {
        const [sx, sy, sr] = P.side[k], on = ed.sideFilter === k, col = SIDE_COLOUR[k];
        draw.setAlpha(on ? 1 : 0.3);
        draw.circleColour(sx, sy, on ? sr : sr - 3, col, col, false);
      }
    }
    for (const q of P.cells) {
      const on = !!ed.pick && ed.pick.cat === ed.cat && ed.pick.i === q.i, hov = ed.palHover === q;
      draw.setAlpha(on ? 0.85 : hov ? 0.95 : 0.55);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 18, 18, on ? DARK : c.white, on ? DARK : c.white, false);
      thumb(styleOfCell(ed.cat, q.i), (q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2, CELL - 10);
      // [§9.191] lo schieramento: il pallino del suo colore, in alto a sinistra
      const side = ITEMS[ed.cat][q.i].side;
      if (side) {
        const col = SIDE_COLOUR[side];
        draw.setAlpha(1);
        draw.circleColour(q.x1 + 13, q.y1 + 13, 8, c.white, c.white, false);
        draw.circleColour(q.x1 + 13, q.y1 + 13, 6, col, col, false);
      }
      // [§9.183] piu' stili: quale e quanti, in basso a destra
      const n = ITEMS[ed.cat][q.i].styles.length;
      if (n > 1) {
        draw.setHalign("right"); draw.setValign("bottom");
        draw.setColour(on ? c.white : c.black); draw.setAlpha(0.85);
        draw.textTransformed(q.x2 - 4, q.y2 - 1, (ed.style[ed.cat][q.i] + 1) + "/" + n, 0.55);
        draw.setHalign("center"); draw.setValign("middle");
      }
    }
    for (const [R, dir] of [[P.prev, -1], [P.next, 1]]) {
      if (!R) continue;
      const cx = (R[0] + R[2]) / 2, cy = (R[1] + R[3]) / 2, hov = ed.palHover === (dir < 0 ? "prev" : "next");
      draw.setAlpha(hov ? 0.95 : 0.6);
      draw.triangleColour(cx - 7 * dir, cy - 12, cx + 7 * dir, cy, cx - 7 * dir, cy + 12, c.black, c.black, c.black, false);
    }
    draw.setAlpha(1);
  };

  // [§9.186] la riga della simmetria dello strumento: l'etichetta e le
  // quattro modalita' (la scelta scura)
  const drawSymRow = (panel) => {
    const S = symLayout(panel), cur = symMode();
    draw.setFont("overdue");
    draw.setValign("middle");
    draw.setHalign("left");
    draw.setColour(c.black); draw.setAlpha(0.8);
    labelIcon("sym", S.label[0], S.label[1]); // (§9.221: al posto della parola)
    draw.setHalign("center");
    for (const q of S.opts) {
      const on = q.mode === cur, hov = ed.symHover === q.mode;
      draw.setAlpha(on ? 0.85 : hov ? 0.9 : 0.45);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 26, 26, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setAlpha(on ? 1 : 0.8);
      symIcon(q.mode, (q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2, on ? c.white : DARK); // (§9.222: lo schema al posto del nome)
    }
    draw.setColour(c.black);
    draw.setAlpha(1);
  };

  // [§9.220, richiesta dell'autore: "al posto della parola larghezza metti
  // un'icona di due frecce in direzioni opposte"] la riga con le due punte;
  // la larghezza finale della polilinea: la stessa riga che finisce contro
  // una sbarretta (l'estremita' della linea)
  const WIDTH_ICON = { icon: "width" }, END_ICON = { icon: "end" };
  // [§9.221, richiesta dell'autore: "fai lo stesso per simmetria e altezza"]
  // l'altezza: una freccia in verticale con due punte (la cima: col picco
  // accanto); la simmetria: due triangoli specchiati ai lati di un asse
  // tratteggiato
  const HEIGHT_ICON = { icon: "height" }, PEAK_ICON = { icon: "peak" };
  // [§9.221] l'asperita': una linea frastagliata (il contorno strappato)
  const ROUGH_ICON = { icon: "rough" }, DENSITY_ICON = { icon: "density" }, DETAIL_ICON = { icon: "detail" };
  // [§9.222] i pulsanti della montagna: un dado ("Nuova variante") e il
  // contorno a tratti con una scintilla ("Base automatica"); ink: il colore
  const buttonIcon = (q, cx, cy, ink) => {
    if (q === "seed") {
      draw.roundrectColourExt(cx - 11, cy - 11, cx + 11, cy + 11, 8, 8, ink, ink, true);
      for (const [dx, dy] of [[-5, -5], [0, 0], [5, 5]]) draw.circleColour(cx + dx, cy + dy, 2.4, ink, ink, false);
      return;
    }
    const R = [[-16, 2], [-12, -7], [-3, -10], [6, -8], [13, -3], [14, 5], [7, 10], [-4, 9], [-12, 8]];
    for (let k = 0; k < R.length; k++) {
      const a = R[k], b = R[(k + 1) % R.length], mx2 = (a[0] + b[0]) / 2, my2 = (a[1] + b[1]) / 2;
      draw.lineWidthColour(cx + a[0] - 4, cy + a[1], cx + (a[0] + mx2) / 2 - 4, cy + (a[1] + my2) / 2, 2.5, ink, ink); // a tratti
    }
    const sx = cx + 15, sy = cy - 10; // la scintilla
    draw.lineWidthColour(sx - 5, sy, sx + 5, sy, 2, ink, ink); draw.lineWidthColour(sx, sy - 5, sx, sy + 5, 2, ink, ink);
  };
  // [§9.222] le modalita' della simmetria: la mappa (un riquadro), un
  // triangolo pieno e, dove va la gemella, il suo specchio vuoto, coll'asse
  const symIcon = (mode, cx, cy, ink) => {
    // ([§9.226] i simboli dell'autore, se ci sono)
    const name = "ico_ed_sym_" + mode, fr = assets.sprites[name] && assets.frame(name, 0);
    if (fr) { const k = 30 / Math.max(fr.s.width || 64, fr.s.height || 64); drawSprite(r, assets, name, 0, cx, cy, k, k, 0, ink, 0.95); return; } // (la tela intera: 30 px)
    draw.rectangleColour(cx - 22, cy - 12, cx + 22, cy + 12, ink, ink, ink, ink, true);
    const tri = (pts, full) => {
      if (full) { draw.triangleColour(cx + pts[0][0], cy + pts[0][1], cx + pts[1][0], cy + pts[1][1], cx + pts[2][0], cy + pts[2][1], ink, ink, ink, false); return; }
      for (let k = 0; k < 3; k++) { const a = pts[k], b = pts[(k + 1) % 3]; draw.lineWidthColour(cx + a[0], cy + a[1], cx + b[0], cy + b[1], 2, ink, ink); }
    };
    const T = [[-18, -4], [-8, -4], [-8, -11]]; // in alto a sinistra (staccato dagli assi)
    tri(T, true);
    const dash = (x1, y1, x2, y2) => { const n = 4; for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 0.5) / n; draw.lineWidthColour(cx + x1 + (x2 - x1) * t0, cy + y1 + (y2 - y1) * t0, cx + x1 + (x2 - x1) * t1, cy + y1 + (y2 - y1) * t1, 1.5, ink, ink); } };
    if (mode === "horizontal") { dash(0, -12, 0, 12); tri(T.map(([x, y]) => [-x, y]), false); }
    if (mode === "vertical") { dash(-22, 0, 22, 0); tri(T.map(([x, y]) => [x, -y]), false); }
    if (mode === "diagonal") { draw.circleColour(cx, cy, 2, ink, ink, false); tri(T.map(([x, y]) => [-x, -y]), false); }
  };
  const ROUGH_PTS = [[0, 4], [6, -5], [11, 3], [16, -8], [22, 2], [27, -3], [32, 7], [38, -6], [44, 3]];
  // [§9.225, richiesta dell'autore: "sostituire le icone che hai fatto tu con
  // icone un po' piu' professional"] le icone dell'autore (nuovi.json:
  // ico_ed_sym, _rough, _detail, _width, _height; bianche, tinte di scuro),
  // in un riquadro di w x h px col centro in (cx, cy); i disegni a linee di
  // prima restano se l'icona manca
  const ICON_SPRITE = { sym: "ico_ed_sym", rough: "ico_ed_rough", detail: "ico_ed_detail", width: "ico_ed_width", height: "ico_ed_height" };
  const iconSprite = (key, cx, cy, w, h, ink = DARK) => {
    const name = ICON_SPRITE[key], fr = name && assets.sprites[name] && assets.frame(name, 0);
    if (!fr) return false;
    const [, , fw, fh] = fr.f.trim, k = Math.min(w / fw, h / fh);
    drawSprite(r, assets, name, 0, cx, cy, k, k, 0, ink, 0.9);
    return true;
  };
  const labelIcon = (icon, x, y) => {
    if (icon === "end") { // la larghezza finale: la freccia contro la sbarretta (l'estremita' della linea)
      if (iconSprite("width", x + 18, y, 36, 22)) { draw.setAlpha(0.85); draw.lineWidthColour(x + 41, y - 11, x + 41, y + 11, 3, DARK, DARK); return; }
    } else if (icon === "peak") { // la cima: la freccia in su e in giu' e il picco
      if (iconSprite("height", x + 9, y, 18, 32) && iconSprite("detail", x + 36, y + 2, 28, 24)) return;
    } else if (iconSprite(icon, x + 23, y, 46, 30)) return;
    if (icon === "width" || icon === "end") { widthIcon(x, y, icon === "end"); return; }
    const ink = DARK;
    draw.setAlpha(0.85);
    if (icon === "height" || icon === "peak") {
      const cx = x + 10;
      draw.lineWidthColour(cx, y - 10, cx, y + 10, 3, ink, ink);
      draw.triangleColour(cx, y - 17, cx - 7, y - 7, cx + 7, y - 7, ink, ink, ink, false);
      draw.triangleColour(cx, y + 17, cx - 7, y + 7, cx + 7, y + 7, ink, ink, ink, false);
      if (icon === "peak") { // il picco: due falde e la base
        draw.lineWidthColour(x + 22, y + 15, x + 33, y - 13, 3, ink, ink);
        draw.lineWidthColour(x + 33, y - 13, x + 46, y + 15, 3, ink, ink);
        draw.lineWidthColour(x + 20, y + 15, x + 48, y + 15, 3, ink, ink);
      }
      return;
    }
    // [§9.222] la densita' del bosco: due alberelli con la freccia fra loro
    // (la distanza fra gli alberi); il dettaglio della montagna: un picco
    // con le sue linee dentro
    if (icon === "density") {
      const tree = (tx) => { draw.lineWidthColour(tx, y + 14, tx, y + 4, 3, ink, ink); draw.circleColour(tx, y - 4, 8, ink, ink, false); };
      tree(x + 6); tree(x + 52);
      draw.lineWidthColour(x + 22, y + 9, x + 36, y + 9, 2.5, ink, ink);
      draw.triangleColour(x + 17, y + 9, x + 24, y + 4, x + 24, y + 14, ink, ink, ink, false);
      draw.triangleColour(x + 41, y + 9, x + 34, y + 4, x + 34, y + 14, ink, ink, ink, false);
      return;
    }
    if (icon === "detail") {
      const P = [[x, y + 14], [x + 20, y - 15], [x + 46, y + 14]];
      draw.lineWidthColour(P[0][0], P[0][1], P[1][0], P[1][1], 3, ink, ink);
      draw.lineWidthColour(P[1][0], P[1][1], P[2][0], P[2][1], 3, ink, ink);
      draw.lineWidthColour(x - 2, y + 14, x + 48, y + 14, 3, ink, ink);
      for (const [a, b] of [[[x + 20, y - 15], [x + 14, y + 14]], [[x + 20, y - 15], [x + 27, y + 4]], [[x + 27, y + 4], [x + 36, y + 14]], [[x + 27, y + 4], [x + 25, y + 14]]]) draw.lineWidthColour(a[0], a[1], b[0], b[1], 2, ink, ink);
      return;
    }
    if (icon === "rough") {
      for (let k = 1; k < ROUGH_PTS.length; k++) draw.lineWidthColour(x + ROUGH_PTS[k - 1][0], y + ROUGH_PTS[k - 1][1], x + ROUGH_PTS[k][0], y + ROUGH_PTS[k][1], 3, ink, ink);
      return;
    }
    if (icon === "sym") {
      const ax = x + 23;
      for (let k = 0; k < 4; k++) draw.lineWidthColour(ax, y - 16 + k * 9, ax, y - 11 + k * 9, 2.5, ink, ink); // l'asse a tratti
      draw.triangleColour(x + 2, y + 10, x + 17, y + 10, x + 17, y - 12, ink, ink, ink, false); // pieno a sinistra
      draw.lineWidthColour(x + 44, y + 10, x + 29, y + 10, 2.5, ink, ink); // e il suo specchio, vuoto
      draw.lineWidthColour(x + 29, y + 10, x + 29, y - 12, 2.5, ink, ink);
      draw.lineWidthColour(x + 29, y - 12, x + 44, y + 10, 2.5, ink, ink);
    }
  };
  const widthIcon = (x, y, end = false) => {
    const ink = DARK, w = 44, x2 = x + w;
    draw.setAlpha(0.85);
    draw.lineWidthColour(x + 6, y, x2 - (end ? 12 : 6), y, 3, ink, ink);
    draw.triangleColour(x, y, x + 10, y - 7, x + 10, y + 7, ink, ink, ink, false);
    const tip = end ? x2 - 6 : x2;
    draw.triangleColour(tip, y, tip - 10, y - 7, tip - 10, y + 7, ink, ink, ink, false);
    if (end) draw.lineWidthColour(x2 - 1, y - 11, x2 - 1, y + 11, 3, ink, ink);
  };
  // le icone al posto delle parole nel riquadro dello strumento (il loro
  // nome nel suggerimento): larghezza, altezza, simmetria
  const widthGroups = (panel) => {
    const out = [];
    if (SYM_TOOLS.has(ed.tool)) out.push([{ label: symLayout(panel).label }, "Symmetry"]);
    if (ed.tool === "brush" || ed.tool === "erase") out.push([brushLayout(panel).width, "Width"]);
    if (ed.tool === "brush" && ed.brush.kind === "forest") out.push([brushLayout(panel).density, "Density"]); // §9.222
    if (ed.tool === "line") { const B = lineLayout(panel); out.push([B.width, "Width"], [B.end, "End width"]); }
    if (ed.tool === "mountain") {
      const B = mountainLayout(panel);
      out.push([B.width, "Width"], [B.height, ed.msel && ed.msel.peak != null ? "Peak height" : "Height"], [B.rough, "Roughness"], [B.detail, "Detail"]);
    }
    return out;
  };

  // un valore coi suoi "-" e "+" (pennello, polilinea)
  const pmGroup = (G, label, value, key, hover = ed.palHover) => { // (§9.206: hover, il "-" o "+" sotto il puntatore)
    draw.setFont("overdue");
    draw.setColour(c.black); draw.setAlpha(0.8);
    // ([§9.220] la larghezza: l'icona delle due frecce al posto della parola)
    if (label && label.icon) labelIcon(label.icon, G.label[0], G.label[1]);
    else { draw.setHalign("left"); draw.text(G.label[0], G.label[1], label); }
    draw.setHalign("center"); draw.text(G.value[0], G.value[1], value);
    for (const [C, sign] of [[G.minus, "-"], [G.plus, "+"]]) {
      const hov = hover === key + sign;
      draw.setAlpha(hov ? 0.95 : 0.6);
      draw.circleColour(C[0], C[1], C[2], DARK, DARK, false);
      draw.setAlpha(1);
      draw.lineWidthColour(C[0] - 7, C[1], C[0] + 7, C[1], 3, c.white, c.white);
      if (sign === "+") draw.lineWidthColour(C[0], C[1] - 7, C[0], C[1] + 7, 3, c.white, c.white);
    }
  };

  // [§9.187] il riquadro della polilinea: fiume, strada, sentiero; larghezza
  // e larghezza finale della linea scelta (o di quelle nuove)
  const drawLinePanel = (panel) => {
    const B = lineLayout(panel), sel = ed.lsel, kind = sel ? lineKind(sel.key, sel.e) : ed.line.kind;
    draw.setFont("overdue");
    draw.setHalign("center");
    draw.setValign("middle");
    for (const q of B.tabs) {
      const on = q.kind === kind, hov = ed.palHover === q;
      draw.setAlpha(on ? 0.85 : hov ? 0.9 : 0.45);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 26, 26, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setColour(on ? c.white : c.black);
      draw.setAlpha(on ? 1 : 0.8);
      draw.text((q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2 + 1, tr(LINE_LABEL[q.kind]));
    }
    const w = sel ? sel.e.width : lineW(kind), we = sel ? sel.e.widthEnd ?? sel.e.width : lineWE(kind);
    pmGroup(B.width, WIDTH_ICON, w + " px", "w");
    pmGroup(B.end, END_ICON, we === w ? tr("Same") : we + " px", "e");
    draw.setAlpha(1);
  };

  // [§9.214] il riquadro della montagna: altezza, larghezza, asperita',
  // dettaglio (della montagna scelta, o delle nuove), "Nuova variante" e
  // "Base automatica" (solo con una montagna scelta; la seconda se ha una
  // base disegnata)
  const drawMountainPanel = (panel) => {
    const B = mountainLayout(panel), e = ed.msel && ed.msel.e;
    for (const k of MTN_KEYS) {
      const v = e ? e[k] ?? MOUNTAIN_STEPS[k][ed.mtn[k]] : mtnVal(k);
      // ([§9.215] con una cima scelta, "Altezza" e' la sua: in % dell'altezza della montagna)
      const pk = e && ed.msel.peak != null && k === "height" ? ed.msel.peak : null;
      if (pk !== null) { pmGroup(B[k], PEAK_ICON, Math.round((e.peaks ? e.peaks[pk] : 1) * 100) + "%", k); continue; }
      pmGroup(B[k], k === "width" ? WIDTH_ICON : k === "height" ? HEIGHT_ICON : k === "rough" ? ROUGH_ICON : DETAIL_ICON, k === "width" && e && e.base ? "—" : mtnValue(k, v), k);
    }
    draw.setFont("overdue");
    draw.setHalign("center");
    draw.setValign("middle");
    for (const [q, label, ok] of [["seed", "New variant", !!e], ["auto", "Automatic base", !!(e && e.base)]]) {
      const R = B[q], hov = ed.palHover === q;
      draw.setAlpha(!ok ? 0.2 : hov ? 0.9 : 0.55);
      draw.roundrectColourExt(R[0], R[1], R[2], R[3], 30, 30, DARK, DARK, false);
      draw.setAlpha(ok ? 1 : 0.6);
      buttonIcon(q, (R[0] + R[2]) / 2, (R[1] + R[3]) / 2, c.white); // (§9.222: l'icona al posto del nome)
    }
    draw.setColour(c.black);
    draw.setAlpha(1);
  };

  // [§9.185] il riquadro del pennello: le schede (bosco e texture), larghezza
  // e densita' (solo per il bosco) coi loro "-" e "+"
  const drawBrushPanel = (panel) => {
    const B = brushLayout(panel), b = ed.brush;
    draw.setFont("overdue");
    draw.setHalign("center");
    draw.setValign("middle");
    for (const q of B.tabs) {
      const on = q.kind === b.kind, hov = ed.palHover === q;
      draw.setAlpha(on ? 0.85 : hov ? 0.9 : 0.45);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 26, 26, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setColour(on ? c.white : c.black);
      draw.setAlpha(on ? 1 : 0.8);
      draw.text((q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2 + 1, tr(q.kind === "forest" ? "Forest" : q.kind === "grass" ? "Bouquet" : BG_NAMES[q.kind])); // (§9.219: "Erba" era troppo simile a "Prato")
    }
    pmGroup(B.width, WIDTH_ICON, BRUSH_WIDTHS[b.w] + " px", "w");
    if (b.kind === "forest") pmGroup(B.density, DENSITY_ICON, (b.d + 1) + " / " + BRUSH_SPACING.length, "d");
    draw.setAlpha(1);
  };

  // la miniatura di uno stile ({ object, sprite? }), dentro un quadrato di
  // lato `size` (centro cx, cy)
  const natura = (name) => (assets.sprites[naturaSprite(name)] ? naturaSprite(name) : null);
  const thumb = (st, cx, cy, size) => {
    const name = st.object, o = objects[name], spr = sideLook(objects, st) || st.sprite || (o && (o.sprite || (o.choices && o.choices[0]))); // §9.191
    const b = spr && tightBounds(assets, spr, 0, 0);
    if (b) {
      const s = Math.min(size / (b[2] - b[0]), size / (b[3] - b[1]), 1);
      const ox = cx - ((b[0] + b[2]) / 2) * s, oy = cy - ((b[1] + b[3]) / 2) * s;
      drawSprite(r, assets, spr, 0, ox, oy, s, s, 0, c.white, 1);
      if (name === "campo") cropThumb(ox, oy, s); // §9.195: le spighe, come nel gioco
      if (name === FAKE && spr !== "alb1_F") fakeMark(draw, ox, oy, s); // §9.203: la F
      return;
    }
    // [§9.203, richiesta dell'autore] le macchie (particelle, senza sprite):
    // la loro foto (tools/19_natura.mjs: la macchia nell'editor, sfumata), al
    // posto del disegno di prima, che resta se la foto mancasse
    // ([§9.205] la nebbia: le sue nuvole, lo sprite senza il prato sotto)
    if (FOG_OBJECTS.includes(name)) { fogLook(draw, name, cx, cy, 1.6, (size * 1.15) / FOG_SPAN[name]); return; }
    const photo = natura(name), pb = photo && tightBounds(assets, photo, 0, 0);
    if (pb) {
      const s = Math.min((size * 1.2) / (pb[2] - pb[0]), (size * 1.2) / (pb[3] - pb[1]));
      drawSprite(r, assets, photo, 0, cx - ((pb[0] + pb[2]) / 2) * s, cy - ((pb[1] + pb[3]) / 2) * s, s, s, 0, c.white, 1);
      return;
    }
    // un prato coi suoi colori
    const tint = DECOR_TINT[name] || [0x3c7a46];
    draw.setAlpha(0.7);
    draw.ellipseColour(cx - size / 2, cy - size / 3, cx + size / 2, cy + size / 3, 0x5f9a72, 0x5f9a72, false);
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4, d = (k % 3 + 1) * size / 9, col = tint[k % tint.length];
      draw.setAlpha(0.95);
      draw.circleColour(cx + dcos(a) * d, cy + dsin(a) * d * 0.6, 3, col, col, false);
    }
  };

  // [§9.195] le file di spighe del campo in piccolo (effects.js cropRows: righe
  // ogni CROP px nel rombo largo 145 px, una spiga ogni ~11 px), senza caso
  const cropThumb = (ox, oy, s, alpha = 1) => {
    for (let dy = -84; dy <= 84; dy += 12) {
      const hw = 145 * (1 - Math.abs(dy) / 90) - 8;
      if (hw < 4) continue;
      for (let x = -hw; x < hw; x += 11) drawSprite(r, assets, "spiga", 0, ox + x * s, oy + dy * s, s * 0.85, s * 0.85, 0, 0x96e2ff, alpha); // (il giallo del grano, BGR)
    }
  };
  const tooltip = (x, y, str) => {
    draw.setFont("GUI_1");
    const w = draw.stringWidth(str) + 36;
    draw.setAlpha(0.92);
    draw.roundrectColourExt(x, y - 22, x + w, y + 22, 40, 40, c.white, c.white, false);
    draw.setColour(c.black);
    draw.setAlpha(0.8);
    draw.setHalign("left");
    draw.setValign("middle");
    draw.text(x + 18, y, str);
    draw.setColour(c.white);
  };

  const veil = (W, H) => { draw.setColour(c.black); draw.setAlpha(0.35); draw.rectangle(0, 0, W, H); };
  const button = (R, label, hov) => {
    draw.setAlpha(hov ? 0.99 : 0.69);
    draw.roundrectColourExt(R[0], R[1], R[2], R[3], R[3] - R[1], R[3] - R[1], c.white, c.white, false);
    draw.setColour(c.black);
    draw.setAlpha(0.75);
    draw.text((R[0] + R[2]) / 2, (R[1] + R[3]) / 2, label);
  };
  // "Apri mappa": un velo scuro; a sinistra le mappe salvate nel browser (col
  // cerchio per eliminarle), a destra le schermaglie come modelli, sotto
  // "Apri un file" (§9.184)
  const drawOpen = (W, H) => {
    const mine = ed.open.mine, O = openLayout(W, H, mine ? mine.length : 0, ed.open.scroll), hov = ed.open.hover;
    veil(W, H);
    draw.setHalign("center"); draw.setValign("middle");
    draw.setFont("gui_sblocco");
    glowText(draw, O.title[0], O.title[1], tr("Open map"));
    draw.setFont("GUI_1");
    glowText(draw, O.heads[0][0], O.heads[0][1], tr("Your maps"));
    glowText(draw, O.heads[1][0], O.heads[1][1], tr("Templates"));
    if (!mine || !mine.length) {
      draw.setFont("overdue");
      glowText(draw, O.heads[0][0], O.left[1] + 25, mine ? tr("No saved maps yet") : t("loading"));
      draw.setFont("GUI_1");
    }
    for (const q of O.mine) {
      const rec = mine[q.index], on = hov === q;
      button([q.x1, q.y1, q.x2, q.y2], rec.name || tr("New map"), on);
      const [dx, dy, dr] = q.del, dh = hov && hov.remove === q.index;
      draw.setAlpha(dh ? 0.9 : 0.35);
      draw.circleColour(dx, dy, dr, dh ? 0x3030c0 : DARK, dh ? 0x3030c0 : DARK, false);
      draw.setAlpha(1);
      draw.lineWidthColour(dx - 5, dy - 5, dx + 5, dy + 5, 2, c.white, c.white);
      draw.lineWidthColour(dx + 5, dy - 5, dx - 5, dy + 5, 2, c.white, c.white);
    }
    for (const q of O.rows) button([q.x1, q.y1, q.x2, q.y2], mapLabel(q.room), hov === q);
    button(O.file, tr("Open a file…"), hov === "file");
    draw.setColour(c.white);
  };
  const drawConfirm = (W, H) => {
    const B = ed.confirm.buttons, C = confirmLayout(W, H, B.length);
    veil(W, H);
    draw.setHalign("center"); draw.setValign("middle");
    draw.setFont("GUI_1");
    glowText(draw, C.text[0], C.text[1], tr(ed.confirm.text));
    B.forEach((b, k) => button(C.buttons[k], tr(b.label), ed.confirm.hover === k));
    draw.setColour(c.white);
  };

  let shown = false;
  // [§9.203, richiesta dell'autore] l'interfaccia di vetro, come nel gioco
  // (opzione "Glass interface", §7.14): sotto i pannelli bianchi la mappa
  // appena disegnata, sfocata (glass.js)
  const glassBg = glassBackdrop(r, canvas);
  const render = () => {
    if (!shown) { shown = true; requestAnimationFrame(() => { canvas.style.visibility = "visible"; }); }
    r.beginFrame(view, clear);
    drawMap();
    draw.setGlass(settings.glass ? glassBg() : null);
    drawUI();
    draw.setGlass(null);
    r.flush(); // (§9.197: il cursore e' quello del sistema, la freccina)
  };

  if (params.get("resume")) await busy(resume); // §9.188
  const loop = new Loop({ speed: 60, step, render });
  loop.fpsCap = settings.fpsCap;
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); loop.stop(); });
  canvas.addEventListener("webglcontextrestored", async () => { r.init(); await assets.reload(progress); loop.start(); });
  if (!params.has("nostart")) loop.start();
  // per le prove nel browser (game/test/browser/editor.mjs)
  window.__editor = { ready: true, ed, view, input, loop, get reads() { return input.reads || 0; }, // §9.199
                      layout: () => editorLayout(view.cssW, view.cssH, ed.colScroll),
                      openLayout: () => openLayout(view.cssW, view.cssH, ed.open && ed.open.mine ? ed.open.mine.length : 0, ed.open ? ed.open.scroll : 0),
                      confirmLayout: () => confirmLayout(view.cssW, view.cssH, ed.confirm ? ed.confirm.buttons.length : 2),
                      palette: () => paletteNow(editorLayout(view.cssW, view.cssH, ed.colScroll).panel),
                      get scene() { return scene; }, openTemplate, catalog: () => catalog, dirty, quickSave, openPanel, testMap, openSaved, // (§9.198: openSaved)
                      brushLayout: () => brushLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel),
                      symLayout: () => symLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel),
                      lineLayout: () => lineLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel), advance(n) { for (let k = 0; k < n; k++) step(); }, render,
                      mountainLayout: () => mountainLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel), // §9.214
                      diceLayout: () => diceLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel), pickedItem, // §9.227
                      catalogKeys: () => CATALOG.map((k) => k.key), itemKey: (cat, i) => ITEMS[cat][i].key,
                      meadowLayout: () => meadowLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel), // §9.216
                      // [§9.206] il riquadro della nebbia (null se non c'e')
                      fogLayout: () => { const F = fogTarget(); return F ? fogLayout(editorLayout(view.cssW, view.cssH, ed.colScroll).panel, F.object) : null; } };
}
