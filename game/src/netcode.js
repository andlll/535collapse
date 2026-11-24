// [§9.156, multiplayer, fase 4] I codici della partita a due.
//
// Decisione dell'autore (17 novembre 2026): senza server. Chi crea la
// partita manda all'altro un codice (in chat, per posta...), l'altro lo
// incolla e risponde con il suo, da incollare a sua volta. Il codice e' la
// descrizione WebRTC della connessione (SDP, con gli indirizzi gia'
// raccolti: niente "trickle", tutto in un colpo) e, in quello di chi crea,
// la partita: mappa, opzioni della schermaglia e seme (cosi' chi entra apre
// la stessa partita).
//
// Forma: "DV" + tipo (O: offerta di chi crea, A: risposta di chi entra) + la
// forma dei dati + i dati in base64url. Chi incolla puo' portarsi dietro
// spazi, a capo, virgolette della chat: si tiene solo cio' che sta
// nell'alfabeto del codice.
//
// [§9.202, richiesta dell'autore: i codici piu' corti] Le forme:
// - "c", il codice corto (~130-250 caratteri invece di ~600-780): dell'SDP
//   solo cio' che serve all'altro browser per collegarsi (ufrag e password
//   ICE, impronta DTLS, ruolo DTLS, gli indirizzi con tipo, protocollo,
//   porta e priorita'; porta SCTP e misura massima dei messaggi), in byte;
//   l'altra parte ne ricostruisce un SDP equivalente (sdpFromModel) nella
//   forma di Chrome, che tutti i browser accettano. Della partita la mappa
//   (un numero, o la mappa dell'editor col suo nome e la sua impronta, §9.192),
//   le opzioni (un numero per opzione), il seme. Una somma di controllo dice
//   se il codice e' stato rovinato per strada.
// - "z" (JSON compresso con deflate) o "p" (JSON in chiaro, per i browser
//   senza CompressionStream): la forma di prima (§9.156), con l'SDP intero.
//   Si usa quando l'SDP ha qualcosa che il codice corto non sa dire (un
//   browser diverso da quelli provati, una versione nuova): codice lungo, ma
//   la connessione e' quella di sempre. Il codice corto si fa solo se,
//   riletto, da' esattamente lo stesso modello (encodeCode lo controlla).
// Una forma sconosciuta (una versione futura del gioco) e' "proto".

import { SK_ROOMS, SK_DEFAULTS, skValues } from "./skirmish.js";
import { TEST_ROOM } from "./mapfile.js";

export const CODE_PROTO = 1; // la forma dei dati nel codice JSON (z, p)
export const SHORT_FORMAT = 2; // il primo byte del codice corto (c)
export const KIND = { offer: "O", answer: "A" };

export class CodeError extends Error {
  constructor(reason, extra = {}) { super(reason); this.reason = reason; Object.assign(this, extra); }
}

export const b64url = (bytes) => { // (export: §9.192, la mappa sul canale)
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const unb64url = (s) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
};
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
const canZip = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function";

// obj -> codice: il corto se si puo', se no il JSON (sopra)
export async function encodeCode(kind, obj) {
  const k = KIND[kind];
  if (!k) throw new Error("tipo di codice sconosciuto: " + kind);
  const { c, ...rest } = obj || {}; // (c: la forma di un codice riletto)
  const short = packShort(rest);
  if (short) return "DV" + k + "c" + b64url(short);
  const raw = new TextEncoder().encode(JSON.stringify({ c: CODE_PROTO, ...rest }));
  if (canZip()) return "DV" + k + "z" + b64url(await pipe(raw, new CompressionStream("deflate-raw")));
  return "DV" + k + "p" + b64url(raw);
}

// il testo incollato -> { kind, data }; CodeError con reason: "empty",
// "invalid" (non e' un codice, e' tagliato o rovinato), "proto" (un'altra
// forma: un'altra versione del gioco; version se si legge)
export async function decodeCode(text) {
  const t = String(text || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!t) throw new CodeError("empty");
  const m = /DV([OA])([a-z])([A-Za-z0-9_-]{16,})/.exec(t);
  if (!m) throw new CodeError("invalid");
  const kind = m[1] === "O" ? "offer" : "answer";
  if (m[2] === "c") return { kind, data: unpackShort(m[3], kind) };
  if (m[2] !== "z" && m[2] !== "p") throw new CodeError("proto", { kind });
  let data;
  try {
    let bytes = unb64url(m[3]);
    if (m[2] === "z") {
      if (!canZip()) throw new Error("niente DecompressionStream");
      bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    }
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    throw new CodeError("invalid", { kind });
  }
  if (!data || typeof data !== "object" || typeof data.sdp !== "string") throw new CodeError("invalid", { kind });
  if (data.c !== CODE_PROTO) throw new CodeError("proto", { kind, version: data.v });
  return { kind, data };
}

