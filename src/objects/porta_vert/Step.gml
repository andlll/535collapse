// porta_vert — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/porta_vert.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creaz pulsanti di selezione
if selected=1
if instance_number(mplus_va)=0
{
instance_create(x,y,mplus_vb)
instance_create(x,y-300,mplus_va)}
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
if openable=1 && armed=1
    {if distance_to_object(instance_nearest(x,y,ally_unit))<20
         {if open=0
        open=1
        armed=0
        alarm[10]=30
        sprite_index=m_vert_pa
        mask_index=m_vert_pa_mask}
    else
         {if open=1
        open=0
        armed=0
        alarm[10]=30
        sprite_index=m_vert_p
        mask_index=m_vert_p}}  
            
