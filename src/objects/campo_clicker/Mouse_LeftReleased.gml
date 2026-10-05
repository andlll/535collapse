// campo_clicker — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/campo_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.wood>=200
{
active=1
with (clicker_parent)
instance_destroy()
if instance_number(campo_placer)=0
instance_create(x,y,campo_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,wood_blink)
