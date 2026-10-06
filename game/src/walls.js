// Mura e porte: cantieri (mura_ori_fond, mura_vert_fond), tratti finiti
// (mura_ori, mura_vert), porte (porta_ori, porta_vert), i pulsanti "+" per
// prolungare un tratto (mplus_*), i placer dei prolungamenti
// (muraplacer_*), le anteprime dei tratti (oodl, oosl, ovbl, oval) e il
// pulsante della porta (gate_clicker). Il pulsante e il placer del primo
// tratto sono in buildings.js (famiglia "mura").
//
// Orizzontale (ori) e verticale (vert) sono lo stesso codice con nomi e
// offset diversi [C, confronto evento per evento: STUDIO.md §3.7].
//
// Le anteprime hanno per parent mura_ori o mura_vert [C, objects.json]: in
// GameMaker ereditano tutti gli eventi che non ridefiniscono, compreso il
// Destroy che libera la griglia dei costi (difetto §3.7 n.26). Il mondo
// risale i parent come GameMaker, quindi la correzione (§3.8) ridefinisce
// nelle anteprime gli eventi che non devono ereditare.
//
// Correzioni decise dall'autore (§3.8): muri e porte spariscono a vita 0
// (n.27); i riparatori di una porta si fermano (n.24); Canc rimborsa
// quanto pagato (n.28); la scheda della porta in view_hport (n.29); la
// porta e' percorribile per il giocatore e ostacolo per i nemici.

import { tr } from "./i18n.js";
import { pointDirection } from "./gm.js";
import { panel, lifeBar, repairEnd, sendRepair, armBuilders } from "./buildings.js";

const WHITE = 0xffffff, RED = 0x0000ff;

// Dati per orientamento [C]: mura_*_fond Step (pulsanti "+", sprite della
// seconda fase), porta_* Create/Step (vita, sprite aperta e chiusa).
const KIND = {
  ori: { fond: "mura_ori_fond", wall: "mura_ori", gate: "porta_ori", f2: "m_ori_f2",
         plus: [["mplus_os", -219, 0], ["mplus_od", 207, 0]],
         gateLife: 600, open: ["m_ori_pa", "m_ori_pa_mask"], closed: ["m_ori_p", "m_ori_p"] },
  vert: { fond: "mura_vert_fond", wall: "mura_vert", gate: "porta_vert", f2: "m_vert_f2",
          plus: [["mplus_vb", 0, 0], ["mplus_va", 0, -300]],
          gateLife: 800, open: ["m_vert_pa", "m_vert_pa_mask"], closed: ["m_vert_p", "m_vert_p"] },
};

// `with(x){if hover=1 var h=1 else var h=0}` [C]: vale l'ultima istanza
// visitata; senza istanze la variabile resta non assegnata, cioe' 0 [I].
function lastHover(w, name) {
  let h = 0;
  for (const c of w.all(name)) h = c.hover === 1 ? 1 : 0;
  return h;
}

function destroyAll(w, ...names) {
  for (const n of names) for (const c of w.all(n)) w.destroy(c);
}

function plusButtons(w, i, k) {
  for (const [n, dx, dy] of KIND[k].plus) w.create(n, i.x + dx, i.y + dy);
}

// ------------------------------------------------------------- cantieri

