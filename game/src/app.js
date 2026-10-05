// Avvio del motore e anteprima di una room (?room=menu|match|lvl01|lvl02).
//
// Per ora nessun sistema di gioco: si carica una room, la si disegna con i
// suoi sprite iniziali e ci si muove come nell'originale (puntatore ai
// bordi, frecce, X/Z per lo zoom). F3 apre la diagnostica.

import { Renderer, bgrToRGB } from "./gl.js";
import { Assets } from "./assets.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Loop } from "./loop.js";
import { RenderScale } from "./renderscale.js";
import { Diagnostics } from "./diag.js";
import { Scene } from "./scene.js";
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

  const scene = new Scene(room, assets);
  const cam = new Camera(room.width, room.height, room.views[0]);
  const input = new Input(canvas);
  const rscale = new RenderScale();
  rscale.enabled = settings.dynamicResolution;
  const diag = new Diagnostics($("diag"));
  diag.toggle(settings.diagnostics || params.has("diag"));
  const clear = bgrToRGB(room.colour);

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

  const step = () => {
    input.beginStep();
    // manager Keyboard_Left/Right/Up/Down [C]: 10 px a passo, 30 con Ctrl
    // (global.sele=1 mentre Ctrl e' premuto, manager KeyPress/KeyRelease_Control).
    const k = input.down.has(17) ? 30 : 10;
    if (input.down.has(37)) cam.x -= k;
    if (input.down.has(39)) cam.x += k;
    if (input.down.has(38)) cam.y -= k;
    if (input.down.has(40)) cam.y += k;
    // manager KeyPress_X / KeyPress_Z [C]: zoom indietro / avanti di 0,1.
    if (input.pressed.has(88) && !input.down.has(17)) cam.setScale(cam.scaleview + 0.1);
    if (input.pressed.has(90) && !input.down.has(17)) cam.setScale(cam.scaleview - 0.1);
    if (input.pressed.has(114)) { // F3
      diag.toggle();
      settings.diagnostics = diag.visible;
      saveSettings(settings);
    }
    scene.step();
    if (cam.follow && input.inside) {
      const [mx, my] = cam.toRoom(input.x, input.y); // mouser Step: x=mouse_x, y=mouse_y
      cam.followPoint(mx, my);
    } else {
      cam.clamp();
    }
  };

  const render = () => {
    r.beginFrame(cam, clear);
    scene.draw(r, cam);
    r.flush();
  };

  let lastRendered = 0;
  const loop = new Loop({
    speed: room.speed, step, render,
    onFrame: (info) => {
      diag.frame(info);
      if (info.rendered) {
        if (lastRendered && rscale.observe(info.now, info.now - lastRendered, 1000 / loop.fpsCap)) resize();
        lastRendered = info.now;
      }
      diag.update(info.now, {
        renderer: r.rendererString, software: r.software, fpsCap: loop.fpsCap,
        drawCalls: r.stats.drawCalls, quads: r.stats.quads, drawn: scene.drawn,
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
  window.__game = { r, assets, scene, cam, loop, diag, ready: true };
}

main().catch((e) => {
  console.error(e);
  message(String(e && e.message || e), "error");
});
