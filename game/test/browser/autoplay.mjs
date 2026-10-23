// Un giocatore automatico per il livello 5 (§9.77): gioca la partita con gli
// stessi comandi del giocatore (clic destro vero per gli ordini, i tasti di
// costruzione e produzione, il clic sinistro per piazzare gli edifici; la
// selezione la imposta direttamente, come le altre prove) e scrive
// cosa succede: fasi, risorse, perdite, ondate, la fortezza, l'assalto.
// Strategie:
//   ordinato   magazzino vicino all'acropoli, pietra, fortezza, difesa vicino
//              alla base; con 2 arieti e 2 catapulte (e 20 soldati)
//              l'assalto alla porta ovest, poi la citta' edificio per edificio
//   aggressivo come ordinato, ma l'assalto appena ci sono 2 macchine
//   lento      come ordinato, ma prima 2 torri vicino alla base e l'assalto
//              con 4 arieti, 3 catapulte e 30 soldati
// Non e' nella CI (una partita dura minuti). Esce con codice 0 se vince.
//
//   python3 -m http.server 8123 --directory game     (in un altro terminale)
//   node game/test/browser/autoplay.mjs [strategia] [minuti di gioco] [seme]
//   SHOTS=cartella: uno screenshot nei momenti chiave
const mod = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(mod);
const [STRAT = "ordinato", MINUTES = "40", SEED = "1"] = process.argv.slice(2);
const SHOTS = process.env.SHOTS || "";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${process.env.BASE || "http://localhost:8123"}/index.html?room=lvl05&nostart=1`);
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
if (SHOTS) await page.addStyleTag({ content: "#message{display:none !important}" });

await page.evaluate(([STRAT, SEED]) => {
  const G = window.__game, w = G.world, g = G.g, cam = G.cam;
  let seed = Number(SEED);
  Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const S = {
    ordinato: { towers: 0, attackRams: 2, attackCats: 2, attackArmy: 20 },
    aggressivo: { towers: 0, attackRams: 1, attackCats: 1, attackArmy: 0 },
    lento: { towers: 2, attackRams: 4, attackCats: 3, attackArmy: 30 },
  }[STRAT];
  const KEY = { casa: 81, magazzino: 87, castello: 71, torre: 65 };
  const COST = { casa: { wood: 50 }, magazzino: { wood: 70 }, castello: { stone: 850 }, torre: { stone: 200 } };
  const UNIT = { warrior: [81, { food: 75, gold: 35 }], ariete: [81, { wood: 250, gold: 60 }], catapulta: [87, { wood: 200, gold: 100 }] };
  const RALLY = [2350, 2300], STAGE = [4550, 2450], STORE = [2650, 2250];
  const log = [];
  const B = window.__bot = { log, t: 0, ev: {}, S, strat: STRAT };
  B.step = (n) => step(n);
  const now = () => w._stepNo;
  const mmss = () => { const s = Math.floor(now() / 60); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const say = (m) => log.push(`${mmss()} ${m}`);
  const once = (k, m) => { if (!B.ev[k]) { B.ev[k] = mmss(); say(m); } };
  // ------------------------------------------------------------ comandi
  const look = (x, y) => { cam.x = x - cam.w / 2; cam.y = y - cam.h / 2; };
  const pointer = (x, y) => { w.input.x = (x - cam.x) * cam.cssW / cam.w; w.input.y = (y - cam.y) * cam.cssH / cam.h; w.input.inside = true; };
  const step = (n = 1) => {
    for (let k = 0; k < n; k++) {
      G.advance(1);
      for (const d of [...w.all("parent_hint")]) { if (/^dialogo_5_/.test(d.object)) say("dialogo " + d.object); w.destroy(d); }
    }
  };
  const select = (list) => {
    for (const u of w.all("ally")) u.selected = 0;
    for (const u of list) u.selected = 1;
    g.sel = list.length; g.milsel = list.filter((u) => w.is(u, "ally_militare")).length;
    g.firesel = list.filter((u) => /warrior|picchiere/.test(u.object)).length;
  };
  const rclick = (x, y) => { look(x, y); step(1); pointer(x, y); w.input._mr[1] = true; step(1); };
  const rclickOn = (b) => { const bb = w.bbox(b); rclick(bb ? (bb[0] + bb[2]) / 2 : b.x, bb ? (bb[1] + bb[3]) / 2 : b.y); };
  const key = (k) => { w.input._pressed.add(k); w.input._down.add(k); step(1); w.input._down.delete(k); w.input._released.add(k); step(1); };
  const order = (list, x, y) => { if (!list.length) return; select(list); rclick(x, y); select([]); };
  const canPay = (c) => Object.entries(c).every(([r, v]) => g[r] >= v);
  // un edificio: il tasto con dei civili selezionati, il fantasma sotto il
  // puntatore (a spirale attorno a x, y finche' il posto e' libero), il clic
  const build = (fam, x, y, civs) => {
    if (!canPay(COST[fam]) || !civs.length) return null;
    select(civs); look(x, y); step(2);
    pointer(x, y); key(KEY[fam]);
    const pl = w.all(fam + "_placer").next().value;
    if (!pl) { select([]); return null; }
    for (let k = 0; k < 60; k++) {
      const a = k * 0.9, r = k * 18, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.7;
      look(px, py); pointer(px, py); step(1);
      if (pl.alive && pl.place === 1) {
        w.input._mp[0] = true; w.input._mdown[0] = true; step(1);
        w.input._mdown[0] = false; w.input._mr[0] = true; step(1);
        const f = [...w.all(fam + "_fond")].sort((a2, b2) => Math.hypot(a2.x - px, a2.y - py) - Math.hypot(b2.x - px, b2.y - py))[0];
        select([]);
        return f || null;
      }
    }
    if (pl.alive) w.destroy(pl);
    select([]);
    return null;
  };
  const produce = (b, unit, n = 1) => {
    const [k, c] = UNIT[unit];
    let made = 0;
    select([]); b.selected = 1; look(b.x, b.y); step(2);
    for (let j = 0; j < n && canPay(c) && (b.coda || 0) < 5; j++) { key(k); made++; }
    b.selected = 0; step(1);
    return made;
  };
  const trainWorkers = (n) => {
    const c = w.all("centro").next().value;
    if (!c) return;
    select([]); c.selected = 1; look(c.x, c.y); step(2);
    for (let j = 0; j < n && g.food >= 50 && g.pop < g.popcap; j++) key(81);
    c.selected = 0; step(1);
  };
  // ------------------------------------------------------------- stato
  const civs = () => [...w.all("ally_omino")];
  const army = () => [...w.all("ally_militare")].filter((u) => !/ariete|catapulta/.test(u.object));
  const siege = (o) => [...w.all("ally_" + o)];
  const near = (x, y, o, r = Infinity) => { const n = w.nearest(x, y, o); return n && Math.hypot(n.x - x, n.y - y) < r ? n : null; };
  // fermo: senza azione (finito un cantiere buildwork resta a 1)
  const idle = (o) => o.action === 0;
  const CITY = ["enemy_centro", "enemy_house", "enemy_caserma", "enemy_stalla", "enemy_chiesa", "enemy_castello",
                "enemy_magazzino", "enemy_mulino", "enemy_torre", "enemy_fondamenta"];
  const cityList = () => CITY.flatMap((o) => [...w.all(o)]);
  B.civdump = () => civs().map((o) => `#${o.id % 1000} job ${B.state.jobs.get(o.id)} a${o.action} w${o.woodwork} g${o.goldwork} s${o.stonework} f${o.foodwork} b${o.buildwork} fw${o.fieldwork} at ${Math.round(o.x)},${Math.round(o.y)} -> ${Math.round(o.dirox)},${Math.round(o.diroy)} carry ${o.wood || 0}/${o.gold || 0}/${o.stone || 0}/${o.food || 0}`).join("\n");
  B.status = () => {
    const L = g.l5 || {};
    return `${mmss()} fase ${L.phase} | cibo ${g.food} legno ${g.wood} oro ${g.gold} pietra ${g.stone} pop ${g.pop}/${g.popcap}`
      + ` | soldati ${army().length} civili ${civs().length} arieti ${siege("ariete").length} catapulte ${siege("catapulta").length}`
      + ` | nemici ${w.number("enemy_unit")} (lavoratori ${w.number("enemy_omino")}) ondate ${g.en ? g.en.wave : 0}`
      + ` citta' ${L.left} pietra nemica ${g.en ? g.en.stone : "-"}`;
  };
  B.state = { jobs: new Map(), store: null, fort: null, towers: [], assault: false, gateDown: false, badTree: new Set() };
  // le perdite: chi c'era al turno prima e non c'e' piu'
  B.dead = { ally: {}, enemy: {} };
  let seen = new Map();
  B.count = () => {
    const cur = new Map();
    for (const u of w.all("ally_unit")) cur.set(u.id, ["ally", u.object.replace(/^ally_/, "")]);
    for (const u of w.all("enemy_unit")) cur.set(u.id, ["enemy", u.object.replace(/^enemy_/, "")]);
    for (const [id, [side, o]] of seen) if (!cur.has(id)) B.dead[side][o] = (B.dead[side][o] || 0) + 1;
    seen = cur;
  };
  // ----------------------------------------------------------- un turno
  B.act = () => {
    const st = B.state, L = g.l5;
    const C = civs();
    // i civili: cibo (un campo), legno, oro, pietra (dopo il magazzino)
    const want = (kind) => [...st.jobs.values()].filter((k) => k === kind).length;
    for (const o of C) if (!st.jobs.has(o.id) || (idle(o) && now() - (o.botAt || 0) > 300)) st.jobs.delete(o.id);
    // un taglialegna che da 20 s non porta legno (camminando sul posto verso
    // un albero che non raggiunge): quell'albero no, un altro
    for (const o of C) {
      if (st.jobs.get(o.id) !== "wood" || !o.botTree || now() - (o.botAt || 0) < 1200) continue;
      if (!o.wood && o.action === 1 && o.woodwork === 1) { st.badTree.add(o.botTree); say("albero irraggiungibile, un altro"); st.jobs.delete(o.id); }
      else o.botAt = now();
    }
    const assign = (o, kind) => {
      st.jobs.set(o.id, kind); o.botAt = now();
      if (kind === "wood") {
        // l'albero vero piu' vicino a un deposito (il magazzino vicino
        // all'acropoli, se c'e': vicino alla base gli alberi sono quasi
        // tutti decorativi), escluso quello a cui si e' rimasti bloccati
        const dep = st.store || w.all("centro").next().value;
        const t = [...w.all("albero")].filter((a) => !st.badTree.has(a.id))
          .sort((a, b) => Math.hypot(a.x - dep.x, a.y - dep.y) - Math.hypot(b.x - dep.x, b.y - dep.y))[0];
        if (t) { o.botTree = t.id; o.botWood = g.wood; select([o]); rclickOn(t); select([]); }
      }
      if (kind === "gold") { const t = near(660, 1972, "miniera_oro"); if (t) { select([o]); rclickOn(t); select([]); } }
      if (kind === "stone") {
        const s = st.store || w.all("centro").next().value;
        const t = [...w.all("stone_parent")].sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
        if (t) { select([o]); rclickOn(t); select([]); }
      }
      if (kind === "food") {
        const f = near(660, 1972, "campo_fond") || near(660, 1972, "campo");
        if (f) { select([o]); rclickOn(f); select([]); }
      }
    };
    const plan = () => {
      const n = C.length;
      const stone = st.fort ? 1 : Math.max(2, n - 4);
      return { food: 1, wood: st.fort ? 3 : 2, gold: st.fort ? Math.max(1, n - 5) : 1, stone };
    };
    const P = plan();
    for (const o of C) {
      if (st.jobs.has(o.id) && !idle(o)) continue;
      if (st.jobs.has(o.id) && idle(o)) { assign(o, st.jobs.get(o.id)); continue; }
      const kind = ["food", "stone", "wood", "gold"].find((k) => want(k) < P[k]) || "wood";
      assign(o, kind);
    }
    // altri civili, e case quando la popolazione e' al limite
    if (C.length < 10 && g.food >= 100) trainWorkers(1);
    if (g.popcap - g.pop < 6 && g.wood >= 120 && !w.exists("casa_fond")) {
      const b = civs().filter((o) => st.jobs.get(o.id) === "wood").slice(0, 2);
      if (build("casa", 900 + Math.random() * 300, 2500 + Math.random() * 200, b)) say("casa");
    }
    // il magazzino vicino all'acropoli
    if (!st.store && !w.exists("magazzino_fond") && g.wood >= 70) {
      const b = civs().slice(0, 2);
      const f = build("magazzino", STORE[0], STORE[1], b);
      if (f) { say("magazzino in costruzione"); st.storeFond = f; }
    }
    if (!st.store) { const m = near(STORE[0], STORE[1], "magazzino", 600); if (m) { st.store = m; say("magazzino finito"); for (const o of civs()) if (st.jobs.get(o.id) === "stone") st.jobs.delete(o.id); } }
    // la fortezza
    if (!st.fort && !w.exists("castello_fond") && g.stone >= 850) {
      const b = civs().filter((o) => st.jobs.get(o.id) === "stone");
      const f = build("castello", RALLY[0] - 250, RALLY[1] - 150, b.length ? b : civs().slice(0, 3));
      if (f) say("fortezza in costruzione");
    }
    if (!st.fort) { const f = w.all("castello").next().value; if (f) { st.fort = f; once("fortezza", "fortezza finita"); st.jobs.clear(); } }
    // le torri (strategia lenta)
    if (st.towers.length + w.number("torre_fond") < S.towers && g.stone >= 200 && (st.fort || S.towers)) {
      const b = civs().filter((o) => st.jobs.get(o.id) === "stone").slice(0, 2);
      const f = build("torre", RALLY[0] + 150 * (st.towers.length + 1), RALLY[1] + 200, b);
      if (f) { st.towers.push(f); say("torre in costruzione"); }
    }
    // l'esercito: in difesa vicino alla base dopo le mura; soldati dalla caserma
    if (L.phase >= 2 && !st.assault && !st.home) {
      st.home = 1;
      order(army(), RALLY[0], RALLY[1]);
      say("soldati richiamati vicino alla base");
    }
    const cas = w.all("caserma").next().value;
    if (cas && L.phase >= 2 && army().length < S.attackArmy + 6 && g.food >= 150 && g.gold >= 70) produce(cas, "warrior", 2);
    // le macchine d'assedio
    if (st.fort && st.fort.alive) {
      const r = siege("ariete").length, c = siege("catapulta").length;
      if (r < S.attackRams + 1 && canPay(UNIT.ariete[1])) produce(st.fort, "ariete", 1);
      else if (c < S.attackCats + 1 && canPay(UNIT.catapulta[1])) produce(st.fort, "catapulta", 1);
    }
    // l'assalto
    if (st.fort && !st.assault && siege("ariete").length >= S.attackRams && siege("catapulta").length >= S.attackCats
        && army().length >= S.attackArmy) {
      st.assault = true; say(`assalto: ${army().length} soldati, ${siege("ariete").length} arieti, ${siege("catapulta").length} catapulte`);
      order([...army(), ...siege("ariete"), ...siege("catapulta")], STAGE[0], STAGE[1]);
      st.assaultAt = now();
    }
    if (st.assault) {
      const gate = [...w.all("enemy_porta_vert"), ...w.all("enemy_porta_ori")].sort((a, b) => a.x - b.x)[0];
      if (!st.gateDown && (!gate || gate.x > 6000)) { st.gateDown = true; once("porta", "porta ovest abbattuta"); }
      if (now() - st.assaultAt > 600) {
        const rams = siege("ariete").filter((m) => m.action !== 2);
        if (!st.gateDown && gate && rams.length) { select(rams); rclickOn(gate); select([]); }
        if (st.gateDown) {
          // in citta': i soldati verso i nemici o gli edifici di legno (fuoco), gli arieti verso quelli di pietra
          const city = cityList();
          const enemies = [...w.all("enemy_unit")].filter((e) => e.x > 5000);
          const idleArmy = army().filter((u) => u.action === 0);
          if (idleArmy.length) {
            if (enemies.length) { const e = enemies.sort((a, b) => a.x - b.x)[0]; select(idleArmy); rclickOn(e); select([]); }
            else {
              const wood = city.filter((b) => w.is(b, "enemy_wooden")).sort((a, b) => a.x - b.x)[0];
              if (wood) { select(idleArmy.filter((u) => /warrior|picchiere/.test(u.object))); rclickOn(wood); select([]); }
            }
          }
          const stone = city.filter((b) => !w.is(b, "enemy_wooden"));
          for (const m of rams) {
            const t = (stone.length ? stone : city).sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
            if (t) { select([m]); rclickOn(t); select([]); }
          }
          const cats = siege("catapulta").filter((m) => m.action === 0);
          if (cats.length && city.length) { const t = city.sort((a, b) => a.x - b.x)[0]; order(cats, t.x - 500, t.y); }
        }
      }
      // rinforzi: chi e' rimasto alla base raggiunge l'assalto
      if (now() % 1800 < 30) {
        const back = [...army(), ...siege("ariete"), ...siege("catapulta")].filter((u) => u.x < 3500 && u.action === 0);
        if (back.length) order(back, st.gateDown ? 5600 : STAGE[0], STAGE[1]);
      }
    }
  };
  say(`strategia ${STRAT}`);
}, [STRAT, SEED]);