// ------------------------------------------------------ l'SDP in breve
// [§9.202] Il modello di una descrizione WebRTC con un solo canale dati (la
// nostra): cio' che l'altro browser usa per collegarsi. Null se l'SDP ha
// qualcosa che il modello non dice (allora il codice resta quello lungo).
// Si lasciano (non servono all'altra parte): la riga o=, i "foundation" dei
// candidati (si rifanno, uno per candidato), raddr e rport (solo
// diagnostica: si rimettono 0.0.0.0 e 0, come fa Chrome), generation,
// network-id e network-cost (preferenze di Chrome fra reti: la priorita',
// che resta, dice gia' l'ordine), extmap-allow-mixed, msid-semantic,
// sendrecv, porta e indirizzo nelle righe m= e c=.
const ICE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const ICE_RE = /^[A-Za-z0-9+/]{1,255}$/;
const SETUPS = ["actpass", "active", "passive"];
const TYPES = ["host", "srflx", "prflx", "relay"];
const TCPTYPES = [null, "active", "passive", "so"];
const MMS = [null, 262144, 1073741823]; // max-message-size: niente, Chrome e Safari, Firefox (o il numero)

export function sdpModel(sdp) {
  if (typeof sdp !== "string") return null;
  const M = { ufrag: null, pwd: null, fp: null, setup: null, bundle: false, trickle: false, eoc: false, mms: null, cands: [] };
  let v = false, media = 0, mid = false, sctp = false;
  const candUfrags = [];
  const once = (key, val) => { if (M[key] !== null && M[key] !== val) return false; M[key] = val; return true; };
  for (const raw of sdp.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let r;
    if (line === "v=0") v = true;
    else if (/^[ost]=/.test(line) || /^c=IN IP[46] \S+$/.test(line)) { /* non serve */ }
    else if ((r = /^m=application \d+ UDP\/DTLS\/SCTP webrtc-datachannel$/.exec(line))) media++;
    else if (line === "a=group:BUNDLE 0") M.bundle = true;
    else if (line === "a=extmap-allow-mixed" || /^a=msid-semantic:/.test(line) || line === "a=sendrecv") { /* non serve */ }
    else if (line === "a=ice-options:trickle") M.trickle = true;
    else if (line === "a=end-of-candidates") M.eoc = true;
    else if ((r = /^a=ice-ufrag:(\S+)$/.exec(line))) { if (!ICE_RE.test(r[1]) || !once("ufrag", r[1])) return null; }
    else if ((r = /^a=ice-pwd:(\S+)$/.exec(line))) { if (!ICE_RE.test(r[1]) || !once("pwd", r[1])) return null; }
    else if ((r = /^a=fingerprint:sha-256 ((?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2})$/.exec(line))) { if (!once("fp", r[1].toUpperCase())) return null; }
    else if ((r = /^a=setup:(\S+)$/.exec(line))) { if (!SETUPS.includes(r[1]) || !once("setup", r[1])) return null; }
    else if (line === "a=mid:0") mid = true;
    else if (line === "a=sctp-port:5000") sctp = true;
    else if ((r = /^a=max-message-size:(\d{1,10})$/.exec(line))) { const n = Number(r[1]); if (n > 0xffffffff || !once("mms", n)) return null; }
    else if (line.startsWith("a=candidate:")) {
      const c = candidate(line, candUfrags);
      if (!c) return null;
      M.cands.push(c);
    } else return null; // una riga che il modello non conosce
  }
  if (!v || media !== 1 || !mid || !sctp || !M.ufrag || !M.pwd || !M.fp || !M.setup) return null;
  if (candUfrags.some((u) => u !== M.ufrag)) return null;
  if (M.cands.length > 255) return null;
  return M;
}

