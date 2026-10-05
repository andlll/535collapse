// ally_arciere — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/ally_arciere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///tasto sinistro del mouse
if hover=1
if mouse_check_button_released(mb_left)=true
    {
    ///selezione e selezione multipla
    if dc=1
    with (ally_arciere)
        {
        if x>view_xview[0] && x<view_xview[0]+view_wview[0] && y>view_yview[0] && y<view_yview[0]+view_hview[0]
            {selected=1
            global.sel+=1
            global.milsel+=1
            global.arcsel+=1}}
    //quando non ci sta alt premuto che succede//
    if global.sele>-1
    if selected=0
        {
        selected=1
        global.arcsel++
        global.milsel+=1
        if dc=0
        global.sel+=1
        if dc=0
            {dc=1
            alarm[1]=30}}
    if instance_number(parent_hint)<1
    if global.multihint=0 && room==match
        {instance_create(x,y,hint_multi)
        global.multihint=1}
    //quando alt sta premuto che succede//
    if global.sele=-1
        {
        if selected=1
            {global.sel-=1
            global.milsel-=1
            global.arcsel-=1
            }
        selected=0
        }}

// --- azione 2: execute code ---
///morte
var diro=direction
if life<=0
    {scr_free()
    instance_destroy()
    global.pop-=2
    var corpse=instance_create(x,y,arciere_corpse)
    with (corpse)
    direction=diro
    if selected=1
        {global.sel-=1
        global.arcsel-=1
        global.milsel-=1}}

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
if point_distance(x,y,dirox,diroy)<10 && atkorder=0
    {action=0
    warwork=0
    creation=0
    speed=0}

// --- azione 7: execute code ---
///assegnazione sprite

if action<2
{if phase=1
{if step=0
sprite_index=aw41
if step=1
sprite_index=aw42
if step=2
sprite_index=aw41
if step=3
sprite_index=aw43}
if phase=2
{if step=0
sprite_index=aw51
if step=1
sprite_index=aw52
if step=2
sprite_index=aw51
if step=3
sprite_index=aw53}
if phase=3
{if step=0
sprite_index=aw61
if step=1
sprite_index=aw62
if step=2
sprite_index=aw61
if step=3
sprite_index=aw63}
if phase=4
{if step=0
sprite_index=aw71
if step=1
sprite_index=aw72
if step=2
sprite_index=aw71
if step=3
sprite_index=aw73}
if phase=5
{if step=0
sprite_index=aw81
if step=1
sprite_index=aw82
if step=2
sprite_index=aw81
if step=3
sprite_index=aw83}
if phase=6
{if step=0
sprite_index=aw11
if step=1
sprite_index=aw12
if step=2
sprite_index=aw11
if step=3
sprite_index=aw13}
if phase=7
{if step=0
sprite_index=aw21
if step=1
sprite_index=aw22
if step=2
sprite_index=aw21
if step=3
sprite_index=aw23}
if phase=8
{if step=0
sprite_index=aw31
if step=1
sprite_index=aw32
if step=2
sprite_index=aw31
if step=3
sprite_index=aw33}}
if action>=2
if action<6
{if phase=1
{if step=0
sprite_index=aa41
if step=1
sprite_index=aa42
if step=2
sprite_index=aa43}
if phase=2
{if step=0
sprite_index=aa51
if step=1
sprite_index=aa52
if step=2
sprite_index=aa53}
if phase=3
{if step=0
sprite_index=aa61
if step=1
sprite_index=aa62
if step=2
sprite_index=aa63}
if phase=4
{if step=0
sprite_index=aa71
if step=1
sprite_index=aa72
if step=2
sprite_index=aa73}
if phase=5
{if step=0
sprite_index=aa81
if step=1
sprite_index=aa82
if step=2
sprite_index=aa83}
if phase=6
{if step=0
sprite_index=aa11
if step=1
sprite_index=aa12
if step=2
sprite_index=aa13}
if phase=7
{if step=0
sprite_index=aa21
if step=1
sprite_index=aa22
if step=2
sprite_index=aa23}
if phase=8
{if step=0
sprite_index=aa31
if step=1
sprite_index=aa32
if step=2
sprite_index=aa33}}

// --- azione 8: execute code ---
///selezione multipla
if global.multi=1
if global.sele=0
    {if (x>global.startx && x<mouse_x && y>global.starty && y<mouse_y) || (x<global.startx && x>mouse_x && y>global.starty && y<mouse_y) || (x>global.startx && x<mouse_x && y<global.starty && y>mouse_y) || (x<global.startx && x>mouse_x && y<global.starty && y>mouse_y)
        {if selected=0
            {global.sel+=1
            global.arcsel++
            global.milsel+=1}
        selected=1
        }
    else
        {if selected=1
            {global.sel-=1
            global.arcsel--
            global.milsel-=1}
        selected=0}}

