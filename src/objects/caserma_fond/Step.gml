// caserma_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/caserma_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if fase=0
if life>slife/2
{fase=1
sprite_index=cas_f2}
if life>=slife
{instance_create(x,y,caserma)
instance_destroy()}
