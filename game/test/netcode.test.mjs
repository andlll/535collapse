// [§9.202] I codici corti della partita online (netcode.js), senza browser:
// descrizioni WebRTC come le scrivono Chromium (questa macchina, e un
// computer con STUN, due reti, TCP e IPv6), Firefox e Safari; la partita
// (mappe del gioco e dell'editor, opzioni, seme); gli errori.
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeCode, decodeCode, CodeError, sdpModel, sdpFromModel, b64url, unb64url, SHORT_FORMAT } from "../src/netcode.js";
import { diagnose } from "../src/netdiag.js";
import { SK_DEFAULTS, SK_OPTIONS, SK_ROOMS, skValues, cleanSkirmish } from "../src/skirmish.js";
import { TEST_ROOM } from "../src/mapfile.js";

const crlf = (...l) => l.join("\r\n") + "\r\n";
const FP = "FE:AD:30:DC:17:4D:F4:FE:EF:72:A1:30:7E:6B:42:0E:3C:79:7C:7D:3D:0B:81:7D:32:75:8C:93:4A:77:14:F0";
// Chromium headless, senza STUN (rtc.mjs in questa macchina)
const CHROME_LOCAL = crlf("v=0", "o=- 7212481424589409067 2 IN IP4 127.0.0.1", "s=-", "t=0 0", "a=group:BUNDLE 0", "a=extmap-allow-mixed",
  "a=msid-semantic: WMS", "m=application 9 UDP/DTLS/SCTP webrtc-datachannel", "c=IN IP4 0.0.0.0",
  "a=candidate:1254911504 1 udp 2113937151 ae31b7c3-c445-47a3-a1c3-40d5ede1effa.local 52181 typ host generation 0 network-cost 999",
  "a=ice-ufrag:WqBo", "a=ice-pwd:W7bjPU3LxKA+lI7nLl3mq692", "a=ice-options:trickle", "a=fingerprint:sha-256 " + FP,
  "a=setup:actpass", "a=mid:0", "a=sctp-port:5000", "a=max-message-size:262144");
// Chrome su un computer con due reti (wifi e cavo), STUN, TCP e IPv6; due
// server STUN, la stessa porta (una casa)
const chromeHome = (srflx) => crlf("v=0", "o=- 4215775240449105457 2 IN IP4 127.0.0.1", "s=-", "t=0 0", "a=group:BUNDLE 0", "a=extmap-allow-mixed",
  "a=msid-semantic: WMS", "m=application 51234 UDP/DTLS/SCTP webrtc-datachannel", "c=IN IP4 93.40.1.2",
  "a=candidate:2999745851 1 udp 2122260223 4f0b2a8e-1c3d-4e5f-8a9b-0c1d2e3f4a5b.local 51234 typ host generation 0 network-id 1 network-cost 10",
  "a=candidate:1311219539 1 udp 2122194687 9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d.local 51235 typ host generation 0 network-id 2 network-cost 10",
  "a=candidate:4233069003 1 tcp 1518280447 4f0b2a8e-1c3d-4e5f-8a9b-0c1d2e3f4a5b.local 9 typ host tcptype active generation 0 network-id 1 network-cost 10",
  "a=candidate:2165426027 1 tcp 1518214911 9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d.local 9 typ host tcptype active generation 0 network-id 2 network-cost 10",
  ...srflx,
  "a=ice-ufrag:Hk3J", "a=ice-pwd:aB3dE5fG7hI9jK1lM3nO5pQ7", "a=ice-options:trickle", "a=fingerprint:sha-256 " + FP.split(":").reverse().join(":"),
  "a=setup:actpass", "a=mid:0", "a=sctp-port:5000", "a=max-message-size:262144");
const CHROME_HOME = chromeHome([
  "a=candidate:842163049 1 udp 1686052607 93.40.1.2 51234 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 10",
  "a=candidate:842163049 1 udp 1686052607 93.40.1.2 51234 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 10",
  "a=candidate:3427521089 1 udp 1685987071 2001:db8:85a3:4:8a2e:370:7334:1 51235 typ srflx raddr :: rport 0 generation 0 network-id 2 network-cost 10"]);
