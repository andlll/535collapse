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
    this.units = Math.min(16, gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
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
    this.slots = new Array(this.units).fill(null);
  }

  // --------------------------------------------------------------- texture

  // Carica un ImageBitmap gia' premoltiplicato (assets.js). `repeat` per gli
  // sfondi ripetuti; le pagine d'atlas restano CLAMP.
  createTexture(bitmap, repeat = false) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const t = { tex, width: bitmap.width, height: bitmap.height, bytes: bitmap.width * bitmap.height * 4 };
    this.textures.add(t);
    return t;
  }

  deleteTexture(t) {
    if (!t) return;
    this.gl.deleteTexture(t.tex);
    this.textures.delete(t);
    const i = this.slots.indexOf(t);
    if (i >= 0) this.slots[i] = null;
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
    gl.uniform4f(this.uView, view.x, view.y, view.w, view.h);
    this.stats.drawCalls = 0;
    this.stats.quads = 0;
    this.slots.fill(null);
    this.blend = null;
    this.setBlend("normal");
  }

  _unit(t) {
    let i = this.slots.indexOf(t);
    if (i >= 0) return i;
    i = this.slots.indexOf(null);
    if (i < 0) {
      this.flush();
      this.slots.fill(null);
      i = 0;
    }
    this.slots[i] = t;
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
