// attacco_clicker — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/attacco_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1
    {draw_set_alpha(0.69)
    draw_roundrect_colour_ext(20,view_hport[0]-150,340,view_hport[0]-20,60,60,c_white,c_white,false)
    draw_set_alpha(0.7)
    draw_set_halign(fa_left)
    draw_text(40,view_hport[0]-120,"Aggressive")
    draw_set_font(overdue)
    draw_set_valign(fa_top)
    draw_text_ext(40,view_hport[0]-90,"Military units engage enemy units in a fight at a greater distance.",30,280)
    draw_set_valign(fa_center)
    draw_set_font(GUI_1)
    draw_set_halign(fa_right)
    draw_text(320,view_hport[0]-120,"Shortcut: Q")
    draw_set_alpha(0.99)
    draw_circle_colour(450,50,30,c_white,c_white,false)
    draw_set_alpha(1)
    draw_sprite_ext(ico_attacco,0,450,50,0.5,0.5,0,c_white,1)
    }
