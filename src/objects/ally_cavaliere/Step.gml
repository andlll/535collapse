// ally_cavaliere — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/ally_cavaliere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///tasto sinistro del mouse
if hover=1
if mouse_check_button_released(mb_left)=true
{
///selezione e selezione multipla
if dc=1
with (ally_cavaliere)
{
if x>view_xview[0] && x<view_xview[0]+view_wview[0] && y>view_yview[0] && y<view_yview[0]+view_hview[0]
{selected=1
global.sel+=1
global.milsel+=1}}
//quando non ci sta alt premuto che succede//
if global.sele>-1
if selected=0
    {
    selected=1
    global.milsel+=1
    if dc=0
    global.sel+=1
    if instance_number(parent_hint)<1
    if global.multihint=0
        {instance_create(x,y,hint_multi)
        global.multihint=1}
    if dc=0
        {dc=1
        alarm[1]=30}}
//quando alt sta premuto che succede//
if global.sele=-1
{
if selected=1
{global.sel-=1
global.milsel-=1
}
selected=0
}}

// --- azione 2: execute code ---
///Morte
var diro=direction
if life<=0
    {scr_free()
    instance_destroy()
    global.pop-=3
    var corpse=instance_create(x,y,cavaliere_corpse)
    with (corpse)
    direction=diro
    if selected=1
        {global.sel-=1
        global.milsel-=1}}

// --- azione 3: execute code ---
///velocità di movimento
autospeed=(5+chargespeed)*(1-0.36*abs(sin(degtorad(direction))))

// --- azione 4: execute code ---
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
//quando fermarsi
if action=1
if point_distance(x,y,dirox,diroy)<10*(1-0.36*abs(sin(degtorad(direction))))
    {action=0
    scr_occupy()
    warwork=0
    speed=0}

// --- azione 5: execute code ---
///impostazioni di step
mp_potential_settings(30,3,3,true)

// --- azione 6: execute code ---
///quando fermarsi
if action=1
if point_distance(x,y,dirox,diroy)<10
    {action=0
    warwork=0
    creation=0
    scr_occupy()
    speed=0}

// --- azione 7: execute code ---
///assegnazione sprite

if action<2
    {if phase=1
    {if step=0
    sprite_index=cm41
    if step=1
    sprite_index=cm42
    if step=2
    sprite_index=cm41
    if step=3
    sprite_index=cm43}
    if phase=2
    {if step=0
    sprite_index=cm51
    if step=1
    sprite_index=cm52
    if step=2
    sprite_index=cm51
    if step=3
    sprite_index=cm53}
    if phase=3
    {if step=0
    sprite_index=cm61
    if step=1
    sprite_index=cm62
    if step=2
    sprite_index=cm61
    if step=3
    sprite_index=cm63}
    if phase=4
    {if step=0
    sprite_index=cm71
    if step=1
    sprite_index=cm72
    if step=2
    sprite_index=cm71
    if step=3
    sprite_index=cm73}
    if phase=5
    {if step=0
    sprite_index=cm81
    if step=1
    sprite_index=cm82
    if step=2
    sprite_index=cm81
    if step=3
    sprite_index=cm83}
    if phase=6
    {if step=0
    sprite_index=cm11
    if step=1
    sprite_index=cm12
    if step=2
    sprite_index=cm11
    if step=3
    sprite_index=cm13}
    if phase=7
    {if step=0
    sprite_index=cm21
    if step=1
    sprite_index=cm22
    if step=2
    sprite_index=cm21
    if step=3
    sprite_index=cm23}
    if phase=8
    {if step=0
    sprite_index=cm31
    if step=1
    sprite_index=cm32
    if step=2
    sprite_index=cm31
    if step=3
    sprite_index=cm33}}
if action=2 && instance_exists(enemy_unit)
    {var aggredito=instance_nearest(x+30*cos(degtorad(direction)),y-30*sin(degtorad(direction)),enemy_unit)
    direction=point_direction(x,y,aggredito.x,aggredito.y)}
