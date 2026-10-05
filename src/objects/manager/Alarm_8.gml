// manager — Alarm_8 (eventtype=2 enumb=8)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///gestione tempo
if instance_number(gameover_manager)<1
global.seconds+=1
if global.seconds>=60
    {global.seconds=0
    global.minutes+=1}
if global.minutes>=60
    {global.minutes=0
    global.hours+=1}
    alarm[8]=60
