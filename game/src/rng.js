// [§9.152, multiplayer, fase 1] I numeri a caso: due generatori.
//
// - simRandom: quello della partita (decisioni dell'IA, danni a caso, punti
//   d'arrivo, la pioggia che comincia, gli sprite a caso degli alberi...).
//   Deve dare la stessa sequenza nei due browser di una partita in rete: e'
//   un sfc32 col seme della partita, il suo stato si salva coi salvataggi
//   (snapshot.js) e un caricamento riprende la stessa sequenza. Senza seme
//   (le prove nel browser, che fissano Math.random a mano) usa Math.random,
//   come prima.
// - vrand: quello degli effetti (particelle, pioggia, foglie, schegge,
//   sangue, suoni, menu). Dipende da cosa c'e' sullo schermo e dalle opzioni
//   grafiche, quindi non deve toccare la sequenza della partita: prima lo
//   stesso Math.random serviva a tutti e due, e due giocatori che guardano
//   punti diversi avrebbero avuto partite diverse in pochi secondi. Libero,
//   locale, non si salva.
//
// Fuori da questo file Math.random non si usa (test/determinism.test.mjs).

let S = null; // stato di sfc32 (4 interi a 32 bit), o null: Math.random

function sfc32() {
  let [a, b, c, d] = S;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  S[0] = a; S[1] = b; S[2] = c; S[3] = d;
  return (t >>> 0) / 4294967296;
}

// il seme della partita (un intero); le prime estrazioni si buttano
export function simSeed(seed) {
  S = [seed >>> 0, 0x9e3779b9, 0x243f6a88, 0xb7e15162];
  for (let k = 0; k < 15; k++) sfc32();
}
export const simSeeded = () => S !== null;
export function simRandom() {
  return S ? sfc32() : Math.random();
}
// lo stato, per i salvataggi (null: senza seme)
export const simRngState = () => (S ? S.slice() : null);
export function simRngRestore(s) { S = s ? s.slice(0, 4).map((v) => v | 0) : null; }

// un seme nuovo per una partita (non deterministico: crypto, se c'e')
export function freshSeed() {
  const c = globalThis.crypto;
  if (c && c.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0];
  return (Date.now() ^ (Math.random() * 4294967296)) >>> 0;
}

// gli effetti: xorshift128+ a 32 bit, seminato una volta da freshSeed
let V = null;
export function vrand() {
  if (!V) { const s = freshSeed(); V = [s | 1, (s * 2654435761) | 0, 0x6c078965, 0x5bd1e995]; }
  let t = V[0];
  const s = V[3];
  V[0] = V[1]; V[1] = V[2]; V[2] = s;
  t ^= t << 11; t ^= t >>> 8;
  V[3] = t ^ s ^ (s >>> 19);
  return (V[3] >>> 0) / 4294967296;
}
