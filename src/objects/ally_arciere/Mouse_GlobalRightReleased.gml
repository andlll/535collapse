// ally_arciere — Mouse_GlobalRightReleased (eventtype=6 enumb=57)
// Estratto da gmx/objects/ally_arciere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Movimento base
if selected=1
    {with(ally_unit)
        {if selected=1
        scr_free()}
    alarm[8]=1200
    dirox=mouse_x
    diroy=mouse_y
        creation=0
        if action!=1
        alarm[0]=irandom_range(5,13)
    action=1
    warwork=4
    if position_meeting(mouse_x,mouse_y,enemy_unit)
        {warwork=1
        atkorder=1
        atktarget=instance_position(mouse_x,mouse_y,enemy_unit)}
    else
        {atkorder=0
        atktarget=noone}
    if position_meeting(dirox,diroy,torre)=false && position_meeting(dirox,diroy,castello)=false
    presidiowork=0}
