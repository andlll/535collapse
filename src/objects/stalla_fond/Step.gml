// stalla_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/stalla_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if fase=0
if life>slife/2
{fase=1
sprite_index=stal_f2}
if life>=slife
{instance_create(x,y,stalla)
instance_destroy()}
