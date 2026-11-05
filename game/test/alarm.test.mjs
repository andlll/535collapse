// Allarmi d'attacco sulla minimappa (attackalarm.js, §9.108): zone per tipo,
// anelli solo fuori dalla view, la battaglia che dura, la fine, J.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALARM, raiseAlarm, alarmsStep, alarmZones, alarmBlink } from "../src/attackalarm.js";

function fakeWorld() {
  const lists = { ally_unit: [], ally_build: [] };
  const w = {
    room: "match", g: {}, _stepNo: 1000, behaviours: {}, created: [],
    cam: { x: 0, y: 0, w: 1600, h: 900 },
    all: (n) => lists[n] || [],
    number: () => 0,
    create: (n) => w.created.push(n),
    lists,
  };
  return w;
}

test("zone: un allarme per battaglia, anelli solo fuori dalla view", () => {
  const w = fakeWorld();
  const a = raiseAlarm(w, "battle", 3000, 3000);       // fuori dalla view
  assert.equal(a.ring, true);
  w._stepNo += 50;
  const b = raiseAlarm(w, "battle", 3000 + ALARM.zoneR - 10, 3000); // la stessa battaglia
  assert.equal(b, a);
  assert.equal(a.last, w._stepNo);
  assert.equal(w.g.alarms.zones.length, 1);
  raiseAlarm(w, "fire", 3000, 3000);                    // un altro tipo: un'altra zona
  const v = raiseAlarm(w, "battle", 500, 400);         // nella view: senza anelli
  assert.equal(v.ring, false);
  assert.equal(w.g.alarms.zones.length, 3);
  assert.deepEqual(alarmZones(w.g).map((z) => z.id), [v.id, 2, a.id]); // la piu' recente prima
  assert.equal(alarmBlink(w.g, w._stepNo), true);
  assert.equal(alarmBlink(w.g, w._stepNo + ALARM.blink + 60), false);
});

test("colpi dalla vita che cala; la zona finisce dopo il silenzio", () => {
  const w = fakeWorld();
  const u = { x: 4000, y: 4000, life: 75 }, h = { x: 100, y: 100, life: 300, selected: 0 };
  w.lists.ally_unit.push(u); w.lists.ally_build.push(h);
  alarmsStep(w);                      // la prima volta: solo la vita di partenza
  assert.equal(w.g.alarms.zones.length, 0);
  u.life = 75; alarmsStep(w);         // vita uguale o che sale: niente
  u.life = 80; alarmsStep(w);
  assert.equal(w.g.alarms.zones.length, 0);
  u.life = 70; w._stepNo++; alarmsStep(w);
  assert.equal(w.g.alarms.zones.length, 1);
  assert.equal(w.g.alarms.zones[0].kind, "battle");
  h.life = 290; w._stepNo++; alarmsStep(w);
  assert.equal(w.g.alarms.zones[1].kind, "fire");
  // demolito col tasto Canc: niente
  const d = { x: 6000, y: 100, life: 200, selected: 1 };
  w.lists.ally_build.push(d); alarmsStep(w); d.life = 0; alarmsStep(w);
  assert.equal(w.g.alarms.zones.length, 2);
  // colpi che continuano: la zona resta; poi il silenzio
  for (let k = 0; k < 3; k++) { w._stepNo += ALARM.quiet - 10; u.life -= 1; alarmsStep(w); }
  assert.equal(w.g.alarms.zones.filter((z) => z.kind === "battle" && !z.ending).length, 1);
  w._stepNo += ALARM.quiet + 1; alarmsStep(w);
  assert.equal(alarmZones(w.g).length, 0);              // finite (sfumano)
  w._stepNo += ALARM.fade; alarmsStep(w);
  assert.equal(w.g.alarms.zones.length, 0);
});

test("all'inizio della partita e nel menu niente allarmi", () => {
  const w = fakeWorld();
  w._stepNo = 10;
  const u = { x: 4000, y: 4000, life: 75 };
  w.lists.ally_unit.push(u);
  alarmsStep(w); u.life = 10; w._stepNo++; alarmsStep(w);
  assert.equal(w.g.alarms.zones.length, 0);
  const m = fakeWorld(); m.room = "menu";
  m.lists.ally_unit.push(u); alarmsStep(m); u.life = 5; alarmsStep(m);
  assert.equal(m.g.alarms, undefined);
});

test("il suggerimento, una volta sola", () => {
  const w = fakeWorld();
  w.behaviours.hint_allarme = {};
  w.g.alarmhint = 0;
  raiseAlarm(w, "battle", 3000, 3000);
  alarmsStep(w); alarmsStep(w);
  assert.deepEqual(w.created, ["hint_allarme"]);
  assert.equal(w.g.alarmhint, 1);
});
