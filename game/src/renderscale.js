// Risoluzione dinamica: se i frame disegnati arrivano piu' lenti del tetto
// fps, si riduce la risoluzione del canvas (non quella del mondo: la view
// resta la stessa, cambiano solo i pixel su cui la GPU disegna). Si risale
// piano quando c'e' margine. Lezione di NIMBUS sui telefoni; qui serve per i
// PC con grafica integrata e schermi ad alta densita'.

const MIN = 0.5, STEP = 0.1;

export class RenderScale {
  constructor() {
    this.enabled = true;
    this.scale = 1;
    this.samples = [];
    this.cooldown = 0;
    this.goodSince = 0;
  }

  // Intervallo fra due frame disegnati; restituisce true se la scala cambia.
  observe(now, intervalMs, targetMs) {
    if (!this.enabled) {
      if (this.scale !== 1) { this.scale = 1; return true; }
      return false;
    }
    this.samples.push(intervalMs);
    if (this.samples.length > 60) this.samples.shift();
    if (this.samples.length < 60 || now < this.cooldown) return false;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    if (avg > targetMs * 1.2 && this.scale > MIN) {
      this.scale = Math.max(MIN, Math.round((this.scale - STEP) * 10) / 10);
      this._changed(now);
      return true;
    }
    if (avg < targetMs * 1.05) {
      if (!this.goodSince) this.goodSince = now;
      if (now - this.goodSince > 5000 && this.scale < 1) {
        this.scale = Math.min(1, Math.round((this.scale + STEP) * 10) / 10);
        this._changed(now);
        return true;
      }
    } else {
      this.goodSince = 0;
    }
    return false;
  }

  _changed(now) {
    this.samples = [];
    this.cooldown = now + 2000;
    this.goodSince = 0;
  }
}