// una riga a=candidate (RFC 8839) -> { type, proto, tcptype, addr, port, prio }
function candidate(line, candUfrags) {
  const m = /^a=candidate:\S+ 1 (udp|tcp) (\d{1,10}) (\S+) (\d{1,5}) typ (host|srflx|prflx|relay)((?: \S+ \S+)*)$/i.exec(line);
  if (!m) return null;
  const prio = Number(m[2]), port = Number(m[4]);
  if (prio > 0xffffffff || port > 65535) return null;
  const c = { type: m[5].toLowerCase(), proto: m[1].toLowerCase(), tcptype: null, addr: m[3], port, prio };
  const ext = m[6].trim() ? m[6].trim().split(" ") : [];
  for (let i = 0; i < ext.length; i += 2) {
    const [k, val] = [ext[i], ext[i + 1]];
    if (k === "raddr" || k === "rport" || k === "network-id" || k === "network-cost") continue;
    if (k === "generation") { if (val !== "0") return null; continue; }
    if (k === "ufrag") { candUfrags.push(val); continue; }
    if (k === "tcptype" && c.proto === "tcp" && TCPTYPES.includes(val) && c.tcptype === null) { c.tcptype = val; continue; }
    return null;
  }
  return c;
}

// il modello -> un SDP (la forma di Chrome). L'identita' della sessione
// (riga o=) viene dall'impronta: lo stesso codice da' lo stesso SDP.
export function sdpFromModel(M) {
  const fp = M.fp.split(":").map((h) => parseInt(h, 16));
  let sess = 1;
  for (let i = 0; i < 6; i++) sess = sess * 256 + fp[i];
  const L = ["v=0", `o=- ${sess} 2 IN IP4 127.0.0.1`, "s=-", "t=0 0"];
  if (M.bundle) L.push("a=group:BUNDLE 0");
  L.push("m=application 9 UDP/DTLS/SCTP webrtc-datachannel", "c=IN IP4 0.0.0.0");
  M.cands.forEach((c, i) => {
    let s = `a=candidate:${i + 1} 1 ${c.proto} ${c.prio} ${c.addr} ${c.port} typ ${c.type}`;
    if (c.type !== "host") s += c.addr.includes(":") ? " raddr :: rport 0" : " raddr 0.0.0.0 rport 0";
    if (c.tcptype) s += " tcptype " + c.tcptype;
    L.push(s);
  });
  if (M.eoc) L.push("a=end-of-candidates");
  L.push("a=ice-ufrag:" + M.ufrag, "a=ice-pwd:" + M.pwd);
  if (M.trickle) L.push("a=ice-options:trickle");
  L.push("a=fingerprint:sha-256 " + M.fp, "a=setup:" + M.setup, "a=mid:0", "a=sctp-port:5000");
  if (M.mms !== null) L.push("a=max-message-size:" + M.mms);
  return L.join("\r\n") + "\r\n";
}

// ------------------------------------------------- gli indirizzi in byte
const V4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const MDNS_RE = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/;
const hexBytes = (h) => Array.from({ length: h.length / 2 }, (_, i) => parseInt(h.slice(2 * i, 2 * i + 2), 16));
const bytesHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
// IPv6 nella forma canonica (RFC 5952: minuscole, lo zero piu' lungo come
// "::"): le altre forme restano testo
function v6text(b) {
  const g = Array.from({ length: 8 }, (_, i) => (b[2 * i] << 8) | b[2 * i + 1]);
  let best = -1, len = 1;
  for (let i = 0; i < 8; i++) {
    let j = i;
    while (j < 8 && g[j] === 0) j++;
    if (j - i > len) { best = i; len = j - i; }
    if (j > i) i = j - 1;
  }
  const hx = (a) => a.map((x) => x.toString(16)).join(":");
  return best < 0 ? hx(g) : hx(g.slice(0, best)) + "::" + hx(g.slice(best + len));
}
function v6bytes(s) {
  if (!/^[0-9a-f:]+$/.test(s)) return null;
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const part = (h) => (h === "" ? [] : h.split(":"));
  const a = part(halves[0]), z = halves.length === 2 ? part(halves[1]) : [];
  if (halves.length === 1 ? a.length !== 8 : a.length + z.length > 6) return null;
  const g = [...a, ...Array(8 - a.length - z.length).fill("0"), ...z];
  if (g.some((x) => !/^[0-9a-f]{1,4}$/.test(x))) return null;
  const b = g.flatMap((x) => { const n = parseInt(x, 16); return [n >> 8, n & 255]; });
  return v6text(b) === s ? b : null;
}

