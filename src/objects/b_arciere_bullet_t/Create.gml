// b_arciere_bullet_t — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/b_arciere_bullet_t.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
alarm[0]=33
if instance_number(ally_unit)>0
{direction=point_direction(x,y,instance_nearest(x,y,ally_unit).x,instance_nearest(x,y,ally_unit).y)
speed=27}
