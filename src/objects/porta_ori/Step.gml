// porta_ori — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/porta_ori.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creaz pulsanti di selezione
if selected=1
if instance_number(mplus_os)=0
{
instance_create(x-219,y,mplus_os)
instance_create(x+207,y,mplus_od)}
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
//apertura della porta
if openable=1
    {if distance_to_object(instance_nearest(x,y,ally_unit))<20
         {if open=0
        open=1
        sprite_index=m_ori_pa
        mask_index=m_ori_pa_mask}
    else
         {if open=1
        open=0
        sprite_index=m_ori_p
        mask_index=m_ori_p}}  
            