// --------------------------------------------------- scrivere e leggere
const NOPE = new Error("non va nel codice corto");
class Out {
  constructor() { this.b = []; }
  u8(x) { if (!(Number.isInteger(x) && x >= 0 && x < 256)) throw NOPE; this.b.push(x); }
  u16(x) { if (!(Number.isInteger(x) && x >= 0 && x < 65536)) throw NOPE; this.b.push(x >> 8, x & 255); }
  u32(x) { if (!(Number.isInteger(x) && x >= 0 && x <= 0xffffffff)) throw NOPE; this.b.push(x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); }
  bytes(a) { for (const x of a) this.u8(x); }
  str(s) { if (typeof s !== "string") throw NOPE; const u = new TextEncoder().encode(s); this.u8(u.length); this.bytes(u); }
  // le stringhe ICE (ufrag, password): 6 bit per carattere
  ice(s) {
    if (typeof s !== "string" || !(s === "" || ICE_RE.test(s))) throw NOPE;
    this.u8(s.length);
    let acc = 0, bits = 0;
    for (const ch of s) {
      acc = ((acc << 6) | ICE_CHARS.indexOf(ch)) & 0xffff;
      bits += 6;
      if (bits >= 8) { bits -= 8; this.b.push((acc >> bits) & 255); }
    }
    if (bits) this.b.push((acc << (8 - bits)) & 255);
  }
  varint(x) { if (!(Number.isInteger(x) && x >= 0 && x <= 0xffffffff)) throw NOPE; while (x >= 128) { this.b.push((x & 127) | 128); x = Math.floor(x / 128); } this.b.push(x); }
}
class In {
  constructor(b) { this.b = b; this.i = 0; }
  u8() { if (this.i >= this.b.length) throw new Error("finito"); return this.b[this.i++]; }
  u16() { return (this.u8() << 8) | this.u8(); }
  u32() { return ((this.u8() << 24) | (this.u8() << 16) | (this.u8() << 8) | this.u8()) >>> 0; }
  bytes(n) { const a = []; for (let k = 0; k < n; k++) a.push(this.u8()); return a; }
  str() { return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(this.bytes(this.u8()))); }
  ice() {
    const n = this.u8();
    let s = "", acc = 0, bits = 0;
    while (s.length < n) {
      if (bits < 6) { acc = ((acc << 8) | this.u8()) & 0xffff; bits += 8; }
      bits -= 6;
      s += ICE_CHARS[(acc >> bits) & 63];
    }
    return s;
  }
  varint() {
    let x = 0, mul = 1;
    for (let k = 0; k < 5; k++) { const b = this.u8(); x += (b & 127) * mul; if (!(b & 128)) return x; mul *= 128; }
    throw new Error("numero");
  }
}
// la somma di controllo: FNV-1a a 32 bit ripiegato a 16
function check16(b, n) {
  let h = 0x811c9dc5;
  for (let i = 0; i < n; i++) h = Math.imul(h ^ b[i], 0x01000193) >>> 0;
  return (h >>> 16) ^ (h & 0xffff);
}

// le chiavi delle opzioni, nell'ordine dei parametri (la mappa a parte)
const SK_KEYS = Object.keys(SK_DEFAULTS).filter((k) => k !== "map");
const CUSTOM_MAP = 63;

