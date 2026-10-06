// Avanzamento della campagna (global.unlock: livelli sbloccati) in
// localStorage, con versione del formato, come settings.js. [Decisione
// dell'autore, §0.14/§0.15] lo sblocco e' persistente e parte da 1
// (l'originale lo rimetteva a 2 a ogni apertura del menu). Quando ci
// saranno i salvataggi JSON (Fase 4) confluira' li'.

const KEY = "535.progress";
const VERSION = 1;

export function loadUnlock() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (data && data.v === VERSION && Number.isInteger(data.unlock) && data.unlock >= 1) return data.unlock;
  } catch (e) { /* storage non disponibile o dati rovinati */ }
  return 1;
}

export function saveUnlock(unlock) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, unlock }));
  } catch (e) { /* storage non disponibile: vale solo per questa sessione */ }
}