// --- azione 9: execute code ---
///se posto in cui fermarsi è occupato
if action=1 
if place_free(dirox,diroy)=false
if creation!=1
        {
            var dir = point_direction(dirox, diroy, x, y); // direzione da arrivo → partenza
            dirox += lengthdir_x(32, dir);
            diroy += lengthdir_y(32, dir);
        }
else
        {
            dirox += irandom_range(-32,32);
            diroy += irandom_range(-32,32);
        }

// --- azione 10: execute code ---
///se posto in cui fermarsi è occupato
if action=1 
if place_free(dirox,diroy)=false
if creation!=1
        {
            var dir = point_direction(dirox, diroy, x, y); // direzione da arrivo → partenza
            dirox += lengthdir_x(32, dir);
            diroy += lengthdir_y(32, dir);
        }
else
        {
            dirox += irandom_range(-32,32);
            diroy += irandom_range(-32,32);
        }

// --- azione 11: execute code ---
///se non ci sono pulsanti costruzione in giro
if instance_number(torre_placer)>0
global.sele=1

// --- azione 12: execute code ---
///Creazione pulsanti
if selected=1
if instance_number(attacco_clicker)=0
{instance_create(0,0,attacco_clicker)
instance_create(0,0,difesa_clicker)}

// --- azione 13: execute code ---
///Movimento con flow field
if !instance_exists(target_eu) //se il nemico è morto smette di cercarlo o attaccarlo
target_eu=noone
if action=1
    {if point_distance(x,y,dirox,diroy)>500 || place_free(x,y)=false //se è distante usa flow field, place free chi cazzo si ricorda perché l'avevo messo lì, forse per evitare che vada in pappa con altri pupazzi?
        {if instance_place(x,y,ally_unit)!=noone // se c'è una collisione con un'altra unità amica
            {otro= instance_place(x,y,ally_unit)
            if otro.ordo>self.ordo || otro.action!=1 //se l'altro ha rank più alto e si sta muovendo tu fermati
                scr_move_flow_field()
            else
                {step=0
                alarm[0]++}}
        else
        scr_move_flow_field()}//in caso contrario cammina
    else //movimento con step towards quando è molto vicino
        {if (warwork=0 || warwork=4) && presidiowork=0
        mp_potential_step(dirox,diroy,autospeed,false)
        if presidiowork=1
        mp_potential_step(dirox,diroy,autospeed,false)
        if warwork=1 && distance_to_object(instance_nearest(x,y,enemy_unit))<800*(1-0.36*abs(sin(degtorad(direction))))
        mp_potential_step(instance_nearest(x,y,enemy_unit).x,instance_nearest(x,y,enemy_unit).y,autospeed,false)
        }}
//Ricalcola flow field e goal field se destinazione è occupata
if (ds_grid_get(global.cost_field, goal_x div global.grid_size, goal_y div global.grid_size) >= 1000) && presidiowork=0 && warwork=0 && action=1
{{
    var result_list = ds_list_create();
    scr_free()
    if (scr_find_valid_cell_backwards(floor(dirox div 32), floor(diroy div 32), floor(x div 32),floor (y div 32), result_list))   
        {
        goal_x = ds_list_find_value(result_list, 0) * 32;
        goal_y = ds_list_find_value(result_list, 1) * 32;
         }
     else 
        {
        goal_x = x;
        goal_y = y;
         }

    ds_list_destroy(result_list);

    scr_generate_goal_field(goal_x, goal_y);
    dirox = goal_x;
    diroy = goal_y;
    scr_generate_flow_field();
    }
}

// --- azione 14: execute code ---
///Attacco
//warwork:0-è fermo 1-va verso il nemico per attaccarlo 2-attacca il nemico 3-non lo trovo forse legacy 4-si muove ma non sta attaccando
//action: 0-fermo 1-si muove in generale 2-attacca
 //nemico più vicino
