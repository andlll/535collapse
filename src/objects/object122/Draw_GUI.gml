// object122 — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/object122.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if hover=1
{draw_set_alpha(0.49)
draw_roundrect_colour_ext(20,view_hview[0]-150,540,view_hview[0]-20,80,80,c_white,c_white,false)
draw_set_alpha(0.7)
draw_set_halign(fa_left)
draw_text(50,view_hview[0]-120,"Warrior")
draw_text(50,view_hview[0]-70,"75")
draw_text(150,view_hview[0]-70,"35")
draw_set_alpha(1)
draw_sprite(ico_food,0,120,view_hview[0]-70)
draw_sprite(ico_gold,0,225,view_hview[0]-70)
draw_set_alpha(0.7)
draw_set_halign(fa_right)
draw_text(510,view_hview[0]-120,"Shortcut: Q")
draw_set_alpha(1)
draw_set_halign(fa_left)}