if action>=2
if action<6
{if phase=1
{if step=0
sprite_index=ca41
if step=1
sprite_index=ca42
if step=2
sprite_index=ca43}
if phase=2
{if step=0
sprite_index=ca51
if step=1
sprite_index=ca52
if step=2
sprite_index=ca53}
if phase=3
{if step=0
sprite_index=ca61
if step=1
sprite_index=ca62
if step=2
sprite_index=ca63}
if phase=4
{if step=0
sprite_index=ca71
if step=1
sprite_index=ca72
if step=2
sprite_index=ca73}
if phase=5
{if step=0
sprite_index=ca81
if step=1
sprite_index=ca82
if step=2
sprite_index=ca83}
if phase=6
{if step=0
sprite_index=ca11
if step=1
sprite_index=ca12
if step=2
sprite_index=ca13}
if phase=7
{if step=0
sprite_index=ca21
if step=1
sprite_index=ca22
if step=2
sprite_index=ca23}
if phase=8
{if step=0
sprite_index=ca31
if step=1
sprite_index=ca32
if step=2
sprite_index=ca33}}

// --- azione 8: execute code ---
///selezione multipla
if global.multi=1
if global.sele=0
{if (x>global.startx && x<mouse_x && y>global.starty && y<mouse_y) || (x<global.startx && x>mouse_x && y>global.starty && y<mouse_y) || (x>global.startx && x<mouse_x && y<global.starty && y>mouse_y) || (x<global.startx && x>mouse_x && y<global.starty && y>mouse_y)
{if selected=0
{global.sel+=1
global.milsel+=1}
selected=1
}
else
{if selected=1
{global.sel-=1
global.milsel-=1}
selected=0}}

// --- azione 9: execute code ---
///se posto in cui fermarsi è occupato
if action=1 
if place_free(dirox,diroy)=false
if creation!=1
        {
            var dir = point_direction(dirox, diroy, x, y); // direzione da arrivo → partenza
            dirox += lengthdir_x(50, dir);
            diroy += lengthdir_y(50, dir);
        }
else
        {
            dirox += irandom_range(-50,50);
            diroy += irandom_range(-50,50);
        }

// --- azione 10: execute code ---
///se non ci sono pulsanti costruzione in giro
if instance_number(torre_placer)>0
global.sele=1

// --- azione 11: execute code ---
///Movimento con flow field
if !instance_exists(target_eu) //se il nemico è morto smette di cercarlo o attaccarlo
target_eu=noone
if action=1
    {if point_distance(x,y,dirox,diroy)>400 || place_free(x,y)=false //se è distante usa flow field, place free chi cazzo si ricorda perché l'avevo messo lì, forse per evitare che vada in pappa con altri pupazzi?
        {if instance_place(x,y,ally_unit)!=noone // se c'è una collisione con un'altra unità amica
            {otro= instance_place(x,y,ally_unit)
            if otro.ordo>self.ordo || otro.action!=1 //se l'altro ha rank più alto e si sta muovendo tu fermati
                scr_move_flow_field()
            else
                {step=0
                alarm[0]++}}
        else
        {scr_move_flow_field()
        typem=ff}}//in caso contrario cammina
    else //movimento con step towards quando è molto vicino
        {if firework=0 && (warwork=0 || warwork=4) 
        mp_potential_step(dirox,diroy,autospeed,false)
        if firework=1
        mp_potential_step(targetid.x,targetid.y,autospeed,false)
        if warwork=1 && target_eu!=noone 
        mp_potential_step(target_eu.x,target_eu.y,autospeed,false)
        if warwork=1 && target_eu=noone && distance_to_object(instance_nearest(x,y,enemy_unit))<400
        mp_potential_step(instance_nearest(x,y,enemy_unit).x,instance_nearest(x,y,enemy_unit).y,autospeed,false)
        typem=mp}}
