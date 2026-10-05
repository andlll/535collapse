// enemy_house — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/enemy_house.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
life=120
slife=120
depth=-y
alarm[0]=30
alarm[1]=70
onfire=0
firestarted=0
var ind=irandom_range(1,6)
if ind=1
sprite_index=c1b
if ind=2
sprite_index=c2b
if ind=4
sprite_index=c4b
if ind=5
sprite_index=c5b
if ind=6
sprite_index=c6b
hit=0
visible=false
