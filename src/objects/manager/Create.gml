// manager — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni iniziali
if os_type=os_android || os_type=os_ios
room_goto(mobile)
randomize()
sprite_index=null
show_debug_overlay(true)
//resize per finestra
bi1=browser_width
bi2=browser_height
surface_resize(application_surface,bi1-5,bi2-5)
window_set_size(bi1-5,bi2-5)
view_wview[0]=bi1-5
view_wport[0]=bi1-5
view_hview[0]=bi2-5
view_hport[0]=bi2-5
alarm[2]=100 //alarm per resizer
global.multi=0 //selezione multipla trascinando il mouse//
global.scaleview=1
//risorse
global.food=10000
global.gold=5000
global.wood=5000
global.pop=0 //popolazione//
global.popcap=990 //limite popolazione, definito da case e centri//
global.stone=0
global.frame=0
global.idle=0 //numero di civili che cazzeggiano//
global.sele=0 //verifica se ci sia ctrl o alt premuti//
global.sel=0 //numero di selezionati//
global.milsel=0 //numero di selezionati non civili//
global.grid=mp_grid_create(0,0,218,94,32,32)
global.enemyhover=0 //per avere il cursore rosso
global.teardrop=1
global.hint=1
fogalpha=1
global.debugging=0
global.debug_code=0
global.goldhint=0
global.woodhint=0
global.foodhint=0
global.stonehint=0
global.presidiohint=0
global.casahint=0
global.multihint=0
global.nighthint=0
global.gameover=0
global.firehint=0
global.minimaphint=0
global.resourcetreehint=0
global.multi2hint=0
global.selecthint=0
global.createhint=0
global.create2hint=0
global.buildinghint=0
global.attackhint=0
global.resourcehint=0
global.attackhint=0
global.fogville=1
global.obj=1
global.bloc1=0
global.bloc2=0
global.bloc3=0
global.base1b=7
global.base2b=4
global.base3b=7
global.base1d=0
global.base2d=0
global.base3d=0
global.visia=0
global.basidistrutte=0
global.arcsel=0
global.siegsel=0
global.firesel=0
global.victory=0
global.order=1000
instance_create(0,0,mouser)
instance_create(0,0,rectangle_manager)
instance_create(0,0,idle_clicker)
fog=noone
blackfog=noone
nite=noone
global.night=0
alarm[0]=6000 //timer notte
alarm[3]=100 //timer aquila
if part_system_exists(rain)
    {part_system_clear(rain)
    part_system_destroy(rain)}
alarm[4]=irandom_range(12000,15000)
alarm[9]=10
alarm[8]=60
global.sz=30
global.minim=1
minim_hover=0
minim_viewhover=0
minim_plushover=0
minim_minushover=0
minim_viewhover_bis=0
global.raining=0

//Livelli
if room==menu
    {instance_create(0,0,enemy_manager_menu)
    global.hint=3}
if room==match
    {instance_create(0,0,enemy_manager)
    instance_create(0,0,objective_button)
    global.waves=0
    global.seconds=0
    global.minutes=0
    global.hours=0}
if room=lvl01
    {global.night=1
    global.lvl01_gate=0
    alarm[1]=100000
    with(ally_militare)
    comp=50
    }
if room=lvl02
    {global.night=1
    global.lvl01_gate=0
    alarm[1]=1
    instance_create(0,0,enemy_manager_lv2)
    }
    
//proviamo sta cazzo di griglia
global.griglia=mp_grid_create(0,0,room_width/10,room_height/10,10,10)

//blocchi solidi come bordo mappa
alarm[10]=160

// --- azione 2: execute code ---
///inizializzazione flow field
global.grid_size = 32;
global.grid_width = room_width div global.grid_size;
global.grid_height = room_height div global.grid_size;

// Creazione della ds_grid
global.cost_field = ds_grid_create(global.grid_width, global.grid_height);

// Inizializza la griglia solo una volta
for (x = 0; x < global.grid_width; x++) {
    for (y = 0; y < global.grid_height; y++) {
        var px = x * global.grid_size;
        var py = y * global.grid_size;
        
        // Controlla solo una volta se la cella è occupata
        if (collision_rectangle(px, py, px + global.grid_size, py + global.grid_size, ally, true, true))||(collision_rectangle(px, py, px + global.grid_size, py + global.grid_size, enemy, true, true))||(collision_rectangle(px, py, px + global.grid_size, py + global.grid_size, natural_parent, true, true))||(collision_rectangle(px, py, px + global.grid_size, py + global.grid_size, palo_1, true, true)) {
            ds_grid_set(global.cost_field, x, y, 1000);
        } else {
            ds_grid_set(global.cost_field, x, y, 1);}}} // Costo base
            
global.goal_field = ds_grid_create(room_width div 32, room_height div 32);
global.cost_field = ds_grid_create(room_width div 32, room_height div 32);

//Inseriamo gli ostacoli per gli edifici alleati
with(ally_build)
{// Trova i limiti della maschera di collisione
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
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) {if (gx >= 0 && gx < ds_grid_width(global.cost_field) &&
                                      gy >= 0 && gy < ds_grid_height(global.cost_field))
            ds_grid_set(global.cost_field, gx, gy, 1000); // Imposta la cella come ostacolo
        }
    }
}}

//Inseriamo gli ostacoli per gli edifici nemici
with(enemy_build)
{// Trova i limiti della maschera di collisione
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
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) 
                                    {if (gx >= 0 && gx < ds_grid_width(global.cost_field) &&
                                      gy >= 0 && gy < ds_grid_height(global.cost_field))
                                    ds_grid_set(global.cost_field, gx, gy, 1000); // Imposta la cella come ostacolo
        }
    }
}}

//Inseriamo gli ostacoli per gli elementi naturali
with(natural_parent)
{// Trova i limiti della maschera di collisione
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
                                cell_x + global.grid_size / 2, cell_y + global.grid_size / 2, id, true, false)) {if (gx >= 0 && gx < ds_grid_width(global.cost_field) &&
                                      gy >= 0 && gy < ds_grid_height(global.cost_field))
            ds_grid_set(global.cost_field, gx, gy, 1000); // Imposta la cella come ostacolo
        }
    }
}}

// --- azione 3: execute code ---
///conteggio fps
fps_counter = 0;
fps_time = current_time; // Memorizza il tempo attuale

// --- azione 4: execute code ---
///Creazione sistema particellare semi

if (!variable_global_exists("ptc_system")) { 
    global.ptc_system = part_system_create();
    global.ptc_semi = part_type_create();

    part_type_shape(global.ptc_semi, pt_shape_pixel); 
    part_type_size(global.ptc_semi, 1, 1.5, 0, 0);
    part_type_color1(global.ptc_semi, make_color_rgb(222, 184, 135))
    part_type_alpha3(global.ptc_semi, 1, 0.8, 0); 
    part_type_speed(global.ptc_semi, 3, 5, -0.1, 0.2); 
    part_type_gravity(global.ptc_semi, 0.2, 270); 
    part_type_life(global.ptc_semi, 15, 25);}
