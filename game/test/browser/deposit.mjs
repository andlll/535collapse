// Prova nel browser della consegna su ordine (§8.19): N civili carichi (a
// turno 10 di legno, oro, pietra, cibo) attorno al centro o a un magazzino
// nuovo, clic destro sul deposito, 1200 passi: quanti consegnano; degli
// altri stampa dove si sono fermati e il percorso. Il cibo si consegna solo
// al granaio o al centro: al magazzino non consegna, ed e' giusto.
//
//   node game/test/browser/deposit.mjs [url] [room] [centro|magazzino] [N]
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [base = "http://localhost:8123", room = "match", which = "centro", nArg = "6"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const r = await page.evaluate(([which, N]) => {
  const G = window.__game, w = G.world, cam = G.cam;
  G.advance(2);
  const input = w.input;
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  const centro = w.all("centro").next().value;
  let dep = centro;
  if (which === "magazzino") {
    // un magazzino finito a ~500 px dal centro, dove c'e' posto
    for (let k = 0; k < 200; k++) {
      const a = k * 0.6, rr = 450 + k * 5;
      const x = Math.round(centro.x + Math.cos(a) * rr), y = Math.round(centro.y + Math.sin(a) * rr * 0.6);
      const m = w.create("magazzino", x, y);
      if (w.placeFree(m, x, y) && !w.instancePlace(m, x, y, "ally_build") && !w.instancePlace(m, x, y, "natural_parent")) { dep = m; break; }
      w.destroy(m);
    }
  }
  G.advance(2);
  const out = [];
  for (let k = 0; out.length < N && k < 300; k++) {
    const a = k * 0.9, rr = 260 + k * 7;
    const x = dep.x + Math.cos(a) * rr, y = dep.y + Math.sin(a) * rr * 0.6;
    const o = w.create("ally_omino", x, y);
    if (!w.placeFree(o, o.x, o.y)) { w.destroy(o); continue; }
    out.push(o);
  }
  G.advance(3);
  const kinds = ["wood", "gold", "stone", "food"];
  out.forEach((o, k) => { o[kinds[k % 4]] = 10; });
  for (const o of w.all("ally_omino")) o.selected = 0;
  for (const o of out) o.selected = 1;
  G.g.sel = out.length;
  const before = { ...G.g };
  cam.x = dep.x - cam.w / 2; cam.y = dep.y - cam.h / 2;
  input.x = (dep.x - cam.x) * cam.cssW / cam.w; input.y = (dep.y - cam.y) * cam.cssH / cam.h;
  input.inside = true; input._mr[1] = true;
  G.advance(1);
  const diro0 = out.map((o) => [Math.round(o.dirox), Math.round(o.diroy)]);
  const dep0 = out.map((o) => [o.depositTo ? o.depositTo.object : null, o.wood, o.gold, o.stone, o.food, o.woodwork, o.goldwork, o.stonework, o.foodwork, o.selected]);
  const tr = out.map(() => []);
  for (let k = 0; k < 1200; k++) {
    if (k % 25 === 0) out.forEach((o, j) => tr[j].push([k, Math.round(o.x), Math.round(o.y), o.action, o.meleeSpot ? o.meleeSpot.map(Math.round) : null,
      w.path.flowAt(o.flow_field, Math.floor(o.x / 32), Math.floor(o.y / 32)), w.path.fieldAt(o.flow_field, Math.floor(o.x / 32), Math.floor(o.y / 32)),
      Math.round(w.distanceToInstance(o, dep)), (() => { const q = w.instancePlace(o, o.x, o.y, null, true); return q ? q.object : null; })()]));
    G.advance(1);
  }
  return { bb: w.bbox(dep), dep: [dep.object, dep.x, dep.y], gained: kinds.map((k) => G.g[k] - before[k]),
    workers: out.map((o, k) => ({ carry: o.wood + o.gold + o.stone + o.food, action: o.action, pos: [Math.round(o.x), Math.round(o.y)],
      tr: tr[k], diro0: diro0[k], dep0: dep0[k], diro: [Math.round(o.dirox), Math.round(o.diroy)], distDep: Math.round(w.distanceToInstance(o, dep)) })) };
}, [which, Number(nArg)]);
const ok = r.workers.filter((x) => x.carry === 0).length;
console.log("deposito", JSON.stringify(r.dep), "bbox", JSON.stringify(r.bb));
console.log(room, which, "consegnano", ok, "/", r.workers.length, "guadagno [legno, oro, pietra, cibo]", JSON.stringify(r.gained), errs.slice(0, 2));
for (const x of r.workers) if (x.carry) { const { tr, ...rest } = x; console.log("   non consegna", JSON.stringify(rest)); if (rest.dep0[0]) for (const t of tr.slice(0, 30)) console.log("      ", JSON.stringify(t)); }
process.exitCode = r.workers.some((x) => x.carry && x.dep0[0]) || errs.length ? 1 : 0;
await browser.close();
