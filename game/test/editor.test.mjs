// [§9.180] L'editor di mappe, lo scheletro (editor.js): la mappa vuota nel
// formato degli scenari, la disposizione della colonna e del riquadro, la
// vista (zoom attorno al puntatore, margine fuori dalla mappa), i testi
// tradotti.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { editorLayout, hitTest, EditorView, TOOLS, ACTIONS, LABEL, DESC, EDITOR_TEXTS, VIEW_MIN, VIEW_MAX, VIEW_MARGIN,
         openLayout, TEMPLATES, mapLabel, paletteLayout, confirmLayout } from "../src/editor.js";
import { EditScene, CATALOG, variantOf, SYSTEM, START } from "../src/editmap.js";
import { newMap, MAP_FORMAT, roomToScenario, scenarioToRoom } from "../src/mapfile.js";
import { lodFor } from "../src/ground.js";
import { setLanguage } from "../src/i18n.js";
import { TEXTS } from "../src/texts.js";

test("§9.180 la mappa vuota e' uno scenario come quelli di tools/12", () => {
  const m = newMap();
  const sc = JSON.parse(readFileSync(new URL("../../scenari/sk_padus.json", import.meta.url), "utf8"));
  assert.equal(m.format, MAP_FORMAT);
  assert.equal(m.format, sc.format);
  assert.equal(m.version, sc.version);
  for (const k of ["name", "width", "height", "background", "colour", "view", "instances"]) assert.ok(k in m, k);
  assert.deepEqual(Object.keys(m.view), Object.keys(sc.view));
  assert.equal(m.width, 6000);
  assert.equal(m.background, "green1");
  assert.deepEqual(newMap({ width: 4000, height: 7000 }).height, 7000);
});

test("§9.180 la colonna e il riquadro stanno nella finestra e non si toccano", () => {
  for (const [W, H] of [[1920, 1080], [1600, 900], [1280, 720], [1024, 600]]) {
    const L = editorLayout(W, H);
    const [x1, y1, x2, y2] = L.col;
    assert.ok(x1 >= 0 && y1 >= 0 && x2 < W && y2 <= H, `colonna ${W}x${H}`);
    assert.equal(L.buttons.length, TOOLS.length + ACTIONS.length);
    assert.deepEqual(L.buttons.map((b) => b.key), [...TOOLS, ...ACTIONS]);
    for (const b of L.buttons) assert.ok(b.y - b.r >= y1 && b.y + b.r <= y2, `${b.key} dentro la colonna`);
    for (let k = 1; k < L.buttons.length; k++) assert.ok(L.buttons[k].y - L.buttons[k].r > L.buttons[k - 1].y + L.buttons[k - 1].r);
    // gli strumenti e le azioni staccati piu' dei pulsanti fra loro
    const gap = (k) => L.buttons[k].y - L.buttons[k - 1].y;
    assert.ok(gap(TOOLS.length) > gap(1) + 10);
    const [p1, q1, p2, q2] = L.panel;
    assert.ok(p1 > x2 && p2 <= W && q2 <= H && q1 > 0, `riquadro ${W}x${H}`);
    assert.ok(L.back[0] + L.back[2] <= W);
  }
});

test("§9.180 cosa c'e' sotto il puntatore", () => {
  const L = editorLayout(1600, 900);
  for (const b of L.buttons) assert.equal(hitTest(L, b.x, b.y).key, b.key);
  assert.equal(hitTest(L, L.back[0], L.back[1]).kind, "back");
  assert.equal(hitTest(L, (L.panel[0] + L.panel[2]) / 2, (L.panel[1] + L.panel[3]) / 2).kind, "ui");
  assert.equal(hitTest(L, 800, 400), null);
});

