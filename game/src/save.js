// Salvataggi (Fase 4, decisione dell'autore §0.10: "come NIMBUS"). Metodo
// di n_redux (game/src/save.js): JSON esplicito con versione del formato e
// checksum leggero, uno slot in localStorage per il salvataggio rapido e un
// file esportabile/importabile.
//
// L'originale non salva nulla [C, §0.6]. In NIMBUS lo stato era gia' fatto
// di dati semplici; qui una partita e' il mondo intero: istanze (che si
// puntano fra loro: bersagli, chi parla in un dialogo, il fuoco di un palo),
// allarmi, globali, griglie dei percorsi e della nebbia, sistemi di
// particelle (l'erba decorativa e' fatta di particelle che durano per
// sempre). Lo si salva con una serializzazione generica del grafo degli
// oggetti:
// - gli oggetti raggiunti piu' volte (o in un ciclo) escono una volta sola
//   con un numero ({"$k": n, ...}) e poi come riferimento ({"$r": n});
// - le istanze del mondo sono marcate ("$t": "i") e perdono i campi che si
//   ricostruiscono dal mondo (parents, cells);
// - gli array tipizzati (nebbia, costi, flow field) escono come differenze
//   compresse a corse ([differenza, ripetizioni, ...]);
// - gli array di oggetti tutti con le stesse chiavi (le particelle) escono
//   per colonne; le colonne delle particelle sono arrotondate al millesimo
//   (solo aspetto, il gioco non le legge).
// Una funzione o una classe non prevista fa fallire il salvataggio con il
// percorso del campo: meglio un errore subito che una partita persa dopo.
//
// Il checksum (FNV-1a con un sale fisso, come NIMBUS) non e' una protezione
// vera: il gioco e' tutto nel browser. Scoraggia la modifica a mano di un
// numero nel file; un file modificato si scarta come non valido.

export const SAVE_VERSION = 1;
const GAME = "535";
const CHECKSUM_SALT = "535-collapse-a71e";

// ---------------------------------------------------------------- checksum

