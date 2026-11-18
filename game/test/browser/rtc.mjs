// Prova nel browser della partita a due con WebRTC VERO (§9.156,
// multiplayer, fase 4): due pagine dello stesso Chromium, tutto il percorso
// del giocatore, coi clic e le caselle di testo veri, a tempo vero (il ciclo
// del gioco gira, niente ?nostart):
//   1. A, nel menu (§9.157): "Multiplayer", "Create game", poi "Create game"
//      in basso a destra nella schermata della schermaglia: la sua partita
//      (il rosso) mostra il codice;
//   2. B, nel menu: "Multiplayer", "Join game", incolla il codice di A,
//      "Entra": la sua partita (il blu) mostra il codice di risposta;
//   3. A incolla la risposta, "Collega": il canale si apre, la partita parte
//      nelle due pagine (stessa room, stesso seme), la sala d'attesa sparisce;
//   4. un comando per parte (un civile in coda), Esc in A: tutte e due in
//      pausa allo stesso passo; Esc in B: ripartono;
//   5. le impronte confrontate dalle pagine ogni 300 passi: tutte uguali; la
//      chat (B scrive, A riceve);
//   6. A torna al menu: B dice che l'altro ha lasciato la partita.
// Senza server STUN (?stun=0: fra due pagine della stessa macchina bastano
// gli indirizzi locali). Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/rtc.mjs [room] [passi]
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const [room = "sk_padus", stepsArg = "950"] = process.argv.slice(2);
const STEPS = Number(stepsArg);
const W = 1280, H = 720;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [], fail = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const open = async (name) => {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errs.push(`${name} console: ${m.text()}`); });
  // la mappa scelta nel menu (la schermaglia la ricorda in localStorage)
  await page.addInitScript((room) => { try { if (!localStorage.getItem("535.skirmish")) localStorage.setItem("535.skirmish", JSON.stringify({ map: room })); } catch (e) { /* niente */ } }, room);
  await page.goto(`${base}/index.html?room=menu&stun=0`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const ready = (page) => page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
const until = async (page, fn, arg, ms, what) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); return true; } catch (e) { fail.push(what); return false; }
};

// il menu (§9.157, menu.js titleButtons): "Multiplayer" (il terzo pulsante
// della colonna del titolo, 4 pulsanti alti 70 ogni 90 px, l'ultimo a 100
// px dal fondo), poi nella pagina "Multiplayer" (2 pulsanti) "Create game" o
// "Join game"; "Create game" in basso a destra nella schermaglia (skLayout)
const menuOf = (page) => page.evaluate(() => { const i = window.__game.world.all("enemy_manager_menu").next().value;
  return i ? { page: i.page, skmenu: i.skmenu, skNet: i.skNet } : null; });
// (un clic alla volta, aspettando che la pagina lo veda: un secondo clic
// sullo stesso punto cadrebbe sul pulsante della pagina dopo)
const clickUntil = async (page, x, y, ok) => {
  for (let k = 0; k < 3; k++) {
    await page.mouse.move(x, y); await sleep(300);
    await page.mouse.click(x, y);
    for (let t = 0; t < 50; t++) { if (await ok()) return true; await sleep(200); }
  }
  return false;
};
const colY = (n, k) => H - 100 - n * 70 - (n - 1) * 20 + k * 90 + 35;
const multiplayer = async (page, who) => {
  if (await clickUntil(page, W / 2, colY(4, 2), async () => (await menuOf(page))?.page === "multi")) return true;
  fail.push(`${who}: la pagina "Multiplayer" non si apre`);
  return false;
};
const hostMenu = async (page, who) => {
  if (!(await multiplayer(page, who))) return false;
  if (await clickUntil(page, W / 2, colY(2, 0), async () => { const m = await menuOf(page); return m?.skmenu === 1 && m.skNet; })) return true;
  fail.push(`${who}: "Create game" non apre la schermaglia della partita online`);
  return false;
};
const joinPanel = async (page, who) => {
  if (!(await multiplayer(page, who))) return false;
  if (await clickUntil(page, W / 2, colY(2, 1), async () => !!(await page.$(".net-panel")))) return true;
  fail.push(`${who}: il pannello "Join game" non si apre`);
  return false;
};
const code = (page) => page.$eval('textarea[data-net="code"]', (t) => t.value);
const finish = async () => {
  if (errs.length) fail.push("errori: " + errs.slice(0, 5).join(" | "));
  await browser.close();
  if (fail.length) { console.log("NON VA:\n  " + fail.join("\n  ")); process.exit(1); }
  console.log("ok");
  process.exit(0);
};

