// Nebbia e notte (fog.js) contro i numeri di manager Draw_End [C]: raggi
// delle ellissi di giorno e di notte, forme per tipo di edificio, scoperta
// persistente, trucco della nebbia, colore della notte e fuochi.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FogMap, FOG_CELL, SHADE_BLACK, SHADE_FOG, SHADE_VISIBLE, shadeOf, nightColour, nightLights } from "../src/fog.js";

const PARENTS = {
  ally_omino: ["ally_unit", "ally"], castello: ["ally_build", "ally"], centro: ["ally_build", "ally"],
  mura_vert: ["ally_build", "ally"], mura_ori: ["ally_build", "ally"], casa: ["ally_wooden", "ally_build", "ally"],
  palo_1: ["ally"], o_statua1: ["natural_parent"], firestarter: ["sfx_parent"], fire_bullet: [],
  ally_warrior: ["ally_infantry", "ally_militare", "ally_unit", "ally"],
};

function inst(object, x, y, extra = {}) {
  return { object, parents: PARENTS[object] || [], x, y, alive: true, ...extra };
}

function world(list, g = {}, room = "match") {
  const is = (i, n) => i.object === n || i.parents.includes(n);
  return {
    g: { night: 0, fogville: 1, frame: 0, ...g }, room, is,
    *all(n) { for (const i of list) if (i.alive && is(i, n)) yield i; },
  };
}

const ROOM = 4000;
const cellAt = (m, arr, x, y) => arr[Math.floor(y / FOG_CELL) * m.gw + Math.floor(x / FOG_CELL)];

test("stamp: pieno dentro, ~meta' sul bordo, vuoto fuori", () => {
  const m = new FogMap(ROOM, ROOM);
  // centro su un centro di cella (808 = 50,5 x 16); bordo basso a 920, che e'
  // il centro della riga 57
  m.stamp(m.explored, 808, 808, 200, 112);
  assert.equal(cellAt(m, m.explored, 808, 808), 255);
  assert.equal(cellAt(m, m.explored, 808, 904), 255);           // 16 px dentro
  assert.ok(Math.abs(cellAt(m, m.explored, 808, 920) - 128) <= 1); // sul bordo
  assert.equal(cellAt(m, m.explored, 808, 936), 0);             // 16 px fuori
  assert.equal(cellAt(m, m.explored, 808 + 230, 808), 0);
});

test("scoperta: ellisse 400x240 di giorno, 200x120 di notte (unita')", () => {
  const day = new FogMap(ROOM, ROOM), night = new FogMap(ROOM, ROOM);
  day.update(world([inst("ally_omino", 2000, 2000)]));
  night.update(world([inst("ally_omino", 2000, 2000)], { night: 1 }));
  assert.ok(day.isExplored(2000 + 380, 2000));
  assert.ok(!day.isExplored(2000 + 420, 2000));
  assert.ok(day.isExplored(2000, 2000 + 220));
  assert.ok(night.isExplored(2000 + 180, 2000));
  assert.ok(!night.isExplored(2000 + 220, 2000));
  assert.ok(!night.isExplored(2000, 2000 + 140));
});

test("forme: castello 1000x600, centro 600x360, mura verticali spostate in alto", () => {
  const m = new FogMap(ROOM, ROOM);
  m.update(world([inst("castello", 1500, 1500), inst("centro", 3000, 800), inst("mura_vert", 3000, 3000)]));
  assert.ok(m.isExplored(1500 + 980, 1500));
  assert.ok(m.isExplored(1500, 1500 + 580));
  assert.ok(m.isExplored(3000 + 580, 800));
  assert.ok(!m.isExplored(3000 + 620, 800));
  // mura_vert di giorno: da y-490 a y+240
  assert.ok(m.isExplored(3000, 3000 - 480));
  assert.ok(m.isExplored(3000, 3000 + 230));
  assert.ok(!m.isExplored(3000, 3000 + 260));
});