// mura_*_fond [C]: un ally_fondamenta come gli altri cantieri (slife 799,
// +5 a ogni scatto dei costruttori), con in piu' i pulsanti "+" quando e'
// selezionato.
export function wallFond(k, p) {
  const K = KIND[k], plusNames = K.plus.map(([n]) => n);
  return {
    create(i, w) {
      p.markInstance(i, 1000);
      i.alarm.set(0, 1);
      i.depth = -i.y;
      Object.assign(i, { life: 1, slife: 799, selected: 0, fase: 0, phase: 0, fondazione: 1, pietra: 0, legno: 0 });
      if (i.paid === undefined) i.paid = 50; // 40 se nasce da un'anteprima (n.28)
      w.g.sele = 0;
      // le anteprime e i placer dei prolungamenti spariscono
      destroyAll(w, "oval", "ovbl", "oosl", "oodl", "muraplacer_va", "muraplacer_vb", "muraplacer_os", "muraplacer_od");
    },
    alarm0(i, w) { armBuilders(i, w, p, "buildwork", w.mouse.x, w.mouse.y); },
    step(i, w) {
      if (i.selected === 1 && w.number(plusNames[0]) === 0) plusButtons(w, i, k);
      if (i.life >= i.slife) { w.create(K.wall, i.x, i.y); w.destroy(i); return; }
      if (i.phase === 0 && i.life > i.slife / 2 && i.sprite_index !== K.f2) { i.sprite_index = K.f2; i.phase = 1; }
    },
    globalLeftPressed(i, w) {
      if (lastHover(w, plusNames[0]) !== 1 && lastHover(w, plusNames[1]) !== 1) {
        i.selected = 0;
        destroyAll(w, ...plusNames);
      }
    },
    leftReleased(i, w) { if (w.g.sele === 0) i.selected = 1; },
    rightReleased(i, w) {
      for (const o of w.all("ally_omino")) if (o.selected === 1) o.buildwork = 1;
      i.buildwork = 1;
    },
    // KeyPress_Delete [C]: annulla e rimborsa. [Correzioni §3.8 n.28 e §3.5
    // n.20] il rimborso e' quanto pagato (50 o 40), le celle si liberano.
    keyPress46(i, w) {
      if (i.selected !== 1) return;
      p.markInstance(i, 1);
      w.destroy(i);
      w.g.stone += i.paid;
      destroyAll(w, ...plusNames);
    },
    drawGUI(i, w, dr) { if (i.selected === 1) panel(dr, i, "ico_mura"); },
  };
}

// --------------------------------------------------------- tratti finiti

