// mura_ori — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/mura_ori.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creaz pulsanti di selezione
if selected=1
if instance_number(gate_clicker)=0
{
instance_create(x-219,y,mplus_os)
instance_create(x+207,y,mplus_od)
instance_create(0,0,gate_clicker)}
//fine riparazione
if life>=slife
var xpos=x
var ypos=y
with (ally_omino)
    {if action=7
    if point_distance(repx,repy,xpos,ypos)<150
        {action=0
        global.idle+=1
        repairwork=0
        repx=noone
        repy=noone}}
