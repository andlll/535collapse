// campo_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/campo_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if life>=slife
    {instance_create(x,y,campo)
    instance_destroy()
    part_system_destroy(grass_system)}
part_emitter_stream(grass_system, grass_emitter, grass_particle, life/6); 
