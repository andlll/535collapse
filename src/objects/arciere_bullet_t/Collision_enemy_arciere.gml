// arciere_bullet_t — Collision_enemy_arciere (eventtype=4 ename=enemy_arciere)
// Estratto da gmx/objects/arciere_bullet_t.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=6
    hit=1
    alarm[5]=47
}

// --- azione 2: execute code ---
instance_destroy()
