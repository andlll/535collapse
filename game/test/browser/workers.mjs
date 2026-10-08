// Prova nel browser dei civili al lavoro (§8.19): gruppi mandati col clic
// destro (la stessa via dell'input vero) a legno, oro, pietra e cibo vicino
// al centro, poi N passi. Per gruppo: consegne, civili fermi in cammino (meno
// di 6 px in 5 s), cammino ininterrotto piu' lungo; poi le coppie di civili
// sovrapposti per oltre 5 s e i campioni con due civili sovrapposti mentre
// lavorano. Dei civili fermi stampa lo stato (meta, risorsa, cella, campo).
// La simulazione e' deterministica: lo stesso comando da' gli stessi numeri.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/workers.mjs [url] [room] [passi] [legno,oro,pietra,cibo]
//   (p.es. match 18000 10,8,6,3; SHOT=file.png: screenshot della miniera)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [base = "http://localhost:8123", room = "match", stepsArg = "9000", groupsArg = "5,4,4,3"] = process.argv.slice(2);
const GN = groupsArg.split(",").map(Number);
const outFile = process.env.OUT || "";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(async ([STEPS, GN]) => {
  const G = window.__game, w = G.world, cam = G.cam, p = w.path;
  G.advance(2);
  const input = w.input;
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  G.g.fogville = 0;
  const centro = w.all("centro").next().value || (() => { const c0 = w.all("ally_unit").next().value; const c = w.create("centro", c0.x + 200, c0.y); G.advance(2); return c; })();
  // clic destro nel punto di room (wx, wy): stessa via dell'input vero
  const rightClick = (wx, wy) => {
    cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
    input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
    input.inside = true;
    input._mr[1] = true;
    G.advance(1);
  };
  const select = (list) => { for (const o of w.all("ally_omino")) o.selected = 0; for (const o of list) o.selected = 1; G.g.sel = list.length; };
  // posti liberi attorno al centro per i civili nuovi
  const spawn = (n) => {
    const out = [];
    for (let k = 0; out.length < n && k < 400; k++) {
      const a = k * 0.7, r = 180 + k * 6;
      const x = centro.x + Math.cos(a) * r, y = centro.y + Math.sin(a) * r * 0.6;
      const o = w.create("ally_omino", x, y);
      if (!w.placeFree(o, o.x, o.y)) { w.destroy(o); continue; }
      out.push(o);
    }
    return out;
  };
  const near = (name) => w.nearest(centro.x, centro.y, name);
  // campi: 3 vicino al centro, dove c'e' posto
  let campi = 0;
  for (let k = 0; campi < 3 && k < 300; k++) {
    const a = k * 0.5, r = 400 + k * 4;
    const x = Math.round(centro.x + Math.cos(a) * r), y = Math.round(centro.y + Math.sin(a) * r * 0.6);
    const c = w.create("campo", x, y);
    if (!w.placeFree(c, x, y) || w.instancePlace(c, x, y, "ally_build") || w.instancePlace(c, x, y, "natural_parent")) { w.destroy(c); continue; }
    campi++;
  }
  G.advance(2);
  const groups = [["albero", GN[0]], ["miniera_oro", GN[1]], ["stone_parent", GN[2]], ["campo", GN[3]]];
  const workers = [];
  for (const [res, n] of groups) {
    const t = near(res);
    if (!t || !n) continue;
    const list = spawn(n);
    G.advance(3);
    select(list.filter((o) => o.alive));
    rightClick(t.x, t.y);
    for (const o of list) if (o.alive) workers.push({ o, res, tx: t.x, ty: t.y });
  }
  select([]);
  const diag = (o, s, c) => {
    const gx = Math.floor(o.x / 32), gy = Math.floor(o.y / 32), f = o.flow_field;
    const resName = o.woodwork ? "albero" : o.goldwork ? "miniera_oro" : o.stonework ? "stone_parent" : o.foodwork === 2 ? "ally_barn" : null;
    const tx = o.woodwork === 1 ? o.woodx : o.goldwork === 1 ? o.goldx : o.stonework === 1 ? o.stonex : o.dirox;
    const ty = o.woodwork === 1 ? o.woody : o.goldwork === 1 ? o.goldy : o.stonework === 1 ? o.stoney : o.diroy;
    const t = resName ? w.nearest(tx, ty, resName) : null;
    const other = w.instancePlace(o, o.x, o.y, null, true);
    const dep = w.nearest(o.x, o.y, "ally_magazza");
    return { s, x: Math.round(o.x), y: Math.round(o.y), action: o.action, work: [o.woodwork, o.goldwork, o.stonework, o.foodwork], carry: c,
      diro: [Math.round(o.dirox), Math.round(o.diroy)], target: [Math.round(tx), Math.round(ty)],
      distDiro: Math.round(Math.hypot(o.x - o.dirox, o.y - o.diroy)), distRes: t ? Math.round(w.distanceToInstance(o, t)) : null,
      distDep: dep ? Math.round(w.distanceToInstance(o, dep)) : null,
      cellCost: p.costAt(gx, gy), fieldVal: f ? p.fieldAt(f, gx, gy) : null, flowDir: f ? p.flowAt(f, gx, gy) : null,
      placeFree: w.placeFree(o, o.x, o.y), overlapWith: other ? other.object : null, dir: Math.round(o.direction),
      goal: [o.goal_x, o.goal_y] };
  };
  // misure
  const W = workers.map(({ o, res }) => ({ id: o.id, res, deliveries: 0, carried: 0, last: { x: o.x, y: o.y }, still: 0, stuckEvents: [], walk: 0, maxWalk: 0, idle: 0, trace: [] }));
  const carry = (o) => o.wood + o.gold + o.stone + o.food;
  const before = { wood: G.g.wood, gold: G.g.gold, stone: G.g.stone, food: G.g.food };
  let overlapPairs = new Map();
  const overlapEvents = [];
  let workOverlap = 0, workSamples = 0;
  const workPairs = new Set();
  for (let s = 0; s < STEPS; s++) {
    G.advance(1);
    workers.forEach(({ o }, k) => {
      const m = W[k];
      if (!o.alive) return;
      const c = carry(o);
      if (m.carried > 0 && c === 0 && o.action !== 2 && o.action !== 3 && o.action !== 4 && o.action !== 5) m.deliveries++;
      m.carried = c;
      if (o.action === 1) {
        m.walk++; m.maxWalk = Math.max(m.maxWalk, m.walk);
        const d = Math.hypot(o.x - m.last.x, o.y - m.last.y);
        if (s % 60 === 0) {
          if (d < 6) { m.still += 60; } else m.still = 0;
          m.last = { x: o.x, y: o.y };
          if (m.still === 300) m.stuckEvents.push(diag(o, s, c));
        }
      } else { m.walk = 0; m.still = 0; m.last = { x: o.x, y: o.y }; }
      if (o.action === 0) m.idle++;
      if (s % 30 === 0) m.trace.push([s, Math.round(o.x), Math.round(o.y), o.action, o.woodwork, o.goldwork, o.stonework, o.foodwork, c]);
    });
    if (s % 30 === 0) {
      const live = workers.map((x) => x.o).filter((o) => o.alive);
      const now = new Set();
      for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) {
        const A = live[a], B = live[b];
        if (Math.hypot(A.x - B.x, A.y - B.y) < 12) {
          const key = A.id + "-" + B.id; now.add(key);
          const n = (overlapPairs.get(key) || 0) + 30; overlapPairs.set(key, n);
          if (n === 300) overlapEvents.push({ s, a: A.id, b: B.id, x: Math.round(A.x), y: Math.round(A.y), actA: A.action, actB: B.action });
        }
      }
      for (const k of [...overlapPairs.keys()]) if (!now.has(k)) overlapPairs.delete(k);
      const working = live.filter((o) => o.action === 2 || o.action === 3 || o.action === 5);
      workSamples += working.length;
      for (let a = 0; a < working.length; a++) for (let b = a + 1; b < working.length; b++) {
        if (w.overlap(working[a], working[a].x, working[a].y, working[b])) { workOverlap++; workPairs.add(working[a].id + "-" + working[b].id); }
      }
    }
  }
  { const m = near("miniera_oro"); cam.setScale(1); cam.x = m.x - cam.w / 2; cam.y = m.y - cam.h / 2 + 40; }
  const gained = { wood: G.g.wood - before.wood, gold: G.g.gold - before.gold, stone: G.g.stone - before.stone, food: G.g.food - before.food };
  return { workOverlap, workSamples, workPairs: workPairs.size, gained, workers: W.map(({ last, still, walk, ...r }) => r), overlapEvents, deposits: [...w.all("ally_magazza")].map((m) => [m.object, m.x, m.y]), campi };
}, [Number(stepsArg), GN]);
const fs = await import("node:fs");
if (process.env.SHOT) { await page.addStyleTag({ content: "#message{display:none !important}" }); await page.evaluate(() => { const l = window.__game.loop; if (l && l.start) l.start(); }); await page.waitForTimeout(1500); await page.screenshot({ path: process.env.SHOT, clip: { x: 340, y: 140, width: 600, height: 420 } }); }
if (outFile) fs.writeFileSync(outFile, JSON.stringify(res));
console.log(room, "risorse raccolte", JSON.stringify(res.gained), "campi", res.campi, "errori", errs.slice(0, 3));
const by = {};
for (const m of res.workers) {
  const b = (by[m.res] ||= { n: 0, deliveries: 0, stuck: 0, idleSteps: 0, maxWalk: 0 });
  b.n++; b.deliveries += m.deliveries; b.stuck += m.stuckEvents.length; b.idleSteps += m.idle; b.maxWalk = Math.max(b.maxWalk, m.maxWalk);
}
for (const [k, b] of Object.entries(by)) console.log(" ", k.padEnd(13), JSON.stringify(b));
console.log("  sovrapposizioni prolungate (>5 s):", res.overlapEvents.length, "| mentre lavorano: campioni", res.workOverlap, "su", res.workSamples, "coppie diverse", res.workPairs);
for (const m of res.workers) for (const e of m.stuckEvents.slice(0, 3)) console.log("   bloccato", m.id, m.res, JSON.stringify(e));
for (const e of res.overlapEvents.slice(0, 6)) console.log("   sovrapposti", JSON.stringify(e));
await browser.close();
