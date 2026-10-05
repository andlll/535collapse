// enemy_picchiere — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_picchiere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///smetti di dare fuoco a sta casa che ormai è crollata
if !instance_exists(targetid)
    {if action=6 || firework!=0
        {targetid=noone
        step=0
        firework=0
        action=0}}

// --- azione 2: execute code ---
///visibile
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
var vicicast=instance_nearest(x,y,castello)
var vicitower=instance_nearest(x,y,torre)
var vicipalo=instance_nearest(x,y,palo_1)
if distance_to_object(vici)<150+150*(1-global.night) || distance_to_object(vicic)<200+200*(1-global.night) || distance_to_object(vicipalo)<200+200*(1-global.night)|| hit=1 || distance_to_object(vicicast)<500+500*(1-global.night) || distance_to_object(vicitower)<500+500*(1-global.night) || room==menu|| global.fogville=0
visible=true
else
visible=false

// --- azione 3: execute code ---
///direzione e morte
var diro=direction
if life<=0
{var corpse=instance_create(x,y,enemy_picchiere_corpse)
if hover=1
    {hover=0
    global.enemyhover=0}
instance_destroy()
with (corpse)
direction=diro}

// --- azione 4: execute code ---
///impostazioni di step
mp_potential_settings(30,3,3,true)

// --- azione 5: execute code ---
///velocità di movimento
autospeed=4*(1-0.36*abs(sin(degtorad(direction))))

// --- azione 6: execute code ---
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

// --- azione 7: execute code ---
///quando fermarsi
if action=1
if x=dirox
if y=diroy
    {action=0
    speed=0}

// --- azione 8: execute code ---
///Movimento nemici con FF
scr_movimento_nemici_ff()

// --- azione 9: execute code ---
///assegnazione sprite
if action=0
    {if phase=1
    sprite_index=bpw41
    if phase=2
    sprite_index=bpw51
    if phase=3
    sprite_index=bpw61
    if phase=4
    sprite_index=bpw71
    if phase=5
    sprite_index=bpw81
    if phase=6
    sprite_index=bpw11
    if phase=7
    sprite_index=bpw21
    if phase=8
    sprite_index=bpw31}
if action=1
{if phase=1
{if step=0
sprite_index=bpw41
if step=1
sprite_index=bpw42
if step=2
sprite_index=bpw41
if step=3
sprite_index=bpw43}
if phase=2
{if step=0
sprite_index=bpw51
if step=1
sprite_index=bpw52
if step=2
sprite_index=bpw51
if step=3
sprite_index=bpw53}
if phase=3
{if step=0
sprite_index=bpw61
if step=1
sprite_index=bpw62
if step=2
sprite_index=bpw61
if step=3
sprite_index=bpw63}
if phase=4
{if step=0
sprite_index=bpw71
if step=1
sprite_index=bpw72
if step=2
sprite_index=bpw71
if step=3
sprite_index=bpw73}
if phase=5
{if step=0
sprite_index=bpw81
if step=1
sprite_index=bpw82
if step=2
sprite_index=bpw81
if step=3
sprite_index=bpw83}
if phase=6
{if step=0
sprite_index=bpw11
if step=1
sprite_index=bpw12
if step=2
sprite_index=bpw11
if step=3
sprite_index=bpw13}
if phase=7
{if step=0
sprite_index=bpw21
if step=1
sprite_index=bpw22
if step=2
sprite_index=bpw21
if step=3
sprite_index=bpw23}
if phase=8
{if step=0
sprite_index=bpw31
if step=1
sprite_index=bpw32
if step=2
sprite_index=bpw31
if step=3
sprite_index=bpw33}}
if action=2 && instance_exists(ally_unit) //girati verso il bersaglio
    {var bersaglio=instance_nearest(x,y,ally_unit)
    direction=point_direction(x,y,bersaglio.x,bersaglio.y)}
if action>=2
if action<6
{if phase=1
{if step=0
sprite_index=bpa41
if step=1
sprite_index=bpa42
if step=2
sprite_index=bpa43}
if phase=2
{if step=0
sprite_index=bpa51
if step=1
sprite_index=bpa52
if step=2
sprite_index=bpa53}
if phase=3
{if step=0
sprite_index=bpa61
if step=1
sprite_index=bpa62
if step=2
sprite_index=bpa63}
if phase=4
{if step=0
sprite_index=bpa71
if step=1
sprite_index=bpa72
if step=2
sprite_index=bpa73}
if phase=5
{if step=0
sprite_index=bpa81
if step=1
sprite_index=bpa82
if step=2
sprite_index=bpa83}
if phase=6
{if step=0
sprite_index=bpa11
if step=1
sprite_index=bpa12
if step=2
sprite_index=bpa13}
if phase=7
{if step=0
sprite_index=bpa21
if step=1
sprite_index=bpa22
if step=2
sprite_index=bpa23}
if phase=8
{if step=0
sprite_index=bpa33
if step=1
sprite_index=bpa32
if step=2
sprite_index=bpa33}}
if action=6
        {if phase=1
        {if step=0
        sprite_index=bfg41
        if step=1
        sprite_index=bfg42
        if step=2
        sprite_index=bfg43}
        if phase=2
        {if step=0
        sprite_index=bfg51
        if step=1
        sprite_index=bfg52
        if step=2
        sprite_index=bfg53}
        if phase=3
        {if step=0
        sprite_index=bfg61
        if step=1
        sprite_index=bfg62
        if step=2
        sprite_index=bfg63}
        if phase=4
        {if step=0
        sprite_index=bfg71
        if step=1
        sprite_index=bfg72
        if step=2
        sprite_index=bfg73}
        if phase=5
        {if step=0
        sprite_index=bfg81
        if step=1
        sprite_index=bfg82
        if step=2
        sprite_index=bfg83}
        if phase=6
        {if step=0
        sprite_index=bfg11
        if step=1
        sprite_index=bfg12
        if step=2
        sprite_index=bfg13}
        if phase=7
        {if step=0
        sprite_index=bfg21
        if step=1
        sprite_index=bfg22
        if step=2
        sprite_index=bfg23}
        if phase=8
        {if step=0
        sprite_index=bfg31
        if step=1
        sprite_index=bfg32
        if step=2
        sprite_index=bfg33}}

