// hint_oro — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_oro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Mines - Gold resource"
testo="Right click on a mine with workers selected to start collecting gold. Workers will then store the resource in warehouses." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,miniera_oro).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,miniera_oro).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