// lo stesso su una rete mobile: NAT simmetrico, una porta per server STUN
const CHROME_MOBILE = chromeHome([
  "a=candidate:842163049 1 udp 1686052607 151.20.3.4 61001 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 900",
  "a=candidate:842163050 1 udp 1686052607 151.20.3.4 61377 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 900"]);
// Firefox: impronta e opzioni nella sessione, UDP e TCP in maiuscolo,
// end-of-candidates, ufrag e password esadecimali, i messaggi lunghi
const FIREFOX = crlf("v=0", "o=mozilla...THIS_IS_SDPARTA-99.0 6203154829349412339 0 IN IP4 0.0.0.0", "s=-", "t=0 0", "a=sendrecv",
  "a=fingerprint:sha-256 3d:6a:" + FP.slice(6).toLowerCase(), "a=group:BUNDLE 0", "a=ice-options:trickle", "a=msid-semantic:WMS *",
  "m=application 61234 UDP/DTLS/SCTP webrtc-datachannel", "c=IN IP4 203.0.113.4",
  "a=candidate:0 1 UDP 2122252543 fd2a0e1a-7c4d-4b0e-9b9e-2f1c3a5d6e7f.local 61234 typ host",
  "a=candidate:2 1 TCP 2105524479 fd2a0e1a-7c4d-4b0e-9b9e-2f1c3a5d6e7f.local 9 typ host tcptype active",
  "a=candidate:3 1 TCP 2105458943 fd2a0e1a-7c4d-4b0e-9b9e-2f1c3a5d6e7f.local 47011 typ host tcptype passive",
  "a=candidate:1 1 UDP 1686052863 203.0.113.4 61234 typ srflx raddr 0.0.0.0 rport 0",
  "a=sendrecv", "a=end-of-candidates", "a=ice-pwd:6c9ba0d7f4e1c2b3a4958677e8f9a0b1", "a=ice-ufrag:3f7a1c32", "a=mid:0",
  "a=setup:actpass", "a=sctp-port:5000", "a=max-message-size:1073741823");
// Safari (risposta): come Chrome, ruolo "active"; un indirizzo IPv6 senza mDNS
const SAFARI = crlf("v=0", "o=- 2946347620939587048 2 IN IP4 127.0.0.1", "s=-", "t=0 0", "a=group:BUNDLE 0", "a=extmap-allow-mixed",
  "a=msid-semantic: WMS", "m=application 9 UDP/DTLS/SCTP webrtc-datachannel", "c=IN IP4 0.0.0.0",
  "a=candidate:3015296455 1 udp 2122262783 2a01:4f8:c17:abcd::1 63001 typ host generation 0 network-cost 999",
  "a=candidate:1720143143 1 udp 2122194687 192.168.1.33 63002 typ host generation 0 network-cost 999",
  "a=candidate:2384823571 1 udp 1686052607 88.1.2.3 63002 typ srflx raddr 192.168.1.33 rport 63002 generation 0 network-cost 999",
  "a=ice-ufrag:x9Zq", "a=ice-pwd:Q1w2E3r4T5y6U7i8O9p0A1s2", "a=ice-options:trickle", "a=fingerprint:sha-256 " + FP,
  "a=setup:active", "a=mid:0", "a=sctp-port:5000", "a=max-message-size:262144");

const SK = cleanSkirmish({ map: "sk_bardonis", victory: "score40", resources: "high", pop: 99, truce: 10, fog: "explored", daynight: "night", rain: "frequent", start: "B" });
const offerOf = (sdp, extra = {}) => ({ v: "0.2616", sdp, setup: { map: SK.map, sk: SK, seed: 3141592653 }, ...extra });

