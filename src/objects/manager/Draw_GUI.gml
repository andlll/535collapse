// manager — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Minimappa e annessi
if room!=menu
if global.minim=1
    {
    if minim_hover=0
    draw_set_alpha(0.19)
    else
    draw_set_alpha(0.69)
    draw_roundrect_colour_ext(20,view_hport[0]-20-room_height/global.sz,20+room_width/global.sz,view_hport[0]-20,80,80,c_white,c_white,false)
    if minim_viewhover=0
    draw_set_alpha(0.19)
    else
    draw_set_alpha(0.69)
    draw_circle_colour(50+room_width/global.sz,view_hport[0]-5-room_height/global.sz,15,c_white,c_white,false)

    if minim_plushover=0
    draw_set_alpha(0.19)
    else
    draw_set_alpha(0.69)
    draw_circle_colour(50+room_width/global.sz,view_hport[0]+35-room_height/global.sz,15,c_white,c_white,false)

    if minim_minushover=0
    draw_set_alpha(0.19)
    else
    draw_set_alpha(0.69)
    draw_circle_colour(50+room_width/global.sz,view_hport[0]+75-room_height/global.sz,15,c_white,c_white,false)
    draw_set_alpha(0.6)
    draw_sprite(ico_view_small,0,50+room_width/global.sz,view_hport[0]-5-room_height/global.sz)
    draw_sprite(ico_plus_small,0,50+room_width/global.sz,view_hport[0]+35-room_height/global.sz)
    draw_sprite(ico_minus_small,0,50+room_width/global.sz,view_hport[0]+75-room_height/global.sz)
    draw_set_alpha(1)
    draw_roundrect_colour_ext(20+view_xview[0]/global.sz,view_hport[0]-20-room_height/global.sz+view_yview[0]/global.sz,20+view_xview[0]/global.sz+view_wview[0]/global.sz,view_hport[0]-20-room_height/global.sz+view_yview[0]/global.sz+view_hport[0]/global.sz,80,80,c_black,c_black,true)
    with(atk_signal)
        draw_sprite_ext(ico_battle,0,20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,0.3/fade,0.3/fade,0,c_white,fade)
    with(ally_unit)
        draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,50/global.sz,c_red,c_maroon,false)
    with(ally_build)
        draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,100/global.sz,c_red,c_maroon,false)
    with(mura_vert)
        draw_line_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz-250/global.sz,c_red,c_red)
    with(porta_vert)
        draw_line_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz-250/global.sz,c_red,c_red)
    with(mura_vert_fond)
        draw_line_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz-250/global.sz,c_red,c_red)
    with(mura_ori)
        draw_line_colour(20+x/global.sz-200/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,20+x/global.sz+200/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,c_red,c_red)
    with(porta_ori)
        draw_line_colour(20+x/global.sz-200/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,20+x/global.sz+200/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,c_red,c_red)
    with(mura_ori_fond)
        draw_line_colour(20+x/global.sz-200/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,20+x/global.sz+200/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,c_red,c_red)
    with(enemy_unit)
        {if visible=true
        draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,50/global.sz,c_aqua,c_blue,false)}
    with(enemy_build)
        {if visible=true
        draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,100/global.sz,c_aqua,c_blue,false)}
    with(albero)
        {if visible=true
        draw_triangle_colour(20+x/global.sz-60/global.sz, view_hport[0]-20-room_height/global.sz+y/global.sz+60/global.sz, 20+x/global.sz+60/global.sz, view_hport[0]-20-room_height/global.sz+y/global.sz+60/global.sz, 20+x/global.sz, view_hport[0]-20-room_height/global.sz+y/global.sz-60/global.sz,c_green, c_green, c_green, false)}
    with(miniera_oro)
            {if visible=true 
            draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,100/global.sz,c_yellow,c_olive,false)}
    with(pietra_grande)
            {if visible=true 
            draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,100/global.sz,c_gray,c_dkgray,false)}
    with(castelloruin)
            {if visible=true 
            draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,100/global.sz,c_gray,c_dkgray,false)}
    with(torreruin)
            {if visible=true 
            draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,75/global.sz,c_gray,c_dkgray,false)}
    with(chiesaruin)
            {if visible=true 
            draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,75/global.sz,c_gray,c_dkgray,false)}
    with(pietr_piccolo)
            {if visible=true 
            draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,75/global.sz,c_gray,c_dkgray,false)}
    with(campo)
        draw_circle_colour(20+x/global.sz,view_hport[0]-20-room_height/global.sz+y/global.sz,100/global.sz,c_red,c_green,false)}
else
    {if minim_viewhover_bis=0
    draw_set_alpha(0.19)
    else
    draw_set_alpha(0.69)
    draw_circle_colour(20,view_hport[0]-20,15,c_white,c_white,false)
    draw_set_alpha(0.6)
    draw_sprite(ico_view_small,0,20,view_hport[0]-20)
    draw_set_alpha(1)}

