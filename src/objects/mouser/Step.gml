// mouser — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/mouser.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Presidio e spostamento mouse
if keyboard_check_pressed(vk_space)=false
    {x=mouse_x
    y=mouse_y}
//presidio
if position_meeting(mouse_x,mouse_y,castello)
with instance_nearest(mouse_x,mouse_y,castello)
    {if npresidio<4
    global.preshover=1
    else
    global.preshover=0}
if position_meeting(mouse_x,mouse_y,torre)
with instance_nearest(mouse_x,mouse_y,torre)
    {if npresidio<2
    global.preshover=1
    else
    global.preshover=0}
if !position_meeting(mouse_x,mouse_y,torre) && !position_meeting(mouse_x,mouse_y,castello)
global.preshover=0
