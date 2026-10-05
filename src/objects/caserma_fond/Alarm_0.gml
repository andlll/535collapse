// caserma_fond — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/caserma_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
//Direzione costuttori
with (ally_omino)
        {if buildarm=1
            {buildwork=1
            buildx=mouse_x
            buildy=mouse_y
            scr_free()
            target_angle = point_direction(x,y,other.x,other.y)
            if action=0
            global.idle-=1
            var result_list = ds_list_create();
            if (scr_find_valid_cell_backwards(floor(mouse_x div 32), floor(mouse_y div 32), floor(x div 32),floor (y div 32), result_list))   
                    {
                    goal_x = ds_list_find_value(result_list, 0) * 32;
                    goal_y = ds_list_find_value(result_list, 1) * 32;
                     }
            else 
                    {
                    goal_x = x;
                    goal_y = y;
                     }
            ds_list_destroy(result_list);
            scr_generate_goal_field(goal_x, goal_y);
            dirox = goal_x;
            diroy = goal_y;
            scr_generate_flow_field();
            alarm[0]=13
            action=1
            buildarm=0
            }}