// mura_ori / mura_vert [C]. [Correzione §3.8 n.27] l'originale non
// controlla mai la vita: qui a 0 (nemici, o Canc che mette life=0) il
// tratto sparisce, senza rovina, coi suoi pulsanti se era selezionato.
export function wall(k, p) {
  const plusNames = KIND[k].plus.map(([n]) => n);
  return {
    create(i) {
      p.markInstance(i, 1000);
      i.depth = -i.y;
      Object.assign(i, { life: 800, slife: 800, selected: 0, arm: 1, fondazione: 0, legno: 0, pietra: 1, hit: 0 });
    },
    alarm0(i) { i.arm = 1; },
    destroy(i) { p.markInstance(i, 1); },
    step(i, w) {
      if (i.life <= 0) {
        if (i.selected === 1) destroyAll(w, "gate_clicker", ...plusNames);
        w.destroy(i);
        return;
      }
      if (i.selected === 1 && w.number("gate_clicker") === 0) {
        plusButtons(w, i, k);
        w.create("gate_clicker", 0, 0);
      }
      repairEnd(i, w);
    },
    drawEnd(i, w, dr) {
      if (i.selected === 1) lifeBar(dr, i);
      if (i.hover === 1 || i.hit === 1) lifeBar(dr, i);
    },
    drawGUI(i, w, dr) {
      if (i.selected !== 1) return;
      dr.setAlpha(0.69);
      dr.roundrectColourExt(260, 20, 390, 150, 60, 60, WHITE, WHITE, false);
      dr.circleColour(450, 50, 30, WHITE, WHITE, false);
      dr.setFont("GUI_1");
      dr.setColour(0);
      dr.setAlpha(0.75);
      dr.setValign("middle");
      dr.setHalign("center");
      dr.text(325, 120, i.life + " / " + i.slife);
      dr.setAlpha(1);
      dr.sprite("ico_mura", 0, 325, 70);
      dr.spriteExt("ico_gate", 0, 450, 50, 0.5, 0.5, 0, WHITE, 1);
    },
    keyPress46(i) { if (i.selected === 1) i.life = 0; },
    globalLeftPressed(i, w) {
      const ho1 = lastHover(w, "gate_clicker"), ho2 = lastHover(w, plusNames[0]), ho3 = lastHover(w, plusNames[1]);
      if (ho1 !== 1 && ho2 !== 1 && ho3 !== 1) {
        i.selected = 0;
        destroyAll(w, "gate_clicker", ...plusNames);
      }
    },
    leftReleased(i, w) { if (w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1; },
    rightReleased(i, w) { if (i.life < i.slife) sendRepair(i, w); },
  };
}

// ---------------------------------------------------------------- porte

// porta_ori / porta_vert [C]: un tratto che si apre quando l'unita' alleata
// piu' vicina (per origine) ha il bbox a meno di 20 px.
//
// Griglia dei costi: nell'originale la porta marca le sue celle, ma il
// tratto che sostituisce, distrutto subito dopo, le libera tutte: per i
// percorsi la porta e' sempre aperta, ed e' voluto per il giocatore
// [autore]. [Deviazione decisa dall'autore, §3.8] qui la porta lascia
// libere le celle (lo stesso risultato, scritto esplicitamente) e le segna
// come ostacolo nella griglia dei soli nemici.
export function gate(k, p) {
  const K = KIND[k], plusNames = K.plus.map(([n]) => n);
  // (le celle "ostacolo per i nemici" restano quelle della maschera di
  // creazione: aprire e chiudere non le cambia)
  const setLook = (i, w, [spr, mask]) => { i.sprite_index = spr; i.mask_index = mask; w.moved(i); };
  return {
    create(i, w) {
      // (porta_ori Create rimette mask_index=m_ori_pa_mask, gia' quella
      // dell'oggetto) celle della porta chiusa (la maschera aperta e' solo i pilastri):
      // libere per il giocatore, ostacolo per i nemici
      i.mask_index = K.closed[1]; w.moved(i);
      p.markInstance(i, 1);
      i.enemyCells = p.blockEnemy(i);
      i.mask_index = w.objects[K.gate].mask; w.moved(i);
      // [§7.4, segnalazione dell'autore] i pilastri (la maschera aperta)
      // restano ostacolo: liberando tutta la porta chiusa il flow field
      // passava anche dai pilastri e i soldati (che sul flow field si
      // muovono senza collisioni) attraversavano la parte solida. Libero
      // resta solo il varco.
      p.markInstance(i, 1000);
      i.depth = -i.y;
      Object.assign(i, { life: K.gateLife, slife: K.gateLife, selected: 0, open: 0, openable: 1, arm: 1,
                         fondazione: 0, legno: 0, pietra: 1, hit: 0 });
      if (k === "vert") i.armed = 1;
    },
    alarm0(i) { i.arm = 1; },
    // porta_ori Alarm_1 [C] voleva liberare tre celle al centro (con un
    // errore di precedenza: §3.7 n.25). Non serve: le celle della porta
    // sono gia' libere (create qui sopra), quindi non si porta.
    alarm10(i) { i.armed = 1; },
    destroy(i) {
      p.markInstance(i, 1);
      if (i.enemyCells) { p.unblockEnemy(i.enemyCells); i.enemyCells = null; }
    },
    step(i, w) {
      // [Correzione §3.8 n.27] a vita 0 la porta sparisce
      if (i.life <= 0) {
        if (i.selected === 1) destroyAll(w, ...plusNames);
        w.destroy(i);
        return;
      }
      if (i.selected === 1 && w.number(plusNames[0]) === 0) plusButtons(w, i, k);
      // "fine riparazione": nell'originale mancano xpos e ypos e i
      // riparatori di una porta non si fermano mai (§3.7 n.24).
      // [Correzione §3.8] la stessa regola degli altri edifici.
      repairEnd(i, w);
      // apertura: in porta_ori l'if senza graffe regge solo open=1, sprite e
      // maschera si riassegnano a ogni passo; porta_vert (armed, alarm 10)
      // ricontrolla al piu' ogni 30 passi [C]
      if (i.openable === 1 && (k === "ori" || i.armed === 1)) {
        const u = w.nearest(i.x, i.y, "ally_unit");
        const near = !!u && w.distanceToInstance(i, u) < 20;
        if (near) { if (i.open === 0) i.open = 1; } else if (i.open === 1) i.open = 0;
        if (k === "vert") { i.armed = 0; i.alarm.set(10, 30); }
        setLook(i, w, near ? K.open : K.closed);
      }
    },
    drawEnd(i, w, dr) {
      if (i.selected === 1) lifeBar(dr, i);
      if (i.hover === 1 || i.hit === 1) lifeBar(dr, i);
    },
    drawGUI(i, w, dr) { if (i.selected === 1) panel(dr, i, "ico_gate"); },
    keyPress46(i) { if (i.selected === 1) i.life = 0; },
    globalLeftPressed(i, w) {
      if (lastHover(w, plusNames[0]) !== 1 && lastHover(w, plusNames[1]) !== 1) {
        i.selected = 0;
        destroyAll(w, ...plusNames);
      }
    },
    leftReleased(i, w) { if (w.number("clicchero") === 0 && w.g.sel === 0) i.selected = 1; },
    rightReleased(i, w) { if (i.life < i.slife) sendRepair(i, w); },
  };
}

// --------------------------------------------------------- prolungamenti

const PLACER_OF = { mplus_os: "muraplacer_os", mplus_od: "muraplacer_od", mplus_va: "muraplacer_va", mplus_vb: "muraplacer_vb" };

// mplus_* [C]: il "+" all'estremita' del tratto selezionato (nel mondo,
// depth -9999). Clic: 40 pietra bastano? allora il placer del prolungamento.
export function mplus(name) {
  return {
    create(i) { i.hover = 0; },
    leftReleased(i, w) {
      if (w.g.stone >= 40) { w.create(PLACER_OF[name], i.x, i.y); w.destroy(i); }
    },
    keyboard27(i, w) { w.destroy(i); },
    mouseEnter(i, w) { i.hover = 1; w.g.sele = 2; },
    mouseLeave(i, w) { i.hover = 0; w.g.sele = 0; },
    drawGUI(i, w, dr) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH;
      dr.setAlpha(0.69);
      const title = tr("Wall"), desc = tr("Structure that can be built in both directions.");
      const ex = dr.panelExtra(390, title, desc, null);
      dr.tooltipBegin(w); // §6.1 n.85
      dr.roundrectColourExt(20, H - 150, 390 + ex, H - 20, 60, 60, WHITE, WHITE, false);
      dr.setAlpha(0.7);
      dr.setHalign("left");
      dr.text(40, H - 120, title);
      dr.setFont("overdue");
      dr.text(40, H - 90, desc);
      dr.setFont("GUI_1");
      dr.text(40, H - 50, "40");
      dr.setAlpha(1);
      dr.sprite("ico_stone", 0, 90, H - 50);
      dr.setAlpha(0.7);
      dr.setHalign("right");
      dr.setAlpha(1);
      dr.tooltipEnd(w);
    },
  };
}

