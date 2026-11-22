// [§9.180] Prova nel browser dell'editor di mappe (lo scheletro): dal menu,
// "Single player" -> "Map editor" apre ?room=editor; la mappa vuota e la
// colonna si disegnano senza errori; un clic su uno strumento lo sceglie, i
// tasti 1-4 anche; la rotella fa lo zoom tenendo fermo il punto sotto il
// puntatore; il tasto centrale trascina la vista; [§9.181] "Apri mappa"
// carica Padania col motore del gioco, e da lontano la si vede tutta; Esc
// torna al menu.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/editor.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const W = 1600, H = 900;
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const click = async (x, y) => {
  await page.mouse.move(x, y); await page.waitForTimeout(150);
  await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up(); await page.waitForTimeout(150);
};
const res = {};
let ok = true;
const check = (name, v) => { res[name] = v; if (!v) ok = false; };

// il menu: la colonna dei pulsanti (menu.js titleButtons: alti 70, 20 fra
// l'uno e l'altro, l'ultimo a 100 px dal fondo)
await page.goto(`${base}/index.html?room=menu`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const colTop = (n) => H - 100 - n * 70 - (n - 1) * 20;
await click(W / 2, colTop(4) + 90 + 35); // "Single player" (secondo di quattro)
await click(W / 2, colTop(3) + 180 + 35); // "Map editor" (terzo di tre)
await page.waitForURL(/room=editor/, { timeout: 20000 });
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
check("aperto dal menu", true);

// uno strumento col clic, uno coi tasti
const L = await page.evaluate(() => window.__editor.layout());
const btn = (key) => L.buttons.find((b) => b.key === key);
await click(btn("brush").x, btn("brush").y);
check("clic sul pennello", (await page.evaluate(() => window.__editor.ed.tool)) === "brush");
await page.mouse.move(800, 400);
await page.keyboard.press("Digit4");
await page.waitForTimeout(150);
check("tasto 4: inserisci", (await page.evaluate(() => window.__editor.ed.tool)) === "insert");

// la rotella: lo zoom cambia, il punto sotto il puntatore resta li'
const before = await page.evaluate(() => ({ s: window.__editor.view.scale, p: window.__editor.view.toRoom(800, 400) }));
for (let k = 0; k < 3; k++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(80); }
await page.waitForTimeout(200);
const after = await page.evaluate(() => ({ s: window.__editor.view.scale, p: window.__editor.view.toRoom(800, 400) }));
check("zoom indietro", after.s > before.s * 1.3);
check("punto fermo", Math.abs(after.p[0] - before.p[0]) < 2 && Math.abs(after.p[1] - before.p[1]) < 2);

// il tasto centrale trascina la vista: la mappa segue il puntatore
const v0 = await page.evaluate(() => [window.__editor.view.x, window.__editor.view.y, window.__editor.view.scale]);
await page.mouse.move(900, 500); await page.waitForTimeout(100);
await page.mouse.down({ button: "middle" });
for (let k = 1; k <= 5; k++) { await page.mouse.move(900 - 40 * k, 500 - 20 * k); await page.waitForTimeout(60); }
await page.mouse.up({ button: "middle" });
await page.waitForTimeout(150);
const v1 = await page.evaluate(() => [window.__editor.view.x, window.__editor.view.y]);
check("trascinata col centrale", Math.abs(v1[0] - v0[0] - 200 * v0[2]) < 2 && Math.abs(v1[1] - v0[1] - 100 * v0[2]) < 2);

// [§9.181] "Apri mappa": Padania dal pannello, disegnata col motore; da
// lontano tutta la mappa col suolo a risoluzione ridotta (pochi blocchi)
await click(btn("open").x, btn("open").y);
check("pannello aperto", await page.evaluate(() => !!window.__editor.ed.open));
const O = await page.evaluate(() => window.__editor.openLayout());
const row = O.rows.find((q) => q.room === "sk_padus");
await click((row.x1 + row.x2) / 2, (row.y1 + row.y2) / 2);
await page.waitForFunction(() => window.__editor.ed.label && !window.__editor.ed.loading, null, { timeout: 120000 });
await page.waitForTimeout(500);
const padus = await page.evaluate(() => {
  const E = window.__editor, w = E.scene.world;
  return { w: E.scene.map.width, n: w.instances.length, alberi: w.instances.filter((i) => i.object === "albero" && i.visible && i.sprite_index).length,
           fiumi: w.rivers.length, strade: w.roads.length, saltati: E.scene.skipped.length };
});
res.padus = padus;
check("Padania caricata", padus.w === 7000 && padus.n > 700 && padus.alberi > 500 && padus.fiumi === 1 && padus.strade > 5 && padus.saltati === 0);
const far = await page.evaluate(async () => {
  const E = window.__editor, v = E.view;
  v.zoomAt(8, v.cssW / 2, v.cssH / 2); v.centre(3500, 3500);
  for (let k = 0; k < 3; k++) { E.render(); await new Promise((r) => requestAnimationFrame(r)); }
  return { tutta: v.x <= 0 && v.y <= 0 && v.x + v.w >= 7000 && v.y + v.h >= 7000, blocchi: E.scene.ground.chunks.size, disegnati: E.scene.world.drawn };
});
res.lontano = far;
check("da lontano tutta la mappa, pochi blocchi", far.tutta && far.blocchi <= 48 && far.disegnati > 500);

// Esc: di nuovo il menu
await page.keyboard.press("Escape");
await page.waitForURL(/room=menu/, { timeout: 20000 });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
check("Esc torna al menu", true);

console.log(JSON.stringify(res));
if (errs.length) console.log(errs.slice(0, 5));
ok = ok && errs.length === 0;
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
