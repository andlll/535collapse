// [§9.156, richiesta dell'autore] La chat della partita online: Invio la
// apre (una casella di testo in basso a sinistra, sopra la minimappa), Invio
// spedisce, Esc chiude. I messaggi compaiono a sinistra fra il pannello
// delle risorse e la minimappa (manager.js chatArea), del colore di chi li
// scrive, e svaniscono dopo SHOW ms (con la casella aperta si vedono gli
// ultimi tutti). Viaggiano sul canale della partita ({t: "C"},
// lockstep.js sendChat) ma fuori dal lockstep: non toccano la partita.
//
// I tasti battuti nella casella non arrivano al gioco (input.js ascolta la
// finestra: qui si fermano), cosi' un "q" scritto non mette in coda un
// civile.
//
// [§9.158, richiesta dell'autore] Niente "Rosso:"/"Blu:" davanti ai messaggi
// (lo dice il colore): al loro posto il ritratto tondo dei dialoghi della
// campagna, il soldato del giocatore (capoccia_a1) per il rosso e quello
// nemico, blu (capoccia_n1), per il blu. I messaggi del gioco senza.

import { c, makeColourRgb } from "./colours.js";
import { tr } from "./i18n.js";
import { CHAT_MAX } from "./lockstep.js";
import { audio } from "./audio.js"; // §9.171
const SHOW = 15000, FADE = 3000;       // ms: un messaggio si vede, poi svanisce
const KEEP = 40;                       // messaggi tenuti
const LINE = 21;                       // px fra le righe
const COLOURS = [makeColourRgb(150, 32, 22), makeColourRgb(28, 70, 170)]; // rosso, blu
const SYSTEM = makeColourRgb(70, 70, 70);
const FACES = ["capoccia_a1", "capoccia_n1"]; // rosso, blu (60 x 60, tondi)
const FACE = 26;                       // px: il ritratto disegnato
const FACE_GAP = 8;                    // px fra il ritratto e il testo

const CSS = `
#chat-input { position: fixed; z-index: 8; box-sizing: border-box; height: 34px; padding: 0 14px; border: 0;
  border-radius: 17px; background: rgba(255, 255, 255, .92); box-shadow: 0 1px 6px rgba(0, 0, 0, .3);
  font: 15px system-ui, sans-serif; color: #111; -webkit-user-select: text; user-select: text; outline: none; }
#chat-input:focus { box-shadow: 0 0 0 2px rgba(76, 175, 80, .7), 0 1px 6px rgba(0, 0, 0, .3); }
`;

export class Chat {
  // local: 0 (rosso) o 1 (blu); send(text): manda all'altro (false se non si
  // puo'); can(): si puo' scrivere adesso?
  constructor({ local, send, can }) {
    this.local = local;
    this.sendFn = send;
    this.can = can;
    this.log = [];      // { who: 0 | 1 | null, text, t }
    this.input = null;
    this._key = (e) => {
      if (e.code !== "Enter" && e.code !== "NumpadEnter") return;
      if (this.input || !this.can() || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (document.querySelector(".net-overlay")) return; // un pannello della rete aperto
      e.preventDefault();
      e.stopPropagation();
      this.open();
    };
    window.addEventListener("keydown", this._key, true);
  }

  add(who, text) {
    const s = String(text).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, CHAT_MAX);
    if (!s) return false;
    this.log.push({ who, text: s, t: performance.now() });
    if (this.log.length > KEEP) this.log.shift();
    return true;
  }
  // [§9.171] il messaggio dell'altro, col suo suono (audio.js ui)
  receive(text) { if (this.add(1 - this.local, text)) audio.ui("chat"); }
  system(text) { this.add(null, text); }

  open() {
    if (!document.getElementById("chat-style")) {
      const st = document.createElement("style");
      st.id = "chat-style";
      st.textContent = CSS;
      document.head.append(st);
    }
    const el = document.createElement("input");
    el.id = "chat-input";
    el.type = "text";
    el.maxLength = CHAT_MAX;
    el.autocomplete = "off";
    el.spellcheck = false;
    el.placeholder = tr("Message to the other player (Enter: send, Esc: close)");
    for (const ev of ["keyup", "keypress"]) el.addEventListener(ev, (e) => e.stopPropagation());
    el.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        const text = el.value.trim();
        if (text && this.sendFn(text)) this.add(this.local, text);
        this.close();
      } else if (e.code === "Escape") {
        e.preventDefault();
        this.close();
      }
    });
    el.addEventListener("blur", () => setTimeout(() => { if (this.input === el && document.activeElement !== el) this.close(); }, 0));
    document.body.append(el);
    this.input = el;
    this._at = null; // una casella nuova: la posizione si rimette
    this._place();
    el.focus();
  }

  close() {
    const el = this.input;
    this.input = null;
    if (el) el.remove();
  }

  _place() {
    const el = this.input, a = this.area;
    if (!el || !a) return;
    const k = [a.x, a.bottom, a.w].join();
    if (k === this._at) return;
    this._at = k;
    Object.assign(el.style, { left: a.x + "px", top: a.bottom - 34 + "px", width: a.w + "px" });
  }

  // i messaggi, nell'interfaccia (pixel CSS); area: manager.chatArea
  draw(d, area) {
    this.area = area;
    this._place();
    const now = performance.now(), open = !!this.input;
    const shown = [];
    for (let k = this.log.length - 1; k >= 0; k--) {
      const m = this.log[k], age = now - m.t;
      const a = open ? 1 : age < SHOW ? 1 : age < SHOW + FADE ? 1 - (age - SHOW) / FADE : 0;
      if (a <= 0 && !open) break;
      shown.push([m, a]);
    }
    if (!shown.length) return;
    d.setFont("overdue");
    d.setHalign("left");
    d.setValign("top");
    const tx = FACE + FACE_GAP, bottom = area.bottom - (open ? 42 : 0);
    let y = bottom, top = bottom, alpha = 0;
    const rows = [];
    for (const [m, a] of shown) {
      // ("#" nel testo del gioco va a capo, come in GameMaker: qui no)
      const str = m.text.replace(/#/g, " "), face = m.who !== null;
      const w = area.w - 24 - (face ? tx : 0);
      const h = Math.max(face ? FACE : LINE, d.stringHeightExt(str, LINE, w));
      if (y - h < area.top) break;
      y -= h + 6;
      rows.push([str, y, h, w, m, a]);
      top = y;
      alpha = Math.max(alpha, a);
    }
    if (!rows.length) return;
    d.setAlpha(0.55 * alpha);
    d.roundrectColourExt(area.x, top - 8, area.x + area.w, bottom + 2, 30, 30, c.white, c.white, false);
    const s = FACE / 60;
    for (const [str, yy, h, w, m, a] of rows) {
      let x = area.x + 12;
      if (m.who !== null) {
        // il ritratto in alto, accanto alla prima riga (che ci sta centrata)
        d.spriteExt(FACES[m.who], 0, x + FACE / 2, yy + FACE / 2, s, s, 0, c.white, a);
        x += tx;
      }
      d.setColour(m.who === null ? SYSTEM : COLOURS[m.who]);
      d.setAlpha(0.95 * a);
      d.textExt(x, yy, str, LINE, w);
    }
    d.setAlpha(1);
    d.setColour(c.white);
    d.setHalign("left");
    d.setValign("middle");
  }

  destroy() {
    this.close();
    window.removeEventListener("keydown", this._key, true);
  }
}
