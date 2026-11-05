// L'oggetto `manager` dell'originale (src/objects/manager/): una sola
// istanza per room, regista di risorse, tempo, giorno/notte, pioggia,
// trucchi, minimappa e barra delle risorse (STUDIO.md §3.1). Le parti che
// riguardano altri sistemi stanno con loro: ondate, presidi e controller dei
// livelli in levels.js, nebbia e notte disegnate in fog.js e fogdraw.js.

import { tr } from "./i18n.js";
import { Alarms, irandomRange } from "./alarms.js";
import { c } from "./colours.js";
import { rainStart, rainStep, RAIN_PUT_OUT, rainExtinguish, rainRipples, waterLife } from "./effects.js";
import { overcastStep } from "./ambience.js";
import { ZOOM_MIN, ZOOM_MAX } from "./camera.js";
import { alarmZones, alarmBlink, drawAlarms } from "./attackalarm.js";
import { MM, drawWater, drawMountains, drawIcon, isWall, drawExplored, viewRadii, clampSz, drawSelected, drawRally, drawObjectives } from "./minimap.js";
import { objectiveMarks } from "./levels.js";
import { fogActive } from "./fog.js";

// passi di giorno dopo un'alba (il primo giorno della room ne ha 6000)
const DAY_AFTER_DAWN = 4000;

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
    this.al.set(2, 100);                           // pioggia che spegne i fuochi
    this.al.set(3, 100);                           // aquila
    this.world = null;                             // app.js (pioggia e aquila)
    this.rain = null;
    // [Richiesta dell'autore] il livello 1 e' tutto di notte: l'originale
    // armava l'alba a 100000 passi, e l'alarm 0 (6000), trovando gia' la
    // notte, la anticipava a 8000. Qui l'alarm 0 resta (il suggerimento
    // della notte), l'alba no (alarm 1).
    if (room === "lvl01") g.night = 1;
    if (room === "lvl02") { g.night = 1; this.al.set(1, 1); }
    // startflagger (9), bordi solidi (10): con i loro sistemi
    this.minimHover = this.minimViewHover = this.minimPlusHover = this.minimMinusHover = 0;
    this.minimViewHoverBis = 0;
  }

  // Il livello 1 senza alba anche da un salvataggio fatto prima che lo
  // fosse, magari ad alba cominciata (snapshot.js)
  endlessNight() {
    if (this.room !== "lvl01") return;
    this.g.night = 1;
    this.al.set(1, -1);
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
    // [§6.1 n.78] fino a ZOOM_MAX; la rotella (giu' = allontana) fa lo
    // stesso attorno al puntatore
    // [§9.83] morbido: si sposta la meta (camera.js, zoomTo), di 0,1 a
    // scatto dalla meta in corso (piu' scatti di fila si sommano); il
    // touchpad di 0,1 ogni 100 px, senza arrotondare
    // [§9.107] n scatti: fino al decimo dopo nella direzione dello scatto,
    // poi di 0,1 (da 1,35, lo zoom di partenza, a 1,4 o 1,3; prima
    // l'arrotondamento dava 1,5 e 1,3); da un decimo, di 0,1 come prima
    const tenths = (s, n) => (n > 0 ? Math.floor(s * 10 + 1e-6) + n : Math.ceil(s * 10 - 1e-6) + n) / 10;
    const goal = cam.zoomGoal;
    if (P(88)) {
      if (g.sele === 1) g.sz = clampSz(g.sz + 1); // §9.113: fra i limiti
      else if (goal < ZOOM_MAX && this.room !== "menu") cam.zoomTo(tenths(goal, 1), 0, 0);
    }
    if (P(90)) {
      if (g.sele === 1) g.sz = clampSz(g.sz - 1);
      else if (goal > ZOOM_MIN && this.room !== "menu") cam.zoomTo(tenths(goal, -1), 0, 0);
    }
    if ((input.wheelStep || input.wheelFine) && this.room !== "menu") {
      let t = cam.zoomGoal;
      if (input.wheelStep) t = tenths(t, input.wheelStep);
      if (input.wheelFine) t += input.wheelFine / 1000;
      cam.zoomTo(t, input.x, input.y);
    }
    cam.zoomStep();
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
    // [§9.108] J: la view sulla zona d'allarme piu' recente; di nuovo entro 5
    // s, sulla precedente (attackalarm.js)
    if (P(74) && this.world && this.room !== "menu") {
      const zs = alarmZones(g), now = this.world._stepNo;
      if (zs.length) {
        this.alarmK = this.alarmAt !== undefined && now - this.alarmAt < 300 ? ((this.alarmK || 0) + 1) % zs.length : 0;
        this.alarmAt = now;
        const z = zs[this.alarmK];
        cam.zoomTarget = null;
        cam.x = z.x - cam.w / 2; cam.y = z.y - cam.h / 2; cam.clamp();
      }
    }
    if (R(18) || R(17)) g.sele = 0;
    if (R(86)) g.visia = 0;
  }

  // part_system_destroy(rain); global.raining=0
  // [§9.91] il sistema resta: le gocce calano in 5 s (effects.js rainStep,
  // che lo toglie a gocce finite)
  stopRain() {
    this.g.raining = 0;
  }

  // Mouse_GlobalLeftPressed / Released [C]: inizio e fine del rettangolo di
  // selezione, pulsanti della minimappa.
  mouse(input, mx, my) {
    const g = this.g;
    if (input.mousePressed[0]) {
      // [§9.109] sulla minimappa niente rettangolo di selezione
      if (!this.overMinimap()) {
        g.multi = 1;
        g.startx = mx;
        g.starty = my;
      }
      if (g.minim === 1) {
        if (this.minimViewHover) { g.minim = 0; }
        if (this.minimPlusHover) g.sz = clampSz(g.sz - 1);
        if (this.minimMinusHover) g.sz = clampSz(g.sz + 1);
      } else if (this.minimViewHoverBis) {
        g.minim = 1;
      }
    }
    if (input.mouseReleased[0]) g.multi = 0;
  }

  // [§9.113] la scala della minimappa disegnata (zoom morbido)
  mmScale() { return this.mmSz ?? this.g.sz; }

  // [§9.109] il puntatore e' sulla minimappa (la mappa o i suoi pulsanti; a
  // minimappa chiusa il pulsante che la apre)? Dagli hover del passo
  // (step)
  overMinimap() {
    return this.g.minim === 1
      ? !!(this.minimHover || this.minimViewHover || this.minimPlusHover || this.minimMinusHover)
      : !!this.minimViewHoverBis;
  }

  // [§9.109, richiesta dell'autore] I clic sulla minimappa: il sinistro (e
  // trascinando) porta la view su quel punto, il destro manda le unita'
  // selezionate li' (order: il punto di room, che app.js da' al mondo come
  // posizione del puntatore). Prima i clic passavano al mondo sotto la
  // minimappa sullo schermo: il destro mandava le unita' in quel punto, il
  // sinistro deselezionava. null se il puntatore non e' sulla minimappa (ne'
  // la si sta trascinando): i clic vanno al mondo.
  minimapInput(input, cam, roomW, roomH) {
    const g = this.g, sz = this.mmScale(), oy = cam.cssH - 20 - roomH / sz;
    const at = () => [Math.max(0, Math.min(roomW, (input.x - 20) * sz)), Math.max(0, Math.min(roomH, (input.y - oy) * sz))];
    const onMap = g.minim === 1 && !!this.minimHover;
    if (onMap && input.mousePressed[0]) this.mmDrag = true;
    if (this.mmDrag) {
      const [x, y] = at();
      cam.x = x - cam.w / 2; cam.y = y - cam.h / 2; cam.clamp();
      if (!input.mouseDown[0]) this.mmDrag = false;
    }
    const order = onMap && input.mouseReleased[1] ? at() : null;
    return this.overMinimap() || this.mmDrag || input.mouseReleased[0] && onMap ? { order } : null;
  }

  // Ordine di un passo GMS (STUDIO.md §1.3): alarm, poi tastiera e mouse,
  // poi Step. app.js chiama alarms(), keys(), mouse(), step() in quest'ordine.
  alarms() {
    this.al.tick((i) => this.alarm(i));
  }

  // [§9.84] Lo stadio rosa di alba e tramonto (0-1, fog.js skyColour), dagli
  // allarmi del giorno e della notte: sale negli ultimi TWILIGHT passi del
  // giorno (alarm 0), e' 1 durante il passaggio (global.night fra 0 e 1),
  // scende nei primi TWILIGHT passi dopo l'alba (alarm 0 riarmato a 4000).
  // Solo estetico, niente da salvare: gli allarmi si salvano gia'.
  // [§9.87, segnalazione dell'autore] senza salti: il primo giorno (6000
  // passi, nessuna alba prima) non ha la discesa, che a 4000 passi dalla
  // fine faceva comparire il rosa all'improvviso; l'ultimo passo del giorno
  // (alarm 0 a 1) e quello dopo l'alba (alarm 1 a 1, alarm 0 non ancora
  // riarmato) sono rosa pieno, non giorno per un fotogramma. Dopo un'alba
  // global.night e' sempre appena sotto 0 (alarm 1 si ferma solo quando
  // scende sotto lo 0), al primo giorno della room e' 0 esatto.
  twilight() {
    const g = this.g, TW = 900;
    if (this.room === "lvl01" || this.room === "menu") return 0;
    if (g.night >= 1) return 0;
    if (g.night > 0) return 1;
    const a0 = this.al.get(0);
    if (a0 <= 0) return this.al.get(1) > 0 ? 1 : 0; // l'alba appena finita
    const rise = Math.max(0, 1 - (a0 - 1) / TW);
    const fall = g.night < 0 ? Math.max(0, 1 - (DAY_AFTER_DAWN - a0) / TW) : 0;
    return Math.min(1, Math.max(rise, fall));
  }

  step(input, cam, roomW, roomH) {
    const g = this.g;
    g.frame++;
    if (this.world) this.world.twilight = this.twilight(); // §9.84
    // manager Step [C]: tetti alle risorse (la pietra non ha tetto) e a popcap
    if (g.food > 9999) g.food = 9999;
    if (g.wood > 9999) g.wood = 9999;
    if (g.gold > 9999) g.gold = 9999;
    if (g.popcap > 99) g.popcap = 99;
    if (this.fogalpha > 0) this.fogalpha -= 0.02;
    // [§9.91] cielo coperto e gocce che crescono e calano piano
    if (this.world) {
      overcastStep(this.world, this.rain);
      this.rain = rainStep(this.world, this.rain);
    }
    // [§8.13] anelli delle gocce sul fiume (§9.91: quante sono le gocce)
    if (this.rain && this.world) rainRipples(this.world, cam, this.rain.level);
    // [§9.36] riflessi, increspature e schiuma sui fiumi
    if (this.world) waterLife(this.world, cam);
    // Hover dei pulsanti della minimappa: l'originale confronta mouse_x/y
    // in coordinate di room con i rettangoli GUI riportati nella room
    // (x scaleview); qui si confronta direttamente in coordinate GUI, che e'
    // la stessa cosa.
    const px = input.x, py = input.y, H = cam.cssH;
    // [§9.113] zoom morbido della minimappa: la scala disegnata insegue
    // quella scelta (global.sz), come lo zoom del mondo (§9.83)
    g.sz = clampSz(g.sz);
    const t = g.sz, s0 = this.mmSz ?? t;
    let s = s0 + (t - s0) * MM.szEase;
    if (Math.abs(t - s) < 0.002 * t) s = t;
    this.mmSz = s;
    const mw = roomW / s, mh = roomH / s;
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
        else {
          this.al.set(1, 2000);
          // la prima notte, il suggerimento sotto il puntatore [C]
          if (g.nighthint === 0 && this.world) {
            this.world.create("hint_night", this.world.mouse.x, this.world.mouse.y);
            g.nighthint = 1;
          }
        }
        break;
      case 1: // passaggio notte-giorno (non nel livello 1, sempre di notte)
        if (this.room === "lvl01") break;
        if (g.night >= 0) { g.night -= 0.005; this.al.set(1, 1); }
        else this.al.set(0, DAY_AFTER_DAWN);
        break;
      case 2: // [C] (il resto e' il ridimensionamento della finestra)
        // la pioggia spegne gli edifici di legno alleati ogni 10 passi, con
        // le loro fiamme (§3.17 n.56)
        this.al.set(2, 10);
        // [§9.92, richiesta dell'autore] solo quando le gocce sono almeno a
        // meta' (effects.js RAIN_PUT_OUT): non mentre il cielo si copre e le
        // prime gocce cominciano a cadere, e ancora per un po' mentre calano
        if (this.rain && (this.rain.level ?? 1) >= RAIN_PUT_OUT && this.world) rainExtinguish(this.world);
        break;
      case 3: // aquila, ogni 3000 passi
        // [Correzione decisa dall'autore, §3.17 n.58] l'originale la crea a
        // y=-10 e, volando in alto a destra, non entrava mai nella room:
        // qui parte 10 px sotto il bordo basso e la attraversa
        this.al.set(3, 3000);
        if (this.world) this.world.create("aquila_01", irandomRange(-this.world.roomW, this.world.roomW), this.world.roomH + 10);
        break;
      case 4: // pioggia: gocce lungo il bordo alto della room
        this.al.set(6, irandomRange(12000, 15000));
        if (g.raining === 0) {
          g.raining = 1;
          // [§9.91] se le gocce stanno ancora calando riprendono a salire
          if (this.world) this.rain = this.rain || rainStart(this.world);
        }
        break;
      case 6: // fine pioggia
        this.stopRain();
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

  // manager Draw_End [C], fra i Draw End delle istanze alla depth del
  // manager (world.draw): bordo nero fuori dalla room (azione 2), rettangolo
  // di selezione (azione 3, blu di giorno, bianco quando global.night != 0).
  // Subito dopo app.js disegna nebbia e notte (azione 5, fogdraw.js), che
  // quindi coprono anche il rettangolo di selezione.
  drawEnd(d, w) {
    const g = this.g, mx = w.mouse.x, my = w.mouse.y, rw = w.roomW, rh = w.roomH;
    d.setColour(c.black);
    d.rectangle(-10000, -10000, rw + 10000, 0, false);
    d.rectangle(-10000, rh, rw + 10000, rh + 10000, false);
    d.rectangle(-10000, 0, 0, rh, false);
    d.rectangle(rw, 0, rw + 10000, rh, false);
    d.setColour(c.white);
    if (g.multi === 1) {
      const col = g.night === 0 ? c.blue : c.white;
      d.rectangleColour(g.startx, g.starty, mx, my, col, col, col, col, true);
    }
  }

  // mouser Draw_End [C] (depth -9999, dopo tutti gli altri Draw End): il
  // cerchio luminoso sotto il puntatore (somma), colorato secondo cosa c'e'
  // sotto quando sono selezionati civili.
  drawMouser(d, w) {
    const g = this.g, mx = w.mouse.x, my = w.mouse.y;
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
    // [§9.27] la minimappa non sulle schermate di vittoria e di sconfitta
    const ending = world.number("victory_manager") > 0 || world.number("gameover_manager") > 0;
    if (this.room !== "menu" && !ending) {
      if (g.minim === 1) this.drawMinimap(d, cam, world, H);
      else {
        d.setAlpha(this.minimViewHoverBis ? 0.69 : 0.19);
        d.circleColour(20, H - 20, 15, c.white, c.white, false);
        // [§9.108] un allarme nuovo con la minimappa chiusa: il pulsante lampeggia di rosso
        if (alarmBlink(g, world._stepNo)) {
          d.setAlpha(0.35 + 0.35 * Math.sin(world._stepNo * 0.2));
          d.circleColour(20, H - 20, 15, c.red, c.red, false);
        }
        d.setAlpha(0.6);
        d.sprite("ico_view_small", 0, 20, H - 20);
        d.setAlpha(1);
      }
    }
    // [C] if room!=menu && instance_number(victory_manager)=0
    // [§9.27] neanche sulla schermata di sconfitta (il pannello delle risorse
    // e degli inattivi si disegnava sopra lo sfondo nero)
    if (this.room !== "menu" && world.number("victory_manager") === 0 && world.number("gameover_manager") === 0) {
      d.setAlpha(0.69);
      d.roundrectColourExt(20, 20, 230, 150, 60, 60, c.white, c.white, false);  // risorse
      // [Richiesta dell'autore] il riquadro degli inattivi si accende sotto il
      // puntatore come gli altri pulsanti. Lo faceva il Draw GUI di
      // idle_clicker [C], che pero' viene prima di questo: il riquadro qui
      // sotto lo copriva e non si vedeva.
      let idleHover = false;
      for (const ic of world.all("idle_clicker")) if (ic.hover === 1) idleHover = true;
      d.setAlpha(idleHover ? 0.99 : 0.69);
      d.roundrectColourExt(W - 90, 100, W - 20, 200, 60, 60, c.white, c.white, false); // inattivi
      d.setFont("GUI_1");
      d.setColour(c.black);
      d.setAlpha(0.75);
      d.setValign("middle");
      d.setHalign("left");
      // [§9.25, richiesta dell'autore] col puntatore sul pannello, al posto
      // delle risorse i civili su ciascuna (e i costruttori al posto della
      // popolazione), ognuno con l'icona della popolazione, piccola, accanto
      const inp = world.input;
      const hover = !!inp && inp.inside && inp.x > 20 && inp.x < 230 && inp.y > 20 && inp.y < 150;
      const workers = hover ? workersByResource(world) : null;
      if (workers) {
        for (const [x, y, n] of [[70, 40, workers.food], [70, 80, workers.wood], [70, 120, workers.gold], [160, 40, workers.stone], [160, 80, workers.build]]) {
          d.text(x, y, n);
          d.setAlpha(1);
          d.spriteExt("ico_multi", 0, x + d.stringWidth(String(n)) + 16, y + 2, 0.26, 0.26, 0, c.white, 1);
          d.setAlpha(0.75);
        }
      } else {
        d.text(70, 40, g.food);
        d.text(70, 80, g.wood);
        d.text(70, 120, g.gold);
        d.text(160, 40, g.stone);
        d.text(160, 80, g.pop + "/" + g.popcap);
      }
      d.setHalign("center");
      d.text(W - 55, 170, g.idle);
      if (g.fps_show > 0) {
        d.setColour(c.red);
        d.text(W - 55, 230, tr("FPS: {n}", { n: Math.round(fps) }));
      }
      d.setColour(c.white);
      d.setAlpha(1);
      d.spriteExt("ico_food", 0, 50, 40, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_gold", 0, 50, 120, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_wood", 0, 50, 80, 0.8, 0.8, 0, c.white, 1);
      d.spriteExt("ico_stone", 0, 140, 40, 0.8, 0.8, 0, c.white, 1);
      if (workers) d.spriteExt("ico_casa", 0, 140, 80, 0.42, 0.42, 0, c.white, 1);
      else d.spriteExt("ico_multi", 0, 140, 80, 0.4, 0.4, 0, c.white, 1);
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
    const g = this.g, sz = this.mmScale(); // §9.113: la scala disegnata
    const mw = world.roomW / sz, mh = world.roomH / sz;
    const ox = 20, oy = H - 20 - mh;
    const R = Math.min(40, mw / 2, mh / 2); // il raggio degli angoli (80 / 2, come roundrectColourExt)
    // [§9.110, proposta dell'autore] col puntatore sopra il fondo diventa piu'
    // opaco solo dove il giocatore ha scoperto la mappa (senza nebbia, tutto).
    // [§9.111, richiesta dell'autore] e col vetro il mondo sotto si sfoca
    // come a 0,69 su tutta la minimappa, anche dove non e' scoperta (lo
    // sfondo non distrae), con la brina ridotta perche' la chiarezza resti
    // quella di 0,19; il passaggio dura MM.hoverTime s, avanti e indietro
    // (a tempo vero: anche a gioco in pausa o con meno fotogrammi)
    const now = performance.now(), dt = this._mmT ? Math.min(0.1, (now - this._mmT) / 1000) : 0;
    this._mmT = now;
    this.mmHover = Math.max(0, Math.min(1, (this.mmHover || 0) + (this.minimHover ? 1 : -1) * dt / MM.hoverTime));
    const e = this.mmHover * this.mmHover * (3 - 2 * this.mmHover); // smoothstep
    const fogOn = fogActive(world) && !!world.fog, glassOn = !!d.glass;
    d.setAlpha(0.19);
    if (glassOn) {
      const b0 = 0.19 / 0.69, blend = b0 + (1 - b0) * e;
      d.glassBlend = blend; d.glassFrost = 0.3 * b0 / blend; // la brina del vetro a 0,19, su tutto il vetro
    }
    d.roundrectColourExt(20, oy, 20 + mw, H - 20, 80, 80, c.white, c.white, false);
    d.glassBlend = d.glassFrost = undefined;
    const ex = (glassOn ? MM.exploredGlass : MM.explored) * e;
    if (ex > 0.001) {
      if (fogOn) drawExplored(d, world, ox, oy, sz, ex, g.sz);
      else { // senza nebbia: tutta, bianco semplice (non un altro vetro)
        const g0 = d.glass;
        d.glass = null;
        d.setAlpha(ex);
        d.roundrectColourExt(20, oy, 20 + mw, H - 20, 80, 80, c.white, c.white, false);
        d.glass = g0;
        d.setAlpha(1);
      }
    }
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
    // [§9.109, richieste dell'autore] il terreno (fiumi, montagne), alberi e
    // risorse, poi edifici e unita' con le loro icone (minimap.js); prima
    // l'ordine dei with(...) dell'originale, alberi sopra le unita'
    const P = (i) => [ox + i.x / sz, oy + i.y / sz];
    drawWater(d, world, ox, oy, sz, g.sz);
    drawMountains(d, world, ox, oy, sz);
    // [§9.110, richiesta dell'autore] le risorse con le loro icone (miniera,
    // pietra, rovina), coi colori di prima (giallo l'oro, grigio la pietra);
    // gli alberi triangoli
    for (const i of world.all("albero")) {
      if (!i.visible) continue;
      const [x, y] = P(i);
      d.setAlpha(MM.treeAlpha);
      d.triangleColour(x - 60 / sz, y + 60 / sz, x + 60 / sz, y + 60 / sz, x, y - 60 / sz, MM.tree, MM.tree, MM.tree, false);
    }
    for (const [name, col] of [["miniera_oro", c.yellow], ["pietra_grande", c.gray], ["pietr_piccolo", c.gray],
                               ["castelloruin", c.gray], ["torreruin", c.gray], ["chiesaruin", c.gray]]) {
      for (const i of world.all(name)) if (i.visible) drawIcon(d, world, i, ...P(i), sz, col);
    }
    d.setAlpha(1);
    // mura e porte: linee, come nell'originale [C]
    const wall = (i, col) => {
      const [x, y] = P(i);
      if (/_vert/.test(i.object)) d.lineColour(x, y, x, y - 250 / sz, col, col);
      else d.lineColour(x - 200 / sz, y, x + 200 / sz, y, col, col);
    };
    // gli edifici, poi le unita'; i nemici solo se visibili (nebbia)
    for (const [who, col, needVisible] of [["ally_build", MM.ally, false], ["enemy_build", MM.enemy, true],
                                           ["ally_unit", MM.ally, false], ["enemy_unit", MM.enemy, true]]) {
      for (const i of world.all(who)) {
        if (needVisible && !i.visible) continue;
        // [§9.110] gli oggetti senza sprite no: cc_barn (il deposito del cibo
        // del centro, invisibile: col suo nome dava al centro anche l'icona
        // del mulino) e i pezzi invisibili delle mura (oodl, oval...)
        if (!i.sprite_index) continue;
        if (isWall(i.object)) { wall(i, col); continue; }
        const [x, y] = P(i);
        // [§9.110, decisione dell'autore] le unita' puntini (come
        // nell'originale, 50/sz), gli edifici icone
        const unit = who.endsWith("unit");
        // [§9.114] i tuoi selezionati con un anello bianco
        const sel = who.startsWith("ally") && i.selected === 1;
        // [§9.101] le torri del livello 6 non ancora recuperate: grigie
        const px = unit ? 0 : drawIcon(d, world, i, x, y, sz, i.locked ? MM.grey : col);
        if (px) { if (sel) drawSelected(d, x, y, px * 0.55); continue; }
        const r = unit ? Math.max(MM.unit, 50 / sz) : 100 / sz;
        d.setAlpha(1);
        d.circleColour(x, y, r, col, col, false);
        if (sel) drawSelected(d, x, y, r);
      }
    }
    // [§9.114] il punto di raccolta degli edifici selezionati (centro: flagx
    // null finche' non c'e'; caserme e stalle: 0)
    for (const b of world.all("ally_build")) {
      if (b.selected !== 1 || !b.flagx || !b.flagy) continue;
      drawRally(d, ...P(b), ox + b.flagx / sz, oy + b.flagy / sz);
    }
    d.setAlpha(1);
    // rettangolo della view [§9.109: l'originale lo faceva alto
    // view_hport/sz, non view_hview/sz: con lo zoom piu' basso della view
    // vera, il 74% a zoom 1,35]; angoli poco arrotondati (con raggio 80 era
    // quasi sempre un ovale)
    // [§9.110] negli angoli della minimappa l'angolo del riquadro ne segue la curva
    const vl = ox + cam.x / sz, vt = oy + cam.y / sz, vr = ox + (cam.x + cam.w) / sz, vb = oy + (cam.y + cam.h) / sz;
    d.setAlpha(1);
    d.roundRectRadii(vl, vt, vr, vb, viewRadii(vl, vt, vr, vb, ox, oy, ox + mw, oy + mh, R), c.black, true);
    // [§9.114] i segnalini degli obiettivi in corso (levels.js)
    drawObjectives(d, objectiveMarks(world), ox, oy, sz, world._stepNo);
    // [§9.108] gli allarmi, sopra tutto (attackalarm.js)
    drawAlarms(d, g, world._stepNo, ox, oy, sz);
  }
}

// [§9.25] I civili per risorsa: chi raccoglie, chi ci va e chi porta il
// carico al deposito (il cibo con chi semina un campo); build: chi
// costruisce o ripara, o ci va. Gli inattivi (action 0) non contano.
export function workersByResource(world) {
  const n = { food: 0, wood: 0, gold: 0, stone: 0, build: 0 };
  for (const o of world.all("ally_omino")) {
    const a = o.action;
    if (a === 0) continue;
    if (a === 2 || o.woodwork === 1 || o.woodwork === 2) n.wood++;
    else if (a === 3 || o.goldwork === 1 || o.goldwork === 2) n.gold++;
    else if (a === 5 || o.stonework === 1 || o.stonework === 2) n.stone++;
    else if (a === 4 || a === 8 || o.foodwork === 1 || o.foodwork === 2 || o.foodwork === 6 || o.fieldwork === 1) n.food++;
    else if (a === 6 || a === 7 || o.buildwork === 1 || o.repairwork === 1) n.build++;
  }
  return n;
}
