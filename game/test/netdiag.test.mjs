// [§9.158] Le cause dei collegamenti non riusciti (netdiag.js), da
// descrizioni WebRTC finte: i candidati come li scrive Chromium.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCandidates, profile, diagnose, isPublic, summarizeStats, diagText, SLOW_MS } from "../src/netdiag.js";

const cand = (n, type, ip, port, proto = "udp") =>
  `a=candidate:${n} 1 ${proto} 2122260223 ${ip} ${port} typ ${type}` + (type === "host" ? "" : " raddr 0.0.0.0 rport 0") + " generation 0 network-id 1";
const sdp = (...c) => ["v=0", "o=- 1 2 IN IP4 127.0.0.1", "a=ice-ufrag:abcd", ...c, "a=end-of-candidates"].join("\r\n") + "\r\n";

// una casa normale: il nome .local e l'indirizzo esterno (uno per server
// STUN, la stessa porta)
const HOME = sdp(cand(1, "host", "3b2a-11.local", 50000), cand(2, "srflx", "93.40.1.2", 50000), cand(3, "srflx", "93.40.1.2", 50000));
// una rete mobile: lo stesso indirizzo esterno, una porta per server
const MOBILE = sdp(cand(1, "host", "77aa-22.local", 41000), cand(2, "srflx", "151.20.3.4", 61001), cand(3, "srflx", "151.20.3.4", 61377));
// una rete che blocca UDP verso fuori: solo l'indirizzo locale
const BLOCKED = sdp(cand(1, "host", "9c1d-33.local", 52000), cand(2, "host", "192.168.1.20", 9, "tcp"));
const V6ONLY = sdp(cand(1, "host", "2a01:4f8::1", 40000), cand(2, "srflx", "2a01:4f8::1", 40000));
const NONE = sdp();

test("§9.158 candidati e profili", () => {
  const c = parseCandidates(HOME);
  assert.equal(c.length, 3);
  assert.deepEqual(c[1], { type: "srflx", ip: "93.40.1.2", port: 50000, proto: "udp", fam: 4 });
  assert.equal(c[0].fam, null);
  assert.equal(profile(c).symmetric, false);
  assert.deepEqual(profile(c).publicIPs, ["93.40.1.2"]);
  assert.equal(profile(parseCandidates(MOBILE)).symmetric, true);
  // due prese (wifi e cavo) dietro lo stesso router: due porte, non simmetrico
  const two = sdp(cand(1, "host", "a.local", 1), cand(2, "host", "b.local", 2), cand(3, "srflx", "93.40.1.2", 5001), cand(4, "srflx", "93.40.1.2", 5002));
  assert.equal(profile(parseCandidates(two)).symmetric, false);
  assert.ok(isPublic("93.40.1.2") && !isPublic("192.168.1.2") && !isPublic("10.0.0.1") && !isPublic("100.70.0.1") && !isPublic("fe80::1"));
});

test("§9.158 le cause", () => {
  assert.deepEqual(diagnose({ local: HOME, remote: HOME.replace(/93\.40\.1\.2/g, "88.1.1.1") }).causes, ["unknown"]);
  assert.deepEqual(diagnose({ local: HOME, remote: MOBILE }).causes, ["remote_symmetric"]);
  assert.deepEqual(diagnose({ local: MOBILE, remote: HOME }).causes, ["local_symmetric"]);
  assert.deepEqual(diagnose({ local: MOBILE, remote: MOBILE.replace(/151\.20\.3\.4/g, "151.9.9.9") }).causes, ["both_symmetric"]);
  assert.deepEqual(diagnose({ local: BLOCKED, remote: HOME }).causes, ["local_blocked"]);
  assert.deepEqual(diagnose({ local: HOME, remote: BLOCKED }).causes, ["remote_blocked"]);
  // senza STUN (?stun=0) nessun indirizzo esterno e' normale
  assert.deepEqual(diagnose({ local: BLOCKED, remote: BLOCKED, stun: false }).causes, ["unknown"]);
  assert.deepEqual(diagnose({ local: HOME, remote: V6ONLY }).causes, ["family"]);
  assert.deepEqual(diagnose({ local: HOME, remote: HOME }).causes, ["same_network"]);
  assert.deepEqual(diagnose({ local: NONE, remote: HOME }).causes, ["local_none"]);
  assert.deepEqual(diagnose({ local: HOME, remote: HOME.replace(/93\.40\.1\.2/g, "88.1.1.1"), elapsed: SLOW_MS + 1 }).causes, ["slow"]);
  // l'avviso prima del tentativo: solo le cause sicure
  assert.deepEqual(diagnose({ local: HOME, remote: MOBILE, strongOnly: true }).causes, []);
  assert.deepEqual(diagnose({ local: BLOCKED, remote: HOME, strongOnly: true }).causes, ["local_blocked"]);
});

test("§9.158 statistiche e dettagli", () => {
  const rep = new Map([["a", { type: "candidate-pair", state: "failed", requestsSent: 7, responsesReceived: 0, requestsReceived: 2 }],
                       ["b", { type: "local-candidate" }]]);
  const st = summarizeStats(rep);
  assert.deepEqual(st, { pairs: 1, succeeded: 0, requestsSent: 7, responsesReceived: 0, requestsReceived: 2 });
  const t = diagText(diagnose({ local: HOME, remote: MOBILE }), { role: "rosso", stats: st, version: "0.2613", elapsed: 30000 });
  assert.match(t, /remote_symmetric/);
  assert.match(t, /controlli mandati 7/);
  assert.ok(!t.includes("93.40.1.2"), "niente indirizzi nei dettagli");
});
