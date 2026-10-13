// [§9.40, livello 4] Il fiume grande e il suo ponte.
//
// fiume_grande: lo sprite dell'autore (Fiume_Completo, 3773x2904) non sta
// in una pagina d'atlas: si disegna a riquadri da 256 px (tools/nuovi.py,
// "pezzi"), tutti alla depth del fiume (-y della sua cima, come i fiume_*
// dell'originale). La maschera (per pixel, dall'alpha) e' quella intera,
// con un varco dove passa il piano del ponte (Ponte_varco); le celle
// d'acqua per riflessi, schiuma e pioggia come per gli altri fiumi.
//
// Il ponte rotto e' gia' dipinto nel fiume (Ponte_1 coincide pixel per pixel
// con il riquadro in 1630, 1168 dello sprite): nascendo, il fiume crea li'
// il cantiere "ponte", che chiude il varco (maschera Ponte_varco) finche'
// non e' riparato. E' un ally_fondamenta: i civili lo riparano col clic
// destro come un edificio da costruire, e gli stadi Ponte_2..4 compaiono a
// un quarto, meta' e tre quarti della vita (disegnano solo cio' che cambia
// rispetto al fiume: tools/nuovi.py, "differenza"). Finito, diventa
// "ponte_fatto" (Ponte_5, non solido: il varco si apre) con davanti la
// balaustra (Ponte_5B, a fette: chi passa sul ponte le sta dietro).

import { spawnSlices, destroySlices } from "./scenario.js";

const RIVER_ORIGIN = [1886, 1452];       // il centro di Fiume_Completo, la sua origine
export const BRIDGE = {
  at: [1630 - RIVER_ORIGIN[0], 1168 - RIVER_ORIGIN[1]], // l'angolo di Ponte_1 dall'origine del fiume
  // [Richiesta dell'autore] la riparazione e' uno degli obiettivi del
  // livello: minuti con 3-4 civili, e tanto legno. +1 a colpo (13 passi,
  // civilians.js BUILD_RATE): ~4 minuti con quattro civili, ~16 con uno
  slife: 4400,
  wood: 1000,                            // legno in tutto, pagato colpo per colpo (woodDue)
  bar: [270, 10],                        // la barra della vita, in coordinate dello sprite
  stages: [[0.25, "Ponte_2"], [0.5, "Ponte_3"], [0.75, "Ponte_4"]],
  // dove si mettono i civili per ripararlo, dalle due rive: lungo i bordi
  // d'imbocco del varco (Ponte_varco), 14 px fuori, in coordinate dello
  // sprite; ognuno in un punto diverso (SPOTS, frazioni del bordo)
  ends: [[[133, 25], [32, 82]], [[509, 247], [409, 306]]],
};
const SPOTS = [0.5, 0.3, 0.7, 0.12, 0.88];

