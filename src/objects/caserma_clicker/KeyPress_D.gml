// caserma_clicker — KeyPress_D (eventtype=9 enumb=68)
// Estratto da gmx/objects/caserma_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.wood>=150
{
active=1
with (clicker_parent)
instance_destroy()
instance_create(x,y,caserma_placer)
with (ally_omino)
{if selected=1
buildarm=1}}
else
instance_create(0,0,wood_blink)
