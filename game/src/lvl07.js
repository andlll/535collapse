// [§9.178, regia dell'autore] Livello 7: l'arciere nella nebbia.
//
// Un arciere solo si ritrova nella nebbia, fuori stagione, e la usa per
// passare fra le pattuglie nemiche (le meccaniche dello stealth: stealth.js,
// §9.148). Le fasi:
// 0. Di giorno (fisso: niente ciclo). Dall'angolo in alto a destra la strada
//    scende lungo il lato destro; i tre picchieri della cima vanno e vengono
//    fino al granaio coi quattro campi: l'arciere aspetta fra le mura e i
//    fiori gialli che risalgano, poi scende. Lungo la strada le torri non lo
//    vedono (la nebbia). Pattuglie e nemici soli si muovono (i percorsi
//    "pattuglia" della mappa), i lavoratori nemici lavorano e, se lo vedono
//    da vicino, corrono ad avvisare le guardie.
// 1. Arrivato davanti alla porta della citta' senza le macchine: capisce che
//    servono macchine d'assedio (dialogo, obiettivo). Dove sono non si dice.
// 2. Uccisa la guardia, con l'arciere vicino, le macchine (il gruppo
//    "macchine" della mappa, tenuto da parte) entrano da sinistra: "grazie
//    per averci liberato". Da li' e' notte (fissa). Di notte e nella nebbia i
//    nemici non vedono le macchine (cloak: enemies.js nearestFoe), tranne i
//    cinque cavalieri delle stalle se le macchine ci passano troppo vicino.
// 3. La porta distrutta: i cavalieri partono contro le macchine; l'arciere
//    entra in citta' (le stesse dinamiche) fino al palo piu' in alto:
//    vittoria. Sconfitta: l'arciere muore, o muoiono tutte le macchine con la
//    porta ancora in piedi.
import { pointDistance } from "./gm.js";
import { dhypot } from "./dmath.js"; // §9.152
import { ST, alert, alerted, sees, stealthStep } from "./stealth.js";
import { orderWork } from "./civilians.js";
import { dialogOpen } from "./hints.js";

export const LV7 = {
  patrolR: 300,      // nemici a meno di tanti px da una tappa di un percorso "pattuglia": della pattuglia
  next: 110,         // a tanti px dalla tappa, la tappa dopo
  guardR: 450,       // nemici a meno di tanti px dalle macchine (tenute da parte): la guardia
  freeR: 600,        // l'arciere a tanti px dalle macchine, la guardia morta: liberate
  gateR: 650,        // l'arciere a tanti px dalla porta, senza le macchine: il dialogo
  towerR: 700,       // l'arciere a tanti px dalla prima torre lungo la strada: il dialogo
  knightR: 800,      // le macchine a tanti px dalle stalle: i cavalieri le attaccano
  stablesR: 700,     // i cavalieri: quelli a meno di tanti px dalle stalle
  winR: 130,         // l'arciere a tanti px dal palo piu' in alto: vittoria
  shootingTower: [2218, 5979], // l'unica torre che tira (l'autore: "l'unica che lo vede"); le altre e le fortezze di vedetta
  enterX: 70,        // le macchine entrano dal bordo sinistro, a tanti px
  enterGap: 260,     // la prossima quando nessuna macchina e' a meno di tanti px dall'entrata
  enterWait: 240,    // al piu' tanti passi: poi entra nel posto libero piu' vicino lungo il bordo
  nightStep: 0.005,  // il buio che scende (come manager.js, alarm 0)
  workerSee: 320,    // un lavoratore vede l'arciere a tanti px (davanti; meta' nella nebbia, meta' di notte)
  workerRun: 2200,   // corre dalla guardia piu' vicina entro tanti px
  workerReach: 140,  // arrivato a tanti px: avvisa
  warnR: 450,        // e avvisa le guardie a meno di tanti px da quella
  // i lavoratori nemici (l'autore: "sulle risorse o in giro"): [tipo, x, y, (meta)]
  workers: [
    ["food", 5520, 2600], ["food", 5660, 2600], ["food", 5380, 2560], ["food", 5760, 2620], // il granaio
    ["gold", 3420, 5620], ["gold", 3200, 5660],                                           // le miniere
    ["wood", 2600, 2620], ["wood", 2860, 2560],                                           // gli ulivi
    ["walk", 5700, 2860, [5300, 2950]], ["walk", 4700, 5300, [5200, 5000]],              // fra le case
    ["walk", 1500, 500, [2200, 520]], ["walk", 1700, 900, [2400, 950]], ["walk", 1300, 300, [1300, 1000]], // in citta'
  ],
};

