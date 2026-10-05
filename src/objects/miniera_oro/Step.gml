// miniera_oro — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/miniera_oro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visibile
if visible=false
{
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
if distance_to_object(vici)<400 || distance_to_object(vicic)<400
visible=true}
if blinkfade>0
blinkfade-=0.02
else
    {blinkfade=1
    blinkx=x+irandom_range(-60,60)
    blinky=y+irandom_range(-40,40)}
