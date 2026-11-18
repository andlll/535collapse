// [§9.158] Prova nel browser del collegamento che non riesce, con WebRTC
// VERO fra due pagine dello stesso Chromium (senza STUN, ?stun=0):
//   1. A crea la partita (la sala d'attesa, il codice); B entra con un
//      codice di A in cui gli indirizzi sono stati cambiati con indirizzi
//      che non rispondono (192.0.2.x, riservati alla documentazione);
//   2. A incolla una risposta fatta per un altro codice: rifiutata subito,
//      col messaggio giusto;
//   3. A incolla la risposta di B, anche lei con indirizzi che non
//      rispondono: dopo l'attesa (25 s) la riga di stato dice che il
//      collegamento non e' riuscito, con una causa, e compare il pulsante
//      "Problemi di connessione"; la guida si apre (sezioni, dettagli
//      tecnici senza indirizzi), Esc chiude la guida e non la sala d'attesa.
// Esce con codice 1 se qualcosa non torna.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/rtcfail.mjs
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const base = process.env.BASE || "http://localhost:8123";
const W = 1280, H = 720;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [], fail = [];
const open = async (name, search, init = null) => {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  if (init) await page.addInitScript(init.fn, init.arg);
  await page.goto(`${base}/index.html${search}`);
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 180000 });
  return page;
};
const code = (page) => page.waitForFunction(() => (document.querySelector('textarea[data-net="code"]') || {}).value?.length > 100, null, { timeout: 30000 })
  .then(() => page.$eval('textarea[data-net="code"]', (t) => t.value));
// un codice con gli indirizzi cambiati (e, se si vuole, altri campi)
const mangle = (page, text, ip, extra = {}) => page.evaluate(async ([text, ip, extra]) => {
  const { decodeCode, encodeCode } = await import("/src/netcode.js");
  const d = await decodeCode(text);
  // (anche la porta: in alcune macchine un indirizzo che non risponde arriva
  // lo stesso, alla porta giusta, alla pagina accanto)
  d.data.sdp = d.data.sdp.replace(/^(a=candidate:\S+ \d+ \S+ \d+ )(\S+) \d+( typ)/gm, `$1${ip} 9$3`);
  return encodeCode(d.kind, { ...d.data, ...extra });
}, [text, ip, extra]);
const status = (page) => page.$eval('[data-net="status"]', (e) => [e.dataset.kind, e.dataset.text]);
const finish = async () => {
  if (errs.length) fail.push("errori: " + errs.slice(0, 5).join(" | "));
  await browser.close();
  if (fail.length) { console.log("NON VA:\n  " + fail.join("\n  ")); process.exit(1); }
  console.log("ok");
  process.exit(0);
};

// 1. A crea, B entra col codice cambiato
const A = await open("A", "?room=sk_padus&net=host&seed=5&stun=0");
const offer = await code(A);
const bad = await mangle(A, offer, "192.0.2.1");
const B = await open("B", "?room=sk_padus&net=join&seed=5&stun=0",
  { fn: (c) => sessionStorage.setItem("535.net", JSON.stringify({ role: "join", code: c, sk: { map: "sk_padus" } })), arg: bad });
const answer = await code(B);

// 2. una risposta per un altro codice
const other = await mangle(B, answer, "192.0.2.2", { o: "altro" });
await A.fill('textarea[data-net="answer"]', other);
await A.click('[data-net="connect"]');
await A.waitForTimeout(500);
const s2 = await status(A);
if (s2[0] !== "error" || !/another game code/.test(s2[1])) fail.push("risposta di un altro codice: " + JSON.stringify(s2));

// 3. la risposta giusta, con indirizzi che non rispondono
await A.fill('textarea[data-net="answer"]', await mangle(B, answer, "192.0.2.2"));
const t0 = Date.now();
await A.click('[data-net="connect"]');
try { await A.waitForSelector('[data-net="help"]', { timeout: 60000 }); } catch (e) { fail.push("nessun pulsante della guida: " + JSON.stringify(await status(A)) + " " + await A.evaluate(() => window.__game.net.state)); await finish(); }
const s3 = await status(A);
if (s3[0] !== "error" || !/^Could not connect\. /.test(s3[1]) || !/button below/.test(s3[1])) fail.push("messaggio: " + JSON.stringify(s3));
const st = await A.evaluate(() => window.__game.net.state);
await A.click('[data-net="help"]');
await A.waitForSelector('[data-net="help-page"]');
const help = await A.evaluate(() => {
  const p = document.querySelector('[data-net="help-page"]');
  return { heads: [...p.querySelectorAll("[data-text]")].length, details: (p.querySelector('textarea[data-net="details"]') || {}).value || "" };
});
if (help.heads < 15 || !/cause: /.test(help.details) || /192\.0\.2/.test(help.details)) fail.push("guida: " + JSON.stringify(help));
await A.keyboard.press("Escape");
await A.waitForTimeout(300);
const after = await A.evaluate(() => [!!document.querySelector('[data-net="help-page"]'), document.querySelectorAll(".net-overlay").length]);
if (after[0] || after[1] !== 1) fail.push("Esc: " + JSON.stringify(after));
if (process.env.SHOTS) {
  await A.click('[data-net="help"]');
  await A.waitForTimeout(500);
  await A.screenshot({ path: process.env.SHOTS + "/guida.png" });
  await A.keyboard.press("Escape");
  await A.waitForTimeout(300);
  await A.screenshot({ path: process.env.SHOTS + "/fallito.png" });
}
console.log(`collegamento non riuscito dopo ${((Date.now() - t0) / 1000).toFixed(1)} s (stato ${st}): "${s3[1]}"`);
console.log(`  la guida: ${help.heads} testi; dettagli:\n    ${help.details.split("\n").join("\n    ")}`);
await finish();
