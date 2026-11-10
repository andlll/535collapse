// [§9.137] Gli effetti sonori (il gioco originale non ne ha). Web Audio:
// - i suoni sono in assets/audio/ (tools/18_audio.py): audio.json dice, per
//   ogni nome, i file delle varianti; si scaricano tutti all'avvio, in
//   sottofondo (pochi KB l'uno), e un suono non ancora pronto non si sente;
// - il browser lascia partire l'audio solo dopo un gesto del giocatore:
//   l'AudioContext nasce (o riprende) al primo clic o tasto (unlock); fino
//   ad allora play() non fa niente (anche nelle prove senza gesti);
// - play(nome, x, y) sceglie una variante a caso (non la stessa di prima),
//   con altezza e volume un po' diversi ogni volta; il volume cala con la
//   distanza dalla vista (zero a FAR px fuori dal bordo) e il suono va un po'
//   a destra o a sinistra secondo dove succede (pan);
// - al massimo VOICES suoni uguali insieme, e non due dello stesso nome a
//   meno di MIN_GAP ms: 40 boscaioli non fanno 40 colpi nello stesso istante;
// - [§9.141] i suoni continui (la pioggia): ambient(nome, livello);
// - [§9.143] la musica, a parti in loop: music({ nome: volume }).
const FAR = 700;      // px di mondo oltre il bordo della vista a cui il suono si spegne
const PAN = 0.6;      // pan massimo (ai bordi della vista)
const VOICES = 4;     // voci dello stesso suono insieme
const MIN_GAP = 45;   // ms minimi fra due suoni dello stesso nome
const PITCH = 0.07;   // +- velocita' di riproduzione (altezza)
const GAIN_VAR = 0.15; // +- volume
const FADE_TAU = 1;   // [§9.141] s: costante di tempo con cui un suono continuo segue il suo livello
const MUSIC_TAU = 2.5; // [§9.143] s: con cui una parte della musica segue il suo volume

export class SoundBank {
  constructor(base = "assets/audio/") {
    this.base = base;
    this.ctx = null;
    this.master = null;
    this.enabled = true;   // settings.sfx (menu di pausa)
    this.world = true;     // [§9.139] i suoni del mondo (no nella battaglia di sfondo del menu principale)
    this.volume = 1;
    this.sounds = new Map(); // nome -> { buffers: [], gain, last, playing, at }
    this.ambients = new Map(); // [§9.141] nome -> { src, g, target, zeroAt }: i suoni continui (la pioggia)
    this.layers = new Map();   // [§9.143] nome -> { src, g, target }: le parti della musica che suonano
    this.musicEnabled = true;  // settings.music (menu di pausa)
    this.musicRoom = true;     // la musica in questa room (app.js: non nel menu principale, per ora)
    this.musicBus = null;
    this.musicT0 = null;       // l'istante (AudioContext) in cui sono partite tutte le parti
    this.cam = null;         // la vista: { x, y, w, h }
    this._manifest = null;
  }

  // Le varianti di ogni suono (audio.json); si decodificano quando c'e'
  // l'AudioContext (dopo il primo gesto)
  async load() {
    try {
      const r = await fetch(this.base + "audio.json");
      if (!r.ok) return;
      this._manifest = await r.json();
      this._raw = new Map();
      await Promise.all(Object.entries(this._manifest.sounds || {}).map(async ([name, s]) => {
        const files = await Promise.all(s.files.map(async (f) => {
          try { const q = await fetch(this.base + f); return q.ok ? await q.arrayBuffer() : null; } catch (e) { return null; }
        }));
        this._raw.set(name, { files: files.filter(Boolean), gain: s.gain ?? 1, pitch: s.pitch ?? PITCH });
      }));
      if (this.ctx) this._decode();
    } catch (e) { /* niente audio: il gioco va avanti muto */ }
  }

  _decode() {
    if (!this._raw || this._decoding) return;
    this._decoding = true;
    for (const [name, s] of this._raw) {
      const entry = { buffers: [], gain: s.gain, pitch: s.pitch, last: -1, playing: 0, at: -1e9 };
      this.sounds.set(name, entry);
      for (const ab of s.files) {
        // decodeAudioData consuma il buffer: una copia
        this.ctx.decodeAudioData(ab.slice(0)).then((b) => entry.buffers.push(b)).catch(() => {});
      }
    }
  }

