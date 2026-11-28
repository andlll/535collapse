// [§9.243] Prova nel browser degli arcieri di partenza nell'editor: con
// "Inserisci" una torre rossa con 2 arcieri e una fortezza blu con 3 (lo
// slider del riquadro "Arcieri dentro"); con "Sposta" la torre scelta a 1, e
// Ctrl+Z la rimette a 2; nella partita di prova la torre parte con 2 arcieri
// (e la bandiera) e la fortezza della CPU con 3.
// I file del gioco li serve Playwright dal disco (niente server).
//
//   node game/test/browser/edgarrison.mjs [cartella delle foto]
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
const slAt = (G, n, i) => [G.track[0] + ((G.track[1] - G.track[0]) * i) / (n - 1), G.track[2]];
const toScreen = ([x, y]) => E(([x, y]) => { const v = window.__editor.view; return [(x - v.x) / v.scale, (y - v.y) / v.scale]; }, [x, y]);
// la casella (della scheda edifici) di `key`, scelta col clic
const pickItem = async (key) => {
  const b = await E(() => window.__editor.catalogKeys().indexOf("buildings"));
  let P = await E(() => window.__editor.palette());
  await page.mouse.click((P.tabs[b].x1 + P.tabs[b].x2) / 2, (P.tabs[b].y1 + P.tabs[b].y2) / 2); await settle();
  await E((k) => { const E2 = window.__editor; E2.ed.sideFilter = k.split(":")[1]; }, key);
  for (let t = 0; t < 8; t++) {
    P = await E(() => window.__editor.palette());
    const cell = await E((k) => { const P = window.__editor.palette(), ed = window.__editor.ed; return P.cells.find((q) => window.__editor.itemKey(ed.cat, q.i) === k) || null; }, key);
    if (cell) { await page.mouse.click((cell.x1 + cell.x2) / 2, (cell.y1 + cell.y2) / 2); await settle(); return true; }
    if (!P.next) return false;
    await page.mouse.click((P.next[0] + P.next[2]) / 2, (P.next[1] + P.next[3]) / 2); await settle();
  }
  return false;
};
// la torre rossa con 2 arcieri (lo slider del riquadro, poi il clic sulla mappa)
check("la torre rossa scelta", await pickItem("torre:red"));
let FL = await E(() => window.__editor.fogLayout());
check("il riquadro degli arcieri dentro", !!FL && FL.groups.map((g) => g.key).join() === "garrison", JSON.stringify(FL && FL.groups.map((g) => g.key)));
await page.mouse.click(...slAt(FL.groups[0], 3, 2)); await settle();
await page.mouse.click(...(await toScreen([1300, 1100]))); await settle(300);
// la fortezza blu con 3
check("la fortezza blu scelta", await pickItem("castello:blue"));
FL = await E(() => window.__editor.fogLayout());
await page.mouse.click(...slAt(FL.groups[0], 5, 3)); await settle();
await page.mouse.click(...(await toScreen([1800, 1200]))); await settle(300);
const placed = () => E(() => window.__editor.scene.map.instances.filter((e) => e.object === "torre" || e.object === "castello").map((e) => [e.object, e.side, e.garrison || 0]));
check("messe con i loro arcieri", JSON.stringify(await placed()) === JSON.stringify([["torre", "red", 2], ["castello", "blue", 3]]), JSON.stringify(await placed()));
await E(() => window.__editor.view.centre(1550, 1100)); await settle(400);
await page.screenshot({ path: join(SHOTS, "ed_arcieri.png") });
// Sposta: la torre scelta, lo slider a 1; Ctrl+Z torna a 2
await E(() => { const E2 = window.__editor; E2.ed.pick = null; E2.ed.tool = "select"; E2.ed.sel = new Set(E2.scene.map.instances.filter((e) => e.object === "torre")); });
await settle(200);
FL = await E(() => window.__editor.fogLayout());
await page.mouse.click(...slAt(FL.groups[0], 3, 1)); await settle(300);
check("Sposta: la torre scelta con 1 arciere", (await placed())[0][2] === 1, JSON.stringify(await placed()));
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await settle(300);
check("Ctrl+Z: di nuovo 2", (await placed())[0][2] === 2);
// nel gioco: la torre rossa con 2 arcieri (e la sua bandiera), la fortezza della CPU con 3
await E(() => {
  const s = window.__editor.scene;
  s.add([{ object: "centro", x: 600, y: 3600, side: "red", scale_x: 1, scale_y: 1, rotation: 0 },
         { object: "centro", x: 5400, y: 3600, side: "blue", scale_x: 1, scale_y: 1, rotation: 0 }]);
  localStorage.setItem("535.skirmish", JSON.stringify({ fog: "none", daynight: "day", rain: "off", start: "A" }));
});
await E(() => { window.__editor.testMap(); }).catch(() => {});
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 }).catch(() => {});
const game = await E(() => {
  const G = window.__game;
  if (!G) return null;
  G.advance(3);
  const w = G.world, t = w.all("torre").next().value, c = w.all("enemy_castello").next().value;
  return { torre: t && t.npresidio, bandiera: t && t.flagged, castello: c && c.npresidio };
});
check("nel gioco: la torre con 2 arcieri e la bandiera, la fortezza della CPU con 3", game && game.torre === 2 && game.bandiera === 1 && game.castello === 3, JSON.stringify(game));
check("nessun errore nella pagina", !errs.length, errs.join(" | "));
await browser.close();
console.log(fails ? `${fails} prove fallite` : "tutto bene");
process.exit(fails ? 1 : 0);
