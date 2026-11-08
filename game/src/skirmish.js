// [§9.118, richiesta dell'autore] La schermaglia: 1 contro 1, il giocatore
// contro la CPU, su mappe simmetriche (tools/16_schermaglia.py) e con i
// parametri scelti nel menu principale ("Schermaglia", menu.js).
//
// - Le mappe hanno due centri (`centro`) in punti ruotati di 180 gradi:
//   all'avvio quello della CPU diventa `enemy_centro` (skirmishPrepare,
//   prima che le istanze nascano). A = il centro in alto a sinistra.
// - Partenza (decisione dell'autore): il centro e 3 lavoratori per parte.
// - La CPU ha le stesse possibilita' del giocatore: lo stesso tetto di
//   popolazione (10 per centro e per casa, fino al tetto scelto), gli stessi
//   costi; costruisce da sola (economy.js, buildOrder). La difficolta'
//   cambia quanto e' sveglia (lavoratori, tempi, attacchi), non le regole;
//   "Truccata" (l'idea dell'autore: si vede che la CPU parte avvantaggiata)
//   le da' piu' risorse all'inizio e una volta e mezza quello che raccoglie.
// - I parametri si ricordano (localStorage) e viaggiano con la partita
//   (global.sk, anche nei salvataggi).

import { tr } from "./i18n.js";

// Le mappe: room -> nome (storico, decisione dell'autore) e descrizione.
// Quelle senza room arrivano piu' avanti.
export const SK_MAPS = [
  { room: "sk_padus", name: "Padus",
    desc: "The great plain of the Po. The river splits the two lands: three bridges, open fields, cavalry country." },
  { room: null, name: "Silva Umbra", desc: "Coming soon" },
  { room: null, name: "Rivoaltus", desc: "Coming soon" },
  { room: null, name: "Urbs", desc: "Coming soon" },
  { room: null, name: "Mons Bardonis", desc: "Coming soon" },
];
export const SK_ROOMS = SK_MAPS.filter((m) => m.room).map((m) => m.room);
export const isSkirmish = (room) => SK_ROOMS.includes(room);

// I parametri: chiave -> valori (il primo e' quello di partenza, salvo
// DEFAULTS) ed etichette
export const SK_OPTIONS = {
  difficulty: { label: "Difficulty", values: ["easy", "normal", "hard", "rigged"],
                names: { easy: "Easy", normal: "Normal", hard: "Hard", rigged: "Rigged" } },
  style: { label: "CPU style", values: ["balanced", "aggressive", "defensive", "economic", "raider", "random"],
           names: { balanced: "Balanced", aggressive: "Aggressive", defensive: "Defensive", economic: "Economic",
                    raider: "Raider", random: "Random" } },
  victory: { label: "Victory", values: ["conquest", "townhall", "score20", "score40", "score60"],
             names: { conquest: "Conquest", townhall: "Town hall", score20: "Score, 20 min", score40: "Score, 40 min",
                      score60: "Score, 60 min" } },
  resources: { label: "Starting resources", values: ["low", "normal", "high"],
               names: { low: "Low", normal: "Normal", high: "High" } },
  pop: { label: "Population limit", values: [50, 75, 99], names: { 50: "50", 75: "75", 99: "99" } },
  truce: { label: "Truce", values: [0, 5, 10], names: { 0: "OFF", 5: "5 min", 10: "10 min" } },
  fog: { label: "Fog", values: ["normal", "explored", "none"], names: { normal: "Normal", explored: "Explored", none: "None" } },
  daynight: { label: "Day and night", values: [true, false], names: { true: "ON", false: "OFF" } },
  rain: { label: "Rain", values: [true, false], names: { true: "ON", false: "OFF" } },
  start: { label: "Starting position", values: ["random", "A", "B"], names: { random: "Random", A: "North-west", B: "South-east" } },
};
export const SK_DEFAULTS = { map: "sk_padus", difficulty: "normal", style: "balanced", victory: "conquest", resources: "normal",
                             pop: 75, truce: 0, fog: "normal", daynight: true, rain: true, start: "random" };
