// manager — KeyPress_D (eventtype=9 enumb=68)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Hotkey debug mode
if global.debug_code=2
    {global.debug_code=3
    alarm[11]=30}
if global.debug_code=3
    {global.debug_code=4
    alarm[11]=30}
