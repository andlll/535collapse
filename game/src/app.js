// Avvio del motore e di una room (?room=menu|match|lvl01|lvl02).
//
// Sistemi portati finora (STUDIO.md §3): manager e interfaccia; selezione,
// ordini e movimento; civili, raccolta, costruzione, campi, mura e porte;
// combattimento, edifici nemici e regia dei livelli; nebbia e notte. Gli
// altri oggetti sono disegnati con il loro sprite e non fanno ancora nulla.
// F3 apre la diagnostica.

import { Renderer, bgrToRGB, packColor } from "./gl.js";
import { Assets } from "./assets.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Loop } from "./loop.js";
import { RenderScale } from "./renderscale.js";
import { Diagnostics } from "./diag.js";
import { World } from "./world.js";
import { Pathing } from "./pathing.js";
import { cavaliere, infantry, controlGroups, behaviourClicker, behaviourAction, corpse, enemyDummy, movementGeneral, ENEMY_LIFE, recountSelection, formation, settleOverlaps } from "./units.js";
import { producer, unitClicker, cancelClicker, PRODUCERS, produceAction, cancelAction } from "./production.js";
import { enemyMelee, enemyArcher, atkSignalObject, settleEnemies, defendBuildings } from "./enemies.js";
import { alarmsStep } from "./attackalarm.js";
import { enemyBuilding, oBox, church, crossEffect, roleAssign, ENEMY_BUILDINGS } from "./enemybuild.js";
import { enemyManager, enemyManagerLv2, enemyManagerLv3, enemyManagerLv4, enemyManagerLv5, enemyManagerLv6, lockedTower, levelStep, lvl05Setup, objectiveMarks } from "./levels.js";
import { sliced, neutral, splitGroups, createNeutral } from "./scenario.js";
import { cloudBlobs, drawCloudShadows, shadeAt, ambienceStep, treeSway, SWAY_DRAW, leafType } from "./ambience.js";
import { allyRam, allyCatapult, catapultBullet, debris, bloodSplat, fireBullet, smoke, enemyRam, enemyCatapult, settleSiege } from "./siege.js";
import { allyArrow, enemyArrow, allyArcher, garrisoned, centroArrows, enemyTower, flag } from "./ranged.js";
import { omino, resource, dying, recountIdle } from "./civilians.js";
import { FAM, clicker, placer, buildAction, fond, built, allyBuild, campoFond, campo, foodBullet, centro, ominoClicker, centroCancel, workerAction, cancelWorkerAction, blink, WOOD_RUINS, woodRuin,
         prizeDrawer, idleClicker, buildButtons, monastery } from "./buildings.js";
import { wallFond, wall, gate, enemyWall, enemyGate, mplus, wallExtender, wallPreview, gateClicker, extendAction, gateAction } from "./walls.js";
import { CITY_FIRES, cityBuilding, fireStarter, palo, statue, houseTorch, houseTorches } from "./props.js";
import { FogMap, sightK } from "./fog.js";
import { GroundCache } from "./ground.js";
import { riverGeometry, riverJoin, roadGeometry, bridgeGeometry, patchGeometry, riverCells, riverIn, stopsAtWater, BRIDGE_RAILS } from "./rivers.js";
import { Particles } from "./particles.js";
import { DECOR_OBJECTS, decorCreate, aquila } from "./effects.js";
import { hint, dialog, HINT_NAMES, DIALOG_NAMES } from "./hints.js";
import { victoryManager, gameoverManager, objectiveButton, VICTORY, victoryProgress } from "./endgame.js";
import { loadUnlock, canPlay } from "./progress.js";
import { FogLayer } from "./fogdraw.js";
import { Draw } from "./draw.js";
import { Manager } from "./manager.js";
import { newGlobals } from "./state.js";
import { loadSettings, saveSettings } from "./settings.js";
import { setLanguage, t, tr } from "./i18n.js";
import { PauseMenu } from "./pause.js";
import { enemyManagerMenu, fogController, fog01, VERSION } from "./menu.js";
import { fogBank, stealthMarks, shotClicker, shotAction, provaNebbia } from "./stealth.js"; // §9.148
import { enemyManagerLv7 } from "./lvl07.js"; // §9.178
import { captureGame, restoreGame, stateHash, stateDump } from "./snapshot.js";
import { simSeed, freshSeed, simSeedValue } from "./rng.js"; // §9.152
import { Commands } from "./commands.js"; // §9.153
import { fiumeGrande, ponte } from "./bridge.js";
import { enemyOmino, enemyCampo, enemyEco, enemyCantiere, ECO } from "./economy.js";
import { SK_MAPS, SK_ROOMS, isSkirmish, loadSkirmish, skirmishPrepare, skirmishStart, skManager, skNebbia, skNube, pvpTruce } from "./skirmish.js";
import { setupMultiplayer, pvpVisibility, baseOf } from "./multiplayer.js"; // §9.155, §9.174
import { netParams, startNet, hostGame, joinMenu } from "./netgame.js"; // §9.156, §9.157
import { p2SpriteMap } from "./p2sprites.js";
import { saveSlot, loadSlot, loadSlotIndex, takePending, setPending, saveFile, openFile } from "./save.js";
import { toggleFullscreen } from "./fullscreen.js";
import { loadDomFont, setDomText } from "./domtext.js";
import { audio } from "./audio.js"; // §9.137
import { musicPlan } from "./music.js"; // §9.161

// lvl03, lvl04, lvl05: scenari da Tiled (§9.10, §9.40, §9.74)
const ROOMS = ["menu", "match", "lvl01", "lvl02", "lvl03", "lvl04", "lvl05", "lvl06", "lvl07", ...SK_ROOMS, "editor"]; // lvl06: §9.100; lvl07: §9.178; SK_ROOMS: §9.118; editor: §9.180
// Gruppi d'atlas per room (tools/05_atlas.py, tier).
const TIERS = { menu: ["core", "menu", "gioco"], match: ["core", "gioco"],
                lvl01: ["core", "gioco", "citta"], lvl02: ["core", "gioco", "citta"], lvl03: ["core", "gioco"],
                lvl04: ["core", "gioco"], lvl05: ["core", "gioco"], lvl06: ["core", "gioco", "citta"], lvl07: ["core", "gioco", "citta"],
                ...Object.fromEntries(SK_MAPS.filter((m) => m.room).map((m) => [m.room, ["core", "gioco", ...(m.tiers || [])]])) }; // §9.118, §9.123: tiers

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const settings = loadSettings();
// [§9.137] gli effetti sonori: si scaricano subito, suonano dopo il primo
// gesto del giocatore (il browser non lascia partire l'audio prima)
audio.load();
for (const ev of ["pointerdown", "keydown"]) window.addEventListener(ev, () => audio.unlock(), true);
setLanguage(settings.language);

// i messaggi del motore si ricordano per chiave, per tradurli di nuovo se
// si cambia lingua dal menu di pausa
let lastMessage = null;
function message(text, kind = "info", key = null) {
  lastMessage = key ? [key, kind] : null;
  const el = $("message");
  setDomText(el, text, { font: "overdue", width: msgWidth() });
  el.className = kind;
  el.hidden = !text;
}

// larghezza utile dei riquadri dei messaggi (max-width in index.html meno
// il padding)
const msgWidth = () => Math.min(window.innerWidth * 0.9, 720) - 32;

// messaggio breve (salvataggi), in alto, sparisce da solo
let toastTimer = 0;
function toast(text, kind = "info") {
  const el = $("toast");
  setDomText(el, text, { font: "overdue", width: msgWidth() });
  el.className = kind;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2500);
}

function progress(done, total) {
  const el = $("loading");
  el.hidden = done >= total;
  $("loading-bar").style.width = `${total ? (100 * done) / total : 0}%`;
}

