// Percorsi: la griglia dei costi e gli script scr_* del flow field
// (src/scripts/). Celle da 32 px (global.grid_size).
//
// [C] manager Create: global.cost_field nasce a 0 e le celle toccate dalla
// maschera (precisa) di edifici alleati, edifici nemici ed elementi
// naturali valgono 1000 (ostacolo). Nota: il primo ciclo di manager Create
// che riempie la griglia con collision_rectangle sulle unita' viene buttato
// via subito dopo (la griglia viene ricreata): conta solo il secondo.
// Le unita' occupano la propria cella (scr_occupy = 1000) quando sono ferme e
// la liberano (scr_free = 1) quando partono.
//
// scr_generate_goal_field: BFS a 4 direzioni dalla destinazione sulle celle
// con costo < 1000. scr_generate_flow_field: per ogni cella, la direzione
// verso la vicina (8 direzioni, in quest'ordine: destra, sinistra, su, giu',
// alto-destra, alto-sinistra, basso-destra, basso-sinistra) con il valore piu'
// basso; a pari valore vince la prima. Stessi algoritmi, stesse direzioni.
//
// [Deviazione, §1.6 n.8] l'originale ricopia la griglia del capo in una
// griglia per ogni unita' (ds_grid_copy); qui le unita' condividono lo stesso
// array, che nessuno modifica dopo averlo generato.

import { pointDirection, lengthdirX, lengthdirY, pointDistance } from "./gm.js";

export const GRID = 32;
const LOOK = 6;        // celle guardate avanti lungo il percorso (steerAt)
const LINE_HALF = 12;  // meta' larghezza predefinita della linea "spessa" (clearLine)
export const SIEGE_CLEAR = 1;  // celle libere attorno al centro di una macchina d'assedio (wideMask)
const SIEGE_RECALC = 15;       // passi fra due ricalcoli del campo di una macchina (siegeMove)
const DX = [1, -1, 0, 0, 1, -1, 1, -1];
const DY = [0, 0, -1, 1, -1, -1, 1, 1];
const DIR = DX.map((dx, i) => pointDirection(0, 0, dx, DY[i]));
// le famiglie degli ostacoli fissi della griglia dei costi [C, manager Create]
const HOLDERS = ["ally_build", "enemy_build", "natural_parent"];

export class Pathing {
  constructor(world, roomW, roomH) {
    this.w = world;
    this.gw = Math.trunc(roomW / GRID);
    this.gh = Math.trunc(roomH / GRID);
    this.cost = new Int32Array(this.gw * this.gh);
    // [Deviazione decisa dall'autore, STUDIO.md §3.8] le porte sono
    // percorribili per il giocatore (cost libero) ma ostacolo per i nemici:
    // contatore di porte per cella, letto solo dai goal field dei nemici.
    this.enemyBlock = new Uint8Array(this.gw * this.gh);
    // [§8.14] gli ostacoli fissi (edifici, elementi
    // naturali, mura: quelli di markInstance), senza le celle occupate dalle
    // unita' ferme; servono al campo "largo" delle macchine d'assedio
    // (wideMask). solidVer cambia a ogni modifica: le maschere si ricalcolano.
    this.solid = new Uint8Array(this.gw * this.gh);
    this.solidVer = 0;
    this._wide = [null, null];
    this._wideVer = [-1, -1];
  }

  // Segna l'ostacolo "solo per i nemici" sulle celle toccate dalla maschera
  // dell'istanza (la stessa regola di markInstance); restituisce le celle,
  // da passare a unblockEnemy quando l'istanza sparisce.
  blockEnemy(inst) {
    const cells = this._cellsOf(inst);
    for (const k of cells) this.enemyBlock[k]++;
    this.solidVer++;
    return cells;
  }

  unblockEnemy(cells) {
    for (const k of cells) if (this.enemyBlock[k] > 0) this.enemyBlock[k]--;
    this.solidVer++;
  }

  // Dopo un caricamento (snapshot.js): gli ostacoli fissi salvati o, nei
  // salvataggi di prima, quelli della griglia dei costi (con le celle delle
  // unita' ferme: al piu' una macchina d'assedio gira attorno a un soldato).
  restoreSolid(solid) {
    if (solid) this.solid.set(solid);
    else for (let k = 0; k < this.cost.length; k++) this.solid[k] = this.cost[k] >= 1000 ? 1 : 0;
    this.solidVer++;
  }

