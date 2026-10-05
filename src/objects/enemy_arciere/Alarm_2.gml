// enemy_arciere — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/enemy_arciere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Quiss spara
if distance_to_object(instance_nearest(x,y,ally_unit))>400 || instance_number(ally_unit)=0
    {action=0
    warwork=0
    speed=0}
if action=2
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=30
        exit}
    if step=2
        {step=0
        alarm[2]=13
        var inst=instance_create(x,y-40,b_arciere_bullet)
        var diri=direction
        with (inst)
            {if instance_number(ally_unit)>0
            direction=point_direction(x,y,instance_nearest(x,y,ally_unit).x,instance_nearest(x,y,ally_unit).y)
            else
            direction=diri
            speed=20}
            exit}}
