// manager — Keyboard_Left (eventtype=5 enumb=37)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Sposta a sinistra visuale + attivazione debug
if global.sele=0
view_xview[0]-=10
else
view_xview[0]-=30
if global.debug_code=0
    {global.debug_code=1
    alarm[11]=30}
if global.debug_code=4
    {global.debug_code=5
    alarm[11]=30}
