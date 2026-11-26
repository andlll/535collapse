// [§9.216] Prova nel browser delle chiazze d'erba del pennello: la scheda
// "Erba", le densita' delle particelle (piu' papaveri), una pennellata: la
// chiazza con le sue particelle; niente erba sull'acqua di un fiume; il
// destro la cancella, Ctrl+Z la rimette; una montagna sopra: l'erba
// rinasce solo fuori; [§9.217] un fiume sopra una macchia di "Natura" la
// taglia; "Prova mappa": l'erba nel gioco, la macchia tagliata.
// I file del gioco li serve Playwright dal disco (niente server).
//
//   node game/test/browser/meadows.mjs [cartella delle foto]
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
// un fiume in mezzo alla zona che si dipinge
await E(() => window.__editor.scene.addFeatures("rivers", [{ pts: [[400, 1100], [2400, 1100]], width: 150 }]));
const B = await E(() => window.__editor.brushLayout());
const brush = await E(() => window.__editor.layout().buttons.find((b) => b.key === "brush"));
await page.mouse.click(brush.x, brush.y); await settle();
await page.waitForFunction(() => window.__editor.catalog() === "ready", null, { timeout: 60000 });
const tab = B.tabs.find((q) => q.kind === "grass");
await page.mouse.click((tab.x1 + tab.x2) / 2, (tab.y1 + tab.y2) / 2); await settle();
check("la scheda Erba", (await E(() => window.__editor.ed.brush.kind)) === "grass");
const ML = await E(() => window.__editor.meadowLayout());
const poppy = ML.groups.find((g) => g.key === "poppy");
for (let k = 0; k < 4; k++) { await page.mouse.move(poppy.plus[0], poppy.plus[1]); await settle(60); await page.mouse.click(poppy.plus[0], poppy.plus[1]); await settle(); }
check("piu' papaveri", (await E(() => window.__editor.ed.brush.mix.poppy)) === 4);
// [§9.218] le icone: i ciuffi ondeggiano (due foto del riquadro diverse), il nome col puntatore sopra
await page.mouse.move((poppy.tip[0] + poppy.tip[2]) / 2, (poppy.tip[1] + poppy.tip[3]) / 2); await settle(200);
check("il nome della particella col puntatore sopra", (await E(() => window.__editor.ed.mixTip)) === "poppy");
const clip = { x: ML.box[0], y: ML.box[1], width: ML.box[2] - ML.box[0], height: ML.box[3] - ML.box[1] };
const shot1 = await page.screenshot({ clip });
await page.screenshot({ path: join(SHOTS, "erba_icone.png"), clip: { x: clip.x - 10, y: clip.y - 40, width: clip.width + 20, height: clip.height + 50 } });
await settle(500);
const shot2 = await page.screenshot({ clip });
check("i ciuffi ondeggiano", !shot1.equals(shot2));
// una pennellata attraverso il fiume (la vista: la zona in alto, lontana dai riquadri)
await E(() => window.__editor.view.centre(1250, 1350)); await settle(200);
const [ax, ay] = await toScreen([900, 1050]), [bx, by] = await toScreen([1600, 1150]);
await page.mouse.move(ax, ay); await page.mouse.down();
for (let k = 1; k <= 12; k++) { await page.mouse.move(ax + ((bx - ax) * k) / 12, ay + ((by - ay) * k) / 12); await settle(40); }
await page.mouse.up(); await settle(400);
const made = await E(() => {
  const s = window.__editor.scene, m = s.map.meadows, rows = [...(s.meadowRows || new Map()).values()].flatMap((v) => v.rows);
  const parts = rows.flatMap((r) => r.parts);
  const wet = parts.filter((q) => Math.abs(q.y - 1100) < 30 && q.x > 950 && q.x < 1550).length;
  return { n: m.length, mix: m[0] && m[0].mix, parts: parts.length, wet };
});
check("la chiazza con le sue particelle", made.n === 1 && made.mix.poppy === 3 && made.mix.dark === 2 && made.parts > 200, JSON.stringify(made));
check("niente erba sull'acqua", made.wet === 0, String(made.wet));
await page.screenshot({ path: join(SHOTS, "erba_1.png") });
// il destro cancella, Ctrl+Z la rimette
const [cx, cy] = await toScreen([1250, 1100]);
await page.mouse.move(cx, cy); await page.mouse.down({ button: "right" }); await settle(150); await page.mouse.up({ button: "right" }); await settle(300);
check("il destro la cancella", (await E(() => window.__editor.scene.map.meadows.length)) === 0);
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await settle(300);
check("Ctrl+Z la rimette", (await E(() => window.__editor.scene.map.meadows.length)) === 1);
// una montagna sopra: l'erba rinasce solo fuori dalla sagoma
const under = await E(() => {
  const s = window.__editor.scene;
  s.addFeatures("mountains", [{ crest: [[1150, 800], [1350, 780]], height: 200, width: 320, seed: 3 }]);
  const g = s.world.mountains[0], grid = s.mountainGrid([g]), C = grid.C;
  const parts = [...s.meadowRows.values()].flatMap((v) => v.rows).flatMap((r) => r.parts);
  return { parts: parts.length, inside: parts.filter((q) => grid.grid[Math.floor(q.y / C) * grid.gw + Math.floor(q.x / C)]).length };
});
check("sotto la montagna niente erba", under.parts > 0 && under.inside === 0, JSON.stringify(under));
// [§9.217] una macchia di "Natura" e un fiume nuovo che ci passa sopra: il
// fiume la taglia (niente particelle sull'acqua), Ctrl+Z la rimette intera
const cut = await E(() => {
  const s = window.__editor.scene, e = { object: "burst_erba1", x: 3000, y: 3000, scale_x: 1, scale_y: 1, rotation: 0 };
  s.add([e]);
  const i = s.instOf(e), n = () => i.grass_rows.reduce((t, r) => t + r.parts.length, 0);
  const wet = () => i.grass_rows.flatMap((r) => r.parts).filter((q) => Math.abs(q.y - 3000) < 30 && q.x > 2600 && q.x < 3400).length;
  const before = n();
  s.addFeatures("rivers", [{ pts: [[2000, 3000], [4000, 3000]], width: 150 }]);
  const after = n(), wetAfter = wet();
  s.undo();
  return { before, after, wetAfter, back: n() };
});
check("il fiume taglia la macchia di Natura", cut.after < cut.before && cut.after > cut.before * 0.6 && cut.wetAfter === 0, JSON.stringify(cut));
check("Ctrl+Z: la macchia di nuovo intera", cut.back === cut.before, JSON.stringify(cut));
await E(() => { const s = window.__editor.scene; s.addFeatures("rivers", [{ pts: [[2000, 3000], [4000, 3000]], width: 150 }]); });

