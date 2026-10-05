// chiesaruin — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/chiesaruin.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
selected=0
stonework=0
depth=-y
stone=75
fase=1
visible=false

// --- azione 2: execute code ---
///aggiorna la griglia del pathfinding
// Trova i limiti della maschera di collisione
var left = bbox_left;
var right = bbox_right;
var top = bbox_top;
var bottom = bbox_bottom;

// Converte in coordinate di griglia
var gx_start = left div global.grid_size;
var gy_start = top div global.grid_size;
var gx_end = right div global.grid_size;
var gy_end = bottom div global.grid_size;

// Scansiona cella per cella verificando la collisione
for (var gx = gx_start; gx <= gx_end; gx++) {
    for (var gy = gy_start; gy <= gy_end; gy++) {
        // Trova le coordinate pixel del centro della cella
        var cell_x = gx * global.grid_size + global.grid_size / 2;
        var cell_y = gy * global.grid_size + global.grid_size / 2;

        // Controlla se la cella è occupata dalla maschera di collisione dell'edificio
        if (collision_rectangle(cell_x - global.grid_size / 2, cell_y - global.grid_size / 2,
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, true)) {
            ds_grid_set(global.cost_field, gx, gy, 1000); // Imposta la cella come ostacolo solo se c'è collisione
        }
    }
}
