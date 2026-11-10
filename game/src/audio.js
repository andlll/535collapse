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
//   meno di MIN_GAP ms: 40 boscaioli non fanno 40 colpi nello stesso istante.
const FAR = 700;      // px di mondo oltre il bordo della vista a cui il suono si spegne
const PAN = 0.6;      // pan massimo (ai bordi della vista)
const VOICES = 4;     // voci dello stesso suono insieme
const MIN_GAP = 45;   // ms minimi fra due suoni dello stesso nome
const PITCH = 0.07;   // +- velocita' di riproduzione (altezza)
const GAIN_VAR = 0.15; // +- volume

export class SoundBank {
  constructor(base = "assets/audio/") {
    this.base = base;
    this.ctx = null;
    this.master = null;
    this.enabled = true;   // settings.sfx (menu di pausa)
    this.world = true;     // [§9.139] i suoni del mondo (no nella battaglia di sfondo del menu principale)
    this.volume = 1;
    this.sounds = new Map(); // nome -> { buffers: [], gain, last, playing, at }
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

  setEnabled(on) { this.enabled = !!on; }

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
