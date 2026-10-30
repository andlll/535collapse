// [§9.84, richiesta dell'autore] Effetti d'ambiente, solo estetici (il gioco
// non li legge mai, non si salvano):
// - ombre delle nuvole: sagome disegnate dall'autore (§9.86, nn1-nn6: nere,
//   a bordi netti, gia' schiacciate come il suolo; la pipeline le sfuma e le
//   dimezza), grandi come nel disegno (§9.89), che il vento porta
//   attraverso la mappa. Sul suolo si disegnano subito dopo di lui; edifici, alberi e
//   unita' si scuriscono tutti interi (Renderer.shade) di quanto e' in
//   ombra il punto in cui toccano terra: una torre non si "dipinge per
//   terra", entra nell'ombra quando ci entra la sua base (la mappa
//   dell'alpha di ogni sagoma e' nel manifest dell'atlas). Spariscono di
//   notte. Con la pioggia (segnalazione dell'autore: non una nuvoletta che
//   passa mentre piove) il cielo e' coperto: le ombre si dissolvono e tutta
//   la scena si scurisce di un grigio freddo uniforme (overcast, fog.js
//   skyColour), in qualche secondo, e tornano quando smette;
// - fumo dai camini degli edifici che ne hanno uno: case del giocatore
//   (stili 1, 2, 4 e 6), case nemiche blu (stili 2 e 6), centro citta' del
//   giocatore e nemico (§9.93): uno sbuffo ogni tanto;
// - polvere e detriti quando un edificio crolla in rovina;
// - polvere sotto cavalieri e macchine d'assedio in movimento.
// Fumo e polvere sono particelle della categoria "fire" (opzione "Fiamme e
// scintille"); tutto solo sullo schermo e nella parte vista della nebbia.

import { partType } from "./particles.js";

const BLACK = 0, DUST = 0x6e8ca8; // sabbia (BGR di 168, 140, 110)

// ------------------------------------------------------------- nuvole

// [§9.86] Le sagome e quanto si ingrandiscono: a meta' risoluzione sono
// larghe ~200-280 px (sfumatura compresa). [§9.89, segnalazione
// dell'autore] ingrandite 5,5-8,5 volte (1400-2700 px di room, piu' dello
// schermo) erano macchie scure senza forma: ora circa come nel disegno
// (scala 2 della meta' risoluzione: il disegno e' largo 370-550 px), piu'
// fitte, un po' piu' scure
const CLOUD_SPRITES = ["nn1", "nn2", "nn3", "nn4", "nn5", "nn6"];
const CLOUD_SCALE = [1.7, 2.3];  // scala (uguale in x e y), poi:
const CLOUD_STRETCH = 0.2;       // x allungata o accorciata fino al 20%
const CLOUD_TILT = 8;            // ruotata fino a 8 gradi; specchiata a caso
const CLOUD_CELL = [1100, 800];  // una nuvola ogni tanti px di room
const ALPHA = 0.4;              // il nero pieno della sagoma
// [§9.90, richiesta dell'autore] Il vento della partita, g.wind (0-1, a
// caso, state.js; si salva con le globali; i salvataggi di prima: 0,5).
// Le nuvole vanno da 0,8 a 1,5 px a passo (erano 0,32: troppo lente),
// verso ovest e un po' a sud, come cade la pioggia (effects.js rainStart,
// piu' inclinata col vento); erba, fiori e spighe ondeggiano di piu', piu'
// in fretta e un po' piegati (particles.js, Particles.wind).
export const WIND_SPEED = [0.8, 1.5];
const WIND_DIR = [-0.977, 0.215];
export const windLevel = (g) => Math.max(0, Math.min(1, g.wind ?? 0.5));
export const windSpeed = (g) => WIND_SPEED[0] + (WIND_SPEED[1] - WIND_SPEED[0]) * windLevel(g);