test("§9.202 il modello dell'SDP: cosa resta e cosa no", () => {
  const M = sdpModel(CHROME_HOME);
  assert.equal(M.ufrag, "Hk3J");
  assert.equal(M.setup, "actpass");
  assert.equal(M.cands.length, 7);
  assert.deepEqual(M.cands[2], { type: "host", proto: "tcp", tcptype: "active", addr: "4f0b2a8e-1c3d-4e5f-8a9b-0c1d2e3f4a5b.local", port: 9, prio: 1518280447 });
  assert.deepEqual(M.cands[6], { type: "srflx", proto: "udp", tcptype: null, addr: "2001:db8:85a3:4:8a2e:370:7334:1", port: 51235, prio: 1685987071 });
  const F = sdpModel(FIREFOX);
  assert.equal(F.fp.slice(0, 5), "3D:6A"); // (in maiuscolo: e' la stessa impronta)
  assert.ok(F.eoc && F.trickle && F.bundle && F.mms === 1073741823);
  assert.equal(F.cands[0].proto, "udp");
  // l'SDP ricostruito ha lo stesso modello (anche riletto due volte)
  for (const s of [CHROME_LOCAL, CHROME_HOME, CHROME_MOBILE, FIREFOX, SAFARI]) {
    const back = sdpFromModel(sdpModel(s));
    assert.deepEqual(sdpModel(back), sdpModel(s));
    assert.equal(sdpFromModel(sdpModel(back)), back);
    // i candidati non host hanno raddr e rport (Firefox li vuole)
    for (const l of back.split("\r\n").filter((x) => x.startsWith("a=candidate:") && !/typ host/.test(x))) assert.match(l, / raddr \S+ rport 0/);
  }
  // cio' che il modello non conosce: niente codice corto
  assert.equal(sdpModel(CHROME_LOCAL.replace("a=mid:0", "a=mid:data")), null);
  assert.equal(sdpModel(CHROME_LOCAL + "a=ice-lite\r\n"), null);
  assert.equal(sdpModel(CHROME_LOCAL + "m=audio 9 UDP/TLS/RTP/SAVPF 111\r\n"), null);
  assert.equal(sdpModel(CHROME_LOCAL.replace("sha-256", "sha-1")), null);
  assert.equal(sdpModel(CHROME_LOCAL.replace("a=setup:actpass", "a=setup:holdconn")), null);
  assert.equal(sdpModel(CHROME_LOCAL.replace("generation 0", "generation 1")), null);
  assert.equal(sdpModel(CHROME_LOCAL.replace("network-cost 999", "foo 1")), null);
  assert.equal(sdpModel(CHROME_LOCAL.replace("network-cost 999", "ufrag zzzz")), null); // un altro ufrag
  assert.ok(sdpModel(CHROME_LOCAL.replace("network-cost 999", "ufrag WqBo")));
  assert.equal(sdpModel(CHROME_LOCAL.replace(/a=ice-pwd:.*\r\n/, "")), null);
  assert.equal(sdpModel(CHROME_LOCAL.replace(" 1 udp ", " 2 udp ")), null); // un componente RTCP
});

test("§9.202 i codici corti: andata e ritorno, misure", async (t) => {
  const lens = {};
  for (const [name, sdp] of Object.entries({ CHROME_LOCAL, CHROME_HOME, CHROME_MOBILE, FIREFOX, SAFARI })) {
    const code = await encodeCode("offer", offerOf(sdp));
    assert.match(code, /^DVOc[A-Za-z0-9_-]+$/, name);
    const { kind, data } = await decodeCode(code);
    assert.equal(kind, "offer");
    assert.equal(data.v, "0.2616");
    assert.deepEqual(sdpModel(data.sdp), sdpModel(sdp), name);
    assert.deepEqual(data.setup, offerOf(sdp).setup);
    const ans = await encodeCode("answer", { v: "0.2616", sdp, o: "WqBo" });
    assert.match(ans, /^DVAc/);
    const a = await decodeCode(ans);
    assert.equal(a.kind, "answer");
    assert.equal(a.data.o, "WqBo");
    assert.equal(a.data.setup, undefined);
    assert.deepEqual(sdpModel(a.data.sdp), sdpModel(sdp));
    const custom = await encodeCode("offer", { v: "0.2616", sdp, setup: { map: TEST_ROOM, sk: { ...SK, map: TEST_ROOM }, seed: 1, custom: { name: "La mia isola", hash: "0123456789abcdef" } } });
    lens[name] = [code.length, ans.length, custom.length];
  }
  t.diagnostic("[offerta, risposta, offerta su una mappa dell'editor] " + JSON.stringify(lens));
  // le misure (prima: ~780 l'offerta, ~600 la risposta)
  assert.ok(lens.CHROME_LOCAL[0] <= 140 && lens.CHROME_LOCAL[1] <= 130, JSON.stringify(lens));
  for (const [o, a, c] of Object.values(lens)) assert.ok(o <= 250 && a <= 240 && c <= 280, JSON.stringify(lens));
  // le cause dei problemi di connessione (§9.158) lette dai codici: le stesse
  for (const [L, R] of [[CHROME_HOME, CHROME_MOBILE], [CHROME_MOBILE, CHROME_MOBILE.replace(/151\.20\.3\.4/g, "151.9.9.9")], [SAFARI, CHROME_HOME], [FIREFOX, SAFARI]]) {
    const R2 = (await decodeCode(await encodeCode("answer", { v: "x", sdp: R, o: "" }))).data.sdp;
    const a = diagnose({ local: L, remote: R }), b = diagnose({ local: L, remote: R2 });
    assert.deepEqual(b.causes, a.causes);
    assert.deepEqual(b.remote, a.remote);
  }
});

