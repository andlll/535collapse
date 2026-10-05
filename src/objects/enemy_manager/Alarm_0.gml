// enemy_manager — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/enemy_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///aggressione ai civili
if instance_number(ally_omino)>0
    with(enemy_unit)
        {if defender=0 && action!=1 && action!=2 && action!=6 && firework=0
            {alarm[0]=15
            action=1
            warwork=1
            dirox=instance_nearest(x,y,ally_omino).x
            diroy=instance_nearest(x,y,ally_omino).y}}
 with(enemy_catapulta) 
        {if action!=1
        if action!=2
            {alarm[0]=15
            action=1
            warwork=1
            dirox=instance_nearest(x,y,ally_build).x
            diroy=instance_nearest(x,y,ally_build).y}}
 with(enemy_ariete) 
        {if action!=1
        if action!=2
            {alarm[0]=15
            action=1
            warwork=1
            dirox=instance_nearest(x,y,ally_build).x
            diroy=instance_nearest(x,y,ally_build).y}}
alarm[0]=600
