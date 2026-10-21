// Prova nel browser degli ordini verso un edificio con un ostacolo in mezzo
// (§9.64): in campo aperto nel match, una caserma fra le unita' e la meta,
// tutto entro poche centinaia di px (dove gli ordini andavano dritti). Col
// clic destro vero:
//   presidio    = 2 arcieri a sud della caserma, la torre a nord: entrano
//   costruzione = 2 civili a sud, il cantiere di una casa a nord: lo finiscono
//                 lavorandoci tutti e due (entro 800 passi)
//   riparazione = 2 civili a sud, un magazzino danneggiato a nord: lo riparano
//                 tutti e due (entro 1200 passi)
//   senzaLegno  = un civile accanto a un magazzino danneggiato, legno 0:
//                 si ferma inattivo (prima martellava senza effetto)
//   accanto     = 2 civili, un magazzino danneggiato con una casa integra a
//                 meno di 150 px dal punto cliccato (§9.66): lo riparano
//                 fino in fondo (prima la casa integra li fermava subito)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/blocked.mjs [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const SEED = Number(process.argv[2] || 1);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const kind of ["presidio", "costruzione", "riparazione", "senzaLegno", "accanto"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const r = await page.evaluate(([kind, SEED]) => {
    const G = window.__game, w = G.world, cam = G.cam, p = w.path, g = G.g;
    let seed = SEED;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    G.advance(3);
    const input = w.input;
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const e of [...w.all("enemy_manager")]) w.destroy(e);
    Object.assign(g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0, food: 5000, wood: 5000, gold: 5000, stone: 5000, popcap: 200 });
    // il posto piu' libero lontano dal centro
    const c = w.all("centro").next().value;
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 4) for (let gx = 30; gx < p.gw - 30; gx += 4) {
      const x = gx * 32 + 16, y = gy * 32 + 16;
      if (Math.hypot(x - c.x, y - c.y) < 1500) continue;
      let bad = 0;
      for (let dy = -20; dy <= 20; dy += 2) for (let dx = -20; dx <= 20; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
    for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - CX, u.y - CY) < 1200) w.destroy(u);
    const mk = (o, x, y) => { const b = w.create(o, x, y); p.markInstance(b, 1000); return b; };
    const select = (list) => {
      for (const u of w.all("ally_unit")) u.selected = 0;
      for (const u of list) u.selected = 1;
      g.sel = list.length; g.milsel = list.filter((u) => u.object !== "ally_omino").length;
      g.arcsel = list.filter((u) => u.object === "ally_arciere").length;
    };
    const rightClickOn = (b) => {
      cam.x = b.x - cam.w / 2; cam.y = b.y - cam.h / 2; G.advance(1);
      const bb = w.bbox(b);
      input.x = ((bb[0] + bb[2]) / 2 - cam.x) * cam.cssW / cam.w; input.y = ((bb[1] + bb[3]) / 2 - cam.y) * cam.cssH / cam.h;
      input.inside = true; input._mr[1] = true; G.advance(1);
    };
    if (kind === "senzaLegno") {
      const m = mk("magazzino", CX, CY);
      G.advance(2);
      m.life = 60;
      const o = w.create("ally_omino", CX - 40, CY + 110);
      G.advance(3);
      g.wood = 0;
      select([o]); rightClickOn(m);
      let hammering = 0;
      for (let s = 0; s < 900; s++) { G.advance(1); if (o.action === 7) hammering++; }
      return { ok: o.action === 0 && o.repairwork === 0 && m.life === 60 && hammering < 60, action: o.action, hammering, life: m.life };
    }
    if (kind === "accanto") {
      const m = mk("magazzino", CX, CY);
      // una casa integra accanto, senza toccarlo, a meno di 150 px dal centro
      // del suo riquadro (il punto cliccato)
      const bb = w.bbox(m), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
      let casa = null;
      for (const [dx, dy] of [[140, 0], [-140, 0], [0, -140], [130, -60], [-130, -60], [120, 60], [-120, 60]]) {
        const h = w.create("casa", cx + dx, cy + dy);
        if (!w.instancePlace(h, h.x, h.y, "ally_build") && Math.hypot(h.x - cx, h.y - cy) < 150) { p.markInstance(h, 1000); casa = h; break; }
        w.destroy(h);
      }
      G.advance(2);
      m.life = 60;
      const os = [0, 1].map((k) => w.create("ally_omino", CX - 40 + k * 60, CY + 140));
      G.advance(3);
      select(os); rightClickOn(m);
      let done = -1;
      for (let s = 0; s < 2000 && done < 0; s++) { G.advance(1); if (m.life >= m.slife) done = s; }
      return { ok: !!casa && casa.life >= casa.slife && done >= 0, casa: !!casa, passi: done, vita: m.life };
    }
    mk("caserma", CX, CY);
    const north = [CX, CY - 190], south = [CX - 30, CY + 170];
    let target, units;
    if (kind === "presidio") {
      target = mk("torre", ...north);
      units = [0, 1].map((k) => w.create("ally_arciere", south[0] + k * 60, south[1]));
    } else if (kind === "costruzione") {
      target = mk("casa_fond", ...north);
      target.tipo = 1;
      units = [0, 1].map((k) => w.create("ally_omino", south[0] + k * 60, south[1]));
    } else {
      target = mk("magazzino", ...north);
      units = [0, 1].map((k) => w.create("ally_omino", south[0] + k * 60, south[1]));
    }
    G.advance(3);
    if (kind === "riparazione") target.life = 40;
    select(units); rightClickOn(target);
    const life0 = target.life;
    let done = -1;
    for (let s = 0; s < 3000 && done < 0; s++) {
      G.advance(1);
      if (kind === "presidio" && target.npresidio === 2) done = s;
      if (kind === "costruzione" && !target.alive) done = s;
      if (kind === "riparazione" && target.life >= target.slife) done = s;
    }
    // con tutti e due al lavoro: prima uno restava dietro la caserma (954 e
    // 1500-1585 passi)
    const limit = { presidio: 600, costruzione: 800, riparazione: 1200 }[kind];
    return { ok: done >= 0 && done <= limit, passi: done, vita: [life0, target.alive ? target.life : "finito"],
      unita: units.map((u) => u.alive && [Math.round(u.x - target.x), Math.round(u.y - target.y), u.action]) };
  }, [kind, SEED]);
  const good = r.ok && errs.length === 0;
  console.log(kind.padEnd(12), JSON.stringify(r), good ? "ok" : "NON VA", errs.slice(0, 2).join(" "));
  ok = ok && good;
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
