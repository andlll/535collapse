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

## Rigenerare

```bash
python3 -m pip install pillow   # unica dipendenza della pipeline
python3 tools/01_unpack.py      # zip -> gmx/
python3 tools/02_extract.py     # gmx/ -> data/ e src/
python3 tools/03_survey.py      # censimento + controllo di coerenza (--png: misura anche la memoria texture)
```

`data/` e `src/` sono generati: non si modificano a mano, si rigenerano.
Il porting vero (motore WebGL2 e logica in moduli JS) andrà in `game/`.
