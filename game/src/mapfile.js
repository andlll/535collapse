// Le mappe come dati (STUDIO.md §9.180, §9.181): lo scenario "535-scenario"
// (§9.3, quello che scrive tools/12_tiled_import.py e che sta in scenari/)
// e la room del motore (game/assets/rooms/<room>.json, tools/07_scene.py).
//
// L'editor di mappe lavora sugli scenari: apre le mappe del gioco (room) e le
// riporta a scenario (roomToScenario); per provarle nel gioco fara' il
// contrario (scenarioToRoom, la stessa conversione di tools/07_scene.py).

import { cleanMountain, MOUNTAIN_LIMITS } from "./mountains.js"; // §9.214
import { cleanMeadow, MEADOW_LIMITS } from "./meadows.js"; // §9.216

export const MAP_FORMAT = "535-scenario", MAP_VERSION = 1;
// colore della room [C] (12632256 = c_silver in BGR) e sfondo predefiniti,
// come la mappa vuota del kit di Tiled (tools/11 --nuova)
export const MAP_COLOUR = 12632256, MAP_BACKGROUND = "green1";
// le parti disegnate a linee e a forme (§9.97, §9.99, §9.101), solo se ci
// sono, come in tools/07
export const MAP_FEATURES = ["patches", "roads", "rivers", "bridges", "paths", "mountains", "meadows"]; // §9.214: le montagne del generatore; §9.216: le chiazze d'erba

