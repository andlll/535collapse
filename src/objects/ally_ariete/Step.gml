// ally_ariete — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/ally_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///tasto sinistro del mouse
if hover=1
if mouse_check_button_released(mb_left)=true
    {
    ///selezione e selezione multipla
    if dc=1
    with (ally_ariete)
        {
        if x>view_xview[0] && x<view_xview[0]+view_wview[0] && y>view_yview[0] && y<view_yview[0]+view_hview[0]
            {selected=1
            global.sel+=1
            global.siegsel++
            global.milsel+=1}}
    //quando non ci sta alt premuto che succede//
    if global.sele>-1
    if selected=0
        {
        selected=1
        global.milsel+=1
        global.siegsel++
        if dc=0
        global.sel+=1
        if dc=0
            {dc=1
            alarm[1]=30}}
    //quando alt sta premuto che succede//
    if global.sele=-1
        {
        if selected=1
        {global.sel-=1
        global.siegsel--
        global.milsel-=1
        }
    selected=0
    }}

// --- azione 2: execute code ---
///morte
var diro=direction
if life<=0
{
instance_destroy()
global.pop-=3
var corpse=instance_create(x,y,ariete_corpse)
with (corpse)
direction=diro
if selected=1
    {global.sel-=1
    global.siegsel--
    global.milsel-=1}}

// --- azione 3: execute code ---
///movimento e direzione
mp_potential_settings(30,3,3,true)
//velocità di movimento//
autospeed=2*(1-0.36*abs(sin(degtorad(direction))))
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
//quando fermarsi//
if action=1
if x=dirox
if y=diroy
{action=0
warwork=0
speed=0}

// --- azione 4: drag&drop action_if_variable ---
if (action == 1)
{
    // --- azione 5: drag&drop action_potential_step [assoluto] ---
    action_potential_step(dirox, diroy, autospeed, 0);
}

// --- azione 6: execute code ---
///assegnazione sprite
if action=0
{if phase=1
sprite_index=ara41
if phase=2
sprite_index=ara51
if phase=3
sprite_index=ara61
if phase=4
sprite_index=ara71
if phase=5
sprite_index=ara81
if phase=6
sprite_index=ara11
if phase=7
sprite_index=ara21
if phase=8
sprite_index=ara31}

if action=1
{if phase=1
{if step=0
sprite_index=arm41
if step=1
sprite_index=arm42
if step=2
sprite_index=arm41
if step=3
sprite_index=arm43}
if phase=2
{if step=0
sprite_index=arm51
if step=1
sprite_index=arm52
if step=2
sprite_index=arm51
if step=3
sprite_index=arm53}
if phase=3
{if step=0
sprite_index=arm61
if step=1
sprite_index=arm62
if step=2
sprite_index=arm61
if step=3
sprite_index=arm63}
if phase=4
{if step=0
sprite_index=arm71
if step=1
sprite_index=arm72
if step=2
sprite_index=arm71
if step=3
sprite_index=arm73}
if phase=5
{if step=0
sprite_index=arm81
if step=1
sprite_index=arm82
if step=2
sprite_index=arm81
if step=3
sprite_index=arm83}
if phase=6
{if step=0
sprite_index=arm11
if step=1
sprite_index=arm12
if step=2
sprite_index=arm11
if step=3
sprite_index=arm13}
if phase=7
{if step=0
sprite_index=arm21
if step=1
sprite_index=arm22
if step=2
sprite_index=arm21
if step=3
sprite_index=arm23}
if phase=8
{if step=0
sprite_index=arm31
if step=1
sprite_index=arm32
if step=2
sprite_index=arm31
if step=3
sprite_index=arm33}}
if action>=2
    if action<6
        {if phase=1
        {if step=0
        sprite_index=ara41
        if step=1
        sprite_index=ara42
        if step=2
        sprite_index=ara43
        if step=3
        sprite_index=ara44}
        if phase=2
        {if step=0
        sprite_index=ara51
        if step=1
        sprite_index=ara52
        if step=2
        sprite_index=ara53
        if step=3
        sprite_index=ara54}
        if phase=3
        {if step=0
        sprite_index=ara61
        if step=1
        sprite_index=ara62
        if step=2
        sprite_index=ara63
        if step=3
        sprite_index=ara64}
        if phase=4
        {if step=0
        sprite_index=ara71
        if step=1
        sprite_index=ara72
        if step=2
        sprite_index=ara73
        if step=3
        sprite_index=ara74}
        if phase=5
        {if step=0
        sprite_index=ara81
        if step=1
        sprite_index=ara82
        if step=2
        sprite_index=ara83
        if step=2
        sprite_index=ara84}
        if phase=6
        {if step=0
        sprite_index=ara11
        if step=1
        sprite_index=ara12
        if step=2
        sprite_index=ara13
        if step=3
        sprite_index=ara14}
        if phase=7
        {if step=0
        sprite_index=ara21
        if step=1
        sprite_index=ara22
        if step=2
        sprite_index=ara23
        if step=3
        sprite_index=ara24}
        if phase=8
        {if step=0
        sprite_index=ara31
        if step=1
        sprite_index=ara32
        if step=2
        sprite_index=ara33
        if step=3
        sprite_index=ara34}}

// --- azione 7: execute code ---
///selezione multipla
if global.multi=1
if global.sele=0
    {if (x>global.startx && x<mouse_x && y>global.starty && y<mouse_y) || (x<global.startx && x>mouse_x && y>global.starty && y<mouse_y) || (x>global.startx && x<mouse_x && y<global.starty && y>mouse_y) || (x<global.startx && x>mouse_x && y<global.starty && y>mouse_y)
        {if selected=0
            {global.sel+=1
            global.siegsel++
            global.milsel+=1}
        selected=1
    }
else
    {if selected=1
        {global.sel-=1
        global.siegsel--
        global.milsel-=1}
        selected=0}}

// --- azione 8: execute code ---
///se posto in cui fermarsi è occupato
if action=1
if firework!=1
    {if place_free(dirox,diroy)=false
            {
            var dir = point_direction(dirox, diroy, x, y); // direzione da arrivo → partenza
            dirox += lengthdir_x(50, dir);
            diroy += lengthdir_y(50, dir);
            }}

// --- azione 9: execute code ---
///attacco
if !instance_exists(target_eu)
target_eu=noone
if target_eu=noone
    {
    if distance_to_object(instance_nearest(x,y,enemy_build))<10*(1-0.36*abs(sin(degtorad(direction))))
        {if warwork=2
            {targetx=instance_nearest(x,y,enemy_build).x
            targety=instance_nearest(x,y,enemy_build).y
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
        if warwork=1 && distance_to_object(instance_nearest(x,y,enemy_build))>=comp*(1-0.36*abs(sin(degtorad(direction))))
            {action=0
            warwork=0
            speed=0}}
    if distance_to_object(instance_nearest(x,y,enemy_build))<comp*(1-0.36*abs(sin(degtorad(direction))))
    if warwork=0 || warwork=1
        {if action!=1
        alarm[0]=15
        action=1
        warwork=1
        dirox=instance_nearest(x,y,enemy_build).x
        diroy=instance_nearest(x,y,enemy_build).y}}
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

// --- azione 10: execute code ---
///creazione pulsanti di comportamento
if selected=1
if instance_number(attacco_clicker)=0
    {instance_create(0,0,attacco_clicker)
    instance_create(0,0,difesa_clicker)}
