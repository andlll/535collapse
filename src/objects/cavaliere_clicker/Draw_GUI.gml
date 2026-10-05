// cavaliere_clicker — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/cavaliere_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1
{draw_set_alpha(0.69)
draw_roundrect_colour_ext(20,view_hport[0]-150,370,view_hport[0]-20,60,60,c_white,c_white,false)
draw_set_alpha(0.7)
draw_set_halign(fa_left)
draw_text(40,view_hport[0]-120,"Knight")
draw_set_font(overdue)
draw_text(40,view_hport[0]-90,"Fast unit, great against archers.")
draw_set_font(GUI_1)
draw_text(40,view_hport[0]-50,"50")
draw_text(120,view_hport[0]-50,"70")
draw_text(200,view_hport[0]-50,"3")
draw_set_alpha(1)
draw_sprite(ico_food,0,90,view_hport[0]-50)
draw_sprite(ico_gold,0,170,view_hport[0]-50)
draw_sprite_ext(ico_multi,0,230,view_hport[0]-50,0.5,0.5,0,c_white,1)
draw_set_alpha(0.7)
draw_set_halign(fa_right)
draw_text(350,view_hport[0]-120,"Shortcut: Q")
draw_set_alpha(0.99)
draw_circle_colour(450,50,30,c_white,c_white,false)
draw_set_alpha(1)
draw_sprite_ext(ico_cavaliere,0,450,50,0.7,0.7,0,c_white,1)
}
