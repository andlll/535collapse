// Prova nel browser degli edifici nemici nuovi (§9.43: enemy_centro,
// enemy_chiesa, enemy_castello, enemy_magazzino, enemy_mulino), uno alla
// volta nella zona piu' aperta del match:
//   visto   = nascosto finche' un alleato non e' vicino, poi visibile
//   frecce  = centro e castello tirano a un guerriero alleato a 350 px
//             (gli altri no)
//   cura    = la chiesa cura un guerriero nemico ferito a 300 px
//   fuoco   = una freccia incendiaria lo accende solo se e' di legno
//             (centro, magazzino, mulino), con fiamme visibili
//   pale    = il mulino cambia fotogramma
//   rovina  = a vita zero lascia la sua rovina
// Disegna anche una schermata con la scheda dell'edificio selezionato (se
// SHOT=file). Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/enemybuildings.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const KINDS = {
  enemy_centro: { arrows: true, wooden: true, ruin: "ccruin" },
  enemy_chiesa: { heal: true, ruin: "chiesaruin" },
  enemy_castello: { arrows: true, ruin: "castelloruin" },
  enemy_magazzino: { wooden: true, ruin: "magruin" },
  enemy_mulino: { wooden: true, ruin: "barnruin", spin: true },
};
const res = await page.evaluate((KINDS) => {
  const G = window.__game, w = G.world, p = w.path;
  G.advance(2);
  for (const n of ["enemy_manager"]) for (const e of [...w.all(n)]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0 });
  G.manager.al.set(4, -1); G.manager.stopRain();
  const clear = () => {
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
    for (const b of [...w.all("fire_bullet"), ...w.all("b_arciere_bullet_t")]) w.destroy(b);
  };
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
  const out = {};
  for (const [kind, K] of Object.entries(KINDS)) {
    clear();
    const r = out[kind] = {};
    const b = w.create(kind, CX, CY);
    G.advance(5);
    r.hidden = b.visible === false;
    // un guerriero alleato immortale a 350 px: lo vede, e centro e castello tirano
    const a = w.create("ally_warrior", CX + 350, CY + 60);
    let shots = 0;
    const seen = new Set();
    for (let s = 0; s < 300; s++) {
      a.life = a.slife; w.setPos(a, CX + 350, CY + 60); a.action = 0;
      G.advance(1);
      for (const f of w.all("b_arciere_bullet_t")) if (!seen.has(f)) { seen.add(f); shots++; }
    }
    r.visto = b.visible === true;
    r.frecce = shots;
    w.destroy(a);
    // un guerriero nemico ferito a 300 px
    const e = w.create("enemy_warrior", CX - 300, CY + 80);
    G.advance(2);
    e.life = 20;
    for (let s = 0; s < 400; s++) { w.setPos(e, CX - 300, CY + 80); e.action = 0; G.advance(1); }
    r.cura = e.life > 20;
    w.destroy(e);
    // fuoco: una freccia incendiaria dritta sull'edificio
    const f = w.create("fire_bullet", CX + 200, CY - 67);
    f.direction = Math.atan2(-(CY - (CY - 67)), CX - (CX + 200)) * 180 / Math.PI; f.speed = 8;
    for (let s = 0; s < 60; s++) G.advance(1);
    r.fuoco = b.onfire === 1;
    r.fiamme = b.fire_part ? Math.round(b.fire_part.life[0]) : null;
    // pale del mulino
    const i0 = b.image_index;
    G.advance(15);
    r.pale = b.image_index !== i0;
    // rovina
    b.life = 0;
    G.advance(2);
    r.rovina = !b.alive && w.number(K.ruin) > 0;
    for (const x of [...w.all(K.ruin)]) w.destroy(x);
  }
  return out;
}, KINDS);
let ok = errs.length === 0;
for (const [kind, K] of Object.entries(KINDS)) {
  const r = res[kind];
  const bad = [];
  if (!r.hidden || !r.visto) bad.push("visibilita'");
  if (!!K.arrows !== r.frecce > 0) bad.push("frecce " + r.frecce);
  if (!!K.heal !== r.cura) bad.push("cura");
  if (!!K.wooden !== r.fuoco) bad.push("fuoco");
  if (K.wooden && !(r.fiamme >= 10)) bad.push("fiamme " + r.fiamme);
  if (!!K.spin !== r.pale) bad.push("pale");
  if (!r.rovina) bad.push("rovina");
  if (bad.length) ok = false;
  console.log(kind.padEnd(16), JSON.stringify(r), bad.length ? "NON VA: " + bad.join(", ") : "ok");
}
if (process.env.SHOT) {
  await page.evaluate(() => {
    const G = window.__game, w = G.world, cam = G.cam;
    const x0 = cam.x + cam.w / 2 - 900, y0 = cam.y + cam.h / 2;
    ["enemy_centro", "enemy_chiesa", "enemy_castello", "enemy_magazzino", "enemy_mulino"].forEach((n, k) => {
      const b = w.create(n, x0 + k * 420, y0 + (k % 2) * 60); b.visible = true; if (k === 0) b.selected = 1;
    });
    G.g.fogville = 0;
    cam.setScale(1.6); G.g.scaleview = cam.scaleview; cam.x = x0 + 840 - cam.w / 2; cam.y = y0 - cam.h / 2 - 40;
    G.advance(2); G.loop.render();
  });
  await page.screenshot({ path: process.env.SHOT });
}
if (errs.length) console.log(errs);
await browser.close();
process.exit(ok ? 0 : 1);
