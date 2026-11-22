// [§9.143] Il mix della musica, deciso dall'autore: le parti del loop
// (nuovi/audio/audio.json, "musica") e il volume di ciascuna (0-1) secondo
// la partita. Il manager lo chiama ogni MUSIC_EVERY passi (audio.js music,
// che segue i volumi dolcemente).
//
// [§9.161, richiesta dell'autore] Due brani, ognuno con le sue parti:
// - il brano 1 (loop1): archi costanti ("ci ragioniamo, avrebbe senso anche
//   giocare col loro volume"); field recording al volume della traccia unita
//   la mattina, poi giu' col passare del giorno fino a FIELD_NIGHT al
//   tramonto, li' la notte, su all'alba; drone da zero, su con la
//   popolazione del giocatore (global.pop) fino al pieno a DRONE_FULL;
// - il brano 2 (loop2, "Shove"): il piano costante come gli archi; il basso
//   da zero al pieno nei primi BASS_RAMP s del brano; le percussioni 1 da
//   zero al pieno coi nemici vicini o il combattimento, le percussioni 2
//   nelle battaglie con almeno DR2_MIN nemici vicini (combat, sotto).
// Le parti di un brano girano insieme dallo stesso istante (audio.js): nel
// brano 2 hanno giri di 4, 10 e 40 s, a tempo fra loro.
//
// La scaletta per room (musicPlan): lvl01 (e lvl07, §9.178) solo il brano 2; le schermaglie il
// brano 1 per circa SEGMENT s, poi il 2, poi di nuovo l'1, a turno; lvl03 il
// 2 per primo, poi a turno; lvl05 come lvl03, ma col brano 2 gia' al pieno
// (la battaglia e' in corso); le altre room solo il brano 1, come prima. Un
// turno finisce alla fine di un giro del brano (gli archi 42 s, il basso
// 40 s): il numero intero di giri piu' vicino a SEGMENT.
// I numeri sono da regolare a orecchio con l'autore.
import { dhypot } from "./dmath.js";

export const MUSIC = {
  every: 10,        // passi fra un aggiornamento e l'altro
  fieldNight: 0,    // il field di notte (0: zitto)
  droneFull: 50,    // popolazione a cui il drone e' al massimo
  segment: 300,     // s: quanto dura un turno di un brano (piu' o meno: giri interi)
  bassRamp: 10,     // s: il basso dal silenzio al pieno, all'inizio del brano 2
  near: 500,        // px di room: un nemico (visto) cosi' vicino a una tua unita' e' "vicino"
  dr2Min: 5,        // nemici vicini per le percussioni 2 (la battaglia)
  hold: 600,        // passi (10 s) in cui le percussioni restano su dopo l'ultimo nemico vicino o l'ultimo colpo
  alarmRecent: 180, // passi: un colpo (allarme d'attacco, attackalarm.js) cosi' recente e' combattimento
  fullHold: 1200,   // passi (20 s): lvl05 parte con le percussioni al pieno, che restano su almeno tanto
};

// i brani: le parti e il giro (s) su cui finisce un turno
export const BRANI = {
  loop1: { parts: ["musica_archi", "musica_field", "musica_drone"], cycle: 42 },
  loop2: { parts: ["musica2_piano", "musica2_bass", "musica2_dr1", "musica2_dr2"], cycle: 40 },
};
// con quale costante di tempo (s) una parte segue il suo volume, in salita e
// in discesa (audio.js); le altre MUSIC_TAU di audio.js
export const PART_TAU = {
  musica2_piano: [0.6, 2.5],
  musica2_bass: [0.25, 2.5],   // (insegue la rampa da vicino)
  musica2_dr1: [0.5, 2.5],
  musica2_dr2: [0.5, 2.5],
};

