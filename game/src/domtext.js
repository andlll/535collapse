// Testo dei messaggi HTML (caricamento, avvisi del motore, conferme dei
// salvataggi) col font del gioco. [Correzione decisa dall'autore, §6.1
// n.86] Il font (Seagram tfb) c'e' solo come bitmap nell'atlas `gui`
// (tools/05_atlas.py), non come TTF: qui si disegnano i suoi glifi in un
// canvas 2D, senza WebGL, cosi' anche l'avviso "WebGL2 assente" lo usa.
// Finche' l'immagine non e' pronta resta il testo semplice dell'elemento.

import { plain } from "./draw.js";

let font = null;      // { atlas, img } quando pronto
let loading = null;
const pending = new Map(); // elemento -> [testo, opzioni]

export function loadDomFont(base = "assets/") {
  if (loading) return loading;
  loading = (async () => {
    const atlas = await (await fetch(base + "atlas.json")).json();
    const page = atlas.groups.gui.pages[0];
    const img = new Image();
    img.src = base + page.file;
    await img.decode();
    font = { atlas, img };
    for (const [el, [text, opts]] of pending) setDomText(el, text, opts);
    pending.clear();
  })().catch(() => { /* resta il testo semplice */ });
  return loading;
}

// Scrive `text` in `el` col font `opts.font` (GUI_1, overdue, gui_sblocco),
// colore CSS `opts.colour`, a capo entro `opts.width` pixel CSS.
export function setDomText(el, text, opts = {}) {
  el.setAttribute("aria-label", text);
  if (!font) {
    el.textContent = text;
    pending.set(el, [text, opts]);
    return;
  }
  const f = font.atlas.fonts[opts.font || "overdue"];
  const spr = font.atlas.sprites[f.sprite].frames[0].rect;
  const width = opts.width || 600;
  const adv = (ch) => (f.glyphs[ch.charCodeAt(0)] || [0, 0, 0, 0, 0])[4];
  const measure = (s) => [...s].reduce((a, ch) => a + adv(ch), 0);
  const lines = [];
  for (const para of plain(String(text)).split("\n")) {
    let cur = "";
    for (const word of para.split(" ")) {
      const next = cur ? cur + " " + word : word;
      if (cur && measure(next) > width) { lines.push(cur); cur = word; } else cur = next;
    }
    lines.push(cur);
  }
  const lh = f.height;
  const W = Math.max(1, Math.ceil(Math.max(...lines.map(measure))));
  const H = lines.length * lh;
  const k = Math.min(window.devicePixelRatio || 1, 2);
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(W * k);
  cv.height = Math.ceil(H * k);
  cv.style.width = W + "px";
  cv.style.height = H + "px";
  cv.style.display = "block";
  cv.style.margin = opts.center === false ? "0" : "0 auto";
  const ctx = cv.getContext("2d");
  ctx.scale(k, k);
  lines.forEach((line, n) => {
    let x = opts.center === false ? 0 : (W - measure(line)) / 2;
    for (const ch of line) {
      const g = f.glyphs[ch.charCodeAt(0)];
      if (!g) continue;
      const [gx, gy, gw, gh, shift, off, yoff = 0] = g;
      if (gw && gh) ctx.drawImage(font.img, spr[0] + gx, spr[1] + gy, gw, gh, x + off, n * lh + yoff, gw, gh);
      x += shift;
    }
  });
  // i glifi sono bianchi: si colorano tenendo solo la loro forma
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = opts.colour || "#fff";
  ctx.fillRect(0, 0, W, H);
  el.replaceChildren(cv);
}
