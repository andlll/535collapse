// §9.7: maschere ruotate con image_angle, come lo sprite (drawSprite).
import { test } from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/world.js";

// rettangolo 100x20 con l'origine in un angolo; una "L" precisa 40x40 (righe
// di intervalli pieni: le prime 10 righe piene, le altre solo i primi 10 px)
const rect = { kind: 1, bbox: [0, 0, 99, 19], origin: [0, 0] };
const ell = { kind: 2, bbox: [0, 0, 99, 39], origin: [50, 20] };
const L = { kind: 0, bbox: [0, 0, 39, 39], origin: [5, 5], sepmasks: false,
  frames: [Array.from({ length: 40 }, (_, y) => (y < 10 ? [0, 40] : [0, 10]))] };
const dot = { kind: 1, bbox: [0, 0, 1, 1], origin: [1, 1] };
const objects = {
  muro: { sprite: "r", mask: "r", parents: ["natural_parent"], depth: 0, solid: true },
  ovale: { sprite: "e", mask: "e", parents: ["natural_parent"], depth: 0, solid: true },
  elle: { sprite: "l", mask: "l", parents: ["natural_parent"], depth: 0, solid: true },
  punto: { sprite: "d", mask: "d", parents: ["ally_unit"], depth: 0, solid: true },
};
const mk = () => new World({ objects, masks: { r: rect, e: ell, l: L, d: dot }, assets: { sprites: {} }, g: {},
                               roomW: 4000, roomH: 4000 });

// punto locale della maschera -> room, con la trasformazione di drawSprite
function toRoom(i, lx, ly) {
  const m = { muro: rect, ovale: ell, elle: L }[i.object];
  const a = -i.image_angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const x = (lx - m.origin[0]) * i.image_xscale, y = (ly - m.origin[1]) * i.image_yscale;
  return [i.x + x * c - y * s, i.y + x * s + y * c];
}

test("muro ruotato di 90: in piedi, la scatola girata", () => {
  const w = mk();
  const m = w.create("muro", 1000, 1000, { rot: 90 });
  const bb = w.bbox(m).map((v) => Math.round(v * 1e6) / 1e6);
  // 90 gradi antiorari a schermo: la lunghezza va verso l'alto
  assert.deepEqual(bb, [1000, 900, 1020, 1000]);
  assert.ok(w.pointIn(m, 1010, 950));
  assert.ok(!w.pointIn(m, 1050, 1010)); // dove stava senza rotazione
  assert.ok(w.positionMeeting(1005, 905, "muro"));
  // un'unita' passa dove il muro non c'e' piu', non dove c'e'
  const u = w.create("punto", 1060, 1010);
  assert.ok(w.placeFree(u, 1060, 1010));
  assert.ok(!w.placeFree(u, 1010, 950));
});

test("senza rotazione o a 360 tutto come prima", () => {
  const w = mk();
  const a = w.create("muro", 500, 500), b = w.create("muro", 500, 800, { rot: 360 });
  assert.deepEqual(w.bbox(a), [500, 500, 600, 520]);
  assert.deepEqual(w.bbox(b), [500, 800, 600, 820]);
  assert.ok(w.pointIn(b, 590, 810));
});

test("ogni punto pieno della maschera, ruotata scalata e ribaltata, e' pieno nel mondo", () => {
  const w = mk();
  for (const [obj, m] of [["muro", rect], ["ovale", ell], ["elle", L]]) {
    for (const [rot, sx, sy] of [[37, 1, 1], [-120, 1.5, 0.7], [200, -1, 1], [75, 1, -2]]) {
      const i = w.create(obj, 2000, 2000, { rot, sx, sy });
      let tried = 0, inside = 0, wrongOut = 0;
      for (let ly = 0.5; ly < m.bbox[3] + 1; ly += 3) {
        for (let lx = 0.5; lx < m.bbox[2] + 1; lx += 3) {
          const full = m.kind === 1 ? true
            : m.kind === 2 ? ((lx - 50) / 50) ** 2 + ((ly - 20) / 20) ** 2 <= 0.8
            : (ly < 9 || lx < 9) && !(ly > 9.5 && lx > 9.5 && lx < 11);
          if (!full) continue;
          // lontano dai bordi: un pixel di room intero dentro
          if (m.kind === 0 && ((ly > 8 && ly < 12) || (lx > 8 && lx < 12))) continue;
          if (lx < 2 || ly < 2 || lx > m.bbox[2] - 1 || ly > m.bbox[3] - 1) continue;
          const [px, py] = toRoom(i, lx, ly);
          tried++;
          if (w.pointIn(i, px, py)) inside++; else wrongOut++;
        }
      }
      assert.ok(tried > 10, obj);
      // con scala < 1 un pixel di room copre piu' pixel della maschera: si
      // ammette qualche bordo
      assert.ok(wrongOut <= tried * 0.03, `${obj} rot ${rot} scala ${sx},${sy}: ${wrongOut}/${tried} fuori`);
      // e la "L" ruotata ha il buco dove deve
      if (obj === "elle") {
        const [hx, hy] = toRoom(i, 30, 30);
        assert.ok(!w.pointIn(i, hx, hy), `elle rot ${rot}: buco pieno`);
      }
      w.destroy(i);
    }
  }
});

test("collision_rectangle e overlap vedono la forma ruotata", () => {
  const w = mk();
  const m = w.create("muro", 1000, 1000, { rot: 45 });
  // sulla diagonale verso l'alto a destra si'; nell'angolo vuoto della scatola no
  assert.ok(w.collisionRectangle(1040, 950, 1045, 955, "muro"));
  assert.ok(!w.collisionRectangle(1000, 930, 1005, 935, "muro"));
  assert.ok(w.collisionRectangle(1000, 930, 1005, 935, "muro", false)); // senza prec: la scatola
  const u = w.create("punto", 1000, 930);
  assert.ok(!w.overlap(u, 1003, 932, m));
  assert.ok(w.overlap(u, 1048, 955, m)); // il lato pieno e' verso il basso a destra della diagonale
});
