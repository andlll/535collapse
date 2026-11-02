// Prova nel browser dei fiumi disegnati come linee (§9.97), nel match, in
// una zona aperta, con un fiume com'esce da Tiled (larghezza 180, all'ultimo
// punto 100) che entra da sinistra fuori vista e finisce a punta nella vista:
//   acqua       le celle della griglia dei percorsi sotto l'acqua sono chiuse
//   guerriero   mandato col clic destro dall'altra parte: gira attorno alla
//               punta e arriva, senza mai mettere i piedi nell'acqua
//   casa        il fantasma della casa sull'acqua e' rosso (place 0), fuori no
//   pioggia     anelli delle gocce e riflessi sul fiume (sistemi "fiumi")
//   unita'      alla fine nessuna unita' coi piedi nell'acqua
//   ponte       un fiume attraverso tutta la vista, una strada (strada1) che
//               lo passa su un ponte e una strada2: sotto il ponte niente
//               acqua; un guerriero mandato sull'altra riva passa sul ponte
//               (non gira attorno) senza i piedi nell'acqua; i sassolini
//               delle strade ci sono, piu' fitti nella strada1
//   larghezza   una strada da 60 a 200 px (larghezza_fine): i sassi sono
//               sparsi come la larghezza della strada in quel punto (fra
//               1,9 e 2,8 volte di piu' verso la fine, dove e' 2,35 volte)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/rivers.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, p = w.path, cam = G.cam, M = G.manager, P = w.particles, out = {};
  // (niente nemici: arrivano anche durante la prova, e i guerrieri vanno a combattere)
  const run = (n) => { for (let k = 0; k < n; k++) { G.advance(1); for (const d of [...w.all("parent_hint"), ...w.all("enemy_unit")]) w.destroy(d); } };
  run(3);
  for (const e of [...w.all("enemy")]) w.destroy(e);
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { night: 0, fogville: 0 });
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -14; dy <= 14; dy += 2) for (let dx = -26; dx <= 26; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const cx = best.gx * 32 + 16, cy = best.gy * 32 + 16;
  cam.x = cx - cam.w / 2; cam.y = cy - cam.h / 2; cam.clamp();
  // la polilinea di tools/12_tiled_import.py (punti relativi al primo)
  const pts = [[0, 0], [400, 120], [800, -40], [1300, 60]].map(([x, y]) => [cx - 1100 + x, cy - 40 + y]);
  G.setRivers([{ pts, width: 180, widthEnd: 100 }]);
  const rc = w._riverCells, wet = (x, y) => !!rc.grid[Math.floor(y / rc.C) * rc.gw + Math.floor(x / rc.C)];
  out.acqua = { celle: p._river.length, ok: p._river.length > 50 && p._river.every((k) => p.cost[k] >= 1000) };
  // guerriero: sotto il fiume, mandato sopra
  for (const u of [...w.all("ally_unit")]) u.selected = 0;
  const u = w.create("ally_warrior", cx - 300, cy + 200); run(3);
  u.life = u.slife = 100000;
  u.selected = 1; G.g.sel = 1; G.g.milsel = 1;
  const input = w.input, at = (x, y) => { input.x = (x - cam.x) * cam.cssW / cam.w; input.y = (y - cam.y) * cam.cssH / cam.h; input.inside = true; };
  const tx = cx - 300, ty = cy - 220;
  at(tx, ty); input._mr[1] = true; run(1); u.selected = 0;
  let feet = 0, maxX = -1e9, arrived = -1;
  for (let k = 0; k < 900 && arrived < 0; k++) {
    run(1);
    if (wet(u.x, u.y)) feet++;
    maxX = Math.max(maxX, u.x);
    if (Math.hypot(u.x - tx, u.y - ty) < 40) arrived = k;
  }
  const tip = pts[pts.length - 1][0];
  out.guerriero = { arrivato: arrived, piediInAcqua: feet, girato: Math.round(maxX - tip) };
  out.guerriero.ok = arrived > 0 && feet === 0 && maxX > tip;
  // fantasma della casa
  const pl = w.create("casa_placer", cx - 200, cy - 20);
  at(cx - 200, cy - 20); run(2); const sul = pl.place;
  at(cx - 200, cy + 250); run(2); const fuori = pl.place;
  w.destroy(pl);
  out.casa = { sulFiume: sul, fuori, ok: sul === 0 && fuori === 1 };
  // pioggia (gia' piena), poi i sistemi del fiume
  M.alarm(4); M.rain.level = 1; w.overcast = 1; run(300);
  const parts = (kind) => P.systems.filter((s) => s.kind === kind).reduce((n, s) => n + s.parts.length, 0);
  out.pioggia = { anelli: parts("ripples:fiumi"), riflessi: parts("water:fiumi") };
  out.pioggia.ok = out.pioggia.anelli > 0 && out.pioggia.riflessi > 0;
  const inWater = [...w.all("ally_unit"), ...w.all("enemy_unit")].filter((o) => o.alive && wet(o.x, o.y)).map((o) => o.object);
  out.unita = { inAcqua: inWater, ok: inWater.length === 0 };
  // ponte e strade
  M.stopRain && M.stopRain();
  const river = { width: 180, pts: [[cx - 1100, cy - 40], [cx - 700, cy + 80], [cx - 300, cy - 80], [cx + 200, cy + 20], [cx + 1100, cy - 60]] };
  const road1 = { width: 110, kind: 1, pts: [[cx - 420, cy - 600], [cx - 330, cy - 300], [cx - 300, cy - 80], [cx - 250, cy + 150], [cx + 100, cy + 330]] };
  const road2 = { width: 110, kind: 2, pts: [[cx - 900, cy + 300], [cx - 500, cy + 250], [cx - 250, cy + 150]] };
  const bridge = { pts: [[cx - 350, cy - 190], [cx - 250, cy - 190], [cx - 250, cy + 20], [cx - 350, cy + 20]] };
  G.setRivers([river], [road1, road2], [bridge]);
  w.destroy(u); // il guerriero di prima, fermo proprio all'uscita del ponte
  const rc2 = w._riverCells, wet2 = (x, y) => !!rc2.grid[Math.floor(y / rc2.C) * rc2.gw + Math.floor(x / rc2.C)];
  const v = w.create("ally_warrior", cx - 290, cy + 200); run(3);
  v.life = v.slife = 100000;
  for (const o of [...w.all("ally_unit")]) o.selected = 0;
  v.selected = 1; G.g.sel = 1; G.g.milsel = 1;
  const bx = cx - 310, by = cy - 300;
  at(bx, by); input._mr[1] = true; run(1); v.selected = 0; input.inside = false;
  let feet2 = 0, arr2 = -1, far = 0;
  for (let k = 0; k < 900 && arr2 < 0; k++) {
    run(1);
    if (wet2(v.x, v.y)) feet2++;
    far = Math.max(far, Math.abs(v.x - (cx - 300)));
    if (Math.hypot(v.x - bx, v.y - by) < 40) arr2 = k;
  }
  const [s1, s2] = w.roads.map((g) => g.stones.length);
  out.ponte = { sottoAcqua: wet2(cx - 300, cy - 80), arrivato: arr2, piediInAcqua: feet2, scostamento: Math.round(far), sassi: [s1, s2] };
  // larghezza_fine: una strada1 da 60 a 200 px, i sassi all'inizio e alla
  // fine (scarto trasversale): piu' larga in fondo
  const taper = { width: 60, widthEnd: 200, kind: 1, pts: [[cx - 800, cy + 600], [cx + 800, cy + 600]] };
  G.setRivers([], [taper], []);
  const st = w.roads[0].stones, band = (x0, x1) => {
    const ys = st.filter((q) => q[0] > x0 && q[0] < x1).map((q) => q[1]);
    const m = ys.reduce((a, b) => a + b, 0) / ys.length;
    return Math.round(Math.sqrt(ys.reduce((a, b) => a + (b - m) ** 2, 0) / ys.length));
  };
  out.larghezza = { inizio: band(cx - 700, cx - 500), fine: band(cx + 500, cx + 700) };
  // (nei due tratti la strada e' larga ~77 e ~182 px: 2,35 volte)
  out.larghezza.ok = out.larghezza.fine > 1.9 * out.larghezza.inizio && out.larghezza.fine < 2.8 * out.larghezza.inizio;
  out.ponte.ok = !out.ponte.sottoAcqua && wet2(cx - 600, cy + 20) && arr2 > 0 && feet2 === 0 && far < 150 && s1 > s2 && s2 > 100;
  return out;
}).catch((e) => ({ errore: { ok: false, msg: e.message } }));
let failed = errs.length > 0;
for (const [k, v] of Object.entries(res)) {
  console.log(k.padEnd(10), JSON.stringify(v), v.ok ? "" : "NON VA");
  if (!v.ok) failed = true;
}
if (errs.length) console.log("errori:", errs.slice(0, 3).join(" | "));
console.log(failed ? "NON VA" : "ok");
await browser.close();
process.exit(failed ? 1 : 0);
