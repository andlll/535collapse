// [§9.214] Prova nel browser dello strumento montagna dell'editor: la
// cresta in tre clic, Invio, la base automatica (Invio senza punti): la
// montagna c'e', gli oggetti sotto sono tolti (l'albero e la miniera), il
// fiume che ci passava sopra gira attorno, un passo solo da annullare; un
// punto troppo vicino si rifiuta; la base disegnata a mano; con la
// simmetria diagonale la gemella specchiata; "Prova mappa": la montagna
// nel gioco, cotta nel suolo e ostacolo per i percorsi.
// I file del gioco li serve Playwright dal disco (niente server); `game/`
// deve avere assets/ e dist/ (tools 05-07, npm run build).
//
//   node game/test/browser/mountains.mjs [cartella delle foto]
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const GAME = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SHOTS = resolve(process.argv[2] || join(GAME, "..", "build", "prova_montagne"));
mkdirSync(SHOTS, { recursive: true });
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".webp": "image/webp",
                ".html": "text/html", ".css": "text/css", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".ttf": "font/ttf", ".svg": "image/svg+xml",
                ".webmanifest": "application/manifest+json", ".map": "application/json" };
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const W = 1600, H = 900;
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
await ctx.route("http://prova.local/**", (route) => {
  const p = decodeURIComponent(new URL(route.request().url()).pathname);
  try {
    route.fulfill({ body: readFileSync(join(GAME, p === "/" ? "index.html" : p)), contentType: TYPES[p.slice(p.lastIndexOf("."))] || "application/octet-stream" });
  } catch { route.fulfill({ status: 404, body: "" }); }
});
const page = await ctx.newPage();
// [§9.199] In CI (grafica emulata) un fotogramma puo' durare centinaia di
// ms: due clic, o un clic e un tasto, potevano finire nello stesso passo e
// contare come uno. Dopo ogni azione del mouse e della tastiera si aspetta
// che l'editor abbia letto l'input (window.__editor.reads) almeno una volta
// in piu' (come editor.mjs e skcustom.mjs).
const syncInput = (page) => {
  const reads = () => page.evaluate(() => { const o = window.__editor || window.__game; return o && o.ready && typeof o.reads === "number" ? o.reads : null; }).catch(() => null);
  const after = async (n0) => {
    if (n0 === null) return;
    await page.waitForFunction((n) => { const o = window.__editor || window.__game; return !o || typeof o.reads !== "number" || o.reads > n; }, n0, { timeout: 15000, polling: 10 }).catch(() => {});
  };
  for (const [obj, names] of [[page.mouse, ["move", "down", "up", "wheel", "click", "dblclick"]], [page.keyboard, ["down", "up", "press"]]]) {
    for (const m of names) {
      const orig = obj[m].bind(obj);
      obj[m] = async (...a) => { const n0 = await reads(); const r = await orig(...a); await after(n0); return r; };
    }
  }
  // il clic: il puntatore sopra, poi giu' e su, ognuno letto in un passo
  // suo (click di Playwright li manda insieme: un pulsante non vedeva il
  // puntatore arrivare)
  page.mouse.click = async (x, y, { button = "left" } = {}) => { await page.mouse.move(x, y); await page.mouse.down({ button }); await page.mouse.up({ button }); };
};
syncInput(page);
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const check = (name, ok, extra = "") => { console.log((ok ? "ok   " : "FAIL ") + name + (extra ? "  " + extra : "")); if (!ok) fails++; };
const E = (fn, arg) => page.evaluate(fn, arg);
const settle = (ms = 120) => page.waitForTimeout(ms);

