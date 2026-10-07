// Flow field e BFS (scr_generate_goal_field / scr_generate_flow_field) su
// una griglia piccola, contro valori calcolati a mano dal GML.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Pathing, GRID, arriveIfBlocked } from "../src/pathing.js";

const fakeWorld = { all: () => [], bbox: () => null, setPos(i, x, y) { i.x = x; i.y = y; } };

// "#" ostacolo fisso (edifici, alberi: anche in `solid`), "u" cella
// occupata da un'unita' ferma (solo il costo)
function grid(rows) {
  const p = new Pathing(fakeWorld, rows[0].length * GRID, rows.length * GRID);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === "#" || ch === "u") p.cost[y * p.gw + x] = 1000;
    if (ch === "#") p.solid[y * p.gw + x] = 1;
  }));
  p.solidVer++;
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
  const at = (x, y) => p.flowAt(ff, x, y);
  assert.equal(at(1, 1), -1);       // la destinazione non ha direzione
  assert.equal(at(0, 1), 0);        // a sinistra del centro: va a destra (0 gradi)
  assert.equal(at(1, 0), 270);      // sopra: va giu' (270)
  assert.equal(at(0, 0), 315);      // angolo: la diagonale verso il centro vale 0, la piu' bassa
  // pareggio: centro bloccato, destinazione in basso a destra; dalla cella
  // (0,0) destra e giu' valgono entrambe 3 -> vince destra (prima nell'ordine)
  const q = grid(["...", ".#.", "..."]);
  const f2 = q.flowField(q.goalField(GRID * 2, GRID * 2));
  assert.equal(q.flowAt(f2, 0, 0), 0);
});

test("scr_find_valid_cell_backwards: cella raggiungibile piu' vicina, cercando in quadrati crescenti", () => {
  const p = grid(["....", ".##.", "...."]);
  const f = p.goalField(0, 0);
  assert.deepEqual(p.findValidCellBackwards(f, 3, 2, 0, 0), [3, 2, true]);
  const [x, y, found] = p.findValidCellBackwards(f, 1, 1, 0, 0);
  assert.equal(found, true);
  assert.deepEqual([x, y], [0, 0]); // primo trovato scorrendo dx=-1.. e dy=-1..
});

test("§6.1 n.89 nearestFreeCell: la cella libera piu' vicina, non quella occupata ne' quelle gia' prese", () => {
  const p = grid([".....", ".....", "....."]);
  const goal = p.goalField(GRID * 2, GRID * 1);
  p.cost[1 * p.gw + 2] = 1000;                    // la cella d'arrivo si e' occupata
  const [x, y, ok] = p.nearestFreeCell(goal, 2, 1, 0, 0);
  assert.equal(ok, true);
  assert.equal(Math.max(Math.abs(x - 2), Math.abs(y - 1)), 1);  // una vicina
  assert.ok(p.cost[y * p.gw + x] < 1000);
  // findValidCellBackwards restituiva la stessa cella occupata
  assert.deepEqual(p.findValidCellBackwards(goal, 2, 1, 0, 0), [2, 1, true]);
  // con le vicine gia' prese (formazione) si va piu' in la'
  const used = new Set();
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) used.add((1 + dy) * p.gw + 2 + dx);
  const [x2, y2] = p.nearestFreeCell(goal, 2, 1, 0, 0, used);
  assert.equal(Math.max(Math.abs(x2 - 2), Math.abs(y2 - 1)), 2);
});

test("§6.1 n.89 arriveIfBlocked: vicina e senza progressi per 60 passi + d/2 prende il posto dov'e'", () => {
  const u = { x: 100, y: 100, dirox: 140, diroy: 100 };   // a 40 px
  let k = 0;
  for (; k < 200 && u.dirox !== u.x; k++) arriveIfBlocked(u);
  assert.equal(u.dirox, 100);
  assert.ok(k >= 80 && k <= 82, `passi: ${k}`);
  // lontana (> 400 px): non rinuncia mai
  const v = { x: 0, y: 0, dirox: 1000, diroy: 0 };
  for (let j = 0; j < 500; j++) arriveIfBlocked(v);
  assert.equal(v.dirox, 1000);
});

