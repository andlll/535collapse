// [§9.156, multiplayer, fase 4] La partita a due in rete, nella pagina:
// chi crea e chi entra, la sala d'attesa coi codici, il lockstep
// (lockstep.js) sul canale (rtc.js), gli avvisi.
//
// IL PERCORSO (decisioni dell'autore: 1 contro 1, connessione diretta,
// codici da incollare, senza server).
// 1. Menu, "Multiplayer" (§9.157): "Create game" (la schermata della
//    schermaglia, poi hostGame) con la mappa e le opzioni scelte, o "Join
//    game" (joinMenu) col codice ricevuto da incollare ("Entra").
// 2. Chi crea apre la room (?room=sk_*&net=host&seed=N; le opzioni restano
//    in sessionStorage): nella sala d'attesa il suo codice (l'offerta WebRTC
//    con mappa, opzioni e seme) da mandare all'altro, e la casella per la
//    risposta. E' il rosso.
// 3. Chi entra incolla il codice nel menu: la sua pagina apre la stessa room
//    con lo stesso seme e le stesse opzioni (?net=join) e mostra il codice di
//    risposta da rimandare. E' il blu.
// 4. Chi crea incolla la risposta: il canale si apre, le due pagine si
//    salutano (stessa versione), si misura il ritardo, la partita parte.
// Il cambio di room ricarica la pagina (world.gotoRoom): la connessione nasce
// quindi nella pagina della partita, non nel menu.
//
// Nella partita: app.js chiede canStep() prima di ogni passo (se il turno
// dell'altro non c'e' ancora la pagina aspetta: "In attesa dell'altro
// giocatore...") e afterStep() dopo; la pausa e' un comando (requestPause,
// resume); lasciare la partita manda il saluto (leave, anche chiudendo la
// pagina). Gli eventi del lockstep diventano avvisi: impronte diverse
// ("desync", fino alla fine della partita), l'altro che se ne va, la
// connessione persa, versioni diverse.
//
// ?net=fake (le prove, test/browser/netfake.mjs): niente sala d'attesa, il
// canale finto (rtc.js FakeLink) che la prova collega all'altra pagina;
// &parte=1|2, &delay=D.

import { Lockstep } from "./lockstep.js";
import { RtcLink, FakeLink, rtcAvailable } from "./rtc.js";
import { encodeCode, decodeCode } from "./netcode.js";
import { NetPanel, copyText, netBar } from "./netui.js";
import { tr } from "./i18n.js";
import { SK_MAPS, SK_ROOMS, SK_OPTIONS, cleanSkirmish, optionLabel } from "./skirmish.js";
import { freshSeed } from "./rng.js";
import { Chat } from "./chat.js";
import { diagnose, diagText, summarizeStats } from "./netdiag.js";
import { causeText, showNetHelp } from "./nethelp.js";
import { c, makeColourRgb } from "./colours.js";
import { dhypot, dsin } from "./dmath.js";

const KEY = "535.net"; // sessionStorage: chi crea (le opzioni) o chi entra (il codice)
const CONNECT_WAIT = 25000; // ms: dopo la risposta, se il canale non si apre non si aprira'
const WAIT_BAR = 600, WAIT_PANEL = 8000; // ms di attesa del turno dell'altro: la barra, poi il pannello
const JOIN_WAIT = 90000; // ms: chi entra, ancora non collegato, legge l'avviso e trova la guida (§9.158)
// l'identita' di una descrizione WebRTC (a=ice-ufrag): la risposta dice a
// quale offerta risponde (§9.158)
const iceUfrag = (sdp) => (/^a=ice-ufrag:(\S+)/m.exec(sdp || "") || [])[1] || "";

// le opzioni che contano nella partita a due (difficolta' e stile sono della
// CPU; la tregua, §9.156, vale anche qui: nessuno dei due puo' attaccare)
const SHOWN = ["victory", "resources", "pop", "truce", "fog", "daynight", "rain"];
const mapName = (room) => tr((SK_MAPS.find((m) => m.room === room) || { name: room }).name);
export function setupSummary(sk) {
  return tr("Map: {map}", { map: mapName(sk.map) }) + ". "
    + SHOWN.map((k) => tr(SK_OPTIONS[k].label) + ": " + optionLabel(k, sk[k])).join(", ") + ".";
}
const sideText = (local) => tr(local === 0 ? "You are the red player." : "You are the blue player.");
const urlFor = (room, mode, seed, stun) => `?room=${room}&net=${mode}&seed=${seed}${stun ? "" : "&stun=0"}`;

