// [§9.180] Prova nel browser dell'editor di mappe (lo scheletro): dal menu,
// "Single player" -> "Map editor" apre ?room=editor; la mappa vuota e la
// colonna si disegnano senza errori; un clic su uno strumento lo sceglie, i
// tasti 1-4 anche; la rotella fa lo zoom tenendo fermo il punto sotto il
// puntatore; il tasto centrale trascina la vista; [§9.181] "Apri mappa"
// carica Padania col motore del gioco, e da lontano la si vede tutta;
// [§9.182] solo le schermaglie come modelli; Inserisci mette una miniera,
// annulla e ripeti; [§9.183] gli stili col tasto S; [§9.184] impostazioni,
// simmetria, salva e apri (browser e file), elimina; [§9.185] il pennello
// (bosco, gomma, selciato) e la copertina; [§9.187] la polilinea, "salvare
// le modifiche?"; [§9.188] i file collegati ("Salva con nome" finta), "Prova
// mappa" e ritorno; Sposta la sceglie, la trascina, Canc la toglie; uscendo
// con la mappa cambiata si chiede conferma; Esc torna al menu.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/editor.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const W = 1600, H = 900;
const page = await browser.newPage({ viewport: { width: W, height: H } });
// [§9.188] le finestre "Salva con nome" e "Apri" di File System Access, finte
// (quelle vere sono del sistema): un file in memoria per nome; mode "ok",
// "deny" (come nell'iframe di un portale: si scarica), "abort" (annullata)
await page.addInitScript(() => {
  window.__fs = { mode: "ok", files: {}, writes: 0, openName: null };
  const handle = (name) => ({
    kind: "file", name, queryPermission: async () => "granted", requestPermission: async () => "granted",
    createWritable: async () => { const parts = []; return { write: async (d) => { parts.push(d); }, close: async () => { window.__fs.files[name] = new Blob(parts); window.__fs.writes++; } }; },
    getFile: async () => new File([window.__fs.files[name] || new Blob([])], name),
  });
  const fail = () => {
    if (window.__fs.mode === "deny") throw new DOMException("Cross origin sub frames aren't allowed to show a file picker.", "SecurityError");
    if (window.__fs.mode === "abort") throw new DOMException("The user aborted a request.", "AbortError");
  };
  window.showSaveFilePicker = async ({ suggestedName }) => { fail(); return handle(suggestedName); };
  window.showOpenFilePicker = async () => { fail(); return [handle(window.__fs.openName)]; };
});
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const logs = []; page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(m.text()); });
const click = async (x, y, button = "left") => {
  await page.mouse.move(x, y); await page.waitForTimeout(150);
  await page.mouse.down({ button }); await page.waitForTimeout(80); await page.mouse.up({ button }); await page.waitForTimeout(150);
};
const res = {};
// [§9.188] il pannello "Salva mappa": dove (nel browser, su file), poi Salva
const saveIn = async ({ browser: inBrowser, file }) => {
  await page.waitForSelector('.net-panel [data-net="save"]');
  for (const [k, want] of [["browser", inBrowser], ["file", file]]) {
    const b = page.locator(`.net-panel [data-net="where-${k}"]`);
    if ((await b.evaluate((el) => el.classList.contains("primary"))) !== want) await b.click();
  }
  await page.locator('.net-panel [data-net="save"]').click();
};
let ok = true;
const check = (name, v) => { res[name] = v; if (!v) ok = false; };

