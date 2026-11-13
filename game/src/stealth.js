// [§9.148, richiesta dell'autore] Livello 7, "Lost in the Fog": le
// meccaniche dello stealth e la prova (?room=match&prova=nebbia).
//
// - Banchi di nebbia (nebbia_banco): gruppi di nuvole che vanno avanti e
//   indietro in orizzontale (solo in orizzontale, decisione dell'autore: il
//   disegno regge), fra due x, a velocita' fissa: sempre uguali, si possono
//   imparare e sincronizzare con le pattuglie (che nel livello andranno in
//   verticale, incrociandoli). Dentro un banco i nemici vedono a meta'
//   distanza (come vicino a fog01, §9.80), sia chi guarda sia chi e' guardato.
// - La vista dei nemici: davanti (FRONT gradi per parte dalla direzione in cui
//   guardano) fino alla distanza di sempre; ai lati e dietro solo chi e' a
//   meno di HEAR px (lo sentono). Niente coni disegnati (decisione
//   dell'autore): da dove guardano si capisce dallo sprite. Chi e' in allarme
//   guarda tutto attorno.
// - Allarme: chi vede l'arciere, chi e' colpito senza morire e chi sente un
//   tiro rapido (a meno di NOISE_R px dal colpito) e' in allarme per ALERT
//   passi; chi non stava gia' combattendo va a guardare da dove e' partita
//   la freccia. Sopra chi non e' ignaro c'e' un "!" (il tiro furtivo non va).
// - L'arciere della nebbia (un ally_arciere con `hunter`, lo sprite di
//   sempre): vede SIGHT volte piu' lontano; due pulsanti per il modo di tiro
//   (ranged.js). Furtivo: tira solo al bersaglio scelto col clic destro, da
//   fermo, caricando a lungo, piu' lontano; un nemico ignaro muore senza che
//   nessuno se ne accorga, uno in allarme prende STEALTH_AWARE volte il danno.
//   Rapido: come l'arciere di sempre, piu' svelto, ma ogni colpo fa rumore.
import { pointDirection, pointDistance } from "./gm.js";
import { tr } from "./i18n.js";

export const ST = {
  fogK: 0.5,             // dentro un banco la vista dei nemici si dimezza
  cloudGap: 260,         // px fra le nuvole di un banco
  bankRy: 150,           // mezza altezza della zona coperta da un banco
  front: 60,             // gradi per parte, davanti
  hear: 90,              // px: chi e' piu' vicino si sente anche alle spalle
  alert: 600,            // passi d'allarme (10 s)
  noiseR: 300,           // px attorno al colpito: chi sente il tiro rapido
  sight: 1.5,            // la vista dell'arciere della nebbia
  stealthRange: 700,     // gittata del tiro furtivo (quella di sempre: 600)
  stealthPhases: [13, 94, 13], // caricamento del tiro furtivo: 2 s
  rapidPhases: [6, 16, 6],     // tiro rapido: ~0,5 s (sempre: 13, 30, 13)
  stealthAware: 3,       // danno del furtivo su chi e' in allarme, in volte quello di sempre
};

export const stealthOn = (w) => !!(w.g && w.g.stealth);
const angDiff = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

// ---------------------------------------------------------- banchi di nebbia
// (x, y) e' dentro un banco?
export function inFog(w, x, y) {
  for (const b of w.all("nebbia_banco")) {
    const rx = b.rx || 400, dx = (x - b.x) / rx, dy = (y - b.y) / ST.bankRy;
    if (dx * dx + dy * dy < 1) return true;
  }
  return false;
}

