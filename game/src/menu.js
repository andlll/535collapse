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
import { SK_MAPS, SK_OPTIONS, loadSkirmish, saveSkirmish, optionLabel } from "./skirmish.js";
import { Particles, partType } from "./particles.js";

export const LEVELS = ["Shove the sun aside", "A long walk", "The monastery", "Crossing a bridge", "The siege",
  "One hundred towers", "Our old gods", "Escape from the city", "Allies", "The last day"];
const ROOMS = { 1: "lvl01", 2: "lvl02", 3: "lvl03", 4: "lvl04", 5: "lvl05", 6: "lvl06" }; // lvl06: §9.101
export const STORY = {
  1: "It's over. Someone betrayed our city and guided the enemy to a secret entrance. They claimed to come here to bring back the glory of the old empire, but they brought back only death and destruction. We must find our way out to survive and start a resistance.",
  2: "An army of survivors makes its way out of the city into the hills. Their priority is to free the citizens imprisoned by the invaders.",
  // [§9.24] scritto per il porting: il livello 3 e' nuovo (§9.11)
  3: "The soldiers are alone, far from home. The invaders are seeking one last stronghold to conquer: if that falls too, there will be no one left to stop them.",
  // [§9.52] scritto per il porting, da rivedere con l'autore
  4: "The road to the invaders' town is cut by a river, and its only bridge lies in ruins. It must be rebuilt under the raids of an enemy camp: beyond the river, the enemy is waiting.",
  // [§9.76] scritto per il porting dalla regia dell'autore, da rivedere con lui
  5: "The invaders struck right outside our town, but the attack broke against our soldiers. Chasing the survivors we reached their city: mighty walls, watchtowers, and no way in without siege engines. The only stone nearby lies in the ruins of an ancient acropolis.",
  // [§9.101] scritto per il porting dalla regia dell'autore, su sua richiesta
  6: "The invaders' city has fallen, and the road home crosses the City of a Hundred Towers. We find it in ruins: its garrison is dead, its armory looted, its towers crumbling. Enemy patrols still roam the streets, and a great column is marching to cross the eastern bridge. The citizens have only their bows left: with them, and with their towers, they must hold.",
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
// [§9.119, richiesta dell'autore] "Full screen" non piu' nella colonna (con
// la schermaglia c'era "traffico"): un pulsante tondo in alto a destra col
// simbolo, come quelli della campagna (indietro, lucchetto). full: [x, y, r].
const BTN_W = 400, BTN_H = 70, BTN_GAP = 20;
const FULL_BTN = [50, 50, 30]; // dal bordo destro, dall'alto, raggio
function titleButtons(W, H) {
  const keys = ["tutorial", "campaign", "skirmish", "load"]; // skirmish: §9.118
  const top = H - 100 - keys.length * BTN_H - (keys.length - 1) * BTN_GAP;
  const out = { top };
  keys.forEach((k, n) => {
    const y = top + n * (BTN_H + BTN_GAP);
    out[k] = [W / 2 - BTN_W / 2, y, W / 2 + BTN_W / 2, y + BTN_H];
  });
  out.full = fullscreenAvailable() ? [W - FULL_BTN[0], FULL_BTN[1], FULL_BTN[2]] : null;
  return out;
}
// [Fase 4] il pannello delle partite salvate
const ROW_H = 50, ROW_GAP = 12, PANEL_W = 640;
export function roomLabel(room) {
  if (room === "match") return tr("Tutorial");
  const n = { lvl01: 1, lvl02: 2, lvl03: 3, lvl04: 4, lvl05: 5, lvl06: 6 }[room];
  return n ? n + ". " + tr(LEVELS[n - 1]) : room;
}
// L'etichetta dello slot di una room (livello e data), o null se e' vuoto;
// anche nel menu di pausa (pause.js, §9.39)
export function slotLabel(room) {
  const info = slotInfo(room);
  if (!info) return null;
  let date = "";
  try { date = new Date(info.date).toLocaleString(getLanguage(), { dateStyle: "short", timeStyle: "short" }); } catch (e) { /* data non valida */ }
  return roomLabel(room) + "  -  " + date;
}
function loadRows(W, H) {
  const rows = [];
  for (const room of SAVE_ROOMS) {
    const label = slotLabel(room);
    if (label) rows.push({ label, action: "slot", room });
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

// [§9.118] La schermata della schermaglia. [§9.121, disegno dell'autore]
// A sinistra un riquadro solo: la foto della mappa, sotto il nome con le
// frecce per scorrere le mappe, sotto la descrizione in corsivo. A destra i
// parametri in una griglia 3 x 3 di riquadri: in alto il titolo, al centro
// l'icona del valore attuale fra due frecce, in basso il nome del valore.
// La meta' sinistra di un riquadro torna al valore prima, la destra passa a
// quello dopo. "Indietro" e' il cerchio in alto a destra (§9.120), "Inizia"
// in basso a destra.
// [§9.131, richiesta dell'autore] Il riquadro della mappa finisce al bordo
// basso della terza fila dei parametri (prima arrivava fino a "Inizia"). La
// descrizione ci deve stare in tutte le lingue: skDescH e' l'altezza della
// piu' lunga nella lingua attuale (misurata in drawSkirmish, righe da 30 px)
// e, se manca posto, la foto si rimpicciolisce (3:2, centrata).
const SK_KEYS = () => Object.keys(SK_OPTIONS);
const skCardW = (W) => Math.min(440, W * 0.33);
let skDescH = 150, skDescKey = "";
function skLayout(W, H) {
  const top = 110, gap = 18;
  const lx1 = Math.max(30, W * 0.05), LW = skCardW(W);
  const ch = Math.min(200, (H - top - 120 - 2 * gap) / 3);
  // (su uno schermo basso, se la foto piu' piccola, 120 px, e la descrizione
  // non ci stanno, il riquadro scende quanto serve, fino a 40 px dal fondo)
  const bottom = Math.max(top + 3 * ch + 2 * gap, Math.min(H - 40, top + 20 + 120 + 80 + skDescH + 30));
  const rows = [];
  const card = { x1: lx1, y1: top, x2: lx1 + LW, y2: bottom };
  // 20 sopra la foto, 40 + 40 per il nome, la descrizione e 30 sotto
  let photoW = LW - 40, photoH = Math.round(photoW * 2 / 3);
  const room = bottom - top - 20 - 80 - skDescH - 30;
  if (photoH > room) { photoH = Math.max(120, Math.round(room)); photoW = Math.round(photoH * 1.5); }
  const px = lx1 + (LW - photoW) / 2;
  const photo = [px, top + 20, px + photoW, top + 20 + photoH];
  const nameY = photo[3] + 40;
  rows.push({ kind: "map", dir: -1, circle: [lx1 + 45, nameY, 22] });
  rows.push({ kind: "map", dir: 1, circle: [lx1 + LW - 45, nameY, 22] });
  const gx1 = card.x2 + 40, gx2 = W - 40;
  const cw = (gx2 - gx1 - 2 * gap) / 3;
  SK_KEYS().forEach((key, k) => {
    const cx = gx1 + (k % 3) * (cw + gap), cy = top + Math.floor(k / 3) * (ch + gap);
    rows.push({ kind: "opt", key, dir: -1, x1: cx, y1: cy, x2: cx + cw / 2, y2: cy + ch, card: [cx, cy, cx + cw, cy + ch] });
    rows.push({ kind: "opt", key, dir: 1, x1: cx + cw / 2, y1: cy, x2: cx + cw, y2: cy + ch, card: [cx, cy, cx + cw, cy + ch] });
  });
  rows.push({ kind: "back", circle: [W - 50, 50, 30] });
  rows.push({ kind: "start", x1: gx2 - 300, y1: H - 100, x2: gx2, y2: H - 45 });
  return { rows, card, photo, nameY, descY: nameY + 40, cw, ch };
}
// il valore dopo (dir 1) o prima (dir -1) di un parametro
function stepValue(key, v, dir) {
  const vs = SK_OPTIONS[key].values, k = vs.indexOf(v);
  return vs[((k < 0 ? 0 : k) + dir + vs.length) % vs.length];
}
// la mappa mostrata (anche quelle "in arrivo"): indice in SK_MAPS
const shownMap = (i) => (i.skMap ?? Math.max(0, SK_MAPS.findIndex((m) => m.room === i.sk.map)));

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
                         loadmenu: 0, loadhover: 0, loadrow: -1, fullhover: 0,
                         skmenu: 0, skhover: 0, skrow: -1, sk: null }); // §9.118
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
      if (g.campagna === 0 && i.loadmenu === 0 && i.skmenu === 0) {
        const b = titleButtons(W, H);
        i.hover = +inRect(mx, my, ...b.tutorial);
        i.campagnahover = +inRect(mx, my, ...b.campaign);
        i.loadhover = +inRect(mx, my, ...b.load);
        i.fullhover = +(!!b.full && Math.hypot(mx - b.full[0], my - b.full[1]) < b.full[2]);
        i.skhover = +inRect(mx, my, ...b.skirmish);
      } else {
        i.hover = i.campagnahover = i.loadhover = i.fullhover = i.skhover = 0;
      }
      i.skrow = -1;
      if (g.campagna === 0 && i.skmenu === 1) {
        const L = skLayout(W, H);
        L.rows.forEach((r, k) => {
          if (r.kind === "start" && !SK_MAPS[shownMap(i)].room) return; // una mappa non ancora fatta
          const on = r.circle ? Math.hypot(mx - r.circle[0], my - r.circle[1]) < r.circle[2] : inRect(mx, my, r.x1, r.y1, r.x2, r.y2);
          if (on) i.skrow = k;
        });
        skRainStep(i, L); // §9.121: la pioggia nel riquadro della pioggia
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
          if (inRect(mx, my, 30, 35 + 40 * k, i.listR || 290, 85 + 40 * k) && shownLevel(g, k)) i.lvlhover = k;
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
      if (i.skmenu === 1) { i.skmenu = 0; return; } // §9.118
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
      if (g.campagna === 0 && i.skmenu === 1) { // §9.118
        const r = skLayout(w.cam.cssW, w.cam.cssH).rows[i.skrow];
        if (!r) return;
        if (r.kind === "back") { i.skmenu = 0; return; }
        if (r.kind === "map") {
          i.skMap = (shownMap(i) + r.dir + SK_MAPS.length) % SK_MAPS.length;
          if (SK_MAPS[i.skMap].room) i.sk.map = SK_MAPS[i.skMap].room;
        }
        if (r.kind === "opt") i.sk[r.key] = stepValue(r.key, i.sk[r.key], r.dir);
        saveSkirmish(i.sk);
        if (r.kind === "start") w.gotoRoom(i.sk.map);
        return;
      }
      if (g.campagna === 0 && i.skhover === 1) { i.skmenu = 1; i.skhover = 0; i.sk = loadSkirmish(); i.skMap = null; return; }
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
      if (room && inRect(mx, my, 30, 35 + 40 * i.lvlhover, i.listR || 290, 85 + 40 * i.lvlhover)) { w.gotoRoom(room); return; }
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
      if (g.campagna === 0 && i.loadmenu === 0 && i.skmenu === 0) drawTitle(i, d, W, H);
      if (g.campagna === 0 && i.skmenu === 1) drawSkirmish(i, d, W, H); // §9.118
      if (g.campagna === 0 && i.loadmenu === 1) drawLoad(i, d, W, H);
      if (g.campagna === 1) drawCampaign(i, g, d, W, H);
      d.setAlpha(1);
      d.setColour(c.white);
    },
  };
}