// I byte del codice corto (dopo i primi due campi, fissi per sempre: la
// forma e la versione del gioco, cosi' una versione futura sa dire "un'altra
// versione" anche se il resto cambia):
//   forma (SHORT_FORMAT), versione (lunghezza + UTF-8),
//   bit: ruolo DTLS (2), BUNDLE, trickle, end-of-candidates,
//        max-message-size (2: niente, 262144, 1073741823, il numero dopo),
//        c'e' la partita (setup);
//   ufrag, password (6 bit per carattere), impronta (32 byte),
//   [max-message-size], quanti candidati, i candidati: un byte (tipo 2 bit,
//   tcp 1, tcptype 2, indirizzo 3: lo stesso di un candidato prima, IPv4,
//   IPv6, nome mDNS "uuid.local", testo), l'indirizzo, la porta (2), la
//   priorita' (4);
//   l'offerta a cui risponde (o, solo nella risposta: 6 bit per carattere,
//   anche vuoto) o la partita: un byte (mappa 6 bit: SK_ROOMS o 63 per la
//   mappa dell'editor; ci sono le opzioni; c'e' la mappa dell'editor), le
//   opzioni (4 bit ciascuna, 15: assente; la mappa delle opzioni 0: quella
//   della partita), il seme (4), [nome e impronta della mappa dell'editor];
//   la somma di controllo (2).
function packShort(obj) {
  try {
    const keys = Object.keys(obj);
    if (!keys.every((k) => ["v", "sdp", "setup", "o"].includes(k)) || typeof obj.v !== "string") return null;
    if (("setup" in obj) === ("o" in obj)) return null; // l'offerta ha la partita, la risposta l'offerta a cui risponde
    const M = sdpModel(obj.sdp);
    if (!M) return null;
    const o = new Out();
    o.u8(SHORT_FORMAT);
    o.str(obj.v);
    const mmsCode = MMS.indexOf(M.mms) >= 0 ? MMS.indexOf(M.mms) : 3;
    o.u8(SETUPS.indexOf(M.setup) | (M.bundle ? 4 : 0) | (M.trickle ? 8 : 0) | (M.eoc ? 16 : 0) | (mmsCode << 5) | ("setup" in obj ? 128 : 0));
    o.ice(M.ufrag);
    o.ice(M.pwd);
    o.bytes(M.fp.split(":").map((h) => parseInt(h, 16)));
    if (mmsCode === 3) o.varint(M.mms);
    o.u8(M.cands.length);
    const seen = [];
    for (const c of M.cands) {
      let kind, payload;
      const ref = seen.indexOf(c.addr), mdns = MDNS_RE.exec(c.addr), v6 = v6bytes(c.addr);
      if (ref >= 0) { kind = 0; payload = [ref]; }
      else if (V4_RE.test(c.addr)) { kind = 1; payload = c.addr.split(".").map(Number); }
      else if (v6) { kind = 2; payload = v6; }
      else if (mdns) { kind = 3; payload = hexBytes(mdns.slice(1).join("")); }
      else { kind = 4; payload = null; }
      if (ref < 0) seen.push(c.addr);
      if (seen.length > 255) return null;
      o.u8(TYPES.indexOf(c.type) | (c.proto === "tcp" ? 4 : 0) | (TCPTYPES.indexOf(c.tcptype) << 3) | (kind << 5));
      if (payload) o.bytes(payload); else o.str(c.addr);
      o.u16(c.port);
      o.u32(c.prio);
    }
    if ("o" in obj) o.ice(obj.o);
    else {
      const s = obj.setup;
      if (!s || typeof s !== "object" || !Object.keys(s).every((k) => ["map", "sk", "seed", "custom"].includes(k))) return null;
      const map = s.map === TEST_ROOM ? CUSTOM_MAP : SK_ROOMS.indexOf(s.map);
      if (map < 0 || map > CUSTOM_MAP || (map === CUSTOM_MAP) !== ("custom" in s)) return null;
      o.u8(map | ("sk" in s ? 64 : 0) | ("custom" in s ? 128 : 0));
      if ("sk" in s) {
        const sk = s.sk;
        if (!sk || typeof sk !== "object" || !Object.keys(sk).every((k) => k in SK_DEFAULTS)) return null;
        const nib = [!("map" in sk) ? 15 : sk.map === s.map ? 0 : -1];
        for (const k of SK_KEYS) nib.push(!(k in sk) ? 15 : skValues(k).indexOf(sk[k]));
        if (nib.some((n) => n < 0 || n > 15)) return null;
        for (let i = 0; i < nib.length; i += 2) o.u8((nib[i] << 4) | (i + 1 < nib.length ? nib[i + 1] : 15));
      }
      o.u32(s.seed);
      if ("custom" in s) {
        const c = s.custom;
        if (!c || Object.keys(c).length !== 2 || typeof c.hash !== "string" || !/^[0-9a-f]{16}$/.test(c.hash)) return null;
        o.str(c.name);
        o.bytes(hexBytes(c.hash));
      }
    }
    o.u16(check16(o.b, o.b.length));
    const bytes = new Uint8Array(o.b);
    // riletto deve dare lo stesso: se no, il codice lungo
    const { c: form, ...back } = readShort(bytes);
    const same = stable({ ...obj, sdp: M }) === stable({ ...back, sdp: sdpModel(back.sdp) });
    return same ? bytes : null;
  } catch (e) {
    if (e !== NOPE) console.warn("[535 rete] codice corto non riuscito", e);
    return null;
  }
}

