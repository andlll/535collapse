// ally_omino — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Tasto sinistro del mouse
if hover=1
if mouse_check_button_released(mb_left)=true
    {
    ///selezione e selezione multipla
    if dc=1
    with (ally_omino)
        {
        if x>view_xview[0] && x<view_xview[0]+view_wview[0] && y>view_yview[0] && y<view_yview[0]+view_hview[0]
            {selected=1
            global.sel+=1}}
    //quando non ci sta alt premuto che succede//
    if global.sele>-1
    if selected=0
        {
        selected=1
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
            }
        selected=0
        }}

// --- azione 2: execute code ---
///Morte
var diro=direction
if life<=0
    {scr_free()
    if selected=1
    global.sel-=1
    if action=0
    global.idle-=1
    var corpse=instance_create(x,y,omino_corpse)
    instance_destroy()
    global.pop-=1
    with (corpse)
    direction=diro
    }

// --- azione 3: execute code ---
///Campi di grano
//foodwork: 0 = non sto lavorando nei campi; 1 = sto andando verso il mio campo; 2 = sto portando il cibo al granaio; 6 = sto cercando il campo libero più vicino
//determinazione del campo più vicino
if foodwork=1 || foodwork=6
    {
    var miocampox,miocampoy,dis,pos,top
    pos=id
    top=99999
    with (campo)
        {if foodwork=0
            {dis=distance_to_object(pos)
            if (dis < top)
                {miocampox=x
                miocampoy=y
                top=dis
                }}}
    if campox!=miocampox || foodwork=6
        {campox=miocampox
        campoy=miocampoy
        dirox=campox
        diroy=campoy
        foodx=campox
        foody=campoy
        scr_free()
        scr_generate_goal_field(dirox, diroy);
        scr_generate_flow_field()
        foodwork=1}
    action=1}

//raggiungimento campi e granai
//tutti occupati
if top=99999
if foodwork=1
    {action=0
    global.idle+=1
    foodwork=0}

//raccolta del cibo
if foodwork=1
    {
    if distance_to_point(foodx,foody)<5
        {
        foodwork=0
        scr_occupy()
        action=4
        step=0
        wood=0
        gold=0
        stone=0
        alarm[2]=13
        instance_create(x,y,food_bullet)
        direction=point_direction(x,y,foodx,foody)
        }}


//arrivi a 10 di cibo
if action=4
if food>=10
if instance_number(ally_barn)>0
    {action=1
    scr_free()
    dirox=instance_nearest(x,y,ally_barn).x
    diroy=instance_nearest(x,y,ally_barn).y
    if foodwork!=2
{
    var result_list = ds_list_create();
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
    scr_generate_flow_field();}
    alarm[0]=13
    foodwork=2}
else
    {action=0
    scr_occupy()
    foodwork=0
    step=0
    speed=0
    global.idle+=1}
//vicino a granaio
if (foodwork=2 || food>0) && action!=4
if distance_to_object(ally_barn)<10
    {global.food+=food
    food=0
    alarm[0]=13
    if foodwork=2 ||  action=4
    foodwork=6}

// --- azione 4: execute code ---
///Velocità di movimento
if action=1
    {if wood>0
    autospeed=2*(1-0.36*abs(sin(degtorad(direction))))
    else
    autospeed=3*(1-0.36*abs(sin(degtorad(direction))))
    if gold>0
    autospeed=2*(1-0.36*abs(sin(degtorad(direction))))
    if food>0
    autospeed=2*(1-0.36*abs(sin(degtorad(direction))))
    if stone>0
    autospeed=2*(1-0.36*abs(sin(degtorad(direction))))}
else
autospeed=0

// --- azione 5: execute code ---
///Direzione
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
///Quando fermarsi
if action=1 && woodwork=0
if x=dirox
if y=diroy
    {action=0
    creation=0
    path_end()
    scr_occupy()
    speed=0
    global.idle+=1}
