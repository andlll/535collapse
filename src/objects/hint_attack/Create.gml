// hint_attack — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_attack.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Attacking enemies"
testo="With military units selected right click on enemy units to order your soldiers to engage in combat with them." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
vicino=instance_nearest(mouse_x,mouse_y,enemy_unit)
posx=vicino.x/global.scaleview-view_xview[0]/global.scaleview
posy=vicino.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