// [Richiesta dell'autore, §9.73] la versione in basso a sinistra: 0.AANN,
// AA l'anno e NN un progressivo, che sale di 1 a ogni nuova PR (CLAUDE.md)
const VERSION = "0.2610";
const LOGO_MARGIN = 40; // §9.72
function drawTitle(i, d, W, H) {
  const b = titleButtons(W, H);
  const btn = [["tutorial", i.hover, tr("Play the tutorial")], ["campaign", i.campagnahover, tr("Campaign - Collapse")],
               ["skirmish", i.skhover, tr("Skirmish")], // §9.118
               ["load", i.loadhover, tr("Load game")]];
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
  if (b.full) drawFullButton(d, ...b.full, i.fullhover, isFullscreen()); // §9.119
  d.setFont("overdue");
  // una volta su otto, la frase dell'autore al posto della firma [C, §3.20 n.75];
  // [richiesta dell'autore] l'anno della firma e' 2026 (l'originale: 2025)
  d.text(W / 2, H - 50, i.testo !== 8 ? "Mount Fuji Software, 2026"
    : "Non mi interessa se sta roba non ingrana quando soffro d'insonnia e non dormo da una settimana");
  d.setHalign("left");
  // [Richiesta dell'autore] la versione del porting (l'originale: 0.250125)
  d.text(20, H - 50, VERSION);
  d.setAlpha(1);
  // [Correzione, §3.20 n.76] il logo a y=350 copriva "Play the tutorial"
  // con finestre basse: sale a meta' dello spazio sopra i pulsanti
  // [§9.47, richiesta dell'autore] il titolo "Dust Veil" al posto del "535"
  // [§9.72] "Dust Veil: Collapse" su due righe, disegnato grande
  // (tools/13_logo.py) e rimpicciolito: al piu' meta' della larghezza dello
  // schermo, e dentro lo spazio sopra i pulsanti con LOGO_MARGIN px sopra e
  // sotto (1920 x 1080: 82%, 1280 x 720: 52%)
  const lg = d.a.sprites.logo_dustveil;
  const s = lg ? Math.min(1, (b.top - 2 * LOGO_MARGIN) / lg.height, W / 2 / lg.width) : 1;
  d.spriteExt("logo_dustveil", 0, W / 2, Math.min(350, b.top / 2), s, s, 0, c.white, 1);
}

