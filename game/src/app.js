// Avvio del motore e di una room (?room=menu|match|lvl01|lvl02).
//
// Sistemi portati finora (STUDIO.md §3): manager e interfaccia; selezione,
// ordini e movimento del cavaliere; civili, raccolta, costruzione e il
// centro. Gli altri oggetti sono disegnati con il loro sprite e non fanno
// ancora nulla. F3 apre la diagnostica.

import { Renderer, bgrToRGB } from "./gl.js";
import { Assets } from "./assets.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Loop } from "./loop.js";
import { RenderScale } from "./renderscale.js";
import { Diagnostics } from "./diag.js";
import { World } from "./world.js";
import { Pathing } from "./pathing.js";
import { cavaliere, corpse, enemyDummy, movementGeneral, ENEMY_LIFE } from "./units.js";
import { omino, resource, dying } from "./civilians.js";
import { FAM, clicker, placer, fond, built, centro, ominoClicker, centroCancel, blink, prizeDrawer, idleClicker,
         buildButtons } from "./buildings.js";
import { Draw } from "./draw.js";
import { Manager } from "./manager.js";
import { newGlobals } from "./state.js";
import { loadSettings, saveSettings } from "./settings.js";
import { setLanguage, t } from "./i18n.js";

const ROOMS = ["menu", "match", "lvl01", "lvl02"];
// Gruppi d'atlas per room (tools/05_atlas.py, tier).
const TIERS = { menu: ["core", "menu", "gioco"], match: ["core", "gioco"],
                lvl01: ["core", "gioco", "citta"], lvl02: ["core", "gioco", "citta"] };

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const settings = loadSettings();
setLanguage(settings.language);

function message(text, kind = "info") {
  const el = $("message");
  el.textContent = text;
  el.className = kind;
  el.hidden = !text;
}

function progress(done, total) {
  const el = $("loading");
  el.hidden = done >= total;
  $("loading-bar").style.width = `${total ? (100 * done) / total : 0}%`;
}

