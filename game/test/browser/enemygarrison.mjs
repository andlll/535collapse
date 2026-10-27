// Prova nel browser del presidio nemico e della nebbia (§9.80), nella zona
// aperta del match:
//   torre    una torre nemica della mappa parte con 2 arcieri e tira; svuotata
//            non tira; in pace un arciere nemico vicino la rioccupa; con un
//            soldato del giocatore a 650 px (minaccia, fuori tiro) la
//            riempie un secondo; sotto un quarto della vita escono tutti
//            con la vita con cui erano entrati (30 e 40)
//   calma    fortezza nemica con 4 arcieri, nessuna minaccia: dopo 30 s ne
//            escono, uno ogni 10 s, fino a uno
//   nuova    fortezza finita da un cantiere nemico (built): vuota, non tira
//   nebbia   un guerriero nemico accanto a una nuvola (fog01) insegue un
//            soldato fermo a 180 px (prima restava fermo), non uno a 330
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemygarrison.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const kind of ["torre", "calma", "nuova", "nebbia"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const res = await page.evaluate((KIND) => {
    const G = window.__game, w = G.world, p = w.path;
    G.advance(2);
    let seed = 7;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const e of [...w.all("enemy_manager")]) w.destroy(e);
    for (const e of [...w.all("fog01")]) w.destroy(e);
    for (const e of [...w.all("fog_controller")]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, night: 0 });
    for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
      let bad = 0;
      for (let dy = -24; dy <= 24; dy += 2) for (let dx = -30; dx <= 30; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const X = best.gx * 32 + 16, Y = best.gy * 32 + 16;
    const arrows = () => w.number("b_arciere_bullet_t");
    const run = (n, f) => { for (let s = 0; s < n; s++) { G.advance(1); if (f) f(); } };
    const out = {};
    if (KIND === "torre") {
      w._stepNo = 0; const t = w.create("enemy_torre", X, Y); w._stepNo = 100; // della mappa
      t.life = t.slife = 100000;
      out.start = t.npresidio;
      // un bersaglio a 400 px: tira (2 arcieri)
      const s1 = w.create("ally_warrior", X + 400, Y);
      let shot = 0; run(120, () => { shot = Math.max(shot, arrows()); s1.life = s1.slife; });
      out.tira = shot > 0;
      // vuota: non tira
      t.npresidio = 0; t.garrisonLives = [];
      p.free(s1); w.destroy(s1); run(60);
      const s2 = w.create("ally_warrior", X + 400, Y); t.npresidio = 0;
      shot = 0; run(5, () => { t.npresidio = 0; }); run(110, () => { shot += arrows(); s2.life = s2.slife; for (const a of w.all("enemy_arciere")) w.destroy(a); });
      out.vuotaNonTira = shot === 0;
      p.free(s2); w.destroy(s2); run(5);
      for (const b of [...w.all("b_arciere_bullet_t")]) w.destroy(b);
      // in pace: un arciere vicino entra (uno solo)
      const a1 = w.create("enemy_arciere", X - 300, Y + 150), a2 = w.create("enemy_arciere", X - 350, Y - 150);
      a1.life = 30; a2.life = 40;
      run(600);
      out.pace = t.npresidio;
      // minaccia (fuori tiro): entra il secondo
      const s3 = w.create("ally_warrior", X + 680, Y + 100);
      run(600, () => { s3.life = s3.slife; });
      out.minaccia = t.npresidio;
      out.arcieriFuori = w.number("enemy_arciere");
      // sotto un quarto della vita: escono tutti, con la loro vita
      p.free(s3); w.destroy(s3);
      t.life = t.slife * 0.2;
      run(40);
      out.dopoCrollo = t.npresidio;
      out.vite = [...w.all("enemy_arciere")].map((a) => a.life).sort((x, y) => x - y);
      run(120);
      out.viteDopo2s = [...w.all("enemy_arciere")].map((a) => a.life).sort((x, y) => x - y);
      out.ok = out.start === 2 && out.tira && out.vuotaNonTira && out.pace === 1 && out.minaccia === 2 && out.arcieriFuori === 0
        && out.dopoCrollo === 0 && JSON.stringify(out.vite) === "[30,40]" && JSON.stringify(out.viteDopo2s) === "[30,40]";
    } else if (KIND === "calma") {
      w._stepNo = 0; const c = w.create("enemy_castello", X, Y); w._stepNo = 100;
      c.npresidio = 4; c.garrisonLives = [{ life: 50 }, { life: 51 }, { life: 52 }, { life: 53 }];
      run(1700);
      out.a28s = c.npresidio;
      run(700);
      out.a40s = c.npresidio;
      run(1200);
      out.a60s = c.npresidio;
      out.fuori = w.number("enemy_arciere");
      out.ok = out.a28s === 4 && out.a40s < 4 && out.a60s === 1 && out.fuori === 3;
    } else if (KIND === "nuova") {
      const c = w.create("enemy_castello", X, Y, { init: (n) => { n.built = 1; } });
      const s = w.create("ally_warrior", X + 400, Y);
      let shot = 0; run(200, () => { shot += arrows(); s.life = s.slife; });
      out.npresidio = c.npresidio; out.frecce = shot;
      out.ok = c.npresidio === 0 && shot === 0;
    } else {
      // il guerriero accanto a una nuvola che non si muove
      const f = w.create("fog01", X, Y - 150); f.speed = 0; f.alarm.set(0, 100000); f.alarm.set(2, 100000);
      const e = w.create("enemy_warrior", X, Y);
      const near = w.create("ally_warrior", X + 180, Y);
      let moved = false;
      run(120, () => { near.life = near.slife; w.setPos(near, X + 180, Y); if (e.action === 1 || e.action === 2) moved = true; });
      out.vicino = moved;
      p.free(near); w.destroy(near);
      w.setPos(e, X, Y); e.action = 0; e.warwork = 0; e.speed = 0;
      const far = w.create("ally_warrior", X + 330, Y);
      moved = false;
      run(120, () => { far.life = far.slife; w.setPos(far, X + 330, Y); if (e.action === 1 || e.action === 2) moved = true; });
      out.lontano = moved;
      out.ok = out.vicino && !out.lontano;
    }
    return out;
  }, kind);
  const bad = !res.ok || errs.length;
  if (bad) failed = true;
  console.log(kind.padEnd(7), JSON.stringify(res), bad ? "NON VA" : "", errs.slice(0, 1).join(""));
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