// il menu: la colonna dei pulsanti (menu.js titleButtons: alti 70, 20 fra
// l'uno e l'altro, l'ultimo a 100 px dal fondo)
await page.goto(`${base}/index.html?room=menu`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const colTop = (n) => H - 100 - n * 70 - (n - 1) * 20;
await click(W / 2, colTop(4) + 90 + 35); // "Single player" (secondo di quattro)
await click(W / 2, colTop(3) + 180 + 35); // "Map editor" (terzo di tre)
await page.waitForURL(/room=editor/, { timeout: 20000 });
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
check("aperto dal menu", true);

// uno strumento col clic, uno coi tasti
const L = await page.evaluate(() => window.__editor.layout());
const btn = (key) => L.buttons.find((b) => b.key === key);
await click(btn("brush").x, btn("brush").y);
check("clic sul pennello", (await page.evaluate(() => window.__editor.ed.tool)) === "brush");
await page.mouse.move(800, 400);
await page.keyboard.press("Digit4");
await page.waitForTimeout(150);
check("tasto 4: inserisci", (await page.evaluate(() => window.__editor.ed.tool)) === "insert");

// la rotella: lo zoom cambia, il punto sotto il puntatore resta li'
const before = await page.evaluate(() => ({ s: window.__editor.view.scale, p: window.__editor.view.toRoom(800, 400) }));
for (let k = 0; k < 3; k++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(80); }
await page.waitForTimeout(200);
const after = await page.evaluate(() => ({ s: window.__editor.view.scale, p: window.__editor.view.toRoom(800, 400) }));
check("zoom indietro", after.s > before.s * 1.3);
check("punto fermo", Math.abs(after.p[0] - before.p[0]) < 2 && Math.abs(after.p[1] - before.p[1]) < 2);

// il tasto centrale trascina la vista: la mappa segue il puntatore
const v0 = await page.evaluate(() => [window.__editor.view.x, window.__editor.view.y, window.__editor.view.scale]);
await page.mouse.move(900, 500); await page.waitForTimeout(100);
await page.mouse.down({ button: "middle" });
for (let k = 1; k <= 5; k++) { await page.mouse.move(900 - 40 * k, 500 - 20 * k); await page.waitForTimeout(60); }
await page.waitForTimeout(120); // (l'ultimo spostamento letto da un passo prima di lasciare il tasto)
await page.mouse.up({ button: "middle" });
await page.waitForTimeout(150);
const v1 = await page.evaluate(() => [window.__editor.view.x, window.__editor.view.y]);
check("trascinata col centrale", Math.abs(v1[0] - v0[0] - 200 * v0[2]) < 2 && Math.abs(v1[1] - v0[1] - 100 * v0[2]) < 2);

// [§9.181, §9.182] "Apri mappa": le schermaglie come modelli; Padania dal
// pannello, disegnata col motore; da lontano tutta la mappa col suolo a
// risoluzione ridotta (pochi blocchi)
await click(btn("open").x, btn("open").y);
const O = await page.evaluate(() => window.__editor.openLayout());
check("modelli: le cinque schermaglie", O.rows.length === 5 && O.rows.every((q) => q.room.startsWith("sk_")));
const row = O.rows.find((q) => q.room === "sk_padus");
await click((row.x1 + row.x2) / 2, (row.y1 + row.y2) / 2);
await page.waitForFunction(() => window.__editor.ed.label && !window.__editor.ed.loading, null, { timeout: 120000 });
await page.waitForTimeout(500);
const padus = await page.evaluate(() => {
  const E = window.__editor, w = E.scene.world;
  return { w: E.scene.map.width, n: w.instances.length, alberi: w.instances.filter((i) => i.object === "albero" && i.visible && i.sprite_index).length,
           fiumi: w.rivers.length, strade: w.roads.length, saltati: E.scene.skipped.size, nome: E.scene.map.name };
});
res.padus = padus;
check("Padania caricata come mappa nuova", padus.w === 7000 && padus.n > 700 && padus.alberi > 500 && padus.fiumi === 1
      && padus.strade > 5 && padus.saltati === 0 && padus.nome === "");

const far = await page.evaluate(async () => {
  const E = window.__editor, v = E.view, s0 = v.scale, c0 = [v.x + v.w / 2, v.y + v.h / 2];
  v.zoomAt(8, v.cssW / 2, v.cssH / 2); v.centre(3500, 3500);
  for (let k = 0; k < 3; k++) { E.render(); await new Promise((r) => requestAnimationFrame(r)); }
  const out = { tutta: v.x <= 0 && v.y <= 0 && v.x + v.w >= 7000 && v.y + v.h >= 7000, blocchi: E.scene.ground.chunks.size, disegnati: E.scene.world.drawn };
  v.zoomAt(s0, v.cssW / 2, v.cssH / 2); v.centre(...c0);
  return out;
});
res.lontano = far;
check("da lontano tutta la mappa, pochi blocchi", far.tutta && far.blocchi <= 48 && far.disegnati > 500);

// [§9.182] Inserisci: la scheda delle risorse, la miniera d'oro, un clic sulla
// mappa; annulla e ripeti
const count = () => page.evaluate(() => window.__editor.scene.map.instances.length);
const n0 = await count();
await click(btn("insert").x, btn("insert").y);
await page.waitForFunction(() => window.__editor.catalog() === "ready", null, { timeout: 120000 });
let P = await page.evaluate(() => window.__editor.palette());
const mid = (q) => [(q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2];
await click(...mid(P.tabs[1]));
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.cells[0]));
check("scelta la miniera", await page.evaluate(() => { const E = window.__editor, p = E.ed.pick; return !!p && p.cat === 1 && p.i === 0; }));
await click(800, 380);
const placed = await page.evaluate(() => { const m = window.__editor.scene.map.instances; return m[m.length - 1]; });
check("miniera messa sotto il puntatore", (await count()) === n0 + 1 && placed.object === "miniera_oro"
      && Math.abs(placed.x - (await page.evaluate(() => window.__editor.view.toRoom(800, 380)[0]))) < 2);
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await page.waitForTimeout(150);
check("annulla", (await count()) === n0);
await page.keyboard.down("Control"); await page.keyboard.press("KeyY"); await page.keyboard.up("Control"); await page.waitForTimeout(150);
check("ripeti", (await count()) === n0 + 1);
// [§9.183] gli stili: l'albero col terzo sprite (S due volte), una casa col
// secondo stile (S, Maiusc+S, S)
const last = () => page.evaluate(() => { const m = window.__editor.scene.map.instances; return { ...m[m.length - 1] }; });
const choices = await page.evaluate(() => window.__editor.scene.objects.albero.choices);
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.tabs[2]));
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.cells[0]));
await page.mouse.move(700, 330);
await page.keyboard.press("KeyS"); await page.keyboard.press("KeyS"); await page.waitForTimeout(150);
await click(700, 330);
const tree = await last();
check("albero col terzo stile", tree.object === "albero" && tree.sprite === choices[2]);
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.tabs[5]));
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.cells[0]));
await page.mouse.move(1000, 300);
await page.keyboard.press("KeyS"); await page.keyboard.down("Shift"); await page.keyboard.press("KeyS"); await page.keyboard.up("Shift");
await page.keyboard.press("KeyS"); await page.waitForTimeout(150);
await click(1000, 300);
check("casa col secondo stile", (await last()).object === "ocr_02");
await click(700, 300, "right");
check("il destro lascia l'oggetto", (await page.evaluate(() => window.__editor.ed.pick)) === null);
// con "Sposta", S cambia lo stile della casa scelta (e si annulla)
await click(btn("select").x, btn("select").y);
await click(1000, 290);
await page.keyboard.press("KeyS"); await page.waitForTimeout(150);
check("S su una casa scelta", (await last()).object === "ocr_03");
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await page.waitForTimeout(150);
check("annullato lo stile", (await last()).object === "ocr_02");
// via la casa e l'albero (la miniera resta l'ultima voce, come prima)
await page.keyboard.press("Delete"); await page.waitForTimeout(150);
await click(700, 320);
await page.keyboard.press("Delete"); await page.waitForTimeout(150);
check("tolti casa e albero", (await count()) === n0 + 1 && (await last()).object === "miniera_oro");

