// [§9.99] Macchie: il poligono (anche concavo) si divide in triangoli che lo
// coprono tutto e una volta sola; la sfumatura sta fuori dal bordo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { triangulate, patchGeometry } from "../src/rivers.js";

const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return Math.abs(a) / 2; };
const inside = (x, y, P) => { let s = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) s = !s; return s; };

test("§9.99 triangoli di un poligono concavo, nei due versi", () => {
  const U = [[0, 0], [300, 0], [300, 200], [200, 200], [200, 80], [100, 80], [100, 200], [0, 200]]; // una U
  for (const P of [U, [...U].reverse()]) {
    const tri = triangulate(P);
    assert.equal(tri.length, P.length - 2);
    const sum = tri.reduce((s, [a, b, c]) => s + area([P[a], P[b], P[c]]), 0);
    assert.ok(Math.abs(sum - area(P)) < 1e-6, `area ${sum} contro ${area(P)}`);
  }
});

test("§9.99 macchia: bordo fitto, sfumatura fuori, valori predefiniti", () => {
  const g = patchGeometry({ pts: [[0, 0], [400, 0], [400, 300], [0, 300]], feather: 50 });
  assert.equal(g.bg, "city2");
  assert.equal(g.alpha, 1);
  assert.ok(g.P.length >= 80, "un punto ogni 16 px");
  for (const [x, y] of g.out) assert.ok(!inside(x, y, [[0, 0], [400, 0], [400, 300], [0, 300]]), "sfumatura fuori");
  const d = g.out.map(([x, y], k) => Math.hypot(x - g.P[k][0], y - g.P[k][1]));
  assert.ok(Math.min(...d) >= 50 * 0.4 - 1e-6 && Math.max(...d) <= 50 * 1.6 + 1e-6 && Math.max(...d) - Math.min(...d) > 20, "larga 0,4-1,6 volte, irregolare");
});
