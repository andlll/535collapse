// b_arciere_bullet — Collision_ally_catapulta (eventtype=4 ename=ally_catapulta)
// Estratto da gmx/objects/b_arciere_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Effetti su altro
var io_x=x
var io_y=y
scr_atk_signal()
with other
    {
    life-=3
    hit=1
    alarm[5]=47
    if action=0
        {if alarm[0]<1
        alarm[0]=10
        var dirscampa=point_direction(io_x,io_y,x,y) //scampa
        var scampa_x=x+lengthdir_x(200,dirscampa)
        var scampa_y=y+lengthdir_y(200,dirscampa)
        action=1
        step=0
        warwork=4
        dirox=scampa_x
        diroy=scampa_y}}
instance_destroy()