const turn = (b) => Math.max(1, Math.round(MUSIC.segment / BRANI[b].cycle)) * BRANI[b].cycle;
// la scaletta di una room: segs [brano, durata s] a turno (una durata
// Infinity: un brano solo); full: il primo turno parte al pieno
export function musicPlan(room) {
  const one = (b) => ({ segs: [[b, Infinity]], full: false, brani: BRANI, tau: PART_TAU });
  const alt = (first, second, full = false) => ({ segs: [[first, turn(first)], [second, turn(second)]], full, brani: BRANI, tau: PART_TAU });
  if (room === "lvl01" || room === "lvl07") return one("loop2"); // §9.178: il 7 come l'1
  if (room === "lvl03") return alt("loop2", "loop1");
  if (room === "lvl05") return alt("loop2", "loop1", true);
  if (typeof room === "string" && room.startsWith("sk_")) return alt("loop1", "loop2");
  return one("loop1");
}

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

// [§9.161] Il combattimento, per le percussioni del brano 2, con gli occhi di
// chi guarda (w: il suo specchio nella partita a due): quanti nemici visti
// sono a MUSIC.near px da una sua unita' (civili compresi, che stanno
// attorno agli edifici; non gli edifici: in lvl01 la citta' e' piena di
// nemici di guardia accanto alle mura e alle porte, lontani dai soldati, che
// non devono contare) (al piu' 10: basta sapere se sono DR2_MIN), e se una
// sua unita' e' stata colpita da
// poco (le zone "battle" degli allarmi d'attacco, g.alarms: anche i nemici
// che non si vedono, le frecce dalla nebbia; non gli incendi, che in lvl01
// non finiscono mai). Solo letture: niente che cambi la partita (la musica e'
// di chi guarda, nella partita in rete diversa per i due).
export function combat(w) {
  let near = 0;
  if (w && w.all) {
    for (const e of w.all("enemy_unit")) {
      if (!e.alive || !e.visible) continue;
      const a = w.nearest(e.x, e.y, "ally_unit");
      if (a && dhypot(a.x - e.x, a.y - e.y) < MUSIC.near) {
        if (++near >= 10) break;
      }
    }
  }
  const now = (w && w._stepNo) || 0, zones = (w && w.g && w.g.alarms && w.g.alarms.zones) || [];
  const hit = zones.some((z) => z.kind === "battle" && !z.ending && now - z.last <= MUSIC.alarmRecent);
  return { near, hit };
}

// le percussioni: su subito, giu' MUSIC.hold passi dopo l'ultima volta che
// ce n'era motivo (m.musicHold: del manager, non della partita)
function drums(m, w, info) {
  const h = m.musicHold || (m.musicHold = { dr1: -Infinity, dr2: -Infinity });
  const now = (w && w._stepNo) || 0;
  if (info.full && !h.fullSet) { h.dr1 = h.dr2 = now + MUSIC.fullHold - MUSIC.hold; h.fullSet = true; }
  const c = combat(w);
  if (c.near > 0 || c.hit) h.dr1 = Math.max(h.dr1, now);
  if (c.near >= MUSIC.dr2Min) h.dr2 = Math.max(h.dr2, now);
  return { dr1: now - h.dr1 <= MUSIC.hold ? 1 : 0, dr2: now - h.dr2 <= MUSIC.hold ? 1 : 0 };
}

// i volumi delle parti; info (audio.js): il brano che suona, da quanti s
// (elapsed), se parte al pieno (full); w: il mondo di chi guarda
export function musicLevels(m, g, info = null, w = null) {
  const out = {
    musica_archi: 1,
    musica_field: fieldLevel(m, g),
    musica_drone: Math.min(1, Math.max(0, (g.pop || 0) / MUSIC.droneFull)),
  };
  if (info && info.brano === "loop2") {
    const d = drums(m, w, info);
    Object.assign(out, {
      musica2_piano: 1,
      musica2_bass: info.full ? 1 : Math.min(1, Math.max(0, info.elapsed / MUSIC.bassRamp)),
      musica2_dr1: d.dr1,
      musica2_dr2: d.dr2,
    });
  }
  return out;
}
