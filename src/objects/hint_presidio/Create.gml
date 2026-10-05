// hint_presidio — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_presidio.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Garrison"
testo="Towers and castles can shoot arrows if you move archers inside it. More archers inside equals more arrows."
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,castello).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,castello).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
