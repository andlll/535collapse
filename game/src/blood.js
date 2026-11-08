// [§9.117, richiesta dell'autore] Gocce di sangue sui colpi alle unita':
// in mischia (units.js meleeStrike, enemies.js enemyStrike) e con le frecce
// (ranged.js allyArrow, enemyArrow). La goccia e' lo sprite della macchia
// di sangue dell'autore (sfxsangue: quella del masso della catapulta,
// siege.js bloodSplat), rimpicciolita, del suo rosso (160, 17, 0) appena
// variato: schizza dalla parte opposta a chi colpisce (o nella direzione
// della freccia), un po' in alto, e ricade sbiadendo in meno di mezzo
// secondo. Niente macchia a terra alla morte: c'e' gia' nello sprite del
// cadavere (decisione dell'autore). Non sulle macchine d'assedio. Solo le
// unita' visibili (non nella nebbia) e sullo schermo, al piu' MAX_STEP gocce
// a passo nelle battaglie grandi. Categoria di particelle "blood": si spegne
// nelle opzioni grafiche ("Sangue", settings.blood).
import { partType } from "./particles.js";

export const BLOOD = {
  melee: { n: [4, 6], spread: 35 },  // gocce per colpo (min, max), gradi attorno alla direzione
  arrow: { n: [2, 3], spread: 25 },
  h: 34,                              // px sopra i piedi dell'unita' colpita
  MAX_STEP: 40,
};
const NO_BLOOD = new Set(["ally_ariete", "ally_catapulta", "enemy_ariete", "enemy_catapulta"]);
const SECTOR = 30; // un tipo di particella per settore di 30 gradi
const TYPES = new Map();
function dropType(dir, spread) {
  const k = Math.round(dir / SECTOR) % (360 / SECTOR), key = k + ":" + spread;
  let t = TYPES.get(key);
  if (!t) {
    // un po' verso l'alto, come uno schizzo, qualunque sia la direzione
    // (gradi di GameMaker: 90 e' in alto)
    const a = (k * SECTOR * Math.PI) / 180;
    const d = (Math.atan2(Math.sin(a) + 0.6, Math.cos(a)) * 180) / Math.PI;
    t = partType({
      sprite: "sfxsangue", size: [0.12, 0.2, -0.0025, 0], colour: { rgb: [175, 255, 175, 255, 175, 255] },
      alpha: [1, 0.85, 0], speed: [1.3, 2.6, -0.02, 0], direction: [d - spread, d + spread, 0, 0],
      gravity: [0.16, 270], life: [18, 28],
    });
    TYPES.set(key, t);
  }
  return t;
}

const onScreen = (cam, x, y, m) => !cam || (x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m && y < cam.y + cam.h + m);

// `v` colpita, schizzo verso `dir` (gradi, GameMaker: 0 a destra, 90 in alto)
export function bloodHit(w, v, dir, kind = "melee") {
  const P = w.particles;
  if (!P || !v || NO_BLOOD.has(v.object) || v.visible === false || P.hidden.has("blood")) return;
  if (!onScreen(w.cam, v.x, v.y, 80)) return;
  const step = w._stepNo;
  if (w._bloodStep !== step) { w._bloodStep = step; w._bloodN = 0; }
  const K = BLOOD[kind] || BLOOD.melee;
  const n = Math.min(K.n[0] + Math.floor(Math.random() * (K.n[1] - K.n[0] + 1)), BLOOD.MAX_STEP - w._bloodN);
  if (n <= 0) return;
  w._bloodN += n;
  const ps = P.systemCreate((v.depth ?? -v.y) - 2, "blood");
  P.releaseWhenEmpty(ps);
  const em = P.emitterCreate(ps);
  P.region(em, v.x - 4, v.x + 4, v.y - BLOOD.h - 4, v.y - BLOOD.h + 4, "ellipse", "gaussian");
  P.burst(ps, em, dropType(((dir % 360) + 360) % 360, K.spread), n);
}
