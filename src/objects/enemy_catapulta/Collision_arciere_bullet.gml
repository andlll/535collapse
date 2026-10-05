// enemy_catapulta — Collision_arciere_bullet (eventtype=4 ename=arciere_bullet)
// Estratto da gmx/objects/enemy_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if action=0 || action=1
{action=1
dirox=instance_nearest(x,y,ally_arciere).x
diroy=instance_nearest(x,y,ally_arciere).y
if alarm[0]=0
alarm[0]=13
warwork=1}
