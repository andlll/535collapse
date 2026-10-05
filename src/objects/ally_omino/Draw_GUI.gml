// ally_omino — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Disegna icone su interfaccia grafica
if selected=1
if global.sel<2
    {
    draw_set_alpha(0.69)
    draw_roundrect_colour_ext(260,20,390,150,60,60,c_white,c_white,false)
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
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_alpha(0.75)
    draw_set_valign(fa_middle)
    draw_set_halign(fa_center)
    draw_text(325,120,life+" / "+slife)
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
    draw_sprite_ext(ico_chiesa,0,730,50,0.5,0.5,0,c_white,1)
    if gold=0 && wood=0 && food=0 && stone=0
    draw_sprite(ico_omino,0,325,70)
    else
    draw_sprite_ext(ico_omino,0,355,70,0.8,0.8,0,c_white,1)
    if food>0
        {draw_sprite_ext(ico_food,0,295,55,1,1,0,c_white,1)
        draw_set_alpha(0.75)
        draw_text(295,85,food)
        draw_set_alpha(1)}
    if gold>0
        {draw_sprite_ext(ico_gold,0,295,55,1,1,0,c_white,1)
        draw_set_alpha(0.75)
        draw_text(295,85,gold)
        draw_set_alpha(1)}
    if wood>0
        {draw_sprite_ext(ico_wood,0,295,55,1,1,0,c_white,1)
        draw_set_alpha(0.75)
        draw_text(295,85,wood)
        draw_set_alpha(1)}
    if stone>0
        {draw_sprite_ext(ico_stone,0,295,55,1,1,0,c_white,1)
        draw_set_alpha(0.75)
        draw_text(295,85,stone)
        draw_set_alpha(1)}}
