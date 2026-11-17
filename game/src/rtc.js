// [§9.156, multiplayer, fase 4] Il canale della partita a due: WebRTC,
// connessione diretta fra i due browser (decisione dell'autore), un
// RTCDataChannel affidabile e in ordine. Niente server di gioco ne' di
// presentazione: le due descrizioni della connessione (offerta e risposta,
// netcode.js) le portano i giocatori, incollando i codici.
//
// Per attraversare i router serve un server STUN pubblico (dice a ognuno il
// suo indirizzo visto da fuori; nessun dato di gioco ci passa). Senza un
// server TURN (che inoltrerebbe il traffico) alcune reti non si collegano
// (NAT simmetrici, reti aziendali): si dice chiaramente (netgame.js).
//
// Gli indirizzi si raccolgono tutti prima di dare il codice (niente
// "trickle": il codice e' uno solo per parte). La raccolta finisce quando il
// browser la dice finita, o dopo GATHER_SOFT ms se ha gia' qualche
// indirizzo (un server STUN che non risponde la farebbe durare decine di
// secondi), al piu' dopo GATHER_MAX ms.
//
// FakeLink: il canale finto delle prove nel browser (test/browser/netfake.mjs):
// i messaggi in uscita restano in una coda che la prova porta all'altra
// pagina quando vuole (in ritardo, in disordine).

// [§9.156] i server STUN pubblici (scelta da confermare con l'autore: sono
// servizi esterni; ?stun=0 per farne a meno, in locale e nelle prove)
export const STUN_SERVERS = ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"];
const GATHER_SOFT = 2500, GATHER_MAX = 8000;
// il canale, uguale dalle due parti (negoziato: niente ondatachannel)
const CHANNEL = { negotiated: true, id: 0, ordered: true };

export const rtcAvailable = () => typeof RTCPeerConnection === "function";

export class RtcLink {
  constructor({ stun = true } = {}) {
    this.pc = new RTCPeerConnection({ iceServers: stun ? [{ urls: STUN_SERVERS }] : [] });
    this.dc = null;
    this.onopen = null; this.onmessage = null; this.onclose = null; this.onstate = null;
    this.isOpen = false;
    this._closed = false;
    this.candidates = 0;
    this.pc.addEventListener("icecandidate", (e) => { if (e.candidate) this.candidates++; });
    // [§9.156] Prima che il canale si sia mai aperto "failed" non e' la fine:
    // chi entra comincia i controlli subito, ma chi crea risponde solo dopo
    // aver incollato la risposta; senza risposte Chromium dice "failed" dopo
    // ~15 s, e si riprende appena arrivano i controlli dell'altro (provato:
    // risposta incollata dopo 40 s, connessi). Dopo l'apertura si'.
    this.everOpen = false;
    this.pc.addEventListener("connectionstatechange", () => {
      const s = this.pc.connectionState;
      if (this.onstate) this.onstate(s);
      if (s === "failed" && this.everOpen) this._end("failed");
      else if (s === "closed") this._end("closed");
    });
  }

  _wire() {
    const dc = this.pc.createDataChannel("535", CHANNEL);
    this.dc = dc;
    dc.addEventListener("open", () => { this.isOpen = this.everOpen = true; if (this.onopen) this.onopen(); });
    dc.addEventListener("message", (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch (err) { return; }
      if (this.onmessage) this.onmessage(m);
    });
    dc.addEventListener("close", () => this._end("closed"));
  }

  // tutti gli indirizzi raccolti (o abbastanza: sopra)
  _gathered() {
    const pc = this.pc;
    return new Promise((resolve) => {
      const t0 = performance.now();
      const done = () => { clearInterval(timer); pc.removeEventListener("icegatheringstatechange", check); resolve(); };
      const check = () => {
        const dt = performance.now() - t0;
        if (pc.iceGatheringState === "complete" || dt > GATHER_MAX || (dt > GATHER_SOFT && this.candidates > 0)) done();
      };
      const timer = setInterval(check, 100);
      pc.addEventListener("icegatheringstatechange", check);
      check();
    });
  }

  // chi crea: l'offerta (la descrizione della connessione, da mandare all'altro)
  async offer() {
    this._wire();
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await this._gathered();
    return this.pc.localDescription.sdp;
  }
  // chi entra: dall'offerta, la risposta
  async answer(offerSdp) {
    this._wire();
    await this.pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await this._gathered();
    return this.pc.localDescription.sdp;
  }
  // chi crea: la risposta dell'altro; poi la connessione si apre da se'
  async accept(answerSdp) {
    await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  send(m) {
    if (!this.dc || this.dc.readyState !== "open") throw new Error("canale non aperto");
    this.dc.send(JSON.stringify(m));
  }

  _end(why) {
    if (this._closed) return;
    this._closed = true;
    this.isOpen = false;
    if (this.onclose) this.onclose(why);
  }

  close() {
    this._closed = true;
    this.isOpen = false;
    try { if (this.dc) this.dc.close(); } catch (e) { /* gia' chiuso */ }
    try { this.pc.close(); } catch (e) { /* gia' chiuso */ }
  }
}

// il canale finto (prove): out e' la coda dei messaggi in uscita, come
// testo; deliver li consegna da fuori
export class FakeLink {
  constructor() {
    this.out = [];
    this.isOpen = false;
    this.onopen = null; this.onmessage = null; this.onclose = null; this.onstate = null;
    this._closed = false;
  }
  open() { if (!this.isOpen && !this._closed) { this.isOpen = true; if (this.onopen) this.onopen(); } }
  send(m) {
    if (this._closed) throw new Error("canale chiuso");
    this.out.push(JSON.stringify(m));
  }
  drain() { const o = this.out; this.out = []; return o; }
  deliver(list) {
    for (const s of list) {
      if (this._closed) return;
      if (this.onmessage) this.onmessage(JSON.parse(s));
    }
  }
  // l'altra parte e' sparita (senza saluto)
  drop(why = "closed") {
    if (this._closed) return;
    this._closed = true;
    this.isOpen = false;
    if (this.onclose) this.onclose(why);
  }
  close() { this._closed = true; this.isOpen = false; }
}
