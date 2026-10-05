// ally_omino_creator — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/ally_omino_creator.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if place_meeting(x,y,solid)=true
{x+=irandom_range(-5,5)
y+=irandom_range(-5,5)}
else
{instance_create(x,y,ally_omino)
instance_destroy()}