await page.goto("http://prova.local/index.html?room=editor");
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
// la vista: in alto a sinistra della mappa vuota, zoom 1
await E(() => { const v = window.__editor.view; v.zoomAt(1, 0, 0); v.centre(1200, 700); });
const toScreen = ([x, y]) => E(([x, y]) => { const v = window.__editor.view; return [(x - v.x) / v.scale, (y - v.y) / v.scale]; }, [x, y]);
const clickAt = async (p, button = "left") => { const [sx, sy] = await toScreen(p); await page.mouse.click(sx, sy, { button }); await settle(); };
// sulla mappa: un albero, una miniera, un fiume che attraversa, e un albero lontano
await E(() => {
  const s = window.__editor.scene;
  s.add([{ object: "albero", x: 1150, y: 760, scale_x: 1, scale_y: 1, rotation: 0, sprite: "alb1" },
         { object: "miniera_oro", x: 1300, y: 700, scale_x: 1, scale_y: 1, rotation: 0 },
         { object: "albero", x: 400, y: 1500, scale_x: 1, scale_y: 1, rotation: 0, sprite: "alb2" }]);
  s.addFeatures("rivers", [{ pts: [[200, 750], [2700, 760]], width: 150 }]);
});
const before = await E(() => ({ n: window.__editor.scene.map.instances.length, river: JSON.stringify(window.__editor.scene.map.rivers[0].pts) }));

// lo strumento: il pulsante sotto la polilinea
const btn = await E(() => window.__editor.layout().buttons.find((b) => b.key === "mountain"));
const lineBtn = await E(() => window.__editor.layout().buttons.find((b) => b.key === "line"));
check("il pulsante della montagna sotto la polilinea", btn && lineBtn && btn.y > lineBtn.y && btn.y - lineBtn.y < 80);
await page.mouse.click(btn.x, btn.y); await settle();
check("strumento montagna", (await E(() => window.__editor.ed.tool)) === "mountain");

// passo 1: la cresta; un punto troppo vicino si rifiuta
await clickAt([950, 520]);
await settle(450); // (non un doppio clic: quello finisce la cresta)
await clickAt([965, 525]);
await settle(450);
check("il punto troppo vicino rifiutato", (await E(() => window.__editor.ed.mdraw.crest.length)) === 1);
await clickAt([1200, 440]);
await clickAt([1450, 500]);
check("tre cime", (await E(() => window.__editor.ed.mdraw.crest.length)) === 3, JSON.stringify(await E(() => [window.__editor.ed.mdraw, window.__editor.view.scale, window.__editor.view.x, window.__editor.view.y])));
await page.screenshot({ path: join(SHOTS, "ed_1_cresta.png") });
await page.keyboard.press("Enter"); await settle();
check("passo 2: la base", (await E(() => window.__editor.ed.mdraw && window.__editor.ed.mdraw.step)) === "base");
await page.screenshot({ path: join(SHOTS, "ed_2_base.png") });
await page.keyboard.press("Enter"); await settle(300);
const made = await E(() => {
  const s = window.__editor.scene, m = s.map;
  return { n: m.mountains.length, inst: m.instances.map((e) => e.object), river: m.rivers[0] ? JSON.stringify(m.rivers[0].pts) : null,
           sel: !!window.__editor.ed.msel, mdraw: window.__editor.ed.mdraw };
});
check("la montagna creata (base automatica)", made.n === 1 && !made.mdraw && made.sel);
check("albero e miniera sotto la montagna tolti", !made.inst.includes("miniera_oro") && made.inst.filter((o) => o === "albero").length === 1, made.inst.join(","));
check("il fiume gira attorno", made.river && made.river !== before.river, made.river);
// il fiume nuovo non tocca la montagna
const clear = await E(() => {
  const s = window.__editor.scene, g = s.world.mountains[0], grid = s.mountainGrid([g]), C = grid.C;
  const pts = s.map.rivers[0].pts;
  for (let k = 1; k < pts.length; k++) {
    const [a, b] = [pts[k - 1], pts[k]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4);
    for (let q = 0; q <= n; q++) { const x = a[0] + ((b[0] - a[0]) * q) / n, y = a[1] + ((b[1] - a[1]) * q) / n; if (grid.grid[Math.floor(y / C) * grid.gw + Math.floor(x / C)]) return false; }
  }
  return true;
});
check("la linea del fiume fuori dalla montagna", clear);
await E(() => window.__editor.view.centre(1250, 800)); await settle(400);
await page.screenshot({ path: join(SHOTS, "ed_3_montagna.png") });
// un passo solo da annullare
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await settle(300);
const undone = await E(() => { const m = window.__editor.scene.map; return { n: m.mountains.length, inst: m.instances.length, river: JSON.stringify(m.rivers[0].pts) }; });
check("Ctrl+Z: via la montagna, tornano oggetti e fiume", undone.n === 0 && undone.inst === before.n && undone.river === before.river);
await page.keyboard.down("Control"); await page.keyboard.press("KeyY"); await page.keyboard.up("Control"); await settle(300);
check("Ctrl+Y: di nuovo", (await E(() => window.__editor.scene.map.mountains.length)) === 1);

