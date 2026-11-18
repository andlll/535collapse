// [§9.156, multiplayer, fase 4] I pannelli della partita a due: HTML sopra
// il gioco (servono caselle di testo vere, per copiare e incollare i codici),
// nello stile del menu (pulsanti bianchi a pillola, testo nero) e col font
// del gioco (domtext.js).
//
// Il pannello copre tutta la finestra: i clic non arrivano al gioco sotto, e
// i tasti battuti nelle caselle nemmeno (input.js ascolta la finestra: si
// fermano qui), cosi' un Ctrl+V nella casella non diventa un tasto della
// partita. Esc chiama onEscape.

import { setDomText } from "./domtext.js";

const CSS = `
.net-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(10, 12, 8, .35); z-index: 10; }
.net-panel { box-sizing: border-box; width: min(600px, 94vw); max-height: 94vh; overflow-y: auto;
  padding: 16px 26px 16px; border-radius: 34px; background: rgba(255, 255, 255, .84); color: #111;
  font: 15px/1.4 system-ui, sans-serif; box-shadow: 0 8px 40px rgba(0, 0, 0, .3); }
.net-panel > * { margin: 0 0 9px; }
.net-panel > *:last-child { margin-bottom: 0; }
.net-panel textarea { display: block; box-sizing: border-box; width: 100%; height: 72px; resize: none; padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, .22); border-radius: 12px; background: rgba(255, 255, 255, .95);
  font: 12px/1.35 ui-monospace, monospace; color: #222; word-break: break-all;
  -webkit-user-select: text; user-select: text; }
.net-panel textarea:focus { outline: 2px solid rgba(76, 175, 80, .7); }
.net-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.net-btn { min-width: 170px; height: 40px; padding: 0 22px; border: 0; border-radius: 20px; cursor: pointer;
  background: rgba(255, 255, 255, .95); box-shadow: 0 1px 4px rgba(0, 0, 0, .25); display: flex;
  align-items: center; justify-content: center; }
.net-btn:hover { background: #f2f2f2; }
.net-btn.primary { background: rgba(76, 175, 80, .92); }
.net-btn.primary:hover { background: rgb(86, 190, 90); }
.net-btn:disabled { opacity: .45; cursor: default; }
.net-status:empty { display: none; }
#net-bar { position: fixed; left: 50%; top: 16px; transform: translateX(-50%); max-width: min(90vw, 720px);
  padding: 10px 16px; border-radius: 8px; color: #fff; background: #4a4f3c; pointer-events: none; z-index: 9; }
#net-bar.warning { background: #8a5a12; }
#net-bar.error { background: #8a1c12; }
`;

function style() {
  if (document.getElementById("net-style")) return;
  const s = document.createElement("style");
  s.id = "net-style";
  s.textContent = CSS;
  document.head.append(s);
}

const INNER = () => Math.min(600, window.innerWidth * 0.94) - 56;

// (§9.157: il pannello agganciato alla colonna della mappa della
// schermaglia, §9.156, non serve piu': sempre al centro, sopra tutto)
export class NetPanel {
  constructor({ onEscape = null } = {}) {
    style();
    this.root = document.createElement("div");
    this.root.className = "net-overlay";
    this.panel = document.createElement("div");
    this.panel.className = "net-panel";
    this.root.append(this.panel);
    // i tasti battuti qui non arrivano al gioco (input.js ascolta window)
    for (const ev of ["keydown", "keyup", "keypress"]) this.root.addEventListener(ev, (e) => e.stopPropagation());
    this.onEscape = onEscape;
    this._esc = (e) => {
      if (e.code !== "Escape") return;
      e.stopPropagation();
      if (e.type === "keydown" && this.onEscape) this.onEscape();
    };
    window.addEventListener("keydown", this._esc, true);
    window.addEventListener("keyup", this._esc, true);
    document.body.append(this.root);
    this.statusEl = null;
  }

  _add(el) { this.panel.append(el); return el; }
  // la larghezza utile del testo
  inner() { return INNER(); }

  title(text) {
    const el = this._add(document.createElement("div"));
    setDomText(el, text, { font: "gui_sblocco", colour: "#111", width: this.inner() });
    el.style.margin = "2px 0 10px";
    return el;
  }

  // un paragrafo nel font del gioco (center: false per allinearlo a sinistra)
  text(text, { center = false, colour = "#222" } = {}) {
    const el = this._add(document.createElement("div"));
    el.dataset.text = text;
    setDomText(el, text, { font: "overdue", colour, width: this.inner(), center });
    return el;
  }

  setText(el, text, { center = false, colour = "#222" } = {}) {
    el.dataset.text = text;
    setDomText(el, text, { font: "overdue", colour, width: this.inner(), center });
  }

  // una casella per un codice: da copiare (readonly) o da incollare
  code({ value = "", readonly = false, placeholder = "", onInput = null, name = "" } = {}) {
    const t = this._add(document.createElement("textarea"));
    t.spellcheck = false;
    t.autocomplete = "off";
    t.readOnly = readonly;
    t.value = value;
    t.placeholder = placeholder;
    if (name) t.dataset.net = name;
    if (onInput) t.addEventListener("input", () => onInput(t.value));
    if (readonly) t.addEventListener("focus", () => t.select());
    return t;
  }

  row() {
    const r = this._add(document.createElement("div"));
    r.className = "net-row";
    return r;
  }

  button(row, label, onClick, { primary = false, name = "" } = {}) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "net-btn" + (primary ? " primary" : "");
    if (name) b.dataset.net = name;
    setDomText(b, label, { font: "GUI_1", colour: primary ? "#fff" : "#111", width: 400 });
    b.addEventListener("click", () => { if (!b.disabled) onClick(b); });
    row.append(b);
    return b;
  }

  relabel(b, label, primary = b.classList.contains("primary")) {
    setDomText(b, label, { font: "GUI_1", colour: primary ? "#fff" : "#111", width: 400 });
  }

  // la riga di stato (in fondo): kind info, ok, error
  status(text, kind = "info") {
    if (!this.statusEl) {
      this.statusEl = this._add(document.createElement("div"));
      this.statusEl.className = "net-status";
      this.statusEl.dataset.net = "status";
    }
    this.statusEl.dataset.kind = kind;
    this.statusEl.dataset.text = text || "";
    if (!text) { this.statusEl.replaceChildren(); return; }
    setDomText(this.statusEl, text, { font: "overdue", width: this.inner(), colour: kind === "error" ? "#9a1a10" : kind === "ok" ? "#2d6b2f" : "#333" });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    if (this.onClose) this.onClose();
    window.removeEventListener("keydown", this._esc, true);
    window.removeEventListener("keyup", this._esc, true);
    this.root.remove();
  }
}

// copia negli appunti (dove il browser lo permette; se no si seleziona il
// testo e si prova il comando di copia)
export async function copyText(textarea) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(textarea.value); return true; }
  } catch (e) { /* sotto */ }
  try {
    textarea.focus();
    textarea.select();
    return document.execCommand("copy");
  } catch (e) { return false; }
}

// la barra in alto (attese, avvisi): testo, o "" per toglierla
export function netBar(text, kind = "info") {
  style();
  let el = document.getElementById("net-bar");
  if (!el) {
    el = document.createElement("div");
    el.id = "net-bar";
    document.body.append(el);
  }
  el.hidden = !text;
  el.className = kind;
  el.dataset.text = text || "";
  if (text) setDomText(el, text, { font: "overdue", width: Math.min(window.innerWidth * 0.9, 720) - 32 });
}
