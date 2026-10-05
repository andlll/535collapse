// object183 — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/object183.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
alarm[0]=30
if onfire=1
    {
    var fuocod=depth
    if life<slife/2
    var fuoco=instance_create(x,y-20,flameqq)
    else
    var fuoco=instance_create(x,y-20,flameqq_small)
    with (fuoco)
        {depth=fuocod-1
        }
    }
