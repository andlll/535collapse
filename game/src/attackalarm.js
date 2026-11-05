// [§9.108, richiesta dell'autore] Allarmi d'attacco sulla minimappa.
//
// Nell'originale c'era l'inizio: scr_atk_signal (colpi nemici fuori dalla
// view, non entro 500 px da un segnale attivo) creava atk_signal, che la
// minimappa disegnava come ico_battle per 1,25 s [C, manager Draw_GUI]; un
// flm_signal (incendi) non lo creava nessuno. Nel porting il disegno si era
// perso. Ripreso e rifatto per zona, perche' una mischia lunga non ripeta
// l'allarme ogni 1,25 s:
// - una zona e' un punto della mappa con un tipo: "battle" (le spade
//   incrociate, ico_battle) quando un'unita' alleata perde vita, "fire" (la
//   fiamma, ico_fiamma: disegno dell'autore, dello stesso colore e della
//   stessa altezza di ico_battle, nuovi.json "derivati") quando la perde un
//   edificio alleato (incendio, arieti, catapulte, frecce incendiarie);
// - il primo colpo entro ZONE_R px da una zona dello stesso tipo la tiene
//   viva (`last`), senza un allarme nuovo; se no nasce una zona nuova, e se
//   il colpo e' fuori dalla view con gli anelli arancioni che si allargano,
//   dentro la view senza (la battaglia la si vede gia');
// - la zona resta (l'icona, che pulsa piano) finche' per QUIET passi non
//   arrivano colpi, poi sfuma in FADE passi;
// - il colpo si riconosce dalla vita che cala, guardata a ogni passo
//   (alLife sull'istanza): vale per mischia, frecce, sassi, arieti e fuoco,
//   senza agganciare ogni punto del codice. Non contano la demolizione col
//   tasto Canc (selezionato e a vita 0) e i primi GRACE passi della partita
//   (le regie mettono le vite di partenza, come le torri del livello 6).
// Le zone stanno in g.alarms (si salvano con la partita). J porta la view
// sulla zona piu' recente, e di nuovo sulla precedente (manager.js). La
// prima volta il suggerimento hint_allarme (hints.js).

export const ALARM = {
  zoneR: 800,      // px di room: un colpo piu' vicino di cosi' a una zona dello stesso tipo e' la stessa battaglia
  quiet: 30 * 60,  // passi senza colpi: la zona finisce
  fade: 60,        // passi della sfumatura finale
  grace: 120,      // passi all'inizio della partita senza allarmi
  ring: { n: 3, every: 22, life: 70, r: [5, 38] }, // anelli: quanti, ogni quanti passi, vita, raggio (px dello schermo)
  blink: 10 * 60,  // passi in cui il pulsante della minimappa chiusa lampeggia, dopo un allarme nuovo
  // [§9.110, richiesta dell'autore] icone e anelli arancioni (le icone
  // bianche mm_battle e mm_fiamma, colorate qui): i tuoi nella minimappa
  // sono marroni, del colore delle icone di prima (135, 73, 0)
  icon: { battle: ["mm_battle", 0.52], fire: ["mm_fiamma", 0.36] }, // sprite e scala (~16 px)
  colour: { battle: 0x1a8cf5, fire: 0x1a8cf5 }, // BGR di (245, 140, 26)
};

const state = (g) => g.alarms || (g.alarms = { zones: [], seq: 0 });

// un colpo a (x, y): la zona dello stesso tipo vicina, o una nuova
export function raiseAlarm(w, kind, x, y) {
  const A = state(w.g), now = w._stepNo;
  let best = null, bd = ALARM.zoneR;
  for (const z of A.zones) {
    if (z.kind !== kind || z.ending) continue;
    const d = Math.hypot(z.x - x, z.y - y);
    if (d < bd) { bd = d; best = z; }
  }
  if (best) { best.last = now; return best; }
  const c = w.cam;
  const inView = !!c && x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
  const z = { id: ++A.seq, kind, x: Math.round(x), y: Math.round(y), t0: now, last: now, ring: !inView, ending: 0 };
  A.zones.push(z);
  return z;
}

// un passo (app.js, dopo il mondo): i colpi, la fine delle zone
export function alarmsStep(w) {
  if (w.room === "menu") return;
  const g = w.g, A = state(g), now = w._stepNo;
  const watch = (name, kind) => {
    for (const i of w.all(name)) {
      const l = i.life;
      if (typeof l !== "number") continue;
      const before = i.alLife;
      i.alLife = l;
      if (before === undefined || l >= before || now < ALARM.grace) continue;
      if (l <= 0 && i.selected === 1) continue; // demolito (Canc)
      if (i.locked) continue; // [§9.101] le torri chiuse del livello 6
      raiseAlarm(w, kind, i.x, i.y);
    }
  };
  if (g.victory !== 1 && g.gameover !== 1) {
    watch("ally_unit", "battle");
    watch("ally_build", "fire");
  }
  for (const z of A.zones) if (!z.ending && now - z.last > ALARM.quiet) z.ending = now;
  // la prima volta, il suggerimento (se non ce n'e' gia' uno aperto)
  if (A.zones.length && (g.alarmhint ?? 0) === 0 && w.behaviours.hint_allarme && w.number("parent_hint") < 1) {
    w.create("hint_allarme", 0, 0);
    g.alarmhint = 1;
  }
  A.zones = A.zones.filter((z) => !z.ending || now - z.ending < ALARM.fade);
}

// le zone dalla piu' recente (per J)
export function alarmZones(g) {
  return [...state(g).zones].filter((z) => !z.ending).sort((a, b) => b.t0 - a.t0 || b.id - a.id);
}

// un allarme nuovo (con gli anelli) da poco: il pulsante della minimappa
// chiusa lampeggia
export function alarmBlink(g, now) {
  return state(g).zones.some((z) => z.ring && now - z.t0 < ALARM.blink);
}

// Sulla minimappa (manager.js drawMinimap): ox, oy l'angolo della mappa, sz
// la scala. Gli anelli (solo le zone nate fuori dalla view), poi l'icona:
// entra rimpicciolendosi e sfumando (come atk_signal [C], scala 0,3/fade),
// poi pulsa piano finche' la battaglia dura, e alla fine sfuma.
export function drawAlarms(d, g, now, ox, oy, sz) {
  const A = state(g);
  for (const z of A.zones) {
    const x = ox + z.x / sz, y = oy + z.y / sz, age = now - z.t0, col = ALARM.colour[z.kind];
    if (z.ring) {
      const R = ALARM.ring;
      for (let k = 0; k < R.n; k++) {
        const t = (age - k * R.every) / R.life;
        if (t < 0 || t > 1) continue;
        const e = 1 - (1 - t) * (1 - t), r = R.r[0] + (R.r[1] - R.r[0]) * e;
        d.setAlpha(0.3 * (1 - t));
        d.circleColour(x, y, r, col, col, false);
        d.setAlpha(0.85 * (1 - t));
        d.circleColour(x, y, r, col, col, true);
        d.circleColour(x, y, r - 1, col, col, true);
      }
    }
    const [spr, sc] = ALARM.icon[z.kind];
    const a0 = Math.min(1, age / 15), end = z.ending ? Math.max(0, 1 - (now - z.ending) / ALARM.fade) : 1;
    const pulse = 1 + 0.08 * Math.sin(age * 0.12);
    const s = sc * pulse * (1 + 2.5 * (1 - a0));
    d.setAlpha(1);
    d.spriteExt(spr, 0, x, y, s, s, 0, col, a0 * end * (0.85 + 0.15 * Math.sin(age * 0.12)));
  }
  d.setAlpha(1);
}
