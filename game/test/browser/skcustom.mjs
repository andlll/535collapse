// [§9.190] Prova nel browser delle mappe dell'editor nella schermaglia
// (skuser.js, menu.js): tre mappe salvate nel browser (A senza copertina,
// con difficolta' e stile fissati: Difficile, statica; B con la copertina e
// la CPU a scelta; C con una sola partenza), poi dal menu "Single player" ->
// "Skirmish":
//   elenco     = dopo le cinque del gioco, le tre del browser
//   A          = il disegno della mappa al posto della copertina, difficolta'
//                e stile bloccati (il clic non li cambia), "Inizia" acceso
//   B          = la copertina, le opzioni libere
//   C          = "Inizia" spento (una sola partenza)
//   partita    = "Inizia" su A: la room custom (&play=1) con la CPU della
//                mappa, non in modo prova; salvata nello slot "custom" col
//                nome; caricata (di nuovo &play=1); "Ricomincia"; il menu
//   ricordata  = riaprendo la schermata si vede A
//   file       = "Apri un file" (la finestra finta) aggiunge la mappa e la
//                mostra
//   online     = [§9.192] in "Create game" anche le mappe dell'editor e "Apri
//                un file"
// Esce con codice 1 se qualcosa non torna; SHOTS=dir: gli screenshot.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/skcustom.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const shots = process.env.SHOTS || "";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const W = 1600, H = 900;
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.addInitScript(() => {
  window.__fs = { text: null };
  window.showOpenFilePicker = async () => [{ kind: "file", name: "map.dvmap", getFile: async () => new File([window.__fs.text || ""], "map.dvmap") }];
});
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const click = async (x, y) => {
  await page.mouse.move(x, y); await page.waitForTimeout(150);
  await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up(); await page.waitForTimeout(200);
};
const res = {};
let ok = true;
const check = (name, v) => { res[name] = v; if (!v) ok = false; };
const ready = () => page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
const colTop = (n) => H - 100 - n * 70 - (n - 1) * 20;