const sayAt = (w, name, x, y) => w.create(name, x, y);
const archerOf = (w) => {
  for (const a of w.all("ally_arciere")) if (a.hunter) return a;
  return null;
};
const isMachine = (u) => u.object === "ally_ariete" || u.object === "ally_catapulta";
const machines = (w) => [...w.all("ally_unit")].filter((u) => u.alive && isMachine(u));

// in cammino verso (x, y) (come le pattuglie della prova, stealth.js)
function walkTo(w, e, x, y) {
  const p = w.path;
  if (e.action !== 1) e.alarm.set(0, 12);
  Object.assign(e, { action: 1, warwork: 0, role: 31, dirox: x, diroy: y, searching: 0,
                     flow_field: p.flowField(p.goalField(x, y, true, false, true)) });
}

export function enemyManagerLv7() {
  const routes = (w, name) => (w.routes || []).filter((r) => r.name === name);
  return {
    create(i, w) {
      const g = w.g;
      i.sprite_index = null;
      Object.assign(g, { stealth: 1, night: 0, food: 0, wood: 0, gold: 0, stone: 0 });
      if (!g.en) g.en = { food: 0, wood: 0, gold: 0, stone: 0, pop: 0, idle: 0 };
      w.create("stealth_segni", 0, 0);
      // l'arciere della nebbia
      const a = [...w.all("ally_arciere")][0];
      if (a) Object.assign(a, { hunter: 1, shotMode: "furtivo", comp: 200 });
      // i banchi di nebbia della mappa (percorsi "nebbia": i due capi, velocita' e nuvole)
      for (const r of routes(w, "nebbia")) {
        const [[xa, y], [xb]] = r.pts, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), pr = r.props || {};
        w.create("nebbia_banco", (x0 + x1) / 2, y,
                 { init: (o) => Object.assign(o, { x0, x1, speed0: pr.velocita ?? 0.8, clouds: pr.nuvole ?? 3 }) });
      }
      // la guardia delle macchine: i nemici vicini al gruppo tenuto da parte
      const held = (g.heldGroups && g.heldGroups.macchine) || [];
      const mx = held.length ? held.reduce((s, e) => s + e[1], 0) / held.length : 0;
      const my = held.length ? held.reduce((s, e) => s + e[2], 0) / held.length : 0;
      // le stalle e i loro cavalieri
      const st = [...w.all("enemy_stalla")];
      const sx = st.length ? st.reduce((s, b) => s + b.x, 0) / st.length : -1e6;
      const sy = st.length ? st.reduce((s, b) => s + b.y, 0) / st.length : -1e6;
      const pr = routes(w, "pattuglia");
      for (const e of w.all("enemy_unit")) {
        if (held.length && dhypot(e.x - mx, e.y - my) < LV7.guardR) { Object.assign(e, { l7: "g", defender: 1 }); continue; }
        if (e.object === "enemy_cavaliere" && dhypot(e.x - sx, e.y - sy) < LV7.stablesR) { Object.assign(e, { l7: "k", l7knight: 1, defender: 1 }); continue; }
        // le pattuglie: i nemici vicini a una tappa partono dalla tappa piu' vicina
        let best = null;
        pr.forEach((r, gi) => r.pts.forEach(([x, y], k) => {
          const d = dhypot(e.x - x, e.y - y);
          if (d < LV7.patrolR && (!best || d < best.d)) best = { d, gi, k };
        }));
        if (!best) { e.defender = 1; continue; }
        Object.assign(e, { l7: "p", l7g: best.gi, road: pr[best.gi].pts.map(([x, y]) => [x, y]), roadK: best.k,
                           defender: 0, role: 32, action: 0, noFire: 1 });
      }
      // i lavoratori nemici
      const p = w.path;
      for (const [kind, x, y, to] of LV7.workers) {
        const o = w.create("enemy_omino", x, y);
        o.l7w = kind;
        if (kind === "walk") { o.l7walk = [[x, y], to]; o.l7wk = 1; continue; }
        const t = kind === "food" ? null : w.nearest(x, y, kind === "gold" ? "miniera_oro" : "albero");
        if (kind === "food" || t) orderWork(w, p, o, kind, t);
      }
      // torri e fortezze di vedetta (non tirano, il messaggero ci corre lo
      // stesso a dare l'allarme), tranne la torre in basso a sinistra
      const [tx, ty] = LV7.shootingTower, shooter = w.nearest(tx, ty, "enemy_torre");
      for (const n of ["enemy_torre", "enemy_castello"]) for (const t of w.all(n)) if (t !== shooter) t.watch = 1;
      // la porta e il palo piu' in alto (la meta)
      const gate = w.all("enemy_porta_ori").next().value || w.all("enemy_porta_vert").next().value;
      let top = null;
      for (const q of w.all("palo_1")) if (!top || q.y < top.y) top = q;
      g.l7 = { phase: 0, t: 0, held: held.length, mx: Math.round(mx), my: Math.round(my), sx: Math.round(sx), sy: Math.round(sy),
               gateX: gate ? gate.x : 0, gateY: gate ? gate.y : 0, gateSeen: 0, freed: 0, gateDown: 0, towersSaid: 0,
               topX: top ? top.x : 0, topY: top ? top.y : 0, machines: 0, knights: 0, lost: null };
      i.alarm.set(1, 60);
    },
    alarm1(i, w) { const a = archerOf(w); if (a) sayAt(w, "dialogo_7_0", a.x, a.y); },
    step(i, w) {
      const g = w.g, L = g.l7;
      if (!L || g.victory === 1 || g.gameover === 1) return;
      L.t++;
      stealthStep(w);
      const a = archerOf(w);
      // sconfitta: l'arciere
      if (!a) { lose(w, L, "archer"); return; }
      // le pattuglie: lungo il giro; chi e' in allarme o combatte lo lascia
      // e, finito (fermo), lo riprende dalla sua tappa
      for (const e of w.all("enemy_unit")) {
        if (e.l7 !== "p" || !e.road || e.warwork || e.messenger || alerted(w, e)) continue;
        const [tx, ty] = e.road[e.roadK];
        if (e.action === 0) { walkTo(w, e, tx, ty); continue; }
        if (e.action !== 1 || dhypot(e.x - tx, e.y - ty) > LV7.next) continue;
        e.roadK = (e.roadK + 1) % e.road.length;
        walkTo(w, e, ...e.road[e.roadK]);
      }
      if (L.t % 6 === 0) workersStep(w, L, a);
      // la prima torre lungo la strada: non lo vedono
      if (!L.towersSaid && L.t % 20 === 0) {
        const t = w.nearest(a.x, a.y, "enemy_torre");
        if (t && pointDistance(a.x, a.y, t.x, t.y) < LV7.towerR && a.y > 2600 && a.x > 4000 && !dialogOpen(w)) {
          L.towersSaid = 1; sayAt(w, "dialogo_7_6", a.x, a.y);
        }
      }
      // davanti alla porta senza macchine
      if (!L.gateSeen && !L.freed && L.t % 20 === 0 && pointDistance(a.x, a.y, L.gateX, L.gateY) < LV7.gateR) {
        L.gateSeen = 1; L.phase = Math.max(L.phase, 1);
        sayAt(w, "dialogo_7_2", a.x, a.y);
      }
      // le macchine: la guardia morta, l'arciere vicino
      if (!L.freed && L.held && L.t % 20 === 0) {
        let guard = 0;
        for (const e of w.all("enemy_unit")) if (e.l7 === "g") guard++;
        if (!guard && pointDistance(a.x, a.y, L.mx, L.my) < LV7.freeR) free(w, L);
      }
      if (L.queue && L.queue.length && L.t % 15 === 0) enterNext(w, L);
      // la notte, dopo la liberazione: scende piano e resta
      if (L.freed && g.night < 1) g.night = Math.min(1, g.night + LV7.nightStep);
      const ms = machines(w);
      L.machines = ms.length;
      // di notte i nemici non vedono le macchine (enemies.js nearestFoe), finche' la porta e' in piedi
      g.cloakOn = L.freed && !L.gateDown ? 1 : 0;
      for (const m of ms) m.cloak = g.cloakOn;
      // la porta
      if (L.freed && !L.gateDown && !w.exists("enemy_porta_ori") && !w.exists("enemy_porta_vert")) {
        L.gateDown = 1; L.phase = 3; L.knights = 1;
        sayAt(w, "dialogo_7_5", a.x, a.y);
      }
      // i cavalieri delle stalle: contro le macchine troppo vicine, o caduta la porta
      if (L.t % 30 === 0 && ms.length) {
        if (!L.knights && ms.some((m) => dhypot(m.x - L.sx, m.y - L.sy) < LV7.knightR)) L.knights = 1;
        if (L.knights) {
          for (const e of w.all("enemy_unit")) {
            if (e.l7 !== "k" || e.action === 2 || e.warwork === 2) continue;
            let t = null, bd = Infinity;
            for (const m of ms) { const d = dhypot(m.x - e.x, m.y - e.y); if (d < bd) { bd = d; t = m; } }
            if (!t) break;
            if (e.alarm.get(0) < 1) e.alarm.set(0, 12);
            Object.assign(e, { action: 1, warwork: 1, defender: 0, dirox: t.x, diroy: t.y });
          }
        }
      }
      // sconfitta: le macchine tutte perse con la porta in piedi (entrate tutte)
      if (L.freed && !L.gateDown && !ms.length && !(L.queue && L.queue.length)) { lose(w, L, "machines"); return; }
      // vittoria: il palo piu' in alto
      if (pointDistance(a.x, a.y, L.topX, L.topY) < LV7.winR) {
        g.victory = 1;
        w.create("victory_manager", 0, 0);
      }
    },
  };
}

