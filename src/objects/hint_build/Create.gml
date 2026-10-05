// hint_build — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_build.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.resourcehint=1
arm=0
alarm[0]=10
titolo="Buildings"
testo="Your workers can also build structures to expand your town. While a worker is selected, choose from a building on the top left of your screen and place it in an empty space. This is possible only if you have the amount of resources needed." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,ally_omino).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,ally_omino).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
