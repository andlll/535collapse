// manager — KeyPress_M (eventtype=9 enumb=77)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visib minimappa
{if global.minim=0
        {global.minim=1
        exit}
else
    global.minim=0}

// --- azione 2: execute code ---
///Debug rank
var leader=scr_get_highest_rank()
instance_create(leader.x,leader.y,legno_prizedrawer)