// [§9.184] Le informazioni delle mappe dell'editor, in piu' (tools/07 e il
// gioco le ignorano): la descrizione (la schermata della schermaglia) e la
// CPU (come nella schermaglia, piu' "statica", che non fa nulla: §9.182).
// [§9.186, richiesta dell'autore] difficolta' e stile anche "a scelta del
// giocatore" (`choice`, la scelta di partenza): li sceglie chi lancia la
// partita; la simmetria non e' piu' della mappa ma degli strumenti (SYMMETRY
// resta qui: le modalita').
export const MAP_SIZES = [4000, 5000, 6000, 7000, 8000, 9000];
export const MAP_BACKGROUNDS = ["green1", "city2", "city1"];
export const CPU_DIFFICULTY = ["choice", "easy", "normal", "hard", "rigged"];
export const CPU_STYLE = ["choice", "balanced", "aggressive", "defensive", "economic", "raider", "random", "static"];
export const SYMMETRY = ["none", "diagonal", "horizontal", "vertical"];
export const NAME_MAX = 40, DESC_MAX = 600;
// [§9.191, richiesta dell'autore] Gli schieramenti: le partenze (il centro)
// sono del rosso o del blu (`side` nella voce). Il rosso e' il giocatore (o,
// online, chi crea la partita), il blu la CPU (o chi entra). Una mappa da
// giocare ha una partenza per parte. Le mappe senza (i modelli, le mappe
// salvate prima): la partenza A (in alto a sinistra, x + y piu' piccolo,
// come skirmish.js skirmishPrepare) rossa, l'altra blu (assignSides).
export const START = "centro";
export const SIDES = ["red", "blue"];
// [§9.193, richiesta dell'autore] anche unita' ed edifici delle due parti in
// "Inserisci": nella mappa coi nomi del giocatore (gli oggetti alleati) e lo
// schieramento; il blu diventa all'avvio l'oggetto della CPU (BLUE_OF,
// testRoom) e, online, quello del secondo giocatore (app.js: i gemelli p2_*)
export const UNITS = ["ally_omino", "ally_warrior", "ally_picchiere", "ally_arciere", "ally_cavaliere", "ally_ariete", "ally_catapulta"];
export const BUILDINGS = ["casa", "caserma", "stalla", "torre", "magazzino", "barn", "campo", "chiesa", "castello"];
// [§9.194] mura e porte (orizzontali e verticali), delle due parti
export const WALLS = ["mura_ori", "mura_vert", "porta_ori", "porta_vert"];
export const SIDED = new Set([START, ...UNITS, ...BUILDINGS, ...WALLS]);
// l'oggetto della CPU corrispondente (multiplayer.js ENEMY_EQ, al contrario)
export const BLUE_OF = {
  centro: "enemy_centro", casa: "enemy_house", caserma: "enemy_caserma", stalla: "enemy_stalla", torre: "enemy_torre",
  magazzino: "enemy_magazzino", barn: "enemy_mulino", campo: "enemy_campo", chiesa: "enemy_chiesa", castello: "enemy_castello",
  ally_omino: "enemy_omino", ally_warrior: "enemy_warrior", ally_picchiere: "enemy_picchiere", ally_arciere: "enemy_arciere",
  ally_cavaliere: "enemy_cavaliere", ally_ariete: "enemy_ariete", ally_catapulta: "enemy_catapulta",
  mura_ori: "enemy_mura_ori", mura_vert: "enemy_mura_vert", porta_ori: "enemy_porta_ori", porta_vert: "enemy_porta_vert", // §9.194
};
export const otherSide = (s) => (s === "red" ? "blue" : "red");
// [§9.203, richiesta dell'autore] "l'edificio centro deve essere
// posizionabile come gli altri edifici, al di la' del punto di partenza": un
// municipio in piu' e' la voce "centro" con `hall: true` (una partenza e' il
// centro senza). Nella room (testRoom) e' nel gruppo HALL, che
// skirmishPrepare non conta fra le partenze.
export const isStart = (e) => e.object === START && !e.hall;
export const HALL = "hall";
// [§9.203, richiesta dell'autore] gli stili della casa (come nel gioco: c1s..c6s,
// quelli del blu c1b..c6b), scritti nella voce come `sprite` (il rosso)
export const HOME_STYLES = ["c1s", "c2s", "c3s", "c4s", "c5s", "c6s"];
// [§9.206, richiesta dell'autore] Le impostazioni della nebbia (la voce:
// `fog`, solo quelle diverse da FOG_DEFAULTS): per ognuna i valori possibili.
// Il banco (nebbia_banco, stealth.js): densita' (anche quanto vedono i
// nemici dentro), velocita' (px a passo), ampiezza (px per parte). La
// nebbia estetica (sk_nebbia, skirmish.js): densita' (l'opacita' delle
// nuvole), velocita' col verso (px a passo, < 0 a sinistra), durata di una
// nuvola (s), quante nuvole nascono e ogni quanto (s). I valori di partenza
// sono quelli di prima (livello 7, schermaglia).
export const FOG_SETTINGS = {
  nebbia_banco: { density: [0.25, 0.5, 0.75, 1], speed: [0, 0.5, 1, 2], range: [300, 600, 900, 1200] },
  sk_nebbia: { density: [0.25, 0.5, 0.75, 1], speed: [-1, -0.5, 0, 0.5, 1], life: [30, 60, 100, 150, 200], count: [3, 5, 8, 12], every: [20, 40, 60, 90] },
};
export const FOG_DEFAULTS = {
  nebbia_banco: { density: 1, speed: 1, range: 600 },
  sk_nebbia: { density: 0.5, speed: 0.5, life: 100, count: 5, every: 40 },
};
// le impostazioni di una voce di nebbia, con quelle di partenza
export const fogOf = (e) => ({ ...FOG_DEFAULTS[e.object], ...(e.fog || {}) });
// solo quelle diverse da quelle di partenza (null: nessuna)
export function fogDiff(object, f) {
  const out = {};
  for (const [k, v] of Object.entries(f || {})) if (FOG_DEFAULTS[object] && v !== FOG_DEFAULTS[object][k]) out[k] = v;
  return Object.keys(out).length ? out : null;
}
export const blueHome = (sprite) => (/^c[1-6]s$/.test(sprite || "") ? sprite.slice(0, 2) + "b" : null);
export function assignSides(instances) {
  // §9.193: unita' ed edifici senza schieramento: del rosso
  for (const i of instances) if (SIDED.has(i.object) && !isStart(i) && !i.side) i.side = "red";
  const starts = instances.filter(isStart);
  const free = starts.filter((i) => !i.side).sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const i of free) {
    const used = new Set(starts.map((q) => q.side).filter(Boolean));
    i.side = !used.has("red") ? "red" : !used.has("blue") ? "blue" : "red";
  }
  return instances;
}
// le partenze di una parte
export const startsOf = (map, side) => map.instances.filter((e) => isStart(e) && e.side === side).length;
// una partenza rossa e una blu: si puo' giocare
export const sidesOk = (map) => startsOf(map, "red") === 1 && startsOf(map, "blue") === 1;
// la partenza del rosso come la chiama skirmishPrepare (A: x + y piu'
// piccolo fra le due, a pari l'ordine della mappa): l'opzione `start`
export function redStart(map) {
  const cc = map.instances.filter(isStart).sort((a, b) => (a.x + a.y) - (b.x + b.y));
  return cc.length === 2 && cc[1].side === "red" ? "B" : "A";
}
// [§9.185, richiesta dell'autore] la copertina: un'immagine 720 x 480 come
// le foto delle mappe della schermaglia (§9.121), WebP o JPEG in base64
// dentro la mappa (al piu' ~500 KB)
export const COVER_W = 720, COVER_H = 480, COVER_MAX = 700000;
export const COVER_RE = /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/]+=*$/;