test("§9.180 la vista: zoom attorno al puntatore, limiti, margine", () => {
  const v = new EditorView(6000, 6000);
  v.resize(1600, 900);
  v.centre(3000, 3000);
  const before = v.toRoom(400, 300);
  v.zoomAt(v.scale * 1.15, 400, 300);
  const after = v.toRoom(400, 300);
  assert.ok(Math.abs(before[0] - after[0]) < 1e-6 && Math.abs(before[1] - after[1]) < 1e-6);
  v.zoomAt(100, 0, 0);
  assert.equal(v.scale, VIEW_MAX);
  v.zoomAt(0.01, 0, 0);
  assert.equal(v.scale, VIEW_MIN);
  v.pan(-1e6, -1e6);
  assert.equal(v.x, -VIEW_MARGIN);
  assert.equal(v.y, -VIEW_MARGIN);
  v.pan(1e6, 1e6);
  assert.equal(v.x + v.w, 6000 + VIEW_MARGIN);
  // una mappa piu' piccola della vista: centrata
  const s = new EditorView(1000, 800);
  s.resize(1600, 900);
  s.zoomAt(VIEW_MAX, 0, 0);
  assert.equal(s.x + s.w / 2, 500);
  assert.equal(s.y + s.h / 2, 400);
});

test("§9.180 testi dell'editor tradotti", () => {
  assert.equal(Object.keys(LABEL).length, TOOLS.length + ACTIONS.length);
  for (const t of TOOLS) assert.ok(DESC[t], t);
  for (const k of EDITOR_TEXTS) assert.ok(TEXTS[k], k);
  const src = readFileSync(new URL("../src/editor.js", import.meta.url), "utf8");
  for (const m of src.matchAll(/\btr\(\s*"((?:[^"\\]|\\.)*)"/g)) assert.ok(TEXTS[m[1]], m[1]);
});

// [§9.181] scenario -> room (come tools/07_scene.py) -> scenario: gli
// scenari di scenari/ tornano uguali (istanze, gruppi, fiumi, strade, ponti,
// macchie, percorsi), e la room ha la forma di quelle di tools/07
test("§9.181 scenario e room: andata e ritorno", async () => {
  const { readdirSync } = await import("node:fs");
  const dir = new URL("../../scenari/", import.meta.url);
  const names = readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(names.length >= 10);
  for (const f of names) {
    const sc = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    const room = scenarioToRoom(sc);
    assert.equal(room.instances.length, sc.instances.length, f);
    assert.deepEqual(room.views[0].xview, sc.view.x);
    assert.equal(room.instances[0].length, sc.instances[0].group ? 8 : 7);
    const back = roomToScenario(room);
    for (const k of ["name", "width", "height", "background", "colour", "view"]) assert.deepEqual(back[k], sc[k], `${f}: ${k}`);
    const strip = (i) => { const o = { ...i }; delete o.sprite; return o; }; // (la variante non arriva alla room: tools/07)
    assert.deepEqual(back.instances, sc.instances.map(strip), f);
    for (const k of ["roads", "rivers", "bridges", "patches", "paths"]) assert.deepEqual(back[k], sc[k] || [], `${f}: ${k}`);
  }
});

// [§9.182, decisione dell'autore] "Apri mappa": solo le mappe della
// schermaglia, come modelli (niente tutorial ne' livelli della campagna)
test("§9.182 Apri mappa: le cinque schermaglie come modelli", () => {
  assert.deepEqual(TEMPLATES, ["sk_padus", "sk_silva", "sk_rivo", "sk_urbs", "sk_bardonis"]);
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const O = openLayout(W, H);
    assert.equal(O.rows.length, TEMPLATES.length);
    for (const q of O.rows) assert.ok(q.x1 >= 0 && q.x2 <= W && q.y1 > O.sub[1] && q.y2 <= H, `${q.room} ${W}x${H}`);
    const C = confirmLayout(W, H);
    assert.ok(C.yes[2] < C.no[0] && C.no[2] <= W && C.yes[3] <= H);
  }
  setLanguage("it");
  assert.equal(mapLabel("sk_padus"), "Padania");
  setLanguage("en");
});

// [§9.182] la tavolozza: schede dentro il riquadro, caselle fra le frecce,
// lo scorrimento limitato
test("§9.182 la tavolozza di Inserisci", () => {
  const L = editorLayout(1600, 900), [x1, y1, x2, y2] = L.panel;
  CATALOG.forEach((cat, k) => {
    const P = paletteLayout(L.panel, k, 0);
    assert.equal(P.tabs.length, CATALOG.length);
    for (const q of [...P.tabs, ...P.cells]) assert.ok(q.x1 >= x1 && q.x2 <= x2 && q.y1 >= y1 + 54 && q.y2 <= y2, `${cat.key}`);
    assert.equal(P.cells.length, Math.min(P.per, cat.objects.length));
    assert.equal(P.max, Math.max(0, cat.objects.length - P.per));
    assert.ok(!P.prev && (P.max > 0) === !!P.next);
    const end = paletteLayout(L.panel, k, 999);
    assert.equal(end.scroll, end.max);
    if (end.max) assert.ok(end.prev && !end.next);
  });
  // la citta' (34 oggetti) non ci sta in una fila: si scorre
  assert.ok(paletteLayout(L.panel, CATALOG.findIndex((q) => q.key === "city"), 0).max > 0);
  assert.deepEqual(CATALOG[0].objects, [START]);
});

