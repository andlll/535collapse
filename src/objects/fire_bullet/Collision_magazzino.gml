// fire_bullet — Collision_magazzino (eventtype=4 ename=magazzino)
// Estratto da gmx/objects/fire_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: other -> with) ---
with (other) {
    ///Effetti su bersaglio
    onfire=1
    life-=5
}

// --- azione 2: execute code ---
///fiammata
    fire_psf = part_system_create();
    fire_part = part_type_create();
    part_system_depth(fire_psf,-y-1);
    
    // Imposta le proprietà delle particelle di fuoco
    part_type_shape(fire_part, pt_shape_flare);
    part_type_size(fire_part, 0.2, 0.5, 0, 0);
    part_type_color2(fire_part, c_red, c_orange);
    part_type_alpha2(fire_part, 1, 0);
    part_type_speed(fire_part, 1, 2, 0, 0);
    part_type_direction(fire_part, 0, 355, 0, 20);
    part_type_life(fire_part, 10, 30);
    part_type_blend(fire_part, true);
    
    // Assegna il sistema particellare a un oggetto
    fire_emitter = part_emitter_create(fire_psf);
    part_emitter_region(fire_psf, fire_emitter, x-5, x+5, y+5, y+5, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_burst(fire_psf, fire_emitter, fire_part, 300);

// --- azione 3: execute code ---
///Autodistruzione
instance_destroy()