function session() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; }
}
function setSession(v) {
  try { sessionStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; }
}

// il motivo di un codice rifiutato, per chi lo incolla
function codeProblem(e, want, version, data) {
  if (e) {
    if (e.reason === "empty") return "";
    if (e.reason === "proto") return tr("This code comes from another version of the game ({v}): both players must use the same version.", { v: e.version || "?" });
    return tr("This code is not valid: copy it again, whole.");
  }
  if (want === "offer" && data.kind === "answer") return tr("This is an answer code: it goes to the player who created the game.");
  if (want === "answer" && data.kind === "offer") return tr("This is the code of a new game, not the answer: ask the other player for the code their game shows.");
  if (data.data.v !== version) return tr("This code comes from another version of the game ({v}): both players must use the same version.", { v: data.data.v });
  if (want === "offer" && !(data.data.setup && SK_ROOMS.includes(data.data.setup.map))) return tr("This code is not valid: copy it again, whole.");
  return null;
}

// ------------------------------------------------------------- il menu
// [§9.157, richiesta dell'autore] Dal menu principale, "Multiplayer":
// - "Create game" apre la schermata della schermaglia (menu.js, con
//   difficolta' e stile della CPU in grigio); il pulsante in basso a destra
//   chiama hostGame con mappa e opzioni scelte: si apre la partita di chi
//   crea con la sala d'attesa e i codici (lobby, sotto);
// - "Join game" apre joinMenu: il pannello per incollare il codice ricevuto
//   (solo quello: mappa e opzioni sono di chi ha creato la partita).

// chi crea: la sua partita (il rosso), con le opzioni sk
export function hostGame({ sk, stun = true }) {
  const seed = freshSeed();
  setSession({ role: "host", sk, seed });
  location.search = urlFor(sk.map, "host", seed, stun);
}

// chi entra: il pannello col codice, al centro sopra il menu (Esc o "Back"
// lo chiudono: onClose)
export function joinMenu({ version, stun = true, onClose = null }) {
  const panel = new NetPanel({ onEscape: () => panel.close() });
  panel.onClose = onClose;
  panel.title(tr("Join game"));
  if (!rtcAvailable()) {
    panel.status(tr("This browser does not support direct connections (WebRTC)."), "error");
    panel.button(panel.row(), tr("Back"), () => panel.close(), { name: "back" });
    return panel;
  }
  panel.text(tr("Paste here the code you received from the player who created the game:"));
  let tries = 0, found = null;
  const box = panel.code({ placeholder: tr("Paste the code here"), name: "join-code", onInput: (text) => check(text) });
  const info = panel.text("");
  const row = panel.row();
  const join = panel.button(row, tr("Join"), () => {
    if (!found) return;
    setSession({ role: "join", code: box.value, sk: found.sk });
    location.search = urlFor(found.sk.map, "join", found.seed, stun);
  }, { primary: true, name: "join" });
  panel.button(row, tr("Back"), () => panel.close(), { name: "back" });
  join.disabled = true;
  panel.status("");
  const check = async (text) => {
    const n = ++tries;
    let d = null, err = null;
    try { d = await decodeCode(text); } catch (e) { err = e; }
    if (n !== tries) return; // un'altra modifica nel frattempo
    const bad = codeProblem(err, "offer", version, d);
    found = bad === null ? { sk: cleanSkirmish(d.data.setup.sk ? { ...d.data.setup.sk, map: d.data.setup.map } : { map: d.data.setup.map }),
                             seed: d.data.setup.seed >>> 0 } : null;
    join.disabled = !found;
    // la partita del codice: mappa e opzioni, e il colore
    panel.setText(info, found ? setupSummary(found.sk) + " " + tr("You will play blue.") : "");
    panel.status(bad || "", "error");
  };
  setTimeout(() => box.focus(), 0);
  return panel;
}

