// Prova nel browser dei campi e dei posti della CPU (§9.237, segnalazioni
// dell'autore: "non puo' costruire in posti bloccati come sopra i fiumi";
// "non deve costruire i campi di grano come edifici, ma coltivarli usando un
// lavoratore per volta"; "quando un campo di grano viene distrutto non deve
// fare il sfx del crollo").
// Una schermaglia su sk_rivo (21 fiumi a linee), la CPU che gioca da sola:
//   fiumi    = nessun edificio nuovo della CPU (cantieri e campi da seminare
//              compresi) ha la maschera sull'acqua o sulle montagne; anche
//              con la base (un centro nuovo) dove attorno c'e' piu' acqua
//   seminati = i campi nuovi nascono da seminare (enemy_campo_fond), mai
//              come cantiere da costruire (enemy_cantiere per enemy_campo)
//   uno      = su ogni campo da seminare al piu' un lavoratore, e nessuno
//              lo costruisce (azione 6)
//   finiti   = almeno un campo seminato diventa un campo (enemy_campo)
//   torre    = [§9.242] una torre nemica della mappa, fuori dalla campagna,
//              parte vuota
//   silenzio = un campo bruciato (del giocatore e della CPU, sotto gli
//              occhi) non fa il suono del crollo; una casa si'
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemyfields.mjs [room] [passi]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_rivo", stepsArg = "24000"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.addInitScript((room) => { localStorage.setItem("535.skirmish", JSON.stringify({ map: room, fog: "none" })); }, room);
await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=3`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });

const res = await page.evaluate((steps) => {
  const G = window.__game, w = G.world;
  G.advance(2);
  const before = new Set([...w.all("enemy_build")].map((b) => b.id));
  const out = { rivers: (w.rivers || []).length, wet: [], cantiereCampo: 0, fonds: 0, campi0: w.number("enemy_campo"), maxSowers: 0, builders: 0, seen: new Set() };
  // (la casa nemica non ha maschera: la sua scatola e' il disegno, tetto
  // compreso; il posto conta l'impronta, quella del suo cantiere, come per
  // il fantasma della casa del giocatore)
  const wet = (b) => { const bb = b.object !== "enemy_house" && w.bbox(b); return !!bb && w.inTerrain(bb[0], bb[1], bb[2], bb[3]); };
  for (let s = 0; s < steps; s += 10) {
    G.advance(10);
    const workers = [...w.all("enemy_omino")];
    for (const b of [...w.all("enemy_build"), ...w.all("enemy_cantiere")]) {
      if (before.has(b.id) || out.seen.has(b.id)) continue;
      out.seen.add(b.id);
      if (wet(b)) out.wet.push([b.object, Math.round(b.x), Math.round(b.y)]);
      if (b.object === "enemy_cantiere" && b.target === "enemy_campo") out.cantiereCampo++;
      if (b.object === "enemy_campo_fond") out.fonds++;
    }
    for (const f of w.all("enemy_campo_fond")) {
      const on = workers.filter((o) => (o.fieldwork === 1 || o.action === 8) && Math.hypot(o.buildx - f.x, o.buildy - f.y) < 30).length;
      out.maxSowers = Math.max(out.maxSowers, on);
      out.builders += workers.filter((o) => o.action === 6 && Math.hypot(o.buildx - f.x, o.buildy - f.y) < 30).length;
    }
  }
  out.campi = w.number("enemy_campo");
  out.seen = out.seen.size;
  out.edifici = [...w.all("enemy_build")].filter((b) => !before.has(b.id)).map((b) => b.object).sort().join(",");
  // il suono: un campo del giocatore, uno della CPU e una casa bruciati al centro della vista
  const played = [], orig = G.audio.play.bind(G.audio);
  G.audio.play = (name, ...a) => { played.push(name); return orig(name, ...a); };
  const c = w.cam, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  const sound = (o) => {
    played.length = 0;
    const i = w.create(o, cx, cy);
    i.visible = true;
    G.advance(2);
    i.life = 0;
    G.advance(3);
    return played.filter((n) => /^rovina/.test(n));
  };
  // [§9.242] fuori dalla campagna la torre nemica della mappa parte vuota
  { const t = w.create("enemy_torre", 300, 300); out.torreVuota = t.npresidio === 0; w.destroy(t); }
  out.suoni = { campo: sound("campo"), enemy_campo: sound("enemy_campo"), enemy_campo_fond: sound("enemy_campo_fond"), enemy_house: sound("enemy_house") };
  G.audio.play = orig;
  return out;
}, Number(stepsArg));
console.log(JSON.stringify(res));

// la base della CPU accanto a un fiume: un centro nuovo dove attorno (fra
// 260 e 700 px, dove la CPU cerca i posti) c'e' piu' acqua, con lavoratori
// e scorte; i suoi edifici nuovi mai sull'acqua
await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=4`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
const res2 = await page.evaluate((steps) => {
  const G = window.__game, w = G.world, p = w.path;
  G.advance(2);
  for (const e of [...w.all("enemy_build"), ...w.all("enemy_unit")]) { if (e.solid) p.markInstance(e, 1); w.destroy(e); }
  const box = (x, y, r) => w.inTerrain(x - r, y - r, x + r, y + r);
  let best = null;
  for (let y = 600; y < w.roomH - 600; y += 100) for (let x = 600; x < w.roomW - 600; x += 100) {
    if (box(x, y, 260)) continue;
    let wet = 0;
    for (let r = 300; r <= 700; r += 100) for (let k = 0; k < 16; k++) if (box(x + r * Math.cos(k * Math.PI / 8), y + r * 0.75 * Math.sin(k * Math.PI / 8), 2)) wet++;
    if (!best || wet > best.wet) best = { x, y, wet };
  }
  for (const u of [...w.all("ally_unit")]) if (Math.hypot(u.x - best.x, u.y - best.y) < 2500) w.destroy(u);
  const c = w.create("enemy_centro", best.x, best.y); p.markInstance(c, 1000);
  for (let k = 0; k < 6; k++) w.create("enemy_omino", best.x - 150 + k * 60, best.y + 200);
  Object.assign(G.g.en, { food: 5000, wood: 5000, gold: 5000, stone: 5000 });
  const wetOf = (b) => { const bb = b.object !== "enemy_house" && w.bbox(b); return !!bb && w.inTerrain(bb[0], bb[1], bb[2], bb[3]); };
  const seen = new Set(), wet = [];
  for (let s = 0; s < steps; s += 10) {
    G.advance(10);
    for (const b of [...w.all("enemy_build"), ...w.all("enemy_cantiere")]) {
      if (b === c || seen.has(b.id)) continue;
      seen.add(b.id);
      if (wetOf(b)) wet.push([b.object, Math.round(b.x), Math.round(b.y)]);
    }
  }
  return { home: best, nuovi: seen.size, wet };
}, Math.round(Number(stepsArg) / 2));
console.log(JSON.stringify(res2));
const S = res.suoni;
const ok = res.rivers > 0 && res.wet.length === 0 && res.cantiereCampo === 0 && res.fonds > 0 && res.maxSowers <= 1 && res.builders === 0
  && res.campi > res.campi0 && res.torreVuota && res2.home.wet > 10 && res2.nuovi >= 4 && res2.wet.length === 0 && !S.campo.length && !S.enemy_campo.length && !S.enemy_campo_fond.length && S.enemy_house.length > 0 && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
