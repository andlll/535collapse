// [§9.213] La prova di stile delle montagne del generatore
// (game/src/mountains.js): fogli PNG con le montagne generate (una cresta,
// una base fatta dal generatore o disegnata a mano, altezza, larghezza,
// asperita', dettaglio, seme) accanto ai disegni dell'autore, per
// giudicarne la resa prima di metterle nel gioco e nell'editor.
// Disegna con il canvas 2D del browser (il gioco le cuocera' nel suolo con
// il suo renderer: stesse facce, stessa luce, stesso inchiostro).
//
//   python3 tools/01_unpack.py && python3 tools/20_montagne.py
//   node tools/21_prova_montagne.mjs [cartella]      (predefinita: build/prova_montagne)
// Playwright come le prove nel browser (PLAYWRIGHT_MODULE se non e' nel progetto).
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(process.argv[2] || join(ROOT, "build", "prova_montagne"));
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);

// I fogli: celle con un titolo, le montagne (coordinate della cella) e/o un
// disegno dell'autore; `show`: la cresta (rossa) e la base (blu) sopra
const C = (title, w, h, ms, more = {}) => Object.assign({ title, w, h, ms }, more);
const ref = (n, w, h) => C(`montagna${n} (disegno)`, w, h, [], { ref: `gmx/sprites/images/montagna${n}_0.png` });
const one = (x, y, o = {}) => Object.assign({ crest: [[x, y]], seed: 7 }, o);
const SHEETS = {
  "1_confronto": { cols: 2, cells: [
    ref(6, 964, 591),
    C("una cima, larghezza 620, altezza 300", 964, 591, [one(470, 70, { width: 620, height: 300, seed: 11 })]),
    ref(8, 899, 361),
    C("cresta di 2 punti, larghezza 300, altezza 150", 899, 361, [{ crest: [[300, 70], [600, 50]], width: 300, height: 150, seed: 5 }]),
    ref(4, 1493, 825),
    C("cresta di 4 punti, larghezza 480, altezza 260", 1493, 825, [{ crest: [[260, 230], [560, 150], [900, 190], [1200, 250]], width: 480, height: 260, seed: 21 }]),
  ] },
  "2_altezza_larghezza": { cols: 3, cells: [
    ...[140, 260, 400].map((h) => C(`altezza ${h} (larghezza 420)`, 900, 700, [{ crest: [[300, 120], [600, 90]], width: 420, height: h, seed: 3 }])),
    ...[260, 420, 640].map((w) => C(`larghezza ${w} (altezza 240)`, 900, 700, [{ crest: [[300, 120], [600, 90]], width: w, height: 240, seed: 3 }])),
  ] },
  "3_asperita_dettaglio": { cols: 3, cells: [
    ...[0, 0.5, 1].map((r) => C(`asperita' ${r}`, 900, 640, [{ crest: [[300, 130], [600, 100]], width: 440, height: 240, rough: r, seed: 9 }])),
    ...[0, 0.5, 1].map((d) => C(`dettaglio ${d}`, 900, 640, [{ crest: [[300, 130], [600, 100]], width: 440, height: 240, detail: d, seed: 9 }])),
  ] },
  "4_semi": { cols: 3, cells: [1, 2, 3, 4, 5, 6].map((s) => C(`seme ${s}`, 900, 640, [{ crest: [[270, 140], [450, 80], [630, 130]], width: 420, height: 250, seed: s }])) },
  "5_due_passi": { cols: 2, cells: (() => {
    const crest = [[300, 110], [520, 60], [760, 90]];
    const base = [[120, 330], [230, 260], [420, 250], [600, 230], [820, 260], [930, 370], [880, 520], [700, 580], [560, 510], [420, 600], [220, 570]];
    return [
      C("passo 1: la cresta (rossa), la base del generatore (blu)", 1050, 700, [{ crest, width: 420, height: 260, seed: 4 }], { show: true }),
      C("passo 2: la base disegnata a mano (blu)", 1050, 700, [{ crest, base, height: 260, seed: 4 }], { show: true }),
      C("passo 1, il risultato", 1050, 700, [{ crest, width: 420, height: 260, seed: 4 }]),
      C("passo 2, il risultato", 1050, 700, [{ crest, base, height: 260, seed: 4 }]),
    ];
  })() },
  "6_catene": { cols: 2, cells: [
    C("catena diagonale", 1050, 1000, [{ crest: [[180, 560], [380, 440], [600, 340], [850, 210]], width: 380, height: 260, seed: 12 }]),
    C("catena a curva, cime diverse", 1050, 1000, [{ crest: [[160, 150], [380, 60], [620, 90], [820, 230], [860, 400]], peaks: [0.6, 1.2, 0.8, 1, 0.5], width: 360, height: 260, seed: 8 }]),
  ] },
};

