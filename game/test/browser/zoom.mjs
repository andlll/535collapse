// Prova nel browser dello zoom morbido (§9.83), nel match, con eventi veri
// (rotella del mouse di Playwright, X e Z da tastiera):
// (scaleview: px di room per px dello schermo; 1 e' lo zoom piu' vicino)
//   rotella    uno scatto in giu' (100 px) allontana di 0,1 in piu' passi,
//              con valori intermedi, senza tornare indietro, e il punto di
//              room sotto il puntatore resta li' per tutto il movimento
//   due scatti di fila (il secondo a meta' movimento) si sommano: 0,2
//   touchpad   delta piccoli (12 x -10 px) avvicinano di 0,12, senza
//              arrotondare
//   limiti     dieci scatti in giu' si fermano a ZOOM_MAX, dieci in su a 1
//   tasti      X allontana di 0,1 in piu' passi, Z avvicina
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/zoom.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
await page.evaluate(() => {
  const G = window.__game;
  G.advance(3);
  for (const d of [...G.world.all("parent_hint")]) G.world.destroy(d);
  G.cam.x = 2000; G.cam.y = 2000; G.cam.clamp();
  G.loop.render(); // il canvas resta nascosto (e senza eventi) fino al primo fotogramma
});
const PX = 640, PY = 360;
await page.mouse.move(PX, PY);
// n passi, registrando zoom e punto di room sotto il puntatore
const steps = (n) => page.evaluate(([n, px, py]) => {
  const G = window.__game, out = [];
  for (let k = 0; k < n; k++) { G.advance(1); const [rx, ry] = G.cam.toRoom(px, py); out.push([G.cam.scaleview, rx, ry]); }
  return out;
}, [n, PX, PY]);
const zoom = () => page.evaluate(() => window.__game.cam.scaleview);
const res = {}, near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// rotella: uno scatto in giu' (deltaY 100) = allontana
const [rx0, ry0] = await page.evaluate(([px, py]) => window.__game.cam.toRoom(px, py), [PX, PY]);
const z0 = await zoom();
await page.mouse.wheel(0, 100);
const tr = await steps(40);
res.rotella = {
  da: z0, a: tr.at(-1)[0],
  intermedi: tr.filter(([s]) => s > z0 && s < z0 + 0.1 - 0.005).length,
  monotono: tr.every(([s], k) => k === 0 || s >= tr[k - 1][0]),
  puntoFermo: Math.max(...tr.map(([, x, y]) => Math.hypot(x - rx0, y - ry0))),
};
res.rotella.ok = near(res.rotella.a, z0 + 0.1) && res.rotella.intermedi >= 4 && res.rotella.monotono && res.rotella.puntoFermo < 0.5;

// due scatti di fila: il secondo a meta' movimento
const z1 = await zoom();
await page.mouse.wheel(0, 100);
await steps(3);
await page.mouse.wheel(0, 100);
await steps(40);
res.dueScatti = { da: z1, a: await zoom() };
res.dueScatti.ok = near(res.dueScatti.a, Math.round((z1 + 0.2) * 10) / 10);

// touchpad: 12 delta da 10 px verso l'alto = avvicina di 0,12
const z2 = await zoom();
for (let k = 0; k < 12; k++) await page.mouse.wheel(0, -10);
await steps(40);
res.touchpad = { da: z2, a: await zoom() };
res.touchpad.ok = near(res.touchpad.a, z2 - 0.12, 1e-6);

// limiti
for (let k = 0; k < 10; k++) await page.mouse.wheel(0, 100);
await steps(60);
const zMax = await zoom();
for (let k = 0; k < 10; k++) await page.mouse.wheel(0, -100);
await steps(60);
const zMin = await zoom();
res.limiti = { max: zMax, min: zMin, ok: near(zMax, 1.7) && near(zMin, 1) };

// tasti: X allontana, Z avvicina, in piu' passi
await page.keyboard.press("x");
const tx = await steps(40);
const zx = await zoom();
await page.keyboard.press("z");
await steps(40);
res.tasti = { x: zx, z: await zoom(), intermedi: tx.filter(([s]) => s > 1.005 && s < 1.095).length };
res.tasti.ok = near(zx, 1.1) && near(res.tasti.z, 1) && res.tasti.intermedi >= 4;

let ok = errs.length === 0;
for (const [k, v] of Object.entries(res)) { console.log(k.padEnd(10), JSON.stringify(v), v.ok ? "" : "NON VA"); ok = ok && v.ok; }
if (errs.length) console.log("errori:", errs.slice(0, 2).join(" "));
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
