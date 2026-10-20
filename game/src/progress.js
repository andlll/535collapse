// Avanzamento della campagna (global.unlock: livelli sbloccati) in
// localStorage, con versione del formato, come settings.js. [Decisione
// dell'autore, §0.14/§0.15] lo sblocco e' persistente e parte da 1
// (l'originale lo rimetteva a 2 a ogni apertura del menu). Quando ci
// saranno i salvataggi JSON (Fase 4) confluira' li'.

const KEY = "535.progress";
const VERSION = 1;

// [Provvisorio, richiesta dell'autore, §9.53] per le prove dei primi
// livelli tutti sbloccati: almeno fino a UNLOCK_ALL. Da rimettere a 1 prima
// dell'uscita (STUDIO.md, "Cose da fare").
export const UNLOCK_ALL = 4;

export function loadUnlock() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (data && data.v === VERSION && Number.isInteger(data.unlock) && data.unlock >= 1) return Math.max(data.unlock, UNLOCK_ALL);
  } catch (e) { /* storage non disponibile o dati rovinati */ }
  return Math.max(1, UNLOCK_ALL);
}

export function saveUnlock(unlock) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, unlock }));
  } catch (e) { /* storage non disponibile: vale solo per questa sessione */ }
}
