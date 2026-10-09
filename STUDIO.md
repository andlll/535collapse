# 535 — diario di studio del porting

Diario delle decisioni, delle scoperte e delle verifiche del porting del
progetto GameMaker in HTML5/WebGL2. Metodo e convenzioni da
[andlll/n_redux](https://github.com/andlll/n_redux) (porting di NIMBUS).

> **Livello di certezza.** Ogni affermazione sul gioco è marcata:
> **[C]** = confermato leggendo i sorgenti GMX · **[I]** = inferito da nomi e
> struttura · **[?]** = non lo so ancora.
> Quello che riguarda il comportamento *del runner GameMaker* (non del gioco)
> è conoscenza del motore, non letta qui: lo marco [I] finché non lo verifico.

---

## Cose da fare (lista aggiornata a ogni passo)

Ultimo aggiornamento: 9 ottobre 2026, settima sessione (branch
`claude/clever-heisenberg-qbpsex`): **kit per Tiled** (tileset per
categoria, mappa vuota, room dell'autore convertite, pennello bosco) e
script Tiled -> scenario con anteprima e collaudo; maschere di collisione
che ruotano con lo sprite (Fase 9, §9.1–§9.7).
**Prossimo**: la prima mappa disegnata dall'autore; il gioco che carica
gli scenari (§9.5). Sesta sessione (branch
`claude/nice-hypatia-ei5efe`): macchine d'assedio col flow field "largo",
costi nella scheda del castello, campi di grano a righe con depth -y,
spighe ed erba decorative a fasce, verdi dell'erba, civili che si
incastravano nella raccolta e nella consegna (§8.14–§8.19); roadmap
dopo la prima uscita (sezione "Roadmap" qui sotto). **Prossimo**: i livelli
della campagna disegnati in Tiled ("Prossima sessione" qui sotto). Quinta sessione (branch
`claude/menu-fire-crossfade`): menu in colonna, versione 0.2601, campagna,
fuoco agli edifici, dissolvenze, zoom, gruppi con Shift, barra della vita a pillola e di vetro, punto di raccolta, formazione per ruolo, menu di pausa senza pannello, anelli della pioggia sul fiume (Fase 8, §8.1–§8.13). Quarta
sessione (`claude/gpu-optimizations-bugs-o3mfcc`): seconda tornata di segnalazioni
dell'autore e lista della GPU completata (Fase 7, §7.1–§7.16). Terza
sessione (`claude/inspiring-cray-dalph5`): correzioni dalla prima prova
dell'autore (§6.1, n.77–n.89), pathfinding (§6.2–§6.3), arcieri, torri
e catapulte (§6.4–§6.7), carico della GPU (§6.8). Seconda sessione (PR #2): Fase 3
completa (nebbia e notte, §3.15), particelle (§3.16), correzioni decise
dall'autore (§3.17), suggerimenti, dialoghi, obiettivi, vittoria e
sconfitta (§3.18), correzioni, menu di pausa e traduzioni in sei lingue
(§3.19), menu principale, campagna e battaglia del menu (§3.20); Fase 4:
salvataggi, schermo intero, PWA (§4.1); Fase 5: GitHub Actions, Pages e
zip per i portali (§5.1). **Prossimo**: verifiche su una GPU vera, Firefox
e Safari; livelli 3–10 con l'autore. Il dettaglio di ogni voce sta nella
sezione citata.

**Per riprendere**
- Un branch nuovo da `main` per ogni sessione (una PR per sessione: la
  PR #1 era `claude/lucid-gauss-ph92vs`, la #2 `claude/punto5-nebbia-notte`,
  la terza sessione `claude/inspiring-cray-dalph5`, la quarta
  `claude/gpu-optimizations-bugs-o3mfcc`, la quinta
  `claude/menu-fire-crossfade`, la sesta `claude/nice-hypatia-ei5efe`, la
  settima `claude/clever-heisenberg-qbpsex`); gli asset generati (`game/assets/`,
  `gmx/`) non sono nel repo: si rigenerano con `tools/01`, `02`, `05`,
  `06`, `07` dagli zip (README, "Rigenerare" e "Far girare il gioco").
- Prove: `npm test` e `game/test/browser/soak.mjs` (README, "Provare").
  Prima di ogni commit: build, test, soak senza errori, e una prova mirata
  del sistema toccato con `window.__game` (scenari descritti in fondo a
  ogni sezione di §3).
- Metodo: per ogni sistema si legge il GML in `src/objects/<oggetto>/`, si
  porta citando file ed evento, si confrontano le copie quasi uguali
  (famiglie di edifici, unità) e si scrive una tabella invece di duplicare;
  i difetti si riproducono e si chiedono all'autore, con una
  raccomandazione, poi si annotano in §3.x.
- Codice: `world.js` (motore e semantica GMS), `pathing.js`,
  `units.js`/`civilians.js`/`ranged.js`/`siege.js` (alleati),
  `enemies.js`/`enemybuild.js` (nemici), `buildings.js`/`walls.js`/
  `production.js` (edifici), `levels.js` (regia), `manager.js` (HUD,
  tastiera, minimappa), `fog.js`/`fogdraw.js` (nebbia e notte), `props.js`
  (statue, pali, bracieri), `particles.js`/`effects.js` (particelle e loro
  usi), `hints.js`/`endgame.js` (suggerimenti, dialoghi, fine partita),
  `menu.js` (menu principale e campagna), `pause.js`, `i18n.js`/`texts.js`
  (traduzioni), `save.js`/`snapshot.js` (salvataggi), `fullscreen.js`,
  `app.js` (registrazione dei comportamenti).
- Prove: anche `game/test/browser/saves.mjs` (salva, ricarica, stato
  identico), `portal.mjs` (lo zip dei portali in un iframe), `workers.mjs`
  e `deposit.mjs` (civili al lavoro e consegna su ordine, §8.19, fuori dalla CI); la CI
  (`.github/workflows/build.yml`, §5.1) le fa tutte a ogni push e da `main`
  pubblica il gioco su GitHub Pages: https://andlll.github.io/535collapse/
  (come NIMBUS). **Se cambia la forma dello stato** (campi delle istanze
  rinominati o con un altro significato) si alza `SAVE_VERSION` in
  `save.js`: i salvataggi vecchi diventano "non validi" invece di caricare
  una partita incoerente.

**Decisioni o materiali che servono all'autore**
- [ ] Screenshot dell'originale con il pannello delle risorse: raggio degli
  angoli di `draw_roundrect_colour_ext` (§3.1).
- [ ] Screenshot o video di fuoco e pioggia: aspetto delle forme di
  particella interne di GameMaker (`pt_shape_flare`, `line`, `pixel`).
- [x] Colore della percentuale di produzione: nero, deciso dall'autore
  (§6.1 n.79).
- [ ] Dopo la prova: il blocco dei tasti di costruzione coi soli civili
  selezionati (§6.1 n.81) non l'ho riprodotto in un caso preciso; se torna,
  serve la sequenza di clic.
- [ ] Traduzioni (§3.19): scritte da me, da far rileggere a madrelingua
  se possibile.
- [x] Formato con cui disegnare le room dei livelli 3–10 (§0.15): **mockup
  in Tiled con gli sprite del gioco**, deciso l'8 ottobre 2026 (vedi
  "Prossima sessione" qui sotto).
- [ ] Nome definitivo della prima uscita ("535 – Collapse", provvisorio).
- [ ] `chiazza01` (§9.6): nell'originale e' chiazza1 o chiazza2 a caso, nel
  porting sempre chiazza2. Raccomandazione: rimettere il caso.
- [ ] Attivare GitHub Pages (Settings → Pages → Source: "GitHub
  Actions"): senza, il passo di pubblicazione su `main` fallisce (§5.1).

**Prossima sessione: livelli della campagna disegnati in Tiled**
(deciso con l'autore l'8 ottobre 2026; salvo bug sparuti, le prossime
sessioni sono per i livelli 3–10)
- Perche' Tiled (mapeditor.org, gratuito, Windows/Mac/Linux): l'autore
  vuole vedere la resa finale prima di consegnare la room, senza passare da
  GameMaker; un'immagine piatta (PNG) andrebbe riconosciuta sprite per
  sprite (errori con alberi sovrapposti e oggetti simili), mentre Tiled
  salva nome e posizione di ogni oggetto: la conversione e' esatta.
  Scartate: tavolozza di colori con legenda (non mostra la resa), editor
  dentro il gioco (resta per piu' avanti: roadmap R6).
- [ ] **Formato scenario** (in parte) (roadmap R2) in una cartella sua, `scenari/`:
  `data/rooms/` si cancella e si riscrive da `tools/02_extract.py` a ogni
  giro (e la CI controlla che resti uguale ai file GameMaker), quindi le
  room nuove non possono stare li'. Contenuto minimo: dimensioni, istanze
  (oggetto, x, y, eventuali campi), vista iniziale, risorse iniziali; con
  versione. Il gioco e `tools/07_scene.py` lo caricano come le room di oggi.
  La logica del livello (obiettivi, dialoghi, ondate) per ora nel codice,
  come lvl01 e lvl02 (`levels.js`).
  **Fatto** (§9.3): il formato, scritto da `tools/12_tiled_import.py`.
  **Manca**: caricarlo nel gioco e in `tools/07_scene.py` (§9.5).
- [x] **Kit per Tiled** (§9.1, §9.2: `tools/11_tiled_kit.py`, zip anche
  come artefatto della CI), generato da uno script dagli sprite (come l'atlas):
  - un tileset "collezione di immagini" per categoria (terreno: 10
    montagne, 7 fiumi, 5 strade, 4 sentieri, chiazze; natura; risorse;
    edifici del giocatore; edifici e unita' nemiche; unita' del giocatore;
    citta' romana), ogni immagine col nome dell'oggetto e l'origine dello
    sprite (Tiled ancora gli oggetti in basso a sinistra: lo script ne
    tiene conto);
  - un file mappa vuoto della dimensione del livello, coi livelli di
    oggetti (terreno sotto, il resto sopra) e l'ordine di disegno
    "dall'alto in basso" (Tiled disegna dopo chi sta piu' in basso, come la
    depth -y del gioco);
  - segnaposto per cio' che Tiled non mostra: macchie di erba e spighe
    decorative (un'immagine della macchia com'e' nel gioco), chiazze; le
    unita' si vedono in una sola posa (nel gioco si animano da sole);
  - un "pennello bosco": una forma su un livello apposito che lo script
    riempie di alberi (per non piazzarne centinaia a mano).
- [x] **Script Tiled -> scenario** (§9.3, `tools/12_tiled_import.py`): legge il file di Tiled
  (TMX, il formato predefinito di Tiled), converte posizioni e origini, riempie le aree bosco, scrive
  lo scenario; controlla oggetti sconosciuti e coordinate fuori mappa.
- [ ] **Vista d'insieme per l'autore** (in parte) (§9.3: l'immagine della mappa intera
  c'e', `--anteprima`; mancano gli screenshot dal gioco): per ogni livello un'immagine della
  mappa intera con gli sprite veri e qualche screenshot a zoom normale dal
  gioco; correzioni ridisegnando in Tiled o a parole.
- [x] **Collaudo** (§9.4: le tre room intere, istanze identiche; disegno di
  Tiled uguale a quello con le regole di GameMaker; gli screenshot dal
  gioco quando il gioco carichera' gli scenari): ricostruire in Tiled un pezzo di `match` (o tutta la
  room, convertita in file di Tiled da uno script) e verificare che lo
  scenario che ne esce, nel gioco, sia identico all'originale (stesse
  istanze, stesse posizioni, screenshot uguali).
- [ ] Poi il livello 3: dall'autore l'idea (obiettivo, partenza, nemici,
  dialoghi), le dimensioni e il file di Tiled.

**Vertical slice su `match` (Fase 3)**
- [x] 1. Manager, interfaccia, font (§3.1).
- [x] 2. Selezione, ordini, movimento: cavaliere (§3.3).
- [x] 3a. Civili e raccolta: `ally_omino` (selezione, ordini, movimento,
  legno/oro/pietra, trasporto ai depositi), risorse e risorse esaurite
  (§3.4).
- [x] 3b. Costruzione: pulsanti, piazzamento, cantieri, edifici finiti
  (casa, magazzino, mulino, caserma, stalla, castello, chiesa, torre);
  costruzione e riparazione; centro con produzione di civili; `*_blink`,
  `*_prizedrawer`, `idle_clicker` (§3.5).
- [x] Mura e porte: pulsante, placer, prolungamenti, porte (§3.7).
- [x] 3c. Campi e cibo: `campo`, `campo_fond`, `food_bullet`, semina (§3.6).
- [x] 4a. Fanteria (guerriero, picchiere), caserma, pulsanti
  attacco/difesa, gruppi di controllo (§3.9).
- [x] 4b. Nemici in mischia: IA, morte, cadaveri (§3.10).
- [x] 4c. Arcieri, frecce, presidio di torri e castello, torre nemica (§3.11).
- [x] 4d. Assedio (arieti, catapulte), fuoco, produzione di stalla e
  castello (§3.12).
- [x] 4e. Edifici nemici, ondate di `match`, regia di `lvl02` e delle porte
  di `lvl01`, chiesa (§3.13).
- [x] 5. Nebbia e notte a bassa risoluzione; visibilità di nemici e
  risorse; trucco nebbia con `global.fogville` (difetto n.9 corretto);
  statue, pali e bracieri come fonti di vista e di luce (§3.15).

**Resto del gioco**
- [x] Particelle (riserva unica): pioggia, erba, chiazze, fuoco (fiamme
  degli edifici, fiammata delle frecce incendiarie, bracieri e torce),
  spighe dei campi, germogli, semi della semina; aquila (§3.16). Le
  nuvole del menu (`fog_controller`, `fog01`) sono col menu (§3.20).
- [x] Menu di `enemy_manager_menu` (la battaglia dimostrativa del menu) e
  `fog_controller` (le sue nuvole) insieme al menu principale (§3.20).
- [x] Suggerimenti del tutorial, dialoghi, obiettivi, vittoria e
  sconfitta (§3.18).
- [x] Menu principale e campagna: pulsanti, mappa, sottomenu livelli,
  lucchetto a 5 cifre, sblocco **persistente** che parte da 1 (§0.14,
  `progress.js`); livelli 3–10 "in arrivo" (§3.20).
- [x] Menu di pausa (`mouser`) con opzioni grafiche e lingua (§3.19).
- [x] `lvl01`: catena delle 4 porte; `lvl02`: aree difese, area 7 che
  conta per la vittoria (§1.2), `l6exists` falso ad area 6 libera (§3.13);
  i dialoghi che li accompagnano sono in §3.18.
- [x] Correzioni decise in Fase 1 (§1.6), applicate coi sistemi: ariete
  60 oro anche col tasto Q, annullare un picchiere restituisce 55 cibo e
  45 legno, centro distrutto −10 popcap, castello e torre senza −5.
- [x] Fiamme alte della casa da non distruggere (§3.5 n.18, §3.16).

**Fasi 4 e 5**
- [x] Salvataggi JSON come NIMBUS (versione del formato, checksum, file
  esportabile/importabile), slot per room e salvataggio automatico (§4.1).
- [x] Opzioni nel menu di pausa (tetto fps, risoluzione dinamica,
  particelle) e traduzione dei testi del gioco in sei lingue (§3.19).
- [x] Pulsante schermo intero con ripiego; PWA (§4.1).
- [x] Workflow GitHub Actions (atlas, maschere, scene, bundle → Pages);
  zip per i portali verificato con Playwright in una sottocartella (§5.1).

**Fase 6: correzioni dalla prova dell'autore**
- [x] Pioggia, zoom e rotella, percentuale in nero, inattivi, contatori
  della selezione, scorrimento fuori dalla finestra e blocco del mouse,
  cursore disegnato dal gioco, angoli sfumati, schede a destra della
  minimappa, font del gioco nei messaggi HTML, menu di pausa piu'
  piccolo, contatore FPS e passo fisso, formazione negli spostamenti di
  gruppo (§6.1).

**Pathfinding (§6.2)**
- [x] Studio e misure; A (campi 4–5 volte piu' veloci), B (collisioni
  senza copie), stessi risultati verificati passo per passo; C (niente
  spigoli tagliati), D (percorsi dritti, "step towards" solo con la meta
  in vista).
- [x] Studio delle alternative a `instance_nearest`; N1, N2, N3 (§6.3):
  stessi risultati, passo -23% in `lvl02`, -18% in `match`.
- [ ] Eventuale N4 (indice spaziale per `instance_nearest`) quando ci
  saranno battaglie con 100+ unita' (§6.3).
- [x] Nemici che uscivano dalla mappa quando il flow field non ha
  direzione nella loro cella (§6.2, "trovati"): ora vanno alla cella
  raggiungibile piu' vicina o restano fermi (§7.6).

**Arcieri (§6.4)**
- [x] Tiro solo con la linea libera da edifici (le unita' non contano); se
  serve si spostano nei paraggi (guinzaglio di 250 px); frecce fermate
  dagli edifici.
- [x] Torri, castello, centro e torre nemica: non tirano attraverso gli
  edifici e scelgono un altro bersaglio (§6.5); mura e porte non li
  fermano (tirano dall'alto).
- [x] Montagne e tutte le rovine solide fermano le frecce, i boschi no; le
  mura non fermano torri e castello (decisione dell'autore, §6.6).

**Catapulte (§6.7)**
- [x] Troppo vicine al bersaglio: arretrano in un punto cercato (libero,
  raggiungibile, a tiro), alleate e nemiche; un tiro ordinato troppo
  vicino arretra e poi tira.

**Carico della GPU (§6.8)**
- [x] Studio (riempimento 4,7–6,5 schermi a frame, shader con 16 `if`,
  peso di erba, nebbia e notte, fuochi, interfaccia).
- [x] G0 tempo GPU per frame nel pannello F3 (dove il browser lo espone).
- [x] G1 opzione Qualita' (Alta/Media/Bassa): mondo a risoluzione ridotta,
  interfaccia nitida; la risoluzione dinamica ora riduce solo il mondo.
- [x] G2 (variante leggera, §7.11): texture scelta con un albero di
  confronti e letta con `textureLod`; pixel identici. La variante con le
  texture a strati resta da valutare col dato di F3 (costa 70–130 MB).
- [x] G3 nebbia e notte in un solo quad, composte prima del mondo (§7.13).
- [x] G4 suolo cotto in blocchi da 512 px (§7.16): -25% in `lvl02`, -10%
  in `match`.
- [x] G5 erba e spighe piu' rade in qualita' Media (70%) e Bassa (50%)
  (§7.15).

**Fase 7: seconda tornata di segnalazioni (§7)**
- [x] Testo delle schede sempre nero (§7.1); pulsanti di attacco/difesa e
  di costruzione con piu' unita' dello stesso tipo selezionate (§7.2).
- [x] Macchine d'assedio che non accettavano ordini (§7.3).
- [x] `lvl01`: pilastri delle porte di nuovo ostacoli (si passa dal
  varco), militari di partenza in attacco (§7.4).
- [x] Germogli del campo solo a semina cominciata (§7.5); costruttore che
  "impazziva" sopra il magazzino finito (§7.6).
- [x] Mischia: posti attorno al bersaglio e percorsi locali, alleati e
  nemici; attaccanti delle ondate fermati uno per uno (§7.7).
- [x] Cadaveri, rovine e risorse finite che sbiadiscono (§7.8); pioggia
  piu' spessa (§7.9); unita' prodotte verso un posto libero (§7.10).
- [x] Pausa con sfocatura gaussiana (§7.12); nebbia bicubica, senza
  scalini (§7.13); interfaccia di vetro, opzione attiva di norma (§7.14).
- [ ] Da vedere sul PC dell'autore: costo del vetro e di G3/G4 su una
  GPU vera (F3), aspetto del vetro sopra le zone nere della nebbia.
- [x] Rovine di pietra di castello (500), torre (100) e chiesa (75) portate
  come risorse, e campi verso una meta dentro un ostacolo (§7.17).

**Verifiche che mancano**
- [ ] Prestazioni su una GPU vera (pannello F3 dal PC dell'autore, riga
  "GPU per frame" in Alta e in Bassa),
  Firefox, Safari, schermi ad alta densità.

---

## Roadmap (8 ottobre 2026)

Discussa con l'autore l'8 ottobre 2026, senza implementare niente: dove
puo' andare il gioco dopo la prima uscita. Ogni tappa usa la precedente;
l'ordine e' una proposta, le date no. Le decisioni gia' prese sono in
grassetto.

**Prima uscita**
- [ ] Livelli della campagna 3–10, disegnati in Tiled (formato scenario e
  kit: "Prossima sessione" qui sopra).
- [ ] Verifiche su una GPU vera, Firefox, Safari; nome definitivo; GitHub
  Pages attivo (liste qui sopra).

**R1. Squadre e controllori (la base di tutto il resto)**
Oggi il giocatore sono gli oggetti `ally_*` e l'IA i `enemy_*`, e i bersagli
si cercano per famiglia (`nearest(..., "enemy_build")`). L'asimmetria fra
le unita' e' **solo estetica** (autore): stesse unita', colori diversi.
- Una **squadra** su ogni istanza; "nemico" diventa "di un'altra squadra".
  Tocca quasi tutti i comportamenti: prima di cominciare, un conteggio dei
  punti che dipendono da ally/enemy per stimarlo.
- Un **controllore** per squadra che da' gli ordini con gli stessi comandi:
  giocatore locale, IA dei barbari (quella di oggi), IA "romana" (R3),
  giocatore remoto (R5). Le unita' non sanno chi le comanda.
- Stato per squadra: risorse, popolazione, selezione e contatori (oggi
  globali singoli in `g` e `selected`), nebbia.
- **Colori dal proprio lato**: ognuno vede le proprie unita' ed edifici
  rossi e quelli dell'avversario blu; la simulazione conosce solo le
  squadre, il colore lo sceglie il disegno. **Gli sprite blu esistono gia'
  tutti** (autore), anche di civili ed edifici: vanno solo caricati (oggi
  l'atlas ha le versioni `b_*` delle sole unita' militari).
- **Si usa prima nella campagna** (autore): alcuni scenari della campagna con
  un avversario che gioca come il giocatore, poi la stessa logica si adatta
  al 1 contro 1. Se quei livelli fanno parte della prima uscita, R1 (e R3)
  vanno prima dell'uscita: [?] da decidere con l'autore.
- Verifica: la campagna di oggi deve restare identica (squadra del
  giocatore contro controllore "barbari"); soak, salvataggi e prove mirate
  prima e dopo.

**R2. Scenari come dati**
- Un formato di scenario proprio, con versione (come i salvataggi),
  indipendente dai file GameMaker da cui oggi derivano le room: istanze
  (oggetto, x, y, squadra), squadre e controllori, risorse iniziali,
  condizioni di vittoria e sconfitta, impostazioni dell'IA.
- **Regole dichiarative, mai codice nei file** (saranno scambiati fra
  sconosciuti): condizioni e trigger ("distruggi X: vittoria", "al minuto 5
  un'ondata"). La logica scritta a mano dei livelli (`levels.js`) passa a
  questo formato un po' alla volta.
- Validazione rigorosa al caricamento: solo oggetti noti, coordinate dentro
  la mappa, dimensioni massime.
- La griglia dei percorsi si ricava gia' dalle istanze (`initCost`): una
  mappa nuova non chiede altro.

**R3. IA "romana"**
- L'IA di oggi non raccoglie e non costruisce: i barbari producono a tempo e
  attaccano a ondate. Un avversario che gioca come il giocatore deve gestire
  un'economia (civili alle risorse, costruzioni, quando attaccare).
- Prima a copione (sequenza di costruzione, ondate a tempo; difficolta' con
  bonus alle risorse), poi migliorata. Serve gia' agli scenari della
  campagna di R1.

**R4. Schermaglia: giocatore contro PC**
- **3–4 mappe simmetriche** (autore), scritte nel formato di R2 (a mano o
  generate da uno script) anche prima dell'editor: collaudano il formato.

**R5. 1 contro 1 online (aggiornamento o espansione dopo l'uscita)**
- **Host autorevole**: un giocatore simula, l'altro manda i comandi e riceve
  lo stato (solo cio' che cambia, 10–20 volte al secondo, interpolato). Il
  lockstep deterministico e' scartato: `Math.random` in tutta la logica, e
  seno, coseno, `atan2` e `hypot` non danno per forza gli stessi bit in
  Chrome, Firefox e Safari (desync). Lo stato completo (`snapshot.js`)
  serve per chi entra e per risincronizzare.
- WebRTC (DataChannel) fra i due browser; un piccolo servizio di
  segnalazione; un relay TURN per il 10–20% di reti che non si collegano
  direttamente (costo di banda), o in alternativa un relay WebSocket.
- Partita con un codice da condividere o un link di invito.
- **Prima di tutto**: verificare portale per portale regole e Content
  Security Policy dell'iframe per le connessioni esterne, e se offrono un
  SDK per il multiplayer.
- In partita online niente pausa ne' salvataggi; disconnessioni, ritardo
  sugli ordini del client (mascherato dal segnalino del clic).

**R6. Editor di mappe e scenari condivisi (espansione)**
- Un editor nel gioco che produce file di scenario (R2); scambio fra
  giocatori via file JSON con import/export come i salvataggi (funziona
  anche nell'iframe dei portali). A quel punto e' soprattutto interfaccia:
  formato, validazione e caricamento esistono gia'.

**Idee aperte (non decise)**
- [?] Piu' di due giocatori (2 contro 2, tutti contro tutti) sopra R1 e R5.
- [?] Replay delle partite: con R1 bastano lo scenario e i comandi registrati,
  ma la riproduzione ha gli stessi limiti di determinismo del lockstep.
- [?] Un elenco di scenari della comunita' dentro il gioco (serve un
  servizio per ospitarli).

---

## Fase 0 — ricognizione (5 ottobre 2026)

> **Superata in parte da §0.14**: la prima ricognizione era su un'esportazione
> vecchia (`535 export`, aprile 2025). L'autore l'ha sostituita con
> `AOE_TYPE(1).project.gmx`. I numeri validi sono quelli di §0.14; il resto di
> questa sezione resta come storia e per i sistemi che non sono cambiati.

Stato: **solo lettura**. Nessun codice scritto. Gli zip sono stati estratti in
una cartella temporanea fuori dal repo e ricomposti nella struttura standard
di GMS 1.x (`sprites/` + `sprites/images/`, ecc.). Le cifre sotto vengono da
uno script Python di censimento che legge direttamente gli XML e i PNG; in
Fase 1 diventa `tools/`.

### 0.1 Cosa c'è nel repo

**[C]** Il repo contiene il progetto come zip, non come cartella:
`535 export.project.gmx` (alla radice) e 13 zip (`objects`, `rooms`,
`scripts`, `background`, `fonts`, `paths`, `extensions`, `Configs`,
`sprites no img` + `img parte 1..4` con i PNG dei frame), `help.rtf` (vuoto).
Ricomposti danno un progetto completo: **0 frame mancanti** fra quelli citati
dai `.sprite.gmx`.

### 0.2 Formato

**[C]** GameMaker: Studio **1.x**: `.project.gmx`, risorse XML `*.sprite.gmx`,
`*.object.gmx`, `*.room.gmx`, script `.gml`. Nessun `.yyp`.

Struttura dei file letti (esempi reali):

- **Sprite** (`aa11.sprite.gmx`): `xorig`/`yorigin`, `colkind`
  (0 precisa, 1 rettangolo, 2 ellisse, 3 rombo), `coltolerance`, `sepmasks`,
  `bboxmode` (0 auto, 1 piena, 2 manuale) + `bbox_*`, `width`/`height`,
  `TextureGroups`, lista `<frame index="n">images\nome_n.png</frame>`.
- **Oggetto**: `spriteName`, `solid`, `visible`, `depth`, `persistent`,
  `parentName`, `maskName`, `PhysicsObject`, poi `<events>` con
  `<event eventtype enumb|ename>` e dentro `<action>` con `libid`, `id`,
  `kind`, `functionname`, `whoName` (applies to), `relative`, `isnot`,
  `<arguments>`. Il codice GML scritto a mano è l'azione `id=603 kind=7`
  ("execute code"), testo nell'unico argomento.
- **Room**: `width`/`height`, `speed`, `persistent`, `code`, 8 `<background>`,
  8 `<view>` (con `objName` da seguire, `hborder`/`vborder`), `<instances>`
  (`objName`, `x`, `y`, `scaleX`, `scaleY`, `colour`, `rotation`, `code`),
  `<tiles>`.

### 0.3 Censimento

| Risorsa | Quantità | Note |
|---|---|---|
| Oggetti | **315** | 183 con parent, 175 con maschera, 134 senza sprite, 35 senza eventi, **0 fisica**, 0 persistenti |
| Sprite | **1462** | **1485 frame**: 1455 sprite a 1 frame, 5 da 3, 1 da 6, 1 da 9 |
| Room | **5** | vedi sotto |
| Script | 15 | 336 righe (pathfinding a flow field, occupazione celle) |
| Background | 3 | `city1`, `city2`, `green1`, 281×250, tile ripetuti |
| Font | 2 | `GUI_1` = Impact 16, `overdue` = Arial Narrow 15, solo ASCII 32–127 |
| Path | 1 | `path0`, 2 punti; nel codice c'è un solo `path_end` |
| Suoni | **0** | |
| Shader | **0** | |
| Timeline | **0** | |
| Datafiles / costanti | 0 / 0 | |
| Estensioni | 3 | vedi 0.6 |

**Room** [C]:

| Room | Dimensione | speed | Istanze | View 0 | Ruolo |
|---|---|---|---|---|---|
| `match` | 7000×7000 | 60 | 529 | segue `mouser`, 3000×2000 | partita vera |
| `lvl01` | 5000×5000 | 60 | 560 | segue `mouser`, 3000×2000 | città romana di notte |
| `menu` | 7000×3000 | 60 | 205 | 1600×900 | menu con battaglia di sfondo |
| `resizer` | 2000×1200 | 60 | 3 | — | avviso sullo zoom del browser |
| `mobile` | 2000×2000 | 60 | 1 | — | "Android/iPhone non supportati" |

Nessuna room ha tile, codice di creazione, codice d'istanza o fisica. 38
istanze in tutto hanno scala/rotazione/colore diversi dal default.

**Flusso fra room** [C dai `room_goto`]:
`resizer` → (Invio/Esc/Spazio) → `menu` → (click) → `match` →
(`gameover_manager`) → `menu`. `manager` manda a `mobile` se
`os_type` è Android o iOS. **`lvl01` non è raggiungibile**: nessun
`room_goto(lvl01)`. **[C]** Nel progetto la prima room dell'albero è `match`;
**[I]** in GMS 1.x la prima room è quella di avvio, quindi questa build parte
direttamente in partita (probabilmente una scorciatoia di sviluppo).

**Codice** [C]:

- **2001 azioni "execute code"** contro **45 azioni drag & drop** (8 tipi:
  `action_if_variable` 21, `action_potential_step` 13, `action_sprite_set` 6,
  `action_move` 2, `action_set_motion`, `action_if_dice`, `action_set_cursor`).
  Al contrario di NIMBUS, **il gioco è GML scritto a mano**.
- ~23.500 righe di GML negli oggetti (607 KB) + 336 negli script.
- **Molto duplicato**: 862 blocchi distinti su 2001, 4861 righe distinte non
  vuote. ~3600 righe sono la scelta dello sprite per direzione e fotogramma
  (`if phase=1 {if step=0 sprite_index=ww41 ...}`), copiata per ogni unità.
- Oggetti più grossi: `ally_omino` (1806 righe), `manager` (924),
  `ally_warrior` (769), `ally_catapulta` (746), `ally_picchiere` (632), …
- 129 funzioni GameMaker distinte. Le più usate: `draw_set_alpha` 574,
  `instance_create` 523, `instance_destroy` 487, `instance_nearest` 433,
  `draw_set_font` 267, `draw_text` 264, `draw_sprite_ext` 233,
  `draw_rectangle_colour` 191, `instance_number` 187, `distance_to_object` 157,
  `draw_circle_colour` 150, `draw_roundrect_colour_ext` 129,
  `ds_grid_set` 70, `collision_rectangle` 63, `place_free` 58, la famiglia
  `part_*` (~750 occorrenze), `mp_potential_step` 15. Elenco completo nel
  censimento.
- `with` 621 occorrenze, `other` 30, `alarm` 701, `depth` 236,
  78 variabili `global.*` (3336 riferimenti).
- **Nessuna** chiamata a `image_speed`/`image_index`: l'animazione si fa
  cambiando `sprite_index` a mano (un frame = uno sprite).

**Eventi** [C]: Create 273, Step 166 (+11 Begin, +13 End), Collision 145,
Alarm (0..11) ~258, Draw GUI 119, Draw 28, Draw End 44, Draw GUI End 5,
Destroy 46, mouse: left released 63, global left pressed 66, global left
released 24, global right released 12, mouse enter 53, mouse leave 53,
right released 45; tastiera ~90 eventi (vedi 0.5).

### 0.4 Che gioco è

**[C]** Un **RTS isometrico in stile Age of Empires**, romani contro barbari.
Tutto il testo dell'interfaccia è in **inglese** (~150 stringhe), i commenti
nel codice sono in italiano.

- **Unità**, alleate (`ally_*`) e nemiche (`enemy_*`, sprite `b_*`):
  guerriero, picchiere, arciere, cavaliere, catapulta, ariete, più
  l'`omino` (civile: raccoglie, trasporta, costruisce). **[C]** 8 direzioni
  (`phase` 1–8 da `direction`, settori di 45°) × 3–4 fotogrammi, ogni
  fotogramma uno sprite separato (`ww41`, `wa41`, …).
- **Edifici**: centro, casa, campo, mulino (`barn`), magazzino, caserma,
  stalla, castello, chiesa (monastero), torre, mura orizzontali/verticali e
  porte. Ognuno ha la famiglia `_placer` (piazzamento), `_fond` (cantiere),
  `_clicker` (bottone), `ruin` (rovina).
- **Risorse** [C]: `food`, `wood`, `gold`, `stone`, `pop`/`popcap`;
  `food`/`wood`/`gold` limitate a 9999 ogni Step.
- **Nemico** [C] `enemy_manager`: ondate a tempo (`alarm[1]`, 18550 tick,
  poi 14550 dalla 7ª), spawn in (5500,150..450); ogni 600 tick manda i nemici
  sui civili e gli assedianti sugli edifici. **[C]** `manager` fa comparire
  tre presidi di difensori quando un'unità alleata si avvicina a punti fissi.
- **Vittoria** [C]: in `match`, distruggere le tre basi
  (`global.base1b/2b/3b` arrivano a 0) crea `victory_manager`.
- **Giorno/notte** [C] `manager` `alarm[0]/[1]`: `global.night` sale/scende
  di 0,005 per tick; la visuale delle unità si allarga di giorno.
- **Pioggia** [C] (`alarm[4]`/`[6]`): sistema di particelle, spegne gli
  incendi (`ally_wooden.onfire=0`).
- **Fuoco**: frecce incendiarie (`fire_bullet`) incendiano gli edifici di legno.
- **Tutorial a suggerimenti** [C]: 26 oggetti `hint_*` (figli di
  `parent_hint`) che compaiono la prima volta che succede qualcosa.
- **Nebbia di guerra** [C]: vedi 0.7.
- **Minimappa** [C] in `manager` Draw GUI (tasto M).

### 0.5 Input

**[C]** Il gioco è pensato **solo per desktop** con mouse e tastiera: la room
`mobile` dice esplicitamente "Android devices are not supported".

- **Selezione**: click sinistro sull'unità (doppio click = tutte quelle dello
  stesso tipo in vista); trascinamento = rettangolo di selezione
  (`global.multi`, `startx/starty`); Alt+click = deseleziona; Esc = deseleziona.
- **Ordini**: **click destro** (rilascio) su terreno/risorsa/nemico/edificio.
- **Hover**: 53 oggetti usano Mouse Enter/Leave per tooltip e cursore colorato
  (`mouser` disegna cerchi di colore diverso secondo cosa c'è sotto).
- **Camera** [C]: la view segue l'oggetto `mouser` (che sta sul cursore) con
  bordo 32 px e velocità istantanea → **[I]** scorrimento ai bordi muovendo il
  mouse; frecce = pan (10 px, 30 con Ctrl); Spazio (`idle_clicker`) =
  seleziona a turno un civile inattivo e centra la camera su di lui;
  X/Z = zoom indietro/avanti (`global.scaleview` 1,0–1,5, passi di 0,1).
- **Scorciatoie** [C]: Q W E R T D G C (costruzione/creazione), Canc (24
  oggetti: distruggi/annulla), A (torre/difesa), C (cambia stile di casa e
  mura durante il piazzamento), 0–9, H (suggerimenti), M (minimappa),
  O (obiettivo), Ctrl e Alt come modificatori.
- **Trucchi lasciati attivi** [C]: tenendo V, Alt+F/Q/S/W/P aggiunge 1000 di
  cibo/oro/pietra/legno/popolazione; Ctrl+V+Invio spegne la nebbia;
  tastierino 0 = `room_restart()`. `show_debug_overlay(true)` è attivo in
  `manager` Create.
- **Nessun** touch, gamepad, `device_*`, `keyboard_check` (solo eventi).

### 0.6 Piattaforma, salvataggi, estensioni

- **[C]** La build originale era **HTML5** (titolo pagina "Mount Fuji Software
  Beta", texture page 4096, particelle built-in, fullscreen consentito).
  `manager` ridimensiona ogni 10 tick canvas e view su
  `browser_width/height` − 5, quindi **1 px di mondo = 1 px di schermo** a
  zoom 1.
- **[C] Nessun salvataggio**: zero chiamate `ini_*`, `file_*`, `buffer_*`,
  `game_save`/`game_load`. L'estensione "Save Filesystem – Edge Engine" è
  inclusa ma non ha funzioni e non è richiamata. `loadbar`/`ImageLoadBar` sono
  la barra di caricamento HTML5: non servono.
- **[C] Nessun suono** (cartella `sound` vuota, nessuna funzione audio).
- **[C]** `manager` Create mette risorse iniziali `food=99100`,
  `gold=9950`, `wood=9950`, `stone=9990` (il cibo viene subito tagliato a 9999).
  **[I]** Valori di prova. **[?]** Quali sono quelli voluti.

### 0.7 Funzionalità GameMaker che pesano sul porting

| Funzionalità | Uso | Peso |
|---|---|---|
| Fisica | 0 | — |
| Shader | 0 | — |
| Timeline | 0 | — |
| Path | 1 `path_end` | trascurabile |
| Room persistenti | 0 | — |
| Ereditarietà | 183 oggetti, ~20 parent (`natural_parent` 54, `parent_hint` 26, `clicker_parent` 14, `ally_build`, `enemy_unit`, …) | **medio**: `with(parent)` e `instance_nearest(parent)` agiscono su tutti i figli |
| `with`/`other` | 621 / 30 | medio |
| Alarm | ~258 eventi, 12 indici | medio: semantica di conteggio da replicare |
| Depth | `depth=-y` nelle unità, -9999 per la GUI | facile (ordinamento per y) |
| Collisioni | 145 eventi Collision; maschere: 1400 rettangolo, **35 precise** (edifici, fiumi, montagne), 12 ellisse, 15 rombo; `place_free` contro oggetti `solid` | **alto**: servono maschere a bit per le precise |
| Movimento | `mp_potential_step` (15), `motion_add`, `speed`/`direction` | **alto**: l'algoritmo di `mp_potential_step` è del runner, non del gioco |
| Pathfinding | flow field su `ds_grid` 32 px negli script; `mp_grid_create` creato ma **[I]** non usato per percorsi | medio |
| Superfici | 3 superfici **grandi come la room** (nebbia, nebbia nera, notte) con `bm_subtract` | **alto** (vedi sotto) |
| Particelle | ~35 punti di creazione di `part_system`, molti **per istanza** in Step/Collision; forme `pt_shape_flare`, `line`, `pixel` + 9 tipi a sprite | medio-alto: pool e texture `flare` da ricreare |
| Draw immediato | `draw_text`, rettangoli arrotondati, cerchi, ellissi, gradienti di colore, `draw_set_alpha` | medio: servono primitive nel batch |
| Draw GUI | 119 oggetti | medio |
| Viste | 1 view, segue `mouser` | facile, ma il "segui il cursore" va ripensato per il touch |
| `os_type` | 4 (solo per mandare a `mobile`) | facile |
| Rami per piattaforma | `browser_width/height`, `window_set_size` | si butta |

**Il problema di memoria dell'originale** [C]: `manager` Draw End crea
`fog`, `blackfog` e `nite` con `surface_create(room_width, room_height)`. In
`match` sono 7000×7000×4 byte = **196 MB l'una, ~590 MB in tutto**, e
ridisegnate ogni frame. Su molti telefoni la creazione fallirebbe del tutto
(limite di texture 4096). Nel porting questa è la prima cosa da rifare:
nebbia e luce notturna su una griglia a bassa risoluzione (es. 1 texel ogni
32 px = 219×219, ~0,2 MB), scoperta persistente in una texture a parte.

**Costi per frame** [C, conteggio statico negli Step]: `instance_nearest` 304,
`distance_to_object` 145, `instance_number` 123, `with` 165. Sono O(n) per
chiamata e chiamate da ogni unità → O(n²) per frame. Su mobile servirà un
indice spaziale.

### 0.8 Asset e budget

Memoria texture decodificata (larghezza×altezza×4), misurata sui PNG:

| | MB |
|---|---|
| Tutti i frame, tela intera | 361 |
| Tutti i frame, **ritagliati sull'alpha** | **226** |
| di cui cartella `natura` (51 sprite: montagne, fiumi, strade, tracce) | 119 |
| di cui edifici | 26 |
| di cui unità (tutte, 8 direzioni) | ~70 |

**[I]** Per room quasi tutto serve sempre: `match` e `menu` usano unità ed
edifici di entrambe le fazioni (calcolo per chiusura oggetto→codice→sprite,
volutamente largo: ~1400 sprite per room). Sprite mai raggiunti: 39 (~6 MB),
fra cui le icone `*_sel`, `director_blue2`, `cursore`.

**Peso su disco** (misurato, frame ritagliati, WebP con alpha senza perdita):

| Variante | MB |
|---|---|
| PNG originali | 55,5 |
| WebP senza perdita | 33,3 |
| WebP q85 | **10,9** |
| WebP q85, `natura` a metà risoluzione | **8,9** |
| WebP q85, tutto a metà | 6,6 |

Il download iniziale sta comodamente sotto i 20 MB.

**[I]** Lo stile è **illustrato isometrico** (tratto nero, campiture
morbide), non pixel art: un ridimensionamento a 0,5 dei terreni regge molto
meglio che su pixel art. Da verificare con screenshot affiancati in Fase 2.

### 0.9 Proposta di architettura

Prima proposta (in chat, Fase 0): **B**, porting mirato. Rivista in 0.11
dopo la decisione "solo desktop".

### 0.10 Decisioni dell'autore (risposte alla Fase 0)

1. **Asset**: tutti dell'autore, distribuibili. Titolo del gioco "535";
   questa prima uscita si chiamerà "535 – Collapse" (nome definitivo da
   fissare). **Font**: Impact e Arial Narrow vanno sostituiti con font liberi.
2. **Solo orizzontale, solo desktop.** Il mobile è fuori per ora
   (i controlli touch restano "da tenere presenti", non da fare).
3. **Portali**: itch.io, Newgrounds, Game Jolt, poi CrazyGames. **Niente
   Android/Capacitor.**
4. **Niente audio.** Salvataggi **come NIMBUS**: JSON espliciti con
   versione del formato e checksum leggero, `localStorage` per il salvataggio
   rapido + file `.json` esportabile/importabile (`game/src/save.js` di
   n_redux come riferimento di metodo).
5. **Trucchi**: restano attivi anche fuori dal debug, come nell'originale.
   `resizer`, `mobile` e `ally_warrior_sperimentale` si tolgono.
   `lvl01`: vedi sotto.
6. **Si parte dal `menu`.** Risorse iniziali giuste: **cibo 100, oro 50,
   legno 50, pietra 0** (al posto di 99100/9950/9950/9990 di `manager`
   Create, che erano valori di test).

**`lvl01` — verifica dopo la domanda dell'autore** ("dovrebbe essere
raggiungibile dal menu della campagna"):

- **[C]** Non è vuota: 560 istanze. È una **città romana**: 26 tipi di
  edifici `ocr_*` (fra cui tempio, teatro, basilica), mura e porte, statue,
  fontane, colonne, casse; 5 `ally_warrior` contro 62 nemici (picchieri,
  arcieri, guerrieri, cavalieri); `lvl1_surface_generato` disegna in Draw un
  prato di `erba_spr` da y=4040 in giù. `manager` Create la fa partire **di
  notte** (`global.night=1`, `alarm[1]=10000`).
- **[C]** Nel codice **non c'è nessun modo di arrivarci**: nessun
  `room_goto(lvl01)`, nessun `room_goto_next`, l'unico riferimento a `lvl01`
  è il controllo `room=lvl01` in `manager` Create.
- **[C]** Il menu (`enemy_manager_menu` Draw GUI) disegna **due pillole**:
  "Survival - Demo" (cliccabile, `Mouse_56` → `room_goto(match)`) e
  "More coming next - Work in progress" (**nessun gestore di click**).
  **[I]** La seconda è il posto previsto per la campagna, cioè per `lvl01`.

### 0.11 Architettura rivista dopo "solo desktop"

La ragione principale per scartare **A** (runtime "alla GameMaker" che esegue
il GML tradotto) era il mobile: hover, click destro, tastiera e camera che
segue il cursore andavano riscritti comunque. Con il solo desktop quel
motivo cade, e i numeri pesano diversamente:

- **[C]** L'originale **girava già nel browser** come export HTML5 di GMS,
  cioè come JavaScript: il carico di logica per frame (le chiamate
  `instance_nearest`/`distance_to_object` in ogni Step) era accettabile su
  desktop già con il runner di GameMaker.
- Il GML è scritto a mano (2001 blocchi, 23.500 righe) ma con un vocabolario
  piccolo: 129 funzioni, nessuna fisica, shader, audio, timeline, tile.
  Tradurlo in automatico copre **tutto** il gioco, compresi i 26 suggerimenti
  del tutorial, l'interfaccia, i trucchi e `lvl01`, con fedeltà riga per riga
  e il riferimento all'evento d'origine gratis.
- Il lavoro si concentra in poche parti verificabili: il traduttore GML→JS
  (testato su casi isolati), il ciclo eventi/alarm, le collisioni (maschere
  rettangolo/ellisse/rombo/precise), `mp_potential_step`, le primitive di
  disegno, le particelle, i `ds_*`.
- Le deviazioni volute restano poche e circoscritte nel runtime: superfici
  della nebbia/notte a risoluzione ridotta (da ~590 MB a < 1 MB), pool di
  particelle, eventuale indice spaziale sotto `instance_nearest`.

**[I]** Raccomandazione rivista: **A**, con le deviazioni sopra. Stima
grezza ~10–16 sessioni contro ~15–24 di B. Il rischio si sposta sulla
semantica del runner (ordine degli eventi, `mp_potential_step`, collisioni),
da documentare e testare caso per caso. **In attesa di conferma.**

---

## Cosa è verificato e cosa no

- Verificato: tutti i numeri sopra, prodotti da script che leggono gli XML e
  i PNG; il codice citato (`manager`, `mouser`, `resizer_manager`,
  `android_manager`, `enemy_manager`, `ally_warrior` Step/Create) letto riga
  per riga.
- **Non** verificato: nessuna esecuzione del gioco originale (non c'è un
  eseguibile né una build HTML5 nel repo); il comportamento del runner GMS
  (ordine degli eventi, `mp_potential_step`, conteggio degli alarm) è
  conoscenza del motore, da confermare caso per caso.

### 0.12 Campagna, sottomenu livelli e codici di sblocco

> **Superata da §0.14**: nella nuova esportazione la campagna c'è.

L'autore ricorda un pulsante **Campagna** nel menu che apre un sottomenu con
`lvl01` e altri livelli, e uno sblocco dei livelli con **codici
alfanumerici** rivelati alla fine del livello precedente.

**[C] In questa esportazione non c'è niente di tutto questo.** Cercato in
tutto il GML, negli script e nelle room: nessun `room_goto(lvl01)`, nessun
uso di `keyboard_string`/`get_string`/`keyboard_lastchar` (servirebbero per
digitare un codice), nessuna stringa "campaign"/"level"/"unlock"/"code"
nell'interfaccia. Il menu ha solo le due pillole "Survival - Demo" e "More
coming next - Work in progress". Le room sono 5, quindi **l'unico livello di
campagna esistente è `lvl01`**. **[C]** `lvl01` non ha condizione di
vittoria: in `manager` Step la vittoria (`victory_manager`) scatta solo se
`room=match`. **[?]** Se esiste un'altra versione del progetto con questa
parte, oppure se va progettata da zero come funzionalità nuova.

### 0.13 Cartella GMX

Decisione dell'autore: gli zip restano nel repo come fonte immutabile;
l'estrazione va in una cartella esclusa da git; `src/` (codice leggibile)
e `data/` (JSON) si versionano.

### 0.14 Seconda ricognizione: esportazione `AOE_TYPE`

L'autore ha cancellato i file vecchi su `main` e caricato l'esportazione
giusta: `AOE_TYPE(1).project.gmx` + zip (`sprites 1..6`, `sprites no img`,
`objects`, `rooms`, `scripts`, …). Unita nel branch con un merge. Stesso
metodo di §0.3: ricomposizione della struttura GMS 1.x fuori dal repo e
censimento con gli stessi script. **0 frame mancanti.**

**Numeri** [C] (fra parentesi la differenza con la vecchia esportazione):

| | |
|---|---|
| Oggetti | **347** (+44 nuovi, −12 tolti); 211 con parent, 0 fisica |
| Sprite | **1473** (+11), **1496 frame** |
| Room | **8**: `menu`, `test_ground`, `lvl01`, `lvl02`, `lvl03`, `match`, `resizer`, `mobile` |
| Script | **36** (+21), 1034 righe: difesa di aree, attacchi, flow field generale, movimento master/slave, `scr_draw_text_ext_safe` |
| Codice | **2244** blocchi GML (29.200 righe), 31 azioni drag & drop |
| Funzioni GML | **137** funzioni GameMaker distinte + 36 script (§1.1: il primo conteggio, 161, includeva le chiamate agli script); nuove (+32: `instance_activate_all`/`deactivate_all`, `string_*`, `chr`, `keyboard_check_pressed`, `ds_grid_copy`, `draw_text_transformed`, `instance_find`, …) |
| Font | 3, **tutti Seagram tfb**: `GUI_1` 16 grassetto, `overdue` 15, `gui_sblocco` 32 grassetto; solo ASCII (corretto in §1.1: prima avevo scritto Impact/Arial Narrow, che erano i font della vecchia esportazione) |
| Path | 2 |
| Suoni, shader, timeline, salvataggi | ancora **nessuno** |

Nuovi: 23 oggetti `dialogo_1_*`/`dialogo_2_*` (dialoghi in partita, ~100
stringhe), `enemy_manager_lv2`, `directioner`, `aggr_assign`/`def_assign`/
`atk_signal` (IA a punti di difesa), oggetti `*_morente` (distruzione
animata di rovine, alberi, miniere, pietre). Tolti, fra gli altri,
`ally_warrior_sperimentale`, `croo11`, `rectangle_manager`.

**Room** [C]:

| Room | Dimensione | Istanze | Note |
|---|---|---|---|
| `menu` | 7000×3000 | 182 | **ora è la prima room**, quindi quella di avvio [I per la regola di GMS] |
| `test_ground` | 2000×2000 | 17 | prova: 11 guerrieri e 4 case nemiche; nessun `room_goto` ci porta |
| `lvl01` | 5000×5000 | 564 | campagna 1 |
| `lvl02` | 3200×8000 | 475 | campagna 2 |
| `lvl03` | 8000×8000 | **0** | vuota |
| `match` | 7000×7000 | 460 | ora si chiama "Play the tutorial" nel menu |
| `resizer`, `mobile` | | | come prima, irraggiungibili dal flusso normale |

**Flusso** [C, `enemy_manager_menu`]: il menu ha due pulsanti, **"Play the
tutorial"** → `match` e **"Campaign - Collapse"** → sottomenu (variabile
`global.campagna=1`, stessa room). Il sottomenu disegna la mappa
`mappa_camp` (1597×1597), l'elenco dei 10 livelli a sinistra, la storia del
livello sotto, un pulsante indietro e un lucchetto:

1. Shove the sun aside → `lvl01`
2. A long walk → `lvl02`
3. The monastery · 4. Crossing a bridge · 5. The siege · 6. One hundred
   towers · 7. Our old gods · 8. Escape from the city · 9. Allies ·
   10. The last day → **solo titolo**: nessun `room_goto`, nessuna room
   (`lvl03` esiste ma è vuota).

Il livello *n* compare in elenco solo se `global.unlock > n-1`.

**Codici di sblocco** [C]: il lucchetto apre una **combinazione di 5 cifre**
(rotelle 0–9 con frecce su/giù), **solo numeri**, non alfanumerici. Nove
codici scritti nel codice, uno per i livelli 2–10. Un codice sbagliato fa
lampeggiare le cifre di rosso (`redamount`). La schermata di vittoria
(`victory_manager`) mostra il codice del livello successivo e porta
`global.unlock` al valore giusto. I codici restano qui solo come
riferimento al file: `enemy_manager_menu/Mouse_56`.

**Vittoria per livello** [C]:

- `match`: distruggere le 3 basi (come prima).
- `lvl01`: una catena di 4 "porte" in `manager` Step
  (`global.lvl01_gate` 0→4): arrivare con un'unità vicino a (4550,4150),
  poi (593,552), poi (4836,331) entro 800 e poi entro 200 px; ogni porta dà
  oro, crea edifici o un dialogo; l'ultimo dialogo (`dialogo_1_8`), quando
  viene chiuso, crea `victory_manager`.
- `lvl02` (`enemy_manager_lv2`): liberare i prigionieri di 7 aree difese
  (`def_point_id` 110–170). La vittoria richiede le aree 1–6 e **nessun
  edificio nemico**; l'area 7 non conta. **[?]** Svista o voluto.

**Difetti e residui di test trovati** [C]:

- `enemy_manager_menu` Create imposta **`global.unlock=2` ogni volta che si
  apre il menu**: il livello 2 è sempre sbloccato e lo sblocco del 3 (dato
  dalla vittoria di `lvl02`) si perde al ritorno nel menu. Con i salvataggi
  JSON lo sblocco va reso persistente e il valore iniziale va a 1.
- `manager` Create ha ancora risorse di test: cibo 10000, oro 5000, legno
  5000, pietra 0, **`popcap=990`**. Le risorse giuste sono quelle dette
  dall'autore (§0.10: 100/50/50/0); **[?]** il `popcap` iniziale.
- `show_debug_overlay(true)` è ancora attivo.
- `victory_manager` in `match` scrive `"…score is "+score`: in GMS 1.x sommare
  stringa e numero è un errore di runtime; **[I]** nell'export HTML5
  JavaScript diventava una concatenazione. Nel porting: concatenazione.

**Altre novità** [C]:

- **Menu di pausa** (`mouser`): pulsante pausa con Riprendi, Ricomincia,
  Menu, Suggerimenti on/off, Obiettivi on/off, FPS on/off; la pausa usa
  `instance_deactivate_all`.
- **Modalità debug**: la sequenza ← → D D ← → (ogni tasto entro 30 tick
  dal precedente) attiva `global.debugging`, che disegna la griglia dei costi
  del flow field. I trucchi delle risorse ci sono ancora (V+Alt+F/Q/S/W/P);
  Alt+V+Q ora ferma anche la pioggia.
- Nebbia e notte: ancora **tre superfici grandi come la room**
  (`manager` Draw End): in `match` ~590 MB, in `lvl03` 8000×8000 sarebbero
  ~770 MB.
- Il titolo della pagina HTML5 è ora "535 - Mount Fuji Software".

**Asset** [C, misurati]: memoria texture ritagliata **236 MB** (+10 MB per
`mappa_camp`); per room, da 200 MB (`resizer`) a 228 MB (`match`). Peso:
PNG 59,9 MB, **WebP q85 11,4 MB**. Le conclusioni di §0.8 non cambiano.

**Architettura**: la nuova versione ha più codice (29.200 righe contro
23.500) e più funzioni (161 contro 129), ma lo stesso vocabolario di base.
La raccomandazione **A** di §0.11 vale ancora di più: la campagna, i
dialoghi, la pausa e la combinazione sono interfaccia disegnata a mano con
coordinate fisse, che si porta per traduzione molto meglio che riscrivendola.

### 0.15 Decisioni dell'autore sulla seconda ricognizione

- **`popcap` iniziale = 0** (cresce con case e centri, come dice il commento
  di `manager` Create). Risorse iniziali 100/50/50/0 come in §0.10.
- **Area 7 di `lvl02`**: l'autore non ricorda il dettaglio; se l'area era
  prevista, deve contare per la vittoria. **[?]** Da verificare leggendo
  `scr_area_difesa`/`scr_difendi` e la room `lvl02` in Fase 1: se l'area 170
  ha davvero difensori e prigionieri come le altre, si aggiunge `l7=1` alla
  condizione di vittoria (deviazione dichiarata dall'originale).
- **Livelli 3–10**: visibili nell'elenco come "in arrivo". Vanno progettati
  e implementati insieme all'autore **prima della release**.
- **Si tolgono** `test_ground`, `resizer`, `mobile`.
- **Font**: si sostituisce anche `gui_sblocco` (Seagram tfb), insieme a
  Impact e Arial Narrow.
- **Architettura: B, porting mirato** (decisione dell'autore): "non ho
  fretta, preferisco una cosa fatta bene, che ci lasci più libertà". La
  logica si riscrive a mano in moduli JS per sistema, come NIMBUS, citando
  in ogni modulo file ed evento d'origine; il GML estratto in `src/` è la
  specifica, non codice da eseguire.
- **Niente strumento di reimportazione** da GameMaker: l'autore non userà
  più l'editor di room di GMS; le room nuove le disegnerà in un altro modo
  (formato da concordare quando arriveremo ai livelli 3–10).

---

## Fase 1 — pipeline di estrazione (5 ottobre 2026)

### 1.1 Strumenti

| Tool | Cosa fa |
|---|---|
| `tools/01_unpack.py` | zip alla radice → `gmx/` nella struttura standard GMS 1.x (esclusa da git); verifica che ogni frame citato esista |
| `tools/02_extract.py` | `gmx/` → `data/*.json`, `data/rooms/<room>.json`, `src/objects/<oggetto>/<Evento>.gml`, `src/scripts/*.gml` |
| `tools/03_survey.py` | censimento dai dati estratti, `data/functions.json`, controllo di coerenza |
| `tools/gmx.py` | nomi di eventi e tasti, resa delle azioni drag & drop |

**Verificato** (eseguendo i tool su questa esportazione):

- `01_unpack.py`: 3524 file, 1473 sprite, **0 frame mancanti**.
- `02_extract.py`: 347 oggetti, 1783 eventi, 36 script, 8 room.
- `03_survey.py`: **0 blocchi di codice** degli XML non ritrovati identici
  (riga per riga) nei `.gml` di `src/`. I numeri coincidono con §0.14,
  con due correzioni: i font sono tutti Seagram tfb; le funzioni GameMaker
  distinte sono 137 (il 161 di §0.14 contava anche i 36 script e qualche
  chiamata `action_*`).

**Formato di `src/`**: un file per evento, nome stabile (`Create`,
`Alarm_3`, `Step_End`, `Draw_GUI`, `Mouse_GlobalLeftReleased`,
`Collision_<oggetto>`, `KeyPress_Delete`, …). Ogni azione ha un commento
`// --- azione N: ...`. Le azioni "execute code" con *applies to* diverso
da `self` diventano `with (other) { ... }`; le domande drag & drop
(`action_if_variable`) diventano `if (...) { ... }` annidati, con
`other.` davanti alla variabile quando la domanda si applica a `other`.
**[I]** Questa equivalenza è la semantica dell'editor GMS 1.x, non letta nei
sorgenti; nel progetto riguarda solo 31 azioni (15 domande, 6
`action_potential_step`, 5 `action_sprite_set`, 2 `action_move`,
1 `action_set_motion`, 1 `action_if_dice`, 1 `action_set_cursor`).

### 1.2 Area 7 di `lvl02` — verificata

**[C]** `enemy_manager_lv2` Create definisce 7 aree con
`scr_area_difesa(...)`, che assegna `role=10` e `def_point_id` ai nemici
dentro il rettangolo. Contando le istanze di `data/rooms/lvl02.json` per
area: 110 → 5 picchieri; 120 → 21 picchieri; 130 → 8 misti; 140 → 6;
150 → 12 cavalieri; 160 → 13 arcieri; **170 → 12 arcieri**. Quando l'area
170 è libera, Step crea 2 civili e `dialogo_2_12` come per le altre. È
un'area vera: secondo la decisione dell'autore (§0.15) **nel porting conta
per la vittoria** (`l7=1` aggiunto alla condizione). Deviazione
dall'originale, dichiarata.

**[I] Difetto collegato**: in `enemy_manager_lv2` Step, `l6exists` è
dichiarata con `var` solo dentro `if l6=0 { ... }`, ma viene letta più sotto
(`if l6exists = true`) anche quando `l6=1`. In GMS 1.x leggere una
variabile locale mai assegnata è un errore di runtime; nell'export HTML5
probabilmente dava `undefined`, cioè falso. Da decidere quando si porta
`lvl02`: l'effetto voluto sembra "se l'area 6 è libera, ferma la caserma
che crea difensori".

### 1.3 Semantica di GameMaker che il porting deve rispettare

Sono regole del **runner** GMS 1.x, non del gioco: vengono dalla
conoscenza del motore e sono quindi **[I]** finché non le confermiamo con
un test (in GameMaker, se l'autore può, o confrontando il comportamento
atteso descritto dal codice). Per ognuna: perché conta qui, con le prove
lette in `src/` **[C]**.

**Ordine di un passo (60 al secondo in tutte le room [C]).**
Begin Step → Alarm → Keyboard/KeyPress/KeyRelease → Mouse → Step →
applicazione del moto (`x += hspeed`, `y += vspeed`, da `speed`/`direction`)
→ Collision → End Step → Draw Begin/Draw/Draw End (per depth) →
Draw GUI Begin/GUI/GUI End. Conta perché le unità impostano `speed` e
`direction` in Step (`speed=` 94 volte) e il moto si applica dopo; i
contatori di tempo (`global.seconds` in `manager` Alarm_8, riarmato a 60)
e tutte le durate sono in passi, non in millisecondi.

**Alarm.** Ogni passo gli alarm >0 scendono di 1; quando arrivano a 0
l'evento parte e l'alarm diventa -1. `alarm[n]=1` quindi scatta al passo
dopo; `alarm[n]=0` o un valore negativo non fanno partire niente. Il codice
usa `alarm[3]=-1` come "spento" e lo confronta (`enemy_caserma`,
`scr_controller_crea_difensori`: `if role=10 && alarm[3]=-1`) [C]; 4
istruzioni fanno `alarm[n]+=`. Molti comportamenti sono **catene di
alarm** a passi fissi: per esempio l'attacco in mischia (`ally_warrior`
Alarm_2: tre fasi da 13 passi, il colpo alla terza → un colpo ogni 39
passi, 0,65 s) [C].

**Creazione e distruzione.** `instance_create` esegue subito il Create
della nuova istanza e poi restituisce l'id, quindi
`with instance_create(...) {defender=1}` (forma usata in `manager` Step per
i presidi) agisce *dopo* il Create [C per l'uso]. `instance_destroy()`
esegue subito il Destroy; il codice dello stesso evento dopo la chiamata
continua a girare (535 chiamate, spesso seguite da altre istruzioni). Al
cambio di room le istanze non persistenti spariscono **senza** Destroy;
gira invece Room End (22 oggetti hanno `Other_RoomEnd`) [C per l'uso].

**`with` e `other`.** `with (oggetto)` gira su tutte le istanze di
quell'oggetto **e dei suoi figli** (`with(enemy_unit)`, `with(ally_build)`,
`with(natural_parent)`…); dentro, `other` è chi ha chiamato. Nelle
collisioni `other` è l'altra istanza. Le variabili `var` sono locali allo
script/evento e si vedono anche dentro il `with`: il gioco ci conta, per
esempio `var io_x=x` letto dentro `with` in `enemy_warrior` Alarm_2 [C].
L'ordine di visita del `with` non è garantito dalla documentazione; il
porting userà l'ordine di creazione.

**Ereditarietà.** Un figlio senza un evento usa quello del parent; se ce
l'ha, il parent non gira (nessuna chiamata a `event_inherited` in tutto il
progetto [C]). `instance_nearest`, `instance_number`, `place_meeting` ecc.
su un parent contano anche i figli.

**Solidi e collisioni.** 107 oggetti sono `solid` [C], **comprese tutte le
unità**, gli edifici, alberi, montagne, fiumi, statue. In GMS, se due
istanze collidono e una è solida, quella che si muove torna alla posizione
precedente **prima** dell'evento Collision. `place_free(x,y)` è vero se in
quel punto la maschera non tocca nessun solido (`place_free` 53 volte,
per esempio "se il posto dove fermarsi è occupato, sposta il bersaglio").
Le maschere: rettangolo dalla bbox (1412 sprite), precise per pixel (34:
edifici, fiumi, montagne), ellisse (12), rombo (15); `maskName` sostituisce
lo sprite per le collisioni (195 oggetti).

**Distanze.** `instance_nearest(x,y,obj)` misura fra le origini e **può
restituire l'istanza stessa** se è di quel tipo [I, da verificare: qui è
quasi sempre chiamata su un tipo diverso da sé, p.es. un alleato che cerca
`enemy_unit`]. `distance_to_object(obj)` misura fra le **bbox** delle
maschere, non fra le origini (184 chiamate) [I].

**Movimento.** `mp_potential_step(x,y,passo,solo_solidi)` avanza di `passo`
verso il punto aggirando i solidi; `mp_potential_settings(30,3,3,true)`
[C, `ally_warrior` Step] = gira al massimo di 30° per passo, prova
direzioni ogni 3°, guarda 3 passi avanti, può ruotare sul posto. L'algoritmo
interno non è documentato nel dettaglio: il porting ne farà
un'approssimazione con lo stesso contratto, verificata a occhio contro il
comportamento atteso. Le unità usano però soprattutto il **flow field** degli
script (`scr_generate_goal_field`, `scr_generate_flow_field`,
`scr_move_flow_field`, griglia da 32 px) [C].

**Depth.** Profondità più alta = disegnata prima. Le unità fanno
`depth=-y` ogni passo (196 volte) [C]; a pari depth l'ordine non è
garantito.

**Viste e mouse.** `mouse_x/mouse_y` sono in coordinate di room attraverso la
view 0; Draw GUI è in coordinate dello schermo. La view che "segue" un
oggetto (`mouser`, bordo 32 px) si sposta per tenerlo dentro i bordi, senza
uscire dalla room. Mouse Enter/Leave e gli eventi "sull'istanza"
(LeftReleased, RightReleased…) usano la maschera dell'istanza sotto il
puntatore; gli eventi Global no.

**Numeri, condizioni, testo.** In GML 1.x i numeri sono double; una
condizione è vera se il valore è **> 0,5**; `=` dentro `if` è un
confronto; `div` (188 volte) è la divisione intera. In `draw_text`, `#`
va a capo (il progetto lo usa solo in `scr_draw_text_ext_safe` [C]).
Stringa + numero è un errore in GMS 1.x desktop (`progression+"%"` in
`caserma`/`centro`/`stalla` Draw_GUI e `"…score is "+score` in
`victory_manager`): nell'export HTML5 era una concatenazione JavaScript, e
così farà il porting [I].

**Variabili mai assegnate.** Il config ha `option_variableerrors=False`
[C]. **[?]** Effetto esatto su questa build; in pratica nell'export HTML5 una
variabile mai assegnata valeva `undefined` e i confronti davano falso. Il
porting inizializza esplicitamente e segnala i casi (vedi §1.5).

**Particelle.** Un `part_system` si disegna da solo alla sua depth;
`part_emitter_stream(ps,em,tipo,n)` emette n particelle a passo (se n<0, una
con probabilità 1/|n|); `pt_shape_flare` è una texture interna di
GameMaker da ricreare [I].

**Pausa.** `instance_deactivate_all(true)` (`mouser`, menu di pausa) toglie
tutte le altre istanze da eventi, `with` e disegno, finché
`instance_activate_all()` [C per l'uso].

### 1.4 Tabelle numeriche

Estratte da `tools/04_tables.py` (→ `data/tables.json`) e **confermate
leggendo i file citati** [C], salvo dove marcato.

**Unità** [C, `Create` delle unità + clicker]:

| Unità | Vita | Popolazione | Costo | Dove si crea | Tasto |
|---|---|---|---|---|---|
| Civile (`ally_omino`) | 50 | 1 | 50 cibo | centro | Q |
| Guerriero (`ally_warrior`) | 75 | 2 | 75 cibo, 35 oro | caserma | Q |
| Picchiere (`ally_picchiere`) | 60 | 2 | 55 cibo, 45 legno | caserma | W |
| Arciere (`ally_arciere`) | 55 | 2 | 55 oro, 40 legno | caserma | E |
| Cavaliere (`ally_cavaliere`) | 90 | 3 | 50 cibo, 70 oro | stalla | Q |
| Catapulta (`ally_catapulta`) | 100 | 3 | 200 legno, 100 oro | castello | W |
| Ariete (`ally_ariete`) | 125 | 3 | 250 legno, 60 oro (**30** col tasto, §1.5) | castello | Q |

I nemici hanno la stessa vita (75/60/55/90/100/125) e non usano popolazione.

**Danno in mischia** [C, Alarm_2 di ogni unità]. Il bersaglio si riconosce
dalla sua **vita massima** `slife` (75 guerriero, 60 picchiere, 55 arciere,
90 cavaliere, 100 catapulta, 125 ariete, 50 civile; 100 è anche il campo),
non dal tipo di oggetto. Un colpo ogni 39 passi.

| Attaccante ↓ / bersaglio → | Guerr. | Picch. | Arciere | Caval. | Catap. | Ariete | Civile |
|---|---|---|---|---|---|---|---|
| Guerriero | 7 | 7 | 15 | 4 | 7 | 7 | 5 (solo nemico) |
| Picchiere | 3 | 3 | 5 | 8 | 3 | 3 | 5 (solo nemico) |
| Cavaliere | 5 | 3 | 22 | 5 | 5 | 5 | 8 (solo nemico) |

**Danno a distanza** [C]: freccia (`arciere_bullet`, anche quella di
torre/castello/centro `arciere_bullet_t`): 6 a guerriero/picchiere/arciere,
4 al cavaliere, 3 a catapulta/ariete, 5 al civile (solo frecce nemiche).
Catapulta (`catapulta_bullet` Destroy): **40** all'edificio o all'unità nel
punto d'impatto. Ariete (Alarm_2, 4 fasi: 30+13+13+13 passi): **50** agli
edifici, 5 se `slife=100` (il campo).

**Edifici** [C, Create + placer]:

| Edificio | Vita | Costo | Effetto | Tasto |
|---|---|---|---|---|
| Centro | 400 | — | +10 popcap; crea civili | — |
| Casa | 120 | 50 legno | +10 popcap | Q |
| Campo | 100 | 200 legno | cibo con un civile | R |
| Mulino (`barn`) | 150 | 60 legno | deposito cibo | E |
| Magazzino | 140 | 70 legno | deposito | W |
| Caserma | 350 | 150 legno | guerriero/picchiere/arciere | D |
| Stalla | 380 | 170 legno | cavaliere | F |
| Castello | 900 | 850 pietra | catapulta/ariete, presidio 4 arcieri | G |
| Chiesa (monastero) | 300 | 50 legno, 150 pietra | cura | T |
| Torre | 330 | 200 pietra | presidio 2 arcieri | A |
| Mura | 800 | 50 pietra (+40 per tratto aggiunto [I], `mplus_*`/`oodl`…) | | S |
| Porte | 600 (orizz.) / 800 (vert.) | 100 oro | | Q |

**Popolazione** [C]: `manager` Step taglia `global.popcap` a **99** a ogni
passo, quindi il massimo reale è 99 (anche con il trucco +1000).

**Tempi di produzione** [C per caserma, centro, stalla; [?] castello]: la
barra va da 1 a 100, un punto per scatto di `alarm[0]`: caserma 1 passo
(≈100 passi, 1,7 s), centro 10 passi (≈1000, 17 s), stalla 12 passi
(≈1200, 20 s). Coda di 6 posti. Un'unità esce solo se
`global.pop+1 < global.popcap`.

Risorse limitate a 9999 (cibo, legno, oro; **non la pietra**) [C, `manager`
Step].

### 1.5 Difetti e incongruenze trovati nell'originale

Da decidere caso per caso con l'autore quando si porta il sistema; il
porting li **segnala nel commento** e per ora riproduce l'originale, salvo
dove l'autore ha già deciso.

1. **Ariete**: 60 oro dal pulsante (`ariete_clicker` Step) ma **30** col
   tasto Q (`KeyPress_Q`) [C].
2. **Annullare un picchiere** dalla coda della caserma restituisce 55 cibo
   e **45 oro** invece di 45 legno (`caserma_indietro_clicker`) [C].
3. **Popcap**: il centro dà +10 alla creazione ma toglie 5 alla
   distruzione; castello e torre tolgono 5 alla distruzione senza averli mai
   dati [C].
4. **`ally_warrior` Alarm_2** legge `io_x`/`io_y` dentro `with` senza
   averle dichiarate (la versione nemica le dichiara con `var`) [C]:
   la "fuga" di catapulta/ariete colpiti dal guerriero alleato usa valori
   indefiniti.
5. **`ally_warrior` Collision_b_arciere_bullet**: `warwark!=4`, refuso
   per `warwork` [C].
6. **`enemy_manager_lv2` Step**: `l6exists` letta quando non è assegnata
   (§1.2) [C].
7. **Codice morto**: i proiettili di mischia (`warrior_bullet`,
   `picchiere_bullet`, `cavaliere_bullet` e le versioni nemiche,
   `ariete_bullet`, `enemy_ariete_bullet`, `build_bullet`) non li crea
   nessuno: il danno in mischia è nell'Alarm_2 delle unità [C, nessun
   `instance_create` che li citi].
8. **Prestazioni**: ogni unità militare crea nel Create **una propria
   griglia di flow field** grande come la room (in `match` 218×218 celle) e
   la ricalcola a ogni ordine (`scr_generate_goal_field` +
   `scr_generate_flow_field`) [C]. Nel porting si condivide un campo per
   destinazione.

### 1.6 Conferme e decisioni dell'autore sulla Fase 1

**Mischia e raccolta col "versore"** (spiegazione dell'autore, coerente con il
codice [C]): all'inizio il danno passava da oggetti proiettile che
collidevano; essendo le collisioni pesanti, l'autore è passato a prendere
l'istanza più vicina al punto **30 px davanti all'unità nella direzione
d'attacco**: `instance_nearest(x+30*cos(degtorad(direction)),
y-30*sin(degtorad(direction)), bersaglio)`. Stesso schema per la raccolta
in `ally_omino` Alarm_2: alberi (`wood-=2` per colpo, 150 per albero),
miniere d'oro (`gold-=1`, 2500), pietre (`stone_parent`, `stone-=1`; 850
la grande, 450 la piccola). I proiettili di mischia di §1.5 n.7 sono i resti
del primo approccio: **non si portano**.

**Difetti di §1.5: l'autore li conferma tutti e vanno corretti** nel porting.
Ogni correzione sarà marcata nel codice come deviazione dall'originale:

1. Ariete: **60 oro** anche col tasto Q.
2. Annullare un picchiere restituisce **55 cibo e 45 legno**.
3. Centro distrutto: **−10** popcap (quanto ha dato). Castello e torre: **niente
   −5** alla distruzione, visto che non danno popolazione (nessun testo
   dell'interfaccia lo dice). [Scelta mia fra le due correzioni possibili, da
   confermare con l'autore.]
4. `ally_warrior` Alarm_2: `io_x`/`io_y` dichiarate con `var` prima del
   `with`, come nella versione nemica.
5. `warwark` → `warwork`.
6. `lvl02`: "area 6 libera" calcolata sempre, non solo quando `l6=0`.
7. Proiettili di mischia: non portati.
8. Flow field condiviso per destinazione invece di una griglia per unità.

---

## Fase 2 — asset e budget (5 ottobre 2026)

### 2.1 Atlas (`tools/05_atlas.py`)

Gruppi dalle cartelle di sprite dell'autore, ognuno con un **tier di
caricamento** e una **scala**. Frame ritagliati sull'alpha, MaxRects in
pagine 2048×2048 (l'ultima di ogni gruppo ritagliata al contenuto), 2 px di
bordo ripetuto contro le sbavature del filtro lineare, WebP q85 con alpha
senza perdita; `gui` interamente senza perdita. Il motore caricherà le
pagine con **alpha premoltiplicato** (l'RGB dei pixel trasparenti, alterato
dalla compressione, così non conta: è il difetto degli aloni visto in
NIMBUS). Esclusi 42 sprite che non vengono mai disegnati (solo maschere di
collisione o mai citati).

**Budget misurato** (memoria GPU = pagine × larghezza × altezza × 4):

| Gruppo | Tier | Scala | Frame | Pagine | GPU MB | WebP MB |
|---|---|---|---|---|---|---|
| gui | core | 1 | 74 | 1 | 2,2 | 0,1 |
| campagna | menu | 1 | 4 | 1 | 12,4 | 0,4 |
| terreno (natura ≥ 512 px) | gioco | **0,5** | 34 | 2 | 33,0 | 1,9 |
| ambiente | gioco | 1 | 42 | 1 | 5,5 | 0,2 |
| edifici | gioco | 1 | 92 | 2 | 25,7 | 0,9 |
| alleati | gioco | 1 | 662 | 3 | 39,9 | 2,4 |
| nemici | gioco | 1 | 510 | 2 | 33,6 | 2,0 |
| citta | citta | 1 | 28 | 1 | 15,3 | 0,6 |
| **totale** | | | | **13** | **167,5** | **8,5** |

In partita (senza `campagna`) ~155 MB; nel menu ~152 MB (serve tutto tranne
`citta`). Contro l'originale: 236 MB di sprite ritagliati + **~590 MB** di
superfici di nebbia e notte in `match`.

**Verifiche fatte** (script di controllo, non versionato):

- Ricostruendo 203 sprite (200 a caso + i 3 più grandi) dalle pagine WebP e
  confrontandoli con i PNG originali: alpha **identico** (errore 0),
  rettangoli dell'atlas **senza sovrapposizioni**.
- Errore RGB medio per gruppo con q85, su sfondo nero dopo
  premoltiplicazione: terreno 1,0/255, campagna 1,7, edifici 1,9, ambiente
  1,9, nemici 2,2, alleati 2,3, città 3,8; massimo 5,4 su singoli sprite.
  Le icone `gui` arrivavano a 8,8/255 (bordi netti): per questo `gui` è
  senza perdita.
- **Non verificato**: l'aspetto a schermo nel motore (il motore non c'è
  ancora).

**Scala del terreno: decisione dell'autore in sospeso.** Confronto a 1:1
fatto con le immagini originali (riduzione Lanczos, poi ingrandimento
bilineare come fa la GPU): a 0,5 si perde la **grana della carta** delle
texture e i contorni neri si ammorbidiscono; a 0,75 la grana resta quasi
tutta. Costi: 0,5 → 167 MB totali; 0,75 → ~200 MB; 1,0 → ~255 MB, e
`montagna10` (2342 px) non entra in una pagina 2048: servirebbero pagine
4096 per il terreno.

### 2.2 Maschere (`tools/06_masks.py`)

Dai PNG originali, a risoluzione **piena** anche per il terreno scalato:
tipo (rettangolo/precisa/ellisse/rombo) e bbox per tutti i 1473 sprite,
bitmap RLE per le 34 precise. `game/assets/masks.json`: 0,3 MB.

**Verifica della regola GMS** "pixel pieno = alpha > tolleranza, unione dei
frame se le maschere non sono separate" (§1.3, [I]): ricalcolando il bbox
automatico dai PNG, coincide con quello salvato nel GMX per **1471 sprite su
1473**. Le due eccezioni: `cr1` (bbox salvato largo 652 su un'immagine larga
625: resto di una versione precedente dell'immagine) e `null` (sprite vuoto).
Il porting usa i bbox del GMX, cioè quelli che usava il gioco.

### 2.3 Font

**[C]** I tre font sono **Seagram tfb**, un gotico (blackletter). Rasterizzati
solo per ASCII 32–127. Da sostituire con un font libero (decisione §0.15) e
con le lettere accentate, per la localizzazione. Candidati OFL dello stesso
genere: **Grenze Gotisch** (gotico leggibile, più pesi, latino esteso),
**Pirata One**, **UnifrakturMaguntia**. Scelta dell'autore in sospeso.

### 2.4 Escluso per ora

- **Texture compresse (KTX2 ETC2/ASTC)**: con il solo desktop e 155 MB in
  partita non servono; richiederebbero un transcoder WASM (dipendenza nuova).
- **Mipmap**: lo zoom dell'originale va da 1,0 a 1,5 (si allontana al
  massimo di 1,5×): senza mipmap l'aliasing è minimo. Da rivalutare se si
  allarga lo zoom.

### 2.5 Decisioni dell'autore e motore (5 ottobre 2026)

**Decisioni**: terreno a **scala 1** ("gira solo su PC, per 55 MB non muore
nessuno"): pagine 4096 per il gruppo terreno, **265 MB** di GPU in tutto,
10,3 MB su disco. **Font: resta Seagram tfb** (l'autore dovrebbe averne la
licenza): si usano le bitmap rasterizzate da GameMaker (solo ASCII 32–127;
le lettere accentate per altre lingue restano un limite noto).

**`tools/07_scene.py`** prepara le room per il motore
(`game/assets/rooms/`): menu, match, lvl01, lvl02. Per ogni oggetto: sprite
iniziale o scelte casuali del Create (alberi `alb1..alb8`, case nemiche
`c1b..c6b` [C]), depth fissa o `-y+k`, niente disegno automatico se c'è un
evento Draw proprio [I], e **oggetti rivelati dalla nebbia** [C, `albero`
Step: `visible=true` quando un'unità è vicina]: alberi, rovine, pietre
partono invisibili; l'anteprima li mostra.

**Motore (`game/src/`)**, primo passo, solo anteprima delle room:

| Modulo | Cosa fa |
|---|---|
| `gl.js` | WebGL2, un solo shader, quad a lotti con l'indice di texture nel vertice (16 unità: tutte le pagine legate insieme), alpha premoltiplicato, riconoscimento del rendering software (`failIfMajorPerformanceCaveat` + nome del renderer) |
| `assets.js` | atlas per tier, 3 pagine alla volta, `createImageBitmap` premoltiplicato e chiuso dopo il caricamento, controllo di `MAX_TEXTURE_SIZE`, ricaricamento dopo la perdita del contesto, scarico di un gruppo |
| `sprites.js` | `draw_sprite_ext`: origine, ritaglio, scala, rotazione antioraria, colore e alpha |
| `scene.js` | anteprima statica: istanze in ordine di depth (a pari depth, ordine di creazione), sfondi ripetuti, scarto di ciò che è fuori dalla view, `image_speed` 1 di default [I] |
| `camera.js` | view = finestra in px CSS × `scaleview` (1,0–1,5), inseguimento del puntatore con i bordi della room |
| `input.js` | mouse e tastiera fotografati a ogni passo (premuto/tenuto/rilasciato), codici tasto di GameMaker |
| `loop.js` | passo fisso alla velocità della room (60), massimo 5 passi per frame, tetto 30/60 fps, pausa con la pagina in background |
| `renderscale.js` | risoluzione dinamica 0,5–1,0 se i frame arrivano lenti |
| `diag.js` | pannello F3: GPU, fps, CPU per frame, chiamate di disegno, memoria texture, canvas, view |
| `settings.js`, `i18n.js` | opzioni in localStorage con versione e try/catch; testi del motore in inglese e italiano |

**Verificato in Chromium headless (Playwright, rendering software
SwiftShader)**, room `match` e `menu` a 1600×900 e 1280×720:

- nessun errore in console, nessuna risposta ≥ 400;
- **1 chiamata di disegno** per frame (72 quad visibili);
- memoria texture misurata dal motore: 227 MiB in `match`, 238 MiB nel menu
  (coincide con il budget di §2.1 meno i gruppi non caricati);
- il rendering software viene riconosciuto e compare l'avviso;
- posizioni, ordine di profondità e sfondo ripetuto corretti a occhio
  sugli screenshot (alberi davanti/dietro, edifici, battaglia del menu);
- puntatore nell'angolo in basso a destra per 1 s → la view scorre; frecce
  → 10 px a passo; X → `scaleview` 1,2 e poi si ferma a 1,5;
- perdita del contesto (`WEBGL_lose_context`): il ciclo si ferma, al
  ripristino ricarica le 12 texture e torna a disegnare.

**Non verificato**: prestazioni su una GPU vera (in headless gira in
software, 11–15 fps: non è un dato utile), resa su schermi ad alta densità,
Firefox e Safari.

**[?] Velocità dello scorrimento ai bordi**: con la regola di GameMaker e
il bordo di `match` (`hborder` 80, `vborder` 40 [C]) la view si sposta ogni
passo di (bordo − distanza del puntatore dal bordo): fino a ~78 px a passo,
cioè ~4700 px/s col puntatore sull'ultimo pixel. È quello che l'originale
dovrebbe fare [I]; da confermare con l'autore.

---

## Fase 3 — vertical slice su `match`

Ordine concordato con l'autore: (1) manager e interfaccia, (2) selezione e
ordini, (3) civili, (4) combattimento, (5) nebbia e notte.

### 3.1 Punto 1: manager, interfaccia, font (5 ottobre 2026)

Decisioni dell'autore: lo scorrimento ai bordi **era così veloce** (resta
com'è); castello e torre **non danno popolazione** (si toglie il −5 alla
distruzione).

**Font e primitive**: i tre font bitmap di GameMaker e un quadratino bianco
sono nel gruppo `gui` dell'atlas (4,1 MB di GPU, 0,2 MB su disco): testo,
rettangoli, cerchi e linee passano dallo stesso lotto, senza texture in più.
`game/src/draw.js` riproduce lo stato e le funzioni di disegno usate dal
gioco (`draw_set_alpha/colour/font/halign/valign`, `draw_text(_ext)`,
`string_width/height(_ext)`, `draw_rectangle(_colour)`,
`draw_roundrect_colour_ext`, `draw_circle/ellipse/line/triangle_colour`,
`draw_sprite(_ext)`) per portare il codice di disegno riga per riga.
`bm_subtract` di GMS 1.x è (zero, 1 − colore sorgente), cioè scurisce
[I, documentazione del motore]: è come l'originale applica nebbia e notte.

**[?] Raggio degli angoli** di `draw_roundrect_colour_ext`: il porting usa
metà del valore passato (60 → angoli di raggio 30). Da confrontare con uno
screenshot dell'originale.

**`game/src/manager.js`** — porta di `manager` [C, src/objects/manager/]:

- Create: risorse **100/50/50/0, popcap 0** (decisione dell'autore, al posto
  dei valori di test), alarm 0 = 6000 (notte), 4 = 12000–15000 (pioggia),
  8 = 60 (orologio); `lvl01` parte di notte con `alarm[1]=100000`, `lvl02`
  di notte con `alarm[1]=1`.
- Step: tetti 9999 a cibo, legno, oro (non alla pietra), popcap ≤ 99,
  schermo nero iniziale che sfuma (`fogalpha` −0,02 a passo).
- Alarm: notte (rampa +0,005 a passo fino a 1, poi 2000 passi), giorno
  (rampa −0,005 fino a sotto 0, poi 4000), pioggia (solo lo stato
  `raining`: le gocce arrivano col sistema di particelle), orologio.
- Tastiera: frecce (10 px, 30 con Ctrl o Alt), X/Z zoom 1,0–1,5 (non nel
  menu; con Ctrl cambiano la scala della minimappa), M minimappa, O
  obiettivi, H suggerimenti, trucchi V+Alt+F/Q/S/W/P, Ctrl+V+Canc nebbia.
- Mouse: inizio/fine del rettangolo di selezione (`multi`, `startx/y`),
  pulsanti della minimappa.
- Draw GUI: minimappa (stesso ordine di famiglie e colori dei `with`
  dell'originale; rettangolo della view alto `view_hport/sz` come
  nell'originale, anche a zoom > 1), pannello risorse, civili inattivi,
  FPS se attivo, numero di selezionati; pulsanti di costruzione e di
  comportamento con il punto 2.

Ordine di un passo in `app.js`: alarm → tastiera → mouse → Step → la view
segue il puntatore (STUDIO.md §1.3).

**Verificato**:

- `npm test` (`game/test/manager.test.mjs`, 7 test, node --test, nessuna
  dipendenza): semantica degli alarm; risorse iniziali e tetti; ciclo
  giorno/notte misurato a passi (notte che comincia al passo 6000, rampa di
  ~200 passi, notte di ~2000, ritorno); `lvl01`/`lvl02` di notte; orologio;
  trucchi solo con V e Alt tenuti; zoom e scala della minimappa.
- Chromium headless su `match` 1280×720: pannello risorse con font Seagram
  e icone, contatore dei civili inattivi, minimappa con i pulsanti, schermo
  nero iniziale sparito dopo 50 passi, V+Alt+F e V+Alt+W → cibo 1100 e legno
  1050; nessun errore, nessun 404.

**Non ancora**: notte e nebbia disegnate (punto 5), gocce di pioggia
(particelle), aquila (alarm 3), suggerimenti (`hint_night`), controller dei
livelli e presidi di `match` (servono le unità).

### 3.2 Altri difetti trovati nel manager

9. **`manager` Step**: `if fogville=0 with(enemy) visible=true` legge la
   variabile d'istanza `fogville`, mai assegnata, invece di
   `global.fogville` [C]: il trucco "nebbia spenta" non rende visibili i
   nemici da qui.
10. **`KeyPress_Q`**: `part_system_destroy(rain)` e `global.raining=0` sono
    **fuori** dall'`if` del trucco [C]: ogni pressione di Q (anche come tasto
    di produzione) ferma la pioggia.
11. **`KeyPress_P`**: `alarm[4]=1` fuori dall'`if` [C]: ogni pressione di P
    fa ripartire la pioggia.

Riprodotti per ora (n.10 e n.11), segnalati nel codice; in attesa di
decisione dell'autore. Nota sul debug: in `KeyPress_D` i due `if` in fila
fanno passare `debug_code` da 2 a 4 con **una sola** pressione, quindi la
sequenza reale è ← → D ← → [C].

### 3.3 Punto 2: selezione, ordini, movimento (5 ottobre 2026)

Decisione dell'autore: i difetti n.9–11 si correggono ("era una mia esigenza
di test"): Q e P agiscono sulla pioggia solo col trucco attivo; il trucco
nebbia userà `global.fogville` (si applica con la nebbia, punto 5).

**Cosa c'è nelle room** [C, nuova esportazione]: `match` (tutorial) ha 1
cavaliere, 2 civili e 1 catapulta alleati; `lvl01` 3 guerrieri e 1
picchiere; `lvl02` 5 guerrieri, 3 picchieri, 2 cavalieri, 4 arcieri, 2
civili. Il punto 2 porta per intero il **cavaliere** (l'unità militare del
tutorial); civili, catapulta e le altre unità militari seguono nei punti 3 e
4 con le stesse fondamenta.

**Fondamenta nuove** (`game/src/`):

| Modulo | Cosa fa |
|---|---|
| `world.js` | istanze ed eventi nell'ordine di GMS (Begin Step, Alarm, tastiera, mouse, Step, moto, End Step; Draw per depth, Draw End, Draw GUI); ereditarietà degli eventi dai parent; `instance_place`, `place_free`, `position_meeting`, `collision_rectangle`, `distance_to_object`, `instance_nearest`; maschere rettangolo/ellisse/rombo/precise dai dati di `tools/06_masks.py`; griglia spaziale da 128 px |
| `pathing.js` | griglia dei costi, `scr_generate_goal_field`, `scr_generate_flow_field`, `scr_find_valid_cell_backwards`, `scr_find_free_spawn_right`, `scr_move`, `scr_move_flow_field`, `mp_potential_step` |
| `units.js` | cavaliere, cadaveri, `scr_movement_general` (il capo calcola il campo e lo passa ai selezionati), pezzi in comune (ciclo del passo, rettangolo di selezione, mischia col versore, barra della vita, scheda dell'unità) |
| `animTables.js` | generato da `tools/08_anim.py`: il blocco "Assegnazione sprite" di 13 unità e 13 cadaveri tradotto in modo meccanico in JS (si ferma con un errore su qualunque costrutto non previsto) |
| `gm.js` | `point_direction`, `lengthdir_x/y`, `irandom_range`, `div` |

Il cursore è lo sprite `cursore` dell'originale (mouser Create:
`action_set_cursor`), come cursore CSS. Il rettangolo di selezione (manager
Draw_End) e il cerchio luminoso sotto il puntatore (mouser Draw_End, blend
additivo) sono disegnati come nell'originale.

**Regole del runner applicate** [I, da §1.3 e nuove]:

- **Avvio della room**: prima esistono tutte le istanze della room, poi
  girano i Create nell'ordine del file, poi Room Start. Il gioco lo
  richiede: in `match` il manager è la prima istanza, ma nel suo Create
  scorre `with(ally_build)` per costruire la griglia dei costi.
- **Variabili mai assegnate = 0**: il cavaliere legge `selected`,
  `creation`, `foodx`, `goal_x`… che il suo Create non imposta (il Create
  del parent `ally` non gira, perché il figlio ne ha uno suo). Senza questa
  regola la selezione non funzionerebbe mai; coerente con
  `option_variableerrors=False` del config.
- `mp_potential_step` è un'approssimazione con lo stesso contratto
  (direzione verso il bersaglio, poi a destra e sinistra di 3° fino a 180°,
  3 passi di anticipo, rotazione massima 30° a passo): l'algoritmo interno di
  GMS non è documentato.

**Fatti trovati leggendo** [C]:

- La **maschera del cavaliere** (`cm73`) è un rettangolo manuale sui piedi:
  da 21 px sopra a 20 px sotto l'origine. Nell'originale l'unità si clicca
  alla base, non sul corpo; il porting fa lo stesso.
- `ally_warrior` **Alarm_11** non viene mai armato da nessuno: è una copia
  parcheggiata di movimento e attacco; quelli veri sono nello Step.
- Il clic destro passa prima dal manager (`scr_movement_general`: il
  selezionato con `ordo` più alto calcola il campo e lo copia agli altri),
  poi da ogni unità selezionata, che punta `dirox/diroy` al punto cliccato.
  Il manager viene prima di tutte le unità nell'ordine delle istanze in tutte
  le room (indice 0, oppure 527 in `lvl01` con le unità da 559).
- Se il punto d'arrivo non è libero, l'unità lo arretra di 50 px a passo
  verso di sé (Step azione 9): un clic dentro un edificio la fa fermare al
  bordo.

**Altri difetti trovati** (riprodotti e segnalati nel codice):

12. `ally_cavaliere` Step azione 11: il ricalcolo "destinazione occupata"
    passa `dirox` come x **e** come y a `scr_find_valid_cell_backwards` e non
    controlla `action=1` (il guerriero sì) [C].
13. `ally_unit` Keyboard_Escape (ereditato da cavaliere e altri): toglie la
    selezione e decrementa `global.sel` ma non `global.milsel` [C].

**Verificato**:

- `npm test`: 10 test (7 del manager + 3 del flow field: BFS a 4 direzioni
  con ostacoli, direzione verso la vicina più bassa con pareggi nell'ordine
  destra/sinistra/su/giù, `scr_find_valid_cell_backwards`).
- Chromium headless, `match` 1280×720: clic sull'origine del cavaliere →
  selezionato (`sel` 1, `milsel` 1), scheda "90 / 90" con i pulsanti
  attacco/difesa, cerchio e barra della vita; clic nel vuoto → deselezionato;
  rettangolo trascinato attorno → selezionato e resta tale al rilascio;
  click destro 400 px a destra → ci va a ~5 px a passo
  (5 × (1 − 0,36·|sin|)) con l'animazione `cm41/42/43` verso est e si ferma
  entro 10 px; click destro dentro un edificio → si ferma al bordo.
- `lvl02`: i due cavalieri ingaggiano da soli i guerrieri nemici entro 700
  px e li colpiscono (75 → 50 e 45: 5 a colpo, come la tabella di §1.4).
- Tutte e quattro le room si caricano senza errori in console.

**Provvisorio** (fino al punto 4): i nemici sono bersagli fermi con la vita
del loro Create, senza IA né morte; i pulsanti attacco/difesa sono
disegnati ma non ancora cliccabili. Gli alberi e le rovine sono visibili da
subito (la nebbia è il punto 5).

**Correzioni dopo il punto 2** (confermate dall'autore): difetto n.12 (il
cavaliere ora usa `diroy` nel ricalcolo) e n.13 (Esc decrementa anche
`global.milsel`; "mi stava facendo impazzire, ora ho capito di chi è la
colpa").

### 3.4 Punto 3a: civili e raccolta (5 ottobre 2026)

**Portato** (`game/src/civilians.js`, `buildings.js`): `ally_omino` per
intero tranne le parti di costruzione, riparazione, semina e campi (3b/3c,
segnaposto nel codice); `albero`, `albero_fake`, `miniera_oro`,
`pietra_grande`, `pietr_piccolo` e i loro `*_morente`; il Create del
`centro` (vita 400, +10 popcap, il `cc_barn` che lo rende deposito del cibo).

**Come funziona** [C]:

- Il **click destro su una risorsa** passa prima dall'evento "rilascio
  destro sull'istanza" della risorsa, che mette `woodwork/goldwork/
  stonework=1` ai civili selezionati (e la direzione di raccolta al centro
  selezionato); poi dal `GlobalRightReleased` del civile, che azzera i lavori
  che non corrispondono a cosa c'è sotto il puntatore e parte. L'ordine è
  quello degli eventi di GMS: tutti gli eventi "sull'istanza" prima dei
  globali (`world.js`, [I]).
- **Raccolta**: arrivato col bbox a meno di 20 px dalla risorsa (15 per la
  pietra) su una cella libera, il civile lavora; ogni 39 passi (3 × 13) col
  versore 30 px davanti: legno +2 (l'albero −2), oro +1, pietra +1. A 10 va
  al deposito più vicino (`ally_magazza`: centro o magazzino), scarica
  quando il bbox è a meno di 10 px, e torna alla risorsa più vicina.
- **Velocità**: 3 × (1 − 0,36·|sin|) a mani vuote, 2 quando porta qualcosa;
  l'arrivo senza lavoro è esatto (`x=dirox && y=diroy`).
- **Visibilità delle risorse**: alberi entro 600 px (o nebbia spenta col
  trucco), miniere e pietre entro 400 px da un'unità o un edificio alleato;
  una volta viste restano visibili. La pietra grande cambia sprite sotto 425.
- Le risorse esaurite lasciano un `*_morente` che sbiadisce in 40 passi, e
  liberano le celle della griglia dei costi.

**Difetti e residui trovati** [C]:

14. `ally_omino` Step azione 14: nel ricalcolo "destinazione occupata" crea
    un `legno_prizedrawer` (l'icona "+legno" che sale) a ogni ricalcolo:
    residuo di debug. **Non portato** (da confermare con l'autore).
15. `ally_omino` Step azione 10: se non ci sono depositi, il ramo della
    pietra azzera `goldwork` invece di `stonework`. Riprodotto.
16. `miniera_oro` e pietre, Create: la marcatura della griglia usa
    `collision_rectangle(..., id, true, true)`, che con `notme=true` esclude
    proprio l'istanza cercata e non marca nulla. Nessun effetto: le celle le
    marca già il Create del manager (tutti i `natural_parent`).

**Verificato** (Chromium headless, `match`, simulazione accelerata con
`__game.advance(n)`): civile selezionato col clic, click destro
sull'albero più vicino → cammina, taglia (`owo11`), a 10 legno prende lo
sprite del carico (`car51/53`), va al centro, scarica (legno 50 → 60),
riparte verso l'albero più vicino e ricomincia; popolazione 5/10
(cavaliere 3 + 2 civili; popcap 10 dal centro); nessun errore.

### 3.5 Punto 3b: costruzione (5 ottobre 2026)

**Portato** (`game/src/buildings.js`, `civilians.js`): pulsanti di
costruzione (`*_clicker`), piazzamento (`*_placer`), cantieri (`*_fond`) ed
edifici finiti per casa, magazzino, mulino (`barn`), caserma, stalla,
castello, chiesa e torre; il centro con la produzione di civili (coda fino
a 6, annulla, bandiera di raccolta); `omino_clicker`,
`centro_indietro_clicker`, `idle_clicker` (Spazio), i `*_blink` e i
`*_prizedrawer`; costruzione e riparazione del civile (Step azione 16,
Alarm_2 azioni 6 e 7). Il motore ha ora gli eventi di collisione, Draw GUI
End e `mouse_clear`.

**Le famiglie sono lo stesso codice** [C]: confrontando gli eventi delle 8
famiglie con i nomi normalizzati (famiglia, sprite, numeri, stringhe), le
differenze sono solo nei dati (costo, tasto, posizione del pulsante, vita,
fasi del cantiere, rimborso) più quelle elencate qui sotto. Per questo il
porting ha una tabella (`FAM`, `BUILT`) e un solo codice per tipo di
oggetto. Differenze vere:
- casa: 6 stili (`tipo`, tasto C durante il piazzamento), lo stile passa
  dal placer al cantiere all'edificio; il pulsante non si distrugge subito
  quando non ci sono più civili selezionati (alarm 0 a 1 passo); da
  tastiera controlla "un solo placer" come il clic;
- casa: i costruttori vanno al punto del cantiere (`posix`), le altre
  famiglie al punto del mouse quando scatta l'alarm del cantiere;
- `castello_clicker` non ridisegna il cerchio evidenziato; chiesa: due
  costi e due lampeggi indipendenti; castello, chiesa, torre: il placer non
  lampeggia se il posto è occupato (le altre sì, per un `else` agganciato
  all'if sbagliato: riprodotto);
- mulino: lo sprite `mul1` che gira (0,3 fotogrammi per passo); magazzino:
  chi l'ha costruito va subito a raccogliere la risorsa più vicina.

**Come funziona** [C]:
- Con civili selezionati e nessun soldato il manager crea un pulsante per
  famiglia; clic o tasto (Q W E D F G T A) creano il placer se le risorse
  bastano, altrimenti lampeggia la risorsa che manca. Il fantasma è rosso
  dove `place_free` fallisce o tocca un campo.
- Il clic sinistro paga e crea il cantiere; i civili "armati" dal pulsante
  (`buildarm`) ci vanno al passo dopo. Arrivati (bbox a meno di 10 px)
  lavorano: **a ogni scatto** di Alarm_2 (13 passi) il cantiere cresce di
  +2 (casa, magazzino, mulino), +1 (le grandi) o +5 (mura, campo); il ciclo
  dei tre step serve solo all'animazione. Più costruttori sommano. A vita
  piena il cantiere diventa l'edificio; i costruttori passano al cantiere
  più vicino se ce n'è uno, altrimenti si fermano.
- Riparazione (click destro su un edificio danneggiato): 1 legno (o 1
  pietra per castello e torre) per punto di vita a ogni scatto; il legno
  spegne anche il fuoco. I riparatori si fermano a edificio integro.
- Centro: 50 cibo per civile, 1 punto di avanzamento ogni 10 passi (circa
  17 s per civile); a popolazione piena aspetta e lampeggia.

**Semantica del runner aggiunta** [I]: lo stato di disegno (alpha, colore,
font, allineamenti) non si azzera fra un evento e l'altro né fra un
fotogramma e l'altro; il porting ora fa lo stesso (`draw.js`, `reset()`
ripristina solo il blend). Prima del cambio la percentuale del centro era
bianca; ora prende il colore lasciato dall'ultimo evento di disegno, come
nell'originale [?, l'ordine dei Draw GUI fra manager e istanze non è
ancora identico: va confrontato con uno screenshot].

**Difetti e residui trovati** [C]:

17. Cantieri, Create: la griglia dei costi si marca con la maschera del
    momento della creazione. Per la casa è la maschera predefinita `c1m`:
    il tipo (e la maschera giusta) arriva dopo, dal placer. Le 6 maschere
    sono simili; riprodotto.
18. `casa` Step: `if onfire=1 part_system_destroy(fire_ps)` sta fuori
    dall'if della fine riparazione (manca un paio di graffe): le fiamme
    alte della casa vengono distrutte al passo dopo la loro creazione e non
    ricompaiono (`firestarted` resta 1). Resta il fuoco "basso" e il fumo.
    Da decidere con l'autore (si porta con le particelle).
19. Castello, chiesa, torre, Step: le soglie dello sprite di danno sono
    entrambe `< 0,33`, quindi `*_r1` viene subito sostituito da `*_r2` e non
    si vede mai; fra il 33% e il 66% resta lo sprite che c'era. Riprodotto;
    da decidere con l'autore (probabile intenzione: `_r1` sotto il 66%).
20. I cantieri non hanno un evento Destroy: annullato con Canc, un
    cantiere lascia le sue celle segnate come ostacolo nella griglia dei
    costi (le unità le aggirano anche se lì non c'è più niente). Riprodotto;
    da decidere con l'autore.
21. Residui innocui: gli `Alarm_9` degli edifici disegnano la barra della
    vita in un evento che non è di disegno (non si vede nulla, e nessuno
    arma l'alarm 9); `chiesa` Step confronta `sprite_index!=chiesa` (nome
    dell'oggetto, non dello sprite); `casa` Step legge `repairork`, mai
    assegnata (vale 0). Nessun effetto; non portati.

**Verificato** (Chromium headless, `match`): civile selezionato → 8
pulsanti; Q → fantasma della casa sotto il puntatore; clic → cantiere
(legno 50 → 0), il civile ci va e costruisce (vita 1 → 119 in circa 780
passi), la casa compare, popcap 20 → 30, il civile torna inattivo. Centro
selezionato: Q, Q (100 cibo → 0, coda 1), il terzo Q lampeggia il cibo; W
annulla l'ultimo in coda (+50); dopo circa 1000 passi nasce il civile
(popolazione 5 → 6) e va verso il punto di raccolta. Riparazione: casa a
100/120, click destro col civile → +1 vita e −1 legno ogni 13 passi, a 120
si ferma. Nessun errore.

**Decisioni dell'autore sui difetti** (5 ottobre 2026): "correggiamo
tutto". Il n.14 (§3.4) era davvero debug: il `legno_prizedrawer` non si
crea. Applicate subito:
- n.17: il tipo, lo sprite e la maschera della casa arrivano prima del
  Create del cantiere (`world.create(..., { init })`), che marca la griglia
  con la maschera giusta;
- n.19: `*_r1` sotto il 66%, `*_r2` sotto il 33%;
- n.20: Canc su un cantiere libera le sue celle. Non lo fa un Destroy,
  perché a cantiere finito l'edificio ha appena marcato le stesse celle.

Il n.18 si applica quando arrivano le particelle (è nella lista delle
correzioni decise). Verificato in Chromium: cantiere di una casa di tipo
4 marcato con `c4m`; dopo Canc restano ostacolo solo le celle di un albero
sotto il cantiere; torre al 50% → `torre_r1`, al 20% → `torre_r2`, al 100%
→ `torre_spr`.

### 3.6 Punto 3c: campi e cibo (5 ottobre 2026)

**Portato** (`buildings.js`: `campoFond`, `campo`, `foodBullet`, il campo
nella tabella `FAM`; `civilians.js`: azione 3 del civile, semina e raccolta
in Step azione 16 e Alarm_2).

**Come funziona** [C]:
- Pulsante R, 200 legno. Il cantiere del campo (`campo_fond`) **non** è un
  `ally_fondamenta`: non lo costruisce chi costruisce le case, lo
  **semina** un civile alla volta (`fieldwork`, action 8) che va al centro
  del cantiere: +5 vita a ogni scatto di Alarm_2, quindi 20 scatti, circa
  260 passi (4,3 s). Campo e cantiere **liberano** le celle della griglia
  dei costi: ci si cammina sopra.
- Finita la semina il seminatore diventa contadino. Un campo è libero
  (`foodwork=0`) o occupato: lo occupa il `food_bullet` che il contadino
  crea quando comincia, e ogni raccolto lo tiene occupato per altri 40
  passi. Il contadino cerca il campo **libero** più vicino; se sono tutti
  occupati si ferma.
- +1 cibo ogni 39 passi; a 10 va al granaio più vicino (`ally_barn`:
  mulino o centro, che ha un `cc_barn` invisibile), scarica, e cerca di
  nuovo il campo libero più vicino. Il campo non si esaurisce.

**Deviazione** [I]:

22. Se un cantiere di campo viene finito mentre un secondo seminatore è
    ancora in cammino (`fieldwork=1`), l'originale legge
    `instance_nearest(x,y,campo_fond).x` senza cantieri, cioè `noone.x`, e
    GameMaker si ferma con un errore. Qui il civile si ferma e torna
    inattivo. Non l'ho visto succedere: lo deduco dal codice.

**Residui** [C], non portati perché nessuno li legge: la variabile `food`
del campo (cresce fino a 200 ogni 120 passi), `foodir/woodir/...` del
centro (assegnate dai click destri, mai lette), lo sprite casuale del
campo (`action_if_dice(2)` sceglie `campo2`, che è già quello
dell'oggetto). La room `match` ha già un cantiere di campo piazzato (vita
1) vicino al mulino.

**Rimandato**: spighe ed erba dei campi, semi lanciati dal seminatore e
campo bruciato (sistema di particelle e fuoco); `hint_campi`
(suggerimenti).

**Verificato** (Chromium headless, `match`, legno portato a 300): civile
selezionato, R, clic → cantiere (legno 300 → 100); il civile semina
(sprite `os*`, vita 1 → 100), il cantiere diventa campo, il civile
raccoglie (`owo*`), a 10 va al mulino col carico (`car*`), scarica (cibo
100 → 110 → 120) e torna allo stesso campo; il campo passa da occupato a
libero e di nuovo occupato. Nessun errore.

### 3.7 Mura e porte (5 ottobre 2026)

**Portato** (`game/src/walls.js`; pulsante e placer del primo tratto in
`buildings.js`, famiglia `mura`): `mura_clicker`, `mura_placer`,
`mura_ori_fond`/`mura_vert_fond`, `mura_ori`/`mura_vert`,
`porta_ori`/`porta_vert`, `mplus_*`, `muraplacer_*`, le anteprime `oodl`,
`oosl`, `ovbl`, `oval` e `gate_clicker`. Orizzontale e verticale sono lo
stesso codice con nomi e offset diversi [C, confronto evento per evento]:
una tabella `KIND` e un codice solo.

**Come funziona** [C]:
- S (50 pietra) piazza il primo tratto; C lo ruota (orizzontale/verticale).
  Il cantiere è un `ally_fondamenta` come gli altri: +5 vita a ogni scatto
  dei costruttori, 800 di vita, circa 2100 passi (35 s) con un costruttore.
- Selezionando un tratto (o il suo cantiere, o una porta) compaiono due "+"
  alle estremità (orizzontale: 219 px a sinistra e 207 a destra;
  verticale: in basso e 300 px sopra). Un "+" (servono 40 pietra) crea il
  placer del prolungamento: secondo la direzione del puntatore, a settori
  di 60°, compare l'anteprima del tratto che continua a destra o a
  sinistra o che gira in su o in giù; un clic lo paga (40) e apre il
  cantiere.
- Con un tratto finito selezionato, Q o il pulsante della porta (100 oro)
  lo sostituiscono con una porta (600 di vita l'orizzontale, 800 la
  verticale). La porta si apre quando l'unità alleata più vicina ha il
  bbox a meno di 20 px; la verticale ricontrolla al più ogni 30 passi.
- Griglia dei costi: la porta viene creata prima che il tratto sia
  distrutto, e il Destroy del tratto libera le celle: tutta la porta è
  percorribile nel flow field, aperta o chiusa (verificato: 0 celle
  ostacolo su 32).

**Difetti trovati** [C]:

23. `oodl`, `oosl` (Draw_End) e `ovbl`, `oval` (Draw):
    `draw_sprite(x,y,0,oggetto)` ha gli argomenti scambiati: disegna lo
    sprite numero `x` alla posizione (0, numero dell'oggetto), nell'angolo
    della room. Non portato (da lì non si vede niente di utile).
24. `porta_*` Step, "fine riparazione": manca `var xpos=x; var ypos=y`.
    Dentro `with(ally_omino)` `xpos` e `ypos` sono variabili del civile,
    mai assegnate (0, 0): i riparatori di una porta **non si fermano mai**
    e, anche a vita piena, spendono 1 pietra ogni 13 passi (Alarm_2
    toglie la pietra prima di controllare il massimo). Riprodotto.
25. `porta_ori` Alarm_1 vuole liberare tre celle, ma `floor(x-32/32)` è
    `floor(x-1)`: due delle tre sono fuori dalla griglia. Nessun effetto
    pratico (le celle sono già libere, vedi sopra).
26. Le anteprime hanno per parent `mura_ori`/`mura_vert` ed ereditano il
    loro Destroy, che libera le celle sotto la maschera. Quando
    un'anteprima sparisce (il puntatore cambia settore, Esc, o il
    cantiere che la sostituisce) libera le celle sotto di sé: quelle del
    cantiere del prolungamento appena marcate (verificato: 0 ostacoli su
    30 durante la costruzione), e quelle di un edificio o di un muro che
    l'anteprima rossa stava toccando. Le anteprime ereditano anche il
    click destro di riparazione e il Canc dei muri. Riprodotto
    (succede da solo: il mondo risale i parent come GameMaker).
27. Muri e porte non controllano mai `life<=0`: non vengono distrutti
    (né da Canc, che mette `life=0`, né dai nemici quando arriverà il
    combattimento) e non ci sono sprite di rovina per le mura. Riprodotto.
28. Canc su un cantiere di muro rimborsa 50 pietra anche per i
    prolungamenti, che ne costano 40. Riprodotto.
29. `gate_clicker` Draw_GUI usa `view_hview` (altezza della view nella
    room) invece di `view_hport`: con lo zoom a 1,5 la scheda della porta
    finisce sotto lo schermo. Riprodotto.

**Verificato** (Chromium headless, `match`, pietra 500 e oro 200): S,
clic in un posto libero → cantiere (pietra 450), il civile costruisce (vita
1 → 800, a metà lo sprite `m_ori_f2`), il muro compare; Esc, clic sul
muro → due "+" e il pulsante della porta; clic sul "+" destro, puntatore
a destra → anteprima `oosl`; clic → cantiere del prolungamento a +424 px
(pietra 410); muro selezionato, Q → porta (oro 100), aperta col civile a
meno di 20 px, chiusa quando i civili si allontanano. Nessun errore.

### 3.8 Decisioni dell'autore su mura e porte (5 ottobre 2026)

"Facciamo sparire le mura"; "la porta chiusa vista come aperta dalla
griglia è voluta per il giocatore, sarebbe sensato fosse chiusa per il
nemico"; n.22 resta come nel porting; "correggiamo tutto". Applicato:

- **n.27**: muri e porte a vita 0 spariscono, senza rovina (anche con
  Canc, che mette `life=0`), insieme ai loro pulsanti se erano selezionati.
- **Griglia dei nemici** [deviazione decisa dall'autore]: `Pathing` ha un
  secondo strato, `enemyBlock`, letto solo dai goal field delle unità
  `enemy_unit`. La porta lascia libere per il giocatore le celle della sua
  maschera chiusa (lo stesso risultato dell'originale, ora scritto
  esplicitamente) e le segna come ostacolo per i nemici; le restituisce
  quando sparisce. Una griglia sola più uno strato costa meno di due
  griglie complete da tenere allineate.
- **n.24**: i riparatori di una porta si fermano a vita piena, come per gli
  altri edifici.
- **n.25**: l'Alarm_1 di `porta_ori` non si porta (le celle sono già
  libere).
- **n.26**: le anteprime ridefiniscono vuoti gli eventi del muro che non
  devono ereditare (Destroy, click destro, Canc, selezione).
- **n.28**: Canc su un cantiere di muro rimborsa quanto pagato (50 il
  primo tratto, 40 un prolungamento).
- **n.29**: la scheda della porta usa l'altezza dello schermo.

**Verificato** (Chromium, `match`): cantiere di un prolungamento con 26
celle ostacolo su 30 (le altre 4 le libera il costruttore che ci sta
sopra, `scr_free`, come nell'originale); porta libera per il giocatore (0
ostacoli) e ostacolo per i nemici (32 su 32); da un lato all'altro della
porta il goal field di un alleato dà 6 celle, quello di un nemico 60
(deve aggirare il muro); Canc su un tratto finito selezionato → il tratto
sparisce. Nessun errore.

### 3.9 Punto 4a: fanteria e caserma (5 ottobre 2026)

Il punto 4 (combattimento) è diviso in cinque passi: 4a fanteria e
caserma; 4b IA dei nemici in mischia, morte e cadaveri; 4c arcieri,
frecce e torri; 4d assedio e fuoco; 4e edifici nemici, ondate, difensori
e chiesa.

**Portato** (`units.js`: `infantry`, `controlGroups`, `behaviourClicker`;
`production.js`): `ally_warrior` e `ally_picchiere`; la produzione della
caserma (coda di 6, annulla, bandiera di raccolta, pulsanti delle unità);
i pulsanti attacco/difesa (anche per il cavaliere); i gruppi di controllo
(Ctrl+numero, numero) per militari e civili, che mancavano anche al
cavaliere. Gli alarm del fuoco degli edifici ora seguono il numero di
ciascuna famiglia (nella caserma l'alarm 0 è la produzione).

**Come funziona** [C]:
- Guerriero e picchiere sono lo stesso codice; il picchiere è una
  versione precedente, come il cavaliere (clic sinistro all'inizio dello
  Step, arrivo esatto, niente precedenza di rango da vicino, `scr_move`
  sempre). Le differenze sono una tabella (`INFANTRY`). Vita 75 e 60,
  popolazione 2, danni per vita massima del bersaglio in §1.4.
- Coda della caserma: `coda0` è l'unità in produzione, `coda1..6` quelle
  in attesa. La nuova unità nasce 20 px a destra o a sinistra e 10 sopra
  o sotto, verso la bandiera, poi cerca la cella libera più vicina.
- `nada` e `nope` (bandiera assente) non sono definite da nessuna parte:
  sono variabili mai assegnate, cioè 0 [I, §1.3].
- Il "clic fuori" del guerriero sta nel suo evento Destroy, non in
  Mouse_GlobalLeftPressed: un clic sul terreno lo deseleziona comunque,
  tramite il rettangolo di selezione vuoto.
- Non portati: `Alarm_11` del guerriero (vecchia copia di movimento e
  attacco, nessuno la arma) e F12 di picchiere e cavaliere (ricalcolo del
  percorso verso il mouse: strumento di sviluppo).

**Difetti trovati** [C], riprodotti in attesa di decisione:

30. `global.firesel` (quanti selezionati possono dare fuoco) non scende
    quando un guerriero muore selezionato, né con Esc (`ally_unit`):
    resta sopra 0 e il manager continua a disegnare l'anello del fuoco
    sotto il puntatore.
31. Il pulsante Difesa mette `comp=200`, ma la scheda dell'unità evidenzia
    la difesa solo con `comp=50`: l'evidenziazione non si accende mai.
32. La caserma avanza di 1% a ogni passo (`alarm[0]=1`): un'unità ogni
    ~113 passi (1,9 s), contro ~1000 (17 s) del civile al centro. Forse
    un valore di prova come le risorse iniziali [?].
33. `scr_find_free_cell_spiral64` usa celle da 64 px ma legge la griglia
    dei costi (celle da 32) con quegli indici: controlla un altro punto
    della mappa. In più il primo controllo avviene dopo il primo passo
    della spirale, e la cella della bandiera non viene mai provata.
34. Magazzino e mulino non armano mai nel Create l'alarm della vita in
    fiamme (alarm 1): a fuoco fanno fumo ma non perdono vita.
35. I pulsanti delle unità (caserma) scrivono `global.sele` a ogni passo
    (1 col puntatore sopra di sé, 0 altrimenti): vince l'ultimo creato,
    l'annulla. Finché una caserma è selezionata, Ctrl e Alt non
    funzionano e il passaggio sopra i pulsanti delle unità non protegge
    dalla deselezione.

**Altro**: il banner "rendering software" in basso intercettava i clic sul
canvas; ora è trasparente al mouse (`pointer-events: none`).

**Verificato** (Chromium, `match`, risorse a 500): caserma selezionata, Q
Q W E → coda di 4 (cibo 500 → 295, legno 500 → 455, oro 500 → 375); R
annulla l'arciere (+40 legno, +55 oro); nascono due guerrieri e un
picchiere (popolazione 5 → 11). Portati a 150 px da un picchiere nemico
lo attaccano da soli (vita 60 → 47 → 27 → 10 → …; i nemici non muoiono
ancora: 4b). Gruppi: Ctrl+1, Esc, 1 → riselezionati tutti e tre.
1200 passi senza errori in `match`, `lvl01`, `lvl02`.

### 3.10 Punto 4b: nemici in mischia (5 ottobre 2026)

**Portato** (`game/src/enemies.js`): `enemy_warrior`, `enemy_picchiere`,
`enemy_cavaliere` (visibilità, morte e cadavere, movimento, attacco,
inseguimento, frecce incendiarie sulle case, selezione, bersaglio col
click destro); `scr_movimento_nemici_ff`, `scr_atk_signal`,
`scr_find_free_spawn_enemy`; `atk_signal`. Arcieri, catapulte e arieti
nemici restano bersagli fermi fino a 4c/4d.

**Come funziona** [C]:
- Tre copie dello stesso codice che si sono allontanate; le differenze
  stanno in una tabella (`MELEE`). Vita 75/60/90, rango 3/3/5, danni per
  vita massima del bersaglio in §1.4.
- Il nemico vede un alleato entro 400 px (dimezzati di notte, ridotti in
  verticale come la velocità) e lo carica con `mp_potential_step`; a meno
  di 10 px attacca: un colpo ogni 39 passi col versore. Colpendo un civile
  lo fa scappare di 200 px (alarm 10); catapulte e arieti fermi scappano.
- È visibile entro 150 px da un'unità alleata, 200 da un edificio (o un
  palo, per il picchiere), 500 da castello e torre (le distanze crescono
  di giorno: `+ r·(1−night)`), se colpito, nel menu o col trucco della
  nebbia.
- Guerriero e picchiere, se fermi a meno di 400 px da un edificio di legno
  e senza civili entro 400 px, vanno a dargli fuoco (le frecce
  incendiarie partono col punto 4d).
- I nemici della room non hanno un flow field proprio
  (`role` 0): si muovono con `mp_potential_step`. Solo gli attaccanti delle
  ondate (role 31, punto 4e) seguono un flow field.

**Motore**: il mondo tiene un indice delle istanze per nome di oggetto e
di parent, nello stesso ordine di creazione (`instance_nearest`,
`instance_number`, `with` danno gli stessi risultati). L'IA nemica fa
molte di queste ricerche per istanza e per passo: `lvl02` è passata da
~12 a ~1 ms per passo di simulazione (3000 passi in 2,8 s).

**Difetti e stranezze** [C]:

36. (Ritirato: i nemici si deselezionano con l'evento ereditato dal parent
    `enemy`.)
37. "Griglia 0": il manager crea una prima `global.cost_field` (1000 dove
    c'è un alleato, un nemico o un elemento naturale, 1 altrove) e la
    sostituisce subito con un'altra. I nemici senza flow field proprio
    hanno `flow_field` mai assegnata, cioè 0, e quando si sovrappongono a
    qualcosa `scr_move_flow_field` legge la griglia 0 come un campo di
    angoli: 1 grado (destra) o 1000 → 280 gradi (giù, un po' a destra).
    Riprodotto (`Pathing.grid0`).
38. Il doppio clic su un picchiere o un cavaliere nemico seleziona
    **tutti i civili**, senza contarli in `global.sel`. Riprodotto.
39. `enemy_warrior`: nel controllo della nebbia mancano le graffe (le
    altre due copie le hanno): vicino a un `fog01` (entro 290 px) il
    guerriero nemico non insegue mai. `fog01` lo crea `fog_controller`
    (punto 5): finora non conta. Riprodotto.
40. Residui: `atk_signal` non disegna nulla (solo un contatore di debug in
    `mouser`); l'Alarm_3 dei nemici ("animazione fuoco?") non lo arma
    nessuno; `global.dialogoenemy1` e `hint_attack` arrivano con dialoghi
    e suggerimenti.

**Verificato** (Chromium, `match`): un guerriero creato a 300 px da un
picchiere nemico: il picchiere lo vede e lo carica, si colpiscono (75 →
72 → … e 60 → 53 → …, −3 e −7 ogni 39 passi), il picchiere muore, il
cadavere fa le sue tre pose e sparisce, il guerriero va verso il nemico
successivo. 3000 passi senza errori in `match`, `lvl01`, `lvl02` (in
`lvl02` si combatte da soli: alleati 16 → 11, nemici 89 → 83).

### 3.11 Punto 4c: arcieri, frecce, torri (5 ottobre 2026)

**Portato** (`game/src/ranged.js`, `enemies.js`): `ally_arciere` (tiro,
avvicinamento, bersaglio col click destro, presidio), `enemy_arciere`; le
quattro frecce (`arciere_bullet` degli arcieri, `arciere_bullet_t` di
torri, castello e centro, `b_arciere_bullet` degli arcieri nemici,
`b_arciere_bullet_t` delle torri nemiche); il presidio di `torre` (2
arcieri) e `castello` (4) con le loro frecce e le bandierine; le frecce
del centro; `enemy_torre`; `flag_r`, `flag_r2`, `flag_b`; le reazioni
alle frecce (i nemici fermi scappano da quelle degli arcieri; guerrieri,
picchieri e cavalieri vanno verso l'arciere nemico che li colpisce).

Inoltre: l'hover degli edifici viene dal parent `ally_build` (vale anche
per mura, porte e cantieri, come nell'originale); il click destro di
riparazione controlla che l'edificio sia danneggiato (tranne la casa,
che non lo controlla); i soldati e i civili mostrano il numero del loro
gruppo di controllo (gli arcieri no).

**Come funziona** [C]:
- Arciere: tira entro 600 px (ridotti in verticale), una freccia ogni 56
  passi (13 + 30 + 13) a 20 px per passo, 33 passi di vita (660 px).
  Danni delle frecce: 6 a fanteria e arcieri, 4 al cavaliere, 3 ad
  arieti e catapulte (alleati e nemici, in tabella).
- Arciere nemico: tira entro 400 px (dimezzati di notte), si avvicina
  entro 600.
- Torre (2 posti), castello (4 posti) e centro: una freccia per arciere
  di presidio (il centro una sempre) ogni 50 passi (35 il centro) su un
  nemico entro 600 px. La torre nemica tira due frecce ogni 50 passi.
- Presidio: click destro su torre o castello con arcieri selezionati; a
  meno di 10 px l'arciere sparisce (−2 popolazione) e l'edificio ha una
  freccia in più. Gli arcieri non escono più.

**Difetti e stranezze** [C]:

41. `warwark` (sic) nella reazione alle frecce di guerriero, picchiere e
    cavaliere: mai assegnata, vale 0, la condizione è sempre vera. Nessun
    effetto.
42. `torre` Destroy: l'if senza graffe regge solo `var thisflag=...`;
    senza bandiera `with(thisflag)` diventa `with(0)`, cioè il primo
    oggetto del progetto, `hint_legna` [I: gli indici seguono l'ordine del
    progetto]: una torre distrutta senza presidio cancella il suggerimento
    sulla legna, se è aperto. Riprodotto.
43. Il controllo "destinazione occupata" (Step azioni 9 e 10, ripetuto due
    volte) vale anche per l'ordine di presidio: la destinazione è il
    centro dell'edificio, che non è mai libero, e scivola di 64 px per
    passo verso l'arciere finché trova un punto libero. Se fra l'edificio
    e l'arciere c'è un'altra unità, la destinazione arriva fino
    all'arciere, che si ferma senza entrare. Verificato: di tre arcieri
    mandati al castello ne è entrato uno. Riprodotto.
44. Con un bersaglio scelto col click destro, `target_auto_valid` non è
    assegnata (vale 0): appena il bersaglio è fuori tiro e l'arciere è
    fermo, lo dimentica invece di avvicinarsi. Riprodotto.
45. Gli arcieri di presidio non escono mai (nemmeno se l'edificio è
    distrutto). Forse voluto [?].

**Verificato** (Chromium): un arciere a 450 px da un picchiere nemico
tira (60 → 54 → 48) e il picchiere colpito, fermo, scappa finché esce di
tiro; la torre nemica di `match` tira due frecce a un guerriero entro
600 px (75 → 63 → 51) e lui arretra; tre arcieri mandati al castello: ne
entra uno (n.43), compare la bandiera, "1/4", e con un nemico a 450 px il
castello tira (60 → 54 → 42). 3000 passi senza errori in `match`,
`lvl01`, `lvl02`.

### 3.12 Punto 4d: assedio e fuoco (5 ottobre 2026)

**Portato** (`game/src/siege.js`, `production.js`): ariete e catapulta
alleati e nemici; i sassi delle catapulte (`catapulta_bullet`,
`b_catapulta_bullet`) con parabola, mattoni, zolle e sangue (`sfx_*`);
le frecce incendiarie (`fire_bullet`) di fanti alleati e nemici; il fumo
degli edifici in fiamme (`nubeqq`); l'ordine di dar fuoco (click destro
su una casa, stalla o caserma nemica con fanti selezionati); la
produzione di stalla (cavaliere) e castello (ariete, catapulta), con la
stessa coda della caserma; la linea della bandiera di raccolta di
caserma, stalla e castello, che mancava.

**Come funziona** [C]:
- Le macchine d'assedio non hanno flow field né rango: vanno verso la
  destinazione solo con `mp_potential_step`, a 2 px per passo.
- Ariete: attacca l'edificio nemico più vicino entro 700 px; a contatto
  un colpo ogni 69 passi col versore a 50 px, −50 (−5 agli edifici con
  vita massima 100).
- Catapulta: tira all'edificio nemico più vicino fra 300 e 850 px (o a
  un nemico scelto col click destro), poi ricarica: un tiro ogni ~180
  passi. Il sasso viaggia a 5 px per passo su una parabola e all'arrivo
  toglie 40 all'edificio o all'unità che c'è sotto.
- Fuoco: un fante (alleato su ordine, nemico da solo se non ci sono
  civili vicini) tira una freccia incendiaria ogni 38 passi; l'edificio
  colpito prende fuoco (`onfire`) e perde 5 (3 il centro, 20 il campo);
  in fiamme fa fumo e perde 1 vita ogni 70 passi finché un civile non lo
  ripara col legno.
- Produzione: stalla, un cavaliere ogni 1200 passi (20 s); castello, un
  ariete o una catapulta ogni 3000 passi (50 s); le unità del castello
  nascono a destra e vanno alla bandiera (o 150 px a destra).

**Difetti trovati** [C]:

46. Annullare un ariete o una catapulta nel castello rimborsa **pietra**
    al posto dell'oro (30 e 100 invece di 60 e 100). Verificato.
    Riprodotto.
47. Catapulte (alleate e nemiche): con un edificio bersaglio a meno di 300
    px si mettono in cammino senza cambiare destinazione; per una
    catapulta della room `dirox` non è mai assegnata (0) e va verso
    l'angolo (0, 0) della mappa. Riprodotto.
48. L'ariete nemico arma l'alarm 9 dell'edificio colpito, che non rimette
    `hit` a 0: la barra della vita resta visibile per sempre. Riprodotto.
49. Il centro in fiamme non fa fumo e non perde vita: i suoi alarm del
    fuoco (2 e 3) non sono mai armati. Come magazzino e mulino (n.34).
    Riprodotto.
50. Residui: nel castello il tipo 3 (arciere) non ha un pulsante (e
    riceverebbe `alarm[1]` al posto di `alarm[0]`); il fumo è sempre
    specchiato (`random(2)==1` non capita mai); `ariete_bullet` e
    `enemy_ariete_bullet` non li crea nessuno.

**Rimandato**: la fiammata (300 particelle) dei colpi di fuoco e le
fiamme sugli edifici (sistema di particelle); vita e morte degli edifici
nemici di legno (punto 4e: per ora il fuoco e i sassi li segnano ma non
li distruggono).

**Verificato** (Chromium, `match`): castello con 1000 legno e oro: Q
(ariete, −250 legno −60 oro), W (catapulta, −200 −100), E annulla la
catapulta (+200 legno, +100 **pietra**: n.46); dopo ~3000 passi nasce
l'ariete e va a x+150, y+100. Un ariete a 250 px da una torre nemica: la
raggiunge e la abbatte (330 → 230 → 130 → 30 → distrutta). Un guerriero
nemico senza civili intorno incendia il centro (400 → 379, `onfire`)
finché le frecce del centro lo uccidono. La catapulta del tutorial tira a
un edificio nemico e viene abbattuta dalle torri nemiche. 3000 passi
senza errori in `match`, `lvl01`, `lvl02`.

### 3.13 Punto 4e: edifici nemici, ondate, difensori, chiesa (5 ottobre 2026)

**Portato** (`game/src/enemybuild.js`, `levels.js`): `enemy_house`,
`enemy_caserma`, `enemy_stalla` (vita, fuoco, rovina, contatori delle
basi, produzione di attaccanti della caserma); le casse del livello 1
(`o_box1`, `o_box2`, con il premio); la cura della chiesa (`sfx_croce`);
`aggr_assign`, `def_assign`; `enemy_manager` (ondate di `match`),
`enemy_manager_lv2` (aree difese, liberazioni, attacchi a gruppi); dal
manager: i blocchi di difensori e le basi del tutorial di `match`, le
porte del livello 1; gli script `scr_attacca`, `scr_difendi`,
`scr_area_difesa`, `scr_controller_crea_difensori`,
`scr_creazione_attaccanti_generico`, `scr_creazione_difensori_arciere`,
`scr_aggr_interval`. Il punto 4 è completo.

**Come funziona** [C]:
- `match`: dopo 4 passi i nemici presenti diventano difensori (non vanno
  a cercare i civili); a ~16900 passi (4,7 minuti) la prima ondata a
  nord-est, poi una ogni 18550 passi (14550 dalla settima), da 3 a 7
  unità più un'arma d'assedio dalla sesta. Ogni 600 passi i nemici non
  difensori e fermi vanno verso il civile più vicino. Avvicinandosi a tre
  punti compaiono gruppi di difensori; distrutte le tre basi (contatori
  scalati da edifici e torri nemiche) è vittoria.
- `lvl02`: sette aree difese (ruolo 10, `def_point_id` 110–170);
  liberata un'area (nessun suo difensore vivo) arrivano civili e premi; le
  caserme col ruolo 30 producono un attaccante ogni 540 passi e, quando
  sono più di 4, partono col flow field (porte chiuse) verso i civili;
  la caserma dell'area 6 crea arcieri difensori finché l'area resiste.
  Vittoria: aree 1–6 liberate e nessun edificio nemico.
- Livello 1: alle porte premi d'oro e basi alleate (2 caserme e 5 case,
  poi 2 stalle).
- Chiesa: ogni 180 passi +3 vita alle unità alleate ferite entro 800 px.

Dialoghi, suggerimenti e `victory_manager` non sono ancora portati: la
regia li crea solo se esistono (`createIfPorted`), così funziona già e li
mostrerà quando arriveranno. Senza `dialogo_2_1` (che arma il rinvio di
250 s delle ondate del livello 2) gli attacchi del livello 2 partono
prima che nell'originale.

**Difetti trovati** [C]:

51. Livello 1: il manager mette `comp=50` (difesa) ai militari nel suo
    Create, ma il Create delle unità, che viene dopo, rimette 700: nessun
    effetto. Riprodotto.
52. `scr_controller_crea_difensori` riarma l'alarm 3 della caserma
    difensiva, ma alla scadenza l'alarm 3 esegue
    `scr_creazione_attaccanti_generico`: la caserma crea un attaccante e
    passa al ruolo 30. Riprodotto.
53. Livello 2: con le condizioni di vittoria vere, `victory_manager` viene
    creato a ogni passo. Riprodotto (conterà quando arriverà la vittoria).

**Verificato** (Chromium): `match`: 4 difensori dopo 10 passi; prima
ondata dopo 17000 passi (+3 nemici), seconda dopo altri 18550; un
guerriero ferito vicino alla chiesa passa da 40 a 46 in 400 passi;
distrutti gli edifici della base 2, `base2b` 4 → 0 e `basidistrutte` 1.
`lvl02`: le due caserme e la stalla ricevono il ruolo 30, la terza
caserma il 10; gli attaccanti partono (ruolo 31) e arrivano (32); liberata
la prima zona arrivano 2 civili. 3000 passi senza errori in `match`,
`lvl01`, `lvl02`.

### 3.14 Decisioni dell'autore sul punto 4 (5 ottobre 2026)

- **n.32**: era un valore di prova. La caserma ora avanza di 1% ogni 12
  passi: un'unità ogni ~1200 passi (20 s), come la stalla. Verificato:
  1189 passi dal pulsante alla nascita.
- **n.45**: voluto, gli arcieri di presidio muoiono con la torre.
- **n.39**: voluto (il guerriero nemico vicino alla nebbia non insegue).
- **n.53**: da sistemare con la vittoria.
- **n.42**, spiegazione per l'autore: quando una torre alleata viene
  distrutta senza aver mai avuto arcieri di presidio, il codice che
  dovrebbe togliere la bandierina (che non c'è) finisce per cancellare il
  suggerimento del tutorial sulla legna (`hint_legna`), se è aperto.
  Corretto: senza bandierina non si fa nulla.

Corretti tutti gli altri:
- n.30: Esc e il "clic fuori" scalano anche `firesel`, `arcsel` e
  `siegsel` (verificato: 1 → 0).
- n.31: la scheda evidenzia la difesa con `comp < 300` (il pulsante Difesa
  mette 200).
- n.33: la ricerca della cella libera vicino alla bandiera legge la cella
  giusta della griglia.
- n.34, n.49: magazzino, mulino e centro in fiamme fanno fumo e perdono 1
  vita ogni 70 passi come gli altri edifici.
- n.35: un pulsante di produzione rimette `global.sele` a 0 solo se l'1
  l'aveva messo lui: Ctrl e Alt funzionano anche con una caserma
  selezionata.
- n.37: un nemico senza flow field proprio, quando si sovrappone a
  qualcosa, avanza dritto verso la destinazione invece di leggere la
  griglia orfana del manager (tolta da `pathing.js`).
- n.38: il doppio clic su un nemico non seleziona più i civili.
- n.43: durante un ordine di presidio la destinazione non scivola verso
  l'arciere (verificato: tre arcieri su tre entrano nel castello).
- n.44: con un bersaglio scelto, l'arciere fuori tiro si avvicina se il
  bersaglio è visibile.
- n.46: il castello rimborsa quanto pagato (verificato: 750/940 → 1000/1000,
  nessuna pietra).
- n.47: la catapulta troppo vicina arretra di 350 px lungo la linea
  dall'edificio.
- n.48: l'alarm 9 degli edifici alleati (parent `ally_build`) rimette `hit`
  a 0.
- n.51: nel livello 1 i militari partono in difesa (`comp=50`),
  assegnato dopo il loro Create (verificato).
- n.52: per la caserma difensiva l'alarm 3 è solo l'attesa fra un
  difensore e l'altro: non crea più attaccanti.

3000 passi senza errori in `match`, `lvl01`, `lvl02`; i 10 test passano.

### 3.15 Punto 5: nebbia e notte (5 ottobre 2026)

**Portato** (`game/src/fog.js`, `fogdraw.js`, `props.js`; `gl.js`,
`world.js`, `manager.js`): `manager` Draw_End per intero (bordo nero fuori
dalla room, rettangolo di selezione, superfici `fog`, `blackfog`, `nite`);
le statue di `lvl01` (`o_statua1..4`: attivazione e cura); `palo_1`
(Create: celle nella griglia dei costi, vita 999, torcia); i bracieri delle
città (`ocr_*` Create → `firestarter`) e la torcia del palo
(`firestarter_small`) come istanze senza particelle, perché la notte li
illumina. La visibilità di nemici e risorse e il difetto n.9 erano già
portati con i loro oggetti (§3.4, §3.10); ora il n.9 è marcato nel codice.
Il punto 5 chiude la vertical slice.

**Come funziona l'originale** [C, manager Draw_End azione 5]: tre superfici
grandi come la room, ridisegnate a ogni fotogramma e applicate con
`bm_subtract` (destinazione × (1 − colore)):
- `fog`: la view riempita di grigio 110 con ellissi nere attorno a unità
  ed edifici alleati: fuori dalla vista attuale il mondo scende al 57%;
- `blackfog`: bianca all'inizio e mai cancellata, con le stesse ellissi (e
  le statue attive): ciò che non è mai stato visto è nero;
- `nite`: `merge_colour(c_black, c_orange, global.night)`, con lo sprite
  `arealight` (una macchia nera sfumata) sopra ogni fuoco: di notte piena
  sparisce il rosso, il 63% del verde e il 25% del blu, tranne attorno ai
  fuochi.
- Ellissi (k = 1 − night: di giorno la visuale raddoppia): unità, edifici e
  pali 200×120 (+k); centro 300×180; castello e torre 500×300; muri
  orizzontali 300+200k × 120+120k; muri verticali spostati di 125 px in alto
  (da y−370 a y+120). Fuochi: bracieri e torce scala 3 con un tremolio di
  ±0,15; edifici in fiamme 3 o 4 (2 le casse) più quanto sono danneggiati;
  freccia incendiaria 1; il fante che la accende, 67 px sopra di sé.
- Solo fuori dal menu e con `global.fogville=1`: il trucco Ctrl+V+Canc
  spegne la nebbia **e la notte**.
- Il manager ha depth −1 e tutto questo è nel suo Draw End: i Draw End
  delle unità e degli edifici (depth −y: barre della vita, cerchi di
  selezione, numeri dei gruppi, la stellina delle miniere) vengono dopo e
  restano **sopra** nebbia e notte; il rettangolo di selezione, disegnato
  dal manager prima delle superfici, ci finisce sotto. Il cerchio del
  puntatore (`mouser`, depth −9999) è sopra a tutto.

**Nel porting** [deviazioni volute, §0.7]:
- Scoperta e vista sono due griglie di byte con una cella ogni 16 px (in
  `match` 438×438, 190 KB); ogni cella tiene quanto è coperta (0–255),
  stimato dalla distanza del suo centro dal bordo dell'ellisse. A ogni
  fotogramma si ricalcola la vista solo sulle celle della view e si
  compongono `fog` e `blackfog` in un solo valore da sottrarre (0 vista,
  110 già vista, 255 mai vista), caricato in una texture a un canale
  filtrata linearmente. **I bordi sfumano su ~16 px** invece di essere
  netti (con celle solo 0/1 il filtro lasciava una scaletta sui bordi
  lunghi: provato e scartato).
- La scoperta si aggiorna **nel passo** (l'originale nel disegno, cioè a
  ogni passo a 60 fps): è stato di gioco, non dipende dal tetto di fps e
  servirà ai salvataggi. Un'istanza ferma la cui ellisse non è cresciuta
  si salta.
- La notte usa una superficie con un texel ogni 8 px della view (0,3 MB a
  1920×1080 con zoom 1,5), allineata alla griglia degli 8 px perché i bordi
  non tremino mentre la view scorre; senza fuochi nella view basta un
  rettangolo. Memoria in tutto < 1 MB contro ~590 MB.
- Motore: superfici (`createTarget`, `beginTarget`/`endTarget`) e texture
  di dati nel renderer; `world.draw` fa girare il Draw End del manager alla
  sua depth fra quelli delle istanze. La cache delle unità di texture ora
  rispecchia sempre i legami GL (prima si azzerava a ogni fotogramma senza
  slegare nulla: con le superfici WebGL dava l'errore "feedback loop").

**[I]** Lo stato di disegno: le ellissi dell'originale usano l'alpha
corrente (`draw_set_alpha`, persistente); qui si assume 1. `global.night`
scende fino a −0,005 (manager Alarm_1): il colore della notte lo tratta
come 0.

**Difetti e stranezze** [C], riprodotti:

54. Le anteprime dei prolungamenti di muro (`oodl`, `oosl`, `ovbl`,
    `oval`) sono figlie di `ally_build`: scoprono la nebbia attorno a sé,
    a ~424 px dal muro, mentre il giocatore sceglie la direzione. Anche
    `cc_barn` (invisibile, sul centro) e i campi vedono.
55. Le statue attive scoprono la mappa attorno a sé (blackfog) ma non sono
    nella lista della vista (`fog`): la loro zona resta grigia come una
    zona già vista. Ogni statua, nel Create, rimette `global.hintata=0`.

**Rimandato**: `hint_night` (il suggerimento alla prima notte, manager
Alarm_0) con i suggerimenti; le fiamme di bracieri e torce con le
particelle; `fog_controller` e `fog01` (le nuvole di nebbia del menu)
con le particelle, dove sono già in lista.

**Verificato**:
- `npm test`: 19 test, di cui 9 nuovi in `test/fog.test.mjs` (copertura
  sul bordo dell'ellisse, raggi di giorno e di notte, forme di castello,
  centro e muri verticali, composizione 0/110/255, scoperta che resta dopo
  che l'unità se n'è andata, trucco e menu, statue, colore della notte,
  fuochi).
- Chromium (SwiftShader): `match` di giorno, nero dove non si è mai visto e
  bordi sfumati; di notte tinta blu e luce calda attorno alle torce dei
  pali; trucco della nebbia → stessa luminosità del giorno senza nebbia, di
  giorno e di notte; `lvl01` di notte con i bracieri; `lvl02` a zoom 1,5 in
  una finestra 2400×900 (view più larga della room: bordo nero a destra);
  menu senza nebbia né notte; barre della vita sopra la nebbia; perdita e
  ripristino del contesto WebGL senza errori (la scoperta, sulla CPU, non
  si perde). Nessun errore WebGL in console.
- Costi misurati in `lvl02`: scoperta 0,01 ms a passo (0,14 ms se tutte le
  istanze si muovono), composizione della view 0,1 ms a fotogramma. In
  `lvl01` il passo costa ~0,2 ms in più per le 199 istanze nuove (bracieri
  e torce, come nell'originale).
- 3000 passi senza errori in `match`, `lvl01`, `lvl02`, `menu`.

### 3.16 Particelle (6 ottobre 2026)

**Portato** (`game/src/particles.js`, `effects.js`; forme in
`tools/05_atlas.py`): un motore `part_system`/`part_type`/`part_emitter`
alla GameMaker e tutti gli usi che stanno nelle room: pioggia (manager
Alarm_4/6, trucco Q), spegnimento degli incendi con la pioggia (Alarm_2),
fiamme degli edifici in fuoco (alleati, nemici, casse, centro, campo),
fiammata delle frecce incendiarie, bracieri delle città e torce dei pali,
erba e spighe decorative (`burst_erba1`, `burst_grano1`,
`chiazzaparticellare`), spighe del campo e campo bruciato, germogli del
cantiere del campo, semi lanciati dal seminatore; l'aquila (manager
Alarm_3, è un oggetto). Mancava anche la collisione della freccia
incendiaria con le casse del livello 1 (`o_box1/2`): portata.

**Motore** [I, regole del runner annotate in `particles.js`]: ogni
particella pesca alla nascita vita, dimensione, velocità, direzione e
orientamento dagli intervalli del tipo; incrementi e gravità a ogni passo;
"wiggle" come oscillazione attorno al valore; colore e alpha a 1, 2 o 3
valori lungo la vita, `colour_mix` e `colour_rgb` fissi; regioni
rettangolo, ellisse, rombo e linea con distribuzione lineare o gaussiana;
stream negativo = probabilità 1/|n|, frazionario = `ceil(n)` (il ciclo
`for (i=0; i<n; i++)` dell'export HTML5). I sistemi si aggiornano dopo gli
Step e si disegnano da soli alla loro depth fra le istanze. Le forme
interne (`pt_shape_flare`, `line`, `pixel`) sono ricreate a mano
nell'atlas `gui` (64×64, dimensione 1 = 64 px). Le particelle sono oggetti
riciclati da una riserva comune.

**Numeri** [C]:
- Fiamme: due sistemi per edificio, dietro (depth −y+1) e davanti (−y−1);
  casa, mulino, magazzino, casa nemica 6+3 particelle a passo su 70 px;
  caserme e stalle 8+4 su 150/110 px; centro 8+4 su 130 px; casse 6+3; il
  campo solo dietro, 6. Moltiplicate per `visible` al momento
  dell'accensione. La vita delle fiamme davanti cresce coi danni:
  ((150−vita)/2, (160−vita)/2), (380, 400) le grandi, (430, 460) il
  centro, (40, 50) le casse.
- Pioggia: 6 gocce a passo lungo il bordo alto della room, 18–21 px a
  passo per 200–300 passi, a depth −9000 (sotto nebbia e notte).
- Erba e spighe: 1700–2600 particelle immobili per oggetto in un'ellisse
  di 1000×600 px, che ondeggiano; in `match` ~12.700, nel menu ~18.000.

**Correzione decisa dall'autore** (§3.5 n.18): la casa non distrugge più
le fiamme dietro a ogni passo: brucia come gli altri edifici.

**Deviazioni** (solo memoria): la fiammata delle frecce è un sistema che
l'originale non distrugge mai; qui sparisce quando le particelle
finiscono. Il seminatore crea un emettitore a ogni lancio e non lo
distrugge; qui ce n'è uno solo.

**Difetti e stranezze** [C], riprodotti:

56. La pioggia spegne gli edifici di legno alleati (`onfire=0`: niente più
    fumo né danni), ma non distrugge le fiamme e lascia `firestarted=1`:
    le fiamme restano accese finché un civile non ripara col legno o
    l'edificio non viene distrutto. La pioggia non spegne gli edifici
    nemici. Raccomandazione: spegnere anche le fiamme, come la
    riparazione.
57. Canc su un cantiere di campo non distrugge i germogli: restano per
    sempre, emessi al ritmo dell'ultimo passo.
58. L'aquila parte a y=−10, sopra la room, e vola in direzione 30 (verso
    l'alto): non entra mai nella view. Probabile intenzione: direzione
    330 (in basso a destra) o partenza dal basso. Da chiedere.
59. La torcia del palo (`firestarter_small`) è visibile: le sue fiamme si
    disegnano due volte, in somma, una nel suo Draw (depth −y−90) e una
    da sole alla depth del sistema, che non è mai impostata (0: dietro a
    unità ed edifici) [I].
60. Un edificio nemico che prende fuoco mentre è nella nebbia
    (`visible=false`) ha fiamme a 0 particelle per sempre, anche quando
    diventa visibile (lo stream si fissa all'accensione).
61. Le gocce sono linee orientate a 160–170° (quasi orizzontali, se la
    linea interna di GameMaker è orizzontale come fa pensare l'erba di
    `chiazzaparticellare`, "linea verticale" a 85–95°) ma cadono a
    250–260°. Da confrontare con l'originale.

**Non portati**: `burst_chiazza1/2` e `object314` (distruggono i loro
sistemi nello stesso Create, quindi non si vedrebbe nulla; non sono in
nessuna room); `fog_controller` e `fog01` (le nuvole del menu) restano col
menu.

**Verificato**:
- `npm test`: 25 test, di cui 6 nuovi in `test/particles.test.mjs`
  (regioni, vita e riserva, moto e gravità, stream, distruzione, fiamme
  degli edifici con i numeri della casa e della caserma nemica).
- Chromium: torce dei pali e bracieri di `lvl01` accesi vicino alle unità;
  centro in fiamme sotto la pioggia (spento: `onfire` 0, fiamme accese,
  n.56); cantiere di campo coi germogli e campo bruciato con stoppie,
  fuoco e fumo; spighe decorative; una freccia incendiaria su una cassa →
  fiammata di 300 particelle, cassa in fiamme; riparazione col legno →
  fiamme distrutte; trucco Q → pioggia fermata; 8 semi lanciati che cadono
  e spariscono.
- Costi: aggiornamento 0,29 ms a passo con le 18.000 particelle del menu,
  disegno 1,3 ms a fotogramma (SwiftShader, CPU); in `lvl01` 0,13 ms.
- 3000 passi senza errori in `match`, `lvl01`, `lvl02`, `menu`.

### 3.17 Decisioni dell'autore su nebbia e particelle (6 ottobre 2026)

"L'aquila dovrebbe volare verso alto a destra, probabilmente è solo
sbagliata la posizione di partenza"; "le gocce di pioggia vanno bene
così" (n.61 resta); "il resto correggiamolo". I bordi sfumati della nebbia
(§3.15) restano: non sono un difetto dell'originale ma una scelta del
porting. Applicato:

- **n.54**: le anteprime dei prolungamenti di muro non vedono né scoprono.
- **n.55**: le statue attive danno anche la vista, non solo la scoperta.
- **n.56**: la pioggia spegne anche le fiamme (come la riparazione col
  legno: sistemi distrutti, `firestarted=0`).
- **n.57**: annullato con Canc, il cantiere di campo porta via i germogli
  (Destroy del cantiere).
- **n.58**: l'aquila parte 10 px sotto il bordo basso della room (x a caso
  come nell'originale) e la attraversa volando in alto a destra. Nota: in
  `match` un'aquila è anche piazzata nella room.
- **n.59**: la torcia del palo si disegna una volta, nel suo Draw
  (depth −y−90); il disegno automatico del sistema è spento
  (`autoDraw`, come `part_system_automatic_draw(ps, false)`).
- **n.60**: le fiamme degli edifici ricalcolano a ogni passo il numero di
  particelle con `visible`: un edificio nemico incendiato nella nebbia
  mostra le fiamme appena diventa visibile.

**Verificato**: `npm test`, 27 test (nuovi: anteprime dei muri, statue
con la vista, pioggia che spegne le fiamme, fiamme che compaiono quando
l'edificio diventa visibile); Chromium: aquila del manager da (5835, 7005)
a (10165, 4505) in 1000 passi, 7 torce senza disegno automatico, centro
spento dalla pioggia senza più fiamme, Canc sul cantiere di campo →
germogli spariti; 3000 passi senza errori in `match`, `lvl01`, `lvl02`,
`menu`.

### 3.18 Suggerimenti, dialoghi, obiettivi, vittoria e sconfitta (6 ottobre 2026)

**Portato** (`game/src/hints.js`, `endgame.js`, `progress.js`): i 26
suggerimenti (`hint_*`), i 25 dialoghi (`dialogo_*`), `objective_button`,
`victory_manager`, `gameover_manager`; tutte le attivazioni negli oggetti
già portati (risorse, campo, casa, edifici nemici, picchiere nemico,
selezione delle unità, torre e castello, prima notte, casse del livello
1); `o_statua1_real` (la quinta statua di `lvl01`, figlia di `ally_build`);
il bandierino del centro distrutto. La regia dei livelli, che li creava
"se portati", ora li crea davvero.

**Come funziona** [C]:
- Suggerimenti e dialoghi sono **la stessa finestra** (confronto evento
  per evento): rettangolo bianco di 380 px, titolo, testo a capo a 340 px,
  ritratto di chi parla nei dialoghi; si chiude cliccandoci sopra. Le
  differenze sono una tabella: ancora (posizione fissa sullo schermo,
  istanza più vicina al puntatore, istanza seguita finché esiste, chi
  parla), clic premuto o rilasciato, attesa prima del clic (`arm`, 10 o 30
  passi), finestra successiva. I suggerimenti si concatenano nel clic, i
  dialoghi nel Destroy.
- Tutorial di `match`: `hint_iniziale` è piazzato nella room e apre la
  catena vista → risorse → inattivi → obiettivi (2) → minimappa →
  selezione → raccolta → costruzione → riparazione → creazione (3).
  `hint_resource` abilita i suggerimenti delle risorse (legna, oro, pietra,
  campi, case). Gli altri compaiono la prima volta che succede qualcosa
  (soldati selezionati, puntatore su un edificio nemico, prima notte…),
  solo se non c'è già una finestra aperta. H li nasconde.
- Dialoghi: `lvl01` dall'apertura (0→1→2, che crea gli obiettivi), le
  casse, il picchiere nemico, le porte; chiudere `dialogo_1_8` è la
  vittoria. `lvl02`: il villaggio (2_0…2_5, con magazzino, pali e
  obiettivi), le liberazioni, la base nemica (2_13 sposta la view), la
  caserma degli arcieri.
- Obiettivi: riquadro in alto a destra (O), con contatori e righe barrate
  in `lvl02`.
- Vittoria: schermo bianco, "VICTORY"; in `match` il punteggio parziale e
  un clic fa continuare la partita; nella campagna il codice del livello
  successivo, e il clic sblocca il livello (**persistente**,
  `localStorage`, versione del formato, parte da 1: decisione §0.14/§0.15,
  confluirà nei salvataggi) e torna al menu.
- Sconfitta: il centro distrutto crea `gameover_manager`; dopo 760 passi
  si torna al menu. `room_goto` per ora ricarica la pagina sulla room.

**Correzione decisa dall'autore** (§3.14 n.53): la vittoria del livello 2
si crea una volta sola.

**Difetti e stranezze** [C], riprodotti salvo dove detto:

62. H (`global.hint`) nasconde anche i **dialoghi**, che però restano
    cliccabili e bloccano la storia: in `lvl01` la vittoria arriva
    chiudendo un dialogo che, coi suggerimenti spenti, non si vede.
    Raccomandazione: H solo per i suggerimenti.
63. In `lvl02` tre `hint_legna` sono piazzati nella room: alla creazione
    si ancorano all'albero più vicino al puntatore (0, 0), finiscono fuori
    dallo schermo (y ≈ −6000) e, essendo finestre aperte, bloccano tutti i
    suggerimenti del livello. Raccomandazione: toglierli dalla room.
64. Il suggerimento del presidio si apre anche cliccando una torre, ma si
    ancora al castello più vicino: senza castelli l'originale si ferma con
    un errore (`noone.x`). **Deviazione**: resta sulla torre.
65. `hint_multi_2` disegna anche un vecchio riquadro alla sua x, y di room
    usate come coordinate dello schermo (di solito fuori schermo).
66. Vittoria e sconfitta centrano i testi su `view_wview/2`, la misura
    della view nella room: con lo zoom a 1,5 sono fuori centro (come n.29).
67. `gameover_manager` è invisibile nel GMX: GameMaker non esegue il suo
    Draw GUI e la schermata di sconfitta **non compare mai**; dopo 12,7 s
    si torna al menu. Raccomandazione: renderlo visibile.
68. I dialoghi senza il controllo "chi parla è morto" leggerebbero la
    posizione di un'istanza distrutta (errore). **Deviazione**: la
    finestra resta dov'era.
69. Casse e picchiere nemico controllano `instance_number(parent_dialogo)`,
    un oggetto senza figli: vale sempre 0 (probabile intenzione:
    `parent_hint`, cioè non sovrapporre i dialoghi).
70. Alcuni suggerimenti (selezione, costruzione, creazione, oro, pietra,
    presidio) seguono l'istanza **più vicina al puntatore**: avvicinandosi
    per cliccarli possono saltare su un'altra unità.
71. Nel menu `hint_iniziale` esiste ma è nascosto (`global.hint=3`): un
    clic in quel punto fa avanzare la catena senza vederla.

**Verificato**: `npm test`, 29 test (nuovi: tabelle complete rispetto al
progetto, seguiti esistenti, "una volta sola"); Chromium: catena del
tutorial di `match` da `hint_iniziale` a `hint_select` cliccando le
finestre; `lvl01` dialoghi 1_0 → 1_1 → 1_2 col ritratto, poi il riquadro
degli obiettivi; `lvl02` `dialogo_2_0` e i tre `hint_legna` fuori schermo
(n.63); `match` con le tre basi distrutte → vittoria col punteggio;
centro distrutto → `gameover_manager` invisibile, dopo 760 passi il menu;
`lvl01` vittoria → clic → `unlock` 2 salvato e menu; 3000 passi senza
errori in `match`, `lvl01`, `lvl02`, `menu`.

### 3.19 Correzioni, menu di pausa e traduzioni (6 ottobre 2026)

**Decisioni dell'autore sui difetti di §3.18**: "per la 62 facciamo che
con H vengono nascosti solo gli Hint del tutorial e non i dialoghi. Le
altre risolviamole." Applicato:

- **n.62**: H nasconde solo i suggerimenti; i dialoghi restano visibili.
- **n.63**: i tre `hint_legna` piazzati in `lvl02` non si creano.
- **n.64, n.68**: le due deviazioni restano come soluzione (suggerimento
  del presidio fermo sulla torre senza castelli; dialogo fermo se muore
  chi parla).
- **n.65**: `hint_multi_2` non disegna più il vecchio riquadro.
- **n.66**: testi di vittoria e sconfitta centrati sullo schermo.
- **n.67**: la schermata di sconfitta è visibile.
- **n.69**: casse e picchiere nemico aprono il loro dialogo solo se non
  c'è un altro dialogo aperto (al posto di `parent_dialogo`, senza figli).
- **n.70**: i suggerimenti ancorati "all'unità più vicina al puntatore"
  seguono l'istanza scelta all'apertura (un'altra solo se muore).
- **n.71**: nel menu `hint_iniziale` non si crea.

**Menu di pausa** (`game/src/pause.js`; richiesta dell'autore: "come
quello di Nimbus, con le opzioni grafiche e la traduzione"). L'originale
ne ha uno [C, `mouser`]: pulsante in alto a destra o Esc senza nulla di
selezionato, tutto fermo (`instance_deactivate_all`), "GAME PAUSED",
Riprendi, Ricomincia, Torna al menu, interruttori di suggerimenti,
obiettivi e FPS. Qui:
- stesso pulsante (rettangolo bianco con `icopausa`) ed Esc; in pausa Esc
  torna indietro o riprende; il mondo non fa passi;
- aspetto di NIMBUS (`n_redux`, `drawPauseOverlay()`): la scena ferma
  sfumata (disegnata in una superficie e dimezzata tre volte col filtro
  lineare, rifatta solo se cambia qualcosa) e scurita al 40%, pannello
  bianco traslucido, pulsanti a pillola, controlli a segmenti con la scelta
  in verde; il testo usa i font del gioco;
- voci: Riprendi, Opzioni grafiche, Suggerimenti/Obiettivi/Contatore FPS
  (sì/no), Lingua (EN IT ES PT DE FR), Ricomincia livello, Torna al menu;
- Opzioni grafiche: Pioggia, Erba e spighe, Fiamme e scintille
  (categorie di particelle: i sistemi spenti non si aggiornano né si
  disegnano; solo estetica, il gioco non legge le particelle), Risoluzione
  dinamica, Limite FPS (30 / 60 / Nessuno). Salvate in `535.settings`.
- Motore: le superfici del renderer si possono annidare (la notte dentro
  lo sfondo del menu); il ciclo accetta "nessun limite" di fps.

**Traduzioni** (`game/src/i18n.js`, `texts.js`): le sei lingue di NIMBUS.
- Tutti i testi del gioco: suggerimenti, dialoghi, schede di edifici e
  unità, obiettivi, vittoria e sconfitta, menu, messaggi del motore (~180
  testi). La chiave è il testo inglese dell'originale (si ritrova nel
  GML); se manca una traduzione resta l'inglese. La lingua viene dal
  browser la prima volta, poi dalle opzioni; cambiarla nel menu vale
  subito, anche per le finestre aperte.
- **Font**: i Seagram tfb di GameMaker hanno solo l'ASCII (§2.5).
  `tools/05_atlas.py` compone le lettere accentate di IT/ES/PT/DE/FR (51
  per font) dalla lettera di base e da un segno dello stesso font (`` ` ``
  e il suo specchio, `^`, `~`, due `.`, `,` per la cedille, `?` e `!`
  capovolti per ¿ ¡), con uno scostamento verticale per le maiuscole: il
  testo tradotto resta gotico. ß, œ, virgolette e trattini lunghi li riduce
  `draw.js` a lettere ASCII.
- Schede e riquadro degli obiettivi si allargano se un testo tradotto non
  ci sta (in inglese restano come nell'originale).
- **n.72**, refusi dei testi inglesi dell'originale: corretti su decisione
  dell'autore ("sì, correggi i refusi"). Per ritrovare i testi nel GML:
  "aswell" → "as well", "reallocatein" → "reallocate in", "buildingto" →
  "building to", "ona" → "on a", "Out citizens" → "Our citizens",
  "norther gates" → "northern gates", "paesants" → "peasants",
  "sucessfully" → "successfully", "Thanks you" → "Thank you", "your
  building, units" → "your buildings, units", "use shortcut" → "use
  shortcuts", "archers inside it" → "inside them", "help you defeating"
  → "help you defeat", "It's over.." e "Not yet.." → "...".

**Verificato**: `npm test`, 32 test (nuovi: ogni testo in tutte le lingue
con gli stessi segnaposto, dialoghi tradotti, `tr()` con ricaduta
sull'inglese); Chromium: Esc apre la pausa a mondo fermo (contatore dei
passi fermo), lingua IT e DE dal menu, opzioni grafiche (pioggia spenta e
salvata), gioco in DE/FR/ES/PT con schede e obiettivi allargati, dialogo
di `lvl01` in francese, titolo "OPÇÕES GRÁFICAS"; `lvl02` senza
`hint_legna`, dialogo visibile con H spento; sconfitta visibile; 3000
passi senza errori in `match`, `lvl01`, `lvl02`, `menu`.

### 3.20 Menu principale, campagna e battaglia del menu (6 ottobre 2026)

`game/src/menu.js`: `enemy_manager_menu` [C, Create, Alarm_0, Step_End,
Draw_GUI, Mouse_GlobalLeftReleased, KeyPress_Escape], `fog_controller` e
`fog01` [C]. Il manager lo crea nella room `menu` (manager Create,
"Livelli" [C], con `global.hint=3`, già in `state.js`).
- **Schermata iniziale**: logo, "Play the tutorial" (va a `match`) e
  "Campaign - Collapse" (apre la campagna), firma e versione in basso.
- **Campagna**: la mappa `mappa_camp` al centro, l'elenco dei livelli a
  sinistra (la riga sotto il puntatore evidenziata, i segnaposto `cap1`/
  `cap2` sulla mappa), la storia del livello in basso, indietro e
  lucchetto in alto a destra. Clic su un livello sbloccato: lo avvia. Esc:
  chiude il lucchetto o torna alla schermata iniziale.
- **Lucchetto**: cinque rotelle 0–9 (metà alta +1, metà bassa −1) e
  "Unlock level". I codici sono quelli dell'originale (livello 2: 4 9 2 1
  7, mostrato dalla vittoria di `lvl01`; i codici fino al 10 sono già
  nella tabella). Codice giusto: lo sblocco sale e si salva; sbagliato: le
  cifre lampeggiano di rosso e sfumano.
- **Battaglia del menu**: l'allarme 0 (dopo 120 passi, poi ogni 9000)
  manda le unità ferme di ciascun lato contro il nemico più vicino; nel
  menu le unità non si selezionano (`global.sele=-1` a ogni passo) e il
  clic destro non dà ordini. Nella room originale i picchieri alleati
  perdono contro guerrieri e cavalieri: dopo circa 1000 passi restano i
  nemici, come nell'originale.
- **Nebbia del menu**: sei `fog_controller` creano 13 nuvole `fog01`
  ciascuno, di nuovo ogni 2000 passi; ogni nuvola compare in 30 passi, va
  a destra di 1 px per passo, sfuma a 4970 passi e sparisce a 5000
  (78–234 nuvole in scena).
- **Ritorno alla campagna**: `global.campagna` nell'originale sopravvive al
  cambio di room, così vittoria, sconfitta o "Torna al menu" da un livello
  avviato dalla campagna riaprono la campagna. Qui ogni room ricarica la
  pagina: il valore passa dall'indirizzo (`&campaign=1`).
- [Decisioni dell'autore, §0.14/§0.15] sblocco persistente che parte da 1
  (l'originale lo rimetteva a 2 a ogni apertura del menu); livelli 3–10
  sempre in elenco, più chiari, con "Coming soon" come storia e non
  giocabili.
- Come in §3.18 (n.66), le posizioni dell'interfaccia usano la misura
  dello schermo e non `view_wview`.
- Testi tradotti (§3.19): pulsanti, nomi dei livelli, storie, "Coming
  soon", "Unlock level"; la storia del livello 1 aveva il refuso "resistence"
  (n.72, corretto in "resistance"). Restano
  in originale "Collapse", la firma e la versione.

**Decisioni dell'autore** (6 ottobre 2026): "73 lascia vuoto, la 75 è un
easter egg e va lasciato così". n.73: il riquadro della storia parte vuoto
(corretto); n.75: resta. Poi: "la 74 la correggiamo" (corretta).

**Difetti trovati** (lasciati come nell'originale salvo n.73, n.74 e n.76):
- **n.73**: il riquadro della storia misura il testo con righe da 40 px
  (`string_height_ext(testo_c,40,…)`) ma lo scrive con righe da 30: il
  riquadro resta più alto del testo. Prima di passare su un livello
  `testo_c` vale `"null"` [C, Create]: aprendo la campagna il riquadro in
  basso mostra la parola "null". **Corretto** (decisione dell'autore):
  vuoto finché non si tocca un livello.
- **n.74**: la riga evidenziata resta quella dell'ultimo livello toccato
  anche quando il puntatore esce dall'elenco (e un clic fuori dalla riga
  non la avvia). **Corretto** (decisione dell'autore): l'evidenziazione
  segue il puntatore; la storia e i segnaposto sulla mappa restano quelli
  dell'ultimo livello toccato, così la storia si legge scendendo col
  puntatore verso il riquadro.
- **n.75**: una volta su otto (`irandom_range(1,8)==8`) al posto della
  firma compare una frase in italiano dell'autore ("Non mi interessa se
  sta roba non ingrana quando soffro d'insonnia…"): lasciata, non
  tradotta. **È un easter egg e resta** (decisione dell'autore).
- **n.76** (corretto): il logo è a y=350 fisso e "Play the tutorial" a
  `altezza−400`: con finestre alte meno di circa 830 px il logo copre il
  pulsante. Qui il logo sale a metà dello spazio libero
  (`min(350, (altezza−400)/2)`); da 830 px in su è come l'originale.

**Verificato**: `npm test`, 33 test (nuovo: nomi dei livelli, storie e
pulsanti del menu tradotti); Chromium a 1280×720 e 1920×1080: schermata
iniziale, campagna (livello 1 e 5 sotto il puntatore), lucchetto, codice
4 9 2 1 7 che sblocca e salva il livello 2, indietro ed Esc, clic sul
livello 2 che apre `?room=lvl02&campaign=1`; vittoria simulata in `lvl01`
avviato dalla campagna: sblocco a 2 e ritorno al menu della campagna;
10000 passi del menu senza errori (0,85 ms per passo con SwiftShader,
fino a 234 nuvole).

---

## Fase 4 — salvataggi, schermo intero, PWA (6 ottobre 2026)

### 4.1 Salvataggi, schermo intero, PWA

**Salvataggi** (`game/src/save.js`, `snapshot.js`; decisione dell'autore
§0.10: "come NIMBUS"). L'originale non salva nulla [C, §0.6]. Il metodo è
quello di n_redux (`game/src/save.js`): JSON esplicito con versione del
formato e checksum leggero (FNV-1a con un sale, come NIMBUS: un numero
cambiato a mano nel file lo rende non valido; non è una protezione vera,
il gioco è tutto nel browser), uno slot nel browser e un file.
- **Cosa si salva**: in NIMBUS lo stato erano poche liste; qui è il mondo
  intero. Le istanze, nell'ordine di creazione (conta per l'ordine degli
  eventi), con tutti i campi, l'id successivo, `global.*`, gli allarmi del
  manager (notte, pioggia, orologio), la griglia dei costi e quella delle
  porte, la scoperta della nebbia, i sistemi di particelle con le
  particelle vive (l'erba decorativa sono particelle che durano per
  sempre), posizione e zoom della view. Non si salvano comportamenti,
  asset, indici (si ricostruiscono), puntatore e tastiera.
- **Come**: serializzazione generica del grafo degli oggetti. Le istanze si
  puntano fra loro (bersagli, chi parla in un dialogo, il fuoco di un palo,
  anche istanze già distrutte che qualcuno tiene ancora): ogni oggetto
  raggiunto più volte esce una volta con un numero e poi come riferimento,
  cicli compresi. Gli array tipizzati (nebbia, costi, flow field condivisi
  fra le unità) escono compressi a corse (con le differenze negli interi:
  le distanze del goal field crescono di 1 lungo una riga); le particelle
  per colonne, arrotondate al millesimo (solo aspetto). Una funzione o una
  classe non prevista nello stato fa fallire il salvataggio con il percorso
  del campo, invece di perdere qualcosa in silenzio.
- **Dimensioni**: 1,0–1,7 MB di JSON per room; nello slot del browser
  compresso con gzip (`CompressionStream`) 200–450 KB (lo spazio di un sito
  è circa 5 MB). Catturare lo stato costa ~50 ms (SwiftShader).
- **Caricare**: ogni room ricarica la pagina, quindi anche il caricamento:
  `?room=<room>&load=slot` (o `&load=file` per un file aperto, passato da
  `sessionStorage`). Al posto della room e dei Create si rimette lo stato;
  il parametro si toglie subito dall'indirizzo, così "Ricomincia livello"
  riparte dalla room. Lo sblocco della campagna non torna indietro
  caricando una partita vecchia.
- **Dove**: menu di pausa → "Salva e carica": Salva partita (slot della
  room), Carica partita (spento se lo slot è vuoto), Salva su file
  (`535-<room>-<data>.json`, scaricato), Carica da file, Salvataggio
  automatico (ogni 5 minuti di gioco, attivo di norma come in NIMBUS, non a
  partita finita). Menu principale → "Load game" (in alto a destra): gli
  slot con nome del livello e data, e "Load from file". Le conferme
  compaiono in alto per 2,5 secondi.
- [Deviazione dichiarata] lo stato salvato è quello del porting: se una
  versione futura cambia la forma dei dati si alza `SAVE_VERSION` e i
  salvataggi vecchi si scartano.

**Schermo intero** (`game/src/fullscreen.js`): API Fullscreen (col
prefisso webkit per Safari). "Full screen" in alto a sinistra nel menu
principale e "Schermo intero: sì/no" nelle opzioni grafiche. Ripiego: dove
non è permesso (iframe di un portale senza `allowfullscreen`, Safari su
iPhone) il pulsante non compare nel menu ed è spento nelle opzioni; il
gioco riempie comunque la finestra o la cornice del portale.

**PWA**: `manifest.webmanifest` (nome "535 – Collapse", schermo intero,
orizzontale), icone dal logo del gioco (`tools/09_icons.py` → `game/icons/`,
versionate: 192, 512, 512 "maskable", 180 per iOS, favicon 32) e
`sw.js` come quello di NIMBUS: prima la rete, la cache solo senza rete;
ogni file entra in cache la prima volta che il gioco lo chiede, quindi una
room si apre offline dopo averla giocata una volta online. Il service
worker si registra solo dove è permesso (https o localhost).

**Verificato**: `npm test`, 38 test (nuovi: grafo con riferimenti
condivisi e cicli, istanze, classi, array tipizzati, colonne, checksum,
gzip); `test/browser/saves.mjs`: in `match`, `lvl01` e `lvl02` dopo 4000
passi lo stato ricaricato è **identico** a quello salvato e la partita
prosegue; lo stesso in `match` dopo 30000 passi e in piena battaglia
(frecce in volo, bersagli assegnati). Chromium: pannello "Salva e carica",
salvataggio nello slot, file scaricato e riaperto dal menu principale,
file modificato a mano scartato ("Non è un salvataggio valido"), elenco
degli slot nel menu, salvataggio automatico dopo 18000 passi, schermo
intero acceso e spento dal menu, opzioni grafiche in spagnolo, service
worker registrato e manifest servito; 3000 passi senza errori in `menu`,
`match`, `lvl01`, `lvl02`.

---

## Fase 5 — GitHub Actions, Pages, zip per i portali (6 ottobre 2026)

### 5.1 Pipeline, prove e pubblicazione

**Workflow** (`.github/workflows/build.yml`), a ogni push e pull request,
sullo stesso schema di quello di NIMBUS (n_redux, `deploy-pages.yml`):
1. Python 3.11 + Pillow; progetto GameMaker dagli zip (`tools/01`).
2. **File generati e versionati allineati**: `tools/02` (data/, src/) e
   `tools/08` (`animTables.js`) rigenerati devono dare gli stessi file del
   repo (`git diff --exit-code`): nessuno li ha toccati a mano e i tool sono
   allineati.
3. Atlas, maschere, scene (`tools/05–07`, ~2,5 minuti).
4. Node 22, `npm ci`, test unitari, bundle.
5. Zip per i portali (`tools/10_zip.py`).
6. Playwright e Chromium (solo nella CI, non fra le dipendenze del
   progetto), server statico, poi tre prove: `soak.mjs` (3000 passi per
   room), `saves.mjs` (salva, ricarica, stato identico) e `portal.mjs` (lo
   zip in un iframe).
7. Lo zip resta come artefatto della run (`535-collapse-web`); su `main`
   lo zip estratto si pubblica su GitHub Pages.

Provato in locale su un clone pulito con gli stessi comandi: la pipeline
dagli zip dà atlas, maschere e scene **identici** a quelli di sviluppo e
lascia invariati i file versionati; test, bundle, zip e le tre prove nel
browser passano.

**Zip per i portali** (`tools/10_zip.py` → `build/535-collapse-web.zip`,
non versionato): alla radice `index.html`, manifest, service worker,
icone, `dist/` (senza source map) e `assets/`; 34 file, 11,5 MB (10,7
compressi), sotto i limiti di itch.io, Newgrounds, Game Jolt e CrazyGames.
Riproducibile (file in ordine, data fissa: quella della versione
dell'originale, 0.250125).

**Prova del portale** (`game/test/browser/portal.mjs`): lo zip si estrae
in una sottocartella (`/portal/html5/535/`) e si apre in un iframe di
un'altra origine senza `allowfullscreen`, come fanno i portali. Controlla
che ogni richiesta resti nella sottocartella (percorsi relativi) e nessuna
fallisca, che menu e room partano e facciano 1500 passi senza errori, che
lo schermo intero risulti non permesso (il pulsante non compare: ripiego
di §4.1) e che salvare e ricaricare dallo slot funzioni dentro l'iframe.

**Da fare una volta (autore)**: attivare GitHub Pages con sorgente "GitHub
Actions" (Settings → Pages). Finché non è attivo, il passo di
pubblicazione su `main` fallisce; la build e le prove no.

---

## Fase 6 — correzioni dalla prova dell'autore (6 ottobre 2026)

### 6.1 Prima tornata di segnalazioni

L'autore ha provato il gioco e ha segnalato tredici cose. Tutte corrette
qui; i numeri continuano quelli dei difetti (n.77–n.89).

- **n.77, pioggia ruotata di 90°** [C]: `part_type_orientation(goccia,
  160, 170, 0, 0, true)` in manager Alarm_4 ha l'ultimo argomento `true`
  (orientamento *relativo* alla direzione); il porting lo trattava come
  assoluto e le gocce erano linee quasi orizzontali che cadevano in
  verticale. Ora 160–170° in più dei 250–260° del moto: linee quasi
  parallele alla caduta, leggermente inclinate. La n.61 di §3.16 (che
  chiedeva di confrontare) era questo errore di lettura.
- **n.78, zoom**: l'originale va da 1,0 a 1,5 con X/Z; ora fino a 2,0
  (`ZOOM_MAX` in `camera.js`) e anche con la rotella, che tiene fermo il
  punto sotto il puntatore. La rotella somma i delta (un touchpad ne
  manda tanti piccoli): uno scatto ogni ~100 px.
- **n.79, percentuale di produzione** (caserma, stalla, castello, centro):
  nera. Nell'originale prende il colore rimasto dal disegno precedente
  (§3.5); qui colore, font e allineamento si impostano prima di scriverla.
- **n.80, contatore dei civili inattivi**: `global.idle` è tenuto a
  incrementi in una trentina di punti (civili, cantieri, edifici); basta un
  percorso dimenticato perché il numero si sfasi per sempre. Ora dopo ogni
  passo si ricalcola dai civili con `action` 0 e si rinumera l'ordine per
  lo Spazio (`recountIdle`, `civilians.js`). Provato: 2 → 5 civili nuovi
  → 4 con uno morto fermo → 3 con uno in cammino → 3 con quello morto
  anche lui (prima non scendeva).
- **n.81, tasti di costruzione coi soli civili**: i pulsanti (e i loro
  tasti) esistono solo con `global.sel > 0` e `global.milsel` a 0. Anche
  questi contatori sono a incrementi, e il doppio clic su un'unità (tutte
  quelle dello stesso tipo nella view) o lo Spazio contano di nuovo le
  unità già selezionate: `milsel` poteva restare sopra 0 senza soldati
  selezionati e i pulsanti non comparivano più. Ora `sel`, `milsel`,
  `firesel`, `arcsel`, `siegsel` si ricontano dopo ogni passo dalle unità
  selezionate (`recountSelection`, `units.js`). In più un pulsante di
  costruzione distrutto mentre il puntatore ci stava sopra non riceveva
  MouseLeave e lasciava `global.sele` a 2: il clic sul terreno non
  deselezionava più e il rettangolo di selezione non partiva; ora il suo
  Destroy lo rimette a 0 (come già `omino_clicker` nell'originale). Nota:
  il caso preciso dell'autore non l'ho riprodotto; i tasti funzionano con
  un civile selezionato per clic, per rettangolo e dopo soldati
  selezionati e deselezionati.
- **n.82, scorrimento ai bordi in finestra**: uscendo dalla finestra il
  puntatore resta sul bordo da cui è uscito (`edgeHold`, `input.js`) e
  la view continua a scorrere da quella parte finché non rientra o la
  finestra perde il fuoco (clic su un'altra finestra, cambio di scheda).
  Sostituisce la deviazione di §3.1 che fermava lo scorrimento. In più,
  nelle opzioni grafiche, **"Blocca il mouse nella finestra"** (spento di
  norma): il canvas cattura il puntatore (Pointer Lock), che non può più
  uscire; il cursore è quello del gioco e si muove coi movimenti
  relativi. Esc lo libera (lo fa il browser) e apre il menu di pausa; il
  clic successivo lo riprende. Negli iframe dei portali funziona solo se
  la pagina lo permette (`allow="pointer-lock"`), altrimenti non fa nulla.
- **n.83, freccia del mouse**: il cursore del gioco era un cursore CSS da
  53×54 px; Chrome rifiuta i cursori sopra i 32 px vicino ai bordi della
  finestra e mostra la freccia. Ora, come fa il runner con
  `action_set_cursor`, la freccia del sistema è nascosta e lo sprite
  `cursore` è disegnato dal gioco sopra a tutto, anche sul menu di pausa.
- **n.84, angoli arrotondati sgranati**: il canvas WebGL non ha il
  multisampling; cerchi, ellissi e rettangoli arrotondati ora hanno il
  bordo sfumato su 1 px (antialiasing per vertice: il poligono arriva
  mezzo pixel dentro il contorno, poi una striscia sfuma fino a mezzo
  pixel fuori) e le curve hanno segmenti di ~6 px (da 16 a 96 per giro)
  invece dei 24 fissi. Anche i contorni di 1 px (riquadro della view
  sulla minimappa) sono sfumati.
- **n.85, schede descrittive**: con la minimappa aperta compaiono alla sua
  destra, oltre i suoi tre pulsanti (`tooltipBegin`/`tooltipEnd` in
  `draw.js`, che traslano la proiezione), invece che sopra. Vale per
  tutte le otto schede (costruzioni, civile, unità di caserma, stalla e
  castello, annulla, attacco/difesa, muro, porta).
- **n.86, un solo font**: il font del gioco (Seagram tfb) c'è solo come
  bitmap nell'atlas, non come TTF. I messaggi HTML (caricamento, WebGL2
  assente, accelerazione hardware assente, contesto perso, salvataggi)
  ora disegnano i suoi glifi in un canvas 2D (`domtext.js`), senza WebGL;
  finché l'immagine non è pronta resta il testo semplice. Il pannello di
  diagnostica F3 resta monospazio (è per chi prova, non per il gioco).
- **n.87, menu di pausa**: titolo all'80% (`gui_sblocco`) e scritte
  all'88% (`GUI_1`, `overdue`), pulsanti e spazi un po' più bassi
  (`draw_text_transformed`, nuovo in `draw.js`: `textTransformed`).
- **n.88, contatore FPS**: era la media esponenziale di `1000/dt`, che con
  frame irregolari sovrastima (frame da 10 e 40 ms alternati: 62 invece
  dei 40 veri). Ora conta i frame disegnati in mezzo secondo. In più il
  ciclo a passo fisso faceva a volte 0 passi in un frame e 2 nel
  successivo (rAF a 60 Hz arriva ogni 16,4–16,9 ms, il passo è 16,67): un
  fotogramma ripetuto che sembra un fps più basso. Ora l'accumulatore ha
  1,5 ms di tolleranza (`loop.js`): a 60 Hz un passo per frame, in media
  sempre 60 passi al secondo.
- **n.89, percorsi di gruppo**: il flow field resta uno solo, quello del
  capo verso il punto cliccato (leggero, come nell'originale), ma prima
  tutti avevano anche **lo stesso punto d'arrivo**: vicino al punto ognuno
  faceva `mp_potential_step` verso quel punto, le unità (solide) si
  spingevano e la regola "destinazione occupata, arretra di 32/50 px" le
  fermava a catena in fila prima del punto. In più i seguaci tenevano il
  `goal_field` dell'ordine precedente: quando il primo arrivava e occupava
  la cella, gli altri ricalcolavano il campo da quei dati verso la cella
  ormai occupata, e `scr_find_valid_cell_backwards` restituiva di nuovo
  quella cella: BFS su tutta la griglia a ogni passo. Ora (`formation`,
  `units.js`, dopo il GlobalRightReleased delle unità):
  - ogni unità riceve una **casella sua** attorno al punto cliccato: righe
    perpendicolari alla direzione di marcia, nella prima riga chi arriva
    prima (distanza / velocità), in ogni riga lo stesso ordine da sinistra
    a destra in cui stanno ora (i percorsi non si incrociano); distanze
    calcolate dalle maschere delle unità vicine; ogni casella è una cella
    libera, raggiungibile nel campo del capo e diversa dalle altre;
  - lontano si segue il flow field comune, da 400 px "step towards" verso
    la propria casella (come l'originale verso il punto cliccato);
  - il ricalcolo "cella d'arrivo occupata" (cavaliere, fanteria, arcieri,
    civili) va alla cella **libera** più vicina (`nearestFreeCell`);
  - un'unità che a meno di 400 px dalla sua casella non si avvicina da 60
    passi più uno ogni 2 px di distanza si ferma dov'è (`arriveIfBlocked`)
    invece di dondolare dietro le altre fino al "timer fermati" di 20 s.
  Solo per gli spostamenti semplici: con un nemico, un edificio, una
  risorsa o un cantiere sotto il puntatore, o con una sola unità, tutto
  resta come prima.

**Verificato**: `npm test`, 40 test (nuovi: cella libera più vicina e
arrivo per rinuncia); Chromium: 14 unità miste (3 cavalieri, guerrieri,
picchieri, arcieri) mandate a 1100 px: prima a 1200 passi il baricentro
era a 330 px dal punto cliccato, in fila, due unità ferme solo dal timer;
ora tutte arrivate in 1000 passi attorno al punto (baricentro a 35 px),
distanza minima fra unità 49 px; rotella (zoom fino a 2,0 attorno al
puntatore), scorrimento a destra col puntatore uscito dalla finestra (869
px in 11 passi), cursore disegnato e freccia nascosta, scheda della casa a
destra della minimappa, messaggio dell'accelerazione hardware e menu di
pausa col font del gioco, contatore degli inattivi coi civili che muoiono;
3000 passi senza errori in `menu`, `match`, `lvl01`, `lvl02`; salvataggi
con ripristino identico; zip dei portali nell'iframe.

### 6.2 Pathfinding: studio, ottimizzazioni A e B, correzioni C e D

Richiesta dell'autore: studiare il pathfinding (flow field e movimento),
ottimizzarlo senza cambiarne il comportamento, chiedere prima di
implementare. Approvate A, B, C, D.

**Misure** (Chromium, profilo a campionamento e micro-benchmark sulle
griglie vere; SwiftShader, CPU del container):
- Nel gioco normale il pathfinding non e' la voce principale: in `lvl02` un
  passo costa ~1,5 ms e il grosso e' `instance_nearest` (~1150 chiamate a
  passo: alberi nascosti che cercano un'unita' vicina, nemici, difese) con
  `distance_to_object`.
- Il pathfinding pesa a picchi: ogni ordine, ogni viaggio di un civile al
  deposito, ogni ricalcolo fa un BFS su tutta la griglia piu' il flow field
  su tutte le celle: 2,3 ms in `match` (218×218 celle), 1,05 in `lvl02`;
  piu' di meta' nel flow field.
- Contro le maschere grandi (montagne a ellisse, fiumi e montagne precise)
  un passo di `mp_potential_step` costava ~1 ms: `overlap` copiava l'intera
  istanza (`{...a, x, y}`) e creava array per ogni riga di maschera.
- Comportamento: il BFS conta i passi a croce e il flow field ne sceglie 8,
  quindi la diagonale vince quasi sempre (93% delle celle): percorsi a
  45 gradi poi dritti. In 40–50 celle per campo la diagonale passava fra due
  ostacoli (spigoli tagliati: sul flow field non c'e' controllo di
  collisione).

**A — campi** (`pathing.js`): goal field con indici lineari e coda
riusata; il flow field non si calcola piu': e' il goal field, e la
direzione di una cella si ricava quando serve (`flowAt`, stessa regola).
Memoria per unita' e salvataggi piu' piccoli (slot di `lvl02` da 473 a
~390 KB). I flow field di angoli dei salvataggi vecchi (`Float32Array`) si
leggono come prima. Costo per calcolo: `match` 2,0 → 0,43 ms, `lvl01`
0,8 → 0,2, `lvl02` 1,05 → 0,3.

**B — collisioni** (`world.js`): `overlap`, `pointIn`, `collision_rectangle`
con gli intervalli delle righe scritti in buffer riusati, senza copiare
l'istanza; ricerca dei vicini senza `Set` (contrassegno `_qs` per i
doppioni, stesso ordine di prima; non si salva); gli eventi di collisione
ricevono una "fotografia" dei vicini come prima (i gestori possono
spostare o distruggere); mappa degli eventi di collisione per oggetto
calcolata una volta. Passo contro una montagna: 1,11 → 0,13 ms.

**Verifica di A+B**: vecchia e nuova versione con `Math.random` a seme
fisso e gli stessi input, digest dello stato (per ogni istanza posizione,
direzione, azione, vita, destinazione, selezione, frame; globali; griglia
dei costi) ogni 100 passi: **identici** in 7 scenari fino a 3000 passi
(`menu`, `match`, `lvl01`, `lvl02` senza input; 30 civili a legno e oro;
40 soldati in marcia; battaglia di `lvl02`). Lo strumento vede le
differenze (con semi diversi: diverso dopo 100 passi). Un salvataggio della
versione vecchia si carica e le unita' camminano coi flow field vecchi.

**C — niente spigoli tagliati** (`flowAt`): una diagonale solo se le due
celle di lato sono percorribili.

**D — percorsi naturali**:
- sul flow field l'unita' punta un **punto di passaggio**: segue le
  direzioni del campo per 6 celle e prende il centro della cella piu'
  lontana raggiungibile in linea retta (linea "spessa" ±12 px, tutta su
  celle percorribili); lo tiene finche' non ci arriva (24 px) o non lo
  vede piu' (`steerAim`; `steerField` non si salva). Sceglierlo a ogni
  passo lo faceva saltare di una cella e lo sprite tremolava (cambi di
  direzione dello sprite raddoppiati): misurato e corretto;
- lo "step towards" (`mp_potential_step` dritto verso la destinazione,
  sotto i 400 px) solo se la destinazione e' **in vista** (`seesGoal`):
  prima si andava dritti anche con un ostacolo in mezzo e l'unita'
  oscillava contro l'ostacolo (decine di passi a 270/300 gradi) fino alla
  rinuncia. Era un difetto gia' presente, che D rendeva piu' frequente.
  Solo per gli spostamenti semplici di soldati, arcieri e civili; nemici,
  attacchi e lavoro dei civili (meta = edificio o risorsa) come prima.
- Uno spessore della linea pari alla maschera dell'unita' (provato) peggiora:
  la linea fallisce piu' spesso e l'unita' alterna le due direzioni.

**Verifica di C+D** (una unita' alla volta, 10–12 coppie partenza/arrivo
a caso lontane dai nemici, stessa casualita', prima → dopo):

| prova | passi | svolte /100 px | cambi di sprite | passi sovrapposti a ostacoli | distanza finale |
|---|---|---|---|---|---|
| guerriero `match` | 5868 → 5843 | 9,7 → 8,4 | 53 → 40 | 197 → 107 | 8 → 8 |
| guerriero `lvl01` | 3369 → 3188 | 6,4 → 2,1 | 276 → 14 | 86 → 134 | 40 → 7 |
| cavaliere `lvl02` | 3341 → 3122 | 45 → 22,8 | 291 → 37 | 809 → 1020 | 70 → 9 |
| cavaliere `match` | 3791 → 3777 | 12,5 → 9,5 | 53 → 34 | 253 → 101 | 7 → 7 |
| arciere `lvl02` | 4163 → 3908 | 39,3 → 23,1 | 318 → 37 | 494 → 305 | 108 → 9 |

Gruppi: 20 soldati verso un punto oltre una montagna, passi sovrapposti
agli ostacoli 456 → 111, arrivati tutti; 14 unita' in formazione arrivate
entro 1200 passi; civili al lavoro: stesse risorse raccolte (550), passi
sovrapposti 636 → 332. I passi sovrapposti salgono un po' dove le unita'
ora arrivano davvero alla meta invece di fermarsi prima: sul flow field il
movimento non ha mai controllato le collisioni, e unita' larghe 50–90 px su
celle da 32 sfiorano i bordi.

**Trovati, non corretti** (da decidere):
- Un nemico in una cella senza direzione (per lui irraggiungibile: le
  porte del giocatore sono ostacoli per i nemici, §3.8) tira dritto nella
  sua direzione ed esce dalla mappa (prova sintetica in `match`: da 2300 a
  14.000 px dal bersaglio). Uguale prima e dopo.
- Il primo nemico di un'ondata che arriva a 400 px dal bersaglio ferma
  tutti gli altri (`role` 31 → 32, `action` 0) [C, scr_movimento_nemici_ff]:
  e' l'originale; le ondate ripartono con `attacca`.

**Verificato**: `npm test`, 42 test (nuovi: spigoli, punto di passaggio in
campo aperto e dietro un muro); 5000 passi senza errori in `menu`,
`match`, `lvl01`, `lvl02`; salvataggi con ripristino identico; zip dei
portali nell'iframe.

### 6.3 `instance_nearest`: studio, N1, N2, N3

**Studio** (chiamate contate per punto del codice, liste scorse, profilo):
94 chiamate nel codice; ~1160 a passo in `lvl02`, ~530 in `lvl01`, ~510 in
`match`. Le liste sono corte (10–33 alleati): pesa il numero di chiamate.
Le principali: `reveal` delle risorse nascoste (~500 a passo: ogni albero,
miniera, pietra nella nebbia cerca l'alleato piu' vicino), i controlli di
vista di nemici, edifici nemici, torri, arieti e catapulte ("il piu' vicino
e' entro r + r*(1-notte)?", ~350), `scr_difendi` (la stessa domanda per
ogni difensore, 77). L'11–19% delle chiamate ripete la stessa domanda col
mondo fermo. In `lvl02` il 95% delle risorse nascoste e' a oltre 800 px da
ogni alleato e l'83% dei nemici a oltre 1200 px. Con 80 soldati in piu'
il passo sale a 3,4–4,2 ms e `reveal` + `nearest` sono un terzo.

Alternative valutate: N1 memoria, N2 scatole senza array, N3 certificati
di lontananza, N4 indice spaziale (utile solo con liste lunghe: rimandato),
N5 controllo ogni N passi (cambia i tempi di rivelazione: scartato).
Approvate N1, N2, N3.

**N1** (`world.js`, `nearest`): il mondo ha una versione (`_ver`) che cresce
a ogni `moved`, creazione e distruzione (l'unico punto che sposta le istanze
e' `setPos`, verificato); `nearest` ricorda l'ultima risposta per nome e la
rida' per la stessa domanda a versione invariata.

**N2**: `bbox` calcolato in un array riusato (`_bboxInto`) per
`distanceToInstance`.

**N3** (`nearWithin(i, nome, r, rmax)`): lo stesso risultato di
`distance_to_object(instance_nearest(i.x, i.y, nome)) < r`. Quando la
risposta e' "no" si guarda la distanza delle scatole di TUTTE le istanze del
nome: se il minimo supera `rmax` (il raggio piu' grande che il chiamante
potra' chiedere: 2,01 r per i controlli di vista, la notte va da -0,005 a
1,005; il certificato si ricontrolla se arriva un r piu' grande) di un
margine, la risposta resta "no" finche' gli spostamenti non possono averlo
consumato. Gli spostamenti: in `moved()` di quanto si sono mossi i lati
della scatola di ogni istanza "seguita" (alleati, nemici, edifici,
risorse), sommati per istanza nel passo; `_travel` somma per passo il
massimo. Due scatole che si spostano di d per lato cambiano distanza al
massimo di 2*sqrt(2)*d (si usa 3). Una nuova istanza seguita invalida tutti
i certificati (`_epoch`); un salto (teletrasporto) consuma il margine
subito. Niente certificato se l'istanza o una candidata ha la scatola che
dipende dallo sprite (maschera non fissa: `palo_1`, la statua, la casa
nemica, le casse; l'animazione cambia lo sprite senza `moved()`), e dopo un
tentativo fallito (qualcuno vicino) si riprova fra 8 passi. I certificati e
gli altri campi di servizio non si salvano; il ripristino li invalida.
Usato da `reveal` e da tutti i controlli di vista (`enemies.js`,
`enemybuild.js`, `ranged.js`, `siege.js`).

**Verifiche**:
- stato identico passo per passo alla versione precedente (stessa
  casualita', confronto ogni 100 passi) in 7 scenari, compresa la
  visibilita' di ogni istanza;
- prova "ombra": a ogni chiamata di `nearWithin` ricalcolata anche la
  formula originale: **0 differenze su 9,4 milioni di chiamate** (`lvl02`,
  `match`, `lvl01`, e `lvl02` con 80 soldati in marcia attraverso la mappa);
  ricerche saltate 86% in `lvl02`, 82% in `match`, 78% con 80 soldati in
  piu', 37% in `lvl01` (alleati e nemici vicini);
- tempo per passo (mediana di 5 misure, riferimento → nuovo): `lvl02` 1,18 →
  0,92 ms (-23%), `match` 0,75 → 0,62 (-18%), `lvl01` 1,01 → 1,01; `lvl02`
  con 80 soldati in marcia 4,25 → 3,60 (-15%). Le misure singole oscillano
  di +-9%: una prima misura di `lvl01` sembrava -24%, era rumore (e un
  costo vero dei tentativi falliti, tolto con l'attesa di 8 passi);
- `npm test`, 45 test (nuovi: memoria di nearest, certificato che scade
  mentre un'unita' si avvicina, nuova unita' accanto, salto, maschera non
  fissa, raggio oltre rmax); 5000 passi senza errori nelle quattro room;
  salvataggi identici; zip dei portali.

### 6.4 Arcieri: linea di tiro e riposizionamento

Richiesta dell'autore: "gli arcieri dovrebbero sparare solo se non ci sono
edifici nel mezzo, altrimenti il primo livello diventa senza senso. Ok
sparare tra gli omini. Se non hanno una linea diretta possono spostarsi,
senza pero' andare lontano".

**Prima** [C]: l'arciere alleato tira al nemico piu' vicino entro 600 px
(quello nemico all'alleato piu' vicino entro 400, la meta' di notte) e le
frecce colpiscono solo le unita': attraversavano case, mura e la citta' di
`lvl01`.

**Cosa ferma le frecce** (`world.blocksShots`): edifici alleati (mura,
porte e cantieri compresi; non i campi), edifici nemici (non le casse di
`lvl01`), gli edifici della citta' (`ocr_*`, che nel GML sono
`natural_parent` come gli alberi: case, tempio, basilica, teatro) e le
rovine. Non le unita', gli alberi, le montagne, i fiumi, le pietre, le
statue, le colonne, le fontane, i pali. Si guardano le sagome a terra (le
maschere): il segmento dai piedi di chi tira ai piedi del bersaglio,
campioni ogni 8 px, esclusi i primi e gli ultimi 20 (`world.shotClear`).

**Comportamento** (`archery.js`; arciere alleato in `ranged.js`, nemico in
`enemies.js`):
- bersaglio: fra i nemici a tiro, il piu' vicino con la linea libera;
  con un bersaglio scelto dal giocatore (clic destro) solo quello;
- al rilascio della freccia (fine del caricamento, 56 passi dopo l'inizio)
  la linea si ricontrolla: se un edificio si e' messo in mezzo il tiro si
  annulla;
- nemici a tiro ma nessuno in linea: l'arciere cerca un punto da cui tirare
  su anelli di 48-240 px attorno a se' (16 direzioni): libero, raggiungibile
  a piedi in linea retta, a tiro e con la linea libera, il piu' vicino; mai
  oltre **250 px** dal punto in cui ha cominciato a combattere (l'ancora,
  cancellata da un ordine del giocatore, dalla fine del combattimento e,
  per i nemici, quando nessun alleato e' piu' a portata d'inseguimento). Se
  non c'e' un punto resta fermo e riprova fra 30 passi. L'arciere nemico si
  sposta con `warwork` 1 (con 4 `scr_difendi` lo riassegnerebbe);
- la freccia parte 40 px in alto e scende verso i piedi del bersaglio; in
  volo, se il punto a terra sotto di lei e' dentro un edificio si ferma
  (cosi' una freccia che manca il bersaglio non attraversa una casa).
- Torri, castello e centro tirano come prima (sono in alto).

**Verificato** (Chromium, casualita' fissata, prima → dopo):
- scenario controllato in campo aperto, bersaglio fermo dietro una casa
  (`ocr_25`, 224x133 px), tiratore a 320 px: con il bersaglio dietro il
  centro della casa prima 26 colpi su 26 attraverso la casa, ora nessun
  tiro e nessuno spostamento (servirebbero 550 px di lato, oltre il
  guinzaglio); con il bersaglio dietro lo spigolo (150 px di lato)
  l'arciere si sposta di 94 px (il nemico di 93) e mette a segno 25 frecce
  su 25, nessuna attraverso la casa; con la linea libera tutto come prima
  (26 su 26);
- battaglia di `lvl02` con 80 soldati in piu' (un quarto arcieri): 81
  frecce (prima 88), 0 colpi attraverso edifici, nessun costo in piu'
  (6,8 → 6,5 ms a passo); `lvl01` verso la citta': prima 8 frecce, una
  attraverso un edificio; ora nessun tiro senza linea;
- `npm test`, 48 test (nuovi: cosa ferma e cosa no, bersaglio in linea
  invece del piu' vicino, punto di tiro dietro lo spigolo, nessun punto
  oltre il guinzaglio); 5000 passi senza errori in `menu`, `match`,
  `lvl01`, `lvl02`; salvataggi identici; zip dei portali.

### 6.5 Edifici che tirano: linea di tiro

Richiesta dell'autore: "applichiamo un fix simile a edifici che sparano
(torri, castelli ecc.): se c'e' un edificio frapposto non sparano e
scelgono un altro bersaglio".

**Prima** [C]: torre e castello presidiati (una freccia per arciere dentro,
ogni 50 passi), il centro (una ogni 35) e la torre nemica (due ogni 50)
tirano al piu' vicino entro 600 px; la freccia (`arciere_bullet_t`,
`b_arciere_bullet_t`) mira, quando nasce, al piu' vicino al suo punto di
partenza.

**Ora** (`archery.js`, `towerTarget`, `towerArrow`): il bersaglio e' il piu'
vicino entro 600 px con la linea libera (`shotClear` dalla base
dell'edificio ai piedi del bersaglio); se non ce n'e' non si tira e
l'edificio resta armato (riprova al passo dopo). La freccia nasce gia' con
il bersaglio (`towerTarget`, impostato prima del suo Create) e in volo si
ferma contro gli edifici come quelle degli arcieri, con l'altezza vera di
partenza (base dell'edificio meno la y della freccia: 60-140 px). Per chi
tira da un edificio non contano l'edificio stesso (la linea parte da dentro
la sua sagoma) ne' mura e porte (si tira dall'alto: le torri stanno lungo
le mura). Torre e castello senza presidio non cercano bersagli (non
avrebbero frecce: prima l'allarme girava a vuoto).

**Verificato** (campo aperto, bersagli fermi, prima → dopo, 1200 passi):
con un nemico dietro una casa (il piu' vicino) e uno piu' lontano in vista,
torre 48 colpi tutti dietro la casa → 48 tutti sul bersaglio in vista;
castello 96 → 96 in vista; centro 35 → 34 in vista; torre nemica 48 → 48 in
vista; con il solo bersaglio dietro la casa 48/35/48 frecce → nessuna; con
un muro in mezzo tutto come prima (48 colpi). Battaglia di `lvl02` con 80
soldati in piu': nessun colpo attraverso edifici, 6,9 → 6,4 ms a passo.
`npm test` 49 test (nuovo: bersaglio dell'edificio e mura ignorate); 5000
passi senza errori nelle quattro room; salvataggi identici; zip dei
portali.

### 6.6 Montagne e rovine fermano le frecce

Decisione dell'autore: "applichiamo il blocco anche con montagne, ma non con
boschi, si' invece con rovine, comprese quelle usate per minare la pietra.
Le mura non devono bloccare torri e castello".

`world.blocksShots` ora conta anche le montagne (`montagna_*`) e tutte le
rovine solide: quelle da cui si estrae la pietra (`stone_parent`: anche
`pietra_grande` e `pietr_piccolo`, che sono un tempio e un tempietto
crollati, oltre alle rovine di castello, chiesa e torre) e le rovine del
centro (`ccruin`). Restano trasparenti boschi e alberi, fiumi, statue,
colonne, fontane e le macerie non solide degli edifici distrutti (case,
magazzini, stalle: le unita' ci camminano sopra). Mura e porte non fermano
chi tira da un edificio (torri, castello e centro, §6.5): gia' cosi'.

**Verificato**: `npm test`, 50 test (nuovo: montagna e rovina fermano,
bosco e fiume no); Chromium su `montagna_2` di `match` (maschera grande a
ellisse): linea attraverso bloccata, sopra libera, attraverso un bosco
libera, 7 µs per controllo; battaglia di `lvl02` con 80 soldati in piu'
senza colpi attraverso edifici o montagne e senza costo in piu'; 5000 passi
senza errori nelle quattro room; salvataggi identici; zip dei portali.

### 6.7 Catapulte troppo vicine: arretramento

Richiesta dell'autore: "per le catapulte: possiamo migliorare il sistema per
cui se sono troppo vicine al bersaglio si muovono automaticamente
indietro? sia alleate che nemiche".

**Prima** (§3.12 n.47): in automatico, carica e ferma, una catapulta con
l'edificio bersaglio piu' vicino a meno di 300 px (distanza minima di tiro)
arretrava di 350 px in linea retta dalla parte opposta. Con un ostacolo
dietro (case, mura, montagne, altre unita') restava incastrata a girare sul
posto; guardando un solo edificio poteva arretrare a meno di 300 px da un
altro; un tiro ordinato dal giocatore su un bersaglio troppo vicino non
faceva nulla.

**Ora** (`siege.js`, `catapultSpot`, `retreatSpot`):
- il punto d'arrivo si cerca su anelli da 120 a 520 px (24 direzioni): una
  cella libera, la catapulta ci sta, raggiungibile in linea retta, e da li'
  l'edificio piu' vicino (quello a cui tirera') e' oltre 300 + 30 px e
  dentro la gittata meno 30; il piu' vicino, a parita' d'anello quello con
  l'edificio meno lontano. Se non c'e', l'arretramento dritto di prima;
- se si blocca per strada si ferma dov'e' (`arriveIfBlocked`, come le unita'
  di §6.1) e al passo dopo rivaluta;
- alleata: un clic destro su un nemico a meno di 300 px (prima ignorato)
  manda la catapulta in un punto da cui il punto cliccato e' a tiro e,
  arrivata, tira li' (il punto segue il bersaglio se si e' mosso);
- [Decisione dell'autore] finito un tiro mirato la catapulta torna al tiro
  automatico (nell'originale restava ferma fino all'ordine successivo);
  un ordine dato durante il lancio lo interrompe come prima e
  l'automatico non riparte.

**Verificato** (campo aperto di `match`, edificio a 100 px dalla
catapulta, 2000 passi, prima → dopo):
- aperto: uguale (alleata primo tiro al passo 220 → 231; nemica 9 tiri);
- ostacolo dietro (cinque case): alleata incastrata 1950 passi, 0 tiri →
  10 tiri, 2 passi ferma; nemica incastrata 1950 passi, 0 tiri → 9 tiri;
- secondo edificio dove porterebbe l'arretramento dritto: alleata primo
  tiro al passo 1429 → 466; nemica incastrata 1758 passi, 0 tiri → 9 tiri;
- tiro ordinato troppo vicino: ignorato → arretra di 200 px e colpisce la
  casa al passo 195; poi, in automatico, ricarica, si accorge di essere a
  238 px (sotto i 300), arretra e a 301 px riprende a tirare da sola fino a
  distruggere la casa.
`npm test` 50 test; 5000 passi senza errori nelle quattro room; salvataggi
identici; zip dei portali; battaglia di `lvl02` senza differenze di costo.


### 6.8 Carico della GPU: studio, G0 (tempo GPU in F3) e G1 (qualita')

Domanda dell'autore: "a livello di carico della gpu secondo te si riesce a
ottimizzare tutto? ho l'impressione che il bottleneck sia li' piu' che
sulla cpu". Poi: "va bene fai g0 e g1 intanto".

**Limite delle misure.** Nel container la GPU e' emulata dalla CPU
(SwiftShader): i millisecondi assoluti non valgono per una scheda vera,
valgono i rapporti fra varianti misurate nelle stesse condizioni. Per
misurare il disegno si chiude il frame con `readPixels` (in SwiftShader
`gl.finish` non aspetta davvero la fine del lavoro).

**Studio** (1920×1080 se non detto altrimenti):
- CPU: la simulazione ~1 ms a passo; preparare il disegno in JavaScript
  2–4 ms a frame. Una parte piccola dei 16,7 ms di un frame a 60 fps.
- Riempimento: ogni frame copre lo schermo 4,7–6,5 volte (sfondo intero,
  pezzi di terreno fino a 3 schermi nel menu, 2500–4000 particelle d'erba,
  nebbia e notte a schermo intero, in `lvl01` due volte, fuochi,
  interfaccia).
- Il costo segue i pixel: a densita' 2 (schermi ad alta risoluzione) il
  disegno costa ~3,5 volte; il gioco disegnava fino a 2 pixel reali per
  pixel CSS (`devicePixelRatio` limitato a 2).
- Lo shader sceglie la texture fra 16 unita' con una catena di `if`
  (`gl.js`): una variante di prova con un solo campionamento dimezza il
  costo dei frammenti (173 → 94 ms nell'emulazione). Su Windows Chrome
  traduce WebGL in Direct3D (ANGLE), dove una catena cosi' puo' eseguire
  tutti i rami: e' il sospetto principale.
- Peso delle parti (spegnendole a turno):

  | | erba e spighe | nebbia + notte | fuochi | interfaccia |
  |---|---|---|---|---|
  | `match` | ~28% | ~17% | — | ~6% |
  | `lvl01` | — | ~41% | ~29% | — |
  | `lvl02` | ~33% | ~30% | ~18% | ~20% |
  | menu | ~45% | — | — | ~28% |

- Texture: 229–245 MB in GPU, di cui 125 MB del terreno (pagine fino a
  4088×4072).

**Proposte** (in ordine di guadagno su rischio): G0 tempo GPU in F3; G1
opzione qualita' (mondo a risoluzione ridotta, interfaccia nitida); G2
shader senza catena di `if` (pagine in una texture a strati, il terreno
ritagliato a 2048: ~meta' del costo per pixel, pixel identici); G3 nebbia
e notte in un solo passaggio; G4 suolo cotto in blocchi ridisegnati solo
quando cambiano; G5 erba piu' rada o animata meno spesso (scelta
estetica). Approvate G0 e G1; G2–G5 restano proposte (lista in cima).

**G0 — tempo GPU nel pannello F3** (`gl.js`, `app.js`, `diag.js`).
- Estensione `EXT_disjoint_timer_query_webgl2`: se il browser la espone,
  ogni frame (solo col pannello aperto, `r.timing = diag.visible`) sta fra
  `gpuBegin()` (dopo `beginFrame`) e `gpuEnd()` (dopo l'ultimo `flush`,
  sia in gioco sia in pausa). Una query `TIME_ELAPSED_EXT` per frame, al
  massimo 8 in attesa; `gpuPoll()` a ogni frame raccoglie quelle pronte
  senza bloccare, scarta quelle con `GPU_DISJOINT_EXT` (misura non valida,
  es. cambio di frequenza) e tiene gli ultimi 60 valori.
- Il pannello mostra `CPU per frame X ms   GPU per frame M ms (max N)`
  (media e massimo degli ultimi 60); senza estensione "non disponibile (il
  browser non espone EXT_disjoint_timer_query_webgl2)"; prima dei primi
  risultati "in misura...". Chrome la espone su desktop (Windows, Linux,
  macOS); Firefox e Safari di solito no (contromisura contro gli attacchi
  di temporizzazione). Se la GPU per frame e' vicina ai 16,7 ms (o ai
  1000/tetto fps) mentre la CPU e' bassa, il collo di bottiglia e' la GPU.
- Riga in piu': `qualita' <alta|media|bassa>: mondo X px per px CSS,
  interfaccia Y`, per vedere la densita' effettiva (qualita' × risoluzione
  dinamica).
- Verificato (SwiftShader, 1280×720, dpr 2): l'estensione c'e' e il
  pannello mostra per esempio "GPU per frame 334,23 ms" in qualita' media.

**G1 — opzione Qualita'** (`app.js`, `gl.js`, `settings.js`, `pause.js`,
`texts.js`).
- Nuova impostazione `quality` (`high` predefinita, salvata con le altre):
  Alta = come prima (fino a 2 pixel per pixel CSS), Media = 1,25, Bassa =
  1. Nel menu di pausa, opzioni grafiche, voce "Quality: High/Medium/Low"
  (tradotta nelle sei lingue) prima della risoluzione dinamica; un clic
  passa Alta → Media → Bassa → Alta e si applica subito.
- Il canvas resta alla densita' dello schermo (`canvasScale` =
  `devicePixelRatio`, massimo 2): l'interfaccia, i testi e il cursore
  restano nitidi. Il mondo ha la sua densita' `worldScale` =
  min(dpr, tetto della qualita') × scala della risoluzione dinamica.
- Se `worldScale` e' minore di `canvasScale` il mondo (sfondi, istanze,
  nebbia, notte, cerchio del puntatore) si disegna in una superficie
  grande `cssW × worldScale` per `cssH × worldScale`, ricreata solo se
  cambiano misura o contesto WebGL, e si copia sul canvas con un quad
  (filtro lineare); poi l'interfaccia (Draw GUI) direttamente sul canvas.
  Altrimenti si disegna direttamente come prima e la superficie si libera.
  Alta su uno schermo a densita' 1 o 2, Media e Bassa a densita' 1: nessuna
  superficie, nessun costo in piu'.
- Cambiamento collegato: la **risoluzione dinamica** prima riduceva tutto
  il canvas (interfaccia compresa); ora riduce solo il mondo, con la stessa
  superficie. La sfocatura della pausa ridisegna la scena dentro la sua
  superficie come prima (con la superficie del mondo annidata).
- **Miscela `replace`** (`gl.js`, `setBlend`): la nebbia e la notte si
  sottraggono con `ZERO, ONE_MINUS_SRC_COLOR`, che azzera anche l'alpha di
  una superficie. Sul canvas l'alpha non conta, in una superficie si':
  copiandola con la miscela normale (alpha premoltiplicato) dove l'alpha e'
  0 il suo colore si somma a quello sotto (il colore della room con cui si
  pulisce il frame) e il mondo usciva slavato, quasi bianco. La copia del
  mondo usa quindi `replace` (`ONE, ZERO`: si scrive il colore, l'alpha si
  ignora). La sfocatura della pausa non ne soffre: le sue copie finiscono
  in superfici pulite con alpha 1 e con colore nero, e lo sfondo esce
  giusto (verificato a schermo, prima e dopo).

**Verificato** (SwiftShader, 1280×720, dpr 2, risoluzione dinamica spenta,
ms per frame, solo i rapporti contano):

| | prima | Alta | Media | Bassa |
|---|---|---|---|---|
| `match` | 678 | 642 | 454 (−33%) | 370 (−45%) |
| `lvl01` | 766 | 750 | 461 (−40%) | 458 (−40%) |

(`lvl01` Media ≈ Bassa: li' pesano nebbia, notte e fuochi a densita' di
superficie gia' bassa, e la copia finale; resta da vedere su una GPU vera.)
- Alta: immagine identica pixel per pixel alla versione precedente (hash
  uguale); la pausa in Alta differisce dal riferimento solo nell'erba
  animata, quanto due esecuzioni dello stesso riferimento (51 mila pixel,
  scarto massimo 26–30 su 255).
- Bassa: stessa immagine, piu' morbida; nessuno slavato (dopo `replace`);
  pausa con lo sfondo sfocato giusto.
- Menu: la voce cicla Media → Bassa → Alta → Media, l'impostazione si
  salva, il canvas resta 2560×1440, F3 mostra "qualita' media: mondo 1,25
  px per px CSS, interfaccia 2,00".
- `npm test` 50 test; 5000 passi senza errori nelle quattro room;
  salvataggi identici; zip dei portali.

**Da provare sul PC dell'autore**: aprire F3 e guardare "GPU per frame"
(se c'e') in Alta e in Bassa nello stesso punto della mappa. Se in Bassa
il tempo GPU scende molto, conta il numero di pixel (G1 basta o G4); se
scende poco, conta il costo per pixel o per particella (G2, G3, G5).

---

## Fase 7 — seconda tornata di segnalazioni e lista della GPU (6 ottobre 2026)

Richiesta dell'autore: completare la lista della GPU (G2–G5, §6.8) e
correggere una serie di difetti trovati provando il gioco. Ogni voce cita
la sezione nei commenti del codice. Prove: `npm test` (50), 1500–3000
passi nelle quattro room senza errori, salvataggi identici, e una prova
mirata per voce (scenari descritti sotto, con `window.__game`). Le misure
del disegno sono in SwiftShader a 1280×720, densita' 1: valgono i
rapporti, con un rumore di ±10% fra un'esecuzione e l'altra.

### 7.1 Testo delle schede bianco su bianco

Le schede dei pulsanti (costruzione, produzione, attacco/difesa, porte,
mura) disegnavano il testo col colore rimasto dal disegno precedente: a
volte bianco, su fondo bianco. `Draw.tooltipBegin` (usato da tutte) mette
il nero.

### 7.2 Pulsanti con piu' unita' selezionate

Nell'originale la scheda dell'unita' (e i cerchi dei pulsanti) si
disegnano solo con una unita' selezionata (`global.sel < 2`); i pulsanti
erano istanze invisibili, quindi con piu' unita' "sparivano" pur
funzionando. Ora, se la selezione e' tutta militare, la prima unita'
selezionata disegna attacco/difesa (evidenziato solo se e' il
comportamento di tutte); se e' tutta civile, il primo civile disegna i
dieci pulsanti di costruzione. La scheda della vita resta il contatore
" x N" del manager. Con una selezione mista nessun pulsante, come prima.

### 7.3 Macchine d'assedio che non accettavano ordini

Riprodotto: col clic destro su una catapulta o un ariete selezionati
`scr_movement_general` (units.js, `movementGeneral`) sceglieva come capo
un'unita' senza `ordo` e senza goal field (l'assedio va con
`mp_potential_step`, §3.12) e lanciava un'eccezione prima dei
GlobalRightReleased delle unita': nessun ordine arrivava. Capo e campo
comune ora solo fra le unita' col flow field; con sole macchine
d'assedio la formazione usa un campo calcolato dal punto cliccato solo
per scegliere le caselle.

### 7.4 Livello 1: porte e comportamento iniziale

- **Porte**: la porta liberava nella griglia tutte le celle della sua
  maschera chiusa, pilastri compresi (§3.8): il flow field passava dai
  pilastri e i soldati, che sul flow field si muovono senza collisioni,
  attraversavano la parte solida. Ora le celle della maschera aperta (i
  pilastri) restano ostacolo: si passa dal varco (3 celle nella porta
  orizzontale). Verificato con tre soldati da punti diversi: attraversano
  tutti fra x 4480 e 4576 (il varco).
- **Militari di partenza in attacco** (decisione dell'autore): il manager
  li metteva in difesa (`comp=50`) prima del Create delle unita', che
  rimette 700: nell'originale partivano in attacco. La correzione §3.13
  n.51 (difesa dopo il Create) e' tolta.

### 7.5 Germogli del campo in costruzione

`part_emitter_stream` con vita/6 = 0,17 vale una particella a passo
(ceil, §3.16): il cantiere appena piazzato era gia' pieno di germogli.
Ora nascono quando la semina e' cominciata (vita sopra 1).

### 7.6 Costruttore che "impazziva" dopo il magazzino

Il magazzino finito segna le sue celle come ostacolo e manda chi l'ha
costruito alla risorsa piu' vicina (§3.5): se il costruttore stava su una
di quelle celle, la sua cella nel campo nuovo non aveva direzione (-1) e
`scr_move_flow_field` teneva l'ultima direzione, senza collisioni:
tirava dritto attraverso alberi ed edifici. E' lo stesso caso dei nemici
che uscivano dalla mappa (§6.2, "trovati"). Ora, da una cella senza
direzione, l'unita' va verso la cella raggiungibile piu' vicina (anelli
fino a 6 celle; a pari distanza quella piu' vicina alla meta); se non ce
n'e' resta ferma. Prova: civile sul bordo di un magazzino nuovo, girato
verso un bosco: prima 2 casi su 8 attraversavano gli alberi (48 e 97
passi dentro), ora nessuno.

### 7.7 Mischia: posti attorno al bersaglio e percorsi locali

Segnalazione: "solo la prima unita' arriva, le altre si accodano e si
incasinano, alleati e nemici". Nell'originale chi insegue va con
`mp_potential_step` verso il centro del bersaglio: il primo arriva, gli
altri spingono contro di lui; i nemici spostano a caso di 20–30 px a ogni
passo la destinazione occupata e tremano. In piu' il primo attaccante di
un'ondata arrivato a 400 px fermava tutti gli altri (`role` 32), anche
quelli lontani, che ripartivano senza flow field.

`melee.js`: chi insegue in mischia punta a un **posto** sul bordo di un
nemico (la propria maschera a 4 px dalla sua), al piu' un attaccante per
settore di 45 gradi; un posto vale se nessun altro solido lo occupa. Fra
il bersaglio e i nemici vicini (fino a 160 px piu' lontani) si sceglie il
posto piu' comodo (strada piu' corta, penalita' per girare attorno). Se la
linea dritta verso il posto e' chiusa da altre unita' o edifici si segue
un **percorso locale**: ricerca in ampiezza su una griglia di 33×33 celle
da 16 px a meta' strada, con le maschere dei solidi allargate di quella
dell'unita', ricalcolata ogni 8 passi; si va verso la cella piu' lontana
del percorso vista in linea retta. Chi non si avvicina al proprio posto
per 40 passi ne prova un altro. Se non ci sono posti, il centro come
prima. I nemici non spostano piu' a caso la destinazione quando e' il
loro posto; gli attaccanti delle ondate passano al ruolo 32 uno per uno.

| prova (600 passi) | prima | dopo |
|---|---|---|
| 8 alleati contro 3 nemici: alleati che combattono | 3 | 8 (in ~5 s) |
| 8 nemici contro 3 alleati: nemici che combattono | 3 | 8 |
| 20 contro 20: unita' in combattimento a meta' scontro | 7–8 per parte | 11–12 |

Il passo costa uguale (4,1 ms contro 4,8 nella battaglia 20 contro 20).

### 7.8 Dissolvenze: cadaveri, rovine, risorse

Confermato dall'originale: i cadaveri sbiadiscono nell'ultima fase
(Step, azione 3: `image_alpha -= 0.025` per 40 passi), come le risorse
finite (`*_morente`, gia' portate) e le rovine. Nel porting mancavano:
- l'azione 3 dei cadaveri;
- le rovine degli edifici di legno (`casaruin`, `magruin`, `barnruin`,
  `casruin`, `stalruin`, `ccruin`): restavano per sempre. Ora fumo ogni
  200 passi, sbiadiscono da 760, spariscono a 800 [C]. `barnruin` arma
  due volte `alarm[1]` e mai `alarm[2]`: spariva a 760 senza sbiadire;
  qui come le altre.
- Le rovine di pietra (`castelloruin`, `torreruin`, `chiesaruin`) non
  avevano comportamento nel porting: §7.17. (Nella prima stesura di questa
  voce scrivevo che il loro Create non assegna `stone`: sbagliato, avevo
  letto solo l'inizio del file; l'autore se lo ricordava.)

### 7.9 Pioggia

Gocce 2,5 volte piu' spesse (scala verticale della forma `line`; stessa
lunghezza): a 1,5–2,5 px si vedevano poco.

### 7.10 Unita' prodotte verso un punto occupato

Due unita' prodotte di seguito ricevevano lo stesso posto (la spirale
attorno alla bandiera guarda solo le celle di chi e' gia' fermo); la
seconda, trovatolo occupato, spostava la meta a caso di 32–50 px a ogni
passo. Ora (`rallySpot`, pathing.js) il posto e' il centro di una cella da
64 px percorribile, libero da altri solidi e non gia' promesso a un'altra
unita' appena prodotta; se all'arrivo e' occupato se ne cerca un altro
(al piu' ogni 15 passi). Vale per caserma, stalla, arcieri e civili del
centro. Prova con 6 guerrieri verso una bandiera su un soldato fermo:
prima 4 ancora in movimento sullo stesso punto dopo 1500 passi (11
sovrapposizioni, meta spostata 90 volte), ora tutti fermi in posti
diversi. Il contatore dei passi del mondo ora si salva (le attese "fino al
passo N" ripartivano da 0 dopo un caricamento).

### 7.11 G2: scelta della texture

Lo shader sceglie la texture con un albero di confronti (4 invece di fino
a 16) e la legge con `textureLod(…, 0)`: le texture non hanno mipmap,
quindi i pixel sono identici (hash uguali in menu, `match`, `lvl01`), ma
una lettura senza derivate puo' stare in un ramo vero anche su ANGLE/
Direct3D, che con `texture()` tende ad appiattire i rami e a leggere tutte
le unita'. In SwiftShader non cambia nulla (esegue comunque tutti i rami).
La variante "una sola lettura" con texture a strati costerebbe 70–130 MB
di memoria GPU in piu' (pagine portate a 2048×2048, terreno ritagliato) o
un rifacimento di `tools/05_atlas.py`: resta da decidere col dato di F3.

### 7.12 Passaggi con shader propri; sfocatura della pausa

`gl.js`: `pass(name, …)` disegna un rettangolo con un programma dedicato
(vertici da `gl_VertexID`, nessun buffer), `blur` fa una gaussiana
separabile con letture bilineari a coppie, `grab` copia la superficie
corrente ridotta (blitFramebuffer). Pausa: la scena a piena risoluzione,
poi a meta', poi la gaussiana (sigma 7 texel a meta' risoluzione, 14 px di
schermo) invece di tre dimezzamenti fino a 1/8 e un ingrandimento (a
blocchi). Calcolata una volta all'apertura (e quando cambiano lingua,
opzioni o finestra); i fotogrammi seguenti copiano il risultato.

### 7.13 Nebbia senza scalini; G3

La nebbia e' una griglia a celle da 16 px (§3.15) letta col filtro
lineare: i contorni delle ellissi venivano a rombi e scalini. Ora si
legge col filtro bicubico (B-spline, 4 letture bilineari): curve morbide,
bordo largo come prima. Nebbia e notte si compongono in un programma
(`fog`) su una superficie piccola (un texel ogni 4 px di room) all'inizio
del fotogramma, prima del mondo, e si sottraggono alla depth del manager
con un solo quad (prima due quad a schermo intero di notte). Costo in
SwiftShader: `lvl01` (notte con fuochi) da 65 a 28–36 ms di nebbia, `match`
e `lvl02` pari entro il rumore (il quad a schermo intero con la miscela
"subtract" pesa ~25 ms in SwiftShader, c'era anche prima).

### 7.14 Interfaccia di vetro

Opzione "Interfaccia di vetro" (attiva di norma, tradotta). A ogni
fotogramma il mondo appena disegnato si copia a meta' e a un quarto di
risoluzione e si sfoca (sigma 3 texel); i pannelli bianchi semitrasparenti
(rettangoli arrotondati e cerchi pieni con alpha fra 0,05 e 0,95) si
disegnano col programma `glass`: lo sfondo sfocato dentro la forma
(distanza con segno del rettangolo arrotondato, bordo sfumato), piegato
verso l'interno vicino al bordo come da una lente, un po' piu' saturo e
schiarito (si legge anche sopra il nero della nebbia), un riflesso in
alto a sinistra e un filo di luce sul bordo; sopra, il bianco originale al
65%. Il pannello della pausa usa lo sfondo gia' sfocato. Costo misurato
(SwiftShader): entro il rumore (0–5%).

### 7.15 G5: erba piu' rada con la qualita' piu' bassa

Erba e spighe (2500–4000 fili disegnati a ogni fotogramma): Alta tutte,
Media 70%, Bassa 50%. Il sottoinsieme e' sempre lo stesso (scelto dalla
fase del movimento, fissata alla nascita): niente sfarfallio.

### 7.16 G4: suolo cotto in blocchi

`ground.js`: lo sfondo ripetuto e le decorazioni del suolo (`traccia*`,
`strada_*`, `chiazza01`, `erba_1`, `prato1`: ferme, senza eventi, a depth
0) si disegnano una volta in blocchi da 512 px di room, a 1 texel per
pixel come i loro atlas (nessun dettaglio perso), con un texel di bordo
contro le cuciture; a ogni fotogramma un quad opaco per blocco. Al piu' 48
blocchi in memoria (1 MB l'uno), riusati dal meno recente. Immagine
uguale (menu e `lvl02` identici al pixel, in `match` un pixel diverso di
2/255). Disegno: `lvl02` 126–134 → 94–106 ms (-25%), `match` 139–159 →
126–150 (-10%), menu pari. Unica differenza d'ordine: il suolo ora sta
sotto anche ai fiumi e alle montagne in cima alla mappa (y < 0, depth
> 0), che prima finivano sotto le strade.

### 7.17 Rovine di pietra; meta dentro un ostacolo

Domanda dell'autore: "mi pare fosse 75 o comunque una frazione
dell'edificio". Il Create delle rovine assegna [C]: `castelloruin` 500,
`torreruin` 100, `chiesaruin` 75. Nel porting non avevano comportamento
(non si esaurivano, non segnavano la griglia, nessuna scheda). Ora sono
risorse di pietra come `pietra_grande` e `pietr_piccolo` (`resource` in
civilians.js: visibilita' a 400 px, clic destro, scheda, `*_morente` che
sbiadisce), e nascendo a partita in corso segnano le loro celle (Create
[C]).

Provandole e' venuto fuori un difetto dei percorsi: la rovina nasce dopo
che il civile ha calcolato il suo campo, quindi `scr_find_valid_cell_
backwards` (che guarda il campo vecchio) sceglie come meta una cella ora
chiusa; la ricerca in ampiezza partiva da li' e non usciva dal blocco di
celle chiuse: campo vuoto, civile fermo. Correzioni (pathing.js):
- `goalField`: con la meta dentro un ostacolo si percorre il blocco di
  celle chiuse che la contiene (al piu' 4096) e la ricerca parte, a valore
  1, dalle celle libere del suo bordo piu' vicine alla meta (al piu' una
  cella piu' lontane della piu' vicina: il blocco puo' comprendere gli
  edifici accanto). Vale anche per i nemici.
- `moveFlowField`: nel punto piu' basso del campo (cella con un valore ma
  nessuna vicina piu' bassa) si va verso la destinazione con
  `mp_potential_step`; se si e' sovrapposti a un'altra unita' ci si separa
  senza collisioni (verso la meta se non si entra in una cella chiusa, se
  no lontano dall'altra). La via d'uscita del §7.6 resta per le celle
  senza valore.

Prova: torre, chiesa e castello costruiti in un punto libero di `match`,
distrutti, due civili sulla rovina: torre esaurita in 4500–5000 passi,
chiesa in 3900, castello 418 su 500 in 60000 (deposito a 700 px). Prima
della correzione dei percorsi una rovina nata accanto al centro restava
intatta. Le prove precedenti (mischia, magazzino, unita' prodotte,
assedio) danno gli stessi risultati.

## Fase 8 — terza tornata di richieste dell'autore (7 ottobre 2026)

Prove: `npm test` (50), 3000 passi nelle quattro room senza errori,
salvataggi identici, zip dei portali, e una prova mirata per voce
(scenari sotto, con `window.__game`).

### 8.1 Menu principale

I quattro pulsanti della schermata iniziale ("Play the tutorial",
"Campaign - Collapse", "Load game", "Full screen") stanno in una colonna
al centro, larghi 400 e alti 70 (prima 100; "Load game" e "Full screen"
erano in alto a destra e a sinistra), a 20 px l'uno dall'altro; l'ultimo
finisce a 100 px dal fondo. Il logo sta a meta' dello spazio sopra la
colonna (al piu' a y=350). La versione in basso a sinistra e' **0.2601**
(l'originale scriveva 0.250125); la firma al centro e' "Mount Fuji
Software, 2026" (era 2025). `menu.js`, `titleButtons`.

### 8.2 Campagna: vetro sulla mappa, solo i livelli giocabili

- Lo sfondo dei pannelli di vetro (§7.14) si cattura dopo il mondo, prima
  del Draw GUI; la mappa della campagna si disegna nel Draw GUI, quindi
  l'elenco dei livelli mostrava sfocata la battaglia del menu e
  "tagliava" la mappa. Ora `Draw.refreshGlass()` ricattura lo sfondo dallo
  schermo dopo la mappa (una sfocatura in piu' per fotogramma, solo in
  questa schermata e solo col vetro attivo).
- L'elenco mostra solo i livelli sbloccati e giocabili: spariscono i
  bloccati e i 3–10 "in arrivo" (§0.15), il pannello si accorcia di
  conseguenza.

### 8.3 Dare fuoco agli edifici: posti attorno all'edificio

Segnalazione: con piu' unita' a dare fuoco allo stesso edificio "si
incasinano", come in mischia prima del §7.7. Nell'originale i fanti vanno
verso il centro dell'edificio (`mp_potential_step`) e cominciano a 70 px;
in piu' la loro destinazione, dentro l'edificio, e' "occupata" e il
blocco "destinazione occupata" la sposta di 32 px verso l'unita' a ogni
passo, finche' l'unita' ci arriva e si ferma **senza dare fuoco** (resta
con `firework` 1). Correzioni:
- chi va a dare fuoco punta a un posto attorno all'edificio
  (`meleeSpot(..., FIRE)`, melee.js): settori di 30 gradi e, se il posto
  vicino e' occupato da alberi o altri edifici, piu' in fuori (12, 32 o
  52 px dal bordo: il fuoco parte entro 70); il posto diventa la meta
  (`dirox`/`diroy`), che non si sposta piu'. La regola "a contatto: resta
  dov'e'" vale solo in mischia;
- chi e' sovrapposto a un alleato (col flow field si passa uno
  sull'altro) va dritto verso il proprio posto, senza attraversare edifici
  e alberi, e comincia a dare fuoco solo quando si e' separato (o dopo 60
  passi bloccato cosi');
- i nemici (frecce incendiarie da 200 px) usano gli stessi posti.

| prova: 8 fanti da 400 px, 11 edifici di `lvl02` e `match` | prima | dopo |
|---|---|---|
| fanti che danno fuoco dopo 120 passi | 30/88 | 42/88 |
| fanti che danno fuoco dopo 480 passi | 33/88 (gli altri fermi) | 80/88 |

Dare fuoco anche da sovrapposti farebbe arrivare a 82/88, ma con 5 volte
le sovrapposizioni (89 coppie contro 17): proprio l'effetto da evitare.

### 8.4 Spostamenti di gruppo: tolto il ricalcolo "cella occupata"

L'originale, quando la cella d'arrivo diventava un ostacolo (il primo
arrivato ci si fermava), ricalcolava il campo degli altri verso la cella
libera piu' vicina (§6.1 n.89). Con le caselle della formazione (§6.1
n.89) ognuno ha gia' una destinazione sua: richiesta dell'autore, il
ricalcolo e' tolto da fanteria, cavalieri e arcieri e, nei civili, resta
solo per il cibo (campi e mulino). Tre ordini a 14 unita' di `lvl02`
danno gli stessi arrivi di prima.

### 8.5 Dissolvenza fra gli sprite

Le fasi dei cantieri (casa, caserma, stalla, chiesa, torre, castello,
mura), l'edificio finito che sostituisce il cantiere e i danni degli
edifici di pietra (castello, chiesa, torre: normale, `*_r1`, `*_r2`)
cambiano sprite in dissolvenza: `World.swapSprite` (30 passi, mezzo
secondo). Nella prima meta' lo sprite nuovo compare sopra il vecchio,
nella seconda il vecchio sparisce sotto il nuovo: niente trasparenze a
meta' strada. Solo disegno: maschere e logica non cambiano.

### 8.6 Zoom

Zoom massimo (allontanato) da 2,0 a **1,7** (`ZOOM_MAX`, camera.js); i
salvataggi fatti oltre tornano a 1,7. Il suggerimento "Visuale" del
tutorial dice che si puo' usare la rotella del mouse, nelle sei lingue.

### 8.7 Gruppi di unita': Shift + numero

Nell'originale Ctrl + cifra assegna i selezionati al gruppo N, la cifra
da sola lo riseleziona [C]. Nel browser Ctrl + 1–9 e' la scorciatoia del
cambio di scheda (Chrome, Edge, Firefox; Cmd + cifra su Mac) e Chrome ed
Edge non la lasciano bloccare alla pagina. Decisione dell'autore: i gruppi
si assegnano solo con **Shift + cifra** (Shift non aveva usi); Ctrl +
cifra non fa piu' nulla nel gioco e il browser resta libero di cambiare
scheda.
- Shift si legge al keydown della cifra (`pressedShift` in input.js),
  non al passo: con fotogrammi lenti il modificatore poteva essere gia'
  rilasciato e la cifra riselezionava il gruppo invece di assegnarlo
  (succedeva anche con Ctrl nell'originale);
- il suggerimento "Selezione multipla" dice Shift + numero, nelle sei
  lingue.

Prova (Chromium, `lvl02`): tre militari con Shift + 2, poi 2 riseleziona
esattamente quel gruppo.

### 8.8 Barra della vita a pillola

Richiesta dell'autore, per coerenza con i pannelli arrotondati: le barre
della vita (unita', civili, edifici, mura, nemici, torre col presidio)
sono a pillola: fondo nero arrotondato che fa da bordo di 1 px, parte
piena (verde o blu) arrotondata anche lei, negli stessi pixel delle barre
rettangolari dell'originale (`Draw.lifeBar`). Prima ogni oggetto
disegnava i suoi due rettangoli.

### 8.9 Punto di raccolta: bandierina e linea tratteggiata

Richiesta dell'autore: il punto verso cui vanno le unita' prodotte da un
edificio (centro, caserma, stalla, castello...) era segnato con la freccia
`director_blue` e una linea bianca piena dal punto di uscita [C]. Ora e'
la bandierina arancione animata del presidio alleato (`rflag`, 3
fotogrammi a 0,1 per passo; `bflag`, blu, e' delle torri nemiche) al 60%
di opacita', e la linea e' tratteggiata (tratti di 14 px,
vuoti di 10): `Draw.rallyFlag`, `Draw.rallyLine`, `Draw.dashedLine`. La
freccia resta per la destinazione delle unita' selezionate. Poi, su
richiesta dell'autore, la linea passa **sotto** l'edificio: si disegna in
un nuovo evento `drawBelow` che `World.draw` chiama dopo il suolo e prima
di tutte le istanze (quindi sta sotto anche a unita', alberi, campi e
agli altri edifici, e di notte si scurisce col resto del terreno); la
bandierina resta nel Draw End, sopra.

### 8.10 Barra della vita in stile vetro

Richiesta dell'autore: un minimo di effetto vetro anche sulla barra della
vita. Niente sfocatura: a 8 px non si vedrebbe, e le barre sono disegnate
nel mondo, prima della copia sfocata che fa da sfondo ai pannelli (§7.14);
con molte unita' selezionate sarebbero decine di passaggi in piu'. Con
l'opzione "Interfaccia di vetro" (`Draw.glassStyle`, da app.js) la pillola
del §8.8 ha il fondo nero al 55% (il terreno si intravede), un bordo
bianco di 1 px al 45% al posto di quello nero e un riflesso bianco al 22%
nella meta' alta della parte piena (provato al 40%: l'autore lo voleva
piu' tenue; sparisce sotto i 5 px di parte piena). Senza l'opzione resta
la pillola del §8.8. Di notte il bordo chiaro stacca la barra dal blu
meglio del bordo nero.

### 8.11 Formazione per ruolo

Richiesta dell'autore: nello spostamento di gruppo, davanti i cavalieri,
poi guerrieri e picchieri, arcieri, macchine d'assedio e in fondo i
civili. In `formation` (units.js) le righe ora vanno per ruolo (`ROLE`);
ogni ruolo comincia una riga nuova (un gruppo piccolo fa una riga corta,
centrata) e dentro un ruolo le prime righe vanno a chi arriva prima; in
ogni riga resta l'ordine laterale attuale. Le caselle sono giuste da
subito; perche' le unita' ci arrivassero sono servite tre correzioni,
tutte vere anche prima (con l'ordine d'arrivo i sorpassi erano rari e i
difetti si vedevano meno):
- **destinazione occupata**: se sulla casella passava un compagno, la
  regola dell'originale spostava la meta verso l'unita' (32–50 px a
  passo) finche' l'unita' "arrivava" dov'era. Sulla casella della
  formazione (`formX`/`formY`, `onFormationSlot` in pathing.js) la regola
  non si applica: fanteria, cavalieri, arcieri, civili, assedio;
- **sorpassi**: chi deve finire davanti spesso parte dietro e si fermava
  contro chi era gia' arrivato. Verso la propria casella si passa sopra
  gli alleati (`World.placeFreeExcept`/`placeFreeForSlot`, in
  `mpPotentialStep` e nella scelta fra flow field e passo diretto), mai
  attraverso edifici e alberi; il guerriero non si ferma piu' quando tocca
  un alleato di rango piu' alto (nearRank) mentre va alla casella. Se la
  casella resta occupata, l'arrivo "per rinuncia" (§6.1 n.89), ora anche
  per le macchine d'assedio;
- **stallo con l'assedio**: le macchine non hanno `ordo`; chi le toccava
  in movimento aspettava (confronto con undefined sempre falso) e loro,
  solide, restavano ferme contro di lui. Ora sulle macchine si passa.

Prova: 19 unita' (3 cavalieri, 4 guerrieri, 3 picchieri, 4 arcieri,
catapulta, ariete, 3 civili) sparse a caso in una zona aperta di `match` e
di `lvl02`, nemici tolti, ordine a 700–800 px in cinque direzioni, 20 s.
"Inversioni": coppie di ruoli diversi nell'ordine sbagliato lungo la
marcia (oltre 20 px).

| 10 ordini | prima | dopo |
|---|---|---|
| inversioni (su 137 coppie per ordine) | 22–65 | 0 (una volta 3) |
| unita' a piu' di 400 px dalla meta | 4–13 per ordine | 0 |
| unita' fuori dalla propria casella | 1–5 | 0 |

Con le 14 unita' gia' presenti in `lvl02` (ordini verso punti
raggiungibili) ora arrivano tutte; prima ne restavano indietro 4–7.

### 8.12 Menu di pausa senza pannello

Richiesta dell'autore: tolto il grande rettangolo arrotondato che
conteneva titolo e pulsanti; i pulsanti stanno direttamente sullo sfondo
sfocato e scurito. Il titolo (PAUSA, OPZIONI GRAFICHE, SALVA E CARICA) e
le didascalie dei controlli a segmenti (Lingua, Limite FPS) hanno un alone
bianco morbido per staccare dallo sfondo (`_glowLabel` in pause.js: copie
bianche del testo su cinque anelli da 5 a 1 px, 16 direzioni, opacita' dal
4% al 20%, poi il testo nero).

### 8.13 Anelli delle gocce sul fiume

Richiesta dell'autore: quando piove, anelli delle gocce sull'acqua del
fiume.
- **Dove c'e' acqua**: gli sprite del fiume (`fiume1`... `fiume2_3`, fino
  a 2179x1210 px) contengono anche la roccia della montagna, quindi la
  maschera di collisione non basta. `tools/06_masks.py` aggiunge alle
  maschere dei `fiume*` una mappa dell'acqua in celle da 8 px: una cella
  e' acqua se almeno il 60% dei suoi pixel e' verde-azzurro ((g+b)/2 - r >
  8; la roccia e' grigia). Nel gioco la mappa della room si compone una
  volta dalle istanze del fiume (`waterMap` in effects.js).
- **Anelli**: la forma `pt_shape_ring` di GameMaker (`__pt_ring` in
  `tools/05_atlas.py`: anello di raggio 27 px con 7 px di tratto
  sfumato). A ogni passo di pioggia 36 punti a caso nella view; dove c'e'
  acqua nascono due anelli concentrici schiacciati a meta' in altezza
  (vista isometrica), che si allargano (fino a ~35 px) e sbiadiscono in
  meno di un secondo. Sistema di particelle a depth -21 (sopra il fiume e
  la sua animazione, sotto unita' ed edifici), categoria "rain": si spegne
  con la pioggia nelle opzioni grafiche e si salva con le altre
  particelle.
- Prove: `match` col fiume in vista, 100–200 anelli vivi; soak e
  salvataggi senza errori, salvataggio durante la pioggia.

### 8.14 Macchine d'assedio col flow field "largo"

Segnalazione dell'autore: ariete e catapulta si incastravano di continuo.
Nell'originale non hanno flow field [C]: vanno solo con
`mp_potential_step` verso dirox/diroy, e con un edificio, un bosco o un
fiume in mezzo spingevano contro l'ostacolo. Richiesta: dargli il flow
field, ma meno permissivo nei passaggi (sono ingombranti: non passano dove
passa un soldato).
- **Ostacoli fissi**: `Pathing.solid` segna le celle di edifici, elementi
  naturali e mura (`markInstance`), senza quelle occupate dalle unita'
  ferme (un'unita' ferma resta un ostacolo di una cella sola). Si salva con
  la griglia dei costi; nei salvataggi di prima si ricava dai costi.
- **Campo largo**: `wideMask` chiude le celle a meno di `SIEGE_CLEAR` (1)
  celle, anche in diagonale, da un ostacolo fisso (per i nemici anche dalle
  porte); `goalField(..., wide)` le salta. Il centro della macchina sta solo
  dove ci sono 3x3 celle libere: servono varchi di almeno 3 celle (96 px;
  la maschera e' 111x96), un soldato ne usa uno di una. I varchi delle
  porte (3 celle fra i pilastri) restano percorribili.
- **Movimento** (`siegeMove` in pathing.js): come la fanteria, lontano
  (oltre 400 px) col flow field, vicino con `mp_potential_step` se la meta
  e' in vista, se la macchina e' in fondo al campo o nella fascia attorno a
  un ostacolo (l'ariete che va a colpire un edificio), e solo se non e'
  sovrapposta a niente (col campo si muove senza collisioni e puo' sfiorare
  un albero: da li' `mp_potential_step` non la muoveva piu'). Il campo e'
  della macchina (`siegeField`) e si ricalcola quando la meta cambia cella:
  subito se si sposta di oltre 3 celle, se no al piu' ogni 15 passi (i
  nemici spostano la meta a caso quando e' occupata, l'ariete alleato la
  arretra di 50 px).
- **Meta irraggiungibile** (varco troppo stretto, l'altra riva): il campo
  porta alla cella raggiungibile piu' vicina alla meta (`nearestReached`,
  con una ricerca dalla macchina) e li' la macchina arriva, invece di
  spingere contro l'ostacolo.
- **Arrivo per rinuncia** (§6.1 n.89) anche per i semplici spostamenti
  delle macchine alleate (non all'attacco di un edificio).

Prova: un ariete o una catapulta alla volta, nemici tolti, verso 12 punti
a caso a oltre 900 px (fino a 10000 passi).

| arrivate entro 64 px | prima | dopo |
|---|---|---|
| `match` (4000 passi) | 0/12 (quasi tutte ferme vicino alla partenza) | 5/12 |
| `lvl02` | 4/12 | 12/12 |

In `match` le altre sono state distrutte dalle torri nemiche lungo la
strada o avevano una meta irraggiungibile per la macchina (si sono fermate
nel punto piu' vicino). In `lvl01` il sud comunica col nord solo con
corridoi nel bosco di 1–2 celle: da sud una macchina raggiunge 2 dei 28
edifici nemici (un soldato tutti), finche' i civili non aprono un varco
tagliando alberi. Per renderle piu' o meno ingombranti basta cambiare
`SIEGE_CLEAR`.

### 8.15 Costi di ariete e catapulta nella scheda del castello

Segnalazione dell'autore: nella scheda di ariete e catapulta il costo in
legno a tre cifre ("250", "200") finiva sopra l'icona del legno, che
restava a x=90 come per i costi a due cifre. In `unitClicker` (production.js)
le posizioni dell'originale restano dove c'e' spazio; altrimenti ogni icona
sta 6 px dopo il suo numero (misurato con `stringWidth`) e ogni numero 12
px dopo l'icona prima. Anche il "3" della popolazione non tocca piu'
l'icona.

### 8.16 Campi di grano a righe

Richiesta dell'autore: spighe con un leggero contorno nero, a righe
orizzontali ognuna con depth -y (il contadino "immerso" nel grano), e il
fondo del campo coltivato uguale al campo vuoto ma giallastro come le
spighe, al posto delle righe di verdure di `campo1`.
- **Sprite derivati** (`derived_sprites` in tools/05_atlas.py, generati
  con l'atlas come le forme delle particelle): `spiga` e' `part_crop` a
  meta' risoluzione, senza contorno. `campo_grano` e' `campo_maggese`
  ricolorato: ogni pixel tiene la luminosita' relativa alla media della
  terra arata (solchi, grana, bordo scuro) e prende un color paglia scuro
  (165, 126, 66), cosi' le spighe si staccano dal fondo per tono. Un tint
  moltiplicativo (image_blend) sulla terra arata arancione non arriva al
  giallo paglia: per questo e' uno sprite a parte.
- **Stile**: confronto fra cinque varianti (contorno nero di 1 px all'80%,
  contorno morbido bruno al 35%, senza contorno, e le ultime due col fondo
  piu' scuro). Il contorno nero "sbatteva" con l'acquerello del resto della
  mappa; senza contorno, col fondo dello stesso colore, le spighe
  sparivano. L'autore ha scelto prima il contorno morbido col fondo scuro,
  poi senza contorno col fondo scuro.
- **Righe** (`cropRows` in effects.js): una riga ogni 12 px nel rombo del
  campo, ognuna un sistema di particelle a depth -y della riga (categoria
  "grass": si spegne con l'opzione grafica e si salva come prima). Spighe
  ogni 9-13 px lungo la riga (+-2 px), opache, tinte fra (255, 226, 150) e
  (255, 210, 118), dimensione 0,7-1; ondeggiano come prima. Le righe piu'
  in basso del contadino si disegnano dopo di lui e lo coprono fino a
  meta'. Circa 180 spighe per campo invece di 700.
- Il campo in fiamme resta com'era (terra arata, spighe bruciate). Il
  fantasma del piazzamento usa `campo_grano`. Le spighe decorative sparse
  sulla mappa (`burst_grano1`) non sono cambiate.

### 8.17 Spighe decorative a fasce

Richiesta dell'autore: le spighe sparse sulla mappa (`burst_grano1`, 2500
per macchia in un'ellisse di 1000x600 px) come il grano dei campi (§8.16),
con la depth -y, le unita' che ci passano in mezzo immerse.
- `Particles.bands(ps, h)` divide le particelle di un sistema in fasce
  orizzontali alte h px, un sistema per fascia a depth -y della meta' della
  fascia (al piu' h/2 px di scarto dalla depth -y di ogni spiga).
  `decorCreate` sparge le spighe come prima (stesse particelle, stesso
  aspetto: semitrasparenti, senza contorno) e le divide in fasce da 12 px:
  44-47 sistemi per macchia. Dal §8.18 anche l'erba.
- Costo: in `match` i sistemi di particelle passano da 13 a 191, nel menu
  da 70 a 295; l'ordinamento per depth costa 0,03 ms a fotogramma, le
  particelle disegnate sono le stesse, fotogrammi al secondo invariati. Il
  salvataggio di `match` cresce di ~60 KB (~30 KB compresso).
- I salvataggi di prima tengono le spighe nel sistema unico a -1.

### 8.18 Macchie d'erba a fasce, verdi variati

Richiesta dell'autore: le macchie d'erba (`burst_erba1`, 2600 fili, e
`chiazzaparticellare`, 1700 trattini) con le fasce a depth -y del §8.17, e
colori piu' vari: erano tutte scurissime perche', a depth -1 sotto ogni
cosa, si sovrapponevano in modo strano.
- Fasce da 12 px per tutte le macchie decorative (`decorCreate`).
- **Colore dell'erba**: `part_erba` e' gia' verde scuro (media 76, 94, 56)
  e la particella lo moltiplicava per un altro verde scuro (61-90, 77-102,
  46-61): a schermo quasi nero, e una tinta moltiplicativa non puo'
  schiarire. Nuovo sprite derivato `erba_chiara` (part_erba in grigio
  chiaro, stessa grana e alpha, tools/05_atlas.py) colorato dalla
  particella in tre gruppi: verde scuro (1100 fili), verde medio (1000),
  verde chiaro tendente al giallo (500); alpha 0,35-0,75. I gruppi nascono
  in ordine sparso (l'ordine di nascita e' quello di disegno). Una prima
  prova piu' chiara si confondeva col terreno.
- I trattini di `chiazzaparticellare` tengono i loro colori.
- Costo: in `match` 237 sistemi di particelle, nel menu 344; ordinamento
  0,01-0,05 ms a fotogramma, fotogrammi al secondo invariati.

### 8.19 Civili: raccolta, consegna, sovrapposizioni

Segnalazione dell'autore: i civili ogni tanto si incastrano (fermi in
cammino, sovrapposti fra loro, da soli in giro su un percorso
"rettangolare"), soprattutto nella raccolta; mandati al magazzino a
consegnare, si fermano prima. Prove nuove nel browser:
`game/test/browser/workers.mjs` (gruppi mandati col clic destro a legno,
oro, pietra e cibo; consegne, civili fermi, sovrapposizioni) e
`deposit.mjs` (civili carichi mandati col clic sul deposito). La
simulazione e' deterministica: ogni caso si riproduce e si osserva passo
per passo.

Cause trovate e correzioni (tutte in civilians.js):
- **Percorso verso la risorsa** (`fieldTo`). Per andare a una risorsa si
  usava `scr_move`: le celle della risorsa sono ostacolo, quindi cercava in
  quadrati crescenti una cella raggiungibile e prendeva la prima scorrendo
  dall'angolo in alto a sinistra, non la piu' vicina: in un bosco anche a 8
  celle dall'albero, dall'altra parte. Il civile ci arrivava e poi andava
  dritto, con le collisioni, verso l'albero attraverso il bosco: fermo o
  avanti e indietro. In piu' il tagliaboscaioli cambiava albero (quello
  abbattuto, o uno piu' vicino) senza un campo nuovo. Ora il campo va verso
  la risorsa stessa (goalField parte dal bordo libero piu' vicino alla
  meta), anche al clic, si ricalcola quando l'albero bersaglio cambia (al
  piu' ogni 20 passi, solo se ci si arriva) e quando miniera o pietra
  cambiano; se il civile non ci puo' arrivare resta `scr_move`. Un campo
  per meta e per passo, condiviso da chi va allo stesso posto.
- **Posti attorno alla risorsa** (`toWorkSpot`): come i soldati in mischia
  (melee.js, §7.7), settori di 30 gradi a contatto o 8 px piu' in fuori, un
  civile per settore. Prima tutti andavano verso il centro della risorsa
  (oro e pietra: della piu' vicina al civile) e arrivavano alla stessa
  cella. Il "vicino" (100 px) si misura dal bordo della risorsa, non dal
  centro (da una miniera grande il centro restava oltre i 100 px anche a
  contatto).
- **Cominciare a lavorare**: non piu' "cella libera" (costo < 1000) ma
  "nessun altro civile addosso". Con i posti due civili lavorano anche
  nella stessa cella da 32 px; prima il secondo spingeva finche' il primo
  non se ne andava, e col flow field (senza collisioni) due arrivavano uno
  sull'altro e lavoravano sovrapposti.
- **Staccarsi** (`separate`): vicino alla meta, un civile addosso a chi
  cammina o lavora si allontana da tutti insieme (somma delle direzioni;
  se il passo entra in un ostacolo prova a 45 e 90 gradi). Prima ci si
  allontanava da una sola cosa: chi toccava un compagno e la miniera
  oscillava di 2 px all'infinito, e il compagno lo aspettava per sempre.
  Sopra chi e' fermo si passa, come prima.
- **Precedenza** (quella dell'originale: passa chi ha l'ordo piu' basso,
  l'altro aspetta): resta, ma chi aspetta da 60 passi di fila (1 s)
  riparte, all'80% della velocita' finche' e' sovrapposto. Sulla strada fra
  miniera e deposito gli passava sopra un portatore dopo l'altro e il
  civile con l'ordo piu' alto aspettava per sempre (osservato: quattro
  compagni diversi in 130 passi). Prove scartate: un limite di 30 passi a
  piena velocita' (due civili camminavano poi per sempre uno sopra
  l'altro), spostarsi di lato (uscivano dal percorso e si bloccavano), la
  precedenza senza limite (30 civili fermi nella prova piu' dura).
- **Consegna su ordine**: col carico, il clic su un deposito che lo prende
  (legno, oro, pietra: centro o magazzino; cibo: mulino o centro) e' un
  ordine di consegna (`depositTo`). Prima era un semplice spostamento verso
  il centro dell'edificio, e la regola "punto d'arrivo occupato" (azioni 9 e
  11) spostava la meta di 50 px verso il civile a ogni passo finche' non era
  fuori dall'edificio: si fermava a 14-200 px, oltre i 10 della consegna.
  Ora ognuno va a un posto sul bordo del deposito, consegna e si ferma li';
  se in 10 s non ci riesce si ferma dov'e'. Il cibo al magazzino resta un
  semplice spostamento (il magazzino non e' un granaio).

Prove (`match`, civili creati attorno al centro, nemici tolti):

| | prima | dopo |
|---|---|---|
| 16 civili, 2,5 min: legno / oro / pietra / cibo | 460 / 390 / 160 / 430 | 490 / 450 / 210 / 390 |
| 27 civili, 5 min: legno / oro / pietra / cibo | 520 / 790 / 430 / 630 | 1650 / 1520 / 650 / 740 |
| 27 civili: fermi in cammino (eventi) | 26 | 0 |
| 27 civili: cammino ininterrotto piu' lungo | 17601 passi (mai arrivato) | 2256 |
| 27 civili: civili al lavoro sovrapposti (campioni) | 862 su 2062 | 0 su 4009 |
| clic sul deposito con 8 civili carichi (centro / magazzino) | 6 / 4 consegnano | 8 / 7 (l'ottavo porta cibo) |
| un civile carico, clic sul magazzino | non consegna | consegna |

In `lvl02` (centro creato per la prova, 14 civili, 3,3 min): legno 550 ->
650, oro 330 -> 490, fermi 11 -> 0, sovrapposti al lavoro 290 -> 0. Il
cibo (contadini) era gia' a posto e resta com'era. Soak e salvataggi senza
errori.

---

## Fase 9 — livelli della campagna in Tiled (9 ottobre 2026)

L'autore ha scaricato Tiled; questa sessione prepara il kit per disegnare
le mappe dei livelli 3–10 ("Prossima sessione", in cima). Tre file nuovi
in `tools/`: `tiledkit.py` (categorie, geometria, comune ai due script),
`11_tiled_kit.py` (il kit) e `12_tiled_import.py` (mappa -> scenario).

### 9.1 Il kit

`python3 tools/11_tiled_kit.py` (dopo `01`, `02`, `07`; 30 s) scrive
`build/535-tiled-kit/` e lo zip `build/535-tiled-kit.zip` (31 MB); la CI
lo pubblica come artefatto `535-tiled-kit` di ogni run, cosi' l'autore
non ha bisogno di Python. Dentro: `LEGGIMI.md` (istruzioni per l'autore),
`535.tiled-project`, `kit.json`, `tileset/*.tsx`, `img/`, `mappe/`.

- **Nove tileset** "collezione di immagini", 222 tile: terreno (strade,
  sentieri, prati, erba, fiori), montagne e fiumi (con le chiazze),
  natura (alberi, erba alta `graa1x`, macchie d'erba e di spighe,
  aquila), risorse (oro, pietra, rovine), edifici del giocatore (anche
  mura, porte, cantieri `*_fond`, bandierine), unita' del giocatore,
  nemici (edifici, casse, unita'), citta' romana (con statue, colonne,
  fontane), regia (manager, segnali, i 50 suggerimenti e dialoghi). La
  tile ha come classe il nome dell'oggetto GameMaker e la proprieta'
  `sprite`. Il catalogo e' in `tiledkit.py` (`category`): ci sono tutti
  gli oggetti delle room portate (lo script si ferma se ne manca uno) e
  quelli della stessa famiglia; fuori pulsanti, proiettili, cadaveri,
  `*_morente`, placer e oggetti di sistema.
- **Varianti**: per gli oggetti che nel Create scelgono lo sprite a caso
  (`albero` alb1..alb8, `casa`, `enemy_house`, `chiazza01`) una tile per
  variante, stessa classe. Nel gioco lo sceglie ancora il gioco; lo
  scenario ricorda la variante scelta (`sprite`) per quando servira'.
- **Sprite del gioco**, non del progetto, dove sono diversi: `campo` e'
  `campo_grano` (§8.16), le macchie `burst_erba1`, `burst_grano1`,
  `chiazzaparticellare` (particelle senza sprite) sono un'immagine della
  macchia disegnata con le stesse particelle di `effects.js` (ellisse
  1000x600 gaussiana, colori, dimensioni, alpha); le unita' sono il primo
  fotogramma dello sprite dell'oggetto. I segnali di regia sono lo sprite
  dell'editor GameMaker (o un quadrato) col nome dell'oggetto sotto.
- **Mappe**: `mappe/nuova.tmx` (6000x6000, griglia di 50 px, un manager,
  la vista iniziale) e le room `match`, `lvl01`, `lvl02` convertite
  (esempi per l'autore e collaudo). `--nuova lvl03 4000x6000` ne aggiunge
  una vuota della misura data. Livelli dal basso: `sfondo` (livello
  immagine ripetuto, lo sfondo della room), `suolo`, `erba e spighe`,
  `terreno` (montagne, fiumi), `oggetti`, `boschi`, `regia`; `terreno` e
  `oggetti` "dall'alto in basso". I livelli sono solo per lavorare comodi:
  lo script li ignora (tranne `boschi`) e il gioco ordina per depth.
  Differenza nota: in Tiled `terreno` sta sempre sotto `oggetti`, nel
  gioco montagne e fiumi (depth -y, origine in alto a sinistra) si
  mescolano per y; si vede solo per un oggetto proprio sul bordo alto di
  una montagna o di un fiume. Le macchie d'erba in Tiled stanno sotto
  tutto; nel gioco a fasce (§8.18).
- **Progetto di Tiled** (`535.tiled-project`): la cartella del kit e la
  classe `bosco` (membri `distanza` 90 e `oggetto` albero).

### 9.2 Origini e ordine di disegno

Tiled ancora un oggetto-tile a un punto del riquadro dell'immagine
(`objectalignment` del tileset, in basso a sinistra di norma) e con
l'ordine "dall'alto in basso" ordina per la y di quel punto; GameMaker
mette l'istanza nell'origine dello sprite e la depth -y ordina per la y
dell'origine. Con l'ancora in basso a sinistra l'anteprima di Tiled
avrebbe sbagliato l'ordine (un albero ha l'origine 47 px sopra il fondo
dell'immagine) e ruotato attorno all'angolo. Quindi **ogni immagine del
kit e' ritagliata sull'alpha e allargata con bordo trasparente finche'
l'origine sta nel centro esatto**, e i tileset sono allineati al centro:
in Tiled la posizione dell'oggetto e' la x, y dell'istanza, l'ordine e'
quello del gioco, rotazione, scala e ribaltamento girano attorno
all'origine come in GameMaker.

Eccezione: montagne, fiumi e chiazze hanno l'origine in 0,0 [C] e sono
grandi (montagna10 2342x1461): al centro raddoppierebbero larghezza e
altezza (55 MB di memoria in Tiled per la sola montagna10). Stanno nel
tileset `montagne_fiumi`, allineato in alto a sinistra, che e' ancora
l'origine. In tutto le immagini occupano 217 MB nella memoria di Tiled.

La conversione (`tiledkit.py`, `to_tiled`/`from_tiled`) e' comunque
generale: per un allineamento (ax, ay) qualsiasi, ribaltamenti
(scala negativa) e rotazione (Tiled oraria = `image_angle` di GameMaker
col segno cambiato, verificato su `game/src/sprites.js` `drawSprite`).

### 9.3 Mappa -> scenario

`python3 tools/12_tiled_import.py mappa.tmx [--anteprima [scala]]` legge
la mappa e i tileset (per nome del file `.tsx`, che devono essere quelli
del kit), riconosce ogni oggetto dalla tile, riporta la geometria
all'istanza e scrive `scenari/<nome del file>.json`:

```
{"format": "535-scenario", "version": 1, "name", "width", "height",
 "background", "colour", "view": {x, y, w, h},
 "instances": [{"object", "x", "y", "scale_x", "scale_y", "rotation", "sprite"?}]}
```

- Ordine delle istanze: l'id degli oggetti di Tiled (l'ordine in cui sono
  stati messi), come l'ordine di creazione di una room.
- **Boschi**: ogni rettangolo, ellisse o poligono (anche ruotato) del
  livello `boschi` diventa alberi, campionamento di Poisson (Bridson) a
  `distanza` px (predefinita 90: i boschi di `match` hanno la distanza
  dal vicino piu' vicino a 74 / 107 / 136 px al 10°, 50°, 90° percentile),
  seme fisso (nome della mappa e id della forma: la stessa forma da' gli
  stessi alberi). Gli alberi prendono il posto della forma nell'ordine.
- Vista iniziale: il rettangolo di classe `vista` nel livello `regia`.
- Avvisi: tile o tileset che non vengono dal kit, classe cambiata a mano,
  forme fuori da `boschi`, manager mancante o doppio, vista mancante;
  unita', edifici e risorse con l'origine fuori dalla mappa, il resto solo
  se non se ne vede niente (l'autore mette montagne e chiazze a cavallo
  del bordo apposta). Nelle room dell'autore segnala 3 avvisi in `lvl01`
  (due mura con l'origine a x -150, una casa della citta' fuori mappa) e 4
  in `lvl02` (un muro sotto il bordo, tre `hint_legna` fuori dai 3200x8000
  della room, a x 6825 e 4871 e a y 8731 [C]).
- `--anteprima`: `build/anteprime/<nome>.png`, la mappa intera con le
  immagini del kit nell'ordine di disegno del gioco (suolo cotto sotto,
  poi depth decrescente, a parita' ordine di creazione) e i boschi
  riempiti; e' la "vista d'insieme" per l'autore.

### 9.4 Collaudo

- `12_tiled_import.py --check`: `match`, `lvl01`, `lvl02` -> kit -> scenario
  danno le stesse istanze di `data/rooms/` (oggetto, x, y esatti, scala a
  1e-4, rotazione a 1e-3, nello stesso ordine), stessa vista, misure,
  sfondo e colore: 460, 564 e 475 istanze identiche. Comprese le scale
  negative e le rotazioni di strade e sentieri (20 istanze in `match`, 10
  in `lvl02`). E' nella CI.
- Che Tiled disegni dove disegna il gioco: Tiled 1.8.2 (Ubuntu) con
  `tmxrasterizer` legge mappe e tileset del kit; il suo disegno e' stato
  confrontato con quello dell'anteprima (geometria di GameMaker, non quella
  del kit) nello stesso ordine. Una mappa di prova a scala 1 con case,
  un guerriero, una strada, il castello, una montagna, una chiazza e un
  fiume, ribaltati, scalati e ruotati in entrambi gli allineamenti:
  errore medio 0,5/255, lo 0,1% dei pixel oltre 60/255 (bordi
  ricampionati). Le tre room a scala 0,15: le differenze sono solo sui
  bordi (ricampionamento) e sul rettangolo della vista, che Tiled colora.
- Pennello bosco: rettangolo, ellisse e poligono ruotato riempiti (286
  alberi a 90 e 70 px, 68 `albero_fake` a 130 px), dentro le forme.
- Non provato: Tiled nella versione dell'autore (1.11 o successiva) a
  mano, col mouse. I file sono nel formato 1.10 (`type` per la classe,
  quello che Tiled 1.10+ scrive e 1.8 legge).

### 9.5 Cosa manca

- Il gioco non carica ancora gli scenari: servono `tools/07_scene.py`
  (scenari -> `game/assets/rooms/`), il nome nella lista delle room
  (`app.js` `ROOMS`, `menu.js`, `save.js` `SAVE_ROOMS`) e la regia del
  livello (`levels.js`, `manager` Create per `room==...`). Da fare col
  livello 3, quando ci sara' la prima mappa e l'idea del livello.
- Risorse iniziali e logica del livello: per ora nel codice (§0.15).
- Screenshot dal gioco per la vista d'insieme, quando il gioco carichera'
  gli scenari.

### 9.6 Trovato per strada

- `chiazza01` [C]: il Create sceglie `tipo=irandom_range(1,2)` e solo col 2
  passa a chiazza2; con l'1 resta lo sprite dell'oggetto, chiazza1.
  `tools/07_scene.py` vede un solo `sprite_index=` e da' a tutte chiazza2:
  nel porting le chiazze sono sempre chiazza2. Nel kit ci sono tutte e
  due. Da chiedere all'autore (raccomandazione: rimettere il caso, cambia
  l'aspetto delle room esistenti).
- `albero_debug` sta in `match` (una istanza) e non ha comportamento nel
  porting (non e' fra gli oggetti registrati in `app.js`): nel kit c'e' solo perche' il collaudo
  ritrovi tutte le istanze.

### 9.7 Maschere ruotate

Richiesta dell'autore (9 ottobre 2026), dopo il kit: poter ruotare in
Tiled anche montagne, fiumi ed edifici. Il porting ruotava solo il
disegno (`drawSprite`): bbox e collisioni (`world.js` `_bboxInto`,
`_spans`) seguivano scala e ribaltamento ma non `image_angle`. In
GameMaker la maschera ruota con lo sprite [I, runner GMS].

- `_bboxInto`: con `image_angle` (non multiplo di 360) la scatola e'
  quella dei quattro angoli della maschera girati attorno all'origine,
  con la stessa rotazione di `drawSprite`.
- `_spans` -> `_spansRot`: ogni pixel della riga (fra gli estremi chiesti)
  si riporta nella maschera non ruotata (rotazione inversa, poi la scala)
  e se ne prova il centro: precisa (righe di intervalli), rettangolo,
  ellisse, rombo; i pixel pieni consecutivi fanno un intervallo. Tutte le
  ricerche passano di li' (place_free, instance_place, collision_rectangle,
  instance_position, la griglia del pathfinding, gli eventi di collisione).
  `overlap` non prende piu' la scorciatoia "due rettangoli" se uno dei due
  e' ruotato.
- Senza rotazione il codice e' quello di prima (stessi risultati).
- Anche la mappa dell'acqua per gli anelli della pioggia (`effects.js`
  `waterMap`) segue la rotazione del fiume.
- Cambia anche per chi ruotava gia': frecce (`image_angle = direction`),
  proiettili delle macchine che girano su se stessi, l'albero ruotato di
  -2 gradi e i `directioner` di `lvl02`. Ora come in GameMaker.

Prove: `game/test/rotmask.test.mjs` (muro ruotato di 90: scatola, punti,
place_free; rettangolo, ellisse e "L" precisa ruotati, scalati e
ribaltati: ogni punto pieno della maschera riportato nella room e'
pieno, il buco della "L" resta vuoto; collision_rectangle e overlap a
45 gradi). Con le maschere vere (montagna_3 a 30 gradi, montagna_10 a
-75, fiume_2 a 140 ribaltato e schiacciato, casa, castello a 200): su
40.000 punti a caso la forma ruotata e quella dritta nel punto
corrispondente differiscono al piu' nello 0,1% (bordi: centro del pixel
contro intervallo esatto). La griglia del pathfinding di montagna_10 a 30
gradi ha 1284 celle piene contro 1283 da dritta; costa 53 ms una volta
(3 ms dritta). Nel gioco (`match`, montagna_3 ruotata di 35 gradi,
`initCost`) le celle piene seguono la montagna ruotata, col margine che la
maschera dell'autore ha gia' da dritta. Soak e salvataggi senza errori.
