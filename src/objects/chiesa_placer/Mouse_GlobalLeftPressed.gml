// chiesa_placer — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/chiesa_placer.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if place=1
if global.wood>=50 && global.stone>=150
{global.sele=1
global.wood-=50
global.stone-=150
instance_create(x,y,chiesa_fond)
with (chiesa_clicker)
active=0
instance_destroy()}
if global.wood<50
instance_create(0,0,wood_blink)
if global.stone<150
instance_create(0,0,stone_blink)
