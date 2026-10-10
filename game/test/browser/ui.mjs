// Controllo dell'interfaccia in tutte le lingue (§9.27): intercetta i testi,
// i riquadri e le icone disegnati nell'interfaccia (Draw GUI e menu di
// pausa) e per ogni schermata segnala:
//   fuori    = un testo che esce dallo schermo
//   sborda   = un testo che esce dal riquadro in cui sta (il piu' piccolo
//              riquadro pieno che contiene il centro del testo)
//   testi    = due testi che si sovrappongono
//   icona    = un testo sopra un'icona (ico_*, ritratti capoccia_*)
//   glifi    = caratteri che il font non ha (non si disegnano)
// Schermate: menu (titolo, partite salvate, campagna coi tre livelli,
// lucchetto), in partita (pannelli, obiettivi in ogni livello e fase, ogni
// suggerimento e dialogo, ogni pulsante col puntatore sopra: costruzione,
// produzione, comportamento, schede di unita' ed edifici selezionati,
// selezione multipla), menu di pausa (tre pagine), vittoria e sconfitta.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/ui.mjs [lingue] [larghezzaxaltezza]
//   (p.es. "it,de" 1024x600; di base tutte e sei, 1280x720; SHOTS=cartella:
//   uno screenshot per ogni schermata con problemi)
//
// Playwright come in soak.mjs (PLAYWRIGHT_MODULE se non e' nel progetto).
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [langArg = "en,it,es,pt,de,fr", sizeArg = "1280x720"] = process.argv.slice(2);
const [VW, VH] = sizeArg.split("x").map(Number);
const base = process.env.BASE || "http://localhost:8123";
const shots = process.env.SHOTS || "";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

