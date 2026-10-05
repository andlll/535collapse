// hint_create — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_create.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.resourcehint=1
arm=0
alarm[0]=10
titolo="Units creation"
testo="Some structures can create units. When you click on those structures a menu will appear on the top of the screen. Creating units consumes resources." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,centro).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,centro).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