// --------------------------------------------- prima della room (app.js)
// chi siamo nella partita a due (null: non lo e'); sk: le opzioni della
// schermaglia (per chi entra, quelle di chi ha creato)
export function netParams(params, roomName) {
  const mode = params.get("net");
  if (!["host", "join", "fake"].includes(mode) || !SK_ROOMS.includes(roomName)) return null;
  const s = session();
  const local = mode === "host" ? 0 : mode === "join" ? 1 : params.get("parte") === "2" ? 1 : 0;
  const from = mode !== "fake" && s && s.role === mode && s.sk ? s.sk : {};
  return { mode, local, sk: cleanSkirmish({ ...from, map: roomName }), code: mode === "join" && s ? s.code : null,
           stun: params.get("stun") !== "0", delay: Number(params.get("delay")) || null };
}

// ------------------------------------------------ la partita (app.js)
// world, g, commands, pause: quelli della pagina; hash, dump: l'impronta e lo
// stato (snapshot.js); toMenu: torna al menu
export function startNet({ net, world, g, commands, pause, hash, dump, version, toMenu }) {
  const fake = net.mode === "fake";
  const link = fake ? new FakeLink() : rtcAvailable() ? new RtcLink({ stun: net.stun }) : null;
  let panel = null, waitSince = 0, waitPanel = null, opened = false;
  // ([§9.158] la partita non piu' sincronizzata non e' piu' una barra:
  // un'icona nell'interfaccia, drawGUI sotto)
  const bar = { lost: "", waiting: "" };
  const showBar = () => {
    if (bar.lost) netBar(bar.lost, "error");
    else netBar(bar.waiting);
  };
  const ctl = { mode: net.mode, local: net.local, link, ls: null, desyncDump: null, events: [], waits: 0 };

  // la connessione si e' persa / l'altro se n'e' andato / non si puo' giocare
  const stop = (text) => {
    if (panel) { panel.status(text, "error"); return; }
    closeWait();
    chat.close();
    bar.lost = text;
    showBar();
    pause.net = { lost: text };
    if (!pause.paused) pause.open();
    pause.dirty = true;
  };
  const noDirect = () => tr("Could not connect: your two networks do not allow a direct connection (a relay server would be needed, not available yet). Try again, or from another network (for example a phone's hotspot).");

  const ls = new Lockstep({
    commands, local: net.local, link: link || { send() {}, close() {} }, version, delay: net.delay,
    emit: (t, i = {}) => {
      ctl.events.push([t, world._stepNo, i]);
      switch (t) {
        case "started":
          if (panel) { panel.close(); panel = null; }
          chat.system(tr("Enter to chat")); // §9.159: corto
          break;
        case "chat": chat.receive(i.text); break;
        case "error":
          stop(i.reason === "version"
            ? tr("The other player has another version of the game ({v}): both must reload the page and use the same version.", { v: i.theirs || "?" })
            : tr("The connection with the other player was lost."));
          try { link.close(); } catch (e) { /* gia' chiuso */ }
          break;
        case "desync":
          ctl.desyncNote = { text: tr("The two games are out of sync (step {n}): from here on the two players may see different things.", { n: i.step }),
                             since: performance.now() };
          try { ctl.desyncDump = dump(); } catch (e) { /* per capire, se si puo' */ }
          console.error("[535 rete] partite diverse al passo", i.step, i, ctl.desyncDump);
          break;
        case "pause":
          pause.net = { by: i.by };
          pause.open();
          break;
        case "resume":
          if (pause.paused && pause.net && !pause.net.lost) pause.close();
          break;
        case "left":
          stop(tr("The other player left the game."));
          break;
        case "lost":
          stop(opened ? tr("The connection with the other player was lost.") : noDirect());
          break;
        default: break;
      }
    },
  });
  ctl.ls = ls;
  // [§9.156, richiesta dell'autore] la chat (chat.js): si scrive a partita
  // cominciata, anche dopo la fine, finche' il canale c'e'
  const chat = new Chat({ local: net.local, send: (t) => ls.sendChat(t), can: () => ls.state === "running" || ls.state === "ended" });
  ctl.chat = chat;
  commands.on("pausa", (w, c) => ls.executePause(w._stepNo, c));
  if (link) {
    link.onopen = () => {
      opened = true;
      if (panel) panel.status(tr("Connected: the game is starting."), "ok");
      ls.opened();
    };
    link.onmessage = (m) => ls.receive(m);
    link.onclose = (why) => ls.closed(why);
  }
  // chiudendo la pagina (o andando al menu) il saluto all'altro
  window.addEventListener("pagehide", () => ls.leave());

  // ------------------------------------------------- la sala d'attesa
  const lobby = () => {
    const cancel = () => { ls.leave(); toMenu(); };
    // (Esc qui non fa niente: perderebbe il codice gia' mandato all'altro;
    // per uscire c'e' "Annulla")
    panel = new NetPanel();
    panel.title(tr("Online multiplayer"));
    panel.text(sideText(net.local) + " " + setupSummary(net.sk));
    if (!link) {
      panel.status(tr("This browser does not support direct connections (WebRTC)."), "error");
      panel.button(panel.row(), tr("Back to menu"), cancel, { name: "cancel" });
      return;
    }
    const failed = (e) => { console.error(e); panel && panel.status(tr("Could not prepare the connection: reload the page and try again."), "error"); };
    // [§9.158] i problemi di connessione: la causa (netdiag.js) nella riga di
    // stato e il pulsante della guida (nethelp.js), che compare sotto
    let helpInfo = null;
    const helpButton = (info) => {
      helpInfo = info;
      if (!panel || panel.helpRow) return;
      panel.helpRow = panel.row();
      panel.button(panel.helpRow, tr("Connection problems"), () => showNetHelp(helpInfo), { name: "help" });
    };
    const role = net.mode === "host" ? "rosso, crea" : "blu, entra";
    let remoteSdp = "", offerAt = 0, acceptedAt = 0;
    const diagnosis = async (strongOnly) => {
      const elapsed = acceptedAt && offerAt ? acceptedAt - offerAt : 0;
      const diag = diagnose({ local: link.pc.localDescription && link.pc.localDescription.sdp, remote: remoteSdp, stun: net.stun, elapsed, strongOnly });
      let stats = null;
      if (!strongOnly) { try { stats = summarizeStats(await link.pc.getStats()); } catch (e) { /* niente statistiche */ } }
      const minutes = Math.max(1, Math.round(elapsed / 60000));
      ctl.diag = { ...diag, stats };
      return { diag, minutes, help: { causes: diag.causes, minutes, details: diagText(diag, { role, stats, version, elapsed, stun: net.stun }) } };
    };
    // prima del tentativo: solo le cause sicure, come avviso
    const predict = async () => {
      const { diag, minutes, help } = await diagnosis(true);
      if (!diag.causes.length || opened || !panel) return false;
      panel.status(tr("It will probably not connect:") + " " + causeText(diag.causes[0], { minutes }), "warn");
      helpButton(help);
      return true;
    };
    // chi crea, dopo aver incollato la risposta: i controlli non passano (una
    // volta sola). (Chi entra aspetta: i suoi "failed" prima della risposta
    // sono normali, rtc.js)
    let accepted = false, reported = false;
    const report = async () => {
      if (reported || opened || !panel) return;
      reported = true;
      const { diag, minutes, help } = await diagnosis(false);
      if (opened || !panel) return;
      const [first] = diag.causes;
      let msg = tr("Could not connect.") + " " + causeText(first, { minutes });
      if (first !== "slow" && diag.causes.includes("slow")) msg += " " + causeText("slow", { minutes });
      panel.status(msg + " " + tr("The button below explains what to try."), "error");
      helpButton(help);
    };
    link.onstate = (s) => { if (s === "failed" && !opened && panel && accepted) report(); };
    if (net.mode === "host") {
      panel.text(tr("1. Send this code to the other player (by chat, e-mail...):"));
      const out = panel.code({ readonly: true, placeholder: tr("Preparing the connection..."), name: "code" });
      const r1 = panel.row();
      const copy = panel.button(r1, tr("Copy"), async (b) => { if (await copyText(out)) panel.relabel(b, tr("Copied")); }, { name: "copy" });
      copy.disabled = true;
      panel.text(tr("2. Paste here the answer code the other player sends back:"));
      const inp = panel.code({ placeholder: tr("Paste the code here"), name: "answer" });
      const r2 = panel.row();
      const go = panel.button(r2, tr("Connect"), async () => {
        if (accepted) return;
        let d = null, err = null;
        try { d = await decodeCode(inp.value); } catch (e) { err = e; }
        const bad = codeProblem(err, "answer", version, d);
        if (bad !== null) { panel.status(bad || tr("This code is not valid: copy it again, whole."), "error"); return; }
        // [§9.158] la risposta a un altro codice (uno di prima, una pagina
        // ricaricata): si dice subito
        if (d.data.o && d.data.o !== iceUfrag(link.pc.localDescription && link.pc.localDescription.sdp)) {
          panel.status(tr("This answer code was made for another game code (an older one?): send the other player your current code again and paste the new answer."), "error");
          return;
        }
        accepted = true;
        go.disabled = true;
        remoteSdp = d.data.sdp;
        acceptedAt = performance.now();
        panel.status(tr("Connecting..."));
        try { await link.accept(d.data.sdp); } catch (e) { accepted = false; go.disabled = false; failed(e); return; }
        await predict();
        setTimeout(report, CONNECT_WAIT);
      }, { primary: true, name: "connect" });
      panel.button(r2, tr("Cancel"), cancel, { name: "cancel" });
      panel.status(tr("Preparing the connection..."));
      const seed = Number(new URLSearchParams(location.search).get("seed")) >>> 0;
      link.offer()
        .then((sdp) => encodeCode("offer", { v: version, sdp, setup: { map: net.sk.map, sk: net.sk, seed } }))
        .then((code) => { out.value = code; copy.disabled = false; ctl.code = code; offerAt = performance.now(); panel.status(tr("Waiting for the answer code.")); })
        .catch(failed);
    } else {
      panel.text(tr("Send this answer code to the player who created the game:"));
      const out = panel.code({ readonly: true, placeholder: tr("Preparing the connection..."), name: "code" });
      const r1 = panel.row();
      const copy = panel.button(r1, tr("Copy"), async (b) => { if (await copyText(out)) panel.relabel(b, tr("Copied")); }, { name: "copy" });
      copy.disabled = true;
      panel.button(r1, tr("Cancel"), cancel, { name: "cancel" });
      panel.status(tr("Preparing the connection..."));
      decodeCode(net.code || "")
        .then((d) => { if (d.kind !== "offer") throw new Error("non e' un'offerta"); remoteSdp = d.data.sdp; return link.answer(d.data.sdp); })
        // (o: l'offerta a cui risponde, per chi crea: la risposta giusta?)
        .then((sdp) => encodeCode("answer", { v: version, sdp, o: iceUfrag(remoteSdp) }))
        .then(async (code) => {
          out.value = code; copy.disabled = false; ctl.code = code;
          if (opened) return;
          if (!(await predict())) panel.status(tr("Waiting for the other player to connect..."));
          // [§9.158] chi entra non sa quando l'altro incolla: dopo JOIN_WAIT
          // l'avviso e la guida
          setTimeout(async () => {
            if (opened || !panel) return;
            const { help } = await diagnosis(false);
            if (opened || !panel) return;
            panel.status(tr("Still not connected. If the other player has already pasted your code and nothing happens, the connection did not work."), "warn");
            helpButton(help);
          }, JOIN_WAIT);
        })
        .catch(failed);
    }
  };
  if (!fake) lobby();

  // ----------------------------------------- l'attesa del turno dell'altro
  const closeWait = () => { if (waitPanel) { waitPanel.close(); waitPanel = null; } };
  const waiting = (on) => {
    if (!on) {
      waitSince = 0;
      if (bar.waiting) { bar.waiting = ""; showBar(); }
      closeWait();
      return;
    }
    const now = performance.now();
    if (!waitSince) { waitSince = now; ctl.waits++; return; }
    if (now - waitSince > WAIT_BAR && !bar.waiting) { bar.waiting = tr("Waiting for the other player..."); showBar(); }
    if (now - waitSince > WAIT_PANEL && !waitPanel && !fake) {
      waitPanel = new NetPanel();
      waitPanel.title(tr("Waiting for the other player..."));
      waitPanel.text(tr("The other player's game is not answering. You can wait, or leave the game."));
      waitPanel.button(waitPanel.row(), tr("Leave the game"), () => { closeWait(); ls.leave(); toMenu(); }, { name: "leave" });
    }
  };

  Object.assign(ctl, {
    // [§9.158] l'icona della partita non piu' sincronizzata e il suo
    // suggerimento (nell'interfaccia, pixel CSS; app.js dopo la chat)
    drawGUI(d, W, g, input) { if (ctl.desyncNote) drawDesync(d, W, g, input, ctl.desyncNote); },
    // il passo del mondo si puo' giocare? (se no si aspetta)
    canStep() {
      const ok = ls.ready(world._stepNo);
      waiting(!ok && ls.running);
      return ok;
    },
    // dopo il passo: i turni, le impronte, la fine
    afterStep() { ls.afterStep(world._stepNo, hash, !!g.skWinner); },
    cmdStep(now) { return ls.cmdStep(now); },
    // la pausa chiesta da qui: un comando; dopo la fine o senza l'altro, solo qui
    requestPause() {
      if (ls.running) { ls.requestPause(world._stepNo); return; }
      if (!pause.paused) { pause.net = pause.net && pause.net.lost ? pause.net : { solo: true }; pause.open(); }
    },
    resume() {
      if (pause.net && pause.net.lost) return;
      if (ls.running && ls.pausedAt !== null) ls.resume(); else pause.close();
    },
    leave() { closeWait(); ls.leave(); },
    // la riga della diagnostica (F3)
    diagLine() {
      const ok = ls.checks.filter(([, v]) => v).length;
      return `rete: ${ls.state}, ${net.local === 0 ? "rosso" : "blu"}, ritardo ${ls.delay ?? "-"} passi`
        + `, andata e ritorno ${ls.rtt === null ? "-" : ls.rtt.toFixed(0) + " ms"}, attese ${ctl.waits}`
        + `, impronte ${ok}/${ls.checks.length} uguali${ls.desync ? ", DIVERSE dal passo " + ls.desync.step : ""}`;
    },
  });
  // lo stato del lockstep, letto ogni volta (per le prove e la diagnostica)
  for (const k of ["state", "delay", "checks", "desync", "rtt"]) Object.defineProperty(ctl, k, { get: () => ls[k], enumerable: true });
  return ctl;
}

