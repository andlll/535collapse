// [§9.168] I suoni nuovi: il clic dell'interfaccia (audio.js ui) suona anche
// dove i suoni del mondo sono spenti (il menu principale), senza posizione;
// i suoni del mondo no. E le voci di audio.json (tools/18) ci sono.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SoundBank } from "../src/audio.js";

function bank() {
  const started = [];
  const node = () => ({ connect: (n) => n, gain: { value: 1 }, pan: { value: 0 } });
  const ctx = {
    state: "running", currentTime: 0,
    createBufferSource: () => ({ ...node(), playbackRate: { value: 1 }, start() { started.push(this); }, buffer: null }),
    createGain: node, createStereoPanner: node,
  };
  const b = new SoundBank();
  b.ctx = ctx; b.master = node();
  for (const n of ["clic", "zappa"]) b.sounds.set(n, { buffers: [{ duration: 0.1 }], gain: 0.5, last: -1, playing: 0, at: -1e9 });
  return { b, started, ctx };
}

test("§9.168 il clic dell'interfaccia anche nel menu", () => {
  const { b, started, ctx } = bank();
  b.world = false; // il menu principale
  assert.equal(b.play("zappa", 0, 0), false);
  assert.equal(b.ui("clic"), true);
  assert.equal(started.length, 1);
  ctx.currentTime = 1;
  b.enabled = false; // effetti spenti nel menu di pausa: niente
  assert.equal(b.ui("clic"), false);
});

test("§9.168 le voci dei suoni nuovi", () => {
  const cfg = JSON.parse(readFileSync(new URL("../../nuovi/audio/audio.json", import.meta.url)));
  for (const n of ["zappa", "catapulta", "crollo", "clic"]) {
    const s = cfg.suoni[n];
    assert.ok(s && s.tagli.length && s.gain > 0 && s.gain <= 0.5, n);
    for (const [a, b] of s.tagli) assert.ok(b > a && b - a <= 900, `${n} ${a}-${b}`); // colpi brevi
  }
  const credits = readFileSync(new URL("../../nuovi/audio/CREDITI.md", import.meta.url), "utf8");
  for (const f of ["passi_erba.mp3", "catapulta.mp3", "clic.mp3", "roccia.mp3", "fuoco.mp3"]) assert.ok(credits.includes(f), f);
});
