// chiesa_clicker — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/chiesa_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.wood>=50 && global.stone>=150
{
active=1
with (clicker_parent)
instance_destroy()
if instance_number(chiesa_placer)=0
instance_create(x,y,chiesa_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
if global.stone<150
instance_create(0,0,stone_blink)
if global.wood<50
instance_create(0,0,wood_blink)
