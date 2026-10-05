// fog_controller — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/fog_controller.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
instance_create(x,y+200,fog01)
instance_create(x+400,y+200,fog01)
instance_create(x+800,y+200,fog01)
instance_create(x,y+100,fog01)
instance_create(x+400,y+100,fog01)
instance_create(x+800,y+100,fog01)
instance_create(x,y,fog01)
instance_create(x+400,y,fog01)
instance_create(x+800,y,fog01)
instance_create(x+1200,y+100,fog01)
instance_create(x-400,y+100,fog01)
instance_create(x+400,y-100,fog01)
instance_create(x+400,y+300,fog01)
alarm[0]=2000
