///scr_move_general (punto di arrivo x, punto di arrivo y)
        var result_list = ds_list_create();
    scr_free()
    if (scr_find_valid_cell_backwards(floor(argument0 div 32), floor(argument1 div 32), floor(x div 32),floor (y div 32), result_list))   
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
