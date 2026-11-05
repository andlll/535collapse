// Prova nel browser della regia del livello 6 (§9.101), sulla mappa
// dell'autore:
//   partenza    risorse del giocatore (400/400/500/200); tre pattuglie (14
//               nemici, coi percorsi della mappa); le 21 torri chiuse, fra il
//               10 e il 40% della vita; la regia economica; il primo dialogo
//   arcieri     la caserma ha solo il pulsante dell'arciere; i civili non
//               hanno i pulsanti di caserma e stalla (la torre si')
//   chiuse      le pattuglie non si vedono (le torri chiuse non vedono); un
//               arciere mandato in una torre chiusa non ci va, un civile
//               mandato a ripararla nemmeno
//   pattuglie   dopo 40 s sono avanti sul loro giro; una che insegue un
//               soldato del giocatore, sparito il soldato, riprende il giro
//   fase 1      sconfitte le pattuglie: le torri si riparano (non ancora del
//               giocatore), dialogo, il conto alla rovescia
//   torre       un civile la ripara oltre il 60%: del giocatore (messaggio),
//               un arciere ci entra
//   rinforzi    a 3 minuti 4 fanti davanti al centro, e 4 incursori dalle
//               caserme nemiche che passano dal ponte di sinistra
//   colonna     allo zero: 50 soldati dal bordo sinistro, piu' lenti (pace),
//               che non danno fuoco; il sesto oltre il ponte di destra e' la
//               sconfitta
//   taratura    (pagina nuova) la colonna contro le 15 torri piu' vicine al
//               suo percorso, presidiate da 2 arcieri, senza altre unita':
//               ne passano al piu' 5, vittoria. Con 5 torri ne passano piu'
//               della meta' (le torri contano, ma da sole poche non bastano)
//   ponteAlto   (§9.107) il ponte in alto sotto la base del giocatore: un
//               soldato lo attraversa ed entra nella citta', e torna; il
//               percorso quasi diritto (prima il piede era chiuso da tre case)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/lvl06.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
const open = async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=lvl06&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};

