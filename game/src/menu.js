// Il menu principale [C, enemy_manager_menu: Create, Alarm_0, Step_End,
// Draw_GUI, Mouse_GlobalLeftReleased, KeyPress_Escape] e le nuvole di
// nebbia che lo attraversano (fog_controller, fog01). Nomi originali.
//
// - Schermata iniziale: logo, "Play the tutorial" (match) e "Campaign -
//   Collapse", firma e versione in basso.
// - Campagna (global.campagna=1): la mappa `mappa_camp`, l'elenco dei 10
//   livelli a sinistra, la storia del livello sotto il puntatore in basso,
//   il pulsante indietro e il lucchetto. Si gioca cliccando il livello.
// - Lucchetto (sblocco=1): cinque rotelle 0-9 (meta' alta +1, meta' bassa
//   -1) e "Unlock level": un codice giusto (quelli che la vittoria di ogni
//   livello mostra) sblocca il livello, uno sbagliato fa lampeggiare le
//   cifre di rosso.
// - Dietro, la battaglia: le unita' della room si attaccano a ondate (ogni
//   9000 passi, la prima dopo 120) e la nebbia passa.
//
// - [Fase 4] "Load game": le partite salvate di ogni room (save.js, una per
//   room, con la data) e "Load from file"; "Full screen" (dove il browser
//   lo permette).
//
// [Decisioni dell'autore, §0.14/§0.15] lo sblocco e' persistente e parte da
// 1 (l'originale lo rimetteva a 2 a ogni apertura del menu); i livelli 3-10
// erano nell'elenco "in arrivo" (non giocabili): [richiesta dell'autore]
// ora l'elenco mostra solo i livelli sbloccati e giocabili. [§3.20, testi]
// i testi passano da tr().
//
// [Richiesta dell'autore] i quattro pulsanti della schermata iniziale in
// colonna, alti uguali (titleButtons).

import { c, makeColourRgb, mergeColour } from "./colours.js";
import { tr, getLanguage } from "./i18n.js";
import { slotInfo, SAVE_ROOMS } from "./save.js";
import { fullscreenAvailable, isFullscreen } from "./fullscreen.js";
import { saveUnlock } from "./progress.js";
import { irandomRange } from "./gm.js";

export const LEVELS = ["Shove the sun aside", "A long walk", "The monastery", "Crossing a bridge", "The siege",
  "One hundred towers", "Our old gods", "Escape from the city", "Allies", "The last day"];
const ROOMS = { 1: "lvl01", 2: "lvl02", 3: "lvl03" };
export const STORY = {
  1: "It's over. Someone betrayed our city and guided the enemy to a secret entrance. They claimed to come here to bring back the glory of the old empire, but they brought back only death and destruction. We must find our way out to survive and start a resistance.",
  2: "An army of survivors makes its way out of the city into the hills. Their priority is to free the citizens imprisoned by the invaders.",
  // [§9.24] scritto per il porting: il livello 3 e' nuovo (§9.11)
  3: "The soldiers are alone, far from home. The invaders are seeking one last stronghold to conquer: if that falls too, there will be no one left to stop them.",
};
// i codici del lucchetto [C, Mouse_GlobalLeftReleased]: livello -> cifre
export const CODES = { 2: [4, 9, 2, 1, 7], 3: [5, 8, 4, 2, 1], 4: [9, 3, 0, 7, 6], 5: [1, 2, 7, 9, 4], 6: [8, 0, 6, 5, 3],
                7: [0, 7, 3, 6, 0], 8: [7, 6, 3, 0, 8], 9: [3, 5, 1, 6, 0], 10: [2, 1, 9, 4, 7] };
const DARKRED = makeColourRgb(139, 0, 0);
// [Richiesta dell'autore] nell'elenco solo i livelli sbloccati e giocabili:
// niente piu' livelli bloccati ne' "in arrivo"
const shownLevel = (g, n) => !!ROOMS[n] && (n === 1 || g.unlock > n - 1);
const shownCount = (g) => LEVELS.reduce((m, _, k) => (shownLevel(g, k + 1) ? k + 1 : m), 0);
const WHEEL_X = [-240, -120, 0, 120, 240];

