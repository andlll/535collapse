// Input di mouse e tastiera, letto a passi come in GameMaker.
//
// Gli eventi del browser arrivano quando vogliono; il gioco li vede a ogni
// passo come "premuto / tenuto / rilasciato in questo passo" (gli eventi
// Keyboard, KeyPress, KeyRelease e Mouse di GMS, STUDIO.md §1.3). Pointer
// events: mouse e penna oggi, tocco quando servira' (decisione dell'autore:
// solo desktop per ora).

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0; this.y = 0;          // posizione in pixel CSS dentro il canvas
    this.inside = false;
    this.wheel = 0;
    this._down = new Set(); this._pressed = new Set(); this._released = new Set();
    this.down = new Set(); this.pressed = new Set(); this.released = new Set();
    this._mdown = [false, false, false];
    this._mp = [false, false, false]; this._mr = [false, false, false];
    this.mouseDown = [false, false, false];
    this.mousePressed = [false, false, false];
    this.mouseReleased = [false, false, false];

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      this.x = e.clientX - r.left;
      this.y = e.clientY - r.top;
    };
    canvas.addEventListener("pointermove", (e) => { pos(e); this.inside = true; });
    canvas.addEventListener("pointerenter", (e) => { pos(e); this.inside = true; });
    canvas.addEventListener("pointerleave", () => { this.inside = false; });
    canvas.addEventListener("pointerdown", (e) => {
      pos(e);
      canvas.setPointerCapture(e.pointerId);
      const b = BUTTON[e.button];
      if (b === undefined) return;
      this._mdown[b] = true; this._mp[b] = true;
    });
    const up = (e) => {
      const b = BUTTON[e.button];
      if (b === undefined || !this._mdown[b]) return;
      this._mdown[b] = false; this._mr[b] = true;
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); },
                            { passive: false });
    window.addEventListener("keydown", (e) => {
      const k = keyCode(e);
      if (k === null) return;
      if (!this._down.has(k)) this._pressed.add(k);
      this._down.add(k);
      if (PREVENT.has(k)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      const k = keyCode(e);
      if (k === null) return;
      this._down.delete(k);
      this._released.add(k);
    });
    // Finestra che perde il fuoco: nessun tasto deve restare "tenuto".
    window.addEventListener("blur", () => {
      for (const k of this._down) this._released.add(k);
      this._down.clear();
    });
  }

  // Chiamato all'inizio di ogni passo: fotografa lo stato.
  beginStep() {
    this.down = new Set(this._down);
    this.pressed = this._pressed; this._pressed = new Set();
    this.released = this._released; this._released = new Set();
    this.mouseDown = this._mdown.slice();
    this.mousePressed = this._mp; this._mp = [false, false, false];
    this.mouseReleased = this._mr; this._mr = [false, false, false];
    this.wheelStep = this.wheel; this.wheel = 0;
  }
}

// mb_left, mb_right, mb_middle nell'ordine di GameMaker
const BUTTON = { 0: 0, 2: 1, 1: 2 };

// Codici tasto di GameMaker (= keyCode di Windows): lettere e cifre ASCII,
// frecce 37-40, ecc. (tools/gmx.py KEYS). `code` e' indipendente dal layout.
const CODES = {
  ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Enter: 13, NumpadEnter: 13,
  Escape: 27, Space: 32, Delete: 46, Backspace: 8, Tab: 9, ShiftLeft: 16, ShiftRight: 16,
  ControlLeft: 17, ControlRight: 17, AltLeft: 18, AltRight: 18, PageUp: 33, PageDown: 34,
  Home: 36, End: 35, Insert: 45,
};
for (let i = 0; i < 10; i++) { CODES["Digit" + i] = 48 + i; CODES["Numpad" + i] = 96 + i; }
for (let i = 0; i < 26; i++) CODES["Key" + String.fromCharCode(65 + i)] = 65 + i;
for (let i = 1; i <= 12; i++) CODES["F" + i] = 111 + i;

const PREVENT = new Set([37, 38, 39, 40, 32, 9, 18]);

function keyCode(e) {
  const k = CODES[e.code];
  return k === undefined ? null : k;
}
