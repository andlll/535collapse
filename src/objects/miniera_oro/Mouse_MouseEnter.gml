// miniera_oro — Mouse_MouseEnter (eventtype=6 enumb=10)
// Estratto da gmx/objects/miniera_oro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.minierahover=1
if global.goldhint=0 && instance_number(parent_hint)<1 && global.resourcehint=1
    {instance_create(x,y,hint_oro)
    global.goldhint=1}
