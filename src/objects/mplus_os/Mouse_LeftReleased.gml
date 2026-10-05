// mplus_os — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/mplus_os.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.stone>=40
    {instance_create(x,y,muraplacer_os)
    instance_destroy()}
