// ally_warrior — Alarm_11 (eventtype=2 enumb=11)
// Estratto da gmx/objects/ally_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Attacco
//warwork:0-è fermo 1-va verso il nemico per attaccarlo 2-attacca il nemico 3-non lo trovo forse legacy 4-si muove ma non sta attaccando
if !instance_exists(target_eu) //se il nemico è morto smette di cercarlo o attaccarlo
target_eu=noone
if target_eu=noone //cosa fare se non ha già bersagli selezionati
    {
    if distance_to_object(instance_nearest(x,y,enemy_unit))<10*(1-0.36*abs(sin(degtorad(direction)))) //se c'è un nemico vicinissimo lo attacca immediatamente
        {if warwork=2&& alarm[2]<1
            {targetx=instance_nearest(x,y,enemy_unit).x
            targety=instance_nearest(x,y,enemy_unit).y
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
            scr_occupy()
            speed=0}
        if warwork=1 && distance_to_object(instance_nearest(x,y,enemy_unit))>=comp*(1-0.36*abs(sin(degtorad(direction)))) //se non ci sono più nemici vicini fermati
            {action=0
            warwork=0
            scr_occupy()
            speed=0}}
    if distance_to_object(instance_nearest(x,y,enemy_unit))<comp*(1-0.36*abs(sin(degtorad(direction)))) //se ci sono nemici vicini si muove verso quello più vicino, cambiando bersaglio in base al più vicino
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
if action=2
direction=point_direction(x,y,targetx,targety)

// --- azione 2: execute code ---
///Movimento con flow field
if action=1
    {if point_distance(x,y,dirox,diroy)>comp || place_free(x,y)=false //se è distante usa flow field, place free chi cazzo si ricorda perché l'avevo messo lì, forse per evitare che vada in pappa con altri pupazzi?
        {if instance_place(x,y,ally_unit)!=noone // se c'è una collisione con un'altra unità amica
            {otro= instance_place(x,y,ally_unit)
            if otro.ordo<self.ordo || otro.action!=1 //se l'altro ha rank più alto e si sta muovendo tu fermati
                scr_move_flow_field()
            else
                {step=0
                alarm[0]++}}
        else
        scr_move_flow_field()}//in caso contrario cammina
    else //movimento con step towards quando è molto vicino
        {if firework=0 && (warwork=0 || warwork=4) 
        mp_potential_step(dirox,diroy,autospeed,false)
        if firework=1
        mp_potential_step(targetid.x,targetid.y,autospeed,false)
        if warwork=1 && target_eu!=noone
        mp_potential_step(targetx,targety,autospeed,false)
        if warwork=1 && target_eu=noone
        mp_potential_step(instance_nearest(x,y,enemy_unit).x,instance_nearest(x,y,enemy_unit).y,autospeed,false)
        }}
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

// --- azione 3: execute code ---

