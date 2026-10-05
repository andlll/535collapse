/// scr_find_free_spawn_spiral()
/// Sposta l'istanza alla cella libera più vicina, cercando a spirale

var max_attempts = 500;
var attempts = 0;

var gx = floor(x / global.grid_size);
var gy = floor(y / global.grid_size);

var gw = ds_grid_width(global.cost_field);
var gh = ds_grid_height(global.cost_field);

// Se la cella attuale è già libera ed è dentro i limiti
if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
    if (ds_grid_get(global.cost_field, gx, gy) < 1000) {
        // niente da fare, resti dove sei
        exit;
    }
}

// Movimento a spirale
var step_len = 1;
var dir = 0;          // 0=destra, 1=giu, 2=sinistra, 3=su
var steps_done = 0;
var changes = 0;

while (attempts < max_attempts) {
    // muovi la posizione grid
    switch(dir) {
        case 0: gx += 1; break;
        case 1: gy += 1; break;
        case 2: gx -= 1; break;
        case 3: gy -= 1; break;
    }

    attempts++;
    steps_done++;

    // controlla che sia dentro i limiti della grid
    if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
        if (ds_grid_get(global.cost_field, gx, gy) < 1000) {
            x = gx * global.grid_size;
            y = gy * global.grid_size;
            break; // trovato
        }
    }
    // se invece è fuori dai limiti → NON faccio nulla, continuo la spirale

    if (steps_done >= step_len) {
        steps_done = 0;
        dir = (dir + 1) mod 4;
        changes++;
        if (changes mod 2 == 0) step_len++;
    }
}
