// [§9.155] La partita a due (src/multiplayer.js): i gemelli del giocatore 2,
// le tabelle dei nomi delle due parti e lo specchio del mondo (i nomi
// tradotti negli argomenti, la cassa del giocatore 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { twinName, twinNames, nameMaps, twinObjects, mirrorWorld } from "../src/multiplayer.js";

const OBJ = {
  ally: { parents: [] }, ally_unit: { parents: ["ally"] }, ally_build: { parents: ["ally"] },
  ally_warrior: { parents: ["ally_infantry", "ally_militare", "ally_unit", "ally"], sprite: "ww73" },
  ally_infantry: { parents: ["ally_militare", "ally_unit", "ally"] }, ally_militare: { parents: ["ally_unit", "ally"] },
  centro: { parents: ["ally_build", "ally"], sprite: "cc_spr" }, casa_fond: { parents: ["ally_fondamenta", "ally_build", "ally"] },
  ally_fondamenta: { parents: ["ally_build", "ally"] }, arciere_bullet: { parents: [] }, albero: { parents: ["natural_parent"] },
  casa_clicker: { parents: ["clicker_parent"] }, enemy_unit: { parents: ["enemy"] },
  // [segnalazione dell'autore] la famiglia ally_barn e il mulino barn: due gemelli diversi
  ally_wooden: { parents: ["ally_build", "ally"] }, ally_barn: { parents: ["ally_wooden", "ally_build", "ally"] },
  barn: { parents: ["ally_barn", "ally_wooden", "ally_build", "ally"], sprite: "barn_spr" },
  cc_barn: { parents: ["ally_barn", "ally_wooden", "ally_build", "ally"] },
};

test("§9.155 gemelli e nomi delle due parti", () => {
  assert.equal(twinName("ally_warrior"), "p2_warrior");
  assert.equal(twinName("centro"), "p2_centro");
  assert.equal(twinName("ally"), "p2");
  const t = twinNames(OBJ);
  for (const n of ["ally_warrior", "centro", "casa_fond", "arciere_bullet", "ally_unit"]) assert.ok(t.includes(n), n);
  for (const n of ["albero", "casa_clicker", "enemy_unit"]) assert.ok(!t.includes(n), n);
  const tw = twinObjects(OBJ, t);
  assert.deepEqual(tw.p2_warrior.parents, ["p2_infantry", "p2_militare", "p2_unit", "p2"]);
  assert.equal(tw.p2_warrior.sprite, "ww73"); // gli sprite del giocatore: il blu e' al disegno
  const { m1, m2 } = nameMaps(OBJ);
  assert.equal(m2.ally_unit, "p2_unit");
  assert.equal(m2.centro, "p2_centro");
  assert.equal(m2.enemy_unit, "ally_unit"); // per il blu il nemico e' il rosso
  assert.equal(m2.enemy_centro, "centro");
  assert.equal(m1.enemy_unit, "p2_unit"); // per il rosso il nemico e' il blu
  assert.equal(m1.ally_unit, undefined);
  // nomi tutti diversi: ally_barn tiene il prefisso, barn no
  assert.equal(m2.barn, "p2_barn");
  assert.equal(m2.ally_barn, "p2_ally_barn");
  assert.deepEqual(twinObjects(OBJ, t).p2_cc_barn.parents, ["p2_ally_barn", "p2_wooden", "p2_build", "p2"]);
  assert.equal(m2.enemy_barn, "ally_barn");
});

test("§9.155 lo specchio del mondo", () => {
  const seen = [];
  const world = {
    g: { food: 10, wood: 1, sel: 2, p2: { food: 99, wood: 5 } },
    all(name) { seen.push(["all", name]); return this._inner(name); },
    _inner(name) { seen.push(["inner", name]); return name; },
  };
  const { m2 } = nameMaps(OBJ);
  const w2 = mirrorWorld(world, m2, true);
  assert.equal(w2.all("ally_unit"), "p2_unit");
  // la chiamata interna (this._inner) non si traduce una seconda volta
  assert.deepEqual(seen, [["all", "p2_unit"], ["inner", "p2_unit"]]);
  assert.equal(w2.all("albero"), "albero");
  // la cassa: le risorse del giocatore 2 in global.p2, il resto comune
  assert.equal(w2.g.food, 99);
  w2.g.wood += 10;
  assert.equal(world.g.p2.wood, 15);
  assert.equal(world.g.wood, 1);
  w2.g.sel = 7;
  assert.equal(world.g.sel, 7);
});

// [§9.163, segnalazione dell'autore] il rosso non vedeva i pulsanti del
// municipio: lo Step del centro blu (non selezionato nella pagina del rosso)
// distruggeva quelli appena creati dal centro rosso. L'interfaccia e' di chi
// guarda: gli eventi dell'altra parte (e i comandi dell'altro giocatore) non
// la creano ne' la distruggono.
test("§9.163 l'interfaccia e' di chi guarda", async () => {
  const { World } = await import("../src/world.js");
  const { newGlobals } = await import("../src/state.js");
  const { setupMultiplayer } = await import("../src/multiplayer.js");
  const base = { sprite: null, mask: null, depth: 0, visible: true, solid: false, draw: false };
  const objects = {
    ally: { ...base, parents: [] }, ally_build: { ...base, parents: ["ally"] },
    centro: { ...base, parents: ["ally_build", "ally"] },
    clicker_parent: { ...base, parents: [] }, omino_clicker: { ...base, parents: ["clicker_parent"] },
  };
  // lo Step del centro (buildings.js): selezionato, i pulsanti; no, via
  const centroStep = {
    step(i, w) {
      if (i.selected === 1 && w.number("omino_clicker") < 1) w.create("omino_clicker", 0, 0);
      if (i.selected === 0) for (const c of w.all("omino_clicker")) w.destroy(c);
    },
  };
  for (const local of [1, 2]) {
    const w = new World({ objects: structuredClone(objects), masks: {}, assets: {}, g: newGlobals("match"), roomW: 100, roomH: 100 });
    w.register("centro", centroStep);
    setupMultiplayer(w, local);
    const red = w.create("centro", 10, 10), blue = w.create("p2_centro", 50, 50);
    red.selected = local === 1 ? 1 : 0;
    blue.selected = local === 2 ? 1 : 0;
    for (let k = 0; k < 3; k++) w.step({ down: new Set(), pressed: new Set(), released: new Set(), mousePressed: [], mouseReleased: [] }, 0, 0);
    assert.equal(w.number("omino_clicker"), 1, `guardando dalla parte ${local}`);
    // un comando dell'altro giocatore non tocca l'interfaccia di chi guarda
    w.action("via", (mw) => { for (const c of mw.all("omino_clicker")) mw.destroy(c); mw.create("omino_clicker", 0, 0); });
    const before = w.all("omino_clicker").next().value;
    w.runAction("via", { p: 2 - local });
    assert.deepEqual([...w.all("omino_clicker")], [before]);
    w.runAction("via", { p: local - 1 }); // uno di chi guarda si'
    const after = [...w.all("omino_clicker")];
    assert.equal(after.length, 1);
    assert.notEqual(after[0], before);
  }
});
