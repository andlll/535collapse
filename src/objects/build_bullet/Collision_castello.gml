// build_bullet — Collision_castello (eventtype=4 ename=castello)
// Estratto da gmx/objects/build_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    if global.stone>=1
        {life+=1
        global.stone-=1
        if life>slife
        life=slife}
}

// --- azione 2: execute code ---
instance_destroy()
