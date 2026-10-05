///scr_creazione_attaccanti()
//da usare in alarm 3 di caserma
var def_x = argument0; //punto da difendere, serve?
var def_y = argument1;
var def_id = argument2;
role=10
var new=instance_create(flagx,flagy,enemy_arciere)
with (new)
    {role=10
    scr_find_free_spawn_enemy()
    def_point_x = def_x;
    def_point_y = def_y;
    def_point_id = def_id
    }

