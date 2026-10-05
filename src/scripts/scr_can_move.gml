/// scr_can_move(x0, y0, dir_index)
/// Controlla se possiamo muoverci nella direzione dir_index da (x0, y0)
var new_x = argument0 + (dir_x[argument2] * 32);
var new_y = argument1 + (dir_y[argument2] * 32);

// Se è un movimento orizzontale o verticale, basta controllare la cella target
if (argument2 < 4) {
    return place_free(new_x, new_y);
}

// Se è un movimento diagonale, controlliamo anche le due celle adiacenti
var check_x = place_free(argument0 + (dir_x[argument2] * 32), argument1);
var check_y = place_free(argument0, argument1 + (dir_y[argument2] * 32));

return place_free(new_x, new_y) && check_x && check_y;
