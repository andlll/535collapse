// barn_placer — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/barn_placer.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if place=1
if global.wood>=60
{global.sele=1
global.wood-=60
instance_create(x,y,barn_fond)
with (barn_clicker)
active=0
instance_destroy()}
else
instance_create(0,0,wood_blink)