if action=1 && woodwork=1 && x=dirox && y=diroy && point_distance(woodx,woody,dirox,diroy)>20 && instance_number(albero)>0
            {
            action=1
            dirox=instance_nearest(x,y,albero).x
            diroy=instance_nearest(x,y,albero).y
            woodwork=1
            alarm[0]=13
            woodx=dirox
            woody=diroy
            }

// --- azione 7: execute code ---
///Assegnazione sprite

if action<2
if wood<=0 || gold<=0 || food<=0 || stone<=0
    {if phase=1
        {if step=0
        if sprite_index!=ow41
        sprite_index=ow41
        if step=1
        if sprite_index!=ow42
        sprite_index=ow42
        if step=2
        if sprite_index!=ow41
        sprite_index=ow41
        if step=3
        if sprite_index!=ow43
        sprite_index=ow43}
    if phase=2
        {if step=0
        if sprite_index!=ow51
        sprite_index=ow51
        if step=1
        if sprite_index!=ow52
        sprite_index=ow52
        if step=2
        if sprite_index!=ow51
        sprite_index=ow51
        if step=3
        if sprite_index!=ow53
        sprite_index=ow53}
    if phase=3
        {if step=0
        if sprite_index!=ow61
        sprite_index=ow61
        if step=1
        if sprite_index!=ow62
        sprite_index=ow62
        if step=2
        if sprite_index!=ow61
        sprite_index=ow61
        if step=3
        if sprite_index!=ow63
        sprite_index=ow63}
    if phase=4
        {if step=0
        if sprite_index!=ow71
        sprite_index=ow71
        if step=1
        if sprite_index!=ow72
        sprite_index=ow72
        if step=2
        if sprite_index!=ow71
        sprite_index=ow71
        if step=3
        if sprite_index!=ow73
        sprite_index=ow73}
    if phase=5
        {if step=0
        if sprite_index!=ow81
        sprite_index=ow81
        if step=1
        if sprite_index!=ow82
        sprite_index=ow82
        if step=2
        if sprite_index!=ow81
        sprite_index=ow81
        if step=3
        if sprite_index!=ow83
        sprite_index=ow83}
    if phase=6
        {if step=0
        if sprite_index!=ow11
        sprite_index=ow11
        if step=1
        if sprite_index!=ow12
        sprite_index=ow12
        if step=2
        if sprite_index!=ow11
        sprite_index=ow11
        if step=3
        if sprite_index!=ow13
        sprite_index=ow13}
    if phase=7
        {if step=0
        if sprite_index!=ow21
        sprite_index=ow21
        if step=1
        if sprite_index!=ow22
        sprite_index=ow22
        if step=2
        if sprite_index!=ow21
        sprite_index=ow21
        if step=3
        if sprite_index!=ow23
        sprite_index=ow23}
    if phase=8
        {if step=0
        if sprite_index!=ow31
        sprite_index=ow31
        if step=1
        if sprite_index!=ow32
        sprite_index=ow32
        if step=2
        if sprite_index!=ow31
        sprite_index=ow31
        if step=3
        if sprite_index!=ow33
        sprite_index=ow33}}
if wood >0 || gold>0 || food>0 || stone>0
    {if phase=1
        {if step=0
        if sprite_index!=car41
        sprite_index=car41
        if step=1
        if sprite_index!=car42
        sprite_index=car42
        if step=2
        if sprite_index!=car41
        sprite_index=car41
        if step=3
        if sprite_index!=car43
        sprite_index=car43}
    if phase=2
        {if step=0
        sprite_index=car51
        if step=1
        sprite_index=car52
        if step=2
        sprite_index=car51
        if step=3
        sprite_index=car53}
    if phase=3
        {if step=0
        sprite_index=car61
        if step=1
        sprite_index=car62
        if step=2
        sprite_index=car61
        if step=3
        sprite_index=car63}
    if phase=4
        {if step=0
        sprite_index=car71
        if step=1
        sprite_index=car72
        if step=2
        sprite_index=car71
        if step=3
        sprite_index=car73}
    if phase=5
        {if step=0
        sprite_index=car81
        if step=1
        sprite_index=car82
        if step=2
        sprite_index=car81
        if step=3
        sprite_index=car83}
    if phase=6
        {if step=0
        sprite_index=car11
        if step=1
        sprite_index=car12
        if step=2
        sprite_index=car11
        if step=3
        sprite_index=car13}
    if phase=7
        {if step=0
        sprite_index=car21
        if step=1
        sprite_index=car22
        if step=2
        sprite_index=car21
        if step=3
        sprite_index=car23}
    if phase=8
        {if step=0
        sprite_index=car31
        if step=1
        sprite_index=car32
        if step=2
        sprite_index=car31
        if step=3
        sprite_index=car33}}