// Una mappa vuota: 6000 x 6000, sfondo green1. Manager e vista iniziale: li
// aggiunge l'editor (§9.180, "Da decidere").
export function newMap({ name = "", width = 6000, height = 6000, background = MAP_BACKGROUND } = {}) {
  return { format: MAP_FORMAT, version: MAP_VERSION, name, width, height, background, colour: MAP_COLOUR,
           view: { x: 0, y: 0, w: 3000, h: 2000 },
           instances: [], roads: [], rivers: [], bridges: [], patches: [], mountains: [], meadows: [],
           description: "", cpu: { difficulty: "choice", style: "choice" } };
}

// [§9.184] La convalida di una mappa che arriva da fuori (un file, il
// browser; roadmap R2: "saranno scambiati fra sconosciuti"): il formato,
// misure e numeri dentro i limiti, solo oggetti di `allowed` (con la
// variante fra le loro), niente campi sconosciuti. Restituisce { map } (una
// copia pulita, con le informazioni che mancano ai valori di partenza) o
// { errors }.
const LIMITS = { instances: 20000, features: 300, points: 4000, margin: 4000 };
export function validateMap(data, allowed, objects) {
  const errors = [], bad = (m) => { if (errors.length < 20) errors.push(m); };
  const num = (v) => typeof v === "number" && Number.isFinite(v);
  const str = (v, max) => typeof v === "string" && v.length <= max;
  if (!data || typeof data !== "object" || data.format !== MAP_FORMAT) return { errors: ["non e' una mappa"] };
  if (!(Number.isInteger(data.version) && data.version >= 1 && data.version <= MAP_VERSION)) bad("versione " + data.version);
  const W = data.width, H = data.height;
  if (!MAP_SIZES.includes(W) || !MAP_SIZES.includes(H)) bad(`misure ${W} x ${H}`);
  if (!MAP_BACKGROUNDS.includes(data.background)) bad("sfondo " + data.background);
  if (!Array.isArray(data.instances) || data.instances.length > LIMITS.instances) return { errors: [...errors, "istanze"] };
  const M = LIMITS.margin, inside = (x, y) => num(x) && num(y) && x >= -M && y >= -M && x <= W + M && y <= H + M;
  const instances = [];
  for (const e of data.instances) {
    if (!e || !allowed.has(e.object) || !objects[e.object]) { bad("oggetto " + (e && e.object)); continue; }
    const i = { object: e.object, x: e.x, y: e.y, scale_x: e.scale_x ?? 1, scale_y: e.scale_y ?? 1, rotation: e.rotation ?? 0 };
    if (!inside(i.x, i.y) || ![i.scale_x, i.scale_y, i.rotation].every(num) || Math.abs(i.scale_x) > 8 || Math.abs(i.scale_y) > 8
        || !i.scale_x || !i.scale_y) { bad("posizione di " + e.object); continue; }
    if (e.side !== undefined) { // §9.191
      if (!SIDED.has(e.object) || !SIDES.includes(e.side)) { bad("schieramento di " + e.object); continue; }
      i.side = e.side;
    }
    if (e.fog !== undefined) { // §9.206: le impostazioni della nebbia
      const S = FOG_SETTINGS[e.object];
      if (!S || !e.fog || typeof e.fog !== "object" || !Object.entries(e.fog).every(([k, v]) => S[k] && S[k].includes(v))) { bad("nebbia " + e.object); continue; }
      const f = fogDiff(e.object, e.fog);
      if (f) i.fog = f;
    }
    if (e.hall !== undefined) { // §9.203: un municipio, non una partenza
      if (e.object !== START || e.hall !== true) { bad("municipio " + e.object); continue; }
      i.hall = true;
    }
    if (e.sprite !== undefined) {
      // le varianti del gioco, o lo sprite dell'oggetto (quello della tile di
      // Tiled: tools/12 lo scrive per gli alberi finti, alb1_F)
      const ch = [...(objects[e.object].choices || []), objects[e.object].sprite];
      if (!ch.includes(e.sprite)) { bad("variante " + e.sprite); continue; }
      i.sprite = e.sprite;
    }
    instances.push(i);
  }
  const pts = (p) => Array.isArray(p) && p.length >= 2 && p.length <= LIMITS.points && p.every((q) => Array.isArray(q) && q.length === 2 && inside(q[0], q[1]));
  // le parti a linee e a forme: solo i campi che il gioco legge (tools/12),
  // ognuno controllato
  const list = (key, fields, check) => {
    const l = data[key] === undefined ? [] : data[key];
    if (!Array.isArray(l) || l.length > LIMITS.features) { bad(key); return []; }
    const out = [];
    for (const f of l) {
      if (!f || typeof f !== "object" || !check(f)) { bad(key); continue; }
      const c = { pts: f.pts.map((q) => [q[0], q[1]]) };
      for (const k of fields) if (f[k] !== undefined) c[k] = f[k];
      out.push(c);
    }
    return out;
  };
  const width = (f, k) => f[k] === undefined || (num(f[k]) && f[k] > 0 && f[k] <= 2000);
  const unit = (f, k, max) => f[k] === undefined || (num(f[k]) && f[k] >= 0 && f[k] <= max);
  assignSides(instances); // §9.191
  const map = {
    format: MAP_FORMAT, version: MAP_VERSION, name: str(data.name, NAME_MAX) ? data.name : "", width: W, height: H,
    background: data.background, colour: num(data.colour) ? data.colour : MAP_COLOUR,
    view: data.view && [data.view.x, data.view.y, data.view.w, data.view.h].every(num) ? { x: data.view.x, y: data.view.y, w: data.view.w, h: data.view.h }
      : { x: 0, y: 0, w: 3000, h: 2000 },
    instances,
    roads: list("roads", ["width", "widthEnd", "kind", "density"],
                (f) => pts(f.pts) && width(f, "width") && width(f, "widthEnd") && [1, 2].includes(f.kind ?? 1) && unit(f, "density", 5)),
    rivers: list("rivers", ["width", "widthEnd"], (f) => pts(f.pts) && width(f, "width") && width(f, "widthEnd")),
    bridges: list("bridges", [], (f) => pts(f.pts)),
    patches: list("patches", ["bg", "feather", "alpha"], (f) => pts(f.pts) && (f.bg === undefined || MAP_BACKGROUNDS.includes(f.bg))
                  && unit(f, "feather", 400) && unit(f, "alpha", 1)),
    // [§9.214] le montagne del generatore: ogni voce controllata
    // (mountains.js cleanMountain: punti, limiti, parametri)
    mountains: (() => {
      const l = data.mountains === undefined ? [] : data.mountains;
      if (!Array.isArray(l) || l.length > MOUNTAIN_LIMITS.count) { bad("mountains"); return []; }
      return l.map((f) => cleanMountain(f, W, H, M) || (bad("mountains"), null)).filter(Boolean);
    })(),
    // [§9.216] le chiazze d'erba del pennello (meadows.js cleanMeadow)
    meadows: (() => {
      const l = data.meadows === undefined ? [] : data.meadows;
      if (!Array.isArray(l) || l.length > MEADOW_LIMITS.count) { bad("meadows"); return []; }
      const inPt = (q) => Array.isArray(q) && q.length === 2 && inside(q[0], q[1]);
      return l.map((f) => cleanMeadow(f, inPt) || (bad("meadows"), null)).filter(Boolean);
    })(),
    description: str(data.description, DESC_MAX) ? data.description : "",
    cpu: { difficulty: CPU_DIFFICULTY.includes(data.cpu && data.cpu.difficulty) ? data.cpu.difficulty : "choice",
           style: CPU_STYLE.includes(data.cpu && data.cpu.style) ? data.cpu.style : "choice" },
  };
  // [§9.198] la password per modificarla (solo l'impronta: lockOf)
  if (data.lock !== undefined) {
    const L = data.lock;
    if (L && typeof L === "object" && /^[0-9a-f]{32}$/.test(L.salt) && /^[0-9a-f]{64}$/.test(L.hash)) map.lock = { salt: L.salt, hash: L.hash };
    else bad("password");
  }
  if (data.cover !== undefined) {
    if (typeof data.cover === "string" && data.cover.length <= COVER_MAX && COVER_RE.test(data.cover)) map.cover = data.cover;
    else bad("copertina");
  }
  return errors.length ? { errors } : { map };
}

