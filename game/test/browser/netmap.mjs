// [§9.192] Prova nel browser della partita online su una mappa dell'editor,
// con WebRTC VERO (come rtc.mjs: due pagine, i clic e i codici veri, senza
// server STUN). A ha nel browser una sua mappa (con la copertina e le
// partenze: la rossa in basso a destra), B no.
//   1. A: "Multiplayer", "Create game", la sua mappa (dopo le cinque del
//      gioco), "Create game": la sua partita (room custom) col codice;
//   2. B: "Join game", incolla il codice: il pannello dice il nome della
//      mappa e che verra' scaricata; "Entra": la pagina di B mostra subito la
//      sala d'attesa col codice di risposta, senza partita;
//   3. A incolla la risposta: il canale si apre, A manda la mappa, B la
//      riceve, la convalida, la salva fra le sue mappe (con la copertina) e
//      costruisce la partita; la partita parte nelle due pagine: stessa room,
//      il rosso (A) alla partenza rossa, le impronte uguali;
//   4. A torna al menu; di nuovo "Create game" sulla stessa mappa: B ora ce
//      l'ha (il pannello non dice piu' che verra' scaricata), la sua partita
//      e' pronta prima di collegarsi, e la partita parte.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/netmap.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const W = 1280, H = 720, shots = process.env.SHOTS || "";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [], fail = [], res = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const open = async (name) => {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errs.push(`${name} console: ${m.text()}`); });
  await page.goto(`${base}/index.html?room=menu&stun=0`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const ready = (page) => page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
const until = async (page, fn, arg, ms, what) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); return true; } catch (e) { fail.push(what); return false; }
};
const menuOf = (page) => page.evaluate(() => { const i = window.__game.world.all("enemy_manager_menu").next().value;
  return i ? { page: i.page, skmenu: i.skmenu, skNet: i.skNet, n: i.userMaps ? i.userMaps.length : -1, skMap: i.skMap } : null; });
const clickUntil = async (page, x, y, ok) => {
  for (let k = 0; k < 3; k++) {
    await page.mouse.move(x, y); await sleep(300);
    await page.mouse.click(x, y);
    for (let t = 0; t < 50; t++) { if (await ok()) return true; await sleep(200); }
  }
  return false;
};
const colY = (n, k) => H - 100 - n * 70 - (n - 1) * 20 + k * 90 + 35;
const finish = async () => {
  if (errs.length) fail.push("errori: " + errs.slice(0, 5).join(" | "));
  await browser.close();
  console.log(JSON.stringify(res));
  if (fail.length) { console.log("NON VA:\n  " + fail.join("\n  ")); process.exit(1); }
  console.log("ok");
  process.exit(0);
};
const code = (page) => page.$eval('textarea[data-net="code"]', (t) => t.value);
const panelText = (page) => page.$eval(".net-panel", (p) => [...p.querySelectorAll("[data-text]")].map((e) => e.dataset.text).join(" | "));

const A = await open("A"), B = await open("B");
// la mappa di A (pagine diverse: ognuna col suo browser)
await A.evaluate(async () => {
  const ms = await import("/src/mapstore.js"), mf = await import("/src/mapfile.js");
  const I = (object, x, y, extra = {}) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, ...extra });
  const c = document.createElement("canvas"); c.width = 720; c.height = 480;
  const g = c.getContext("2d"); g.fillStyle = "#406030"; g.fillRect(0, 0, 720, 480);
  const trees = [];
  for (let k = 0; k < 30; k++) trees.push(I("albero", 2500 + (k % 6) * 90, 2600 + Math.floor(k / 6) * 90));
  await ms.saveMap({ ...mf.newMap({ name: "Valle online" }), description: "Per la prova online.", cover: c.toDataURL("image/webp", 0.8),
                     instances: [I("centro", 1200, 1200, { side: "blue" }), I("centro", 4800, 4800, { side: "red" }),
                                 I("miniera_oro", 1700, 1300), I("miniera_oro", 4300, 4700), ...trees],
                     rivers: [{ pts: [[0, 3000], [6000, 3000]], width: 220 }] });
});

