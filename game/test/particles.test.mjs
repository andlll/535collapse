// Motore delle particelle (particles.js) e fiamme degli edifici
// (effects.js, fireStep) contro i numeri del GML [C] e le regole del runner
// annotate in particles.js [I].
import { test } from "node:test";
import assert from "node:assert/strict";
import { Particles, partType } from "../src/particles.js";
import { fireStep, fireStop, FIRE } from "../src/effects.js";

test("burst: N particelle dentro la regione, per ogni forma", () => {
  const P = new Particles();
  const ps = P.systemCreate(0);
  const t = partType({ life: [10, 10] });
  const check = (shape, ok) => {
    const em = P.emitterCreate(ps);
    P.region(em, 100, 300, 50, 150, shape, "gaussian");
    P.systemClear(ps);
    P.burst(ps, em, t, 200);
    assert.equal(ps.parts.length, 200);
    for (const q of ps.parts) assert.ok(ok((q.x - 200) / 100, (q.y - 100) / 50), `${shape} ${q.x},${q.y}`);
  };
  check("rectangle", (dx, dy) => Math.abs(dx) <= 1 && Math.abs(dy) <= 1);
  check("ellipse", (dx, dy) => dx * dx + dy * dy <= 1 + 1e-9);
  check("diamond", (dx, dy) => Math.abs(dx) + Math.abs(dy) <= 1 + 1e-9);
  check("line", (dx, dy) => Math.abs(dy - dx) < 1e-9);
});

test("vita: muoiono dopo `life` passi e tornano nella riserva", () => {
  const P = new Particles();
  const ps = P.systemCreate(0);
  const em = P.emitterCreate(ps);
  P.burst(ps, em, partType({ life: [5, 5] }), 10);
  for (let k = 0; k < 4; k++) P.step();
  assert.equal(P.count, 10);
  P.step();
  assert.equal(P.count, 0);
  assert.equal(P.pool.length, 10);
  P.burst(ps, em, partType({ life: [5, 5] }), 3);
  assert.equal(P.pool.length, 7);
});

test("moto: velocita' e direzione, poi gravita' sommata come vettore", () => {
  const P = new Particles();
  const ps = P.systemCreate(0);
  P.create(ps, 0, 0, partType({ speed: [2, 2, 0, 0], direction: [0, 0, 0, 0] }), 1);
  P.step();
  P.step();
  assert.ok(Math.abs(ps.parts[0].x - 4) < 1e-9 && Math.abs(ps.parts[0].y) < 1e-9);
  const ps2 = P.systemCreate(0);
  P.create(ps2, 0, 0, partType({ gravity: [0.2, 270] }), 1);
  P.step();
  assert.ok(Math.abs(ps2.parts[0].y - 0.2) < 1e-9); // 270 = giu'
  P.step();
  assert.ok(Math.abs(ps2.parts[0].y - 0.6) < 1e-9);
});

test("stream: n per passo, frazionario = ceil (runner HTML5), 0 ferma", () => {
  const P = new Particles();
  const ps = P.systemCreate(0);
  const em = P.emitterCreate(ps);
  const t = partType({ life: [1000, 1000] });
  P.stream(em, t, 6);
  P.step();
  assert.equal(ps.parts.length, 6);
  P.stream(em, t, 0.1);
  P.step();
  assert.equal(ps.parts.length, 7);
  P.stream(em, t, 0);
  P.step();
  assert.equal(ps.parts.length, 7);
});

test("destroy e releaseWhenEmpty", () => {
  const P = new Particles();
  const a = P.systemCreate(0), b = P.systemCreate(0);
  const em = P.emitterCreate(a);
  P.burst(a, em, partType({ life: [2, 2] }), 5);
  P.burst(b, P.emitterCreate(b), partType({ life: [2, 2] }), 4);
  P.releaseWhenEmpty(b);
  P.systemDestroy(a);
  assert.equal(P.count, 4);
  P.step(); P.step();
  assert.equal(P.count, 0);
  assert.equal(P.systems.length, 0);
});

test("fuoco degli edifici: due sistemi, x visible, vita delle fiamme davanti coi danni", () => {
  const w = { particles: new Particles() };
  const casa = { x: 1000, y: 800, visible: true, onfire: 1, firestarted: 0, life: 100 };
  fireStep(casa, w, "casa");
  assert.equal(casa.firestarted, 1);
  assert.equal(casa.fire_ps.depth, -799);
  assert.equal(casa.fire_psf.depth, -801);
  assert.equal(casa.fire_ps.emitters[0].n, 6);
  assert.equal(casa.fire_psf.emitters[0].n, 3);
  assert.deepEqual(casa.fire_psf.emitters[0].type.life, [25, 30]); // (150-100)/2, (160-100)/2
  assert.deepEqual(casa.fire_ps.emitters[0].type.life, [25, 50]);
  const nemica = { x: 0, y: 0, visible: false, onfire: 1, firestarted: 0, life: 200 };
  fireStep(nemica, w, "enemy_caserma");
  assert.equal(nemica.fire_ps.emitters[0].n, 0); // 8*visible
  fireStop(casa, w);
  assert.equal(casa.fire_ps, null);
  assert.equal(FIRE.campo.front, null);
});
