// Schermo intero (Fase 4). L'API Fullscreen, col prefisso webkit per
// Safari. Ripiego: dove non e' permessa (iframe di un portale senza
// allowfullscreen, Safari su iPhone) il pulsante resta spento, e il gioco
// riempie comunque la finestra o la cornice del portale.

const doc = () => document;

export function fullscreenAvailable() {
  try { return !!(doc().fullscreenEnabled || doc().webkitFullscreenEnabled); } catch (e) { return false; }
}

export function isFullscreen() {
  try { return !!(doc().fullscreenElement || doc().webkitFullscreenElement); } catch (e) { return false; }
}

// Va chiamata subito dopo un clic (il browser chiede un gesto dell'utente)
export async function toggleFullscreen() {
  const d = doc(), el = d.documentElement;
  try {
    if (isFullscreen()) await (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else await (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    return true;
  } catch (e) {
    return false; // rifiutato (nessun gesto recente, permesso negato)
  }
}
