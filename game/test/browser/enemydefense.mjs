// Prova nel browser della regia nemica di difesa e attacco (§9.50), nella
// zona piu' aperta del match: un centro e una caserma nemici, scorte nemiche
// a zero (niente produzione: i soldati li mette la prova).
//   difesa   = un guerriero alleato a 450 px dal centro, dalla parte opposta
//              ai soldati in attesa (oltre i 400 px a cui lo vedrebbero da
//              soli): accorrono e lo attaccano (senza la regola, defendR 0,
//              nessuno si muove)
//   ondate   = con attackAt 3, attackGrow 2, firstAttack 600 passi e
//              attackEvery 900 (ECO.match): 3 soldati non partono prima di
//              firstAttack, poi si'; la seconda ondata ne vuole 5 (con 4 non
//              parte, con 5 si') e non prima di attackEvery
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemydefense.mjs
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
  for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - CX, u.y - CY) < 2000) w.destroy(u);
  const mk = (o, x, y) => { const i = w.create(o, x, y); if (i.solid) p.markInstance(i, 1000); return i; };
  G.eco.match = { attackAt: 3, attackGrow: 2, firstAttack: 600, attackEvery: 900, army: 20 };
  mk("enemy_centro", CX, CY);
  mk("enemy_caserma", CX + 400, CY);
  G.advance(5);
  Object.assign(G.g.en, { food: 0, wood: 0, gold: 0, stone: 0 });
  const out = {};
  const soldier = (k, x, y) => {
    const e = w.create(["enemy_warrior", "enemy_picchiere"][k % 2], x, y);
    e.role = 30; e.eco = 1; return e;
  };
  // difesa: soldati a est, intruso a ovest (fuori dalla loro vista)
  const def = [];
  for (let k = 0; k < 6; k++) def.push(soldier(k, CX + 450 + (k % 3) * 40, CY + 150 + Math.floor(k / 3) * 40));
  G.eco.match.attackAt = 0; // niente ondate durante la difesa
  const a = w.create("ally_warrior", CX - 450, CY + 40);
  G.advance(2);
  // accorsi: chi si e' avvicinato all'intruso di almeno 200 px (i primi
  // arrivati lo uccidono, gli altri si fermano dove sono)
  const d0 = def.map((e) => Math.hypot(e.x - a.x, e.y - a.y));
  // (immortale: le frecce del centro lo ucciderebbero comunque)
  const near = def.map(() => false), touch = def.map(() => false);
  for (let s = 0; s < 1500; s++) {
    a.action = 0; a.life = a.slife; // il guerriero resta li'
    G.advance(1);
    def.forEach((e, k) => {
      const d = Math.hypot(e.x - a.x, e.y - a.y);
      if (e.alive && d < d0[k] - 200) near[k] = true;
      if (e.alive && d < 90) touch[k] = true;
    });
  }
  const moved = near.filter(Boolean).length, dead = touch.filter(Boolean).length;
  out.difesa = { accorsi: moved, aContatto: dead };
  w.destroy(a);
  for (const e of [...w.all("enemy_unit")]) if (e.object !== "enemy_omino") w.destroy(e);
  G.advance(30);
  // ondate
  G.eco.match.attackAt = 3;
  const t0 = w._stepNo, since = G.g.en.since, en = G.g.en;
  en.wave = 0; en.nextAttack = 0; en.since = w._stepNo; // il conto di firstAttack riparte da qui
  const wave1 = [];
  for (let k = 0; k < 3; k++) wave1.push(soldier(k, CX + 300 + k * 40, CY + 200));
  const left = (list) => list.filter((e) => e.role === 31 || e.role === 32).length;
  G.advance(500);
  out.primaPrimaDelTempo = left(wave1);
  G.advance(200);
  out.primaOndata = left(wave1);
  const t1 = w._stepNo;
  const wave2 = [];
  for (let k = 0; k < 4; k++) wave2.push(soldier(k, CX + 300 + k * 40, CY + 260));
  G.advance(1000);
  out.secondaCon4 = left(wave2);
  wave2.push(soldier(4, CX + 460, CY + 260));
  let at = -1;
  for (let s = 0; s < 400 && at < 0; s++) { G.advance(1); if (left(wave2) === 5) at = w._stepNo; }
  out.secondaCon5 = left(wave2);
  out.ondata = en.wave;
  out.passiFraOndate = at - t1;
  return out;
});
console.log(JSON.stringify(res));
const ok = res.difesa.accorsi >= 5 && res.difesa.aContatto >= 3
  && res.primaPrimaDelTempo === 0 && res.primaOndata === 3
  && res.secondaCon4 === 0 && res.secondaCon5 === 5 && res.ondata === 2 && res.passiFraOndate >= 900
  && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
