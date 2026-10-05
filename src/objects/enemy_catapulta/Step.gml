// enemy_catapulta — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

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
{var corpse=instance_create(x,y,enemy_catapulta_corpse)
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
///ricarica della catapulta
if action=0
if loaded=0
    {action=3
    alarm[4]=13
    step=0}

// --- azione 13: execute code ---
///attacco automatico
if action=0 or action=1
if automatic=1
if loaded=1
if instance_exists(ally_build)
if instance_number(fog01)>0
{if distance_to_object(instance_nearest(x,y,fog01))>290
        {if distance_to_object(instance_nearest(x,y,ally_build))<(1-0.5*global.night)*850
        {if distance_to_object(instance_nearest(x,y,ally_build))>300
            {if action!=2
                {
                action=2
                step=0
                direction=point_direction(x,y,instance_nearest(x,y,ally_build).x,instance_nearest(x,y,ally_build).y)
                targx=instance_nearest(x,y,ally_build).x
                targy=instance_nearest(x,y,ally_build).y
                alarm[2]=50
                exit}}
            else
                {
                if action=0
                   {direction=point_direction(x,y,instance_nearest(x,y,ally_build).x,instance_nearest(x,y,ally_build).y)
                   if direction>360
                   direction-=360
                    action=1
                    automatic=1
                    step=0
                    if action!=2
                    if speed=0
                    alarm[0]=13}}}}}
        else
                {if distance_to_object(instance_nearest(x,y,ally_build))<(1-0.5*global.night)*850
        {if distance_to_object(instance_nearest(x,y,ally_build))>300
            {if action!=2
                {
                action=2
                step=0
                direction=point_direction(x,y,instance_nearest(x,y,ally_build).x,instance_nearest(x,y,ally_build).y)
                targx=instance_nearest(x,y,ally_build).x
                targy=instance_nearest(x,y,ally_build).y
                alarm[2]=50
                exit}}
            else
                {
                if action=0
                   {direction=point_direction(x,y,instance_nearest(x,y,ally_build).x,instance_nearest(x,y,ally_build).y)
                   if direction>360
                   direction-=360
                    action=1
                    automatic=1
                    step=0
                    if action!=2
                    if speed=0
                    alarm[0]=13}}}}

// --- azione 14: execute code ---
///assegnazione sprite
if action=0
{if phase=1
sprite_index=bcati41
if phase=2
sprite_index=bcati51
if phase=3
sprite_index=bcati61
if phase=4
sprite_index=bcati71
if phase=5
sprite_index=bcati81
if phase=6
sprite_index=bcati11
if phase=7
sprite_index=bcati21
if phase=8
sprite_index=bcati31}

if action=1
{if phase=1
{if step=0
sprite_index=bcatm41
if step=1
sprite_index=bcatm42
if step=2
sprite_index=bcatm41
if step=3
sprite_index=bcatm43}
if phase=2
{if step=0
sprite_index=bcatm51
if step=1
sprite_index=bcatm52
if step=2
sprite_index=bcatm51
if step=3
sprite_index=bcatm53}
if phase=3
{if step=0
sprite_index=bcatm61
if step=1
sprite_index=bcatm62
if step=2
sprite_index=bcatm61
if step=3
sprite_index=bcatm63}
if phase=4
{if step=0
sprite_index=bcatm71
if step=1
sprite_index=bcatm72
if step=2
sprite_index=bcatm71
if step=3
sprite_index=bcatm73}
if phase=5
{if step=0
sprite_index=bcatm81
if step=1
sprite_index=bcatm82
if step=2
sprite_index=bcatm81
if step=3
sprite_index=bcatm83}
if phase=6
{if step=0
sprite_index=bcatm11
if step=1
sprite_index=bcatm12
if step=2
sprite_index=bcatm11
if step=3
sprite_index=bcatm13}
if phase=7
{if step=0
sprite_index=bcatm21
if step=1
sprite_index=bcatm22
if step=2
sprite_index=bcatm21
if step=3
sprite_index=bcatm23}
if phase=8
{if step=0
sprite_index=bcatm31
if step=1
sprite_index=bcatm32
if step=2
sprite_index=bcatm31
if step=3
sprite_index=bcatm33}}
if action=2
        {if phase=1
            {if step=0
            sprite_index=bcati41
            if step=1
            sprite_index=bcati42
            if step=2
            sprite_index=bcati43
            if step=3
            sprite_index=bcati44}
        if phase=2
            {if step=0
            sprite_index=bcati51
            if step=1
            sprite_index=bcati52
            if step=2
            sprite_index=bcati53
            if step=3
            sprite_index=bcati54}
        if phase=3
            {if step=0
            sprite_index=bcati61
            if step=1
            sprite_index=bcati62
            if step=2
            sprite_index=bcati63
            if step=3
            sprite_index=bcati64}
        if phase=4
            {if step=0
            sprite_index=bcati71
            if step=1
            sprite_index=bcati72
            if step=2
            sprite_index=bcati73
            if step=3
            sprite_index=bcati74}
        if phase=5
            {if step=0
            sprite_index=bcati81
            if step=1
            sprite_index=bcati82
            if step=2
            sprite_index=bcati83
            if step=3
            sprite_index=bcati84}
        if phase=6
            {if step=0
            sprite_index=bcati11
            if step=1
            sprite_index=bcati12
            if step=2
            sprite_index=bcati13
            if step=3
            sprite_index=bcati14}
        if phase=7
            {if step=0
            sprite_index=bcati21
            if step=1
            sprite_index=bcati22
            if step=2
            sprite_index=bcati23
            if step=3
            sprite_index=bcati24}
        if phase=8
            {if step=0
            sprite_index=bcati31
            if step=1
            sprite_index=bcati32
            if step=2
            sprite_index=bcati33
            if step=3
            sprite_index=bcati34}}
if action=3
        {if phase=1
        {if step=0
        sprite_index=bcatt41
        if step=1
        sprite_index=bcatt42
        if step=2
        sprite_index=bcatt43
        if step=3
        sprite_index=bcatt44
        if step=4
        sprite_index=bcatt45}
        if phase=2
        {if step=0
        sprite_index=bcatt51
        if step=1
        sprite_index=bcatt52
        if step=2
        sprite_index=bcatt53
        if step=3
        sprite_index=bcatt54
        if step=4
        sprite_index=bcatt55}
        if phase=3
        {if step=0
        sprite_index=bcatt61
        if step=1
        sprite_index=bcatt62
        if step=2
        sprite_index=bcatt63
        if step=3
        sprite_index=bcatt64
        if step=4
        sprite_index=bcatt65}
        if phase=4
        {if step=0
        sprite_index=bcatt71
        if step=1
        sprite_index=bcatt72
        if step=2
        sprite_index=bcatt73
        if step=3
        sprite_index=bcatt74
        if step=4
        sprite_index=bcatt75}
        if phase=5
        {if step=0
        sprite_index=bcatt81
        if step=1
        sprite_index=bcatt82
        if step=2
        sprite_index=bcatt83
        if step=3
        sprite_index=bcatt84
        if step=4
        sprite_index=bcatt85}
        if phase=6
        {if step=0
        sprite_index=bcatt11
        if step=1
        sprite_index=bcatt12
        if step=2
        sprite_index=bcatt13
        if step=3
        sprite_index=bcatt14
        if step=4
        sprite_index=bcatt15}
        if phase=7
        {if step=0
        sprite_index=bcatt21
        if step=1
        sprite_index=bcatt22
        if step=2
        sprite_index=bcatt23
        if step=3
        sprite_index=bcatt24
        if step=4
        sprite_index=bcatt25}
        if phase=8
        {if step=0
        sprite_index=bcatt31
        if step=1
        sprite_index=bcatt32
        if step=2
        sprite_index=bcatt33
        if step=3
        sprite_index=bcatt34
        if step=4
        sprite_index=bcatt35}}
