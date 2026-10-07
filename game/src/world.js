// Il mondo: istanze, eventi nell'ordine di GameMaker, collisioni con le
// maschere originali, ricerche (instance_nearest, place_free, ...).
//
// Non e' un interprete di GML: i comportamenti sono moduli JS scritti a mano
// (units.js, ...), ma girano dentro le stesse regole del runner, perche' il
// codice originale le da' per scontate (STUDIO.md §1.3):
// - eventi per passo: Begin Step, Alarm, mouse, Step, moto (speed/direction),
//   End Step; disegno per depth (piu' alta prima), poi Draw End, poi Draw GUI;
// - instance_create esegue subito il Create; instance_destroy subito il
//   Destroy, l'istanza sparisce a fine passo;
// - un oggetto senza un evento usa quello del parent (nessun
//   event_inherited nel progetto);
// - with(parent), instance_nearest(parent), ... contano anche i figli.
//
// Collisioni: tipo di maschera e bbox da game/assets/masks.json (precise,
// rettangolo, ellisse, rombo; tools/06_masks.py). Le maschere precise sono
// righe di intervalli pieni. Le istanze stanno in una griglia di celle da
// 128 px aggiornata quando si muovono (moved()).

import { Alarms } from "./alarms.js";
import { drawSprite, spriteBounds } from "./sprites.js";
import { lengthdirX, lengthdirY, pointDirection } from "./gm.js";

const CELL = 128;
// [Richiesta dell'autore] passi della dissolvenza fra due sprite (swapSprite)
export const FADE = 30;
// [§6.3 N2] scatole di distanceToInstance, riusate
const DIST_A = [0, 0, 0, 0], DIST_B = [0, 0, 0, 0];
// [§6.3 N3] istanze "seguite" dai certificati di lontananza: alleati,
// nemici, risorse ed elementi naturali (non proiettili, effetti, pulsanti)
const RETRY = 8; // passi fra un tentativo di certificato fallito e il successivo
const TRACKED = ["ally_unit", "ally_build", "enemy_unit", "enemy_build", "natural_parent"];
function isTracked(inst) {
  if (inst._trk === undefined) inst._trk = TRACKED.some((n) => inst.object === n || inst.parents.includes(n));
  return inst._trk;
}
// intervalli di una riga di maschera (overlap, pointIn): coppie inizio/fine
const SPANS_A = new Float64Array(512), SPANS_B = new Float64Array(512);

export class World {
  constructor({ objects, masks, assets, g, roomW, roomH }) {
    this.objects = objects;
    this.masks = masks;
    this.assets = assets;
    this.g = g;
    this.roomW = roomW;
    this.roomH = roomH;
    this.instances = [];
    // Indice per nome di oggetto e di parent: le liste sono in ordine di
    // creazione come this.instances (le ricerche danno gli stessi
    // risultati); le istanze distrutte si tolgono a fine passo.
    this.byName = new Map();
    this.behaviours = {};
    this.nextId = 100001;
    this.grid = new Map();
    this._qstamp = 0; // contrassegno delle ricerche dei vicini (_eachNear)
    // [§6.3 N1] versione del mondo: cresce a ogni spostamento, creazione e
    // distruzione; instance_nearest ricorda l'ultima risposta per nome
    this._ver = 0;
    this._nmemo = new Map();
    // [§6.3 N3] certificati di lontananza (nearWithin): `_travel` somma, passo
    // per passo, il massimo spostamento dei lati della scatola fra le istanze
    // "seguite" (alleati, nemici, risorse); `_epoch` cresce quando ne nasce
    // una e invalida tutti i certificati
    this._travel = 0;
    this._stepMax = 0;
    this._stepNo = 0;
    this._epoch = 0;
    this.mouse = { x: 0, y: 0 };
    this.hooks = {};
    this.particles = null; // particles.js (app.js)
  }

  // Avvio della room [I, runner GMS]: prima esistono TUTTE le istanze della
  // room, poi gira il Create di ciascuna nell'ordine del file, poi Room
  // Start. Il gioco lo da' per scontato: manager e' la prima istanza di
  // match ma nel suo Create scorre with(ally_build) per la griglia dei costi.
  // `beforeCreate` gira dopo l'allocazione e prima dei Create (e' il Create
  // del manager, che qui e' una classe a parte: manager.js, pathing.js).
  loadRoom(list, beforeCreate) {
    const created = list.map(([object, x, y, sx, sy, rot, colour]) =>
      this._alloc(object, x, y, { sx, sy, rot, colour: colour & 0xffffff, alpha: (colour >>> 24) / 255 }));
    if (beforeCreate) beforeCreate();
    for (const i of created) if (i.alive) this.fire(i, "create");
    for (const i of created) if (i.alive) this.fire(i, "roomStart");
  }