//Ricalcola flow field e goal field se destinazione è occupata
if (ds_grid_get(global.cost_field, goal_x div global.grid_size, goal_y div global.grid_size) >= 1000) && firework=0 && warwork=0
{{
    var result_list = ds_list_create();
    scr_free()
    if (scr_find_valid_cell_backwards(floor(dirox div 32), floor(dirox div 32), floor(x div 32),floor (y div 32), result_list))   
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

// --- azione 12: execute code ---
///Attacco
//warwork:0-è fermo 1-va verso il nemico per attaccarlo 2-attacca il nemico 3-non lo trovo forse legacy 4-si muove ma non sta attaccando
if instance_exists(enemy_unit)
{if !instance_exists(target_eu) //se il nemico è morto smette di cercarlo o attaccarlo
target_eu=noone
if target_eu=noone //cosa fare se non ha già bersagli selezionati
    {var target_auto=instance_nearest(x,y,enemy_unit)
    with(target_auto)
        {if visible=true
        var target_auto_valid=true
        else
        var target_auto_valid=false}
    if distance_to_object(target_auto)<10*(1-0.36*abs(sin(degtorad(direction))))  //se c'è un nemico vicinissimo lo attacca immediatamente
        {if warwork=2&& alarm[2]<1
            {targetx=target_auto.x
            targety=target_auto.y
            scr_occupy()
            }
        if warwork!=2 && warwork!=4 && alarm[2]<1 //se non sta già attaccando o se non gli hai dato ordine di muoversi (in quel caso se ne frega e continua a muoversi)
            {action=2
            warwork=2
            scr_occupy()
            alarm[2]=13
            }exit}
    else //se non c'è si ferma dov'è
        {if warwork=2 //se stavi attaccando fermati e basta
            {action=0
            warwork=0
            step=0
            scr_occupy()
            speed=0
            exit}
        if warwork=1 && distance_to_object(target_auto)>=comp*(1-0.36*abs(sin(degtorad(direction)))) //se non ci sono più nemici vicini fermati
            {action=0
            warwork=0
            step=0
            scr_occupy()
            speed=0
            exit}}
    if distance_to_object(target_auto)<comp*(1-0.36*abs(sin(degtorad(direction)))) && target_auto_valid=true//se ci sono nemici vicini si muove verso quello più vicino, cambiando bersaglio in base al più vicino
    if warwork=0 || warwork=1
        {dirox=instance_nearest(x,y,enemy_unit).x
        diroy=instance_nearest(x,y,enemy_unit).y
        if action!=1
            {alarm[0]=15
            scr_move(dirox,diroy)
            scr_free()}
        action=1
        warwork=1
        }}
//clic destro su nemico, ignora i bersagli immediatamente intorno e si concentra su di lui
else
   {
    if distance_to_object(target_eu)<10 //se è molto vicino al nemico lo attacca
        {if warwork=2&& alarm[2]<1 //se sta già attaccando
            {targetx=target_eu.x
            targety=target_eu.y
            target_eu=noone
            }
        if warwork!=2 && warwork!=4&& alarm[2]<1 //se non sta già attaccando
            {action=2
            warwork=2
            alarm[2]=13
            scr_occupy()
            }exit}
    else //se smette di essere vicinissimo smetti di attaccare
        {if warwork=2 
            {action=0
            warwork=0
            speed=0
            scr_occupy()
            target_eu=noone}
        }
    if warwork=0 || warwork=1 //se si sta muovendo o è fermo muoviti verso di lui
        {dirox=target_eu.x
        diroy=target_eu.y
        if action!=1
            {alarm[0]=15
            scr_move(dirox,diroy)
            scr_free()}
        action=1
        warwork=1
            }}
if action=2 && instance_exists(enemy_unit)
direction=point_direction(x,y,targetx,targety)}
else
    {if warwork=1 || warwork=2 || action=2
        {action=0
        warwork=0
        speed=0
        scr_occupy()
        target_eu=noone}}

// --- azione 13: execute code ---
if selected=1
if instance_number(attacco_clicker)=0
    {instance_create(0,0,attacco_clicker)
    instance_create(0,0,difesa_clicker)}
