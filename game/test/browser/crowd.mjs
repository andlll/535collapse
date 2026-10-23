// Prova nel browser dei soldati che si ammassano (§9.71), nella zona piu'
// aperta della room, nemici della room tolti. Sei casi:
//   attacco    18 alleati misti, clic destro vero su 8 nemici in difesa
//   fuoco      12 fanti, clic destro vero su una casa nemica, che crolla al
//              passo 1400 (poi restano fermi li')
//   circondato 18 alleati, clic destro vero su un nemico chiuso in un anello
//              di alberi (irraggiungibile)
//   riva       lo stesso con 14 guerrieri, picchieri e cavalieri (gli arcieri
//              lo uccidono da lontano) e il nemico invulnerabile: vanno fin
//              dove si puo' e si fermano li'
//   nemici     18 nemici misti contro 6 fanti alleati invulnerabili in
//              difesa: si contano i nemici
//   mischia    18 contro 18, clic destro vero sui nemici
//   punto      18 alleati, clic destro vero dentro un anello di alberi (un
//              punto irraggiungibile)
// Per passo, fra i soldati della parte contata (non le macchine d'assedio):
//   ov      passi x coppie di soldati che si toccano (maschere)
//   long    coppie sovrapposte per almeno 180 passi di fila
//   endOv   coppie sovrapposte alla fine
//   moving  soldati ancora in cammino alla fine
//   jitter  finestre di 120 passi (una ogni 60) in cui un soldato fa piu'
//           di 150 px di strada ma meno di 40 px di spostamento netto, senza
//           combattere ne' tirare (avanti e indietro, in tondo, sul posto)
//   rev     inversioni di marcia
//   farthest (riva) la distanza dal nemico del soldato piu' lontano, alla
//           fine (parte a ~700 px; l'anello ha raggi 110 x 80)
// Prima del §9.71 (seme 3): attacco long 91, fuoco endOv 4, circondato
// jitter 34 e rev 2734, riva moving 14, endOv 78 e rev 15792, nemici
// jitter 73, mischia long 28, punto moving 9, endOv 40 e rev 9524. Esce con codice 1 se un caso supera le soglie (LIMITS).
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/crowd.mjs [room] [seme] [casi, separati da virgole]
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "match", seedArg = "3", only = ""] = process.argv.slice(2);
const LIMITS = {
  attacco: { long: 10 },
  fuoco: { endOv: 0 },
  circondato: { jitter: 2, rev: 100 },
  riva: { jitter: 2, rev: 100, moving: 0, endOv: 3, farthest: 330 },
  nemici: { jitter: 25 },
  mischia: { long: 10 },
  punto: { moving: 0, endOv: 3, jitter: 5, rev: 500 },
};
const CASES = Object.keys(LIMITS).filter((c) => !only || only.split(",").includes(c));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const C of CASES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const res = await page.evaluate(([C, SEED]) => {
    const G = window.__game, w = G.world, p = w.path, cam = G.cam;
    G.advance(2);
    const input = w.input;
    let seed = SEED;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const rnd = Math.random;
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, night: 0, hint: 0 });
    for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
    for (const d of [...w.all("dialogo")]) w.destroy(d);
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
      let bad = 0;
      for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
    const rightClick = (wx, wy) => {
      cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
      input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
      input.inside = true; input._mr[1] = true;
      G.advance(1);
    };
    const select = (list) => {
      for (const u of w.all("ally_unit")) u.selected = 0;
      for (const u of list) u.selected = 1;
      G.g.sel = list.length; G.g.milsel = list.length; G.g.firesel = list.filter((u) => /warrior|picchiere/.test(u.object)).length;
    };
    const mk = (o, x, y) => w.create(o, Math.round(x), Math.round(y));
    // un gruppo attorno a (x, y), ognuno in un posto libero
    const MIX = [["cavaliere", 4], ["warrior", 6], ["picchiere", 4], ["arciere", 4]];
    const group = (pre, x, y, mix = MIX) => {
      const out = [];
      for (const [o, n] of mix) for (let j = 0; j < n; j++) {
        for (let t = 0; t < 50; t++) {
          const a = rnd() * 6.283, r = 40 + rnd() * (160 + t * 4);
          const u = mk(pre + o, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7);
          if (w.placeFree(u, u.x, u.y)) { out.push(u); break; }
          w.destroy(u);
        }
      }
      return out;
    };
    const ring = (x, y) => { for (let k = 0; k < 22; k++) { const a = k / 22 * 6.283; p.markInstance(mk("albero", x + Math.cos(a) * 110, y + Math.sin(a) * 80), 1000); } };
    let allies = [], enemies = [], steps = 3000, house = null;
    if (C === "attacco") {
      allies = group("ally_", CX - 450, CY);
      enemies = group("enemy_", CX + 250, CY, [["warrior", 4], ["picchiere", 2], ["cavaliere", 2]]);
      for (const e of enemies) e.defender = 1;
      G.advance(5); select(allies); rightClick(enemies[0].x, enemies[0].y);
    } else if (C === "fuoco") {
      house = mk("enemy_house", CX + 200, CY);
      G.advance(2);
      allies = group("ally_", CX - 450, CY, [["warrior", 7], ["picchiere", 5]]);
      G.advance(5); select(allies); rightClick(house.x, house.y);
    } else if (C === "circondato") {
      ring(CX + 250, CY);
      const e = mk("enemy_warrior", CX + 250, CY); e.defender = 1; enemies = [e];
      G.advance(2);
      allies = group("ally_", CX - 450, CY);
      G.advance(5); select(allies); rightClick(e.x, e.y);
      steps = 2000;
    } else if (C === "riva") {
      ring(CX + 250, CY);
      const e = mk("enemy_warrior", CX + 250, CY); e.defender = 1; e.life = e.slife = 1e9; enemies = [e];
      G.advance(2);
      allies = group("ally_", CX - 450, CY, [["cavaliere", 4], ["warrior", 6], ["picchiere", 4]]);
      G.advance(5); select(allies); rightClick(e.x, e.y);
      steps = 1500;
    } else if (C === "nemici") {
      allies = group("ally_", CX - 50, CY, [["warrior", 3], ["picchiere", 3]]);
      for (const a of allies) { a.life = 100000; a.comp = 50; }
      enemies = group("enemy_", CX + 300, CY);
      steps = 2500;
    } else if (C === "mischia") {
      allies = group("ally_", CX - 300, CY);
      enemies = group("enemy_", CX + 300, CY);
      G.advance(5); select(allies); rightClick(enemies[0].x, enemies[0].y);
    } else if (C === "punto") {
      ring(CX + 250, CY);
      G.advance(2);
      allies = group("ally_", CX - 450, CY);
      G.advance(5); select(allies); rightClick(CX + 250, CY);
      steps = 1500;
    }
    select([]);
    const fam = C === "nemici" ? "enemy_unit" : "ally_militare";
    const SIEGE = /ariete|catapulta/;
    const pairs = new Map(), long = new Set(), tr = new Map();
    let ov = 0, jitter = 0, rev = 0;
    const soldiers = () => [...w.all(fam)].filter((u) => u.alive && !SIEGE.test(u.object));
    const overlaps = (L) => {
      const out = [];
      for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) if (w.overlap(L[a], L[a].x, L[a].y, L[b])) out.push([L[a], L[b]]);
      return out;
    };
    for (let s = 0; s < steps; s++) {
      if (house && s === 1400 && house.alive) house.life = 0;
      G.advance(1);
      const L = soldiers(), seen = new Set();
      for (const [A, B] of overlaps(L)) {
        const k = A.id < B.id ? A.id + "-" + B.id : B.id + "-" + A.id;
        seen.add(k); ov++;
        const n = (pairs.get(k) || 0) + 1;
        pairs.set(k, n);
        if (n >= 180) long.add(k);
      }
      for (const k of [...pairs.keys()]) if (!seen.has(k)) pairs.delete(k);
      for (const u of L) {
        let q = tr.get(u);
        if (!q) { q = { px: u.x, py: u.y, dx: 0, dy: 0, h: [] }; tr.set(u, q); }
        const dx = u.x - q.px, dy = u.y - q.py, mv = Math.hypot(dx, dy);
        if (mv > 0.5 && Math.hypot(q.dx, q.dy) > 0.5 && dx * q.dx + dy * q.dy < 0) rev++;
        q.px = u.x; q.py = u.y;
        if (mv > 0.01) { q.dx = dx; q.dy = dy; }
        q.h.push([u.x, u.y, mv, u.action === 2 || u.action === 6]);
        if (q.h.length > 120) q.h.shift();
        if (s % 60 === 0 && q.h.length === 120) {
          const path = q.h.reduce((a, e) => a + e[2], 0);
          const net = Math.hypot(q.h[119][0] - q.h[0][0], q.h[119][1] - q.h[0][1]);
          if (path > 150 && net < 40 && q.h.filter((e) => e[3]).length <= 30) jitter++;
        }
      }
    }
    const L = soldiers();
    return { ov, long: long.size, endOv: overlaps(L).length, moving: L.filter((u) => u.action === 1).length, jitter, rev,
             alive: L.length, enemiesLeft: enemies.filter((e) => e.alive).length,
             farthest: C === "riva" ? Math.round(Math.max(...L.map((u) => Math.hypot(u.x - enemies[0].x, u.y - enemies[0].y)))) : 0 };
  }, [C, Number(seedArg)]);
  const lim = LIMITS[C];
  const over = Object.keys(lim).filter((k) => res[k] > lim[k]);
  const bad = over.length > 0 || errs.length > 0;
  if (bad) failed = true;
  console.log(C.padEnd(11), JSON.stringify(res), bad ? `NON VA (${over.join(", ")})` : "", errs.slice(0, 1).join(""));
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
