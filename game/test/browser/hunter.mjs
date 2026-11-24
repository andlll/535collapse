// [§9.209] Prova nel browser dell'arciere della nebbia del livello 7
// (segnalazioni dell'autore):
//   vista      di giorno un fante nemico a 450 px dall'arciere (dentro la
//              sua vista allargata, 600 x 360 px; fuori dai 300 px di prima)
//              si vede, uno a 900 px no; un edificio nemico a 450 px si vede
//   furtivo    clic destro su un picchiere della pattuglia a 900 px, che poi
//              se ne va: l'arciere gli va dietro, carica il tiro furtivo e lo
//              uccide; mai a camminare sul posto (prima: fermo con
//              l'animazione della camminata per centinaia di passi)
//   rapido     lo stesso col tiro rapido, da 750 px (frecce che anticipano il
//              bersaglio)
//   mura       clic destro su un fante dietro le mura: niente camminata sul
//              posto (si ferma accanto alle mura o lascia perdere)
//   icone      [§9.210] le icone dei due pulsanti del tiro nell'atlas
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/hunter.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const res = {};
let ok = true;
const open = async () => {
  await page.goto(`${base}/index.html?room=lvl07&nostart=1&seed=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  await page.evaluate(() => {
    const G = window.__game, w = G.world, p = w.path;
    window.__t = {
      a: () => [...w.all("ally_arciere")].find((x) => x.hunter),
      tp(x, y) { const h = this.a(); p.free(h); w.setPos(h, x, y); Object.assign(h, { dirox: x, diroy: y, action: 0 }); p.occupy(h); },
      close() { for (const i of [...w.instances]) if (i.alive && /^dialogo_/.test(i.object)) w.destroy(i); },
      run(n) { for (let k = 0; k < n; k++) { G.advance(1); if (k % 50 === 0) this.close(); } },
      // clic destro dell'arciere sul nemico e; poi n passi: quanti di fila
      // "in cammino" (action 1) senza muoversi, quanta strada, morto quando
      attack(e, mode, n, flee) {
        const a = this.a();
        a.shotMode = mode; a.selected = 1; w.g.sel = 1;
        w.act("ordine", { ids: [a.id], x: e.x, y: e.y, over: true });
        const x0 = a.x, y0 = a.y;
        let px = a.x, py = a.y, still = 0, maxStill = 0, walked = 0, dead = -1, shot = 0;
        for (let k = 0; k < n; k++) {
          G.advance(1);
          if (k % 50 === 0) this.close();
          if (flee && k === 5 && e.alive) {
            const [tx, ty] = flee;
            Object.assign(e, { action: 1, warwork: 0, dirox: tx, diroy: ty, flow_field: p.flowField(p.goalField(tx, ty, true, false, true)) });
            if (e.alarm.get(0) < 0) e.alarm.set(0, 12);
          }
          const mv = Math.hypot(a.x - px, a.y - py); px = a.x; py = a.y; walked += mv;
          if (a.action === 1 && mv < 0.01) { still++; maxStill = Math.max(maxStill, still); } else still = 0;
          if (a.action === 2) shot = 1;
          if (dead < 0 && !e.alive) dead = k;
        }
        return { fermoCamminando: maxStill, strada: Math.round(walked), lontano: Math.round(Math.hypot(a.x - x0, a.y - y0)), tirato: shot,
                 morto: dead, azione: a.action, ordine: a.atkorder };
      },
    };
  });
};

// la vista: un fante a 450 px e uno a 900 px, un edificio a 450 px
await open();
res.vista = await page.evaluate(() => {
  const G = window.__game, w = G.world, T = window.__t;
  G.advance(5); T.close();
  const a = T.a();
  a.life = a.slife = 1e6;
  const b = [...w.all("enemy_house")].find((h) => h.x > 5000 && h.y > 1200 && h.y < 1700);
  const bb = w.bbox(b);
  T.tp(bb[0] - 450, (bb[1] + bb[3]) / 2);
  const near = w.create("enemy_warrior", a.x - 450, a.y + 20), far = w.create("enemy_warrior", a.x + 900, a.y - 40);
  for (const e of [near, far]) { e.life = e.slife = 1e6; e.visible = false; }
  b.visible = false;
  G.advance(3);
  const S = w.assets.sprites;
  return { fante450: near.visible, fante900: far.visible, edificio450: b.visible, night: w.g.night,
           icone: !!S.ico_tiro_furtivo && !!S.ico_tiro_rapido };
});
res.vista.ok = res.vista.fante450 === true && res.vista.fante900 === false && res.vista.edificio450 === true && res.vista.night === 0
  && res.vista.icone;
if (!res.vista.ok) ok = false;

// l'inseguimento: un picchiere della pattuglia della cima, l'arciere dietro
// di lui sulla sua strada; dopo l'ordine il picchiere va a sud
for (const [mode, dist] of [["furtivo", 900], ["rapido", 750]]) {
  await open();
  res[mode] = await page.evaluate(([mode, dist]) => {
    const G = window.__game, w = G.world, T = window.__t;
    G.advance(5); T.close();
    const a = T.a();
    a.life = a.slife = 1e6;
    T.tp(4300, 300);
    const e = [...w.all("enemy_unit")].find((x) => x.l7 === "p" && x.road && x.road[0][0] > 5500 && x.road[0][1] < 600);
    const track = [];
    for (let k = 0; k < 1000; k++) { G.advance(1); if (k % 50 === 0) T.close(); if (k % 10 === 0) track.push([e.x, e.y]); }
    const spot = track.reverse().find(([x, y]) => Math.hypot(x - e.x, y - e.y) > dist && w.shotClear(x, y, e.x, e.y));
    T.tp(Math.round(spot[0]), Math.round(spot[1]));
    return T.attack(e, mode, 1200, [5300, 2250]);
  }, [mode, dist]);
  const r = res[mode];
  r.ok = r.morto > 0 && r.fermoCamminando <= 20 && r.lontano > 300 && r.tirato === 1;
  if (!r.ok) ok = false;
}

// dietro le mura: un fante oltre il muro, l'arciere fuori
await open();
res.mura = await page.evaluate(() => {
  const G = window.__game, w = G.world, T = window.__t;
  G.advance(5); T.close();
  const a = T.a();
  a.life = a.slife = 1e6;
  T.tp(5000, 1300);
  const e = w.create("enemy_warrior", 4350, 1250);
  e.life = e.slife = 1e6;
  G.advance(2);
  return T.attack(e, "furtivo", 600, null);
});
res.mura.ok = res.mura.fermoCamminando <= 20 && res.mura.azione !== 1;
if (!res.mura.ok) ok = false;

if (errs.length) { ok = false; res.errori = errs.slice(0, 5); }
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(9), JSON.stringify(v));
await browser.close();
if (!ok) { console.log("NON VA"); process.exit(1); }
console.log("ok");
