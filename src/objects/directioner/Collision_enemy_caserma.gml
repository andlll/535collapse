// directioner — Collision_enemy_caserma (eventtype=4 ename=enemy_caserma)
// Estratto da gmx/objects/directioner.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var dirr=image_angle
with (other)
    {flagx=x+lengthdir_x(200,dirr)
    flagy=y+lengthdir_y(200,dirr)}
instance_destroy()
