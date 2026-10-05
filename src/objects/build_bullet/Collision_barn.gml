// build_bullet — Collision_barn (eventtype=4 ename=barn)
// Estratto da gmx/objects/build_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    if global.wood>=1
        {life+=1
        onfire=0
        global.wood-=1
        if life>slife
        life=slife}
}

// --- azione 2: execute code ---
instance_destroy()
