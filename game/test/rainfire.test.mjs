// [§9.166, richiesta dell'autore] Le fiamme degli incendi smorzate sotto la
// pioggia (effects.js fireStep): meno particelle e piu' corte, col livello
// delle gocce; senza pioggia come prima.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fireStep, FIRE, RAIN_FIRE_N, RAIN_FIRE_LIFE } from "../src/effects.js";
import { Particles } from "../src/particles.js";

const burning = (rainLevel) => {
  const w = { particles: new Particles(), rainLevel };
  const i = { x: 500, y: 500, visible: true, onfire: 1, firestarted: 0, life: 300, slife: 350 };
  fireStep(i, w, "caserma");
  fireStep(i, w, "caserma");
  return { back: i.fire_ps.emitters[0].n, front: i.fire_psf.emitters[0].n, life: i.fire_part.life };
};

test("§9.166 le fiamme sotto la pioggia", () => {
  const dry = burning(0), wet = burning(1), half = burning(0.5);
  assert.equal(dry.back, FIRE.caserma.back[4]);
  assert.equal(dry.front, FIRE.caserma.front[4]);
  assert.equal(wet.back, Math.round(FIRE.caserma.back[4] * RAIN_FIRE_N));
  assert.ok(wet.front >= 1 && wet.front < dry.front);
  assert.ok(half.back <= dry.back && half.back >= wet.back);
  assert.ok(Math.abs(wet.life[0] - dry.life[0] * RAIN_FIRE_LIFE) < 1e-9);
  assert.ok(Math.abs(wet.life[1] - dry.life[1] * RAIN_FIRE_LIFE) < 1e-9);
  assert.deepEqual(burning(undefined), dry); // senza manager (prove, menu)
});