const t0 = Date.now();
const A = await open("A"), B = await open("B");
// 1. A crea la partita
if (!(await hostMenu(A, "A"))) await finish();
// (la difficolta', il primo riquadro della griglia, e' della CPU: in grigio,
// un clic non la cambia; menu.js skLayout a 1280 x 720)
const skOf = (P) => P.evaluate(() => window.__game.world.all("enemy_manager_menu").next().value.sk.difficulty);
const diff0 = await skOf(A), gx1 = Math.max(30, W * 0.05) + Math.min(440, W * 0.33) + 40;
await A.mouse.move(gx1 + 150, 180); await sleep(300); await A.mouse.click(gx1 + 150, 180); await sleep(500);
if ((await skOf(A)) !== diff0) fail.push("A: la difficolta' della CPU si cambia nella partita online");
await A.mouse.move(W - 40 - 150, H - 72); await sleep(300);
await Promise.all([A.waitForNavigation({ timeout: 60000 }), A.mouse.click(W - 40 - 150, H - 72)]);
await ready(A);
if (!(await until(A, () => (document.querySelector('textarea[data-net="code"]') || {}).value?.length > 100, null, 30000, "A: niente codice"))) await finish();
const offer = await code(A);
// 2. B entra col codice di A
if (!(await joinPanel(B, "B"))) await finish();
await B.fill('textarea[data-net="join-code"]', "Ecco il codice:\n" + offer + "\n");
if (!(await until(B, () => !document.querySelector('[data-net="join"]').disabled, null, 10000, "B: il codice di A non e' accettato"))) await finish();
const summary = await B.$eval(".net-panel", (p) => [...p.querySelectorAll("[data-text]")].map((e) => e.dataset.text).join(" | "));
await Promise.all([B.waitForNavigation({ timeout: 60000 }), B.click('[data-net="join"]')]);
await ready(B);
if (!(await until(B, () => (document.querySelector('textarea[data-net="code"]') || {}).value?.length > 100, null, 30000, "B: niente codice di risposta"))) await finish();
const answer = await code(B);
// (la risposta incollata dove va il codice di una partita: rifiutata)
// 3. A incolla la risposta e si collega
await A.fill('textarea[data-net="answer"]', answer);
await A.click('[data-net="connect"]');
for (const [P, n] of [[A, "A"], [B, "B"]]) await until(P, () => window.__game.net.state === "running", null, 30000, `${n}: la partita non parte`);
if (fail.length) await finish();
const tConnect = Date.now() - t0;
const info = await Promise.all([A, B].map((P) => P.evaluate(() => ({
  url: location.search, local: window.__game.world.mp.local, delay: window.__game.net.delay, rtt: window.__game.net.rtt,
  lobby: !!document.querySelector(".net-overlay"), seed: window.__game.commands && new URLSearchParams(location.search).get("seed"),
  room: window.__game.world.room,
}))));
if (info[0].local !== 1 || info[1].local !== 2) fail.push("parti: " + JSON.stringify(info));
if (info[0].seed !== info[1].seed || info[0].room !== info[1].room) fail.push("partite diverse: " + JSON.stringify(info));
if (info.some((i) => i.lobby)) fail.push("la sala d'attesa e' rimasta aperta");
if (info[0].delay !== info[1].delay) fail.push("ritardi diversi");

