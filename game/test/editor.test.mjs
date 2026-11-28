// [§9.180] L'editor di mappe, lo scheletro (editor.js): la mappa vuota nel
// formato degli scenari, la disposizione della colonna e del riquadro, la
// vista (zoom attorno al puntatore, margine fuori dalla mappa), i testi
// tradotti.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { editorLayout, hitTest, EditorView, TOOLS, ACTIONS, EDITS, LABEL, DESC, EDITOR_TEXTS, VIEW_MIN, VIEW_MAX, VIEW_MARGIN,
         openLayout, TEMPLATES, mapLabel, paletteLayout, confirmLayout, brushLayout, BRUSH_WIDTHS, BRUSH_SPACING, symLayout,
         lineLayout, segDist, LINE_WIDTHS, LINE_KEY, lineKind, fogLayout, fogValue } from "../src/editor.js";
import { EditScene, CATALOG, variantOf, SYSTEM, START, HOUSES, paletteItems, stylesOf, catalogObjects, allowedObjects,
         mirrorPoint, mirrorDelta, freePluses, wallStep, wallPluses, GATE_SWAP, sideLook, paletteCount } from "../src/editmap.js";
import { newMap, MAP_FORMAT, roomToScenario, scenarioToRoom, validateMap, testRoom, TEST_ROOM, sidesOk, redStart, assignSides,
         startsOf, mapHash, UNITS, BUILDINGS, BLUE_OF, sha256, lockOf, lockOpens, isStart, HALL, HOME_STYLES, blueHome,
         FOG_SETTINGS, FOG_DEFAULTS, fogOf, fogDiff } from "../src/mapfile.js";
import { isSkirmish, SK_OPTIONS, skirmishEco, skirmishPrepare, MIST } from "../src/skirmish.js";
import { splitGroups } from "../src/scenario.js";
import { mapFileName } from "../src/mapstore.js";
import { strokeOutlines, forestStep, TreeGrid, pointInPoly, polyArea, simplify } from "../src/editbrush.js";
import { lodFor } from "../src/ground.js";
import { riverGeometry, ISO } from "../src/rivers.js";
import { fogSight, FOG_SIGHT } from "../src/enemies.js";
import { fogDensity, BANK } from "../src/stealth.js";
import { skForMap, fixedBy } from "../src/skuser.js";
import { roomLabel } from "../src/menu.js";
import { setLanguage } from "../src/i18n.js";
import { TEXTS } from "../src/texts.js";

test("§9.180 la mappa vuota e' uno scenario come quelli di tools/12", () => {
  const m = newMap();
  const sc = JSON.parse(readFileSync(new URL("../../scenari/sk_padus.json", import.meta.url), "utf8"));
  assert.equal(m.format, MAP_FORMAT);
  assert.equal(m.format, sc.format);
  // ([§9.232] le mappe nuove sono della versione 2: la partenza e' solo la
  // vista; gli scenari del gioco restano della 1, partenza e centro insieme)
  assert.equal(m.version, 2);
  assert.equal(sc.version, 1);
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
    assert.equal(L.buttons.length, TOOLS.length + EDITS.length + ACTIONS.length); // §9.195: i comandi in mezzo
    assert.deepEqual(L.buttons.map((b) => b.key), [...TOOLS, ...EDITS, ...ACTIONS]);
    for (const b of L.buttons) if (!b.hidden) assert.ok(b.y - b.r >= y1 && b.y + b.r <= y2, `${b.key} dentro la colonna`); // §9.196: quelli che si vedono
    for (let k = 1; k < L.buttons.length; k++) assert.ok(L.buttons[k].y - L.buttons[k].r > L.buttons[k - 1].y + L.buttons[k - 1].r);
    // gli strumenti e le azioni staccati piu' dei pulsanti fra loro
    const gap = (k) => L.buttons[k].y - L.buttons[k - 1].y;
    assert.ok(gap(TOOLS.length) > gap(1) + 10);
    assert.ok(gap(TOOLS.length + EDITS.length) > gap(1) + 10);
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
  assert.equal(Object.keys(LABEL).length, TOOLS.length + EDITS.length + ACTIONS.length);
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
    const n = paletteItems(cat, {}).length; // (§9.191: le partenze, una casella per parte)
    assert.equal(P.cells.length, Math.min(P.per, n));
    assert.equal(P.max, Math.max(0, n - P.per));
    assert.ok(!P.prev && (P.max > 0) === !!P.next);
    const end = paletteLayout(L.panel, k, 999);
    assert.equal(end.scroll, end.max);
    if (end.max) assert.ok(end.prev && !end.next);
  });
  // gli edifici (11 caselle per parte, 22) non ci stanno in una fila: si
  // scorre (§9.222: prima i prati e fiori, la scheda "Natura" non c'e' piu')
  assert.ok(paletteLayout(L.panel, CATALOG.findIndex((q) => q.key === "buildings"), 0).max > 0);
  assert.deepEqual(paletteLayout(L.panel, 0, 0).cells.map((q) => q.i), [0, 1, 2, 3]); // §9.191: la partenza rossa e la blu (§9.222: poi le due nebbie)
  assert.deepEqual(CATALOG[0].objects, [START, "sk_nebbia", "nebbia_banco"]); // (§9.222: la nebbia in "Regia")
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
    // ([§9.232] della versione 1: un municipio sotto ogni partenza)
    const cc = sc.instances.filter((e) => e.object === "centro");
    assert.equal(v.map.instances.length, sc.instances.length + cc.length);
    assert.equal(v.map.instances.filter((e) => e.object === "centro" && e.hall).length, cc.length);
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
    assert.equal(B.tabs.length, 6); // (§9.216: bosco, erba e le tre texture; §9.219: e la sabbia)
    for (const q of B.tabs) assert.ok(q.x1 >= x1 && q.x2 <= x2 && q.y2 <= y2);
    // ([§9.237] gli slider: la guida e il valore dentro il riquadro, sotto le schede)
    for (const G of [B.width, B.density]) {
      const [t0, t1, cy] = G.track;
      assert.ok(t0 > G.label[0] + 50 && t1 < G.value[0] - G.room / 2 && G.value[0] + G.room / 2 <= x2 && cy + 15 <= y2 && cy - 15 > y1 + 90);
    }
    assert.ok(B.width.value[0] + B.width.room / 2 + 10 < B.density.label[0], "larghezza e densita' non si toccano");
  }
  assert.equal(BRUSH_SPACING[3], 90); // la densita' di partenza, come il pennello bosco di Tiled
  // [§9.186] la riga della simmetria: dentro il riquadro, sotto la tavolozza e i "-" "+"
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const L = editorLayout(W, H), S = symLayout(L.panel), B = brushLayout(L.panel), P = paletteLayout(L.panel, 0, 0);
    assert.equal(S.opts.length, 4);
    for (const q of S.opts) {
      assert.ok(q.x1 > S.label[0] && q.x2 <= L.panel[2] && q.y2 < L.panel[3] - 20, `${W}x${H}`);
      assert.ok(q.y1 > B.width.track[2] + 15 && q.y1 > P.cells[0].y2);
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
    for (const G of [B.width, B.end]) assert.ok(G.track[2] + 15 < S.opts[0].y1 && G.value[0] + G.room / 2 <= L.panel[2]); // §9.237
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
                instances: [{ object: "centro", x: 1000, y: 1000, scale_x: 1, scale_y: 1, rotation: 0, side: "red" },
                            { object: "centro", x: 5000, y: 5000, scale_x: 1, scale_y: 1, rotation: 0, side: "blue" }] };
  const room = testRoom(map);
  assert.equal(room.name, TEST_ROOM);
  // [§9.232] le partenze non sono nella room: solo la vista iniziale
  assert.equal(room.instances.length, 1);
  assert.deepEqual(room.starts, { red: [1000, 1000], blue: [5000, 5000] });
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