test("§9.202 la partita nel codice corto: mappe, opzioni, seme, mappa dell'editor", async () => {
  // ogni mappa, ogni valore di ogni opzione
  for (const map of SK_ROOMS) {
    for (const k of Object.keys(SK_DEFAULTS).filter((x) => x !== "map")) {
      for (const val of skValues(k)) {
        const sk = { ...SK_DEFAULTS, map, [k]: val };
        const setup = { map, sk, seed: 0 };
        const code = await encodeCode("offer", { v: "0.2616", sdp: CHROME_LOCAL, setup });
        assert.match(code, /^DVOc/);
        assert.deepEqual((await decodeCode(code)).data.setup, setup);
      }
    }
  }
  assert.ok(SK_OPTIONS.style.values.length <= 15);
  // il seme piu' grande, le opzioni assenti
  for (const setup of [{ map: "sk_padus", seed: 0xffffffff }, { map: "sk_urbs", sk: { pop: 50 }, seed: 7 }]) {
    const code = await encodeCode("offer", { v: "0.2616", sdp: CHROME_LOCAL, setup });
    assert.match(code, /^DVOc/);
    assert.deepEqual((await decodeCode(code)).data.setup, setup);
  }
  // la mappa dell'editor (§9.192): nome (anche con lettere accentate e
  // simboli, fino a 40) e impronta
  for (const name of ["", "Isola", "Le terre d'Àrborea — 2ª edizione ✦ 🏰", "x".repeat(40)]) {
    const setup = { map: TEST_ROOM, sk: { ...SK, map: TEST_ROOM }, seed: 99, custom: { name, hash: "0123456789abcdef" } };
    const code = await encodeCode("offer", { v: "0.2616", sdp: CHROME_HOME, setup });
    assert.match(code, /^DVOc/);
    assert.deepEqual((await decodeCode(code)).data.setup, setup);
    if (name.length === 40) assert.ok(code.length <= 320, String(code.length)); // (il nome piu' lungo, sull'SDP piu' lungo)
  }
  // cio' che il codice corto non sa dire: il codice lungo di prima, uguale
  for (const obj of [
    offerOf(CHROME_LOCAL, { altro: 1 }), // un campo in piu'
    { ...offerOf(CHROME_LOCAL), setup: { map: "sk_padus", seed: 1, chi: "x" } },
    { ...offerOf(CHROME_LOCAL), setup: { map: "sk_padus", sk: { ...SK, pop: 1000 }, seed: 1 } }, // un valore fuori dall'elenco
    { ...offerOf(CHROME_LOCAL), setup: { map: "lvl01", seed: 1 } },
    { ...offerOf(CHROME_LOCAL), setup: { map: "sk_padus", seed: -1 } },
    { ...offerOf(CHROME_LOCAL), setup: { map: TEST_ROOM, seed: 1, custom: { name: "a", hash: "XYZ" } } },
    offerOf(CHROME_LOCAL + "a=rtcp-mux\r\n"), // una riga che il modello non conosce
  ]) {
    const code = await encodeCode("offer", obj);
    assert.match(code, /^DVOz/);
    const { data } = await decodeCode(code);
    assert.deepEqual({ ...data, c: undefined }, { ...obj, c: undefined });
  }
});

