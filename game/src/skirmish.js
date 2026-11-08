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

// Le mappe: room -> nome e descrizione. [§9.129, decisione dell'autore] I
// nomi in italiano (prima erano quelli storici in latino: Padus, Silva
// Umbra, Rivoaltus, Urbs, Mons Bardonis), tradotti dove esiste il nome
// nelle altre lingue (texts.js; Urbe resta Urbe). Il nome qui e' la
// chiave inglese, come per gli altri testi.
// Quelle senza room arrivano piu' avanti.
export const SK_MAPS = [
  { room: "sk_padus", name: "Padania", shot: [3500, 3470], // shot: la foto della mappa (tools/17_cartoline.mjs)
    // mist: dove nasce la nebbia (sk_nebbia; il gemello ruotato si aggiunge da se')
    mist: [[700, 4850], [2350, 3950]],
    desc: "The great plain of the Po. The river splits the two lands: three bridges, open fields, cavalry country." },
  // [§9.124] la Foresta Umbra: il bosco dappertutto, radure e strade
  { room: "sk_silva", name: "Umbra Forest", shot: [2350, 2620], mist: [[3300, 3600], [2350, 2600], [1300, 4400]],
    desc: "The ancient forest of the Gargano. Only narrow roads cross it, from glade to glade: gold and stone lie hidden among the trees." },
  // [§9.125] Rialto, la laguna: canali, isole e i ponti dell'autore
  { room: "sk_rivo", name: "Lagoon", shot: [2250, 2950], tiers: ["citta"],
    mist: [[1200, 4300], [3000, 1300], [2250, 2000], [5600, 600]],
    desc: "The islands of the lagoon. Canals everywhere and few bridges: whoever holds the crossings holds the lagoon." },
  // [§9.123] Roma: la citta' in rovina al centro, con tutta la pietra
  { room: "sk_urbs", name: "Urbe", shot: [3500, 3420], tiers: ["citta"],
    desc: "Rome in ruins. The old city is the only quarry left: all the stone lies among its temples and towers. Whoever holds the centre can build." },
  // [§9.127] il Monte Bardone (la Cisa) sulla via Francigena: la cresta e i tre valichi
  { room: "sk_bardonis", name: "Apennines", shot: [3500, 3450],
    mist: [[3500, 3500], [1450, 3450], [2550, 3000]],
    desc: "Monte Bardone, the pass of the Via Francigena. A mountain ridge splits the two valleys: only three passes cross it." },
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
  // [§9.121, richiesta dell'autore] tre valori: il ciclo, sempre giorno,
  // sempre notte; la pioggia normale, frequente o mai
  daynight: { label: "Day and night", values: ["cycle", "day", "night"], names: { cycle: "Cycle", day: "Always day", night: "Always night" } },
  rain: { label: "Rain", values: ["normal", "frequent", "off"], names: { normal: "Normal", frequent: "Frequent", off: "OFF" } },
};
// [§9.121, richiesta dell'autore] la posizione di partenza esce dalla
// schermata per ora: sempre a caso (resta fra i parametri, start)
const HIDDEN = { start: ["random", "A", "B"] };
export const SK_DEFAULTS = { map: "sk_padus", difficulty: "normal", style: "balanced", victory: "conquest", resources: "normal",
                             pop: 75, truce: 0, fog: "normal", daynight: "cycle", rain: "normal", start: "random" };
const KEY = "535.skirmish";

export function loadSkirmish() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && typeof s === "object") {
      const out = { ...SK_DEFAULTS };
      for (const k of Object.keys(SK_DEFAULTS)) {
        if (k === "map") { if (SK_ROOMS.includes(s.map)) out.map = s.map; continue; }
        const vs = SK_OPTIONS[k] ? SK_OPTIONS[k].values : HIDDEN[k];
        if (vs && vs.includes(s[k])) out[k] = s[k];
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
  // [§9.122] un po' di nebbia (anche sul lato B, ruotata)
  const map = SK_MAPS.find((m) => m.room === world.room);
  for (const [x, y] of (map && map.mist) || []) {
    world.create("sk_nebbia", x, y);
    world.create("sk_nebbia", world.roomW - x, world.roomH - y);
  }
  world.create("objective_button", 0, 0);
  g.obj = 1;
  // nebbia
  if (params.fog === "none") g.fogville = 0;
  if (params.fog === "explored") fog.explored.fill(255);
  // giorno e notte, pioggia (manager.js, allarmi 0/1 e 4)
  if (params.daynight === "day") { manager.al.set(0, -1); manager.al.set(1, -1); g.night = 0; }
  if (params.daynight === "night") { manager.al.set(0, -1); manager.al.set(1, -1); g.night = 1; }
  if (params.rain === "off") manager.al.set(4, -1);
  if (params.rain === "frequent") manager.al.set(4, RAIN_EVERY.frequent[0] / 2);
  // (la vista sulla propria base: app.js, dopo la prima misura della finestra)
}

// [§9.121] l'intervallo fra due piogge (manager.js allarme 6): l'originale
// da 20000 a 35000 passi; "frequente" un terzo
export const RAIN_EVERY = { normal: [20000, 35000], frequent: [6000, 12000] };
export const rainGap = (g) => RAIN_EVERY[g.sk && g.sk.rain === "frequent" ? "frequent" : "normal"];

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

// [§9.122, richiesta dell'autore] Un po' di nebbia sulla mappa: sk_nebbia
// fa nascere MIST.n nuvole (lo sprite della nebbia del menu, fog1) sparse
// attorno a se' e di nuovo ogni MIST.every passi; ogni nuvola compare
// piano fino a MIST.alpha, scivola a destra di MIST.speed px a passo e dopo
// MIST.life passi svanisce. Non e' fog01 del menu: la sua presenza cambia
// l'inseguimento dei nemici [C, enemies.js].
export const MIST = { n: 5, every: 2400, alpha: 0.5, speed: 0.5, life: 6000, spread: [900, 300], fade: 0.005 };
export function skNebbia() {
  const spawn = (i, w) => {
    for (let k = 0; k < MIST.n; k++) {
      const x = i.x + (Math.random() - 0.5) * 2 * MIST.spread[0], y = i.y + (Math.random() - 0.5) * 2 * MIST.spread[1];
      w.create("sk_nube", Math.round(x), Math.round(y));
    }
    i.alarm.set(0, MIST.every);
  };
  return { create(i, w) { i.sprite_index = null; spawn(i, w); }, alarm0: spawn };
}
export function skNube() {
  return {
    create(i) {
      i.depth = -i.y - 100;
      i.alfa = 0; i.out = 0;
      i.direction = 0; i.speed = MIST.speed;
      i.alarm.set(0, MIST.life);
      i.image_xscale = i.image_yscale = 0.8 + Math.random() * 0.6;
    },
    alarm0(i) { i.out = 1; },
    step(i, w) {
      if (i.out) { i.alfa -= MIST.fade; if (i.alfa <= 0) w.destroy(i); }
      else if (i.alfa < MIST.alpha) i.alfa = Math.min(MIST.alpha, i.alfa + MIST.fade);
    },
    draw(i, w, d) {
      d.spriteExt("fog1", 0, i.x, i.y, i.image_xscale, i.image_yscale, 0, 0xffffff, i.alfa);
    },
  };
}
