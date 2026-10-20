// I cantieri alleati colpiti fino a 0 crollano (§9.55).
// node --test, nessuna dipendenza.
import { test } from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/world.js";
import { fond } from "../src/buildings.js";
import { wallFond } from "../src/walls.js";
import { newGlobals } from "../src/state.js";

function setup() {
  const obj = { sprite: null, mask: null, parents: [], depth: 0, visible: true, solid: false, draw: false };
  const w = new World({ objects: { casa_fond: obj, mura_ori_fond: obj }, masks: {}, assets: {},
                        g: newGlobals("match"), roomW: 100, roomH: 100 });
  const marks = [];
  const p = { markInstance: (i, v) => marks.push(v) };
  w.register("casa_fond", fond("casa", p));
  w.register("mura_ori_fond", wallFond("ori", p));
  return { w, marks };
}

for (const name of ["casa_fond", "mura_ori_fond"]) {
  test(`${name}: resta con vita 1, crolla a 0 e libera le celle`, () => {
    const { w, marks } = setup();
    const f = w.create(name, 0, 0);
    assert.deepEqual(marks, [1000]);
    w.fire(f, "step");
    assert.equal(f.alive, true);
    f.life -= 50; // un colpo d'ariete
    w.fire(f, "step");
    assert.equal(f.alive, false);
    assert.deepEqual(marks, [1000, 1]);
  });
}
