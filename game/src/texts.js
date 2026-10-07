// Traduzioni dei testi del gioco (i18n.js, tr()). La chiave e' il testo
// inglese dell'originale, com'e' nel GML, con i refusi corretti su
// decisione dell'autore (STUDIO.md §3.19 n.72: l'elenco per ritrovarli in
// src/); i valori sono le traduzioni in it, es, pt, de, fr.
// `{nome}` e' un segnaposto sostituito da tr(). I font del gioco hanno le
// lettere accentate di queste lingue (tools/05_atlas.py); ß, œ e simili li
// riduce draw.js.

export const TEXTS = {
  // ------------------------------------------------------- schede edifici
  "House": { it: "Casa", es: "Casa", pt: "Casa", de: "Haus", fr: "Maison" },
  "Increases the population value by 10. Press C while placing to change the style.": {
    it: "Aumenta la popolazione di 10. Premi C mentre la piazzi per cambiare stile.",
    es: "Aumenta la población en 10. Pulsa C al colocarla para cambiar el estilo.",
    pt: "Aumenta a população em 10. Pressione C ao posicionar para mudar o estilo.",
    de: "Erhöht die Bevölkerung um 10. Drücke C beim Platzieren, um den Stil zu ändern.",
    fr: "Augmente la population de 10. Appuie sur C en la plaçant pour changer de style." },
  "Warehouse": { it: "Magazzino", es: "Almacén", pt: "Armazém", de: "Lagerhaus", fr: "Entrepôt" },
  "Resources deposit for worker units.": {
    it: "Deposito di risorse per i lavoratori.", es: "Depósito de recursos para los trabajadores.",
    pt: "Depósito de recursos para os trabalhadores.", de: "Rohstofflager für die Arbeiter.",
    fr: "Dépôt de ressources pour les ouvriers." },
  "Windmill": { it: "Mulino", es: "Molino", pt: "Moinho", de: "Windmühle", fr: "Moulin" },
  "Deposit for the food resource.": {
    it: "Deposito per il cibo.", es: "Depósito para la comida.", pt: "Depósito para a comida.",
    de: "Lager für Nahrung.", fr: "Dépôt pour la nourriture." },
  "Barracks": { it: "Caserma", es: "Cuartel", pt: "Quartel", de: "Kaserne", fr: "Caserne" },
  "Creates infantry units.": {
    it: "Addestra la fanteria.", es: "Entrena infantería.", pt: "Treina infantaria.",
    de: "Bildet Infanterie aus.", fr: "Forme l'infanterie." },
  "Stables": { it: "Stalla", es: "Establo", pt: "Estábulo", de: "Stall", fr: "Écurie" },
  "Creates cavalry units.": {
    it: "Addestra la cavalleria.", es: "Entrena caballería.", pt: "Treina cavalaria.",
    de: "Bildet Reiterei aus.", fr: "Forme la cavalerie." },
  "Fortress": { it: "Fortezza", es: "Fortaleza", pt: "Fortaleza", de: "Festung", fr: "Forteresse" },
  "Creates siege units. Archers can garrison.": {
    it: "Costruisce armi d'assedio. Gli arcieri possono presidiarla.",
    es: "Construye armas de asedio. Los arqueros pueden guarnecerla.",
    pt: "Constrói armas de cerco. Os arqueiros podem guarnecê-la.",
    de: "Baut Belagerungswaffen. Bogenschützen können sie besetzen.",
    fr: "Construit des engins de siège. Les archers peuvent y tenir garnison." },
  "Monastery": { it: "Monastero", es: "Monasterio", pt: "Mosteiro", de: "Kloster", fr: "Monastère" },
  "Heals the ally units nearby.": {
    it: "Cura le unità alleate vicine.", es: "Cura a las unidades aliadas cercanas.",
    pt: "Cura as unidades aliadas próximas.", de: "Heilt verbündete Einheiten in der Nähe.",
    fr: "Soigne les unités alliées proches." },
  "Tower": { it: "Torre", es: "Torre", pt: "Torre", de: "Turm", fr: "Tour" },
  "Defensive building with great visibility.": {
    it: "Edificio difensivo con grande visuale.", es: "Edificio defensivo con gran visibilidad.",
    pt: "Edifício defensivo com grande visibilidade.", de: "Verteidigungsbau mit großer Sichtweite.",
    fr: "Bâtiment défensif à grande visibilité." },
  "Farm": { it: "Campo", es: "Granja", pt: "Fazenda", de: "Feld", fr: "Ferme" },
  "Produces food resource when occupied by a worker.": {
    it: "Produce cibo quando un lavoratore lo coltiva.", es: "Produce comida cuando la ocupa un trabajador.",
    pt: "Produz comida quando ocupada por um trabalhador.", de: "Erzeugt Nahrung, wenn ein Arbeiter es bestellt.",
    fr: "Produit de la nourriture quand un ouvrier l'occupe." },
  "Wall": { it: "Mura", es: "Muralla", pt: "Muralha", de: "Mauer", fr: "Rempart" },
  "Structure that can be built in both directions. Press C to rotate while placing.": {
    it: "Si costruisce in entrambe le direzioni. Premi C mentre la piazzi per ruotarla.",
    es: "Se construye en ambas direcciones. Pulsa C al colocarla para girarla.",
    pt: "Pode ser construída nas duas direções. Pressione C ao posicionar para girá-la.",
    de: "Kann in beide Richtungen gebaut werden. Drücke C beim Platzieren zum Drehen.",
    fr: "Se construit dans les deux sens. Appuie sur C en le plaçant pour le tourner." },
  "Structure that can be built in both directions.": {
    it: "Si costruisce in entrambe le direzioni.", es: "Se construye en ambas direcciones.",
    pt: "Pode ser construída nas duas direções.", de: "Kann in beide Richtungen gebaut werden.",
    fr: "Se construit dans les deux sens." },
  "Gate": { it: "Porta", es: "Puerta", pt: "Portão", de: "Tor", fr: "Porte" },
  "Creates a self-opening gate in the wall.": {
    it: "Apre nelle mura una porta automatica.", es: "Crea en la muralla una puerta automática.",
    pt: "Cria na muralha um portão automático.", de: "Setzt ein selbstöffnendes Tor in die Mauer.",
    fr: "Crée dans le rempart une porte automatique." },
  "Worker": { it: "Lavoratore", es: "Trabajador", pt: "Trabalhador", de: "Arbeiter", fr: "Ouvrier" },
  "Gathers resources and builds the town.": {
    it: "Raccoglie risorse e costruisce la città.", es: "Recoge recursos y construye la ciudad.",
    pt: "Coleta recursos e constrói a cidade.", de: "Sammelt Rohstoffe und baut die Stadt.",
    fr: "Récolte des ressources et bâtit la ville." },
  "Cancel": { it: "Annulla", es: "Cancelar", pt: "Cancelar", de: "Abbrechen", fr: "Annuler" },
  "Cancel the last unit in the creation queue.": {
    it: "Annulla l'ultima unità in coda.", es: "Cancela la última unidad de la cola.",
    pt: "Cancela a última unidade da fila.", de: "Bricht die letzte Einheit der Warteschlange ab.",
    fr: "Annule la dernière unité de la file." },
  "Shortcut: {key}": { it: "Tasto: {key}", es: "Atajo: {key}", pt: "Atalho: {key}", de: "Taste: {key}", fr: "Touche : {key}" },

  // ------------------------------------------------------------- unita'
  "Warrior": { it: "Guerriero", es: "Guerrero", pt: "Guerreiro", de: "Krieger", fr: "Guerrier" },
  "Melee fighter good against all units.": {
    it: "Combattente corpo a corpo, buono contro tutti.", es: "Luchador cuerpo a cuerpo, bueno contra todos.",
    pt: "Lutador corpo a corpo, bom contra todos.", de: "Nahkämpfer, gut gegen alle Einheiten.",
    fr: "Combattant au corps à corps, bon contre tous." },
  "Pikeman": { it: "Picchiere", es: "Piquero", pt: "Piqueiro", de: "Pikenier", fr: "Piquier" },
  "Melee unit good against cavalry.": {
    it: "Corpo a corpo, buono contro la cavalleria.", es: "Cuerpo a cuerpo, bueno contra la caballería.",
    pt: "Corpo a corpo, bom contra a cavalaria.", de: "Nahkämpfer, gut gegen Reiterei.",
    fr: "Corps à corps, bon contre la cavalerie." },
  "Archer": { it: "Arciere", es: "Arquero", pt: "Arqueiro", de: "Bogenschütze", fr: "Archer" },
  "Ranged unit good against all units.": {
    it: "Tiratore, buono contro tutti.", es: "Tirador, bueno contra todos.", pt: "Atirador, bom contra todos.",
    de: "Fernkämpfer, gut gegen alle Einheiten.", fr: "Tireur, bon contre tous." },
  "Knight": { it: "Cavaliere", es: "Caballero", pt: "Cavaleiro", de: "Ritter", fr: "Chevalier" },
  "Fast unit, great against archers.": {
    it: "Veloce, ottimo contro gli arcieri.", es: "Rápido, excelente contra arqueros.",
    pt: "Rápido, ótimo contra arqueiros.", de: "Schnell, stark gegen Bogenschützen.",
    fr: "Rapide, excellent contre les archers." },
  "Siege Ram": { it: "Ariete", es: "Ariete", pt: "Aríete", de: "Rammbock", fr: "Bélier" },
  "Siege melee unit great against stone buildings.": {
    it: "Arma d'assedio, ottima contro gli edifici di pietra.", es: "Arma de asedio, excelente contra edificios de piedra.",
    pt: "Arma de cerco, ótima contra edifícios de pedra.", de: "Belagerungswaffe, stark gegen Steingebäude.",
    fr: "Engin de siège, excellent contre les bâtiments de pierre." },
  "Catapult": { it: "Catapulta", es: "Catapulta", pt: "Catapulta", de: "Katapult", fr: "Catapulte" },
  "Ranged siege unit good against all buildings.": {
    it: "Assedio a distanza, buona contro ogni edificio.", es: "Asedio a distancia, buena contra todo edificio.",
    pt: "Cerco à distância, boa contra qualquer edifício.", de: "Fernkampf-Belagerung, gut gegen alle Gebäude.",
    fr: "Siège à distance, bon contre tous les bâtiments." },
  "Aggressive": { it: "Aggressivo", es: "Agresivo", pt: "Agressivo", de: "Angriff", fr: "Offensif" },
  "Defensive": { it: "Difensivo", es: "Defensivo", pt: "Defensivo", de: "Verteidigung", fr: "Défensif" },
  "Military units engage enemy units in a fight at a greater distance.": {
    it: "I soldati attaccano i nemici anche da lontano.", es: "Los soldados atacan a los enemigos desde más lejos.",
    pt: "Os soldados atacam os inimigos de mais longe.", de: "Soldaten greifen Feinde schon aus größerer Entfernung an.",
    fr: "Les soldats engagent l'ennemi de plus loin." },
  "Military units engage enemy units in a fight only if they are nearby.": {
    it: "I soldati attaccano i nemici solo se sono vicini.", es: "Los soldados atacan a los enemigos solo si están cerca.",
    pt: "Os soldados atacam os inimigos só se estiverem perto.", de: "Soldaten greifen Feinde nur an, wenn sie nah sind.",
    fr: "Les soldats n'engagent l'ennemi que s'il est proche." },

  // --------------------------------------------------- interfaccia varia
  "FPS: {n}": { it: "FPS: {n}", es: "FPS: {n}", pt: "FPS: {n}", de: "FPS: {n}", fr: "FPS : {n}" },

  // -------------------------------------------------------------- obiettivi
  "Survive for the most time possible": {
    it: "Sopravvivi il più a lungo possibile", es: "Sobrevive el mayor tiempo posible",
    pt: "Sobreviva o máximo de tempo possível", de: "Überlebe so lange wie möglich",
    fr: "Survis le plus longtemps possible" },
  "Destroy the enemy secondary bases ({n}/3)": {
    it: "Distruggi le basi nemiche secondarie ({n}/3)", es: "Destruye las bases enemigas secundarias ({n}/3)",
    pt: "Destrua as bases inimigas secundárias ({n}/3)", de: "Zerstöre die feindlichen Nebenbasen ({n}/3)",
    fr: "Détruis les bases ennemies secondaires ({n}/3)" },
  "Survival time: {h} hrs {m} min {s} sec": {
    it: "Tempo di sopravvivenza: {h} h {m} min {s} s", es: "Tiempo sobrevivido: {h} h {m} min {s} s",
    pt: "Tempo sobrevivido: {h} h {m} min {s} s", de: "Überlebenszeit: {h} Std. {m} Min. {s} Sek.",
    fr: "Temps de survie : {h} h {m} min {s} s" },
  "Number of waves: {n}": { it: "Ondate: {n}", es: "Oleadas: {n}", pt: "Ondas: {n}", de: "Angriffswellen: {n}", fr: "Vagues : {n}" },
  "Reach the northern gates and escape the city": {
    it: "Raggiungi le porte a nord e fuggi dalla città", es: "Llega a las puertas del norte y escapa de la ciudad",
    pt: "Chegue aos portões do norte e fuja da cidade", de: "Erreiche die Nordtore und flieh aus der Stadt",
    fr: "Atteins les portes du nord et fuis la ville" },
  "Destroy the chests to gather resources": {
    it: "Distruggi le casse per raccogliere risorse", es: "Destruye los cofres para conseguir recursos",
    pt: "Destrua os baús para obter recursos", de: "Zerstöre die Truhen, um Rohstoffe zu sammeln",
    fr: "Détruis les coffres pour récolter des ressources" },
  "Use the barracks to train more soldiers": {
    it: "Usa le caserme per addestrare altri soldati", es: "Usa los cuarteles para entrenar más soldados",
    pt: "Use os quartéis para treinar mais soldados", de: "Nutze die Kasernen, um mehr Soldaten auszubilden",
    fr: "Utilise les casernes pour former plus de soldats" },
  "Free the villages under attack ({n}/7)": {
    it: "Libera i villaggi sotto attacco ({n}/7)", es: "Libera las aldeas atacadas ({n}/7)",
    pt: "Liberte as aldeias atacadas ({n}/7)", de: "Befreie die angegriffenen Dörfer ({n}/7)",
    fr: "Libère les villages attaqués ({n}/7)" },
  "Use the freed peasants to build your base": {
    it: "Costruisci la tua base con i contadini liberati", es: "Construye tu base con los campesinos liberados",
    pt: "Construa sua base com os camponeses libertados", de: "Baue mit den befreiten Bauern deine Basis",
    fr: "Bâtis ta base avec les paysans libérés" },
  "Destroy all the enemy buildings": {
    it: "Distruggi tutti gli edifici nemici", es: "Destruye todos los edificios enemigos",
    pt: "Destrua todos os edifícios inimigos", de: "Zerstöre alle feindlichen Gebäude",
    fr: "Détruis tous les bâtiments ennemis" },

  // ------------------------------------------------ vittoria e sconfitta
  "VICTORY": { it: "VITTORIA", es: "VICTORIA", pt: "VITÓRIA", de: "SIEG", fr: "VICTOIRE" },
  "You destroyed all the secondary enemy bases": {
    it: "Hai distrutto tutte le basi nemiche secondarie", es: "Has destruido todas las bases enemigas secundarias",
    pt: "Você destruiu todas as bases inimigas secundárias", de: "Du hast alle feindlichen Nebenbasen zerstört",
    fr: "Tu as détruit toutes les bases ennemies secondaires" },
  "Your partial score is {score}": {
    it: "Il tuo punteggio parziale è {score}", es: "Tu puntuación parcial es {score}",
    pt: "Sua pontuação parcial é {score}", de: "Dein Zwischenstand: {score}", fr: "Ton score partiel est de {score}" },
  "Code to unlock the next level:": {
    it: "Codice per sbloccare il livello successivo:", es: "Código para desbloquear el siguiente nivel:",
    pt: "Código para desbloquear o próximo nível:", de: "Code für das nächste Level:",
    fr: "Code pour débloquer le niveau suivant :" },
  "click anywhere to continue": {
    it: "clicca ovunque per continuare", es: "haz clic en cualquier sitio para continuar",
    pt: "clique em qualquer lugar para continuar", de: "klicke irgendwo, um fortzufahren",
    fr: "clique n'importe où pour continuer" },
  "Your town hall was destroyed.": {
    it: "Il tuo municipio è stato distrutto.", es: "Tu ayuntamiento ha sido destruido.",
    pt: "Sua prefeitura foi destruída.", de: "Dein Rathaus wurde zerstört.", fr: "Ton hôtel de ville a été détruit." },
  "You resisted for {h} hours, {m} minutes and {s} seconds.": {
    it: "Hai resistito {h} ore, {m} minuti e {s} secondi.", es: "Resististe {h} horas, {m} minutos y {s} segundos.",
    pt: "Você resistiu {h} horas, {m} minutos e {s} segundos.", de: "Du hast {h} Stunden, {m} Minuten und {s} Sekunden durchgehalten.",
    fr: "Tu as résisté {h} heures, {m} minutes et {s} secondes." },
  "{n} enemy bases were successfully destroyed.": {
    it: "Basi nemiche distrutte: {n}.", es: "Bases enemigas destruidas: {n}.", pt: "Bases inimigas destruídas: {n}.",
    de: "Zerstörte feindliche Basen: {n}.", fr: "Bases ennemies détruites : {n}." },
  "The final score is {score}": {
    it: "Il punteggio finale è {score}", es: "La puntuación final es {score}", pt: "A pontuação final é {score}",
    de: "Endpunktzahl: {score}", fr: "Le score final est de {score}" },

  // ----------------------------------------------------------- suggerimenti
  "Hints": { it: "Suggerimenti", es: "Consejos", pt: "Dicas", de: "Tipps", fr: "Conseils" },
  "Windows like this one will appear to help you. Click on a hint window for the next step. Press H to disable or enable all hint windows.": {
    it: "Finestre come questa compariranno per aiutarti. Clicca su un suggerimento per passare al successivo. Premi H per nascondere o mostrare i suggerimenti.",
    es: "Ventanas como esta aparecerán para ayudarte. Haz clic en un consejo para pasar al siguiente. Pulsa H para ocultar o mostrar los consejos.",
    pt: "Janelas como esta aparecerão para ajudar você. Clique numa dica para passar à próxima. Pressione H para ocultar ou mostrar as dicas.",
    de: "Fenster wie dieses erscheinen, um dir zu helfen. Klicke auf einen Tipp für den nächsten Schritt. Drücke H, um die Tipps aus- oder einzublenden.",
    fr: "Des fenêtres comme celle-ci apparaîtront pour t'aider. Clique sur un conseil pour passer au suivant. Appuie sur H pour masquer ou afficher les conseils." },
  "Visualization": { it: "Visuale", es: "Vista", pt: "Visão", de: "Ansicht", fr: "Vue" },
  "Move your mouse close to the borders to navigate the map. You can also use arrow keys. Zoom in and out with the mouse wheel or the Z and X keys. Press F10 (Cmd+F on Mac) to switch to fullscreen mode.": {
    it: "Avvicina il mouse ai bordi per spostarti sulla mappa, o usa le frecce. Usa la rotella del mouse o Z e X per lo zoom. Premi F10 (Cmd+F su Mac) per lo schermo intero.",
    es: "Acerca el ratón a los bordes para moverte por el mapa, o usa las flechas. Usa la rueda del ratón o Z y X para el zoom. Pulsa F10 (Cmd+F en Mac) para la pantalla completa.",
    pt: "Aproxime o mouse das bordas para se mover pelo mapa, ou use as setas. Use a roda do mouse ou Z e X para o zoom. Pressione F10 (Cmd+F no Mac) para a tela cheia.",
    de: "Bewege die Maus an den Rand, um über die Karte zu scrollen, oder nutze die Pfeiltasten. Zoome mit dem Mausrad oder mit Z und X. Drücke F10 (Cmd+F am Mac) für den Vollbildmodus.",
    fr: "Approche la souris des bords pour parcourir la carte, ou utilise les flèches. Zoome avec la molette de la souris ou avec Z et X. Appuie sur F10 (Cmd+F sur Mac) pour le plein écran." },
  "Resources": { it: "Risorse", es: "Recursos", pt: "Recursos", de: "Rohstoffe", fr: "Ressources" },
  "On top of the screen you will find the resource tree. Gather resources with your workers to expand your city and build a powerful army.": {
    it: "In alto trovi le tue risorse. Raccoglile con i lavoratori per ingrandire la città e creare un esercito potente.",
    es: "Arriba encontrarás tus recursos. Recógelos con los trabajadores para ampliar la ciudad y crear un ejército poderoso.",
    pt: "No alto você encontra seus recursos. Colete-os com os trabalhadores para expandir a cidade e criar um exército poderoso.",
    de: "Oben siehst du deine Rohstoffe. Sammle sie mit deinen Arbeitern, um die Stadt zu vergrößern und ein starkes Heer aufzustellen.",
    fr: "En haut se trouvent tes ressources. Récolte-les avec tes ouvriers pour agrandir la ville et bâtir une armée puissante." },
  "Idling workers": { it: "Lavoratori inattivi", es: "Trabajadores inactivos", pt: "Trabalhadores ociosos", de: "Untätige Arbeiter", fr: "Ouvriers inactifs" },
  "On top right of the screen you can monitor how many workers are idling. Click the button or press the spacebar to select them.": {
    it: "In alto a destra vedi quanti lavoratori sono inattivi. Clicca il pulsante o premi la barra spaziatrice per selezionarli.",
    es: "Arriba a la derecha ves cuántos trabajadores están inactivos. Haz clic en el botón o pulsa la barra espaciadora para seleccionarlos.",
    pt: "No canto superior direito você vê quantos trabalhadores estão ociosos. Clique no botão ou pressione a barra de espaço para selecioná-los.",
    de: "Oben rechts siehst du, wie viele Arbeiter untätig sind. Klicke auf die Schaltfläche oder drücke die Leertaste, um sie auszuwählen.",
    fr: "En haut à droite, tu vois combien d'ouvriers sont inactifs. Clique sur le bouton ou appuie sur la barre d'espace pour les sélectionner." },
  "Objectives": { it: "Obiettivi", es: "Objetivos", pt: "Objetivos", de: "Ziele", fr: "Objectifs" },
  "Next to it, you can find the objectives of the current map. Complete them to win the level.": {
    it: "Qui accanto trovi gli obiettivi della mappa. Completali per vincere il livello.",
    es: "Aquí al lado están los objetivos del mapa. Cúmplelos para ganar el nivel.",
    pt: "Aqui ao lado estão os objetivos do mapa. Cumpra-os para vencer o nível.",
    de: "Daneben stehen die Ziele der Karte. Erfülle sie, um das Level zu gewinnen.",
    fr: "Juste à côté se trouvent les objectifs de la carte. Remplis-les pour gagner le niveau." },
  "For this demo, the goal is to survive as long as possible and to destroy the enemies' bases. Press O to hide the objectives' window.": {
    it: "In questa demo lo scopo è sopravvivere il più a lungo possibile e distruggere le basi nemiche. Premi O per nascondere gli obiettivi.",
    es: "En esta demo el objetivo es sobrevivir el mayor tiempo posible y destruir las bases enemigas. Pulsa O para ocultar los objetivos.",
    pt: "Nesta demo o objetivo é sobreviver o máximo possível e destruir as bases inimigas. Pressione O para ocultar os objetivos.",
    de: "In dieser Demo musst du so lange wie möglich überleben und die feindlichen Basen zerstören. Drücke O, um die Ziele auszublenden.",
    fr: "Dans cette démo, le but est de survivre le plus longtemps possible et de détruire les bases ennemies. Appuie sur O pour masquer les objectifs." },
  "Minimap": { it: "Minimappa", es: "Minimapa", pt: "Minimapa", de: "Minikarte", fr: "Mini-carte" },
  "On the bottom left of the screen you can see the minimap, showing your buildings, units, the visible resources and the enemies. Press M to hide/view the minimap. Press Ctrl+Z and Ctrl+X to regulate the minimap size.": {
    it: "In basso a sinistra c'è la minimappa, con edifici, unità, risorse visibili e nemici. Premi M per nasconderla o mostrarla, Ctrl+Z e Ctrl+X per cambiarne la grandezza.",
    es: "Abajo a la izquierda está el minimapa, con edificios, unidades, recursos visibles y enemigos. Pulsa M para ocultarlo o mostrarlo, Ctrl+Z y Ctrl+X para cambiar su tamaño.",
    pt: "No canto inferior esquerdo fica o minimapa, com edifícios, unidades, recursos visíveis e inimigos. Pressione M para ocultá-lo ou mostrá-lo, Ctrl+Z e Ctrl+X para mudar o tamanho.",
    de: "Unten links ist die Minikarte mit Gebäuden, Einheiten, sichtbaren Rohstoffen und Feinden. Drücke M zum Aus- und Einblenden, Strg+Z und Strg+X für die Größe.",
    fr: "En bas à gauche se trouve la mini-carte, avec bâtiments, unités, ressources visibles et ennemis. Appuie sur M pour la masquer ou l'afficher, Ctrl+Z et Ctrl+X pour sa taille." },
  "Selection and movement": { it: "Selezione e movimento", es: "Selección y movimiento", pt: "Seleção e movimento", de: "Auswahl und Bewegung", fr: "Sélection et déplacement" },
  "Left click on a unit to select it. Left click on an empty point on the map to clear the selection. While a unit is selected right click anywhere to move the unit in that direction.": {
    it: "Clic sinistro su un'unità per selezionarla, su un punto vuoto per deselezionare. Con un'unità selezionata, clic destro in un punto per mandarla lì.",
    es: "Clic izquierdo en una unidad para seleccionarla, en un punto vacío para deseleccionar. Con una unidad seleccionada, clic derecho en un punto para mandarla allí.",
    pt: "Clique esquerdo numa unidade para selecioná-la, num ponto vazio para limpar a seleção. Com uma unidade selecionada, clique direito num ponto para enviá-la até lá.",
    de: "Linksklick auf eine Einheit wählt sie aus, Linksklick auf eine leere Stelle hebt die Auswahl auf. Mit Rechtsklick schickst du die ausgewählte Einheit dorthin.",
    fr: "Clic gauche sur une unité pour la sélectionner, sur un point vide pour désélectionner. Avec une unité sélectionnée, clic droit sur un point pour l'y envoyer." },
  "Resources gathering": { it: "Raccolta delle risorse", es: "Recolección de recursos", pt: "Coleta de recursos", de: "Rohstoffe sammeln", fr: "Récolte des ressources" },
  "Use your workers to gather resources. With at least one worker selected right click on a resource to start collecting it.": {
    it: "Usa i lavoratori per raccogliere risorse. Con almeno un lavoratore selezionato, clic destro su una risorsa per iniziare la raccolta.",
    es: "Usa a los trabajadores para recoger recursos. Con al menos un trabajador seleccionado, clic derecho en un recurso para empezar a recogerlo.",
    pt: "Use os trabalhadores para coletar recursos. Com pelo menos um trabalhador selecionado, clique direito num recurso para começar a coleta.",
    de: "Sammle Rohstoffe mit deinen Arbeitern. Wähle mindestens einen Arbeiter aus und klicke mit rechts auf einen Rohstoff.",
    fr: "Utilise tes ouvriers pour récolter. Avec au moins un ouvrier sélectionné, clic droit sur une ressource pour commencer la récolte." },
  "Buildings": { it: "Edifici", es: "Edificios", pt: "Edifícios", de: "Gebäude", fr: "Bâtiments" },
  "Your workers can also build structures to expand your town. While a worker is selected, choose from a building on the top left of your screen and place it in an empty space. This is possible only if you have the amount of resources needed.": {
    it: "I lavoratori possono anche costruire per ingrandire la città. Con un lavoratore selezionato, scegli un edificio in alto a sinistra e piazzalo in uno spazio libero, se hai le risorse necessarie.",
    es: "Los trabajadores también pueden construir para ampliar la ciudad. Con un trabajador seleccionado, elige un edificio arriba a la izquierda y colócalo en un espacio libre, si tienes los recursos necesarios.",
    pt: "Os trabalhadores também podem construir para expandir a cidade. Com um trabalhador selecionado, escolha um edifício no canto superior esquerdo e coloque-o num espaço livre, se tiver os recursos necessários.",
    de: "Arbeiter können auch bauen, um die Stadt zu erweitern. Wähle einen Arbeiter, dann oben links ein Gebäude, und setze es auf einen freien Platz, wenn du genug Rohstoffe hast.",
    fr: "Tes ouvriers peuvent aussi construire pour agrandir la ville. Avec un ouvrier sélectionné, choisis un bâtiment en haut à gauche et place-le sur un espace libre, si tu as les ressources nécessaires." },
  "Repairing buildings": { it: "Riparare gli edifici", es: "Reparar edificios", pt: "Reparar edifícios", de: "Gebäude reparieren", fr: "Réparer les bâtiments" },
  "The more workers you use on a construction site the faster the building will grow. You can also right click with workers selected on a damaged building to stop fires and to repair it from damages.": {
    it: "Più lavoratori metti in un cantiere, più in fretta cresce l'edificio. Con i lavoratori selezionati, clic destro su un edificio danneggiato per spegnere il fuoco e ripararlo.",
    es: "Cuantos más trabajadores pongas en una obra, más rápido crece el edificio. Con trabajadores seleccionados, clic derecho en un edificio dañado para apagar el fuego y repararlo.",
    pt: "Quanto mais trabalhadores numa obra, mais rápido o edifício cresce. Com trabalhadores selecionados, clique direito num edifício danificado para apagar o fogo e repará-lo.",
    de: "Je mehr Arbeiter an einer Baustelle, desto schneller wächst das Gebäude. Mit Rechtsklick auf ein beschädigtes Gebäude löschen und reparieren deine Arbeiter es.",
    fr: "Plus il y a d'ouvriers sur un chantier, plus le bâtiment monte vite. Avec des ouvriers sélectionnés, clic droit sur un bâtiment endommagé pour éteindre le feu et le réparer." },
  "Units creation": { it: "Creare unità", es: "Crear unidades", pt: "Criar unidades", de: "Einheiten erschaffen", fr: "Créer des unités" },
  "Some structures can create units. When you click on those structures a menu will appear on the top of the screen. Creating units consumes resources.": {
    it: "Alcuni edifici creano unità: cliccandoli compare un menu in alto. Creare unità costa risorse.",
    es: "Algunos edificios crean unidades: al hacer clic en ellos aparece un menú arriba. Crear unidades cuesta recursos.",
    pt: "Alguns edifícios criam unidades: ao clicar neles aparece um menu no alto. Criar unidades custa recursos.",
    de: "Manche Gebäude erschaffen Einheiten: Klickst du sie an, erscheint oben ein Menü. Einheiten kosten Rohstoffe.",
    fr: "Certains bâtiments créent des unités : en cliquant dessus, un menu apparaît en haut. Créer des unités coûte des ressources." },
  "Shortcuts and undoing creation": { it: "Scorciatoie e annullare", es: "Atajos y cancelar", pt: "Atalhos e cancelar", de: "Tasten und Abbrechen", fr: "Raccourcis et annulation" },
  "You can also use shortcuts to create units. If you change your mind while the process is ongoing, press the back button near the units creation buttons to have your resources back.": {
    it: "Puoi creare le unità anche con i tasti. Se cambi idea durante la creazione, premi il pulsante indietro accanto ai pulsanti delle unità e riavrai le risorse.",
    es: "También puedes crear unidades con atajos. Si cambias de idea durante la creación, pulsa el botón de volver junto a los botones de unidades y recuperarás los recursos.",
    pt: "Você também pode criar unidades com atalhos. Se mudar de ideia durante a criação, pressione o botão voltar ao lado dos botões de unidades para recuperar os recursos.",
    de: "Einheiten kannst du auch per Taste erschaffen. Überlegst du es dir anders, drücke die Zurück-Schaltfläche neben den Einheiten und du bekommst die Rohstoffe zurück.",
    fr: "Tu peux aussi créer des unités avec des raccourcis. Si tu changes d'avis pendant la création, appuie sur le bouton retour près des unités pour récupérer tes ressources." },
  "Directions for new units": { it: "Destinazione delle nuove unità", es: "Destino de las nuevas unidades", pt: "Destino das novas unidades", de: "Ziel neuer Einheiten", fr: "Destination des nouvelles unités" },
  "Right click anywhere while a structure creating units is selected to target a direction that new units will follow once created.": {
    it: "Con un edificio che crea unità selezionato, clic destro in un punto per indicare dove andranno le nuove unità.",
    es: "Con un edificio que crea unidades seleccionado, clic derecho en un punto para indicar adónde irán las nuevas unidades.",
    pt: "Com um edifício que cria unidades selecionado, clique direito num ponto para indicar para onde irão as novas unidades.",
    de: "Ist ein Gebäude ausgewählt, das Einheiten erschafft, legst du mit Rechtsklick fest, wohin neue Einheiten gehen.",
    fr: "Avec un bâtiment qui crée des unités sélectionné, clic droit sur un point pour indiquer où iront les nouvelles unités." },
  "Trees - Wood resource": { it: "Alberi - Legno", es: "Árboles - Madera", pt: "Árvores - Madeira", de: "Bäume - Holz", fr: "Arbres - Bois" },
  "Right click on trees with workers selected to start collecting wood. Workers will then store wood in warehouses.": {
    it: "Clic destro sugli alberi con i lavoratori selezionati per raccogliere legno. I lavoratori lo porteranno nei magazzini.",
    es: "Clic derecho en los árboles con trabajadores seleccionados para recoger madera. La llevarán a los almacenes.",
    pt: "Clique direito nas árvores com trabalhadores selecionados para coletar madeira. Eles a levarão aos armazéns.",
    de: "Rechtsklick auf Bäume mit ausgewählten Arbeitern, um Holz zu sammeln. Sie bringen es ins Lagerhaus.",
    fr: "Clic droit sur les arbres avec des ouvriers sélectionnés pour récolter du bois. Ils le porteront aux entrepôts." },
  "Mines - Gold resource": { it: "Miniere - Oro", es: "Minas - Oro", pt: "Minas - Ouro", de: "Minen - Gold", fr: "Mines - Or" },
  "Right click on a mine with workers selected to start collecting gold. Workers will then store the resource in warehouses.": {
    it: "Clic destro su una miniera con i lavoratori selezionati per raccogliere oro. I lavoratori lo porteranno nei magazzini.",
    es: "Clic derecho en una mina con trabajadores seleccionados para recoger oro. Lo llevarán a los almacenes.",
    pt: "Clique direito numa mina com trabalhadores selecionados para coletar ouro. Eles o levarão aos armazéns.",
    de: "Rechtsklick auf eine Mine mit ausgewählten Arbeitern, um Gold zu sammeln. Sie bringen es ins Lagerhaus.",
    fr: "Clic droit sur une mine avec des ouvriers sélectionnés pour récolter de l'or. Ils le porteront aux entrepôts." },
  "Ruins - Stone resource": { it: "Rovine - Pietra", es: "Ruinas - Piedra", pt: "Ruínas - Pedra", de: "Ruinen - Stein", fr: "Ruines - Pierre" },
  "Right click on ruins with workers selected to start collecting stone. Workers will then store it in warehouses.": {
    it: "Clic destro sulle rovine con i lavoratori selezionati per raccogliere pietra. I lavoratori la porteranno nei magazzini.",
    es: "Clic derecho en las ruinas con trabajadores seleccionados para recoger piedra. La llevarán a los almacenes.",
    pt: "Clique direito nas ruínas com trabalhadores selecionados para coletar pedra. Eles a levarão aos armazéns.",
    de: "Rechtsklick auf Ruinen mit ausgewählten Arbeitern, um Stein zu sammeln. Sie bringen ihn ins Lagerhaus.",
    fr: "Clic droit sur les ruines avec des ouvriers sélectionnés pour récolter de la pierre. Ils la porteront aux entrepôts." },
  "Farms - Food resource": { it: "Campi - Cibo", es: "Granjas - Comida", pt: "Fazendas - Comida", de: "Felder - Nahrung", fr: "Fermes - Nourriture" },
  "Right click on a farm with a worker selected to start collecting food. If you click with multiple workers, they will reallocate in free farms. Food will be stored in barns.": {
    it: "Clic destro su un campo con un lavoratore selezionato per raccogliere cibo. Con più lavoratori, si divideranno tra i campi liberi. Il cibo va nei mulini.",
    es: "Clic derecho en una granja con un trabajador seleccionado para recoger comida. Con varios, se repartirán entre las granjas libres. La comida va a los molinos.",
    pt: "Clique direito numa fazenda com um trabalhador selecionado para coletar comida. Com vários, eles se dividirão entre as fazendas livres. A comida vai para os moinhos.",
    de: "Rechtsklick auf ein Feld mit einem ausgewählten Arbeiter, um Nahrung zu sammeln. Mehrere Arbeiter verteilen sich auf freie Felder. Die Nahrung kommt in die Mühlen.",
    fr: "Clic droit sur une ferme avec un ouvrier sélectionné pour récolter de la nourriture. Avec plusieurs, ils se répartiront sur les fermes libres. La nourriture va aux moulins." },
  "Houses - Population": { it: "Case - Popolazione", es: "Casas - Población", pt: "Casas - População", de: "Häuser - Bevölkerung", fr: "Maisons - Population" },
  "Creating units requires population resource to be below its total capacity. Build more houses to increase the population capacity.": {
    it: "Per creare unità la popolazione deve essere sotto il limite. Costruisci altre case per alzarlo.",
    es: "Para crear unidades la población debe estar por debajo del límite. Construye más casas para aumentarlo.",
    pt: "Para criar unidades a população deve estar abaixo do limite. Construa mais casas para aumentá-lo.",
    de: "Neue Einheiten gibt es nur unter der Bevölkerungsgrenze. Baue mehr Häuser, um sie zu erhöhen.",
    fr: "Pour créer des unités, la population doit être sous la limite. Construis plus de maisons pour l'augmenter." },
  "Garrison": { it: "Presidio", es: "Guarnición", pt: "Guarnição", de: "Besatzung", fr: "Garnison" },
  "Towers and castles can shoot arrows if you move archers inside them. More archers inside equals more arrows.": {
    it: "Torri e castelli tirano frecce se ci fai entrare degli arcieri. Più arcieri, più frecce.",
    es: "Torres y castillos disparan flechas si metes arqueros dentro. Más arqueros, más flechas.",
    pt: "Torres e castelos disparam flechas se você colocar arqueiros dentro. Mais arqueiros, mais flechas.",
    de: "Türme und Burgen schießen Pfeile, wenn du Bogenschützen hineinschickst. Mehr Schützen, mehr Pfeile.",
    fr: "Tours et châteaux tirent des flèches si tu y fais entrer des archers. Plus d'archers, plus de flèches." },
  "Attacking enemies": { it: "Attaccare i nemici", es: "Atacar enemigos", pt: "Atacar inimigos", de: "Feinde angreifen", fr: "Attaquer l'ennemi" },
  "With military units selected right click on enemy units to order your soldiers to engage in combat with them.": {
    it: "Con i soldati selezionati, clic destro sui nemici per ordinare l'attacco.",
    es: "Con soldados seleccionados, clic derecho en los enemigos para ordenar el ataque.",
    pt: "Com soldados selecionados, clique direito nos inimigos para ordenar o ataque.",
    de: "Mit ausgewählten Soldaten klickst du mit rechts auf Feinde, um sie anzugreifen.",
    fr: "Avec des soldats sélectionnés, clic droit sur l'ennemi pour ordonner l'attaque." },
  "On fire!": { it: "A fuoco!", es: "¡Fuego!", pt: "Fogo!", de: "Feuer!", fr: "Au feu !" },
  "With infantry units selected (warriors and spearmen) right click on an enemy building to order your soldiers to set it on fire.": {
    it: "Con la fanteria selezionata (guerrieri e picchieri), clic destro su un edificio nemico per dargli fuoco.",
    es: "Con infantería seleccionada (guerreros y piqueros), clic derecho en un edificio enemigo para incendiarlo.",
    pt: "Com infantaria selecionada (guerreiros e piqueiros), clique direito num edifício inimigo para incendiá-lo.",
    de: "Mit ausgewählter Infanterie (Krieger und Pikeniere) klickst du mit rechts auf ein feindliches Gebäude, um es anzuzünden.",
    fr: "Avec de l'infanterie sélectionnée (guerriers et piquiers), clic droit sur un bâtiment ennemi pour l'incendier." },
  "Not on fire": { it: "Niente fuoco", es: "Sin fuego", pt: "Sem fogo", de: "Kein Feuer", fr: "Pas de feu" },
  "Stone buildings (towers, walls, castles) cannot be set on fire, so you will need warmachines like catapults or siege rams in order to destroy them.": {
    it: "Gli edifici di pietra (torri, mura, castelli) non bruciano: per distruggerli servono catapulte o arieti.",
    es: "Los edificios de piedra (torres, murallas, castillos) no arden: para destruirlos hacen falta catapultas o arietes.",
    pt: "Edifícios de pedra (torres, muralhas, castelos) não queimam: para destruí-los são precisas catapultas ou aríetes.",
    de: "Steingebäude (Türme, Mauern, Burgen) brennen nicht: Dafür brauchst du Katapulte oder Rammböcke.",
    fr: "Les bâtiments de pierre (tours, remparts, châteaux) ne brûlent pas : il faut des catapultes ou des béliers pour les détruire." },
  "Multiple selection": { it: "Selezione multipla", es: "Selección múltiple", pt: "Seleção múltipla", de: "Mehrfachauswahl", fr: "Sélection multiple" },
  "Double click on a unit to select all your units of the same type in your screenspace. Left click and drag to select multiple units.": {
    it: "Doppio clic su un'unità per selezionare tutte quelle dello stesso tipo sullo schermo. Clicca e trascina per selezionarne diverse.",
    es: "Doble clic en una unidad para seleccionar todas las del mismo tipo en pantalla. Haz clic y arrastra para seleccionar varias.",
    pt: "Clique duplo numa unidade para selecionar todas do mesmo tipo na tela. Clique e arraste para selecionar várias.",
    de: "Doppelklick auf eine Einheit wählt alle gleichen auf dem Bildschirm aus. Klicke und ziehe, um mehrere auszuwählen.",
    fr: "Double-clic sur une unité pour sélectionner toutes celles du même type à l'écran. Clique et fais glisser pour en sélectionner plusieurs." },
  "Press Ctrl + left click to add units to the selection, Alt + left click to remove them. Press Ctrl + numbers (digits) to assign a quick selection number to a group.": {
    it: "Ctrl + clic sinistro aggiunge unità alla selezione, Alt + clic sinistro le toglie. Ctrl + un numero assegna un gruppo di selezione rapida.",
    es: "Ctrl + clic izquierdo añade unidades a la selección, Alt + clic izquierdo las quita. Ctrl + un número asigna un grupo de selección rápida.",
    pt: "Ctrl + clique esquerdo adiciona unidades à seleção, Alt + clique esquerdo as remove. Ctrl + um número atribui um grupo de seleção rápida.",
    de: "Strg + Linksklick fügt Einheiten hinzu, Alt + Linksklick entfernt sie. Strg + Ziffer speichert eine Gruppe zur Schnellauswahl.",
    fr: "Ctrl + clic gauche ajoute des unités à la sélection, Alt + clic gauche les retire. Ctrl + un chiffre crée un groupe de sélection rapide." },
  "Night": { it: "Notte", es: "Noche", pt: "Noite", de: "Nacht", fr: "Nuit" },
  "At night visibility is reduced. Enemies will attack only when they are closer as their visibility is reduced as well.": {
    it: "Di notte si vede meno. I nemici attaccano solo da più vicino, perché anche loro vedono meno.",
    es: "De noche se ve menos. Los enemigos solo atacan desde más cerca, porque también ven menos.",
    pt: "À noite se vê menos. Os inimigos só atacam de mais perto, porque também veem menos.",
    de: "Nachts sieht man weniger weit. Feinde greifen erst aus der Nähe an, denn auch sie sehen weniger.",
    fr: "La nuit, on voit moins loin. L'ennemi n'attaque que de plus près, car il voit moins lui aussi." },

  // ------------------------------------------------------------- dialoghi
  "Soldier 1": { it: "Soldato 1", es: "Soldado 1", pt: "Soldado 1", de: "Soldat 1", fr: "Soldat 1" },
  "Soldier 2": { it: "Soldato 2", es: "Soldado 2", pt: "Soldado 2", de: "Soldat 2", fr: "Soldat 2" },
  "Soldier": { it: "Soldato", es: "Soldado", pt: "Soldado", de: "Soldat", fr: "Soldat" },
  "Enemy soldier": { it: "Soldato nemico", es: "Soldado enemigo", pt: "Soldado inimigo", de: "Feindlicher Soldat", fr: "Soldat ennemi" },
  "Villager": { it: "Abitante", es: "Aldeano", pt: "Aldeão", de: "Dorfbewohner", fr: "Villageois" },
  "Villagers": { it: "Abitanti", es: "Aldeanos", pt: "Aldeões", de: "Dorfbewohner", fr: "Villageois" },
  "Survived villager": { it: "Sopravvissuto", es: "Superviviente", pt: "Sobrevivente", de: "Überlebender", fr: "Survivant" },
  "Lumberjacks": { it: "Taglialegna", es: "Leñadores", pt: "Lenhadores", de: "Holzfäller", fr: "Bûcherons" },
  "Gold miners": { it: "Minatori", es: "Mineros", pt: "Mineiros", de: "Goldgräber", fr: "Mineurs" },
  "Sacred statues": { it: "Statue sacre", es: "Estatuas sagradas", pt: "Estátuas sagradas", de: "Heilige Statuen", fr: "Statues sacrées" },
  "It's over... The enemy has taken most of the city, they're burning every building to the ground!": {
    it: "È finita... Il nemico ha preso quasi tutta la città e sta bruciando ogni edificio!",
    es: "Se acabó... ¡El enemigo ha tomado casi toda la ciudad y está quemando cada edificio!",
    pt: "Acabou... O inimigo tomou quase toda a cidade e está queimando cada edifício!",
    de: "Es ist vorbei... Der Feind hat fast die ganze Stadt eingenommen und brennt jedes Gebäude nieder!",
    fr: "C'est fini... L'ennemi a pris presque toute la ville et brûle chaque bâtiment !" },
  "Not yet... we can still gather an army, break through the gate to the north and escape the city": {
    it: "Non ancora... possiamo ancora radunare un esercito, sfondare la porta a nord e fuggire dalla città",
    es: "Todavía no... aún podemos reunir un ejército, romper la puerta del norte y escapar de la ciudad",
    pt: "Ainda não... ainda podemos reunir um exército, romper o portão do norte e fugir da cidade",
    de: "Noch nicht... Wir können noch ein Heer sammeln, das Nordtor durchbrechen und aus der Stadt fliehen",
    fr: "Pas encore... on peut encore réunir une armée, forcer la porte du nord et fuir la ville" },
  "You're right! We'll find the resources we need in the city, but we have to be careful and choose our crossroads wisely!": {
    it: "Hai ragione! Troveremo in città le risorse che ci servono, ma dobbiamo stare attenti e scegliere bene la strada!",
    es: "¡Tienes razón! Encontraremos en la ciudad los recursos que necesitamos, ¡pero hay que ir con cuidado y elegir bien el camino!",
    pt: "Você tem razão! Vamos encontrar na cidade os recursos de que precisamos, mas temos de ter cuidado e escolher bem o caminho!",
    de: "Du hast recht! In der Stadt finden wir, was wir brauchen, aber wir müssen vorsichtig sein und unseren Weg klug wählen!",
    fr: "Tu as raison ! On trouvera en ville les ressources qu'il nous faut, mais il faut être prudents et bien choisir notre chemin !" },
  "Look at those chests, we could probably find something in there...": {
    it: "Guarda quelle casse, forse dentro troviamo qualcosa...", es: "Mira esos cofres, seguro que encontramos algo dentro...",
    pt: "Olhe esses baús, talvez a gente encontre algo dentro...", de: "Sieh dir die Truhen an, vielleicht finden wir darin etwas...",
    fr: "Regarde ces coffres, on pourrait y trouver quelque chose..." },
  "Kill them! No one will survive!": {
    it: "Uccideteli! Nessuno sopravviverà!", es: "¡Matadlos! ¡Nadie sobrevivirá!", pt: "Matem-nos! Ninguém vai sobreviver!",
    de: "Tötet sie! Niemand wird überleben!", fr: "Tuez-les ! Personne ne survivra !" },
  "Our citizens gifted us gold. Also, we could use those barracks to train more soldiers!": {
    it: "I cittadini ci hanno donato dell'oro. E possiamo usare quelle caserme per addestrare altri soldati!",
    es: "Los ciudadanos nos han regalado oro. ¡Y podemos usar esos cuarteles para entrenar más soldados!",
    pt: "Os cidadãos nos deram ouro. E podemos usar esses quartéis para treinar mais soldados!",
    de: "Die Bürger haben uns Gold geschenkt. Und in den Kasernen können wir mehr Soldaten ausbilden!",
    fr: "Les citoyens nous ont offert de l'or. Et on peut utiliser ces casernes pour former plus de soldats !" },
  "We've taken control of the stables! We can train knights now": {
    it: "Abbiamo preso le stalle! Ora possiamo addestrare cavalieri", es: "¡Hemos tomado los establos! Ahora podemos entrenar caballeros",
    pt: "Tomamos os estábulos! Agora podemos treinar cavaleiros", de: "Wir haben die Ställe erobert! Jetzt können wir Ritter ausbilden",
    fr: "On a pris les écuries ! On peut maintenant former des chevaliers" },
  "Fight for your freedom! We are almost there!": {
    it: "Combattete per la libertà! Ci siamo quasi!", es: "¡Luchad por vuestra libertad! ¡Ya casi estamos!",
    pt: "Lutem pela liberdade! Estamos quase lá!", de: "Kämpft für eure Freiheit! Wir sind fast da!",
    fr: "Battez-vous pour votre liberté ! On y est presque !" },
  "It's done! We are out!": {
    it: "Ce l'abbiamo fatta! Siamo fuori!", es: "¡Lo logramos! ¡Estamos fuera!", pt: "Conseguimos! Estamos fora!",
    de: "Geschafft! Wir sind draußen!", fr: "C'est fait ! On est dehors !" },
  "HELP!!!": { it: "AIUTO!!!", es: "¡¡¡SOCORRO!!!", pt: "SOCORRO!!!", de: "HILFE!!!", fr: "AU SECOURS !!!" },
  "Thank you for saving us! The invader's army is kidnapping villagers from the countryside!": {
    it: "Grazie per averci salvato! L'esercito invasore sta rapendo gli abitanti delle campagne!",
    es: "¡Gracias por salvarnos! ¡El ejército invasor está secuestrando a los aldeanos del campo!",
    pt: "Obrigado por nos salvar! O exército invasor está sequestrando os aldeões do campo!",
    de: "Danke für unsere Rettung! Das feindliche Heer verschleppt die Dorfbewohner vom Land!",
    fr: "Merci de nous avoir sauvés ! L'armée d'invasion enlève les villageois des campagnes !" },
  "What? This is impossible! We must stop them!": {
    it: "Cosa? È impossibile! Dobbiamo fermarli!", es: "¿Qué? ¡Es imposible! ¡Tenemos que detenerlos!",
    pt: "O quê? É impossível! Temos de detê-los!", de: "Was? Das ist unmöglich! Wir müssen sie aufhalten!",
    fr: "Quoi ? C'est impossible ! Il faut les arrêter !" },
  "We will help you! I'm sure that if you free other villages the inhabitants will be grateful to you.": {
    it: "Ti aiuteremo! Sono sicuro che, se liberi altri villaggi, gli abitanti te ne saranno grati.",
    es: "¡Te ayudaremos! Seguro que si liberas otras aldeas, sus habitantes te lo agradecerán.",
    pt: "Vamos ajudar você! Tenho certeza de que, se libertar outras aldeias, os moradores serão gratos.",
    de: "Wir helfen dir! Wenn du andere Dörfer befreist, werden die Bewohner dir sicher dankbar sein.",
    fr: "On va t'aider ! Si tu libères d'autres villages, leurs habitants t'en seront reconnaissants." },
  "You can use our structures. We will also help build new ones!": {
    it: "Puoi usare i nostri edifici. Ti aiuteremo anche a costruirne di nuovi!",
    es: "Puedes usar nuestros edificios. ¡También te ayudaremos a construir otros nuevos!",
    pt: "Você pode usar nossos edifícios. Também vamos ajudar a construir novos!",
    de: "Du kannst unsere Gebäude nutzen. Wir helfen dir auch, neue zu bauen!",
    fr: "Tu peux utiliser nos bâtiments. On t'aidera aussi à en construire de nouveaux !" },
  "Let's get to work! I promise you we will free the countryside": {
    it: "Al lavoro! Te lo prometto: libereremo le campagne", es: "¡Manos a la obra! Te prometo que liberaremos el campo",
    pt: "Mãos à obra! Prometo que vamos libertar o campo", de: "An die Arbeit! Ich verspreche dir, wir befreien das Land",
    fr: "Au travail ! Je te le promets, on libérera les campagnes" },
  "Thank you! Sadly I'm the only survivor here, but I will join you!": {
    it: "Grazie! Purtroppo sono l'unico sopravvissuto, ma mi unirò a voi!",
    es: "¡Gracias! Por desgracia soy el único superviviente, ¡pero me uniré a vosotros!",
    pt: "Obrigado! Infelizmente sou o único sobrevivente, mas vou me juntar a vocês!",
    de: "Danke! Leider bin ich der einzige Überlebende, aber ich schließe mich euch an!",
    fr: "Merci ! Hélas, je suis le seul survivant, mais je me joins à vous !" },
  "We are safe now! We will help you defeat the enemy!": {
    it: "Ora siamo salvi! Ti aiuteremo a sconfiggere il nemico!", es: "¡Ya estamos a salvo! ¡Te ayudaremos a derrotar al enemigo!",
    pt: "Agora estamos a salvo! Vamos ajudar você a derrotar o inimigo!", de: "Jetzt sind wir in Sicherheit! Wir helfen dir, den Feind zu besiegen!",
    fr: "Nous voilà sauvés ! On t'aidera à vaincre l'ennemi !" },
  "Here is some wood for your help! Count on us too!": {
    it: "Ecco del legno per il tuo aiuto! Conta anche su di noi!", es: "¡Aquí tienes madera por tu ayuda! ¡Cuenta también con nosotros!",
    pt: "Aqui está madeira pela sua ajuda! Conte também conosco!", de: "Hier ist Holz für deine Hilfe! Zähl auch auf uns!",
    fr: "Voici du bois pour ton aide ! Compte aussi sur nous !" },
  "Finally free! We will work together to defeat the invaders!": {
    it: "Finalmente liberi! Lavoreremo insieme per sconfiggere gli invasori!", es: "¡Por fin libres! ¡Trabajaremos juntos para derrotar a los invasores!",
    pt: "Finalmente livres! Vamos trabalhar juntos para derrotar os invasores!", de: "Endlich frei! Gemeinsam besiegen wir die Eindringlinge!",
    fr: "Enfin libres ! Ensemble, on vaincra les envahisseurs !" },
  "We will always be grateful for your help!": {
    it: "Ti saremo sempre grati per il tuo aiuto!", es: "¡Siempre te estaremos agradecidos por tu ayuda!",
    pt: "Seremos sempre gratos pela sua ajuda!", de: "Wir werden dir für deine Hilfe immer dankbar sein!",
    fr: "Nous te serons toujours reconnaissants de ton aide !" },
  "This area is full of gold to mine, count on us!": {
    it: "Questa zona è piena d'oro da estrarre, conta su di noi!", es: "¡Esta zona está llena de oro para extraer, cuenta con nosotros!",
    pt: "Esta área está cheia de ouro para extrair, conte conosco!", de: "Hier gibt es viel Gold abzubauen, zähl auf uns!",
    fr: "Cette zone regorge d'or à extraire, compte sur nous !" },
  "Thank you for freeing my village!": {
    it: "Grazie per aver liberato il mio villaggio!", es: "¡Gracias por liberar mi aldea!", pt: "Obrigado por libertar minha aldeia!",
    de: "Danke, dass du mein Dorf befreit hast!", fr: "Merci d'avoir libéré mon village !" },
  "Our spies have found the enemy base. It's north of here. Let's destroy it to stop the attacks!": {
    it: "Le nostre spie hanno trovato la base nemica. È a nord di qui. Distruggiamola per fermare gli attacchi!",
    es: "Nuestros espías han encontrado la base enemiga. Está al norte. ¡Destruyámosla para detener los ataques!",
    pt: "Nossos espiões encontraram a base inimiga. Fica ao norte daqui. Vamos destruí-la para parar os ataques!",
    de: "Unsere Späher haben die feindliche Basis gefunden. Sie liegt im Norden. Zerstören wir sie, um die Angriffe zu beenden!",
    fr: "Nos espions ont trouvé la base ennemie. Elle est au nord d'ici. Détruisons-la pour arrêter les attaques !" },
  "It seems that this very barracks trains the archers who protect that point.": {
    it: "Pare che sia proprio questa caserma ad addestrare gli arcieri che difendono quel punto.",
    es: "Parece que es este cuartel el que entrena a los arqueros que protegen ese punto.",
    pt: "Parece que é este quartel que treina os arqueiros que protegem aquele ponto.",
    de: "Anscheinend bildet genau diese Kaserne die Bogenschützen aus, die jenen Ort schützen.",
    fr: "On dirait que c'est cette caserne qui forme les archers qui protègent cet endroit." },
  "Those monuments can heal your soldiers while they're nearby": {
    it: "Questi monumenti curano i tuoi soldati quando sono vicini", es: "Estos monumentos curan a tus soldados cuando están cerca",
    pt: "Estes monumentos curam seus soldados quando estão perto", de: "Diese Denkmäler heilen deine Soldaten in ihrer Nähe",
    fr: "Ces monuments soignent tes soldats quand ils sont à proximité" },

  // ------------------------------------------------------- menu di pausa
  "PAUSE": { it: "PAUSA", es: "PAUSA", pt: "PAUSA", de: "PAUSE", fr: "PAUSE" },
  "Resume": { it: "Riprendi", es: "Reanudar", pt: "Continuar", de: "Fortsetzen", fr: "Reprendre" },
  "Graphics options": { it: "Opzioni grafiche", es: "Opciones gráficas", pt: "Opções gráficas", de: "Grafikoptionen", fr: "Options graphiques" },
  "Hints: {state}": { it: "Suggerimenti: {state}", es: "Consejos: {state}", pt: "Dicas: {state}", de: "Tipps: {state}", fr: "Conseils : {state}" },
  "Objectives: {state}": { it: "Obiettivi: {state}", es: "Objetivos: {state}", pt: "Objetivos: {state}", de: "Ziele: {state}", fr: "Objectifs : {state}" },
  "FPS counter: {state}": { it: "Contatore FPS: {state}", es: "Contador de FPS: {state}", pt: "Contador de FPS: {state}", de: "FPS-Anzeige: {state}", fr: "Compteur FPS : {state}" },
  "Language": { it: "Lingua", es: "Idioma", pt: "Idioma", de: "Sprache", fr: "Langue" },
  "Restart level": { it: "Ricomincia livello", es: "Reiniciar nivel", pt: "Reiniciar nível", de: "Level neu starten", fr: "Recommencer le niveau" },
  "Back to menu": { it: "Torna al menu", es: "Volver al menú", pt: "Voltar ao menu", de: "Zurück zum Menü", fr: "Retour au menu" },
  "ON": { it: "SÌ", es: "SÍ", pt: "SIM", de: "AN", fr: "OUI" },
  "OFF": { it: "NO", es: "NO", pt: "NÃO", de: "AUS", fr: "NON" },
  "GRAPHICS OPTIONS": { it: "OPZIONI GRAFICHE", es: "OPCIONES GRÁFICAS", pt: "OPÇÕES GRÁFICAS", de: "GRAFIKOPTIONEN", fr: "OPTIONS GRAPHIQUES" },
  "Rain: {state}": { it: "Pioggia: {state}", es: "Lluvia: {state}", pt: "Chuva: {state}", de: "Regen: {state}", fr: "Pluie : {state}" },
  "Grass and crops: {state}": { it: "Erba e spighe: {state}", es: "Hierba y espigas: {state}", pt: "Grama e espigas: {state}", de: "Gras und Ähren: {state}", fr: "Herbe et épis : {state}" },
  "Fire and sparks: {state}": { it: "Fiamme e scintille: {state}", es: "Llamas y chispas: {state}", pt: "Chamas e faíscas: {state}", de: "Flammen und Funken: {state}", fr: "Flammes et étincelles : {state}" },
  "Dynamic resolution: {state}": { it: "Risoluzione dinamica: {state}", es: "Resolución dinámica: {state}", pt: "Resolução dinâmica: {state}", de: "Dynamische Auflösung: {state}", fr: "Résolution dynamique : {state}" },
  "FPS limit": { it: "Limite FPS", es: "Límite de FPS", pt: "Limite de FPS", de: "FPS-Grenze", fr: "Limite de FPS" },
  "None": { it: "Nessuno", es: "Ninguno", pt: "Nenhum", de: "Keine", fr: "Aucune" },
  "Back": { it: "Indietro", es: "Atrás", pt: "Voltar", de: "Zurück", fr: "Retour" },
  // ------------------------------------------------------- menu principale
  "Campaign - Collapse": { it: "Campagna - Collapse", es: "Campaña - Collapse", pt: "Campanha - Collapse", de: "Kampagne - Collapse", fr: "Campagne - Collapse" },
  "Play the tutorial": { it: "Gioca il tutorial", es: "Jugar el tutorial", pt: "Jogar o tutorial", de: "Tutorial spielen", fr: "Jouer le tutoriel" },
  "Coming soon": { it: "Prossimamente", es: "Próximamente", pt: "Em breve", de: "Demnächst", fr: "Bientôt disponible" },
  "Unlock level": { it: "Sblocca livello", es: "Desbloquear nivel", pt: "Desbloquear nível", de: "Level freischalten", fr: "Débloquer le niveau" },
  "Shove the sun aside": { it: "Spingi via il sole", es: "Aparta el sol", pt: "Afaste o sol", de: "Schieb die Sonne beiseite", fr: "Écarte le soleil" },
  "A long walk": { it: "Una lunga camminata", es: "Una larga caminata", pt: "Uma longa caminhada", de: "Ein langer Marsch", fr: "Une longue marche" },
  "The monastery": { it: "Il monastero", es: "El monasterio", pt: "O mosteiro", de: "Das Kloster", fr: "Le monastère" },
  "Crossing a bridge": { it: "Attraversare un ponte", es: "Cruzar un puente", pt: "Atravessar uma ponte", de: "Über eine Brücke", fr: "Traverser un pont" },
  "The siege": { it: "L'assedio", es: "El asedio", pt: "O cerco", de: "Die Belagerung", fr: "Le siège" },
  "One hundred towers": { it: "Cento torri", es: "Cien torres", pt: "Cem torres", de: "Hundert Türme", fr: "Cent tours" },
  "Our old gods": { it: "I nostri antichi dei", es: "Nuestros viejos dioses", pt: "Nossos velhos deuses", de: "Unsere alten Götter", fr: "Nos anciens dieux" },
  "Escape from the city": { it: "Fuga dalla città", es: "Huida de la ciudad", pt: "Fuga da cidade", de: "Flucht aus der Stadt", fr: "Fuite de la ville" },
  "Allies": { it: "Alleati", es: "Aliados", pt: "Aliados", de: "Verbündete", fr: "Alliés" },
  "The last day": { it: "L'ultimo giorno", es: "El último día", pt: "O último dia", de: "Der letzte Tag", fr: "Le dernier jour" },
  "It's over. Someone betrayed our city and guided the enemy to a secret entrance. They claimed to come here to bring back the glory of the old empire, but they brought back only death and destruction. We must find our way out to survive and start a resistance.": {
    it: "È finita. Qualcuno ha tradito la nostra città e ha guidato il nemico fino a un ingresso segreto. Dicevano di venire a riportare la gloria dell'antico impero, ma hanno portato solo morte e distruzione. Dobbiamo trovare una via d'uscita per sopravvivere e dare vita a una resistenza.",
    es: "Se acabó. Alguien traicionó a nuestra ciudad y guió al enemigo hasta una entrada secreta. Decían venir a devolver la gloria del antiguo imperio, pero solo trajeron muerte y destrucción. Debemos encontrar una salida para sobrevivir y organizar una resistencia.",
    pt: "Acabou. Alguém traiu nossa cidade e guiou o inimigo até uma entrada secreta. Diziam vir para trazer de volta a glória do antigo império, mas trouxeram apenas morte e destruição. Precisamos encontrar uma saída para sobreviver e iniciar uma resistência.",
    de: "Es ist vorbei. Jemand hat unsere Stadt verraten und den Feind zu einem geheimen Eingang geführt. Sie behaupteten, den Ruhm des alten Reiches zurückzubringen, doch sie brachten nur Tod und Zerstörung. Wir müssen einen Ausweg finden, um zu überleben und einen Widerstand aufzubauen.",
    fr: "C'est fini. Quelqu'un a trahi notre ville et a guidé l'ennemi jusqu'à une entrée secrète. Ils prétendaient venir rendre sa gloire à l'ancien empire, mais n'ont apporté que la mort et la destruction. Nous devons trouver une issue pour survivre et lancer une résistance." },
  "An army of survivors makes its way out of the city into the hills. Their priority is to free the citizens imprisoned by the invaders.": {
    it: "Un esercito di sopravvissuti esce dalla città e si dirige verso le colline. La sua priorità è liberare i cittadini imprigionati dagli invasori.",
    es: "Un ejército de supervivientes sale de la ciudad hacia las colinas. Su prioridad es liberar a los ciudadanos encarcelados por los invasores.",
    pt: "Um exército de sobreviventes deixa a cidade rumo às colinas. Sua prioridade é libertar os cidadãos aprisionados pelos invasores.",
    de: "Ein Heer von Überlebenden verlässt die Stadt und zieht in die Hügel. Sein Ziel ist es, die von den Eindringlingen gefangenen Bürger zu befreien.",
    fr: "Une armée de survivants quitte la ville pour les collines. Sa priorité est de libérer les citoyens emprisonnés par les envahisseurs." },
  // ------------------------------------------------------------ salvataggi
  "SAVE AND LOAD": { it: "SALVA E CARICA", es: "GUARDAR Y CARGAR", pt: "SALVAR E CARREGAR", de: "SPEICHERN UND LADEN", fr: "SAUVEGARDER ET CHARGER" },
  "Save and load": { it: "Salva e carica", es: "Guardar y cargar", pt: "Salvar e carregar", de: "Speichern und laden", fr: "Sauvegarder et charger" },
  "Save game": { it: "Salva partita", es: "Guardar partida", pt: "Salvar jogo", de: "Spiel speichern", fr: "Sauvegarder la partie" },
  "Load game": { it: "Carica partita", es: "Cargar partida", pt: "Carregar jogo", de: "Spiel laden", fr: "Charger une partie" },
  "Save to file": { it: "Salva su file", es: "Guardar en archivo", pt: "Salvar em arquivo", de: "In Datei speichern", fr: "Sauvegarder dans un fichier" },
  "Load from file": { it: "Carica da file", es: "Cargar desde archivo", pt: "Carregar de arquivo", de: "Aus Datei laden", fr: "Charger depuis un fichier" },
  "Glass interface: {state}": { it: "Interfaccia di vetro: {state}", es: "Interfaz de cristal: {state}", pt: "Interface de vidro: {state}", de: "Glas-Oberfläche: {state}", fr: "Interface en verre : {state}" },
  "Quality: {level}": { it: "Qualità: {level}", es: "Calidad: {level}", pt: "Qualidade: {level}", de: "Qualität: {level}", fr: "Qualité : {level}" },
  "High": { it: "Alta", es: "Alta", pt: "Alta", de: "Hoch", fr: "Haute" },
  "Medium": { it: "Media", es: "Media", pt: "Média", de: "Mittel", fr: "Moyenne" },
  "Low": { it: "Bassa", es: "Baja", pt: "Baixa", de: "Niedrig", fr: "Basse" },
  "Lock mouse in window: {state}": { it: "Blocca il mouse nella finestra: {state}", es: "Bloquear el ratón en la ventana: {state}", pt: "Prender o mouse na janela: {state}", de: "Maus im Fenster halten: {state}", fr: "Bloquer la souris dans la fenêtre : {state}" },
  "Autosave: {state}": { it: "Salvataggio automatico: {state}", es: "Guardado automático: {state}", pt: "Salvamento automático: {state}", de: "Automatisch speichern: {state}", fr: "Sauvegarde auto : {state}" },
  "Game saved": { it: "Partita salvata", es: "Partida guardada", pt: "Jogo salvo", de: "Spiel gespeichert", fr: "Partie sauvegardée" },
  "Game saved automatically": { it: "Partita salvata automaticamente", es: "Partida guardada automáticamente", pt: "Jogo salvo automaticamente", de: "Spiel automatisch gespeichert", fr: "Partie sauvegardée automatiquement" },
  "Saving failed": { it: "Salvataggio non riuscito", es: "No se pudo guardar", pt: "Não foi possível salvar", de: "Speichern fehlgeschlagen", fr: "Échec de la sauvegarde" },
  "Not a valid save file": { it: "Non è un salvataggio valido", es: "No es una partida guardada válida", pt: "Não é um jogo salvo válido", de: "Keine gültige Spielstanddatei", fr: "Ce n'est pas une sauvegarde valide" },
  "No saved games": { it: "Nessuna partita salvata", es: "No hay partidas guardadas", pt: "Nenhum jogo salvo", de: "Keine gespeicherten Spiele", fr: "Aucune partie sauvegardée" },
  "Tutorial": { it: "Tutorial", es: "Tutorial", pt: "Tutorial", de: "Tutorial", fr: "Tutoriel" },
  "Full screen": { it: "Schermo intero", es: "Pantalla completa", pt: "Tela cheia", de: "Vollbild", fr: "Plein écran" },
  "Exit full screen": { it: "Esci da schermo intero", es: "Salir de pantalla completa", pt: "Sair da tela cheia", de: "Vollbild beenden", fr: "Quitter le plein écran" },
  "Full screen: {state}": { it: "Schermo intero: {state}", es: "Pantalla completa: {state}", pt: "Tela cheia: {state}", de: "Vollbild: {state}", fr: "Plein écran : {state}" },
};
