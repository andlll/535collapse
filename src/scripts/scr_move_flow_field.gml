///scr_move_flow_field
// Otteniamo la posizione attuale nella griglia
var grid_x = floor(x / 32);
var grid_y = floor(y / 32);

// Leggiamo l'angolo della Flow Field escludendo il caso in cui sia -1
if ds_grid_get(flow_field, grid_x, grid_y)!=-1
target_angle = ds_grid_get(flow_field, grid_x, grid_y);
direction=target_angle

// Calcoliamo il movimento
move_x = lengthdir_x(autospeed, direction);
move_y = lengthdir_y(autospeed, direction);

// Applichiamo il movimento
x += move_x;
y += move_y;