// nebbia_banco: x0, x1 (dove torna indietro), speed (px a passo, col segno),
// clouds (quante nuvole)
export function fogBank() {
  return {
    create(i) {
      i.sprite_index = null;
      i.x0 = i.x0 ?? i.x - 600; i.x1 = i.x1 ?? i.x + 600; i.speed0 = i.speed0 ?? 1; i.clouds = i.clouds ?? 3;
      i.rx = ((i.clouds - 1) * ST.cloudGap) / 2 + 260;
      i.depth = -i.y - 150;
    },
    step(i, w) {
      let x = i.x + i.speed0;
      if (x > i.x1) { x = i.x1; i.speed0 = -Math.abs(i.speed0); }
      if (x < i.x0) { x = i.x0; i.speed0 = Math.abs(i.speed0); }
      w.setPos(i, x, i.y);
    },
    draw(i, w, d) {
      // le nuvole del banco, un po' sfalsate e mosse; il centro piu' denso
      const n = i.clouds, t = w._stepNo;
      for (let k = 0; k < n; k++) {
        const ox = (k - (n - 1) / 2) * ST.cloudGap, oy = Math.sin(k * 2.1 + t / 400) * 18 + ((k % 2) ? -25 : 15);
        d.setAlpha(0.55);
        d.sprite("fog1", 0, i.x + ox, i.y + oy);
      }
      d.setAlpha(0.35);
      d.sprite("fog1", 0, i.x, i.y);
      d.setAlpha(1);
    },
  };
}

// ---------------------------------------------------------- vista e allarme
export const alerted = (w, e) => (e.alertUntil || 0) > w._stepNo;
// ignaro: non in allarme e non sta combattendo o inseguendo
export const unaware = (w, e) => !alerted(w, e) && e.warwork !== 1 && e.warwork !== 2 && e.action !== 2;

// `e` vede `a`? `lim`: la distanza a cui si accorge di solito (con notte,
// prospettiva, fog01: la calcola chi chiama)
export function sees(w, e, a, lim) {
  let r = lim;
  if (inFog(w, a.x, a.y)) r *= ST.fogK;
  if (inFog(w, e.x, e.y)) r *= ST.fogK;
  const d = w.distanceToInstance(e, a);
  if (!(d < r)) return false;
  if (d < ST.hear || alerted(w, e)) return true;
  return angDiff(e.direction, pointDirection(e.x, e.y, a.x, a.y)) <= ST.front;
}

// `e` in allarme verso (x, y): se non sta gia' combattendo ci va a guardare
export function alert(w, e, x, y) {
  e.alertUntil = w._stepNo + ST.alert;
  e.alertX = x; e.alertY = y;
  if (e.warwork === 1 || e.warwork === 2 || e.action === 2 || e.retreat) return;
  const p = w.path;
  if (e.action !== 1) e.alarm.set(0, 12);
  Object.assign(e, { action: 1, warwork: 0, role: 32, dirox: x, diroy: y, searching: 1,
                     flow_field: p.flowField(p.goalField(x, y, true, false, true)) });
}
// il rumore di un colpo in (x, y): chi e' entro NOISE_R px, verso (fx, fy)
export function noise(w, x, y, fx, fy) {
  for (const e of w.all("enemy_unit")) if (e.alive && pointDistance(e.x, e.y, x, y) < ST.noiseR) alert(w, e, fx, fy);
}

// La freccia dell'arciere della nebbia colpisce `o` (danno di sempre `dmg`):
// furtivo su un ignaro, morto senza rumore; se no il danno (piu' alto col
// furtivo), il colpito in allarme e, col rapido o col furtivo andato a vuoto,
// il rumore attorno.
export function huntHit(w, b, o, dmg) {
  const h = b.hunt, fx = h.x, fy = h.y;
  if (h.mode === "furtivo" && unaware(w, o)) { o.life = 0; o.hit = 1; return; }
  o.life -= h.mode === "furtivo" ? dmg * ST.stealthAware : dmg;
  o.hit = 1;
  o.alarm.set(5, 47);
  alert(w, o, fx, fy);
  noise(w, o.x, o.y, fx, fy);
}

