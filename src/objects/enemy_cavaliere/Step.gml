// enemy_cavaliere — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_cavaliere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visibile
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
var vicicast=instance_nearest(x,y,castello)
var vicitower=instance_nearest(x,y,torre)
if distance_to_object(vici)<150+150*(1-global.night) || distance_to_object(vicic)<200+200*(1-global.night) || hit=1 || distance_to_object(vicicast)<500+500*(1-global.night) || distance_to_object(vicitower)<500+500*(1-global.night) || room==menu || global.fogville=0
visible=true
else
visible=false

// --- azione 2: execute code ---
///direzione e morte
var diro=direction
if life<=0
    {var corpse=instance_create(x,y,enemy_cavaliere_corpse)
    if hover=1
        {hover=0
        global.enemyhover=0}
    instance_destroy()
    with (corpse)
    direction=diro}

// --- azione 3: execute code ---
///impostazioni di step
mp_potential_settings(30,3,3,true)

// --- azione 4: execute code ---
///velocità di movimento
autospeed=4*(1-0.36*abs(sin(degtorad(direction))))

// --- azione 5: execute code ---
///direzione
depth=-y
if direction<22.5
phase=1
if direction>=337.5
phase=1
if direction>=22.5
if direction<67.5
phase=2
if direction>=67.5
if direction<112.5
phase=3
if direction>=112.5
if direction<157.5
phase=4
if direction>=157.5
if direction<202.5
phase=5
if direction>=202.5
if direction<247.5
phase=6
if direction>=247.5
if direction<292.5
phase=7
if direction>=292.5
if direction<337.5
phase=8

// --- azione 6: execute code ---
///quando fermarsi
if action=1 
if x=dirox
if y=diroy
    {action=0
    speed=0}

// --- azione 7: execute code ---
///Movimento nemici con FF
scr_movimento_nemici_ff()

// --- azione 8: execute code ---
///assegnazione sprite
if action=0
    {if phase=1
    sprite_index=bcw41
    if phase=2
    sprite_index=bcw51
    if phase=3
    sprite_index=bcw61
    if phase=4
    sprite_index=bcw71
    if phase=5
    sprite_index=bcw81
    if phase=6
    sprite_index=bcw11
    if phase=7
    sprite_index=bcw21
    if phase=8
    sprite_index=bcw31}
if action=1
    {if phase=1
        {if step=0
        sprite_index=bcw41
        if step=1
        sprite_index=bcw42
        if step=2
        sprite_index=bcw41
        if step=3
        sprite_index=bcw43}
    if phase=2
        {if step=0
        sprite_index=bcw51
        if step=1
        sprite_index=bcw52
        if step=2
        sprite_index=bcw51
        if step=3
        sprite_index=bcw53}
    if phase=3
        {if step=0
        sprite_index=bcw61
        if step=1
        sprite_index=bcw62
        if step=2
        sprite_index=bcw61
        if step=3
        sprite_index=bcw63}
    if phase=4
        {if step=0
        sprite_index=bcw71
        if step=1
        sprite_index=bcw72
        if step=2
        sprite_index=bcw71
        if step=3
        sprite_index=bcw73}
    if phase=5
        {if step=0
        sprite_index=bcw81
        if step=1
        sprite_index=bcw82
        if step=2
        sprite_index=bcw81
        if step=3
        sprite_index=bcw83}
    if phase=6
        {if step=0
        sprite_index=bcw11
        if step=1
        sprite_index=bcw12
        if step=2
        sprite_index=bcw11
        if step=3
        sprite_index=bcw13}
    if phase=7
        {if step=0
        sprite_index=bcw21
        if step=1
        sprite_index=bcw22
        if step=2
        sprite_index=bcw21
        if step=3
        sprite_index=bcw23}
    if phase=8
        {if step=0
        sprite_index=bcw31
        if step=1
        sprite_index=bcw32
        if step=2
        sprite_index=bcw31
        if step=3
        sprite_index=bcw33}}