if action>=2
if action<6
    {if phase=1
        {if step=0
        sprite_index=owo41
        if step=1
        sprite_index=owo42
        if step=2
        sprite_index=owo43}
    if phase=2
        {if step=0
        sprite_index=owo51
        if step=1
        sprite_index=owo52
        if step=2
        sprite_index=owo53}
    if phase=3
        {if step=0
        sprite_index=owo61
        if step=1
        sprite_index=owo62
        if step=2
        sprite_index=owo63}
    if phase=4
        {if step=0
        sprite_index=owo71
        if step=1
        sprite_index=owo72
        if step=2
        sprite_index=owo73}
    if phase=5
        {if step=0
        sprite_index=owo81
        if step=1
        sprite_index=owo82
        if step=2
        sprite_index=owo83}
    if phase=6
        {if step=0
        sprite_index=owo11
        if step=1
        sprite_index=owo12
        if step=2
        sprite_index=owo13}
    if phase=7
        {if step=0
        sprite_index=owo21
        if step=1
        sprite_index=owo22
        if step=2
        sprite_index=owo23}
    if phase=8
        {if step=0
        sprite_index=owo31
        if step=1
        sprite_index=owo32
        if step=2
        sprite_index=owo33}}
if action=6 || action=7
    {if phase=1
        {if step=0
        sprite_index=ob41
        if step=1
        sprite_index=ob42
        if step=2
        sprite_index=ob43}
    if phase=2
        {if step=0
        sprite_index=ob51
        if step=1
        sprite_index=ob52
        if step=2
        sprite_index=ob53}
    if phase=3
        {if step=0
        sprite_index=ob61
        if step=1
        sprite_index=ob62
        if step=2
        sprite_index=ob63}
    if phase=4
        {if step=0
        sprite_index=ob71
        if step=1
        sprite_index=ob72
        if step=2
        sprite_index=ob73}
    if phase=5
        {if step=0
        sprite_index=ob81
        if step=1
        sprite_index=ob82
        if step=2
        sprite_index=ob83}
    if phase=6
        {if step=0
        sprite_index=ob11
        if step=1
        sprite_index=ob12
        if step=2
        sprite_index=ob13}
    if phase=7
        {if step=0
        sprite_index=ob21
        if step=1
        sprite_index=ob22
        if step=2
        sprite_index=ob23}
    if phase=8
        {if step=0
        sprite_index=ob31
        if step=1
        sprite_index=ob32
        if step=2
        sprite_index=ob33}}
if action=8
    {if phase=1
        {if step=0
        sprite_index=os41
        if step=1
        sprite_index=os42
        if step=2
        sprite_index=os43}
    if phase=2
        {if step=0
        sprite_index=os51
        if step=1
        sprite_index=os52
        if step=2
        sprite_index=os53}
    if phase=3
        {if step=0
        sprite_index=os61
        if step=1
        sprite_index=os62
        if step=2
        sprite_index=os63}
    if phase=4
        {if step=0
        sprite_index=os71
        if step=1
        sprite_index=os72
        if step=2
        sprite_index=os73}
    if phase=5
        {if step=0
        sprite_index=os81
        if step=1
        sprite_index=os82
        if step=2
        sprite_index=os83}
    if phase=6
        {if step=0
        sprite_index=os11
        if step=1
        sprite_index=os12
        if step=2
        sprite_index=os13}
    if phase=7
        {if step=0
        sprite_index=os21
        if step=1
        sprite_index=os22
        if step=2
        sprite_index=os23}
    if phase=8
        {if step=0
        sprite_index=os31
        if step=1
        sprite_index=os32
        if step=2
        sprite_index=os33}}