const inRect = (x, y, x1, y1, x2, y2) => x > x1 && y > y1 && x < x2 && y < y2;

// [Richiesta dell'autore] i pulsanti della schermata iniziale in una
// colonna, tutti alti BTN_H: "Play the tutorial", "Campaign - Collapse",
// "Load game" (prima in alto a destra) e "Full screen" (prima in alto a
// sinistra, solo dove il browser lo permette). L'ultimo finisce a 100 px
// dal fondo, dove finiva "Campaign - Collapse". [x1, y1, x2, y2] per chiave.
const BTN_W = 400, BTN_H = 70, BTN_GAP = 20;
function titleButtons(W, H) {
  const keys = ["tutorial", "campaign", "load"];
  if (fullscreenAvailable()) keys.push("full");
  const top = H - 100 - keys.length * BTN_H - (keys.length - 1) * BTN_GAP;
  const out = { top };
  keys.forEach((k, n) => {
    const y = top + n * (BTN_H + BTN_GAP);
    out[k] = [W / 2 - BTN_W / 2, y, W / 2 + BTN_W / 2, y + BTN_H];
  });
  return out;
}
// [Fase 4] il pannello delle partite salvate
const ROW_H = 50, ROW_GAP = 12, PANEL_W = 640;
export function roomLabel(room) {
  if (room === "match") return tr("Tutorial");
  const n = { lvl01: 1, lvl02: 2, lvl03: 3 }[room];
  return n ? n + ". " + tr(LEVELS[n - 1]) : room;
}
function loadRows(W, H) {
  const rows = [];
  for (const room of SAVE_ROOMS) {
    const info = slotInfo(room);
    if (!info) continue;
    let date = "";
    try { date = new Date(info.date).toLocaleString(getLanguage(), { dateStyle: "short", timeStyle: "short" }); } catch (e) { /* data non valida */ }
    rows.push({ label: roomLabel(room) + "  -  " + date, action: "slot", room });
  }
  if (!rows.length) rows.push({ label: tr("No saved games"), action: null });
  rows.push({ label: tr("Load from file"), action: "file" });
  rows.push({ label: tr("Back"), action: "back" });
  const total = rows.length * ROW_H + (rows.length - 1) * ROW_GAP;
  let y = Math.max(140, (H - total) / 2);
  const x1 = W / 2 - PANEL_W / 2 + 30, x2 = W / 2 + PANEL_W / 2 - 30;
  for (const r of rows) { Object.assign(r, { x1, y1: y, x2, y2: y + ROW_H }); y += ROW_H + ROW_GAP; }
  return rows;
}