function lose(w, L, why) {
  const g = w.g;
  L.lost = why;
  g.gameover = 1;
  w.create("gameover_manager", 0, 0);
}

// le macchine liberate: entrano dal bordo sinistro, una alla volta (prima
// quella che va piu' lontano), ognuna alla y del suo posto e verso il posto
// dove le ha messe la mappa; la prossima quando l'entrata e' libera (nate
// sovrapposte, la regola che separa le unita' le spingeva via senza fine).
// Il dialogo; poi la notte
function free(w, L) {
  const g = w.g, held = (g.heldGroups && g.heldGroups.macchine) || [];
  L.queue = held.map(([object, x, y]) => [object, Math.round(x), Math.round(y)]).sort((a, b) => b[1] - a[1]);
  if (g.heldGroups) delete g.heldGroups.macchine;
  L.freed = 1; L.phase = 2;
  enterNext(w, L);
  w.create("dialogo_7_3", L.mx, L.my);
}
function enterNext(w, L) {
  if (!L.queue || !L.queue.length) return;
  const [object, x, y] = L.queue[0], ex = LV7.enterX;
  // l'entrata occupata: si aspetta, al piu' enterWait passi; poi il posto
  // libero piu' vicino lungo il bordo
  let ey = y;
  const busy = (yy) => machines(w).some((m) => dhypot(m.x - ex, m.y - yy) < LV7.enterGap);
  if (busy(y)) {
    L.waitAt = L.waitAt ?? L.t;
    if (L.t - L.waitAt < LV7.enterWait) return;
    ey = null;
    for (let d = 1; d <= 6 && ey === null; d++) for (const s of [-1, 1]) {
      const yy = y + s * d * LV7.enterGap * 0.6;
      if (yy > 80 && yy < w.roomH - 80 && !busy(yy)) { ey = yy; break; }
    }
    if (ey === null) return;
  }
  L.waitAt = null;
  L.queue.shift();
  const m = w.create(object, ex, ey);
  w.path.occupy(m);
  if (dhypot(x - ex, y - ey) > 40) w.rightOrder({ ids: [m.id], x, y, over: true }); // verso il suo posto
}

