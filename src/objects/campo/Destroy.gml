// campo — Destroy (eventtype=1 enumb=0)
// Estratto da gmx/objects/campo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Distruggi burst e hover
global.farmhover=0
part_system_destroy(grass_system)
part_system_destroy(grass_system_black)
part_system_destroy(fire_ps)
