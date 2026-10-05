// enemy_picchiere — Collision_arciere_bullet (eventtype=4 ename=arciere_bullet)
// Estratto da gmx/objects/enemy_picchiere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///scampa
if warwork=0
    {var dirscampa=point_direction(other.x,other.y,x,y)
    var scampa_x=x+lengthdir_x(200,dirscampa)
    var scampa_y=y+lengthdir_y(200,dirscampa)
    if action!=1
    alarm[0]=13
    action=1
    dirox=scampa_x
    diroy=scampa_y
    }
