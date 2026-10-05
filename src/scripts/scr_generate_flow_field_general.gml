/// scr_generate_flow_field()
/// Genera la flow field basandosi sulla goal field

// Controlliamo che la flow field esista
if (!ds_exists(flow_field, ds_type_grid)) {
    show_error("Errore: Flow Field non inizializzata!", true);
}

// Puliamo la flow field
ds_grid_clear(flow_field, -1);

for (var yy = 0; yy < ds_grid_height(goal_field); yy++) {
    for (var xx = 0; xx < ds_grid_width(goal_field); xx++) {
        var cell_cost = ds_grid_get(goal_field, xx, yy);
        
        // Se la cella è inaccessibile, la ignoriamo
        if (cell_cost == -1) {
            ds_grid_set(flow_field, xx, yy, -1);
            continue;
        }

        var best_dir_x = 0;
        var best_dir_y = 0;
        var best_cost = cell_cost;

        // Controlliamo le 8 direzioni
        for (var i = 0; i < 8; i++) {
            var nx = xx + dir_x[i];
            var ny = yy + dir_y[i];

            // Controlliamo i limiti della griglia
            if (nx >= 0 && nx < ds_grid_width(goal_field) && ny >= 0 && ny < ds_grid_height(goal_field)) {
                var neighbor_cost = ds_grid_get(goal_field, nx, ny);

                // Se la cella adiacente è inaccessibile, la ignoriamo
                if (neighbor_cost == -1) continue;

                // Se la nuova cella ha un costo minore, aggiorniamo la direzione
                if (neighbor_cost < best_cost) {
                    best_cost = neighbor_cost;
                    best_dir_x = dir_x[i];
                    best_dir_y = dir_y[i];
                }
            }
        }

        // Se abbiamo trovato una direzione valida, la salviamo nella flow field
        if (best_dir_x != 0 || best_dir_y != 0) {
            ds_grid_set(flow_field, xx, yy, point_direction(0, 0, best_dir_x, best_dir_y));
        } else {
            ds_grid_set(flow_field, xx, yy, -1); // Nessuna direzione valida
        }
    }
}
