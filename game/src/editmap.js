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
import { DECOR_OBJECTS, decorCreate } from "./effects.js";
import { sliced } from "./scenario.js";
import { riverGeometry, riverJoin, roadGeometry, bridgeGeometry, patchGeometry, BRIDGE_RAILS, PAINTED_BRIDGES } from "./rivers.js";
import { GroundCache, GROUND } from "./ground.js";
import { bgrToRGB } from "./gl.js";
import { dcos, dsin, dhypot } from "./dmath.js";

// Gli oggetti che si inseriscono, per categoria (le schede della tavolozza):
// quelli delle mappe della schermaglia (scenari/sk_*.json) e i loro simili.
// Fiumi, strade e ponti sono della polilinea; i boschi anche del pennello.
const range = (pre, list) => list.map((n) => pre + n);
export const CATALOG = [
  { key: "start", label: "Starting positions", objects: ["centro"] },
  { key: "resources", label: "Resources", objects: ["miniera_oro", "pietra_grande", "pietr_piccolo", "castelloruin", "torreruin", "chiesaruin"] },
  { key: "trees", label: "Trees", objects: ["albero", "albero_fake"] },
  { key: "meadows", label: "Meadows and flowers",
    objects: ["burst_erba1", "burst_grano1", "chiazzaparticellare", "fiori_prato", "fiori_papaveri", "fiori_papaveri_erba",
              "fiori_gialli_erba", "graa11", "graa12", "graa13", "graa14", "graa15", "erba_1", "prato1", "fiorame1", "chiazza01"] },
  { key: "mountains", label: "Mountains", objects: range("montagna_", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) },
  { key: "city", label: "City",
    objects: [...range("ocr_", ["01", "02", "03", "04", "05", "11", "12", "13", "14", "15", "21", "22", "23", "24", "25",
                                "31", "32", "33", "34", "35", "41", "42", "43", "44", "45", "basilica", "teatro", "tempio"]),
              "o_colonna", "o_fontana", "o_statua1", "o_statua2", "o_statua3", "o_statua4"] },
];
// le posizioni di partenza di una mappa da schermaglia (skirmish.js
// skirmishPrepare: due centri, uno per parte)
export const START = "centro", STARTS = 2;
// oggetti della mappa che non si toccano (il gioco ne ha bisogno: lo mette
// l'editor dove manca)
export const SYSTEM = new Set(["manager"]);
// cuociono nel suolo (ground.js): se cambiano, il suolo si rifa'
export const baked = (name) => GROUND.test(name) || PAINTED_BRIDGES.includes(name);

// [§9.181] La variante di un oggetto con piu' sprite (albero: alb1..alb8),
// se la mappa non la dice: dalla posizione, sempre la stessa
export const variantOf = (x, y, n) => (((Math.round(x) * 73856093) ^ (Math.round(y) * 19349663)) >>> 0) % n;

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
    for (const [name, o] of Object.entries(ctx.objects)) if (o.slices) world.register(name, sliced(o));
    for (const [name, rail] of Object.entries(BRIDGE_RAILS)) {
      world.register(name, { create(i, w) { w.create(rail, i.x, i.y, { sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle }); } });
    }
    this.byEntry = new Map();
    this.skipped = new Set();
    for (const e of map.instances) this.spawn(e);
    if (this.skipped.size) console.warn("[editor] oggetti sconosciuti saltati:", [...this.skipped]);
    // fiumi, strade, ponti e macchie (come app.js useRivers)
    const R = [map.width, map.height];
    world.patches = (map.patches || []).map((p) => patchGeometry(p));
    world.rivers = riverJoin(map.rivers || [], (rv) => riverGeometry({ ...rv, room: R }));
    world.roads = (map.roads || []).map((rd) => roadGeometry({ ...rd, room: R }));
    world.bridges = (map.bridges || []).map((b) => bridgeGeometry(b));
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
    const bgs = [map.background, "fiume_acqua", "fiume_sassi", "fiume_carta", ...(map.patches || []).map((p) => p.bg || "city2")];
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
    if (o.choices) i.sprite_index = o.choices.includes(e.sprite) ? e.sprite : o.choices[variantOf(e.x, e.y, o.choices.length)];
    if (o.reveal) i.visible = true;
    w.fire(i, "create");
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
    for (const k of i.kids || []) w.destroy(k);
    w.destroy(i);
    this.byEntry.delete(e);
  }

  instOf(e) { return this.byEntry.get(e) || null; }

  // ------------------------------------------------------------ modifiche

  // I cambi: { e: la voce, from: com'era (null: non c'era), to: come diventa
  // (null: tolta), at: il suo posto nella lista }. L'ordine della lista e'
  // l'ordine di creazione delle istanze in partita.
  _apply(c, back) {
    const want = back ? c.from : c.to, list = this.map.instances, at = list.indexOf(c.e);
    this.despawn(c.e);
    if (!want) { if (at >= 0) list.splice(at, 1); return; }
    for (const k of Object.keys(c.e)) delete c.e[k];
    Object.assign(c.e, want);
    if (at < 0) list.splice(Math.min(c.at, list.length), 0, c.e);
    this.spawn(c.e);
  }

  _after(changes) {
    const w = this.world;
    w.instances = w.instances.filter((i) => i.alive);
    w._compact();
    if (changes.some((c) => baked((c.from || c.to).object) || (c.to && baked(c.to.object)))) this.ground.reset();
    this.version++;
  }

  edit(changes) {
    if (!changes.length) return;
    for (const c of changes) this._apply(c, false);
    this.undoList.push(changes);
    if (this.undoList.length > 200) this.undoList.shift();
    this.redoList.length = 0;
    this._after(changes);
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

  // quante posizioni di partenza ci sono
  starts() { return this.map.instances.filter((e) => e.object === START).length; }

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
    }
  }
}
