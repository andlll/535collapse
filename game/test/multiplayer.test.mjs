// [§9.155] La partita a due (src/multiplayer.js): i gemelli del giocatore 2,
// le tabelle dei nomi delle due parti e lo specchio del mondo (i nomi
// tradotti negli argomenti, la cassa del giocatore 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { twinName, twinNames, nameMaps, twinObjects, mirrorWorld } from "../src/multiplayer.js";

const OBJ = {
  ally: { parents: [] }, ally_unit: { parents: ["ally"] }, ally_build: { parents: ["ally"] },
  ally_warrior: { parents: ["ally_infantry", "ally_militare", "ally_unit", "ally"], sprite: "ww73" },
  ally_infantry: { parents: ["ally_militare", "ally_unit", "ally"] }, ally_militare: { parents: ["ally_unit", "ally"] },
  centro: { parents: ["ally_build", "ally"], sprite: "cc_spr" }, casa_fond: { parents: ["ally_fondamenta", "ally_build", "ally"] },
  ally_fondamenta: { parents: ["ally_build", "ally"] }, arciere_bullet: { parents: [] }, albero: { parents: ["natural_parent"] },
  casa_clicker: { parents: ["clicker_parent"] }, enemy_unit: { parents: ["enemy"] },
};

test("§9.155 gemelli e nomi delle due parti", () => {
  assert.equal(twinName("ally_warrior"), "p2_warrior");
  assert.equal(twinName("centro"), "p2_centro");
  assert.equal(twinName("ally"), "p2");
  const t = twinNames(OBJ);
  for (const n of ["ally_warrior", "centro", "casa_fond", "arciere_bullet", "ally_unit"]) assert.ok(t.includes(n), n);
  for (const n of ["albero", "casa_clicker", "enemy_unit"]) assert.ok(!t.includes(n), n);
  const tw = twinObjects(OBJ, t);
  assert.deepEqual(tw.p2_warrior.parents, ["p2_infantry", "p2_militare", "p2_unit", "p2"]);
  assert.equal(tw.p2_warrior.sprite, "ww73"); // gli sprite del giocatore: il blu e' al disegno
  const { m1, m2 } = nameMaps(OBJ);
  assert.equal(m2.ally_unit, "p2_unit");
  assert.equal(m2.centro, "p2_centro");
  assert.equal(m2.enemy_unit, "ally_unit"); // per il blu il nemico e' il rosso
  assert.equal(m2.enemy_centro, "centro");
  assert.equal(m1.enemy_unit, "p2_unit"); // per il rosso il nemico e' il blu
  assert.equal(m1.ally_unit, undefined);
});

test("§9.155 lo specchio del mondo", () => {
  const seen = [];
  const world = {
    g: { food: 10, wood: 1, sel: 2, p2: { food: 99, wood: 5 } },
    all(name) { seen.push(["all", name]); return this._inner(name); },
    _inner(name) { seen.push(["inner", name]); return name; },
  };
  const { m2 } = nameMaps(OBJ);
  const w2 = mirrorWorld(world, m2, true);
  assert.equal(w2.all("ally_unit"), "p2_unit");
  // la chiamata interna (this._inner) non si traduce una seconda volta
  assert.deepEqual(seen, [["all", "p2_unit"], ["inner", "p2_unit"]]);
  assert.equal(w2.all("albero"), "albero");
  // la cassa: le risorse del giocatore 2 in global.p2, il resto comune
  assert.equal(w2.g.food, 99);
  w2.g.wood += 10;
  assert.equal(world.g.p2.wood, 15);
  assert.equal(world.g.wood, 1);
  w2.g.sel = 7;
  assert.equal(world.g.sel, 7);
});