// [§9.190] le mappe dell'editor nella schermaglia: la CPU fissata dalla mappa
// o a scelta del giocatore; le partite salvate col nome della mappa
test("§9.190 la CPU della mappa e le etichette degli slot", () => {
  const sk = { map: "sk_padus", difficulty: "easy", style: "balanced", victory: "conquest" };
  const I = (side, x, y) => ({ object: "centro", x, y, side });
  const m = (cpu) => ({ cpu, instances: [I("red", 1000, 1000), I("blue", 5000, 5000)] });
  assert.deepEqual(skForMap(sk, m({ difficulty: "hard", style: "static" })), { ...sk, map: TEST_ROOM, difficulty: "hard", style: "static", start: "A" });
  assert.deepEqual(skForMap(sk, m({ difficulty: "choice", style: "choice" })), { ...sk, map: TEST_ROOM, start: "A" });
  assert.equal(fixedBy({ cpu: { difficulty: "choice", style: "raider" } }, "difficulty"), null);
  assert.equal(fixedBy({ cpu: { difficulty: "choice", style: "raider" } }, "style"), "raider");
  assert.equal(fixedBy(null, "style"), null);

  setLanguage("en");
  assert.equal(roomLabel("sk_padus"), "Skirmish: Padania");
  assert.equal(roomLabel("custom", { name: "Pianura" }), "Skirmish: Pianura");
  assert.equal(roomLabel("custom", {}), "Skirmish: Untitled map");
  assert.equal(roomLabel("lvl01").startsWith("1. "), true);
});

