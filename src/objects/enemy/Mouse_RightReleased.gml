// enemy — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/enemy.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///bersaglio di attacco
var drx=x
var dry=y
with (ally_militare)
if selected=1
    {if action!=1
    alarm[0]=15
    action=1
    warwork=1
    dirox=drx
    diroy=dry}
