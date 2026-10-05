// castello — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/castello.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///attacco + altro
//sparare
if arm=1
if distance_to_object(instance_nearest(x,y,enemy_unit))<600
{arm=0
alarm[0]=50
if instance_nearest(x,y,enemy_unit).x>x
{if npresidio>0
instance_create(x+80,y-170,arciere_bullet_t)
if npresidio>1
instance_create(x+80,y-180,arciere_bullet_t)
if npresidio>2
instance_create(x+30,y-30,arciere_bullet_t)
if npresidio>3
instance_create(x+30,y-40,arciere_bullet_t)}
else
{if npresidio>0
instance_create(x-200,y-60,arciere_bullet_t)
if npresidio>1
instance_create(x-200,y-77,arciere_bullet_t)
if npresidio>2
instance_create(x-30,y-250,arciere_bullet_t)
if npresidio>3
instance_create(x-30,y-260,arciere_bullet_t)}
}
//pulsanti di selezione
if selected=1
if instance_number(ariete_clicker)=0
{
instance_create(0,0,ariete_clicker)
instance_create(0,0,catapulta_clicker)
instance_create(0,0,castello_indietro_clicker)
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
//morte e distruzione
if life<=0
{global.popcap-=5
instance_create(x,y,castelloruin)
instance_destroy()}
//assegnazione sprite
if life>slife*0.66
if sprite_index!=castello_spr
sprite_index=castello_spr
if life<slife*0.33
if sprite_index!=castello_r1
sprite_index=castello_r1
if life<slife*0.33
if sprite_index!=castello_r2
sprite_index=castello_r2
///bandiere presidio
if npresidio=1
if flagged1=0
    {instance_create(x,y-110,flag_r)
    flagged1=1}
if npresidio=2
if flagged2=0
    {instance_create(x,y-270,flag_r2)
    flagged2=1}    
if npresidio=3
if flagged3=0
    {instance_create(x-150,y-190,flag_r)
    flagged3=1}
if npresidio=4
if flagged4=0
    {instance_create(x+140,y-210,flag_r)
    flagged4=1}
