// ally_omino — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Variabili iniziali
life=50
slife=50
scampalife=life
action=0
global.idle+=1
idling=1
idleorder=global.idle
hit=0
path=0
assi=0
step=0
phase=1
hov=0
hover=0
buildx=0
buildy=0
dc=0
woodwork=0
food=0
foodwork=0
autospeed=0
stone=0
buildwork=0
stonework=0
wood=0
buildarm=0
gold=0
goldwork=0
repairwork=0
pass=1
fieldwork=0
global.pop+=1
xprev=x
yprev=y
direction=0
var rank=6
global.order++
ordo=global.order*rank
flaggox=0
flaggoy=0

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
