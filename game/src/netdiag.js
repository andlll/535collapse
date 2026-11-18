// [§9.158, richiesta dell'autore] Perche' la connessione della partita
// online non si apre: una segnalazione mirata invece del messaggio generico.
// Senza browser (si prova in node): legge gli indirizzi ("candidati" ICE)
// nelle due descrizioni della connessione (il proprio codice e quello
// dell'altro, netcode.js) e, se ci sono, le statistiche del tentativo
// (RTCPeerConnection.getStats, riassunte da summarizeStats).
//
// Cosa si capisce dagli indirizzi:
// - host: l'indirizzo del computer nella sua rete (spesso nascosto dal
//   browser come nome ".local"); srflx: l'indirizzo visto da fuori, che
//   danno i server STUN; relay: un server di inoltro (TURN, il gioco non ne
//   ha);
// - nessun indirizzo: il browser non ne da' (impostazioni della privacy,
//   estensioni che spengono WebRTC) -> "none";
// - con STUN acceso, nessun indirizzo esterno ne' un indirizzo pubblico del
//   computer: i server STUN non rispondono, la rete blocca UDP (firewall,
//   reti aziendali o scolastiche, VPN) -> "blocked";
// - lo stesso indirizzo esterno con piu' porte di quante sono le prese del
//   computer (il browser chiede ai due server STUN dalla stessa presa): il
//   router cambia porta per ogni destinazione, NAT simmetrico (reti mobili,
//   alcuni router) -> "symmetric". Si conta per difetto: meglio non dirlo
//   che dirlo a torto;
// - uno con soli indirizzi IPv6 e l'altro con soli IPv4 -> "family";
// - lo stesso indirizzo esterno dalle due parti: la stessa rete, che pero'
//   non lascia passare (Wi-Fi ospiti, isolamento dei dispositivi) ->
//   "same_network";
// - i codici scambiati in piu' di SLOW_MS: i router dimenticano gli
//   indirizzi -> "slow" (un consiglio in piu').
// Le cause sono in ordine di quanto spiegano il fallimento.

export const SLOW_MS = 120000;

// i candidati di una descrizione (SDP): { type, ip, port, proto, fam }
// (fam 4, 6, o null per i nomi ".local" e quelli sconosciuti)
export function parseCandidates(sdp) {
  const out = [];
  for (const line of String(sdp || "").split(/\r?\n/)) {
    const m = /^a=candidate:\S+ \d+ (\S+) \d+ (\S+) (\d+) typ (\S+)/i.exec(line.trim());
    if (!m) continue;
    const [, proto, ip, port, type] = m;
    const fam = /\.local$/i.test(ip) ? null : ip.includes(":") ? 6 : /^\d+\.\d+\.\d+\.\d+$/.test(ip) ? 4 : null;
    out.push({ type: type.toLowerCase(), ip, port: Number(port), proto: proto.toLowerCase(), fam });
  }
  return out;
}

// un indirizzo IPv4/IPv6 pubblico (non di una rete locale)
export function isPublic(ip) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return !(a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168)
      || (a === 169 && b === 254) || (a === 100 && b >= 64 && b < 128) || a >= 224);
  }
  if (ip.includes(":")) {
    const l = ip.toLowerCase();
    return !(l === "::1" || l.startsWith("fe80") || l.startsWith("fc") || l.startsWith("fd"));
  }
  return false;
}

