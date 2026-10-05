// castello_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/castello_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if fase=0
if life>slife/2
{fase=1
sprite_index=castello_f2}
if fase=1
if life>slife*0.666
{fase=2
sprite_index=castello_f3}
if life>=slife
{instance_create(x,y,castello)
instance_destroy()}
