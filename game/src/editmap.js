// L'editor di mappe: la mappa che si modifica (STUDIO.md §9.181-§9.182).
//
// La mappa e' uno scenario (mapfile.js): `map.instances` e' la verita'. La
// scena la disegna col motore del gioco (un World senza comportamenti, il
// suolo cotto) e tiene il legame fra ogni voce della mappa e la sua istanza
// (byEntry). Le modifiche passano tutte da `edit` (una lista di cambi: voce,
// com'era, come diventa), cosi' annulla e ripeti sono gratis.
//
// [§9.182, decisioni dell'autore] l'editor e' per i giocatori e fa mappe da
// schermaglia: gli oggetti che si inseriscono sono quelli delle cinque mappe
// della schermaglia (CATALOG), niente unita' ne' edifici dei giocatori
// tranne le posizioni di partenza (i due `centro`).

import { World } from "./world.js";
import { Particles } from "./particles.js";
import { DECOR_OBJECTS, decorCreate, campoCreate, meadowCreate, clipDecor } from "./effects.js";
import { sliced } from "./scenario.js";
import { riverGeometry, riverJoin, roadGeometry, bridgeGeometry, patchGeometry, BRIDGE_RAILS, PAINTED_BRIDGES, riverCells, riverIn } from "./rivers.js";
import { GroundCache, GROUND } from "./ground.js";
import { mountainGeometry, mountainCells, mountainIn, rasterize, traceGrid, simplifyLine, insidePoly as pointInPoly, MOUNTAIN_CELL } from "./mountains.js"; // §9.214
import { bgrToRGB } from "./gl.js";
import { dcos, dsin, dhypot, datan2 } from "./dmath.js";
import { makeColourRgb } from "./colours.js";
import { spriteBounds } from "./sprites.js";
import { bankClouds, BANK } from "./stealth.js"; // §9.205
import { START, SIDED, SIDES, otherSide, UNITS, BUILDINGS, BLUE_OF, WALLS, isStart, HOME_STYLES, blueHome, fogOf, FOG_DEFAULTS } from "./mapfile.js";

// Gli oggetti che si inseriscono, per categoria (le schede della tavolozza):
// quelli delle mappe della schermaglia (scenari/sk_*.json) e i loro simili.
// Fiumi, strade e ponti sono della polilinea; i boschi anche del pennello.
// [§9.183, richiesta dell'autore] "per le case e gli alberi dai la
// possibilita' prima dell'inserimento di cambiare stile con un tasto, in modo
// da tenere un singolo oggetto con piu' stili": una casella per piu' stili.
// Gli alberi (albero e albero finto) hanno gli 8 sprite fra cui il gioco
// sceglie (choices: alb1..alb8, scritti nella voce come `sprite`); le 25
// case della citta' romana (ocr_01..ocr_45, tutte della stessa misura) sono
// una famiglia di oggetti ({ family, objects }). Basilica, teatro e tempio
// restano a parte (monumenti).
const range = (pre, list) => list.map((n) => pre + n);
export const HOUSES = range("ocr_", ["01", "02", "03", "04", "05", "11", "12", "13", "14", "15", "21", "22", "23", "24", "25",
                                     "31", "32", "33", "34", "35", "41", "42", "43", "44", "45"]);
