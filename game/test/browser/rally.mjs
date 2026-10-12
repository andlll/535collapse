// Prova nel browser delle unita' appena prodotte che vanno alla bandiera
// (§9.30). Un edificio (caserma, stalla o centro) in un posto libero vicino
// al punto dato; la bandiera in giro attorno a lui (24 direzioni, a 150, 260
// e 380 px: sull'edificio stesso, su alberi, nel fiume, su altre unita',
// in celle chiuse) e per ogni bandiera tre unita' prodotte col suo allarme
// di produzione, una ogni 150 passi, seguite per 1300 passi. Per unita':
//   late    ancora in cammino alla fine (non conta chi lavora: un civile con
//           la bandiera su un albero o su una miniera)
//   stuck   ferma per piu' di 60 passi di fila mentre e' in cammino
//   rev     inversioni di marcia (avanti e indietro)
//   far     a piu' di 40 px dal proprio posto alla fine (non chi lavora)
//   overlap sovrapposta a un edificio o a un albero alla fine
// Esce con codice 1 se una unita' resta in cammino o ferma, lontana o
// sovrapposta, o fa piu' di 20 inversioni. Deterministica.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/rally.mjs [room x y edificio]...
//   (senza argomenti: le configurazioni di CASES; ANGLES=24 RADII=150,260,380
//   per la prova completa, piu' lunga)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const ANGLES = Number(process.env.ANGLES || 12);
const RADII = (process.env.RADII || "150,300").split(",").map(Number);
const CASES = [["match", 1100, 900, "caserma"], ["match", 1100, 900, "stalla"], ["match", 2800, 1300, "centro"], ["lvl02", 1000, 7000, "caserma"]];
const args = process.argv.slice(2);
const cases = args.length >= 4 ? [] : CASES;
for (let k = 0; k + 3 < args.length; k += 4) cases.push([args[k], Number(args[k + 1]), Number(args[k + 2]), args[k + 3]]);

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const [room, bx, by, prod] of cases) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const res = await page.evaluate(([BX, BY, PROD, ANGLES, RADII]) => {
    const G = window.__game, w = G.world, p = w.path;
    G.advance(2);
    let seed = 3;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0 });
    for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
    for (const d of [...w.all("dialogo")]) w.destroy(d);
    // l'edificio nel primo posto libero vicino a (BX, BY), provato con la
    // sua maschera senza crearlo (crearlo e distruggerlo cambia la griglia)
    const spr = w.objects[PROD].mask || w.objects[PROD].sprite;
    let b = null;
    for (let r = 0; r < 600 && !b; r += 32) for (let a = 0; a < 360 && !b; a += 30) {
      const x = BX + Math.round(Math.cos(a * Math.PI / 180) * r), y = BY + Math.round(Math.sin(a * Math.PI / 180) * r);
      const probe = { x, y, sprite_index: spr, mask_index: spr, image_xscale: 1, image_yscale: 1, image_angle: 0, image_index: 0, alive: true };
      if (!w.instancePlace(probe, x, y, null, true)) b = w.create(PROD, x, y);
    }
    G.advance(2);
    const UNIT = PROD === "stalla" ? "ally_cavaliere" : PROD === "centro" ? "ally_omino" : "ally_warrior";
    const produce = () => {
      b.progression = 100; b.coda = 0; b.coda0 = 1; G.g.pop = 0; G.g.popcap = 999;
      const before = new Set(w.all(UNIT));
      w.fire(b, "alarm0");
      for (const u of w.all(UNIT)) if (!before.has(u)) return u;
      return null;
    };
    const units = [];
    for (const r of RADII) for (let k = 0; k < ANGLES; k++) {
      const a = (k * 360) / ANGLES;
      for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
      const fx = Math.round(b.x + Math.cos(a * Math.PI / 180) * r), fy = Math.round(b.y + Math.sin(a * Math.PI / 180) * r * 0.75);
      b.flagx = fx; b.flagy = fy;
      const us = [], st = new Map();
      for (let s = 0; s < 1300; s++) {
        if (s % 150 === 0 && us.length < 3) {
          const u = produce();
          if (u) { us.push(u); st.set(u, { rev: 0, still: 0, stuck: 0, px: u.x, py: u.y, dx: 0, dy: 0 }); }
        }
        G.advance(1);
        for (const u of us) {
          if (!u.alive) continue;
          const q = st.get(u), dx = u.x - q.px, dy = u.y - q.py, mv = Math.hypot(dx, dy);
          if (mv > 0.5 && Math.hypot(q.dx, q.dy) > 0.5 && dx * q.dx + dy * q.dy < 0) q.rev++;
          if (u.action === 1 && mv < 0.3) { q.still++; q.stuck = Math.max(q.stuck, q.still); } else q.still = 0;
          q.px = u.x; q.py = u.y; q.dx = dx; q.dy = dy;
        }
      }
      for (const u of us) {
        const q = st.get(u);
        const work = !!(u.woodwork || u.goldwork || u.stonework || u.foodwork || u.buildwork || u.fieldwork) || u.action > 1;
        const o = w.instancePlace(u, u.x, u.y, null, true);
        const spot = u.flaggox != null && u.creation !== undefined ? [u.flaggox, u.flaggoy] : null;
        units.push({ r, a, flag: [fx, fy], work, act: u.action, rev: q.rev, stuck: q.stuck,
                     far: !work && spot ? Math.round(Math.hypot(u.x - spot[0], u.y - spot[1])) : 0,
                     overlap: o && !w.is(o, "ally_unit") ? o.object : null, end: [Math.round(u.x), Math.round(u.y)] });
      }
    }
    return { b: b ? [b.x, b.y] : null, units };
  }, [bx, by, prod, ANGLES, RADII]);
  const U = res.units;
  const m = {
    units: U.length,
    late: U.filter((u) => !u.work && u.act === 1).length,
    stuck: U.filter((u) => u.stuck > 60).length,
    rev: U.reduce((s, u) => s + (u.work ? 0 : u.rev), 0),
    revMax: Math.max(0, ...U.filter((u) => !u.work).map((u) => u.rev)),
    far: U.filter((u) => u.far > 40).length,
    overlap: U.filter((u) => u.overlap).length,
  };
  const bad = U.filter((u) => (!u.work && (u.act === 1 || u.rev > 20 || u.far > 40)) || u.stuck > 60 || u.overlap);
  if (bad.length || errs.length || !res.b || U.length < 3 * ANGLES * RADII.length) failed = true;
  console.log(`${room} ${prod} ${JSON.stringify(res.b)}`, JSON.stringify(m), errs.length ? "ERR " + errs[0] : "");
  for (const u of bad.slice(0, 8)) console.log("   ", JSON.stringify(u));
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
