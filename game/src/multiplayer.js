// [§9.155, multiplayer, fase 3] Le due parti della partita a due.
//
// Decisione dell'autore (17 novembre 2026): il secondo giocatore ha oggetti
// suoi, GEMELLI di quelli del giocatore (p2_warrior, p2_centro,
// p2_casa_fond, p2_arciere_bullet...): la stessa logica, le stesse maschere,
// gli sprite blu dei nemici al disegno (p2sprites.js). Solo nel
// multiplayer: altrove i gemelli non nascono e niente cambia.
//
// LO SPECCHIO. Il codice del giocatore (units.js, buildings.js, ...) parla
// coi nomi del giocatore ("ally_unit", "centro", "casa_fond") e chiama
// "enemy_*" il nemico. Non si riscrive: per gli eventi di un'istanza p2_*
// il mondo passa al posto di se stesso uno SPECCHIO (mirrorWorld) che
// traduce i nomi negli argomenti dei suoi metodi (all, nearest, create,
// instancePlace, is, ...): per il giocatore 2 "ally_unit" e' "p2_unit",
// "centro" e' "p2_centro", e "enemy_unit" e' "ally_unit" (il giocatore 1);
// e w.g e' la sua cassa (global.p2: risorse, popolazione, civili inattivi).
// Nel multiplayer anche il giocatore 1 ha il suo specchio: "enemy_*" sono
// le istanze p2_*.
//
// Chi usa questo modulo: world.js (fire: lo specchio di chi riceve l'evento;
// le collisioni tradotte), app.js (i gemelli nella partita a due).

// gli oggetti che hanno un gemello: la famiglia del giocatore (ally_* e gli
// oggetti con un genitore ally*) e quello che porta il colore o la parte
// (frecce e proiettili, cadaveri, bandiere, il cibo portato al granaio)
const EXTRA = ["arciere_bullet", "arciere_bullet_t", "catapulta_bullet", "food_bullet", "flag_r", "flag_r2",
               "warrior_corpse", "picchiere_corpse", "cavaliere_corpse", "arciere_corpse", "ariete_corpse",
               "catapulta_corpse", "omino_corpse"];
// della campagna o dell'interfaccia, senza gemello
const NO_TWIN = /^(monastero|o_statua|palo_|object183$|oodl$|oosl$|ovbl$|oval$)/;

// [§9.155, segnalazione dell'autore: un mulino rosso sul centro blu] togliere
// "ally_" non deve dare il nome di un altro oggetto: ally_barn (la famiglia
// dei depositi del cibo) e barn (il mulino) diventavano tutti e due p2_barn,
// e il deposito invisibile del centro blu nasceva mulino. Quei nomi tengono
// il prefisso (p2_ally_barn): COLLIDE, riempito da nameMaps.
const COLLIDE = new Set();
export const twinName = (n) => (n === "ally" ? "p2" : COLLIDE.has(n) ? "p2_" + n : n.startsWith("ally_") ? "p2_" + n.slice(5) : "p2_" + n);

// [§9.155] il nome originale di un gemello (p2_omino -> ally_omino, p2_centro
// -> centro): per il codice del giocatore che confronta i nomi degli oggetti
// (i.object === "ally_omino", tabelle per nome). La tabella la riempie
// setupMultiplayer; senza partita a due e' il nome stesso.
const BASE = new Map();
export const baseOf = (i) => (i.object.startsWith("p2_") ? BASE.get(i.object) ?? i.object : i.object);
// la famiglia delle unita' della parte di un'istanza: enemy_unit (la CPU),
// p2_unit (il blu), ally_unit (il giocatore)
export const unitFam = (i) => {
  const ps = i.parents || [];
  return ps.includes("enemy_unit") ? "enemy_unit" : i.object && i.object.startsWith("p2_") ? "p2_unit" : "ally_unit";
};

export function twinNames(objects) {
  const out = [];
  for (const [n, v] of Object.entries(objects)) {
    if (NO_TWIN.test(n) || n.startsWith("p2_")) continue;
    const mine = n === "ally" || n.startsWith("ally_") || (v.parents || []).some((p) => p === "ally" || p.startsWith("ally_"));
    if (mine || EXTRA.includes(n)) out.push(n);
  }
  return out;
}

// il nemico della CPU -> il suo corrispondente del giocatore (il codice del
// giocatore chiama "enemy_*" chi combatte)
export const ENEMY_EQ = {
  enemy: "ally", enemy_unit: "ally_unit", enemy_build: "ally_build", enemy_wooden: "ally_wooden",
  enemy_fondamenta: "ally_fondamenta", enemy_cantiere: "ally_fondamenta", enemy_magazza: "ally_magazza", enemy_barn: "ally_barn",
  enemy_militare: "ally_militare", enemy_infantry: "ally_infantry",
  enemy_warrior: "ally_warrior", enemy_picchiere: "ally_picchiere", enemy_cavaliere: "ally_cavaliere",
  enemy_arciere: "ally_arciere", enemy_ariete: "ally_ariete", enemy_catapulta: "ally_catapulta", enemy_omino: "ally_omino",
  enemy_centro: "centro", enemy_house: "casa", enemy_caserma: "caserma", enemy_stalla: "stalla", enemy_castello: "castello",
  enemy_torre: "torre", enemy_chiesa: "chiesa", enemy_magazzino: "magazzino", enemy_mulino: "barn", enemy_campo: "campo",
  enemy_mura_ori: "mura_ori", enemy_mura_vert: "mura_vert", enemy_porta_ori: "porta_ori", enemy_porta_vert: "porta_vert",
};