// 4. un comando per parte, poi la pausa (Esc in A) e la ripresa (Esc in B)
await A.evaluate(() => { const w = window.__game.world; w.act("civile", { ids: [w.all("centro").next().value.id] }); });
await B.evaluate(() => { const w = window.__game.world; w.act("civile", { ids: [w.all("p2_centro").next().value.id] }); });
await until(A, () => window.__game.world._stepNo > 200, null, 120000, "A: la partita non avanza");
await A.keyboard.press("Escape");
const paused = (P) => until(P, () => window.__pause.paused, null, 20000, "pausa non arrivata");
await Promise.all([paused(A), paused(B)]);
await sleep(1500);
const ps = await Promise.all([A, B].map((P) => P.evaluate(() => [window.__game.world._stepNo, window.__pause.net && window.__pause.net.by])));
if (ps[0][0] !== ps[1][0]) fail.push("pausa a passi diversi: " + JSON.stringify(ps));
await B.keyboard.press("Escape");
await Promise.all([A, B].map((P) => until(P, (s) => !window.__pause.paused && window.__game.world._stepNo > s + 20, ps[0][0], 20000, "ripresa non arrivata")));

// 5. avanti, poi i confronti delle impronte
await Promise.all([A, B].map((P) => until(P, (n) => window.__game.world._stepNo >= n, STEPS, 300000, "la partita non arriva in fondo")));
const res = await Promise.all([A, B].map((P) => P.evaluate(() => ({ step: window.__game.world._stepNo, checks: window.__game.net.checks,
  desync: window.__game.net.desync, pop: [window.__game.g.pop, window.__game.g.p2.pop], waits: window.__game.net.events.length }))));
for (const [n, r] of [["A", res[0]], ["B", res[1]]]) {
  if (r.desync) fail.push(`${n}: partite separate al passo ${r.desync.step}`);
  if (r.checks.length < Math.floor(STEPS / 300) - 1 || !r.checks.every(([, ok]) => ok)) fail.push(`${n}: confronti ${JSON.stringify(r.checks)}`);
}

// la chat su WebRTC: B preme Invio, scrive, Invio; A riceve
await B.keyboard.press("Enter");
await B.keyboard.type("ciao rosso!");
await B.keyboard.press("Enter");
await until(A, () => window.__game.net.chat.log.some((m) => m.who === 1 && m.text === "ciao rosso!"), null, 20000, "chat: il messaggio di B non arriva ad A");
// riaperta, la casella sta sopra la minimappa (non in alto: un difetto della
// prima versione), Esc la chiude senza aprire la pausa
await B.keyboard.press("Enter");
const box = await B.evaluate(() => { const e = document.getElementById("chat-input"); const r = e && e.getBoundingClientRect(); return r ? [Math.round(r.left), Math.round(r.top)] : null; });
await B.keyboard.press("Escape");
await sleep(500);
const boxGone = await B.evaluate(() => !document.getElementById("chat-input") && !window.__pause.paused);
if (!box || box[1] < 150 || !boxGone) fail.push("chat: la casella " + JSON.stringify(box) + (boxGone ? "" : ", Esc non la chiude o apre la pausa"));

// 6. A torna al menu (come "Lascia la partita"): B lo sa
await Promise.all([A.waitForNavigation({ timeout: 60000 }), A.evaluate(() => window.__game.world.gotoRoom("menu"))]);
await until(B, () => window.__game.net.state === "left" && window.__pause.paused, null, 20000, "B: l'uscita di A non arriva");
const bar = await B.evaluate(() => (document.getElementById("net-bar") || {}).dataset?.text || "");

console.log(`${room}: collegati in ${(tConnect / 1000).toFixed(1)} s, codice ${offer.length} caratteri, risposta ${answer.length}`);
console.log(`  B ha letto: ${summary}`);
console.log(`  A ${info[0].url} | B ${info[1].url}`);
console.log(`  ritardo ${info[0].delay} passi, andata e ritorno ${info[0].rtt?.toFixed(1)} ms`);
console.log(`  pausa al passo ${ps[0][0]}/${ps[1][0]} (chiesta da ${ps[0][1]}), confronti ${res[0].checks.map(([s, ok]) => s + (ok ? "" : "!")).join(" ")}`);
console.log(`  B dopo l'uscita di A: "${bar}"`);
await finish();
