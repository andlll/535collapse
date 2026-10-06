// Renderer WebGL2: un solo shader, quad a lotti, piu' texture per lotto.
//
// Ogni vertice porta l'indice della texture (pagina d'atlas o sfondo) e lo
// shader sceglie il sampler con una catena di if: con 16 unita' di texture
// (il minimo garantito da WebGL2) tutte le pagine stanno legate insieme e una
// scena intera e' di solito UNA chiamata di disegno. Si svuota il lotto solo
// quando serve una texture nuova e le unita' sono finite, o il buffer e' pieno.
//
// Alpha premoltiplicato ovunque (texture caricate premoltiplicate da
// assets.js, blend ONE / ONE_MINUS_SRC_ALPHA): l'RGB dei pixel trasparenti,
// alterato dalla compressione WebP, non sbava (STUDIO.md §2.1).

const MAX_QUADS = 16384;
const FLOATS_PER_VERTEX = 6; // x, y, u, v, colore (4 byte), unita'
const BYTES_PER_VERTEX = FLOATS_PER_VERTEX * 4;

const VS = `#version 300 es
layout(location=0) in vec2 aPos;
layout(location=1) in vec2 aUv;
layout(location=2) in vec4 aColor;
layout(location=3) in float aUnit;
uniform vec4 uView; // x, y, larghezza, altezza della view in coordinate di room
out vec2 vUv;
out vec4 vColor;
flat out int vUnit;
void main() {
  vec2 p = (aPos - uView.xy) / uView.zw;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  vUv = aUv;
  vColor = aColor;
  vUnit = int(aUnit + 0.5);
}`;

function fragmentShader(units) {
  let pick = "";
  for (let i = 0; i < units; i++) {
    pick += `${i ? "else " : ""}if (vUnit == ${i}) t = texture(uTex[${i}], vUv);\n`;
  }
  return `#version 300 es
precision mediump float;
uniform sampler2D uTex[${units}];
in vec2 vUv;
in vec4 vColor;
flat in int vUnit;
out vec4 outColor;
void main() {
  vec4 t = vec4(1.0);
  ${pick}
  outColor = t * vColor;
}`;
}