  _cellsOf(inst) {
    const out = [];
    const bb = this.w.bbox(inst);
    if (!bb) return out;
    const gx0 = Math.floor(bb[0] / GRID), gx1 = Math.floor((bb[2] - 1) / GRID);
    const gy0 = Math.floor(bb[1] / GRID), gy1 = Math.floor((bb[3] - 1) / GRID);
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        if (!this.inside(gx, gy)) continue;
        if (this.w.collisionRectangle(gx * GRID, gy * GRID, gx * GRID + GRID, gy * GRID + GRID, null, true, null, inst)) {
          out.push(gy * this.gw + gx);
        }
      }
    }
    return out;
  }

  inside(gx, gy) {
    return gx >= 0 && gx < this.gw && gy >= 0 && gy < this.gh;
  }

  // ds_grid_get fuori dalla griglia: GMS restituisce 0 [I]
  costAt(gx, gy) {
    return this.inside(gx, gy) ? this.cost[gy * this.gw + gx] : 0;
  }

  // manager Create, "Inseriamo gli ostacoli" [C]
  initCost() {
    this.cost.fill(0);
    this.solid.fill(0);
    this.solidVer++;
    for (const fam of HOLDERS) {
      for (const inst of this.w.all(fam)) this.markInstance(inst, 1000);
    }
  }

  // collision_rectangle sulla cella, maschera precisa, solo quell'istanza [C]
  // [§9.29, segnalazione dell'autore] Liberando le celle di un'istanza (un
  // edificio distrutto, la porta che lascia libero il varco) l'originale le
  // liberava tutte, anche quelle che toccano ancora un ostacolo vicino: nel
  // livello 3, abbattuta la porta della cinta, si aprivano le celle delle
  // mura ai suoi lati, e gli arieti (che sul flow field si muovono senza
  // collisioni) passavano attraverso il muro, anche con una caserma
  // costruita al posto della porta. Ora restano chiuse le celle che tocca
  // ancora un altro ostacolo della griglia: chi l'ha segnata (gridMark) e
  // non l'ha liberata. [§9.30] Prima solo le famiglie di initCost: i pali e
  // le statue (props.js), che segnano la griglia da soli, perdevano le loro
  // celle se accanto spariva un edificio, e le unita' ci andavano contro.
  // (Nei salvataggi di prima gridMark manca: lo si deduce dalle famiglie.)
  markInstance(inst, value) {
    const s = value >= 1000 ? 1 : 0;
    for (const k of this._cellsOf(inst)) {
      if (!s && this.cost[k] >= 1000 && this._heldByOther(k, inst)) continue;
      this.cost[k] = value; this.solid[k] = s;
    }
    inst.gridMark = s;
    this.solidVer++;
  }

  _heldByOther(k, inst) {
    const w = this.w, gx = k % this.gw, gy = (k - gx) / this.gw;
    const x0 = gx * GRID, y0 = gy * GRID, x1 = x0 + GRID, y1 = y0 + GRID;
    for (const o of w._nearList([x0, y0, x1, y1])) {
      if (o === inst || !o.alive) continue;
      if (o.gridMark === undefined ? !(o.solid && HOLDERS.some((f) => w.is(o, f))) : o.gridMark !== 1) continue;
      if (w.collisionRectangle(x0, y0, x1, y1, null, true, null, o)) return true;
    }
    return false;
  }

  // [§8.14] Le celle in cui non puo' stare il centro di una
  // macchina d'assedio: un ostacolo fisso (per i nemici anche una porta) a
  // meno di SIEGE_CLEAR celle, anche in diagonale. Le macchine (maschera
  // 111x96 px) passano solo da varchi di almeno 2 * SIEGE_CLEAR + 1 celle,
  // dove un soldato passa da una cella sola. Tenuta finche' gli ostacoli
  // non cambiano.
  wideMask(enemy) {
    const e = enemy ? 1 : 0;
    if (this._wideVer[e] === this.solidVer && this._wide[e]) return this._wide[e];
    const { gw, gh, solid } = this, block = enemy ? this.enemyBlock : null, R = SIEGE_CLEAR;
    const m = this._wide[e] || (this._wide[e] = new Uint8Array(gw * gh));
    m.fill(0);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const k = y * gw + x;
        if (!solid[k] && !(block && block[k])) continue;
        const y1 = Math.min(gh - 1, y + R), x0 = Math.max(0, x - R), x1 = Math.min(gw - 1, x + R);
        for (let yy = Math.max(0, y - R); yy <= y1; yy++) m.fill(1, yy * gw + x0, yy * gw + x1 + 1);
      }
    }
    this._wideVer[e] = this.solidVer;
    return m;
  }

  // [§9.71] Le zone collegate della griglia dei soli ostacoli fissi (per i
  // nemici anche le porte), a 4 vicini come goalField: due celle con la
  // stessa etichetta si raggiungono a piedi, 0 e' una cella chiusa. Tenute
  // finche' gli ostacoli non cambiano.
  regions(enemy) {
    const e = enemy ? 1 : 0;
    this._reg = this._reg || [null, null];
    this._regVer = this._regVer || [-1, -1];
    if (this._regVer[e] === this.solidVer && this._reg[e]) return this._reg[e];
    const { gw, gh, solid } = this, block = enemy ? this.enemyBlock : null, N = gw * gh;
    const lab = this._reg[e] || (this._reg[e] = new Int32Array(N));
    lab.fill(0);
    const q = this._regQ || (this._regQ = new Int32Array(N));
    let id = 0;
    for (let s = 0; s < N; s++) {
      if (lab[s] || solid[s] || (block && block[s])) continue;
      lab[s] = ++id;
      let head = 0, tail = 0;
      q[tail++] = s;
      const open = (n) => { if (!lab[n] && !solid[n] && !(block && block[n])) { lab[n] = id; q[tail++] = n; } };
      while (head < tail) {
        const k = q[head++], x = k % gw;
        if (x + 1 < gw) open(k + 1);
        if (x > 0) open(k - 1);
        if (k >= gw) open(k - gw);
        if (k < N - gw) open(k + gw);
      }
    }
    this._regVer[e] = this.solidVer;
    return lab;
  }

  // [§9.71] Da (x0, y0) si arriva a piedi accanto a (x1, y1)? Una cella
  // chiusa (un'unita' a ridosso di un edificio, un bersaglio sul bordo di un
  // bosco) vale come le sue vicine.
  reachable(x0, y0, x1, y1, enemy = false) {
    const lab = this.regions(enemy), { gw } = this;
    const around = (x, y) => {
      const gx = Math.floor(x / GRID), gy = Math.floor(y / GRID), out = [];
      for (let r = 0; r <= 1 && !out.length; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (!this.inside(gx + dx, gy + dy)) continue;
          const v = lab[(gy + dy) * gw + gx + dx];
          if (v && !out.includes(v)) out.push(v);
        }
      }
      return out;
    };
    const a = around(x0, y0);
    if (!a.length) return true; // dentro un ostacolo: non si sa, come prima
    return around(x1, y1).some((v) => a.includes(v));
  }

  // scr_free / scr_occupy [C]
  free(inst) {
    const gx = Math.floor(inst.x / GRID), gy = Math.floor(inst.y / GRID);
    if (this.inside(gx, gy)) this.cost[gy * this.gw + gx] = 1;
  }

  occupy(inst) {
    const gx = Math.floor(inst.x / GRID), gy = Math.floor(inst.y / GRID);
    if (this.inside(gx, gy)) this.cost[gy * this.gw + gx] = 1000;
  }

  // scr_generate_goal_field [C]: valori BFS, -1 = irraggiungibile.
  // enemy: anche le celle delle porte sono ostacolo (§3.8).
  // [§6.2, ottimizzazione A] stessi valori di prima (stesso ordine dei
  // vicini: destra, sinistra, su, giu'), con indici lineari e una coda
  // riusata invece di due array nuovi a ogni chiamata.
  // wide: il campo delle macchine d'assedio, chiuse anche le celle di
  // wideMask.
  // [§9.23] fixed: solo gli ostacoli fissi (solid), senza le celle delle
  // unita' ferme (i civili verso il loro posto attorno a una risorsa, che
  // passano sopra gli altri: civilians.js)
  goalField(goalX, goalY, enemy = false, wide = false, fixed = false) {
    const block = enemy ? this.enemyBlock : null;
    const wm = wide ? this.wideMask(enemy) : null;
    const { gw, gh } = this;
    const cost = fixed ? this._solidCost() : this.cost;
    const N = gw * gh;
    const f = new Int32Array(N).fill(-1);
    const gx = Math.floor(goalX / GRID), gy = Math.floor(goalY / GRID);
    if (!this.inside(gx, gy)) return f;
    const q = this.queue || (this.queue = new Int32Array(N));
    let head = 0, tail = 0;
    const g = gy * gw + gx;
    const shut = (k) => cost[k] >= 1000 || (block && block[k]) || (wm && wm[k]);
    if (shut(g) && this._seedAround(f, q, g, shut)) tail = this._seeds;
    else { f[g] = 0; q[tail++] = g; }
    while (head < tail) {
      const k = q[head++], v = f[k] + 1, x = k % gw;
      let n;
      if (x + 1 < gw && f[n = k + 1] === -1 && cost[n] < 1000 && !(block && block[n]) && !(wm && wm[n])) { f[n] = v; q[tail++] = n; }
      if (x > 0 && f[n = k - 1] === -1 && cost[n] < 1000 && !(block && block[n]) && !(wm && wm[n])) { f[n] = v; q[tail++] = n; }
      if (k >= gw && f[n = k - gw] === -1 && cost[n] < 1000 && !(block && block[n]) && !(wm && wm[n])) { f[n] = v; q[tail++] = n; }
      if (k < N - gw && f[n = k + gw] === -1 && cost[n] < 1000 && !(block && block[n]) && !(wm && wm[n])) { f[n] = v; q[tail++] = n; }
    }
    return f;
  }

  // [§9.29] Il campo verso un ostacolo fatto di piu' pezzi (complex.js, il
  // monastero del livello 3): la ricerca parte, a valore 0, da tutte le
  // celle libere che toccano una delle sue celle (`cells`). Solo gli
  // ostacoli fissi, come goalField con fixed.
  goalFieldAround(cells) {
    const { gw } = this, N = gw * this.gh, cost = this._solidCost();
    const f = new Int32Array(N).fill(-1);
    const q = this.queue || (this.queue = new Int32Array(N));
    let head = 0, tail = 0;
    const seed = (n) => { if (f[n] === -1 && cost[n] < 1000) { f[n] = 0; q[tail++] = n; } };
    for (const k of cells) {
      const x = k % gw;
      if (x + 1 < gw) seed(k + 1);
      if (x > 0) seed(k - 1);
      if (k >= gw) seed(k - gw);
      if (k < N - gw) seed(k + gw);
    }
    while (head < tail) {
      const k = q[head++], v = f[k] + 1, x = k % gw;
      let n;
      if (x + 1 < gw && f[n = k + 1] === -1 && cost[n] < 1000) { f[n] = v; q[tail++] = n; }
      if (x > 0 && f[n = k - 1] === -1 && cost[n] < 1000) { f[n] = v; q[tail++] = n; }
      if (k >= gw && f[n = k - gw] === -1 && cost[n] < 1000) { f[n] = v; q[tail++] = n; }
      if (k < N - gw && f[n = k + gw] === -1 && cost[n] < 1000) { f[n] = v; q[tail++] = n; }
    }
    return f;
  }

  // la griglia dei soli ostacoli fissi nella forma della griglia dei costi
  // (1000 = chiuso), tenuta finche' gli ostacoli non cambiano
  _solidCost() {
    if (this._solidCostVer === this.solidVer && this._solidCostArr) return this._solidCostArr;
    const a = this._solidCostArr || (this._solidCostArr = new Int32Array(this.gw * this.gh));
    for (let k = 0; k < a.length; k++) a[k] = this.solid[k] ? 1000 : 0;
    this._solidCostVer = this.solidVer;
    return a;
  }

  // La cella raggiunta nel campo (valore != -1) piu' vicina a (gx, gy); a
  // pari distanza quella col valore piu' basso. null se il campo e' vuoto.
  nearestReached(field, gx, gy) {
    const { gw } = this;
    let best = null, bd = Infinity, bv = Infinity;
    for (let k = 0; k < field.length; k++) {
      const v = field[k];
      if (v === -1) continue;
      const x = k % gw, y = (k - x) / gw, d = (x - gx) ** 2 + (y - gy) ** 2;
      if (d < bd || (d === bd && v < bv)) { bd = d; bv = v; best = [x, y]; }
    }
    return best;
  }

  // [§7.17] Meta dentro un ostacolo (una rovina nata dopo che il civile
  // aveva calcolato il suo campo, un edificio): la ricerca partiva da li' e
  // non usciva dal blocco di celle chiuse, il campo restava vuoto e chi lo
  // seguiva non si muoveva. Qui si percorre il blocco (4 direzioni, al piu'
  // BLOB celle) e la ricerca parte, a valore 1, dalle celle libere che lo
  // toccano vicino alla meta: si arriva accanto alla meta. false (come
  // prima) se il blocco e' troppo grande o non tocca celle libere.
  _seedAround(f, q, g, shut) {
    const { gw, gh } = this, N = gw * gh, BLOB = 4096;
    const seen = this._blobSeen && this._blobSeen.length === N ? this._blobSeen : (this._blobSeen = new Uint8Array(N));
    const stack = [g], blob = [];
    seen[g] = 1;
    let tail = 0;
    while (stack.length) {
      const k = stack.pop();
      blob.push(k);
      if (blob.length > BLOB) break;
      const x = k % gw, y = (k - x) / gw;
      const nb = [x + 1 < gw ? k + 1 : -1, x > 0 ? k - 1 : -1, y > 0 ? k - gw : -1, y + 1 < gh ? k + gw : -1];
      for (const n of nb) {
        if (n < 0 || seen[n]) continue;
        if (shut(n)) { seen[n] = 1; stack.push(n); }
        else if (f[n] === -1) { f[n] = 1; q[tail++] = n; }
      }
    }
    for (const k of blob) seen[k] = 0;
    for (const k of stack) seen[k] = 0;
    if (blob.length > BLOB || !tail) {
      for (let k = 0; k < tail; k++) f[q[k]] = -1;
      return false;
    }
    // solo le celle del bordo vicine alla meta (al piu' una cella piu'
    // lontane della piu' vicina): il blocco puo' comprendere edifici
    // accanto, e il loro bordo non porta alla meta
    const gx = g % gw, gy = (g - gx) / gw;
    const dist = (k) => { const x = k % gw; return Math.max(Math.abs(x - gx), Math.abs((k - x) / gw - gy)); };
    let dmin = Infinity;
    for (let k = 0; k < tail; k++) dmin = Math.min(dmin, dist(q[k]));
    let n = 0;
    for (let k = 0; k < tail; k++) {
      if (dist(q[k]) <= dmin + 1) q[n++] = q[k];
      else f[q[k]] = -1;
    }
    this._seeds = n;
    return true;
  }

  // scr_generate_flow_field [C]: per ogni cella la direzione verso la vicina
  // (8 direzioni) col valore piu' basso; -1 = nessuna direzione.
  // [§6.2, ottimizzazione A] il flow field non si calcola piu' per tutte le
  // celle: e' il goal field stesso, e la direzione di una cella si ricava
  // quando serve (flowAt), con la stessa regola. Prima erano 47.000 celle
  // calcolate per leggerne poche decine. I salvataggi vecchi hanno flow
  // field di angoli (Float32Array): flowAt li legge come prima.
  flowField(goal) {
    return goal;
  }

  // Direzione del flow field nella cella (gx, gy): angolo in gradi o -1;
  // fuori dalla griglia 0, come ds_grid_get [I].
  flowAt(field, gx, gy) {
    if (!this.inside(gx, gy)) return 0;
    const { gw, gh } = this;
    const k = gy * gw + gx;
    if (!(field instanceof Int32Array)) return field[k]; // salvataggi vecchi
    const c = field[k];
    if (c === -1) return -1;
    let best = c, bi = -1;
    for (let i = 0; i < 8; i++) {
      const nx = gx + DX[i], ny = gy + DY[i];
      if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue;
      const v = field[k + DY[i] * gw + DX[i]];
      if (v === -1 || v >= best) continue;
      // [§6.2 C, decisione dell'autore] una diagonale solo se le due celle
      // di lato sono percorribili: prima la direzione poteva passare fra due
      // ostacoli e l'unita' (che sul flow field si muove senza collisioni)
      // tagliava lo spigolo degli edifici
      if (i >= 4 && (field[k + DX[i]] === -1 || field[k + DY[i] * gw] === -1)) continue;
      best = v; bi = i;
    }
    return bi >= 0 ? DIR[bi] : -1;
  }

  // [§6.2 D, decisione dell'autore] Percorsi naturali. Il BFS conta i passi
  // "a croce" e il flow field ne sceglie 8: la diagonale vince sempre, e
  // l'unita' andava a 45 gradi finche' non era allineata e poi dritta (a
  // "L storta"), a scatti di 45 gradi. Qui da (x, y) si seguono le
  // direzioni del campo per LOOK celle e si sceglie come punto di passaggio
  // il centro della cella piu' lontana raggiungibile in linea retta senza
  // toccare celle non percorribili (linea "spessa", larga quanto l'unita':
  // clearLine). null se non ce n'e' (si usa la direzione della cella).
  steerPoint(field, x, y, hw = LINE_HALF, hh = LINE_HALF) {
    const { gw } = this;
    let gx = Math.floor(x / GRID), gy = Math.floor(y / GRID);
    if (!(field instanceof Int32Array) || !this.inside(gx, gy)) return null;
    const path = this._path || (this._path = new Int32Array(LOOK * 2));
    let n = 0;
    for (let s = 0; s < LOOK; s++) {
      const d = this.flowAt(field, gx, gy);
      if (d === -1) break;
      const i = DIR.indexOf(d);
      gx += DX[i]; gy += DY[i];
      if (!this.inside(gx, gy) || field[gy * gw + gx] === -1) break;
      path[n++] = gx; path[n++] = gy;
    }
    for (let j = n - 2; j >= 2; j -= 2) {
      const tx = path[j] * GRID + GRID / 2, ty = path[j + 1] * GRID + GRID / 2;
      if (this.clearLine(field, x, y, tx, ty, hw, hh)) return [tx, ty];
    }
    return null;
  }

  // La direzione da (x, y) verso il punto di passaggio, o quella della cella
  // (-1 se il campo non ha direzione qui). Senza memoria: per i test; le
  // unita' usano moveFlowField, che il punto lo tiene finche' non ci arriva.
  steerAt(field, x, y) {
    const first = this.flowAt(field, Math.floor(x / GRID), Math.floor(y / GRID));
    if (first === -1) return -1;
    const pt = this.steerPoint(field, x, y);
    return pt ? pointDirection(x, y, pt[0], pt[1]) : first;
  }

  // Linea da (x0, y0) a (x1, y1) tutta su celle percorribili nel campo,
  // larga quanto l'unita': hw, hh sono le meta' della sua maschera (bbox)
  // e la larghezza di lato e' la maschera proiettata sulla perpendicolare
  // alla linea. Campioni ogni 8 px lungo la linea e ogni 16 px di lato.
  clearLine(field, x0, y0, x1, y1, hw = LINE_HALF, hh = LINE_HALF) {
    return this._clear((k) => field[k] === -1, x0, y0, x1, y1, hw, hh);
  }

  // [§9.20] La stessa linea contro i soli ostacoli fissi (edifici, alberi,
  // acqua: solid), senza le celle delle unita' ferme (occupy)
  clearSolid(x0, y0, x1, y1, hw = LINE_HALF, hh = LINE_HALF) {
    const { solid } = this;
    return this._clear((k) => solid[k] === 1, x0, y0, x1, y1, hw, hh);
  }

  _clear(blocked, x0, y0, x1, y1, hw, hh) {
    const { gw } = this;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len < 1) return true;
    const nx = -dy / len, ny = dx / len;
    const half = hw * Math.abs(nx) + hh * Math.abs(ny);
    const lanes = Math.max(1, Math.ceil(half / 16));
    const steps = Math.ceil(len / 8);
    for (let k = 1; k <= steps; k++) {
      const t = k / steps, px = x0 + dx * t, py = y0 + dy * t;
      for (let l = -lanes; l <= lanes; l++) {
        const o = (half * l) / lanes;
        const cx = Math.floor((px + nx * o) / GRID), cy = Math.floor((py + ny * o) / GRID);
        if (!this.inside(cx, cy) || blocked(cy * gw + cx)) return false;
      }
    }
    return true;
  }

  // [§7.6] La cella con un valore nel campo (raggiungibile) piu' vicina a
  // (gx, gy), per anelli fino a `rad`; a pari anello la piu' vicina e, a
  // pari distanza, quella col valore piu' basso. null se non c'e'.
  escapeCell(field, gx, gy, rad) {
    for (let r = 1; r <= rad; r++) {
      let best = null, bd = Infinity, bv = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = gx + dx, ty = gy + dy;
          if (!this.inside(tx, ty)) continue;
          const v = field[ty * this.gw + tx];
          if (v === -1) continue;
          const d = dx * dx + dy * dy;
          if (d < bd || (d === bd && v < bv)) { bd = d; bv = v; best = [tx, ty]; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  fieldAt(field, gx, gy) {
    return this.inside(gx, gy) ? field[gy * this.gw + gx] : 0;
  }

  // scr_find_valid_cell_backwards(goal_x, goal_y, start_x, start_y) [C]:
  // se la cella d'arrivo e' raggiungibile nel goal field CORRENTE
  // dell'unita' la si usa, altrimenti si cerca in quadrati crescenti fino a
  // raggio 9; se non si trova, la cella di partenza. Restituisce [cx, cy, trovata].
  findValidCellBackwards(goal, gx, gy, sx, sy) {
    if (this.fieldAt(goal, gx, gy) !== -1) return [gx, gy, true];
    for (let range = 1; range < 10; range++) {
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          const tx = gx + dx, ty = gy + dy;
          if (this.inside(tx, ty) && goal[ty * this.gw + tx] !== -1) return [tx, ty, true];
        }
      }
    }
    return [sx, sy, false];
  }

  // [§6.1 n.89] La cella libera piu' vicina a (gx, gy): raggiungibile nel
  // goal field, non occupata (costo < 1000) e non in `used`; anelli fino a
  // raggio 9, poi come findValidCellBackwards. Serve al ricalcolo quando la
  // cella d'arrivo diventa un ostacolo (un'altra unita' ci si e' fermata):
  // findValidCellBackwards restituiva di nuovo la stessa cella, raggiungibile
  // ma occupata, e il campo si ricalcolava a ogni passo. E alle caselle
  // della formazione (units.js, formation).
  nearestFreeCell(goal, gx, gy, sx, sy, used = null) {
    for (let range = 0; range < 10; range++) {
      let best = null, bd = Infinity;
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== range) continue;
          const tx = gx + dx, ty = gy + dy;
          if (!this.inside(tx, ty)) continue;
          const k = ty * this.gw + tx;
          if (goal[k] === -1 || this.cost[k] >= 1000 || (used && used.has(k))) continue;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = [tx, ty]; }
        }
      }
      if (best) return [best[0], best[1], true];
    }
    return this.findValidCellBackwards(goal, gx, gy, sx, sy);
  }

  // scr_find_free_spawn_right [C]: se la cella e' occupata, spirale fino a
  // 500 tentativi verso la prima cella libera.
  findFreeSpawn(inst) {
    let gx = Math.floor(inst.x / GRID), gy = Math.floor(inst.y / GRID);
    if (this.inside(gx, gy) && this.cost[gy * this.gw + gx] < 1000) return;
    let stepLen = 1, dir = 0, done = 0, changes = 0;
    for (let attempts = 0; attempts < 500; attempts++) {
      if (dir === 0) gx++; else if (dir === 1) gy++; else if (dir === 2) gx--; else gy--;
      done++;
      if (this.inside(gx, gy) && this.cost[gy * this.gw + gx] < 1000) {
        this.w.setPos(inst, gx * GRID, gy * GRID);
        return;
      }
      if (done >= stepLen) {
        done = 0;
        dir = (dir + 1) % 4;
        changes++;
        if (changes % 2 === 0) stepLen++;
      }
    }
  }
}

