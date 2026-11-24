// Opzioni del giocatore in localStorage, con versione del formato.
// localStorage puo' mancare o lanciare (navigazione privata, iframe di
// portale con storage bloccato): ogni accesso e' in try/catch e il gioco
// funziona lo stesso con i valori predefiniti.

const KEY = "535.settings";
const VERSION = 1;
// rain/grass/fire/blood (§9.117): categorie di particelle visibili (menu di pausa,
// opzioni grafiche; particles.js); autosave: salvataggio automatico ogni 5
// minuti nello slot della room (save.js), attivo di norma come in NIMBUS;
// lockMouse: il puntatore resta nel gioco (Pointer Lock, input.js);
// quality: risoluzione del mondo (high, medium, low; app.js, §6.8 G1);
// glass: pannelli dell'interfaccia di vetro sfocato (§7.14)
// [§9.207, richiesta dell'autore] musicVolume, sfxVolume: i cursori del menu
// di pausa (0-1; audio.js), al posto degli interruttori di prima (music,
// §9.143; sfx, §9.137): chi li aveva spenti li trova a 0
const DEFAULTS = { fpsCap: 60, dynamicResolution: true, diagnostics: false, language: null,
                   rain: true, grass: true, fire: true, blood: true, autosave: true, lockMouse: false, quality: "high",
                   glass: true, musicVolume: 1, sfxVolume: 1 };
const volumes = (saved) => {
  const s = { ...DEFAULTS, ...saved };
  if (saved.musicVolume === undefined && saved.music === false) s.musicVolume = 0;
  if (saved.sfxVolume === undefined && saved.sfx === false) s.sfxVolume = 0;
  delete s.music; delete s.sfx;
  return s;
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.v === VERSION) return volumes(data.settings || {});
    }
  } catch (e) { /* storage non disponibile o dati rovinati: valori predefiniti */ }
  return { ...DEFAULTS };
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, settings: s }));
  } catch (e) { /* storage non disponibile: le opzioni valgono solo per questa sessione */ }
}