// i parametri della montagna scelta: "+" dell'altezza
await E(() => { window.__editor.ed.msel = { e: window.__editor.scene.map.mountains[0] }; });
const h0 = await E(() => window.__editor.scene.map.mountains[0].height);
const ML = await E(() => window.__editor.mountainLayout());
// [§9.237] lo slider: un clic sul passo dopo quello dell'altezza
const HS = [80, 120, 160, 200, 260, 320, 400, 480], slAt = (G, n, i) => [G.track[0] + ((G.track[1] - G.track[0]) * i) / (n - 1), G.track[2]];
const hUp = slAt(ML.height, HS.length, Math.min(HS.length - 1, HS.reduce((b, v, k) => (Math.abs(v - h0) < Math.abs(HS[b] - h0) ? k : b), 0) + 1));
await page.mouse.move(...hUp); await settle();
await page.mouse.click(...hUp); await settle(300);
check("+ dell'altezza sulla montagna scelta", (await E(() => window.__editor.scene.map.mountains[0].height)) > h0);

// [§9.215] una cima sola: clic sulla cima (scelta), + la alza; il piede resta
const pk0 = await E(() => { const s = window.__editor.scene, e = s.map.mountains[0], g = s.world.mountains[0]; return { top: g.tops[1], foot: g.feet.filter((_, i) => true), crest: e.crest[1].slice() }; });
await clickAt([pk0.top.x, pk0.top.y]);
check("clic su una cima: scelta", (await E(() => window.__editor.ed.msel && window.__editor.ed.msel.peak)) === 1);
await page.keyboard.press("Equal"); await settle(300);
const pk1 = await E(() => { const s = window.__editor.scene, e = s.map.mountains[0], g = s.world.mountains[0]; return { peaks: e.peaks, top: g.tops[1], crest: e.crest[1].slice(), feet: g.feet }; });
check("+: la cima piu' alta", pk1.peaks && pk1.peaks[1] > 1 && pk1.peaks[0] === 1 && pk1.top.y < pk0.top.y - 20, JSON.stringify([pk1.peaks, pk0.top.y, pk1.top.y]));
const footOf = (g, top) => g.feet.reduce((b, f) => (Math.abs(f[0] - top.x) < Math.abs(b[0] - top.x) ? f : b));
check("il piede della cima non si muove", Math.abs(footOf(pk1, pk1.top)[1] - (pk0.top.y + pk0.top.h)) < 2, JSON.stringify([footOf(pk1, pk1.top), pk0.top]));
const ML2 = await E(() => window.__editor.mountainLayout());
await page.mouse.click(...slAt(ML2.height, 13, 7)); await settle(300); // (PEAK_STEPS: 1,15 -> 1)
check("- di \"Altezza cima\": torna com'era", (await E(() => window.__editor.scene.map.mountains[0].peaks)) === undefined);
await page.keyboard.press("Escape"); await settle();
check("Esc: di nuovo tutta la montagna", (await E(() => { const m = window.__editor.ed.msel; return !!m && (m.peak === undefined || m.peak === null); })));

// una seconda montagna che tocca la prima: rifiutata
await E(() => { window.__editor.ed.msel = null; });
await clickAt([1500, 560]);
await clickAt([1700, 520]);
await page.keyboard.press("Enter"); await settle(); await page.keyboard.press("Enter"); await settle(300);
check("una montagna che ne tocca un'altra: rifiutata", (await E(() => window.__editor.scene.map.mountains.length)) === 1);
await page.keyboard.press("Escape"); await settle();

