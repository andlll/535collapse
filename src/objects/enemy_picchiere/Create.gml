// enemy_picchiere — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/enemy_picchiere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///punteggi vita
life=60
slife=60

// --- azione 2: execute code ---
///variabili iniziali
action=0
idling=1
step=0
phase=1
hov=0
hover=0
warwork=0
dc=0
autospeed=0
defender=0
firework=0
targetid=noone
if room=lvl01
global.dialogoenemy1=0
else
global.dialogoenemy1=2
rank=3
global.order++
ordo=global.order*rank