test("§9.202 i codici corti incollati: testo attorno, tagliati, rovinati, di un'altra versione", async () => {
  const code = await encodeCode("offer", offerOf(CHROME_HOME));
  const want = (await decodeCode(code)).data;
  // con a capo, spazi, virgolette, e del testo prima e dopo
  for (const pasted of ['"' + code.slice(0, 50) + "\n  " + code.slice(50) + ' "', "Ecco il codice:\n" + code + "\nciao, a dopo!", "> " + code + "."]) {
    assert.deepEqual((await decodeCode(pasted)).data, want);
  }
  // tagliato: non valido, ma si sa che era un'offerta
  for (const n of [5, 30, 80, code.length - 2]) {
    await assert.rejects(decodeCode(code.slice(0, n)), (e) => e instanceof CodeError && e.reason === "invalid" && (n < 20 || e.kind === "offer"), String(n));
  }
  // un carattere cambiato: non valido (o, se cade nei bit di riempimento
  // dell'ultimo carattere, lo stesso codice)
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let bad = 0;
  for (let i = 4; i < code.length; i++) {
    const ch = A[(A.indexOf(code[i]) + 17) % 64];
    const mut = code.slice(0, i) + ch + code.slice(i + 1);
    try {
      const d = await decodeCode(mut);
      assert.deepEqual(d.data, want, "cambiato al carattere " + i);
    } catch (e) {
      assert.ok(e instanceof CodeError && (e.reason === "invalid" || e.reason === "proto"), String(e));
      bad++;
    }
  }
  assert.ok(bad >= code.length - 6);
  // un'altra forma del codice corto (una versione futura): "proto", con la versione
  const bytes = unb64url(code.slice(4));
  bytes[0] = SHORT_FORMAT + 1;
  await assert.rejects(decodeCode("DVOc" + b64url(bytes)), (e) => e.reason === "proto" && e.version === "0.2616");
  // una forma sconosciuta
  await assert.rejects(decodeCode("DVOq" + code.slice(4)), (e) => e.reason === "proto" && e.kind === "offer");
  // il codice di prima (JSON compresso) si legge ancora: ne dice la versione
  const old = await encodeCode("offer", { ...offerOf(CHROME_LOCAL + "a=rtcp-mux\r\n"), v: "0.2615" });
  assert.equal((await decodeCode(old)).data.v, "0.2615");
});

test("§9.202 i codici corti: il ruolo DTLS, i messaggi, gli indirizzi", async () => {
  const one = (cands, more = {}) => sdpFromModel({ ufrag: "abcd", pwd: "0123456789abcdefghijkl", fp: FP, setup: "passive", bundle: false, trickle: false,
    eoc: false, mms: null, cands, ...more });
  const c = (addr, more = {}) => ({ type: "host", proto: "udp", tcptype: null, addr, port: 1, prio: 1, ...more });
  const cases = [
    one([c("10.0.0.1"), c("255.255.255.255", { port: 65535, prio: 0xffffffff }), c("0.0.0.0", { port: 0, prio: 0 })]),
    one([c("::1"), c("fe80::"), c("2001:db8::1:0:0:1"), c("1:2:3:4:5:6:7:8"), c("::"), c("1::"), c("::ffff:1.2.3.4")]),
    one([c("010.0.0.1"), c("2001:DB8::1"), c("2001:db8:0:0:1:0:0:1"), c("AE31B7C3-C445-47A3-A1C3-40D5EDE1EFFA.local"), c("host.example.org")]),
    one([c("1.2.3.4", { type: "relay" }), c("1.2.3.4", { type: "prflx", proto: "tcp", tcptype: "so" }), c("1.2.3.4", { proto: "tcp", tcptype: "passive" })]),
    one([c("1.2.3.4")], { mms: 65536, eoc: true, trickle: true, bundle: true, setup: "actpass" }),
    one([], { mms: 1 }),
  ];
  for (const sdp of cases) {
    const code = await encodeCode("answer", { v: "x", sdp, o: "" });
    assert.match(code, /^DVAc/, sdp);
    const back = (await decodeCode(code)).data;
    assert.deepEqual(sdpModel(back.sdp), sdpModel(sdp));
    assert.equal(back.o, "");
  }
});
