// Prova nel browser del fuoco con un gruppo misto (§9.31), in una zona
// aperta della room.
// Alleati: 4 guerrieri, 2 picchieri, 3 cavalieri e 3 arcieri selezionati,
// clic destro vero su un edificio nemico di legno (casa, caserma). Tre
// disposizioni: mescolati (mixed), cavalieri e arcieri in fila fra i fanti
// e l'edificio (front), tutti gia' vicini (near).
// Nemici: 4 guerrieri e 2 picchieri nemici a 300-400 px da una casa alleata, con
// 3 cavalieri e 3 arcieri nemici fermi in mezzo; li' i fanti la incendiano
// da soli (enemies.js).
// Per ogni prova, in 1500 passi:
//   fired   fanti arrivati a tirare frecce incendiarie (action 6), su 6
//   rev     inversioni di marcia dei fanti
//   hold    il piu' lungo spostamento di un cavaliere o di un arciere dalla
//           sua posizione (solo per farsi da parte: prima andavano verso il
//           punto cliccato, dentro l'edificio)
//   overlap unita' sovrapposte a un edificio alla fine
// Esce con codice 1 se un fante non arriva a tirare, se cavalieri e arcieri
// si spostano piu' di HOLD px o se qualcuno resta dentro un edificio.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/fireorder.mjs [room]
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "match"] = process.argv.slice(2);
const HOLD = 200;
const CASES = [["ally", "enemy_house", "mixed"], ["ally", "enemy_caserma", "mixed"], ["ally", "enemy_house", "front"],
               ["ally", "enemy_caserma", "front"], ["ally", "enemy_house", "near"], ["enemy", "casa", "front"], ["enemy", "casa", "mixed"]];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const [side, bld, lay] of CASES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const res = await page.evaluate(([SIDE, BLD, LAY]) => {
    const G = window.__game, w = G.world, p = w.path, cam = G.cam;
    G.advance(2);
    let seed = 5;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, night: 0 });
    for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
    for (const d of [...w.all("dialogo")]) w.destroy(d);
    // zona aperta: il punto con meno celle ostacolo attorno (come movement.mjs)
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
      let bad = 0;
      for (let dy = -20; dy <= 20; dy += 2) for (let dx = -24; dx <= 24; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const BX = best.gx * 32 + 16, BY = best.gy * 32 + 16;
    const h = w.create(BLD, BX, BY);
    h.life = h.slife = 5000; // non crolla durante la prova
    G.advance(2);
    const pre = SIDE === "ally" ? "ally_" : "enemy_";
    const FIRE = [pre + "warrior", pre + "warrior", pre + "warrior", pre + "warrior", pre + "picchiere", pre + "picchiere"];
    const OTHER = [pre + "cavaliere", pre + "cavaliere", pre + "cavaliere", pre + "arciere", pre + "arciere", pre + "arciere"];
    const units = [];
    const S = SIDE === "enemy" ? 200 : 0; // i nemici partono da soli entro 400 px dall'edificio
    if (LAY === "mixed") {
      [...FIRE, ...OTHER].forEach((o, k) => units.push(w.create(o, BX - 520 + S + (k % 4) * 70, BY - 120 + Math.floor(k / 4) * 80)));
    } else if (LAY === "front") {
      OTHER.forEach((o, k) => units.push(w.create(o, BX - 330 + S / 2, BY - 220 + k * 85)));
      FIRE.forEach((o, k) => units.push(w.create(o, BX - 560 + S + (k % 2) * 70, BY - 150 + Math.floor(k / 2) * 90)));
    } else {
      [...FIRE, ...OTHER].forEach((o, k) => units.push(w.create(o, BX - 260 + (k % 4) * 70, BY + 150 + Math.floor(k / 4) * 70)));
    }
    for (const u of units) if (SIDE === "enemy") { u.defender = 1; }
    G.advance(5);
    if (SIDE === "ally") {
      for (const u of w.all("ally_unit")) u.selected = 0;
      for (const u of units) u.selected = 1;
      G.g.sel = units.length; G.g.milsel = units.length; G.g.firesel = 6;
      const input = w.input;
      cam.x = h.x - cam.w / 2; cam.y = h.y - cam.h / 2;
      input.x = (h.x - cam.x) * cam.cssW / cam.w; input.y = (h.y - cam.y) * cam.cssH / cam.h;
      input.inside = true; input._mr[1] = true;
    }
    const fire = units.filter((u, k) => k < 12 && FIRE.includes(u.object));
    const other = units.filter((u) => OTHER.includes(u.object));
    const st = new Map(units.map((u) => [u, { rev: 0, px: u.x, py: u.y, dx: 0, dy: 0, x0: u.x, y0: u.y, far: 0 }]));
    for (let s = 0; s < 1500; s++) {
      G.advance(1);
      for (const u of units) {
        if (!u.alive) continue;
        const q = st.get(u), dx = u.x - q.px, dy = u.y - q.py, mv = Math.hypot(dx, dy);
        if (mv > 0.5 && Math.hypot(q.dx, q.dy) > 0.5 && dx * q.dx + dy * q.dy < 0) q.rev++;
        q.px = u.x; q.py = u.y; q.dx = dx; q.dy = dy;
        q.far = Math.max(q.far, Math.hypot(u.x - q.x0, u.y - q.y0));
        if (u.action === 6) q.fired = 1;
      }
    }
    const overlap = units.filter((u) => { const o = u.alive && w.instancePlace(u, u.x, u.y, null, true); return o && !w.is(o, "ally_unit") && !w.is(o, "enemy_unit"); }).length;
    const dbg = [];
    for (const u of units) {
      const o = u.alive && w.instancePlace(u, u.x, u.y, null, true);
      if (o && !w.is(o, "ally_unit") && !w.is(o, "enemy_unit")) dbg.push(`${u.object} dentro ${o.object} a ${Math.round(u.x)},${Math.round(u.y)} action ${u.action}`);
      if (FIRE.includes(u.object) && !st.get(u).fired) dbg.push(`${u.object} non tira: ${Math.round(u.x)},${Math.round(u.y)} action ${u.action} firework ${u.firework} warwork ${u.warwork} formX ${u.formX} target ${u.targetid ? u.targetid.object : "-"} meta ${Math.round(u.dirox)},${Math.round(u.diroy)} a ${Math.round(w.distanceToInstance(u, h))} px`);
      if (OTHER.includes(u.object) && st.get(u).far > 200) dbg.push(`${u.object} spostato ${Math.round(st.get(u).far)} px, ora ${Math.round(u.x)},${Math.round(u.y)} action ${u.action} da ${Math.round(st.get(u).x0)},${Math.round(st.get(u).y0)}`);
    }
    return {
      dbg, at: [BX, BY],
      fired: fire.filter((u) => st.get(u).fired).length,
      rev: fire.reduce((a, u) => a + st.get(u).rev, 0),
      hold: Math.round(Math.max(...other.map((u) => st.get(u).far))),
      overlap, burning: h.onfire === 1,
    };
  }, [side, bld, lay]);
  const bad = res.fired < 6 || res.hold > HOLD || res.overlap > 0 || errs.length;
  if (bad) failed = true;
  const dbg = res.dbg; delete res.dbg;
  console.log(`${side.padEnd(5)} ${bld.padEnd(13)} ${lay.padEnd(5)}`, JSON.stringify(res), bad ? "NON VA" : "", errs.slice(0, 1).join(""));
  if (bad) for (const l of dbg) console.log("     " + l);
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
