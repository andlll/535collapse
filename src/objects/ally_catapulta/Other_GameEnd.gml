// ally_catapulta — Other_GameEnd (eventtype=7 enumb=3)
// Estratto da gmx/objects/ally_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///script buono
if selected=1
    {
    dirox=mouse_x
    diroy=mouse_y
    action=1
    warwork=4}
    if position_meeting(mouse_x,mouse_y,enemy)
    if distance_to_object(mouser)<500
        {
        warwork=1
        var inst=instance_create(x,y,catapulta_bullet)
        with (inst)
        {direction=instance_nearest(x,y,ally_catapulta).direction
        speed=3}
        exit}
    if speed=0
    alarm[0]=13

// --- azione 2: execute code ---
///attacco
if !instance_exists(target_eu)
target_eu=noone
//in automatico senza selezionare nemici
if target_eu=noone
    {
    if distance_to_object(instance_nearest(x,y,enemy_unit))<10*(1-0.36*abs(sin(degtorad(direction))))
        {if warwork=2
            {targetx=instance_nearest(x,y,enemy_unit).x
            targety=instance_nearest(x,y,enemy_unit).y
            direction=point_direction(x,y,targetx,targety)}
        if warwork!=2 && warwork!=4
            {action=2
            warwork=2
            alarm[2]=13
            }exit}
    else
        {if warwork=2
            {action=0
            warwork=0
            speed=0}
        if warwork=1 && distance_to_object(instance_nearest(x,y,enemy_unit))>=comp*(1-0.36*abs(sin(degtorad(direction))))
            {action=0
            warwork=0
            speed=0}}
    if distance_to_object(instance_nearest(x,y,enemy_unit))<comp*(1-0.36*abs(sin(degtorad(direction))))
    if warwork=0 || warwork=1
        {if action!=1
        alarm[0]=15
        action=1
        warwork=1
        dirox=instance_nearest(x,y,enemy_unit).x
        diroy=instance_nearest(x,y,enemy_unit).y}}
//clic destro su nemico
else
   {
    if distance_to_object(target_eu)<10*(1-0.36*abs(sin(degtorad(direction))))
        {if warwork=2
            {targetx=target_eu.x
            targety=target_eu.y
            target_eu=noone
            direction=point_direction(x,y,targetx,targety)}
        if warwork!=2 && warwork!=4
            {action=2
            warwork=2
            alarm[2]=13
            }exit}
    else
        {if warwork=2
            {action=0
            warwork=0
            speed=0
            target_eu=noone}
        }
    if warwork=0 || warwork=1
        {if action!=1
        alarm[0]=15
        action=1
        warwork=1
        dirox=target_eu.x
        diroy=target_eu.y}}
