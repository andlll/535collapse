// Prova nel browser del fiume e del ponte del livello 4 (§9.40), nella
// mappa mappe/lvl04.tmx (quattro civili e tre guerrieri sulla riva sud):
//   chiuso   = col ponte rotto un guerriero mandato sulla riva nord non ci
//              arriva (il varco e' chiuso, il fiume e' solido)
//   lavoro   = i quattro civili, mandati col clic destro vero sul ponte,
//              lavorano tutti (action 6) entro 600 passi
//   senzaLegno = senza legno per 600 passi il ponte non avanza (§9.41)
//   stadi    = gli sprite del ponte nell'ordine Ponte_1..Ponte_4
//   finito   = col legno, il ponte riparato in 3-5 minuti di gioco con
//              quattro civili, spendendo il legno di BRIDGE (1000):
//              ponte_fatto, la balaustra e le sue fette
//   attraversa = i tre guerrieri arrivano sulla riva nord passando dal ponte
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/bridge.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=lvl04&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, cam = G.cam;
  G.advance(5);
  const input = w.input;
  let seed = 3;
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const click = (tx, ty) => {
    cam.x = tx - cam.w / 2; cam.y = ty - cam.h / 2;
    input.x = (tx - cam.x) * cam.cssW / cam.w; input.y = (ty - cam.y) * cam.cssH / cam.h;
    input.inside = true; input._mr[1] = true;
  };
  const select = (list) => {
    for (const u of w.all("ally_unit")) u.selected = 0;
    G.g.sel = 0; G.g.milsel = 0;
    for (const u of list) { u.selected = 1; G.g.sel++; if (u.object !== "ally_omino") G.g.milsel++; }
  };
  const out = {};
  const b = [...w.all("ponte")][0];
  if (!b) return { err: "nessun ponte" };
  // la riva nord, oltre il ponte (dall'angolo in alto a sinistra di Ponte_1)
  const NX = b.x - 180, NY = b.y - 320;
  const north = (u) => u.y < b.y + 40 && u.x < b.x + 250;
  const ws = [...w.all("ally_warrior")], om = [...w.all("ally_omino")];
  for (const u of [...ws, ...om]) u.life = u.slife;
  // chiuso
  select([ws[0]]); click(NX, NY);
  for (let s = 0; s < 900; s++) G.advance(1);
  out.chiuso = !north(ws[0]);
  // lavoro, senza legno
  G.g.wood = 0;
  select(om); click(b.x + 270, b.y + 165);
  let working = 0;
  for (let k = 0; k < 600; k++) { G.advance(1); working = Math.max(working, om.filter((o) => o.action === 6).length); }
  out.senzaLegno = b.life === 1;
  // col legno: stadi e fine
  G.g.wood = 5000;
  const stages = [b.sprite_index];
  let s = 0;
  for (; s < 30000 && w.number("ponte") > 0; s++) {
    G.advance(1);
    const bb = [...w.all("ponte")][0];
    if (bb && bb.sprite_index !== stages[stages.length - 1]) stages.push(bb.sprite_index);
  }
  out.lavoro = working;
  out.stadi = stages.join(",");
  out.finitoA = w.number("ponte") === 0 ? s : -1;
  out.legno = 5000 - G.g.wood;
  out.finito = w.number("ponte_fatto") === 1 && w.number("ponte_balaustra") === 1 && w.number("__fetta") > 42;
  // attraversa
  select(ws); click(NX, NY);
  let at = -1;
  for (let k = 0; k < 1500 && at < 0; k++) { G.advance(1); if (ws.every(north)) at = k; }
  out.attraversa = at;
  return out;
});
console.log(JSON.stringify(res));
const ok = !res.err && res.chiuso && res.lavoro === 4 && res.senzaLegno && res.stadi === "Ponte_1,Ponte_2,Ponte_3,Ponte_4"
  && res.finitoA >= 3 * 3600 && res.finitoA <= 5 * 3600 && res.legno === 1000 && res.finito && res.attraversa > 0
  && errs.length === 0;
if (errs.length) console.log(errs);
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
