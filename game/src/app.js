// Avvio del motore e di una room (?room=menu|match|lvl01|lvl02).
//
// Sistemi portati finora (STUDIO.md §3): manager e interfaccia; selezione,
// ordini e movimento; civili, raccolta, costruzione, campi, mura e porte;
// combattimento, edifici nemici e regia dei livelli; nebbia e notte. Gli
// altri oggetti sono disegnati con il loro sprite e non fanno ancora nulla.
// F3 apre la diagnostica.

import { Renderer, bgrToRGB } from "./gl.js";
import { Assets } from "./assets.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Loop } from "./loop.js";
import { RenderScale } from "./renderscale.js";
import { Diagnostics } from "./diag.js";
import { World } from "./world.js";
import { Pathing } from "./pathing.js";
import { cavaliere, infantry, controlGroups, behaviourClicker, corpse, enemyDummy, movementGeneral, ENEMY_LIFE, recountSelection, formation } from "./units.js";
import { producer, unitClicker, cancelClicker, PRODUCERS } from "./production.js";
import { enemyMelee, enemyArcher, atkSignalObject } from "./enemies.js";
import { enemyBuilding, oBox, church, crossEffect, roleAssign } from "./enemybuild.js";
import { enemyManager, enemyManagerLv2, levelStep } from "./levels.js";
import { allyRam, allyCatapult, catapultBullet, debris, bloodSplat, fireBullet, smoke, enemyRam, enemyCatapult } from "./siege.js";
import { allyArrow, enemyArrow, allyArcher, garrisoned, centroArrows, enemyTower, flag } from "./ranged.js";
import { omino, resource, dying, recountIdle } from "./civilians.js";
import { FAM, clicker, placer, fond, built, allyBuild, campoFond, campo, foodBullet, centro, ominoClicker, centroCancel, blink, WOOD_RUINS, woodRuin,
         prizeDrawer, idleClicker, buildButtons } from "./buildings.js";
import { wallFond, wall, gate, mplus, wallExtender, wallPreview, gateClicker } from "./walls.js";
import { CITY_FIRES, cityBuilding, fireStarter, palo, statue } from "./props.js";
import { FogMap } from "./fog.js";
import { GroundCache } from "./ground.js";
import { Particles } from "./particles.js";
import { DECOR_OBJECTS, decorCreate, aquila } from "./effects.js";
import { hint, dialog, HINT_NAMES, DIALOG_NAMES } from "./hints.js";
import { victoryManager, gameoverManager, objectiveButton } from "./endgame.js";
import { loadUnlock } from "./progress.js";
import { FogLayer } from "./fogdraw.js";
import { Draw } from "./draw.js";
import { Manager } from "./manager.js";
import { newGlobals } from "./state.js";
import { loadSettings, saveSettings } from "./settings.js";
import { setLanguage, t, tr } from "./i18n.js";
import { PauseMenu } from "./pause.js";
import { enemyManagerMenu, fogController, fog01 } from "./menu.js";
import { captureGame, restoreGame } from "./snapshot.js";
import { saveSlot, loadSlot, takePending, setPending, saveFile, openFile } from "./save.js";
import { toggleFullscreen } from "./fullscreen.js";
import { loadDomFont, setDomText } from "./domtext.js";

