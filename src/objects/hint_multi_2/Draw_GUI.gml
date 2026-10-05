// hint_multi_2 — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/hint_multi_2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///disegna
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

// --- azione 2: execute code ---
if global.hint=1
    {draw_set_alpha(0.49)
    draw_roundrect_colour_ext(x,y,x+550,y+258,80,80,c_white,c_white,false)
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_valign(fa_bottom)
    draw_set_halign(fa_left)
    draw_set_alpha(0.75)
    draw_text(x+40,y+58,"Multiple selection")
    draw_set_font(overdue)
    draw_text(x+40,y+108,"Ctrl + left click to add units to selection")
    draw_text(x+40,y+148,"Alt + left click to remove units from selection")
    draw_text(x+40,y+188,"Ctrl + numbers (digits) to assign a quick")
    draw_text(x+40,y+228,"selection number to a group.")
    draw_set_font(GUI_1)
    draw_set_valign(fa_middle)
    draw_set_alpha(1)}