// [§9.119] Il pulsante tondo dello schermo intero: il cerchio di vetro dei
// pulsanti della campagna e il simbolo di sempre, quattro angoli verso
// l'esterno (entra) o verso il centro (esci)
function drawFullButton(d, x, y, r, hover, on) {
  d.setAlpha(hover ? 0.99 : 0.69);
  d.circleColour(x, y, r, c.white, c.white, false);
  d.setAlpha(0.75);
  const S = 11, L = 7, IN = 4;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const [px, py, dir] = on ? [x + sx * IN, y + sy * IN, 1] : [x + sx * S, y + sy * S, -1];
      d.lineWidthColour(px, py, px + dir * sx * L, py, 3, c.black, c.black);
      d.lineWidthColour(px, py, px, py + dir * sy * L, 3, c.black, c.black);
    }
  }
  d.setAlpha(1);
}

// [§9.118] la schermata della schermaglia.
// [§9.120, richiesta dell'autore] senza il riquadro bianco di sfondo, come il
// menu di pausa: titolo e descrizione in nero con un alone bianco
// (glowText, come pause.js _glowLabel); "Indietro" e' il cerchio in alto a
// destra della campagna
function glowText(d, x, y, str, wrapW = 0) {
  d.setColour(c.white);
  for (const [r, a] of [[5, 0.04], [4, 0.06], [3, 0.09], [2, 0.13], [1, 0.2]]) {
    d.setAlpha(a);
    for (let n = 0; n < 16; n++) {
      const t = (n / 16) * Math.PI * 2, gx = x + Math.cos(t) * r, gy = y + Math.sin(t) * r;
      if (wrapW) d.textExt(gx, gy, str, 30, wrapW); else d.text(gx, gy, str);
    }
  }
  d.setColour(c.black);
  d.setAlpha(0.85);
  if (wrapW) d.textExt(x, y, str, 30, wrapW); else d.text(x, y, str);
}
function drawSkirmish(i, d, W, H) {
  // §9.131: l'altezza della descrizione piu' lunga, per lingua e larghezza
  const dw = skCardW(W) - 48, dkey = getLanguage() + ":" + dw;
  if (dkey !== skDescKey) {
    d.setFont("overdue");
    const h = Math.max(0, ...SK_MAPS.map((q) => (q.desc ? d.stringHeightExt(tr(q.desc), 30, dw) : 0)));
    if (h > 0) { skDescH = h; skDescKey = dkey; } // (0: il font non c'e' ancora)
  }
  const L = skLayout(W, H), { card, photo } = L, m = SK_MAPS[shownMap(i)];
  d.setHalign("center");
  d.setValign("middle");
  d.setFont("gui_sblocco");
  glowText(d, W / 2, 55, tr("Skirmish"));
  // la mappa: riquadro, foto, nome con le frecce, descrizione in corsivo
  d.setAlpha(0.69);
  d.roundrectColourExt(card.x1, card.y1, card.x2, card.y2, 50, 50, c.white, c.white, false);
  const pw = photo[2] - photo[0], ph = photo[3] - photo[1];
  const spr = m.room && d.a.sprites[m.room + "_cartolina"];
  if (spr) {
    const k = Math.min(pw / spr.width, ph / spr.height);
    d.spriteExt(m.room + "_cartolina", 0, (photo[0] + photo[2]) / 2, (photo[1] + photo[3]) / 2, k, k, 0, c.white, 1);
  } else {
    d.setAlpha(0.35);
    d.roundrectColourExt(photo[0], photo[1], photo[2], photo[3], 30, 30, c.gray, c.gray, false);
  }
  d.setFont("GUI_1");
  d.setColour(c.black);
  d.setAlpha(m.room ? 0.85 : 0.45);
  d.text((card.x1 + card.x2) / 2, L.nameY, tr(m.name)); // §9.129: tradotto
  d.setFont("overdue");
  d.setHalign("left");
  d.setValign("top");
  d.slant = 0.2;
  d.setAlpha(m.room ? 0.8 : 0.45);
  d.textExt(card.x1 + 24, L.descY, tr(m.desc), 30, card.x2 - card.x1 - 48);
  d.slant = 0;
  d.setHalign("center");
  d.setValign("middle");
  // i parametri: un riquadro per due righe (le due meta')
  const seen = new Set();
  const rainOnTop = () => { if (i.skRainPs) i.skRain.draw(i.skRainPs, d.r, d.a, { x: 0, y: 0, w: W, h: H }); };
  L.rows.forEach((r, k) => {
    if (r.kind === "map") { arrow(d, ...r.circle, r.dir, i.skrow === k); return; }
    if (r.kind === "back") {
      const [cx, cy, rad] = r.circle;
      d.setAlpha(i.skrow === k ? 0.99 : 0.69);
      d.circleColour(cx, cy, rad, c.white, c.white, false);
      d.setAlpha(1);
      d.spriteExt("ico_indietro", 0, cx, cy, 0.6, 0.6, 0, c.white, 1);
      return;
    }
    if (r.kind === "start") {
      const on = !!m.room;
      d.setAlpha(!on ? 0.3 : i.skrow === k ? 0.99 : 0.69);
      d.roundrectColourExt(r.x1, r.y1, r.x2, r.y2, 50, 50, c.white, c.white, false);
      d.setFont("GUI_1");
      d.setColour(c.black);
      d.setAlpha(on ? 0.8 : 0.35);
      d.text((r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2, tr("Start"));
      return;
    }
    if (seen.has(r.key)) return;
    seen.add(r.key);
    const [x1, y1, x2, y2] = r.card, cx = (x1 + x2) / 2, hov = i.skrow === k || i.skrow === k + 1;
    d.setAlpha(hov ? 0.9 : 0.69);
    d.roundrectColourExt(x1, y1, x2, y2, 40, 40, c.white, c.white, false);
    d.setFont("overdue");
    d.setColour(c.black);
    d.setAlpha(0.8);
    d.text(cx, y1 + 26, tr(SK_OPTIONS[r.key].label));
    const iy = (y1 + y2) / 2 + 2;
    drawOptIcon(d, r.key, i.sk[r.key], cx, iy, i);
    arrow(d, x1 + 24, iy, 14, -1, i.skrow === k);
    arrow(d, x2 - 24, iy, 14, 1, i.skrow === k + 1);
    d.setFont("overdue");
    d.setColour(c.black);
    d.setAlpha(0.8);
    d.text(cx, y2 - 24, optionLabel(r.key, i.sk[r.key]));
    if (r.key === "rain") rainOnTop();
  });
  d.setAlpha(1);
  d.setHalign("left");
  d.setValign("middle");
}

// una freccia a sinistra (dir -1) o a destra (dir 1). [§9.131, richiesta
// dell'autore] il disegno dell'autore (ico_sk_freccia, indietro), specchiato
// per avanti, al posto del triangolo di linee: alta quanto il triangolo
// (2,6 volte 0,45 r)
function arrow(d, x, y, r, dir, hover) {
  const s = (r * 0.45 * 2.6) / 24;
  d.spriteExt("ico_sk_freccia", 0, x, y, -dir * s, s, 0, c.white, hover ? 0.95 : 0.55);
  d.setAlpha(1);
}

// [§9.121] Le icone dei valori (provvisorie, da rifare a mano a mano con
// l'autore): le icone del gioco dove ce n'e' una adatta, se no linee.
// [§9.131] I disegni dell'autore: la mano con la bilancia (Equilibrato), la
// colomba (tregua), la nuvola (visibilita'), la luna; le spade incrociate
// nere della caserma (ico_caserma) al posto di quelle marroni (ico_battle),
// l'unico sprite marrone fra quelli neri. [§9.133] Anche l'occhio
// (visibilita' Totale) e i lingotti (Economico): disegni dell'autore a
// risoluzione maggiore, al posto delle icone piccole del gioco ingrandite.
// Difficolta': spade, una in piu' a ogni livello (decisione dell'autore);
// risorse: i quattro simboli delle risorse, piu' grandi a ogni livello
// (decisione dell'autore); la pioggia la disegnano le particelle
// (skRainStep), qui niente.
const DARK = 0x3c3c3c;
function icon(d, name, x, y, s = 1, a = 0.85) { d.spriteExt(name, 0, x, y, s, s, 0, c.white, a); }
function drawOptIcon(d, key, v, x, y, i) {
  d.setAlpha(1);
  if (key === "difficulty") {
    const n = { easy: 1, normal: 2, hard: 3, rigged: 4 }[v] || 1;
    for (let k = 0; k < n; k++) icon(d, "ico_attacco", x + (k - (n - 1) / 2) * 26, y, 0.62, v === "rigged" ? 1 : 0.85);
  } else if (key === "style") {
    if (v === "random") { d.setFont("gui_sblocco"); d.setColour(DARK); d.setAlpha(0.85); d.text(x, y, "?"); }
    else icon(d, { balanced: "ico_sk_equilibrio", aggressive: "ico_caserma", defensive: "ico_difesa", economic: "ico_sk_oro",
                   raider: "ico_cavaliere" }[v], x, y, { balanced: 0.85, aggressive: 0.8, defensive: 0.75, economic: 0.9, raider: 0.75 }[v]);
  } else if (key === "victory") {
    icon(d, v === "conquest" ? "ico_ruin" : v === "townhall" ? "ico_centro" : "ico_campana", x, y, 0.75);
  } else if (key === "resources") {
    const s = { low: 0.8, normal: 1, high: 1.2 }[v] || 1;
    ["ico_food", "ico_wood", "ico_gold", "ico_stone"].forEach((n, k) => icon(d, n, x + (k - 1.5) * 34 * s, y, s));
  } else if (key === "pop") {
    icon(d, "ico_multi", x, y, { 50: 0.55, 75: 0.72, 99: 0.9 }[v] || 0.7);
  } else if (key === "truce") {
    icon(d, v ? "ico_sk_colomba" : "ico_caserma", x, y, 0.8);
    if (v) { d.setFont("overdue"); d.setColour(DARK); d.setAlpha(0.9); d.text(x + 40, y + 18, String(v)); }
  } else if (key === "fog") {
    if (v === "none") icon(d, "ico_sk_occhio", x, y, 0.8); // §9.133: il disegno dell'autore
    else icon(d, "ico_sk_visibilita", x, y, 0.85, v === "explored" ? 0.4 : 0.85);
  } else if (key === "daynight") {
    if (v === "day") sun(d, x, y, 1);
    else if (v === "night") moon(d, x, y, 1);
    else { sun(d, x - 16, y, 0.75); moon(d, x + 18, y, 0.75); }
  }
}
function sun(d, x, y, s) {
  d.setAlpha(0.85);
  d.circleColour(x, y, 9 * s, DARK, DARK, false);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    d.lineWidthColour(x + Math.cos(a) * 13 * s, y + Math.sin(a) * 13 * s, x + Math.cos(a) * 19 * s, y + Math.sin(a) * 19 * s, 3, DARK, DARK);
  }
}
function moon(d, x, y, s) { icon(d, "ico_sk_luna", x, y, s); } // §9.131: il disegno dell'autore

