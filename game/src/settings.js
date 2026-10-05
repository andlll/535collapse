// Opzioni del giocatore in localStorage, con versione del formato.
// localStorage puo' mancare o lanciare (navigazione privata, iframe di
// portale con storage bloccato): ogni accesso e' in try/catch e il gioco
// funziona lo stesso con i valori predefiniti.

const KEY = "535.settings";
const VERSION = 1;
const DEFAULTS = { fpsCap: 60, dynamicResolution: true, diagnostics: false, language: null };

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
