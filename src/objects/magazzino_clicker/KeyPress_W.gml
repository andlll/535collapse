// magazzino_clicker — KeyPress_W (eventtype=9 enumb=87)
// Estratto da gmx/objects/magazzino_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.wood>=70
{
active=1
with (clicker_parent)
instance_destroy()
instance_create(x,y,magazzino_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,wood_blink)
