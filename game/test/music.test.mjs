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
