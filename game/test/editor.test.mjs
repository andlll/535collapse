// [§9.180] L'editor di mappe, lo scheletro (editor.js): la mappa vuota nel
// formato degli scenari, la disposizione della colonna e del riquadro, la
// vista (zoom attorno al puntatore, margine fuori dalla mappa), i testi
// tradotti.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { editorLayout, hitTest, EditorView, TOOLS, ACTIONS, LABEL, DESC, EDITOR_TEXTS, VIEW_MIN, VIEW_MAX, VIEW_MARGIN,
         openLayout, TEMPLATES, mapLabel, paletteLayout, confirmLayout, brushLayout, BRUSH_WIDTHS, BRUSH_SPACING, symLayout,
         lineLayout, segDist, LINE_WIDTHS, LINE_KEY, lineKind } from "../src/editor.js";
import { EditScene, CATALOG, variantOf, SYSTEM, START, HOUSES, paletteItems, stylesOf, catalogObjects, allowedObjects,
         mirrorPoint, mirrorDelta } from "../src/editmap.js";
import { newMap, MAP_FORMAT, roomToScenario, scenarioToRoom, validateMap, testRoom, TEST_ROOM } from "../src/mapfile.js";
import { isSkirmish, SK_OPTIONS, skirmishEco } from "../src/skirmish.js";
import { mapFileName } from "../src/mapstore.js";
import { strokeOutlines, forestStep, TreeGrid, pointInPoly, polyArea, simplify } from "../src/editbrush.js";
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
    const O = openLayout(W, H, 12, 2);
    assert.equal(O.rows.length, TEMPLATES.length);
    // [§9.184] le mappe salvate a sinistra (8 righe, dalla terza), il file sotto
    assert.deepEqual(O.mine.map((q) => q.index), [2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(openLayout(W, H, 12, 99).first, 4);
    for (const q of [...O.rows, ...O.mine]) assert.ok(q.x1 >= 0 && q.x2 <= W && q.y1 > O.heads[0][1] && q.y2 <= H, `${W}x${H}`);
    for (const q of O.mine) assert.ok(q.y2 < O.file[1]);
    assert.ok(O.file[2] <= O.mine[0].x2 && O.file[0] >= O.mine[0].x1, "il file nella colonna di sinistra");
    assert.ok(openLayout(W, H, 0).file[3] < H - 246 - 20, "senza mappe, il file sopra il riquadro in basso");
    for (const q of O.mine) assert.ok(q.del[0] + q.del[2] <= q.x2 && q.del[0] - q.del[2] > q.x1 + 200);
    assert.ok(O.mine[0].x2 < O.rows[0].x1 && O.file[3] <= H && O.title[1] < O.heads[0][1]);
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
  // i prati e fiori (16 caselle) non ci stanno in una fila: si scorre
  assert.ok(paletteLayout(L.panel, CATALOG.findIndex((q) => q.key === "meadows"), 0).max > 0);
  assert.deepEqual(paletteLayout(L.panel, 0, 0).cells.map((q) => q.i), [0]);
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
  for (const n of catalogObjects()) assert.ok(objects[n], `nel catalogo ma non fra gli oggetti: ${n}`);
  // [§9.183] gli stili: l'albero con gli 8 sprite del gioco, le 25 case in
  // una casella, gli altri uno solo
  const city = paletteItems(CATALOG.find((k) => k.key === "city"), objects);
  assert.equal(city[0].styles.length, 25);
  assert.deepEqual(city[0].styles.map((q) => q.object), HOUSES);
  const trees = paletteItems(CATALOG.find((k) => k.key === "trees"), objects);
  assert.deepEqual(trees[0].styles.map((q) => q.sprite), objects.albero.choices);
  assert.equal(trees[0].styles.length, 8);
  assert.equal(paletteItems(CATALOG[1], objects)[0].styles.length, 1);
  assert.deepEqual(stylesOf({ object: "ocr_12", x: 0, y: 0 }, objects).at, HOUSES.indexOf("ocr_12"));
  assert.equal(stylesOf({ object: "albero", sprite: objects.albero.choices[3], x: 0, y: 0 }, objects).at, 3);
  assert.equal(stylesOf({ object: "albero", x: 70, y: 90 }, objects).at, variantOf(70, 90, 8)); // senza sprite: quella mostrata
  assert.equal(stylesOf({ object: "miniera_oro", x: 0, y: 0 }, objects), null);
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

// [§9.184] La simmetria: i punti gemelli e gli spostamenti a specchio
test("§9.184 simmetria: punti e spostamenti", () => {
  assert.deepEqual(mirrorPoint("diagonal", 7000, 6000, 1000, 500), [6000, 5500]);
  assert.deepEqual(mirrorPoint("horizontal", 7000, 6000, 1000, 500), [6000, 500]);
  assert.deepEqual(mirrorPoint("vertical", 7000, 6000, 1000, 500), [1000, 5500]);
  assert.equal(mirrorPoint("none", 7000, 6000, 1000, 500), null);
  assert.deepEqual(mirrorDelta("diagonal", 10, 20), [-10, -20]);
  assert.deepEqual(mirrorDelta("horizontal", 10, 20), [-10, 20]);
  assert.deepEqual(mirrorDelta("vertical", 10, 20), [10, -20]);
  assert.equal(mapFileName("Valle d'Aosta: l'ultima!"), "dustveil-Valle-dAosta-lultima.dvmap");
  assert.equal(mapFileName(""), "dustveil-map.dvmap");
});

const OBJECTS = new URL("../assets/objects.json", import.meta.url);
const MASKS = new URL("../assets/masks.json", import.meta.url);

// [§9.184] La convalida delle mappe che arrivano da fuori: i modelli (le
// cinque schermaglie) passano; oggetti fuori dal catalogo, misure, posizioni
// e varianti sbagliate no; i campi sconosciuti si perdono
test("§9.184 convalida delle mappe", { skip: !existsSync(OBJECTS) }, async () => {
  const { readdirSync } = await import("node:fs");
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8")), allowed = allowedObjects();
  const dir = new URL("../../scenari/", import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.startsWith("sk_"))) {
    const sc = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    const v = validateMap(sc, allowed, objects);
    assert.ok(v.map, `${f}: ${v.errors}`);
    assert.equal(v.map.instances.length, sc.instances.length);
    assert.deepEqual(v.map.rivers, sc.rivers || []);
    assert.deepEqual(v.map.roads, sc.roads || []);
    assert.equal(v.map.symmetry, undefined); // §9.186: la simmetria e' degli strumenti
    assert.deepEqual(v.map.cpu, { difficulty: "choice", style: "choice" }); // §9.186: a scelta del giocatore
  }
  const ok = { ...newMap(), instances: [{ object: "albero", x: 100, y: 100, sprite: objects.albero.choices[2] }],
               cpu: { difficulty: "hard", style: "static" }, symmetry: "vertical", evil: "<script>" }; // (symmetry: d'ora in poi si perde)
  const v = validateMap(ok, allowed, objects);
  assert.ok(v.map);
  assert.equal(v.map.evil, undefined);
  assert.equal(v.map.symmetry, undefined);
  assert.deepEqual(v.map.instances[0], { object: "albero", x: 100, y: 100, scale_x: 1, scale_y: 1, rotation: 0, sprite: objects.albero.choices[2] });
  assert.equal(v.map.cpu.style, "static");
  const bad = (patch) => validateMap({ ...newMap(), ...patch }, allowed, objects).errors;
  assert.ok(bad({ instances: [{ object: "enemy_cavaliere", x: 1, y: 1 }] }));
  assert.ok(bad({ instances: [{ object: "albero", x: 1e9, y: 1 }] }));
  assert.ok(bad({ instances: [{ object: "albero", x: 1, y: 1, sprite: "cr_01" }] }));
  assert.ok(bad({ width: 123 }));
  assert.ok(bad({ background: "nebbia" }));
  assert.ok(bad({ rivers: [{ pts: [[0, 0]] }] }));
  assert.ok(validateMap({ format: "altro" }, allowed, objects).errors);
  assert.ok(validateMap(null, allowed, objects).errors);
});

// [§9.184] I gemelli nella scena: al posto specchiato del centro della
// maschera, ritrovati entro 2 px; niente gemello per chi sta sull'asse
test("§9.184 simmetria: gemelli nella scena", { skip: !existsSync(OBJECTS) || !existsSync(MASKS) }, () => {
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8")), masks = JSON.parse(readFileSync(MASKS, "utf8")).sprites;
  const assets = { sprites: {}, frame: () => null, groupsOfTier: () => [] };
  const map = newMap(), D = "diagonal"; // [§9.186] la simmetria arriva dallo strumento
  const S = new EditScene({ r: null, assets, objects, masks }, map);
  const e = { object: "miniera_oro", x: 1000, y: 800, scale_x: 1, scale_y: 1, rotation: 0 };
  const t = S.twinAt(e, D), [ox, oy] = S.maskOffset(e);
  assert.ok(ox || oy, "la miniera ha una maschera");
  assert.ok(Math.abs(t.x + ox - (6000 - (e.x + ox))) <= 1 && Math.abs(t.y + oy - (6000 - (e.y + oy))) <= 1);
  S.add([e, t]);
  assert.equal(S.twinOf(e, D), t);
  assert.equal(S.twinOf(t, D), e);
  assert.deepEqual(S.withTwins([e], D), [e, t]);
  assert.deepEqual(S.withTwins([e], "none"), [e]);
  assert.equal(S.twinAt(e, "none"), null);
  // sull'asse (il centro, per la diagonale): nessun gemello
  assert.equal(S.twinAt({ object: "burst_erba1", x: 3000, y: 3000 }, D), null);
  assert.equal(S.twinOf(e, "horizontal"), null);
  assert.equal(S.twinAt({ object: "burst_erba1", x: 1000, y: 3000 }, "horizontal").x, 5000);
});

// [§9.185] Il pennello: la sagoma di una pennellata (un contorno per pezzo,
// i buchi riempiti, dentro i cerchi), il bosco a distanza minima
test("§9.185 pennello: sagome e boschi", () => {
  const dabs = [];
  for (let k = 0; k <= 20; k++) dabs.push([1000 + k * 40, 1000 + (k % 5) * 20]);
  const one = strokeOutlines(dabs, 150);
  assert.equal(one.length, 1);
  for (const [x, y] of dabs) assert.ok(pointInPoly(x, y, one[0]), "i centri dentro");
  assert.ok(!pointInPoly(1000, 1300, one[0]) && !pointInPoly(700, 1000, one[0]), "fuori dai cerchi, fuori");
  assert.ok(one[0].length < 60, "semplificata");
  assert.equal(strokeOutlines([[0, 0], [2000, 0]], 100).length, 2);
  const ring = [];
  for (let k = 0; k < 36; k++) ring.push([3000 + Math.round(500 * Math.cos(k / 36 * 2 * Math.PI)), 3000 + Math.round(500 * Math.sin(k / 36 * 2 * Math.PI))]);
  const r = strokeOutlines(ring, 120);
  assert.equal(r.length, 1);
  assert.ok(pointInPoly(3000, 3000, r[0]), "il buco riempito");
  assert.equal(strokeOutlines([], 100).length, 0);
  // [§9.186] l'ovale assonometrico: alto 0,62 volte la larghezza
  const oval = strokeOutlines([[2000, 2000]], 300, 186)[0];
  const ys = oval.map((q) => q[1]), xs = oval.map((q) => q[0]);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 600) < 40 && Math.abs(Math.max(...ys) - Math.min(...ys) - 372) < 40);
  // il bosco: mai due alberi piu' vicini della distanza
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const grid = new TreeGrid(90), pts = [];
  for (let k = 0; k < 300; k++) pts.push(...forestStep({ cx: 500, cy: 500, r: 300, ry: 186, spacing: 90, grid, rand }));
  assert.ok(pts.length > 15);
  assert.ok(pts.some((q) => Math.abs(q[0] - 500) > 250), "largo");
  for (let i = 0; i < pts.length; i++) {
    const ex = (pts[i][0] - 500) / 300, ey = (pts[i][1] - 500) / 186;
    assert.ok(ex * ex + ey * ey <= 1.02, "dentro l'ovale");
    for (let j = i + 1; j < pts.length; j++) assert.ok(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) >= 89.5);
  }
  assert.equal(forestStep({ cx: 0, cy: 0, r: 300, spacing: 90, grid: new TreeGrid(90), rand, ok: () => false }).length, 0);
  // poligoni: area, semplificazione di un quadrato con punti in mezzo ai lati
  assert.equal(Math.abs(polyArea([[0, 0], [10, 0], [10, 10], [0, 10]])), 100);
  assert.deepEqual(simplify([[0, 0], [5, 0], [10, 0], [10, 5], [10, 10], [5, 10], [0, 10], [0, 5]], 1), [[0, 0], [10, 0], [10, 10], [0, 10]]);
});

