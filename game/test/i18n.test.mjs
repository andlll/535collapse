// Traduzioni (i18n.js, texts.js): ogni testo in tutte le lingue, segnaposto
// conservati, ricaduta sull'inglese.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TEXTS } from "../src/texts.js";
import { LANGUAGES, setLanguage, tr, t } from "../src/i18n.js";
import { HINTS, DIALOGS } from "../src/hints.js";

test("ogni testo ha tutte le lingue e gli stessi segnaposto", () => {
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [en, e] of Object.entries(TEXTS)) {
    for (const l of LANGUAGES.filter((x) => x !== "en")) {
      assert.ok(e[l], `${l}: ${en}`);
      assert.equal(ph(e[l]), ph(en), `${l}: ${en}`);
    }
  }
});

test("dialoghi tradotti (testo e titolo)", () => {
  for (const [n, D] of Object.entries(DIALOGS)) {
    assert.ok(TEXTS[D.text], n);
    assert.ok(TEXTS[D.who[2]], `${n}: ${D.who[2]}`);
  }
  assert.ok(Object.keys(HINTS).length === 29) // §9.108: hint_allarme; // 26 dell'originale + hint_lavoratori (§9.14) + hint_lavori (§9.26)
});

test("tr: lingua scelta, segnaposto, ricaduta sull'inglese", () => {
  setLanguage("it");
  assert.equal(tr("Resume"), "Riprendi");
  assert.equal(tr("Shortcut: {key}", { key: "Q" }), "Tasto: Q");
  assert.equal(tr("testo che non c'e'"), "testo che non c'e'");
  assert.equal(t("loading"), "Caricamento…");
  setLanguage("xx");
  setLanguage("en");
  assert.equal(tr("Shortcut: {key}", { key: "Q" }), "Shortcut: Q");
});

test("menu principale tradotto (livelli e storie)", async () => {
  const { LEVELS, STORY } = await import("../src/menu.js");
  for (const s of [...LEVELS, ...Object.values(STORY), "Campaign - Collapse", "Play the tutorial", "Coming soon", "Unlock level"]) {
    assert.ok(TEXTS[s], s);
  }
});

// [§9.156] i testi della partita a due in rete (netgame.js, il menu di
// pausa in rete): ogni tr("...") del codice ha la sua traduzione
test("§9.156 partita a due: testi tradotti", async () => {
  const { readFileSync } = await import("node:fs");
  const src = ["netgame.js", "pause.js"].map((f) => readFileSync(new URL("../src/" + f, import.meta.url), "utf8")).join("\n");
  const keys = [...src.matchAll(/\btr\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse('"' + m[1] + '"'));
  assert.ok(keys.length > 30);
  for (const k of keys) assert.ok(TEXTS[k], k);
  assert.ok(TEXTS["Online multiplayer"]);
});