// la base disegnata a mano, con la simmetria diagonale: la gemella
await E(() => { window.__editor.ed.sym.mountain = "diagonal"; window.__editor.ed.msel = null; window.__editor.view.centre(1200, 2200); });
await settle(200);
await clickAt([1000, 1900]);
await clickAt([1300, 1850]);
await page.keyboard.press("Enter"); await settle();
for (const p of [[820, 2050], [1100, 1980], [1450, 2000], [1500, 2250], [1150, 2330], [850, 2260]]) await clickAt(p);
await page.screenshot({ path: join(SHOTS, "ed_4_base_a_mano.png") });
await page.keyboard.press("Enter"); await settle(400);
const sym = await E(() => window.__editor.scene.map.mountains.map((m) => ({ base: !!m.base, sym: m.sym || null, mirrored: !!m.mirrored })));
check("base a mano e gemella diagonale", sym.length === 3 && sym[1].base && sym[1].sym === "diagonal" && sym[2].mirrored, JSON.stringify(sym));
const mir = await E(() => {
  const s = window.__editor.scene, W = s.map.width, H = s.map.height, [a, b] = s.world.mountains.slice(1);
  // la base della gemella e' lo specchio dell'altra (punto per punto, a meno dell'ordine)
  const key = (p) => Math.round(p[0]) + "," + Math.round(p[1]);
  const A = new Set(a.base.map((p) => key([W - p[0], H - p[1]])));
  return b.base.filter((p) => A.has(key(p))).length / b.base.length;
});
check("la base della gemella e' lo specchio", mir > 0.99, String(mir));
await page.screenshot({ path: join(SHOTS, "ed_5_simmetria.png") });
// Canc: via la scelta e la gemella
await E(() => { window.__editor.ed.msel = { e: window.__editor.scene.map.mountains[1] }; });
await page.keyboard.press("Delete"); await settle(200);
check("Canc toglie anche la gemella", (await E(() => window.__editor.scene.map.mountains.length)) === 1);
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await settle(300);

// "Prova mappa": le montagne nel gioco (servono le partenze)
await E(() => {
  const s = window.__editor.scene;
  s.add([{ object: "centro", x: 600, y: 3600, side: "red", scale_x: 1, scale_y: 1, rotation: 0 },
         { object: "centro", x: 5400, y: 3600, side: "blue", scale_x: 1, scale_y: 1, rotation: 0 }]);
});
// (senza nebbia di guerra, di giorno: la foto della montagna nel gioco)
await E(() => localStorage.setItem("535.skirmish", JSON.stringify({ fog: "none", daynight: "day", rain: "off", start: "A" })));
await E(() => { window.__editor.testMap(); }).catch(() => {});
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 }).catch(() => {});
const game = await E(() => {
  const G = window.__game;
  if (!G) return null;
  const w = G.world, g = w.mountains && w.mountains[0];
  if (!g) return { n: 0 };
  // il punto in mezzo alla prima montagna: ostacolo per le unita' e i percorsi
  const t = g.tops[0], x = t.x, y = t.y + 40;
  const cell = G.path.gw ? G.path.solid[Math.floor(y / 32) * G.path.gw + Math.floor(x / 32)] : null;
  return { n: w.mountains.length, terrain: !!w.terrainBlocks, shot: w.shotClear(x - 300, y + 10, x + 300, y + 10), solid: cell };
});
check("nel gioco: le montagne, ostacolo e riparo dalle frecce", game && game.n === 3 && game.terrain && game.shot === false, JSON.stringify(game));
if (game) {
  await E(() => { const G = window.__game, t = G.world.mountains[0].tops[0]; G.cam.x = t.x - G.cam.w / 2; G.cam.y = t.y - 200; });
  await settle(1500);
  await page.screenshot({ path: join(SHOTS, "gioco_montagna.png") });
}
check("nessun errore nella pagina", !errs.length, errs.join(" | "));
await browser.close();
console.log(fails ? `${fails} prove fallite` : "tutto bene");
process.exit(fails ? 1 : 0);
