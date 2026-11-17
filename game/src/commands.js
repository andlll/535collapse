// [§9.153, multiplayer, fase 2, passo 1] I comandi della partita: una coda,
// un registro, il replay.
//
// LO SCOPO (STUDIO.md §9.152-§9.153). In una partita in rete (lockstep) i
// due browser simulano la stessa partita e si scambiano solo i comandi dei
// giocatori; ogni comando si esegue allo stesso passo da tutti e due. Oggi
// invece gli ordini sono eventi delle istanze che leggono il mouse durante il
// passo (~140 gestori d'input, ~70 letture del mouse, ~150 punti in cui
// `selected` decide), come in GameMaker.
//
// IL PASSO 1 (questo file): l'infrastruttura, e un primo tipo di comando "di
// transizione" che copre tutto subito.
// - Comandi `input` (uno per passo, solo quando qualcosa cambia): la
//   fotografia dell'input di quel passo (mouse in pixel CSS, tasti e pulsanti
//   premuti/rilasciati, rotella) e della telecamera (posizione, misura,
//   zoom). In singolo bastano a rigiocare una partita identica (il resto e'
//   deterministico: §9.152). NON bastano in rete: i pulsanti dell'interfaccia
//   seguono la vista di chi gioca, e l'input del secondo giocatore dovra'
//   muovere la parte nemica, che non ha comandi. Il passo 2 li sostituisce,
//   un'azione alla volta, coi comandi "veri" (sotto, `issue`).
// - Comandi "veri" (`issue(kind, data)`): l'azione con i suoi dati ("queste
//   unita' vanno li'"), eseguita all'inizio del passo, prima delle istanze,
//   da un gestore registrato (`on(kind, fn)`). Nessuno ancora: arrivano col
//   passo 2. La coda, l'ordine (passo, giocatore, numero), il registro e il
//   replay ci sono gia' e sono provati (test/commands.test.mjs).
// - Il registro (`record()`): il seme e la room, i comandi eseguiti e, ogni
//   CHECK_EVERY passi, l'impronta della partita (snapshot.js stateHash): un
//   replay (o l'altro giocatore) la confronta e sa dove si e' persa.
// - Il replay (`replay(log)`): la pagina, aperta con lo stesso seme, rifa' i
//   comandi del registro; l'input vero e' ignorato. Prova:
//   test/browser/replay.mjs.
//
// Chi lo usa: app.js (il passo: `frame` all'inizio, `runDue` prima del passo
// del mondo, `afterStep` alla fine), `window.__game.commands`.

export const CHECK_EVERY = 300; // passi fra due impronte nel registro

// la fotografia dell'input e della telecamera di un passo (solo i campi che
// la partita legge: input.js, camera.js)
function snapInput(input, cam) {
  return {
    x: input.x, y: input.y, in: input.inside, eh: input.edgeHold,
    d: [...input.down], p: [...input.pressed], ps: [...input.pressedShift], r: [...input.released],
    md: input.mouseDown.slice(), mp: input.mousePressed.slice(), mr: input.mouseReleased.slice(),
    wh: input.wheelStep, wf: input.wheelFine,
    cam: [cam.x, cam.y, cam.w, cam.h, cam.cssW, cam.cssH, cam.scaleview, cam.zoomTarget ?? null,
          cam.zoomAnchor ? cam.zoomAnchor.slice() : null],
  };
}
function applyInput(s, input, cam) {
  input.x = s.x; input.y = s.y; input.inside = s.in; input.edgeHold = s.eh;
  input.down = new Set(s.d); input.pressed = new Set(s.p); input.pressedShift = new Set(s.ps); input.released = new Set(s.r);
  input.mouseDown = s.md.slice(); input.mousePressed = s.mp.slice(); input.mouseReleased = s.mr.slice();
  input.wheelStep = s.wh; input.wheelFine = s.wf;
  const [x, y, w, h, cw, ch, sv, zt, za] = s.cam;
  Object.assign(cam, { x, y, w, h, cssW: cw, cssH: ch, scaleview: sv, zoomTarget: zt, zoomAnchor: za ? za.slice() : null });
}

