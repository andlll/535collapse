// [§9.152] Le funzioni deterministiche (src/dmath.js): vicine a quelle del
// browser (entro pochi ulp) e scritte solo con operazioni esatte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dsin, dcos, datan2, dhypot, sq } from "../src/dmath.js";

const ulp = (v) => {
  const u = new BigInt64Array(new Float64Array([v]).buffer)[0];
  return Math.abs(new Float64Array(new BigInt64Array([u + 1n]).buffer)[0] - v) || Number.MIN_VALUE;
};

test("§9.152 dmath: sin, cos, atan2, hypot entro pochi ulp", () => {
  let seed = 7;
  const r = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  let es = 0, ec = 0, ea = 0, eh = 0;
  for (let k = 0; k < 200000; k++) {
    const x = (r() - 0.5) * 2 * [7, 400, 20000][k % 3];
    es = Math.max(es, Math.abs(dsin(x) - Math.sin(x)) / ulp(Math.sin(x)));
    ec = Math.max(ec, Math.abs(dcos(x) - Math.cos(x)) / ulp(Math.cos(x)));
    const y = (r() - 0.5) * 2000, z = (r() - 0.5) * 2000;
    ea = Math.max(ea, Math.abs(datan2(y, z) - Math.atan2(y, z)) / ulp(Math.atan2(y, z)));
    eh = Math.max(eh, Math.abs(dhypot(y, z) - Math.hypot(y, z)) / ulp(Math.hypot(y, z)));
  }
  assert.ok(es <= 2 && ec <= 2 && ea <= 2 && eh <= 2, JSON.stringify({ es, ec, ea, eh }));
  for (const [y, x] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1e-9, -5], [-1e-9, -5]]) {
    assert.equal(datan2(y, x), Math.atan2(y, x), `${y}, ${x}`);
  }
  assert.equal(dsin(0), 0); assert.equal(dcos(0), 1); assert.equal(sq(-3), 9);
});

test("§9.152 dmath: solo operazioni esatte (niente Math.sin, cos, atan, pow, exp, log, hypot)", () => {
  const src = readFileSync(new URL("../src/dmath.js", import.meta.url), "utf8").replace(/\/\/[^\n]*/g, "");
  assert.doesNotMatch(src, /Math\.(sin|cos|tan|atan2?|asin|acos|pow|exp|log\w*|hypot|cbrt)\b|\*\*/);
});