// [§9.121, richiesta dell'autore] La pioggia nel riquadro della pioggia,
// col sistema di particelle della partita (le gocce, effects.js GOCCIA, piu'
// lente e scure, tagliate all'altezza del riquadro): niente con "NO", di
// piu' con "Frequente". Le particelle sono del menu (skRain), non del mondo.
let SK_DROP = null;
function skRainStep(i, L) {
  const r = L.rows.find((q) => q.kind === "opt" && q.key === "rain");
  if (!r) return;
  const [x1, y1, x2, y2] = r.card;
  if (!i.skRain) { i.skRain = new Particles(); i.skRainPs = i.skRain.systemCreate(0, "rain"); }
  const fall = y2 - y1 - 85, speed = 7;
  if (!SK_DROP || SK_DROP.fall !== fall) {
    SK_DROP = partType({ shape: "line", orientation: [160, 170, 0, 0, true], size: [0.18, 0.28, 0, 0], scale: [1, 2.5],
      colour: { rgb: [70, 95, 95, 120, 120, 150] }, alpha: [0.75], speed: [speed, speed + 1.5, 0, 0], direction: [250, 258, 0, 0],
      life: [Math.floor(fall / (speed + 1.5)), Math.floor(fall / speed)] });
    SK_DROP.fall = fall;
  }
  const n = { normal: 1, frequent: 3, off: 0 }[i.sk.rain] || 0;
  for (let k = 0; k < n; k++) i.skRain.create(i.skRainPs, x1 + 55 + Math.random() * (x2 - x1 - 90), y1 + 44, SK_DROP, 1); // fra le frecce
  i.skRain.step();
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
const L3_LABEL = [403, -155]; // §9.51: sopra il campanile del segnalino nuovo
const L3_ARROW = [399, 2, 1.2, 1.1, -60];
// [§9.51, indicazione dell'autore] il livello 4: il ponte a ovest del
// monastero, sul fiume piccolo (il fiume grande a nord e' l'Adriatico), con
// la freccia dal 3
const L4_MARK = [186, -108];
const L4_LABEL = [186, -180];
const L4_ARROW = [291, -94, 0.9, 1.0, -10];
// [§9.76, richiesta dell'autore] il livello 5 (cap_l5, il castello blu
// dell'autore): sotto il 4, in fondo alla catena montuosa al centro
const L5_MARK = [95, 60];
const L5_LABEL = [95, -22];
const L5_ARROW = [150, -25, 0.8, 1.0, 58];
// [§9.101, indicazione dell'autore] il livello 6 (cap_l6, la Citta' delle
// Cento Torri): a ovest del ponte del 4, sopra il 5, con la freccia dal 5.
// [§9.102, richiesta dell'autore] un po' piu' piccolo (lato 100, era 120):
// il numero scende con lui
const L6_MARK = [-3, -123];
const L6_LABEL = [-3, -190];
const L6_ARROW = [46, -31, 0.9, 1.0, -62];

function drawCampaign(i, g, d, W, H) {
  d.setAlpha(0.9);
  // [§9.27] la mappa (1597 px, centrata) si sposta a sinistra quanto serve
  // perche' il segnalino del livello 1 (la citta', 663 px a destra del
  // centro, largo 171) resti nello schermo: sotto i 1536 px di larghezza
  // usciva a destra. A sinistra c'e' comunque l'elenco dei livelli.
  const MX = W / 2 + Math.min(0, W / 2 - 20 - (663 + 85));
  d.sprite("mappa_camp", 0, MX, H / 2);
  // [Richiesta dell'autore] i pannelli di vetro sfocano la mappa, non la
  // battaglia sotto
  d.refreshGlass();
  if (i.sblocco === 0 && g.unlock > 0) {
    // segnaposto dei livelli sulla mappa
    d.setColour(DARKRED);
    d.setFont("GUI_1");
    d.setHalign("center");
    if (i.lvlshown > 0) {
      d.sprite("cap1", 0, MX + 663, H / 2 + 78);
      d.text(MX + 663, H / 2 + 128, "1.");
    }
    if (i.lvlshown > 1) {
      d.sprite("cap2", 0, MX + 463, H / 2 + 28);
      d.sprite("fr_corta", 0, MX + 563, H / 2 + 53);
      d.text(MX + 463, H / 2 + 88, "2.");
    }
    // [§9.13, richiesta dell'autore] il livello 3: il monastero e la
    // freccia dal 2 ([§9.51] il segnalino disegnato dall'autore, cap_l3)
    if (i.lvlshown > 2) {
      d.sprite("cap_l3", 0, MX + L3_MARK[0], H / 2 + L3_MARK[1]);
      d.spriteExt("fr_corta", 0, MX + L3_ARROW[0], H / 2 + L3_ARROW[1], L3_ARROW[2], L3_ARROW[3], L3_ARROW[4], c.white, 1);
      d.text(MX + L3_LABEL[0], H / 2 + L3_LABEL[1], "3.");
    }
    // [§9.51] il livello 4: il ponte (cap_l4) e la freccia dal 3
    if (i.lvlshown > 3) {
      d.sprite("cap_l4", 0, MX + L4_MARK[0], H / 2 + L4_MARK[1]);
      d.spriteExt("fr_corta", 0, MX + L4_ARROW[0], H / 2 + L4_ARROW[1], L4_ARROW[2], L4_ARROW[3], L4_ARROW[4], c.white, 1);
      d.text(MX + L4_LABEL[0], H / 2 + L4_LABEL[1], "4.");
    }
    if (i.lvlshown > 4) {
      d.sprite("cap_l5", 0, MX + L5_MARK[0], H / 2 + L5_MARK[1]);
      d.spriteExt("fr_corta", 0, MX + L5_ARROW[0], H / 2 + L5_ARROW[1], L5_ARROW[2], L5_ARROW[3], L5_ARROW[4], c.white, 1);
      d.text(MX + L5_LABEL[0], H / 2 + L5_LABEL[1], "5.");
    }
    if (i.lvlshown > 5) {
      d.sprite("cap_l6", 0, MX + L6_MARK[0], H / 2 + L6_MARK[1]);
      d.spriteExt("fr_corta", 0, MX + L6_ARROW[0], H / 2 + L6_ARROW[1], L6_ARROW[2], L6_ARROW[3], L6_ARROW[4], c.white, 1);
      d.text(MX + L6_LABEL[0], H / 2 + L6_LABEL[1], "6.");
    }
    d.setColour(c.black);
    d.setFont("overdue");
  }
  // [§9.47] l'elenco si allarga per il nome piu' lungo (con Cinzel il
  // tedesco usciva di 1 px): bordo destro i.listR, prima fisso a 290
  d.setFont("overdue");
  let longest = 0;
  LEVELS.forEach((name, k) => { if (shownLevel(g, k + 1)) longest = Math.max(longest, d.stringWidth(k + 1 + ". " + tr(name))); });
  i.listR = Math.max(290, 40 + longest + 20);
  d.setAlpha(0.69);
  d.roundrectColourExt(20, 20, i.listR + 10, 90 + 40 * shownCount(g), 60, 60, c.white, c.white, false);
  d.setAlpha(i.c_indhover ? 0.99 : 0.69);
  d.circleColour(W - 50, 50, 30, c.white, c.white, false);
  d.setAlpha(i.c_unlhover ? 0.99 : 0.69);
  if (i.sblocco === 0) d.circleColour(W - 120, 50, 30, c.white, c.white, false);
  d.setAlpha(0.99);
  // la storia del livello sotto il puntatore
  d.setFont("overdue");
  if (i.lvlhover > 0) d.roundrectColourExt(30, 35 + 40 * i.lvlhover, i.listR, 85 + 40 * i.lvlhover, 50, 50, c.white, c.white, false);
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
  // [§9.27] icona e scritta centrate insieme, l'icona a sinistra della
  // scritta: in francese, spagnolo, portoghese e tedesco la scritta, piu'
  // lunga, finiva sotto l'icona (che stava ferma a -63)
  const label = tr("Unlock level"), tw = d.stringWidth(label), ICON = 32, GAP = 10;
  const left = W / 2 - (ICON + GAP + tw) / 2;
  d.spriteExt("ico_lock", 0, left + ICON / 2, H / 2 + 144, 0.5, 0.5, 0, c.white, 1);
  d.setColour(c.black);
  d.setHalign("left");
  d.text(left + ICON + GAP, H / 2 + 145, label);
  d.setHalign("center");
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
