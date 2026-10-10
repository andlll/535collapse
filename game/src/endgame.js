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
      const next = { lvl01: 2, lvl02: 3, lvl03: 4 }[w.room];
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
      if (w.room === "lvl03") d.text(vw / 2, vh / 2 - 100, tr("The monastery has held out: the invaders' advance is broken"));
      const code = { lvl01: "4 9 2 1 7", lvl02: "5 8 4 2 1", lvl03: "9 3 0 7 6" }[w.room];
      if (code) {
        d.text(vw / 2, vh / 2 + 200, tr("Code to unlock the next level:"));
        d.setFont("gui_sblocco");
        d.text(vw / 2, vh / 2 + 300, code);
      }
      // [§9.27] col font dei testi: dopo il codice restava quello grande
      // delle cifre (gui_sblocco) e nei livelli la scritta era enorme
      d.setFont("overdue");
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
      d.text(vw / 2, vh / 2 - 200, w.room === "lvl03" ? tr("The monastery has fallen.") : tr("Your town hall was destroyed."));
      d.text(vw / 2, vh / 2 - 100, tr("You resisted for {h} hours, {m} minutes and {s} seconds.", { h: g.hours, m: g.minutes, s: g.seconds }));
      d.text(vw / 2, vh / 2, tr("{n} enemy bases were successfully destroyed.", { n: g.basidistrutte }));
      d.text(vw / 2, vh / 2 + 100, tr("The final score is {score}", { score }));
    },
  };
}

// [§9.27] Il bordo destro dei pulsanti in alto a sinistra (colonne da 450 a
// 730, raggio 30) piu' 10 px
const TOP_BUTTONS_RIGHT = 770;

// La cifra piu' larga col font corrente (i font non sono a spaziatura fissa)
function widestDigit(d) {
  let best = "0", bw = -1;
  for (const ch of "0123456789") { const cw = d.stringWidth(ch); if (cw > bw) { bw = cw; best = ch; } }
  return best;
}

// objective_button [C]: il riquadro degli obiettivi in alto a destra (O lo
// nasconde). Creato dal manager in match, da dialogo_1_2 e dialogo_2_5.
export function objectiveButton() {
  return {
    create(i) { i.sprite_index = null; },
    drawGUI(i, w, d) {
      const g = w.g, W = w.cam.cssW;
      if (g.obj !== 1) return;
      // [§9.27] non sopra le schermate di vittoria e di sconfitta
      if (w.number("victory_manager") || w.number("gameover_manager")) return;
      const nobs = w.room === "match" ? 4 : 3;
      const mmss = (steps) => { const t = Math.ceil(steps / 60); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
      // [y, testo, barrato]
      const lines = [];
      // [§9.22] testi che contano solo per la larghezza del riquadro (non si
      // disegnano): le righe con i numeri che cambiano, coi numeri piu' larghi
      const sizing = [];
      if (w.room === "match") {
        lines.push([58, tr("Survive for the most time possible")]);
        lines.push([88, tr("Destroy the enemy secondary bases ({n}/3)", { n: g.basidistrutte })]);
        lines.push([118, tr("Survival time: {h} hrs {m} min {s} sec", { h: g.hours, m: g.minutes, s: g.seconds })]);
        lines.push([148, tr("Number of waves: {n}", { n: g.waves })]);
      }
      if (w.room === "lvl01") {
        lines.push([58, tr("Reach the northern gates and escape the city")]);
        if (g.dialogochest === 1) lines.push([88, tr("Destroy the chests to gather resources")]);
        if (g.lvl01_gate === 1) lines.push([118, tr("Use the barracks to train more soldiers")]);
      }
      if (w.room === "lvl02") {
        lines.push([58, tr("Free the villages under attack ({n}/7)", { n: g.liberati }), g.liberati === 7 ? 43 : 0]);
        lines.push([88, tr("Use the freed peasants to build your base")]);
        lines.push([118, tr("Destroy all the enemy buildings"), w.number("enemy_build") === 0 ? 103 : 0]);
      }
      // [§9.11] livello 3: prima il villaggio, poi il conto alla rovescia,
      // la vita del monastero e (saputo da dove vengono) la base nemica
      if (w.room === "lvl03") {
        const L = g.l3 || { phase: 0 };
        if (L.phase !== 2) lines.push([58, tr("Follow the road to reach the village")]);
        else {
          lines.push([58, tr("Defend the monastery: {t}", { t: mmss(L.left) })]);
          lines.push([88, tr("Monastery: {life} / {slife} (lost below half)", { life: L.life, slife: L.slife })]);
          // [§9.22, richiesta dell'autore] la larghezza non segue la vita
          // del monastero (che cala in fretta: il riquadro si allargava e
          // stringeva di continuo) ne' il conto alla rovescia: la si misura
          // con tutte le cifre alla cifra piu' larga del font, la vita con
          // quante ne ha la vita massima
          d.setFont("overdue");
          const wide = widestDigit(d), digits = (v) => wide.repeat(String(v).length);
          sizing.push(tr("Defend the monastery: {t}", { t: digits(99) + ":" + digits(99) }));
          sizing.push(tr("Monastery: {life} / {slife} (lost below half)", { life: digits(L.slife), slife: digits(L.slife) }));
          if (L.baseKnown) {
            const done = w.number("enemy_caserma") + w.number("enemy_stalla") === 0;
            lines.push([118, tr("Destroy the enemy barracks and stables"), done ? 103 : 0]);
          }
        }
      }
      // il riquadro dell'originale (da W-520 a W-120, testo da W-500) si
      // allarga verso sinistra se un testo tradotto non ci sta.
      // [§9.27] ma non sopra i pulsanti in alto a sinistra (costruzione,
      // produzione, comportamento: fino a TOP_BUTTONS_RIGHT): oltre, le righe
      // vanno a capo e il riquadro cresce in altezza (in spagnolo copriva
      // l'ultima colonna dei pulsanti). Sugli schermi stretti, dove gia'
      // l'originale li toccava, resta com'era.
      d.setFont("overdue");
      const maxW = Math.max(0, ...lines.map(([, s]) => d.stringWidth(s)), ...sizing.map((s) => d.stringWidth(s)));
      const room = Math.max(0, W - 520 - TOP_BUTTONS_RIGHT);
      const ex = Math.min(Math.max(0, Math.ceil(maxW - 360)), room);
      const x = W - 500 - ex, wrapW = 360 + ex;
      const wrap = (s) => (d.stringWidth(s) > wrapW ? d._lines(s, 30, wrapW) : [s]);
      const extra = lines.reduce((n, [, s]) => n + wrap(s).length - 1, 0);
      d.setAlpha(0.69);
      d.roundrectColourExt(W - 520 - ex, 20, W - 120, 38 + 30 * nobs + 30 * extra, 60, 60, c.white, c.white, false);
      d.setFont("GUI_1");
      d.setColour(c.black);
      d.setValign("bottom");
      d.setHalign("left");
      d.setAlpha(0.75);
      d.setFont("overdue");
      let down = 0;
      for (const [y, str, strikeY] of lines) {
        for (const piece of wrap(str)) {
          d.text(x, y + down, piece);
          if (strikeY) { d.setColour(c.black); d.rectangle(x, strikeY + down, x + d.stringWidth(piece), strikeY + down + 2, false); }
          down += 30;
        }
        down -= 30;
      }
      d.setFont("GUI_1");
      d.setValign("middle");
      d.setAlpha(1);
    },
  };
}