// Un punto dello sprite (lx, ly dall'origine) nella room, con la scala e la
// rotazione dell'istanza (come drawSprite e waterMap)
function toRoom(i, lx, ly) {
  const t = (i.image_angle || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  const x = lx * (i.image_xscale || 1), y = ly * (i.image_yscale || 1);
  return [i.x + x * c + y * s, i.y - x * s + y * c];
}

export function fiumeGrande() {
  return {
    create(i, w) {
      spawnSlices(i, w, w.objects[i.object].slices);
      const [x, y] = toRoom(i, BRIDGE.at[0], BRIDGE.at[1]);
      w.create("ponte", x, y, { sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle });
    },
    destroy(i, w) { destroySlices(i, w); },
    draw() { /* lo disegnano i pezzi */ },
  };
}

export function ponte(p) {
  return {
    create(i) {
      Object.assign(i, { life: 1, slife: BRIDGE.slife, selected: 0, hover: 0, hit: 0, fase: 0,
                         fondazione: 1, pietra: 0, legno: 0, noAuto: 1, buildReach: 60 });
      p.markInstance(i, 1000);
    },
    step(i, w) {
      BRIDGE.stages.forEach(([t, spr], k) => {
        if (i.fase === k && i.life > i.slife * t) { i.fase = k + 1; w.swapSprite(i, spr); }
      });
      if (i.life < i.slife) return;
      // riparato: il varco si apre (le celle che tocca ancora l'acqua del
      // fiume restano chiuse: pathing.js markInstance)
      p.markInstance(i, 1);
      const o = { sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle };
      const b = w.create("ponte_fatto", i.x, i.y, o);
      w.swapSprite(b, b.sprite_index, i.sprite_index);
      w.create("ponte_balaustra", i.x, i.y, o);
      w.destroy(i);
    },
    mouseEnter(i) { i.hover = 1; },
    mouseLeave(i) { i.hover = 0; },
    globalLeftPressed(i) { i.selected = 0; },
    leftReleased(i, w) { if (w.g.sele === 0) i.selected = 1; },
    // come i cantieri (buildings.js, fond): i civili selezionati vengono a
    // ripararlo; dove andare lo decide bridgeEnd
    rightReleased(i, w) {
      for (const o of w.all("ally_omino")) if (o.selected === 1) o.buildwork = 1;
    },
    // [Richiesta dell'autore] la barra della vita sempre, finche' non e'
    // finito: il giocatore segue l'avanzamento come per un edificio
    drawEnd(i, w, dr) {
      const [x, y] = toRoom(i, BRIDGE.bar[0], BRIDGE.bar[1]);
      dr.lifeBar(x - 25, y, i.life / i.slife, 0x008000);
    },
    // la scheda degli edifici (buildings.js, panel), piu' larga: la vita ha
    // quattro cifre; l'icona del legno, che la riparazione consuma
    drawGUI(i, w, dr) {
      if (i.selected !== 1) return;
      dr.setAlpha(0.69);
      dr.roundrectColourExt(260, 20, 450, 150, 60, 60, 0xffffff, 0xffffff, false);
      dr.setFont("GUI_1");
      dr.setColour(0);
      dr.setAlpha(0.75);
      dr.setValign("middle");
      dr.setHalign("center");
      dr.text(355, 120, i.life + " / " + i.slife);
      dr.setAlpha(1);
      dr.sprite("ico_wood", 0, 355, 70);
    },
  };
}

// Il legno che costa il prossimo colpo di martello (da life a life + n):
// il totale BRIDGE.wood diviso sulla vita, arrotondato per eccesso man mano
// (civilians.js lo paga o, senza legno, il colpo non vale)
export function woodDue(i, n) {
  const paid = Math.ceil((i.life - 1) / (i.slife - 1) * BRIDGE.wood);
  const next = Math.ceil(Math.min(i.slife - 1, i.life - 1 + n) / (i.slife - 1) * BRIDGE.wood);
  return next - paid;
}

// Le due estremita' del ponte, nella room, la piu' vicina a (x, y) prima:
// per ognuna il prossimo punto libero del bordo (i civili mandati insieme
// non si mettono in coda uno dietro l'altro: chi non arriva a 10 px dal
// varco non comincia a lavorare)
export function bridgeEnds(i, x, y) {
  const n = i.endSpots || (i.endSpots = [0, 0]);
  const e = BRIDGE.ends.map(([[ax, ay], [bx, by]], k) => {
    const f = SPOTS[n[k] % SPOTS.length];
    return { k, p: toRoom(i, ax + (bx - ax) * f, ay + (by - ay) * f), mid: toRoom(i, (ax + bx) / 2, (ay + by) / 2) };
  });
  e.sort((a, b) => Math.hypot(a.mid[0] - x, a.mid[1] - y) - Math.hypot(b.mid[0] - x, b.mid[1] - y));
  return e.map(({ k, p }) => ({ x: p[0], y: p[1], take() { n[k]++; } }));
}
