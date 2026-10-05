// firestarter — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/firestarter.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
// Crea un sistema di particelle
depth=-y-200
visible=0
fire_ps = part_system_create();
fire_part = part_type_create();
part_system_depth(fire_ps, -y-70); 

// Imposta le proprietà delle particelle di fuoco
part_type_shape(fire_part, pt_shape_flare);
part_type_size(fire_part, 0.2, 0.5, 0, 0);
part_type_color3(fire_part, make_color_rgb(200, 50, 0), make_color_rgb(255, 100, 0), make_color_rgb(255, 180, 0));
part_type_alpha2(fire_part, 0.7, 0);
part_type_speed(fire_part, 1, 2, 0, 0);
part_type_direction(fire_part, 45, 135, 0, 20);
part_type_life(fire_part, 20, 60);
part_type_blend(fire_part, true);

// Assegna il sistema particellare a un oggetto
fire_emitter = part_emitter_create(fire_ps);
part_emitter_region(fire_ps, fire_emitter, x-20, x+20, y, y+10, ps_shape_rectangle, ps_distr_gaussian);
part_emitter_stream(fire_ps, fire_emitter, fire_part, 2);
