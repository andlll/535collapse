// Prova nel browser degli allarmi d'attacco sulla minimappa (§9.108), nel
// match:
//   battaglia  un guerriero nemico attacca un soldato del giocatore fuori
//              dalla view: una zona "battle" con gli anelli; per 40 s di
//              mischia resta una sola zona (prima, con atk_signal, un segnale
//              nuovo ogni 1,25 s)
//   suggerimento  la prima volta hint_allarme, una volta sola
//   vista      una mischia nella view: la zona nasce senza anelli
//   fuoco      una casa del giocatore in fiamme fuori dalla view: zona "fire"
//   J          porta la view sulla zona piu' recente, poi sulla precedente
//   fine       30 s senza colpi: la zona sfuma e sparisce
//   chiusa     con la minimappa chiusa il suo pulsante lampeggia di rosso
//   salvataggio  le zone tornano uguali dopo un caricamento
// Con FOTO=cartella salva le foto della minimappa (anelli, icone).
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/alarms.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const FOTO = process.env.FOTO;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const shot = async (name) => {
  if (!FOTO) return;
  await page.evaluate(() => window.__game.loop.render());
  const H = 720;
  await page.screenshot({ path: `${FOTO}/${name}.png`, clip: { x: 0, y: H - 260, width: 360, height: 260 } });
};
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, cam = G.cam, out = {};
  window.__run = (n) => { for (let k = 0; k < n; k++) { G.advance(1); } };
  const run = window.__run;
  run(200);
  for (const d of [...w.all("parent_hint")]) w.destroy(d);
  g.hint = 1;
  cam.x = 0; cam.y = 0; cam.clamp();
  // battaglia fuori dalla view, in basso a destra della mappa
  const X = w.roomW - 900, Y = w.roomH - 900;
  const a = w.create("ally_warrior", X, Y), e = w.create("enemy_warrior", X + 60, Y);
  window.__ab = [a, e];
  run(2);
  out.zone0 = (g.alarms && g.alarms.zones.length) || 0;
  let maxZones = 0, first = null;
  for (let k = 0; k < 40 * 60; k++) {
    a.life = Math.max(a.life, 20); e.life = Math.max(e.life, 20); // nessuno muore
    run(1);
    const zs = g.alarms.zones.filter((z) => z.kind === "battle");
    maxZones = Math.max(maxZones, zs.length);
    if (!first && zs.length) first = { ring: zs[0].ring, at: k };
  }
  out.battaglia = { zone: maxZones, anelli: first && first.ring, dopo: first && first.at, ok: maxZones === 1 && !!first && first.ring };
  out.suggerimento = { creato: w.number("hint_allarme"), flag: g.alarmhint };
  return out;
});
// foto: gli anelli appena nati (una battaglia nuova altrove) e l'icona
await page.evaluate(() => {
  const G = window.__game, w = G.world;
  for (const d of [...w.all("parent_hint")]) w.destroy(d);
  const X = 900, Y = w.roomH - 700;
  const a = w.create("ally_picchiere", X, Y), e = w.create("enemy_warrior", X + 50, Y);
  window.__ab2 = [a, e];
  for (let k = 0; k < 200 && !(G.g.alarms.zones.some((z) => z.x < 2000)); k++) { a.life = Math.max(a.life, 20); window.__run(1); }
  window.__run(8);
});
await shot("1_anelli");
await page.evaluate(() => { const [a] = window.__ab2; for (let k = 0; k < 40; k++) { a.life = Math.max(a.life, 20); window.__run(1); } });
await shot("2_anelli");
await page.evaluate(() => { const [a] = window.__ab2; for (let k = 0; k < 200; k++) { a.life = Math.max(a.life, 20); window.__run(1); } });
await shot("3_icona");
const res2 = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, cam = G.cam, out = {}, run = window.__run;
  const keep = () => { for (const u of [...window.__ab, ...window.__ab2]) if (u.alive) u.life = Math.max(u.life, 20); };
  // nella view: senza anelli
  cam.x = 1500; cam.y = 1500; cam.clamp();
  const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2;
  const a = w.create("ally_arciere", cx, cy), e = w.create("enemy_warrior", cx + 50, cy);
  let z = null;
  for (let k = 0; k < 300 && !z; k++) { keep(); a.life = Math.max(a.life, 20); run(1); z = g.alarms.zones.find((q) => Math.hypot(q.x - cx, q.y - cy) < 300); }
  out.vista = { zona: !!z, anelli: z && z.ring, ok: !!z && z.ring === false };
  w.destroy(e);
  // fuoco: una casa del giocatore fuori dalla view
  cam.x = 0; cam.y = 0; cam.clamp();
  const h = w.create("casa", w.roomW - 700, 700);
  run(3);
  h.onfire = 1;
  let f = null;
  for (let k = 0; k < 600 && !f; k++) { keep(); run(1); f = g.alarms.zones.find((q) => q.kind === "fire"); }
  out.fuoco = { zona: !!f, anelli: f && f.ring, ok: !!f && f.ring === true };
  window.__fire = h;
  window.__zs = [...g.alarms.zones].filter((q) => !q.ending).sort((p, q) => q.t0 - p.t0).map((q) => [q.x, q.y]);
  return out;
});
// J (un tasto vero): la zona piu' recente, poi la precedente
const centre = () => page.evaluate(() => { const c = window.__game.cam; window.__run(1); return [c.x + c.w / 2, c.y + c.h / 2, c.w, c.h]; });
await page.keyboard.press("j"); const j1 = await centre();
await page.keyboard.press("j"); const j2 = await centre();
const zs = await page.evaluate(() => window.__zs);
const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.max(p[2], p[3]) / 2;
res2.J = { zone: zs.length, prima: near(j1, zs[0]), seconda: zs.length > 1 && near(j2, zs[1]) };
res2.J.ok = res2.J.prima && res2.J.seconda;
// chiusa: il pulsante lampeggia
await page.evaluate(() => { window.__game.g.minim = 0; });
res2.chiusa = { ok: true };
await shot("4_chiusa");
const res3 = await page.evaluate(() => {
  const G = window.__game, w = G.world, g = G.g, out = {}, run = window.__run;
  g.minim = 1;
  // fine: tutto fermo (via i nemici, la casa spenta)
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  window.__fire.onfire = 0;
  const n0 = g.alarms.zones.length;
  run(31 * 60);
  const mid = g.alarms.zones.filter((z) => z.ending).length;
  run(70);
  out.fine = { prima: n0, sfumano: mid, dopo: g.alarms.zones.length, ok: n0 > 0 && g.alarms.zones.length === 0 };
  return out;
});
// salvataggio: una zona viva, salvata e ricaricata
const saved = await page.evaluate(async () => {
  const G = window.__game, w = G.world, g = G.g, run = window.__run;
  const a = w.create("ally_warrior", w.roomW - 900, 900), e = w.create("enemy_warrior", w.roomW - 850, 900);
  for (let k = 0; k < 300 && !g.alarms.zones.length; k++) { a.life = Math.max(a.life, 20); run(1); }
  await window.__pause.actions.saveGame();
  return JSON.stringify(g.alarms);
});
await page.goto(`${base}/index.html?room=match&load=slot&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const after = await page.evaluate(() => JSON.stringify(window.__game.g.alarms));
const out = { ...res, ...res2, ...res3, salvataggio: { ok: saved === after && JSON.parse(after).zones.length > 0 } };
out.suggerimento.ok = out.suggerimento.creato === 1 && out.suggerimento.flag === 1;
let ok = errs.length === 0;
for (const [k, v] of Object.entries(out)) { if (typeof v !== "object") continue; console.log(k.padEnd(13), JSON.stringify(v), v.ok ? "" : "NON VA"); ok = ok && v.ok; }
if (errs.length) console.log(errs.slice(0, 5));
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
