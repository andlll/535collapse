// Prova nel browser degli effetti d'ambiente (§9.84), nel match:
//   crepuscolo  manager.twilight: 0 di giorno, sale negli ultimi 900 passi
//               prima del tramonto, 1 durante il passaggio, 0 di notte
//               piena, scende nei primi 900 passi dopo l'alba; il colore
//               sottratto (skyColour) e' rosa a meta' (verde e blu tolti,
//               rosso no) e quello della notte di sempre a notte piena
//   nuvole      ci sono nuvole (sagome nn1-nn6 dell'autore, §9.86) attorno
//               alla view di giorno, nessuna di notte; l'ombra su un oggetto
//               (shadeAt nel punto in cui tocca terra) e' 0,6 nel pieno
//               della sagoma (anche specchiata e ruotata) e 1 fuori
//   pioggia     cielo coperto (overcast) in pochi secondi, senza macchie;
//               smesso di piovere, le macchie tornano
//   graduale    (§9.91) le gocce nascono solo a cielo del tutto coperto e
//               arrivano al pieno in 300 passi; smesso, calano in 300 col
//               cielo ancora coperto, poi si rasserena e il sistema si toglie;
//               (§9.92) un edificio in fiamme si spegne solo con le gocce
//               ad almeno meta', salendo e calando
//   vento       (§9.90) nuvole a 0,8 px a passo col vento minimo e 1,5 col
//               massimo; pioggia a 250-260 (come prima) e 235-245 gradi; l'erba ondeggia
//               di 4 e 6,4 gradi, piegata di 0 e 3 gradi
//   camini      le case del giocatore con camino (stili 1, 2, 4, 6) fanno
//               fumo dalla cima del camino (entro 8 px), quelle senza no
//   crollo      una caserma distrutta: polvere e detriti; le rovine della
//               mappa al primo passo no
//   polvere     un cavaliere mandato col clic destro lascia polvere
//   salvataggio salvato e ricaricato (una pagina nuova), il fumo riprende
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/ambience.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${base}/index.html?room=match&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const res = await page.evaluate(() => {
  const G = window.__game, w = G.world, p = w.path, cam = G.cam, M = G.manager, P = w.particles, out = {};
  const run = (n) => { for (let k = 0; k < n; k++) { G.advance(1); for (const d of [...w.all("parent_hint")]) w.destroy(d); } };
  run(3);
  for (const e of [...w.all("enemy")]) w.destroy(e);
  Object.assign(G.g, { bloc1: 1, bloc2: 1, bloc3: 1 });
  // zona aperta
  let best = null;
  for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
    let bad = 0;
    for (let dy = -20; dy <= 20; dy += 2) for (let dx = -30; dx <= 30; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
    if (!best || bad < best.bad) best = { gx, gy, bad };
  }
  const X = best.gx * 32 + 16, Y = best.gy * 32 + 16;
  cam.x = X - cam.w / 2; cam.y = Y - cam.h / 2; cam.clamp();

  // crepuscolo: dal giorno, 1000 passi prima del tramonto
  const tw = [];
  G.g.night = 0; M.al.set(0, 1000); M.al.set(1, -1);
  for (let k = 0; k < 1000 + 200 + 2000 + 200 + 1000; k += 50) { run(50); tw.push([w._stepNo, +G.g.night.toFixed(3), +(w.twilight || 0).toFixed(3)]); }
  const at = (pred) => tw.filter(pred).map((r) => r[2]);
  const dayBefore = at((r, k) => k === 0)[0];              // 950 passi prima: 0
  const rising = tw.slice(2, 18).map((r) => r[2]);           // negli ultimi 900 passi: sale
  const nightFull = at((r) => r[1] >= 1);
  out.crepuscolo = { primaDi900: dayBefore, sale: rising.every((v, k) => k === 0 || v >= rising[k - 1]) && rising.at(-1) > 0.85,
                     notte: Math.max(0, ...nightFull), dopo: tw.at(-1)[2] };
  out.crepuscolo.ok = dayBefore === 0 && out.crepuscolo.sale && out.crepuscolo.notte === 0 && out.crepuscolo.dopo === 0
    && tw.some((r, k) => k > 10 && r[1] <= 0 && r[2] > 0.5); // subito dopo l'alba ancora rosa
  // nuvole
  G.g.night = 0; M.al.set(0, 3000); M.al.set(1, -1); run(2);
  const blobs = G.ambience.cloudBlobs(w, cam);
  const big = G.ambience.cloudBlobs(w, { x: 0, y: 0, w: w.roomW, h: w.roomH });
  const sh = (x, y) => G.ambience.shadeAt(big, x, y);
  // il pieno: il punto piu' scuro attorno al centro di una sagoma
  const b = big.find((q) => q.rot !== 0 && q.sx < 0) || big[0];
  let centro = 1;
  for (let dy = -200; dy <= 200; dy += 20) for (let dx = -400; dx <= 400; dx += 20) centro = Math.min(centro, G.ambience.shadeAt([b], b.x + dx, b.y + dy));
  const fuori = G.ambience.shadeAt([b], b.x + b.g.W * Math.abs(b.sx) * 0.55, b.y);
  out.nuvole = { vicine: blobs.length, tutte: big.length, sprite: [...new Set(big.map((q) => q.spr))].length,
                 centro: +centro.toFixed(3), fuori: +fuori.toFixed(3) };
  G.g.night = 1; out.nuvole.notte = G.ambience.cloudBlobs(w, { x: 0, y: 0, w: w.roomW, h: w.roomH }).length; G.g.night = 0;
  out.nuvole.ok = out.nuvole.tutte > 5 && out.nuvole.sprite >= 4 && Math.abs(out.nuvole.centro - 0.6) < 0.01 // §9.89: alpha 0,4
    && out.nuvole.fuori === 1 && out.nuvole.notte === 0;
  // pioggia: cielo coperto in pochi secondi, niente macchie; smesso, tornano
  const all = () => G.ambience.cloudBlobs(w, { x: 0, y: 0, w: w.roomW, h: w.roomH }).length;
  G.g.raining = 1; run(30); const mezzo = +(w.overcast || 0).toFixed(2); run(400);
  out.pioggia = { dopo05s: mezzo, coperto: +(w.overcast || 0).toFixed(3), macchie: all() };
  G.g.raining = 0; run(400);
  out.pioggia.smesso = +(w.overcast || 0).toFixed(3); out.pioggia.macchieDopo = all();
  out.pioggia.ok = mezzo > 0.2 && mezzo < 0.9 && out.pioggia.coperto === 1 && out.pioggia.macchie === 0
    && out.pioggia.smesso === 0 && out.pioggia.macchieDopo > 5;
  // pioggia graduale (§9.91): le gocce nascono solo col cielo del tutto
  // coperto, crescono in 300 passi; smesso, calano in 300 col cielo coperto,
  // poi si rasserena e il sistema si toglie a gocce finite
  const born = () => (M.rain ? M.rain.parts.filter((q) => q.age === 1).length : 0);
  const gr = { coperto: -1, primaGoccia: -1, piena: -1 };
  let first60 = 0, full60 = 0;
  // §9.92: un edificio di legno che brucia (onfire rimesso a 1 a ogni passo):
  // la pioggia lo spegne solo con le gocce ad almeno meta'
  const wood = [...w.all("ally_wooden")].find((q) => q.alive);
  const out_ = [];
  const fire = (s) => { if (wood.onfire === 0) out_.push([s, M.rain ? +M.rain.level.toFixed(3) : 0, G.g.raining]); wood.onfire = 1; };
  wood.onfire = 1;
  M.alarm(4);
  for (let s = 1; s <= 1000; s++) {
    run(1); fire(s);
    const n = born();
    if (gr.coperto < 0 && w.overcast === 1) gr.coperto = s;
    if (gr.primaGoccia < 0 && n > 0) gr.primaGoccia = s;
    if (gr.primaGoccia > 0 && s < gr.primaGoccia + 60) first60 += n;
    if (gr.piena < 0 && M.rain.level === 1) gr.piena = s;
    if (gr.piena > 0 && s >= gr.piena + 100 && s < gr.piena + 160) full60 += n;
  }
  gr.inizioSuPieno = +(first60 / Math.max(1, full60)).toFixed(3);
  M.stopRain();
  let finite = -1, copertoAlloStop = 1;
  const stopAt = out_.length;
  for (let s = 1; s <= 900 && finite < 0; s++) { run(1); fire(1000 + s); if (M.rain) copertoAlloStop = Math.min(copertoAlloStop, w.overcast); else finite = s; }
  for (let s = 1; s <= 700; s++) { run(1); fire(2000 + s); }
  wood.onfire = 0; if (wood.firestarted === 1) { wood.firestarted = 0; }
  const spenti = out_.filter((e) => e[0] < 1000), dopo = out_.slice(stopAt);
  gr.spegneDa = spenti.length ? spenti[0] : null;                 // [passo, livello, raining]
  gr.spegneFinoA = dopo.length ? dopo[dopo.length - 1] : null;
  gr.spegneDopoSereno = dopo.filter((e) => e[0] > 1000 + finite).length;
  gr.calo = finite; gr.copertoMentreCala = copertoAlloStop; gr.sereno = w.overcast;
  gr.sistemaTolto = !P.systems.some((q) => q.depth === -9000 && q.alive);
  out.graduale = gr;
  gr.ok = gr.coperto > 300 && gr.primaGoccia >= gr.coperto && gr.primaGoccia <= gr.coperto + 60 // all'inizio ~0,03 gocce a passo
    && Math.abs(gr.piena - gr.coperto - 300) <= 2 && gr.inizioSuPieno < 0.15
    && Math.abs(gr.calo - 300) <= 2 && gr.copertoMentreCala === 1 && gr.sereno === 0 && gr.sistemaTolto
    && gr.spegneDa && gr.spegneDa[0] > gr.primaGoccia && gr.spegneDa[1] >= 0.5 && gr.spegneDa[1] < 0.54
    && gr.spegneFinoA && gr.spegneFinoA[2] === 0 && gr.spegneFinoA[1] >= 0.5 && gr.spegneFinoA[1] < 0.54 && gr.spegneDopoSereno === 0;
  // vento (§9.90): nuvole a 0,8-1,5 px a passo, pioggia piu' inclinata, erba
  // che ondeggia di piu' e si piega a ovest
  const wide = { x: -3000, y: -3000, w: w.roomW + 6000, h: w.roomH + 6000 };
  const cloudMove = (k) => {
    G.g.wind = k; const t0 = w._stepNo, a = G.ambience.cloudBlobs(w, wide)[0];
    w._stepNo = t0 + 100; const b = G.ambience.cloudBlobs(w, wide)[0]; w._stepNo = t0;
    return +(Math.hypot(b.x - a.x, b.y - a.y) / 100).toFixed(2);
  };
  const rainDirs = (k) => {
    G.g.wind = k; G.g.raining = 0; M.alarm(4); M.rain.level = 1; w.overcast = 1; run(3); // §9.91: gia' piena
    const d = M.rain.parts.map((q) => q.dir);
    P.systemDestroy(M.rain); M.rain = null; G.g.raining = 0; w.overcast = 0;
    return [+Math.min(...d).toFixed(1), +Math.max(...d).toFixed(1)];
  };
  const grass = P.systems.find((q) => q.cat === "grass" && q.parts.some((x) => x.t.orientation[3] === 4)).parts.find((x) => x.t.orientation[3] === 4);
  const sway = (k) => {
    P.wind = k; const age = grass.age, a = [];
    for (let s = 0; s < 400; s++) { grass.age = s; a.push(P.angle(grass) - grass.ang); }
    grass.age = age;
    return { ampiezza: +((Math.max(...a) - Math.min(...a)) / 2).toFixed(2), piega: +((Math.max(...a) + Math.min(...a)) / 2).toFixed(2) };
  };
  out.vento = { nuvole: [cloudMove(0), cloudMove(1)], pioggia: [rainDirs(0), rainDirs(1)], erba: [sway(0), sway(1)] };
  const V = out.vento;
  out.vento.ok = Math.abs(V.nuvole[0] - 0.8) < 0.02 && Math.abs(V.nuvole[1] - 1.5) < 0.02
    && V.pioggia[0][0] >= 250 && V.pioggia[0][1] <= 260 && V.pioggia[1][0] >= 235 && V.pioggia[1][1] <= 245
    && Math.abs(V.erba[0].ampiezza - 4) < 0.1 && Math.abs(V.erba[0].piega) < 0.1
    && Math.abs(V.erba[1].ampiezza - 6.4) < 0.15 && Math.abs(V.erba[1].piega - 3) < 0.15;
  G.g.wind = 0.5;
  // camini
  const CH = { 1: [-2, -113], 2: [21, -106], 4: [-27, -120], 6: [42, -128] };
  const hs = [1, 2, 3, 4, 5, 6].map((t, k) => { const h = w.create("casa", X - 600 + k * 230, Y - 80); h.sprite_index = "c" + t + "s"; w.moved(h); return [t, h]; });
  const births = new Map(hs.map(([t]) => [t, []]));
  for (let k = 0; k < 300; k++) {
    run(1);
    const s = P.systems.find((q) => q.depth === -1e7);
    if (!s) continue;
    for (const q of s.parts) if (q.age === 1) {
      const [t, h] = hs.reduce((a, c) => (Math.abs(c[1].x - q.x) < Math.abs(a[1].x - q.x) ? c : a));
      births.get(t).push(CH[t] ? Math.hypot(q.x - (h.x + CH[t][0]), q.y - (h.y + CH[t][1] - 4)) : -1);
    }
  }
  out.camini = Object.fromEntries([...births].map(([t, l]) => [t, l.length ? Math.round(Math.max(...l)) : null]));
  out.camini.ok = [1, 2, 4, 6].every((t) => births.get(t).length > 0 && Math.max(...births.get(t)) <= 8)
    && births.get(3).length === 0 && births.get(5).length === 0;
  for (const [, h] of hs) w.destroy(h);
  // crollo
  const mat0 = w.number("sfx_mattone");
  const c = w.create("caserma", X + 300, Y + 150); run(5);
  const sys0 = P.systems.length;
  c.life = 0; run(3);
  out.crollo = { detriti: w.number("sfx_mattone") - mat0, polvere: P.systems.filter((s) => s.depth === -(c.y) - 60).reduce((n, s) => n + s.parts.length, 0) };
  out.crollo.ok = out.crollo.detriti >= 4 && out.crollo.polvere >= 10;
  // polvere in corsa
  const u = w.create("ally_cavaliere", X - 500, Y + 250); run(3);
  for (const o of w.all("ally_unit")) o.selected = 0;
  u.selected = 1; G.g.sel = 1; G.g.milsel = 1;
  const input = w.input, tx = X + 400, ty = Y + 250;
  input.x = (tx - cam.x) * cam.cssW / cam.w; input.y = (ty - cam.y) * cam.cssH / cam.h; input.inside = true;
  input._mr[1] = true; run(1); u.selected = 0;
  let trail = 0;
  for (let k = 0; k < 90; k++) { run(1); const s = P.systems.find((q) => q.depth === 1e9); if (s) trail = Math.max(trail, s.parts.length); }
  out.polvere = { sbuffi: trail, ok: trail >= 3 };
  // per il salvataggio: una casa col camino vicino alla view
  const h = w.create("casa", X, Y - 80); h.sprite_index = "c1s"; w.moved(h);
  run(120);
  return out;
}).catch((e) => ({ errore: { ok: false, msg: e.message } }));
// salvataggio: salvato e ricaricato (?load=slot, una pagina nuova), il fumo riprende
await page.evaluate(() => window.__pause.actions.saveGame());
await page.goto(`${base}/index.html?room=match&load=slot&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
res.salvataggio = await page.evaluate(() => {
  const G = window.__game, w = G.world, P = w.particles;
  let n = 0;
  for (let k = 0; k < 300; k++) { G.advance(1); const s = P.systems.filter((q) => q.depth === -1e7); for (const q of s) for (const x of q.parts) if (x.age === 1) n++; }
  return { sbuffi: n, ok: n > 0 };
});
let ok = errs.length === 0;
for (const [k, v] of Object.entries(res)) { console.log(k.padEnd(12), JSON.stringify(v), v.ok ? "" : "NON VA"); ok = ok && v.ok; }
if (errs.length) console.log("errori:", errs.slice(0, 2).join(" "));
await browser.close();
console.log(ok ? "ok" : "NON VA");
process.exit(ok ? 0 : 1);
