// enemy_torre — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/enemy_torre.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
life=330
slife=330
depth=-y
alarm[0]=30
alarm[1]=70
arm=0
hit=0
visible=false

// --- azione 2: execute code ---
instance_create(x,y-170,flag_b)
