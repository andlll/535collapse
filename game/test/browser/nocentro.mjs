// [§9.232, richiesta dell'autore] Prova nel browser: una partita su una mappa
// dell'editor con le sole bandierine (la vista iniziale) e qualche unita',
// senza centri citta':
//   vista      = la vista parte sulla bandierina rossa; nessun centro nel
//                mondo (le bandierine non lo fanno nascere)
//   partita    = 600 passi senza errori, senza vittoria ne' sconfitta (la
//                CPU non ha edifici, ma ha unita')
//   conquista  = le unita' della CPU tutte morte: vittoria
//   misure     = [§9.233] la mappa e' 4321 x 5003 (misure qualsiasi): la
//                room del gioco e' di quelle misure, la vista ci resta dentro
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/nocentro.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const res = {};
let ok = true;
const check = (name, v) => { res[name] = v; if (!v) ok = false; };
const ready = () => page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });

await page.goto(`${base}/index.html?room=menu`);
await ready();
await page.evaluate(async () => {
  const ms = await import("/src/mapstore.js"), mf = await import("/src/mapfile.js"), su = await import("/src/skuser.js"), sk = await import("/src/skirmish.js");
  const I = (object, x, y, more = {}) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, ...more });
  // ([§9.233] di misure qualsiasi: 4321 x 5003)
  const map = { ...mf.newMap({ name: "Senza centri", width: 4321, height: 5003 }),
                instances: [I("centro", 1500, 1500, { side: "red" }), I("centro", 3600, 4200, { side: "blue" }),
                            I("ally_warrior", 1500, 1700, { side: "red" }), I("ally_omino", 1600, 1700, { side: "red" }),
                            I("ally_warrior", 3600, 4400, { side: "blue" }), I("ally_warrior", 3700, 4400, { side: "blue" })] };
  const v = mf.validateMap(map, (await import("/src/editmap.js")).allowedObjects(), await (await fetch("assets/objects.json")).json());
  if (v.errors) throw new Error(v.errors.join(", "));
  const opts = { ...sk.loadSkirmish(), victory: "townhall", fog: "none", truce: 0 };
  await ms.putService(su.PLAY, { room: mf.testRoom(v.map), sk: su.skForMap(opts, v.map), name: v.map.name });
});
await Promise.all([page.waitForNavigation({ timeout: 60000 }), page.evaluate(() => { location.search = "?room=custom&play=1&seed=4"; })]);
await ready();
const got = await page.evaluate(() => {
  const G = window.__game, w = G.world, cam = G.cam || w.cam;
  return { centri: [...w.all("centro")].length + [...w.all("enemy_centro")].length, view: cam && [cam.x + cam.w / 2, cam.y + cam.h / 2],
           victory: G.g.sk && G.g.sk.victory, cpu: [...w.all("enemy_unit")].length, room: [w.roomW, w.roomH] };
});
res.partita = got;
check("nessun centro nel mondo", got.centri === 0);
check("la vista sulla bandierina rossa", got.view && Math.abs(got.view[0] - 1500) < 5 && Math.abs(got.view[1] - 1500) < 5);
check("la room di 4321 x 5003", got.room[0] === 4321 && got.room[1] === 5003);
check("senza municipi la vittoria Municipio diventa Conquista", got.victory === "conquest");
await page.evaluate(() => { const c = window.__game.cam; c.x = 99999; c.y = 99999; c.clamp(); });
const edge = await page.evaluate(() => { const c = window.__game.cam; return [c.x + c.w, c.y + c.h]; });
check("la vista in fondo resta nella mappa", Math.abs(edge[0] - 4321) < 2 && Math.abs(edge[1] - 5003) < 2);
res.bordo = edge;
await page.evaluate(() => window.__game.advance(600));
const mid = await page.evaluate(() => [window.__game.g.victory || 0, window.__game.g.gameover || 0]);
check("600 passi: si gioca ancora", mid[0] === 0 && mid[1] === 0);
await page.evaluate(() => { for (const u of [...window.__game.world.all("enemy_unit")]) u.life = 0; });
await page.evaluate(() => window.__game.advance(120));
const end = await page.evaluate(() => [window.__game.g.victory || 0, window.__game.g.gameover || 0]);
check("le unita' della CPU morte: vittoria", end[0] === 1 && end[1] === 0);
res.fine = [mid, end];
if (errs.length) { ok = false; res.errori = errs.slice(0, 5); }
console.log(JSON.stringify(res));
await browser.close();
if (!ok) { console.log("NON VA"); process.exit(1); }
console.log("ok");