// [§9.158, richiesta dell'autore] La partita non piu' sincronizzata: al posto
// della barra in alto (prendeva troppo spazio) un'icona tonda di vetro sotto
// il riquadro dei civili inattivi (sotto gli FPS, se si vedono), col globo
// disegnato dall'autore ([§9.162] al posto del segno "diverso" provvisorio,
// ico_desync, nero come le altre icone); il cerchio lampeggia nel colore
// degli avvisi per DESYNC_BLINK ms quando compare. Col puntatore sopra, il
// suggerimento nello stile di quelli del tutorial (hints.js drawWindow:
// riquadro bianco largo 380, titolo e testo) alla sua sinistra.
const DESYNC_BLINK = 6000, WARN = makeColourRgb(160, 90, 20);
export const desyncIcon = (W, g) => [W - 55, g && g.fps_show > 0 ? 290 : 250, 30];
function drawDesync(d, W, g, input, note) {
  const [x, y, r] = desyncIcon(W, g);
  const hover = !!input && input.inside && dhypot(input.x - x, input.y - y) < r;
  const age = performance.now() - note.since;
  d.setAlpha(hover ? 0.99 : 0.69);
  d.circleColour(x, y, r, c.white, c.white, false);
  if (age < DESYNC_BLINK) {
    d.setAlpha(0.3 + 0.3 * dsin(age / 160));
    d.circleColour(x, y, r, WARN, WARN, false);
  }
  d.setAlpha(1);
  d.spriteExt("ico_desync", 0, x, y, 0.55, 0.55, 0, c.white, 1); // §9.162: il globo dell'autore
  if (!hover) { d.setAlpha(1); return; }
  const title = tr("Out of sync"), text = note.text;
  d.setFont("overdue");
  const th = d.stringHeightExt(text, 30, 340), wx = x - r - 20 - 380, wy = y - r;
  d.setAlpha(0.69);
  d.roundrectColourExt(wx, wy, wx + 380, wy + th + 68, 60, 60, c.white, c.white, false);
  d.setColour(c.black);
  d.setAlpha(0.75);
  d.setFont("GUI_1");
  d.setHalign("left");
  d.setValign("bottom");
  d.text(wx + 20, wy + 38, title);
  d.setFont("overdue");
  d.setValign("top");
  d.textExt(wx + 20, wy + 43, text, 30, 340);
  d.setAlpha(1);
  d.setColour(c.white);
  d.setValign("middle");
}
