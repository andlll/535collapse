// manager — Keyboard_Right (eventtype=5 enumb=39)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.sele=0
view_xview[0]+=10
else
view_xview[0]+=30
if global.debug_code=1
    {global.debug_code=2
    alarm[11]=30}
if global.debug_code=5
    {global.debugging=1
    alarm[11]=30}
