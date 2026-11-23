// [§9.184] Le mappe dell'editor salvate: nel browser (IndexedDB, come i
// salvataggi delle partite, save.js) e su file ".dvmap" da scambiare.
//
// Nel browser: il database "535-maps", una voce per mappa con un id, il nome,
// la data e la mappa compressa (gzip; il JSON in chiaro dove il browser non
// sa comprimere). Senza IndexedDB (certe finestre private) si salva solo su
// file. Il file: la mappa (lo scenario, mapfile.js) in JSON compresso con
// gzip, senza mescolare i byte come i ".dvgame" (§9.135): una mappa si
// scambia, non c'e' niente da proteggere. Chi la apre la convalida sempre
// (mapfile.js validateMap).

import { gzipBytes, gunzipBytes, bytesText } from "./save.js";
import { COVER_W, COVER_H } from "./mapfile.js";

export const MAP_EXT = ".dvmap";
const DB_NAME = "535-maps", STORE = "maps";

let dbOpen = null;
function db() {
  if (!dbOpen) {
    dbOpen = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB non disponibile")); return; }
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => { rq.result.createObjectStore(STORE, { keyPath: "id" }); };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
      rq.onblocked = () => reject(new Error("IndexedDB bloccato"));
    });
    dbOpen.catch(() => { dbOpen = null; });
  }
  return dbOpen;
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction([STORE], mode);
    const rq = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(rq ? rq.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error("transazione annullata"));
  });
}

const newId = () => Date.now().toString(36) + "-" + Math.floor(performance.now() * 1000 % 1e6).toString(36);

// salva (o riscrive, con lo stesso id) la mappa; restituisce l'id
export async function saveMap(map, id = null) {
  const json = JSON.stringify(map);
  const gz = await gzipBytes(json);
  const rec = { id: id || newId(), name: map.name || "", date: Date.now(), width: map.width, height: map.height, ...(gz ? { gz } : { json }) };
  await tx("readwrite", (st) => st.put(rec));
  return rec.id;
}

// le mappe salvate, dalla piu' recente: { id, name, date, width, height }
export async function listMaps() {
  const all = (await tx("readonly", (st) => st.getAll())) || [];
  return all.map(({ id, name, date, width, height }) => ({ id, name, date, width, height })).sort((a, b) => b.date - a.date);
}

// il JSON della mappa (da convalidare), o null se non c'e'
export async function loadMap(id) {
  const rec = await tx("readonly", (st) => st.get(id));
  if (!rec) return null;
  return JSON.parse(rec.gz ? await gunzipBytes(rec.gz) : rec.json);
}

export async function deleteMap(id) {
  await tx("readwrite", (st) => st.delete(id));
}

// il nome del file: il nome della mappa senza i caratteri che i sistemi non
// vogliono nei nomi dei file
export function mapFileName(name) {
  const base = (name || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 _-]+/g, "").trim().replace(/\s+/g, "-");
  return "dustveil-" + (base || "map") + MAP_EXT;
}

// lo scarica come ".dvmap"
export async function saveMapFile(map) {
  const json = JSON.stringify(map);
  const bytes = (await gzipBytes(json)) || new TextEncoder().encode(json);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = mapFileName(map.name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// la finestra per scegliere un file; il JSON letto (da convalidare), null se
// annullato, { invalid: true } se non si legge
export function openMapFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = MAP_EXT + ",.json";
    input.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(input);
    input.onchange = async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) { resolve(null); return; }
      try { resolve({ data: JSON.parse(await bytesText(new Uint8Array(await file.arrayBuffer()))) }); } catch (e) { resolve({ invalid: true }); }
    };
    input.click();
  });
}

// [§9.185] La copertina da un file d'immagine: ritagliata al centro alle
// proporzioni 3:2 e ridotta a 720 x 480 (come le foto delle mappe della
// schermaglia), WebP (JPEG dove il browser non sa scrivere WebP)
export async function makeCover(file) {
  const bmp = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = COVER_W; c.height = COVER_H;
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  const s = Math.max(COVER_W / bmp.width, COVER_H / bmp.height), w = bmp.width * s, h = bmp.height * s;
  g.drawImage(bmp, (COVER_W - w) / 2, (COVER_H - h) / 2, w, h);
  if (bmp.close) bmp.close();
  let url = c.toDataURL("image/webp", 0.8);
  if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/jpeg", 0.85);
  return url;
}
