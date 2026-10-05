// ally_ariete — Mouse_GlobalRightReleased (eventtype=6 enumb=57)
// Estratto da gmx/objects/ally_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
    {
    dirox=mouse_x
    diroy=mouse_y
        if action!=1
    alarm[0]=irandom_range(5,13)
    action=1
    warwork=4
    if position_meeting(mouse_x,mouse_y,enemy_build)
    warwork=1
}