export function enemyManagerMenu() {
  return {
    create(i, w) {
      const g = w.g;
      i.sprite_index = null;
      i.alarm.set(0, 120);
      // alarm[1]=9000 "arrivo prima wave": l'oggetto non ha un Alarm_1 [C]
      for (const [x, y] of [[3070, 650], [1100, 550], [1600, 1000], [2500, 950], [2080, 1630], [3100, 1500]]) {
        w.create("fog_controller", x, y);
      }
      i.testo = irandomRange(1, 8);
      // [Correzione decisa dall'autore, §3.20 n.73] l'originale partiva da
      // "null", che si leggeva nel riquadro: vuoto finche' non si tocca un
      // livello
      i.testo_c = "";
      i.testo_h = 0;
      if (g.campagna !== 1) g.campagna = 0;
      Object.assign(i, { hover: 0, campagnahover: 0, sblocco: 0, c_indhover: 0, c_unlhover: 0, lvlhover: 0, lvlshown: 0,
                         comb: [0, 0, 0, 0, 0], combHover: null, sblocco_hover: 0, redamount: 0,
                         loadmenu: 0, loadhover: 0, loadrow: -1, fullhover: 0 });
    },
    // Alarm_0 [C]: le unita' ferme vanno contro il nemico piu' vicino
    alarm0(i, w) {
      const order = (from, to) => {
        if (!w.exists(to)) return;
        for (const u of w.all(from)) {
          if (u.action === 1 || u.action === 2 || u.action === 6) continue;
          const t = w.nearest(u.x, u.y, to);
          u.target_eu = t;
          u.dirox = t.x; u.diroy = t.y;
          if (from === "enemy_unit") { u.targetx = u.dirox; u.targety = u.diroy; }
          u.action = 1;
          u.warwork = 1;
          u.alarm.set(0, 15);
        }
      };
      order("enemy_unit", "ally_unit");
      order("ally_unit", "enemy_unit");
      i.alarm.set(0, 9000);
    },
    // Step_End [C]: le posizioni sotto il puntatore
    stepEnd(i, w) {
      const g = w.g, W = w.cam.cssW, H = w.cam.cssH, mx = w.input.x, my = w.input.y;
      g.sele = -1; // nel menu le unita' non si selezionano
      if (g.campagna === 0 && i.loadmenu === 0) {
        const b = titleButtons(W, H);
        i.hover = +inRect(mx, my, ...b.tutorial);
        i.campagnahover = +inRect(mx, my, ...b.campaign);
        i.loadhover = +inRect(mx, my, ...b.load);
        i.fullhover = +(!!b.full && inRect(mx, my, ...b.full));
      } else {
        i.hover = i.campagnahover = i.loadhover = i.fullhover = 0;
      }
      i.loadrow = -1;
      if (g.campagna === 0 && i.loadmenu === 1) {
        loadRows(W, H).forEach((r, k) => { if (r.action && inRect(mx, my, r.x1, r.y1, r.x2, r.y2)) i.loadrow = k; });
      }
      if (g.campagna === 1) {
        i.c_indhover = +inRect(mx, my, W - 80, 20, W - 20, 70);
        i.c_unlhover = +inRect(mx, my, W - 150, 20, W - 90, 70);
        // [Correzione decisa dall'autore, §3.20 n.74] l'originale lasciava
        // evidenziata l'ultima riga toccata anche col puntatore fuori
        // dall'elenco: ora l'evidenziazione (e il clic) segue il puntatore;
        // storia e segnaposto sulla mappa restano quelli dell'ultimo livello
        // toccato (lvlshown), cosi' la storia si legge scendendo col puntatore
        i.lvlhover = 0;
        for (let k = 1; k <= 10; k++) {
          if (inRect(mx, my, 30, 35 + 40 * k, 290, 85 + 40 * k) && shownLevel(g, k)) i.lvlhover = k;
        }
        if (i.lvlhover > 0) i.lvlshown = i.lvlhover;
        i.combHover = null;
        i.sblocco_hover = 0;
        if (i.sblocco === 1) {
          WHEEL_X.forEach((dx, k) => {
            const x1 = W / 2 + dx - 50, x2 = W / 2 + dx + 50;
            if (inRect(mx, my, x1, H / 2 - 100, x2, H / 2)) i.combHover = [k, +1];
            if (inRect(mx, my, x1, H / 2, x2, H / 2 + 100)) i.combHover = [k, -1];
          });
          i.sblocco_hover = +inRect(mx, my, W / 2 - 170, H / 2 + 120, W / 2 + 170, H / 2 + 170);
        }
      }
      if (i.redamount > 0) i.redamount -= 0.03125;
    },
    keyPress27(i, w) {
      if (i.loadmenu === 1) { i.loadmenu = 0; return; }
      if (i.sblocco === 0) w.g.campagna = 0; else i.sblocco = 0;
    },
    globalLeftReleased(i, w) {
      const g = w.g, mx = w.input.x, my = w.input.y;
      if (g.campagna === 0 && i.loadmenu === 1) {
        const r = loadRows(w.cam.cssW, w.cam.cssH)[i.loadrow];
        if (!r) return;
        if (r.action === "back") i.loadmenu = 0;
        if (r.action === "slot" && w.hooks.loadSlot) w.hooks.loadSlot(r.room);
        if (r.action === "file" && w.hooks.loadFile) w.hooks.loadFile();
        return;
      }
      if (g.campagna === 0 && i.loadhover === 1) { i.loadmenu = 1; i.loadhover = 0; return; }
      if (g.campagna === 0 && i.fullhover === 1) { if (w.hooks.fullscreen) w.hooks.fullscreen(); return; }
      if (g.campagna === 0) {
        if (i.hover === 1) { w.gotoRoom("match"); return; }
        if (i.campagnahover === 1) { g.campagna = 1; return; }
      }
      if (i.c_indhover === 1) {
        if (i.sblocco === 0) { g.campagna = 0; i.c_indhover = 0; return; }
        i.sblocco = 0;
      }
      const room = ROOMS[i.lvlhover];
      if (room && inRect(mx, my, 30, 35 + 40 * i.lvlhover, 290, 85 + 40 * i.lvlhover)) { w.gotoRoom(room); return; }
      if (i.c_unlhover === 1) { i.sblocco = 1; i.c_unlhover = 0; return; }
      if (i.sblocco === 1) {
        if (i.combHover) {
          const [k, d] = i.combHover;
          i.comb[k] = (i.comb[k] + d + 10) % 10;
          return;
        }
        if (i.sblocco_hover === 1) {
          // il primo codice giusto che sblocca piu' di quanto gia' sbloccato
          const lvl = Object.keys(CODES).map(Number)
            .find((l) => CODES[l].every((v, k) => v === i.comb[k]) && g.unlock < l);
          if (lvl) { g.unlock = lvl; saveUnlock(lvl); } else i.redamount = 1;
        }
      }
    },
    drawGUI(i, w, d) {
      const g = w.g, W = w.cam.cssW, H = w.cam.cssH;
      d.setBlend("normal");
      if (g.campagna === 0 && i.loadmenu === 0) drawTitle(i, d, W, H);
      if (g.campagna === 0 && i.loadmenu === 1) drawLoad(i, d, W, H);
      if (g.campagna === 1) drawCampaign(i, g, d, W, H);
      d.setAlpha(1);
      d.setColour(c.white);
    },
  };
}