// Riconoscimento del rendering software: con questi renderer il gioco gira
// a pochi fps e l'utente va avvisato (STUDIO.md, lezioni di NIMBUS).
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.textures = new Set();
    this.stats = { drawCalls: 0, quads: 0 };
    this.lost = false;
  }

  // Crea il contesto. Prima chiede di fallire se le prestazioni sarebbero
  // molto scarse; se non c'e' altro, accetta e segna `slowContext`.
  init() {
    const opts = { alpha: false, antialias: false, premultipliedAlpha: true,
                   preserveDrawingBuffer: false, powerPreference: "high-performance" };
    let gl = this.canvas.getContext("webgl2", { ...opts, failIfMajorPerformanceCaveat: true });
    this.slowContext = !gl;
    if (!gl) gl = this.canvas.getContext("webgl2", opts);
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    this.rendererString = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    this.software = this.slowContext || SOFTWARE.test(this.rendererString);
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    // [§6.8 G0] tempo GPU per fotogramma (pannello F3): query di
    // temporizzazione, se il browser le espone (Chrome desktop di solito si',
    // Firefox e Safari spesso no)
    this.timer = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    this.timing = false;   // le misure girano solo col pannello aperto
    this.gpuQuery = null;  // query del fotogramma in corso
    this.gpuPending = [];  // query chiuse, in attesa del risultato
    this.gpuMs = [];       // risultati recenti in ms
    this.units = Math.min(16, gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
    // cresce a ogni contesto nuovo: chi tiene oggetti GL propri (fogdraw.js)
    // sa che deve ricrearli
    this.generation = (this.generation || 0) + 1;
    this._createPipeline();
  }

  _createPipeline() {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        throw new Error(gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fragmentShader(this.units)));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error(gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);
    this.uView = gl.getUniformLocation(prog, "uView");
    gl.uniform1iv(gl.getUniformLocation(prog, "uTex"), [...Array(this.units).keys()]);

    this.data = new ArrayBuffer(MAX_QUADS * 4 * BYTES_PER_VERTEX);
    this.f32 = new Float32Array(this.data);
    this.u32 = new Uint32Array(this.data);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, BYTES_PER_VERTEX, 16);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, BYTES_PER_VERTEX, 20);
    // 16384 quad = 65536 vertici: servono indici a 32 bit.
    const idx32 = new Uint32Array(MAX_QUADS * 6);
    for (let q = 0, v = 0, i = 0; q < MAX_QUADS; q++, v += 4) {
      idx32[i++] = v; idx32[i++] = v + 1; idx32[i++] = v + 2;
      idx32[i++] = v; idx32[i++] = v + 2; idx32[i++] = v + 3;
    }
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx32, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    this.count = 0;
    // slots[i] = la texture legata ADESSO all'unita' i (specchio dello stato
    // GL, valido anche fra un fotogramma e l'altro: ogni bindTexture passa
    // da _unit). Serve anche a slegare una superficie prima di disegnarci.
    this.slots = new Array(this.units).fill(null);
    this.used = new Uint8Array(this.units); // unita' lette dal lotto in corso
    this.evict = 0;
  }

  // --------------------------------------------------------------- texture

  // Carica un ImageBitmap gia' premoltiplicato (assets.js). `repeat` per gli
  // sfondi ripetuti; le pagine d'atlas restano CLAMP.
  createTexture(bitmap, repeat = false) {
    const gl = this.gl;
    const t = { tex: gl.createTexture(), width: bitmap.width, height: bitmap.height, bytes: bitmap.width * bitmap.height * 4 };
    this._bindForEdit(t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    this.textures.add(t);
    return t;
  }

  // Lega `t` a un'unita' e la rende attiva, per texImage2D & co.
  _bindForEdit(t) {
    this.flush();
    this.gl.activeTexture(this.gl.TEXTURE0 + this._unit(t));
  }

  deleteTexture(t) {
    if (!t) return;
    this.gl.deleteTexture(t.tex);
    this.textures.delete(t);
    const i = this.slots.indexOf(t);
    if (i >= 0) this.slots[i] = null;
  }

  // Texture a un canale (LUMINANCE: si legge come grigio, alpha 1) per dati
  // a bassa risoluzione, filtrata linearmente. Piena di zeri.
  createDataTexture(w, h) {
    const gl = this.gl;
    const t = { tex: gl.createTexture(), width: w, height: h, bytes: w * h };
    this._bindForEdit(t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(w * h));
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.add(t);
    return t;
  }

  // Copia il rettangolo [x, x+w) x [y, y+h) di `data` (righe lunghe
  // `rowLength`) nella stessa posizione della texture.
  uploadDataRegion(t, x, y, w, h, data, rowLength) {
    if (w <= 0 || h <= 0) return;
    const gl = this.gl;
    this._bindForEdit(t); // i quad in attesa devono vedere i dati vecchi
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, rowLength);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, x);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  }

  // Superficie su cui disegnare (surface_create di GameMaker, ma piccola):
  // texture RGBA + framebuffer. Si usa come una texture qualunque in quad();
  // le righe sono capovolte (v da height a 0).
  createTarget(w, h) {
    const gl = this.gl;
    const t = { tex: gl.createTexture(), fb: gl.createFramebuffer(), width: w, height: h, bytes: w * h * 4 };
    this._bindForEdit(t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.textures.add(t);
    return t;
  }

  deleteTarget(t) {
    if (!t) return;
    this.gl.deleteFramebuffer(t.fb);
    this.deleteTexture(t);
  }

  // surface_set_target: da qui si disegna sulla superficie, che copre il
  // rettangolo di room (x, y, w, h) e parte pulita col colore `clearRGB`.
  // Le superfici si possono annidare (la notte dentro lo sfondo sfumato del
  // menu di pausa): endTarget torna alla precedente.
  beginTarget(t, x, y, w, h, clearRGB) {
    const gl = this.gl;
    this.flush();
    // la texture della superficie non deve restare legata a un'unita' mentre
    // ci si disegna sopra (ciclo di retroazione, errore di WebGL2)
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] !== t) continue;
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this.slots[i] = null;
    }
    (this.targets || (this.targets = [])).push({ t, proj: this.proj });
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.viewport(0, 0, t.width, t.height);
    gl.clearColor(clearRGB[0], clearRGB[1], clearRGB[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.setProjection(x, y, w, h);
  }

  // surface_reset_target
  endTarget() {
    const gl = this.gl;
    this.flush();
    const { proj } = this.targets.pop();
    const outer = this.targets.length ? this.targets[this.targets.length - 1].t : null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, outer ? outer.fb : null);
    gl.viewport(0, 0, outer ? outer.width : this.canvas.width, outer ? outer.height : this.canvas.height);
    this.setProjection(...proj);
  }

  // [§6.8 G0] Misura del tempo GPU di un fotogramma: gpuBegin dopo
  // beginFrame, gpuEnd dopo l'ultimo flush. Il risultato arriva qualche
  // fotogramma dopo (gpuPoll); le misure "disgiunte" (la GPU ha cambiato
  // frequenza o e' stata interrotta) si scartano. Una sola query attiva alla
  // volta, come chiede WebGL2.
  gpuBegin() {
    if (!this.timer || !this.timing || this.gpuQuery || this.gpuPending.length > 8) return;
    const gl = this.gl;
    this.gpuQuery = gl.createQuery();
    gl.beginQuery(this.timer.TIME_ELAPSED_EXT, this.gpuQuery);
  }

  gpuEnd() {
    if (!this.gpuQuery) return;
    this.flush();
    this.gl.endQuery(this.timer.TIME_ELAPSED_EXT);
    this.gpuPending.push(this.gpuQuery);
    this.gpuQuery = null;
  }

  gpuPoll() {
    const gl = this.gl;
    while (this.gpuPending.length) {
      const q = this.gpuPending[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      const disjoint = gl.getParameter(this.timer.GPU_DISJOINT_EXT);
      if (!disjoint) {
        this.gpuMs.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
        if (this.gpuMs.length > 60) this.gpuMs.shift();
      }
      gl.deleteQuery(q);
      this.gpuPending.shift();
    }
  }

  textureBytes() {
    let b = 0;
    for (const t of this.textures) b += t.bytes;
    return b;
  }

  // ------------------------------------------------------------- disegno

  // Proiezione: rettangolo di coordinate che riempie il canvas (la view di
  // room per il mondo, 0,0,larghezza,altezza CSS per Draw GUI).
  setProjection(x, y, w, h) {
    this.flush();
    this.gl.uniform4f(this.uView, x, y, w, h);
    this.proj = [x, y, w, h];
  }

  // draw_set_blend_mode [C: bm_normal, bm_add, bm_subtract nel codice].
  // Con l'alpha premoltiplicato: add = ONE, ONE. bm_subtract in GMS 1.x e'
  // (bm_zero, bm_inv_src_colour) [I, documentazione del motore]: la
  // destinazione moltiplicata per (1 - colore sorgente), cioe' scurisce.
  // E' il modo con cui l'originale applica nebbia e notte (manager Draw_End).
  setBlend(mode) {
    if (mode === this.blend) return;
    this.flush();
    const gl = this.gl;
    if (mode === "add") {
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ONE);
    } else if (mode === "replace") {
      // [§6.8] copia di una superficie su un'altra o sul canvas, alpha
      // ignorato: la sottrazione di nebbia e notte (sotto) azzera l'alpha
      // delle superfici, e con la miscela normale traspariva lo sfondo
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ZERO);
    } else if (mode === "subtract") {
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
    } else {
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    this.blend = mode;
  }

  beginFrame(view, clearRGB) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(clearRGB[0], clearRGB[1], clearRGB[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.targets = [];
    gl.uniform4f(this.uView, view.x, view.y, view.w, view.h);
    this.proj = [view.x, view.y, view.w, view.h];
    this.stats.drawCalls = 0;
    this.stats.quads = 0;
    this.blend = null;
    this.setBlend("normal");
  }

  _unit(t) {
    let i = this.slots.indexOf(t);
    if (i >= 0) { this.used[i] = 1; return i; }
    i = this.slots.indexOf(null);
    if (i < 0) i = this.used.indexOf(0);
    if (i < 0) {
      // unita' tutte lette dal lotto: lo si svuota e se ne riusa una a turno
      this.flush();
      i = this.evict++ % this.units;
    }
    this.slots[i] = t;
    this.used[i] = 1;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    return i;
  }

  // Quad generico: 4 angoli (x0..y3 in senso orario da in alto a sinistra),
  // rettangolo uv in pixel della texture, colore RGBA premoltiplicato a 8 bit
  // (uno per angolo se servono sfumature: c1..c3 valgono rgba se omessi).
  // Un triangolo e' un quad con gli ultimi due angoli coincidenti.
  quad(t, x0, y0, x1, y1, x2, y2, x3, y3, u0, v0, u1, v1, rgba, c1 = rgba, c2 = rgba, c3 = rgba) {
    if (this.count >= MAX_QUADS) this.flush();
    const unit = this._unit(t);
    const iw = 1 / t.width, ih = 1 / t.height;
    const f = this.f32, u = this.u32;
    let o = this.count * 4 * FLOATS_PER_VERTEX;
    f[o] = x0; f[o + 1] = y0; f[o + 2] = u0 * iw; f[o + 3] = v0 * ih; u[o + 4] = rgba; f[o + 5] = unit; o += 6;
    f[o] = x1; f[o + 1] = y1; f[o + 2] = u1 * iw; f[o + 3] = v0 * ih; u[o + 4] = c1; f[o + 5] = unit; o += 6;
    f[o] = x2; f[o + 1] = y2; f[o + 2] = u1 * iw; f[o + 3] = v1 * ih; u[o + 4] = c2; f[o + 5] = unit; o += 6;
    f[o] = x3; f[o + 1] = y3; f[o + 2] = u0 * iw; f[o + 3] = v1 * ih; u[o + 4] = c3; f[o + 5] = unit;
    this.count++;
    this.stats.quads++;
  }

  flush() {
    this.used.fill(0);
    if (!this.count) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.f32, 0, this.count * 4 * FLOATS_PER_VERTEX);
    gl.drawElements(gl.TRIANGLES, this.count * 6, gl.UNSIGNED_INT, 0);
    this.stats.drawCalls++;
    this.count = 0;
  }
}

// Colore GameMaker (intero BGR, 0xBBGGRR) + alpha -> RGBA premoltiplicato a
// 8 bit nell'ordine dei byte del vertice (little endian: R nel byte basso).
export function packColor(bgr, alpha = 1) {
  const a = Math.max(0, Math.min(1, alpha));
  const r = Math.round((bgr & 255) * a);
  const g = Math.round(((bgr >> 8) & 255) * a);
  const b = Math.round(((bgr >> 16) & 255) * a);
  return (r | (g << 8) | (b << 16) | (Math.round(a * 255) << 24)) >>> 0;
}

export function bgrToRGB(bgr) {
  return [(bgr & 255) / 255, ((bgr >> 8) & 255) / 255, ((bgr >> 16) & 255) / 255];
}
