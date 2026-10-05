// picchiere_bullet — Collision_enemy_cavaliere (eventtype=4 ename=enemy_cavaliere)
// Estratto da gmx/objects/picchiere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=8
    hit=1
    alarm[5]=47
}

// --- azione 2: execute code ---
instance_destroy()