// i lavoratori: lavorano (orderWork li ha mandati) o vanno avanti e indietro;
// se vedono l'arciere da vicino corrono dalla guardia piu' vicina e la
// avvisano (lei e chi le sta attorno vanno a cercarlo)
function workersStep(w, L, a) {
  const p = w.path, night = w.g.night;
  for (const o of w.all("enemy_omino")) {
    if (!o.alive || !o.l7w) continue;
    if (o.l7run) {
      const t = w.byIds([o.l7run])[0];
      if (!t || !t.alive) { o.l7run = 0; continue; }
      if (pointDistance(o.x, o.y, t.x, t.y) < LV7.workerReach) {
        for (const e of w.all("enemy_unit")) {
          if (e.object !== "enemy_omino" && e.alive && pointDistance(e.x, e.y, t.x, t.y) < LV7.warnR) alert(w, e, o.l7sx, o.l7sy);
        }
        o.l7run = 0; o.alertUntil = w._stepNo + ST.alert;
        orderWork(w, p, o, "move", { x: o.l7sx, y: o.l7sy }); // torna a guardare (poi riprende il giro)
      } else if (o.action !== 1 || pointDistance(o.dirox, o.diroy, t.x, t.y) > 80) {
        orderWork(w, p, o, "move", { x: t.x, y: t.y });
      }
      continue;
    }
    if (sees(w, o, a, LV7.workerSee * (1 - 0.5 * night))) {
      // la guardia piu' vicina (non un altro lavoratore)
      let t = null, bd = LV7.workerRun;
      for (const e of w.all("enemy_unit")) {
        if (e.object === "enemy_omino" || !e.alive) continue;
        const d = pointDistance(e.x, e.y, o.x, o.y);
        if (d < bd) { bd = d; t = e; }
      }
      if (t) {
        Object.assign(o, { l7run: t.id, l7sx: Math.round(a.x), l7sy: Math.round(a.y), alertUntil: w._stepNo + 1e7 });
        orderWork(w, p, o, "move", { x: t.x, y: t.y });
        continue;
      }
    }
    // in giro: fermo, l'altro capo
    if (o.l7walk && o.action === 0 && !alerted(w, o)) {
      o.l7wk = 1 - o.l7wk;
      const [x, y] = o.l7walk[o.l7wk];
      orderWork(w, p, o, "move", { x, y });
    }
  }
}

// [§9.178] il nemico che attacca guarda solo gli alleati che vede: di notte,
// nel livello 7, le macchine d'assedio no (cloak), tranne per i cavalieri
// delle stalle (l7knight). L'alleato piu' vicino all'origine, come
// world.nearest.
export function nearestFoe(w, e, x = e.x, y = e.y) {
  if (!w.g.cloakOn || e.l7knight) return w.nearest(x, y, "ally_unit");
  let best = null, bd = Infinity;
  for (const o of w.all("ally_unit")) {
    if (o.cloak) continue;
    const d = (o.x - x) * (o.x - x) + (o.y - y) * (o.y - y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
export const seenFoe = (w, e) => (o) => !(w.g.cloakOn && o.cloak && !(e && e.l7knight));