async function main() {
  loadDomFont(); // §6.1 n.86: i messaggi HTML col font del gioco
  setDomText($("loading-text"), t("loading"), { font: "GUI_1", colour: "#e8e2d0" });
  const canvas = $("game");
  const r = new Renderer(canvas);
  try {
    r.init();
  } catch (e) {
    message(t("noWebgl2"), "error");
    return;
  }
  if (r.software) message(t("softwareWarning"), "warning", "softwareWarning");

  const assets = new Assets(r);
  try {
    await assets.init();
  } catch (e) {
    message(t("textureTooBig") + " (" + e.message + ")", "error");
    return;
  }

  // [§9.164] un livello della campagna non ancora sbloccato (l'indirizzo
  // cambiato a mano) porta al menu, e l'indirizzo lo dice
  const asked = params.get("room");
  const roomName = ROOMS.includes(asked) && canPlay(asked, loadUnlock()) ? asked : "menu";
  if (asked && roomName !== asked) {
    for (const k of [...params.keys()]) params.delete(k); // niente salvataggio, campagna, rete...
    params.set("room", "menu");
    history.replaceState(null, "", location.pathname + "?room=menu");
  }
  // [§9.180] l'editor di mappe: un ciclo suo, senza partita (editor.js, in
  // un pezzo a parte del bundle: si scarica solo quando lo si apre)
  if (roomName === "editor") {
    const { runEditor } = await import("./editor.js");
    return runEditor({ r, assets, canvas, settings, params, toast, progress });
  }
  // [§9.156, multiplayer, fase 4] la partita a due in rete (?net=host|join,
  // netgame.js): chi crea e' il rosso, chi entra il blu; mappa, opzioni e
  // seme sono quelli di chi crea
  const net = netParams(params, roomName);
  // [§9.152, multiplayer, fase 1] il seme della partita, prima di tutto (gli
  // alberi a caso della room, la schermaglia): ?seed=N per le prove e, poi,
  // per la partita in rete; se no uno nuovo. Con ?nostart e senza seed (le
  // prove nel browser, che fissano Math.random a mano) Math.random come prima
  if (params.has("seed")) simSeed(Number(params.get("seed")) >>> 0);
  else if (!params.has("nostart")) simSeed(freshSeed());
  const room = await (await fetch(`assets/rooms/${roomName}.json`)).json();
  setDomText($("loading-text"), t("loading"), { font: "GUI_1", colour: "#e8e2d0" });
  await assets.load(assets.groupsOfTier(...TIERS[roomName]),
                    [...room.backgrounds.map((b) => b.name), "fiume_acqua", "fiume_sassi", "fiume_carta",
                     ...(room.patches || []).map((p) => p.bg || "city2")], progress); // §9.97, §9.99

  const [objects, masks] = await Promise.all(
    ["objects.json", "masks.json"].map(async (f) => (await fetch("assets/" + f)).json()));
  // [§9.100] i gruppi d'atlas degli sprite degli oggetti della room che TIERS
  // non carica: nel livello 6 la citta' (110 oggetti) era invisibile
  const needed = new Set();
  for (const [obj] of room.instances) {
    const o = objects[obj], s = o && o.sprite && assets.sprites[o.sprite];
    if (s && !assets.groups.has(s.group)) needed.add(s.group);
  }
  if (needed.size) await assets.load([...needed], [], progress);
  // Il cursore del gioco (mouser Create: action_set_cursor(cursore) [C]),
  // come lo fa il runner: la freccia del sistema nascosta e lo sprite
  // disegnato dal gioco sopra a tutto (drawCursor). [§6.1 n.83] Prima era
  // un cursore CSS da 53x54 px, che Chrome rifiuta vicino ai bordi della
  // finestra (sopra i 32 px) mostrando la freccia.
  canvas.style.cursor = "none";
  const cam = new Camera(room.width, room.height, room.views[0]);
  audio.cam = cam; // §9.137: il volume secondo la distanza dalla vista
  audio.world = roomName !== "menu"; // §9.139: la battaglia di sfondo del menu e' muta
  audio.musicRoom = roomName !== "menu"; // §9.143: la musica in partita (nel menu, da decidere)
  audio.musicPlan = musicPlan(roomName); // §9.161: i brani della room, a turno
  const input = new Input(canvas);
  input.wantLock = settings.lockMouse && roomName !== "menu";
  const rscale = new RenderScale();
  rscale.enabled = settings.dynamicResolution;
  const diag = new Diagnostics($("diag"));
  diag.toggle(settings.diagnostics || params.has("diag"));
  const clear = bgrToRGB(room.colour);
  const g = newGlobals(roomName);
  // [§9.155, multiplayer, fase 3] la partita a due: ?pvp=1 su una mappa da
  // schermaglia (per ora nella stessa pagina; &parte=2: si gioca il blu).
  // La cassa del giocatore 2 c'e' prima che nascano le istanze (il suo
  // centro alza il suo tetto di popolazione)
  const pvp = (params.get("pvp") === "1" || !!net) && isSkirmish(roomName);
  if (pvp) g.p2 = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, popcap: 0, idle: 0 };
  const manager = new Manager(roomName, g);
  const draw = new Draw(r, assets);
  draw.setFont("GUI_1");

  const world = new World({ objects, masks: masks.sprites, assets, g, roomW: room.width, roomH: room.height });
  world.room = roomName;
  // [§9.116, richiesta dell'autore] nel menu unita' ed edifici sono solo
  // decorativi: mouse e tastiera arrivano solo al gestore del menu
  if (roomName === "menu") world.inputOnly = new Set(["enemy_manager_menu"]);
  world.cam = cam;
  world.particles = new Particles();
  world.gfx = draw; // per string_height_ext nei Create (hints.js)
  manager.world = world;
  g.unlock = loadUnlock();
  // room_goto: si ricarica la pagina sulla room. global.campagna nell'originale
  // sopravvive al cambio di room (dal menu della campagna a un livello e
  // ritorno, con la vittoria o la sconfitta): qui passa dall'indirizzo.
  if (params.get("campaign") === "1") g.campagna = 1;
  world.hooks.roomGoto = (name) => {
    if (netGame) netGame.leave(); // §9.156: il saluto all'altro giocatore
    location.search = "?room=" + name + (g.campagna === 1 ? "&campaign=1" : "");
  };
  let netGame = null; // §9.156: la partita in rete (startNet, sotto)
  // [§9.97] i fiumi disegnati come linee (rivers.js): forma, acqua, ostacolo
  const FEET = [10, 5];
  const useRivers = (list, roads = [], bridges = [], patches = []) => {
    const R = [room.width, room.height];
    world.patches = patches.map(patchGeometry); // §9.99
    world.rivers = riverJoin(list, (rv) => riverGeometry({ ...rv, room: R })); // §9.100: le foci
    world.roads = roads.map((rd) => roadGeometry({ ...rd, room: R }));
    world.bridges = bridges.map(bridgeGeometry);
    world._riverCells = undefined; world._water = undefined;
    // le unita' contano i piedi (FEET px attorno al punto in cui toccano
    // terra), i fantasmi degli edifici tutta la maschera: col riquadro intero
    // un'unita' sulla riva "toccava" l'acqua, e i nemici che toccano
    // qualcosa avanzano dritti (enemies.js pushThrough)
    world.terrainBlocks = world.rivers.length ? (inst, x, y) => {
      if (!stopsAtWater(world, inst)) return false;
      const rc = riverCells(world);
      if (!rc) return false;
      if (!/_placer$/.test(inst.object)) return riverIn(rc, x - FEET[0], y - FEET[1], x + FEET[0], y + FEET[1]);
      const bb = world.bbox(inst, x, y);
      return !!bb && riverIn(rc, bb[0], bb[1], bb[2], bb[3]);
    } : null;
  };
  useRivers(room.rivers || [], room.roads || [], room.bridges || [], room.patches || []);
  world.routes = room.paths || []; // §9.101: i percorsi della regia (livello regia di Tiled)
  const path = new Pathing(world, room.width, room.height);
  world.path = path;
  // [§9.10] oggetti nuovi disegnati a fette (tools/nuovi.py): l'oggetto
  // tiene la maschera intera e non si disegna; nel Create nasce una
  // "__fetta" per ogni striscia verticale dello sprite, ferma, con la depth
  // del bordo anteriore della maschera in quella colonna
  for (const [name, o] of Object.entries(objects)) if (o.slices) world.register(name, sliced(o));
  // [§9.100] i ponti dipinti con la balaustra a parte: nasce con loro, specchiata come loro
  for (const [name, rail] of Object.entries(BRIDGE_RAILS)) {
    world.register(name, { create(i, w) { w.create(rail, i.x, i.y, { sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle }); } });
  }
  world.register("__neutrale", neutral());       // §9.11 (scenario.js)
  world.register("monastero", monastery(path));  // §9.11 (buildings.js)
  world.register("fiume_grande", fiumeGrande());  // §9.40 (bridge.js)
  world.register("enemy_omino", enemyOmino(path)); // §9.44 (economy.js)
  world.register("enemy_campo", enemyCampo(path));
  world.register("enemy_eco", enemyEco(path));
  world.register("enemy_cantiere", enemyCantiere(path));
  world.register("ponte", ponte(path));
  world.register("enemy_manager_lv3", enemyManagerLv3(path));
  world.register("enemy_manager_lv4", enemyManagerLv4(path)); // §9.52
  world.register("enemy_manager_lv5", enemyManagerLv5(path)); // §9.76
  world.register("enemy_manager_lv6", enemyManagerLv6(path)); // §9.101
  world.register("enemy_manager_lv7", enemyManagerLv7()); // §9.178
  world.register("ally_cavaliere", cavaliere(path));
  world.register("ally_omino", { ...omino(path), ...controlGroups(true) });
  world.register("ally_warrior", infantry("ally_warrior", path));
  world.register("ally_picchiere", infantry("ally_picchiere", path));
  world.register("ally_militare", controlGroups(false));
  world.action("comportamento", behaviourAction); // §9.154
  world.register("attacco_clicker", behaviourClicker("attacco"));
  world.register("difesa_clicker", behaviourClicker("difesa"));
  for (const n of ["albero", "albero_fake", "miniera_oro", "pietra_grande", "pietr_piccolo", "castelloruin", "torreruin", "chiesaruin"]) world.register(n, resource(path, n));
  for (const n of ["albero_morente", "miniera_morente", "pietra_grande_morente", "pietr_piccolo_morente",
                   "castelloruin_morente", "torreruin_morente", "chiesaruin_morente"]) world.register(n, dying());
  world.register("centro", centroArrows(centro(path)));
  world.register("ally_build", allyBuild());
  world.register("ally_arciere", allyArcher(path));
  world.register("enemy_arciere", enemyArcher(path));
  world.register("ally_ariete", allyRam());
  world.register("ally_catapulta", allyCatapult());
  world.register("enemy_ariete", enemyRam(enemyMelee("enemy_picchiere", path)));
  world.register("enemy_catapulta", enemyCatapult(enemyMelee("enemy_picchiere", path)));
  world.register("catapulta_bullet", catapultBullet(false));
  world.register("b_catapulta_bullet", catapultBullet(true));
  world.register("sfx_mattone", debris());
  world.register("sfx_erba", debris());
  world.register("sfx_sangue", bloodSplat());
  world.register("fire_bullet", fireBullet());
  world.register("nubeqq", smoke());
  for (const n of ENEMY_BUILDINGS) world.register(n, enemyBuilding(n, path)); // §9.43: anche i nuovi
  for (const n of ["o_box1", "o_box2"]) world.register(n, oBox(n, path));
  world.register("sfx_croce", crossEffect());
  world.register("aggr_assign", roleAssign(30));
  world.register("def_assign", roleAssign(10));
  world.register("enemy_manager", enemyManager());
  world.register("enemy_manager_lv2", enemyManagerLv2(path));
  world.register("arciere_bullet", allyArrow(false));
  world.register("arciere_bullet_t", allyArrow(true));
  world.register("b_arciere_bullet", enemyArrow(false));
  world.register("b_arciere_bullet_t", enemyArrow(true));
  world.register("enemy_torre", enemyTower(path));
  world.register("flag_r", flag("rflag", -200));
  world.register("flag_r2", flag("rflag", -400));
  world.register("flag_b", flag("bflag", -200));
  for (const f of Object.keys(FAM)) {
    world.register(f + "_clicker", clicker(f));
    world.register(f + "_placer", placer(f));
    if (f === "campo" || f === "mura") continue;
    world.register(f + "_fond", fond(f, path));
    let b = built(f, path);
    if (PRODUCERS[f]) b = producer(f, b, path);
    if (f === "torre" || f === "castello") b = garrisoned(f, b);
    if (f === "torre") b = lockedTower(b); // §9.101: le torri del livello 6
    if (f === "chiesa") b = church(b);
    world.register(f, b);
  }
  for (const [prod, P] of Object.entries(PRODUCERS)) {
    for (const [type, u] of Object.entries(P.units)) if (u.clicker) world.register(u.clicker, unitClicker(prod, Number(type)));
    world.register(P.cancel, cancelClicker(prod));
  }
  world.register("campo_fond", campoFond(path));
  world.register("campo", campo(path));
  world.register("food_bullet", foodBullet());
  for (const k of ["ori", "vert"]) {
    world.register(`mura_${k}_fond`, wallFond(k, path));
    world.register(`mura_${k}`, wall(k, path));
    world.register(`porta_${k}`, gate(k, path));
    world.register(`enemy_mura_${k}`, enemyWall(k, path)); // §9.75
    world.register(`enemy_porta_${k}`, enemyGate(k, path));
  }
  for (const s of ["os", "od", "va", "vb"]) {
    world.register("mplus_" + s, mplus("mplus_" + s));
    world.register("muraplacer_" + s, wallExtender("muraplacer_" + s));
  }
  for (const n of ["oodl", "oosl", "ovbl", "oval"]) world.register(n, wallPreview(n));
  world.register("gate_clicker", gateClicker());
  world.action("prolunga", extendAction); // §9.154
  // [§9.156] niente trucchi nella partita in rete
  world.action("trucco", (w, c) => { if (!net) manager.cheat(c.res, w.g); });
  world.action("porta", gateAction);
  // [§9.154] le code di produzione come comandi
  world.action("costruisci", buildAction);
  world.action("civile", workerAction);
  world.action("annulla_civile", cancelWorkerAction);
  world.action("produci", produceAction);
  world.action("annulla", cancelAction);
  world.register("omino_clicker", ominoClicker());
  world.register("centro_indietro_clicker", centroCancel());
  for (const n of ["wood_blink", "stone_blink", "food_blink", "gold_blink", "pop_blink"]) world.register(n, blink(n));
  world.register("legno_prizedrawer", prizeDrawer("ico_wood_prize"));
  world.register("oro_prizedrawer", prizeDrawer("ico_gold_prize"));
  world.register("cibo_prizedrawer", prizeDrawer("ico_food_prize"));
  world.register("idle_clicker", idleClicker());
  for (const n of Object.keys(objects).filter((k) => k.endsWith("_corpse"))) world.register(n, corpse(n));
  for (const n of WOOD_RUINS) world.register(n, woodRuin(n));
  for (const n of ["enemy_warrior", "enemy_picchiere", "enemy_cavaliere"]) world.register(n, enemyMelee(n, path));
  world.register("atk_signal", atkSignalObject());
  for (const n of Object.keys(CITY_FIRES)) world.register(n, cityBuilding(n));
  world.register("firestarter", fireStarter(true));
  world.register("firestarter_small", fireStarter(false));
  world.register("palo_1", palo(path));
  if (objects.fiaccola_casa) world.register("fiaccola_casa", houseTorch()); // §9.104
  for (const n of ["o_statua1", "o_statua2", "o_statua3", "o_statua4", "o_statua1_real"]) world.register(n, statue());
  for (const n of HINT_NAMES) world.register(n, hint(n));
  for (const n of DIALOG_NAMES) world.register(n, dialog(n));
  world.register("victory_manager", victoryManager());
  world.register("gameover_manager", gameoverManager());
  world.register("sk_manager", skManager()); // §9.118
  world.register("sk_nebbia", skNebbia()); // §9.122
  world.register("sk_nube", skNube());
  world.register("objective_button", objectiveButton());
  for (const n of DECOR_OBJECTS) world.register(n, { create: decorCreate });
  world.register("aquila_01", aquila());
  world.register("enemy_manager_menu", enemyManagerMenu());
  world.register("fog_controller", fogController());
  world.register("fog01", fog01());
  // [§9.148] livello 7: banchi di nebbia, il "!", i modi di tiro, la prova
  world.register("nebbia_banco", fogBank());
  world.register("stealth_segni", stealthMarks());
  world.action("tiro", shotAction); // §9.154
  world.register("tiro_furtivo_clicker", shotClicker("furtivo"));
  world.register("tiro_rapido_clicker", shotClicker("rapido"));
  world.register("prova_nebbia", provaNebbia());
  for (const n of Object.keys(ENEMY_LIFE)) if (!world.behaviours[n]) world.register(n, enemyDummy(n));
  // (w: lo specchio della parte che da' l'ordine, §9.155)
  world.hooks.globalRightReleased = (mx, my, w = world) => {
    // manager Mouse_GlobalRightReleased: if room!=menu scr_movement_general()
    if (roomName !== "menu") movementGeneral(w, path, mx, my);
  };
  world.hooks.afterRightReleased = (mx, my, w = world) => {
    if (roomName !== "menu") formation(w, path, mx, my); // §6.1 n.89
  };
  // manager Create (la parte della griglia dei costi) gira dopo che tutte le
  // istanze della room esistono e prima dei loro Create (world.loadRoom).
  // [Correzioni decise dall'autore, §3.19] n.63: i tre hint_legna piazzati
  // in lvl02 finivano fuori schermo e bloccavano i suggerimenti del
  // livello; n.71: nel menu hint_iniziale era nascosto ma cliccabile.
  // [§9.15] nel tutorial (match) una catapulta alleata da sola al centro
  // della mappa (3420, 3422): era li' per le prove dell'autore.
  const DROPPED = { lvl02: ["hint_legna"], menu: ["hint_iniziale"], match: ["ally_catapulta"] };
  // [§9.36] l'animazione del fiume dell'originale: al suo posto i riflessi,
  // le increspature e la schiuma su tutta l'acqua (effects.js, waterLife)
  const DROPPED_ALL = ["fiume_animazione"];
  // [§9.116, richiesta dell'autore] nel menu la bandierina rossa a sinistra
  // (1308, 1035) sventolava da sola: e' quella del castello del tutorial
  // (match, castello a 1310, 1140), che nel menu e' altrove
  const DROPPED_AT = { menu: [["flag_r", 1308, 1035]] };
  const droppedAt = ([obj, x, y]) => (DROPPED_AT[roomName] || []).some(([o, dx, dy]) => o === obj && dx === x && dy === y);
  const all = room.instances.filter((e) => !(DROPPED[roomName] || []).includes(e[0]) && !DROPPED_ALL.includes(e[0]) && !droppedAt(e));
  // [§9.118] schermaglia: il centro della CPU diventa nemico (non per una
  // partita salvata: lo stato arriva gia' fatto)
  const skParams = net ? { ...net.sk, pvp } // §9.156: le opzioni di chi ha creato la partita
    : isSkirmish(roomName) && !params.get("load") ? (pvp ? { ...loadSkirmish(), pvp } : loadSkirmish()) : null;
  // [§9.155] i gemelli del giocatore 2 e gli specchi (multiplayer.js); gli
  // sprite blu per il disegno (p2sprites.js)
  if (pvp) {
    setupMultiplayer(world, net ? net.local + 1 : params.get("parte") === "2" ? 2 : 1);
    world.p2Sprites = p2SpriteMap(assets.sprites);
  }
  const skStarts = skParams ? skirmishPrepare(skParams, all) : null;
  // [§9.11] i gruppi della mappa: tenuti da parte o neutrali (scenario.js)
  const { now: instances, held, neutrals } = splitGroups(roomName, all);
  const fog = new FogMap(room.width, room.height);
  world.fog = fog;
  // Partita salvata (save.js, snapshot.js): ?load=slot (IndexedDB, §9.107) o
  // ?load=file (il file scelto, passato da setPending). Il parametro si
  // toglie subito: "Ricomincia livello" riparte dalla room.
  const loadMode = net ? null : params.get("load"); // §9.156: niente salvataggi nella partita in rete
  await loadSlotIndex(); // §9.107: le intestazioni degli slot in IndexedDB, per i menu
  let saved = null;
  if (loadMode) {
    saved = loadMode === "slot" ? await loadSlot(roomName) : await takePending();
    params.delete("load");
    history.replaceState(null, "", location.pathname + "?" + params.toString());
    if (!saved || saved.room !== roomName) { saved = null; toast(tr("Not a valid save file"), "warning"); }
  }
  if (saved) {
    restoreGame(saved, { world, g, manager, path, fog, cam });
    g.unlock = Math.max(g.unlock || 1, loadUnlock()); // lo sblocco non torna indietro
  } else {
    world.loadRoom(instances, () => path.initCost());
    g.heldGroups = held;
    for (const e of neutrals) createNeutral(world, e);
    // manager Create, in fondo: instance_create(0,0,idle_clicker) [C]
    world.create("idle_clicker", 0, 0);
    // manager Create, "Livelli" [C]: nel livello 1 mette i militari in
    // difesa (comp=50), ma prima del Create delle unita' che rimette 700:
    // nell'originale partono in attacco. [§3.13 n.51] qui li si metteva in
    // difesa dopo; [§7.4, decisione dell'autore] si torna all'originale:
    // i militari di partenza del livello 1 sono in attacco (comp 700).
    // i gestori del menu e dei nemici di match e lvl02
    if (roomName === "menu") world.create("enemy_manager_menu", 0, 0);
    // [§9.148] ?room=match&prova=nebbia: la prova dello stealth del livello 7
    if (roomName === "match" && params.get("prova") === "nebbia") world.create("prova_nebbia", 0, 0);
    else if (roomName === "match") { world.create("enemy_manager", 0, 0); world.create("objective_button", 0, 0); }
    if (roomName === "lvl02") world.create("enemy_manager_lv2", 0, 0);
    if (roomName === "lvl03") { world.create("enemy_manager_lv3", 0, 0); world.create("objective_button", 0, 0); }
    if (roomName === "lvl04") { world.create("enemy_manager_lv4", 0, 0); world.create("objective_button", 0, 0); } // §9.52
    if (roomName === "lvl05") { lvl05Setup(world); world.create("enemy_manager_lv5", 0, 0); world.create("objective_button", 0, 0); } // §9.75, §9.76
    if (roomName === "lvl06") { world.create("enemy_manager_lv6", 0, 0); world.create("objective_button", 0, 0); } // §9.101
    if (roomName === "lvl07") { world.create("enemy_manager_lv7", 0, 0); world.create("objective_button", 0, 0); } // §9.178
    if (skStarts) skirmishStart(world, g, manager, fog, cam, skParams, skStarts); // §9.118
    if (world.mp) world.mp.truce = pvpTruce(g); // §9.156
  }
  // [§9.56] prove della schermata di vittoria: ?victory=1 vince dopo un
  // secondo; ?vblur, ?vwhite, ?vin, ?vtext, ?vtextin cambiano VICTORY
  // (endgame.js)
  for (const [k, q] of [["blur", "vblur"], ["white", "vwhite"], ["blurIn", "vin"], ["textAt", "vtext"], ["textIn", "vtextin"]]) {
    const v = parseFloat(params.get(q));
    if (Number.isFinite(v)) VICTORY[k] = v;
  }
  let victoryAt = params.get("victory") === "1" && roomName !== "menu" ? 60 : 0;
  // manager Step: pulsanti di costruzione, poi la regia dei livelli
  // (i pulsanti sono di chi guarda: il suo specchio, §9.155)
  world.hooks.step = () => { buildButtons(world.worldFor(null)); levelStep(world); };
  // [§9.170, richiesta dell'autore] un edificio distrutto (a vita 0: colpi,
  // fuoco, demolizione; anche i cantieri) crolla con un suono, se chi guarda
  // lo vede: i grandi (vita piena da 300 in su: caserma, stalla, centro,
  // castello, torre, chiesa, monastero) "rovina", gli altri (case,
  // magazzini, mulini, mura, cantieri) "rovina_piccola"
  // [§9.174, richiesta dell'autore] e un'unita' che muore (a vita 0; non chi
  // entra in una torre o un presidio): niente voci, la caduta. I civili il
  // tonfo, i soldati il tonfo e l'arma, i cavalieri due tonfi (cavallo e
  // cavaliere), arieti e catapulte il legno che si rompe (rovina_piccola)
  const BUILD_FAMILIES = ["ally_build", "enemy_build", "p2_build"];
  const UNIT_FAMILIES = ["ally_unit", "enemy_unit", "p2_unit"];
  const deathSound = (i) => {
    const n = baseOf(i);
    if (/omino$/.test(n)) return "morte_civile";
    if (/cavaliere$/.test(n)) return "morte_cavaliere";
    if (/ariete$|catapulta$/.test(n)) return "rovina_piccola";
    return "morte";
  };
  world.hooks.destroyed = (i) => {
    if (!(i.life <= 0) || !world.shown(i)) return;
    // [§9.175] il crollo si sente anche fuori dalla vista, lontano (audio.js far)
    if (i.parents.some((p) => BUILD_FAMILIES.includes(p))) audio.play(i.slife >= 300 ? "rovina" : "rovina_piccola", i.x, i.y, 1, false, true);
    else if (i.parents.some((p) => UNIT_FAMILIES.includes(p))) audio.play(deathSound(i), i.x, i.y);
  };
  // nebbia: scoperta (stato, aggiornata a ogni passo) e disegno (fog.js)
  fog.update(world.worldFor(null)); // §9.155: chi guarda (dal blu, i suoi)
  const fogLayer = new FogLayer(r, fog);
  const ground = new GroundCache(r, assets, room, world, clear);

  // Dimensioni: la view segue la finestra in pixel CSS (come l'originale).
  // [§6.8 G1] Il canvas ha pixel reali = CSS x densita' dello schermo (fino a
  // 2): li' si disegna l'interfaccia, sempre nitida. Il mondo si disegna con
  // `worldScale` pixel per pixel CSS = densita' limitata dalla qualita'
  // (Alta: com'e', Media: 1,25, Bassa: 1) x scala dinamica; se e' minore di
  // quella del canvas passa da una superficie piu' piccola, ingrandita a
  // schermo pieno prima dell'interfaccia. Prima la scala dinamica
  // rimpiccioliva tutto il canvas, interfaccia compresa.
  const QUALITY_CAP = { high: 2, medium: 1.25, low: 1 };
  const GRASS_DENSITY = { high: 1, medium: 0.7, low: 0.5 }; // §7.15 G5
  let canvasScale = 1, worldScale = 1;
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvasScale = dpr;
    worldScale = Math.min(dpr, QUALITY_CAP[settings.quality] || 2) * rscale.scale;
    canvas.width = Math.max(1, Math.round(w * canvasScale));
    canvas.height = Math.max(1, Math.round(h * canvasScale));
    cam.resize(w, h);
  };
  window.addEventListener("resize", resize);
  for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(ev, () => { pause.dirty = true; });
  resize();
  // [§9.118] schermaglia: la vista sulla propria base, a misura nota
  // ([§9.155] chi gioca blu sulla base blu)
  if (skStarts) {
    const [bx, by] = world.mp && world.mp.local === 2 ? skStarts.cpu : skStarts.player;
    cam.x = bx - cam.w / 2; cam.y = by - cam.h / 2; cam.clamp();
  }

  // Un passo, nell'ordine di GameMaker (STUDIO.md §1.3): alarm, tastiera,
  // mouse, Step, poi la view segue il puntatore.
  // Menu di pausa (pause.js): il mondo si ferma (instance_deactivate_all
  // dell'originale), passano solo i clic sul pannello.
  const applyGraphics = () => {
    for (const k of ["rain", "grass", "fire", "blood"]) { // blood: §9.117
      if (settings[k]) world.particles.hidden.delete(k); else world.particles.hidden.add(k);
    }
    // [§7.15 G5] erba e spighe piu' rade con la qualita' piu' bassa (2500-4000
    // fili disegnati a ogni fotogramma, fino al 45% del disegno nel menu)
    world.particles.density.grass = GRASS_DENSITY[settings.quality] ?? 1;
    audio.setEnabled(settings.sfx); // §9.137
    audio.setMusicEnabled(settings.music); // §9.143
    rscale.enabled = settings.dynamicResolution;
    loop.fpsCap = settings.fpsCap;
    resize(); // §6.8 G1: la qualita' cambia la scala del mondo
    // "Blocca il mouse nella finestra" (input.js, §6.1 n.82): si attiva al
    // prossimo clic sul gioco
    input.wantLock = settings.lockMouse && roomName !== "menu";
    if (!input.wantLock) input.unlock();
    saveSettings(settings);
  };
  // Salvataggi (save.js, snapshot.js; menu di pausa, "Salva e carica")
  const capture = () => captureGame({ world, g, manager, path, fog, cam, room: roomName });
  const campaignParam = () => (g.campagna === 1 ? "&campaign=1" : "");
  const saveGame = async (auto = false) => {
    try {
      await saveSlot(capture());
      toast(tr(auto ? "Game saved automatically" : "Game saved"));
    } catch (e) {
      console.error(e);
      toast(tr("Saving failed"), "warning");
    }
  };
  const pause = new PauseMenu({
    g, settings, room: roomName,
    actions: {
      language: (code) => {
        settings.language = setLanguage(code);
        saveSettings(settings);
        if (lastMessage) message(t(lastMessage[0]), lastMessage[1], lastMessage[0]);
      },
      restart: () => location.reload(),          // room_restart
      // [§9.156] in rete la pausa e la ripresa sono di tutte e due le pagine
      requestPause: () => { if (netGame) netGame.requestPause(); },
      resume: () => { if (netGame) netGame.resume(); else pause.close(); },
      menu: () => world.gotoRoom("menu"),        // room_goto(menu)
      graphics: applyGraphics,
      saveGame: () => saveGame(false),
      // [§9.39] lo slot di una room qualsiasi; nella stessa room la partita
      // resta della campagna, se lo era
      loadSlot: (name) => { location.search = "?room=" + name + (name === roomName ? campaignParam() : "") + "&load=slot"; },
      saveFile: () => {
        const fail = (e) => { console.error(e); toast(tr("Saving failed"), "warning"); };
        try { saveFile(capture()).catch(fail); } catch (e) { fail(e); } // §9.134: compresso, asincrono
      },
      fullscreen: () => toggleFullscreen(),
      loadFile: async () => {
        const res = await openFile();
        if (!res) return;
        if (res.invalid || !(await setPending(res.data))) { toast(tr("Not a valid save file"), "warning"); return; }
        location.search = "?room=" + res.data.room + "&load=file";
      },
    },
  });
  pause.netMode = !!net;
  // puntatore liberato (Esc, cambio di finestra) a gioco in corso: pausa
  // (in rete: chiesta all'altro giocatore, §9.156)
  input.onUnlock = () => { if (roomName !== "menu" && !pause.paused) { if (netGame) netGame.requestPause(); else pause.open(); } };
  // "Full screen" e "Load game" del menu principale (menu.js)
  world.hooks.fullscreen = () => toggleFullscreen();
  world.hooks.loadSlot = (name) => { location.search = "?room=" + name + "&load=slot"; };
  world.hooks.loadFile = () => pause.actions.loadFile();
  // [§9.172] i pulsanti della sconfitta (endgame.js): ricomincia e carica,
  // non nella partita in rete
  if (!net) {
    world.hooks.restart = () => pause.actions.restart();
    world.hooks.loadMenu = () => { pause.open(); pause.submenu = "load"; };
  }
  // [§9.156, §9.157] "Multiplayer" nel menu: "Create game" (dalla schermata
  // della schermaglia) e "Join game" (?stun=0 passa alla partita: senza
  // server STUN, per le prove in locale)
  const stun = params.get("stun") !== "0";
  world.hooks.hostGame = (sk) => hostGame({ sk, stun });
  world.hooks.joinGame = (opts) => joinMenu({ ...opts, version: VERSION, stun });
  // salvataggio automatico ogni 5 minuti di gioco (non a partita finita)
  const AUTOSAVE_STEPS = room.speed * 300;
  let autosaveAt = AUTOSAVE_STEPS;
  const autosave = () => {
    if (roomName === "menu" || net || !settings.autosave || --autosaveAt > 0) return;
    autosaveAt = AUTOSAVE_STEPS;
    if (world.exists("victory_manager") || world.exists("gameover_manager")) return;
    saveGame(true);
  };

  // [§9.153, multiplayer, fase 2] i comandi: registro e replay (commands.js)
  const commands = new Commands();
  // [§9.154, fase 2, passo 2] le azioni del giocatore (world.js act): date al
  // passo in corso, eseguite all'inizio del successivo (i tipi: world.actions)
  // ([§9.156] in rete D passi dopo: il ritardo dei comandi, lockstep.js)
  world.hooks.command = (kind, c) => commands.issue(kind, c, netGame ? netGame.cmdStep(world._stepNo) : world._stepNo + 1,
                                                    world.mp ? world.mp.local - 1 : 0);
  // eseguiti nel passo del mondo, dopo Begin Step e allarmi (world.step)
  world.hooks.commands = () => commands.runDue(world);
  const hashNow = () => stateHash({ world, g, manager, path });
  // [§9.168] il clic dei pulsanti dell'interfaccia (audio.js ui): quelli
  // della minimappa alla pressione (scattano li', manager.mouse), i pulsanti
  // della partita (le istanze *_clicker, *_button, i "+" delle mura, col
  // puntatore sopra: hover) al rilascio, come scattano loro. Il menu di pausa
  // e il menu principale lo fanno da se' (pause.js, menu.js)
  const GUI_BUTTON = /_clicker$|_button$|^mplus_/;
  const guiClick = (input) => {
    const mm = g.minim === 1 ? manager.minimViewHover || manager.minimPlusHover || manager.minimMinusHover : manager.minimViewHoverBis;
    if (input.mousePressed[0] && mm && roomName !== "menu") audio.ui("clic");
    else if (input.mouseReleased[0] && world.instances.some((i) => i.alive && i.ui && i.hover === 1 && GUI_BUTTON.test(i.object))) audio.ui("clic");
  };
  const step = () => {
    // [§9.156] in rete il passo si gioca solo col turno dell'altro giocatore
    // (lockstep.js): se non c'e' ancora si aspetta (loop.js), e l'input resta
    // da leggere al passo che si giochera'
    if (netGame && !pause.paused && !netGame.canStep()) return false;
    input.beginStep();
    commands.frame(input, cam); // in replay: l'input e la telecamera del registro
    if (pause.paused) {
      pause.input(input);
      return;
    }
    if (pause.check(input, cam.cssW)) return;
    // [§9.156] la tregua della partita a due, decisa a ogni passo dal tempo
    // della partita (uguale nelle due pagine)
    if (world.mp) world.mp.truce = pvpTruce(g);
    manager.alarms();
    manager.keys(input, cam);
    const [mx, my] = cam.toRoom(input.x, input.y);
    manager.hoverMinimap(input, cam, room.width, room.height); // §9.114: col puntatore di adesso
    guiClick(input);
    manager.mouse(input, mx, my);
    // [§9.109] i clic sulla minimappa non vanno al mondo sotto di lei; il
    // destro e' un ordine verso il punto della mappa (manager.js)
    const mm = manager.minimapInput(input, cam, room.width, room.height);
    if (mm) {
      input.mousePressed = [false, false, false];
      input.mouseReleased = [false, !!mm.order, false];
    }
    manager.step(input, cam, room.width, room.height);
    if (victoryAt > 0 && --victoryAt === 0 && !world.exists("victory_manager")) { g.victory = 1; world.create("victory_manager", 0, 0); }
    world.input = input;
    const inside = input.inside;
    if (mm) input.inside = false; // niente hover ne' clic sulle istanze sotto la minimappa
    world.step(input, mm && mm.order ? mm.order[0] : mx, mm && mm.order ? mm.order[1] : my);
    input.inside = inside;
    // [§9.155] nella partita a due quello che vale per una parte gira per
    // tutte e due, ognuna col suo specchio; l'interfaccia con quello di chi guarda
    const sides = world.mp ? [world.mp.mirror1, world.mp.mirror2] : [world];
    const mine = world.worldFor(null);
    for (const w of sides) recountIdle(w); // §6.1 n.80
    alarmsStep(mine); // §9.108: allarmi d'attacco sulla minimappa
    for (const w of sides) settleOverlaps(w, path); // §9.62
    settleEnemies(world, path); // §9.116
    defendBuildings(world); // §9.116
    for (const w of sides) settleSiege(w); // §9.79
    pvpVisibility(world, sightK); // §9.155: la nebbia di guerra della partita a due
    ambienceStep(world, cam); // §9.84: fumo, polvere, crolli
    for (const w of sides) houseTorches(w); // §9.104: le fiaccole sulle case
    recountSelection(mine); // §6.1 n.81
    world.particles.step(); // aggiornamento automatico dei sistemi [I]
    fog.update(mine);
    autosave();
    if (input.pressed.has(114)) { // F3
      diag.toggle();
      settings.diagnostics = diag.visible;
      saveSettings(settings);
    }
    // [§9.109] sulla minimappa (o trascinandola) lo schermo non scorre: e' a
    // 20 px dai bordi, dentro la fascia che fa scorrere
    const onMinimap = manager.mmDrag || (manager.overMinimap() && !input.edgeHold);
    if (cam.follow && (input.inside || input.edgeHold) && !onMinimap) {
      const [mx, my] = cam.toRoom(input.x, input.y); // mouser Step: x=mouse_x, y=mouse_y
      cam.followPoint(mx, my);
    } else {
      cam.clamp();
    }
    commands.afterStep(world, hashNow); // §9.153: l'impronta nel registro, ogni CHECK_EVERY passi
    if (netGame) netGame.afterStep(); // §9.156: il turno all'altro giocatore, le impronte
  };

  let fpsNow = 0;
  // [§6.8 G1] superficie del mondo, quando la sua scala e' minore di quella
  // del canvas (si ricrea se cambiano misura o contesto)
  let worldTarget = null;
  const worldSurface = () => {
    const W = Math.max(1, Math.round(cam.cssW * worldScale)), H = Math.max(1, Math.round(cam.cssH * worldScale));
    if (worldTarget && worldTarget.gen === r.generation && worldTarget.t.width === W && worldTarget.t.height === H) return worldTarget.t;
    if (worldTarget && worldTarget.gen === r.generation) r.deleteTarget(worldTarget.t);
    worldTarget = { gen: r.generation, t: r.createTarget(W, H) };
    return worldTarget.t;
  };
  const drawWorld = () => {
    ground.draw(cam); // sfondo e suolo cotti in blocchi (§7.16 G4)
    draw.reset();
    // [§9.84] le ombre delle nuvole: sul suolo qui, sulle istanze intere
    // (dal punto in cui toccano terra) in world.draw. Non col rendering
    // software ne' con la qualita' bassa: 3 dischi trasparenti grandi quasi
    // quanto lo schermo, gratis su una GPU, ~4 ms a fotogramma su SwiftShader
    const blobs = r.software || settings.quality === "low" ? [] : cloudBlobs(world, cam);
    // [§9.105] gli alberi che ondeggiano col vento (non con la qualita' bassa)
    world.sway = settings.quality === "low" ? null : (i) => (SWAY_DRAW.has(i.object) ? treeSway(world, i) : null);
    drawCloudShadows(draw, blobs);
    // il Draw End del manager (con nebbia e notte) gira alla sua depth fra
    // quelli delle istanze; il cerchio del puntatore (mouser) dopo tutti
    world.draw(r, draw, cam, () => {
      manager.drawEnd(draw, world.worldFor(null)); // §9.155: lo specchio di chi guarda
      fogLayer.draw();
    }, blobs.length ? (x, y) => shadeAt(blobs, x, y) : null);
    manager.drawMouser(draw, world.worldFor(null));
  };

  // la scena: mondo, poi l'interfaccia (Draw GUI)
  const renderScene = () => {
    draw.glassStyle = settings.glass; // barre della vita in stile vetro (Draw.lifeBar)
    // nebbia e notte composte prima del mondo (§7.13)
    draw.reset();
    fogLayer.prepare(draw, world.worldFor(null), cam); // §9.155: la vista di chi guarda
    r.setProjection(cam.x, cam.y, cam.w, cam.h);
    if (worldScale < canvasScale - 1e-6) {
      const t = worldSurface();
      r.beginTarget(t, cam.x, cam.y, cam.w, cam.h, clear);
      drawWorld();
      r.endTarget();
      r.setProjection(cam.x, cam.y, cam.w, cam.h);
      r.setBlend("replace");
      r.quad(t, cam.x, cam.y, cam.x + cam.w, cam.y, cam.x + cam.w, cam.y + cam.h, cam.x, cam.y + cam.h,
             0, t.height, t.width, 0, 0xffffffff);
      r.setBlend("normal");
    } else {
      if (worldTarget && worldTarget.gen === r.generation) r.deleteTarget(worldTarget.t);
      worldTarget = null;
      drawWorld();
    }
    // [§7.14] vetro: il mondo appena disegnato, ridotto a 1/4 e sfocato
    draw.setGlass(settings.glass ? glassBackdrop() : null);
    draw.glassGrab = glassBackdrop;
    // Draw GUI: coordinate in pixel CSS della finestra
    r.setProjection(0, 0, cam.cssW, cam.cssH);
    draw.reset();
    world.drawGUI(draw);
    draw.reset();
    // ([§9.156] la minimappa mostra i nemici anche durante la tregua)
    if (world.mp) world.mp.noTruce = true;
    manager.drawGUI(draw, cam, world.worldFor(null), fpsNow);
    if (world.mp) world.mp.noTruce = false;
    // [§9.156] la chat della partita online, fra le risorse e la minimappa
    if (netGame) { draw.reset(); netGame.chat.draw(draw, manager.chatArea(cam, world.worldFor(null))); }
    // [§9.158] l'icona della partita non piu' sincronizzata
    if (netGame) { draw.reset(); netGame.drawGUI(draw, cam.cssW, world.worldFor(null).g, world.input); }
    draw.reset();
    world.drawGUIEnd(draw);
    draw.reset();
    // [§9.56] la vittoria: tutto quello che c'e' sotto, sfocato, poi il velo
    // e i testi (endgame.js)
    // [§9.172] e la sconfitta, allo stesso modo (col velo grigio scuro)
    for (const v of [...world.all("victory_manager"), ...world.all("gameover_manager")]) {
      draw.setGlass(null);
      victoryBlur(victoryProgress(v));
      draw.reset();
      world.fire(v, "overlay", draw);
      draw.reset();
    }
    pause.drawButton(draw, cam.cssW);
    draw.setGlass(null);
  };

  // [§7.14] Sfondo dei pannelli di vetro: una copia del mondo appena
  // disegnato (dalla superficie corrente: il canvas, o quella della pausa) a
  // meta' risoluzione, poi a un quarto, sfocata con una gaussiana. Superfici
  // ricreate solo se cambia la misura o il contesto.
  const GLASS_SIGMA = 3; // texel a un quarto di risoluzione
  let glassT = null;
  const glassBackdrop = () => {
    const cur = r.targets && r.targets.length ? r.targets[r.targets.length - 1].t : null;
    const W = cur ? cur.width : canvas.width, H = cur ? cur.height : canvas.height;
    if (!(glassT && glassT.gen === r.generation && glassT.W === W && glassT.H === H)) {
      if (glassT && glassT.gen === r.generation) for (const t of glassT.t) r.deleteTarget(t);
      const hw = Math.max(1, Math.ceil(W / 2)), hh = Math.max(1, Math.ceil(H / 2));
      const qw = Math.max(1, Math.ceil(W / 4)), qh = Math.max(1, Math.ceil(H / 4));
      glassT = { gen: r.generation, W, H, t: [r.createTarget(hw, hh), r.createTarget(qw, qh), r.createTarget(qw, qh), r.createTarget(qw, qh)] };
    }
    const [half, q, tmp, out] = glassT.t;
    const proj = r.proj;
    r.grab(half);
    copy(half, q);
    r.blur(q, tmp, out, GLASS_SIGMA);
    r.setProjection(...proj);
    return out;
  };

  // [§9.56] Sfocatura della vittoria: la superficie corrente (la scena con
  // l'interfaccia) copiata a meta' risoluzione e sfocata come lo sfondo
  // della pausa, con sigma che cresce con `k` (0..1) fino a VICTORY.blur
  // volte PAUSE_SIGMA; ridisegnata sopra, con alpha che sale presto (a meta'
  // risoluzione anche un sigma piccolo ammorbidisce: niente scatto).
  let vicT = null;
  const victoryBlur = (k) => {
    const sigma = PAUSE_SIGMA * Math.max(1, canvasScale) * VICTORY.blur * k;
    if (sigma < 0.05) return;
    const cur = r.targets && r.targets.length ? r.targets[r.targets.length - 1].t : null;
    const W = cur ? cur.width : canvas.width, H = cur ? cur.height : canvas.height;
    const hw = Math.max(1, Math.ceil(W / 2)), hh = Math.max(1, Math.ceil(H / 2));
    if (!(vicT && vicT.gen === r.generation && vicT.hw === hw && vicT.hh === hh)) {
      if (vicT && vicT.gen === r.generation) for (const t of vicT.t) r.deleteTarget(t);
      vicT = { gen: r.generation, hw, hh, t: [r.createTarget(hw, hh), r.createTarget(hw, hh), r.createTarget(hw, hh)] };
    }
    const [half, tmp, out] = vicT.t;
    const proj = r.proj;
    r.grab(half);
    r.blur(half, tmp, out, sigma);
    r.setProjection(...proj);
    r.setBlend("normal");
    r.quad(out, 0, 0, cam.cssW, 0, cam.cssW, cam.cssH, 0, cam.cssH, 0, out.height, out.width, 0, packColor(0xffffff, Math.min(1, k * 6)));
  };

  // Sfondo del menu di pausa, come in NIMBUS: la scena ferma sfumata e
  // scurita. Si disegna una volta in una superficie grande come il canvas,
  // si riduce a meta' e si sfoca con una gaussiana separabile (gl.js, blur);
  // si rifa' solo se cambia qualcosa (apertura, lingua, opzioni, finestra
  // ridimensionata). [§7.12, richiesta dell'autore] prima erano tre
  // dimezzamenti col filtro lineare fino a 1/8 e un ingrandimento: una
  // sfocatura a blocchi. Calcolata una volta sola, puo' costare di piu'.
  const PAUSE_SIGMA = 7; // texel della superficie a meta' risoluzione
  let blur = null;
  const blurTargets = () => {
    const W = canvas.width, H = canvas.height;
    if (blur && blur.gen === r.generation && blur.W === W && blur.H === H) return blur;
    if (blur && blur.gen === r.generation) for (const t of blur.t) r.deleteTarget(t);
    const hw = Math.max(1, Math.ceil(W / 2)), hh = Math.max(1, Math.ceil(H / 2));
    const t = [r.createTarget(W, H), r.createTarget(hw, hh), r.createTarget(hw, hh), r.createTarget(hw, hh)];
    blur = { gen: r.generation, W, H, t };
    return blur;
  };
  const freeBlur = () => {
    if (blur && blur.gen === r.generation) for (const t of blur.t) r.deleteTarget(t);
    blur = null;
  };
  const copy = (src, dst) => {
    r.beginTarget(dst, 0, 0, 1, 1, [0, 0, 0]);
    r.setBlend("normal");
    r.quad(src, 0, 0, 1, 0, 1, 1, 0, 1, 0, src.height, src.width, 0, 0xffffffff);
    r.endTarget();
  };

  // il cursore, ultimo, in pixel CSS (non nello sfondo sfumato della pausa)
  const drawCursor = () => {
    if (!input.inside && !input.locked) return;
    r.setProjection(0, 0, cam.cssW, cam.cssH);
    draw.reset();
    draw.sprite("cursore", 0, Math.round(input.x), Math.round(input.y));
  };

  // [§9.112, richiesta dell'autore] Lo sfondo della pausa arriva in
  // PAUSE_FADE s invece che di colpo: la scena ferma nitida, sopra quella
  // sfocata che compare e il velo scuro che sale (curva morbida); chiudendo
  // la pausa lo stesso all'indietro, sopra la scena che riparte. A tempo
  // vero (il gioco e' fermo).
  const PAUSE_FADE = 0.3, PAUSE_DARK = 0.4;
  let pauseK = 0, pauseT = 0;
  const pauseEase = () => {
    const now = performance.now(), dt = pauseT ? Math.min(0.1, (now - pauseT) / 1000) : 0;
    pauseT = now;
    pauseK = Math.max(0, Math.min(1, pauseK + (pause.paused ? 1 : -1) * dt / PAUSE_FADE));
    return pauseK * pauseK * (3 - 2 * pauseK);
  };
  const pauseVeil = (B, e) => {
    const last = B.t[3];
    r.setProjection(0, 0, cam.cssW, cam.cssH);
    r.setBlend("mix", e); // a trasparenza e, senza l'alpha della superficie (che la nebbia azzera)
    r.quad(last, 0, 0, cam.cssW, 0, cam.cssW, cam.cssH, 0, cam.cssH, 0, last.height, last.width, 0, 0xffffffff);
    r.setBlend("normal");
    draw.reset();
    draw.setColour(0);
    draw.setAlpha(PAUSE_DARK * e);
    draw.rectangle(0, 0, cam.cssW, cam.cssH, false);
    draw.setAlpha(1);
  };

  let shown = false;
  const render = () => {
    // il canvas si mostra col primo fotogramma (index.html: prima e' nascosto)
    if (!shown) { shown = true; requestAnimationFrame(() => { canvas.style.visibility = "visible"; }); }
    r.beginFrame(cam, clear);
    r.gpuBegin(); // §6.8 G0
    const e = pauseEase(); // §9.112
    if (!pause.paused) {
      if (blur && (e <= 0 || blur.fresh !== false)) freeBlur();
      renderScene();
      if (blur) pauseVeil(blur, e); // la pausa che si chiude: lo sfondo sfuma via
      drawCursor();
      r.flush();
      r.gpuEnd();
      return;
    }
    const B = blurTargets();
    if (pause.dirty || B.fresh !== false) {
      r.beginTarget(B.t[0], cam.x, cam.y, cam.w, cam.h, clear);
      renderScene();
      r.endTarget();
      copy(B.t[0], B.t[1]);
      r.blur(B.t[1], B.t[2], B.t[3], PAUSE_SIGMA * Math.max(1, canvasScale));
      pause.dirty = false;
      B.fresh = false;
    }
    r.setProjection(0, 0, cam.cssW, cam.cssH);
    r.setBlend("normal");
    const last = B.t[3];
    // [§9.112] la scena nitida sotto, finche' lo sfocato non la copre tutta
    if (e < 1) {
      r.setBlend("replace"); // l'alpha delle superfici e' azzerato dalla nebbia: niente sfondo che traspare
      r.quad(B.t[0], 0, 0, cam.cssW, 0, cam.cssW, cam.cssH, 0, cam.cssH, 0, B.t[0].height, B.t[0].width, 0, 0xffffffff);
    }
    pauseVeil(B, e);
    draw.setGlass(settings.glass ? last : null); // §7.14: il pannello di vetro sullo sfondo gia' sfocato
    pause.drawPanel(draw, cam.cssW, cam.cssH, input);
    draw.setGlass(null);
    drawCursor();
    r.flush();
    r.gpuEnd();
  };

  let lastRendered = 0, fpsFrames = 0, fpsSince = performance.now();
  const loop = new Loop({
    speed: room.speed, step, render,
    onFrame: (info) => {
      diag.frame(info);
      if (info.rendered) {
        // [§6.1 n.88] fps = frame disegnati nell'ultimo mezzo secondo diviso
        // il tempo trascorso; prima era la media esponenziale di 1000/dt, che
        // con frame irregolari sovrastima (10 e 40 ms alternati: 62 invece
        // di 40)
        fpsFrames++;
        if (info.now - fpsSince >= 500) {
          fpsNow = (1000 * fpsFrames) / (info.now - fpsSince);
          fpsFrames = 0;
          fpsSince = info.now;
        }
        if (lastRendered && rscale.observe(info.now, info.now - lastRendered, 1000 / (loop.fpsCap || 60))) resize();
        lastRendered = info.now;
      }
      // §6.8 G0: le misure GPU girano solo col pannello aperto
      r.timing = diag.visible;
      if (r.timer) r.gpuPoll();
      diag.update(info.now, {
        gpuTimer: !!r.timer, gpuMs: r.gpuMs, worldScale, canvasScale, quality: settings.quality,
        renderer: r.rendererString, software: r.software, fpsCap: loop.fpsCap,
        drawCalls: r.stats.drawCalls, quads: r.stats.quads, drawn: world.drawn,
        textureBytes: r.textureBytes(), textures: r.textures.size,
        canvasW: canvas.width, canvasH: canvas.height, renderScale: rscale.scale,
        view: `${Math.round(cam.x)},${Math.round(cam.y)} ${Math.round(cam.w)}x${Math.round(cam.h)}`,
        room: roomName, maxTextureSize: r.maxTextureSize, units: r.units,
        particles: world.particles.count, systems: world.particles.systems.length,
        net: netGame ? netGame.diagLine() : null, // §9.156
      });
    },
  });
  loop.fpsCap = params.get("fps") === "30" ? 30 : settings.fpsCap;
  applyGraphics();
  if (params.get("fps") === "30") loop.fpsCap = 30;

  // Perdita del contesto WebGL (driver riavviato, troppa memoria, scheda
  // sospesa): ci si ferma, si ricrea tutto e si ricaricano le texture.
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    loop.stop();
    message(t("contextLost"), "warning");
  });
  canvas.addEventListener("webglcontextrestored", async () => {
    r.init();
    await assets.reload(progress);
    message(r.software ? t("softwareWarning") : "", "warning", r.software ? "softwareWarning" : null);
    loop.start();
  });

  // [§9.156] la partita in rete: la sala d'attesa, poi il lockstep (il ciclo
  // gira subito: disegna la propria base dietro la sala d'attesa, i passi
  // aspettano l'avvio)
  if (net) {
    if (world._stepNo !== 0) console.warn("[535 rete] il mondo non parte dal passo 0");
    netGame = startNet({ net, world, g, commands, pause, version: VERSION, hash: hashNow,
                         dump: () => stateDump({ world, g, manager, path }), toMenu: () => { location.search = "?room=menu"; } });
  }
  // ?nostart=1: per i test, il mondo resta fermo finche' non lo si avanza
  if (!params.has("nostart")) loop.start();
  // Per i test automatici (Playwright): stato leggibile dalla pagina.
  window.__pause = pause;
  window.__game = { r, assets, world, path, cam, input, loop, diag, g, manager, fog, pause, capture, settings, eco: ECO, ground, audio, ready: true,
    hash: () => stateHash({ world, g, manager, path }), dump: () => stateDump({ world, g, manager, path }), // §9.152
    // §9.153: registro e replay dei comandi (record(), stop(), replay(log))
    commands, record: () => commands.record({ room: roomName, seed: simSeedValue() }),
                    objectives: () => objectiveMarks(world), // §9.114, per le prove
                    // [§9.97] per le prove: altri fiumi a linee (ricuoce il suolo, rifa' acqua e percorsi)
                    // (se una macchia usa uno sfondo non ancora caricato, lo carica: allora restituisce una promessa)
                    setRivers(list, roads = [], bridges = [], patches = []) {
                      const apply = () => { useRivers(list, roads, bridges, patches); path._river = null; path.initCost(); ground.reset(); };
                      const missing = patches.map((p) => p.bg || "city2").filter((b) => !assets.bg.get(b));
                      if (missing.length) return assets.load([], missing).then(apply);
                      apply();
                    },
                    ambience: { cloudBlobs, shadeAt, leafType }, // §9.84, §9.106
                    // per i test: avanza la simulazione di n passi senza disegnare
                    advance(n) { for (let k = 0; k < n; k++) step(); },
                    // [§9.156] la partita in rete; pump(n): fino a n passi, finche' si puo' (quanti ne ha fatti)
                    net: netGame,
                    pump(n) { const s0 = world._stepNo; for (let k = 0; k < n; k++) if (step() === false) break; return world._stepNo - s0; } };
}

// PWA (sw.js): solo dove i service worker sono permessi (https o localhost)
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
  navigator.serviceWorker.register("./sw.js").catch(() => { /* senza: il gioco va lo stesso, solo non offline */ });
}

main().catch((e) => {
  console.error(e);
  message(String(e && e.message || e), "error");
});
