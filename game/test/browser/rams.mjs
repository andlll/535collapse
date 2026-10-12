// Prova nel browser degli arieti che attaccano lo stesso edificio (§9.32).
// Tre arieti partono a 400-500 px dal bersaglio e vanno a colpirlo da soli:
//   enemy  arieti nemici contro una casa alleata (match, zona aperta)
//   ally   arieti alleati contro una caserma nemica (match, zona aperta)
//   lvl03  arieti delle ondate contro il monastero, porta della cinta
//          abbattuta (ramTarget, §9.17)
// In 2500 passi:
//   hitOverlap  passi con due arieti sovrapposti che colpiscono tutti e due
//   overlapMax  il massimo di coppie di arieti sovrapposti (maschere; in
//               viaggio col flow field, senza collisioni, succede)
//   overlapRun  il piu' lungo tratto di passi con una coppia sovrapposta
//   overlapEnd  coppie sovrapposte alla fine
//   hitting     arieti che stanno colpendo alla fine (action 2)
//   hits        colpi arrivati al bersaglio
// Esce con codice 1 se due arieti sovrapposti colpiscono, se lo sono alla
// fine o se non colpiscono tutti e tre.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/rams.mjs
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const kind of ["enemy", "ally", "lvl03"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${kind === "lvl03" ? "lvl03" : "match"}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const res = await page.evaluate((KIND) => {
    const G = window.__game, w = G.world, p = w.path;
    G.advance(2);
    let seed = 9; globalThis.TRACE = [];
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    let target, rams;
    if (KIND === "lvl03") {
      const man = w.all("enemy_manager_lv3").next().value;
      man.phase = 1; man.revealAsked = 1;
      G.advance(3);
      for (const d of [...w.all("dialogo")]) w.destroy(d);
      for (const e of [...w.all("enemy_unit")]) w.destroy(e);
      for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
      G.g.fogville = 0; man.wave = 99; man.base = 99;
      const porta = w.all("porta_ori").next().value;
      const gate = [porta.x, porta.y];
      porta.life = 0;
      G.advance(2);
      target = w.all("monastero").next().value;
      rams = [-300, -60, 200].map((dx) => { const r = w.create("enemy_ariete", gate[0] + dx, gate[1] + 420); r.l3 = "mon"; return r; });
    } else {
      for (const e of [...w.all("enemy")]) w.destroy(e);
      for (const n of ["enemy_manager"]) for (const e of [...w.all(n)]) w.destroy(e);
      Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, night: 0 });
      for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
      let best = null;
      for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
        let bad = 0;
        for (let dy = -20; dy <= 20; dy += 2) for (let dx = -24; dx <= 24; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
        if (!best || bad < best.bad) best = { gx, gy, bad };
      }
      const BX = best.gx * 32 + 16, BY = best.gy * 32 + 16;
      target = w.create(KIND === "enemy" ? "casa" : "enemy_caserma", BX, BY);
      const obj = KIND === "enemy" ? "enemy_ariete" : "ally_ariete";
      rams = [[-450, -120], [-480, 40], [-420, 200]].map(([dx, dy]) => w.create(obj, BX + dx, BY + dy));
    }
    target.life = target.slife = 100000; // non crolla
    G.advance(2);
    const pairs = (hitting = false) => {
      let n = 0;
      for (let a = 0; a < rams.length; a++) for (let b = a + 1; b < rams.length; b++) {
        if (hitting && (rams[a].action !== 2 || rams[b].action !== 2)) continue;
        if (rams[a].alive && rams[b].alive && w.overlap(rams[a], rams[a].x, rams[a].y, rams[b])) n++;
      }
      return n;
    };
    let hitOverlap = 0;
    let overlapMax = 0, run = 0, runMax = 0, hits = 0, l0 = target.life;
    for (let s = 0; s < 2500; s++) {
      G.advance(1);
      if (target.life < l0) hits++;
      target.life = l0 = target.slife;
      for (const r of rams) r.life = r.slife;
      const n = pairs();
      if (pairs(true)) hitOverlap++;
      overlapMax = Math.max(overlapMax, n);
      run = n ? run + 1 : 0; runMax = Math.max(runMax, run);
      if (globalThis.TRACE && s % 25 === 0 && s < 700) TRACE.push(s + " " + rams.map((r) => [Math.round(r.x), Math.round(r.y), r.action, r.warwork, Math.round(r.dirox), Math.round(r.diroy), Math.round(r.meleeAng), r.siegeEnd ? "E" : "", w.placeFree(r, r.x, r.y) ? "pf" : "npf"].join(",")).join("  "));
    }
    return { trace: TRACE, hitOverlap, overlapMax, overlapRun: runMax, overlapEnd: pairs(), hitting: rams.filter((r) => r.action === 2).length, hits,
             rams: rams.map((r) => [Math.round(r.x), Math.round(r.y), r.action]) };
  }, kind);
  if (process.env.TRACE) console.log(res.trace.join("\n")); delete res.trace;
  const bad = res.hitOverlap > 0 || res.overlapEnd > 0 || res.hitting < 3 || errs.length;
  if (bad) failed = true;
  console.log(kind.padEnd(6), JSON.stringify(res), bad ? "NON VA" : "", errs.slice(0, 1).join(""));
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
