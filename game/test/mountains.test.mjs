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

// [§9.214] i controlli dei punti (l'editor li rifiuta col perche') e delle
// mappe che arrivano da fuori
import { crestProblem, baseProblem, cleanMountain, triangulate, mountainCells, mountainAt } from "../src/mountains.js";
import { validateMap, newMap } from "../src/mapfile.js";

test("§9.214 la cresta: punti vicini, lontani, angoli stretti, incroci, quanti", () => {
  assert.equal(crestProblem([[0, 0]]), null);
  assert.equal(crestProblem([[0, 0], [300, 0], [600, 40]]), null);
  assert.equal(crestProblem([[0, 0], [20, 0]]), "close");
  assert.equal(crestProblem([[0, 0], [2000, 0]]), "far");
  assert.equal(crestProblem([[0, 0], [300, 0], [10, 30]]), "sharp");
  assert.equal(crestProblem([[0, 0], [300, 0], [300, 300], [100, 300], [100, -100]]), "cross");
  assert.equal(crestProblem(Array.from({ length: 13 }, (_, k) => [k * 100, (k % 2) * 60])), "count");
});

test("§9.214 la base: incroci, troppo piccola, sotto tutta la cresta", () => {
  const crest = [[300, 100, 200], [600, 80, 200]];
  const box = [[100, 200], [800, 200], [800, 500], [100, 500]];
  assert.equal(baseProblem(box, crest, 200), null);
  assert.equal(baseProblem([[100, 200], [800, 500], [800, 200], [100, 500]], crest, 200), "cross");
  assert.equal(baseProblem([[100, 200], [150, 200], [150, 240]], crest, 200), "small");
  assert.equal(baseProblem([[100, 200], [450, 200], [450, 500], [100, 500]], crest, 200), "crest");
  assert.equal(baseProblem([[100, 200], [800, 200]], crest, 200, true), null, "mentre la si disegna: aperta");
  assert.equal(baseProblem([[100, 200], [800, 200], [800, 500]], crest, 200, true), null);
});

test("§9.214 la convalida delle mappe: le montagne buone passano, le assurde no", () => {
  const ok = { crest: [[400, 300], [700, 260]], height: 260, width: 520, rough: 0.5, detail: 0.5, seed: 12 };
  assert.deepEqual(cleanMountain(ok, 6000, 6000, 4000), ok);
  assert.equal(cleanMountain({ ...ok, height: 5000 }, 6000, 6000, 4000), null);
  assert.equal(cleanMountain({ ...ok, crest: [[400, 300], [410, 300]] }, 6000, 6000, 4000), null);
  assert.equal(cleanMountain({ ...ok, seed: 1.5 }, 6000, 6000, 4000), null);
  assert.equal(cleanMountain({ ...ok, mirrored: true }, 6000, 6000, 4000), null, "specchiata senza simmetria");
  assert.equal(cleanMountain({ ...ok, extra: "x" }, 6000, 6000, 4000).extra, undefined, "niente campi sconosciuti");
  const m = newMap();
  m.mountains = [ok, { ...ok, sym: "diagonal", mirrored: true }];
  assert.equal(validateMap(m, new Set(), {}).map.mountains.length, 2);
  m.mountains.push({ crest: "no" });
  assert.ok(validateMap(m, new Set(), {}).errors);
});

test("§9.214 la gemella: la base esattamente specchiata, le cime alte uguali", () => {
  const room = [6000, 6000];
  for (const sym of ["diagonal", "horizontal", "vertical"]) {
    const a = mountainGeometry({ ...M, sym, room }), b = mountainGeometry({ ...M, sym, mirrored: true, room });
    const mir = ([x, y]) => (sym === "diagonal" ? [6000 - x, 6000 - y] : sym === "horizontal" ? [6000 - x, y] : [x, 6000 - y]);
    const key = (p) => p.map((v) => Math.round(v * 10)).join(",");
    const A = new Set(a.base.map((p) => key(mir(p))));
    assert.ok(b.base.every((p) => A.has(key(p))), sym);
    assert.deepEqual(a.tops.map((t) => Math.round(t.h)), b.tops.map((t) => Math.round(t.h)), sym);
  }
});

