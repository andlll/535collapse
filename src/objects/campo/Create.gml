// campo — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/campo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
/// Aggiornamento griglia pathfinding - Libera celle

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
            ds_grid_set(global.cost_field, gx, gy, 1); // Imposta la cella come ostacolo
        }
    }
}

// --- azione 2: drag&drop action_if_dice ---
if (action_if_dice(2))
{
    // --- azione 3: execute code ---
    ///Sprite index randomico, legacy?
    sprite_index=campo2
}

// --- azione 4: execute code ---
///Variabili iniziali
selected=0
foodwork=0
life=100
slife=100
onfire=0
firestarted=0
alarm[0]=120
alarm[2]=30
alarm[3]=5

// --- azione 5: execute code ---
///Burst grano
grass_system = part_system_create();
part_system_depth(grass_system, -1); // Sta sopra al terreno
wind = sin(current_time * 0.0002) * 5;
// Creazione della particella "erba"
grass_particle = part_type_create();
part_type_sprite(grass_particle,part_crop,0,0,0)
part_type_size(grass_particle, 0.4, 0.7, 0, 0); // Altezza variabile
part_type_alpha2(grass_particle, 0.3, 0.7); // Leggera dissolvenza
part_type_orientation(grass_particle, -15, 15, 0, 4,0); // Leggera inclinazione
part_type_speed(grass_particle, 0, 0, 0, 0); // Fermo
part_type_life(grass_particle, 99999999, 99999999); // Vita lunghissima

// Creazione dell’emitter
grass_emitter = part_emitter_create(grass_system);

// Creazione dell'erba solo una volta all'inizio
part_emitter_region(grass_system, grass_emitter, x-145, x+145, y-90, y+90, ps_shape_diamond, ps_distr_linear);
part_emitter_burst(grass_system, grass_emitter, grass_particle, 700); 