const KEY = "535.skirmish";

export function loadSkirmish() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && typeof s === "object") {
      const out = { ...SK_DEFAULTS };
      for (const k of Object.keys(SK_DEFAULTS)) {
        if (k === "map") { if (SK_ROOMS.includes(s.map)) out.map = s.map; continue; }
        if (SK_OPTIONS[k].values.includes(s[k])) out[k] = s[k];
      }
      return out;
    }
  } catch (e) { /* storage non disponibile: i valori di partenza */ }
  return { ...SK_DEFAULTS };
}
export function saveSkirmish(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* solo per questa sessione */ }
}
export const optionLabel = (k, v) => tr(SK_OPTIONS[k].names[v] ?? String(v));

// Le risorse di partenza (le stesse per i due)
const START_RES = {
  low: { food: 100, wood: 100, gold: 0, stone: 0 },
  normal: { food: 200, wood: 200, gold: 100, stone: 50 },
  high: { food: 500, wood: 500, gold: 300, stone: 200 },
};
// "Truccata": risorse in piu' alla CPU all'inizio, e quello che raccoglie
// vale RIGGED volte tanto
const RIGGED = 1.5, RIGGED_START = 2;
const STYLES = ["balanced", "aggressive", "defensive", "economic", "raider"];

// Prima che le istanze nascano (app.js): il centro della CPU diventa
// enemy_centro. `all`: le istanze della room ([obj, x, y, ...]).
export function skirmishPrepare(params, all) {
  const cc = all.filter((e) => e[0] === "centro").sort((a, b) => (a[1] + a[2]) - (b[1] + b[2]));
  if (cc.length !== 2) return null;
  const side = params.start === "random" ? (Math.random() < 0.5 ? "A" : "B") : params.start;
  const [mine, cpu] = side === "A" ? cc : [cc[1], cc[0]];
  cpu[0] = "enemy_centro";
  return { side, player: [mine[1], mine[2]], cpu: [cpu[1], cpu[2]] };
}

// Dopo: lavoratori, risorse, regia economica della CPU, opzioni, vista
export function skirmishStart(world, g, manager, fog, cam, params, starts) {
  const style = params.style === "random" ? STYLES[Math.floor(Math.random() * STYLES.length)] : params.style;
  g.sk = { ...params, style, side: starts.side, popMax: params.pop };
  Object.assign(g, START_RES[params.resources]);
  const en = START_RES[params.resources];
  const k = params.difficulty === "rigged" ? RIGGED_START : 1;
  g.en = { food: en.food * k, wood: en.wood * k, gold: en.gold * k, stone: en.stone * k, pop: 0, idle: 0,
           mult: params.difficulty === "rigged" ? RIGGED : 1 };
  // 3 lavoratori del giocatore davanti al centro (quelli della CPU li fa
  // nascere la sua regia, ECO startWorkers)
  const [px, py] = starts.player;
  for (let n = 0; n < 3; n++) world.create("ally_omino", px - 90 + n * 70, py + 200);
  world.create("enemy_eco", 0, 0);
  // tregua: la CPU non attacca (global.en.hold, economy.js) fino alla fine
  if (params.truce > 0) g.en.hold = 1;
  world.create("sk_manager", 0, 0);
  world.create("objective_button", 0, 0);
  g.obj = 1;
  // nebbia
  if (params.fog === "none") g.fogville = 0;
  if (params.fog === "explored") fog.explored.fill(255);
  // giorno e notte, pioggia (manager.js, allarmi 0/1 e 4)
  if (!params.daynight) { manager.al.set(0, -1); manager.al.set(1, -1); g.night = 0; }
  if (!params.rain) manager.al.set(4, -1);
  // (la vista sulla propria base: app.js, dopo la prima misura della finestra)
}

