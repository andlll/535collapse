// hint_fire_2 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_fire_2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Not on fire"
testo="Stone buildings (towers, walls, castles) cannot be set on fire, so you will need warmachines like catapults or siege rams in order to destroy them." 
draw_set_font(overdue)
arm=0
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
vicino=instance_nearest(mouse_x,mouse_y,enemy_build)
posx=vicino.x/global.scaleview-view_xview[0]/global.scaleview
posy=vicino.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
alarm[0]=10
