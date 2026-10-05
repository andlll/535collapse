// barn — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/barn.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Variabili iniziali
depth=-y
life=150
slife=150
selected=0
alarm[0]=12
fondazione=0
pietra=0
legno=1
hit=0
onfire=0
firestarted=0

// --- azione 2: drag&drop action_sprite_set ---
action_sprite_set(mul1, 0, 0.3);

// --- azione 3: execute code ---
/// Aggiornamento griglia pathfinding
mask_index=barn_mask
// Trova i limiti della maschera di collisione
var left = bbox_left;
var right = bbox_right;
var top = bbox_top;
var bottom = bbox_bottom;

// Converte in coordinate di griglia forzando valori interi
var gx_start = floor(left / global.grid_size);
var gy_start = floor(top / global.grid_size);
var gx_end = floor(right / global.grid_size);
var gy_end = floor(bottom / global.grid_size);

// Scansiona cella per cella verificando la collisione
for (var gx = gx_start; gx <= gx_end; gx++) {
    for (var gy = gy_start; gy <= gy_end; gy++) {
        // Trova il centro della cella in pixel
        var cell_x = gx * global.grid_size + global.grid_size / 2;
        var cell_y = gy * global.grid_size + global.grid_size / 2;

        // Controlla se c'è un'istanza diversa da sé stesso in questa cella
        if (collision_rectangle(cell_x - global.grid_size / 2, cell_y - global.grid_size / 2,
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) {
            ds_grid_set(global.cost_field, gx, gy, 1000); // Imposta la cella come ostacolo
        }
    }
}

// --- azione 4: execute code ---
///Azioni per costruttori barn
var iddo=id
if instance_number(campo)>0
with (ally_omino)
    {if distance_to_object(iddo)<10
        {
            {foodwork=1
                            var result_list = ds_list_create();
            if (scr_find_valid_cell_backwards(floor(dirox div 32), floor(diroy div 32), floor(x div 32),floor (y div 32), result_list))   
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
            dirox=instance_nearest(x,y,campo).x
            diroy=instance_nearest(x,y,campo).y}
        action=1
        alarm[0]=13}
    }
mask_index=barn_mask