// Il tetto di popolazione scelto (manager.js lo tiene a 99)
export function skirmishPopcap(g) {
  if (g.sk && g.popcap > g.sk.popMax) g.popcap = g.sk.popMax;
}

// Il punteggio per la vittoria a tempo: il valore di quello che si ha in
// piedi (edifici e unita', al costo) piu' le risorse.
const VALUE = { centro: 400, castello: 900, torre: 250, caserma: 200, stalla: 220, chiesa: 250, casa: 60, magazzino: 80,
                barn: 80, campo: 40, unit: 60, worker: 50 };
export function skirmishScore(w, side) {
  const P = side === "player" ? "" : "enemy_";
  let s = 0;
  const add = (o, v) => { s += w.number(P + o) * v; };
  for (const [o, v] of Object.entries(VALUE)) {
    if (o === "unit" || o === "worker") continue;
    add(side === "player" ? o : ({ casa: "house", barn: "mulino" }[o] || o), v);
  }
  const units = [...w.all(side === "player" ? "ally_unit" : "enemy_unit")];
  for (const u of units) s += u.object.endsWith("omino") ? VALUE.worker : VALUE.unit;
  const r = side === "player" ? w.g : w.g.en || {};
  s += Math.floor(((r.food || 0) + (r.wood || 0) + (r.gold || 0) * 2 + (r.stone || 0) * 2) / 10);
  return s;
}
const scoreMinutes = (v) => ({ score20: 20, score40: 40, score60: 60 }[v] || 0);
export const elapsed = (g) => (g.hours || 0) * 3600 + (g.minutes || 0) * 60 + (g.seconds || 0);

// sk_manager: la tregua, il tetto di popolazione, vittoria e sconfitta
// - Conquista: vince chi distrugge tutti gli edifici dell'altro (il centro
//   del giocatore distrutto non fa perdere, buildings.js);
// - Municipio: vince chi distrugge il centro dell'altro;
// - Punteggio: allo scadere vince il punteggio piu' alto (a pari, la CPU:
//   per vincere bisogna fare meglio); prima, come Conquista.
export function skManager() {
  return {
    create(i) { i.sprite_index = null; i.alarm.set(0, 30); },
    alarm0(i, w) {
      i.alarm.set(0, 30);
      const g = w.g, S = g.sk;
      if (!S || g.victory || g.gameover || w.exists("victory_manager") || w.exists("gameover_manager")) return;
      skirmishPopcap(g);
      if (S.truce > 0 && g.en && g.en.hold && elapsed(g) >= S.truce * 60) g.en.hold = 0;
      const win = () => { g.victory = 1; g.skResult = "win"; w.create("victory_manager", 0, 0); };
      const lose = (why) => { g.gameover = 1; g.skLost = why; w.create("gameover_manager", 0, 0); };
      // (cc_barn: il "mulino" invisibile del centro, che gli sopravvive)
      const enemyBuildings = w.number("enemy_build"), myBuildings = w.number("ally_build") - w.number("cc_barn");
      if (S.victory === "townhall") {
        if (!w.exists("enemy_centro")) win();
        return; // il centro del giocatore: buildings.js
      }
      const mins = scoreMinutes(S.victory);
      if (mins && elapsed(g) >= mins * 60) {
        const me = skirmishScore(w, "player"), cpu = skirmishScore(w, "cpu");
        g.skScore = [me, cpu];
        if (me > cpu) win(); else lose("score");
        return;
      }
      if (enemyBuildings === 0) win();
      else if (myBuildings === 0) lose("buildings");
    },
  };
}

// ---------------------------------------------------- la CPU (economy.js)