// --- azione 8: execute code ---
///Selezione multipla
if global.multi=1
if global.sele=0
{if (x>global.startx && x<mouse_x && y>global.starty && y<mouse_y) || (x<global.startx && x>mouse_x && y>global.starty && y<mouse_y) || (x>global.startx && x<mouse_x && y<global.starty && y>mouse_y) || (x<global.startx && x>mouse_x && y<global.starty && y>mouse_y)
{if selected=0
global.sel+=1
selected=1
}
else
{if selected=1
global.sel-=1
selected=0}}

// --- azione 9: execute code ---
///Se posto in cui fermarsi è occupato
if action=1
if buildwork=0
if stonework=0
if foodwork=0
if woodwork=0
if goldwork=0
if fieldwork=0
if place_empty(dirox,diroy)=false
if creation=0
    {var dir = point_direction(dirox, diroy, x, y); // direzione da arrivo → partenza
    dirox += lengthdir_x(50, dir);
    diroy += lengthdir_y(50, dir);}
else
    {
    dirox += irandom_range(-32,32);
    diroy += irandom_range(-32,32);
    } 

// --- azione 10: execute code ---
///Raggiungimento dei magazzini e tornare indietro
//legno//
if action=2
if wood>=10
    {if instance_number(ally_magazza)>0
        {action=1
        scr_free()
        dirox=instance_nearest(x,y,ally_magazza).x
        diroy=instance_nearest(x,y,ally_magazza).y
        target_angle=point_direction(x,y,dirox,diroy)
        scr_generate_goal_field(dirox, diroy);
        scr_generate_flow_field()
        alarm[0]=13
        woodwork=2}
    else
        {action=0
        woodwork=0
        step=0
        speed=0
        global.idle+=1}}
if distance_to_object(ally_magazza)<10
    {global.wood+=wood
    wood=0
    if woodwork=2
        {if instance_number(albero)>0
            {
            action=1
            scr_free()
            dirox=instance_nearest(x,y,albero).x
            diroy=instance_nearest(x,y,albero).y
            target_angle=point_direction(x,y,dirox,diroy)
            scr_generate_goal_field(dirox, diroy);
            scr_generate_flow_field()
            woodwork=1
            alarm[0]=13
            woodx=dirox
            woody=diroy
            }
        else
            {action=0
            woodwork=0
            step=0
            speed=0
            global.idle+=1}}}
//oro//
if action=3
if gold>=10
{if instance_number(ally_magazza)>0
    {action=1
    scr_free()
    dirox=instance_nearest(x,y,ally_magazza).x
    diroy=instance_nearest(x,y,ally_magazza).y
    target_angle=point_direction(x,y,dirox,diroy)
    if goldwork!=2
    scr_move(dirox,diroy)
    alarm[0]=13
    goldwork=2}
else
    {action=0
    scr_occupy()
    woodwork=0
    step=0
    speed=0
    global.idle+=1}}
if distance_to_object(ally_magazza)<10
    {global.gold+=gold
    gold=0
    with instance_nearest(x,y,miniera_oro)
        {if visible=true
        var visoro=true
        else
        var visoro=false}
    if goldwork=2
        {if instance_number(miniera_oro)>0 && visoro=true
            {
            action=1
            scr_free()
            dirox=instance_nearest(x,y,miniera_oro).x
            diroy=instance_nearest(x,y,miniera_oro).y
            target_angle=point_direction(x,y,dirox,diroy)
            if goldwork!=1
            scr_move(dirox,diroy)
            goldwork=1
            alarm[0]=13
            goldx=dirox
            goldy=diroy}
        else
            {action=0
            scr_occupy()
            goldwork=0
            step=0
            speed=0
            global.idle+=1}
        }}