// [§9.191] gli schieramenti: le partenze rossa e blu, la gemella dell'altra
// parte, le mappe senza schieramenti (A rossa), la partenza del giocatore
test("§9.191 gli schieramenti delle partenze", () => {
  const C = (x, y, side) => ({ object: "centro", x, y, scale_x: 1, scale_y: 1, rotation: 0, ...(side ? { side } : {}) });
  // senza: A (x + y piu' piccolo) rossa, l'altra blu; con una gia' data, l'altra l'opposta
  const a = assignSides([C(5000, 5000), C(1000, 1000)]);
  assert.deepEqual(a.map((e) => e.side), ["blue", "red"]);
  assert.deepEqual(assignSides([C(1000, 1000), C(5000, 5000, "red")]).map((e) => e.side), ["blue", "red"]);
  // la partenza del giocatore per skirmishPrepare: A se la rossa e' A
  assert.equal(redStart({ instances: [C(1000, 1000, "red"), C(5000, 5000, "blue")] }), "A");
  assert.equal(redStart({ instances: [C(1000, 1000, "blue"), C(5000, 5000, "red")] }), "B");
  // la convalida: lo schieramento solo sulle partenze, e solo rosso o blu
  const objects = { centro: { sprite: "cc_spr" }, albero: { sprite: "alb1", choices: ["alb1"] } }, allowed = new Set(["centro", "albero"]);
  const v = validateMap({ ...newMap(), instances: [C(1000, 1000), C(5000, 5000)] }, allowed, objects);
  assert.ok(v.map && sidesOk(v.map) && startsOf(v.map, "red") === 1);
  assert.ok(validateMap({ ...newMap(), instances: [C(1000, 1000, "green")] }, allowed, objects).errors);
  assert.ok(validateMap({ ...newMap(), instances: [{ ...C(1000, 1000), object: "albero", side: "red" }] }, allowed, objects).errors);
  assert.ok(!sidesOk({ instances: [C(1000, 1000, "red"), C(5000, 5000, "red")] }));
  // la tavolozza: una casella per parte; S cambia lo schieramento
  const items = paletteItems(CATALOG.find((k) => k.key === "start"), { centro: {} });
  assert.deepEqual(items.filter((q) => q.side).map((q) => q.side), ["red", "blue"]); // (§9.222: poi le nebbie, senza parte)
  assert.deepEqual(stylesOf(C(0, 0, "blue"), { centro: {} }), { styles: [{ object: "centro", side: "red" }, { object: "centro", side: "blue" }], at: 1 });
  // la gemella (simmetria) e' dell'altra parte
  const map = { ...newMap(), instances: [] };
  const S = Object.create(EditScene.prototype);
  Object.assign(S, { map, objects: { centro: {} }, masks: {} });
  const t = S.twinAt(C(1000, 1000, "red"), "diagonal");
  assert.deepEqual([t.x, t.y, t.side], [5000, 5000, "blue"]);
});

// [§9.192] l'impronta della mappa (la partita online): la stessa per la
// stessa partita (nome, descrizione, copertina e CPU non contano), un'altra
// se cambia qualcosa della room
test("§9.192 l'impronta della mappa", () => {
  const C = (x, y, side) => ({ object: "centro", x, y, scale_x: 1, scale_y: 1, rotation: 0, side });
  const m = { ...newMap(), instances: [C(1000, 1000, "red"), C(5000, 5000, "blue")] };
  const h = mapHash(m);
  assert.match(h, /^[0-9a-f]{16}$/);
  assert.equal(mapHash({ ...m, name: "Altro", description: "x", cover: "data:image/webp;base64,AAAA", cpu: { difficulty: "hard", style: "static" } }), h);
  assert.notEqual(mapHash({ ...m, instances: [C(1000, 1001, "red"), C(5000, 5000, "blue")] }), h);
  assert.notEqual(mapHash({ ...m, rivers: [{ pts: [[0, 0], [100, 100]], width: 200 }] }), h);
  // una mappa convalidata due volte: la stessa impronta (chi entra la ricontrolla)
  const objects = { centro: { sprite: "cc_spr" } }, allowed = new Set(["centro"]);
  const v1 = validateMap(m, allowed, objects).map, v2 = validateMap(JSON.parse(JSON.stringify(v1)), allowed, objects).map;
  assert.equal(mapHash(v1), mapHash(v2));
  assert.equal(mapHash(v1), h);
});

// [§9.193] unita' ed edifici degli schieramenti: nella mappa coi nomi del
// giocatore e lo schieramento; nella room il blu e' l'oggetto della CPU
test("§9.193 unita' ed edifici delle due parti", () => {
  const objects = JSON.parse(readFileSync(new URL("../assets/objects.json", import.meta.url), "utf8"));
  for (const n of [...UNITS, ...BUILDINGS]) {
    assert.ok(objects[n], n);
    assert.ok(objects[BLUE_OF[n]], BLUE_OF[n]);
  }
  const I = (object, x, y, side) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, ...(side ? { side } : {}) });
  const map = { ...newMap(), instances: [I("centro", 1000, 1000, "red"), I("centro", 5000, 5000, "blue"),
                                          I("ally_warrior", 1200, 1200, "red"), I("ally_warrior", 4800, 4800, "blue"),
                                          I("caserma", 4500, 4500, "blue"), I("albero", 3000, 3000)] };
  const room = testRoom(map);
  assert.deepEqual(room.instances.map((e) => e[0]), ["manager", "ally_warrior", "enemy_warrior", "enemy_caserma", "albero"]); // (§9.232: le partenze no)
  // senza schieramento: del rosso; la convalida lo accetta su unita' ed edifici
  const allowed = new Set(["centro", "ally_warrior", "caserma", "albero"]);
  const v = validateMap({ ...map, instances: [I("centro", 1000, 1000), I("centro", 5000, 5000), I("ally_warrior", 100, 100), I("caserma", 200, 200, "blue")] }, allowed, objects);
  assert.deepEqual(v.map.instances.map((e) => e.side), ["red", "blue", "red", "blue"]);
  // la tavolozza: due caselle per unita', rossa e blu
  const items = paletteItems(CATALOG.find((k) => k.key === "units"), objects);
  assert.equal(items.length, UNITS.length * 2);
  assert.deepEqual(items.slice(0, 2).map((q) => [q.styles[0].object, q.side]), [["ally_omino", "red"], ["ally_omino", "blue"]]);
  // la gemella di un'unita' e' dell'altra parte
  const S = Object.create(EditScene.prototype);
  Object.assign(S, { map: { ...newMap(), instances: [] }, objects: { ally_warrior: {} }, masks: {} });
  assert.equal(S.twinAt(I("ally_warrior", 1000, 1000, "red"), "horizontal").side, "blue");
});

