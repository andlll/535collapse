// [§9.207] Prova nel browser del menu di pausa (disegno dell'autore):
//   volumi    = musica ed effetti sono due cursori: trascinato quello della
//               musica fino al 70%, un clic su quello degli effetti al 30%;
//               i volumi nelle opzioni salvate, anche ricaricando la pagina
//   di prima  = un'opzione salvata con la musica spenta diventa volume 0
//   ordine    = suggerimenti, obiettivi, i due cursori, la lingua, Ricomincia,
//               Opzioni grafiche, Torna al menu (niente contatore FPS)
//   grafica   = il contatore FPS fra le opzioni grafiche, e funziona
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/pausevol.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const res = {};
let ok = true;
const check = (name, v) => { res[name] = v; if (!v) ok = false; };
await page.addInitScript(() => {
  if (!sessionStorage.getItem("pv")) { sessionStorage.setItem("pv", "1"); localStorage.setItem("535.settings", JSON.stringify({ v: 1, settings: { music: false, sfx: true } })); }
});
await page.goto(`${base}/index.html?room=sk_padus&seed=3`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
const vol = () => page.evaluate(() => ({ m: window.__pause.settings.musicVolume, s: window.__pause.settings.sfxVolume }));
const v0 = await vol();
check("di prima: la musica spenta e' a 0, gli effetti a 1", v0.m === 0 && v0.s === 1);
await page.mouse.move(640, 400);
await page.keyboard.press("Escape");
await page.waitForFunction(() => window.__pause.paused, null, { timeout: 20000 });
await page.waitForTimeout(500);
const rects = () => page.evaluate(() => window.__pause.rects.map((r) => ({ a: r.action, v: r.value, x: r.x, y: r.y, w: r.w, h: r.h })));
let R = await rects();
const order = R.filter((r) => r.a !== "language").map((r) => r.a + (r.a === "volume" ? ":" + r.v : ""));
res.ordine = order;
check("l'ordine: i cursori dopo gli obiettivi, Opzioni grafiche sopra Torna al menu, niente FPS",
  order.join() === "resume,saves,hints,objectives,volume:music,volume:sfx,restart,graphics,menu");
const sl = (k) => R.find((r) => r.a === "volume" && r.v === k);
const m = sl("music"), sx = sl("sfx"), at = (r, f) => r.x + r.h / 2 + (r.w - r.h) * f;
await page.mouse.move(at(m, 0.02), m.y + m.h / 2);
await page.mouse.down();
for (let k = 1; k <= 7; k++) { await page.mouse.move(at(m, 0.1 * k), m.y + m.h / 2); await page.waitForTimeout(60); }
await page.mouse.up();
await page.waitForTimeout(200);
await page.mouse.move(at(sx, 0.3), sx.y + sx.h / 2);
await page.mouse.down(); await page.waitForTimeout(100); await page.mouse.up();
await page.waitForTimeout(300);
const v1 = await page.evaluate(() => ({ m: window.__pause.settings.musicVolume, s: window.__pause.settings.sfxVolume, saved: JSON.parse(localStorage.getItem("535.settings")).settings }));
res.volumi = v1;
check("la musica al 70%, gli effetti al 30%, salvati", v1.m === 0.7 && v1.s === 0.3 && v1.saved.musicVolume === 0.7 && v1.saved.sfxVolume === 0.3
  && !("music" in v1.saved) && !("sfx" in v1.saved));
// le opzioni grafiche: il contatore FPS, acceso col clic
const g = (await rects()).find((r) => r.a === "graphics");
await page.mouse.click(g.x + g.w / 2, g.y + g.h / 2);
await page.waitForTimeout(400);
R = await rects();
const fps = R.find((r) => r.a === "fps");
check("il contatore FPS fra le opzioni grafiche", !!fps);
if (fps) { await page.mouse.click(fps.x + fps.w / 2, fps.y + fps.h / 2); await page.waitForTimeout(300); }
check("e si accende", (await page.evaluate(() => window.__game.g.fps_show)) === 1);
// ricaricata la pagina, i volumi restano
await page.reload();
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
const v2 = await vol();
check("ricaricata: i volumi restano", v2.m === 0.7 && v2.s === 0.3);
if (errs.length) { ok = false; res.errori = errs.slice(0, 5); }
console.log(JSON.stringify(res));
await browser.close();
if (!ok) { console.log("NON VA"); process.exit(1); }
console.log("ok");
