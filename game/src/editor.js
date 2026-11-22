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
import { SK_MAPS } from "./skirmish.js";
import { audio } from "./audio.js";
import { glowText } from "./menu.js";
import { dcos, dsin, dhypot } from "./dmath.js";
import { newMap, roomToScenario } from "./mapfile.js";
import { EditScene, CATALOG, START, STARTS, SYSTEM, groupsFor, tightBounds, paletteItems, stylesOf, catalogObjects } from "./editmap.js";

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
export const TOOLS = ["select", "line", "brush", "insert"];
export const ACTIONS = ["new", "open", "save", "test", "settings"];
export const LABEL = {
  select: "Move, copy and paste, mirror, delete",
  line: "Polyline: rivers, roads",
  brush: "Area brush: forests, textures",
  insert: "Insert: units, resources, buildings…",
  new: "New map",
  open: "Open map",
  save: "Save map",
  test: "Test map",
  settings: "Settings: CPU, description and map info",
};
export const DESC = {
  select: "Select objects with a click or a box and drag them to move them; copy and paste, mirror or delete the selection.",
  line: "Draw rivers and roads point by point, with their width; drag the points to change their course. Bridges go across rivers.",
  brush: "Paint forests and ground textures (city paving, stone, meadow) with a round brush; the eraser removes them.",
  insert: "Choose an object by category (units, buildings, resources, nature, city…) and place it on the map.",
};
export const HELP = "Arrows, middle button or Space + drag: move the view. Wheel: zoom. Esc: back to the menu.";
// [§9.182] i comandi degli strumenti che ci sono
export const SELECT_HINTS = "Click: select (Shift: add). Drag: move, or select with a box (Ctrl: always a box). Del: delete. M: mirror. S: style. "
  + "Ctrl+C, Ctrl+V: copy and paste. Ctrl+Z, Ctrl+Y: undo, redo.";
export const READY = new Set(["select", "insert"]); // gli strumenti che funzionano (gli altri: "Prossimamente")
export const EDITOR_TEXTS = ["Map editor", "Coming soon", "Open map", "This map could not be opened", HELP, SELECT_HINTS,
                             "Skirmish maps, as templates for a new map", "New map from {map}", "{n} selected",
                             "Click: place. Right click: stop.", "Choose an object", "S: style {i}/{n}", "A skirmish map has two starting positions.",
                             "The changes to this map will be lost.", "Continue", "Cancel",
                             ...Object.values(LABEL), ...Object.values(DESC), ...CATALOG.map((k) => k.label)];

// Misure della colonna (a scala 1) e del riquadro, in pixel CSS
const COL = { left: 20, top: 20, btn: 56, gap: 10, pad: 12, sep: 44 };
const PANEL = { h: 170, maxW: 980, margin: 30, bottom: 20 };
export const BACK_BTN = [50, 50, 30]; // dal bordo destro, dall'alto, raggio (come menu.js FULL_BTN)

// Dove sta tutto, per una finestra W x H: la colonna (col: x1, y1, x2, y2),
// i suoi pulsanti tondi ({kind, key, x, y, r}), il riquadro dello strumento
// (panel) e il cerchio "Indietro" (back: x, y, r). Con una finestra bassa
// la colonna si rimpicciolisce tutta (k) per starci.
export function editorLayout(W, H) {
  const n = TOOLS.length + ACTIONS.length;
  const full = 2 * COL.pad + n * COL.btn + (n - 2) * COL.gap + COL.sep;
  const k = Math.max(0.5, Math.min(1, (H - 2 * COL.top) / full));
  const b = COL.btn * k, gap = COL.gap * k, pad = COL.pad * k, sep = COL.sep * k;
  const x1 = COL.left, x2 = x1 + b + 2 * pad, y1 = COL.top;
  const buttons = [];
  let y = y1 + pad;
  for (const key of TOOLS) { buttons.push({ kind: "tool", key, x: (x1 + x2) / 2, y: y + b / 2, r: b / 2 }); y += b + gap; }
  y += sep - gap;
  for (const key of ACTIONS) { buttons.push({ kind: "action", key, x: (x1 + x2) / 2, y: y + b / 2, r: b / 2 }); y += b + gap; }
  const col = [x1, y1, x2, y - gap + pad];
  // il riquadro: in basso, centrato nello spazio a destra della colonna
  const left = x2 + PANEL.margin, right = W - PANEL.margin, pw = Math.max(200, Math.min(PANEL.maxW, right - left));
  const px1 = left + Math.max(0, (right - left - pw) / 2);
  const panel = [px1, H - PANEL.bottom - PANEL.h, px1 + pw, H - PANEL.bottom];
  return { k, col, buttons, panel, back: [W - BACK_BTN[0], BACK_BTN[1], BACK_BTN[2]] };
}

