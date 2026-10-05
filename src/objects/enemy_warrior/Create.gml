// enemy_warrior — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/enemy_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///variabili iniziali
scr_find_free_spawn_enemy()
action=0
idling=1
step=0
phase=1
hov=0
hover=0
warwork=0
dc=0
autospeed=0
firework=0
defender=0
targetid=noone
global.dialogoenemy1=0
rank=3
global.order++
ordo=global.order*rank

// --- azione 2: execute code ---
///Vita
life=75
slife=75

// --- azione 3: execute code ---
///azioni iniziali
if room=menu
if distance_to_object(instance_nearest(x,y,ally))>800
    {action=1
    dirox=instance_nearest(x,y,centro).x
    diroy=instance_nearest(x,y,centro).y
    alarm[0]=15}
