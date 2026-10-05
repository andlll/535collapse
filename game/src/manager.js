// L'oggetto `manager` dell'originale (src/objects/manager/): una sola
// istanza per room, regista di risorse, tempo, giorno/notte, pioggia,
// trucchi, minimappa e barra delle risorse. Qui la parte del punto 1 della
// vertical slice (STUDIO.md §3); il resto (nebbia, notte disegnata,
// ondate, presidi, controller dei livelli) arriva con i sistemi a cui serve.

import { Alarms, irandomRange } from "./alarms.js";
import { c } from "./colours.js";

export class Manager {
  constructor(room, g) {
    this.room = room;
    this.g = g;
    this.al = new Alarms(12);
    // manager Create [C]
    this.fogalpha = 1;
    this.al.set(0, 6000);                          // timer notte
    this.al.set(4, irandomRange(12000, 15000));    // pioggia
    this.al.set(8, 60);                            // orologio
    if (room === "lvl01") { g.night = 1; this.al.set(1, 100000); }
    if (room === "lvl02") { g.night = 1; this.al.set(1, 1); }
    // aquila (alarm 3), startflagger (9), bordi solidi (10): con i loro sistemi
    this.minimHover = this.minimViewHover = this.minimPlusHover = this.minimMinusHover = 0;
    this.minimViewHoverBis = 0;
  }

  // Eventi di tastiera del manager [C, KeyPress_*/KeyRelease_*/Keyboard_*].
  keys(input, cam) {
    const g = this.g;
    const P = (k) => input.pressed.has(k), R = (k) => input.released.has(k), D = (k) => input.down.has(k);
    if (P(18)) g.sele = -1;          // Alt
    if (P(17)) g.sele = 1;           // Control
    if (P(86)) g.visia = 1;          // V
    // Keyboard_Left/Right/Up/Down: 10 px a passo, 30 con Ctrl o Alt (sele!=0)
    const k = g.sele === 0 ? 10 : 30;
    if (D(37)) cam.x -= k;
    if (D(39)) cam.x += k;
    if (D(38)) cam.y -= k;
    if (D(40)) cam.y += k;
    // KeyPress_X / KeyPress_Z: con Ctrl cambia la scala della minimappa,
    // altrimenti lo zoom (non nel menu)
    if (P(88)) {
      if (g.sele === 1) g.sz++;
      else if (g.scaleview < 1.5 && this.room !== "menu") cam.setScale((g.scaleview += 0.1));
    }
    if (P(90)) {
      if (g.sele === 1) g.sz--;
      else if (g.scaleview > 1 && this.room !== "menu") cam.setScale((g.scaleview -= 0.1));
    }
    g.scaleview = cam.scaleview;
    // Trucchi [C, tenuti anche fuori dal debug: decisione dell'autore §0.10]:
    // V + Alt + F/Q/S/W/P.
    const cheat = g.sele === -1 && g.visia === 1;
    if (P(70) && cheat) g.food += 1000;
    // [Difetto corretto, §3.2 n.10: nell'originale lo stop della pioggia era
    // fuori dall'if e ogni Q fermava la pioggia; era un'esigenza di test
    // dell'autore]
    if (P(81) && cheat) {
      g.gold += 1000;
      this.stopRain();
    }
    if (P(83) && cheat) g.stone += 1000;
    if (P(87) && cheat) g.wood += 1000;
    // [Difetto corretto, §3.2 n.11: alarm[4]=1 era fuori dall'if]
    if (P(80) && cheat) {
      g.popcap += 1000;
      this.al.set(4, 1);
    }
    // KeyRelease_Delete con Ctrl + V: nebbia on/off
    if (R(46) && g.sele === 1 && g.visia === 1) g.fogville = g.fogville ? 0 : 1;
    if (P(77)) g.minim = g.minim ? 0 : 1;          // M: minimappa
    if (P(79)) g.obj = g.obj ? 0 : 1;              // O: obiettivi
    if (R(72)) g.hint = g.hint === 1 ? 0 : 1;      // H (rilascio): suggerimenti
    if (R(18) || R(17)) g.sele = 0;
    if (R(86)) g.visia = 0;
  }

