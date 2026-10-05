// food_bullet_rapido — Collision_campo (eventtype=4 ename=campo)
// Estratto da gmx/objects/food_bullet_rapido.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    alarm[1]=5
    foodwork=1
}

// --- azione 2: execute code ---
instance_destroy()