test("§9.214 i triangoli delle facce e la sagoma come ostacolo", () => {
  // un poligono concavo: i triangoli coprono la sua area
  const P = [[0, 0], [100, 0], [100, 100], [50, 40], [0, 100]];
  const T = triangulate(P);
  let a = 0;
  for (let i = 0; i < T.length; i += 6) a += Math.abs((T[i + 2] - T[i]) * (T[i + 5] - T[i + 1]) - (T[i + 4] - T[i]) * (T[i + 3] - T[i + 1])) / 2;
  assert.ok(Math.abs(a - 7000) < 1e-6, String(a)); // (il quadrato meno la tacca: 10000 - 100 x 60 / 2)
  const g = mountainGeometry(M), w = { roomW: 2000, roomH: 2000, mountains: [g] };
  const mc = mountainCells(w);
  const t = g.tops[1];
  assert.ok(mountainAt(mc, t.x, t.y + 30), "sotto la cima: montagna");
  assert.ok(!mountainAt(mc, 1900, 1900), "lontano: niente");
  assert.ok(mountainAt(mc, g.feet[0][0], g.feet[0][1]), "il piede della cima");
});

test("§9.215 una cima sola: alzata, il suo piede e le altre cime restano", () => {
  const e = { crest: [[950, 520], [1200, 440], [1450, 500]], height: 320, seed: 77 };
  const a = mountainGeometry(e), t = a.tops[1], dh = t.h * 0.3;
  const b = mountainGeometry({ ...e, peaks: [1, 1.3, 1], crest: [[950, 520], [1200, 440 - dh], [1450, 500]] });
  assert.ok(Math.abs(b.tops[1].h - t.h * 1.3) < 1e-6, "la cima e' alta il 30% in piu'");
  for (let k = 0; k < 3; k++) assert.ok(Math.abs((b.tops[k].y + b.tops[k].h) - (a.tops[k].y + a.tops[k].h)) < 1e-6, "il piede " + k);
  assert.equal(b.tops[0].h, a.tops[0].h);
  assert.equal(b.tops[2].h, a.tops[2].h);
});

// [§9.216] le chiazze d'erba del pennello
import { meadowPoints, meadowCounts, cleanMeadow, MEADOW_LIMITS } from "../src/meadows.js";
test("§9.216 le chiazze d'erba: quante, dove, sempre uguali, i limiti", () => {
  const sq = [[0, 0], [1000, 0], [1000, 600], [0, 600]]; // 60 quadrati da 100 x 100
  const m = { pts: sq, mix: { dark: 2, poppy: 0.5 }, seed: 9 };
  assert.deepEqual(meadowCounts(m), { dark: 120, mid: 0, light: 0, blades: 0, wheat: 0, poppy: 30, yellow: 0, leaves: 0, pink: 0, clover: 0 }); // (§9.223: dieci particelle)
  const P = meadowPoints(m);
  assert.ok(P.length > 60 && P.length <= 150, String(P.length)); // (il bordo sfumato e i ciuffi ne lasciano meno)
  assert.ok(P.every(([k, x, y]) => (k === "dark" || k === "poppy") && x > 0 && x < 1000 && y > 0 && y < 600));
  assert.deepEqual(meadowPoints(m), P, "stesso seme, stessa chiazza");
  assert.ok(meadowPoints(m, (x) => x < 500).every(([, x]) => x >= 500), "niente dove e' bloccato");
  // una chiazza enorme e fittissima: al piu' MEADOW_LIMITS.patch particelle
  const big = { pts: [[0, 0], [9000, 0], [9000, 9000], [0, 9000]], mix: { dark: 12, mid: 12 } };
  assert.ok(Object.values(meadowCounts(big)).reduce((a, b) => a + b, 0) <= MEADOW_LIMITS.patch);
  const inPt = () => true;
  assert.deepEqual(cleanMeadow({ pts: sq, mix: { dark: 2, mid: 0 }, seed: 3 }, inPt), { pts: sq, mix: { dark: 2 }, seed: 3 });
  assert.equal(cleanMeadow({ pts: sq, mix: { dark: 5 } }, inPt), null, "densita' fuori dai passi");
  assert.equal(cleanMeadow({ pts: sq, mix: { rose: 1 } }, inPt), null, "particella sconosciuta");
  assert.equal(cleanMeadow({ pts: sq.slice(0, 2), mix: {} }, inPt), null);
});
