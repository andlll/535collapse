// stone_bullet — Collision_pietra_grande (eventtype=4 ename=pietra_grande)
// Estratto da gmx/objects/stone_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    stone-=1
    if stone=0
    instance_destroy()
}

// --- azione 2: execute code ---
instance_destroy()
