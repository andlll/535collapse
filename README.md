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
| `game/` | sì | il motore: `index.html`, `src/` (moduli JS), `package.json` (esbuild) |
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
`?room=lvl02`. Il menu e la campagna non sono ancora portati: si entra
nelle room direttamente. Sono giocabili economia, costruzione e
combattimento, con nebbia di guerra, notte, pioggia e fuoco; mancano
dialoghi e suggerimenti, vittoria e sconfitta (la lista aggiornata è in
cima a `STUDIO.md`). Puntatore ai bordi o frecce per muoversi, X/Z per lo zoom,
**F3** per il pannello di diagnostica (anche `?diag=1`); `?fps=30` per il
tetto a 30 fps.

## Provare

```bash
cd game && npm test                                  # test unitari (node --test)
python3 -m http.server 8123 --directory game         # in un altro terminale
node game/test/browser/soak.mjs http://localhost:8123 3000   # Chromium: 3000 passi per room
```

`soak.mjs` usa Playwright; se il modulo non è nel progetto, la variabile
`PLAYWRIGHT_MODULE` dice dove trovarlo. Nella pagina, `window.__game`
espone mondo, griglia, globali e `advance(n)` per far avanzare la
simulazione senza disegnare.
