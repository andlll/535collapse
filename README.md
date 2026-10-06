# 535 — porting HTML5

Porting nel browser di **535**, RTS isometrico dell'autore fatto con
GameMaker: Studio 1.x. Prima uscita prevista: **"535 – Collapse"**, solo
desktop, orizzontale, per itch.io, Newgrounds, Game Jolt e poi CrazyGames.

Metodo e convenzioni da [andlll/n_redux](https://github.com/andlll/n_redux)
(porting di NIMBUS). Il diario delle decisioni e delle verifiche è
[STUDIO.md](STUDIO.md).

## Struttura

| Percorso | Versionato | Contenuto |
|---|---|---|
| `*.zip`, `AOE_TYPE(1).project.gmx` | sì | il progetto GameMaker originale, come caricato dall'autore: **la fonte immutabile** |
| `gmx/` | no | il progetto ricomposto nella struttura standard GMS 1.x (`tools/01_unpack.py`) |
| `data/` | sì | metadati estratti in JSON: progetto, sprite, oggetti, sfondi, font, path, `rooms/<room>.json`, `functions.json` |
| `src/objects/<oggetto>/<Evento>.gml` | sì | il codice di ogni evento, leggibile, con le azioni drag & drop rese come GML |
| `src/scripts/` | sì | gli script GML |
| `tools/` | sì | la pipeline (Python 3 + Pillow) |
| `game/` | sì | il motore: `index.html`, `src/` (moduli JS), `package.json` (esbuild), PWA (`manifest.webmanifest`, `sw.js`, `icons/` da `tools/09_icons.py`) |
| `game/assets/`, `game/dist/` | no | atlas, maschere, scene (tools 05–07) e bundle JS: si rigenerano |

## Rigenerare

```bash
python3 -m pip install pillow   # unica dipendenza della pipeline
python3 tools/01_unpack.py      # zip -> gmx/
python3 tools/02_extract.py     # gmx/ -> data/ e src/
python3 tools/03_survey.py      # censimento + controllo di coerenza (--png: misura anche la memoria texture)
```

`data/` e `src/` sono generati: non si modificano a mano, si rigenerano.

## Far girare il gioco

```bash
python3 tools/05_atlas.py       # atlas WebP per gruppo -> game/assets/ (~2 minuti)
python3 tools/06_masks.py       # maschere di collisione -> game/assets/masks.json
python3 tools/07_scene.py       # room -> game/assets/rooms/
cd game && npm install && npm run build   # bundle -> game/dist/
python3 -m http.server 8000 --directory game
```

Poi `http://127.0.0.1:8000/` (menu) o `?room=match`, `?room=lvl01`,
`?room=lvl02` per entrare direttamente in una room. Sono giocabili il menu
principale con la campagna (mappa, livelli 1 e 2, lucchetto a cinque
cifre), economia, costruzione e combattimento, con nebbia di guerra,
notte, pioggia e fuoco, suggerimenti del tutorial, dialoghi, obiettivi,
vittoria e sconfitta (la lista aggiornata è in cima a `STUDIO.md`). Puntatore ai bordi o frecce per muoversi (anche
col puntatore uscito dalla finestra; nelle opzioni grafiche si può
bloccare il mouse nella finestra), X/Z o la rotella per lo zoom,
**F3** per il pannello di diagnostica (anche `?diag=1`); `?fps=30` per il
tetto a 30 fps. Esc (o il pulsante in alto a destra) apre il menu di
pausa: opzioni grafiche, schermo intero, lingua (EN, IT, ES, PT, DE, FR),
salvataggi (uno slot per room nel browser, salvataggio automatico ogni 5
minuti, file `.json` da scaricare e riaprire; "Load game" anche nel menu
principale). Il gioco si può installare come app (PWA) e, dopo una prima
partita online, aprire senza rete.

## Provare

```bash
cd game && npm test                                  # test unitari (node --test)
python3 -m http.server 8123 --directory game         # in un altro terminale
node game/test/browser/soak.mjs http://localhost:8123 3000   # Chromium: 3000 passi per room
node game/test/browser/saves.mjs http://localhost:8123 4000  # salva, ricarica, stato identico
python3 tools/10_zip.py                              # zip per i portali -> build/
node game/test/browser/portal.mjs build/535-collapse-web.zip   # lo zip in un iframe, in una sottocartella
```

La CI (`.github/workflows/build.yml`) fa tutto questo a ogni push, dagli
zip del progetto: pipeline, test, bundle, zip e le tre prove nel browser.
Lo zip resta come artefatto della run; da `main` il gioco si pubblica su
GitHub Pages: https://andlll.github.io/535collapse/ (serve una volta
Settings → Pages → Source: "GitHub Actions").

`soak.mjs` usa Playwright; se il modulo non è nel progetto, la variabile
`PLAYWRIGHT_MODULE` dice dove trovarlo. Nella pagina, `window.__game`
espone mondo, griglia, globali e `advance(n)` per far avanzare la
simulazione senza disegnare; con `?nostart=1` il mondo resta fermo finché
non lo si avanza.
