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
  }

  // Segna l'ostacolo "solo per i nemici" sulle celle toccate dalla maschera
  // dell'istanza (la stessa regola di markInstance); restituisce le celle,
  // da passare a unblockEnemy quando l'istanza sparisce.
  blockEnemy(inst) {
    const cells = this._cellsOf(inst);
    for (const k of cells) this.enemyBlock[k]++;
    return cells;
  }

  unblockEnemy(cells) {
    for (const k of cells) if (this.enemyBlock[k] > 0) this.enemyBlock[k]--;
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
    for (const fam of ["ally_build", "enemy_build", "natural_parent"]) {
      for (const inst of this.w.all(fam)) this.markInstance(inst, 1000);
    }
  }

  // collision_rectangle sulla cella, maschera precisa, solo quell'istanza [C]
  markInstance(inst, value) {
    for (const k of this._cellsOf(inst)) this.cost[k] = value;
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
  goalField(goalX, goalY, enemy = false) {
    const block = enemy ? this.enemyBlock : null;
    const { gw, gh, cost } = this;
    const N = gw * gh;
    const f = new Int32Array(N).fill(-1);
    const gx = Math.floor(goalX / GRID), gy = Math.floor(goalY / GRID);
    if (!this.inside(gx, gy)) return f;
    const q = this.queue || (this.queue = new Int32Array(N));
    let head = 0, tail = 0;
    const g = gy * gw + gx;
    f[g] = 0;
    q[tail++] = g;
    while (head < tail) {
      const k = q[head++], v = f[k] + 1, x = k % gw;
      let n;
      if (x + 1 < gw && f[n = k + 1] === -1 && cost[n] < 1000 && !(block && block[n])) { f[n] = v; q[tail++] = n; }
      if (x > 0 && f[n = k - 1] === -1 && cost[n] < 1000 && !(block && block[n])) { f[n] = v; q[tail++] = n; }
      if (k >= gw && f[n = k - gw] === -1 && cost[n] < 1000 && !(block && block[n])) { f[n] = v; q[tail++] = n; }
      if (k < N - gw && f[n = k + gw] === -1 && cost[n] < 1000 && !(block && block[n])) { f[n] = v; q[tail++] = n; }
    }
    return f;
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
        if (!this.inside(cx, cy) || field[cy * gw + cx] === -1) return false;
      }
    }
    return true;
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
  let a = p.flowAt(field, Math.floor(inst.x / GRID), Math.floor(inst.y / GRID));
  if (a !== -1 && field instanceof Int32Array) {
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
  w.setPos(inst, inst.x + lengthdirX(inst.autospeed, inst.direction), inst.y + lengthdirY(inst.autospeed, inst.direction));
}

// [§6.2 D] Lo "step towards" (mp_potential_step dritto verso dirox/diroy)
// vale solo se la destinazione e' in vista: nessuna cella non percorribile
// sulla linea (clearLine nel campo dell'unita'). Prima, sotto i 400 px, si
// andava dritti anche con un edificio, un albero o un fiume in mezzo, e
// l'unita' oscillava contro l'ostacolo (decine di passi a 270/300 gradi)
// finche' non rinunciava. Senza vista si continua sul percorso. Solo per i
// semplici spostamenti (chi chiama lo sa); i flow field di angoli dei
// salvataggi vecchi non sanno dire cosa e' percorribile: come prima.
export function seesGoal(p, inst) {
  const f = inst.flow_field;
  if (!(f instanceof Int32Array)) return true;
  return p.clearLine(f, inst.x, inst.y, inst.dirox, inst.diroy);
}

// [§6.1 n.89] Arrivo "per rinuncia": le unita' sono solide e si bloccano a
// vicenda; un'unita' a meno di 400 px dalla propria destinazione (dove si
// va con mp_potential_step) che non le si e' avvicinata di almeno 2 px da
// 60 passi piu' uno ogni 2 px di distanza (1 s a un passo, 4 s a 400 px)
// la prende dove e' (dirox/diroy = x/y: l'arrivo scatta al passo dopo),
// invece di
// dondolare dietro le altre finche' il "timer fermati" (alarm 8, 20 s) non
// la ferma. Solo per gli ordini di spostamento: chi lo chiama lo sa.
export function arriveIfBlocked(inst) {
  const d = pointDistance(inst.x, inst.y, inst.dirox, inst.diroy);
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
// la direzione dell'istanza ruota al massimo di 30 gradi per passo; se
// nessuna direzione e' libera l'istanza ruota sul posto. Restituisce true
// all'arrivo.
export function mpPotentialStep(w, inst, xg, yg, step, checkall = false) {
  const MAXROT = 30, ROT = 3, AHEAD = 3;
  if (step <= 0) return false;
  const free = (x, y) => (checkall ? w.placeEmpty(inst, x, y) : w.placeFree(inst, x, y));
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
      inst.direction = nd;
      if (free(nx, ny)) w.setPos(inst, nx, ny);
      return false;
    }
  }
  inst.direction = (inst.direction + MAXROT) % 360; // ruota sul posto
  return false;
}
