// castello_placer — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/castello_placer.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if place=1
if global.stone>=850
    {global.sele=1
    global.stone-=850
    instance_create(x,y,castello_fond)
    with (castello_clicker)
    active=0
    instance_destroy()}
else
instance_create(0,0,stone_blink)
