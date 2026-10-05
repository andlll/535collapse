// arciere_bullet — Collision_enemy_catapulta (eventtype=4 ename=enemy_catapulta)
// Estratto da gmx/objects/arciere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=3
    alarm[5]=47
}

// --- azione 2: execute code ---
instance_destroy()
