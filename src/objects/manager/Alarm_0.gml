// manager — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///passaggio giorno-notte
if global.night<1
    {global.night+=0.005
    alarm[0]=1}
else
    {alarm[1]=2000
    if global.nighthint=0
        {instance_create(mouse_x,mouse_y,hint_night)
        global.nighthint=1}}