// [§9.194] le mura come nel gioco (walls.js): i "+" alle estremita', i tratti
// che proseguono dritti o ad angolo, i "+" liberi, muro <-> porta
test("§9.194 mura e porte", () => {
  const W = (object, x, y, side = "red") => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, side });
  const a = W("mura_ori", 2000, 2000);
  assert.deepEqual(wallPluses(a).map((p) => [p.key, p.x, p.y]), [["os", 1781, 2000], ["od", 2207, 2000]]);
  const [os, od] = wallPluses(a);
  assert.deepEqual(wallStep(od, 2600, 2000), { object: "mura_ori", x: 2424, y: 2000 }); // dritto a destra
  assert.deepEqual(wallStep(os, 1400, 2010), { object: "mura_ori", x: 1573, y: 2000 }); // dritto a sinistra
  assert.deepEqual(wallStep(od, 2210, 1600), { object: "mura_vert", x: 2207, y: 2000 }); // ad angolo, in su
  assert.deepEqual(wallStep(od, 2200, 2400), { object: "mura_vert", x: 2207, y: 2246 }); // ad angolo, in giu'
  assert.equal(wallStep(od, 1500, 2000), null); // indietro: niente
  const v = W("mura_vert", 3000, 3000), [vb, va] = wallPluses(v);
  assert.deepEqual(wallStep(va, 3000, 2000), { object: "mura_vert", x: 3000, y: 2754 });
  assert.deepEqual(wallStep(vb, 3000, 3600), { object: "mura_vert", x: 3000, y: 3246 });
  // i "+" liberi: due tratti di fila ne hanno due (le estremita'), con l'angolo pure
  const b = W("mura_ori", 2424, 2000), c = W("mura_vert", 2631, 2000);
  assert.deepEqual(freePluses([a, b]).map((p) => [p.key, p.x]), [["os", 1781], ["od", 2631]]);
  assert.deepEqual(freePluses([a, b, c]).map((p) => [p.e.object, p.key]), [["mura_ori", "os"], ["mura_vert", "va"]]);
  assert.equal(freePluses([W("albero", 0, 0)]).length, 0);
  assert.equal(GATE_SWAP.mura_vert, "porta_vert");
  assert.equal(GATE_SWAP.porta_ori, "mura_ori");
  // la tavolozza: il muro rosso e il blu, coi due versi (S)
  const items = paletteItems(CATALOG.find((k) => k.key === "buildings"), { mura_ori: {}, mura_vert: {}, casa: {} });
  const walls = items.filter((q) => q.key.startsWith("wall"));
  assert.deepEqual(walls.map((q) => [q.side, q.styles.map((st) => st.object).join()]), [["red", "mura_ori,mura_vert"], ["blue", "mura_ori,mura_vert"]]);
  // le porte si possono avere in una mappa; il blu e' della CPU
  assert.ok(allowedObjects().has("porta_ori") && allowedObjects().has("porta_vert"));
  const room = testRoom({ ...newMap(), instances: [W("porta_ori", 100, 100, "blue"), W("mura_vert", 200, 200)] });
  assert.deepEqual(room.instances.map((e) => e[0]), ["manager", "enemy_porta_ori", "mura_vert"]);
});

// [§9.195] l'interruttore rosso / blu in Unita' ed Edifici: si vedono le
// caselle di una parte (gli indici della tavolozza restano quelli di tutte)
test("§9.195 la tavolozza filtrata per parte", () => {
  const L = editorLayout(1600, 900), units = CATALOG.findIndex((k) => k.key === "units");
  const all = paletteLayout(L.panel, units, 0), red = paletteLayout(L.panel, units, 0, [0, 2, 4, 6, 8, 10, 12]);
  assert.ok(red.side && red.side.red[1] < red.side.blue[1], "i due cerchi, il rosso sopra");
  assert.deepEqual(red.cells.map((q) => q.i), [0, 2, 4, 6, 8, 10, 12]);
  assert.ok(red.cells[0].x1 > all.cells[0].x1 - 1, "le caselle dopo l'interruttore");
  assert.equal(paletteLayout(L.panel, 0, 0).side, null, "le partenze senza interruttore");
  // [§9.222, decisione dell'autore] niente "Natura" ne' "Montagne" (pennello e
  // strumento montagna); gli oggetti di prima restano ammessi nelle mappe
  assert.ok(!CATALOG.some((k) => k.key === "meadows" || k.key === "mountains"));
  assert.ok(["burst_erba1", "chiazza01", "montagna_3", "graa11"].every((n) => allowedObjects().has(n)));
});

