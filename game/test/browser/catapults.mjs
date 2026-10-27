// Prova nel browser delle catapulte una sopra l'altra (§9.79). Nella zona
// aperta del match:
//   ally   4 catapulte alleate in un quadrato, maschere quasi a contatto, a ~600 px da una
//          caserma nemica: tirano da sole
//   enemy  lo stesso con 4 catapulte nemiche contro una casa alleata
//   group  6 catapulte alleate selezionate, mandate col clic destro vero in
//          un punto libero
// Due catapulte sono "addosso" se i centri distano meno di 170 px in x e
// meno di 120 in y (l'ingombro del disegno, SIEGE_FOOT in siege.js). In
// 2400 passi:
//   crowdFire  passi con due catapulte addosso che tirano o ricaricano
//              tutte e due (ally, enemy)
//   crowdEnd   coppie addosso alla fine
//   shots      sassi arrivati sul bersaglio (ally, enemy)
//   moving     catapulte ancora in cammino alla fine (group)
// Esce con codice 1 se a fine prova ci sono coppie addosso, se tirando lo
// sono per piu' di 300 passi o se non tirano.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/catapults.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const kind of ["ally", "enemy", "group"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const res = await page.evaluate((KIND) => {
    const G = window.__game, w = G.world, p = w.path, cam = G.cam;
    G.advance(2);
    const input = w.input;
    let seed = 5;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const e of [...w.all("enemy_manager")]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, night: 0 });
    for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
      let bad = 0;
      for (let dy = -24; dy <= 24; dy += 2) for (let dx = -30; dx <= 30; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const BX = best.gx * 32 + 16, BY = best.gy * 32 + 16;
    let target = null, cats;
    if (KIND === "group") {
      cats = [0, 1, 2, 3, 4, 5].map((k) => w.create("ally_catapulta", BX - 300 + (k % 3) * 120, BY - 100 + Math.floor(k / 3) * 105));
    } else {
      target = w.create(KIND === "enemy" ? "casa" : "enemy_caserma", BX + 350, BY);
      target.life = target.slife = 100000; // non crolla
      const obj = KIND === "enemy" ? "enemy_catapulta" : "ally_catapulta";
      // maschere quasi a contatto (111 x 96): i disegni si coprono per meta'
      cats = [[0, 0], [115, 0], [0, 100], [115, 100]].map(([dx, dy]) => w.create(obj, BX - 360 + dx, BY - 50 + dy));
    }
    G.advance(3);
    cats = [...w.all(cats[0].object)]; // nata in un posto occupato, una catapulta rinasce piu' in la' (Alarm_3)
    if (KIND === "group") {
      for (const c of cats) c.selected = 1;
      G.advance(1);
      const gx = BX + 250, gy = BY + 50;
      cam.x = gx - cam.w / 2; cam.y = gy - cam.h / 2; G.advance(1);
      input.x = (gx - cam.x) * cam.cssW / cam.w; input.y = (gy - cam.y) * cam.cssH / cam.h; input.inside = true;
      G.advance(1); input._mr[1] = true; G.advance(1);
    }
    const crowd = (both) => {
      let n = 0;
      for (let a = 0; a < cats.length; a++) for (let b = a + 1; b < cats.length; b++) {
        const A = cats[a], B = cats[b];
        if (!A.alive || !B.alive || A.action === 1 || B.action === 1) continue;
        if (both && !((A.action === 2 || A.action === 3) && (B.action === 2 || B.action === 3))) continue;
        if (Math.abs(A.x - B.x) < 170 && Math.abs(A.y - B.y) < 120) n++;
      }
      return n;
    };
    let crowdFire = 0, shots = 0, l0 = target ? target.life : 0;
    for (let s = 0; s < 2400; s++) {
      G.advance(1);
      for (const c of cats) c.life = c.slife;
      if (target) { if (target.life < l0) shots++; target.life = l0 = target.slife; }
      if (crowd(true)) crowdFire++;
    }
    return { crowdFire, crowdEnd: crowd(false), shots, moving: cats.filter((c) => c.action === 1).length,
             obj: cats[0].object, cats: cats.map((c) => [Math.round(c.x), Math.round(c.y), c.action]) };
  }, kind);
  const bad = res.crowdEnd > 0 || res.crowdFire > 300 || (kind !== "group" && res.shots < 8) || (kind === "group" && res.moving > 0) || errs.length;
  if (bad) failed = true;
  console.log(kind.padEnd(6), JSON.stringify(res), bad ? "NON VA" : "", errs.slice(0, 1).join(""));
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