// Room del motore -> scenario. Le istanze: [oggetto, x, y, scala x, scala y,
// rotazione, colore, gruppo?] (tools/07); il colore e' sempre il bianco pieno
// negli scenari (4294967295) e non si riporta.
export function roomToScenario(room) {
  const v = (room.views && room.views[0]) || { xview: 0, yview: 0, wview: 3000, hview: 2000 };
  const bg = (room.backgrounds || []).find((b) => b.visible !== false && b.name);
  const sc = {
    format: MAP_FORMAT, version: MAP_VERSION, name: room.name || "", width: room.width, height: room.height,
    background: bg ? bg.name : "", colour: room.colour ?? MAP_COLOUR,
    view: { x: v.xview, y: v.yview, w: v.wview, h: v.hview },
    instances: room.instances.map(([object, x, y, sx, sy, rot, , group]) => {
      const i = { object, x, y, scale_x: sx, scale_y: sy, rotation: rot };
      if (group) i.group = group;
      return i;
    }),
  };
  for (const k of MAP_FEATURES) sc[k] = room[k] ? JSON.parse(JSON.stringify(room[k])) : [];
  return sc;
}

// Scenario -> room del motore: come tools/07_scene.py (gli scenari di
// scenari/ diventano game/assets/rooms/<nome>.json).
export function scenarioToRoom(sc) {
  const v = sc.view;
  const room = {
    name: sc.name, width: sc.width, height: sc.height, speed: 60, colour: sc.colour,
    views: [{ index: 0, follow: "mouser", xview: v.x, yview: v.y, wview: v.w, hview: v.h, xport: 0, yport: 0,
              wport: 1024, hport: 768, hborder: 32, vborder: 32, hspeed: -1, vspeed: -1 }],
    backgrounds: sc.background ? [{ name: sc.background, visible: true, foreground: false, x: 0, y: 0, htiled: true,
                                    vtiled: true, hspeed: 0, vspeed: 0, stretch: false }] : [],
    objects: [...new Set(sc.instances.map((i) => i.object))].sort(),
    // ([§9.203] lo stile scelto nell'editor, `sprite`, dopo il gruppo: solo
    // le mappe dell'editor, testRoom; il gioco lo mette dopo il Create,
    // world.js loadRoom; [§9.206] poi le impostazioni della nebbia, `fog`)
    instances: sc.instances.map((i) => [i.object, i.x, i.y, i.scale_x, i.scale_y, i.rotation, 4294967295]
      .concat(i.group || i.sprite || i.fog ? [i.group || null] : []).concat(i.sprite || i.fog ? [i.sprite || null] : [])
      .concat(i.fog ? [{ ...i.fog }] : [])),
  };
  for (const k of MAP_FEATURES) if (sc[k] && sc[k].length) room[k] = sc[k];
  return room;
}

