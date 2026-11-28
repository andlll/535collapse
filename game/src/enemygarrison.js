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
// [§9.242, richiesta dell'autore: "torri nemiche: facciamo che default sono
// senza arcieri dentro"] anche le torri nemiche della mappa partono vuote
// (start 0; [§9.243] anche la fortezza): tirano quando ci entra qualcuno. Nei
// livelli della campagna (CAMPAIGN) restano coi 2 arcieri con cui sono stati
// pensati e provati (le torri esterne del livello 5 tirano, §9.102).
//
// Le scelte dell'AI, ogni CHECK passi per edificio:
// - minaccia (un'unita' del giocatore entro THREAT px): gli arcieri nemici
//   liberi entro RECRUIT px (fermi, o che inseguono senza tirare; non
//   quelli delle regie dei livelli) vanno a riempire i posti liberi; in pace
//   si riempie solo un edificio vuoto, con gli arcieri della mappa;
// - edificio sotto LOW della vita: escono tutti (non muoiono col crollo);
// - nessuna minaccia da CALM passi: ne esce uno per volta, fino alla
//   guarnigione di partenza (`keep`: START per gli edifici della mappa, 1
//   per quelli costruiti; §9.82: scendendo fino a uno, a inizio partita la
//   citta' del livello 5 si svuotava le torri da sola).
// La torre di vedetta del livello 5 (watch) non tira e non chiama nessuno.
import { towerTarget, towerArrow } from "./archery.js";
import { pointDistance } from "./gm.js";
import { stealthOn, inFog, ST } from "./stealth.js"; // §9.148

export const ENEMY_GARRISON = {
  enemy_torre: { max: 2, start: 0, campaign: 2, pos: [[20, -60], [20, -77]], exitDy: 60 }, // §9.242: vuota (era 2), non nella campagna
  enemy_castello: { max: 4, start: 0, campaign: 2, pos: [[20, -150], [20, -170], [30, -30], [30, -40]], exitDy: 140 },
};
const CHECK = 30, THREAT = 700, RECRUIT = 600, LOW = 0.25, CALM = 1800, WALK_MAX = 900;

const CAMPAIGN = /^(match|lvl\d\d)$/; // §9.242
export const garrisonStart = (G, w) => (G.campaign !== undefined && w && CAMPAIGN.test(w.room) ? G.campaign : G.start);
// ([§9.243] gli arcieri messi nell'editor, i.settings.garrison, al posto di
// quelli di partenza)
export function garrisonCreate(i, w) {
  const G = ENEMY_GARRISON[i.object], set = i.settings && i.settings.garrison;
  const start = Number.isInteger(set) ? Math.max(0, Math.min(G.max, set)) : garrisonStart(G, w);
  i.npresidio = i.built ? 0 : start;
  // ([§9.242] almeno uno: una torre che parte vuota e si riempie per una
  // minaccia ne tiene uno; con 0 l'ultimo usciva e, in pace, rientrava)
  i.keep = i.built ? 1 : Math.max(1, start);
  i.garrisonLives = [];
  i.calmSince = 0;
}

// Frecce: una per arciere dentro, dalle posizioni pos (a destra o a
// sinistra secondo il bersaglio). true se ha tirato.
export function garrisonShoot(i, w, every, alarm) {
  const G = ENEMY_GARRISON[i.object];
  if (i.npresidio === undefined) garrisonCreate(i, w); // salvataggio di prima
  if (i.arm !== 1 || i.npresidio <= 0 || i.watch) return false;
  const a = towerTarget(w, i, "ally_unit", 600);
  if (!a) return false;
  // [§9.148] lo stealth (livello 7): nella nebbia la torre vede a meta'
  if (stealthOn(w) && inFog(w, a.x, a.y) && w.distanceToInstance(i, a) >= 600 * ST.fogK) return false;
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
  if (i.npresidio === undefined) garrisonCreate(i, w);
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
  if (!threat && i.npresidio > (i.keep ?? 1) && w._stepNo - i.calmSince > CALM) {
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
