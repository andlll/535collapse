// [§9.156, multiplayer, fase 4] La partita a due in rete, nella pagina:
// chi crea e chi entra, la sala d'attesa coi codici, il lockstep
// (lockstep.js) sul canale (rtc.js), gli avvisi.
//
// IL PERCORSO (decisioni dell'autore: 1 contro 1, connessione diretta,
// codici da incollare, senza server).
// 1. Menu, schermaglia, "Partita a due" (netMenu): "Crea una partita" con la
//    mappa e le opzioni scelte, o il codice ricevuto da incollare ("Entra").
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

const KEY = "535.net"; // sessionStorage: chi crea (le opzioni) o chi entra (il codice)
const CONNECT_WAIT = 25000; // ms: dopo la risposta, se il canale non si apre non si aprira'
const WAIT_BAR = 600, WAIT_PANEL = 8000; // ms di attesa del turno dell'altro: la barra, poi il pannello

// le opzioni che contano nella partita a due (difficolta', stile della CPU e
// tregua sono della CPU)
const SHOWN = ["victory", "resources", "pop", "fog", "daynight", "rain"];
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
// "Partita a due" nella schermata della schermaglia (menu.js): crea o entra
export function netMenu({ sk, version, stun = true }) {
  const panel = new NetPanel({ onEscape: () => panel.close() });
  panel.title(tr("Two-player game"));
  panel.text(tr("Play the chosen map and options against another player, with a direct connection between your two computers. One player creates the game and sends a code to the other, who joins with it."));
  if (!rtcAvailable()) {
    panel.status(tr("This browser does not support direct connections (WebRTC)."), "error");
    panel.button(panel.row(), tr("Back"), () => panel.close(), { name: "back" });
    return panel;
  }
  panel.text(setupSummary(sk));
  panel.button(panel.row(), tr("Create a game"), () => {
    const seed = freshSeed();
    setSession({ role: "host", sk, seed });
    location.search = urlFor(sk.map, "host", seed, stun);
  }, { primary: true, name: "create" });
  panel.text(tr("Or paste here the code you received:"));
  let found = null, tries = 0;
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
    panel.setText(info, found ? setupSummary(found.sk) + " " + tr("You will play blue.") : "");
    panel.status(bad || "", "error");
  };
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
  const bar = { lost: "", desync: "", waiting: "" };
  const showBar = () => {
    if (bar.lost) netBar(bar.lost, "error");
    else if (bar.desync) netBar(bar.desync, "warning");
    else netBar(bar.waiting);
  };
  const ctl = { mode: net.mode, local: net.local, link, ls: null, desyncDump: null, events: [] };

  // la connessione si e' persa / l'altro se n'e' andato / non si puo' giocare
  const stop = (text) => {
    if (panel) { panel.status(text, "error"); return; }
    closeWait();
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
          break;
        case "error":
          stop(i.reason === "version"
            ? tr("The other player has another version of the game ({v}): both must reload the page and use the same version.", { v: i.theirs || "?" })
            : tr("The connection with the other player was lost."));
          try { link.close(); } catch (e) { /* gia' chiuso */ }
          break;
        case "desync":
          bar.desync = tr("The two games are out of sync (step {n}): from here on the two players may see different things.", { n: i.step });
          showBar();
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
    panel = new NetPanel({ onEscape: cancel });
    panel.title(tr("Two-player game"));
    panel.text(sideText(net.local) + " " + setupSummary(net.sk));
    if (!link) {
      panel.status(tr("This browser does not support direct connections (WebRTC)."), "error");
      panel.button(panel.row(), tr("Back to menu"), cancel, { name: "cancel" });
      return;
    }
    const failed = (e) => { console.error(e); panel && panel.status(tr("Could not prepare the connection: reload the page and try again."), "error"); };
    // (chi crea, dopo aver incollato la risposta: i controlli non passano. Chi
    // entra aspetta: i suoi "failed" prima della risposta sono normali, rtc.js)
    let accepted = false;
    link.onstate = (s) => { if (s === "failed" && !opened && panel && accepted) panel.status(noDirect(), "error"); };
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
        accepted = true;
        go.disabled = true;
        panel.status(tr("Connecting..."));
        try { await link.accept(d.data.sdp); } catch (e) { accepted = false; go.disabled = false; failed(e); return; }
        setTimeout(() => { if (!opened && panel) panel.status(noDirect(), "error"); }, CONNECT_WAIT);
      }, { primary: true, name: "connect" });
      panel.button(r2, tr("Cancel"), cancel, { name: "cancel" });
      panel.status(tr("Preparing the connection..."));
      const seed = Number(new URLSearchParams(location.search).get("seed")) >>> 0;
      link.offer()
        .then((sdp) => encodeCode("offer", { v: version, sdp, setup: { map: net.sk.map, sk: net.sk, seed } }))
        .then((code) => { out.value = code; copy.disabled = false; ctl.code = code; panel.status(tr("Waiting for the answer code.")); })
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
        .then((d) => { if (d.kind !== "offer") throw new Error("non e' un'offerta"); return link.answer(d.data.sdp); })
        .then((sdp) => encodeCode("answer", { v: version, sdp }))
        .then((code) => { out.value = code; copy.disabled = false; ctl.code = code; if (!opened) panel.status(tr("Waiting for the other player to connect...")); })
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
    if (!waitSince) { waitSince = now; return; }
    if (now - waitSince > WAIT_BAR && !bar.waiting) { bar.waiting = tr("Waiting for the other player..."); showBar(); }
    if (now - waitSince > WAIT_PANEL && !waitPanel && !fake) {
      waitPanel = new NetPanel();
      waitPanel.title(tr("Waiting for the other player..."));
      waitPanel.text(tr("The other player's game is not answering. You can wait, or leave the game."));
      waitPanel.button(waitPanel.row(), tr("Leave the game"), () => { closeWait(); ls.leave(); toMenu(); }, { name: "leave" });
    }
  };

  Object.assign(ctl, {
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
  });
  // lo stato del lockstep, letto ogni volta (per le prove e la diagnostica)
  for (const k of ["state", "delay", "checks", "desync", "rtt"]) Object.defineProperty(ctl, k, { get: () => ls[k], enumerable: true });
  return ctl;
}