test("composizione: vista, gia' vista (110), mai vista (255)", () => {
  const u = inst("ally_omino", 1000, 1000);
  const w = world([u]);
  const m = new FogMap(ROOM, ROOM);
  m.update(w);
  u.x = 3000; // si sposta: la zona vecchia resta scoperta
  m.update(w);
  const reg = m.region(0, 0, ROOM, ROOM);
  m.compose(w, reg);
  assert.equal(cellAt(m, m.shade, 1000, 1000), SHADE_FOG);
  assert.equal(cellAt(m, m.shade, 3000, 1000), SHADE_VISIBLE);
  assert.equal(cellAt(m, m.shade, 2000, 3000), SHADE_BLACK);
  assert.equal(shadeOf(255, 255), 0);
  assert.equal(shadeOf(255, 0), 110);
  assert.equal(shadeOf(0, 255), 255);
});

test("trucco della nebbia e menu: niente scoperta", () => {
  for (const [g, room] of [[{ fogville: 0 }, "match"], [{}, "menu"]]) {
    const m = new FogMap(ROOM, ROOM);
    m.update(world([inst("ally_omino", 1000, 1000)], g, room));
    assert.ok(!m.isExplored(1000, 1000));
  }
});

test("statue: scoprono e danno la vista solo se attive (n.55 corretto)", () => {
  const s = inst("o_statua1", 1000, 1000, { attiva: 0 });
  const w = world([s]);
  const m = new FogMap(ROOM, ROOM);
  m.update(w);
  assert.ok(!m.isExplored(1000, 1000));
  s.attiva = 1;
  m.update(w);
  assert.ok(m.isExplored(1000, 1000));
  m.compose(w, m.region(500, 500, 1000, 1000));
  assert.equal(cellAt(m, m.shade, 1000, 1000), SHADE_VISIBLE);
});

test("le anteprime dei muri non vedono (n.54 corretto)", () => {
  const m = new FogMap(ROOM, ROOM);
  m.update(world([{ object: "oodl", parents: ["mura_ori", "ally_build", "ally"], x: 1000, y: 1000, alive: true }]));
  assert.ok(!m.isExplored(1000, 1000));
});

test("al tramonto l'ellisse rimpicciolisce senza ricoprire; all'alba si riallarga", () => {
  const u = inst("ally_omino", 2000, 2000);
  const w = world([u], { night: 1 });
  const m = new FogMap(ROOM, ROOM);
  m.update(w);
  assert.ok(!m.isExplored(2000 + 300, 2000));
  w.g.night = 0;
  m.update(w);
  assert.ok(m.isExplored(2000 + 300, 2000));
});

test("colore della notte: merge_colour(c_black, c_orange, night)", () => {
  assert.equal(nightColour(0), 0);
  assert.equal(nightColour(-0.005), 0);
  assert.equal(nightColour(1), 0x40a0ff);
  assert.equal(nightColour(0.5), (128 | (80 << 8) | (32 << 16)));
});

test("fuochi: bracieri, edifici in fiamme, freccia e fante che la accende", () => {
  const w = world([
    inst("firestarter", 100, 200),
    inst("casa", 500, 500, { onfire: 1, life: 60, slife: 120 }),
    inst("casa", 900, 500, { onfire: 0, life: 60, slife: 120 }),
    inst("fire_bullet", 50, 60),
    inst("ally_warrior", 700, 700, { action: 6, step: 0 }),
    inst("ally_warrior", 800, 800, { action: 6, step: 2 }),
  ], { frame: 10 });
  const l = nightLights(w);
  assert.equal(l.length, 4);
  assert.deepEqual(l[0].slice(0, 2), [100, 200]);
  assert.ok(Math.abs(l[0][2] - (3 + 0.15 * Math.sin(100 + 10 * 0.17))) < 1e-9);
  assert.ok(Math.abs(l[1][2] - (3.5 + 0.15 * Math.sin(500 + 10 * 0.17))) < 1e-9);
  assert.deepEqual(l[2], [50, 60, 1]);
  assert.deepEqual(l[3], [700, 633, 1]);
});