if action=2 && instance_exists(ally_unit) //girati verso il bersaglio
    {var bersaglio=instance_nearest(x,y,ally_unit)
    direction=point_direction(x,y,bersaglio.x,bersaglio.y)}
if action>=2
if action<6
    {if phase=1
        {if step=0
        sprite_index=bca41
        if step=1
        sprite_index=bca42
        if step=2
        sprite_index=bca43}
    if phase=2
        {if step=0
        sprite_index=bca51
        if step=1
        sprite_index=bca52
        if step=2
        sprite_index=bca53}
    if phase=3
        {if step=0
        sprite_index=bca61
        if step=1
        sprite_index=bca62
        if step=2
        sprite_index=bca63}
    if phase=4
        {if step=0
        sprite_index=bca71
        if step=1
        sprite_index=bca72
        if step=2
        sprite_index=bca73}
    if phase=5
        {if step=0
        sprite_index=bca81
        if step=1
        sprite_index=bca82
        if step=2
        sprite_index=bca83}
    if phase=6
        {if step=0
        sprite_index=bca11
        if step=1
        sprite_index=bca12
        if step=2
        sprite_index=bca13}
    if phase=7
        {if step=0
        sprite_index=bca21
        if step=1
        sprite_index=bca22
        if step=2
        sprite_index=bca23}
    if phase=8
        {if step=0
        sprite_index=bca31
        if step=1
        sprite_index=bca32
        if step=2
        sprite_index=bca33}}

// --- azione 9: execute code ---
///se posto in cui fermarsi è occupato
if action=1
if place_empty(dirox,diroy)=false
{dirox+=irandom_range(-20,20)
diroy+=irandom_range(-20,20)}

// --- azione 10: execute code ---
///se il posto in cui fermarsi è occupato bis
if action=1
{if place_free(dirox,diroy)=false
{dirox+=irandom_range(-30,30)
diroy+=irandom_range(-30,30)}}

// --- azione 11: execute code ---
///se non ci sono pulsanti costruzione in giro
if instance_number(torre_placer)>0
global.sele=1

// --- azione 12: execute code ---
///attacco
if instance_exists(ally_unit)
    {if distance_to_object(instance_nearest(x,y,ally_unit))<10*(1-0.36*abs(sin(degtorad(direction)))) //se sei molto vicino ad un nemico
        {if warwork=2&& alarm[2]<1
            {chargespeed=0
            targetx=instance_nearest(x,y,ally_unit).x
            targety=instance_nearest(x,y,ally_unit).y
            direction=point_direction(x,y,targetx,targety)}
        if warwork!=2&& alarm[2]<1 //mena
            {chargespeed=0
            action=2
            warwork=2
            alarm[2]=13
            }exit}
    if instance_number(fog01)>0 //nebbia
        {if distance_to_object(instance_nearest(x,y,fog01))>290
            {if distance_to_object(instance_nearest(x,y,ally_unit))<400*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction)))) //vai verso nemico più vicino
                {if warwork=0 || warwork=1 && alarm[2]<1
                    {if action!=1
                    alarm[0]=10
                    action=1
                    warwork=1
                    dirox=instance_nearest(x,y,ally_unit).x
                    diroy=instance_nearest(x,y,ally_unit).y}}}
            else
            {if distance_to_object(instance_nearest(x,y,ally_unit))<200*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction)))) //stessa roba ma con nebbia
                {if warwork=0 || warwork=1 && alarm[2]<1
                    {if action!=1
                    alarm[0]=10
                    action=1
                    warwork=1
                    dirox=instance_nearest(x,y,ally_unit).x
                    diroy=instance_nearest(x,y,ally_unit).y}}}}
        else
            {if distance_to_object(instance_nearest(x,y,ally_unit))<400*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction)))) //se non c'è nebbia
            {if warwork=0 || warwork=1 && alarm[2]<1
                {if action!=1
                alarm[0]=10
                action=1
                warwork=1
                dirox=instance_nearest(x,y,ally_unit).x
                diroy=instance_nearest(x,y,ally_unit).y}}}
if action=0 && warwork=1
warwork=0}