  stopRain() {
    this.g.raining = 0;
  }

  // Mouse_GlobalLeftPressed / Released [C]: inizio e fine del rettangolo di
  // selezione, pulsanti della minimappa.
  mouse(input, mx, my) {
    const g = this.g;
    if (input.mousePressed[0]) {
      g.multi = 1;
      g.startx = mx;
      g.starty = my;
      if (g.minim === 1) {
        if (this.minimViewHover) { g.minim = 0; }
        if (this.minimPlusHover) g.sz--;
        if (this.minimMinusHover) g.sz++;
      } else if (this.minimViewHoverBis) {
        g.minim = 1;
      }
    }
    if (input.mouseReleased[0]) g.multi = 0;
  }

  // Ordine di un passo GMS (STUDIO.md §1.3): alarm, poi tastiera e mouse,
  // poi Step. app.js chiama alarms(), keys(), mouse(), step() in quest'ordine.
  alarms() {
    this.al.tick((i) => this.alarm(i));
  }

  step(input, cam, roomW, roomH) {
    const g = this.g;
    g.frame++;
    // manager Step [C]: tetti alle risorse (la pietra non ha tetto) e a popcap
    if (g.food > 9999) g.food = 9999;
    if (g.wood > 9999) g.wood = 9999;
    if (g.gold > 9999) g.gold = 9999;
    if (g.popcap > 99) g.popcap = 99;
    if (this.fogalpha > 0) this.fogalpha -= 0.02;
    // Hover dei pulsanti della minimappa: l'originale confronta mouse_x/y
    // in coordinate di room con i rettangoli GUI riportati nella room
    // (x scaleview); qui si confronta direttamente in coordinate GUI, che e'
    // la stessa cosa.
    const px = input.x, py = input.y, H = cam.cssH;
    const mw = roomW / g.sz, mh = roomH / g.sz;
    if (g.minim === 1) {
      this.minimHover = +(px > 20 && px < 20 + mw && py > H - 20 - mh && py < H - 20);
      const bx = px > 35 + mw && px < 65 + mw;
      this.minimViewHover = +(bx && py > H - 20 - mh && py < H + 10 - mh);
      this.minimPlusHover = +(bx && py > H + 20 - mh && py < H + 50 - mh);
      this.minimMinusHover = +(bx && py > H + 60 - mh && py < H + 90 - mh);
    } else {
      this.minimViewHoverBis = +(px > 5 && px < 35 && py > H - 35 && py < H - 5);
    }
  }

  alarm(i) {
    const g = this.g;
    switch (i) {
      case 0: // passaggio giorno-notte
        if (g.night < 1) { g.night += 0.005; this.al.set(0, 1); }
        else this.al.set(1, 2000); // + hint_night la prima volta (con i suggerimenti)
        break;
      case 1: // passaggio notte-giorno
        if (g.night >= 0) { g.night -= 0.005; this.al.set(1, 1); }
        else this.al.set(0, 4000);
        break;
      case 4: // pioggia (le particelle arrivano col loro sistema)
        this.al.set(6, irandomRange(12000, 15000));
        if (g.raining === 0) g.raining = 1;
        break;
      case 6: // fine pioggia
        g.raining = 0;
        this.al.set(4, irandomRange(20000, 35000));
        break;
      case 8: // orologio (si ferma a partita persa: gameover_manager)
        if (!g.gameover) g.seconds += 1;
        if (g.seconds >= 60) { g.seconds = 0; g.minutes += 1; }
        if (g.minutes >= 60) { g.minutes = 0; g.hours += 1; }
        this.al.set(8, 60);
        break;
      default:
        break;
    }
  }

