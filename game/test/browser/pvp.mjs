// Prova nel browser della partita a due (§9.155, multiplayer, fase 3): una
// schermaglia con ?pvp=1, il giocatore 2 coi gemelli p2_* (la stessa logica
// del giocatore, gli sprite blu). Due pagine con lo stesso seme: A guarda
// dal rosso (parte 1), B dal blu (&parte=2), con un'altra finestra; tutte e
// due ricevono gli stessi comandi dei DUE giocatori (commands.issue col
// giocatore p), come in rete:
//   - ognuno mette un civile in coda al suo centro e manda i suoi a far legna
//   - il giocatore 2 costruisce una casa vicino al suo centro
//   - poi due piccoli eserciti (guerrieri e arcieri) nascono al centro della
//     mappa, uno per parte, e si combattono da soli
// Le impronte devono restare uguali ogni 300 passi; la partita deve aver
// fatto davvero le sue cose (legna per tutti e due, la casa blu, morti da
// tutte e due le parti) e il blu si deve vedere blu (gli sprite dei nemici
// al disegno). Controllo: un comando del giocatore 2 diverso cambia le
// impronte. Alla fine gli edifici blu distrutti: vince il rosso, in tutte e
// due le pagine; il rosso vede la vittoria, il blu la sconfitta.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/pvp.mjs [room] [seme] [passi]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_padus", seedArg = "5", stepsArg = "3000"] = process.argv.slice(2);
const STEPS = Number(stepsArg), EVERY = Number(process.env.EVERY) || 300; // EVERY: per cercare dove divergono
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
const open = async (w, h, parte) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=${seedArg}&pvp=1&parte=${parte}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const A = await open(1280, 720, 1), B = await open(960, 600, 2), C = await open(1280, 720, 1);

// i comandi, calcolati in A all'inizio (gli stessi per tutte le pagine)
const plan = await A.evaluate(() => {
  const G = window.__game, w = G.world;
  const c1 = w.all("centro").next().value, c2 = w.all("p2_centro").next().value;
  const ids = (n) => [...w.all(n)].map((u) => u.id);
  const t1 = w.nearest(c1.x, c1.y, "albero"), t2 = w.nearest(c2.x, c2.y, "albero");
  // un posto libero per la casa blu, a spirale attorno al suo centro (col
  // fantasma, che e' dell'interfaccia: non tocca la partita)
  const pl = w.create("casa_placer", c2.x, c2.y);
  let spot = null;
  for (let k = 0; k < 120 && !spot; k++) {
    const a = k * 0.7, r = 300 + k * 8, x = Math.round(c2.x + Math.cos(a) * r), y = Math.round(c2.y + Math.sin(a) * r * 0.7);
    if (x > 200 && y > 200 && x < w.roomW - 200 && y < w.roomH - 200 && w.placeFree(pl, x, y)) spot = [x, y];
  }
  w.destroy(pl);
  return {
    c1: c1.id, c2: c2.id, om1: ids("ally_omino"), om2: ids("p2_omino"),
    t1: [Math.round(t1.x), Math.round(t1.y)], t2: [Math.round(t2.x), Math.round(t2.y)], spot,
    mid: [Math.round(w.roomW / 2), Math.round(w.roomH / 2)],
    p2: { ...G.g.p2 }, p1: { food: G.g.food, wood: G.g.wood },
    eco: w.exists("enemy_eco"), centri: [w.number("centro"), w.number("p2_centro"), w.number("enemy_centro")],
  };
});
// [passo, giocatore, tipo, dati]
const CMDS = [
  [10, 1, "civile", { ids: [plan.c2] }],
  [12, 0, "civile", { ids: [plan.c1] }],
  [30, 1, "ordine", { ids: plan.om2, x: plan.t2[0], y: plan.t2[1], over: true }],
  [32, 0, "ordine", { ids: plan.om1, x: plan.t1[0], y: plan.t1[1], over: true }],
  ...(plan.spot ? [[600, 1, "costruisci", { fam: "casa", x: plan.spot[0], y: plan.spot[1], tipo: 2, posiz: null,
                                            ids: plan.om2.slice(0, 1), mx: plan.spot[0], my: plan.spot[1] }]] : []),
];
const ARMY_AT = 900;

const run = (page, from, n, cmds, wrong) => page.evaluate(([from, n, cmds, wrong, plan, ARMY_AT]) => {
  const G = window.__game, w = G.world;
  for (let s = from; s < from + n; s++) {
    for (const [at, p, k, d] of cmds) {
      if (at !== w._stepNo) continue;
      const data = wrong && p === 1 && k === "ordine" ? { ...d, x: d.x + 500 } : d;
      G.commands.issue(k, data, w._stepNo + 1, p);
    }
    if (w._stepNo === ARMY_AT) {
      // due piccoli eserciti, uno per parte, a 360 px l'uno dall'altro
      const [mx, my] = plan.mid;
      for (let k = 0; k < 4; k++) {
        w.create("ally_warrior", mx - 180, my - 120 + k * 70);
        w.create("p2_warrior", mx + 180, my - 120 + k * 70);
      }
      for (let k = 0; k < 2; k++) {
        w.create("ally_arciere", mx - 320, my - 40 + k * 80);
        w.create("p2_arciere", mx + 320, my - 40 + k * 80);
      }
    }
    G.advance(1);
  }
  return G.hash();
}, [from, n, cmds, wrong, plan, ARMY_AT]);