// i dati del codice corto (b64: il testo dopo "DVOc"/"DVAc"); CodeError come
// decodeCode. Il testo dopo la fine del codice (incollato insieme) non conta.
function unpackShort(b64, kind) {
  let bytes;
  try { bytes = unb64url(b64.length % 4 === 1 ? b64.slice(0, -1) : b64); } catch (e) { throw new CodeError("invalid", { kind }); }
  let version;
  try {
    const head = new In(bytes);
    if (head.u8() !== SHORT_FORMAT) { try { version = head.str(); } catch (e) { /* illeggibile */ } throw new CodeError("proto", { kind, version }); }
    return readShort(bytes);
  } catch (e) {
    if (e instanceof CodeError) throw e;
    throw new CodeError("invalid", { kind });
  }
}

function readShort(bytes) {
  const r = new In(bytes);
  if (r.u8() !== SHORT_FORMAT) throw new Error("forma");
  const v = r.str();
  const f = r.u8();
  if ((f & 3) === 3) throw new Error("ruolo");
  const M = { ufrag: r.ice(), pwd: r.ice(), fp: null, setup: SETUPS[f & 3], bundle: !!(f & 4), trickle: !!(f & 8), eoc: !!(f & 16), mms: null, cands: [] };
  M.fp = r.bytes(32).map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join(":");
  const mmsCode = (f >> 5) & 3;
  M.mms = mmsCode === 3 ? r.varint() : MMS[mmsCode];
  const n = r.u8(), seen = [];
  for (let k = 0; k < n; k++) {
    const b = r.u8(), kind = b >> 5;
    let addr;
    if (kind === 0) { addr = seen[r.u8()]; if (addr === undefined) throw new Error("indirizzo"); }
    else if (kind === 1) addr = r.bytes(4).join(".");
    else if (kind === 2) addr = v6text(r.bytes(16));
    else if (kind === 3) { const h = bytesHex(r.bytes(16)); addr = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.local`; }
    else if (kind === 4) addr = r.str();
    else throw new Error("indirizzo");
    if (kind !== 0) seen.push(addr);
    const proto = b & 4 ? "tcp" : "udp", tcptype = TCPTYPES[(b >> 3) & 3];
    if (tcptype && proto !== "tcp") throw new Error("tcptype");
    M.cands.push({ type: TYPES[b & 3], proto, tcptype, addr, port: r.u16(), prio: r.u32() });
  }
  const out = { c: SHORT_FORMAT, v, sdp: sdpFromModel(M) };
  if (!(f & 128)) out.o = r.ice();
  else {
    const m = r.u8(), map = m & 63;
    const setup = { map: map === CUSTOM_MAP ? TEST_ROOM : SK_ROOMS[map] ?? null };
    if (m & 64) {
      const nib = [];
      for (let i = 0; i < SK_KEYS.length + 1; i += 2) { const x = r.u8(); nib.push(x >> 4, x & 15); }
      const sk = {};
      if (nib[0] !== 15) sk.map = setup.map;
      // (un indice fuori dall'elenco, da un'altra versione: assente; lo dice
      // il controllo della versione)
      SK_KEYS.forEach((k, i) => { const vs = skValues(k), x = nib[i + 1]; if (x !== 15 && vs && x < vs.length) sk[k] = vs[x]; });
      setup.sk = sk;
    }
    setup.seed = r.u32();
    if (m & 128) setup.custom = { name: r.str(), hash: bytesHex(r.bytes(8)) };
    out.setup = setup;
  }
  const end = r.i;
  if (r.u16() !== check16(bytes, end)) throw new Error("somma di controllo");
  return out;
}

// JSON con le chiavi in ordine (il confronto di packShort)
function stable(x) {
  if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
  if (x && typeof x === "object") return "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + stable(x[k])).join(",") + "}";
  return JSON.stringify(x);
}
