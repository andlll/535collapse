// Prova nel browser della tregua nella partita a due (§9.156, decisione
// dell'autore: per i minuti scelti nessuno dei due puo' attaccare l'altro).
// Una schermaglia con ?pvp=1 e la tregua di 5 minuti: al centro della mappa
// guerrieri e arcieri rossi e blu a pochi passi gli uni dagli altri, e gli
// ordini d'attacco veri (il comando "ordine" sul nemico, dei due giocatori),
// anche contro il centro dell'altro. Durante la tregua: nessun colpo (vite
// intatte, nessun morto, i centri intatti); finita la tregua (il tempo
// della partita la passa: qui si accorcia a 0) si combattono. Anche la
// minimappa, durante la tregua, vede i nemici (mp.noTruce).
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/truce.mjs [room] [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_padus", seedArg = "5"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [], fail = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => errs.push(e.message));
await page.addInitScript((room) => { localStorage.setItem("535.skirmish", JSON.stringify({ map: room, truce: 5, fog: "none" })); }, room);
await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=${seedArg}&pvp=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });

const setup = await page.evaluate(() => {
  const G = window.__game, w = G.world;
  G.advance(1);
  const [mx, my] = [Math.round(w.roomW / 2), Math.round(w.roomH / 2)];
  const red = [], blue = [];
  for (let k = 0; k < 4; k++) {
    red.push(w.create("ally_warrior", mx - 40, my - 120 + k * 70).id);
    blue.push(w.create("p2_warrior", mx + 40, my - 120 + k * 70).id);
  }
  for (let k = 0; k < 2; k++) {
    red.push(w.create("ally_arciere", mx - 200, my - 40 + k * 80).id);
    blue.push(w.create("p2_arciere", mx + 200, my - 40 + k * 80).id);
  }
  const c1 = w.all("centro").next().value, c2 = w.all("p2_centro").next().value;
  const life = (ids) => w.byIds(ids).map((u) => u.life);
  return { truce: G.g.sk.truce, on: w.mp.truce, red, blue, mid: [mx, my], c1: [c1.x, c1.y, c1.life], c2: [c2.x, c2.y, c2.life],
           lives: [life(red), life(blue)] };
});
if (!(setup.truce === 5 && setup.on)) fail.push("tregua non attiva: " + JSON.stringify(setup));

// gli ordini d'attacco dei due giocatori (come il clic destro sul nemico)
const state = () => page.evaluate(([red, blue]) => {
  const G = window.__game, w = G.world, life = (ids) => w.byIds(ids).map((u) => u.life);
  const c1 = w.all("centro").next().value, c2 = w.all("p2_centro").next().value;
  // la minimappa (con lo specchio di chi guarda) vede i nemici anche in tregua
  w.mp.noTruce = true; const seen = w.worldFor(null).number("enemy_unit"); w.mp.noTruce = false;
  return { step: w._stepNo, truce: w.mp.truce, red: life(red), blue: life(blue), c1: c1 && c1.life, c2: c2 && c2.life,
           arrows: w.number("arciere_bullet") + w.number("p2_arciere_bullet"), seen, hidden: w.worldFor(null).number("enemy_unit") };
}, [setup.red, setup.blue]);
await page.evaluate(([s]) => {
  const G = window.__game, w = G.world, b = w.byIds(s.blue)[0], r = w.byIds(s.red)[0];
  G.commands.issue("ordine", { ids: s.red, x: Math.round(b.x), y: Math.round(b.y), over: true }, w._stepNo + 1, 0);
  G.commands.issue("ordine", { ids: s.blue.slice(0, 2), x: Math.round(r.x), y: Math.round(r.y), over: true }, w._stepNo + 1, 1);
  // due blu contro il centro rosso
  G.commands.issue("ordine", { ids: s.blue.slice(2, 4), x: s.c1[0], y: s.c1[1], over: true }, w._stepNo + 1, 1);
  G.advance(900);
}, [setup]);
const during = await state();
if (!during.truce) fail.push("la tregua e' finita troppo presto");
if (during.red.length !== 6 || during.blue.length !== 6) fail.push(`morti durante la tregua: ${during.red.length}/${during.blue.length}`);
if (JSON.stringify([during.red, during.blue]) !== JSON.stringify(setup.lives)) fail.push(`colpi durante la tregua: ${JSON.stringify(setup.lives)} -> ${JSON.stringify([during.red, during.blue])}`);
if (during.c1 !== setup.c1[2] || during.c2 !== setup.c2[2]) fail.push(`centri colpiti in tregua: ${setup.c1[2]}->${during.c1}, ${setup.c2[2]}->${during.c2}`);
if (during.seen === 0) fail.push("la minimappa non vede i nemici in tregua");
if (during.hidden !== 0) fail.push("in tregua il codice del giocatore vede i nemici");

// la tregua finisce (il tempo della partita: qui si accorcia)
await page.evaluate(() => { window.__game.g.sk.truce = 0; window.__game.advance(900); });
const after = await state();
if (after.truce) fail.push("la tregua non finisce");
if (!(after.red.length < 6 && after.blue.length < 6)) fail.push(`finita la tregua nessuno combatte: ${after.red.length}/${after.blue.length}`);

console.log(`${room} seme ${seedArg}: tregua ${setup.truce} minuti`);
console.log(`  durante (passo ${during.step}): vite rossi ${during.red.join(",")} | blu ${during.blue.join(",")}; centri ${during.c1}/${during.c2}; frecce in volo ${during.arrows}; la minimappa vede ${during.seen} nemici`);
console.log(`  dopo (passo ${after.step}): rossi vivi ${after.red.length}, blu vivi ${after.blue.length}`);
if (errs.length) fail.push("errori: " + errs.slice(0, 3).join(" | "));
await browser.close();
if (fail.length) { console.log("NON VA:\n  " + fail.join("\n  ")); process.exit(1); }
console.log("ok");
