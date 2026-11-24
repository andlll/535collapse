// [§9.203] Prova nel browser: nella partita su una mappa dell'editor (la
// schermaglia, &play=1, come skuser.js) arrivano gli stili scelti
// nell'editor e i municipi in piu':
//   stili      = la casa rossa c1s (non fra le scelte a caso del gioco), la
//                blu della CPU c5b, l'albero alb6 (col suo tipo: l'albero che
//                muore lo usa); l'albero finto con alb1_F (la F dell'editor)
//                resta uno degli otto alberi del gioco
//   municipi   = due centri rossi (partenza e municipio) e due blu: il
//                municipio rosso piu' in alto a sinistra della partenza non
//                la sostituisce (skirmishPrepare); 600 passi con la CPU che
//                ha due centri, senza errori
//   municipio  = vittoria "Municipio": perso il municipio in piu' non si
//                perde, persi tutti e due si'
//   nebbia     = [§9.205] il banco di nebbia (nebbia_banco) va avanti e
//                indietro e dentro un nemico vede meno (enemies.js
//                fogSight), fuori no; la nebbia estetica (sk_nebbia) fa
//                nascere le sue nuvole. [§9.206] Con le impostazioni
//                dell'editor: il banco a densita' 0,5 (il nemico vede a tre
//                quarti) e veloce; la estetica con 8 nuvole verso sinistra
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/edstyles.mjs
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
  const map = { ...mf.newMap({ name: "Stili" }),
                instances: [I("centro", 1500, 1500, { side: "red" }), I("centro", 4500, 4500, { side: "blue" }),
                            I("centro", 700, 700, { side: "red", hall: true }), I("centro", 5300, 900, { side: "blue", hall: true }),
                            I("casa", 1900, 1500, { side: "red", sprite: "c1s" }), I("casa", 4100, 4500, { side: "blue", sprite: "c5s" }),
                            I("albero", 3000, 3000, { sprite: "alb6" }), I("albero_fake", 3300, 3000, { sprite: "alb1_F" }),
                            I("nebbia_banco", 3000, 4000, { fog: { density: 0.5, speed: 2 } }), I("sk_nebbia", 2000, 4300, { fog: { count: 8, speed: -1 } })] };
  const v = mf.validateMap(map, (await import("/src/editmap.js")).allowedObjects(), await (await fetch("assets/objects.json")).json());
  if (v.errors) throw new Error(v.errors.join(", "));
  const opts = { ...sk.loadSkirmish(), victory: "townhall", fog: "none", truce: 0 };
  await ms.putService(su.PLAY, { room: mf.testRoom(v.map), sk: su.skForMap(opts, v.map), name: v.map.name });
});
await Promise.all([page.waitForNavigation({ timeout: 60000 }), page.evaluate(() => { location.search = "?room=custom&play=1&seed=4"; })]);
await ready();
const got = await page.evaluate(() => {
  const w = window.__game.world, at = (o, x, y) => [...w.all(o)].find((i) => Math.abs(i.x - x) < 2 && Math.abs(i.y - y) < 2);
  const pos = (o) => [...w.all(o)].map((i) => [i.x, i.y]).sort((a, b) => a[0] - b[0]);
  const t = at("albero", 3000, 3000), f = at("albero_fake", 3300, 3000);
  return { red: at("casa", 1900, 1500)?.sprite_index, blue: at("enemy_house", 4100, 4500)?.sprite_index,
           tree: t && [t.sprite_index, t.type], fake: f && f.sprite_index,
           centri: pos("centro"), cpu: pos("enemy_centro"), sk: window.__game.g.sk && window.__game.g.sk.victory };
});
res.partita = got;
// [§9.205] la nebbia
const fog = await page.evaluate(async () => {
  const { fogSight } = await import("/src/enemies.js");
  const w = window.__game.world, b = [...w.all("nebbia_banco")][0], x0 = b && b.x;
  const cx = () => [...w.all("sk_nube")].reduce((t, c) => t + c.x, 0);
  const c0 = cx();
  window.__game.advance(120);
  const inside = { x: b.x + 50, y: b.y + 30 }, outside = { x: b.x, y: b.y + 400 };
  return { bank: !!b, moved: b && Math.abs(b.x - x0) > 200, clouds: [...w.all("sk_nube")].length, left: cx() < c0 - 100,
           inside: fogSight(w, inside), outside: fogSight(w, outside) };
});
res.nebbia = fog;
check("il banco di nebbia va avanti e indietro (veloce: 2 px a passo)", fog.bank && fog.moved);
check("nel banco a densita' 0,5 il nemico vede a tre quarti, fuori tutto", fog.inside === 0.75 && fog.outside === 1);
check("la nebbia estetica: 8 nuvole, verso sinistra", fog.clouds === 8 && fog.left);
await page.evaluate(() => window.__game.advance(600));
check("la casa rossa c1s, la blu c5b", got.red === "c1s" && got.blue === "c5b");
check("l'albero alb6 col tipo 6", got.tree && got.tree[0] === "alb6" && got.tree[1] === 6);
check("l'albero finto: uno degli otto, non alb1_F", /^alb[1-8]$/.test(got.fake || ""));
check("due centri per parte (partenza e municipio)", JSON.stringify(got.centri) === "[[700,700],[1500,1500]]" && JSON.stringify(got.cpu) === "[[4500,4500],[5300,900]]");
check("vittoria: municipio", got.sk === "townhall");
// il municipio in piu' distrutto: non si perde; poi la partenza: si'
const lose = async (x, y) => {
  await page.evaluate(([x, y]) => { const w = window.__game.world, c = [...w.all("centro")].find((i) => i.x === x && i.y === y); c.life = 0; }, [x, y]);
  await page.evaluate(() => window.__game.advance(30));
  return page.evaluate(() => [window.__game.g.gameover || 0, [...window.__game.world.all("centro")].length]);
};
const g1 = await lose(700, 700);
check("perso il municipio in piu': si gioca ancora", g1[0] === 0 && g1[1] === 1);
const g2 = await lose(1500, 1500);
check("persa anche la partenza: sconfitta", g2[0] === 1);
res.fine = [g1, g2];
if (errs.length) { ok = false; res.errori = errs.slice(0, 5); }
console.log(JSON.stringify(res));
await browser.close();
if (!ok) { console.log("NON VA"); process.exit(1); }
console.log("ok");
