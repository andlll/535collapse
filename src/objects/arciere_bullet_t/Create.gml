// arciere_bullet_t — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/arciere_bullet_t.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
alarm[0]=33
{direction=point_direction(x,y,instance_nearest(x,y,enemy_unit).x,instance_nearest(x,y,enemy_unit).y)
speed=27}