// il profilo di una parte dai suoi candidati
export function profile(cands) {
  const udp = cands.filter((x) => x.proto === "udp");
  const host = udp.filter((x) => x.type === "host"), srflx = udp.filter((x) => x.type === "srflx");
  const relay = cands.filter((x) => x.type === "relay");
  const publicIPs = [...new Set([...srflx.map((x) => x.ip), ...host.filter((x) => isPublic(x.ip)).map((x) => x.ip)])];
  // NAT simmetrico: per un indirizzo esterno, piu' porte che prese del
  // computer (le prese: i candidati host della stessa famiglia o nascosti)
  let symmetric = false;
  for (const ip of new Set(srflx.map((x) => x.ip))) {
    const fam = ip.includes(":") ? 6 : 4;
    const ports = new Set(srflx.filter((x) => x.ip === ip).map((x) => x.port)).size;
    const sockets = host.filter((x) => x.fam === fam || x.fam === null).length;
    if (ports > Math.max(1, sockets)) symmetric = true;
  }
  const fams = new Set([...udp.map((x) => x.fam).filter((f) => f !== null)]);
  return { count: cands.length, host: host.length, srflx: srflx.length, relay: relay.length, publicIPs, symmetric, fams: [...fams].sort() };
}

// le statistiche di un tentativo (RTCStatsReport) in poche cifre
export function summarizeStats(report) {
  const s = { pairs: 0, succeeded: 0, requestsSent: 0, responsesReceived: 0, requestsReceived: 0 };
  if (!report) return s;
  report.forEach((r) => {
    if (r.type !== "candidate-pair") return;
    s.pairs++;
    if (r.state === "succeeded") s.succeeded++;
    s.requestsSent += r.requestsSent || 0;
    s.responsesReceived += r.responsesReceived || 0;
    s.requestsReceived += r.requestsReceived || 0;
  });
  return s;
}

// le cause, dalla piu' probabile: local e remote sono gli SDP delle due
// parti (di chi guarda e dell'altro); stun: i server STUN erano accesi;
// elapsed: ms fra il proprio codice e il tentativo (chi crea)
export function diagnose({ local, remote, stun = true, elapsed = 0, strongOnly = false }) {
  const L = profile(parseCandidates(local)), R = profile(parseCandidates(remote));
  const causes = [];
  // nessun indirizzo: il browser non ne da' (impostazioni, estensioni)
  if (L.count === 0 && local) causes.push("local_none");
  if (R.count === 0 && remote) causes.push("remote_none");
  const blocked = (p) => stun && p.count > 0 && p.relay === 0 && p.publicIPs.length === 0;
  if (blocked(L)) causes.push("local_blocked");
  if (blocked(R)) causes.push("remote_blocked");
  if (L.symmetric && R.symmetric) causes.push("both_symmetric");
  if (L.fams.length && R.fams.length && !L.fams.some((f) => R.fams.includes(f))) causes.push("family");
  if (!strongOnly) {
    if (L.symmetric && !R.symmetric) causes.push("local_symmetric");
    if (R.symmetric && !L.symmetric) causes.push("remote_symmetric");
    if (L.publicIPs.some((ip) => R.publicIPs.includes(ip))) causes.push("same_network");
    if (elapsed > SLOW_MS) causes.push("slow");
    if (!causes.length) causes.push("unknown");
  }
  return { causes, local: L, remote: R };
}

// i dettagli tecnici, da copiare (senza gli indirizzi: solo i tipi)
export function diagText(diag, { role = "", stats = null, version = "", elapsed = 0, stun = true } = {}) {
  const p = (x) => `${x.count} candidati: host ${x.host}, srflx ${x.srflx}, relay ${x.relay}; esterni ${x.publicIPs.length}; `
    + `IPv${x.fams.join("/IPv") || "?"}; NAT simmetrico ${x.symmetric ? "si'" : "no"}`;
  const lines = [`Dust Veil ${version}, ${role}, STUN ${stun ? "si'" : "no"}`,
    `questa parte: ${p(diag.local)}`, `altra parte: ${p(diag.remote)}`,
    `cause: ${diag.causes.join(", ")}`];
  if (elapsed) lines.push(`codici scambiati in ${Math.round(elapsed / 1000)} s`);
  if (stats) lines.push(`coppie ${stats.pairs} (riuscite ${stats.succeeded}), controlli mandati ${stats.requestsSent}, risposte ${stats.responsesReceived}, ricevuti ${stats.requestsReceived}`);
  if (typeof navigator !== "undefined") lines.push(navigator.userAgent);
  return lines.join("\n");
}
