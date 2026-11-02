// [§9.100] Foci: un fiume che parte dentro un altro non si stringe a punta,
// e le rive di ciascuno dentro l'acqua dell'altro non si disegnano.
import { test } from "node:test";
import assert from "node:assert/strict";
import { riverGeometry, riverJoin } from "../src/rivers.js";

test("§9.100 foce: niente punta, rive nascoste dentro l'altro fiume", () => {
  const room = [4000, 4000];
  const main = { width: 150, pts: [[2000, 200], [2000, 1500], [2000, 3800]] };   // da nord a sud
  const branch = { width: 120, pts: [[2000, 1500], [2800, 1300], [3600, 1400]] }; // parte dal principale
  const [gm, gb] = riverJoin([main, branch], (rv) => riverGeometry({ ...rv, room }));
  // la diramazione all'inizio e' larga come altrove (niente punta)
  const span = (g, k) => Math.hypot(g.L[k].x - g.R[k].x, (g.L[k].y - g.R[k].y) / 0.62);
  assert.ok(span(gb, 0) > 90, `larga ${span(gb, 0)} alla foce`);
  // le sue rive all'inizio (dentro il principale) sono nascoste, piu' avanti no
  assert.ok(gb.L[0].hidden && gb.R[0].hidden);
  assert.ok(!gb.L[gb.L.length - 1].hidden && !gb.R[gb.R.length - 1].hidden);
  // la riva est del principale e' nascosta solo dove sbocca la diramazione
  const east = gm.L[0].x > gm.R[0].x ? gm.L : gm.R;
  const hidden = east.filter((e) => e.hidden);
  assert.ok(hidden.length > 0 && hidden.length < east.length / 4);
  assert.ok(hidden.every((e) => Math.abs(e.y - 1500 * 1) < 200 || Math.abs(e.y - 1450) < 250));
  // senza altri fiumi nulla e' nascosto
  const [solo] = riverJoin([main], (rv) => riverGeometry({ ...rv, room }));
  assert.ok([...solo.L, ...solo.R].every((e) => !e.hidden));
});
