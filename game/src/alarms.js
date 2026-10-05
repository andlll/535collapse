// Alarm di GameMaker (STUDIO.md §1.3) [I, runner GMS 1.x]:
// ogni passo un alarm > 0 scende di 1; quando arriva a 0 diventa -1 e il
// suo evento parte (l'evento puo' riarmarlo). alarm=1 scatta quindi al
// passo successivo; 0 o un valore negativo non scattano mai. Gli alarm si
// controllano dopo Begin Step e prima di Step.

export class Alarms {
  constructor(n = 12) {
    this.a = new Array(n).fill(-1);
  }

  set(i, steps) { this.a[i] = steps; }
  get(i) { return this.a[i]; }

  // handler(i) per ogni alarm che scatta in questo passo, in ordine di indice.
  tick(handler) {
    const a = this.a;
    for (let i = 0; i < a.length; i++) {
      if (a[i] > 0) {
        a[i] -= 1;
        if (a[i] <= 0) {
          a[i] = -1;
          handler(i);
        }
      }
    }
  }
}

export function irandomRange(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