// Sposta: un clic sulla miniera la sceglie, trascinarla la sposta, Canc la toglie
await click(800, 380);
check("miniera scelta", await page.evaluate(() => { const E = window.__editor, m = E.scene.map.instances; return E.ed.sel.size === 1 && E.ed.sel.has(m[m.length - 1]); }));
const pos0 = await page.evaluate(() => { const m = window.__editor.scene.map.instances; return [m[m.length - 1].x, m[m.length - 1].y]; });
await page.mouse.move(800, 380); await page.waitForTimeout(100); await page.mouse.down();
for (let k = 1; k <= 5; k++) { await page.mouse.move(800 + 20 * k, 380 + 10 * k); await page.waitForTimeout(50); }
await page.mouse.up(); await page.waitForTimeout(200);
const after2 = await page.evaluate(() => { const m = window.__editor.scene.map.instances; return [m[m.length - 1].x, m[m.length - 1].y, window.__editor.view.scale]; });
check("trascinata", Math.abs(after2[0] - pos0[0] - 100 * after2[2]) < 3 && Math.abs(after2[1] - pos0[1] - 50 * after2[2]) < 3);
await page.keyboard.press("Delete"); await page.waitForTimeout(150);
check("Canc la toglie", (await count()) === n0);

// la mappa e' cambiata: "Indietro" chiede se salvare (§9.187): Salva, Non
// salvare, Annulla. Annulla resta; Salva apre il pannello (la mappa non e'
// ancora nel browser) e, salvata, esce
const L2 = await page.evaluate(() => window.__editor.layout());
await click(L2.back[0], L2.back[1]);
check("salvare le modifiche?", await page.evaluate(() => { const c = window.__editor.ed.confirm; return !!c && c.buttons.map((b) => b.label).join() === "Save,Don't save,Cancel"; }));
const C = await page.evaluate(() => window.__editor.confirmLayout());
const at = (R) => [(R[0] + R[2]) / 2, (R[1] + R[3]) / 2];
await click(...at(C.buttons[2]));
check("Annulla: si resta", await page.evaluate(() => !window.__editor.ed.confirm && window.__editor.ready));
await click(L2.back[0], L2.back[1]);
await click(...at(C.buttons[0]));
await page.waitForSelector('.net-panel [data-net="save"]');
await page.fill(".net-panel input", "Uscita");
await saveIn({ browser: true, file: false });
await page.waitForURL(/room=menu/, { timeout: 20000 });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
check("Salva: salvata, poi il menu", true);

// Esc dall'editor senza modifiche: il menu
await page.goto(`${base}/index.html?room=editor`);
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
await page.mouse.move(800, 400);
// Esc: di nuovo il menu
await page.keyboard.press("Escape");
await page.waitForURL(/room=menu/, { timeout: 20000 });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
check("Esc torna al menu", true);

