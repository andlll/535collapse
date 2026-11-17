// [§9.156, multiplayer, fase 4] Il lockstep della partita a due.
//
// I due browser simulano la stessa partita (§9.152: deterministica) e si
// scambiano solo i comandi dei giocatori (§9.153-§9.155). Le regole:
// - RITARDO DEI COMANDI. Un comando dato quando il mondo e' al passo N si
//   esegue al passo N + D (D = `delay`, uguale per i due, deciso da chi crea
//   misurando il tempo di andata e ritorno: delayFor). Cosi' ha D passi di
//   tempo per arrivare all'altro.
// - I TURNI. Finito il passo N, ogni pagina manda il suo "turno" N + D: i
//   suoi comandi di quel passo, anche nessuno ({t: "T", s, c}). Il passo N
//   si gioca solo con il turno N dell'altro in mano (ready); i passi prima
//   di D non hanno comandi per costruzione. Se il turno non c'e' ancora la
//   pagina aspetta (il ciclo non avanza: loop.js); la piu' lenta detta il
//   passo a tutte e due.
// - L'ORDINE. I comandi di un passo si eseguono per (passo, giocatore,
//   numero) (commands.js runDue): uguale nelle due pagine qualunque sia
//   l'ordine d'arrivo. Anche i messaggi possono arrivare in disordine: ogni
//   messaggio dice a che passo si riferisce (il canale vero e' comunque in
//   ordine). I propri comandi si eseguono come li ha ricevuti l'altro (la
//   copia passata da JSON: -0, NaN, undefined uguali per tutti e due).
// - LE IMPRONTE. Ogni CHECK_EVERY passi ognuno manda l'impronta del suo stato
//   (snapshot.js stateHash, {t: "H"}); se differiscono, "desync": l'avviso.
//   Fino alla fine della partita (end: global.skWinner; dopo, vittoria e
//   sconfitta sono di chi guarda e le pagine si separano di proposito).
// - LA PAUSA e' un comando ("pausa", con il passo in cui e' stata chiesta):
//   tutte e due le pagine si fermano allo stesso passo. Riprende chi vuole
//   dei due ({t: "R", at}: il passo della pausa; se arriva prima della pausa
//   stessa, quella pausa non si apre). Due pause chieste insieme ne fanno una
//   (si ignora una pausa chiesta prima dell'ultima eseguita).
// - L'AVVIO. Aperto il canale ognuno manda {t: "hello"} con la versione del
//   gioco (devono essere uguali: e' lo stesso codice che simula). Chi crea
//   misura PINGS andate e ritorni, sceglie D e manda {t: "start", delay}.
// - LA FINE DEL CANALE. {t: "bye"}: l'altro ha lasciato la partita; il
//   canale chiuso senza saluto: la connessione si e' persa.
//
// Il modulo non conosce ne' il mondo ne' il browser: app.js (netgame.js) lo
// chiama prima e dopo ogni passo; il canale (`link`) e' quello vero (rtc.js)
// o uno finto (le prove). Prove: test/lockstep.test.mjs,
// test/browser/netfake.mjs, test/browser/rtc.mjs.

import { CHECK_EVERY } from "./commands.js";

export const NET_PROTO = 1;          // la forma dei messaggi
export const STEP_MS = 1000 / 60;    // un passo (60 al secondo in tutte le room)
export const MIN_DELAY = 4, MAX_DELAY = 15, PINGS = 5;
// il ritardo dei comandi per un tempo di andata e ritorno (ms): mezzo giro
// piu' un margine per i fotogrammi (il turno parte alla fine di un passo,
// si guarda all'inizio del prossimo fotogramma) e le irregolarita'
export const delayFor = (rtt) => Math.max(MIN_DELAY, Math.min(MAX_DELAY, Math.ceil((rtt / 2 + 40) / STEP_MS)));

