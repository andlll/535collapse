// o_box2 — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/o_box2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///visibile
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
    part_emitter_region(fire_ps, fire_emitter, x-35, x+35, y-30, y-35, ps_shape_rectangle, ps_distr_gaussian);
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
part_type_life(fire_part, (40-life)/2, (50-life)/2);

// --- azione 2: execute code ---
///morte
if life<=0
    {var premio=irandom_range(1,3)
    var amount=irandom_range(3,8)
    if premio=1
        {global.gold+=75*amount
        instance_create(x,y,oro_prizedrawer)}
    if premio=2
        {global.wood+=50*amount
        instance_create(x,y,legno_prizedrawer)}
    if premio=3
        {global.food+=50*amount
        instance_create(x,y,cibo_prizedrawer)}
    part_system_destroy(fire_ps)
    part_system_destroy(fire_psf)
    instance_destroy()
    /// Aggiornamento griglia pathfinding

// Trova i limiti della maschera di collisione
var left = bbox_left;
var right = bbox_right;
var top = bbox_top;
var bottom = bbox_bottom;

// Converte in coordinate di griglia forzando valori interi
var gx_start = floor(left / global.grid_size);
var gy_start = floor(top / global.grid_size);
var gx_end = floor(right / global.grid_size);
var gy_end = floor(bottom / global.grid_size);

// Scansiona cella per cella verificando la collisione
for (var gx = gx_start; gx <= gx_end; gx++) {
    for (var gy = gy_start; gy <= gy_end; gy++) {
        // Trova il centro della cella in pixel
        var cell_x = gx * global.grid_size + global.grid_size / 2;
        var cell_y = gy * global.grid_size + global.grid_size / 2;

        // Controlla se c'è un'istanza *diversa da sé stesso* in questa cella
        if (collision_rectangle(cell_x - global.grid_size / 2, cell_y - global.grid_size / 2,
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) {
            ds_grid_set(global.cost_field, gx, gy, 1); // Imposta la cella come libera
        }
    }
}}

// --- azione 3: execute code ---
///dialogo livello 1
if global.dialogochest=0 && distance_to_object(instance_nearest(x,y,ally_warrior))<200 && instance_number(parent_dialogo)<1
    {instance_create(x,y,dialogo_1_3)
    global.dialogochest=1}
