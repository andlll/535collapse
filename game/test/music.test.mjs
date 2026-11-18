// [§9.143] Il mix della musica (music.js): il field secondo l'ora del giorno,
// il drone secondo la popolazione, gli archi costanti.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldLevel, musicLevels, MUSIC } from "../src/music.js";

const mgr = (a0, a1, dayLen = 4000) => ({ al: { get: (i) => (i === 0 ? a0 : a1) }, dayLen });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("field: pieno all'alba, scende col giorno, zitto di notte, risale all'alba", () => {
  near(fieldLevel(mgr(4000, -1), { night: -0.003 }), 1);            // appena dopo l'alba
  near(fieldLevel(mgr(2000, -1), { night: -0.003 }), 0.5);          // meta' giorno
  near(fieldLevel(mgr(1, -1), { night: -0.003 }), 1 / 4000);        // al tramonto
  near(fieldLevel(mgr(1, -1), { night: 0.5 }), MUSIC.fieldNight);   // tramonto in corso
  near(fieldLevel(mgr(-1, 1500), { night: 1 }), MUSIC.fieldNight);  // notte
  near(fieldLevel(mgr(-1, 1), { night: 0.25 }), 0.75);              // alba in corso: risale
  near(fieldLevel(mgr(6000, -1, 6000), { night: 0 }), 1);           // il primo giorno (6000 passi)
  near(fieldLevel(mgr(-1, -1), { night: 0 }), 1);                   // "sempre giorno": niente ciclo
  near(fieldLevel(mgr(5000, -1, 4000), { night: 0 }), 1);           // giorno piu' lungo del previsto (salvataggio)
});

test("drone con la popolazione, archi costanti", () => {
  near(musicLevels(mgr(4000, -1), { night: 0, pop: 0 }).musica_drone, 0);
  near(musicLevels(mgr(4000, -1), { night: 0, pop: MUSIC.droneFull / 2 }).musica_drone, 0.5);
  near(musicLevels(mgr(4000, -1), { night: 0, pop: 99 }).musica_drone, 1);
  near(musicLevels(mgr(4000, -1), { night: 1, pop: 10 }).musica_archi, 1);
});

// [§9.161] il brano 2 e la scaletta dei brani
import { musicPlan, combat, BRANI } from "../src/music.js";
import { planAt } from "../src/audio.js";

test("§9.161 la scaletta: lvl01 solo il brano 2, schermaglie a turno dal brano 1, lvl03 e lvl05 dal 2", () => {
  assert.deepEqual(musicPlan("lvl01").segs, [["loop2", Infinity]]);
  assert.deepEqual(musicPlan("match").segs, [["loop1", Infinity]]);
  assert.deepEqual(musicPlan("lvl02").segs, [["loop1", Infinity]]);
  // turni di giri interi, il piu' vicino possibile a 5 minuti
  assert.deepEqual(musicPlan("sk_padus").segs, [["loop1", 294], ["loop2", 320]]);
  assert.deepEqual(musicPlan("lvl03").segs, [["loop2", 320], ["loop1", 294]]);
  assert.equal(musicPlan("lvl05").full, true);
  assert.equal(musicPlan("lvl03").full, false);
  const p = musicPlan("sk_padus");
  assert.deepEqual(planAt(p, 10), { brano: "loop1", start: 0, key: "0:0", full: false });
  assert.deepEqual(planAt(p, 300), { brano: "loop2", start: 294, key: "0:1", full: false });
  assert.deepEqual(planAt(p, 614 + 5), { brano: "loop1", start: 614, key: "1:0", full: false });
  assert.equal(planAt(musicPlan("lvl05"), 5).full, true);
  assert.equal(planAt(musicPlan("lvl05"), 614 + 5).full, false); // il secondo giro del brano 2 no
  assert.equal(planAt(musicPlan("lvl01"), 5000).brano, "loop2");
  assert.deepEqual(BRANI.loop2.parts, ["musica2_piano", "musica2_bass", "musica2_dr1", "musica2_dr2"]);
});

