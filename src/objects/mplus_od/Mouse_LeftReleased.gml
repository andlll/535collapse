// mplus_od — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/mplus_od.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.stone>=40
    {instance_create(x,y,muraplacer_od)
    instance_destroy()}
