// [§9.213] Il generatore delle montagne (src/mountains.js): sempre uguale per
// lo stesso seme, la cresta dove l'ha messa l'autore, i piedi delle cime
// dentro la base, la base disegnata a mano rispettata.
import test from "node:test";
import assert from "node:assert/strict";
import { mountainGeometry, insidePoly } from "../src/mountains.js";
import { ISO } from "../src/rivers.js";

const M = { crest: [[300, 110], [520, 60], [760, 90]], width: 420, height: 260, seed: 4 };

test("stesso seme, stessa montagna; seme diverso, montagna diversa", () => {
  const a = JSON.stringify(mountainGeometry(M)), b = JSON.stringify(mountainGeometry({ ...M }));
  assert.equal(a, b);
  assert.notEqual(a, JSON.stringify(mountainGeometry({ ...M, seed: 5 })));
});

test("le cime si vedono dove le ha messe l'autore, i piedi sono nella base", () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const g = mountainGeometry({ ...M, seed });
    // le cime dell'autore sono il primo, uno ogni tanto, e l'ultimo nodo
    // della cresta: il primo e l'ultimo
    assert.deepEqual(g.crest[0].map(Math.round), M.crest[0]);
    assert.deepEqual(g.crest[g.crest.length - 1].map(Math.round), M.crest[2]);
    for (const [x, y] of g.feet) assert.ok(insidePoly(x, y, g.base), `seme ${seed}: piede ${x},${y} fuori dalla base`);
    // le cime dell'autore: il piede e' piu' in basso della cresta (sullo schermo)
    assert.ok(g.feet[0][1] > g.crest[0][1] + 200);
  }
});

test("facce e inchiostro ben fatti", () => {
  const g = mountainGeometry({ ...M, crest: [[400, 100]], detail: 1, rough: 1 });
  const faces = g.layers.filter((l) => l.face), inks = g.layers.filter((l) => l.ink);
  assert.ok(faces.length >= 3 && inks.length >= 3);
  for (const f of faces) {
    assert.ok(f.face.length >= 3);
    assert.ok(f.shade > 0.5 && f.shade <= 1);
    assert.ok(f.face.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
  }
  for (const l of inks) assert.ok(l.ink.every((p) => p.ink > 0 && Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test("la base disegnata a mano: il contorno resta vicino a quello dell'autore", () => {
  const base = [[120, 330], [230, 260], [420, 250], [600, 230], [820, 260], [930, 370], [880, 520], [700, 580], [560, 510], [420, 600], [220, 570]];
  const g = mountainGeometry({ ...M, base });
  // ogni punto del contorno frastagliato e' a meno di 60 px (sul terreno
  // steso) dal contorno dell'autore
  const seg = (p, a, b) => {
    const [px, py] = [p[0], p[1] / ISO], [ax, ay] = [a[0], a[1] / ISO], [bx, by] = [b[0], b[1] / ISO];
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  };
  for (const p of g.base) {
    const d = Math.min(...base.map((a, i) => seg(p, a, base[(i + 1) % base.length])));
    assert.ok(d < 60, `punto ${p} a ${d} px dalla base`);
  }
  for (const [x, y] of g.feet) assert.ok(insidePoly(x, y, base));
});
