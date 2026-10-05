// enemy_cavaliere — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/enemy_cavaliere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
if global.sel<2
    {
    draw_set_alpha(0.69)
    draw_roundrect_colour_ext(260,20,390,150,60,60,c_white,c_white,false)
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_alpha(0.75)
    draw_set_valign(fa_middle)
    draw_set_halign(fa_center)
    draw_text(325,120,life+" / "+slife)
    draw_set_alpha(1)
    draw_sprite(ico_cavaliere,0,325,70)}
