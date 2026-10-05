var gx = floor(x / global.grid_size);
var gy = floor(y / global.grid_size);

ds_grid_set(global.cost_field, gx, gy, 1); // Libera la cella