//pietra//
if action=5
if stone>=10
    {if instance_number(ally_magazza)>0
        {action=1
        scr_free()
        dirox=instance_nearest(x,y,ally_magazza).x
        diroy=instance_nearest(x,y,ally_magazza).y
        target_angle=point_direction(x,y,dirox,diroy)
        if stonework!=2
        scr_move(dirox,diroy)
        alarm[0]=13
        stonework=2}
    else
        {action=0
        scr_occupy()
        goldwork=0
        step=0
        speed=0
        global.idle+=1}}
if distance_to_object(ally_magazza)<10
    {global.stone+=stone
    stone=0
    with instance_nearest(x,y,stone_parent)
        {if visible=true
        var vispietr=true
        else
        var vispietr=false}
    if stonework=2
        {if instance_number (stone_parent)>0 && vispietr=true
            {
            action=1
            scr_free()
            dirox=instance_nearest(x,y,stone_parent).x
            diroy=instance_nearest(x,y,stone_parent).y
            target_angle=point_direction(x,y,dirox,diroy)
            if stonework!=1
            scr_move(dirox,diroy)
            stonework=1
            alarm[0]=13
            stonex=dirox
            stoney=diroy
            }
        else
            {action=0
            scr_occupy()
            stonework=0
            step=0
            speed=0
            global.idle+=1}}}

// --- azione 11: execute code ---
///Posto occupato (legacy?)
if action=1
if woodwork=0
if goldwork=0
if foodwork=0
if stonework=0
if buildwork=0
if fieldwork=0
{if place_free(dirox,diroy)=false
{dirox+=irandom_range(-30,30)
diroy+=irandom_range(-30,30)}}

// --- azione 12: execute code ---
///Clicker idle
if action=0
if idling=0
    {idling=1
    idleorder=global.idle}
if action!=0
if idling=1
    {idling=0
    var orderr=idleorder
    idleorder=0
    with (ally_omino)
        {if idleorder>orderr
        idleorder-=1}}

// --- azione 13: execute code ---
///Se non ci sono pulsanti costruzione in giro
if instance_number(torre_placer)>0
global.sele=1

// --- azione 14: execute code ---
///Movimento con flow field
var workreach
if goldwork>0 || stonework>0 || woodwork>0
workreach=200
else
workreach=0
if action=1
    {if point_distance(x,y,dirox,diroy)>300-workreach || place_free(x,y)=false //se è distante usa flow field, place free chi cazzo si ricorda perché l'avevo messo lì, forse per evitare che vada in pappa con altri pupazzi?
        {if instance_place(x,y,ally_unit)!=noone // se c'è una collisione con un'altra unità
            {otro= instance_place(x,y,ally_unit)
            if otro.ordo>self.ordo || otro.action!=1 //se l'altro ha rank più alto e si sta muovendo tu fermati
            scr_move_flow_field()
            else
                {step=0
                alarm[0]++}}
        else
        scr_move_flow_field()}//in caso contrario cammina
    else //movimento con step towards quando è molto vicino
        {if goldwork=0 && stonework=0 && buildwork=0 && repairwork=0 && foodwork!=2 && fieldwork=0
        mp_potential_step(dirox,diroy,autospeed,false)
        if goldwork=1
        mp_potential_step(instance_nearest(x,y,miniera_oro).x,instance_nearest(x,y,miniera_oro).y,autospeed,false)
        if stonework=1
        mp_potential_step(instance_nearest(x,y,stone_parent).x,instance_nearest(x,y,stone_parent).y,autospeed,false)
        if buildwork=1
        mp_potential_step(instance_nearest(buildx,buildy,ally_fondamenta).x,instance_nearest(buildx,buildy,ally_fondamenta).y,autospeed,false)
        if repairwork=1
        mp_potential_step(instance_nearest(repx,repy,ally_build).x,instance_nearest(repx,repy,ally_build).y,autospeed,false)
        if fieldwork=1
            {mp_potential_step(instance_nearest(buildx,buildy,campo_fond).x,instance_nearest(buildx,buildy,campo_fond).y,autospeed,false)
            dirox=instance_nearest(buildx,buildy,campo_fond).x
            diroy=instance_nearest(buildx,buildy,campo_fond).y}
        if foodwork=2
        mp_potential_step(instance_nearest(dirox,diroy,ally_barn).x,instance_nearest(dirox,diroy,ally_barn).y,autospeed,false)
        if goldwork=2 || stonework=2
        mp_potential_step(instance_nearest(dirox,diroy,ally_magazza).x,instance_nearest(dirox,diroy,ally_magazza).y,autospeed,false)
        }}