function drawTitle(i, d, W, H) {
  const b = titleButtons(W, H);
  const btn = [["tutorial", i.hover, tr("Play the tutorial")], ["campaign", i.campagnahover, tr("Campaign - Collapse")],
               ["load", i.loadhover, tr("Load game")],
               ["full", i.fullhover, tr(isFullscreen() ? "Exit full screen" : "Full screen")]];
  d.setHalign("center");
  d.setValign("middle");
  d.setFont("GUI_1");
  for (const [k, hov, label] of btn) {
    if (!b[k]) continue;
    const [x1, y1, x2, y2] = b[k];
    d.setAlpha(hov ? 0.99 : 0.69);
    d.roundrectColourExt(x1, y1, x2, y2, 60, 60, c.white, c.white, false);
    d.setColour(c.black);
    d.setAlpha(0.75);
    d.text(W / 2, (y1 + y2) / 2, label);
  }
  d.setFont("overdue");
  // una volta su otto, la frase dell'autore al posto della firma [C, §3.20 n.75];
  // [richiesta dell'autore] l'anno della firma e' 2026 (l'originale: 2025)
  d.text(W / 2, H - 50, i.testo !== 8 ? "Mount Fuji Software, 2026"
    : "Non mi interessa se sta roba non ingrana quando soffro d'insonnia e non dormo da una settimana");
  d.setHalign("left");
  // [Richiesta dell'autore] la versione del porting (l'originale: 0.250125)
  d.text(20, H - 50, "0.2601");
  d.setAlpha(1);
  // [Correzione, §3.20 n.76] il logo a y=350 copriva "Play the tutorial"
  // con finestre basse: sale a meta' dello spazio sopra i pulsanti
  d.sprite("logo535", 0, W / 2, Math.min(350, b.top / 2));
}

// [Fase 4] le partite salvate, nello stile dei pulsanti del menu
function drawLoad(i, d, W, H) {
  const rows = loadRows(W, H);
  const top = rows[0].y1 - 90, bottom = rows[rows.length - 1].y2 + 30;
  d.setAlpha(0.69);
  d.roundrectColourExt(W / 2 - PANEL_W / 2, top, W / 2 + PANEL_W / 2, bottom, 60, 60, c.white, c.white, false);
  d.setHalign("center");
  d.setValign("middle");
  d.setColour(c.black);
  d.setFont("gui_sblocco");
  d.setAlpha(0.8);
  d.text(W / 2, top + 45, tr("Load game"));
  d.setFont("GUI_1");
  rows.forEach((r, k) => {
    if (r.action) {
      d.setAlpha(i.loadrow === k ? 0.99 : 0.69);
      d.roundrectColourExt(r.x1, r.y1, r.x2, r.y2, 50, 50, c.white, c.white, false);
    }
    d.setColour(c.black);
    d.setAlpha(r.action ? 0.75 : 0.4);
    d.text(W / 2, (r.y1 + r.y2) / 2, r.label);
  });
  d.setHalign("left");
}

