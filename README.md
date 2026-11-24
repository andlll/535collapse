# 535 — porting HTML5

Porting nel browser di **535**, RTS isometrico dell'autore fatto con
GameMaker: Studio 1.x. Prima uscita prevista: **"Dust Veil: Collapse"** (§9.72), solo
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
| `build/535-tiled-kit/` | no | il kit per disegnare le mappe in Tiled (tools 11), e il suo zip |
| `mappe/` | sì | le mappe dei livelli nuovi disegnate in Tiled (`lvl03.tmx`, ...) |
| `scenari/` | sì | le stesse mappe convertite per il gioco (tools 12); la CI controlla che corrispondano |
| `nuovi/` | sì | sprite e oggetti nuovi dell'autore (il monastero): `nuovi.json`, `sprites/` |

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
python3 tools/18_audio.py       # effetti sonori -> game/assets/audio/ (serve ffmpeg)
cd game && npm install && npm run build   # bundle -> game/dist/
python3 -m http.server 8000 --directory game
```

I font dell'interfaccia sono Cinzel e Cinzel Decorative (OFL, `nuovi/font/`,
§9.47), rasterizzati da `05_atlas.py`. Il logo del menu "Dust Veil: Collapse"
(`nuovi/sprites/logo_dustveil.png`, §9.72) si rifa' con `python3 tools/13_logo.py`
solo se cambiano testo, font o misura. Le origini degli sprite del
lavoratore nemico (`nuovi/sprites/omino_blu/`, §9.49) e scala e posizione
degli sprite danneggiati dell'autore (§9.85) si ricalcolano con
`python3 tools/14_allinea.py` (richiede numpy) se cambiano le immagini. Le texture dei
fiumi, delle strade e dei ponti disegnati come linee in Tiled (`nuovi/fiumi/`, §9.97:
acqua, sassolini, grana di carta) si rifanno con `python3 tools/15_fiumi.py` (dopo
`tools/01`) solo se cambiano i dipinti da cui vengono. Le mappe della schermaglia
(`mappe/sk_*.tmx`, simmetriche, §9.118) le scrive `python3 tools/16_schermaglia.py`
(poi `tools/12` come per gli altri livelli; `--check` ne controlla la simmetria). La foto di ogni mappa nella schermata della
schermaglia (`nuovi/sprites/sk_*_cartolina.png`, §9.121) la fa `node tools/17_cartoline.mjs` col gioco
in esecuzione (e poi `tools/05`). Le foto delle macchie a particelle nella scheda "Natura" dell'editor
(`nuovi/sprites/ed_natura_*.png`, §9.203) le fa `node tools/19_natura.mjs` allo stesso modo (poi `tools/05`). Gli effetti sonori (`nuovi/audio/`: i file d'origine, i tagli
delle varianti in `audio.json`, fonti e licenze in `CREDITI.md`, §9.137) li fa
`python3 tools/18_audio.py` (serve ffmpeg) -> `game/assets/audio/`.

Poi `http://127.0.0.1:8000/` (menu) o `?room=match`, `?room=lvl01`,
`?room=lvl02`, `?room=lvl03`, `?room=lvl04` (il fiume e il ponte, §9.40), `?room=lvl06` (la mappa del livello 6, §9.100), `?room=lvl07` (l'arciere nella nebbia, §9.178), `?room=sk_padus` (la schermaglia su Padus, coi parametri scelti nel menu, §9.118) per entrare direttamente in una room; `?room=editor` apre l'editor di mappe (§9.180-§9.184: mappe da schermaglia; modelli, "Inserisci", "Sposta", annulla e ripeti, salva e apri nel browser o su file `.dvmap`, impostazioni con la copertina, simmetria degli strumenti, pennello ovale per boschi e texture, polilinea per fiumi e strade, file collegati, "Prova mappa" nella room `custom`). Sono giocabili il menu
principale con la campagna (mappa, livelli 1 e 2, lucchetto a cinque
cifre), economia, costruzione e combattimento, con nebbia di guerra,
notte, pioggia e fuoco, suggerimenti del tutorial, dialoghi, obiettivi,
vittoria e sconfitta (la lista aggiornata è in cima a `STUDIO.md`). Puntatore ai bordi o frecce per muoversi (anche
col puntatore uscito dalla finestra; nelle opzioni grafiche si può
bloccare il mouse nella finestra), X/Z o la rotella per lo zoom (morbido, §9.83), J per
andare all'ultimo allarme d'attacco della minimappa (§9.108),
**F3** per il pannello di diagnostica (anche `?diag=1`: tempo CPU e, se
il browser lo espone, tempo GPU per frame); `?fps=30` per il
tetto a 30 fps. Nelle opzioni grafiche "Quality" (Alta, Media, Bassa)
disegna il mondo a risoluzione ridotta sugli schermi ad alta densita',
lasciando nitida l'interfaccia (e, in Media e Bassa, l'erba piu' rada);
"Glass interface" rende i pannelli di vetro sfocato. Esc (o il pulsante in alto a destra) apre il menu di
pausa: opzioni grafiche, schermo intero, lingua (EN, IT, ES, PT, DE, FR),
salvataggi (uno slot per room nel browser, in IndexedDB, salvataggio automatico ogni 5
minuti, file `.dvgame` da scaricare e riaprire, compresso, §9.134; "Load game" anche nel menu
principale). Il gioco si può installare come app (PWA) e, dopo una prima
partita online, aprire senza rete.

Il menu principale (§9.157): "Gioca il tutorial", "Giocatore singolo"
(campagna, schermaglia ed editor di mappe, §9.180), "Multigiocatore", "Carica partita".

**Multigiocatore online** (§9.152-§9.158): "Multigiocatore", "Crea partita":
mappa e opzioni come nella schermaglia (difficolta' e stile della CPU in
grigio), poi "Crea partita" in basso a destra. Chi crea la partita (il
rosso) manda all'altro il codice che compare (~130-250 caratteri, §9.202); l'altro va in
"Multigiocatore", "Partecipa", lo incolla ("Entra", il blu) e rimanda il suo
codice di risposta, che il primo incolla ("Collega"). Se il collegamento
non riesce la sala d'attesa dice la causa che si legge nei codici (rete che
blocca UDP, NAT simmetrico, IPv4/IPv6, stessa rete, codici scambiati troppo
tardi) e apre la guida "Problemi di connessione" (§9.158). La connessione è diretta fra i
due browser (WebRTC, con un server STUN pubblico per attraversare i router;
senza un server TURN alcune reti non si collegano); i due giochi si
scambiano solo i comandi (lockstep) e confrontano ogni 5 secondi
un'impronta della partita. In partita Invio apre la chat con l'altro
giocatore.

