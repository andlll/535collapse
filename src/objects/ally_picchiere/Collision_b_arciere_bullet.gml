// ally_picchiere — Collision_b_arciere_bullet (eventtype=4 ename=b_arciere_bullet)
// Estratto da gmx/objects/ally_picchiere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///vai verso il tipo che ti ha sparato
with instance_nearest(x,y,enemy_arciere) //verifica sia visibile
    {if visible=true
    var vis=true
    else
    var vis=false}
visib=vis
if (action==0 || action==1) && warwark!=4 && vis==true
    {action=1
    target_eu=noone
    dirox=instance_nearest(x,y,enemy_arciere).x
    diroy=instance_nearest(x,y,enemy_arciere).y
    warwork=4
    if speed=0
    alarm[0]=13
    }