  register(name, behaviour) {
    this.behaviours[name] = behaviour;
    this._collMaps = null;
  }

  // Gestore di un evento per l'istanza, risalendo i parent.
  handler(inst, ev) {
    let b = this.behaviours[inst.object];
    if (b && b[ev]) return b[ev];
    for (const p of inst.parents) {
      b = this.behaviours[p];
      if (b && b[ev]) return b[ev];
    }
    return null;
  }

  fire(inst, ev, ...args) {
    const h = this.handler(inst, ev);
    if (h && inst.alive) h(inst, this, ...args);
    return !!h;
  }

  // [Richiesta dell'autore] Cambio di sprite con dissolvenza (FADE passi):
  // le fasi dei cantieri e i danni degli edifici di pietra. `from`: lo
  // sprite da cui si parte (di norma quello attuale; per un edificio appena
  // finito, quello del cantiere che sostituisce).
  swapSprite(inst, spr, from = inst.sprite_index) {
    if (from && from !== spr) { inst.fadeFrom = from; inst.fadeT = FADE; }
    inst.sprite_index = spr;
  }

  // -------------------------------------------------------------- istanze

  // opts.init(inst): valori impostati prima del Create (serve alle
  // correzioni che anticipano un'assegnazione fatta dopo nell'originale).
  create(object, x, y, opts = {}) {
    const inst = this._alloc(object, x, y, opts);
    if (opts.init) { opts.init(inst); this.moved(inst); }
    this.fire(inst, "create");
    return inst;
  }

  _alloc(object, x, y, opts = {}) {
    const o = this.objects[object];
    if (!o) throw new Error("oggetto sconosciuto: " + object);
    let sprite = o.sprite;
    if (o.choices && !opts.noChoice) sprite = o.choices[Math.floor(Math.random() * o.choices.length)];
    const inst = {
      id: this.nextId++, object, parents: o.parents, alive: true,
      x, y, xstart: x, ystart: y, xprevious: x, yprevious: y,
      sprite_index: sprite, mask_index: o.mask, image_index: 0, image_speed: 1,
      image_xscale: opts.sx ?? 1, image_yscale: opts.sy ?? 1, image_angle: opts.rot ?? 0,
      image_blend: opts.colour ?? 0xffffff, image_alpha: opts.alpha ?? 1,
      depth: typeof o.depth === "number" ? o.depth : -y + o.depth.y,
      // [Provvisorio] gli oggetti che si rivelano quando un'unita' li vede
      // (rovine, ...) e il cui comportamento non e' ancora portato sono
      // visibili da subito; quelli portati (risorse) gestiscono da se'.
      visible: o.visible || (!!o.reveal && !this.behaviours[object]), solid: o.solid, persistentDraw: o.draw,
      direction: 0, speed: 0,
      alarm: new Alarms(12),
      cells: null,
    };
    this.instances.push(inst);
    this._ver++;
    if (isTracked(inst)) this._epoch++;
    for (const n of [object, ...o.parents]) {
      let l = this.byName.get(n);
      if (!l) this.byName.set(n, (l = []));
      l.push(inst);
    }
    this.moved(inst);
    return inst;
  }

  _list(name) {
    return this.byName.get(name) || [];
  }

  // room_goto: app.js ricarica la pagina sulla room
  gotoRoom(name) {
    if (this.hooks.roomGoto) this.hooks.roomGoto(name);
  }

  // a fine passo: via le istanze distrutte dalle liste dell'indice
  _compact() {
    for (const [n, l] of this.byName) {
      if (l.some((i) => !i.alive)) this.byName.set(n, l.filter((i) => i.alive));
    }
  }

  destroy(inst) {
    if (!inst.alive) return;
    this.fire(inst, "destroy");
    inst.alive = false;
    this._ver++;
    this._unindex(inst);
  }

  // Dopo un ripristino (snapshot.js): niente risposte ricordate valgono piu'.
  invalidateQueries() {
    this._ver++;
    this._epoch++;
  }

  is(inst, name) {
    return inst.object === name || inst.parents.includes(name);
  }

  *all(name) {
    for (const i of this._list(name)) if (i.alive) yield i;
  }

  number(name) {
    let n = 0;
    for (const i of this._list(name)) if (i.alive) n++;
    return n;
  }

  exists(name) {
    for (const i of this._list(name)) if (i.alive) return true;
    return false;
  }

