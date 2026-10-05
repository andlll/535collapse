// porta_ori — Alarm_1 (eventtype=2 enumb=1)
// Estratto da gmx/objects/porta_ori.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var gx = floor(x / global.grid_size);
var gy = floor(y / global.grid_size);

ds_grid_set(global.cost_field, gx, gy, 1); // Libera la cella

var gx2 = floor(x-32 / global.grid_size);
var gy2 = floor(y / global.grid_size);

ds_grid_set(global.cost_field, gx2, gy2, 1); // Libera la cella

var gx3 = floor(x+32 / global.grid_size);
var gy3 = floor(y / global.grid_size);

ds_grid_set(global.cost_field, gx3, gy3, 1); // Libera la cella
