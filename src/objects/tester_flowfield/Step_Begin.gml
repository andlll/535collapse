// tester_flowfield — Step_Begin (eventtype=3 enumb=1)
// Estratto da gmx/objects/tester_flowfield.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Movimento con flow field
if action=1
    {if point_distance(x,y,dirox,diroy)>50
    scr_move_flow_field()
    else
    mp_potential_step(dirox,diroy,autospeed,false)}
depth=-y  
if action=1 && x=dirox && y=diroy
action=0
