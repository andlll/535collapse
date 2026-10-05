// burst_chiazza1 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/burst_chiazza1.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
// Creazione del sistema particellare
grass_system = part_system_create();
sprite_index=null
part_system_depth(grass_system, -1); // Sta sopra al terreno
// Creazione della particella "erba"
grass_particle = part_type_create();
part_type_sprite(grass_particle,part_chiazza3,0,0,0)
part_type_size(grass_particle, 1, 1, 0, 0); // Altezza variabile
part_type_orientation(grass_particle, 0, 355, 0, 0,0); // Leggera inclinazione
part_type_speed(grass_particle, 0, 0, 0, 0); // Fermo
part_type_life(grass_particle, 99999999, 99999999); // Vita lunghissima

// Creazione dell’emitter
grass_emitter = part_emitter_create(grass_system);

// Creazione dell'erba solo una volta all'inizio
part_emitter_region(grass_system, grass_emitter, x-750, x+750, y-400, y+400, ps_shape_ellipse, ps_distr_gaussian);
part_emitter_burst(grass_system, grass_emitter, grass_particle, 1700); 

grass_system2 = part_system_create();
part_system_depth(grass_system2, -1); // Sta sopra al terreno
// Creazione della particella "erba"
grass_particle2 = part_type_create();
part_type_sprite(grass_particle2,part_chiazza2,0,0,0)
part_type_size(grass_particle2, 1, 1, 0, 0); // Altezza variabile
part_type_orientation(grass_particle2, 0, 355, 0, 0,0); // Leggera inclinazione
part_type_speed(grass_particle2, 0, 0, 0, 0); // Fermo
part_type_life(grass_particle2, 99999999, 99999999); // Vita lunghissima

// Creazione dell’emitter
grass_emitter2 = part_emitter_create(grass_system2);

// Creazione dell'erba solo una volta all'inizio
part_emitter_region(grass_system2, grass_emitter2, x-750, x+750, y-400, y+400, ps_shape_ellipse, ps_distr_gaussian);
part_emitter_burst(grass_system2, grass_emitter2, grass_particle2, 1700); 

grass_system3 = part_system_create();
part_system_depth(grass_system3, -1); // Sta sopra al terreno
// Creazione della particella "erba"
grass_particle3 = part_type_create();
part_type_sprite(grass_particle3,part_chiazza1,0,0,0)
part_type_size(grass_particle3, 1, 1, 0, 0); // Altezza variabile
part_type_orientation(grass_particle3, 0, 355, 0, 0,0); // Leggera inclinazione
part_type_speed(grass_particle3, 0, 0, 0, 0); // Fermo
part_type_life(grass_particle3, 99999999, 99999999); // Vita lunghissima

// Creazione dell’emitter
grass_emitter3 = part_emitter_create(grass_system3);

// Creazione dell'erba solo una volta all'inizio
part_emitter_region(grass_system3, grass_emitter3, x-650, x+650, y-350, y+350, ps_shape_ellipse, ps_distr_linear);
part_emitter_burst(grass_system3, grass_emitter3, grass_particle3, 1000); 

part_system_destroy(grass_system);
part_system_destroy(grass_system2);
part_system_destroy(grass_system3);
