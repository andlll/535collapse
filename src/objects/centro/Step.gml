// centro — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/centro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///attacco
if arm=1
if distance_to_object(instance_nearest(x,y,enemy_unit))<600
    {arm=0
    alarm[1]=35
    if instance_nearest(x,y,enemy_unit).x>x
        {instance_create(x+50,y-140,arciere_bullet_t)}
    else
        {instance_create(x,y-140,arciere_bullet_t)}
        }

// --- azione 2: execute code ---
///gameover
if !position_empty(placex,placey)
    {placex+=irandom_range(-2,2)
    placey+=irandom_range(-2,2)}
if life<=0
    {global.popcap-=5
    global.gameover=1
    with(instance_nearest(x,y-100,flag_r))
        {instance_destroy()
        }
    instance_create(x,y,ccruin)
    instance_create(0,0,gameover_manager)
    instance_destroy()}
if selected=1
    if instance_number(omino_clicker)<1
        {instance_create(0,0,omino_clicker)
        instance_create(0,0,centro_indietro_clicker)}
if selected=0
    {with (omino_clicker)
        instance_destroy()
    with (centro_indietro_clicker)
        instance_destroy()}

// --- azione 3: execute code ---
///fine riparazione
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

// --- azione 4: execute code ---
///andare a fuoco
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
    part_emitter_region(fire_ps, fire_emitter, x-65, x+65, y-100, y-95, ps_shape_rectangle, ps_distr_gaussian);
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
    part_emitter_region(fire_psf, fire_emitter, x-65, x+65, y+70, y+75, ps_shape_rectangle, ps_distr_gaussian);
    part_emitter_stream(fire_psf, fire_emitter, fire_part, 4*visible);
    firestarted=1}
if onfire=1 && firestarted=1
part_type_life(fire_part, (430-life)/2, (460-life)/2);
