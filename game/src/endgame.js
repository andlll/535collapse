// Fine partita e obiettivi: victory_manager, gameover_manager,
// objective_button [C]. Nomi originali.

import { c } from "./colours.js";
import { saveUnlock } from "./progress.js";
import { tr } from "./i18n.js";

// victory_manager [C]: lo schermo sbianca (alpha +0,08 a passo fino a 0,9),
// poi "VICTORY", il punteggio in match o il codice del livello successivo
// nella campagna; dopo 150 passi un clic chiude: in match si continua a
// giocare (la vittoria e' "parziale"), nella campagna si sblocca il livello
// successivo e si torna al menu.
// I codici di sblocco sono quelli del lucchetto del menu
// (enemy_manager_menu/Mouse_56).
// [Correzione decisa dall'autore, §3.19 n.66] l'originale centrava i testi
// su view_wview/2, la misura della view nella room: con lo zoom a 1,5
// finivano fuori centro. Qui il centro dello schermo.
export function victoryManager() {
  return {
    create(i, w) {
      i.sprite_index = null;
      i.fogalpha = 0;
      i.clicloc = 0;
      i.alarm.set(0, 150);
      w.g.campagna = 1;
    },
    alarm0(i) { i.clicloc = 1; },
    step(i) { if (i.fogalpha < 0.9) i.fogalpha += 0.08; },
    globalLeftPressed(i, w) {
      if (i.clicloc !== 1) return;
      w.destroy(i);
      const g = w.g;
      const next = { lvl01: 2, lvl02: 3 }[w.room];
      if (next) {
        g.campagna = 1;
        if (g.unlock < next) { g.unlock = next; saveUnlock(next); }
        w.gotoRoom("menu");
      }
    },
    drawGUI(i, w, d) {
      const g = w.g, vw = w.cam.cssW, vh = w.cam.cssH;
      const score = g.seconds + 60 * g.minutes + 3600 * g.hours + 1000 * g.basidistrutte + 1000;
      d.setColour(c.white);
      d.setAlpha(i.fogalpha);
      d.rectangle(0, 0, vw, vh, false);
      if (i.fogalpha < 0.7) return;
      d.setColour(c.black);
      d.setHalign("center");
      d.setFont("gui_sblocco");
      d.text(vw / 2, vh / 2 - 200, tr("VICTORY"));
      d.setFont("overdue");
      if (w.room === "match") {
        d.text(vw / 2, vh / 2 - 100, tr("You destroyed all the secondary enemy bases"));
        d.text(vw / 2, vh / 2, tr("Your partial score is {score}", { score }));
      }
      const code = { lvl01: "4 9 2 1 7", lvl02: "5 8 4 2 1" }[w.room];
      if (code) {
        d.text(vw / 2, vh / 2 + 200, tr("Code to unlock the next level:"));
        d.setFont("gui_sblocco");
        d.text(vw / 2, vh / 2 + 300, code);
      }
      if (i.clicloc === 1) d.text(vw / 2, vh / 2 + 100, tr("click anywhere to continue"));
    },
  };
}

// gameover_manager [C]: creato quando il centro e' distrutto; lo schermo
// annerisce (+0,02 a passo) con tempo resistito, basi distrutte e
// punteggio, e dopo 760 passi si torna al menu.
// [Correzione decisa dall'autore, §3.19 n.67] l'oggetto era invisibile
// (visible=false nel GMX): GameMaker non eseguiva il suo Draw GUI e la
// schermata non compariva mai. Qui e' visibile.
export function gameoverManager() {
  return {
    create(i) { i.visible = true; i.fogalpha = 0; i.alarm.set(0, 760); },
    alarm0(i, w) { w.gotoRoom("menu"); },
    step(i) { if (i.fogalpha < 1) i.fogalpha += 0.02; },
    drawGUI(i, w, d) {
      const g = w.g, vw = w.cam.cssW, vh = w.cam.cssH;
      const score = g.seconds + 60 * g.minutes + 3600 * g.hours + 1000 * g.basidistrutte + g.victory * 1000;
      d.setColour(c.black);
      d.setAlpha(i.fogalpha);
      if (i.fogalpha > 0) d.rectangle(0, 0, vw, vh, false);
      d.setAlpha(1);
      if (i.fogalpha < 1) return;
      d.setColour(c.white);
      d.setHalign("center");
      d.text(vw / 2, vh / 2 - 200, tr("Your town hall was destroyed."));
      d.text(vw / 2, vh / 2 - 100, tr("You resisted for {h} hours, {m} minutes and {s} seconds.", { h: g.hours, m: g.minutes, s: g.seconds }));
      d.text(vw / 2, vh / 2, tr("{n} enemy bases were sucessfully destroyed.", { n: g.basidistrutte }));
      d.text(vw / 2, vh / 2 + 100, tr("The final score is {score}", { score }));
    },
  };
}

// objective_button [C]: il riquadro degli obiettivi in alto a destra (O lo
// nasconde). Creato dal manager in match, da dialogo_1_2 e dialogo_2_5.
export function objectiveButton() {
  return {
    create(i) { i.sprite_index = null; },
    drawGUI(i, w, d) {
      const g = w.g, W = w.cam.cssW;
      if (g.obj !== 1) return;
      const nobs = w.room === "match" ? 4 : 3;
      // [y, testo, barrato]
      const lines = [];
      if (w.room === "match") {
        lines.push([58, tr("Survive for the most time possible")]);
        lines.push([88, tr("Destroy the enemy secondary bases ({n}/3)", { n: g.basidistrutte })]);
        lines.push([118, tr("Survival time: {h} hrs {m} min {s} sec", { h: g.hours, m: g.minutes, s: g.seconds })]);
        lines.push([148, tr("Number of waves: {n}", { n: g.waves })]);
      }
      if (w.room === "lvl01") {
        lines.push([58, tr("Reach the norther gates and escape the city")]);
        if (g.dialogochest === 1) lines.push([88, tr("Destroy the chests to gather resources")]);
        if (g.lvl01_gate === 1) lines.push([118, tr("Use the barracks to train more soldiers")]);
      }
      if (w.room === "lvl02") {
        lines.push([58, tr("Free the villages under attack ({n}/7)", { n: g.liberati }), g.liberati === 7 ? 43 : 0]);
        lines.push([88, tr("Use the freed paesants to build your base")]);
        lines.push([118, tr("Destroy all the enemy buildings"), w.number("enemy_build") === 0 ? 103 : 0]);
      }
      // il riquadro dell'originale (da W-520 a W-120, testo da W-500) si
      // allarga verso sinistra se un testo tradotto non ci sta
      d.setFont("overdue");
      const maxW = Math.max(0, ...lines.map(([, s]) => d.stringWidth(s)));
      const ex = Math.max(0, Math.ceil(maxW - 360));
      const x = W - 500 - ex;
      d.setAlpha(0.69);
      d.roundrectColourExt(W - 520 - ex, 20, W - 120, 38 + 30 * nobs, 60, 60, c.white, c.white, false);
      d.setFont("GUI_1");
      d.setColour(c.black);
      d.setValign("bottom");
      d.setHalign("left");
      d.setAlpha(0.75);
      d.setFont("overdue");
      for (const [y, str, strikeY] of lines) {
        d.text(x, y, str);
        if (strikeY) { d.setColour(c.black); d.rectangle(x, strikeY, x + d.stringWidth(str), strikeY + 2, false); }
      }
      d.setFont("GUI_1");
      d.setValign("middle");
      d.setAlpha(1);
    },
  };
}
