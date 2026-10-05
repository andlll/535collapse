// enemy_house — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_house.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///morte
if life<=0
    {if y>5800
    global.base1b--
    if y>1500 && y<2800
    global.base3b--
    instance_create(x,y,casaruin)
    part_system_destroy(fire_ps)
    instance_destroy()}
///hint mandare a fuoco
if point_distance(x,y,mouse_x,mouse_y)<80 && instance_number(parent_hint)<1 && global.milsel>0
if global.firehint=0
    {instance_create(x,y,hint_fire)
    global.firehint=1}

// --- azione 2: execute code ---
///visibile+fuoco
var vici=instance_nearest(x,y,ally_unit)
var vicic=instance_nearest(x,y,ally_build)
var vicicast=instance_nearest(x,y,castello)
var vicitower=instance_nearest(x,y,torre)
if distance_to_object(vici)<150+150*(1-global.night) || distance_to_object(vicic)<200+200*(1-global.night) || hit=1 || distance_to_object(vicicast)<500+500*(1-global.night) || distance_to_object(vicitower)<500+500*(1-global.night) || room==menu|| global.fogville=0
visible=true
if onfire=1 && firestarted=0
    {fire_ps = part_system_create();
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
    part_emitter_region(fire_ps, fire_emitter, x-35, x+35, y-50, y-45, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_stream(fire_ps, fire_emitter, fire_part, 6*visible)
    fire_psf = part_system_create();
    fire_part = part_type_create();
    part_system_depth(fire_psf,-y-1);
    
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
    fire_emitter = part_emitter_create(fire_psf);
    part_emitter_region(fire_psf, fire_emitter, x-35, x+35, y+40, y+45, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_stream(fire_psf, fire_emitter, fire_part, 3*visible);
    firestarted=1}
if onfire=1 && firestarted=1
part_type_life(fire_part, (150-life)/2, (160-life)/2);