let page = await open();
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, out = {}, L = () => g.l6;
  let seed = 11;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const seen = new Set();
  const run = (n) => { for (let k = 0; k < n; k++) { G.advance(1); for (const d of [...w.all("parent_hint")]) { seen.add(d.object); w.destroy(d); } } };
  const of = (tag) => [...w.all("enemy_unit")].filter((e) => e.l6 === tag);
  const select = (u) => { for (const a of w.all("ally_unit")) a.selected = 0; u.selected = 1; g.sel = 1; g.milsel = u.object === "ally_omino" ? 0 : 1; };
  run(70);
  const towers = [...w.all("torre")], lifes = towers.map((t) => t.life / t.slife);
  out.partenza = { risorse: [g.food, g.wood, g.gold, g.stone].join("/"), pattuglie: L().patrols, nemici: of("p").length,
                   torri: towers.length, chiuse: towers.filter((t) => t.locked === 1).length,
                   vita: [Math.min(...lifes), Math.max(...lifes)].map((v) => Math.round(100 * v)),
                   eco: w.number("enemy_eco"), dialogo: seen.has("dialogo_6_0"), fase: L().phase };
  // arcieri: la caserma e i civili
  const cas = w.all("caserma").next().value;
  for (const b of w.all("ally_build")) b.selected = 0;
  cas.selected = 1; run(2);
  out.arcieri = { caserma: ["warrior_clicker", "picchiere_clicker", "arciere_clicker"].map((n) => w.number(n)).join("") };
  cas.selected = 0; for (const n of ["warrior_clicker", "picchiere_clicker", "arciere_clicker", "caserma_indietro_clicker"]) for (const c of [...w.all(n)]) w.destroy(c);
  const civ = w.all("ally_omino").next().value;
  select(civ); run(3);
  out.arcieri.civili = ["caserma_clicker", "stalla_clicker", "torre_clicker"].map((n) => w.number(n)).join("");
  civ.selected = 0; g.sel = 0; run(3);
  // chiuse: le pattuglie non si vedono; niente presidio, niente riparazione
  out.chiuse = { visibili: of("p").filter((e) => e.visible).length };
  const t0 = w.nearest(4185, 2403, "torre"); // la torre accanto agli arcieri di partenza
  const arc = w.nearest(t0.x, t0.y, "ally_arciere");
  select(arc); w.mouse.x = t0.x; w.mouse.y = t0.y; w.fire(t0, "rightReleased");
  out.chiuse.presidio = arc.presidiowork || 0;
  select(civ); w.fire(t0, "rightReleased");
  out.chiuse.riparazione = civ.repairwork || 0;
  civ.selected = 0; arc.selected = 0; g.sel = 0; g.milsel = 0;
  // pattuglie: in giro
  const p0 = of("p").map((e) => [e, e.x, e.y]);
  run(2400);
  out.pattuglie = { mossi: p0.filter(([e, x, y]) => Math.hypot(e.x - x, e.y - y) > 150).length, vivi: of("p").length };
  // una pattuglia insegue un soldato e poi riprende il giro
  const e1 = of("p")[0];
  const s = w.create("ally_warrior", e1.x + 150, e1.y + 40); s.life = s.slife = 100000;
  run(60);
  const insegue = e1.warwork === 1 || e1.action === 2;
  w.destroy(s); run(240);
  out.pattuglie.reazione = { insegue, riprende: e1.alive && e1.action === 1 && e1.role === 31 && !e1.warwork ? 1 : 0 };
  // fase 1
  for (const e of of("p")) e.life = 0;
  run(40);
  out.fase1 = { fase: L().phase, riparabili: towers.filter((t) => t.locked === 2).length, dialogo: seen.has("dialogo_6_2"),
                left: L().left };
  // torre: riparata oltre il 60%
  t0.life = Math.ceil(t0.slife * 0.55);
  w.setPos(civ, t0.x, t0.y + 160); civ.action = 0; run(2);
  select(civ); w.mouse.x = t0.x; w.mouse.y = t0.y; w.fire(t0, "rightReleased");
  const rep = civ.repairwork;
  civ.selected = 0; g.sel = 0;
  const st = g.stone;
  for (let k = 0; k < 60 && t0.locked; k++) run(60);
  out.torre = { ordine: rep, sbloccata: t0.locked === 0 ? 1 : 0, pietra: st - g.stone, recuperate: L().towersOk, dialogo: seen.has("dialogo_6_5") };
  select(arc); w.mouse.x = t0.x; w.mouse.y = t0.y; w.fire(t0, "rightReleased");
  out.torre.presidio = arc.presidiowork || 0;
  arc.selected = 0; g.sel = 0; g.milsel = 0;
  // rinforzi e incursioni
  const nAlly = w.number("ally_militare");
  L().p1 = L().t - 3 * 3600 + 5;
  run(20);
  const raiders = of("r"), near = raiders.map(() => Infinity), [bx, by] = [1276, 1488];
  out.rinforzi = { soldati: w.number("ally_militare") - nAlly, dialogo: seen.has("dialogo_6_4"), incursori: raiders.length };
  for (let k = 0; k < 60 * 40; k++) {
    run(1);
    raiders.forEach((e, j) => { if (e.alive) near[j] = Math.min(near[j], Math.hypot(e.x - bx, e.y - by)); });
  }
  out.rinforzi.ponte = near.map(Math.round);
  out.rinforzi.oltre = raiders.filter((e) => !e.alive || e.y > 1700).length;
  // colonna
  L().p1 = L().t - 20 * 3600 + 5;
  run(20);
  out.colonna = { fase: L().phase, dialogo: seen.has("dialogo_6_6") };
  run(600);
  const col = of("c");
  out.colonna.soldati = col.length;
  out.colonna.passo = [...new Set(col.map((e) => e.pace))].join(",");
  out.colonna.fuoco = col.filter((e) => !e.noFire).length;
  const cs = col.slice(0, 6);
  cs.slice(0, 5).forEach((e) => w.setPos(e, 6300, 3700)); run(2);
  out.colonna.cinque = { passati: L().passed, perso: g.gameover || 0 };
  w.setPos(cs[5], 6300, 3700); run(2);
  out.colonna.sei = { passati: L().passed, perso: g.gameover || 0, manager: w.number("gameover_manager") };
  return out;
}).catch((e) => ({ errore: e.message }));
await page.close();

// taratura: N torri presidiate contro la colonna, senza altre unita'
const taratura = async (N) => {
  const p = await open();
  const r = await p.evaluate((N) => {
    const G = window.__game, w = G.world, g = G.g, L = () => g.l6;
    let seed = 5;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const run = (n) => { for (let k = 0; k < n; k++) { G.advance(1); for (const d of [...w.all("parent_hint")]) w.destroy(d); } };
    run(5);
    for (const e of [...w.all("enemy_unit")]) if (e.l6 === "p") e.life = 0;
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
    run(30);
    L().max = 999; // si conta fino in fondo
    const col = w.routes.find((r) => r.name === "colonna").pts;
    const segD = (x, y) => {
      let b = Infinity;
      for (let k = 1; k < col.length; k++) {
        const [ax, ay] = col[k - 1], [bx, by] = col[k], dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        b = Math.min(b, Math.hypot(x - ax - t * dx, y - ay - t * dy));
      }
      return b;
    };
    for (const t of [...w.all("torre")].sort((a, b) => segD(a.x, a.y) - segD(b.x, b.y)).slice(0, N)) {
      t.life = t.slife; t.locked = 0; t.npresidio = 2;
    }
    L().p1 = L().t - 20 * 3600 + 5;
    let t = 0;
    while (t < 60 * 60 * 5 && !(L().phase === 2 && L().colLeft === 0)) { run(60); t += 60; }
    return { torri: N, passati: L().passed, uccisi: L().colN - L().passed - L().colLeft, secondi: t / 60, vinto: g.victory || 0 };
  }, N).catch((e) => ({ errore: e.message }));
  await p.close();
  return r;
};
res.taratura = [await taratura(15), await taratura(5)];

