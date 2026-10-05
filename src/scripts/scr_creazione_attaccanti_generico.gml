///scr_creazione_attaccanti()
//da usare in alarm 3 di caserma
role=30
alarm[3]=540
prod++
if prod>3
prod=1
if prod=1
var new=instance_create(flagx,flagy,enemy_warrior)
if prod=2
var new=instance_create(flagx,flagy,enemy_picchiere)
if prod=3
var new=instance_create(flagx,flagy,enemy_arciere)
with (new)
    {role=30
    scr_find_free_spawn_enemy()}

