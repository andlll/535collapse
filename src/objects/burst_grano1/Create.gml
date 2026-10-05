// burst_grano1 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/burst_grano1.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
// Creazione del sistema particellare
grass_system = part_system_create();
sprite_index=null
part_system_depth(grass_system, -1); // Sta sopra al terreno
wind = sin(current_time * 0.0002) * 5;
// Creazione della particella "erba"
grass_particle = part_type_create();
part_type_sprite(grass_particle,part_crop,0,0,0)
part_type_size(grass_particle, 0.4, 0.7, 0, 0); // Altezza variabile
part_type_alpha2(grass_particle, 0.3, 0.7); // Leggera dissolvenza
part_type_orientation(grass_particle, -15, 15, 0, 4,0); // Leggera inclinazione
part_type_speed(grass_particle, 0, 0, 0, 0); // Fermo
part_type_life(grass_particle, 99999999, 99999999); // Vita lunghissima

// Creazione dell’emitter
grass_emitter = part_emitter_create(grass_system);

// Creazione dell'erba solo una volta all'inizio
part_emitter_region(grass_system, grass_emitter, x-500, x+500, y-300, y+300, ps_shape_ellipse, ps_distr_gaussian);
part_emitter_burst(grass_system, grass_emitter, grass_particle, 2500); 
