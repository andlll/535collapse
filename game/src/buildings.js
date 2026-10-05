// Edifici alleati. Punto 3a: solo cio' che serve alla raccolta (il centro
// come deposito); il resto (pulsanti, piazzamento, cantieri, produzione,
// fuoco, riparazione, rovine) arriva col punto 3b.

// centro Create [C, src/objects/centro/Create.gml azione 2]
export function centro(p) {
  return {
    create(i, w) {
      Object.assign(i, {
        life: 400, slife: 400, coda: 0, progression: 0, woodir: 0, foodir: 0, stonedir: 0, goldir: 0,
        placex: i.x, placey: i.y, arm: 1, fondazione: 0, pietra: 0, legno: 1, hit: 0, onfire: 0,
        firestarted: 0, selected: 0,
      });
      i.depth = -i.y;
      w.g.popcap += 10;
      // il centro e' anche deposito del cibo: un "mulino" invisibile sul posto
      w.create("cc_barn", i.x, i.y);
      p.markInstance(i, 1000); // azione 1: aggiornamento della griglia
    },
  };
}