// un mondo finto: nemici e alleati in fila
const fakeWorld = ({ enemies = [], allies = [], builds = [], zones = [], step = 1000 }) => {
  const L = { enemy_unit: enemies, ally_unit: allies, ally_build: builds };
  return {
    _stepNo: step, g: { alarms: { zones } },
    all: (n) => (L[n] || []).values(),
    nearest: (x, y, n) => (L[n] || []).reduce((b, i) => (!b || (i.x - x) ** 2 + (i.y - y) ** 2 < (b.x - x) ** 2 + (b.y - y) ** 2 ? i : b), null),
  };
};
const unit = (x, y, visible = true) => ({ x, y, alive: true, visible });

test("§9.161 il combattimento: nemici visti vicini, colpi recenti", () => {
  assert.deepEqual(combat(fakeWorld({ enemies: [unit(0, 0)], allies: [unit(300, 0)] })), { near: 1, hit: false });
  assert.deepEqual(combat(fakeWorld({ enemies: [unit(0, 0)], allies: [unit(900, 0)] })), { near: 0, hit: false });
  assert.deepEqual(combat(fakeWorld({ enemies: [unit(0, 0, false)], allies: [unit(100, 0)] })), { near: 0, hit: false }); // non visto
  assert.deepEqual(combat(fakeWorld({ enemies: [unit(0, 0)], builds: [unit(50, 50)] })), { near: 0, hit: false }); // gli edifici no (lvl01)
  assert.equal(combat(fakeWorld({ zones: [{ kind: "battle", last: 950, ending: 0 }] })).hit, true);
  assert.equal(combat(fakeWorld({ zones: [{ kind: "battle", last: 500, ending: 0 }] })).hit, false);
  assert.equal(combat(fakeWorld({ zones: [{ kind: "fire", last: 990, ending: 0 }] })).hit, false); // gli incendi no
});

test("§9.161 il brano 2: piano costante, basso in 10 s, percussioni col combattimento", () => {
  const m = mgr(4000, -1), g = { night: 0, pop: 0 };
  const L = (elapsed, w, full = false) => musicLevels(m, g, { brano: "loop2", elapsed, full }, w);
  const quiet = fakeWorld({ allies: [unit(0, 0)] });
  near(L(0, quiet).musica2_piano, 1);
  near(L(0, quiet).musica2_bass, 0);
  near(L(5, quiet).musica2_bass, 0.5);
  near(L(12, quiet).musica2_bass, 1);
  assert.equal(L(12, quiet).musica2_dr1, 0);
  // il brano 1 non ha le parti del 2
  assert.equal(musicLevels(m, g, { brano: "loop1", elapsed: 3 }, quiet).musica2_piano, undefined);
  // un nemico vicino: dr1; sei: anche dr2; poi restano per MUSIC.hold passi
  const m2 = mgr(4000, -1), L2 = (w) => musicLevels(m2, g, { brano: "loop2", elapsed: 30 }, w);
  const one = fakeWorld({ enemies: [unit(100, 0)], allies: [unit(0, 0)], step: 1000 });
  assert.deepEqual([L2(one).musica2_dr1, L2(one).musica2_dr2], [1, 0]);
  const six = fakeWorld({ enemies: Array.from({ length: 6 }, (_, k) => unit(50 + k * 10, 0)), allies: [unit(0, 0)], step: 1100 });
  assert.deepEqual([L2(six).musica2_dr1, L2(six).musica2_dr2], [1, 1]);
  const later = (step) => fakeWorld({ allies: [unit(0, 0)], step });
  assert.deepEqual([L2(later(1100 + MUSIC.hold)).musica2_dr1, L2(later(1100 + MUSIC.hold)).musica2_dr2], [1, 1]);
  assert.deepEqual([L2(later(1101 + MUSIC.hold)).musica2_dr1, L2(later(1101 + MUSIC.hold)).musica2_dr2], [0, 0]);
  // lvl05: al pieno subito (basso e percussioni), le percussioni per MUSIC.fullHold passi
  const m3 = mgr(4000, -1), L3 = (step) => musicLevels(m3, g, { brano: "loop2", elapsed: 0, full: true }, later(step));
  assert.deepEqual([L3(10).musica2_bass, L3(10).musica2_dr1, L3(10).musica2_dr2], [1, 1, 1]);
  assert.equal(L3(10 + MUSIC.fullHold).musica2_dr1, 1);
  assert.equal(L3(11 + MUSIC.fullHold).musica2_dr1, 0);
});
