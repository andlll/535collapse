// [§9.227] Prova nel browser di "Inserisci": le quattro statue sono una
// casella con quattro stili (S li cambia); il dado degli stili: spento, tre
// statue messe hanno lo stesso stile; acceso, lo stile cambia a ogni
// inserimento (mai due di fila uguali). (Le mura col dado non cambiano verso:
// i loro "stili" sono i due versi.)
// I file del gioco li serve Playwright dal disco (niente server).
//
//   node game/test/browser/edinsert.mjs [cartella delle foto]
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const GAME = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SHOTS = resolve(process.argv[2] || join(GAME, "..", "build", "prova_montagne"));
mkdirSync(SHOTS, { recursive: true });
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const TYPES = { ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".html": "text/html",
                ".css": "text/css", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".map": "application/json" };
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.route("http://prova.local/**", (route) => {
  const p = decodeURIComponent(new URL(route.request().url()).pathname);
  try { route.fulfill({ body: readFileSync(join(GAME, p === "/" ? "index.html" : p)), contentType: TYPES[p.slice(p.lastIndexOf("."))] || "application/octet-stream" }); }
  catch { route.fulfill({ status: 404, body: "" }); }
});
const page = await ctx.newPage();
// [§9.199] In CI (grafica emulata) un fotogramma puo' durare centinaia di
// ms: due clic, o un clic e un tasto, potevano finire nello stesso passo e
// contare come uno. Dopo ogni azione del mouse e della tastiera si aspetta
// che l'editor abbia letto l'input (window.__editor.reads) almeno una volta
// in piu' (come editor.mjs e skcustom.mjs).
const syncInput = (page) => {
  const reads = () => page.evaluate(() => { const o = window.__editor || window.__game; return o && o.ready && typeof o.reads === "number" ? o.reads : null; }).catch(() => null);
  const after = async (n0) => {
    if (n0 === null) return;
    await page.waitForFunction((n) => { const o = window.__editor || window.__game; return !o || typeof o.reads !== "number" || o.reads > n; }, n0, { timeout: 15000, polling: 10 }).catch(() => {});
  };
  for (const [obj, names] of [[page.mouse, ["move", "down", "up", "wheel", "click", "dblclick"]], [page.keyboard, ["down", "up", "press"]]]) {
    for (const m of names) {
      const orig = obj[m].bind(obj);
      obj[m] = async (...a) => { const n0 = await reads(); const r = await orig(...a); await after(n0); return r; };
    }
  }
  // il clic: il puntatore sopra, poi giu' e su, ognuno letto in un passo
  // suo (click di Playwright li manda insieme: un pulsante non vedeva il
  // puntatore arrivare)
  page.mouse.click = async (x, y, { button = "left" } = {}) => { await page.mouse.move(x, y); await page.mouse.down({ button }); await page.mouse.up({ button }); };
};
syncInput(page);
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const check = (name, ok, extra = "") => { console.log((ok ? "ok   " : "FAIL ") + name + (extra ? "  " + extra : "")); if (!ok) fails++; };
const E = (fn, arg) => page.evaluate(fn, arg);
const settle = (ms = 150) => page.waitForTimeout(ms);
await page.goto("http://prova.local/index.html?room=editor");
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
await E(() => { const v = window.__editor.view; v.zoomAt(1, 0, 0); v.centre(1500, 1200); });
const btn = await E(() => window.__editor.layout().buttons.find((b) => b.key === "insert"));
await page.mouse.click(btn.x, btn.y); await settle();
await page.waitForFunction(() => window.__editor.catalog() === "ready", null, { timeout: 120000 });
const P0 = await E(() => window.__editor.palette());
const city = await E(() => window.__editor.catalogKeys().indexOf("city"));
await page.mouse.click((P0.tabs[city].x1 + P0.tabs[city].x2) / 2, (P0.tabs[city].y1 + P0.tabs[city].y2) / 2); await settle();
const cell = await E(() => { const P = window.__editor.palette(), ed = window.__editor.ed; return P.cells.find((q) => window.__editor.itemKey(ed.cat, q.i) === "statue"); });
check("le statue: una casella", !!cell);
await page.mouse.click((cell.x1 + cell.x2) / 2, (cell.y1 + cell.y2) / 2); await settle();
check("con quattro stili", (await E(() => window.__editor.pickedItem().styles.length)) === 4);
const statues = () => E(() => window.__editor.scene.map.instances.filter((e) => e.object.startsWith("o_statua")).map((e) => e.object));
const toScreen = ([x, y]) => E(([x, y]) => { const v = window.__editor.view; return [(x - v.x) / v.scale, (y - v.y) / v.scale]; }, [x, y]);
for (let k = 0; k < 3; k++) { const [sx, sy] = await toScreen([1100 + k * 250, 1000]); await page.mouse.click(sx, sy); await settle(); }
const off = await statues();
check("dado spento: lo stesso stile", off.length === 3 && new Set(off).size === 1, off.join());
const D = await E(() => window.__editor.diceLayout());
await page.mouse.move((D[0] + D[2]) / 2, (D[1] + D[3]) / 2); await settle(); await page.mouse.click((D[0] + D[2]) / 2, (D[1] + D[3]) / 2); await settle();
check("il dado acceso", await E(() => window.__editor.ed.dice));
await page.screenshot({ path: join(SHOTS, "dado.png"), clip: { x: D[0] - 300, y: D[1] - 60, width: D[2] - D[0] + 320, height: 110 } });
for (let k = 0; k < 6; k++) { const [sx, sy] = await toScreen([900 + k * 180, 1250]); await page.mouse.click(sx, sy); await settle(); }
const on = (await statues()).slice(3);
check("dado acceso: lo stile cambia a ogni inserimento", on.length === 6 && on.every((o, k) => k === 0 || o !== on[k - 1]), on.join());
check("nessun errore nella pagina", !errs.length, errs.join(" | "));
await browser.close();
console.log(fails ? `${fails} prove fallite` : "tutto bene");
process.exit(fails ? 1 : 0);
