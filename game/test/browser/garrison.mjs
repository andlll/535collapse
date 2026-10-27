// Prova nel browser dell'uscita degli arcieri di presidio (§9.63): una torre
// (2 posti) e un castello (4) in campo aperto nel match; arcieri feriti
// (vita 30, 35, ..., l'ultimo a vita piena) mandati a presidiarli col clic destro vero; poi
// l'edificio selezionato col clic e i pulsanti d'uscita premuti uno a uno
// (prima riga, y 50: nella torre da x 450, nel castello da x 660, a destra
// di ariete, catapulta e annulla, con un ariete in produzione; §9.79). Controlla:
//   entrati    = tutti gli arcieri nell'edificio, popolazione scesa di 2 l'uno
//   pulsanti   = uno per arciere, sotto il puntatore il clic non deseleziona
//   fuori      = a ogni clic un arciere in meno dentro e uno in piu' fuori,
//                con la vita che aveva entrando, popolazione +2
//   vitaDopo2s = la stessa vita 2 s dopo l'uscita (§9.80)
//   bandiere   = a edificio vuoto non ne resta nessuna sua
//   produzione = nel castello continua
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/garrison.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const [B, N, X, ROW] of [["torre", 2, 450, 50], ["castello", 4, 660, 50]]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const r = await page.evaluate(([B, N, X, ROW]) => {
    const G = window.__game, w = G.world, cam = G.cam, p = w.path;
    G.advance(3);
    const input = w.input;
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const e of [...w.all("enemy_manager")]) w.destroy(e);
    Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0, food: 5000, wood: 5000, gold: 5000, popcap: 200 });
    // il posto piu' libero lontano dal centro
    const c = w.all("centro").next().value;
    let best = null;
    for (let gy = 30; gy < p.gh - 30; gy += 4) for (let gx = 30; gx < p.gw - 30; gx += 4) {
      const x = gx * 32 + 16, y = gy * 32 + 16;
      if (Math.hypot(x - c.x, y - c.y) < 1500) continue;
      let bad = 0;
      for (let dy = -16; dy <= 16; dy += 2) for (let dx = -16; dx <= 16; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
      if (!best || bad < best.bad) best = { gx, gy, bad };
    }
    const b = w.create(B, best.gx * 32 + 16, best.gy * 32 + 16); p.markInstance(b, 1000);
    const flags0 = w.number("flag_r") + w.number("flag_r2");
    const archers = [];
    for (let k = 0; k < N; k++) archers.push(w.create("ally_arciere", b.x - 250 + k * 50, b.y + 250));
    G.advance(3);
    // feriti (30, 35, ...), l'ultimo a vita piena (55)
    archers.forEach((a, k) => { a.life = k === N - 1 ? a.slife : 30 + k * 5; });
    const lives = archers.map((a) => a.life).sort((x, y) => x - y);
    const pop0 = G.g.pop;
    for (const u of w.all("ally_unit")) u.selected = 0;
    for (const a of archers) a.selected = 1;
    G.g.sel = N; G.g.milsel = N; G.g.arcsel = N;
    cam.x = b.x - cam.w / 2; cam.y = b.y - cam.h / 2; G.advance(1); // la camera si assesta
    const at = () => { const bb = w.bbox(b); input.x = ((bb[0] + bb[2]) / 2 - cam.x) * cam.cssW / cam.w; input.y = ((bb[1] + bb[3]) / 2 - cam.y) * cam.cssH / cam.h; input.inside = true; };
    at(); input._mr[1] = true; G.advance(1);
    G.advance(900);
    const out = { entrati: b.npresidio === N && w.number("ally_arciere") === 0 && G.g.pop === pop0 - 2 * N };
    // selezione col clic sull'edificio; nel castello un ariete in produzione
    for (const u of w.all("ally_unit")) u.selected = 0; G.g.sel = 0; G.g.milsel = 0;
    at(); input._mp[0] = true; G.advance(1); input._mr[0] = true; G.advance(2);
    if (B === "castello") { input.x = 450; input.y = 50; G.advance(2); input._mp[0] = true; G.advance(1); input._mr[0] = true; G.advance(30); }
    const prod0 = b.progression;
    out.pulsanti = b.selected === 1;
    // i pulsanti, uno a uno (si preme sempre il primo: gli altri scorrono)
    const got = [], outs = [];
    for (let k = 0; k < N; k++) {
      input.x = X; input.y = ROW; G.advance(2);
      const n = b.npresidio, pop = G.g.pop, before = new Set(w.all("ally_arciere"));
      input._mp[0] = true; G.advance(1);
      out.pulsanti = out.pulsanti && b.selected === 1;
      input._mr[0] = true; G.advance(2);
      const fresh = [...w.all("ally_arciere")].filter((a) => !before.has(a));
      if (b.npresidio !== n - 1 || fresh.length !== 1 || G.g.pop !== pop + 2) { out.fuori = false; break; }
      got.push(fresh[0].life); outs.push(fresh[0]);
    }
    if (out.fuori !== false) out.fuori = got.length === N && JSON.stringify(got.sort((x, y) => x - y)) === JSON.stringify(lives);
    // §9.80: la vita resta quella anche dopo (niente che la rimetta a 55)
    G.advance(120);
    const later = outs.map((a) => a.life).sort((x, y) => x - y);
    out.vitaDopo2s = JSON.stringify(later) === JSON.stringify(lives);
    out.bandiere = w.number("flag_r") + w.number("flag_r2") === flags0;
    if (B === "castello") out.produzione = b.progression > prod0;
    out.dettagli = { npresidio: b.npresidio, vite: got, pop: G.g.pop };
    return out;
  }, [B, N, X, ROW]);
  const good = Object.entries(r).every(([k, v]) => k === "dettagli" || v === true) && errs.length === 0;
  console.log(B.padEnd(9), JSON.stringify(r), good ? "ok" : "NON VA", errs.slice(0, 2).join(" "));
  ok = ok && good;
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
