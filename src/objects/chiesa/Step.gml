// chiesa — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/chiesa.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///fine riparazione
if life>=slife
var xpos=x
var ypos=y
with (ally_omino)
    {if action=7
    if point_distance(repx,repy,xpos,ypos)<150
        {action=0
        repairwork=0
        global.idle+=1
        repx=noone
        repy=noone}}
///morte e distruzione
if life<=0
{if startflagger=1
with(instance_nearest(x,y-100,flag_r))
    {instance_destroy()
    }
instance_create(x,y,chiesaruin)
instance_destroy()}
//assegnazione sprite
if life>slife*0.66
if sprite_index!=chiesa
sprite_index=chiesa_spr
if life<slife*0.33
if sprite_index!=chiesa_r1
sprite_index=chiesa_r1
if life<slife*0.33
if sprite_index!=chiesa_r2
sprite_index=chiesa_r2
