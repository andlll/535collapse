// [§9.156, multiplayer, fase 4] Il lockstep (src/lockstep.js) e i codici
// (src/netcode.js), senza browser: due "pagine" con un mondo giocattolo
// (lo stato cambia a ogni passo e coi comandi, nell'ordine in cui arrivano)
// collegate da un canale finto che ritarda e rimescola i messaggi. Le due
// pagine devono restare identiche passo per passo; la pausa si apre allo
// stesso passo in tutte e due; una differenza si scopre alla prima impronta;
// il saluto e il canale chiuso si distinguono.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Commands } from "../src/commands.js";
import { Lockstep, delayFor, MIN_DELAY, MAX_DELAY } from "../src/lockstep.js";
import { encodeCode, decodeCode, CodeError } from "../src/netcode.js";

// un generatore ripetibile (le prove devono dare sempre lo stesso risultato)
const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// il canale finto: ogni messaggio arriva dopo 0..maxLag giri, in ordine sparso
function wire(rand, maxLag) {
  const q = [];
  let now = 0;
  const end = (to) => ({
    peer: null, closedFlag: false,
    send(m) { if (this.closedFlag) throw new Error("chiuso"); q.push({ at: now + Math.floor(rand() * (maxLag + 1)), to: this.peer, s: JSON.stringify(m) }); },
    close() { this.closedFlag = true; if (this.peer && this.peer.ls) q.push({ at: now + 1, to: this.peer, close: true }); },
  });
  const a = end(), b = end();
  a.peer = b; b.peer = a;
  return {
    a, b,
    tick() {
      now++;
      const due = q.filter((m) => m.at <= now);
      for (const m of due) q.splice(q.indexOf(m), 1);
      // in disordine
      for (let i = due.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [due[i], due[j]] = [due[j], due[i]]; }
      for (const m of due) { if (m.close) m.to.ls.closed(); else m.to.ls.receive(JSON.parse(m.s)); }
    },
    pending: () => q.length,
  };
}

// una pagina: il mondo giocattolo, la sua coda dei comandi e il lockstep
function page(local, end, opts = {}) {
  const commands = new Commands();
  const world = { _stepNo: 0, state: 7, trace: [] };
  commands.on("add", (w, c) => { w.state = (Math.imul(w.state, 31) + c.v * 3 + c.p * 1000) | 0; w.trace.push([w._stepNo, c.p, c.v]); });
  const events = [];
  const ls = new Lockstep({ commands, local, link: end, version: "t1", delay: opts.delay ?? null, clock: opts.clock || (() => 0),
                            emit: (t, i) => events.push([t, i]), checkEvery: 30 });
  commands.on("pausa", (w, c) => ls.executePause(w._stepNo, c));
  end.ls = ls;
  const P = {
    world, commands, ls, events, paused: false,
    step() { // un passo, se si puo'
      if (P.paused || !ls.ready(world._stepNo)) return false;
      commands.runDue(world);
      world.state = (world.state ^ (world._stepNo * 2654435761)) | 0;
      world._stepNo++;
      ls.afterStep(world._stepNo, () => world.state, opts.endAt !== undefined && world._stepNo >= opts.endAt);
      return true;
    },
    act(v) { commands.issue("add", { v }, ls.cmdStep(world._stepNo), local); },
  };
  ls.emit = (t, i) => { events.push([t, i]); if (t === "pause") P.paused = true; if (t === "resume") P.paused = false; };
  return P;
}

test("§9.156 lockstep: due pagine con un canale lento e in disordine restano uguali", () => {
  for (const seed of [1, 2, 3]) {
    const rand = rng(seed), net = wire(rand, 6);
    const A = page(0, net.a, { delay: 5 }), B = page(1, net.b, { delay: 5 });
    A.ls.opened(); B.ls.opened();
    let guard = 0;
    while ((A.world._stepNo < 400 || B.world._stepNo < 400) && guard++ < 20000) {
      net.tick();
      for (const P of [A, B]) {
        const n = Math.floor(rand() * 4); // pagine con velocita' diverse e irregolari
        for (let k = 0; k < n && P.world._stepNo < 400; k++) {
          if (rand() < 0.15 && P.ls.running) P.act(Math.floor(rand() * 100));
          if (!P.step()) break;
        }
      }
    }
    assert.equal(A.world._stepNo, 400, `seme ${seed}: A arriva in fondo`);
    assert.equal(B.world._stepNo, 400, `seme ${seed}: B arriva in fondo`);
    assert.equal(A.world.state, B.world.state, `seme ${seed}: stesso stato`);
    assert.deepEqual(A.world.trace, B.world.trace, `seme ${seed}: stessi comandi agli stessi passi`);
    assert.ok(A.world.trace.some((t) => t[1] === 0) && A.world.trace.some((t) => t[1] === 1), "comandi delle due parti");
    // nessun comando eseguito prima di D passi da quando e' stato dato
    assert.ok(A.world.trace.every(([s]) => s >= 5));
    // le impronte confrontate (ogni 30 passi), tutte uguali
    while (net.pending()) net.tick();
    assert.ok(A.ls.checks.length >= 12 && A.ls.checks.every(([, ok]) => ok), JSON.stringify(A.ls.checks));
    assert.equal(A.ls.desync, null);
  }
});

