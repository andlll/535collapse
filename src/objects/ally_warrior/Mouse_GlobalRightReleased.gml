// ally_warrior — Mouse_GlobalRightReleased (eventtype=6 enumb=57)
// Estratto da gmx/objects/ally_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Movimento base
if selected=1
    {with(ally_unit)
        {if selected=1
        scr_free()}
    dirox=mouse_x
    diroy=mouse_y
    creation=0
    alarm[8]=3000
    if action!=1
    alarm[0]=irandom_range(5,13)
    action=1
    warwork=4
    if position_meeting(mouse_x,mouse_y,enemy_unit)
    warwork=1
    }
