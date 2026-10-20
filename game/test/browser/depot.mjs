// Prova nel browser dei viaggi al deposito col carico (§9.60): un magazzino
// in campo aperto nel match, un boschetto di 6 alberi in una direzione con
// un civile per albero, al lavoro come dopo il clic destro; STEPS passi.
// Per ogni direzione:
//   consegne    = carichi di legno scaricati al magazzino
//   inversioni  = passi col carico, a meno di 120 px dal magazzino, in cui
//                 la direzione cambia di piu' di 120 gradi
// Da nord-ovest e da nord tutti arrivavano allo stesso spigolo del
// magazzino in una fila a doppio senso e si scansavano a vicenda (114 e 194
// inversioni in 6000 passi, 0 dalle altre direzioni). Esce con codice 1 se
// in una direzione le inversioni sono piu' di MAX_REV o le consegne meno di
// MIN_DEL.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/depot.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const STEPS = Number(process.env.STEPS || 4000), MAX_REV = 20, MIN_DEL = 30;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const dir of ["NW", "N", "SE"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const r = await page.evaluate(([dir, STEPS]) => {
    const G = window.__game, w = G.world, p = w.path, g = G.g;
    G.advance(2);
    let seed = 7;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const e of [...w.all("enemy_manager")]) w.destroy(e);
    for (const e of [...w.all("enemy")]) w.destroy(e);
    Object.assign(g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0 });
    // il posto piu' libero ad almeno 1500 px dal centro (il deposito piu'
    // vicino deve essere il magazzino)
    const centro = w.all("centro").next().value;
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 4) for (let gx = 30; gx < p.gw - 30; gx += 4) {
      const x = gx * 32 + 16, y = gy * 32 + 16;
      if (Math.hypot(x - centro.x, y - centro.y) < 1500) continue;
      let bad = 0;
      for (let dy = -22; dy <= 22; dy += 2) for (let dx = -22; dx <= 22; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
    for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - CX, u.y - CY) < 1200) w.destroy(u);
    const M = w.create("magazzino", CX, CY); p.markInstance(M, 1000);
    const a0 = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"].indexOf(dir) * Math.PI / 4;
    const ws = [];
    for (let k = 0; k < 6; k++) {
      const a = a0 + (k % 3 - 1) * 0.25, rr = 380 + Math.floor(k / 3) * 110;
      const tx = Math.round(CX + Math.cos(a) * rr), ty = Math.round(CY - Math.sin(a) * rr * 0.75);
      const t = w.create("albero", tx, ty); p.markInstance(t, 1000);
      const o = w.create("ally_omino", tx + Math.cos(a) * 80, ty - Math.sin(a) * 60);
      o.res = t; ws.push(o);
    }
    G.advance(3);
    // al lavoro come dopo il clic destro sull'albero
    for (const o of ws) {
      o.action = 2; o.woodwork = 0; o.woodx = o.res.x; o.woody = o.res.y; o.step = 0; o.alarm.set(2, 13); g.idle -= 1;
      o.direction = Math.atan2(-(o.res.y - o.y), o.res.x - o.x) * 180 / Math.PI;
    }
    let del = 0, rev = 0;
    const st = ws.map(() => ({ c: 0, dir: null }));
    for (let s = 0; s < STEPS; s++) {
      G.advance(1);
      ws.forEach((o, k) => {
        const S = st[k], c = o.wood + o.gold + o.stone;
        if (S.c >= 10 && c === 0) del++;
        S.c = c;
        if (c >= 10 && o.action === 1 && w.distanceToInstance(o, M) < 120) {
          if (S.dir !== null && Math.abs(((o.direction - S.dir) % 360 + 540) % 360 - 180) > 120) rev++;
          S.dir = o.direction;
        } else S.dir = null;
      });
    }
    return { del, rev };
  }, [dir, STEPS]);
  const good = r.rev <= MAX_REV && r.del >= MIN_DEL && errs.length === 0;
  console.log(`${dir.padEnd(3)} consegne ${r.del}  inversioni ${r.rev}  ${good ? "ok" : "NON VA"}${errs.length ? " " + errs.slice(0, 3) : ""}`);
  ok = ok && good;
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
