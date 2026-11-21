// [§9.167, richiesta dell'autore] Il suono degli incendi (effects.js
// fireNoise): gli edifici in fiamme che si vedono, vicini alla vista, piu'
// forte con piu' fuochi, da che parte sono, piu' piano sotto la pioggia.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fireNoise, FIRE_SOUND_S, RAIN_FIRE_SOUND } from "../src/effects.js";
import { setupMultiplayer } from "../src/multiplayer.js";

// la vista da 0 a 1000 in x (come audio.js placement: 1 dentro, pan dalla x)
const place = (x) => [x >= 0 && x <= 1000 ? 1 : Math.max(0, 1 - Math.min(Math.abs(x), Math.abs(x - 1000)) / 700),
                      Math.max(-1, Math.min(1, (x - 500) / 500)) * 0.6];
const fire = (object, x, extra = {}) => ({ object, x, y: 0, alive: true, visible: true, onfire: 1, firestarted: 1, fire_ps: {}, ...extra });
const world = (instances, rainLevel = 0) => ({ instances, rainLevel });

test("§9.167 il suono degli incendi", () => {
  assert.deepEqual(fireNoise(world([]), place), { level: 0, pan: 0 });
  const one = fireNoise(world([fire("casa", 500)]), place);
  assert.ok(Math.abs(one.level - 1 / (1 + FIRE_SOUND_S)) < 1e-9);
  assert.equal(one.pan, 0);
  // non si sentono: nella nebbia, spenti, appena accesi senza fiamme, lontani
  for (const i of [fire("casa", 500, { visible: false }), fire("casa", 500, { onfire: 0 }),
                   fire("casa", 500, { firestarted: 0 }), fire("casa", 3000)]) {
    assert.equal(fireNoise(world([i]), place).level, 0, JSON.stringify(i));
  }
  // piu' fuochi, piu' forte (senza superare 1); a destra, pan a destra
  const many = fireNoise(world([fire("casa", 900), fire("caserma", 950), fire("centro", 1000)]), place);
  assert.ok(many.level > one.level && many.level < 1);
  assert.ok(many.pan > 0.4);
  // il gemello blu come l'edificio del giocatore (i nomi dei gemelli li
  // registra setupMultiplayer)
  setupMultiplayer({ objects: { ally: { parents: [] }, ally_build: { parents: ["ally"] }, caserma: { parents: ["ally_build", "ally"] } },
                     behaviours: {} }, 1);
  assert.deepEqual(fireNoise(world([fire("p2_caserma", 500)]), place), fireNoise(world([fire("caserma", 500)]), place));
  // sotto la pioggia piena piu' piano
  const wet = fireNoise(world([fire("casa", 500)], 1), place);
  assert.ok(Math.abs(wet.level - one.level * RAIN_FIRE_SOUND) < 1e-9);
  // la partita a due: decide shown (chi guarda)
  assert.equal(fireNoise({ instances: [fire("casa", 500)], shown: () => false }, place).level, 0);
});

// [§9.170] gli zoccoli: i cavalieri che si muovono e si vedono
test("§9.170 gli zoccoli della cavalleria", async () => {
  const { hoovesNoise, HOOVES_S } = await import("../src/effects.js");
  const cav = (object, x, moving, extra = {}) => ({ object, x, y: 0, xprevious: moving ? x - 5 : x, yprevious: 0, alive: true, visible: true, ...extra });
  assert.deepEqual(hoovesNoise(world([cav("ally_cavaliere", 500, false)]), place), { level: 0, pan: 0 }); // fermo
  const one = hoovesNoise(world([cav("ally_cavaliere", 500, true)]), place);
  assert.ok(Math.abs(one.level - 1 / (1 + HOOVES_S)) < 1e-9);
  // non: i cadaveri, nella nebbia, lontano
  for (const i of [cav("cavaliere_corpse", 500, true), cav("enemy_cavaliere", 500, true, { visible: false }), cav("p2_cavaliere", 4000, true)]) {
    assert.equal(hoovesNoise(world([i]), place).level, 0, i.object);
  }
  const six = hoovesNoise(world([0, 1, 2, 3, 4, 5].map((k) => cav(k % 2 ? "enemy_cavaliere" : "p2_cavaliere", 900, true))), place);
  assert.ok(six.level > one.level && six.level < 0.8 && six.pan > 0.4);
});
