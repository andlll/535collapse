// manager — Alarm_10 (eventtype=2 enumb=10)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creazione bordi solidi
for (var i=0; i<room_width/50+1; i+=1)
    {instance_create(i*50,0,solid_obj)
    instance_create(i*50,room_height+100,solid_obj)}
for (var u=0; u<room_height/50+1; u+=1)
    {instance_create(-50,u*50,solid_obj)
    instance_create(room_width,u*50,solid_obj)}