// [§9.13] segnalino del livello 3 [dx, dy dal centro della mappa], numero
// [dx, dy] e freccia [dx, dy, scala x, scala y, angolo]: dove li ha
// disegnati l'autore, subito sopra il livello 2 (463, 28), per lasciare
// libera la mappa ai livelli che verranno; la freccia del collegamento 1-2
// appena allungata, dal lato sinistro dei soldati verso il monastero
const L3_MARK = [403, -81];
const L3_LABEL = [403, -140];
const L3_ARROW = [399, 2, 1.2, 1.1, -60];

function drawCampaign(i, g, d, W, H) {
  d.setAlpha(0.9);
  d.sprite("mappa_camp", 0, W / 2, H / 2);
  // [Richiesta dell'autore] i pannelli di vetro sfocano la mappa, non la
  // battaglia sotto
  d.refreshGlass();
  if (i.sblocco === 0 && g.unlock > 0) {
    // segnaposto dei livelli sulla mappa
    d.setColour(DARKRED);
    d.setFont("GUI_1");
    d.setHalign("center");
    if (i.lvlshown > 0) {
      d.sprite("cap1", 0, W / 2 + 663, H / 2 + 78);
      d.text(W / 2 + 663, H / 2 + 128, "1.");
    }
    if (i.lvlshown > 1) {
      d.sprite("cap2", 0, W / 2 + 463, H / 2 + 28);
      d.sprite("fr_corta", 0, W / 2 + 563, H / 2 + 53);
      d.text(W / 2 + 463, H / 2 + 88, "2.");
    }
    // [§9.13, richiesta dell'autore] il livello 3: il monastero (segnalino
    // ricavato dallo sprite del corpo, tools/nuovi.py) e la freccia dal 2
    if (i.lvlshown > 2) {
      d.sprite("cap_monastero", 0, W / 2 + L3_MARK[0], H / 2 + L3_MARK[1]);
      d.spriteExt("fr_corta", 0, W / 2 + L3_ARROW[0], H / 2 + L3_ARROW[1], L3_ARROW[2], L3_ARROW[3], L3_ARROW[4], c.white, 1);
      d.text(W / 2 + L3_LABEL[0], H / 2 + L3_LABEL[1], "3.");
    }
    d.setColour(c.black);
    d.setFont("overdue");
  }
  d.setAlpha(0.69);
  d.roundrectColourExt(20, 20, 300, 90 + 40 * shownCount(g), 60, 60, c.white, c.white, false);
  d.setAlpha(i.c_indhover ? 0.99 : 0.69);
  d.circleColour(W - 50, 50, 30, c.white, c.white, false);
  d.setAlpha(i.c_unlhover ? 0.99 : 0.69);
  if (i.sblocco === 0) d.circleColour(W - 120, 50, 30, c.white, c.white, false);
  d.setAlpha(0.99);
  // la storia del livello sotto il puntatore
  d.setFont("overdue");
  if (i.lvlhover > 0) d.roundrectColourExt(30, 35 + 40 * i.lvlhover, 290, 85 + 40 * i.lvlhover, 50, 50, c.white, c.white, false);
  if (i.lvlshown > 0) {
    i.testo_c = STORY[i.lvlshown] ? tr(STORY[i.lvlshown]) : tr("Coming soon");
    // [C, §3.20 n.73] l'altezza si misura con righe da 40 px, il testo si
    // scrive con righe da 30
    i.testo_h = d.stringHeightExt(i.testo_c, 40, W - 80);
  }
  d.setAlpha(1);
  d.spriteExt("ico_indietro", 0, W - 50, 50, 0.6, 0.6, 0, c.white, 1);
  if (i.sblocco === 0) d.sprite("ico_lock", 0, W - 120, 50);
  d.setAlpha(0.8);
  d.setHalign("left");
  d.setValign("middle");
  d.setColour(c.black);
  d.setFont("GUI_1");
  d.text(40, 50, "Collapse");
  d.setFont("overdue");
  LEVELS.forEach((name, k) => {
    const n = k + 1;
    if (!shownLevel(g, n)) return;
    d.setAlpha(0.8);
    d.text(40, 60 + 40 * n, n + ". " + tr(name));
  });
  d.setValign("top");
  d.setAlpha(0.69);
  d.roundrectColourExt(30, H - 30, W - 30, H - 50 - i.testo_h, 50, 50, c.white, c.white, false);
  d.setAlpha(0.8);
  d.textExt(40, H - 40 - i.testo_h, i.testo_c, 30, W - 80);
  if (i.sblocco === 1) drawLock(i, d, W, H);
}

