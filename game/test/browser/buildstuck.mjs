// Prova nel browser dei civili che vanno al cantiere e incontrano altre
// unita' (§9.102, segnalazione dell'autore: "vanno in tilt finche' non gli
// viene dato un nuovo ordine, anche se il passaggio si e' liberato"). Nel
// match, tolti i nemici:
//   incrocio  12 civili su quattro cantieri (gruppi di 3, a caso: fino a 12
//             sullo stesso cantiere, che non si finisce mai) e 16 soldati che
//             attraversano la zona a gruppi ogni 2 s; sei giri di ordini da
//             40 s. Ogni civile deve arrivare a lavorare (azione 6) entro il
//             suo giro, e nessuno restare fermo con l'ordine di costruire.
//             Prima (seme 7) alcuni restavano a girare in tondo a 30-65 px
//             dal bordo, col posto dietro l'edificio, per tutto il giro
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/buildstuck.mjs [seme] [giri]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(([SEED, ROUNDS]) => {
  const G = window.__game, w = G.world, cam = G.cam, p = w.path, g = G.g;
  let seed = SEED;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  Math.random = rnd;
  G.advance(3);
  for (const e of [...w.all("enemy")]) w.destroy(e);
  for (const e of [...w.all("enemy_manager")]) w.destroy(e);
  Object.assign(g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0, food: 50000, wood: 50000, gold: 50000, stone: 50000, popcap: 400 });
  const step = (n = 1) => { for (let k = 0; k < n; k++) { G.advance(1); for (const d of [...w.all("parent_hint")]) w.destroy(d); } };
  const select = (list) => {
    for (const u of w.all("ally_unit")) u.selected = 0;
    for (const u of list) u.selected = 1;
    g.sel = list.length; g.milsel = list.filter((u) => !w.is(u, "ally_omino")).length;
  };
  const rc = (x, y, b = null) => {
    const input = w.input;
    cam.x = x - cam.w / 2; cam.y = y - cam.h / 2; G.advance(1);
    if (b) { const bb = w.bbox(b); x = (bb[0] + bb[2]) / 2; y = (bb[1] + bb[3]) / 2; }
    input.x = (x - cam.x) * cam.cssW / cam.w; input.y = (y - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true; G.advance(1);
  };
  const clearArea = (x, y, r) => { for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - x, u.y - y) < r) w.destroy(u); };
  const out = {};

  // incrocio: civili e soldati attorno a quattro cantieri
  {
    const c = w.all("centro").next().value;
    const CX = c.x + 450, CY = c.y + 200;
    const sites = [];
    for (let k = 0; sites.length < 4 && k < 4000; k++) {
      const x = CX + (rnd() - 0.5) * 1400, y = CY + (rnd() - 0.5) * 1000;
      if (sites.some((s) => Math.hypot(s.x - x, s.y - y) < 330)) continue;
      let bad = 0; const gx0 = Math.floor(x / 32), gy0 = Math.floor(y / 32);
      for (let dy = -4; dy <= 4; dy++) for (let dx = -5; dx <= 5; dx++) if (p.costAt(gx0 + dx, gy0 + dy) >= 1000) bad++;
      if (bad) continue;
      sites.push(w.create("casa_fond", Math.round(x), Math.round(y), { init: (f) => { f.tipo = 1 + (k % 6); } }));
    }
    step(3);
    const spawn = (obj) => {
      for (;;) {
        const o = w.create(obj, CX + (rnd() - 0.5) * 1200, CY + (rnd() - 0.5) * 900);
        if (w.placeFree(o, o.x, o.y)) return o;
        w.destroy(o);
      }
    };
    const workers = Array.from({ length: 12 }, () => spawn("ally_omino"));
    const soldiers = Array.from({ length: 16 }, () => spawn(rnd() < 0.5 ? "ally_warrior" : "ally_arciere"));
    step(5);
    let late = 0, worstRound = 0, idleOrdered = 0, orders = 0;
    for (let round = 0; round < ROUNDS; round++) {
      const target = new Map();
      for (let k = 0; k < workers.length; k += 3) {
        const grp = workers.slice(k, k + 3);
        const f = sites[Math.floor(rnd() * sites.length)];
        select(grp); rc(f.x, f.y, f);
        for (const o of grp) target.set(o, f);
        orders += grp.length;
      }
      const done = new Set();
      for (let t = 0; t < 2400; t++) {
        if (t % 120 === 0) {
          const grp = soldiers.filter(() => rnd() < 0.5);
          if (grp.length) { select(grp); rc(CX + (rnd() - 0.5) * 1100, CY + (rnd() - 0.5) * 800); }
        }
        for (const f of sites) f.life = Math.min(f.life, 5);
        step(1);
        for (const o of workers) {
          if (o.action === 6) done.add(o);
          if (!done.has(o) && o.action === 0 && o.buildwork === 1) idleOrdered++;
        }
      }
      const miss = workers.filter((o) => !done.has(o)).length;
      late += miss; worstRound = Math.max(worstRound, miss);
    }
    out.incrocio = { ordini: orders, inRitardo: late, peggiorGiro: worstRound, fermiConOrdine: idleOrdered };
    out.incrocio.ok = late === 0 && idleOrdered === 0;
  }
  return out;
}, [Number(process.argv[2] || 7), Number(process.argv[3] || 6)]);
let ok = errs.length === 0;
for (const [k, v] of Object.entries(res)) { console.log(k.padEnd(10), JSON.stringify(v), v.ok ? "" : "NON VA"); ok = ok && v.ok; }
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
