// Prova nel browser del determinismo della partita (§9.152, multiplayer,
// fase 1): la stessa schermaglia (la CPU gioca, nessun input), con lo stesso
// seme (?seed), in due pagine che fanno tutto il resto diversamente:
//   A  finestra 1280x720, la vista ferma sulla base del giocatore, disegna
//      un passo si' e uno no, opzioni grafiche di sempre
//   B  finestra 960x600, la vista che salta per la mappa ogni 7 passi,
//      disegna un passo ogni 5, erba e pioggia spente nelle opzioni
// A tutte e due allo stesso passo lo stesso "input": comincia a piovere.
// Ogni EVERY passi l'impronta della partita (snapshot.js stateHash) deve
// essere uguale; se no la prova dice dove divergono (il primo campo diverso).
// Controllo: una terza pagina con un altro seme deve avere un'impronta
// diversa (la prova se ne accorgerebbe).
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/determinism.mjs [room] [passi] [browser]
//   (browser: chromium, firefox, webkit; stampa anche le impronte, per
//   confrontare browser diversi: test/browser/determinism-cross.mjs)
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const pw = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_padus", stepsArg = "9000", engine = "chromium"] = process.argv.slice(2);
const STEPS = Number(stepsArg), EVERY = 300, SEED = 12345;
const browser = await pw[engine].launch(engine === "chromium" ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {});
const errs = [];
const open = async (w, h, seed) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=${seed}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const A = await open(1280, 720, SEED), B = await open(960, 600, SEED);
await B.evaluate(() => { const P = window.__game.world.particles; P.hidden.add("grass"); P.hidden.add("rain"); });
// la vista di A sulla base del giocatore
await A.evaluate(() => {
  const G = window.__game, u = G.world.all("ally_unit").next().value || G.world.all("ally_build").next().value;
  if (u) { G.cam.x = u.x - G.cam.w / 2; G.cam.y = u.y - G.cam.h / 2; }
});
const run = (page, n, from, kind) => page.evaluate(([n, from, kind]) => {
  const G = window.__game, w = G.world;
  let s = from, seed = 99;
  const r = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; // della prova, non del gioco
  for (let k = 0; k < n; k++, s++) {
    if (s === 1500) G.g.raining = 1; // lo stesso "input" nelle due pagine
    G.advance(1);
    if (kind === "B" && s % 7 === 0) { G.cam.x = r() * (w.roomW - G.cam.w); G.cam.y = r() * (w.roomH - G.cam.h); }
    if (s % (kind === "A" ? 2 : 5) === 0) G.loop.render();
  }
  return G.hash();
}, [n, from, kind]);
// il primo campo diverso fra due stati (per trovare la causa)
// (DIFFS=n: le prime n)
const allDiffs = (a, b, path = "", out = []) => {
  if (a === b || out.length >= (Number(process.env.DIFFS) || 1)) return out;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) { out.push(`${path}: ${JSON.stringify(a)?.slice(0, 80)} / ${JSON.stringify(b)?.slice(0, 80)}`); return out; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) allDiffs(a[k], b[k], path + "." + k, out);
  return out;
};
const firstDiff = (a, b) => allDiffs(a, b).join("\n    ");
const hashes = [];
let bad = null;
for (let s = 0; s < STEPS && !bad; s += EVERY) {
  const [ha, hb] = await Promise.all([run(A, EVERY, s, "A"), run(B, EVERY, s, "B")]);
  hashes.push(ha);
  if (ha !== hb) {
    const [da, db] = await Promise.all([A.evaluate(() => window.__game.dump()), B.evaluate(() => window.__game.dump())]);
    bad = { passo: s + EVERY, diverso: firstDiff(da, db) };
  }
}
const info = await A.evaluate(() => {
  const G = window.__game, w = G.world, n = (f) => [...w.all(f)].length;
  return { alleati: n("ally_unit"), nemici: n("enemy_unit"), edificiNemici: n("enemy_build"), piove: G.g.raining };
});
// controllo: un altro seme, un'altra partita
const C = await open(1280, 720, SEED + 1);
const hc = await run(C, EVERY, 0, "A");
const control = hc !== hashes[0];
await browser.close();
const ok = !bad && control && errs.length === 0 && hashes.length === Math.ceil(STEPS / EVERY);
console.log(engine, room, "passi", STEPS, "impronte uguali:", bad ? "NO" : hashes.length, JSON.stringify(info));
if (bad) console.log("  divergono al passo", bad.passo, "->", bad.diverso);
console.log("  controllo (un altro seme da' un'altra impronta):", control ? "si'" : "NO");
console.log("  impronte:", hashes.join(" "));
if (errs.length) console.log(errs.slice(0, 3));
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