// [§9.205] la nebbia in "Natura" (fogLook, sotto)
export const FOG_OBJECTS = ["sk_nebbia", "nebbia_banco"];
export const CATALOG = [
  // [§9.196, richiesta dell'autore] la scheda "Regia": per ora le partenze
  // (le bandierine), piu' avanti cio' che servira' agli scenari
  // ([§9.222, decisione dell'autore] anche la nebbia, prima in "Natura": e'
  // di gioco, il banco dimezza la vista dei nemici)
  { key: "start", label: "Setup", objects: ["centro", ...FOG_OBJECTS] },
  // [§9.193] unita' ed edifici delle due parti: una casella rossa e una blu
  { key: "units", label: "Units", objects: UNITS },
  // [§9.194] in fondo le mura: S le gira di 90 gradi (orizzontali, verticali)
  // [§9.203, richieste dell'autore] in testa il municipio (il centro con
  // `hall`: non una partenza); la casa coi suoi sei stili (S li cambia, come
  // per le mura; lo schieramento con l'interruttore)
  { key: "buildings", label: "Buildings",
    objects: [{ family: "hall", objects: [START], sided: true, extra: { hall: true } },
              ...BUILDINGS.map((b) => (b === "casa" ? { family: "home", objects: ["casa"], sided: true, sprites: HOME_STYLES } : b)),
              { family: "wall", objects: ["mura_ori", "mura_vert"], sided: true }] },
  { key: "resources", label: "Resources", objects: ["miniera_oro", "pietra_grande", "pietr_piccolo", "castelloruin", "torreruin", "chiesaruin"] },
  { key: "trees", label: "Trees", objects: ["albero", "albero_fake"] },
  // [§9.222, decisione dell'autore] niente piu' "Natura" ne' "Montagne": le
  // macchie di particelle le fa il pennello (il bouquet, §9.216), le montagne
  // lo strumento montagna (§9.214); la nebbia e' in "Regia", l'aiuola (prato1)
  // in "Citta'", le macchie d'erba dipinte (graa*) sono superate. Nelle mappe
  // che li hanno gia' restano (OLD_OBJECTS: si aprono, si spostano, si
  // cancellano), ma non si inseriscono piu'.
  // [§9.198, richiesta dell'autore] i ponti: solo quelli dipinti dall'autore
  // (cotti nel suolo sopra il fiume, rivers.js PAINTED_BRIDGES; il primo con
  // la sua balaustra); M li specchia (l'altro verso del fiume)
  { key: "bridges", label: "Bridges", objects: [...PAINTED_BRIDGES] },
  { key: "city", label: "City",
    objects: [{ family: "house", objects: HOUSES }, "ocr_basilica", "ocr_teatro", "ocr_tempio",
              "o_colonna", "o_fontana", "o_statua1", "o_statua2", "o_statua3", "o_statua4", "prato1"] }, // (§9.222: l'aiuola)
];
export const OLD_OBJECTS = ["burst_erba1", "burst_grano1", "chiazzaparticellare", "fiori_prato", "fiori_papaveri", "fiori_papaveri_erba",
                            "fiori_gialli_erba", "graa11", "graa12", "graa13", "graa14", "graa15", "erba_1", "fiorame1", "chiazza01",
                            ...range("montagna_", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
// tutti i nomi degli oggetti del catalogo
export const catalogObjects = () => CATALOG.flatMap((k) => k.objects.flatMap((q) => (typeof q === "string" ? [q] : q.objects)));

// [§9.183] Le caselle di una scheda: ognuna con i suoi stili ({ object,
// sprite? }): uno solo, gli sprite fra cui il gioco sceglie (gli alberi), o
// gli oggetti di una famiglia (le case)
// [§9.191] gli oggetti di uno schieramento (le partenze): una casella per
// parte, rossa e blu
export function paletteItems(cat, objects) {
  return cat.objects.flatMap((q) => {
    if (typeof q !== "string" && q.sided) { // §9.194: le mura, per parte, coi loro stili (i due versi)
      // ([§9.203] la casa: gli stili sono gli sprite; il municipio: `hall`)
      const styles = (side) => q.objects.filter((n) => objects[n])
        .flatMap((object) => (q.sprites || [null]).map((sprite) => ({ object, side, ...(sprite ? { sprite } : {}), ...q.extra })));
      return SIDES.map((side) => ({ key: q.family + ":" + side, side, styles: styles(side) }));
    }
    if (typeof q !== "string") return [{ key: q.family, styles: q.objects.filter((n) => objects[n]).map((object) => ({ object })) }];
    if (SIDED.has(q)) return SIDES.map((side) => ({ key: q + ":" + side, side, styles: [{ object: q, side }] }));
    const o = objects[q];
    return [{ key: q, styles: o && o.choices ? o.choices.map((sprite) => ({ object: q, sprite })) : [{ object: q }] }];
  });
}

// quante caselle ha una scheda (§9.191: le partenze, una per parte)
export const paletteCount = (cat) => cat.objects.reduce((n, q) => n + ((typeof q === "string" && SIDED.has(q)) || q.sided ? SIDES.length : 1), 0);

// [§9.183] Gli stili di una voce gia' messa (per cambiarli con "Sposta"):
// la lista e quale ha ora, o null se ne ha uno solo
export function stylesOf(e, objects) {
  const o = objects[e.object];
  // [§9.203] la casa: i suoi sei stili, nello stesso schieramento (come gli
  // alberi e le case della citta'; senza `sprite` mostra quello della posizione)
  if (e.object === "casa") {
    const styles = HOME_STYLES.map((sprite) => ({ object: e.object, side: e.side || "red", sprite }));
    return { styles, at: HOME_STYLES.includes(e.sprite) ? HOME_STYLES.indexOf(e.sprite) : HOME_STYLES.indexOf(homeOf(e, o)) };
  }
  // [§9.191] le partenze: lo schieramento (S lo cambia)
  if (SIDED.has(e.object)) return { styles: SIDES.map((side) => ({ object: e.object, side })), at: Math.max(0, SIDES.indexOf(e.side)) };
  if (o && o.choices) {
    const styles = o.choices.map((sprite) => ({ object: e.object, sprite }));
    // (senza `sprite` la voce mostra la variante della sua posizione)
    return { styles, at: o.choices.includes(e.sprite) ? o.choices.indexOf(e.sprite) : variantOf(e.x, e.y, o.choices.length) };
  }
  for (const k of CATALOG) {
    for (const q of k.objects) {
      if (typeof q !== "string" && q.objects.includes(e.object)) return { styles: q.objects.map((object) => ({ object })), at: q.objects.indexOf(e.object) };
    }
  }
  return null;
}
// [§9.184] gli oggetti che una mappa dell'editor puo' avere (la convalida
// dei file, mapfile.js validateMap): il catalogo, il manager e i ponti
// dipinti dei modelli
export const allowedObjects = () => new Set([...catalogObjects(), ...OLD_OBJECTS, ...SYSTEM, ...PAINTED_BRIDGES, ...WALLS]); // §9.194: anche le porte; §9.222: e quelli di prima

// [§9.194, richiesta dell'autore] Mura e porte, come nel gioco (walls.js):
// un tratto ha due "+" alle estremita' (KIND.plus: l'orizzontale a -219 e
// +207, il verticale all'origine e 300 px sopra); dal "+" il tratto nuovo
// prosegue dritto o gira di 90 gradi, secondo la direzione del puntatore,
// con gli scostamenti dei placer del gioco (SECTORS: oodl -208, oosl +217 o
// +218, ovbl sul "+", oval 246 sotto; dal "+" di sopra di un verticale 54
// px piu' giu'). Un tratto diventa porta e viceversa (stessa posizione).
export const WALL_KIND = { mura_ori: "ori", porta_ori: "ori", mura_vert: "vert", porta_vert: "vert" };
export const WALL_OF = { ori: "mura_ori", vert: "mura_vert" };
export const GATE_SWAP = { mura_ori: "porta_ori", porta_ori: "mura_ori", mura_vert: "porta_vert", porta_vert: "mura_vert" };
const WALL_PLUS = { ori: [["os", -219, 0], ["od", 207, 0]], vert: [["vb", 0, 0], ["va", 0, -300]] };
// per "+": [direzione (gradi come pointDirection: 0 a destra, 90 in su), verso, dx, dy]
const WALL_STEPS = {
  os: [[180, "ori", -208, 0], [90, "vert", 0, 0], [270, "vert", 0, 246]],
  od: [[0, "ori", 217, 0], [90, "vert", 0, 0], [270, "vert", 0, 246]],
  va: [[180, "ori", -208, 54], [90, "vert", 0, 54], [0, "ori", 218, 54]],
  vb: [[180, "ori", -208, 0], [0, "ori", 218, 0], [270, "vert", 0, 246]],
};
export const wallPluses = (e) => (WALL_KIND[e.object] ? WALL_PLUS[WALL_KIND[e.object]].map(([key, dx, dy]) => ({ key, e, x: e.x + dx, y: e.y + dy })) : []);
// i "+" liberi: quelli senza il "+" di un altro tratto vicino (entro `near`
// px: due tratti di fila li hanno a 2-3 px, ad angolo o in verticale a 54)
export function freePluses(instances, near = 64) {
  const all = instances.flatMap(wallPluses);
  return all.filter((p) => !all.some((q) => q.e !== p.e && Math.abs(q.x - p.x) <= near && Math.abs(q.y - p.y) <= near));
}
// il tratto che prosegue dal "+" p verso il punto (x, y) (il verso piu'
// vicino entro 60 gradi), o null: { object, x, y }
export function wallStep(p, x, y) {
  const deg = (((datan2(p.y - y, x - p.x) * 180) / Math.PI) % 360 + 360) % 360;
  let best = null, bd = 60.5;
  for (const [dir, kind, dx, dy] of WALL_STEPS[p.key]) {
    const d = Math.abs((((deg - dir) % 360) + 540) % 360 - 180);
    if (d < bd) { bd = d; best = { object: WALL_OF[kind], x: p.x + dx, y: p.y + dy }; }
  }
  return best;
}
// [§9.205, richiesta dell'autore] la nebbia in "Natura" (senza sprite: le
// nuvole fog1 del gioco). Il banco (nebbia_banco, stealth.js fogBank) va
// avanti e indietro di BANK.range px e dentro i nemici vedono a meta'
// (enemies.js fogSight); la nebbia estetica (sk_nebbia, skirmish.js) fa
// nascere 5 nuvole attorno a se' ogni tanto, che scivolano a destra.
// Nell'editor si vedono ferme come all'inizio della partita: il banco con
// le sue nuvole, la nebbia estetica con cinque nuvole in un disegno fisso
const MIST_LOOK = [[-600, -150, 1.1], [-150, 120, 0.9], [300, -80, 1.3], [700, 140, 1], [60, -230, 0.85]];
// (s: la scala, per la casella della tavolozza: lo sprite senza il prato;
// [§9.206] f: le impostazioni, mapfile.js fogOf: la densita')
export function fogLook(d, object, x, y, a = 1, s = 1, f = FOG_DEFAULTS[object]) {
  if (object === "nebbia_banco") { bankClouds(d, x, y, BANK.clouds, 0, a * f.density, s); return; }
  for (const [dx, dy, k] of MIST_LOOK) d.spriteExt("fog1", 0, x + dx * s, y + dy * s, k * s, k * s, 0, 0xffffff, f.density * a);
  d.setAlpha(1);
}
// quanto e' larga la nebbia di fogLook (px a scala 1): la casella la fa stare
export const FOG_SPAN = { nebbia_banco: 1110, sk_nebbia: 2050 };

// [§9.185] gli alberi (il pennello li dipinge e li cancella)
export const TREES = new Set(["albero", "albero_fake"]);
// [§9.203, richiesta dell'autore] l'albero finto con la F, solo nell'editor
// (come nell'editor di GameMaker e nel kit di Tiled: la F arancione di
// alb1_F, tools/11 fake_mark), per distinguerlo da quello vero; il gioco lo
// disegna come gli altri. I rettangoli della F in pixel dello sprite rispetto
// all'origine (tutti gli alb* hanno la stessa; in alb1_F x 66..97, y
// 62..137, origine 78, 164): l'asta, la sbarra in alto, quella in mezzo
export const FAKE = "albero_fake";
const FAKE_F = [[-12, -102, 7, -26], [-12, -102, 20, -86], [-12, -72, 19, -58]];
const FAKE_F_COLOUR = makeColourRgb(255, 128, 0);
export function fakeMark(d, x, y, k = 1, alpha = 1) {
  const a0 = d.alpha, c0 = d.colour;
  d.setColour(FAKE_F_COLOUR);
  d.setAlpha(alpha);
  for (const [a, b, c, e] of FAKE_F) d.rectangle(x + a * k, y + b * k, x + c * k, y + e * k);
  d.setColour(c0);
  d.setAlpha(a0);
}
// le posizioni di partenza di una mappa da schermaglia (skirmish.js
// skirmishPrepare: due centri, uno per parte)
export { START }; // (mapfile.js, §9.191)
export const STARTS = 2;
// [§9.191] come si vede una voce del blu: lo sprite del suo corrispondente
// della CPU (il centro blu: enemy_centro, cc_b), o null. [§9.193] Il
// lavoratore della CPU ha lo sprite del civile: quello blu e' b_ (economy.js)
export { BLUE_OF };
const BLUE_LOOK = { ally_omino: "b_ow11" };
// [§9.195, richiesta dell'autore] come nel gioco: il campo e' la terra arata
// col grano (campo_grano; nella scena anche le file di spighe, campoCreate),
// per tutte e due le parti (il campo della CPU e' uguale)
export const EDIT_LOOK = { campo: "campo_grano" };
// [§9.196, richiesta dell'autore] le partenze come bandierine (quelle del
// punto di raccolta del gioco, rossa e blu), grandi FLAG_SCALE volte: dove
// nascera' il centro di quella parte
export const FLAG = { red: "rflag", blue: "bflag" }, FLAG_SCALE = 2;
export function sideLook(objects, e) {
  if (isStart(e)) return FLAG[e.side] || FLAG.red;
  if (e.side === "blue" && blueHome(e.sprite)) return blueHome(e.sprite); // §9.203: la casa blu del suo stile
  if (EDIT_LOOK[e.object]) return EDIT_LOOK[e.object];
  if (e.side !== "blue" || !BLUE_OF[e.object]) return null;
  if (BLUE_LOOK[e.object]) return BLUE_LOOK[e.object];
  const b = objects[BLUE_OF[e.object]];
  return (b && b.sprite) || null;
}
// oggetti della mappa che non si toccano (il gioco ne ha bisogno: lo mette
// l'editor dove manca)
export const SYSTEM = new Set(["manager"]);
// [§9.185] le liste di forme della mappa, che il suolo disegna
// ([§9.216] le chiazze d'erba per ultime: non nascono sull'acqua ne' sulle montagne)
export const FEATURES = ["patches", "rivers", "roads", "bridges", "mountains", "meadows"]; // §9.214: le montagne del generatore
// cuociono nel suolo (ground.js): se cambiano, il suolo si rifa'
export const baked = (name) => GROUND.test(name) || PAINTED_BRIDGES.includes(name);

// [§9.184] La simmetria (§9.182-§9.183, confermata dall'autore): il punto
// gemello di (x, y) in una mappa W x H. Diagonale: la rotazione di 180 gradi
// attorno al centro (le cinque schermaglie, tools/16); orizzontale: le meta'
// a sinistra e a destra; verticale: sopra e sotto. Gli oggetti cambiano
// posto, gli sprite non si capovolgono (le ombre degli edifici restano a
// destra in basso).
export function mirrorPoint(mode, W, H, x, y) {
  if (mode === "diagonal") return [W - x, H - y];
  if (mode === "horizontal") return [W - x, y];
  if (mode === "vertical") return [x, H - y];
  return null;
}
export function mirrorDelta(mode, dx, dy) {
  if (mode === "diagonal") return [-dx, -dy];
  if (mode === "horizontal") return [-dx, dy];
  if (mode === "vertical") return [dx, -dy];
  return [dx, dy];
}

// [§9.181] La variante di un oggetto con piu' sprite (albero: alb1..alb8),
// se la mappa non la dice: dalla posizione, sempre la stessa
export const variantOf = (x, y, n) => (((Math.round(x) * 73856093) ^ (Math.round(y) * 19349663)) >>> 0) % n;
// [§9.203] lo stile che mostra una casa senza `sprite` (come spawn)
// (il blu: lo sprite di enemy_house, c3b)
const homeOf = (e, o) => (e.side === "blue" ? HOME_STYLES[2] : o && o.choices ? o.choices[variantOf(e.x, e.y, o.choices.length)] : HOME_STYLES[0]);

// I gruppi d'atlas che servono a disegnare questi oggetti
export function groupsFor(assets, objects, names) {
  const out = new Set();
  const want = (s) => { if (s && assets.sprites[s]) out.add(assets.sprites[s].group); };
  for (const n of names) {
    const o = objects[n];
    if (!o) continue;
    want(o.sprite);
    for (const s of o.choices || []) want(s);
    for (const [s] of o.slices || []) want(s);
    if (BRIDGE_RAILS[n] && objects[BRIDGE_RAILS[n]]) want(objects[BRIDGE_RAILS[n]].sprite);
    if (BLUE_OF[n] && objects[BLUE_OF[n]]) { want(objects[BLUE_OF[n]].sprite); for (const s of objects[BLUE_OF[n]].choices || []) want(s); } // §9.191, §9.203
    if (BLUE_LOOK[n]) want(BLUE_LOOK[n]); // §9.193
    if (EDIT_LOOK[n]) { want(EDIT_LOOK[n]); want("spiga"); } // §9.195: il campo col grano
    if (n === START) { want(FLAG.red); want(FLAG.blue); } // §9.196: le bandierine
    want("ed_natura_" + n); // §9.203: la foto di una macchia a particelle
    if (FOG_OBJECTS.includes(n)) want("fog1"); // §9.205: le nuvole della nebbia
  }
  return out;
}

// Il riquadro dello sprite di un'istanza, stretto (quello di sprites.js
// spriteBounds e' largo per eccesso); con la rotazione, il riquadro dei
// quattro angoli. null senza sprite.
export function tightBounds(assets, name, x, y, sx = 1, sy = 1, angle = 0) {
  const fr = name && assets.frame(name, 0);
  if (!fr) return null;
  const { s, f } = fr, [tx, ty, tw, th] = f.trim;
  const xs = [(tx - s.origin[0]) * sx, (tx + tw - s.origin[0]) * sx], ys = [(ty - s.origin[1]) * sy, (ty + th - s.origin[1]) * sy];
  if (!angle) return [x + Math.min(...xs), y + Math.min(...ys), x + Math.max(...xs), y + Math.max(...ys)];
  const a = -angle * Math.PI / 180, c = dcos(a), sn = dsin(a);
  const px = [], py = [];
  for (const lx of xs) for (const ly of ys) { px.push(x + lx * c - ly * sn); py.push(y + lx * sn + ly * c); }
  return [Math.min(...px), Math.min(...py), Math.max(...px), Math.max(...py)];
}

export class EditScene {
  // ctx: { r, assets, objects, masks }. La mappa deve avere gia' gli sprite
  // caricati (EditScene.load).
  constructor(ctx, map) {
    Object.assign(this, ctx);
    this.map = map;
    this.undoList = [];
    this.redoList = [];
    this.version = 0; // cresce a ogni modifica (la mappa e' cambiata dall'apertura)
    const world = this.world = new World({ objects: ctx.objects, masks: ctx.masks, assets: ctx.assets, g: {}, roomW: map.width, roomH: map.height });
    world.particles = new Particles();
    for (const n of DECOR_OBJECTS) world.register(n, { create: decorCreate });
    world.register("campo", { create: campoCreate }); // §9.195: le file di spighe, come nel gioco
    // [§9.203] l'albero finto con la F, alla sua depth (dietro gli alberi
    // davanti); fuori dalla vista (drawView, editor.js) niente
    // [§9.205] la nebbia ferma (fogLook), alla depth del gioco
    // ([§9.206] con le impostazioni della voce)
    world.register("nebbia_banco", { create(i) { i.depth = -i.y - 150; }, draw(i, w, d) { fogLook(d, i.object, i.x, i.y, 1, 1, fogOf(i.src || i)); } });
    world.register("sk_nebbia", { create(i) { i.depth = -i.y - 100; }, draw(i, w, d) { fogLook(d, i.object, i.x, i.y, 1, 1, fogOf(i.src || i)); } });
    world.register(FAKE, { draw(i, w, d) {
      const v = w.drawView, b = v && spriteBounds(w.assets, i.sprite_index, i.x, i.y, i.image_xscale, i.image_yscale);
      if (v && (!b || b[2] < v.x || b[0] > v.x + v.w || b[3] < v.y || b[1] > v.y + v.h)) return;
      d.spriteExt(i.sprite_index, 0, i.x, i.y, i.image_xscale, i.image_yscale, i.image_angle, i.image_blend, i.image_alpha);
      if (i.sprite_index !== "alb1_F") fakeMark(d, i.x, i.y, i.image_xscale);
    } });
    for (const [name, o] of Object.entries(ctx.objects)) if (o.slices) world.register(name, sliced(o));
    for (const [name, rail] of Object.entries(BRIDGE_RAILS)) {
      world.register(name, { create(i, w) { w.create(rail, i.x, i.y, { sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle }); } });
    }
    this.byEntry = new Map();
    this.skipped = new Set();
    for (const e of map.instances) this.spawn(e);
    if (this.skipped.size) console.warn("[editor] oggetti sconosciuti saltati:", [...this.skipped]);
    // fiumi, strade, ponti e macchie (come app.js useRivers)
    for (const k of FEATURES) this._features(k);
    // [§9.217] le macchie di "Natura" tagliate da fiumi e montagne (ora che ci sono)
    this.ready = true;
    this._clipDecors();
    const room = { backgrounds: map.background ? [{ name: map.background, htiled: true, vtiled: true, x: 0, y: 0 }] : [] };
    this.ground = new GroundCache(ctx.r, ctx.assets, room, world, bgrToRGB(map.colour));
  }

  // la scena di una mappa, dopo aver caricato gli sprite che le servono
  // (come in partita: core e gioco se ha qualcosa, e i gruppi in piu' dei
  // suoi oggetti, la citta')
  static async load(ctx, map, progress) {
    const A = ctx.assets, names = new Set(map.instances.map((e) => e.object));
    const groups = new Set(A.groupsOfTier("core", ...(names.size ? ["gioco"] : [])));
    for (const g of groupsFor(A, ctx.objects, names)) groups.add(g);
    const bgs = [map.background, "fiume_acqua", "fiume_sassi", "fiume_carta", "monte_roccia", ...(map.patches || []).map((p) => p.bg || "city2")];
    await A.load([...groups], bgs.filter(Boolean), progress);
    return new EditScene(ctx, map);
  }

  // ---------------------------------------------------- voci e istanze

  // l'istanza di una voce: sprite (la variante), visibile, il Create di chi
  // disegna (macchie, fette, balaustre); i "figli" nati nel Create (fette,
  // balaustre) si ricordano per toglierli con lei
  spawn(e) {
    const o = this.objects[e.object];
    if (!o) { this.skipped.add(e.object); return null; }
    const w = this.world, n0 = w.instances.length;
    const i = w._alloc(e.object, e.x, e.y, { sx: e.scale_x ?? 1, sy: e.scale_y ?? 1, rot: e.rotation ?? 0, noChoice: true });
    // ([§9.203] anche lo sprite dell'oggetto: il primo stile della casa, c1s)
    if (o.choices) i.sprite_index = o.choices.includes(e.sprite) || (e.sprite && e.sprite === o.sprite) ? e.sprite : o.choices[variantOf(e.x, e.y, o.choices.length)];
    const look = sideLook(this.objects, e); // §9.191: il blu col suo sprite
    if (look) i.sprite_index = look;
    if (isStart(e)) { i.image_xscale *= FLAG_SCALE; i.image_yscale *= FLAG_SCALE; } // §9.196: la bandierina, grande
    if (o.reveal) i.visible = true;
    w.fire(i, "create");
    if (this.ready && i.grass_rows) clipDecor(w, i, this._blocked(), true); // §9.217: tagliata da fiumi e montagne
    i.kids = w.instances.slice(n0 + 1);
    i.src = e;
    this.byEntry.set(e, i);
    return i;
  }

  despawn(e) {
    const i = this.byEntry.get(e);
    if (!i) return;
    const w = this.world;
    for (const s of i.grass_rows || []) w.particles.systemDestroy(s); // le macchie (effects.js decorCreate)
    for (const s of i.crop_rows || []) w.particles.systemDestroy(s); // §9.195: le spighe del campo
    for (const k of i.kids || []) w.destroy(k);
    w.destroy(i);
    this.byEntry.delete(e);
  }

  instOf(e) { return this.byEntry.get(e) || null; }

  // [§9.185] le forme di una lista della mappa (macchie, fiumi, strade,
  // ponti) ridisegnate dal motore (come app.js useRivers)
  _features(key) {
    const map = this.map, w = this.world, R = [map.width, map.height];
    if (!map[key]) map[key] = [];
    if (key === "patches") w.patches = map.patches.map((p) => patchGeometry(p));
    if (key === "rivers") { w.rivers = riverJoin(map.rivers, (rv) => riverGeometry({ ...rv, room: R })); w._riverCells = undefined; w._water = undefined; }
    if (key === "roads") w.roads = map.roads.map((rd) => roadGeometry({ ...rd, room: R }));
    if (key === "bridges") w.bridges = map.bridges.map((b) => bridgeGeometry(b));
    if (key === "mountains") { w.mountains = map.mountains.map((m) => this.mountainGeo(m)); w._mountainCells = undefined; } // §9.214
    if (key === "meadows") this._meadows(); // §9.216
  }

  // ------------------------------------------------------------ modifiche

  // I cambi: { e: la voce, from: com'era (null: non c'era), to: come diventa
  // (null: tolta), at: il suo posto nella lista }. L'ordine della lista e'
  // l'ordine di creazione delle istanze in partita. [§9.185] Con `key` il
  // cambio e' di una forma (macchie, fiumi, strade, ponti: map[key]).
  _apply(c, back) {
    if (c.key) {
      const want = back ? c.from : c.to, list = this.map[c.key], at = list.indexOf(c.e);
      if (!want) { if (at >= 0) list.splice(at, 1); return; }
      for (const k of Object.keys(c.e)) delete c.e[k];
      Object.assign(c.e, JSON.parse(JSON.stringify(want)));
      if (at < 0) list.splice(Math.min(c.at, list.length), 0, c.e);
      return;
    }
    const want = back ? c.from : c.to, list = this.map.instances, at = list.indexOf(c.e);
    this.despawn(c.e);
    if (!want) { if (at >= 0) list.splice(at, 1); return; }
    for (const k of Object.keys(c.e)) delete c.e[k];
    Object.assign(c.e, want);
    if (at < 0) list.splice(Math.min(c.at, list.length), 0, c.e);
    this.spawn(c.e);
  }

  // [§9.216] le particelle delle chiazze d'erba: rifatte solo quelle nuove o
  // cambiate (una pennellata non rifa' tutta l'erba della mappa); `all`:
  // tutte (sono cambiati fiumi o montagne, dove l'erba non nasce)
  _meadows(all = false) {
    const w = this.world, P = w.particles, old = this.meadowRows || new Map(), now = new Map();
    const rc = riverCells(w), mc = mountainCells(w);
    const blocked = (x, y) => (!!rc && riverIn(rc, x, y, x, y)) || (!!mc && mountainIn(mc, x, y, x, y));
    for (const m of this.map.meadows || []) {
      const key = JSON.stringify(m), was = old.get(m);
      if (was && was.key === key && !all) { now.set(m, was); old.delete(m); continue; }
      now.set(m, { key, rows: meadowCreate(w, m, blocked) });
    }
    for (const [, v] of old) for (const s of v.rows) P.systemDestroy(s);
    this.meadowRows = now;
  }

  // [§9.217] dove le particelle non stanno: l'acqua dei fiumi, le montagne
  _blocked() {
    const w = this.world, rc = riverCells(w), mc = mountainCells(w);
    return (x, y) => (!!rc && riverIn(rc, x, y, x, y)) || (!!mc && mountainIn(mc, x, y, x, y));
  }
  _clipDecors() {
    const b = this._blocked();
    for (const i of this.byEntry.values()) if (i.alive && i.grass_rows) clipDecor(this.world, i, b, true);
  }

  _after(changes) {
    const w = this.world;
    w.instances = w.instances.filter((i) => i.alive);
    w._compact();
    const keys = new Set(changes.filter((c) => c.key).map((c) => c.key));
    // [§9.216] fiumi o montagne cambiati: l'erba rinasce dove puo'
    if ((keys.has("rivers") || keys.has("mountains")) && (this.map.meadows || []).length && !keys.has("meadows")) keys.add("meadows!");
    // (l'erba per ultima: sa dove sono acqua e montagne nuove)
    for (const k of [...keys].sort((a, b) => (a.startsWith("meadows") ? 1 : 0) - (b.startsWith("meadows") ? 1 : 0))) {
      if (k === "meadows!") this._meadows(true); else this._features(k);
    }
    if (keys.has("rivers") || keys.has("mountains")) this._clipDecors(); // §9.217
    if ([...keys].some((k) => !k.startsWith("meadows")) || changes.some((c) => !c.key && (baked((c.from || c.to).object) || (c.to && baked(c.to.object))))) this.ground.reset();
    this.version++;
  }

  edit(changes) {
    if (!changes.length) return;
    for (const c of changes) this._apply(c, false);
    // [§9.185] dentro un gruppo (una pennellata) i cambi diventano un passo solo
    if (this.group) this.group.push(...changes);
    else this._push(changes);
    this._after(changes);
  }

  _push(changes) {
    this.undoList.push(changes);
    if (this.undoList.length > 200) this.undoList.shift();
    this.redoList.length = 0;
  }

  // [§9.185] un gruppo di modifiche (una pennellata): annulla le toglie tutte
  begin() { this.group = []; }
  end() {
    const g = this.group;
    this.group = null;
    if (g && g.length) this._push(g);
  }

  undo() {
    const cs = this.undoList.pop();
    if (!cs) return false;
    for (let k = cs.length - 1; k >= 0; k--) this._apply(cs[k], true);
    this.redoList.push(cs);
    this._after(cs);
    return true;
  }

  redo() {
    const cs = this.redoList.pop();
    if (!cs) return false;
    for (const c of cs) this._apply(c, false);
    this.undoList.push(cs);
    this._after(cs);
    return true;
  }

  // voci nuove, in fondo alla lista
  add(entries) {
    const n = this.map.instances.length;
    this.edit(entries.map((e, k) => ({ e, from: null, to: { ...e }, at: n + k })));
    return entries;
  }

  // voci tolte: dalla piu' in fondo (annullando tornano ognuna al suo posto)
  remove(entries) {
    const list = this.map.instances;
    const cs = entries.map((e) => ({ e, from: { ...e }, to: null, at: list.indexOf(e) })).filter((c) => c.at >= 0);
    this.edit(cs.sort((a, b) => b.at - a.at));
  }

  // voci cambiate: fn(e) da' i campi nuovi
  modify(entries, fn) {
    const list = this.map.instances;
    this.edit(entries.map((e) => ({ e, from: { ...e }, to: { ...e, ...fn(e) }, at: list.indexOf(e) })));
  }

  // [§9.185] forme nuove (macchie, fiumi, strade, ponti) in fondo alla lista
  // `key`, e forme tolte (annullando tornano al loro posto)
  addFeatures(key, list) {
    const n = (this.map[key] || []).length;
    this.edit(list.map((e, k) => ({ key, e, from: null, to: JSON.parse(JSON.stringify(e)), at: n + k })));
    return list;
  }
  // [§9.187] forme cambiate (i punti, le larghezze): fn(e) da' i campi nuovi
  modifyFeatures(key, list, fn) {
    const all = this.map[key] || [], copy = (x) => JSON.parse(JSON.stringify(x));
    this.edit(list.map((e) => ({ key, e, from: copy(e), to: copy({ ...e, ...fn(e) }), at: all.indexOf(e) })));
  }

  // [§9.187] la linea gemella (fiumi, strade) con la simmetria `mode`: stessi
  // punti specchiati, nello stesso ordine, entro 2 px
  twinLine(key, e, mode) {
    if (!mode || mode === "none") return null;
    const W = this.map.width, H = this.map.height;
    const want = e.pts.map(([x, y]) => mirrorPoint(mode, W, H, x, y));
    if (want.every(([x, y], k) => Math.abs(x - e.pts[k][0]) <= 1 && Math.abs(y - e.pts[k][1]) <= 1)) return null; // (gemella di se stessa)
    return (this.map[key] || []).find((f) => f !== e && f.pts.length === want.length
      && f.pts.every(([x, y], k) => Math.abs(x - want[k][0]) <= 2 && Math.abs(y - want[k][1]) <= 2)) || null;
  }

  removeFeatures(key, list) {
    const all = this.map[key] || [];
    const cs = list.map((e) => ({ key, e, from: JSON.parse(JSON.stringify(e)), to: null, at: all.indexOf(e) })).filter((c) => c.at >= 0);
    this.edit(cs.sort((a, b) => b.at - a.at));
  }

  // [§9.185] il pennello dei boschi: in (x, y) un albero non sta se i piedi
  // (w x h px attorno al punto) toccano l'acqua o la maschera di un oggetto
  // della mappa; i prati e le strade dipinti nel suolo e le macchie no
  blocks(x, y, w = 10, h = 5) {
    const W = this.world, rc = riverCells(W), mc = mountainCells(W);
    if (rc && riverIn(rc, x - w, y - h, x + w, y + h)) return true;
    if (mc && mountainIn(mc, x - w, y - h, x + w, y + h)) return true; // §9.214
    const rect = [x - w, y - h, x + w, y + h];
    for (const o of W._nearList(rect)) {
      if (!o.alive || GROUND.test(o.object)) continue;
      const bb = W.bbox(o);
      if (!bb || bb[0] > rect[2] || bb[2] < rect[0] || bb[1] > rect[3] || bb[3] < rect[1]) continue;
      for (let yy = Math.floor(Math.max(rect[1], bb[1])); yy <= Math.min(rect[3], bb[3]); yy++) {
        if (W._spans(o, o.x, o.y, bb, yy, rect[0], rect[2] + 1, [])) return true;
      }
    }
    return false;
  }

  // [§9.204, richiesta dell'autore] gli alberi della mappa coi piedi
  // nell'acqua dei fiumi `list` (le loro voci; come blocks, con la geometria
  // del gioco): quelli che un fiume nuovo toglie
  treesInRivers(list, w = 10, h = 5) {
    // (il mondo della scena con i soli fiumi nuovi: i ponti restano, sotto
    // non c'e' acqua, come in riverCells)
    const R = [this.map.width, this.map.height], only = Object.create(this.world);
    Object.assign(only, { rivers: list.map((rv) => riverGeometry({ ...rv, room: R })), _riverCells: undefined });
    const rc = riverCells(only);
    if (!rc) return [];
    return this.map.instances.filter((e) => TREES.has(e.object) && riverIn(rc, e.x - w, e.y - h, e.x + w, e.y + h));
  }

  // ---------------------------------------------------------- montagne

  // [§9.214] la forma di una montagna della mappa (le gemelle: specchiate
  // nella mappa di adesso)
  mountainGeo(m) { return mountainGeometry({ ...m, room: [this.map.width, this.map.height] }); }

  // la gemella di una montagna (stessi campi, l'altra con `mirrored`), o null
  twinMountain(e) {
    if (!e.sym) return null;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    return (this.map.mountains || []).find((f) => f !== e && f.sym === e.sym && !f.mirrored !== !e.mirrored && f.seed === e.seed
      && same(f.crest, e.crest) && same(f.base || null, e.base || null)) || null;
  }

  // la griglia (celle da 8 px, tutta la mappa) delle montagne `geos`
  // (forme), allargata di `px` px in orizzontale e px * ISO in verticale
  mountainGrid(geos, px = 0) {
    const C = MOUNTAIN_CELL, gw = Math.ceil(this.map.width / C), gh = Math.ceil(this.map.height / C);
    let grid = new Uint8Array(gw * gh);
    for (const g of geos) rasterize(g, grid, gw, gh, C);
    const rx = Math.round(px / C), ry = Math.round((px * 0.62) / C);
    if (rx > 0 || ry > 0) {
      const t = new Uint8Array(gw * gh), out = new Uint8Array(gw * gh);
      for (let y = 0; y < gh; y++) { // in orizzontale: quante celle piene nelle ultime 2rx+1
        let run = 0;
        for (let x = -rx; x < gw + rx; x++) {
          if (x + rx < gw && grid[y * gw + x + rx]) run = 2 * rx + 1;
          if (x >= 0 && x < gw && run > 0) t[y * gw + x] = 1;
          run--;
        }
      }
      for (let x = 0; x < gw; x++) {
        let run = 0;
        for (let y = -ry; y < gh + ry; y++) {
          if (y + ry < gh && t[(y + ry) * gw + x]) run = 2 * ry + 1;
          if (y >= 0 && y < gh && run > 0) out[y * gw + x] = 1;
          run--;
        }
      }
      grid = out;
    }
    return { C, gw, gh, grid };
  }

  // la montagna (voce) sotto il punto (x, y): la sua sagoma, la piu' davanti
  mountainAt(x, y) {
    const list = this.map.mountains || [], geos = this.world.mountains || [];
    let best = null, by = -Infinity;
    list.forEach((e, k) => {
      const g = geos[k];
      if (!g || x < g.bbox[0] || x > g.bbox[2] || y < g.bbox[1] || y > g.bbox[3]) return;
      const hit = g.layers.some((L) => L.face && pointInPoly(x, y, L.face)) || pointInPoly(x, y, g.base);
      if (hit && g.bbox[3] > by) { by = g.bbox[3]; best = e; }
    });
    return best;
  }

  // [§9.214, richiesta dell'autore: "la montagna quando creata elimina
  // tutti gli oggetti in collisione"] le voci della mappa sotto le montagne
  // `geos`: gli alberi coi piedi sulla sagoma (come per i fiumi), gli altri
  // oggetti con la maschera (righe ogni 4 px), quelli senza maschera (le
  // macchie) col punto d'origine
  underMountains(geos) {
    if (!geos.length) return [];
    const mc = this.mountainGrid(geos), W = this.world, C = mc.C;
    const cell = (x, y) => x >= 0 && y >= 0 && x < mc.gw * C && y < mc.gh * C && mc.grid[Math.floor(y / C) * mc.gw + Math.floor(x / C)] === 1;
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const g of geos) { box[0] = Math.min(box[0], g.bbox[0]); box[1] = Math.min(box[1], g.bbox[1]); box[2] = Math.max(box[2], g.bbox[2]); box[3] = Math.max(box[3], g.bbox[3]); }
    const out = [], spans = [];
    for (const e of this.map.instances) {
      if (SYSTEM.has(e.object)) continue;
      if (TREES.has(e.object)) { if (mountainIn(mc, e.x - 10, e.y - 5, e.x + 10, e.y + 5)) out.push(e); continue; }
      const i = this.byEntry.get(e), bb = i && i.alive && W.bbox(i);
      if (!bb) { if (cell(e.x, e.y)) out.push(e); continue; }
      if (bb[2] < box[0] || bb[0] > box[2] || bb[3] < box[1] || bb[1] > box[3]) continue;
      let hit = false;
      for (let y = Math.floor(bb[1]); y < bb[3] && !hit; y += 4) {
        const n = W._spans(i, i.x, i.y, bb, y, bb[0], bb[2] + 1, spans);
        for (let k = 0; k < n && !hit; k += 2) for (let x = spans[k]; x < spans[k + 1] && !hit; x += 4) hit = cell(x, y);
      }
      if (hit) out.push(e);
    }
    return out;
  }

  // [§9.214, richiesta dell'autore: "sposta le polilinee in interferenza in
  // modo che girino intorno alla montagna"] I fiumi e le strade che toccano
  // le montagne `geos` (forme): il pezzo che ci passa sopra diventa un giro
  // attorno, lungo il contorno della montagna allargato di mezza linea piu'
  // MARGIN px (dalla parte piu' corta); un'estremita' sulla montagna si
  // ferma al contorno. Restituisce [{ key, e, pts }] (pts: null, la linea
  // sparisce: era tutta sotto la montagna).
  reroute(geos) {
    const out = [], MARGIN = 40, STEP = 8;
    for (const key of ["rivers", "roads"]) {
      for (const e of this.map[key] || []) {
        const wmax = Math.max(e.width || 150, e.widthEnd || e.width || 150);
        const mc = this.mountainGrid(geos, wmax / 2 + MARGIN), C = mc.C;
        const inside = (p) => p[0] >= 0 && p[1] >= 0 && p[0] < mc.gw * C && p[1] < mc.gh * C && mc.grid[Math.floor(p[1] / C) * mc.gw + Math.floor(p[0] / C)] === 1;
        // la linea a passi di STEP px, coi punti dell'autore
        const S = [];
        for (let k = 0; k < e.pts.length - 1; k++) {
          const a = e.pts[k], b = e.pts[k + 1], n = Math.max(1, Math.ceil(dhypot(b[0] - a[0], b[1] - a[1]) / STEP));
          for (let q = 0; q < n; q++) S.push({ p: [a[0] + ((b[0] - a[0]) * q) / n, a[1] + ((b[1] - a[1]) * q) / n], own: q === 0 });
        }
        S.push({ p: e.pts[e.pts.length - 1].slice(), own: true });
        S.forEach((s) => { s.in = inside(s.p); });
        if (!S.some((s) => s.in)) continue;
        if (S.every((s) => s.in)) { out.push({ key, e, pts: null }); continue; }
        const pts = [];
        let i = 0;
        while (i < S.length) {
          if (!S[i].in) { if (S[i].own || !pts.length || (S[i + 1] && S[i + 1].in) || (i > 0 && S[i - 1].in)) pts.push(S[i].p); i++; continue; }
          let j = i;
          while (j < S.length && S[j].in) j++;
          if (i === 0 || j === S.length) { i = j; continue; } // un'estremita' sulla montagna: si ferma fuori
          // il giro: sul contorno del pezzo di montagna toccato, da dove la
          // linea entra a dove esce, dalla parte piu' corta
          const c0 = Math.floor(S[i].p[1] / C) * mc.gw + Math.floor(S[i].p[0] / C);
          const ring = traceGrid(mc.grid, mc.gw, mc.gh, C, 0, 0, c0);
          const A = S[i - 1].p, B = S[j].p;
          const near = (p) => { let best = 0, bd = Infinity; ring.forEach((q, k) => { const d = dhypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = k; } }); return best; };
          const ka = near(A), kb = near(B), n = ring.length;
          const fwd = [], back = [];
          for (let k = ka; k !== kb; k = (k + 1) % n) fwd.push(ring[k]);
          for (let k = ka; k !== kb; k = (k - 1 + n) % n) back.push(ring[k]);
          fwd.push(ring[kb]); back.push(ring[kb]);
          const len = (L) => L.reduce((t, q, k) => t + (k ? dhypot(q[0] - L[k - 1][0], q[1] - L[k - 1][1]) : 0), 0);
          pts.push(...(len(fwd) <= len(back) ? fwd : back));
          i = j;
        }
        // (il contorno a celle fa gli scalini: semplificato entro 28 px, meno del
        // margine, e niente punti a meno di 48 px, se no il fiume fa le zeta)
        let clean = simplifyLine(pts, 28).map(([x, y]) => [Math.round(x), Math.round(y)]);
        clean = clean.filter((q, k) => k === 0 || k === clean.length - 1 || dhypot(q[0] - clean[k - 1][0], q[1] - clean[k - 1][1]) >= 48);
        out.push({ key, e, pts: clean.length >= 2 ? clean : null });
      }
    }
    return out;
  }

  // gli alberi della mappa (le voci), per il pennello
  trees() { return this.map.instances.filter((e) => TREES.has(e.object)); }

  // quante posizioni di partenza ci sono ([§9.191] di una parte, o in tutto)
  starts(side = null) { return this.map.instances.filter((e) => isStart(e) && (!side || e.side === side)).length; }

  // [§9.184] dal punto d'origine al centro della maschera (come tools/16:
  // il gemello ha l'ingombro nello stesso posto), per una voce; [0, 0]
  // senza maschera (le macchie)
  maskOffset(e) {
    const o = this.objects[e.object];
    if (!o) return [0, 0];
    const name = o.mask || e.sprite || o.sprite || (o.choices && o.choices[0]), m = name && this.masks[name];
    if (!m) return [0, 0];
    const sx = e.scale_x ?? 1, sy = e.scale_y ?? 1;
    return [((m.bbox[0] + m.bbox[2] + 1) / 2 - m.origin[0]) * sx, ((m.bbox[1] + m.bbox[3] + 1) / 2 - m.origin[1]) * sy];
  }

  // il gemello di una voce (i campi, al posto gemello), o null se la
  // simmetria e' spenta o se cadrebbe su se stessa (al centro o sull'asse).
  // [§9.186] mode: la simmetria dello strumento (non piu' della mappa)
  twinAt(e, mode) {
    const [ox, oy] = this.maskOffset(e);
    const p = mirrorPoint(mode, this.map.width, this.map.height, e.x + ox, e.y + oy);
    if (!p) return null;
    const x = Math.round(p[0] - ox), y = Math.round(p[1] - oy);
    if (Math.abs(x - e.x) <= 1 && Math.abs(y - e.y) <= 1) return null;
    // [§9.191, richiesta dell'autore] la gemella di una voce di uno
    // schieramento e' dell'altro
    return e.side ? { ...e, x, y, side: otherSide(e.side) } : { ...e, x, y };
  }

  // la voce gemella gia' nella mappa (stesso oggetto, entro 2 px), o null
  twinOf(e, mode) {
    const t = this.twinAt(e, mode);
    if (!t) return null;
    return this.map.instances.find((q) => q !== e && q.object === e.object && Math.abs(q.x - t.x) <= 2 && Math.abs(q.y - t.y) <= 2) || null;
  }

  // le voci e le loro gemelle (senza doppioni)
  withTwins(entries, mode) {
    const out = new Set(entries);
    if (mode && mode !== "none") for (const e of entries) { const t = this.twinOf(e, mode); if (t) out.add(t); }
    return [...out];
  }

  // ------------------------------------------------------------- scelta

  // il riquadro di una voce (sprite), o null (senza sprite: le macchie)
  boundsOf(e) {
    const i = this.byEntry.get(e);
    if (!i) return null;
    return tightBounds(this.assets, i.sprite_index, i.x, i.y, i.image_xscale, i.image_yscale, i.image_angle);
  }

  // la voce sotto il punto (x, y) della mappa: la piu' in alto nell'ordine
  // di disegno; gli oggetti senza sprite (le macchie) entro `slack` px dal
  // loro centro
  pick(x, y, slack) {
    const list = this.world.sorted();
    for (let k = list.length - 1; k >= 0; k--) {
      const i = list[k], e = i.src;
      if (!e || SYSTEM.has(e.object)) continue;
      const b = tightBounds(this.assets, i.sprite_index, i.x, i.y, i.image_xscale, i.image_yscale, i.image_angle);
      if (b ? x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] : dhypot(x - i.x, y - i.y) <= slack) return e;
    }
    return null;
  }

  // le voci col punto d'origine dentro il rettangolo
  inBox(x1, y1, x2, y2) {
    const [l, t, r, b] = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    return this.map.instances.filter((e) => !SYSTEM.has(e.object) && this.byEntry.has(e) && e.x >= l && e.x <= r && e.y >= t && e.y <= b);
  }

  // [trascinando] le istanze spostate di (dx, dy) dalla voce, senza toccare la
  // mappa (la modifica vera arriva lasciando il tasto: modify)
  preview(entries, dx, dy) {
    for (const e of entries) {
      const i = this.byEntry.get(e);
      if (!i) continue;
      const o = this.objects[e.object], ny = e.y + dy;
      const ddy = ny - i.y, ddx = e.x + dx - i.x;
      this.world.setPos(i, e.x + dx, ny);
      if (typeof o.depth !== "number") i.depth = -ny + o.depth.y;
      for (const k of i.kids || []) { this.world.setPos(k, k.x + ddx, k.y + ddy); k.depth -= ddy; }
      // [§9.195] le particelle (macchie, spighe del campo) seguono la voce
      for (const ps of [...(i.grass_rows || []), ...(i.crop_rows || [])]) {
        for (const q of ps.parts) { q.x += ddx; q.y += ddy; }
        ps.depth -= ddy;
      }
    }
  }
}
