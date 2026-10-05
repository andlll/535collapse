// idle_clicker — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/idle_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1
    {draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wport[0]-90,100,view_wport[0]-20,200,60,60,c_white,c_white,false)
    draw_set_alpha(1)
    draw_sprite_ext(ico_idle,0,view_wport[0]-55,135,0.7,0.7,0,c_white,1)
    draw_set_halign(fa_center)
    draw_text(view_wport[0]-55,170,global.idle)
    }
