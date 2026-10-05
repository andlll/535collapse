/// scr_find_valid_cell_backwards(goal_x, goal_y, start_x, start_y, list)
var goal_x = argument0;
var goal_y = argument1;
var start_x = argument2;
var start_y = argument3;
var list = argument4; // Lista passata come riferimento

var nx = goal_x;
var ny = goal_y;

// Se la cella iniziale è valida, la usiamo direttamente
if (ds_grid_get(goal_field, nx, ny) != -1) {
    ds_list_clear(list);
    ds_list_add(list, nx);
    ds_list_add(list, ny);
    return 1;
}

// Se non è valida, iniziamo la ricerca allargata
var range = 1;
var found = false;
var best_x = start_x;
var best_y = start_y;

while (!found && range < 10) { // Il valore 10 può essere aumentato se serve
    for (var dx = -range; dx <= range; dx++) {
        for (var dy = -range; dy <= range; dy++) {
            var tx = goal_x + dx;
            var ty = goal_y + dy;

            if (tx >= 0 && tx < ds_grid_width(goal_field) && ty >= 0 && ty < ds_grid_height(goal_field)) {
                if (ds_grid_get(goal_field, tx, ty) != -1) {
                    best_x = tx;
                    best_y = ty;
                    found = true;
                    break;
                }
            }
        }
        if (found) break;
    }
    range++;
}

// Se abbiamo trovato una cella valida, la usiamo
ds_list_clear(list);
ds_list_add(list, best_x);
ds_list_add(list, best_y);
return found;
