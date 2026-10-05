// enemy_ariete — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visibile
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
var vicicast=instance_nearest(x,y,castello)
var vicitower=instance_nearest(x,y,torre)
if distance_to_object(vici)<150+150*(1-global.night) || distance_to_object(vicic)<200+200*(1-global.night) || hit=1 || distance_to_object(vicicast)<500+500*(1-global.night) || distance_to_object(vicitower)<500+500*(1-global.night) || global.fogville=0
visible=true
else
visible=false

// --- azione 2: execute code ---
///direzione e morte
var diro=direction
if life<=0
{var corpse=instance_create(x,y,enemy_ariete_corpse)
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
autospeed=2*(1-0.36*abs(sin(degtorad(direction))))

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

// --- azione 7: drag&drop action_if_variable ---
if (action == 1)
{
    // --- azione 8: drag&drop action_potential_step [assoluto] ---
    action_potential_step(dirox, diroy, autospeed, 0);
}

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
///assegnazione sprite
if action=0
{if phase=1
sprite_index=bara41
if phase=2
sprite_index=bara51
if phase=3
sprite_index=bara61
if phase=4
sprite_index=bara71
if phase=5
sprite_index=bara81
if phase=6
sprite_index=bara11
if phase=7
sprite_index=bara21
if phase=8
sprite_index=bara31}

if action=1
{if phase=1
{if step=0
sprite_index=barm41
if step=1
sprite_index=barm42
if step=2
sprite_index=barm41
if step=3
sprite_index=barm43}
if phase=2
{if step=0
sprite_index=barm51
if step=1
sprite_index=barm52
if step=2
sprite_index=barm51
if step=3
sprite_index=barm53}
if phase=3
{if step=0
sprite_index=barm61
if step=1
sprite_index=barm62
if step=2
sprite_index=barm61
if step=3
sprite_index=barm63}
if phase=4
{if step=0
sprite_index=barm71
if step=1
sprite_index=barm72
if step=2
sprite_index=barm71
if step=3
sprite_index=barm73}
if phase=5
{if step=0
sprite_index=barm81
if step=1
sprite_index=barm82
if step=2
sprite_index=barm81
if step=3
sprite_index=barm83}
if phase=6
{if step=0
sprite_index=barm11
if step=1
sprite_index=barm12
if step=2
sprite_index=barm11
if step=3
sprite_index=barm13}
if phase=7
{if step=0
sprite_index=barm21
if step=1
sprite_index=barm22
if step=2
sprite_index=barm21
if step=3
sprite_index=barm23}
if phase=8
{if step=0
sprite_index=barm31
if step=1
sprite_index=barm32
if step=2
sprite_index=barm31
if step=3
sprite_index=barm33}}
if action>=2
    if action<6
        {if phase=1
        {if step=0
        sprite_index=bara41
        if step=1
        sprite_index=bara42
        if step=2
        sprite_index=bara43
        if step=3
        sprite_index=bara44}
        if phase=2
        {if step=0
        sprite_index=bara51
        if step=1
        sprite_index=bara52
        if step=2
        sprite_index=bara53
        if step=3
        sprite_index=bara54}
        if phase=3
        {if step=0
        sprite_index=bara61
        if step=1
        sprite_index=bara62
        if step=2
        sprite_index=bara63
        if step=3
        sprite_index=bara64}
        if phase=4
        {if step=0
        sprite_index=bara71
        if step=1
        sprite_index=bara72
        if step=2
        sprite_index=bara73
        if step=3
        sprite_index=bara74}
        if phase=5
        {if step=0
        sprite_index=bara81
        if step=1
        sprite_index=bara82
        if step=2
        sprite_index=bara83
        if step=2
        sprite_index=bara84}
        if phase=6
        {if step=0
        sprite_index=bara11
        if step=1
        sprite_index=bara12
        if step=2
        sprite_index=bara13
        if step=3
        sprite_index=bara14}
        if phase=7
        {if step=0
        sprite_index=bara21
        if step=1
        sprite_index=bara22
        if step=2
        sprite_index=bara23
        if step=3
        sprite_index=bara24}
        if phase=8
        {if step=0
        sprite_index=bara31
        if step=1
        sprite_index=bara32
        if step=2
        sprite_index=bara33
        if step=3
        sprite_index=bara34}}

// --- azione 13: execute code ---
///attacco
if instance_exists(ally_build)
    {if distance_to_object(instance_nearest(x,y,ally_build))<10*(1-0.36*abs(sin(degtorad(direction))))
        {if warwork=2
            {targetx=instance_nearest(x,y,ally_build).x
            targety=instance_nearest(x,y,ally_build).y
            direction=point_direction(x,y,targetx,targety)}
        if warwork!=2
            {action=2
            warwork=2
            alarm[2]=13
            }exit}
    else
        if warwork=2
            {action=0
            warwork=0
            speed=0}
    if instance_number(fog01)>0
        {if distance_to_object(instance_nearest(x,y,fog01))>290
        if distance_to_object(instance_nearest(x,y,ally_build))<comp*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction))))
            {if warwork=0 || warwork=1
                {if action!=1
                alarm[0]=15
                action=1
                warwork=1
                dirox=instance_nearest(x,y,ally_build).x
                diroy=instance_nearest(x,y,ally_build).y}}}
        else
        {
        if distance_to_object(instance_nearest(x,y,ally_build))<comp*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction))))
            {if warwork=0 || warwork=1
                {if action!=1
                alarm[0]=15
                action=1
                warwork=1
                dirox=instance_nearest(x,y,ally_build).x
                diroy=instance_nearest(x,y,ally_build).y}}}}
