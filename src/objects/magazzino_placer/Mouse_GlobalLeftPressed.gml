// magazzino_placer — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/magazzino_placer.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if place=1
if global.wood>=70
{global.sele=1
global.wood-=70
instance_create(x,y,magazzino_fond)
with (magazzino_clicker)
active=0
instance_destroy()}
else
instance_create(0,0,wood_blink)
