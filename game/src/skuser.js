// [§9.190, richiesta dell'autore: le mappe dell'editor nella schermaglia,
// "se caricate" (§9.182)] Le mappe dell'editor nella schermata della
// schermaglia (menu.js): dopo le cinque del gioco scorrono quelle salvate nel
// browser (mapstore.js) e quelle aperte da file in quella schermata; per
// ognuna la copertina (o, senza, un disegno della mappa: mapPreview), il
// nome, la descrizione e la CPU: difficolta' e stile fissati dalla mappa
// (riquadri bloccati) o a scelta del giocatore. Non nella partita online
// (per ora, da discutere con l'autore).
//
// "Inizia" gioca la mappa nella room `custom` (app.js), come "Prova mappa"
// (§9.188) ma da partita vera: la pausa di sempre, i salvataggi (con la
// mappa dentro: la room non e' fra quelle del gioco), il ritorno al menu.

import { listMaps, loadMap, openMapFile, putService } from "./mapstore.js";
import { validateMap, testRoom, TEST_ROOM, sidesOk, redStart, START } from "./mapfile.js";

// l'ultima mappa dell'editor scelta nella schermaglia (il suo id nel browser)
const USER_KEY = "535.skirmish.user";
export function lastUserMap() { try { return localStorage.getItem(USER_KEY); } catch (e) { return null; } }
export function rememberUserMap(id) {
  try { if (id) localStorage.setItem(USER_KEY, id); else localStorage.removeItem(USER_KEY); } catch (e) { /* solo per ora */ }
}

// Le opzioni della partita su una mappa dell'editor: quelle della
// schermaglia del giocatore, con difficolta' e stile della CPU della mappa
// se sono fissati (anche "Prova mappa", editor.js); [§9.191] la partenza
// del giocatore e' quella rossa (non a caso come nelle mappe del gioco)
export function skForMap(sk, map) {
  const cpu = map && map.cpu;
  return { ...sk, map: TEST_ROOM, difficulty: !cpu || cpu.difficulty === "choice" ? sk.difficulty : cpu.difficulty,
           style: !cpu || cpu.style === "choice" ? sk.style : cpu.style, ...(map ? { start: redStart(map) } : {}) };
}
// il parametro `key` fissato dalla mappa (null: a scelta del giocatore)
export const fixedBy = (map, key) => (map && map.cpu && map.cpu[key] && map.cpu[key] !== "choice" ? map.cpu[key] : null);

// Le voci della schermata: { user: true, id (nel browser) o file, name,
// state: "idle" | "loading" | "ok" | "bad", map, sides (§9.191: una
// partenza rossa e una blu), desc }
const entry = (fields) => ({ user: true, state: "idle", map: null, sides: false, desc: "", ...fields });
export async function userMapList() {
  try {
    return (await listMaps()).map(({ id, name }) => entry({ id, name }));
  } catch (e) {
    return []; // senza IndexedDB: nessuna mappa nel browser
  }
}

let allowed = null;
async function check(data, objects) {
  if (!allowed) allowed = (await import("./editmap.js")).allowedObjects();
  return validateMap(data, allowed, objects);
}
function fill(e, v) {
  if (v.errors) { e.state = "bad"; console.warn("[schermaglia] mappa non valida:", v.errors); return e; }
  Object.assign(e, { state: "ok", map: v.map, name: v.map.name || e.name, desc: v.map.description || "", sides: sidesOk(v.map) });
  return e;
}
// la mappa di una voce del browser, letta e convalidata (una volta)
export async function loadUserMap(e, objects) {
  if (e.state !== "idle") return e;
  e.state = "loading";
  try {
    const data = await loadMap(e.id);
    return fill(e, data ? await check(data, objects) : { errors: ["non c'e' piu'"] });
  } catch (err) {
    console.error(err);
    e.state = "bad";
    return e;
  }
}
// una mappa da file (.dvmap): la voce, { invalid: true } o null (annullato)
export async function openUserFile(objects) {
  const res = await openMapFile();
  if (!res) return null;
  if (res.invalid) return { invalid: true };
  const e = fill(entry({ file: true, name: "" }), await check(res.data, objects));
  return e.state === "ok" ? e : { invalid: true };
}

// "Inizia": la room e le opzioni nel browser, poi la partita
export const PLAY = "__play__";
export async function playUserMap(map, sk) {
  await putService(PLAY, { room: testRoom(map), sk, name: map.name || "" });
  location.search = "?room=" + TEST_ROOM + "&play=1";
}

// ---------------------------------------------------- copertina e disegno

// Un'immagine (Blob, canvas) come sprite del gioco, con un suo "gruppo" di
// una pagina (assets.js): la copertina della mappa mostrata. Lo stesso nome
// riusa il posto (la texture di prima si libera).
export async function registerImage(assets, name, source) {
  const bmp = await createImageBitmap(source, { premultiplyAlpha: "premultiply", colorSpaceConversion: "none" });
  for (const t of assets.groups.get(name) || []) assets.r.deleteTexture(t);
  assets.groups.set(name, [assets.r.createTexture(bmp)]);
  assets.sprites[name] = { group: name, width: bmp.width, height: bmp.height, origin: [bmp.width / 2, bmp.height / 2], scale: 1,
                           frames: [{ trim: [0, 0, bmp.width, bmp.height], page: 0, rect: [0, 0, bmp.width, bmp.height] }] };
  if (bmp.close) bmp.close();
  return name;
}
// la copertina della mappa (data URL) o, senza, il suo disegno
export async function coverImage(map, sizeOf) {
  if (map.cover) return (await fetch(map.cover)).blob();
  return mapPreview(map, sizeOf);
}