test("§9.185 il riquadro del pennello", () => {
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const L = editorLayout(W, H), B = brushLayout(L.panel), [x1, y1, x2, y2] = L.panel;
    assert.equal(B.tabs.length, 4);
    for (const q of B.tabs) assert.ok(q.x1 >= x1 && q.x2 <= x2 && q.y2 <= y2);
    for (const G of [B.width, B.density]) for (const c of [G.minus, G.plus]) assert.ok(c[0] + c[2] <= x2 && c[1] + c[2] <= y2 && c[1] - c[2] > y1 + 90);
    assert.ok(B.width.plus[0] + 20 < B.density.label[0], "larghezza e densita' non si toccano");
  }
  assert.equal(BRUSH_SPACING[3], 90); // la densita' di partenza, come il pennello bosco di Tiled
  // [§9.186] la riga della simmetria: dentro il riquadro, sotto la tavolozza e i "-" "+"
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const L = editorLayout(W, H), S = symLayout(L.panel), B = brushLayout(L.panel), P = paletteLayout(L.panel, 0, 0);
    assert.equal(S.opts.length, 4);
    for (const q of S.opts) {
      assert.ok(q.x1 > S.label[0] && q.x2 <= L.panel[2] && q.y2 < L.panel[3] - 20, `${W}x${H}`);
      assert.ok(q.y1 > B.width.minus[1] + B.width.minus[2] && q.y1 > P.cells[0].y2);
      assert.ok(q.y2 + 30 <= L.panel[3] - 14, "sopra la riga dei comandi della vista (in basso, alta ~20)");
    }
  }
  assert.ok(BRUSH_WIDTHS.includes(600));
});

