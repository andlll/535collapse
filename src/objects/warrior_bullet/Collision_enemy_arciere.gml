// warrior_bullet — Collision_enemy_arciere (eventtype=4 ename=enemy_arciere)
// Estratto da gmx/objects/warrior_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=15
    alarm[5]=47
    hit=1
}

// --- azione 2: execute code ---
instance_destroy()
