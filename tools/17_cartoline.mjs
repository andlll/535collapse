// [§9.121, disegno dell'autore] La foto di ogni mappa della schermaglia per
// la schermata del menu: il gioco vero, senza nebbia, di giorno e senza
// pioggia, la vista centrata nel punto `shot` della mappa (skirmish.js
// SK_MAPS) con la vista piu' larga, un ritaglio 3:2 al centro dello schermo
// (lontano dall'interfaccia e dal puntatore).
// Scrive nuovi/sprites/<room>_cartolina.png; poi tools/05_atlas.py la mette
// nell'atlas (gruppo campagna, quello del menu).
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node tools/17_cartoline.mjs [room ...]
// Playwright come le prove nel browser (PLAYWRIGHT_MODULE se non e' nel progetto).
import { SK_MAPS } from "../game/src/skirmish.js";
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const rooms = process.argv.slice(2).length ? process.argv.slice(2) : SK_MAPS.filter((m) => m.room).map((m) => m.room);
const W = 720, H = 480;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const room of rooms) {
  const m = SK_MAPS.find((q) => q.room === room);
  const VW = 1600, VH = 900; // piu' grande del ritaglio: l'interfaccia resta fuori
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  await page.addInitScript(() => {
    localStorage.setItem("535.skirmish", JSON.stringify({ fog: "none", daynight: "day", rain: "off", start: "A" }));
  });
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  await page.evaluate(([x, y]) => {
    const G = window.__game, w = G.world;
    // niente unita' ne' suggerimenti nella foto
    for (const u of [...w.all("ally_unit"), ...w.all("enemy_unit"), ...w.all("parent_hint")]) w.destroy(u);
    for (const n of ["enemy_eco", "sk_manager"]) for (const e of [...w.all(n)]) w.destroy(e);
    G.cam.follow = null;
    G.g.obj = 0;
    G.advance(2);
    G.cam.x = x - G.cam.w / 2; G.cam.y = y - G.cam.h / 2;
    w.input.x = 4; w.input.y = 4; w.input.inside = false; // il puntatore (e il suo bagliore) fuori dal ritaglio
    G.loop.start();
  }, m.shot);
  await page.addStyleTag({ content: "#message{display:none !important}" });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { const G = window.__game; G.cam.zoomTo(1.7, G.cam.cssW / 2, G.cam.cssH / 2); });
  await page.waitForTimeout(1500);
  // tutto visibile (le risorse si vedono solo scoperte, e unita' non ce ne sono)
  await page.evaluate(([x, y]) => {
    const G = window.__game, w = G.world;
    G.cam.x = x - G.cam.w / 2; G.cam.y = y - G.cam.h / 2;
    w.hooks.photo = () => { for (const i of w.instances) if (i.visible === false) i.visible = true; };
    const step = w.step.bind(w);
    w.step = (...a) => { step(...a); w.hooks.photo(); };
  }, m.shot);
  await page.waitForTimeout(600);
  console.log(await page.evaluate(() => { const c = window.__game.cam; return "scala " + c.scaleview + ", vista " + Math.round(c.w) + " x " + Math.round(c.h); }));
  const out = new URL(`../nuovi/sprites/${room}_cartolina.png`, import.meta.url).pathname;
  await page.screenshot({ path: out, clip: { x: (VW - W) / 2, y: (VH - H) / 2, width: W, height: H } });
  console.log(out);
  await page.close();
}
await browser.close();
