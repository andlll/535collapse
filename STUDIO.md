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

Ultimo aggiornamento: Fase 3, punto 4 (combattimento) completo; prossimo il punto 5 (nebbia e notte). Il dettaglio di ogni voce
sta nella sezione citata.

**Decisioni o materiali che servono all'autore**
- [ ] Screenshot dell'originale con il pannello delle risorse: raggio degli
  angoli di `draw_roundrect_colour_ext` (§3.1).
- [ ] Screenshot o video di fuoco e pioggia: aspetto delle forme di
  particella interne di GameMaker (`pt_shape_flare`, `line`, `pixel`).
- [ ] Screenshot dell'originale col centro selezionato mentre produce un
  civile: colore della percentuale, per verificare lo stato di disegno
  persistente (§3.5).
- [ ] Difetti da decidere: n.30–35 (§3.9), n.37–39 (§3.10), n.42–45 (§3.11), n.46–49 (§3.12), n.51–53 (§3.13).
- [ ] Formato con cui disegnare le room dei livelli 3–10 (§0.15).
- [ ] Nome definitivo della prima uscita ("535 – Collapse", provvisorio).

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
- [ ] 5. Nebbia e notte a bassa risoluzione; visibilità di nemici e
  risorse; trucco nebbia con `global.fogville` (difetto n.9 corretto).

**Resto del gioco**
- [ ] Particelle (pool unico): pioggia, erba, chiazze, fuoco, fumo, sangue,
  mattoni, burst; spighe dei campi, semi della semina; aquila (manager alarm 3), `fog_controller`.
- [ ] Suggerimenti del tutorial (`hint_*`), dialoghi (`dialogo_*`),
  obiettivi (`objective_button`), vittoria e sconfitta.
- [ ] Menu principale e campagna: pulsanti, mappa, sottomenu livelli,
  lucchetto a 5 cifre, sblocco **persistente** che parte da 1 (§0.14);
  livelli 3–10 "in arrivo"; menu di pausa (`mouser`).
- [ ] `lvl01`: catena delle 4 porte; `lvl02`: aree difese, area 7 che conta
  per la vittoria (§1.2), difetto `l6exists`.
- [x] Correzioni decise in Fase 1 (§1.6), applicate coi sistemi: ariete
  60 oro anche col tasto Q, annullare un picchiere restituisce 55 cibo e
  45 legno, centro distrutto −10 popcap, castello e torre senza −5.
- [ ] Fiamme alte della casa da non distruggere (§3.5 n.18): con le
  particelle.

**Fasi 4 e 5**
- [ ] Salvataggi JSON come NIMBUS (versione del formato, checksum, file
  esportabile/importabile).
- [ ] Opzioni nel menu: tetto fps, risoluzione dinamica, diagnostica;
  i18n dei testi del gioco; pulsante schermo intero con ripiego; PWA.
- [ ] Workflow GitHub Actions (atlas, maschere, scene, bundle → Pages);
  zip per i portali verificato con Playwright in una sottocartella.

**Verifiche che mancano**
- [ ] Prestazioni su una GPU vera (pannello F3 dal PC dell'autore),
  Firefox, Safari, schermi ad alta densità.

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
