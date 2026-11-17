// Prova nel browser del registro dei comandi e del replay (§9.153,
// multiplayer, fase 2, passo 1). Una partita di schermaglia su Padus (seme
// fisso) giocata SOLO con input veri (nessuna modifica diretta dello stato):
//   - clic sul centro, Q due volte (due lavoratori in coda)
//   - selezione a trascinamento dei lavoratori, clic destro su un albero
//   - clic su un lavoratore, Q (la casa), clic sinistro in un posto libero
//   - un trucco (V + Alt + W)
//   - la vista spostata con le frecce, lo zoom con la rotella
//   - un ordine di movimento col clic destro; intanto la CPU gioca
// registrata (G.record) con le impronte ogni 300 passi; poi la stessa partita
// rigiocata dal solo registro (G.commands.replay) in un'altra pagina, con
// un'altra misura della finestra: tutte le impronte uguali e la stessa alla
// fine. Controllo: il registro con un ordine spostato diverge. [§9.154] E
// rigiocata dai SOLI comandi (nessun input, ne' selezione, ne' telecamera):
// la stessa partita (le sue azioni sono tutte comandi).
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/replay.mjs [room] [seme]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_padus", seedArg = "11"] = process.argv.slice(2);
// [§9.155] PVP=2: la stessa sessione nella partita a due, giocata dal blu
// (?pvp=1&parte=2): i suoi oggetti sono p2_*, i comandi del giocatore 2
const P2 = process.env.PVP === "2", PVP = P2 ? "&pvp=1&parte=2" : "";
const N = (n) => (P2 ? (n.startsWith("ally_") ? "p2_" + n.slice(5) : "p2_" + n) : n);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
const open = async (w, h) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/index.html?room=${room}&nostart=1&seed=${seedArg}${PVP}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};

// la partita giocata con l'input
const A = await open(1280, 720);
const rec = await A.evaluate((P2) => {
  const N = (n) => (P2 ? (n.startsWith("ally_") ? "p2_" + n.slice(5) : "p2_" + n) : n);
  const G = window.__game, w = G.world, cam = G.cam, I = w.input || G.world.input;
  G.record();
  const step = (n = 1) => G.advance(n);
  step(2);
  const input = w.input;
  const css = (x, y) => [(x - cam.x) * cam.cssW / cam.w, (y - cam.y) * cam.cssH / cam.h];
  const look = (x, y) => { cam.x = x - cam.w / 2; cam.y = y - cam.h / 2; step(1); };
  const point = (x, y) => { const [px, py] = css(x, y); input.x = px; input.y = py; input.inside = true; step(2); };
  const left = (x, y) => { point(x, y); input._mp[0] = true; input._mdown[0] = true; step(1); input._mdown[0] = false; input._mr[0] = true; step(2); };
  const right = (x, y) => { point(x, y); input._mr[1] = true; step(2); };
  const key = (k, hold = 1) => { input._pressed.add(k); input._down.add(k); step(hold); input._down.delete(k); input._released.add(k); step(1); };
  const drag = (x0, y0, x1, y1) => {
    point(x0, y0); input._mp[0] = true; input._mdown[0] = true; step(1);
    for (let k = 1; k <= 6; k++) { const [px, py] = css(x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6); input.x = px; input.y = py; step(1); }
    input._mdown[0] = false; input._mr[0] = true; step(2);
  };
  const out = { fatto: [] };
  const centro = w.all(N("centro")).next().value;
  look(centro.x, centro.y + 150);
  left(centro.x, centro.y); out.fatto.push("centro " + (centro.selected === 1));
  key(81); key(81); out.fatto.push("coda " + (centro.coda || 0));
  step(400);
  // i lavoratori: trascinamento attorno a loro
  const om = [...w.all(N("ally_omino"))];
  const xs = om.map((u) => u.x), ys = om.map((u) => u.y);
  const bx0 = Math.min(...xs) - 60, by0 = Math.min(...ys) - 80, bx1 = Math.max(...xs) + 60, by1 = Math.max(...ys) + 40;
  look((bx0 + bx1) / 2, (by0 + by1) / 2);
  drag(bx0, by0, bx1, by1);
  out.fatto.push("selezionati " + om.filter((u) => u.selected === 1).length + "/" + om.length);
  const tree = w.nearest(centro.x, centro.y, "albero");
  look(tree.x, tree.y); right(tree.x, tree.y);
  step(600);
  // un lavoratore costruisce una casa
  const b = [...w.all(N("ally_omino"))][0];
  look(b.x, b.y); left(b.x, b.y);
  key(81);
  // il fantasma della casa sotto il puntatore, a spirale attorno al centro
  // finche' il posto e' buono (place 1), poi il clic (come autoplay.mjs)
  const pl = w.all("casa_placer").next().value;
  out.fatto.push("fantasma " + !!pl);
  if (pl) {
    for (let k = 0; k < 80; k++) {
      const a = k * 0.9, r = 260 + k * 14, px = centro.x + Math.cos(a) * r, py = centro.y + Math.sin(a) * r * 0.7;
      look(px, py); point(px, py);
      if (pl.alive && pl.place === 1) { left(px, py); break; }
    }
  }
  out.fatto.push("cantieri " + [...w.all(N("ally_fondamenta"))].length);
  step(300);
  // [§9.154] un trucco (V + Alt + W: +1000 legna), un comando anche lui
  const pool = P2 ? w.g.p2 : w.g, wood0 = pool.wood; // la cassa di chi gioca
  input._pressed.add(86); input._down.add(86); step(1);
  input._pressed.add(18); input._down.add(18); step(1);
  input._pressed.add(87); input._down.add(87); step(1);
  for (const k of [87, 18, 86]) { input._down.delete(k); input._released.add(k); }
  step(2);
  out.fatto.push("trucco " + (pool.wood - wood0));
  // la vista con le frecce, lo zoom con la rotella
  key(39, 90); key(40, 60);
  input.wheel = 1; step(30); input.wheel = -1; step(30);
  // un ordine di movimento al soldato o al lavoratore piu' vicino
  const m = [...w.all(N("ally_unit"))].find((u) => u.selected === 1) || b;
  look(m.x, m.y); right(m.x + 300, m.y + 120);
  step(2200);
  out.passi = w._stepNo;
  out.frame = G.commands.frameNo;
  out.hash = G.hash();
  out.log = G.commands.stop();
  return out;
}, P2);