// muraplacer_* Step [C]: secondo la direzione del puntatore (settori di
// gradi, estremi come nell'originale) mostra l'anteprima giusta e toglie le
// altre. Ogni riga: [test, anteprima da creare o null, dx, dy, da togliere].
const A = (lo, hi, loIn, hiIn) => (d) => (loIn ? d >= lo : d > lo) && (hiIn ? d <= hi : d < hi);
const SECTORS = {
  muraplacer_os: [
    [A(120, 180, true, false), "oodl", -208, 0, ["ovbl", "oval"]],
    [A(60, 120, false, true), "ovbl", 0, 0, ["oodl", "oval"]],
    [A(0, 60, false, true), null, 0, 0, ["oval", "ovbl", "oodl"]],
    [(d) => d >= 310, null, 0, 0, ["oval", "ovbl", "oodl"]],
    [A(240, 310, false, false), "oval", 0, 246, ["oodl", "ovbl"]],
  ],
  muraplacer_od: [
    [A(120, 240, true, false), null, 0, 0, ["oosl", "ovbl", "oval"]],
    [A(60, 120, false, true), "ovbl", 0, 0, ["oval", "oosl"]],
    [A(0, 60, false, true), "oosl", 217, 0, ["ovbl", "oval"]],
    [(d) => d >= 310, "oosl", 217, 0, ["ovbl", "oval"]],
    [A(240, 310, false, false), "oval", 0, 246, ["ovbl", "oosl"]],
  ],
  muraplacer_va: [
    [A(120, 240, true, false), "oodl", -208, 54, ["ovbl", "oosl"]],
    [A(60, 120, false, true), "ovbl", 0, 54, ["oodl", "oosl"]],
    [A(0, 60, false, true), "oosl", 218, 54, ["ovbl", "oodl"]],
    [(d) => d >= 310, "oosl", 218, 54, ["ovbl", "oodl"]],
    [A(240, 310, false, false), null, 0, 0, ["oosl", "ovbl", "oodl"]],
  ],
  muraplacer_vb: [
    [A(120, 240, true, false), "oodl", -208, 0, ["oval", "oosl"]],
    [A(60, 120, false, true), null, 0, 0, ["oosl", "oval", "oodl"]],
    [A(0, 60, false, true), "oosl", 218, 0, ["oval", "oodl"]],
    [(d) => d >= 310, "oosl", 218, 0, ["oval", "oodl"]],
    [A(240, 310, false, false), "oval", 0, 246, ["oodl", "oosl"]],
  ],
};
// Keyboard_Escape [C]: muraplacer_va non toglie oval (che non crea mai).
const ESCAPE = {
  muraplacer_os: ["oosl", "ovbl", "oodl", "oval"], muraplacer_od: ["oosl", "ovbl", "oodl", "oval"],
  muraplacer_vb: ["oosl", "ovbl", "oodl", "oval"], muraplacer_va: ["oosl", "ovbl", "oodl"],
};

