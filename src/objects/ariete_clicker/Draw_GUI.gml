// ariete_clicker — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/ariete_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1
{draw_set_alpha(0.69)
draw_roundrect_colour_ext(20,view_hport[0]-150,400,view_hport[0]-20,60,60,c_white,c_white,false)
draw_set_alpha(0.7)
draw_set_halign(fa_left)
draw_text(40,view_hport[0]-120,"Siege Ram")
draw_set_font(overdue)
draw_text(40,view_hport[0]-90,"Siege melee unit great against stone buildings.")
draw_set_font(GUI_1)
draw_text(40,view_hport[0]-50,"250")
draw_text(130,view_hport[0]-50,"60")
draw_text(210,view_hport[0]-50,"3")
draw_set_alpha(1)
draw_sprite(ico_wood,0,90,view_hport[0]-50)
draw_sprite(ico_gold,0,170,view_hport[0]-50)
draw_sprite_ext(ico_multi,0,240,view_hport[0]-50,0.5,0.5,0,c_white,1)
draw_set_alpha(0.7)
draw_set_halign(fa_right)
draw_text(380,view_hport[0]-120,"Shortcut: Q")
draw_set_alpha(0.99)
draw_circle_colour(450,50,30,c_white,c_white,false)
draw_set_alpha(1)
draw_sprite_ext(ico_ariete,0,450,50,0.7,0.7,0,c_white,1)
}