// --------------------------------------------------------------- unita'
// Gli script che lavorano su un'istanza (variabili goal_field, flow_field,
// goal_x/goal_y, dirox/diroy).

// scr_generate_goal_field + scr_generate_flow_field per l'istanza
export function generateFields(p, inst, gx, gy) {
  inst.goal_field = p.goalField(gx, gy, (inst.parents || []).includes("enemy_unit"));
  inst.flow_field = p.flowField(inst.goal_field);
}

// scr_move / scr_move_general [C]
export function scrMove(p, inst, tx, ty) {
  p.free(inst);
  // floor(argument0 div 32): div tronca verso lo zero
  const [cx, cy] = p.findValidCellBackwards(inst.goal_field, Math.trunc(tx / GRID), Math.trunc(ty / GRID),
                                            Math.trunc(inst.x / GRID), Math.trunc(inst.y / GRID));
  const found = p.fieldAt(inst.goal_field, cx, cy) !== -1;
  inst.goal_x = found ? cx * GRID : inst.x;
  inst.goal_y = found ? cy * GRID : inst.y;
  generateFields(p, inst, inst.goal_x, inst.goal_y);
  inst.dirox = inst.goal_x;
  inst.diroy = inst.goal_y;
}

// scr_move_flow_field [C]: direzione dalla cella (se valida), avanzamento
// di autospeed SENZA controllo di collisione.
// [§6.2 D] la direzione e' quella verso un punto di passaggio lungo il
// percorso (steerPoint), non piu' quella a scatti di 45 gradi della cella.
// Il punto si tiene (steerAim, per il campo steerField) finche' non lo si
// raggiunge (24 px) o non lo si vede piu': scegliendolo a ogni passo
// saltava di una cella avanti e indietro e lo sprite tremolava fra due
// direzioni.
export function moveFlowField(w, p, inst) {
  const field = inst.flow_field;
  const gx = Math.floor(inst.x / GRID), gy = Math.floor(inst.y / GRID);
  let a = p.flowAt(field, gx, gy);
  // [§7.6, segnalazione dell'autore] Cella senza direzione: l'unita' e'
  // su un ostacolo (il costruttore sopra il magazzino appena finito, le cui
  // celle diventano ostacolo) o in una zona da cui la meta non si
  // raggiunge (un nemico chiuso dalle porte del giocatore). L'originale
  // teneva l'ultima direzione e, senza collisioni, l'unita' tirava dritto
  // attraverso gli edifici, fino a uscire dalla mappa. Qui va verso la cella
  // raggiungibile piu' vicina (entro 6 celle); se non ce n'e', resta ferma.
  // [§7.17] Se invece la cella ha un valore ma nessuna vicina piu' bassa
  // (si e' gia' nel punto del campo piu' vicino alla meta), verso la
  // destinazione con mp_potential_step, cioe' con le collisioni; ma se si
  // e' sovrapposti a un'altra unita' (con le collisioni nessuna delle due si
  // muoverebbe) ci si separa senza collisioni, verso la destinazione se il
  // passo non entra in una cella chiusa, se no lontano dall'altra unita'.
  let len = inst.autospeed;
  if (a === -1 && field instanceof Int32Array) {
    if (p.inside(gx, gy) && field[gy * p.gw + gx] !== -1) {
      const o = w.instancePlace(inst, inst.x, inst.y, null, true);
      if (!o) { mpPotentialStep(w, inst, inst.dirox, inst.diroy, inst.autospeed); return; }
      a = pointDirection(inst.x, inst.y, inst.dirox, inst.diroy);
      const nx = Math.floor((inst.x + lengthdirX(GRID / 2, a)) / GRID), ny = Math.floor((inst.y + lengthdirY(GRID / 2, a)) / GRID);
      if (!p.inside(nx, ny) || field[ny * p.gw + nx] === -1) a = pointDirection(o.x, o.y, inst.x, inst.y);
      // [§9.20] verso la destinazione non oltre: col passo intero la
      // superava, tornava indietro al passo dopo e cosi' via (una macchina
      // d'assedio sulla sua casella, sovrapposta a un soldato fermo)
      else len = Math.min(len, pointDistance(inst.x, inst.y, inst.dirox, inst.diroy));
    } else {
      const out = p.escapeCell(field, gx, gy, 6);
      if (!out) return;
      a = pointDirection(inst.x, inst.y, out[0] * GRID + GRID / 2, out[1] * GRID + GRID / 2);
    }
  } else if (a !== -1 && field instanceof Int32Array) {
    let aim = inst.steerField === field ? inst.steerAim : null;
    if (!aim || pointDistance(inst.x, inst.y, aim[0], aim[1]) < 24 || !p.clearLine(field, inst.x, inst.y, aim[0], aim[1])) {
      aim = p.steerPoint(field, inst.x, inst.y);
      inst.steerField = field;
      inst.steerAim = aim;
    }
    if (aim) a = pointDirection(inst.x, inst.y, aim[0], aim[1]);
  }
  if (a !== -1) inst.target_angle = a;
  // direction in GMS si riporta sempre fra 0 e 360 [I]
  if (inst.target_angle !== undefined) inst.direction = ((inst.target_angle % 360) + 360) % 360;
  if (len < inst.autospeed) w.setPos(inst, inst.dirox, inst.diroy); // l'ultimo pezzo: esatto
  else w.setPos(inst, inst.x + lengthdirX(inst.autospeed, inst.direction), inst.y + lengthdirY(inst.autospeed, inst.direction));
}