  // instance_nearest: distanza fra origini [I]
  // [§6.3 N1] la stessa domanda (punto e nome) col mondo fermo (nessuno
  // spostato, creato o distrutto: _ver) ha la stessa risposta: si ricorda
  // l'ultima per nome. Prima l'11-19% delle chiamate era cosi' (p.es. scr_difendi
  // la ripete per ogni difensore).
  nearest(x, y, name) {
    const m = this._nmemo.get(name);
    if (m && m.ver === this._ver && m.x === x && m.y === y) return m.res;
    let best = null, bd = Infinity;
    for (const i of this._list(name)) {
      if (!i.alive) continue;
      const d = (i.x - x) ** 2 + (i.y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (m) { m.ver = this._ver; m.x = x; m.y = y; m.res = best; }
    else this._nmemo.set(name, { ver: this._ver, x, y, res: best });
    return best;
  }

  // [§6.4, richiesta dell'autore] Gli edifici fermano le frecce degli arcieri:
  // edifici alleati (mura, porte e cantieri compresi, non i campi), edifici
  // nemici (non le casse), edifici della citta' (ocr_*) e rovine.
  // [§6.6, decisione dell'autore] anche le montagne e tutte le rovine solide:
  // quelle da cui si estrae la pietra (stone_parent: pietra_grande e
  // pietr_piccolo sono un tempio e un tempietto crollati; rovine di
  // castello, chiesa, torre) e quelle del centro (ccruin). Le unita', i
  // boschi, i fiumi, statue e colonne, le macerie non solide no.
  blocksShots(o) {
    if (!o.alive || !o.solid) return false;
    const n = o.object;
    if (this.is(o, "ally_build")) return n !== "campo" && n !== "campo_fond";
    if (this.is(o, "enemy_build")) return n !== "o_box1" && n !== "o_box2";
    return n.startsWith("ocr_") || n.startsWith("montagna_") || n === "ccruin" || this.is(o, "stone_parent");
  }

  // [§6.5] Chi tira da un edificio non e' fermato dall'edificio stesso ne'
  // da mura e porte.
  ignoredFrom(o, from) {
    return o === from || o.object.startsWith("mura_") || o.object.startsWith("porta_");
  }

  // Linea di tiro libera da (x0, y0) a (x1, y1), i piedi di chi tira e del
  // bersaglio: nessun edificio (blocksShots) con la sagoma a terra sul
  // segmento (campioni ogni 8 px; i primi e gli ultimi 20 px non contano:
  // chi tira o il bersaglio possono stare a ridosso di un muro).
  // `from`: l'edificio da cui si tira (torri, castello, centro: §6.5); non
  // contano lui e le mura e le porte (si tira dall'alto).
  shotClear(x0, y0, x1, y1, from = null) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len <= 40) return true;
    const cands = [];
    this._eachNear([Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)],
                   (o) => { if (this.blocksShots(o) && !(from && this.ignoredFrom(o, from))) cands.push(o); });
    if (!cands.length) return true;
    const n = Math.ceil(len / 8);
    for (let k = 0; k <= n; k++) {
      const d = (len * k) / n;
      if (d < 20 || d > len - 20) continue;
      const px = x0 + (dx * k) / n, py = y0 + (dy * k) / n;
      for (const o of cands) if (this.pointIn(o, px, py)) return false;
    }
    return true;
  }

  // [§6.3 N3] distance_to_object(instance_nearest(i.x, i.y, name)) < r, con
  // lo stesso risultato, ma senza rifare la ricerca quando la risposta e'
  // "no" per certo. Quando e' "no" si guarda quanto sono lontane TUTTE le
  // istanze di `name`: se ognuna e' oltre rmax (il raggio piu' grande che il
  // chiamante potra' chiedere, p.es. di notte) di un margine, la risposta
  // resta "no" finche' gli spostamenti di tutti (_travel) non possono aver
  // consumato il margine. Una scatola cambia al massimo di `d` per lato se
  // si sposta di `d`; due scatole cambiano distanza al massimo di 2*sqrt(2)*d
  // (si usa 3). Niente certificato se l'istanza o una delle candidate ha la
  // scatola che dipende dallo sprite (maschera non fissa: puo' cambiare senza
  // moved()), o se non e' seguita.
  nearWithin(inst, name, r, rmax = r) {
    let cs = inst._far;
    const c = cs && cs[name];
    if (c && c.margin && c.epoch === this._epoch && r <= c.rmax && 3 * (this._travel + this._stepMax - c.travel) < c.margin) return false;
    const o = this.nearest(inst.x, inst.y, name);
    const hit = !!o && this.distanceToInstance(inst, o) < r;
    // dopo un tentativo fallito (qualcuno troppo vicino) si riprova fra
    // RETRY passi: in mezzo vale il calcolo normale, il risultato non cambia
    if (c && c.retry > this._stepNo) return hit;
    let cert = null;
    if (!hit && inst.mask_index && isTracked(inst)) {
      let min = Infinity;
      for (const x of this._list(name)) {
        if (!x.alive) continue;
        if (!x.mask_index || !isTracked(x)) { min = -1; break; }
        const d = this.distanceToInstance(inst, x);
        if (d < min) min = d;
      }
      if (min - rmax > 0) cert = { epoch: this._epoch, travel: this._travel, margin: min - rmax, rmax, retry: 0 };
    }
    if (!cs) cs = inst._far = {};
    cs[name] = cert || { margin: 0, retry: this._stepNo + RETRY };
    return hit;
  }

  // "girati verso il bersaglio quando attacchi" [C, blocco sprite di
  // guerriero/picchiere/cavaliere; tools/08_anim.py]: alleati col versore
  // (il piu' vicino al punto 30 px davanti), nemici col piu' vicino.
  faceAhead(i, name) {
    const r = Math.PI / 180;
    const v = this.nearest(i.x + 30 * Math.cos(i.direction * r), i.y - 30 * Math.sin(i.direction * r), name);
    if (v) i.direction = pointDirection(i.x, i.y, v.x, v.y);
  }

  faceNearest(i, name) {
    const v = this.nearest(i.x, i.y, name);
    if (v) i.direction = pointDirection(i.x, i.y, v.x, v.y);
  }

  // ------------------------------------------------------------ maschere

  maskOf(inst) {
    const name = inst.mask_index || inst.sprite_index;
    return name ? this.masks[name] : null;
  }

  // bbox in coordinate di room, estremi inclusi come in GMS (bbox_right).
  bbox(inst, x = inst.x, y = inst.y) {
    const out = [0, 0, 0, 0];
    return this._bboxInto(inst, x, y, out) ? out : null;
  }

  // [§6.3 N2] lo stesso calcolo scritto in `out`; false senza maschera
  _bboxInto(inst, x, y, out) {
    const m = this.maskOf(inst);
    if (!m) return false;
    const bb = m.bbox, org = m.origin;
    const sx = inst.image_xscale, sy = inst.image_yscale;
    let x0 = x + (bb[0] - org[0]) * sx, x1 = x + (bb[2] + 1 - org[0]) * sx;
    let y0 = y + (bb[1] - org[1]) * sy, y1 = y + (bb[3] + 1 - org[1]) * sy;
    if (x0 > x1) { const t = x0; x0 = x1; x1 = t; }
    if (y0 > y1) { const t = y0; y0 = y1; y1 = t; }
    out[0] = x0; out[1] = y0; out[2] = x1; out[3] = y1;
    return true;
  }

  // Intervalli pieni della maschera di inst (posta in ix, iy) sulla riga y
  // (coordinate di room) dentro [ax, bx): rettangolo, ellisse e rombo
  // inscritti nel bbox, o la maschera precisa del frame. Scritti in `out`
  // come coppie inizio/fine; restituisce quanti numeri ha scritto.
  // [§6.2, ottimizzazione B] prima restituiva array nuovi a ogni riga e
  // overlap copiava l'intera istanza ({...a, x, y}) a ogni chiamata: contro
  // le maschere grandi (montagne, fiumi) un passo di movimento costava ~1 ms.
  _spans(inst, ix, iy, bb, y, ax, bx, out) {
    const m = this.maskOf(inst);
    const x0 = bb[0], y0 = bb[1], x1 = bb[2], y1 = bb[3];
    if (y < y0 || y >= y1) return 0;
    let n = 0;
    if (m.kind === 1 || m.kind === 2 || m.kind === 3) {
      let s = x0, e = x1;
      if (m.kind !== 1) {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
        const ny = Math.abs((y + 0.5 - cy) / ry);
        if (ny > 1) return 0;
        const half = m.kind === 2 ? rx * Math.sqrt(1 - ny * ny) : rx * (1 - ny);
        s = cx - half; e = cx + half;
      }
      const a = s > ax ? s : ax, b = e < bx ? e : bx;
      if (a < b) { out[n++] = a; out[n++] = b; }
      return n;
    }
    // precisa: riga del bbox della maschera in coordinate dello sprite
    const sy = inst.image_yscale, sx = inst.image_xscale;
    const frames = m.frames;
    const f = frames[m.sepmasks ? (Math.floor(inst.image_index) % frames.length) : 0];
    const row = f[Math.floor((y - iy) / sy + m.origin[1]) - m.bbox[1]];
    if (!row) return 0;
    for (let k = 0; k < row.length; k += 2) {
      let s = ix + (row[k] - m.origin[0]) * sx, e = ix + (row[k + 1] - m.origin[0]) * sx;
      if (s > e) { const t = s; s = e; e = t; }
      const a = s > ax ? s : ax, b = e < bx ? e : bx;
      if (a < b) { out[n++] = a; out[n++] = b; }
    }
    return n;
  }

  // Le due maschere si toccano? a e b nelle posizioni (ax, ay), (b.x, b.y).
  overlap(a, ax, ay, b) {
    const ba = this.bbox(a, ax, ay), bb = this.bbox(b);
    if (!ba || !bb) return false;
    const x0 = Math.max(ba[0], bb[0]), x1 = Math.min(ba[2], bb[2]);
    const y0 = Math.max(ba[1], bb[1]), y1 = Math.min(ba[3], bb[3]);
    if (x0 >= x1 || y0 >= y1) return false;
    const ma = this.maskOf(a), mb = this.maskOf(b);
    if (ma.kind === 1 && mb.kind === 1) return true;
    for (let y = Math.floor(y0); y < y1; y++) {
      const na = this._spans(a, ax, ay, ba, y, x0, x1, SPANS_A);
      if (!na) continue;
      const nb = this._spans(b, b.x, b.y, bb, y, x0, x1, SPANS_B);
      for (let i = 0; i < na; i += 2) for (let j = 0; j < nb; j += 2) if (SPANS_A[i] < SPANS_B[j + 1] && SPANS_B[j] < SPANS_A[i + 1]) return true;
    }
    return false;
  }

  pointIn(inst, px, py) {
    const bb = this.bbox(inst);
    if (!bb || px < bb[0] || px >= bb[2] || py < bb[1] || py >= bb[3]) return false;
    const n = this._spans(inst, inst.x, inst.y, bb, Math.floor(py), px, px + 1, SPANS_A);
    for (let i = 0; i < n; i += 2) if (SPANS_A[i] <= px && px < SPANS_A[i + 1]) return true;
    return false;
  }

  // ------------------------------------------------------------- griglia

  _cellsOf(bb) {
    const out = [];
    const cx0 = Math.floor(bb[0] / CELL), cx1 = Math.floor(bb[2] / CELL);
    const cy0 = Math.floor(bb[1] / CELL), cy1 = Math.floor(bb[3] / CELL);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) out.push(cy * 65536 + cx);
    return out;
  }

  _unindex(inst) {
    if (!inst.cells) return;
    for (const k of inst.cells) {
      const s = this.grid.get(k);
      if (s) s.delete(inst);
    }
    inst.cells = null;
  }

  // Da chiamare dopo ogni cambio di x, y, sprite o maschera.
  moved(inst) {
    this._unindex(inst);
    this._ver++;
    if (!inst.alive) return;
    const bb = this.bbox(inst);
    if (!bb) return;
    if (isTracked(inst)) {
      // [§6.3 N3] di quanto si sono spostati i lati della scatola in questo
      // passo (somma delle mosse dell'istanza; il massimo fra le istanze)
      const p = inst._bb;
      if (p) {
        const d = Math.max(Math.abs(bb[0] - p[0]), Math.abs(bb[1] - p[1]), Math.abs(bb[2] - p[2]), Math.abs(bb[3] - p[3]));
        if (inst._tStep !== this._stepNo) { inst._tStep = this._stepNo; inst._tSum = 0; }
        inst._tSum += d;
        if (inst._tSum > this._stepMax) this._stepMax = inst._tSum;
        p[0] = bb[0]; p[1] = bb[1]; p[2] = bb[2]; p[3] = bb[3];
      } else inst._bb = [bb[0], bb[1], bb[2], bb[3]];
    }
    inst.cells = this._cellsOf(bb);
    for (const k of inst.cells) {
      let s = this.grid.get(k);
      if (!s) this.grid.set(k, (s = new Set()));
      s.add(inst);
    }
  }

  // Istanze la cui cella tocca il rettangolo, ognuna una volta, nell'ordine
  // delle celle (riga per riga) e di inserimento in ogni cella.
  // [§6.2, ottimizzazione B] senza Set ne' array nuovi: i doppioni (istanze
  // su piu' celle) si saltano con un contrassegno (_qs). fn(o) restituisce
  // qualcosa per fermarsi; il valore torna a chi chiama. fn non deve
  // spostare ne' creare istanze (chi lo fa usa _nearList).
  _eachNear(bb, fn) {
    const stamp = ++this._qstamp;
    const cx0 = Math.floor(bb[0] / CELL), cx1 = Math.floor(bb[2] / CELL);
    const cy0 = Math.floor(bb[1] / CELL), cy1 = Math.floor(bb[3] / CELL);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const s = this.grid.get(cy * 65536 + cx);
        if (!s) continue;
        for (const o of s) {
          if (o._qs === stamp) continue;
          o._qs = stamp;
          const r = fn(o);
          if (r) return r;
        }
      }
    }
    return null;
  }

  // Le stesse istanze in un array (fotografia: chi le riceve puo' spostare
  // o distruggere istanze mentre le scorre, come con il Set di prima).
  _nearList(bb) {
    const out = [];
    this._eachNear(bb, (o) => { out.push(o); });
    return out;
  }

  setPos(inst, x, y) {
    inst.x = x;
    inst.y = y;
    this.moved(inst);
  }

  // ------------------------------------------------------------ ricerche

  // place_meeting / instance_place: prima istanza di `name` (o qualunque,
  // o solo solide) che la maschera di inst toccherebbe in (x, y).
  instancePlace(inst, x, y, name = null, solidOnly = false) {
    const bb = this.bbox(inst, x, y);
    if (!bb) return null;
    return this._eachNear(bb, (o) => (o !== inst && o.alive && (!solidOnly || o.solid) && (!name || this.is(o, name))
      && this.overlap(inst, x, y, o) ? o : null));
  }

  placeFree(inst, x, y) {
    return !this.instancePlace(inst, x, y, null, true);
  }

  placeEmpty(inst, x, y) {
    return !this.instancePlace(inst, x, y, null, false);
  }

  instancePosition(px, py, name) {
    return this._eachNear([px, py, px, py], (o) => (o.alive && (!name || this.is(o, name)) && this.pointIn(o, px, py) ? o : null));
  }

  positionMeeting(px, py, name) {
    return !!this.instancePosition(px, py, name);
  }

  // collision_rectangle(x1,y1,x2,y2,obj,prec,notme): con prec la maschera
  // vera, altrimenti il bbox; estremi inclusi. `only`: una sola istanza
  // (collision_rectangle(..., id, ...) del codice originale).
  collisionRectangle(x1, y1, x2, y2, name, prec = true, notme = null, only = null) {
    const rect = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    for (const o of only ? [only] : this._nearList(rect)) {
      if (!o.alive || o === notme || (name && !this.is(o, name))) continue;
      const bb = this.bbox(o);
      if (!bb || bb[0] > rect[2] || bb[2] < rect[0] || bb[1] > rect[3] || bb[3] < rect[1]) continue;
      if (!prec) return o;
      for (let y = Math.floor(Math.max(rect[1], bb[1])); y <= Math.min(rect[3], bb[3]); y++) {
        if (this._spans(o, o.x, o.y, bb, y, rect[0], rect[2] + 1, SPANS_A)) return o;
      }
    }
    return null;
  }

  // distance_to_object: distanza fra i bbox (0 se si toccano) dall'istanza
  // di `name` piu' vicina [I].
  distanceToObject(inst, name) {
    const a = this.bbox(inst);
    if (!a) return Infinity;
    let best = Infinity;
    for (const o of this._list(name)) {
      if (o === inst || !o.alive) continue;
      const b = this.bbox(o);
      if (!b) continue;
      const dx = Math.max(0, b[0] - a[2], a[0] - b[2]);
      const dy = Math.max(0, b[1] - a[3], a[1] - b[3]);
      const d = Math.hypot(dx, dy);
      if (d < best) best = d;
    }
    return best;
  }

  distanceToInstance(inst, o) {
    const a = DIST_A, b = DIST_B;
    if (!this._bboxInto(inst, inst.x, inst.y, a) || !o || !this._bboxInto(o, o.x, o.y, b)) return Infinity;
    return Math.hypot(Math.max(0, b[0] - a[2], a[0] - b[2]), Math.max(0, b[1] - a[3], a[1] - b[3]));
  }

  // --------------------------------------------------------------- passo

  step(input, mouseX, mouseY) {
    this.mouse = { x: mouseX, y: mouseY };
    const live = () => this.instances.filter((i) => i.alive);
    for (const i of live()) this.fire(i, "stepBegin");
    for (const i of live()) i.alarm.tick((n) => this.fire(i, "alarm" + n));
    this._keyEvents(input);
    this._mouseEvents(input, mouseX, mouseY);
    // manager e' la prima istanza [C]: il suo Step (pulsanti di costruzione)
    // gira prima di quello delle altre (app.js, hooks.step).
    if (this.hooks.step) this.hooks.step();
    for (const i of live()) {
      i.xprevious = i.x;
      i.yprevious = i.y;
      this.fire(i, "step");
    }
    // moto automatico da speed/direction, applicato dopo Step [I]
    for (const i of live()) {
      if (i.speed) this.setPos(i, i.x + lengthdirX(i.speed, i.direction), i.y + lengthdirY(i.speed, i.direction));
      if (i.fadeT > 0 && --i.fadeT === 0) i.fadeFrom = null;
      if (i.persistentDraw && i.sprite_index) {
        const s = this.assets.sprites[i.sprite_index];
        if (s && s.frames.length > 1) i.image_index = (i.image_index + i.image_speed) % s.frames.length;
      }
    }
    this._collisions();
    for (const i of live()) this.fire(i, "stepEnd");
    this.instances = live();
    this._compact();
    this._travel += this._stepMax;
    this._stepMax = 0;
    this._stepNo++;
  }

  // Eventi di collisione [I, runner GMS]: dopo Step e moto, per ogni istanza
  // con un evento Collision verso un oggetto (o un suo figlio) che la sua
  // maschera tocca. Gestori nel comportamento come collisions: { campo(i, w, other) }.
  // (La regola dei "solidi" che riportano indietro chi si muove non serve
  // ancora: nessuna collisione portata finora coinvolge due solidi.)
  _collisions() {
    for (const i of this.instances) {
      if (!i.alive) continue;
      const map = this._collisionMap(i);
      if (!map) continue;
      for (const [name, fn] of map) {
        const bb = this.bbox(i);
        if (!bb) continue;
        for (const o of this._nearList(bb)) {
          if (!i.alive) break;
          if (o === i || !o.alive || !this.is(o, name)) continue;
          if (this.overlap(i, i.x, i.y, o)) fn(i, this, o);
        }
      }
    }
  }

  // [§6.2, ottimizzazione B] una volta per oggetto (prima: a ogni passo per
  // ogni istanza); si rifa' se cambiano i comportamenti (register)
  _collisionMap(i) {
    if (!this._collMaps) this._collMaps = new Map();
    let out = this._collMaps.get(i.object);
    if (out !== undefined) return out;
    out = [];
    for (const n of [i.object, ...i.parents]) {
      const b = this.behaviours[n];
      if (b && b.collisions) for (const k of Object.keys(b.collisions)) if (!out.some(([x]) => x === k)) out.push([k, b.collisions[k]]);
    }
    out = out.length ? out : null;
    this._collMaps.set(i.object, out);
    return out;
  }

  // mouse_clear(mb_left) [I]: il rilascio non vale piu' per chi viene dopo
  // in questo passo (pulsanti che "consumano" il clic).
  mouseClear(button = 0) {
    this.input.mouseReleased[button] = false;
    this.input.mousePressed[button] = false;
  }

  // Eventi di tastiera: Keyboard (tasto tenuto, ogni passo), KeyPress,
  // KeyRelease; gestori "keyboard27", "keyPress81", "keyRelease46".
  _keyEvents(input) {
    if (!input.down.size && !input.pressed.size && !input.released.size) return;
    for (const i of this.instances) {
      if (!i.alive) continue;
      for (const k of input.down) this.fire(i, "keyboard" + k);
      for (const k of input.pressed) this.fire(i, "keyPress" + k);
      for (const k of input.released) this.fire(i, "keyRelease" + k);
    }
  }

  // Eventi di mouse [I, runner GMS]: per tipo di evento, in ordine di
  // numero, e dentro ogni tipo per istanza nell'ordine di creazione:
  // 4 LeftPressed, 5 RightPressed, 7 LeftReleased, 8 RightReleased (sopra
  // la maschera dell'istanza), 10 MouseEnter, 11 MouseLeave, poi i globali
  // 53 GlobalLeftPressed, 54 GlobalRightPressed, 56 GlobalLeftReleased,
  // 57 GlobalRightReleased. Il gioco ci conta: il "rilascio destro" su un
  // albero imposta woodwork=1 sui civili selezionati PRIMA che il loro
  // GlobalRightReleased decida cosa fare (src/objects/albero, ally_omino).
  _mouseEvents(input, mx, my) {
    const [pL, pR] = input.mousePressed, [rL, rR] = input.mouseReleased;
    const live = this.instances.filter((i) => i.alive);
    const over = new Map();
    const isOver = (i) => {
      if (!over.has(i)) over.set(i, input.inside && this.pointIn(i, mx, my));
      return over.get(i);
    };
    const local = (flag, ev) => {
      if (!flag) return;
      for (const i of live) if (i.alive && this.handler(i, ev) && isOver(i)) this.fire(i, ev);
    };
    local(pL, "leftPressed");
    local(pR, "rightPressed");
    local(rL, "leftReleased");
    local(rR, "rightReleased");
    for (const i of live) {
      if (!i.alive || !(this.handler(i, "mouseEnter") || this.handler(i, "mouseLeave"))) continue;
      const o = isOver(i);
      if (o && !i._mouseOver) this.fire(i, "mouseEnter");
      if (!o && i._mouseOver) this.fire(i, "mouseLeave");
      i._mouseOver = o;
    }
    const global = (flag, ev) => {
      if (!flag) return;
      for (const i of live) if (i.alive) this.fire(i, ev);
    };
    global(pL, "globalLeftPressed");
    global(pR, "globalRightPressed");
    global(rL, "globalLeftReleased");
    // manager e' prima di tutte le unita' nell'ordine delle istanze [C]: il
    // suo GlobalRightReleased (scr_movement_general) gira per primo.
    if (rR && this.hooks.globalRightReleased) this.hooks.globalRightReleased(mx, my);
    global(rR, "globalRightReleased");
    // dopo gli ordini delle unita': le caselle della formazione (§6.1 n.89)
    if (rR && this.hooks.afterRightReleased) this.hooks.afterRightReleased(mx, my);
  }

  // ------------------------------------------------------------- disegno

  // Ordine di disegno: depth piu' alta prima, a pari depth ordine di
  // creazione [I].
  sorted() {
    return this.instances.filter((i) => i.alive).sort((a, b) => b.depth - a.depth || a.id - b.id);
  }

  // `manager`: il Draw End del manager, che non e' un'istanza del mondo
  // (manager.js) e ha depth -1 [C]: gira fra i Draw End delle istanze, prima
  // di quelle con depth <= -1 (a pari depth il manager e' creato per primo).
  // Conta per la nebbia: barre della vita, cerchi di selezione e numeri dei
  // gruppi (Draw End delle unita', depth -y) restano sopra nebbia e notte.
  //
  // I sistemi di particelle (this.particles) si disegnano da soli alla loro
  // depth fra le istanze del Draw; a pari depth dopo le istanze [I].
  draw(r, d, cam, manager = null) {
    const vx0 = cam.x, vy0 = cam.y, vx1 = cam.x + cam.w, vy1 = cam.y + cam.h;
    const list = this.sorted();
    const P = this.particles, systems = P ? P.sorted() : [];
    let drawn = 0, si = 0;
    const skip = this.skipDraw;
    // [Richiesta dell'autore] "drawBelow": a terra, sopra il suolo e sotto
    // tutte le istanze (la linea verso il punto di raccolta degli edifici)
    for (const i of list) if (i.visible) this.fire(i, "drawBelow", d);
    for (const i of list) {
      while (si < systems.length && systems[si].depth > i.depth) P.draw(systems[si++], r, this.assets, cam);
      if (!i.visible || (skip && skip.has(i))) continue; // skip: il suolo cotto (ground.js)
      if (this.fire(i, "draw", d)) continue;
      if (!i.persistentDraw || !i.sprite_index) continue;
      const bb = spriteBounds(this.assets, i.sprite_index, i.x, i.y, i.image_xscale, i.image_yscale);
      const fade = i.fadeT > 0 && i.fadeFrom;
      const out = (b) => !b || b[2] < vx0 || b[0] > vx1 || b[3] < vy0 || b[1] > vy1;
      if (out(bb) && !(fade && !out(spriteBounds(this.assets, i.fadeFrom, i.x, i.y, i.image_xscale, i.image_yscale)))) continue;
      if (fade) {
        // dissolvenza (swapSprite): nella prima meta' il nuovo compare sopra
        // il vecchio, nella seconda il vecchio sparisce sotto il nuovo
        const t = 1 - i.fadeT / FADE, a = i.image_alpha;
        drawSprite(r, this.assets, i.fadeFrom, 0, i.x, i.y, i.image_xscale, i.image_yscale, i.image_angle,
                   i.image_blend, a * Math.min(1, 2 * (1 - t)));
        if (drawSprite(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale,
                       i.image_yscale, i.image_angle, i.image_blend, a * Math.min(1, 2 * t))) drawn++;
        continue;
      }
      if (drawSprite(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale,
                     i.image_yscale, i.image_angle, i.image_blend, i.image_alpha)) drawn++;
    }
    while (si < systems.length) P.draw(systems[si++], r, this.assets, cam);
    let managerDone = !manager;
    for (const i of list) {
      if (!managerDone && i.depth <= -1) { manager(); managerDone = true; }
      if (i.visible) this.fire(i, "drawEnd", d);
    }
    if (!managerDone) manager();
    this.drawn = drawn;
  }

  drawGUI(d) {
    for (const i of this.sorted()) if (i.visible) this.fire(i, "drawGUI", d);
  }

  // Draw GUI End [I]: dopo il Draw GUI di tutte le istanze (i *_blink).
  drawGUIEnd(d) {
    for (const i of this.sorted()) if (i.visible) this.fire(i, "drawGUIEnd", d);
  }
}
