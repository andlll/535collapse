// enemy_manager_menu — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/enemy_manager_menu.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///aggressione ai civili
if instance_number(ally_unit)>0
    with(enemy_unit)
        {if action!=1 && action!=2
        if action!=6
            {
            target_eu=instance_nearest(x,y,ally_unit)
            dirox=instance_nearest(x,y,ally_unit).x
            diroy=instance_nearest(x,y,ally_unit).y
            targetx=dirox
            targety=diroy
            action=1
            warwork=1
            alarm[0]=15}}
if instance_number(enemy_unit)>0
    with(ally_unit)
        {if action!=1 && action!=2
        if action!=6
            {
            target_eu=instance_nearest(x,y,enemy_unit)
            dirox=instance_nearest(x,y,enemy_unit).x
            diroy=instance_nearest(x,y,enemy_unit).y
            action=1
            warwork=1
            alarm[0]=15}}
alarm[0]=9000
