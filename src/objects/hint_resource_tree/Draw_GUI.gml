// hint_resource_tree — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/hint_resource_tree.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.hint=1
    {if hover=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(posx,posy,posx+380,posy+testo_h+68,60,60,c_white,c_white,false)
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_valign(fa_bottom)
    draw_set_halign(fa_left)
    draw_set_alpha(0.75)
    draw_text(posx+20,posy+38,titolo)
    draw_set_valign(fa_top)
    draw_set_font(overdue)
    draw_text_ext(posx+20,posy+43,testo,30,340)
    draw_set_font(GUI_1)
    draw_set_valign(fa_middle)
    draw_set_alpha(1)}