// strumenti installati nella pagina: registrazione dei disegni e controlli
const INSTALL = () => {
  const G = window.__game, w = G.world, d = w.gfx, r = G.r, cam = G.cam;
  const rec = { on: false, texts: [], boxes: [], icons: [] };
  const P = () => r.proj || [0, 0, cam.cssW, cam.cssH];
  const gui = () => { const p = P(); return Math.abs(p[1]) < 0.5 && Math.abs(p[3] - cam.cssH) < 1 && Math.abs(p[2] - cam.cssW) < 1; };
  const sx = (x) => x - P()[0];
  const wrap = (name, fn) => { const o = d[name].bind(d); d[name] = function (...a) { if (rec.on && gui()) try { fn.apply(this, a); } catch (e) { /* solo misura */ } return o(...a); }; };
  wrap("textExt", (x, y, str, sep, width, scale = 1) => {
    const f = d._font();
    if (!f || d.alpha < 0.05) return;
    const s = String(str);
    if (!s.trim()) return;
    const lines = d._lines(s, sep, width === undefined || width < 0 ? width : width / scale);
    const lh = (sep === undefined || sep < 0 ? f.height : sep) * scale;
    const total = lines.length * lh;
    const wmax = Math.max(...lines.map((l) => d._width(l, f))) * scale;
    const y0 = d.valign === "middle" ? y - total / 2 : d.valign === "bottom" ? y - total : y;
    const x0 = d.halign === "center" ? x - wmax / 2 : d.halign === "right" ? x - wmax : x;
    // (le righe sono gia' ridotte ai caratteri del font dove si puo': ß -> ss, draw.js plain)
    const missing = [...new Set([...lines.join("")].filter((ch) => !f.glyphs[ch.charCodeAt(0)]))];
    rec.texts.push({ s, font: d.font, x0: sx(x0), y0, x1: sx(x0) + wmax, y1: y0 + total, missing, lines: lines.length });
  });
  const box = (x1, y1, x2, y2, outline) => {
    if (outline || d.alpha < 0.3) return;
    const a = Math.min(x1, x2), b = Math.min(y1, y2), c = Math.max(x1, x2), e = Math.max(y1, y2);
    if (c - a < 30 || e - b < 20 || (c - a >= cam.cssW - 1 && e - b >= cam.cssH - 1)) return;
    rec.boxes.push({ x0: sx(a), y0: b, x1: sx(c), y1: e });
  };
  wrap("roundrectColourExt", (x1, y1, x2, y2, xr, yr, c1, c2, outline) => box(x1, y1, x2, y2, outline));
  wrap("rectangle", (x1, y1, x2, y2, outline) => box(x1, y1, x2, y2, outline));
  const icon = (name, sub, x, y, xs = 1, ys = 1) => {
    if (!/^(ico_|capoccia_)/.test(name)) return;
    const fr = G.assets.frame(name, sub);
    if (!fr) return;
    const [tx, ty, tw, th] = fr.f.trim, o = fr.s.origin;
    const a = x + (tx - o[0]) * xs, b = y + (ty - o[1]) * ys, c = x + (tx + tw - o[0]) * xs, e = y + (ty + th - o[1]) * ys;
    rec.icons.push({ name, x0: sx(Math.min(a, c)), y0: Math.min(b, e), x1: sx(Math.max(a, c)), y1: Math.max(b, e) });
  };
  wrap("sprite", (name, sub, x, y) => icon(name, sub, x, y));
  wrap("spriteExt", (name, sub, x, y, xs, ys) => icon(name, sub, x, y, xs, ys));

  // col menu di pausa la partita si ridisegna sotto, sfocata: conta solo il
  // pannello disegnato sopra
  const dp = G.pause.drawPanel.bind(G.pause);
  G.pause.drawPanel = (...a) => { rec.texts = []; rec.boxes = []; rec.icons = []; return dp(...a); };
  // disegna un fotogramma e controlla
  const issues = [];
  window.UI = {
    G, w, cam, issues,
    stop: null, // STOP: si ferma (eccezione) alla prima schermata che lo contiene, disegnata
    shot(scene, keepEnd = false) {
      // (in partita la vittoria del tutorial puo' scattare da sola: via)
      if (!keepEnd) for (const n of ["victory_manager", "gameover_manager"]) for (const x of [...w.all(n)]) w.destroy(x);
      rec.texts = []; rec.boxes = []; rec.icons = [];
      rec.on = true;
      try { G.loop.render(); } finally { rec.on = false; }
      const W = cam.cssW, H = cam.cssH, out = [];
      const T = rec.texts;
      const short = (s) => (s.length > 60 ? s.slice(0, 57) + "..." : s);
      for (const t of T) {
        if (t.missing.length) out.push({ kind: "glifi", text: short(t.s), font: t.font, chars: t.missing.join("") });
        if (t.x0 < -1 || t.x1 > W + 1 || t.y0 < -2 || t.y1 > H + 2) out.push({ kind: "fuori", text: short(t.s), box: [t.x0, t.y0, t.x1, t.y1].map(Math.round) });
        const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
        let c = null;
        for (const b of rec.boxes) if (cx > b.x0 && cx < b.x1 && cy > b.y0 && cy < b.y1 && (!c || (b.x1 - b.x0) * (b.y1 - b.y0) < (c.x1 - c.x0) * (c.y1 - c.y0))) c = b;
        if (c) {
          const over = Math.max(c.x0 + 2 - t.x0, t.x1 - (c.x1 - 2), c.y0 - 4 - t.y0, t.y1 - (c.y1 + 4));
          if (over > 0) out.push({ kind: "sborda", text: short(t.s), by: Math.round(over), text_box: [t.x0, t.y0, t.x1, t.y1].map(Math.round), panel: [c.x0, c.y0, c.x1, c.y1].map(Math.round) });
        }
      }
      for (let a = 0; a < T.length; a++) for (let b = a + 1; b < T.length; b++) {
        const A = T[a], B = T[b];
        const ix = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), iy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0);
        if (ix <= 3 || iy <= 4) continue;
        if (A.s === B.s && Math.abs(A.x0 - B.x0) < 9 && Math.abs(A.y0 - B.y0) < 9) continue; // stesso testo (alone, contorno)
        out.push({ kind: "testi", a: short(A.s), b: short(B.s), overlap: [Math.round(ix), Math.round(iy)] });
      }
      for (const t of T) for (const i of rec.icons) {
        const ix = Math.min(t.x1, i.x1) - Math.max(t.x0, i.x0), iy = Math.min(t.y1, i.y1) - Math.max(t.y0, i.y0);
        if (ix > 3 && iy > 5) out.push({ kind: "icona", text: short(t.s), icon: i.name, overlap: [Math.round(ix), Math.round(iy)] });
      }
      for (const o of out) issues.push({ scene, ...o });
      if (UI.stop && scene.includes(UI.stop)) throw new Error("STOP");
      return out.length;
    },
    // la finestra di un suggerimento o dialogo (ancorata a un'istanza, in
    // coordinate dello schermo) al centro: si sposta la camera
    centreOn(win) {
      for (let k = 0; k < 3 && win.alive; k++) {
        const s = cam.scaleview;
        cam.x += (win.posx - (cam.cssW / 2 - 190)) * s; cam.y += (win.posy - (cam.cssH / 2 - 80)) * s;
        G.advance(1);
      }
    },
    clearUI() {
      // (chiudere un dialogo puo' crearne un altro o un suggerimento)
      for (let k = 0; k < 6; k++) {
        let n0 = 0;
        for (const n of Object.keys(w.behaviours).filter((q) => /^(hint_|dialogo_)/.test(q))) for (const x of [...w.all(n)]) { w.destroy(x); n0++; }
        if (!n0) break;
      }
    },
    // crea la finestra; se e' fuori dallo schermo sposta la camera della
    // differenza e la ricrea (la posizione dipende dalla camera alla creazione)
    makeWindow(n, x, y) {
      UI.clearUI();
      let h = w.create(n, x, y); G.advance(2);
      const off = () => h.alive && h.posx !== undefined && (h.posx < 10 || h.posx > cam.cssW - 400 || h.posy < 10 || h.posy > cam.cssH - 160);
      if (off()) {
        const s = cam.scaleview;
        cam.x += (h.posx - (cam.cssW / 2 - 190)) * s; cam.y += (h.posy - (cam.cssH / 2 - 80)) * s;
        UI.clearUI(); G.advance(1);
        h = w.create(n, x, y); G.advance(2);
        if (off()) UI.centreOn(h);
      }
      return h;
    },
  };
};

