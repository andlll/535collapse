// magazzino — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/magazzino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
/// Aggiornamento griglia pathfinding

// Trova i limiti della maschera di collisione
var left = bbox_left;
var right = bbox_right;
var top = bbox_top;
var bottom = bbox_bottom;

// Converte in coordinate di griglia forzando valori interi
var gx_start = floor(left / global.grid_size);
var gy_start = floor(top / global.grid_size);
var gx_end = floor(right / global.grid_size);
var gy_end = floor(bottom / global.grid_size);

// Scansiona cella per cella verificando la collisione
for (var gx = gx_start; gx <= gx_end; gx++) {
    for (var gy = gy_start; gy <= gy_end; gy++) {
        // Trova il centro della cella in pixel
        var cell_x = gx * global.grid_size + global.grid_size / 2;
        var cell_y = gy * global.grid_size + global.grid_size / 2;

        // Controlla se c'è un'istanza *diversa da sé stesso* in questa cella
        if (collision_rectangle(cell_x - global.grid_size / 2, cell_y - global.grid_size / 2,
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) {
            ds_grid_set(global.cost_field, gx, gy, 1000); // Imposta la cella come ostacolo
        }
    }
}

// --- azione 2: execute code ---
///Istruzioni agli omini che lo hanno costruito
var iddo=id
with (ally_omino)
    {if distance_to_object(iddo)<15
    {
    if instance_number(miniera_oro)>0
    var goldist=distance_to_object(miniera_oro)
    else
    var goldist=999999
    if instance_number(stone_parent)>0
    var stonist=distance_to_object(stone_parent)
    else
    var stonist=999999
    if instance_number (albero)>0
    var woodist=distance_to_object(albero)
    else
    var woodist=999999
    if woodist<stonist && woodist<goldist
        {woodwork=1
        woodx=instance_nearest(x,y,albero).x
        woody=instance_nearest(x,y,albero).y
        dirox=woodx
        diroy=woody
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
    if goldist<stonist && goldist<woodist
        {goldwork=1
        goldx=instance_nearest(x,y,miniera_oro).x
        goldy=instance_nearest(x,y,miniera_oro).y
        dirox=goldx
        diroy=goldy
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
    if stonist<goldist && stonist<woodist
        {stonework=1
        stonex=instance_nearest(x,y,stone_parent).x
        stoney=instance_nearest(x,y,stone_parent).y
        dirox=stonex
        diroy=stoney
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
    action=1
    alarm[0]=13}
    }
onfire=0
firestarted=0

// --- azione 3: execute code ---
///Variabili iniziali
depth=-y
life=140
slife=140
selected=0
alarm[0]=30
fondazione=0
pietra=0
legno=1
hit=0