// [Segnalazione dell'autore, §8.14] Le macchine d'assedio col flow field.
// Prima andavano solo con mp_potential_step verso dirox/diroy [C] e con un
// edificio, un bosco o un fiume in mezzo si incastravano contro l'ostacolo.
// Ora come la fanteria: lontano (oltre 400 px) o senza vista sulla meta il
// flow field, vicino e in vista mp_potential_step. Il campo e' "largo"
// (goalField con wide, wideMask): ingombranti, non passano dai varchi stretti
// in cui passa un soldato. E' della macchina (siegeField) e si ricalcola
// quando la meta cambia cella: subito se si sposta di piu' di 3 celle (un
// ordine nuovo), se no al piu' ogni SIEGE_RECALC passi (i nemici spostano a
// caso la meta quando e' occupata, l'ariete alleato la arretra di 50 px).
// Se da dove e' la meta non si raggiunge (un varco troppo stretto, un'altra
// riva) il campo porta alla cella raggiungibile piu' vicina alla meta e li'
// la macchina arriva (dirox, diroy = x, y), invece di spingere contro
// l'ostacolo.
export function siegeMove(w, p, i) {
  const enemy = (i.parents || []).includes("enemy_unit");
  const gx = Math.floor(i.dirox / GRID), gy = Math.floor(i.diroy / GRID);
  const goal = p.inside(gx, gy) ? gy * p.gw + gx : -1;
  if (goal !== i.siegeGoal) {
    const old = i.siegeGoal ?? -1, ox = old % p.gw, oy = (old - ox) / p.gw;
    const jump = old < 0 || goal < 0 || Math.max(Math.abs(gx - ox), Math.abs(gy - oy)) > 3;
    if (jump || !i.siegeField || (i.siegeAt || 0) <= w._stepNo) {
      i.siegeGoal = goal;
      i.siegeAt = w._stepNo + SIEGE_RECALC;
      i.siegeEnd = false;
      let f = goal < 0 ? null : p.goalField(i.dirox, i.diroy, enemy, true);
      const sx = Math.floor(i.x / GRID), sy = Math.floor(i.y / GRID);
      if (f && p.fieldAt(f, sx, sy) === -1 && !p.escapeCell(f, sx, sy, 2)) {
        const c = p.nearestReached(p.goalField(i.x, i.y, enemy, true), gx, gy);
        f = c ? p.goalField(c[0] * GRID + GRID / 2, c[1] * GRID + GRID / 2, enemy, true) : null;
        i.siegeEnd = !!c;
      }
      i.siegeField = f;
    }
  }
  const f = i.siegeField;
  const sx = Math.floor(i.x / GRID), sy = Math.floor(i.y / GRID), v = f ? p.fieldAt(f, sx, sy) : -1;
  if (i.siegeEnd && (v === 0 || (v !== -1 && p.flowAt(f, sx, sy) === -1))) { i.dirox = i.x; i.diroy = i.y; return; }
  // vicino (400 px) e libero, con collisioni: se la meta e' in vista, se la
  // macchina e' in fondo al campo o se e' nella fascia attorno a un ostacolo
  // (la meta e' un edificio da colpire: col campo andava avanti e indietro
  // fra la fascia e la sua cella piu' vicina). Sovrapposta a un albero o a un
  // edificio (il campo non ha collisioni) mp_potential_step non la muoveva
  // piu': si va col campo finche' non si stacca.
  const near = pointDistance(i.x, i.y, i.dirox, i.diroy) <= 400 && w.placeFree(i, i.x, i.y)
    && (v === -1 || p.flowAt(f, sx, sy) === -1 || p.clearLine(f, i.x, i.y, i.dirox, i.diroy));
  if (!f || near) {
    mpPotentialStep(w, i, i.dirox, i.diroy, i.autospeed);
    return;
  }
  i.flow_field = f;
  moveFlowField(w, p, i);
}

