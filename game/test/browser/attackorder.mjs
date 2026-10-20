// Prova nel browser dell'ordine di attacco di gruppo (segnalazione
// dell'autore): un gruppo misto selezionato (guerrieri, picchieri,
// cavalieri, arcieri) riceve col clic destro vero l'ordine di attaccare un
// nemico a qualche centinaio di pixel; i nemici restano fermi (la loro
// posizione la decide la prova). Gruppi distanziati, stretti (sovrapposti)
// e appena arrivati in formazione, nemici vicini e lontani, di notte e in
// difesa. Per ogni tipo: quanti sono arrivati a colpire (action 2) entro
// STEPS passi, quanti sono rimasti fermi (spostamento netto < 40 px) e i
// passi d'attesa (in cammino senza muoversi) nei primi 120. Esce con 1 se
// un soldato in mischia non arriva a colpire o aspetta in media piu' di 20
// passi (§9.38: i guerrieri sovrapposti si aspettavano a vicenda). Anche
// l'ordine dato a un gruppo ancora in marcia (walking, §9.39: i soldati in
// mischia restavano fermi, partivano solo gli arcieri).
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/attackorder.mjs [room]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [room = "match"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, cam = G.cam, p = w.path;
  G.advance(2);
  let seed = 11;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const clear = () => {
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
  };
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1 });
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  const STEPS = 500;
  const rightClick = (tx, ty) => {
    const input = w.input;
    cam.x = tx - cam.w / 2; cam.y = ty - cam.h / 2;
    input.x = (tx - cam.x) * cam.cssW / cam.w; input.y = (ty - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
  };
  const trial = ({ dx, dy, comp = 700, night = 0, fog = 1, gap = 60, premove = false, walking = false, reach = 0 }) => {
    clear();
    G.g.night = night; G.g.fogville = fog;
    const kinds = ["ally_warrior", "ally_warrior", "ally_picchiere", "ally_picchiere", "ally_cavaliere", "ally_arciere", "ally_arciere"];
    const us = kinds.map((k, n) => w.create(k, CX - 120 + (n % 4) * gap, CY - 40 + Math.floor(n / 4) * gap));
    const es = [0, 1, 2].map((n) => w.create("enemy_warrior", CX + dx + n * 40, CY + dy + (n % 2) * 40));
    G.advance(3);
    for (const e of es) { e.life = 1e9; e.slife = 75; }
    G.g.sel = 0; G.g.milsel = 0;
    for (const u of us) { u.selected = 1; u.comp = comp; G.g.sel++; G.g.milsel++; }
    if (premove) {
      // prima uno spostamento di gruppo (formazione), poi l'attacco
      rightClick(CX - 150, CY);
      for (let s = 0; s < 240; s++) { G.advance(1); es.forEach((e, n) => { w.setPos(e, CX + dx + n * 40, CY + dy + (n % 2) * 40); e.action = 0; e.warwork = 0; }); }
      for (const u of us) if (u.selected !== 1) { u.selected = 1; G.g.sel++; G.g.milsel++; }
    }
    if (walking) {
      // [§9.39] l'ordine di attacco a gruppo ancora in cammino (warwork 4)
      rightClick(CX - 120, CY - 300);
      for (let s = 0; s < 30; s++) { G.advance(1); es.forEach((e, n) => { w.setPos(e, CX + dx + n * 40, CY + dy + (n % 2) * 40); e.action = 0; e.warwork = 0; }); }
      for (const u of us) if (u.selected !== 1) { u.selected = 1; G.g.sel++; G.g.milsel++; }
    }
    const t = es[1];
    const start = us.map((u) => [u.x, u.y]);
    rightClick(t.x, t.y - 10);
    const hit = us.map(() => false), wait = us.map(() => 0);
    for (let s = 0; s < STEPS; s++) {
      for (const u of us) u.life = u.slife;
      const pos = us.map((u) => [u.x, u.y]);
      G.advance(1);
      if (s < 120) us.forEach((u, n) => { if (u.action === 1 && Math.hypot(u.x - pos[n][0], u.y - pos[n][1]) < 0.5) wait[n]++; });
      es.forEach((e, n) => { w.setPos(e, CX + dx + n * 40, CY + dy + (n % 2) * 40); e.action = 0; e.warwork = 0; e.life = 1e9; });
      us.forEach((u, n) => { if (u.action === 2) hit[n] = true; });
    }
    const out = {};
    us.forEach((u, n) => {
      const o = out[u.object] || (out[u.object] = { n: 0, hit: 0, still: 0, wait: 0, dist: [] });
      o.n++; if (hit[n] || (reach && w.distanceToInstance(u, w.nearest(u.x, u.y, "enemy_unit")) <= reach)) o.hit++;
      o.wait += wait[n] / us.filter((v) => v.object === u.object).length;
      const m = Math.hypot(u.x - start[n][0], u.y - start[n][1]);
      if (m < 40) o.still++;
      o.dist.push(Math.round(w.distanceToInstance(u, w.nearest(u.x, u.y, "enemy_unit"))));
    });
    return out;
  };
  return {
    near: trial({ dx: 250, dy: 0 }),
    diag: trial({ dx: 220, dy: 220 }),
    vert: trial({ dx: 0, dy: 350 }),
    far: trial({ dx: 600, dy: 150 }),
    defensive: trial({ dx: 300, dy: 0, comp: 200 }),
    night: trial({ dx: 300, dy: 100, night: 1 }),
    packed: trial({ dx: 300, dy: 50, gap: 16 }),
    packedFar: trial({ dx: 500, dy: 100, gap: 16 }),
    formation: trial({ dx: 250, dy: 50, premove: true }),
    formationFar: trial({ dx: 450, dy: -150, premove: true }),
    // lontano: 7 contro 3 nemici fermi e immortali, l'ultimo ad arrivare
    // puo' restare ad aspettare un posto (reach: basta arrivare alla mischia)
    veryFar: trial({ dx: 900, dy: 200, reach: 120 }),
    walkingNear: trial({ dx: 300, dy: 0, walking: true }),
    walkingFar: trial({ dx: 800, dy: 100, walking: true, reach: 120 }),
  };
});
for (const [k, r] of Object.entries(res)) console.log(k.padEnd(13), Object.entries(r).map(([o, v]) => `${o.slice(5)} ${v.hit}/${v.n} fermi ${v.still} attesa ${Math.round(v.wait)}`).join("  "));
let bad = errs.length > 0;
for (const [k, r] of Object.entries(res)) for (const [o, v] of Object.entries(r)) {
  if (o !== "ally_arciere" && v.hit < v.n) { bad = true; console.log("NON ATTACCA:", k, o, JSON.stringify(v)); }
  if (o !== "ally_arciere" && v.wait > 20) { bad = true; console.log("ASPETTA:", k, o, JSON.stringify(v)); }
}
if (errs.length) console.log(errs);
await browser.close();
process.exit(bad ? 1 : 0);
