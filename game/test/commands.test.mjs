// [§9.153] La coda dei comandi (src/commands.js): l'ordine di esecuzione
// (passo, giocatore, numero) non dipende dall'ordine di arrivo, il registro
// li conserva, il replay li rifa' agli stessi passi; la fotografia
// dell'input e della telecamera si registra solo quando cambia e il replay la
// rimette uguale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Commands, CHECK_EVERY } from "../src/commands.js";

const world = (n = 0) => ({ _stepNo: n });

test("§9.153 comandi: ordine, registro, replay", () => {
  const C = new Commands(), done = [];
  C.on("muovi", (w, c) => done.push([w._stepNo, c.p, c.u]));
  C.record({ room: "x", seed: 1 });
  // arrivati in disordine: il giocatore 1 prima dello 0, un passo dopo prima
  C.queue.push({ s: 5, p: 1, n: 0, k: "muovi", u: "b" });
  C.issue("muovi", { u: "c" }, 6);
  C.issue("muovi", { u: "a" }, 5);
  for (let s = 0; s <= 6; s++) C.runDue(world(s));
  assert.deepEqual(done, [[5, 0, "a"], [5, 1, "b"], [6, 0, "c"]]);
  const log = C.stop();
  assert.deepEqual(log.cmds.map((c) => c.u), ["a", "b", "c"]);
  // il replay: gli stessi comandi agli stessi passi; i comandi locali ignorati
  const R = new Commands(), again = [];
  R.on("muovi", (w, c) => again.push([w._stepNo, c.p, c.u]));
  R.replay(log);
  assert.equal(R.issue("muovi", { u: "z" }, 3), null);
  for (let s = 0; s <= 6; s++) R.runDue(world(s));
  assert.deepEqual(again, done);
  assert.throws(() => { const X = new Commands(); X.issue("boh", {}, 0); X.runDue(world(0)); }, /comando sconosciuto/);
});

test("§9.153 comandi: la fotografia dell'input e della telecamera", () => {
  const mk = () => ({ x: 0, y: 0, inside: false, edgeHold: false, down: new Set(), pressed: new Set(), pressedShift: new Set(),
    released: new Set(), mouseDown: [false, false, false], mousePressed: [false, false, false], mouseReleased: [false, false, false],
    wheelStep: 0, wheelFine: 0 });
  const cam = { x: 10, y: 20, w: 1600, h: 900, cssW: 1280, cssH: 720, scaleview: 1.25, zoomTarget: null, zoomAnchor: null };
  const C = new Commands(), inp = mk();
  C.record({});
  C.frame(inp, cam); C.frame(inp, cam); // uguale: una sola fotografia
  inp.x = 100; inp.pressed = new Set([81]); inp.mouseReleased = [false, true, false];
  C.frame(inp, cam);
  inp.pressed = new Set(); inp.mouseReleased = [false, false, false]; cam.x = 300;
  C.frame(inp, cam);
  const log = C.stop();
  assert.deepEqual(log.frames.map(([f]) => f), [0, 2, 3]);
  // il replay rimette, passo per passo, input e telecamera registrati
  const R = new Commands(), inp2 = mk(), cam2 = { ...cam, x: 0 };
  R.replay(log);
  const seen = [];
  for (let k = 0; k < 4; k++) { R.frame(inp2, cam2); seen.push([inp2.x, [...inp2.pressed], inp2.mouseReleased[1], cam2.x]); }
  assert.deepEqual(seen, [[0, [], false, 10], [0, [], false, 10], [100, [81], true, 10], [100, [], false, 300]]);
  assert.ok(CHECK_EVERY > 0);
});

// [§9.154] Le azioni del mondo (world.action, world.act): con la coda dei
// comandi sono comandi del passo dopo, eseguiti dai tipi registrati nel
// mondo; senza, subito. In replay "solo comandi" l'input non si rimette.
test("§9.154 azioni del mondo come comandi", async () => {
  const { World } = await import("../src/world.js");
  const w = new World({ sprites: {}, objects: {} });
  const done = [];
  w.action("prova", (ww, c) => done.push([ww._stepNo, c.ids, c.x]));
  w.act("prova", { ids: [3], x: 1 }); // senza coda: subito
  assert.deepEqual(done, [[0, [3], 1]]);
  const C = new Commands();
  w.hooks.command = (kind, c) => C.issue(kind, c, w._stepNo + 1);
  C.record({});
  w.act("prova", { ids: [4, 5], x: 2 });
  C.runDue(w);
  assert.equal(done.length, 1); // non ancora: al passo dopo
  w._stepNo = 1;
  C.runDue(w);
  assert.deepEqual(done[1], [1, [4, 5], 2]);
  const log = C.stop();
  assert.deepEqual(log.cmds.map((c) => c.k), ["prova"]);
  assert.throws(() => w.runAction("sconosciuta", {}), /azione sconosciuta/);
  // replay senza input: le fotografie non si rimettono
  const R = new Commands(), inp = { x: 7 };
  R.replay({ frames: [[0, { x: 1 }]], cmds: [], checks: [] }, { input: false });
  R.frame(inp, {});
  assert.equal(inp.x, 7);
});