// [§7.10, segnalazione dell'autore] Un posto per un'unita' appena prodotta
// vicino alla bandiera (ax, ay): il centro di una cella da 64 px (a spirale
// a partire da quella della bandiera) percorribile, dove la sua maschera non
// tocca altri solidi e che nessun'altra unita' appena prodotta (creation 1)
// ha gia' come meta (entro 48 px). null se non ce n'e' entro 400 tentativi.
// Prima due unita' prodotte di seguito ricevevano lo stesso posto (la
// spirale guardava solo le celle di chi e' gia' fermo) e la seconda,
// trovatolo occupato, spostava la meta a caso di 32-50 px a ogni passo.
// [§9.30, segnalazione dell'autore] E raggiungibile dall'unita' fra gli
// ostacoli fissi (verso il posto si passa sopra gli alleati: rallyGo):
// prima il posto poteva essere oltre la riva del fiume, in un bosco chiuso,
// dietro un edificio senza passaggio, e l'unita' ci si incastrava.
export function rallySpot(w, p, inst, ax, ay) {
  const reach = p.goalField(inst.x, inst.y, false, false, true);
  const taken = [];
  for (const u of w.all("ally_unit")) {
    if (u === inst || u.creation !== 1) continue;
    if (u.flaggox !== null && u.flaggox !== undefined) taken.push([u.flaggox, u.flaggoy]);
    if (u.action === 1) taken.push([u.dirox, u.diroy]);
  }
  const cs = 64;
  // [§9.30] i posti gia' promessi a meno della misura della maschera (era
  // 48 px: i cavalieri, larghi 91, si sovrapponevano ai vicini)
  const bb = w.bbox(inst), mw = Math.max(48, bb ? bb[2] - bb[0] : 0), mh = Math.max(48, bb ? bb[3] - bb[1] : 0);
  let gx = Math.floor(ax / cs), gy = Math.floor(ay / cs);
  let stepLen = 1, dir = 0, done = 0, changes = 0;
  for (let attempts = 0; attempts < 400; attempts++) {
    const fx = gx * cs + cs / 2, fy = gy * cs + cs / 2;
    const cx = Math.floor(fx / GRID), cy = Math.floor(fy / GRID);
    if (p.inside(cx, cy) && p.cost[cy * p.gw + cx] < 1000 && reach[cy * p.gw + cx] !== -1 && w.placeFree(inst, fx, fy)
        && !taken.some(([tx, ty]) => Math.abs(tx - fx) < mw && Math.abs(ty - fy) < mh)) return [fx, fy];
    if (dir === 0) gx++; else if (dir === 1) gy++; else if (dir === 2) gx--; else gy--;
    done++;
    if (done >= stepLen) {
      done = 0;
      dir = (dir + 1) % 4;
      changes++;
      if (changes % 2 === 0) stepLen++;
    }
  }
  return null;
}

