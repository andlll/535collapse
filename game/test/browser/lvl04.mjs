// Prova nel browser della regia del livello 4 (§9.52), nella mappa
// dell'autore (mappe/lvl04.tmx):
//   partenza  = risorse medie; il centro nemico nella base sud, con la regia
//               economica e 4 lavoratori; la base nord fuori dall'economia
//               (noEco), quella sud dentro; obiettivi e primo dialogo
//   ondate    = dalla base nord la prima a 2 minuti (2 soldati, ruolo 31)
//   trattenuti = prima del ponte la base sud non manda ondate
//   ponte     = riparato: fase 1, dialogo, ondate della base sud libere
//   nord      = distrutte caserma e stalla a nord: obiettivo facoltativo
//               fatto, dialogo, niente piu' ondate da li'
//   vittoria  = distrutto il centro nemico
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/lvl04.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=lvl04&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g;
  let seed = 4;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  G.advance(90);
  const out = {};
  const c = w.all("enemy_centro").next().value;
  const north = [...w.all("enemy_caserma"), ...w.all("enemy_stalla")].filter((b) => b.noEco === 1);
  const south = [...w.all("enemy_caserma"), ...w.all("enemy_stalla")].filter((b) => b.noEco !== 1);
  out.partenza = {
    risorse: [g.food, g.wood, g.gold].join("/"), centro: c ? [c.x, c.y] : null, eco: w.number("enemy_eco"),
    lavoratori: w.number("enemy_omino"), nord: north.map((b) => b.object).sort().join(","), sud: south.length,
    obiettivi: w.number("objective_button"), dialogo: w.number("dialogo_4_0"), hold: g.en.hold,
  };
  for (const d of [...w.all("dialogo_4_0")]) w.destroy(d);
  // il giocatore non deve perdere nel frattempo: unita' alleate immortali
  const keep = () => { for (const u of w.all("ally_unit")) u.life = u.slife; for (const b of w.all("ally_build")) b.life = b.slife; };
  let wave1 = 0, ecoAttack = 0;
  for (let s = 0; s < 2 * 3600 + 200; s++) {
    keep(); G.advance(1);
    for (const e of w.all("enemy_unit")) {
      if (e.l4 === 1 && e.role === 31) wave1 = Math.max(wave1, [...w.all("enemy_unit")].filter((x) => x.l4 === 1).length);
      if (e.eco === 1 && (e.role === 31 || e.role === 32)) ecoAttack++;
    }
  }
  out.ondata1 = wave1;
  out.trattenuti = ecoAttack === 0;
  // ponte riparato
  const b = w.all("ponte").next().value;
  b.life = b.slife;
  G.advance(5);
  out.ponte = { fase: g.l4.phase, dialogo: w.number("dialogo_4_1"), hold: g.en.hold, ponte: w.number("ponte_fatto") };
  // base nord distrutta
  for (const n of north) n.life = 0;
  G.advance(30);
  const before = [...w.all("enemy_unit")].filter((x) => x.l4 === 1).length;
  for (let s = 0; s < 3 * 3600; s++) { keep(); G.advance(1); }
  const spawned = [...w.all("enemy_unit")].filter((x) => x.l4 === 1).length;
  out.nord = { fatto: g.l4.north, dialogo: w.number("dialogo_4_2") > 0 || g.l4.north === 1, nuove: spawned > before };
  // vittoria
  const c2 = w.all("enemy_centro").next().value;
  c2.life = 0;
  G.advance(10);
  out.vittoria = g.victory === 1 && w.number("victory_manager") === 1;
  return out;
});
console.log(JSON.stringify(res));
const P = res.partenza;
const ok = P.risorse === "300/300/150" && P.centro && P.eco === 1 && P.lavoratori >= 4 && P.nord === "enemy_caserma,enemy_stalla"
  && P.sud === 3 && P.obiettivi === 1 && P.dialogo === 1 && P.hold === 1
  && res.ondata1 >= 2 && res.trattenuti
  && res.ponte.fase === 1 && res.ponte.dialogo === 1 && res.ponte.hold === 0 && res.ponte.ponte === 1
  && res.nord.fatto === 1 && !res.nord.nuove && res.vittoria && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
