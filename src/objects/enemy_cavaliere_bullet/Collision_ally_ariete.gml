// enemy_cavaliere_bullet — Collision_ally_ariete (eventtype=4 ename=ally_ariete)
// Estratto da gmx/objects/enemy_cavaliere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=5
}

// --- azione 2: execute code ---
instance_destroy()
