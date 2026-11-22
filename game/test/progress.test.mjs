// [§9.164] Un livello della campagna non sbloccato non si apre cambiando
// l'indirizzo (?room=lvl05): app.js chiede canPlay prima di caricare la room.
import { test } from "node:test";
import assert from "node:assert/strict";
import { levelOf, canPlay } from "../src/progress.js";

test("§9.164 il numero del livello di una room", () => {
  assert.equal(levelOf("lvl01"), 1);
  assert.equal(levelOf("lvl06"), 6);
  for (const r of ["menu", "match", "sk_padus", "", null, undefined, "xlvl03"]) assert.equal(levelOf(r), 0, String(r));
});

test("§9.164 si gioca solo fino al livello sbloccato", () => {
  assert.ok(canPlay("lvl01", 1)); // il primo sempre
  assert.ok(canPlay("lvl01", 0));
  assert.ok(!canPlay("lvl02", 1));
  assert.ok(canPlay("lvl03", 3));
  assert.ok(!canPlay("lvl04", 3));
  assert.ok(!canPlay("lvl06", undefined));
  // tutorial, menu e schermaglie non sono livelli della campagna
  for (const r of ["menu", "match", "sk_padus"]) assert.ok(canPlay(r, 1), r);
});
