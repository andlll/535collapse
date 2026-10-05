// gold_bullet — Collision_miniera_oro (eventtype=4 ename=miniera_oro)
// Estratto da gmx/objects/gold_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    gold-=1
    if gold=0
    instance_destroy()
}

// --- azione 2: execute code ---
instance_destroy()
