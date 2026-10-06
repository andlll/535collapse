// Salvataggi (save.js): grafo con riferimenti condivisi e cicli, istanze,
// classi, array tipizzati, colonne, checksum, gzip.
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeGraph, decodeGraph, packTyped, unpackTyped, sign, verify, parseSave, gzipBase64, gunzipBase64,
         SAVE_VERSION } from "../src/save.js";
import { Alarms } from "../src/alarms.js";

const isInstance = (o) => typeof o.object === "string" && o.alarm instanceof Alarms;
const opts = { isInstance, skipInstanceKeys: ["parents", "cells"], classes: { Alarms }, roundKeys: ["parts"] };
const roundtrip = (root, extra = {}) => decodeGraph(JSON.parse(JSON.stringify(encodeGraph(root, opts))), { ...opts, ...extra });

test("array tipizzati: corse e differenze", () => {
  const cases = [new Uint8Array([0, 0, 0, 255, 255, 3]), new Int32Array([5, 6, 7, 8, -1, -1, 1000]),
                 new Float32Array([45, 45, -1, 0.5, 0.5, 1e-7]), new Float64Array([Math.PI, NaN, NaN, Infinity, 2])];
  for (const a of cases) {
    const b = unpackTyped(a.constructor, a.length, JSON.parse(JSON.stringify(packTyped(a))).map((x) => x));
    assert.deepEqual([...b].map(String), [...a].map(String));
  }
  // una riga di goal field (0,1,2,...) diventa una corsa sola
  assert.equal(packTyped(new Int32Array(Array.from({ length: 500 }, (_, k) => k))).length, 4);
});

test("riferimenti condivisi, cicli, istanze e classi", () => {
  const al = new Alarms(12); al.set(3, 40);
  const a = { id: 1, object: "ally_warrior", parents: ["ally_unit"], cells: [1, 2], alive: true, alarm: al, x: 1.5 };
  const b = { id: 2, object: "enemy_warrior", parents: ["enemy_unit"], cells: null, alive: true, alarm: new Alarms(12) };
  const dead = { id: 3, object: "enemy_warrior", parents: [], alive: false, alarm: new Alarms(12), x: 9 };
  a.target_eu = b; b.target_eu = a; b.old = dead;
  const ff = new Float32Array([0, 45, 90]);
  a.flow_field = ff; b.flow_field = ff;
  const type = { shape: "pixel", life: [10, 20] };
  const parts = Array.from({ length: 10 }, (_, k) => ({ t: type, x: k + 0.123456, y: 2, u: undefined }));
  const root = { instances: [a, b], g: { food: 100, night: 0, list: [] }, sys: { parts }, nan: NaN, und: undefined };
  const fixed = [];
  const out = roundtrip(root, { instance: (o) => { o.parents = ["P:" + o.object]; o.cells = null; fixed.push(o.id); } });
  const [A, B] = out.instances;
  assert.equal(A.target_eu, B);
  assert.equal(B.target_eu, A);
  assert.equal(B.old.alive, false);
  assert.equal(A.flow_field, B.flow_field);
  assert.ok(A.flow_field instanceof Float32Array);
  assert.ok(A.alarm instanceof Alarms);
  assert.equal(A.alarm.get(3), 40);
  assert.deepEqual(A.parents, ["P:ally_warrior"]);
  assert.equal(A.cells, null);
  assert.deepEqual(fixed.sort(), [1, 2, 3]);
  assert.equal(out.sys.parts[0].t, out.sys.parts[9].t);
  assert.equal(out.sys.parts[3].x, 3.123);
  assert.ok("u" in out.sys.parts[0] && out.sys.parts[0].u === undefined);
  assert.ok(Number.isNaN(out.nan));
  assert.ok("und" in out);
  assert.deepEqual(out.g, { food: 100, night: 0, list: [] });
});

test("funzioni e classi sconosciute fanno fallire il salvataggio", () => {
  assert.throws(() => encodeGraph({ a: { f() {} } }, opts), /funzione in \$\.a\.f/);
  assert.throws(() => encodeGraph({ a: new Date() }, opts), /classe Date/);
  // chiavi che cominciano con $ restano dati
  assert.deepEqual(roundtrip({ o: { $r: 1, $t: "x" } }), { o: { $r: 1, $t: "x" } });
});

test("checksum: un numero cambiato a mano scarta il salvataggio", () => {
  const data = { game: "535", v: SAVE_VERSION, room: "match", date: 1, state: { g: { gold: 50 } } };
  const text = JSON.stringify(sign(data));
  assert.deepEqual(parseSave(text), data);
  assert.equal(parseSave(text.replace('"gold":50', '"gold":5000')), null);
  assert.equal(parseSave("non json"), null);
  assert.equal(verify({ a: 1 }), null);
  assert.equal(parseSave(JSON.stringify(sign({ ...data, game: "nimbus" }))), null);
});

test("gzip + base64", async () => {
  const s = JSON.stringify({ x: "abc".repeat(10000), ò: "è" });
  const z = await gzipBase64(s);
  assert.ok(z.length < s.length / 10);
  assert.equal(await gunzipBase64(z), s);
});
