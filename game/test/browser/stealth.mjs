// Prova nel browser delle meccaniche dello stealth del livello 7 (§9.148,
// stealth.js), sulla prova ?room=match&prova=nebbia:
//   banchi      i banchi di nebbia vanno solo in orizzontale (y fissa),
//               restano fra i due capi e, toccato un capo, tornano indietro
//   pattuglie   le pattuglie vanno avanti e indietro fra i due capi del
//               percorso verticale
//   davanti     un guerriero nemico fermo, girato a est, si accorge di un
//               soldato a 300 px davanti a lui; non a 300 px alle spalle; si'
//               a 60 px alle spalle (lo sente)
//   nebbia      col soldato dentro un banco (e il nemico fuori), a 300 px
//               davanti non si vede (la vista si dimezza: 200); a 150 px si'
//   furtivo     il tiro furtivo dell'arciere della nebbia su un nemico ignaro
//               lo uccide e nessuno dei vicini va in allarme; su uno in
//               allarme gli toglie 18 di vita (3 volte 6) e non lo uccide
//   rapido      un colpo rapido mette in allarme il colpito e i vicini (entro
//               300 px), che vanno verso l'arciere; non chi e' lontano
//   messaggero  un nemico solo che vede l'arciere non insegue: corre alla
//               torre, e arrivato parte il rinforzo (3) verso l'arciere
//   gruppo      due nemici insieme che lo vedono inseguono (niente messaggero)
//   torre       la torre tira all'arciere a ~490 px; con l'arciere nella
//               nebbia no (vede a meta': 300 px)
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/stealth.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1&prova=nebbia`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, p = w.path, cam = G.cam;
  let seed = 7;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const out = {};
  const prova = w.all("prova_nebbia").next().value;
  const CX = prova.cx, CY = prova.cy;
  const banks = [...w.all("nebbia_banco")], hunter = [...w.all("ally_arciere")].find((a) => a.hunter);
  // banchi e pattuglie, 30 s
  const by = banks.map((b) => b.y), bx = banks.map((b) => [b.x, b.x]), ys = new Map(), turned = banks.map(() => 0);
  const v0 = banks.map((b) => Math.sign(b.speed0));
  for (let s = 0; s < 1800; s++) {
    G.advance(1);
    banks.forEach((b, k) => { bx[k][0] = Math.min(bx[k][0], b.x); bx[k][1] = Math.max(bx[k][1], b.x); if (b.y !== by[k]) by[k] = NaN; if (Math.sign(b.speed0) !== v0[k]) turned[k] = 1; });
    for (const e of w.all("enemy_unit")) if (e.prova) { const r = ys.get(e) || [e.y, e.y]; ys.set(e, [Math.min(r[0], e.y), Math.max(r[1], e.y)]); }
  }
  out.banchi = { n: banks.length, yFissa: by.every((y) => !Number.isNaN(y)), tornati: turned,
                 estremi: banks.map((b, k) => [Math.round(bx[k][0] - b.x0), Math.round(b.x1 - bx[k][1])]) };
  out.pattuglie = [...ys.values()].map(([a, b]) => Math.round(b - a));
  // da qui solo le figure delle prove
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  for (const u of [...w.all("ally_unit")]) if (u !== hunter) { p.free(u); w.destroy(u); }
  const far = [CX - 2000, CY - 2000];
  w.setPos(hunter, far[0], far[1]); hunter.selected = 0;
  // un banco fermo in (x, y): anche i capi, se no al passo dopo torna fra i suoi
  const placeBank = (b, x, y) => { Object.assign(b, { speed0: 0, x0: x, x1: x }); w.setPos(b, x, y); };
  const parkBanks = () => { banks.forEach((b, k) => placeBank(b, CX + 4000 + k * 1200, b.y)); };
  parkBanks();
  // davanti / alle spalle / vicino: un guerriero nemico girato a est
  const watch = (dx, dy, fog = false) => {
    const e = w.create("enemy_warrior", CX, CY + 600);
    Object.assign(e, { direction: 0, defender: 0, role: 32 });
    const a = w.create("ally_warrior", CX + dx, CY + 600 + dy);
    Object.assign(a, { comp: 0, life: 1e6, slife: 1e6 });
    if (fog) placeBank(banks[0], a.x + 400, a.y); // il soldato dentro, il nemico fuori (rx 520)
    let saw = false;
    // si e' accorto: insegue, o e' in allarme (da solo corre alla torre)
    for (let s = 0; s < 30 && !saw; s++) { G.advance(1); if (e.warwork === 1 || e.warwork === 2 || (e.alertUntil || 0) > w._stepNo) saw = true; }
    w.destroy(e); p.free(a); w.destroy(a); parkBanks();
    return saw;
  };
  out.davanti = { davanti300: watch(300, 0), spalle300: watch(-300, 0), spalle60: watch(-60, 0) };
  out.nebbia = { davanti300: watch(300, 0, true), davanti150: watch(150, 0, true) };
  // il tiro dell'arciere della nebbia
  const rightClick = (t) => {
    for (const u of w.all("ally_unit")) u.selected = 0;
    hunter.selected = 1; G.g.sel = 1; G.g.milsel = 1; G.g.arcsel = 1;
    cam.x = t.x - cam.w / 2; cam.y = t.y - cam.h / 2;
    const input = w.input;
    input.x = (t.x - cam.x) * cam.cssW / cam.w; input.y = (t.y - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    G.advance(1);
  };
  const scene = (mode, alertTarget) => {
    for (const e of [...w.all("enemy_unit")]) w.destroy(e);
    w.setPos(hunter, CX - 500, CY - 600); hunter.shotMode = mode; hunter.action = 0; hunter.warwork = 0; hunter.life = 1e6; hunter.direction = 0;
    const t = w.create("enemy_warrior", CX, CY - 600);
    const near = w.create("enemy_warrior", CX + 200, CY - 600 + 60);
    const farE = w.create("enemy_warrior", CX + 600, CY - 600);
    // girati dall'altra parte (est): non vedono l'arciere a ovest
    for (const e of [t, near, farE]) Object.assign(e, { direction: 0, defender: 0, role: 32 });
    if (alertTarget) t.alertUntil = w._stepNo + 100000;
    G.advance(2);
    const life0 = t.life;
    rightClick(t);
    let hitAt = -1;
    for (let s = 0; s < 400 && hitAt < 0; s++) { G.advance(1); if (!t.alive || t.life < life0) hitAt = s; }
    G.advance(2);
    const alerted = (e) => (e.alertUntil || 0) > w._stepNo;
    return { colpito: hitAt, morto: !t.alive || t.life <= 0, vita: t.alive ? t.life : 0, vicinoInAllarme: alerted(near),
             vicinoVaVerso: near.searching === 1 ? Math.round(Math.hypot(near.dirox - hunter.x, near.diroy - hunter.y)) : null,
             lontanoInAllarme: alerted(farE) };
  };
  out.furtivo = { ignaro: scene("furtivo", false), inAllarme: scene("furtivo", true) };
  out.rapido = scene("rapido", false);
  // il messaggero, il gruppo, la torre
  const T = w.all("enemy_torre").next().value;
  const clear = () => { for (const e of [...w.all("enemy_unit")]) w.destroy(e); };
  const ready = (x, y) => { w.setPos(hunter, x, y); Object.assign(hunter, { shotMode: "furtivo", action: 0, warwork: 0, atkorder: 0, atktarget: null, life: 1e6, selected: 0 }); };
  {
    clear();
    const e = w.create("enemy_warrior", T.x - 700, T.y + 250);
    Object.assign(e, { direction: 180, defender: 0, role: 32 });
    ready(e.x - 250, e.y);
    let chased = false, msgAt = -1, reinfAt = -1;
    for (let s = 0; s < 1500 && reinfAt < 0; s++) {
      G.advance(1);
      if (e.warwork === 1) chased = true;
      if (msgAt < 0 && e.messenger) msgAt = s;
      if (w.number("enemy_unit") >= 4) reinfAt = s;
    }
    const R = [...w.all("enemy_unit")].filter((o) => o !== e);
    out.messaggero = { diventa: msgAt, insegue: chased, rinforzoDopo: reinfAt, rinforzi: R.length,
                       versoArciere: R.map((o) => Math.round(Math.hypot(o.dirox - hunter.x, o.diroy - hunter.y))), dopoArrivo: e.messenger || 0 };
  }
  {
    clear();
    const a = w.create("enemy_warrior", T.x - 700, T.y + 250), b = w.create("enemy_warrior", T.x - 700, T.y + 320);
    for (const e of [a, b]) Object.assign(e, { direction: 180, defender: 0, role: 32 });
    ready(a.x - 250, a.y + 30);
    let chased = false;
    for (let s = 0; s < 60; s++) { G.advance(1); if (a.warwork === 1 || b.warwork === 1) chased = true; }
    out.gruppo = { insegue: chased, messaggero: !!(a.messenger || b.messenger) };
  }
  const towerShots = (fog) => {
    clear(); parkBanks();
    ready(T.x - 450, T.y + 200);
    if (fog) placeBank(banks[0], hunter.x - 300, hunter.y);
    T.arm = 1;
    const seen = new Set();
    for (let s = 0; s < 150; s++) { G.advance(1); for (const b of w.all("b_arciere_bullet_t")) seen.add(b.id); }
    parkBanks();
    return seen.size;
  };
  out.torre = { fuori: towerShots(false), nebbia: towerShots(true) };
  return out;
});
const r = res;
const ok = errs.length === 0
  && r.banchi.n === 4 && r.banchi.yFissa && r.banchi.tornati.every((t) => t === 1)
  && r.banchi.estremi.every(([a, b]) => a >= 0 && b >= 0 && (a <= 2 || b <= 2))
  && r.pattuglie.length === 4 && r.pattuglie.every((d) => d > 600)
  && r.davanti.davanti300 && !r.davanti.spalle300 && r.davanti.spalle60
  && !r.nebbia.davanti300 && r.nebbia.davanti150
  && r.furtivo.ignaro.morto && r.furtivo.ignaro.colpito >= 100 && !r.furtivo.ignaro.vicinoInAllarme
  && !r.furtivo.inAllarme.morto && r.furtivo.inAllarme.vita === 75 - 18
  && !r.rapido.morto && r.rapido.vita === 75 - 6 && r.rapido.colpito < 60 && r.rapido.vicinoInAllarme && r.rapido.vicinoVaVerso !== null
  && r.rapido.vicinoVaVerso < 40 && !r.rapido.lontanoInAllarme
  && r.messaggero.diventa >= 0 && r.messaggero.diventa < 30 && !r.messaggero.insegue && r.messaggero.rinforzoDopo > 0
  && r.messaggero.rinforzi === 3 && r.messaggero.versoArciere.every((d) => d < 80) && !r.messaggero.dopoArrivo
  && r.gruppo.insegue && !r.gruppo.messaggero
  && r.torre.fuori > 0 && r.torre.nebbia === 0;
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(10), JSON.stringify(v));
if (errs.length) console.log(errs.slice(0, 3));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
