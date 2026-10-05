// ally_omino — Alarm_10 (eventtype=2 enumb=10)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///movimento
    if stonework=2 
    stonework=0
    if goldwork=2 
    goldwork=0
    if woodwork=2
    woodwork=0
    if foodwork=2
    foodwork=0
    if buildwork=2 
    buildwork=0
    dirox=flaggox
    diroy=flaggoy
    if position_meeting(dirox,diroy,miniera_oro)=false
    goldwork=0
    else
    goldwork=1
    if position_meeting(dirox,diroy,albero)=false
    woodwork=0
    else
    woodwork=1
    if position_meeting(dirox,diroy,campo)=false
    foodwork=0
    else
    foodwork=1
    if position_meeting(dirox,diroy,stone_parent)=false
    stonework=0
    else
    stonework=1
    if position_meeting(dirox,diroy,ally_fondamenta)=false
    buildwork=0
    else
    buildwork=1
    if position_meeting(dirox,diroy,campo_fond)=false
    fieldwork=0
    else
    fieldwork=1  
    if action=0
    global.idle-=1
    if action!=0 && alarm[0]<1
    alarm[0]=13
    if action=0
    alarm[0]=13
    alarm[8]=1200
    action=1
    if woodwork=1
        {woodx=dirox
        woody=diroy}
    else
    woodwork=0
    if goldwork=1
        {goldx=dirox
        goldy=diroy}
    else
    goldwork=0
    if foodwork=1
        {
        dirox=campox
        diroy=campoy
        foodx=campox
        foody=campoy}
    else
    foodwork=0
    if stonework=1
        {
        stonex=dirox
        stoney=diroy}
    else
    stonework=0
    if buildwork=1 || fieldwork=1
        {
        buildx=dirox
        buildy=diroy}
    else
    buildwork=0

// --- azione 2: execute code ---
///Movimento con la flow field
    var result_list = ds_list_create();
    scr_free()
    if (scr_find_valid_cell_backwards(floor(flaggox div 32), floor(flaggoy div 32), floor(x div 32),floor (y div 32), result_list))   
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