// [§9.184] impostazioni (nome, simmetria diagonale), la miniera e la sua
// gemella, spostate e tolte insieme; salva nel browser (Ctrl+S), riapri dopo
// aver ricaricato la pagina; salva su file e riapri il file; elimina dal browser
const ED = () => window.__editor;
await page.goto(`${base}/index.html?room=editor`);
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
const L3 = await page.evaluate(() => window.__editor.layout()), btn3 = (k) => L3.buttons.find((b) => b.key === k);
await click(btn3("settings").x, btn3("settings").y);
await page.waitForSelector(".net-panel input");
await page.fill(".net-panel input", "Prova editor");
// [§9.186] la CPU: "a scelta del giocatore" di partenza; qui la statica
check("CPU a scelta del giocatore", await page.locator('.net-panel [data-net="difficulty-choice"].primary').count() === 1
      && await page.locator('.net-panel [data-net="style-choice"].primary').count() === 1);
await page.locator('.net-panel [data-net="style-static"]').click();
await page.locator('.net-panel [data-net="apply"]').click();
await page.waitForTimeout(300);
check("impostazioni applicate", await page.evaluate(() => { const m = window.__editor.scene.map; return m.name === "Prova editor" && m.cpu.style === "static" && m.cpu.difficulty === "choice" && !window.__editor.ed.dom; }));
await click(btn3("insert").x, btn3("insert").y);
await page.waitForFunction(() => window.__editor.catalog() === "ready", null, { timeout: 120000 });
// [§9.186] la simmetria e' dello strumento: la riga in fondo al riquadro
const SY = await page.evaluate(() => window.__editor.symLayout());
const symClick = (mode) => click(...mid(SY.opts.find((q) => q.mode === mode)));
await symClick("diagonal");
check("simmetria dello strumento, non della mappa", await page.evaluate(() => window.__editor.ed.sym.insert === "diagonal" && window.__editor.ed.sym.select === "none" && window.__editor.scene.map.symmetry === undefined));
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.tabs[1]));
P = await page.evaluate(() => window.__editor.palette());
await click(...mid(P.cells[0]));
await click(800, 380);
const pair = await page.evaluate(() => { const S = window.__editor.scene, m = S.map.instances; return { n: m.length, twin: S.twinOf(m[0], "diagonal") === m[1] }; });
check("con la simmetria la miniera e la gemella", pair.n === 2 && pair.twin);
await click(btn3("select").x, btn3("select").y);
await symClick("diagonal"); // (anche per "Sposta")
const tw0 = await page.evaluate(() => { const m = window.__editor.scene.map.instances; return [m[1].x, m[1].y, window.__editor.view.scale]; });
await page.mouse.move(800, 380); await page.waitForTimeout(100); await page.mouse.down();
for (let k = 1; k <= 5; k++) { await page.mouse.move(800 + 20 * k, 380 + 10 * k); await page.waitForTimeout(50); }
await page.mouse.up(); await page.waitForTimeout(200);
const tw1 = await page.evaluate(() => { const S = window.__editor.scene, m = S.map.instances; return [m[1].x, m[1].y, S.twinOf(m[0], "diagonal") === m[1]]; });
check("la gemella si sposta a specchio", Math.abs(tw1[0] - tw0[0] + 100 * tw0[2]) < 3 && Math.abs(tw1[1] - tw0[1] + 50 * tw0[2]) < 3 && tw1[2]);
await page.keyboard.press("Delete"); await page.waitForTimeout(150);
check("Canc toglie anche la gemella", (await page.evaluate(() => window.__editor.scene.map.instances.length)) === 0);
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await page.waitForTimeout(150);
check("annulla le rimette tutte e due", (await page.evaluate(() => window.__editor.scene.map.instances.length)) === 2);
// Ctrl+S: la prima volta il pannello, solo nel browser
await page.mouse.move(700, 300);
await page.keyboard.down("Control"); await page.keyboard.press("KeyS"); await page.keyboard.up("Control");
check("il pannello: nel browser e su file, di partenza", await page.waitForSelector('.net-panel [data-net="save"]').then(() => page.evaluate(() =>
  ["browser", "file"].every((k) => document.querySelector(`.net-panel [data-net="where-${k}"]`).classList.contains("primary")))));
