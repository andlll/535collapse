// stalla_clicker — KeyPress_F (eventtype=9 enumb=70)
// Estratto da gmx/objects/stalla_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.wood>=170
{
active=1
with (clicker_parent)
instance_destroy()
instance_create(x,y,stalla_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,wood_blink)
