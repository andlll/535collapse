// Prova nel browser: carica ogni room e fa avanzare la simulazione di N
// passi senza disegnare (window.__game.advance), poi stampa unita' ed
// errori della pagina. Serve dopo ogni modifica alla logica di gioco.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/soak.mjs [url] [passi] [room...]
//
// Usa Playwright con Chromium. Se il modulo non e' installato nel progetto,
// PLAYWRIGHT_MODULE indica dove trovarlo (nell'ambiente cloud:
// /opt/node-tools/node_modules/playwright/index.mjs). Con il rendering
// software (SwiftShader) servono le opzioni qui sotto.

const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);

const [base = "http://localhost:8123", stepsArg = "3000", ...roomsArg] = process.argv.slice(2);
const steps = Number(stepsArg);
const rooms = roomsArg.length ? roomsArg : ["menu", "match", "lvl01", "lvl02"];

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const room of rooms) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/index.html?room=${room}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const t0 = Date.now();
  await page.evaluate((n) => window.__game.advance(n), steps);
  const info = await page.evaluate(() => {
    const w = window.__game.world;
    return { alleati: w.number("ally_unit"), nemici: w.number("enemy_unit"), pop: window.__game.g.pop };
  });
  console.log(room, steps, "passi in", Date.now() - t0, "ms", JSON.stringify(info), "errori:", errors.length ? errors.slice(0, 3) : "nessuno");
  if (errors.length) failed = true;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
