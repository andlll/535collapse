// ally_catapulta — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/ally_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if action=2
   {if step=0
        {step=1
        alarm[2]=10
        exit}
    if step=1
        {var dirx=targx
        var diry=targy
        if phase=6
        var inst=instance_create(x+35,y-89,catapulta_bullet)
        if phase=7
        var inst=instance_create(x,y-85,catapulta_bullet)
        if phase=8
        var inst=instance_create(x-35,y-89,catapulta_bullet)
        if phase=1
        var inst=instance_create(x-44,y-62,catapulta_bullet)
        if phase=2
        var inst=instance_create(x-38,y-50,catapulta_bullet)
        if phase=3
        var inst=instance_create(x,y-44,catapulta_bullet)
        if phase=4
        var inst=instance_create(x+39,y-59,catapulta_bullet)
        if phase=5
        var inst=instance_create(x+45,y-72,catapulta_bullet)
        with (inst)
            {direction=point_direction(x,y,dirx,diry)
            objectivex=dirx
            objectivey=diry
            alarm[0]=distance_to_point(objectivex,objectivey)/speed
            startspeed=alarm[0]*.1
            speed=5}
        step=2
        alarm[2]=10
        loaded=0
        exit}
    if step=2
        {step=3
        alarm[2]=45
        exit}
    if step=3
            {step=0
            action=0
            exit}}
