// Prova nel browser della partita a due in rete (§9.156, multiplayer, fase
// 4) con un canale FINTO: due pagine (A rosso, B blu, finestre diverse) con
// ?net=fake, il lockstep vero (lockstep.js, netgame.js, app.js), e in mezzo
// questa prova, che porta i messaggi da una pagina all'altra in ritardo
// (fino a LAG giri) e in disordine. Le pagine avanzano a scatti irregolari,
// ognuna per conto suo (fino a 4 passi per giro, o niente): il lockstep le
// tiene insieme. I comandi li danno le pagine coi loro giocatori, per la
// strada vera (world.act: il ritardo dei comandi, i turni):
//   - civili in coda ai due centri, i civili a far legna, la casa blu;
//   - al passo ARMY_AT due piccoli eserciti si combattono al centro;
//   - la pausa: A preme Esc (il tasto vero), tutte e due si fermano allo
//     stesso passo; B preme Esc e riprendono tutte e due.
// Le impronte le confrontano le pagine stesse ogni 300 passi (devono essere
// tutte uguali), e alla fine la prova (stesso passo, stessa impronta).
// Controlli: una pagina cambiata di nascosto -> tutte e due avvisano che le
// partite si sono separate; A lascia la partita -> B lo dice e si ferma.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/netfake.mjs [room] [seme] [passi]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_padus", seedArg = "7", stepsArg = "2400"] = process.argv.slice(2);
const STEPS = Number(stepsArg), DELAY = 5, LAG = Number(process.env.LAG) || 6, ARMY_AT = 900, PAUSE_AT = 1300;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
// un generatore ripetibile per i ritardi e il disordine
let rs = 12345;
const rand = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };

const open = async (w, h, parte) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => errs.push(`${parte}: ${e.message}`));
  // (l'avviso delle partite separate e' atteso nel controllo)
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("[535 rete]")) errs.push(`${parte} console: ${m.text()}`); });
  await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=${seedArg}&net=fake&parte=${parte}&delay=${DELAY}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const A = await open(1280, 720, 1), B = await open(960, 600, 2);
const pages = [A, B];

// i comandi, calcolati in A (gli stessi dati per tutte e due: ognuno da' i suoi)
const plan = await A.evaluate(() => {
  const G = window.__game, w = G.world;
  const c1 = w.all("centro").next().value, c2 = w.all("p2_centro").next().value;
  const ids = (n) => [...w.all(n)].map((u) => u.id);
  const t1 = w.nearest(c1.x, c1.y, "albero"), t2 = w.nearest(c2.x, c2.y, "albero");
  const pl = w.create("casa_placer", c2.x, c2.y);
  let spot = null;
  for (let k = 0; k < 120 && !spot; k++) {
    const a = k * 0.7, r = 300 + k * 8, x = Math.round(c2.x + Math.cos(a) * r), y = Math.round(c2.y + Math.sin(a) * r * 0.7);
    if (x > 200 && y > 200 && x < w.roomW - 200 && y < w.roomH - 200 && w.placeFree(pl, x, y)) spot = [x, y];
  }
  w.destroy(pl);
  return { c1: c1.id, c2: c2.id, om1: ids("ally_omino"), om2: ids("p2_omino"),
           t1: [Math.round(t1.x), Math.round(t1.y)], t2: [Math.round(t2.x), Math.round(t2.y)], spot,
           mid: [Math.round(w.roomW / 2), Math.round(w.roomH / 2)], p1: G.g.wood, p2: G.g.p2.wood };
});
// [passo, parte (1 rosso, 2 blu), tipo, dati]
const CMDS = [
  [10, 2, "civile", { ids: [plan.c2] }],
  [12, 1, "civile", { ids: [plan.c1] }],
  [30, 2, "ordine", { ids: plan.om2, x: plan.t2[0], y: plan.t2[1], over: true }],
  [30, 1, "ordine", { ids: plan.om1, x: plan.t1[0], y: plan.t1[1], over: true }],
  ...(plan.spot ? [[600, 2, "costruisci", { fam: "casa", x: plan.spot[0], y: plan.spot[1], tipo: 2, posiz: null,
                                            ids: plan.om2.slice(0, 1), mx: plan.spot[0], my: plan.spot[1] }]] : []),
  [1000, 1, "civile", { ids: [plan.c1] }],
  [1001, 2, "civile", { ids: [plan.c2] }],
];

