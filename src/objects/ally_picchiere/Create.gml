// ally_picchiere — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/ally_picchiere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Variabili iniziali
action=0
idling=1
step=0
phase=1
hov=0
hit=0
hover=0
dc=0
autospeed=0
warwork=0
comp=700
global.pop+=2
xprev=x
yprev=y
targetid=noone
target_eu=noone
firework=0
assi=0
var rank=2
global.order++
ordo=global.order*rank
pass=1
direction=0
dirox=x
diroy=y
life=60
slife=60
xprev=x
yprev=y

// --- azione 2: execute code ---
///Creazione flow field
flow_field = ds_grid_create(room_width div 32, room_height div 32);
scr_find_free_spawn_right();
//Inizializzazione flow field per evitare che vada in minchia tutto
var default_goal_x = x;
var default_goal_y = y; 

scr_generate_goal_field(default_goal_x, default_goal_y);
scr_generate_flow_field();
dirox = default_goal_x;
diroy = default_goal_y;

scr_occupy()
