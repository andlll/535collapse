// Flow field e BFS (scr_generate_goal_field / scr_generate_flow_field) su
// una griglia piccola, contro valori calcolati a mano dal GML.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Pathing, GRID } from "../src/pathing.js";

const fakeWorld = { all: () => [], bbox: () => null, setPos(i, x, y) { i.x = x; i.y = y; } };

function grid(rows) {
  const p = new Pathing(fakeWorld, rows[0].length * GRID, rows.length * GRID);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === "#") p.cost[y * p.gw + x] = 1000; }));
  return p;
}

test("goal field: BFS a 4 direzioni, gli ostacoli (>=1000) restano -1", () => {
  const p = grid(["....", ".##.", "...."]);
  const f = p.goalField(0, 0);
  const at = (x, y) => f[y * p.gw + x];
  assert.equal(at(0, 0), 0);
  assert.equal(at(3, 0), 3);
  assert.equal(at(1, 1), -1);
  assert.equal(at(3, 2), 5);   // 3 a destra + 2 in basso, girando attorno al muro
});

test("flow field: verso la vicina piu' bassa; a pari valore vince l'ordine destra, sinistra, su, giu'", () => {
  const p = grid(["...", "...", "..."]);
  const ff = p.flowField(p.goalField(GRID * 1, GRID * 1)); // destinazione al centro
  const at = (x, y) => ff[y * p.gw + x];
  assert.equal(at(1, 1), -1);       // la destinazione non ha direzione
  assert.equal(at(0, 1), 0);        // a sinistra del centro: va a destra (0 gradi)
  assert.equal(at(1, 0), 270);      // sopra: va giu' (270)
  assert.equal(at(0, 0), 315);      // angolo: la diagonale verso il centro vale 0, la piu' bassa
  // pareggio: centro bloccato, destinazione in basso a destra; dalla cella
  // (0,0) destra e giu' valgono entrambe 3 -> vince destra (prima nell'ordine)
  const q = grid(["...", ".#.", "..."]);
  const f2 = q.flowField(q.goalField(GRID * 2, GRID * 2));
  assert.equal(f2[0], 0);
});

test("scr_find_valid_cell_backwards: cella raggiungibile piu' vicina, cercando in quadrati crescenti", () => {
  const p = grid(["....", ".##.", "...."]);
  const f = p.goalField(0, 0);
  assert.deepEqual(p.findValidCellBackwards(f, 3, 2, 0, 0), [3, 2, true]);
  const [x, y, found] = p.findValidCellBackwards(f, 1, 1, 0, 0);
  assert.equal(found, true);
  assert.deepEqual([x, y], [0, 0]); // primo trovato scorrendo dx=-1.. e dy=-1..
});
