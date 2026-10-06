// Lingue del gioco, come NIMBUS: EN (l'originale), IT, ES, PT, DE, FR.
// La lingua si sceglie nel menu di pausa (pause.js) e si salva nelle
// opzioni (settings.js, `language`); la prima volta viene da
// navigator.language. Cambiarla non richiede di ricaricare: tutti i testi
// passano da t()/tr() a ogni fotogramma.
//
// - t(chiave): i messaggi del motore (caricamento, errori), qui sotto;
// - tr(testo inglese, {segnaposto}): i testi del gioco, in texts.js, con
//   il testo inglese dell'originale come chiave. Se manca una traduzione
//   resta l'inglese.

import { TEXTS } from "./texts.js";

export const LANGUAGES = ["en", "it", "es", "pt", "de", "fr"];

const STRINGS = {
  loading: { en: "Loading…", it: "Caricamento…", es: "Cargando…", pt: "Carregando…", de: "Laden…", fr: "Chargement…" },
  softwareWarning: {
    en: "Your browser is drawing without graphics acceleration: the game will be slow. Enable hardware acceleration in the browser settings.",
    it: "Il browser sta disegnando senza accelerazione grafica: il gioco sarà lento. Attiva l'accelerazione hardware nelle impostazioni del browser.",
    es: "Tu navegador dibuja sin aceleración gráfica: el juego irá lento. Activa la aceleración por hardware en los ajustes del navegador.",
    pt: "Seu navegador está desenhando sem aceleração gráfica: o jogo ficará lento. Ative a aceleração de hardware nas configurações do navegador.",
    de: "Dein Browser zeichnet ohne Grafikbeschleunigung: Das Spiel wird langsam sein. Aktiviere die Hardwarebeschleunigung in den Browsereinstellungen.",
    fr: "Ton navigateur dessine sans accélération graphique : le jeu sera lent. Active l'accélération matérielle dans les réglages du navigateur.",
  },
  contextLost: {
    en: "The graphics context was lost. Restoring…", it: "Il contesto grafico si è perso. Ripristino in corso…",
    es: "Se perdió el contexto gráfico. Restaurando…", pt: "O contexto gráfico foi perdido. Restaurando…",
    de: "Der Grafikkontext ging verloren. Wird wiederhergestellt…", fr: "Le contexte graphique a été perdu. Restauration…",
  },
  noWebgl2: {
    en: "This browser does not support WebGL2, which the game needs.", it: "Questo browser non supporta WebGL2, che serve al gioco.",
    es: "Este navegador no admite WebGL2, que el juego necesita.", pt: "Este navegador não suporta WebGL2, necessário para o jogo.",
    de: "Dieser Browser unterstützt kein WebGL2, das das Spiel braucht.", fr: "Ce navigateur ne prend pas en charge WebGL2, nécessaire au jeu.",
  },
  textureTooBig: {
    en: "This graphics card does not support textures large enough for the game.",
    it: "Questa scheda grafica non supporta texture abbastanza grandi per il gioco.",
    es: "Esta tarjeta gráfica no admite texturas lo bastante grandes para el juego.",
    pt: "Esta placa de vídeo não suporta texturas grandes o bastante para o jogo.",
    de: "Diese Grafikkarte unterstützt keine ausreichend großen Texturen für das Spiel.",
    fr: "Cette carte graphique ne prend pas en charge des textures assez grandes pour le jeu.",
  },
};

let lang = "en";

function detect() {
  try {
    const nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (LANGUAGES.includes(nav)) return nav;
  } catch (e) { /* navigator assente (test) */ }
  return "en";
}

// `l`: la lingua salvata nelle opzioni (null la prima volta)
export function setLanguage(l) {
  lang = LANGUAGES.includes(l) ? l : detect();
  try { document.documentElement.lang = lang; } catch (e) { /* niente DOM (test) */ }
  return lang;
}

export function getLanguage() { return lang; }

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

export function t(key) {
  const e = STRINGS[key];
  return e ? e[lang] || e.en : key;
}

export function tr(en, vars) {
  const e = TEXTS[en];
  return fill((e && lang !== "en" && e[lang]) || en, vars);
}
