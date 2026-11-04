// Prova nel browser dei pulsanti evidenziati col puntatore (§9.107), con
// l'interfaccia di vetro (l'impostazione di partenza): un civile
// selezionato in alto e poi in basso nella view (in basso il suo pannello ha
// la depth piu' bassa del pulsante e si disegna dopo); il pulsante della
// casa col puntatore sopra deve essere piu' chiaro di quello del magazzino
// senza, in tutti e due i casi. Prima, in basso, il cerchio di vetro del
// pannello copriva l'evidenziazione (168 contro 192: piu' scuro degli altri).
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/hover.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = {};
let ok = true;
for (const [label, frac] of [["alto", 0.2], ["basso", 0.9]]) {
  const r = await page.evaluate((frac) => {
    const G = window.__game, w = G.world, cam = G.cam, g = G.g;
    const clear = () => { for (const d of [...w.all("parent_hint")]) w.destroy(d); };
    if (!window.__warm) { window.__warm = 1; for (let k = 0; k < 400; k++) { G.advance(1); clear(); } } // la dissolvenza d'inizio
    clear();
    cam.setScale(1.7); cam.x = 2000; cam.y = 1500; cam.clamp();
    for (const a of w.all("ally_unit")) a.selected = 0;
    const o = window.__om || (window.__om = w.create("ally_omino", 0, 0));
    w.setPos(o, cam.x + cam.w / 2, cam.y + cam.h * frac);
    o.selected = 1; g.sel = 1; g.milsel = 0; g.wood = 1000;
    w.input.inside = false;
    G.advance(3);
    const c = w.all("casa_clicker").next().value;
    if (!c) return null;
    c.hover = 1;
    G.loop.render();
    return { vetro: G.settings.glass, pannelloDopo: o.depth < c.depth };
  }, frac);
  // nei cerchi dei pulsanti (casa 450,50 e magazzino 520,50), sotto l'icona
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 700, height: 120 } });
  const px = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    const at = (x, y) => ctx.getImageData(x, y, 1, 1).data[0];
    return { casa: at(450, 74), magazzino: at(520, 74) };
  }, png.toString("base64"));
  res[label] = { ...r, ...px };
  ok = ok && !!r && r.vetro && px.casa > px.magazzino + 30;
}
res.basso.pannelloDopo || (ok = false); // il caso che falliva
console.log(JSON.stringify(res));
if (errs.length) console.log(errs.slice(0, 5));
ok = ok && errs.length === 0;
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