const ROOMS = ["menu", "match", "lvl01", "lvl02", "lvl03"]; // lvl03: scenario da Tiled (§9.10)
// Gruppi d'atlas per room (tools/05_atlas.py, tier).
const TIERS = { menu: ["core", "menu", "gioco"], match: ["core", "gioco"],
                lvl01: ["core", "gioco", "citta"], lvl02: ["core", "gioco", "citta"], lvl03: ["core", "gioco"] };

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const settings = loadSettings();
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

  const roomName = ROOMS.includes(params.get("room")) ? params.get("room") : "menu";
  const room = await (await fetch(`assets/rooms/${roomName}.json`)).json();
  setDomText($("loading-text"), t("loading"), { font: "GUI_1", colour: "#e8e2d0" });
  await assets.load(assets.groupsOfTier(...TIERS[roomName]),
                    room.backgrounds.map((b) => b.name), progress);

  const [objects, masks] = await Promise.all(
    ["objects.json", "masks.json"].map(async (f) => (await fetch("assets/" + f)).json()));
  // Il cursore del gioco (mouser Create: action_set_cursor(cursore) [C]),
  // come lo fa il runner: la freccia del sistema nascosta e lo sprite
  // disegnato dal gioco sopra a tutto (drawCursor). [§6.1 n.83] Prima era
  // un cursore CSS da 53x54 px, che Chrome rifiuta vicino ai bordi della
  // finestra (sopra i 32 px) mostrando la freccia.
  canvas.style.cursor = "none";
  const cam = new Camera(room.width, room.height, room.views[0]);
  const input = new Input(canvas);
  input.wantLock = settings.lockMouse && roomName !== "menu";
  const rscale = new RenderScale();
  rscale.enabled = settings.dynamicResolution;
  const diag = new Diagnostics($("diag"));
  diag.toggle(settings.diagnostics || params.has("diag"));
  const clear = bgrToRGB(room.colour);
  const g = newGlobals(roomName);
  const manager = new Manager(roomName, g);
  const draw = new Draw(r, assets);
  draw.setFont("GUI_1");

  const world = new World({ objects, masks: masks.sprites, assets, g, roomW: room.width, roomH: room.height });
  world.room = roomName;
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
    location.search = "?room=" + name + (g.campagna === 1 ? "&campaign=1" : "");
  };
  const path = new Pathing(world, room.width, room.height);
  world.path = path;
  // [§9.10] oggetti nuovi disegnati a fette (tools/nuovi.py): l'oggetto
  // tiene la maschera intera e non si disegna; nel Create nasce una
  // "__fetta" per ogni striscia verticale dello sprite, ferma, con la depth
  // del bordo anteriore della maschera in quella colonna
  for (const [name, o] of Object.entries(objects)) {
    if (!o.slices) continue;
    world.register(name, {
      create(i, w) {
        for (const [sprite, front] of o.slices) {
          w.create("__fetta", i.x, i.y, { sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle,
                                          init: (f) => { f.sprite_index = sprite; f.depth = -(i.y + front * i.image_yscale); } });
        }
      },
      draw() { /* lo disegnano le fette */ },
    });
  }
  world.register("ally_cavaliere", cavaliere(path));
  world.register("ally_omino", { ...omino(path), ...controlGroups(true) });
  world.register("ally_warrior", infantry("ally_warrior", path));
  world.register("ally_picchiere", infantry("ally_picchiere", path));
  world.register("ally_militare", controlGroups(false));
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
  for (const n of ["enemy_house", "enemy_stalla", "enemy_caserma"]) world.register(n, enemyBuilding(n, path));
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
  }
  for (const s of ["os", "od", "va", "vb"]) {
    world.register("mplus_" + s, mplus("mplus_" + s));
    world.register("muraplacer_" + s, wallExtender("muraplacer_" + s));
  }
  for (const n of ["oodl", "oosl", "ovbl", "oval"]) world.register(n, wallPreview(n));
  world.register("gate_clicker", gateClicker());
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
  for (const n of ["o_statua1", "o_statua2", "o_statua3", "o_statua4", "o_statua1_real"]) world.register(n, statue());
  for (const n of HINT_NAMES) world.register(n, hint(n));
  for (const n of DIALOG_NAMES) world.register(n, dialog(n));
  world.register("victory_manager", victoryManager());
  world.register("gameover_manager", gameoverManager());
  world.register("objective_button", objectiveButton());
  for (const n of DECOR_OBJECTS) world.register(n, { create: decorCreate });
  world.register("aquila_01", aquila());
  world.register("enemy_manager_menu", enemyManagerMenu());
  world.register("fog_controller", fogController());
  world.register("fog01", fog01());
  for (const n of Object.keys(ENEMY_LIFE)) if (!world.behaviours[n]) world.register(n, enemyDummy(n));
  world.hooks.globalRightReleased = (mx, my) => {
    // manager Mouse_GlobalRightReleased: if room!=menu scr_movement_general()
    if (roomName !== "menu") movementGeneral(world, path, mx, my);
  };
  world.hooks.afterRightReleased = (mx, my) => {
    if (roomName !== "menu") formation(world, path, mx, my); // §6.1 n.89
  };
  // manager Create (la parte della griglia dei costi) gira dopo che tutte le
  // istanze della room esistono e prima dei loro Create (world.loadRoom).
  // [Correzioni decise dall'autore, §3.19] n.63: i tre hint_legna piazzati
  // in lvl02 finivano fuori schermo e bloccavano i suggerimenti del
  // livello; n.71: nel menu hint_iniziale era nascosto ma cliccabile.
  const DROPPED = { lvl02: ["hint_legna"], menu: ["hint_iniziale"] };
  const instances = room.instances.filter(([obj]) => !(DROPPED[roomName] || []).includes(obj));
  const fog = new FogMap(room.width, room.height);
  world.fog = fog;
  // Partita salvata (save.js, snapshot.js): ?load=slot (localStorage) o
  // ?load=file (il file scelto, passato da setPending). Il parametro si
  // toglie subito: "Ricomincia livello" riparte dalla room.
  const loadMode = params.get("load");
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
    // manager Create, in fondo: instance_create(0,0,idle_clicker) [C]
    world.create("idle_clicker", 0, 0);
    // manager Create, "Livelli" [C]: nel livello 1 mette i militari in
    // difesa (comp=50), ma prima del Create delle unita' che rimette 700:
    // nell'originale partono in attacco. [§3.13 n.51] qui li si metteva in
    // difesa dopo; [§7.4, decisione dell'autore] si torna all'originale:
    // i militari di partenza del livello 1 sono in attacco (comp 700).
    // i gestori del menu e dei nemici di match e lvl02
    if (roomName === "menu") world.create("enemy_manager_menu", 0, 0);
    if (roomName === "match") { world.create("enemy_manager", 0, 0); world.create("objective_button", 0, 0); }
    if (roomName === "lvl02") world.create("enemy_manager_lv2", 0, 0);
  }
  // manager Step: pulsanti di costruzione, poi la regia dei livelli
  world.hooks.step = () => { buildButtons(world); levelStep(world); };
  // nebbia: scoperta (stato, aggiornata a ogni passo) e disegno (fog.js)
  fog.update(world);
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

  // Un passo, nell'ordine di GameMaker (STUDIO.md §1.3): alarm, tastiera,
  // mouse, Step, poi la view segue il puntatore.
  // Menu di pausa (pause.js): il mondo si ferma (instance_deactivate_all
  // dell'originale), passano solo i clic sul pannello.
  const applyGraphics = () => {
    for (const k of ["rain", "grass", "fire"]) {
      if (settings[k]) world.particles.hidden.delete(k); else world.particles.hidden.add(k);
    }
    // [§7.15 G5] erba e spighe piu' rade con la qualita' piu' bassa (2500-4000
    // fili disegnati a ogni fotogramma, fino al 45% del disegno nel menu)
    world.particles.density.grass = GRASS_DENSITY[settings.quality] ?? 1;
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
      menu: () => world.gotoRoom("menu"),        // room_goto(menu)
      graphics: applyGraphics,
      saveGame: () => saveGame(false),
      loadGame: () => { location.search = "?room=" + roomName + campaignParam() + "&load=slot"; },
      saveFile: () => {
        try { saveFile(capture()); } catch (e) { console.error(e); toast(tr("Saving failed"), "warning"); }
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
  // puntatore liberato (Esc, cambio di finestra) a gioco in corso: pausa
  input.onUnlock = () => { if (roomName !== "menu" && !pause.paused) pause.open(); };
  // "Full screen" e "Load game" del menu principale (menu.js)
  world.hooks.fullscreen = () => toggleFullscreen();
  world.hooks.loadSlot = (name) => { location.search = "?room=" + name + "&load=slot"; };
  world.hooks.loadFile = () => pause.actions.loadFile();
  // salvataggio automatico ogni 5 minuti di gioco (non a partita finita)
  const AUTOSAVE_STEPS = room.speed * 300;
  let autosaveAt = AUTOSAVE_STEPS;
  const autosave = () => {
    if (roomName === "menu" || !settings.autosave || --autosaveAt > 0) return;
    autosaveAt = AUTOSAVE_STEPS;
    if (world.exists("victory_manager") || world.exists("gameover_manager")) return;
    saveGame(true);
  };

  const step = () => {
    input.beginStep();
    if (pause.paused) {
      pause.input(input);
      return;
    }
    if (pause.check(input, cam.cssW)) return;
    manager.alarms();
    manager.keys(input, cam);
    const [mx, my] = cam.toRoom(input.x, input.y);
    manager.mouse(input, mx, my);
    manager.step(input, cam, room.width, room.height);
    world.input = input;
    world.step(input, mx, my);
    recountIdle(world); // §6.1 n.80
    recountSelection(world); // §6.1 n.81
    world.particles.step(); // aggiornamento automatico dei sistemi [I]
    fog.update(world);
    autosave();
    if (input.pressed.has(114)) { // F3
      diag.toggle();
      settings.diagnostics = diag.visible;
      saveSettings(settings);
    }
    if (cam.follow && (input.inside || input.edgeHold)) {
      const [mx, my] = cam.toRoom(input.x, input.y); // mouser Step: x=mouse_x, y=mouse_y
      cam.followPoint(mx, my);
    } else {
      cam.clamp();
    }
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
    // il Draw End del manager (con nebbia e notte) gira alla sua depth fra
    // quelli delle istanze; il cerchio del puntatore (mouser) dopo tutti
    world.draw(r, draw, cam, () => {
      manager.drawEnd(draw, world);
      fogLayer.draw();
    });
    manager.drawMouser(draw, world);
  };

  // la scena: mondo, poi l'interfaccia (Draw GUI)
  const renderScene = () => {
    draw.glassStyle = settings.glass; // barre della vita in stile vetro (Draw.lifeBar)
    // nebbia e notte composte prima del mondo (§7.13)
    draw.reset();
    fogLayer.prepare(draw, world, cam);
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
    manager.drawGUI(draw, cam, world, fpsNow);
    draw.reset();
    world.drawGUIEnd(draw);
    draw.reset();
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

  let shown = false;
  const render = () => {
    // il canvas si mostra col primo fotogramma (index.html: prima e' nascosto)
    if (!shown) { shown = true; requestAnimationFrame(() => { canvas.style.visibility = "visible"; }); }
    r.beginFrame(cam, clear);
    r.gpuBegin(); // §6.8 G0
    if (!pause.paused) {
      if (blur) freeBlur();
      renderScene();
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
    r.quad(last, 0, 0, cam.cssW, 0, cam.cssW, cam.cssH, 0, cam.cssH, 0, last.height, last.width, 0, 0xffffffff);
    draw.reset();
    draw.setColour(0);
    draw.setAlpha(0.4);
    draw.rectangle(0, 0, cam.cssW, cam.cssH, false);
    draw.setAlpha(1);
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

  // ?nostart=1: per i test, il mondo resta fermo finche' non lo si avanza
  if (!params.has("nostart")) loop.start();
  // Per i test automatici (Playwright): stato leggibile dalla pagina.
  window.__pause = pause;
  window.__game = { r, assets, world, path, cam, loop, diag, g, manager, fog, pause, capture, settings, ready: true,
                    // per i test: avanza la simulazione di n passi senza disegnare
                    advance(n) { for (let k = 0; k < n; k++) step(); } };
}

// PWA (sw.js): solo dove i service worker sono permessi (https o localhost)
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
  navigator.serviceWorker.register("./sw.js").catch(() => { /* senza: il gioco va lo stesso, solo non offline */ });
}

main().catch((e) => {
  console.error(e);
  message(String(e && e.message || e), "error");
});