// [§9.196] su uno schermo basso la colonna non si rimpicciolisce oltre 0,85:
// scorre, con le frecce; in cima si vede il primo pulsante, in fondo l'ultimo
test("§9.196 la colonna che scorre", () => {
  const big = editorLayout(1920, 1080);
  assert.equal(big.maxScroll, 0);
  assert.ok(!big.up && !big.down && big.buttons.every((b) => !b.hidden));
  const top = editorLayout(1024, 600, 0);
  assert.ok(top.k >= 0.75 && top.maxScroll > 0 && top.up && top.down); // (§9.199: 0,8 con Ripeti; §9.214: 0,75)
  assert.equal(editorLayout(1600, 900).maxScroll, 0, "a 900 px stanno tutti");
  assert.ok(!top.buttons[0].hidden && top.buttons[top.buttons.length - 1].hidden);
  assert.equal(hitTest(top, top.down[0], top.down[1]).kind, "colscroll");
  assert.equal(hitTest(top, top.up[0], top.up[1]).kind, "ui", "in cima la freccia su non fa niente");
  const end = editorLayout(1024, 600, 99999);
  assert.equal(end.scroll, end.maxScroll);
  assert.ok(!end.buttons[end.buttons.length - 1].hidden && end.buttons[0].hidden);
  for (const b of end.buttons) if (!b.hidden) assert.ok(b.y - b.r >= end.up[1] + end.up[2] - 1 && b.y + b.r <= end.down[1] - end.down[2] + 1, b.key);
  // il pulsante nascosto non si tocca
  const hid = top.buttons.find((b) => b.hidden);
  assert.notEqual((hitTest(top, hid.x, hid.y) || {}).key, hid.key);
  // la scheda delle partenze: "Regia"
  assert.equal(CATALOG[0].label, "Setup");
});

