// Menu di pausa. L'originale ne ha uno [C, mouser: Draw_GUI, Step_End,
// Mouse_GlobalLeftReleased, Alarm_1]: pulsante in alto a destra
// (rettangolo arrotondato bianco con l'icona `icopausa`) o Esc senza nulla
// di selezionato; tutto si ferma (instance_deactivate_all) e compaiono
// "GAME PAUSED", Riprendi, Ricomincia, Torna al menu e gli interruttori di
// suggerimenti, obiettivi e FPS.
//
// [Richiesta dell'autore, §3.19] il menu ha l'aspetto e le opzioni di
// quello di NIMBUS (n_redux, main.js drawPauseOverlay()): il mondo fermo,
// sfumato e scurito, un pannello bianco traslucido con pulsanti a pillola,
// la lingua scelta con un controllo a segmenti (EN IT ES PT DE FR) e un
// sottomenu "Opzioni grafiche" (pioggia, erba e spighe, fiamme e scintille,
// risoluzione dinamica, limite di fps). Le voci dell'originale restano.
// Il testo usa i font del gioco.

import { c } from "./colours.js";
import { tr, LANGUAGES, getLanguage } from "./i18n.js";

const GREEN = 0x50af4c;           // rgb(76,175,80), il verde di NIMBUS (BGR)
const PANEL_ALPHA = 0.78, BUTTON_ALPHA = 0.92;
const BTN_H = 46, BTN_GAP = 14, CAPTION_H = 22, SEG_H = 40;

export class PauseMenu {
  // actions: { language(code), restart(), menu(), graphics(changes) }
  constructor({ g, settings, actions, room }) {
    this.g = g;
    this.settings = settings;
    this.actions = actions;
    this.room = room;
    this.paused = false;
    this.submenu = null;   // null | "graphics"
    this.rects = [];       // pulsanti dell'ultimo disegno: {x, y, w, h, action, value}
    this.dirty = true;     // lo sfondo sfumato va rifatto
    this.hoverButton = 0;
  }

  open() { this.paused = true; this.submenu = null; this.dirty = true; }
  close() { this.paused = false; this.submenu = null; }

  // Il pulsante di pausa dell'originale [C, mouser]: in alto a destra
  _overButton(input, W) {
    return input.inside && input.x > W - 90 && input.x < W - 20 && input.y > 20 && input.y < 80;
  }

  // A gioco in corso: pulsante ed Esc. Restituisce true se il menu si e'
  // appena aperto (il passo del mondo si salta, cosi' il clic sul pulsante
  // non arriva anche alla partita).
  check(input, W) {
    if (this.room === "menu") return false;
    this.hoverButton = this._overButton(input, W) ? 1 : 0;
    if (this.hoverButton && input.mouseReleased[0]) { this.open(); return true; }
    // Esc apre solo senza nulla di selezionato (con una selezione Esc
    // deseleziona) [C, mouser Alarm_1: global.sel=0]
    if (input.pressed.has(27) && this.g.sel === 0) { this.open(); return true; }
    return false;
  }

  // In pausa: Esc torna indietro, un clic preme un pulsante.
  input(input) {
    if (input.pressed.has(27)) {
      if (this.submenu) this.submenu = null; else this.close();
      return;
    }
    if (!input.mouseReleased[0]) return;
    const hit = this.rects.find((b) => input.x >= b.x && input.x <= b.x + b.w && input.y >= b.y && input.y <= b.y + b.h);
    if (hit) this._do(hit);
  }

  _do(b) {
    const g = this.g, s = this.settings;
    switch (b.action) {
      case "resume": this.close(); break;
      case "graphics": this.submenu = "graphics"; break;
      case "back": this.submenu = null; break;
      // [C, mouser Mouse_GlobalLeftReleased] gli interruttori dell'originale
      case "hints": g.hint = g.hint === 1 ? 0 : 1; this.dirty = true; break;
      case "objectives": g.obj = g.obj === 1 ? 0 : 1; this.dirty = true; break;
      case "fps": g.fps_show = g.fps_show === 1 ? 0 : 1; this.dirty = true; break;
      case "language": this.actions.language(b.value); this.dirty = true; break;
      case "restart": this.actions.restart(); break;
      case "menu": this.actions.menu(); break;
      case "rain": case "grass": case "fire": case "dynamicResolution":
        s[b.action] = !s[b.action];
        this.actions.graphics();
        this.dirty = true;
        break;
      case "fpsCap": s.fpsCap = b.value; this.actions.graphics(); break;
      default: break;
    }
  }

  // ------------------------------------------------------------- disegno

  // Il pulsante di pausa, nell'interfaccia [C, mouser Draw_GUI]
  drawButton(d, W) {
    if (this.room === "menu") return;
    d.setAlpha(this.hoverButton ? 0.99 : 0.69);
    d.roundrectColourExt(W - 90, 20, W - 20, 80, 60, 60, c.white, c.white, false);
    d.sprite("icopausa", 0, W - 55, 50);
    d.setAlpha(1);
  }