// [§9.84] Il cielo coperto (0-1, w.overcast): segue la pioggia, ogni passo
// di OVERCAST_EASE della distanza (il 99% in ~5 s). [§9.92] Si salva
// (snapshot.js): decide quando le gocce cominciano, e le gocce quando la
// pioggia spegne i fuochi; i salvataggi di prima ripartono dal valore giusto.
// [§9.91] Resta coperto finche' nascono gocce (`rain`, il sistema della
// pioggia: rain.level, effects.js rainStep): smesso di piovere, si
// rasserena solo quando le gocce sono calate fino a 0. Lo chiama
// manager.step, prima di rainStep.
const OVERCAST_EASE = 0.016;
export function overcastStep(w, rain = null) {
  const target = w.g.raining === 1 || (rain && rain.level > 0) ? 1 : 0;
  if (w.overcast === undefined) { w.overcast = target; return; }
  w.overcast += (target - w.overcast) * OVERCAST_EASE;
  if (Math.abs(target - w.overcast) < 0.002) w.overcast = target;
}

// numeri pseudo-casuali fissi per (stanza, indice): le nuvole sono sempre
// le stesse e dipendono solo dal tempo, niente da salvare
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}
const roomSeed = (room) => { let h = 7; for (const ch of String(room)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

// Le nuvole della stanza: una sagoma per cella di una griglia larga (con un
// margine oltre la stanza, da cui rientrano col vento)
const CLOUDS = new Map();
function cloudsOf(w) {
  let c = CLOUDS.get(w);
  if (c && c.room === w.room) return c;
  const seed = roomSeed(w.room), list = [];
  const M = 1500, W = w.roomW + 2 * M, H = w.roomH + 2 * M;
  const nx = Math.max(1, Math.round(W / CLOUD_CELL[0])), ny = Math.max(1, Math.round(H / CLOUD_CELL[1]));
  let k = 0;
  for (let gy = 0; gy < ny; gy++) {
    for (let gx = 0; gx < nx; gx++) {
      const r = (j) => hash(seed + 7919 * (k * 16 + j));
      const s = CLOUD_SCALE[0] + r(3) * (CLOUD_SCALE[1] - CLOUD_SCALE[0]);
      const st = 1 + (r(4) * 2 - 1) * CLOUD_STRETCH;
      list.push({
        cx: (gx + r(0)) * (W / nx), cy: (gy + r(1)) * (H / ny),
        spr: CLOUD_SPRITES[Math.floor(r(2) * CLOUD_SPRITES.length)],
        sx: s * st * (r(5) < 0.5 ? -1 : 1), sy: s, rot: (r(6) * 2 - 1) * CLOUD_TILT,
      });
      k++;
    }
  }
  c = { room: w.room, list, W, H, M };
  CLOUDS.set(w, c);
  return c;
}

// La mappa dell'alpha di una sagoma (manifest dell'atlas, tools/05_atlas.py)
const GRIDS = new Map();
function gridOf(assets, spr) {
  let g = GRIDS.get(spr);
  if (g === undefined) {
    const s = assets && assets.sprites[spr];
    g = null;
    if (s && s.alpha) {
      const bin = atob(s.alpha.data), data = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
      g = { w: s.alpha.w, h: s.alpha.h, data, W: s.width, H: s.height, ox: s.origin[0], oy: s.origin[1] };
    }
    GRIDS.set(spr, g);
  }
  return g;
}

// Le nuvole vicine alla view, in coordinate di room:
// {spr, x, y, sx, sy, rot, a, c, s (coseno e seno della rotazione), g (mappa)}
export function cloudBlobs(w, cam) {
  const g = w.g;
  if (w.room === "menu") return [];
  const day = Math.max(0, 1 - 2 * Math.max(0, g.night || 0)); // a meta' tramonto sono gia' sparite
  const a = ALPHA * day * (1 - (w.overcast || 0)); // con la pioggia il cielo e' coperto: niente ombre nette
  if (a <= 0.003) return [];
  const C = cloudsOf(w), t = w._stepNo, v = windSpeed(g);
  const out = [];
  for (const cl of C.list) {
    const G = gridOf(w.assets, cl.spr);
    if (!G) continue;
    const x = ((cl.cx + WIND_DIR[0] * v * t) % C.W + C.W) % C.W - C.M;
    const y = ((cl.cy + WIND_DIR[1] * v * t) % C.H + C.H) % C.H - C.M;
    const rad = Math.hypot(G.W, G.H) / 2 * Math.max(Math.abs(cl.sx), cl.sy);
    if (x + rad < cam.x || x - rad > cam.x + cam.w || y + rad < cam.y || y - rad > cam.y + cam.h + 300) continue;
    const ang = -cl.rot * Math.PI / 180; // come drawSprite
    out.push({ spr: cl.spr, x, y, sx: cl.sx, sy: cl.sy, rot: cl.rot, a, c: Math.cos(ang), s: Math.sin(ang), g: G });
  }
  return out;
}

// Sul suolo: subito dopo di lui, prima di tutte le istanze
export function drawCloudShadows(d, blobs) {
  for (const b of blobs) d.spriteExt(b.spr, 0, b.x, b.y, b.sx, b.sy, b.rot, BLACK, b.a);
}

// Quanto resta di luce nel punto (x, y) (1 = niente ombra): lo stesso conto
// della miscela delle sagome nere sul suolo, (1 - a alpha) per ognuna, con
// l'alpha letta (bilineare) nella mappa della sagoma
export function shadeAt(blobs, x, y) {
  let k = 1;
  for (const b of blobs) {
    const dx = x - b.x, dy = y - b.y, G = b.g;
    // dal punto della room al pixel della sagoma (drawSprite al contrario)
    const px = (dx * b.c + dy * b.s) / b.sx + G.ox, py = (-dx * b.s + dy * b.c) / b.sy + G.oy;
    const gx = px / G.W * G.w - 0.5, gy = py / G.H * G.h - 0.5;
    if (gx <= -1 || gy <= -1 || gx >= G.w || gy >= G.h) continue;
    const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    const at = (i, j) => (i < 0 || j < 0 || i >= G.w || j >= G.h ? 0 : G.data[j * G.w + i]);
    const v = (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
    if (v > 0) k *= 1 - b.a * v / 255;
  }
  return k;
}

// --------------------------------------------------- fumo e polvere

const PUFF = partType({
  sprite: "nubespr", size: [0.18, 0.26, 0.003, 0], colour: { rgb: [195, 215, 195, 215, 195, 215] },
  alpha: [0.55, 0.35, 0], speed: [0.45, 0.65, 0, 0], direction: [80, 100, 0, 6], life: [130, 180],
});
const COLLAPSE = partType({
  sprite: "nubespr", size: [0.35, 0.65, 0.004, 0], colour: { rgb: [150, 175, 125, 145, 95, 115] },
  alpha: [0.75, 0.45, 0], speed: [0.4, 1.6, -0.008, 0], direction: [0, 360, 0, 0], life: [100, 170],
});
const TRAIL = partType({
  sprite: "nubespr", size: [0.14, 0.22, 0.003, 0], colour: { rgb: [175, 195, 150, 170, 115, 135] },
  alpha: [0.5, 0], speed: [0.15, 0.45, 0, 0], direction: [0, 360, 0, 0], life: [40, 60],
});

// Cima del camino rispetto all'origine dell'edificio, per sprite: case del
// giocatore c1s, c2s, c4s, c6s (3 e 5 non hanno camino); [§9.93] case
// nemiche c2b, c6b (le altre hanno il tetto piatto senza camino), il centro
// citta' (cc_spr) e quello nemico (cc_b), che hanno il camino nello stesso
// punto. Gli altri edifici non hanno camini.
export const CHIMNEY = {
  c1s: [-2, -113], c2s: [21, -106], c4s: [-27, -120], c6s: [42, -128],
  c2b: [-6, -126], c6b: [58, -92], cc_spr: [-138, -141], cc_b: [-138, -141],
};
const CHIMNEY_OBJECTS = ["casa", "enemy_house", "centro", "enemy_centro"];

const onScreen = (cam, x, y, m = 200) => x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m && y < cam.y + cam.h + m;

// un sistema per i fumi (sopra tutto: escono dai tetti) e uno per la polvere
// in corsa (sotto tutte le istanze, a terra), creati alla prima occorrenza
const SYS = new WeakMap();
function systems(w) {
  let s = SYS.get(w);
  const P = w.particles;
  // (dopo un caricamento i sistemi sono altri: si ricreano)
  if (!s || !P.exists(s.smoke) || !P.systems.includes(s.smoke) || !P.systems.includes(s.trail)) {
    s = { smoke: P.systemCreate(-1e7, "fire"), trail: P.systemCreate(1e9, "fire") };
    s.em = P.emitterCreate(s.smoke); s.emT = P.emitterCreate(s.trail);
    SYS.set(w, s);
  }
  return s;
}

function puffAt(w, ps, em, type, x, y, n, rx = 2, ry = 2) {
  const P = w.particles;
  P.region(em, x - rx, x + rx, y - ry, y + ry, "ellipse", "gaussian");
  P.burst(ps, em, type, n);
}

// polvere e detriti di un crollo (grande: castello, monastero, centro, ...)
function collapseDust(w, i) {
  const P = w.particles, bb = w.bbox(i);
  const wdt = bb ? bb[2] - bb[0] : 200, big = wdt > 260;
  const ps = P.systemCreate(-i.y - 60, "fire");
  P.releaseWhenEmpty(ps);
  const em = P.emitterCreate(ps);
  const rx = Math.max(60, wdt * 0.45), ry = rx * 0.45;
  puffAt(w, ps, em, COLLAPSE, i.x, i.y - 30, big ? 26 : 12, rx, ry);
  for (let k = 0; k < (big ? 8 : 4); k++) {
    const m = w.create("sfx_mattone", i.x + (Math.random() - 0.5) * rx * 1.4, i.y - 20 + (Math.random() - 0.5) * ry * 1.4);
    m.speed = 1.5 + Math.random() * 2; m.direction = Math.random() * 360;
  }
}

// I crolli si riconoscono dalle rovine nuove (quelle della stanza al primo
// passo, o dopo un caricamento, no)
const RUINS = new WeakMap();
function ruinNames(w) {
  return Object.keys(w.behaviours).filter((n) => /ruin\d?$/.test(n));
}

const LAST = new WeakMap(); // posizione dell'ultimo sbuffo di polvere per unita'
const TRAILERS = ["ally_cavaliere", "enemy_cavaliere", "ally_ariete", "ally_catapulta", "enemy_ariete", "enemy_catapulta"];

// Un passo (app.js, dopo il mondo)
export function ambienceStep(w, cam) {
  if (w.particles) w.particles.wind = windLevel(w.g); // §9.90: erba e fiori
  if (w.room === "menu" || !w.particles) return;
  const P = w.particles, t = w._stepNo;
  // crolli
  let seen = RUINS.get(w);
  const fresh = !seen;
  if (fresh) { seen = new Set(); RUINS.set(w, seen); }
  for (const n of ruinNames(w)) {
    for (const r of w.all(n)) {
      if (seen.has(r)) continue;
      seen.add(r);
      if (!fresh && onScreen(cam, r.x, r.y, 400)) collapseDust(w, r);
    }
  }
  if (P.hidden.has("fire")) return;
  const S = systems(w);
  // camini: uno sbuffo ogni ~50-70 passi per edificio (fase diversa per
  // edificio); il camino dallo sprite (le case della mappa non hanno tipo).
  // Quelli nemici solo una volta visti (visible, enemybuild.js)
  for (const n of CHIMNEY_OBJECTS) {
    for (const h of w.all(n)) {
      const c = CHIMNEY[h.sprite_index];
      if (!c || h.onfire === 1 || h.visible === false) continue;
      if ((t + h.id * 37) % (50 + (h.id % 21)) !== 0) continue;
      const x = h.x + c[0], y = h.y + c[1];
      if (onScreen(cam, x, y)) puffAt(w, S.smoke, S.em, PUFF, x, y - 4, 1);
    }
  }
  // polvere in corsa: uno sbuffo ogni 18 px percorsi
  for (const n of TRAILERS) {
    for (const u of w.all(n)) {
      if (!u.alive || u.visible === false) continue;
      const l = LAST.get(u);
      if (!l) { LAST.set(u, [u.x, u.y]); continue; }
      const d = Math.hypot(u.x - l[0], u.y - l[1]);
      if (d < 18) continue;
      l[0] = u.x; l[1] = u.y;
      if (d > 120 || !onScreen(cam, u.x, u.y)) continue; // un salto (nata altrove, caricamento)
      const big = !n.endsWith("cavaliere");
      puffAt(w, S.trail, S.emT, TRAIL, u.x, u.y + (big ? 20 : 8), big ? 2 : 1, big ? 30 : 10, big ? 10 : 4);
    }
  }
}