const allDiffs = (a, b, path = "", out = []) => {
  if (a === b || out.length >= (Number(process.env.DIFFS) || 3)) return out;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) { out.push(`${path}: ${JSON.stringify(a)?.slice(0, 80)} / ${JSON.stringify(b)?.slice(0, 80)}`); return out; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) allDiffs(a[k], b[k], path + "." + k, out);
  return out;
};
const hashes = [];
let bad = null, control = false;
for (let s = 0; s < STEPS; s += EVERY) {
  const [ha, hb, hc] = await Promise.all([run(A, s, EVERY, CMDS, false), run(B, s, EVERY, CMDS, false), run(C, s, EVERY, CMDS, true)]);
  hashes.push(ha);
  if (hc !== ha) control = true;
  if (ha !== hb && !bad) {
    const [da, db] = await Promise.all([A.evaluate(() => window.__game.dump()), B.evaluate(() => window.__game.dump())]);
    bad = { passo: s + EVERY, diverso: allDiffs(da, db).join("\n    ") };
    break;
  }
}
// cosa e' successo (in A)
const after = await A.evaluate(([plan]) => {
  const G = window.__game, w = G.world, n = (o) => w.number(o);
  return {
    legna: [G.g.wood - plan.p1.wood, G.g.p2.wood - plan.p2.wood],
    civili: [n("ally_omino"), n("p2_omino")],
    casaBlu: n("p2_casa") + n("p2_casa_fond"), caseRosse: n("casa") + n("casa_fond"),
    guerrieri: [n("ally_warrior"), n("p2_warrior")], arcieri: [n("ally_arciere"), n("p2_arciere")],
    cadaveri: [n("warrior_corpse") + n("arciere_corpse"), n("p2_warrior_corpse") + n("p2_arciere_corpse")],
    pop: [G.g.pop, G.g.p2.pop],
  };
}, [plan]);
// il blu si vede blu: gli sprite delle istanze p2_* al disegno
const look = await B.evaluate(() => {
  const G = window.__game, w = G.world, m = w.p2Sprites || {};
  const u = w.all("p2_omino").next().value || w.all("p2_warrior").next().value, c = w.all("p2_centro").next().value;
  return { tabella: Object.keys(m).length, civile: u ? [u.sprite_index, m[u.sprite_index] || null] : null,
           centro: c ? [c.sprite_index, m[c.sprite_index] || null] : null };
});
if (process.env.SHOT) {
  await B.evaluate(() => { const G = window.__game, c = G.world.all("p2_centro").next().value; if (c) { G.cam.x = c.x - G.cam.w / 2; G.cam.y = c.y - G.cam.h / 2 + 150; } G.loop.render(); });
  await B.screenshot({ path: process.env.SHOT });
}
// la fine: gli edifici blu distrutti in tutte e due le pagine; vince il
// rosso (global.skWinner, uguale), il rosso vede la vittoria e il blu la
// sconfitta (§9.155, pvpCheck)
const end = await Promise.all([A, B].map((P) => P.evaluate(() => {
  const G = window.__game, w = G.world;
  for (const b of [...w.all("p2_build")]) w.destroy(b);
  for (let k = 0; k < 40; k++) G.advance(1);
  return { vince: G.g.skWinner || 0, vittoria: w.exists("victory_manager"), sconfitta: w.exists("gameover_manager") };
})));
await browser.close();

const fought = after.cadaveri[0] + after.cadaveri[1] > 0 && (after.guerrieri[0] + after.arcieri[0] < 6) && (after.guerrieri[1] + after.arcieri[1] < 6);
const ok = errs.length === 0 && !bad && control && hashes.length === Math.ceil(STEPS / EVERY)
  && plan.centri[1] === 1 && plan.centri[2] === 0 && !plan.eco && plan.om2.length === 3
  && after.legna[0] > 0 && after.legna[1] > 0 && after.casaBlu >= 1 && after.caseRosse === 0 && after.civili[1] >= 4 && fought
  && end[0].vince === 1 && end[1].vince === 1 && end[0].vittoria && !end[0].sconfitta && end[1].sconfitta && !end[1].vittoria
  && look.tabella > 500 && look.civile && look.civile[1] && look.centro && look.centro[1] === "cc_b";
console.log(room, "partita a due, passi", STEPS, "impronte uguali (rosso = blu):", bad ? "NO" : `${hashes.length}/${hashes.length}`);
if (bad) console.log("  divergono al passo", bad.passo, "->", bad.diverso);
console.log("  inizio", JSON.stringify({ centri: plan.centri, regiaCPU: plan.eco, civiliBlu: plan.om2.length, cassaBlu: plan.p2, casaBlu: plan.spot }));
console.log("  fatto ", JSON.stringify(after));
console.log("  blu   ", JSON.stringify(look));
console.log("  fine  ", JSON.stringify({ rosso: end[0], blu: end[1] }));
console.log("  controllo (un ordine blu diverso cambia la partita):", control ? "si'" : "NO");
if (errs.length) console.log(errs.slice(0, 3));
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
