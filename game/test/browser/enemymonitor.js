// Monitor dell'AI nemica (§9.82), per autoplay.mjs con MONITOR=1: gira
// nella pagina, chiamato ogni 30 passi (B.mon()), e raccoglie le cose
// strane. B.monNew() restituisce le righe nuove, B.monReport() il riepilogo.
//   fermo        in cammino (action 1) e spostato meno di 3 px per 10 s
//   avanti/indietro  6 inversioni di marcia in 60 s
//   nell'ostacolo    su una cella chiusa (costo >= 1000) per 5 s
//   fuori        fuori dalla room, o posizione non numerica
//   colpito fermo    perde vita per 5 s senza muoversi ne' colpire
//   indifferente un soldato del giocatore entro 120 px per 10 s, fermo e
//                senza combattere (non i lavoratori, non la ritirata)
//   macchine addosso due macchine d'assedio nemiche ferme a meno di 170 x
//                120 px per 10 s
//   presidio     entrate e uscite da torri e fortezze, rinunce; un edificio
//                che in 60 s cambia piu' di 4 volte
//   lavoratori   lavoratori nemici fermi (action 0) per 30 s
// eslint-disable-next-line no-unused-vars
function installEnemyMonitor() {
  const G = window.__game, w = G.world, g = G.g, B = window.__bot, p = w.path;
  const T = new Map(), lines = [], seen = new Set(), counts = {};
  const now = () => w._stepNo;
  const mmss = () => { const s = Math.floor(now() / 60); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const short = (o) => o.object.replace(/^enemy_/, "");
  const at = (o) => `${Math.round(o.x)},${Math.round(o.y)}`;
  const note = (kind, key, msg) => {
    counts[kind] = (counts[kind] || 0) + 1;
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(`${mmss()} [${kind}] ${msg}`);
  };
  const state = (o) => `a${o.action} w${o.warwork ?? "-"} r${o.role ?? "-"}${o.presidiowork ? " presidio" : ""}${o.retreat ? " ritirata" : ""}${o.eco ? " eco" : ""}${o.defending ? " difende" : ""}`;
  const SIEGE = ["enemy_catapulta", "enemy_ariete"];
  const BLD = ["enemy_torre", "enemy_castello"];
  const garrison = new Map(); // edificio -> { n, flips: [passi] }
  // chi c'e' addosso o 12 px piu' avanti, verso la meta
  const blocker = (o) => {
    const on = w.instancePlace(o, o.x, o.y, null, true);
    const a = Math.atan2(o.diroy - o.y, o.dirox - o.x), nx = o.x + Math.cos(a) * 12, ny = o.y + Math.sin(a) * 12;
    const ahead = w.instancePlace(o, nx, ny, null, true);
    const gx = Math.floor(nx / 32), gy = Math.floor(ny / 32);
    const cx = Math.floor(o.x / 32), cy = Math.floor(o.y / 32), f = o.flow_field;
    const fv = f instanceof Int32Array && p.inside(cx, cy) ? f[cy * p.gw + cx] : "-";
    const esc = f instanceof Int32Array && fv === -1 ? (p.escapeCell(f, cx, cy, 6) ? "uscita a 6 celle" : "nessuna uscita") : "";
    return `addosso ${on ? on.object : "-"}, avanti ${ahead ? ahead.object : "-"}, cella avanti ${p.inside(gx, gy) ? p.cost[gy * p.gw + gx] : "fuori"}, ${f ? `campo (qui ${fv}${esc ? ", " + esc : ""}, dir ${p.flowAt(f, cx, cy)})` : "dritto"}, linea ${p.clearSolid(o.x, o.y, o.dirox, o.diroy) ? "libera" : "chiusa"}`;
  };
  B.mon = () => {
    const t = now();
    const alive = new Set();
    for (const o of w.all("enemy_unit")) {
      alive.add(o.id);
      let s = T.get(o.id);
      if (!s) { s = { x: o.x, y: o.y, still: 0, rev: [], vx: 0, vy: 0, solid: 0, life: o.life, hitStill: 0, near: 0, idle: 0, pres: o.presidiowork }; T.set(o.id, s); }
      const dx = o.x - s.x, dy = o.y - s.y, d = Math.hypot(dx, dy);
      if (!Number.isFinite(o.x) || !Number.isFinite(o.y) || o.x < -50 || o.y < -50 || o.x > w.roomW + 50 || o.y > w.roomH + 50) {
        note("fuori", "fuori" + o.id, `${short(o)} #${o.id} a ${at(o)} ${state(o)}`);
      }
      // fermo in cammino
      if (o.action === 1 && d < 3) s.still++; else s.still = 0;
      if (s.still === 20) note("fermo", "fermo" + o.id + ":" + Math.round(o.x / 100) + Math.round(o.y / 100),
        `${short(o)} #${o.id} fermo in cammino a ${at(o)} verso ${Math.round(o.dirox)},${Math.round(o.diroy)} ${state(o)} | ${blocker(o)}`);
      // inversioni di marcia
      // (non i lavoratori: fra un albero e il deposito a 100 px vanno avanti e indietro di continuo)
      if (o.object !== "enemy_omino" && d > 10 && Math.hypot(s.vx, s.vy) > 10 && dx * s.vx + dy * s.vy < -0.5 * d * Math.hypot(s.vx, s.vy)) s.rev.push(t);
      s.rev = s.rev.filter((r) => t - r < 3600);
      if (s.rev.length >= 20 && B.monWatch) B.monWatch(o);
      if (s.rev.length >= 6) note("avanti/indietro", "rev" + o.id + ":" + Math.floor(t / 3600),
        `${short(o)} #${o.id} ${s.rev.length} inversioni in 60 s a ${at(o)} verso ${Math.round(o.dirox)},${Math.round(o.diroy)} ${state(o)}`);
      if (d > 10) { s.vx = dx; s.vy = dy; }
      // nell'ostacolo (le macchine d'assedio hanno il campo largo: solo la cella)
      const gx = Math.floor(o.x / 32), gy = Math.floor(o.y / 32);
      // (non i lavoratori nei campi, azione 4: il campo e' un ostacolo)
      if (p.inside(gx, gy) && p.cost[gy * p.gw + gx] >= 1000 && !(o.object === "enemy_omino" && o.action === 4)) s.solid++; else s.solid = 0;
      if (s.solid === 10) note("nell'ostacolo", "solid" + o.id, `${short(o)} #${o.id} su una cella chiusa a ${at(o)} ${state(o)}`);
      // colpito e fermo
      const hit = o.life < s.life;
      if (hit && o.action === 0 && d < 1) s.hitStill++; else if (!hit && o.action !== 0) s.hitStill = 0;
      if (hit && o.action !== 0) s.hitStill = 0;
      if (s.hitStill === 10 && o.object !== "enemy_omino" && !o.retreat) note("colpito fermo", "hit" + o.id,
        `${short(o)} #${o.id} perde vita da 5 s senza reagire a ${at(o)} (vita ${o.life}/${o.slife}) ${state(o)}`);
      s.life = o.life;
      // indifferente a un soldato vicino
      const a = w.nearest(o.x, o.y, "ally_militare");
      const close = a && w.distanceToInstance(o, a) < 120;
      if (close && o.action === 0 && !o.retreat && o.object !== "enemy_omino" && !SIEGE.includes(o.object)) s.near++; else s.near = 0;
      if (s.near === 20) note("indifferente", "near" + o.id + ":" + Math.floor(t / 3600),
        `${short(o)} #${o.id} fermo da 10 s con ${a.object.replace(/^ally_/, "")} a ${Math.round(w.distanceToInstance(o, a))} px, a ${at(o)} ${state(o)}`);
      // lavoratori fermi
      if (o.object === "enemy_omino") {
        if (o.action === 0) s.idle++; else s.idle = 0;
        if (s.idle === 60) note("lavoratori", "idle" + o.id + ":" + Math.floor(t / 7200), `omino #${o.id} fermo da 30 s a ${at(o)}`);
      }
      // presidio: rinunce
      if (s.pres === 1 && o.presidiowork !== 1) note("presidio", "giveup" + o.id + ":" + t, `arciere #${o.id} rinuncia al presidio a ${at(o)}`);
      s.pres = o.presidiowork;
      s.x = o.x; s.y = o.y;
    }
    for (const id of [...T.keys()]) if (!alive.has(id)) T.delete(id);
    // macchine addosso
    const sg = SIEGE.flatMap((n) => [...w.all(n)]).filter((o) => o.action !== 1);
    for (let i = 0; i < sg.length; i++) for (let j = i + 1; j < sg.length; j++) {
      const A = sg[i], Bm = sg[j], k = "pair" + A.id + "-" + Bm.id;
      if (Math.abs(A.x - Bm.x) < 170 && Math.abs(A.y - Bm.y) < 120) {
        T.set(k, (T.get(k) || 0) + 1);
        if (T.get(k) === 20) note("macchine addosso", k, `${short(A)} #${A.id} e ${short(Bm)} #${Bm.id} ferme addosso a ${at(A)} (${state(A)} / ${state(Bm)})`);
      } else T.delete(k);
    }
    // presidio: entrate e uscite
    for (const n of BLD) for (const b of w.all(n)) {
      const st = garrison.get(b) || { n: b.npresidio, flips: [] };
      if (b.npresidio !== st.n && st.n !== undefined) {
        const verb = b.npresidio > st.n ? "entra" : "esce";
        counts["presidio " + verb] = (counts["presidio " + verb] || 0) + Math.abs(b.npresidio - st.n);
        lines.push(`${mmss()} [presidio] ${short(b)} ${at(b)}: ${verb} (${st.n} -> ${b.npresidio}), vita ${b.life}/${b.slife}`);
        st.flips.push(t);
        st.flips = st.flips.filter((f) => t - f < 3600);
        if (st.flips.length > 4) note("presidio instabile", "flip" + b.id + ":" + Math.floor(t / 3600), `${short(b)} ${at(b)}: ${st.flips.length} cambi in 60 s`);
      }
      st.n = b.npresidio;
      garrison.set(b, st);
    }
  };
  // TRACE=1: i passi di chi va avanti e indietro (20 inversioni), 60 passi
  if (window.__monTrace) {
    const adv = G.advance.bind(G), watch = new Map(), done = new Set();
    B.monWatch = (o) => { if (!done.has(o.id) && watch.size < 3) { done.add(o.id); watch.set(o, []); } };
    G.advance = (n) => {
      for (let k = 0; k < n; k++) {
        adv(1);
        for (const [o, tr] of watch) {
          const a = w.nearest(o.x, o.y, "ally_unit");
          tr.push(`${Math.round(o.x)},${Math.round(o.y)} a${o.action} w${o.warwork} r${o.role} d${Math.round(o.dirox)},${Math.round(o.diroy)} dir${Math.round(o.direction)} sp${(o.speed || 0).toFixed(1)}`
            + ` anc${o.anchorX ? Math.round(o.anchorX) + "," + Math.round(o.anchorY) : "-"} wait${o.waitUntil ? o.waitUntil - now() : "-"} ally${a ? Math.round(w.distanceToInstance(o, a)) : "-"} meleeGo${o.meleeGo ? o.meleeGo.map(Math.round) : "-"}`);
          if (tr.length >= 60 || !o.alive) { lines.push(`${mmss()} [traccia] ${short(o)} #${o.id}:\n        ` + tr.join("\n        ")); watch.delete(o); }
        }
      }
    };
  }
  let shown = 0;
  B.monNew = () => { const r = lines.slice(shown); shown = lines.length; return r; };
  B.monReport = () => {
    const bld = BLD.flatMap((n) => [...w.all(n)]).map((b) => `${short(b)} ${at(b)} ${b.npresidio}${b.watch ? " (vedetta)" : ""}`);
    return `conteggi (passi di 0,5 s): ${JSON.stringify(counts)}\n      presidi: ${bld.join("; ")}`
      + `\n      nemici: ${w.number("enemy_unit")}, attesa ${[...w.all("enemy_unit")].filter((e) => e.role === 30).length}, all'attacco ${[...w.all("enemy_unit")].filter((e) => e.role === 31 || e.role === 32).length}`
      + ` | risorse nemiche ${g.en ? `${g.en.food}/${g.en.wood}/${g.en.gold}/${g.en.stone}` : "-"}`;
  };
}
