// enemy_torre — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_torre.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visibile
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
var vicicast=instance_nearest(x,y,castello)
var vicitower=instance_nearest(x,y,torre)
if distance_to_object(vici)<150+150*(1-global.night) || distance_to_object(vicic)<200+200*(1-global.night) || hit=1 || distance_to_object(vicicast)<500+500*(1-global.night) || distance_to_object(vicitower)<500+500*(1-global.night) || room==menu|| global.fogville=0
visible=true

// --- azione 2: execute code ---
///morte
if life<=0
    {if x<650
    global.base2b--
    if y>5800
    global.base1b--
    if y>1500 && y<2800
    global.base3b--
    instance_create(x,y,torreruin)
    instance_destroy()
    with instance_nearest(x,y,flag_b)
    instance_destroy()}
//sparare
if arm=1
if distance_to_object(instance_nearest(x,y,ally_unit))<600 && instance_number(ally_unit)>0
    {arm=0
    alarm[0]=50
    if instance_nearest(x,y,ally_unit).x>x
            {instance_create(x+20,y-60,b_arciere_bullet_t)
            instance_create(x+20,y-77,b_arciere_bullet_t)}
        else
            {instance_create(x-20,y-60,b_arciere_bullet_t)
            instance_create(x-20,y-77,b_arciere_bullet_t)}}
