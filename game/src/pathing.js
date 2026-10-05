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
  goalField(goalX, goalY, enemy = false) {
    const block = enemy ? this.enemyBlock : null;
    const { gw, gh } = this;
    const f = new Int32Array(gw * gh).fill(-1);
    const gx = Math.floor(goalX / GRID), gy = Math.floor(goalY / GRID);
    if (!this.inside(gx, gy)) return f;
    const qx = new Int32Array(gw * gh), qy = new Int32Array(gw * gh);
    let head = 0, tail = 0;
    qx[tail] = gx; qy[tail++] = gy;
    f[gy * gw + gx] = 0;
    while (head < tail) {
      const cx = qx[head], cy = qy[head++];
      const v = f[cy * gw + cx];
      for (let i = 0; i < 4; i++) {
        const nx = cx + DX[i], ny = cy + DY[i];
        if (nx >= 0 && nx < gw && ny >= 0 && ny < gh) {
          const k = ny * gw + nx;
          if (f[k] === -1 && this.cost[k] < 1000 && !(block && block[k])) {
            f[k] = v + 1;
            qx[tail] = nx; qy[tail++] = ny;
          }
        }
      }
    }
    return f;
  }

  // scr_generate_flow_field [C]: angolo in gradi, -1 = nessuna direzione
  flowField(goal) {
    const { gw, gh } = this;
    const ff = new Float32Array(gw * gh).fill(-1);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const c = goal[y * gw + x];
        if (c === -1) continue;
        let best = c, bi = -1;
        for (let i = 0; i < 8; i++) {
          const nx = x + DX[i], ny = y + DY[i];
          if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue;
          const v = goal[ny * gw + nx];
          if (v === -1) continue;
          if (v < best) { best = v; bi = i; }
        }
        if (bi >= 0) ff[y * gw + x] = DIR[bi];
      }
    }
    return ff;
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
export function moveFlowField(w, p, inst) {
  const a = p.fieldAt(inst.flow_field, Math.floor(inst.x / GRID), Math.floor(inst.y / GRID));
  if (a !== -1) inst.target_angle = a;
  if (inst.target_angle !== undefined) inst.direction = inst.target_angle;
  w.setPos(inst, inst.x + lengthdirX(inst.autospeed, inst.direction), inst.y + lengthdirY(inst.autospeed, inst.direction));
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
