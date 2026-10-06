// Prova dello zip per i portali (tools/10_zip.py) come lo usa un portale:
// estratto in una sottocartella di un altro sito e aperto in un iframe.
// - ogni richiesta resta dentro la sottocartella (percorsi relativi) e
//   nessuna fallisce;
// - il gioco parte nel menu e in ogni room, e fa N passi senza errori;
// - nell'iframe senza allowfullscreen il pulsante dello schermo intero
//   non compare (ripiego, fullscreen.js);
// - salvare e ricaricare dallo slot funziona dentro l'iframe.
//
//   python3 tools/10_zip.py
//   node game/test/browser/portal.mjs [zip] [passi]
//
// Serve `unzip`. Playwright come in soak.mjs (PLAYWRIGHT_MODULE).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);

const [zip = "build/535-collapse-web.zip", stepsArg = "1500"] = process.argv.slice(2);
const SUB = "/portal/html5/535/";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "535-portal-"));
const dir = path.join(root, SUB);
fs.mkdirSync(dir, { recursive: true });
execFileSync("unzip", ["-q", path.resolve(zip), "-d", dir]);

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp",
                ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
// il "portale" (127.0.0.1) mette il gioco in un iframe di un'altra
// origine (localhost), senza allowfullscreen, come itch.io e gli altri
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
const gameUrl = `http://localhost:${port}${SUB}index.html`;
fs.writeFileSync(path.join(root, "portal", "embed.html"),
  `<!doctype html><title>portale</title><body style="margin:0;background:#222">
   <iframe id="g" src="${gameUrl}" style="border:0;width:1200px;height:680px"></iframe></body>`);

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const problems = [];
page.on("pageerror", (e) => problems.push("errore: " + e.message));
page.on("requestfailed", (r) => problems.push("richiesta fallita: " + r.url()));
page.on("response", (r) => {
  const u = new URL(r.url());
  if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${u.pathname}`);
  if (u.pathname !== "/portal/embed.html" && !u.pathname.startsWith(SUB)) problems.push("fuori dalla sottocartella: " + u.pathname);
});
const steps = Number(stepsArg);
await page.goto(base + "/portal/embed.html");
const frame = () => page.frames().find((f) => f.url().includes(SUB));
// pronto: il documento nuovo (non quello marcato prima di navigare) ha il gioco avviato
const ready = async () => {
  for (let t = 0; t < 1200; t++) {
    const f = frame();
    if (f && await f.evaluate(() => !window.__old && !!(window.__game && window.__game.ready)).catch(() => false)) return;
    await page.waitForTimeout(100);
  }
  throw new Error("il gioco nell'iframe non parte");
};
const go = async (q) => {
  await frame().evaluate(() => { window.__old = true; });
  await page.evaluate((src) => { document.getElementById("g").src = src; }, gameUrl + q);
  await ready();
};
await ready();
const fs0 = await frame().evaluate(() => ({ enabled: document.fullscreenEnabled, room: window.__game.world.room }));
console.log("iframe:", fs0.room, "schermo intero permesso:", fs0.enabled);
if (fs0.enabled) problems.push("nell'iframe senza allowfullscreen lo schermo intero risulta permesso");
for (const room of ["menu", "match", "lvl01", "lvl02"]) {
  await go(`?room=${room}&nostart=1`);
  const r = await frame().evaluate((n) => { window.__game.advance(n); return window.__game.world.instances.length; }, steps);
  console.log(room, steps, "passi,", r, "istanze");
}
// salvare e ricaricare dentro l'iframe
await go("?room=match&nostart=1");
await frame().evaluate(async () => { window.__game.g.gold = 4321; await window.__pause.actions.saveGame(); });
await go("?room=match&load=slot&nostart=1");
const gold = await frame().evaluate(() => window.__game.g.gold);
console.log("salva e carica nell'iframe: oro", gold);
if (gold !== 4321) problems.push("caricamento dallo slot nell'iframe: oro " + gold);

await browser.close();
server.close();
fs.rmSync(root, { recursive: true, force: true });
if (problems.length) { console.log("PROBLEMI:\n" + [...new Set(problems)].join("\n")); process.exit(1); }
console.log("zip per i portali: tutto a posto");
