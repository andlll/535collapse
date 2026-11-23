// [§9.203, richiesta dell'autore] Le foto delle macchie a particelle per la
// tavolozza dell'editor di mappe ("Natura"): "sostituire l'immagine che c'e'
// ora concettuale con uno screenshot, come fatto per il campo di grano".
// Le macchie (erba, grano, fili d'erba, fiori: effects.js DECOR) non hanno
// sprite: sono migliaia di particelle. Qui ognuna si mette, da sola, al
// centro di una mappa vuota dell'editor (il prato, green1), la vista la
// inquadra intera, si fotografa il riquadro dell'ellisse (lontano dalla
// colonna, dal pannello e dal titolo) e si sfuma ai bordi con un'ellisse
// (Pillow): una macchia di prato. Scrive nuovi/sprites/ed_natura_<oggetto>.png;
// poi tools/05_atlas.py la mette nell'atlas (gruppo ambiente, nuovi.json).
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node tools/19_natura.mjs [oggetto ...]
// Playwright come le prove nel browser (PLAYWRIGHT_MODULE se non e' nel progetto).
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALL = ["burst_erba1", "burst_grano1", "chiazzaparticellare", "fiori_prato", "fiori_papaveri", "fiori_papaveri_erba", "fiori_gialli_erba"];
const names = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const VW = 1600, VH = 1000; // la vista: l'interfaccia resta fuori dal riquadro
const SHOT_W = 640; // larghezza del riquadro, pixel CSS (l'ellisse e un margine)
const OUT_W = 320; // larghezza dell'immagine nell'atlas
const MARGIN = 1.08; // il riquadro oltre l'ellisse
// il riquadro -> l'immagine: ridotta, sfumata con un'ellisse (bordo morbido
// FEATHER della meta' del lato)
const SOFT = `
import sys
from PIL import Image, ImageDraw, ImageFilter
src, dst, w = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert("RGBA")
im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
k = 4
m = Image.new("L", (im.width * k, im.height * k), 0)
fx, fy = im.width * k * 0.07, im.height * k * 0.07
ImageDraw.Draw(m).ellipse([fx, fy, m.width - 1 - fx, m.height - 1 - fy], fill=255)
m = m.filter(ImageFilter.GaussianBlur(min(m.width, m.height) * 0.045)).resize(im.size, Image.LANCZOS)
im.putalpha(m)
im.save(dst)
`;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
await page.goto(`${base}/index.html?room=editor`);
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 180000 });
// "Inserisci" carica gli sprite della tavolozza e delle particelle (il tier gioco)
const ins = await page.evaluate(() => window.__editor.layout().buttons.find((b) => b.key === "insert"));
await page.mouse.click(ins.x, ins.y);
await page.waitForFunction(() => window.__editor.catalog() === "ready", null, { timeout: 180000 });
for (const name of names) {
  const box = await page.evaluate(async ([name, VW, VH, SHOT_W, MARGIN]) => {
    const { decorSize } = await import("/src/effects.js");
    const E = window.__editor, sc = E.scene, [rx, ry] = decorSize(name);
    sc.remove(sc.map.instances.filter((e) => e.object !== "manager"));
    const x = Math.round(sc.map.width / 2), y = Math.round(sc.map.height / 2);
    sc.add([{ object: name, x, y, scale_x: 1, scale_y: 1, rotation: 0 }]);
    // la polilinea: niente segnaposto delle macchie (Sposta e Inserisci li
    // disegnano), niente scelta; il puntatore fuori
    E.ed.tool = "line";
    E.ed.sel.clear();
    E.input.x = 2; E.input.y = 2; E.input.inside = false;
    const scale = (2 * rx * MARGIN) / SHOT_W;
    E.view.zoomAt(scale, VW / 2, VH / 2);
    // (i fiori crescono verso l'alto dal punto in cui nascono: piu' spazio sopra)
    const up = 0.12 * ry;
    E.view.centre(x, y - up);
    const h = Math.round((2 * (ry + up) * MARGIN) / scale);
    return { x: Math.round(VW / 2 - SHOT_W / 2), y: Math.round(VH / 2 - h / 2), width: SHOT_W, height: h };
  }, [name, VW, VH, SHOT_W, MARGIN]);
  await page.waitForTimeout(1500); // l'erba ondeggia: qualche passo
  const raw = path.join(REPO, "build", `natura_${name}.png`), out = path.join(REPO, "nuovi", "sprites", `ed_natura_${name}.png`);
  execFileSync("mkdir", ["-p", path.join(REPO, "build")]);
  await page.screenshot({ path: raw, clip: box });
  execFileSync("python3", ["-c", SOFT, raw, out, String(OUT_W)]);
  console.log(`${name}: ${box.width}x${box.height} -> ${path.relative(REPO, out)}`);
}
await browser.close();
