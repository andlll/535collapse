// castello_clicker — KeyPress_G (eventtype=9 enumb=71)
// Estratto da gmx/objects/castello_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.stone>=850
{
active=1
with (clicker_parent)
instance_destroy()
if instance_number(castello_placer)=0
instance_create(x,y,castello_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,stone_blink)