test("§9.181 varianti fisse e livelli di dettaglio del suolo", () => {
  for (let k = 0; k < 50; k++) {
    const v = variantOf(k * 137.5, k * 91, 8);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 8);
    assert.equal(v, variantOf(k * 137.5, k * 91, 8));
  }
  assert.deepEqual([0.5, 1, 1.9, 2, 3.9, 4, 7, 8, 100].map(lodFor), [1, 1, 1, 2, 2, 4, 4, 8, 16]);
});

// [§9.182] Le modifiche della scena e annulla/ripeti, con gli oggetti veri
// (game/assets/objects.json, scritto da tools/07: la CI lo fa prima delle
// prove) e una scena senza sprite (niente atlas in node)
test("§9.182 modifiche, annulla e ripeti", { skip: !existsSync(new URL("../assets/objects.json", import.meta.url)) }, () => {
  const objects = JSON.parse(readFileSync(new URL("../assets/objects.json", import.meta.url), "utf8"));
  for (const k of CATALOG) for (const n of k.objects) assert.ok(objects[n], `nel catalogo ma non fra gli oggetti: ${n}`);
  const assets = { sprites: {}, frame: () => null, groupsOfTier: () => [] };
  const map = newMap();
  map.instances.push({ object: "manager", x: 100, y: 100, scale_x: 1, scale_y: 1, rotation: 0 },
                     { object: "albero", x: 500, y: 500, scale_x: 1, scale_y: 1, rotation: 0 });
  const S = new EditScene({ r: null, assets, objects, masks: {} }, map);
  const alive = () => S.world.instances.filter((i) => i.alive && i.src).length;
  assert.equal(alive(), 2);
  assert.equal(S.version, 0);
  const [a, b] = S.add([{ object: "miniera_oro", x: 900, y: 900, scale_x: 1, scale_y: 1, rotation: 0 },
                        { object: "burst_erba1", x: 1500, y: 1500, scale_x: 1, scale_y: 1, rotation: 0 }]);
  assert.equal(map.instances.length, 4);
  assert.ok(S.instOf(b).grass_rows.length > 0, "la macchia ha le sue particelle");
  const systems = S.world.particles.systems.length;
  S.modify([a], (e) => ({ x: e.x + 100, scale_x: -1 }));
  assert.equal(S.instOf(a).x, 1000);
  assert.equal(S.instOf(a).image_xscale, -1);
  assert.equal(S.instOf(a).depth, -900);
  S.remove([b, map.instances[1]]);
  assert.deepEqual(map.instances.map((e) => e.object), ["manager", "miniera_oro"]);
  assert.ok(S.world.particles.systems.filter((q) => q.alive !== false).length < systems, "via le particelle della macchia");
  // annulla: tornano al loro posto, nell'ordine di prima
  S.undo();
  assert.deepEqual(map.instances.map((e) => e.object), ["manager", "albero", "miniera_oro", "burst_erba1"]);
  S.undo();
  assert.equal(a.x, 900);
  assert.equal(S.instOf(a).image_xscale, 1);
  S.undo();
  assert.equal(map.instances.length, 2);
  assert.equal(alive(), 2);
  S.redo(); S.redo(); S.redo();
  assert.deepEqual(map.instances.map((e) => e.object), ["manager", "miniera_oro"]);
  assert.equal(a.x, 1000);
  // la scelta: il manager non si prende, le macchie dal centro
  assert.ok(SYSTEM.has("manager"));
  assert.equal(S.pick(100, 100, 20), null);
  assert.deepEqual(S.inBox(0, 0, 2000, 2000), [a]);
  assert.equal(S.starts(), 0);
  assert.ok(S.version > 0);
});