// in ogni pagina: fino a n passi, dando i comandi della propria parte al
// loro passo; restituisce [passo, messaggi in uscita]
const pump = (page, n, limit) => page.evaluate(([n, limit, CMDS, plan, ARMY_AT]) => {
  const G = window.__game, w = G.world, me = w.mp.local;
  window.__done ||= new Set();
  for (let k = 0; k < n && w._stepNo < limit; k++) {
    const s = w._stepNo;
    CMDS.forEach(([at, p, kind, d], j) => { if (at === s && p === me && !window.__done.has(j)) { window.__done.add(j); w.act(kind, d); } });
    if (s === ARMY_AT && !window.__done.has("army")) {
      window.__done.add("army");
      const [mx, my] = plan.mid;
      for (let q = 0; q < 4; q++) { w.create("ally_warrior", mx - 180, my - 120 + q * 70); w.create("p2_warrior", mx + 180, my - 120 + q * 70); }
      for (let q = 0; q < 2; q++) { w.create("ally_arciere", mx - 320, my - 40 + q * 80); w.create("p2_arciere", mx + 320, my - 40 + q * 80); }
    }
    if (G.pump(1) === 0) break; // in attesa del turno dell'altro (o in pausa)
  }
  return [w._stepNo, G.net.link.drain(), window.__pause.paused];
}, [n, limit, CMDS, plan, ARMY_AT]);

// il canale finto: ogni messaggio arriva dopo 0..LAG giri, in disordine
const inflight = [];
let round = 0, delivered = 0;
const deliver = async () => {
  round++;
  for (const P of pages) {
    const due = inflight.filter((m) => m.to === P && m.at <= round);
    if (!due.length) continue;
    for (const m of due) inflight.splice(inflight.indexOf(m), 1);
    for (let i = due.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [due[i], due[j]] = [due[j], due[i]]; }
    delivered += due.length;
    await P.evaluate((list) => window.__game.net.link.deliver(list), due.map((m) => m.s));
  }
};
const send = (from, list) => { for (const s of list) inflight.push({ to: from === A ? B : A, at: round + Math.floor(rand() * (LAG + 1)), s }); };

// avanti fino a `limit` (o finche' `until` e' vero): giri di passi e consegne
let state = [[0, false], [0, false]];
const advance = async (limit, until = null, maxRounds = 20000) => {
  for (let r = 0; r < maxRounds; r++) {
    const res = await Promise.all(pages.map((P) => pump(P, Math.floor(rand() * 5), limit)));
    res.forEach(([s, out, paused], k) => { state[k] = [s, paused]; send(pages[k], out); });
    await deliver();
    if (until ? until() : state.every(([s]) => s >= limit)) return true;
  }
  return false;
};

// l'avvio: i due canali si aprono, le pagine si salutano e partono (il
// registro dei comandi eseguiti, per confrontarli alla fine)
await Promise.all(pages.map((P) => P.evaluate(() => { window.__game.record(); window.__game.net.link.open(); })));
await advance(1, () => true, 1);
for (let k = 0; k < 20; k++) await advance(0, () => true, 1);
const started = await Promise.all(pages.map((P) => P.evaluate(() => [window.__game.net.state, window.__game.net.delay])));

const fail = [];
if (!started.every(([s, d]) => s === "running" && d === DELAY)) fail.push("avvio: " + JSON.stringify(started));

// la partita fino alla pausa
await advance(PAUSE_AT);
// A preme Esc (il tasto vero: input.js, pause.check -> il comando "pausa")
await A.keyboard.press("Escape");
const pausedOk = await advance(PAUSE_AT + 40, () => state.every(([, p]) => p), 400);
const pauseSteps = state.map(([s]) => s);
const sub = await Promise.all(pages.map((P) => P.evaluate(() => window.__pause.net && window.__pause.net.by)));
if (!pausedOk) fail.push("pausa: le due pagine non si sono fermate " + JSON.stringify(state));
else if (pauseSteps[0] !== pauseSteps[1]) fail.push("pausa a passi diversi: " + pauseSteps);
if (pausedOk && !(sub[0] === 0 && sub[1] === 0)) fail.push("pausa: chi l'ha chiesta " + JSON.stringify(sub));
// ferme: qualche giro senza passi
await advance(PAUSE_AT + 100, () => false, 30);
if (state.some(([s], k) => s !== pauseSteps[k])) fail.push("in pausa le pagine sono andate avanti: " + JSON.stringify(state));
// B riprende (Esc nel menu di pausa): ripartono tutte e due
await B.keyboard.press("Escape");
const resumedOk = await advance(STEPS, () => state.every(([s, p]) => !p && s > pauseSteps[0] + 30), 400);
if (!resumedOk) fail.push("ripresa: " + JSON.stringify(state));