if instance_exists(enemy_unit)
{if !instance_exists(atktarget) //se cliccando di destro ha selezionato un bersaglio controlla che non sia morto per non mandare in merda il codice
    {atkorder=0
    atktarget=noone}
if atkorder=0
    {with(instance_nearest(x,y,enemy_unit))
        {if visible=true
        var target_auto_valid=true //variabile che controlla se il nemico più vicino è stato scoperto dal giocatore
        else
        var target_auto_valid=false}}
targvalid=target_auto_valid
if atkorder=0
    {if distance_to_object(instance_nearest(x,y,enemy_unit))<600*(1-0.36*abs(sin(degtorad(direction)))) //se si trova all'interno del suo range di attacco
        {if warwork=2
            {targetx=instance_nearest(x,y,enemy_unit).x
            targety=instance_nearest(x,y,enemy_unit).y
            direction=point_direction(x,y,targetx,targety)
            scr_occupy()}
        if warwork=0 || warwork=1 //se non sta già attaccando o muovendosi verso un posto a caso
            {action=2
            scr_occupy()
            warwork=2
            alarm[2]=13
            }exit}
    else //se è troppo lontano
            if warwork=2 //e se sta attaccando
                {action=0
                warwork=0
                step=0
                scr_occupy()
                speed=0
                exit}}
else
    {if distance_to_object(atktarget)<600*(1-0.36*abs(sin(degtorad(direction)))) //se si trova all'interno del suo range di attacco
        {if warwork=2
            {targetx=atktarget.x
            targety=atktarget.y
            direction=point_direction(x,y,atktarget.x,atktarget.y)
            scr_occupy()}
        if warwork=0 || warwork=1 //se non sta già attaccando o muovendosi verso un posto a caso
            {action=2
            scr_occupy()
            warwork=2
            alarm[2]=13
            }exit}
    else //se è troppo lontano
            if warwork=2 //e se sta attaccando
                {action=0
                warwork=0
                step=0
                scr_occupy()
                speed=0
                exit}}
if action!=1 && warwork!=2//se non si sta già muovendo o attaccando
if atkorder=0
    {if distance_to_object(instance_nearest(x,y,enemy_unit))<comp*(1-0.36*abs(sin(degtorad(direction)))) && target_auto_valid=true //se sei lontano avvicinati
            {if warwork=0 || warwork=1
                {dirox=instance_nearest(x,y,enemy_unit).x
                diroy=instance_nearest(x,y,enemy_unit).y
                if action!=1
                    {alarm[0]=15
                    step=0
                    scr_move(dirox,diroy)
                    scr_free()}
                action=1
                warwork=1
                exit
                }}
    else //altrimenti fermati
                {action=0
                dirox=x
                diroy=y
                warwork=0
                step=0
                scr_occupy()
                action=0
                speed=0
                exit}}
else
    {if distance_to_object(atktarget)<comp*(1-0.36*abs(sin(degtorad(direction)))) && target_auto_valid=true //se sei lontano avvicinati
            {if warwork=0 || warwork=1
                {dirox=atktarget.x
                diroy=atktarget.y
                if action!=1
                    {alarm[0]=15
                    step=0
                    scr_move(dirox,diroy)
                    scr_free()}
                action=1
                warwork=1
                exit
                }}
    else //altrimenti fermati
                {action=0
                dirox=x
                diroy=y
                warwork=0
                step=0
                scr_occupy()
                atktarget=noone
                atkorder=0
                action=0
                speed=0
                exit}}
if action=1 && warwork=1 && atkorder=0 && (distance_to_object(instance_nearest(x,y,enemy_unit))>800*(1-0.36*abs(sin(degtorad(direction)))) || target_auto_valid=false) //se non ci sono più nemici visibili da attaccare fermati
    {action=0
    dirox=x
    diroy=y
    warwork=0
    step=0
    scr_occupy()
    action=0
    speed=0
    exit}}
else
    {if warwork=1 || warwork=2 || action=2
        {action=0
        warwork=0
        speed=0
        scr_occupy()
        target_eu=noone}}
        

// --- azione 15: execute code ---
///presidio torri e castelli
with instance_nearest(dirox,diroy,torre)
    {if npresidio>1
    var fullt=true
    else
    var fullt=false}
with instance_nearest(dirox,diroy,castello)
    {if npresidio>3
    var fullc=true
    else
    var fullc=false}
if presidiowork=1
if action=1
{if distance_to_object(instance_nearest(dirox,diroy,torre))<10
    if fullt=false
        {instance_destroy()
        global.pop-=2
        if selected=1
            {global.sel-=1
            global.milsel-=1
            global.arcsel-=1}
        with instance_nearest(dirox,diroy,torre)
        npresidio+=1
        }
    else
        {if point_distance(x,y,dirox,diroy)<100
        if action=1
        presidiowork=0
        action=0}}
if presidiowork=1
if action=1
{if distance_to_object(instance_nearest(dirox,diroy,castello))<10
    if fullc=false
        {instance_destroy()
        global.pop-=2
        if selected=1
            {global.sel-=1
            global.milsel-=1
            global.arcsel-=1}
        with instance_nearest(dirox,diroy,castello)
        npresidio+=1}
    else
        {if point_distance(x,y,dirox,diroy)<100
        if action=1
        presidiowork=0
        action=0}}