export class Lockstep {
  // commands: la coda (commands.js); local: 0 (rosso, chi crea) o 1 (blu);
  // link: { send(obj), close() } (e chi lo crea chiama receive / opened /
  // closed); version: la versione del gioco; delay: fisso (prove) o null
  // (lo misura chi crea); emit(tipo, info): gli eventi per l'interfaccia
  constructor({ commands, local, link, version, delay = null, clock = () => performance.now(), emit = () => {}, checkEvery = CHECK_EVERY }) {
    this.commands = commands;
    this.local = local;
    this.remote = 1 - local;
    this.link = link;
    this.version = version;
    this.fixedDelay = delay;
    this.delay = null;
    this.clock = clock;
    this.emit = emit;
    this.checkEvery = checkEvery;
    this.state = "idle";       // idle -> hello -> running -> ended | left | lost | error
    this.base = 0;             // il passo da cui si comincia
    this.next = 0;             // il prossimo passo da giocare
    this.turns = new Set();    // i turni dell'altro arrivati (passi)
    this.sealed = -1;          // l'ultimo turno mandato
    this.mine = new Map();     // passo -> impronta (mia)
    this.theirs = new Map();   // passo -> impronta (dell'altro)
    this.checks = [];          // [passo, uguali]
    this.desync = null;        // { step, mine, theirs }
    this.rtts = [];
    this.rtt = null;
    this.gotHello = false;
    this.pausedAt = null;      // il passo della pausa in corso
    this.lastPause = -1;       // il passo dell'ultima pausa eseguita
    this.pendingPause = false; // una pausa chiesta da qui, non ancora eseguita
    this.resumed = new Set();  // pause gia' riprese dall'altro (anche prima di arrivarci)
    this.received = 0;         // messaggi arrivati (per la diagnostica)
  }

  get host() { return this.local === 0; }
  get running() { return this.state === "running"; }

  send(m) { try { this.link.send(m); } catch (e) { /* canale chiuso: lo dira' closed */ } }

  // il canale si e' aperto
  opened() {
    if (this.state !== "idle") return;
    this.state = "hello";
    this.send({ t: "hello", v: this.version, proto: NET_PROTO, p: this.local });
    this._maybeStart();
  }

  _maybeStart() {
    if (!this.host || this.state !== "hello" || !this.gotHello) return;
    if (this.fixedDelay !== null) { this._start(this.fixedDelay); return; }
    if (!this.rtts.length && !this._pinging) { this._pinging = true; this.send({ t: "ping", at: this.clock() }); }
  }

  _start(delay) {
    this.send({ t: "start", delay, rtt: this.rtt });
    this._begin(delay);
  }

  _begin(delay) {
    this.delay = delay;
    this.sealed = this.base + delay - 1; // i turni prima di base + D sono vuoti
    this.state = "running";
    this.emit("started", { delay, rtt: this.rtt });
    // i turni arrivati prima di "start" (solo con un canale in disordine)
    const early = this.early || [];
    this.early = null;
    for (const m of early) this.receive(m);
  }

  _fail(reason, info = {}) {
    if (this.state === "error") return;
    this.state = "error";
    this.emit("error", { reason, ...info });
  }

  // un messaggio dell'altro (gia' decodificato)
  receive(m) {
    if (!m || typeof m !== "object") return;
    this.received++;
    switch (m.t) {
      case "hello":
        if (m.v !== this.version || m.proto !== NET_PROTO) { this._fail("version", { theirs: m.v }); return; }
        if (m.p !== this.remote) { this._fail("role"); return; }
        this.gotHello = true;
        this._maybeStart();
        break;
      case "ping": this.send({ t: "pong", at: m.at }); break;
      case "pong": {
        if (!this.host || this.state !== "hello") return;
        this.rtts.push(Math.max(0, this.clock() - m.at));
        if (this.rtts.length < PINGS) { this.send({ t: "ping", at: this.clock() }); return; }
        const s = this.rtts.slice().sort((a, b) => a - b);
        this.rtt = s[s.length >> 1];
        this._start(delayFor(this.rtt));
        break;
      }
      case "start":
        if (this.host || this.state !== "hello") return;
        this.rtt = m.rtt ?? null;
        this._begin(m.delay);
        break;
      case "T": {
        if (this.state === "hello" || this.state === "idle") { (this.early ||= []).push(m); return; }
        // (doppio, o di un passo gia' giocato: da scartare, non succede su un canale affidabile)
        if (this.state !== "running" || this.turns.has(m.s) || m.s < this.base + this.delay || m.s < this.next) return;
        for (const c of m.c || []) {
          if (c && c.s === m.s && c.p === this.remote && typeof c.k === "string") this.commands.queue.push(c);
        }
        this.turns.add(m.s);
        break;
      }
      case "H":
        this.theirs.set(m.s, m.h);
        this._compare(m.s);
        break;
      case "R":
        this.resumed.add(m.at);
        if (this.pausedAt === m.at) { this.pausedAt = null; this.emit("resume", { by: this.remote, at: m.at }); }
        break;
      case "bye":
        if (["ended", "left", "lost", "error", "gone"].includes(this.state)) return;
        this.state = "left";
        this.emit("left");
        break;
      default: break; // sconosciuto: un'altra versione, l'ha gia' detto hello
    }
  }

