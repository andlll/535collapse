// ally_catapulta — Mouse_GlobalRightReleased (eventtype=6 enumb=57)
// Estratto da gmx/objects/ally_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Movimento
if selected=1
if position_meeting(mouse_x,mouse_y,enemy)
if loaded=1
        {if distance_to_point(mouse_x,mouse_y)<850 && distance_to_point(mouse_x,mouse_y)>300
        if action!=2
            {
            action=2
            automatic=0
            step=0
            direction=point_direction(x,y,mouse_x,mouse_y)
            targx=mouse_x
            targy=mouse_y
            alarm[2]=50
            exit}}
if selected=1
if !position_meeting(mouse_x,mouse_y,enemy)
    {
    if action!=2 && action!=1
    alarm[0]=irandom_range(5,13)
    automatic=0
    dirox=mouse_x
    diroy=mouse_y
    action=1
    step=0
    }
