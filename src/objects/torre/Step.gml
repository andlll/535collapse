// torre — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/torre.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if arm=1
if distance_to_object(instance_nearest(x,y,enemy_unit))<600
{arm=0
alarm[0]=50
if instance_nearest(x,y,enemy_unit).x>x
{if npresidio>0
instance_create(x+20,y-60,arciere_bullet_t)
if npresidio>1
instance_create(x+20,y-77,arciere_bullet_t)}
else
{if npresidio>0
instance_create(x-20,y-60,arciere_bullet_t)
if npresidio>1
instance_create(x-20,y-77,arciere_bullet_t)}
}
//fine riparazione
if life>=slife
var xpos=x
var ypos=y
with (ally_omino)
    {if action=7
    if point_distance(repx,repy,xpos,ypos)<150
        {action=0
        repairwork=0
        global.idle+=1
        repx=noone
        repy=noone}}
///distruzione
if life<=0
{global.popcap-=5
instance_create(x,y,torreruin)
instance_destroy()}
//assegnazione sprite
if life>slife*0.66
if sprite_index!=torre_spr
sprite_index=torre_spr
if life<slife*0.33
if sprite_index!=torre_r1
sprite_index=torre_r1
if life<slife*0.33
if sprite_index!=torre_r2
sprite_index=torre_r2
///bandiera presidio
if npresidio=1
if flagged=0
    {instance_create(x,y-170,flag_r)
    flagged=1}
