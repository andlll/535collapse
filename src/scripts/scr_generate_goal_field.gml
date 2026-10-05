/// Script: generate_goal_field(goal_x, goal_y)

// Ottieni le coordinate della destinazione in griglia
var gx_goal = floor(argument0 / global.grid_size);
var gy_goal = floor(argument1 / global.grid_size);

// Creiamo una nuova griglia per il Goal Field
if (ds_exists(goal_field, ds_type_grid)) ds_grid_destroy(goal_field);
goal_field = ds_grid_create(global.grid_width, global.grid_height);
ds_grid_set_region(goal_field, 0, 0, global.grid_width - 1, global.grid_height - 1, -1); // Inizializza tutto a -1

// Creiamo una coda per BFS
var queue_x = ds_list_create();
var queue_y = ds_list_create();

// Aggiungiamo la destinazione alla coda
ds_list_add(queue_x, gx_goal);
ds_list_add(queue_y, gy_goal);
ds_grid_set(goal_field, gx_goal, gy_goal, 0); // La destinazione ha valore 0

// BFS Loop
while (ds_list_size(queue_x) > 0) {
    // Prendiamo il primo elemento della coda
    var cx = ds_list_find_value(queue_x, 0);
    var cy = ds_list_find_value(queue_y, 0);
    ds_list_delete(queue_x, 0);
    ds_list_delete(queue_y, 0);

    // Valore della cella attuale
    var current_value = ds_grid_get(goal_field, cx, cy);

// Creazione delle direzioni X e Y
dir_x = array_create(8);
dir_y = array_create(8);

// Direzioni cardinali (orizzontale/verticale)
dir_x[0] = 1;  dir_y[0] = 0;  // Destra
dir_x[1] = -1; dir_y[1] = 0;  // Sinistra
dir_x[2] = 0;  dir_y[2] = -1; // Su
dir_x[3] = 0;  dir_y[3] = 1;  // Giù

// Direzioni diagonali
dir_x[4] = 1;  dir_y[4] = -1; // Alto-Destra
dir_x[5] = -1; dir_y[5] = -1; // Alto-Sinistra
dir_x[6] = 1;  dir_y[6] = 1;  // Basso-Destra
dir_x[7] = -1; dir_y[7] = 1;  // Basso-Sinistra

    for (var i = 0; i < 4; i++) {
        var nx = cx + dir_x[i];
        var ny = cy + dir_y[i];

        // Controlla se è dentro i limiti della griglia e non è un ostacolo
        if (nx >= 0 && nx < global.grid_width && ny >= 0 && ny < global.grid_height) {
            if (ds_grid_get(goal_field, nx, ny) == -1 && ds_grid_get(global.cost_field, nx, ny) < 1000) {
                ds_grid_set(goal_field, nx, ny, current_value + 1);
                ds_list_add(queue_x, nx);
                ds_list_add(queue_y, ny);
            }
        }
    }
}

// Pulizia memoria
ds_list_destroy(queue_x);
ds_list_destroy(queue_y);
