// albero — Destroy (eventtype=1 enumb=0)
// Estratto da gmx/objects/albero.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
/// Aggiornamento griglia pathfinding

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

        // Controlla se c'è un'istanza *diversa da sé stesso* in questa cella
        if (collision_rectangle(cell_x - global.grid_size / 2, cell_y - global.grid_size / 2,
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) {
            ds_grid_set(global.cost_field, gx, gy, 1); // Imposta la cella come libera
        }
    }
}

// --- azione 2: execute code ---
global.alberhover=0
var tipo=type
mori=instance_create(x,y,albero_morente)
with mori
    {type=tipo
    if type=1
    sprite_index=alb1
    if type=2
    sprite_index=alb2
    if type=3
    sprite_index=alb3
    if type=4
    sprite_index=alb4
    if type=5
    sprite_index=alb5
    if type=6
    sprite_index=alb6
    if type=7
    sprite_index=alb7
    if type=8
    sprite_index=alb8}