//Ricalcola flow field e goal field se destinazione è occupata
if (ds_grid_get(global.cost_field, goal_x div global.grid_size, goal_y div global.grid_size) >= 1000) && buildwork=0 && repairwork=0 && action=1 && goldwork=0 && woodwork=0 && stonework=0
{{
    var result_list = ds_list_create();
    instance_create(x,y,legno_prizedrawer)
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

// --- azione 15: execute code ---
///Seminare un campo alla volta
if fieldwork=1 && instance_place(buildx,buildy,ally_omino)
        {action=0
        fieldwork=0
        dirox=x
        diroy=y
        scr_occupy()
        global.idle++
        speed=0}

// --- azione 16: execute code ---
///Lavoro
//legno//
if woodwork=1
    {if instance_number(albero)>0
        {if distance_to_object(instance_nearest(woodx,woody,albero))<20 && (ds_grid_get(global.cost_field, x div global.grid_size, y div global.grid_size) < 1000)
            {woodwork=0
            scr_occupy()
            action=2
            food=0
            gold=0
            stone=0
            step=0
            alarm[2]=13
            direction=point_direction(x,y,woodx,woody)}
        else
        if distance_to_point(woodx,woody)<250
            {woodx=instance_nearest(x,y,albero).x
            woody=instance_nearest(x,y,albero).y}
            }
    else
        {action=0
        woodwork=0
        step=0
        speed=0
        global.idle+=1}}
if action=2
    {if instance_number(albero)>0
    {if point_distance(woodx,woody,instance_nearest(woodx,woody,albero).x,instance_nearest(woodx,woody,albero).y)>10
        {
        action=1
        scr_free()
        dirox=instance_nearest(x,y,albero).x
        diroy=instance_nearest(x,y,albero).y
        scr_move(dirox,diroy)
        woodwork=1
        alarm[0]=13
        woodx=dirox
        woody=diroy
        }}
    if instance_number(albero)<=0
        {action=0
        scr_occupy()
        buildwork=0
        woodwork=0
        step=0
        speed=0
        global.idle+=1}}
//oro//
if goldwork=1
if distance_to_object(instance_nearest(goldx,goldy,miniera_oro))<20 && (ds_grid_get(global.cost_field, x div global.grid_size, y div global.grid_size) < 1000)
    {goldwork=0
    scr_occupy()
    action=3
    wood=0
    food=0
    stone=0
    step=0
    alarm[2]=13
    direction=point_direction(x,y,goldx,goldy)
    }
if action=3
    {if instance_number(miniera_oro)>0
    {if point_distance(goldx,goldy,instance_nearest(goldx,goldy,miniera_oro).x,instance_nearest(goldx,goldy,miniera_oro).y)>10
        {
        action=1
        scr_free()
        dirox=instance_nearest(x,y,miniera_oro).x
        diroy=instance_nearest(x,y,miniera_oro).y
        goldwork=1
        alarm[0]=13
        goldx=dirox
        goldy=diroy
        }}
if instance_number(miniera_oro)<=0 //se le miniere sono finite fermati
    {action=0
    scr_occupy()
    buildwork=0
    goldwork=0
    step=0
    speed=0
    global.idle+=1}}

//pietra//
if stonework=1
if distance_to_object(instance_nearest(stonex,stoney,stone_parent))<15 && (ds_grid_get(global.cost_field, x div global.grid_size, y div global.grid_size) < 1000)
    {stonework=0
    action=5
    scr_occupy()
    wood=0
    food=0
    gold=0
    step=0
    alarm[2]=13
    direction=point_direction(x,y,stonex,stoney)
    }
if action=5
    {
    if instance_number(stone_parent)>0
        if point_distance(stonex,stoney,instance_nearest(stonex,stoney,stone_parent).x,instance_nearest(stonex,stoney,stone_parent).y)>10
            {
            action=1
            scr_free()
            dirox=instance_nearest(x,y,stone_parent).x
            diroy=instance_nearest(x,y,stone_parent).y
            stonework=1
            alarm[0]=13
            stonex=dirox
            stoney=diroy
            }
    if instance_number(stone_parent)<=0
        {action=0
        scr_occupy()
        buildwork=0
        stonework=0
        step=0
        speed=0
        global.idle+=1}}
//costruzione
if buildwork=1
if instance_number(ally_fondamenta)>0
    {if distance_to_object(instance_nearest(buildx,buildy,ally_fondamenta))<10
        {buildwork=0
        scr_occupy()
        action=6
        wood=0
        food=0
        gold=0
        stone=0
        step=0
        alarm[2]=13
        direction=point_direction(x,y,buildx,buildy)
        }}
else
    {action=0
    scr_occupy()
    buildwork=0
    step=0
    speed=0
    global.idle+=1} 
//coltivazione di campo
if fieldwork=1
if point_distance(x,y,instance_nearest(x,y,campo_fond).x,instance_nearest(x,y,campo_fond).y)<10
    {fieldwork=0
    scr_occupy()
    action=8
    wood=0
    buildx=instance_nearest(x,y,campo_fond).x
    buildy=instance_nearest(x,y,campo_fond).y
    food=0
    gold=0
    stone=0
    step=0
    alarm[2]=13
    direction=point_direction(x,y,buildx,buildy)
    with instance_nearest(x,y,campo_fond)
    occupato=1
    }
//riparazione
if repairwork=1
if distance_to_object(instance_nearest(repx,repy,ally_build))<5
    {repairwork=0
    scr_occupy()
    action=7
    wood=0
    food=0
    gold=0
    stone=0
    step=0
    alarm[2]=13
    direction=point_direction(x,y,repx,repy)
    }
//fine costruzione//
if action=6
    {if instance_number(ally_fondamenta)>0
        {if distance_to_object(instance_nearest(buildx,buildy,ally_fondamenta))>40
            {
            action=1
            scr_free()
            dirox=instance_nearest(x,y,ally_fondamenta).x
            diroy=instance_nearest(x,y,ally_fondamenta).y
            buildx=dirox
            buildy=diroy
            target_angle=point_direction(x,y,dirox,diroy)
            if buildwork!=1
            scr_move(dirox,diroy)
            buildwork=1
            alarm[0]=13

            }}
    else
        {action=0
        buildwork=0
        step=0
        speed=0
        global.idle+=1}}
//fine coltivazione
if action=8
    if instance_number(campo_fond)>0
        {if point_distance(buildx,buildy,instance_nearest(buildx,buildy,campo_fond).x,instance_nearest(buildx,buildy,campo_fond).y)>30
            {dirox=campox
            diroy=campoy
            foodx=campox
            foody=campoy
            if foodwork!=1
            scr_move(dirox,diroy)
            foodwork=1
            scr_free()
            action=1
            alarm[0]=13
            exit}}
        else
            {dirox=campox
            diroy=campoy
            foodx=campox
            foody=campoy
            if foodwork!=1
            scr_move(dirox,diroy)
            foodwork=1
            scr_free()
            action=1
            alarm[0]=13
            exit}   
//annullamento del timer per fermarsi
if stonework!=0 || goldwork!=0 || woodwork!=0 || foodwork!=0 || buildwork!=0 || repairwork!=0 || action!=1 || fieldwork!=0
alarm[8]=-1