// [§9.185] la copertina nella convalida: WebP o JPEG in base64, non troppo grande
test("§9.185 la copertina", { skip: !existsSync(OBJECTS) }, () => {
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8")), allowed = allowedObjects();
  const ok = validateMap({ ...newMap(), cover: "data:image/webp;base64,UklGRg==" }, allowed, objects);
  assert.equal(ok.map.cover, "data:image/webp;base64,UklGRg==");
  assert.equal(validateMap(newMap(), allowed, objects).map.cover, undefined);
  for (const cover of ["data:image/svg+xml;base64,PHN2Zz4=", "javascript:alert(1)", "data:image/png;base64,iVBORw==", 12,
                       "data:image/jpeg;base64," + "A".repeat(800000), "data:image/jpeg;base64,AB C"]) {
    assert.ok(validateMap({ ...newMap(), cover }, allowed, objects).errors, String(cover).slice(0, 30));
  }
});

// [§9.185] le forme (macchie) con annulla e ripeti, e una pennellata = un passo
test("§9.185 forme e gruppi con annulla", { skip: !existsSync(OBJECTS) || !existsSync(MASKS) }, () => {
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8")), masks = JSON.parse(readFileSync(MASKS, "utf8")).sprites;
  const assets = { sprites: {}, frame: () => null, groupsOfTier: () => [] };
  const map = newMap();
  const S = new EditScene({ r: null, assets, objects, masks }, map);
  S.ground = { reset() { S.resets = (S.resets || 0) + 1; }, free() {} };
  const [p1] = S.addFeatures("patches", [{ pts: [[0, 0], [400, 0], [400, 300]], bg: "city2", feather: 40 }]);
  assert.equal(map.patches.length, 1);
  assert.equal(S.world.patches.length, 1, "la geometria del gioco rifatta");
  assert.ok(S.resets >= 1, "il suolo si ricuoce");
  S.removeFeatures("patches", [p1]);
  assert.equal(map.patches.length, 0);
  S.undo();
  assert.deepEqual(map.patches[0].pts, [[0, 0], [400, 0], [400, 300]]);
  S.undo();
  assert.equal(map.patches.length, 0);
  S.redo();
  assert.equal(map.patches.length, 1);
  // una pennellata: tanti add in un gruppo, un annulla solo
  const before = S.undoList.length;
  S.begin();
  for (let k = 0; k < 5; k++) S.add([{ object: "albero", x: 1000 + k * 100, y: 1000, scale_x: 1, scale_y: 1, rotation: 0, sprite: "alb1" }]);
  S.end();
  assert.equal(S.undoList.length, before + 1);
  assert.equal(S.trees().length, 5);
  S.undo();
  assert.equal(S.trees().length, 0);
  // dove un albero non sta: sulla miniera si', a meta' mappa no
  S.add([{ object: "miniera_oro", x: 3000, y: 3000, scale_x: 1, scale_y: 1, rotation: 0 }]);
  assert.ok(S.blocks(3000, 3000));
  assert.ok(!S.blocks(1000, 4000));
});

