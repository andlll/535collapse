// b_arciere_bullet — Collision_ally_warrior (eventtype=4 ename=ally_warrior)
// Estratto da gmx/objects/b_arciere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Effetti su altro
var io_x=x
var io_y=y
scr_atk_signal()
with other
    {
    life-=6
    hit=1
    alarm[5]=47
    if warwork=0
        {alarm[10]=10
        var dirscampa=point_direction(io_x,io_y,x,y) //scampa
        var scampa_x=x+lengthdir_x(200,dirscampa)
        var scampa_y=y+lengthdir_y(200,dirscampa)
        flaggox=scampa_x
        flaggoy=scampa_y}}
instance_destroy()
