// campo — Mouse_MouseEnter (eventtype=6 enumb=10)
// Estratto da gmx/objects/campo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.farmhover=1
if global.foodhint=0 && instance_number(parent_hint)<1 && global.resourcehint=1
    {instance_create(x,y,hint_campi)
    global.foodhint=1}
hover=1
