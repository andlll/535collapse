// torreruin — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/torreruin.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visibile
if visible=false
{
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
if distance_to_object(vici)<400 || distance_to_object(vicic)<400
visible=true}
