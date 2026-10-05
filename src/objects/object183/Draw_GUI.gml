// object183 — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/object183.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
{
draw_set_alpha(0.49)
draw_roundrect_colour_ext(360,20,540,190,80,80,c_white,c_white,false)
draw_set_font(GUI_1)
draw_set_colour(c_black)
draw_set_alpha(0.75)
draw_set_valign(fa_middle)
draw_set_halign(fa_center)
draw_text(450,140,life+" / "+slife)
draw_set_alpha(1)
draw_sprite(ico_casa,0,450,70)}
