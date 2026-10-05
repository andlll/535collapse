// campo — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/campo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if life<=0
{
instance_destroy()}
if onfire=1 && firestarted=0
    {
    sprite_index=campo_maggese
    part_system_destroy(grass_system)
    ///burst grano
grass_system_black = part_system_create();
part_system_depth(grass_system_black, -1); // Sta sopra al terreno
wind = 0;
// Creazione della particella "erba"
grass_particle_b = part_type_create();
part_type_color3(grass_particle_b,c_black,c_black,c_gray)
part_type_sprite(grass_particle_b,part_crop,0,0,0)
part_type_size(grass_particle_b, 0.2, 0.35, 0, 0); // Altezza variabile
part_type_alpha2(grass_particle_b, 0.7, 0); // Leggera dissolvenza
part_type_orientation(grass_particle_b, -15, 15, 0, 4,0); // Leggera inclinazione
part_type_speed(grass_particle_b, 0, 0, 0, 0); // Fermo
part_type_life(grass_particle_b, 700, 800); // Vita lunghissima

// Creazione dell’emitter
grass_emitter = part_emitter_create(grass_system_black);

// Creazione dell'erba solo una volta all'inizio
part_emitter_region(grass_system_black, grass_emitter, x-145, x+145, y-90, y+90, ps_shape_diamond, ps_distr_linear);
part_emitter_burst(grass_system_black, grass_emitter, grass_particle_b, 1700); 
    fire_ps = part_system_create();
    fire_part = part_type_create();
    part_system_depth(fire_ps,-y+1);
    
    // Imposta le proprietà delle particelle di fuoco
    part_type_shape(fire_part, pt_shape_flare);
    part_type_size(fire_part, 0.2, 0.5, 0, 0);
    part_type_color3(fire_part, c_red, c_orange, c_yellow);
    part_type_alpha2(fire_part, 1, 0);
    part_type_speed(fire_part, 1, 2, 0, 0);
    part_type_direction(fire_part, 45, 135, 0, 20);
    part_type_life(fire_part, 25, 50);
    part_type_blend(fire_part, true);
    
    // Assegna il sistema particellare a un oggetto
    fire_emitter = part_emitter_create(fire_ps);
    part_emitter_region(fire_ps, fire_emitter, x-35, x+35, y-5, y+5, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_stream(fire_ps, fire_emitter, fire_part, 6*visible)
    firestarted=1}
if onfire=1 && firestarted=1
part_type_life(fire_part, (150-life)/2, (160-life)/2);