// [§9.219] la scheda Sabbia: una pennellata, una macchia di sabbia (la sua texture caricata)
const sandTab = (await E(() => window.__editor.brushLayout())).tabs.find((q) => q.kind === "sabbia");
await E(() => window.__editor.view.centre(4500, 1500)); await settle(200);
await page.mouse.click((sandTab.x1 + sandTab.x2) / 2, (sandTab.y1 + sandTab.y2) / 2); await settle();
const [sx, sy] = await toScreen([4300, 1250]);
await page.mouse.move(sx, sy); await page.mouse.down();
for (let k = 1; k <= 10; k++) { await page.mouse.move(sx + k * 30, sy + k * 4); await settle(40); }
await page.mouse.up(); await settle(400);
const sand = await E(() => ({ bg: (window.__editor.scene.map.patches || []).map((p) => p.bg), tex: !!window.__editor.scene.assets.bg.get("sabbia") }));
check("una macchia di sabbia", sand.bg.includes("sabbia") && sand.tex, JSON.stringify(sand));
await page.screenshot({ path: join(SHOTS, "sabbia.png") });

// "Prova mappa": l'erba nel gioco
await E(() => {
  const s = window.__editor.scene;
  s.add([{ object: "centro", x: 600, y: 3600, side: "red", scale_x: 1, scale_y: 1, rotation: 0 },
         { object: "centro", x: 5400, y: 3600, side: "blue", scale_x: 1, scale_y: 1, rotation: 0 }]);
  localStorage.setItem("535.skirmish", JSON.stringify({ fog: "none", daynight: "day", rain: "off", start: "A" }));
});
await E(() => { window.__editor.testMap(); }).catch(() => {});
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 }).catch(() => {});
const game = await E(() => {
  const G = window.__game;
  if (!G) return null;
  const rows = (G.world.meadowRows || []).flat();
  const burst = G.world.instances.find((i) => i.object === "burst_erba1");
  const wet = burst ? burst.grass_rows.flatMap((r) => r.parts).filter((q) => Math.abs(q.y - 3000) < 30 && q.x > 2600 && q.x < 3400).length : -1;
  return { patches: (G.world.meadowRows || []).length, parts: rows.reduce((n, r) => n + r.parts.length, 0), burstWet: wet };
});
check("nel gioco: l'erba", game && game.patches === 1 && game.parts > 200, JSON.stringify(game));
check("nel gioco: la macchia di Natura tagliata dal fiume", game && game.burstWet === 0, JSON.stringify(game));
if (game) {
  await E(() => { const G = window.__game; G.cam.x = 1250 - G.cam.w / 2; G.cam.y = 1100 - G.cam.h / 2; });
  await settle(1500);
  await page.screenshot({ path: join(SHOTS, "erba_gioco.png") });
}
check("nessun errore nella pagina", !errs.length, errs.join(" | "));
await browser.close();
console.log(fails ? `${fails} prove fallite` : "tutto bene");
process.exit(fails ? 1 : 0);
