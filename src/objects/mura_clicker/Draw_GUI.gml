// mura_clicker — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/mura_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1 || active=1
{draw_set_alpha(0.69)
draw_roundrect_colour_ext(20,view_hport[0]-150,630,view_hport[0]-20,60,60,c_white,c_white,false)
draw_set_alpha(0.7)
draw_set_halign(fa_left)
draw_text(40,view_hport[0]-120,"Wall")
draw_set_font(overdue)
draw_text(40,view_hport[0]-90,"Structure that can be built in both directions. Press C to rotate while placing.")
draw_set_font(GUI_1)
draw_text(40,view_hport[0]-50,"50")
draw_set_alpha(1)
draw_sprite(ico_stone,0,90,view_hport[0]-50)
draw_set_alpha(0.7)
draw_set_halign(fa_right)
draw_text(620,view_hport[0]-120,"Shortcut: S")
draw_set_alpha(0.99)
draw_circle_colour(520,120,30,c_white,c_white,false)
draw_set_alpha(1)
draw_sprite_ext(ico_mura,0,520,120,0.5,0.5,0,c_white,1)
}
