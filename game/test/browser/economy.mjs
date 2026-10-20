// Prova nel browser dell'economia nemica (§9.44), nella zona piu' aperta
// del match: un centro, un mulino e due campi nemici, alberi, una miniera
// d'oro e una pietra vicini, tre lavoratori nemici; la regia (enemy_eco)
// nasce da sola. Dopo STEPS passi:
//   scorte   = il nemico ha raccolto legno, oro, pietra e cibo (oltre a
//              quanto ha speso per i lavoratori nuovi)
//   lavoratori = il centro ne ha fatti nascere fino al numero voluto
//   ripartizione = al lavoro su tutte e quattro le risorse
//   giocatore = le scorte del giocatore non cambiano
// Poi un guerriero alleato attacca un lavoratore:
//   fuga     = il lavoratore colpito scappa verso il centro
//   morte    = il guerriero lo uccide (la vita 50 ha i suoi danni)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/economy.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const STEPS = Number(process.env.STEPS || 9000);
const res = await page.evaluate((STEPS) => {
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
  // via gli alleati vicini (non devono disturbare)
  for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - CX, u.y - CY) < 1500) w.destroy(u);
  const mk = (o, x, y) => { const i = w.create(o, x, y); p.markInstance && (o !== "enemy_campo") && p.markInstance(i, 1000); return i; };
  mk("enemy_centro", CX, CY);
  mk("enemy_mulino", CX - 450, CY + 250);
  w.create("enemy_campo", CX - 650, CY + 450);
  w.create("enemy_campo", CX - 250, CY + 500);
  for (let k = 0; k < 6; k++) mk("albero", CX + 600 + (k % 3) * 70, CY - 300 + Math.floor(k / 3) * 80);
  mk("miniera_oro", CX + 650, CY + 350);
  mk("pietra_grande", CX - 600, CY - 350);
  for (let k = 0; k < 3; k++) w.create("enemy_omino", CX + 100 + k * 40, CY + 220);
  const g0 = { food: G.g.food, wood: G.g.wood, gold: G.g.gold, stone: G.g.stone };
  G.advance(5);
  const start = { ...G.g.en };
  const got = { food: 0, wood: 0, gold: 0, stone: 0 };
  let prev = { ...G.g.en };
  const jobs = new Set();
  for (let s = 0; s < STEPS; s++) {
    G.advance(1);
    for (const k of Object.keys(got)) { if (G.g.en[k] > prev[k]) got[k] += G.g.en[k] - prev[k]; }
    prev = { ...G.g.en };
    for (const o of w.all("enemy_omino")) jobs.add(o.action);
  }
  const out = {
    eco: w.number("enemy_eco"), start, en: { ...G.g.en }, got, workers: w.number("enemy_omino"),
    actions: [...jobs].sort().join(","),
    player: ["food", "wood", "gold", "stone"].every((k) => G.g[k] === g0[k]),
  };
  // fuga e morte
  const target = [...w.all("enemy_omino")].sort((a, b) => Math.hypot(a.x - CX, a.y - CY) - Math.hypot(b.x - CX, b.y - CY)).pop();
  const c = [...w.all("enemy_centro")][0];
  const d0 = Math.hypot(target.x - c.x, target.y - c.y);
  const a = w.create("ally_warrior", target.x + 40, target.y);
  G.advance(2);
  a.target_eu = target; a.warwork = 1; a.action = 1; a.dirox = target.x; a.diroy = target.y;
  let fled = false, minD = d0, dead = -1;
  for (let s = 0; s < 1500 && dead < 0; s++) {
    a.life = a.slife;
    G.advance(1);
    if (!target.alive) { dead = s; break; }
    if (target.fleeUntil > w._stepNo) fled = true;
    minD = Math.min(minD, Math.hypot(target.x - c.x, target.y - c.y));
  }
  out.fuga = fled && minD < d0 - 50;
  out.morte = dead;
  return out;
}, STEPS);
console.log(JSON.stringify(res));
const ok = res.eco === 1 && res.got.wood > 0 && res.got.gold > 0 && res.got.stone > 0 && res.got.food > 0
  && res.workers >= 6 && res.player && res.fuga && res.morte >= 0 && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