// [§9.190] Il disegno di una mappa senza copertina, 720 x 480 come le foto
// delle mappe della schermaglia: la mappa intera vista dall'alto, coi colori
// medi degli sfondi (green1, city1, city2), le macchie, i fiumi, le strade,
// le montagne, gli alberi, le risorse, la citta' e le due partenze.
// sizeOf(oggetto) -> [larghezza, altezza] dello sprite, in px della room.
export const PREVIEW = {
  w: 720, h: 480, pad: 14,
  bg: { green1: "#808962", city1: "#a7a399", city2: "#a19e95" },
  water: "#6a9ec0", road: "#8a7a5e", path: "#9c8c6c",
  tree: "#4f6b45", mountain: "#a67b5b", gold: "#e0b43c", stone: "#8f8f8f", ruin: "#7b7267", city: "#ddd5c4",
  start: { red: "#c83038", blue: "#3070e8" }, startRing: "#ffffff",
};
const kindOf = (o) => (o === START ? "start" : /^albero/.test(o) ? "tree" : /^montagna_/.test(o) ? "mountain"
  : o === "miniera_oro" ? "gold" : /^pietr/.test(o) ? "stone" : /ruin$/.test(o) ? "ruin" : /^(ocr_|o_)/.test(o) ? "city" : null);
export function mapPreview(map, sizeOf = () => [100, 100]) {
  const P = PREVIEW, cv = document.createElement("canvas");
  cv.width = P.w; cv.height = P.h;
  const g = cv.getContext("2d");
  const s = Math.min((P.w - 2 * P.pad) / map.width, (P.h - 2 * P.pad) / map.height);
  const ox = (P.w - map.width * s) / 2, oy = (P.h - map.height * s) / 2;
  const X = (x) => ox + x * s, Y = (y) => oy + y * s;
  g.save();
  g.beginPath(); g.rect(ox, oy, map.width * s, map.height * s); g.clip();
  g.fillStyle = P.bg[map.background] || P.bg.green1;
  g.fillRect(ox, oy, map.width * s, map.height * s);
  const poly = (pts) => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); };
  for (const p of map.patches || []) {
    g.globalAlpha = p.alpha ?? 1;
    g.fillStyle = P.bg[p.bg || "city2"] || P.bg.city2;
    poly(p.pts); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  g.lineCap = "round"; g.lineJoin = "round";
  const line = (f, colour, w) => { g.strokeStyle = colour; g.lineWidth = Math.max(1.2, w * s); poly(f.pts); g.stroke(); };
  for (const r of map.roads || []) line(r, r.kind === 2 ? P.path : P.road, ((r.width ?? 120) + (r.widthEnd ?? r.width ?? 120)) / 2);
  for (const r of map.rivers || []) line(r, P.water, ((r.width ?? 200) + (r.widthEnd ?? r.width ?? 200)) / 2);
  const dot = (x, y, r, colour) => { g.fillStyle = colour; g.beginPath(); g.arc(X(x), Y(y), r, 0, Math.PI * 2); g.fill(); };
  const groups = { mountain: [], ruin: [], city: [], tree: [], gold: [], stone: [], start: [] };
  for (const e of map.instances) { const k = kindOf(e.object); if (k) groups[k].push(e); }
  for (const e of groups.mountain) {
    const [w, h] = sizeOf(e.object);
    g.fillStyle = P.mountain;
    g.beginPath(); g.ellipse(X(e.x), Y(e.y), Math.max(2, w * Math.abs(e.scale_x) * s * 0.42), Math.max(2, h * Math.abs(e.scale_y) * s * 0.32), 0, 0, Math.PI * 2); g.fill();
  }
  for (const k of ["ruin", "city"]) {
    for (const e of groups[k]) {
      const [w, h] = sizeOf(e.object), bw = Math.max(2, w * Math.abs(e.scale_x) * s * 0.8), bh = Math.max(2, h * Math.abs(e.scale_y) * s * 0.5);
      g.fillStyle = P[k];
      g.fillRect(X(e.x) - bw / 2, Y(e.y) - bh, bw, bh);
    }
  }
  const treeR = Math.max(1.2, 40 * s);
  for (const e of groups.tree) dot(e.x, e.y, treeR, P.tree);
  for (const e of groups.gold) dot(e.x, e.y, Math.max(2.5, 70 * s), P.gold);
  for (const e of groups.stone) dot(e.x, e.y, Math.max(2.5, 60 * s), P.stone);
  for (const e of groups.start) { dot(e.x, e.y, 10, P.startRing); dot(e.x, e.y, 7, P.start[e.side] || "#808080"); } // §9.191: del suo colore
  g.restore();
  g.strokeStyle = "rgba(40, 40, 40, 0.6)"; g.lineWidth = 2;
  g.strokeRect(ox, oy, map.width * s, map.height * s);
  return cv;
}