// le tabelle dei nomi delle due parti: side 2 (il giocatore 2: i suoi nomi
// -> p2_*, il nemico -> il giocatore 1) e side 1 (nel multiplayer: il nemico
// -> p2_*)
export function nameMaps(objects) {
  const twins = new Set(twinNames(objects));
  for (const n of twins) if (n.startsWith("ally_") && objects[n.slice(5)]) COLLIDE.add(n);
  const names = new Map();
  for (const n of twins) {
    const t = twinName(n);
    if (names.has(t) || objects[t]) throw new Error(`gemello doppio: ${t} (${n}, ${names.get(t) || "esiste gia'"})`);
    names.set(t, n);
  }
  const m2 = {}, m1 = {};
  for (const n of twins) m2[n] = twinName(n);
  for (const [e, a] of Object.entries(ENEMY_EQ)) {
    m2[e] = a;
    m1[e] = twins.has(a) ? twinName(a) : a;
  }
  return { twins: [...twins], m1, m2 };
}

// gli oggetti gemelli (definizioni) da aggiungere: stessi campi, i genitori
// tradotti
export function twinObjects(objects, twins) {
  const out = {};
  for (const n of twins) {
    const v = objects[n];
    out[twinName(n)] = { ...v, parents: (v.parents || []).map((p) => (p === "ally" || p.startsWith("ally_") || twins.includes(p) ? twinName(p) : p)) };
  }
  return out;
}

// la cassa di ogni giocatore: per il giocatore 2 questi campi di global
// stanno in global.p2
export const POOL_KEYS = new Set(["food", "wood", "gold", "stone", "pop", "popcap", "idle"]);
function poolProxy(g) {
  return new Proxy(g, {
    get: (t, k) => (POOL_KEYS.has(k) ? t.p2[k] : t[k]),
    set: (t, k, v) => { if (POOL_KEYS.has(k)) t.p2[k] = v; else t[k] = v; return true; },
  });
}

// Lo specchio del mondo per una parte (map: nome -> nome; pool: la cassa del
// giocatore 2). I metodi girano sul mondo vero (this e' il mondo: le
// chiamate interne non si traducono due volte), con gli argomenti stringa
// tradotti.
export function mirrorWorld(world, map, pool2) {
  const tr = (a) => (typeof a === "string" && map[a] !== undefined ? map[a] : a);
  const cache = new Map();
  let gp = null, gOf = null;
  return new Proxy(world, {
    get(t, k) {
      if (k === "g" && pool2) { if (gOf !== t.g) { gp = poolProxy(t.g); gOf = t.g; } return gp; }
      if (k === "__mirror") return true;
      const v = t[k];
      if (typeof v !== "function") return v;
      let f = cache.get(k);
      if (!f || f.__v !== v) {
        f = function (...args) { return v.apply(t, args.map(tr)); };
        f.__v = v;
        cache.set(k, f);
      }
      return f;
    },
  });
}

// La partita a due nel mondo: gli oggetti gemelli con i comportamenti dei
// loro originali (registrati prima), gli specchi delle due parti, la parte
// di chi guarda (local). Da chiamare dopo tutti i world.register e prima
// che nascano le istanze. La cassa del giocatore 2 (global.p2) la fa app.js.
export function setupMultiplayer(world, local) {
  const { twins, m1, m2 } = nameMaps(world.objects);
  for (const t of twins) BASE.set(twinName(t), t);
  Object.assign(world.objects, twinObjects(world.objects, twins));
  for (const n of twins) if (world.behaviours[n]) world.behaviours[twinName(n)] = world.behaviours[n];
  world.mp = { twins: new Set(twins), m1, m2, mirror1: mirrorWorld(world, m1, false), mirror2: mirrorWorld(world, m2, true),
               local, actor: null };
  world._collMaps = null;
  return world.mp;
}

// [§9.155] La nebbia di guerra nella partita a due. Per le istanze delle due
// parti `visible` vuol dire "la vede l'avversario": cosi' il codice del
// giocatore, che guarda `visible` sul bersaglio (autoAttack: si attacca chi
// si vede), vale per tutte e due le parti. Si calcola a ogni passo per
// tutte e due, come i nemici della CPU (enemies.js visibility): unita' a
// 150 px, edifici a 200, castelli e torri a 500, di piu' di giorno
// (sightK), sempre se colpite o con la visibilita' "Totale". Le proprie le
// disegna sempre chi guarda (world.draw, shown). Solo le istanze che la
// definizione vuole visibili (le altre restano nascoste come prima).
export function pvpVisibility(world, sightK) {
  const mp = world.mp;
  if (!mp) return;
  const g = world.g;
  for (const [side, opp] of [[1, mp.mirror2], [2, mp.mirror1]]) {
    const n = sightK(opp);
    const near = (i, obj, r) => opp.nearWithin(i, obj, r + r * n, 2.01 * r);
    for (const i of world.instances) {
      if (!i.alive || i.ui || i.fx || world.sideOf(i) !== side) continue;
      const def = world.objects[i.object];
      if (!def || !def.visible) continue;
      i.visible = g.fogville === 0 || i.hit === 1 || near(i, "ally_unit", 150) || near(i, "ally_build", 200)
        || near(i, "castello", 500) || near(i, "torre", 500);
    }
  }
}