export function wallExtender(name) {
  return {
    create(i) { i.place = 1; i.posiz = 0; },
    step(i, w) {
      const d = pointDirection(i.x, i.y, w.mouse.x, w.mouse.y);
      i.diro = d;
      for (const [test, make, dx, dy, remove] of SECTORS[name]) {
        if (!test(d)) continue;
        if (make && w.number(make) !== 0) continue;
        if (make) w.create(make, i.x + dx, i.y + dy);
        destroyAll(w, ...remove);
      }
    },
    keyboard27(i, w) {
      w.destroy(i);
      destroyAll(w, ...ESCAPE[name]);
      w.g.sele = 0;
    },
    collisions: { campo(i) { i.place = 0; } },
  };
}

// Anteprime dei tratti [C, oodl/oosl orizzontali, ovbl/oval verticali]: il
// fantasma bianco o rosso; clic sinistro: 40 pietra e il cantiere. Solo
// oodl distrugge anche il pulsante mura_clicker. Il draw_sprite(x,y,0,obj)
// con gli argomenti scambiati che disegnano in Draw/Draw_End non si porta
// (disegna lo sprite numero x nell'angolo della room: §3.7 n.23).
export function wallPreview(name) {
  const vert = name === "ovbl" || name === "oval";
  const ghost = vert ? "m_vert" : "m_ori", fondName = vert ? "mura_vert_fond" : "mura_ori_fond";
  const b = {
    create(i) { Object.assign(i, { place: 1, posiz: 0, life: 1, slife: 800 }); },
    step(i, w) { i.place = w.placeFree(i, i.x, i.y) ? 1 : 0; },
    draw(i, w, dr) { dr.spriteExt(ghost, 0, i.x, i.y, 1, 1, 0, i.place === 1 ? WHITE : RED, 0.5); },
    globalLeftPressed(i, w) {
      const g = w.g;
      if (i.place !== 1) return;
      if (g.stone >= 40) {
        g.sele = 1;
        g.stone -= 40;
        w.create(fondName, i.x, i.y, { init: (f) => { f.paid = 40; } });
        if (name === "oodl") {
          w.destroy(i);
          for (const c of w.all("mura_clicker")) { c.active = 0; w.destroy(c); }
        } else {
          for (const c of w.all("mura_clicker")) c.active = 0;
          w.destroy(i);
        }
      } else w.create("stone_blink", 0, 0);
    },
    collisions: { campo(i) { i.place = 0; } },
    // [Correzione §3.8 n.26] eventi del muro che l'anteprima non deve
    // ereditare: il Destroy che libera la griglia, la riparazione col click
    // destro, Canc, la selezione.
    destroy() {},
    rightReleased() {},
    keyPress46() {},
    leftReleased() {},
  };
  // oodl e oosl hanno un Draw_End proprio (quello sbagliato, n.23): non
  // ereditano la barra della vita di mura_ori
  if (!vert) b.drawEnd = () => {};
  return b;
}

