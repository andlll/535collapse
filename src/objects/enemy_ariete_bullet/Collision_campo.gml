// enemy_ariete_bullet — Collision_campo (eventtype=4 ename=campo)
// Estratto da gmx/objects/enemy_ariete_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=5
}

// --- azione 2: execute code ---
instance_destroy()
