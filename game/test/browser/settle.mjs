// Prova nel browser dei soldati fermi sovrapposti (§9.62): 17 soldati misti
// (cavalieri, guerrieri, picchieri, arcieri) nella zona piu' aperta del
// match, nemici tolti; ordini col clic destro vero: 6 al gruppo intero, uno
// per uno tutti nello stesso punto, due gruppi verso lo stesso punto,
// quattro gruppi verso punti vicini. Dopo ogni ordine (600-700 passi):
//   sovrapposti = coppie di soldati fermi (azione 0) che si toccano
//   in cammino  = soldati ancora in movimento
// Prima del §9.62 restavano fino a 33 coppie (quattro gruppi verso punti
// vicini). Esce con codice 1 se a fine ordine ci sono soldati fermi
// sovrapposti o ancora in cammino.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/settle.mjs [room] [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [room = "match", seedArg = "1"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(([SEED]) => {
  const G = window.__game, w = G.world, cam = G.cam, p = w.path;
  G.advance(2);
  let seed = SEED;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const rnd = Math.random;
  for (const e of [...w.all("enemy")]) w.destroy(e);
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0 });
  for (const u of [...w.all("ally_unit")]) w.destroy(u);
  G.g.fogville = 0;
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  const MIX = [["ally_cavaliere", 3], ["ally_warrior", 5], ["ally_picchiere", 4], ["ally_arciere", 5]];
  for (const [obj, n] of MIX) for (let j = 0; j < n; j++) {
    const a = rnd() * Math.PI * 2, r = 80 + rnd() * 220;
    w.create(obj, Math.round(CX + Math.cos(a) * r), Math.round(CY + Math.sin(a) * r * 0.7));
  }
  G.advance(5);
  const input = w.input;
  const rightClick = (wx, wy) => {
    cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
    input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    G.advance(1);
  };
  const all = () => [...w.all("ally_militare")];
  const select = (list) => { for (const u of w.all("ally_unit")) u.selected = 0; for (const u of list) u.selected = 1; G.g.sel = list.length; G.g.milsel = list.length; };
  const overl = () => {
    const L = all().filter((u) => u.action === 0), out = [];
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) if (w.overlap(L[a], L[a].x, L[a].y, L[b])) out.push([L[a].object.slice(5, 9), L[b].object.slice(5, 9), Math.round(Math.hypot(L[a].x - L[b].x, L[a].y - L[b].y))]);
    return out;
  };
  const rows = [];
  const after = (name, n = 600) => { G.advance(n); const o = overl(); rows.push([name, o.length, all().filter((u) => u.action === 1).length, JSON.stringify(o.slice(0, 4))]); };
  // 1) gruppo intero, 6 ordini
  for (const a of [0, 135, 270, 45, 180, 315]) { select(all()); rightClick(Math.round(CX + Math.cos(a * Math.PI / 180) * 450), Math.round(CY + Math.sin(a * Math.PI / 180) * 300)); after("gruppo " + a); }
  // 2) uno alla volta, tutti nello stesso punto
  for (const u of all()) { select([u]); rightClick(CX, CY); G.advance(20); }
  after("singoli nello stesso punto", 700);
  // 3) due gruppi verso lo stesso punto
  const L = all(), A = L.filter((u, j) => j % 2 === 0), B = L.filter((u, j) => j % 2 === 1);
  select(A); rightClick(CX + 300, CY); select(B); rightClick(CX + 300, CY); after("due gruppi stesso punto");
  // 4) piccoli gruppi a punti vicini
  for (let k = 0; k < 4; k++) { select(L.filter((u, j) => j % 4 === k)); rightClick(CX - 200 + k * 40, CY + k * 25); }
  after("4 gruppi a punti vicini");
  return rows;
}, [Number(seedArg)]);
let ok = errs.length === 0;
for (const [name, over, walking, pairs] of res) {
  const good = over === 0 && walking === 0;
  ok = ok && good;
  console.log(`${name.padEnd(28)} sovrapposti ${over}  in cammino ${walking}  ${good ? "ok" : "NON VA " + pairs}`);
}
if (errs.length) console.log(errs.slice(0, 3));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
