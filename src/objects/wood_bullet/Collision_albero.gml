// wood_bullet — Collision_albero (eventtype=4 ename=albero)
// Estratto da gmx/objects/wood_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    wood-=2
    if wood=0
    instance_destroy()
}

// --- azione 2: execute code ---
instance_destroy()
