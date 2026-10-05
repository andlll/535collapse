// enemy_warrior — Alarm_3 (eventtype=2 enumb=3)
// Estratto da gmx/objects/enemy_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Avanzamento animazione fuoco?
if step=0
    {step=1
    alarm[3]=20
    exit}
if step=1
    {step=2
    alarm[3]=20
    exit}
if step=2
    {step=0
    instance_destroy()
    }
