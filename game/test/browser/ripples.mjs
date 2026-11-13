// Prova nel browser degli anelli della pioggia sui fiumi a linee (§9.149):
// con la pioggia piena e la vista lungo i fiumi (un punto ogni 150 della
// linea), per ogni anello nato su un fiume a linee si guarda, alla grandezza
// massima (24 x 12 px il grande, 11 x 6 il piccolo), se il bordo esce
// dall'acqua; per il grande anche se sopra di lui c'e' la parete della riva
// lontana (16 px). Prima (lvl06, seme 3): 158 grandi su 462 fuori, 47 sulla
// parete, 98 piccoli su 504 fuori. Ora: al piu' il 3% fuori (o uno; il controllo
// guarda 8 punti del bordo, la prova 16), nessuno sulla parete, e anelli
// anche sui ruscelli stretti di sk_silva.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/ripples.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const room of ["lvl06", "sk_silva"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const r = await page.evaluate(() => {
    const G = window.__game, w = G.world, cam = G.cam;
    let seed = 3; Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    G.advance(2);
    G.g.raining = 1; w.overcast = 1; G.manager.rain = { alive: true, level: 1, emitters: [] };
    const P_ = w.particles, seen = new WeakSet();
    const water = (x, y) => { const wm = w._water, cx = Math.floor(x / wm.C), cy = Math.floor(y / wm.C); return cx >= 0 && cy >= 0 && cx < wm.gw && cy < wm.gh && !!wm.grid[cy * wm.gw + cx]; };
    const outside = (q, rx, ry) => { for (let a = 0; a < 16; a++) { const t = a / 16 * 6.283; if (!water(q.x + Math.cos(t) * rx, q.y + Math.sin(t) * ry)) return true; } return false; };
    const res = { grandi: 0, grandiFuori: 0, parete: 0, piccoli: 0, piccoliFuori: 0 };
    const views = [];
    for (const rv of w.rivers || []) for (let k = 0; k < rv.L.length; k += 150) views.push([(rv.L[k].x + rv.R[k].x) / 2, (rv.L[k].y + rv.R[k].y) / 2]);
    for (const [vx, vy] of views.slice(0, 12)) {
      cam.x = vx - cam.w / 2; cam.y = vy - cam.h / 2;
      for (let s = 0; s < 60; s++) {
        G.advance(1);
        for (const ps of P_.systems) {
          if (!ps.alive || ps.kind !== "ripples:fiumi") continue;
          for (const q of ps.parts) {
            if (seen.has(q)) continue;
            seen.add(q);
            if (q.size >= 0.06) {
              res.grandi++;
              if (outside(q, 24, 12)) res.grandiFuori++;
              else if (!water(q.x, q.y - 12 - 16)) res.parete++;
            } else { res.piccoli++; if (outside(q, 11, 6)) res.piccoliFuori++; }
          }
        }
      }
    }
    return res;
  });
  const few = (k, n) => k <= Math.max(1, 0.03 * n); // al piu' il 3% (almeno uno ammesso: sk_silva ne ha pochi)
  const good = errs.length === 0 && few(r.grandiFuori, r.grandi) && r.parete === 0 && few(r.piccoliFuori, r.piccoli)
    && r.piccoli > 30 && (room !== "lvl06" || r.grandi > 100);
  ok = ok && good;
  console.log(room.padEnd(9), JSON.stringify(r), good ? "" : "NON VA", errs.slice(0, 1).join(""));
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
