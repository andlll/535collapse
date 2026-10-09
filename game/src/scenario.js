// Oggetti delle mappe disegnate in Tiled (STUDIO.md §9.10, §9.11): le fette
// degli edifici nuovi e i gruppi della mappa.
//
// Fette [§9.10]: un oggetto con `slices` (tools/07_scene.py) tiene la
// maschera intera e non si disegna; per ogni striscia verticale dello sprite
// nasce una "__fetta" ferma, senza maschera, con la depth del bordo
// anteriore della maschera in quella colonna.
//
// Gruppi [§9.11]: gli oggetti di un livello "gruppo <nome>" della mappa
// (tools/12_tiled_import.py) hanno il gruppo come ottavo campo dell'istanza.
// La regia del livello dice cosa farne (GROUPS): "nascosto" = non ci sono
// finche' la regia non li crea (activateGroup); "neutrale" = ci sono come
// "__neutrale", con lo stesso sprite, ostacolo ma di nessuno, e
// activateGroup li sostituisce con l'oggetto vero, del giocatore.

export const GROUPS = { lvl03: { citta: "nascosto", monastero: "neutrale" } };

export function spawnSlices(i, w, slices) {
  if (!slices) return;
  i.fette = slices.map(([sprite, front]) => w.create("__fetta", i.x, i.y, {
    sx: i.image_xscale, sy: i.image_yscale, rot: i.image_angle,
    init: (f) => { f.sprite_index = sprite; f.depth = -(i.y + front * i.image_yscale); },
  }));
}

export function destroySlices(i, w) {
  for (const f of i.fette || []) if (f.alive) w.destroy(f);
  i.fette = null;
}

// comportamento degli oggetti a fette senza altro comportamento
export function sliced(o) {
  return {
    create(i, w) { spawnSlices(i, w, o.slices); },
    destroy(i, w) { destroySlices(i, w); },
    draw() { /* lo disegnano le fette */ },
  };
}

export function neutral() {
  return { destroy(i, w) { destroySlices(i, w); } };
}

// Divide le istanze della room: quelle da creare subito (le neutrali come
// "__neutrale", dopo il resto: neutralList) e quelle tenute da parte.
export function splitGroups(room, instances) {
  const modes = GROUPS[room] || {};
  const now = [], held = {}, neutrals = [];
  for (const e of instances) {
    const grp = e[7], mode = grp && modes[grp];
    if (mode === "nascosto") (held[grp] || (held[grp] = [])).push(e.slice(0, 7));
    else if (mode === "neutrale") neutrals.push(e);
    else now.push(e.length > 7 ? e.slice(0, 7) : e);
  }
  return { now, held, neutrals };
}

// L'oggetto neutrale al posto di `e` = [oggetto, x, y, sx, sy, rot, colore, gruppo]
export function createNeutral(w, e) {
  const [object, x, y, sx, sy, rot, , grp] = e;
  const o = w.objects[object];
  const sprite = o.sprite || (o.choices && o.choices[0]);
  const n = w.create("__neutrale", x, y, {
    sx, sy, rot,
    init: (f) => {
      f.realObject = object; f.group = grp;
      f.sprite_index = sprite; f.mask_index = o.mask || sprite;
      f.depth = typeof o.depth === "number" ? o.depth : -y + o.depth.y;
    },
  });
  if (o.slices) {
    spawnSlices(n, w, o.slices);
    n.persistentDraw = false; // lo disegnano le fette
  }
  w.path.markInstance(n, 1000); // la griglia dei costi e' gia' fatta (initCost)
  return n;
}

// Il gruppo passa al giocatore: le neutrali diventano l'oggetto vero, le
// tenute da parte nascono. Restituisce le istanze nuove.
export function activateGroup(w, grp) {
  const out = [];
  for (const n of [...w.all("__neutrale")]) {
    if (!n.alive || n.group !== grp) continue;
    const { x, y, image_xscale: sx, image_yscale: sy, image_angle: rot, realObject } = n;
    w.path.markInstance(n, 1);
    w.destroy(n);
    out.push(w.create(realObject, x, y, { sx, sy, rot }));
  }
  const held = w.g.heldGroups && w.g.heldGroups[grp];
  if (held) {
    for (const [object, x, y, sx, sy, rot] of held) out.push(w.create(object, x, y, { sx, sy, rot }));
    delete w.g.heldGroups[grp];
  }
  return out;
}