// --- azione 2: execute code ---
///risorse e cazzi vari
if room!=menu && instance_number(victory_manager)=0
    {
    draw_set_alpha(0.69)
    //quadrato risorse
    draw_roundrect_colour_ext(20,20,230,150,60,60,c_white,c_white,false)
    //quadrato fancazzisti
    draw_roundrect_colour_ext(view_wport[0]-90,100,view_wport[0]-20,200,60,60,c_white,c_white,false)
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_alpha(0.75)
    draw_set_valign(fa_middle)
    draw_set_halign(fa_left)
    //scritte risorse
    draw_text(70,40,global.food)
    draw_text(70,80,global.wood)
    draw_text(70,120,global.gold)
    draw_text(160,40,global.stone)
    draw_text(160,80,global.pop+"/"+global.popcap)
    draw_set_halign(fa_center)
    draw_text(view_wport[0]-55,170,global.idle)
    if global.fps_show>0
        {draw_set_colour(c_red)
        draw_text(view_wport[0]-55,230,"FPS: " + string(fps_counter))}
    draw_set_colour(c_white)
    draw_set_alpha(1)
    //simboli risorse
    draw_sprite_ext(ico_food,0,50,40,0.8,0.8,0,c_white,1)
    draw_sprite_ext(ico_gold,0,50,120,0.8,0.8,0,c_white,1)
    draw_sprite_ext(ico_wood,0,50,80,0.8,0.8,0,c_white,1)
    draw_sprite_ext(ico_stone,0,140,40,0.8,0.8,0,c_white,1)
    draw_sprite_ext(ico_multi,0,140,80,0.4,0.4,0,c_white,1)
    draw_sprite_ext(ico_idle,0,view_wport[0]-55,135,0.7,0.7,0,c_white,1)
    if global.sel>1
        {draw_set_alpha(0.69)
        draw_roundrect_colour_ext(260,20,390,150,60,60,c_white,c_white,false)
        draw_set_font(GUI_1)
        draw_set_colour(c_black)
        draw_set_alpha(0.75)
        draw_set_valign(fa_middle)
        draw_set_halign(fa_center)
        draw_text(325,120," x "+global.sel)
        draw_set_alpha(1)
        draw_sprite(ico_multi,0,325,70)}
    if global.sel>1 //pulsanti di costruzione
    if global.milsel<1
        {
        draw_set_alpha(0.69)
    draw_circle_colour(450,50,30,c_white,c_white,false)
    draw_circle_colour(450,120,30,c_white,c_white,false)
    draw_circle_colour(520,50,30,c_white,c_white,false)
    draw_circle_colour(520,120,30,c_white,c_white,false)
    draw_circle_colour(590,50,30,c_white,c_white,false)
    draw_circle_colour(590,120,30,c_white,c_white,false)
    draw_circle_colour(660,50,30,c_white,c_white,false)
    draw_circle_colour(660,120,30,c_white,c_white,false)
    draw_circle_colour(730,50,30,c_white,c_white,false)
    draw_circle_colour(730,120,30,c_white,c_white,false)
        draw_set_alpha(1)
    draw_sprite_ext(ico_casa,0,450,50,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_torre,0,450,120,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_magazzino,0,520,50,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_barn,0,590,50,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_corn,0,660,50,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_mura,0,520,120,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_caserma,0,590,120,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_stalla,0,660,120,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_castello,0,730,120,0.5,0.5,0,c_white,1)
    draw_sprite_ext(ico_chiesa,0,730,50,0.5,0.5,0,c_white,1)}
    else
        {
        draw_set_alpha(0.69)
        draw_circle_colour(450,50,30,c_white,c_white,false)
        draw_circle_colour(450,120,30,c_white,c_white,false)
        draw_set_alpha(1)
        draw_sprite_ext(ico_attacco,0,450,50,0.5,0.5,0,c_white,1)
        draw_sprite_ext(ico_difesa,0,450,120,0.5,0.5,0,c_white,1)
        with(ally_militare)
            {if selected=1
                    {if comp>=250
                        {draw_circle_colour(450,50,30,make_colour_rgb(183,48,48),make_colour_rgb(183,48,48),false)
                        draw_sprite_ext(ico_attacco_bianco,0,450,50,0.5,0.5,0,c_white,1)
                        }
                    else
                        {draw_circle_colour(450,120,30,make_colour_rgb(68,95,198),make_colour_rgb(68,95,198),false)
                        draw_sprite_ext(ico_difesa_bianco,0,450,120,0.5,0.5,0,c_white,1)
                        }
                }}}}
//il coso iniziale
draw_set_colour(c_black)
draw_set_alpha(fogalpha)
if fogalpha>0
draw_rectangle(0,0,view_wview[0],view_hview[0],false)