// [§9.188] La room per "Prova mappa": la mappa dell'editor come le room di
// tools/07, col manager se manca (il gioco ne ha bisogno, §9.3), senza la
// copertina; il nome e' quello della room di prova del gioco
export const TEST_ROOM = "custom";
export function testRoom(map) {
  // [§9.193] unita' ed edifici del blu: gli oggetti della CPU (le partenze
  // no: le sceglie skirmishPrepare, con l'opzione start)
  // [§9.203] i municipi in piu' nel gruppo HALL; la casa blu col suo
  // sprite blu
  const own = map.instances.map((e) => {
    const out = e.side === "blue" && !isStart(e) && BLUE_OF[e.object] ? { ...e, object: BLUE_OF[e.object] } : { ...e };
    if (e.hall) out.group = HALL;
    if (e.side === "blue" && blueHome(e.sprite)) out.sprite = blueHome(e.sprite);
    return out;
  });
  const instances = own.some((e) => e.object === "manager") ? own
    : [{ object: "manager", x: 100, y: 100, scale_x: 1, scale_y: 1, rotation: 0 }, ...own];
  const room = scenarioToRoom({ ...map, instances });
  room.name = TEST_ROOM;
  return room;
}

// [§9.192] L'impronta di una mappa (la partita online): due FNV-1a a 32 bit
// (semi diversi) del JSON della room di testRoom, 16 cifre esadecimali. Due
// mappe con la stessa impronta fanno la stessa partita (nome, descrizione,
// copertina e CPU non contano: non sono nella room). Non e' una protezione
// (la mappa che arriva si convalida sempre): dice a chi entra se ha gia' la
// mappa e controlla che quella ricevuta sia quella della partita.
export function mapHash(map) {
  const s = JSON.stringify(testRoom(map));
  let a = 0x811c9dc5, b = 0x050c5d1f;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x01000193) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

