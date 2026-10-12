// Prova nel browser del monastero del livello 3 (§9.29). Rivelato il
// monastero, senza ondate:
//   repair  civili (3 per prova) partiti fra la cinta e il cortile, a ovest,
//           dietro il monastero o dal villaggio, mandati a riparare col clic
//           destro vero sul tetto, su un'ala, nel cortile o sul muro del
//           cortile: vita guadagnata e quanti stanno riparando alla fine;
//           poi, a vita piena, si fermano e il legno non cala piu'
//   fire    tre guerrieri nemici fra la cinta e il cortile, nessun alleato:
//           incendiano il monastero (frecce che lo colpiscono)
//   grid    abbattuta la porta della cinta, le celle delle mura ai suoi lati
//           restano chiuse
//   walled  porta abbattuta e una caserma al suo posto (che resta in
//           piedi): tre arieti fuori non passano la cinta (nessuno a nord
//           delle mura o dentro un muro, il monastero mai colpito) e
//           colpiscono la caserma. OFF=px sposta la caserma: il varco resta
//           in parte aperto e conta solo che nessuno passi dentro un muro
//           (prima, con OFF=60, passavano attraverso le mura)
//   open    porta abbattuta, varco libero: gli arieti arrivano al monastero
//           e lo colpiscono (§9.17)
//   save    salvato e ricaricato dopo la rivelazione, i pezzi del complesso
//           sono ancora legati al monastero
// Esce con codice 1 se qualcosa non torna. Deterministica.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/monastery.mjs
//   (BASE=url se il gioco non e' su http://localhost:8123)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const ready = () => page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
await page.goto(`${base}/index.html?room=lvl03&nostart=1`);
await ready();

// la rivelazione, senza dialoghi, nebbia, ondate e attacchi al villaggio
const reveal = () => page.evaluate(() => {
  const G = window.__game, w = G.world;
  G.advance(2);
  let seed = 11;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const man = w.all("enemy_manager_lv3").next().value;
  man.phase = 1; man.revealAsked = 1;
  G.advance(3);
  for (const d of [...w.all("dialogo")]) w.destroy(d);
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  G.g.fogville = 0; G.g.wood = 5000;
  man.wave = 99; man.base = 99;
});
await reveal();

