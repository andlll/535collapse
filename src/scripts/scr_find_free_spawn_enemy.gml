/// scr_find_free_spawn_spiral()
/// Sposta l'istanza alla cella libera più vicina, cercando a spirale
/// Usa place_free() per controllare gli ostacoli solidi

var max_attempts = 500;
var attempts = 0;

var gx = floor(x / global.grid_size);
var gy = floor(y / global.grid_size);

var gw = room_width div global.grid_size;
var gh = room_height div global.grid_size;

// Se la cella attuale è libera ed è dentro i limiti
if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
    var xx = gx * global.grid_size;
    var yy = gy * global.grid_size;
    if (place_free(xx, yy)) {
        exit; // già libera
    }
}

// Movimento a spirale
var step_len = 1;
var dir = 0;          // 0=destra, 1=giu, 2=sinistra, 3=su
var steps_done = 0;
var changes = 0;

while (attempts < max_attempts) {
    switch (dir) {
        case 0: gx += 1; break;
        case 1: gy += 1; break;
        case 2: gx -= 1; break;
        case 3: gy -= 1; break;
    }

    attempts++;
    steps_done++;

    if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
        var xx = gx * global.grid_size;
        var yy = gy * global.grid_size;

        if (place_free(xx, yy)) {
            x = xx;
            y = yy;
            break; // trovato
        }
    }

    if (steps_done >= step_len) {
        steps_done = 0;
        dir = (dir + 1) mod 4;
        changes++;
        if (changes mod 2 == 0) step_len++;
    }
}
