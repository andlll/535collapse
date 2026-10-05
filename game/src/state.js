// Le variabili global.* dell'originale che servono ai sistemi portati
// finora. I nomi restano quelli di GameMaker per poterli ritrovare in src/.
// Valori iniziali da manager Create [C], salvo dove l'autore ha deciso
// diversamente (STUDIO.md §0.10, §0.15).

export function newGlobals(room) {
  return {
    // risorse [Deviazione decisa dall'autore: manager Create aveva valori di
    // test 10000/5000/5000/0 e popcap 990; quelli giusti sono 100/50/50/0 e
    // popcap 0]
    food: 100, wood: 50, gold: 50, stone: 0,
    pop: 0, popcap: 0,
    frame: 0,
    idle: 0,        // civili inattivi
    sele: 0,        // 1 con Ctrl, -1 con Alt (manager KeyPress_Control/Alt)
    sel: 0,         // selezionati
    milsel: 0,      // selezionati non civili
    multi: 0, startx: 0, starty: 0,
    scaleview: 1,
    hint: room === "menu" ? 3 : 1,
    obj: 1,
    fogville: 1,    // nebbia attiva (trucco Ctrl+V+Canc la spegne)
    visia: 0,       // V tenuto: abilita i trucchi
    night: 0,
    raining: 0,
    sz: 30,         // scala della minimappa: 1 px di minimappa = sz px di room
    minim: 1,       // minimappa visibile
    fps_show: 0,
    victory: 0, gameover: 0,
    seconds: 0, minutes: 0, hours: 0,
    debugging: 0, debug_code: 0,
  };
}