export function checksumOf(str) {
  let h = 0x811c9dc5;
  const salted = CHECKSUM_SALT + str;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// `_checksum` va per ultimo: verify() lo toglie e ritrova la stessa stringa
export function sign(data) {
  return { ...data, _checksum: checksumOf(JSON.stringify(data)) };
}

export function verify(signed) {
  if (!signed || typeof signed !== "object" || typeof signed._checksum !== "string") return null;
  const { _checksum, ...data } = signed;
  return checksumOf(JSON.stringify(data)) === _checksum ? data : null;
}

export function isValidSave(data) {
  return !!data && data.game === GAME && data.v === SAVE_VERSION && typeof data.room === "string" && !!data.state;
}

// ------------------------------------------------------- array tipizzati

const TYPED = { Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array };

// Corse di valori uguali: [x, n, x, n, ...]. Negli array interi x e' la
// differenza dal valore precedente (le distanze del goal field crescono di
// 1 lungo una riga: la differenza si ripete); nei float il valore stesso,
// cosi' la lettura ritrova esattamente gli stessi numeri.
const isFloat = (a) => a instanceof Float32Array || a instanceof Float64Array;

export function packTyped(a) {
  const out = [], delta = !isFloat(a);
  let prev = 0, x0 = 0, n = 0;
  for (let k = 0; k < a.length; k++) {
    const x = delta ? a[k] - prev : a[k];
    prev = a[k];
    if (n > 0 && (x === x0 || (x !== x && x0 !== x0))) { n++; continue; }
    if (n > 0) out.push(num(x0), n);
    x0 = x; n = 1;
  }
  if (n > 0) out.push(num(x0), n);
  return out;
}

export function unpackTyped(Ctor, len, runs) {
  const a = new Ctor(len), delta = !isFloat(a);
  let k = 0, v = 0;
  for (let r = 0; r < runs.length; r += 2) {
    const x = unnum(runs[r]);
    for (let n = runs[r + 1]; n > 0; n--) { v = delta ? v + x : x; a[k++] = v; }
  }
  return a;
}

// numeri che JSON non sa scrivere
function num(x) {
  if (Number.isFinite(x)) return x;
  return { $t: "n", v: x !== x ? "NaN" : x > 0 ? "Inf" : "-Inf" };
}
function unnum(x) {
  if (typeof x === "number") return x;
  return x.v === "NaN" ? NaN : x.v === "Inf" ? Infinity : -Infinity;
}

// ------------------------------------------------------------ grafo

const round3 = (x) => (Number.isInteger(x) ? x : Math.round(x * 1000) / 1000);

// opts.isInstance(o): l'oggetto e' un'istanza del mondo
// opts.skipInstanceKeys: campi delle istanze che non si salvano
// opts.classes: { nome: Classe } con stato nei soli campi propri
// opts.roundKeys: chiavi di array le cui colonne si arrotondano
export function encodeGraph(root, opts) {
  const { isInstance, skipInstanceKeys = [], classes = {}, roundKeys = [] } = opts;
  const skip = new Set(skipInstanceKeys), round = new Set(roundKeys);
  const className = new Map(Object.entries(classes).map(([n, C]) => [C, n]));
  const count = new Map();

  const fields = (o) => {
    const inst = isInstance(o);
    return Object.keys(o).filter((k) => !(inst && skip.has(k)));
  };
  const isPlain = (o) => {
    const p = Object.getPrototypeOf(o);
    return p === Object.prototype || p === null;
  };

  // passo 1: quante volte si raggiunge ogni oggetto
  const stack = [[root, "$"]];
  while (stack.length) {
    const [v, path] = stack.pop();
    if (typeof v === "function") throw new Error("salvataggio: funzione in " + path);
    if (v === null || typeof v !== "object") continue;
    const c = count.get(v) || 0;
    count.set(v, c + 1);
    if (c > 0) continue;
    if (ArrayBuffer.isView(v)) continue;
    if (Array.isArray(v)) { for (let k = v.length - 1; k >= 0; k--) stack.push([v[k], path + "[" + k + "]"]); continue; }
    if (v instanceof Set) { for (const x of v) stack.push([x, path + "{}"]); continue; }
    if (v instanceof Map) { for (const [a, b] of v) { stack.push([a, path + "<k>"], [b, path + "<v>"]); } continue; }
    if (!isPlain(v) && !className.has(v.constructor)) {
      throw new Error("salvataggio: classe " + (v.constructor && v.constructor.name) + " in " + path);
    }
    const ks = fields(v);
    for (let k = ks.length - 1; k >= 0; k--) stack.push([v[ks[k]], path + "." + ks[k]]);
  }

  // passo 2: scrittura, nello stesso ordine in cui la lettura ricostruisce
  const ids = new Map();
  let nextId = 0;
  const enc = (v, key) => {
    if (v === undefined) return { $t: "u" };
    if (v === null || typeof v === "boolean" || typeof v === "string") return v;
    if (typeof v === "number") return num(v);
    if (ids.has(v)) return { $r: ids.get(v) };
    const shared = count.get(v) > 1;
    const tag = (t, payload) => {
      const o = { $t: t };
      if (shared) { ids.set(v, nextId); o.$k = nextId++; }
      o.v = payload;
      return o;
    };
    if (ArrayBuffer.isView(v)) {
      const t = tag(v.constructor.name, null);
      t.n = v.length;
      t.v = packTyped(v);
      return t;
    }
    if (Array.isArray(v)) {
      // per colonne: oggetti semplici, non condivisi, tutti con le stesse chiavi
      if (v.length >= 8 && v.every((x) => x && typeof x === "object" && !Array.isArray(x) && isPlain(x)
          && !isInstance(x) && count.get(x) === 1)) {
        const keys = Object.keys(v[0]);
        const sig = keys.join(",");
        if (v.every((x) => Object.keys(x).join(",") === sig)) {
          const t = tag("rows", null);
          const r = round.has(key);
          t.v = { k: keys, c: keys.map((k) => v.map((x) => (r && typeof x[k] === "number" ? num(round3(x[k])) : enc(x[k], k)))) };
          return t;
        }
      }
      if (!shared) return v.map((x) => enc(x, key));
      const t = tag("a", null);
      t.v = v.map((x) => enc(x, key));
      return t;
    }
    if (v instanceof Set) { const t = tag("Set", null); t.v = [...v].map((x) => enc(x)); return t; }
    if (v instanceof Map) { const t = tag("Map", null); t.v = [...v].map(([a, b]) => [enc(a), enc(b)]); return t; }
    const inst = isInstance(v);
    const cname = isPlain(v) ? null : className.get(v.constructor);
    const body = () => {
      const o = {};
      for (const k of fields(v)) o[k] = enc(v[k], k);
      return o;
    };
    if (!inst && !cname && !shared && !Object.keys(v).some((k) => k[0] === "$")) return body();
    const t = tag(inst ? "i" : cname || "o", null);
    t.v = body();
    return t;
  };
  return enc(root, "");
}

// opts.classes come sopra; opts.instance(o): ripara un'istanza letta
// (parents, cells) prima che si leggano i suoi campi
export function decodeGraph(data, opts = {}) {
  const { classes = {}, instance = () => {} } = opts;
  const ids = [];
  const dec = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(dec);
    if ("$r" in v) return ids[v.$r];
    if (!("$t" in v)) {
      const o = {};
      for (const k of Object.keys(v)) o[k] = dec(v[k]);
      return o;
    }
    const keep = (o) => { if ("$k" in v) ids[v.$k] = o; return o; };
    switch (v.$t) {
      case "u": return undefined;
      case "n": return unnum(v);
      case "a": { const a = keep([]); for (const x of v.v) a.push(dec(x)); return a; }
      case "rows": {
        const a = keep([]);
        const { k: keys, c: cols } = v.v;
        const n = cols.length ? cols[0].length : 0;
        for (let r = 0; r < n; r++) a.push({});
        keys.forEach((k, j) => { const col = cols[j]; for (let r = 0; r < n; r++) a[r][k] = dec(col[r]); });
        return a;
      }
      case "Set": { const s = keep(new Set()); for (const x of v.v) s.add(dec(x)); return s; }
      case "Map": { const m = keep(new Map()); for (const [a, b] of v.v) m.set(dec(a), dec(b)); return m; }
      default: {
        if (TYPED[v.$t]) return keep(unpackTyped(TYPED[v.$t], v.n, v.v));
        const C = classes[v.$t];
        const o = keep(C ? Object.create(C.prototype) : {});
        for (const k of Object.keys(v.v)) o[k] = dec(v.v[k]);
        if (v.$t === "i") instance(o);
        return o;
      }
    }
  };
  return dec(data);
}