const STEPS = Number(MINUTES) * 3600, CHUNK = 1800;
let shotN = 0;
const shot = async (name) => {
  if (!SHOTS) return;
  await page.evaluate(() => window.__game.loop.render());
  await page.screenshot({ path: `${SHOTS}/${String(++shotN).padStart(2, "0")}_${name}.png` });
};
let printed = 0, result = null;
const seenEv = new Set();
for (let done = 0; done < STEPS && !result; done += CHUNK) {
  const r = await page.evaluate(([CHUNK, process_env_dump]) => {
    const G = window.__game, B = window.__bot, g = G.g;
    for (let s = 0; s < CHUNK; s += 30) {
      B.act();
      B.step(30);
      B.count();
      if (g.victory === 1 || g.gameover === 1) break;
    }
    return { status: B.status() + "\n      perdite: noi " + JSON.stringify(B.dead.ally) + " loro " + JSON.stringify(B.dead.enemy) + (process_env_dump ? "\n" + B.civdump() : ""), log: B.log.slice(), ev: B.ev, end: g.victory === 1 ? "VITTORIA" : g.gameover === 1 ? "SCONFITTA" : null,
             cam: [G.cam.x, G.cam.y] };
  }, [CHUNK, !!process.env.DUMP]);
  for (const l of r.log.slice(printed)) console.log("   " + l);
  printed = r.log.length;
  console.log(r.status);
  for (const k of Object.keys(r.ev)) if (!seenEv.has(k)) { seenEv.add(k); await shot(k); }
  if (r.end) result = r.end;
}
await shot("fine");
console.log(result || "TEMPO SCADUTO", errs.slice(0, 3));
await browser.close();
process.exit(result === "VITTORIA" ? 0 : 1);
