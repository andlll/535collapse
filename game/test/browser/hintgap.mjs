// Prova nel browser dei suggerimenti del tutorial che parlano di una parte
// dell'interfaccia (§9.81): ognuno a 20 px (o piu') dalle finestre vicine,
// senza toccarle. Nel match, a 1280 x 720, 1366 x 768 e 1920 x 1080: hint_iniziale,
// hint_vista, hint_resource_tree, hint_lavori, hint_resource (sotto il
// pannello delle risorse), hint_idle (sotto il riquadro degli inattivi e
// degli obiettivi), hint_objective, hint_objective2 (a sinistra degli
// obiettivi), hint_minimap (sopra la minimappa, e sopra il suo pulsante
// con la minimappa nascosta), hint_night (sotto i pulsanti).
// Per ogni suggerimento: la distanza minima dalle finestre (risorse,
// pannello e pulsanti dell'unita' selezionata, inattivi, pausa, obiettivi,
// minimappa o il suo pulsante). Esce con codice 1 se una e' sotto i 20 px.
// SHOTS=cartella: uno screenshot per suggerimento.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/hintgap.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const HINTS = ["hint_iniziale", "hint_vista", "hint_resource_tree", "hint_lavori", "hint_resource", "hint_idle",
               "hint_objective", "hint_objective2", "hint_minimap", "hint_minimap/nascosta", "hint_night"];
let failed = false;
for (const [VW, VH] of [[1280, 720], [1366, 768], [1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  for (const name of HINTS) {
    const res = await page.evaluate((NAME) => {
      const G = window.__game, w = G.world, g = G.g, W = w.cam.cssW, H = w.cam.cssH;
      const [hname, variant] = NAME.split("/");
      for (const n of ["parent_hint"]) for (const h of [...w.all(n)]) w.destroy(h);
      g.hint = 1; g.obj = 1; g.minim = variant === "nascosta" ? 0 : 1;
      // un civile selezionato: pannello dell'unita' e pulsanti di costruzione
      for (const u of w.all("ally_unit")) u.selected = 0;
      const o = w.all("ally_omino").next().value; if (o) o.selected = 1;
      G.advance(3); G.loop.render();
      w.create(hname, 0, 0);
      G.advance(2); G.loop.render();
      const h = w.all(hname).next().value;
      const box = [h.posx, h.posy, h.posx + 380, h.posy + h.testo_h + 68];
      const mh = w.roomH / g.sz, mw = w.roomW / g.sz;
      const gui = {
        risorse: [20, 20, 230, 150], unita: [260, 20, 390, 150], pulsanti: [420, 20, 760, 150],
        inattivi: [W - 90, 100, W - 20, 200], pausa: [W - 90, 20, W - 20, 80],
        obiettivi: [w._objLeft, 20, W - 120, w._objBottom],
        minimappa: g.minim === 1 ? [20, H - 20 - mh, 65 + mw, H - 20] : [5, H - 35, 35, H - 5],
      };
      const dist = (a, b) => {
        const dx = Math.max(0, b[0] - a[2], a[0] - b[2]), dy = Math.max(0, b[1] - a[3], a[1] - b[3]);
        return dx === 0 && dy === 0 ? -1 : Math.hypot(dx, dy);
      };
      let min = Infinity, who = null;
      for (const [k, r] of Object.entries(gui)) { const d = dist(box, r); if (d < min) { min = d; who = k; } }
      return { box: box.map(Math.round), min: Math.round(min * 10) / 10, who };
    }, name);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${VW}_${name.replace("/", "_")}.png` });
    const bad = res.min < 19.5;
    if (bad) failed = true;
    console.log(`${VW}x${VH}`, name.padEnd(22), JSON.stringify(res), bad ? "NON VA" : "");
  }
  if (errs.length) { failed = true; console.log(errs.slice(0, 2).join(" ")); }
  await page.close();
}
await browser.close();
console.log(failed ? "NON VA" : "ok");
process.exit(failed ? 1 : 0);
