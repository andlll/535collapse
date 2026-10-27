// [§9.80, richiesta dell'autore] Il presidio degli arcieri nemici in torri
// e fortezze, come quello del giocatore (ranged.js, garrisoned, §9.63):
// l'edificio tira una freccia per arciere dentro (npresidio), gli arcieri
// entrano a contatto con l'edificio e spariscono, escono accanto con la
// vita che avevano entrando.
//
// Nell'originale [C] la torre nemica e la fortezza nemica (§9.43) tirano
// sempre due frecce, senza nessuno dentro. Ora quelle della mappa partono
// con START arcieri dentro (all'inizio tirano come prima); quelle costruite
// dall'economia nemica (enemy_cantiere, built) partono vuote.
//
// Le scelte dell'AI, ogni CHECK passi per edificio:
// - minaccia (un'unita' del giocatore entro THREAT px): gli arcieri nemici
//   liberi entro RECRUIT px (fermi, o che inseguono senza tirare; non
//   quelli delle regie dei livelli) vanno a riempire i posti liberi; in pace
//   si riempie solo un edificio vuoto, con gli arcieri della mappa;
// - edificio sotto LOW della vita: escono tutti (non muoiono col crollo);
// - nessuna minaccia da CALM passi: ne esce uno per volta, fino a uno.
// La torre di vedetta del livello 5 (watch) non tira e non chiama nessuno.
import { towerTarget, towerArrow } from "./archery.js";
import { pointDistance } from "./gm.js";

export const ENEMY_GARRISON = {
  enemy_torre: { max: 2, start: 2, pos: [[20, -60], [20, -77]], exitDy: 60 },
  enemy_castello: { max: 4, start: 2, pos: [[20, -150], [20, -170], [30, -30], [30, -40]], exitDy: 140 },
};
const CHECK = 30, THREAT = 700, RECRUIT = 600, LOW = 0.25, CALM = 1800, WALK_MAX = 900;

export function garrisonCreate(i) {
  const G = ENEMY_GARRISON[i.object];
  i.npresidio = i.built ? 0 : G.start;
  i.garrisonLives = [];
  i.calmSince = 0;
}

// Frecce: una per arciere dentro, dalle posizioni pos (a destra o a
// sinistra secondo il bersaglio). true se ha tirato.
export function garrisonShoot(i, w, every, alarm) {
  const G = ENEMY_GARRISON[i.object];
  if (i.npresidio === undefined) garrisonCreate(i); // salvataggio di prima
  if (i.arm !== 1 || i.npresidio <= 0 || i.watch) return false;
  const a = towerTarget(w, i, "ally_unit", 600);
  if (!a) return false;
  i.arm = 0;
  i.alarm.set(alarm, every);
  for (const [dx, dy] of G.pos.slice(0, i.npresidio)) towerArrow(w, "b_arciere_bullet_t", i.x + (a.x > i.x ? dx : -dx), i.y + dy, i, a);
  return true;
}

// Un arciere esce accanto all'edificio (il suo Create cerca un posto
// libero), con la vita che aveva entrando; l'ultimo entrato esce per primo.
export function garrisonSendOut(i, w) {
  if (!(i.npresidio > 0)) return null;
  i.npresidio -= 1;
  const s = (i.garrisonLives || []).pop();
  const a = w.create("enemy_arciere", i.x, i.y + ENEMY_GARRISON[i.object].exitDy);
  if (s) {
    a.life = Math.min(a.slife, s.life);
    if (s.eco) { a.eco = 1; a.role = 30; }
  }
  return a;
}

const special = (e) => e.retreat || e.road || e.l3 || e.l4 || e.l5w || e.ramTarget;
const incoming = (w, b) => { let n = 0; for (const e of w.all("enemy_arciere")) if (e.presidiowork === 1 && e.presidioB === b) n++; return n; };

export function garrisonAI(i, w) {
  if (w.room === "menu" || i.watch || (w._stepNo + i.id) % CHECK !== 0) return;
  const G = ENEMY_GARRISON[i.object];
  if (i.npresidio === undefined) garrisonCreate(i);
  const threat = w.nearWithin(i, "ally_unit", THREAT, THREAT);
  if (threat) i.calmSince = w._stepNo;
  if (i.life < LOW * i.slife) { while (i.npresidio > 0) garrisonSendOut(i, w); return; }
  const inc = incoming(w, i), free = G.max - i.npresidio - inc;
  if (free > 0 && (threat || i.npresidio + inc === 0)) {
    const ok = (e) => e.alive && e.presidiowork !== 1 && !special(e) && e.life > 0
      && (e.role === 0 || e.role === 10 || (threat && e.role === 30))
      && (e.action === 0 || (e.action === 1 && e.warwork === 1))
      && pointDistance(e.x, e.y, i.x, i.y) < RECRUIT;
    const cand = [...w.all("enemy_arciere")].filter(ok)
      .sort((a, b) => pointDistance(a.x, a.y, i.x, i.y) - pointDistance(b.x, b.y, i.x, i.y));
    for (const e of cand.slice(0, threat ? free : 1)) {
      if (e.action !== 1) e.alarm.set(0, 15);
      Object.assign(e, { presidiowork: 1, presidioB: i, presidioUntil: w._stepNo + WALK_MAX, action: 1, warwork: 0, repos: 0,
                         dirox: i.x, diroy: i.y });
    }
    return;
  }
  if (!threat && i.npresidio > 1 && w._stepNo - i.calmSince > CALM) {
    garrisonSendOut(i, w);
    i.calmSince = w._stepNo - CALM + 600; // il prossimo fra 10 s
  }
}

// L'arciere nemico in cammino verso il presidio (dal suo Step): a meno di
// 10 px dall'edificio entra; se l'edificio non c'e' piu', e' pieno o non ci
// arriva in WALK_MAX passi, lascia perdere. false se non e' (piu') in
// cammino verso il presidio; `move` lo fa camminare.
export function garrisonWalk(i, w, move) {
  if (i.presidiowork !== 1) return false;
  const b = i.presidioB;
  const G = b && ENEMY_GARRISON[b.object];
  if (!b || !b.alive || !G || b.npresidio >= G.max || w._stepNo > i.presidioUntil) {
    Object.assign(i, { presidiowork: 0, presidioB: null, action: 0, speed: 0 });
    return false;
  }
  if (w.distanceToInstance(i, b) < 10) {
    (b.garrisonLives || (b.garrisonLives = [])).push({ life: i.life, eco: i.eco === 1 ? 1 : 0 });
    b.npresidio += 1;
    if (i.hover === 1) { i.hover = 0; w.g.enemyhover = 0; }
    w.destroy(i);
    return true;
  }
  if (i.action !== 1) i.alarm.set(0, 15);
  i.action = 1; i.warwork = 0; i.dirox = b.x; i.diroy = b.y;
  move();
  return true;
}
