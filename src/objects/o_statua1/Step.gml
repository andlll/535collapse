// o_statua1 — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/o_statua1.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if distance_to_object(ally_unit)<300 && attiva=0
    {attiva=1
    if global.hintata=0
        {global.hintata=1
        instance_create(x,y,dialogo_statua)}
    alarm[0]=1}
