// Test a passi della logica del manager contro i numeri del GML
// (src/objects/manager/). node --test, nessuna dipendenza.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Alarms } from "../src/alarms.js";
import { Manager } from "../src/manager.js";
import { newGlobals } from "../src/state.js";

const fakeInput = () => ({ pressed: new Set(), released: new Set(), down: new Set(),
                           mousePressed: [false, false, false], mouseReleased: [false, false, false], x: 0, y: 0 });
const fakeCam = () => ({ x: 0, y: 0, w: 1280, h: 720, cssW: 1280, cssH: 720, scaleview: 1, setScale(s) { this.scaleview = Math.round(Math.min(1.5, Math.max(1, s)) * 10) / 10; } });

function run(m, steps) {
  const input = fakeInput(), cam = fakeCam();
  for (let i = 0; i < steps; i++) {
    m.alarms();
    m.keys(input, cam);
    m.mouse(input, 0, 0);
    m.step(input, cam, 7000, 7000);
  }
}

test("alarm: 1 scatta al passo dopo, 0 e -1 mai, l'evento puo' riarmare", () => {
  const a = new Alarms(3);
  const fired = [];
  a.set(0, 1); a.set(1, 0); a.set(2, -1);
  a.tick((i) => fired.push(i));
  assert.deepEqual(fired, [0]);
  assert.equal(a.get(0), -1);
  a.set(0, 3);
  let n = 0;
  for (let s = 0; s < 3; s++) a.tick(() => n++);
  assert.equal(n, 1);
});

test("risorse iniziali decise dall'autore e tetti di manager Step", () => {
  const g = newGlobals("match");
  assert.deepEqual([g.food, g.wood, g.gold, g.stone, g.pop, g.popcap], [100, 50, 50, 0, 0, 0]);
  const m = new Manager("match", g);
  Object.assign(g, { food: 20000, wood: 20000, gold: 20000, stone: 20000, popcap: 500 });
  run(m, 1);
  assert.deepEqual([g.food, g.wood, g.gold, g.stone, g.popcap], [9999, 9999, 9999, 20000, 99]);
});

test("giorno/notte: 6000 passi di giorno, rampa da 0,005 a passo, 2000 di notte, poi 4000", () => {
  const g = newGlobals("match");
  const m = new Manager("match", g);
  m.al.set(4, -1); // niente pioggia nel test
  let step = 0, nightStart = -1, full = -1, back = -1, day = -1;
  while (step < 20000) {
    run(m, 1); step++;
    if (nightStart < 0 && g.night > 0) nightStart = step;
    if (full < 0 && g.night >= 1) full = step;
    if (full > 0 && back < 0 && g.night < 1) back = step;
    if (back > 0 && day < 0 && g.night < 0) day = step;
  }
  assert.equal(nightStart, 6000);
  assert.ok(full - nightStart >= 199 && full - nightStart <= 201, `rampa ${full - nightStart}`);
  // alarm[1]=2000 armato al passo in cui night>=1 viene rilevato (quello dopo la rampa)
  assert.ok(back - full >= 2000 && back - full <= 2002, `notte ${back - full}`);
  assert.ok(day - back >= 199 && day - back <= 202, `rampa di ritorno ${day - back}`);
});

test("lvl01 parte di notte e ci resta a lungo; lvl02 comincia subito a schiarire", () => {
  const g1 = newGlobals("lvl01"); const m1 = new Manager("lvl01", g1);
  run(m1, 5000);
  assert.ok(g1.night >= 1);
  const g2 = newGlobals("lvl02"); const m2 = new Manager("lvl02", g2);
  run(m2, 2);
  assert.ok(g2.night < 1);
});

test("orologio: un secondo ogni 60 passi", () => {
  const g = newGlobals("match"); const m = new Manager("match", g);
  run(m, 60 * 61 + 1);
  assert.deepEqual([g.minutes, g.seconds], [1, 1]);
});

test("trucchi: V + Alt + F/W/S/Q/P, e solo con entrambi tenuti", () => {
  const g = newGlobals("match"); const m = new Manager("match", g);
  const input = fakeInput(), cam = fakeCam();
  const press = (...k) => { input.pressed = new Set(k); m.keys(input, cam); input.pressed = new Set(); };
  press(70); // F senza modificatori
  assert.equal(g.food, 100);
  press(86, 18); // V e Alt
  press(70); press(87); press(83); press(81);
  assert.deepEqual([g.food, g.wood, g.stone, g.gold], [1100, 1050, 1000, 1050]);
});

test("zoom: X/Z fra 1,0 e 1,5; con Ctrl cambiano la scala della minimappa", () => {
  const g = newGlobals("match"); const m = new Manager("match", g);
  const input = fakeInput(), cam = fakeCam();
  for (let i = 0; i < 10; i++) { input.pressed = new Set([88]); m.keys(input, cam); }
  assert.equal(g.scaleview, 1.5);
  input.pressed = new Set([17]); m.keys(input, cam);
  input.pressed = new Set([88]); m.keys(input, cam);
  assert.equal(g.sz, 31);
});
