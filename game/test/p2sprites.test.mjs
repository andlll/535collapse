// [§9.155] Gli sprite blu del giocatore 2 (src/p2sprites.js): ogni sprite
// delle unita' del giocatore (le loro animazioni in animTables.js, i
// cadaveri) e degli edifici finiti ha il suo corrispondente blu nell'atlas,
// diverso; cantieri e rovine restano quelli (neutri).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { p2Target, p2SpriteMap } from "../src/p2sprites.js";

const ATLAS = new URL("../assets/atlas.json", import.meta.url);

test("§9.155 sprite blu del giocatore 2", { skip: !existsSync(ATLAS) && "atlas non generato" }, () => {
  const S = JSON.parse(readFileSync(ATLAS, "utf8")).sprites;
  const src = readFileSync(new URL("../src/animTables.js", import.meta.url), "utf8");
  // i blocchi di animTables: nome -> sprite usati
  const keys = [...src.matchAll(/^ {2}([a-z_0-9]+)[:(]/gm)].map((m) => [m.index, m[1]]);
  const used = new Set();
  keys.forEach(([pos, name], k) => {
    if (!/^ally_|^[a-z]+_corpse$/.test(name) || name.startsWith("enemy_")) return;
    const end = k + 1 < keys.length ? keys[k + 1][0] : src.length;
    for (const m of src.slice(pos, end).matchAll(/"([a-z0-9_]+)"/g)) if (S[m[1]]) used.add(m[1]);
  });
  assert.ok(used.size > 500, "animazioni trovate: " + used.size);
  const buildings = ["cc_spr", "cas_spr", "castello_spr", "torre_spr", "chiesa_spr", "magazzino_spr", "stal_spr", "barn_spr",
                     "c1s", "c2s", "c3s", "c4s", "c5s", "c6s", "m_ori", "m_vert", "m_ori_p", "m_vert_p", "m_ori_pa", "m_vert_pa",
                     "castello_r1", "torre_r2", "chiesa_r1", "m_ori_r1", "m_ori_pa_r2", "campo2", "rflag"];
  const missing = [...used, ...buildings].filter((n) => { const t = p2Target(n, S); return !t || t === n || !S[t]; });
  assert.deepEqual(missing, []);
  // neutri: cantieri e rovine
  for (const n of ["cas_f1", "c1f", "m_ori_f", "castello_ruin"]) assert.equal(p2Target(n, S), null);
  const map = p2SpriteMap(S);
  assert.equal(map.ww11, "bww11");
  assert.equal(map.cm73, "bcw73");
  assert.equal(map.ow11, "b_ow11");
  assert.equal(map.c3s, "c3b");
});