await saveIn({ browser: true, file: false });
await page.waitForFunction(() => window.__editor.ed.mapId && !window.__editor.ed.dom && !window.__editor.dirty(), null, { timeout: 10000 });
check("salvata nel browser", true);
// [§9.188] su file dove "Salva con nome" e' rifiutata (l'iframe di un portale): il download
await page.evaluate(() => { window.__fs.mode = "deny"; });
await click(btn3("save").x, btn3("save").y);
await page.waitForSelector('.net-panel [data-net="save"]');
const [dl] = await Promise.all([page.waitForEvent("download"), saveIn({ browser: false, file: true })]);
const { tmpdir } = await import("node:os"), { join } = await import("node:path"), fs = await import("node:fs"), zlib = await import("node:zlib");
const file = join(tmpdir(), "editor-prova-" + process.pid + ".dvmap");
await dl.saveAs(file);
const json = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
check("file .dvmap", dl.suggestedFilename() === "dustveil-Prova-editor.dvmap" && json.format === "535-scenario" && json.instances.length === 2 && json.symmetry === undefined && json.cpu.style === "static");
check("scaricato: non collegato", await page.evaluate(() => !window.__editor.ed.file));
// [§9.188] "Salva con nome": il file resta collegato; Ctrl+S lo riscrive (e il
// browser), senza pannello; il file si riapre collegato
await page.evaluate(() => { window.__fs.mode = "ok"; });
await click(btn3("save").x, btn3("save").y);
await saveIn({ browser: true, file: true });
await page.waitForFunction(() => window.__editor.ed.file && !window.__editor.ed.dom && !window.__editor.dirty(), null, { timeout: 20000 });
check("Salva con nome: collegato", await page.evaluate(() => window.__editor.ed.file.name === "dustveil-Prova-editor.dvmap" && window.__fs.writes === 1));
await page.evaluate(() => window.__editor.scene.add([{ object: "miniera_oro", x: 3000, y: 1000, scale_x: 1, scale_y: 1, rotation: 0 }]));
await page.mouse.move(700, 300);
await page.keyboard.down("Control"); await page.keyboard.press("KeyS"); await page.keyboard.up("Control");
await page.waitForFunction(() => window.__fs.writes === 2 && !window.__editor.dirty(), null, { timeout: 20000 })
  .catch((e) => { console.log(logs.filter((l) => !/GL Driver/.test(l)).slice(-5)); throw e; });
const written = await page.evaluate(async () => {
  const blob = window.__fs.files["dustveil-Prova-editor.dvmap"];
  const text = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).text();
  return { n: JSON.parse(text).instances.length, panel: !!window.__editor.ed.dom };
});
check("Ctrl+S riscrive il file collegato", written.n === 3 && !written.panel);
await page.evaluate(() => { window.__fs.mode = "abort"; window.__editor.ed.file = null; });
await click(btn3("save").x, btn3("save").y);
await saveIn({ browser: false, file: true });
await page.waitForTimeout(300);
check("Salva con nome annullata: il pannello resta", await page.evaluate(() => !!window.__editor.ed.dom && window.__fs.writes === 2));
await page.keyboard.press("Escape"); await page.waitForTimeout(150);
await page.evaluate(() => { window.__fs.mode = "ok"; window.__fs.openName = "dustveil-Prova-editor.dvmap"; });
await click(btn3("new").x, btn3("new").y);
await page.waitForFunction(() => !window.__editor.ed.loading && (window.__editor.ed.confirm || window.__editor.scene.map.instances.length === 0), null, { timeout: 60000 });
if (await page.evaluate(() => !!window.__editor.ed.confirm)) { const C6 = await page.evaluate(() => window.__editor.confirmLayout()); await click(...at(C6.buttons[1])); }
await page.waitForFunction(() => window.__editor.scene.map.instances.length === 0 && !window.__editor.ed.loading, null, { timeout: 60000 });
await click(btn3("open").x, btn3("open").y);
await page.waitForFunction(() => window.__editor.ed.open && window.__editor.ed.open.mine, null, { timeout: 10000 });
let O6 = await page.evaluate(() => window.__editor.openLayout());
await click(...mid({ x1: O6.file[0], y1: O6.file[1], x2: O6.file[2], y2: O6.file[3] }));
await page.waitForFunction(() => window.__editor.scene.map.instances.length === 3 && !window.__editor.ed.loading, null, { timeout: 60000 });
check("aperto dal file: collegato", await page.evaluate(() => !!window.__editor.ed.file && window.__editor.ed.file.name === "dustveil-Prova-editor.dvmap"));
// la pagina ricaricata: "Apri mappa", "Le tue mappe"
await page.goto(`${base}/index.html?room=editor`);
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
await click(btn3("open").x, btn3("open").y);
await page.waitForFunction(() => window.__editor.ed.open && window.__editor.ed.open.mine, null, { timeout: 10000 });
let O3 = await page.evaluate(() => window.__editor.openLayout());
check("nell'elenco", O3.mine.length >= 1 && (await page.evaluate(() => window.__editor.ed.open.mine[0].name)) === "Prova editor");
await click(...mid(O3.mine[0]));
await page.waitForFunction(() => window.__editor.scene.map.name === "Prova editor" && !window.__editor.ed.loading, null, { timeout: 60000 });
check("riaperta dal browser", await page.evaluate(() => { const S = window.__editor.scene; return S.map.instances.length === 3 && S.map.cpu.style === "static" && !!window.__editor.ed.mapId; })); // (3: la miniera del Ctrl+S, §9.188)
// il file: "Apri un file…"
await click(btn3("new").x, btn3("new").y);
await page.waitForFunction(() => window.__editor.scene.map.instances.length === 0 && !window.__editor.ed.loading, null, { timeout: 60000 });
await click(btn3("open").x, btn3("open").y);
await page.waitForFunction(() => window.__editor.ed.open && window.__editor.ed.open.mine, null, { timeout: 10000 });
O3 = await page.evaluate(() => window.__editor.openLayout());
await page.evaluate(() => { window.__fs.mode = "deny"; }); // (senza la finestra di File System Access: <input type=file>)
const [chooser] = await Promise.all([page.waitForEvent("filechooser"), click(...mid({ x1: O3.file[0], y1: O3.file[1], x2: O3.file[2], y2: O3.file[3] }))]);
await chooser.setFiles(file);
await page.waitForFunction(() => window.__editor.scene.map.name === "Prova editor" && !window.__editor.ed.loading, null, { timeout: 60000 });
check("riaperta dal file", await page.evaluate(() => window.__editor.scene.map.instances.length === 2 && window.__editor.ed.mapId === null && !window.__editor.ed.file));
fs.unlinkSync(file);
// elimina dal browser: il cerchio della riga, "Elimina"
await click(btn3("open").x, btn3("open").y);
await page.waitForFunction(() => window.__editor.ed.open && window.__editor.ed.open.mine, null, { timeout: 10000 });
const before3 = await page.evaluate(() => window.__editor.ed.open.mine.length);
O3 = await page.evaluate(() => window.__editor.openLayout());
await click(O3.mine[0].del[0], O3.mine[0].del[1]);
check("conferma per eliminare", await page.evaluate(() => window.__editor.ed.confirm && window.__editor.ed.confirm.buttons[0].label === "Delete"));
const C3 = await page.evaluate(() => window.__editor.confirmLayout());
await click((C3.yes[0] + C3.yes[2]) / 2, (C3.yes[1] + C3.yes[3]) / 2);
await page.waitForFunction((n) => window.__editor.ed.open && window.__editor.ed.open.mine && window.__editor.ed.open.mine.length === n - 1, before3, { timeout: 10000 });
check("eliminata", true);

