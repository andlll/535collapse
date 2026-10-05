// manager — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///gestione risorse, pulsanti
global.frame++
//gestione risorse//
if global.food>9999
global.food=9999
if global.wood>9999
global.wood=9999
if global.gold>9999
global.gold=9999
if global.popcap>99
global.popcap=99
//posizionamento dell'oggetto per calcolo delle varie distanze//
x=view_xview[0]+view_wview[0]/2
y=view_yview[0]+view_hview[0]/2
//pulsanti di costruzione//
if global.sel>0
if global.milsel<=0
    {if instance_number(torre_clicker)=0
    instance_create(x,y,torre_clicker)
    if instance_number(magazzino_clicker)=0
    instance_create(x,y,magazzino_clicker)
    if instance_number(barn_clicker)=0
    instance_create(x,y,barn_clicker)
    if instance_number(campo_clicker)=0
    instance_create(x,y,campo_clicker)
    if instance_number(casa_clicker)=0
    instance_create(x,y,casa_clicker)
    if instance_number(caserma_clicker)=0
    instance_create(x,y,caserma_clicker)
    if instance_number(stalla_clicker)=0
    instance_create(x,y,stalla_clicker)
    if instance_number(castello_clicker)=0
    instance_create(x,y,castello_clicker)
    if instance_number(chiesa_clicker)=0
    instance_create(x,y,chiesa_clicker)
    if instance_number(mura_clicker)=0
    instance_create(x,y,mura_clicker)
    }
//impostazioni menu
if fogalpha>0
fogalpha-=0.02
if fogville=0
with(enemy)
visible=true
//blocchi di nemici - livello tutorial
if room==match && instance_exists(ally_unit)
    {if global.bloc1=0
    if point_distance(5493,5955,instance_nearest(5493,5955,ally_unit).x,instance_nearest(5493,5955,ally_unit).y)<500
       {with instance_create(5656,6000,enemy_cavaliere)
       defender=1
        with instance_create(5708,6086,enemy_cavaliere)
        defender=1
        with instance_create(5828,5971,enemy_cavaliere)
        defender=1
        with instance_create(5855,6069,enemy_cavaliere)
        defender=1
        with instance_create(5983,5939,enemy_cavaliere)
        defender=1
        with instance_create(6018,6061,enemy_cavaliere)
        defender=1
        with instance_create(6149,6053,enemy_cavaliere)
        defender=1
        with instance_create(6143,5941,enemy_cavaliere)
        defender=1
        with instance_create(6269,5914,enemy_cavaliere)
        defender=1
        with instance_create(6278,6031,enemy_cavaliere)
        defender=1
        with instance_create(6425,5909,enemy_cavaliere)
        defender=1
        with instance_create(5937,6214,enemy_arciere)
        defender=1
        with instance_create(6098,6191,enemy_arciere)
        defender=1
        global.bloc1=1}
    if global.bloc2=0
    if point_distance(576,4616,instance_nearest(576,4616,ally_unit).x,instance_nearest(576,4616,ally_unit).y)<500
        {with instance_create(562,4794,enemy_picchiere)
        defender=1
        with instance_create(697,4764,enemy_picchiere)
        defender=1
        with instance_create(867,4727,enemy_picchiere)
        defender=1
        with instance_create(485,4998,enemy_arciere)
        defender=1
        with instance_create(412,5068,enemy_arciere)
        defender=1
        with instance_create(505,5154,enemy_arciere)
        defender=1
        with instance_create(641,5129,enemy_arciere)
        defender=1
        with instance_create(636,4991,enemy_arciere)
        defender=1
        with instance_create(729,5027,enemy_arciere)
        defender=1
        with instance_create(818,4978,enemy_arciere)
        defender=1
        with instance_create(886,5009,enemy_arciere)
        defender=1
        global.bloc2=1}
    if global.bloc3=0
    if point_distance(5255,1712,instance_nearest(5255,1712,ally_unit).x,instance_nearest(5255,1712,ally_unit).y)<500
        {with instance_create(5602,1923,enemy_warrior)
        defender=1
        with instance_create(5684,1872,enemy_warrior)
        defender=1
        with instance_create(5745,1817,enemy_warrior)
        defender=1
        with instance_create(5627,1997,enemy_warrior)
        defender=1
        with instance_create(5723,1966,enemy_warrior)
        defender=1
        with instance_create(5786,1913,enemy_warrior)
        defender=1
        with instance_create(5665,2072,enemy_picchiere)
        defender=1
        with instance_create(5770,2041,enemy_picchiere)
        defender=1
        with instance_create(5868,2003,enemy_picchiere)
        defender=1
        with instance_create(6058,1991,enemy_arciere)
        defender=1
        with instance_create(6002,2097,enemy_arciere)
        defender=1
        with instance_create(5903,2164,enemy_arciere)
        defender=1
        with instance_create(5788,2198,enemy_arciere)
        defender=1
        with instance_create(5194,2428,enemy_warrior)
        defender=1
        with instance_create(5139,2373,enemy_warrior)
        defender=1
        with instance_create(5266,2463,enemy_warrior)
        defender=1
        with instance_create(5359,2498,enemy_warrior)
        defender=1
        with instance_create(5366,2414,enemy_picchiere)
        defender=1
        with instance_create(5226,2348,enemy_picchiere)
        defender=1
        global.bloc3=1}
//livello tutorial
    //basi distrutte
   if global.base1d=0 && global.base1b<1
        {global.base1d=1
        global.basidistrutte++}
    if global.base2d=0 && global.base2b<1
        {global.base2d=1
        global.basidistrutte++}
    if global.base3d=0 && global.base3b<1
        {global.base3d=1
        global.basidistrutte++}
    //vittoria per tutorial
    if global.victory=0 && global.basidistrutte=3 && room=match
        {global.victory=1
        instance_create(0,0,victory_manager)}}

