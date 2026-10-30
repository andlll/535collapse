// [§9.85, sprite dell'autore] Gli stadi di danno degli edifici di pietra che
// prima non li avevano: torre, fortezza e monastero nemici, mura e porte
// (del giocatore e nemiche). Come gli edifici del giocatore (buildings.js,
// `damage`): sotto i 2/3 della vita lo sprite <base>_r1, sotto 1/3 <base>_r2,
// in dissolvenza (swapSprite); riparati tornano indietro. Le maschere non
// cambiano (mask_index), quindi nemmeno collisioni e percorsi.
export function damageSuffix(i) {
  return i.life < i.slife * 0.33 ? "_r2" : i.life < i.slife * 0.66 ? "_r1" : "";
}

export function showDamage(i, w, base) {
  const want = base + damageSuffix(i);
  if (i.sprite_index !== want) w.swapSprite(i, want);
}
