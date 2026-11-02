// [§9.98] L'estensione di Tiled del kit (tools/tiled/anteprima.mjs) con le
// API di Tiled finte: legge le polilinee di fiumi e strade (anche ruotate,
// con le proprieta'), rifa' il livello `anteprima` bloccato sotto `strade`
// con le sagome del gioco (rivers.js), e rifatto non si raddoppia.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { riverGeometry, roadOutline } from "../src/rivers.js";

const root = fileURLToPath(new URL("../..", import.meta.url));

// le API di Tiled che l'estensione usa
class MapObject {
  constructor(shape = 0, name = "") { Object.assign(this, { shape, name, x: 0, y: 0, rotation: 0, polygon: [], className: "", props: {} }); }
  resolvedProperty(n) { return this.props[n]; }
  property(n) { return this.props[n]; }
}
MapObject.Rectangle = 0; MapObject.Polygon = 1; MapObject.Polyline = 2;
class ObjectGroup {
  constructor(name) { Object.assign(this, { name, objects: [], isObjectLayer: true, isGroupLayer: false, locked: false, opacity: 1 }); }
  addObject(o) { this.objects.push(o); }
}
globalThis.MapObject = MapObject;
globalThis.ObjectGroup = ObjectGroup;

function fakeMap(layers) {
  return {
    isTileMap: true, width: 120, height: 120, tileWidth: 50, tileHeight: 50, layers,
    get layerCount() { return this.layers.length; },
    layerAt(i) { return this.layers[i]; },
    removeLayerAt(i) { this.layers.splice(i, 1); },
    insertLayerAt(i, l) { this.layers.splice(i, 0, l); },
    macro(_, fn) { fn(); },
  };
}

function polyline(cls, x, y, pts, props, rotation = 0) {
  const o = new MapObject(MapObject.Polyline);
  Object.assign(o, { className: cls, x, y, rotation, polygon: pts.map(([px, py]) => ({ x: px, y: py })), props });
  return o;
}

test("§9.98 anteprima di Tiled: sagome di fiumi e strade come nel gioco", async () => {
  const dir = mkdtempSync(join(tmpdir(), "anteprima-"));
  copyFileSync(join(root, "tools/tiled/anteprima.mjs"), join(dir, "anteprima.mjs"));
  copyFileSync(join(root, "game/src/rivers.js"), join(dir, "rivers.mjs"));
  const { refresh, shapes } = await import(join(dir, "anteprima.mjs"));

  const strade = new ObjectGroup("strade"), fiumi = new ObjectGroup("fiumi"), oggetti = new ObjectGroup("oggetti");
  strade.addObject(polyline("strada2", 1000, 2000, [[0, 0], [600, 100], [1200, 0]], { larghezza: 80, larghezza_fine: 160 }));
  fiumi.addObject(polyline("fiume", 500, 1000, [[0, 0], [400, 120], [800, -40]], { larghezza: 180, larghezza_fine: 100 }));
  fiumi.addObject(polyline("fiume", 3000, 3000, [[0, 0], [500, 0]], {}, 90)); // ruotata: va in giu'
  const rect = new MapObject(MapObject.Rectangle); rect.className = "ponte"; fiumi.addObject(rect);
  const map = fakeMap([new ObjectGroup("suolo"), strade, fiumi, oggetti]);

  assert.ok(refresh(map));
  const a = map.layers.find((l) => l.name === "anteprima");
  assert.ok(a && a.locked, "livello anteprima bloccato");
  assert.equal(map.layers.indexOf(a), 1, "sotto il livello strade");
  assert.deepEqual(a.objects.map((o) => o.className), ["anteprima_strada2", "anteprima_fiume", "anteprima_fiume"]);

  // la sagoma del fiume: le rive di riverGeometry (con la stanza 6000x6000)
  const g = riverGeometry({ pts: [[500, 1000], [900, 1120], [1300, 960]], width: 180, widthEnd: 100, room: [6000, 6000] });
  const river = a.objects[1], abs = river.polygon.map((p) => [p.x + river.x, p.y + river.y]);
  const ys = abs.map((p) => p[1]), gy = [...g.L, ...g.R].map((p) => p.y);
  // (l'anteprima tiene un punto ogni due: gli estremi entro 3 px)
  assert.ok(Math.abs(Math.min(...ys) - Math.min(...gy)) < 3 && Math.abs(Math.max(...ys) - Math.max(...gy)) < 3,
            `rive ${Math.min(...ys)}-${Math.max(...ys)} contro ${Math.min(...gy)}-${Math.max(...gy)}`);
  // la strada si allarga verso la fine come roadOutline
  const r = roadOutline({ pts: [[1000, 2000], [1600, 2100], [2200, 2000]], width: 80, widthEnd: 160 });
  const n = r.L.length, span = (k) => Math.hypot(r.L[k].x - r.R[k].x, (r.L[k].y - r.R[k].y) / 0.62);
  assert.ok(Math.abs(span(0) - 80) < 1 && Math.abs(span(n - 1) - 160) < 1);
  // ruotata di 90 gradi: il fiume scende da (3000, 3000) a (3000, 3500)
  const rot = a.objects[2], rx = rot.polygon.map((p) => p.x + rot.x), ry = rot.polygon.map((p) => p.y + rot.y);
  assert.ok(Math.max(...ry) > 3400 && Math.max(...rx) - Math.min(...rx) < 200);

  // rifatta: sempre un solo livello anteprima, con le stesse sagome
  refresh(map);
  assert.equal(map.layers.filter((l) => l.name === "anteprima").length, 1);
  assert.equal(shapes(map).length, 3, "il livello anteprima non si conta");
});
