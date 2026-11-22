// Suggerimenti e dialoghi (hints.js): coerenza delle tabelle contro gli
// oggetti del progetto e regola "una volta sola, se non c'e' gia' una
// finestra aperta" [C].
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HINTS, DIALOGS, HINT_NAMES, DIALOG_NAMES, hintOnce, nightHint } from "../src/hints.js";
import { newGlobals } from "../src/state.js";

const objects = new Set(JSON.parse(readFileSync(new URL("../../data/objects.json", import.meta.url))).map((o) => o.name));

test("tabelle: tutti gli oggetti hint_* e dialogo_* del progetto, seguiti esistenti", () => {
  for (const n of objects) {
    if (n.startsWith("hint_")) assert.ok(HINT_NAMES.includes(n), n);
    if (n.startsWith("dialogo_")) assert.ok(DIALOG_NAMES.includes(n), n);
  }
  for (const [n, H] of Object.entries(HINTS)) if (H.next) assert.ok(HINTS[H.next], `${n} -> ${H.next}`);
  for (const [n, D] of Object.entries(DIALOGS)) {
    if (D.next) assert.ok(DIALOGS[D.next], `${n} -> ${D.next}`);
    assert.ok(objects.has(D.who[0]), `${n}: ${D.who[0]}`);
    assert.ok(D.text.length > 0);
  }
});

test("hintOnce: una volta sola e mai con un'altra finestra aperta", () => {
  const created = [];
  let open = 0;
  const w = { g: { woodhint: 0, hint: 1 }, number: () => open, create: (n) => { created.push(n); open++; } };
  hintOnce(w, "hint_legna", "woodhint", 0, 0, false);
  assert.equal(created.length, 0);
  open = 1;
  hintOnce(w, "hint_legna", "woodhint", 0, 0);
  assert.equal(created.length, 0);
  open = 0;
  hintOnce(w, "hint_legna", "woodhint", 0, 0);
  hintOnce(w, "hint_legna", "woodhint", 0, 0);
  assert.deepEqual(created, ["hint_legna"]);
  assert.equal(w.g.woodhint, 1);
});

// [§9.165, richiesta dell'autore] accesi solo nel tutorial; spenti non
// nascono e la volta resta per quando si riaccendono
test("§9.165 suggerimenti spenti fuori dal tutorial", () => {
  assert.equal(newGlobals("match").hint, 1);
  for (const r of ["lvl01", "lvl04", "lvl06", "sk_padus"]) assert.equal(newGlobals(r).hint, 0, r);
  const created = [];
  const w = { g: { woodhint: 0, hint: 0 }, number: () => 0, create: (n) => created.push(n) };
  hintOnce(w, "hint_legna", "woodhint", 0, 0);
  assert.deepEqual(created, []);
  assert.equal(w.g.woodhint, 0);
  w.g.hint = 1; // H
  hintOnce(w, "hint_legna", "woodhint", 0, 0);
  assert.deepEqual(created, ["hint_legna"]);
});

// [§9.165, segnalazione dell'autore] il suggerimento della notte quando e'
// notte davvero, non a tempo
test("§9.165 il suggerimento della notte quando e' notte", () => {
  const created = [];
  let dialog = false;
  const w = { g: { nighthint: 0, hint: 1, night: 0 }, mouse: { x: 0, y: 0 }, behaviours: { hint_night: {} },
              number: () => 0, exists: (n) => dialog && n === "dialogo_1_0", create: (n) => created.push(n) };
  nightHint(w);
  w.g.night = 0.6; nightHint(w); // al tramonto, non ancora
  assert.deepEqual(created, []);
  w.g.night = 1; dialog = true; nightHint(w); // un dialogo aperto: aspetta
  assert.deepEqual(created, []);
  dialog = false; nightHint(w); nightHint(w);
  assert.deepEqual(created, ["hint_night"]);
  assert.equal(w.g.nighthint, 1);
});