export class Commands {
  constructor() {
    this.handlers = new Map(); // tipo -> fn(world, cmd)
    this.queue = [];           // comandi in attesa del loro passo
    this.seq = 0;              // numero progressivo dei comandi locali
    this.frameNo = 0;          // passi del ciclo (anche in pausa: l'input si legge lo stesso)
    this.log = null;           // il registro, se si registra
    this.play = null;          // il registro che si sta rigiocando
    this._last = "";           // l'ultima fotografia registrata (si registra solo cio' che cambia)
    this._snap = null;         // e quella da rimettere nei passi senza cambiamenti (replay)
    this._pi = 0; this._ci = 0;
  }

  // ------------------------------------------------ comandi "veri" (passo 2)
  on(kind, fn) { this.handlers.set(kind, fn); }
  // un comando del giocatore locale (p 0), eseguito all'inizio del passo
  // `step` del mondo (in singolo quello in corso; in rete qualche passo dopo)
  issue(kind, data, step, p = 0) {
    if (this.play) return null; // in replay contano solo i comandi del registro
    const c = { s: step, p, n: this.seq++, k: kind, ...data };
    this.queue.push(c);
    return c;
  }
  // all'inizio del passo del mondo: i comandi di questo passo, in un ordine
  // che non dipende da chi li ha ricevuti prima (passo, giocatore, numero)
  runDue(world) {
    const now = world._stepNo;
    if (this.play) {
      const L = this.play.cmds;
      while (this._ci < L.length && L[this._ci].s <= now) this.queue.push(L[this._ci++]);
    }
    const due = this.queue.filter((c) => c.s <= now).sort((a, b) => a.s - b.s || a.p - b.p || a.n - b.n);
    if (!due.length) return;
    this.queue = this.queue.filter((c) => c.s > now);
    for (const c of due) {
      const fn = this.handlers.get(c.k);
      if (!fn) throw new Error("comando sconosciuto: " + c.k);
      if (this.log) this.log.cmds.push(c);
      fn(world, c);
    }
  }

  // ------------------------------------------------ l'input (transizione)
  // all'inizio di ogni passo del ciclo, dopo input.beginStep(): in replay
  // rimette l'input e la telecamera del registro; registrando, li scrive
  frame(input, cam) {
    const f = this.frameNo++;
    if (this.play) {
      const L = this.play.frames;
      while (this._pi < L.length && L[this._pi][0] <= f) this._snap = L[this._pi++][1];
      if (this._snap) applyInput(this._snap, input, cam);
      return;
    }
    if (!this.log) return;
    const s = snapInput(input, cam), j = JSON.stringify(s);
    if (j !== this._last) { this.log.frames.push([f, s]); this._last = j; }
  }
  // alla fine di ogni passo del mondo: l'impronta nel registro (e, in replay,
  // il confronto con quella registrata)
  afterStep(world, hash) {
    const now = world._stepNo;
    if (now % CHECK_EVERY !== 0) return;
    if (this.log) this.log.checks.push([now, hash()]);
    if (this.play) {
      const want = this.play.checks.find(([s]) => s === now);
      if (want) {
        const h = hash();
        (this.play.result ||= []).push([now, h === want[1]]);
        if (h !== want[1] && this.play.divergedAt === undefined) this.play.divergedAt = now;
      }
    }
  }

  // ------------------------------------------------ registro e replay
  record(meta) {
    this.log = { v: 1, ...meta, frames: [], cmds: [], checks: [] };
    this._last = "";
    this.frameNo = 0;
  }
  stop() { const l = this.log; this.log = null; return l; }
  replay(log) {
    this.play = { ...log, result: [] };
    this.frameNo = 0; this._pi = 0; this._ci = 0; this._snap = null; this.queue = [];
  }
}