const res = await page.evaluate((OFF) => {
  const G = window.__game, w = G.world, p = w.path, cam = G.cam;
  const m = w.all("monastero").next().value;
  const out = { parts: m.parts ? m.parts.map((o) => o.object) : [] };
  const click = (wx, wy) => {
    const input = w.input;
    cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
    input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    G.advance(1);
  };
  // --- riparazione
  const START = { inner: [5372, 1150], west: [4700, 900], back: [5372, 250], village: [1500, 2300] };
  const CLICK = { roof: [5372, 560], wing: [5050, 450], courtyard: [5372, 850], wall: [5218, 990] };
  const CASES = [["inner", "roof"], ["inner", "wing"], ["inner", "courtyard"], ["inner", "wall"],
                 ["west", "roof"], ["back", "roof"], ["village", "wing"]];
  out.repair = {};
  let os = [];
  for (const [sn, cn] of CASES) {
    for (const o of [...w.all("ally_omino")]) w.destroy(o);
    const [sx, sy] = START[sn];
    os = [0, 1, 2].map((k) => w.create("ally_omino", sx + k * 50 - 50, sy));
    G.advance(3);
    m.life = 2000; m.onfire = 0;
    for (const u of w.all("ally_unit")) u.selected = 0;
    for (const o of os) o.selected = 1;
    G.g.sel = os.length;
    click(...CLICK[cn]);
    for (const o of os) o.selected = 0;
    G.g.sel = 0;
    const steps = sn === "village" ? 4000 : 1500;
    for (let s = 0; s < steps; s++) G.advance(1);
    out.repair[sn + "/" + cn] = { gain: m.life - 2000, working: os.filter((o) => o.action === 7).length };
  }
  // a vita piena si fermano
  m.life = m.slife - 30;
  for (let s = 0; s < 400; s++) G.advance(1);
  const wood0 = G.g.wood;
  for (let s = 0; s < 200; s++) G.advance(1);
  out.full = { life: m.life, slife: m.slife, working: os.filter((o) => o.action === 7).length, woodSpent: wood0 - G.g.wood };
  // --- fuoco
  for (const o of [...w.all("ally_unit")]) w.destroy(o);
  m.life = m.slife; m.onfire = 0;
  const foes = [[5300, 1150], [5450, 1150], [5372, 1210]].map(([x, y]) => {
    const e = w.create("enemy_warrior", x, y); e.l3 = "mon"; e.defender = 0; return e;
  });
  let fireAt = -1;
  for (let s = 0; s < 1500; s++) { G.advance(1); if (fireAt < 0 && m.onfire === 1) fireAt = s; }
  out.fire = { fireAt, lost: m.slife - m.life, foes: foes.map((e) => [Math.round(e.x), Math.round(e.y), e.action]) };
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  m.onfire = 0; m.life = m.slife;
  // --- la porta abbattuta: le celle delle mura restano chiuse
  const porta = w.all("porta_ori").next().value;
  const gate = [porta.x, porta.y];
  porta.life = 0;
  G.advance(2);
  let open = 0, total = 0;
  for (const o of [...w.all("mura_ori"), ...w.all("mura_vert"), ...w.all("torre")]) {
    for (const k of p._cellsOf(o)) { total++; if (!p.solid[k]) open++; }
  }
  out.grid = { open, total };
  // --- arieti fuori dalla cinta
  // uno davanti al varco, uno a sinistra (dove, dopo la porta, si apriva un
  // buco di tre celle nelle mura) e uno a destra
  const rams = () => [-300, -60, 200].map((dx) => {
    const r = w.create("enemy_ariete", gate[0] + dx, gate[1] + 420);
    r.l3 = "mon"; return r;
  });
  const wallY = 1317; // il bordo nord delle mura della cinta
  // north: passi di un ariete a nord delle mura finche' `shut` (il varco
  // chiuso) e' vero; inWall: passi di un ariete sovrapposto alle mura, alle
  // torri o alla caserma (ci passa attraverso)
  const run = (list, steps, shut = () => false) => {
    let north = 0, mHit = 0, inWall = 0;
    const walls = [...w.all("mura_ori"), ...w.all("mura_vert"), ...w.all("torre"), ...w.all("caserma")];
    for (let s = 0; s < steps; s++) {
      const l0 = m.life;
      m.onfire = 0;
      G.advance(1);
      if (m.life < l0) mHit++;
      m.life = m.slife;
      const closed = shut();
      for (const r of list) {
        if (!r.alive) continue;
        if (closed && r.y < wallY && r.x > 4500 && r.x < 5820) north++;
        if (walls.some((o) => o.alive && w.overlap(r, r.x, r.y, o))) inWall++;
      }
    }
    return { north, inWall, mHit };
  };
  const c = w.create("caserma", gate[0] + OFF, gate[1]);
  G.advance(2);
  const cl0 = c.life;
  let barracksHit = 0, cl = c.life;
  const walled = rams();
  const r1 = run(walled, 1500, () => {
    if (c.life < cl) barracksHit++;
    cl = c.life;
    c.life = cl0; cl = cl0; // la caserma resta in piedi: il varco resta chiuso
    return !OFF;
  });
  out.walled = { ...r1, barracksHit, rams: walled.map((r) => [Math.round(r.x), Math.round(r.y), r.action, r.ramTarget ? 1 : 0]) };
  for (const r of walled) if (r.alive) w.destroy(r);
  // --- varco libero: al monastero
  c.life = 0;
  G.advance(3);
  const free = rams();
  const r2 = run(free, 3000);
  out.open = { ...r2, rams: free.map((r) => [Math.round(r.x), Math.round(r.y), r.action, r.ramTarget ? 1 : 0]) };
  return out;
}, Number(process.env.OFF || 0));

// --- salvataggio dopo la rivelazione
await page.goto(`${base}/index.html?room=lvl03&nostart=1`);
await ready();
await reveal();
await page.evaluate(async () => { await window.__pause.actions.saveGame(); });
await page.goto(`${base}/index.html?room=lvl03&load=slot&nostart=1`);
await ready();
res.save = await page.evaluate(() => {
  const w = window.__game.world, m = w.all("monastero").next().value;
  window.__game.advance(60);
  return { parts: m && m.parts ? m.parts.length : 0, linked: m && m.parts ? m.parts.every((o) => o.alive && o.complex === m) : false };
});
await browser.close();

for (const [k, v] of Object.entries(res)) console.log(k.padEnd(8), JSON.stringify(v));
const bad = [];
if (errs.length) bad.push("errori: " + errs[0]);
if (res.parts.length !== 2) bad.push("pezzi del complesso: " + res.parts);
for (const [k, v] of Object.entries(res.repair)) if (v.gain < 100 || v.working < 3) bad.push(`riparazione ${k}: ${JSON.stringify(v)}`);
if (res.full.life !== res.full.slife || res.full.working > 0 || res.full.woodSpent > 0) bad.push("a vita piena: " + JSON.stringify(res.full));
if (res.fire.fireAt < 0) bad.push("i nemici non incendiano il monastero: " + JSON.stringify(res.fire));
if (res.grid.open > 0) bad.push(`celle delle mura aperte dopo la porta: ${res.grid.open} su ${res.grid.total}`);
if (res.walled.north > 0 || res.walled.inWall > 0 || (!process.env.OFF && (res.walled.barracksHit <= 0 || res.walled.mHit > 0))) bad.push("varco murato: " + JSON.stringify(res.walled));
if (res.open.mHit === 0 || res.open.inWall > 0) bad.push("varco libero, gli arieti non colpiscono il monastero: " + JSON.stringify(res.open));
if (res.save.parts !== 2 || !res.save.linked) bad.push("salvataggio: " + JSON.stringify(res.save));
if (bad.length) { console.log("NON VA:\n  " + bad.join("\n  ")); process.exit(1); }
console.log("ok");
