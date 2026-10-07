// Input di mouse e tastiera, letto a passi come in GameMaker.
//
// Gli eventi del browser arrivano quando vogliono; il gioco li vede a ogni
// passo come "premuto / tenuto / rilasciato in questo passo" (gli eventi
// Keyboard, KeyPress, KeyRelease e Mouse di GMS, STUDIO.md §1.3). Pointer
// events: mouse e penna oggi, tocco quando servira' (decisione dell'autore:
// solo desktop per ora).

// Puntatore fuori dalla finestra [Correzione decisa dall'autore, §6.1 n.82]:
// - uscendo dal canvas la posizione resta sul bordo da cui e' uscito
//   (`edgeHold`) e la view continua a scorrere da quella parte finche' il
//   puntatore non rientra o la finestra non perde il fuoco (clic su
//   un'altra finestra, cambio di scheda);
// - con l'opzione "Blocca il mouse nella finestra" (menu di pausa) il
//   canvas cattura il puntatore (Pointer Lock): il cursore e' solo quello
//   disegnato dal gioco, si muove coi movimenti relativi e non puo' uscire.
//   Esc lo libera (lo fa il browser); il clic successivo lo riprende.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0; this.y = 0;          // posizione in pixel CSS dentro il canvas
    this.inside = false;
    this.edgeHold = false;           // fuori dal canvas, fermo sul bordo
    this.locked = false;             // Pointer Lock attivo
    this.wantLock = false;           // opzione del giocatore (app.js)
    this.onUnlock = null;            // chiamata quando il blocco si perde
    this._unlockedAt = -1e9;
    this.wheel = 0;
    this._down = new Set(); this._pressed = new Set(); this._released = new Set();
    // tasti premuti con Shift tenuto (gruppi di unita': units.js,
    // controlGroups); presi al keydown, perche' Shift puo' essere gia'
    // rilasciato al passo che legge il tasto
    this._pressedShift = new Set(); this.pressedShift = new Set();
    this.down = new Set(); this.pressed = new Set(); this.released = new Set();
    this._mdown = [false, false, false];
    this._mp = [false, false, false]; this._mr = [false, false, false];
    this.mouseDown = [false, false, false];
    this.mousePressed = [false, false, false];
    this.mouseReleased = [false, false, false];

    // posizione sempre dentro il canvas (anche col pulsante tenuto fuori,
    // che con setPointerCapture continua a mandare eventi)
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      if (this.locked) {
        this.x += e.movementX || 0;
        this.y += e.movementY || 0;
      } else {
        this.x = e.clientX - r.left;
        this.y = e.clientY - r.top;
      }
      this.x = Math.max(0, Math.min(r.width - 1, this.x));
      this.y = Math.max(0, Math.min(r.height - 1, this.y));
    };
    canvas.addEventListener("pointermove", (e) => { pos(e); this.inside = true; this.edgeHold = false; });
    canvas.addEventListener("pointerenter", (e) => { pos(e); this.inside = true; this.edgeHold = false; });
    canvas.addEventListener("pointerleave", (e) => {
      if (this.locked) return;
      pos(e);
      this.inside = false;
      this.edgeHold = document.hasFocus();
    });
    const release = () => { this.edgeHold = false; };
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", () => { if (document.hidden) release(); });
    document.addEventListener("pointerlockchange", () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (this.locked) { this.inside = true; this.edgeHold = false; }
      if (was && !this.locked) {
        this._unlockedAt = performance.now();
        if (this.onUnlock) this.onUnlock();
      }
    });
    canvas.addEventListener("pointerdown", (e) => {
      pos(e);
      if (this.wantLock && !this.locked) this.lock();
      else if (!this.locked) canvas.setPointerCapture(e.pointerId);
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
    // Rotella: scatti interi (+1 = giu'). Una rotella classica da' ~100 px
    // a scatto; il touchpad tanti delta piccoli, che si sommano.
    let wheelAcc = 0;
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      pos(e);
      const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 300 : e.deltaY;
      wheelAcc += px;
      if (Math.abs(wheelAcc) >= 100 || (Math.abs(px) >= 50 && Math.abs(wheelAcc) >= 50)) {
        this.wheel += Math.sign(wheelAcc);
        wheelAcc = 0;
      }
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      const k = keyCode(e);
      if (k === null) return;
      // l'Esc che libera il puntatore e' del browser, non del gioco (a
      // seconda del browser arriva prima o dopo pointerlockchange)
      if (k === 27 && (this.locked || performance.now() - this._unlockedAt < 300)) return;
      if (!this._down.has(k)) { this._pressed.add(k); if (e.shiftKey) this._pressedShift.add(k); }
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

  // Pointer Lock (solo da un gesto del giocatore: clic). Il browser puo'
  // rifiutare (subito dopo un Esc, o in un iframe senza permesso): si
  // riprova al clic successivo.
  lock() {
    if (!this.canvas.requestPointerLock) return;
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* non disponibile */ }
  }

  unlock() {
    if (this.locked && document.exitPointerLock) document.exitPointerLock();
  }

  // Chiamato all'inizio di ogni passo: fotografa lo stato.
  beginStep() {
    this.down = new Set(this._down);
    this.pressed = this._pressed; this._pressed = new Set();
    this.pressedShift = this._pressedShift; this._pressedShift = new Set();
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
