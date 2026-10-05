/// scr_find_nearest_reachable_cell(goal_x, goal_y, start_x, start_y, list)
var goal_x = argument0;
var goal_y = argument1;
var start_x = argument2;
var start_y = argument3;
var list = argument4; // Lista passata come riferimento

var nx = goal_x;
var ny = goal_y;

while (nx != start_x || ny != start_y) {
    if (ds_grid_get(goal_field, nx, ny) != -1) {
        ds_list_clear(list);
        ds_list_add(list, nx);
        ds_list_add(list, ny);
        return 1;
    }

    var best_x = nx;
    var best_y = ny;
    var best_cost = ds_grid_get(goal_field, nx, ny);

    for (var i = 0; i < 8; i++) {
        var tx = nx + dir_x[i];
        var ty = ny + dir_y[i];

        if (tx >= 0 && tx < ds_grid_width(goal_field) && ty >= 0 && ty < ds_grid_height(goal_field)) {
            var cost = ds_grid_get(goal_field, tx, ty);
            if (cost >= 0 && cost < best_cost) {
                best_cost = cost;
                best_x = tx;
                best_y = ty;
            }
        }
    }

    if (best_x == nx && best_y == ny) {
        break;
    }

    nx = best_x;
    ny = best_y;
}

// Se nessuna cella valida è trovata, restituiamo la posizione originale
ds_list_clear(list);
ds_list_add(list, start_x);
ds_list_add(list, start_y);
return 0;