// [§9.198] la password della mappa (SHA-256 di sale e password: solo
// l'impronta nella mappa), i ponti dell'autore, le partite sulle mappe
// dell'editor senza i lavoratori di partenza e senza slot nel browser
test("§9.198 password, ponti, lavoratori, salvataggi", async () => {
  assert.equal(sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  const L = lockOf("segreto", "00112233445566778899aabbccddeeff");
  assert.ok(lockOpens(L, "segreto") && !lockOpens(L, "Segreto") && !lockOpens(null, "segreto"));
  assert.ok(!JSON.stringify(L).includes("segreto"), "niente password in chiaro");
  const objects = { centro: {} }, allowed = new Set(["centro"]);
  assert.deepEqual(validateMap({ ...newMap(), lock: L }, allowed, objects).map.lock, L);
  assert.ok(validateMap({ ...newMap(), lock: { salt: "x", hash: "y" } }, allowed, objects).errors);
  assert.equal(mapHash({ ...newMap(), lock: L }), mapHash(newMap()), "la password non cambia la partita");
  assert.deepEqual(CATALOG.find((k) => k.key === "bridges").objects, ["ponte_dx", "ponte_dx2"]);
  const sk = { difficulty: "normal", resources: "normal", pop: 75, style: "balanced" };
  assert.equal(skirmishEco({ ...sk, map: "custom" }).startWorkers, 0);
  assert.equal(skirmishEco({ ...sk, map: "sk_padus" }).startWorkers, 3);
  const { SAVE_ROOMS } = await import("../src/save.js");
  assert.ok(!SAVE_ROOMS.includes("custom"));
});

// [§9.203, richieste dell'autore] il municipio come edificio (oltre alle
// partenze), gli stili della casa, lo stile scelto che arriva nella partita
test("§9.203 municipio, stili della casa, stili nella partita", { skip: !existsSync(OBJECTS) }, () => {
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8"));
  const I = (object, x, y, more = {}) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, ...more });
  // la tavolozza degli edifici: in testa il municipio (rosso e blu, `hall`),
  // la casa coi sei stili per parte, in fondo le mura
  const items = paletteItems(CATALOG.find((k) => k.key === "buildings"), objects);
  assert.deepEqual(items.slice(0, 2).map((q) => [q.key, q.side, q.styles]),
                   [["hall:red", "red", [{ object: "centro", side: "red", hall: true }]], ["hall:blue", "blue", [{ object: "centro", side: "blue", hall: true }]]]);
  const home = items.find((q) => q.key === "home:blue");
  assert.deepEqual(home.styles.map((s) => s.sprite), HOME_STYLES);
  assert.ok(home.styles.every((s) => s.object === "casa" && s.side === "blue"));
  assert.equal(items.length, paletteCount(CATALOG.find((k) => k.key === "buildings")));
  assert.equal(items.findIndex((q) => q.key === "wall:red"), 20);
  // ogni stile della casa e' uno sprite del gioco, rosso e blu
  for (const s of HOME_STYLES) {
    assert.ok([...objects.casa.choices, objects.casa.sprite].includes(s), s);
    assert.ok([...objects.enemy_house.choices, objects.enemy_house.sprite].includes(blueHome(s)), blueHome(s));
  }
  // con "Sposta": S cambia lo stile della casa (nello stesso schieramento);
  // il blu si vede col suo stile blu
  const S1 = stylesOf(I("casa", 100, 100, { side: "blue", sprite: "c4s" }), objects);
  assert.equal(S1.at, 3);
  assert.ok(S1.styles.every((s) => s.side === "blue"));
  assert.equal(sideLook(objects, I("casa", 0, 0, { side: "blue", sprite: "c4s" })), "c4b");
  assert.equal(sideLook(objects, I("casa", 0, 0, { side: "blue" })), "c3b");
  assert.equal(sideLook(objects, I("centro", 0, 0, { side: "blue", hall: true })), "cc_b");
  assert.equal(sideLook(objects, I("centro", 0, 0, { side: "red", hall: true })), null);
  assert.equal(sideLook(objects, I("centro", 0, 0, { side: "blue" })), "bflag");
  // le partenze non contano i municipi
  const map = { ...newMap(), instances: [I("centro", 1000, 1000, { side: "red" }), I("centro", 5000, 5000, { side: "blue" }),
                                          I("centro", 400, 400, { side: "red", hall: true }), I("centro", 5600, 600, { side: "blue", hall: true }),
                                          I("casa", 1300, 1000, { side: "red", sprite: "c1s" }), I("casa", 4700, 5000, { side: "blue", sprite: "c5s" }),
                                          I("albero", 3000, 3000, { sprite: "alb6" }), I("albero_fake", 3200, 3000, { sprite: "alb1_F" })] };
  assert.ok(isStart(map.instances[0]) && !isStart(map.instances[2]));
  assert.equal(startsOf(map, "red"), 1);
  assert.ok(sidesOk(map));
  assert.equal(redStart(map), "A");
  // la convalida: `hall` solo vero e solo sul centro
  const allowed = allowedObjects();
  const v = validateMap(map, allowed, objects);
  assert.deepEqual(v.errors, undefined);
  assert.deepEqual(v.map.instances.map((e) => !!e.hall), [false, false, true, true, false, false, false, false]);
  assert.ok(validateMap({ ...map, instances: [I("casa", 1, 1, { side: "red", hall: true })] }, allowed, objects).errors);
  assert.ok(validateMap({ ...map, instances: [I("centro", 1, 1, { side: "red", hall: 1 })] }, allowed, objects).errors);
  // la room: i municipi nel gruppo HALL (il blu e' quello della CPU), lo
  // stile dopo il gruppo (la casa blu col suo sprite blu)
  const room = testRoom(map);
  const row = (o, x) => room.instances.find((e) => e[0] === o && e[1] === x);
  assert.equal(row("centro", 1000), undefined, "§9.232: la partenza e' solo la vista");
  assert.deepEqual(room.starts, { red: [1000, 1000], blue: [5000, 5000] });
  assert.equal(row("centro", 400)[7], HALL);
  assert.equal(row("enemy_centro", 5600)[7], HALL);
  assert.deepEqual(row("casa", 1300).slice(7), [null, "c1s"]);
  assert.deepEqual(row("enemy_house", 4700).slice(7), [null, "c5b"]);
  assert.deepEqual(row("albero", 3000).slice(7), [null, "alb6"]);
  // skirmishPrepare: [§9.232] le viste dalle bandierine (il rosso e' il
  // giocatore), i municipi restano quelli delle due parti
  const all = room.instances.map((e) => e.slice());
  const st = skirmishPrepare({ start: "B" }, all, room.starts);
  assert.deepEqual([st.player, st.cpu], [[1000, 1000], [5000, 5000]]);
  assert.deepEqual(all.filter((e) => /centro$/.test(e[0])).map((e) => [e[0], e[1]]), [["centro", 400], ["enemy_centro", 5600]]);
  assert.equal(skirmishPrepare({ start: "A" }, all, { red: [1, 1] }), null, "senza la partenza blu");
  // splitGroups tiene lo stile (il gruppo HALL non e' una regia: si crea subito)
  const { now } = splitGroups(TEST_ROOM, all);
  assert.equal(now.length, all.length);
  assert.deepEqual(now.find((e) => e[0] === "albero").slice(7), [null, "alb6"]);
  assert.equal(now.find((e) => e[0] === "centro" && e[1] === 400).length, 7);
});

// [§9.204, richieste dell'autore] la fascia dell'anteprima della polilinea
// (larghezza schiacciata in verticale come nel gioco) e gli alberi che un
// fiume nuovo toglie
test("§9.204 anteprima della polilinea e alberi nel fiume", () => {
  // senza la larghezza che varia: un fiume orizzontale e' alto w x ISO, uno
  // verticale largo w
  const h = riverGeometry({ pts: [[1000, 1000], [3000, 1000]], width: 200, plain: true });
  const v = riverGeometry({ pts: [[1000, 1000], [1000, 3000]], width: 200, plain: true });
  for (let k = 0; k < h.L.length; k++) assert.ok(Math.abs(Math.abs(h.L[k].y - h.R[k].y) - 200 * ISO) < 0.01);
  for (let k = 0; k < v.L.length; k++) assert.ok(Math.abs(Math.abs(v.L[k].x - v.R[k].x) - 200) < 0.01);
  const wob = riverGeometry({ pts: [[1000, 1000], [3000, 1000]], width: 200 });
  assert.ok(wob.L.some((p, k) => Math.abs(Math.abs(p.y - wob.R[k].y) - 200 * ISO) > 1)); // (il gioco: varia)
  // gli alberi coi piedi nell'acqua del fiume nuovo (non quelli a fianco,
  // non le altre voci)
  const T = (object, x, y) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0 });
  const map = { ...newMap(), instances: [T("albero", 2000, 1000), T("albero_fake", 2500, 1030), T("albero", 2000, 1200), T("miniera_oro", 1500, 1000), T("albero", 500, 1000)] };
  const S = Object.create(EditScene.prototype);
  S.map = map;
  S.world = { roomW: map.width, roomH: map.height, all: () => [], bridges: [] };
  const rv = { pts: [[1000, 1000], [3000, 1000]], width: 150 };
  assert.deepEqual(S.treesInRivers([rv]).map((e) => [e.object, e.x, e.y]), [["albero", 2000, 1000], ["albero_fake", 2500, 1030]]);
  assert.deepEqual(S.treesInRivers([{ pts: [[4000, 4000], [5000, 4000]], width: 150 }]), []);
});

