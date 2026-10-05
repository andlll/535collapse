// cavaliere_bullet — Collision_enemy_ariete (eventtype=4 ename=enemy_ariete)
// Estratto da gmx/objects/cavaliere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=5
}

// --- azione 2: execute code ---
instance_destroy()
