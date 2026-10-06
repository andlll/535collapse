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
  assert.ok(Object.keys(HINTS).length === 26);
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
