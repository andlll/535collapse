// Prova nel browser degli stadi di danno degli edifici di pietra disegnati
// dall'autore (§9.85), nel match: torre, fortezza e monastero nemici, mura e
// porte del giocatore e nemiche. Per ognuno, vita al 60%, al 20% e di nuovo
// piena: lo sprite e' <base>_r1, <base>_r2 e <base> (e lo sprite c'e'
// nell'atlas), la maschera non cambia. Le porte, da danneggiate, si aprono e
// si chiudono restando danneggiate (<aperta>_r1, <chiusa>_r1).
// SHOTS=cartella: una foto dei tre stadi.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/damage.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
await page.addStyleTag({ content: "#message{display:none !important}" });
const CASES = [
  ["enemy_torre", "torre_b"], ["enemy_castello", "castello_b"], ["enemy_chiesa", "chiesa_b"],
  ["mura_ori", "m_ori"], ["mura_vert", "m_vert"], ["enemy_mura_ori", "m_ori_b"], ["enemy_mura_vert", "m_vert_b"],
  ["porta_ori", "m_ori_p"], ["porta_vert", "m_vert_p"], ["enemy_porta_ori", "m_ori_p_b"], ["enemy_porta_vert", "m_vert_p_b"],
];
const prep = await page.evaluate((CASES) => {
  const G = window.__game, w = G.world, p = w.path, cam = G.cam;
  G.advance(3);
  for (const d of [...w.all("parent_hint")]) w.destroy(d);
  for (const e of [...w.all("enemy")]) w.destroy(e);
  for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, fogville: 0, night: 0 });
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -24; dy <= 24; dy += 2) for (let dx = -36; dx <= 36; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  return [best.gx * 32 + 16, best.gy * 32 + 16];
}, CASES);
const res = {};
for (const [obj, spr] of CASES) {
  res[obj] = await page.evaluate(([obj, spr, X, Y]) => {
    const G = window.__game, w = G.world, A = G.assets;
    // (gli arcieri usciti dal presidio della torre e della fortezza a 1/5
    // della vita aprirebbero le porte nemiche)
    for (const u of [...w.all("enemy_unit"), ...w.all("ally_unit")]) { w.path.free(u); w.destroy(u); }
    const i = w.create(obj, X, Y);
    i.visible = true;
    G.advance(5);
    const gate = /porta/.test(obj);
    const mask0 = i.mask_index;
    const seen = [];
    const atLife = (f) => { i.life = Math.round(i.slife * f); G.advance(gate && obj === "porta_vert" ? 35 : 12); seen.push(i.sprite_index); };
    atLife(0.6); atLife(0.2); atLife(1);
    const want = [spr + "_r1", spr + "_r2", spr];
    const r = { sprite: seen, atlas: want.every((n) => !!A.frame(n, 0)), maschera: i.mask_index === mask0 };
    r.ok = JSON.stringify(seen) === JSON.stringify(want) && r.atlas && r.maschera;
    if (gate) {
      // danneggiata, aperta e chiusa: resta danneggiata
      i.life = Math.round(i.slife * 0.6);
      const enemy = obj.startsWith("enemy");
      const u = w.create(enemy ? "enemy_warrior" : "ally_warrior", X, Y + 40);
      let opened = null;
      for (let k = 0; k < 60; k++) { G.advance(1); w.setPos(u, i.x, i.y + 20); if (i.open === 1) opened = i.sprite_index; }
      w.destroy(u);
      G.advance(enemy ? 15 : 35);
      r.aperta = opened; r.chiusa = i.sprite_index;
      r.ok = r.ok && opened && opened.endsWith("_r1") && i.sprite_index === spr + "_r1";
    }
    w.destroy(i);
    G.advance(2);
    return r;
  }, [obj, spr, ...prep]);
}
if (process.env.SHOTS) {
  // foto: torre, fortezza, monastero e un muro nemici nei tre stadi
  await page.evaluate(([X, Y]) => {
    const G = window.__game, w = G.world, cam = G.cam;
    cam.setScale(1.7); cam.x = X - 700; cam.y = Y - 700; cam.clamp();
    const rows = [["enemy_torre", 0], ["enemy_chiesa", 280], ["enemy_castello", 640], ["enemy_mura_ori", 1050]];
    for (const [o, dy] of rows) [1, 0.6, 0.2].forEach((f, k) => {
      const i = w.create(o, cam.x + 300 + k * 650, cam.y + 300 + dy); i.visible = true; i.life = Math.round(i.slife * f);
    });
    G.advance(60);
    G.loop.render();
  }, prep);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${process.env.SHOTS}/danni.png` });
}
let ok = errs.length === 0;
for (const [k, v] of Object.entries(res)) { console.log(k.padEnd(17), JSON.stringify(v), v.ok ? "" : "NON VA"); ok = ok && v.ok; }
if (errs.length) console.log("errori:", errs.slice(0, 2).join(" "));
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