  // Al primo gesto del giocatore (input.js lo chiama a ogni clic o tasto)
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
        this._decode();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    } catch (e) { this.ctx = null; }
  }

  // (spenti: i suoni continui si spengono subito, anche a gioco in pausa,
  // quando il manager non li aggiorna)
  setEnabled(on) {
    this.enabled = !!on;
    if (!this.enabled) for (const name of [...this.ambients.keys()]) this._stopAmbient(name);
  }

  // [§9.141] Un suono continuo (loop, audio.json "loop") al volume level
  // (0-1) per il suo gain, senza posizione: parte la prima volta che level e'
  // sopra 0 (da un punto a caso del giro), segue level dolcemente (FADE_TAU)
  // e si ferma qualche secondo dopo che level e' tornato a 0. La pioggia lo
  // chiama a ogni passo col livello delle gocce (manager.js), che sale e
  // scende in 5 s: il suono entra ed esce con loro.
  ambient(name, level) {
    const ctx = this.ctx, s = this.sounds.get(name);
    let a = this.ambients.get(name);
    const ok = this.enabled && this.world && ctx && ctx.state === "running" && s && s.buffers.length;
    const target = ok ? Math.max(0, Math.min(1, level || 0)) * s.gain : 0;
    if (!a) {
      if (target <= 0) return;
      const src = ctx.createBufferSource();
      src.buffer = s.buffers[0];
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g).connect(this.master);
      src.start(0, Math.random() * src.buffer.duration);
      a = { src, g, target: 0, zeroAt: null };
      this.ambients.set(name, a);
    }
    if (Math.abs(target - a.target) > 0.0005) {
      a.g.gain.setTargetAtTime(target, ctx.currentTime, FADE_TAU);
      a.target = target;
    }
    if (target > 0) a.zeroAt = null;
    else if (a.zeroAt === null) a.zeroAt = ctx.currentTime;
    else if (ctx.currentTime - a.zeroAt > FADE_TAU * 6) this._stopAmbient(name);
  }

  // [§9.143] La musica: le parti in loop (audio.json "music"), ognuna lunga
  // quanto vuole (gli archi 42 s, il field 92), che partono tutte nello
  // stesso istante (musicT0) e girano ognuna sul suo giro: si sfasano come
  // nella traccia unita dell'autore. Una parte decodificata dopo entra al
  // punto giusto del suo giro, come se fosse partita con le altre. Il gioco
  // da' il volume di ciascuna, 0-1 (per il suo gain), con music({ nome:
  // volume }) (music.js, dal manager); il volume lo segue in MUSIC_TAU s. La
  // musica ha un suo volume generale (musicBus), fuori dagli effetti.
  music(levels) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (!this.musicEnabled || !this.musicRoom) { this._stopMusic(); return; }
    if (!this.musicBus) {
      this.musicBus = ctx.createGain();
      this.musicBus.connect(ctx.destination);
    }
    if (this.musicT0 === null) this.musicT0 = ctx.currentTime + 0.05;
    for (const [name, level] of Object.entries(levels)) {
      const s = this.sounds.get(name);
      if (!s || !s.buffers.length) continue; // non ancora decodificata (o non c'e')
      let L = this.layers.get(name);
      if (!L) {
        const src = ctx.createBufferSource();
        src.buffer = s.buffers[0];
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(g).connect(this.musicBus);
        const d = src.buffer.duration, t = Math.max(ctx.currentTime, this.musicT0);
        src.start(t, (((t - this.musicT0) % d) + d) % d);
        L = { src, g, target: 0 };
        this.layers.set(name, L);
      }
      const target = Math.max(0, Math.min(1, level || 0)) * s.gain;
      if (Math.abs(target - L.target) > 0.002) {
        L.g.gain.setTargetAtTime(target, ctx.currentTime, MUSIC_TAU);
        L.target = target;
      }
    }
  }

  setMusicEnabled(on) {
    this.musicEnabled = !!on;
    if (!this.musicEnabled) this._stopMusic();
  }

  _stopMusic() {
    if (!this.layers.size) return;
    const t = this.ctx.currentTime;
    for (const L of this.layers.values()) {
      try {
        L.g.gain.cancelScheduledValues(t);
        L.g.gain.setTargetAtTime(0, t, 0.15);
        L.src.stop(t + 1);
      } catch (e) { /* gia' ferma */ }
    }
    this.layers.clear();
    this.musicT0 = null;
  }

  _stopAmbient(name) {
    const a = this.ambients.get(name);
    if (!a) return;
    try {
      const t = this.ctx.currentTime;
      a.g.gain.cancelScheduledValues(t);
      a.g.gain.setTargetAtTime(0, t, 0.08);
      a.src.stop(t + 0.5);
    } catch (e) { /* gia' fermo */ }
    this.ambients.delete(name);
  }

  // Quanto si sente un punto del mondo: 1 dentro la vista, poi giu' fino a 0
  // a FAR px dal bordo; pan secondo la x nella vista
  placement(x, y) {
    const c = this.cam;
    if (!c || x === undefined) return [1, 0];
    const dx = Math.max(c.x - x, 0, x - (c.x + c.w)), dy = Math.max(c.y - y, 0, y - (c.y + c.h));
    const g = Math.max(0, 1 - Math.hypot(dx, dy) / FAR);
    const pan = Math.max(-1, Math.min(1, (x - (c.x + c.w / 2)) / (c.w / 2))) * PAN;
    return [g, pan];
  }

  play(name, x, y, vol = 1) {
    const ctx = this.ctx;
    if (!this.enabled || !this.world || !ctx || ctx.state !== "running") return false;
    const s = this.sounds.get(name);
    if (!s || !s.buffers.length || s.playing >= VOICES) return false;
    const now = ctx.currentTime * 1000;
    if (now - s.at < MIN_GAP) return false;
    const [g, pan] = this.placement(x, y);
    if (g <= 0.01) return false;
    let k = Math.floor(Math.random() * s.buffers.length);
    if (s.buffers.length > 1 && k === s.last) k = (k + 1) % s.buffers.length;
    s.last = k; s.at = now; s.playing++;
    const src = ctx.createBufferSource();
    src.buffer = s.buffers[k];
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * (s.pitch ?? PITCH); // §9.140: per suono (audio.json "altezza")
    const gain = ctx.createGain();
    gain.gain.value = g * vol * s.gain * (1 + (Math.random() * 2 - 1) * GAIN_VAR);
    let node = src.connect(gain);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node = node.connect(p);
    }
    node.connect(this.master);
    src.onended = () => { s.playing--; };
    src.start();
    return true;
  }
}

// l'audio del gioco (uno solo: lo usano il mondo e i comportamenti)
export const audio = new SoundBank();
