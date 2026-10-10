// Prova nel browser di un cantiere di estrazione affollato: un magazzino
// nuovo a 100-220 px da una miniera d'oro (o da una rovina di pietra), N
// civili attorno al magazzino mandati a scavare col clic destro vero, poi
// N passi. La situazione tipica di un RTS: tanti lavoratori fra una risorsa
// e un deposito vicino, che si incrociano andando e tornando.
// Misure (per i civili, fuori dal lavoro):
//   consegne, risorsa raccolta, al minuto
//   fermi  = eventi "in cammino ma meno di 6 px in 5 s"
//   spin   = la direzione cambia di almeno 20 gradi con uno spostamento < 1 px
//   rev    = inversione di marcia (spostamento opposto al passo prima, > 0,5 px)
//   flick  = lo sprite torna alla faccia di 2-6 passi prima (A -> B -> A)
//   sovrapposti = coppie di civili uno sull'altro per oltre 5 s (in cammino
//            o al lavoro); al lavoro = campioni con due civili sovrapposti
//            mentre scavano
//   lenti  = passi in cammino con meno di 0,5 px di spostamento (ingorghi)
//   in coda = passi fermi al posto d'attesa attorno alla risorsa (queueWait,
//            §9.21): non contano fra i fermi e i lenti
// La simulazione e' deterministica: lo stesso comando da' gli stessi numeri.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/mining.mjs [oro|pietra] [civili] [passi] [room]
//   (BASE=url se il gioco non e' su http://localhost:8123; SHOT=file.png:
//   screenshot del cantiere alla fine; SAVE=1: alla fine salva, ricarica
//   dallo slot, confronta lo stato e fa altri 1200 passi)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [kind = "oro", nArg = "20", stepsArg = "18000", room = "match"] = process.argv.slice(2);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(([KIND, N, STEPS]) => {
  const G = window.__game, w = G.world, cam = G.cam;
  G.advance(2);
  const input = w.input;
  let seed = 7;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (const e of [...w.all("enemy")]) w.destroy(e);
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, wood: 5000 });
  for (const u of [...w.all("ally_omino")]) w.destroy(u);
  const resName = KIND === "pietra" ? "stone_parent" : "miniera_oro";
  // la risorsa (la piu' grande, per la pietra) e un posto per il magazzino
  // a 100-220 px dal suo bordo, il piu' vicino possibile a 150
  let best = null;
  const list = [...w.all(resName)].sort((a, b) => (b.stone || b.gold || b.life || 0) - (a.stone || a.gold || a.life || 0));
  for (const r of list.slice(0, 12)) {
    for (let k = 0; k < 160; k++) {
      const a = k * 0.39, rad = 200 + (k % 8) * 30;
      const x = Math.round(r.x + Math.cos(a) * rad), y = Math.round(r.y + Math.sin(a) * rad * 0.7);
      const m = w.create("magazzino", x, y);
      const ok = w.placeFree(m, x, y) && !w.instancePlace(m, x, y, "natural_parent") && !w.instancePlace(m, x, y, "ally_build");
      const gap = ok ? w.distanceToInstance(m, r) : Infinity;
      w.destroy(m);
      if (gap >= 100 && gap <= 220 && (!best || Math.abs(gap - 150) < Math.abs(best.gap - 150))) best = { r, x, y, gap };
    }
    if (best && Math.abs(best.gap - 150) < 25) break;
  }
  if (!best) return { err: "nessun posto per il magazzino" };
  const mag = w.create("magazzino", best.x, best.y);
  G.advance(3);
  // civili attorno al magazzino, dalla parte opposta alla risorsa
  const civ = [];
  for (let k = 0; civ.length < N && k < 600; k++) {
    const a = k * 0.53, rad = 170 + k * 3;
    const o = w.create("ally_omino", Math.round(mag.x + Math.cos(a) * rad), Math.round(mag.y + Math.sin(a) * rad * 0.7));
    if (!w.placeFree(o, o.x, o.y)) { w.destroy(o); continue; }
    civ.push(o);
  }
  G.advance(5);
  const live = () => [...w.all("ally_omino")];
  const rightClick = (wx, wy) => {
    cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
    input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    G.advance(1);
  };
  for (const o of w.all("ally_omino")) o.selected = 0;
  for (const o of live()) o.selected = 1;
  G.g.sel = live().length;
  rightClick(best.r.x, best.r.y);
  for (const o of w.all("ally_omino")) o.selected = 0;
  G.g.sel = 0;
  const WORK = new Set([2, 3, 4, 5, 6, 7, 8]);
  const carry = (o) => o.wood + o.gold + o.stone + o.food;
  const before = KIND === "pietra" ? G.g.stone : G.g.gold;
  const M = { deliveries: 0, stuck: 0, spin: 0, rev: 0, flick: 0, slow: 0, walk: 0, idle: 0, overlapLong: 0, workOverlap: 0, workSamples: 0, stuckAt: [] };
  const st = new Map(), pairs = new Map();
  for (let s = 0; s < STEPS; s++) {
    G.advance(1);
    for (const o of live()) {
      const q = st.get(o) || { x: o.x, y: o.y, d: o.direction, dx: 0, dy: 0, ph: [], c: carry(o), lx: o.x, ly: o.y, still: 0 };
      const c = carry(o);
      if (q.c > 0 && c === 0 && !WORK.has(o.action)) M.deliveries++;
      const dx = o.x - q.x, dy = o.y - q.y, mv = Math.hypot(dx, dy);
      if (o.action === 0) M.idle++;
      if (!WORK.has(o.action)) {
        const dd = Math.abs(((o.direction - q.d) % 360 + 540) % 360 - 180);
        if (dd >= 20 && mv < 1) M.spin++;
        if (mv > 0.5 && Math.hypot(q.dx, q.dy) > 0.5 && dx * q.dx + dy * q.dy < 0) M.rev++;
        const h = q.ph, ph = o.phase;
        if (h.length && h[h.length - 1] !== ph) {
          for (let b = 2; b <= Math.min(6, h.length); b++) if (h[h.length - b] === ph && h.slice(-b + 1).some((z) => z !== ph)) { M.flick++; break; }
        }
        h.push(ph); if (h.length > 6) h.shift();
      }
      if (o.queueWait) { M.queue = (M.queue || 0) + 1; q.still = 0; q.lx = o.x; q.ly = o.y; }
      else if (o.action === 1) {
        M.walk++;
        if (mv < 0.5) M.slow++;
        if (s % 60 === 0) {
          if (Math.hypot(o.x - q.lx, o.y - q.ly) < 6) q.still += 60; else q.still = 0;
          q.lx = o.x; q.ly = o.y;
          if (q.still === 300) { M.stuck++; if (M.stuckAt.length < 8) M.stuckAt.push([s, Math.round(o.x), Math.round(o.y), c]); }
        }
      } else { q.still = 0; q.lx = o.x; q.ly = o.y; }
      st.set(o, { x: o.x, y: o.y, d: o.direction, dx, dy, ph: q.ph, c, lx: q.lx, ly: q.ly, still: q.still });
    }
    if (s % 30 === 0) {
      const L = live(), now = new Set();
      for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
        const A = L[a], B = L[b];
        if (!w.overlap(A, A.x, A.y, B)) continue;
        const key = A.id + "-" + B.id; now.add(key);
        const n = (pairs.get(key) || 0) + 30; pairs.set(key, n);
        if (n === 300) {
          M.overlapLong++;
          const d = (o) => `a${o.action}${o.queueWait ? "Q" : ""} w${o.goldwork}${o.stonework} c${carry(o)} ${Math.round(o.x)},${Math.round(o.y)}`
            + (o.spotRef ? ` posto ${o.spotRef.x},${o.spotRef.y}${o.spotQ ? "Q" : ""}${o.spotRef.owner === o ? "" : "(perso)"}` : " senza posto");
          if ((M.overlapAt = M.overlapAt || []).length < 6) M.overlapAt.push(`s${s} [${d(A)}] [${d(B)}]`);
        }
        if (WORK.has(A.action) && WORK.has(B.action)) M.workOverlap++;
      }
      for (const k of [...pairs.keys()]) if (!now.has(k)) pairs.delete(k);
      M.workSamples += L.filter((o) => WORK.has(o.action)).length;
    }
  }
  const gained = (KIND === "pietra" ? G.g.stone : G.g.gold) - before;
  cam.setScale(1); cam.x = (best.r.x + mag.x) / 2 - cam.w / 2; cam.y = (best.r.y + mag.y) / 2 - cam.h / 2;
  input.x = cam.cssW / 2; input.y = cam.cssH / 2;
  return { res: [best.r.object, best.r.x, best.r.y], mag: [mag.x, mag.y], gap: Math.round(best.gap), civ: live().length, gained, perMin: Math.round(gained / (STEPS / 3600)), ...M };
}, [kind, Number(nArg), Number(stepsArg)]);
if (res.err) { console.log(res.err); process.exit(1); }
if (process.env.SHOT) {
  await page.addStyleTag({ content: "#message{display:none !important}" });
  await page.evaluate(() => window.__game.loop.start());
  await page.waitForTimeout(2500);
  await page.screenshot({ path: process.env.SHOT });
}
let saveLine = "";
if (process.env.SAVE) {
  const A = await page.evaluate(async () => {
    const G = window.__game;
    const json = JSON.stringify(G.capture().state);
    await window.__pause.actions.saveGame();
    return json;
  });
  await page.goto(`${base}/index.html?room=${room}&load=slot&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const B = await page.evaluate((K) => {
    const G = window.__game, json = JSON.stringify(G.capture().state);
    const v0 = K === "pietra" ? G.g.stone : G.g.gold;
    G.advance(1200);
    return { json, more: (K === "pietra" ? G.g.stone : G.g.gold) - v0 };
  }, kind);
  saveLine = ` | salvataggio: ${A === B.json ? "ripristino identico" : "RIPRISTINO DIVERSO"}, poi +${B.more} in 1200 passi`;
}
const per = (v) => (1000 * v / Math.max(1, res.walk)).toFixed(1);
console.log(`${room} ${kind} ${res.res[0]} (${res.res[1]}, ${res.res[2]}) magazzino a ${res.gap} px, ${res.civ} civili | raccolto ${res.gained} (${res.perMin}/min), consegne ${res.deliveries}`
  + ` | in coda ${res.queue || 0} | fermi ${res.stuck} spin ${res.spin} rev ${res.rev} (${per(res.rev)}‰ in cammino) flick ${res.flick} lenti ${per(res.slow)}‰`
  + ` | sovrapposti >5 s ${res.overlapLong}, al lavoro ${res.workOverlap}/${res.workSamples} | fermi a ${JSON.stringify(res.stuckAt)}${saveLine}`, errs.length ? "ERR " + errs[0] : "");
if (process.env.VERBOSE) console.log("sovrapposti:", (res.overlapAt || []).join(" | "));
await browser.close();