// [§9.30, segnalazione dell'autore] Un'unita' appena prodotta verso il suo
// posto (flaggox, flaggoy: rallySpot) col pathfinding anche da vicino: il
// campo verso il posto e il posto come una casella della formazione
// (§8.11, onFormationSlot), cioe' unico e raggiunto passando sopra gli
// alleati. Prima, sotto i 400 px e senza edifici in mezzo, andava dritta con
// mp_potential_step e si fermava contro le unita' prodotte prima, gia' al
// loro posto: avanti e indietro per secondi (fino a 230 inversioni), poi
// arrivava "per rinuncia" anche a 190 px dal posto.
// Il campo e' quello dei soli ostacoli fissi: le celle delle unita' ferme
// (occupy) chiudevano in una sacca chi nasceva fra l'edificio e i compagni.
export function rallyGo(p, inst) {
  p.free(inst);
  const f = p.goalField(inst.flaggox, inst.flaggoy, false, false, true);
  const gx = Math.trunc(inst.flaggox / GRID), gy = Math.trunc(inst.flaggoy / GRID);
  const sx = Math.floor(inst.x / GRID), sy = Math.floor(inst.y / GRID);
  if (p.fieldAt(f, gx, gy) === -1 || (p.fieldAt(f, sx, sy) === -1 && !p.escapeCell(f, sx, sy, 2))) {
    scrMove(p, inst, inst.flaggox, inst.flaggoy); // posto non raggiungibile: come prima
    return;
  }
  inst.goal_field = f; inst.flow_field = p.flowField(f);
  inst.goal_x = gx * GRID; inst.goal_y = gy * GRID;
  inst.dirox = inst.flaggox; inst.diroy = inst.flaggoy;
  inst.formX = inst.dirox; inst.formY = inst.diroy;
}

// [§9.31, richiesta dell'autore] Chi va a dare fuoco a un edificio (alleati
// e nemici) fa spostare di lato le unita' ferme della sua parte che trova
// sulla strada (al piu' ogni WAY_EVERY passi): prima i fanti spingevano
// contro arcieri e cavalieri fermi, giravano attorno e andavano avanti e
// indietro. Si spostano solo le unita' ferme (action 0) che non stanno
// combattendo e non danno fuoco, e non le macchine d'assedio: di lato
// rispetto alla strada, dalla parte in cui gia' stanno, in un posto libero
// (verso il quale si passa sopra gli alleati, come verso una casella della
// formazione).
const WAY_EVERY = 10, SIEGE_OBJ = ["ally_ariete", "ally_catapulta", "enemy_ariete", "enemy_catapulta"];
// `o` si sposta per far passare `i` (della stessa parte)
export const canYield = (o, i) => o !== i && o.action === 0 && o.warwork !== 2 && o.firework !== 1
  && !SIEGE_OBJ.includes(o.object) && !!o.parents && o.parents.includes("enemy_unit") === i.parents.includes("enemy_unit")
  && (o.parents.includes("enemy_unit") || o.parents.includes("ally_unit"));
export function makeWay(w, p, i, fam) {
  if ((i.wayAt || 0) > w._stepNo) return;
  i.wayAt = w._stepNo + WAY_EVERY;
  const dist = pointDistance(i.x, i.y, i.dirox, i.diroy);
  if (dist < 8) return;
  const dir = pointDirection(i.x, i.y, i.dirox, i.diroy);
  for (const d of [16, 40, 64]) {
    if (d > dist + 16) break;
    const o = w.instancePlace(i, i.x + lengthdirX(d, dir), i.y + lengthdirY(d, dir), fam);
    if (!o || !canYield(o, i)) continue;
    stepAside(w, p, o, i, dir);
  }
}

function stepAside(w, p, o, i, dir) {
  // distanza (con segno) di `o` dalla strada di `i`, e quanto spostarlo
  // perche' le due maschere non si tocchino piu' passando
  const ux = lengthdirX(1, dir), uy = lengthdirY(1, dir), nx = -uy, ny = ux;
  const off = nx * (o.x - i.x) + ny * (o.y - i.y), side = off >= 0 ? 1 : -1;
  const half = (inst) => { const b = w.bbox(inst); return b ? ((b[2] - b[0]) / 2) * Math.abs(nx) + ((b[3] - b[1]) / 2) * Math.abs(ny) : 24; };
  const need = half(o) + half(i) + 8;
  const fam = o.parents.includes("enemy_unit") ? "enemy_unit" : "ally_unit";
  for (const s of [side, -side]) {
    for (const extra of [0, 24, 48]) {
      const len = need + extra - s * off;
      if (len <= 0) continue;
      const x = Math.round(o.x + nx * s * len), y = Math.round(o.y + ny * s * len);
      const gx = Math.floor(x / GRID), gy = Math.floor(y / GRID);
      if (!p.inside(gx, gy) || p.solid[gy * p.gw + gx] || !w.placeFreeExcept(o, x, y, fam)) continue;
      p.free(o);
      if (o.action !== 1 && o.alarm.get(0) < 1) o.alarm.set(0, 13);
      o.action = 1; o.warwork = 4; o.step = 0;
      o.dirox = x; o.diroy = y;
      o.formX = x; o.formY = y;
      o.goal_field = p.goalField(x, y, false, false, true);
      o.flow_field = p.flowField(o.goal_field);
      o.goal_x = gx * GRID; o.goal_y = gy * GRID;
      return true;
    }
  }
  return false;
}

// [§7.10] Appena prodotta e col posto occupato: un altro posto libero
// vicino alla stessa bandiera (al piu' ogni 15 passi), e il campo verso di
// lui (`move`: scrMove o l'equivalente del civile). false se non ce n'e'.
export function rallyRetry(w, p, inst, move) {
  if ((inst.rallyTry || 0) > w._stepNo) return true;
  inst.rallyTry = w._stepNo + 15;
  if (inst.rallyAx === undefined) {
    inst.rallyAx = inst.flaggox ?? inst.dirox;
    inst.rallyAy = inst.flaggoy ?? inst.diroy;
  }
  const s = rallySpot(w, p, inst, inst.rallyAx, inst.rallyAy);
  if (!s) return false;
  inst.flaggox = s[0]; inst.flaggoy = s[1];
  move(s[0], s[1]);
  return true;
}

// [§6.4] Da (x0, y0) a (x1, y1) a piedi in linea retta: tutte le celle
// sotto il segmento senza ostacoli (costo < 1000; i primi 16 px no: la
// cella di chi parte e' occupata da lui).
export function walkLine(p, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(len / 8));
  for (let k = 0; k <= n; k++) {
    if ((len * k) / n < 16) continue;
    const gx = Math.floor((x0 + (dx * k) / n) / GRID), gy = Math.floor((y0 + (dy * k) / n) / GRID);
    if (!p.inside(gx, gy) || p.cost[gy * p.gw + gx] >= 1000) return false;
  }
  return true;
}

