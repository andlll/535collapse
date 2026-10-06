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
    // [§6.8 G0] tempo GPU per fotogramma (media e massimo degli ultimi
    // risultati): se si avvicina ai 16,7 ms di un fotogramma a 60 fps, il
    // limite e' la scheda grafica; se e' basso e gli fps lo sono anche, e'
    // la CPU (riga sotto) o il browser
    const g = data.gpuMs || [];
    const gpu = !data.gpuTimer ? "non disponibile (il browser non espone EXT_disjoint_timer_query_webgl2)"
      : !g.length ? "in misura..."
      : `${(g.reduce((a, b) => a + b, 0) / g.length).toFixed(2)} ms (max ${Math.max(...g).toFixed(2)})`;
    const qn = { high: "alta", medium: "media", low: "bassa" }[data.quality] || data.quality;
    const lines = [
      `GPU: ${data.renderer}${data.software ? "  [SOFTWARE]" : ""}`,
      `fps ${fps.toFixed(0)} (tetto ${data.fpsCap})   passi/s ${(this.steps / secs).toFixed(0)}`,
      `CPU per frame ${(this.cpu / Math.max(1, this.frames)).toFixed(2)} ms   GPU per frame ${gpu}`,
      `qualita' ${qn}: mondo ${data.worldScale.toFixed(2)} px per px CSS, interfaccia ${data.canvasScale.toFixed(2)}`,
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