async function main() {
  const canvas = $("game");
  const r = new Renderer(canvas);
  try {
    r.init();
  } catch (e) {
    message(t("noWebgl2"), "error");
    return;
  }
  if (r.software) message(t("softwareWarning"), "warning");

  const assets = new Assets(r);
  try {
    await assets.init();
  } catch (e) {
    message(t("textureTooBig") + " (" + e.message + ")", "error");
    return;
  }

  const roomName = ROOMS.includes(params.get("room")) ? params.get("room") : "menu";
  const room = await (await fetch(`assets/rooms/${roomName}.json`)).json();
  $("loading-text").textContent = t("loading");
  await assets.load(assets.groupsOfTier(...TIERS[roomName]),
                    room.backgrounds.map((b) => b.name), progress);

  const [objects, masks, cursor] = await Promise.all(
    ["objects.json", "masks.json", "cursor.json"].map(async (f) => (await fetch("assets/" + f)).json()));
  // il cursore del gioco (mouser Create: action_set_cursor(cursore) [C])
  canvas.style.cursor = `url(assets/${cursor.file}) ${cursor.origin[0]} ${cursor.origin[1]}, auto`;
  const cam = new Camera(room.width, room.height, room.views[0]);
  const input = new Input(canvas);
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
  const path = new Pathing(world, room.width, room.height);
  world.path = path;
  world.register("ally_cavaliere", cavaliere(path));
  world.register("ally_omino", omino(path));
  for (const n of ["albero", "albero_fake", "miniera_oro", "pietra_grande", "pietr_piccolo"]) world.register(n, resource(path, n));
  for (const n of ["albero_morente", "miniera_morente", "pietra_grande_morente", "pietr_piccolo_morente"]) world.register(n, dying());
  world.register("centro", centro(path));
  for (const f of Object.keys(FAM)) {
    world.register(f + "_clicker", clicker(f));
    world.register(f + "_placer", placer(f));
    world.register(f + "_fond", fond(f, path));
    world.register(f, built(f, path));
  }
  world.register("omino_clicker", ominoClicker());
  world.register("centro_indietro_clicker", centroCancel());
  for (const n of ["wood_blink", "stone_blink", "food_blink", "gold_blink", "pop_blink"]) world.register(n, blink(n));
  world.register("legno_prizedrawer", prizeDrawer("ico_wood_prize"));
  world.register("oro_prizedrawer", prizeDrawer("ico_gold_prize"));
  world.register("cibo_prizedrawer", prizeDrawer("ico_food_prize"));
  world.register("idle_clicker", idleClicker());
  for (const n of Object.keys(objects).filter((k) => k.endsWith("_corpse"))) world.register(n, corpse(n));
  for (const n of Object.keys(ENEMY_LIFE)) world.register(n, enemyDummy(n));
  world.hooks.globalRightReleased = (mx, my) => {
    // manager Mouse_GlobalRightReleased: if room!=menu scr_movement_general()
    if (roomName !== "menu") movementGeneral(world, path, mx, my);
  };
  // manager Create (la parte della griglia dei costi) gira dopo che tutte le
  // istanze della room esistono e prima dei loro Create (world.loadRoom).
  world.loadRoom(room.instances, () => path.initCost());
  // manager Create, in fondo: instance_create(0,0,idle_clicker) [C]
  world.create("idle_clicker", 0, 0);
  world.hooks.step = () => buildButtons(world);

  // Dimensioni: la view segue la finestra in pixel CSS (come l'originale),
  // il canvas ha pixel reali = CSS x densita' dello schermo x scala dinamica.
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const k = Math.min(devicePixelRatio || 1, 2) * rscale.scale;
    canvas.width = Math.max(1, Math.round(w * k));
    canvas.height = Math.max(1, Math.round(h * k));
    cam.resize(w, h);
  };
  window.addEventListener("resize", resize);
  resize();

  // Un passo, nell'ordine di GameMaker (STUDIO.md §1.3): alarm, tastiera,
  // mouse, Step, poi la view segue il puntatore.
  const step = () => {
    input.beginStep();
    manager.alarms();
    manager.keys(input, cam);
    const [mx, my] = cam.toRoom(input.x, input.y);
    manager.mouse(input, mx, my);
    manager.step(input, cam, room.width, room.height);
    world.input = input;
    world.step(input, mx, my);
    if (input.pressed.has(114)) { // F3
      diag.toggle();
      settings.diagnostics = diag.visible;
      saveSettings(settings);
    }
    if (cam.follow && input.inside) {
      const [mx, my] = cam.toRoom(input.x, input.y); // mouser Step: x=mouse_x, y=mouse_y
      cam.followPoint(mx, my);
    } else {
      cam.clamp();
    }
  };

  let fpsNow = 0;
  const render = () => {
    r.beginFrame(cam, clear);
    drawBackgrounds(r, assets, room, cam);
    draw.reset();
    world.draw(r, draw, cam);
    manager.drawWorldEnd(draw, world);
    // Draw GUI: coordinate in pixel CSS della finestra
    r.setProjection(0, 0, cam.cssW, cam.cssH);
    draw.reset();
    world.drawGUI(draw);
    draw.reset();
    manager.drawGUI(draw, cam, world, fpsNow);
    draw.reset();
    world.drawGUIEnd(draw);
    r.flush();
  };

  let lastRendered = 0;
  const loop = new Loop({
    speed: room.speed, step, render,
    onFrame: (info) => {
      diag.frame(info);
      if (info.rendered) {
        if (lastRendered) fpsNow = fpsNow * 0.9 + (1000 / Math.max(1, info.now - lastRendered)) * 0.1;
        if (lastRendered && rscale.observe(info.now, info.now - lastRendered, 1000 / loop.fpsCap)) resize();
        lastRendered = info.now;
      }
      diag.update(info.now, {
        renderer: r.rendererString, software: r.software, fpsCap: loop.fpsCap,
        drawCalls: r.stats.drawCalls, quads: r.stats.quads, drawn: world.drawn,
        textureBytes: r.textureBytes(), textures: r.textures.size,
        canvasW: canvas.width, canvasH: canvas.height, renderScale: rscale.scale,
        view: `${Math.round(cam.x)},${Math.round(cam.y)} ${Math.round(cam.w)}x${Math.round(cam.h)}`,
        room: roomName, maxTextureSize: r.maxTextureSize, units: r.units,
      });
    },
  });
  loop.fpsCap = params.get("fps") === "30" ? 30 : settings.fpsCap;

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
    message(r.software ? t("softwareWarning") : "", "warning");
    loop.start();
  });

  loop.start();
  // Per i test automatici (Playwright): stato leggibile dalla pagina.
  window.__game = { r, assets, world, path, cam, loop, diag, g, manager, ready: true,
                    // per i test: avanza la simulazione di n passi senza disegnare
                    advance(n) { for (let k = 0; k < n; k++) step(); } };
}

// Sfondi della room ripetuti (green1, city2: 281x250 [C]), sotto a tutto.
function drawBackgrounds(r, assets, room, cam) {
  for (const b of room.backgrounds) {
    const t = assets.bg.get(b.name);
    if (!t) continue;
    const x0 = b.htiled ? cam.x : b.x, y0 = b.vtiled ? cam.y : b.y;
    const x1 = b.htiled ? cam.x + cam.w : b.x + t.width, y1 = b.vtiled ? cam.y + cam.h : b.y + t.height;
    r.quad(t, x0, y0, x1, y0, x1, y1, x0, y1, x0 - b.x, y0 - b.y, x1 - b.x, y1 - b.y, 0xffffffff);
  }
}

main().catch((e) => {
  console.error(e);
  message(String(e && e.message || e), "error");
});
