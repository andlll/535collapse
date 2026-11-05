// Minimappa (minimap.js, §9.109-§9.110): icone per oggetto, angoli del
// riquadro della view che negli angoli della minimappa ne seguono la curva.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mmIcon, isWall, viewRadii } from "../src/minimap.js";

test("icone per oggetto, mura e porte linee", () => {
  assert.equal(mmIcon("casa"), "mm_casa");
  assert.equal(mmIcon("enemy_house"), "mm_casa");
  assert.equal(mmIcon("enemy_mulino"), "mm_barn");
  assert.equal(mmIcon("monastero"), "mm_chiesa");
  assert.equal(mmIcon("castello_fond"), "mm_castello");
  assert.equal(mmIcon("oodl"), null);
  // [§9.110] le risorse; le rovine non sono castelli, torri, chiese
  assert.equal(mmIcon("miniera_oro"), "mm_miniera");
  assert.equal(mmIcon("pietr_piccolo"), "mm_stone");
  assert.equal(mmIcon("castelloruin"), "mm_ruin");
  assert.equal(mmIcon("torreruin"), "mm_ruin");
  assert.ok(isWall("mura_ori_fond") && isWall("enemy_porta_vert") && !isWall("casa"));
});

test("riquadro della view: raggio 5, e negli angoli quello della minimappa", () => {
  const P = [20, 500, 253, 700], R = 40;
  // in mezzo: tutti 5
  assert.deepEqual(viewRadii(100, 550, 150, 600, ...P, R), [5, 5, 5, 5]);
  // nell'angolo in alto a sinistra (tocca i due lati): lo stesso raggio
  assert.deepEqual(viewRadii(20, 500, 80, 540, ...P, R), [R, 5, 5, 5]);
  // a 10 px dai due lati: concentrico (raggio 30)
  assert.equal(viewRadii(30, 510, 90, 550, ...P, R)[0], 30);
  // in basso a destra
  assert.deepEqual(viewRadii(200, 660, 253, 700, ...P, R), [5, 5, R, 5]);
});