// [§9.187] La polilinea: il riquadro, la distanza da un tratto, il tipo di
// una linea; la conferma a tre pulsanti
test("§9.187 polilinea e avviso", () => {
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const L = editorLayout(W, H), B = lineLayout(L.panel), S = symLayout(L.panel);
    assert.equal(B.tabs.length, 3);
    for (const q of B.tabs) assert.ok(q.x1 >= L.panel[0] && q.x2 <= L.panel[2]);
    for (const c of [B.width.minus, B.width.plus, B.end.minus, B.end.plus]) assert.ok(c[1] + c[2] < S.opts[0].y1 && c[0] + c[2] <= L.panel[2]);
    const C = confirmLayout(W, H, 3);
    assert.equal(C.buttons.length, 3);
    for (let k = 1; k < 3; k++) assert.ok(C.buttons[k][0] > C.buttons[k - 1][2]);
    assert.ok(C.buttons[0][0] >= 0 && C.buttons[2][2] <= W);
  }
  assert.deepEqual(segDist(5, 5, [0, 0], [10, 0]), [5, 5, 0]);
  assert.deepEqual(segDist(-5, 0, [0, 0], [10, 0]), [5, 0, 0]);
  assert.ok(LINE_WIDTHS.includes(150) && LINE_WIDTHS.includes(110)); // di partenza: fiumi 150, strade 110 (tools/tiledkit.py)
  assert.equal(LINE_KEY.river, "rivers");
  assert.equal(lineKind("roads", { kind: 2 }), "road2");
  assert.equal(lineKind("roads", {}), "road1");
  assert.equal(lineKind("rivers", {}), "river");
});