// [§6.2 D] Lo "step towards" (mp_potential_step dritto verso dirox/diroy)
// vale solo se la destinazione e' in vista: nessuna cella non percorribile
// sulla linea (clearLine nel campo dell'unita'). Prima, sotto i 400 px, si
// andava dritti anche con un edificio, un albero o un fiume in mezzo, e
// l'unita' oscillava contro l'ostacolo (decine di passi a 270/300 gradi)
// finche' non rinunciava. Senza vista si continua sul percorso. Solo per i
// semplici spostamenti (chi chiama lo sa); i flow field di angoli dei
// salvataggi vecchi non sanno dire cosa e' percorribile: come prima.
// [§9.20] La linea si guarda contro gli ostacoli fissi (clearSolid), non
// nel campo: il campo, calcolato all'ordine e condiviso dal gruppo, ha per
// ostacoli anche le celle delle unita' ferme in quel momento, che poi se ne
// vanno. Chi arrivava in fondo al campo senza "vedere" la sua casella
// andava avanti e indietro di una cella a ogni passo, voltandosi (gli
// incroci fra due gruppi: decine di unita' ammucchiate e tremolanti).
// [§9.64, segnalazione dell'autore] La linea dall'unita' al bordo
// dell'edificio `t` (il punto del suo riquadro piu' vicino, fermandosi 40 px
// prima: le celle dell'edificio stesso sono ostacolo) non passa per
// ostacoli fissi. Serve agli ordini verso un edificio (presidio, cantiere,
// riparazione) che da vicino andavano dritti: con un edificio o un bosco in
// mezzo l'unita' camminava sul posto. Senza vista, il campo di flusso. A
// meno di SEES_NEAR px dal bordo vale sempre la vista (dritti, come prima):
// li' l'unita' puo' stare in una cella toccata da un altro edificio, e la
// linea, chiusa dalla prima cella, la faceva andare avanti e indietro fra
// campo e passo dritto.
const SEES_NEAR = 80;
export function seesTarget(w, p, inst, t) {
  if (!t) return true;
  const b = w.bbox(t);
  if (!b) return p.clearSolid(inst.x, inst.y, t.x, t.y);
  const nx = Math.max(b[0], Math.min(inst.x, b[2])), ny = Math.max(b[1], Math.min(inst.y, b[3]));
  const d = Math.hypot(nx - inst.x, ny - inst.y);
  if (d <= SEES_NEAR) return true;
  const k = (d - 40) / d;
  return p.clearSolid(inst.x, inst.y, inst.x + (nx - inst.x) * k, inst.y + (ny - inst.y) * k);
}

// [§9.69, segnalazione dell'autore] Il "timer fermati" (Alarm_8 [C]): un
// ordine di spostamento lo arma (1200 passi, 3000 per guerriero e
// raccolta); allo scadere l'unita' si ferma dov'e' (dirox, diroy = x, y), per
// non restare bloccata per sempre. Nei viaggi lunghi (le mappe arrivano a
// 8000 px) fermava a meta' strada chi camminava ancora. Ora allo scadere,
// se dall'ultimo controllo l'unita' si e' avvicinata alla meta di almeno
// STOP_PROGRESS px, il timer riparte per STOP_AGAIN passi; se no si ferma.
const STOP_PROGRESS = 150, STOP_AGAIN = 600;
export function armStopTimer(inst, steps) {
  inst.alarm.set(8, steps);
  inst.a8d = pointDistance(inst.x, inst.y, inst.dirox, inst.diroy);
}
export function stopTimer(inst) {
  const d = pointDistance(inst.x, inst.y, inst.dirox, inst.diroy);
  if (inst.action === 1 && inst.a8d !== undefined && inst.a8d !== null && d < inst.a8d - STOP_PROGRESS) {
    inst.a8d = d;
    inst.alarm.set(8, STOP_AGAIN);
    return;
  }
  inst.a8d = null;
  inst.dirox = inst.x;
  inst.diroy = inst.y;
}

export function seesGoal(p, inst) {
  const f = inst.flow_field;
  if (!(f instanceof Int32Array)) return true;
  return p.clearSolid(inst.x, inst.y, inst.dirox, inst.diroy);
}

// [§6.1 n.89] Arrivo "per rinuncia": le unita' sono solide e si bloccano a
// vicenda; un'unita' a meno di 400 px dalla propria destinazione (dove si
// va con mp_potential_step) che non le si e' avvicinata di almeno 2 px da
// 60 passi piu' uno ogni 2 px di distanza (1 s a un passo, 4 s a 400 px)
// la prende dove e' (dirox/diroy = x/y: l'arrivo scatta al passo dopo),
// invece di
// dondolare dietro le altre finche' il "timer fermati" (alarm 8, 20 s) non
// la ferma. Solo per gli ordini di spostamento: chi lo chiama lo sa.
// [§8.11] L'unita' va verso la casella che le ha dato la formazione
// (units.js, formation): e' gia' libera e diversa da quella degli altri,
// quindi la regola "destinazione occupata" (che la spostava verso l'unita',
// fino a fermarla dov'era, se un compagno ci passava sopra) non si applica;
// e verso la casella si passa sopra gli alleati (mpPotentialStep,
// World.placeFreeForSlot): le righe vanno per ruolo e chi deve finire
// davanti spesso parte dietro, e si fermava contro chi era gia' arrivato.
// [§9.57] la famiglia dei compagni di `inst` (sopra cui si passa verso la
// casella o il posto): prima era sempre ally_unit, e i lavoratori nemici
// si bloccavano fra loro (e passavano sopra gli alleati)
export const sideUnit = (inst) => ((inst.parents || []).includes("enemy_unit") ? "enemy_unit" : "ally_unit");

export const onFormationSlot = (inst) => inst.formX !== undefined && inst.dirox === inst.formX && inst.diroy === inst.formY;

// [§9.30] Arrivo sulla casella (formazione, posto di raccolta): l'arrivo
// scatta a 10 px e l'unita', arrivata col flow field (senza collisioni),
// poteva fermarsi sovrapposta all'edificio da cui era uscita o a un albero.
// Se e' cosi' e la casella e' libera (gli alleati non contano), ci va.
export function snapToSlot(w, inst) {
  if (inst.action !== 1 || !onFormationSlot(inst) || pointDistance(inst.x, inst.y, inst.dirox, inst.diroy) >= 10) return;
  const fam = sideUnit(inst);
  if (w.placeFreeExcept(inst, inst.x, inst.y, fam) || !w.placeFreeExcept(inst, inst.dirox, inst.diroy, fam)) return;
  w.setPos(inst, inst.dirox, inst.diroy);
}

// "Punto d'arrivo occupato" [C]: la meta si sposta di `len` px verso
// l'unita'. [§9.20] Se l'unita' e' piu' vicina di `len`, la meta diventa il
// punto in cui e' (arriva li'): spostata di tutti i `len` px finiva
// dall'altra parte, al passo dopo tornava indietro, e un'unita' sovrapposta
// a un'altra ferma andava avanti e indietro per sempre (misurato: la
// catapulta fra 1280 e 1330, 2 px a passo, voltandosi ogni volta).
export function destinationBack(inst, len) {
  const d = pointDistance(inst.dirox, inst.diroy, inst.x, inst.y);
  if (d <= len) { inst.dirox = inst.x; inst.diroy = inst.y; return; }
  const dir = pointDirection(inst.dirox, inst.diroy, inst.x, inst.y);
  inst.dirox += lengthdirX(len, dir);
  inst.diroy += lengthdirY(len, dir);
}

// [§9.20] Il conto riparte a ogni meta nuova: la distanza migliore restava
// quella dell'ordine prima, e con un ordine nuovo entro 400 px l'unita'
// sembrava ferma anche camminando (la distanza non scendeva sotto la
// vecchia) e si fermava a 50-100 px dalla casella.
export function arriveIfBlocked(inst) {
  const d = pointDistance(inst.x, inst.y, inst.dirox, inst.diroy);
  if (inst.stuckGoalX !== inst.dirox || inst.stuckGoalY !== inst.diroy) {
    inst.stuckGoalX = inst.dirox; inst.stuckGoalY = inst.diroy;
    inst.stuckN = 0; inst.stuckBest = d;
    return;
  }
  if (d > 400) { inst.stuckN = 0; inst.stuckBest = d; return; }
  if (inst.stuckBest === undefined || d < inst.stuckBest - 2) { inst.stuckBest = d; inst.stuckN = 0; return; }
  inst.stuckN = (inst.stuckN || 0) + 1;
  if (inst.stuckN >= 60 + d / 2) {
    inst.dirox = inst.x;
    inst.diroy = inst.y;
    inst.stuckN = 0;
  }
}

