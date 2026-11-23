// [§7.14] Lo sfondo dei pannelli di vetro: una copia di cio' che e' appena
// stato disegnato (dalla superficie corrente: il canvas, o quella della
// pausa) a meta' risoluzione, poi a un quarto, sfocata con una gaussiana.
// Superfici ricreate solo se cambia la misura o il contesto. Draw.setGlass
// la usa sotto i rettangoli e i cerchi bianchi dell'interfaccia (draw.js
// _glass).
// [§9.203, richiesta dell'autore] qui, fuori da app.js, perche' la usa anche
// l'editor di mappe (editor.js), che ha il suo ciclo di disegno.

const GLASS_SIGMA = 3; // texel a un quarto di risoluzione

// una superficie copiata (e ridotta) in un'altra
export function copyTarget(r, src, dst) {
  r.beginTarget(dst, 0, 0, 1, 1, [0, 0, 0]);
  r.setBlend("normal");
  r.quad(src, 0, 0, 1, 0, 1, 1, 0, 1, 0, src.height, src.width, 0, 0xffffffff);
  r.endTarget();
}

// la funzione che cattura lo sfondo sfocato (una per renderer e canvas)
export function glassBackdrop(r, canvas) {
  let glassT = null;
  return () => {
    const cur = r.targets && r.targets.length ? r.targets[r.targets.length - 1].t : null;
    const W = cur ? cur.width : canvas.width, H = cur ? cur.height : canvas.height;
    if (!(glassT && glassT.gen === r.generation && glassT.W === W && glassT.H === H)) {
      if (glassT && glassT.gen === r.generation) for (const t of glassT.t) r.deleteTarget(t);
      const hw = Math.max(1, Math.ceil(W / 2)), hh = Math.max(1, Math.ceil(H / 2));
      const qw = Math.max(1, Math.ceil(W / 4)), qh = Math.max(1, Math.ceil(H / 4));
      glassT = { gen: r.generation, W, H, t: [r.createTarget(hw, hh), r.createTarget(qw, qh), r.createTarget(qw, qh), r.createTarget(qw, qh)] };
    }
    const [half, q, tmp, out] = glassT.t;
    const proj = r.proj;
    r.grab(half);
    copyTarget(r, half, q);
    r.blur(q, tmp, out, GLASS_SIGMA);
    r.setProjection(...proj);
    return out;
  };
}
