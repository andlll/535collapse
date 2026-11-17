// [§9.156, multiplayer, fase 4] I codici della partita a due.
//
// Decisione dell'autore (17 novembre 2026): senza server. Chi crea la
// partita manda all'altro un codice lungo (in chat, per posta...), l'altro
// lo incolla e risponde con il suo, da incollare a sua volta. Il codice e'
// la descrizione WebRTC della connessione (SDP, con gli indirizzi gia'
// raccolti: niente "trickle", tutto in un colpo) e, in quello di chi crea,
// la partita: mappa, opzioni della schermaglia e seme (cosi' chi entra apre
// la stessa partita). Compresso (deflate) e in base64url.
//
// Forma: "DV" + tipo (O: offerta di chi crea, A: risposta di chi entra) +
// "z" (compresso) o "p" (no: browser senza CompressionStream) + i dati. Chi
// incolla puo' portarsi dietro spazi, a capo, virgolette della chat: si tiene
// solo cio' che sta nell'alfabeto del codice.

export const CODE_PROTO = 1; // la forma dei dati nel codice
export const KIND = { offer: "O", answer: "A" };

export class CodeError extends Error {
  constructor(reason, extra = {}) { super(reason); this.reason = reason; Object.assign(this, extra); }
}

const b64url = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
};
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
const canZip = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function";

// obj -> codice
export async function encodeCode(kind, obj) {
  const k = KIND[kind];
  if (!k) throw new Error("tipo di codice sconosciuto: " + kind);
  const raw = new TextEncoder().encode(JSON.stringify({ c: CODE_PROTO, ...obj }));
  if (canZip()) return "DV" + k + "z" + b64url(await pipe(raw, new CompressionStream("deflate-raw")));
  return "DV" + k + "p" + b64url(raw);
}

// il testo incollato -> { kind, data }; CodeError con reason: "empty",
// "invalid" (non e' un codice o e' tagliato), "proto" (un'altra forma)
export async function decodeCode(text) {
  const t = String(text || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!t) throw new CodeError("empty");
  const m = /DV([OA])([zp])([A-Za-z0-9_-]{16,})/.exec(t);
  if (!m) throw new CodeError("invalid");
  const kind = m[1] === "O" ? "offer" : "answer";
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
