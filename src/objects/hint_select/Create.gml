// hint_select — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_select.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Selection and movement"
testo="Left click on a unit to select it. Left click on an empty point on the map to clear the selection. While a unit is selected right click anywhere to move the unit in that direction." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,ally_unit).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,ally_unit).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
