// Avanzamento della campagna (global.unlock: livelli sbloccati) in
// localStorage, con versione del formato, come settings.js. [Decisione
// dell'autore, §0.14/§0.15] lo sblocco e' persistente e parte da 1
// (l'originale lo rimetteva a 2 a ogni apertura del menu). Quando ci
// saranno i salvataggi JSON (Fase 4) confluira' li'.

const KEY = "535.progress";
const VERSION = 1;

// [Provvisorio, richiesta dell'autore, §9.53] per le prove dei primi
// livelli tutti sbloccati: almeno fino a UNLOCK_ALL (§9.74: anche il 5;
// §9.103: anche il 6). Da
// rimettere a 1 prima dell'uscita (STUDIO.md, "Cose da fare").
export const UNLOCK_ALL = 7; // §9.178: anche il 7

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

// [§9.164, segnalazione dell'autore] il livello della campagna e'
// nell'indirizzo (?room=lvl05): cambiando la cifra si entrava in un livello
// non ancora sbloccato. app.js lo controlla prima di caricare la room: un
// livello bloccato porta al menu. levelOf: il numero del livello della
// campagna di una room (lvl03 -> 3; 0 per menu, tutorial, schermaglie);
// canPlay: si puo' giocare con lo sblocco `unlock` (il livello 1 sempre, come
// nel menu: menu.js shownLevel)
export const levelOf = (room) => {
  const m = /^lvl(\d+)$/.exec(room || "");
  return m ? Number(m[1]) : 0;
};
export const canPlay = (room, unlock) => levelOf(room) <= Math.max(1, unlock || 1);
