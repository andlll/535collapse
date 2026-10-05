///scr_inizializza_percorso_nemici (bersaglio)
var bersaglio = argument0;
if instance_exists(bersaglio)
    {flow_field = ds_grid_create(room_width div 32, room_height div 32);
    scr_generate_goal_field(bersaglio.x,bersaglio.y);
    scr_generate_flow_field();
    }
