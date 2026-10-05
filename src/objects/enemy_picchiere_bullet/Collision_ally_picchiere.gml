// enemy_picchiere_bullet — Collision_ally_picchiere (eventtype=4 ename=ally_picchiere)
// Estratto da gmx/objects/enemy_picchiere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=3
    hit=1
    alarm[5]=47
}

// --- azione 2: execute code ---
instance_destroy()
