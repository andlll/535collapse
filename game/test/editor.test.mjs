// [§9.180] L'editor di mappe, lo scheletro (editor.js): la mappa vuota nel
// formato degli scenari, la disposizione della colonna e del riquadro, la
// vista (zoom attorno al puntatore, margine fuori dalla mappa), i testi
// tradotti.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { editorLayout, hitTest, EditorView, TOOLS, ACTIONS, LABEL, DESC, EDITOR_TEXTS, VIEW_MIN, VIEW_MAX, VIEW_MARGIN,
         openLayout, GAME_MAPS, mapLabel, variantOf } from "../src/editor.js";
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

test("§9.181 Apri mappa: tutorial, livelli e schermaglie in due colonne", () => {
  assert.deepEqual(GAME_MAPS[0].slice(0, 2), ["match", "lvl01"]);
  assert.ok(GAME_MAPS[1].includes("sk_padus"));
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const O = openLayout(W, H);
    assert.equal(O.rows.length, GAME_MAPS[0].length + GAME_MAPS[1].length);
    for (const q of O.rows) assert.ok(q.x1 >= 0 && q.x2 <= W && q.y1 > O.title[1] && q.y2 <= H, `${q.room} ${W}x${H}`);
  }
  setLanguage("it");
  assert.equal(mapLabel("match"), "Tutorial");
  assert.equal(mapLabel("sk_padus"), "Padania");
  setLanguage("en");
});

test("§9.181 varianti fisse e livelli di dettaglio del suolo", () => {
  for (let k = 0; k < 50; k++) {
    const v = variantOf(k * 137.5, k * 91, 8);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 8);
    assert.equal(v, variantOf(k * 137.5, k * 91, 8));
  }
  assert.deepEqual([0.5, 1, 1.9, 2, 3.9, 4, 7, 8, 100].map(lodFor), [1, 1, 1, 2, 2, 4, 4, 8, 16]);
});
