// debug_griglia_pathfinding — Draw (eventtype=8 enumb=0)
// Estratto da gmx/objects/debug_griglia_pathfinding.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///debug flow field

for (var yy = 0; yy < ds_grid_height(flow_field); yy++) {
    for (var xx = 0; xx < ds_grid_width(flow_field); xx++) {
        var dir = ds_grid_get(flow_field, xx, yy);
        draw_text(xx * 32 + 16, yy * 32 + 16, string(dir)); // Scrive la direzione sulla cella
    }
}

// --- azione 2: execute code ---
///debug cost field
draw_set_alpha(0.5)
for (var xa = 0; xa < global.grid_width; xa++) {
    for (var ya = 0; ya < global.grid_height; ya++) {
        var px = xa * global.grid_size;
        var py = ya * global.grid_size;
        var cost = ds_grid_get(global.cost_field, xa, ya);
        
        // Colore in base al valore della cella
        if (cost == 1000) {
            draw_set_color(c_red);
        } else {
            draw_set_color(make_color_rgb(144, 238, 144)); // Verde chiaro
        }
        
        draw_rectangle(px, py, px + global.grid_size, py + global.grid_size, false);
    }
}
draw_set_alpha(1)

// --- azione 3: execute code ---
///debug griglia pathfinding
draw_set_alpha(0)
for (x = 0; x < global.grid_width; x++) {
    for (y = 0; y < global.grid_height; y++) {
        var px = x * global.grid_size;
        var py = y * global.grid_size;
        var cost = ds_grid_get(global.cost_field, x, y);
        
        // Colore in base al valore della cella
        if (cost == 1000) {
            draw_set_color(c_red);
        } else {
            draw_set_color(make_color_rgb(144, 238, 144)); // Verde chiaro
        }
        
        draw_rectangle(px, py, px + global.grid_size, py + global.grid_size, false);
    }
}
draw_set_alpha(0.5)
for (var i = 0; i < ds_grid_width(global.goal_field); i++) {
    for (var j = 0; j < ds_grid_height(global.goal_field); j++) {
        var valo = ds_grid_get(global.goal_field, i, j);
        
        // Debug numerico
        draw_set_color(c_white);
        draw_text(i * 32 + 8, j * 32 + 8, string(valo));
    }

    }
    for (var i = 0; i < ds_grid_width(global.cost_field); i++) {
    for (var j = 0; j < ds_grid_height(global.cost_field); j++) {
        if (ds_grid_get(global.cost_field, i, j) == 1000) {
            draw_set_color(c_black);
            draw_rectangle(i * 32, j * 32, i * 32 + 32, j * 32 + 32, false);
        }
    }
}
draw_set_alpha(1)