const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#222">
<canvas id="c"></canvas>
<script type="module">
import { mountainGeometry } from "/game/src/mountains.js";
const load = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
window.sheet = async (S) => {
  const rock = await load("/nuovi/montagne/roccia.png");
  const PAD = 16, TT = 34;
  const rows = Math.ceil(S.cells.length / S.cols);
  const colW = [], rowH = [];
  S.cells.forEach((c, i) => { const cx = i % S.cols, cy = Math.floor(i / S.cols); colW[cx] = Math.max(colW[cx] || 0, c.w); rowH[cy] = Math.max(rowH[cy] || 0, c.h + TT); });
  const W = colW.reduce((a, b) => a + b + PAD, PAD), H = rowH.reduce((a, b) => a + b + PAD, PAD);
  const cv = document.getElementById("c"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#2b2b2b"; ctx.fillRect(0, 0, W, H);
  const pat = ctx.createPattern(rock, "repeat");
  let y = PAD;
  for (let r = 0; r < rows; r++) {
    let x = PAD;
    for (let c = 0; c < S.cols; c++) {
      const cell = S.cells[r * S.cols + c];
      if (!cell) break;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = "#eee"; ctx.font = "20px sans-serif"; ctx.fillText(cell.title, 4, 24);
      ctx.translate(0, TT);
      ctx.beginPath(); ctx.rect(0, 0, cell.w, cell.h); ctx.clip();
      ctx.fillStyle = "#c4ba96"; ctx.fillRect(0, 0, cell.w, cell.h);
      if (cell.ref) ctx.drawImage(await load("/" + cell.ref), 0, 0);
      for (const m of cell.ms) {
        const g = mountainGeometry(m);
        draw(ctx, g, pat);
        if (cell.show) {
          ctx.strokeStyle = "rgba(30,90,220,0.9)"; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
          ctx.beginPath(); g.base.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
          ctx.setLineDash([]);
          if (m.base) { ctx.strokeStyle = "rgba(30,90,220,0.5)"; ctx.beginPath(); m.base.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); }
          ctx.strokeStyle = "rgba(220,40,30,0.95)"; ctx.lineWidth = 3;
          ctx.beginPath(); g.crest.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
          ctx.fillStyle = "rgba(220,40,30,0.95)";
          for (const p of m.crest) { ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.fill(); }
          // i piedi delle cime sul terreno
          ctx.fillStyle = "rgba(220,40,30,0.6)";
          for (const p of g.feet) { ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill(); }
          ctx.lineWidth = 1; ctx.beginPath(); m.crest.forEach((p, i) => { const q = g.crest[0]; });
        }
      }
      ctx.restore();
      x += colW[c] + PAD;
    }
    y += rowH[r] + PAD;
  }
  return cv.toDataURL("image/png");
};
function draw(ctx, g, pat) {
  for (const L of g.layers) {
    if (L.face) {
      ctx.beginPath(); L.face.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      pat.setTransform(new DOMMatrix().translate(L.tex[0], L.tex[1]).rotate(L.tex[2] * 180 / Math.PI));
      ctx.fillStyle = pat; ctx.strokeStyle = pat; ctx.lineWidth = 1.2; ctx.fill(); ctx.stroke();
      const a = 1 - L.shade;
      ctx.fillStyle = ctx.strokeStyle = "rgba(20,24,28," + a.toFixed(3) + ")"; ctx.fill(); ctx.stroke();
    } else {
      // l'inchiostro: ogni pezzo (tratto e giuntura tonda) pieno, senza
      // trasparenza (non si somma dove i pezzi si sovrappongono)
      const P = L.ink;
      ctx.fillStyle = "rgb(30,30,30)";
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * a.ink / 2, a.y + ny * a.ink / 2); ctx.lineTo(b.x + nx * b.ink / 2, b.y + ny * b.ink / 2);
        ctx.lineTo(b.x - nx * b.ink / 2, b.y - ny * b.ink / 2); ctx.lineTo(a.x - nx * a.ink / 2, a.y - ny * a.ink / 2); ctx.closePath();
        ctx.fill();
      }
      for (const p of P) { ctx.beginPath(); ctx.arc(p.x, p.y, p.ink / 2, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}
window.ready = true;
</script>`;

const TYPES = { ".js": "text/javascript", ".png": "image/png", ".html": "text/html" };
const browser = await chromium.launch();
const page = await browser.newPage();
await page.route("http://prova.local/**", (route) => {
  const p = new URL(route.request().url()).pathname;
  if (p === "/") return route.fulfill({ body: PAGE, contentType: "text/html" });
  try {
    route.fulfill({ body: readFileSync(join(ROOT, decodeURIComponent(p))), contentType: TYPES[p.slice(p.lastIndexOf("."))] || "application/octet-stream" });
  } catch { route.fulfill({ status: 404, body: "" }); }
});
page.on("pageerror", (e) => console.error("errore nella pagina:", e.message));
await page.goto("http://prova.local/");
await page.waitForFunction(() => window.ready);
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(3);
for (const [name, S] of Object.entries(SHEETS)) {
  if (only.length && !only.includes(name)) continue;
  const url = await page.evaluate((s) => window.sheet(s), S);
  const f = join(OUT, `${name}.png`);
  writeFileSync(f, Buffer.from(url.split(",")[1], "base64"));
  console.log(f);
}
await browser.close();
