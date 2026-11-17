// Lo stato di una partita, da salvare e da rimettere al suo posto
// (save.js scrive e legge il formato). Cosa c'e':
// - le istanze del mondo, nell'ordine di creazione (conta: ordine degli
//   eventi e delle ricerche), con l'id successivo;
// - global.* (g), gli allarmi del manager (notte, pioggia, orologio...),
//   la sua dissolvenza della nebbia e il sistema della pioggia;
// - la griglia dei costi, quella delle porte e quella degli ostacoli fissi
//   (pathing.js), la griglia
//   della scoperta della nebbia (fog.js; vista e ombra si ricalcolano a
//   ogni disegno), i sistemi di particelle con le particelle vive
//   (l'erba decorativa dura per sempre) e i semi della semina;
// - posizione e zoom della view.
// Non ci sono: comportamenti, asset, indici (byName, griglia delle celle:
// si ricostruiscono), lo stato del puntatore e della tastiera.

import { Alarms } from "./alarms.js";
import { encodeGraph, decodeGraph, SAVE_VERSION } from "./save.js";
import { ZOOM_MAX } from "./camera.js";
import { simRngState, simRngRestore } from "./rng.js"; // §9.152
import { isUiObject, indexNames } from "./world.js"; // §9.152

const isInstance = (o) => typeof o.object === "string" && typeof o.id === "number" && o.alarm instanceof Alarms;
const OPTS = { isInstance, skipInstanceKeys: ["parents", "cells", "_qs", "steerField", "chaseFf", "lmc", "_far", "_bb", "_tStep", "_tSum", "_trk", "edgeT"], classes: { Alarms }, roundKeys: ["parts"] };

export function captureGame({ world, g, manager, path, fog, cam, room }) {
  const P = world.particles;
  const state = encodeGraph({
    instances: world.instances.filter((i) => i.alive && !i.fx), // §9.152: non le cosmetiche
    nextId: world.nextId,
    fxNextId: world.fxNextId, // §9.152
    // [§7.10] il contatore dei passi: le attese scritte come "fino al passo
    // N" (reposAt, rallyTry, meleeRoute) dopo un caricamento ripartivano da 0
    stepNo: world._stepNo,
    seeds: world.seeds || null,
    seedEmitter: world.seedEmitter || null,
    g,
    manager: { al: manager.al, fogalpha: manager.fogalpha, rain: manager.rain, overcast: world.overcast, // §9.92: overcast
               dayLen: manager.dayLen }, // §9.143 (la musica: quanto e' avanzato il giorno)
    path: { cost: path.cost, enemyBlock: path.enemyBlock, enemyPass: path.enemyPass, solid: path.solid },
    fog: { explored: fog.explored },
    particles: { systems: P.systems, seq: P.seq },
    cam: { x: cam.x, y: cam.y, scaleview: cam.scaleview },
    rng: simRngState(), // §9.152: la sequenza della partita riprende uguale
  }, OPTS);
  return { game: "535", v: SAVE_VERSION, room, date: Date.now(), state };
}

// [§9.152, multiplayer, fase 1] L'impronta della partita: un hash (FNV-1a a
// 32 bit, due volte con semi diversi) dello stato che due browser della
// stessa partita in rete devono avere uguale. Fuori: quello di chi guarda
// (particelle, nebbia di guerra, telecamera e zoom, il puntatore), le
// istanze cosmetiche (fx) e quelle dell'interfaccia che seguono la vista
// (pulsanti, dialoghi, suggerimenti).
// le chiavi di global che sono dell'interfaccia di chi guarda
export const UI_GLOBALS = ["scaleview", "sz", "sele", "multi", "startx", "starty", "enemyhover", "hover", "mouse_x", "mouse_y",
                           "alarms", "alarmhint", // gli allarmi d'attacco della minimappa (attackalarm.js)
                           // [§9.154, fase 2, passo 2] la selezione e' di chi guarda: in rete ognuno ha
                           // la sua; i contatori dei selezionati
                           "sel", "milsel", "firesel", "arcsel", "siegsel", "selected",
                           // il puntatore sopra una risorsa, un cantiere, un campo, una torre (il cerchio)
                           "alberhover", "minierahover", "stonehover", "farmhover", "buildhover", "preshover",
                           // V tenuto, minimappa, obiettivi, suggerimenti accesi (tasti di chi guarda)
                           "visia", "minim", "obj", "hint"];