const createOnUserMap = async () => {
  if (!(await clickUntil(A, W / 2, colY(4, 2), async () => (await menuOf(A))?.page === "multi"))) { fail.push("A: Multiplayer"); return false; }
  if (!(await clickUntil(A, W / 2, colY(2, 0), async () => { const m = await menuOf(A); return m?.skmenu === 1 && m.skNet && m.n === 1; }))) { fail.push("A: Create game senza la mappa dell'editor"); return false; }
  // la mappa dell'editor: a sinistra della prima
  const L = await A.evaluate(([w, h]) => window.__game.skLayout(w, h, true), [W, H]);
  const left = L.rows.find((r) => r.kind === "map" && r.dir === -1);
  // (la seconda volta la schermata si riapre gia' sull'ultima mappa dell'editor scelta)
  await sleep(500);
  if ((await menuOf(A)).skMap !== 5 && !(await clickUntil(A, left.circle[0], left.circle[1], async () => (await menuOf(A))?.skMap === 5))) { fail.push("A: la mappa non si sceglie"); return false; }
  await until(A, () => { const i = window.__game.world.all("enemy_manager_menu").next().value; return i.userMaps[0].state === "ok"; }, null, 20000, "A: la mappa non si legge");
  const start = L.rows.find((r) => r.kind === "start");
  await A.mouse.move((start.x1 + start.x2) / 2, (start.y1 + start.y2) / 2); await sleep(300);
  await Promise.all([A.waitForNavigation({ timeout: 60000 }), A.mouse.click((start.x1 + start.x2) / 2, (start.y1 + start.y2) / 2)]);
  await ready(A);
  return until(A, () => (document.querySelector('textarea[data-net="code"]') || {}).value?.length > 100, null, 30000, "A: niente codice");
};
const joinWith = async (offer) => {
  if (!(await clickUntil(B, W / 2, colY(4, 2), async () => (await menuOf(B))?.page === "multi"))) { fail.push("B: Multiplayer"); return null; }
  if (!(await clickUntil(B, W / 2, colY(2, 1), async () => !!(await B.$(".net-panel"))))) { fail.push("B: Join game"); return null; }
  await B.fill('textarea[data-net="join-code"]', offer);
  if (!(await until(B, () => !document.querySelector('[data-net="join"]').disabled, null, 20000, "B: il codice non e' accettato"))) return null;
  const summary = await panelText(B);
  if (shots && /downloaded/.test(summary)) await B.screenshot({ path: shots + "/net_join.png" });
  await Promise.all([B.waitForNavigation({ timeout: 60000 }), B.click('[data-net="join"]')]);
  return summary;
};