// --------------------------------------------------------- compressione

// gzip + base64 per localStorage (un mondo e' 1-2 MB di JSON, lo spazio di
// un sito e' circa 5 MB). Senza CompressionStream (browser vecchi) resta
// il JSON in chiaro.
export async function gzipBase64(str) {
  if (typeof CompressionStream === "undefined") return null;
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (let k = 0; k < buf.length; k += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
  return btoa(bin);
}

export async function gunzipBase64(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) buf[k] = bin.charCodeAt(k);
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

// -------------------------------------------------------------- slot

// uno slot per room: "535.save.match", "535.save.lvl01", ...
const slotKey = (room) => "535.save." + room;
export const SAVE_ROOMS = ["match", "lvl01", "lvl02"];

// data: { game, v, room, date, state }; ritorna il numero di byte scritti
export async function saveSlot(data) {
  const json = JSON.stringify(sign(data));
  const gz = await gzipBase64(json);
  const entry = JSON.stringify({ v: SAVE_VERSION, room: data.room, date: data.date, ...(gz ? { gz } : { json }) });
  localStorage.setItem(slotKey(data.room), entry);
  return entry.length;
}

// intestazione dello slot (per il menu) senza leggere il mondo
export function slotInfo(room) {
  try {
    const raw = localStorage.getItem(slotKey(room));
    if (!raw) return null;
    const e = JSON.parse(raw);
    return e && e.v === SAVE_VERSION ? { room: e.room, date: e.date } : null;
  } catch (e) { return null; }
}

export async function loadSlot(room) {
  try {
    const raw = localStorage.getItem(slotKey(room));
    if (!raw) return null;
    const e = JSON.parse(raw);
    return parseSave(e.gz ? await gunzipBase64(e.gz) : e.json);
  } catch (e) { return null; }
}

// testo di un file (o di uno slot) -> dati validi o null
export function parseSave(text) {
  try {
    const data = verify(JSON.parse(text));
    return isValidSave(data) ? data : null;
  } catch (e) { return null; }
}

// Il file importato passa al caricamento della pagina (ogni room ricarica
// la pagina): sessionStorage, o localStorage se manca.
const PENDING = "535.pending";
export async function setPending(data) {
  const json = JSON.stringify(sign(data));
  const value = (await gzipBase64(json)) || json;
  for (const s of [() => sessionStorage, () => localStorage]) {
    try { s().setItem(PENDING, value); return true; } catch (e) { /* prova il prossimo */ }
  }
  return false;
}

export async function takePending() {
  for (const s of [() => sessionStorage, () => localStorage]) {
    try {
      const v = s().getItem(PENDING);
      if (v) { s().removeItem(PENDING); return parseSave(v[0] === "{" ? v : await gunzipBase64(v)); }
    } catch (e) { /* storage non disponibile */ }
  }
  return null;
}

// ---------------------------------------------------------------- file

function fileName(room) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `535-${room}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}

// Download del file (funziona in tutti i browser; il dialog "Salva con
// nome" di Chrome/Edge non serve qui: un file per salvataggio).
export function saveFile(data) {
  const blob = new Blob([JSON.stringify(sign(data))], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName(data.room);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// <input type=file> fuori schermo; null se annullato o non valido
// (`invalid: true` se e' stato scelto un file che non e' un salvataggio)
export function openFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(input);
    input.onchange = async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) { resolve(null); return; }
      const data = parseSave(await file.text());
      resolve(data ? { data } : { invalid: true });
    };
    input.click();
  });
}
