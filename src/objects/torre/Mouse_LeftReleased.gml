// torre — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/torre.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if instance_number(clicchero)=0
if global.sel=0
selected=1
//presidio hint
if instance_number(parent_hint)<1
if global.presidiohint=0
    {instance_create(x,y,hint_presidio)
    global.presidiohint=1}
