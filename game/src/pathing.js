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
    for (const fam of ["ally_build", "enemy_build", "natural_parent"]) {
      for (const inst of this.w.all(fam)) this.markInstance(inst, 1000);
    }
  }

  // collision_rectangle sulla cella, maschera precisa, solo quell'istanza [C]
  markInstance(inst, value) {
    const s = value >= 1000 ? 1 : 0;
    for (const k of this._cellsOf(inst)) { this.cost[k] = value; this.solid[k] = s; }
    this.solidVer++;
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
  goalField(goalX, goalY, enemy = false, wide = false) {
    const block = enemy ? this.enemyBlock : null;
    const wm = wide ? this.wideMask(enemy) : null;
    const { gw, gh, cost } = this;
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
export function rallySpot(w, p, inst, ax, ay) {
  const taken = [];
  for (const u of w.all("ally_unit")) {
    if (u === inst || u.creation !== 1) continue;
    if (u.flaggox !== null && u.flaggox !== undefined) taken.push([u.flaggox, u.flaggoy]);
    if (u.action === 1) taken.push([u.dirox, u.diroy]);
  }
  const cs = 64;
  let gx = Math.floor(ax / cs), gy = Math.floor(ay / cs);
  let stepLen = 1, dir = 0, done = 0, changes = 0;
  for (let attempts = 0; attempts < 400; attempts++) {
    const fx = gx * cs + cs / 2, fy = gy * cs + cs / 2;
    const cx = Math.floor(fx / GRID), cy = Math.floor(fy / GRID);
    if (p.inside(cx, cy) && p.cost[cy * p.gw + cx] < 1000 && w.placeFree(inst, fx, fy)
        && !taken.some(([tx, ty]) => Math.abs(tx - fx) < 48 && Math.abs(ty - fy) < 48)) return [fx, fy];
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
export const onFormationSlot = (inst) => inst.formX !== undefined && inst.dirox === inst.formX && inst.diroy === inst.formY;

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
export function mpPotentialStep(w, inst, xg, yg, step, checkall = false) {
  const MAXROT = 30, ROT = 3, AHEAD = 3;
  if (step <= 0) return false;
  const slot = !checkall && onFormationSlot(inst) && xg === inst.dirox && yg === inst.diroy; // §8.11
  const free = (x, y) => (checkall ? w.placeEmpty(inst, x, y)
    : slot ? w.placeFreeExcept(inst, x, y, "ally_unit") : w.placeFree(inst, x, y));
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
