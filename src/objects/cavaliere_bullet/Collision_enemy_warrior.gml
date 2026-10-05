// cavaliere_bullet — Collision_enemy_warrior (eventtype=4 ename=enemy_warrior)
// Estratto da gmx/objects/cavaliere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    life-=5
    alarm[5]=47
    hit=1
}

// --- azione 2: execute code ---
instance_destroy()