const inRect = (x, y, R) => x >= R[0] && y >= R[1] && x <= R[2] && y <= R[3];

// Cosa c'e' sotto il puntatore: un pulsante della colonna, "back", "ui"
// (la colonna o il riquadro, fuori dai pulsanti) o null (la mappa)
export function hitTest(L, mx, my) {
  for (const b of L.buttons) if (dhypot(mx - b.x, my - b.y) <= b.r) return b;
  if (dhypot(mx - L.back[0], my - L.back[1]) <= L.back[2]) return { kind: "back", key: "back" };
  if (inRect(mx, my, L.col) || inRect(mx, my, L.panel)) return { kind: "ui", key: null };
  return null;
}

// ------------------------------------------------------------------ icone

// Le icone della colonna, disegnate a linee e forme come il simbolo dello
// schermo intero (menu.js drawFullButton), in un riquadro di +-16 px a scala
// 1. ink: il colore del segno.
const DARK = 0x3c3c3c;
function drawIcon(d, key, x, y, s, ink) {
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
// Le righe del pannello (x1 y1 x2 y2) e dove stanno titolo e sottotitolo
const OPEN = { w: 420, h: 50, gap: 12 };
export function openLayout(W, H) {
  const n = TEMPLATES.length, h = n * OPEN.h + (n - 1) * OPEN.gap;
  const top = Math.max(220, (H - h) / 2), x1 = W / 2 - OPEN.w / 2;
  const rows = TEMPLATES.map((room, k) => ({ room, x1, y1: top + k * (OPEN.h + OPEN.gap), x2: x1 + OPEN.w, y2: top + k * (OPEN.h + OPEN.gap) + OPEN.h }));
  return { rows, title: [W / 2, top - 85], sub: [W / 2, top - 40] };
}

// [§9.182] La conferma prima di perdere le modifiche: il testo e due
// pulsanti, "Continua" e "Annulla"
export function confirmLayout(W, H) {
  const bw = 220, bh = 56, y = H / 2 + 20;
  return { text: [W / 2, H / 2 - 50], yes: [W / 2 - bw - 10, y, W / 2 - 10, y + bh], no: [W / 2 + 10, y, W / 2 + bw + 10, y + bh] };
}

// ------------------------------------------------------- la tavolozza

// [§9.182] "Inserisci": nel riquadro in basso le schede delle categorie
// (CATALOG) e, sotto, gli oggetti della scheda in una fila di caselle, con
// le frecce se non ci stanno tutti. scroll: il primo oggetto mostrato.
// [§9.183] una casella per voce del catalogo (una famiglia di stili e' una
// casella sola): `i`, il suo posto nella scheda
const CELL = 62, CELL_GAP = 8, ARROW = 30;
export function paletteLayout(panel, cat, scroll) {
  const [x1, y1, x2] = panel, n = CATALOG.length, tw = (x2 - x1 - 40) / n;
  const tabs = CATALOG.map((_, k) => ({ k, x1: x1 + 20 + k * tw + 3, y1: y1 + 62, x2: x1 + 20 + (k + 1) * tw - 3, y2: y1 + 90 }));
  const left = x1 + 20 + ARROW, right = x2 - 20 - ARROW, top = y1 + 98;
  const per = Math.max(1, Math.floor((right - left + CELL_GAP) / (CELL + CELL_GAP)));
  const n2 = CATALOG[cat].objects.length, max = Math.max(0, n2 - per), s = Math.max(0, Math.min(scroll, max));
  const cells = [];
  for (let k = 0; k < Math.min(per, n2 - s); k++) {
    cells.push({ i: s + k, x1: left + k * (CELL + CELL_GAP), y1: top, x2: left + k * (CELL + CELL_GAP) + CELL, y2: top + CELL });
  }
  return { tabs, cells, per, max, scroll: s, strip: [x1 + 20, top, x2 - 20, top + CELL],
           prev: s > 0 ? [x1 + 20, top, x1 + 20 + ARROW - 6, top + CELL] : null,
           next: s < max ? [x2 - 20 - ARROW + 6, top, x2 - 20, top + CELL] : null };
}

// Il colore di una macchia senza sprite nella tavolozza e nei segnaposto
// (BGR): erba, grano, fili d'erba, fiori
const DECOR_TINT = { burst_erba1: [0x3c7a46], burst_grano1: [0x4fb0c8], chiazzaparticellare: [0x5a8a6a],
                     fiori_prato: [0x3030d0, 0x30d0e0, 0xe0e0f0], fiori_papaveri: [0x2020c8], fiori_papaveri_erba: [0x2020c8, 0x3c7a46],
                     fiori_gialli_erba: [0x30d0e0, 0x3c7a46] };

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
  const ed = { tool: "select", hover: null, drag: null, view, label: "", open: null, confirm: null, loading: false,
               sel: new Set(), over: null, move: null, box: null, clip: null,
               cat: 0, scroll: CATALOG.map(() => 0), pick: null, style: ITEMS.map((l) => l.map(() => 0)), palHover: null };
  // [§9.183] la casella scelta, il suo stile ({ object, sprite? }) e quanti ne ha
  const pickedItem = () => (ed.pick ? ITEMS[ed.pick.cat][ed.pick.i] : null);
  const styleOfCell = (cat, i) => ITEMS[cat][i].styles[ed.style[cat][i]];
  const pickedStyle = () => (ed.pick ? styleOfCell(ed.pick.cat, ed.pick.i) : null);
  canvas.style.cursor = "none"; // il cursore del gioco, disegnato (come in partita)
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
  const clic = () => audio.ui("clic"); // §9.168
  const dirty = () => scene.version > 0;
  // [§9.182] prima di perdere le modifiche, la conferma
  const guard = (action) => { if (dirty()) ed.confirm = { action }; else action(); };
  const busy = async (fn) => {
    ed.loading = true;
    try { await fn(); } catch (e) { console.error(e); toast(tr("This map could not be opened"), "warning"); } finally { ed.loading = false; }
  };

  // un'altra mappa: la scena nuova, la vista sulla sua vista iniziale
  const setScene = (s, label) => {
    scene.ground.free();
    scene = s;
    Object.assign(ed, { label, sel: new Set(), over: null, move: null, box: null });
    view.setMap(s.map.width, s.map.height);
    const v = s.map.view;
    view.centre(v.x + v.w / 2, v.y + v.h / 2);
  };
  // [§9.182] un modello: la mappa della schermaglia diventa una mappa nuova
  const openTemplate = (room) => busy(async () => {
    const data = await (await fetch(`assets/rooms/${room}.json`)).json();
    const sc = roomToScenario(data);
    sc.name = "";
    setScene(await EditScene.load(ctx, sc, progress), tr("New map from {map}", { map: mapLabel(room) }));
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
    assets.load([...new Set([...assets.groupsOfTier("core", "gioco"), ...groupsFor(assets, objects, names)])], [])
      .then(() => { catalog = "ready"; }, (e) => { console.error(e); catalog = "no"; });
  };
  const setTool = (t) => { ed.tool = t; if (t === "insert") ensureCatalog(); };

  // ---------------------------------------------------------- modifiche
  const inMap = (x, y) => x >= 0 && y >= 0 && x <= scene.map.width && y <= scene.map.height;
  const canStart = (n) => scene.starts() + n <= STARTS;
  const place = (x, y) => {
    const st = pickedStyle();
    if (!st || !inMap(x, y) || catalog !== "ready") return;
    if (st.object === START && !canStart(1)) { toast(tr("A skirmish map has two starting positions."), "warning"); return; }
    const e = { object: st.object, x: Math.round(x), y: Math.round(y), scale_x: 1, scale_y: 1, rotation: 0 };
    if (st.sprite) e.sprite = st.sprite; // (la variante, come la scrive tools/12)
    scene.add([e]);
  };
  // [§9.183] S (Maiusc+S all'indietro): lo stile dopo della casella scelta
  // ("Inserisci") o delle voci scelte ("Sposta", con annulla)
  const nextStyle = (dir) => {
    if (ed.tool === "insert" && ed.pick) {
      const { cat, i } = ed.pick, n = ITEMS[cat][i].styles.length;
      ed.style[cat][i] = (ed.style[cat][i] + dir + n) % n;
    } else if (ed.tool === "select") {
      const list = selected().filter((e) => stylesOf(e, objects));
      scene.modify(list, (e) => {
        const S = stylesOf(e, objects), st = S.styles[(S.at + dir + S.styles.length) % S.styles.length];
        return st.sprite ? { object: st.object, sprite: st.sprite } : { object: st.object };
      });
    }
  };
  const selected = () => [...ed.sel].filter((e) => scene.instOf(e));
  const tidySel = () => { for (const e of ed.sel) if (!scene.instOf(e)) ed.sel.delete(e); };
  const copy = () => {
    const list = selected();
    if (!list.length) return;
    const cx = list.reduce((a, e) => a + e.x, 0) / list.length, cy = list.reduce((a, e) => a + e.y, 0) / list.length;
    ed.clip = list.map((e) => ({ ...e, x: e.x - cx, y: e.y - cy }));
  };
  const paste = (x, y) => {
    if (!ed.clip) return;
    let list = ed.clip.map((e) => ({ ...e, x: Math.round(x + e.x), y: Math.round(y + e.y) }));
    const st = list.filter((e) => e.object === START).length;
    if (st && !canStart(st)) { list = list.filter((e) => e.object !== START); toast(tr("A skirmish map has two starting positions."), "warning"); }
    if (!list.length) return;
    scene.add(list);
    ed.sel = new Set(list);
  };

  const step = () => {
    input.beginStep();
    if (ed.loading) return;
    const W = view.cssW, H = view.cssH, L = editorLayout(W, H), mx = input.x, my = input.y;
    const [rx, ry] = view.toRoom(mx, my);
    const ctrl = input.down.has(17), shift = input.down.has(16), K = (k) => input.pressed.has(k);
    // la conferma, sopra tutto
    if (ed.confirm) {
      const C = confirmLayout(W, H);
      ed.confirm.hover = inRect(mx, my, C.yes) ? "yes" : inRect(mx, my, C.no) ? "no" : null;
      if (K(27)) { ed.confirm = null; return; }
      if (input.mouseReleased[0] && ed.confirm.hover) {
        clic();
        const { action, hover } = ed.confirm;
        ed.confirm = null;
        if (hover === "yes") action();
      }
      return;
    }
    // il pannello "Apri mappa": Esc o un clic fuori lo chiudono
    if (ed.open) {
      const O = openLayout(W, H);
      ed.open.hover = input.inside ? O.rows.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2])) || null : null;
      if (K(27)) { ed.open = null; return; }
      if (input.mouseReleased[0]) {
        clic();
        const q = ed.open.hover;
        ed.open = null;
        if (q) guard(() => openTemplate(q.room));
      }
      return;
    }
    const hit = input.inside ? hitTest(L, mx, my) : null;
    ed.hover = hit && (hit.kind === "tool" || hit.kind === "action" || hit.kind === "back") ? hit : null;
    // Esc: prima si lascia l'oggetto o la scelta, poi si esce
    if (K(27)) {
      if (ed.tool === "insert" && ed.pick) ed.pick = null;
      else if (ed.sel.size) ed.sel.clear();
      else guard(toMenu);
      return;
    }
    // annulla e ripeti (Ctrl+Z, Ctrl+Y o Ctrl+Maiusc+Z), con ogni strumento
    if (ctrl && K(90)) { if (shift ? scene.redo() : scene.undo()) tidySel(); return; }
    if (ctrl && K(89)) { if (scene.redo()) tidySel(); return; }
    // gli strumenti coi tasti 1-4
    if (!ctrl) TOOLS.forEach((t, k) => { if (K(49 + k) || K(97 + k)) setTool(t); });
    if (!ctrl && K(83)) nextStyle(shift ? -1 : 1); // §9.183
    if (ed.tool === "select") {
      if (K(46) || K(8)) { scene.remove(selected()); ed.sel.clear(); }
      if (K(77) && !ctrl && ed.sel.size) scene.modify(selected(), (e) => ({ scale_x: -(e.scale_x ?? 1) }));
      if (ctrl && K(67)) copy();
      if (ctrl && K(86) && !hit) paste(rx, ry);
      if (ctrl && K(65)) ed.sel = new Set(scene.map.instances.filter((e) => !SYSTEM.has(e.object) && scene.instOf(e)));
    }
    // la vista: frecce (Shift: piu' veloce), trascinando col tasto centrale
    // o con Spazio + sinistro, rotella per lo zoom attorno al puntatore (sulla
    // tavolozza scorre gli oggetti)
    const sp = shift ? 36 : 14;
    const dx = (input.down.has(39) ? 1 : 0) - (input.down.has(37) ? 1 : 0), dy = (input.down.has(40) ? 1 : 0) - (input.down.has(38) ? 1 : 0);
    if ((dx || dy) && !ctrl) view.pan(dx * sp, dy * sp);
    const P = ed.tool === "insert" ? paletteLayout(L.panel, ed.cat, ed.scroll[ed.cat]) : null;
    if (input.inside && (input.wheelStep || input.wheelFine)) {
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
    if (grab) ed.drag = { x: mx, y: my, button: input.mousePressed[2] ? 2 : 0 };
    if (ed.drag) {
      if (!input.mouseDown[ed.drag.button]) ed.drag = null;
      else { view.pan(ed.drag.x - mx, ed.drag.y - my); ed.drag.x = mx; ed.drag.y = my; }
      return;
    }
    // la colonna e il cerchio "Indietro"
    if (input.mouseReleased[0] && ed.hover && !ed.move && !ed.box) {
      clic();
      const b = ed.hover;
      if (b.kind === "back") { guard(toMenu); return; }
      if (b.kind === "tool") setTool(b.key);
      else if (b.key === "open") ed.open = { hover: null }; // §9.181
      else if (b.key === "new") guard(newBlank); // §9.182
      else toast(tr(LABEL[b.key]) + "  -  " + tr("Coming soon"));
      return;
    }
    // la tavolozza (Inserisci)
    ed.palHover = null;
    if (P && hit && hit.kind === "ui") {
      ed.palHover = P.cells.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2])) || P.tabs.find((q) => inRect(mx, my, [q.x1, q.y1, q.x2, q.y2]))
        || (P.prev && inRect(mx, my, P.prev) ? "prev" : P.next && inRect(mx, my, P.next) ? "next" : null);
      if (input.mouseReleased[0] && ed.palHover) {
        clic();
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
    // sulla mappa
    const onMap = !hit && input.inside;
    if (ed.tool === "insert") {
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
        ed.move = { e, x0: rx, y0: ry, sx: mx, sy: my, dx: 0, dy: 0, on: false, list: ed.sel.has(e) ? selected() : [] };
      } else {
        if (!shift) ed.sel.clear();
        ed.box = { x0: rx, y0: ry, x1: rx, y1: ry };
      }
    }
    if (ed.move) {
      const M = ed.move;
      if (!M.on && dhypot(mx - M.sx, my - M.sy) > 4) M.on = true; // un clic non sposta
      if (M.on) { M.dx = Math.round(rx - M.x0); M.dy = Math.round(ry - M.y0); scene.preview(M.list, M.dx, M.dy); }
      if (!input.mouseDown[0]) {
        if (M.on && (M.dx || M.dy)) scene.modify(M.list, (e) => ({ x: e.x + M.dx, y: e.y + M.dy }));
        else if (M.on) scene.preview(M.list, 0, 0);
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
    if (ed.tool === "select") {
      for (const e of ed.sel) { if (!scene.instOf(e)) continue; const b = boxOf(e); outline(b, 4 * px, c.black, 0.35); outline(b, 2 * px, c.white, 0.95); }
      if (ed.over && !ed.sel.has(ed.over)) outline(boxOf(ed.over), 1.5 * px, c.white, 0.7);
      if (ed.box) {
        const b = [Math.min(ed.box.x0, ed.box.x1), Math.min(ed.box.y0, ed.box.y1), Math.max(ed.box.x0, ed.box.x1), Math.max(ed.box.y0, ed.box.y1)];
        draw.setColour(c.white); draw.setAlpha(0.15); draw.rectangle(b[0], b[1], b[2], b[3]);
        outline(b, 1.5 * px, c.white, 0.9);
      }
    }
    if (ed.tool === "insert" && ed.pick && input.inside && !hitTest(editorLayout(view.cssW, view.cssH), input.x, input.y)) {
      const [gx, gy] = view.toRoom(input.x, input.y), st = pickedStyle(), o = objects[st.object];
      const ok = inMap(gx, gy) && (st.object !== START || canStart(1));
      const spr = st.sprite || (o && o.sprite);
      const col = ok ? c.white : 0x4040ff;
      if (spr) drawSprite(r, assets, spr, 0, Math.round(gx), Math.round(gy), 1, 1, 0, col, 0.6);
      else { draw.setAlpha(0.6); draw.circleColour(gx, gy, 10 * px, col, col, false); }
    }
    draw.setAlpha(1);
    draw.setColour(c.white);
  };

  const drawUI = () => {
    const W = view.cssW, H = view.cssH, L = editorLayout(W, H), map = scene.map;
    r.setProjection(0, 0, W, H);
    draw.reset();
    // il titolo, e la mappa: nome (o "Nuova mappa") e misure
    draw.setHalign("center"); draw.setValign("middle");
    draw.setFont("gui_sblocco");
    glowText(draw, W / 2, 45, tr("Map editor"));
    draw.setFont("overdue");
    // (il font non ha "·" ne' "×")
    glowText(draw, W / 2, 92, (ed.label || tr("New map")) + "  -  " + map.width + " x " + map.height);
    // la colonna: un vetro chiaro, i pulsanti tondi; lo strumento scelto scuro
    const [cx1, cy1, cx2, cy2] = L.col;
    draw.setAlpha(0.35);
    draw.roundrectColourExt(cx1, cy1, cx2, cy2, 40 * L.k, 40 * L.k, c.white, c.white, false);
    for (const b of L.buttons) {
      const on = b.kind === "tool" && ed.tool === b.key, hov = ed.hover && ed.hover.key === b.key;
      draw.setAlpha(on ? 0.85 : hov ? 0.99 : 0.69);
      draw.circleColour(b.x, b.y, b.r, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setAlpha(on ? 1 : 0.75);
      drawIcon(draw, b.key, b.x, b.y, (b.r / 28) * 0.95, on ? c.white : c.black);
    }
    // fra gli strumenti e le azioni, una lineetta
    const last = L.buttons[TOOLS.length - 1], next = L.buttons[TOOLS.length], ym = (last.y + last.r + next.y - next.r) / 2;
    draw.setAlpha(0.35);
    draw.lineWidthColour(cx1 + 16 * L.k, ym, cx2 - 16 * L.k, ym, 2, c.black, c.black);
    // il cerchio "Indietro" (come nelle schermate del menu, §9.158)
    const [bx, by, br] = L.back;
    draw.setAlpha(ed.hover && ed.hover.kind === "back" ? 0.99 : 0.69);
    draw.circleColour(bx, by, br, c.white, c.white, false);
    draw.setAlpha(1);
    draw.spriteExt("ico_indietro", 0, bx, by, 0.6, 0.6, 0, c.white, 1);
    // il riquadro dello strumento scelto
    drawPanel(L.panel);
    // il suggerimento del pulsante sotto il puntatore, a destra della colonna
    if (ed.hover && ed.hover.kind !== "back" && !ed.open && !ed.confirm) tooltip(cx2 + 14, ed.hover.y, tr(LABEL[ed.hover.key]));
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
    const onMap = input.inside && !ed.open && !ed.confirm && !hitTest(editorLayout(view.cssW, view.cssH), input.x, input.y)
      && mx >= 0 && my >= 0 && mx <= map.width && my <= map.height;
    const state = !READY.has(ed.tool) ? tr("Coming soon")
      : ed.tool === "select" ? (ed.sel.size ? tr("{n} selected", { n: ed.sel.size }) : "")
      : ed.pick ? (pickedItem().styles.length > 1 ? tr("S: style {i}/{n}", { i: ed.style[ed.pick.cat][ed.pick.i] + 1, n: pickedItem().styles.length }) + "     " : "")
        + tr("Click: place. Right click: stop.") : tr("Choose an object");
    draw.text(x2 - 26, y1 + 30, (onMap ? `x ${Math.round(mx)}   y ${Math.round(my)}     ` : "") + state);
    draw.setAlpha(0.3);
    draw.lineWidthColour(x1 + 20, y1 + 54, x2 - 20, y1 + 54, 2, c.black, c.black);
    if (ed.tool === "insert") { drawPalette(panel); draw.setColour(c.white); return; }
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
    const P = paletteLayout(panel, ed.cat, ed.scroll[ed.cat]);
    draw.setFont("overdue");
    draw.setHalign("center");
    draw.setValign("middle");
    for (const q of P.tabs) {
      const on = q.k === ed.cat, hov = ed.palHover === q;
      draw.setAlpha(on ? 0.85 : hov ? 0.9 : 0.45);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 26, 26, on ? DARK : c.white, on ? DARK : c.white, false);
      draw.setColour(on ? c.white : c.black);
      draw.setAlpha(on ? 1 : 0.8);
      draw.text((q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2 + 1, tr(CATALOG[q.k].label));
    }
    if (catalog !== "ready") { draw.setColour(c.black); draw.setAlpha(0.6); draw.text((P.strip[0] + P.strip[2]) / 2, (P.strip[1] + P.strip[3]) / 2, t("loading")); return; }
    for (const q of P.cells) {
      const on = !!ed.pick && ed.pick.cat === ed.cat && ed.pick.i === q.i, hov = ed.palHover === q;
      draw.setAlpha(on ? 0.85 : hov ? 0.95 : 0.55);
      draw.roundrectColourExt(q.x1, q.y1, q.x2, q.y2, 18, 18, on ? DARK : c.white, on ? DARK : c.white, false);
      thumb(styleOfCell(ed.cat, q.i), (q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2, CELL - 10);
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

  // la miniatura di uno stile ({ object, sprite? }), dentro un quadrato di
  // lato `size` (centro cx, cy)
  const thumb = (st, cx, cy, size) => {
    const name = st.object, o = objects[name], spr = st.sprite || (o && (o.sprite || (o.choices && o.choices[0])));
    const b = spr && tightBounds(assets, spr, 0, 0);
    if (b) {
      const s = Math.min(size / (b[2] - b[0]), size / (b[3] - b[1]), 1);
      drawSprite(r, assets, spr, 0, cx - ((b[0] + b[2]) / 2) * s, cy - ((b[1] + b[3]) / 2) * s, s, s, 0, c.white, 1);
      return;
    }
    // le macchie (particelle, senza sprite): un prato coi suoi colori
    const tint = DECOR_TINT[name] || [0x3c7a46];
    draw.setAlpha(0.7);
    draw.ellipseColour(cx - size / 2, cy - size / 3, cx + size / 2, cy + size / 3, 0x5f9a72, 0x5f9a72, false);
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4, d = (k % 3 + 1) * size / 9, col = tint[k % tint.length];
      draw.setAlpha(0.95);
      draw.circleColour(cx + dcos(a) * d, cy + dsin(a) * d * 0.6, 3, col, col, false);
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
  // "Apri mappa": un velo scuro e le mappe della schermaglia come modelli
  const drawOpen = (W, H) => {
    const O = openLayout(W, H);
    veil(W, H);
    draw.setHalign("center"); draw.setValign("middle");
    draw.setFont("gui_sblocco");
    glowText(draw, O.title[0], O.title[1], tr("Open map"));
    draw.setFont("overdue");
    glowText(draw, O.sub[0], O.sub[1], tr("Skirmish maps, as templates for a new map"));
    draw.setFont("GUI_1");
    for (const q of O.rows) button([q.x1, q.y1, q.x2, q.y2], mapLabel(q.room), ed.open.hover === q);
    draw.setColour(c.white);
  };
  const drawConfirm = (W, H) => {
    const C = confirmLayout(W, H);
    veil(W, H);
    draw.setHalign("center"); draw.setValign("middle");
    draw.setFont("GUI_1");
    glowText(draw, C.text[0], C.text[1], tr("The changes to this map will be lost."));
    button(C.yes, tr("Continue"), ed.confirm.hover === "yes");
    button(C.no, tr("Cancel"), ed.confirm.hover === "no");
    draw.setColour(c.white);
  };

  let shown = false;
  const render = () => {
    if (!shown) { shown = true; requestAnimationFrame(() => { canvas.style.visibility = "visible"; }); }
    r.beginFrame(view, clear);
    drawMap();
    drawUI();
    if (input.inside) { // il cursore, ultimo
      r.setProjection(0, 0, view.cssW, view.cssH);
      draw.reset();
      draw.sprite("cursore", 0, Math.round(input.x), Math.round(input.y));
    }
    r.flush();
  };

  const loop = new Loop({ speed: 60, step, render });
  loop.fpsCap = settings.fpsCap;
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); loop.stop(); });
  canvas.addEventListener("webglcontextrestored", async () => { r.init(); await assets.reload(progress); loop.start(); });
  if (!params.has("nostart")) loop.start();
  // per le prove nel browser (game/test/browser/editor.mjs)
  window.__editor = { ready: true, ed, view, input, loop, layout: () => editorLayout(view.cssW, view.cssH),
                      openLayout: () => openLayout(view.cssW, view.cssH), confirmLayout: () => confirmLayout(view.cssW, view.cssH),
                      palette: () => paletteLayout(editorLayout(view.cssW, view.cssH).panel, ed.cat, ed.scroll[ed.cat]),
                      get scene() { return scene; }, openTemplate, catalog: () => catalog, advance(n) { for (let k = 0; k < n; k++) step(); }, render };
}
