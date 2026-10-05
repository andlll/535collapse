// pietra_grande — Mouse_MouseEnter (eventtype=6 enumb=10)
// Estratto da gmx/objects/pietra_grande.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.stonehover=1
if global.stonehint=0 && instance_number(parent_hint)<1 && global.resourcehint=1
    {instance_create(x,y,hint_stone)
    global.stonehint=1}
