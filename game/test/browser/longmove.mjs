// Prova nel browser degli spostamenti lunghi (§9.69): nel match, due punti
// liberi collegati da un percorso di oltre 4500 px; un'unita' per tipo
// (guerriero, picchiere, cavaliere, arciere, civile) mandata dall'uno
// all'altro col clic destro vero, da sola. Arriva entro 100 px dalla meta?
// Prima il "timer fermati" (allarme 8: 1200 passi dall'ordine, 3000 per il
// guerriero) la fermava a meta' strada anche se camminava. Poi un guerriero
// incastrato (rimesso al suo posto a ogni passo) mandato lontano: il timer
// lo ferma ancora, entro 3000 passi.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/longmove.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const TYPES = ["ally_warrior", "ally_picchiere", "ally_cavaliere", "ally_arciere", "ally_omino"];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let ok = true;
for (const type of (process.env.TYPES ? process.env.TYPES.split(",") : [...TYPES, "chiuso"])) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=match&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  const r = await page.evaluate((type) => {
    const G = window.__game, w = G.world, cam = G.cam, p = w.path, g = G.g;
    let seed = 3;
    Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    G.advance(3);
    const input = w.input;
    for (const e of [...w.all("enemy")]) w.destroy(e);
    for (const e of [...w.all("enemy_manager")]) w.destroy(e);
    Object.assign(g, { bloc1: 1, bloc2: 1, bloc3: 1, hint: 0 });
    const free = (gx, gy, rad) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (p.costAt(gx + dx, gy + dy) >= 1000) return false; return true; };
    // A: il posto libero piu' a nord-ovest; B: il libero piu' lontano da A
    // lungo il percorso (campo di flusso), oltre 4500 px
    let A = null;
    for (let s = 20; s < p.gw + p.gh && !A; s += 2) for (let gx = 15; gx < p.gw - 15 && !A; gx += 2) {
      const gy = s - gx; if (gy < 15 || gy >= p.gh - 15) continue;
      if (free(gx, gy, 3)) A = [gx, gy];
    }
    const f = p.goalField(A[0] * 32 + 16, A[1] * 32 + 16);
    let B = null;
    for (let gy = 15; gy < p.gh - 15; gy += 2) for (let gx = 15; gx < p.gw - 15; gx += 2) {
      const v = p.fieldAt(f, gx, gy);
      if (v > 140 && v < 200 && free(gx, gy, 3) && (!B || v > B[2])) B = [gx, gy, v];
    }
    const ax = A[0] * 32 + 16, ay = A[1] * 32 + 16, bx = B[0] * 32 + 16, by = B[1] * 32 + 16;
    for (const u of [...w.all("ally_unit")]) w.destroy(u);
    const u = w.create(type === "chiuso" ? "ally_warrior" : type, ax, ay);
    G.advance(5);
    for (const o of w.all("ally_unit")) o.selected = 0;
    u.selected = 1; g.sel = 1; g.milsel = type === "ally_omino" ? 0 : 1; g.arcsel = type === "ally_arciere" ? 1 : 0;
    cam.x = bx - cam.w / 2; cam.y = by - cam.h / 2; G.advance(1);
    input.x = (bx - cam.x) * cam.cssW / cam.w; input.y = (by - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true; G.advance(1);
    let arrived = -1, stoppedAt = -1;
    for (let s = 0; s < 9000 && arrived < 0 && stoppedAt < 0; s++) {
      G.advance(1);
      // "chiuso": incastrata, non avanza (rimessa al suo posto a ogni passo)
      if (type === "chiuso") w.setPos(u, ax, ay);
      if (Math.hypot(u.x - bx, u.y - by) < 100) arrived = s;
      else if (u.action === 0 && s > 30) stoppedAt = s;
    }
    const left = p.fieldAt(f, Math.floor(u.x / 32), Math.floor(u.y / 32));
    return { percorso: B[2] * 32, arrivato: arrived, fermoA: stoppedAt, mancano: Math.round(Math.hypot(u.x - bx, u.y - by)), cellaDaA: left };
  }, type);
  const good = (type === "chiuso" ? r.fermoA >= 0 && r.fermoA <= 3100 : r.arrivato >= 0) && errs.length === 0;
  console.log(type.padEnd(15), JSON.stringify(r), good ? "ok" : "NON VA", errs.slice(0, 2).join(" "));
  ok = ok && good;
  await page.close();
}
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
