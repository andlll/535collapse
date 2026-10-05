// ally_ariete — Alarm_3 (eventtype=2 enumb=3)
// Estratto da gmx/objects/ally_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///se quando nasci posto è occupato
var dix=dirox
var diy=diroy
if place_free(x,y)=false
{var nuovo=instance_create(x+50,y-20,ally_ariete)
with(nuovo)
{action=1
alarm[0]=13
dirox=dix
diroy=diy}
global.pop-=3
instance_destroy()}
