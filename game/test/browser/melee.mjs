// Prova nel browser del colpo in mischia portato a termine (§9.28): un
// alleato (cavaliere, guerriero, picchiere) contro un guerriero nemico che
// si lascia raggiungere e, appena l'alleato comincia a colpire, aspetta
// qualche passo e scappa (la sua posizione la decide la prova, non la sua
// intelligenza); poi lo stesso a parti invertite, un nemico (guerriero,
// picchiere, cavaliere) contro un guerriero alleato. Per ogni tipo:
//   starts  = colpi cominciati (action che diventa 2)
//   hits    = colpi arrivati (il bersaglio perde vita)
//   aborts  = colpi interrotti senza danno (action che lascia il 2 senza
//             che il bersaglio abbia perso vita da quando era cominciato)
//   far     = colpi arrivati col bersaglio gia' oltre i 10 px
// Poi due casi di controllo, col guerriero:
//   order   = a meta' colpo, col bersaglio scappato, il giocatore ordina di
//             spostarsi (clic destro vero): il colpo si interrompe, niente
//             danno, l'unita' parte
//   dead    = a meta' colpo, col bersaglio scappato, il bersaglio muore: il
//             colpo si interrompe e un altro nemico lontano non perde vita
// Esce con codice 1 se qualcosa non torna. Deterministica.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/melee.mjs [room]
//   (BASE=url se il gioco non e' su http://localhost:8123)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [room = "match"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=${room}&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, cam = G.cam, p = w.path;
  G.advance(2);
  let seed = 7;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const clear = () => {
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
  };
  for (const n of ["enemy_manager", "enemy_manager_lv2", "enemy_manager_lv3"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1 });
  G.g.fogville = 0;
  clear();
  // zona aperta: il punto con meno celle ostacolo attorno
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  const HOLD = 6, RUN = 30, V = 3;

  // Il nemico scappa lungo un cerchio attorno al centro, cosi' resta nella
  // zona aperta per tutta la prova.
  const kite = (obj, steps, victim = "enemy_warrior") => {
    clear();
    const a = w.create(obj, CX - 200, CY);
    const e = w.create(victim, CX - 120, CY);
    G.advance(2);
    let ang = Math.PI, st = "wait", n = 0, ex = e.x, ey = e.y;
    const R = Math.hypot(ex - CX, ey - CY);
    const M = { starts: 0, hits: 0, aborts: 0, far: 0, farMax: 0 };
    let prevAct = a.action, hitSinceStart = false;
    for (let s = 0; s < steps; s++) {
      a.life = a.slife; e.life = e.slife;
      G.advance(1);
      if (!a.alive || !e.alive) return { err: "unita' morta" };
      if (e.life < e.slife) {
        M.hits++; hitSinceStart = true;
        const d = w.distanceToInstance(a, e);
        if (d >= 10) { M.far++; M.farMax = Math.max(M.farMax, Math.round(d)); }
      }
      if (a.action === 2 && prevAct !== 2) { M.starts++; hitSinceStart = false; }
      if (a.action !== 2 && prevAct === 2 && !hitSinceStart) M.aborts++;
      prevAct = a.action;
      // il nemico: fermo finche' l'alleato non colpisce, poi HOLD passi e
      // via per RUN passi
      if (st === "wait" && a.action === 2) { st = "hold"; n = 0; }
      else if (st === "hold" && ++n >= HOLD) { st = "run"; n = 0; }
      else if (st === "run") {
        ang += V / R;
        ex = CX + Math.cos(ang) * R; ey = CY + Math.sin(ang) * R * 0.7;
        if (++n >= RUN) st = "wait";
      }
      w.setPos(e, Math.round(ex), Math.round(ey));
      e.action = 0; e.warwork = 0;
    }
    return M;
  };
  const out = {};
  for (const obj of ["ally_cavaliere", "ally_warrior", "ally_picchiere"]) out[obj] = kite(obj, 1500);
  for (const obj of ["enemy_warrior", "enemy_picchiere", "enemy_cavaliere"]) out[obj] = kite(obj, 1500, "ally_warrior");

  // a meta' colpo, col bersaglio lontano: ordine del giocatore o morte
  const midSwing = (then) => {
    clear();
    const a = w.create("ally_warrior", CX - 200, CY);
    const e = w.create("enemy_warrior", CX - 120, CY);
    const other = w.create("enemy_warrior", CX + 160, CY + 120);
    G.advance(2);
    let s = 0;
    for (; s < 400 && a.action !== 2; s++) {
      a.life = a.slife; G.advance(1);
      w.setPos(e, CX - 120, CY); e.action = 0; e.warwork = 0;
      w.setPos(other, CX + 160, CY + 120); other.action = 0; other.warwork = 0;
    }
    if (a.action !== 2) return { err: "il colpo non comincia" };
    for (let k = 0; k < 6; k++) { G.advance(1); w.setPos(e, CX - 120, CY); w.setPos(other, CX + 160, CY + 120); }
    // scappa di 60 px
    w.setPos(e, CX - 120 + 60, CY - 30);
    G.advance(1);
    const r = { swingingAfterFlee: a.action === 2 };
    then(a, e, other, r);
    return r;
  };
  out.order = midSwing((a, e, other, r) => {
    const l0 = e.life;
    for (const u of w.all("ally_unit")) u.selected = 0;
    a.selected = 1; G.g.sel = 1; G.g.milsel = 1;
    const input = w.input, tx = CX - 450, ty = CY + 200;
    cam.x = tx - cam.w / 2; cam.y = ty - cam.h / 2;
    input.x = (tx - cam.x) * cam.cssW / cam.w; input.y = (ty - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
    const x0 = a.x, y0 = a.y;
    let lost = 0;
    for (let k = 0; k < 60; k++) {
      a.life = a.slife; G.advance(1);
      w.setPos(e, CX - 60, CY - 30); e.action = 0; e.warwork = 0;
      w.setPos(other, CX + 160, CY + 120); other.action = 0; other.warwork = 0;
      if (e.life < l0) lost++;
    }
    r.action = a.action; r.moved = Math.round(Math.hypot(a.x - x0, a.y - y0)); r.targetHit = lost > 0;
  });
  out.dead = midSwing((a, e, other, r) => {
    const l1 = other.life;
    e.life = 0;
    let swing = 0, hitFar = false;
    for (let k = 0; k < 45; k++) {
      a.life = a.slife; G.advance(1);
      if (other.alive) { w.setPos(other, CX + 160, CY + 120); other.action = 0; other.warwork = 0; }
      if (a.action === 2) swing++;
      if (other.life < l1 && w.distanceToInstance(a, other) >= 10) hitFar = true;
    }
    r.targetGone = !e.alive; r.swingSteps = swing; r.otherHitFromAfar = hitFar;
  });
  return out;
});
await browser.close();
console.log(room, JSON.stringify(res, null, 1));
const bad = [];
if (errs.length) bad.push("errori: " + errs[0]);
for (const k of ["ally_cavaliere", "ally_warrior", "ally_picchiere", "enemy_warrior", "enemy_picchiere", "enemy_cavaliere"]) {
  const m = res[k];
  if (m.err) { bad.push(k + ": " + m.err); continue; }
  if (m.starts < 10) bad.push(`${k}: solo ${m.starts} colpi cominciati`);
  if (m.aborts > 1) bad.push(`${k}: ${m.aborts} colpi interrotti senza danno`);
  if (m.hits < m.starts - 1) bad.push(`${k}: ${m.hits} colpi arrivati su ${m.starts}`);
  if (m.far < 5) bad.push(`${k}: solo ${m.far} colpi arrivati col bersaglio scappato`);
}
if (res.order.err || !res.order.swingingAfterFlee || res.order.action !== 1 || res.order.targetHit || res.order.moved < 40) bad.push("ordine a meta' colpo: " + JSON.stringify(res.order));
if (res.dead.err || !res.dead.swingingAfterFlee || !res.dead.targetGone || res.dead.swingSteps > 2 || res.dead.otherHitFromAfar) bad.push("bersaglio morto a meta' colpo: " + JSON.stringify(res.dead));
if (bad.length) { console.log("NON VA:\n  " + bad.join("\n  ")); process.exit(1); }
console.log("ok");
