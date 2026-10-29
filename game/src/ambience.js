// [§9.84, richiesta dell'autore] Effetti d'ambiente, solo estetici (il gioco
// non li legge mai, non si salvano):
// - ombre delle nuvole: macchie scure e morbide (lo sprite della luce dei
//   fuochi, arealight, nero e trasparente, allargato e schiacciato come il
//   suolo) che il vento porta lentamente attraverso la mappa. Sul suolo si
//   disegnano subito dopo di lui; edifici, alberi e unita' si scuriscono
//   tutti interi (Renderer.shade) di quanto e' in ombra il punto in cui
//   toccano terra: una torre non si "dipinge per terra", entra nell'ombra
//   quando ci entra la sua base. Spariscono di notte. Con la pioggia
//   (segnalazione dell'autore: non una nuvoletta che passa mentre piove) il
//   cielo e' coperto: le macchie si dissolvono e tutta la scena si scurisce
//   di un grigio freddo uniforme (overcast, fog.js skyColour), in qualche
//   secondo, e tornano quando smette;
// - fumo dai camini delle case del giocatore che ne hanno uno (stili 1, 2, 4
//   e 6; quelle nemiche hanno il tetto piatto): uno sbuffo ogni tanto;
// - polvere e detriti quando un edificio crolla in rovina;
// - polvere sotto cavalieri e macchine d'assedio in movimento.
// Fumo e polvere sono particelle della categoria "fire" (opzione "Fiamme e
// scintille"); tutto solo sullo schermo e nella parte vista della nebbia.

import { partType } from "./particles.js";

const BLACK = 0, DUST = 0x6e8ca8; // sabbia (BGR di 168, 140, 110)

// ------------------------------------------------------------- nuvole

// Profilo dell'alpha di arealight lungo il raggio (misurato sull'immagine,
// orizzontale: 95 px; in verticale 85): a 0, 0,1, ... 1 del raggio.
const AREA_R = 95, AREA_RY = 85;
const PROFILE = [1, 1, 1, 1, 0.886, 0.588, 0.29, 0.106, 0.031, 0.004, 0];
function areaAlpha(t) {
  if (t >= 1) return 0;
  const k = t * 10, i = Math.floor(k), f = k - i;
  return PROFILE[i] + (PROFILE[i + 1] - PROFILE[i]) * f;
}

const WIND = [0.32, 0.07];      // px di room a passo (verso est, un po' a sud)
const CLOUD_CELL = [2600, 1900]; // una nuvola ogni tanti px di room
const ALPHA = 0.16, SQUASH = 0.62;

// [§9.84] Il cielo coperto (0-1, w.overcast): segue la pioggia, ogni passo
// di OVERCAST_EASE della distanza (il 99% in ~5 s). Solo estetico, non si
// salva: dopo un caricamento riparte dal valore giusto.
const OVERCAST_EASE = 0.016;
export function overcastStep(w) {
  const target = w.g.raining === 1 ? 1 : 0;
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

// Le nuvole della stanza: ognuna 3-5 macchie attorno a un centro, su una
// griglia larga (con un margine oltre la stanza, da cui rientrano col vento)
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
      const cx = (gx + r(0)) * (W / nx), cy = (gy + r(1)) * (H / ny);
      const n = 3 + Math.floor(r(2) * 3), blobs = [];
      for (let b = 0; b < n; b++) {
        const s = 4 + r(3 + b) * 3.5;
        blobs.push([(r(8 + b) - 0.5) * 900, (r(12 + b) - 0.5) * 380, s]);
      }
      list.push({ cx, cy, blobs });
      k++;
    }
  }
  c = { room: w.room, list, W, H, M };
  CLOUDS.set(w, c);
  return c;
}

// Le macchie vicine alla view, in coordinate di room: [x, y, sx, sy, alpha]
export function cloudBlobs(w, cam) {
  const g = w.g;
  if (w.room === "menu") return [];
  const day = Math.max(0, 1 - 2 * Math.max(0, g.night || 0)); // a meta' tramonto sono gia' sparite
  const a = ALPHA * day * (1 - (w.overcast || 0)); // con la pioggia il cielo e' coperto: niente ombre nette
  if (a <= 0.003) return [];
  const C = cloudsOf(w), t = w._stepNo;
  const out = [];
  for (const cl of C.list) {
    const x = ((cl.cx + WIND[0] * t) % C.W + C.W) % C.W - C.M;
    const y = ((cl.cy + WIND[1] * t) % C.H + C.H) % C.H - C.M;
    for (const [dx, dy, s] of cl.blobs) {
      const bx = x + dx, by = y + dy, rx = AREA_R * s, ry = AREA_RY * s * SQUASH;
      if (bx + rx < cam.x || bx - rx > cam.x + cam.w || by + ry < cam.y || by - ry > cam.y + cam.h + 300) continue;
      out.push([bx, by, s, s * SQUASH, a]);
    }
  }
  return out;
}

// Sul suolo: subito dopo di lui, prima di tutte le istanze
export function drawCloudShadows(d, blobs) {
  for (const [x, y, sx, sy, a] of blobs) d.spriteExt("arealight", 0, x, y, sx, sy, 0, BLACK, a);
}

// Quanto resta di luce nel punto (x, y) (1 = niente ombra): lo stesso conto
// della miscela dei dischi neri sul suolo, (1 - a f) per ogni macchia
export function shadeAt(blobs, x, y) {
  let k = 1;
  for (const [bx, by, sx, sy, a] of blobs) {
    const dx = (x - bx) / (AREA_R * sx), dy = (y - by) / (AREA_RY * sy);
    const t = Math.hypot(dx, dy);
    if (t < 1) k *= 1 - a * areaAlpha(t);
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

// Cima del camino rispetto all'origine della casa del giocatore, per stile
// (c1s, c2s, c4s, c6s; 3 e 5 non hanno camino)
export const CHIMNEY = { 1: [-2, -113], 2: [21, -106], 4: [-27, -120], 6: [42, -128] };

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
  overcastStep(w);
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
  // camini: uno sbuffo ogni ~50-70 passi per casa (fase diversa per casa)
  for (const h of w.all("casa")) {
    const m = /^c(\d)s$/.exec(h.sprite_index || ""); // lo stile dallo sprite (le case della mappa non hanno tipo)
    const c = m && CHIMNEY[m[1]];
    if (!c || h.onfire === 1 || h.visible === false) continue;
    if ((t + h.id * 37) % (50 + (h.id % 21)) !== 0) continue;
    const x = h.x + c[0], y = h.y + c[1];
    if (onScreen(cam, x, y)) puffAt(w, S.smoke, S.em, PUFF, x, y - 4, 1);
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
