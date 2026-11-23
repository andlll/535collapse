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
import { drawSprite, drawSway, spriteBounds, setSpriteRemap } from "./sprites.js";
import { lengthdirX, lengthdirY, pointDirection } from "./gm.js";
import { dcos, dhypot, dsin, sq } from "./dmath.js"; // §9.152
import { simRandom, vrand } from "./rng.js"; // §9.152
import { unitFam } from "./multiplayer.js"; // §9.155

// [§9.152] le istanze dell'interfaccia (pulsanti, dialoghi, suggerimenti):
// seguono la vista o nascono per chi guarda; id a parte (negativi) e fuori
// dalle ricerche della partita e dall'impronta (snapshot.js)
export const UI_PARENTS = ["clicker_parent", "clicchero", "parent_hint"];
// [§9.154] i nomi sotto cui si trova un'istanza (world.all, number, nearest):
// quella della partita col suo oggetto e tutti i genitori; quella
// dell'interfaccia (o cosmetica) solo col suo oggetto e i genitori
// d'interfaccia (le anteprime delle mura sono figlie di mura_ori e ally_build:
// le ricerche della partita non devono vederle)
export const indexNames = (i) => (i.ui || i.fx ? [i.object, ...i.parents.filter((p) => UI_PARENTS.includes(p))] : [i.object, ...i.parents]);
export const isUiObject = (name, parents = []) => UI_PARENTS.some((p) => parents.includes(p))
  // §9.154: _blink le risorse che mancano; _placer il fantasma di chi costruisce
  // §9.154: mplus_* i "+" alle estremita' delle mura, oodl/oosl/ovbl/oval le
  // anteprime dei prolungamenti
  || /_clicker$|_button$|_blink$|_placer$|^mplus_|^(oodl|oosl|ovbl|oval)$|^dialogo|^hint_|^tooltip/.test(name);

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
    // [§9.152] gli id delle istanze cosmetiche (opts.fx: i mattoni di un
    // crollo, che nascono solo se il crollo e' sullo schermo): negativi e a
    // parte, cosi' non spostano gli id della partita (che decidono i pareggi)
    // fra due giocatori che guardano punti diversi
    this.fxNextId = -1;
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
    this.mp = null; // §9.155: la partita a due (multiplayer.js, app.js)
    this._evInst = null; // §9.163: l'istanza dell'evento in corso (fire)
    this.actions = new Map(); // §9.154: i tipi di comando (action, act)
    this.action("ordine", (w, c) => w.rightOrder(c));
    this.action("canc", (w, c) => w.cancAction(c));
    // [§9.116] se impostato (il menu: app.js), solo le istanze di questi
    // oggetti ricevono gli eventi di mouse e tastiera: le altre (unita',
    // edifici) sono decorative, non si selezionano ne' si evidenziano
    this.inputOnly = null;
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
    // [§9.203] lo stile scelto nell'editor (mappe dell'editor: lo sprite dopo
    // il gruppo, mapfile.js scenarioToRoom), dopo il Create che ne tira uno a
    // caso (il generatore della partita consuma gli stessi numeri): l'evento
    // "restyle" di chi ha altro da sistemare (gli alberi: il tipo), se no lo sprite
    list.forEach((e, k) => {
      const i = created[k], sprite = e[8];
      if (!sprite || !i.alive || this.fire(i, "restyle", sprite)) return;
      i.sprite_index = sprite;
      this.moved(i);
    });
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
    if (h && inst.alive) {
      if (!this.mp) h(inst, this, ...args);
      else {
        // [§9.163] chi riceve l'evento (per _foreignUi)
        const prev = this._evInst;
        this._evInst = inst;
        try { h(inst, this.worldFor(inst), ...args); } finally { this._evInst = prev; }
      }
    }
    return !!h;
  }

  // [§9.163, segnalazione dell'autore: il rosso non vedeva i pulsanti del
  // municipio] Nella partita a due l'interfaccia (pulsanti, lampeggi,
  // fantasmi: le istanze ui) e' di chi guarda. Il codice del giocatore gira
  // in ogni pagina anche per le istanze dell'altra parte (p2_centro nella
  // pagina del rosso, centro in quella del blu), e il suo "non selezionato:
  // via i pulsanti" (centro Step, buildings.js) distruggeva i pulsanti di
  // chi guarda (se il centro dell'altro viene dopo nell'ordine delle
  // istanze, a ogni passo appena creati). Ora un evento di un'istanza
  // dell'altra parte, o un comando dell'altro giocatore, non crea ne'
  // distrugge istanze dell'interfaccia: create restituisce un'istanza gia'
  // morta (chi la usa non se ne accorge; via a fine passo), destroy non fa
  // niente.
  _foreignUi() {
    const mp = this.mp;
    if (!mp) return false;
    const s = mp.actor || (this._evInst ? this.sideOf(this._evInst) : 0);
    return !!s && s !== mp.local;
  }
  // [§9.163] l'istanza e' della parte di chi guarda (o neutra; fuori dalla
  // partita a due sempre): il rettangolo di selezione prende solo le sue
  mine(inst) {
    const s = this.mp ? this.sideOf(inst) : 0;
    return !s || s === this.mp.local;
  }

  // -------------------------------------------- multiplayer (§9.155, fase 3)

  // this.mp (app.js, solo nella partita a due): { twins: i nomi che hanno
  // un gemello, mirror1 e mirror2: gli specchi delle due parti
  // (multiplayer.js), local: la parte di chi guarda, actor: la parte del
  // comando che si sta eseguendo }.
  // la parte di un'istanza: 2 le p2_*, 1 quelle del giocatore, 0 le neutre
  // (risorse, rovine, ...) e quelle dell'interfaccia
  sideOf(inst) {
    if (!this.mp) return 0;
    if (inst.object.startsWith("p2_")) return 2;
    return this.mp.twins.has(inst.object) ? 1 : 0;
  }
  // il mondo con cui un'istanza vede la partita: lo specchio della sua parte;
  // durante un comando le neutre con quello di chi lo da'; fuori, le neutre
  // sempre con la parte 1 (uguale in tutte e due le pagine: risorse, il
  // gestore della schermaglia) e l'interfaccia (o inst null: le funzioni
  // dell'interfaccia di app.js) con quello di chi guarda
  worldFor(inst) {
    const mp = this.mp;
    if (!mp) return this;
    const s = inst ? this.sideOf(inst) : 0;
    if (s) return this.sideWorld(s);
    if (mp.actor) return this.sideWorld(mp.actor);
    return this.sideWorld(!inst || inst.ui || inst.fx ? mp.local : 1);
  }
  // [§9.155] si disegna? Fuori dalla partita a due: visible. Nella partita
  // a due le istanze della parte di chi guarda sempre (se la definizione le
  // vuole visibili: per loro visible e' "la vede l'avversario",
  // multiplayer.js pvpVisibility); le risorse, per chi guarda dal blu, se le
  // ha scoperte il blu (vis2)
  shown(i) {
    const mp = this.mp;
    if (!mp) return i.visible;
    const s = this.sideOf(i);
    if (s && s === mp.local) { const def = this.objects[i.object]; return !!(def && def.visible) || i.visible; }
    if (!s && mp.local === 2 && i.vis2 !== undefined) return i.vis2;
    return i.visible;
  }
  sideWorld(side) {
    const mp = this.mp;
    return !mp ? this : side === 2 ? mp.mirror2 : mp.mirror1;
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
    if (inst.ui && this._foreignUi()) { inst.alive = false; this._unindex(inst); return inst; } // §9.163
    if (opts.init) { opts.init(inst); this.moved(inst); }
    this.fire(inst, "create");
    return inst;
  }

  _alloc(object, x, y, opts = {}) {
    const o = this.objects[object];
    if (!o) throw new Error("oggetto sconosciuto: " + object);
    let sprite = o.sprite;
    const ui = isUiObject(object, o.parents);
    // [§9.154] l'interfaccia e il cosmetico col generatore di chi guarda
    if (o.choices && !opts.noChoice) sprite = o.choices[Math.floor((ui || opts.fx ? vrand() : simRandom()) * o.choices.length)];
    const inst = {
      id: opts.fx || isUiObject(object, o.parents) ? this.fxNextId-- : this.nextId++, object, parents: o.parents, alive: true,
      fx: !!opts.fx, ui: isUiObject(object, o.parents), // §9.152
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
    for (const n of indexNames(inst)) {
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
    if (!inst.alive || (inst.ui && this._foreignUi())) return; // §9.163
    this.fire(inst, "destroy");
    if (this.hooks.destroyed) this.hooks.destroyed(inst); // §9.170 (app.js: il crollo degli edifici)
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

  // [§9.152, §9.154] le ricerche per posizione: senza nome solo le istanze
  // della partita; con un nome quelle che lo sono, ma un'istanza
  // dell'interfaccia solo per il suo nome o un genitore d'interfaccia (come
  // l'indice, indexNames)
  _hits(o, name) {
    if (!name) return !o.ui && !o.fx;
    if (!this.is(o, name)) return false;
    return !(o.ui || o.fx) || o.object === name || UI_PARENTS.includes(name);
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
      const d = sq(i.x - x) + sq(i.y - y);
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
    // [§9.10] e il monastero (corpo, casetta, muro di cinta)
    return n.startsWith("ocr_") || n.startsWith("monastero_") || n.startsWith("montagna_") || n === "ccruin"
      || this.is(o, "stone_parent");
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
    const dx = x1 - x0, dy = y1 - y0, len = dhypot(dx, dy);
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
    const v = this.nearest(i.x + 30 * dcos(i.direction * r), i.y - 30 * dsin(i.direction * r), name);
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
    if (inst.image_angle % 360) {
      // [§9.7] maschera ruotata come lo sprite (drawSprite): la scatola e'
      // quella dei quattro angoli girati attorno all'origine
      const a = -inst.image_angle * Math.PI / 180, c = dcos(a), s = dsin(a);
      const lx0 = x0 - x, lx1 = x1 - x, ly0 = y0 - y, ly1 = y1 - y;
      const ax = lx0 * c, bx = lx1 * c, ay = lx0 * s, by = lx1 * s;
      const cx = -ly0 * s, dx = -ly1 * s, cy = ly0 * c, dy = ly1 * c;
      x0 = x + Math.min(ax, bx) + Math.min(cx, dx); x1 = x + Math.max(ax, bx) + Math.max(cx, dx);
      y0 = y + Math.min(ay, by) + Math.min(cy, dy); y1 = y + Math.max(ay, by) + Math.max(cy, dy);
    }
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
    if (inst.image_angle % 360) return this._spansRot(inst, m, ix, iy, y, ax > x0 ? ax : x0, bx < x1 ? bx : x1, out);
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

  // [§9.7] Riga y di una maschera ruotata (image_angle): GameMaker ruota
  // la maschera con lo sprite [I]. Ogni pixel della riga fra xa e xb si
  // riporta nella maschera non ruotata (rotazione inversa di drawSprite, poi
  // la scala) e si prova il suo centro; i pixel pieni consecutivi fanno un
  // intervallo. Il caso senza rotazione resta quello esatto qui sopra.
  _spansRot(inst, m, ix, iy, y, xa, xb, out) {
    const a = inst.image_angle * Math.PI / 180, c = dcos(a), s = dsin(a);
    const sx = inst.image_xscale, sy = inst.image_yscale;
    const bb = m.bbox, ox = m.origin[0], oy = m.origin[1];
    const px0 = Math.floor(xa), px1 = Math.ceil(xb);
    // centro del primo pixel in coordinate della maschera, e il passo di un pixel
    const dx = px0 + 0.5 - ix, dy = y + 0.5 - iy;
    let u = (dx * c - dy * s) / sx + ox, v = (dx * s + dy * c) / sy + oy;
    const du = c / sx, dv = s / sy;
    const kind = m.kind;
    const cx = (bb[0] + bb[2] + 1) / 2, cy = (bb[1] + bb[3] + 1) / 2;
    const rx = (bb[2] + 1 - bb[0]) / 2, ry = (bb[3] + 1 - bb[1]) / 2;
    const frames = m.frames;
    const f = kind === 1 || kind === 2 || kind === 3 ? null
      : frames[m.sepmasks ? (Math.floor(inst.image_index) % frames.length) : 0];
    let n = 0, start = -1;
    for (let px = px0; px < px1; px++, u += du, v += dv) {
      let full = false;
      if (u >= bb[0] && u < bb[2] + 1 && v >= bb[1] && v < bb[3] + 1) {
        if (kind === 1) full = true;
        else if (kind === 2) { const p = (u - cx) / rx, q = (v - cy) / ry; full = p * p + q * q <= 1; }
        else if (kind === 3) full = Math.abs((u - cx) / rx) + Math.abs((v - cy) / ry) <= 1;
        else {
          const row = f[Math.floor(v) - bb[1]];
          if (row) for (let k = 0; k < row.length; k += 2) if (u >= row[k] && u < row[k + 1]) { full = true; break; }
        }
      }
      if (full && start < 0) start = px;
      else if (!full && start >= 0) {
        out[n++] = start > xa ? start : xa; out[n++] = px < xb ? px : xb; start = -1;
        // spazio finito: il resto della riga, per eccesso, in un intervallo solo
        if (n >= out.length - 2) { start = px; break; }
      }
    }
    if (start >= 0) { out[n++] = start > xa ? start : xa; out[n++] = px1 < xb ? px1 : xb; }
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
    if (ma.kind === 1 && mb.kind === 1 && !(a.image_angle % 360) && !(b.image_angle % 360)) return true;
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
  // [§9.152] senza `name` non conta l'interfaccia (pulsanti che seguono la
  // vista) ne' gli effetti: dipendono da chi guarda (un nemico spostava a caso
  // la meta se ci stava sopra il pulsante degli obiettivi)
  instancePlace(inst, x, y, name = null, solidOnly = false) {
    const bb = this.bbox(inst, x, y);
    if (!bb) return null;
    return this._eachNear(bb, (o) => (o !== inst && o.alive && (!solidOnly || o.solid) && this._hits(o, name)
      && this.overlap(inst, x, y, o) ? o : null));
  }

  // [§9.97] terrainBlocks(inst, x, y): l'acqua dei fiumi a linee (app.js,
  // rivers.js), che non e' un'istanza; null senza fiumi
  placeFree(inst, x, y) {
    return !this.instancePlace(inst, x, y, null, true) && !(this.terrainBlocks && this.terrainBlocks(inst, x, y));
  }

  // place_free che non conta i solidi della famiglia `name` (§8.11: chi va
  // alla sua casella della formazione passa sopra gli alleati)
  placeFreeExcept(inst, x, y, name) {
    const bb = this.bbox(inst, x, y);
    if (!bb) return true;
    if (this.terrainBlocks && this.terrainBlocks(inst, x, y)) return false; // §9.97
    return !this._eachNear(bb, (o) => (o !== inst && o.alive && o.solid && !o.ui && !o.fx && !this.is(o, name)
      && this.overlap(inst, x, y, o) ? o : null));
  }

  // [§8.11] libero per chi va alla sua casella della formazione (vedi sopra)
  placeFreeForSlot(inst, x, y) {
    return inst.formX !== undefined && inst.dirox === inst.formX && inst.diroy === inst.formY
      ? this.placeFreeExcept(inst, x, y, unitFam(inst)) : this.placeFree(inst, x, y); // §9.57, §9.155
  }

  placeEmpty(inst, x, y) {
    return !this.instancePlace(inst, x, y, null, false) && !(this.terrainBlocks && this.terrainBlocks(inst, x, y)); // §9.97
  }

  instancePosition(px, py, name) {
    return this._eachNear([px, py, px, py], (o) => (o.alive && this._hits(o, name) && this.pointIn(o, px, py) ? o : null));
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
      if (!o.alive || o === notme || (o !== only && !this._hits(o, name)) || (only && name && !this.is(o, name))) continue; // §9.152, §9.154
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
      const d = dhypot(dx, dy);
      if (d < best) best = d;
    }
    return best;
  }

  distanceToInstance(inst, o) {
    const a = DIST_A, b = DIST_B;
    if (!this._bboxInto(inst, inst.x, inst.y, a) || !o || !this._bboxInto(o, o.x, o.y, b)) return Infinity;
    return dhypot(Math.max(0, b[0] - a[2], a[0] - b[2]), Math.max(0, b[1] - a[3], a[1] - b[3]));
  }

  // --------------------------------------------------------------- passo

  step(input, mouseX, mouseY) {
    this.mouse = { x: mouseX, y: mouseY };
    const live = () => this.instances.filter((i) => i.alive);
    for (const i of live()) this.fire(i, "stepBegin");
    for (const i of live()) i.alarm.tick((n) => this.fire(i, "alarm" + n));
    // [§9.154] i comandi di questo passo (le azioni dei giocatori): dove
    // nell'originale giravano tastiera e mouse, dopo Begin Step e allarmi (in
    // testa al passo, prima degli allarmi, le unita' si fermavano accanto al
    // nemico senza attaccare: attackorder.mjs)
    if (this.hooks.commands) this.hooks.commands();
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
      for (const [name, fn, hostile] of map) {
        if (hostile && this.mp.truce) continue; // §9.156: la tregua della partita a due
        const bb = this.bbox(i);
        if (!bb) continue;
        for (const o of this._nearList(bb)) {
          if (!i.alive) break;
          if (o === i || !o.alive || !this._hits(o, name)) continue;
          if (this.overlap(i, i.x, i.y, o)) fn(i, this.mp ? this.worldFor(i) : this, o);
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
    // [§9.155] i nomi delle collisioni visti dalla parte dell'istanza (le
    // frecce del giocatore 2 colpiscono il giocatore 1)
    const side = this.sideOf(i), map = side === 2 ? this.mp.m2 : side === 1 ? this.mp.m1 : null;
    for (const n of [i.object, ...i.parents]) {
      const b = this.behaviours[n];
      if (b && b.collisions) {
        for (const k0 of Object.keys(b.collisions)) {
          const k = map && map[k0] !== undefined ? map[k0] : k0;
          // [§9.156] hostile: una collisione col nemico, che la tregua spegne
          if (!out.some(([x]) => x === k)) out.push([k, b.collisions[k0], !!map && (k0 === "enemy" || k0.startsWith("enemy_"))]);
        }
      }
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

  // [§9.155] nella partita a due l'input lo prendono solo le istanze della
  // parte di chi guarda (e le neutre e l'interfaccia); dentro un comando,
  // quelle della parte che lo da'
  _takesInput(i) {
    if (this.mp) { const s = this.sideOf(i); if (s && s !== (this.mp.actor || this.mp.local)) return false; }
    return !this.inputOnly || this.inputOnly.has(i.object);
  }

  // Eventi di tastiera: Keyboard (tasto tenuto, ogni passo), KeyPress,
  // KeyRelease; gestori "keyboard27", "keyPress81", "keyRelease46".
  _keyEvents(input) {
    if (!input.down.size && !input.pressed.size && !input.released.size) return;
    // [§9.154] Canc sulle istanze della partita e' il comando "canc" (le
    // selezionate: cancAction); sulle istanze dell'interfaccia resta com'e'
    const canc = input.pressed.has(46);
    if (canc) this.act("canc", { ids: this.selectedIds() });
    for (const i of this.instances) {
      if (!i.alive || !this._takesInput(i)) continue;
      for (const k of input.down) this.fire(i, "keyboard" + k);
      for (const k of input.pressed) if (k !== 46 || i.ui || i.fx) this.fire(i, "keyPress" + k);
      for (const k of input.released) this.fire(i, "keyRelease" + k);
    }
  }

  // [§9.154] l'azione "canc" ({ ids }): il KeyPress_Delete di sempre sulle
  // istanze `ids` (demoliscono se selezionate: lo sono, per il tempo
  // dell'azione)
  cancAction(c) {
    this.withSelection(c.ids, () => {
      for (const i of this.byIds(c.ids)) if (i.alive && !i.ui && !i.fx && this._takesInput(i)) this.fire(i, "keyPress46");
    });
  }

  // [§9.154] per il tempo di fn i selezionati sono `ids` (le istanze della
  // partita): poi tornano quelli di chi guarda (cambiano solo quelli che fn
  // stessa ha cambiato)
  withSelection(ids, fn) {
    const set = new Set(ids), saved = [];
    for (const i of this.instances) {
      if (!i.alive || i.ui || i.fx || !("selected" in i)) continue;
      const want = set.has(i.id) ? 1 : (i.selected === 1 ? 0 : i.selected);
      saved.push([i, i.selected, want]);
      i.selected = want;
    }
    try { fn(); } finally {
      for (const [i, before, want] of saved) if (i.selected === want) i.selected = before;
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
    const live = this.instances.filter((i) => i.alive && this._takesInput(i));
    const isOver = this._overTest(input.inside, mx, my);
    const local = (flag, ev, list = live) => {
      if (!flag) return;
      for (const i of list) if (i.alive && this.handler(i, ev) && isOver(i)) this.fire(i, ev);
    };
    local(pL, "leftPressed");
    local(pR, "rightPressed");
    local(rL, "leftReleased");
    // [§9.154, multiplayer, fase 2, passo 2] il rilascio destro e' un ORDINE:
    // un comando (chi e' selezionato, il punto, se il puntatore era sul
    // mondo) eseguito all'inizio del passo dopo da rightOrder, che rifa' gli
    // eventi di sempre senza leggere ne' il mouse ne' la selezione di chi
    // guarda. Qui restano solo quelli delle istanze dell'interfaccia.
    if (rR) this.act("ordine", { ids: this.selectedIds(), x: mx, y: my, over: !!input.inside });
    local(rR, "rightReleased", live.filter((i) => i.ui || i.fx));
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
    global(rL, "globalLeftReleased");
  }

  // ------------------------------------------- azioni del giocatore (comandi)

  // [§9.154, multiplayer, fase 2, passo 2] Un'azione del giocatore che cambia
  // la partita (un ordine, un pulsante, un tasto) non la cambia piu' dove
  // nasce, nel gestore d'input: diventa un comando coi dati che bastano
  // (`ids`: le unita' a cui si rivolge, non "le selezionate") e si esegue
  // all'inizio del passo dopo (app.js: hooks.command, commands.js), uguale
  // per chi la da' e per chi la riceve. I tipi: action(tipo, fn(world, c)).
  // Senza la coda dei comandi (prove unitarie) si esegue subito.
  action(kind, fn) { this.actions.set(kind, fn); }
  act(kind, data) {
    if (this.hooks.command) this.hooks.command(kind, data);
    else this.runAction(kind, data);
  }
  runAction(kind, c) {
    const fn = this.actions.get(kind);
    if (!fn) throw new Error("azione sconosciuta: " + kind);
    if (!this.mp) { fn(this, c); return; }
    // [§9.155] l'azione del giocatore c.p (0 o 1): col suo specchio, e chi
    // riceve eventi durante l'azione (risorse, interfaccia) la vede da li'
    const mp = this.mp, prev = mp.actor;
    mp.actor = (c.p ?? 0) + 1;
    try { fn(this.sideWorld(mp.actor), c); } finally { mp.actor = prev; }
  }
  // le istanze della partita selezionate da chi guarda (i loro id)
  selectedIds() {
    return this.instances.filter((i) => i.alive && !i.ui && !i.fx && i.selected === 1).map((i) => i.id);
  }
  // le istanze vive di `ids` (nell'ordine delle istanze), di `name` se dato
  byIds(ids, name = null) {
    const set = new Set(ids);
    return this.instances.filter((i) => i.alive && set.has(i.id) && (!name || this.is(i, name)));
  }

  // chi e' sotto il puntatore in (mx, my)
  // [§9.29] un comportamento puo' dire lui dove e' il puntatore
  // (pointOver: il complesso del monastero, complex.js)
  _overTest(inside, mx, my) {
    const over = new Map();
    return (i) => {
      if (!over.has(i)) {
        const b = this.behaviours[i.object];
        over.set(i, inside && (b && b.pointOver ? b.pointOver(i, this, mx, my) : this.pointIn(i, mx, my)));
      }
      return over.get(i);
    };
  }

  // [§9.154, fase 2, passo 2] L'ordine col clic destro, dai dati del comando
  // `c` ({ ids, x, y, over }): per il tempo dell'ordine i selezionati sono
  // `ids` e il mouse e' (x, y); poi tornano quelli di chi guarda (cambiano
  // solo i selezionati che l'ordine stesso ha cambiato). Gli eventi, come
  // prima e nello stesso ordine: GlobalRightPressed (il centro azzera le
  // destinazioni dei nuovi civili; prima girava alla pressione), il rilascio
  // destro sulle istanze sotto il punto (se il puntatore era sul mondo e non
  // sulla minimappa), scr_movement_general del manager, i GlobalRightReleased
  // delle istanze, la formazione. Le istanze dell'interfaccia ne sono fuori.
  rightOrder(c) {
    this.withSelection(c.ids, () => this._rightOrder(c));
  }
  _rightOrder(c) {
    const mouse = this.mouse;
    this.mouse = { x: c.x, y: c.y };
    try {
      const live = this.instances.filter((i) => i.alive && !i.ui && !i.fx && this._takesInput(i));
      const isOver = this._overTest(c.over, c.x, c.y);
      for (const i of live) if (i.alive) this.fire(i, "globalRightPressed");
      for (const i of live) if (i.alive && this.handler(i, "rightReleased") && isOver(i)) this.fire(i, "rightReleased");
      // manager e' prima di tutte le unita' nell'ordine delle istanze [C]: il
      // suo GlobalRightReleased (scr_movement_general) gira per primo.
      if (this.hooks.globalRightReleased) this.hooks.globalRightReleased(c.x, c.y, this.worldFor(null));
      for (const i of live) if (i.alive) this.fire(i, "globalRightReleased");
      // dopo gli ordini delle unita': le caselle della formazione (§6.1 n.89)
      if (this.hooks.afterRightReleased) this.hooks.afterRightReleased(c.x, c.y, this.worldFor(null));
    } finally {
      this.mouse = mouse;
    }
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
  // shade(x, y): [§9.84] l'ombra delle nuvole nel punto in cui l'istanza tocca
  // terra (ambience.js), su tutto quello che l'istanza disegna
  draw(r, d, cam, manager = null, shade = null) {
    const vx0 = cam.x, vy0 = cam.y, vx1 = cam.x + cam.w, vy1 = cam.y + cam.h;
    const list = this.sorted();
    const P = this.particles, systems = P ? P.sorted() : [];
    let drawn = 0, si = 0;
    const skip = this.skipDraw;
    // [Richiesta dell'autore] "drawBelow": a terra, sopra il suolo e sotto
    // tutte le istanze (la linea verso il punto di raccolta degli edifici)
    // [§9.155] le istanze del giocatore 2 (p2_*) con gli sprite blu
    // (p2sprites.js): la tabella vale mentre si disegna una di loro
    const blue = this.p2Sprites || null;
    const tint = (i) => setSpriteRemap(blue && i.object.startsWith("p2_") ? blue : null);
    const shown = (i) => this.shown(i);
    for (const i of list) if (shown(i)) { tint(i); this.fire(i, "drawBelow", d); }
    for (const i of list) {
      while (si < systems.length && systems[si].depth > i.depth) { setSpriteRemap(null); r.shade = 1; P.draw(systems[si++], r, this.assets, cam); }
      if (!shown(i) || (skip && skip.has(i))) continue; // skip: il suolo cotto (ground.js)
      tint(i);
      r.shade = shade ? shade(i.x, i.y) : 1;
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
      // [§9.105] gli alberi ondeggiano col vento (ambience.js treeSway)
      const sw = this.sway && i.image_angle === 0 ? this.sway(i) : null;
      if (sw !== null ? drawSway(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale, i.image_yscale, sw,
                                 i.image_blend, i.image_alpha)
        : drawSprite(r, this.assets, i.sprite_index, i.image_index, i.x, i.y, i.image_xscale,
                     i.image_yscale, i.image_angle, i.image_blend, i.image_alpha)) drawn++;
    }
    r.shade = 1;
    setSpriteRemap(null);
    while (si < systems.length) P.draw(systems[si++], r, this.assets, cam);
    let managerDone = !manager;
    for (const i of list) {
      if (!managerDone && i.depth <= -1) { setSpriteRemap(null); manager(); managerDone = true; }
      if (shown(i)) { tint(i); this.fire(i, "drawEnd", d); }
    }
    setSpriteRemap(null);
    if (!managerDone) manager();
    this.drawn = drawn;
  }

  // [Segnalazione dell'autore, §9.107] "drawGUITop": i pulsanti evidenziati
  // col puntatore (cerchio pieno e scheda), dopo il Draw GUI di tutti. Con
  // l'interfaccia di vetro il cerchio del pannello e' un passaggio che
  // ridisegna il mondo sfocato: se il pannello veniva dopo il pulsante (la
  // depth dipende da dove sta l'unita' rispetto alla view) lo copriva.
  drawGUI(d) {
    const list = this.sorted();
    for (const i of list) if (i.visible) this.fire(i, "drawGUI", d);
    for (const i of list) if (i.visible) this.fire(i, "drawGUITop", d);
  }

  // Draw GUI End [I]: dopo il Draw GUI di tutte le istanze (i *_blink).
  drawGUIEnd(d) {
    for (const i of this.sorted()) if (i.visible) this.fire(i, "drawGUIEnd", d);
  }
}