// --- azione 2: execute code ---
///gestione fps
var new_time = current_time;  
var my_delta_time = new_time - last_time;  

if (my_delta_time > 0) {
    fps_counter = 1000 / my_delta_time; // Calcola gli FPS (ms/frame)
}

last_time = new_time; // Aggiorna il tempo per il prossimo frame

// --- azione 3: execute code ---
///controller livello 1
if room=lvl01 && instance_exists(ally_unit)
    {if global.lvl01_gate=0
        {var vicinissimo=instance_nearest(4550,4150,ally_unit)
        if point_distance(4550,4150,vicinissimo.x,vicinissimo.y)<200
            {global.lvl01_gate=1
            global.gold+=250
            instance_create(vicinissimo.x,vicinissimo.y,oro_prizedrawer)
            instance_create(vicinissimo.x,vicinissimo.y,dialogo_1_5)
            instance_create(3161,4909,caserma)
            instance_create(3555,4659,caserma)
            instance_create(4061,4763,casa)
            instance_create(3659,4901,casa)
            instance_create(3849,4952,casa)
            instance_create(3888,4819,casa)
            instance_create(4054,4895,casa)}}
    if global.lvl01_gate=1
        {var vicinissimo=instance_nearest(593,552,ally_unit)
        if point_distance(593,552,vicinissimo.x,vicinissimo.y)<200
            {global.lvl01_gate=2
            global.gold+=250
            instance_create(vicinissimo.x,vicinissimo.y,oro_prizedrawer)
            instance_create(vicinissimo.x,vicinissimo.y,dialogo_1_6)
            instance_create(283,188,stalla)
            instance_create(749,280,stalla)
            }
        exit}
    if global.lvl01_gate=2
        {var vicinissimo=instance_nearest(4836,331,ally_unit)
        if point_distance(4836,331,vicinissimo.x,vicinissimo.y)<800
            {global.lvl01_gate=3
            instance_create(vicinissimo.x,vicinissimo.y,dialogo_1_7)
            }
        exit}
    if global.lvl01_gate=3 
        {var vicinissimo=instance_nearest(4836,331,ally_unit)
        if point_distance(4836,331,vicinissimo.x,vicinissimo.y)<200
            {global.lvl01_gate=4
            instance_create(vicinissimo.x,vicinissimo.y,dialogo_1_8)
            }
        exit}}

// --- azione 4: execute code ---
///Gestione hover pulsanti minimappa
if global.minim=1
    {if mouse_x>view_xview[0]+20*global.scaleview && mouse_x<20*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_y>view_yview[0]+view_hview[0]-20*global.scaleview-(room_height/global.sz)*global.scaleview && mouse_y<view_yview[0]+view_hview[0]-20*global.scaleview
    minim_hover=1
    else
    minim_hover=0
    if mouse_x>35*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_x<65*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_y>view_yview[0]+view_hview[0]-20*global.scaleview-(room_height/global.sz)*global.scaleview && mouse_y<view_yview[0]+view_hview[0]+10*global.scaleview-(room_height/global.sz)*global.scaleview
    minim_viewhover=1
    else
    minim_viewhover=0
    if mouse_x>35*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_x<65*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_y>view_yview[0]+view_hview[0]+20*global.scaleview-(room_height/global.sz)*global.scaleview && mouse_y<view_yview[0]+view_hview[0]+50*global.scaleview-(room_height/global.sz)*global.scaleview
    minim_plushover=1
    else
    minim_plushover=0
    if mouse_x>35*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_x<65*global.scaleview+view_xview[0]+(room_width/global.sz)*global.scaleview && mouse_y>view_yview[0]+view_hview[0]+60*global.scaleview-(room_height/global.sz)*global.scaleview && mouse_y<view_yview[0]+view_hview[0]+90*global.scaleview-(room_height/global.sz)*global.scaleview
    minim_minushover=1
    else
    minim_minushover=0}
else
    {if mouse_x>5*global.scaleview+view_xview[0] && mouse_x<35*global.scaleview+view_xview[0] && mouse_y>view_yview[0]+view_hview[0]-35*global.scaleview && mouse_y<view_yview[0]+view_hview[0]-5*global.scaleview
    minim_viewhover_bis=1
    else
    minim_viewhover_bis=0}
