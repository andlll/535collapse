// albero — Mouse_MouseEnter (eventtype=6 enumb=10)
// Estratto da gmx/objects/albero.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.alberhover=1
if global.woodhint=0 && instance_number(parent_hint)<1 && global.resourcehint=1
    {instance_create(x,y,hint_legna)
    global.woodhint=1}
