/// scr_clear_particles()
if (variable_global_exists("ps_list")) {
    var count = ds_list_size(global.ps_list);
    for (var i = 0; i < count; i++) {
        var ps = global.ps_list[| i];
        if (part_system_exists(ps)) {
            part_system_destroy(ps);
        }
    }
    ds_list_clear(global.ps_list);
}
