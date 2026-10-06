// Opzioni del giocatore in localStorage, con versione del formato.
// localStorage puo' mancare o lanciare (navigazione privata, iframe di
// portale con storage bloccato): ogni accesso e' in try/catch e il gioco
// funziona lo stesso con i valori predefiniti.

const KEY = "535.settings";
const VERSION = 1;
// rain/grass/fire: categorie di particelle visibili (menu di pausa,
// opzioni grafiche; particles.js); autosave: salvataggio automatico ogni 5
// minuti nello slot della room (save.js), attivo di norma come in NIMBUS;
// lockMouse: il puntatore resta nel gioco (Pointer Lock, input.js)
const DEFAULTS = { fpsCap: 60, dynamicResolution: true, diagnostics: false, language: null,
                   rain: true, grass: true, fire: true, autosave: true, lockMouse: false };

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.v === VERSION) return { ...DEFAULTS, ...data.settings };
    }
  } catch (e) { /* storage non disponibile o dati rovinati: valori predefiniti */ }
  return { ...DEFAULTS };
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, settings: s }));
  } catch (e) { /* storage non disponibile: le opzioni valgono solo per questa sessione */ }
}