test("§9.156 lockstep: avvio, versione, ritardo misurato", () => {
  const rand = rng(9), net = wire(rand, 3);
  let t = 0;
  const clock = () => t;
  const A = page(0, net.a, { clock }), B = page(1, net.b, { clock });
  A.ls.opened(); B.ls.opened();
  for (let k = 0; k < 60 && !(A.ls.running && B.ls.running); k++) { t += 16; net.tick(); }
  assert.ok(A.ls.running && B.ls.running);
  assert.equal(A.ls.delay, B.ls.delay);
  assert.ok(A.ls.rtt > 0 && A.ls.delay >= MIN_DELAY);
  assert.equal(delayFor(0), MIN_DELAY);
  assert.equal(delayFor(100), 6);
  assert.equal(delayFor(5000), MAX_DELAY);
  // prima dell'avvio non si gioca
  const n2 = wire(rand, 0), C = page(0, n2.a), D = page(1, n2.b);
  assert.equal(C.ls.ready(0), false);
  // versioni diverse: errore da tutte e due le parti
  D.ls.version = "t2";
  C.ls.opened(); D.ls.opened();
  for (let k = 0; k < 5; k++) n2.tick();
  assert.equal(C.ls.state, "error");
  assert.equal(D.ls.state, "error");
  assert.deepEqual(C.events.find(([e]) => e === "error")[1], { reason: "version", theirs: "t2" });
});

test("§9.156 lockstep: la pausa allo stesso passo, la ripresa da tutte e due le parti", () => {
  const rand = rng(4), net = wire(rand, 4);
  const A = page(0, net.a, { delay: 6 }), B = page(1, net.b, { delay: 6 });
  A.ls.opened(); B.ls.opened();
  const run = (ticks, onTick = () => {}) => {
    for (let k = 0; k < ticks; k++) {
      net.tick();
      onTick();
      for (const P of [A, B]) for (let j = 0; j < 2; j++) if (!P.step()) break;
    }
  };
  run(50);
  // A chiede la pausa due volte, B una quasi insieme: una pausa sola
  A.ls.requestPause(A.world._stepNo);
  assert.equal(A.ls.requestPause(A.world._stepNo), false);
  B.ls.requestPause(B.world._stepNo);
  run(40);
  assert.ok(A.paused && B.paused);
  assert.equal(A.world._stepNo, B.world._stepNo, "ferme allo stesso passo");
  assert.equal(A.ls.pausedAt, B.ls.pausedAt);
  const at = A.world._stepNo;
  run(20);
  assert.equal(A.world._stepNo, at, "ferme");
  // riprende B: si riparte tutte e due
  B.ls.resume();
  run(40);
  assert.ok(!A.paused && !B.paused);
  assert.ok(A.world._stepNo > at + 20 && Math.abs(A.world._stepNo - B.world._stepNo) <= 6 * 2);
  // la pausa chiesta prima della pausa eseguita era la stessa: niente seconda pausa
  run(40);
  assert.ok(!A.paused && !B.paused);
  assert.equal(A.events.filter(([e]) => e === "pause").length, 1);
  // una ripresa che arriva prima della pausa (B lenta): B non si ferma
  A.ls.requestPause(A.world._stepNo);
  let resumed = false;
  run(60, () => { if (A.paused && !resumed) { resumed = true; A.ls.resume(); } });
  assert.ok(resumed && !A.paused && !B.paused);
  while (A.world._stepNo < 400 || B.world._stepNo < 400) { net.tick(); for (const P of [A, B]) if (P.world._stepNo < 400) P.step(); }
  assert.equal(A.world.state, B.world.state);
});

