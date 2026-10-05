// hint_campi — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_campi.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Farms - Food resource"
testo="Right click on a farm with a worker selected to start collecting food. If you click with multiple workers, they will reallocatein free farms. Food will be stored in barns."
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
vicino=instance_nearest(mouse_x,mouse_y,campo)
posx=vicino.x/global.scaleview-view_xview[0]/global.scaleview
posy=vicino.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