// [§9.205, richiesta dell'autore] la nebbia in "Natura": la estetica e il
// banco; il banco dimezza la vista dei nemici anche fuori dal livello 7
test("§9.205 la nebbia nell'editor e nella partita", () => {
  const setup = CATALOG.find((k) => k.key === "start").objects; // (§9.222: in "Regia", prima in "Natura")
  assert.ok(setup.includes("sk_nebbia") && setup.includes("nebbia_banco"));
  assert.ok(allowedObjects().has("nebbia_banco") && allowedObjects().has("sk_nebbia"));
  // la vista del nemico: dentro un banco a meta' (senza stealth), fuori no;
  // col livello 7 (stealth) fogSight non la tocca (la conta sees)
  const bank = { object: "nebbia_banco", alive: true, x: 1000, y: 1000, rx: 520 };
  const w = (stealth) => ({ g: { stealth }, exists: (n) => n === "nebbia_banco", all: (n) => (n === "nebbia_banco" ? [bank] : []) });
  assert.equal(fogSight(w(0), { x: 1100, y: 1050 }), FOG_SIGHT);
  assert.equal(fogSight(w(0), { x: 1000, y: 1300 }), 1);
  assert.equal(fogSight(w(1), { x: 1100, y: 1050 }), 1);
});

// [§9.206, richieste dell'autore] le impostazioni della nebbia: nella mappa
// (solo quelle diverse da quelle di partenza), convalidate, nella room per il
// gioco; il banco meno fitto nasconde meno
test("§9.206 le impostazioni della nebbia", () => {
  const objects = JSON.parse(readFileSync(OBJECTS, "utf8"));
  const I = (object, x, y, more = {}) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, ...more });
  assert.deepEqual(fogOf(I("nebbia_banco", 0, 0)), FOG_DEFAULTS.nebbia_banco);
  assert.deepEqual(fogOf(I("sk_nebbia", 0, 0, { fog: { speed: -1 } })), { ...FOG_DEFAULTS.sk_nebbia, speed: -1 });
  assert.equal(fogDiff("nebbia_banco", FOG_DEFAULTS.nebbia_banco), null);
  assert.deepEqual(fogDiff("nebbia_banco", { density: 0.5, speed: 1, range: 900 }), { density: 0.5, range: 900 });
  // i valori di partenza sono quelli del gioco di prima (livello 7, schermaglia)
  assert.deepEqual([FOG_DEFAULTS.nebbia_banco.range, FOG_DEFAULTS.nebbia_banco.speed], [BANK.range, 1]);
  assert.deepEqual([FOG_DEFAULTS.sk_nebbia.count, FOG_DEFAULTS.sk_nebbia.every * 60, FOG_DEFAULTS.sk_nebbia.density, FOG_DEFAULTS.sk_nebbia.speed, FOG_DEFAULTS.sk_nebbia.life * 60],
                   [MIST.n, MIST.every, MIST.alpha, MIST.speed, MIST.life]);
  for (const [o, S] of Object.entries(FOG_SETTINGS)) for (const [k, v] of Object.entries(FOG_DEFAULTS[o])) assert.ok(S[k].includes(v), o + " " + k);
  // la convalida: solo valori dell'elenco, solo sulle nebbie; di partenza tolti
  const allowed = allowedObjects(), map = { ...newMap(), instances: [] };
  const v = validateMap({ ...map, instances: [I("nebbia_banco", 1, 1, { fog: { density: 0.25, speed: 1 } }), I("sk_nebbia", 2, 2, { fog: { count: 12, every: 20 } })] }, allowed, objects);
  assert.deepEqual(v.map.instances.map((e) => e.fog), [{ density: 0.25 }, { count: 12, every: 20 }]);
  for (const bad of [I("nebbia_banco", 1, 1, { fog: { density: 0.3 } }), I("nebbia_banco", 1, 1, { fog: { count: 5 } }), I("albero", 1, 1, { fog: { density: 1 } })]) {
    assert.ok(validateMap({ ...map, instances: [bad] }, allowed, objects).errors, JSON.stringify(bad));
  }
  // nella room, dopo gruppo e stile; splitGroups le tiene
  const room = testRoom({ ...map, instances: [I("nebbia_banco", 1000, 1000, { fog: { density: 0.5 } }), I("sk_nebbia", 2000, 2000)] });
  const bankRow = room.instances.find((e) => e[0] === "nebbia_banco");
  assert.deepEqual(bankRow.slice(7), [null, null, { density: 0.5 }]);
  assert.equal(room.instances.find((e) => e[0] === "sk_nebbia").length, 7);
  assert.deepEqual(splitGroups(TEST_ROOM, room.instances).now.find((e) => e[0] === "nebbia_banco")[9], { density: 0.5 });
  // la vista in proporzione: banco pieno a meta', a 0,5 tre quarti, a 0,25 7/8
  for (const [dn, k] of [[1, 0.5], [0.5, 0.75], [0.25, 0.875]]) {
    const bank = { alive: true, x: 1000, y: 1000, rx: 520, density: dn };
    const w = { g: {}, exists: () => true, all: (n) => (n === "nebbia_banco" ? [bank] : []) };
    assert.equal(fogDensity(w, 1100, 1050), dn);
    assert.equal(fogSight(w, { x: 1100, y: 1050 }), k);
  }
  // il riquadro: tre impostazioni per riga, sopra il pannello
  const L = editorLayout(1600, 900), F = fogLayout(L.panel, "sk_nebbia");
  assert.equal(F.groups.length, 5);
  assert.ok(F.box[3] < L.panel[1] && F.groups.every((g) => g.value[0] + g.room / 2 < L.panel[2] && g.track[2] - 15 > F.box[1] && g.track[2] + 15 < F.box[3]
    && g.track[0] > g.label[0] + 60 && g.track[1] + 14 < g.value[0] - g.room / 2 + 14)); // §9.237: lo slider
  assert.deepEqual([fogValue("sk_nebbia", "speed", -0.5), fogValue("sk_nebbia", "speed", 1), fogValue("nebbia_banco", "speed", 2), fogValue("nebbia_banco", "density", 0.75)],
                   ["« 30", "60 »", "120", "75%"]);
});

