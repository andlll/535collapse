// [§9.143] Il mix della musica, deciso dall'autore: le parti del loop
// (nuovi/audio/audio.json, "musica") e il volume di ciascuna (0-1) secondo
// la partita. Il manager lo chiama ogni MUSIC_EVERY passi (audio.js music,
// che segue i volumi dolcemente, in ~2,5 s).
// - archi: costanti (per ora: "ci ragioniamo, avrebbe senso anche giocare
//   col loro volume");
// - field recording: al volume della traccia unita la mattina, poi scende
//   col passare del giorno fino a FIELD_NIGHT al tramonto, resta li' la
//   notte e all'alba risale col cielo che si schiarisce;
// - drone: da zero, sale con la popolazione del giocatore (global.pop, quella
//   che si legge in alto) fino al pieno a DRONE_FULL.
// I numeri sono da regolare a orecchio con l'autore.
export const MUSIC = {
  every: 10,        // passi fra un aggiornamento e l'altro
  fieldNight: 0,    // il field di notte (0: zitto)
  droneFull: 50,    // popolazione a cui il drone e' al massimo
};

// Il field secondo l'ora: global.night 0 di giorno, 1 di notte, in mezzo al
// tramonto (alarm 0 a 1 a ogni passo) e all'alba (alarm 1 a 1 a ogni passo).
// Il giorno dura dayLen passi (manager.js: 6000 il primo, 4000 dopo ogni
// alba) e l'alarm 0 conta quelli che mancano al tramonto.
export function fieldLevel(m, g) {
  const N = MUSIC.fieldNight;
  const night = g.night || 0;
  if (night >= 1) return N;
  if (night > 0) return m.al.get(1) > 0 ? N + (1 - N) * (1 - night) : N; // alba: risale; tramonto: gia' giu'
  const a0 = m.al.get(0);
  if (!(a0 > 0)) return 1; // niente ciclo (schermaglia "sempre giorno"): mattina sempre
  const len = Math.max(m.dayLen || 0, a0);
  const p = 1 - a0 / len; // 0 all'alba, 1 al tramonto
  return 1 - (1 - N) * p;
}

export function musicLevels(m, g) {
  return {
    musica_archi: 1,
    musica_field: fieldLevel(m, g),
    musica_drone: Math.min(1, Math.max(0, (g.pop || 0) / MUSIC.droneFull)),
  };
}
