// Prova nel browser dei clic sulla minimappa (§9.109), nel match, con
// eventi veri del mouse:
//   destro      con un soldato selezionato: va verso il punto della mappa
//               indicato (prima: verso il punto del mondo sotto la minimappa
//               sullo schermo)
//   sinistro    la view si centra su quel punto; la selezione resta (prima
//               deselezionava) e nessun rettangolo di selezione
//   trascina    tenendo premuto e muovendo, la view segue il puntatore
//   pulsanti    "-" della minimappa: la scala cambia, il soldato resta
//               selezionato
//   riquadro    la view nella minimappa e' alta quanto la view vera (con lo
//               zoom: prima view_hport/sz)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/minimap.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const geo = await page.evaluate(() => {
  const G = window.__game, w = G.world;
  for (let k = 0; k < 300; k++) { G.advance(1); for (const d of [...w.all("parent_hint")]) w.destroy(d); }
  G.loop.render();
  const ce = w.all("centro").next().value;
  const u = w.create("ally_warrior", ce.x + 300, ce.y + 250);
  for (const a of w.all("ally_unit")) a.selected = 0;
  u.selected = 1; G.g.sel = 1; G.g.milsel = 1; window.__u = u;
  G.advance(2);
  const sz = G.g.sz, mh = w.roomH / sz, oy = G.cam.cssH - 20 - mh;
  return { sz, oy, mw: w.roomW / sz, mh };
});
const step = (n = 1) => page.evaluate((n) => { window.__game.advance(n); }, n);
// un punto della minimappa: (fx, fy) in frazioni della mappa
const pt = (fx, fy) => [20 + geo.mw * fx, geo.oy + geo.mh * fy];
const room = (p) => [(p[0] - 20) * geo.sz, (p[1] - geo.oy) * geo.sz];
const res = {};

// destro: verso il punto della mappa
const A = pt(0.6, 0.5);
await page.mouse.move(...A); await step(2);
await page.mouse.click(...A, { button: "right" }); await step(2);
const r1 = await page.evaluate(() => { const u = window.__u; return { dir: [u.dirox, u.diroy], action: u.action, sel: u.selected }; });
const [ax, ay] = room(A);
res.destro = { ...r1, meta: [Math.round(ax), Math.round(ay)], ok: r1.action === 1 && Math.hypot(r1.dir[0] - ax, r1.dir[1] - ay) < 250 };

// sinistro: la view centrata, la selezione resta
const B = pt(0.3, 0.7);
await page.mouse.move(...B); await step(2);
await page.mouse.click(...B); await step(2);
const r2 = await page.evaluate(() => { const G = window.__game, c = G.cam; return { centro: [c.x + c.w / 2, c.y + c.h / 2], sel: window.__u.selected, multi: G.g.multi, roomW: G.world.roomW, roomH: G.world.roomH, w: c.w, h: c.h }; });
const [bx, by] = room(B);
const want = [Math.max(r2.w / 2, Math.min(r2.roomW - r2.w / 2, bx)), Math.max(r2.h / 2, Math.min(r2.roomH - r2.h / 2, by))];
res.sinistro = { centro: r2.centro.map(Math.round), atteso: want.map(Math.round), sel: r2.sel, ok: Math.hypot(r2.centro[0] - want[0], r2.centro[1] - want[1]) < 2 * geo.sz && r2.sel === 1 && r2.multi === 0 };

// trascina
const C0 = pt(0.4, 0.4), C1 = pt(0.55, 0.55);
await page.mouse.move(...C0); await step(2);
await page.mouse.down(); await step(2);
await page.mouse.move(...C1, { steps: 5 }); await step(2);
const mid = await page.evaluate(() => { const c = window.__game.cam; return [c.x + c.w / 2, c.y + c.h / 2]; });
await page.mouse.up(); await step(2);
const [cx, cy] = room(C1);
res.trascina = { centro: mid.map(Math.round), atteso: [Math.round(cx), Math.round(cy)], sel: await page.evaluate(() => window.__u.selected) };
res.trascina.ok = Math.hypot(mid[0] - cx, mid[1] - cy) < 3 * geo.sz && res.trascina.sel === 1;

// il pulsante "-" della minimappa: la scala cambia, la selezione resta
const minus = [50 + geo.mw, 720 + 75 - geo.mh];
await page.mouse.move(...minus); await step(2);
await page.mouse.click(...minus); await step(2);
const r4 = await page.evaluate(() => ({ sz: window.__game.g.sz, sel: window.__u.selected }));
res.pulsanti = { sz: [geo.sz, r4.sz], sel: r4.sel, ok: r4.sz === geo.sz + 1 && r4.sel === 1 };

// il riquadro della view: alto quanto la view vera
res.riquadro = await page.evaluate(() => {
  const G = window.__game, cam = G.cam, calls = [];
  // drawMinimap su un disegnatore finto che registra le chiamate
  const d = new Proxy({}, { get: (t, k) => (...a) => calls.push([k, a]) });
  G.manager.drawMinimap(d, cam, G.world, cam.cssH);
  // [§9.110] roundRectRadii: un raggio per angolo (5, o quello della minimappa nei suoi angoli)
  const rect = calls.find(([k]) => k === "roundRectRadii");
  const sz = G.g.sz, h = rect ? rect[1][3] - rect[1][1] : 0, radii = rect ? rect[1][4] : [];
  return { alto: +h.toFixed(1), atteso: +(cam.h / sz).toFixed(1), raggi: radii.map((r) => +r.toFixed(1)),
           ok: !!rect && Math.abs(h - cam.h / sz) < 0.01 && radii.every((r) => r >= 5 && r <= 40) };
});
let ok = errs.length === 0;
for (const [k, v] of Object.entries(res)) { console.log(k.padEnd(10), JSON.stringify(v), v.ok ? "" : "NON VA"); ok = ok && v.ok; }
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
