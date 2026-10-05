///scr_movement_general
var leader=scr_get_highest_rank()
if (leader!=noone)
    {with leader
    scr_move_master(mouse_x,mouse_y)
    with ally_unit
        {if id!=leader && selected=1
            {scr_free()}}}
