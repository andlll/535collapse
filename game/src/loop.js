// Ciclo principale: simulazione a passo fisso, disegno con tetto agli fps.
//
// - Passo fisso alla velocita' della room (60 passi al secondo in tutte le
//   room [C]): alarm, durate e velocita' del gioco sono in passi, non in
//   millisecondi, quindi la logica gira sempre a 60 al secondo anche se si
//   disegna a 30.
// - Al massimo 5 passi per frame: dopo uno stallo (scheda lenta, debugger) il
//   gioco rallenta invece di "saltare" in avanti.
// - Tetto fps 30/60 (opzioni grafiche): a 30 si disegna un frame su due.
// - Pagina in background (visibilitychange): ciclo fermo, niente passi
//   recuperati al ritorno.

const MAX_STEPS = 5;

export class Loop {
  constructor({ speed = 60, step, render, onFrame }) {
    this.stepMs = 1000 / speed;
    this.step = step;
    this.render = render;
    this.onFrame = onFrame || (() => {});
    this.fpsCap = 60;
    this.running = false;
    this.acc = 0;
    this.last = 0;
    this.lastRender = 0;
    this._tick = this._tick.bind(this);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
      else if (this.wanted) this.start();
    });
  }

  start() {
    this.wanted = true;
    if (this.running || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame(this._tick);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  stop() {
    this.wanted = false;
    this.pause();
  }

  _tick(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this._tick);
    const t0 = performance.now();
    this.acc += Math.min(250, now - this.last);
    this.last = now;
    let steps = 0;
    while (this.acc >= this.stepMs && steps < MAX_STEPS) {
      this.step();
      this.acc -= this.stepMs;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    let rendered = false;
    // margine di 2 ms: rAF non arriva mai esattamente ogni 16,67 ms
    if (now - this.lastRender >= 1000 / this.fpsCap - 2) {
      this.render();
      this.lastRender = now;
      rendered = true;
    }
    this.onFrame({ now, steps, rendered, cpuMs: performance.now() - t0 });
  }
}
