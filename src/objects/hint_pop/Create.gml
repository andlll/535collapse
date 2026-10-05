// hint_pop — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_pop.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Houses - Population"
testo="Creating units requires population resource to be below its total capacity. Build more houses to increase the population capacity." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,casa).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,casa).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
