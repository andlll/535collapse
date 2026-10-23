// Prova nel browser della regia del livello 5 (§9.76), sulla mappa
// dell'autore:
//   partenza    risorse del giocatore; la regia economica con 4 lavoratori e
//               la riserva di pietra; le due torri di vedetta; il primo
//               dialogo; l'obiettivo della fase 0
//   vedetta     un soldato accanto a una torre di vedetta per 10 s: nessuna
//               freccia
//   ritirata    la battaglia d'apertura: ridotti a due terzi (o dopo 45 s) i
//               nemici si ritirano (fase 1, dialogo) ed entrano in citta'
//               dalla porta
//   mura        un alleato davanti alle mura: fase 2, dialogo (spesso gia'
//               da solo: i soldati inseguono i nemici fino alle mura)
//   acropoli    poi un alleato alle rovine: fase 3, dialogo
//   pietra      un edificio di legno danneggiato si ripara, uno di pietra
//               no; distrutti, si ricostruisce solo quello di legno
//   fortezza    una fortezza finita: fase 4, dialogo, l'obiettivo della citta'
//   avviso      la prima ondata dopo la fortezza, a 900 px da lei, torna in
//               citta' (dialogo); l'ondata dopo ha una macchina d'assedio
//               (pagata in pietra)
//   vittoria    distrutta la citta' (tranne mura, porte e campi)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/lvl05.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=lvl05&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g;
  let seed = 7;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const out = {};
  const dialogs = new Set();
  const step = (n = 1) => {
    for (let k = 0; k < n; k++) {
      G.advance(1);
      for (const d of [...w.all("parent_hint")]) { if (/^dialogo_5_/.test(d.object)) dialogs.add(d.object); w.destroy(d); }
    }
  };
  step(70);
  const L = () => g.l5;
  out.partenza = {
    risorse: [g.food, g.wood, g.gold, g.stone].join("/"), eco: w.number("enemy_eco"), lavoratori: w.number("enemy_omino"),
    pietra: g.en && g.en.stone, vedetta: [...w.all("enemy_torre")].filter((t) => t.watch === 1).length,
    apertura: L().n0, fase: L().phase, dialogo: dialogs.has("dialogo_5_0"),
  };
  // vedetta: un guerriero (invulnerabile) accanto a una torre di vedetta
  const tw = [...w.all("enemy_torre")].find((t) => t.watch === 1);
  const before = w.number("b_arciere_bullet_t");
  let arrows = 0;
  const spy = w.create("ally_warrior", tw.x - 150, tw.y + 60);
  for (let s = 0; s < 600; s++) { spy.life = spy.slife; step(1); arrows = Math.max(arrows, w.number("b_arciere_bullet_t") - before); }
  w.destroy(spy);
  out.vedetta = arrows;
  // la ritirata, da sola (puo' essere gia' cominciata)
  let t0 = 0;
  for (let s = 0; s < 3000 && L().phase === 0; s++) { step(1); t0 = s; }
  const runners = [...w.all("enemy_unit")].filter((e) => e.l5open === 1);
  out.ritirata = { fase: L().phase, passo: t0, dialogo: dialogs.has("dialogo_5_1"), quanti: runners.length };
  // tolti gli alleati vicino ai fuggitivi (non devono inseguirli), arrivano
  for (const a of [...w.all("ally_militare")]) a.comp = 50;
  for (let s = 0; s < 2400; s++) step(1);
  out.ritirata.dentro = runners.filter((e) => e.alive && e.x > 5300).length;
  out.ritirata.vivi = runners.filter((e) => e.alive).length;
  // le mura
  const sold = w.create("ally_cavaliere", 4650, 2450);
  sold.comp = 50;
  step(40);
  out.mura = { fase: L().phase, dialogo: dialogs.has("dialogo_5_2") };
  // l'acropoli
  w.setPos(sold, 3000, 2400);
  step(400);
  out.acropoli = { fase: L().phase, dialogo: dialogs.has("dialogo_5_3") };
  // la pietra: un edificio di legno e uno di pietra danneggiati, poi distrutti
  const c = w.all("enemy_centro").next().value;
  const near = (o) => [...w.all(o)].sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
  const house = near("enemy_house"), castle = near("enemy_castello");
  house.life -= 40; castle.life -= 100;
  const h0 = house.life, c0 = castle.life;
  step(1500);
  out.pietra = { casa: house.life - h0, castello: castle.life - c0 };
  house.life = 0; castle.life = 0;
  step(30);
  // da ricostruire: in elenco o gia' in cantiere
  out.pietra.persi = [...(g.en.lost || []).map((l) => l.o), ...[...w.all("enemy_cantiere")].map((k) => k.target)].join(",");
  // la fortezza
  const f = w.create("castello", 2300, 2400);
  step(5);
  out.fortezza = { fase: L().phase, dialogo: dialogs.has("dialogo_5_4") };
  // l'ondata che avvisa: cinque soldati della regia, partenza subito
  const army = (n) => {
    const list = [];
    for (let k = 0; k < n; k++) {
      const e = w.create("enemy_warrior", 6000 + (k % 3) * 60, 2400 + Math.floor(k / 3) * 70);
      e.eco = 1; e.role = 30; list.push(e);
    }
    g.en.since = -1e9; g.en.nextAttack = 0;
    return list;
  };
  const wave1 = army(5);
  for (let s = 0; s < 120 && !wave1.some((e) => e.role === 31); s++) step(1);
  let warned = -1;
  for (let s = 0; s < 4000 && !L().warned; s++) { for (const e of wave1) e.life = e.slife; step(1); warned = s; }
  const minD = Math.round(Math.min(...wave1.filter((e) => e.alive).map((e) => Math.hypot(e.x - f.x, e.y - f.y))));
  out.avviso = { passo: warned, avvisato: L().warned, assedio: L().siege, dialogo: dialogs.has("dialogo_5_5"),
                 ritirata: wave1.filter((e) => e.alive && e.retreat).length, distanza: minD };
  const stone0 = g.en.stone;
  army(5);
  step(60);
  out.avviso.macchine = w.number("enemy_ariete") + w.number("enemy_catapulta");
  out.avviso.pietra = stone0 - g.en.stone;
  // la vittoria
  for (const o of ["enemy_centro", "enemy_house", "enemy_caserma", "enemy_stalla", "enemy_chiesa", "enemy_castello",
                   "enemy_magazzino", "enemy_mulino", "enemy_torre", "enemy_fondamenta"]) {
    for (const b of [...w.all(o)]) w.destroy(b);
  }
  step(5);
  out.vittoria = { vinto: g.victory, manager: w.number("victory_manager"), mura: w.number("enemy_mura_vert") };
  return out;
});
console.log(JSON.stringify(res));
const p = res.partenza, r = res.ritirata, a = res.avviso;
const ok = p.risorse === "200/200/100/0" && p.eco === 1 && p.lavoratori >= 4 && p.pietra >= 3000 && p.vedetta === 2
  && p.apertura === 15 && p.fase === 0 && p.dialogo
  && res.vedetta === 0
  && r.fase >= 1 && r.dialogo && r.dentro >= r.vivi - 1 && r.vivi > 0
  && res.mura.fase >= 2 && res.mura.dialogo && res.acropoli.fase === 3 && res.acropoli.dialogo
  && res.pietra.casa > 0 && res.pietra.castello === 0 && /enemy_house/.test(res.pietra.persi) && !/enemy_castello/.test(res.pietra.persi)
  && res.fortezza.fase === 4 && res.fortezza.dialogo
  && a.avvisato === 1 && a.assedio === 1 && a.dialogo && a.ritirata >= 4 && a.macchine >= 1 && a.pietra >= 250
  && res.vittoria.vinto === 1 && res.vittoria.manager === 1 && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
