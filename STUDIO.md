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

**Stato al 20 ottobre 2026** (branch `claude/festive-volta-f68pca`, §9.38-§9.50):
economia nemica completa nei livelli con un centro nemico (raccolta,
lavoratori, soldati pagati, riparazioni, ricostruzione, depositi nuovi,
difesa e ondate); sprite nemici tutti dell'autore; font Cinzel e titolo
"Dust Veil". Restano, per l'autore: la mappa del livello 4 (poi regia e
numeri `ECO.lvl04`, obiettivi); i segnaposto "cantiere nemico" in Tiled (se
servono ancora) e il kit aggiornato quando l'autore lo dice; il nome
"Dust Veil" nel resto del gioco (titolo della pagina, manifest, icone,
zip); i livelli 5-10; le voci qui sotto. [Prima dell'uscita] rimettere
`UNLOCK_ALL` a 1 in progress.js (§9.53: livelli 1-4 sbloccati per le prove; ora 1-6, §9.103). Allora (§9.164) le
prove nel browser che aprono un livello dall'indirizzo (`?room=lvl05`...)
finirebbero nel menu: devono scrivere prima lo sblocco in localStorage
(`535.progress`, `{ v: 1, unlock: 6 }`, con addInitScript).

**Audio, da fare** (§9.137-§9.145): l'autore riesporta da Ableton le tre
parti del primo loop (archi, field, drone) come loop veri, con "Render as
Loop" e senza dissolvenze (ora partono da zero e/o finiscono in calo: a ogni
giro un rientro, un respiro, un colpo grave; §9.143-§9.144), possibilmente
in WAV; si rimettono al loro posto con tools/18 (stessi nomi in
nuovi/audio, tagli a tutta la durata). Da decidere con l'autore: il ritmo
del field nel giorno (ora scende in linea dall'alba al tramonto), un filo
di field di notte (ora 0), la soglia del drone (50 di popolazione), la
musica nel menu principale (ora muta), i volumi degli effetti a orecchio.

**Multiplayer 1 contro 1** (§9.152-§9.156; decisioni dell'autore: 1v1, con un
codice, connessione diretta, parti simmetriche). Fasi: 1
determinismo (fatta, §9.152); 2 strato dei comandi (passo 1 fatto, §9.153:
coda, registro, replay; passo 2 fatto per la schermaglia, §9.154: la
selezione fuori dalla partita e le azioni come comandi; restano la campagna,
cioe' dialoghi e suggerimenti, e le cose segnate in §9.154 "Cosa resta");
3 parti simmetriche (§9.155: fatta; gemelli blu, specchio, interfaccia,
nebbia, fine e porte per parte; restano piccole cose in §9.155 "Cosa
resta"); 4 rete e lobby (§9.156: fatta la prima parte giocabile, WebRTC
coi codici da incollare, lockstep, impronte, pausa, disconnessione; da
provare su due computer in reti diverse; restano TURN, ritardo adattivo,
riconnessione: §9.156 "Come riprendere"). I codici piu' corti: fatti
(§9.202, versione 0.2617: ~130-250 caratteri invece di ~600-780), da
provare anche fra browser diversi (Chrome con Firefox o Safari). Nel menu
"Multigiocatore" con "Crea partita" e "Partecipa" (§9.157); le cause dei
collegamenti non riusciti e la guida "Problemi di connessione" (§9.158).

**Livello 7, "Lost in the Fog"** (§9.148, §9.178): uno stealth con l'arciere
della nebbia. Fatto: la mappa dell'autore e la regia (§9.178, nella 0.2614).
Da rivedere in Tiled: le pattuglie e i banchi di nebbia tracciati da me nel
livello regia (§9.178). (Le voci di §9.148 su bosco, mura e prigionieri
erano del prototipo: §9.198.)

**Editor di mappe** (§9.180-§9.182, roadmap R6): per i giocatori, mappe da
schermaglia. Fatti lo scheletro (dal menu "Giocatore singolo" -> "Editor di
mappe", `?room=editor`, dal disegno dell'autore), la mappa vera (col motore,
anche tutta intera), le schermaglie come modelli, "Inserisci", "Sposta",
annulla e ripeti, "Nuova mappa" vuota, gli stili di case e alberi col tasto
S (§9.183), salva e apri (browser e file `.dvmap`, con la convalida), le
impostazioni (nome, descrizione, misure, sfondo, CPU con la "statica" e "a
scelta del giocatore") e la simmetria in tutti i comandi, come impostazione
degli strumenti (§9.184, §9.186), il pennello ovale (boschi con larghezza e
densita', texture) e la copertina (§9.185-§9.186), la polilinea per fiumi
e strade e "Salvare le modifiche?" all'uscita (§9.187), i file collegati
(Salva con nome, Ctrl+S sul file) e "Prova mappa" con la CPU statica
(§9.188), che reagisce ma non ha economia ne' gestione (§9.189); le mappe
dell'editor nella schermaglia (§9.190: dopo le cinque del gioco, dal
browser o da file, con la copertina o il disegno della mappa e la CPU fissa
o a scelta; la partita si salva con la mappa dentro), le partenze rossa e
blu (§9.191: la gemella simmetrica e' dell'altro schieramento), la partita
online sulle mappe dell'editor (§9.192: chi entra senza la mappa la riceve
da chi crea e la tiene), unita' ed edifici delle due parti in "Inserisci"
(§9.193), mura e porte coi "+" come nel gioco e la gomma ad area (§9.194),
le rifiniture di §9.195-§9.197 (Natura, l'interruttore rosso / blu, i campi,
i comandi nella colonna, le bandierine, "Regia", la colonna che scorre, la
freccina), le icone dell'autore, i ponti, la password, le partite solo su
file e senza lavoratori di partenza (§9.198), anche per i comandi e la
gomma (§9.199-§9.200); il vetro, gli stili della casa, la F dell'albero
finto, il municipio come edificio, le foto della Natura, niente clic
(§9.203; lo stile scelto nell'editor ora arriva anche nella partita),
l'anteprima della polilinea come la disegna il gioco e il fiume che toglie
gli alberi nell'acqua (§9.204), la nebbia estetica e il banco di nebbia in
"Natura" (§9.205) con le loro impostazioni (§9.206). Da fare: la scheda "Regia" per gli scenari
(per ora no, decisione dell'autore, §9.198).

**Movimento** (§9.146-§9.147): mp_potential_step sostituito da un passo
con memoria; l'ultimo tratto (lastmile.js, un campo fine attorno all'unita')
per gli spostamenti, il fuoco, i nemici che non inseguono, le macchine
d'assedio e i civili (spostamenti e cantieri). Da fare: la mischia (provata
col campo fine per le due parti: peggio, §9.147), i posti di lavoro dei
civili (risorse, depositi). La taratura di lvl06.mjs resta com'e'
(decisione dell'autore, §9.147).

Ultimo aggiornamento: 9 ottobre 2026, settima sessione (branch
`claude/clever-heisenberg-qbpsex`): **kit per Tiled** (tileset per
categoria, mappa vuota, room dell'autore convertite, pennello bosco) e
script Tiled -> scenario con anteprima e collaudo; maschere di collisione
che ruotano con lo sprite; schermata di caricamento senza rettangolo nero
e senza cambio di font; ordini di attacco e tempi della catapulta; il
livello 3 (mappa dell'autore) e il monastero, primi sprite nuovi; la
regia del livello 3, difesa a tempo del monastero (Fase 9, §9.1–§9.11).
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
- [x] La miniera del livello 2 a (2166, 449) dentro la maschera a ellisse di
  `montagna1`: maschera precisa, decisa dall'autore (§9.116).

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

### 9.8 Schermata di caricamento

Segnalazioni dell'autore (9 ottobre 2026):

- **Rettangolo nero in alto a sinistra** per tutto il caricamento: era il
  canvas del gioco, che prima del primo `resize()` (a caricamento finito)
  ha la misura predefinita di 300x150 px e, col contesto WebGL senza alpha,
  e' nero opaco. Ora `#game` parte con `visibility: hidden` (index.html) e
  `app.js` lo mostra al primo fotogramma disegnato.
- **Il font che cambia a meta' caricamento**: "Loading…" compariva nel
  font di sistema e passava al font del gioco quando arrivavano
  `atlas.json` e la pagina `gui` (`domtext.js`, §6.1 n.86). Ora un elemento
  che aspetta il font resta invisibile e compare gia' col font del gioco;
  se il font non arriva (errore, o piu' di 4 s) si mostra il testo
  semplice. Vale anche per i messaggi del motore (l'avviso "senza
  accelerazione grafica").

Prova (Chromium, atlas rallentati di 0,7 s, e anche `atlas.json` di 1,5 s):
a 150, 500, 1200 ms l'angolo in alto a sinistra ha il colore dello sfondo
(27, 29, 23); la scritta e' invisibile finche' non c'e' il font, poi e'
subito il canvas col font del gioco (mai il testo di sistema); il canvas
del gioco si mostra solo dopo il primo fotogramma. Soak e zip dei portali
senza errori.

### 9.9 Catapulta: ordini di attacco e tempi

Segnalazione dell'autore (9 ottobre 2026): la catapulta spesso ignora gli
ordini di attacco, o resta ferma e tira dopo troppo tempo; e dopo un tiro
"ricarica" troppo in fretta.

**Ordini ignorati** [C, `ally_catapulta` Mouse_GlobalRightReleased]: il
clic destro su un nemico valeva solo con la catapulta carica (`loaded=1`),
non gia' in mira (`action!=2`) e col punto a 300-850 px. Con un edificio
nemico a tiro la catapulta e' sempre in mira automatica (action 2) o in
ricarica (action 3): l'ordine su un altro bersaglio si perdeva sempre.
Misurato (catapulta con l'edificio A a 520 px, ordine sull'edificio B a
700 px): tre tiri ad A finche' A non cade, solo poi B; ordinato a meta'
ciclo, idem. Con B a 1300 px non succedeva niente. Ora (`siege.js`
`followOrder`) l'ordine resta finche' il bersaglio c'e', col punto
cliccato relativo al bersaglio (segue un'unita' che si muove):
- in mira col sasso non ancora partito: la mira passa al bersaglio nuovo;
- in lancio o in ricarica: aspetta e tira appena carica;
- oltre 850 px: si avvicina (meta aggiornata se il bersaglio si sposta di
  100 px) e tira appena e' a tiro;
- sotto 300 px: si ferma e cerca un punto da cui tirare (§6.7, al piu' una
  ricerca al secondo); se non c'e', l'ordine si lascia;
- tira a quel bersaglio un colpo dopo l'altro (prima: un colpo e poi il
  tiro automatico all'edificio piu' vicino, §6.7); distrutto il bersaglio
  torna il tiro automatico; un ordine di spostamento cancella l'ordine.
Al posto di `pendingShot` (§6.7), che copriva solo il caso "troppo vicino".

**Tempi** [C, Alarm_2 e Alarm_4]: 50 passi fermi prima di caricare il
lancio, 10 + 10 + 45 di lancio, ricarica in cinque fasi da 13 (65): un
tiro ogni 180 passi, ma il sasso vola 1-3 s, e il tiro dopo partiva poco
dopo l'arrivo del primo. Ora `AIM` 15 e `RELOAD_STEP` 32: dall'ordine al
lancio 25 passi invece di 60, un tiro ogni 240 passi (4 s) invece di 180.
Vale anche per la catapulta nemica (stesse funzioni).

Misure (stessa prova, passi dall'ordine al lancio):

| caso | prima | dopo |
|---|---|---|
| ordine su B a tiro, A piu' vicino | A 58, A 238, A 418, B 598 | B 23, B 263, B 503 |
| ordine su B durante il ciclo su A | A, A, B 478 | A (gia' in volo), B 143 |
| B a 1300 px | nessun tiro | si avvicina di ~460 px, B 336 |
| B a 200 px | (§6.7) | arretra, B 136 |
| ordine su B poi spostamento | — | nessun tiro a B |

Conseguenza sul bilanciamento: in `match` la catapulta di partenza duella
con una torre nemica; prima distruggeva gli edifici a tiro e si spostava
con 22 di vita, ora piu' lenta resta piu' a lungo e muore verso il passo
2250 (soak: alleati 3 e pop 5 invece di 4 e 8 dopo 3000 passi). Se l'autore
preferisce il ritmo di prima, con la mira veloce: `RELOAD_STEP` 19 (un
tiro ogni 175 passi). Soak e salvataggi senza errori.

### 9.10 Livello 3 e il monastero: sprite nuovi

L'autore ha caricato su `main` la mappa del livello 3 (`lvl03.tmx`, il
monastero) e quattro sprite nuovi con le maschere di collisione:
`monastero_corpo`, `_muro`, `_casetta` (con `_mask.png`) e
`monastero_piazza` (senza: si cammina sopra). Richiesta: la piazza sotto a
tutto (depth -1 o -2), il resto -y come gli edifici.

**Contenuti nuovi** (`nuovi/`, versionato; `tools/nuovi.py`): gli sprite in
`nuovi/sprites/`, oggetti e regole in `nuovi/nuovi.json`. Non passano da
`gmx/` e `data/` (si rigenerano dagli zip). Li leggono 05 (atlas, gruppo
edifici), 06 (maschere precise dai `_mask.png`), 07 (oggetti) e 11 (kit,
tileset `nuovi`, in fondo all'elenco).
- Origine: "maschera" = baricentro dei pixel della maschera. Negli edifici
  dell'originale l'origine sta dentro la maschera a circa il 60-75% della
  sua altezza (casa 0,70, caserma 0,62, castello 0,72, chiesa 0,74): la
  base dell'edificio.
- Oggetti: corpo, muro e casetta come gli edifici della citta' romana
  (`natural_parent`, solidi, depth -y: ostacoli del pathfinding) e fermano
  le frecce (`blocksShots`, come `ocr_*`); la piazza depth -2, senza
  maschera.
- **Fette**: il muro di cinta e' lungo e in diagonale e chiude un cortile;
  con una sola depth -y o chi sta nel cortile si disegna sopra il muro, o
  chi sta fuori davanti a un braccio si disegna sotto. Muro e corpo sono
  quindi disegnati a fette verticali di 64 px (05 le ritaglia,
  `<sprite>#<n>`), ognuna un'istanza `__fetta` ferma, senza maschera, con
  la depth del bordo anteriore della maschera nella sua colonna (07:
  `slices`; `app.js` le crea nel Create dell'oggetto, che tiene la
  maschera intera e non si disegna). Corretto per chiunque stia fuori
  dalla base in quella colonna (davanti: dopo; dietro: prima).
- Nel gioco (`?room=lvl03`, `fogville` 0): monastero intero, senza
  giunture fra le fette; un guerriero nel cortile e' coperto dal muro, due
  fuori (davanti al muro e al braccio destro) gli passano davanti, uno
  dietro il corpo resta nascosto.

**La mappa**: disegnata col kit della prima versione, piu' le quattro tile
aggiunte a mano in fondo a `citta` (ancorate al centro dell'immagine,
riconosciute dalle misure). Convertita una volta (con il kit di allora,
rigenerato dagli strumenti del commit ab24ca4) in `mappe/lvl03.tmx` col kit
nuovo; riletta da' le stesse 399 istanze. Nella conversione:
- 52 `albero_debug` (oggetto di prova dell'originale, senza comportamento
  nel porting, finito nel tileset `natura` con le stesse immagini degli
  alberi) -> 35 `albero` e 17 `albero_fake`, secondo l'immagine scelta
  (alb* o alb*_F). Nel kit `albero_debug` ora sta in `regia`, con
  l'etichetta.
- una capsula vuota (senza misure) nel livello "erba e spighe": tolta.
- gli oggetti erano quasi tutti nel livello "erba e spighe" e in "regia":
  rimessi nei livelli del kit (i livelli non contano per il gioco).
- Avviso rimasto: un'aquila (`aquila_01`) a y 6224, fuori dalla mappa
  di 6000.
**Regola da qui**: tile e tileset nuovi solo in fondo, cosi' le mappe gia'
disegnate restano valide; gli sprite nuovi li aggiungo io in `nuovi/`.

**Il gioco carica gli scenari** (§9.5): 07 scrive `game/assets/rooms/` anche
da `scenari/*.json` (vista dello scenario, sfondo, `speed` 60); `lvl03` e'
fra le room di `app.js` (gruppi core e gioco). Manca ancora la regia del
livello (obiettivi, nemici, dialoghi, risorse), la campagna (menu) e lo
slot dei salvataggi nel menu (`SAVE_ROOMS`): sono la prossima tappa.
CI: gli scenari devono venire dalle mappe di `mappe/` (rigenerati e
confrontati); soak e salvataggi anche su `lvl03` (3000 passi senza errori;
salvataggio 2,5 MB, ripristino identico).

### 9.11 Livello 3: la difesa del monastero

L'idea dell'autore (9 ottobre 2026): difesa a tempo. I soldati partono in
basso a destra; seguendo la strada arrivano a un villaggio che passa al
giocatore; un abitante avverte che gli invasori vogliono prendere il
monastero a nord, vicino alle montagne; i soldati decidono di difenderlo;
la nebbia sul monastero si toglie, la vista ci si sposta e parte il conto
alla rovescia. Le ondate arrivano dal punto di partenza (arieti contro le
mura, soldati contro i difensori), sempre piu' grosse; intanto le caserme e
le stalle della base nemica attaccano il villaggio, e distruggerle li ferma
(lo dice un dialogo dopo il primo attacco). Il monastero cura come la
chiesa, molto piu' in largo e piu' spesso; icona della chiesa, molta piu'
vita. Decisioni dell'autore alle domande: **si perde quando il monastero
scende sotto meta' vita** (cosi' lo si puo' riparare); **gli arieti
sfondano la cinta esterna** (mura, porta, torri: pezzi normali), il muro
del cortile resta un ostacolo; **il villaggio compare all'arrivo**; numeri
di partenza proposti da me, da tarare giocando. Parere dato all'autore: la
sconfitta al primo colpo era troppo punitiva; il monastero di pietra non
brucerebbe (va deciso che brucia); due casse nemiche (`o_box1`, `o_box2`)
stanno nel villaggio: sono edifici nemici, se erano decorazione vanno
cambiate (in sospeso).

**Gruppi della mappa** (`scenario.js`, 12, 07): un livello di Tiled
`gruppo <nome>` mette il gruppo nell'ottavo campo dell'istanza; la regia
dice cosa farne (`GROUPS`): "nascosto" (non c'e' finche' non lo si crea,
in `g.heldGroups`, salvato coi globali) o "neutrale" (c'e' come
`__neutrale`: stesso sprite e maschera, fette comprese, ostacolo
`natural_parent` di nessuno; `activateGroup` lo sostituisce con l'oggetto
vero e libera le celle). In `lvl03`: `gruppo citta` (centro, 3 case,
chiesa, 2 torri) nascosto, `gruppo monastero` (2 mura, 6 mura verticali,
porta, 2 torri) neutrale; spostati io nella mappa per zona.

**Il monastero** (`buildings.js` `monastery`, oggetto `monastero` in
`nuovi.json`, non nel kit): alla rivelazione prende il posto di
`monastero_corpo` (stesso sprite, a fette). Edificio alleato di legno
(`ally_wooden`: i nemici lo incendiano, i civili lo spengono e lo
riparano col legno), 3000 di vita, cura +3 ogni 60 passi entro 2000 px
(la chiesa: ogni 180 entro 800), vista ampia (fog.js: toglie la nebbia
sul complesso), fiamme su tutto il corpo con la vita delle particelle
scalata (`FIRE.monastero.k`), barra della vita sopra il tetto, scheda con
`ico_chiesa`, niente demolizione col tasto Canc. Danni suoi
(`MONASTERY`): colpo d'ariete 20 (agli altri edifici 50), freccia
incendiaria 1 e fuoco, in fiamme -1 ogni 10 passi. Misurato prima di
tararli: con 50 a colpo due arieti entrati nel recinto lo portavano a meta'
in 17 s; le frecce incendiarie non lo toccavano (mancava in `FIRE_HIT`).

**Regia** (`levels.js` `enemyManagerLv3`, tabella `LV3`): fase 0 marcia
(arrivo: un'unita' entro 700 px dal centro del villaggio -> il gruppo
`citta`, 3 civili, +200 cibo e legno, dialoghi 3_1-3_3), fase 1 (chiuso il
3_3: rivelazione, vista che scivola in 90 passi, dialogo 3_4), fase 2
difesa di 15 minuti. Ondate (dalla rivelazione): 1 min 2 guerrieri + 2
picchieri + 1 ariete, poi ogni 2:30 fino a 13:30 (5 guerrieri, 4
picchieri, 3 arcieri, 2 cavalieri, 3 arieti, 1 catapulta); nascono al
punto di partenza e marciano col flow field verso la porta; le macchine
ferme ripartono verso l'edificio alleato piu' vicino alla porta; i fanti
verso il soldato alleato piu' vicino (entro 1500 px) o, se non c'e' e il
recinto e' raggiungibile (cinta sfondata), fra la cinta e il muro del
cortile, dove incendiano il monastero da soli (enemies.js, 400 px).
Attacchi al villaggio: dal minuto 4, ogni 2, ogni caserma crea 1-3 fanti e
ogni stalla 1-3 cavalieri, verso l'edificio alleato piu' vicino al
villaggio; 40 s dopo il primo, il dialogo 3_5 e l'obiettivo "distruggi
caserme e stalle". I nemici gia' sulla mappa difendono dove sono. Il
centro distrutto in `lvl03` non e' sconfitta. Obiettivi (endgame.js):
strada, conto alla rovescia, vita del monastero, base nemica. Vittoria allo
zero col monastero sopra meta': codice 9 3 0 7 6, sblocca il 4.
Campagna (menu), slot dei salvataggi, testi in sei lingue.

**Ariete nemico** (siege.js): colpisce anche da fermo, bloccato a meno di
48 px dall'edificio alleato piu' vicino. Col flow field "largo" (§8.14) a
una porta chiusa per i nemici restava a 35-37 px e non colpiva mai (a 10
px dall'originale).

Prove (Chromium, `window.__game`, soldati spostati al villaggio):
partenza senza centro, 11 neutrali, `monastero_corpo`; arrivo: centro, 3
case, chiesa, 2 torri, 3 civili, dialogo 3_1; rivelazione: monastero 3000,
neutrali 0, cinta del giocatore, vista sul monastero. La prima ondata:
l'ariete abbatte una torre, la porta (600 -> 0), poi le mura; i fanti
entrano e incendiano il monastero. Senza difendere: sconfitta a 5,3 minuti
(fuoco dal minuto 2,5 e arieti). Col monastero con vita enorme: vittoria a
15 minuti. Salvataggio e ripristino identici prima dell'arrivo (gruppi
tenuti da parte) e a meta' difesa. Soak, salvataggi e zip senza errori.
Da fare: giocarlo per tarare i numeri; le due casse nel villaggio.

### 9.12 Pioggia grigio-azzurra

Segnalazione dell'autore (9 ottobre 2026): la pioggia sembra marrone. Lo
e' [C]: manager Alarm_4, `part_type_colour_rgb(goccia, 131, 148, 101, 119,
74, 107)`, un marrone chiaro, portato fedelmente (effects.js `GOCCIA`). Ora
grigio-azzurro chiaro (170-195, 185-205, 200-222) e alpha 0,55, come gli
anelli sul fiume (§8.13). Confronto in `match` con la pioggia forzata: le
striature rossicce diventano gocce chiare che si staccano dal verde.

### 9.13 Campagna: il segnalino del livello 3

Richiesta dell'autore: sulla mappa della campagna il livello 3 con un
segnalino del monastero piccolo come gli altri due (cap1 171x121, cap2
86x116), sulla catena montuosa al centro, collegato al 2 con la freccia
del collegamento 1-2 (fr_corta).
- `cap_monastero`: ricavato da `monastero_corpo` (nuovi.json "derivati",
  tools/nuovi.py `derived`, 05 nel gruppo campagna), ritagliato e
  rimpicciolito a 120x70, origine al centro.
- menu.js `drawCampaign` (`L3_MARK`, `L3_LABEL`, `L3_ARROW`): dove l'ha
  disegnato l'autore su uno screenshot, subito in alto a sinistra del
  livello 2: segnalino a (403, -81) dal centro della mappa ("al centro"
  voleva dire in verticale), numero sopra (sotto finiva sulle lance dei
  soldati), freccia `fr_corta` appena allungata (1,2 x 1,1) e ruotata di
  -60 gradi, dal fianco sinistro dei soldati verso il monastero. Con l'idea
  dell'autore che la mappa dovra' contenere dieci livelli: niente frecce
  stirate attraverso mezza mappa, segnalino rimpicciolito a 120x70.
  (Prima prova, scartata: al centro della mappa, sulla catena montuosa, con
  la freccia scalata 3,3.)
- Nel progetto c'e' anche `cap3` (126x116, un castello con una cupola
  verde), mai usato dal gioco [C]: forse il segnalino pensato per un altro
  livello.

Riparazione del monastero (domanda dell'autore): come gli altri edifici di
legno [C, ally_omino Alarm_2, civilians.js]: ogni civile che ripara toglie
1 legno e aggiunge 1 vita ogni 13 passi (4,6 vita e 4,6 legno al secondo);
ogni legno speso spegne anche il fuoco; senza legno non ripara ne' spegne.

### 9.14 Livello 2: fuga dei lavoratori, casa, area dei taglialegna, suggerimenti

Segnalazioni e richieste dell'autore (9 ottobre 2026, con uno screenshot di
Tiled per lo spostamento):
- **I lavoratori che scappano all'inizio si incastrano.** enemy_manager_lv2
  Create [C] da' ai due civili la stessa meta (112, 7449) senza percorso
  (solo dirox/diroy): uno restava per sempre fra due picchieri fermi a
  (1123, 7261), l'altro deviava per i nemici e si fermava. Ora ognuno ha la
  sua meta accanto (a 70 e 50 px uno dall'altro) e il suo flow field
  (`generateFields`, come per il clic destro): arrivano tutti e due in ~500
  passi.
- **lvl02 diventa una mappa del repo** (`mappe/lvl02.tmx`, dalla conversione
  esatta della room, §9.4): lo scenario `scenari/lvl02.json` prende il posto
  della room di GameMaker (07 lo scrive dopo); il kit ha la mappa modificata
  in `mappe/` e la conversione dell'originale in `mappe/originali/`, che usa
  il collaudo (`12 --check`). D'ora in poi lvl02 si corregge anche in Tiled.
- **Una casa della citta' (ocr_12) a (1695, 7025)**, sopra il punto dove
  nascono i due civili dopo il primo combattimento (1645 e 1745, 7109):
  sembrano uscire da li'. Provato: i civili nascono liberi davanti alla casa.
- **L'area 3 (i taglialegna) piu' su**: gli 8 difensori (guerriero,
  2 arcieri, cavaliere, 4 picchieri, prima fra x 1308-1656 e y 5672-5807)
  spostati di (-280, -500) come nello screenshot, su punti liberi; il
  rettangolo dell'area e il punto di difesa con loro (AREAS[2]: [870, 4900,
  1600, 5400, 1220, 5250]). Lo spostamento da solo non bastava: i difensori
  inseguono chiunque entro 800 px dal punto di difesa (scr_difendi [C]),
  cioe' quasi tutto il bosco sopra la partenza (misurato: un civile fermo a
  636 px li faceva partire tutti e 8; con la posizione vecchia era uguale).
  Raggio di difesa dell'area 3 a 400 (ottavo valore di AREAS, gli altri 800):
  civile a 832 px nessuno, a 636 e 481 px 2-3 su 8 (la vista dei singoli,
  gli arcieri), sotto i 400 tutti.
- **Niente suggerimenti sulla notte e sulla selezione multipla in lvl02 e
  lvl03** (`newGlobals`: nighthint, multihint gia' a 1).
- **Suggerimento nuovo in lvl02** (`hint_lavoratori`, nuovi.json; hints.js,
  in alto come quello della notte): chiuso l'ultimo dialogo iniziale
  (dialogo_2_5) "Precious workers": senza centro non si creano civili,
  ogni lavoratore perso e' perso per sempre. Sei lingue.
Soak, salvataggi (lvl02 compreso) e zip senza errori.

### 9.15 Tutorial: via la catapulta di prova

Segnalazione dell'autore: nel tutorial (`match`) all'inizio c'e' una
catapulta alleata al centro della mappa, lasciata per le prove. C'e' [C]:
`ally_catapulta` a (3420, 3422) su una mappa di 7000x7000, l'unica della
room, lontana dalle unita' di partenza (un cavaliere a (3090, 854), due
civili a nord-ovest). Tolta all'avvio come gli altri oggetti di troppo
(app.js `DROPPED`). All'avvio: nessuna catapulta, 3 alleati, popolazione
5 (era 4 e 8). Soak di match: 3 alleati e popolazione 5 come dopo §9.9, ma
per un altro motivo (allora la catapulta moriva contro la torre nemica).

### 9.16 Livello 3: 20 minuti, campi coltivati al villaggio, avviso sulla base nemica

Richieste dell'autore (10 ottobre 2026):
- **Difesa di 20 minuti** (era 15; `LV3.defense`). Le ondate seguono lo
  stesso passo di 2:30 fino alla fine: due in piu', a 16:00 (6 guerrieri,
  4 picchieri, 3 arcieri, 2 cavalieri, 3 arieti, 1 catapulta) e a 18:30
  (6, 4, 4, 3, 3 arieti, 1 catapulta); "Ancora un minuto!" a 19:00. Numeri
  da tarare giocando.
- **Tre campi gia' coltivati col loro contadino** attorno al centro del
  villaggio, a destra (`LV3.townFields`), creati all'arrivo con il gruppo
  `citta`; ogni contadino nasce sul suo campo con `foodwork` 6 (cerca il
  campo libero piu' vicino) e lavora subito. In piu' dei 3 civili e delle
  risorse di prima. I campi non stanno sulla stessa x: in fieldsStep il
  contadino cambia campo solo se cambia la **x** del campo libero piu'
  vicino [C, `campox != miocampox`]; con i tre campi in colonna, dopo la
  prima consegna andavano tutti verso quello in basso e due restavano in
  fila dietro al primo (misurato: un campo lavorato su tre). Sfalsati di 30
  px: tutti e tre lavorati.
- **Il dialogo 3_5 sulla base nemica al primo attacco al villaggio**:
  prima arrivava 40 s dopo la partenza del primo attacco, anche se nessuno
  era ancora arrivato. Ora quando un nemico partito dalla base arriva a
  500 px da un edificio alleato a meno di 1500 px dal centro del villaggio
  (le torri comprese, a tiro: 600 px; il monastero no); con lui
  l'obiettivo "distruggi caserme e stalle" (`g.l3.baseKnown`, che fa anche
  da segno "gia' detto" nei salvataggi). Misurato: 24 s dopo la partenza,
  contro la torre a est.
Prove (Chromium, `window.__game`, un soldato spostato al villaggio): 3
campi e 6 civili, contadini al lavoro su tutti e tre i campi; conto alla
rovescia da 20:00; dialogo 3_5 una volta, all'arrivo del primo attacco.

### 9.17 Livello 3: sfondata la porta, gli arieti vanno al monastero

Richiesta dell'autore (10 ottobre 2026): distrutta la porta, gli arieti
nemici devono andare verso il monastero invece di continuare ad attaccare
le altre mura. L'ariete nemico [C] colpisce sempre l'edificio alleato piu'
vicino (a contatto, o fermo a meno di 48 px: §9.11) e insegue quello piu'
vicino entro 700 px: caduta la porta, il piu' vicino e' un tratto di mura.
Ora un ariete puo' avere un bersaglio imposto (siege.js `ramTarget`): ci va
da qualunque distanza e colpisce solo quello. La regia del livello 3
(levels.js, controllo di ogni secondo) lo da' agli arieti delle ondate
(`l3` "mon") appena non c'e' piu' una porta a meno di 100 px da
`LV3.gate`; prima della porta tutto come prima.
Prova (Chromium, `window.__game`, senza soldati e torri del monastero): un
ariete davanti alla porta la abbatte in 16 s, poi gira attorno al muro del
cortile, arriva al monastero in 12 s e lo colpisce (-20 a colpo, ~80 di
vita ogni 4 s al netto della cura); le mura restano a 800. Il livello
diventa piu' duro: un ariete che passa la porta non si ferma piu' sulle
mura.

### 9.18 Livello 3: attacchi al villaggio ogni 4 minuti

Richiesta dell'autore (10 ottobre 2026), il livello e' troppo duro: gli
attacchi dalla base nemica al villaggio ogni 4 minuti invece che ogni 2
(`LV3.baseEvery`). Il primo resta al minuto 4; poi 8, 12 e 16 (4 attacchi
invece di 8 nei 20 minuti); la dimensione per attacco resta quella di
`baseN` (1, 1, 2, 2 fanti o cavalieri per caserma o stalla). Le ondate
contro il monastero non cambiano.

### 9.19 Livello 2: la vista scivola sulla base nemica

Richiesta dell'autore (10 ottobre 2026): quando il gioco dice che gli
attacchi vengono dalla base nemica in alto (dialogo_2_13, dopo 15000
passi: "le nostre spie hanno trovato la base nemica, e' a nord"), uno
scorrimento della vista come quello sul monastero del livello 3.
- **Prima** [C]: chiudendo il dialogo la view saltava di colpo con
  l'angolo in alto a sinistra in (500, 600); con la nebbia e gli edifici
  nemici mai visti, si vedeva poco o niente (le caserme e la stalla sono a
  (273, 404), (500, 252), (85, 703), il palo che segna la base a (150,
  250), piu' a sinistra).
- **Ora** chiudendolo la vista scivola fino a centrarsi sulla base (300,
  450; contro il bordo della mappa: angolo in (0, 90)), e gli edifici nemici
  a meno di 600 px dal palo diventano visibili (le spie li hanno trovati;
  una volta visti restano visibili [C]). Il palo toglie la nebbia attorno:
  si vedono le due caserme.
- Lo scorrimento e' ora comune (camera.js `panTo`/`panStep`, tenuto dalla
  regia del livello: enemy_manager_lv2 e enemy_manager_lv3). Due ritocchi
  che valgono anche per il monastero: la meta e' gia' dentro la room (prima
  la view si fermava contro il bordo prima della fine dello scorrimento) e
  la durata cresce col tragitto (40 px a passo, fra 90 e 180 passi): in
  lvl02 attraversa quasi tutta la mappa (da y 6500 a 90) in 156 passi.
Prova (Chromium, `window.__game`, dialogo forzato e chiuso col clic vero):
la vista da (200, 6500) a (0, 90) in 2,6 s, le caserme visibili, nessun
errore.

### 9.20 Movimento: unita' che tremolano e girano su se stesse

Segnalazione dell'autore (10 ottobre 2026): dall'ultima release il
pathfinding sembra peggiorato, soprattutto nelle animazioni (personaggi
che girano su se stessi, tremolanti); forse e' stato tolto il "fermati se
un alleato di rango piu' alto e' in collisione con te"?

**Cosa era cambiato.** Fra l'ultima release (PR #7) e quella prima (PR #6)
il movimento e' identico: stessa prova, stessi numeri, passo per passo. Il
"fermati" (nearRank del guerriero) e' stato tolto in §8.11 (PR #5), ma solo
verso la propria casella della formazione. Rimesso cosi' com'era (prova
qui sotto): prima delle correzioni inversioni -14% e -27% in due semi,
uguali nel terzo, e i mucchi restavano; con le correzioni nessun guadagno,
e nel combattimento i nemici giravano di piu' (spin nemici 22-97 -> 170-252).
Non l'ho reintegrato. Le
cause vere sono quattro, tutte piu' vecchie (§6.1, §6.2, l'originale):

1. **La "vista" sulla casella guardava il campo** (seesGoal, §6.2 D). Il
   campo si calcola all'ordine, e' uno per tutto il gruppo e ha per ostacoli
   anche le celle delle unita' ferme in quel momento (occupy), che poi se ne
   vanno. Con la formazione la casella non e' la meta del campo: chi
   arrivava in fondo al campo non "vedeva" la sua casella e restava fra due
   celle, 5 px avanti e indietro a ogni passo, voltandosi di 180 gradi.
   Negli incroci fra due gruppi: mucchi di 5-8 unita' sovrapposte e
   tremolanti per sempre. Ora la linea si guarda contro i soli ostacoli
   fissi (`clearSolid`: edifici, alberi, acqua).
2. **"Punto d'arrivo occupato"** [C] (fanteria, cavalieri, arcieri, civili,
   assedio, nemici): la meta si sposta di 32-50 px verso l'unita'. Se
   l'unita' era piu' vicina, la meta finiva dall'altra parte, e al passo
   dopo tornava indietro: la catapulta sovrapposta a un arciere fermo andava
   fra 1280 e 1330 per sempre. Ora, piu' vicina di cosi', arriva dov'e'
   (`destinationBack`).
3. **Arrivo "per rinuncia"** (§6.1 n.89): la distanza migliore restava
   quella dell'ordine prima; con un ordine nuovo entro 400 px l'unita'
   sembrava ferma anche camminando e si fermava a 50-100 px dalla casella
   (meta' del gruppo, a ogni ordine). Ora il conto riparte a ogni meta nuova.
4. **mp_potential_step** (approssimazione [I]): la direzione gira al piu' di
   30 gradi a passo, e se in quella direzione il passo era chiuso l'unita'
   girava senza muoversi, fino a 6 passi, e poi di nuovo: a contatto con
   altre unita' (mischia, ammucchiate) girava su se stessa. Ora, se la
   direzione girata e' chiusa ma quella libera no, va per quella.
   Piu' un dettaglio: staccandosi da un'unita' in fondo al campo
   (moveFlowField, §7.17) il passo non supera piu' la meta (le macchine
   d'assedio sulla casella la superavano e tornavano indietro).

**Prova** (`game/test/browser/movement.mjs`, nuova: 20 unita' miste, 8
ordini di gruppo, 5 incroci, un combattimento con 12 nemici; `spin` = gira
di almeno 20 gradi muovendosi meno di 1 px; `rev` = inversione di marcia;
`flick` = lo sprite torna alla faccia di 2-6 passi prima; `late` = in
cammino a fine ordine; `off` = a oltre 40 px dalla casella):

| | release (PR #7) | ora |
|---|---|---|
| match, 3 semi: spin | 406 / 599 / 476 | 9 / 18 / 7 |
| match, 3 semi: rev | 13594 / 11951 / 10651 | 455 / 361 / 259 |
| match, 3 semi: flick | 13230 / 11792 / 10492 | 432 / 366 / 222 |
| match, 3 semi: late / off | 31-33 / 160-167 | 0-4 / 2-3 |
| lvl02: spin / rev / late / off | 604 / 12505 / 33 / 165 | 7 / 1016 / 2 / 4 |
| lvl03: spin / rev / late / off | 732 / 10958 / 34 / 159 | 9 / 390 / 0 / 2 |
| combattimento (match, 3 semi): spin alleati | 406 / 599 / 476 | 9 / 18 / 7 |
| combattimento: spin nemici | 20 / 157 / 53 | 0 / 0 / 0 |

I civili al lavoro (workers.mjs, 5 configurazioni da 16 a 30 civili): le
stesse risorse (+-5%), civili fermi 2 eventi in tutto (release 5),
sovrapposizioni prolungate 2 (release 0, un contadino carico per 8 s).
Consegne (deposit.mjs) 6 su 6, soak e salvataggi (anche lvl03) senza
errori. Restano le inversioni nei mucchi della mischia (200-400 per
combattimento) e qualcuna dell'assedio.

### 9.21 Cantiere affollato: 20 civili fra una miniera e un magazzino

Richiesta dell'autore (10 ottobre 2026): una prova con un magazzino vicino
a una miniera o a una rovina di pietra e 20 lavoratori che scavano, per
vedere se si incasinano (la situazione tipica di un RTS).

**La prova** (`game/test/browser/mining.mjs`, nuova): in `match`, nemici
tolti, un magazzino nuovo a ~150 px dal bordo della miniera d'oro (1847,
614) o della pietra grande (768, 1179), N civili attorno al magazzino,
clic destro vero sulla risorsa, N passi. Misure come in movement.mjs
(fermi, spin, rev, flick), piu' i passi "lenti" in cammino, le coppie
sovrapposte per oltre 5 s e i passi in coda (sotto). `SAVE=1` salva a fine
prova, ricarica e confronta.

**Nell'ultima release si incasinavano**, e nelle correzioni di §9.20 ancora
di piu' (le nuove non toccavano i civili al lavoro): con 20 civili sull'oro,
in 2,5 minuti, 30834 inversioni di marcia (un passo su quattro in cammino),
23 civili fermi, 33 coppie sovrapposte a lungo. Le cause:
- **posti attorno alla risorsa** (meleeSpot, §8.19): ricalcolati a ogni
  passo a settori di 30 gradi, meno dei civili e agli angoli quasi uno
  sull'altro; chi restava senza puntava al centro della risorsa, si staccava
  dagli altri (separate) e al passo dopo ci tornava sopra col campo;
- **cominciare a lavorare** solo senza nessun civile addosso: bastava uno di
  passaggio;
- **pietra finita** (c'era gia'): chi ci stava andando continuava col campo
  verso il punto in cui era e li' restava a girare (chi ci lavorava invece
  ripartiva verso la piu' vicina).

**Ora** (civilians.js, solo oro e pietra; il legno e la consegna su ordine
restano con meleeSpot):
- ogni risorsa ha **posti fissi** che non si toccano, sul bordo (lavoro) e
  una fila piu' in fuori (attesa), calcolati una volta sola dalla maschera
  del civile (`resSpots`, sulla risorsa: salvati con lei);
- a 100 px dalla risorsa si **prenota** il posto di lavoro libero piu'
  vicino, o se non ce n'e' quello d'attesa; resta di chi lo ha finche' va
  alla risorsa o ci lavora, chi parte per il deposito lo lascia e il primo
  che chiede lo prende (chi aspetta chiede a ogni passo);
- verso il posto: il campo calcolato una volta per posto (dall'altra parte
  della risorsa la si aggira), poi dritti quando e' in vista, passando sopra
  gli altri civili come verso la casella della formazione; se in 30 passi non
  ci si avvicina (lo spigolo di una pietra irregolare) di nuovo il campo;
  dentro la risorsa (il campo taglia gli spigoli) si esce allontanandosi dal
  suo centro;
- al posto d'attesa si sta **fermi**, girati verso la risorsa (queueWait):
  gli altri ci passano sopra;
- si comincia a lavorare solo **al proprio posto**, se nessun altro civile
  *al lavoro* e' addosso;
- risorsa finita: chi ci andava va alla piu' vicina.

| 20 civili | release oro 2,5 min | ora | release pietra 2,5 min | ora |
|---|---|---|---|---|
| raccolto (al minuto) | 1330 (532) | 1810 (724) | 870 (348) | 1293 (517) |
| fermi | 23 | 0 | 59 | 1 |
| inversioni | 30834 | 173 | 46151 | 853 |
| spin | 8235 | 334 | 3385 | 199 |
| passi lenti in cammino | 262‰ | 58‰ | 291‰ | 87‰ |
| coppie sovrapposte > 5 s | 33 | 0 | 103 | 23 |

Con 30 civili sull'oro: 1600 -> 1780 raccolti, fermi 41 -> 0, inversioni
58030 -> 185, sovrapposte 85 -> 0. In 5 minuti (la pietra grande finisce e
si va alle rovine vicine): pietra 1337 -> 1538, fermi 89 -> 2, inversioni
88810 -> 821. Le sovrapposte rimaste (pietra 23-52) sono civili che vanno
insieme alla rovina successiva, lontano dal magazzino.
I civili su piu' risorse (workers.mjs, centro come deposito): oro 1520 ->
1650, 1390 -> 1590, 1600 -> 2040, il resto uguale, fermi e sovrapposti 0.
movement.mjs, consegne, soak (anche lvl03) e salvataggi senza differenze o
errori; salvataggio a cantiere attivo (SAVE=1) identico.

### 9.22 Livello 3: riquadro degli obiettivi a larghezza fissa

Segnalazione dell'autore (10 ottobre 2026): il riquadro degli obiettivi e'
largo quanto il testo (§3.x: si allarga verso sinistra se una riga non ci
sta), e quando la vita del monastero cala in fretta si ridimensiona di
continuo. Le cifre del font non sono larghe uguali e la vita perde cifre
(3000 -> 999): a 1280 px, in inglese, il bordo sinistro andava fra 754 e
760 px (di piu' nelle lingue con le righe piu' lunghe). Ora in lvl03 la
larghezza si misura anche su due testi che non si disegnano (`sizing`, in
endgame.js): la riga del conto alla rovescia con "99:99" e quella della
vita con tante cifre quante la vita massima, tutte alla cifra piu' larga
del font (`widestDigit`). Misurato col riquadro disegnato (vita 3000, 2999,
1500, 1111, 1000, 888, 100): prima 754-760, ora sempre 754.

### 9.23 Civili inattivi: prova e correzioni

Richiesta dell'autore (10 ottobre 2026): dopo §9.21, una prova approfondita
della selezione dei civili inattivi (contatore in alto a destra, Spazio e
clic sul riquadro: idle_clicker, recountIdle).

**La prova** (`game/test/browser/idle.mjs`, nuova, PASS/FAIL per
controllo): 1 Spazio scorre gli inattivi uno alla volta, tutti, nello stesso
ordine a ogni giro, camera centrata e dentro la room; 2 il clic sul
riquadro aggiunge il prossimo alla selezione (come l'originale), g.sel
giusto; 3 a giro iniziato alcuni partono e altri si fermano: niente doppioni
o salti, idleorder 1..n; 4 chi aspetta un posto (§9.21) non e' inattivo;
5 la miniera finisce e non ce ne sono altre: tutti inattivi; 6 depositi
distrutti coi civili carichi: tutti inattivi; 6b distrutto il magazzino in
uso, si porta all'altro; 7 raccolta mista di 4 minuti: nessun civile "perso"
(in cammino, fermo da oltre 10 s, non in coda) fuori dal contatore; 8 civili
negli angoli della mappa: camera dentro la room; 9 l'ordine di Spazio dopo
salvataggio e caricamento.

**Trovato:**
- **Blocco del gioco** (da §9.21): finita l'ultima miniera, chi ci stava
  andando arrivava ai posti prenotati senza risorsa (null) e la pagina dava
  errore. Ora senza risorsa niente posti, e chi va verso una miniera o una
  pietra che non c'e' piu' (nessuna sulla mappa) si ferma ed e' inattivo.
- **Miniera finita** (gia' nella release): 9 civili su 20 restavano in
  cammino per sempre verso il punto della miniera, invisibili al contatore
  e a Spazio. Risolto da §9.21 e dal punto sopra.
- **Deposito distrutto** (gia' nella release): chi portava il carico
  continuava verso il punto del deposito senza arrivare mai. Ora va al
  deposito piu' vicino (legno, oro, pietra al magazzino o al centro, cibo al
  granaio o al centro); se non ce n'e' nessuno si ferma col carico, come chi
  lo riempie senza depositi. Effetto collaterale: anche i contadini col cibo
  ora vanno verso il granaio col campo verso l'edificio (come gli altri
  depositi, §8.19) invece che verso una cella vicina, e consegnano di piu'
  (workers.mjs: cibo 390 -> 540, 740 -> 1070).
- **Civili persi accanto al posto** (da §9.21): un civile a 17 px dal suo
  posto andava avanti e indietro di 3 px per sempre. Tre cause, tutte nel
  ritorno al campo (§9.21) vicino al posto: il campo verso il posto aveva per
  ostacoli le celle dei civili fermi (vicoli ciechi), partiva dal bordo
  libero piu' vicino quando il posto sta in una cella toccata dalla risorsa
  (anche a 200 px), e tornando dal deposito il civile riceveva il campo
  verso la risorsa e, col posto gia' suo, non si rifaceva quello del posto.
  Ora: campo coi soli ostacoli fissi (`goalField(..., fixed)`, in
  pathing.js), verso la cella libera piu' vicina al posto, tenuto a parte
  (`spotField`), e a meno di 48 px sempre dritti.
Il resto (Spazio, clic, contatore, ordine, camera, salvataggio) era gia'
giusto: tutti i controlli passano anche nella release, tranne 5 e 6.
Dopo: idle.mjs tutto PASS; mining.mjs fermi 0 (oro e pietra, 2,5 e 5 min);
workers.mjs, consegne, movement.mjs, soak (anche lvl03), salvataggi e
salvataggio a cantiere attivo senza errori.

### 9.24 Campagna: la storia del livello 3

Segnalazione dell'autore (10 ottobre 2026): nel menu della campagna il
livello 3 diceva ancora "Prossimamente". Il livello e' nuovo (§9.11) e
l'originale non ha un testo: scritto nello stile dei primi due (menu.js
`STORY[3]`, sei lingue in texts.js), senza dire del villaggio ne' del
monastero (lo si scopre giocando). Scelta dell'autore fra tre proposte,
la piu' cupa: "The soldiers are alone, far from home. The invaders are
seeking one last stronghold to conquer: if that falls too, there will be
no one left to stop them." Provato nel menu (italiano e tedesco, la lingua
piu' lunga): nel riquadro.

### 9.25 Pannello delle risorse: i civili su ogni risorsa

Richiesta dell'autore (10 ottobre 2026): col puntatore sul pannello delle
risorse (in alto a sinistra), invece delle risorse i lavoratori su
ciascuna. manager.js `drawGUI`: col puntatore nel riquadro (20-230, 20-150
px) i numeri diventano i civili su cibo, legno, oro e pietra, e al posto
della popolazione quelli che costruiscono o riparano (icona della casa);
accanto a ogni numero l'icona della popolazione, piccola, perche' si veda
che il pannello mostra un'altra cosa. Contano (`workersByResource`) chi
lavora, chi ci va e chi porta il carico al deposito (il cibo con chi semina
un campo); gli inattivi no (hanno il loro contatore). Provato in `match`
con 5 civili sul legno, 4 sull'oro, 3 sulla pietra, 2 sui campi, 2 su una
casa in costruzione e 1 fermo: 2, 5, 4, 3 e 2.

### 9.26 Tutorial: suggerimento sul pannello delle risorse

Richiesta dell'autore (10 ottobre 2026): far scoprire nel tutorial la
funzione di §9.25. Suggerimento nuovo `hint_lavori` (nuovi.json, hints.js,
sei lingue), nella catena iniziale fra le risorse (hint_resource_tree) e i
civili inattivi (hint_idle), nello stesso posto sotto il pannello: "Workers
per resource - Hover the mouse over the resources to see how many workers
are gathering each one, and how many are building." Provato in `match`:
risorse -> lavoratori per risorsa -> inattivi, col clic; testo nel riquadro
in italiano e in tedesco. i18n.test: 28 suggerimenti.

### 9.27 Interfaccia in sei lingue: testi che sbordano e sovrapposizioni

Richiesta dell'autore (10 ottobre 2026): controllare tutti gli elementi
dell'interfaccia (schede di unita' ed edifici ecc.) in tutte le lingue:
testi che escono dai riquadri o sovrapposizioni strane.

**La prova** (`game/test/browser/ui.mjs`, nuova): intercetta i testi, i
riquadri e le icone disegnati nell'interfaccia (Draw GUI e il pannello del
menu di pausa; il resto si ridisegna sotto, sfocato) e per ogni schermata
segnala i testi fuori dallo schermo, quelli che escono dal riquadro che li
contiene, i testi sovrapposti fra loro o a un'icona e i caratteri che il
font non ha. Schermate: menu (titolo coi pulsanti accesi, partite salvate,
campagna coi tre livelli, lucchetto); in partita il pannello delle risorse
(anche col puntatore sopra), ogni unita' ed edificio selezionato e ogni
pulsante col puntatore sopra (costruzione, produzione, comportamento), la
selezione multipla, un nemico, ogni suggerimento e ogni dialogo (la camera
li porta nello schermo), il menu di pausa nelle tre pagine, gli obiettivi
di ogni livello e fase, vittoria e sconfitta. Sei lingue, a 1280x720,
1920x1080 e 1024x600. `STOP=schermata STOPSHOT=file.png` si ferma su una
schermata e la fotografa.

**Trovato e corretto** (a 1280x720; viste tutte negli screenshot):
- **Comportamento** (Aggressive/Defensive): la descrizione va su tre righe
  (gia' in inglese) e l'ultima usciva sotto la scheda. Ora la scheda cresce
  verso l'alto quanto serve (units.js).
- **Ariete e catapulta**: la scorciatoia (scritta piu' a destra, 380 [C])
  usciva di 12 px dal bordo della scheda, in tutte le lingue. Scheda larga
  400 per loro (production.js).
- **Obiettivi in spagnolo**: il riquadro si allargava verso sinistra fin
  sopra l'ultima colonna dei pulsanti di costruzione (e il suggerimento
  sugli obiettivi lo copriva). Ora si allarga al piu' fino ai pulsanti
  (bordo destro 760 + 10); oltre, le righe vanno a capo e il riquadro
  cresce in altezza (endgame.js). Sugli schermi piu' stretti, dove gia'
  l'originale toccava i pulsanti, resta com'era.
- **Lucchetto della campagna**: in francese, spagnolo, portoghese e tedesco
  "Sblocca livello" finiva sotto l'icona del lucchetto. Icona e scritta ora
  sono centrate insieme (menu.js).
- **Vittoria nei livelli**: "click anywhere to continue" usciva col font
  grande delle cifre del codice (restava impostato). Ora col font dei
  testi.
- **Schermate finali**: il riquadro degli obiettivi restava sopra la
  vittoria (sbiadito, e toccava il titolo nelle lingue lunghe); sulla
  sconfitta il pannello delle risorse, gli inattivi, gli obiettivi e la
  minimappa si disegnavano sopra lo sfondo nero (in spagnolo gli obiettivi
  sopra il titolo). Ora sulle schermate finali solo i loro testi.
- **Mappa della campagna**: centrata, larga 1597 px, sotto i 1536 px di
  larghezza il segnalino del livello 1 (la citta') usciva a destra. Mappa e
  segnalini si spostano a sinistra quanto serve (sotto c'e' l'elenco dei
  livelli).
- **Suggerimento sugli obiettivi** (a 1920x1080, in spagnolo): il riquadro,
  che li' ha spazio per allargarsi, gli finiva sotto. Ora il suggerimento
  segue il bordo sinistro reale del riquadro (`w._objLeft`, hints.js).
Falsi allarmi scartati: la "ß" tedesca (draw.js la scrive "ss"), lo stesso
testo scritto piu' volte per l'alone del titolo di pausa.
Dopo: a 1280x720 e a 1920x1080 nessun problema in nessuna lingua. A
1024x600 restano i limiti del layout originale, pensato per almeno 1280
px e uguali in tutte le lingue (anche in inglese): il riquadro degli
obiettivi sopra i pulsanti in alto a sinistra, i suggerimenti sugli
obiettivi e sulla minimappa sopra il pannello delle risorse, "Indietro"
delle opzioni grafiche e il codice della vittoria del livello 3 sotto il
bordo dello schermo, e solo in tedesco le schede della casa e delle mura
oltre il bordo destro. Da decidere con l'autore.

### 9.28 Mischia: il colpo cominciato arriva fino in fondo

Segnalazione dell'autore (12 ottobre 2026): le unita' militari da mischia
che attaccano un nemico che si muove cominciano il colpo quando sono
abbastanza vicine, ma lo interrompono appena il nemico si allontana; nelle
versioni precedenti il colpo cominciato veniva portato a termine
(animazione e danno). Chiesto cosi', con correzioni mirate al pathfinding
invece di rifare il sistema.

**Cosa succedeva** [C, ally_cavaliere / ally_warrior Step, "se stavi
attaccando fermati e basta"]: il colpo dura tre fasi da 13 passi (Alarm_2,
il danno alla fine della terza); a ogni passo, se il nemico era oltre i
10 px, chi stava colpendo (warwork 2) tornava fermo, senza danno, e al
passo dopo ripartiva a inseguirlo. Contro un nemico che si muove: un colpo
cominciato dopo l'altro, nessuno finito, a scatti.

**Ora** (units.js, `autoAttack`, `meleeStrike`; cavaliere, guerriero,
picchiere): un colpo cominciato a contatto (`swing`, contro `swingT`) va
fino in fondo anche se il bersaglio si allontana: l'unita' resta ferma
girata verso di lui, finisce l'animazione e il danno va a lui (se nessun
altro nemico e' a contatto davanti all'unita', come prima). Finito il
colpo, se il bersaglio e' ancora lontano riparte a inseguirlo come prima.
Lo interrompono un ordine del giocatore (clic destro: action 1) e la morte
del bersaglio. **Anche i nemici** (enemies.js, `enemyStrike`, chiesto
dall'autore dopo la prima prova): l'originale interrompeva il colpo alla
fase successiva se l'alleato piu' vicino era oltre i 10 px. Nessun campo dei salvataggi cambia significato
(`swing`, `swingT` sono nuovi e mancano nei vecchi: colpo non impegnato).

**Prova** (`game/test/browser/melee.mjs`, nuova, nella CI): un alleato
contro un guerriero nemico che si lascia raggiungere e, 6 passi dopo
l'inizio del colpo, scappa di 90 px; 1500 passi per tipo. Poi, a meta'
colpo col bersaglio scappato, un ordine di movimento (il colpo si
interrompe, niente danno, l'unita' parte) e la morte del bersaglio (il
colpo si interrompe, un altro nemico lontano non perde vita).

| | colpi cominciati | arrivati | interrotti senza danno |
|---|---|---|---|
| cavaliere: prima / ora | 75 / 23 | 5 / 34 | 71 / 0 |
| guerriero: prima / ora | 66 / 21 | 5 / 29 | 61 / 0 |
| picchiere: prima / ora | 72 / 21 | 3 / 29 | 69 / 0 |
| guerriero nemico: prima / ora | 40 / 17 | 11 / 25 | 32 / 0 |
| picchiere nemico: prima / ora | 35 / 17 | 10 / 25 | 28 / 0 |
| cavaliere nemico: prima / ora | 40 / 17 | 11 / 24 | 33 / 0 |

("Arrivati" piu' dei cominciati: col bersaglio ancora a contatto il colpo
dopo segue senza ricominciare.) Il bersaglio colpito era al piu' a 86-88 px
(in partita, un nemico che scappa appena comincia il colpo, a 4 px per passo, fino a circa 130-150 px).
movement.mjs (match, 3 semi), combattimento: spin 9/18/7 -> 7/17/6, rev
392/293/212 -> 395/268/212 (solo alleati), 202/421/156 (anche i nemici:
i combattimenti cambiano, alleati rimasti 12/15/10 -> 10/13/10); soak e
salvataggi senza errori.

### 9.29 Livello 3: il monastero come un unico edificio, arieti attraverso le mura

Segnalazioni dell'autore (12 ottobre 2026): nel livello 3 i lavoratori non
riescono a riparare il monastero; gli arieti a volte "scavalcano" le mura
(porta abbattuta, una caserma costruita al suo posto per murare l'ingresso:
gli arieti passavano attraverso il muro subito a sinistra della porta). Per
il monastero due strade proposte dall'autore: un unico oggetto, cosi' che
frecce incendiarie e riparazione vadano a buon fine, oppure soldati e
lavoratori che passano dalla porta del cortile. Scelta la prima.

**Arieti attraverso le mura** [C, pathing.js `markInstance`]: un edificio
distrutto (o la porta che lascia libero il varco) liberava tutte le celle
della griglia che la sua maschera toccava, anche quelle che toccavano
ancora un ostacolo accanto. La porta della cinta (maschera larga 471 px)
copre le estremita' delle mura ai lati: abbattuta, si aprivano 12 celle
delle mura (3 a sinistra, 3 a destra, su due righe). Gli arieti sul flow
field si muovono senza collisioni, e da li' passavano dentro il muro; con
una caserma al posto della porta il buco di sinistra (96 px) restava aperto.
Ora le celle che tocca ancora un altro ostacolo fisso solido (le famiglie di
`initCost`) restano chiuse. Vale per tutti i livelli (alberi tagliati
accanto ad altri alberi, edifici accanto alle mura, le neutrali del livello
3 che diventano del giocatore).
In piu' (levels.js): sfondata la porta, l'ariete punta al monastero
(`ramTarget`, §9.17) solo se da dove e' si arriva dentro la cinta (campo
"largo" dei nemici verso `LV3.inner`); se il varco e' murato colpisce, come
prima della porta, l'edificio alleato piu' vicino (la caserma). Prima
restava fermo davanti al varco col monastero come unico bersaglio.

**Il complesso del monastero** (complex.js, nuovo): il corpo ha accanto il
muro del cortile e la casetta (ostacoli neutri), e il muro chiude il cortile
davanti al corpo. I civili mandati a riparare andavano verso il punto
cliccato (spesso nel cortile chiuso) e poi verso il centro del corpo: dalla
cinta si fermavano contro il muro del cortile; riparava solo chi arrivava
da dietro o dal fianco sinistro. I nemici volevano un posto attorno al corpo
(nel cortile) e tiravano solo a 70 px dal corpo. E la maschera e' solo la
base: un clic sul tetto o su un'ala non era un clic sul monastero (i civili
andavano li' a piedi, senza riparare). Ora il muro del cortile e la casetta
sono pezzi del monastero (`parts`, legati nel Create):
- **riparazione**: il campo dei civili verso il complesso parte da tutte le
  celle libere che toccano un pezzo (`goalFieldAround`, solo ostacoli
  fissi); in fondo si va verso il punto piu' vicino del complesso, lontano
  da chi sta gia' riparando, e si ripara a 5 px da un pezzo qualunque; a
  vita piena si fermano (repairEnd: la regola "fine riparazione" ferma solo
  chi ha cliccato entro 150 px dall'origine dell'edificio, e sul monastero,
  largo 850 px, chi cliccava piu' in la' restava a riparare spendendo
  legno [letto nel codice]).
- **fuoco**: i nemici vanno verso il punto piu' vicino del complesso e
  tirano da 70 px da un pezzo qualunque; una freccia che colpisce il muro o
  la casetta colpisce il monastero.
- **puntatore** (world.js, `pointOver` del comportamento): sul monastero
  sopra la base di ogni pezzo e sopra tutto cio' che lo sprite disegna al
  di sopra (tetti, cortile).
Sprite e maschere dell'autore non cambiano. L'altra strada (la porta del
cortile percorribile) non basta da sola: le unita' hanno una maschera di
48x46 px e il varco disegnato e' di circa 45 px in diagonale, con le celle
da 32 px della griglia.

**Prova** (`game/test/browser/monastery.mjs`, nuova, nella CI; prima / ora):

| | prima | ora |
|---|---|---|
| riparazione, 3 civili dalla cinta (clic su tetto, ala, cortile, muro) | +178 / 0 / 0 / 0 | +326 in tutti e 4, 3 al lavoro |
| riparazione da ovest, da dietro, dal villaggio | +208 (2 su 3) / +330 / 0 | +324 / +332 / +541, 3 su 3 |
| a vita piena | 2970 su 3000, fermi | 3000, fermi, legno non speso |
| 3 guerrieri nemici fra la cinta e il cortile | fuoco dopo 1332 passi, -4 | fuoco dopo 70 passi, -69 in 1500 |
| celle delle mura aperte dopo la porta | 12 su 250 | 0 |
| caserma al posto della porta, 3 arieti | fermi davanti, mai colpita | la colpiscono, nessuno entra |
| caserma spostata di +-60 px | dentro le mura 528 / 313 passi, monastero colpito | dentro le mura 0 |
| varco libero | arrivano al monastero, dentro le mura 484 passi | arrivano al monastero, dentro le mura 0 |
| salvato e ricaricato | (nessun pezzo) | pezzi legati |

Movimento (movement.mjs, 3 semi) e miniera (mining.mjs) identici al commit
prima; workers.mjs: stesse risorse (oro 480 invece di 470); consegne, civili
inattivi, mischia, soak e salvataggi senza errori.

### 9.30 Unita' appena prodotte verso la bandiera di raccolta

Segnalazione dell'autore (12 ottobre 2026): con la bandierina in un punto
vicino il pathfinding non si attiva, e se il punto e' irraggiungibile o
occupato l'unita' appena creata si incasina. Proposta: attivare comunque il
pathfinding e trovare subito un altro punto di raccolta valido.

**Cosa succedeva** (prova qui sotto, `match`, caserma vicino al fiume):
- da vicino (meno di 400 px, nessun edificio o albero sulla linea) l'unita'
  andava dritta con mp_potential_step: le unita' prodotte prima, gia' ferme
  al loro posto, la bloccavano; avanti e indietro per secondi (fino a 230
  inversioni), poi arrivo "per rinuncia" (§6.1 n.89) anche a 190 px dal
  posto;
- il posto (rallySpot, §7.10) era libero ma non sempre raggiungibile (oltre
  la riva, in un bosco chiuso);
- i posti promessi si escludevano entro 48 px: i cavalieri (91 px)
  finivano sovrapposti;
- senza bandiera o con la bandiera sull'edificio l'unita' restava dove
  nasce, dentro l'edificio;
- i civili dal centro: lo stesso, senza nemmeno la scelta del posto;
- in piu' (§9.29) pali e statue perdevano le loro celle nella griglia se
  accanto spariva un edificio, e le unita' ci finivano contro.

**Ora** (pathing.js, units.js, ranged.js, production.js, civilians.js):
- `rallySpot`: il posto e' raggiungibile dall'unita' fra gli ostacoli fissi;
  i posti promessi si escludono entro la misura della maschera;
- `rallyGo` (al posto di scrMove nell'Alarm_10 di guerriero, picchiere,
  cavaliere e arciere): campo dei soli ostacoli fissi verso il posto e il
  posto come una casella della formazione (§8.11): unico, raggiunto anche da
  vicino col pathfinding quando la linea e' chiusa, passando sopra gli
  alleati. Se non e' raggiungibile, come prima;
- `snapToSlot`: arrivata a 10 px dalla casella sovrapposta a un edificio o a
  un albero (col flow field si passa senza collisioni), l'unita' va sulla
  casella se e' libera (vale anche per le caselle della formazione);
- caserma e stalla senza bandiera (o con la bandiera sull'edificio): se
  l'unita' nasce sovrapposta all'edificio, va al posto libero piu' vicino;
- civili: senza un lavoro sotto la bandiera, come i soldati; con un lavoro
  (albero, miniera, campo, cantiere) come prima;
- `markInstance`: tiene chiuse le celle di chiunque abbia segnato la
  griglia (gridMark), non solo delle famiglie di initCost.

**Prova** (`game/test/browser/rally.mjs`, nuova, nella CI con 12 direzioni
a 150 e 300 px; completa con `ANGLES=24 RADII=150,260,380`): l'edificio in
un posto libero, la bandiera in 72 punti attorno (sull'edificio, su alberi,
nel fiume, su altre unita', in celle chiuse), 3 unita' per bandiera seguite
per 1300 passi. Prova completa, 216 unita' per riga; inversioni (di chi non
lavora) / unita' a oltre 40 px dal posto / sovrapposte a edifici o alberi:

| | prima | ora |
|---|---|---|
| match, caserma presso il fiume | 890 (max 230) / 10 / 0 | 15 / 0 / 0 |
| match, stalla presso il fiume | 105 / 23 / 20 | 77 (max 13) / 0 / 0 |
| match, caserma presso il centro | 738 / 18 / 2 (1 ferma) | 0 / 0 / 0 |
| match, stalla presso il centro | 1760 / 35 / 8 | 19 / 0 / 0 |
| match, centro (civili), due posti | 285 e 969 / 45 e 57 / 3 e 1 | 10 e 0 / 0 / 0 |
| lvl02, caserma | 343 / 36 / 3 | 6 / 0 / 0 |
| lvl02, stalla | 1363 (max 338) / 39 / 6 | 17 / 0 / 0 |

Movimento (movement.mjs, 3 semi: inversioni 265/489/203 -> 282/289/204),
civili al lavoro, consegne, inattivi, miniera, mischia, monastero, soak e
salvataggi senza differenze di rilievo o errori. Nell'esperimento, creare e
distruggere edifici di prova liberava le celle di un palo: da li' la
correzione di `markInstance` per pali e statue.

### 9.31 Gruppo misto contro un edificio da incendiare; inizio del livello 3

Segnalazioni dell'autore (12 ottobre 2026): con un gruppo misto, clic destro
su un edificio nemico infiammabile: le unita' che non danno fuoco (arcieri,
cavalieri) si incasinano invece di restare ferme; dovrebbero non muoversi
e anzi spostarsi per far passare chi da' fuoco. Per alleati e nemici. E nel
livello 3 la schermata d'inizio e' al buio: va centrata sulle unita' che
dialogano in basso a destra.

**Cosa succedeva** [C, enemy_house/caserma/stalla Mouse_RightReleased]: il
clic sull'edificio da' il fuoco ai fanti selezionati, ma subito dopo il
GlobalRightReleased di cavalieri e arcieri li manda al punto cliccato,
dentro l'edificio: si ammassavano contro di lui e davanti ai fanti, che
giravano attorno e andavano avanti e indietro (fino a 264 inversioni); a
fine prova fino a 3 unita' sovrapposte all'edificio. In piu' due difetti
del porting: un fante che andava a dare fuoco si fermava se arrivava a una
tappa del percorso locale (melee.js, route, §7.7), col fuoco ancora da
appiccare, e non ripartiva piu'; e col flow field (senza collisioni) poteva
finire dentro l'edificio e tirare da li'.

**Ora**:
- `fireOrder` (siege.js): cavalieri e arcieri selezionati restano fermi
  (`holdOrder`, `holdStill` nel loro GlobalRightReleased; chi sta
  combattendo continua). Le macchine d'assedio attaccano l'edificio, come
  prima.
- `makeWay` (pathing.js): chi va a dare fuoco (fanti alleati e nemici) fa
  spostare di lato le unita' ferme della sua parte che ha davanti (ogni 10
  passi, fino a 64 px avanti): di quanto basta perche' le maschere non si
  tocchino, dalla parte della strada in cui gia' stanno. Non chi combatte,
  da' fuoco o e' una macchina d'assedio. Nella scelta del posto attorno
  all'edificio (melee.js, FIRE) un posto occupato da un'unita' ferma che si
  sposta vale come libero.
- Fanti alleati che vanno a dare fuoco: niente arrivo sulle tappe (si
  fermano quando cominciano a tirare); dentro l'edificio ne escono verso il
  proprio posto prima di tirare; se restano sul posto senza avvicinarsi (meno
  di 24 px in 2 s, due volte di fila: nessun posto raggiungibile attorno,
  gli altri lati chiusi da altri edifici) si fermano dove sono invece di
  oscillare per sempre.

**Prova** (`game/test/browser/fireorder.mjs`, nuova, nella CI; zona aperta
di `match`; 4 guerrieri, 2 picchieri, 3 cavalieri, 3 arcieri; fanti che
tirano su 6 / inversioni dei fanti / spostamento massimo di cavalieri e
arcieri / unita' dentro un edificio alla fine):

| | prima | ora |
|---|---|---|
| casa, mescolati | 6 / 264 / 231 px / 1 | 6 / 0 / 56 px / 0 |
| caserma, mescolati | 6 / 20 / 249 px / 3 | 6 / 3 / 120 px / 0 |
| casa, cavalieri e arcieri davanti | 5 / 3 / 216 px / 2 | 6 / 57 / 88 px / 0 |
| caserma, cavalieri e arcieri davanti | 6 / 1 / 191 px / 2 | 6 / 5 / 61 px / 0 |
| casa, tutti vicini | 6 / 230 / 154 px / 0 | 6 / 0 / 14 px / 0 |
| nemici contro una casa, fermi davanti | 6 / 114 / 0 / 0 | 6 / 2 / 194 px / 0 |
| nemici, mescolati | 6 / 74 / 0 / 0 | 6 / 11 / 97 px / 0 |

(I nemici fermi prima non si spostavano mai: i fanti giravano loro attorno.
Ora si spostano, anche due volte per due fanti diversi.) In mezzo al
villaggio di `match`, con l'edificio stretto fra chiesa, caserme e stalla e
un solo lato libero: chi non trova posto ora si ferma (inversioni 915 ->
166 nel caso peggiore) invece di oscillare.

**Livello 3, inizio** (levels.js): la view della mappa (3215, 4160) era al
buio, lontana dai soldati (attorno a 5770, 5820). Al primo passo della regia
la vista va sul baricentro dei soldati (fino al bordo della mappa: sono
nell'angolo in basso a destra), dopo che la view ha preso la misura della
finestra; non dopo un caricamento. Il dialogo 3_0 compare accanto a loro.

Movimento (movement.mjs) identico al commit prima; mischia, monastero,
raccolta, soak e salvataggi senza errori.

### 9.32 Arieti che si sovrappongono attaccando lo stesso edificio

Segnalazione dell'autore (12 ottobre 2026): nel livello 3 gli arieti nemici
arrivati al monastero si sovrappongono quando iniziano ad attaccare;
probabilmente succede ovunque.

**Perche'** [C, ally_ariete / enemy_ariete Step]: ogni ariete ha per meta
l'origine dell'edificio, cioe' un punto dentro di lui. Il campo "largo"
delle macchine d'assedio (§8.14) porta allora alla cella raggiungibile piu'
vicina a quel punto, la stessa per tutti, e sul flow field ci si muove
senza collisioni: al monastero tre arieti finivano nello stesso identico
punto (4897, 642). Altrove arrivavano in colonna, uno sull'altro, e al
primo contatto con l'edificio cominciavano a colpire li', sovrapposti.

**Ora** (melee.js `ramSpot`, siege.js):
- ogni ariete punta a un posto suo attorno all'edificio, con i posti della
  mischia (§7.7): un settore di 60 gradi per ariete, a contatto o 24 px piu'
  in fuori, libero e raggiungibile per un ariete (il campo "largo" dalla sua
  posizione). Arieti alleati e nemici, col bersaglio imposto
  (`ramTarget`, §9.17) o scelto da soli;
- un ariete sovrapposto a un altro non comincia a colpire (chi sta gia'
  colpendo continua) e il suo posto non e' "dove e'" anche se e' a contatto:
  prosegue fino al suo.

**Prova** (`game/test/browser/rams.mjs`, nuova, nella CI; tre arieti
contro lo stesso edificio, 2500 passi; passi con due arieti sovrapposti che
colpiscono entrambi / coppie sovrapposte alla fine):

| | prima | ora |
|---|---|---|
| arieti nemici contro una casa (match) | 2311 / 1 | 0 / 0 |
| arieti alleati contro una caserma (match) | 0 / 0 | 0 / 0 |
| arieti delle ondate contro il monastero (lvl03) | 1570 / 3 (tutti nello stesso punto) | 0 / 0 |

In viaggio, sul flow field, gli arieti possono ancora passare uno sull'altro
(come le altre unita'); si separano prima di colpire. Monastero (arieti
contro mura e caserma), mischia, raccolta, fuoco, soak e salvataggi senza
errori.

### 9.33 Campo bruciato: nere solo le spighe

Richiesta dell'autore (12 ottobre 2026): un campo di grano bruciato diventa
tutto nero; nere solo le spighe, non il terreno sotto.

**Perche'** [C, campo Step, "quando prende fuoco"]: le spighe spariscono e
al loro posto nascono 1700 spighe bruciate (nere e grigie, alpha 0,7) sparse
su tutto il rombo, che svaniscono in 700-800 passi; il terreno diventa
`campo_maggese` (la terra arata, marrone). Le 1700 spighe coprono il
terreno: il campo era una macchia nera.

**Ora** (effects.js `campoStep`): le spighe delle righe (§8.16) diventano
nere al loro posto (ondeggiano ancora) e svaniscono in 700-800 passi come
nell'originale; niente spighe in piu'. Il terreno resta la terra arata,
visibile fra le righe. I salvataggi di prima delle righe (un solo sistema di
spighe) bruciano come l'originale.
Prova (Chromium, `match`): screenshot a 40 e 300 passi dall'incendio, prima
il rombo nero, ora le righe nere sulla terra arata; salvato a meta'
incendio, ripristino identico. Soak e salvataggi senza errori.

### 9.34 Barra della vita sui cantieri

Richiesta dell'autore (12 ottobre 2026): col puntatore sopra un cantiere si
dovrebbe vedere la barra della vita, e non succede.

[C] Nell'originale i cantieri (`*_fond`, `mura_*_fond`, `campo_fond`) non
hanno un Draw_End: la vita si vede solo nella scheda, selezionandoli; la
barra col puntatore sopra c'e' solo sugli edifici finiti (`casa` Draw_End:
`selected`, `hover` o `hit`). Ora anche i cantieri la disegnano, con la
stessa regola e nello stesso punto (`fondLifeBar`, buildings.js, walls.js).
L'`hover` arrivava gia' (ally_build Mouse_MouseEnter).
Prova (Chromium, `match`): cantiere di casa, caserma, mura e campo al 40%,
puntatore sopra: hover 1 e la barra disegnata su tutti e quattro. Soak e
salvataggi senza errori.

### 9.35 Schermate finali: niente punteggio

Richiesta dell'autore (12 ottobre 2026): nella sconfitta "hai resistito per
x minuti" solo nel tutorial e nel livello 3; il punteggio via ovunque.
endgame.js: la sconfitta mostra il titolo, il tempo resistito solo in
`match` e `lvl03` (le righe salgono negli altri livelli) e le basi
distrutte; tolti il punteggio finale (sconfitta) e quello parziale (vittoria
del tutorial), e i due testi da texts.js. ui.mjs (schermate finali in sei
lingue e tre risoluzioni) senza problemi; soak senza errori.

### 9.36 L'acqua dei fiumi: riflessi, increspature, schiuma

Domanda dell'autore (12 ottobre 2026): l'animazione tremolante sul fiume ha
senso? Alternative? [C] `fiume_animazione` (anim_fiume, 129x106 px, tre
fotogrammi di puntini bianchi quasi uguali, image_speed 0,3): tremola sul
posto invece di scorrere, sono toppe ferme, piazzate a mano (10 nel
tutorial, nessuna nei livelli 2 e 3). Scelte dall'autore le prime tre
alternative proposte.

**Ora** (effects.js `waterLife`, dal passo del manager): su tutta l'acqua
della room (la mappa dell'acqua degli sprite del fiume, §8.13), senza
oggetti da piazzare:
- riflessi: trattini chiari orientati come il pezzo di fiume (l'asse
  principale delle sue celle d'acqua) che compaiono e svaniscono in 1,5-2,5 s
  scivolando lungo di lui (3 punti a caso nella view a passo);
- increspature: in media un anello ogni 40 passi nella view;
- schiuma: puntini fermi lungo le rive (un terzo delle celle d'acqua accanto
  alla terra), creati una volta per room, che "respirano" appena.
Categoria "grass" (erba e spighe nelle opzioni grafiche). `fiume_animazione`
non si carica piu' (app.js, in tutte le room).

**Trovato strada facendo**: i pezzi di fiume hanno depth -y [C, fiume_*
Create], e gli anelli della pioggia (§8.13) stavano a depth -21: si
disegnavano prima del fiume, che li copriva (si vedevano solo oltre la
riva). Ora ogni effetto dell'acqua sta in un sistema per pezzo di fiume,
appena sopra di lui (depth del pezzo - 0,5: `waterSystem`), anche gli
anelli della pioggia.

Prova (Chromium): screenshot e GIF prima/dopo nel tutorial, livelli 2 e 3;
salvataggi con gli effetti, ripristino identico; soak senza errori. Costo
nel tutorial (1300 particelle in piu', quasi tutte schiuma): ~0,3 ms per
passo e ~0,4 ms per fotogramma su ~11 ms. Da tarare con l'autore: quantita',
luminosita', dimensioni.


Ritaratura dopo la prima prova dell'autore ("molto molto veloci, un pelo
piu' visibili"): i riflessi vivono 3,5-5,5 s (erano 1,5-2,5) e scivolano a
meno di meta' della velocita', piu' grandi e piu' chiari (alpha di picco
0,95), 2 punti a caso nella view a passo invece di 3 (vivendo il doppio, a
schermo ce ne sono di piu'); gli anelli si allargano piu' piano (110-140
passi); la schiuma e' un po' piu' opaca (0,5-0,65) e respira piu' lenta.

### 9.37 Macchie fiorite

Richiesta dell'autore (12 ottobre 2026): macchie di particelle coi fiori
che ha disegnato (`nuovi/particelle/`: due papaveri e due fiori gialli,
52x183 px al doppio, lo stelo che tocca il fondo), in combinazioni diverse.

**Sprite**: tools/05_atlas.py (`derived_sprites`, `FIORI`) li riduce a
meta' (26x92 px, gruppo "ambiente") con l'origine al piede dello stelo:
`papavero1`, `papavero2`, `fiore_giallo1`, `fiore_giallo2`.

**Oggetti** (nuovi.json, senza sprite, depth -1; effects.js `DECOR`, come
burst_erba1 a fasce di profondita', §8.17): ellisse 400x250 px (`DECOR_SIZE`;
le macchie d'erba restano 1000x600), fiori a 0,45-0,7 della misura che
ondeggiano come l'erba, con una tinta appena piu' scura su alcuni.
| oggetto               | contenuto                                  |
|-----------------------|--------------------------------------------|
| `fiori_papaveri`      | 90 papaveri, senza erba                    |
| `fiori_papaveri_erba` | l'erba di burst_erba1 (1/6: ~430) + 64 papaveri |
| `fiori_gialli_erba`   | erba + 64 fiori gialli                     |
| `fiori_prato`         | erba + 36 papaveri + 36 fiori gialli       |
Provata prima una versione piu' fitta (fiori a 0,55-0,85, 100-140 per
macchia): al centro della gaussiana diventavano una chiazza unica di colore.

**Kit di Tiled**: tileset "natura", con l'anteprima com'e' in partita
(11_tiled_kit `decor_image`, ellisse e semiassi da `tiledkit.DECOR`, che ora
li tiene per ogni macchia; 12_tiled_import li usa per l'ordine
dell'anteprima). Categoria "grass" nelle opzioni grafiche (densita').

Prova (Chromium): le quattro macchie nel match con unita' dentro
(immerse come nell'erba); `npm test`, saves.mjs, ui.mjs, 12 --check
(match, lvl01, lvl02 identiche).

### 9.38 Campagna, inattivi, ordine di attacco, fiamme

Segnalazioni e richieste dell'autore (13 ottobre 2026).

**Livello 2: popcap 30 all'inizio** (state.js, `newGlobals`): prima 0 come
in tutte le room. Attenzione: la popolazione iniziale del livello 2 vale
gia' 32 (l'esercito di partenza), quindi con 30 non si produce ancora
nulla finche' non si costruisce una casa (+10). *Sostituito in §9.39: il
popcap 30 arriva vinta la battaglia iniziale.*

**Livello 1 tutto di notte** (manager.js): l'originale armava l'alba
(alarm 1) a 100000 passi, ma l'alarm 0 (6000 passi), trovando gia' la
notte, la riarmava a 2000: l'alba arrivava dopo ~8000 passi (2 min 13 s).
Ora nel livello 1 l'alarm 1 non fa nulla; l'alarm 0 resta (il suggerimento
della notte compare ancora). `endlessNight` rimette la notte anche
caricando un salvataggio di prima, magari ad alba cominciata (snapshot.js).

**Il riquadro degli inattivi si accende sotto il puntatore** come gli altri
pulsanti. Lo faceva gia' il Draw GUI di idle_clicker [C], ma viene prima di
quello del manager, che ci ridisegnava sopra il riquadro normale (vetro a
0,69) e lo copriva: l'hover c'era (`hover` = 1) ma non si vedeva. Ora il
manager disegna il riquadro a 0,99 quando idle_clicker ha `hover`.

**Ordine di attacco: i soldati in mischia restavano fermi** (units.js).
Tre cause, riprodotte con un gruppo misto mandato col clic destro su un
nemico (livelli 1 e 2 e zona aperta del match):
1. *Precedenza fra alleati sovrapposti* [C]: lontano dalla meta (flow
   field) aspetta chi ha l'`ordo` piu' alto, vicino (nearRank, solo il
   guerriero) chi lo ha piu' basso (il commento dell'autore dice "se l'altro
   ha rank piu' alto e si sta muovendo tu fermati" in entrambi i casi). Due
   guerrieri sovrapposti, uno lontano e uno vicino alla meta, si aspettavano
   a vicenda: fermi per secondi (in media 40 dei primi 120 passi), mentre gli
   arcieri, che non aspettano, partivano. Capovolgere la regola lontana
   spostava solo l'attesa sui cavalieri (che in formazione devono passare
   davanti, §8.11). Ora (`yieldTo`/`noYield`) non si aspetta chi sta gia'
   aspettando noi, e con un ordine di attacco (warwork 1) non si aspetta
   nessuno: il flow field e' senza collisioni e vicino al nemico i posti li
   assegna `meleeSpot`. Gli spostamenti di gruppo non cambiano
   (movement.mjs: stessi numeri di prima).
2. *Bersaglio circondato*: col bersaglio scelto col clic destro il posto in
   mischia si cercava solo attorno a lui; con tutti i settori presi (altri
   alleati, nemici accanto) si spingeva verso il suo centro, fermi dietro
   chi combatteva. Ora un posto attorno a un nemico vicino a lui, che
   diventa il bersaglio (anche in difesa, dove senza bersaglio chi e' oltre
   i 200 px si sarebbe fermato).
3. *Bersaglio irraggiungibile* (`targetStuck`): chi per 90 passi non si
   avvicina al bersaglio scelto (altri nemici o alleati in mezzo) ci
   rinuncia e attacca come senza ordine, il nemico piu' vicino.
Resta: un bersaglio dietro le mura (il flow field porta alla cella
raggiungibile piu' vicina, li' l'unita' oscilla fra il campo e la meta).

**Le fiamme della stalla** (effects.js, `FIRE`): la stalla prendeva fuoco
(`onfire`, prova burn.mjs), ma la vita delle fiamme si misura dai danni,
`((A - vita)/2, (B - vita)/2)` con A e B per famiglia di grandezza [C]: a vita
piena la casa le ha di 15-20 passi e la caserma di 15-25, ma la stalla (380,
anche nemica) di 0-10, il mulino (150) di 0-5 e il magazzino (140) di 5-10:
in fiamme sembravano non bruciare. Ora A e B partono dalla loro vita come
per casa e caserma (stalla 410/430, mulino 180/190, magazzino 170/180). Gli
altri edifici di legno (casa, caserma, centro, campo, case e caserme
nemiche) erano gia' cosi'; quelli di pietra non bruciano.

**Prove** (nuove, nella CI): `game/test/browser/attackorder.mjs` (gruppi
distanziati, stretti e in formazione, nemici vicini e lontani, di notte e in
difesa: tutti i soldati in mischia arrivano a colpire e aspettano in media
al piu' 20 passi; sul codice di prima 17 errori, ora nessuno) e
`game/test/browser/burn.mjs` (vita delle fiamme a vita piena per ogni
edificio di legno, e frecce incendiarie da quattro direzioni). Su scenari
dei livelli 1 e 2 coi nemici veri: attesa media nei primi 120 passi da 40 a
2 passi per i guerrieri, primo colpo da 131 a 72 passi. `npm test`, soak,
saves, melee, movement, rally, fireorder, rams, monastery, ui, idle,
workers, deposit.

### 9.39 Cantieri, sconfitta senza mosse, livello 2, carica partita, soldati in marcia

Richieste e segnalazioni dell'autore (13 ottobre 2026).

**Cantieri di caserma e stalla** (civilians.js, `BUILD_RATE`): ogni colpo di
martello (Alarm_2, ogni 13 passi) aggiunge 2 di vita invece di 1, come casa,
magazzino e mulino: la caserma si finisce in ~2270 passi con un civile
(erano ~4540), la stalla in ~2470.

**Sconfitta senza mosse** (endgame.js, `noMovesCheck`, da `levelStep`): si
perde se per 180 passi (3 s) di fila non c'e' nessuna unita' alleata
(soldati o civili), nessuna produzione in corso che possa finire e nessun
edificio che possa cominciarne una: il centro con 50 cibo, caserma, stalla
e castello con le risorse di almeno un'unita'; in tutti i casi con posto
nella popolazione. Gli arcieri di presidio non contano (da torre e castello
non escono). Non nella difesa del livello 3 (`g.l3.phase` 2): l'obiettivo e'
che il monastero resista, e puo' farlo da solo. La schermata di sconfitta
dice "Non hai piu' unita' e non puoi addestrarne di nuove" (`nomovesLost`).
Provato: match senza unita' e senza risorse, livelli 1, 2 e 3 senza unita'
-> sconfitta dopo 179 passi; match con 100 cibo e il centro, e difesa del
livello 3 -> no.

**Livello 2** (levels.js, `LV2_FIRST`): il popcap parte da 0 (come prima di
§9.38) e diventa 30 vinta la battaglia iniziale (`liberati1`: nessun nemico
nel rettangolo della partenza, gli stessi passi in cui arrivano i due civili
e il dialogo 2_1), con un premio: 200 cibo, 200 legno, 100 oro (le icone
che salgono, *_prizedrawer).

**Carica partita nel menu di pausa** (pause.js, sottomenu `load`): prima
caricava solo lo slot della room in corso; ora, come il menu principale,
l'elenco degli slot di tutte le room col livello e la data (menu.js,
`slotLabel`, usata da entrambi), "Carica da file" e "Indietro" (che torna a
"Salva e carica"). Nella stessa room resta il parametro della campagna.

**Soldati fermi sulle lunghe distanze** (enemies.js, `rightReleased`;
segnalazione: solo da lontano, nessuno sovrapposto). Riprodotto: un gruppo
ancora in marcia dopo un ordine di spostamento (warwork 4) mandato col clic
destro contro un nemico a 800 px: guerrieri, picchieri e cavalieri restavano
fermi, partivano solo gli arcieri. Il nemico cliccato diventa il bersaglio
(target_eu) solo per chi ha warwork 0 o 1 [C]; il GlobalRightReleased da' a
tutti warwork 1, e chi non aveva il bersaglio cercava il nemico piu' vicino
e, oltre `comp` (700 px, 448 in verticale), si fermava subito.
Gli arcieri hanno il loro ordine di attacco (atkorder, §6.4). Ora il
bersaglio lo prende anche chi cammina; chi sta colpendo (warwork 2)
continua come prima.

**Prova** (attackorder.mjs, tre casi in piu'): nemico a 900 px; gruppo in
marcia mandato contro un nemico a 300 e a 800 px (sul codice di prima: a
800 px tutti i soldati in mischia fermi). Da lontano 7 alleati contro 3
nemici fermi e immortali: l'ultimo ad arrivare puo' aspettare un posto, la
prova chiede che arrivi alla mischia (120 px). ui.mjs fotografa anche il
sottomenu "Carica partita".

### 9.40 Livello 4: il fiume grande e il ponte da riparare

Sprite dell'autore (13 ottobre 2026, `nuovi/sprites/`): `Fiume_Completo`
(3773x2904, il fiume del livello 4 col ponte rotto gia' dipinto),
`Ponte_1`..`Ponte_5` (529x393, gli stadi della riparazione, ciascuno con un
pezzo di fiume e le rive trasparenti) e `Ponte_5B` (la balaustra anteriore
del ponte finito, separata).

**Dove sta il ponte**: `Ponte_1` coincide pixel per pixel con il riquadro
(1630, 1168) del fiume (cercato confrontando i pixel). Gli stadi 2..5
differiscono dal fiume in 37-69 mila pixel su ~150 mila.

**tools/nuovi.py**, opzioni nuove degli sprite (nuovi.json):
`maschera: "alpha"` (maschera precisa dai pixel non trasparenti),
`poligono` + `misura` (sprite di sola maschera: `Ponte_varco`), `buchi`
(una maschera tolta da un'altra: il varco del ponte tolto dal fiume),
`acqua` (celle d'acqua per riflessi, schiuma e pioggia, come i fiume*:
06_masks), `pezzi` (riquadri da N px, uno sprite `<sprite>#<n>` per
riquadro non vuoto, tutti alla depth dell'istanza), `gruppo` (gruppo
d'atlas) e `differenza` (i pixel uguali a quelli di un altro sprite in un
punto diventano trasparenti: gli stadi del ponte disegnano solo cio' che
cambia, sotto si vede il fiume con i suoi effetti; `Ponte_1` e' vuoto).

**Il fiume** (`fiume_grande`, bridge.js): non sta in una pagina d'atlas da
2048: 42 riquadri da 256 px nel gruppo terreno (+4,6 MB di memoria GPU,
nessuna pagina grande in piu'), "fette" senza bordo anteriore (scenario.js,
front null) alla depth -y della sua cima, come i fiume_* dell'originale.
Origine al centro (1886, 1452): nel kit sta nel tileset "nuovi", allineato
al centro, senza bordo trasparente doppio. Maschera per pixel dall'alpha,
col varco del ponte; 15 661 celle d'acqua da 8 px.

**Il ponte** (`ponte`): nasce dal Create del fiume nel punto in cui il fiume
lo ha dipinto (con scala e rotazione del fiume). E' un ally_fondamenta (solo
quello: non lo attaccano gli assedi, non e' fra gli edifici della minimappa)
con la maschera `Ponte_varco` (il piano del ponte fra le due ringhiere,
rientrato di 4 px, allungato di 24 px sulle rive), che chiude il varco del
fiume e la griglia dei percorsi. Vita 1..599 (poi 4400 e legno: §9.41), +1 a colpo di martello (13
passi): ~130 s con un civile, 34 s con quattro (misurato). Gli stadi
Ponte_2..4 a un quarto, meta' e tre quarti (in dissolvenza, swapSprite).
Finito: `ponte_fatto` (Ponte_5, non solido, depth -y-30: chi ci cammina
sopra si disegna dopo), la griglia libera le celle del varco (quelle che
tocca ancora l'acqua restano chiuse, pathing.js markInstance) e
`ponte_balaustra` (Ponte_5B a fette da 32 px, ognuna con la depth del suo
bordo anteriore: chi passa sul ponte le sta dietro).

**I civili** (civilians.js): col clic destro sul ponte (dentro il varco)
vanno all'imbocco piu' vicino da cui ci si arriva (fieldTo), ognuno in un
punto diverso del bordo (bridge.js, `bridgeEnds`); lavorano fino a 60 px
dal varco (`buildReach`: all'imbocco sud, stretto fra il fiume e la riva,
c'e' posto per due, gli altri restavano in coda per sempre). Finito un
altro cantiere, non vanno da soli al ponte (`noAuto`: l'originale manda chi
finisce al cantiere piu' vicino, e il ponte c'e' sempre).

**La mappa** (`mappe/lvl04.tmx`, 3450x4100): il fiume da bordo a bordo
(l'estremita' sinistra, tagliata in diagonale, 200 px oltre il bordo; la
destra, verticale, sul bordo), quattro civili e tre guerrieri sulla riva sud
vicino al ponte per provarlo, il manager e la vista iniziale. Room `lvl04`
(app.js, `?room=lvl04`), senza regia ne' campagna per ora; salvataggi.

**Kit di Tiled**: le tile aggiunte dopo la prima versione vanno in fondo al
loro tileset (tiledkit.py `APPENDED`, `tile_rank`). Con l'ordine alfabetico
le macchie fiorite (§9.37) erano finite in mezzo a "natura", prima di
graa11..graa15, e il fiume sarebbe finito prima del monastero in "nuovi":
gli id delle tile dopo di loro cambiavano, e una mappa gia' disegnata li
avrebbe letti come altri oggetti (lvl02 e lvl03 non usano graa: i loro
scenari non cambiano). Ora "natura" e' com'era prima dei fiori, coi fiori in
fondo; "nuovi" e' monastero, poi fiume_grande.

**Prova** (`game/test/browser/bridge.mjs`, nuova, nella CI; soak e saves
anche su lvl04): col ponte rotto un guerriero non arriva sulla riva nord; i
quattro civili mandati col clic destro lavorano tutti; stadi
Ponte_1..Ponte_4; finito in 2027 passi; i tre guerrieri passano sulla riva
nord in 280 passi. Le macchine d'assedio non passano (il loro campo "largo",
§8.14, non attraversa il varco di ~100 px): da decidere con l'autore.

### 9.41 Il ponte del livello 4: costo, durata, barra

Decisioni dell'autore (13 ottobre 2026), dopo §9.40:
- la riparazione e' uno dei due obiettivi del livello (ricostruire il ponte
  resistendo agli attacchi di una piccola base a nord): deve durare minuti
  con 3-4 civili e costare tanto legno. Vita 4400 (era 599), +1 a colpo:
  3 min 58 s con quattro civili (misurato, 14 297 passi), ~16 minuti con
  uno. Legno: 1000 in tutto (bridge.js `BRIDGE.wood`), pagati colpo per
  colpo (`woodDue`: la quota del totale arrotondata man mano, la somma e'
  esatta); senza legno il colpo non vale e l'icona del legno lampeggia; i
  civili restano al lavoro e riprendono quando il legno arriva. Numeri da
  tarare giocando;
- la barra della vita del cantiere sempre visibile finche' non e' finito,
  sopra il ponte; selezionandolo, la scheda con vita e icona del legno (piu'
  larga di quella degli edifici: quattro cifre);
- i nemici non lo danneggiano (non e' un ally_build: assedi e frecce
  incendiarie non lo prendono di mira) e, finito, lo usano anche loro;
- per ora niente macchine d'assedio sul ponte (gia' cosi': non ci passano).

Prova (bridge.mjs): senza legno per 600 passi il ponte resta a 1; col
legno finito fra 3 e 5 minuti di gioco con quattro civili, spendendo 1000.

### 9.42 La scheda del ponte e la sua icona

Richiesta dell'autore (13 ottobre 2026): la scheda del ponte in
riparazione identica a quella degli altri cantieri, con l'icona del ponte
che ha caricato (`nuovi/sprites/icons8-bridge-64.png`).

- Icona: `ico_ponte`, sprite derivato (nuovi.json "derivati", gruppo gui):
  larga 58 px e nera all'alpha 0,7 (opzione nuova `alpha` dei derivati),
  come le icone degli edifici dell'originale (nere, alpha massimo 179/255,
  disegno largo 56-61 px).
- Scheda: la stessa degli edifici e dei cantieri (buildings.js `panel`,
  130x130 px). In §9.41 la vita del ponte arrivava a 4400 e "1700 / 4400"
  non ci stava (avevo allargato la scheda): ora la vita va da 1 a 999, tre
  cifre come gli altri, con 998/4399 a colpo (civilians.js `BUILD_RATE`).
  Durata e legno non cambiano: 4399 colpi, 3 min 58 s con quattro civili,
  1000 legno (bridge.mjs, misurato di nuovo). `panel` scrive la vita senza
  decimali.

### 9.43 Gli edifici nemici mai usati dell'originale

Domanda e richiesta dell'autore (13 ottobre 2026). Il progetto GameMaker ha
le versioni nemiche (`*_b`, tetti azzurri e cupole) di quasi tutti gli
edifici. Usate: `c1b`..`c6b` (enemy_house ne sceglie una a caso), `cas_b`,
`stal_b`, `torre_b`. Mai usate da un oggetto: `cc_b` (centro), `chiesa_b`,
`castello_b`, `magazzino_b`, `barn_b` (mulino, 3 fotogrammi: le pale che
girano; quello alleato in partita usa `mul1`, 9 fotogrammi). Nessuno
sprite di lavoratori nemici: le cartelle `b_*` sono solo dei militari
(guerriero, picchiere, arciere, cavaliere, ariete, catapulta, firegroup).

Ora sono oggetti (nuovi.json, con lo sprite e la maschera dell'originale:
quelle degli edifici alleati, che combaciano con centro, chiesa e castello;
su magazzino e mulino coprono la base, la casetta del mulino resta fuori):

| oggetto | sprite | vita | rovina | legno | cosa fa |
|---|---|---|---|---|---|
| enemy_centro | cc_b | 400 | ccruin | si' | una freccia ogni 35 passi su un alleato entro 600 px, come il centro alleato |
| enemy_chiesa | chiesa_b | 300 | chiesaruin | no | ogni 180 passi +3 vita ai nemici feriti entro 800 px, come la chiesa alleata |
| enemy_castello | castello_b | 900 | castelloruin | no | due frecce ogni 50 passi, come la torre nemica |
| enemy_magazzino | magazzino_b | 140 | magruin | si' | niente |
| enemy_mulino | barn_b | 150 | barnruin | si' | niente; le pale girano (image_speed 0,1) |

Come gli altri edifici nemici (enemybuild.js, `KIND`): nascosti finche'
un alleato non li vede, poi visibili; barra e scheda con la loro icona
(ico_centro, ico_chiesa...); quelli di legno bruciano con le frecce
incendiarie (siege.js FIRE_HIT, effects.js FIRE: fiamme come i loro
corrispondenti alleati) e il clic destro con fanti selezionati li manda a
dar loro fuoco; chiesa e castello no (di pietra: solo arieti e catapulte).
Contano fra gli enemy_build (minimappa, vittoria del livello 2, obiettivi
"distruggi gli edifici nemici"). Nel kit di Tiled in fondo al tileset
"nemici" (tiledkit.py APPENDED). Gli sprite *_b entrano nell'atlas
(05_atlas: anche gli sprite del progetto usati da nuovi.json; +2 MB).

Prova (`game/test/browser/enemybuildings.mjs`, nella CI): per ognuno
visibilita', frecce, cura, fuoco (e fiamme visibili) solo dove serve, pale
del mulino, rovina.

### 9.44 L'economia nemica, primo passo: i lavoratori nemici lavorano

Decisione dell'autore (13 ottobre 2026): i lavoratori nemici devono
lavorare davvero, come in un RTS. Scelte: (1) l'economia c'e' solo nei
livelli con un centro nemico (enemy_centro); i livelli 1-3 restano con le
ondate a tempo; (2) nella campagna i cantieri nemici li mette l'autore in
Tiled (segnaposto "cantiere nemico", passo 3); la scelta automatica dei
posti solo in future schermaglie 1 contro 1 simmetriche; colpiti, i
lavoratori scappano verso il centro; (3) il centro fa lavoratori pagando
cibo fino a un tetto, caserma e stalla soldati pagando risorse, una regia
semplice per livello; si va per passi: 1 raccolta e depositi con scorte
nemiche, 2 produzione che paga, 3 riparazione, ricostruzione e cantieri,
4 regia per livello. (4) Il kit di Tiled non si tocca finche' l'autore non
lo dice: i nuovi oggetti hanno `kit: false`.

Questo e' il passo 1.

**Le fazioni dei civili.** civilians.js ora ha `SIDES` (ally, enemy): i
nomi di omino, unita', depositi (magazza, barn), fondamenta, edifici e
campo di ogni fazione; `sideOf(i)` e `poolOf(w, i)` (le scorte: `global`
per il giocatore, `global.en` per il nemico). Il movimento, i depositi, il
lavoro, la costruzione e i campi del civile usano questi nomi; le parti del
giocatore (selezione, interfaccia, lampeggio del legno) solo con
`S.player`. Il campo di flusso verso un bersaglio (`fieldTo`) passa la
fazione a `goalField` (per i nemici anche le porte del giocatore sono
ostacolo, come per i soldati nemici, §3.8). `orderWork(w, p, i, kind, t)` da' un ordine a un civile da
codice (legno, oro, pietra, cibo, o "move"): lo usa la regia nemica.

**Le scorte nemiche.** `global.en = {food, wood, gold, stone, pop, idle}`
(state.js; creato anche alla nascita di un lavoratore o della regia, per i
salvataggi vecchi). I depositi: enemy_centro e' enemy_magazza ed
enemy_barn, enemy_magazzino enemy_magazza, enemy_mulino enemy_barn.

**Oggetti nuovi** (economy.js, nuovi.json, tutti `kit: false`):

- `enemy_omino`: il civile alleato con la fazione nemica; parenti
  enemy_unit ed enemy (i soldati alleati lo attaccano, le frecce lo
  colpiscono: vita 50, danni 5 da guerriero e picchiere, 8 dal cavaliere, 5
  dalle frecce). Visibile come le unita' nemiche (nebbia); col puntatore
  sopra mostra la barra, il clic destro con fanti o cavalieri selezionati
  lo fa bersaglio. Colpito, lascia il lavoro e scappa (col carico) verso il
  centro nemico, o l'edificio nemico piu' vicino; per 600 passi la regia
  non lo rimanda al lavoro. [Provvisorio] Sprite del civile alleato tinto
  d'azzurro, finche' l'autore non carica i suoi.
- `enemy_campo`: il campo con la fazione nemica (enemy_wooden, brucia; il
  clic destro con fanti selezionati gli da' fuoco).
- `enemy_eco`: la regia. La crea la regia dei livelli (levels.js) se c'e'
  un enemy_centro e lei non c'e'. Alla prima nascita da' le scorte
  iniziali; ogni 20 passi manda ogni lavoratore fermo (non in fuga) alla
  risorsa che manca di piu' rispetto alla ripartizione voluta, la piu'
  vicina fra quelle entro 1600 px dal deposito nemico piu' vicino (cibo:
  un campo nemico libero); se il centro non sta gia' producendo e i
  lavoratori sono meno del voluto, ne paga uno in cibo e lo fa nascere dopo
  1000 passi.

I numeri, per livello (`ECO[room]`) o di norma (`ECO.default`): 6
lavoratori; scorte iniziali 200 cibo, 100 legno, 50 oro; ripartizione
legno 3, oro 2, cibo 2, pietra 1; 50 cibo e 1000 passi per lavoratore.

I lavoratori nemici non contano per la difesa dei livelli (levels.js:
areaDifesa, difendi, aggressione li saltano) e non sono nelle tabelle dei
soldati nemici.

Prova (`game/test/browser/economy.mjs`, nella CI): nella zona piu' aperta
del match un centro, un mulino, due campi, alberi, oro e pietra, tre
lavoratori nemici; dopo 9000 passi il nemico ha raccolto tutte e quattro
le risorse, i lavoratori sono 6, le scorte del giocatore non sono
cambiate; poi un guerriero alleato attacca un lavoratore, che scappa verso
il centro e muore.

### 9.45 L'economia nemica, passo 2: soldati pagati, riparazioni, ricostruzione

Richiesta dell'autore (13 ottobre 2026): il passo 2 (caserme e stalle che
producono pagando) e, per la campagna e il livello 4: "il nemico ricostruisce
solo gli edifici che ha perso, possibilmente nello stesso punto, non ne fa
di nuovi. Ovviamente possono anche riparare". Tutto nella regia
(economy.js, enemy_eco), solo dove c'e' l'economia (§9.44).

**Soldati.** Con almeno i lavoratori voluti (o senza centro) ogni caserma
nemica fa a turno guerriero, picchiere e arciere (`ECO.troops`), ogni
stalla cavalieri, uno alla volta in 1200 passi come caserma e stalla
alleate, pagandoli prima con le scorte nemiche ai costi delle unita'
alleate (production.js `PRODUCERS`: guerriero 75 cibo e 35 oro, picchiere
55 cibo e 45 legno, arciere 40 legno e 55 oro, cavaliere 50 cibo e 70 oro);
non oltre `ECO.army` soldati (12: tutti i nemici che non sono lavoratori,
anche quelli messi nella mappa). Nascono col ruolo 30 (in attesa) accanto
all'edificio (freeSpawnEnemy). La produzione a tempo dell'originale (alarm
3 della caserma, ruoli di aggr_assign) non c'e' dove c'e' la regia.

**Attacco** [provvisorio, il passo 4 lo fa per livello]: quando i soldati
della regia in attesa e fermi sono almeno `ECO.attackAt` (8) partono, col
flow field dei nemici, verso l'edificio alleato piu' vicino alla base
nemica (o l'unita' alleata); arrivati (ruolo 32) e fermi, verso il
bersaglio alleato piu' vicino, come in scr_attacca.

**Riparazioni.** Gli edifici nemici ora hanno `legno`/`pietra` come quelli
alleati (di legno: centro, caserma, stalla, case, magazzino, mulino; di
pietra: chiesa, castello, torre). Un edificio nemico danneggiato, senza
alleati entro 400 px e con il materiale nelle scorte, chiama fino a 2
lavoratori (fermi, se no i raccoglitori piu' vicini): riparano come i civili
alleati (azione 7: 1 legno o 1 pietra per punto di vita, il legno spegne il
fuoco). La regia li ferma a edificio intero, senza materiale o con un
alleato vicino (`repairEnd` di buildings.js vale solo per gli alleati).

**Ricostruzione.** Un edificio nemico distrutto (o un campo nemico
bruciato) finisce nella lista `global.en.lost` (oggetto, x, y: entra nei
salvataggi). [Decisione dell'autore] Il centro no: e' l'unico edificio che
non si ricostruisce mai, perso e' perso. Un cantiere alla volta: il primo
della lista in ordine (magazzino e mulino; campi; caserma; stalla; torre;
chiesa; case; castello),
quando si puo' pagare e il posto e' libero (nessun solido, unita' o
edificio sotto la maschera; le rovine si tolgono), nello stesso punto; nel
frattempo il suo costo resta da parte (lavoratori e soldati non lo
spendono). Il cantiere (`enemy_cantiere`, nuovi.json, `kit: false`) ha
sprite, fasi, maschera, vita e costo del cantiere alleato corrispondente
([decisione dell'autore, 19 ottobre 2026] anche lo sprite: i cantieri
nemici sono quelli alleati, non ce ne saranno di propri)
(buildings.js FAM, gli oggetti *_fond); fino a 3 lavoratori lo costruiscono
come i civili un ally_fondamenta (stessa vita per colpo). Finito, al suo
posto l'edificio nemico, che si vede come il cantiere. Il cantiere brucia
(frecce incendiarie -10; clic destro con fanti selezionati; fiamme che
crescono coi danni, effects.js `rel`); se brucia del tutto torna nella
lista. Il nemico non fa mai edifici nuovi, tranne magazzini e mulini
(§9.46) (nella campagna i "cantieri nemici" di Tiled, passo 3, restano da fare;
le posizioni automatiche solo nelle future schermaglie).

I numeri sono in `ECO.default` (army, troops, attackAt, repairers,
builders, rebuild, safe) e si cambiano per livello in `ECO[room]`
(`ECO.lvl04`, vuoto finche' non c'e' la mappa).

Prova (`game/test/browser/enemyarmy.mjs`, nella CI): nella zona piu' aperta
del match una base nemica con scorte abbondanti fa tutti e quattro i tipi
di soldati senza superare il tetto e parte all'attacco, senza toccare le
scorte del giocatore; la caserma danneggiata di 120 torna intera (119 legno
spesi); la stalla distrutta rinasce nello stesso punto da un cantiere (170
legno) in ~970 passi; il centro distrutto non torna; nessun edificio nuovo.

### 9.46 L'economia nemica: magazzini e mulini nuovi dove servono

Richiesta dell'autore (14 ottobre 2026): perso il centro, il nemico non fa
piu' lavoratori, ma le risorse le porta ancora al mulino (il cibo) e al
magazzino (il resto), come gia' faceva (§9.44: i depositi sono enemy_barn e
enemy_magazza, non solo il centro). In piu': "se non ha dove portare le
risorse o se e' troppo lontano puo' costruire nuovi magazzini e granai".
E' l'unica eccezione al "niente edifici nuovi" (§9.45).

**Dove si lavora.** Prima i lavoratori andavano solo alle risorse entro
1600 px dal deposito (enemy_magazza) piu' vicino, e senza deposito
restavano fermi. Ora, se non ce ne sono (o non c'e' un deposito), vanno
alla risorsa piu' vicina entro 3000 px (`SEARCH`), finche' si possono fare
depositi nuovi.

**Quando.** Ogni 20 passi, se non c'e' gia' un cantiere nemico (uno alla
volta, prima della ricostruzione degli edifici persi):
- un magazzino, se un raccoglitore di legno, oro o pietra lavora a una
  risorsa senza un centro o un magazzino nemico entro 900 px (`FAR`);
- un mulino, se un campo nemico non ha un centro o un mulino nemico entro
  900 px;
- non se un magazzino (o un mulino) e' gia' nella lista dei persi: lo
  rifa' la ricostruzione, nello stesso punto;
- al piu' `ECO.newDeposits` (4) depositi nuovi in una partita
  (`global.en.newDeposits`).
Si paga come il giocatore (magazzino 70 legno, mulino 60); finche' non si
puo', il costo resta da parte come per la ricostruzione.

**Dove.** Su anelli da 200 a 600 px attorno alla risorsa (o al campo),
16 punti per anello, prima quelli dalla parte dell'edificio nemico piu'
vicino; il primo libero (come per la ricostruzione: nessun solido, unita' o
edificio sotto la maschera) e raggiungibile dal lavoratore (campo dei
percorsi dei nemici; al piu' 4 prove per volta). Poi cantiere e lavoratori
come per la ricostruzione (enemy_cantiere).

Prova (`game/test/browser/enemydepots.mjs`, nella CI): senza centro e
senza magazzino, con un mulino, un campo accanto e uno a 1000 px, alberi a
1100 px: i lavoratori vanno agli alberi, il nemico vi costruisce accanto un
magazzino e il legno arriva nelle scorte; il campo lontano ha un mulino
nuovo accanto; nessun altro edificio. Anche `enemyarmy.mjs` ora lo
vede: distrutto il centro (l'unico deposito di legno, oro e pietra della
prova) il nemico si fa uno o due magazzini, dalle parti delle risorse.

### 9.47 Font Cinzel e titolo "Dust Veil"

Decisione dell'autore (14-19 ottobre 2026). Il gotico (Seagram tfb, §2.3,
§2.5) e' anacronistico per il 535: la scrittura gotica nasce nel XII
secolo; nel VI secolo si scriveva in capitale romana (iscrizioni) e in
onciale (libri). Confrontati nel gioco Seagram, Uncial Antiqua (onciale:
bello nei titoli, illeggibile nel testo piccolo: t come c, n come u),
Cinzel (capitale romana) e un misto; per il titolo anche Grenze Gotisch,
Cinzel Decorative e Marcellus SC. Scelti: **Cinzel** per il testo
dell'interfaccia e **Cinzel Decorative Bold** per i titoli.

**Font.** I TTF sono in `nuovi/font/` con le licenze (SIL OFL 1.1: si
possono usare e ridistribuire col gioco; "Cinzel" e' un nome riservato,
quindi i file non si modificano). `tools/05_atlas.py` (`FONT_TTF`,
`ttf_glyphs`) li rasterizza nel formato dei glifi di GameMaker, al posto
dei fogli Seagram: i tre font del gioco mantengono nome e altezza di riga
(il codice non cambia):

| font del gioco | uso | TTF | peso | px |
|---|---|---|---|---|
| GUI_1 | titoli delle schede, numeri, pulsanti | Cinzel | 700 | 19 |
| overdue | descrizioni, messaggi | Cinzel | 500 | 18 |
| gui_sblocco | titoli (Pausa, vittoria, sblocchi) | Cinzel Decorative Bold | - | 36 |

Le dimensioni: a parita' di frase ~12% piu' larghi del Seagram (Cinzel e'
piu' basso). Le maiuscole hanno il centro dove l'aveva il Seagram (testi
centrati nei pulsanti come prima). Lettere accentate e segni delle
traduzioni sono quelli veri del font (prima composti dalla lettera e da un
segno, §6.1): draw.js riduce ora solo gli spazi speciali (ß, œ, virgolette,
trattini lunghi, puntini si scrivono come sono). Anche i messaggi HTML
(domtext.js) usano i glifi nuovi. Cinzel non ha minuscole vere: le
minuscole sono maiuscolette.

L'elenco dei livelli della campagna ora si allarga per il nome piu' lungo
(menu.js `i.listR`): in tedesco "Schieb die Sonne beiseite" usciva di 1 px
(game/test/browser/ui.mjs).

**Titolo.** Il "535" sfumato del menu (sprite logo535 dell'originale) e'
diventato "Dust Veil" in Cinzel Decorative Bold (`logo_dustveil`, gruppo
ambiente come il logo535, nuovi.json): stesso grigio e stessa sfumatura
verso il basso, misurata riga per riga sul logo535 sull'altezza delle
maiuscole. Lo genera `tools/13_logo.py` (PNG versionato). Le icone della
PWA (tools/09_icons.py) e i nomi del gioco altrove (titolo della pagina,
manifest, zip) restano "535" finche' l'autore non decide.

### 9.48 Il mulino nemico dell'autore

L'autore ha disegnato il mulino nemico (nuovi/sprites/mub1..mub9.png): 9
fotogrammi con le 4 pale ruotate di 10 gradi l'uno dall'altro, come il
mulino alleato (mul1: 9 fotogrammi per un quarto di giro). Al posto di
barn_b (3 fotogrammi dell'originale).

**Allineamento.** Richiesta dell'autore: verificare il centro di ogni
immagine (dopo la post-produzione). Confrontata la parte ferma (torre e
casetta, righe 205-294) di ogni fotogramma col primo, spostamenti da -6 a
+6 px: i fotogrammi 2-9 erano fuori di 1-2 px (2 e 3: 1 in alto; 4 e 9: 2 a
destra; 5, 6, 7: 1 a destra e 1 in alto; 8: 1 a destra); spostati, la
parte ferma coincide col primo (differenza media 0-1,4 su 765, prima 20-69).
I PNG sono stati corretti cosi' (tela allargata di 2 px per lato, 236x298:
nessun pixel tagliato). Il palo delle pale resta nelle stesse colonne in
tutti i fotogrammi (entro 1 px).

**Nel gioco.** Gli sprite di nuovi.json ora possono avere piu' fotogrammi
(`fotogrammi`: i PNG, stessa misura; tools/nuovi.py, 05_atlas.py). Lo
sprite `mub` ha l'origine dove barn_b ha la sua (88, 261: la torre di mub1
sovrapposta a quella di barn_b), cosi' enemy_mulino tiene la maschera
barn_mask; le pale girano a 0,3 fotogrammi per passo come il mulino
alleato (enemybuild.js KIND). Il kit di Tiled non e' stato rigenerato
(l'autore ci sta lavorando): alla prossima rigenerazione la tile del
mulino nemico avra' il disegno nuovo.

### 9.49 Il lavoratore nemico dell'autore

L'autore ha disegnato il lavoratore nemico: 144 PNG (nuovi/sprites/
omino_blu/), le stesse 6 animazioni del lavoratore alleato (ow cammina, owo
lavora, os raccoglie, ob costruisce, car porta, oc muore) x 8 direzioni x 3
fotogrammi, coi nomi alleati preceduti da b_ (b_ow11...). Caricati come zip
(nuovi/omino blu.zip), scompattati e tolto lo zip.

**Verifica.** Ci sono tutte e 144, ma in tele tutte uguali (83x107) e con
la figura in punti diversi (non centrata per sagoma ne' per piedi), mentre
gli sprite alleati hanno una tela e un'origine per animazione. Stessa scala
(rettangoli dell'inchiostro uguali entro pochi px). `tools/14_allinea.py`
cerca per ogni immagine lo spostamento che sovrappone meglio la sua sagoma
(alpha > 100) a quella dello sprite alleato (allineate in basso al centro,
poi +-8 px, massimo dell'intersezione sull'unione) e ne ricava l'origine:
il nemico sta dove sta l'alleato, fotogramma per fotogramma.
Sovrapposizione da 0,77 (b_owo63: il colpo di piccone, disegnato un po'
diverso) a 0,95; nessuna sotto 0,7. Le origini sono in nuovi.json
(`omino_blu`, `serie` con `origini`; tools/nuovi.py li legge come uno
sprite per PNG, gruppo d'atlas nemici).

**Nel gioco.** enemy_omino ha le animazioni del civile alleato (che
scelgono ow11...) e disegna il corrispondente b_ (economy.js, draw); la
maschera di collisione resta quella dell'alleato. Tolta la tinta azzurra
provvisoria. Il kit di Tiled non cambia (enemy_omino non e' nel kit).

### 9.50 L'economia nemica, passo 4 (prima parte): difesa e ondate

Richiesta dell'autore (20 ottobre 2026): passo 3 e "quello che rimane".
Del passo 3 restano i segnaposto "cantiere nemico" di Tiled (in sospeso:
toccano il kit, che l'autore sta usando, e la decisione "niente edifici
nuovi" del livello 4, §9.45-§9.46). Qui la parte del passo 4 (regia per
livello) che non dipende dalle mappe: le regole, coi numeri per livello in
`ECO[room]` (economy.js) da tarare quando ci sono le mappe.

**Difesa.** Se un'unita' alleata e' entro `defendR` (600 px) da un edificio
nemico, tutti i soldati della regia in attesa (ruolo 30) accorrono, non solo
quelli che la vedono da soli (400 px, enemies.js): col flow field dei
nemici e il ruolo 31 come le ondate (diritti restavano dietro gli edifici:
lo ha mostrato la prova), arrivati tornano in attesa; andato via l'intruso
restano dove sono. Durante la difesa non partono ondate. I lavoratori
scappano verso il centro come prima (§9.44).

**Ondate.** Un attacco parte quando i soldati in attesa sono almeno
`attackAt + ondate gia' partite x attackGrow` (fino al tetto `army`), non
prima di `firstAttack` passi dalla nascita della regia e a non meno di
`attackEvery` passi dall'ondata prima (`global.en.wave`, `nextAttack`,
`since`: entrano nei salvataggi). Di norma come prima (8, nessuna crescita,
nessuna attesa).

Per le prove `window.__game.eco` e' la tabella ECO (si cambiano i numeri
di una room).

Prova (`game/test/browser/enemydefense.mjs`, nella CI): 6 soldati in
attesa dalla parte opposta della base rispetto a un guerriero alleato a
450 px dal centro accorrono tutti e lo raggiungono (con defendR 0 nessuno
si muove); con attackAt 3, attackGrow 2, firstAttack 600, attackEvery 900:
3 soldati non partono prima di 600 passi, poi si'; la seconda ondata non
parte con 4, parte con 5 dopo ~1000 passi.

### 9.51 I segnalini dei livelli 3 e 4 sulla mappa della campagna

L'autore ha disegnato i segnalini dei livelli 3 (il monastero,
nuovi/sprites/cap3.1.png, 273x163) e 4 (il ponte sul fiume, cap4.png,
267x218). Sulla mappa della campagna sono sprite derivati (nuovi.json
"derivati", gruppo campagna) rimpiccioliti alla scala degli altri
segnalini (la citta' del livello 1 e' larga 171 px): `cap_l3` largo 160
(al posto di `cap_monastero`, ricavato dallo sprite del monastero, §9.13),
`cap_l4` largo 150.

Il livello 4 entra nell'elenco della campagna (menu.js `ROOMS`; si
sblocca vincendo il 3, come gli altri) e sulla mappa: il ponte a ovest
del monastero, dove l'ha indicato l'autore (`L4_MARK`; prima l'avevo messo
sul fiume grande a nord, che e' l'Adriatico), il numero sopra e la freccia
dal monastero (`fr_corta` ruotata, come le altre). Il "3." sale di 15 px
(sopra il campanile del segnalino nuovo). La storia del livello 4 non c'e'
ancora: sotto la mappa compare "Prossimamente" (STORY, menu.js; da
tradurre nelle sei lingue quando l'autore la scrive). Il livello e' quello
del ponte (§9.40), in attesa della mappa dell'autore.

### 9.52 Il livello 4: mappa dell'autore e regia

L'autore ha caricato mappe/lvl04.tmx (e lvl03.tmx con qualche aggiunta:
pali, fiori, una macchia e un sentiero). Importate (scenari/); la prova del
ponte non dipende piu' dalle unita' della mappa (le mette lei sulla riva
sud). Il kit si rigenera di nuovo (11_tiled_kit: un oggetto del progetto
con uno sprite nuovo, il mulino nemico mub, §9.48).

[Avviso] Nel livello 3 un'aquila (aquila_01) e' fuori dalla mappa
(4560, 6224 in una mappa 6000x6000): l'import la segnala, non e' un errore.

**La mappa.** Il giocatore a nord-ovest (centro, 3 case, 4 civili, 3
guerrieri, due campi da seminare, una miniera d'oro); il fiume da ovest a
est col ponte rotto in mezzo; a nord-est, sulla stessa riva del giocatore,
una piccola base nemica (caserma, stalla, 3 cavalieri); a sud del fiume la
base nemica grande (2 caserme, una stalla, 4 case) e un'altra miniera.

**Decisioni dell'autore (20 ottobre 2026).**
- Obiettivi: riparare il ponte resistendo agli attacchi della base nord;
  distruggere la base nord e' facoltativo (ferma le ondate); a ponte
  riparato si svela il vero obiettivo, distruggere il centro nemico oltre
  il fiume (vittoria). Da quel momento attacca anche la base sud.
- La base sud ha un centro e l'economia (§9.44-§9.50): "aggiungo centro e
  lavoratori a sud".
- Ondate della base nord crescenti, ma non troppo (dopo il ponte arrivano
  anche da sud).
- Giorno, risorse medie.

**Il centro nemico** non e' nella mappa: il kit di Tiled dell'autore e'
precedente agli edifici nemici nuovi (§9.43; non glielo si e' mandato,
come chiesto), e nel suo file il numero di tile di enemy_centro e' quello
di un oggetto della citta'. Lo mette la regia all'inizio (`LV4.centro`,
2925, 3700: un posto libero fra le case e la miniera del sud, cercato nel
gioco); i 4 lavoratori di partenza li fa nascere la regia economica
(`ECO.startWorkers`). [Da fare quando l'autore aggiorna il kit] I tileset
cresciuti (nemici ha 5 tile in piu': da 17 a 22) spostano i numeri delle tile dei
tileset che vengono dopo: le mappe salvate col kit vecchio vanno
controllate (i firstgid).

**Regia** (levels.js `enemyManagerLv4`, `LV4`; numeri da tarare giocando):
- partenza: 300 cibo, 300 legno, 150 oro; il dialogo 4_0 (il ponte, il
  legno, le incursioni da nord-est);
- gli edifici nemici a piu' di 1500 px dal centro (la base nord) sono
  `noEco`: la regia economica non li usa (niente produzione pagata,
  riparazioni, ricostruzioni, difesa: economy.js);
- base nord: un'ondata a 2 minuti, poi ogni 2 minuti e mezzo, di 2, 2, 3,
  3, 4, 4, 5 soldati (fanti dalla caserma, cavalieri dalla stalla, a
  turno), verso l'edificio alleato piu' vicino col flow field; arrivati,
  verso l'alleato piu' vicino. Distrutte caserma e stalla: obiettivo
  facoltativo barrato, dialogo 4_2, niente piu' ondate;
- base sud (ECO.lvl04): 4 lavoratori, fino a 6; scorte 200 cibo, 200 legno,
  100 oro; esercito fino a 10; ondate da 4 soldati, +1 a ogni ondata, ogni
  2 minuti e mezzo, solo a ponte riparato (`global.en.hold`);
- ponte riparato (ponte_fatto): fase 1, dialogo 4_1, obiettivo "distruggi
  il centro nemico"; vittoria quando non c'e' piu' un centro nemico
  (codice del livello 5: 1 2 7 9 4, sblocca il 5).
- Obiettivi (endgame.js): "Ripara il ponte (n%)" (barrato a ponte fatto),
  "Facoltativo: distruggi l'accampamento nemico a nord-est", poi
  "Distruggi il centro nemico oltre il fiume". Testi in sei lingue
  (texts.js); anche la storia del livello sulla mappa della campagna,
  scritta per il porting e da rivedere con l'autore.

Prova (`game/test/browser/lvl04.mjs`, nella CI): partenza (risorse, centro,
economia con 4 lavoratori, base nord fuori dall'economia, obiettivi,
dialogo); la prima ondata da nord a 2 minuti; la base sud ferma prima del
ponte; il ponte riparato sblocca fase, dialogo e ondate da sud; distrutta
la base nord, niente piu' ondate; distrutto il centro, vittoria. Provato a
parte che, a ponte riparato, un'ondata della base sud attraversa il ponte
(partita a ~72 s con scorte abbondanti, a nord del fiume ~10 s dopo).

### 9.53 Livelli sbloccati per le prove

Richiesta dell'autore (20 ottobre 2026): per provare i primi quattro
livelli, tutti sbloccati. `progress.js` `UNLOCK_ALL = 4`: lo sblocco letto
dal browser e' almeno 4 (i livelli 1-4 nell'elenco della campagna, senza
codici). [Provvisorio] Da rimettere a 1 prima dell'uscita.

**Correzione per la CI (§9.52).** La CI rigenera kit e scenari e controlla
che gli scenari versionati vengano dalle mappe: falliva per un papavero per
livello (fiori_papaveri, scala 0,9935). Le macchie di fiori del kit sono
disegnate da 11_tiled_kit (decor_image) col Pillow di chi lo genera e
ritagliate sull'inchiostro: col Pillow della CI la tile e' alta 310 px, con
quello del kit dell'autore 308. `12_tiled_import` ora tratta come non
ingrandito un oggetto di una di queste tile (tk.DECOR) che differisce di
1-2 px; solo per loro (nella room match traccia02 ha davvero scala 1,0012).
Verificato rifacendo da zero i passi della CI con Python 3.11 e il Pillow
corrente.

### 9.54 Un solo lampeggio per risorsa

Richiesta dell'autore (20 ottobre 2026): ogni edificio alleato fermo per la
popolazione piena crea un `pop_blink` a ogni tentativo (production.js,
centro: ogni 30 passi); con due o piu' edifici i cerchi rossi si
sovrapponevano sfasati, raddoppiando il lampeggio. Ora `blink()`
(buildings.js) nel Create si distrugge se ce n'e' gia' uno della stessa
risorsa: quello in corso continua col suo ritmo e il successivo parte solo
dopo che si e' spento. Vale per tutti i `*_blink` (anche i clic ripetuti
senza risorse non accumulano piu' cerchi). Test: `game/test/blink.test.mjs`.

### 9.55 I cantieri colpiti fino a 0 crollano

Richiesta dell'autore (20 ottobre 2026): un cantiere alleato attaccato
(arieti e catapulte nemiche colpiscono il piu' vicino `ally_build`, cantieri
compresi) perdeva vita sotto zero e restava li', indistruttibile: i
costruttori dovevano poi risalire da -49 o piu'. Nell'originale nessun
cantiere controlla la vita. Ora a vita 0 o meno il cantiere sparisce, senza
rovina ne' rimborso: `fond` (edifici) e `wallFond` (mura, anche i pulsanti
"+") liberano le celle della griglia, `campoFond` (il campo, celle gia'
libere) toglie i germogli. I civili che lo costruivano si comportano come
a cantiere finito (civilians.js, buildStep): vanno al cantiere piu' vicino
o si fermano. Il ponte del livello 4 (bridge.js) resta com'e'. Test:
`game/test/fond.test.mjs`.

### 9.56 La schermata di vittoria: sfocatura invece dello sbiancamento

Richiesta dell'autore (20 ottobre 2026): lo schermo che sbiancava fino a
0,9 non lo soddisfaceva. Ora la scena, interfaccia compresa, si sfoca a
poco a poco fino alla sfocatura del menu di pausa (PAUSE_SIGMA, a meta'
risoluzione), sotto un velo bianco leggero come i pulsanti di vetro
(0,45 = 0,69 x GLASS_TINT); poi i testi compaiono in dissolvenza, e "click
anywhere to continue" a sua volta quando diventa cliccabile (150 passi,
come prima). Il velo e i testi li disegna `victory_manager` in un evento
`overlay` che app.js chiama dopo la sfocatura (victoryBlur), sopra tutta
l'interfaccia; il pulsante di pausa resta nitido sopra. Curva: uscita
cubica.

Valori in `VICTORY` (endgame.js), da tarare con l'autore: blur 1 (frazione
della sfocatura della pausa), white 0,45, blurIn 60 passi (1 s), textAt 40,
textIn 40. Per le prove, dall'indirizzo: `?victory=1` vince un secondo dopo
il caricamento; `vblur`, `vwhite`, `vin`, `vtext`, `vtextin` cambiano i
valori (p.es. `?room=lvl02&victory=1&vwhite=0.3&vin=120`). Verificato con
fotogrammi in match e lvl02 (velo 0,25 / 0,45 / 0,65) e con ui.mjs.

### 9.57 Livello 4: economia nemica, fattoria di partenza, ondate sulla strada

Segnalazioni e richieste dell'autore (20 ottobre 2026).

**Lavoratori nemici fermi col passo del cammino.** Misurato con una sonda
(6000-9000 passi, stesso seme): erano fermi il 46% dei passi in cammino,
uno fino a 6946 passi di fila (quasi 2 minuti); in 9000 passi il nemico
raccoglieva cibo 0, legno 140, oro 150. Cause:
- attorno alla base sud ci sono solo 4 alberi veri, tutti sul bordo est
  (uno a x 3472, fuori dalla mappa larga 3450), una miniera d'oro sul bordo
  sud, niente pietra (gli altri alberi sono `albero_fake`). La regia
  mandava tutti i taglialegna allo stesso albero e, consegnato il legno,
  ognuno tornava all'albero piu' vicino: uno lavorava, l'altro andava
  avanti e indietro contro di lui. Attorno alla miniera i posti validi sono
  pochi e un lavoratore restava a pochi px dal suo posto, occupato da un
  compagno al lavoro;
- `mpPotentialStep` (verso il posto prenotato, overAllies), `snapToSlot` e
  `World.placeFreeForSlot` passavano sopra gli `ally_unit` anche per le
  unita' nemiche: i lavoratori nemici si bloccavano fra loro (e sarebbero
  passati sopra gli alleati). Ora la famiglia e' quella dell'unita'
  (`sideUnit`, pathing.js).

Rimedi (economy.js): `targetFor` conta CROWD (300) px in piu' per ogni
compagno gia' su un albero o una pietra, e il lavoratore che ha consegnato
sceglie di nuovo cosi' (non l'albero piu' vicino); `watchStuck`: chi cammina
senza avanzare di 24 px per 120 passi (non in coda al suo posto) lascia
lavoro e posto e si ferma, e per 1800 passi non torna alla stessa risorsa
se ce ne sono altre. Dopo: fermi il 2,7% dei passi in cammino, al massimo
119 passi; raccolti cibo 370, legno 280, oro 250 (e 10 soldati invece di 4).

**Fattoria di partenza** (richiesta: "anche lui inizia con un mulino e tre
campi coltivati gia' attivi"). `startFarm` (economy.js), chiamata dalla
regia del livello col centro: un mulino e tre campi finiti nei punti di
`LV4.farm`, nel prato a ovest del centro (il bosco piu' a ovest e' fatto di
`albero_fake`, invisibili ma solidi); se un punto non e' libero o
raggiungibile, il piu' vicino che lo e'. La ripartizione del lavoro nel
livello 4 da' piu' peso al cibo (`ECO.lvl04.mix`: legno 2, oro 2, cibo 3,
pietra 1).

**Ondate dell'accampamento nord sulla strada** (richiesta: "arrivano
seguendo la strada, non passando attraverso il bosco"). Prima il campo di
flusso andava dritto verso la citta' alleata fra gli alberi del bosco
grande. Ora ogni soldato dell'ondata ha le tappe `LV4.road` (la strada che
gira a nord del bosco e scende a ovest), fino a quella piu' vicina al
bersaglio: va col campo verso la tappa (anche da vicino: `enemyMove`, con
`i.road`), a 150 px dalla tappa (non da `dirox`, che i nemici spostano a
caso quando la meta e' occupata) passa alla successiva, dopo l'ultima va al
bersaglio come prima. Chi insegue un alleato (warwork) lascia la strada;
finito l'inseguimento (fermo, anche col ruolo 32 di "arrivato") la riprende
dalla sua tappa: prima puntava dritto alla citta' e si incastrava nel
bosco. I campi delle tappe si tengono fuori dall'istanza (non vanno nei
salvataggi). Verificato disegnando i percorsi di un'ondata da 3
sull'anteprima della mappa, anche con un guerriero alleato sulla strada.

Prove: economy.mjs, lvl04.mjs, mining.mjs, workers.mjs, saves.mjs e
soak.mjs (lvl02, lvl04) senza errori.

### 9.58 Livello 2: via le frecce dei directioner

Richiesta dell'autore: le freccette (`directioner`, sprite `dir_sign`) nella
mappa del livello 2 non servono piu'. Nell'originale, toccando una caserma
nemica, ne orientavano la bandiera e sparivano; nel porting non hanno
comportamento: restavano solo disegnate. Tolte da `mappe/lvl02.tmx` (gli
oggetti 464-467) e `scenari/lvl02.json` rigenerato con tools/12.

### 9.59 Livello 4: alberi veri per la base sud, fattoria spostata, piu' lavoratori

Richiesta dell'autore (20 ottobre 2026): "aggiungiamo alberi veri
(ovviamente fuori dalle strade), verifichiamo anche che il nemico abbia la
possibilita' di realizzare altri lavoratori (senza snowball eccessivo)".

**Alberi.** 18 `albero` nuovi in `mappe/lvl04.tmx` (livello "boschi",
oggetti 418-435), in tre boschetti: la piana d'erba alta a ovest (7, attorno
a 1700,3250), il prato a ovest delle case (6, attorno a 2350,3550), vicino
alla caserma di sinistra (5, attorno a 2050,2930). I posti li ha cercati uno
script (non versionato) sull'anteprima della mappa di tools/12: tronco a
piu' di 40 px dalle strade (`strada_*`, `traccia*`, la parte ben visibile
dell'immagine), chioma sulle strade al piu' per il 3%, niente sovrapposti a
edifici, alberi, miniera e centro nemico, ad almeno 230 px dalla fattoria e
a 120 px dagli altri alberi. Vicino alla base non c'e' altro spazio libero:
il resto e' strade, case e il bosco di `albero_fake` (che la regia non
taglia). La mappa resta con le fine riga CRLF dell'autore.

**Fattoria spostata.** Nel §9.57 i campi a ovest del centro finivano sotto
le chiome degli `albero_fake` (nella vista in gioco erano nascosti dalla
nebbia). Ora, con lo stesso script: mulino a 3275,3850 (a est del centro),
campi a 3200,3550, 2900,3950 e 3200,3950, fuori dalle strade.

**Lavoratori.** Con 6 lavoratori (il tetto di sempre) il nemico arrivava al
tetto in 50 s e poi accumulava cibo e legno senza usarli. Nel livello 4 il
tetto e' 9, uno ogni 1800 passi (30 s, non 17). Misurato su 30000 passi
(8,3 minuti, senza la base nord):

| | lavoratori | raccolti cibo/legno/oro | soldati | fermi in cammino |
|---|---|---|---|---|
| tetto 6 | 6 da 0,8 min | 2170 / 1030 / 490 | 8 | 0,5% |
| tetto 9 | 9 da 3,3 min | 2130 / 2240 / 1070 | 9 | 3,1% |

Niente valanga: i soldati restano sotto il tetto (army 10) e le ondate
crescono di uno alla volta (attackGrow); le scorte in piu' restano in
magazzino. A 5,8 minuti la regia si e' fatta da sola un magazzino vicino ai
boschi nuovi (§9.46).

Prove: lvl04.mjs, economy.mjs, saves.mjs e soak.mjs (lvl04) senza errori;
gli scenari rigenerati da tutte le mappe coincidono con quelli versionati.

### 9.60 Civili che si ingarbugliano tornando al deposito

Segnalazione dell'autore: i lavoratori alleati "si incasinano" quando
tornano al magazzino a scaricare, soprattutto se arrivano da in alto a
sinistra.

**Misura** (prova nuova `game/test/browser/depot.mjs`, sotto): magazzino in
campo aperto nel match, 6 civili che tagliano un boschetto in una sola
direzione, 6000 passi. Inversioni di marcia col carico vicino al magazzino:
da nord-ovest 114, da nord 194, dalle altre direzioni 0; da nord-ovest il
viaggio piu' lento (209 passi col carico per consegna, 163-187 dalle altre).

**Causa.** La meta del viaggio e' il centro dell'edificio e il campo di
flusso porta alle celle libere piu' vicine a lui; nel magazzino il centro
sta vicino al lato alto, quindi da nord e da nord-ovest arrivavano tutti
allo stesso spigolo posteriore, in una fila sola percorsa nei due sensi
(chi arriva carico, chi riparte vuoto). Da vicino la precedenza fra civili
(ominoMove) li faceva aspettare o scansare (separate) a vicenda: avanti e
indietro attorno allo spigolo.

**Correzione** (civilians.js, ominoMove). Entro 150 px da un deposito
(DEP_NEAR, magazzino o granaio della fazione) chi raccoglie (legno, oro,
pietra, cibo; col carico o appena scaricato) passa sopra gli altri civili,
come gia' attorno a miniere e pietre (§9.21): da lontano col campo (che non
ha collisioni), da vicino col passo con le collisioni verso il deposito ma
senza contare i compagni (mpPotentialStep, overAllies). Se il campo lo ha
portato dentro un ostacolo vero (un albero accanto al mulino, nella prova
economy.mjs) ne esce col campo come prima: col passo con le collisioni
girava su se stesso.

Provate e scartate: un posto sul bordo del deposito per ciascuno (come la
consegna su ordine, §8.19: giravano attorno all'edificio, inversioni da 5 a
10 volte di piu' in tutte le direzioni); i 100 px del tratto finale misurati
dal bordo invece che dal centro (peggio anche quello).

Dopo: 0 inversioni da tutte le direzioni, piu' consegne (da nord-ovest 66
invece di 58, 173 passi col carico per consegna invece di 209); col centro
come deposito 76 invece di 73, con l'oro 0 inversioni invece di 39.
`depot.mjs` (nord-ovest, nord, sud-est, 4000 passi; con piu' di 20
inversioni o meno di 30 consegne non va) fallisce col codice di prima
(65 e 120 inversioni) e passa con questo; e' nella CI. Passano anche
mining, workers, idle, deposit, economy, lvl04 e soak.

### 9.61 Fiori e papaveri ondeggiano meno

Richiesta dell'autore: l'ondeggiare di fiori e papaveri, rispetto all'erba,
da' un po' fastidio per l'altezza e le cime colorate. L'oscillazione delle
particelle e' una rotazione attorno al piede dello stelo (wiggle
dell'orientamento, ±4 gradi ogni 16-32 passi, come l'erba): i papaveri,
alti ~79 px contro i ~39 dell'erba, spostavano la cima rossa del doppio, i
gialli (~57 px) di una volta e mezza. Ora (effects.js, `FLOWER_SWAY`) i
papaveri ondeggiano di ±1,5 gradi e i gialli di ±2, un po' meno della
proporzione con l'erba, e piu' lenti: un periodo di 24-48 passi
(`wigglePeriod`, proprieta' nuova dei tipi di particella in particles.js;
senza, 16-32 come prima). L'inclinazione fissa di ciascun fiore (±15 gradi)
e l'erba non cambiano. Provati salvataggi e soak di lvl03 e lvl04 (le
macchie fiorite).

### 9.62 Soldati fermi uno sopra l'altro

Segnalazione e richiesta dell'autore: a volte i soldati finiscono i
movimenti sovrapposti e poi, ripartendo, si incastrano; quando si fermano,
se si puo', quello di rango minore si sposti.

**Misura** (prova nuova `game/test/browser/settle.mjs`): 17 soldati misti nel
match, ordini col clic destro vero. Dopo gli ordini al gruppo intero
restavano 0-2 coppie di soldati fermi sovrapposti; con piu' ordini verso
punti vicini molte di piu': uno per uno nello stesso punto 4, due gruppi
verso lo stesso punto 9, quattro gruppi verso punti vicini 33. Le caselle
della formazione (§8.11) sono diverse solo dentro un gruppo; fra gruppi o
ordini diversi nessuno le confronta.

**Correzione** (units.js, `settleOverlaps`, chiamata da app.js a ogni passo
dopo il mondo). Ogni 10 passi, fra i soldati alleati fermi e liberi
(azione 0, niente combattimento, fuoco, presidio, raccolta dopo la
produzione; non le macchine d'assedio ne' i civili), di due che si toccano
(maschere, `overlap`) si sposta quello con l'ordo (rango per ordine di
creazione) piu' basso, a parita' quello creato prima: al posto libero piu'
vicino su anelli di 16 px fino a 160, a 16 direzioni partendo da quella
opposta all'altro soldato; il posto deve essere libero da tutti i solidi
(unita' comprese) e raggiungibile dritto senza passare per edifici, alberi
o celle chiuse. Ci va come verso una casella della formazione (formX/formY:
sopra gli alleati, §8.11), col suo campo; per 120 passi non si sposta di
nuovo (niente catene di spostamenti).

Dopo: 0 coppie sovrapposte in tutti gli ordini (semi 1, 2, 3 nel match, e
nel livello 2). La prova del movimento (movement.mjs) migliora: rotazioni
sul posto 10 -> 5, inversioni 257 -> 165, sfarfallii 248 -> 166; il suo
overlapEnd (a fine combattimento, coi nemici ancora vivi) conta unita' in
mischia, macchine d'assedio e civili, non soldati fermi. attackorder.mjs da'
lo stesso risultato di prima; passano melee, rally, fireorder, idle,
monastery, lvl04, enemydefense, saves, soak. `settle.mjs` fallisce col
codice di prima (9 e 33 coppie) e passa con questo; e' nella CI.

### 9.63 Gli arcieri escono da torre e fortezza

Richiesta dell'autore: poter far uscire gli arcieri di presidio, con delle
icone nella torre simili a quelle della caserma che, premute, li fanno
uscire; nella fortezza nella seconda riga.

Nell'originale un arciere entrato (azione 15, presidio) veniva distrutto e
l'edificio contava `npresidio`: non usciva piu'. Ora (ranged.js,
`garrisoned`):
- con l'edificio selezionato, un pulsante per arciere di presidio: l'icona
  dell'arciere (0,6) nel cerchio bianco da 30 px, come i pulsanti di
  produzione, a x 450, 520, 590, 660; nella torre in prima riga (y 50),
  nella fortezza in seconda (y 120), sotto ariete, catapulta e annulla.
  Nella fortezza barra di produzione e coda passano alla terza riga
  (production.js, `queueY` 190; le altre caserme restano a 120);
- col puntatore sopra: cerchio piu' pieno (0,99), global.sele=1 (come
  buttonSele), e la scheda in basso "Archer / Click to send this archer
  out of the tower." (o "of the fortress."), tradotta nelle sei lingue
  (texts.js); il clic non deseleziona l'edificio;
- il clic fa uscire un arciere: npresidio -1, l'arciere nasce accanto
  all'edificio (il suo Create cerca un posto libero, findFreeSpawn), con la
  vita che aveva entrando (`garrisonLives`, l'ultimo entrato esce per
  primo), la popolazione torna su di 2; le frecce dell'edificio seguono
  npresidio; le bandiere degli arcieri che non ci sono piu' spariscono
  (flagged/flagged1..4 tornano 0, cosi' rientrando ricompaiono).

Prova nuova `game/test/browser/garrison.mjs` (nella CI): torre con 2
arcieri e fortezza con 4 (con un ariete in produzione), entrati col clic
destro vero, usciti coi pulsanti: conti, vite, popolazione, bandiere,
selezione e produzione. Passano anche ui.mjs (sei lingue), saves e soak.

**Trovato provando.** Sotto i 500 px l'ordine di presidio portava
l'arciere dritto verso l'edificio (mpPotentialStep, ranged.js `move`),
senza il ripiego sul campo di flusso degli ordini di spostamento (§6.2 D,
seesGoal): con un edificio in mezzo (una torre dietro una caserma)
l'arciere restava fermo a camminare sul posto. C'era gia' prima; corretto
nel §9.64.

### 9.64 Ordini verso un edificio con un ostacolo in mezzo; riparare senza materiale

Richieste dell'autore: correggere il presidio bloccato (§9.63, "trovato
provando"), "credo ci sia un problema del genere anche per i lavoratori
mandati a costruire"; e "se i lavoratori non hanno le risorse per riparare
si fermano e si mettono in idle, mentre ora continuano a martellare anche
se la vita dell'edificio non sale".

**Misura** (prova nuova `game/test/browser/blocked.mjs`, deterministica, nel
match in campo aperto: una caserma fra le unita' e la meta, a ~360 px,
clic destro vero), col codice di prima:
- presidio (2 arcieri, una torre dietro la caserma): non entrano mai;
- costruzione (2 civili, il cantiere di una casa dietro la caserma): uno
  resta dietro la caserma, il cantiere finisce in 954 passi;
- riparazione (2 civili, un magazzino a 40/140 dietro la caserma): uno
  resta dietro la caserma a camminare sul posto, 1500-1585 passi;
- senza legno (un civile, un magazzino danneggiato accanto, legno 0):
  martella per 883 passi su 900, la vita resta 60.

**Cause.** Da vicino (arcieri sotto i 500 px dalla meta, civili sotto i 300)
gli ordini verso un edificio andavano dritti (mpPotentialStep) senza
guardare se in mezzo c'era un ostacolo. E al cantiere e alla riparazione
due civili puntavano allo stesso punto (il centro dell'edificio): il
secondo, arrivato da sotto, restava a 45 px a fare avanti e indietro
(si comincia a riparare a 5 px).

**Correzioni.**
- `seesTarget` (pathing.js): la linea dall'unita' al punto piu' vicino del
  riquadro dell'edificio (40 px prima: le celle dell'edificio sono
  ostacolo) e' libera da ostacoli fissi; a meno di 80 px vale sempre. Senza
  vista l'unita' va col campo di flusso, che aggira: l'arciere col presidio
  (ranged.js `move`), il civile verso il cantiere o l'edificio da riparare
  (civilians.js `ominoMove`; non i complessi, §9.29, che hanno gia' il loro).
- Al cantiere e all'edificio da riparare il civile va a un posto libero sul
  bordo (`toEdgeSpot`: meleeSpot a contatto, a 4 px, settori di 30 gradi),
  diverso da quello dei compagni, invece che al centro; il ponte del
  livello 4 (buildReach) come prima. La riparazione comincia a 10 px dal
  bordo, come il cantiere (era 5: l'ultimo passo verso il posto, chiuso
  dall'edificio, poteva lasciare il civile a 6 px).
- Riparazione senza materiale (civilians.js, azione 7): se l'edificio e' di
  pietra e la pietra e' 0, o di legno e il legno e' 0, il civile si ferma
  inattivo (azione 0, repairwork 0) al primo colpo e la risorsa che manca
  lampeggia (per il giocatore). Vale anche per i lavoratori nemici (la
  regia, §9.45, gia' non li mandava senza materiale).

Dopo (semi 1-5): presidio in 164 passi, cantiere in 639 con tutti e due,
riparazione in 898-937 con tutti e due, senza legno fermo dopo 13 passi.
`blocked.mjs` (limiti: 600, 800, 1200 passi) fallisce col codice di prima
e passa con questo; e' nella CI. Passano anche depot, workers, mining,
idle, economy, lvl04, bridge, monastery, enemybuildings, enemydepots,
enemyarmy (riparazione e ricostruzione nemiche), garrison, settle,
deposit, saves, soak, ui.

### 9.65 Lampeggio veloce quando si smette di riparare

Richiesta dell'autore sul §9.64: il lampeggio della risorsa che manca, per
la riparazione, o niente o "uno veloce quando si ferma". Ora il civile che
smette di riparare senza materiale crea il lampeggio con `quick`
(buildings.js, `blink`, opts.init): sfuma in 12 passi (0,2 s) invece di 25.
Resta uno solo per risorsa (§9.54): con tre civili che si fermano insieme,
un solo lampeggio breve. Gli altri lampeggi (costi, popolazione, ponte)
come prima. Test: `game/test/blink.test.mjs`; nel browser, tre civili su
un magazzino danneggiato col legno a 0: un lampeggio, acceso 12 passi.

**Notato provando** (corretto nel §9.66). La "fine riparazione" dell'originale
(buildings.js `repairEnd`, a ogni passo di ogni edificio finito) ferma i
civili che riparano un punto entro 150 px da un edificio a vita piena:
anche se l'edificio che riparano e' un altro, danneggiato, accanto. Con un
magazzino danneggiato vicino alle case della base del match i civili si
fermavano subito.

### 9.66 La fine della riparazione guarda solo l'edificio riparato

Decisione dell'autore sul §9.65 ("all'epoca non avevo trovato
un'alternativa valida"). La "fine riparazione" dell'originale (Step di ogni
edificio, buildings.js `repairEnd`) fermava i civili al lavoro (azione 7)
il cui punto cliccato fosse entro 150 px da un edificio integro qualunque.
Riparando un edificio danneggiato con accanto una casa integra (o un tratto
di mura con accanto tratti integri) i civili si fermavano al primo passo.

Ora a edificio integro si fermano solo i civili che riparano lui: il
complesso (repT, §9.29) o l'edificio piu' vicino al punto cliccato (repx,
repy), cioe' quello a cui il colpo aggiunge vita (civilians.js, azione 7).
Edifici danneggiati: nessun controllo (come prima, di fatto). La casa
integra col clic destro (che manda comunque a riparare) si ferma al primo
passo, come prima.

Prova: caso nuovo `accanto` in `game/test/browser/blocked.mjs` (un
magazzino a 60/140 con una casa integra a meno di 150 px dal punto
cliccato, 2 civili): col codice di prima la vita resta 60, con questo torna
a 140 in 551 passi. Passano monastery (riparazione del complesso),
enemyarmy, bridge, economy, idle, workers, saves, soak.

### 9.67 Cantieri vicini fra loro: verifica, e la semina del campo ordinato

Richiesta dell'autore: verificare che non ci siano casi come quello del
§9.66 (un edificio vicino che decide per quello su cui si lavora) per gli
edifici in costruzione.

**Il codice.** Inizio del lavoro, colpo e fine del cantiere (civilians.js,
buildStep e otherWorkTick) usano il cantiere piu' vicino al punto
dell'ordine (buildx, buildy), cioe' quello ordinato: un cantiere accanto
non li confonde. Al cantiere finito il civile passa al cantiere piu' vicino
a lui (come prima). La fine della riparazione non tocca chi costruisce
(solo l'azione 7). Due punti invece guardavano altro:
- l'arrivo alla semina (fieldwork) prendeva il cantiere di campo piu'
  vicino al CIVILE, non quello ordinato: con due campi in costruzione, chi
  andava al secondo passando sul centro del primo si fermava a seminare il
  primo. Ora il piu' vicino a buildx, quello verso cui cammina (ominoMove);
- un cantiere finito accanto a un edificio in riparazione: il nuovo
  edificio, nato a vita piena, con la regola di prima del §9.66 fermava chi
  riparava un punto entro 150 px. Gia' corretto dal §9.66.

**Prova** nuova `game/test/browser/sites.mjs` (nella CI), clic destro vero:
- dueCase: due cantieri di casa a 150 px, 2 civili sul primo: lo finiscono
  (462 passi) senza mai colpire da oltre 40 px, poi passano da soli al
  secondo (912). Andava anche prima;
- riparaVicino: 2 civili riparano un magazzino, accanto (la casa nascera'
  entro 150 px dal punto cliccato) altri 2 finiscono un cantiere: senza il
  §9.66 i riparatori si fermavano a vita 88 su 140; ora continuano;
- dueCampi: due cantieri di campo affiancati, 2 civili mandati al secondo
  passando sul primo: prima seminavano il primo (finito) e il secondo
  restava a 1; ora seminano il secondo (423 passi) e il primo resta com'e'.

Passano anche workers, economy, enemydepots, enemyarmy, lvl04, bridge,
blocked, idle, depot, saves, soak.

### 9.68 Risorse: solo quelle scoperte, e quella scelta dal giocatore

Richieste dell'autore: quando una risorsa si esaurisce i civili vanno alla
piu' vicina solo se il giocatore l'ha scoperta ("partono da soli verso
l'ignoto e semplifica troppo la vita"); e mandati col clic su una risorsa
vanno su quella, non sulla piu' vicina.

**Prima.** Scoperta = `visible` della risorsa (reveal: un alleato a 600 px
per gli alberi, 400 per miniere e pietre; poi resta). Andavano alla
risorsa piu' vicina senza guardarla: albero, miniera o pietra finiti mentre
ci si lavora (azioni 2, 3, 5), miniera o pietra finite mentre ci si va,
ritorno dal deposito col legno e con la pietra (con l'oro il controllo
c'era, sulla piu' vicina al civile). E la risorsa scelta non restava:
l'ordine ricordava il punto cliccato (woodx...), a 250 px dalla meta il
civile passava all'albero piu' vicino a se' (§8.19), e dal deposito tornava
all'albero (o alla pietra, alla miniera) piu' vicino al deposito.

**Ora** (civilians.js):
- `nearestKnown`: la risorsa piu' vicina fra quelle scoperte (per il
  nemico tutte: non ha la nebbia, e la sua regia sceglie da se', §9.57);
  `resAt`: la risorsa con l'origine nel punto se c'e' ancora, se no la
  scoperta piu' vicina a quel punto. Nessuna: il civile si ferma inattivo;
- clic destro (rightClick) e bandiera di raccolta (rallyOmino) su una
  risorsa: woodx/goldx/stonex sulla sua origine;
- verso l'albero: il proprio (prima il piu' vicino al civile); se da li'
  non ci si arriva (chiuso nel bosco), lo scoperto piu' vicino al civile a
  cui si arriva, come prima; arrivato al punto ma non all'albero, verso il
  proprio;
- finita la risorsa (lavorandoci o andandoci): la scoperta piu' vicina a
  lei, non al civile;
- dal deposito: alla propria risorsa (resAt), non alla piu' vicina al
  deposito.

**Prova** nuova `game/test/browser/resources.mjs` (nella CI), clic destro
vero, le altre risorse della mappa tolte dove serve (quelle accanto agli
edifici del giocatore sono scoperte, e giustamente ci si andrebbe):
- scelto: 6 alberi in gruppo, clic sul piu' lontano dal civile: prima
  tagliava il #1 e dal deposito tornava al #0; ora il #5, e ci torna;
- oroIgnoto: la miniera finisce, l'altra e' mai vista: prima ci andava, ora
  il civile si ferma; oroScoperto: l'altra e' vista: ci va;
- alberoIgnoto: l'albero finisce, gli altri mai visti: prima ci andava, ora
  si ferma.

**mining.mjs** raccoglie meno (2460 invece di 2741, 492 al minuto invece
di 548): la miniera si esaurisce verso la fine, e prima 17 civili su 20
partivano verso altre miniere mai viste, a 770-2140 px (le 240 unita' in
piu' venivano da li'); ora si fermano accanto a quella finita. E' la
richiesta. Passano workers, depot, idle, economy, enemydepots, enemyarmy,
lvl04, blocked, sites, deposit, saves, soak.

### 9.69 Il "timer fermati" non ferma chi cammina ancora

Segnalazione dell'autore: molte unita', nelle lunghe distanze, si fermano
a meta' strada circa; forse un timer che dopo n passi interrompe il
movimento per evitare unita' bloccate.

Era cosi': l'Alarm_8 dell'originale ("timer fermati"), armato a ogni ordine
di spostamento, allo scadere ferma l'unita' dov'e' (dirox, diroy = x, y).
Durate [C]: 1200 passi (20 s) per i clic destri di cavaliere, picchiere,
arciere e civile; 3000 per il guerriero e per l'andata alla bandiera di
raccolta. A 3-5 px a passo sono 3600-6000 px in linea retta, meno lungo i
percorsi; le mappe arrivano a 7000x7000 e 3200x8000.

**Misura** (prova nuova `game/test/browser/longmove.mjs`, nel match, da un
punto libero a nord-ovest a uno lontano 6336 px di percorso, un'unita' per
tipo col clic destro vero): picchiere, cavaliere, arciere e civile si
fermavano al passo 1199, a 150-2500 px dalla meta; il guerriero (3000)
arrivava.

**Ora** (pathing.js): `armStopTimer` arma il timer come prima e ricorda la
distanza dalla meta; allo scadere (`stopTimer`, l'Alarm_8 di tutte le unita'
alleate e dei civili) se l'unita' e' in cammino e si e' avvicinata di
almeno 150 px dall'ultimo controllo, il timer riparte per 600 passi (10 s);
se no si ferma come prima. Chi raccoglie, costruisce o ripara lo annulla
gia' (civilians.js, come prima).

Dopo: arrivano tutti (cavaliere in 1215 passi, guerriero, picchiere e
arciere ~1518, civile 2029); un guerriero incastrato (rimesso al suo posto a
ogni passo) si ferma ancora al passo 2999. movement.mjs e attackorder.mjs
danno gli stessi numeri di prima; passano settle, rally, melee, idle,
workers, garrison, blocked, sites, resources, depot, fireorder,
enemydefense, lvl04, saves (5 room), soak. `longmove.mjs` e' nella CI.

### 9.70 Il cadavere del lavoratore nemico

Segnalazione dell'autore: i lavoratori nemici, quando muoiono, hanno ancora
gli sprite degli omini arancioni.

Era cosi': enemy_omino muore come il civile alleato (civilians.js, azione 2)
e crea `omino_corpse`, che disegna gli sprite alleati (oc11...); il
corrispondente b_ si sceglieva solo nel Draw del lavoratore vivo
(economy.js, §9.49), non nel cadavere.

**Ora:** il cadavere del lavoratore nemico ha `skin = "b_"`, e il Step dei
cadaveri (units.js, `corpse`) dopo l'animazione mette il prefisso allo
sprite scelto, se c'e' (b_oc11..., disegnati dall'autore, §9.49). Il
cadavere del civile alleato non cambia.

Prova: `economy.mjs` (nella CI) guarda i fotogrammi dei cadaveri dopo la
morte del lavoratore: il nemico b_oc81-83, un civile alleato ucciso nella
stessa partita oc41-43. Prima della correzione il nemico dava oc81-83.

### 9.71 Soldati che si ammassano; chi non puo' arrivare si ferma

Segnalazione e richiesta dell'autore: i soldati tendono ancora a
sovrapporsi e incasinarsi, forse dopo aver attaccato o dato fuoco, quando
sono sovrapposti e devono fare altro che andare a un punto indicato dal
giocatore; evitare il piu' possibile le sovrapposizioni; chi non puo'
raggiungere un punto si fermi invece di impazzire, e riprovi ogni tanto.

**Misura** (prova nuova `game/test/browser/crowd.mjs`, sei casi nella zona
aperta del match, ordini col clic destro vero; i numeri dei semi 3 / 7 / 11).
Prima:
- *mischia*: chi arriva sovrapposto a un alleato (col flow field si passa
  uno sull'altro, e sovrapposti si va col flow field) comincia a colpire
  li': 18 alleati contro 8 nemici, 91 / 43 / 36 coppie sovrapposte per
  almeno 3 s, quasi tutte mentre colpiscono;
- *dopo il fuoco*: i fanti restavano con `warwork` 4 (l'ordine di
  movimento del clic destro, che il GlobalRightReleased da' dopo
  fireOrder): settleOverlaps (§9.62) li saltava e restavano uno sull'altro
  (4 / 3 / 2 coppie alla fine), e con warwork 4 non reagivano a un nemico a
  contatto;
- *bersaglio irraggiungibile* (un nemico chiuso in un anello di alberi): il
  flow field porta tutti alla cella raggiungibile piu' vicina, li'
  ammassati si separano a vicenda senza collisioni e tremano sul posto per
  sempre (2734 / 1111 / 1716 inversioni di marcia);
- *punto irraggiungibile* (clic dentro l'anello): le caselle della
  formazione sono fuori dall'anello, ma tutti seguono il campo del capo, che
  porta a una sola cella accanto all'anello: ammassati li', 9 su 18 ancora
  in cammino dopo 25 s, ~10.000 inversioni;
- *nemici*: senza un posto libero attorno al bersaglio spingono verso il
  suo centro; dietro gli altri `mp_potential_step` li fa girare in tondo
  (73 / 63 / 39 finestre di 2 s di tremolio).

**Ora.**
- *Raggiungibile* (pathing.js `regions`, `reachable`): le zone collegate
  della griglia dei soli ostacoli fissi (per i nemici anche le porte),
  calcolate una volta per versione degli ostacoli; due punti si raggiungono
  se stanno nella stessa zona. Costa una ricerca sulla griglia quando un
  edificio nasce o crolla, poi niente.
- *Fermo e riprova* (`waitHere`, `waiting`, WAIT_RETRY = 60 passi):
  alleati (units.js, autoAttack) e nemici in mischia (enemies.js,
  enemyAttack) non inseguono un nemico che non si raggiunge: un altro
  raggiungibile entro il raggio diventa il bersaglio, se no restano fermi e
  riguardano dopo 1 s. Lo stesso per il bersaglio scelto col clic destro
  (ci si rinuncia, come con targetStuck §9.38). Senza un posto libero
  attorno al bersaglio (meleeSpot) entro 150 px da lui non si spinge piu'
  verso il suo centro: fermi, e dopo 30 passi cosi' la pausa (da piu'
  lontano ci si avvicina come prima: fermi li', di notte il cavaliere di
  attackorder.mjs aspettava 28 passi). I nemici, se in mezzo secondo non
  si avvicinano al bersaglio (`chaseStuck`), si fermano e riprovano, con
  pause doppie se si bloccano di nuovo, fino a 4 s (agli alleati bastano il
  cambio di settore e targetStuck: con la stessa regola combattevano
  peggio).
- *Ordini di movimento* (`moveStalled`, alleati, arcieri compresi): chi in
  45 passi non si sposta di 20 px ne' si avvicina alla meta, se la meta non
  si raggiunge si ferma li' (l'ordine e' finito); se si raggiunge si ferma
  1 s e riparte col proprio campo verso la propria casella (pause doppie se
  si blocca di nuovo). Prima restava solo il "timer fermati" (§9.69, 20 s).
- *Mischia sovrapposti* (units.js): vicino al bersaglio e sovrapposto solo
  ad alleati, chi insegue non va col flow field ma verso un posto suo
  attorno al bersaglio (meleeSpot con `noStay`, come gli arieti §9.32),
  sopra gli alleati ma non attraverso nemici, edifici o alberi (`stepOver`:
  dritto o girando di 30 gradi fino a 90, sempre dalla stessa parte); a
  contatto con il nemico ma sovrapposto a un alleato che sta gia'
  colpendo, non comincia a colpire (ne' continua, fra un colpo e l'altro,
  se ha l'ordo piu' basso) e va al suo posto (`unstack`); dopo mezzo secondo
  senza riuscirci colpisce comunque (con 1,5 s i 18 alleati contro 8 nemici
  ci mettevano fino a 4 s di piu').
- *Fine del fuoco* (siege.js infantryFire, e la rinuncia di §9.31):
  `warwork` torna 0.

Provato e tolto: chi tira frecce incendiarie sovrapposto a un compagno che
tira va a un altro posto attorno all'edificio (12 fanti contro una casa):
passi sovrapposti 967 -> 762, ma inversioni di marcia raddoppiate.

**Dopo** (crowd.mjs, semi 3 / 7 / 11, prima -> ora):

| caso | misura | prima | ora |
|---|---|---|---|
| attacco | coppie sovrapposte >= 3 s | 91 / 43 / 36 | 4 / 1 / 5 |
| attacco | passo in cui muore l'ultimo nemico | 432 / 492 / 463 | 535 / 534 / 523 |
| fuoco | coppie sovrapposte alla fine | 4 / 3 / 2 | 0 / 0 / 0 |
| circondato | finestre di tremolio / inversioni | 34 / 4 / 30, 2734 / 1111 / 1716 | 0 / 0 / 0, 3 / 0 / 0 |
| nemici | finestre di tremolio | 73 / 63 / 39 | 10 / 17 / 14 |
| mischia | coppie sovrapposte >= 3 s | 28 / 11 / 29 | 5 / 8 / 6 |
| mischia | alleati vivi alla fine | 7 / 1 / 0 | 13 / 4 / 7 |
| punto | in cammino dopo 25 s / inversioni | 9 / 9 / 9, ~10.000 | 0 / 0 / 0, ~133 |

L'attacco 18 contro 8 finisce 1-2 s dopo: a contatto colpisce chi ha un
posto suo, non due nello stesso punto. Restano i soldati in viaggio sul
flow field, che possono passare uno sull'altro come prima (§8.11), e chi
tira frecce incendiarie in 12 attorno a una casa (fuoco: 2-4 coppie
sovrapposte mentre tirano).

`crowd.mjs` e' nella CI (seme 3; fallisce col codice di prima in tutti i
casi).

**Il bersaglio irraggiungibile scelto col clic destro** (richiesta
dell'autore, dopo la prima versione): non ci si ferma subito dove si e', si
va fin dove si puo'. Il bersaglio diventa un ordine di movimento (warwork
0) verso la cella raggiungibile piu' vicina a lui (pathing.js `goNear`,
`nearestReachableCell`, anelli fino a 40 celle), una per soldato: le celle
prese nello stesso passo, con le loro vicine, non le prende un altro. Li'
ci si ferma; un nemico raggiungibile intanto lo si attacca. Caso nuovo di
crowd.mjs, `riva` (14 guerrieri, picchieri e cavalieri, il nemico chiuso
dagli alberi e invulnerabile; seme 3): col codice originale arrivavano a
159 px da lui ma 14 restavano in cammino, 78 coppie sovrapposte, 15.792
inversioni; con la prima versione fermi alla partenza, a 905 px; ora il
piu' lontano a 208 px (l'anello ha raggi 110 x 80), fermi, nessuna coppia
sovrapposta, nessun tremolio. Chi insegue da solo (senza il clic destro)
un nemico irraggiungibile resta invece fermo dov'e': se no ogni nemico
oltre un fiume (entro 700 px) trascinerebbe i soldati fino alla riva.

### 9.72 Il nome ufficiale "Dust Veil: Collapse" e il suo logo

Decisione dell'autore (23 ottobre 2026): il gioco si chiama ufficialmente
**Dust Veil: Collapse**. Richiesta: un logo su almeno due righe, col font
attuale, nella schermata principale, con la sfumatura in basso.

**Il logo** (`tools/13_logo.py` -> `nuovi/sprites/logo_dustveil.png`, lo
stesso sprite del §9.47). Due righe: "Dust Veil" in Cinzel Decorative Bold e
"COLLAPSE" in Cinzel Bold spaziato (18 px fra le lettere), fra due filetti
con una losanga in punta; il grigio del logo535 (51, 51, 51).
- *La sfumatura in basso*: una sola su tutto il blocco, dalla cima delle
  maiuscole di "Dust Veil" alla linea di base di "COLLAPSE", con la forma
  di quella del logo535 (§9.47), ma che finisce al 30% invece che a 0. Con
  la sfumatura intera, e anche con quella del logo535 riga per riga,
  "COLLAPSE" quasi spariva (provate tutte e due sullo sfondo del menu).
- *Un alone chiaro* (235, 235, 230) sfocato dietro le lettere, al piu' al
  60%: il grigio scuro si confondeva con la nebbia del menu. L'alone non e'
  sfumato.
- Disegnato a 1,4 volte (1173 x 382 px): il menu lo rimpicciolisce e sugli
  schermi grandi non si sgrana.
- Scartata (ma ancora nello script, `--tre-righe`): "Dust" / "Veil" /
  "COLLAPSE" su tre righe. E' alto 565 px: a 720 px di altezza dello
  schermo andrebbe al 35% e "COLLAPSE" diventerebbe piccolissimo.

**Nel menu** (menu.js, drawTitle): al centro dello spazio sopra i
pulsanti come prima, rimpicciolito se serve per stare in quello spazio con
40 px sopra e sotto, e al piu' largo meta' dello schermo. A 1920 x 1080
viene all'82% (largo 960 px), a 1366 x 768 al 58% (683 px), a 1280 x 720 al
52% (614 px), a 2560 x 1440 al 100% (1173 px).

**Il nome** nel titolo della pagina (index.html), nella PWA (manifest:
nome "Dust Veil: Collapse", nome breve "Dust Veil") e nel README. Restano
"535" i nomi interni che non si vedono e che cambiandoli farebbero perdere
partite salvate e progressi (le chiavi `535.*` del localStorage, il
controllo dei salvataggi), la cache del service worker e lo zip dei
portali (`build/535-collapse-web.zip`). Restano anche le icone (tools/09,
fatte dal logo535: mostrano "535").

### 9.73 La versione sale a ogni nuova PR

Richiesta dell'autore (23 ottobre 2026): a ogni nuova PR la versione in
basso a sinistra della schermata principale sale di 0.0001: `0.AANN`, con
`AA` l'anno e `NN` un progressivo (ora 0.2601 -> **0.2602**). Il numero e'
la costante `VERSION` di menu.js (prima scritto direttamente nel Draw); la
regola e' in `CLAUDE.md`, che le sessioni di Claude leggono da sole.

### 9.74 Livello 5: la mappa dell'autore

L'autore ha caricato `mappe/lvl05.tmx` (con `mappe/immagine.png`, lo
screenshot della mappa in Tiled per il controllo). Come per il livello 4
(§9.40) prima la mappa giocabile, poi regia e campagna, che l'autore
spieghera'.

**Import** (12_tiled_import, scenari/lvl05.json): 9000 x 4000 px, 633
istanze, nessun avviso; l'anteprima (`--anteprima`) corrisponde allo
screenshot. La mappa usa insieme i tileset del kit vecchio (cartella
261013) e di quello nuovo: va bene, perche' le tile aggiunte dopo stanno in
fondo ai loro tileset (tiledkit `APPENDED`, §9.40) e i numeri delle tile
del kit vecchio valgono anche nel nuovo (nemici: 17 tile nel vecchio, 22
nel nuovo).

**Cosa c'e'.** Il giocatore a ovest (centro, caserma, torre, magazzino, 6
case, 4 campi da seminare, 5 civili, 32 soldati); a est la citta' nemica con
l'economia (centro, chiesa, 2 castelli, 2 magazzini, mulino, 6 case, 2
caserme, 2 stalle), chiusa da mura con 2 porte e 11 torri; in mezzo
montagne, rovine (pietra), colonne e una statua; un fiume a nord-ovest
(fiume_22) e il fiume grande (§9.40) che entra dal bordo in alto a
nord-est; 8 campi da costruire attorno a una torre nell'angolo nord-est.
Gia' accanto all'esercito del giocatore, 15 soldati nemici (6 picchieri, 4
arcieri, 3 guerrieri, 2 cavalieri): si combatte da subito. Senza regia, per
ora: la citta' nemica ha la regia economica di norma (§9.44, ECO.default).

**Il ponte del fiume grande** (bridge.js): il fiume grande crea il suo
ponte da riparare nel punto in cui lo ha dipinto; qui cadrebbe fuori dalla
room (y = -380): un cantiere irraggiungibile, con la barra della vita
sempre visibile. Ora il ponte nasce solo se cade nella room.

**Registrazione**: room `lvl05` (app.js, gruppi d'atlas core e gioco: la
mappa non usa la citta' romana), elenco della campagna (menu.js, "5. The
siege", nome dell'originale), salvataggi (save.js), sblocco per le prove
fino al 5 (progress.js `UNLOCK_ALL`, §9.53: provvisorio). Soak e salvataggi
della CI anche su lvl05 (3000 passi senza errori, ripristino identico).

**Da decidere con l'autore** (risposte dell'autore, 23 ottobre 2026).
- Le mura e le porte attorno alla citta' nemica sono mura_ori, mura_vert e
  porta_vert: le mura del giocatore. -> Sono del nemico: §9.75.
- I 15 nemici in mezzo all'esercito del giocatore: battaglia d'apertura o
  dovevano essere alleati? -> Battaglia d'apertura, voluta.
- Gli 8 campi da costruire nell'angolo nord-est sono del giocatore. -> Sono
  del nemico: §9.75.
- Il segnalino del livello sulla mappa della campagna: un piccolo castello
  blu, che l'autore carichera'.
- Prestazioni (per ora si tiene cosi'): ~2,5 ms a passo (misurato a blocchi di 1000 passi,
  headless) contro ~1 del livello 4. Un quarto sono le particelle (942 sistemi, 42 600 particelle:
  la schiuma delle rive dei tre fiumi e l'erba, contro ~10 000 del livello
  4); per ora nessuna correzione.

### 9.75 Mura e porte nemiche; il livello 5 le usa

Richiesta dell'autore (23 ottobre 2026, dopo §9.74): le mura, le porte e i
campi della citta' nemica del livello 5 sono del nemico; gli oggetti e gli
sprite nemici non c'erano. "Per gli sprite riusciamo a fare una versione
nemica tintando di blu le bandierine?"

**Sprite** (05_atlas, `derived_sprites`, `tint_flags`): m_ori, m_vert e le
porte aperte e chiuse (m_ori_p, m_ori_pa, m_vert_p, m_vert_pa) con suffisso
`_b`. La bandiera nemica del progetto (bflag) e' quella del giocatore
(rflag) con la tinta ruotata: media 15 -> 206 gradi, saturazione e
luminosita' uguali (misurate: 0,74 e 0,55 in tutte e due). Qui i pixel
rosso-arancio (tinta fino a 40 gradi o da 345, saturazione almeno 0,3: la
pietra e' poco satura) ruotati di 191 gradi; ~600 pixel per sprite, solo le
bandierine (controllato ingrandito).

**Oggetti** (nuovi.json, walls.js `enemyWall`, `enemyGate`):
`enemy_mura_ori`, `enemy_mura_vert`, `enemy_porta_ori`, `enemy_porta_vert`,
con le maschere, le vite (800; porte 600 e 800) e le aperture delle mura del
giocatore. Edifici nemici di pietra (enemy_build): nascosti finche' un
alleato non li vede, poi visibili (come gli altri, enemybuild.js
`revealBuilding`), barra e scheda (ico_mura, ico_gate), li colpiscono solo
arieti e catapulte (l'ariete li prende anche da solo, come gli altri
edifici nemici), a vita 0 spariscono senza rovina come le mura del
giocatore; la regia economica non li ricostruisce, i lavoratori nemici li
riparano (pietra).
- *La porta* si apre quando il nemico piu' vicino e' a meno di 20 px
  (guardato ogni 10 passi), mai per il giocatore.
- *Percorsi* (pathing.js): il contrario delle porte del giocatore (§3.8).
  La porta chiusa e' ostacolo per tutti (cost e solid), ma il varco (le sue
  celle meno quelle dei pilastri) e' percorribile per i nemici: griglia
  `enemyPass` (passEnemy, unpassEnemy), letta da goalField e da regions
  (§9.71) dei nemici; entra nei salvataggi (quelli di prima non l'hanno:
  vuota). `free()` non riapre piu' una cella di un ostacolo fisso: un nemico
  fermo nel varco della sua porta, ripartendo, l'avrebbe aperta al
  giocatore.
- *Kit di Tiled*: le quattro e il campo coltivato nemico (enemy_campo, gia'
  della regia economica, §9.44) in fondo al tileset "nemici" (27 tile; le
  mappe fatte prima restano uguali, gli scenari identici).

**Livello 5** (levels.js `lvl05Setup`, all'avvio di una partita nuova): nella
meta' est della mappa (x >= 4500) i tratti e le porte del giocatore
diventano nemici, i campi da costruire (campo_fond) campi coltivati nemici
(gli 8 attorno al mulino nemico nell'angolo nord-est); i 4 campi del
giocatore restano. La citta' nemica, chiusa da mura e montagne, si
raggiunge solo abbattendo una porta o un tratto.

Prova (`game/test/browser/enemywalls.mjs`, nella CI, alla porta ovest della
citta', tolti i nemici): conversione (nella meta' est nessun muro, porta o
campo del giocatore; 4 + 7 tratti, 2 porte, 8 campi nemici; 4 campi del
giocatore), mura nascoste all'inizio, percorso chiuso per il giocatore e
aperto per i nemici, la porta si apre con un nemico a contatto e non con un
alleato, sei guerrieri mandati col clic destro dentro la citta' si fermano
fuori (nessuno passa), un ariete abbatte la porta (1131 passi) e poi i
guerrieri entrano. Provato a parte che un guerriero e un cavaliere nemici
mandati col flow field da dentro a fuori passano dalla porta, che si apre.

### 9.76 Livello 5: regia e ambientazione

Regia e ambientazione dell'autore (23 ottobre 2026): lo scenario si apre con
una battaglia vicino alla base alleata; vedendosela brutta, dopo poco i
nemici si ritirano verso la loro citta'. I soldati li inseguono, ma davanti
alle mura capiscono che senza armi d'assedio le difese li trafiggeranno, e
tornano indietro; sulla via del ritorno trovano l'acropoli di un culto
antico (le rovine al centro della mappa) e decidono a malincuore di
distruggerla per ricavarne pietra e costruire fortificazioni. L'obiettivo
diventa la fortezza (obbligatoria, e basta). Intanto il nemico manda
ondate; la prima dopo la fortezza, vista la sua mole, torna in citta' ad
avvertire: le ondate dopo hanno anche macchine d'assedio (prima no).
L'obiettivo diventa distruggere la base nemica. Nemico: economia
bilanciata, al piu' 10 lavoratori (alcuni gia' attorno al centro), un
esercito medio in citta' a difesa delle mura e ondate periodiche; una
grande riserva di pietra; gli edifici si riparano e si ricostruiscono
sempre, tranne quelli di pietra (che il giocatore lo scopra da solo). Le
due torri nemiche fuori dalle mura restano, di vedetta: non tirano. Le
colonne e le altre rovine non di pietra restano decorazioni. Numeri
proposti e accettati per ora: giorno, 200 cibo, 200 legno, 100 oro, 0
pietra; prima ondata a 4 minuti, poi ogni 3, da 4 soldati e uno in piu'
ogni volta.

**Regia** (levels.js `enemyManagerLv5`, `LV5`; numeri da tarare giocando):
- *fase 0, la battaglia*: i 15 nemici a ovest della citta'. Quando ne
  restano al piu' due terzi (o dopo 45 s) i superstiti si ritirano in
  citta' (dialogo 5_1, fase 1). Misurato: senza ritirata la battaglia dura
  ~10 s (a 4 s ne restano 9, a 8 s uno); la ritirata parte a ~3 s, con 8
  superstiti da inseguire;
- *la ritirata* (enemies.js `retreatTo`, mischia e arcieri): verso un posto
  ciascuno dentro la porta ovest (LV5.home), col flow field dei nemici (che
  passa dalle loro porte, §9.75), senza combattere ne' inseguire; arrivati,
  restano a difendere (quelli della regia economica tornano in attesa delle
  ondate). La regia economica non li comanda mentre si ritirano;
- *fase 1 -> 2, le mura*: un alleato a 600 px dalle mura o da una porta
  nemica: dialogo 5_2 (senza armi d'assedio e' inutile, ripiegate);
- *fase 2 -> 3, l'acropoli*: almeno 10 s dopo, un alleato a 700 px dal centro
  delle rovine (3700, 2300): dialogo 5_3. L'acropoli e' sulla strada
  dell'inseguimento: senza l'attesa il dialogo arrivava insieme a quello
  delle mura. La pietra la scavano i civili, come sempre: al centro ~3200
  (rovine del castello 500, quattro rovine di torre 400, della chiesa 75,
  la pietra grande 850 e tre piccole 1350); la fortezza ne costa 850;
- *fase 4, la fortezza* (a qualunque fase, appena c'e' un castello finito):
  dialogo 5_4, obiettivo "Distruggi la citta' nemica (edifici rimasti: n)";
- *l'avvertimento*: la prima ondata partita dopo la fortezza, a 900 px da
  lei, torna in citta' (dialogo 5_5); da allora a ogni ondata 1, 1, 2, 2,
  3... (al piu' 3) macchine d'assedio, un ariete e una catapulta a turno,
  pagate con la pietra del nemico (ariete 250, catapulta 300). Nascono fuori
  dalla porta ovest (LV5.siegeAt): col loro percorso "largo" (§8.14) non
  passerebbero dalle porte; vanno verso l'edificio alleato piu' vicino, poi
  attaccano da sole (siege.js);
- *vittoria*: nessun edificio della citta' (centro, case, caserme, stalle,
  chiesa, castelli, magazzini, mulino, torri, cantieri; non mura, porte e
  campi). Codice del livello 6: 8 0 6 5 3, sblocca il 6.
- Obiettivi (endgame.js): quello di prima, barrato, e quello di ora:
  "Respingi l'attacco nemico", "Insegui i nemici fino alla loro citta'",
  "Ripiega e trova della pietra", "Costruisci una fortezza", "Distruggi la
  citta' nemica (edifici rimasti: n)". Dialoghi, obiettivi, storia sulla
  mappa della campagna e testo della vittoria scritti per il porting dalla
  regia dell'autore, in sei lingue (texts.js), da rivedere con lui.
- *Torri di vedetta* (lvl05Setup): le torri nemiche a ovest di x 5100 non
  tirano (ranged.js `watch`) e non sono della regia economica (un alleato
  vicino non chiama la difesa della citta').

**Regia economica** (economy.js, ECO.lvl05): 4 lavoratori attorno al centro
(fino a 10), scorte 300 cibo, 300 legno, 200 oro e 3000 pietra, nessuno a
cavar pietra (mix stone 0). Opzioni nuove: `armyEco` (il tetto dell'esercito
conta solo i soldati della regia: i 38 della mappa, presidio e battaglia,
bloccavano la produzione e quindi le ondate) e `stoneWork: false` (niente
riparazioni ne' ricostruzioni degli edifici di pietra: torri, castelli,
chiesa, mura, porte). Il presidio della citta' e' quello della mappa (23
soldati, fermi a difendere); le ondate sono dei soldati della regia (fino a
12).

**Il segnalino della campagna**: cap5 dell'autore (210 x 193) a 120 px di
larghezza (`cap_l5`), sotto il livello 4 in fondo alla catena montuosa al
centro della mappa, con la freccia dal 4; la storia del livello sotto.

**Il giorno**: tutti i livelli hanno il ciclo giorno-notte dell'originale
(la notte a ~100 s); il livello 5 parte di giorno, come il 4.

Prova (`game/test/browser/lvl05.mjs`, nella CI): partenza (risorse, 4
lavoratori e 3000 pietra del nemico, 2 torri di vedetta, primo dialogo,
fase 0); un soldato per 10 s accanto a una torre di vedetta, nessuna
freccia; la ritirata da sola con dialogo, e i superstiti entrano in citta';
mura e acropoli (fasi e dialoghi; di solito ci si arriva da soli
inseguendo); una casa danneggiata si ripara, un castello no, distrutti si
ricostruisce solo la casa; una fortezza: fase 4 e dialogo; la prima ondata
dopo torna indietro a ~880 px dalla fortezza, col dialogo; l'ondata dopo ha
un ariete (250 pietra); distrutta la citta' (le mura restano), vittoria.
Senza nessun ordine del giocatore (20 000 passi): ritirata a 3 s, mura a 18
s (i soldati inseguono da soli), acropoli a 28 s, 10 lavoratori nemici a
~100 s, prima ondata a 4 minuti (a 5 minuti ha ucciso 6 soldati del
giocatore lasciati senza ordini).

### 9.77 Livello 5: un giocatore automatico

Richiesta: provare la partita facendo le scelte del giocatore. Strumento
`game/test/browser/autoplay.mjs` (fuori dalla CI: una partita dura minuti):
gioca con gli stessi comandi del giocatore (clic destro vero, tasti di
costruzione e produzione, clic sinistro per piazzare) con tre strategie
(ordinato, aggressivo, lento) e scrive fasi, risorse, perdite e ondate.

Ritocco: il centro dell'acropoli passa a (3450, 2250) con raggio 800 (era
3700, 2300 e 700): le pietre da cavare stanno a ovest delle rovine e il
dialogo arrivava solo passandoci accanto da est.

Prima partita, strategia ordinata (40 minuti, seme 1): fortezza cominciata
a 3:40 e finita a 4:37, ondata d'avviso a 7:43. Il legno resta fra 10 e 220
per tutta la partita: vicino alla base gli alberi veri entro 2500 px dal
centro sono 11 (uno entro 1500), i boschi attorno sono `albero_fake`
(decorativi, 47 entro 1500 px); quello a (1816, 1188) e' chiuso dalle
montagne e i civili ci camminano sul posto. Niente arieti, 2 catapulte; le
ondate (dal quarto minuto, ogni 3, poi con le macchine d'assedio) logorano
l'esercito: 27, 22, 16, 12, 7 e 0 soldati a 20:39; sconfitta. La citta'
nemica resta intatta (28 edifici).

### 9.78 Livello 5: gli alberi erano finti

Segnalazione dell'autore (dopo §9.77, "nel livello 5 manca il legno"): gli
alberi dovrebbero essere tutti veri; i finti hanno la F sopra, e di solito
sono quelli che nessuno raggiunge.

**Causa**: nel tileset `natura` del kit `albero_fake` aveva, oltre ad
alb1_F (con la F), una tile per ogni variante alb1..alb8 (tools 11: una
tile per sprite scelto a caso nel Create), con le stesse immagini degli
alberi veri. Nella mappa del livello 5, 298 alberi su 377 erano le tile 12,
13 e 14 (`albero_fake` alb4, alb5, alb6): indistinguibili in Tiled, finti
nel gioco. Nei livelli 2-4 i finti vengono dalle room di GameMaker
convertite, e sono quelli dell'originale.

**Ora**:
- kit (tools/11_tiled_kit.py, `fake_mark`): le varianti di `albero_fake`
  hanno la F arancione di alb1_F (stessa origine per tutti gli alb*, la F
  e' la differenza fra alb1_F e alb1). Gli id delle tile non cambiano: le
  mappe restano valide;
- `mappe/lvl05.tmx`: le 298 tile finte diventano gli alberi veri con la
  stessa immagine (12, 13, 14 -> 3, 4, 5); poi, seguendo la regola
  dell'autore, i 9 alberi che nessuno raggiunge (chiusi da montagne, fiumi o
  bordo della mappa, a regioni calcolate senza gli alberi, per il giocatore
  e per il nemico) diventano finti con la F, fra cui quello a (1816, 1188)
  dove i civili camminavano sul posto (§9.77). Alberi veri: 368.

Passano lvl05, enemywalls e il controllo degli scenari (tools 12 --check).

**Partite del bot dopo la correzione** (autoplay.mjs con i contadini sui 4
campi, il riequilibrio dei mestieri, fino a 14 civili, i rinforzi a gruppi
di 8 e l'assalto fallito che torna alla base; seme 1, 40 minuti):
- ordinato: fortezza a 4:18, assalto a 7:37 (23 soldati, 2 arieti, 2
  catapulte), porta ovest abbattuta a 8:27, in citta' i soldati muoiono
  contro il presidio e le torri: 2 edifici su 28; poi le ondate (8, le
  ultime con le macchine) distruggono le case. Sconfitta a 26:41;
- aggressivo (assalto appena ci sono le macchine): 32 assalti, quasi tutti
  con 1-3 soldati; fino a 4 edifici distrutti, poi ricostruiti (26 alla
  fine). Tempo scaduto;
- lento (2 torri prima): fortezza solo a 13:31 (le torri si mangiano la
  pietra), nessun assalto (manca l'oro per 4 arieti e 3 catapulte); la
  citta' cresce da 28 a 32 edifici. Tempo scaduto.
Il legno non manca piu' (fino a 2400). Il bot non fa micro (non punta le
torri con le catapulte, non ritira i feriti): dice che il livello non si
vince "a forza", non quanto e' difficile per un giocatore.

### 9.79 Pulsante della fortezza, oro, presidio, catapulte

Segnalazioni e richieste dell'autore.

**Il pulsante di costruzione della fortezza non si illuminava** col
puntatore sopra. Era cosi' nell'originale: il Draw_GUI di
`castello_clicker` [C], unico fra i pulsanti di costruzione, non ridisegna
il cerchio a 0,99, solo l'icona (che e' gia' a 1): il porting lo
riproduceva (`noRing`). Ora il cerchio si illumina come negli altri
(buildings.js).

**Oro per miniera dimezzato**: 1250 invece di 2500 (civilians.js,
`resource`), per tutte le miniere, del giocatore e del nemico; con 2500 una
sola miniera bastava per la partita.

**I pulsanti degli arcieri di presidio della fortezza** passano dalla
seconda riga alla prima, a destra di ariete, catapulta e annulla (x 660,
730, 800, 870); barra e coda della produzione tornano in seconda riga
(production.js, niente piu' `queueY`): con una produzione in corso non si
va piu' in una terza riga. A 1280-1440 px di larghezza il pannello degli
obiettivi (ancorato a destra, da `W - 520`) copre il terzo e il quarto
pulsante, come gia' copriva gli ultimi posti della coda.

**L'anello blu delle unita' selezionate** e' 2,2 volte piu' largo sotto le
macchine d'assedio, alleate e nemiche (units.js, `unitRing`): circ_1 e'
un'ellisse di 67 x 33 px, e sotto un disegno largo ~200 px non si vedeva.

**Il sasso della catapulta saliva troppo.** Nell'originale [C] la quota e'
`time * startspeed - 0.1 * time^2` con `startspeed = 0.1 * t` (t = passi
di volo, distanza / 5): vertice a 0,025 t^2, cioe' a 850 px (la gittata)
~720 px d'altezza, a 300 px ~90. Ora il tiro e' a 45 gradi: sale a 5 px
per passo (quanto avanza) e la caduta e' `5 / t` (`fall`): vertice a un
quarto della distanza, 212 px a 850, 75 a 300. Stessa durata del volo e
stesso punto d'arrivo; un sasso in volo in un salvataggio di prima finisce
con la parabola vecchia.

**Macchine d'assedio una sopra l'altra.** La maschera (cati11, 111 x 96) e'
molto piu' piccola del disegno (~205 x 170): due catapulte con le maschere
quasi a contatto si coprono per meta'. Le catapulte poi si fermano a tirare
dove sono appena un edificio e' a tiro (sul flow field passano una
sull'altra), due che arretrano dallo stesso edificio sceglievano lo stesso
punto, e la formazione le metteva a 10 px di maschera. Ora (siege.js),
con `SIEGE_FOOT` = 170 x 120 px, l'ingombro a vista (due macchine della
stessa parte con i centri piu' vicini di cosi' in x e in y sono addosso):
- prima di mirare (tiro automatico, alleate e nemiche, e ordine di
  attacco), addosso a un'altra macchina ferma, la catapulta va a un posto
  libero li' vicino (anelli da 60 a 240 px, il piu' lontano dall'altra) da
  cui il bersaglio resta a tiro; al piu' una volta ogni 120 passi: se non
  c'e' un posto, o arrivata e' ancora addosso, tira da li';
- i punti di tiro (arretrare da un edificio troppo vicino, avvicinarsi per
  un ordine) evitano le macchine ferme e le mete di quelle in cammino; se
  non ce n'e' nessuno, come prima;
- ogni 10 passi le macchine ferme e libere (arieti senza bersaglio
  compresi) addosso a un'altra ferma si spostano allo stesso modo: quella
  creata dopo, o quella libera se l'altra tira, colpisce o ricarica
  (`settleSiege`, da app.js);
- nella formazione (units.js) le macchine contano almeno SIEGE_FOOT.

Prova nuova `game/test/browser/catapults.mjs` (nella CI): 4 catapulte in un
quadrato con le maschere quasi a contatto (115 x 100 px) a ~600 px da un
edificio, alleate e nemiche, e 6 catapulte alleate mandate col clic destro
vero in un punto libero; 2400 passi. Prima: 2400 passi su 2400 con due
catapulte addosso che tirano, 6 coppie addosso alla fine (8 nel gruppo).
Ora 0 e 0 (e 0 nel gruppo); colpi arrivati 39 (40 prima).

**Il ciclo giorno-notte** (domanda; non cambiato). Manager [C], a 60 passi
al secondo: primo giorno 6000 passi (100 s), tramonto 200 (3,3 s, night
+0,005 a passo), notte piena 2000 (33 s), alba ~200 (3,3 s), poi giorno
4000 (67 s): un giorno intero dura ~107 s, la notte e' la meta' del giorno
(un terzo del ciclo). E' il rapporto di un giorno d'estate alle nostre
latitudini (16 ore di luce e 8 di buio); in media sull'anno giorno e notte
si equivalgono. Tramonto e alba durano il 3% del ciclo (il crepuscolo
civile vero ~2%).

### 9.80 Nemici nella nebbia; presidio nemico; vita degli arcieri che escono

Richieste dell'autore.

**Nebbia del tutorial** (le nuvole `fog01` di `fog_controller` nel match):
i nemici erano quasi immobili. Nell'originale [C], vicino a una nuvola
(entro 290 px) il guerriero non inseguiva mai (il difetto delle graffe,
§3.10 n.39), l'arciere non inseguiva, ariete e catapulta nemici non
facevano niente; picchiere e cavaliere inseguivano a 200 px invece di 400.
Ora vedono solo meno (enemies.js, `fogSight`, `FOG_SIGHT` = 0,5): nella
nebbia le distanze a cui si accorgono del giocatore si dimezzano, come di
notte (e di notte nella nebbia si dimezzano due volte): l'inseguimento di
tutti i soldati (400 -> 200), tiro (400 -> 200) e inseguimento (600 ->
300) dell'arciere, l'edificio da colpire dell'ariete (700 -> 350), la
gittata della catapulta (850 -> 425).

**Presidio nemico** (enemygarrison.js), come quello del giocatore (§9.63):
torri e fortezze nemiche tirano una freccia per arciere dentro (al massimo
2 la torre, 4 la fortezza), l'arciere entra a contatto con l'edificio e
sparisce, esce accanto con la vita che aveva entrando (l'ultimo entrato
esce per primo; un soldato della regia economica torna in attesa delle
ondate). Prima tiravano sempre 2 frecce senza nessuno dentro: torri e
fortezze della mappa partono con 2 arcieri dentro (all'inizio tirano come
prima, e un salvataggio di prima vale come 2), quelle che l'economia
nemica costruisce (enemy_cantiere, `built`) partono vuote. Selezionate,
mostrano gli arcieri dentro ("1/2", come la torre del giocatore).
L'AI, ogni 30 passi per edificio:
- *minaccia* (un'unita' del giocatore entro 700 px): gli arcieri nemici
  liberi entro 600 px (fermi, o che inseguono senza tirare; della mappa,
  difensori o in attesa delle ondate; non quelli delle regie dei livelli:
  ritirata, strada, livelli 3, 4, 5) vanno a riempire i posti;
- *in pace* un edificio vuoto lo occupa un arciere vicino (uno);
- *sotto un quarto della vita* escono tutti (non muoiono nel crollo);
- *30 s senza minaccia*: ne esce uno ogni 10 s, fino a uno dentro.
Un arciere che in 15 s non arriva, o trova l'edificio pieno o crollato,
lascia perdere. La torre di vedetta del livello 5 (watch) non tira ne'
chiama nessuno. Distrutto l'edificio, chi e' dentro muore (come per il
giocatore).

**La vita degli arcieri che escono** (verifica): giusta. Entrando la vita
va in `garrisonLives` dell'edificio, uscendo l'arciere nasce (vita 55 dal
Create) e la riprende subito dopo. `garrison.mjs` ora prova anche un
arciere a vita piena (55) insieme ai feriti (30, 35, 40) e che la vita
sia la stessa 2 s dopo l'uscita: torre 30 e 55, fortezza 30, 35, 40 e 55.

Prova nuova `game/test/browser/enemygarrison.mjs` (nella CI): torre
nemica della mappa (parte con 2, tira; vuota non tira; in pace la
rioccupa un arciere solo; con un soldato del giocatore a 680 px entra il
secondo; a un quinto della vita escono tutti con 30 e 40, uguali 2 s
dopo); fortezza con 4 arcieri in pace (a 28 s 4, a 40 s 2, a 60 s 1);
fortezza finita da un cantiere (vuota, nessuna freccia); guerriero nemico
accanto a una nuvola ferma: insegue un soldato a 180 px (prima restava
fermo), non uno a 330.

### 9.81 Suggerimenti del tutorial staccati dall'interfaccia

Richiesta dell'autore: i suggerimenti del tutorial che si riferiscono ad
altre finestre dell'interfaccia sempre a 20 px da quelle; quelli sugli
elementi della partita (unita', edifici, risorse) restano come sono.

Misure (prova nuova `game/test/browser/hintgap.mjs`, nella CI: la
distanza di ogni suggerimento da risorse, pannello e pulsanti dell'unita'
selezionata, inattivi, pausa, obiettivi, minimappa o suo pulsante, a
1280 x 720, 1366 x 768 e 1920 x 1080). Prima:
- `hint_idle` (W-410, 170) copriva il fondo del riquadro degli inattivi
  (W-90..W-20, 100..200);
- `hint_objective` e `hint_objective2` toccavano il riquadro degli
  obiettivi (0 px: W-900 col riquadro da W-520, §9.27 lo segue quando si
  allarga);
- `hint_minimap` entrava di 10 px nella minimappa (H - testo - 98 - mappa);
- a 1280 x 720 `hint_night` finiva sotto gli obiettivi, gli obiettivi su
  pannello e pulsanti dell'unita' selezionata, e la colonna di sinistra
  (`hint_vista`, alta 278 px) a 18,7 px dalla minimappa.

Ora (hints.js; gia' a 20 px erano la colonna di sinistra a 20, 170 sotto le
risorse e i pulsanti a 420, 170):
- `hint_idle` sotto il riquadro degli inattivi, allineato al suo bordo
  destro, e sotto quello degli obiettivi se e' piu' basso (endgame.js,
  `w._objBottom`);
- `hint_objective` / `objective2` a 20 px a sinistra degli obiettivi; se li'
  finirebbero sui pulsanti di costruzione (schermi stretti), 20 px sotto;
- `hint_minimap` 20 px sopra la minimappa (o sopra il suo pulsante, se
  nascosta); se li' finirebbe sulle risorse (schermi bassi), accanto alla
  minimappa, in fondo;
- la colonna di sinistra (`hint_iniziale`, `vista`, `resource_tree`,
  `lavori`, `resource`): se arriverebbe a meno di 20 px dalla minimappa, a
  destra della minimappa;
- `hint_night`, `hint_lavoratori` (420, 170): sotto gli obiettivi se ci
  finirebbero addosso.
Le posizioni si ricalcolano a ogni passo (minimappa nascosta o
ridimensionata, obiettivi nascosti). Dopo: tutti a 20 px o piu' nelle tre
misure dello schermo.

La fortezza (§9.79): sentito l'autore, i quattro pulsanti degli arcieri
restano in prima riga.

### 9.82 Livello 5: l'AI nemica sotto osservazione

Richiesta dell'autore: provare e osservare l'AI nemica del livello 5 per
vedere se fa cose strane.

**Strumento**: `game/test/browser/enemymonitor.js`, il monitor dell'AI
nemica per `autoplay.mjs` (§9.77) con `MONITOR=1` (e `TRACE=1`: i passi
di chi va avanti e indietro). Ogni 30 passi segnala: nemici fermi in
cammino per 10 s (con chi hanno addosso o davanti, la cella davanti, il
valore del flow field nella loro cella e se la linea verso la meta e'
libera), 6 inversioni di marcia in 60 s (non i lavoratori, che fra un
albero e un deposito a 100 px vanno avanti e indietro di continuo), nemici
su celle chiuse (non i lavoratori nei campi) o fuori dalla room, colpiti
fermi per 5 s, fermi con un soldato del giocatore a meno di 120 px, macchine
d'assedio ferme una sopra l'altra, entrate e uscite dai presidi (e le
rinunce), lavoratori fermi. Tre partite di 40 minuti (ordinato, aggressivo,
lento; seme 1). La simulazione non e' del tutto deterministica (alcuni
calcoli dei percorsi hanno un budget di tempo reale): due partite uguali
non vanno uguali, si confrontano gli ordini di grandezza.

**Trovato e corretto.**
- *Un lavoratore nemico usciva dalla room e andava a est per sempre* (in
  tutte e tre le partite, dal minuto 7: x 9117, poi oltre 10 000; la room
  e' larga 9000). Un albero sul bordo est (8964, 1542) aveva un posto di
  lavoro fuori dalla room (civilians.js `resSpots`, x 9017); da li', per
  tornare al deposito, fuori dalla griglia `flowAt` vale 0, "verso est".
  Ora i posti attorno alle risorse stanno dentro la room (`ver` 2: si
  ricalcolano), e chi e' fuori dalla griglia torna verso la griglia
  (pathing.js `moveFlowField`).
- *Soldati della regia economica che tremano sul posto* (oltre 100
  inversioni al minuto, ruolo 30, verso un punto a 2600 px): finita la
  difesa (§9.50, l'intruso se ne va) tornavano in attesa ma restavano in
  cammino verso l'ultima posizione dell'intruso, ora senza flow field
  (ruolo 30), contro le mura. Ora si fermano dove sono, come diceva il
  commento (economy.js).
- *Soldati che inseguono dietro un ostacolo*: vicino alla meta, o senza un
  campo proprio, i nemici vanno dritti (mp_potential_step [C]); i soldati
  delle ondate arrivati (ruolo 32) che inseguivano un soldato del giocatore
  dietro le sue torri tremavano sul posto (fino a 112 inversioni al minuto).
  Ora con la linea chiusa da ostacoli fissi usano un campo verso la meta
  (enemies.js `chaseField`: dei nemici, passa dalle loro porte; tenuto
  finche' la meta non si sposta di 3 celle, al piu' 2 s; non salvato). Se
  dalla loro cella la meta non si raggiunge (chiusi in un anello di alberi,
  crowd.mjs "circondato") vanno dritti come prima; e non chi va a dare
  fuoco (firework), che gira attorno all'edificio sulla sua orbita
  (meleeSpot): col campo, in fireorder.mjs "enemy casa front", un
  guerriero finiva sotto un cavaliere che si scansava per lui (§9.31,
  warwork 4) e i due restavano fermi uno sull'altro, il guerriero ad
  aspettare la precedenza del cavaliere che non riusciva a spostarsi. Lo
  stallo c'era gia' (non corretto: non e' successo con il codice di prima
  in nessuna prova).
- *Soldati appena prodotti fermi accanto alle caserme* (10 s e piu', in
  cammino, nessuno addosso, la cella davanti libera): il campo della
  difesa e delle ondate (economy.js) contava come ostacolo anche le celle
  dei soldati nemici fermi; con le porte della citta' piene di difensori
  l'interno era irraggiungibile (-1 nella loro cella, nessuna uscita entro 6
  celle). Ora difesa, ondate e inseguimento usano il campo dei soli
  ostacoli fissi (`goalField` con `fixed`); col flow field si passa sopra
  le unita'.
- *Il presidio nemico (§9.80) svuotava le torri della citta'*: con la
  regola "30 s senza minaccia: ne esce uno fino a uno", a inizio partita
  ogni torre e fortezza scendeva da 2 a 1. Ora si scende fino alla
  guarnigione di partenza (`keep`: 2 per gli edifici della mappa, 1 per
  quelli costruiti); escono solo gli arcieri entrati in piu' sotto
  minaccia. `enemygarrison.mjs`: la fortezza con 4 torna a 2.
- autoplay.mjs contava come morti gli arcieri entrati in un presidio.

**Trovato provando: due civili persi** (anche del giocatore: il codice e'
lo stesso), da `idle.mjs` "nascosti" (fuori dalla CI), che con le miniere
da 1250 oro (§9.79) ne esaurisce una durante la raccolta. Su main passava.
- *Col carico accanto al deposito*: arrivato col campo nella cella accanto
  al centro, a ~28 px (si scarica sotto i 10), "lontano" dalla meta (il
  centro dell'edificio, a 218 px: un edificio grande); un civile inattivo
  fermo li' (a miniera finita) lo respingeva e lui tornava, per sempre.
  Ora col carico a meno di 48 px dal deposito si va dritti, sopra gli
  alleati (civilians.js `depClose`).
- *Il taglialegna col proprio albero finito*: `resAt` sceglieva il nuovo
  albero (lo scoperto piu' vicino) e aggiornava woodx, ma la meta restava
  sul vecchio finche' il civile non era entro 250 px dal nuovo: a 567 px
  girava per sempre dove c'era il vecchio. Ora passa al nuovo anche la meta.

**Numeri** (conteggi del monitor, passi di 0,5 s; prima -> dopo, ordinato /
aggressivo / lento): fuori dalla room 4345 / 3961 / 3983 -> 0 / 0 / 0;
avanti e indietro 10 948 / 29 840 / 20 727 -> 584 / 651 / 3611 (una
seconda partita lenta, con l'eccezione di chi va a dare fuoco: 1291);
soldati fermi alla nascita (campo a -1) da 6 a 14 per partita -> 0.

**Resta (non corretto).** Ingorghi, non errori di logica: la guarnigione
della citta' (ruolo 0) che insegue verso ovest si accoda alla porta ovest
dietro i compagni (x 5727); gli attaccanti nella base del giocatore si
ammassano fra le sue case e torri e qualcuno resta 10 s fermo dietro gli
altri o va avanti e indietro fra due bersagli (le inversioni rimaste della
strategia lenta, che costruisce 2 torri alla base). Nessuna macchina
d'assedio nemica ferma sopra un'altra, nessun nemico colpito che non
reagisce (uno o due casi per partita: arieti senza bersaglio), nessun
presidio che entra ed esce di continuo.

Passano tutte le prove nel browser della CI (soak e salvataggi su tutte le
room compresi) e `idle.mjs`.

### 9.83 Zoom morbido

Richiesta dell'autore: lo zoom con la rotella fluido invece che a scatti.

Prima ogni scatto della rotella (o X, Z) cambiava lo zoom di 0,1 in un
fotogramma (`setScale`, arrotondato ai decimi: 8 livelli fra 1 e 1,7).
Ora (camera.js `zoomTo`, `zoomStep`; manager.js):
- rotella e tasti spostano la meta dello zoom, e lo zoom la raggiunge di un
  quarto della distanza a passo (il 90% in 8 passi, ~130 ms; sotto 0,002 si
  ferma esattamente sulla meta); piu' scatti di fila si sommano alla meta
  (dalla meta in corso, non dallo zoom del momento) e il movimento non
  riparte da capo;
- il punto di room sotto il puntatore resta fermo per tutto il movimento
  (prima solo all'arrivo, che era istantaneo); X e Z tengono fermo
  l'angolo in alto a sinistra, come prima;
- il touchpad (delta sotto i 50 px a evento) zooma in modo continuo, 0,1
  ogni 100 px, senza arrotondare; prima i delta si sommavano fino a uno
  scatto intero (input.js `wheelFine`). La rotella classica (~100 px a
  scatto) resta a decimi;
- limiti invariati (1 e ZOOM_MAX = 1,7); un salvataggio caricato a meta'
  movimento ferma lo zoom (snapshot.js).
Nessun punto del codice confronta lo zoom con valori esatti: posizione dei
pulsanti, minimappa e suggerimenti seguono gia' qualunque valore.

Prova nuova `game/test/browser/zoom.mjs` (nella CI), con eventi veri: uno
scatto della rotella (da 1 a 1,1 in 10 passi intermedi, mai indietro, il
punto sotto il puntatore fermo), due scatti di fila (+0,2), touchpad
(12 x -10 px: -0,12, cioe' 1,18), limiti (1,7 e 1), X e Z (10 passi
intermedi). Col codice di prima fallisce (0 passi intermedi, touchpad 1,2).
Nella prova serve disegnare un fotogramma prima della rotella: con
`nostart=1` il canvas resta nascosto (visibility: hidden, nessun evento)
finche' non si disegna. Passano anche ui, hintgap, enemybuildings,
salvataggi e soak.

### 9.84 Effetti d'ambiente: nuvole, alba e tramonto, camini, crolli, polvere

Richiesta dell'autore: effetti grafici poco costosi per migliorare la resa.
Scelti dall'autore fra quelli proposti: ombre delle nuvole, alba e tramonto
con uno stadio rosa (come NIMBUS), fumo dai camini, polvere ai crolli,
polvere sotto cavalieri e macchine d'assedio, e da provare le finestre
accese di notte. Scartati: lampo sul colpo, scossa della visuale. Tutto
solo estetico (il gioco non legge niente di questo) e senza sprite nuovi
(game/src/ambience.js, fog.js, fogdraw.js, manager.js, gl.js, world.js).

**Ombre delle nuvole.** Macchie scure e morbide: lo sprite della luce dei
fuochi (arealight, un disco nero sfumato) allargato 4-7,5 volte e
schiacciato come il suolo (0,62), 3-5 per nuvola, una nuvola ogni
2600 x 1900 px, portate dal vento (0,32 e 0,07 px a passo verso est e un
po' a sud; dipendono solo dal passo: niente da salvare). Il problema degli
oggetti alti (domanda dell'autore): un'ombra composta sopra tutto, pixel
per pixel come nebbia e notte, darebbe alla cima di una torre l'ombra del
terreno 250 px piu' a nord, e l'edificio sembrerebbe dipinto per terra.
Quindi: sul suolo le macchie si disegnano subito dopo di lui, prima delle
istanze; ogni istanza si scurisce tutta (Renderer.shade, un moltiplicatore
dei colori dei quad) di quanto e' in ombra il punto in cui tocca terra,
con lo stesso conto della miscela dei dischi (`shadeAt`, il profilo
dell'alpha di arealight misurato sull'immagine). Una torre entra
nell'ombra quando ci entra la sua base, senza deformarsi; un edificio molto
largo si scurisce in blocco. Alpha 0,16 per macchia; spariscono nella prima
meta' del tramonto. *Con la pioggia* (domanda dell'autore: non una
nuvoletta che passa mentre piove) il cielo e' coperto: le macchie si
dissolvono e tutta la scena si scurisce di un grigio freddo uniforme
(sottrazione 0,17 / 0,15 / 0,10), in ~5 s, e tornano quando smette
(`overcast`, solo estetico). *Costo*: il conto per istanza e' trascurabile
(0,007 ms per 37 istanze); i dischi, 3 quad trasparenti grandi quasi
quanto lo schermo, sono gratis su una GPU ma con SwiftShader costano ~4 ms
a fotogramma (8,8 contro 4,9): niente nuvole col rendering software (quello
che gia' fa comparire l'avviso) ne' con la qualita' "Bassa".

**Alba e tramonto rosa.** Uno stadio intermedio sul rosa (`skyColour`): si
sottraggono un po' di verde (0,2) e di blu (0,11), il rosso resta. Sale
negli ultimi 900 passi (15 s) del giorno, e' pieno durante il passaggio
(global.night fra 0 e 1, 200 passi) mentre il colore va verso quello della
notte di sempre, e scende nei primi 900 passi dopo l'alba. Si ricava dagli
allarmi del manager (giorno: alarm 0; dopo l'alba alarm 0 riparte da 4000),
che si salvano gia': nessun campo nuovo. Il gioco legge solo global.night.
Non nel livello 1 (sempre notte) ne' nel menu.

**Finestre accese (da provare).** Di notte una luce piccola (arealight a
0,65, che cresce mentre scende la notte) su due case intatte su tre,
sempre le stesse, del giocatore e nemiche gia' viste. Da giudicare a occhio.

**Fumo dai camini.** Solo le case del giocatore con un camino disegnato
(stili 1, 2, 4, 6; il 3 e il 5 non ne hanno, quelle nemiche hanno il tetto
piatto): uno sbuffo grigio (lo sprite del fumo degli incendi, nubespr, a
0,18-0,26) ogni 50-70 passi dalla cima del camino (misurata sugli sprite:
c1 -2,-113; c2 21,-106; c4 -27,-120; c6 42,-128 dall'origine), che sale e
si allarga. Non dalle case in fiamme (hanno gia' il loro fumo).

**Polvere ai crolli.** Quando compare una rovina nuova (non quelle della
stanza o di un caricamento): 12 sbuffi color sabbia, 26 per gli edifici
larghi piu' di 260 px, e 4-8 frammenti di mattone (sfx_mattone, quelli dei
colpi di catapulta).

**Polvere in corsa.** Sotto cavalieri e macchine d'assedio, alleati e
nemici: uno sbuffo piccolo ogni 18 px percorsi, a terra (sotto tutte le
istanze).

Fumo e polvere sono particelle della categoria "fire" (opzione "Fiamme e
scintille"), solo sullo schermo.

Prova nuova `game/test/browser/ambience.mjs` (nella CI): crepuscolo (0 a
950 passi dal tramonto, sale, 1 nel passaggio, 0 di notte piena, ancora
rosa subito dopo l'alba, 0 dopo), nuvole (52 macchie nella stanza,
nessuna di notte, ombra al centro di una macchia 0,67 e al bordo 0,75),
pioggia (coperto al 38% dopo mezzo secondo, poi del tutto e senza macchie;
smesso, 0 e le macchie tornano), camini (il fumo nasce entro 2 px dalla
cima del camino negli stili 1, 2, 4, 6, nei 3 e 5 niente), crollo di una
caserma (26 sbuffi, 8 frammenti), polvere di un cavaliere mandato col clic
destro, fumo che riprende dopo salvataggio e caricamento. Passano tutte le
prove nel browser della CI e idle.mjs; soak del livello 5 alla stessa
velocita' di prima (12,4 s contro 13,9 s, sulla stessa macchina).

### 9.85 Stadi di danno di edifici nemici di pietra, mura e porte

Sprite dell'autore (nuovi/sprites/, commit "Sprites edifici danneggiati"):
gli stadi di danno di torre, fortezza e monastero nemici (torre_b_r1/_r2,
castello_b_r1/_r2, chiesa_b_r1/_r2) e di mura e porte del giocatore
(m_ori, m_vert, porte orizzontali e verticali chiuse e aperte, _r1 e _r2).
Decisioni dell'autore: le mura e porte nemiche danneggiate si ricavano da
quelle del giocatore ricolorando le bandierine (come le mura nemiche intere,
§9.75); i cantieri nemici restano quelli del giocatore.

**Allineamento.** Le immagini sono ritagliate sul disegno ed esportate a
un'altra scala: misure tutte diverse dagli integri (torre 192x256 contro
196x258, fortezza 524x460 contro 511x451, muro orizzontale 566x167 contro
537x294). tools/14_allinea.py (nuova parte, numpy, solo per questo
strumento) cerca per ognuno scala (0,90-1,10) e spostamento che
sovrappongono meglio contorni neri e sagoma all'integro (correlazione con la
FFT): la scala e' 0,945-0,955 per tutti, cioe' un'esportazione al ~105%;
si usa la mediana, 0,95, per tutti, e si rifanno gli spostamenti. Scrive
"scala" e "a" nelle voci di nuovi.json ("su": lo sprite integro);
tools/nuovi.py ricostruisce lo sprite sulla tela dell'integro (allargata se
il disegno sporge: i muri verticali, 14-15 px sopra), con la sua origine.
Sovrapposizione 0,53-0,86 (le differenze sono crepe e pezzi crollati;
controllata a occhio su un'immagine in cui l'integro e' rosso e il
danneggiato verde: i contorni coincidono). La pipeline legge solo i numeri:
la CI non ha bisogno di numpy. 05_atlas ricava i danni di mura e porte
nemiche (<mura>_b_r1, _r2) da quelli del giocatore con tint_flags.

**Nel gioco** (game/src/damage.js): come gli edifici del giocatore (§3.5,
buildings.js `damage`), sotto i 2/3 della vita lo sprite _r1, sotto 1/3
_r2, in dissolvenza; riparati tornano indietro. Torre nemica (ranged.js),
fortezza e monastero nemici (enemybuild.js), muri e porte del giocatore e
nemici (walls.js). Le porte tengono il danno aprendosi e chiudendosi: il
cambio aperta/chiusa resta istantaneo come prima, il cambio di stadio a
porta ferma e' in dissolvenza; quelle che guardano chi c'e' solo ogni 10 o
30 passi aggiornano il danno a ogni passo. Le maschere (mask_index) non
cambiano: collisioni e percorsi restano quelli di prima.

Prova nuova `game/test/browser/damage.mjs` (nella CI): undici edifici
(torre, fortezza, monastero nemici; muri e porte del giocatore e nemici),
vita al 60%, al 20% e di nuovo piena: sprite _r1, _r2 e integro, tutti
nell'atlas, maschera invariata; le porte danneggiate aperte e chiuse
restano _r1. Passano la pipeline (06, 07, 11, 12 --check, scenari
invariati) e le prove nel browser della CI.

### 9.86 Ombre delle nuvole disegnate dall'autore

Richiesta dell'autore: sostituire le macchie delle ombre delle nuvole
(§9.84: 3-5 copie di arealight per nuvola) con sagome sue. Accordo preso
prima del disegno: poche forme intere e diverse (non pezzi da combinare),
che il gioco varia con scala, specchiatura, stiramento e un po' di
rotazione; nere su trasparente, viste dall'alto. Le ha disegnate gia'
schiacciate come il suolo (circa 2:1) e a bordi netti: la sfumatura in
Photoshop dava un nucleo netto con un alone, e si e' deciso di farla nella
pipeline, dove si regola provando in gioco senza rifare i file.

**Pipeline.** Sei sagome, nuovi/sprites/nn1-nn6 (commit "nuvole bordi
netti", 1021x722, nero pieno con bordo antialias). Opzioni nuove di
nuovi.json, in tools/nuovi.py: "sfuma" (deviazione della gaussiana in px
dell'immagine: 18, cioe' una sfumatura dal 10 al 90% di ~45 px su sagome
larghe 370-550 px, ~1/10) e "riduci" (0,5 dopo la sfocatura: 510x361;
in gioco sono ingrandite 5,5-8,5 volte). La sfocatura e' solo sull'alpha,
col colore dei pixel pieni (sagome di un colore solo). "griglia": 05_atlas
scrive nel manifest ("alpha") la mappa dell'alpha di tutta la tela, 64x45
celle in base64, che il gioco usa per scurire le istanze.

**Nel gioco** (ambience.js): una sagoma per cella della griglia di prima
(2600x1900 px), scelta a caso fra le sei con posizione, scala 5,5-8,5,
x allungata o accorciata fino al 20%, specchiata a meta', ruotata fino a 8
gradi: fisse per stanza (hash), mosse dal vento come prima. Alpha del nero
pieno 0,3. Niente piu' schiacciamento (le sagome lo sono gia'). shadeAt
(quanto e' in ombra il punto in cui un'istanza tocca terra) legge la mappa
dell'alpha, bilineare, rifacendo al contrario la trasformazione di
drawSprite. Verifica: due foto a 1600x900 (zoom 1,7) a 4100 passi di
distanza; nei punti senza nuvole nella seconda, il rapporto dei pixel fra
le due e' quello di shadeAt (1 / 0,958 / 0,841 / 0,704 contro 1 / 0,954 /
0,848 / 0,718, correlazione 0,98), con sagome specchiate e ruotate.
Invariati: niente ombre di notte e con la pioggia, spente col rendering
software e con la qualita' bassa.

`ambience.mjs`: le nuvole ora controllano che ci siano almeno 4 delle 6
sagome, l'ombra 0,7 nel pieno di una sagoma specchiata e ruotata e 1
fuori.

### 9.87 Alba e tramonto senza salti

Segnalazione dell'autore: col ciclo giorno/notte di §9.84 il giorno
diventava sera all'improvviso, poi tornava giorno sfumando; alla fine del
giorno la sera saliva, tornava giorno di colpo e partiva il passaggio alla
notte.

Simulato il manager passo per passo (alarm, Step, `twilight`, `skyColour`),
tre salti in `manager.twilight`, nessuno nel colore (`skyColour` e'
monotono lungo tutto il passaggio):
- *primo giorno*: la discesa dopo l'alba si ricavava come 4000 - alarm 0,
  ma il primo giorno della room dura 6000 passi (non c'e' stata un'alba):
  a 4000 passi dalla fine (2000 dall'inizio) il rosa compariva pieno di
  colpo e scendeva in 900 passi. E' il "giorno, sera improvvisa, sera che
  torna giorno" della segnalazione;
- *fine di ogni giorno*: con alarm 0 a 1 (il passo prima del tramonto)
  `twilight` dava 0, giorno pieno per un passo fra il rosa pieno e
  l'inizio del passaggio (il lampo di giorno prima della notte);
- *fine di ogni alba*: il passo in cui global.night scende sotto 0 alarm 0
  non e' ancora riarmato (-1) e `twilight` dava 0, giorno pieno per un
  passo fra la fine dell'alba e il rosa che scende.

Correzione (manager.js `twilight`): la discesa solo dopo un'alba, che si
riconosce da global.night appena sotto 0 (alarm 1 si ferma solo quando
scende sotto lo 0; al primo giorno della room e' 0 esatto, anche nei
salvataggi); il passo prima del tramonto e' rosa pieno (la salita va da 0 a
alarm 0 = 901 a 1 ad alarm 0 = 1); il passo dopo l'alba, con alarm 1
ancora armato, rosa pieno. I 4000 passi del giorno dopo l'alba sono una
costante sola (`DAY_AFTER_DAWN`) per l'allarme e per il conto. Nessun
campo nuovo; il gioco continua a leggere solo global.night.

Prova nuova in `manager.test.mjs`: tre giorni e tre notti dal primo giorno
(match e lvl02, che parte di notte), il rosa pesato come in `skyColour`
(per 1 - night) non salta mai piu' di 0,01 a passo (prima 1), nessun rosa
a meta' del primo giorno. Col codice di prima fallisce. Passano i test
unitari e `ambience.mjs`.

Visto e lasciato com'e' (dall'originale): il rettangolo di selezione e' blu
solo con global.night uguale a 0, e dopo la prima alba global.night resta
appena sotto 0, quindi da li' in poi e' bianco anche di giorno.

### 9.88 Visuale intermedia al crepuscolo

Richiesta dell'autore: una visibilita' intermedia (nebbia di guerra) nella
fase di alba e tramonto; prima il passaggio alla notte era brusco.

Nell'originale la visuale e' k = 1 - global.night (ellissi della nebbia
r + r x k, la stessa formula per quando unita' ed edifici nemici si
vedono): passa da giorno a notte solo nei 200 passi (3 s) del passaggio,
mentre il cielo diventa rosa per 15 s prima (§9.84). Ora (fog.js `sightK`)
il buio della visuale segue anche il crepuscolo: sale fino a `DUSK_SIGHT`
(0,5, cioe' ellissi a 1,5 r invece di 2 r) negli ultimi 900 passi del
giorno, con la stessa curva del rosa (manager.twilight, smoothstep), e il
passaggio lo porta da li' alla notte (n + 0,5 x (1 - n)); all'alba lo
stesso al contrario, con la risalita a giorno pieno nei 900 passi dopo.
Continuo: al massimo 0,0025 a passo nel passaggio (prima 0,005), meno
di 0,001 nel crepuscolo.

Vale per la nebbia (fogSources: scoperta e vista) e per la visibilita' di
unita' nemiche, edifici nemici, civili nemici e macchine d'assedio
(enemies.js, enemybuild.js, economy.js, siege.js, ranged.js: le stesse
ellissi, cosi' cio' che si vede e cio' che e' scoperto coincidono). La
vista dei nemici (portate di attacco e inseguimento, 1 - 0,5 x night)
resta quella dell'originale: solo il giocatore vede meno al crepuscolo.
Niente da salvare: w.twilight si ricava dagli allarmi salvati, in
manager.step prima delle istanze e al caricamento (snapshot.js), cosi'
anche il primo disegno dopo un caricamento in pausa e' giusto. Il livello 1
(sempre notte) non cambia.

Prova nuova in `manager.test.mjs`: giorno pieno 1, nel crepuscolo fra 0,5
e 1, al primo passo del passaggio e alla fine dell'alba 0,5, di notte 0,
giorno pieno 1000 passi dopo l'alba, nessun salto. Passano i test unitari,
`ambience.mjs` e `saves.mjs` (match, lvl02, lvl03: ripristino identico).
Verificato a occhio con cinque foto nel match (giorno, meta' crepuscolo,
tramonto, meta' passaggio, notte): le zone viste si restringono per gradi.

### 9.89 Nuvole grandi come nel disegno

Segnalazione dell'autore (provando il tutorial): le ombre delle nuvole
sembravano molto lente e indistinguibili da una macchia scura generica.
Il motivo: le sagome (larghe 370-550 px nel disegno, 1021x722) erano
ingrandite 5,5-8,5 volte la meta' risoluzione, cioe' 2,75-4,25 volte il
disegno: 1000-2300 px di room, piu' larghe dello schermo. Se ne vedeva
solo un pezzo sfumato.

Prove a foto nel match (a zoom 1 e 1,7, con un aggancio provvisorio per
cambiare scala, densita', alpha e vento senza ricostruire; il rendering
software del contenitore le spegne, forzato a mano nelle prove):
- scala attuale; 1:1 col disegno (1,7-2,3 della meta' risoluzione, una
  nuvola ogni 1100x800 px); 1,5 volte (2,6-3,4, una ogni 1500x1100); 2
  volte (3,5-4,5);
- alpha 0,3 e 0,45;
- sfumatura della pipeline (`sfuma` di nuovi.json) 18, 8 e 3, con tre
  atlas rigenerati (a 8 e 3 i lobi della sagoma si leggono di piu');
- vento 0,32, 0,8 e 1,5 px a passo, in un video a velocita' reale.

Scelta dell'autore: scala 1:1 con la sfumatura di sempre (18: "almeno non
e' enorme e si capisce che e' una nuvola"). Quindi (ambience.js) scala
1,7-2,3, una nuvola ogni 1100x800 px (circa quante prima per schermo, ma
piccole), alpha 0,4 per compensare la sagoma piu' piccola. Pipeline e
nuovi.json invariati. Il vento per ora resta 0,32 px a passo.

`ambience.mjs`: l'ombra nel pieno di una sagoma e' ora 0,6 (era 0,7).
Passa con 83 nuvole nella stanza (prima 20), 7 attorno alla view.

### 9.90 Il vento della partita

Richiesta dell'autore, dopo §9.89 e il video di prova dei venti (0,32, 0,8
e 1,5 px a passo): "una mezza follia", nuvole da 0,8 a 1,5 secondo il vento
della mappa, scelto a caso; col vento forte anche erba e fiori ondeggiano
di piu' e la pioggia e' piu' inclinata. Tutto solo estetico.

- *Vento*: g.wind, 0-1 a caso per partita (state.js), salvato con le
  globali; nei salvataggi di prima vale 0,5 (ambience.js `windLevel`).
- *Nuvole*: 0,8 + 0,7 x wind px a passo (`windSpeed`; erano 0,32 fissi),
  ora verso ovest e un po' a sud invece che verso est: la pioggia
  dell'originale cade verso sinistra, e il vento la inclina di piu' da
  quella parte.
- *Erba, spighe, fiori, germogli* (particles.js `angle`): i tipi il cui
  orientamento oscilla e non e' relativo alla direzione (sono solo le
  piante, anche nei salvataggi di prima). Col vento massimo l'oscillazione
  e' 1,6 volte piu' ampia e piu' rapida, e si piegano verso ovest di 0,75
  volte l'ampiezza (erba: 4 gradi -> 6,4, piegata di 3; i fiori in
  proporzione). Con wind 0 come prima. Particles.wind lo aggiorna
  ambienceStep a ogni passo.
- *Pioggia* (effects.js `rainStart`): direzione da 250-260 gradi (vento
  minimo, come prima) a 235-245 (massimo); le gocce restano parallele alla
  caduta (orientamento relativo). Il bordo da cui nascono si allunga a
  destra di quanto derivano a sinistra cadendo per tutta la room (prima
  300 px fissi: nel match in basso a destra, ~1900 px, non pioveva), con
  piu' gocce a passo in proporzione (densita' uguale). Si decide quando
  comincia a piovere; il sistema si salva come prima.

`ambience.mjs`, voce nuova "vento": nuvole a 0,8 e 1,5 px a passo, pioggia
a 250-260 e 235-245 gradi, erba con ampiezza 4 e 6,4 gradi e piega 0 e 3.
Passano i test unitari e tutte le voci di `ambience.mjs`. Video di
confronto (vento minimo e massimo, sole e pioggia) mandato all'autore.

### 9.91 Pioggia che cresce e cala piano

Domanda dell'autore sul video di §9.90 (il passaggio da sereno a pioggia era
netto: due momenti montati insieme, 1,5 s tagliati). In gioco il cielo si
copriva in ~5 s, ma le gocce nascevano tutte subito, e smesso di piovere il
sistema si distruggeva: le gocce in aria sparivano di colpo. Richiesta: il
numero di gocce che sale in 5 s da quando il cielo e' del tutto coperto, e
lo stesso quando smette.

Ora (effects.js `rainStep`, chiamato da manager.step dopo `overcastStep`):
- *inizio*: global.raining=1, il cielo si copre come prima (~6,4 s fino al
  pieno); da quel passo `ps.level` del sistema della pioggia sale da 0 a 1
  in 300 passi (5 s) e le gocce a passo sono em.full x level (la parte
  frazionaria a caso). Niente piu' flusso automatico (em.n = 0);
- *fine*: global.raining=0 (manager.stopRain non distrugge piu' il
  sistema), level scende a 0 in 300 passi col cielo ancora coperto
  (overcastStep: coperto finche' level > 0); a 0 il sistema si toglie
  quando le gocce in aria sono finite (releaseWhenEmpty; distrutto se la
  pioggia e' spenta nelle opzioni) e il cielo si rasserena in ~5 s;
- se ricomincia a piovere mentre le gocce calano, lo stesso sistema
  riprende a salire;
- gli anelli sul fiume in proporzione alle gocce.
Il livello si salva col sistema (provato: salvato a 0,503, ricaricato a
0,503, 60 passi dopo 0,703); i salvataggi di prima, col flusso automatico,
ripartono a pioggia piena. Solo estetico: lo spegnimento dei fuochi segue
global.raining come prima (anche nei ~11 s prima della pioggia piena).

`ambience.mjs`, voce nuova "graduale": cielo coperto al passo 386, prima
goccia subito dopo, pioggia piena 300 passi dopo il cielo coperto, nei
primi 60 passi ~12% delle gocce di 60 passi a pioggia piena; smesso, gocce
a 0 in 300 passi col cielo coperto, poi sereno e sistema tolto. Passano i
test unitari, `ambience.mjs` e `saves.mjs` (match, lvl02). Video continuo
senza tagli mandato all'autore.

### 9.92 La pioggia spegne i fuochi quando cadono le gocce

Richiesta dell'autore, dopo §9.91: lo spegnimento dei fuochi (manager alarm
2, ogni 10 passi gli edifici di legno alleati, §3.17 n.56) seguiva
global.raining, quindi cominciava appena il cielo iniziava a coprirsi, ~11 s
prima della pioggia piena, e smetteva di colpo allo stop mentre le gocce
calavano ancora.

Ora spegne solo con le gocce ad almeno meta' (`RAIN_PUT_OUT` = 0,5 di
ps.level, effects.js): ~2,5 s dopo le prime gocce (~9 s dopo l'inizio della
pioggia) fino a ~2,5 s dopo che hanno cominciato a calare. In tutto dura
quanto prima, spostato di ~9 s. Il livello non dipende dalle opzioni
grafiche (con la pioggia spenta nelle opzioni sale e scende lo stesso).

Siccome ora il cielo coperto decide la partita (quando nascono le gocce, e
le gocce quando si spengono i fuochi), w.overcast si salva (snapshot.js,
con il manager): prima dopo un caricamento ripartiva dal valore finale, e le
gocce potevano cominciare prima che senza caricare. I salvataggi di prima
ripartono dal valore giusto come prima.

`ambience.mjs`, voce "graduale": un edificio di legno in fiamme (onfire
rimesso a 1 a ogni passo) si spegne la prima volta al passo 545, con le
gocce a 0,533 (prima: al primo passo), l'ultima volta mentre calano a
0,517 con global.raining gia' a 0, mai dopo. Passano i test unitari,
`ambience.mjs`, `burn.mjs` e `saves.mjs` (match, lvl02, lvl03).

### 9.93 Pulsanti sbiaditi senza risorse; fumo dal centro e dalle case blu

Richiesta dell'autore, in due parti.

**Pulsanti senza risorse.** I pulsanti di costruzione (i 10 del civile) e di
produzione (civile al centro; guerriero, picchiere, arciere in caserma;
cavaliere in stalla; ariete e catapulta nel castello) che costano piu'
delle risorse che ci sono si disegnano molto piu' trasparenti: cerchio e
icona per `POOR_ALPHA` = 0,3 (cerchio 0,69 -> ~0,21, icona 1 -> 0,3; col
puntatore sopra lo stesso, il cerchio evidenziato 0,99 -> ~0,3). Appena le
risorse bastano tornano come gli altri, a ogni fotogramma (buildings.js
`buttonAlpha`, usato da civilians.js `ominoPanel`, dal centro, da
production.js). Conta solo il costo in cibo, legno, oro e pietra: la
popolazione no (un pulsante con la popolazione piena resta normale, il
clic continua a far lampeggiare `pop_blink`). Il pulsante "Annulla" non
cambia. Visto negli screenshot: civile con 60 legno e 0 pietra, pieni solo
casa (50) e mulino (60); caserma con 60 cibo, 40 oro, 50 legno, pieno solo
il picchiere; centro con 40 cibo, civile sbiadito; con le risorse tornano
tutti pieni.

**Fumo dai camini.** In §9.84 il fumo usciva solo dalle case del giocatore
(rosse) con camino. Guardati tutti gli sprite degli edifici, rossi e blu:
hanno un camino anche il centro citta' (cc_spr) e quello nemico (cc_b),
nello stesso punto (-138, -141 dall'origine), e due stili delle case
nemiche blu, c2b (-6, -126) e c6b (58, -92); le altre case blu hanno il
tetto piatto, e caserme, stalle, magazzini, mulini, chiese, castelli e
torri non hanno camini (le torrette del castello non lo sono). La tabella
`CHIMNEY` (ambience.js) ora e' per sprite e copre casa, enemy_house,
centro ed enemy_centro, con le stesse regole: uno sbuffo ogni 50-70
passi, niente dagli edifici in fiamme, solo sullo schermo; quelli nemici
solo una volta visti (visible, come l'edificio stesso nella nebbia).

`ambience.mjs`, voce "camini": oltre alle 6 case del giocatore, le 6 case
nemiche e i due centri; il fumo nasce entro 2 px dalla cima del camino in
c1s, c2s, c4s, c6s, c2b, c6b, cc_spr e cc_b, mai dalle case senza camino,
e una casa nemica c6b non ancora vista resta senza fumo per 150 passi.
Passano i test unitari, `ambience.mjs` (una prima esecuzione e' caduta
sulla voce "graduale" della pioggia, che dipende dal caso: prima goccia 16
passi dopo il cielo coperto, rapporto 0,16 contro il tetto di 0,15; la
seconda passa; il codice della pioggia non e' toccato) e `soak.mjs`.
Versione 0.2605.

### 9.94 Scintille delle miniere in particelle; erba meno agitata col vento

Richiesta dell'autore, in tre parti.

**Scintille al posto di miniera_blink.** Il luccichio dell'originale era lo
sprite miniera_blink (una stella bianca di 57 x 54 px) che compariva in un
punto a caso entro 60 x 40 px dall'origine della miniera e sfumava in 50
passi, disegnato nel Draw End. Ora sono particelle (ambience.js,
`mineSparkles`): stelle a quattro punte con un alone, dal bianco caldo
all'oro, additive, che si accendono e si spengono in 34-54 passi girando un
poco, una ogni ~18 passi per miniera, piu' un granello dorato che sale ogni
~34. Nascono solo sulle venature gialle dello sprite: 14 punti misurati
sull'immagine (`VEINS`, dall'origine; tutte le miniere delle room hanno
scala 1). Per la stella c'e' una forma nuova delle particelle, `star`
(`__pt_star`, tools/05_atlas.py: quattro raggi affilati, quattro diagonali
piu' corti e deboli, un nucleo), perche' il bagliore `flare` era troppo
morbido e a quella misura si vedeva come un puntino. Un sistema per miniera
alla sua depth (le unita' davanti la coprono), categoria "fire" ("Fiamme e
scintille"); anche nel menu. Lo sprite miniera_blink non e' piu' usato
(resta nell'atlas, che esclude solo gli sprite delle maschere), ne'
i campi blinkfade/blinkx/blinky della miniera (nei salvataggi di prima
restano e non servono).

**Solo da una miniera del tutto scoperta.** Il motivo del difetto: il Draw
End delle istanze sotto depth -1 si disegna dopo la nebbia (World.draw: il
manager, con la nebbia, passa alla sua depth fra i Draw End), quindi la
stella stava sopra il nero. E la miniera diventa "vista" (visible) appena un
alleato e' a 400 px dal suo riquadro, non quando la nebbia la scopre: a
inizio tutorial (match) la prima miniera e' gia' visible ma solo 15 delle
96 celle della nebbia sotto il suo sprite sono scoperte (68 ancora nere), e
il luccichio si vedeva. Ora le scintille nascono solo se la miniera e'
visible e tutte le celle della scoperta sotto il suo sprite (172 x 117 px)
sono piene (`mineSeen`); senza nebbia sempre. Le particelle si disegnano
sotto la nebbia: in una zona gia' scoperta ma fuori vista si vedono
attenuate come il resto.

**Erba meno agitata.** Col vento forte (§9.90) l'oscillazione di erba,
fiori e spighe era 1,6 volte piu' ampia e 1,6 volte piu' rapida, piegata di
0,75 volte l'ampiezza: ora 1,3, 1,3 e 0,45 (particles.js `SWAY_*`); col
vento minimo come prima. Sull'erba di prova: ampiezza 5,2 gradi invece di
6,4, piegata di 1,8 invece di 3.

`ambience.mjs`: voce nuova "miniere" (la miniera piu' lontana dagli
alleati, visible: con la scoperta nulla e con meta' riquadro scoperto
nessuna scintilla in 200 passi; tutta scoperta, 39 nascite in 300 passi,
tutte entro 3,5 px da un punto delle venature) e "vento" coi valori nuovi.
Visto negli screenshot: a inizio tutorial la prima miniera, mezza nel nero,
senza scintille; tutta scoperta, le stelline sulle venature. Passano i
test unitari, `ambience.mjs`, `resources.mjs`, `soak.mjs` e `saves.mjs`
(match, lvl01, lvl02). Stessa PR di §9.93: versione 0.2605.

### 9.95 Le pale dei mulini girano piu' in fretta col vento

Richiesta dell'autore: col vento forte (§9.90) le pale dei mulini
dovrebbero girare piu' in fretta, non troppo ma in modo che si veda. Prima
giravano sempre a 0,3 fotogrammi a passo [C, barn Create:
action_sprite_set(mul1, 0, 0.3); il mulino nemico mub uguale, §9.48]. Ora
(ambience.js `millSpeed`, a ogni passo in ambienceStep) da 0,3 col vento
minimo a 0,34 col massimo (`MILL_SPEED`; prima prova 0,45, ridotta
dall'autore), in proporzione al vento della partita; col vento medio (e
nei salvataggi di prima) 0,32.
Vale per il mulino alleato (sprite mul1) e per quello nemico (mub), non
per il deposito del cibo invisibile del centro (cc_barn). Solo estetico.

`ambience.mjs`, voce "vento": un mulino alleato e uno nemico a 0,3
fotogrammi a passo col vento a 0 e a 0,34 col vento a 1. Passano i test
unitari, `ambience.mjs`, `soak.mjs` e `saves.mjs` (match, lvl01, lvl02).
Stessa PR di §9.93: versione 0.2605.

### 9.96 I nemici che si fanno da parte non vagano piu'

Segnalazione dell'autore: dopo la PR di §9.93-9.95 la CI falliva sempre in
`fireorder.mjs`, caso "enemy casa front": un cavaliere nemico fermo si
spostava di 225 px, oltre il limite di 200 (HOLD).

*Perche' proprio allora.* La prova fissa il seme di Math.random (5). Il
vecchio luccichio delle miniere (§9.94) pescava due numeri a caso ogni 50
passi per miniera; tolto, la sequenza dei numeri a caso della partita e'
un'altra. Misurato su 36 semi, prima di §9.94 il caso superava i 200 px con
6 semi (fino a 361 px), dopo con 7: lo stesso difetto, il seme 5 era solo
capitato fra quelli buoni.

*La causa.* Chi va a dare fuoco fa spostare di lato le unita' ferme della
sua parte (§9.31, pathing.js stepAside): il cavaliere veniva mandato a
79 px, in un posto scelto libero "passando sopra i compagni". Ma nel passo
dei nemici, se la meta e' occupata (anche solo da un compagno che ci passa
sopra), la meta si sposta a caso di +-20 px, e di +-30 se c'e' un solido
[C]: a ogni passo in cui i fanti gli passavano accanto, una passeggiata a
caso. Da (806, 4437) la meta e' andata fino a (896, 4333), 216 px dalla
partenza. Gli alleati questo non lo fanno sul posto di una formazione o di
uno spostamento di lato (ranged.js, civilians.js: `onFormationSlot`); i
nemici si'.

*Ora* (enemies.js) i nemici fanno come gli alleati: sul posto in cui si
fanno da parte (o vicino al bersaglio, goNear) la meta non si sposta a
caso; se a meno di 10 px il posto e' occupato da un compagno, arrivano
dove sono invece di spingerlo (`slotBlocked`). Vale per guerrieri,
picchieri, cavalieri e arcieri nemici.

Misurato su 36 semi: il caso "enemy casa front" ora da' 151 px con tutti
(prima da 94 a 361 px, e da 92 a 315 dopo §9.94), nessuna unita' dentro un
edificio. Versione 0.2606.

### 9.97 Fiumi, strade e ponti disegnati come linee

Domanda dell'autore: un sistema di fiumi e strade piu' leggero degli sprite
dipinti (i soli fiumi, fiume1-4, fiume2_2, fiume2_3, fiume_2_1 e
Fiume_Completo, sono ~660 KB da scaricare e ~41 MB di memoria video).
Proposte: tileset isometrico (sconsigliato: decine di raccordi, effetto
griglia), sprite ruotati (in isometria la rotazione rompe la prospettiva),
linee disegnate in Tiled e stese dal gioco. Scelte le linee, provate prima
per i fiumi, poi (richiesta dell'autore) ostacolo, pioggia, larghezza da
Tiled, ponti, strade e antialiasing. Tutto in game/src/rivers.js, cotto nei
blocchi del suolo (ground.js: prima le strade, poi i fiumi, poi i ponti),
sopra strade e prati dipinti: a ogni fotogramma costa come prima. Le
texture (nuovi/fiumi/, tools/15_fiumi.py, dai dipinti dell'autore) sono
16 KB in WebP in tutto. Le mappe gia' fatte restano come sono (richiesta
dell'autore: il fiume dipinto e il ponte del livello 4 non si toccano).

**Fiumi.** In Tiled una polilinea nel livello `fiumi` (classe `fiume`,
proprieta' `larghezza`, predefinita 150 px, e `larghezza_fine`, la
larghezza all'ultimo punto). Il gioco ammorbidisce la linea (Catmull-Rom,
un punto ogni 10 px) e ci stende una texture d'acqua di 256x192 px
(acqua.png, 6,8 KB: ritagliata dall'acqua di Fiume_Completo e resa
ripetibile), fissata al mondo (non si deforma nelle curve). Le rive si
calcolano sul terreno "steso" (y / 0,62) e si schiacciano come il suolo:
dove il fiume scorre in orizzontale e' piu' stretto. Stile dei fiumi
dipinti: la riva lontana (che guarda in su) mostra la parete della sponda,
una fascia d'acqua piu' scura alta fino a 16 px fra due linee nere; la riva
vicina una linea sola; le linee a inchiostro di spessore variabile
(2,2 +- 0,9 px); la larghezza varia del +-12% lungo il fiume. Nelle curve
strette il lato interno si stringe (al piu' il 55% del raggio, poi
ammorbidito): prima si accavallava e faceva le punte; resta un po'
spigoloso, nello stile (parere dell'autore). Un'estremita' dentro la room
finisce a punta arrotondata negli ultimi 120 px, come una sorgente.

**Antialiasing** (richiesta dell'autore: le linee nere nette staccavano dai
personaggi, che hanno i contorni filtrati). Ogni tratto d'inchiostro ha un
nucleo pieno fino a mezzo pixel dal bordo e una frangia di un pixel che va
a trasparente (colori per vertice). Solo nella cottura del suolo, una
volta per blocco.

**Acqua ed effetti.** Le celle da 8 px dentro le rive (riverCells) entrano
nella mappa dell'acqua (effects.js waterMap), un "pezzo" per tratto di 20
punti con la sua orientazione: pioggia (anelli), riflessi, increspature e
schiuma funzionano come sui fiumi dipinti, in un solo sistema di
particelle per tipo, sotto tutte le istanze.

**Ostacolo.** Le celle della griglia dei percorsi che toccano l'acqua sono
chiuse (pathing.js initCost) e restano chiuse se accanto sparisce un
edificio. Le collisioni (world placeFree, placeFreeExcept, placeEmpty,
`terrainBlocks`): le unita' contano i piedi (10 x 5 px attorno al punto in
cui toccano terra; col riquadro intero un'unita' sulla riva "toccava"
l'acqua, e un nemico che tocca qualcosa avanza dritto senza guardare:
enemies.js pushThrough, ora fermo davanti all'acqua), i fantasmi degli
edifici tutta la maschera (rossi sul fiume).

**Ponti.** Un rettangolo (anche ruotato) di classe `ponte` nel livello
`fiumi`, di traverso sul fiume: il lato lungo e' quello che attraversa.
Sotto il ponte non c'e' acqua (si passa, non ci piove). Disegno, sulla
grana di carta dell'acqua in grigio (carta.png) colorata come il ponte
dipinto (Ponte_5): piano grigio-viola, parapetti in pietra chiara larghi
8 px, inchiostro; il fianco che si vede (il lato lungo che guarda in giu',
alto 20 px per quanto guarda in giu': un ponte da nord a sud non ne mostra)
in pietra con 1-3 archi sull'acqua in ombra; l'ombra a destra in basso come
quella degli edifici. Il ponte dipinto non si usa: ha un orientamento solo.

**Strade.** Osservazione dell'autore: il sentiero dei dipinti e' un
pennello di Photoshop che ripete la stessa particella con una gamma di
colori. Quindi sei sassolini presi singoli da strada4 (sassi.png: macchie
isolate di 45-90 px, piene come un'ellisse, senza buchi; in grigio, il
colore lo da' il gioco) timbrati lungo la linea, a campana attorno al
centro, dai piu' scuri ai piu' chiari. *Misura* (segnalazione dell'autore:
i sassi dei dipinti sono piu' piccoli): i timbri erano i sassolini singoli
piu' grandi (area 34-100 px), nei dipinti la mediana e' 12-14 px (10% sotto
5, 10% sopra 42-52, strada4, strada5, traccia1; le strade dipinte sono a
scala 1 nelle mappe). Ora l'area di ogni sassolino segue quella
distribuzione, e quanti ne servono perche' coprano come il dipinto (74 e 47
px per px di lunghezza) l'ha detto una simulazione coi timbri veri: 4,51 e
2,05 sassi per px di lunghezza a 115 px di larghezza. I timbri sono gia'
rimpiccioliti in cinque misure (una riga ciascuna, 0,3-1,15, con un buon
filtro): il gioco usa la riga piu' vicina quasi a scala 1, rimpiccioliti al
volo venivano sfocati. Due strade, come negli sprite (richiesta
dell'autore), classi del livello `strade`: `strada1` la marcata
(strada4-8: dal grigio-verde 134,130,108 al beige 200,195,160, scarto tipo
0,3 della larghezza, misurati sul dipinto), `strada2` la secondaria
(traccia1-4: un solo grigio-verde intorno a 155,159,130, alpha 0,85, piu'
sparsa). Proprieta' `larghezza` (predefinita 110),
`larghezza_fine` (richiesta dell'autore, come per i fiumi: la larghezza
all'ultimo punto, la strada si allarga o si stringe piano; dove e' piu'
stretta ha meno sassi, la densita' per area resta quella del dipinto) e
`densita` (1 come negli sprite). Alle estremita' dentro la room si
diradano. Non sono ostacoli. I numeri a caso di sassi e onde vengono da un
generatore proprio (mulberry32) col seme dalla linea: la stessa strada e'
sempre uguale e Math.random, della partita, non si tocca.

**Tiled.** tools/12_tiled_import.py legge i livelli `strade` e `fiumi`
(polilinee e rettangoli `ponte`) e scrive nello scenario `roads`, `rivers`
e `bridges`, solo se ce ne sono (gli scenari di prima restano uguali);
l'anteprima PNG ne disegna la forma; tools/07_scene.py li passa alla room.
Il kit ha i livelli, le classi coi valori predefiniti (fiume, strada1,
strada2, ponte) e le istruzioni nel LEGGIMI. Il renderer ha un quad con le
coordinate di texture per angolo (gl.js quadUV).

`rivers.mjs` (nuova, anche in CI): un fiume com'esce dall'import (180 ->
100 px) che finisce a punta nella vista: 139 celle chiuse; un guerriero
mandato sull'altra riva gira attorno alla punta e arriva in 337 passi
senza mai i piedi nell'acqua; il fantasma della casa e' rosso sull'acqua e
libero fuori; con la pioggia anelli e riflessi sul fiume; nessuna unita'
coi piedi nell'acqua. Poi un fiume attraverso tutta la vista con una
strada1 che lo passa su un ponte e una strada2: sotto il ponte niente
acqua, un guerriero passa sul ponte (scostato al piu' 10 px, 178 passi)
senza i piedi nell'acqua, 6924 sassi nella strada1 e 1225 nella strada2;
una strada da 60 a 200 px ha i sassi sparsi 2,2 volte di piu' verso la
fine (dove e' larga 2,35 volte).
Visto negli screenshot (fiume, pioggia, ponte di traverso con gli archi,
ponte da nord a sud, strade). Senza linee nulla cambia: test unitari,
`soak.mjs`, `saves.mjs`, `bridge.mjs`. Nota: nella prova un guerriero
fermo proprio all'uscita del ponte faceva arrendere un compagno a 130 px
dalla meta (movimento di sempre, moveStalled; ponti stretti da tenere
d'occhio). Stessa PR di §9.96: versione 0.2606.

### 9.98 Anteprima di fiumi e strade in Tiled (estensione del kit)

Domanda dell'autore: in Tiled si puo' vedere la larghezza delle polilinee?
No: Tiled le disegna tutte sottili (lo spessore e' una preferenza unica, non
una proprieta' dell'oggetto). Quindi un'estensione di Tiled nel kit
(tools/tiled/anteprima.mjs, copiata da tools/11_tiled_kit.py in
`extensions/` accanto a 535.tiled-project, che indica gia' quella cartella):
Tiled la carica da sola aprendo il progetto (da Tiled 1.8; con la sola
mappa aperta no). Usa il codice del gioco (game/src/rivers.js, copiato come
rivers.mjs): le sagome sono quelle della partita. Per questo rivers.js non
usa piu' `??` (sintassi recente: il motore JavaScript di Tiled potrebbe non
averla).

Nel menu *Map*: **Anteprima larghezze (fiumi e strade)**, Ctrl+Shift+L,
rifa' il livello `anteprima` (bloccato, semitrasparente, sotto `strade`) con
le rive dei fiumi (riverGeometry: larghezza, larghezza_fine, curve strette,
punte) e la fascia delle strade (roadOutline, nuova: +-0,5 della larghezza,
dove cadono quasi tutti i sassolini), colorate con le classi
anteprima_fiume, anteprima_strada1, anteprima_strada2 del progetto; **Anteprima
a ogni salvataggio** (acceso) la rifa' quando si salva. Legge anche le
polilinee ruotate e nei gruppi di livelli; i rettangoli dei ponti si vedono
gia'. L'import (tools/12_tiled_import.py) ignora il livello `anteprima`.

Tiled non si puo' far girare qui: provata in node con le API di Tiled finte
(game/test/tiled.test.mjs: livello anteprima bloccato sotto strade, classi,
rive del fiume entro 3 px da riverGeometry, strada da 80 a 160 px come
roadOutline, fiume ruotato di 90 gradi verso il basso, rifatta senza
raddoppiare). Passano i test unitari (64), `rivers.mjs`, il `--check` del
kit e gli scenari invariati. Da confermare in Tiled dall'autore. Stessa PR
di §9.96: versione 0.2606.

*Prova della pioggia graduale (`ambience.mjs`, §9.91).* In CI e' caduta su
un commit che toccava solo il LEGGIMI (inizioSuPieno 0,152 contro il tetto
0,15). La causa: le gocce dei "primi 60 passi" si contavano dalla prima
goccia, che arriva a caso (qui al passo 402, col cielo coperto e la salita
partita al 386): la finestra cadeva su gocce gia' piu' fitte, media del
livello 0,155 invece di 0,10. Ora si contano dall'inizio della salita (il
cielo coperto): tre esecuzioni 0,098, 0,102, 0,108. Il gioco non cambia.

### 9.99 Macchie di un altro sfondo (livello macchie)

Richiesta dell'autore: stendere a macchie, sopra lo sfondo e sotto le
strade, la texture della citta' (city2, il selciato, lo sfondo del livello
1). In Tiled i livelli immagine non si dipingono e i livelli di tile non li
legge l'import: quindi aree, come i boschi. Nel livello nuovo `macchie` (il
primo dal basso) rettangoli, ellissi o poligoni di classe `macchia`, con
`sfondo` (uno degli sfondi del kit: city2 predefinito, city1, green1),
`sfumatura` (px, 40) e `opacita` (1). tools/12_tiled_import.py li scrive
nello scenario (`patches`; uno sfondo che non c'e' da' un avviso e torna a
city2), l'anteprima PNG li colora col colore medio dello sfondo, il kit ha
livello, classe e istruzioni.

Nel gioco (rivers.js `patchGeometry`, `drawPatch`): il bordo con un punto
ogni 16 px, diviso in triangoli (a orecchie: anche le forme concave); la
texture e' lo sfondo ripetuto con le coordinate del mondo, come lo sfondo
della mappa (due macchie vicine si raccordano); il bordo sfuma verso fuori,
largo `sfumatura` x 0,4-1,6 lungo il contorno (onda liscia, sempre uguale),
cosi' la forma disegnata non si vede. Si cuoce nei blocchi del suolo subito
sopra lo sfondo, prima di chiazze e strade dipinte, strade, fiumi e ponti.
Lo sfondo di una macchia si carica con la room (anche se la room ne usa un
altro). Non sono ostacoli.

Prove: `patches.test.mjs` (nuova: i triangoli di una U coprono la sua area
nei due versi; sfumatura fuori dal bordo, 0,4-1,6 volte), `rivers.mjs`
(voce "macchie": city2 caricato al volo in match, la macchia nel suo
blocco, 98 triangoli), import di prova (rettangolo ruotato, ellisse con
city1 e opacita' 0,7, poligono con uno sfondo sbagliato), screenshot
(selciato concavo e pietra liscia sul prato, chiazze dipinte e strada
sopra), test unitari (66), `soak.mjs`, `saves.mjs`, `--check` del kit e
scenari invariati. Stessa PR di §9.96: versione 0.2606.

### 9.100 Livello 6: la mappa, i ponti dipinti, le macchie di citta'

L'autore ha caricato su `main` la mappa `mappe/lvl06.tmx` (7000 x 6000) e
tre sprite (`ponte_dx`, `ponte_dx2` e la balaustra `ponte_dx_bala`) con le
aree percorribili dei due ponti; portati sul branch della PR (merge). Nella
mappa: fiumi e strade come polilinee coi loro valori, le aree da riempire
col selciato del livello 1 (classe `citt2`, nel livello strade), i ponti
come tre punti (`pontedx`, `pontedx2`, `ponte dx2 specchiato`).

- *Aree*: la classe `citt2` non e' quella delle macchie: le 8 aree sono
  passate a classe `macchia` (sfondo city2, il predefinito) nel livello
  nuovo `macchie` (nella mappa, gli stessi poligoni).
- *Ponti dipinti*: maschere rinominate `ponte_dx_mask.png`,
  `ponte_dx2_mask.png` (gli spazi nel nome davano noia agli script);
  sprite e oggetti in nuovi.json: origine nel baricentro dell'area
  percorribile (il punto di Tiled e' il centro del piano), la balaustra
  con la stessa origine e a fette di 16 px (chi le passa dietro le resta
  dietro, anche specchiata). L'import trasforma i punti col nome dello
  sprite senza trattino in ponti (`specchiato` nel nome: scala x -1). Nel
  gioco (rivers.js `PAINTED_BRIDGES`, `BRIDGE_RAILS`; ground.js) i ponti si
  cuociono nel suolo dopo strade, fiumi e ponti a linee; l'acqua sotto la
  loro maschera non c'e' (si passa, non ci piove); il ponte con la
  balaustra la crea, specchiata come lui. L'anteprima PNG dell'import li
  disegna con lo sprite nuovo.
- `lvl06` si apre con `?room=lvl06` (non ancora nella campagna: niente
  regia), ed e' nella prova di stabilita' della CI.

*Come si legano al fiume* (screenshot a scala 1): il ponte centrale
(`ponte_dx`, campata in diagonale, su un tratto quasi orizzontale) bene;
quello a destra (`ponte_dx2`, archi verso sud, su un tratto da nord a sud)
nella direzione giusta, ma il fiume (93 px) e' molto piu' stretto del ponte
(~360): l'acqua passa sotto un arco solo, gli altri stanno sul prato, e
l'interno degli archi e' dipinto pieno (l'acqua non si vede attraverso).
Quello a sinistra (`ponte_dx2` specchiato) resta quasi parallelo al fiume
(che li' sale di ~18 gradi verso destra): la facciata con gli archi finisce
sul prato. Con `ponte_dx` specchiato si lega bene (provato in gioco):
scelto dall'autore, il punto si chiama ora `pontedx specchiato`. Gli archi
di `ponte_dx2` l'autore li rifara' semitrasparenti (sprite aggiornati da
SketchUp).

*La citta' invisibile* (segnalazione dell'autore): i 110 oggetti della
citta' (case, palazzi, anfiteatro, templi: gli ocr_*) erano nella partita
ma senza sprite, perche' il loro gruppo d'atlas ("citta") si caricava solo
per i livelli 1 e 2 (TIERS). Ora lvl06 lo carica e, in ogni room, app.js
carica da se' i gruppi degli sprite degli oggetti della mappa che TIERS non
prevede (non ricapita coi livelli nuovi).

*Fiume piu' largo, verso fuori* (richiesta dell'autore: +50 px, c'e'
margine verso l'esterno della citta'). Il fiume principale (id 5 nella
mappa, 50 punti, gira attorno alla citta') da larghezza 100 a 150, e la sua
linea spostata di 25 px (sul terreno steso) lontano dal centro della
citta' (2751, 3458, il baricentro dei 110 oggetti della citta'): la riva
lato citta' resta dov'era. Fatto nella mappa (lvl06.tmx), con uno script.

*Le foci* (segnalazione dell'autore: fra i due ponti a destra "si vede
l'attacco" del secondo fiume). rivers.js `riverJoin`: dove un fiume sbocca
in un altro le rive di ciascuno (inchiostro e parete) dentro l'acqua
dell'altro non si disegnano, e l'estremita' che finisce dentro un altro
fiume non si stringe a punta: la foce si apre. Prova `riverjoin.test.mjs`
(diramazione larga alla foce, rive nascoste solo li').

Prove: screenshot della mappa intera (senza nebbia, notte e interfaccia) e
dei ponti a scala 1, `soak.mjs` (lvl06, 1500 passi, nessun errore), test
unitari, `--check` del kit e scenari delle altre mappe invariati. Stessa PR
di §9.96: versione 0.2606.

### 9.101 Livello 6: la regia

Progetto concordato con l'autore, poi scritto quando sono arrivati la mappa
coi giri delle pattuglie e il percorso della colonna, e gli sprite di
`ponte_dx2` con gli archi semitrasparenti (`ponte_dx2_trasp`). Sotto, il
progetto; in fondo, com'e' fatto e la taratura.

Storia: la citta' e' stata devastata, le difese vanno ricostruite e
potenziate prima di un grande attacco. La guarnigione e' caduta e
l'armeria e' stata saccheggiata e bruciata: niente spade ne' armature, ma i
cittadini sono una milizia di arcieri (gli archi si fanno). Quindi le due
caserme della mappa addestrano solo arcieri; nascosti i pulsanti per
costruire caserme e stalle.

- *Inizio*: 400 cibo, 400 legno, 500 oro, 200 pietra; miniere d'oro e cave
  di pietra nella mappa (l'autore conferma che ci sono).
- *Fase 1, pattuglie*: i gruppi blu fra i fiumi fanno giri (polilinee
  dell'autore nel livello regia), non attaccano gli edifici, inseguono le
  unita' alleate vicine e tornano al giro. Obiettivo a schermo "Sconfiggi le
  pattuglie (0/N)". Le torri della citta' (tutte quelle della mappa, 21) ci
  sono ma non sono del giocatore.
- *Fase 2, preparazione*: 20 minuti, con conto alla rovescia, da quando le
  pattuglie sono sconfitte. Torri al 10-40% della vita (a caso, torre per
  torre): si possono riparare e, superato il 60%, passano al giocatore col
  messaggio "Torre recuperata: ora puoi presidiarla con gli arcieri" (scelta
  dell'autore, invece di "sotto il 75% un arciere solo": confondeva).
  Riparare costa 1 pietra per punto vita: al 60% servono 66-165 pietre per
  torre (~115 in media, ~2400 tutte): si sceglie quali. Rinforzi di fanteria
  (piccoli) ogni 3 minuti; dalla base nemica in alto 4-5 fanti (niente
  cavalleria) ogni 3 minuti verso la citta' dal ponte di sinistra (la base si
  puo' distruggere, ma si difende; non e' l'obiettivo).
- *Fase 3, la colonna*: ~50 fanti e arcieri dalla zona del teatro romano al
  ponte di destra, lungo un percorso fissato (polilinea dell'autore): non
  attaccano gli edifici, solo le unita'. Contatore "Passati: n/5": al sesto
  si perde; fermati tutti, si vince.

Numeri del gioco che contano (per la taratura): una torre tira solo con
arcieri di presidio, una freccia ogni 50 passi (0,8 s) per arciere, al
massimo 2, fino a 600 px (in campo 400); una freccia toglie 6; guerriero
nemico 75 di vita (13 frecce), picchiere 60 e arciere 55 (10): la colonna da
50 sono ~550 frecce. Le torri sono intoccabili per la colonna: chi e' in
torre non rischia, chi va in campo si'. Il limite vero sono gli arcieri
(40 legno e 55 oro l'uno: 500 oro = 9). Da fare: una prova automatica che
manda la colonna contro 0, 5, 10, 20 torri presidiate e conta quanti
passano, per tarare colonna, intervalli e tempi.

**Com'e' fatto** (`levels.js`, `enemyManagerLv6`, numeri in `LV6`):

- *Percorsi della regia* (Tiled, livello `regia`): polilinee o poligoni di
  classe o nome `colonna` / `pattuglia` (anche `pattuglia2`, `pattuglia 3`):
  `12_tiled_import.py` li mette nello scenario (`paths`: nome, punti,
  `loop` per i poligoni, i giri), `07_scene.py` nella room, il gioco in
  `world.routes`. LEGGIMI del kit aggiornato.
- *Pattuglie*: i nemici a meno di 300 px da una tappa di un giro sono di
  quella pattuglia (14 in 3 gruppi); gli altri (la base) difendono dove
  sono. Camminano di tappa in tappa col campo di flusso (come la strada del
  livello 4, §9.57), inseguono gli alleati a tiro e, finito l'inseguimento,
  riprendono il giro dalla loro tappa; `noFire`: non danno fuoco (enemies.js).
- *Torri* (`i.locked`): 1 = della citta', 2 = si ripara (dalla fase 1), 0 =
  del giocatore (oltre il 60%, con il messaggio; se un dialogo e' aperto il
  messaggio aspetta). Chiuse: si selezionano soltanto (barra grigia, o
  arancione da riparare), niente presidio, non vedono (fog.js), i nemici
  vicini non si scoprono (`seenNear`, al posto di `nearWithin` nelle
  visibilita' dei nemici), nella minimappa sono grigie. Vita a caso fra il
  10 e il 40% dall'inizio. Le torri restano oggetti `torre` veri: vita,
  danni, riparazione e presidio sono quelli di sempre.
- *Solo arcieri*: `production.js ONLY_UNITS` (la caserma ha solo il pulsante
  dell'arciere), `buildings.js NO_BUILD` (niente pulsanti ne' tasti di
  caserma e stalla). Le due caserme del giocatore le ho messe io nella mappa
  (5050, 1050 e 5450, 1650), provvisorie: l'autore le sposta dove vuole.
- *Fase 1*: 20 minuti; ogni 3 minuti 4 fanti (2 guerrieri, 2 picchieri)
  davanti al centro del giocatore, e un'incursione di 4 o 5 fanti (a turno)
  dalle caserme nemiche: passano dal ponte di sinistra (tappe) e vanno
  all'alleato piu' vicino all'uscita del ponte se e' in citta' (2500 px),
  se no in mezzo alla citta' ad aspettare (la base del giocatore e' dalla
  parte della base nemica: senza questo, passato il ponte, tornavano
  indietro verso di lei). La regia economica (ECO.lvl06) lavora e si
  difende, non attacca.
- *Fase 2*: la colonna (10 file da 5: guerriero, picchiere, arciere,
  picchiere, guerriero), una fila ogni 45 passi dal bordo sinistro (il
  percorso tagliato a 60 px dai bordi), al passo 0,6 (`pace`: chi insegue va
  al passo di sempre), `noFire`. Oltre x 6250 (passato il ponte di destra)
  un soldato e' passato ed esce; al sesto la sconfitta ("La colonna nemica
  ha sfondato al ponte a est"), finiti tutti la vittoria.
- Obiettivi a schermo per fase, dialoghi `dialogo_6_0`...`6_6` (6 lingue),
  testo della vittoria e codice per il livello 7 (0 7 3 6 0, quello del
  lucchetto). Il livello 6 entra nella campagna ("One hundred towers" /
  "Cento torri" era gia' il suo titolo nell'originale) e nei salvataggi.
  La storia del menu, su richiesta dell'autore, riprende la fine del
  livello 5 (la citta' degli invasori caduta) e chiama la citta' "la Citta'
  delle Cento Torri". Il segnalino sulla mappa della campagna e' lo
  sprite dell'autore (`cap6` -> `cap_l6`, lato 120 come il 5) dove l'ha
  indicato lui (a ovest del ponte del 4, sopra il 5: menu.js L6_MARK),
  con la freccia dal 5.

**Taratura** (la colonna contro le N torri piu' vicine al suo percorso,
presidiate da 2 arcieri, senza altre unita'; soldati passati su 50):

| torri | passo 1 | passo 0,5 | passo 0,6 |
|---|---|---|---|
| 0 | 50 | 50 | — |
| 5 | 44 | 28 | 37 |
| 8 | — | — | 19 |
| 10 | 31 | 0 | 12 |
| 12 | — | — | 5 |
| 15 | — | 0 | 0 |
| 20 | 24 | 0 | — |

Al passo normale la colonna traversa la mappa in ~45 s e le torri non
bastano mai (20 torri: ne passano 24); a meta' passo 10 torri fermano
tutto. Scelto 0,6: con le sole torri ne servono una dozzina ben messe
(~1400 pietre di riparazioni e 24 arcieri), con meno servono anche i
soldati in campo; le torri restano il grosso della difesa. Da rivedere
giocando: passo, file, intervallo dei rinforzi.

Prova: `game/test/browser/lvl06.mjs` (partenza, solo arcieri, torri chiuse,
pattuglie in giro e reazione, fase 1, torre recuperata e presidiata,
rinforzi e incursione dal ponte di sinistra, colonna, sconfitta al sesto,
taratura con 15 e 5 torri), in CI; `saves.mjs` anche col livello 6.

### 9.102 Nuvole, segnalino del 6, civili al cantiere, obiettivi, livello 5

Richieste e segnalazioni dell'autore (3 novembre 2026), sei punti; il sesto
(il suono) e' una discussione, senza codice. Versione 0.2607 (§9.73).

**1. Nuvole** (ambience.js): il 60% piu' grandi (scala 2,72-3,68, era
1,7-2,3) e piu' trasparenti, al 60% dell'opacita' di prima (il nero pieno
della sagoma 0,24, era 0,4). Foto di confronto all'autore (prima, +50%,
+60%, la stessa inquadratura del livello 5): tenuto +60%, da rivedere con
lui. `ambience.mjs`: l'ombra nel pieno della sagoma ora vale 0,76.

**2. Segnalino del livello 6** sulla mappa della campagna: lato 100 (era 120,
nuovi.json `cap_l6`), il numero "6." 13 px piu' in basso (menu.js
`L6_LABEL`).

**3. Civili "in tilt" andando a costruire** (civilians.js, `edgeRescue`,
`aroundTarget`). Segnalazione: incontrando un altro personaggio in
movimento restavano bloccati finche' non si dava loro un altro ordine, anche
col passaggio libero. L'incrocio semplice (un civile e un soldato, anche in
un corridoio fra due case) non lo riproduceva; lo riproduce una prova piu'
affollata: 12 civili mandati a gruppi di 3 su quattro cantieri e 16 soldati
che attraversano la zona ogni 2 s. Col codice di prima, su 4 semi e 288
ordini da 40 s, 9 civili restavano per tutto il giro a 30-65 px dal bordo
del cantiere, girando in tondo sul posto (direzione +30 gradi a passo). Il
meccanismo, seguito passo per passo:
- vicino al cantiere (entro 300 px dalla meta) il civile va al suo posto sul
  bordo (toEdgeSpot: meleeSpot, §9.64) con mp_potential_step, cioe' dritto;
- un'unita' che passa gli occupa il posto o gli sta davanti: dopo 40 passi
  senza avvicinarsi meleeSpot gliene sceglie un altro, e con i posti vicini
  presi dai compagni al lavoro il nuovo e' dietro l'edificio;
- il percorso locale che dovrebbe aggirare l'ostacolo (melee.js `route`) usa
  i rettangoli delle istanze, e quello di un fiume vicino (migliaia di px)
  chiude tutto: niente percorso, si va dritti;
- dritto contro l'edificio mp_potential_step gira di 30 gradi a passo
  avanzando di 3 px: un cerchio di ~6 px, per sempre (l'unita' passata non
  c'entra piu'). Varianti viste: staccarsi da chi gli cammina addosso
  (separate) e tornarci, avanti e indietro; restare a 15-30 px dal bordo,
  oltre i 10 a cui si comincia.

Correzione: si guarda il progresso verso l'edificio (non verso il posto). Se
il civile non gli si avvicina di almeno 2 px da `EDGE_STUCK` passi (60), a
meno di `EDGE_NEAR` px (30) comincia a lavorare da dove e' (buildStep e la
riparazione accettano 30 px al posto di 10, solo in quel caso); piu' lontano
segue il campo verso l'edificio (`fieldTo`, §8.19: parte dalle celle libere
che lo toccano, sulla griglia dei costi, con edifici, fiumi e unita' ferme,
senza collisioni con le unita') fino alla cella libera piu' vicina accanto
all'edificio. E se la linea dritta verso il posto attraversa l'edificio,
col campo da subito. `edgeT` (l'edificio seguito) non si salva
(snapshot.js). Misurato con la stessa prova: 288 ordini su 288 arrivano a
lavorare (tempo medio uguale, ~270 passi), nessuno in tondo per tutto il
giro.

Prova nuova `game/test/browser/buildstuck.mjs` (nella CI): la prova
affollata, sei giri da 40 s col seme 7; tutti devono arrivare e nessuno
restare fermo con l'ordine di costruire. Col codice di prima: 2 civili non
arrivano (NON VA); col nuovo, 72 su 72. Passano anche sites, workers, idle,
deposit, mining, depot, settle, crowd, blocked, monastery, bridge, economy.

**4. Obiettivi completati** (endgame.js): niente piu' barra nera sopra il
testo; il testo in trasparenza (alpha 0,4) e una spunta verde (due tratti, a
10 px dalla fine dell'ultima riga). La larghezza del riquadro conta anche la
spunta.

**5. Livello 5.**
- *Finestre sotto il pannello delle risorse* (hints.js `keepClear`): i
  dialoghi e i suggerimenti che seguono un'unita' nascevano nel suo punto
  dello schermo, anche sotto le risorse o fuori dallo schermo (a 1280 x 720
  il primo dialogo del livello 5 usciva in basso a destra). Ora restano
  nello schermo e fuori dai riquadri dell'interfaccia (risorse e pulsanti in
  alto a sinistra, pausa e inattivi a destra, obiettivi, minimappa, a GAP
  px), ritratto compreso; se ne toccano uno vanno nel posto libero piu'
  vicino lungo i suoi bordi. Vale per tutti i livelli.
- *Le due torri vicino alle rovine* (4872, 2529 e 4580, 2129) tirano
  dall'inizio, con i loro 2 arcieri (prima di vedetta, §9.76: il giocatore
  si accampava li' fuori). Restano fuori dalla regia economica.
- *La sortita* (levels.js `lv5Sally`, numeri in `LV5`): un alleato a meno di
  500 px dalle mura o da una porta (`sallyR`) fa uscire i soldati del
  presidio della citta' (quelli della mappa, non della regia economica, che
  difendono gia' da soli entro 600 px, §9.50) entro 2000 px da lui: col
  flow field dei nemici verso di lui, poi combattono come sempre. Nessun
  alleato a 800 px dalle mura per 6 s: chi non combatte (nessun alleato a
  350 px) torna al suo posto, col campo dei soli ostacoli fissi (con quello
  di sempre i compagni fermi nel varco della porta la chiudevano e 4-5
  soldati restavano fuori, fermi: lo stesso di §9.82). Il dialogo delle mura
  (600 px) arriva poco prima.
- `lvl05.mjs`: la torre fuori dalle mura tira; la sortita (un guerriero a
  280 px dalla porta ovest per 15 s: escono 29 soldati, il piu' vicino gli
  arriva a contatto; andato via, tornano tutti ai loro posti); il cavaliere
  della prova verso le rovine ora e' invulnerabile (le torri lo uccidevano) e
  aspetta i 600 passi dell'acropoli.

**6. Il suono** (discussione con l'autore, nessuna decisione ancora): nel
progetto originale non c'e' audio (§0.6, cartella `sound` vuota), e la prima
uscita era stata decisa "senza audio" (§0.10, punto 4). Proposta: un modulo
audio piccolo (Web Audio, un AudioContext sbloccato al primo clic, volumi
musica ed effetti nel menu di pausa, salvati con le impostazioni), poi pochi
suoni che danno informazioni (attacco in corso fuori schermo, edificio
finito, unita' pronta, obiettivo completato, clic dell'interfaccia) prima
dell'ambiente (vento, pioggia, fuoco) e della musica; suoni con licenza
libera (CC0) o fatti per il gioco. Da decidere con l'autore.

### 9.103 Le luci nel tramonto non diventano verdi; livello 6 sbloccato

Segnalazione dell'autore (3 novembre 2026, stessa PR di §9.102, versione
0.2607): nel passaggio dal tramonto alla notte le luci che si accendono
(finestre, fuochi, torce) "vanno in sottrazione al rosso del tramonto" e
sembrano verdi.

**Perche'.** La notte e' un colore sottratto alla scena (fog.js
`skyColour`): nel tramonto e' il rosa di §9.84 (verde e blu tolti, il rosso
no) piu' la notte che sale. Le luci (lo sprite `arealight`, una macchia nera
sfumata disegnata sulla superficie della notte, come nell'originale [C])
azzeravano la sottrazione: dentro la luce tornavano i colori del giorno, e in
mezzo al rosso del tramonto una macchia "giorno" si legge verde. A notte
piena non si vedeva perche' fuori dalla luce c'e' solo la notte.

**Le due strade discusse.** Accendere le luci solo a notte completa: ma i
fuochi e le case in fiamme ci sono anche nel tramonto, e resterebbero
verdi. Oppure fare togliere alla luce solo "la notte": scelta questa.
- `skyTint` (fog.js): la parte del colore sottratto che non e' notte (il rosa
  del tramonto e il grigio del cielo coperto dalla pioggia, con gli stessi
  pesi di `skyColour`); a notte piena e di giorno sereno vale 0.
- La superficie della notte ora e' la maschera delle luci (bianca = buio,
  la macchia nera = luce piena; fogdraw.js), e lo shader `fog` (gl.js) compone
  `tinta + (notte - tinta) x maschera`: dentro la luce resta il rosa del
  tramonto, si toglie solo il buio. A notte piena e' identico a prima (tinta
  0: notte x maschera, come la superficie di prima).
- Foto di confronto all'autore (notte 0,2 e 0,45, le stesse case): prima
  chiazze verdastre attorno a torce e finestre, ora calde.
- Prova: `fog.test.mjs` (la tinta e' 0 a notte piena e di giorno, e' il rosa
  nel tramonto, mai piu' del colore di fuori); `ambience`, `burn`, `ui`
  passano.

**Livello 6 sbloccato** per le prove dell'autore: `progress.js UNLOCK_ALL = 6`
(provvisorio, da rimettere a 1 prima dell'uscita, "Cose da fare").

**Musica**: la fa l'autore, un pezzo alla volta; obiettivo contenere il peso
del gioco (§9.102, punto 6).

### 9.104 Fiaccole sulle case al posto delle finestre accese (prototipo)

Richiesta dell'autore (3 novembre 2026, stessa PR, versione 0.2607): le luci
notturne sulle case (§9.84, "finestre accese": una macchia di luce sul tetto
di due case su tre) sembravano tende o superfici traslucide con la luce
dentro. Proposta sua: fiaccole legate alla casa, su alcune case a caso,
distrutte con la casa.

**Com'e' fatto** (props.js `houseTorches`, `houseTorch`, `HOUSE_TORCH`;
fog.js `nightLights`):
- oggetto nuovo `fiaccola_casa` (nuovi.json), con lo sprite `torchspr_part`
  dell'originale (un bastone da torcia, mai usato nel gioco) a scala 0,7 e
  la fiamma a particelle della torcia del palo (TORCIA, categoria "fuoco");
- ogni casa (del giocatore e nemica, anche quelle finite in partita) decide
  una volta sola se averla: circa meta', scelte dall'id (sempre le stesse;
  `i.torch` 1 o 0, si salva). Il controllo gira ogni 30 passi;
- il punto d'appoggio sul muro e il verso, per ognuno dei 12 sprite delle
  case (c1s-c6s, c1b-c6b), misurati sugli sprite: sul muro di destra la
  fiaccola pende a destra, su quello di sinistra e' specchiata;
- legata alla casa (`t.casa`): sparisce con lei (distrutta, crollata),
  e' visibile solo se la casa lo e' (le case nemiche nella nebbia), si
  disegna subito sopra di lei;
- di giorno resta il bastone; la fiamma e la luce si accendono nella notte
  che scende (come facevano le finestre: da notte 0,3 a pieno a 0,8), solo
  nella view e non con la casa in fiamme;
- le finestre accese sono tolte: la luce ora e' quella della fiaccola.

Verificato: 20 case nuove, 10 con la fiaccola (piu' le 8 delle case della
mappa); di giorno nessuna particella, di notte si'; distrutte 3 case con la
fiaccola restano 15 fiaccole, nessuna senza casa. Salvataggi (match, lvl02,
lvl05, lvl06: ripristino identico), soak su tutte le room, burn, ambience,
prove unitarie: passano. Foto all'autore di giorno, al tramonto e di notte.

**Decisioni dell'autore** (dopo le foto): il bastone di giorno resta; la
meta' delle case va bene; la luce va bene cosi'. Lo sprite: per ora quello
dell'originale, l'autore prova a disegnarne uno nello stile del gioco. Per
cambiarlo basta lo sprite di `fiaccola_casa` in nuovi.json (con l'origine in
cima, dove nasce la fiamma); se cambia la lunghezza del bastone si
ritoccano `TORCH_SCALE` e `TORCH_TOP` in props.js (dalla base alla cima).

### 9.105 Gli alberi ondeggiano col vento (prototipo)

Richiesta dell'autore (3 novembre 2026, stessa PR): animare gli alberi; scelta
l'animazione calcolata dal gioco (strada "B") invece dei fotogrammi
preparati fuori, per il peso (8 alberi x 8 fotogrammi: ~10 MB di memoria
video e 1-2 MB da scaricare in piu').

**Com'e' fatto**
- sprites.js `drawSway`: l'albero si disegna in 6 strisce orizzontali sopra
  l'origine (la base del tronco), ognuna spostata in orizzontale di
  top x (altezza / 150)^2; sotto l'origine una striscia ferma. Le strisce
  sono parallelogrammi coi bordi in comune: niente cuciture, nessuna texture
  in piu', 7 quad per albero invece di 1. L'ombra disegnata nello sprite
  (a destra del tronco, all'altezza dell'origine e sotto) resta ferma.
- ambience.js `treeSway`, numeri in `TREE_SWAY`: un'oscillazione lenta
  (periodo da 5,5 s col vento minimo a 3,3 s col massimo) con una seconda
  piu' veloce e piccola; ampiezza in cima alla chioma da ~2 px (vento minimo)
  a ~5-6 px (massimo), 1,4 volte con la pioggia; la fase segue il punto della
  mappa, un'onda che passa verso ovest come il vento (raffiche che
  attraversano il bosco), piu' un po' di caso dall'id; una leggera
  inclinazione verso ovest. Il vento e' quello della partita (g.wind, §9.90).
- Lo scossone sotto l'ascia: a ogni colpo del taglialegna (civilians.js
  workTick, `albero.hitAt`) ~3-4 px che si smorzano in 26 passi.
- Solo `albero` e `albero_fake`; con la qualita' "Bassa" niente (world.sway
  nullo, app.js).

Verificato: valori dell'ondeggiamento per vento 0 / 0,5 / 1 (in cima: -2/+1,5,
-3,5/+2,3, -5,7/+3 px), lo scossone dopo un colpo; due video di 10 s
registrati dal gioco (vento medio e massimo, un taglialegna al lavoro)
mandati all'autore. Soak, salvataggi, ambience, zoom, resources e le prove
unitarie passano. L'autore: "e' bellissimo, cosi' va bene, anche al massimo
non da' fastidio".

### 9.106 Foglie che cadono dagli alberi

Richiesta dell'autore (3 novembre 2026, stessa PR), dopo §9.105: integrare
le particelle (le foglie col vento proposte con l'ondeggiamento).

**Com'e' fatto** (ambience.js `leavesStep`, numeri in `LEAF`):
- forma nuova delle particelle `__pt_leaf` (tools/05_atlas.py, nel gruppo
  gui come le altre forme): una foglia a mandorla appena curva, bianca col
  bordo e la nervatura piu' scuri; la tinge il colore della particella;
- ogni foglia ha il colore della chioma da cui cade (`LEAF_RGB`, misurato su
  alb1-alb8: il 20-80% dei pixel della chioma), grande 11-16 px, gira su se
  stessa (di taglio diventa sottile), volteggia (direzione e velocita'
  oscillano), scende portata verso ovest dal vento (piu' di traverso col
  vento forte) e sparisce in fondo alla caduta (2-3 s);
- [richiesta dell'autore, dopo i video] nasce a meta' della chioma, fra 60
  e 105 px sopra la base del tronco (`LEAF.from`; la chioma va da ~20 a
  ~160), non dalla cima (prima 70-150): la caduta e' piu' corta e la vita
  pure (130-190 passi, era 170-250);
- nascono solo dagli alberi sullo schermo e visibili, a caso, di piu' col
  vento, quando la raffica piega l'albero (la stessa fase dell'ondeggiamento)
  e con la pioggia; 2-4 a ogni colpo d'ascia;
- un solo sistema di particelle, sopra le istanze (depth -2e7: le foglie
  sono in aria), categoria "grass" (l'opzione "Erba e fiori" le spegne), e
  niente con la qualita' bassa (come l'ondeggiamento). Anche nel menu.

Misurato (`ambience.mjs`, "foglie": 10 s, ~15-20 alberi in vista): 2 foglie
col vento minimo, 28 col massimo, 4 colori diversi; 4 foglie a un colpo
d'ascia. Due video di 10 s all'autore (vento medio e massimo) e una foto da
vicino sopra l'erba. Soak, salvataggi e prove unitarie passano. Da tarare
con l'autore: quante, quanto grandi; sopra il bosco, dello stesso colore
delle chiome, si vedono poco (e' voluto: si notano dove cadono sull'erba).

### 9.107 Pulsanti evidenziati, livello 4, salvataggi, alberi, zoom, livello 6, schegge

Segnalazioni e richieste dell'autore (4 novembre 2026, versione 0.2608).

**1. Pulsanti che non si illuminano col puntatore** ("circa 1 volta su 3,
per tutti i pulsanti della finestra, finche' non seleziono un'altra
unita'"; la scheda sotto si vede e il clic funziona). Non era la
trasparenza di §9.93: con l'interfaccia di vetro (accesa di partenza) i
cerchi del pannello (civile, centro, caserme...) sono un passaggio che
ridisegna il mondo sfocato (draw.js `_glass`), e coprono cio' che c'e'
sotto. Il pulsante evidenziato (il cerchio a 0,99 del *_clicker) si
disegnava prima o dopo il pannello secondo la depth: quella del pulsante e'
-(y della view + 50 x zoom) - 999, quella del pannello la -y dell'unita'.
Con l'unita' piu' in basso di ~1000 px dalla cima della view (zoom
lontano, schermi alti) il pannello veniva dopo e copriva l'evidenziazione
di tutti i suoi pulsanti; cambiando selezione tornava. Ora il Draw GUI dei
pulsanti (scheda e cerchio evidenziato) e' un evento a parte,
`drawGUITop`, che il mondo disegna dopo il Draw GUI di tutti (world.js):
pulsanti di costruzione, produzione, Annulla, centro, comportamento,
porta. Prova `hover.mjs` (nuova, anche nella CI): civile in alto e in basso
nella view, col vetro; il cerchio della casa col puntatore 254 in tutti e
due i casi, quello del magazzino 192. Con l'ordine di prima, in basso, 168:
piu' scuro degli altri.

**2. Livello 4: a ponte riparato la base sud cadeva subito.** Misurato
(giocatore immortale, 16 minuti, ponte a 6): la base sud arriva a 10
soldati (il tetto), alla prima ondata partono tutti e la base resta vuota;
l'oro (una sola miniera) finisce verso il decimo minuto e senza oro non si
fanno guerrieri, arcieri ne' cavalieri, mentre cibo e legno si accumulano
(2800 e 2900 al sedicesimo minuto); dal dodicesimo 0 soldati. Ora
(economy.js `ECO.lvl04`, levels.js `LV4.reinforce`):
- tetto 16 soldati (era 10);
- `guard: 6`: i 6 soldati in attesa piu' vicini al centro restano a casa,
  le ondate partono con gli altri (al piu' 10, come prima);
- `anyTroop`: senza le risorse per la truppa di turno la caserma fa
  un'altra che si puo' pagare (senza oro: picchieri, cibo e legno);
- a ponte riparato 8 rinforzi (2 guerrieri, 2 picchieri, 2 arcieri dalle
  due caserme, 2 cavalieri dalla stalla) che restano sempre a difendere la
  base (`stay`: fuori dal tetto e dalle ondate).
Le due opzioni nuove valgono solo dove le si accende (default 0 e false):
gli altri livelli non cambiano. Misurato come sopra: dopo il ponte 14-21
soldati alla base, ondate ancora ogni 2,5 minuti (3 in 10 minuti). Prova
`lvl04.mjs`: 8 rinforzi, almeno 10 soldati entro 1500 px dal centro 3
minuti dopo (22). Da tarare giocando.

**3. Il salvataggio automatico spesso fallisce.** Gli slot erano tutti in
localStorage, gzip in base64: 0,3-2 MB l'uno (lvl03 1,1 MB, lvl05 2 MB),
e lo spazio di un sito e' circa 5 MB (su itch.io anche diviso con gli altri
giochi dello stesso dominio). Riprodotto: dopo aver salvato le room dalla
prima alla quinta (5 MB in tutto) il salvataggio del livello 6, manuale e
automatico, dava `QuotaExceededError`, "Saving failed"; da li' in poi ogni
salvataggio di una room nuova. Ora (save.js) il corpo dello slot (gzip in
byte, senza base64: un terzo in meno) va in IndexedDB, che ha uno spazio
molto piu' grande; in localStorage resta solo l'intestazione (room e data,
per i menu); le intestazioni di IndexedDB si leggono all'avvio
(`loadSlotIndex`, app.js), cosi' i menu vedono gli slot anche se
localStorage e' pieno. Senza IndexedDB (alcune finestre private) si torna a
localStorage come prima. I salvataggi vecchi si leggono ancora; il primo
salvataggio nuovo della stessa room toglie quello vecchio (e libera
spazio). Prova `saves.mjs`, ora con localStorage riempito fino alla quota
prima di salvare: il salvataggio riesce, il corpo e' in IndexedDB, il
ripristino identico, in tutte le room.

**4. Gli alberi finiti non sbiadiscono.** Non era l'ondeggiamento:
`albero_morente` nell'originale nasce invisibile e nel suo Step si rivela
con un alleato entro 600 px [C]; nel porting quel controllo mancava
(civilians.js `dying`), e l'albero finito spariva di colpo. Ora e'
visibile se lo era l'albero (e si rivela come nell'originale), e ondeggia
come lui dalla stessa fase (`swayId`, ambience.js `SWAY_DRAW`: niente salto
dritto all'ultimo colpo), con lo stesso scossone. Le altre risorse
(`*_morente` di miniere, pietre, rovine) erano gia' visibili. Prova
`ambience.mjs`, "dissolvenza": visibile, ondeggia, alpha 0,975 -> 0,475
dopo 20 passi, via dopo 40.

**5. Zoom di partenza a meta'.** Era 1 (ZOOM_MIN, il piu' vicino); ora
`ZOOM_DEFAULT` = (ZOOM_MIN + ZOOM_MAX) / 2 = 1,35 (camera.js, state.js),
nelle partite e nel menu. La prima volta la view resta centrata dove lo
era a zoom 1 (il punto di partenza dei livelli non cambia); dopo un
caricamento no (`centerFirst`, snapshot.js: la view salvata cosi' com'era;
la prima versione la spostava e `saves.mjs` lo ha visto). I salvataggi
riprendono lo zoom salvato. Gli scatti di X/Z e della rotella ora vanno al
decimo dopo nella loro direzione (manager.js `tenths`): da 1,35 a 1,4 o 1,3
(con l'arrotondamento di prima 1,5 e 1,3); da un decimo di 0,1 come prima.
Prove: manager.test.mjs, `zoom.mjs` (parte da 1,35); menu e lvl02 guardati.

**6. Livello 6: il ponte in alto sotto la base del giocatore** (3896, 2204).
Tre case della citta' (della mappa, non del giocatore) chiudevano il suo
piede sud: `ocr_25` (3870, 2348), `ocr_35` (3700, 2428), `ocr_24` (3882,
2512), oggetti 50, 51 e 52 di mappe/lvl06.tmx. Tolte (sotto c'era gia' la
strada lastricata: ora e' una piazzetta al piede del ponte che porta nelle
strade); scenari/lvl06.json rifatto con tools/12. Misurato col campo dei
percorsi e con un soldato vero mandato col clic destro: prima la piazza era
irraggiungibile dall'erba a nord (-1) e la citta' (3450, 2700) a 270 celle
(il giro dall'altro ponte; il soldato dopo 40 s era ancora a nord); ora 24
e 42 celle, il soldato arriva in 3 e 5 s, e torna indietro in 4,5 s. Prova
`lvl06.mjs`, "ponteAlto" (il resto della prova, taratura della colonna
compresa, passa come prima).

**7. Particelle per le altre risorse** (come le foglie sotto l'ascia,
§9.106; ambience.js `workChips`, numeri in `WORK`): a ogni colpo di piccone
(civilians.js workTick segna `workHit`, `workKind` e il punto colpito)
saltano 4-6 schegge di roccia (forma nuova `__pt_chip`, tools/05_atlas.py:
un sassolino irregolare, piu' chiaro in alto, col bordo scuro) che ricadono
a terra, con un filo di polvere; dalla miniera 3-4 schegge piu' scure e,
una volta su due, un luccichio dorato; nei campi, a ogni colpo di falce,
3-4 pagliuzze chiare (piu' chiare del grano, se no non si vedevano) che
volano via. Solo i civili sullo schermo e visibili (anche quelli nemici, non
nella nebbia); pietra e oro nella categoria "fire" (fumo e polvere), la
paglia in "grass". Foto da vicino all'autore. Prova `ambience.mjs`,
"schegge". Da tarare con l'autore: quante, quanto grandi.

Passano: prove unitarie, `hover`, `ambience`, `lvl04`, `lvl06`, `saves`
(tutte le room), `soak` (tutte le room), `zoom`, `hintgap`, `ui`, `melee`,
`rally`, `garrison`, `enemyarmy`, `enemydefense`, `economy`, `enemydepots`,
`lvl05`, `resources`, `burn`, `rivers`.

### 9.108 Allarmi d'attacco sulla minimappa

Richiesta dell'autore (5 novembre 2026, stessa PR di §9.107, versione
0.2608): segnali sulla minimappa per gli attacchi nemici, soprattutto il
primo in una zona ("altrimenti diventa un bordello"), ben visibili.

**Cosa c'era nell'originale** [C]: `scr_atk_signal` (colpo di guerriero,
picchiere o cavaliere nemico, freccia nemica su un'unita' alleata), solo
fuori dalla view e non entro 500 px da un segnale attivo, creava
`atk_signal`; la minimappa (manager Draw_GUI) lo disegnava come
`ico_battle` per 1,25 s, entrando rimpicciolito e sfumando (scala
0,3/fade). `flm_signal` (un segnale d'incendio, 1 s) non lo creava nessuno:
lasciato a meta'. Nel porting il disegno si era perso (il commento diceva
"non disegna nulla") e il picchiere non lo chiamava. E anche ripristinato:
in una mischia lunga un segnale nuovo ogni 1,25 s, troppo breve per
notarlo, niente per gli edifici, niente a minimappa chiusa.

**Decisioni dell'autore** (dopo la proposta): l'anello subito e l'icona che
resta finche' dura la battaglia; lo stesso per incendi e armi d'assedio
sugli edifici, con l'icona della fiamma; un tasto per andare all'allarme
(H era gia' dei suggerimenti, decisione: **J**); il simbolo nel tutorial la
prima volta; niente suoni per ora.

**Com'e' fatto** (attackalarm.js, numeri in `ALARM`):
- *zone*: un punto e un tipo, "battle" (ico_battle) quando un'unita'
  alleata perde vita, "fire" (ico_fiamma) quando la perde un edificio
  alleato (fuoco, arieti, catapulte, frecce incendiarie). Il colpo si
  riconosce dalla vita che cala, guardata a ogni passo (`alLife`
  sull'istanza): copre ogni attacco senza agganciare ogni punto del codice.
  Non contano la demolizione col tasto Canc (selezionato, vita 0), le torri
  chiuse del livello 6 e i primi 2 s della partita (le vite di partenza
  messe dalle regie). Sostituisce `scr_atk_signal` (atk_signal resta
  registrato per i salvataggi di prima);
- un colpo entro 800 px da una zona dello stesso tipo la tiene viva, senza
  un allarme nuovo; se no nasce una zona: fuori dalla view con **3 anelli**
  che si allargano (rossi per le battaglie, arancio per il fuoco: da 5 a 38
  px, uno ogni 22 passi, 70 passi ciascuno), dentro la view senza anelli
  (la si vede gia'), ma con l'icona;
- l'**icona** entra rimpicciolendosi come atk_signal, poi pulsa piano finche'
  per 30 s non arrivano colpi; poi sfuma in 1 s. Disegnata sopra tutto il
  resto della minimappa;
- *minimappa chiusa*: per 10 s dopo un allarme nuovo il suo pulsante
  lampeggia di rosso;
- **J** porta la view sulla zona piu' recente; di nuovo entro 5 s, sulla
  precedente (manager.js);
- la prima volta il suggerimento **hint_allarme** ("Allarmi", accanto alla
  minimappa, coi due simboli in alto a destra della finestra: hints.js
  `icons`), tradotto nelle sei lingue; se un altro suggerimento e' aperto,
  aspetta che si chiuda;
- le zone stanno in g.alarms: si salvano con la partita.

**L'icona della fiamma**: disegno dell'autore (nero su trasparente, 90 x 90
px; nuovi/sprites/fiamma.png), resa come ico_battle (50 x 50, il disegno
alto 42 px, lo stesso colore pieno 135, 73, 0): `ico_fiamma` fra i derivati
di nuovi.json; tools/nuovi.py ha due opzioni nuove per i derivati, `alto`
(l'altezza al posto della larghezza) e `colore` (colore pieno, l'alpha
resta). Foto della coppia all'autore.

Prove: `alarm.test.mjs` (unitaria: zone, anelli dentro e fuori dalla view,
fine, demolizione, inizio partita, menu, suggerimento una volta) e
`alarms.mjs` (nuova, anche nella CI): un guerriero nemico contro un
soldato fuori dalla view per 40 s, una sola zona con gli anelli (con
atk_signal sarebbero stati ~32 segnali); il suggerimento una volta; una
mischia nella view senza anelli; una casa in fiamme fuori dalla view; J sulla
piu' recente e poi sulla precedente; tutto fermo per 31 s, le zone spariscono;
salvate e ricaricate uguali. Foto della minimappa (anelli, icona, pulsante
che lampeggia) all'autore. Da tarare con l'autore: raggio della zona (800
px), durata (30 s), grandezza di anelli e icone.

Passano anche: prove unitarie, `soak` (tutte le room), `saves` (match,
lvl04), `ui`, `hintgap`, `burn`.

### 9.109 La minimappa: clic, riquadro della view, icone, fiumi, colori

Discussione con l'autore (5 novembre 2026, stessa PR, versione 0.2608)
dopo una revisione della minimappa. Decisioni, punto per punto:

1. **Fondo**: resta trasparente come nell'originale (0,19, col puntatore
   sopra 0,69): piu' coprente prenderebbe troppo spazio.
2. **Riquadro della view**: alto view_hview/sz, non view_hport/sz
   (l'originale [C]: con lo zoom il riquadro era piu' basso della view
   vera, il 74% allo zoom di partenza 1,35); angoli col raggio 10 (era 80:
   quasi sempre un ovale).
3. **I clic non passano piu' al mondo.** Prima il clic destro sulla
   minimappa mandava le unita' selezionate al punto del mondo che stava
   *sotto* la minimappa sullo schermo, il sinistro deselezionava, e anche i
   pulsanti "+", "-" e "occhio" deselezionavano (provato nel browser). Ora
   (manager.js `minimapInput`, app.js) sopra la minimappa e i suoi pulsanti
   il mondo non riceve clic ne' hover, niente rettangolo di selezione, e lo
   schermo non scorre (la minimappa e' dentro la fascia dei bordi che lo fa
   scorrere).
4. **Icone**: edifici e unita' con le icone dell'interfaccia (mm_*:
   tools/05_atlas.py le rifa' bianche e piene, ritagliate, 32 px; la
   minimappa le colora). Gli edifici larghi quanto la loro impronta in
   scala (fra 7 e 22 px), le unita' 7 px; cantieri al 45%, le torri chiuse
   del livello 6 grigie, mura e porte linee (anche quelle nemiche, prima
   pallini). Gli oggetti senza icona restano pallini.
5. **Colori**: i tuoi rosso caldo (226, 74, 46; era 255, 0, 0), i nemici blu
   (46, 112, 232); gli anelli degli allarmi (§9.108) arancioni come le due
   icone (210, 112, 20: il loro colore un po' piu' chiaro, per vedersi
   anche sul buio), per battaglie e fuoco.
6. **Alberi**: verde piu' tenue e meno saturo (112, 146, 104) al 60%.
7. **Fiumi** in azzurro (120, 182, 226) larghi quanto il fiume: dalla mappa
   dell'acqua della room (effects.js waterMap, fiumi dipinti e a linee, senza
   le parti sotto i ponti), corse orizzontali di pixel della minimappa
   rifatte solo se cambia la scala. **Montagne**: provata una catena di cime
   stilizzate (grande quanto il disegno della montagna: le tele degli sprite,
   fino a 2342 x 1461, sono in gran parte vuote, si usa il trim); l'autore
   non e' convinto e disegnera' lui lo sprite. Spente intanto (minimap.js
   `MM.mountains`); il riquadro del disegno di ogni montagna e' gia' calcolato.
8. **Nebbia di guerra sulla minimappa**: da ragionare (l'autore teme che
   diventi troppo coprente, come per il punto 1).
9. **Clic sinistro** sulla minimappa (e trascinando): la view si centra su
   quel punto. 10. **Clic destro**: le unita' selezionate vanno li' (l'ordine
   di movimento di sempre, col punto della mappa; non raccolta ne' attacco).

Prova `minimap.mjs` (nuova, anche nella CI), con eventi veri del mouse:
destro verso il punto della mappa (4200, 3500: arrivato a meno di 1 px
come meta), sinistro che centra la view (selezione intatta, niente
rettangolo), trascinamento, il pulsante "-" (la scala cambia, il soldato
resta selezionato), il riquadro alto quanto la view vera e col raggio 10.
Foto della minimappa all'autore in quattro livelli, col puntatore sopra e
senza.

**Campi nemici visibili dalla partenza** (segnalazione dell'autore, guardando
la minimappa: "campi di grano blu, si vedono gia' anche se sono edifici
nemici"). Due cause:
- `enemy_campo` (economy.js) usava il comportamento del campo del
  giocatore, che e' sempre visibile: nessun edificio nemico si vede finche'
  un alleato non gli e' vicino (enemybuild.js revealBuilding), il campo
  si'. Ora nasce nascosto e si rivela come gli altri; le sue righe di
  spighe (sistemi di particelle a parte) si disegnano solo se il campo e'
  visibile. Nel livello 4 la fattoria della base sud ora si scopre
  arrivandoci.
- nel livello 5 la regia (levels.js lvl05Setup) sostituiva i cantieri di
  campo della mappa (del giocatore) con campi nemici uno alla volta: ogni
  campo nuovo vedeva i cantieri vicini non ancora sostituiti (edifici del
  giocatore entro 200 px) e si rivelava. 7 campi su 8 visibili dalla
  partenza; ora prima si tolgono tutti, poi si creano: 0 su 8.
Gli altri edifici nemici di lvl04, lvl05, lvl06 e match all'inizio sono
tutti nascosti (controllati uno per uno). Prove: `lvl04.mjs` e `lvl05.mjs`
("campi": nessun campo nemico ne' spiga visibile alla partenza).

Da guardare con l'autore: le unita' a 7 px in gruppo fanno una macchia di
icone, e l'icona del guerriero (le spade incrociate) e' la stessa forma
dell'allarme di battaglia; il rosso caldo dei tuoi e l'arancio degli anelli
sono vicini.

Passano: prove unitarie, `minimap`, `alarms`, `ui`, `hintgap`, `zoom`,
`rally`, `attackorder`, `movement`, `lvl04`, `lvl05`, `economy`, `soak`
(tutte le room), `saves` (match, lvl05, lvl06).

### 9.110 Minimappa: unita' a puntini, marrone, acqua e linee sfumate, nebbia col puntatore

Decisioni dell'autore dopo le foto di §9.109 (5 novembre 2026, stessa PR,
versione 0.2608):
- **Unita' come puntini** (le icone a 7 px in gruppo facevano una macchia, e
  il guerriero aveva la forma dell'allarme di battaglia): pallini di raggio
  50/sz come nell'originale (almeno 1,7 px); gli edifici restano icone.
- **I tuoi marroni** (124, 72, 36), non piu' rosso caldo; **gli allarmi piu'
  arancioni**: anelli e icone (245, 140, 26). Le icone dell'allarme nella
  minimappa sono versioni bianche, colorate dalla minimappa: `mm_battle`
  (da ico_battle, tools/05_atlas.py) e `mm_fiamma` (dal disegno dell'autore,
  nuovi.json); il suggerimento hint_allarme tiene le icone di prima.
- **Acqua sfumata**: ogni pixel della minimappa ha la sua copertura d'acqua
  (le celle d'acqua da 8 px col centro nel pixel, sul totale), a sedicesimi
  d'alpha, in corse di pixel uguali: l'interno in poche corse lunghe, il
  bordo pixel per pixel (minimap.js `runsOf`). Niente piu' scalini.
- **Linea della bandierina** (dall'edificio al punto di raccolta): tratti
  coi bordi sfumati (draw.js `_lineAA`, 9 quad per tratto invece di 1: una
  linea di 500 px sono ~20 tratti, solo con l'edificio selezionato).
- **La nebbia di guerra, come l'ha pensata l'autore**: senza puntatore la
  minimappa resta com'e'; col puntatore sopra diventa piu' opaca (come lo
  0,69 di prima) solo la parte scoperta (fog.explored, coi bordi sfumati
  come l'acqua, rifatta ogni 30 passi). Senza nebbia (trucco, menu) come
  prima, tutta. Nota: lo 0,69 di prima, con l'interfaccia di vetro, era il
  vetro sfocato; la parte scoperta e' bianco semplice sopra il fondo di
  vetro a 0,19.
- **Il riquadro della view negli angoli**: gli angoli col raggio 5, ma in un
  angolo della minimappa quello del riquadro ha il raggio della minimappa
  meno la distanza dai due lati (draw.js `roundRectRadii`, minimap.js
  `viewRadii`): se tocca i due lati e' concentrico con l'angolo della
  minimappa e non ne esce. Acqua e parte scoperta seguono anche loro gli
  angoli arrotondati.

- **Le risorse con le icone** (richiesta dell'autore), coi colori di prima:
  la miniera (mm_miniera, il carrello) gialla, pietre (mm_stone) e rovine
  (mm_ruin) grigie, grandi quanto la loro impronta come gli edifici; gli
  alberi restano triangoli.
- **Il centro col mulino sopra** (segnalazione dell'autore): il centro crea
  `cc_barn`, un oggetto invisibile e senza sprite che gli fa da deposito del
  cibo; col suo nome prendeva l'icona del mulino. Ora la minimappa salta gli
  oggetti senza sprite (anche i pezzi invisibili delle mura, oodl, oval...,
  che erano pallini).
- Da guardare con l'autore: l'icona della caserma sono spade incrociate come
  l'allarme di battaglia (diverse nel colore: marrone e arancione).

Prove: `minimap.test.mjs` (nuova: icone per oggetto, raggi del riquadro),
`minimap.mjs` (il riquadro coi raggi per angolo). Foto all'autore: lvl06 e
lvl04 col puntatore e senza (nebbia), allarmi arancioni, la view
nell'angolo; la linea della bandierina da vicino.

### 9.111 Minimappa: col puntatore il mondo sotto si sfoca, con un passaggio di 0,3 s

Richiesta dell'autore (5 novembre 2026, stessa PR, versione 0.2608): col
puntatore sopra la minimappa il mondo sotto deve sfocarsi come col vetro a
0,69, su tutta la minimappa (anche dove non e' scoperta: lo sfondo non
distrae), e il passaggio essere un'animazione di circa 0,3 s.

**Perche' non lo faceva piu'.** Il vetro (§7.14, shader `glass`) lega
sfocatura e chiarezza all'alpha del pannello: a 0,19 il mondo sfocato copre
quello nitido per il 27,5%, a 0,69 del tutto, e la brina bianca (0,3) cresce
con lui. Con la nebbia di §9.110 col puntatore il vetro restava a 0,19 (e
sopra la parte scoperta un velo bianco): niente sfocatura in piu'.

**Ora** la sfocatura e la brina si regolano da sole (draw.js `glassBlend`,
`glassFrost`; nello shader la brina e' un uniform, 0,3 di serie):
- col puntatore il vetro copre il mondo fino al 100% (come a 0,69) su tutta
  la minimappa, con la brina ridotta (0,3 x 0,275 / copertura) perche' la
  parte non scoperta resti chiara come senza puntatore;
- la parte scoperta si schiarisce fino alla chiarezza del vetro a 0,69
  (`MM.exploredGlass` 0,52 di bianco sopra il vetro; senza vetro come in
  §9.110);
- il passaggio dura 0,3 s (`MM.hoverTime`), con una curva morbida
  (smoothstep), avanti e indietro, a tempo vero (anche a gioco in pausa).

Misurato su un tratto di prato non scoperto sotto la minimappa (lvl06,
1920 x 1080): il dettaglio del mondo (media dei bordi) da 20,3 a 11,6 col
puntatore, la luminosita' uguale (152 / 149). Foto all'autore a inizio,
meta' e fine del passaggio. Passano `minimap`, `hover`, `ui`, `soak`.

### 9.112 Lo sfondo della pausa arriva in 0,3 s

Richiesta dell'autore (5 novembre 2026, stessa PR, versione 0.2608), dopo
§9.111. Il menu di pausa sfocava e scuriva gia' tutto lo schermo (§7.12,
come NIMBUS: la scena ferma ridotta a meta' e sfocata, sotto un velo nero
al 40%), ma di colpo. Ora (app.js `pauseEase`, `pauseVeil`) in 0,3 s, con
una curva morbida: la scena ferma nitida, sopra quella sfocata che compare e
il velo che sale; chiudendo la pausa lo stesso all'indietro, sopra il gioco
che riparte. A tempo vero (il gioco e' fermo). Il pannello del menu compare
e sparisce subito.

La scena ferma nitida va disegnata ignorando la sua alpha (fusione
"replace", gia' usata per lo stesso motivo in §6.8: la sottrazione di nebbia
e notte azzera l'alpha delle superfici; con la fusione normale nei primi
fotogrammi traspariva lo sfondo chiaro della pagina, la scena usciva quasi
bianca), e lo sfocato sopra con una trasparenza costante che ignora anche
lei l'alpha della superficie: fusione nuova "mix" (gl.js setBlend, con
gl.blendColor).

Verificato con foto a 0, 100, 200 e 400 ms dall'apertura e a 0, 150 e 400
ms dalla chiusura (mandate all'autore). Passano `ui`, `saves`, `hover`,
`minimap`, `soak` e le prove unitarie.

### 9.113 Lo zoom della minimappa morbido; la scala fra 12 e 60

Richiesta dell'autore (5 novembre 2026, stessa PR, versione 0.2608): lo zoom
della minimappa ("+" e "-" accanto, Ctrl+Z e Ctrl+X) fluido come quello del
mondo (§9.83), non a scatti.
- global.sz (px di room per px della minimappa) resta la scala scelta, di 1
  a scatto come nell'originale; quella disegnata (manager.js `mmSz`,
  `mmScale`) la insegue del 25% della distanza a passo e si ferma esatta
  sotto lo 0,2%: ~16 passi (un quarto di secondo) per uno scatto, e piu'
  scatti di fila si sommano alla meta. Disegno, clic sulla minimappa e
  hover dei suoi pulsanti usano la scala disegnata.
- Acqua e parte scoperta (§9.110) si calcolano alla scala scelta e durante
  il passaggio si disegnano ingrandite (minimap.js drawRuns, `k`): niente
  ricalcolo delle coperture a ogni fotogramma.
- [Correzione] la scala non aveva limiti [C]: col "+" arrivava a 0 e sotto
  (divisioni per zero, minimappa enorme o capovolta). Ora fra 12 e 60
  (`MM.szRange`; 30 di partenza), anche per i salvataggi di prima.

Prova `minimap.mjs`, "morbido": 6 scatti di colpo, da 31 a 25 con 16 valori
intermedi, senza tornare indietro; 1 e 500 diventano 12 e 60. Passano
anche `hintgap`, `ui`, `alarms`, `soak` e le prove unitarie.

### 9.114 Minimappa: selezione, punto di raccolta, obiettivi

Proposte accettate dall'autore (5 novembre 2026, stessa PR, versione 0.2608):
1. **Selezione**: le tue unita', i tuoi edifici, mura e porte selezionati
   sono bianchi (`MM.selected`): col clic destro sulla minimappa (§9.109) si
   vede chi si sta mandando. [Decisione dell'autore, dopo la foto] prima un
   anello bianco attorno al puntino o all'icona: non convinceva.
2. **Punto di raccolta**: dell'edificio selezionato, una linea bianca
   sottile dall'edificio e un piccolo stendardo (`drawRally`). Il clic
   destro sulla minimappa lo sposta li', come nel mondo (provato: col
   centro selezionato la bandierina va nel punto della mappa indicato).
3. **Obiettivi in corso** (levels.js `objectiveMarks`, minimap.js
   `drawObjectives`): un rombo bianco che pulsa piano, col bordino scuro;
   piu' tenue se facoltativo. Un luogo fisso sempre, un edificio nemico solo
   se gia' visto (la minimappa non rivela basi non scoperte); niente per gli
   obiettivi senza un luogo (sopravvivere, le pattuglie, la fortezza):
   - livello 1: i cancelli a nord (4836, 331) finche' non li si raggiunge;
   - livello 3: il villaggio, poi il monastero, e caserme e stalle nemiche
     quando si sa da dove vengono le ondate;
   - livello 4: il ponte finche' non e' riparato, l'accampamento a nord-est
     (facoltativo), poi il centro nemico;
   - livello 5: la porta ovest della citta' nell'inseguimento, le rovine per
     la pietra, poi il centro nemico;
   - livello 6: il ponte di destra quando arriva la colonna.
   I segnalini all'inizio erano anelli come la selezione di allora e si
   confondevano (foto): ora rombi.

Passano `minimap`, `alarms`, `ui`, `hintgap`, `lvl04`, `soak` e le prove unitarie.
Prove: `minimap.mjs`, "raccolta" (la bandierina col clic destro sulla
minimappa); i segnalini controllati livello per livello (window.__game
`objectives()`); foto del livello 4 col centro e tre soldati selezionati,
la bandierina e il ponte da riparare.

**[Trovato dalla CI] Il clic giudicato col puntatore di prima.** Lo stato
"puntatore sulla minimappa" (manager.js minimHover e pulsanti) si calcolava
solo nello Step del manager [C], cioe' alla fine del passo prima: un clic
fatto spostando il puntatore nello stesso passo era giudicato con la
posizione vecchia. Con i clic che non passano piu' al mondo (§9.109), un
ordine nel mondo dato subito dopo un clic in basso a sinistra poteva essere
preso per un clic sulla minimappa e perdersi: `buildstuck.mjs` ("incrocio",
gli ordini col clic destro su quattro cantieri) aveva un civile che non
arrivava mai al lavoro. Ora l'hover si rifa' anche subito prima dei clic,
col puntatore di adesso (`hoverMinimap`, app.js): la prova passa (0 in
ritardo su 72 ordini).

### 9.115 Le montagne nella minimappa col simbolo dell'autore

Richiesta dell'autore (5 novembre 2026, stessa PR, versione 0.2608): il suo
disegno di una montagna (linee nere su trasparente, 96 x 96;
nuovi/sprites/montagna_minimappa.png) come simbolo, color nocciola, scalato
sulla montagna che rappresenta.
- `mm_montagna` fra i derivati di nuovi.json: ritagliato (93 x 75) e bianco,
  alla sua risoluzione; la minimappa lo colora nocciola (166, 123, 91) al 90%.
- Grande quanto il disegno della montagna in scala (il trim dello sprite,
  non la tela, in gran parte vuota), fino al 90% di quel riquadro e con le
  proporzioni del simbolo; al centro della parte del disegno che cade dentro
  la minimappa (gli sprite delle montagne sporgono spesso oltre i bordi
  della mappa); niente se ne cade dentro meno di 6 x 5 px.
- Le montagne si riaccendono (`MM.mountains`); tolta la catena di cime a
  triangoli di §9.109.

Foto all'autore: tutorial (12 montagne, le grandi e le piccole), livello 5 e
6. Passano `minimap`, `ui`, `soak` e le prove unitarie.

**Fiumi e montagne solo dove la mappa e' scoperta** (richiesta dell'autore:
"il fiume dovrebbe rivelarsi gradualmente, non tutto insieme"). Con la
nebbia attiva:
- la copertura d'acqua di ogni pixel della minimappa si moltiplica per
  quella della parte scoperta (minimap.js `exploredCov`, la stessa della
  nebbia col puntatore, §9.110, rifatta ogni 30 passi): il fiume compare a
  pezzi, man mano che lo si scopre, coi bordi sfumati;
- una montagna compare sfumando con la parte scoperta del suo disegno
  (piena da un terzo in su, `MTN_SEEN`).
- [decisione dell'autore] le torri chiuse del livello 6 (§9.101: non ancora
  tue, grigie) solo dove la mappa e' scoperta: prima si vedevano tutte e 21
  dalla partenza, perche' edifici del giocatore.
Senza nebbia (menu, trucco) tutto come prima. Foto all'autore: livello 6
all'inizio (solo il fiume vicino alla base) e dopo aver scoperto una fascia
verso ovest. Passano `minimap`, `alarms`, `soak` e le prove unitarie.

### 9.116 Menu decorativo, pioggia, raccolta affollata, calca dei nemici, obiettivi facoltativi

Richieste e segnalazioni dell'autore (6 novembre 2026, versione 0.2609).

**1. La bandierina rossa che volava da sola nel menu.** La `flag_r` a
(1308, 1035) della room menu e' quella del castello del tutorial (in match
il castello e' a 1310, 1140, la bandiera 105 px sopra); nel menu il castello
e' a 2700, 1255 e la bandiera restava sospesa nel prato. Tolta al caricamento
(app.js `DROPPED_AT`, per room, oggetto e posizione: `data/rooms` non si
tocca). Le altre due bandiere del menu sono sul castello.

**2. Nel menu unita' ed edifici solo decorativi.** `world.inputOnly`
(world.js): se impostato, mouse e tastiera arrivano solo alle istanze di
quegli oggetti; nel menu solo `enemy_manager_menu` (app.js). Niente
selezione, evidenziazione (prima il castello passava a hover=1 sotto il
puntatore) ne' rettangolo di selezione (manager.js `mouse`). Provato col
clic sul castello e su un'unita' e col trascinamento.

**3. La pioggia non spegne piu' i fuochi.** Prima (§3.17 n.56, §9.92) ogni
10 passi spegneva gli edifici di legno alleati. Ora toglie solo il danno
dell'incendio prolungato (il punto di vita perso a ogni allarme del fuoco):
`burnTick` (effects.js) al posto di `if (onfire) life -= 1` in tutti gli
edifici, alleati e nemici; `w.rainDamp` lo calcola il manager a ogni passo
(gocce almeno a meta', `RAIN_PUT_OUT`, come §9.92). Il colpo della torcia o
della freccia incendiaria (siege.js) fa danno come sempre; spegne solo la
riparazione col legno. Provato: casa in fiamme, 17 punti persi in 1200
passi all'asciutto, 0 sotto la pioggia, fuoco ancora acceso.

**4. Pioggia piu' corta e varia.** Durava da 12000 a 15000 passi (3,3-4,2
minuti, l'originale); ora da 3600 a 9000 (1-2,5 minuti, manager.js
`RAIN_LEN`). L'intervallo fra due piogge resta 20000-35000 passi.

**5. "Tanti lavoratori su una miniera o una pietra piccola: lavorano in uno o
due, gli altri fermi intorno".** Non e' la vicinanza fra loro: e' il numero
di posti di lavoro (§9.21, 10 attorno a una miniera o a una pietra). Censiti
in tutte le room i posti liberi da ostacoli: quasi ovunque 10 su 10, ma la
miniera del livello 2 a (2166, 449) ne ha 2 (7 dentro `montagna_1`, 1 nel
fiume), quella a (609, 2194) 3, la pietra piccola del livello 6 a (6048,
2508) 5 (acqua). Li' chi non trovava posto restava in coda per sempre, e chi
aveva prenotato un posto irraggiungibile ci girava attorno tenendolo
occupato. Ora (civilians.js, `resSpot`, `toResSpot`, `overflowTo`):
- un posto irraggiungibile (nessun campo e non in vista) si lascia e per
  900 passi non lo prende nessuno (`badUntil`); uno a cui non ci si avvicina
  per 180 passi (chiuso dai compagni) si lascia per 300;
- senza un posto di lavoro libero, prima della coda si va alla risorsa dello
  stesso tipo, conosciuta e raggiungibile, piu' vicina a questa entro 700 px
  che ne ha uno libero; chi e' in coda ci riprova ogni 60 passi;
- senza nessun posto (ne' di lavoro ne' d'attesa) si aspetta fermi, girati
  verso la risorsa, invece di spingere verso il suo centro.
`mining.mjs` (20 civili, magazzino a 150 px, 9000 passi): livello 2,
miniera (130, 2277) con le vicine semichiuse, da 548 a 880 oro al minuto,
fermi da 60 a 0, giri sul posto da 39772 a 212, lenti da 506 a 67 per mille;
match oro invariato; match pietra stessa resa (504 contro 508), in coda da
28720 passi a 0 (vanno all'altra pietra), inversioni da 2,7 a 4,2 per mille
passi in cammino. La miniera a (2166, 449)
restava a 2 posti: non ha altre miniere entro 700 px, e `montagna1` aveva la
maschera a ellisse dell'originale (kind 2, 1328 x 796 px), molto piu' larga
del disegno: la miniera, in campo aperto a vederla, era quasi tutta dentro
l'ellisse. Vedi "Seguito" qui sotto: ora la maschera e' precisa.

**6. I nemici si accavallano.** Nuova prova (18 nemici misti in ondata,
ruolo 31, verso un punto a 1500 px): arrivati, 48-49 coppie sovrapposte, 9
nemici ancora in cammino dopo 40 s, 13000-14000 inversioni di marcia. La
meta e' la stessa per tutti: i primi si fermavano, gli altri sovrapposti
andavano col campo (senza collisioni) fin sopra di loro, o col passo dritto
spostando a caso la meta occupata. Ora (enemies.js):
- **arrivo nella calca** (`arriveInCrowd`): chi marcia (non insegue, non va
  a dare fuoco, non in ritirata, sulla strada, in colonna o verso un
  presidio) a meno di 250 px dalla meta e tocca, dov'e' o un passo avanti,
  un compagno fermo, e' arrivato li';
- **separazione dei fermi** (`settleEnemies`, come `settleOverlaps` degli
  alleati, §9.62): fra due nemici fermi e liberi che si toccano si sposta
  quello con l'ordo piu' basso, a un posto libero vicino, dritto sopra i
  compagni (`settleMove`);
- **mischia** (`enemyUnstack`, come `unstack` degli alleati, §9.71): a
  contatto con l'alleato ma sopra un compagno che sta gia' colpendo, non si
  comincia a colpire: si va a un posto libero attorno all'alleato, dritti
  sopra i compagni (`stepOver` di units.js, ora anche per i nemici e mai
  dentro un fiume a linee); prima si andava col campo dell'ondata (verso la
  sua meta, non il posto);
- **precedenza** (pathing.js `mayYieldTo`): passa chi ha l'ordo piu' alto,
  l'altro aspetta fermo come prima, ma a pari ordo (g.order x rango: possono
  coincidere) i due si aspettavano a vicenda per sempre con l'animazione
  bloccata: ora passa chi ha l'id piu' alto; non si aspetta chi aspetta noi;
  in marcia, a oltre 400 px dalla meta, al piu' 180 passi di fila.
Prova di marcia, semi 2, 3, 5: coppie sovrapposte alla fine 49/48/49 ->
2/4/0, inversioni 13208/13700/14054 -> 5/9/3, in cammino alla fine 9 -> 0.
Assalto (la stessa ondata contro 6 alleati invulnerabili alla meta): passi x
coppie sovrapposte 69324/43065/53929 -> 21141/37392/30152, coppie alla fine
31/11/13 -> 6/11/6 (restano arcieri che tirano dallo stesso punto e chi
colpisce comunque dopo 30 passi senza posto), inversioni 5/25/3 -> 11/37/18.

**7. Gli alleati.** Provate le stesse regole anche per loro (aspettare solo
chi si muove davvero, al piu' 60 passi): in marcia l'attesa piu' lunga
scendeva da 276 a 120 passi, ma in `crowd.mjs` "punto" le inversioni
salivano (seme 2: da 91 a 305; seme 3: da 179 a 503, oltre la soglia).
**[Indicazione dell'autore]** "meglio che restino fermi un istante piuttosto
che fare cose folli": per gli alleati le regole restano quelle di prima;
`crowd.mjs` da' gli stessi numeri di prima (semi 2, 3, 5). Restano le attese
di qualche secondo degli arcieri in marcia sovrapposti a un compagno.

**8. Obiettivi facoltativi.** [Domanda dell'autore: come indicarli; proposta
fatta qui, da rivedere] Una riga facoltativa (4o campo `true` in
endgame.js) comincia con "Optional:"/"Facoltativo:", sta dopo gli
obiettivi obbligatori ed e' scritta piu' tenue (alfa 0,55 contro 0,75; i
completati 0,4 con la spunta), come il suo rombo nella minimappa (§9.114).
Livello 6: "Facoltativo: recupera le torri, riparale oltre il 60% (n/m)"
(prima obbligatorio a vederlo; per vincere basta fermare la colonna), con la
spunta quando sono tutte recuperate. Livello 4: il campo nord-est (gia'
"Facoltativo:") ora dopo "Distruggi il municipio nemico".

Prove: `npm test`, la batteria della CI nel browser e `idle`, `workers`,
`deposit`; `mining.mjs` e le prove di marcia descritte sopra.

**Seguito (stessa PR, richieste dell'autore).**

*Maschera precisa per `montagna1`* [decisione dell'autore]. tools/06_masks.py
`PRECISE`: la maschera dai pixel (coltolerance 248 del GMX), al posto
dell'ellisse; vale in tutte le room in cui c'e' la montagna (match, menu,
livelli 2, 3, 4, 5). Miniera del livello 2 a (2166, 449): posti di lavoro
liberi da 2 a 5 su 10 (dei 5 chiusi, 3 sono dove il corpo del civile, non
solo i piedi, tocca il bordo disegnato della montagna, 2 la riva del
fiume); 15 civili col magazzino a 220 px: in media al lavoro da 1,6 a 3,5.

*Livello 6, miniera e tempietto in citta'* (prova come sopra, 15 civili,
magazzino a 220-390 px, raggiungibili senza passare il fiume):
- miniera (4980, 2272), 6 posti liberi su 10 (il resto nel fiume): 5-6 al
  lavoro, gli altri in coda (nessun'altra miniera entro 700 px);
- pietra grande (4640, 3820), 3 posti chiusi dal tempietto: 5-11 al lavoro,
  nessuno in coda (gli altri vanno alla pietra piccola accanto);
- tempio in rovina (5188, 3604): finito, i civili passano alla pietra
  piccola accanto (4636, 3540), e chi si riempiva in mezzo ai compagni
  restava **fermo col carico per sempre** (14 su 15 alla fine; c'era anche
  prima di questa sezione): il campo verso il magazzino era chiuso dalle
  celle dei compagni fermi al lavoro (-1 nella sua cella). Ora fieldTo
  (civilians.js), con la propria cella chiusa, prova il campo coi soli
  ostacoli fissi (come verso i posti, §9.23) prima di arrendersi: nessuno
  piu' bloccato, campioni al lavoro da 19 a 34.

*IA nemica: niente ricostruzione sotto gli occhi del giocatore*
[segnalazione dell'autore: "ricostruisce i magazzini dove li ho appena
distrutti, coi miei soldati ancora li'"; proposta accettata]. Un punto e'
occupato se un'unita' del giocatore e' entro `defendR` (600 px, la distanza
a cui la base si difende, §9.50). Economy.js `threatened`:
- non si ricostruisce un edificio perso in un punto occupato, ne' gli si
  mettono da parte le risorse: si passa al primo perso con il posto libero;
- un deposito perso in un punto occupato non impedisce piu' un deposito
  nuovo altrove (§9.46); i depositi nuovi non si mettono in punti occupati;
- i lavoratori non vanno a risorse (ne' campi) in punti occupati, se ce ne
  sono altre;
- i soldati della regia in attesa vanno a liberare il posto di un edificio
  perso (l'intruso di §9.50, che prima guardava solo gli edifici in piedi).
Prova (livello 6, magazzino nemico distrutto con 3 soldati del giocatore
fermi e invulnerabili sul posto, 2400 passi): prima il cantiere ripartiva
al passo 1031 davanti a loro; ora nessun cantiere, 3 soldati nemici
mandati, e via i soldati del giocatore il cantiere riparte in 11 passi.

*IA nemica: difesa degli edifici, regola per tutti i livelli*
[segnalazione dell'autore: "attaccavo un magazzino nemico e il soldato
nemico li' vicino non faceva niente"]. I soldati fermi reagivano solo a un
alleato entro 400 px da loro (meno di notte) e la difesa della regia (§9.50)
muove solo i suoi soldati in attesa. Ora (enemies.js `defendBuildings`) ogni
10 passi, per ogni edificio nemico che ha perso vita: l'unita' del giocatore
piu' vicina a lui entro 800 px e' l'attaccante, e i soldati nemici fermi e
liberi entro 900 px dall'edificio le vanno contro (non lavoratori, macchine
d'assedio, chi si ritira, chi marcia sulla strada o in colonna, chi va al
presidio). Prova: un guerriero nemico fermo a 550 px da una casa nemica
attaccata da un arciere a 450 px dall'altra parte: prima fermo (0 px di
strada), ora la raggiunge e lo attacca.

*Prove del seguito.* `npm test` e la batteria della CI nel browser passano
tranne `buildstuck.mjs` "incrocio", che a volte ha 1-3 civili in ritardo su
72 ordini anche con lo stesso seme (non deterministico da un'esecuzione
all'altra). Non e' di questa sezione: sui semi 1-10 `main` ha 16 ordini in
ritardo (6 semi oltre la soglia), questa versione 13 (4 semi). **Da
sistemare a parte** (la CI puo' cadere a caso su questa prova).

### 9.117 Gocce di sangue sui colpi

Proposta accettata dall'autore (6 novembre 2026, stessa PR, versione
0.2609): gocce di sangue sui colpi alle unita', con un interruttore nelle
opzioni grafiche; niente macchia a terra alla morte (c'e' gia' nello sprite
del cadavere).
- blood.js `bloodHit`, chiamato dai colpi in mischia (units.js meleeStrike,
  alleati; enemies.js enemyStrike, nemici) e dalle frecce (ranged.js
  allyArrow ed enemyArrow, anche quelle delle torri).
- La goccia e' lo sprite della macchia di sangue dell'autore (`sfxsangue`, il
  masso della catapulta, siege.js), rimpicciolito a 12-19 px, del suo rosso
  (160, 17, 0) con la luminosita' che varia: 4-6 gocce per colpo in mischia,
  2-3 per freccia, a 34 px dai piedi, schizzano dalla parte opposta a chi
  colpisce (o nella direzione della freccia), un po' verso l'alto, e ricadono
  sbiadendo in 18-28 passi.
- Non sulle macchine d'assedio; solo unita' visibili (non nella nebbia) e
  sullo schermo; al piu' 40 gocce per passo.
- Categoria di particelle "blood": "Sangue: SI/NO" nelle opzioni grafiche
  (settings.js `blood`, attivo di norma; tradotto nelle sei lingue). Per i
  portali che chiedono di dichiarare la violenza si puo' spegnere di norma
  nello zip (da decidere con l'autore).
Foto all'autore: mischia di giorno (5 contro 5 e tre arcieri). Passano
`npm test`, `saves` (match, livelli 4 e 6), `melee`, `soak` (menu, match,
livello 5).

### 9.118 La schermaglia (prima parte): Padus, la schermata, la CPU che costruisce

Richiesta dell'autore (8 novembre 2026, stessa PR, versione 0.2609): una
modalita' "schermaglia" 1 contro 1, giocatore contro CPU, su mappe
simmetriche, con parametri; 4-5 mappe all'uscita, coi nomi storici
dell'Italia altomedievale. Decisioni dell'autore:
- simmetria: non delle immagini, delle posizioni rispetto al nemico;
  rotazione di 180 gradi, basi in angoli opposti;
- partenza: il centro e 2-3 lavoratori (qui 3), niente altro;
- la CPU ha le stesse possibilita' del giocatore; la difficolta' piu' alta si
  chiama "Truccata" (Rigged): si vede che la CPU parte avvantaggiata;
- disponibile da subito, col pulsante "Schermaglia" sotto la campagna;
- le mappe: Padus (il Po), Silva Umbra (la Foresta Umbra), Rivoaltus
  (Rialto, la laguna), Urbs (Roma), Mons Bardonis (il Monte Bardone, il
  valico della Via Francigena). Nomi usati in quel periodo, in latino.
- grandezza: le mappe di oggi vanno da 3200 x 8000 (livello 2) a 9000 x 4000
  (livello 5), il tutorial 7000 x 7000. Un soldato fa ~200 px al secondo, un
  civile ~150-180: Padus e' 7000 x 7000, coi centri a ~6200 px in linea
  d'aria (circa 35-40 s di marcia per un soldato, di piu' per i ponti).

**Le mappe simmetriche** (tools/16_schermaglia.py): si descrive mezza mappa
(la base A in alto a sinistra) e lo script aggiunge i gemelli ruotati attorno
al centro: degli oggetti si ruota il centro della maschera di collisione (non
l'origine dello sprite, perche' l'ingombro sia lo stesso), dei fiumi la meta'
dal bordo al centro, ponti e strade col gemello. Scrive mappe/sk_<nome>.tmx
col kit di Tiled (si apre e si guarda come gli altri livelli); lo scenario lo
fa tools/12 come sempre. `--check` (nella CI): ogni istanza dello scenario ha
il gemello entro 1 px, fiumi, strade e ponti sono simmetrici, e il .tmx e'
quello che lo script scriverebbe. I due centri sono nella mappa: all'avvio
quello della CPU diventa `enemy_centro` (skirmish.js skirmishPrepare).

**Padus** (sk_padus, 7000 x 7000): il Po da sud-ovest a nord-est fra le
basi, largo 170 px, tre ponti (al centro e due di lato); per parte oro e
pietra piccola vicino alla base, cinque boschi, un'altra miniera vicino al
ponte di lato e la pietra grande vicino al ponte centrale; strade dalla base
ai ponti. 528 alberi, 4 miniere, 2 pietre piccole, 2 grandi.

**La schermata** (menu.js): mappe a sinistra (quelle non ancora fatte
spente), la descrizione, i parametri a destra (un clic passa al valore
dopo), "Indietro" e "Inizia". I parametri si ricordano (localStorage
`535.skirmish`) e viaggiano con la partita (global.sk, anche nei
salvataggi): difficolta' (Facile, Normale, Difficile, Truccata), stile
della CPU (Equilibrato, Aggressivo, Difensivo, Economico, Predone, A caso),
vittoria (Conquista, Municipio, Punteggio a 20/40/60 minuti), risorse
iniziali, limite di popolazione (50/75/99), tregua (no, 5, 10 minuti),
nebbia (normale, esplorata, nessuna), giorno e notte, pioggia, posizione di
partenza (a caso, nord-ovest, sud-est). Tradotti nelle sei lingue.

**La partita** (skirmish.js): risorse iniziali uguali per i due (Truccata:
la CPU il doppio, e ogni consegna vale una volta e mezza, civilians.js
carriedValue); 3 lavoratori per parte; sk_manager ogni mezzo secondo:
tetto di popolazione scelto, fine della tregua (global.en.hold), vittoria e
sconfitta. Conquista: vince chi distrugge tutti gli edifici dell'altro (il
centro distrutto non fa perdere, buildings.js; il "mulino" invisibile del
centro non conta); Municipio: il centro; Punteggio: allo scadere il
valore di edifici, unita' e risorse (a pari punteggio vince la CPU),
prima come Conquista. Gli obiettivi in alto a destra: la condizione, la
tregua che scade, tempo e punteggi, difficolta' e stile del nemico.

**La CPU** (economy.js con skirmishEco): la regia economica di sempre
(lavoratori, depositi nuovi, ricostruzione, soldati, difesa, ondate) con i
numeri della difficolta' e dello stile, piu' tre cose nuove:
- il tetto di popolazione come il giocatore: 10 per centro e per casa,
  fino al tetto scelto;
- costruisce edifici nuovi (prima solo depositi e ricostruzioni): una casa
  quando e' a meno di 3 dal tetto, se no l'ordine dello stile (campi,
  caserme, stalle, torri, chiesa, fortezza), un cantiere alla volta;
- il posto (baseSpot): su anelli attorno al centro, libero, non sul fiume,
  a 40 px da altri edifici e dalle risorse, non dove ci sono soldati del
  giocatore, raggiungibile; i campi vicini al centro, le torri dalla parte
  del giocatore.
Il predone manda le ondate verso i lavoratori del giocatore.
Prova (Padus, Normale, Equilibrato, giocatore fermo): al 5o minuto 16
lavoratori, 3 campi, una casa, 4 magazzini (ora al piu' 3 nuovi), una
caserma; al 7o 11 soldati, 2 caserme, una stalla, una torre; all'8o 20
soldati e 3 case; prima ondata al 9o minuto, centro del giocatore distrutto
al 10o. Vittoria provata con Conquista, Municipio e Punteggio, con la
tregua di 5 minuti. Passano `soak` e `saves` su sk_padus (aggiunta alla CI)
e le prove unitarie.

**Prossimi passi**: le altre quattro mappe; la CPU che si adatta (esplora,
sceglie le truppe contro quelle del giocatore, difende i lavoratori); il
bilanciamento con partite CPU contro CPU a parti scambiate (serve una CPU
anche dal lato del giocatore); le statistiche a fine partita.

### 9.119 Lo schermo intero: un pulsante tondo in alto a destra

Richiesta dell'autore (8 novembre 2026, stessa PR, versione 0.2609): con
"Schermaglia" la colonna della schermata iniziale si affollava. "Schermo
intero" esce dalla colonna e diventa un pulsante tondo in alto a destra
(menu.js `drawFullButton`): lo stesso cerchio di vetro dei pulsanti della
campagna (indietro e lucchetto, raggio 30, a 50 px dagli angoli) col simbolo
di sempre, quattro angoli verso l'esterno per entrare e verso il centro per
uscire. Solo dove il browser lo permette, come prima. La colonna torna a
quattro pulsanti (tutorial, campagna, schermaglia, carica). Provato: il
cerchio si accende sotto il puntatore e il clic entra nello schermo intero.
Foto all'autore.

### 9.120 La schermata della schermaglia senza riquadro

Richiesta dell'autore (8 novembre 2026, stessa PR, versione 0.2609): come
nel menu di pausa, niente riquadro bianco di sfondo; titolo e descrizione
della mappa in nero con un alone bianco (menu.js `glowText`, lo stesso di
pause.js `_glowLabel`), i pulsanti di vetro sopra la battaglia del menu.
"Indietro" non e' piu' un pulsante in fondo: e' il cerchio in alto a destra
della campagna (raggio 30, a 50 px dagli angoli, ico_indietro). Esc torna
indietro come prima. Provato: il cerchio si accende sotto il puntatore, il
clic torna alla schermata iniziale. Foto all'autore.

### 9.121 La schermata della schermaglia dal disegno dell'autore

Disegno dell'autore (8 novembre 2026, stessa PR, versione 0.2609).
- **A sinistra un riquadro solo**: la foto della mappa, sotto il nome fra
  due frecce (si scorrono le cinque mappe; quelle non ancora fatte spengono
  "Inizia"), sotto la descrizione in corsivo. I font del gioco non hanno il
  corsivo: draw.js `slant`, i quadrilateri delle lettere inclinati attorno
  alla linea di base (0,2).
- **La foto** (tools/17_cartoline.mjs, Node e Playwright, col gioco in
  esecuzione): la mappa vera senza nebbia, di giorno, senza pioggia ne'
  unita', alla vista piu' larga (zoom 1,7), centrata nel punto `shot` della
  mappa (skirmish.js SK_MAPS), ritaglio 720 x 480 al centro di uno schermo
  1600 x 900 (fuori l'interfaccia e il bagliore del puntatore); scrive
  nuovi/sprites/<room>_cartolina.png (versionato, gruppo campagna). Padus:
  il centro della base nord-ovest col bosco e la miniera. Provvisoria: va
  rifatta quando la mappa avra' le decorazioni.
- **A destra i parametri in una griglia 3 x 3** di riquadri: titolo in alto,
  l'icona del valore fra due frecce, il nome del valore in basso; la meta'
  sinistra del riquadro torna al valore prima, la destra va a quello dopo.
  La posizione di partenza esce dalla schermata (sempre a caso; resta fra i
  parametri). "Giorno e notte" ha tre valori (ciclo, sempre giorno, sempre
  notte, come nel disegno), la pioggia tre (normale, frequente: fra una
  pioggia e l'altra un terzo, 6000-12000 passi invece di 20000-35000, la
  prima a 3000; mai).
- **Icone** (provvisorie, da rifare con l'autore): difficolta' = da una a
  quattro spade (ico_attacco, decisione dell'autore); risorse = i quattro
  simboli delle risorse, piu' grandi a ogni livello (decisione
  dell'autore); stile = bilancia (linee), spade incrociate, scudo, oro,
  cavallo, "?"; vittoria = rovina, centro, campana; popolazione = le
  persone (ico_multi) piu' grandi; tregua = la bandiera coi minuti, o le
  spade incrociate se non c'e'; nebbia = onde (piu' tenui se esplorata,
  l'occhio se nessuna); giorno e notte = sole, falce di luna, tutti e due.
  `ico_bandiera` e `ico_campana` non erano nell'atlas (nessun GML le usa):
  tools/05_atlas.py `PORTING_SPRITES`.
- **La pioggia nel riquadro della pioggia** (richiesta dell'autore): il
  sistema di particelle della partita (le gocce di effects.js, piu' lente,
  piu' scure e corte quanto il riquadro), un sistema del menu: una goccia a
  passo con "Normale", tre con "Frequente", niente con "NO".
Provato: frecce avanti e indietro, la mappa in arrivo che spegne "Inizia",
le scelte salvate; una partita con sempre notte (notte per 30000 passi) e
pioggia frequente (la prima a 50 s, due in 8 minuti). Foto all'autore.

### 9.122 Padus decorata: ponti dipinti, strade, alberi, fiori, nebbia

Richiesta dell'autore (8 novembre 2026, stessa PR, versione 0.2609): le
decorazioni le mette il porting; i ponti dell'autore; un po' di nebbia; la
foto della mappa con gli angoli come il riquadro.
- **Ponti dipinti** (tools/16 `painted_bridge`, punti col nome come in
  Tiled, §9.100): tre `pontedx specchiato` al posto dei rettangoli. Il piano
  del ponte attraversa un fiume inclinato di ~22 gradi: il Po al centro lo e'
  gia' (-21,8), vicino ai ponti di lato il fiume e' stato raddrizzato a -22,7.
  L'immagine non si ruota col gemello (la stessa specchiata nel punto
  ruotato); il ponte al centro e' gemello di se stesso (il controllo lo
  ammette). Provato: tre cavalieri attraversano i tre ponti.
- **Strade**: dalla base alle risorse di casa, lungo la riva fra il ponte di
  lato e quello centrale, verso il bosco di mezzo (strada2).
- **Decorazioni** (tools/16 `scatter`: a caso nella meta' della base A,
  lontano da oggetti solidi, fiumi e strade; col gemello): 20 alberi sparsi
  per parte, macchie d'erba (burst_erba1) e di particelle, due di grano, i
  quattro tipi di fiori, ciuffi d'erba e di fiori. `prato1` provato e tolto:
  in gioco e' un anello bianco, sembra un recinto.
- **Nebbia** (skirmish.js `sk_nebbia`, `sk_nube`; oggetti nuovi in
  nuovi.json): dove dice la mappa (SK_MAPS mist, col gemello ruotato), 5
  nuvole (lo sprite fog1 del menu) a opacita' 0,5, che scivolano a destra a
  0,5 px a passo, svaniscono dopo 6000 passi e rinascono ogni 2400. Non e'
  fog01 del menu: la sua presenza cambia l'inseguimento dei nemici [C].
  Padus: lungo il Po.
- **La foto** (tools/17): sul ponte centrale; angoli arrotondati (Pillow,
  raggio 46 px nella foto, ~25 a schermo come il riquadro).
- **Obiettivi**: nella schermaglia il riquadro e' alto quanto le righe (prima
  quattro righe fisse, una vuota).
Costi: con le decorazioni Padus costa come il livello 5 (soak: 4000 passi
in 10,4 s col rendering software, prima 2,3), e il salvataggio passa da 0,5
a 8 MB (quasi tutto particelle d'erba e fiori; il livello 6: 3,9). Passano
`npm test`, `soak` (menu, sk_padus), `saves` (sk_padus), `--check`.

### 9.123 Urbs: la citta' romana al centro, la pietra solo nelle rovine

Indicazioni dell'autore (8 novembre 2026, stessa PR, versione 0.2609): una
citta' romana come quella del livello 1 al centro, le rovine di pietra solo
li', le macchie di lastricato come nel livello 6; fiumi e montagne a scelta.
Scelte del porting (all'autore):
- **Risorse**: la pietra solo nella citta' (ha senso: nel Medioevo Roma era la
  cava di se stessa, Colosseo e Fori smontati per secoli), l'oro, il legno e
  il cibo fuori, vicino alle basi e sui fianchi. Si va al centro per la
  pietra, ma senza si vive.
- **Niente fiume** (Padus e' gia' la mappa del fiume; il Tevere che
  attraversa la citta' la taglierebbe in due allo stesso modo); **due colli**
  per parte (montagna_7, montagna_8) ai fianchi della citta': due o tre
  strade verso il centro.
**La mappa** (sk_urbs, 7000 x 7000; tools/16 `urbs`):
- il lastricato: una macchia di city2 attorno al centro (anello irregolare
  di 40 punti, simmetrico da se': meta' a caso e meta' ruotata, tools/16
  `patch_ring`), e un tratto di strada lastricata per parte (`patch`);
- il Colosseo (ocr_teatro) col centro della maschera al centro della mappa
  (`center_obj`: gemello di se stesso), basilica e tempio per parte,
  colonne, statue e fontane del foro;
- le rovine di pietra (stone_parent): per parte due castelloruin, due
  chiesaruin, due torreruin, tutte raggiungibili dalle due basi (provato:
  da 3 a 4 lati liberi per rovina, posti di lavoro da 8 a 24 liberi);
- gli isolati: le case della citta' (ocr_01...45) su una griglia sulle due
  direzioni delle file del livello 1 (passo (150, -40) e (45, 95)), una
  strada ogni 5 case e ogni 3 file, qualche casa crollata (piazzette), solo
  fra il foro e il bordo della citta'; le case si toccano fra loro (come nel
  livello 1) ma stanno lontane da rovine, monumenti e strade. 126 case;
- fuori: per parte la base, una miniera vicino e una sul fianco, cinque
  boschi, trenta alberi sparsi, erba, grano, fiori; strade dalla base alla
  citta' (la marcata) e di lato.
tools/16: `center_obj`, `patch_ring`, `patch` (le macchie nel livello
macchie, e nel controllo della simmetria), lo spazio libero misurato fra i
centri delle maschere (anche gli oggetti sparsi: Padus ne ha avuto qualcuno
spostato, sempre simmetrica). Il gioco carica anche l'atlas della citta'
(SK_MAPS `tiers`).
La foto del menu: il Colosseo. Prove: la CPU da sola (Normale,
Equilibrato) costruisce la base, porta in casa la pietra della citta' (fino
a 330), attacca al nono minuto; `soak` e `saves` su sk_urbs (aggiunta alla
CI), `--check`, prove unitarie.

### 9.124 Silva Umbra: il bosco dappertutto, radure e strade

Indicazioni dell'autore (8 novembre 2026, stessa PR, versione 0.2609): il
bosco quasi ovunque, solo strade senza alberi a collegare; le risorse sparse
fra i boschi; niente montagne; fiumi al massimo sul bordo, stretti, senza
ponti, per decorazione.
**La mappa** (sk_silva, 7000 x 7000; tools/16 `silva`):
- il bosco: alberi su una griglia sfalsata (passo 130 x 78, un po' a caso;
  tools/16 `forest_fill`) dappertutto tranne radure, strade, ruscelli e
  attorno alle risorse: 2836 alberi (Padus ne ha 590);
- le radure, per parte: la base (1000 x 800 px, lo spazio per costruire,
  anche per la CPU), cinque radure di risorse (tre d'oro, una di pietra
  piccola, una di pietra grande), e al centro, contesa, una miniera e una
  pietra grande per parte; oro e pietra piccola anche nella base;
- le strade (strada2, larghe 90, con ~110 px di bosco tolto per lato: un
  corridoio di ~300 px): base-centro, base-radure, radure fra loro, e una
  strada di fianco che lega le radure di un lato a quelle dell'altro;
- due ruscelli larghi 70 lungo il bordo sinistro e destro (tools/16
  `edge_river`: fiumi interi col gemello, che non passano dal centro),
  lontani dalle strade, senza ponti;
- fiori ed erba solo nelle radure; la nebbia (§9.122) al centro e in due
  radure.
La foto del menu: una radura con la miniera, i fiori e la nebbia.
**Costo**: soak 4000 passi in 14,1 s (Urbs 9,3, Padus 10,8; rendering
software), salvataggio 6,1 MB. Prove: la CPU da sola (Normale, Equilibrato)
costruisce nella radura (3 campi, 4 case, 2 caserme, 2 stalle, una torre,
una chiesa), attacca lungo le strade e al decimo minuto distrugge il centro
di un giocatore fermo; `soak` e `saves` su sk_silva (aggiunta alla CI),
`--check`, prove unitarie.
Nota per le mappe nuove: tools/07_scene.py vuole gia' la foto della mappa
(nuovi.json la elenca): se ne mette una provvisoria, si genera la scena,
poi si fa quella vera con tools/17 e si rifa' l'atlas.

### 9.125 Rivoaltus: la laguna, canali, isole e i ponti dell'autore

Indicazioni dell'autore (8 novembre 2026, stessa PR, versione 0.2609): la
mappa lagunare coi ponti dipinti dell'autore, le decorazioni come nelle
altre, la densita' delle isole a scelta del porting.
**La mappa** (sk_rivo, 7000 x 7000; tools/16 `rivoaltus`):
- **canali**: il Canal Grande dal centro a -22 gradi e due paralleli a 2100
  px (larghi 170), due canali verticali a x 2250 e 4750 (larghi 150), con
  qualche curva lontano dai ponti; **rii**: quattro canali laterali curvi
  che si stringono (da 130-160 a 40-50 px; tools/16 `edge_river` con la
  larghezza finale, `larghezza_fine` come in Tiled); **laguna aperta** negli
  angoli fra le basi (larga 900). Circa nove isole di terra, frastagliate:
  la densita' media (scelta del porting), abbastanza acqua da essere una
  laguna, isole grandi abbastanza per le basi e per combattere.
  (Specchi d'acqua corti e larghi provati e tolti: vengono squadrati.)
- **ponti**: tredici, dell'autore: `pontedx specchiato` sui canali a -22
  gradi (il piano li attraversa come a Padus), `pontedx2` sui canali
  verticali (la sua fascia percorribile va da sinistra a destra, ~360 px);
  il Rialto al centro, gemello di se stesso. Provati tutti: un cavaliere per
  ponte, da una riva all'altra.
- **isole**: la base (oro e pietra piccola, un bosco), l'isola a ovest
  (oro, bosco), l'isola in alto (pietra grande, bosco), l'isola a sud-ovest
  (oro, bosco), e le due isole al centro, contese: oro, una chiesa in rovina
  (pietra) e qualche casa di citta'. Tutte le risorse si raggiungono dalle
  due basi; strade fra i ponti, che si fermano alle rive.
- nebbia sui canali; decorazioni come nelle altre mappe.
**Le decorazioni lontano dai ponti dipinti** (tools/16 `free`, BRIDGE_R
300 px): una macchia d'erba a particelle disegnava i fili d'erba sul piano
del ponte. Vale per tutte le mappe: Padus ne ha avute un paio spostate (e la
foto rifatta). Le macchie d'erba a Rivoaltus stanno anche a 300 px dall'acqua.
La foto del menu: il canale verticale col ponte ad archi (pontedx2), le case
e il bosco. Prove: la CPU (Normale, Equilibrato) costruisce sull'isola della
base, attacca al nono minuto passando dai ponti; soak 4000 passi in 8,4 s;
`saves` (5,5 MB) e `soak` su sk_rivo (aggiunta alla CI), `--check`.

### 9.126 Fiumi irregolari e strisce di terra fra le isole

Indicazioni dell'autore (8 novembre 2026, stessa PR, versione 0.2609): i
fiumi hanno una forma troppo regolare, sembrano canali artificiali; meglio
percorsi non dritti, un po' frastagliati, e in qualche punto, al posto dei
ponti, strisce di terra fra le isole.
**Il percorso** (tools/16 `meander`): la linea data si infittisce ogni 60 px
e ogni punto si sposta lungo la normale di due onde lunghe (le anse:
ampiezza `amp`, lunghezza `wl` e una seconda a 0,43 wl) piu' due corte (la
riva frastagliata: `jag`, onde di 420 e 300 px), con fasi dal seme della
mappa; poi tre passate di media 1-2-1. Vicino ai ponti dipinti lo
spostamento va a zero (entro ~300 px): il fiume resta dritto e inclinato
come il ponte, che continua ad attraversarlo. Con `fix_end` gli ultimi punti
restano fermi (il mezzo fiume che arriva al centro, col gemello ruotato).
Le onde corte a 170/260 px, con i punti ogni 80, facevano uno spigolo a V
nella riva del Po: tolto con onde piu' lunghe, passo piu' fitto e la media.
La laguna larga (900 px) solo con le anse, a passo largo (le onde corte su
un nastro cosi' largo fanno un pettine).
- **Padus**: il Po con anse ampie (amp 190, wl 1700).
- **Silva Umbra**: i ruscelli sul bordo piu' tortuosi (amp 60, wl 800).
- **Rivoaltus**: canali e rii irregolari; **sei strisce di terra** (tools/16
  `cut`: il canale si interrompe entro un raggio, ~230-240 px): sul canale
  verticale in alto e in basso e sul parallelo a nord al centro, con i loro
  gemelli. I ponti passano da tredici a sette (il Rialto, due sul Canal
  Grande, due sul parallelo, due pontedx2 sui canali verticali); le strade
  passano sugli istmi.
- Urbs non ha fiumi.
Prove: `--check` (simmetriche tutte e quattro); a Rivoaltus tutte le
risorse raggiungibili dalle due basi e i sette ponti attraversati da un
cavaliere; `soak` e `saves` su sk_padus, sk_silva, sk_rivo; prove unitarie.
Rifatte le foto delle tre mappe (tools/17) e l'atlas.

### 9.127 Mons Bardonis: la cresta, i tre valichi e gli alberi sui tagli

Indicazioni dell'autore (8 novembre 2026, stessa PR, versione 0.2609):
l'ultima mappa, con gli sprite delle montagne che ci sono, incrociati in modo
che non si vedano gli spigoli tagliati dritti degli sprite, magari coperti
da alberi non tagliabili o da altre decorazioni come nel tutorial e nel
livello 3; qualche ruscello decorativo ai margini.
**La mappa** (sk_bardonis, 7000 x 7000; tools/16 `bardonis`): il Monte
Bardone, il valico della Cisa sulla via Francigena. Una cresta di montagne
attraversa la mappa da un bordo all'altro fra le due basi, con tre valichi
larghi 450-550 px: al centro la via Francigena (strada marcata, il valico fa
una S fra le due montagne), e due di lato, equidistanti dalle due basi.
Ogni base ha la sua valle (la A in alto): oro e pietra piccola vicino al
centro, una miniera in fondo alla valle, una davanti al valico vicino, la
pietra grande ai piedi della cresta, una torre in rovina (pietra) davanti al
valico lontano, boschi. Montagne negli angoli e ai bordi delle valli; due
ruscelli stretti per parte che escono da sotto una montagna e vanno al
bordo (si stringono alla sorgente). Nebbia sui valichi.
- **La cresta orizzontale**: in diagonale gli sprite (larghi e bassi)
  lasciavano buchi a scalini. Per il muro le montagne con la maschera precisa
  (1, 4, 5, 9); la 6, la 7, la 8 e la 3 come contrafforti. Non la 2: ha la
  maschera a ellisse su tutto il rettangolo, mentre la roccia disegnata no.
  Controllato su una griglia di 25 px con le maschere: coi valichi chiusi
  le due valli sono separate, coi valichi aperti si passa da ciascuno.
- I valichi sono equidistanti dalle due basi (stanno sul confine fra le due
  meta'), quindi le montagne non ruotate (che non sono simmetriche) li
  restringono in modo diverso ma ugualmente per i due giocatori.
**Gli spigoli tagliati** (tools/16 `cover_cuts`): gli sprite 1, 2, 4 e 5
hanno lati tagliati dritti (misurati sull'alfa: la 1 in alto a destra, la 2
in basso, la 4 e la 5 a sinistra e in basso). Lo script prende ogni
montagna della mappa intera e lungo ogni lato tagliato mette un albero non
tagliabile (albero_fake) ogni ~58 px, salvo dove il lato e' fuori dalla
mappa o sotto una montagna disegnata davanti (depth -y: quella con l'origine
piu' in basso). Un boschetto, non una siepe: posti a caso, e file in piu'
sempre piu' rade. La chioma sta fra 24 e 144 px sopra il tronco, larga
+-55: sotto un lato in basso il tronco va fuori (60 px sotto), per gli
altri lati i tronchi stanno sulla roccia, dove non intralciano. (Prima
stavano anche fuori, nel valico di sinistra: un cavaliere si incastrava fra
i tronchi.) Questi alberi non hanno gemello (lo sprite del gemello non si
ruota, il suo lato tagliato e' dalla stessa parte): `--check` li accetta se
stanno su un lato tagliato. Dove si puo' i lati tagliati vanno fuori dalla
mappa (la montagna in alto) o sotto un'altra montagna.
**Le decorazioni non sulla roccia**: `free` scarta i punti sulla roccia
(alfa degli sprite delle montagne), con un margine di r + 100 px per le
macchie d'erba e di fiori (le particelle si allargano: una disegnava l'erba
sulla montagna).
Prove: `--check` (simmetrica); tutte le risorse raggiungibili dalle due
basi; un cavaliere per valico in ciascun verso; la CPU (Normale,
Equilibrato) costruisce nella sua valle e attacca al nono minuto passando
dai valichi; `soak` e `saves` (5,7 MB) su sk_bardonis (aggiunta alla CI);
prove unitarie. La foto del menu: il valico centrale con la via
Francigena. Con questa le cinque mappe della schermaglia ci sono tutte.

### 9.128 Mons Bardonis: strade attorno alle montagne, montagne piccole sui tagli

Indicazioni dell'autore (8 novembre 2026, stessa PR, versione 0.2609): le
strade sono poche e troppo dritte, devono girare attorno alle montagne e
devono essercene di piu'; gli alberi attorno alle montagne sono troppo
regolari: dove servono, meglio una seconda montagna piccola sopra.
**Le strade** (tools/16 `road_auto`): A* su una griglia di 40 px della mappa
intera (montagne, oggetti solidi e ruscelli, gemelli compresi), a piu' di
150 px dalla roccia e un po' oltre dove c'e' posto. Il percorso della griglia
(solo 0, 45 e 90 gradi) si riduce a un punto ogni ~160 px, poi le anse:
ogni punto si sposta di lato (due seni, fino a 170 px) quanto lascia la
roccia, e mai vicino agli estremi; infine tre passate di Chaikin. Sulle
strade che ci sono gia' il costo e' 0,75: dove la nuova ci corre sopra non
si ridisegna, parte o arriva li' (l'incrocio). (Con 0,35 la strada per il
valico di sinistra faceva il giro dalla via Francigena e dal valico
centrale.) Ora per parte: la via Francigena al valico centrale, la strada
lungo la valle alla miniera in fondo, quella al valico di sinistra e oltre
nella valle dell'altro (con il valico come tappa), alla pietra e alla
miniera di sinistra, alla pietra grande, una a mezza valle fra i due
valichi, una verso il ruscello e una che entra dal bordo in alto: venti
tratti in tutto, coi gemelli.
**Le montagne piccole sui tagli** (tools/16 `cover_mountains`): per ogni
montagna della mappa intera con un lato tagliato in vista, fino a tre
montagne piccole (3, 6, 7, 8) fra le posizioni attorno al lato: quella che
ne copre di piu' e sporge meno dalla roccia che c'e' gia', mai dentro i
valichi o sulle risorse. Deve stare davanti (l'origine piu' in basso): una
montagna dietro che riempie oltre il lato lascia una cucitura dritta, roccia
su roccia, che si vede (provato e tolto). Per questo il lato in alto della
1 non si copre con una montagna (quella davanti sta piu' in basso): la 1
non c'e' piu'. La cresta ora e' tutta con la 9 (nessun lato tagliato; la 5
aveva il lato sinistro sul valico centrale, dove una montagna piccola lo
chiudeva), in alto la 4 con due montagne piccole davanti (il gemello in
basso con una). Restano sei alberi non tagliabili sparsi (cover_cuts, per
quel che avanza), al posto dei 158 in fila. Le montagne piccole non hanno
gemello (come gli alberi): `--check` le accetta se stanno su un lato
tagliato.
I valichi (larghi ~375 px quello centrale, ~425 quelli di lato, secondo la griglia con le maschere):
il valico di sinistra ora e' a x 1220.
Prove: `--check` (simmetriche tutte); le due valli separate coi valichi
chiusi; tutte le risorse raggiungibili dalle due basi; un cavaliere per
valico in ciascun verso; la CPU (Normale, Equilibrato) attacca al nono
minuto; `soak` e `saves` su sk_bardonis; prove unitarie. Foto del menu
rifatta (il valico centrale con la via Francigena).

### 9.129 I nomi delle mappe in italiano

Decisione dell'autore (8 novembre 2026, stessa PR, versione 0.2609): i nomi
delle mappe della schermaglia tornano all'italiano, piu' intuitivo dei nomi
storici in latino, tradotti nelle altre lingue dove il nome esiste.
| room | prima | it | en | es | pt | de | fr |
|---|---|---|---|---|---|---|---|
| sk_padus | Padus | Padania | Padania | Padania | Padânia | Padanien | Padanie |
| sk_urbs | Urbs | Urbe | Urbe | Urbe | Urbe | Urbe | Urbe |
| sk_rivo | Rivoaltus | Laguna | Lagoon | Laguna | Laguna | Lagune | Lagune |
| sk_silva | Silva Umbra | Foresta Umbra | Umbra Forest | Bosque Umbra | Floresta Umbra | Umbra-Wald | Forêt Umbra |
| sk_bardonis | Mons Bardonis | Appennini | Apennines | Apeninos | Apeninos | Apennin | Apennins |
Urbe (Roma, "la citta'") non ha un corrispondente nelle altre lingue:
resta Urbe. Il nome in SK_MAPS (game/src/skirmish.js) e' la chiave inglese
come per gli altri testi, tradotto in texts.js; la scheda della mappa ora
lo passa per `tr` (prima il nome era lo stesso in tutte le lingue). Le
room, i file e le funzioni di tools/16 restano coi nomi di prima (sk_padus,
`padus()`...: nomi interni, cambiarli toccherebbe i salvataggi).
Controllato nella schermata della schermaglia in italiano, tedesco e
francese; prove unitarie.

### 9.130 CI: il controllo delle mappe della schermaglia e le versioni di Pillow

Nella PR andlll/535collapse#19 la CI falliva su `tools/16_schermaglia.py
--check`: tutte e cinque le mappe "non e' quella che scrive tools/16",
mentre in locale passava. Riprodotto in un clone pulito coi passi della CI
(Python 3.11, Pillow installato da pip: 13.0): l'unica differenza era la
larghezza e altezza degli oggetti tile di fiori_papaveri nei .tmx (348 x 308
con il Pillow 12.3 di qui, 348 x 310 con il 13.0). Sono le misure
dell'immagine del kit di Tiled (tools/11 `decor_image`: Pillow ridimensiona
e ruota i fiori, poi la ritaglia sull'alfa) e cambiano di un paio di pixel
con la versione di Pillow; nello scenario non entrano (il controllo degli
scenari nella CI passava). Il confronto di `--check` ora ignora larghezza e
altezza degli oggetti tile (`tile_free`) e guarda tutto il resto: passa qui
e nel clone pulito come nella CI, e un oggetto spostato di 1 px lo fa
ancora fallire.

### 9.131 Schermaglia: barra dei campi nemici, arcieri e cavalieri a caccia, macchie lontane dalle basi, icone e riquadro del menu

Richieste dell'autore (9 novembre 2026, PR nuova, versione 0.2610):
- **La barra della vita dei campi nemici blu** (era verde, quella del campo
  del giocatore): enemy_campo (economy.js) ha il suo Draw_End con
  `lifeBar(..., 0xff0000)` (BGR: il blu degli altri edifici nemici), solo se
  il campo e' visibile.
- **Arcieri e cavalieri della CPU a caccia di unita'** (solo nella
  schermaglia): non danno fuoco agli edifici (il cavaliere ha `fire: false`,
  l'arciere non ha l'Alarm_4), ma l'ondata li mandava contro l'edificio del
  giocatore piu' vicino alla base (di solito il centro) e, arrivati (ruolo
  32), di nuovo contro l'edificio piu' vicino: si ammassavano attorno al
  centro e, con la meta dentro l'edificio (spostata a caso a ogni passo da
  `placeEmpty`/`placeFree`), giravano su se stessi. Ora (economy.js `hunts`,
  `huntTarget`) nell'ondata vanno verso l'unita' del giocatore piu' vicina al
  bersaglio dell'ondata (col loro flow field), e da fermi verso l'unita' del
  giocatore piu' vicina a loro (lavoratori, soldati, macchine d'assedio); i
  fanti continuano a dare fuoco. Senza unita' del giocatore restano fermi.
  Nella campagna non cambia niente.
- **Foresta Umbra: le macchie a particelle lontane dai centri**. Il raggio di
  `free` per burst_erba1 era 150 px, ma il gioco sparge i fili d'erba in
  un'ellisse di 500 x 300 px (effects.js): quattro macchie per base
  coprivano il centro all'avvio. Ora tools/16 (`on_base`, PATCH_SIZE) scarta
  le macchie (erba, grano, fiori) la cui ellisse, allargata del raggio del
  centro (330), contiene un centro delle basi. Vale per tutte le mappe:
  cambiano anche Padania (una macchia di fiori a 447 px) e Urbe (una macchia
  d'erba al limite; per l'ordine del generatore casuale altre decorazioni
  cambiano tipo, non posto). Foto di Foresta Umbra rifatta (due decorazioni
  vicine al punto della foto sono cambiate).
- **Icone del menu della schermaglia** (disegni dell'autore, nuovi/sprites
  `sk_*.png`, derivati `ico_sk_*` in nuovi.json, neri al 70% come le icone
  dell'originale): la mano con la bilancia per lo stile Equilibrato (al posto
  della bilancia a linee), la colomba per la tregua (al posto della
  bandiera), la nuvola col vento per la visibilita' (al posto delle onde;
  Esplorata piu' tenue), la luna per Sempre notte e Ciclo (al posto della
  falce a linee; il sole resta a linee), la freccia indietro (specchiata per
  avanti) al posto del triangolo di linee, sulle mappe e sui parametri. Le
  spade incrociate marroni (ico_battle: stile Aggressivo, tregua NO) sono
  ora quelle nere della caserma (ico_caserma).
- **"Nebbia" diventa "Visibilita'"** (nel gioco c'e' anche la nebbia vera,
  sk_nebbia, §9.122): Normale, Esplorata, Totale (prima "Nessuno": senza
  nebbia di guerra si vede tutto). Esplorada in spagnolo e portoghese
  (visibilidad/visibilidade, femminili).
- **Il riquadro della mappa finisce al bordo basso della terza fila** dei
  parametri (prima arrivava fino a "Inizia"). La descrizione deve starci in
  tutte le lingue: drawSkirmish misura la piu' lunga nella lingua attuale
  (righe da 30 px, larghezza del riquadro) e skLayout rimpicciolisce la foto
  (3:2, centrata, almeno 120 px d'altezza) quanto serve. Su uno schermo basso
  (1024 x 600) dove nemmeno cosi' ci sta, il riquadro scende quanto serve
  (fino a 40 px dal fondo). Controllato con Urbe (la descrizione piu' lunga)
  in sei lingue a 1024 x 600, 1280 x 720, 1366 x 768 e 1920 x 1080: a 1280 x
  720 la foto resta intera in inglese e italiano, piu' piccola in tedesco,
  francese, spagnolo e portoghese.
- **Con la visibilita' Esplorata o Totale le risorse si vedono da subito**
  (richiesta arrivata durante il lavoro): alberi, miniere, pietre e rovine si
  rivelavano solo con un'unita' o un edificio del giocatore vicino (gli alberi
  anche senza nebbia di guerra, le altre no); ora `reveal` (civilians.js) le
  rende visibili se `g.sk.fog` non e' "normal". Provato su Padania: con
  Normale 18 alberi su 598 e una miniera su 4 visibili all'avvio, con
  Esplorata e Totale tutti.
- **La foto della Laguna** (troppo simile a quella di Padania: un ponte su un
  corso d'acqua in un prato): ora l'isola contesa a nord-ovest del Rialto, col
  rio, il ponte ad archi (pontedx2), le case e la chiesa in rovina (shot
  2590, 2700).
Prove: prove unitarie; `tools/16 --check` (simmetriche tutte e cinque);
`soak` 4000 passi su menu, sk_silva, sk_urbs, sk_padus e `saves` su sk_silva,
senza errori; le due basi di Foresta Umbra fotografate all'avvio (nessuna
macchia sui centri). Arcieri e cavalieri: partita su Padania (Difficile,
Equilibrato, lavoratori del giocatore a 1800 px dal centro), 80 campioni
dopo la prima ondata: prima della modifica 149 posizioni su 235 entro 600 px
dal centro senza unita' del giocatore entro 500 px e nessuna a caccia; dopo,
0 attorno al centro e 235 su 1040 a meno di 500 px da un'unita' del
giocatore (Predone: 1 e 295 su 732).

### 9.132 Nemici senza piu' bersagli: fermi in attesa

Richiesta dell'autore (9 novembre 2026, stessa PR, versione 0.2610), dopo il
caso trovato nelle prove di §9.131: quando non resta nessuna unita' del
giocatore, un nemico che ne stava inseguendo una restava in cammino verso
l'ultimo posto dell'inseguito (warwork 1, meleeGo) e, se li' non si arrivava
(un cavaliere contro il bordo della mappa), scattava avanti e indietro sul
posto per sempre: l'attacco (enemyAttack, e `attack` dell'arciere) usciva
subito senza alleati e nessuno chiudeva l'inseguimento. Ora (enemies.js
`noTargetLeft`) chi inseguiva, colpiva o andava a un posto da cui tirare si
ferma dov'e' (azione 0, fermo, senza animazione di cammino) in attesa di
nuovi ordini: la regia della CPU, o gli edifici da incendiare per chi puo'.
Non tocca chi va a dare fuoco, chi si ritira o chi va al presidio.
Prova: arciere, cavaliere, guerriero e picchiere che inseguono i lavoratori
del giocatore su Padania; tolti i lavoratori, arciere e cavaliere si fermano
subito e in 400 passi non si spostano (stesso sprite), guerriero e picchiere
vanno a incendiare il centro. `soak` 3000 passi su menu, match, lvl01,
lvl02, lvl05 e sk_padus, `melee.mjs`, prove unitarie: senza errori.

### 9.133 Menu della schermaglia: l'occhio e i lingotti

Richiesta dell'autore (9 novembre 2026, stessa PR, versione 0.2610): per la
visibilita' Totale e per lo stile Economico della CPU i suoi disegni a
risoluzione maggiore (nuovi/sprites `sk_occhio.png`, 100 x 100, e
`sk_oro.png`, 64 x 64; derivati `ico_sk_occhio`, largo 64, e `ico_sk_oro`,
largo 56, neri al 70% come le altre icone del menu), al posto di
ico_view_small (30 px, disegnata a 1,6) e ico_gold (27 px, disegnata a 2),
che ingrandite si vedevano sgranate. Disegnati a 0,8 e 0,9: grandi come
prima (~51 e ~50 px). Le risorse iniziali tengono le loro icone piccole.

### 9.134 La partita su file: ".dvgame"

Decisione dell'autore (9 novembre 2026, stessa PR, versione 0.2610): formati
propri per i file del gioco, ".dvgame" per le partite e (quando ci saranno
le mappe da passarsi) ".dvmap" per le mappe. Il gioco resta solo web: niente
icona dei file ne' apertura col doppio clic (servirebbe il gioco installato,
come app o versione desktop), solo l'estensione, che vale subito per tutti.
**Il file** (save.js `saveFile`): `dustveil-<room>-<data>.dvgame`, lo stesso
JSON firmato di prima compresso con gzip (CompressionStream; senza, in
chiaro con la stessa estensione), tipo application/octet-stream (con
application/json qualche browser aggiunge ".json" al nome). Una partita su
Padania: 7,7 MB di JSON, 1,9 MB di file.
**Il caricamento** (`openFile`, `fileText`): accetta ".dvgame" e ".json";
se i primi due byte sono quelli del gzip (1f 8b) decomprime, se no legge il
testo: i file ".json" salvati prima si aprono ancora. Un gzip rovinato e'
"file non valido" come prima. Lo usano il menu di pausa e "Carica da file"
del menu principale.
Prova (Chromium): salvataggio dal menu di pausa su Padania (nome, gzip),
caricamento del ".dvgame" e di un ".json" in chiaro: la partita si riapre;
prove unitarie.

### 9.135 Il ".dvgame" non si apre a mano

Richiesta dell'autore (9 novembre 2026, stessa PR, versione 0.2610): una
chiave perche' non si alterino i dati col blocco note. C'era gia' il
checksum (FNV-1a con un sale, Fase 4: un numero cambiato scarta il file), e
dal §9.134 il file e' compresso: illeggibile nel blocco note, ma un gzip
normale, che 7-Zip apre al volo mostrando il JSON. Ora (save.js `packFile`,
`scramble`, `bytesText`) dopo il gzip i byte si mescolano (XOR con la
sequenza di un xorshift32 seminato da una chiave fissa) e il file comincia
con "DVG1": non e' piu' un archivio ne' contiene testo leggibile. Il
caricamento riconosce l'intestazione e rimette a posto i byte; legge ancora
il gzip semplice (i ".dvgame" del §9.134, mai usciti) e i ".json" in chiaro.
Non e' crittografia vera: in un gioco tutto nel browser la chiave sta nel
codice, come il sale del checksum. Scoraggia chi vuole cambiare un numero;
per modificare una partita bisogna leggere il codice del gioco. Se un giorno
ci saranno classifiche online, i punteggi andranno controllati da un server.
Prove: prova unitaria nuova (intestazione, niente gzip ne' testo leggibile,
andata e ritorno, i tre formati, un byte cambiato scartato); nel browser
salvataggio su Padania (1,9 MB, "DVG1", `gzip -t`: "not in gzip format") e
caricamento del ".dvgame" e di un ".json" di prima.

### 9.136 La descrizione della mappa: giustificata, senza corsivo

Richiesta dell'autore (9 novembre 2026, stessa PR, versione 0.2610): nella
schermata della schermaglia la descrizione della mappa giustificata, e senza
il corsivo, che compariva solo li'. Il corsivo era finto (draw.js `slant`,
§9.121: i glifi inclinati): tolto dal motore, non lo usava nessun altro.
**Giustificato** (draw.js `justify`, come opzione di textExt: con una
larghezza e allineato a sinistra): ogni riga andata a capo si allarga fino
alla larghezza del riquadro distribuendo lo spazio in piu' fra le parole;
l'ultima riga di ogni paragrafo e una riga di una parola sola restano
allineate a sinistra. Gli a capo sono gli stessi di prima (l'altezza della
descrizione, §9.131, non cambia); con lo spazio in piu' le lettere si
posano sul pixel intero. Controllato in italiano (Foresta Umbra,
1920 x 1080), tedesco (Urbe, 1280 x 720) e francese (Appennini, 1366 x 768).

### 9.137 Gli effetti sonori: il motore audio e il colpo d'ascia

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): dalla
registrazione "Knocking on wood" (Freesound 594389, Elandre01, CC0: uso
commerciale libero, senza obblighi) isolare i colpi e usarli come varianti
del taglio della legna. Il gioco originale non ha suoni e il motore non
aveva l'audio: questa e' la prima parte.
**I file** (`nuovi/audio/`): l'originale (1,5 s, 48 kHz, 24 bit, due canali
identici), `audio.json` (per ogni suono il file d'origine, i tagli delle
varianti in ms, le dissolvenze, il volume nel gioco) e `CREDITI.md` (fonte,
autore e licenza di ogni file: le licenze devono permettere l'uso
commerciale). Nella registrazione quattro colpi, attacchi a 193, 522, 853 e
1201 ms, coda sopra il rumore di fondo (-71 dB) per 50-80 ms: tagli di 200
ms da 4 ms prima dell'attacco, dissolvenza di 2 ms in entrata e 80 ms in
uscita.
**tools/18_audio.py** (solo ffmpeg, anche nella CI dopo tools/05-07): taglio,
mono, dissolvenze, picco di ogni variante a -3 dBFS (le varianti suonano
uguali di volume; il volume nel gioco e' `gain`), MP3 mono a 96 kbit/s (lo
leggono tutti i browser) -> `game/assets/audio/legno_1..4.mp3` (3 KB
l'uno) e `audio.json`. Chromium li decodifica a 200 ms esatti (il ritardo
dell'encoder MP3 viene tolto).
**game/src/audio.js** (`audio`, Web Audio):
- i suoni si scaricano all'avvio; l'AudioContext nasce al primo clic o
  tasto (il browser non lascia partire l'audio prima): fino ad allora, e
  nelle prove senza gesti, play() non fa niente;
- `play(nome, x, y)`: una variante a caso (non la stessa di prima), altezza
  +-7% e volume +-15% a caso; volume pieno dentro la vista, che cala fino a
  zero a 700 px dal bordo; un po' a destra o a sinistra secondo la x nella
  vista;
- al massimo 4 suoni uguali insieme e non due dello stesso nome a meno di
  45 ms.
**Il colpo d'ascia** (civilians.js `workTick`, lo stesso istante dello
scossone dell'albero, §9.105): per i boscaioli del giocatore e della CPU,
non per quelli nemici nascosti nella nebbia. `gain` 0,55: da regolare a
orecchio quando ci saranno gli altri suoni.
**"Effetti sonori: SI'/NO"** nel menu di pausa (settings.sfx, si ricorda).
Con una riga in piu' a 1024 x 600 l'ultimo pulsante usciva dallo schermo
(e le opzioni grafiche, dieci righe, uscivano gia'): ora su uno schermo
basso pulsanti e spazi si stringono (fino a 30 e 4 px); a 720 px e oltre
non cambia niente.
Prove (Chromium): prima del clic nessun AudioContext; dopo, attivo e le
quattro varianti decodificate; tre boscaioli del giocatore su Padania con
la vista sull'albero: 45 colpi suonati in 25 s (uno ogni ~0,65 s ciascuno,
uno scartato per i 45 ms), quelli della CPU lontani dalla vista zittiti;
con "Effetti sonori: NO" nessun suono. Menu di pausa e opzioni grafiche a
1024 x 600 (tedesco) e 1280 x 720. Lo zip per i portali contiene l'audio;
`soak` su menu, match, sk_padus; prove unitarie. L'ascolto vero e' dell'autore.

### 9.138 Il colpo di piccone su oro e pietra

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): dalla
sua registrazione per miniere e pietra (`nuovi/audio/miniere_pietra.wav`,
10,5 s, mono, 96 kHz, 24 bit) lo stesso lavoro del legno (§9.137).
**I colpi**: diciotto, ogni 0,55-0,75 s (attacchi da 162 a 10191 ms), picchi
da -20 a -12 dB, ognuno scende di 60 dB in ~135 ms; prima di ogni attacco
-62 dB o meno, rumore di fondo -94 dB. (Il primo rilevamento, con la soglia
del legno sul rumore di fondo, prendeva le code: qui il fondo e' molto piu'
basso; ora gli attacchi sono le salite di 15 dB oltre -45 dB.) Tutti e
diciotto come varianti: tagli di 250 ms da 4 ms prima dell'attacco,
dissolvenza di 2 e 100 ms, picco a -3 dBFS.
**tools/18**: l'MP3 arriva a 48 kHz, le registrazioni a 96 si ricampionano
(`-ar 48000`). `piccone_1..18.mp3`, 3,7 KB l'uno; tutto l'audio 79 KB.
**Il volume**: a parita' di picco i due suoni hanno lo stesso volume
percepito (RMS nei primi 100 ms dopo l'attacco: -23,7 dB il legno, -23,8 il
piccone), quindi lo stesso `gain` 0,55.
**Nel gioco** (civilians.js `workTick`): oro (miniera_oro) e pietra
(stone_parent: pietre e rovine), nello stesso istante delle schegge e della
polvere (§9.107), con le stesse regole del legno (non i lavoratori nemici
nascosti nella nebbia).
Prova (Chromium, Padania, vista sulla risorsa, 15 s): tre lavoratori alla
miniera d'oro 35 colpi suonati, 16 varianti diverse; alla pietra 30 colpi,
15 varianti; mai la stessa variante due volte di fila. Prove unitarie.
`nuovi/audio/audio.json` riscritto con i tagli su una riga per suono.

### 9.139 Spade e archi

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): dalle
sue registrazioni i colpi di spada per gli attacchi di soldati e cavalieri,
e tre archi ("da pulire") per arcieri, torri ecc.
**Le spade** (`nuovi/audio/spade.wav`, 5,25 s, mono, 48 kHz): sei colpi
(attacchi a 497, 1298, 2137, 2990, 3908, 4726 ms), molto deboli (picchi da
-46 a -41 dBFS: alzati di 28-33 dB), energia fra 1,2 e 10 kHz, una lunga
coda metallica (-30 dB dopo 140-500 ms). Il rumore di fondo (-92 dB) e' per
meta' rimbombo sotto gli 80 Hz: passa-alto a 250 Hz (24 dB/ottava), che le
spade non toccano (niente sotto i 600 Hz). Tagli di 500 ms, la coda sfumata
negli ultimi 300.
**Gli archi** (`arco1..3.wav`, 44,1 kHz, i due canali uguali): un colpo per
file, ma dal 90 al 96% dell'energia era sotto i 100 Hz: il colpo d'aria sul
microfono (o l'urto), non la corda. Provati tre passa-alto: a 100 Hz e 24
dB/ottava ne restava il 26-49%; a 150 Hz e 48 dB/ottava niente, col picco
quasi uguale (la parte che si sente e' il corpo e la corda, 200-1200 Hz, e lo
schiocco fino a 10 kHz); a 250 Hz se ne andava anche un po' di corpo. Scelto
150 Hz, 48 dB/ottava. Tagliati via i due clic a 1,37 e 1,45 s di arco1 e il
silenzio digitale coi due residui dopo 0,5 s di arco2. Tagli di 350 ms, la
coda sfumata negli ultimi 150.
**tools/18**: un taglio puo' venire da un altro file (terzo elemento:
`[inizio, fine, "file"]`, le tre varianti dell'arco da tre file) e ogni suono
puo' avere un `filtro` (filtri di ffmpeg) prima delle dissolvenze.
**I volumi**: a parita' di picco le spade, con la coda, suonano 6 dB piu'
forti (RMS nei primi 100 ms -17,6 dB contro -23,6 di ascia e piccone):
`gain` 0,28; gli archi filtrati come ascia e piccone, 0,55. Tutto l'audio
133 KB.
**Nel gioco**:
- `spada`: il colpo in mischia che arriva, nello stesso istante del sangue
  (§9.117), sul bersaglio. Per giocatore e CPU: soldati, picchieri e
  cavalieri (units.js meleeStrike, enemies.js enemyStrike).
- `arco`: la freccia che parte (ranged.js allyArrow ed enemyArrow, create):
  arcieri, torri, castelli e centri, del giocatore e della CPU. La CPU tira
  sempre a un'unita' del giocatore a portata: si sente anche se chi tira e'
  nella nebbia, come si vede la freccia che arriva.
- La battaglia di sfondo del menu principale e' muta (`audio.world`): dopo
  il primo clic nel menu si sarebbero sentite spade e frecce.
Prova (Chromium, Padania, tre guerrieri e due arcieri del giocatore contro
tre guerrieri e un arciere della CPU, vista sulla mischia, 12 s): 22 colpi
di spada e 18 frecce suonati (gli altri fermati dal tetto di 4 voci e dai 45
ms); nel menu, dopo il clic, 226 colpi della battaglia di sfondo e nessuno
suonato. Prove unitarie.

### 9.140 Il martello: costruzione e riparazione

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): dalla
sua registrazione (`nuovi/audio/martello.wav`, 0,3 s, mono, 48 kHz) i colpi
di martello di chi costruisce o ripara.
**Il colpo**: uno solo (attacco a 37 ms, -50 dB dopo 70 ms). Come negli
archi il 97% dell'energia era sotto i 120 Hz (un tonfo), e prima del colpo
un brusio grave a -47 dB; una nota fissa a ~630 Hz che lo spettrogramma
mostrava per tutto il file e' a -87 dB, trascurabile. Passa-alto a 150 Hz a
48 dB/ottava come per l'arco: brusio a -77 dB, restano un po' di corpo
(120-250 Hz) e il tac (2-8 kHz). Taglio di 250 ms, sfumato negli ultimi 120.
**Una variante sola**: `altezza` per suono (audio.json, nel manifest `pitch`,
game/src/audio.js): il martello varia di +-12% invece di +-7%. Gain 0,75:
filtrato suona 2,7 dB piu' piano di ascia e piccone. Con piu' colpi
registrati le varianti si aggiungono in `tagli`.
**Nel gioco** (civilians.js `otherWorkTick`): la costruzione (azione 6:
cantieri, il ponte del livello 4, i cantieri della CPU) e la riparazione
(azione 7: edifici, mura, il monastero) aggiungono vita a ogni fase (13
passi); il colpo una volta per ciclo (39 passi, ~0,65 s, come l'ascia), alla
fine, e solo se il lavoro e' andato avanti (non senza il legno o la pietra);
non dei lavoratori nemici nascosti nella nebbia. Non la semina dei campi.
Prova (Chromium, Padania, tre lavoratori, vista sul lavoro, 10 s): una casa
costruita con 17 colpi suonati (uno ogni ~0,25 s in tutto); il centro
riparato da meta' vita con 28 colpi; senza legno ne' pietra nessun colpo.
Prove unitarie.

### 9.141 La pioggia: un loop che entra ed esce con le gocce

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): dalla
sua registrazione della pioggia (`nuovi/audio/pioggia.wav`, 61 s, stereo,
44,1 kHz) un loop piu' breve, che entri ed esca con una dissolvenza e resti
piano finche' piove.
**La registrazione**: molto bassa (livello medio -64 dB, gocce isolate fino
a +30 dB sopra la media), stereo largo (correlazione fra i canali 0,19),
energia fra 600 Hz e 10 kHz; niente rimbombo ne' toni da togliere (il piu'
forte, 36 Hz, +8 dB in una banda quasi vuota): solo un passa-alto a 60 Hz.
**Il tratto**: su finestre di 8, 10 e 12 s, quella con meno gocce che
spiccano (oltre +22 dB), il picco piu' basso e il livello piu' costante: da
51 a 59 s (5 gocce, livello costante entro 0,25 dB su mezzo secondo). In un
giro breve una goccia forte si riconoscerebbe a ogni ripetizione.
**tools/18, i loop** (`loop` in audio.json): il tratto e gli `incrocio_ms`
(1,5 s) che lo seguono, dissolti a potenza costante (qsin) sull'inizio:
l'ultimo campione continua nel primo. Due ingressi dallo stesso file, ognuno
dal suo punto: con un ingresso solo diviso in due (asplit) il mixer si
fermava dopo pochi millisecondi (il file da 1 KB della prima prova).
`stereo` tiene i due canali (MP3 a 128 kbit/s). Il volume sul livello medio
(`rms_db` -26 dBFS) e non sul picco, e un limitatore a `limite_db` -12 dBFS
(14 dB sopra la media) smussa le gocce piu' forti, che si fondono col resto.
Risultato: 8,000 s esatti (anche decodificato da Chromium), livello -27 dBFS
costante entro 0,4 dB ogni mezzo secondo; alla giunzione il salto fra
l'ultimo e il primo campione e' come quello fra due campioni vicini; 129 KB.
**Nel gioco** (game/src/audio.js `ambient`): un suono continuo, senza
posizione, al volume livello x gain (0,2: piano, ~11 dB sotto gli effetti).
Il manager lo chiama a ogni passo col livello delle gocce (`rain.level`,
manager.js), che sale e scende in 5 s: il suono entra ed esce con loro, piu'
una costante di tempo di 1 s; parte da un punto a caso del giro; qualche
secondo dopo che il livello e' tornato a 0 il loop si ferma. Con "Effetti
sonori: NO" si spegne subito, anche a gioco in pausa.
Prova (Chromium, Padania): all'inizio della pioggia il volume resta a zero
finche' non cadono le gocce (prima il cielo si copre), poi sale con loro;
alla fine scende a zero in ~4 s e il loop si ferma; di nuovo la pioggia e
"Effetti sonori: NO" in pausa: fermo subito. Prove unitarie.

### 9.142 La pioggia cosi' com'e' registrata

Correzione dell'autore (10 novembre 2026, stessa PR, versione 0.2610) dopo
l'ascolto di §9.141: "manca il rumore di fondo e in generale e' molto
forte, limitati a tagliare e comprimere l'originale". Tolti il passa-alto,
il limitatore sulle gocce e il volume portato a -26 dBFS (35 dB in piu',
poi gain 0,2: in tutto ~21 dB sopra la registrazione). Ora il loop e' il
tratto da 51 a 59 s cosi' com'e': solo tagliato, con la fine dissolta in
1,5 s sull'inizio (non cambia il suono: senza, il giro scatterebbe a ogni
ripetizione) e convertito in MP3. tools/18: `volume_originale` (nessun
guadagno) e `kbit` per suono. A 128 kbit/s l'MP3 di un fruscio cosi' basso
perdeva 8 dB sopra i 16 kHz: 256 kbit/s senza il taglio degli acuti
(`-cutoff 20000`), bande uguali all'originale entro 0,1 dB (sopra i 16 kHz
-1,3 dB); 252 KB (tutto l'audio 389 KB). Livello -61 dBFS come l'originale,
8,000 s, giunzione senza salti. Nel gioco gain 1: il volume della
registrazione, che entra ed esce con le gocce come prima.
Prova (Chromium): il loop decodificato a 8,000 s, stereo; il volume segue
le gocce fino a 1 e alla fine scende a zero; prove unitarie.

### 9.143 La musica: il primo loop a parti (archi e field recording)

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): i
loop musicali a parti, mixati nel gioco. Prima la traccia unita (`535_loop1`,
3:30, MP3), poi le parti: gli archi (`loop1_archi.mp3`, 42 s, MP3 320 kbit/s)
e il field recording (`loop1_field.wav`, 92 s, WAV 16 bit), tutti a 44,1 kHz
stereo; il drone arrivera'. Il mix: il field al volume della traccia unita
la mattina, che scende verso la notte e riparte la mattina; gli archi circa
costanti ("ci ragioniamo"); il drone da zero, piu' alto quanta piu'
popolazione ha il giocatore.
**La traccia unita**: livello costante (medio -28 dBFS, picco -12,8); senza
un battito netto (il BPM non esce dagli attacchi). Per bande: la fascia a ~2
kHz e la linea a ~3 kHz si ripetono ogni ~42 s (e ~84); melodia e gravi con
un passo di 1,25 s. Gli archi vi ritornano a 0, 42, 84, 126, 168 s (il file
da 42 s ripetuto); il field non si ritrova al campione (un altro tratto o
un'altra versione). **I livelli**: le forme d'onda non coincidono col file
(correlazione 0,08, nel mix suonati o elaborati un po' diversi): confrontati
gli spettri medi a quarti d'ottava sopra i 566 Hz, la traccia unita e' archi
a +0,0 dB e field a -0,75 (errore medio 0,5 dB): i file sono gia' al livello
del mix, gain 1. Sotto i 400 Hz la traccia unita ha molta energia che non e'
di archi ne' field: il drone, grave.
**Le parti** (tools/18, "musica"; solo tagliate e convertite, §9.142):
- archi: l'MP3 non ha l'intestazione col riempimento dell'encoder (si
  decodifica in 1608 blocchi interi, 216 campioni, 4,9 ms, oltre i 42 s),
  tutti nel silenzio iniziale (il primo suono a 294 ms): tagliati, il giro
  torna a 42,000 s (altrimenti 5 ms di troppo a ogni giro). Ricodificato a
  320 kbit/s (1,7 MB).
- field: 92,000 s cosi' com'e', MP3 a 256 kbit/s senza taglio degli acuti
  (bande uguali all'originale, sopra i 16 kHz -4 dB; a 160 kbit/s -11): 2,9
  MB.
tools/18: `loop` con `incrocio_ms` 0 (solo il taglio, al campione: ms coi
decimali), la frequenza dell'originale (si ricampiona solo oltre i 48 kHz),
la durata decodificata stampata per i loop.
**Da sapere** (lasciato com'e', da decidere con l'autore): gli archi
partono dal silenzio e salgono in ~2,5 s mentre alla fine suonano pieni
(-36 dB): a ogni giro rientrano (succede anche nella traccia unita, dove gli
altri suoni lo coprono); il field ha una dissolvenza in entrata (~2 s) e una
in uscita (~2,5 s): a ogni giro (92 s) un respiro. Esportati con "Render as
Loop" di Ableton (le code riportate all'inizio) e senza dissolvenze girano
pieni.
**Il motore** (game/src/audio.js `music`): le parti partono nello stesso
istante e girano ognuna sul suo giro (si sfasano come nella traccia unita);
una parte decodificata dopo entra al punto giusto del suo giro; il volume di
ognuna segue quello dato dal gioco in ~2,5 s; un volume generale della
musica a parte dagli effetti. "Musica: SI'/NO" nel menu di pausa
(settings.music). Nel menu principale niente musica, per ora.
**Il mix** (game/src/music.js, dal manager ogni 10 passi): archi 1; field 1
all'alba, giu' in linea col giorno (il primo 6000 passi, poi 4000: il
manager ora tiene `dayLen`, anche nei salvataggi) fino a 0 al tramonto,
zitto di notte, risale con l'alba (global.night da 1 a 0); niente ciclo
("sempre giorno") 1, "sempre notte" e livello 1 zitto; drone popolazione /
50, fino a 1. I numeri sono in MUSIC (music.js), da regolare a orecchio.
Prove: music.test.mjs (nuova: il field nelle fasi del giorno, il drone, gli
archi); nel browser (Padania) i loop decodificati a 42 e 92 s esatti; field
0,9 a inizio partita, 0,46 a meta' giorno, 0 di notte, 0,9 dopo l'alba,
archi a 1; "Musica: NO" ferma, "SI'" riparte; nel menu niente. Prove
unitarie.

### 9.144 La musica: il drone

Richiesta dell'autore (10 novembre 2026, stessa PR, versione 0.2610): la
terza parte del primo loop, il drone (`nuovi/audio/loop1_drone.wav`, 214 s,
WAV 16 bit, 32 kHz, stereo), che parte da zero e sale con la popolazione.
**Il file**: livello medio -29 dBFS, il 93% dell'energia sotto i 200 Hz: e'
la parte grave della traccia unita (§9.143), dove entra a 0 dB: archi a 0,
field a -0,75 e drone a 0 ricostruiscono la traccia unita con 0,4 dB di
errore medio su tutte le bande. Tutte e tre le parti sono al livello del mix.
**Solo tagliato e convertito**: 214,000 s, MP3 a 96 kbit/s e 32 kHz (per un
suono cosi' grave le bande sono le stesse che a 128 e 160 kbit/s), 2,6 MB.
Le tre parti 6,9 MB, tutto l'audio 7,3 MB.
**Da sapere** (lasciato com'e', come archi e field): il drone sale da -70 a
-28 dB nel primo secondo e mezzo e scende da -30 a -39 negli ultimi 0,6 s;
alla giunzione il salto fra l'ultimo e il primo campione e' 20 volte quello
tipico: a ogni giro (3:34) un calo e probabilmente un colpo grave. Esportato
con "Render as Loop" e senza dissolvenze girerebbe pieno.
**Nel gioco**: music.js lo aveva gia' (popolazione / 50, fino a 1).
Prova (Chromium, Padania): decodificato a 214 s, stereo; volume 0,06 con 3
di popolazione, 0,49 con 25, 0,99 con 50, 1 con 80, 0,02 tornati a 0.

### 9.145 La musica in tutti i livelli; le parti da riesportare

Decisione dell'autore (10 novembre 2026, stessa PR, versione 0.2610): per
ora le tre parti restano come sono; vanno riesportate come loop (annotato
in "Cose da fare", in cima). Domanda: la musica e' in tutti i livelli? Si':
la guida il manager (music.js, §9.143), che c'e' in ogni room; solo il menu
principale e' muto (audio.musicRoom). Controllato nel browser, dopo un clic
e 9 s, volumi (archi, field, drone):
| room | notte | popolazione | archi | field | drone |
|---|---|---|---|---|---|
| menu | 0 | 14 | - | - | - |
| match | 0 | 5 | 0,98 | 0,91 | 0,10 |
| lvl01 | 1 | 8 | 0,98 | 0 | 0,16 |
| lvl02 | 0 | 28 | 0,98 | 0,90 | 0,55 |
| lvl03 | 0 | 21 | 0,98 | 0,91 | 0,41 |
| lvl04 | 0 | 10 | 0,98 | 0,91 | 0,19 |
| lvl05 | 0 | 61 | 0,98 | 0,90 | 0,97 |
| lvl06 | 0 | 36 | 0,98 | 0,91 | 0,70 |
| sk_rivo | 0 | 3 | 0,98 | 0,90 | 0,06 |
(gli archi a 0,98: stanno ancora salendo dall'entrata in dissolvenza.) Il
livello 1 e' sempre di notte: li' il field non si sente mai. La musica e'
la stessa ovunque (un solo loop); con altri loop si potra' sceglierne uno
per livello.


### 9.146 Gli inceppamenti e mp_potential_step: misura e un passo nuovo

Domanda dell'autore (12 novembre 2026, versione 0.2611): gran parte degli
"inceppamenti" che si vedono in gioco (alleati e nemici) possono venire da
`mp_potential_step`? Si puo' sostituirlo, o ripensare l'ultimo tratto del
pathfinding?

**Misura.** Per attribuire ogni inversione di marcia al meccanismo che ha
mosso l'unita' in quel passo, contatori provvisori (non versionati) in
`mpPotentialStep` (dritto, scarto fino a 45, 90, oltre 90 gradi, giro sul
posto), `moveFlowField` (percorso, fondo del campo con separazione, uscita da
una cella chiusa) e `stepOver`; poi `crowd.mjs` (seme 3) e `movement.mjs`
(semi 1 e 2: otto ordini di gruppo, cinque incroci, uno scontro). Col codice
di prima:

| prova | inversioni | da mp_potential_step | dal flow field | da stepOver |
|---|---|---|---|---|
| movement, seme 1 | 305 | 168 (55%) | 124 | 13 |
| movement, seme 2 | 236 | 141 (60%) | 95 | 0 |
| crowd "nemici" | 425 (+196 giri sul posto) | 425 (100%) | 0 | 0 |
| crowd "fuoco" | 33 | 24 | 4 | 0 |
| crowd "attacco" | 104 | 31 | 2 | 71 |
| crowd "mischia" | 107 | 33 | 44 | 30 |
| crowd "punto" | 179 | 0 | 178 | 0 |

Quindi **si', in buona parte**: nei nemici quasi tutto, negli ordini di
gruppo degli alleati piu' della meta' (pur muovendo con uno scarto dalla
meta solo l'1,7% dei passi in cammino: quando scarta, inverte). Il motivo:
senza memoria, a ogni passo provava prima un lato e poi l'altro, fino a
180 gradi, e chi era stretto fra altre unita' andava a +90 gradi, poi a -90,
poi indietro (le coppie di passi "scarto < 45 -> scarto > 90" e viceversa
sono le piu' frequenti); senza nessuna direzione libera girava sul posto.
Ma **non tutto**: l'altra grossa fonte e' il fondo del flow field. Chi vi
arriva sovrapposto a un altro si separa (verso la sua meta o via
dall'altro), esce dalla cella, e il campo lo riporta dentro: in "punto" 134
inversioni su 179 sono questo ping-pong fra i due rami di `moveFlowField`; e
in mischia `stepOver` (§9.71) e i cambi fra campo e passo dritto.

**Ora** (pathing.js `mpPotentialStep`, stesso contratto e stessi chiamanti):
- direzioni solo entro 90 gradi dalla meta, a passi di 15 gradi, in ordine
  di scarto; a pari scarto prima il lato dell'ultima volta (la prima volta
  quello lontano dal centro di chi sbarra il passo), tenuto finche' la
  strada dritta non resta libera per 8 passi;
- nessuna direzione a oltre 90 gradi dal passo di prima (un'inversione):
  meglio fermi, al piu' SIDE_HOLD = 20 passi, poi anche quella;
- nessuna direzione: fermi, senza girare sul posto (decidono i chiamanti
  quando rinunciare: arriveIfBlocked, moveStalled, chaseStuck);
- gia' sovrapposti a qualcuno (nessun passo e' libero finche' non ci si
  stacca): come prima, tutte le direzioni fino a 180 gradi.

**Provato e tolto.**
- Guardare 3 passi avanti solo gli ostacoli fissi (le unita' si muovono):
  in mischia si arrivava addosso agli altri e si combatteva peggio (18
  contro 18, semi 7 e 11: alleati tutti morti, prima vincevano).
- Il lato tenuto per 20 passi anche con l'altro libero: idem, in mischia.
- Al fondo del campo, tenere la direzione di separazione e restare fermi
  appena staccati: "punto" da 179 a 43 inversioni al seme 3, ma tremolio
  7 e 6 ai semi 7 e 11 (soglia 5), e con una finestra di 3 passi invece di
  1 peggio di prima. Fragile: e' parte del ripensamento (sotto).

**Dopo** (semi 3 / 7 / 11 per crowd, 1 / 2 per movement; prima -> ora):

| prova | misura | prima | ora |
|---|---|---|---|
| nemici | inversioni | 425 / 389 / 408 | 58 / 48 / 28 |
| nemici | finestre di tremolio | 10 / 17 / 14 | 2 / 0 / 0 |
| mischia | inversioni | 107 / 177 / 185 | 40 / 33 / 74 |
| mischia | coppie sovrapposte >= 3 s | 6 / 7 / 6 | 0 / 2 / 3 |
| mischia | passi x coppie sovrapposte | 4591 / 4566 / 4159 | 872 / 1251 / 3512 |
| mischia | alleati vivi alla fine | 9 / 6 / 7 | 10 / 7 / 8 |
| attacco | inversioni | 104 / 109 / 99 | 74 / 87 / 41 |
| attacco | coppie sovrapposte >= 3 s | 4 / 1 / 5 | 6 / 11 / 6 |
| fuoco | inversioni | 33 / 96 / 81 | 54 / 32 / 49 |
| circondato, riva | finestre di tremolio | 1 / 1 / 1 | 0 / 0 / 0 |
| movement | inversioni | 305 / 236 | 135 / 99 |
| movement | giri sul posto | 6 / 4 | 4 / 6 |
| movement | sprite che torna alla faccia di prima | 299 / 248 | 189 / 213 |
| movement, scontro | nemici rimasti, alleati vivi | 5 e 12 / 7 e 11 | 6 e 10 / 8 e 10 |

"punto" e' uguale (va col solo flow field). In "attacco" le coppie
sovrapposte a lungo sono alleati che colpiscono o che cercano un posto con
`stepOver`, non passi di mp_potential_step: col passo nuovo ai soli alleati
3 / 1 / 3, ai soli nemici 9 / 3 / 4, a tutti 6 / 11 / 6 (lo scontro cambia
forma; il seme 3 della CI resta sotto la soglia di 10).

`crowd.mjs`: soglia nuova per i nemici, al piu' 150 inversioni (col codice
di prima 425). `lvl05.mjs`, la sortita: "tornati" erano quelli entro 150 px
dal posto, ma la ritirata arriva a 120 px e poi i nemici fermi sovrapposti
si separano fino a 128 px (settleEnemies, §9.116): col passo nuovo la
partita prende un'altra strada fin dalla battaglia d'apertura e due nemici,
arrivati a 118-120 px, venivano spostati a 163-173 px. Ora entro 250 px
(120 + 128); col codice di prima la prova passa lo stesso. Le altre prove
della CI nel browser, soak e salvataggi compresi, passano.

**Resta, e il ripensamento proposto.** Gli inceppamenti che restano vengono
dal fatto che l'ultimo tratto ha quattro modi di muoversi, con regole di
collisione diverse, e l'unita' salta dall'uno all'altro: il flow field (senza
collisioni, verso la cella del capo o della meta, non verso la casella di
ognuno), il fondo del campo (separazione senza collisioni), il passo dritto
(mp_potential_step, tutte le collisioni) e stepOver (sopra i compagni). Le
soglie che scelgono il modo (400 px, "sovrapposto", "in vista") fanno
oscillare fra modi che tirano in direzioni diverse. Proposta: un solo
"ultimo tratto" per unita', dal punto in cui vede la propria meta (o a una
o due celle dal fondo del campo) fino all'arrivo, con un campo piccolo e
fine (celle da 8-16 px, una finestra di ~20 x 20 celle attorno all'unita')
verso la sua casella, in cui gli ostacoli fissi e le unita' ferme sono
chiusi e quelle in cammino costano di piu', ricalcolato ogni qualche passo;
e un solo modo di arrivare (la casella o, se occupata da chi e' gia'
arrivato, il punto libero piu' vicino del campo piccolo). Al posto del passo
dritto, del fondo del campo e di stepOver; il flow field grande resta per il
viaggio.

### 9.147 L'ultimo tratto: un campo fine attorno all'unita'

Richiesta dell'autore (12 novembre 2026, stessa PR, versione 0.2611): passare
al nuovo ultimo tratto proposto in §9.146. Poi, durante il lavoro,
[indicazione dell'autore] le prove di combattimento vanno fatte con il
sistema nuovo per **tutte e due** le parti: vincere uno scontro contro una
parte che si muove male non dice che il sistema e' migliore. Le prove con
una parte sola sono servite solo a capire dove guardare; i giudizi sotto
sono tutti con le due parti sullo stesso sistema, e su misure di movimento
(inversioni, sovrapposizioni, tremolio, arrivo), non su chi vince.

**Il modulo** (`game/src/lastmile.js`). Vicino alla meta (400 px; chi c'e'
gia' ci resta fino a 550, se no al confine il campo comune, verso la cella
del capo, e l'ultimo tratto, verso la propria casella, tiravano da parti
opposte un passo per uno: in `movement.mjs` 359 inversioni cosi'):
- un campo per unita' (Dijkstra dalla meta) su celle da 16 px, nella
  finestra che contiene unita' e meta piu' 160 px (al piu' 72 x 72 celle);
- ostacoli fissi guardati con la maschera vera dell'unita' messa al centro
  della cella (edifici, alberi, mura, acqua; le porte secondo la parte, con
  le griglie enemyBlock / enemyPass), in una cache per forma della maschera
  e per parte, rifatta quando cambiano gli ostacoli (solidVer); le unita'
  dell'altra parte chiuse; quelle della propria parte si attraversano ma
  costano (2 per cella se camminano, 8 se ferme: con 40 si facevano giri di
  centinaia di px attorno alla formazione, settle.mjs);
- rifatto ogni 10 passi, quando la meta cambia cella o quando il passo e'
  bloccato; l'unita' punta al punto piu' lontano del percorso (fino a 8
  celle) che vede in linea retta e fa un passo con le collisioni vere (sopra
  i compagni si passa); passo chiuso: scarti fino a 75 gradi senza invertire
  la marcia, se no ferma; ferma 15 passi di fila, o meta non raggiungibile
  nella finestra: per 30 passi il modo di prima;
- gia' sovrapposti a un ostacolo (appena usciti da un edificio): un passo va
  se non tocca niente di nuovo, cosi' se ne esce seguendo il campo (prima
  restavano dentro la caserma: rally.mjs);
- la faccia dello sprite cambia solo se la direzione esce dal suo settore di
  45 gradi di oltre 10 gradi (girando di pochi gradi al passo sul confine lo
  sprite saltava avanti e indietro).

**Chi lo usa.** Ordini di movimento e chi va a dare fuoco (fanti, cavalieri,
arcieri), i nemici che non inseguono (non le ondate in marcia, la strada
del livello 4, la colonna del livello 6), le macchine d'assedio (siegeMove:
in `movement.mjs` la catapulta faceva 74 inversioni passando fra campo e
passo dritto, ora 0), i civili nello spostamento semplice e verso il posto
sul bordo del cantiere o dell'edificio da riparare (al posto di aroundTarget,
§9.102, che tornava al campo; dopo il controllo dei progressi di
edgeRescue, che fa cominciare il lavoro da dove si e').

**Non la mischia.** Provato con il campo fine per le due parti: inversioni
40/33/74 -> 64/115/91, nemici sovrapposti fra loro 0 -> 4306/535/587
("nemici"). La logica della mischia (posti attorno al bersaglio, melee.js;
uscita dalla sovrapposizione; attesa senza posto) e' tarata sul passo dritto
e su stepOver; da ripensare insieme a quella, a parte.

**Due regole vecchie corrette lungo la strada.**
- `moveStalled` (§9.71) scambiava per bloccato chi dava la precedenza a un
  compagno e lo fermava con pause che raddoppiano (1, 2, 4 s), anche dopo
  che l'altro se n'era andato: in marcia code di unita' ferme. Ora chi sta
  dando la precedenza non viene giudicato.
- Gli arcieri in marcia sovrapposti si aspettavano a vicenda (i fanti no,
  §9.38): ora non si aspetta chi aspetta noi.

**Dopo** (semi 3 / 7 / 11 per crowd, 1 / 2 per movement; prima = §9.146):

| prova | misura | prima | ora |
|---|---|---|---|
| punto | inversioni | 179 / 244 / 316 | 8 / 6 / 6 |
| punto | passi x coppie sovrapposte | 8993 / 14254 / 10685 | 4635 / 4985 / 4478 |
| punto | coppie sovrapposte alla fine | 2 / 2 / 1 | 0 / 0 / 0 |
| fuoco | inversioni | 54 / 32 / 49 | 37 / 29 / 21 |
| circondato, riva | passi x coppie sovrapposte | 2920 / 2417 / 2303, 2668 / 2121 / 2140 | 2150 / 2384 / 2120, 1889 / 1685 / 1919 |
| riva | inversioni | 5 / 10 / 2 | 22 / 5 / 11 |
| movement | inversioni | 135 / 99 | 21 / 43 |
| movement | sprite che torna alla faccia di prima | 189 / 213 | 74 / 99 |
| movement | in cammino / fuori casella a fine ordine | 1, 3 / 0, 2 | 0, 0 / 0, 0 |
| movement | coppie sovrapposte alla fine | 1 / 5 | 0 / 0 |
| rally | inversioni (caserma, stalla, centro) | 7 / 1 / 0 | 61 / 33 / 0 |

Attacco, nemici e mischia restano come prima (non usano l'ultimo tratto; i
numeri cambiano di poco). In `rally` le inversioni in piu' sono singole,
all'ingresso nell'ultimo tratto (il campo comune porta verso la cella del
capo, l'ultimo tratto verso il posto), al piu' 4 per unita' (soglia 20);
in ritardo, bloccati, lontani: 0 come prima.

`crowd.mjs`: "punto" al piu' 100 inversioni (col codice di prima 179).

**lvl06.mjs, la taratura** (la colonna contro le 15 torri piu' vicine al
percorso: ne passano al piu' 5). Con l'ultimo tratto, sotto carico, al seme
della prova ne passavano 6. Misurato su 6 semi: prima 6/6/6/4/4/5 (media
5,2), ora 4/3/6/6/5/6 (5,0); la colonna non usa l'ultimo tratto (lo usano
solo i lavoratori nemici), e anche col codice di prima la prova supera la
soglia in tre semi su sei: e' il seme fisso che decide. [Proposta
dell'autore] due torri in piu': con 17 prima 6/6/5/6/4/1, ora 4/6/9/7/6/6,
cioe' il caso pesa piu' delle due torri; non cambiato. Da sola la prova
passa (5); sotto carico lo stesso seme ha dato 6, quindi il risultato
dipende anche dal tempo reale (il ciclo del gioco della pagina, da
verificare). Decisione dell'autore (12 novembre 2026): il livello 6 va bene
cosi', la prova resta com'e'.

Le altre prove della CI nel browser, soak e salvataggi compresi, passano.

### 9.148 Livello 7, "Lost in the Fog": l'arciere della nebbia (prototipo)

Richiesta dell'autore (12-13 novembre 2026): la regia del livello 7, "fog" o
"Lost in the Fog", una specie di stealth con poche unita' o una sola che,
sfruttando la nebbia, si fa strada in un ambiente ostile: boschi, un
labirinto di mura, unita' alleate da liberare per tornare in forze e aprire
il passaggio (sconfiggere una guarnigione, o liberare macchine d'assedio per
distruggere un castello che chiude il passo).

**Cosa c'era gia'.** Vicino a una nuvola `fog01` i nemici si accorgono del
giocatore a meta' distanza (§9.80), di notte ancora a meta' (§9.88); le
pattuglie su percorsi disegnati in Tiled (§9.101); torri e fortezze nemiche
presidiate (§9.80); mura e porte nemiche (§9.75); la nebbia di guerra.

**Decisioni dell'autore.**
- Un arciere: in corpo a corpo e' l'unita' piu' debole, gli errori sono
  micidiali. Con lo sprite di sempre, e regole sue: due modi di tiro scelti
  con due pulsanti, piu' campo visivo.
- I banchi di nebbia si muovono **solo in orizzontale** (in diagonale o in
  verticale il disegno non regge); le pattuglie vanno in verticale e li
  incrociano: il giocatore sincronizza pattuglie e nebbia.
- Niente coni di vista disegnati: da dove guarda un nemico si capisce dallo
  sprite. Sopra chi non e' ignaro un "!": li' il tiro furtivo non va.

**Perche' l'arciere va fatto "speciale"** (misurato nel codice): un'unita'
del giocatore vede un'ellisse di 400 x 240 px, i nemici si accorgono a
400 px: vedeva i nemici solo quando loro vedevano lui. Una freccia ogni 56
passi, 6 di danno (13 frecce per un guerriero). E chi era colpito da oltre
400 px non reagiva: si poteva tirare per sempre.

**Il prototipo** (`game/src/stealth.js`; `?room=match&prova=nebbia`):
- *banchi di nebbia* (`nebbia_banco`): tre nuvole (fog1) che vanno avanti e
  indietro fra due x a velocita' fissa; la zona coperta e' un'ellisse larga
  quanto le nuvole (mezzi assi 520 x 150 px). Dentro, la vista dei nemici si
  dimezza: per chi e' guardato e per chi guarda (tutti e due dentro: un
  quarto);
- *la vista* (solo con `g.stealth`, enemies.js): davanti, 60 gradi per
  parte dalla direzione in cui il nemico guarda, fino alla distanza di
  sempre; ai lati e dietro solo a meno di 90 px (lo sente). Chi e' in
  allarme guarda tutto attorno;
- *l'allarme*: chi vede l'arciere, chi e' colpito senza morire e chi e' a
  meno di 300 px da un colpito "rumoroso" e' in allarme per 10 s; chi non
  combatteva gia' va a guardare da dove e' partita la freccia (searching).
  Sopra i nemici visibili non ignari un "!" rosso (`stealth_segni`);
- *l'arciere della nebbia* (un `ally_arciere` con `hunter`): vede 1,5 volte
  piu' lontano (600 x 360 px). Due pulsanti accanto ad attacco e difesa
  (`tiro_furtivo_clicker`, `tiro_rapido_clicker`; tasti F e R; per ora le
  lettere, in attesa delle icone):
  - **furtivo**: tira solo al bersaglio scelto col clic destro (niente tiri
    ne' inseguimenti da solo), da fermo, caricando 2 s, fino a 700 px; un
    nemico ignaro muore e nessuno se ne accorge; uno in allarme prende 3
    volte il danno (18) e il colpo fa rumore;
  - **rapido**: come l'arciere di sempre ma una freccia ogni ~0,5 s (28
    passi invece di 56), danno di sempre, e ogni colpo fa rumore;
- *la prova*: nella zona piu' aperta del match, tolti tutti, l'arciere a
  ovest, due pattuglie su percorsi verticali di 760 px (due guerrieri; un
  picchiere e un arciere), una sentinella girata verso ovest, due banchi che
  incrociano i percorsi (1,3 e 0,9 px a passo, in versi opposti).

**Prova** (`game/test/browser/stealth.mjs`, nella CI): i banchi restano a y
fissa e tornano indietro ai capi; le pattuglie fanno avanti e indietro
(727-771 px); un guerriero girato a est vede un soldato a 300 px davanti, non
a 300 px alle spalle, si' a 60 px alle spalle; col soldato nella nebbia non lo
vede a 300 px, si' a 150; furtivo su un ignaro: morto dopo 142 passi (il
caricamento), il vicino a 200 px non in allarme; furtivo su uno in allarme:
75 -> 57, vicino in allarme e diretto verso l'arciere; rapido: 75 -> 69 dopo
44 passi, il vicino in allarme verso l'arciere, quello a 600 px no.

**Altre decisioni dell'autore** (13 novembre 2026):
1. il tiro furtivo uccide **sempre** un nemico ignaro (com'e');
2. **solo di giorno, ma pieno di nebbia** (nella prova i banchi diventano
   quattro: 0,7 / 1,3 / 0,9 / 1,1 px a passo, due versi);
3. **l'allarme**: un nemico **solo** che si accorge dell'arciere, se arriva
   alla torre nemica piu' vicina, suona l'allarme e parte una pattuglia di
   rinforzo.

**Il messaggero e il rinforzo** (stealth.js `messengerFor`, `soundAlarm`,
`stealthStep`): "solo" = nessun compagno entro 350 px; la torre al piu' a
2500 px. Il messaggero non insegue ne' tira: corre a 130 px sotto la torre;
a 150 px suona l'allarme e, se la torre non ne ha mandato uno negli ultimi
30 s, nascono li' tre fanti (guerriero, picchiere, guerriero) in allarme,
diretti al punto in cui il messaggero ha visto l'arciere; finita la ricerca
tornano alla torre. Sul messaggero il "!" e' arancione (va fermato prima che
arrivi); sopra la torre che ha suonato, un "!" arancione grande per 5 s. Chi
e' in gruppo combatte come prima. Uccidere il compagno di una coppia in
silenzio lascia l'altro solo: se poi vede l'arciere, corre alla torre.

**Le torri nella nebbia** (enemygarrison.js `garrisonShoot`): con l'arciere
dentro un banco la torre tira solo entro 300 px (600 a meta'). Nella prova
una torre nemica, a nord-est.

**Prova**, casi nuovi: il messaggero (un guerriero solo, girato verso
l'arciere a 250 px): messaggero subito, non insegue, alla torre in 185
passi, 3 rinforzi diretti al punto in cui era l'arciere (a 0 px); due
nemici insieme: inseguono, nessun messaggero; la torre con l'arciere a
~400 px: 6 frecce in 150 passi allo scoperto, 0 nella nebbia.

**Da fare, in quest'ordine proposto.** Le altre meccaniche: la copertura del
bosco (piu' alberi vicini, vista dimezzata come nella nebbia), le mura che
nascondono (la linea fra nemico e arciere non deve passare per ostacoli
fissi), i prigionieri da liberare (soldati e macchine d'assedio); poi in
Tiled i banchi (polilinee orizzontali `nebbia` nel livello regia, con
velocita' e numero di nuvole), le pattuglie e le torri; la mappa
(dell'autore) e la regia a fasi (infiltrazione, labirinto, liberazione,
ritorno in forze).

### 9.149 Gli anelli della pioggia lontani dalle rive

Richiesta dell'autore (13 novembre 2026, stessa PR, versione 0.2611): sui
fiumi a linee (§9.97) gli anelli delle gocce di pioggia (§8.13) scavalcano la
riva: metterli a una certa distanza dalle rive. Prova e screenshot.

**Prima.** L'anello nasceva in un punto a caso della vista se la sua cella
da 8 px era acqua, e poi si allargava fino a ~24 x 12 px di raggio
(dimensione 0,716 di 64 px, schiacciato come il suolo): vicino alla riva ne
usciva. E sotto la riva lontana c'e' la sua parete, una fascia scura alta
fino a 16 px disegnata dentro l'acqua (rivers.js WALL): li' l'anello stava
sulla sponda.

**Ora** (effects.js `ringFits`): sui fiumi a linee un anello nasce solo se,
alla grandezza massima, 8 punti del suo bordo sono ancora acqua, e verso
l'alto anche oltre la parete (16 px in piu'). Il grande (24 x 12) dove ci
sta; dove ci sta solo il piccolo (11 x 6, i ruscelli stretti), solo il
piccolo: se no sk_silva perdeva quasi tutti gli anelli (69 -> 19). Lo stesso
per le increspature (17 x 9). I fiumi dipinti dell'autore come prima.

**Misura** (prova nuova `game/test/browser/ripples.mjs`, nella CI: pioggia
piena, la vista lungo i fiumi, seme 3; per ogni anello sul fiume, 16 punti
del bordo alla grandezza massima):

| mappa | grandi fuori dall'acqua | grandi sulla parete | piccoli fuori |
|---|---|---|---|
| lvl06, prima | 158 su 462 | 47 | 98 su 504 |
| lvl06, ora | 3 su 308 | 0 | 3 su 459 |
| sk_padus, prima / ora | 72 su 231 / 2 su 162 | 14 / 0 | |
| sk_rivo, prima / ora | 110 su 371 / 5 su 271 | 24 / 0 | |
| sk_silva, prima | 52 su 69 | 0 | 35 su 84 |
| sk_silva, ora | 1 su 15 | 0 | 0 su 55 |

I pochi rimasti sfiorano la riva fra gli 8 punti del controllo. Screenshot
prima/dopo su lvl06 e sk_padus con la pioggia: prima anelli a cavallo della
riva alta e della sua parete, e qualcuno sulla riva bassa; dopo tutti
nell'acqua.

### 9.150 Le macchie d'erba fuori dai fiumi delle schermaglie

Richiesta dell'autore (13 novembre 2026, stessa PR, versione 0.2611): nelle
mappe delle schermaglie le macchie d'erba non devono finire nei fiumi (si
vedeva negli screenshot di §9.149, sul Po di Padus); se serve, spostarle.

**Perche'.** Le macchie a particelle (`burst_erba1`, `burst_grano1`,
`chiazzaparticellare`, i fiori) spargono l'erba in un'ellisse attorno al
centro, 500 x 300 px di semiassi (200 x 125 i fiori: effects.js DECOR_SIZE).
tools/16 (`scatter`, `free`) guardava solo il centro, a 150-300 px dalle
linee di fiumi e strade: il bordo della macchia arrivava nell'acqua. Per i
centri delle basi c'era gia' il controllo sull'ellisse intera (`on_base`,
§9.131), per i fiumi no.

**Ora** (tools/16 `on_water`, `patch_wet`): una macchia non si mette dove il
centro o uno dei 16 punti del bordo della sua ellisse e' a meno di meta'
larghezza del fiume + 20 px dalla sua linea, misurato sul terreno "steso"
(y / 0,62) come le rive del gioco; `scatter` cerca un altro posto.
`--check` (nella CI) da' errore per una macchia nell'acqua.

**Le mappe.** Prima (ellisse intera): Padus 2 macchie nel Po (piu' i loro
gemelli), Rivoaltus 6 nella laguna; Bardonis, Silva Umbra, Urbs nessuna (non
cambiano). Rigenerate `mappe/sk_padus.tmx`, `mappe/sk_rivo.tmx` e i loro
scenari: a Padus si spostano solo le 4 macchie; a Rivoaltus le 6 e, a
cascata (il generatore estrae i numeri in sequenza), i fiori e i ciuffi
d'erba messi dopo; alberi, risorse, basi, strade e fiumi uguali. Rifatte
anche le loro cartoline (tools/17): uguali a parte la nebbia decorativa
(a caso) e un fiore. Screenshot: la macchia d'erba vecchia rimessa al suo
posto copre il Po; senza, il fiume e' pulito; lo stesso sul canale di
Rivoaltus.

Nel livello 6 (la mappa dell'autore, non generata) 2 macchie toccano
l'acqua al 70% dell'ellisse, 4 all'ellisse intera: spostate su richiesta
dell'autore (§9.151).

### 9.151 Le macchie del livello 6 fuori dai fiumi; l'avviso in Tiled

Richiesta dell'autore (13 novembre 2026, stessa PR, versione 0.2611):
spostare anche le macchie del livello 6 che finiscono nei fiumi.

**Spostate** in `mappe/lvl06.tmx` (e rifatto `scenari/lvl06.json`), ognuna
nel punto asciutto piu' vicino (lo stesso criterio di §9.150: ellisse
intera, 20 px dalla riva), cosi' resta nello stesso angolo di paesaggio:
due macchie di grano (180 px a destra; 160 px in giu'), due d'erba (40 px)
e una di fiori di papavero, che arrivava a meno di 20 px dall'acqua (20 px).
Si sono mossi solo questi 5 oggetti; il resto della mappa e dello scenario
e' uguale. Screenshot (la macchia vecchia rimessa al suo posto): prima il
grano entrava nel fiume, dopo comincia oltre la riva.

**L'avviso** (tools/12_tiled_import.py): importando una mappa, una macchia a
particelle che arriva nell'acqua di un fiume da' un avviso ("la macchia
arriva nell'acqua di un fiume, spostala", con le coordinate), per le mappe
che l'autore disegnera'. Con la mappa del livello 6 di prima: i 4 avvisi
delle macchie bagnate; con quella nuova nessuno. Il controllo (`patch_wet`)
e le misure delle macchie (`PATCH_SIZE`) stanno ora in tools/tiledkit.py,
comuni a tools/12 e tools/16 (le schermaglie restano identiche).

### 9.152 Multiplayer, fase 1: la partita deterministica

Richiesta dell'autore (15-17 novembre 2026, stessa PR, versione 0.2611): un
multiplayer PvP con le mappe e le impostazioni della schermaglia. Decisioni:
**1 contro 1**, partita privata **con un codice**, preferibilmente **solo
connessione diretta** (da capire se e' fattibile), **parti simmetriche**
(le stesse regole per i due); intanto la **fase 1**, poi le altre si
valutano.

**Il piano** (proposto e discusso): lockstep deterministico, come i grandi
RTS: i due browser simulano la stessa partita e si scambiano solo i
comandi; ogni tanto confrontano un'impronta dello stato. Fasi: 1)
determinismo; 2) strato dei comandi (oggi gli ordini sono eventi delle
istanze che leggono il mouse durante il passo: ~90 eventi d'input, ~40
letture del mouse nei passi); 3) parti simmetriche (291 riferimenti a
oggetti ally, 506 a enemy, ~2.500 righe solo per i nemici; la nebbia solo
per il giocatore; `visible` che entra nelle decisioni); 4) rete e lobby.

**Fase 1: cosa poteva far divergere due browser con la stessa partita.**
- *Lo stesso Math.random per la partita e per gli effetti*: particelle,
  pioggia, foglie, sangue, suoni consumavano numeri casuali secondo cosa
  c'e' sullo schermo e le opzioni grafiche (gli anelli della pioggia nascono
  solo nella vista): due giocatori che guardano punti diversi avrebbero avuto
  partite diverse in pochi secondi.
- *La matematica del browser*: Math.sin, cos, atan2, hypot, exp, log e `**`
  sono "approssimati dall'implementazione": V8, SpiderMonkey e
  JavaScriptCore possono differire nell'ultimo bit.
- *Istanze che nascono per chi guarda* (scoperte con la prova, sotto): i
  mattoni di un crollo nascono solo se il crollo e' sullo schermo, e l'avviso
  d'allarme della minimappa; prendevano gli id della partita, che decidono i
  pareggi.
- *I pulsanti dell'interfaccia nel mondo*: seguono la vista, hanno una
  maschera, e `placeEmpty` li contava: un nemico con la meta sotto il pulsante
  degli obiettivi la spostava a caso di 20 px (livello 6, passo 600).

**Ora.**
- `game/src/rng.js`: `simRandom`, il generatore della partita (sfc32 col
  seme della partita; lo stato si salva coi salvataggi: un caricamento
  riprende la stessa sequenza), e `vrand`, quello degli effetti (libero,
  locale, non si salva). Il seme: `?seed=N` o uno nuovo a ogni partita; con
  `?nostart` e senza seme (le prove nel browser, che fissano Math.random a
  mano) Math.random come prima. Math.random e' rimasto solo in rng.js.
- `game/src/dmath.js`: `dsin`, `dcos`, `datan2`, `dhypot`, `sq` con gli
  algoritmi di fdlibm, scritti solo con + - * / e Math.sqrt / round (esatti
  in ogni browser): rispetto a quelli di Chrome, su 2 milioni di valori, sin
  e cos entro 1 ulp, atan2 identico, hypot entro 2 ulp. Al posto di Math.* in
  38 file (anche il disegno: niente da classificare); `|log a| < |log b|`
  delle pietre delle strade riscritto senza log.
- Istanze cosmetiche (`opts.fx`, i mattoni) e d'interfaccia (pulsanti,
  dialoghi, suggerimenti: world.js `isUiObject`) hanno id negativi a parte e
  le ricerche della partita (`instancePlace` e `collisionRectangle` senza
  famiglia) non le contano. Le cosmetiche non si salvano.
- `snapshot.js stateHash`: l'impronta della partita (FNV-1a, due volte),
  senza quello di chi guarda (particelle, nebbia di guerra, telecamera e
  zoom, puntatore, allarmi della minimappa, i campi grafici delle istanze:
  particelle di fuoco ed erba, righe del grano) e senza interfaccia ed
  effetti; `__game.hash()`, `__game.dump()` per le prove.
- Il kit di Tiled: rivers.js importa dmath.js; tools/11 copia anche
  dmath.mjs e corregge l'import (come la prova dell'anteprima).

**Prove.**
- `test/dmath.test.mjs`: precisione e solo operazioni esatte.
- `test/determinism.test.mjs`: niente Math.random fuori da rng.js, niente
  matematica non deterministica fuori da dmath.js e dal disegno (gl.js,
  draw.js).
- `test/browser/determinism.mjs` (nella CI): la stessa partita, stesso
  seme, nessun input, in due pagine che fanno tutto il resto diversamente
  (finestra 1280x720 contro 960x600, la vista ferma sulla base contro una
  che salta per la mappa ogni 7 passi, disegno ogni 2 passi contro ogni 5,
  erba e pioggia spente nelle opzioni della seconda), la pioggia che comincia
  allo stesso passo; l'impronta ogni 300 passi. Se divergono, dice il primo
  campo diverso (DIFFS=n: i primi n). Controllo: un altro seme da' un'altra
  impronta.
- Nella CI anche Firefox e WebKit: la stessa prova in ognuno, e le
  impronte dei tre browser devono essere uguali fra loro.

**Risultati** (Chromium, seme 12345, nessun input, le due pagine sopra):
le impronte coincidono a ogni controllo (ogni 300 passi) in tutte le room:
le cinque schermaglie, il tutorial e i livelli 1-6 per 6000 passi (Padus
anche per 12.000: la CPU costruisce, produce, attacca; piove). Prima delle
correzioni sulle istanze: livello 5 diverso al passo 300 (gli allarmi della
minimappa), livello 6 al passo 600 (un nemico con la meta sotto il pulsante
degli obiettivi: 8 estrazioni casuali in piu' in una pagina; trovato con una
traccia delle chiamate al generatore).

**Le altre prove** (tutta la suite della CI, con la sequenza casuale nuova:
le partite delle prove prendono altre strade): passano tutte tranne tre,
sistemate cosi':
- `stealth.mjs`, il messaggero (§9.148) restava a 167 px dal centro della
  torre (la soglia era 150 dal centro): il punto fisso sotto la torre era
  occupato e la regola di sempre (meta occupata, spostata a caso) lo portava
  via. Ora va a un posto libero a 40 px dal bordo, il piu' vicino, e
  "arrivato" si misura dal bordo (80 px): alla torre in 181 passi.
- `ripples.mjs` (§9.149): 3 anelli su 17 sfioravano la riva a sk_silva: il
  controllo nel gioco guardava 8 punti del bordo, la prova 16. Ora anche il
  gioco ne guarda 16: nessun anello fuori (lvl06 0 su 305, sk_silva 0 su 16).
- `lvl06.mjs`, la taratura: 8 passati (soglia 5). Le prove nel browser
  fissano Math.random dopo il caricamento della mappa, che usa gia' numeri a
  caso (gli sprite degli alberi): ogni esecuzione partiva da una mappa un po'
  diversa, e lo stesso seme dava 4 o 8 passati. Ora la taratura usa ?seed
  (sempre uguale) e la media di tre semi: con 15 torri 6, 5, 5 (5,3), con 5
  torri 35, 35, 35. La media "vera" e' attorno a 5, la soglia della media
  passa a 6 (con "al piu' 5" e un seme solo falliva una volta su due anche
  col codice di prima). Le altre prove nel browser hanno lo stesso
  difetto (il caricamento non fissato): da sistemare, ?seed nelle loro pagine.

**La connessione diretta** (domanda dell'autore): fattibile con WebRTC, ma
"solo diretta" ha due costi. Per collegarsi i due browser devono scambiarsi
una descrizione della connessione (qualche centinaio di caratteri): senza
server, il primo giocatore manda un codice lungo all'altro (in chat), che ne
rimanda uno suo; con un piccolo servizio di sola presentazione (gratuito,
per esempio un worker) basta un codice di 6 lettere, e la partita resta
diretta. E per attraversare i router serve un server STUN pubblico (solo per
scoprire l'indirizzo, niente traffico di gioco); senza un server TURN (che
inoltra il traffico, a pagamento) una parte delle reti (stimata 10-20%:
NAT simmetrici, reti aziendali) non si collega. Da decidere con l'autore
quando si arriva alla fase 4.

### 9.153 Multiplayer, fase 2, passo 1: coda dei comandi, registro, replay

Richiesta dell'autore (17 novembre 2026, stessa PR, versione 0.2611):
cominciare la fase 2 dal passo 1, documentando tutto, perche' il lavoro si
riprendera' nelle sessioni successive.

**Perche' la fase 2.** In una partita in lockstep (§9.152) i due browser si
scambiano i comandi dei giocatori e li eseguono allo stesso passo. Oggi gli
ordini non sono comandi: sono eventi delle istanze, alla GameMaker, che
leggono il mouse durante il passo, e la selezione (`selected`) fa parte dello
stato della partita. Inventario (17 novembre 2026: gestori per file; "clic dx
glob." = globalRightReleased, l'ordine col clic destro; "sx altrove" =
globalLeftPressed, la deselezione; "mouse nei passi" = letture di w.mouse,
w.input, mousePressed/Released; "selected" = punti in cui decide):

| file | clic dx glob. | clic dx | clic sx | sx altrove | tasti | hover | mouse nei passi | selected |
|---|---|---|---|---|---|---|---|---|
| buildings.js | 1 | 6 | 6 | 7 | 9 | 6 | 24 | 39 |
| units.js | 2 | 0 | 1 | 1 | 1 | 3 | 17 | 35 |
| walls.js | 0 | 4 | 6 | 4 | 5 | 2 | 4 | 19 |
| ranged.js | 1 | 2 | 3 | 4 | 0 | 1 | 9 | 20 |
| civilians.js | 0 | 1 | 1 | 2 | 0 | 2 | 6 | 20 |
| production.js | 1 | 0 | 0 | 1 | 2 | 2 | 8 | 6 |
| siege.js | 2 | 0 | 0 | 0 | 0 | 1 | 8 | 9 |
| enemies.js | 0 | 1 | 2 | 1 | 1 | 1 | 2 | 11 |
| levels.js | 0 | 2 | 2 | 0 | 2 | 1 | 4 | 2 |
| manager.js | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 1 |
| bridge.js, economy.js, enemybuild.js, hints.js, world.js, menu.js, stealth.js | | | | | | | | (pochi) |

Da qui la scelta: non convertire tutto in una volta (e' il cuore di ogni
interazione), ma un'infrastruttura che regge subito una prova completa, e
poi un'azione alla volta.

**Il passo 1: cosa c'e'** (`game/src/commands.js`, classe `Commands`; in
app.js `commands`, esposto come `window.__game.commands`).
- *Comandi veri* (per il passo 2): `on(kind, fn)` registra il gestore di un
  tipo; `issue(kind, data, step, p = 0)` mette un comando del giocatore `p`
  da eseguire all'inizio del passo `step` del mondo; `runDue(world)` (in
  app.js subito prima di `world.step`) esegue quelli del passo in un ordine
  che non dipende dall'arrivo: passo, giocatore, numero. Un tipo senza
  gestore e' un errore. Oggi nessun tipo registrato.
- *Il comando di transizione `input`*: `frame(input, cam)` (in app.js subito
  dopo `input.beginStep()`, a ogni passo del ciclo, anche in pausa) registra la
  fotografia dell'input (mouse in pixel CSS, dentro/fuori, tasti
  giu'/premuti/rilasciati, pulsanti del mouse, rotella) e della telecamera
  (x, y, w, h, cssW, cssH, zoom e zoom in corso), solo quando cambia. In
  replay la rimette, passo per passo: il resto della partita e'
  deterministico (§9.152), quindi in singolo la partita si rigioca identica
  anche con un'altra misura della finestra. NON serve in rete (i pulsanti
  seguono la vista di chi gioca; l'input del secondo giocatore dovra'
  muovere la parte nemica): e' la rete di sicurezza mentre le azioni passano
  ai comandi veri, e il modo per provarle (sotto).
- *Il registro*: `__game.record()` lo comincia (room e seme della partita:
  rng.js `simSeedValue`; serve una partita con seme, `?seed=` o quello
  nuovo di ogni partita), `commands.stop()` lo restituisce:
  `{ v: 1, room, seed, frames: [[passo del ciclo, fotografia]], cmds: [...],
  checks: [[passo del mondo, impronta]] }`. `afterStep(world, hash)` (alla
  fine del passo in app.js) aggiunge l'impronta ogni CHECK_EVERY = 300
  passi.
- *Il replay*: `commands.replay(log)` in una pagina aperta con lo stesso seme
  (e `?nostart`): l'input vero e' ignorato (e i comandi locali: `issue`
  restituisce null), si rifanno fotografie e comandi del registro; a ogni
  impronta registrata il confronto (`play.result`, `play.divergedAt`).
- Quando non si registra ne' si rigioca, gli agganci non fanno niente
  (salvataggi, determinismo, crowd: uguali).

**Prove.**
- `test/commands.test.mjs` (unitaria): ordine (passo, giocatore, numero)
  con comandi arrivati in disordine; registro; replay agli stessi passi;
  comandi locali ignorati in replay; tipo sconosciuto; la fotografia solo
  quando cambia e rimessa uguale.
- `test/browser/replay.mjs` (nella CI): una schermaglia su Padus (seme 11)
  giocata SOLO con input veri (clic sul centro e Q; trascinamento attorno ai
  lavoratori e clic destro su un albero; un lavoratore, Q, il fantasma della
  casa sotto il puntatore fino al posto buono, clic; frecce; rotella; un
  ordine di movimento; la CPU che gioca), 3765 passi, 223 fotografie;
  rigiocata dal solo registro in una finestra 960x640: 12 impronte su 12
  uguali e la stessa alla fine. Controllo: col primo clic destro spostato di
  200 px diverge al passo 600. La prova fallisce anche se la sessione non fa
  davvero le sue azioni (centro selezionato, lavoratori selezionati, un
  cantiere).

**Come riprendere (passo 2 e 3).** Per ogni azione:
1. un tipo di comando con i dati che bastano a eseguirla senza mouse ne'
   selezione: per esempio `{ k: "muovi", ids: [...], x, y }`, `{ k:
   "attacca", ids, target }`, `{ k: "costruisci", ids, obj, x, y }`, `{ k:
   "produci", edificio, unita' }`, `{ k: "comportamento", ids, comp }`; il
   gestore (`commands.on`) fa quello che oggi fa l'evento;
2. l'evento d'input (clic destro, tasto, pulsante) non cambia piu' lo stato:
   calcola i dati (chi e' selezionato, dove punta il mouse) e chiama
   `commands.issue(...)` per il passo in corso;
3. la prova: replay.mjs (e le prove che danno ordini col clic vero: crowd,
   movement, settle, attackorder, fireorder, sites, buildstuck, garrison...)
   devono restare uguali; poi una variante del replay che rigioca SOLO i
   comandi veri (senza le fotografie, o con le fotografie svuotate dei clic
   gia' convertiti) deve dare le stesse impronte per le azioni convertite.
Ordine proposto (dal piu' usato): (a) la selezione fuori dallo stato della
partita (`selected` diventa dell'interfaccia del giocatore; i ~150 punti in
cui decide passano a "le unita' del comando"); (b) gli ordini col clic destro
(9 globalRightReleased: fanti e cavalieri, arcieri, civili, assedio,
edifici con la bandiera); (c) comportamento, modi di tiro, presidio; (d)
costruzione e piazzamento (i fantasmi *_placer), mura e porte; (e)
produzione e code; (f) riparazione, fuoco, gruppi di controllo, doppio clic.
Attenzioni: le istanze d'interfaccia (pulsanti, fantasmi, dialoghi) hanno
id a parte e le ricerche della partita non le vedono (§9.152): i comandi non
devono dipendere da loro; il passo in cui un comando si esegue e' quello
in corso in singolo, in rete qualche passo dopo (il ritardo dei comandi,
fase 4).

**Il determinismo fra browser nella CI** (verificato il 17 novembre 2026,
commit 31b8878): Chromium, Firefox e WebKit danno le stesse 10 impronte su
Padus in 3000 passi (seme 12345). Firefox headless sulla macchina della CI
non ha driver GL ("Exhausted GL driver options": niente WebGL2, il gioco non
parte): gira con la finestra (HEADED=1) su Xvfb con Mesa in software
(build.yml). Il passo dura ~8 minuti; il limite del lavoro e' passato da 30
a 45 minuti (con 30 una CI e' stata annullata a meta' di Firefox).
determinism.mjs, se il gioco non parte, stampa errori, console e WebGL2.

**Per provare in questa macchina** (cloud): niente server http (negato
dall'ambiente): un modulo che serve game/ da disco a Playwright
(PLAYWRIGHT_MODULE, come in §9.146); la suite completa nel browser richiede
~45 minuti con 4 prove in parallelo.

### 9.154 Multiplayer, fase 2, passo 2: la selezione e le azioni come comandi

Richiesta dell'autore (17 novembre 2026, stessa PR, versione 0.2611):
procedere col passo 2 della fase 2.

**L'idea.** Un'azione del giocatore che cambia la partita non la cambia piu'
nel gestore d'input: diventa un comando coi dati che bastano a eseguirla
(chi: gli id delle unita' o degli edifici; dove: il punto), eseguito
all'inizio del passo DOPO quello in cui nasce, uguale per chi la da' e (in
rete) per chi la riceve. Tutto quello che resta nei gestori d'input e'
interfaccia di chi guarda: la selezione, i pulsanti, i fantasmi, i
lampeggi, la telecamera.

**Il meccanismo** (world.js, app.js, commands.js):
- `world.action(tipo, fn(world, c))` registra un tipo; `world.act(tipo,
  dati)` lo da': con la coda dei comandi (app.js `hooks.command`) e' un
  comando del passo dopo, senza (prove unitarie) si esegue subito.
  `commands.runDue` esegue i tipi del mondo se non ha un gestore suo.
  `world.selectedIds()` gli id selezionati (della partita), `world.byIds(ids,
  nome)` le istanze vive. I campi s, p, n, k del comando sono riservati
  (issue li rifiuta).
- `world.withSelection(ids, fn)`: per il tempo di fn i selezionati sono
  `ids`, poi tornano quelli di chi guarda (restano cambiati solo quelli che fn
  stessa ha cambiato). Serve a rifare gli eventi di sempre (che guardano
  `selected`) dai dati del comando senza riscriverli tutti.

**I tipi fatti** (in ordine di uso):
| tipo | dati | da | eseguito da |
|---|---|---|---|
| ordine | ids, x, y, over | rilascio destro (world._mouseEvents) | world.rightOrder: GlobalRightPressed (il centro azzera le destinazioni; prima alla pressione), RightReleased sotto il punto se over, scr_movement_general, GlobalRightReleased, formazione; il mouse del mondo e' (x, y) |
| comportamento | ids, attacco | attacco/difesa (Q, A) | units.js behaviourAction |
| tiro | ids, modo | furtivo/rapido (F, R) | stealth.js shotAction |
| civile, annulla_civile | ids (centri) | omino_clicker (Q), centro_indietro (W) | buildings.js workerAction, cancelWorkerAction |
| produci, annulla | ids, prod, type | i pulsanti di caserma, stalla, castello | production.js produceAction, cancelAction |
| costruisci | fam, x, y, tipo, posiz, ids, mx, my | clic del fantasma (*_placer) | buildings.js buildAction: paga, il cantiere; i costruttori `ids` (prima buildarm sui civili) partono al suo Alarm_0 verso (mx, my) (prima il mouse di allora) |
| prolunga | vert, x, y | clic sull'anteprima del tratto | walls.js extendAction |
| porta | ids | gate_clicker (Q) | walls.js gateAction |
| canc | ids | Canc (world._keyEvents) | world.cancAction: il KeyPress_Delete di sempre sulle istanze ids |
| trucco | res | V + Alt + F/Q/S/W/P (manager.keys) | manager.cheat |

**Fuori dalla partita** (snapshot.js, l'impronta; world.js):
- la selezione: `selected`, `assi` (gruppi di controllo), `dcAt` (la
  finestra del doppio clic: prima l'Alarm_1 dell'unita' con dc 1/0, ora il
  passo fino a cui vale, units.js dcOn/dcArm; il dc dei NEMICI resta, e'
  logica loro), `_mouseOver`; i contatori sel, milsel, firesel, arcsel,
  siegsel, selected; i cerchi del puntatore (alberhover, minierahover,
  stonehover, farmhover, buildhover, preshover); i tasti visia, minim, obj,
  hint.
- istanze dell'interfaccia (id negativi, fuori dall'impronta, §9.152) anche
  i lampeggi delle risorse (*_blink), i "+" e le anteprime delle mura
  (mplus_*, oodl, oosl, ovbl, oval; i fantasmi *_placer lo erano gia', figli
  di clicker_parent).
- un'istanza dell'interfaccia si trova solo col suo nome o un genitore
  d'interfaccia (world.js indexNames, _hits): le anteprime delle mura sono
  figlie di mura_ori e ally_build, e i nemici le avrebbero viste. Lo sprite
  a caso (choices) delle istanze dell'interfaccia e cosmetiche col
  generatore di chi guarda (vrand), come lo stile del fantasma della casa.
  Vale per tutte le ricerche: per nome (all, number, nearest: l'indice) e per
  posizione (instancePlace, instancePosition, positionMeeting,
  collisionRectangle, le collisioni).

**Prove.**
- `test/browser/orders.mjs [room]` (nella CI su lvl06 e match): due pagine
  con lo stesso seme; A da' gli ordini col clic destro vero, B gli stessi
  SOLO come comandi, con un'altra selezione che cambia a caso a ogni passo
  e la vista altrove: impronte uguali ogni 50 passi (lvl06: 16 soldati e 4
  civili, formazione e legna; anche lvl03, sk_padus). Controllo: un ordine
  spostato diverge.
- `test/browser/replay.mjs`: la sessione (ordini, civili in coda, la casa,
  un trucco) rigiocata dai SOLI comandi, senza nessun input ne'
  telecamera (`commands.replay(log, { input: false })`): 12/12 e la stessa
  impronta alla fine. E' la prova del passo 2: una sessione che fa
  un'azione non ancora convertita diverge qui. Il controllo ora sposta un
  comando (non piu' un clic delle fotografie, che in replay non da' ordini).
- `test/browser/determinism.mjs`: la pagina B seleziona e deseleziona a caso.
- `test/commands.test.mjs`: le azioni del mondo come comandi.

**Trovato per strada** (con la sonda che rigioca in parallelo il registro
completo e quello senza input, e stampa il primo campo diverso): il timer
del doppio clic in una sveglia della partita; il fantasma della casa che
sceglieva lo stile col generatore della partita (ora era dell'interfaccia:
la sequenza cambiava solo per chi costruisce).

**Cosa resta (fase 2).**
- Campagna: dialoghi (dialogo_*) e suggerimenti (hint_*) sono
  interfaccia ma alcuni fanno partire cose della partita (script dei
  livelli); la schermaglia non li usa. Da guardare solo se servira'.
- Il comando si esegue al passo dopo: le prove nel browser che danno un
  ordine e guardano subito lo stato devono fare almeno un passo.

**Dove si eseguono i comandi.** In world.step dopo Begin Step e allarmi,
dove giravano tastiera e mouse (`hooks.commands`; prima, in §9.153, in testa
al passo). Il passo di ritardo ha fatto emergere in attackorder.mjs (la CI
rossa) due unita' ferme a 3-9 px dal nemico per sempre, due difetti veri
dell'attacco (units.js autoAttack), corretti:
- chi aspetta (waitHere: non riesce ad avvicinarsi di piu') a meno di 10 px
  colpisce anche in verticale, dove la portata e' 10 * k = 6,4 px e da sopra
  o da sotto ci si ferma prima (il picchiere a 9 px);
- chi insegue il suo bersaglio e ha un altro nemico a portata di colpo (che
  gli sbarra la strada) prende quello (il guerriero a 3 px da uno, col
  bersaglio a 84 px).

**Per la fase 3** (parti simmetriche): i gestori degli ordini cercano
`ally_*` e il comando ha gia' gli id: un comando del giocatore 1 deve
muovere le unita' `enemy_*` (o, meglio, le parti diventano due insiemi della
stessa famiglia). Attenzione a: `visible` (la nebbia di chi guarda: alcune
decisioni della partita la leggono, p.es. chi si vede si attacca) e le
istanze dell'interfaccia distrutte dalla partita (il cantiere delle mura
distrugge le anteprime: in rete quelle dell'altro).

### 9.155 Multiplayer, fase 3: i gemelli blu del giocatore 2 e lo specchio

Richieste dell'autore (17 novembre 2026, stessa PR, versione 0.2611): "il
secondo giocatore con dei secondi modelli blu, funzionali solo al
multiplayer"; poi: "i gemelli blu, ma devono usare gli sprite di enemy, non
devono essere solo un tint: uno dei due giocatori si vedra' con gli sprite
di enemy, l'altro con quelli rossi soliti. Sono comunque oggetti distinti".

**Le opzioni considerate.** (1) gemelli p2_* con la logica del giocatore
(scelta); (2) gli stessi oggetti con un campo "parte" (ogni ricerca del
codice da filtrare: decine di file); (3) il giocatore 2 con gli oggetti
enemy_* (scartata dall'autore: un'altra logica, un cantiere solo).

**Gli sprite blu** (`src/p2sprites.js`). I gemelli usano gli sprite del
giocatore (stesse maschere e fotogrammi: la partita non sa di colori); al
disegno (world.draw, sprites.js `setSpriteRemap`) ognuno passa al suo
corrispondente blu: le famiglie d'animazione (ww -> bww, ff -> bfg, cm ->
bcw, ow -> b_ow, ..., P2_FAMILIES), gli edifici finiti (cc_spr -> cc_b,
barn_spr -> mub, campo2 -> campo1, rflag -> bflag, P2_EXACT), le case (c3s ->
c3b), mura, porte e i loro danni (castello_r1 -> castello_b_r1). Restano
quelli del giocatore cantieri e rovine (neutri: il nemico della CPU ha un
cantiere solo) e le icone; due fotogrammi mancanti (bwa31, bpa31) prendono
il primo della stessa direzione. I civili blu (b_ow, b_os, b_car...) erano
nell'atlas ma la CPU non li usava (enemy_omino e' rosso). Prova:
test/p2sprites.test.mjs (ogni animazione delle unita' e dei cadaveri del
giocatore e ogni edificio finito ha il suo blu).

**I gemelli e lo specchio** (`src/multiplayer.js`, world.js).
- I gemelli: la famiglia del giocatore (ally_* e chi ha un genitore ally*:
  unita', edifici, cantieri, mura, porte, cc_barn) e quello che porta la
  parte (frecce e proiettili, cadaveri, bandiere, food_bullet): p2_<nome>
  (ally_warrior -> p2_warrior, centro -> p2_centro), stessa definizione coi
  genitori tradotti, lo stesso comportamento registrato.
- Lo specchio (mirrorWorld): il codice del giocatore non si riscrive. Per
  gli eventi di un'istanza p2_* il mondo passa uno Proxy di se stesso che
  traduce gli argomenti stringa dei metodi (all, nearest, number, create,
  instancePlace, positionMeeting, is, byIds, ...) con la tabella m2: i nomi
  del giocatore -> p2_*, "enemy_*" -> il giocatore 1 (ENEMY_EQ: enemy_unit ->
  ally_unit, enemy_centro -> centro, ...); e w.g e' la cassa del giocatore 2
  (global.p2: food, wood, gold, stone, pop, popcap, idle; il resto di global
  e' comune). Nella partita a due anche il giocatore 1 ha il suo specchio
  (m1: "enemy_*" -> p2_*). I metodi girano sul mondo vero: le chiamate
  interne non si traducono due volte.
- Chi vede da quale parte (world.worldFor): un'istanza della parte 1 o 2 con
  lo specchio della sua parte; durante un comando le neutre (risorse...) con
  quello di chi lo da' (mp.actor, runAction); fuori dai comandi le neutre
  sempre con la parte 1 (uguale in ogni pagina: risorse, sk_manager) e
  l'interfaccia con quella di chi guarda (mp.local). Le collisioni con i
  nomi tradotti per la parte dell'istanza (le frecce blu colpiscono i rossi).
  L'input lo prendono solo le istanze della parte di chi guarda; dentro un
  comando quelle della parte che lo da'.
- I comandi portano il giocatore (p 0 o 1; app.js hooks.command: la parte di
  chi guarda) e si eseguono col suo specchio.
- app.js: `?pvp=1` su una mappa da schermaglia accende la partita a due
  (`&parte=2`: si guarda dal blu); quello che app.js fa per "il giocatore" a
  ogni passo (civili inattivi, sovrapposizioni, assedio, fiaccole) gira per
  le due parti, la selezione, la nebbia e gli allarmi per chi guarda.
- skirmish.js: il secondo centro e' p2_centro, il blu ha 3 civili e la sua
  cassa con le risorse di partenza scelte, niente regia della CPU ne'
  tregua.
- Fuori dall'impronta anche alLife (gli allarmi della minimappa) e
  _fogStamp (la nebbia): sono di chi guarda.

**Prove.**
- test/browser/pvp.mjs (nella CI): due pagine con lo stesso seme, una
  guarda dal rosso e una dal blu, gli stessi comandi dei due giocatori
  (civili in coda, legna, la casa blu); al passo 900 due piccoli eserciti
  nascono al centro e si combattono. Impronte uguali (30/30 ogni 50 passi su
  1500); tutti e due raccolgono, la casa blu c'e', morti da tutte e due le
  parti; il centro blu disegnato cc_b. Controllo: un ordine blu diverso
  cambia la partita. `EVERY=20 DIFFS=20` per cercare dove divergono.
- test/multiplayer.test.mjs: gemelli, tabelle, lo specchio e la cassa.
- Il gioco in singolo non cambia: col seme fisso le impronte di
  determinism.mjs (sk_padus, lvl06, match, 3000 passi) sono le stesse di
  prima del rifacimento (confrontate con 47f32a4 con la stessa impronta).

**Fatto dopo** (stesso giorno, seconda tornata):
- L'interfaccia di chi guarda: manager.drawGUI, drawEnd e drawMouser
  ricevono lo specchio di chi guarda (world.worldFor(null)) e usano la sua
  cassa (world.g): il riquadro di risorse, popolazione e inattivi del blu,
  la minimappa ("i miei edifici"). L'obiettivo nella partita a due:
  "Avversario: il giocatore blu/rosso" (endgame.js, texts.js). La vista di
  partenza sulla propria base. I tetti della cassa (9999, popcap 99 e
  quello scelto) anche per il blu.
- La nebbia di guerra (multiplayer.js pvpVisibility, a ogni passo in
  app.js): per le istanze delle due parti visible vuol dire "la vede
  l'avversario", calcolato per tutte e due come per i nemici della CPU
  (unita' 150 px, edifici 200, castelli e torri 500, di piu' di giorno,
  sempre se colpite o con la visibilita' Totale). Cosi' il codice del
  giocatore che guarda visible sul bersaglio vale per tutte e due le parti.
  Il disegno (world.shown) mostra sempre le istanze di chi guarda (quelle
  che la definizione vuole visibili), dell'avversario quelle che vede.
- Le risorse scoperte dal blu (vis2, civilians.js reveal col suo specchio);
  i civili blu conoscono quelle (known); il disegno e la minimappa del blu le
  usano.
- La fine (skirmish.js pvpCheck, pvpEnd): chi vince e' un dato comune
  (global.skWinner), deciso da sk_manager per conquista, municipio o
  punteggio (a tempo; a pari vince il rosso, provvisorio); il rosso vede la
  vittoria e il blu la sconfitta (o il contrario), schermate cosmetiche (fx).
  Il centro distrutto e "nessuna mossa" (noMovesCheck) non decidono da soli
  nella partita a due. Dopo la fine le pagine possono differire
  (global.victory, gameover): il controllo della rete si fermera' li'.
- pvp.mjs: anche la fine (edifici blu distrutti: vince il rosso in tutte e
  due le pagine, il rosso vede la vittoria, il blu la sconfitta).
- Giocare dal blu con mouse e tastiera (`PVP=2 replay.mjs`, nella CI: la
  sessione del replay da ?pvp=1&parte=2; 12/12 anche dai soli comandi). Per
  arrivarci: i pulsanti di costruzione col suo specchio (buildButtons); il
  trucco nella cassa di chi lo da'; e i punti del codice del giocatore che
  confrontano i NOMI degli oggetti, che lo specchio non traduce:
  multiplayer.js `baseOf(i)` (il nome originale di un gemello: p2_omino ->
  ally_omino; units.js: contatori della selezione, ruoli e velocita' della
  formazione, assedio) e `unitFam(i)` (la famiglia delle unita' della parte:
  enemy_unit, p2_unit, ally_unit; pathing.js canYield, stepAside, sideUnit,
  lastmile.js side, world.placeFreeForSlot). Prima i civili blu contavano
  come soldati (niente pulsanti di costruzione) e le unita' blu non si
  scansavano fra loro.

**Segnalazioni dell'autore** (corrette):
- [Segnalazione dell'autore: "un mulino rosso sul centro blu"] Due gemelli
  con lo stesso nome: ally_barn (la famiglia dei depositi del cibo) e barn
  (il mulino) diventavano tutti e due p2_barn, e il deposito invisibile del
  centro blu (p2_cc_barn, figlio di p2_barn) prendeva il comportamento del
  mulino: nasceva con lo sprite mul1. Ora un nome che togliendo "ally_"
  darebbe un altro oggetto tiene il prefisso (p2_ally_barn), e nameMaps si
  ferma con un errore se due gemelli finiscono sullo stesso nome. La nebbia
  controllata con le immagini: dal rosso la base blu e' nera, e viceversa;
  un soldato blu vicino ai rossi il rosso lo vede. pvp.mjs controlla tutte e
  due le cose.
- [Segnalazione dell'autore: "sugli screen del blu la nebbia sembra
  'esplorato ma nessuno presente'"] La nebbia ha due strati: lo scoperto
  (FogMap.update, a ogni passo) e il visibile adesso (FogMap.compose, al
  disegno, fogdraw.js prepare). Lo scoperto si calcolava gia' con lo
  specchio di chi guarda, il visibile no: riceveva il mondo vero, cioe' le
  fonti di vista del rosso; dal blu tutto era "scoperto ma non visibile".
  Ora fogLayer.prepare e la prima scoperta (all'avvio) ricevono lo specchio
  di chi guarda. pvp.mjs controlla la luce sotto il proprio centro (shade 0)
  da tutte e due le parti. Per strada: leafHit (le foglie del colpo, solo
  sugli alberi sullo schermo di chi guarda) era nell'impronta: ora fra i
  campi grafici (VISUAL_KEYS).

**Terza tornata** (stesso giorno, i punti rimasti):
- Le porte nei percorsi. La griglia (Pathing) ha due varianti, "giocatore"
  e "nemico" (cost/enemyBlock per le porte del giocatore, enemyPass per
  quelle nemiche). Nella partita a due il blu usa la variante "nemico"
  (multiplayer.js `pathEnemy`: pathing.js generateFields, siegeMove,
  goNear, canReach, il ritorno; lastmile.js; melee.js; civilians.js
  fieldTo) e le sue porte si segnano come quelle nemiche (walls.js gate:
  tutta la porta chiusa per il rosso, il varco aperto per il blu). Prova in
  pvp.mjs: nello stesso punto la porta rossa ha 6 celle di varco libere per
  il rosso e chiuse per il blu, quella blu il contrario.
- L'equita' (una sonda, non nella CI): 4 guerrieri contro 4 in posizioni
  speculari, 6 semi, scambiando chi nasce prima: vince SEMPRE chi nasce
  dopo (chi viene dopo nell'ordine delle istanze del passo), con lo stesso
  risultato a parti scambiate (2 vivi con vita 24, o 2 con vita 10). La
  logica delle due parti e' simmetrica; il vantaggio e' dell'ordine delle
  istanze, che c'e' anche contro la CPU e in partita dipende da quando
  ognuno ha prodotto le sue unita'. Non si cambia (sarebbe l'ordine di
  tutto il gioco); da riconsiderare se in rete si nota.
- I confronti di nomi: settleSiege (siege.js) nella partita a due gira per
  ogni parte col suo specchio e tratta solo le proprie macchine (prima le
  avrebbe trattate due volte, e confrontate con quelle dell'altra parte).
  Gli altri confronti per nome rimasti (civilians.js "ponte", le slices
  degli edifici) valgono anche per i gemelli. Le fiaccole delle case
  passano due volte ma non si raddoppiano (h.torch).

**Cosa resta (fase 3).**
- Altri confronti di nomi d'oggetto nel codice del giocatore (i.object ===
  "...", tabelle per nome) non ancora passati da baseOf: cercarli quando un
  comportamento del blu non torna (grep 'object ===', '[i.object]').
- Cose comuni da dividere per parte: global.order (il numero d'ordine
  delle unita', comune: deterministico ma condiviso), i suggerimenti (di chi
  guarda), le fiaccole delle case (houseTorches legge visible).
- Il menu della partita a due (fase 4, insieme alla rete).

**Come riprendere: la fase 4** (la rete; decisioni dell'autore: 1 contro
1, con un codice, preferibilmente connessione diretta, §9.152).
Quello che c'e' gia':
- la partita a due in una pagina: `?room=sk_*&pvp=1&parte=1|2&seed=N`
  (app.js), le due parti identiche (pvp.mjs: due pagine con gli stessi
  comandi danno le stesse impronte; PVP=2 replay.mjs: si gioca dal blu);
- i comandi (commands.js): `issue(kind, data, step, p)` col giocatore p (0
  rosso, 1 blu), eseguiti in ordine (passo, giocatore, numero) dentro il
  passo del mondo (world hooks.commands); app.js li da' oggi per il passo
  dopo (hooks.command: world._stepNo + 1); il registro e le impronte ogni
  CHECK_EVERY = 300 passi (afterStep), stateHash in snapshot.js;
- cosa e' di chi guarda e non entra nell'impronta (selezione, puntatore,
  nebbia disegnata, allarmi, interfaccia: snapshot.js UI_GLOBALS,
  SELECTION_KEYS, VISUAL_KEYS; le istanze ui/fx).
Da fare, in quest'ordine:
1. Il canale: WebRTC, un RTCDataChannel affidabile e in ordine. Lo
   scambio dei codici da decidere con l'autore (§9.152): incollare a mano
   offerta e risposta (lunghe, compresse), oppure un piccolo servizio di
   segnalazione con codici di 6 lettere; STUN pubblico; senza TURN il 10-20%
   delle reti non si collega.
2. Il lockstep: ogni comando locale per il passo s + D (ritardo, p.es. 4-8
   passi); a ogni passo ogni pagina manda i suoi comandi di quel passo (o
   "niente") e il mondo avanza solo quando ha quelli dell'altro per quel
   passo (Commands: una coda dei comandi remoti e "pronto per il passo s";
   il ciclo di app.js aspetta). La pausa e la velocita' diventano comandi;
   i salvataggi nella partita a due da decidere (o niente).
3. L'avvio comune: chi crea sceglie mappa, opzioni e seme e li manda;
   tutti e due aprono la room con gli stessi parametri (?pvp=1&parte=1/2&seed).
4. Il controllo: le impronte ogni 300 passi si scambiano; se diverse,
   avviso e dump (stateDump) per capire; si smette alla fine della partita
   (global.skWinner: dopo, victory e gameover sono di chi guarda).
5. Il menu: "Partita a due" nella schermaglia (crea / entra con il codice),
   l'attesa dell'altro, la disconnessione.
6. Le prove: due pagine collegate da un canale finto (in memoria, con
   ritardo e disordine) -> stesse impronte; poi WebRTC vero fra due pagine
   dello stesso browser (in locale non serve STUN).
Attenzione: il vantaggio di chi nasce dopo (sopra, equita'); le cose di chi
guarda che non devono mai cambiare la partita (se una prova a due pagine
diverge, la sonda: EVERY=20 DIFFS=20 pvp.mjs stampa il primo campo
diverso, come per alLife, _fogStamp, leafHit).

### 9.156 Multiplayer, fase 4: la partita a due in rete

Richiesta dell'autore (17 novembre 2026, nuova PR, versione 0.2612): la
fase 4, ripartendo da "Come riprendere: la fase 4" di §9.155. Decisioni
dell'autore: **1 contro 1** con le parti simmetriche gia' fatte
(`?pvp=1&parte=1|2`); **connessione diretta** fra i due browser (WebRTC,
RTCDataChannel); lo scambio dei codici **senza server**: chi crea mostra un
codice lungo, l'altro lo incolla e risponde col suo, da incollare a sua
volta; se una rete non si collega senza TURN, per ora **un messaggio
chiaro**. Il resto l'ho deciso io (sotto, "Scelte mie": da rivedere con
l'autore se vuole).

**Come si gioca.** Menu, Schermaglia: mappa e opzioni come sempre, poi
"Multigiocatore online" (a sinistra di "Inizia"; il nome e' dell'autore,
sotto). Il pannello si apre al posto del riquadro della mappa: la mappa si
sceglie con le sue frecce, le opzioni nella griglia a destra, dove
difficolta' e stile della CPU sono in grigio (valgono solo contro la CPU); e
offre:
- **"Crea una partita"**: si apre la partita (il rosso) con la sala
  d'attesa: "1. Manda questo codice all'altro giocatore" (la casella col
  codice, "Copia") e "2. Incolla qui il codice di risposta" ("Collega");
- **il codice ricevuto** da incollare (la casella sotto): appena e' valido il
  pannello dice che partita e' ("Mappa: Padania. Giocherai col blu"; la
  griglia mostra le opzioni del codice, tutte in grigio: e' la partita in
  cui si entra, non si cambia) e "Entra" apre la stessa
  partita (stessa mappa, opzioni e seme di chi l'ha creata, anche se le sue
  opzioni nel menu sono altre), con il codice di risposta da rimandare.
Nella sala d'attesa Esc non fa niente (perderebbe il codice gia' mandato):
per uscire c'e' "Annulla". Quando chi ha creato incolla la risposta, il canale si apre, le due pagine
si salutano, si misura il tempo di andata e ritorno e la partita parte
nelle due pagine; la sala d'attesa sparisce. I codici: ~780 caratteri
quello di chi crea, ~600 la risposta (si possono incollare con a capo, spazi
o virgolette della chat: si tengono solo i caratteri del codice). Gli errori
detti: un codice tagliato o sbagliato, una risposta incollata al posto del
codice o viceversa, una versione del gioco diversa, un browser senza WebRTC,
le reti che non si collegano.

**I file.**
- `netcode.js`: i codici. "DV" + tipo (O offerta, A risposta) + "z"
  (deflate, CompressionStream) o "p" (senza) + base64url di un JSON: la
  descrizione WebRTC (SDP) con tutti gli indirizzi gia' raccolti (niente
  "trickle": un codice per parte), la versione del gioco, e in quello di chi
  crea la partita (mappa, opzioni, seme).
- `rtc.js`: RtcLink (RTCPeerConnection con un canale negoziato, id 0,
  affidabile e in ordine; offer, answer, accept; i messaggi in JSON) e
  FakeLink (il canale finto delle prove: una coda che la prova porta
  all'altra pagina). I server STUN (sotto). La raccolta degli indirizzi
  finisce quando il browser la dice finita, o dopo 2,5 s con almeno un
  indirizzo (qui la raccolta non finiva mai da sola: aspettava 5 s e oltre),
  al piu' dopo 8 s.
- `lockstep.js`: il protocollo (sotto), senza browser ne' mondo: si prova in
  node.
- `netgame.js`: la colla nella pagina: chi siamo (`netParams`, prima che la
  room nasca: chi crea `?net=host`, chi entra `?net=join`, il seme
  nell'indirizzo, le opzioni in sessionStorage), il menu (`netMenu`), la
  sala d'attesa, gli eventi del lockstep come avvisi, l'attesa del turno
  dell'altro, la pausa.
- `netui.js`: i pannelli HTML (servono caselle di testo vere per copiare e
  incollare) nello stile del menu e col font del gioco (domtext.js); i
  tasti battuti nelle caselle non arrivano al gioco (input.js ascolta la
  finestra), cosi' un Ctrl+V non diventa un tasto della partita; la barra
  degli avvisi in alto (`#net-bar`).
- app.js: `?net=` accende la partita a due (come `?pvp=1`) con le opzioni di
  chi crea (`skParams`), la parte da `net.local`; il passo chiede
  `canStep()` prima (se manca il turno dell'altro, restituisce false e il
  ciclo aspetta) e `afterStep()` dopo; i comandi per il passo `now + D`;
  `__game.net` e `__game.pump(n)` per le prove; nella diagnostica (F3) la
  riga "rete" (stato, colore, ritardo, andata e ritorno, attese, impronte
  uguali o il passo da cui differiscono). loop.js: un passo che
  restituisce false ferma i passi del fotogramma senza consumare il tempo
  (al piu' 6 passi da recuperare: dopo un'attesa lunga si riparte, non si
  corre). pause.js: la pausa in rete (sotto). menu.js: il pulsante;
  `VERSION` esportata (la confrontano i codici e il saluto). skirmish.js:
  `cleanSkirmish` (le opzioni valide di un oggetto: quelle salvate e quelle
  che arrivano nel codice). texts.js: 37 testi nuovi nelle sei lingue.

**Il lockstep** (lockstep.js; §9.152-§9.155 per determinismo, comandi,
parti).
- *Il ritardo dei comandi.* Un comando dato quando il mondo e' al passo N si
  esegue al passo N + D, uguale per i due. D lo sceglie chi crea all'avvio:
  5 andate e ritorni (ping), la mediana, `D = ceil((rtt/2 + 40 ms) /
  16,7 ms)` fra 4 e 15 passi (67-250 ms; in locale 4, con 100 ms di andata
  e ritorno 6).
- *I turni.* Finito il passo N ogni pagina manda il turno N + D (i suoi
  comandi di quel passo, anche nessuno: `{t: "T", s}`). Il passo N si gioca
  solo col turno N dell'altro (i passi prima di D non hanno comandi per
  costruzione); se non c'e' la pagina aspetta, e la piu' lenta detta il passo
  a tutte e due. Dopo 0,6 s d'attesa la barra "In attesa dell'altro
  giocatore...", dopo 8 s un pannello con "Lascia la partita"; spariscono
  appena il turno arriva.
- *L'ordine.* Nel passo i comandi si eseguono per (passo, giocatore,
  numero) (commands.js runDue, gia' cosi' da §9.153): l'ordine d'arrivo non
  conta. Ogni messaggio dice a che passo si riferisce, quindi anche il
  disordine non conta (il canale vero e' comunque in ordine; i turni arrivati
  prima di "start" si tengono da parte). I propri comandi si eseguono nella
  copia passata da JSON, cioe' come li riceve l'altro (-0, NaN, campi
  undefined uguali per tutti e due). Un turno coi comandi di un altro
  giocatore o di un altro passo si scarta.
- *Le impronte.* Ogni 300 passi (CHECK_EVERY) ogni pagina manda l'impronta
  (snapshot.js stateHash, `{t: "H"}`); diverse: la barra "Le due partite non
  sono piu' uguali (passo N): da qui i due giocatori possono vedere cose
  diverse", lo stato completo (stateDump) in `__game.net.desyncDump` e in
  console. Si confronta fino alla fine della partita (global.skWinner, allo
  stesso passo nelle due pagine); dopo, vittoria e sconfitta sono di chi
  guarda (§9.155) e le pagine vanno avanti da sole, senza turni ne' attese.
- *La pausa* e' un comando ("pausa", col passo in cui e' stata chiesta): Esc
  o il pulsante di pausa (o il puntatore liberato) la chiedono, le due
  pagine si fermano allo stesso passo col menu di pausa e il sottotitolo
  "Pausa del giocatore rosso/blu". Riprende chi vuole dei due (Riprendi o
  Esc: `{t: "R", at}` col passo della pausa; se arriva prima che l'altra
  pagina ci sia arrivata, quella pausa non si apre). Due pause chieste
  insieme ne fanno una sola (si ignora una pausa chiesta prima dell'ultima
  eseguita). La pausa non tocca la partita: e' solo tempo fermo.
- *L'avvio.* Aperto il canale ognuno manda `{t: "hello"}` con versione del
  gioco e del protocollo (diverse: "L'altro giocatore ha un'altra versione
  del gioco"). Chi crea misura i ping e manda `{t: "start", delay}`; si parte
  dal passo 0 (il ciclo gira gia' durante la sala d'attesa, ma i passi
  aspettano: dietro c'e' il nero della dissolvenza d'ingresso, che parte col
  primo passo).
- *La fine del canale.* Lasciare la partita ("Lascia la partita" nella
  pausa, "Torna al menu", chiudere la pagina) manda `{t: "bye"}`: l'altro
  legge "L'altro giocatore ha lasciato la partita."; il canale chiuso senza
  saluto: "La connessione con l'altro giocatore si e' persa." In tutti e
  due i casi la partita si ferma col menu di pausa (senza "Riprendi") e la
  barra rossa. Dopo la fine della partita niente avvisi.

**Decisioni dell'autore dopo la prima versione** (17 novembre 2026, stessa
PR): "sì, fai valere la tregua e metti in grigio quei riquadri. invece che
'partita a due' scriverei 'multigiocatore online' o simile".
- *Il nome*: "Multigiocatore online" (en "Online multiplayer", es
  "Multijugador en línea", pt "Multijogador online", de
  "Online-Mehrspieler", fr "Multijoueur en ligne"), sul pulsante e nei
  titoli dei pannelli.
- *La tregua nella partita online*: per i minuti scelti nessuno dei due
  puo' attaccare l'altro (contro la CPU invece la tregua e' solo "la CPU non
  manda attacchi"). Come: lo specchio delle parti (multiplayer.js,
  §9.155), durante la tregua (`mp.truce`, deciso a ogni passo dal tempo
  della partita: skirmish.js `pvpTruce`), traduce i nomi del nemico
  ("enemy_unit", "enemy_build", tutte le chiavi di ENEMY_EQ) in un nome che
  non c'e': per il codice di ogni giocatore l'avversario non esiste come
  bersaglio (attacchi automatici, ordini d'attacco col clic destro, torri,
  castelli e centri che tirano, arieti e catapulte, fuoco), e le collisioni
  col nemico (frecce, proiettili) sono spente (world.js `_collisions`).
  Non per `create`, ne' per la minimappa (`mp.noTruce` mentre si disegna
  l'interfaccia: i nemici visti si vedono anche in tregua). Il conto alla
  rovescia c'era gia' negli obiettivi ("Tregua: 4:53"), per tutti e due.
  Prova `test/browser/truce.mjs` (nella CI): tregua di 5 minuti, guerrieri e
  arcieri rossi e blu a 80 px, ordini d'attacco reciproci e due blu contro il
  centro rosso: dopo 900 passi vite e centri intatti, nessuna freccia; la
  minimappa vede i 9 nemici; finita la tregua (qui accorciata a 0) gli
  stessi si combattono (rossi vivi 4, blu 1).
- *I riquadri in grigio*: col pannello aperto difficolta' e stile della CPU
  sono piu' trasparenti, senza frecce, con l'icona velata, e non si
  cambiano; "Inizia" e' spento. Per lasciare visibile la griglia il
  pannello non copre piu' tutto lo schermo: sta nella colonna della mappa
  (netui.js, `dock`), con la mappa scelta dalle sue frecce (il riquadro
  della mappa sotto non si disegna).

**Altre richieste dell'autore** (17 novembre 2026, stessa PR): "nella
minimappa il giocatore blu deve vedere i suoi edifici/personaggi blu e
marroni quelli dell'altro giocatore, in modo da non fare confusione"; "una
chat che si apre e si spedisce con invio, con i messaggi che compaiono a
sinistra nella GUI tra il pannello risorse e la minimappa".
- *La minimappa*: i colori erano "tuoi marroni, nemici blu" per tutti, e il
  blu vedeva i suoi marroni. Ora dipendono da chi guarda (minimap.js
  `sideColours`): il rosso (e il gioco in singolo) come prima, il blu i suoi
  blu e quelli del rosso marroni. Prova in test/minimap.test.mjs; si vede
  negli screenshot della PR.
- *La chat* (`chat.js`): Invio apre una casella in basso nello spazio fra il
  pannello delle risorse e la minimappa (manager.js `chatArea`; con la
  minimappa chiusa fino al suo pulsante), Invio manda, Esc chiude (senza
  aprire la pausa). I messaggi si disegnano li', dal basso, su un fondo
  bianco come gli altri riquadri, col nome e nel colore di chi scrive
  ("Rosso: ...", "Blu: ..."), al piu' 200 caratteri; si vedono 15 s e
  svaniscono in 3 (con la casella aperta tutti quelli che ci stanno). A
  partita cominciata un messaggio grigio: "Premi Invio per scrivere
  all'altro giocatore." Viaggiano sul canale ({t: "C"}, lockstep.js
  `sendChat`) ma fuori dai turni: non toccano la partita (netfake.mjs:
  stessa impronta finale con e senza chat). I tasti battuti nella casella
  si fermano li': un "q" scritto non mette in coda un civile (netfake.mjs lo
  controlla: nessun tasto arrivato al gioco). Si scrive a partita
  cominciata, anche dopo la fine, finche' c'e' il canale. Il "#" (che nei
  testi del gioco va a capo) si mostra come uno spazio.
  Trovato e corretto nello screenshot: riaperta, la casella compariva in
  alto a sinistra (la sua posizione restava quella della casella di prima);
  rtc.mjs ora la riapre e ne controlla il posto.
  Prove: lockstep.test.mjs (la chat passa, nessun comando in coda),
  netfake.mjs (il rosso scrive coi tasti veri, il blu riceve), rtc.mjs (il
  blu scrive su WebRTC vero, il rosso riceve; la casella riaperta al suo
  posto, Esc la chiude).

**Scelte mie** (da rivedere con l'autore se vuole):
- chi crea e' il rosso, chi entra il blu (la posizione sulla mappa resta a
  caso col seme, come contro la CPU);
- nella partita in rete niente salvataggi (ne' automatici), niente
  "Ricomincia livello" e niente trucchi (V + Alt: il comando arriva ma non
  fa niente); il menu di pausa ha "Lascia la partita" al posto di "Torna al
  menu";
- la pausa la riprende chiunque dei due;
- [il nome, la tregua: decisi dall'autore, sopra]
- i server STUN: `stun.l.google.com:19302` e `stun.cloudflare.com:3478`
  (rtc.js STUN_SERVERS). Sono servizi esterni (vedono gli indirizzi dei due
  giocatori, nessun dato della partita): [decisione dell'autore, 17
  novembre 2026] "STUN di Google e Cloudflare va bene, tienili". `?stun=0` (anche dal menu: passa alla partita) ne fa a meno, per le prove
  in locale.

**Trovato per strada.**
- *Chi entra va in "failed" prima della risposta.* Chi entra comincia i
  controlli di connessione appena crea la risposta, ma chi ha creato non
  risponde finche' non incolla il codice di ritorno: senza risposte Chromium
  dice "failed" dopo ~15 s (sonda con un indirizzo irraggiungibile). Non e'
  la fine: con la risposta incollata dopo 40 s (e dopo 60 s, con indirizzi
  raggiungibili) si collegano lo stesso. Quindi prima che il canale si sia
  mai aperto "failed" non chiude niente (rtc.js), e chi entra continua ad
  aspettare; chi crea, se dopo aver incollato la risposta non si collega in
  25 s (o il browser dice "failed"), legge il messaggio delle reti che non
  si collegano, ma resta in ascolto (se poi si collega, si parte). Su reti
  vere con NAT, se chi crea aspetta troppo a incollare la risposta, la
  connessione potrebbe non riprendersi: da provare a mano.
- Difetti del gioco: nessuno trovato in questo lavoro (le prove esistenti,
  sotto).

**Prove.**
- `test/lockstep.test.mjs` (unitaria): due "pagine" con un mondo
  giocattolo e un canale finto che ritarda fino a 6 giri e rimescola, a
  velocita' irregolari: stesso stato e stessi comandi agli stessi passi
  (3 semi, 400 passi), nessun comando prima di D passi; l'avvio e il
  ritardo misurato; versioni diverse; la pausa allo stesso passo, una
  ripresa prima della pausa, due pause chieste insieme; una differenza vista
  alla prima impronta da tutte e due; il saluto, il canale perso, la fine.
  I codici: andata e ritorno, incollati con a capo e virgolette, errori.
- `test/i18n.test.mjs`: ogni tr("...") di netgame.js e pause.js ha la sua
  traduzione.
- `test/browser/netfake.mjs` (nella CI): due pagine (rosso 1280x720, blu
  960x600) con `?net=fake`, il lockstep vero, e la prova che porta i
  messaggi in ritardo (fino a 6 giri) e in disordine, con le pagine che
  avanzano a scatti irregolari (0-4 passi per giro). I comandi li danno le
  pagine per la strada vera (world.act): civili in coda, legna, la casa
  blu; al passo 900 due eserciti al centro; la pausa con Esc vero in A,
  ripresa con Esc in B. Sk_padus, seme 7, 2400 passi, ritardo 5: 8 confronti
  su 8 uguali, la stessa impronta alla fine, gli stessi 8 comandi agli
  stessi passi nelle due pagine (ognuno 5 passi dopo il passo in cui e'
  stato dato), la pausa allo stesso passo (1306/1306), legna 330/250, la
  casa blu, morti da tutte e due le parti. Controlli: la pagina B cambiata di
  nascosto (7 di legna al blu) -> tutte e due avvisano al passo 2700; A
  lascia la partita -> B "L'altro giocatore ha lasciato la partita", ferma.
- `test/browser/rtc.mjs` (nella CI): WebRTC vero fra due pagine dello stesso
  Chromium, tutto il percorso coi clic e le caselle veri, a tempo vero: A
  nel menu (Schermaglia, Partita a due, Crea), B nel menu (incolla il codice
  di A con del testo attorno, Entra), A incolla la risposta (Collega); la
  partita parte nelle due pagine (stesso seme e room, rosso e blu, la sala
  d'attesa sparita); un civile per parte; pausa con Esc in A, ripresa con
  Esc in B (stesso passo); 950 passi coi confronti a 300, 600, 900 uguali;
  A torna al menu e B lo sa. In questa macchina: codice 775 caratteri,
  risposta 606, ritardo 4 passi, andata e ritorno 2 ms.
- Il gioco in singolo non cambia: col seme fisso le impronte di
  determinism.mjs (sk_padus, lvl06, match, 3000 passi) sono le stesse di
  main (2c37b62) prima del lavoro.
- Anche netfake.mjs su sk_bardonis (seme 3: 8 confronti su 8 uguali) e su
  sk_padus con un canale piu' lento (LAG=14 giri): la stessa impronta finale
  (e4d4250e086557c3) del canale a 6 giri: la partita non dipende dai tempi
  del canale.
- La suite completa nel browser della CI (le 45 prove di prima piu' le due
  nuove), in questa macchina, 4 alla volta: 47 su 47 passate. Dopo la
  tregua e il menu nuovo: rtc, netfake, truce, pvp, PVP=2 replay e
  determinism (sk_padus, ancora le impronte di main) di nuovo verdi.

**Come riprendere** (cosa resta, in ordine di utilita'):
1. *Provarla su due computer veri*, in due reti diverse (casa e telefono,
   due case): e' l'unica prova che manca (qui le due pagine sono nella
   stessa macchina). Dopo l'unione su main: https://andlll.github.io/535collapse/
   da due computer, Schermaglia, Partita a due. Se non si collegano: il
   messaggio delle reti; se si separano: la barra arancione, e in console
   (F12) "[535 rete] partite diverse" con lo stato (`__game.net.desyncDump`
   da confrontare fra i due).
2. *TURN* (un server di inoltro, a pagamento o self-hosted: decisione
   dell'autore) per le reti che non si collegano; basta aggiungerlo a
   `iceServers` in rtc.js.
3. *Codici piu' corti*: un SDP ridotto ai campi necessari (ufrag, pwd,
   fingerprint, indirizzi: ~150 caratteri) ricostruito dall'altra parte,
   oppure un piccolo servizio di presentazione con codici di 6 lettere
   (§9.152). [Fatto in §9.202, la prima strada.]
4. *Il ritardo adattivo*: oggi D si misura una volta all'avvio; si
   potrebbe rimisurare (i turni portano gia' il passo) e cambiarlo d'accordo
   a un passo futuro.
5. *Riconnettersi* dopo una caduta breve (oggi la partita si ferma), i
   salvataggi nella partita in rete (tutte e due le pagine dallo stesso
   stato), la velocita' come comando (il gioco non ha velocita' diverse).
6. Le cose rimaste da §9.155 ("Cosa resta"): altri confronti di nomi
   d'oggetto per il blu, global.order comune, il vantaggio di chi nasce dopo
   (equita').


### 9.157 Il menu: "Giocatore singolo" e "Multigiocatore"

Richiesta dell'autore (18 novembre 2026, nuova PR, versione 0.2613):
"mettiamo a monte 'giocatore singolo' che conterrà campagna e schermaglia
(nella schermaglia deve scomparire il tasto multiplayer), e 'multiplayer',
che contiene 'crea partita' e 'partecipa'. Crea partita apre la schermata
che prima si apriva cliccando 'multiplayer' da 'schermaglia', [...] con le
opzioni in grigio per i punti in cui non ha senso. Quando si crea la
partita con il tasto in basso a destra [...] deve comparire la schermata di
condivisione codici. In 'partecipa' [...] la schermata per inserire il
codice fornito, senza tutta l'interfaccia di opzioni della schermaglia."

**Com'e' ora.** La colonna dei pulsanti del menu ha tre pagine (menu.js
`MENU_PAGES`, `i.page`):
- il titolo: "Gioca il tutorial", "Giocatore singolo", "Multigiocatore",
  "Carica partita";
- "Giocatore singolo": "Campagna - Collapse", "Schermaglia", "Indietro";
- "Multigiocatore": "Crea partita", "Partecipa", "Indietro".
Le colonne finiscono tutte a 100 px dal fondo (al posto di "Indietro" c'era
"Carica partita": un doppio clic su "Giocatore singolo" o "Multigiocatore"
non torna indietro); il logo resta dove sta nel titolo.
- *Schermaglia*: com'era, senza il pulsante "Multigiocatore online".
- *Crea partita*: la stessa schermata (titolo "Crea partita"), con il
  riquadro della mappa e le sue frecce di sempre, difficolta' e stile della
  CPU in grigio (come in §9.156); il pulsante in basso a destra si chiama
  "Crea partita" e apre la partita di chi crea con la sala d'attesa e i
  codici (netgame.js `hostGame`: quello che faceva "Crea una partita" nel
  pannello). Le opzioni sono quelle salvate della schermaglia (le stesse
  nelle due schermate).
- *Partecipa*: un pannello al centro sopra il menu (netgame.js
  `joinMenu`): "Incolla qui il codice che hai ricevuto da chi ha creato la
  partita:", la casella, poi (con un codice valido) la partita in testo
  ("Mappa: Padania. Vittoria: Conquista, ... Giocherai col blu.") ed
  "Entra"; "Indietro" o Esc lo chiudono.
- *Indietro*: Esc o "Indietro" dalle due pagine tornano al titolo; dalla
  schermaglia e dalla campagna si torna a "Giocatore singolo" (anche
  tornando al menu da un livello della campagna), da "Crea partita" a
  "Multigiocatore".

**Tolti** (non servono piu'): il pannello agganciato alla colonna della
mappa con le sue frecce e l'anteprima del codice nella griglia (netui.js
`dock`, `chooser`; menu.js `netDock`, `netPreview`; netgame.js `netMenu`),
e tre testi ("Against another player...", "Create a game", "Or paste here
the code you received:"). Testi nuovi in sei lingue: "Single player"
(Giocatore singolo), "Multiplayer" (Multigiocatore), "Create game" (Crea
partita), "Join game" (Partecipa) e la frase del pannello. I nomi dei
pulsanti dei menu passano dalla prova delle traduzioni (`MENU_LABELS`).

**Scelte mie** (da rivedere con l'autore se vuole): il tutorial e "Carica
partita" restano nel titolo (la richiesta non li nomina); "Indietro" e' un
pulsante della colonna, non il cerchio in alto a destra (li' c'e' lo
schermo intero); in italiano "Multigiocatore" (come "Multigiocatore
online" scelto in §9.156).

**Prove.** `test/browser/rtc.mjs` (nella CI) segue il percorso nuovo coi
clic veri: A "Multigiocatore", "Crea partita", un clic sulla difficolta'
(in grigio: non cambia), "Crea partita" in basso a destra; B
"Multigiocatore", "Partecipa", incolla il codice, "Entra"; poi come prima
(WebRTC vero, pausa, impronte, chat, uscita): passata. Passate anche
netfake.mjs, soak.mjs sul menu, `npm test`, e ui.mjs nelle sei lingue (che
ora disegna le tre pagine della colonna con ogni pulsante acceso): nessun
problema. Screenshot di tutte le schermate in italiano, spagnolo e tedesco:
i testi stanno nei pulsanti.


### 9.158 Indietro, la chat coi ritratti, l'icona della partita non sincronizzata, i problemi di connessione

Risposte e richieste dell'autore (18 novembre 2026, stessa PR di §9.157,
versione 0.2613), sulle scelte di §9.157: tutorial e "Carica partita" nel
titolo "si' corretto", i nomi "va benissimo", le opzioni condivise "va bene
tanto uno puo' cambiarle mentre si trova li'" (si': in "Crea partita" chi
crea cambia tutte le opzioni tranne quelle della CPU; dalla sala d'attesa
in poi sono fisse, e chi entra non le cambia). Poi:

**"Indietro"**: "mettilo subito a sinistra di quello per lo schermo
intero". Nelle pagine "Giocatore singolo" e "Multigiocatore" e' un cerchio
di vetro con la freccia (ico_indietro, come nella campagna) a 70 px dal
cerchio dello schermo intero; dove lo schermo intero non c'e' (iPhone) sta
al suo posto. La colonna ha solo i due pulsanti (menu.js titleButtons,
`back`).

**La chat**: "togli le scritte 'giocatore rosso' e 'giocatore blu', si
capisce gia' dal colore [...] possiamo sostituirle con le bolle usate nella
campagna". Davanti a ogni messaggio il ritratto tondo dei dialoghi, 26 px:
il soldato del giocatore (capoccia_a1) per il rosso, quello nemico, blu
(capoccia_n1), per il blu; il testo accanto, nel colore di chi scrive (a
capo sotto il testo, non sotto il ritratto). I messaggi del gioco senza.
Via i testi "Red" e "Blue".

**La partita non sincronizzata**: "la scritta in alto [...] prende troppo
spazio, sostituiamola da un'icona (ora capiamo insieme), se uno fa hovering
sull'icona appare l'hint [...] stesso stile scritta su roundrect glass come
gli hint soliti". Al posto della barra arancione un cerchio di vetro sotto il
riquadro dei civili inattivi (sotto gli FPS se si vedono), col segno
"diverso" nel colore degli avvisi, che lampeggia per 6 s quando compare;
col puntatore sopra, alla sua sinistra, il riquadro dei suggerimenti
(bianco, largo 380, titolo "Partita non sincronizzata" e il testo di prima:
"Le due partite non sono piu' uguali (passo N): da qui...") (netgame.js
`drawDesync`, chiamata da app.js dopo la chat). *L'icona e' provvisoria*:
da scegliere con l'autore (un disegno suo, come le altre). Le altre barre
(l'attesa dell'altro giocatore, la connessione persa) restano.

**I problemi di connessione**: "se la connessione iniziale fallisce mettiamo
una segnalazione errori piu' mirata e meno generica, eventualmente facciamo
anche una pagina di troubleshooting fatta bene a cui si arriva da li'".
- *Le cause* (netdiag.js, senza browser): dai due codici si leggono gli
  indirizzi delle due parti (i "candidati" ICE: del computer, esterni dati
  da STUN, di inoltro) e dal tentativo le statistiche (getStats: coppie
  provate, controlli mandati e risposte). Le cause, dalla piu' probabile:
  nessun indirizzo (impostazioni o estensioni che spengono WebRTC); la rete
  che non raggiunge STUN (UDP bloccato: firewall, reti aziendali o
  scolastiche, VPN), da una parte o dall'altra; NAT simmetrico da tutte e
  due le parti, o da una (lo stesso indirizzo esterno con piu' porte di
  quante prese ha il computer: il browser chiede ai due server STUN dalla
  stessa presa; contato per difetto, meglio non dirlo che dirlo a torto);
  solo IPv6 da una parte e solo IPv4 dall'altra; lo stesso indirizzo esterno
  (la stessa rete che non lascia passare: Wi-Fi ospiti, isolamento); i
  codici scambiati in piu' di 2 minuti (i router dimenticano gli indirizzi);
  se no "le reti non hanno lasciato passare, e dai codici non si capisce
  perche'". Ognuna ha la sua frase, nelle sei lingue (nethelp.js
  `causeText`).
- *Nella sala d'attesa*: chi crea, se dopo aver incollato la risposta il
  canale non si apre in 25 s (o il browser dice "failed"), legge "Collegamento
  non riuscito." con la causa (e, se c'e', il consiglio dei codici lenti) e
  "Il pulsante qui sotto spiega cosa provare."; sotto, "Problemi di
  connessione". Prima del tentativo, se una causa e' sicura (nessun indirizzo,
  STUN bloccato, NAT simmetrico da tutte e due le parti, IPv4/IPv6), un
  avviso arancione "Probabilmente il collegamento non riuscira':" (lo legge
  anche chi entra, appena ha il suo codice). Chi entra non sa quando l'altro
  incolla: dopo 90 s senza collegamento "Ancora non collegati. Se l'altro
  giocatore ha gia' incollato il tuo codice e non succede niente, il
  collegamento non e' riuscito." e il pulsante.
- *La risposta sbagliata*: la risposta ora dice a quale codice risponde
  (`o`, l'ice-ufrag dell'offerta); incollata a chi ha un altro codice (la
  pagina ricaricata, un codice di prima) e' rifiutata subito: "Questo codice
  di risposta e' stato fatto per un altro codice della partita (uno di
  prima?): rimanda all'altro giocatore il codice attuale e incolla la nuova
  risposta."
- *La guida "Problemi di connessione"* (nethelp.js `showNetHelp`): un
  pannello sopra la sala d'attesa (quasi opaco; Esc chiude solo lei,
  netui.js: Esc e' del pannello piu' in alto), che scorre: come funziona il
  collegamento; "Cosa non ha funzionato" (le cause trovate); "Prima di
  tutto" (stessa versione, browser aggiornato, codici scambiati in fretta
  senza ricaricare la pagina); "Prova un'altra rete" (l'hotspot del
  telefono, il NAT simmetrico delle reti mobili); "Reti aziendali,
  scolastiche e pubbliche, VPN"; "Firewall, antivirus, estensioni del
  browser" (Brave, Firefox, uBlock che spengono WebRTC); "Sulla stessa rete"
  (rete ospiti, cavo); "Altre cose da provare" (scambiarsi i ruoli, il
  router e UPnP, un altro browser); "Se non funziona niente" (il server di
  inoltro che manca); "Dettagli tecnici" (versione, ruolo, quanti indirizzi
  di ogni tipo per parte, NAT, cause, tempi, statistiche, browser: senza gli
  indirizzi) con "Copia". In italiano i dettagli tecnici (sono per chi aiuta).
- netui.js: `heading`, paragrafi con pallino, lo stato "warn" (arancione).
- 38 testi nuovi nelle sei lingue.

**Prove.**
- `test/netdiag.test.mjs` (unitaria): descrizioni WebRTC finte come le
  scrive Chromium (una casa, una rete mobile con due porte, una rete che
  blocca UDP, solo IPv6, nessun indirizzo, due prese dietro lo stesso
  router): ogni causa, l'avviso solo con quelle sicure, senza STUN nessun
  "bloccato", le statistiche, i dettagli senza indirizzi.
- `test/i18n.test.mjs`: anche i testi di nethelp.js e della guida.
- `test/browser/rtcfail.mjs` (nella CI, nuova): WebRTC vero fra due pagine,
  coi codici cambiati in indirizzi che non rispondono (192.0.2.x, porta 9):
  la risposta per un altro codice rifiutata col suo messaggio; la risposta
  giusta: dopo 25 s "Could not connect. ... The button below explains what
  to try.", il pulsante, la guida (18 testi, i dettagli tecnici senza
  indirizzi), Esc chiude la guida e non la sala d'attesa. Trovato
  scrivendola: in questa macchina un indirizzo che non risponde ma con la
  porta giusta arriva lo stesso alla pagina accanto (le due pagine si
  collegavano): la prova cambia anche la porta.
- `test/browser/netfake.mjs`: la partita non sincronizzata non mostra piu'
  la barra; l'icona e il suggerimento si disegnano (screenshot).
- `test/browser/rtc.mjs` col menu nuovo (due pulsanti per pagina), ui.mjs
  nelle sei lingue (anche il cerchio "Indietro"), soak.mjs sul menu,
  `npm test`: passate. Screenshot: il menu, la chat coi ritratti, l'icona
  col suggerimento, la sala d'attesa col collegamento non riuscito, la
  guida.
- Non provato: le cause su reti vere (NAT simmetrico, UDP bloccato,
  IPv6): qui le due pagine stanno nella stessa macchina. Da provare con
  l'autore su due reti diverse (§9.156 "Come riprendere", punto 1): se la
  causa detta e' sbagliata, i dettagli tecnici dicono perche'.


### 9.159 Il messaggio della chat piu' corto

Richiesta dell'autore (18 novembre 2026, stessa PR, versione 0.2613):
"riusciamo a sostituire 'premi invio' ecc ecc con un testo piu' corto?". Il
messaggio grigio a partita cominciata ("Premi Invio per scrivere all'altro
giocatore.") ora e' **"Invio per la chat"** (en "Enter to chat", es "Intro
para el chat", pt "Enter para o chat", de "Enter zum Chatten", fr "Entrée
pour le chat"), su una riga. Il suggerimento dentro la casella aperta
("Messaggio all'altro giocatore (Invio: manda, Esc: chiudi)") resta.
Prove: `npm test` (la traduzione c'e'), screenshot della chat.

### 9.160 Gli archi della musica: la versione che fa il giro

Richiesta dell'autore (18 novembre 2026, stessa PR, versione 0.2613):
"loop archi della soundtrack: ti carico una versione aggiornata con
effettivo loop da sostituire all'attuale" (`535_loop1archi_loop.wav`).

- *Il file*: WAV 16 bit, stereo, 32 kHz (il vecchio era un MP3 a 44,1 kHz),
  42,000 s esatti: il giro di prima. Comincia col suono (la coda del giro
  precedente) invece che dal silenzio (il vecchio partiva a 1,4 s dal primo
  suono vero, e a ogni giro c'era il buco), e la fine va nell'inizio senza
  salti: il passo fra l'ultimo campione e il primo (0,010 e 0,013 sui due
  canali) sta fra il 99 e il 99,9 percentile dei passi del mezzo secondo
  intorno, cioe' niente clic. Volume medio -37,0 dB (prima -37,2), picco
  -21,1 (prima -22,3); l'andamento secondo per secondo e' lo stesso.
- *Al posto del vecchio*: `nuovi/audio/loop1_archi.wav` (via
  `loop1_archi.mp3`), in audio.json senza tagli (prima si toglievano i
  4,9 ms di riempimento dell'MP3) e a 256 kbit/s invece di 320: confrontato
  col WAV a 320, 256, 192 e 160, a 256 le bande sono uguali entro 0,05 dB fino
  a 14 kHz (14-16 kHz -1 dB, come a 320; a 192 tutto -0,26 dB), 1,3 MB invece
  di 1,6. CREDITI.md aggiornato. Il resto (music.js, audio.js) non cambia: gli
  archi restano costanti, sul loro giro di 42 s accanto al field (92 s) e al
  drone (214 s).
- *Verificato*: `tools/18_audio.py` da' `musica_archi_1.mp3` lungo 42,0000 s;
  decodificato da Chromium (decodeAudioData) 42,000 s a 32 kHz, e il salto
  al giro (0,011) e' sotto il passo piu' grande dell'ultimo mezzo secondo
  (0,012). Da sentire con l'autore nel gioco.

### 9.161 Il brano 2 della musica ("Shove") e la scaletta dei brani

Richiesta dell'autore (18 novembre 2026, stessa PR, versione 0.2613), coi
quattro loop del brano 2 (`shove_pianoloop`, `shove_bassloop`,
`shove_dr1loop`, `shove_dr2loop`): "deve partire solo il piano che resta
costante come fanno gli archi, poi il basso progressivamente e deve andare a
pieno volume in 10s circa. dr1 si alza di volume da volume 0 a pieno se ci
sono nemici vicini e nelle fasi di combattimento, dr2 idem ma per
battaglie/gruppi di nemici superiori a 4-5. [...] lo implementerei
sicuramente in lvl1 come unico loop, nelle schermaglie dopo che il loop1 e'
terminato (dopo 5 min circa?), poi va per 5 min lui e si alterna
ciclicamente col loop 1, negli altri scenari di campagna valutiamo caso per
caso, ha senso che parta i primi 5 min dello scenario 3 per poi alternarsi
col loop 1, e forse anche il lvl5 partendo pero' al massimo perche' la
battaglia e' in corso".

**I file** (WAV 16 bit, stereo, 32 kHz; `nuovi/audio/loop2_*.wav`, in
audio.json come le parti del brano 1, MP3 a 256 kbit/s senza taglio degli
acuti; CREDITI.md):
- piano 10,000 s, medio -37,2 dB (come gli archi), picco -20,9;
- basso 40,000 s, medio -26,8 dB, picco -3,6 (meta' dell'energia sotto i
  200 Hz);
- percussioni 1 e 2, 4,000 s, medi -27,1 e -24,1 dB.
I giri (4, 10, 40 s) sono multipli di 4 s: le parti restano a tempo fra loro
se partono insieme (si fa cosi', sotto). Decodificati: esattamente 4, 10 e
40 s. Al giro: basso e percussioni senza salti; il piano ha, dall'ultimo
campione al primo, un passo di 0,004 (-48 dBFS), il piu' grande del mezzo
secondo intorno (la forma d'onda scende alla fine e risale dall'inizio):
piccolo, lasciato cosi' com'e', *da sentire*: se fa un tic, un'esportazione
con la fine che arriva al valore dell'inizio, o qualche ms di incrocio qui.
Tutte e quattro insieme al pieno: picco -1,3 dBFS (niente saturazione).

**La scaletta** (music.js `musicPlan`, letta da audio.js):
- lvl01: solo il brano 2;
- schermaglie (e la partita online): il brano 1, poi il 2, poi l'1, a turno;
- lvl03: il brano 2 per primo, poi a turno;
- lvl05: come lvl03, ma il primo turno del brano 2 parte al pieno (piano,
  basso e percussioni subito su; le percussioni restano almeno 20 s, poi
  seguono il combattimento);
- le altre (tutorial, lvl02, lvl04, lvl06): solo il brano 1, come prima.
Un turno dura i giri interi del brano piu' vicini a 5 minuti, cosi' finisce
alla fine di un giro: il brano 1 7 giri degli archi (294 s), il brano 2 8
giri del basso (320 s). Al cambio le parti del brano che finisce sfumano in
qualche secondo (costante 1,5 s) e quelle del nuovo partono insieme
dall'inizio (il piano subito, il basso da zero). Il tempo e' quello
dell'audio (continua anche in pausa); un salvataggio caricato ricomincia la
scaletta.

**Il brano 2** (music.js `musicLevels`): piano 1; basso da 0 al pieno nei
primi 10 s del turno (`bassRamp`; ogni volta che il brano 2 ricomincia);
percussioni:
- *dr1*: su (in ~1-2 s) se c'e' almeno un nemico visto a 500 px da una tua
  unita' (`near`), o se una tua unita' e' stata colpita negli ultimi 3 s
  (le zone "battle" degli allarmi d'attacco: anche le frecce dalla nebbia);
- *dr2*: su con almeno 5 nemici vicini (`dr2Min`);
- restano su 10 s dopo l'ultima volta (`hold`), poi sfumano (~8 s).
Contano i nemici visti (con la nebbia, solo quelli che vedi: niente
spoiler) vicini alle *unita'* (civili compresi), non agli edifici: provato
in lvl01, che all'inizio ha 24 nemici visti di guardia, fermi accanto a mura
e porte della citta', a piu' di 1400 px dai soldati: con gli edifici le
percussioni sarebbero partite subito e non si sarebbero piu' fermate; e non
gli incendi (in lvl01 la citta' brucia per tutto il livello). Nella partita
a due ognuno sente la sua (lo specchio di chi guarda, e anche il drone segue
la popolazione del blu per il blu).
Il calcolo legge soltanto il mondo (nessun numero a caso, niente che cambi la
partita): provato in lvl05 (la battaglia in corso, le percussioni su), 6000
passi con la musica che suona e senza: le stesse impronte (snapshot.js) a
ogni 1000 passi.

**audio.js**: `music(levels)` accetta una funzione del brano che suona ({
brano, elapsed, full }); la scaletta (`musicPlan`, da app.js), il turno
(`planAt`), le parti di un brano che partono dall'inizio del turno, quelle
degli altri che sfumano e si fermano; per parte i tempi di salita e discesa
(music.js `PART_TAU`: il basso insegue la rampa, le percussioni salgono in
fretta).

**Prove.** test/music.test.mjs: la scaletta per room, i turni e il ritorno
al brano 1, il primo turno al pieno solo in lvl05 e solo la prima volta, la
rampa del basso, le percussioni (nemico vicino, sei nemici, non visti, gli
edifici no, colpi recenti si', gli incendi no, i 10 s dopo, i 20 s di lvl05).
Nel browser, con l'audio vero (Chromium): lvl01 parte col piano, il basso a
0,77 a 8 s e pieno a 14, nessuna percussione; sei nemici accanto ai soldati:
dr1 e dr2 al pieno; sk_padus parte col brano 1, a 294 s passa al 2 (basso in
salita, percussioni zitte finche' non arrivano nemici, poi su), a 614 s
torna all'1; lvl05 tutto al pieno da subito. soak.mjs su lvl01, lvl03,
lvl05, sk_padus: nessun errore.

**Da regolare a orecchio con l'autore**: la distanza dei nemici (500 px),
quanti per dr2 (5), quanto restano su (10 s), la durata dei turni (5 min), i
volumi relativi (il basso e' 10 dB sopra il piano, come nell'esportazione).

### 9.162 L'icona della partita non sincronizzata: il globo

Richiesta dell'autore (18 novembre 2026, stessa PR, versione 0.2613), con un
disegno (96 x 96, nero su trasparente): "usa questo simbolo al posto
dell'uguale barrato per la desincronizzazione segnalata a destra nel
multiplayer". Il disegno e' `nuovi/sprites/net_globo.png`, in nuovi.json
"derivati" come `ico_desync` (64 px, nero al 70% come le altre icone
dell'originale, gruppo gui); netgame.js `drawDesync` lo disegna a 0,55 (35
px, quanto l'icona degli inattivi sopra) nel cerchio di vetro sotto gli
inattivi, al posto del segno "diverso" provvisorio di §9.158. Resta il
lampeggio arancione del cerchio nei primi 6 s, e il suggerimento col
puntatore sopra. Prova: netfake.mjs (la partita resa diversa di nascosto:
l'icona e il suggerimento si disegnano, screenshot), passata.

### 9.163 Il rosso non vedeva i pulsanti del municipio

Segnalazione dell'autore (18 novembre 2026, nuova PR, versione 0.2614): "bug
nel multiplayer: il giocatore rosso non vede la parte della GUI relativa ai
pulsanti (costruzione, creazione unita'...)".

**La causa.** Il codice del giocatore gira in ogni pagina per le istanze
delle due parti (§9.155): nella pagina del rosso anche lo Step di
p2_centro, in quella del blu lo Step di centro. Lo Step del centro
(buildings.js) fa "selezionato: crea i pulsanti (omino_clicker, il civile;
centro_indietro_clicker, l'annulla); non selezionato: via i pulsanti". I
pulsanti sono dell'interfaccia (nessun gemello, nessuna traduzione nello
specchio): il centro dell'altra parte, che in quella pagina non e' mai
selezionato, distruggeva i pulsanti di chi guarda. Chi li perdeva dipende
dall'ordine dei due centri nella room (skirmishPrepare: l'angolo della
mappa e il lato scelto): se il centro dell'altro viene dopo, i pulsanti
spariscono a ogni passo appena creati; se viene prima, li distrugge e il
proprio li ricrea subito (si vedono, ma rinascono a ogni passo, e il loro
Destroy rimette global.sele a 0: il puntatore sopra il pulsante non
contava). Nella partita dell'autore toccava al rosso; con ?pvp=1 su
sk_padus seme 5 al blu (misurato: senza la correzione il blu, selezionato
il centro, ha 0 pulsanti, il rosso 2). Lo stesso per i lampeggi delle
risorse (pop_blink: la popolazione piena dell'altro lampeggiava anche per
chi guarda).

**La correzione** (world.js `_foreignUi`). Nella partita a due l'interfaccia
(le istanze ui: pulsanti, lampeggi, fantasmi, suggerimenti) e' di chi
guarda: un evento di un'istanza dell'altra parte, o un comando dell'altro
giocatore (mp.actor), non crea ne' distrugge istanze dell'interfaccia.
`fire` ricorda l'istanza dell'evento in corso; `create` restituisce
un'istanza gia' morta (chi la usa non se ne accorge; via a fine passo),
`destroy` non fa niente. Le neutre (risorse, sk_manager) e le funzioni
dell'interfaccia di app.js restano come prima; fuori dalla partita a due
niente cambia. L'interfaccia non entra nell'impronta (§9.152): la partita
resta la stessa nelle due pagine.

**Visto cercando: il rettangolo di selezione.** global.multi (il
rettangolo che chi guarda sta tirando) e' comune alle due parti: lo Step
dei civili e boxSelect (soldati, arcieri, macchine) selezionavano anche le
unita' dell'altra parte che ci finivano dentro (selezionate per sempre in
quella pagina: nessun clic le deseleziona, e i loro pannelli nella GUI di
chi guarda). Ora solo le proprie (world.js `mine`).

**Prove.**
- test/multiplayer.test.mjs "§9.163": un centro rosso e uno blu,
  selezionato quello di chi guarda, guardando dal rosso e dal blu: i
  pulsanti restano (senza la correzione la prova fallisce); un comando
  dell'altro giocatore non li tocca, uno di chi guarda si'.
- Nel browser (?pvp=1, sk_padus, seme 5, dalle due parti): centro
  selezionato, i due pulsanti; civili selezionati, i pulsanti di
  costruzione; un rettangolo su tutta la mappa prende i 3 civili propri e 0
  dell'altro. pvp.mjs (1500 passi), netfake.mjs, truce.mjs, replay.mjs (anche
  PVP=2), orders.mjs match, hover.mjs, melee.mjs match: passate.

### 9.164 I livelli bloccati non si aprono dall'indirizzo

Segnalazione dell'autore (19 novembre 2026, stessa PR di §9.163, versione
0.2614): "nell'url compare il nome del livello, e se un utente volesse
'fregare' giocando un livello della campagna che non ha ancora sbloccato
gli basterebbe cambiare un numerino nell'url. Come possiamo risolvere?
Usiamo nomi diversi?"

**Nomi diversi: no.** Nascondono la cifra, ma i nomi veri restano nel
codice del gioco (il bundle) e nelle richieste della pagina
(`assets/rooms/<room>.json`): basta aprire gli strumenti del browser. E
cambierebbero l'indirizzo di tutte le prove e della documentazione senza
fermare nessuno. Il problema non e' il nome: e' che la pagina carica
qualsiasi room le si chieda.

**La correzione.** Prima di caricare la room, app.js chiede a progress.js
`canPlay(room, loadUnlock())`: un livello della campagna (`lvlNN`, numero
da `levelOf`) oltre lo sblocco salvato porta al menu, e l'indirizzo diventa
`?room=menu` (via anche gli altri parametri: un salvataggio, la campagna).
Il livello 1, il tutorial (match) e le schermaglie restano sempre
aperti, come nel menu (shownLevel). Vale anche per un salvataggio (slot o
file) di un livello bloccato: lo sblocco perso si riprende coi codici del
lucchetto, che la vittoria mostra.

**Cosa resta.** Il gioco gira tutto nel browser, senza server: lo sblocco
sta in localStorage e i codici del lucchetto sono nel codice (come
nell'originale). Chi apre gli strumenti del browser puo' sempre cambiarli;
fermarlo davvero vorrebbe un server con gli account. Cambiare una cifra
nell'indirizzo, la scorciatoia alla portata di tutti, ora non basta piu'.
Finche' `UNLOCK_ALL` e' 6 (provvisorio, §9.53) tutti i livelli sono
sbloccati e il controllo non ferma niente: vale dall'uscita, con
`UNLOCK_ALL = 1` (nota sulle prove in "Cose da fare").

**Prove.**
- test/progress.test.mjs: levelOf e canPlay (il livello 1 sempre, fino
  allo sblocco si', oltre no; menu, tutorial e schermaglie sempre).
- Nel browser, con una build provvisoria a `UNLOCK_ALL = 1` e lo sblocco a
  3 in localStorage: `?room=lvl05` e `?room=lvl04` -> menu (`?room=menu`),
  anche con `&campaign=1&load=slot`; `lvl01`, `lvl03`, `match`, `sk_padus`
  si aprono. Con la build normale lvl05.mjs, lvl06.mjs, orders.mjs lvl06,
  monastery.mjs: passate.

### 9.165 I suggerimenti spenti fuori dal tutorial; quello della notte quando e' notte

Richiesta dell'autore (20 novembre 2026, stessa PR di §9.163, versione
0.2614): "hints: a parte nel tutorial che sono attivi di default, mettiamoli
disattivati di default per tutti gli altri livelli. Sono comunque attivabili
premendo lo shortcut o da menu. Hint notte: occhio che sia coerente con i
livelli, ora credo sia solo basato sul timer e non sull'effettivo arrivo
della notte".

**Spenti di default.** state.js: global.hint e' 1 nel tutorial (match), 0
negli altri livelli e nelle schermaglie (il menu resta 3). Si accendono
come prima con H o dal menu di pausa ("Suggerimenti"); un salvataggio
riporta la scelta di quando e' stato fatto.

**Spenti davvero.** Nell'originale H nascondeva solo il disegno: i
suggerimenti nascevano lo stesso, invisibili, segnavano la loro "volta"
(woodhint, ...) e il primo aperto bloccava tutti gli altri (una finestra
alla volta) finche' un clic, alla cieca dove sarebbe stato, non lo
chiudeva. Andava bene come eccezione; come norma no. Ora con i
suggerimenti spenti:
- non ne nasce nessuno (hintOnce, il suggerimento degli allarmi della
  minimappa) e la volta non si consuma: acceso H dopo, arriva la prossima
  volta che serve;
- uno gia' aperto (si spegne mentre c'e') non si chiude ne' va avanti con
  un clic: riappare quando si riaccendono.
Restano come prima quelli che nascono da un dialogo del livello 2
(hint_lavoratori, una volta sola: si vede accendendo H).

**La notte.** Era davvero a tempo: lo creava l'allarme 0 del manager, a
6000 passi, quando finiva il tramonto. Nel livello 1 (notte dall'inizio)
arrivava dopo 100 s di notte; nella schermaglia "sempre notte" (allarme 0
spento) mai. Ora hints.js `nightHint`, a ogni passo da manager.step: la
prima volta che global.night e' al buio pieno, con i suggerimenti accesi e
nessun dialogo o altro suggerimento aperto. Nel ciclo del giorno cade
nello stesso passo del buio pieno; nel livello 1 appena chiusi i dialoghi
d'inizio (se accesi); di giorno (schermaglia "sempre giorno") mai. Nei
livelli 2 e 3 resta escluso (§9.14: "gia' visto").

**La partita a due.** Le volte dei suggerimenti (multihint, nighthint, ...)
nascono per chi guarda (il suo H, le sue finestre): ora sono fuori
dall'impronta (snapshot.js UI_GLOBALS, come global.hint). Prima un
suggerimento visto da uno solo dei due giocatori (hint_multi, al primo
clic su un soldato) avrebbe reso diverse le impronte.

**Prove.**
- test/hints.test.mjs: accesi solo nel match; spenti, hintOnce non crea e
  non consuma la volta; nightHint aspetta il buio pieno e la fine dei
  dialoghi, una volta sola. test/alarm.test.mjs: il suggerimento degli
  allarmi solo acceso.
- Nel browser: match acceso con hint_iniziale; lvl01 spento, dopo 7000
  passi nessun suggerimento della notte e la volta intatta, acceso H arriva
  subito; sk_padus col ciclo, H acceso: il suggerimento nello stesso passo
  del buio pieno (6198). hintgap.mjs, alarms.mjs, pvp.mjs, netfake.mjs,
  ui.mjs it, saves.mjs (match, lvl01, lvl02, sk_padus), determinism.mjs:
  passate.

### 9.166 Le fiamme smorzate sotto la pioggia

Richiesta dell'autore (20 novembre 2026, stessa PR di §9.163, versione
0.2614): "particelle del fuoco: possiamo 'smorzarle' un po' quando piove?
sempre presenti ma un po' meno, a livello visivo".

**Come.** effects.js: con la pioggia le fiamme degli incendi (fireStep) e
di bracieri e torce (fireStarterStep) emettono meno particelle per passo
(fino a RAIN_FIRE_N = 0,65 del numero di sempre, intero, almeno 1) e
quelle degli incendi vivono meno (fino a RAIN_FIRE_LIFE = 0,8: fiamme piu'
basse). Seguono il livello delle gocce (manager.js `world.rainLevel`, il
rain.level di §9.91): entrano ed escono in 5 s con la pioggia, senza
scatti. Solo a vederle: il fuoco brucia e si spegne come prima (§9.116),
le particelle non sono della partita (impronta uguale).

Una prima prova a 0,55 e 0,7 dava il 42% delle particelle sul municipio in
fiamme: troppo per "un po' meno". Ora circa il 65% (sul municipio a meta'
vita: 774 particelle all'asciutto, 499 a pioggia piena; 8 e 4 per passo
diventano 5 e 3).

**Prove.** test/rainfire.test.mjs (asciutto come prima, a pioggia piena
meno particelle e fiamme piu' corte, a meta' in mezzo, senza manager come
prima). Nel browser il municipio in fiamme su sk_padus, all'asciutto e a
pioggia piena (screenshot). determinism.mjs, burn.mjs, pvp.mjs: passate.

### 9.167 Il suono degli incendi

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614), con un file: "questo invece e' il file audio per quando sono
mostrati incendi: valuta tu le varie regolazioni da fare (clippare per
loop, volumi, equalizzazione...)".

**Il file** (`nuovi/audio/fuoco.mp3`, il nome d'origine in CREDITI.md):
MP3 320 kbit/s, 44,1 kHz, stereo (L/R correlati 0,53), 15,5 s. Il suono
comincia a 0,07 s e finisce di colpo a 15,15 s (poi silenzio digitale),
livello costante (RMS ogni 0,5 s fra -15 e -19 dB), picco -3. Lo spettro:
il 92% dell'energia sotto i 150 Hz (75% sotto gli 80), un rombo 12 dB
sopra il corpo della fiamma (150-1000 Hz) e 18 sopra il crepitio (1-16
kHz), costante anche lui per tutto il file.

**Le regolazioni** (audio.json "fuoco", tools/18 come la pioggia, §9.141):
- il giro: il tratto da 0,3 a 13,5 s (fuori l'attacco e il taglio di
  colpo della fine) con la fine dissolta in 1,5 s sull'inizio: 13,2 s.
  Misurato: attorno al giro il livello resta fra -22 e -29 dB ogni 50 ms
  come nel resto, il salto fra l'ultimo campione e il primo e' sotto il
  99,9 percentile dei salti del file;
- l'equalizzazione: passa-alto a 100 Hz a 24 dB/ottava. Il rombo copriva la
  musica (anche lei piena di bassi: il drone) e sui piccoli altoparlanti non
  si sente; restano il calore (100-300 Hz, ora il 65% dell'energia) e il
  crepitio, che sale di 10 dB rispetto al resto. Provati anche 80 Hz a 12
  dB/ottava (il rombo ancora il 75%) e 150 a 24 (fiamma piu' sottile);
- niente compressione ne' limitatore: il crepitio sta nei picchi;
- il volume: picco a -3 dB come gli altri suoni (livello medio -24), MP3
  stereo a 192 kbit/s senza taglio degli acuti; gain 0,3, cioe' a pieno
  livello ~ -35 dB di media, sotto le parti della musica (-30..-37) e i
  colpi; un incendio solo nella vista e' a meta' (~ -41).

**Quando si sente** (effects.js `fireNoise`, ogni passo da manager.step,
audio.js `ambient`): gli edifici in fiamme che chi guarda vede (w.shown:
non quelli nemici nella nebbia; nella partita a due quelli della sua
vista), ognuno pesato da quanto e' vicino alla vista (audio.js placement: 1
dentro, 0 a 700 px dal bordo) e dalla grandezza delle fiamme (casa 1,
caserma e centro 1,33, monastero 2,67). Il livello e' S / (S + 1): un
incendio nella vista 0,5, due 0,67, quattro 0,8 (non cresce senza fine). Il
suono segue il livello in ~1 s (come la pioggia) e va a destra o a
sinistra dove sono i fuochi (pan medio pesato; ambient ha ora un pan
opzionale). Sotto la pioggia, come le fiamme (§9.166), fino al 70%. Non i
bracieri e le torce (sempre accesi: sarebbe un fondo continuo nei livelli
che ne hanno), non la fiammata della freccia incendiaria (un istante). Nel
menu niente (i suoni del mondo sono spenti, §9.139).

**Da fare: la licenza.** Il nome del file ("Burning Fire with Sound
Effects | Fire Background Clip") sembra quello di un video di sottofondo
scaricato da una piattaforma video: in CREDITI.md autore e licenza sono
"da verificare". Per l'uscita serve una licenza che permetta l'uso
commerciale (CREDITI.md); se non si trova, un'altra registrazione con le
stesse regolazioni.

**Prove.** test/firesound.test.mjs (nessun fuoco: zero; nella nebbia,
spento, senza fiamme ancora, lontano: zero; piu' fuochi piu' forte sotto
1; a destra pan a destra; il gemello blu come l'edificio rosso; pioggia
piena al 70%; nella partita a due decide shown). Nel browser (sk_padus,
audio sbloccato con un clic): senza incendi il suono non parte; il centro
in fiamme 0,171 (0,3 x 0,57), con la vista spostata a sinistra pan 0,48,
lontano 0; quattro edifici 0,244; con la pioggia piena 0,171; il giro
decodificato 13,2 s. determinism.mjs, pvp.mjs, saves.mjs (lvl01,
sk_padus): passate.

### 9.168 La zappa, la catapulta, il crollo, il clic dei pulsanti

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614), con quattro file: "da 'footsteps..' estrai quelli per il
contadino che zappa, sono i primi che senti non quelli in sequenza rapida;
da catapult quella per il lancio della catapulta, regolala bene che mi
sembra un po' 'impegnativa', da scrolling clicks invece quelli per la
selezione elementi GUI (basta uno), 'rock crumbling' per quando ariete o
sasso della catapulta colpiscono edificio, anche in questo caso lavora di
editing che dobbiamo un po' smorzare".

**Il metro dei volumi.** I colpi gia' nel gioco, nei primi 150 ms e col
loro gain, stanno tutti a -30..-32 dB (ascia -31,8, piccone -30, spada
-30,7, arco -31,5, martello -30,6): i nuovi si tarano su questi.

**I tagli e i filtri** (nuovi/audio/audio.json, tools/18; i dettagli nelle
note di ogni suono):
- `zappa` (passi_erba.mp3, 4,6 s, mono in due canali): 14 passi ogni ~320
  ms; i primi sei colpi singoli e sordi, dai 2 s piu' forti e spesso doppi
  (tacco e punta a 15-20 ms: la "sequenza rapida"). Tre dei primi (130,
  786, 1402 ms; 150 ms l'uno); scartato quello a 464 ms, debole e doppio
  (portato a -3 dB alzava il fruscio di 23 dB). Passa-alto leggero a 80 Hz.
  Gain 0,35: -32 dB, appena sotto ascia e piccone.
- `catapulta` (4,2 s): cigolio della carica (0,1-0,6 s), lo scatto del
  braccio a 0,64 s e 1 s di sbattimenti; il 56% dell'energia sotto gli 80
  Hz. "Impegnativa": lunga, grave, forte. Solo scatto e coda (0,62-1,52 s:
  il cigolio ritardava il colpo di mezzo secondo rispetto al sasso),
  sfumata negli ultimi 450 ms, passa-alto a 120 Hz a 24 dB/ottava, gain
  0,2: -30 dB come gli altri colpi (era 16 dB sopra).
- `crollo` (roccia.mp3, 4,7 s): un colpo e quasi 2 s di crollo
  fortissimo, poi detriti fino a 4,6 s; l'80% dell'energia sotto gli 80
  Hz. Da smorzare: tre tagli di 600 ms che cominciano su un colpo (0,37 il
  colpo iniziale; 1,29 e 1,65 dentro il crollo: varianti, l'ariete batte
  ogni ~1,15 s), sfumati negli ultimi 300 ms, passa-alto a 120 Hz a 24
  dB/ottava, gain 0,22: -32 dB, sotto gli altri colpi.
- `clic` (clic.mp3, 18 s di clic di rotella): quello da solo a 1,57 s, 100
  ms; il 57% dell'energia era un tonfo sotto i 300 Hz: passa-alto a 200 Hz
  a 24 dB/ottava (resta il tic, 600-2500 Hz). Altezza +-3%, gain 0,5: -33
  dB, discreto.

**Dove suonano.**
- zappa: civilians.js otherWorkTick, la raccolta al campo (azione 4), una
  volta per ciclo di 39 passi come l'ascia, davanti al contadino; non dei
  contadini nemici nella nebbia.
- catapulta: siege.js catapultAlarm2, quando parte il sasso (alleate e
  nemiche, se si vedono).
- crollo: l'ariete a ogni colpo su un edificio (siege.js ramSound, davanti
  all'ariete; alleato e nemico, se si vede l'ariete o l'edificio) e il
  sasso della catapulta che cade su un edificio (catapultBullet destroy,
  se l'edificio si vede). Non il sasso sull'erba o sulle unita'.
- clic: audio.js `ui(nome)`, senza posizione e anche dove i suoni del
  mondo sono spenti (il menu principale), non con gli effetti spenti. I
  pulsanti della partita (app.js guiClick: le istanze *_clicker, *_button
  e i "+" delle mura col puntatore sopra, al rilascio, quando scattano) e
  della minimappa (alla pressione, come scattano), il pulsante della pausa
  e le voci del menu di pausa (pause.js), i pulsanti del menu principale
  dove il clic fa qualcosa (menu.js). Non i tasti scorciatoia ne' i clic
  sul mondo; non (per ora) i pannelli HTML della partita in rete.

**Da fare: le licenze.** Anche questi quattro file hanno i nomi di video di
effetti scaricati da una piattaforma video (due dicono "No Copyright" e
"Free" nel titolo, che non basta): in CREDITI.md "da verificare", come
fuoco.mp3 (§9.167). Per l'uscita servono licenze per l'uso commerciale.

**Prove.** test/sfx.test.mjs (il clic suona nel menu, i suoni del mondo
no; con gli effetti spenti niente; le voci di audio.json brevi e coi gain
bassi; i file in CREDITI.md). Nel browser (sk_padus, le chiamate a
audio.play registrate): il contadino al campo -> zappa; la catapulta che
lancia -> catapulta; il sasso su un edificio -> crollo; l'ariete ->
crollo (zittito se arriva entro 45 ms da un altro, MIN_GAP); il pulsante
del civile cliccato col mouse -> clic e un civile in coda; un clic sul
terreno -> niente; il pulsante della pausa e "Riprendi" -> clic; nel menu
principale "Giocatore singolo" -> clic. determinism.mjs, pvp.mjs,
catapults.mjs, rams.mjs, minimap.mjs: passate.

### 9.169 Il fiume; la zappa per il sasso sul terreno e sulle unita'

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614), con un file: "usiamo il suono della zappa anche per le pietre
della catapulta che cadono su terreno o unita'. Integra anche questo loop
per quando e' visualizzato il fiume (leggero)".

**Il sasso.** siege.js catapultBullet destroy: su un edificio il crollo
(§9.168); sul terreno o su un'unita' (se l'unita' si vede) la zappa, il
colpo nella terra. Alleato e nemico.

**Il file** (`nuovi/audio/fiume.mp3`): MP3 320 kbit/s, 44,1 kHz, stereo
(L/R correlati 0,75), 11 s. Entra in dissolvenza nel primo secondo (-66 ->
-21 dB) e finisce a 10,95 s; in mezzo costante (RMS -19..-22 ogni 0,5 s),
gorgoglii con picchi fino a -0,3 dB. Niente sotto i 150 Hz (gia' tagliati
nella registrazione: nessun rombo da togliere), il 60% dell'energia fra 600
e 2500 Hz.

**Le regolazioni** (audio.json "fiume"): il tratto da 1,2 a 9,4 s, fuori
la dissolvenza d'entrata, con la fine dissolta in 1,5 s sull'inizio (8,2 s
di giro; attorno al giro il livello resta -23..-28 dB ogni 50 ms come nel
resto, il salto all'ultimo campione sotto il 99,9 percentile); un calo
largo di 3 dB attorno ai 2 kHz per un fondo meno tagliente; picco a -3 dB
(livello medio -25,5), MP3 stereo a 192 kbit/s. Leggero: gain 0,13, a
pieno livello ~ -43 dB di media (il fuoco -35, la musica -30..-37 per
parte, la pioggia dell'autore -61).

**Quando si sente** (effects.js `riverNoise`, ogni 10 passi da
manager.step; audio.js ambient lo segue in ~1 s, col pan): un punto ogni 48
px nella vista allargata di 700 px, ognuno pesato da quanto e' vicino alla
vista (audio.js placement); f = l'acqua pesata (waterMap: i fiumi delle
istanze e quelli a linee di Tiled) sui punti della vista; livello
sqrt(f / 0,12) fino a 1: un fiume che copre il 12% della vista e' a pieno
livello, uno del 3% a meta', uno appena fuori dal bordo piano. Senza fiumi
nella room, o lontani, niente; nel menu niente (i suoni del mondo sono
spenti). Il calcolo costa meno del rumore della misura (sotto 1 ms ogni 10
passi).

**Licenza: da verificare** (CREDITI.md), come gli altri file di §9.167 e
§9.168.

**Prove.** test/riversound.test.mjs (niente fiumi o lontano: zero; la vista
tutta d'acqua: 1; una striscia del 3% a destra: a meta' strada, pan a
destra; appena fuori: piu' piano). Nel browser: sk_padus e lvl04 sul fiume
0,13 (pieno livello per il gain), lontano 0 (sk_padus) o 0,042 (lvl04,
acqua 240 px fuori dal bordo); il sasso sul terreno e su un guerriero ->
zappa, sul centro -> crollo. determinism.mjs, pvp.mjs, catapults.mjs,
lvl04.mjs, ripples.mjs: passate.

### 9.170 La battaglia: zoccoli, edifici distrutti, il corno; freccia e fuoco con la zappa

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614), con tre file: "gli zoccoli della cavalleria estrapola bene e evita
che siano troppo predominanti, per l'edificio distrutto mi piace il secondo
dei tre suoni che senti in 'ground crash' ma sono tutti e tre
interessanti, l'horn e' figo e inquietante al punto giusto ma smorziamolo
un po' (e magari acceleriamolo?). Per le altre: freccia che colpisce usa
sempre la zappa, idem fuoco appiccato, morte delle unita' per ora lasciamo
senza." (dalla lista dei suoni mancanti in chat).

**Gli zoccoli** (cavalli.mp3, audio.json "zoccoli"). Il galoppo (5,8 s,
mono in due canali) aveva il 99% dell'energia sotto i 40 Hz: un tonfo che
non si sente ma si mangiava il volume. Passa-alto a 60 Hz a 24 dB/ottava:
restano lo zoccolo (150-600 Hz) e la terra smossa (5-10 kHz), 31 dB sotto
il livello di prima. Il galoppo e' irregolare (l'inviluppo non ha un
periodo netto): un loop da 0,6 a 5,3 s con 400 ms di incrocio. Un suono
continuo (audio.js ambient, col pan) invece di un colpo per zoccolo: con
venti cavalieri sarebbe una grandinata. effects.js `hoovesNoise`: i
cavalieri (giocatore, nemici, blu) che si sono mossi nell'ultimo passo e
chi guarda vede, pesati dalla vicinanza alla vista; livello S/(S+2): uno
0,33, due 0,5, sei 0,75. Gain 0,38: -38 dB a pieno livello, -47 con uno
solo; non predomina.

**Gli edifici distrutti** (crolli.mp3: tre crolli, fra l'uno e l'altro
fruscio a -53 dB). Il secondo, quello che l'autore preferisce, per i
grandi ("rovina": vita piena da 300, caserma, stalla, centro, castello,
torre, chiesa, monastero); il primo e il terzo, varianti, per i piccoli
("rovina_piccola": case, magazzini, mulini, mura, porte, cantieri). Dagli
attacchi (1,09, 3,39, 5,98 s) a dove scendono sotto -45 dB (1,1-1,5 s),
sfumati negli ultimi 450-500 ms; passa-alto a 50 Hz a 24 dB/ottava (sotto
i 40 Hz c'era il 17-70% dell'energia, che non si sente; resta il peso,
60-150 Hz). Gain 0,3 (-27 dB nei primi 500 ms: qualche dB sopra i colpi,
e' raro) e 0,28 (-30). Dove: world.js destroy chiama `hooks.destroyed`;
app.js suona se l'istanza e' di una famiglia di edifici (ally_build,
enemy_build, p2_build), a vita 0 (colpi, fuoco, demolizione col tasto
Canc; non un cantiere finito ne' un tratto di mura che diventa muro) e chi
guarda la vede (world.shown: non nella nebbia).

**Il corno** (Freesound 348862, newagesoup, CC BY 4.0: da citare nei
crediti del gioco). 13,6 s: il corno da 0,2 a 2,4 s, poi il riverbero fino
a -93 dB a 12 s; energia solo fra 40 e 1200 Hz (scuro). Smorzato e
accelerato: da 0,15 a 6 s, il riverbero sfumato negli ultimi 2,5 s, poi 1,3
volte piu' veloce senza cambiare altezza (atempo: resta scuro e
inquietante; un'accelerazione che alzasse l'altezza lo renderebbe una
trombetta): 4,5 s. tools/18 ha ora `tempo` (atempo dopo tagli e
dissolvenze). Gain 0,17: -32 dB nei primi 500 ms, sotto la musica. Dove:
attackalarm.js raiseAlarm, un attacco nuovo fuori dalla vista (quando
nascono gli anelli sulla minimappa), al piu' uno ogni 30 s (ALARM.horn,
g.alarms.hornAt), senza posizione.

**Freccia e fuoco: la zappa.** ranged.js: la freccia (alleata o nemica)
che colpisce un'unita' che si vede, a volume 0,7 (le raffiche: audio.js ne
lascia al piu' 4 insieme, a 45 ms l'uno dall'altro). effects.js
fireFlare: la fiammata della freccia incendiaria o della torcia che
appicca il fuoco. La morte delle unita': per ora senza (l'autore).

**Prove.** test/alarm.test.mjs (il corno: dentro la view niente, fuori si',
un'altra zona subito dopo niente, dopo 30 s di nuovo); test/firesound.test.mjs
(gli zoccoli: fermo zero; cadaveri, nebbia, lontano zero; sei piu' di uno ma
sotto 0,8, pan dove sono). Nel browser (sk_padus, chiamate registrate): una
casa distrutta -> rovina_piccola, una caserma -> rovina, una casa nemica
nella nebbia -> niente; la freccia nemica su un guerriero -> zappa; la
freccia incendiaria su una casa -> zappa e la casa brucia; un guerriero
colpito fuori dalla vista -> corno, un altro subito dopo -> niente; tre
cavalieri fermi 0, in marcia 0,19 (0,38 x 0,5), uno solo 0,125. Durate
decodificate: corno 4,5 s, rovina 1,09, rovina_piccola 1,18 e 1,52, zoccoli
4,7. determinism.mjs, pvp.mjs, alarms.mjs, rams.mjs, catapults.mjs,
melee.mjs, saves.mjs (lvl01, sk_padus): passate.

### 9.171 Edificio finito, unita' pronta, risorse che mancano, chat, porte, lucchetto

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614), con cinque file: "te ne allego altri, fatti da me in wav [...].
Per semina e albero abbattuto non mettiamo sfx (segna come gia' fatti). Per
il lucchetto del menu usa la serie che hai gia'. Chain door invece e' per il
cancello, estrapola mezzo secondo - un secondo perche' il file e' lungo".

**Fatti senza suono** (decisione dell'autore): la semina e l'albero
abbattuto. Della lista dei suoni mancanti restano (da decidere): la morte
delle unita' ("per ora senza"), i fondi del giorno e della notte, l'aquila,
vittoria e sconfitta, obiettivo raggiunto, dialogo che si apre, l'altro
giocatore che si collega o se ne va.

**I suoni dell'autore** (build_finish.wav, unit_finish.wav, chat.wav,
no_resour.wav: WAV 16 bit, 32 kHz) cosi' come sono: solo il silenzio tolto
davanti e dietro, il picco a -3 dB come gli altri, il volume col gain
(misurato nei primi 300 ms). Due sono quasi solo bassi: build_finish ha il
74% dell'energia sotto i 40 Hz (fondamentale a 36 Hz, armoniche a 95 Hz a
-11 dB), no_resour e' un tono a 46 Hz (armoniche a 93 e 143 Hz, -23 dB).
Su altoparlanti piccoli (portatili, telefoni: da 150-200 Hz in su) il
secondo si sente appena: da dire all'autore.
- `edificio_finito`: un cantiere del giocatore che arriva a vita piena
  (edifici, campi, tratti di mura: buildings.js, walls.js). Gain 0,2 (-26
  dB).
- `unita_pronta`: un'unita' che esce da caserma, stalla, castello
  (production.js) o il civile dal centro (buildings.js). Gain 0,32 (-29).
- Tutti e due senza posizione (un avviso: si sentono anche con la vista
  altrove) e solo per chi guarda (audio.js `notice`: w.mine, nella partita
  a due la sua parte; i cantieri e i produttori del nemico della CPU hanno
  il loro codice e non suonano).
- `risorse`: il pulsante premuto senza le risorse o la popolazione
  (costruzione e posa del fantasma: buildings.js blinkMissing, solo se
  manca davvero qualcosa; produzione: production.js enqueue; il civile:
  enqueueWorker; la porta: walls.js makeGate; i prolungamenti delle mura)
  e il codice sbagliato del lucchetto; audio.js ui. Non i lampeggi
  automatici (la produzione che aspetta la popolazione, la riparazione o
  il ponte senza legno), che si ripetono. Gain 0,13 (-28).
- `chat`: il messaggio dell'altro giocatore (chat.js receive; non i propri,
  non i vuoti), audio.js ui. Gain 0,6 (-30).

**Le porte** (chain_door.mp3, 11,3 s di catena continua; licenza da
verificare in CREDITI.md): due tratti come varianti, l'inizio (0-0,85 s,
con l'attacco naturale) e 3,05-3,85 s (un colpo), sfumati negli ultimi 300
ms; il 45% dell'energia sotto i 150 Hz: passa-alto a 80 Hz a 24 dB/ottava.
Suona quando una porta delle mura (del giocatore o nemica) si apre o si
chiude, se si vede (walls.js). Gain 0,2 (-32: le porte si aprono e chiudono
spesso).

**Il lucchetto** (dalla serie di clic gia' caricata, §9.168): `lucchetto`,
tre clic della serie lenta (3,206, 3,452, 3,677 s; i successivi, filtrati,
erano 10-30 dB piu' deboli), a ogni rotella; `lucchetto_aperto`, la serie
rapida (otto clic sempre piu' forti, 7,82-8,76 s), col codice giusto; il
codice sbagliato col suono delle risorse che mancano. menu.js, audio.js ui.

**Prove.** test/sfx.test.mjs (la chat: il messaggio dell'altro suona, il
proprio e quelli vuoti no). Nel browser (chiamate registrate): la casa
finita -> edificio_finito (senza posizione); il civile dal centro ->
unita_pronta; Q col centro selezionato e senza cibo -> risorse; la porta
con un soldato vicino -> cancello, via il soldato -> cancello; nel menu una
rotella -> lucchetto, il codice sbagliato -> risorse, quello del livello 7
-> lucchetto_aperto (e lo sblocco a 7). determinism.mjs, pvp.mjs,
netfake.mjs, garrison.mjs, economy.mjs, ui.mjs it: passate.

### 9.172 Il suono degli obiettivi; la sconfitta sfocata, coi pulsanti

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614), con un file: "'objective' deve riprodursi quando compare un nuovo
obiettivo o ne viene raggiunto uno (anche parzialmente vd livello 2
liberazione ostaggi). Per i sfx per oggi ci fermiamo qui. Altra cosa da
sistemare: schermata nera della sconfitta: sostituiamola con effetto blur
ma su fondo grigio scuro invece che bianco, mettiamo due tasti per tornare
al menu o per ricominciare il livello (o anche un terzo per caricare una
partita?). Niente timeout prima di avere opzioni di uscita come funziona
ora". Poi: "temo di averti caricato l'objective sbagliato, questo e'
quello da usare" (objective.wav al posto di objective.mp3, tolto).

**Il suono** (objective.wav dell'autore, 32 kHz, 2,5 s: da 0,04 a 1,3 s,
la coda sfumata; gain 0,2, -27 dB come l'edificio finito). Anche questo e'
quasi tutto fra 40 e 80 Hz (95%): sugli altoparlanti piccoli si sente poco,
come no_resour (§9.171).

**Quando suona** (endgame.js). Gli obiettivi non hanno uno stato loro: il
riquadro li ricalcola a ogni disegno dalla partita (le righe per livello).
Quel calcolo ora e' una funzione a se', `objectiveLines(w, d)` (il disegno
le passa il Draw per misurare le cifre; il suono null), e objective_button
ogni 10 passi ne fa una firma (`objectiveSignature`): per ogni riga la
chiave (il testo con le cifre tolte), se e' spuntata e il conto "(n/m)" se
c'e'. Suona (`objectiveNews`) se c'e' una riga nuova, una appena spuntata o
un "(n/m)" salito: gli ostaggi del livello 2 (3/7), le basi del tutorial
(n/3), le pattuglie e le torri del livello 6; non i numeri che cambiano da
soli (il tempo resistito, il conto alla rovescia, la vita del monastero, la
percentuale del ponte, gli edifici o i soldati che restano), ne' una riga
che sparisce (la tregua). La firma sta in g.objSig con la lingua: si salva
con la partita (caricarla non suona), cambiata la lingua si ricomincia
senza suonare, ed e' fuori dall'impronta (snapshot.js: dipende da chi
guarda). Gli obiettivi gia' presenti all'inizio della room (primi 60
passi) non suonano; quelli che compaiono dopo un dialogo (livelli 1 e 2)
si'. Non durante la vittoria o la sconfitta.

**La sconfitta** (endgame.js gameoverManager, app.js). Come la vittoria
(§9.56): la scena si sfoca a poco a poco (victoryBlur, victoryProgress
ora anche col contatore della sconfitta), sotto un velo grigio scuro
(DEFEAT: 38, 38, 38 al 62%) invece che bianco; poi in dissolvenza
"SCONFITTA" (nuovo, tradotto nelle sei lingue), il perche' e le righe di
prima (tempo resistito nel tutorial e nel livello 3, basi distrutte) in
bianco, e tre pulsanti come quelli della pausa: "Ricomincia livello"
(come nella pausa: la pagina si ricarica sulla room), "Carica partita"
(apre la pausa sulla pagina dei caricamenti, slot e file; da li' "Indietro"
e "Riprendi" tornano alla sconfitta), "Torna al menu". Usabili appena
compaiono (meno di 2 s), e niente piu' ritorno al menu dopo 760 passi. Nella
partita in rete solo "Lascia la partita" (app.js non da' hooks.restart e
hooks.loadMenu). I rettangoli dei pulsanti stanno fuori dall'istanza (una
WeakMap): gameover_manager e' della partita, e le sue variabili entrano
nell'impronta. Il clic (globalLeftReleased) col suono dei pulsanti
(§9.168).

**Prove.** test/objectives.test.mjs (riga nuova, spuntata, (n/m) salito:
si'; riga sparita, tempi, vite, percentuali, quanti ne restano, un conto
che scende: no). Nel browser: il tutorial per 900 passi -> nessun suono;
il livello 2: il riquadro che compare -> uno, un villaggio liberato in
piu' -> uno, poi 200 passi -> nessuno; la sconfitta nel livello 2 dopo
1000 passi resta (niente ritorno al menu), screenshot col velo e i tre
pulsanti; "Carica partita" -> la pausa sui caricamenti; "Torna al menu" ->
?room=menu. ui.mjs (tutte le lingue, anche la sconfitta), determinism.mjs,
pvp.mjs, netfake.mjs, saves.mjs (match, lvl02, lvl03, sk_padus), lvl06.mjs,
hintgap.mjs: passate.

### 9.173 Le risorse che mancano: una volta quando manca la popolazione

Richiesta dell'autore (21 novembre 2026, stessa PR di §9.163, versione
0.2614): "il suono delle risorse insufficienti lo usiamo una volta sola
quando manca la popolazione (quando inizia a lampeggiare), inoltre usiamolo
pure per combinazioni sbagliate del lucchetto della campagna".

**La popolazione.** Un'unita' pronta (il civile del centro, buildings.js;
caserma, stalla, castello, production.js) che non nasce perche' la
popolazione e' piena ritenta ogni 30 passi (o P.popWait) e a ogni tentativo
fa lampeggiare la popolazione. Ora il primo tentativo fallito suona
"risorse" (buildings.js `popHeld`, per chi guarda se il produttore e' suo:
audio.js notice); i successivi no (popHeld resta 1) finche' l'unita' non
nasce (popHeld torna 0): la volta dopo suona di nuovo. Il suono al clic di
un pulsante senza risorse o popolazione resta (§9.171).

**Il lucchetto.** Il codice sbagliato suonava gia' "risorse" (§9.171).

**Prove.** Nel browser (sk_padus): il centro con un civile pronto e la
popolazione piena per 600 passi -> la popolazione lampeggia, un suono solo;
liberato un posto il civile nasce (unita_pronta) e popHeld torna 0; di
nuovo pieno col civile dopo pronto -> un altro suono. determinism.mjs,
pvp.mjs, saves.mjs (lvl01, sk_padus): passate.

### 9.174 La morte delle unita': la caduta, non la voce

Domanda dell'autore (22 novembre 2026, stessa PR di §9.163, versione
0.2614): "per le unita' che muoiono invece non saprei che suono mettere,
suoni di umani che rantolano non mi hanno mai convinto del tutto negli rts
e male si sposano con la rappresentazione concettuale dei personaggi del
gioco, hai idee?". Proposta (in chat): niente voci, la caduta del corpo e
dell'arma, coerente coi suoni fisici gia' nel gioco (la zappa, i crolli),
bassa e breve perche' in una mischia ne muoiono tanti insieme; scartato un
rintocco astratto (in battaglia una raffica di note sopra la musica, e il
carattere degli avvisi). Risposta: "procedi col tonfo modificato".

**I suoni**, dai file gia' caricati, a strati (tools/18 ora ha `strati`:
per ogni variante una lista di pezzi di file d'origine, ognuno col suo
filtro, velocita', volume e ritardo, sommati; poi il filtro del suono e le
dissolvenze come per gli altri):
- `morte` (soldati: guerrieri, picchieri, arcieri): il colpo della zappa
  (§9.168) rallentato a 0,78 (piu' grave, 190 ms) e, 70 ms dopo, il
  tintinnio dell'arma: un colpo di spade.wav con passa-alto a 1,5 kHz e
  accelerato a 1,15 (un oggetto di metallo piccolo che cade, non lo
  scontro), col picco ~15 dB sotto il tonfo (la registrazione delle spade
  e' ~20 dB piu' debole di quella dei passi: misurati i picchi dei due
  strati per variante; a -9 dB il metallo copriva il tonfo). Tre varianti
  (i tre colpi di zappa, tre colpi di spada).
- `morte_civile`: solo il tonfo, rallentato a 0,85.
- `morte_cavaliere`: due tonfi, il cavallo (0,65) e 130 ms dopo il
  cavaliere (0,72, 3 dB sotto), col tintinnio.
- arieti e catapulte: `rovina_piccola` (§9.170), il legno che si rompe.
- Volumi: ~ -36 dB nei primi 150 ms (gain 0,27, 0,21, 0,28), sotto la
  spada (-31).

**Dove** (app.js hooks.destroyed, come gli edifici, §9.170): un'istanza
delle famiglie delle unita' (ally_unit, enemy_unit, p2_unit) distrutta a
vita 0 (non chi entra in un presidio o una torre: ha vita), se chi guarda
la vede; il suono dal nome (multiplayer.js baseOf per il blu).

**Prove.** Nel browser (sk_padus, chiamate registrate): guerriero ->
morte, civile -> morte_civile, cavaliere -> morte_cavaliere, ariete ->
rovina_piccola, arciere nemico visibile -> morte, guerriero nemico nella
nebbia -> niente, un guerriero tolto senza morire -> niente. Un file
d'ascolto per l'autore: le nove varianti dopo un colpo di spada, poi una
mischia simulata di 3 s (24 colpi di spada e 10 morti a caso, volumi e pan
diversi). determinism.mjs, pvp.mjs, melee.mjs, garrison.mjs: passate.

### 9.175 I crolli e il sasso lontani: attutiti e riverberati

Domanda dell'autore (22 novembre 2026, stessa PR di §9.163, versione
0.2614): "il crollo degli edifici e il sasso della catapulta che colpisce,
quando sono fuori schermo, possiamo riprodurre il suono attutito magari con
un po' di riverbero? In modo simile a come succede in Age of Empires 4".

**Prima.** Ogni suono del mondo cala dal bordo della vista fino a zero a 700
px (audio.js FAR): un edificio che crolla piu' in la' non si sentiva.

**Ora** (audio.js, play col nuovo argomento `far`): per i crolli degli
edifici (app.js hooks.destroyed: rovina, rovina_piccola) e per il sasso
della catapulta che cade (siege.js catapultBullet: crollo su un edificio,
zappa sul terreno o su un'unita'), fuori dalla vista il suono non si
spegne a 700 px ma si sente fino a DISTANT.range (3500 px dal bordo),
sempre piu' lontano (t da 0 a 1 con la distanza):
- volume da 0,7 a 0,25 (distantPlacement; oltre il fondo muto);
- un passa-basso (BiquadFilter) da 4,5 kHz a 600 Hz: attutito, cupo;
- il riverbero (ConvolverNode), mandato dal 30 al 75%, col segnale
  diretto che cala di conseguenza; la risposta all'impulso e' generata
  (2,2 s di rumore stereo che si spegne come (1-t)^3 e diventa piu' cupo
  verso la fine), una volta sola al primo suono lontano;
- il pan da che parte sta, come gli altri.
Dentro la vista niente cambia. Gli altri suoni (spade, frecce, l'ariete)
restano come prima: lontano tacciono. Le condizioni di prima restano (un
edificio nemico nella nebbia non suona).

**Prove.** test/sfx.test.mjs (nella vista niente filtro; senza far muto a
1500 px dal bordo, con far suona col passa-basso fra i due estremi e il
riverbero; il volume cala con la distanza; oltre il fondo muto). Nel
browser, col motore audio del gioco in un OfflineAudioContext: rovina al
bordo picco -14,2 dB, a 400 px -19,6, a 1500 -22,4, a 3000 -29,7; crollo e
zappa a 1200 px 7-10 dB sotto (registrato in un file d'ascolto per
l'autore). In partita, con l'audio vero: una casa distrutta a 2000 px dal
bordo -> rovina_piccola (e il riverbero creato), il sasso nemico a 1500 px
-> zappa, un colpo di spada a 1500 px -> muto. determinism.mjs,
catapults.mjs, pvp.mjs: passate.

### 9.176 Il kit di Tiled con le mappe della schermaglia

Richiesta dell'autore (22 novembre 2026, stessa PR di §9.163, versione
0.2614): "generami il kit di tiled aggiornato, inseriscici dentro anche le
mappe della schermaglia cosi' le controllo".

tools/11 copiava gia' nel kit tutte le mappe di `mappe/`, quindi anche le
cinque della schermaglia (`sk_*.tmx`, §9.118): nel kit sono identiche a
quelle del repo, e ogni tileset e immagine che citano c'e'. Aggiunto in
LEGGIMI.md (punto 5) che non sono disegnate a mano: le scrive
tools/16_schermaglia.py, simmetriche, e una modifica fatta in Tiled
andrebbe persa alla generazione successiva (la CI controlla che siano
quelle di tools/16): le correzioni si fanno nel programma.

Prove: tools/11 (35,4 MB di zip, 242 tile in 10 tileset), tools/12 --check
(match, lvl01, lvl02 identiche), tutte le mappe di mappe/ reimportate con
scenari/ invariato, tools/16 --check (le cinque simmetriche), come nella CI.

### 9.177 Le icone degli allarmi sulla minimappa: piu' grandi, piu' brevi

Richiesta dell'autore (22 novembre 2026, stessa PR di §9.163, versione
0.2614): "sulla minimappa le icone della battaglia e dell'incendio
facciamole il 20% piu' grandi ma facciamocele rimanere il 30% del tempo in
meno".

attackalarm.js ALARM: le scale delle icone da 0,52 e 0,36 a 0,624 e 0,432
(~16 -> ~19 px; la pulsazione e l'ingrandimento iniziale restano in
proporzione); la zona finisce dopo 21 s senza colpi invece di 30 (quiet,
1260 passi) e sfuma in 42 passi invece di 60. Gli anelli della battaglia
nuova, il lampeggio del pulsante della minimappa chiusa e il corno
(§9.170, 30 s) restano come prima.

Prove: test/alarm.test.mjs (coi valori di ALARM); alarms.mjs aggiornato
(22 s di attesa invece di 31) e passato, con le foto della minimappa;
minimap.mjs passata.

### 9.178 Livello 7: l'arciere nella nebbia (la mappa dell'autore e la regia)

Richiesta dell'autore (22 novembre 2026, stessa PR di §9.163, versione
0.2614), con la mappa `lvl07.tmx`: "l'arciere solo si ritrova nella nebbia
non capendo da dove arriva in quella stagione. Decide di usarla per
aggirare la pattuglia nemica (i tre picchieri di poco alla sua destra). Il
livello guida l'arciere in modo che, una volta che la pattuglia si e'
spostata verso il granaio con le quattro fattorie sotto, lui si sposti
sulla sinistra verso le mura dove ci sono i fiori gialli attendendo che
tornino sopra, per poi proseguire dopo il granaio. Seguendo la strada si
rende conto che anche dalle torri non possono vederlo. [...] pattuglie o
unita' singole nemiche che si spostano e l'arciere deve evitarle o
ucciderle furtivamente se sole. Arrivato davanti ai cancelli della citta'
[...] capisce che deve trovare delle macchine d'assedio [...] Al giocatore
non viene indicato dove sono, ma una volta raggiunte devono comparire con
un messaggio tipo grazie per averci liberato (dopo che e' stata uccisa
furtivamente la guardia entrano da sinistra). Una volta liberate le
macchine d'assedio bisogna tornare in cima e, SOLO DURANTE LA NOTTE,
attaccare la porta. [...] 5 cavalieri dalla zona dove sono le due stalle
[...] Qui si ripetono le stesse dinamiche stealth."

Le risposte dell'autore alle domande (in chat): l'arciere va in alto a
destra (nel Tiled era accanto alla porta); pattuglie e nebbia le traccio
io; fino alla liberazione delle macchine e' giorno, poi notte (fissi,
"artificiali"); basta la nebbia per le torri, l'unica che lo vede e'
quella in basso a sinistra; le macchine compaiono uccisa la guardia, con
l'arciere vicino; i nemici le ignorano perche' c'e' nebbia ed e' notte; i
cavalieri restano alle stalle, punitivi: attaccano le macchine troppo
vicine (e, caduta la porta, comunque); si vince col palo piu' in alto, si
perde se muore l'arciere o tutte le macchine con la porta in piedi; tutto
fermo (niente economia nemica), ma lavoratori nemici sulle risorse o in
giro che, avvicinati troppo, avvertono le guardie.

**La mappa** (`mappe/lvl07.tmx`, `scenari/lvl07.json`). 151 oggetti
(montagne, fiumi, piante) puntavano ai tileset di una copia vecchia del kit
("../../261013/535-tiled-kit/"): gli id delle tile sono stabili fra le
versioni (§9.40), rimappati (montagne_fiumi 243+k -> 13+k, natura 263+k ->
33+k) e tolti i due tileset vecchi. L'arciere da (480, 1480) a (5100, 360);
la vista iniziale in alto a destra; le quattro macchine nel livello
"gruppo macchine" (tenuto da parte: scenario.js GROUPS.lvl07). I pali
dell'autore disegnano il percorso (cima destra, strada a destra, citta' in
basso, labirinto, macchine, risalita al centro, porta, il palo piu' in alto
a (2109, 51)): li ho seguiti per pattuglie e nebbia. Restano i due avvisi
dell'import (due tratti di mura con l'origine sotto il bordo).

**Nel livello regia, tracciati da me** (da rivedere in Tiled):
- sette percorsi `pattuglia` (avanti e indietro: il giro chiuso torna per
  la stessa strada; i nemici a meno di 300 px da un punto ne fanno parte):
  i tre picchieri della cima fino al granaio lungo la strada (passano a
  ~200 px dalle mura coi fiori gialli); i tre picchieri al centro lungo la
  strada degli ulivi; il cavaliere solo fra gli ulivi (col picchiere
  vicino); due guerrieri soli nel labirinto; due giri nella citta' in alto
  (una coppia di picchieri, un guerriero). 17 nemici in giro, gli altri
  fermi;
- diciassette banchi di nebbia (`nebbia`: nuovo in tools/12 e nel kit, una
  polilinea orizzontale coi due capi e le proprieta' `velocita` e `nuvole`):
  uno alla partenza, uno sulle mura coi fiori gialli (il nascondiglio), lungo
  tutta la strada di destra (torri comprese), sulla citta' in basso, nel
  labirinto, verso le macchine (lontano dalla torre in basso a sinistra),
  sulla risalita al centro, alla porta e due in citta'.

**La regia** (`game/src/lvl07.js`, enemy_manager_lv7):
- *Partenza*: lo stealth (g.stealth, il "!"), l'arciere della nebbia
  (hunter, tiro furtivo), i banchi dai percorsi `nebbia`, la guardia (i
  nemici a meno di 450 px dalle macchine), i cavalieri (a meno di 700 px
  dalle stalle), le pattuglie. Giorno fisso (manager.js: niente ciclo),
  niente economia nemica (levels.js levelStep). Torri e fortezze nemiche
  di vedetta (`watch`: non tirano; il messaggero ci corre lo stesso a dare
  l'allarme), tranne la torre in basso a sinistra.
- *Lavoratori* (13, LV7.workers): quattro al granaio (cibo), due alle
  miniere, due agli ulivi (legna, col deposito), cinque in giro (fra le case
  in basso e in citta'), con orderWork (civilians.js) come la regia
  economica. Uno che vede l'arciere (davanti a 320 px, meta' nella nebbia e
  di notte; sempre a meno di 90) corre dalla guardia piu' vicina (entro
  2200 px; "!" arancione come il messaggero) e mette in allarme lei e chi
  le sta a meno di 450 px, verso dove ha visto l'arciere.
- *La porta*: l'arciere a meno di 650 px senza macchine: dialogo 7_2 e
  l'obiettivo delle macchine (segnalino sulla minimappa sulla porta).
- *Le macchine*: guardia morta e arciere a meno di 600 px: entrano dal
  bordo sinistro una alla volta (prima quella che va piu' lontano), alla y
  del loro posto, e ci vanno (l'ordine del clic destro); la prossima quando
  l'entrata e' libera, o dopo 4 s accanto. (Nate tutte nello stesso punto,
  la regola che separa le unita' sovrapposte le spingeva fuori dalla mappa.)
  Dialogo 7_3 e 7_4; la notte scende in ~3 s e resta.
- *Di notte* (fino alla porta giu') le macchine hanno `cloak`: nessun nemico
  le prende come bersaglio (enemies.js `nearestFoe`/`seenFoe` al posto
  dell'alleato piu' vicino, archery.js towerTarget, la difesa degli edifici),
  tranne i cavalieri delle stalle (l7knight). Una macchina a meno di 800 px
  dalle stalle: i cavalieri partono contro le macchine, e restano su di loro.
- *Porta giu'*: dialogo 7_5, i cavalieri contro le macchine, le macchine di
  nuovo visibili, l'obiettivo e il segnalino della cima.
- *Fine*: l'arciere a meno di 130 px dal palo piu' in alto: vittoria (codice
  del livello 8, 7 6 3 0 8). Sconfitta: l'arciere morto ("L'arciere e'
  caduto."), o le macchine tutte perse con la porta in piedi.
- *Dialoghi* (hints.js dialogo_7_0..7_6, oggetti in nuovi.json), obiettivi
  (endgame.js), storia del livello (menu.js), testi della vittoria e della
  sconfitta: scritti da me dalla regia, tradotti nelle sei lingue, da
  rivedere con l'autore. Il titolo nel menu resta quello della lista
  dell'originale ("Our old gods").
- progress.js UNLOCK_ALL a 7 (provvisorio, per provarlo).

**Prove.** `game/test/browser/lvl07.mjs` (nella CI): partenza (arciere in
alto a destra, 17 banchi, 17 nemici di pattuglia, 1 guardia, 5 cavalieri, 13
lavoratori, niente economia, giorno, 4 macchine tenute da parte, una sola
torre che tira, in basso a sinistra); i tre picchieri della cima in cammino
dopo 10 s; un lavoratore del granaio che vede l'arciere corre e mette in
allarme 2 nemici; la porta (dialogo e obiettivo); con la guardia viva niente,
uccisa le macchine entrano tutte e quattro, notte; un fante accanto a un
ariete per 5 s: vita intatta; un ariete vicino alle stalle: i 5 cavalieri
partono; porta giu' (dialogo, macchine visibili); vittoria al palo; le due
sconfitte. soak.mjs e saves.mjs con lvl07 (anche nella CI), stealth.mjs,
lvl06.mjs, orders.mjs lvl06, ui.mjs it, attackorder.mjs, melee.mjs:
passate.

**Da provare giocando e tarare** (numeri in LV7): quanto si vede la
nebbia e dove stanno i banchi, i giri delle pattuglie, la vista dei
lavoratori, la distanza dalle stalle, quanto e' facile la risalita con le
macchine (i nemici lungo il centro le ignorano, ma vedono l'arciere).

**Titolo e musica** (l'autore, 22 novembre 2026): il titolo del livello 7 e'
"Fog" (menu.js LEVELS, al posto di "Our old gods" della lista
dell'originale; tradotto: Nebbia, Niebla, Névoa, Nebel, Brouillard); la
musica e' quella del livello 1, solo il brano 2 (music.js musicPlan).

### 9.179 Il segnalino del livello 7 sulla mappa della campagna

Richiesta dell'autore (22 novembre 2026, stessa PR di §9.163, versione
0.2614), con un disegno (l'arciere con la balestra, 145 x 159, sfondo
trasparente): "questa e' l'icona da usare sulla mappa del menu per il
livello 7, da mettere sempre sulla catena montuosa centrale a sinistra del
6, fai una prova di piazzamento e girami il risultato".

Il disegno e' `nuovi/sprites/cap7.png`; in nuovi.json "derivati" `cap_l7`,
lato 100 come il 6 (§9.102), gruppo campagna (tools/05). menu.js
drawCampaign: con lvlshown oltre 6 il segnalino a L7_MARK = (-145, -45) dal
centro della mappa (il 6 e' a (-3, -123)), sulla fascia grigia della catena
centrale, il numero 85 px sopra (a 67, come il 6, cadeva sull'arco:
l'autore), e la freccia fr_corta dal 6 al 7
a meta' strada, girata da L7_ARROW (calcolata dai due segnalini) e un po'
piu' corta (0,75: fra due segnalini vicini toccava le icone). Una prima prova
a (-150, -95), alla quota del 6, stava sopra la catena e quasi addosso
all'elenco dei livelli. Prova: foto della mappa a 1280 x 720 e 1920 x 1080
mandate all'autore per l'approvazione.

### 9.180 L'editor di mappe: lo scheletro e la proposta

Richiesta dell'autore (22 novembre 2026, PR nuova, versione **0.2615**), con
un disegno a matita: "Dobbiamo creare l'editor dei livelli [...] con
interfaccia incolonnata a sinistra e tool selezionato in basso. Deve essere
accessibile dal gioco tramite un tasto 'editor di mappe' sotto
'schermaglia' e fare circa le cose che facciamo su Tiled [...]. Inizia a
impostare il lavoro e discutiamo insieme di come farlo". E' la tappa R6
della roadmap ("Editor di mappe e scenari condivisi").

Il disegno: una colonna a sinistra con, dall'alto, *sposta* (copia e
incolla, specchia, elimina), *polilinea* (fiumi, strade), *pennello area*
(boschi, texture), *inserisci* (unita', risorse, edifici...); piu' sotto,
staccati, *nuova mappa*, *apri mappa*, *salva mappa*, *prova mappa*,
*impostazioni* (controllo CPU, descrizione e informazioni della mappa;
"password?"). In basso un riquadro col titolo "tool selezionato".

**Fatto: lo scheletro.**
- Menu: "Editor di mappe" e' il terzo pulsante di "Giocatore singolo",
  sotto "Schermaglia" (menu.js MENU_PAGES, BTN_LABEL); apre `?room=editor`.
- app.js: con `room=editor`, dopo renderer e atlas, passa a
  `editor.js runEditor`, un ciclo suo senza World ne' partita (input, ciclo,
  renderer, font e sprite del gioco). E' un import dinamico: esbuild lo mette
  in un pezzo a parte del bundle (~10 KB), che si scarica solo aprendo
  l'editor; il resto del gioco va in `dist/app.js` e in un pezzo comune.
- La mappa: `newMap()` e' uno scenario `535-scenario` versione 1 (§9.3), lo
  stesso formato di tools/12 e degli `scenari/`, vuoto: 6000 x 6000, sfondo
  green1 (come la mappa vuota del kit). Si disegna lo sfondo ripetuto dentro
  la mappa, fuori il colore della pagina, il bordo a 2 px.
- La vista (EditorView): come la Camera del gioco ma con lo zoom da 0,5 a 4
  (in partita 1-1,7) attorno al puntatore con la rotella (uno scatto x1,15;
  il touchpad in proporzione), un margine di 400 px fuori dalla mappa per
  arrivare ai bordi da sotto la colonna; si sposta con le frecce (Shift: piu'
  veloce), trascinando col tasto centrale o con Spazio + sinistro.
- La colonna dal disegno: un vetro chiaro coi pulsanti tondi bianchi (come
  "Indietro" e lo schermo intero del menu), le icone disegnate a linee
  (quattro frecce, la polilinea coi punti, il pennello, l'omino col "+", il
  foglio col "+", la cartella, il dischetto, il triangolo del play,
  l'ingranaggio); lo strumento scelto scuro con l'icona bianca; una lineetta
  fra strumenti e azioni. Col puntatore sopra, il nome a destra della
  colonna. Si rimpicciolisce tutta nelle finestre basse (editorLayout).
- Il riquadro in basso, centrato a destra della colonna: il nome dello
  strumento, "Prossimamente", le coordinate del puntatore sulla mappa, cosa
  fara' lo strumento e i comandi della vista. Strumenti coi tasti 1-4.
- Le azioni (nuova, apri, salva, prova, impostazioni) per ora dicono
  "Prossimamente". Esc o il cerchio "Indietro" in alto a destra: il menu.
- Testi nelle sei lingue (texts.js). Il font del gioco non ha "·" ne' "×":
  la riga sotto il titolo e' "Nuova mappa  -  6000 x 6000".

*Trovato per strada.* La prova del determinismo (§9.152,
`determinism.test.mjs`) falliva su `main` dal §9.179: menu.js calcolava la
freccia del livello 7 con `Math.atan2`. Ora `datan2` di dmath.js: stesso
angolo (-331 gradi).

Prove: `editor.test.mjs` (nuova: la mappa vuota ha le chiavi degli scenari
di tools/12; colonna e riquadro dentro la finestra a 1920 x 1080, 1600 x
900, 1280 x 720 e 1024 x 600, senza toccarsi; i pulsanti al loro posto;
zoom col punto fermo, limiti e margine; testi tradotti), `editor.mjs`
(nuova, anche in CI: dal menu all'editor, clic e tasto sugli strumenti,
rotella col punto fermo, trascinata col centrale, Esc al menu), test
unitari (122), `soak.mjs` su menu e match, screenshot in inglese e in
italiano.

**La proposta (da discutere con l'autore).**

*1. Che mappe fa.* Due generi, molto diversi per lavoro:
- (A) **mappe da schermaglia**: due posizioni di partenza (i due `centro`,
  come le cinque di oggi: skirmish.js skirmishPrepare da' quello della CPU
  al nemico), risorse, natura, terreno. Le regole sono quelle della
  schermaglia (difficolta', vittoria, risorse... si scelgono all'avvio),
  quindi una mappa e' subito giocabile, contro la CPU e online (§9.156).
- (B) **scenari con regia**, come i livelli della campagna: eserciti ed
  edifici nemici gia' piazzati, obiettivi, ondate, dialoghi. Oggi la regia
  e' codice (levels.js, lvl07.js); per gli scenari dei giocatori servono le
  regole dichiarative della roadmap R2 ("distruggi X: vittoria", "al minuto
  5 un'ondata"), un lavoro a parte.
Raccomandazione: prima (A), con (B) dopo, sopra lo stesso editor.

*2. Il formato.* La mappa resta uno scenario `535-scenario` (§9.3): le
istanze, `rivers`, `roads`, `bridges` e `patches` come le scrive tools/12.
Una mappa fatta nell'editor e una fatta in Tiled sono la stessa cosa, e il
gioco le carica allo stesso modo. In piu' solo le informazioni della mappa
(descrizione, autore, impostazioni). Validazione rigorosa all'apertura (R2:
solo oggetti noti, dentro la mappa, misure e numero di istanze massimi,
niente codice: i file si scambiano fra sconosciuti).

*3. Cosa si vede.* La mappa com'e' in partita, col motore del gioco: gli
sprite dell'atlas, il suolo cotto in blocchi (ground.js) coi fiumi, le
strade, i ponti e le macchie di rivers.js; gli alberi sempre visibili (in
partita si scoprono); le macchie d'erba e di fiori con le loro particelle;
gli oggetti senza sprite (manager, regia) come segnaposto. Da fare per lo
zoom lontano: i blocchi del suolo sono al piu' 48 da 512 px (bastano fino
allo zoom 1,7 della partita); per vedere mezza mappa o tutta servono
blocchi cotti a risoluzione ridotta (1/2, 1/4).

*4. Gli strumenti* (dal disegno), tutti con annulla e ripeti (Ctrl+Z,
Ctrl+Y):
- **Sposta**: clic o riquadro per scegliere (Shift aggiunge), trascinare
  sposta; Ctrl+C e Ctrl+V (incolla sotto il puntatore), specchia (scala x
  -1, come il ribaltamento di Tiled), ruota, Canc elimina.
- **Polilinea**: fiume, strada marcata (strada1) o secondaria (strada2),
  con larghezza, larghezza finale e densita' come in Tiled (§9.97); un clic
  per punto, doppio clic o Invio per finire, i punti si trascinano. I ponti:
  un clic su un fiume mette il ponte di traverso, gia' girato e lungo quanto
  serve (oggi in Tiled e' un rettangolo da girare a mano); anche i ponti
  dipinti (§9.100).
- **Pennello area**: un pennello tondo (raggio regolabile) e la gomma.
  *Boschi*: il pennello dipinge alberi veri, uno per uno, col campionamento
  di Poisson di tools/12 (distanza 90 px) solo dove non ce ne sono gia';
  restano istanze normali (si spostano o tolgono a uno a uno). *Texture*:
  city2, city1, green1 (le macchie di §9.99): il pennello dipinge su una
  griglia fine, il contorno diventa i poligoni sfumati di oggi.
- **Inserisci**: le categorie dei tileset del kit (terreno, montagne e
  fiumi, natura, risorse, edifici, unita', nemici, citta', nuovi) con le
  loro miniature; le varianti (alb1..alb8) a caso o scelte; il fantasma
  dell'oggetto sotto il puntatore, rosso dove non sta (come i cantieri);
  griglia da 50 px facoltativa. Il catalogo oggi e' in Python
  (tools/tiledkit.py `category`): va scritto anche per il gioco (un JSON
  generato da tools/07 o 11, cosi' resta uno solo).

*5. Nuova, apri, salva.* Nuova: nome, misura (le mappe di oggi vanno da
3200 x 8000 a 9000 x 4000; la schermaglia 7000 x 7000), sfondo. Salva: nel
browser (IndexedDB, come i salvataggi, con l'elenco delle proprie mappe) e
su file da scaricare (`.dvmap`, compresso come `.dvgame`, §9.134) per
scambiarle. Apri: le proprie mappe, un file, e le mappe del gioco
(schermaglie e livelli) come punto di partenza, in copia.

*6. Prova mappa.* La mappa va in IndexedDB e si apre una partita
(`?room=custom`): app.js carica lo scenario dal browser invece che da
`assets/rooms/` (la conversione scenario -> room di tools/07 e' breve, si
porta in JS), con le opzioni della schermaglia; dal menu di pausa "Torna
all'editor". Prima di partire un controllo: due `centro`, niente oggetti
fuori mappa. Il manager e la vista iniziale li mette l'editor.

*7. Impostazioni.* Nome, descrizione (si legge nella schermata della
schermaglia), autore, misura e sfondo; per la schermaglia la **simmetria**
facoltativa: quello che si fa in una meta' compare ruotato di 180 gradi
nell'altra, come fa tools/16 per le cinque mappe di oggi. Le mappe
dell'editor fra quelle della schermaglia, con la foto fatta dal browser.

*Fasi* (una PR ciascuna, o piu'): F1 lo scheletro (questa); F2 la mappa
vera nell'editor (istanze, suolo, fiumi, strade, macchie; zoom lontano; le
mappe del gioco aperte in sola lettura; il catalogo); F3 inserisci e sposta
con annulla e ripeti, salva e apri (browser e file); F4 polilinea e
pennello; F5 prova mappa e impostazioni, le mappe dell'editor nella
schermaglia; poi gli scenari con regia (R2) e la condivisione.

**Da decidere con l'autore** (decise in §9.181 e §9.182)
- [x] Che mappe: solo mappe da schermaglia (§9.182).
- [x] Per chi: solo per i giocatori, per ora; gli scenari della campagna non
  si modificano, le mappe della schermaglia sono i modelli (§9.182, al posto
  di §9.181).
- [x] I boschi: tutti e due, alberi uno per uno con "Inserisci" e col
  pennello, che regola larghezza e densita' (§9.182).
- [x] "Controllo CPU": come nella schermaglia, piu' una CPU statica che non
  fa nulla (§9.182), e "a scelta del giocatore" al lancio (§9.186); la
  statica reagisce comunque (difesa, frecce, fuga): le manca solo
  l'economia e la gestione (§9.189).
- [ ] "Password?": in sospeso (l'autore non ricorda a cosa servisse).
- [x] Simmetria: spenta di partenza; si accende diagonale, orizzontale o
  verticale rispetto alla mappa (§9.182); e' un'impostazione degli strumenti,
  non della mappa (§9.186).
- [x] Le mappe dell'editor nella schermata della schermaglia, se caricate;
  anche nella partita online, col blu che la riceve all'inizio (§9.182).

### 9.181 L'editor di mappe, fase 2: la mappa vera e "Apri mappa"

Risposta dell'autore alla proposta di §9.180 (22 novembre 2026, stessa PR,
versione 0.2615): "Ovviamente Tiled era un esempio, facciamo la cosa piu'
comoda per noi". Quindi:
- **l'editor e' anche lo strumento nostro**, non solo dei giocatori: non
  imita Tiled e non deve restare compatibile con lui (niente .tmx in
  uscita). Le mappe che fa sono scenari (§9.3), il formato che il gioco gia'
  carica: una mappa dell'editor puo' andare dritta in `scenari/` (la CI
  rifa' solo gli scenari che vengono da un .tmx di `mappe/`). Tiled e il kit
  restano per le mappe gia' fatte finche' servono;
- **prima la schermaglia** (due centri, risorse, natura: subito giocabile),
  poi gli scenari con regia, sopra lo stesso editor;
- **i boschi si dipingono albero per albero** (istanze normali, come quelle
  che tools/12 ricava dal livello `boschi`).
Restano aperte le altre domande di §9.180 (controllo CPU, password,
simmetria, mappe dell'editor nella schermaglia).

**Fatto: la mappa vera nell'editor** (fase F2 di §9.180, senza il catalogo
degli oggetti, che va con "Inserisci").
- `mapfile.js` (nuovo): il formato delle mappe. `newMap` (spostato da
  editor.js), `roomToScenario` (le room di `game/assets/rooms/` tornano
  scenari: cosi' l'editor apre le mappe del gioco) e `scenarioToRoom` (la
  conversione di tools/07_scene.py in JS, che servira' a "Prova mappa": per
  tutti gli 11 scenari da' le stesse room di tools/07, a parte -0 e 0).
- La scena (editor.js `buildScene`): un World senza comportamenti, solo per
  disegnare: gli sprite in ordine di depth come in partita (World.draw),
  tutti visibili (in partita alberi e rovine si scoprono); i soli
  comportamenti che servono a disegnare: le macchie d'erba e di fiori (le
  loro particelle, effects.js decorCreate), gli oggetti a fette (il
  monastero, il fiume del livello 4: scenario.js sliced), le balaustre dei
  ponti dipinti. La variante degli oggetti con piu' sprite (alb1..alb8) e'
  quella scritta nella mappa o, se non c'e', una fissa dalla posizione
  (`variantOf`: riaprendo la mappa non cambia; in partita la sceglie ancora
  il gioco). Il suolo e' quello della partita (GroundCache: sfondo, macchie,
  sprite del suolo, strade, fiumi e ponti). Si caricano i gruppi d'atlas del
  gioco e quelli degli oggetti della mappa (la citta'); gli oggetti che il
  gioco non conosce si saltano (con un avviso in console).
- **Da lontano** (ground.js): la partita cuoce il suolo in blocchi da 512 px
  di room a un texel per pixel, al piu' 48 (bastano fino allo zoom 1,7).
  Ora la cache ha dei livelli di dettaglio: al livello L un blocco copre L x
  L blocchi con gli stessi 514 x 514 texel; l'editor sceglie L dallo zoom
  (`lodFor`: circa un texel per pixel dello schermo). La partita usa solo il
  livello 1, con lo stesso codice di prima. Lo zoom dell'editor arriva a 8
  (prima 4): Padania (7000 x 7000) si vede tutta in 12 blocchi.
- Fuori dalla mappa il colore della pagina (i blocchi sbordano), sotto le
  istanze: montagne, chiazze e alberi a cavallo del bordo si vedono interi,
  come li ha messi l'autore.
- **"Apri mappa"** (il primo pulsante delle azioni che fa qualcosa): un velo
  scuro e le mappe del gioco in due colonne, il tutorial e i livelli 1-7 a
  sinistra, le cinque schermaglie a destra, coi loro nomi tradotti; un clic
  apre la mappa (la barra di caricamento del gioco), la vista va sulla sua
  vista iniziale, il nome e le misure sotto il titolo. Esc o un clic fuori
  chiudono il pannello. Per ora la mappa si guarda soltanto: gli strumenti
  arrivano con le fasi F3-F4.
- Testi nuovi nelle sei lingue: "Non e' stato possibile aprire questa
  mappa".

Prove: `editor.test.mjs` (scenario -> room -> scenario uguale per gli 11
scenari, con gruppi, fiumi, strade, ponti, macchie e percorsi; il pannello
in due colonne dentro la finestra a 1920 x 1080 e 1280 x 720; i nomi delle
mappe; `variantOf` fisso; `lodFor`), `editor.mjs` (in piu': Padania dal
pannello, 819 istanze, 598 alberi visibili, il fiume e 12 strade, niente
saltato; da lontano la mappa intera in 12 blocchi), test unitari (125),
`rivers.mjs` (fiumi, strade, ponti e macchie in partita come prima),
`soak.mjs` su lvl06, sk_padus e lvl04 senza errori. Aperte nell'editor anche
lvl03, lvl04, lvl06 e sk_silva (2947 istanze), senza errori: screenshot
vicini e lontani (la citta' e i ponti dipinti del livello 6, il fiume e le
montagne del livello 4). Caricare una mappa: ~3 s col rendering software
delle prove.

**Prossimo** (F3): il catalogo degli oggetti per categoria (un JSON scritto
da tools/07, dalle categorie di tools/tiledkit.py), "Inserisci" col
fantasma sotto il puntatore, "Sposta" (selezione, trascinare, copia e
incolla, specchia, elimina), annulla e ripeti; "Nuova mappa" (misura,
sfondo), "Salva" e "Apri" anche dal browser e da file.

### 9.182 L'editor di mappe: le decisioni dell'autore, "Inserisci" e "Sposta"

Risposte dell'autore alle domande di §9.180 (22 novembre 2026, stessa PR,
versione 0.2615):
1. **Solo mappe da schermaglia**, per cominciare.
2. **Solo per i giocatori**, per ora: non modificano gli scenari esistenti
   (i livelli della campagna, il tutorial), ma le mappe della schermaglia
   sono disponibili come **modelli** per partire. Corregge §9.181 ("anche lo
   strumento nostro", "Apri mappa" coi livelli): "Apri mappa" ora offre solo
   le cinque schermaglie, e la mappa aperta e' una mappa nuova ("Nuova mappa
   da Padania", senza nome).
3. **I boschi: tutti e due**, alberi uno per uno con "Inserisci" e col
   pennello, che regola **larghezza e densita'**.
4. **Controllo CPU: come nella schermaglia** (difficolta', stile), **piu' una
   CPU statica che non fa nulla** (per provare la mappa con calma).
5. **Password: in sospeso** (l'autore non ricorda a cosa servisse).
6. **Simmetria spenta di partenza**; si accende **diagonale, orizzontale o
   verticale** rispetto alla mappa. Come la intendo (confermato
   dall'autore, §9.183): diagonale = la rotazione di 180 gradi attorno al centro
   delle cinque schermaglie di oggi (basi in angoli opposti, tools/16);
   orizzontale = le due meta' a sinistra e a destra (specchio sull'asse
   verticale); verticale = sopra e sotto (specchio sull'asse orizzontale).
   Come in tools/16 si sposta il centro della maschera e lo sprite resta
   com'e' (uno specchiato o capovolto avrebbe le ombre dalla parte
   sbagliata, a destra in basso negli edifici).
7. **Le mappe dell'editor nella schermata della schermaglia**, se caricate;
   e anche **nella partita online**, col blu che scarica la mappa da solo
   all'inizio. Domanda dell'autore: "tanto e' un invio di un pacchetto dati
   allo stesso modo dei comandi della partita, giusto?" *Si', nello stesso
   canale diretto fra i due browser* (il DataChannel di WebRTC dei comandi,
   rtc.js), con tre differenze: (a) la mappa e' molto piu' grande di un
   comando (Padania 73 KB di scenario, Silva 290 KB; compressa come i
   `.dvgame` qualche decina di KB, contro poche decine di byte di un
   comando): va spezzata in pezzi da 16 KB, la misura che tutti i browser
   accettano; (b) va mandata prima che parta la partita, con l'impronta
   della mappa nel codice di invito, cosi' il blu controlla di aver
   ricevuto proprio quella (le due partite devono partire identiche, §9.152)
   e la convalida come ogni file che arriva da fuori; (c) oggi chi entra
   apre la mappa (per nome) prima di collegarsi, e la partita nasce col
   caricamento della pagina: con una mappa dell'editor il blu deve
   collegarsi, ricevere la mappa e solo allora costruire la partita, nella
   stessa pagina (ricaricarla chiuderebbe il collegamento). E' la parte piu'
   lunga del lavoro.

**Fatto: "Inserisci", "Sposta", annulla e ripeti** (fase F3, prima parte).
- `editmap.js` (nuovo): la mappa che si modifica. La mappa (lo scenario) e'
  la verita'; la scena la disegna (World senza comportamenti, il suolo cotto)
  e tiene il legame voce -> istanza. Ogni modifica e' una lista di cambi
  (voce, com'era, come diventa, il suo posto nella lista), quindi annulla e
  ripeti (fino a 200) rimettono le voci anche al loro posto nell'ordine di
  creazione. Un'istanza tolta si porta via le sue particelle (le macchie) e
  i suoi "figli" (fette, balaustre); se cambia un oggetto cotto nel suolo
  (strade e prati dipinti, chiazze, ponti dipinti) il suolo si rifa'.
  `buildScene` di §9.181 e' diventato `EditScene`.
- **Il catalogo** (`CATALOG`): gli oggetti delle cinque mappe della
  schermaglia e i loro simili, in sei schede: partenze (il `centro`, al
  piu' due: un terzo non si mette e un avviso lo dice), risorse (oro,
  pietra grande e piccola, le tre rovine), alberi (albero e albero finto),
  prati e fiori (le macchie d'erba, di grano e di fili, i fiori, l'erba alta
  graa11-15, prati, erba e chiazze dipinti), montagne (le dieci), citta'
  (gli edifici romani `ocr_*`, colonne, fontane, statue). Niente unita' ne'
  edifici dei giocatori (si parte col centro e 3 lavoratori, §9.118). Fiumi,
  strade e ponti saranno della polilinea. Il `manager` dei modelli resta
  nella mappa ma non si sceglie ne' si tocca.
- **"Inserisci"**: nel riquadro in basso le sei schede e gli oggetti della
  scheda in caselle con la miniatura (lo sprite rimpicciolito; le macchie
  senza sprite: un prato coi loro colori), le frecce o la rotella se non ci
  stanno tutti (la citta' ha 34 oggetti). Scelto un oggetto, il suo
  fantasma segue il puntatore (rosso fuori dalla mappa o se le partenze
  sono gia' due); un clic lo mette, il destro o Esc lo lasciano. Gli alberi
  hanno una variante a caso (alb1..alb8), scritta nella mappa (`sprite`,
  come fa tools/12) e mostrata gia' nel fantasma. Gli sprite della
  tavolozza si caricano in sottofondo la prima volta (la tavolozza scrive
  "Caricamento"): prima bloccavano l'editor per qualche secondo, trovato con
  la prova nel browser.
- **"Sposta"**: un clic sceglie la voce piu' in alto sotto il puntatore
  (dentro il riquadro dello sprite; le macchie, senza sprite, hanno un
  segnaposto tondo dei loro colori), Maiusc aggiunge o toglie; trascinare
  sposta la scelta (dal vivo, la modifica vera lasciando il tasto: un solo
  passo da annullare); trascinare fuori dagli oggetti fa il riquadro di
  scelta, e con Ctrl il riquadro c'e' sempre (in un bosco ogni clic cade su
  un albero: trovato con la prova); Canc elimina, M specchia (scala x -1),
  Ctrl+C e Ctrl+V copiano e incollano sotto il puntatore (senza passare le
  due partenze), Ctrl+A sceglie tutto, il destro o Esc lasciano la scelta.
  La scelta ha il riquadro bianco, la voce sotto il puntatore uno sottile.
- Con ogni strumento: Ctrl+Z annulla, Ctrl+Y (o Ctrl+Maiusc+Z) ripete. Sul
  Mac si usa Ctrl, non Cmd (il gioco non legge il tasto Cmd).
- **"Nuova mappa"**: per ora la mappa vuota di partenza (6000 x 6000,
  green1); misura e sfondo arriveranno con le impostazioni.
- **La conferma**: uscendo (Indietro, Esc) o aprendo un'altra mappa con una
  mappa cambiata, "Le modifiche a questa mappa andranno perse", Continua o
  Annulla. Esc prima lascia l'oggetto o la scelta, poi esce.
- Testi nuovi nelle sei lingue (schede, comandi, avvisi, conferma).

Prove: `editor.test.mjs` (in piu': i modelli sono le cinque schermaglie; la
conferma dentro la finestra; la tavolozza dentro il riquadro, le frecce e lo
scorrimento; ogni oggetto del catalogo esiste fra gli oggetti del gioco; una
scena vera in node (senza atlas): aggiungi, modifica, togli, annulla tre
volte e ripeti tre volte, con le voci al loro posto, le particelle della
macchia tolte con lei, il manager che non si sceglie), `editor.mjs` (in
piu': i modelli, Padania come mappa nuova senza nome, la miniera messa dalla
tavolozza sotto il puntatore, annulla e ripeti, il destro, la miniera
scelta, trascinata e tolta con Canc, la conferma con Annulla e con
Continua), test unitari (127), screenshot (tavolozza, fantasma, scelta,
conferma, modelli).

**Prossimo**: "Salva" e "Apri" (le proprie mappe nel browser, in IndexedDB
come i salvataggi, e su file `.dvmap` da scambiare, con la convalida di
R2); le impostazioni (nome, descrizione, misura, sfondo, CPU con la statica,
simmetria); il pennello (boschi con larghezza e densita', texture) e la
polilinea (fiumi, strade, ponti); "Prova mappa"; le mappe dell'editor nella
schermata della schermaglia e poi nella partita online.

### 9.183 Gli stili di case e alberi; la simmetria confermata

Risposta dell'autore (22 novembre 2026, stessa PR, versione 0.2615): "si'
ti confermo sulla simmetria" (diagonale = rotazione di 180 gradi,
orizzontale = meta' a sinistra e a destra, verticale = sopra e sotto; gli
oggetti cambiano posto ma non si capovolgono, §9.182 punto 6), e "per le
case e gli alberi dai la possibilita' prima dell'inserimento di cambiare
stile con un tasto, in modo da tenere un singolo oggetto con piu' stili".

Prima ogni casa della citta' romana era una casella a se' (34 caselle nella
scheda "Citta'", da scorrere) e l'albero prendeva una variante a caso a ogni
clic.
- **Una casella, piu' stili** (editmap.js `paletteItems`): gli alberi (albero
  e albero finto) hanno gli 8 sprite fra cui il gioco sceglie (alb1..alb8,
  scritti nella voce come `sprite`, come fa tools/12 con le varianti di
  Tiled); le **25 case** `ocr_01`..`ocr_45` (tutte della stessa misura, viste
  in un foglio di provini) sono una famiglia: una casella "casa" con 25 stili
  (`HOUSES`; ogni stile e' l'oggetto della sua casa). Basilica, teatro e
  tempio restano a parte (monumenti), come colonne, fontane e statue. La
  scheda "Citta'" ora ha 10 caselle e ci sta in una fila.
- **Il tasto S** ("stile" in tutte e sei le lingue; Maiusc+S all'indietro):
  con "Inserisci" cambia lo stile della casella scelta prima di metterla; il
  fantasma sotto il puntatore e la miniatura mostrano lo stile scelto, la
  casella scrive quale e quanti in basso a destra ("9/25"), il riquadro "S:
  stile 9/25". Ogni casella ricorda il suo stile. Con "Sposta" lo stesso
  tasto cambia lo stile delle case e degli alberi scelti (con annulla), anche
  quelli gia' messi o venuti dal modello (un albero senza `sprite` parte
  dalla variante che mostra, quella della sua posizione).

Prove: `editor.test.mjs` (l'albero ha gli 8 sprite del gioco, la casa le 25
case nell'ordine di `HOUSES`, gli altri uno stile; lo stile di una voce
messa, anche senza `sprite`; la scheda "Citta'" senza scorrimento, quella
dei prati e fiori con), `editor.mjs` (in piu': l'albero col terzo sprite
dopo S due volte, la casa col secondo stile dopo S, Maiusc+S, S; con
"Sposta" S cambia la casa scelta e Ctrl+Z la rimette), test unitari (127),
screenshot della scheda delle case e di quella degli alberi.

### 9.184 L'editor di mappe: salva e apri, impostazioni, simmetria

Richiesta dell'autore (22 novembre 2026, stessa PR, versione 0.2615):
"prosegui pure", dopo §9.183. Il passo dopo "Inserisci" e "Sposta": senza
salvare l'editor non serviva a niente.

**Il formato** (mapfile.js). Le mappe dell'editor restano scenari (§9.3) con
in piu' tre campi che tools/07 e il gioco ignorano: `description`, `cpu`
(`difficulty` come nella schermaglia, `style` come nella schermaglia piu'
`static`, §9.182 punto 4) e `symmetry` (`none`, `diagonal`, `horizontal`,
`vertical`). `newMap` li ha ai valori di partenza.

**La convalida** (`validateMap`, roadmap R2: le mappe si scambiano fra
sconosciuti). Una mappa che arriva dal browser o da un file passa solo se:
formato e versione giusti; misure fra quelle dell'editor (4000-9000 a passi
di 1000) e sfondo fra i tre; al piu' 20000 istanze, solo oggetti del
catalogo, il manager e i ponti dipinti dei modelli (`allowedObjects`),
posizioni entro 4000 px dalla mappa, scale e rotazioni finite (scala non
zero, al piu' 8), la variante fra quelle del gioco o lo sprite dell'oggetto;
al piu' 300 fiumi, strade, ponti e macchie, ognuno coi suoi punti (al piu'
4000, dentro i limiti) e solo i campi che il gioco legge (le strade:
larghezza, larghezza finale, tipo, densita'; le macchie: sfondo,
sfumatura, opacita'); nome al piu' 40 caratteri, descrizione 600. I campi
sconosciuti si perdono, quelli che mancano prendono i valori di partenza.
Anche i modelli passano dalla convalida: le cinque schermaglie la
superano. *Trovato cosi'*: gli alberi finti di Appennini (`sk_bardonis`)
hanno come variante `alb1_F`, lo sprite dell'oggetto (la tile di Tiled),
non uno degli 8 fra cui il gioco sceglie: accettato.

**Salva** (mapstore.js, il pulsante col dischetto o Ctrl+S). Un pannello
HTML (netui.js NetPanel, come quelli della partita online: le caselle di
testo vere) col nome e tre pulsanti: "Salva nel browser" (IndexedDB, il
database `535-maps`, la mappa compressa con gzip come i salvataggi), "Salva
su file" (scarica `dustveil-<nome>.dvmap`, il JSON compresso con gzip; non
mescolato come i `.dvgame`, §9.135: una mappa si scambia), "Annulla". Senza
nome non salva ("Dai un nome alla mappa"). Ctrl+S dopo la prima volta salva
di nuovo nel browser senza chiedere (il browser non apre "Salva pagina").
Il titolo ha un asterisco finche' ci sono modifiche non salvate; la
conferma prima di perderle (§9.182) guarda le modifiche dall'ultimo
salvataggio, anche delle impostazioni.

**Apri** (il pulsante con la cartella): a sinistra **le tue mappe** (quelle
nel browser, dalla piu' recente; otto righe, la rotella scorre le altre;
il cerchio con la x la elimina, dopo la conferma "Questa mappa sara'
eliminata"), sotto **"Apri un file..."** (un `.dvmap`, o il `.json` di uno
scenario); a destra **i modelli** (le cinque schermaglie, §9.182). Una mappa
aperta dal file non e' ancora nel browser finche' non la si salva.

**Impostazioni** (l'ingranaggio): un pannello HTML compatto (l'etichetta a
sinistra, le scelte a destra; il primo, coi titoli sopra, non stava nello
schermo a 1600 x 900 e lasciava vedere sotto i testi dell'editor): nome,
descrizione, larghezza, altezza, sfondo (prato, selciato, pietra: green1,
city2, city1), difficolta' e stile della CPU (con "Statica (non fa nulla)"),
simmetria (spenta, diagonale, orizzontale, verticale). "Applica" li scrive
nella mappa; misure o sfondo nuovi rifanno la scena (senza perdere annulla
e ripeti). La CPU per ora si ricorda soltanto: servira' a "Prova mappa" (e
la statica va fatta nel gioco).

**La simmetria** (editmap.js `mirrorPoint`, `twinAt`, `twinOf`,
`withTwins`), come confermata in §9.183: il gemello di un oggetto sta al
posto specchiato del **centro della sua maschera** (come tools/16: l'ingombro
nello stesso posto; le macchie, senza maschera, dal loro centro), con lo
stesso sprite, non capovolto; chi cade sull'asse (o al centro, per la
diagonale) non ha gemello. Con la simmetria accesa: "Inserisci" mette
l'oggetto e il gemello (il fantasma mostra tutti e due; due partenze in un
clic); "Sposta" sposta i gemelli a specchio (dal vivo e nella modifica, un
solo passo da annullare), Canc, M e S valgono anche per loro, Ctrl+V incolla
anche i gemelli. Il gemello si ritrova cercando lo stesso oggetto entro 2
px dal posto specchiato: niente legami da tenere, funziona anche con le
mappe fatte prima di accendere la simmetria. Sulla mappa l'asse tratteggiato
(orizzontale e verticale) o una croce nel centro (diagonale); i gemelli
della scelta col riquadro sottile; sotto il titolo "Simmetria: diagonale".

*Trovato con la prova nel browser*: nell'elenco delle mappe un clic sulla
riga veniva preso per il cerchio "elimina" (stesso nome di campo per la
riga e per il cerchio) e apriva la conferma di eliminazione. Il riquadro in
basso passa da 170 a 196 px: i comandi di "Sposta" in italiano, con "S:
stile", andavano su tre righe e la terza copriva quella della vista.

Testi nuovi nelle sei lingue (impostazioni, salva, apri, simmetria; "Spenta"
al femminile, come la simmetria).

Prove: `editor.test.mjs` (in piu': la simmetria, i punti e gli spostamenti
nei tre modi; la convalida: le cinque schermaglie passano con le
informazioni di partenza, una mappa con una CPU statica e la simmetria
verticale passa perdendo un campo sconosciuto, non passano un cavaliere
nemico, una posizione fuori, una variante sbagliata, misure e sfondo
sbagliati, un fiume di un punto, un altro formato; i gemelli in una scena
vera: al posto specchiato del centro della maschera, ritrovati, nessuno al
centro, nessuno se la simmetria cambia; il nome del file; il pannello Apri
con 12 mappe salvate, lo scorrimento e il file nella colonna giusta),
`editor.mjs` (in piu': impostazioni con nome e simmetria diagonale; la
miniera e la gemella, spostate a specchio, tolte insieme, rimesse con
annulla; Ctrl+S col pannello, salvata nel browser; il `.dvmap` scaricato e
decompresso; la pagina ricaricata, la mappa nell'elenco e riaperta; aperta
dal file; eliminata dall'elenco), test unitari (130), screenshot
(impostazioni, salva, apri, simmetria diagonale con le montagne).

**Prossimo**: il pennello (boschi con larghezza e densita', le texture) e
la polilinea (fiumi, strade, ponti); "Prova mappa" (lo scenario dal browser
nel gioco, la CPU statica); le mappe dell'editor nella schermata della
schermaglia, poi nella partita online.

### 9.185 L'editor di mappe: il pennello e la copertina

Richiesta dell'autore (23 novembre 2026, stessa PR, versione 0.2615):
"Prosegui. Nelle impostazioni deve esserci anche la possibilita' di
caricare un'immagine come copertina della mappa, tipo quelle della
schermaglia".

**La copertina** (impostazioni). Una riga "Copertina" con l'anteprima
(180 x 120), "Carica un'immagine..." e "Togli". L'immagine scelta (qualsiasi
formato che il browser legge) e' ritagliata al centro alle proporzioni 3:2 e
ridotta a **720 x 480**, come le foto delle mappe della schermaglia (§9.121),
poi compressa in WebP (JPEG dove il browser non sa scrivere WebP) e messa
nella mappa come `cover` (mapstore.js `makeCover`): viaggia col salvataggio
nel browser e col `.dvmap`. Convalida (mapfile.js): solo WebP o JPEG in
base64 (niente SVG ne' altri indirizzi), al piu' ~500 KB. Si vedra' nella
schermata della schermaglia quando ci saranno le mappe dell'editor.
*Trovato con lo screenshot*: il riquadro "Nessuna copertina" restava accanto
all'immagine (lo stile `display: flex` vince sull'attributo `hidden`).

**Il pennello** (il terzo strumento; editbrush.js per la geometria). Nel
riquadro quattro schede, **Bosco**, **Selciato**, **Pietra**, **Prato** (gli
sfondi delle macchie di §9.99: city2, city1, green1), la **larghezza** (il
diametro: 200-1600 px, 600 di partenza; anche Maiusc+rotella sulla mappa) e,
per il bosco, la **densita'** (1-6: la distanza minima fra gli alberi, da
180 a 60 px; 4 = 90 px, come il pennello bosco di Tiled, tools/12). Il
**sinistro dipinge, il destro cancella**; sulla mappa il cerchio tratteggiato
del pennello (rosso cancellando). Una pennellata intera e' **un passo solo**
da annullare (EditScene `begin`/`end`).
- *Bosco*: alberi veri, uno per uno (decisione dell'autore, §9.182), con una
  variante a caso fra le 8: a ogni passo una decina di punti a caso nel
  cerchio, tenuti se lontani almeno la distanza dagli alberi gia' messi
  (`TreeGrid`, celle grandi quanto la distanza; `forestStep`) e se i piedi
  dell'albero non toccano l'acqua o la maschera di un oggetto (miniere,
  centri, montagne...; i prati e le strade dipinti e le macchie no:
  EditScene `blocks`). La gomma toglie gli alberi nel cerchio.
- *Texture*: la pennellata e' una fila di cerchi (uno ogni 30% del raggio);
  lasciato il tasto, la loro unione diventa il contorno di una macchia
  (`strokeOutlines`: una griglia fine, marching squares, gli anelli, via i
  buchi e i pezzetti, Douglas-Peucker), sfumatura 40 px come in Tiled, che il
  gioco disegna come sempre (rivers.js patchGeometry). Durante la pennellata
  i cerchi semitrasparenti del colore della texture. La gomma toglie le
  macchie di quella texture toccate dal cerchio (intere).
- *Simmetria*: il bosco mette anche il gemello di ogni albero (se c'e'
  posto), la texture anche la sagoma specchiata, la gomma cancella anche al
  posto specchiato; il cerchio del pennello si vede tutte e due le volte.
- Per farlo il modello ha imparato le forme: annulla e ripeti valgono anche
  per le macchie (e varranno per fiumi, strade e ponti della polilinea:
  EditScene `addFeatures`, `removeFeatures`, i cambi con `key`); cambiate
  le forme, il motore ne rifa' la geometria e il suolo si ricuoce.

Testi nuovi nelle sei lingue (bosco, densita', i comandi del pennello, la
copertina).

Prove: `editor.test.mjs` (in piu': la sagoma di una pennellata contiene i
suoi centri e non i punti lontani, due pezzi staccati fanno due macchie, un
anello di cerchi si riempie; il bosco mai sotto la distanza, mai fuori dal
cerchio, niente dove non sta; area e semplificazione di un poligono; il
riquadro del pennello a 1920 x 1080 e 1280 x 720; la copertina: WebP e
JPEG si', SVG, PNG, indirizzi, testo con spazi e immagini troppo grandi no;
le macchie con annulla e ripeti e la geometria rifatta, cinque pennellate
in un gruppo = un annulla, gli alberi non stanno su una miniera),
`editor.mjs` (in piu': un bosco in una pennellata, 53 alberi a non meno di
90 px fra loro, 8 varianti, un passo solo; la gomma col destro; annullate
gomma e pennellata; una pennellata di selciato = una macchia; la gomma la
toglie; la copertina da un'immagine 1200 x 600 diventa 720 x 480, salvata
nel browser e riaperta dopo aver ricaricato la pagina), test unitari (134),
screenshot (bosco e selciato, la pennellata in corso, la gomma, le
impostazioni con la copertina).

**Prossimo**: la polilinea (fiumi, strade, ponti); "Prova mappa" (lo
scenario dal browser nel gioco, la CPU statica); le mappe dell'editor nella
schermata della schermaglia, con la copertina.

### 9.186 Il pennello ovale, la simmetria degli strumenti, la CPU a scelta

Richieste dell'autore (23 novembre 2026, stessa PR, versione 0.2615):
"Occhio che l'area del bosco deve essere ovale 'assonometrica' e non tonda.
Simmetria deve essere un'impostazione di tool come pennello o piazza
oggetto, non della mappa. Per difficolta' o stile CPU deve anche esserci
l'opzione di lasciare al giocatore la scelta al momento di lancio della
partita."

**Il pennello ovale.** L'area del pennello e' un ovale schiacciato in
verticale come il suolo del gioco: largo quanto la larghezza scelta, alto
0,62 volte (`ISO` di rivers.js, lo stesso dei fiumi e delle strade, ora
esportato). Valgono l'ovale: i punti del bosco (`forestStep` con `ry`), la
gomma degli alberi e delle macchie, la sagoma delle texture (`strokeOutlines`
con gli ovali al posto dei cerchi), i cerchi della pennellata in corso e il
bordo tratteggiato sotto il puntatore. La distanza minima fra gli alberi
resta quella di prima (in pixel della mappa, come i boschi di Tiled e di
tools/12).

**La simmetria degli strumenti.** Non e' piu' un campo della mappa (ne' delle
impostazioni): ogni strumento che la usa ha la sua, spenta di partenza, in
una riga in fondo al suo riquadro, "Simmetria: Spenta, Diagonale,
Orizzontale, Verticale" (`symLayout`; il riquadro passa da 196 a 226 px per
farle posto). "Sposta" la usa per spostare, eliminare, specchiare, cambiare
stile e incollare anche i gemelli; "Inserisci" per mettere anche il gemello;
il pennello per dipingere e cancellare anche al posto specchiato. Il
gemello e' sempre ritrovato dalla posizione (§9.184), quindi la stessa mappa
si puo' lavorare con simmetrie diverse. L'asse (o il centro) si vede quando
lo strumento in uso ha la simmetria accesa. Le mappe salvate prima con
`symmetry` lo perdono alla convalida (campo sconosciuto).

**La CPU a scelta del giocatore.** Difficolta' e stile hanno in piu' "A
scelta del giocatore" (`choice`), che e' anche la scelta di partenza delle
mappe nuove: li sceglie chi lancia la partita, nella schermata della
schermaglia; con una difficolta' o uno stile fissati la schermata li
mostrera' fermi (come quelli della CPU nella partita online, §9.156). Lo
stile ha sempre anche "Statica (non fa nulla)".

Prove: `editor.test.mjs` (in piu': la sagoma di un ovale largo 600 e alto
372; il bosco dentro l'ovale e largo; la riga della simmetria dentro il
riquadro, sotto la tavolozza e i "-" e "+"; i gemelli con la modalita'
passata dallo strumento, nessuno con "none"; le mappe convalidate senza
`symmetry` e con la CPU "a scelta"), `editor.mjs` (in piu': la CPU "a scelta
del giocatore" di partenza, la statica scelta e salvata; la simmetria
diagonale scelta nella riga di "Inserisci" e poi in quella di "Sposta",
senza toccare la mappa), test unitari (134), screenshot (il bosco e la
pietra con la simmetria orizzontale, l'ovale e il gemello sotto il
puntatore; le impostazioni della CPU).

### 9.187 L'editor di mappe: la polilinea, niente titolo, "Salvare le modifiche?"

Richieste dell'autore (23 novembre 2026, stessa PR, versione 0.2615):
"Prosegui. Per ora non implementare i ponti. Togli la scritta 'editor di
mappe' in alto (e' grande ed e' un'informazione ovvia). Se la mappa e'
stata modificata quando l'utente preme il tasto indietro deve comparire un
warning che chiede se salvare le modifiche".

**Niente titolo.** In alto resta solo la riga della mappa (nome, asterisco
se cambiata, misure), dove prima stava il titolo.

**"Salvare le modifiche?"** Con la mappa cambiata dall'ultimo salvataggio,
"Indietro" (o Esc, o aprire un'altra mappa, o "Nuova mappa") chiede
"Salvare le modifiche a questa mappa?" con tre pulsanti: **Salva** (nel
browser se la mappa ci sta gia'; se no il pannello di §9.184 per il nome e
il posto, e dopo il salvataggio si esce; "Annulla" nel pannello resta
nell'editor), **Non salvare** (esce perdendo le modifiche, come il "Continua"
di prima), **Annulla** (resta). La conferma ora ha un numero qualsiasi di
pulsanti (`confirmLayout(W, H, n)`; anche quella per eliminare una mappa).

**La polilinea** (il secondo strumento). Fiumi e strade come le polilinee di
Tiled (§9.97), disegnati dal motore del gioco con le loro rive, l'acqua, i
sassolini; i ponti no, per ora (decisione dell'autore). Nel riquadro tre
schede, **Fiume**, **Strada** (la marcata, `strada1`) e **Sentiero** (la
secondaria, `strada2`), la **larghezza** e la **larghezza finale** (quella
all'ultimo punto: la linea si allarga o si stringe piano, `widthEnd`;
"Uguale" se e' la stessa) fra 40 e 440 px, di partenza 150 per i fiumi e 110
per le strade (tools/tiledkit.py), e la riga della simmetria (§9.186).
- *Disegnare*: un clic fuori dalle linee comincia una linea nuova, ogni clic
  aggiunge un punto (anche nel margine fuori dalla mappa: i fiumi entrano
  dal bordo); il destro, Invio o un doppio clic la finiscono; Backspace
  toglie l'ultimo punto, Esc la lascia. Durante il disegno una fascia larga
  quanto la linea col tratto fino al puntatore.
- *Cambiare*: un clic su una linea la sceglie (i suoi punti e il tracciato
  in bianco; i punti delle altre linee piccoli); i punti si trascinano (la
  modifica vera lasciando il tasto, un solo annulla); un doppio clic su un
  tratto della linea scelta aggiunge un punto; Backspace toglie il punto
  scelto (se ne restano almeno due), Canc toglie la linea; i "-" e "+"
  cambiano larghezza e larghezza finale della linea scelta (senza linea
  scelta, quelle delle linee nuove).
- *Simmetria*: la linea finita ha anche la gemella specchiata; spostare,
  aggiungere e togliere punti, cambiare larghezza e togliere la linea
  valgono anche per la gemella, ritrovata dai punti (EditScene `twinLine`:
  gli stessi punti specchiati, nello stesso ordine, entro 2 px).
- Le linee sono forme della mappa (`rivers`, `roads`) con annulla e ripeti
  (§9.185, EditScene `modifyFeatures` in piu'); cambiate, il motore rifa' la
  geometria, l'acqua (e i suoi ostacoli) e il suolo.
- I comandi in alto a destra nel riquadro cambiano con quello che si sta
  facendo; se non stanno accanto al titolo si rimpiccioliscono (prima, con
  una linea scelta, coprivano il titolo); le etichette dei "-" e "+" hanno
  piu' spazio ("Larghezza finale" toccava il "-").

Testi nuovi nelle sei lingue.

Prove: `editor.test.mjs` (in piu': il riquadro della polilinea, la conferma a
tre pulsanti in fila nella finestra, la distanza da un tratto, il tipo di
una linea; le linee in una scena vera: il motore ha i fiumi e le strade
aggiunti, la gemella ritrovata con la diagonale e non con l'orizzontale,
punti e larghezza finale cambiati e annullati, tolte), `editor.mjs` (in piu':
"Salvare le modifiche?" coi tre pulsanti; Annulla resta; Salva col pannello,
poi il menu; un fiume di tre punti finito col destro, piu' largo, un punto
trascinato e annullato, un punto nuovo col doppio clic tolto con Backspace;
un sentiero finito con Invio; con la simmetria diagonale una strada e la
gemella, tolte insieme con Canc; Non salvare: il menu), test unitari (136),
screenshot (una strada in disegno sopra un fiume, il fiume scelto coi suoi
punti, l'avviso coi tre pulsanti).

**Prossimo**: "Prova mappa" (la mappa dell'editor giocata nel gioco: lo
scenario dal browser invece che da `assets/rooms/`, la CPU statica); le
mappe dell'editor nella schermata della schermaglia (con la copertina, la
CPU a scelta o fissa).

### 9.188 L'editor di mappe: i file collegati e "Prova mappa"

Richiesta dell'autore (23 novembre 2026, stessa PR, versione 0.2615):
"Prosegui, considera pero' che i salvataggi sarebbe meglio gestirli su
file come ci eravamo detti nelle scorse sessioni oltre che all'interno dei
file del browser". Nelle sessioni passate: le mappe si scambiano su file
(R6; `.dvmap`, §9.134), come le partite. Fin qui il file era un ripiego:
Ctrl+S e il "Salva" dell'uscita scrivevano solo nel browser, e "Salva su
file" scaricava ogni volta una copia nuova.

**I file collegati** (mapstore.js). Dove il browser lo permette (File System
Access: Chrome, Edge) "Su file" apre la finestra **"Salva con nome"** del
sistema (nome e cartella a scelta) e "Apri un file..." quella per aprire;
la mappa resta **collegata al suo file** (il FileSystemFileHandle), che i
salvataggi dopo riscrivono, chiedendo il permesso se serve. Il nome del
file si vede in alto, accanto alla mappa. Dove non si puo' (Firefox,
Safari, la pagina dentro l'iframe di un portale, dove il browser rifiuta la
finestra) si scarica come prima e si apre col solito `<input type=file>`:
il file non resta collegato.
- *Il pannello "Salva mappa"*: il nome, **Dove**: "Nel browser" e "Su file"
  (tutti e due accesi di partenza, si spengono con un clic; col file
  collegato "Su file: <nome>"), Salva e Annulla. Il file prima: se "Salva
  con nome" viene annullata non si salva niente e il pannello resta.
- *Ctrl+S e il "Salva" dell'uscita*: riscrivono dove la mappa e' collegata,
  il suo posto nel browser e il suo file, senza pannello; il pannello solo
  se non e' ancora collegata a niente.
- *Trovato con la prova*: aprendo il pannello con Ctrl+S, il rilascio di
  Ctrl e S avveniva dentro il pannello, che ferma i tasti perche' non
  arrivino all'editor (netui.js): l'editor li credeva tenuti e il Ctrl+S
  dopo non scattava piu'. Chiudendo un pannello ora i tasti si lasciano
  tutti (input.js `releaseAll`, come quando la finestra perde il fuoco).

**"Prova mappa"** (il triangolo). Con due posizioni di partenza (se no un
avviso: "Inserisci, Partenze") la mappa si gioca come una schermaglia:
- l'editor mette nel browser (IndexedDB, mapstore.js `putService`) la sua
  sessione (la mappa com'e', il posto nel browser, il file collegato dove
  il browser lo conserva, se era cambiata, la vista, lo strumento) e la
  room di prova (mapfile.js `testRoom`: come le room di tools/07, col
  manager se manca, senza la copertina) con le opzioni della schermaglia:
  quelle che il giocatore ha scelto l'ultima volta, con difficolta' e stile
  della CPU della mappa se sono fissati;
- il gioco apre la room `custom` (app.js): la room dal browser invece che da
  `assets/rooms/`, una schermaglia per skirmish.js (`isSkirmish`), ma non
  online ne' fra i salvataggi; niente salvataggio automatico; nel menu di
  pausa niente "Salva e carica" e **"Torna all'editor"** al posto di "Torna
  al menu" (pause.js `testMode`); anche la vittoria e la sconfitta tornano
  all'editor; "Ricomincia livello" rigioca la prova;
- tornando (`?room=editor&resume=1`) l'editor riapre la sessione: la mappa
  com'era (cambiata se lo era, col suo posto e il suo file), la vista e lo
  strumento di prima. Annulla e ripeti ripartono da zero.
- **La CPU statica**: con lo stile "statica" la regia della CPU non nasce
  (skirmish.js, e levels.js che la faceva nascere dove c'e' un centro
  nemico): la CPU ha il suo centro e non fa nulla. "Static" ha un nome fra
  gli stili (gli obiettivi lo scrivono) ma non e' fra le scelte della
  schermata della schermaglia.

Il riquadro in basso passa da 226 a 246 px: in "Sposta" la riga della
simmetria toccava quella dei comandi della vista.

Testi nuovi nelle sei lingue (dove, nel browser, su file, "Torna
all'editor", l'avviso delle partenze).

Prove: `editor.test.mjs` (in piu': la room di prova col manager una volta
sola e senza copertina, `custom` e' una schermaglia, la statica ha un nome
e non e' fra le scelte; la riga della simmetria sopra quella dei comandi),
`editor.mjs` (in piu', con le finestre di File System Access finte, perche'
quelle vere sono del sistema: il pannello con tutti e due i posti accesi;
"Salva con nome" rifiutata come nell'iframe di un portale: il download, non
collegato; "Salva con nome" riuscita: collegato, Ctrl+S riscrive il file
(una miniera in piu' nel file) senza pannello; annullata: il pannello resta
e non si scrive; aperto dalla finestra "Apri": collegato; aperto da `<input
type=file>`: non collegato; "Prova mappa" senza due partenze no; Padania
con la CPU statica: la partita `custom` col centro nemico, senza regia, 3
lavoratori, la pausa in modo prova; "Torna all'editor": la mappa con la
miniera in piu', cambiata, la CPU statica), test unitari (137), `soak.mjs`
(menu, sk_padus, lvl04, lvl05), `saves.mjs` (sk_padus, lvl02),
`economy.mjs`, `truce.mjs`; screenshot (il pannello "Salva mappa", la
partita di prova e la sua pausa).

**Prossimo**: le mappe dell'editor nella schermata della schermaglia (con la
copertina, la CPU a scelta o fissa) e poi nella partita online.

### 9.189 La CPU statica reagisce: le manca solo l'economia

Richiesta dell'autore (23 novembre 2026, stessa PR): "Chiaramente non l'ho
specificato ma la CPU statica deve comunque reagire agli stimoli come
attaccare nemici molto vicini, semplicemente manca economia e parte
gestionale".

Prima (§9.188) con lo stile "statica" la regia della CPU (`enemy_eco`) non
nasceva: la CPU aveva il suo centro e basta, senza i 3 lavoratori di
partenza (li fa nascere la regia) e senza la difesa della base; e senza
regia le caserme nemiche, se una mappa ne avesse, avrebbero fatto soldati da
sole (enemybuild.js, la produzione dell'originale).

Ora la regia nasce sempre, anche per la CPU statica, **passiva**
(skirmish.js `skirmishEco`: `passive` con lo stile `static`; ECO.default
`passive: false`):
- come le altre: le risorse e i 3 lavoratori di partenza attorno al centro;
- le reazioni restano: il centro tira frecce all'unita' del giocatore piu'
  vicina entro 600 px (enemybuild.js, del centro, non della regia); il
  lavoratore colpito scappa verso il centro (economy.js `flee`, del
  lavoratore); i soldati nemici inseguono chi arriva entro 400 px e
  accorrono all'edificio attaccato (enemies.js, delle unita'); la difesa
  della base della regia (§9.50: i soldati della regia in attesa contro chi
  entra entro `defendR` da un edificio) e' ora una funzione a parte
  (economy.js `defend`), che la regia passiva fa e basta;
- non c'e' l'economia ne' la gestione: i lavoratori non vanno a lavorare,
  niente lavoratori e soldati nuovi, edifici, depositi, riparazioni,
  ricostruzioni, ondate.

levels.js non ha piu' l'eccezione per la statica (la regia c'e' gia').
Oggi nelle mappe dell'editor la CPU ha solo il centro e i lavoratori: i
soldati (della regia o della mappa) reagiranno come quelli delle altre CPU
quando si potranno mettere unita' con "Inserisci".

Prove: `editor.test.mjs` (in piu': la statica ha la regia passiva, coi
lavoratori e le risorse di partenza delle altre; 138 test), `editor.mjs`
(la partita di prova con la statica: la regia c'e', dopo 1800 passi 3
lavoratori senza lavoro, nessuna spesa, nessun cantiere, nessuna
produzione, nessun soldato; un guerriero alleato a 300 px dal centro e'
colpito dalle frecce, il lavoratore colpito scappa), `economy.mjs`,
`truce.mjs`, `enemydefense.mjs` (la difesa e le ondate della regia normale
come prima), `soak.mjs` (menu, match, lvl01, lvl02, sk_padus, lvl04,
lvl05), `saves.mjs`.

**Prossimo**: le mappe dell'editor nella schermata della schermaglia (con la
copertina, la CPU a scelta o fissa) e poi nella partita online.

### 9.190 Le mappe dell'editor nella schermaglia

Richiesta dell'autore (23 novembre 2026, stessa PR): "intanto terminiamo la
parte offline, poi su come implementare la parte online in modo furbo
discutiamo insieme". La parte offline: le mappe dell'editor nella schermata
della schermaglia ("si, se caricate", §9.182), con la copertina e la CPU a
scelta o fissa (§9.184-§9.186).

**La schermata** (menu.js, skuser.js):
- dopo le cinque mappe del gioco, con le stesse frecce, scorrono le mappe
  dell'editor salvate nel browser (lette all'apertura della schermata; la
  mappa mostrata si legge e si convalida la prima volta, come nell'editor:
  mapfile.js validateMap) e quelle aperte con **"Apri un file…"** (sotto il
  riquadro della mappa, a sinistra di "Inizia"): una `.dvmap` scelta col
  sistema, che vale per quella volta (non entra fra le mappe del browser);
- la foto e' la **copertina** della mappa (§9.185) o, senza, un **disegno
  della mappa** (skuser.js `mapPreview`, 720 x 480 come le foto: vista
  dall'alto coi colori medi degli sfondi, macchie, fiumi, strade, montagne,
  alberi, risorse, citta' e le due partenze), messo in una texture del gioco
  (`registerImage`: uno sprite con un suo gruppo d'atlas di una pagina; i
  gruppi aggiunti non si ricaricano dopo la perdita del contesto WebGL);
- il nome e la descrizione sono quelli dell'autore della mappa (non
  tradotti); la descrizione si taglia a parole, coi puntini, all'altezza di
  quelle delle mappe del gioco (le mappe dell'editor arrivano a 600
  caratteri); il nome, se lungo, sulla riga fra le frecce;
- **la CPU**: difficolta' e stile fissati dalla mappa si vedono col valore
  della mappa, in grigio e col lucchetto (`ico_lock`), e non si cambiano; "a
  scelta del giocatore" restano liberi. La statica ha la sua icona: il letto
  (`ico_idle`). Le scelte del giocatore restano le sue (la mappa non le
  sovrascrive);
- una mappa senza due partenze (o che non si legge) si vede col motivo al
  posto della descrizione, e "Inizia" e' spento;
- si ricorda l'ultima mappa dell'editor scelta (localStorage
  `535.skirmish.user`): riaprendo la schermata si riparte da quella;
- nella partita online ("Create game") niente mappe dell'editor ne' "Apri
  un file": e' la parte da discutere.

**La partita** (app.js): "Inizia" mette la room (mapfile.js `testRoom`) e le
opzioni (`skForMap`: quelle del giocatore con la CPU della mappa, la stessa
funzione di "Prova mappa") nella voce di servizio `__play__` e apre
`?room=custom&play=1`. E' la room `custom` di "Prova mappa" (§9.188), ma da
partita vera: la pausa di sempre (con "Salva e carica"), il salvataggio
automatico, la vittoria e la sconfitta tornano al menu, "Ricomincia" rigioca
la stessa mappa.

**I salvataggi**: la room non e' fra quelle del gioco, quindi la partita si
salva con la mappa dentro (`custom`: room, opzioni, nome; poche decine di
KB, compresse). Lo slot e' `custom` (uno, come per ogni room), nell'elenco
dei salvataggi col nome della mappa ("Schermaglia: <nome>"; anche le
schermaglie del gioco ora col nome della mappa, prima "sk_padus").
Caricando (`?room=custom&load=slot` o da file) la room viene dal
salvataggio, torna in `__play__` (per "Ricomincia") e l'indirizzo diventa
`&play=1`. Trovato provando: skirmishPrepare cambia le istanze della room
(il centro della CPU diventa `enemy_centro`) e la room cambiata finiva nel
salvataggio, e "Ricomincia" dopo un caricamento partiva senza CPU; ora il
gioco lavora su una copia.

"Static" nelle lingue: "Statica (senza economia)" (era "non fa nulla",
§9.189). Testo nuovo: "Mappa senza nome".

Prove: `editor.test.mjs` (in piu': la CPU della mappa fissata o a scelta,
le etichette degli slot; 139 test), `skcustom.mjs` (nuova, nel CI: tre
mappe nel browser, l'elenco dopo le cinque; A col disegno, difficolta' e
stile bloccati; B con la copertina e le opzioni libere; C con una partenza,
"Inizia" spento; la partita su A con la CPU della mappa, non in prova;
salvata col nome, caricata, "Ricomincia", il menu; riaperta su A; da file;
online senza mappe dell'editor), `editor.mjs`, `saves.mjs`, `ui.mjs`,
`netfake.mjs`, `pvp.mjs` (una volta instabile, poi a posto: anche senza
queste modifiche); screenshot (la schermata con A, B e C, la partita).

**Prossimo**: con l'autore, come fare la partita online sulle mappe
dell'editor.

### 9.191 Gli schieramenti: le partenze rossa e blu

Risposta dell'autore alla proposta per la partita online (23 novembre 2026,
stessa PR): "Ovviamente per essere giocata online la mappa deve avere almeno
un elemento del giocatore rosso e uno del giocatore blu. [...] quando
nell'editor inserisco un oggetto ad esempio dello schieramento rosso e ho la
simmetria attiva, dall'altro lato il suo simmetrico viene creato come
appartenente allo schieramento blu".

Non era cosi': le partenze (il centro) erano neutre e chi prendeva quale lo
decideva l'avvio a caso, come nelle mappe del gioco (skirmish.js
skirmishPrepare, l'opzione nascosta `start`); "Inserisci" non ha ancora
unita' ne' edifici delle due parti. Ora:
- **le partenze hanno uno schieramento** (`side: "red" | "blue"` nella voce
  della mappa, mapfile.js): in "Inserisci", scheda "Partenze", due caselle,
  la rossa e la blu, col pallino del loro colore; la blu si vede col centro
  blu (lo sprite di `enemy_centro`, cc_b) nella tavolozza, nella mappa e nel
  fantasma;
- **la gemella di una voce di uno schieramento e' dell'altro** (editmap.js
  twinAt): con la simmetria la partenza rossa mette la blu dall'altra parte,
  e cosi' con "Incolla" e con S;
- **una partenza per parte**: un'altra partenza della stessa parte non si
  mette ("Ogni schieramento ha una sola partenza."), anche incollando o
  cambiando parte con S su una partenza scelta (S cambia lo schieramento);
- **da giocare** una mappa ha una partenza rossa e una blu (mapfile.js
  `sidesOk`): "Prova mappa", la schermata della schermaglia ("Una mappa
  della schermaglia ha bisogno di una partenza rossa e di una blu");
- **all'avvio il rosso e' il giocatore** (online sara' chi crea la
  partita), **il blu la CPU** (online chi entra): `skForMap` mette nelle
  opzioni `start` la lettera della partenza rossa come la conta
  skirmishPrepare (A: x + y piu' piccolo), al posto del caso. Le mappe del
  gioco restano a caso;
- le mappe senza schieramenti (i modelli, le mappe salvate prima) li
  ricevono nella convalida (`assignSides`): la partenza A rossa, l'altra
  blu; con una gia' data, l'altra l'opposta. La convalida accetta `side`
  solo sulle partenze e solo rosso o blu;
- il disegno delle mappe senza copertina (§9.190) mette le partenze del loro
  colore.

Lo schieramento e' un campo della voce, pensato per le unita' e gli edifici
delle due parti in "Inserisci" (il disegno dell'autore, §9.180: "unita',
risorse, edifici"): il gioco ha gia' le corrispondenze fra gli oggetti del
giocatore, della CPU e del secondo giocatore (multiplayer.js ENEMY_EQ e i
gemelli p2_*). Da decidere con l'autore.

Testi: "Ogni schieramento ha una sola partenza." e la richiesta della
partenza rossa e blu, al posto di quelli delle "due partenze".

Prove: `editor.test.mjs` (in piu': gli schieramenti assegnati, la partenza
del giocatore per skirmishPrepare, la convalida, la tavolozza con due
caselle, S, la gemella dell'altra parte; 140 test), `editor.mjs` (la
partenza rossa con la simmetria e la gemella blu col suo sprite; un'altra
rossa no), `skcustom.mjs` (la mappa A con la partenza rossa in basso a
destra: il giocatore li', la CPU in alto a sinistra); screenshot (la
tavolozza e le due partenze).

### 9.192 La partita online sulle mappe dell'editor

Decisioni dell'autore sulla proposta di §9.190 (23 novembre 2026, stessa
PR): "la tua proposta mi sembra ottima, anche ci volessero 10-20 secondi per
caricare la mappa mi sembra un'attesa sensata"; 1) la mappa ricevuta entra
fra le mappe di chi entra, di partenza; 2) con la copertina; 3) nel
pannello "Entra" il nome della mappa e l'avviso che verra' scaricata. In
piu': da giocare online una mappa ha un elemento del rosso e uno del blu
(§9.191: una partenza per parte).

**Perche' non nel codice d'invito**: una mappa compressa sono 6-18 KB
(misurate le cinque del gioco: 5,9-17,6 KB con gzip), 8-24 mila caratteri
in base64: troppi da incollare in una chat (Discord si ferma a 2000). Il
codice porta solo il nome e l'impronta della mappa; la mappa passa sul
canale della partita, dopo i codici.

**L'impronta** (mapfile.js `mapHash`): due FNV-1a a 32 bit del JSON della
room di testRoom, 16 cifre esadecimali. Conta solo cio' che fa la partita
(nome, descrizione, copertina, CPU no). Una mappa convalidata di nuovo ha la
stessa impronta.

**Chi crea** ("Multiplayer", "Create game"): nella schermata ora ci sono
anche le mappe dell'editor e "Apri un file…" (difficolta' e stile della CPU
restano in grigio). "Create game" su una mappa dell'editor (netgame.js
`hostGame`): la mappa (con la copertina), la sua room e l'impronta nel
browser (voce di servizio `__net__`), nome e impronta nella sessione; la
pagina della partita (`?room=custom&net=host`) prende la room da li', e il
codice d'invito porta `custom: { name, hash }`.

**Chi entra** ("Join game"): incollato il codice, il pannello cerca fra le
mappe del browser quella con la stessa impronta (`findMap`) e dice la mappa
col suo nome; se non c'e': "Non hai questa mappa: verra' scaricata quando
vi collegate e restera' fra le tue mappe." Con "Entra":
- **se la mappa ce l'ha**: va in `__net__` e la pagina della partita si
  costruisce subito, come per le mappe del gioco;
- **se no**: la pagina mostra subito la sala d'attesa (col codice di
  risposta), senza partita: la sala d'attesa e il canale nascono prima
  (netgame.js `netEarly`; la sala d'attesa e' ora una funzione a parte,
  `lobby`, che le due strade usano uguale). Aperto il canale chiede la mappa
  (`{t: "mapreq"}`) e chi crea la manda a pezzi (`{t: "map0", n}` poi `{t:
  "mapc", k, d}`: il JSON compresso con gzip in base64url, 16000 caratteri a
  pezzo, al piu' 400 pezzi, aspettando che il canale si svuoti), con
  l'avanzamento nelle due sale d'attesa ("Invio della mappa: N%", "Arriva la
  mappa: N%"). Chi entra la convalida (come ogni mappa che arriva da fuori,
  validateMap), controlla l'impronta (una mappa diversa: "Non e' stato
  possibile ricevere la mappa di questa partita."), **la salva fra le sue
  mappe** con la copertina ("La mappa e' stata salvata fra le tue mappe.") e
  costruisce la partita.

**L'avvio**: con una mappa dell'editor il lockstep (i saluti, la misura del
ritardo) parte solo quando chi entra ha la partita pronta: chi entra manda
`{t: "mapok"}` (subito all'apertura del canale se aveva la mappa, dopo
averla ricevuta e costruita la partita se no), chi crea aspetta quello per
cominciare (startNet). Cosi' il tempo di caricamento non entra nella misura
del ritardo dei comandi. Il rosso (chi crea) e' alla partenza rossa, il blu
alla blu (§9.191; `start` dalla mappa, uguale nelle due pagine).

Le mappe del gioco online vanno come prima (nessun messaggio in piu'). Le
prove col canale finto (`?net=fake`) restano sulle mappe del gioco.

Testi nuovi nelle sei lingue: l'avviso del pannello "Entra", "Collegati:
arriva la mappa...", "Arriva la mappa: {p}%", "Invio della mappa: {p}%",
"Mappa inviata: l'altro giocatore la sta caricando...", "Mappa arrivata:
si carica la partita...", "Mappa arrivata: la partita comincia.", "La mappa
e' stata salvata fra le tue mappe.", "Non e' stato possibile ricevere la
mappa di questa partita.".

Prove: `editor.test.mjs` (in piu': l'impronta, uguale senza nome,
descrizione, copertina e CPU, diversa con un'istanza spostata o un fiume,
uguale dopo una seconda convalida; 141 test), `netmap.mjs` (nuova, nel CI:
WebRTC vero fra due pagine con browser diversi; A crea su una sua mappa
dell'editor, B incolla il codice e il pannello dice nome e download; la
pagina di B mostra la sala d'attesa senza partita; collegati, B riceve la
mappa e la tiene con la copertina e gli schieramenti, le due partite
uguali (istanze, il rosso a 4800,4800), le impronte confrontate uguali;
poi una seconda partita: B ha la mappa, niente avviso di download, partita
pronta prima di collegarsi, la mappa non salvata due volte; ~35 s per la
prima partita sotto swiftshader), `skcustom.mjs` (online ora con le mappe
dell'editor e "Apri un file"), `rtc.mjs`, `rtcfail.mjs`, `netfake.mjs`,
`pvp.mjs`, `editor.mjs`; screenshot (il pannello "Entra" con l'avviso, la
sala d'attesa di chi entra prima della partita).

### 9.193 Unita' ed edifici delle due parti in "Inserisci"

Richiesta dell'autore (23 novembre 2026, stessa PR): "Si', aggiungi unita'
ed edifici degli schieramenti in Inserisci" (proposta in §9.191).

- **Due schede nuove** in "Inserisci", dopo le partenze: **Unita'**
  (lavoratore, guerriero, picchiere, arciere, cavaliere, ariete, catapulta)
  ed **Edifici** (casa, caserma, stalla, torre, magazzino, mulino, campo,
  monastero, fortezza). Come le partenze (§9.191), **una casella rossa e una
  blu per oggetto**, una accanto all'altra, col pallino del colore; il blu
  si vede con lo sprite della CPU (il lavoratore: b_ow11, come lo disegna
  economy.js). Le schede sono otto: la scritta di una scheda che non ci sta
  si rimpicciolisce.
- **S** con una casella scelta passa a quella dell'altra parte; in alto
  "Schieramento rosso (S: blu)". Su unita' ed edifici gia' messi ("Sposta")
  S cambia lo schieramento, come per le partenze.
- **La simmetria**: la gemella e' dell'altra parte (la regola di §9.191,
  generale per ogni voce con lo schieramento). Nessun limite di numero (solo
  le partenze sono una per parte).
- **Nella mappa** le voci hanno i nomi del giocatore (gli oggetti alleati) e
  `side`; senza schieramento (una mappa scritta a mano) sono del rosso.
- **All'avvio** (mapfile.js testRoom): il rosso resta l'oggetto del
  giocatore; il blu diventa **l'oggetto della CPU** (BLUE_OF: casa ->
  enemy_house, barn -> enemy_mulino, ally_warrior -> enemy_warrior...; il
  contrario di multiplayer.js ENEMY_EQ) e, **online, quello del secondo
  giocatore** (app.js, dopo skirmishPrepare: la tabella m1, enemy_warrior ->
  p2_warrior...; uguale nelle due pagine, l'impronta della mappa non cambia).
- Contro la CPU gli oggetti blu della mappa sono come quelli delle mappe
  della campagna: i soldati sono di guardia (inseguono chi arriva a 400 px,
  accorrono all'edificio attaccato, enemies.js), non partono con le ondate
  della regia (sono suoi solo quelli che produce); caserme e stalle blu
  producono con la regia (con la CPU statica, §9.189, no). Se la mappa ha
  lavoratori blu la regia non aggiunge i 3 di partenza (economy.js, come nei
  livelli); il giocatore ha sempre i suoi 3.

Mura e porte restano fuori: si mettono a pezzi allineati e hanno la loro
logica (porte, collegamenti); da fare con l'autore.

Testi: "Unita'" (gli "Edifici" c'erano gia'), "Schieramento rosso (S: blu)",
"Schieramento blu (S: rosso)".

Prove: `editor.test.mjs` (in piu': gli oggetti delle due parti esistono,
la room col blu della CPU, lo schieramento di partenza rosso, due caselle
per unita', la gemella dell'altra parte; 142 test), `editor.mjs` (il
guerriero rosso con la simmetria e la gemella blu, bww11; S passa alla
casella blu; le schede per nome), `skcustom.mjs` (un guerriero per parte e
una caserma blu: nella partita il guerriero del giocatore, quello della CPU
e la caserma della CPU), `netmap.mjs` (online: la caserma rossa del rosso,
il guerriero blu e' p2_warrior, nessun oggetto della CPU, impronte
uguali); screenshot (la scheda Edifici).

### 9.194 Mura e porte in "Inserisci", la gomma ad area

Richiesta dell'autore (23 novembre 2026, stessa PR): "c'e' lo strumento
mura, con tasto cambio stile per impostarlo sul suo ruotato di 90 gradi e
viceversa. Una volta piazzato il primo blocco, solo se lo strumento piazza
oggetto e' attivo, compaiono le due "+" ai lati per aggiungere pezzi, allo
stesso modo della schermata di gioco. Inoltre sul pezzo di muro, anche li'
solo con lo strumento aggiungi oggetto attivo, compare un tasto per
convertire il muro inserito in porta e viceversa. [...] aggiungiamo anche
uno strumento gomma ad area tipo il pennello per cancellare oggetti in
blocco".

**Le mura** (Inserisci, scheda Edifici, in fondo):
- il muro rosso e il blu (come unita' ed edifici, §9.193), ognuno coi due
  versi: **S** passa dall'orizzontale (mura_ori) al verticale (mura_vert) e
  viceversa ("Schieramento rosso (S: orizzontale / verticale)"); il blu col
  muro della CPU (le bandierine azzurre);
- messo un tratto, **con "Inserisci" attivo** compaiono i **"+"** alle sue
  estremita' libere, col simbolo del gioco (ico_muraplus), a misura di
  schermo (da lontano, oltre 4 px di mappa per pixel, niente pulsanti):
  dove sono quelli del gioco (walls.js KIND.plus: l'orizzontale a -219 e
  +207, il verticale all'origine e 300 px sopra); i "+" di due tratti che si
  toccano (di fila a 2-3 px, ad angolo o in verticale a 54) non si vedono
  (editmap.js `freePluses`);
- **un clic sul "+"** e il tratto nuovo segue il puntatore come nel gioco:
  dritto, o girato di 90 gradi in su o in giu' (o a destra e a sinistra da
  un verticale), con gli scostamenti dei placer del gioco (walls.js
  SECTORS: -208, +217/+218, 246, 54; editmap.js `wallStep`, il verso piu'
  vicino entro 60 gradi; indietro niente); un clic lo mette, il destro o
  Esc lasciano. Il tratto nuovo e' dello schieramento di quello da cui
  parte; con la simmetria anche il gemello;
- **su ogni tratto**, sempre solo con "Inserisci", il **pulsante della
  porta** (ico_gate; su una porta ico_mura): muro -> porta e viceversa,
  nello stesso punto (porta_ori, porta_vert; con la simmetria anche il
  gemello; si annulla);
- nella partita come le altre voci dello schieramento: il rosso del
  giocatore, il blu della CPU (enemy_mura_*, enemy_porta_*) o, online, del
  secondo giocatore (p2_mura_*, p2_porta_*).

**La gomma ad area**: un quinto strumento nella colonna (tasto 5), dopo
"Inserisci" (per non cambiare i tasti degli altri): l'ovale assonometrico
del pennello (§9.186) con la sua larghezza ("-" e "+" nel riquadro, o
Maiusc + rotella); col sinistro tenuto toglie **tutti gli oggetti** con
l'origine nell'ovale (alberi, montagne, edifici, unita', risorse,
prati...; non fiumi, strade e macchie, che hanno la polilinea e il
pennello); con la simmetria anche nell'ovale gemello; una passata e' un
passo solo da annullare. L'ovale e' rosso.

Testi nuovi nelle sei lingue: la gomma (nome, descrizione, comandi), lo
schieramento delle mura con S, i comandi del prolungamento.

Prove: `editor.test.mjs` (in piu': i "+" e i tratti dritti e ad angolo con
le misure del gioco, indietro niente, i "+" liberi di fila e ad angolo,
muro <-> porta, le caselle del muro coi due versi, le porte ammesse e del
blu della CPU; 143 test), `editor.mjs` (il muro rosso, il "+" di destra e
il tratto dritto a 424 px, il pulsante della porta, la gomma col tasto 5
che toglie i due tratti in una passata, annulla che li rimette),
`skcustom.mjs` (il muro rosso del giocatore e la porta blu della CPU nella
partita), `netmap.mjs` (online il muro blu e' p2_mura_vert, la porta rossa
del rosso, impronte uguali); screenshot (il prolungamento, l'angolo, la
porta).

### 9.195 Rifiniture dell'editor: "Natura", l'interruttore rosso / blu, i campi, i comandi nella colonna

Richieste dell'autore (23 novembre 2026, stessa PR): "rinomina "prati e
fiori" in "natura" o simili. Metti uno switch in edifici e unita' per
decidere se filtrare per giocatore rosso o blu cosi' alleggeriamo un po' la
vista. L'anteprima dei campi coltivati deve essere come in game (non il
vecchio sprite che vedo ma il campo con sopra le particelle). Per annulla
oltre ctrl + z mettiamo anche un tasto fisico [...] sempre col simbolo
della freccia per tornare indietro, idem per taglia, copia, incolla.
Magari come secondo set di strumenti tra il primo e il terzo".

- **"Natura"** al posto di "Prati e fiori" (la scheda di prati, fiori,
  erba e macchie; nelle sei lingue).
- **L'interruttore rosso / blu** in Unita' ed Edifici: due cerchi a sinistra
  delle caselle (il rosso sopra), la parte scelta piena; si vedono solo le
  caselle di quella parte (di partenza la rossa). Cambiando parte la casella
  scelta passa alla stessa dell'altra; anche S con una casella di uno
  schieramento sposta l'interruttore. Le partenze (due caselle) restano
  senza.
- **Il campo come nel gioco**: la terra arata col grano (campo_grano) e
  sopra le file di spighe a particelle (effects.js campoCreate, la stessa
  funzione del gioco, registrata nel mondo dell'editor), per tutte e due le
  parti (il campo della CPU nel gioco e' uguale); nella casella della
  tavolozza e nel fantasma le file di spighe disegnate (gialle, senza
  caso). Trascinando un campo (o una macchia di prato) con "Sposta" le
  particelle ora seguono la voce (prima restavano al loro posto fino al
  rilascio).
- **I comandi nella colonna**, un secondo gruppo fra gli strumenti e le
  azioni (tre gruppi, due lineette): **Annulla** (la freccia che torna
  indietro), **Taglia** (le forbici), **Copia** (due fogli), **Incolla** (la
  cartellina), con Ctrl+Z, Ctrl+X (nuovo), Ctrl+C, Ctrl+V nel suggerimento.
  Spenti quando non c'e' niente da fare (niente da annullare, nessuna
  scelta, niente da incollare). Taglia come Canc (con le gemelle, se c'e'
  la simmetria). Incolla dal pulsante mette le voci al centro della vista,
  scelte, e passa a "Sposta": si trascinano dove servono (Ctrl+V incolla
  sotto il puntatore). Ripeti resta Ctrl+Y. Con quattordici pulsanti la
  colonna si rimpicciolisce prima sugli schermi bassi (a 900 px ~0,85).

Testi nuovi: "Natura", i quattro suggerimenti dei comandi.

Prove: `editor.test.mjs` (in piu': i tre gruppi della colonna, la tavolozza
filtrata per parte con l'interruttore, "Natura"; 144 test), `editor.mjs`
(solo le caselle rosse, l'interruttore che mostra le blu, S che lo sposta;
Copia e Incolla dai pulsanti, Annulla, Taglia, Annulla; il campo con
campo_grano e 13 file di spighe), `skcustom.mjs`; screenshot (la colonna,
l'interruttore, i campi).

### 9.196 Le partenze come bandierine, la scheda "Regia", la colonna che scorre

Richieste dell'autore (23 novembre 2026, stessa PR): "metti le partenze
usando gli sprites delle bandierine, fai uno scroller per i pulsanti per
gli schermi piccoli, chiama la loro scheda "regia" o una parola simile
breve, ci servira' in futuro se decidiamo di mettere anche scenari piu'
complessi".

- **Le partenze sono bandierine**: nell'editor (scena, casella, fantasma) la
  partenza rossa e' la bandierina rossa del punto di raccolta del gioco
  (rflag) e la blu la blu (bflag), grandi il doppio (FLAG_SCALE) perche' si
  vedano da lontano; nella mappa restano il centro (`centro` con `side`): la
  bandierina segna dove nascera' il centro di quella parte. La gemella
  simmetrica si calcola sempre sull'ingombro del centro (la maschera), come
  prima.
- **La scheda "Regia"** (in inglese "Setup") al posto di "Partenze": per ora
  le due bandierine; piu' avanti cio' che servira' agli scenari. Anche
  l'avviso "Una mappa della schermaglia ha bisogno di una partenza rossa e
  di una blu (Inserisci, Regia)".
- **La colonna che scorre**: la colonna non si rimpicciolisce piu' sotto
  0,85 (prima fino a 0,5); quando non ci sta (sotto ~880 px di altezza)
  scorre, con una freccia su in cima e una giu' in fondo (spente quando non
  c'e' altro), e con la rotella sopra la colonna (uno scatto: un pulsante).
  I pulsanti fuori dalla parte che si vede non si disegnano e non si
  toccano. A 1280 x 720 si vedono dieci pulsanti su quattordici.

Testi: "Regia" (Setup) nelle sei lingue (Dirección, Direção, Regie,
Régie), l'avviso delle partenze.

Prove: `editor.test.mjs` (in piu': la colonna senza scorrere sugli schermi
grandi; a 1024 x 600 le frecce, il primo pulsante in vista e l'ultimo no,
in fondo il contrario, i pulsanti nascosti non si toccano; "Regia"; 145
test), `editor.mjs` (le partenze rflag e bflag; a 1024 x 600 la colonna
scorre con la rotella e torna su con la freccia); screenshot (1280 x 720:
la colonna con le frecce, la scheda, le due bandierine).

### 9.197 La freccina nell'editor; cosa resta da fare

Richiesta dell'autore (23 novembre 2026, stessa PR): "Nel prossimo prompt
ti passo delle icone in PNG da sostituire a quelle che hai messo tu, e
anche al posto del puntatore a forma di spada solo nell'editor vorrei la
classica freccina nera stile Mac. Intanto fammi l'elenco di cio' che rimane
da fare".

**La freccina**: nell'editor il cursore e' la freccina nera col bordo
bianco (un cursore CSS in SVG, 24 x 24, punta in 2, 2), disegnata dal
sistema; prima l'editor disegnava la spada del gioco (`cursore`) come la
partita. Il gioco resta con la spada. (Negli screenshot delle prove il
cursore di sistema non si vede: controllato che il browser lo accetti.)

**Cosa resta da fare, editor di mappe** (al 23 novembre 2026):
1. Le icone PNG dell'autore al posto di quelle disegnate a linee (la
   colonna; il prossimo passo).
2. I ponti (rimandati dall'autore, §9.187): nei modelli ci sono i ponti
   dipinti, ma non se ne aggiungono di nuovi; anche i sentieri (`paths`)
   non si disegnano.
3. La password (in sospeso: l'autore non ricorda a cosa servisse).
4. La scheda "Regia" per gli scenari piu' complessi (obiettivi, eventi,
   dialoghi, rinforzi...): da progettare con l'autore.
5. Da decidere o rifinire, piccole:
   - un solo salvataggio per le partite sulle mappe dell'editor (lo slot
     `custom`: una partita nuova su un'altra mappa sostituisce la prima);
   - le mappe aperte da file nella schermata della schermaglia valgono per
     quella volta (non entrano fra quelle del browser);
   - nessun controllo degli ingombri: oggetti ed edifici si possono mettere
     uno sopra l'altro o sull'acqua (nella partita le unita' possono restare
     incastrate);
   - con lavoratori blu nella mappa la CPU non riceve i suoi 3 di partenza
     (il giocatore si');
   - S su un muro gia' messo ("Sposta") cambia lo schieramento, non il
     verso; Ripeti solo con Ctrl+Y (nessun pulsante);
   - i pulsanti delle mura spariscono da lontano (oltre 4 px di mappa per
     pixel);
   - la partita online sulle mappe dell'editor e' provata solo col canale
     vero (`netmap.mjs`), non con quello finto.
6. La PR: questa branch non ha ancora una pull request (la versione e' gia'
   0.2615).

**Fuori dall'editor** (le voci aperte qui sopra, "Cose da fare"):
l'audio da riesportare (§9.137-§9.145); il multigiocatore da provare fra
reti diverse, TURN, codici piu' corti, ritardo adattivo, riconnessione
(§9.156); il livello 7 (copertura del bosco, mura che nascondono,
prigionieri, banchi e pattuglie da Tiled, la mappa, la regia a fasi,
§9.148); il movimento in mischia e i posti di lavoro dei civili (§9.147);
prima dell'uscita `UNLOCK_ALL` a 1 (progress.js, §9.53).

Prove: test unitari (145), `editor.mjs`.

### 9.198 Icone dell'autore, ponti, password, partite solo su file, niente lavoratori di partenza; la PR

Risposte dell'autore all'elenco di §9.197 (23 novembre 2026, stessa PR),
con le icone in PNG: "2) interrompi i sentieri in corrispondenza dei fiumi,
per i ponti inserisci solo quelli caricati da me 3) la password serve a
editare la mappa: chi una volta impostata la mappa la carica nell'editor la
puo' editare solo se azzecca la password (se e' stata impostata), mentre il
caricamento per giocarci e' consentito a tutti 4) lascialo stare 5) il
salvataggio facciamolo solo su file, ok se non entra tra le mappe, [...]
nessuno dei due li riceve, il giocatore deve disegnarli a mano nell'editor
se li vuole, ok sullo spostamento dei muri, [...] pazienza se i pulsanti
spariscono a vista lontana [...] 6) apri la pr".

- **Le icone dell'autore** (8 PNG di Icons8: sposta, polilinea, pennello,
  file nuovo, cartella, dischetto, play, ingranaggio) in `nuovi/sprites/`
  coi loro nomi, e in `nuovi.json` come derivati `ico_ed_*` (64 px, gruppo
  gui) col `colore` bianco: l'editor le tinge di nero, o le lascia bianche
  sullo strumento scelto (il cerchio scuro). Dove non c'e' un'icona
  dell'autore (Inserisci, Gomma, Annulla, Taglia, Copia, Incolla) resta il
  disegno a linee. Nota: le icone gratuite di Icons8 chiedono il link
  "Icons by Icons8" nei crediti (da decidere con l'autore).
- **I sentieri sui fiumi**: provato (un sentiero e una strada che
  attraversano un fiume, nell'editor): l'acqua li copre gia', i pixel dentro
  il fiume sono gli stessi con e senza strada; niente da cambiare. Nel mio
  elenco "sentieri" erano i `paths`, che pero' non si vedono: sono i
  percorsi della regia della campagna (§9.101). Una prova di togliere i
  sassi dentro l'acqua e' stata scartata (non cambiava niente).
- **I ponti**: una scheda "Ponti" in Inserisci coi due ponti dipinti
  dall'autore (ponte_dx con la sua balaustra, ponte_dx2; rivers.js
  PAINTED_BRIDGES, cotti nel suolo sopra il fiume, gli stessi dei modelli);
  M li specchia per l'altro verso del fiume. Nessun ponte "a linee".
- **La password** (impostazioni della mappa): un campo password (vuoto:
  resta quella di prima; "Togli": nessuna). Nella mappa solo l'impronta,
  `lock: { salt, hash }` (SHA-256 di sale e password, mapfile.js `sha256`,
  scritto in JavaScript: uguale a quello di Node e del browser anche dove il
  browser non da' la crittografia, per esempio fuori da https). Aprire
  nell'editor una mappa con la password (dal browser, da file) la chiede:
  sbagliata, "Password sbagliata." e resta la mappa di prima. Giocarla
  (schermaglia, online, "Prova mappa") resta libero, e la password non
  cambia l'impronta della partita. Non e' una cifratura: la mappa resta
  leggibile per giocarla, e chi modifica il file a mano puo' togliere il
  lucchetto; ferma chi usa l'editor.
- **Le partite sulle mappe dell'editor si salvano solo su file**: nella
  pausa niente "Salva partita" ne' "Salvataggio automatico" (pause.js
  `fileOnly`), niente salvataggio automatico, lo slot `custom` tolto
  dall'elenco dei salvataggi; "Salva su file" e "Carica da file" come
  prima (il file porta la mappa, §9.190).
- **Nessuno dei due riceve i 3 lavoratori di partenza** sulle mappe
  dell'editor (ne' il giocatore, ne' la CPU, ne' online il blu): chi li vuole
  li mette nella mappa (Inserisci, Unita'). Le mappe del gioco come prima.
- Confermati: i muri con S in "Sposta" (lo schieramento), i pulsanti delle
  mura che spariscono da lontano, le mappe aperte da file solo per quella
  volta, nessun controllo degli ingombri. La scheda "Regia" per gli scenari:
  per ora no.
- **La 0.2614** (la PR #24, livello 7) e' su main ed e' il punto da cui
  parte questa branch: niente da conciliare.
- **La PR** di questa branch: aperta (editor di mappe, §9.180-§9.198).

Testi nuovi: "Ponti", la password (campo, nota, richiesta, "Password
sbagliata.", "Apri", "Nessuna password").

Prove: `editor.test.mjs` (in piu': SHA-256 coi valori di riferimento, la
password giusta e sbagliata, niente password in chiaro, la convalida del
lucchetto, l'impronta della partita uguale, la scheda dei ponti, nessun
lavoratore di partenza sulle mappe dell'editor, lo slot `custom` tolto; 146
test), `editor.mjs` (la partita di prova senza lavoratori, i 2 lavoratori
blu messi a mano per la CPU statica; una mappa con la password: sbagliata
resta chiusa, giusta si apre col lucchetto), `skcustom.mjs` (senza i 3
lavoratori; solo su file: la pausa senza slot, il salvataggio con la mappa
dentro ricaricato da file), `netmap.mjs`, `saves.mjs`, `soak.mjs`
(sk_padus coi 3 lavoratori come prima, lvl04), `pvp.mjs`; screenshot (la
colonna con le icone dell'autore).

### 9.199 Le icone dell'autore anche per i comandi

Richiesta dell'autore (23 novembre 2026, stessa PR, #25): "sostituisci anche
queste 4 icone" (incolla, copia, taglia, annulla; PNG nere 48-64 px).

In `nuovi/sprites/` come `ed_incolla.png`, `ed_copia.png`, `ed_taglia.png`,
`ed_annulla.png` (arrivate senza nome), e in `nuovi.json` come derivati
`ico_ed_paste`, `ico_ed_copy`, `ico_ed_cut`, `ico_ed_undo` (64 px, bianchi,
come quelli di §9.198): l'editor le usa al posto dei disegni a linee. Restano
disegnate a linee solo Inserisci e Gomma.

Prove: atlas rifatto (tools/05), screenshot della colonna (i comandi spenti
attenuati come prima).

**Ripeti** (richiesta dell'autore, stessa sera: "inserisci anche il tasto
ripeti, usa la stessa freccia ma specchiata verso destra"): un quinto
comando dopo Annulla, con l'icona di Annulla specchiata (Ctrl+Y nel
suggerimento), spento quando non c'e' niente da ripetere. Con quindici
pulsanti la colonna si rimpicciolisce fino a 0,8 (era 0,85, §9.196): a 900
px di altezza stanno ancora tutti senza scorrere. L'icona della gomma
dell'autore e' arrivata dentro un messaggio mandato mentre lavoravo, e non
come file: da rimandare.

**La CI rossa** (trovata seguendo la PR #25): da §9.181 la prova
`editor.mjs` falliva in CI (le esecuzioni non annullate: 421, 422, 424-426,
428, 430, 432, 434-437, 439), sempre in un punto di tasti o mouse veloci:
"trascinata col centrale" (421), poi il pannello "Salva mappa" che dopo
Ctrl+S non compariva (dal §9.184 in poi). In locale passava sempre. La
causa: nella CI (grafica emulata, pochi core) un fotogramma dura centinaia
di millisecondi, e "Ctrl giu', S, Ctrl su" arrivano tutti fra un
fotogramma e l'altro: quando l'editor legge i tasti (una volta per
fotogramma, input.js beginStep) Ctrl e' gia' lasciato e S diventa "stile";
il trascinamento col centrale partiva dal punto in cui stava il puntatore
al fotogramma dopo la pressione, non da dove si era premuto, e perdeva
l'ultimo tratto se il tasto era gia' lasciato. Correzioni (servono anche a
chi gioca su una macchina lenta):
- input.js: i tasti premuti con Ctrl (o Cmd) tenuto si ricordano al
  keydown (`pressedCtrl`, come `pressedShift` per i gruppi di unita'), e il
  punto in cui si preme ogni pulsante del mouse (`pressPos`);
- editor.js: Ctrl vale anche se gia' lasciato, per un tasto premuto con
  Ctrl tenuto; il trascinamento della vista parte da `pressPos` e si
  applica fino all'ultima posizione prima di chiudersi.

Con questa correzione la CI ha passato il punto di Ctrl+S (esecuzione 444)
ed e' caduta piu' avanti, alla polilinea: tre clic per un fiume, ma due
clic nello stesso fotogramma contano come uno (un solo `mousePressed` per
passo), e il fiume restava di un punto. In locale (anche col processore
rallentato di 6 volte, o coi fotogrammi allungati a 250 ms da uno script)
non si riproduceva. Qui il limite e' della prova, che manda le azioni piu'
in fretta di quanto la CI disegni: input.js conta le letture dell'input
(`reads`, esposto in `window.__editor` e `window.__game`), e `editor.mjs` e
`skcustom.mjs` dopo ogni azione del mouse e della tastiera aspettano che
la pagina l'abbia letto almeno una volta in piu' (`syncInput`; nessun
controllo tolto o saltato). Le due prove passano in locale (la schermaglia
piu' lenta: il menu disegna ~6 fotogrammi al secondo con la grafica
emulata).

### 9.200 L'icona della gomma dell'autore

Richiesta dell'autore (23 novembre 2026, stessa PR, #25), con l'icona
(PNG nera, 48 px): "fai solo la gomma, l'altra modifica di networking
segnala come da fare ma la facciamo in un'altra sessione".

In `nuovi/sprites/ed_gomma.png` e in `nuovi.json` come derivato
`ico_ed_erase` (64 px, bianco, come quelli di §9.198-§9.199): l'editor la
usa al posto del disegno a linee (che resta solo se l'icona mancasse).
Ora nella colonna e' a linee solo Inserisci.

I codici piu' corti del multigiocatore (§9.156, §9.198) restano da fare,
in un'altra sessione e in un'altra PR: segnati in "Cose da fare".

Prove: atlas rifatto (tools/05), screenshot della colonna (gomma spenta e
scelta), test unitari, `editor.mjs`.

### 9.201 La CI su main annullata per il tempo: il limite a 90 minuti

Domanda dell'autore (23 novembre 2026, dopo il merge della PR #25):
"continuo a vedere online la 0.2613 e sono passate ore". Versione 0.2616,
PR nuova.

Online c'era ancora la 0.2613 perche' gli ultimi due lavori su main non
sono arrivati a Pages:
- merge della #24 (0.2614, 22 novembre, esecuzione 419): un test unitario
  fallito; nella 0.2615 i test passano tutti (146);
- merge della #25 (0.2615, esecuzione 450): annullato al minuto 45, il
  limite del lavoro (`timeout-minutes`, alzato da 30 a 45 in §9.153), durante
  il determinismo fra browser, l'ultimo passo prima del sito. Tutto il resto
  era passato. Le prove dell'editor (§9.181-§9.199: `editor.mjs`,
  `skcustom.mjs`, `netmap.mjs`) hanno allungato le prove nel browser: sulla
  PR il lavoro durava gia' 44 minuti e mezzo, e su main gli effetti sonori
  (tools/18) ci hanno messo 10 minuti invece di 2.

Il limite passa a 90 minuti (build.yml). Nessuna prova tolta o accorciata.
Dopo il merge il lavoro su main pubblica la 0.2616 (con tutto quello della
0.2614 e della 0.2615).

**Il doppio clic** (la CI di questa PR, esecuzione su b6f16a5): `editor.mjs`
e' caduta su "un punto nuovo col doppio clic" (tutto il resto passato). Lo
stesso male di §9.199: l'editor decideva il doppio clic al passo, col tempo
del passo (`performance.now()` < 350 ms dal clic prima). Con i fotogrammi
lenti della CI i due clic risultavano lontani; e due clic di seguito nello
stesso passo contano come una pressione sola, che non era doppia. Provato in
locale con uno script che fa il doppio clic vero di Playwright (`dblclick`)
e allunga ogni fotogramma di 300 ms: col codice di prima il punto nuovo non
c'e' e la linea non si chiude col doppio clic, anche a velocita' normale
(le due pressioni nello stesso fotogramma); con la correzione si', in
tutti e due i casi. Correzioni:
- input.js: il doppio clic si decide al `pointerdown` (tempo dell'evento,
  350 ms e 8 px CSS come prima; il terzo clic ricomincia) e il passo lo
  legge in `pressDbl`, vero anche se le due pressioni cadono nello stesso
  passo;
- editor.js: la polilinea usa `pressDbl`; il doppio clic che chiude la
  linea mette prima il punto se il primo clic non l'ha messo (pressioni
  nello stesso passo);
- `editor.mjs`: dopo il clic che sceglie la linea aspetta 400 ms (fuori dal
  doppio clic) e poi fa il doppio clic vero (`page.mouse.dblclick`, prima
  erano due `click` separati da 40 ms); `click` e `dblclick` aspettano la
  lettura dell'input come le altre azioni (anche in `skcustom.mjs`).

Prove: test unitari (146), `editor.mjs` (due volte), `skcustom.mjs`,
`ui.mjs`, lo script dei fotogrammi lenti.

### 9.202 I codici piu' corti del multigiocatore

Richiesta dell'autore (23 novembre 2026, nuova PR #27, versione 0.2617):
"accorciare i codici di handshake del multiplayer. Ti sono state lasciate
delle indicazioni, valuta tu se l'operazione e' fattibile senza fare danni,
una volta valutato esegui. Prendi in considerazione tutto, anche il fatto
delle mappe custom che abbiamo introdotto con l'editor". Le indicazioni:
"Cose da fare" (da ~600-780 a ~150-250 caratteri) e §9.156 "Come
riprendere", punto 3: un SDP ridotto ai campi necessari, ricostruito
dall'altra parte (l'altra strada, un servizio con codici di 6 lettere,
vorrebbe un server: l'autore ha deciso senza, §9.156).

**La valutazione: si puo', senza danni.** Dei ~780 caratteri del codice di
chi crea, cio' che serve davvero all'altro browser per collegarsi sono
~100 byte: nome utente e password ICE, l'impronta del certificato DTLS
(SHA-256, 32 byte), il ruolo DTLS, gli indirizzi (tipo, protocollo,
indirizzo, porta, priorita'). Il resto e' uguale in ogni browser
(intestazioni, la riga del canale dati, porta SCTP) o sono annotazioni di
Chrome che l'altra parte non usa. I rischi che ho visto, e cosa ho fatto:
- *un browser che scrive l'SDP in un modo non previsto* (Firefox, Safari,
  una versione nuova di Chrome): il codice corto si fa solo da un SDP in
  cui ogni riga e' fra quelle conosciute, e solo se, riletto, da' lo stesso
  modello (`packShort` lo rilegge prima di darlo). Se no si da' il codice
  lungo di prima, che funziona come sempre: nel caso peggiore il codice e'
  lungo, mai sbagliato;
- *un codice rovinato per strada* (una chat che cambia un carattere): prima
  il JSON compresso non si decomprimeva, ora c'e' una somma di controllo (16
  bit): "Questo codice non e' valido", come prima, invece di una
  connessione che non si apre senza dire perche';
- *versioni diverse*: la versione del gioco e' all'inizio del codice corto,
  in un posto che non cambiera' (dopo il byte della forma), e una forma che
  non si conosce (una versione futura) dice "un'altra versione del gioco".
  Un codice corto incollato in una 0.2615 o prima dice "non valido" (quella
  versione non sa leggerlo): le due versioni non potrebbero comunque
  giocare insieme, e la versione si legge nel menu;
- *le cause dei collegamenti non riusciti* (§9.158) si leggono dagli
  indirizzi dei due codici: tipo, indirizzo, porta e protocollo restano
  tutti, quindi le stesse cause (provato);
- *le mappe dell'editor* (§9.192): nel codice corto ci sono il nome (fino a
  40 caratteri, anche accentati) e l'impronta (8 byte); la mappa continua
  a passare sul canale dopo i codici. Costa ~30 caratteri per un nome
  corto, ~65 per uno di 40;
- *mappa e opzioni* si scrivono come numeri (la mappa fra le cinque, o 63
  per quella dell'editor; ogni opzione l'indice nel suo elenco): vale perche'
  i due giocatori hanno la stessa versione, e lo si controlla prima.

**Le forme del codice** (netcode.js): "DV" + O/A + la forma + base64url.
- "c", il corto, in byte: la forma (2), la versione; un byte di bit (ruolo
  DTLS, BUNDLE, trickle, end-of-candidates, misura massima dei messaggi:
  niente, quella di Chrome e Safari, quella di Firefox o il numero; c'e' la
  partita); ufrag e password a 6 bit per carattere; l'impronta; gli
  indirizzi, ognuno con un byte (tipo, tcp, tcptype, forma
  dell'indirizzo), l'indirizzo (IPv4 4 byte, IPv6 16, il nome mDNS
  "uuid.local" di Chrome, Firefox e Safari 16, lo stesso di un indirizzo
  prima 1, se no il testo), la porta e la priorita'; poi, nella risposta,
  l'offerta a cui risponde (§9.158) e, nell'offerta, la partita (mappa,
  opzioni a 4 bit, seme, la mappa dell'editor); la somma di controllo.
- "z" e "p": il JSON con l'SDP intero, come prima (§9.156): si danno solo
  quando il corto non si puo', e si leggono sempre.
Il testo incollato dopo il codice corto ("...grazie!") non conta piu'.

**Cosa resta dell'SDP e cosa no.** Restano: ufrag, password, impronta,
ruolo DTLS, i candidati con tipo, protocollo, tcptype, indirizzo, porta e
priorita' (tutti: anche i TCP e gli IPv6), BUNDLE, trickle,
end-of-candidates, max-message-size. Si lasciano: la riga o= (si rifa'
dall'impronta), i "foundation" dei candidati (si rifanno, uno per
candidato: servono solo a raggruppare i controlli), raddr e rport (solo
diagnostica: si rimettono 0.0.0.0 o "::" e 0, come fa gia' Chrome: la
regola dell'SDP, RFC 8839, li vuole nei candidati non host), generation 0, network-id e
network-cost (preferenze di Chrome fra due reti dello stesso computer: la
priorita', che resta, porta gia' l'ordine delle reti), extmap-allow-mixed,
msid-semantic, sendrecv, porta e indirizzo nelle righe m= e c= (i browser
usano i candidati). L'SDP ricostruito ha la forma di quello di Chrome
(sdpFromModel), che Firefox e Safari accettano nelle chiamate fra browser
diversi.

**Le misure** (caratteri, offerta / risposta; prima ~780 / ~600):
- Chromium in questa macchina (rtc.mjs, WebRTC vero, un indirizzo mDNS):
  139 / 130 (prima 775 / 606);
- Chrome con STUN su una rete mobile (NAT simmetrico, due indirizzi
  esterni, TCP): 216 / 207; su un computer con due reti, TCP e IPv6 (7
  indirizzi, il caso piu' lungo delle prove): 247 / 238;
- Firefox (con un TCP passivo in piu'): 187 / 178; Safari: 168 / 159;
- su una mappa dell'editor ("La mia isola") l'offerta ~28 in piu'.

**I file**: `netcode.js` (sdpModel, sdpFromModel, il codice corto,
decodeCode che legge le tre forme), `skirmish.js` (`skValues`: i valori di
ogni opzione, anche di quelle nascoste; cleanSkirmish lo usa), `menu.js`
(0.2617: la 0.2616 e' della PR #26, §9.201, entrata su main
prima di questa). Nessun testo nuovo: gli errori sono quelli di prima.

**Prove.**
- `test/netcode.test.mjs` (nuova): SDP di Chromium (di questa macchina, e
  con STUN, due reti, TCP, IPv6, NAT simmetrico), di Firefox e di Safari:
  il modello, l'SDP ricostruito che riletto da' lo stesso; le righe che il
  modello non conosce (ice-lite, un'altra impronta, un altro mid, un
  secondo componente...) danno il codice lungo; le misure; le cause di
  netdiag uguali dai codici e dagli SDP veri; ogni mappa e ogni valore di
  ogni opzione, il seme piu' grande, le mappe dell'editor col nome vuoto,
  accentato, con simboli, di 40 lettere; quello che il codice corto non sa
  dire va nel codice lungo, uguale; incollato con testo attorno; tagliato
  (non valido, ma si sa se era un'offerta); ogni carattere cambiato
  (non valido); un'altra forma (un'altra versione, con la versione); il
  codice di prima ancora leggibile; ruoli DTLS, misure dei messaggi,
  indirizzi in tutte le forme. Test unitari: 151.
- Nel browser (WebRTC vero, Chromium): `rtc.mjs` (collegati, i confronti
  uguali, codice 139 e risposta 130), `rtcfail.mjs` (i codici cambiati
  dalla prova, la risposta per un altro codice, la guida), `netmap.mjs` (la
  mappa dell'editor: il nome letto dal codice corto, la mappa scaricata,
  ritrovata dall'impronta la seconda volta), `skcustom.mjs`, `netfake.mjs`.
  In piu' una prova a mano: due collegamenti nella stessa pagina con
  offerta e risposta passate dai codici corti, il canale aperto.
- Non provati qui (c'e' solo Chromium): Firefox e Safari veri. Gli SDP di
  prova sono scritti come li fanno quei browser; se uno ha qualcosa che il
  modello non conosce si torna al codice lungo. Da provare con il resto
  (§9.156 "Come riprendere", punto 1): due computer, meglio se uno con
  Chrome e uno con Firefox.

**Come andare oltre** (se servisse): la priorita' in 3 byte invece di 4
(l'ultimo e' quasi sempre 255), i candidati ripetuti (lo stesso indirizzo
dai due server STUN, raro) come un byte: pochi caratteri. Un codice di 6
lettere vorrebbe un server di presentazione (§9.152), che l'autore non ha
voluto.

### 9.203 Correzioni dell'editor: vetro, stili della casa, la F, il municipio, le foto della Natura, niente clic

Richieste dell'autore (23 novembre 2026, stessa PR #27, 0.2617): "nell'editor
bisogna applicare l'effetto vetro sull'interfaccia (per qualche motivo non e'
stato fatto), deve essere possibile cambiare stile alle case come si fa con
gli alberi e gli elementi della citta', sull'albero "fake" va disegnata
temporaneamente la "f" per far capire la differenza all'utente dell'editor
tra quello normale e quello fake. l'edificio centro deve essere
posizionabile come gli altri edifici, al di la' del punto di partenza.
anteprima oggetti natura particellari: sostituire l'immagine che c'e' ora
concettuale con uno screenshot, come fatto per il campo di grano.
Nell'editor disattiviamo il suono di clic della GUI, diventa fastidioso dopo
un po' in un ambiente silenzioso come quello dell'editor."

- **Il vetro** ("Glass interface", §7.14). *Perche' mancava*: lo sfondo
  sfocato dei pannelli lo cattura app.js dopo aver disegnato il mondo, nel
  ciclo del gioco; l'editor ha il suo ciclo (editor.js render) e non lo
  catturava mai, quindi Draw disegnava i pannelli bianchi semplici. Ora la
  cattura e' in `glass.js` (spostata da app.js, uguale) e l'editor la fa
  dopo la mappa e prima dell'interfaccia, se l'opzione e' accesa: colonna,
  pannello, caselle, pulsanti e suggerimenti di vetro come nel gioco.
- **Gli stili della casa** (Edifici). La casa del gioco ha sei stili (c1s..c6s,
  quelli della CPU c1b..c6b, buildings.js): la casella della casa (rossa e
  blu) li ha tutti, S li cambia ("Schieramento rosso (S: stile 3/6)"), come le
  mura (§9.194: lo schieramento con l'interruttore rosso / blu). Con "Sposta"
  S cambia lo stile di una casa gia' messa nel suo schieramento, come per
  alberi e case della citta' (prima ne cambiava lo schieramento: per una casa
  dell'altra parte la si rimette). Nella voce lo stile e' `sprite` (il nome
  rosso; il blu si vede col suo, c3s -> c3b).
- **Lo stile scelto arriva nella partita** (trovato per strada). La room delle
  mappe dell'editor non portava lo `sprite` delle voci: il gioco tirava a
  caso lo stile di alberi e case, anche quello scelto nell'editor con S o col
  pennello. Ora (mapfile.js scenarioToRoom) lo sprite va nella room dopo il
  gruppo, solo per le mappe dell'editor (le room del gioco sono di
  tools/07, senza), e world.js `loadRoom` lo mette dopo il Create: il Create
  tira comunque il suo numero a caso (il generatore della partita consuma
  gli stessi numeri), poi lo sprite scelto; gli alberi (civilians.js
  `restyle`) anche il tipo, che usa l'albero che muore. La casa blu della
  CPU col suo sprite blu; online quella del secondo giocatore torna al nome
  rosso (i gemelli si disegnano blu da soli, p2sprites.js). L'albero finto
  dei modelli con `alb1_F` (la F) resta a caso fra gli otto. Le mappe del
  gioco non cambiano: col seme fisso le impronte di determinism.mjs
  (sk_padus, 3000 passi) sono le stesse di main.
- **La F sull'albero finto**, solo nell'editor: la F arancione di `alb1_F`
  (lo sprite dell'editor di GameMaker; nel kit di Tiled gia' su tutte le
  varianti, §9.78) disegnata sull'albero alla sua profondita' (editmap.js,
  l'evento draw di `albero_fake` nel mondo dell'editor: dietro gli alberi
  davanti), anche nel fantasma sotto il puntatore e nella casella della
  tavolozza. Nel gioco l'albero finto resta uguale a quello vero.
- **Il municipio come edificio**: in testa alla scheda Edifici, rosso e blu,
  quanti se ne vogliono, oltre alle partenze (scheda Regia, una per parte).
  Nella mappa e' la voce "centro" con `hall: true` (la partenza e' il centro
  senza: mapfile.js `isStart`; la convalida accetta `hall` solo vero e solo
  sul centro); nella room (testRoom) e' nel gruppo `hall`, che
  skirmishPrepare non conta fra le partenze; il blu e' quello della CPU
  (enemy_centro) o, online, del secondo giocatore. Con la vittoria
  "Municipio" il giocatore perdeva al primo centro distrutto: ora con
  l'ultimo (buildings.js; la CPU e la partita online contavano gia' tutti i
  centri). Il disegno della mappa nella schermaglia (skuser.js) non lo
  scambia per una partenza.
- **Le foto della Natura**: le sette macchie a particelle (erba, grano, fili
  d'erba, i quattro prati fioriti) nella tavolozza avevano un disegno a
  pallini; ora una foto: `tools/19_natura.mjs` (come tools/17 per le
  cartoline) mette ogni macchia da sola su una mappa vuota dell'editor (il
  prato), la inquadra intera, la fotografa e la sfuma con un'ellisse
  (`nuovi/sprites/ed_natura_*.png`, 320 px, gruppo ambiente, nuovi.json).
  Il disegno di prima resta se la foto mancasse.
- **Niente clic** dei pulsanti nell'editor (i dieci `clic()` di §9.168 tolti;
  nel gioco restano).
- **Le frecce della colonna che scorre** (§9.196), richiesta successiva
  dell'autore: "usiamo le stesse del menu della schermaglia, non metterci il
  cerchio intorno". Ora sono `ico_sk_freccia` (la freccia disegnata
  dall'autore per la schermata della schermaglia, §9.131), girate in su e in
  giu', il 40% piu' piccole delle frecce della mappa li' ("falle un po' piu'
  piccole ste freccette, tipo del 40%"), con le stesse trasparenze
  (0,55; 0,95 col puntatore; 0,15 spente in cima e in fondo), al posto del
  cerchio bianco col triangolo. Il punto in cui si cliccano non cambia.

Testi nuovi: "Schieramento rosso / blu (S: stile {i}/{n})" nelle sei lingue.

Prove: `editor.test.mjs` (in piu': la scheda Edifici col municipio e la casa
a sei stili, gli stili rossi e blu del gioco, S con "Sposta" nello stesso
schieramento, l'aspetto del blu, le partenze che non contano i municipi, la
convalida di `hall`, la room coi municipi nel gruppo e gli stili dopo,
skirmishPrepare che sceglie le due partenze, splitGroups che tiene lo stile;
152 test), `editor.mjs` (in piu': il municipio rosso messo dalla tavolozza,
la casa col terzo stile con S, S con "Sposta", le foto nell'atlas),
`edstyles.mjs` (nuova, nella CI: una partita su una mappa dell'editor con
la casa rossa c1s, quella blu c5b, l'albero alb6 col tipo 6, il finto
`alb1_F` che resta uno degli otto, due centri per parte, 600 passi della
CPU con due centri; vittoria "Municipio": perso il municipio si gioca,
persa anche la partenza si perde), `determinism.mjs` (sk_padus, 3000 passi:
le impronte di main), screenshot (la tavolozza Natura con le foto, gli
alberi finti con la F, le case, i municipi, il vetro).

### 9.204 La polilinea: l'anteprima come nel gioco, il fiume che toglie gli alberi

Richieste dell'autore (24 novembre 2026, stessa PR #27, 0.2617): "Possiamo
fare che il fiume quando viene dato invio alla sua polilinea elimina gli
alberi che gli vanno in interferenza? Possiamo fare in generale la
polilinea di anteprima (quella prima di premere invio di fiumi sentieri
ecc) piu' omogenea a livello di rappresentazione e gia' che prenda in
considerazione il coefficiente di assonometria sull'asse y per disegnare la
larghezza?"

- **L'anteprima** (la linea che si disegna, fino al puntatore, e quella di
  un punto trascinato). Prima: un tratto dritto per segmento, largo uguale
  in ogni direzione, semitrasparente; sui giunti i tratti si sovrapponevano
  (piu' scuri) e agli angoli restavano dei buchi. Ora la fascia e' quella
  del gioco (rivers.js `riverGeometry`, con `plain`: senza la larghezza che
  varia del +-12%, che il gioco non passa mai): i punti smussati come nel
  gioco, la larghezza misurata sul terreno "steso" (y diviso ISO, 0,62) e poi
  schiacciata, quindi un tratto orizzontale e' alto 0,62 volte la larghezza
  e uno verticale largo quanto la larghezza, come il fiume finito; nelle
  curve strette il bordo interno si ferma come nel fiume vero. Disegnata
  piena, una tinta uniforme (triangoli che non si sovrappongono), coi bordi
  e le estremita' a 2 px; uguale per fiume, strada e sentiero, ognuno col
  suo colore. La larghezza visibile delle strade (i sassi sparsi attorno
  alla linea, rivers.js SPREAD) e' circa quella indicata, quindi la stessa
  fascia va bene anche li'. Le estremita' del fiume finito si stringono a
  punta (dentro la mappa): l'anteprima no.
- **Il fiume toglie gli alberi**: finita la linea di un fiume (Invio, il
  destro o il doppio clic) gli alberi (veri e finti) coi piedi nell'acqua
  del fiume nuovo spariscono, anche quelli della gemella con la simmetria.
  "Nell'acqua" e' la stessa regola del pennello dei boschi (§9.185,
  editmap.js `blocks`: 10 x 5 px attorno al piede sulle celle d'acqua del
  gioco, riverCells), solo per il fiume nuovo (EditScene `treesInRivers`;
  sotto i ponti non c'e' acqua). Fiume e alberi tolti sono un passo solo:
  Ctrl+Z li rimette insieme. Un avviso dice quanti ("Alberi tolti dal fiume:
  N", nelle sei lingue). Le strade non toccano gli alberi (non richiesto);
  spostare i punti di un fiume gia' fatto nemmeno.

Prove: `editor.test.mjs` (in piu': la fascia senza la variazione, alta w x
ISO in orizzontale e larga w in verticale; quella del gioco varia; gli
alberi nel fiume, non quelli accanto ne' le altre voci; 153 test),
`editor.mjs` (in piu': un bosco di 96 alberi, un fiume di tre punti che lo
attraversa: 13 alberi tolti, Ctrl+Z rimette fiume e alberi), screenshot
(l'anteprima del fiume con tratti orizzontali e verticali, il fiume finito
senza alberi nell'acqua, l'anteprima di una strada).

### 9.205 La nebbia in "Natura": quella estetica e il banco che nasconde

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617): "nella
scheda "natura" mettiamo anche i banchi di nebbia, sia quello "estetico"
che quello del tutorial/lvl7 che limita la visibilita' ai nemici".

Le nebbie del gioco, guardate prima:
- *estetica*: `sk_nebbia` (§9.122, skirmish.js), quella delle mappe della
  schermaglia: fa nascere 5 nuvole (lo sprite fog1) sparse attorno a se'
  (900 x 300 px) e di nuovo ogni 40 s; ogni nuvola scivola a destra e dopo
  100 s svanisce. Non cambia niente nella partita;
- *tutorial*: `fog_controller` / `fog01` (§9.80): nuvole che attraversano la
  mappa verso destra; un nemico a meno di 290 px da una nuvola vede a meta'
  (enemies.js `fogSight`);
- *livello 7*: `nebbia_banco` (§9.148, stealth.js): tre nuvole in fila che
  vanno avanti e indietro in orizzontale (600 px per parte, 1 px a passo);
  dentro l'ellisse del banco i nemici vedono a meta', ma solo con lo stealth
  del livello 7 (stealth.js `sees`).
Il "banco" da mettere in una mappa e' quello del livello 7 (resta dove lo si
mette, va e viene: si puo' progettare), con l'effetto del tutorial.

**Cosa e' cambiato.**
- In fondo a "Natura" la **nebbia estetica** (`sk_nebbia`) e il **banco di
  nebbia** (`nebbia_banco`). Nella casella le loro nuvole, lo sprite del
  gioco (fog1, una macchia grigia morbida) senza il prato sotto (richiesta
  dell'autore: prima avevo fatto le foto come per le altre macchie, tenui
  sul prato): la estetica a nuvole sparse, il banco a una fila piu' densa.
- **Nell'editor** si vedono ferme come all'inizio della partita (editmap.js
  `fogLook`): il banco con le sue tre nuvole (stealth.js `bankClouds`, la
  funzione del gioco, ora condivisa), la estetica con cinque nuvole in un
  disegno fisso (nella partita nascono a caso); anche sotto il puntatore
  prima di metterle. Con "Sposta" e "Inserisci" il pallino per sceglierle e,
  per il banco, la linea tratteggiata fin dove va avanti e indietro
  (BANK.range, 600 px per parte).
- **Nella partita** la estetica fa quello che fa nelle schermaglie; il banco
  va e viene come nel livello 7 e **dentro un banco il nemico vede a meta'**
  (enemies.js `fogSight`, come vicino alle nuvole del tutorial: inseguire,
  tirare, le macchine d'assedio) anche fuori dal livello 7. Nel livello 7 il
  conto resta quello dello stealth (`sees`: chi guarda e chi e' guardato),
  senza raddoppiarlo. Vale per i nemici della CPU (online i due giocatori
  non hanno la nebbia, come per le nuvole del tutorial); le torri della CPU
  nella nebbia restano come prima (solo nel livello 7 tirano a meta').
- Il banco ha le misure di partenza del livello 7 (tre nuvole, 600 px per
  parte, 1 px a passo); l'editor per ora non le cambia.

Prove: `editor.test.mjs` (in piu': le due nebbie nel catalogo e fra gli
oggetti ammessi; `fogSight` a meta' dentro un banco senza stealth, 1 fuori,
1 con lo stealth; 154 test), `edstyles.mjs` (in piu': una mappa con le due
nebbie; nella partita il banco si sposta, un nemico dentro vede a meta' e
fuori no, la estetica fa nascere 5 nuvole), `editor.mjs`, screenshot (la
scheda Natura con le due nebbie, le due nebbie sulla mappa col tratteggio
del banco).

### 9.206 Le impostazioni della nebbia

Domande dell'autore (24 novembre 2026, stessa PR #27, 0.2617), durante
§9.205: "non possiamo semplicemente usare lo sprite senza lo sfondo sotto?
possiamo regolare la "trasparenza" della nebbia in modo che influenzi
l'awareness del nemico in proporzione? la nebbia va verso destra poi
sparisce e si ricrea dov'era nata giusto? o possiamo impostare noi velocita'
e momento di reset/altre impostazioni?". Lo sprite senza il prato: fatto in
§9.205. Come va la nebbia: quella estetica si', fa nascere le sue nuvole
attorno al punto, le nuvole scivolano a destra e svaniscono, e ogni tanto ne
nascono altre attorno al punto; il banco invece non sparisce mai, va avanti
e indietro. Scelte dell'autore (alla mia proposta: dei "-" e "+" come quelli
del pennello, i valori nella mappa): per il banco **densita', velocita',
ampiezza**; per la nebbia estetica **densita', velocita' e direzione,
durata, quante nuvole e ogni quanto**.

- **I valori** (mapfile.js `FOG_SETTINGS`, quelli di partenza in
  `FOG_DEFAULTS`, uguali al gioco di prima):
  - banco: densita' 25, 50, 75, **100**%; velocita' 0 (fermo), 30, **60**,
    120 px al secondo; ampiezza 300, **600**, 900, 1200 px per parte;
  - estetica: densita' 25, **50**, 75, 100% (l'opacita' piu' alta delle
    nuvole); velocita' « 60, « 30, 0, **30 »**, 60 » px al secondo (« a
    sinistra, » a destra); durata di una nuvola 30, 60, **100**, 150, 200 s;
    nuvole 3, **5**, 8, 12; ogni 20, **40**, 60, 90 s.
- **La densita' del banco e la vista dei nemici**: dentro un banco un
  nemico vede a 1 - 0,5 x densita' (100%: a meta', come prima; 50%: a tre
  quarti; 25%: a 7/8). Vale per `fogSight` (le mappe dell'editor) e per lo
  stealth del livello 7 (`sees`, per chi guarda e per chi e' guardato; i
  banchi del livello sono a 100%: niente cambia). stealth.js `fogDensity`:
  la densita' del banco piu' fitto che copre il punto. Anche le nuvole si
  vedono in proporzione (piu' trasparenti).
- **Nella mappa** la voce ha `fog` con le sole impostazioni diverse da
  quelle di partenza (la convalida accetta solo i valori dell'elenco e solo
  sulle due nebbie); nella room vanno dopo gruppo e stile (scenarioToRoom) e
  world.js `loadRoom` le mette nell'istanza (`settings`) prima del Create:
  il banco (stealth.js `fogBank`) e la nebbia estetica (skirmish.js
  `skNebbia`, che le passa alle sue nuvole) le leggono. Senza impostazioni
  tutto come prima: le mappe della schermaglia e il livello 7 non cambiano
  (le impronte di sk_padus su 3000 passi sono quelle di main, lvl07.mjs
  passa).
- **Nell'editor** il riquadro delle impostazioni, di vetro, sopra il
  pannello (tre per riga: l'etichetta, "-", il valore, "+"): in
  "Inserisci", scelta una delle due nebbie, per quelle che si mettono; in
  "Sposta", scelte delle nebbie, per quelle scelte della specie della prima
  (con le gemelle; annulla e ripeti). La nebbia si vede con la sua densita';
  il tratteggio del banco e' lungo quanto la sua ampiezza (fermo, niente);
  quello della nebbia estetica dice fin dove arrivano le nuvole prima di
  svanire (velocita' x durata), con la punta dalla parte verso cui vanno.

Testi nuovi: "Velocita'", "Ampiezza", "Durata", "Nuvole", "Ogni" ("Densita'"
c'era), nelle sei lingue.

Prove: `editor.test.mjs` (in piu': i valori di partenza uguali a quelli
del gioco, la convalida, la room, splitGroups, la vista in proporzione alla
densita', il riquadro e i valori come si leggono; 155 test), `editor.mjs`
(in piu': il banco nuovo con densita' 50% e ampiezza 900, poi con "Sposta"
la velocita' a 120 px/s e Ctrl+Z), `edstyles.mjs` (in piu': un banco a
densita' 0,5 e veloce, il nemico dentro vede a tre quarti; la nebbia
estetica con 8 nuvole verso sinistra), `lvl07.mjs`, `determinism.mjs`
(sk_padus, impronte di main), screenshot (il riquadro in "Inserisci" e in
"Sposta").

### 9.207 Il menu di pausa: i cursori del volume, il contatore FPS fra le opzioni grafiche

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617), con un
disegno su carta (dall'alto: "Obiettivi: si'", una pillola con la nota e la
parte piena fino a una curva, una con l'altoparlante, i cerchi della lingua
con "IT"; "stesso verde" per la parte piena e la lingua scelta): "modifica
al menu di pausa: il contatore FPS spostarlo assieme alle opzioni grafiche,
i pulsanti musica ed effetti sonori modificarlo in modo da farli diventare
due slider del volume cosi' che i giocatori possano regolarlo. La parte
"piena" dello slider deve essere dello stesso verde dell'opzione lingua
selezionata. I simboli te li passo poi io. Opzioni grafiche spostalo sopra
"torna al menu"".

- **Il menu di pausa** ora: Riprendi, Salva e carica, Suggerimenti,
  Obiettivi, il cursore della musica, quello degli effetti, la lingua,
  Ricomincia livello, **Opzioni grafiche**, Torna al menu (online: senza
  salvataggi ne' Ricomincia, Opzioni grafiche sopra "Lascia la partita").
- **I cursori** (pause.js `_slider`): la pillola bianca dei pulsanti, piena
  da sinistra fino al volume del verde della lingua scelta (GREEN, alla
  stessa trasparenza), con la curva del bordo arrotondato come nel disegno;
  a 0 vuoti, col simbolo piu' chiaro. Si prendono e si trascinano (o un
  clic dove si vuole), a passi del 5%; il volume segue subito, si salva
  lasciando il tasto; lasciando quello degli effetti si sente il clic al
  volume nuovo. **I simboli** sono quelli dell'autore (mandati dopo, PNG
  neri da 48 px: `nuovi/sprites/vol_musica.png`, `vol_effetti.png`; in
  nuovi.json `ico_vol_music` e `ico_vol_sfx`, bianchi come le icone
  dell'editor, tinti dal menu): neri, e **grigi quando il loro volume e' a
  0** (richiesta dell'autore). Quelli a linee che avevo disegnato nel
  frattempo restano solo se mancassero.
- **I volumi** (settings.js `musicVolume`, `sfxVolume`, 0-1, di partenza 1)
  al posto degli interruttori `music` e `sfx`: chi li aveva spenti li trova
  a 0. Nell'audio (audio.js `setMusicVolume`, `setSfxVolume`) il guadagno e'
  il quadrato della posizione (l'orecchio sente cosi'), sul volume
  generale degli effetti e su quello della musica; a 0 come spenti (niente
  suoni continui, la musica si ferma).
- **Il contatore FPS** e' fra le opzioni grafiche, in fondo, sopra il limite
  degli FPS.

Prove (anche dopo le icone: atlas rifatto, screenshot della musica al 60%
con la nota nera e degli effetti a 0 con l'altoparlante grigio): `pausevol.mjs` (nuova, nella CI: un'opzione salvata con la musica
spenta diventa 0; l'ordine del menu; la musica trascinata al 70%, un clic
sugli effetti al 30%, salvati e uguali dopo aver ricaricato; il contatore FPS
fra le opzioni grafiche, che si accende), test unitari; screenshot (la pausa
coi due cursori, le opzioni grafiche).

Dopo, in CI (PR #27, commit 68fff1e): `pausevol.mjs` e' fallita una volta
con la musica a 0,3 invece di 0,7, cioe' al valore del clic sugli effetti.
Era la prova: aspettava tempi fissi (60-200 ms) fra un evento del mouse e
l'altro, e in CI un fotogramma puo' durarne centinaia; la fine del
trascinamento e il clic sugli effetti finivano letti insieme, col cursore
della musica ancora preso. Ora, come `editor.mjs` e `skcustom.mjs`, dopo
ogni azione del mouse e della tastiera aspetta che la pagina abbia letto
l'input (`reads`). Qui non si riproduce nemmeno con la CPU rallentata di 8
volte; passa.

### 9.208 Il menu principale: il tutorial in "Giocatore singolo", l'editor nella colonna del titolo

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617): "menu
principale: mettiamo "gioca il tutorial" in "giocatore singolo" in prima
posizione sopra campagna, editor di mappe invece mettiamo nella schermata
principale in fondo".

Le pagine della colonna (menu.js `MENU_PAGES`, §9.157):
- **il titolo**: "Giocatore singolo", "Multigiocatore", "Carica partita",
  "Editor di mappe" (in fondo; prima: "Gioca il tutorial", "Giocatore
  singolo", "Multigiocatore", "Carica partita");
- **"Giocatore singolo"**: "Gioca il tutorial", "Campagna - Collapse",
  "Schermaglia" (prima: campagna, schermaglia, editor di mappe);
- "Multigiocatore" come prima.
Sempre quattro pulsanti nel titolo: il logo resta dove stava. Nessun testo
nuovo.

Le prove che passano dal menu cliccano per posizione: aggiornate
(`editor.mjs`: l'editor e' il quarto del titolo; `skcustom.mjs`: "Giocatore
singolo" il primo, "Schermaglia" il terzo, "Multigiocatore" il secondo;
`rtc.mjs`, `netmap.mjs`: "Multigiocatore" il secondo; `ui.mjs`: le pagine).
Passate: `editor.mjs`, `skcustom.mjs`, `rtc.mjs`, `netmap.mjs`, `ui.mjs`
(it, de: nessun problema); screenshot delle due colonne.

### 9.209 Livello 7: i nemici si vedono con la vista dell'arciere; l'arciere che insegue

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617): "Correzioni
da fare al lvl7: gli edifici e personaggi nemici devono rivelarsi in accordo
con la vista allargata dell'arciere, altrimenti è come se comparissero dal
nulla. L'arciere del lvl7 ha anche un problema di engage dei nemici in fase
di attacco, se si allontanano capita che si inceppi (animazione della
camminata ma omino fermo) e non li segua o che si rifiuti di attaccarli.
Indaga e risolvi".

**La vista.** La nebbia di guerra si apre attorno all'arciere della nebbia
con la sua ellisse allargata (fog.js `shapeOf`, `ST.sight` 1,5: 600 x 360 px
di giorno, meno di notte), ma i nemici si mostravano con la regola di sempre:
un'unita' alleata entro 150 px (300 di giorno) dalla loro sagoma, 200 (400)
per gli edifici. Fra 300 e 600 px il terreno era scoperto e il nemico
invisibile: compariva dal nulla avvicinandosi. Ora (fog.js `inHunterSight`)
un nemico, unita' o edificio, la cui sagoma tocca l'ellisse di un arciere
della nebbia e' visibile: in `seenNear` (unita', edifici, lavoratori,
macchine nemiche) e in civilians.js `reveal` (i civili e le risorse). Solo
con lo stealth acceso (livello 7, prova della nebbia); altrove nulla cambia.

**L'inseguimento**, riprodotto nel browser sulla mappa del livello 7 (un
picchiere della pattuglia della cima che, dopo il clic destro, se ne va):
1. *si rifiuta*: con la linea di tiro coperta (una casa, un bosco) e nessun
   punto di tiro entro il guinzaglio, l'arciere si fermava; appena il
   bersaglio usciva di gittata, fuori dai 200 px di `comp` lo dimenticava
   (`stopHere`, niente piu' ordine). Lo stesso se usciva di gittata mentre
   caricava il tiro;
2. *cammina sul posto*: ordine su un bersaglio oltre la gittata (900 px):
   l'arciere va al punto cliccato; entro 500 px da li' il passo era verso il
   nemico PIU' VICINO, e solo se entro 800 px; il bersaglio intanto se n'era
   andato: azione "in cammino", animazione della camminata, nessun passo
   (394 passi di fila nella prova, finche' il timer fermati non scadeva);
3. *dietro le mura*: il percorso si cercava nel campo dell'ordine, calcolato
   dal bersaglio: la meta restava dentro le mura, la cella dell'arciere non
   aveva direzione e camminava sul posto;
4. il tiro furtivo (2 s di caricamento) su un nemico che si allontana usciva
   di gittata a ogni caricamento; e la freccia mirava dov'era il bersaglio:
   uno che camminava di lato non veniva colpito (col rapido, quattro frecce
   a vuoto su quattro).

Ora l'arciere della nebbia con un bersaglio scelto (ranged.js `huntOrder`,
`huntChase`; gli altri arcieri come prima):
- lo insegue finche' e' vivo: a tiro e in linea tira; coperto cerca un punto
  di tiro (§6.4) e, se non c'e', si avvicina; fuori tiro gli va dietro; il
  percorso si rifa' quando il bersaglio si e' spostato di 64 px;
- se non lo vede piu' va dove l'ha visto l'ultima volta e li' lo lascia;
- il percorso cerca la meta fra le celle raggiungibili da lui (se dalla meta
  dell'ordine non si arriva all'arciere, prima il campo calcolato da lui):
  dietro le mura si ferma alla cella piu' vicina o lascia perdere;
- in cammino senza avanzare (16 px in 90 passi) o arrivato senza poter
  tirare: si ferma e aspetta che il bersaglio si sposti, senza camminare sul
  posto; la meta accanto al bersaglio non torna piu' indietro verso
  l'arciere (`destination`, che la spostava di 64 px a passo finche' non era
  libera: occupata dal bersaglio stesso o da alberi, anche fin quasi a lui);
- il caricamento comincia solo se allo scocco il bersaglio sara' ancora a
  tiro (col passo che ha) e non si annulla finche' resta entro 1,25 volte la
  gittata (la freccia vola oltre: 660 px, 900 la furtiva);
- la freccia mira dove sara' il bersaglio quando arriva (lo spostamento
  dell'ultimo passo, al piu' 8 px, per i passi di volo a 20 px per passo).

Prove: `hunter.mjs` (nuova, in CI): la vista (fante a 450 px visibile, a 900
no, edificio a 450 visibile); l'inseguimento col furtivo da 900 px e col
rapido da 750, il picchiere che va a sud: lo segue (1400 px), lo uccide, al
piu' un passo di fila "in cammino" senza muoversi; il fante dietro le mura:
nessuna camminata sul posto. Sul codice di prima falliscono vista, furtivo e
rapido. Passate anche `lvl07.mjs`, `stealth.mjs`, i test (155) e le impronte
di `determinism.mjs` su sk_padus (uguali a main).

### 9.210 Le icone dei pulsanti del tiro dell'arciere della nebbia

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617), con due
disegni caricati: "per il tiro multiplo dell'arciere usa queste frecce
incrociate, per quello preciso quella del mirino".

I due pulsanti accanto ad attacco e difesa (stealth.js `shotClicker`,
§9.148) avevano, in attesa delle icone, la lettera della scorciatoia (F, R).
Ora:
- **tiro furtivo** (il preciso): il mirino (`nuovi/sprites/tiro_preciso.png`,
  sprite `ico_tiro_furtivo`, 50 px);
- **tiro rapido** (il multiplo): le frecce incrociate
  (`nuovi/sprites/tiro_multiplo.png`, sprite `ico_tiro_rapido`, 64 px).
Come i simboli del volume (§9.207): in nuovi.json bianchi pieni, tinti nel
disegno; il lato piu' lungo a 36 px nel cerchio (raggio 30). Se l'atlas non
le avesse, la lettera di prima. I nomi dei modi ("Tiro furtivo", "Tiro
rapido") e le scorciatoie non cambiano.

Il pulsante, dopo una seconda indicazione dell'autore ("non devono avere
fondo nero vuoto, ma fondo bianco come le altre icone, e devono diventare
verdi scuro quando selezionate, guarda i due pulsanti a sinistra come
funzionano"): come attacco e difesa (units.js `unitPanel`), il cerchio
bianco pieno (opacita' 0,69, 0,99 sotto il mouse) con l'icona nera al 70%
(l'alpha delle icone dell'originale, 179/255); il modo scelto col cerchio
verde scuro pieno, rgb(46,125,50) (la stessa famiglia del verde della lingua
scelta, rgb(76,175,80)), e l'icona bianca. Prima di questa: il modo scelto
col cerchio bianco pieno e l'icona nera, l'altro col cerchio vuoto e
l'icona bianca.

Prove: atlas ricostruito (tools/05_atlas.py); screenshot dei due stati nel
livello 7; `hunter.mjs` controlla che le due icone siano nell'atlas.

### 9.211 Livello 7: i pali con la fiamma si mostrano quando l'arciere li vede

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617): "i pali
che fanno da indicazione (quelli con la fiamma sopra) si "sbloccano" a
livello di visualizzazione solo quando l'arciere li vede fisicamente,
altrimenti è una sorta di spoiler del percorso da seguire per finire il
livello".

Prima i 22 pali (`palo_1`, props.js) della mappa del livello 7 si vedevano
tutti dall'inizio e, come nell'originale, erano fonti di vista: la nebbia
attorno a ognuno era scoperta (nella view e nella minimappa, con le
montagne e i picchieri delle pattuglie vicini, che col palo entro 200 px si
vedono: enemies.js `T.palo`), e la loro torcia illuminava la notte. La
strada era tutta segnata.

Ora (lvl07.js, all'avvio: props.js `veilPalo`) ogni palo parte **velato**:
- non si disegnano ne' il palo ne' la sua torcia (`visible`), che non manda
  fiamme (effects.js `fireStarterStep`) ne' luce di notte (fog.js
  `nightLights`);
- non e' una fonte di vista (fog.js `fogSources`): niente nebbia scoperta
  attorno, nemmeno nella minimappa;
- non fa vedere i picchieri vicini (fog.js `seenNear`, solo finche'
  `g.paliVeiled` > 0, cioe' nel livello 7).
Si **svela** per sempre (props.js `unveilPalo`, nello Step del palo) quando
il suo riquadro entra nella vista di un'unita' o di un edificio alleato (o
di una statua attiva): le stesse ellissi della nebbia (fog.js
`seenByAllies`), quindi quella allargata dell'arciere. Non quelle degli
altri pali, che li avrebbero svelati a catena. Da svelato e' il palo di
prima. Il palo piu' in alto resta la meta della vittoria.

All'inizio se ne vedono 1 su 22: quello accanto alla statua
`o_statua1_real` in basso a sinistra, che e' un edificio alleato e scopre la
sua zona fin dall'inizio (come prima). Negli altri livelli nulla cambia
(i globali ripartono a ogni livello: `paliVeiled` non c'e').

Prove: `hunter.mjs`, il caso nuovo "pali" (21 velati su 22 all'inizio,
invisibili con la torcia e con la nebbia coperta; l'arciere vicino a uno lo
svela, la nebbia attorno si scopre; uno lontano resta velato). Nei casi
dell'inseguimento i pali si svelano prima (strada gia' scoperta): a 900 px,
coi pali velati, il picchiere e' nella nebbia nera e l'arciere va dove l'ha
visto e lascia perdere (§9.209), giusto ma non piu' il caso da provare.
Passate anche `lvl07.mjs`, `stealth.mjs`, `saves.mjs` (lvl07: ripristino
identico), i test (155) e le impronte di `determinism.mjs` su sk_padus
(uguali a main). Screenshot della partenza: la minimappa prima e dopo.

### 9.212 Volumi: la zappa al campo piu' bassa, corno e "risorse" piu' alti

Richiesta dell'autore (24 novembre 2026, stessa PR #27, 0.2617):
"Regolazione volumi effetti: abbassiamo un po' la zappa (solo quando usata
per il campo di grano) alziamo il corno e il suono per quando non ci sono
abbastanza risorse per compiere un'azione".

- **La zappa al campo di grano**: il colpo del contadino che raccoglie
  (civilians.js, azione 4) suona al 60% (`FIELD_HOE_VOL`, -4,4 dB). Lo
  stesso suono `zappa` fa anche le frecce che colpiscono (`ARROW_HIT_VOL`
  0,7, ranged.js), il fuoco appiccato (effects.js `fireFlare`) e la
  macchina d'assedio che colpisce (siege.js): restano come prima, quindi il
  gain della voce (0,35) non cambia.
- **Il corno di guerra** (attackalarm.js, un attacco nuovo fuori dalla
  vista): gain da 0,17 a 0,30 (+5 dB, ~ -27 dB nei primi 500 ms).
- **"Risorse"** (mancano risorse o popolazione per un pulsante, il codice
  del lucchetto sbagliato, la produzione ferma per la popolazione): gain da
  0,13 a 0,24 (+5 dB, ~ -23 dB).
I gain in nuovi/audio/audio.json (tools/18_audio.py li copia in
game/assets/audio/audio.json; i file mp3 non cambiano), con la nota di ogni
voce aggiornata.

Prove: nel browser un contadino a un campo su sk_padus, le chiamate audio
registrate: 19 colpi di `zappa`, tutti a 0,6. I test (155).

### 9.213 Le montagne del generatore: la prova di stile

Richieste dell'autore (26 novembre 2026, nuova PR, 0.2618): "Iniziamo a
ragionare come fatto per fiumi sentieri a un tool per l'editor per creare
montagne procedurali, regolando parametri come altezza o larghezza, a
partire dai disegni che gia' abbiamo"; poi, sulla proposta: "ha senso
disegnare sia la cresta (a livello estetico) che la base (che impatta anche
il gameplay): potrebbe essere una creazione in due step [...]. Partiamo col
primo punto" (la prova di stile, prima del motore e dell'editor).

**La proposta, decisa.** Come per i fiumi (§9.97): l'autore disegna delle
linee, il gioco ci costruisce sopra la montagna con una texture presa dai
suoi disegni; nella mappa solo i parametri (niente immagini), lo stesso
risultato per lo stesso seme (la partita in rete). In due passi:
1. la **cresta**, una spezzata dove la si vede (la linea del cielo): ogni
   punto una cima, fra due cime una sella; e' l'aspetto;
2. la **base**, il contorno sul terreno: conta per il gioco. Se non la si
   disegna la fa il generatore attorno alla cresta, larga `width`.
Parametri: altezza (il piede di ogni cima e' tanti px piu' in basso della
cresta: piu' alta, la montagna scende di piu', la cresta resta dov'e'),
larghezza, asperita' (contorno da liscio a frastagliato, lingue e
insenature), dettaglio (quanti speroni, spalle e piccole piramidi), seme
(un'altra variante), e l'altezza di ogni cima (`peaks`, moltiplicatori).
Scartato: stirare i dieci disegni (inchiostro e grana deformati, sempre le
stesse dieci forme, ~13 MB di memoria video per `montagna10`).

**Cosa hanno in comune i disegni** (montagna1-10, tutte guardate): pietra
grigia marmorizzata su carta a righe verticali (ogni ~3 px), grandi facce
piane dalle cime alla base, dove la marmorizzazione cambia verso da una
faccia all'altra (toppe di carta); inchiostro nero spesso ~4-6 px sulle
creste e sugli speroni, con tratti che si fermano prima o sbordano;
speroni che finiscono sulle punte del contorno; spalle a meta' discesa da
cui scendono piccole piramidi (spesso con linee verticali); il contorno
strappato, a tratti d'inchiostro piu' spessi in basso; la linea del cielo
e' la cresta.

**La texture** (`nuovi/montagne/roccia.png`, 258 x 256, 93 KB;
tools/20_montagne.py, dopo tools/01): cercato in tutte le dieci montagne il
quadrato di sola pietra (niente inchiostro, niente trasparenza) con la
luminosita' a blocchi di 32 px piu' uniforme: in montagna9 a (1536, 512).
Resa senza cuciture come l'acqua (incrocio col ritaglio spostato di mezza
misura), ma un asse per volta: incrociati insieme (come in 15_fiumi.py)
vicino agli angoli il salto del ritaglio spostato si vedeva a meta'
piastrella. Larghezza e spostamento orizzontale multipli di 3, per tenere
in fase le righe della carta.

**Il generatore** (game/src/mountains.js, `mountainGeometry`; solo + - * /,
dmath e mulberry32 col seme: niente Math.random ne' Math.sin):
- la cresta: le cime dell'autore e, fra due, una sella al 55-80% (sui tratti
  lunghi selle e cime minori alternate), un po' fuori linea; ogni nodo ha il
  piede sul terreno e l'altezza;
- la base del generatore: le celle da 8 px vicine alla cresta (la mezza
  larghezza cambia col rumore: lingue larghe e insenature) o a uno dei 3-5
  speroni per cima che vanno oltre (sempre piu' stretti: le lingue di
  roccia), il pezzo attaccato alla cresta, il suo contorno seguito lungo i
  lati delle celle e semplificato; dietro la cresta non oltre quanto la
  montagna nasconde (se no spuntava sopra la linea del cielo come un
  bernoccolo). La base disegnata a mano si usa com'e'; un piede di cima che
  ci cadesse fuori abbassa la cima finche' ci entra;
- il contorno frastagliato: tratti dritti di 10-34 px spostati a caso, qualche
  insenatura stretta;
- gli speroni: i piedi sono le punte del contorno (i punti piu' lontani
  dalla cresta nei dintorni) e, nei tratti lunghi senza punte, il punto piu'
  lontano del tratto; per cima 2-4 speroni grandi (le punte piu' lontane),
  spesso con una spalla (piu' alta del pendio, mai sopra la sua cima sullo
  schermo); gli altri piedi scendono dalla spalla di uno sperone grande
  accanto (piccole piramidi sul fianco). Prima prova: tutti gli speroni
  dalla cima, a ventaglio regolare: un ombrello, non una montagna;
- le facce: fra due speroni consecutivi (dove si separano, o la cresta da
  una cima all'altra, giu' per uno, il contorno, su per l'altro); la luce
  dalla normale della faccia (luce da sinistra e dall'alto: 0,74-1); la
  texture fissata al mondo, spostata e girata per faccia;
- da dietro in avanti (prima le facce coi piedi piu' in alto); l'inchiostro
  di uno sperone e di ogni tratto di cresta subito dopo l'ultima faccia che
  lo ha sul bordo, cosi' le facce davanti lo coprono (una catena che gira
  verso chi guarda nasconde un pezzo della sua cresta); il contorno a tratti
  con la sua faccia, piu' spesso dove guarda in giu'.

**La prova** (`node tools/21_prova_montagne.mjs [cartella]`, Playwright, il
canvas 2D del browser; predefinita build/prova_montagne): sei fogli PNG.
1 i disegni montagna6, 8 e 4 accanto a montagne generate di misura simile;
2 l'altezza (140, 260, 400) e la larghezza (260, 420, 640); 3 asperita' e
dettaglio (0, 0,5, 1); 4 sei semi con gli stessi parametri; 5 i due passi
(la cresta in rosso, i piedi delle cime, la base in blu: quella del
generatore e una disegnata a mano); 6 una catena diagonale e una a curva
con le cime di altezze diverse.

Da decidere con l'autore, guardando i fogli: la resa (inchiostro, luce,
quante linee, quanto frastagliato), i valori di partenza dei parametri.
Note per il passo dopo:
- **la roccia sopra la base**: la cresta si vede piu' in alto della base
  (di quanto e' alta la montagna), quindi la parte alta del disegno sta sopra
  il terreno dietro la montagna. Proposta: l'ostacolo e' tutta la sagoma
  visibile (come le maschere precise delle montagne dipinte), la base decide
  dove la montagna tocca terra davanti;
- una catena che gira molto (o una base molto concava) a volte ha facce che
  attraversano un'insenatura: da sistemare (dividere le facce lunghe sulle
  insenature) prima del motore;
- nel gioco le facce si disegneranno a triangoli col renderer del suolo
  (ground.js), l'inchiostro con rivers.js `inkLine` (gia' per punto, `ink`).

Prove: test/mountains.test.mjs (stesso seme stessa montagna, seme diverso
diversa; le cime dove le ha messe l'autore e i piedi dentro la base per sei
semi; facce e inchiostro ben fatti; la base disegnata a mano rispettata
entro 60 px); determinism.test.mjs passa (nessuna funzione vietata). I
test: 149 passano, 8 saltati; i 2 che falliscono (editor.test.mjs §9.193,
§9.206) leggono game/assets/objects.json, che c'e' solo dopo la pipeline
(non rifatta in questa sessione).

### 9.214 Lo strumento montagna nell'editor; le montagne nel gioco

Richieste dell'autore (26 novembre 2026, stessa PR di §9.213, 0.2618), sui
fogli di §9.213: "In generale la resa e' un buon punto di partenza. Il
colore mi sembra un po' scuro rispetto ai miei disegni, anche le linee nere
dentro il disegno mi sembrano poche, considera che non e' obbligatorio
arrivino fino alla base. Abbiamo strumenti di controllo per evitare
inserimenti da parte dell'utente di punti assurdi o infattibili?
Nell'editor inseriscilo come tasto dedicato sotto alla polilinea (strumento
montagna). La montagna quando creata elimina tutti gli oggetti in collisione
(warning per tutti gli oggetti che non siano alberi), e sposta le polilinee
in interferenza in modo che girino intorno alla montagna. Occhio anche che
lo strumento montagna sia compatibile coi tool di simmetria".

**Lo stile** (mountains.js, tools/20_montagne.py).
- *Il colore*: la pietra dei disegni ha luminosita' media 162-166, la
  texture 158 e le facce la scurivano ancora (media ~142). Ora la texture e'
  schiarita del 4% (164, nuovi/montagne/roccia.png rifatta) e la luce delle
  facce va da 0,84 a 1 (prima 0,74-1): le facce in luce come i disegni, le
  altre poco piu' scure.
- *Le linee dentro*: tutti gli speroni grandi hanno l'inchiostro (90-100%,
  prima 75-100%), e ogni faccia ha in piu' 1-3 linee che partono da una cima
  o da una spalla e si fermano a meta' pendio (35-75% della discesa; a volte
  cominciano poco sotto), spesso dritte in giu' come le verticali dei
  disegni; solo se restano dentro la faccia.
- *Le facce che attraversavano le insenature* (§9.213, nota): uno sperone
  ora deve restare dentro la base (il segmento dritto non ne incrocia il
  contorno); se la cima piu' vicina non "vede" il piede si prova la
  successiva, se nessuna lo vede il piede non fa uno sperone; la spalla
  idem (prima di lato, poi dritta, poi niente).

**I controlli** (mountains.js, la risposta alla domanda: prima non c'erano).
I limiti (MOUNTAIN_LIMITS, MOUNTAIN_STEPS):
- *la cresta* (crestProblem): al piu' 12 cime; due di fila fra 50 e 1200 px;
  la linea non torna indietro con un angolo sotto i 35 gradi; non si incrocia;
- *la base* (baseProblem): da 3 a 64 punti, a non meno di 16 px; non si
  incrocia; almeno 15000 px quadrati; sta sotto tutta la cresta (sotto ogni
  cima, fino alla sua altezza, c'e' base: se no la cima non ha dove poggiare);
- *i parametri*: altezza 80-480, larghezza 160-1000, asperita' e dettaglio
  0-1, a passi (i "-" e "+");
- *una montagna non ne tocca un'altra* (la sagoma), ne' la sua gemella
  (troppo vicina all'asse della simmetria).
Nell'editor un punto che non va si rifiuta subito, con l'avviso che dice
perche' ("Troppo vicina alla cima di prima", "La base non puo'
incrociarsi"...); la convalida delle mappe che arrivano da fuori (mapfile.js
validateMap, cleanMountain) scarta la mappa con montagne fuori dai limiti o
con campi sbagliati, come per le altre parti.

**Lo strumento** (editor.js, editmap.js), il terzo pulsante della colonna,
sotto la polilinea (icona a linee: due cime; l'autore puo' disegnarne una
sua, `ico_ed_mountain`). I tasti 1-5 restano quelli di prima (la gomma e'
ancora il 5), la montagna e' il 6 (TOOL_KEYS).
- *Passo 1, la cresta*: un clic per cima (come si vede, la linea del
  cielo); il destro, Invio o un doppio clic la finiscono; Backspace toglie
  l'ultima; Esc annulla. Mentre la si disegna, l'anteprima della montagna (a
  facce grigie con l'inchiostro) con la base automatica.
- *Passo 2, la base*: un clic per punto (il contorno si chiude da solo);
  il destro, Invio o il doppio clic la finiscono; senza punti, la base
  automatica (larga `width`). L'anteprima usa la base disegnata appena ha
  tre punti validi.
- *Scegliere e cambiare*: un clic su una montagna la sceglie (la sua base,
  la cresta, i punti); le cime e i punti della base si trascinano (la
  modifica vera lasciando il tasto, coi controlli); Canc la toglie; B
  ridisegna la base. Nel riquadro altezza, larghezza, asperita' e dettaglio
  coi "-" e "+" (della montagna scelta, o delle nuove), "Nuova variante" (un
  altro seme) e "Base automatica" (via la base disegnata).
- *Ogni montagna creata o cambiata*, in un passo solo da annullare:
  - toglie gli oggetti sotto la sua sagoma: gli alberi coi piedi sulla
    sagoma (come per i fiumi, §9.204; "Alberi tolti sotto la montagna: N"),
    gli altri con la maschera (righe ogni 4 px), le macchie col punto
    d'origine; per tutti quelli che non sono alberi l'avviso giallo
    ("Oggetti tolti sotto la montagna: N"), anche per le partenze (poi il
    salvataggio chiede le due partenze, §9.191);
  - fa girare fiumi e strade che la toccano: il pezzo che passa sulla
    montagna diventa un giro lungo il suo contorno allargato di mezza linea
    piu' 40 px (dalla parte piu' corta), semplificato (entro 28 px, punti a
    non meno di 48: il contorno a celle faceva gli scalini e il fiume le
    zeta); un'estremita' sulla montagna si ferma fuori; una linea tutta
    sotto sparisce (avviso). I fiumi spostati tolgono gli alberi nella loro
    acqua nuova, come i fiumi nuovi.
- *La simmetria*: la riga della simmetria come negli altri strumenti. La
  gemella e' la stessa montagna specchiata sul terreno (mountains.js
  mirrorStructure: le stesse cime alte uguali, la stessa base specchiata
  punto per punto) e vista dallo stesso punto, quindi con la diagonale o la
  verticale la si vede dall'altro lato: per il gioco conta che la base sia
  esattamente lo specchio. Nella mappa le due voci hanno gli stessi campi e
  `sym`; la specchiata anche `mirrored: true`. Trascinare, cambiare i
  parametri, togliere valgono per tutte e due (twinMountain: stessi campi,
  l'altra specchiatura). Con la gemella in verticale o in diagonale la base
  automatica resta nascosta dalla montagna anche davanti (se no la faccia
  dietro della gemella spuntava sopra la sua cresta).

**Nel gioco** (le montagne del generatore si giocano: "Prova mappa", le
mappe dell'editor nella schermaglia e online):
- *cotte nel suolo* (ground.js, dopo strade, fiumi e ponti): le facce a
  triangoli (mountains.js triangulate, a orecchie) con la pietra
  `monte_roccia` (tools/05_atlas.py la mette fra gli sfondi) spostata e
  girata per faccia, moltiplicata per la luce; l'inchiostro come i fiumi
  (rivers.js inkLine). A ogni fotogramma non costano niente;
- *l'ostacolo e' la sagoma* (mountainCells, celle da 8 px: le facce come si
  vedono e la base), come la maschera precisa delle montagne dipinte: per
  unita' e fantasmi degli edifici (app.js terrainBlocks), per i percorsi
  (pathing.js, insieme all'acqua), per le frecce (world.js shotClear,
  archery.js arrowStopped: le montagne fermano le frecce, §6.6), per il
  pennello dei boschi dell'editor;
- *la minimappa*: il simbolo dell'autore (§9.115) sul riquadro della
  montagna, come per quelle dipinte;
- tutto dai soli parametri, sempre uguale (dmath, mulberry32 col seme): la
  partita in rete vede le stesse montagne.

**Prove.**
- test/mountains.test.mjs (in piu': i controlli della cresta e della base
  coi loro perche'; la convalida delle mappe; la gemella con la base
  esattamente specchiata e le cime alte uguali, nelle tre simmetrie; i
  triangoli di un poligono concavo; la sagoma come ostacolo). I test
  unitari: 164, tutti passano (con game/assets rifatto: tools 05-07).
- editor.test.mjs: la colonna ha un pulsante in piu' e a 900 px non stava
  piu' tutta (scorreva): la scala minima della colonna da 0,8 a 0,75 (a 900
  px stanno ancora tutti i pulsanti), e la prova che controllava la scala
  minima (">= 0,8") ora controlla ">= 0,75".
- game/test/browser/mountains.mjs (nuova, anche nella CI): il pulsante
  sotto la polilinea; la cresta in tre clic (un punto troppo vicino
  rifiutato); la base automatica; l'albero e la miniera sotto tolti (l'albero
  lontano resta); il fiume che la attraversava gira attorno e non la tocca
  piu'; Ctrl+Z toglie tutto in un passo, Ctrl+Y lo rifa'; "+" dell'altezza
  sulla montagna scelta; una seconda montagna che tocca la prima rifiutata;
  la base disegnata a mano con la simmetria diagonale: la gemella con la base
  specchiata; Canc toglie anche la gemella; "Prova mappa": nel gioco tre
  montagne, ostacolo per i percorsi e riparo dalle frecce. I file del gioco
  li serve Playwright dal disco (niente server). Passa.
- game/test/browser/editor.mjs (quella di sempre, coi tasti 1-5 di prima):
  passa tutta (fatta girare coi file serviti dal disco, come sopra).
- Le foto (build/prova_montagne/ della prova): la cresta in disegno, la
  base, la montagna col fiume deviato, la base a mano, la simmetria, la
  montagna nel gioco.
- I fogli di §9.213 rifatti (`node tools/21_prova_montagne.mjs`), col foglio
  7 nuovo: le gemelle nelle tre simmetrie.

**Resta da fare / da decidere**: l'altezza di una sola cima dall'editor (il
generatore la sa gia', `peaks`; manca il comando); un'icona dell'autore per
lo strumento; le montagne del generatore in Tiled (per i livelli della
campagna); la gemella vista dall'altro lato potrebbe sembrare un'altra
montagna (e' la stessa, girata): se l'autore preferisce, si puo' disegnarla
con lo stesso aspetto, ma la parte alta della sagoma (sopra la base) non
sarebbe piu' esattamente speculare.

### 9.215 L'altezza di una cima sola

Richiesta dell'autore (26 novembre 2026, stessa PR, 0.2618): "Intanto
aggiungi il comando per alzare o abbassare una sola cima. Lascia perdere
Tiled, a questo punto i prossimi livelli li impostiamo dall'editor e la
regia la vediamo in vibe coding. L'icona te la carico poi." (Tiled: niente
montagne del generatore nel kit; tolto da "resta da fare" di §9.214.)

- **Scegliere una cima**: con la montagna scelta, un clic su una cima
  (senza trascinarla) la sceglie: scura col bordo bianco (anche nella
  gemella). Esc torna a tutta la montagna, un altro Esc la lascia.
- **Alzarla e abbassarla**: + e - della tastiera (anche del tastierino; il
  "+" letto dal carattere, perche' sulla tastiera italiana non sta sul tasto
  "=" americano: input.js), o i "-" e "+" del riquadro, dove "Altezza"
  diventa "Altezza cima" in % dell'altezza della montagna, a passi dal 30%
  al 200% (PEAK_STEPS; la voce `peaks` c'era gia' nel generatore e nella
  convalida delle mappe; tutte al 100%: la voce sparisce).
- **La cima sale davvero**: il punto della cresta si alza di quanto cresce
  l'altezza, cosi' il piede sul terreno resta dov'e' (la base, gli
  ostacoli, la gemella non cambiano). L'"Altezza" di tutta la montagna
  invece tiene ferma la cresta (§9.214). Coi controlli della cresta (una
  cima alzata puo' fare un angolo troppo stretto) e una cima che uscirebbe
  dalla mappa si rifiuta, con l'avviso.
- **Le altre cime restano come sono**: prima i numeri a caso delle cime
  (l'altezza varia del +-10%) e delle selle venivano da una sequenza sola, e
  spostando un punto cambiava quante selle c'erano, quindi anche l'altezza
  delle altre cime e il piede di quella cambiata (24 px nella prova). Ora
  ogni cima ha il suo seme (mountains.js crestNodes): le montagne gia' fatte
  cambiano un po' d'aspetto (le cime e le selle), le basi disegnate a mano
  no.

Prove: mountains.test.mjs (in piu': alzata del 30%, la cima e' alta il 30%
in piu', i tre piedi e le altre due cime uguali; 165 test), browser
mountains.mjs (in piu': clic su una cima la sceglie, + la alza di ~49 px
col piede fermo entro 2 px, "-" di "Altezza cima" la riporta al 100% e
`peaks` sparisce, Esc torna alla montagna). Passano.

### 9.216 Le chiazze d'erba col pennello

Domanda dell'autore (26 novembre 2026, stessa PR, 0.2618): "Secondo te
avrebbe senso inserire altri strumenti generativi? Forse per le chiazze
d'erba?"; poi, sulla proposta: "Solo le chiazze d'erba, in cui posso
decidere quali particelle spawnare con quale densita' per particella
(sempre in un range gestibile) con un pennello tipo quello del terreno".

**Il pennello.** Una scheda in piu' nel pennello area, **Erba**, in fondo
dopo le texture (prima stava seconda, ma la prova dell'editor sceglie le
schede per posto: il selciato e' la seconda; il titolo dello strumento: "Pennello area: boschi, erba,
texture"). Come le texture (§9.185): la pennellata diventa una sagoma (la
forma della mappa `meadows`), il destro cancella le chiazze che tocca, la
simmetria fa la gemella, Ctrl+Z toglie la pennellata intera. Sopra il
riquadro, in un riquadro di vetro come quello della nebbia (§9.206), le
sette particelle delle macchie di "Natura" con la loro densita' ("Particelle
ogni 100 x 100 px"), coi "-" e "+":
- erba scura, erba verde, erba secca (i tre verdi di burst_erba1), fili
  (chiazzaparticellare), spighe (burst_grano1), papaveri e fiori gialli (i
  fiori dell'autore, §9.37; uno dei due sprite a caso);
- densita' a passi 0, 0,5, 1, 2, 3, 4, 6, 8, 12; di partenza come
  burst_erba1 (erba scura 2, verde 2, secca 1, le altre 0: burst_erba1 ha
  2,3 / 2,1 / 1,1);
- i limiti: al piu' 20000 particelle in una chiazza (le densita' si
  riducono in proporzione) e 150000 in tutta la mappa (oltre, la pennellata
  si rifiuta con l'avviso "Troppa erba su questa mappa": l'erba si disegna a
  ogni fotogramma); senza nessuna particella, l'avviso "Scegli almeno un
  tipo di particella".

**Dove nascono** (game/src/meadows.js meadowPoints): a caso nella sagoma,
sempre uguali per lo stesso seme (mulberry32: l'editor e il gioco, e i due
giocatori in rete, vedono la stessa chiazza); piu' rade verso il bordo
(sfumato in 60 px, come le macchie che finiscono a nulla) e a ciuffi (un
rumore liscio, celle di 160 px, lascia zone piu' fitte e piu' rade); mai
sull'acqua dei fiumi ne' sulle montagne del generatore. Le particelle a
fasce come le macchie (§8.18: le unita' ci restano immerse).
- *nell'editor* (editmap.js _meadows): si rifanno solo le chiazze nuove o
  cambiate (una pennellata non rifa' tutta l'erba); cambiati fiumi o
  montagne, tutte (l'erba rinasce solo dove puo': una montagna messa sopra
  una chiazza la lascia fuori dalla sagoma);
- *nel gioco* (app.js useMeadows): dopo le istanze della room (l'acqua
  sotto i ponti dipinti dipende da loro); nei salvataggi ci sono gia' (i
  sistemi di particelle si salvano); la convalida delle mappe (mapfile.js,
  meadows.js cleanMeadow) accetta solo le particelle note alle densita' dei
  passi; l'anteprima delle mappe senza copertina (skuser.js) le mostra in un
  verde piu' chiaro.

**Prove.** mountains.test.mjs (in piu': quante particelle per densita' e
area, tutte dentro la sagoma, sempre uguali, niente dove e' bloccato, il
limite per chiazza, la convalida; 166 test). editor.test.mjs: il pennello
ha cinque schede, la prova le contava quattro (ora cinque).
game/test/browser/editor.mjs (quella di sempre) passa.
game/test/browser/meadows.mjs (nuova, anche nella CI): la scheda Erba, i
papaveri alzati a 3 col "+", una pennellata attraverso un fiume: la chiazza
con 351 particelle, nessuna sull'acqua; il destro la cancella, Ctrl+Z la
rimette; una montagna sopra: nessuna particella nella sagoma; "Prova
mappa": l'erba nel gioco. Passa. Nella foto il riquadro delle particelle
aveva le etichette sopra i "-" (quattro per riga) e il "×" che il font non
ha: tre per riga, "100 x 100".

**Altri strumenti generativi** (la risposta alla domanda, da decidere): i
bordi naturali (erba lungo le rive e ai piedi delle montagne, a scelta), il
bosco che si dirada verso il bordo con qualche radura; non le mappe intere
(per la campagna conta la regia dell'autore).

### 9.217 Il fiume taglia le macchie di "Natura"

Domanda dell'autore (26 novembre 2026, stessa PR, 0.2618): "Se il fiume
passa sopra la chiazza particellare la elimina?" No: il fiume nuovo
toglieva solo gli alberi (§9.204), e le macchie di "Natura" (burst_erba1,
burst_grano1, chiazzaparticellare, i fiori) restavano con le particelle
anche sull'acqua, nell'editor e nel gioco (le chiazze del pennello, §9.216,
invece gia' non nascevano sull'acqua). Proposte due strade (tagliarle o
eliminarle col centro nell'acqua); l'autore: "Se riesci a farglielo
tagliare siamo a cavallo".

- **Tagliate** (effects.js clipDecor): le particelle di una macchia
  sull'acqua dei fiumi a linee o sulle montagne del generatore non si
  vedono; la macchia resta. Nel gioco una volta, dopo le istanze della room
  (app.js useMeadows: come le chiazze del pennello); vale anche per le mappe
  gia' fatte (nelle schermaglie le macchie erano gia' state tolte dai fiumi a
  mano, §9.150-§9.151: cambia solo qualche bordo).
- **Nell'editor** le particelle tolte restano da parte (allParts): quando un
  fiume o una montagna cambiano (nuovi, spostati, tolti, annullati) il taglio
  si rifa' su tutte le macchie, e una macchia messa o spostata si taglia
  subito (EditScene spawn). Ctrl+Z del fiume la rimette intera.
- *La depth* (domanda dell'autore): le particelle delle chiazze del pennello
  sono a fasce di 12 px a depth -y come quelle delle macchie di "Natura"
  (Particles.bands, DECOR_BAND, §8.18): le unita' ci restano immerse allo
  stesso modo.

Prove: game/test/browser/meadows.mjs (in piu': una burst_erba1 e un fiume
nuovo che la attraversa: da 2600 a ~1730 particelle, nessuna sull'acqua;
Ctrl+Z: di nuovo 2600; in "Prova mappa" la macchia tagliata). editor.mjs
(quella di sempre) passa; i test unitari (166).

### 9.218 Le particelle dell'erba come icone che ondeggiano

Richiesta dell'autore (26 novembre 2026, stessa PR, 0.2618): "Iniziamo a
rendere meno testuale l'editor: in questo nuovo pennello riesci a mettere
le singole particelle al posto della descrizione testuale nel selettore?
Sarebbe figo se avessero il caratteristico wiggle come nel gioco".

- Nel riquadro delle particelle dell'erba (§9.216) al posto del nome c'e'
  un ciuffo di particelle vere, quelle del gioco (effects.js MEADOW_PARTS),
  in un sistema di particelle dell'editor fuori dalla mappa (editor.js
  uiParts): il passo dell'editor le fa avanzare, e ondeggiano col wiggle del
  gioco (Particles.angle: i 4 gradi dell'erba, i fiori piu' lenti).
- I ciuffi sono piu' grandi e piu' pieni che sulla mappa (l'erba del gioco e'
  tenue: alpha 0,35-0,75): una copia del tipo di particella con alpha 0,95;
  dimensioni x1,7 l'erba, x2,2 i fili, x1,5 le spighe, quasi uguali i fiori.
  Una particella a densita' 0 ha il ciuffo sbiadito (alpha 0,28).
- Il nome resta nel suggerimento sopra l'icona, col puntatore sopra.
- Quattro per riga (con i nomi erano tre), righe da 60 px.

Prove: meadows.mjs (in piu': il nome dei papaveri col puntatore
sull'icona; due foto del riquadro a mezzo secondo di distanza sono diverse:
i ciuffi ondeggiano). La foto del riquadro: build/prova_montagne/erba_icone.png.
