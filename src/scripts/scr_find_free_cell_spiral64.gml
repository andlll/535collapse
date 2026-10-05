/// scr_find_free_cell_spiral64(aflagx, aflagy)
/// Cerca cella libera vicina a (aflagx, aflagy)
/// e assegna all'istanza flaggox / flaggoy
///
/// Versione fissa per celle 64x64

var aflagx = argument0;
var aflagy = argument1;

var cell_size = 64;

var gx = floor(aflagx / cell_size);
var gy = floor(aflagy / cell_size);

var gw = ds_grid_width(global.cost_field);
var gh = ds_grid_height(global.cost_field);

var step_len = 1;
var dir = 0;
var steps_done = 0;
var changes = 0;

var attempts = 0;
var max_attempts = 1000;

var found = false;
var fx = aflagx;
var fy = aflagy;

while (attempts < max_attempts) {
    switch(dir) {
        case 0: gx += 1; break;
        case 1: gy += 1; break;
        case 2: gx -= 1; break;
        case 3: gy -= 1; break;
    }
    attempts++;
    steps_done++;

    if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
        if (ds_grid_get(global.cost_field, gx, gy) < 1000) {
            fx = gx * cell_size + cell_size/2;
            fy = gy * cell_size + cell_size/2;
            found = true;
            break;
        }
    }

    if (steps_done >= step_len) {
        steps_done = 0;
        dir = (dir + 1) mod 4;
        changes++;
        if (changes mod 2 == 0) step_len++;
    }
}

// fallback
if (!found) {
    fx = clamp(aflagx, 0, (gw - 1) * cell_size + cell_size/2);
    fy = clamp(aflagy, 0, (gh - 1) * cell_size + cell_size/2);
}

// assegno alle variabili dell'istanza che esegue
flaggox = fx;
flaggoy = fy;

