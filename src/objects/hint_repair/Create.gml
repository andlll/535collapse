// hint_repair — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_repair.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.resourcehint=1
arm=0
alarm[0]=10
titolo="Repairing buildings"
testo="The more workers you use on a construction site the faster the building will grow. You can also right click with workers selected ona damaged building to stop fires and to repair it from damages." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,ally_omino).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,ally_omino).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