// fino in fondo, tutte e due allo stesso passo
await advance(STEPS);
const fin = await Promise.all(pages.map((P) => P.evaluate(() => {
  const G = window.__game, w = G.world, n = (o) => w.number(o);
  return { step: w._stepNo, hash: G.hash(), checks: G.net.checks, desync: G.net.desync,
           legna: [G.g.wood, G.g.p2.wood], casaBlu: n("p2_casa") + n("p2_casa_fond"),
           soldati: [n("ally_warrior") + n("ally_arciere"), n("p2_warrior") + n("p2_arciere")],
           civili: [n("ally_omino"), n("p2_omino")], ev: G.net.events.map(([t, s]) => t + "@" + s).join(" "),
           cmds: G.commands.log.cmds.map((c) => [c.s, c.p, c.k]) };
})));
const [fa, fb] = fin;
if (fa.step !== STEPS || fb.step !== STEPS) fail.push("passi: " + fa.step + " / " + fb.step);
if (fa.hash !== fb.hash) fail.push(`impronte finali diverse: ${fa.hash} / ${fb.hash}`);
for (const [k, f] of [["A", fa], ["B", fb]]) {
  if (f.desync) fail.push(`${k}: partite separate al passo ${f.desync.step}`);
  if (f.checks.length < Math.floor(STEPS / 300) - 1 || !f.checks.every(([, ok]) => ok)) fail.push(`${k}: confronti ${JSON.stringify(f.checks)}`);
}
if (!(fa.legna[0] > plan.p1 && fa.legna[1] > plan.p2)) fail.push("legna: " + fa.legna);
if (plan.spot && !fa.casaBlu) fail.push("niente casa blu");
// i due eserciti (6 per parte) si sono combattuti: morti da tutte e due le parti
if (!(fa.soldati[0] < 6 && fa.soldati[1] < 6)) fail.push("soldati: " + fa.soldati);
if (!(fa.civili[0] >= 4 && fa.civili[1] >= 4)) fail.push("civili: " + fa.civili);
// gli stessi comandi agli stessi passi nelle due pagine, tutti quelli dati
// (CMDS, la pausa), ognuno D passi dopo il passo in cui e' stato dato
const cmdsA = JSON.stringify(fa.cmds), cmdsB = JSON.stringify(fb.cmds);
if (cmdsA !== cmdsB) fail.push(`comandi diversi: ${cmdsA} / ${cmdsB}`);
if (fa.cmds.length !== CMDS.length + 1 || !fa.cmds.some(([, , k]) => k === "pausa")) fail.push("comandi eseguiti: " + cmdsA);
for (const [at, p, k] of CMDS) if (!fa.cmds.some(([s, q, kk]) => s === at + DELAY && q === p - 1 && kk === k)) fail.push(`${k} della parte ${p} non al passo ${at + DELAY}`);

// controllo 1: B cambiata di nascosto -> tutte e due se ne accorgono
await B.evaluate(() => { window.__game.g.p2.wood += 7; });
await advance(STEPS + 330);
const ds = await Promise.all(pages.map((P) => P.evaluate(() => [window.__game.net.desync, (document.getElementById("net-bar") || {}).dataset?.text || ""])));
const desyncOk = ds.every(([d, bar]) => d && d.step === STEPS + 300 && bar.length > 10);
if (!desyncOk) fail.push("controllo: la differenza non e' stata vista " + JSON.stringify(ds));

// controllo 2: A lascia la partita -> B lo dice e si ferma
await A.evaluate(() => window.__game.net.leave());
await advance(STEPS + 400, () => false, 15);
const left = await B.evaluate(() => [window.__game.net.state, window.__pause.paused, !!(window.__pause.net && window.__pause.net.lost),
                                     (document.getElementById("net-bar") || {}).dataset?.text || ""]);
if (!(left[0] === "left" && left[1] && left[2])) fail.push("A se ne va: " + JSON.stringify(left));

console.log(`${room} seme ${seedArg}: ${STEPS} passi, ritardo ${DELAY}, canale con ${LAG} giri di ritardo e disordine (${delivered} messaggi, ${round} giri)`);
console.log(`  confronti: ${fa.checks.length} (${fa.checks.map(([s, ok]) => s + (ok ? "" : "!")).join(" ")}), impronta finale ${fa.hash}`);
console.log(`  pausa al passo ${pauseSteps.join("/")}, legna ${fa.legna.join("/")}, casa blu ${fa.casaBlu}, soldati rimasti ${fa.soldati.join("/")} (di 6), civili ${fa.civili.join("/")}`);
console.log(`  comandi eseguiti (uguali nelle due pagine): ${fa.cmds.map(([s, p, k]) => `${k}/${p}@${s}`).join(" ")}`);
console.log(`  eventi A: ${fa.ev}`);
console.log(`  controllo (pagina cambiata): ${desyncOk ? "visto da tutte e due" : "NO"}; A se ne va: ${JSON.stringify(left)}`);
if (errs.length) fail.push("errori: " + errs.slice(0, 5).join(" | "));
await browser.close();
if (fail.length) { console.log("NON VA:\n  " + fail.join("\n  ")); process.exit(1); }
console.log("ok");
