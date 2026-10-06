// Suggerimenti e dialoghi (hints.js): coerenza delle tabelle contro gli
// oggetti del progetto e regola "una volta sola, se non c'e' gia' una
// finestra aperta" [C].
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HINTS, DIALOGS, HINT_NAMES, DIALOG_NAMES, hintOnce } from "../src/hints.js";

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
  const w = { g: { woodhint: 0 }, number: () => open, create: (n) => { created.push(n); open++; } };
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
