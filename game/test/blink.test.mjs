// Il lampeggio delle risorse che mancano e' uno solo per risorsa (§9.54).
// node --test, nessuna dipendenza.
import { test } from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/world.js";
import { blink } from "../src/buildings.js";
import { newGlobals } from "../src/state.js";

function world() {
  const obj = { sprite: null, mask: null, parents: [], depth: 0, visible: true, solid: false, draw: false };
  const w = new World({ objects: { pop_blink: obj, food_blink: obj }, masks: {}, assets: {},
                        g: newGlobals("match"), roomW: 100, roomH: 100 });
  w.register("pop_blink", blink("pop_blink"));
  w.register("food_blink", blink("food_blink"));
  return w;
}

test("un secondo pop_blink mentre il primo lampeggia non si aggiunge", () => {
  const w = world();
  const a = w.create("pop_blink", 0, 0);
  a.fad = 0.6;
  const b = w.create("pop_blink", 0, 0);
  assert.equal(b.alive, false);
  assert.equal(w.number("pop_blink"), 1);
  assert.equal(a.fad, 0.6); // continua col suo ritmo
  w.create("food_blink", 0, 0); // le altre risorse sono indipendenti
  assert.equal(w.number("food_blink"), 1);
  w.destroy(a);
  assert.equal(w.create("pop_blink", 0, 0).alive, true);
});
