// mplus_va — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/mplus_va.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.stone>=40
    {instance_create(x,y,muraplacer_va)
    instance_destroy()}