## Mappe in Tiled

I livelli nuovi si disegnano in [Tiled](https://www.mapeditor.org) con gli
sprite del gioco (STUDIO.md §9). Il kit (tileset per categoria, mappa
vuota, le room `match`, `lvl01` e `lvl02` gia' convertite, istruzioni in
`LEGGIMI.md`) si genera dagli zip, dopo `tools/01`, `02` e `07`, o si
scarica dalla CI (artefatto `535-tiled-kit` di ogni run):

```bash
python3 tools/11_tiled_kit.py                    # -> build/535-tiled-kit/ e build/535-tiled-kit.zip
python3 tools/11_tiled_kit.py --nuova lvl03 4000x6000   # in piu' una mappa vuota di quella misura
python3 tools/12_tiled_import.py mappa.tmx --anteprima  # -> scenari/mappa.json, build/anteprime/mappa.png
python3 tools/12_tiled_import.py --check         # collaudo: room -> Tiled -> stesse istanze
```

## Provare

```bash
cd game && npm test                                  # test unitari (node --test)
python3 -m http.server 8123 --directory game         # in un altro terminale
node game/test/browser/soak.mjs http://localhost:8123 3000   # Chromium: 3000 passi per room
node game/test/browser/saves.mjs http://localhost:8123 4000  # salva, ricarica, stato identico
node game/test/browser/melee.mjs match                  # mischia: il colpo cominciato arriva fino in fondo
node game/test/browser/monastery.mjs                    # livello 3: riparare e incendiare il monastero, arieti e mura
node game/test/browser/rally.mjs                        # unita' appena prodotte verso la bandiera di raccolta
node game/test/browser/fireorder.mjs                    # gruppo misto che incendia un edificio (alleati e nemici)
node game/test/browser/rams.mjs                         # piu' arieti contro lo stesso edificio, senza sovrapporsi
node game/test/browser/catapults.mjs                    # catapulte che tirano o si fermano senza stare una sopra l'altra
node game/test/browser/enemygarrison.mjs                # presidio nemico in torri e fortezze; nemici nella nebbia
node game/test/browser/hintgap.mjs                      # suggerimenti del tutorial a 20 px dalle finestre dell'interfaccia
node game/test/browser/hover.mjs                        # pulsanti col puntatore evidenziati anche sotto i pannelli di vetro
node game/test/browser/editor.mjs                       # editor di mappe: vista, modelli, Inserisci, Sposta, stili, simmetria, salva e apri (file collegati), pennello, copertina, polilinea, Prova mappa, schieramenti, mura, gomma
node game/test/browser/skcustom.mjs                     # le mappe dell'editor nella schermaglia: elenco, copertina o disegno, CPU fissata, partita, salvataggio, Ricomincia, file
node game/test/browser/edstyles.mjs                     # le mappe dell'editor nella partita: stili di case e alberi, municipi in piu', la sconfitta con l'ultimo, la nebbia
node game/test/browser/pausevol.mjs                     # il menu di pausa: i cursori del volume di musica ed effetti, il contatore FPS fra le opzioni grafiche
node game/test/browser/netmap.mjs                       # la partita online su una mappa dell'editor (WebRTC vero): chi entra la riceve, la tiene, la seconda volta no
node game/test/browser/alarms.mjs                       # allarmi d'attacco sulla minimappa: per zona, anelli, J, suggerimento
node game/test/browser/minimap.mjs                      # clic sulla minimappa: sposta la view, ordini col destro, riquadro della view
node game/test/browser/zoom.mjs                         # zoom morbido con rotella, touchpad e X/Z, punto sotto il puntatore fermo
node game/test/browser/ambience.mjs                     # nuvole, alba e tramonto rosa, pioggia, camini, crolli, polvere
node game/test/browser/rivers.mjs                       # fiumi, strade e ponti a linee: acqua, ostacolo, pioggia, ponte
node game/test/browser/damage.mjs                       # stadi di danno di edifici nemici di pietra, mura e porte
node game/test/browser/attackorder.mjs                  # gruppo misto mandato ad attaccare: tutti arrivano a colpire
node game/test/browser/burn.mjs                         # edifici di legno: fiamme visibili e frecce incendiarie
node game/test/browser/bridge.mjs                       # livello 4: i civili riparano il ponte, i soldati lo attraversano
node game/test/browser/enemybuildings.mjs               # edifici nemici nuovi: frecce, cura, fuoco, rovine
node game/test/browser/economy.mjs                     # economia nemica: raccolta, depositi, lavoratori, fuga
node game/test/browser/enemyarmy.mjs                   # economia nemica: soldati pagati, attacco, riparazioni, ricostruzione
node game/test/browser/enemydepots.mjs                 # economia nemica: magazzini e mulini nuovi dove mancano
node game/test/browser/enemydefense.mjs                # economia nemica: difesa della base e ondate d'attacco
node game/test/browser/lvl04.mjs                       # livello 4: ponte, ondate dalla base nord, base sud, vittoria
node game/test/browser/lvl07.mjs                       # livello 7: nebbia, pattuglie, lavoratori, macchine, notte, porta, cavalieri, vittoria e sconfitte (§9.178)
node game/test/browser/pvp.mjs sk_padus 5 1500         # partita a due in una pagina: le due parti, stesse impronte
node game/test/browser/netfake.mjs sk_padus 7 2400     # partita a due in rete, canale finto con ritardo e disordine (§9.156)
node game/test/browser/rtc.mjs sk_padus 950            # partita a due con WebRTC vero fra due pagine, dal menu (§9.156)
node game/test/browser/rtcfail.mjs                      # collegamento che non riesce: la causa, la guida "Problemi di connessione" (§9.158)
node game/test/browser/truce.mjs sk_padus 5            # la tregua nella partita a due: nessuno attacca, poi si combatte (§9.156)
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