// gate_clicker [C]: trasforma il tratto selezionato in una porta (100 oro).
// with(mura_vert) e with(mura_ori) contano anche le anteprime (figlie), che
// pero' non sono mai selezionate.
function makeGate(w) {
  const g = w.g;
  for (const [wallName, gateName] of [["mura_vert", "porta_vert"], ["mura_ori", "porta_ori"]]) {
    for (const m of w.all(wallName)) {
      if (m.selected !== 1) continue;
      if (g.gold >= 100) {
        g.gold -= 100;
        w.create(gateName, m.x, m.y);
        m.selected = 0;
        w.destroy(m);
        destroyAll(w, "gate_clicker");
      } else w.create("gold_blink", 0, 0);
    }
  }
}

export function gateClicker() {
  return {
    create(i) { i.active = 0; i.hover = 0; },
    step(i, w) {
      const g = w.g, c = w.cam;
      w.setPos(i, c.x + 450 * g.scaleview, c.y + 50 * g.scaleview);
      i.depth = -i.y - 999;
      i.image_xscale = g.scaleview;
      i.image_yscale = g.scaleview;
    },
    leftReleased(i, w) { makeGate(w); },
    keyPress81(i, w) { makeGate(w); },
    mouseEnter(i, w) { i.hover = 1; w.g.sele = 2; },
    mouseLeave(i, w) { i.hover = 0; w.g.sele = 0; },
    // Draw_GUI [C]. [Correzione §3.8 n.29] l'originale usa quasi sempre
    // view_hview (altezza della view nella room): con lo zoom la scheda
    // scendeva sotto lo schermo. Qui tutto in view_hport.
    drawGUI(i, w, dr) {
      if (i.hover !== 1) return;
      const H = w.cam.cssH, Hp = H;
      dr.setAlpha(0.69);
      const title = tr("Gate"), desc = tr("Creates a self-opening gate in the wall."), sc = tr("Shortcut: {key}", { key: "Q" });
      const ex = dr.panelExtra(370, title, desc, sc);
      dr.tooltipBegin(w); // §6.1 n.85
      dr.roundrectColourExt(20, H - 150, 370 + ex, H - 20, 60, 60, WHITE, WHITE, false);
      dr.setAlpha(0.7);
      dr.setHalign("left");
      dr.text(40, H - 120, title);
      dr.setFont("overdue");
      dr.text(40, Hp - 90, desc);
      dr.setFont("GUI_1");
      dr.text(40, H - 50, "100");
      dr.setHalign("right");
      dr.text(350 + ex, H - 120, sc);
      dr.setAlpha(1);
      dr.sprite("ico_gold", 0, 95, H - 50);
      dr.tooltipEnd(w);
      dr.setAlpha(0.99);
      dr.circleColour(450, 50, 30, WHITE, WHITE, false);
      dr.setAlpha(1);
      dr.spriteExt("ico_gate", 0, 450, 50, 0.5, 0.5, 0, WHITE, 1);
    },
  };
}