function drawLock(i, d, W, H) {
  WHEEL_X.forEach((dx, k) => {
    d.setAlpha(i.combHover && i.combHover[0] === k ? 0.99 : 0.69);
    d.roundrectColourExt(W / 2 + dx - 50, H / 2 - 100, W / 2 + dx + 50, H / 2 + 100, 50, 50, c.white, c.white, false);
  });
  d.setAlpha(i.sblocco_hover ? 0.99 : 0.69);
  d.roundrectColourExt(W / 2 - 170, H / 2 + 120, W / 2 + 170, H / 2 + 170, 50, 50, c.white, c.white, false);
  for (const dx of WHEEL_X) {
    d.spriteExt("ico_back", 0, W / 2 + dx, H / 2 - 70, 0.5, 0.5, 270, c.white, 1);
    d.spriteExt("ico_back", 0, W / 2 + dx, H / 2 + 70, 0.5, 0.5, 90, c.white, 1);
  }
  d.setFont("gui_sblocco");
  d.setValign("middle");
  d.setHalign("center");
  d.setAlpha(0.8);
  d.setColour(mergeColour(c.black, c.red, Math.max(0, Math.min(1, i.redamount))));
  WHEEL_X.forEach((dx, k) => d.text(W / 2 + dx, H / 2, i.comb[k]));
  d.setFont("overdue");
  d.spriteExt("ico_lock", 0, W / 2 - 63, H / 2 + 144, 0.5, 0.5, 0, c.white, 1);
  d.setColour(c.black);
  d.text(W / 2 + 17, H / 2 + 145, tr("Unlock level"));
}

// fog_controller [C]: 13 nuvole (fog01) attorno a se', di nuovo ogni 2000
// passi
const CLOUDS = [[0, 200], [400, 200], [800, 200], [0, 100], [400, 100], [800, 100], [0, 0], [400, 0], [800, 0],
                [1200, 100], [-400, 100], [400, -100], [400, 300]];
export function fogController() {
  const spawn = (i, w) => {
    for (const [dx, dy] of CLOUDS) w.create("fog01", i.x + dx, i.y + dy);
    i.alarm.set(0, 2000);
  };
  return { create(i, w) { i.sprite_index = null; spawn(i, w); }, alarm0: spawn };
}

// fog01 [C]: compare in 30 passi, va a destra a 1 px per passo, dopo 4970
// passi svanisce e a 5000 sparisce
export function fog01() {
  return {
    create(i) {
      i.depth = -i.y - 100;
      i.alfa = 0;
      i.alarm.set(0, 5000);
      i.alarm.set(1, 1);
      i.alarm.set(2, 4970);
      i.direction = 0; // action_move("000001000", 1): a destra
      i.speed = 1;
    },
    alarm0(i, w) { w.destroy(i); },
    alarm1(i) { if (i.alfa < 1) { i.alfa += 0.034; i.alarm.set(1, 1); } },
    alarm2(i) { if (i.alfa > 0) { i.alfa -= 0.034; i.alarm.set(2, 1); } },
    draw(i, w, d) {
      d.setAlpha(i.alfa);
      d.sprite("fog1", 0, i.x, i.y);
      d.setAlpha(1);
    },
  };
}