// [§9.185] il pennello: un bosco in una pennellata (un passo solo da
// annullare), la gomma col destro, una pennellata di selciato (una macchia)
await page.keyboard.press("Escape"); // (il pannello "Apri mappa", riaperto dopo l'eliminazione)
await page.waitForTimeout(100);
await click(btn3("new").x, btn3("new").y);
await page.waitForFunction(() => window.__editor.scene.map.instances.length === 0 && !window.__editor.ed.loading, null, { timeout: 60000 });
await click(btn3("brush").x, btn3("brush").y);
await page.waitForFunction(() => window.__editor.catalog() === "ready", null, { timeout: 120000 });
const undo0 = await page.evaluate(() => window.__editor.scene.undoList.length);
await page.mouse.move(500, 300); await page.mouse.down();
for (let k = 0; k <= 30; k++) { await page.mouse.move(500 + k * 12, 300); await page.waitForTimeout(30); }
await page.mouse.up(); await page.waitForTimeout(200);
const forest = await page.evaluate(() => {
  const S = window.__editor.scene, t = S.trees();
  let min = Infinity;
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) min = Math.min(min, Math.hypot(t[i].x - t[j].x, t[i].y - t[j].y));
  return { n: t.length, min, steps: S.undoList.length, sprites: new Set(t.map((e) => e.sprite)).size };
});
res.bosco = forest;
check("un bosco in una pennellata", forest.n > 15 && forest.min >= 89 && forest.steps === undo0 + 1 && forest.sprites > 1);
await page.mouse.move(650, 300); await page.mouse.down({ button: "right" });
for (let k = 0; k <= 5; k++) { await page.mouse.move(650 + k * 10, 300); await page.waitForTimeout(30); }
await page.mouse.up({ button: "right" }); await page.waitForTimeout(200);
const left = await page.evaluate(() => window.__editor.scene.trees().length);
check("la gomma col destro", left < forest.n && left > 0);
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await page.waitForTimeout(200);
check("annullate gomma e pennellata", (await page.evaluate(() => window.__editor.scene.trees().length)) === 0);
const BL = await page.evaluate(() => window.__editor.brushLayout());
await click((BL.tabs[1].x1 + BL.tabs[1].x2) / 2, (BL.tabs[1].y1 + BL.tabs[1].y2) / 2);
await page.mouse.move(600, 400); await page.mouse.down();
for (let k = 0; k <= 20; k++) { await page.mouse.move(600 + k * 15, 400 - k * 3); await page.waitForTimeout(30); }
await page.mouse.up(); await page.waitForTimeout(300);
const patch = await page.evaluate(() => { const m = window.__editor.scene.map; return { n: m.patches.length, bg: m.patches[0] && m.patches[0].bg, pts: m.patches[0] && m.patches[0].pts.length, geo: window.__editor.scene.world.patches.length }; });
check("una pennellata di selciato: una macchia", patch.n === 1 && patch.bg === "city2" && patch.pts >= 6 && patch.geo === 1);
await page.mouse.move(700, 380); await page.mouse.down({ button: "right" }); await page.waitForTimeout(80); await page.mouse.up({ button: "right" }); await page.waitForTimeout(200);
check("la gomma toglie la macchia", (await page.evaluate(() => window.__editor.scene.map.patches.length)) === 0);

