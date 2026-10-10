// Prova nel browser del movimento (§9.20): unita' miste (3 cavalieri, 4
// guerrieri, 3 picchieri, 4 arcieri, catapulta, ariete, 4 civili) nella zona
// piu' aperta della room, nemici tolti; 8 ordini di gruppo col clic destro
// vero, 5 incroci fra due meta' del gruppo che si scambiano di posto, poi un
// combattimento contro 12 nemici misti. Per passo e per unita' (fuori dalla
// mischia):
//   spin  = la direzione cambia di almeno 20 gradi con uno spostamento < 1 px
//           (gira su se stessa)
//   rev   = inversione di marcia (spostamento opposto al passo prima, > 0,5 px)
//   flick = lo sprite torna alla faccia di 2-6 passi prima (A -> B -> A)
//   late  = in cammino a fine ordine; off = a oltre 40 px dalla sua casella
// La simulazione e' deterministica: lo stesso comando da' gli stessi numeri.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/movement.mjs [room] [seme]
//   (BASE=url se il gioco non e' su http://localhost:8123)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
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
  const input = w.input;
  let seed = SEED;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  Math.random = rnd; // irandomRange del gioco: deterministico
  for (const e of [...w.all("enemy")]) w.destroy(e);
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1 });
  for (const u of [...w.all("ally_unit")]) w.destroy(u);
  G.g.fogville = 0;
  // zona aperta: il punto con meno celle ostacolo entro 900 px
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  const MIX = [["ally_cavaliere", 3], ["ally_warrior", 4], ["ally_picchiere", 3], ["ally_arciere", 4], ["ally_catapulta", 1], ["ally_ariete", 1], ["ally_omino", 4]];
  const units = [];
  let k = 0;
  for (const [obj, n] of MIX) for (let j = 0; j < n; j++, k++) {
    const a = rnd() * Math.PI * 2, r = 80 + rnd() * 220;
    units.push(w.create(obj, Math.round(CX + Math.cos(a) * r), Math.round(CY + Math.sin(a) * r * 0.7)));
  }
  G.advance(5);
  const rightClick = (wx, wy) => {
    cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
    input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    G.advance(1);
  };
  const select = (list) => { for (const u of w.all("ally_unit")) u.selected = 0; for (const u of list) u.selected = 1; G.g.sel = list.length; G.g.milsel = list.filter((u) => u.object !== "ally_omino").length; };
  const M = { spin: 0, rev: 0, flick: 0, late: 0, off: 0, steps: 0, unitSteps: 0, spinBy: {}, revBy: {}, overlapEnd: 0 };
  const prev = new Map();
  const measure = (n, list, tally = true) => {
    for (let s = 0; s < n; s++) {
      G.advance(1);
      M.steps++;
      for (const u of w.all("ally_unit")) {
        const q = prev.get(u) || { x: u.x, y: u.y, d: u.direction, dx: 0, dy: 0, ph: [] };
        const dx = u.x - q.x, dy = u.y - q.y, mv = Math.hypot(dx, dy);
        const dd = Math.abs(((u.direction - q.d) % 360 + 540) % 360 - 180);
        const fighting = u.action === 2 || u.action === 6;
        if (!fighting) {
          M.unitSteps++;
          if (dd >= 20 && mv < 1) { M.spin++; M.spinBy[u.object] = (M.spinBy[u.object] || 0) + 1; }
          if (mv > 0.5 && Math.hypot(q.dx, q.dy) > 0.5 && dx * q.dx + dy * q.dy < 0) { M.rev++; M.revBy[u.object] = (M.revBy[u.object] || 0) + 1; }
          const ph = u.phase;
          const h = q.ph;
          if (h.length && h[h.length - 1] !== ph) {
            for (let b = 2; b <= Math.min(6, h.length); b++) if (h[h.length - b] === ph && h.slice(-b + 1).some((z) => z !== ph)) { M.flick++; break; }
          }
          h.push(ph); if (h.length > 6) h.shift();
        }
        prev.set(u, { x: u.x, y: u.y, d: u.direction, dx, dy, ph: q.ph });
      }
    }
    M.alive = w.number("ally_unit");
    if (tally) for (const u of w.all("ally_unit")) {
      if (u.action === 1) M.late++;
      if (u.formX !== undefined && Math.hypot(u.x - u.formX, u.y - u.formY) > 40) M.off++;
    }
  };
  // 1) tutto il gruppo, 8 ordini attorno al centro
  const ANG = [0, 135, 270, 45, 180, 315, 90, 225];
  const all = () => [...w.all("ally_unit")];
  for (const a of ANG) {
    select(all());
    rightClick(Math.round(CX + Math.cos(a * Math.PI / 180) * 450), Math.round(CY + Math.sin(a * Math.PI / 180) * 300));
    measure(600, units);
  }
  // 2) incroci: due meta' che si scambiano di posto passando una nell'altra
  const A = all().filter((u, j) => j % 2 === 0), B = all().filter((u, j) => j % 2 === 1);
  select(A); rightClick(CX - 350, CY); select(B); rightClick(CX + 350, CY); measure(700, units);
  for (let r = 0; r < 4; r++) {
    const s = r % 2 === 0 ? 1 : -1;
    select(A); rightClick(CX + 350 * s, CY + (r - 1.5) * 20); select(B); rightClick(CX - 350 * s, CY - (r - 1.5) * 20);
    measure(700, units);
  }
  // 3) combattimento: nemici misti a 500 px, il gruppo li attacca
  const E = { spin: 0, rev: 0, flick: 0, eSpin: 0, eRev: 0 };
  const s0 = { spin: M.spin, rev: M.rev, flick: M.flick };
  const EN = [["enemy_warrior", 4], ["enemy_picchiere", 3], ["enemy_arciere", 3], ["enemy_cavaliere", 2]];
  const foes = [];
  let kk = 0;
  for (const [obj, n] of EN) for (let j = 0; j < n; j++, kk++) foes.push(w.create(obj, CX + 500 + (kk % 4) * 60, CY - 90 + Math.floor(kk / 4) * 60));
  for (const f of foes) f.defender = 1;
  G.advance(3);
  select(all()); rightClick(CX + 560, CY);
  const eprev = new Map();
  for (let s = 0; s < 900; s++) {
    measure(1, units, false);
    for (const e of w.all("enemy_unit")) {
      const q = eprev.get(e) || { x: e.x, y: e.y, d: e.direction, dx: 0, dy: 0 };
      const dx = e.x - q.x, dy = e.y - q.y, mv = Math.hypot(dx, dy);
      const dd = Math.abs(((e.direction - q.d) % 360 + 540) % 360 - 180);
      if (e.action !== 2) {
        if (dd >= 20 && mv < 1) E.eSpin++;
        if (mv > 0.5 && Math.hypot(q.dx, q.dy) > 0.5 && dx * q.dx + dy * q.dy < 0) E.eRev++;
      }
      eprev.set(e, { x: e.x, y: e.y, d: e.direction, dx, dy });
    }
  }
  M.fight = { spin: M.spin - s0.spin, rev: M.rev - s0.rev, flick: M.flick - s0.flick, eSpin: E.eSpin, eRev: E.eRev, foesLeft: w.number("enemy_unit"), alliesLeft: w.number("ally_unit") };
  const live = all();
  for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) if (w.overlap(live[a], live[a].x, live[a].y, live[b])) M.overlapEnd++;
  M.center = [CX, CY, best.bad];
  return M;
}, [Number(seedArg)]);
const per = (v) => (1000 * v / res.unitSteps).toFixed(2);
console.log(room, "seme", seedArg, "alive", res.alive, "us", res.unitSteps, "| spin", res.spin, `(${per(res.spin)}‰)`, "rev", res.rev, `(${per(res.rev)}‰)`, "flick", res.flick,
  "| late", res.late, "off", res.off, "overlapEnd", res.overlapEnd, "| spinBy", JSON.stringify(res.spinBy), "revBy", JSON.stringify(res.revBy), "center", JSON.stringify(res.center), errs.length ? "ERR " + errs[0] : "", "| fight", JSON.stringify(res.fight));
await browser.close();
