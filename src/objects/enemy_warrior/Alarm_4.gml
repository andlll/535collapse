// enemy_warrior — Alarm_4 (eventtype=2 enumb=4)
// Estratto da gmx/objects/enemy_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///dare fuoco alle case
if action=6
    {if step=0
        {step=1
        alarm[4]=13
        exit}
    if step=1
        {step=2
        alarm[4]=13
        exit}
    if step=2
        {if instance_exists(targetid)
            {step=0
            alarm[4]=38
            var inst=instance_create(x,y-67,fire_bullet)
            var tgx=targetid.x
            var tgy=targetid.y
            with (inst)
                {motion_add(point_direction(x,y,tgx,tgy),8)
                }
            exit}
        else
            {action=0
            targetid=noone
            firework=0}}}
        