  // Disegno nel mondo, dopo i Draw End delle istanze:
  // - manager Draw_End azione 3 [C]: rettangolo di selezione, blu di giorno,
  //   bianco quando global.night != 0;
  // - mouser Draw_End [C]: il cerchio luminoso sotto il puntatore (somma),
  //   colorato secondo cosa c'e' sotto quando sono selezionati civili.
  drawWorldEnd(d, w) {
    const g = this.g, mx = w.mouse.x, my = w.mouse.y;
    if (g.multi === 1) {
      const col = g.night === 0 ? c.blue : c.white;
      d.rectangleColour(g.startx, g.starty, mx, my, col, col, col, col, true);
    }
    d.setBlend("add");
    d.setAlpha(0.7);
    const ring = (r, col) => d.circleColour(mx, my, r, col, c.black, false);
    if (g.sel > 0 && g.milsel < g.sel) {
      if (g.minierahover === 1) ring(60, c.yellow);
      if (g.alberhover === 1) ring(60, c.green);
      if (g.farmhover === 1) ring(60, c.teal);
      if (g.stonehover === 1) ring(60, c.gray);
      if (g.buildhover === 1) ring(60, c.orange);
      else if (!g.minierahover && !g.alberhover && !g.farmhover && !g.stonehover && !g.buildhover) ring(30, c.white);
    } else if (g.enemyhover === 0) ring(30, c.white);
    else ring(60, c.red);
    if (g.arcsel > 0) ring(g.preshover === 1 ? 60 : 30, g.preshover === 1 ? c.aqua : c.white);
    if (g.firesel > 0) {
      if (w.positionMeeting(mx, my, "enemy_wooden")) ring(60, c.red); else ring(30, c.white);
    }
    if (g.siegsel > 0) {
      if (w.positionMeeting(mx, my, "enemy_build")) ring(60, c.red); else ring(30, c.white);
    }
    d.setAlpha(1);
    d.setBlend("normal");
  }

  // manager Draw_GUI [C], coordinate in pixel CSS della finestra (la "port").
  drawGUI(d, cam, world, fps) {
    const g = this.g, W = cam.cssW, H = cam.cssH;
    if (this.room !== "menu") {
      if (g.minim === 1) this.drawMinimap(d, cam, world, H);
      else {
        d.setAlpha(this.minimViewHoverBis ? 0.69 : 0.19);
        d.circleColour(20, H - 20, 15, c.white, c.white, false);
        d.setAlpha(0.6);
        d.sprite("ico_view_small", 0, 20, H - 20);
        d.setAlpha(1);
      }
    }
    if (this.room !== "menu" && !g.victory) {
      d.setAlpha(0.69);
      d.roundrectColourExt(20, 20, 230, 150, 60, 60, c.white, c.white, false);  // risorse
      d.roundrectColourExt(W - 90, 100, W - 20, 200, 60, 60, c.white, c.white, false); // inattivi
      d.setFont("GUI_1");
      d.setColour(c.black);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("left");
      d.text(70, 40, g.food);
      d.text(70, 80, g.wood);
      d.text(70, 120, g.gold);
      d.text(160, 40, g.stone);
      d.text(160, 80, g.pop + "/" + g.popcap);
      d.setHalign("center");
      d.text(W - 55, 170, g.idle);
      if (g.fps_show > 0) {
        d.setColour(c.red);
        d.text(W - 55, 230, "FPS: " + Math.round(fps));
      }
      d.setColour(c.white);
      d.setAlpha(1);
      d.spriteExt("ico_food", 0, 50, 40, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_gold", 0, 50, 120, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_wood", 0, 50, 80, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_stone", 0, 140, 40, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_multi", 0, 140, 80, 0.4, 0.4, 0, c.white, 1);
      d.spriteExt("ico_idle", 0, W - 55, 135, 0.7, 0.7, 0, c.white, 1);
      if (g.sel > 1) {
        d.setAlpha(0.69);
        d.roundrectColourExt(260, 20, 390, 150, 60, 60, c.white, c.white, false);
        d.setFont("GUI_1");
        d.setColour(c.black);
        d.setAlpha(0.75);
        d.setValign("middle");
        d.setHalign("center");
        d.text(325, 120, " x " + g.sel);
        d.setAlpha(1);
        d.sprite("ico_multi", 0, 325, 70);
      }
      // pulsanti di costruzione / comportamento: con la selezione (punto 2)
    }
    // "il coso iniziale": la schermata parte nera e schiarisce in 50 passi
    d.setColour(c.black);
    d.setAlpha(this.fogalpha);
    if (this.fogalpha > 0) d.rectangle(0, 0, cam.w, cam.h, false);
    d.setAlpha(1);
    d.setColour(c.white);
  }

