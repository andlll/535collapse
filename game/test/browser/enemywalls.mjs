// Prova nel browser delle mura e delle porte nemiche (§9.75), sulla mappa
// del livello 5: le mura, le porte e i campi da costruire della citta'
// nemica (la meta' est) diventano nemici all'avvio. Alla porta ovest della
// citta', tolti i nemici (unita', torri, castelli, centro, regia economica):
//   conversione  nella meta' est nessun muro, porta o campo del giocatore;
//                4 + 7 tratti, 2 porte, 8 campi nemici; i 4 campi del
//                giocatore restano
//   nebbia       nessun tratto o porta nemica visibile all'inizio
//   percorsi     da fuori a dentro la porta: il giocatore non arriva, i
//                nemici si'
//   porta        si apre con un nemico a contatto, non con un alleato
//   ordine       6 guerrieri mandati col clic destro vero dentro la citta':
//                nessuno passa la porta, tutti fermi
//   ariete       un ariete alleato abbatte la porta; poi i guerrieri, con
//                un altro clic destro, entrano
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemywalls.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=lvl05&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, p = w.path, cam = G.cam;
  G.advance(2);
  const input = w.input;
  let seed = 4;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const out = {};
  const east = (o) => [...w.all(o)].filter((i) => i.x >= 4500).length;
  out.conversione = {
    giocatore: ["mura_ori", "mura_vert", "porta_ori", "porta_vert", "campo_fond"].reduce((n, o) => n + east(o), 0),
    nemici: [w.number("enemy_mura_ori"), w.number("enemy_mura_vert"), w.number("enemy_porta_vert"), w.number("enemy_campo")].join(","),
    campiGiocatore: w.number("campo_fond"),
  };
  out.nebbia = [...w.all("enemy_mura_ori"), ...w.all("enemy_mura_vert"), ...w.all("enemy_porta_vert")].filter((i) => i.visible).length;
  // via i nemici e chi tira
  for (const n of ["enemy_unit", "enemy_eco", "enemy_torre", "enemy_castello", "enemy_centro"]) for (const e of [...w.all(n)]) w.destroy(e);
  for (const d of [...w.all("dialogo")]) w.destroy(d);
  G.g.fogville = 0;
  G.advance(2);
  const gate = [...w.all("enemy_porta_vert")].sort((a, b) => a.x - b.x)[0];
  const outP = [gate.x - 300, gate.y - 60], inP = [gate.x + 300, gate.y - 60];
  out.percorsi = { giocatore: p.reachable(outP[0], outP[1], inP[0], inP[1], false),
                   nemici: p.reachable(outP[0], outP[1], inP[0], inP[1], true) };
  // la porta: un nemico a contatto la apre, un alleato no
  const touch = (o) => { const u = w.create(o, gate.x - 40, gate.y - 60); for (let k = 0; k < 40 && w.distanceToInstance(gate, u) >= 15; k++) w.setPos(u, u.x + 1, u.y); return u; };
  let u = touch("enemy_warrior");
  G.advance(12);
  out.porta = { nemico: gate.open, sprite: gate.sprite_index };
  w.destroy(u); G.advance(12);
  out.porta.chiusa = gate.open;
  u = touch("ally_warrior");
  G.advance(24);
  out.porta.alleato = gate.open;
  w.destroy(u);
  // l'ordine dentro la citta': nessuno passa
  const rightClick = (wx, wy) => {
    cam.x = wx - cam.w / 2; cam.y = wy - cam.h / 2;
    input.x = (wx - cam.x) * cam.cssW / cam.w; input.y = (wy - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    G.advance(1);
  };
  const ws = [];
  for (let k = 0; k < 6; k++) ws.push(w.create("ally_warrior", outP[0] - (k % 3) * 70, outP[1] - 80 + Math.floor(k / 3) * 90));
  const select = () => { for (const a of w.all("ally_unit")) a.selected = 0; for (const a of ws) a.selected = 1; G.g.sel = 6; G.g.milsel = 6; };
  G.advance(3); select();
  rightClick(inP[0], inP[1]);
  let past = 0;
  for (let s = 0; s < 900; s++) { G.advance(1); for (const a of ws) if (a.x > gate.x + 40) past++; }
  out.ordine = { passati: past, fermi: ws.filter((a) => a.action === 0).length };
  // l'ariete
  const r = w.create("ally_ariete", gate.x - 180, gate.y);
  G.advance(2);
  r.target_eu = gate; r.warwork = 1; r.action = 1;
  let down = -1;
  for (let s = 0; s < 4000; s++) {
    r.life = r.slife;
    G.advance(1);
    if (!gate.alive) { down = s; break; }
  }
  out.ariete = { abbattuta: down, percorsi: p.reachable(outP[0], outP[1], inP[0], inP[1], false) };
  w.destroy(r);
  G.advance(2); select();
  rightClick(inP[0], inP[1]);
  for (let s = 0; s < 900; s++) G.advance(1);
  out.ariete.dentro = ws.filter((a) => a.x > gate.x + 100).length;
  return out;
});
console.log(JSON.stringify(res));
const c = res.conversione, ok = c.giocatore === 0 && c.nemici === "4,7,2,8" && c.campiGiocatore === 4 && res.nebbia === 0
  && !res.percorsi.giocatore && res.percorsi.nemici
  && res.porta.nemico === 1 && /_pa_b$/.test(res.porta.sprite) && res.porta.chiusa === 0 && res.porta.alleato === 0
  && res.ordine.passati === 0 && res.ordine.fermi === 6
  && res.ariete.abbattuta > 0 && res.ariete.percorsi && res.ariete.dentro >= 5 && errs.length === 0;
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
