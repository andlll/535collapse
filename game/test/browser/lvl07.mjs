// Prova nel browser della regia del livello 7 (§9.178), sulla mappa
// dell'autore:
//   partenza    l'arciere della nebbia in alto a destra; lo stealth; i banchi
//               di nebbia della mappa; le pattuglie coi percorsi della mappa;
//               la guardia delle macchine e i cinque cavalieri delle stalle;
//               i lavoratori; niente economia nemica; giorno; le macchine
//               tenute da parte; solo la torre in basso a sinistra tira
//   pattuglie   dopo 10 s i tre picchieri della cima sono in cammino verso il
//               granaio, lungo il loro giro
//   lavoratore  l'arciere accanto a un lavoratore del granaio: il lavoratore
//               corre dalla guardia piu' vicina e la mette in allarme
//   porta       l'arciere davanti alla porta senza macchine: il dialogo e
//               l'obiettivo delle macchine
//   macchine    con la guardia viva l'arciere vicino non le libera; uccisa la
//               guardia entrano dal bordo sinistro (tutte e quattro), il
//               dialogo; poi la notte
//   notte       le macchine non si vedono: un fante nemico accanto a un ariete
//               (l'arciere lontano) non lo attacca
//   cavalieri   un ariete troppo vicino alle stalle: i cavalieri partono
//   porta giu'  distrutta la porta: il dialogo, le macchine di nuovo visibili,
//               l'obiettivo della cima
//   vittoria    l'arciere al palo piu' in alto
//   sconfitte   (pagine nuove) le macchine tutte perse con la porta in piedi;
//               l'arciere morto
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/lvl07.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const open = async () => {
  await page.goto(`${base}/index.html?room=lvl07&nostart=1&seed=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  // strumenti nella pagina: l'arciere, spostarlo, chiudere i dialoghi
  await page.evaluate(() => {
    const G = window.__game, w = G.world;
    window.__t = {
      a: () => [...w.all("ally_arciere")][0],
      tp(x, y) { const h = this.a(); w.path.free(h); w.setPos(h, x, y); Object.assign(h, { dirox: x, diroy: y, action: 0 }); w.path.occupy(h); },
      close() { for (const i of [...w.instances]) if (i.alive && /^dialogo_/.test(i.object)) w.destroy(i); },
      dlg: () => [...w.instances].filter((i) => i.alive && /^dialogo_7/.test(i.object)).map((i) => i.object),
      machines: () => [...w.all("ally_unit")].filter((u) => /ariete|catapulta/.test(u.object)),
      run(n) { for (let k = 0; k < n; k++) { G.advance(1); if (k % 50 === 0) this.close(); } },
    };
  });
};
const res = {};
await open();
Object.assign(res, await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, T = window.__t, out = {};
  G.advance(5);
  const a = T.a(), by = (k) => [...w.all("enemy_unit")].filter((e) => e.l7 === k);
  const shooters = [...w.all("enemy_torre"), ...w.all("enemy_castello")].filter((t) => !t.watch);
  out.partenza = { archer: [Math.round(a.x), Math.round(a.y)], hunter: a.hunter, stealth: g.stealth, banchi: w.number("nebbia_banco"),
                   pattuglie: by("p").length, guardia: by("g").length, cavalieri: by("k").length, lavoratori: w.number("enemy_omino"),
                   eco: w.exists("enemy_eco"), night: g.night, tenute: (g.heldGroups.macchine || []).length, macchine: T.machines().length,
                   tirano: shooters.map((t) => [t.object, Math.round(t.x), Math.round(t.y)]) };
  out.partenza.ok = a.x > 4500 && a.y < 800 && a.hunter === 1 && g.stealth === 1 && out.partenza.banchi >= 16 && out.partenza.pattuglie >= 12
    && out.partenza.guardia === 1 && out.partenza.cavalieri === 5 && out.partenza.lavoratori >= 10 && !out.partenza.eco && g.night === 0
    && out.partenza.tenute === 4 && out.partenza.macchine === 0 && shooters.length === 1 && shooters[0].x < 2400 && shooters[0].y > 5800;
  // le pattuglie: i picchieri della cima in cammino
  a.life = a.slife = 1e6; // (la prova: l'arciere non muore)
  T.tp(4300, 300); // fuori dalla loro strada
  T.run(600);
  const top = by("p").filter((e) => e.road && e.road[0][0] > 5500 && e.road[0][1] < 600);
  out.pattuglie = { cima: top.length, inCammino: top.filter((e) => e.action === 1).length, tappe: top.map((e) => e.roadK) };
  out.pattuglie.ok = top.length === 3 && out.pattuglie.inCammino >= 2 && top.every((e) => e.roadK > 0);
  return out;
}));
// il lavoratore del granaio che vede l'arciere
Object.assign(res, await page.evaluate(() => {
  const G = window.__game, w = G.world, T = window.__t, out = {};
  const o = [...w.all("enemy_omino")].find((x) => x.l7w === "food");
  T.tp(o.x + 60, o.y);
  let ran = 0, k = 0;
  for (; k < 900; k++) {
    G.advance(1);
    if (o.l7run) ran = o.l7run;
    if (ran && !o.l7run) break;
  }
  const alerted = [...w.all("enemy_unit")].filter((e) => e.object !== "enemy_omino" && (e.alertUntil || 0) > w._stepNo).length;
  out.lavoratore = { corso: !!ran, passi: k, allarmati: alerted, ok: !!ran && alerted > 0 };
  T.tp(4300, 300);
  return out;
}));
// la porta, le macchine, la notte, i cavalieri, la porta giu', la vittoria
Object.assign(res, await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, T = window.__t, L = () => g.l7, out = {};
  T.close();
  T.tp(700, 1600); G.advance(25);
  out.porta = { dialoghi: T.dlg(), visto: L().gateSeen, ok: L().gateSeen === 1 && T.dlg().includes("dialogo_7_2") };
  T.close();
  T.tp(900, 5650); G.advance(25);
  const prima = L().freed;
  for (const e of [...w.all("enemy_unit")]) if (e.l7 === "g") e.life = 0;
  G.advance(30);
  const dl = T.dlg();
  T.run(1500);
  const ms = T.machines();
  out.macchine = { primaDellaGuardia: prima, liberate: L().freed, dialogo: dl, entrate: ms.length, xs: ms.map((m) => Math.round(m.x)),
                   notte: +g.night.toFixed(2) };
  out.macchine.ok = prima === 0 && L().freed === 1 && dl.includes("dialogo_7_3") && ms.length === 4 && g.night === 1;
  // un fante nemico accanto a un ariete, l'arciere lontano: non lo attacca
  T.tp(4300, 300);
  const m = [...w.all("ally_ariete")][0], life0 = m.life;
  const e1 = w.create("enemy_warrior", m.x + 110, m.y); e1.defender = 0; e1.direction = 180;
  T.run(300);
  out.notte = { cloak: T.machines().every((x) => x.cloak === 1), vita: [life0, m.life], ok: m.life === life0 && T.machines().every((x) => x.cloak === 1) };
  if (e1.alive) w.destroy(e1);
  // un ariete accanto alle stalle: i cavalieri partono
  w.path.free(m); w.setPos(m, L().sx + 450, L().sy + 150); w.path.occupy(m);
  T.run(70);
  const k = [...w.all("enemy_unit")].filter((e) => e.l7 === "k");
  out.cavalieri = { partiti: L().knights, inMoto: k.filter((e) => e.action >= 1 && e.warwork >= 1).length, ok: L().knights === 1 && k.filter((e) => e.warwork >= 1).length === 5 };
  // la porta distrutta
  const gate = w.all("enemy_porta_ori").next().value; gate.life = 0; G.advance(40);
  out.portaGiu = { giu: L().gateDown, dialoghi: T.dlg(), cloak: g.cloakOn, ok: L().gateDown === 1 && T.dlg().includes("dialogo_7_5") && g.cloakOn === 0 };
  T.close();
  // la vittoria: al palo piu' in alto
  T.tp(L().topX, L().topY + 60); G.advance(30);
  out.vittoria = { victory: g.victory, ok: g.victory === 1 && w.exists("victory_manager") };
  return out;
}));
// le sconfitte
await open();
res.sconfittaMacchine = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, T = window.__t;
  G.advance(30); T.a().life = T.a().slife = 1e6;
  T.tp(900, 5650);
  for (const e of [...w.all("enemy_unit")]) if (e.l7 === "g") e.life = 0;
  T.run(1500);
  const n = T.machines().length;
  for (const m of T.machines()) m.life = 0;
  T.run(60);
  return { entrate: n, perse: g.l7.lost, ok: n === 4 && g.l7.lost === "machines" && g.gameover === 1 };
});
await open();
res.sconfittaArciere = await page.evaluate(() => {
  const G = window.__game, g = G.g, T = window.__t;
  G.advance(30); T.a().life = 0; G.advance(30);
  return { perse: g.l7.lost, ok: g.l7.lost === "archer" && g.gameover === 1 };
});
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(18), JSON.stringify(v));
const ok = errs.length === 0 && Object.values(res).every((v) => v.ok);
if (errs.length) console.log("errori:", errs);
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
