// [§9.152, multiplayer, fase 1] Nel codice del gioco nessuna funzione che
// possa dare risultati diversi in browser diversi o fra due giocatori:
// - Math.random solo in src/rng.js (simRandom per la partita, vrand per gli
//   effetti);
// - niente Math.sin, cos, tan, atan2, hypot, pow, exp, log... (src/dmath.js)
//   ne' `**`, tranne nel disegno (gl.js, draw.js: non tocca la partita).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../src/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
const code = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
  .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""');
const RENDER = new Set(["gl.js", "draw.js"]);

test("§9.152 Math.random solo in rng.js", () => {
  const bad = files.filter((f) => f !== "rng.js" && /Math\.random\b/.test(code(f)));
  assert.deepEqual(bad, []);
});

test("§9.152 niente matematica non deterministica fuori da dmath.js e dal disegno", () => {
  const bad = [];
  for (const f of files) {
    if (f === "dmath.js" || RENDER.has(f)) continue;
    const m = code(f).match(/Math\.(sin|cos|tan|atan2?|asin|acos|sinh|cosh|tanh|pow|exp|expm1|log\w*|hypot|cbrt)\b|\*\*/g);
    if (m) bad.push(f + ": " + [...new Set(m)].join(" "));
  }
  assert.deepEqual(bad, []);
});
