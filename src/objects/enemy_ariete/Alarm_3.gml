// enemy_ariete — Alarm_3 (eventtype=2 enumb=3)
// Estratto da gmx/objects/enemy_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var dix=dirox
var diy=diroy
if place_free(x,y)=false
{var nuovo=instance_create(x+50,y-20,enemy_ariete)
with(nuovo)
{action=1
alarm[0]=13
dirox=dix
diroy=diy}
instance_destroy()}
