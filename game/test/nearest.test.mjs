// §6.3: instance_nearest con memoria (N1) e "vicino entro r" con i
// certificati di lontananza (N3), contro la formula originale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/world.js";

const mask = { kind: 1, bbox: [0, 0, 31, 31], origin: [16, 16] };
const objects = {
  ally_warrior: { sprite: "u", mask: "m", parents: ["ally_unit"], depth: 0, solid: true },
  albero: { sprite: "u", mask: "m", parents: ["natural_parent"], depth: 0, solid: true },
  palo_1: { sprite: "u", mask: null, parents: [], depth: 0, solid: false },
};
const mk = () => new World({ objects, masks: { m: mask, u: mask }, assets: { sprites: {} }, g: {}, roomW: 4000, roomH: 4000 });
// la formula originale: distance_to_object(instance_nearest(x, y, name)) < r
const ref = (w, i, name, r) => {
  let best = null, bd = Infinity;
  for (const o of w._list(name)) { if (!o.alive) continue; const d = (o.x - i.x) ** 2 + (o.y - i.y) ** 2; if (d < bd) { bd = d; best = o; } }
  return !!best && w.distanceToInstance(i, best) < r;
};
const endStep = (w) => { w._travel += w._stepMax; w._stepMax = 0; w._stepNo++; };

test("N1: la memoria di nearest vale solo col mondo fermo", () => {
  const w = mk();
  const a = w.create("ally_warrior", 100, 100), b = w.create("ally_warrior", 300, 100);
  assert.equal(w.nearest(250, 100, "ally_unit"), b);
  assert.equal(w.nearest(250, 100, "ally_unit"), b);      // ricordata
  w.setPos(a, 240, 100);                                  // qualcuno si muove
  assert.equal(w.nearest(250, 100, "ally_unit"), a);
  w.destroy(a);
  assert.equal(w.nearest(250, 100, "ally_unit"), b);
  const c = w.create("ally_warrior", 251, 100);
  assert.equal(w.nearest(250, 100, "ally_unit"), c);
});

test("N3: lontano per certo finche' nessuno puo' aver consumato il margine; stesso risultato sempre", () => {
  const w = mk();
  const tree = w.create("albero", 2000, 2000);
  const u = w.create("ally_warrior", 100, 100);
  let checks = 0;
  const step = () => { const r = w.nearWithin(tree, "ally_unit", 600); assert.equal(r, ref(w, tree, "ally_unit", 600)); checks++; endStep(w); return r; };
  assert.equal(step(), false);
  assert.ok(tree._far.ally_unit && tree._far.ally_unit.margin > 0); // certificato emesso
  // l'unita' cammina verso l'albero a 6 px per passo: il certificato scade
  // prima che possa sbagliare, e alla fine la risposta diventa "si'"
  let seen = false;
  for (let k = 0; k < 400; k++) { w.setPos(u, u.x + 6, u.y + 6); if (step()) { seen = true; break; } }
  assert.ok(seen, "l'albero deve rivelarsi");
  // un'unita' nuova accanto: l'epoca invalida subito
  const t2 = w.create("albero", 3500, 500);
  assert.equal(w.nearWithin(t2, "ally_unit", 600), ref(w, t2, "ally_unit", 600));
  w.create("ally_warrior", 3500, 700);
  assert.equal(w.nearWithin(t2, "ally_unit", 600), true);
  // un salto (teletrasporto) consuma il margine in un passo
  const t3 = w.create("albero", 3800, 3800);
  w.nearWithin(t3, "ally_unit", 300); endStep(w);
  const v = [...w.all("ally_unit")][0];
  w.setPos(v, 3800, 3700);
  assert.equal(w.nearWithin(t3, "ally_unit", 300), true);
  assert.ok(checks > 10);
});

test("N3: niente certificato con candidate a maschera non fissa; raggio oltre rmax ricontrolla", () => {
  const w = mk();
  const tree = w.create("albero", 2000, 2000);
  w.create("palo_1", 100, 100);
  w.nearWithin(tree, "palo_1", 200);
  assert.equal(tree._far.palo_1.margin, 0); // nessun certificato
  w.create("ally_warrior", 1500, 2000);
  assert.equal(w.nearWithin(tree, "ally_unit", 100, 200), false);
  assert.ok(tree._far.ally_unit.margin > 0);
  assert.equal(w.nearWithin(tree, "ally_unit", 600, 600), true); // r > rmax: non si usa il certificato
});
