// aggr_assign — Collision_enemy_caserma (eventtype=4 ename=enemy_caserma)
// Estratto da gmx/objects/aggr_assign.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Assegna ruolo
with (other)
    {role=30
    alarm[3]=540}
instance_destroy()