// ---------------------------------------------------------- il "!"
// stealth_segni: un "!" rosso sopra i nemici visibili che non sono ignari
export function stealthMarks() {
  return {
    create(i) { i.sprite_index = null; i.depth = -1e9; },
    draw(i, w, d) {
      if (!stealthOn(w)) return;
      d.setFont("GUI_1");
      d.setHalign("center");
      for (const e of w.all("enemy_unit")) {
        if (!e.alive || !e.visible || unaware(w, e)) continue;
        d.setColour(0x000000);
        d.textTransformed(e.x + 2, e.y - 113, "!", 2.6);
        d.setColour(0x2020e0);
        d.textTransformed(e.x, e.y - 115, "!", 2.6);
      }
      d.setColour(0xffffff);
      d.setHalign("left");
    },
  };
}

// ---------------------------------------------------------- i due pulsanti
// tiro_furtivo_clicker / tiro_rapido_clicker: accanto ad attacco e difesa
// (x 520), per gli arcieri della nebbia selezionati. Il modo scelto e' pieno.
export function shotClicker(mode) {
  const furtivo = mode === "furtivo", Y = furtivo ? 50 : 120;
  const apply = (w) => { for (const u of w.all("ally_arciere")) if (u.selected === 1 && u.hunter) u.shotMode = mode; };
  const anySel = (w) => { for (const u of w.all("ally_arciere")) if (u.selected === 1 && u.hunter) return u; return null; };
  return {
    create(i) { i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      if (!anySel(w)) { if (i.hover) g.sele = 0; w.destroy(i); return; }
      w.setPos(i, c.x + 520 * g.scaleview, c.y + Y * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview; i.image_yscale = g.scaleview;
    },
    leftReleased(i, w) { apply(w); },
    [furtivo ? "keyPress70" : "keyPress82"](i, w) { apply(w); }, // F, R
    mouseEnter(i, w) { i.hover = 1; w.g.sele = 2; },
    mouseLeave(i, w) { i.hover = 0; w.g.sele = 0; },
    drawGUITop(i, w, d) {
      const u = anySel(w), on = u && u.shotMode === mode, white = 0xffffff;
      if (i.hover === 1) {
        const H = w.cam.cssH;
        const title = tr(furtivo ? "Stealth shot" : "Rapid shot"), sc = tr("Shortcut: {key}", { key: furtivo ? "F" : "R" });
        const desc = tr(furtivo ? "Only at the target you choose, standing still: an unaware enemy dies in silence."
                                : "Fast and weak: every hit alerts the enemies nearby.");
        d.setFont("overdue");
        const up = Math.max(0, d.stringHeightExt(desc, 30, 280) - 60);
        d.setFont("GUI_1");
        d.tooltipBegin(w);
        d.setAlpha(0.69);
        d.roundrectColourExt(20, H - 150 - up, 340, H - 20, 60, 60, white, white, false);
        d.setAlpha(0.7);
        d.setHalign("left");
        d.text(40, H - 120 - up, title);
        d.setFont("overdue");
        d.setValign("top");
        d.textExt(40, H - 90 - up, desc, 30, 280);
        d.setValign("middle");
        d.setFont("GUI_1");
        d.setHalign("right");
        d.text(320, H - 120 - up, sc);
        d.tooltipEnd(w);
      }
      d.setAlpha(on ? 0.95 : 0.6);
      d.circleColour(520, Y, 30, white, white, !on);
      d.setAlpha(1);
      d.setFont("GUI_1");
      d.setHalign("center");
      d.setColour(on ? 0x000000 : white);
      // (in attesa delle icone: la lettera della scorciatoia)
      d.text(520, Y, furtivo ? "F" : "R");
      d.setColour(white);
      d.setHalign("left");
    },
  };
}

// ---------------------------------------------------------- la prova
// prova_nebbia (?room=match&prova=nebbia): nella zona piu' aperta del match,
// tolti tutti, l'arciere della nebbia a ovest; due pattuglie su percorsi
// verticali, una sentinella girata verso ovest, due banchi di nebbia che
// incrociano i percorsi.
export const PROVA = {
  patrols: [
    { units: ["enemy_warrior", "enemy_warrior"], x: -150, y0: -380, y1: 380 },
    { units: ["enemy_picchiere", "enemy_arciere"], x: 300, y0: 380, y1: -380 },
  ],
  sentry: { unit: "enemy_warrior", x: 650, y: 0, dir: 180 },
  banks: [{ y: -170, x0: -700, x1: 700, speed: 1.3, clouds: 3 }, { y: 210, x0: -700, x1: 700, speed: -0.9, clouds: 3 }],
  hunter: [-750, 0],
};
export function provaNebbia() {
  return {
    create(i, w) {
      i.sprite_index = null;
      const p = w.path, g = w.g;
      for (const e of [...w.all("enemy")]) w.destroy(e);
      for (const n of ["enemy_manager", "objective_button"]) for (const e of [...w.all(n)]) w.destroy(e);
      for (const u of [...w.all("ally_unit")]) { p.free(u); w.destroy(u); }
      for (const dl of [...w.all("dialogo")]) w.destroy(dl);
      Object.assign(g, { stealth: 1, hint: 0, bloc1: 1, bloc2: 1, bloc3: 1, night: 0 });
      // la zona piu' aperta (come crowd.mjs)
      let best = null;
      for (let gy = 30; gy < p.gh - 30; gy += 6) for (let gx = 30; gx < p.gw - 30; gx += 6) {
        let bad = 0;
        for (let dy = -28; dy <= 28; dy += 2) for (let dx = -28; dx <= 28; dx += 2) if (p.costAt(gx + dx, gy + dy) >= 1000) bad++;
        if (!best || bad < best.bad) best = { gx, gy, bad };
      }
      const CX = best.gx * 32 + 16, CY = best.gy * 32 + 16;
      i.cx = CX; i.cy = CY;
      for (const b of PROVA.banks) {
        w.create("nebbia_banco", CX + (b.x0 + b.x1) / 2, CY + b.y,
                 { init: (o) => Object.assign(o, { x0: CX + b.x0, x1: CX + b.x1, speed0: b.speed, clouds: b.clouds }) });
      }
      PROVA.patrols.forEach((pt, k) => pt.units.forEach((obj, j) => {
        const e = w.create(obj, CX + pt.x + j * 40, CY + pt.y0 + j * 30);
        Object.assign(e, { prova: { route: [[CX + pt.x, CY + pt.y0], [CX + pt.x, CY + pt.y1]], k: 1, off: j * 40 }, defender: 0, role: 32 });
      }));
      const s = PROVA.sentry, se = w.create(s.unit, CX + s.x, CY + s.y);
      Object.assign(se, { direction: s.dir, defender: 1, role: 32 });
      const h = w.create("ally_arciere", CX + PROVA.hunter[0], CY + PROVA.hunter[1]);
      Object.assign(h, { hunter: 1, shotMode: "furtivo", comp: 200 });
      w.create("stealth_segni", 0, 0);
      w.cam.x = h.x - w.cam.w / 2; w.cam.y = h.y - w.cam.h / 2;
    },
    step(i, w) {
      const p = w.path;
      // le pattuglie: avanti e indietro fra i due capi (non chi e' in
      // allarme o combatte: finito, riprende dal capo verso cui andava)
      for (const e of w.all("enemy_unit")) {
        const r = e.prova;
        if (!r || alerted(w, e) || e.warwork || e.action === 2) continue;
        e.searching = 0;
        const [tx, ty] = r.route[r.k];
        if (pointDistance(e.x, e.y, tx + r.off, ty) < 24) r.k = 1 - r.k; // arrivato: l'altro capo
        else if (e.action === 1 && e.dirox === tx + r.off && e.diroy === ty) continue; // in cammino verso il capo
        const [nx, ny] = r.route[r.k];
        if (e.action !== 1) e.alarm.set(0, 12);
        Object.assign(e, { action: 1, warwork: 0, role: 32, dirox: nx + r.off, diroy: ny,
                           flow_field: p.flowField(p.goalField(nx + r.off, ny, true, false, true)) });
      }
    },
  };
}