// la stessa partita dal registro, in un'altra finestra
const replay = async (log, w, h, opts = {}) => {
  const P = await open(w, h);
  const r = await P.evaluate(([log, frames, opts]) => {
    const G = window.__game;
    G.commands.replay(log, opts);
    for (let k = 0; k < frames; k++) G.advance(1);
    return { passi: G.world._stepNo, hash: G.hash(), result: G.commands.play.result, divergedAt: G.commands.play.divergedAt ?? null };
  }, [log, rec.frame, opts]);
  if (r.divergedAt !== null && process.env.DIFFS) r.dump = await P.evaluate(() => window.__game.dump());
  await P.close();
  return r;
};
const B = await replay(rec.log, 960, 640);
// controllo: il primo ordine (il comando del clic destro, §9.154) spostato
// di 200 px
const bad = JSON.parse(JSON.stringify(rec.log));
const fr = bad.cmds.find((c) => c.k === "ordine" && c.ids.length);
if (fr) fr.x += 200;
const C = await replay(bad, 1280, 720);
// [§9.154, fase 2, passo 2] SOLO i comandi, senza nessun input (ne'
// selezione, ne' clic, ne' telecamera): le azioni di questa sessione (ordini,
// civili in coda, la casa) sono tutte comandi, quindi la partita e' la stessa
const D = await replay(rec.log, 1280, 720, { input: false });
await browser.close();

const checks = B.result.length, same = B.result.every(([, ok]) => ok);
// la sessione deve aver fatto davvero le sue azioni (selezione, cantiere)
const did = (pre) => { const f = rec.fatto.find((x) => x.startsWith(pre)); return f ? f.slice(pre.length) : ""; };
const played = did("centro ") === "true" && /^[1-9]/.test(did("selezionati ")) && Number(did("cantieri ")) >= 1;
const ok = played && errs.length === 0 && rec.log.checks.length >= 8 && checks === rec.log.checks.length && same
  && B.hash === rec.hash && B.passi === rec.passi && !!fr && C.hash !== rec.hash
  && D.result.length === rec.log.checks.length && D.result.every(([, o]) => o) && D.hash === rec.hash
  && ["ordine", "civile", "costruisci", "trucco"].every((k) => rec.log.cmds.some((c) => c.k === k))
  && Number(did("trucco ")) >= 1000;
console.log("partita  ", JSON.stringify({ passi: rec.passi, fatto: rec.fatto, fotografie: rec.log.frames.length, impronte: rec.log.checks.length, seme: rec.log.seed }));
console.log("replay   ", JSON.stringify({ passi: B.passi, impronteUguali: `${B.result.filter(([, o]) => o).length}/${checks}`, finale: B.hash === rec.hash, divergeAl: B.divergedAt }));
console.log("controllo", JSON.stringify({ divergeAl: C.divergedAt, finaleDiverso: C.hash !== rec.hash }));
console.log("solo comandi", JSON.stringify({ comandi: rec.log.cmds.length, tipi: [...new Set(rec.log.cmds.map((c) => c.k))],
  impronteUguali: `${D.result.filter(([, o]) => o).length}/${D.result.length}`, finale: D.hash === rec.hash, divergeAl: D.divergedAt }));
if (errs.length) console.log(errs.slice(0, 3));
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