// mp_potential_step(xg, yg, passo, checkall) con le impostazioni
// mp_potential_settings(30, 3, 3, true) di tutte le unita' [C].
// [I] L'algoritmo interno di GameMaker non e' documentato: questa e'
// un'approssimazione con lo stesso contratto. Si prova la direzione del
// bersaglio, poi a destra e a sinistra di 3 gradi alla volta fino a 180; una
// direzione va bene se sono liberi sia il passo sia il punto 3 passi avanti;
// la direzione dell'istanza ruota al massimo di 30 gradi per passo (§9.20:
// se cosi' il passo e' chiuso, si va subito per la direzione libera); se
// nessuna direzione e' libera l'istanza ruota sul posto. Restituisce true
// all'arrivo.
export function mpPotentialStep(w, inst, xg, yg, step, checkall = false, overAllies = false) {
  const MAXROT = 30, ROT = 3, AHEAD = 3;
  if (step <= 0) return false;
  // §8.11 verso la casella della formazione, §9.21 (overAllies) verso il
  // posto prenotato attorno a una risorsa: sopra gli alleati si passa
  const slot = overAllies || (!checkall && onFormationSlot(inst) && xg === inst.dirox && yg === inst.diroy);
  const free = (x, y) => (checkall ? w.placeEmpty(inst, x, y)
    : slot ? w.placeFreeExcept(inst, x, y, sideUnit(inst)) : w.placeFree(inst, x, y)); // §9.57
  if (pointDistance(inst.x, inst.y, xg, yg) <= step) {
    if (free(xg, yg)) {
      w.setPos(inst, xg, yg);
      return true;
    }
    return false;
  }
  const goalDir = pointDirection(inst.x, inst.y, xg, yg);
  for (let k = 0; k <= 180 / ROT; k++) {
    for (const s of k === 0 ? [1] : [1, -1]) {
      const d = goalDir + s * k * ROT;
      if (!free(inst.x + lengthdirX(step, d), inst.y + lengthdirY(step, d))) continue;
      if (!free(inst.x + lengthdirX(step * AHEAD, d), inst.y + lengthdirY(step * AHEAD, d))) continue;
      // ruota verso d di al massimo MAXROT
      let diff = ((d - inst.direction) % 360 + 540) % 360 - 180;
      diff = Math.max(-MAXROT, Math.min(MAXROT, diff));
      const nd = (inst.direction + diff + 360) % 360;
      const nx = inst.x + lengthdirX(step, nd), ny = inst.y + lengthdirY(step, nd);
      if (free(nx, ny)) { inst.direction = nd; w.setPos(inst, nx, ny); }
      else {
        // [§9.20] la direzione girata di 30 gradi e' chiusa ma quella libera
        // no: si va per quella. Prima l'unita' girava di 30 gradi a passo
        // senza muoversi finche' non era allineata (fino a 6 passi): a
        // contatto con altre unita' girava su se stessa di continuo
        inst.direction = (d % 360 + 360) % 360;
        w.setPos(inst, inst.x + lengthdirX(step, d), inst.y + lengthdirY(step, d));
      }
      return false;
    }
  }
  inst.direction = (inst.direction + MAXROT) % 360; // ruota sul posto
  return false;
}

// [§9.71, richiesta dell'autore] Chi non puo' arrivare dove deve (il nemico
// da attaccare chiuso da ostacoli, nessun posto libero attorno a lui) si
// ferma dov'e', invece di spingere contro gli altri e tremare sul posto, e
// riprova ogni WAIT_RETRY passi (waiting). Raggiungibile: nella stessa
// zona della griglia degli ostacoli fissi (Pathing.regions).
export const WAIT_RETRY = 60;
export const waiting = (w, i) => (i.waitUntil || 0) > w._stepNo;
export function waitHere(w, p, i, steps = WAIT_RETRY) {
  i.waitUntil = w._stepNo + steps;
  i.action = 0; i.warwork = 0; i.speed = 0; i.step = 0;
  i.dirox = i.x; i.diroy = i.y;
  p.occupy(i);
}
export const canReach = (w, i, t) => w.path.reachable(i.x, i.y, t.x, t.y, !!i.parents && i.parents.includes("enemy_unit"));
// il piu' vicino della famiglia `fam` entro `range` px che si raggiunge
export function nearestReachable(w, i, fam, range, ok = null) {
  let best = null, bd = range;
  for (const o of w.all(fam)) {
    if (!o.alive || (ok && !ok(o))) continue;
    const d = w.distanceToInstance(i, o);
    if (d < bd && canReach(w, i, o)) { bd = d; best = o; }
  }
  return best;
}
// Inseguendo `t`, nessun progresso (CHASE_GAIN px piu' vicini) da
// CHASE_STUCK passi: bloccato da altre unita' (girava in tondo con
// mp_potential_step contro chi gli sta davanti). Da chiamare a ogni passo
// dell'inseguimento; una pausa ricomincia il conto. Bloccato di nuovo
// subito dopo la pausa: la pausa dopo e' doppia, fino a 4 volte WAIT_RETRY
// (stuckWait); un progresso la riporta a WAIT_RETRY.
const CHASE_STUCK = 30, CHASE_GAIN = 8;
export function chaseStuck(w, i, t) {
  const d = w.distanceToInstance(i, t), now = w._stepNo, c = i.chase;
  if (!c || c.id !== t.id || now - c.last > WAIT_RETRY * 4 + 2 || d < c.best - CHASE_GAIN) {
    if (c && c.id === t.id && d < c.best - CHASE_GAIN) i.stuckN = 0;
    i.chase = { id: t.id, best: d, at: now, last: now };
    return false;
  }
  if (now - c.last > 2) { c.at = now; c.best = d; } // dopo una pausa: un altro tentativo
  c.last = now;
  if (now - c.at < CHASE_STUCK) return false;
  c.at = now;
  i.stuckN = (i.stuckN || 0) + 1;
  return true;
}
export const stuckWait = (i) => WAIT_RETRY << Math.min(Math.max((i.stuckN || 1) - 1, 0), 2);

// [§9.71] Un ordine di movimento (verso dirox, diroy) che non avanza: in
// MOVE_CHECK passi meno di MOVE_NET px di spostamento netto e nessun
// avvicinamento alla meta (avanti e indietro sul posto, o fermo contro gli
// altri). Se la meta non si raggiunge (un punto chiuso da alberi, l'altra
// riva) ci si ferma li': l'ordine e' finito. Se si raggiunge, una pausa sul
// posto e poi si riprova, col proprio campo verso la meta: il campo comune
// della formazione porta a una sola cella, e chi aveva la casella
// dall'altra parte di un ostacolo restava ammassato li' con gli altri.
// Bloccato di nuovo, la pausa dopo e' doppia, fino a 4 volte WAIT_RETRY.
// Vero se in questo passo l'unita' non deve muoversi.
const MOVE_CHECK = 45, MOVE_NET = 20, MOVE_GAIN = 16;
export function moveStalled(w, p, i) {
  const now = w._stepNo, c = i.mv;
  if ((i.mvPause || 0) > now && c) {
    Object.assign(c, { x: i.x, y: i.y, at: now, last: now });
    i.step = 0; i.alarm.set(0, i.alarm.get(0) + 1); // fermo, senza il passo
    return true;
  }
  const d = pointDistance(i.x, i.y, i.dirox, i.diroy);
  if (!c || c.dx !== i.dirox || c.dy !== i.diroy || now - c.last > 2) {
    const n = c && c.dx === i.dirox && c.dy === i.diroy ? c.n : 0;
    i.mv = { dx: i.dirox, dy: i.diroy, x: i.x, y: i.y, d, at: now, last: now, n };
    return false;
  }
  c.last = now;
  if (now - c.at < MOVE_CHECK) return false;
  const stuck = pointDistance(i.x, i.y, c.x, c.y) < MOVE_NET && d > c.d - MOVE_GAIN;
  Object.assign(c, { x: i.x, y: i.y, d, at: now });
  if (!stuck) { c.n = 0; return false; }
  if (!p.reachable(i.x, i.y, i.dirox, i.diroy, !!i.parents && i.parents.includes("enemy_unit"))) {
    i.action = 0; i.warwork = 0; i.creation = 0; i.speed = 0; i.step = 0;
    i.dirox = i.x; i.diroy = i.y;
    p.occupy(i);
    i.mv = null;
    return true;
  }
  c.n++;
  i.mvPause = now + (WAIT_RETRY << Math.min(c.n - 1, 2));
  if (i.goal_field) {
    generateFields(p, i, i.dirox, i.diroy);
    i.goal_x = Math.floor(i.dirox / GRID) * GRID; i.goal_y = Math.floor(i.diroy / GRID) * GRID;
  }
  return true;
}
