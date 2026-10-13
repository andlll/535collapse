// Prova nel browser dell'economia nemica, passo 2 (§9.45), nella zona piu'
// aperta del match: un centro, una caserma, una stalla, un mulino, due campi
// nemici, alberi, oro e pietra, sei lavoratori nemici, scorte nemiche
// abbondanti. La regia (enemy_eco) nasce da sola.
//   soldati    = caserma e stalla fanno soldati (anche cavalieri), pagati
//                con le scorte nemiche, non oltre il tetto
//   attacco    = raccolti abbastanza soldati in attesa, partono (ruolo 31)
//   giocatore  = le scorte del giocatore non cambiano
//   riparazione = la caserma danneggiata torna intera, pagata col legno
//   ricostruzione = la stalla distrutta rinasce nello stesso punto, da un
//                cantiere nemico, pagata col legno; poi il centro (lo sprite
//                in trasparenza al posto del cantiere); nessun edificio nuovo
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemyarmy.mjs
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
  const mk = (o, x, y) => { const i = w.create(o, x, y); if (i.solid) p.markInstance(i, 1000); return i; };
  mk("enemy_centro", CX, CY);
  const cas = mk("enemy_caserma", CX + 350, CY + 20);
  const sta = mk("enemy_stalla", CX - 380, CY - 40);
  mk("enemy_mulino", CX - 450, CY + 250);
  w.create("enemy_campo", CX - 650, CY + 450);
  w.create("enemy_campo", CX - 250, CY + 500);
  for (let k = 0; k < 6; k++) mk("albero", CX + 600 + (k % 3) * 70, CY - 300 + Math.floor(k / 3) * 80);
  mk("miniera_oro", CX + 650, CY + 350);
  mk("pietra_grande", CX - 600, CY - 350);
  for (let k = 0; k < 6; k++) w.create("enemy_omino", CX + 100 + (k % 3) * 40, CY + 220 + Math.floor(k / 3) * 40);
  const g0 = { food: G.g.food, wood: G.g.wood, gold: G.g.gold, stone: G.g.stone };
  G.advance(5);
  Object.assign(G.g.en, { food: 3000, wood: 3000, gold: 3000, stone: 1000 });
  const builds0 = [...w.all("enemy_build")].map((b) => b.object).sort().join(",");
  const out = {};
  // soldati e attacco
  const kinds = new Set();
  let spent = 0, maxArmy = 0, attacked = 0, prev = { ...G.g.en };
  for (let s = 0; s < 9000 && !attacked; s++) {
    G.advance(1);
    for (const k of ["food", "wood", "gold"]) if (G.g.en[k] < prev[k]) spent += prev[k] - G.g.en[k];
    prev = { ...G.g.en };
    const army = [...w.all("enemy_unit")].filter((e) => e.object !== "enemy_omino");
    maxArmy = Math.max(maxArmy, army.length);
    for (const e of army) { kinds.add(e.object); if (e.role === 31 || e.role === 32) attacked = s; }
  }
  out.soldati = [...kinds].sort().join(",");
  out.maxArmy = maxArmy; out.spent = spent; out.attacco = attacked;
  out.giocatore = ["food", "wood", "gold", "stone"].every((k) => G.g[k] === g0[k]);
  // via i soldati (non devono disturbare) e niente piu' produzione
  for (const e of [...w.all("enemy_unit")]) if (e.object !== "enemy_omino") w.destroy(e);
  for (const b of [cas, sta]) b.prodUntil = 0;
  Object.assign(G.g.en, { food: 0, gold: 0, wood: 2000, stone: 0 });
  // riparazione
  cas.life -= 120;
  // il legno speso (le diminuzioni: intanto i raccoglitori ne portano)
  let wp = G.g.en.wood, spentW = 0;
  const track = () => { if (G.g.en.wood < wp) spentW += wp - G.g.en.wood; wp = G.g.en.wood; };
  let fixed = -1;
  for (let s = 0; s < 6000 && fixed < 0; s++) { G.advance(1); track(); if (cas.life >= cas.slife) fixed = s; }
  out.riparazione = fixed;
  out.legnoRip = spentW;
  // ricostruzione
  const sx = sta.x, sy = sta.y;
  sta.life = 0;
  G.advance(3);
  wp = G.g.en.wood; spentW = 0;
  let site = null, rebuilt = -1;
  for (let s = 0; s < 9000 && rebuilt < 0; s++) {
    G.advance(1);
    track();
    const f = w.all("enemy_cantiere").next().value;
    if (f && !site) site = { x: f.x, y: f.y, at: s };
    const n = w.all("enemy_stalla").next().value;
    if (n) rebuilt = s;
  }
  const n = w.all("enemy_stalla").next().value;
  out.cantiere = site && site.x === sx && site.y === sy ? site.at : null;
  out.ricostruita = rebuilt;
  out.stessoPunto = !!n && n.x === sx && n.y === sy;
  out.legnoRic = spentW;
  // il centro: senza cantiere nell'originale, il suo sprite che si fa pieno
  G.g.en.stone = 500;
  const c0 = w.all("enemy_centro").next().value, cx = c0.x, cy = c0.y;
  c0.life = 0;
  let ghost = false, cc = -1;
  for (let s = 0; s < 9000 && cc < 0; s++) {
    G.advance(1);
    const f = w.all("enemy_cantiere").next().value;
    if (f && f.ghost && f.sprite_index === "cc_b" && f.image_alpha < 1) ghost = true;
    const c = w.all("enemy_centro").next().value;
    if (c && c.x === cx && c.y === cy) cc = s;
  }
  out.centro = ghost ? cc : -1;
  G.advance(600);
  out.nessunNuovo = [...w.all("enemy_build")].map((b) => b.object).sort().join(",") === builds0 && !w.exists("enemy_cantiere");
  return out;
});
console.log(JSON.stringify(res));
const ok = res.soldati.includes("enemy_cavaliere") && res.soldati.includes("enemy_warrior") && res.maxArmy <= 12
  && res.spent > 0 && res.attacco > 0 && res.giocatore
  && res.riparazione >= 0 && res.legnoRip >= 100
  && res.cantiere !== null && res.ricostruita >= 0 && res.stessoPunto && res.legnoRic >= 170
  && res.centro >= 0 && res.nessunNuovo && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