// 1-3: la prima partita, con la mappa da scaricare
const t0 = Date.now();
if (!(await createOnUserMap())) await finish();
res.urlA = await A.evaluate(() => location.search);
const summary1 = await joinWith(await code(A));
if (summary1 === null) await finish();
res.summary1 = summary1;
if (!summary1.includes("Valle online") || !/downloaded/.test(summary1)) fail.push("B: il pannello non dice la mappa da scaricare: " + summary1);
// la sala d'attesa di B, prima della partita
if (!(await until(B, () => (document.querySelector('textarea[data-net="code"]') || {}).value?.length > 100, null, 60000, "B: niente codice di risposta"))) await finish();
res.bSenzaPartita = await B.evaluate(() => !window.__game);
if (shots) await B.screenshot({ path: shots + "/net_lobby_b.png" });
if (!res.bSenzaPartita) fail.push("B: la partita c'era gia' (doveva aspettare la mappa)");
await A.fill('textarea[data-net="answer"]', await code(B));
await A.click('[data-net="connect"]');
await ready(B);
for (const [P, n] of [[A, "A"], [B, "B"]]) await until(P, () => window.__game.net && window.__game.net.state === "running", null, 90000, `${n}: la partita non parte`);
if (fail.length) await finish();
res.secondiPrimaPartita = Math.round((Date.now() - t0) / 1000);
const info = await Promise.all([A, B].map((P) => P.evaluate(() => {
  const w = window.__game.world, at = (o) => { const i = w.all(o).next().value; return i ? [i.x, i.y].join() : null; };
  return { room: w.room, local: w.mp.local, red: at("centro"), blue: at("p2_centro"), mines: w.number("miniera_oro"), trees: w.number("albero") };
})));
res.partite = info;
if (info.some((i) => i.room !== "custom")) fail.push("non e' la mappa dell'editor");
if (info.some((i) => i.red !== "4800,4800" || i.blue !== "1200,1200")) fail.push("il rosso non e' alla partenza rossa: " + JSON.stringify(info));
if (info[0].mines !== info[1].mines || info[0].trees !== info[1].trees) fail.push("mappe diverse: " + JSON.stringify(info));
const kept = await B.evaluate(async () => {
  const ms = await import("/src/mapstore.js"), list = await ms.listMaps(), m = list.find((q) => q.name === "Valle online");
  const map = m && (await ms.loadMap(m.id));
  return { n: list.length, cover: !!(map && map.cover), sides: map ? map.instances.filter((e) => e.object === "centro").map((e) => e.side).join() : null };
});
res.tenuta = kept;
if (!(kept.n === 1 && kept.cover && kept.sides === "blue,red")) fail.push("B non ha tenuto la mappa con la copertina: " + JSON.stringify(kept));
// le impronte confrontate (ogni 300 passi)
await until(A, () => window.__game.net.checks.length >= 2, null, 180000, "A: niente impronte confrontate");
const checks = await Promise.all([A, B].map((P) => P.evaluate(() => ({ checks: window.__game.net.checks.length, ok: window.__game.net.checks.every(([, v]) => v), desync: !!window.__game.net.desync }))));
res.impronte = checks;
if (checks.some((c) => !c.ok || c.desync)) fail.push("partite separate: " + JSON.stringify(checks));
if (fail.length) await finish();

// 4: la seconda partita, B ha gia' la mappa
await Promise.all([A.waitForNavigation({ timeout: 60000 }), A.evaluate(() => window.__game.pause.actions.menu())]);
await ready(A);
await until(B, () => !!(window.__pause && window.__pause.net && window.__pause.net.lost), null, 30000, "B: non vede che A se n'e' andato");
await Promise.all([B.waitForNavigation({ timeout: 60000 }), B.evaluate(() => { location.search = "?room=menu&stun=0"; })]);
await ready(B);
if (!(await createOnUserMap())) await finish();
const summary2 = await joinWith(await code(A));
if (summary2 === null) await finish();
res.summary2 = summary2;
if (/downloaded/.test(summary2)) fail.push("B: dice di nuovo che la scarica: " + summary2);
await ready(B);
res.bPartitaPronta = await B.evaluate(() => !!(window.__game && window.__game.ready && window.__game.world.room === "custom"));
if (!(await until(B, () => (document.querySelector('textarea[data-net="code"]') || {}).value?.length > 100, null, 60000, "B: niente codice di risposta (2)"))) await finish();
await A.fill('textarea[data-net="answer"]', await code(B));
await A.click('[data-net="connect"]');
for (const [P, n] of [[A, "A"], [B, "B"]]) await until(P, () => window.__game.net && window.__game.net.state === "running", null, 90000, `${n}: la seconda partita non parte`);
const kept2 = await B.evaluate(async () => (await (await import("/src/mapstore.js")).listMaps()).length);
if (kept2 !== 1) fail.push("B: la mappa salvata due volte");
await finish();
