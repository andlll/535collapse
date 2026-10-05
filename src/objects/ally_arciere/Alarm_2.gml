// ally_arciere — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/ally_arciere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Creazione freccia
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
        var inst=instance_create(x,y-40,arciere_bullet)
        if atkorder=0
            {with (inst)
                {direction=point_direction(x,y,instance_nearest(x,y,enemy_unit).x,instance_nearest(x,y,enemy_unit).y)
                speed=20}}
        else
            {var atkx=atktarget.x
            var atky=atktarget.y
            with (inst)
                {direction=point_direction(x,y,atkx,atky)
                speed=20}
                exit}}}
