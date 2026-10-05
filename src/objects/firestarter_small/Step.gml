// firestarter_small — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/firestarter_small.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if x>view_xview[0] && x<view_xview[0]+view_wview[0] && y>view_yview[0] && y<view_yview[0]+view_hview[0] && distance_to_object(instance_nearest(x,y,ally))<600
part_emitter_stream(fire_ps, fire_emitter, fire_part, 3);
else
part_emitter_stream(fire_ps, fire_emitter, fire_part, 0);