  // il canale si e' chiuso (o e' fallito) senza saluto
  closed(why = "closed") {
    if (["ended", "left", "lost", "error", "gone"].includes(this.state)) return;
    this.state = "lost";
    this.emit("lost", { why });
  }

  // il passo `step` si puo' giocare?
  ready(step) {
    if (this.state === "ended") return true;
    if (this.state !== "running") return false;
    return step < this.base + this.delay || this.turns.has(step);
  }

  // il passo in cui si esegue un comando dato adesso (il mondo al passo now)
  cmdStep(now) { return now + (this.delay ?? 1); }

  // finito un passo (il mondo ora e' al passo now): i propri turni fino a
  // now - 1 + D, e ogni checkEvery passi l'impronta. ended: la partita e'
  // finita (da qui le pagine possono differire: niente piu' turni ne'
  // impronte, e niente piu' attese)
  afterStep(now, hash, ended = false) {
    if (this.state !== "running") return;
    this.turns.delete(now - 1);
    this.next = now;
    if (ended) { this.end(); return; }
    const q = this.commands;
    for (let s = this.sealed + 1; s <= now - 1 + this.delay; s++) {
      const mine = [], keep = [];
      for (const c of q.queue) (c.s === s && c.p === this.local ? mine : keep).push(c);
      const wire = mine.length ? JSON.parse(JSON.stringify(mine)) : [];
      if (mine.length) q.queue = keep.concat(wire);
      this.send(wire.length ? { t: "T", s, c: wire } : { t: "T", s });
      this.sealed = s;
    }
    if (now % this.checkEvery === 0) {
      const h = hash();
      this.mine.set(now, h);
      this.send({ t: "H", s: now, h });
      this._compare(now);
    }
  }

  _compare(s) {
    if (!this.mine.has(s) || !this.theirs.has(s)) return;
    const a = this.mine.get(s), b = this.theirs.get(s);
    this.mine.delete(s); this.theirs.delete(s);
    this.checks.push([s, a === b]);
    if (a !== b && !this.desync) {
      this.desync = { step: s, mine: a, theirs: b };
      this.emit("desync", this.desync);
    }
  }

  // la partita e' finita (global.skWinner, allo stesso passo per tutte e due)
  end() {
    if (this.state === "running") { this.state = "ended"; this.emit("ended"); }
  }

  // ------------------------------------------------------------ la pausa
  // chiesta da qui (Esc, il pulsante): un comando come gli altri
  requestPause(now) {
    if (this.state !== "running" || this.pendingPause || this.pausedAt !== null) return false;
    this.pendingPause = true;
    this.commands.issue("pausa", { at: now }, this.cmdStep(now), this.local);
    return true;
  }
  // eseguita (dentro il passo `step`, uguale nelle due pagine)
  executePause(step, c) {
    if (c.p === this.local) this.pendingPause = false;
    if (c.at <= this.lastPause) return false; // chiesta prima dell'ultima pausa: e' la stessa
    this.lastPause = step;
    if (this.resumed.has(step)) return false; // l'altro l'ha gia' ripresa
    this.pausedAt = step;
    this.emit("pause", { by: c.p, at: step });
    return true;
  }
  // ripresa da qui
  resume() {
    if (this.pausedAt === null) return false;
    const at = this.pausedAt;
    this.pausedAt = null;
    this.send({ t: "R", at });
    this.emit("resume", { by: this.local, at });
    return true;
  }

  // lasciare la partita: il saluto all'altro
  leave() {
    if (["running", "hello", "ended", "idle"].includes(this.state)) this.send({ t: "bye" });
    this.state = "gone";
    try { this.link.close(); } catch (e) { /* gia' chiuso */ }
  }
}
