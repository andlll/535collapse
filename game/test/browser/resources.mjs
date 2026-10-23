// Prova nel browser della scelta delle risorse dei civili (§9.68), nel match
// in campo aperto, col clic destro vero:
//   scelto       = 6 alberi in gruppo e un magazzino; il clic sull'albero
//                  piu' lontano dal civile: taglia quello e, scaricato il
//                  legno, torna a quello (prima: a 250 px passava al piu'
//                  vicino a se', e dal deposito al piu' vicino al deposito)
//   oroIgnoto    = la miniera accanto al magazzino finisce; l'unica altra e'
//                  lontana e mai vista: il civile si ferma (prima ci andava)
//   oroScoperto  = come sopra, ma l'altra miniera e' gia' stata vista: ci va
//   alberoIgnoto = l'albero finisce; gli altri sono lontani e mai visti: si
//                  ferma
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/resources.mjs [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const SEED = Number(process.argv[2] || 1);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const kind of ["scelto", "oroIgnoto", "oroScoperto", "alberoIgnoto"]) {
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
    Object.assign(g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0 });
    // il posto piu' libero lontano dal centro (e lontano dalle risorse: le
    // sole risorse vicine sono quelle messe qui)
    const c = w.all("centro").next().value;
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 4) for (let gx = 30; gx < p.gw - 30; gx += 4) {
      const x = gx * 32 + 16, y = gy * 32 + 16;
      if (Math.hypot(x - c.x, y - c.y) < 1500) continue;
      let bad = 0;
      for (let dy = -30; dy <= 30; dy += 3) for (let dx = -30; dx <= 30; dx += 3) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
    for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - CX, u.y - CY) < 1500) w.destroy(u);
    for (const n of ["albero", "miniera_oro", "stone_parent"]) for (const t of [...w.all(n)]) {
      // vicino tolte; altrove tolte anche quelle del tipo da esaurire (quelle
      // accanto agli edifici del giocatore sono scoperte, e ci si andrebbe)
      if (Math.hypot(t.x - CX, t.y - CY) < 1200 || (kind.startsWith("oro") && n === "miniera_oro") || (kind === "alberoIgnoto" && n === "albero")) {
        p.markInstance(t, 1); w.destroy(t);
      }
    }
    const mk = (o, x, y) => { const b = w.create(o, x, y); p.markInstance(b, 1000); return b; };
    const select = (list) => { for (const u of w.all("ally_unit")) u.selected = 0; for (const u of list) u.selected = 1; g.sel = list.length; g.milsel = 0; };
    const rightClickAt = (x, y) => {
      cam.x = x - cam.w / 2; cam.y = y - cam.h / 2; G.advance(1);
      input.x = (x - cam.x) * cam.cssW / cam.w; input.y = (y - cam.y) * cam.cssH / cam.h;
      input.inside = true; input._mr[1] = true; G.advance(1);
    };
    const centreOf = (b) => { const bb = w.bbox(b); return [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2]; };
    const M = mk("magazzino", CX, CY);
    if (kind === "scelto") {
      // gruppo di alberi a nord-est; il civile a sud-ovest del gruppo
      const trees = [];
      for (let k = 0; k < 6; k++) trees.push(mk("albero", CX + 250 + (k % 3) * 110, CY - 220 - Math.floor(k / 3) * 120));
      const far = trees[5]; // il piu' lontano dal civile e dal magazzino
      for (const t of trees) t.visible = true;
      const o = w.create("ally_omino", CX + 120, CY + 120);
      G.advance(3);
      select([o]); rightClickAt(...centreOf(far));
      const hits = new Map(trees.map((t) => [t, t.wood]));
      let firstChop = null, delivered = 0, backTo = null, prevWood = 0;
      for (let s = 0; s < 5000 && !backTo; s++) {
        G.advance(1);
        if (o.action === 2 && !firstChop) firstChop = w.nearest(o.woodx, o.woody, "albero");
        if (prevWood >= 10 && o.wood === 0) delivered++;
        prevWood = o.wood;
        if (delivered > 0 && o.action === 2) backTo = w.nearest(o.woodx, o.woody, "albero");
      }
      const cut = trees.filter((t) => !t.alive || t.wood < hits.get(t)).map((t) => trees.indexOf(t));
      return { ok: firstChop === far && backTo === far, primo: firstChop ? trees.indexOf(firstChop) : null, ritorno: backTo ? trees.indexOf(backTo) : null, consegne: delivered, tagliati: cut };
    }
    if (kind === "oroIgnoto" || kind === "oroScoperto") {
      const mine = mk("miniera_oro", CX - 220, CY - 60);
      mine.visible = true; mine.gold = 12;
      const other = mk("miniera_oro", CX + 1000, CY + 300);
      other.visible = kind === "oroScoperto";
      const o = w.create("ally_omino", CX - 120, CY + 120);
      G.advance(3);
      select([o]); rightClickAt(...centreOf(mine));
      let gone = -1, maxApproach = Infinity;
      const d0 = Math.hypot(o.x - other.x, o.y - other.y);
      for (let s = 0; s < 3000; s++) {
        G.advance(1);
        if (gone < 0 && !mine.alive) gone = s;
        if (gone >= 0) maxApproach = Math.min(maxApproach, Math.hypot(o.x - other.x, o.y - other.y));
      }
      const went = maxApproach < d0 - 300;
      return { ok: gone >= 0 && (kind === "oroScoperto" ? went : !went && o.action === 0), finita: gone, vaAllAltra: went, azione: o.action,
               distanzaMinima: Math.round(maxApproach), partenza: Math.round(d0) };
    }
    // alberoIgnoto
    const t = mk("albero", CX + 230, CY - 120);
    t.visible = true; t.wood = 10;
    const far = [0, 1, 2].map((k) => mk("albero", CX - 1000 - k * 110, CY + 200));
    for (const f of far) f.visible = false;
    const o = w.create("ally_omino", CX + 100, CY + 100);
    G.advance(3);
    select([o]); rightClickAt(...centreOf(t));
    let gone = -1, minD = Infinity;
    const d0 = Math.hypot(o.x - far[0].x, o.y - far[0].y);
    for (let s = 0; s < 3000; s++) {
      G.advance(1);
      if (gone < 0 && !t.alive) gone = s;
      if (gone >= 0) minD = Math.min(minD, Math.hypot(o.x - far[0].x, o.y - far[0].y));
    }
    const went = minD < d0 - 300;
    return { ok: gone >= 0 && !went && o.action === 0, finito: gone, vaAgliAltri: went, azione: o.action };
  }, [kind, SEED]);
  const good = r.ok && errs.length === 0;
  console.log(kind.padEnd(13), JSON.stringify(r), good ? "ok" : "NON VA", errs.slice(0, 2).join(" "));
  ok = ok && good;
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
