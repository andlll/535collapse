// [§9.98] Estensione di Tiled del kit (tools/11_tiled_kit.py la copia in
// extensions/ accanto a 535.tiled-project, con rivers.mjs, il codice del
// gioco: game/src/rivers.js). Tiled la carica da sola aprendo il progetto.
//
// Tiled disegna le polilinee tutte sottili: questa estensione mostra fiumi e
// strade larghi come in partita. Il comando "Anteprima larghezze" (menu Map,
// Ctrl+Shift+L) rifa' il livello bloccato `anteprima` con le sagome:
// - fiumi (livello fiumi, classe fiume): le rive come nel gioco (larghezza,
//   larghezza_fine, linea ammorbidita, schiacciata come il suolo, curve
//   strette, punta alle estremita');
// - strade (livello strade, classi strada1 e strada2): la fascia dei
//   sassolini, larghezza e larghezza_fine.
// Con "Anteprima a ogni salvataggio" (stesso menu, acceso all'inizio) si
// rifa' da sola quando salvi. L'import (tools/12_tiled_import.py) ignora il
// livello `anteprima`: non finisce mai nel gioco.

import { riverGeometry, roadOutline } from "./rivers.mjs";

const LAYER = "anteprima";
const RIVER_LAYER = "fiumi", ROAD_LAYER = "strade";
const ROAD_CLASSES = { strada1: 1, strada2: 2 };
const RIVER_WIDTH = 150, ROAD_WIDTH = 110; // come tools/tiledkit.py
const EVERY = 2; // un punto ogni due della linea ammorbidita (ogni ~20 px)

const classOf = (o) => o.className || o.type || "";

function prop(o, name, def) {
  const v = typeof o.resolvedProperty === "function" ? o.resolvedProperty(name) : o.property(name);
  return v === undefined || v === null || v === "" ? def : Number(v);
}

// I punti della polilinea in coordinate della mappa (rotazione di Tiled,
// oraria, attorno all'origine dell'oggetto), come l'import
function points(o) {
  const t = (o.rotation || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return o.polygon.map((p) => [o.x + p.x * c - p.y * s, o.y + p.x * s + p.y * c]);
}

function* objects(layer) {
  if (layer.isGroupLayer) {
    for (let i = 0; i < layer.layerCount; i++) yield* objects(layer.layerAt(i));
  } else if (layer.isObjectLayer && layer.name !== LAYER) {
    for (const o of layer.objects) yield [layer.name, o];
  }
}

// Le sagome da disegnare: [classe dell'anteprima, punti del contorno]
export function shapes(map) {
  const room = [map.width * map.tileWidth, map.height * map.tileHeight], out = [];
  for (let i = 0; i < map.layerCount; i++) {
    for (const [lname, o] of objects(map.layerAt(i))) {
      if (o.shape !== MapObject.Polyline || !o.polygon || o.polygon.length < 2) continue;
      const cls = classOf(o);
      if (lname === RIVER_LAYER || cls === "fiume") {
        const w0 = prop(o, "larghezza", RIVER_WIDTH);
        const g = riverGeometry({ pts: points(o), width: w0, widthEnd: prop(o, "larghezza_fine", w0), room });
        out.push(["anteprima_fiume", outline(g)]);
      } else if (lname === ROAD_LAYER || cls in ROAD_CLASSES) {
        const w0 = prop(o, "larghezza", ROAD_WIDTH);
        const g = roadOutline({ pts: points(o), width: w0, widthEnd: prop(o, "larghezza_fine", w0) });
        out.push([cls === "strada2" ? "anteprima_strada2" : "anteprima_strada1", outline(g)]);
      }
    }
  }
  return out;
}

// riva sinistra all'andata, destra al ritorno
function outline({ L, R }) {
  const pick = (E) => E.filter((_, k) => k % EVERY === 0 || k === E.length - 1);
  return [...pick(L), ...pick(R).reverse()].map((p) => [p.x, p.y]);
}

export function refresh(map) {
  if (!map || !map.isTileMap) return false;
  const list = shapes(map);
  map.macro("Anteprima larghezze", () => {
    for (let i = map.layerCount - 1; i >= 0; i--) if (map.layerAt(i).name === LAYER) map.removeLayerAt(i);
    if (!list.length) return;
    const layer = new ObjectGroup(LAYER);
    layer.opacity = 0.55;
    for (const [cls, pts] of list) {
      const o = new MapObject(MapObject.Polygon, "");
      // coordinate relative al primo punto
      const [x0, y0] = pts[0];
      o.x = x0; o.y = y0;
      o.polygon = pts.map(([x, y]) => (typeof Qt !== "undefined" ? Qt.point(x - x0, y - y0) : { x: x - x0, y: y - y0 }));
      if ("className" in o) o.className = cls; else o.type = cls;
      layer.addObject(o);
    }
    // sotto il livello strade (o in fondo), bloccata: non si sposta per sbaglio
    let at = 0;
    for (let i = 0; i < map.layerCount; i++) if (map.layerAt(i).name === ROAD_LAYER) at = i;
    map.insertLayerAt(at, layer);
    layer.locked = true;
  });
  return true;
}

if (typeof tiled !== "undefined") {
  const now = tiled.registerAction("AnteprimaLarghezze", () => {
    if (!refresh(tiled.activeAsset)) tiled.alert("Apri una mappa per l'anteprima di fiumi e strade.");
  });
  now.text = "Anteprima larghezze (fiumi e strade)";
  now.shortcut = "Ctrl+Shift+L";
  const auto = tiled.registerAction("AnteprimaAlSalvataggio", () => {});
  auto.text = "Anteprima a ogni salvataggio";
  auto.checkable = true;
  auto.checked = true;
  tiled.extendMenu("Map", [{ separator: true }, { action: "AnteprimaLarghezze" }, { action: "AnteprimaAlSalvataggio" }]);
  tiled.assetAboutToBeSaved.connect((asset) => { if (auto.checked && asset.isTileMap) refresh(asset); });
}
