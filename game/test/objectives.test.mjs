// [§9.172, richiesta dell'autore] Il suono degli obiettivi (endgame.js):
// una riga nuova, una spuntata, un "(n/m)" che sale; non i numeri che
// cambiano da soli (tempi, vite, percentuali, quanti ne restano).
import { test } from "node:test";
import assert from "node:assert/strict";
import { objectiveSignature as sig, objectiveNews as news } from "../src/endgame.js";

const L = (...rows) => rows.map(([text, done = 0]) => [58, text, done]);

test("§9.172 quando suonano gli obiettivi", () => {
  const a = sig(L(["Free the villages under attack (2/7)"], ["Destroy all the enemy buildings"]));
  assert.equal(news(a, a), false);
  // un ostaggio liberato in piu': parziale
  assert.equal(news(a, sig(L(["Free the villages under attack (3/7)"], ["Destroy all the enemy buildings"]))), true);
  // spuntato
  assert.equal(news(a, sig(L(["Free the villages under attack (2/7)"], ["Destroy all the enemy buildings", 103]))), true);
  // una riga nuova
  assert.equal(news(a, sig(L(["Free the villages under attack (2/7)"], ["Destroy all the enemy buildings"], ["Use the barracks"]))), true);
  // una riga che sparisce, i numeri che cambiano da soli: niente
  assert.equal(news(a, sig(L(["Free the villages under attack (2/7)"]))), false);
  const t = sig(L(["Defend the monastery: 4:32"], ["Monastery: 2900 / 3000 (lost below half)"], ["Repair the bridge (45%)"], ["Destroy the enemy city (40 buildings left)"]));
  assert.equal(news(t, sig(L(["Defend the monastery: 4:31"], ["Monastery: 2800 / 3000 (lost below half)"], ["Repair the bridge (46%)"], ["Destroy the enemy city (39 buildings left)"]))), false);
  // un conto che scende non suona (n/m solo quando sale)
  assert.equal(news(sig(L(["Towers (2/5)"])), sig(L(["Towers (1/5)"]))), false);
});
