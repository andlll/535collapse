// Prova nel browser del fuoco agli edifici di legno (segnalazione
// dell'autore, §9.38: la stalla sembrava non prendere fuoco).
//   fiamme: ogni edificio di legno (anche nemico) acceso a vita piena; la
//           vita delle fiamme davanti (fire_part) deve essere di almeno
//           MIN_LIFE passi, se no le fiamme quasi non si vedono (la stalla
//           le aveva di 0-10, il mulino di 0-5)
//   frecce: per ogni edificio di legno alleato, da solo in una zona aperta,
//           un guerriero e un picchiere nemici arrivano da quattro
//           direzioni a 350 px, nessun civile in giro: l'edificio deve
//           prendere fuoco (onfire) entro STEPS passi.
// Esce con 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/burn.mjs [room]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [room = "match"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, p = w.path;
  G.advance(2);
  let seed = 5;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, raining: 0 });
  G.manager.stopRain && G.manager.stopRain();
  G.manager.al.set(4, -1);
  G.g.fogville = 0;
  const clear = () => {
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
    for (const b of [...w.all("ally_wooden")]) w.destroy(b);
  };
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  const STEPS = 900, MIN_LIFE = 10;
  const out = { flames: {} };
  for (const obj of ["casa", "magazzino", "barn", "caserma", "stalla", "centro", "campo", "enemy_house", "enemy_caserma", "enemy_stalla"]) {
    clear();
    const b = w.create(obj, CX, CY);
    b.visible = true;
    G.advance(1);
    b.onfire = 1;
    G.advance(2);
    const l = b.fire_part && b.fire_part.life;
    out.flames[obj] = l ? [Math.round(l[0]), Math.round(l[1]), l[0] >= MIN_LIFE] : null;
    w.destroy(b);
  }
  for (const obj of ["stalla", "caserma", "casa", "magazzino", "barn", "campo", "centro"]) {
    if (!w.behaviours[obj]) { out[obj] = "non registrato"; continue; }
    const r = out[obj] = { burnt: 0, n: 0, fails: [] };
    for (let k = 0; k < 8; k += 2) {
      clear();
      const b = w.create(obj, CX, CY);
      G.advance(1);
      const a = k * Math.PI / 4;
      const ex = CX + Math.cos(a) * 350, ey = CY + Math.sin(a) * 350 * 0.8;
      for (const e of ["enemy_warrior", "enemy_picchiere"]) w.create(e, ex + (e === "enemy_warrior" ? 0 : 40), ey);
      let shots = 0, burnt = false;
      const seen = new Set();
      for (let s = 0; s < STEPS && !burnt; s++) {
        b.life = b.slife;
        G.advance(1);
        for (const f of w.all("fire_bullet")) if (!seen.has(f)) { seen.add(f); shots++; }
        if (b.onfire === 1) burnt = true;
      }
      r.n++;
      if (burnt) r.burnt++;
      else {
        const es = [...w.all("enemy_unit")].map((e) => ({ o: e.object, a: e.action, f: e.firework, t: !!e.targetid, d: Math.round(w.distanceToInstance(e, b)) }));
        r.fails.push({ dir: k * 45, shots, es });
      }
    }
  }
  return out;
});
console.log("fiamme a vita piena (passi):", JSON.stringify(res.flames));
for (const [o, r] of Object.entries(res)) if (o !== "flames") console.log(o.padEnd(10), typeof r === "object" ? `${r.burnt}/${r.n}` : r, r.fails && r.fails.length ? JSON.stringify(r.fails) : "");
let bad = errs.length > 0;
for (const [o, r] of Object.entries(res)) if (o !== "flames" && typeof r === "object" && r.burnt < r.n) { bad = true; console.log("NON BRUCIA:", o); }
for (const [o, f] of Object.entries(res.flames)) if (!f || !f[2]) { bad = true; console.log("FIAMME INVISIBILI:", o, JSON.stringify(f)); }
if (errs.length) console.log(errs);
await browser.close();
process.exit(bad ? 1 : 0);