// [§9.187] le linee: modifica dei punti con annulla, la gemella specchiata
test("§9.187 linee: modifiche e gemelle", { skip: !existsSync(OBJECTS) || !existsSync(MASKS) }, () => {
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8")), masks = JSON.parse(readFileSync(MASKS, "utf8")).sprites;
  const assets = { sprites: {}, frame: () => null, groupsOfTier: () => [] };
  const map = newMap();
  const S = new EditScene({ r: null, assets, objects, masks }, map);
  S.ground = { reset() {}, free() {} };
  const a = { pts: [[100, 100], [900, 400], [1500, 300]], width: 150 };
  const b = { pts: a.pts.map(([x, y]) => [6000 - x, 6000 - y]), width: 150 };
  S.addFeatures("rivers", [a, b]);
  assert.equal(S.world.rivers.length, 2, "il motore ha i due fiumi");
  assert.equal(S.twinLine("rivers", a, "diagonal"), b);
  assert.equal(S.twinLine("rivers", a, "horizontal"), null);
  assert.equal(S.twinLine("rivers", a, "none"), null);
  S.modifyFeatures("rivers", [a], (f) => ({ pts: f.pts.map(([x, y]) => [x + 10, y]), widthEnd: 80 }));
  assert.deepEqual(a.pts[0], [110, 100]);
  assert.equal(a.widthEnd, 80);
  S.undo();
  assert.deepEqual(a.pts[0], [100, 100]);
  assert.equal(a.widthEnd, undefined);
  S.addFeatures("roads", [{ pts: [[0, 0], [500, 0]], width: 110, kind: 2 }]);
  assert.equal(S.world.roads.length, 1);
  S.removeFeatures("rivers", [a, b]);
  assert.equal(S.world.rivers.length, 0);
});

