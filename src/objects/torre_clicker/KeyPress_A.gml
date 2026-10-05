// torre_clicker — KeyPress_A (eventtype=9 enumb=65)
// Estratto da gmx/objects/torre_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.stone>=200
{
active=1
with (clicker_parent)
instance_destroy()
instance_create(x,y,torre_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,stone_blink)
