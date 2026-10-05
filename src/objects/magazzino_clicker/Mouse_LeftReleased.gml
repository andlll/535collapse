// magazzino_clicker — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/magazzino_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.wood>=70
{
active=1
with (clicker_parent)
instance_destroy()
if instance_number(magazzino_placer)=0
instance_create(x,y,magazzino_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,wood_blink)