  // Minimappa [C, manager Draw_GUI azione 1]: 1 px = global.sz px di room,
  // in basso a sinistra; un simbolo per famiglia di oggetti.
  drawMinimap(d, cam, world, H) {
    const g = this.g, sz = g.sz;
    const mw = world.roomW / sz, mh = world.roomH / sz;
    const ox = 20, oy = H - 20 - mh;
    d.setAlpha(this.minimHover ? 0.69 : 0.19);
    d.roundrectColourExt(20, oy, 20 + mw, H - 20, 80, 80, c.white, c.white, false);
    const button = (hover, y) => {
      d.setAlpha(hover ? 0.69 : 0.19);
      d.circleColour(50 + mw, y, 15, c.white, c.white, false);
    };
    button(this.minimViewHover, H - 5 - mh);
    button(this.minimPlusHover, H + 35 - mh);
    button(this.minimMinusHover, H + 75 - mh);
    d.setAlpha(0.6);
    d.sprite("ico_view_small", 0, 50 + mw, H - 5 - mh);
    d.sprite("ico_plus_small", 0, 50 + mw, H + 35 - mh);
    d.sprite("ico_minus_small", 0, 50 + mw, H + 75 - mh);
    d.setAlpha(1);
    // rettangolo della view [C: altezza calcolata con view_hport, non
    // view_hview: a zoom > 1 il riquadro e' piu' basso della view vera]
    d.roundrectColourExt(ox + cam.x / sz, oy + cam.y / sz, ox + cam.x / sz + cam.w / sz,
                         oy + cam.y / sz + cam.cssH / sz, 80, 80, c.black, c.black, true);
    // Stesso ordine dei with(...) dell'originale: ogni famiglia sopra la
    // precedente. Le risorse e i nemici solo se visibili (nebbia).
    const groups = [
      ["ally_unit", false, (x, y) => d.circleColour(x, y, 50 / sz, c.red, c.maroon, false)],
      ["ally_build", false, (x, y) => d.circleColour(x, y, 100 / sz, c.red, c.maroon, false)],
      [["mura_vert", "porta_vert", "mura_vert_fond"], false, (x, y) => d.lineColour(x, y, x, y - 250 / sz, c.red, c.red)],
      [["mura_ori", "porta_ori", "mura_ori_fond"], false, (x, y) => d.lineColour(x - 200 / sz, y, x + 200 / sz, y, c.red, c.red)],
      ["enemy_unit", true, (x, y) => d.circleColour(x, y, 50 / sz, c.aqua, c.blue, false)],
      ["enemy_build", true, (x, y) => d.circleColour(x, y, 100 / sz, c.aqua, c.blue, false)],
      [["albero"], true, (x, y) => d.triangleColour(x - 60 / sz, y + 60 / sz, x + 60 / sz, y + 60 / sz, x, y - 60 / sz, c.green, c.green, c.green, false)],
      [["miniera_oro"], true, (x, y) => d.circleColour(x, y, 100 / sz, c.yellow, c.olive, false)],
      [["pietra_grande"], true, (x, y) => d.circleColour(x, y, 100 / sz, c.gray, c.dkgray, false)],
      [["castelloruin"], true, (x, y) => d.circleColour(x, y, 100 / sz, c.gray, c.dkgray, false)],
      [["torreruin"], true, (x, y) => d.circleColour(x, y, 75 / sz, c.gray, c.dkgray, false)],
      [["chiesaruin"], true, (x, y) => d.circleColour(x, y, 75 / sz, c.gray, c.dkgray, false)],
      [["pietr_piccolo"], true, (x, y) => d.circleColour(x, y, 75 / sz, c.gray, c.dkgray, false)],
      [["campo"], false, (x, y) => d.circleColour(x, y, 100 / sz, c.red, c.green, false)],
    ];
    for (const [who, needVisible, fn] of groups) {
      for (const i of world.instances) {
        const match = Array.isArray(who) ? who.includes(i.object) : (i.object === who || i.parents.includes(who));
        if (!match || (needVisible && !i.visible)) continue;
        fn(ox + i.x / sz, oy + i.y / sz);
      }
    }
  }
}