// [§9.185] la copertina: un'immagine 1200 x 600 caricata nelle impostazioni,
// ritagliata a 720 x 480; salvata e riaperta resta
const png = await page.evaluate(() => {
  const c = document.createElement("canvas"); c.width = 1200; c.height = 600;
  const g = c.getContext("2d"); g.fillStyle = "#3a6"; g.fillRect(0, 0, 1200, 600); g.fillStyle = "#c33"; g.fillRect(500, 200, 200, 200);
  return c.toDataURL("image/png").split(",")[1];
});
await click(btn3("settings").x, btn3("settings").y);
await page.waitForSelector(".net-panel input");
await page.fill(".net-panel input", "Con copertina");
const [chooser2] = await Promise.all([page.waitForEvent("filechooser"), page.locator('.net-panel [data-net="cover-load"]').click()]);
await chooser2.setFiles({ name: "prova.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
await page.waitForFunction(() => { const i = document.querySelector('.net-panel img[data-net="cover"]'); return i && !i.hidden && i.naturalWidth > 0; }, null, { timeout: 10000 });
const coverDims = await page.evaluate(() => { const i = document.querySelector('.net-panel img[data-net="cover"]'); return [i.naturalWidth, i.naturalHeight]; });
await page.locator('.net-panel [data-net="apply"]').click();
await page.waitForTimeout(200);
const cover = await page.evaluate(() => (window.__editor.scene.map.cover || "").slice(0, 30));
check("la copertina 720 x 480", coverDims[0] === 720 && coverDims[1] === 480 && /^data:image\/(webp|jpeg);base64,/.test(cover));
await page.mouse.move(700, 300);
await page.keyboard.down("Control"); await page.keyboard.press("KeyS"); await page.keyboard.up("Control");
await saveIn({ browser: true, file: false });
await page.waitForFunction(() => window.__editor.ed.mapId && !window.__editor.ed.dom, null, { timeout: 10000 });
const id4 = await page.evaluate(() => window.__editor.ed.mapId);
await page.goto(`${base}/index.html?room=editor`);
await page.waitForFunction(() => window.__editor && window.__editor.ready, null, { timeout: 120000 });
await click(btn3("open").x, btn3("open").y);
await page.waitForFunction(() => window.__editor.ed.open && window.__editor.ed.open.mine, null, { timeout: 10000 });
const O4 = await page.evaluate(() => window.__editor.openLayout());
const row4 = await page.evaluate((id) => window.__editor.ed.open.mine.findIndex((m) => m.id === id), id4);
await click(...mid(O4.mine[row4]));
await page.waitForFunction(() => window.__editor.scene.map.name === "Con copertina" && !window.__editor.ed.loading, null, { timeout: 60000 });
check("la copertina resta", await page.evaluate((c) => (window.__editor.scene.map.cover || "").startsWith(c), cover));

// [§9.187] la polilinea: un fiume di tre punti (destro: fine), piu' largo,
// un punto trascinato (e annullato), un punto nuovo col doppio clic e tolto
// con Backspace; un sentiero (Invio: fine); con la simmetria diagonale una
// strada e la gemella, tolte insieme con Canc
await click(btn3("new").x, btn3("new").y);
await page.waitForFunction(() => window.__editor.scene.map.instances.length === 0 && !window.__editor.ed.loading && !window.__editor.ed.confirm, null, { timeout: 60000 });
await click(btn3("line").x, btn3("line").y);
const LL = await page.evaluate(() => window.__editor.lineLayout());
for (const [x, y] of [[500, 300], [700, 350], [900, 300]]) await click(x, y);
await click(1000, 300, "right");
const river = await page.evaluate(() => { const m = window.__editor.scene.map; return { n: m.rivers.length, pts: m.rivers[0] && m.rivers[0].pts.length, w: m.rivers[0] && m.rivers[0].width, geo: window.__editor.scene.world.rivers.length }; });
check("un fiume di tre punti", river.n === 1 && river.pts === 3 && river.w === 150 && river.geo === 1);
await click(LL.width.plus[0], LL.width.plus[1]);
check("piu' largo", (await page.evaluate(() => window.__editor.scene.map.rivers[0].width)) === 200);
const p1 = await page.evaluate(() => window.__editor.scene.map.rivers[0].pts[1].slice());
await page.mouse.move(700, 350); await page.waitForTimeout(100); await page.mouse.down();
for (let k = 1; k <= 5; k++) { await page.mouse.move(700 + 4 * k, 350 + 14 * k); await page.waitForTimeout(40); }
await page.mouse.up(); await page.waitForTimeout(200);
const p1b = await page.evaluate(() => window.__editor.scene.map.rivers[0].pts[1].slice());
const sc = await page.evaluate(() => window.__editor.view.scale);
check("un punto trascinato", Math.abs(p1b[0] - p1[0] - 20 * sc) < 3 && Math.abs(p1b[1] - p1[1] - 70 * sc) < 3);
await page.keyboard.down("Control"); await page.keyboard.press("KeyZ"); await page.keyboard.up("Control"); await page.waitForTimeout(150);
check("annullato il punto", (await page.evaluate(() => window.__editor.scene.map.rivers[0].pts[1][1])) === p1[1]);
await click(600, 325);
await page.mouse.click(600, 325, { clickCount: 1 }); await page.waitForTimeout(40); await page.mouse.click(600, 325); await page.waitForTimeout(200);
check("un punto nuovo col doppio clic", (await page.evaluate(() => window.__editor.scene.map.rivers[0].pts.length)) === 4);
await page.keyboard.press("Backspace"); await page.waitForTimeout(150);
check("Backspace toglie il punto", (await page.evaluate(() => window.__editor.scene.map.rivers[0].pts.length)) === 3);
await page.keyboard.press("Escape"); await page.waitForTimeout(100);
await click(...mid(LL.tabs[2]));
for (const [x, y] of [[500, 500], [800, 520]]) await click(x, y);
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
check("un sentiero", await page.evaluate(() => { const r = window.__editor.scene.map.roads; return r.length === 1 && r[0].kind === 2 && r[0].width === 110; }));
await page.keyboard.press("Escape"); await page.waitForTimeout(100);
const SYL = await page.evaluate(() => window.__editor.symLayout());
await click(...mid(SYL.opts.find((q) => q.mode === "diagonal")));
await click(...mid(LL.tabs[1]));
for (const [x, y] of [[450, 200], [650, 230]]) await click(x, y);
await page.keyboard.press("Enter"); await page.waitForTimeout(200);
check("con la simmetria la strada e la gemella", await page.evaluate(() => { const S = window.__editor.scene, r = S.map.roads; return r.length === 3 && S.twinLine("roads", r[1], "diagonal") === r[2]; }));
await page.keyboard.press("Delete"); await page.waitForTimeout(150);
check("Canc toglie strada e gemella", (await page.evaluate(() => window.__editor.scene.map.roads.length)) === 1);
// [§9.188] "Prova mappa": senza due partenze no; Padania con la CPU statica,
// la partita (niente regia della CPU, la pausa senza salvataggi), "Torna
// all'editor": la mappa com'era, cambiata
await click(btn3("test").x, btn3("test").y);
await page.waitForTimeout(300);
check("Prova mappa: servono due partenze", await page.evaluate(() => location.search.includes("room=editor")));
await page.evaluate(() => window.__editor.openTemplate("sk_padus"));
await page.waitForFunction(() => window.__editor.ed.label && window.__editor.scene.map.width === 7000 && !window.__editor.ed.loading, null, { timeout: 120000 })
  .catch(async () => { const C7 = await page.evaluate(() => window.__editor.confirmLayout()); await click(...at(C7.buttons[1])); });
await page.waitForFunction(() => window.__editor.scene.map.width === 7000 && !window.__editor.ed.loading, null, { timeout: 120000 });
await page.evaluate(() => { const E = window.__editor; E.scene.map.cpu.style = "static"; E.scene.add([{ object: "miniera_oro", x: 2000, y: 3000, scale_x: 1, scale_y: 1, rotation: 0 }]); });
const nTest = await page.evaluate(() => window.__editor.scene.map.instances.length);
await click(btn3("test").x, btn3("test").y);
await page.waitForURL(/room=custom/, { timeout: 30000 });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
await page.waitForTimeout(1500);
const game = await page.evaluate(() => { const G = window.__game, w = G.world; return { room: w.room, enemy: w.exists("enemy_centro"), eco: w.exists("enemy_eco"), omini: [...w.all("ally_omino")].length, test: G.pause.testMode, style: G.g.sk && G.g.sk.style }; });
res.prova = game;
check("la partita di prova", game.room === "custom" && game.enemy && !game.eco && game.omini === 3 && game.test && game.style === "static");
await page.evaluate(() => window.__game.pause.actions.menu());
await page.waitForURL(/room=editor/, { timeout: 30000 });
await page.waitForFunction(() => window.__editor && window.__editor.ready && !window.__editor.ed.loading && window.__editor.scene.map.width === 7000, null, { timeout: 120000 });
check("Torna all'editor: la mappa com'era", await page.evaluate((n) => { const E = window.__editor; return E.scene.map.instances.length === n && E.dirty() && E.scene.map.cpu.style === "static"; }, nTest));

// Indietro, Non salvare: il menu
const L5 = await page.evaluate(() => window.__editor.layout());
await click(L5.back[0], L5.back[1]);
const C5 = await page.evaluate(() => window.__editor.confirmLayout());
await click(...at(C5.buttons[1]));
await page.waitForURL(/room=menu/, { timeout: 20000 });
check("Non salvare: il menu", true);

console.log(JSON.stringify(res));
if (errs.length) console.log(errs.slice(0, 5));
ok = ok && errs.length === 0;
console.log(ok ? "ok" : "NON VA");
await browser.close();
process.exit(ok ? 0 : 1);
