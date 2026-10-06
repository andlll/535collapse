// Lo stato di una partita, da salvare e da rimettere al suo posto
// (save.js scrive e legge il formato). Cosa c'e':
// - le istanze del mondo, nell'ordine di creazione (conta: ordine degli
//   eventi e delle ricerche), con l'id successivo;
// - global.* (g), gli allarmi del manager (notte, pioggia, orologio...),
//   la sua dissolvenza della nebbia e il sistema della pioggia;
// - la griglia dei costi e quella delle porte (pathing.js), la griglia
//   della scoperta della nebbia (fog.js; vista e ombra si ricalcolano a
//   ogni disegno), i sistemi di particelle con le particelle vive
//   (l'erba decorativa dura per sempre) e i semi della semina;
// - posizione e zoom della view.
// Non ci sono: comportamenti, asset, indici (byName, griglia delle celle:
// si ricostruiscono), lo stato del puntatore e della tastiera.

import { Alarms } from "./alarms.js";
import { encodeGraph, decodeGraph, SAVE_VERSION } from "./save.js";

const isInstance = (o) => typeof o.object === "string" && typeof o.id === "number" && o.alarm instanceof Alarms;
const OPTS = { isInstance, skipInstanceKeys: ["parents", "cells", "_qs", "steerField", "_far", "_bb", "_tStep", "_tSum", "_trk"], classes: { Alarms }, roundKeys: ["parts"] };

export function captureGame({ world, g, manager, path, fog, cam, room }) {
  const P = world.particles;
  const state = encodeGraph({
    instances: world.instances.filter((i) => i.alive),
    nextId: world.nextId,
    // [§7.10] il contatore dei passi: le attese scritte come "fino al passo
    // N" (reposAt, rallyTry, meleeRoute) dopo un caricamento ripartivano da 0
    stepNo: world._stepNo,
    seeds: world.seeds || null,
    seedEmitter: world.seedEmitter || null,
    g,
    manager: { al: manager.al, fogalpha: manager.fogalpha, rain: manager.rain },
    path: { cost: path.cost, enemyBlock: path.enemyBlock },
    fog: { explored: fog.explored },
    particles: { systems: P.systems, seq: P.seq },
    cam: { x: cam.x, y: cam.y, scaleview: cam.scaleview },
  }, OPTS);
  return { game: "535", v: SAVE_VERSION, room, date: Date.now(), state };
}

// Rimette lo stato in un mondo appena creato (prima dei Create della room,
// che non girano: le istanze arrivano gia' fatte).
export function restoreGame(data, { world, g, manager, path, fog, cam }) {
  const objects = world.objects;
  const s = decodeGraph(data.state, {
    ...OPTS,
    instance: (o) => {
      const def = objects[o.object];
      if (!def) throw new Error("oggetto sconosciuto nel salvataggio: " + o.object);
      o.parents = def.parents;
      o.cells = null;
    },
  });
  for (const k of Object.keys(g)) delete g[k];
  Object.assign(g, s.g);
  world.instances = s.instances;
  world.nextId = s.nextId;
  world._stepNo = s.stepNo || 0;
  world.byName = new Map();
  world.grid = new Map();
  for (const i of world.instances) {
    for (const n of [i.object, ...i.parents]) {
      let l = world.byName.get(n);
      if (!l) world.byName.set(n, (l = []));
      l.push(i);
    }
    world.moved(i);
  }
  world.invalidateQueries(); // §6.3: nessuna risposta ricordata di prima
  if (s.seeds) world.seeds = s.seeds;
  if (s.seedEmitter) world.seedEmitter = s.seedEmitter;
  manager.al = s.manager.al;
  manager.fogalpha = s.manager.fogalpha;
  manager.rain = s.manager.rain;
  path.cost.set(s.path.cost);
  path.enemyBlock.set(s.path.enemyBlock);
  fog.explored.set(s.fog.explored);
  const P = world.particles;
  P.systems = s.particles.systems;
  P.seq = s.particles.seq;
  P.count = P.systems.reduce((n, ps) => n + ps.parts.length, 0);
  cam.scaleview = s.cam.scaleview;
  cam.x = s.cam.x;
  cam.y = s.cam.y;
}
