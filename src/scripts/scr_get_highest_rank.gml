/// scr_get_highest_rank()
var best_inst = noone;
var best_rank = -999999;

var count = instance_number(ally_unit);
for (var i = 0; i < count; i++) {
    var inst = instance_find(ally_unit, i);
    if (inst.selected == 1) {
        if (inst.ordo > best_rank) {
            best_rank = inst.ordo;
            best_inst = inst;
        }
    }
}

return best_inst;
