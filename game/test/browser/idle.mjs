// Prova nel browser dei civili inattivi (contatore in alto a destra, Spazio
// e clic sul pulsante: idle_clicker in buildings.js, recountIdle in
// civilians.js). Scenari in `match`, nemici tolti; per ognuno controlli
// PASS/FAIL con i dettagli:
//  1 base        N civili fermi: contatore, Spazio li scorre tutti una volta
//                per giro, uno selezionato alla volta, camera centrata e
//                dentro la room
//  2 pulsante    il clic sul riquadro seleziona il prossimo (aggiunge alla
//                selezione, come l'originale)
//  3 dinamico    a giro iniziato alcuni partono e altri si fermano: niente
//                doppioni ne' civili saltati
//  4 coda        20 civili su una miniera: chi aspetta un posto (queueWait)
//                non conta come inattivo
//  5 finita      la miniera si esaurisce e non ce ne sono altre: tutti
//                diventano inattivi (anche chi era in coda o per strada)
//  6 deposito    distrutti i depositi con i civili carichi: si fermano e
//                contano come inattivi; 6b: se ce n'e' un altro, si porta li'
//  7 nascosti    lunga raccolta mista: nessun civile "perso" (in cammino,
//                fermo da oltre 10 s, senza lavoro in coda) fuori dal
//                contatore
//  8 bordo       un civile fermo nell'angolo della mappa: la camera resta
//                nella room
//  9 salvataggio l'ordine di Spazio sopravvive al salvataggio
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/idle.mjs [url]
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [base = process.env.BASE || "http://localhost:8123"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let fails = 0;
const report = (name, checks) => {
  for (const [ok, label, detail] of checks) {
    if (!ok) fails++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${label}${detail !== undefined ? "  " + JSON.stringify(detail) : ""}`);
  }
};

async function scenario(name, fn, arg) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  await page.evaluate(() => {
    const G = window.__game, w = G.world;
    G.advance(2);
    let seed = 11;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const n of ["enemy_manager"]) for (const e of [...w.all(n)]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, wood: 5000 });
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
    for (const h of Object.keys(w.behaviours).filter((k) => k.startsWith("hint_"))) for (const d of [...w.all(h)]) w.destroy(d);
    G.advance(2);
    // aiuti comuni
    const input = w.input, cam = G.cam;
    window.T = {
      G, w, input, cam,
      spawn(n, cx, cy, r0 = 120) {
        const out = [];
        for (let k = 0; out.length < n && k < 800; k++) {
          const a = k * 0.53, r = r0 + k * 3;
          const o = w.create("ally_omino", Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.7));
          if (!w.placeFree(o, o.x, o.y)) { w.destroy(o); continue; }
          out.push(o);
        }
        G.advance(3);
        return out.filter((o) => o.alive);
      },
      space() { input._pressed.add(32); G.advance(1); },
      rightClick(wx, wy) {
        cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
        input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
        input.inside = true; input._mr[1] = true; G.advance(1);
      },
      select(list) { for (const u of w.all("ally_unit")) u.selected = 0; for (const u of list) u.selected = 1; G.advance(1); },
      idleNow: () => [...w.all("ally_omino")].filter((o) => o.action === 0),
      selected: () => [...w.all("ally_unit")].filter((o) => o.selected === 1),
      camOk: () => cam.x >= -0.5 && cam.y >= -0.5 && cam.x <= cam.roomW - cam.w + 0.5 && cam.y <= cam.roomH - cam.h + 0.5,
      centre: () => { const c = w.all("centro").next().value; return c ? [c.x, c.y] : [2152, 1002]; },
    };
  });
  const checks = await page.evaluate(fn, arg);
  checks.push([errs.length === 0, "nessun errore nella pagina", errs.slice(0, 2)]);
  report(name, checks);
  await page.close();
}

// 1 base: Spazio scorre tutti i fermi, uno per volta
await scenario("1 base", () => {
  const { G, w, cam } = T, [cx, cy] = T.centre();
  const list = T.spawn(8, cx, cy + 260);
  G.advance(30);
  const c = [];
  c.push([G.g.idle === 8 && T.idleNow().length === 8, "contatore = 8 fermi", { idle: G.g.idle, veri: T.idleNow().length }]);
  const seen = [], perPress = [], camFail = [], centreOff = [];
  for (let k = 0; k < 16; k++) {
    T.space();
    const s = T.selected();
    perPress.push(s.length);
    if (s.length === 1) {
      seen.push(s[0].id);
      const o = s[0], dx = Math.abs(cam.x + cam.w / 2 - o.x), dy = Math.abs(cam.y + cam.h / 2 - o.y);
      if (dx > 2 || dy > 2) centreOff.push([Math.round(dx), Math.round(dy)]);
    }
    if (!T.camOk()) camFail.push([Math.round(cam.x), Math.round(cam.y)]);
  }
  const first = seen.slice(0, 8), second = seen.slice(8, 16);
  c.push([perPress.every((n) => n === 1), "ogni Spazio: esattamente 1 selezionato", perPress]);
  c.push([new Set(first).size === 8, "primo giro: 8 civili diversi", first.length]);
  c.push([JSON.stringify(first) === JSON.stringify(second), "secondo giro nello stesso ordine"]);
  c.push([camFail.length === 0, "camera dentro la room", camFail.slice(0, 3)]);
  c.push([centreOff.length === 0, "camera centrata sul selezionato", centreOff.slice(0, 3)]);
  c.push([G.g.sel === T.selected().length, "g.sel = selezionati veri", { sel: G.g.sel, veri: T.selected().length }]);
  return c;
});

// 2 pulsante: il clic sul riquadro
await scenario("2 pulsante", () => {
  const { G, w, input, cam } = T, [cx, cy] = T.centre();
  T.spawn(5, cx, cy + 260);
  G.advance(30);
  const ic = w.all("idle_clicker").next().value;
  const c = [];
  const counts = [];
  for (let k = 0; k < 5; k++) {
    // il puntatore sul riquadro (lo step dell'idle_clicker lo segue in coordinate di room)
    input.x = cam.cssW - 55; input.y = 140; input.inside = true;
    G.advance(2);
    const hov = ic.hover;
    input._mr[0] = true; G.advance(1);
    counts.push([hov, T.selected().length]);
  }
  c.push([counts.every(([h]) => h === 1), "il puntatore sul riquadro lo accende (hover)", counts.map(([h]) => h)]);
  c.push([counts.map(([, n]) => n).join() === "1,2,3,4,5", "ogni clic aggiunge il prossimo inattivo", counts.map(([, n]) => n)]);
  // clic quando tutti sono gia' selezionati: nessun doppio conteggio
  input._mr[0] = true; G.advance(1);
  c.push([T.selected().length === 5 && G.g.sel === 5, "sesto clic: sempre 5, g.sel giusto", { veri: T.selected().length, sel: G.g.sel }]);
  return c;
});

// 3 dinamico: a giro iniziato alcuni partono e altri si fermano
await scenario("3 dinamico", () => {
  const { G, w } = T, [cx, cy] = T.centre();
  const list = T.spawn(10, cx, cy + 260);
  G.advance(30);
  const c = [];
  const seen = [];
  T.space(); seen.push(T.selected()[0].id);
  T.space(); seen.push(T.selected()[0].id);
  // tre (non ancora visti) partono verso un punto, poi uno dei visti
  const notSeen = list.filter((o) => !seen.includes(o.id));
  const go = notSeen.slice(0, 3);
  T.select(go); T.rightClick(cx + 600, cy + 600); T.select([]);
  G.advance(5);
  const idleAfter = G.g.idle;
  c.push([idleAfter === 7, "3 partiti: contatore 7", idleAfter]);
  const cycle = [];
  for (let k = 0; k < 7; k++) { T.space(); const s = T.selected(); cycle.push(s.length === 1 ? s[0].id : "x" + s.length); }
  const goIds = go.map((o) => o.id);
  c.push([cycle.every((id) => !goIds.includes(id)), "chi e' partito non viene selezionato", cycle]);
  c.push([new Set(cycle).size === 7, "7 Spazi: 7 civili diversi (nessuno saltato o doppio)", cycle]);
  // arrivano e si fermano: tornano nel giro
  G.advance(900);
  c.push([G.g.idle === 10 && go.every((o) => o.action === 0), "arrivati: di nuovo 10 inattivi", { idle: G.g.idle, azioni: go.map((o) => o.action) }]);
  const cycle2 = [];
  for (let k = 0; k < 10; k++) { T.space(); const s = T.selected(); cycle2.push(s.length === 1 ? s[0].id : "x" + s.length); }
  c.push([new Set(cycle2).size === 10, "10 Spazi: tutti e 10, una volta", cycle2]);
  const orders = [...w.all("ally_omino")].filter((o) => o.action === 0).map((o) => o.idleorder).sort((a, b) => a - b);
  c.push([orders.join() === "1,2,3,4,5,6,7,8,9,10", "idleorder 1..10 senza buchi", orders]);
  return c;
});

// 4 coda / 5 finita: 20 civili su una miniera piccola, poi la miniera finisce
await scenario("4-5 coda e miniera finita", () => {
  const { G, w } = T;
  const mines = [...w.all("miniera_oro")];
  const mine = mines.find((m) => Math.abs(m.x - 1847) < 5 && Math.abs(m.y - 614) < 5) || mines[0];
  for (const m of mines) if (m !== mine) w.destroy(m);
  const mag = w.create("magazzino", mine.x + 60, mine.y - 230);
  G.advance(3);
  const list = T.spawn(20, mag.x, mag.y, 170);
  T.select(list); T.rightClick(mine.x, mine.y); T.select([]);
  const c = [];
  let maxQueue = 0, badIdle = 0;
  for (let s = 0; s < 2400; s++) {
    G.advance(1);
    const q = list.filter((o) => o.alive && o.queueWait).length;
    maxQueue = Math.max(maxQueue, q);
    if (list.some((o) => o.queueWait && o.action === 0)) badIdle++;
    if (G.g.idle !== T.idleNow().length) badIdle++;
  }
  c.push([maxQueue > 0, "c'e' una coda (civili in attesa di un posto)", maxQueue]);
  c.push([badIdle === 0, "in coda non conta come inattivo; contatore sempre giusto", badIdle]);
  c.push([G.g.idle === 0, "durante la raccolta nessun inattivo", G.g.idle]);
  // la miniera quasi finita
  mine.gold = 30;
  let t = 0;
  for (; t < 3600 && T.idleNow().length < 20; t++) G.advance(1);
  const stuck = list.filter((o) => o.alive && o.action !== 0).map((o) => ({ a: o.action, gw: o.goldwork, q: !!o.queueWait, gold: o.gold, x: Math.round(o.x), y: Math.round(o.y) }));
  c.push([!mine.alive, "la miniera e' finita", mine.alive]);
  c.push([T.idleNow().length === 20, `finita la miniera tutti inattivi (in ${t} passi)`, stuck.slice(0, 5)]);
  c.push([G.g.idle === T.idleNow().length, "contatore = inattivi veri", { idle: G.g.idle, veri: T.idleNow().length }]);
  const cyc = [];
  for (let k = 0; k < 20; k++) { T.space(); const s = T.selected(); cyc.push(s.length === 1 ? s[0].id : "x" + s.length); }
  c.push([new Set(cyc).size === 20, "Spazio li trova tutti e 20", new Set(cyc).size]);
  return c;
});

// 6 deposito distrutto con i civili carichi
await scenario("6 deposito distrutto", () => {
  const { G, w } = T;
  const mine = [...w.all("miniera_oro")].find((m) => Math.abs(m.x - 1847) < 5) || w.all("miniera_oro").next().value;
  const mag = w.create("magazzino", mine.x + 60, mine.y - 230);
  G.advance(3);
  const list = T.spawn(10, mag.x, mag.y, 170);
  T.select(list); T.rightClick(mine.x, mine.y); T.select([]);
  G.advance(1500);
  for (const m of [...w.all("ally_magazza")]) w.destroy(m);
  let t = 0;
  for (; t < 2400 && T.idleNow().length < 10; t++) G.advance(1);
  const c = [];
  const rest = list.filter((o) => o.alive && o.action !== 0).map((o) => ({ a: o.action, gw: o.goldwork, gold: o.gold, q: !!o.queueWait }));
  c.push([T.idleNow().length === 10, `senza depositi tutti inattivi (in ${t} passi)`, rest.slice(0, 5)]);
  c.push([G.g.idle === T.idleNow().length, "contatore = inattivi veri", { idle: G.g.idle, veri: T.idleNow().length }]);
  return c;
});

// 6b deposito distrutto, ma ce n'e' un altro: si porta li'
await scenario("6b deposito sostituito", () => {
  const { G, w } = T;
  const mine = [...w.all("miniera_oro")].find((m) => Math.abs(m.x - 1847) < 5) || w.all("miniera_oro").next().value;
  const mag = w.create("magazzino", mine.x + 60, mine.y - 230);
  const mag2 = w.create("magazzino", mine.x - 420, mine.y + 60);
  G.advance(3);
  const list = T.spawn(10, mag.x, mag.y, 170);
  T.select(list); T.rightClick(mine.x, mine.y); T.select([]);
  G.advance(1500);
  w.destroy(mag);
  const g0 = G.g.gold;
  G.advance(2400);
  const lost = list.filter((o) => o.alive && o.action === 0).length;
  return [
    [G.g.gold - g0 >= 100, "consegne al secondo magazzino", G.g.gold - g0],
    [lost === 0 && G.g.idle === 0, "nessuno si ferma", { fermi: lost, idle: G.g.idle }],
    [mag2.alive, "il secondo magazzino c'e'", mag2.alive],
  ];
});

// 7 nascosti: lunga raccolta mista, nessun civile perso fuori dal contatore
await scenario("7 nascosti", () => {
  const { G, w } = T, [cx, cy] = T.centre();
  const near = (name) => w.nearest(cx, cy, name);
  const groups = [["albero", 8], ["miniera_oro", 10], ["stone_parent", 8]];
  const all = [];
  for (const [res, n] of groups) {
    const r = near(res);
    const l = T.spawn(n, cx, cy, 200);
    T.select(l); T.rightClick(r.x, r.y); T.select([]);
    all.push(...l);
  }
  const still = new Map(), lost = [];
  let mismatch = 0;
  for (let s = 0; s < 14400; s++) {
    G.advance(1);
    if (G.g.idle !== T.idleNow().length) mismatch++;
    if (s % 60) continue;
    for (const o of all) {
      if (!o.alive) continue;
      const q = still.get(o) || { x: o.x, y: o.y, n: 0 };
      const moved = Math.hypot(o.x - q.x, o.y - q.y);
      const busy = o.action !== 0 && o.action !== 1; // al lavoro
      if (o.action === 1 && !o.queueWait && moved < 6) q.n += 60; else q.n = 0;
      q.x = o.x; q.y = o.y;
      if (q.n === 600) lost.push({ s, id: o.id % 1000, x: Math.round(o.x), y: Math.round(o.y), w: [o.woodwork, o.goldwork, o.stonework], carry: o.wood + o.gold + o.stone, busy });
      still.set(o, q);
    }
  }
  return [
    [mismatch === 0, "contatore sempre = civili con action 0", mismatch],
    [lost.length === 0, "nessun civile in cammino fermo da oltre 10 s (perso, non inattivo)", lost.slice(0, 6)],
  ];
});

// 8 bordo: camera nella room
await scenario("8 bordo", () => {
  const { G, w, cam } = T;
  const spots = [[40, 40], [cam.roomW - 40, 40], [40, cam.roomH - 40], [cam.roomW - 40, cam.roomH - 40]];
  const made = [];
  for (const [x, y] of spots) {
    for (let k = 0; k < 40; k++) {
      const o = w.create("ally_omino", x + (k % 6) * 30 * (x < 100 ? 1 : -1), y + Math.floor(k / 6) * 30 * (y < 100 ? 1 : -1));
      if (w.placeFree(o, o.x, o.y)) { made.push(o); break; }
      w.destroy(o);
    }
  }
  G.advance(5);
  const bad = [];
  for (let k = 0; k < made.length; k++) { T.space(); if (!T.camOk()) bad.push([Math.round(cam.x), Math.round(cam.y)]); }
  return [[made.length >= 3, "civili negli angoli", made.length], [bad.length === 0, "camera sempre dentro la room", bad]];
});

// 9 salvataggio: l'ordine di Spazio dopo il caricamento
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const before = await page.evaluate(async () => {
    const G = window.__game, w = G.world;
    G.advance(2);
    for (const e of [...w.all("enemy")]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1 });
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
    const c = w.all("centro").next().value;
    for (let k = 0; k < 6; k++) w.create("ally_omino", c.x - 200 + k * 70, c.y + 260);
    G.advance(30);
    w.input._pressed.add(32); G.advance(1); // uno selezionato, il giro avanza
    const order = [...w.all("ally_omino")].sort((a, b) => a.idleorder - b.idleorder).map((o) => o.id);
    const orderu = w.all("idle_clicker").next().value.orderu;
    await window.__pause.actions.saveGame();
    return { order, orderu, idle: G.g.idle };
  });
  await page.goto(`${base}/index.html?room=match&load=slot&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const after = await page.evaluate(() => {
    const G = window.__game, w = G.world;
    G.advance(1); // (w.input c'e' dal primo passo)
    const order = [...w.all("ally_omino")].sort((a, b) => a.idleorder - b.idleorder).map((o) => o.id);
    const orderu = w.all("idle_clicker").next().value.orderu;
    for (const o of w.all("ally_omino")) o.selected = 0;
    w.input._pressed.add(32); G.advance(1);
    const s = [...w.all("ally_omino")].filter((o) => o.selected === 1).map((o) => o.id);
    return { order, orderu, idle: G.g.idle, next: s };
  });
  report("9 salvataggio", [
    [JSON.stringify(before.order) === JSON.stringify(after.order), "ordine dei fermi uguale dopo il caricamento", { prima: before.order.length, dopo: after.order.length }],
    [before.orderu === after.orderu, "il giro riprende dal prossimo", { prima: before.orderu, dopo: after.orderu }],
    [after.next.length === 1 && after.next[0] === before.order[before.orderu - 1], "Spazio seleziona quello giusto", { atteso: before.order[before.orderu - 1], preso: after.next }],
    [errs.length === 0, "nessun errore nella pagina", errs.slice(0, 2)],
  ]);
  await page.close();
}

console.log(fails ? `${fails} controlli falliti` : "tutti i controlli passati");
await browser.close();
process.exit(fails ? 1 : 0);