// --- azione 10: execute code ---
///se posto in cui fermarsi è occupato
if action=1
if place_empty(dirox,diroy)=false
        {
            var dir = point_direction(dirox, diroy, x, y); // direzione da arrivo → partenza
            dirox += lengthdir_x(50, dir);
            diroy += lengthdir_y(50, dir);
        }

// --- azione 11: execute code ---
///se non ci sono pulsanti costruzione in giro
if instance_number(torre_placer)>0
global.sele=1

// --- azione 12: execute code ---
///mandare a fuoco
if firework=1
if warwork!=2
if targetid!=noone
if point_distance(x,y,targetid.x,targetid.y)<200
    {firework=0
    direction=point_direction(x,y,targetid.x,targetid.y)
    step=0
    alarm[4]=13
    action=6
    }

// --- azione 13: execute code ---
///voglio dare fuoco alle case
if action=0
if firework=0
if instance_number(ally_wooden)>0
if distance_to_object(instance_nearest(x,y,ally_wooden))<400*(1-0.5*global.night)
    {if instance_number(ally_omino)>0 && distance_to_object(instance_nearest(x,y,ally_omino))>400
    if warwork!=2
        {firework=1
        warwork=0
        action=1
        alarm[0]=15
        targetid=instance_nearest(x,y,ally_wooden).id
        dirox=targetid.x
        diroy=targetid.y}
    if instance_number(ally_omino)<1
        if warwork!=2
        {firework=1
        warwork=0
        action=1
        alarm[0]=15
        targetid=instance_nearest(x,y,ally_wooden).id
        dirox=targetid.x
        diroy=targetid.y}}
    

// --- azione 14: execute code ---
///hint attaccare
if point_distance(x,y,mouse_x,mouse_y)<60 && instance_number(parent_hint)<1 && global.milsel>0
if global.attackhint=0
    {instance_create(x,y,hint_attack)
    global.attackhint=1}

// --- azione 15: execute code ---
///attacco
if instance_exists(ally_unit)
{if distance_to_object(instance_nearest(x,y,ally_unit))<10*(1-0.36*abs(sin(degtorad(direction)))) && instance_number(ally_unit)>0
    {if warwork=2&& alarm[2]<1
        {targetx=instance_nearest(x,y,ally_unit).x
        targety=instance_nearest(x,y,ally_unit).y
        direction=point_direction(x,y,targetx,targety)}
    if warwork!=2&& alarm[2]<1
        {action=2
        warwork=2
        alarm[2]=13
        }exit}
if instance_number(ally_unit)=0
if warwork=2
            {action=0
            warwork=0
            speed=0}
    if instance_number(fog01)>0
        {if distance_to_object(instance_nearest(x,y,fog01))>290
            {if distance_to_object(instance_nearest(x,y,ally_unit))<400*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction))))&& instance_number(ally_unit)>0
                {if warwork=0 || warwork=1&& alarm[2]<1
                    {if action!=1
                    alarm[0]=15
                    action=1
                    warwork=1
                    dirox=instance_nearest(x,y,ally_unit).x
                    diroy=instance_nearest(x,y,ally_unit).y}}}
            else
                {if distance_to_object(instance_nearest(x,y,ally_unit))<200*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction))))&& instance_number(ally_unit)>0
                    {if warwork=0 || warwork=1&& alarm[2]<1
                        {if action!=1
                        alarm[0]=15
                        action=1
                        warwork=1
                        dirox=instance_nearest(x,y,ally_unit).x
                        diroy=instance_nearest(x,y,ally_unit).y}}}}
        else
            {if distance_to_object(instance_nearest(x,y,ally_unit))<400*(1-0.5*global.night)*(1-0.36*abs(sin(degtorad(direction))))&& instance_number(ally_unit)>0
                {if warwork=0 || warwork=1&& alarm[2]<1
                    {if action!=1
                    alarm[0]=15
                    action=1
                    warwork=1
                    dirox=instance_nearest(x,y,ally_unit).x
                    diroy=instance_nearest(x,y,ally_unit).y}}}
if action=0 && warwork=1
warwork=0}

// --- azione 16: execute code ---
///dialogo livello 1
if instance_exists(ally_unit)
if global.dialogoenemy1=0 && distance_to_object(instance_nearest(x,y,ally_warrior))<300 && instance_number(parent_dialogo)=0 && room==lvl01
    {instance_create(x,y,dialogo_1_4)
    global.dialogoenemy1=1}
