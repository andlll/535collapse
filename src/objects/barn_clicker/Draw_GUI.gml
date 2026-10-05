// barn_clicker — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/barn_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1 || active=1
{draw_set_alpha(0.69)
draw_roundrect_colour_ext(20,view_hport[0]-150,340,view_hport[0]-20,60,60,c_white,c_white,false)
draw_set_alpha(0.7)
draw_set_halign(fa_left)
draw_text(40,view_hport[0]-120,"Windmill")
draw_set_font(overdue)
draw_text(40,view_hport[0]-90,"Deposit for the food resource.")
draw_set_font(GUI_1)
draw_text(40,view_hport[0]-50,"60")
draw_set_alpha(1)
draw_sprite(ico_wood,0,90,view_hport[0]-50)
draw_set_alpha(0.7)
draw_set_halign(fa_right)
draw_text(320,view_hport[0]-120,"Shortcut: E")
draw_set_alpha(0.99)
draw_circle_colour(590,50,30,c_white,c_white,false)
draw_set_alpha(1)
draw_sprite_ext(ico_barn,0,590,50,0.5,0.5,0,c_white,1)
}