await page.goto(`${base}/index.html?room=menu`);
await ready();
// le mappe nel browser (i moduli di src: lo stesso IndexedDB)
const ids = await page.evaluate(async () => {
  const ms = await import("/src/mapstore.js"), mf = await import("/src/mapfile.js");
  const I = (object, x, y) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0 });
  const trees = [];
  for (let k = 0; k < 40; k++) trees.push(I("albero", 2200 + (k % 8) * 90, 1500 + Math.floor(k / 8) * 90));
  const A = { ...mf.newMap({ name: "Pianura di prova" }),
              // [§9.191] la partenza rossa (del giocatore) in basso a destra
              instances: [{ ...I("centro", 1200, 1200), side: "blue" }, { ...I("centro", 4800, 4800), side: "red" }, I("miniera_oro", 1800, 1500), I("pietra_grande", 4200, 4500),
                          I("montagna_3", 3000, 3000), I("ocr_01", 3600, 2000), ...trees,
                          // [§9.193] unita' ed edifici delle due parti
                          { ...I("ally_warrior", 4500, 4400), side: "red" }, { ...I("ally_warrior", 1500, 1600), side: "blue" },
                          { ...I("caserma", 1700, 1000), side: "blue" },
                          // [§9.194] un muro rosso, una porta blu
                          { ...I("mura_ori", 4300, 3900), side: "red" }, { ...I("porta_ori", 1700, 2100), side: "blue" }],
              rivers: [{ pts: [[0, 3500], [2500, 3300], [6000, 2600]], width: 260 }],
              roads: [{ pts: [[1200, 1300], [3000, 2400], [4800, 4700]], width: 120, kind: 1 }],
              patches: [{ pts: [[3300, 1700], [4000, 1700], [4000, 2300], [3300, 2300]], bg: "city2", alpha: 1 }],
              description: "Una pianura per provare. ".repeat(24).trim(),
              cpu: { difficulty: "hard", style: "static" } };
  const c = document.createElement("canvas"); c.width = 720; c.height = 480;
  const g = c.getContext("2d"); g.fillStyle = "#3060a0"; g.fillRect(0, 0, 720, 480); g.fillStyle = "#f0d060"; g.fillRect(200, 120, 320, 240);
  const B = { ...mf.newMap({ name: "Con copertina" }), instances: [I("centro", 1000, 1000), I("centro", 5000, 5000)],
              description: "La copertina e la CPU a scelta.", cover: c.toDataURL("image/webp", 0.8) };
  const C = { ...mf.newMap({ name: "Una partenza" }), instances: [I("centro", 1000, 1000)], description: "Solo un centro." };
  const wait = () => new Promise((r) => setTimeout(r, 30));
  const a = await ms.saveMap(A); await wait();
  const b = await ms.saveMap(B); await wait();
  const cc = await ms.saveMap(C);
  localStorage.removeItem("535.skirmish.user");
  localStorage.setItem("535.skirmish", JSON.stringify({ map: "sk_padus", difficulty: "easy", style: "balanced" }));
  return { a, b, c: cc, fileText: JSON.stringify({ ...B, name: "Dal file" }) };
});
const menu = () => page.evaluate(() => {
  const i = window.__game.world.all("enemy_manager_menu").next().value;
  const list = !i.userMaps ? null : i.userMaps;
  const shown = i.skMap ?? 0, m = shown >= 5 && list ? list[shown - 5] : null;
  return { skmenu: i.skmenu, skNet: i.skNet, n: list ? list.length : 0, names: list ? list.map((e) => e.name) : [], shown,
           user: m ? { name: m.name, state: m.state, sides: m.sides, cover: m.cover, sprite: !!(m.cover && window.__game.assets.sprites[m.cover]),
                       cpu: m.map && m.map.cpu, file: !!m.file } : null, sk: { ...i.sk } };
});
await click(W / 2, colTop(4) + 90 + 35); // "Single player"
await click(W / 2, colTop(3) + 90 + 35); // "Skirmish" (secondo di tre)
await page.waitForFunction(() => { const i = window.__game.world.all("enemy_manager_menu").next().value; return i.skmenu === 1 && i.userMaps; }, null, { timeout: 20000 });
const L = await page.evaluate(([w, h]) => window.__game.skLayout(w, h, false), [W, H]);
const row = (kind, key, dir) => L.rows.find((r) => r.kind === kind && (key === undefined || r.key === key) && (dir === undefined || r.dir === dir));
const at = (r) => (r.circle ? [r.circle[0], r.circle[1]] : [(r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2]);
let s = await menu();
check("elenco: le tre mappe del browser dopo le cinque", s.n === 3 && s.names.join("|") === "Una partenza|Con copertina|Pianura di prova");
// A: a sinistra della prima
await click(...at(row("map", undefined, -1)));
await page.waitForFunction(() => { const i = window.__game.world.all("enemy_manager_menu").next().value; const m = i.userMaps[i.skMap - 5]; return m && m.cover && m.cover.startsWith("__"); }, null, { timeout: 20000 });
s = await menu();
res.A = s.user;
check("A: il disegno, partenze rossa e blu, CPU fissata", s.user.name === "Pianura di prova" && s.user.sprite && s.user.sides && s.user.cpu.style === "static");
await click(...at(row("opt", "difficulty", 1)));
await click(...at(row("opt", "style", 1)));
s = await menu();
check("A: difficolta' e stile bloccati", s.sk.difficulty === "easy" && s.sk.style === "balanced");
if (shots) await page.screenshot({ path: shots + "/sk_editor_A.png" });
// B
await click(...at(row("map", undefined, -1)));
await page.waitForFunction(() => { const i = window.__game.world.all("enemy_manager_menu").next().value; const m = i.userMaps[i.skMap - 5]; return m && m.cover && m.cover.startsWith("__"); }, null, { timeout: 20000 });
s = await menu();
res.B = s.user;
await click(...at(row("opt", "difficulty", 1)));
const sB = await menu();
check("B: la copertina, opzioni libere", s.user.name === "Con copertina" && s.user.sprite && sB.sk.difficulty === "normal");
await click(...at(row("opt", "difficulty", -1)));
if (shots) await page.screenshot({ path: shots + "/sk_editor_B.png" });
// C
await click(...at(row("map", undefined, -1)));
await page.waitForFunction(() => { const i = window.__game.world.all("enemy_manager_menu").next().value; const m = i.userMaps[i.skMap - 5]; return m && m.state === "ok"; }, null, { timeout: 20000 });
await click(...at(row("start")));
await page.waitForTimeout(500);
s = await menu();
check("C: una partenza, Inizia spento", s.user.name === "Una partenza" && !s.user.sides && page.url().includes("room=menu"));
if (shots) await page.screenshot({ path: shots + "/sk_editor_C.png" });
// "Inizia" su A
await click(...at(row("map", undefined, 1)));
await click(...at(row("map", undefined, 1)));
s = await menu();
check("di nuovo A", s.user && s.user.name === "Pianura di prova");
await click(...at(row("start")));
await page.waitForURL(/room=custom&play=1/, { timeout: 30000 });
await ready();
await page.waitForTimeout(1000);
let game = await page.evaluate(() => { const G = window.__game, w = G.world, at = (o) => { const i = w.all(o).next().value; return i ? [i.x, i.y] : null; }; return { room: w.room, sk: G.g.sk && { d: G.g.sk.difficulty, s: G.g.sk.style }, test: G.pause.testMode, eco: w.exists("enemy_eco"), centro: at("enemy_centro"), mine: at("centro"), omini: w.number("ally_omino"), mines: w.number("miniera_oro") }; });
res.partita = game;
check("la partita: custom, CPU della mappa, non in prova", game.room === "custom" && game.sk.d === "hard" && game.sk.s === "static" && !game.test && game.eco && game.centro && game.mine && game.omini === 3 && game.mines === 1);
check("il giocatore alla partenza rossa, la CPU alla blu", game.mine.join() === "4800,4800" && game.centro.join() === "1200,1200");
const sided = await page.evaluate(() => { const w = window.__game.world; return { warrior: w.number("ally_warrior"), enemyWarrior: w.number("enemy_warrior"), barracks: w.number("enemy_caserma"), mine: w.number("caserma"),
  wall: w.number("mura_ori"), enemyGate: w.number("enemy_porta_ori"), gate: w.number("porta_ori") }; });
res.schieramenti = sided;
check("le unita' e gli edifici: rossi del giocatore, blu della CPU", sided.warrior === 1 && sided.enemyWarrior === 1 && sided.barracks === 1 && sided.mine === 0);
check("mura e porte: il muro del giocatore, la porta della CPU", sided.wall === 1 && sided.enemyGate === 1 && sided.gate === 0);
if (shots) await page.screenshot({ path: shots + "/sk_editor_partita.png" });
// salvata, caricata
await page.evaluate(async () => { const G = window.__game; G.advance(120); await G.pause.actions.saveGame(); });
await page.waitForTimeout(500);
const head = await page.evaluate(() => JSON.parse(localStorage.getItem("535.save.custom") || "null"));
check("salvata nello slot custom col nome", !!head && head.room === "custom" && head.name === "Pianura di prova");
await page.evaluate(() => { location.search = "?room=custom&load=slot"; });
await page.waitForURL(/load=slot/, { timeout: 30000 });
await ready();
await page.waitForTimeout(500);
game = await page.evaluate(() => { const G = window.__game, w = G.world; return { room: w.room, url: location.search, step: w._stepNo, sk: G.g.sk && G.g.sk.style, mines: w.number("miniera_oro") }; });
res.caricata = game;
check("caricata: la mappa dal salvataggio, poi &play=1", game.room === "custom" && game.url.includes("play=1") && !game.url.includes("load") && game.step >= 120 && game.sk === "static" && game.mines === 1);
// Ricomincia: una partita nuova sulla stessa mappa
await page.evaluate(() => { window.__old = 1; window.__game.pause.actions.restart(); });
await page.waitForFunction(() => !window.__old && window.__game && window.__game.ready, null, { timeout: 120000 });
await page.waitForTimeout(1000);
game = await page.evaluate(() => { const G = window.__game, w = G.world; return { room: w.room, url: location.search, step: w._stepNo, sk: G.g.sk && G.g.sk.difficulty }; });
res.ricomincia = game;
check("Ricomincia", game.room === "custom" && game.sk === "hard" && game.step < 180);
// il menu
await page.evaluate(() => window.__game.pause.actions.menu());
await page.waitForURL(/room=menu/, { timeout: 30000 });
await ready();
await click(W / 2, colTop(4) + 90 + 35);
await click(W / 2, colTop(3) + 90 + 35);
await page.waitForFunction(() => { const i = window.__game.world.all("enemy_manager_menu").next().value; return i.skmenu === 1 && i.userMaps && i.skMap !== null; }, null, { timeout: 20000 });
s = await menu();
check("ricordata: si riapre su A", s.user && s.user.name === "Pianura di prova");
// da file (il testo del file finto: l'init script lo azzera a ogni pagina)
await page.evaluate((t) => { window.__fs.text = t; }, ids.fileText);
await click(...at(row("file")));
await page.waitForFunction(() => { const i = window.__game.world.all("enemy_manager_menu").next().value; return i.userMaps.length === 4 && i.skMap === 8; }, null, { timeout: 20000 });
s = await menu();
check("da file: aggiunta e mostrata", s.user.name === "Dal file" && s.user.file && s.user.state === "ok");
// online: niente mappe dell'editor
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
await click(W / 2, colTop(4) + 180 + 35); // "Multiplayer"
await click(W / 2, colTop(2) + 35); // "Create game"
await page.waitForTimeout(300);
s = await menu();
const LN = await page.evaluate(([w, h]) => window.__game.skLayout(w, h, true), [W, H]);
check("online: anche le mappe dell'editor e Apri un file (§9.192)", s.skmenu === 1 && s.skNet && s.n === 3 && LN.rows.some((r) => r.kind === "file"));
// pulizia
await page.evaluate(async (ids) => { const ms = await import("/src/mapstore.js"); for (const id of [ids.a, ids.b, ids.c]) await ms.deleteMap(id); }, ids);

res.errori = errs;
console.log(JSON.stringify(res));
await browser.close();
if (!ok || errs.length) { console.log("FALLITA"); process.exit(1); }
console.log("ok");
