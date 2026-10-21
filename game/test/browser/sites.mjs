// Prova nel browser dei cantieri vicini fra loro (§9.67): in campo aperto
// nel match, col clic destro vero. Si controlla che i civili lavorino al
// cantiere ordinato e che un cantiere che finisce non fermi o non sposti chi
// lavora a un altro edificio accanto (come la fine della riparazione prima
// del §9.66):
//   dueCase      = due cantieri di casa a 150 px, 2 civili sul primo: lo
//                  finiscono lavorandoci (mai a colpi da lontano, oltre i
//                  40 px), poi passano da soli al secondo e finiscono anche lui
//   riparaVicino = 2 civili riparano un magazzino; accanto (entro 150 px)
//                  altri 2 finiscono un cantiere: i primi continuano fino a
//                  vita piena
//   dueCampi     = due cantieri di campo affiancati, 2 civili sul secondo:
//                  seminano quello (il primo resta com'e')
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/sites.mjs [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const SEED = Number(process.argv[2] || 1);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const kind of ["dueCase", "riparaVicino", "dueCampi"]) {
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
    const select = (list) => {
      for (const u of w.all("ally_unit")) u.selected = 0;
      for (const u of list) u.selected = 1;
      g.sel = list.length; g.milsel = 0;
    };
    const rightClickOn = (b) => {
      cam.x = b.x - cam.w / 2; cam.y = b.y - cam.h / 2; G.advance(1);
      const bb = w.bbox(b);
      input.x = ((bb[0] + bb[2]) / 2 - cam.x) * cam.cssW / cam.w; input.y = ((bb[1] + bb[3]) / 2 - cam.y) * cam.cssH / cam.h;
      input.inside = true; input._mr[1] = true; G.advance(1);
    };
    const civ = (n, x, y) => Array.from({ length: n }, (_, k) => w.create("ally_omino", x + k * 60, y));
    // colpi da lontano: un civile al lavoro (azione 6) a oltre 40 px dal
    // cantiere a cui va la vita (il piu' vicino al suo punto d'ordine)
    let remote = 0;
    const watchRemote = (list) => {
      for (const o of list) {
        if (o.action !== 6) continue;
        const f = w.nearest(o.buildx, o.buildy, "ally_fondamenta");
        if (f && w.distanceToInstance(o, f) > 40) remote++;
      }
    };
    if (kind === "dueCase") {
      const A = w.create("casa_fond", CX - 75, CY, { init: (f) => { f.tipo = 1; } });
      const B = w.create("casa_fond", CX + 75, CY, { init: (f) => { f.tipo = 2; } });
      G.advance(3);
      const os = civ(2, CX - 60, CY + 220);
      G.advance(3);
      select(os); rightClickOn(A);
      let doneA = -1, doneB = -1;
      for (let s = 0; s < 4000 && doneB < 0; s++) {
        G.advance(1); watchRemote(os);
        if (doneA < 0 && !A.alive) doneA = s;
        if (!B.alive) doneB = s;
      }
      return { ok: doneA >= 0 && doneB > doneA && remote === 0, A: doneA, B: doneB, remote };
    }
    if (kind === "riparaVicino") {
      // la casa che nasce dal cantiere a meno di 150 px dal punto cliccato
      // sul magazzino (prima del §9.66 bastava a fermare chi lo ripara)
      const m = w.create("magazzino", CX - 70, CY); p.markInstance(m, 1000);
      const bb = w.bbox(m), mx = (bb[0] + bb[2]) / 2, my = (bb[1] + bb[3]) / 2;
      let f = null;
      for (const [dx, dy] of [[140, 0], [130, -50], [120, 60], [0, -140], [-140, 0]]) {
        const k = w.create("casa_fond", mx + dx, my + dy, { init: (z) => { z.tipo = 1; } });
        if (!w.instancePlace(k, k.x, k.y, "ally_build")) { f = k; break; }
        p.markInstance(k, 1); w.destroy(k);
      }
      G.advance(3);
      m.life = 30;
      const rep = civ(2, CX - 160, CY + 200), bld = civ(2, CX + 60, CY + 200);
      G.advance(3);
      select(rep); rightClickOn(m);
      select(bld); rightClickOn(f);
      let built = -1, repaired = -1, lifeAtBuilt = null, repAtBuilt = null;
      for (let s = 0; s < 4000 && repaired < 0; s++) {
        G.advance(1); watchRemote(bld);
        if (built < 0 && !f.alive) { built = s; lifeAtBuilt = m.life; repAtBuilt = rep.map((o) => o.action); }
        if (m.life >= m.slife) repaired = s;
      }
      // il cantiere finisce prima che il magazzino sia riparato, e chi
      // ripara continua
      return { ok: built >= 0 && repaired > built && remote === 0 && repAtBuilt.every((a) => a === 7), cantiere: built, riparato: repaired,
               vitaAllaFine: lifeAtBuilt, riparatori: repAtBuilt, remote };
    }
    // dueCampi
    const A = w.create("campo_fond", CX - 160, CY), B = w.create("campo_fond", CX + 160, CY);
    G.advance(3);
    // i civili passano accanto al centro del primo per andare al secondo
    const os = civ(2, CX - 400, CY + 10);
    G.advance(3);
    select(os); rightClickOn(B);
    let doneB = -1;
    for (let s = 0; s < 3000 && doneB < 0; s++) { G.advance(1); if (!B.alive) doneB = s; }
    return { ok: doneB >= 0 && A.alive && A.life <= 1, B: doneB, vitaA: A.alive ? A.life : "finito" };
  }, [kind, SEED]);
  const good = r.ok && errs.length === 0;
  console.log(kind.padEnd(13), JSON.stringify(r), good ? "ok" : "NON VA", errs.slice(0, 2).join(" "));
  ok = ok && good;
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
