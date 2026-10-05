// ally_cavaliere — Keyboard_F12 (eventtype=5 enumb=123)
// Estratto da gmx/objects/ally_cavaliere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Movimento con la flow field
if (selected == 1) {
    var result_list = ds_list_create();
    scr_free()
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
    }
