/// scr_conta_difensori(id_area)
var def_value = argument0;
var c = 0;

with (enemy_unit) {
    if (def_id == def_value) {
        c += 1;
    }
}

return c;