// [§9.198, richiesta dell'autore] La password della mappa: "chi la carica
// nell'editor la puo' modificare solo se azzecca la password (se e' stata
// impostata), mentre il caricamento per giocarci e' consentito a tutti".
// Nella mappa c'e' solo l'impronta (SHA-256 di sale + password, `lock: {
// salt, hash }`), non la password. Non e' una cifratura: la mappa resta
// leggibile (per giocarla), e chi sa modificare il file a mano puo' togliere
// il lucchetto; ferma chi usa l'editor.
const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
  0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
  0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
  0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
  0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
// SHA-256 di una stringa (UTF-8), in esadecimale
export function sha256(text) {
  const bytes = new TextEncoder().encode(text), n = bytes.length;
  const len = ((n + 9 + 63) >> 6) << 6, m = new Uint8Array(len);
  m.set(bytes);
  m[n] = 0x80;
  const bits = n * 8;
  for (let k = 0; k < 4; k++) m[len - 1 - k] = (bits >>> (8 * k)) & 0xff;
  m[len - 5] = Math.floor(bits / 0x100000000) & 0xff;
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Uint32Array(64), rot = (x, r) => (x >>> r) | (x << (32 - r));
  for (let off = 0; off < len; off += 64) {
    for (let t = 0; t < 16; t++) W[t] = (m[off + 4 * t] << 24) | (m[off + 4 * t + 1] << 16) | (m[off + 4 * t + 2] << 8) | m[off + 4 * t + 3];
    for (let t = 16; t < 64; t++) {
      const s0 = rot(W[t - 15], 7) ^ rot(W[t - 15], 18) ^ (W[t - 15] >>> 3), s1 = rot(W[t - 2], 17) ^ rot(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rot(e, 6) ^ rot(e, 11) ^ rot(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K256[t] + W[t]) >>> 0;
      const S0 = rot(a, 2) ^ rot(a, 13) ^ rot(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, "0")).join("");
}
// il lucchetto per una password nuova (salt: 16 byte a caso, crypto)
export function lockOf(password, salt = null) {
  if (!salt) {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    salt = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  return { salt, hash: sha256(salt + ":" + password) };
}
export const lockOpens = (lock, password) => !!lock && sha256(lock.salt + ":" + password) === lock.hash;
