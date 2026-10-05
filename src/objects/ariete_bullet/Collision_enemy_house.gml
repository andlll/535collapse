// ariete_bullet — Collision_enemy_house (eventtype=4 ename=enemy_house)
// Estratto da gmx/objects/ariete_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=50
}

// --- azione 2: execute code ---
instance_destroy()
