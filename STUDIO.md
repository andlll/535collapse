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
