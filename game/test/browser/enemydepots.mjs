// Prova nel browser dei depositi nuovi dell'economia nemica (§9.46), nella
// zona piu' aperta del match: senza centro e senza magazzino, un mulino
// nemico, un campo accanto e uno lontano (1000 px), quattro lavoratori, alberi
// a 1100 px (via quelli della mappa fino a 4500 px). Senza centro la regia
// dei livelli non crea la regia economica (enemy_eco): la si crea qui, come
// in un livello il cui centro e' stato distrutto.
//   magazzino = i lavoratori vanno agli alberi lontani e il nemico costruisce
//               un magazzino vicino a loro (entro 650 px), pagandolo
//   legno     = poi il legno arriva nelle scorte nemiche
//   mulino    = il campo lontano da ogni granaio ha un mulino nuovo vicino
//   solo depositi = nessun altro edificio nuovo, il centro non torna
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemydepots.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, p = w.path;
  G.advance(2);
  let seed = 9;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (const e of [...w.all("enemy_manager")]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0 });
  for (const e of [...w.all("enemy")]) w.destroy(e);
  let best = null;
  for (let gy = 40; gy < p.gh - 40; gy += 6) for (let gx = 40; gx < p.gw - 40; gx += 6) {
    let bad = 0;
    for (let dy = -36; dy <= 36; dy += 3) for (let dx = -36; dx <= 36; dx += 3) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - CX, u.y - CY) < 1500) w.destroy(u);
  // via gli alberi della mappa vicini: i soli alberi sono quelli della prova
  for (const t of [...w.all("albero")]) if (Math.hypot(t.x - CX, t.y - CY) < 4500) { p.markInstance(t, 1); w.destroy(t); }
  const mk = (o, x, y) => { const i = w.create(o, x, y); if (i.solid) p.markInstance(i, 1000); return i; };
  mk("enemy_mulino", CX, CY);
  w.create("enemy_campo", CX + 150, CY + 250);
  const farCampo = w.create("enemy_campo", CX - 1000, CY + 100);
  const trees = [];
  for (let k = 0; k < 6; k++) trees.push(mk("albero", CX + 1100 + (k % 3) * 70, CY - 100 + Math.floor(k / 3) * 80));
  for (let k = 0; k < 4; k++) w.create("enemy_omino", CX + 100 + k * 40, CY - 150);
  w.create("enemy_eco", 0, 0);
  G.advance(5);
  Object.assign(G.g.en, { food: 0, wood: 300, gold: 0, stone: 0 });
  const out = {};
  let mag = null, mul = null, cantieri = 0, seen = new Set(), woodAfter = 0, wp = G.g.en.wood;
  for (let s = 0; s < 9000 && !(mag && mul && woodAfter > 0); s++) {
    G.advance(1);
    for (const f of w.all("enemy_cantiere")) if (!seen.has(f)) { seen.add(f); cantieri++; }
    if (!mag) mag = w.all("enemy_magazzino").next().value || null;
    if (!mul) for (const m of w.all("enemy_mulino")) if (Math.hypot(m.x - CX, m.y - CY) > 10) mul = m;
    if (mag && G.g.en.wood > wp) woodAfter += G.g.en.wood - wp;
    wp = G.g.en.wood;
  }
  const near = (b, x, y) => !!b && Math.hypot(b.x - x, b.y - y) < 650;
  out.magazzino = !!mag && trees.some((t) => near(mag, t.x, t.y));
  out.legno = woodAfter;
  out.mulino = near(mul, farCampo.x, farCampo.y);
  out.cantieri = cantieri;
  out.edifici = [...w.all("enemy_build")].map((b) => b.object).filter((o) => o !== "enemy_campo").sort().join(",");
  out.soloDepositi = out.edifici === "enemy_magazzino,enemy_mulino,enemy_mulino" && !w.exists("enemy_centro");
  out.nuovi = G.g.en.newDeposits;
  return out;
});
console.log(JSON.stringify(res));
const ok = res.magazzino && res.legno > 0 && res.mulino && res.cantieri === 2 && res.soloDepositi && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
