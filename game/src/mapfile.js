// Le mappe come dati (STUDIO.md §9.180, §9.181): lo scenario "535-scenario"
// (§9.3, quello che scrive tools/12_tiled_import.py e che sta in scenari/)
// e la room del motore (game/assets/rooms/<room>.json, tools/07_scene.py).
//
// L'editor di mappe lavora sugli scenari: apre le mappe del gioco (room) e le
// riporta a scenario (roomToScenario); per provarle nel gioco fara' il
// contrario (scenarioToRoom, la stessa conversione di tools/07_scene.py).

export const MAP_FORMAT = "535-scenario", MAP_VERSION = 1;
// colore della room [C] (12632256 = c_silver in BGR) e sfondo predefiniti,
// come la mappa vuota del kit di Tiled (tools/11 --nuova)
export const MAP_COLOUR = 12632256, MAP_BACKGROUND = "green1";
// le parti disegnate a linee e a forme (§9.97, §9.99, §9.101), solo se ci
// sono, come in tools/07
export const MAP_FEATURES = ["patches", "roads", "rivers", "bridges", "paths"];

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
           instances: [], roads: [], rivers: [], bridges: [], patches: [],
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
    description: str(data.description, DESC_MAX) ? data.description : "",
    cpu: { difficulty: CPU_DIFFICULTY.includes(data.cpu && data.cpu.difficulty) ? data.cpu.difficulty : "choice",
           style: CPU_STYLE.includes(data.cpu && data.cpu.style) ? data.cpu.style : "choice" },
  };
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
    instances: sc.instances.map((i) => [i.object, i.x, i.y, i.scale_x, i.scale_y, i.rotation, 4294967295]
      .concat(i.group ? [i.group] : [])),
  };
  for (const k of MAP_FEATURES) if (sc[k] && sc[k].length) room[k] = sc[k];
  return room;
}