test("§9.156 lockstep: una differenza si scopre, il saluto, il canale perso, la fine", () => {
  const rand = rng(5), net = wire(rand, 2);
  const A = page(0, net.a, { delay: 4 }), B = page(1, net.b, { delay: 4 });
  A.ls.opened(); B.ls.opened();
  const run = (ticks) => { for (let k = 0; k < ticks; k++) { net.tick(); for (const P of [A, B]) P.step(); } };
  run(40);
  B.world.state ^= 1; // una pagina diversa
  run(80);
  assert.ok(A.ls.desync && B.ls.desync);
  assert.equal(A.ls.desync.step, B.ls.desync.step);
  assert.ok(A.events.some(([e]) => e === "desync"));
  // il saluto: l'altro ha lasciato la partita
  A.ls.leave();
  run(5);
  assert.equal(B.ls.state, "left");
  assert.ok(B.events.some(([e]) => e === "left"));
  // il canale chiuso senza saluto: connessione persa
  const n2 = wire(rand, 1), C = page(0, n2.a, { delay: 4 }), D = page(1, n2.b, { delay: 4 });
  C.ls.opened(); D.ls.opened();
  for (let k = 0; k < 10; k++) { n2.tick(); C.step(); D.step(); }
  n2.a.close();
  for (let k = 0; k < 5; k++) n2.tick();
  assert.equal(D.ls.state, "lost");
  // la fine della partita: niente piu' attese ne' impronte
  const n3 = wire(rand, 1), E = page(0, n3.a, { delay: 4, endAt: 50 }), F = page(1, n3.b, { delay: 4, endAt: 50 });
  E.ls.opened(); F.ls.opened();
  for (let k = 0; k < 100; k++) { n3.tick(); E.step(); F.step(); }
  assert.equal(E.ls.state, "ended");
  assert.ok(E.ls.checks.length >= 1 && E.ls.checks.every(([s]) => s < 50), "impronte solo prima della fine");
  F.ls.leave(); // dopo la fine il saluto non e' un allarme
  for (let k = 0; k < 3; k++) n3.tick();
  for (let k = 0; k < 20; k++) E.step(); // E va avanti da sola
  assert.ok(E.world._stepNo > 100);
  assert.ok(!E.events.some(([e]) => e === "left" || e === "lost"));
});

test("§9.156 codici: andata e ritorno, spazi, tipi, errori", async () => {
  const sdp = "v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\ns=-\r\n" + "a=candidate:1 1 udp 2122260223 192.168.1.10 54321 typ host\r\n".repeat(3);
  const code = await encodeCode("offer", { v: "0.2612", sdp, setup: { map: "sk_padus", seed: 42 } });
  assert.match(code, /^DVOz[A-Za-z0-9_-]+$/);
  // incollato con a capo, spazi e virgolette della chat
  const pasted = '"' + code.slice(0, 40) + "\n  " + code.slice(40) + ' "';
  const { kind, data } = await decodeCode(pasted);
  assert.equal(kind, "offer");
  assert.equal(data.sdp, sdp);
  assert.deepEqual(data.setup, { map: "sk_padus", seed: 42 });
  assert.equal(data.v, "0.2612");
  const ans = await decodeCode(await encodeCode("answer", { v: "0.2612", sdp }));
  assert.equal(ans.kind, "answer");
  // errori
  await assert.rejects(decodeCode(""), (e) => e instanceof CodeError && e.reason === "empty");
  await assert.rejects(decodeCode("ciao come stai"), (e) => e.reason === "invalid");
  await assert.rejects(decodeCode(code.slice(0, code.length - 30)), (e) => e.reason === "invalid" && e.kind === "offer");
});

test("§9.156 lockstep: la chat passa, fuori dai turni", () => {
  const rand = rng(8), net = wire(rand, 3);
  const A = page(0, net.a, { delay: 4 }), B = page(1, net.b, { delay: 4 });
  assert.equal(A.ls.sendChat("presto"), false); // canale non ancora aperto
  A.ls.opened(); B.ls.opened();
  for (let k = 0; k < 10; k++) { net.tick(); A.step(); B.step(); }
  assert.ok(A.ls.sendChat("ciao dal rosso " + "x".repeat(300)));
  assert.ok(B.ls.sendChat("ciao dal blu"));
  for (let k = 0; k < 10; k++) { net.tick(); A.step(); B.step(); }
  const got = (P) => P.events.filter(([e]) => e === "chat").map(([, i]) => i.text);
  assert.deepEqual(got(A), ["ciao dal blu"]);
  assert.equal(got(B)[0].length, 200);
  assert.ok(got(B)[0].startsWith("ciao dal rosso"));
  // fuori dai turni: nessun comando in coda per la chat
  assert.ok([...A.commands.queue, ...B.commands.queue].every((c) => c.k === "add"));
});