// [§9.107] il ponte in alto sotto la base del giocatore: dall'erba a nord, un
// soldato mandato col clic destro lo attraversa ed entra nella citta' (la
// piazza al piede del ponte, una strada piu' in la'), e torna indietro; il
// percorso e' quasi diritto. Prima tre case della mappa chiudevano il piede
// del ponte: la piazza irraggiungibile, la citta' col giro dall'altro ponte
res.ponteAlto = await (async () => {
  const p = await open();
  const r = await p.evaluate(() => {
    const G = window.__game, w = G.world, cam = G.cam, P = w.path, out = [];
    const run = (n) => { for (let k = 0; k < n; k++) { G.advance(1); for (const d of [...w.all("parent_hint")]) w.destroy(d); } };
    run(70);
    const input = w.input;
    for (const [A, B] of [[[4060, 1960], [3800, 2480]], [[4060, 1960], [3450, 2700]], [[3800, 2480], [4300, 1800]]]) {
      const f = P.goalField(B[0], B[1], false, false, true);
      const celle = f[Math.floor(A[1] / 32) * P.gw + Math.floor(A[0] / 32)], diritta = Math.hypot(A[0] - B[0], A[1] - B[1]) / 32;
      const u = w.create("ally_warrior", A[0], A[1]); run(2);
      for (const a of w.all("ally_unit")) a.selected = 0;
      u.selected = 1; G.g.sel = 1; G.g.milsel = 1;
      cam.x = B[0] - cam.w / 2; cam.y = B[1] - cam.h / 2;
      input.x = (B[0] - cam.x) * cam.cssW / cam.w; input.y = (B[1] - cam.y) * cam.cssH / cam.h; input.inside = true; input._mr[1] = true;
      run(1); u.selected = 0;
      let t = 0;
      while (t < 1200 && Math.hypot(u.x - B[0], u.y - B[1]) > 90) { u.life = u.slife; run(1); t++; }
      out.push({ celle, rapporto: +(celle / diritta).toFixed(2), secondi: +(t / 60).toFixed(1), arrivato: Math.hypot(u.x - B[0], u.y - B[1]) <= 90 });
      w.destroy(u);
    }
    return out;
  }).catch((e) => [{ errore: e.message }]);
  await p.close();
  return r;
})();

console.log(JSON.stringify(res));
const p = res.partenza || {}, f = res.fase1 || {}, t = res.torre || {}, ri = res.rinforzi || {}, c = res.colonna || {}, [t15, t5] = res.taratura;
const ok = !res.errore && p.risorse === "400/400/500/200" && p.pattuglie === 3 && p.nemici === 14 && p.torri === 21 && p.chiuse === 21
  && p.vita[0] >= 9 && p.vita[1] <= 41 && p.eco === 1 && p.dialogo && p.fase === 0
  && res.arcieri.caserma === "001" && res.arcieri.civili === "001"
  && res.chiuse.visibili === 0 && res.chiuse.presidio === 0 && res.chiuse.riparazione === 0
  && res.pattuglie.mossi >= 12 && res.pattuglie.vivi === 14 && res.pattuglie.reazione.insegue && res.pattuglie.reazione.riprende === 1
  && f.fase === 1 && f.riparabili === 21 && f.dialogo && f.left > 19 * 3600
  && t.ordine === 1 && t.sbloccata === 1 && t.pietra > 0 && t.recuperate === 1 && t.dialogo && t.presidio === 1
  && ri.soldati === 4 && ri.dialogo && ri.incursori === 4 && ri.ponte.every((d) => d < 300) && ri.oltre === 4
  && c.fase === 2 && c.dialogo && c.soldati === 50 && c.passo === "0.6" && c.fuoco === 0
  && c.cinque.passati === 5 && c.cinque.perso === 0 && c.sei.passati === 6 && c.sei.perso === 1 && c.sei.manager === 1
  && t15.passati <= 5 && t15.vinto === 1 && t5.passati > 25
  && res.ponteAlto.every((q) => q.arrivato && q.celle > 0 && q.rapporto < 1.6 && q.secondi < 10) && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
