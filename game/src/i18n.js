// Testi dell'interfaccia del motore. Il gioco originale e' in inglese [C]:
// l'inglese e' la lingua di riferimento, l'italiano e' gia' pronto per i
// messaggi del motore. I testi del gioco (dialoghi, suggerimenti, schede)
// entreranno qui quando si portano i sistemi.

const STRINGS = {
  en: {
    loading: "Loading…",
    softwareWarning: "Your browser is drawing without graphics acceleration: the game will be slow. Enable hardware acceleration in the browser settings.",
    contextLost: "The graphics context was lost. Restoring…",
    noWebgl2: "This browser does not support WebGL2, which the game needs.",
    textureTooBig: "This graphics card does not support textures large enough for the game.",
  },
  it: {
    loading: "Caricamento…",
    softwareWarning: "Il browser sta disegnando senza accelerazione grafica: il gioco sara' lento. Attiva l'accelerazione hardware nelle impostazioni del browser.",
    contextLost: "Il contesto grafico si e' perso. Ripristino in corso…",
    noWebgl2: "Questo browser non supporta WebGL2, che serve al gioco.",
    textureTooBig: "Questa scheda grafica non supporta texture abbastanza grandi per il gioco.",
  },
};

let lang = "en";

export function setLanguage(l) {
  const code = (l || navigator.language || "en").slice(0, 2).toLowerCase();
  lang = STRINGS[code] ? code : "en";
  document.documentElement.lang = lang;
}

export function t(key) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}
