// Fine partita e obiettivi: victory_manager, gameover_manager,
// objective_button [C]. Nomi originali.

import { c } from "./colours.js";
import { saveUnlock } from "./progress.js";

// victory_manager [C]: lo schermo sbianca (alpha +0,08 a passo fino a 0,9),
// poi "VICTORY", il punteggio in match o il codice del livello successivo
// nella campagna; dopo 150 passi un clic chiude: in match si continua a
// giocare (la vittoria e' "parziale"), nella campagna si sblocca il livello
// successivo e si torna al menu.
// I codici di sblocco sono quelli del lucchetto del menu
// (enemy_manager_menu/Mouse_56).
// [C, §3.18 n.66, riprodotto] testi centrati su view_wview/2 e
// view_hview/2, la misura della view nella room: con lo zoom a 1,5 finiscono
// fuori centro (come la scheda della porta, n.29).
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
      const g = w.g, vw = w.cam.w, vh = w.cam.h;
      const score = g.seconds + 60 * g.minutes + 3600 * g.hours + 1000 * g.basidistrutte + 1000;
      d.setColour(c.white);
      d.setAlpha(i.fogalpha);
      d.rectangle(0, 0, vw, vh, false);
      if (i.fogalpha < 0.7) return;
      d.setColour(c.black);
      d.setHalign("center");
      d.setFont("gui_sblocco");
      d.text(vw / 2, vh / 2 - 200, "VICTORY");
      d.setFont("overdue");
      if (w.room === "match") {
        d.text(vw / 2, vh / 2 - 100, "You destroyed all the secondary enemy bases");
        d.text(vw / 2, vh / 2, "Your partial score is " + score);
      }
      const code = { lvl01: "4 9 2 1 7", lvl02: "5 8 4 2 1" }[w.room];
      if (code) {
        d.text(vw / 2, vh / 2 + 200, "Code to unlock the next level:");
        d.setFont("gui_sblocco");
        d.text(vw / 2, vh / 2 + 300, code);
      }
      if (i.clicloc === 1) d.text(vw / 2, vh / 2 + 100, "click anywhere to continue");
    },
  };
}

// gameover_manager [C]: creato quando il centro e' distrutto; lo schermo
// annerisce (+0,02 a passo) con tempo resistito, basi distrutte e
// punteggio, e dopo 760 passi si torna al menu.
// [C, §3.18 n.67, riprodotto] l'oggetto e' invisibile (visible=false nel
// GMX): GameMaker non esegue il suo Draw GUI e la schermata non compare
// mai; dopo 12,7 s si torna al menu senza spiegazioni.
export function gameoverManager() {
  return {
    create(i) { i.fogalpha = 0; i.alarm.set(0, 760); },
    alarm0(i, w) { w.gotoRoom("menu"); },
    step(i) { if (i.fogalpha < 1) i.fogalpha += 0.02; },
    drawGUI(i, w, d) {
      const g = w.g, vw = w.cam.w, vh = w.cam.h;
      const score = g.seconds + 60 * g.minutes + 3600 * g.hours + 1000 * g.basidistrutte + g.victory * 1000;
      d.setColour(c.black);
      d.setAlpha(i.fogalpha);
      if (i.fogalpha > 0) d.rectangle(0, 0, vw, vh, false);
      d.setAlpha(1);
      if (i.fogalpha < 1) return;
      d.setColour(c.white);
      d.setHalign("center");
      d.text(vw / 2, vh / 2 - 200, "Your town hall was destroyed.");
      d.text(vw / 2, vh / 2 - 100, "You resisted for " + g.hours + " hours, " + g.minutes + " minutes and " + g.seconds + " seconds.");
      d.text(vw / 2, vh / 2, g.basidistrutte + " enemy bases were sucessfully destroyed.");
      d.text(vw / 2, vh / 2 + 100, "The final score is " + score);
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
      d.setAlpha(0.69);
      d.roundrectColourExt(W - 520, 20, W - 120, 38 + 30 * nobs, 60, 60, c.white, c.white, false);
      d.setFont("GUI_1");
      d.setColour(c.black);
      d.setValign("bottom");
      d.setHalign("left");
      d.setAlpha(0.75);
      d.setFont("overdue");
      const strike = (y, s) => { d.setColour(c.black); d.rectangle(W - 500, y, W - 500 + d.stringWidth(s), y + 2, false); };
      if (w.room === "match") {
        d.text(W - 500, 58, "Survive for the most time possible");
        d.text(W - 500, 88, "Destroy the enemy secondary bases (" + g.basidistrutte + "/3)");
        d.text(W - 500, 118, "Survival time: " + g.hours + " hrs " + g.minutes + " min " + g.seconds + " sec");
        d.text(W - 500, 148, "Number of waves: " + g.waves);
      }
      if (w.room === "lvl01") {
        d.text(W - 500, 58, "Reach the norther gates and escape the city");
        if (g.dialogochest === 1) d.text(W - 500, 88, "Destroy the chests to gather resources");
        if (g.lvl01_gate === 1) d.text(W - 500, 118, "Use the barracks to train more soldiers");
      }
      if (w.room === "lvl02") {
        const free = "Free the villages under attack (" + g.liberati + "/7)";
        d.text(W - 500, 58, free);
        if (g.liberati === 7) strike(43, free);
        d.text(W - 500, 88, "Use the freed paesants to build your base");
        d.text(W - 500, 118, "Destroy all the enemy buildings");
        if (w.number("enemy_build") === 0) strike(103, "Destroy all the enemy buildings");
      }
      d.setFont("GUI_1");
      d.setValign("middle");
      d.setAlpha(1);
    },
  };
}
