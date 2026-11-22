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
// strumenti si scelgono (clic o tasti 1-4) ma non fanno ancora niente; le
// azioni sulla mappa dicono "Prossimamente". Esc o il cerchio in alto a
// destra tornano al menu. Il resto si decide con l'autore (§9.180, "Da
// decidere").
//
// Un ciclo suo, senza World ne' partita (app.js passa qui prima di creare la
// partita): renderer, atlas, input e ciclo sono quelli del gioco.

import { c } from "./colours.js";
import { tr } from "./i18n.js";
import { Input } from "./input.js";
import { Loop } from "./loop.js";
import { Draw } from "./draw.js";
import { drawBackgrounds } from "./ground.js";
import { audio } from "./audio.js";
import { glowText } from "./menu.js";
import { dcos, dsin, dhypot } from "./dmath.js";

// ----------------------------------------------------------------- mappa

export const MAP_FORMAT = "535-scenario", MAP_VERSION = 1;
// Una mappa vuota, nel formato degli scenari (§9.3, tools/12_tiled_import.py):
// come la mappa vuota del kit (tools/11 --nuova: 6000 x 6000, sfondo green1,
// colore della room 12632256 [C]). Manager e vista iniziale: li aggiungera'
// l'editor salvando (§9.180, "Da decidere").
export function newMap({ name = "", width = 6000, height = 6000, background = "green1" } = {}) {
  return { format: MAP_FORMAT, version: MAP_VERSION, name, width, height, background, colour: 12632256,
           view: { x: 0, y: 0, w: 3000, h: 2000 },
           instances: [], roads: [], rivers: [], bridges: [], patches: [] };
}

// ----------------------------------------------------------------- vista

// La vista dell'editor: come la Camera del gioco (x, y, w, h in pixel di
// mappa, cssW e cssH della finestra), ma con lo zoom fra VIEW_MIN (piu'
// vicino che in partita) e VIEW_MAX (piu' lontano: la mappa intera, o
// quasi), e un margine fuori dalla mappa per arrivare ai bordi da sotto la
// colonna e il riquadro. scale: pixel di mappa per pixel CSS.
export const VIEW_MIN = 0.5, VIEW_MAX = 4, VIEW_MARGIN = 400;
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
export const EDITOR_TEXTS = ["Map editor", "Coming soon", HELP, ...Object.values(LABEL), ...Object.values(DESC)];

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

// ------------------------------------------------------------- l'editor

