// ally_catapulta — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/ally_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///tasto sinistro del mouse
if hover=1
if mouse_check_button_released(mb_left)=true
{
///selezione e selezione multipla
if dc=1
with (ally_catapulta)
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
    var corpse=instance_create(x,y,catapulta_corpse)
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
automatic=1
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
sprite_index=cati41
if phase=2
sprite_index=cati51
if phase=3
sprite_index=cati61
if phase=4
sprite_index=cati71
if phase=5
sprite_index=cati81
if phase=6
sprite_index=cati11
if phase=7
sprite_index=cati21
if phase=8
sprite_index=cati31}

if action=1
{if phase=1
{if step=0
sprite_index=catm41
if step=1
sprite_index=catm42
if step=2
sprite_index=catm41
if step=3
sprite_index=catm43}
if phase=2
{if step=0
sprite_index=catm51
if step=1
sprite_index=catm52
if step=2
sprite_index=catm51
if step=3
sprite_index=catm53}
if phase=3
{if step=0
sprite_index=catm61
if step=1
sprite_index=catm62
if step=2
sprite_index=catm61
if step=3
sprite_index=catm63}
if phase=4
{if step=0
sprite_index=catm71
if step=1
sprite_index=catm72
if step=2
sprite_index=catm71
if step=3
sprite_index=catm73}
if phase=5
{if step=0
sprite_index=catm81
if step=1
sprite_index=catm82
if step=2
sprite_index=catm81
if step=3
sprite_index=catm83}
if phase=6
{if step=0
sprite_index=catm11
if step=1
sprite_index=catm12
if step=2
sprite_index=catm11
if step=3
sprite_index=catm13}
if phase=7
{if step=0
sprite_index=catm21
if step=1
sprite_index=catm22
if step=2
sprite_index=catm21
if step=3
sprite_index=catm23}
if phase=8
{if step=0
sprite_index=catm31
if step=1
sprite_index=catm32
if step=2
sprite_index=catm31
if step=3
sprite_index=catm33}}
if action=2
        {if phase=1
            {if step=0
            sprite_index=cati41
            if step=1
            sprite_index=cati42
            if step=2
            sprite_index=cati43
            if step=3
            sprite_index=cati44}
        if phase=2
            {if step=0
            sprite_index=cati51
            if step=1
            sprite_index=cati52
            if step=2
            sprite_index=cati53
            if step=3
            sprite_index=cati54}
        if phase=3
            {if step=0
            sprite_index=cati61
            if step=1
            sprite_index=cati62
            if step=2
            sprite_index=cati63
            if step=3
            sprite_index=cati64}
        if phase=4
            {if step=0
            sprite_index=cati71
            if step=1
            sprite_index=cati72
            if step=2
            sprite_index=cati73
            if step=3
            sprite_index=cati74}
        if phase=5
            {if step=0
            sprite_index=cati81
            if step=1
            sprite_index=cati82
            if step=2
            sprite_index=cati83
            if step=3
            sprite_index=cati84}
        if phase=6
            {if step=0
            sprite_index=cati11
            if step=1
            sprite_index=cati12
            if step=2
            sprite_index=cati13
            if step=3
            sprite_index=cati14}
        if phase=7
            {if step=0
            sprite_index=cati21
            if step=1
            sprite_index=cati22
            if step=2
            sprite_index=cati23
            if step=3
            sprite_index=cati24}
        if phase=8
            {if step=0
            sprite_index=cati31
            if step=1
            sprite_index=cati32
            if step=2
            sprite_index=cati33
            if step=3
            sprite_index=cati34}}
if action=3
        {if phase=1
        {if step=0
        sprite_index=catt41
        if step=1
        sprite_index=catt42
        if step=2
        sprite_index=catt43
        if step=3
        sprite_index=catt44
        if step=4
        sprite_index=catt45}
        if phase=2
        {if step=0
        sprite_index=catt51
        if step=1
        sprite_index=catt52
        if step=2
        sprite_index=catt53
        if step=3
        sprite_index=catt54
        if step=4
        sprite_index=catt55}
        if phase=3
        {if step=0
        sprite_index=catt61
        if step=1
        sprite_index=catt62
        if step=2
        sprite_index=catt63
        if step=3
        sprite_index=catt64
        if step=4
        sprite_index=catt65}
        if phase=4
        {if step=0
        sprite_index=catt71
        if step=1
        sprite_index=catt72
        if step=2
        sprite_index=catt73
        if step=3
        sprite_index=catt74
        if step=4
        sprite_index=catt75}
        if phase=5
        {if step=0
        sprite_index=catt81
        if step=1
        sprite_index=catt82
        if step=2
        sprite_index=catt83
        if step=3
        sprite_index=catt84
        if step=4
        sprite_index=catt85}
        if phase=6
        {if step=0
        sprite_index=catt11
        if step=1
        sprite_index=catt12
        if step=2
        sprite_index=catt13
        if step=3
        sprite_index=catt14
        if step=4
        sprite_index=catt15}
        if phase=7
        {if step=0
        sprite_index=catt21
        if step=1
        sprite_index=catt22
        if step=2
        sprite_index=catt23
        if step=3
        sprite_index=catt24
        if step=4
        sprite_index=catt25}
        if phase=8
        {if step=0
        sprite_index=catt31
        if step=1
        sprite_index=catt32
        if step=2
        sprite_index=catt33
        if step=3
        sprite_index=catt34
        if step=4
        sprite_index=catt35}}

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
///creazione pulsanti di comportamento
if selected=1
if instance_number(attacco_clicker)=0
{instance_create(0,0,attacco_clicker)
instance_create(0,0,difesa_clicker)}

// --- azione 10: execute code ---
///ricarica della catapulta
if action=0
if loaded=0
    {action=3
    alarm[4]=13
    step=0}

// --- azione 11: execute code ---
///attacco automatico
if action=0 or action=1
if automatic=1
if loaded=1
        {if distance_to_object(instance_nearest(x,y,enemy_build))<850
            {if distance_to_object(instance_nearest(x,y,enemy_build))>300
                {if action!=2
                    {
                    action=2
                    step=0
                    direction=point_direction(x,y,instance_nearest(x,y,enemy_build).x,instance_nearest(x,y,enemy_build).y)
                    targx=instance_nearest(x,y,enemy_build).x
                    targy=instance_nearest(x,y,enemy_build).y
                    alarm[2]=50
                    exit}}
                else
                    {
                    if action=0
                       {direction=point_direction(x,y,instance_nearest(x,y,enemy_build).x,instance_nearest(x,y,enemy_build).y)
                       if direction>360
                       direction-=360
                        action=1
                        automatic=1
                        step=0
                        if action!=2
                        if speed=0
                        alarm[0]=13}}}}