// [§9.154] i campi delle istanze che sono della selezione di chi guarda (il
// selezionato, il doppio clic in corso, il gruppo di controllo)
export const SELECTION_KEYS = ["selected", "dcAt", "assi", "_mouseOver", // (e il puntatore sopra l'istanza)
                               "alLife", "_fogStamp"]; // §9.155: gli allarmi della minimappa e la nebbia di chi guarda
// i campi delle istanze che tengono stato grafico (particelle di fuoco ed
// erba, righe del grano): diversi con le opzioni grafiche di chi guarda
const VISUAL_KEYS = ["fire_ps", "fire_emitter", "fire_part", "grass_rows", "grass_system", "grass_system_black",
                     "grass_emitter", "crop_rows", "skRain", "skRainPs"];
const HASH_OPTS = { ...OPTS, skipInstanceKeys: [...OPTS.skipInstanceKeys, "hover", "hov", ...VISUAL_KEYS, ...SELECTION_KEYS] };
export function stateParts({ world, g, manager, path }) {
  const gg = {};
  for (const k of Object.keys(g)) if (!UI_GLOBALS.includes(k)) gg[k] = g[k];
  return {
    instances: world.instances.filter((i) => i.alive && !i.fx && !i.ui),
    nextId: world.nextId, stepNo: world._stepNo, g: gg,
    manager: { al: manager.al, overcast: world.overcast, rain: manager.rain ? manager.rain.level ?? 1 : 0 },
    path: { cost: path.cost, enemyBlock: path.enemyBlock, enemyPass: path.enemyPass, solid: path.solid },
    rng: simRngState(),
  };
}
export function stateHash(refs) {
  const s = JSON.stringify(encodeGraph(stateParts(refs), HASH_OPTS));
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x9e3779b9;
  for (let k = 0; k < s.length; k++) {
    const c = s.charCodeAt(k);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x5bd1e995);
  }
  return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}
// lo stato in chiaro per trovare dove due partite divergono (le prove)
export const stateDump = (refs) => encodeGraph(stateParts(refs), HASH_OPTS);

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
      o.ui = isUiObject(o.object, def.parents); // §9.152 (anche i salvataggi di prima)
    },
  });
  for (const k of Object.keys(g)) delete g[k];
  Object.assign(g, s.g);
  world.instances = s.instances;
  world.nextId = s.nextId;
  world.fxNextId = s.fxNextId ?? Math.min(-1, ...s.instances.map((i) => i.id - 1)); // §9.152
  world._stepNo = s.stepNo || 0;
  simRngRestore(s.rng ?? null); // §9.152 (i salvataggi di prima: senza)
  world.byName = new Map();
  world.grid = new Map();
  for (const i of world.instances) {
    for (const n of indexNames(i)) { // §9.154
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
  if (s.manager.dayLen) manager.dayLen = s.manager.dayLen; // §9.143 (non nei salvataggi di prima: music.js se la cava)
  world.overcast = s.manager.overcast; // §9.92 (undefined nei salvataggi di prima: overcastStep lo rimette)
  manager.endlessNight();
  world.twilight = manager.twilight(); // §9.88: la visuale del crepuscolo gia' al primo disegno
  path.cost.set(s.path.cost);
  path.enemyBlock.set(s.path.enemyBlock);
  if (s.path.enemyPass) path.enemyPass.set(s.path.enemyPass); else path.enemyPass.fill(0); // §9.75; i salvataggi di prima non l'hanno
  path.restoreSolid(s.path.solid); // i salvataggi di prima non l'hanno
  fog.explored.set(s.fog.explored);
  const P = world.particles;
  P.systems = s.particles.systems;
  P.seq = s.particles.seq;
  P.count = P.systems.reduce((n, ps) => n + ps.parts.length, 0);
  cam.scaleview = Math.min(ZOOM_MAX, s.cam.scaleview); // i salvataggi di quando si arrivava a 2,0
  cam.centerFirst = false; // §9.107: la view salvata, cosi' com'era
  cam.zoomTarget = null; // §9.83: uno zoom in corso al caricamento si ferma
  cam.x = s.cam.x;
  cam.y = s.cam.y;
}
