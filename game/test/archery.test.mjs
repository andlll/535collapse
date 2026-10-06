// §6.4: linea di tiro degli arcieri, bersaglio con la linea libera, punto di
// tiro nei paraggi col guinzaglio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/world.js";
import { Pathing } from "../src/pathing.js";
import { shootable, firingSpot, LEASH, towerTarget } from "../src/archery.js";

const unit = { kind: 1, bbox: [0, 0, 31, 31], origin: [16, 16] };
const house = { kind: 1, bbox: [0, 0, 223, 132], origin: [112, 66] };
const objects = {
  ally_arciere: { sprite: "u", mask: "u", parents: ["ally_unit"], depth: 0, solid: true },
  enemy_warrior: { sprite: "u", mask: "u", parents: ["enemy_unit", "enemy"], depth: 0, solid: true },
  ocr_25: { sprite: "h", mask: "h", parents: ["natural_parent"], depth: 0, solid: true },
  albero: { sprite: "h", mask: "h", parents: ["natural_parent"], depth: 0, solid: true },
  torre: { sprite: "h", mask: "h", parents: ["ally_build", "ally"], depth: 0, solid: true },
  mura_ori: { sprite: "h", mask: "h", parents: ["ally_build", "ally"], depth: 0, solid: true },
  montagna_1: { sprite: "h", mask: "h", parents: ["natural_parent"], depth: 0, solid: true },
  pietra_grande: { sprite: "h", mask: "h", parents: ["stone_parent", "natural_parent"], depth: 0, solid: true },
  fiume_1: { sprite: "h", mask: "h", parents: ["natural_parent"], depth: 0, solid: true },
};
const mk = () => {
  const w = new World({ objects, masks: { u: unit, h: house }, assets: { sprites: {} }, g: {}, roomW: 3200, roomH: 3200 });
  const p = new Pathing(w, 3200, 3200);
  return [w, p];
};

test("§6.4 linea di tiro: gli edifici fermano, le unita' e gli alberi no", () => {
  const [w, p] = mk();
  assert.equal(w.shotClear(1000, 1300, 1000, 900), true);
  w.create("albero", 1000, 1100);
  assert.equal(w.shotClear(1000, 1300, 1000, 900), true);       // un albero non ferma
  w.create("enemy_warrior", 1000, 1150);
  assert.equal(w.shotClear(1000, 1300, 1000, 900), true);       // un'unita' nemmeno
  const h = w.create("ocr_25", 1500, 1100);
  p.markInstance(h, 1000);
  assert.equal(w.shotClear(1500, 1300, 1500, 900), false);      // un edificio si'
  assert.equal(w.shotClear(1500, 1300, 1900, 900), true);       // di lato, libera
});

test("§6.4 bersaglio: il piu' vicino a tiro con la linea libera", () => {
  const [w, p] = mk();
  const a = w.create("ally_arciere", 1500, 1300);
  w.create("ocr_25", 1500, 1100);
  const hidden = w.create("enemy_warrior", 1500, 970);   // dietro l'edificio, il piu' vicino
  const open = w.create("enemy_warrior", 1800, 950);     // piu' lontano ma in vista
  const inRange = (o) => w.distanceToInstance(a, o) < 600;
  assert.equal(w.nearest(a.x, a.y, "enemy_unit"), hidden);
  assert.equal(shootable(w, a, "enemy_unit", inRange), open);
  w.destroy(open);
  assert.equal(shootable(w, a, "enemy_unit", inRange), null);
});

test("§6.4 punto di tiro: vicino, con la linea libera e mai oltre il guinzaglio", () => {
  const [w, p] = mk();
  const h = w.create("ocr_25", 1500, 1100); p.markInstance(h, 1000);
  const a = w.create("ally_arciere", 1500, 1290);
  const corner = w.create("enemy_warrior", 1650, 970);   // dietro lo spigolo
  const spot = firingSpot(w, p, a, corner, 540);
  assert.ok(spot, "c'e' un punto di tiro");
  assert.ok(w.shotClear(spot[0], spot[1], corner.x, corner.y));
  assert.ok(Math.hypot(spot[0] - a.anchorX, spot[1] - a.anchorY) <= LEASH);
  // dietro il centro dell'edificio: servirebbe spostarsi di 550 px, non si va
  const b = w.create("ally_arciere", 1100, 1290);
  const h2 = w.create("ocr_25", 1100, 1100); p.markInstance(h2, 1000);
  const middle = w.create("enemy_warrior", 1100, 970);
  assert.equal(firingSpot(w, p, b, middle, 540), null);
  // l'ancora resta dove ha cominciato: un secondo cerca non va piu' lontano
  w.setPos(a, spot[0], spot[1]);
  const far = w.create("enemy_warrior", 2400, 1000);
  const s2 = firingSpot(w, p, a, far, 540);
  if (s2) assert.ok(Math.hypot(s2[0] - a.anchorX, s2[1] - a.anchorY) <= LEASH);
});

test("§6.5 edifici che tirano: non li fermano se stessi ne' le mura; scelgono il bersaglio in vista", () => {
  const [w] = mk();
  const t = w.create("torre", 1500, 1500);
  const hidden = w.create("enemy_warrior", 1500, 1170);  // dietro una casa, il piu' vicino
  w.create("ocr_25", 1500, 1310);
  assert.equal(towerTarget(w, t, "enemy_unit", 600), null);
  const open = w.create("enemy_warrior", 1900, 1250);    // piu' lontano, in vista
  assert.equal(w.nearest(t.x, t.y, "enemy_unit"), hidden);
  assert.equal(towerTarget(w, t, "enemy_unit", 600), open);
  // un muro in mezzo non conta per chi tira da un edificio (per un arciere si')
  const t2 = w.create("torre", 2600, 1500);
  const e2 = w.create("enemy_warrior", 2600, 1150);
  w.create("mura_ori", 2600, 1320);
  assert.equal(towerTarget(w, t2, "enemy_unit", 600), e2);
  assert.equal(w.shotClear(2600, 1500, 2600, 1150), false);
});

test("§6.6 montagne e rovine (anche quelle da cui si estrae la pietra) fermano; boschi e fiumi no", () => {
  const [w] = mk();
  const line = (x) => w.shotClear(x, 1300, x, 900);
  w.create("montagna_1", 500, 1100);
  w.create("pietra_grande", 1000, 1100);
  w.create("albero", 1500, 1100);
  w.create("fiume_1", 2000, 1100);
  assert.equal(line(500), false);
  assert.equal(line(1000), false);
  assert.equal(line(1500), true);
  assert.equal(line(2000), true);
});