// Avvio da app.js: r e assets gia' pronti (atlas e font), il canvas, le
// opzioni del giocatore, toast e progress per i messaggi e la barra.
export async function runEditor({ r, assets, canvas, settings, params, toast, progress }) {
  const map = newMap();
  await assets.load(assets.groupsOfTier("core"), [map.background], progress);
  const draw = new Draw(r, assets);
  const input = new Input(canvas);
  const view = new EditorView(map.width, map.height);
  const ed = { tool: "select", hover: null, drag: null, map, view };
  canvas.style.cursor = "none"; // il cursore del gioco, disegnato (come in partita)
  const clear = [0x1b / 255, 0x1d / 255, 0x17 / 255]; // fuori dalla mappa: il colore della pagina (index.html)

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    view.resize(w, h);
  };
  window.addEventListener("resize", resize);
  resize();
  view.centre(map.width / 2, map.height / 2);

  const toMenu = () => { location.search = "?room=menu"; };
  const clic = () => audio.ui("clic"); // §9.168

  const step = () => {
    input.beginStep();
    const W = view.cssW, H = view.cssH, L = editorLayout(W, H), mx = input.x, my = input.y;
    const hit = input.inside ? hitTest(L, mx, my) : null;
    ed.hover = hit && (hit.kind === "tool" || hit.kind === "action" || hit.kind === "back") ? hit : null;
    if (input.pressed.has(27)) { toMenu(); return; }
    // gli strumenti coi tasti 1-4
    TOOLS.forEach((t, k) => { if (input.pressed.has(49 + k) || input.pressed.has(97 + k)) ed.tool = t; });
    // la vista: frecce (Shift: piu' veloce), trascinando col tasto centrale
    // o con Spazio + sinistro, rotella per lo zoom attorno al puntatore
    const sp = input.down.has(16) ? 36 : 14;
    const dx = (input.down.has(39) ? 1 : 0) - (input.down.has(37) ? 1 : 0), dy = (input.down.has(40) ? 1 : 0) - (input.down.has(38) ? 1 : 0);
    if (dx || dy) view.pan(dx * sp, dy * sp);
    if (input.inside && (input.wheelStep || input.wheelFine)) {
      // uno scatto: x1,15 (o /1,15); il touchpad: in proporzione ai pixel
      const n = input.wheelStep || 0, fine = (input.wheelFine || 0) / 600;
      let f = fine >= 0 ? 1 + fine : 1 / (1 - fine);
      for (let k = 0; k < Math.abs(n); k++) f = n > 0 ? f * 1.15 : f / 1.15;
      view.zoomAt(view.scale * f, mx, my);
    }
    const grab = input.mousePressed[2] || (input.mousePressed[0] && input.down.has(32) && !hit);
    if (grab) ed.drag = { x: mx, y: my, button: input.mousePressed[2] ? 2 : 0 };
    if (ed.drag) {
      if (!input.mouseDown[ed.drag.button]) ed.drag = null;
      else { view.pan(ed.drag.x - mx, ed.drag.y - my); ed.drag.x = mx; ed.drag.y = my; }
      return;
    }
    if (input.mouseReleased[0] && ed.hover) {
      clic();
      const b = ed.hover;
      if (b.kind === "back") { toMenu(); return; }
      if (b.kind === "tool") ed.tool = b.key;
      else toast(tr(LABEL[b.key]) + "  -  " + tr("Coming soon"));
    }
  };

  const drawMap = () => {
    r.setProjection(view.x, view.y, view.w, view.h);
    draw.reset();
    // lo sfondo ripetuto, solo dentro la mappa (fuori il colore della pagina)
    const x1 = Math.max(0, view.x), y1 = Math.max(0, view.y);
    const x2 = Math.min(map.width, view.x + view.w), y2 = Math.min(map.height, view.y + view.h);
    if (x2 > x1 && y2 > y1) {
      drawBackgrounds(r, assets, { backgrounds: [{ name: map.background, htiled: true, vtiled: true, x: 0, y: 0 }] },
                      { x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
    }
    // il bordo della mappa, 2 px a schermo a ogni zoom
    const w = 2 * view.scale;
    draw.setAlpha(0.6);
    draw.lineWidthColour(0, 0, map.width, 0, w, c.black, c.black);
    draw.lineWidthColour(map.width, 0, map.width, map.height, w, c.black, c.black);
    draw.lineWidthColour(map.width, map.height, 0, map.height, w, c.black, c.black);
    draw.lineWidthColour(0, map.height, 0, 0, w, c.black, c.black);
    draw.setAlpha(1);
  };

  const drawUI = () => {
    const W = view.cssW, H = view.cssH, L = editorLayout(W, H);
    r.setProjection(0, 0, W, H);
    draw.reset();
    // il titolo, e la mappa: nome (o "Nuova mappa") e misure
    draw.setHalign("center"); draw.setValign("middle");
    draw.setFont("gui_sblocco");
    glowText(draw, W / 2, 45, tr("Map editor"));
    draw.setFont("overdue");
    // (il font non ha "·" ne' "×")
    glowText(draw, W / 2, 92, (map.name || tr("New map")) + "  -  " + map.width + " x " + map.height);
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
    if (ed.hover && ed.hover.kind !== "back") tooltip(cx2 + 14, ed.hover.y, tr(LABEL[ed.hover.key]));
    draw.setAlpha(1);
  };

  const drawPanel = ([x1, y1, x2, y2]) => {
    draw.setAlpha(0.69);
    draw.roundrectColourExt(x1, y1, x2, y2, 40, 40, c.white, c.white, false);
    draw.setColour(c.black);
    draw.setValign("middle");
    draw.setHalign("left");
    draw.setFont("GUI_1");
    draw.setAlpha(0.8);
    draw.text(x1 + 26, y1 + 30, tr(LABEL[ed.tool]));
    // a destra: "Prossimamente" (lo strumento non c'e' ancora) e, col
    // puntatore sulla mappa, le sue coordinate
    draw.setHalign("right");
    draw.setFont("overdue");
    draw.setAlpha(0.55);
    const [mx, my] = view.toRoom(input.x, input.y);
    const onMap = input.inside && !hitTest(editorLayout(view.cssW, view.cssH), input.x, input.y) && mx >= 0 && my >= 0 && mx <= map.width && my <= map.height;
    draw.text(x2 - 26, y1 + 30, (onMap ? `x ${Math.round(mx)}   y ${Math.round(my)}     ` : "") + tr("Coming soon"));
    draw.setAlpha(0.3);
    draw.lineWidthColour(x1 + 20, y1 + 54, x2 - 20, y1 + 54, 2, c.black, c.black);
    draw.setHalign("left");
    draw.setValign("top");
    draw.setAlpha(0.8);
    draw.textExt(x1 + 26, y1 + 66, tr(DESC[ed.tool]), 28, x2 - x1 - 52);
    draw.setAlpha(0.5);
    draw.setValign("bottom");
    draw.text(x1 + 26, y2 - 14, tr(HELP));
    draw.setColour(c.white);
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

  let shown = false;
  const render = () => {
    if (!shown) { shown = true; requestAnimationFrame(() => { canvas.style.visibility = "visible"; }); }
    r.beginFrame(view, clear);
    drawMap();
    drawUI();
    if (input.inside) { // il cursore, ultimo
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
  window.__editor = { ready: true, ed, view, map, input, loop, layout: () => editorLayout(view.cssW, view.cssH),
                      advance(n) { for (let k = 0; k < n; k++) step(); }, render };
}
