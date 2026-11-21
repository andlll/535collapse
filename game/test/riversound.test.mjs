// [§9.169, richiesta dell'autore] Il suono del fiume (effects.js
// riverNoise): quanta acqua si vede, da che parte; niente senza fiumi o
// lontano.
import { test } from "node:test";
import assert from "node:assert/strict";
import { riverNoise, RIVER_FULL } from "../src/effects.js";

// una room di 4000 x 4000 con l'acqua (celle da 8 px) in una striscia
// verticale x in [x0, x1)
const world = (x0, x1) => {
  const C = 8, gw = 500, gh = 500, grid = new Uint8Array(gw * gh);
  for (let cy = 0; cy < gh; cy++) for (let cx = Math.floor(x0 / C); cx < Math.floor(x1 / C); cx++) grid[cy * gw + cx] = 1;
  return { _water: x1 > x0 ? { C, gw, gh, grid } : null };
};
const cam = { x: 1000, y: 1000, w: 1000, h: 600 };
const place = (x, y) => {
  const dx = Math.max(cam.x - x, 0, x - cam.x - cam.w), dy = Math.max(cam.y - y, 0, y - cam.y - cam.h);
  return [Math.max(0, 1 - Math.hypot(dx, dy) / 700), Math.max(-1, Math.min(1, (x - cam.x - cam.w / 2) / (cam.w / 2))) * 0.6];
};

test("§9.169 il suono del fiume", () => {
  assert.deepEqual(riverNoise(world(0, 0), cam, place), { level: 0, pan: 0 }); // niente fiumi
  assert.deepEqual(riverNoise(world(3000, 3200), cam, place), { level: 0, pan: 0 }); // lontano
  const wide = riverNoise(world(1000, 2000), cam, place); // tutta la vista d'acqua
  assert.equal(wide.level, 1);
  const small = riverNoise(world(1800, 1830), cam, place); // una striscia del 3% a destra
  assert.ok(small.level > 0.3 && small.level < 1, String(small.level));
  assert.ok(small.pan > 0.3);
  const near = riverNoise(world(2300, 2400), cam, place); // appena fuori, a destra: piano
  assert.ok(near.level > 0 && near.level < small.level);
  assert.ok(RIVER_FULL > 0);
});
