// Prova nel browser dei salvataggi (save.js, snapshot.js): per ogni room
// fa avanzare la partita, salva nello slot col menu di pausa, ricarica la
// pagina con ?load=slot e confronta lo stato catturato prima e dopo (deve
// essere identico), poi fa altri passi per vedere che il gioco prosegue.
// [§9.107] Salva con localStorage pieno: il corpo dello slot va in IndexedDB.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/saves.mjs [url] [passi] [room...]
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).

const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);

const [base = "http://localhost:8123", stepsArg = "4000", ...roomsArg] = process.argv.slice(2);
const rooms = roomsArg.length ? roomsArg : ["match", "lvl01", "lvl02"];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failed = false;
for (const room of rooms) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = () => page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await ready();
  const A = await page.evaluate(async (n) => {
    const G = window.__game;
    G.advance(n);
    const json = JSON.stringify(G.capture().state);
    // [§9.107] localStorage pieno (altri giochi, altri slot): il salvataggio
    // riesce lo stesso, il corpo va in IndexedDB
    const junk = "x".repeat(256 * 1024);
    let k = 0;
    try { for (;;) localStorage.setItem("junk" + k++, junk); } catch (e) { /* pieno */ }
    await window.__pause.actions.saveGame();
    const info = await new Promise((res) => {
      const rq = indexedDB.open("535-saves");
      rq.onsuccess = () => {
        const g = rq.result.transaction("info").objectStore("info").get(G.world.room);
        g.onsuccess = () => res(g.result || null);
        g.onerror = () => res(null);
      };
      rq.onerror = () => res(null);
    });
    for (let j = 0; j < k; j++) localStorage.removeItem("junk" + j);
    return { json, slot: info && info.room === G.world.room ? "IndexedDB" : "nessuno", full: k > 1 };
  }, Number(stepsArg));
  await page.goto(`${base}/index.html?room=${room}&load=slot&nostart=1`);
  await ready();
  const B = await page.evaluate(() => JSON.stringify(window.__game.capture().state));
  await page.evaluate(() => window.__game.advance(1000));
  const same = A.json === B;
  if (!same || errors.length || A.slot !== "IndexedDB" || !A.full) failed = true;
  console.log(room, `stato ${Math.round(A.json.length / 1024)} KB, slot in ${A.slot},`,
              same ? "ripristino identico" : "RIPRISTINO DIVERSO", "errori:", errors.length ? errors.slice(0, 3) : "nessuno");
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
