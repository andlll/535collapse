// manager — KeyPress_Escape (eventtype=9 enumb=27)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Deseleziona tutti / apri menu
if global.sel>0
with (mouser)
    {pausarm=0
    alarm[0]=10}
with (ally_omino)
if selected=1
    {global.sel-=1
    buildarm=0}
with (ally)
selected=0
