// Prova nel browser degli ordini come comandi (§9.154, multiplayer, fase 2,
// passo 2). La stessa partita (seme fisso) in due pagine:
//   A  seleziona le unita' e da' gli ordini col clic destro vero (input)
//   B  ha un'altra selezione, che cambia a caso a ogni passo, e da' gli stessi
//      ordini SOLO come comandi ({ ids, x, y, over }: commands.issue), senza
//      mouse
// Ordini: i militari verso un punto lontano (formazione), i civili su un
// albero (il rilascio destro sull'albero), poi i militari di nuovo e un
// ordine a vuoto. Le impronte (snapshot.js stateHash) devono restare uguali
// passo per passo: l'ordine dipende solo dai dati del comando, non dal mouse
// ne' dalla selezione di chi guarda. Controllo: gli ordini hanno fatto
// davvero qualcosa (le unita' si sono mosse, i civili tagliano legna) e una
// terza pagina che da' un ordine diverso diverge.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/orders.mjs [room] [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "match", seedArg = "7"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
const open = async (w, h) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=${seedArg}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const A = await open(1280, 720), B = await open(960, 600), C = await open(1280, 720);

// gli ordini (uguali per tutte le pagine: calcolati in A all'inizio)
const plan = await A.evaluate(() => {
  const w = window.__game.world;
  const mil = [...w.all("ally_unit")].filter((u) => u.object !== "ally_omino");
  const civ = [...w.all("ally_omino")];
  const at = (L) => L.length ? [L.reduce((s, u) => s + u.x, 0) / L.length, L.reduce((s, u) => s + u.y, 0) / L.length] : [0, 0];
  const [mx, my] = at(mil), [cx, cy] = at(civ.length ? civ : mil);
  const tree = w.nearest(cx, cy, "albero");
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  return {
    mil: mil.map((u) => u.id), civ: civ.map((u) => u.id),
    p1: [clamp(Math.round(mx + 500), 100, w.roomW - 100), clamp(Math.round(my + 260), 100, w.roomH - 100)],
    tree: tree ? [Math.round(tree.x), Math.round(tree.y)] : null,
    p2: [clamp(Math.round(mx - 300), 100, w.roomW - 100), clamp(Math.round(my + 420), 100, w.roomH - 100)],
    start: mil.concat(civ).map((u) => [u.id, Math.round(u.x), Math.round(u.y)]),
  };
});
// [passo, gruppo, punto]
const ORDERS = [[60, "mil", plan.p1], [140, "civ", plan.tree], [400, "mil", plan.p2], [700, "none", plan.p1]]
  .filter(([, who, p]) => p && (who === "none" || plan[who].length));

// un passo della pagina: in A l'ordine col clic destro vero, in B il comando
const advance = (page, kind, from, n, orders, wrong) => page.evaluate(([kind, from, n, orders, wrong, plan]) => {
  const G = window.__game, w = G.world, cam = G.cam;
  let seed = 1234 + from;
  const r = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const sim = () => w.instances.filter((i) => i.alive && !i.ui && !i.fx && "selected" in i);
  const out = [];
  for (let s = from; s < from + n; s++) {
    const o = orders.find(([at]) => at === s);
    if (o) {
      const [, who, [x, y]] = o;
      const ids = who === "none" ? [] : plan[who];
      const px = wrong ? x + 400 : x;
      if (kind === "A") {
        // la selezione di chi gioca e il clic destro vero sul punto
        const input = w.input; // (c'e' dal primo passo)
        for (const i of sim()) i.selected = ids.includes(i.id) ? 1 : 0;
        cam.x = px - cam.w / 2; cam.y = y - cam.h / 2; cam.clamp();
        input.x = (px - cam.x) * cam.cssW / cam.w; input.y = (y - cam.y) * cam.cssH / cam.h; input.inside = true;
        input._mr[1] = true;
      } else {
        // solo il comando: chi, dove, il puntatore sul mondo
        G.commands.issue("ordine", { ids, x: px, y, over: true }, w._stepNo + 1);
      }
    }
    G.advance(1);
    if (kind === "B") {
      // un'altra selezione, a caso a ogni passo, e la vista altrove
      const L = sim();
      for (let k = 0; k < 3 && L.length; k++) { const i = L[Math.floor(r() * L.length)]; i.selected = i.selected === 1 ? 0 : 1; }
      if (s % 9 === 0) { cam.x = r() * (w.roomW - cam.w); cam.y = r() * (w.roomH - cam.h); }
    }
    if ((s + 1) % 50 === 0) out.push([s + 1, G.hash()]);
  }
  return out;
}, [kind, from, n, orders, wrong, plan]);

const STEPS = 1500, BLOCK = 50;
// dove divergono (il primo campo diverso, DIFFS=n: i primi n)
const allDiffs = (a, b, path = "", out = []) => {
  if (a === b || out.length >= (Number(process.env.DIFFS) || 3)) return out;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) { out.push(`${path}: ${JSON.stringify(a)?.slice(0, 80)} / ${JSON.stringify(b)?.slice(0, 80)}`); return out; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) allDiffs(a[k], b[k], path + "." + k, out);
  return out;
};
const ha = [], hb = [], hc = [];
let diff = null;
for (let s = 0; s < STEPS; s += BLOCK) {
  const [a, b, c] = await Promise.all([advance(A, "A", s, BLOCK, ORDERS, false), advance(B, "B", s, BLOCK, ORDERS, false),
                                       advance(C, "A", s, BLOCK, ORDERS, true)]);
  ha.push(...a); hb.push(...b); hc.push(...c);
  if (!diff && a[a.length - 1][1] !== b[b.length - 1][1]) {
    diff = allDiffs(...(await Promise.all([A.evaluate(() => window.__game.dump()), B.evaluate(() => window.__game.dump())])));
  }
}
const firstBad = ha.findIndex(([, h], k) => h !== hb[k][1]);
const control = ha.some(([, h], k) => h !== hc[k][1]);
// gli ordini hanno fatto qualcosa
const did = await A.evaluate((plan) => {
  const w = window.__game.world, byId = new Map(w.instances.map((i) => [i.id, i]));
  let moved = 0, alive = 0, wood = 0;
  for (const [id, x, y] of plan.start) {
    const u = byId.get(id);
    if (!u || !u.alive) continue;
    alive++;
    if (Math.hypot(u.x - x, u.y - y) > 150) moved++;
  }
  for (const id of plan.civ) { const u = byId.get(id); if (u && u.alive && u.woodwork === 1) wood++; }
  return { unita: plan.start.length, vive: alive, spostate: moved, legna: wood, comandi: window.__game.commands.queue.length };
}, plan);
await browser.close();
const civOk = !plan.civ.length || !plan.tree || did.legna >= 1;
const ok = errs.length === 0 && firstBad === -1 && control && did.spostate >= Math.min(2, did.vive) && civOk;
console.log(room, "ordini", JSON.stringify(ORDERS.map(([s, who]) => [s, who])), "unita'", JSON.stringify({ mil: plan.mil.length, civ: plan.civ.length }));
console.log("  impronte A (clic) = B (comandi):", firstBad === -1 ? `si', ${ha.length}/${ha.length}` : `NO dal passo ${ha[firstBad][0]}`);
if (diff) console.log("  primi campi diversi:\n    " + diff.join("\n    "));
console.log("  controllo (un ordine diverso diverge):", control ? "si'" : "NO");
console.log("  fatto:", JSON.stringify(did));
if (errs.length) console.log(errs.slice(0, 3));
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
