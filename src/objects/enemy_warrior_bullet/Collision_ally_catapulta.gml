// enemy_warrior_bullet — Collision_ally_catapulta (eventtype=4 ename=ally_catapulta)
// Estratto da gmx/objects/enemy_warrior_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=7
}

// --- azione 2: execute code ---
instance_destroy()
