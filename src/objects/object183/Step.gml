// object183 — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/object183.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if life<=0
{global.popcap-=5
instance_create(x,y,casaruin)
instance_destroy()}
//fine riparazione
if life>=slife
var xpos=x
var ypos=y
with (ally_omino)
    {if action=7 || repairork=1
    if point_distance(repx,repy,xpos,ypos)<150
        {action=0
        repairwork=0
        global.idle+=1
        repx=noone
        repy=noone}}
