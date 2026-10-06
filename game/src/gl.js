// Renderer WebGL2: un solo shader, quad a lotti, piu' texture per lotto.
//
// Ogni vertice porta l'indice della texture (pagina d'atlas o sfondo) e lo
// shader sceglie il sampler (con un albero di if, §7.11 G2): con 16 unita' di texture
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

// [§7.11 G2] La texture del vertice si sceglie con un albero di confronti
// (log2(16) = 4 invece di fino a 16 if in catena) e si legge con textureLod
// al livello 0: le texture non hanno mipmap, quindi i pixel sono identici a
// texture(), ma una lettura senza derivate puo' stare dentro un ramo vero.
// Con texture() ANGLE (WebGL su Direct3D, Chrome su Windows) tende ad
// appiattire i rami e a leggere tutte le unita' a ogni pixel.
function pickTree(lo, hi) {
  if (hi - lo === 1) return `t = textureLod(uTex[${lo}], vUv, 0.0);`;
  const mid = (lo + hi) >> 1;
  return `if (vUnit < ${mid}) { ${pickTree(lo, mid)} } else { ${pickTree(mid, hi)} }`;
}

function fragmentShader(units) {
  return `#version 300 es
precision mediump float;
uniform sampler2D uTex[${units}];
in vec2 vUv;
in vec4 vColor;
flat in int vUnit;
out vec4 outColor;
void main() {
  vec4 t;
  ${pickTree(0, units)}
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
    this.prog = prog;
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

// --------------------------------------------- passaggi con shader propri
// [§7.12] Sfocatura della pausa e del vetro, nebbia e notte in un passaggio
// (G3), pannelli di vetro: un rettangolo disegnato con un programma
// dedicato, senza buffer (i 4 vertici vengono da gl_VertexID). uDst e' il
// rettangolo nelle coordinate della proiezione corrente, come quad().
const PASS_VS = `#version 300 es
uniform vec4 uView;
uniform vec4 uDst;
out vec2 vPos;
out vec2 vScr;
void main() {
  vec2 c = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vec2 p = mix(uDst.xy, uDst.zw, c);
  vec2 q = (p - uView.xy) / uView.zw;
  gl_Position = vec4(q.x * 2.0 - 1.0, 1.0 - q.y * 2.0, 0.0, 1.0);
  vPos = p;
  vScr = vec2(q.x, 1.0 - q.y); // 0..1 sulla superficie corrente, v dal basso come le texture
}`;

const PASS_FS = {
  // gaussiana separabile con letture bilineari a coppie: uO/uW gia' combinati
  blur: `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uDir;
uniform float uW[24];
uniform float uO[24];
uniform int uN;
in vec2 vScr;
out vec4 o;
void main() {
  vec4 a = texture(uSrc, vScr) * uW[0];
  for (int i = 1; i < 24; i++) {
    if (i >= uN) break;
    vec2 d = uDir * uO[i];
    a += (texture(uSrc, vScr + d) + texture(uSrc, vScr - d)) * uW[i];
  }
  o = a;
}`,
  // nebbia (griglia a un canale, filtro bicubico B-spline con 4 letture
  // bilineari) e notte (colore unico o superficie delle luci) composte:
  // con la miscela "subtract" dst * (1 - f) * (1 - n)
  fog: `#version 300 es
precision highp float;
uniform sampler2D uFog;
uniform vec2 uFogSize;   // celle
uniform float uFogCell;  // px di room per cella
uniform int uFogOn;
uniform sampler2D uNight;
uniform vec4 uNightRect; // x, y, w, h in room della superficie della notte
uniform vec3 uNightCol;
uniform int uNightMode;  // 0 niente, 1 colore unico, 2 superficie
in vec2 vPos;
out vec4 o;
vec4 cubic(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x, y = s.y - 4.0 * s.x, z = s.z - 4.0 * s.y + 6.0 * s.x;
  return vec4(x, y, z, 6.0 - x - y - z) * (1.0 / 6.0);
}
float bicubic(vec2 t) { // t in celle
  t -= 0.5;
  vec2 f = fract(t);
  t -= f;
  vec4 xc = cubic(f.x), yc = cubic(f.y);
  vec4 c = t.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 off = (c + vec4(xc.yw, yc.yw) / s) / uFogSize.xxyy;
  float s0 = textureLod(uFog, off.xz, 0.0).r, s1 = textureLod(uFog, off.yz, 0.0).r;
  float s2 = textureLod(uFog, off.xw, 0.0).r, s3 = textureLod(uFog, off.yw, 0.0).r;
  float sx = s.x / (s.x + s.y), sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}
void main() {
  float f = uFogOn == 1 ? bicubic(vPos / uFogCell) : 0.0;
  vec3 n = vec3(0.0);
  if (uNightMode == 1) n = uNightCol;
  else if (uNightMode == 2) n = textureLod(uNight, vec2((vPos.x - uNightRect.x) / uNightRect.z, 1.0 - (vPos.y - uNightRect.y) / uNightRect.w), 0.0).rgb;
  o = vec4(1.0 - (1.0 - f) * (1.0 - n), 1.0);
}`,
  // pannello di vetro: lo sfondo sfocato dentro un rettangolo arrotondato,
  // piegato verso l'interno vicino al bordo (lente), con un riflesso sul
  // bordo illuminato dall'alto a sinistra
  glass: `#version 300 es
precision highp float;
uniform sampler2D uBg;
uniform vec4 uBox;   // centro x, y, mezza larghezza, mezza altezza (px della proiezione)
uniform float uR;    // raggio degli angoli
uniform vec2 uScale; // px della proiezione -> unita' 0..1 della superficie
uniform float uAlpha;
in vec2 vPos;
in vec2 vScr;
out vec4 o;
float sd(vec2 p) {
  vec2 q = abs(p) - uBox.zw + uR;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uR;
}
void main() {
  vec2 p = vPos - uBox.xy;
  float d = sd(p);
  float a = clamp(0.5 - d, 0.0, 1.0);
  if (a <= 0.0) discard;
  vec2 e = vec2(1.0, 0.0);
  vec2 nrm = normalize(vec2(sd(p + e.xy) - sd(p - e.xy), sd(p + e.yx) - sd(p - e.yx)) + 1e-5);
  float edge = clamp(-d / 16.0, 0.0, 1.0);
  float k = (1.0 - edge) * (1.0 - edge);
  vec2 uv = vScr - vec2(nrm.x, -nrm.y) * k * 12.0 * uScale;
  vec3 bg = texture(uBg, uv).rgb;
  float l = dot(bg, vec3(0.299, 0.587, 0.114));
  bg = mix(vec3(l), bg, 1.25);                         // un po' piu' saturo
  float rim = pow(1.0 - clamp(-d / 3.0, 0.0, 1.0), 2.0); // filo chiaro sul bordo
  float spec = k * clamp(dot(nrm, normalize(vec2(-1.0, -1.0))), 0.0, 1.0);
  vec3 col = bg + vec3(0.30 * spec + 0.25 * rim);
  o = vec4(clamp(col, 0.0, 1.0), 1.0) * a * uAlpha;
}`,
};

// Pesi di una gaussiana di deviazione `sigma` (in texel) per uno shader che
// legge a coppie col filtro bilineare: [offsets, weights], al piu' 24 valori.
export function gaussPairs(sigma) {
  const R = Math.min(46, Math.ceil(sigma * 3));
  const w = [];
  for (let i = 0; i <= R; i++) w.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const sum = w[0] + 2 * w.slice(1).reduce((a, b) => a + b, 0);
  const O = [0], W = [w[0] / sum];
  for (let i = 1; i <= R; i += 2) {
    const a = w[i], b = i + 1 <= R ? w[i + 1] : 0;
    O.push(i + b / (a + b));
    W.push((a + b) / sum);
  }
  return [O, W];
}

Object.assign(Renderer.prototype, {
  _passProg(name) {
    const gl = this.gl;
    this.passProgs = this.passGen === this.generation ? this.passProgs : {};
    this.passGen = this.generation;
    let p = this.passProgs[name];
    if (p) return p;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, PASS_VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, PASS_FS[name]));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(prog));
    const U = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i);
      const key = info.name.replace(/\[0\]$/, "");
      U[key] = gl.getUniformLocation(prog, info.name);
    }
    if (!this.passVao) this.passVao = gl.createVertexArray();
    p = this.passProgs[name] = { prog, U };
    return p;
  },

  // Disegna il rettangolo (x0, y0)-(x1, y1) della proiezione corrente col
  // programma `name`; set(gl, U, tex) imposta le uniform, tex(t) lega una
  // texture e ne restituisce l'unita'.
  pass(name, x0, y0, x1, y1, set) {
    const gl = this.gl;
    this.flush();
    const { prog, U } = this._passProg(name);
    gl.useProgram(prog);
    gl.bindVertexArray(this.passVao);
    gl.uniform4f(U.uView, ...this.proj);
    gl.uniform4f(U.uDst, x0, y0, x1, y1);
    set(gl, U, (t) => this._unit(t));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.stats.drawCalls++;
    this.used.fill(0);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
  },

  // Sfocatura gaussiana separabile di `src` in `dst` (stessa misura), con
  // `tmp` come appoggio: deviazione `sigma` in texel.
  blur(src, tmp, dst, sigma) {
    const [O, W] = gaussPairs(sigma);
    const run = (from, to, dx, dy) => {
      this.beginTarget(to, 0, 0, 1, 1, [0, 0, 0]);
      this.setBlend("replace");
      this.pass("blur", 0, 0, 1, 1, (gl, U, tex) => {
        gl.uniform1i(U.uSrc, tex(from));
        gl.uniform2f(U.uDir, dx / from.width, dy / from.height);
        gl.uniform1fv(U.uW, new Float32Array(24).fill(0).map((_, i) => W[i] || 0));
        gl.uniform1fv(U.uO, new Float32Array(24).fill(0).map((_, i) => O[i] || 0));
        gl.uniform1i(U.uN, O.length);
      });
      this.setBlend("normal");
      this.endTarget();
    };
    run(src, tmp, 1, 0);
    run(tmp, dst, 0, 1);
  },

  // Copia (ridotta, filtro lineare) di cio' che e' stato disegnato finora
  // sulla superficie corrente (o sul canvas) in `dst`.
  grab(dst) {
    const gl = this.gl;
    this.flush();
    const cur = this.targets && this.targets.length ? this.targets[this.targets.length - 1].t : null;
    const sw = cur ? cur.width : this.canvas.width, shh = cur ? cur.height : this.canvas.height;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, cur ? cur.fb : null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.fb);
    gl.blitFramebuffer(0, 0, sw, shh, 0, 0, dst.width, dst.height, gl.COLOR_BUFFER_BIT, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, cur ? cur.fb : null);
  },
});

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
