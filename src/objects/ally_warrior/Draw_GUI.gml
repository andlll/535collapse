// ally_warrior — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/ally_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
if global.sel<2
{
draw_set_alpha(0.69)
draw_roundrect_colour_ext(260,20,390,150,60,60,c_white,c_white,false)
draw_circle_colour(450,50,30,c_white,c_white,false)
draw_circle_colour(450,120,30,c_white,c_white,false)
draw_set_font(GUI_1)
draw_set_colour(c_black)
draw_set_alpha(0.75)
draw_set_valign(fa_middle)
draw_set_halign(fa_center)
draw_text(325,120,life+" / "+slife)
draw_set_alpha(1)
draw_sprite(ico_guerriero,0,325,70)
draw_sprite_ext(ico_attacco,0,450,50,0.5,0.5,0,c_white,1)
draw_sprite_ext(ico_difesa,0,450,120,0.5,0.5,0,c_white,1)
{if comp>=300
{draw_circle_colour(450,50,30,make_colour_rgb(183,48,48),make_colour_rgb(183,48,48),false)
draw_sprite_ext(ico_attacco_bianco,0,450,50,0.5,0.5,0,c_white,1)
}
if comp=50
{draw_circle_colour(450,120,30,make_colour_rgb(68,95,198),make_colour_rgb(68,95,198),false)
draw_sprite_ext(ico_difesa_bianco,0,450,120,0.5,0.5,0,c_white,1)
}
}}
