// manager — Alarm_1 (eventtype=2 enumb=1)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///passaggio notte-giorno
if global.night>=0   
     {global.night-=0.005
    alarm[1]=1}
else
    alarm[0]=4000
