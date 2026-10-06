// Pannello di diagnostica: dati da chiedere a chi prova il gioco su PC
// diversi. Si apre con F3 (e dal menu opzioni, quando ci sara') o con
// ?diag=1 nell'indirizzo. Aggiornato due volte al secondo.

export class Diagnostics {
  constructor(el) {
    this.el = el;
    this.frames = 0;
    this.cpu = 0;
    this.steps = 0;
    this.since = performance.now();
    this.visible = false;
  }

  toggle(on = !this.visible) {
    this.visible = on;
    this.el.hidden = !on;
  }

  frame(info) {
    if (info.rendered) this.frames++;
    this.cpu += info.cpuMs;
    this.steps += info.steps;
  }

  update(now, data) {
    if (!this.visible || now - this.since < 500) return;
    const secs = (now - this.since) / 1000;
    const fps = this.frames / secs;
    const lines = [
      `GPU: ${data.renderer}${data.software ? "  [SOFTWARE]" : ""}`,
      `fps ${fps.toFixed(0)} (tetto ${data.fpsCap})   passi/s ${(this.steps / secs).toFixed(0)}`,
      `CPU per frame ${(this.cpu / Math.max(1, this.frames)).toFixed(2)} ms`,
      `chiamate di disegno ${data.drawCalls}   quad ${data.quads}   istanze disegnate ${data.drawn}`,
      `memoria texture ${(data.textureBytes / 1048576).toFixed(0)} MB   texture ${data.textures}`,
      `canvas ${data.canvasW}x${data.canvasH}   scala ${data.renderScale.toFixed(1)}   dpr ${devicePixelRatio}`,
      `view ${data.view}   room ${data.room}`,
      `particelle ${data.particles} in ${data.systems} sistemi`,
      `MAX_TEXTURE_SIZE ${data.maxTextureSize}   unita' texture ${data.units}`,
    ];
    this.el.textContent = lines.join("\n");
    this.frames = 0;
    this.cpu = 0;
    this.steps = 0;
    this.since = now;
  }
}
