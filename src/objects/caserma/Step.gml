// caserma — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/caserma.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///crepare+pulsanti di costruzione+fine riparazione
//crepare
if life<=0
    {instance_create(x,y,casruin)
    if firestarted=1
        {part_system_destroy(fire_ps)
        part_system_destroy(fire_psf)}
    instance_destroy()}
//pulsanti di selezione
if selected=1
if instance_number(warrior_clicker)=0
{
instance_create(0,0,warrior_clicker)
instance_create(0,0,picchiere_clicker)
instance_create(0,0,arciere_clicker)
instance_create(0,0,caserma_indietro_clicker)
}
//fine riparazione
if life>=slife
var xpos=x
var ypos=y
with (ally_omino)
    {if action=7
    if point_distance(repx,repy,xpos,ypos)<150
        {action=0
        repairwork=0
        global.idle+=1
        repx=noone
        repy=noone}}
//sfx fuoco
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
    part_emitter_region(fire_ps, fire_emitter, x-75, x+75, y-90, y-85, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_stream(fire_ps, fire_emitter, fire_part, 8*visible)
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
    part_emitter_region(fire_psf, fire_emitter, x-55, x+55, y+70, y+75, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_stream(fire_psf, fire_emitter, fire_part, 4*visible);
    firestarted=1}
if onfire=1 && firestarted=1
part_type_life(fire_part, (380-life)/2, (400-life)/2);