  _button(d, x, y, w, h, label, action, input, value) {
    const hover = input.inside && input.x >= x && input.x <= x + w && input.y >= y && input.y <= y + h;
    d.setAlpha(hover ? 1 : BUTTON_ALPHA);
    d.roundrectColourExt(x, y, x + w, y + h, h, h, hover ? 0xf2f2f2 : c.white, hover ? 0xf2f2f2 : c.white, false);
    this._label(d, x + w / 2, y + h / 2, label);
    this.rects.push({ x, y, w, h, action, value });
  }

  _label(d, x, y, str, font = "GUI_1") {
    d.setFont(font);
    d.setColour(c.black);
    d.setAlpha(0.85);
    d.setHalign("center");
    d.setValign("middle");
    d.text(x, y, str);
  }

  // Controllo a segmenti (lingua, limite di fps): il segmento scelto e'
  // verde, come in NIMBUS.
  _segments(d, x, y, w, segs, action, input) {
    const segW = w / segs.length, gap = 6;
    segs.forEach((sg, k) => {
      const bx = x + k * segW + gap / 2, bw = segW - gap;
      const hover = input.inside && input.x >= bx && input.x <= bx + bw && input.y >= y && input.y <= y + SEG_H;
      const col = sg.selected ? GREEN : hover ? 0xf2f2f2 : c.white;
      d.setAlpha(sg.selected ? 0.88 : hover ? 1 : BUTTON_ALPHA);
      d.roundrectColourExt(bx, y, bx + bw, y + SEG_H, SEG_H, SEG_H, col, col, false);
      this._label(d, bx + bw / 2, y + SEG_H / 2, sg.label);
      this.rects.push({ x: bx, y, w: bw, h: SEG_H, action, value: sg.value });
    });
  }

  // Il pannello (in pixel CSS), sopra lo sfondo sfumato che disegna app.js
  drawPanel(d, W, H, input) {
    this.rects = [];
    const g = this.g, s = this.settings;
    const onOff = (v) => tr(v ? "ON" : "OFF");
    let title, before, segCaption, segs, segAction, after;
    if (this.submenu === "graphics") {
      title = tr("GRAPHICS OPTIONS");
      before = [
        [tr("Rain: {state}", { state: onOff(s.rain) }), "rain"],
        [tr("Grass and crops: {state}", { state: onOff(s.grass) }), "grass"],
        [tr("Fire and sparks: {state}", { state: onOff(s.fire) }), "fire"],
        [tr("Dynamic resolution: {state}", { state: onOff(s.dynamicResolution) }), "dynamicResolution"],
      ];
      segCaption = tr("FPS limit");
      segs = [30, 60, 0].map((v) => ({ value: v, label: v ? String(v) : tr("None"), selected: s.fpsCap === v }));
      segAction = "fpsCap";
      after = [[tr("Back"), "back"]];
    } else {
      title = tr("PAUSE");
      before = [
        [tr("Resume"), "resume"],
        [tr("Graphics options"), "graphics"],
        [tr("Hints: {state}", { state: onOff(g.hint === 1) }), "hints"],
        [tr("Objectives: {state}", { state: onOff(g.obj === 1) }), "objectives"],
        [tr("FPS counter: {state}", { state: onOff(g.fps_show === 1) }), "fps"],
      ];
      segCaption = tr("Language");
      const cur = getLanguage();
      segs = LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase(), selected: l === cur }));
      segAction = "language";
      after = [[tr("Restart level"), "restart"], [tr("Back to menu"), "menu"]];
    }
    // larghezza: quella di NIMBUS (360) o di piu' se un'etichetta tradotta
    // non ci sta
    d.setFont("GUI_1");
    const longest = Math.max(...[...before, ...after].map(([l]) => d.stringWidth(l)));
    d.setFont("gui_sblocco");
    const titleW = d.stringWidth(title);
    const panelW = Math.min(Math.max(360, longest + 100, titleW + 60), W - 40);
    const rows = before.length + after.length;
    const panelH = 96 + rows * (BTN_H + BTN_GAP) + CAPTION_H + SEG_H + BTN_GAP + 20;
    const px = (W - panelW) / 2, py = Math.max(10, (H - panelH) / 2);
    d.setAlpha(PANEL_ALPHA);
    d.roundrectColourExt(px, py, px + panelW, py + panelH, 40, 40, c.white, c.white, false);
    this._label(d, px + panelW / 2, py + 44, title, "gui_sblocco");
    const btnW = panelW - 60, bx = px + 30;
    let by = py + 96;
    for (const [label, action] of before) { this._button(d, bx, by, btnW, BTN_H, label, action, input); by += BTN_H + BTN_GAP; }
    this._label(d, bx + btnW / 2, by + CAPTION_H / 2, segCaption, "overdue");
    by += CAPTION_H;
    this._segments(d, bx, by, btnW, segs, segAction, input);
    by += SEG_H + BTN_GAP;
    for (const [label, action] of after) { this._button(d, bx, by, btnW, BTN_H, label, action, input); by += BTN_H + BTN_GAP; }
    d.setAlpha(1);
    d.setColour(c.white);
    d.setHalign("left");
  }
}
