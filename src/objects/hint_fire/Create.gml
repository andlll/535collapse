// hint_fire — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_fire.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="On fire!"
testo="With infantry units selected (warriors and spearmen) right click on an enemy buildingto order your soldiers to set it on fire." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
vicino=instance_nearest(mouse_x,mouse_y,enemy_build)
posx=vicino.x/global.scaleview-view_xview[0]/global.scaleview
posy=vicino.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