test("§6.2 C: niente diagonale fra due ostacoli (ne' rasente a uno)", () => {
  // destinazione in alto a destra; dalla cella (1,2) la diagonale (2,1)
  // passerebbe fra (2,2) e (1,1), ostacoli
  const p = grid(["....", ".#..", "..#.", "...."]);
  const f = p.goalField(GRID * 3, 0);
  const d = p.flowAt(f, 1, 2);
  assert.notEqual(d, 45);
  assert.ok(d === 180 || d === 270, `direzione ${d}`); // aggira l'ostacolo di lato
  // in campo aperto la diagonale resta
  const q = grid(["....", "....", "....", "...."]);
  assert.equal(q.flowAt(q.goalField(GRID * 3, 0), 0, 3), 45);
});

test("§6.2 D: in campo aperto si punta dritti verso la meta, non a 45 gradi", () => {
  const rows = []; for (let y = 0; y < 20; y++) rows.push(".".repeat(40));
  const p = grid(rows);
  const f = p.goalField(GRID * 39 + 16, GRID * 10 + 16);   // a destra, 2 celle piu' in basso
  const a = p.steerAt(f, GRID * 30 + 16, GRID * 8 + 16);
  const ideal = Math.atan2(-(2 * GRID), 9 * GRID) * 180 / Math.PI + 360; // ~347 gradi
  assert.ok(Math.abs(a - ideal) < 12, `angolo ${a}, dritto ${ideal}`);
  assert.equal(p.flowAt(f, 30, 8), 315);                  // la cella da sola dice 45 gradi in giu'
  // dietro un muro: non punta attraverso il muro
  const m = grid(["........", "..####..", "........"]);
  const g = m.goalField(GRID * 3 + 16, GRID * 2 + 16);    // sotto il muro
  const b = m.steerAt(g, GRID * 3 + 16, 16);              // sopra il muro
  assert.ok(m.clearLine(g, GRID * 3 + 16, 16, GRID * 3 + 16, GRID * 2 + 16) === false);
  assert.ok(b === 0 || b === 180 || (b > 90 && b < 270) || b < 90, `angolo ${b}`);
  assert.notEqual(b, 270);                                // non dritto in giu' nel muro
});

test("assedio: il campo largo non passa dai varchi stretti in cui passa un soldato", () => {
  // muro con un varco di una cella (colonna 4) e uno di tre (colonne 9-11)
  const rows = ["..............", "..............", "####.####...##", "..............", ".............."];
  const p = grid(rows);
  const at = (f, x, y) => f[y * p.gw + x];
  const soldier = p.goalField(GRID * 4 + 16, GRID * 4 + 16);
  assert.equal(at(soldier, 4, 2), 2);                     // il soldato passa dal varco stretto
  const siege = p.goalField(GRID * 4 + 16, GRID * 4 + 16, false, true);
  assert.equal(at(siege, 4, 2), -1);                      // la macchina no
  assert.equal(at(siege, 10, 2) !== -1, true);            // dal varco largo si'
  assert.equal(at(siege, 9, 2), -1);                      // ma solo dal suo centro
  assert.ok(at(siege, 4, 0) > at(soldier, 4, 0));         // e il giro e' piu' lungo
  // le unita' ferme non allargano l'ostacolo (solo la loro cella)
  const q = grid(["......", "......", "..u...", "......", "......"]);
  const fq = q.goalField(GRID * 5 + 16, GRID * 2 + 16, false, true);
  assert.equal(fq[2 * q.gw + 2], -1);
  assert.notEqual(fq[2 * q.gw + 1], -1);
  assert.notEqual(fq[1 * q.gw + 2], -1);
  // la maschera segue gli ostacoli che cambiano
  q.solid[0] = 1; q.cost[0] = 1000; q.solidVer++;
  assert.equal(q.wideMask(false)[1 * q.gw + 1], 1);
});

test("assedio: nearestReached, la cella raggiunta piu' vicina a una meta irraggiungibile", () => {
  const p = grid(["....#....", "....#....", "....#...."]);
  const from = p.goalField(16, 16, false, true);          // dalla riva sinistra
  const c = p.nearestReached(from, 7, 1);                  // meta sull'altra riva
  assert.deepEqual(c, [2, 1]);                             // a ridosso dell'ostacolo, per quanto la macchina ci sta
});