const pageFor = async (lang, room) => {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((l) => {
    try { localStorage.setItem("535.settings", JSON.stringify({ v: 1, settings: { language: l } })); } catch (e) { /* niente */ }
  }, lang);
  await page.goto(`${base}/index.html?room=${room}&nostart=1`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  await page.addStyleTag({ content: "#message{display:none !important}" }); // l'avviso del disegno software (DOM)
  await page.evaluate(INSTALL);
  await page.evaluate(() => { window.__game.advance(2); });
  return { page, errs };
};

// ---------------------------------------------------------------- schermate

const MENU = () => {
  const { G, w } = UI;
  const m = [...w.instances].find((i) => i.alive && "lvlshown" in i);
  const g = G.g;
  g.campagna = 0; if (m) m.loadmenu = 0;
  UI.shot("menu: titolo");
  for (const k of ["hover", "campagnahover", "loadhover", "fullhover"]) if (m) { m[k] = 1; UI.shot("menu: titolo, " + k); m[k] = 0; }
  if (m) { m.loadmenu = 1; UI.shot("menu: partite salvate"); m.loadmenu = 0; }
  g.campagna = 1; g.unlock = 3;
  for (let n = 1; n <= 3; n++) if (m) { m.lvlhover = n; m.lvlshown = n; UI.shot("menu: campagna, livello " + n); }
  if (m) { m.lvlhover = 0; m.sblocco = 1; UI.shot("menu: lucchetto"); m.sblocco = 0; }
};

const INGAME = () => {
  const { G, w, cam } = UI, g = G.g;
  UI.clearUI();
  for (const e of [...w.all("enemy_unit")]) w.destroy(e);
  g.obj = 1; g.fogville = 0;
  const c = w.all("centro").next().value || { x: cam.x + cam.w / 2, y: cam.y + cam.h / 2 };
  const at = (k) => [c.x - 500 + (k % 6) * 150, c.y + 300 + Math.floor(k / 6) * 120];
  const UNITS = ["ally_omino", "ally_warrior", "ally_picchiere", "ally_arciere", "ally_cavaliere", "ally_catapulta", "ally_ariete"];
  const units = UNITS.map((n, k) => { const [x, y] = at(k); return w.create(n, x, y); });
  const BUILD = ["caserma", "stalla", "castello", "magazzino", "barn", "torre", "chiesa", "casa"];
  const blds = BUILD.map((n, k) => w.create(n, c.x - 1400 + k * 380, c.y - 700));
  // un nemico per le schede nemiche
  const foe = w.create("enemy_warrior", c.x + 900, c.y + 300); foe.visible = true;
  G.advance(3);
  cam.x = c.x - cam.w / 2; cam.y = c.y - cam.h / 2;
  const desel = () => { for (const u of w.all("ally_unit")) u.selected = 0; for (const b of w.all("ally_build")) b.selected = 0; foe.selected = 0; };
  const hovers = (label) => {
    // ogni istanza con un pulsante (hover) disegnato nell'interfaccia
    for (const i of [...w.instances]) {
      if (!i.alive || !("hover" in i) || i.object.startsWith("ally_") || i.object.startsWith("enemy_")) continue;
      const beh = w.behaviours[i.object];
      if (!beh || !beh.drawGUI) continue;
      const old = i.hover; i.hover = 1;
      UI.shot(label + ": " + i.object + " col puntatore");
      i.hover = old;
    }
  };
  UI.shot("partita: pannelli e obiettivi");
  // pannello delle risorse col puntatore (lavoratori per risorsa)
  w.input.x = 120; w.input.y = 80; w.input.inside = true;
  UI.shot("partita: pannello risorse col puntatore");
  w.input.x = cam.cssW / 2; w.input.y = cam.cssH / 2;
  // un'unita' alla volta selezionata (scheda), poi i suoi pulsanti
  for (const u of units) {
    desel(); u.selected = 1; G.advance(2);
    UI.shot("selezionato " + u.object);
    hovers("selezionato " + u.object);
  }
  desel(); for (const u of units) u.selected = 1; G.advance(2);
  UI.shot("selezione multipla");
  desel(); units[1].selected = 1; units[2].selected = 1; G.advance(2);
  UI.shot("selezione multipla, fanteria");
  for (const b of [w.all("centro").next().value, ...blds]) {
    if (!b) continue;
    desel(); b.selected = 1; G.advance(2);
    UI.shot("selezionato " + b.object);
    hovers("selezionato " + b.object);
  }
  desel(); foe.selected = 1; G.advance(1);
  UI.shot("selezionato nemico");
  desel(); G.advance(2);
  // suggerimenti e dialoghi, uno alla volta
  const names = Object.keys(w.behaviours);
  for (const n of names.filter((k) => k.startsWith("hint_"))) {
    UI.makeWindow(n, units[0].x, units[0].y);
    UI.shot("suggerimento " + n);
  }
  // (dialogo_statua parla dalla statua di lvl01: si prova li')
  for (const n of names.filter((k) => k.startsWith("dialogo_") && (k !== "dialogo_statua" || w.number("o_statua1_real")))) {
    const dlg = UI.makeWindow(n, units[1].x, units[1].y);
    if (dlg.alive) UI.shot("dialogo " + n);
  }
  UI.clearUI();
  // menu di pausa: le tre pagine
  const P = G.pause;
  P.open(); P.dirty = true; UI.shot("pausa");
  P.submenu = "graphics"; P.dirty = true; UI.shot("pausa: opzioni grafiche");
  P.submenu = "saves"; P.dirty = true; UI.shot("pausa: salva e carica");
  P.close();
};

const OBJECTIVES = (room) => {
  const { G, w } = UI, g = G.g;
  UI.clearUI(); g.obj = 1;
  if (room === "lvl01") {
    UI.shot("obiettivi lvl01");
    g.dialogochest = 1; g.lvl01_gate = 1; UI.shot("obiettivi lvl01, tutti");
  }
  if (room === "lvl02") { UI.shot("obiettivi lvl02"); g.liberati = 7; UI.shot("obiettivi lvl02, 7 liberati"); }
  if (room === "lvl03") {
    UI.shot("obiettivi lvl03, strada");
    g.l3 = { phase: 2, left: 20 * 3600, life: 3000, slife: 3000, baseKnown: 0 }; UI.shot("obiettivi lvl03, difesa");
    g.l3 = { phase: 2, left: 61 * 60, life: 1888, slife: 3000, baseKnown: 1 }; UI.shot("obiettivi lvl03, base nemica");
  }
  if (room === "match") { g.basidistrutte = 2; g.waves = 12; g.hours = 1; g.minutes = 23; g.seconds = 45; UI.shot("obiettivi tutorial"); }
};

const ENDINGS = (room) => {
  const { G, w } = UI, g = G.g;
  UI.clearUI();
  g.hours = 1; g.minutes = 23; g.seconds = 45; g.basidistrutte = 3;
  const v = w.create("victory_manager", 0, 0); v.fogalpha = 1; v.clicloc = 1;
  UI.shot("vittoria " + room, true); w.destroy(v);
  const o = w.create("gameover_manager", 0, 0); o.fogalpha = 1;
  UI.shot("sconfitta " + room, true); w.destroy(o);
};

// ---------------------------------------------------------------- giro

const all = [];
for (const lang of langArg.split(",")) {
  const runs = [["menu", MENU], ["match", INGAME], ["match", OBJECTIVES], ["match", ENDINGS], ["lvl01", OBJECTIVES], ["lvl02", OBJECTIVES], ["lvl03", OBJECTIVES], ["lvl03", ENDINGS]];
  for (const [room, fn] of runs) {
    const { page, errs } = await pageFor(lang, room);
    if (process.env.STOP) await page.evaluate((st) => { UI.stop = st; }, process.env.STOP);
    let stopped = false;
    try { await page.evaluate(fn, room); } catch (e) { if (!String(e).includes("STOP")) throw e; stopped = true; }
    if (stopped) {
      await page.screenshot({ path: process.env.STOPSHOT || "stop.png" });
      console.log("fermato a", process.env.STOP, "->", process.env.STOPSHOT || "stop.png");
      await page.close(); await browser.close(); process.exit(0);
    }
    const issues = await page.evaluate(() => UI.issues);
    for (const i of issues) all.push({ lang, room, ...i });
    if (shots && issues.length) {
      // uno screenshot per schermata con problemi: la si rifa' e la si fotografa
      const scenes = [...new Set(issues.map((i) => i.scene))].slice(0, 6);
      const fs = await import("node:fs");
      fs.mkdirSync(shots, { recursive: true });
      for (const sc of scenes) {
        const name = `${shots}/${lang}_${room}_${sc.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.png`;
        await page.screenshot({ path: name });
      }
    }
    for (const e of errs) all.push({ lang, room, scene: "-", kind: "errore", text: e });
    await page.close();
  }
}
// riassunto: per tipo e schermata, con le lingue
const key = (i) => `${i.kind} | ${i.room} | ${i.scene} | ${i.text || i.a || ""}${i.b ? " / " + i.b : ""}${i.icon ? " / " + i.icon : ""}`;
const groups = new Map();
for (const i of all) { const k = key(i); const g = groups.get(k) || { ...i, langs: [] }; if (!g.langs.includes(i.lang)) g.langs.push(i.lang); groups.set(k, g); }
for (const g of [...groups.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.scene.localeCompare(b.scene))) {
  const { lang, room, scene, kind, langs, ...rest } = g;
  console.log(`${kind.padEnd(7)} [${langs.join(",")}] ${room} / ${scene} ${JSON.stringify(rest)}`);
}
console.log(all.length ? `${groups.size} problemi diversi (${all.length} in tutto)` : "nessun problema");
await browser.close();
process.exit(all.length ? 1 : 0);