// [§9.188] "Prova mappa": la room di prova (col manager, senza copertina) e
// la schermaglia che la riconosce; la CPU statica ha un nome
test("§9.188 la room di prova", () => {
  const map = { ...newMap(), cover: "data:image/webp;base64,UklGRg==",
                instances: [{ object: "centro", x: 1000, y: 1000, scale_x: 1, scale_y: 1, rotation: 0 },
                            { object: "centro", x: 5000, y: 5000, scale_x: 1, scale_y: 1, rotation: 0 }] };
  const room = testRoom(map);
  assert.equal(room.name, TEST_ROOM);
  assert.equal(room.instances.length, 3);
  assert.deepEqual(room.instances[0].slice(0, 3), ["manager", 100, 100]);
  assert.equal(room.cover, undefined);
  assert.equal(room.backgrounds[0].name, "green1");
  // col manager gia' nella mappa (i modelli) non se ne aggiunge un altro
  const withManager = testRoom({ ...map, instances: [{ object: "manager", x: 50, y: 50, scale_x: 1, scale_y: 1, rotation: 0 }, ...map.instances] });
  assert.equal(withManager.instances.filter((e) => e[0] === "manager").length, 1);
  assert.ok(isSkirmish(TEST_ROOM) && isSkirmish("sk_padus") && !isSkirmish("lvl01"));
  assert.equal(SK_OPTIONS.style.names.static, "Static");
  assert.ok(!SK_OPTIONS.style.values.includes("static"), "non fra le scelte della schermata della schermaglia");
});

// [§9.189] la CPU statica ha la regia, passiva (economy.js: solo la difesa),
// coi lavoratori di partenza come le altre
test("§9.189 la CPU statica: la regia passiva", () => {
  const sk = { difficulty: "normal", resources: "normal", pop: 75 };
  const st = skirmishEco({ ...sk, style: "static" }), bal = skirmishEco({ ...sk, style: "balanced" });
  assert.equal(st.passive, true);
  assert.equal(bal.passive, false);
  assert.equal(st.startWorkers, 3);
  assert.deepEqual(st.start, bal.start);
});