// I numeri della regia economica (ECO, economy.js) per la schermaglia: la
// difficolta' (quanti lavoratori, quanto in fretta, quanti soldati e quando
// attacca) e lo stile (cosa costruisce e quando). buildOrder: gli edifici,
// in ordine (lo stesso nome ripetuto = un altro), le case quando servono
// (houses). soldiersAt: lavoratori prima dei soldati.
const DIFF = {
  easy: { workers: 10, workerTime: 1400, army: 10, attackAt: 5, attackGrow: 1, attackEvery: 4 * 3600, firstAttack: 11 * 3600, guard: 2, soldiersAt: 8 },
  normal: { workers: 16, workerTime: 1000, army: 20, attackAt: 7, attackGrow: 2, attackEvery: 3 * 3600, firstAttack: 8 * 3600, guard: 3, soldiersAt: 9 },
  hard: { workers: 22, workerTime: 800, army: 30, attackAt: 9, attackGrow: 2, attackEvery: 150 * 60, firstAttack: 6 * 3600, guard: 4, soldiersAt: 10 },
  rigged: { workers: 26, workerTime: 700, army: 40, attackAt: 10, attackGrow: 3, attackEvery: 120 * 60, firstAttack: 5 * 3600, guard: 4, soldiersAt: 10 },
};
const STYLE = {
  balanced: { buildOrder: ["enemy_campo", "enemy_campo", "enemy_caserma", "enemy_campo", "enemy_stalla", "enemy_torre", "enemy_caserma", "enemy_campo", "enemy_chiesa", "enemy_stalla", "enemy_torre", "enemy_castello"],
              troops: ["enemy_warrior", "enemy_picchiere", "enemy_arciere"] },
  aggressive: { buildOrder: ["enemy_campo", "enemy_caserma", "enemy_campo", "enemy_caserma", "enemy_stalla", "enemy_campo", "enemy_caserma", "enemy_stalla"],
                troops: ["enemy_warrior", "enemy_warrior", "enemy_picchiere", "enemy_arciere"], k: { firstAttack: 0.55, attackEvery: 0.7, soldiersAt: -3, attackAt: -2 } },
  defensive: { buildOrder: ["enemy_campo", "enemy_campo", "enemy_caserma", "enemy_torre", "enemy_campo", "enemy_torre", "enemy_stalla", "enemy_torre", "enemy_chiesa", "enemy_castello", "enemy_caserma"],
               troops: ["enemy_picchiere", "enemy_arciere", "enemy_arciere"], k: { firstAttack: 1.5, attackAt: 4, guard: 4 } },
  economic: { buildOrder: ["enemy_campo", "enemy_campo", "enemy_campo", "enemy_campo", "enemy_caserma", "enemy_stalla", "enemy_campo", "enemy_caserma", "enemy_stalla", "enemy_chiesa", "enemy_castello"],
              troops: ["enemy_warrior", "enemy_picchiere", "enemy_arciere"], k: { workers: 4, firstAttack: 1.4, attackAt: 5, soldiersAt: 4 } },
  raider: { buildOrder: ["enemy_campo", "enemy_stalla", "enemy_campo", "enemy_stalla", "enemy_caserma", "enemy_campo", "enemy_stalla"],
            troops: ["enemy_arciere", "enemy_warrior"], raid: true, k: { firstAttack: 0.7, attackAt: -3, attackEvery: 0.6 } },
};
export function skirmishEco(sk) {
  const D = { ...DIFF[sk.difficulty] || DIFF.normal }, S = STYLE[sk.style] || STYLE.balanced;
  for (const [key, v] of Object.entries(S.k || {})) {
    D[key] = ["firstAttack", "attackEvery"].includes(key) ? Math.round(D[key] * v) : Math.max(key === "attackAt" ? 3 : 0, D[key] + v);
  }
  const k = sk.difficulty === "rigged" ? RIGGED_START : 1, r = START_RES[sk.resources] || START_RES.normal;
  return { ...D, startWorkers: 3, start: { food: r.food * k, wood: r.wood * k, gold: r.gold * k, stone: r.stone * k },
           buildOrder: S.buildOrder, troops: S.troops, raid: !!S.raid, houses: true, popMax: sk.pop,
           mix: { wood: 3, gold: 2, food: 3, stone: 1 }, rebuild: true, newDeposits: 3, stoneWork: true, armyEco: false,
           anyTroop: true, defendR: 700 };
}