// [§9.232, richiesta dell'autore] le bandierine solo per la vista iniziale;
// le partite senza centro citta'; le mappe salvate prima tengono i centri
import { hallsOk, hallsOf, MAP_VERSION } from "../src/mapfile.js";
test("§9.232 bandierine, municipi, le mappe della versione 1", () => {
  const I = (object, x, y, extra = {}) => ({ object, x, y, scale_x: 1, scale_y: 1, rotation: 0, ...extra });
  const objects = { centro: { sprite: "cc_spr" }, ally_warrior: { sprite: "w" } }, allowed = new Set(["centro", "ally_warrior"]);
  const flags = [I("centro", 1000, 1000, { side: "red" }), I("centro", 5000, 5000, { side: "blue" })];
  // della versione 1: un municipio della sua parte sotto ogni bandierina
  const old = validateMap({ ...newMap(), version: 1, instances: flags }, allowed, objects).map;
  assert.equal(old.version, MAP_VERSION);
  assert.deepEqual(old.instances.map((e) => [e.x, e.side, !!e.hall]), [[1000, "red", false], [1000, "red", true], [5000, "blue", false], [5000, "blue", true]]);
  assert.ok(hallsOk(old));
  // della versione 2: le sole bandierine, senza centri (si gioca lo stesso)
  const now = validateMap({ ...newMap(), instances: [...flags, I("ally_warrior", 1200, 1200, { side: "red" })] }, allowed, objects).map;
  assert.equal(now.instances.length, 3);
  assert.ok(sidesOk(now) && !hallsOk(now) && hallsOf(now, "red") === 0);
  // un centro solo del rosso: la vittoria Municipio non c'e' ancora
  assert.ok(!hallsOk({ instances: [...flags, I("centro", 900, 900, { side: "red", hall: true })] }));
  // "Prova mappa" con la vittoria Municipio su una mappa senza centri: Conquista
  const sk = { map: "sk_padus", difficulty: "easy", style: "balanced", victory: "townhall" };
  assert.equal(skForMap(sk, now).victory, "conquest");
  assert.equal(skForMap(sk, old).victory, "townhall");
  // la room: nessun centro, le viste delle due parti
  const room = testRoom(now);
  assert.deepEqual(room.instances.map((e) => e[0]), ["manager", "ally_warrior"]);
  assert.deepEqual(skirmishPrepare({ start: "random" }, room.instances, room.starts), { side: "A", player: [1000, 1000], cpu: [5000, 5000] });
});

// [§9.233, richiesta dell'autore] le misure della mappa: interi nei limiti
import { MAP_SIZE, mapSizeOk } from "../src/mapfile.js";
test("§9.233 le misure della mappa: interi da MAP_SIZE.min a MAP_SIZE.max", () => {
  assert.deepEqual(MAP_SIZE, { min: 3000, max: 10000 });
  for (const v of [3000, 4321, 6000, 10000]) assert.ok(mapSizeOk(v), String(v));
  for (const v of [2999, 10001, 5000.5, "6000", NaN, null]) assert.ok(!mapSizeOk(v), String(v));
  const objects = { centro: { sprite: "cc_spr" } }, allowed = new Set(["centro"]);
  assert.equal(validateMap({ ...newMap(), width: 4321, height: 5003 }, allowed, objects).map.width, 4321);
  assert.ok(validateMap({ ...newMap(), width: 2500 }, allowed, objects).errors);
  assert.ok(validateMap({ ...newMap(), height: 6000.5 }, allowed, objects).errors);
});
